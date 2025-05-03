
import pandas as pd
import numpy as np
import re
import duckdb
from datetime import datetime
import tempfile
import os
import boto3
from werkzeug.utils import secure_filename
from io import StringIO, BytesIO

def detect_column_types(df):
    """
    Analyze DataFrame columns and detect appropriate data types.
    """
    schema = []
    
    for column in df.columns:
        col_data = df[column]
        col_info = {
            'name': column,
            'original_type': str(col_data.dtype),
            'nullable': col_data.isna().any()
        }
        
        # Try to infer more precise types
        non_null_values = col_data.dropna()
        
        if len(non_null_values) == 0:
            col_info['suggested_type'] = 'string'
        elif pd.api.types.is_numeric_dtype(col_data):
            if pd.api.types.is_integer_dtype(col_data) or all(v.is_integer() for v in non_null_values if not pd.isna(v)):
                col_info['suggested_type'] = 'integer'
            else:
                col_info['suggested_type'] = 'float'
        elif pd.api.types.is_datetime64_dtype(col_data):
            col_info['suggested_type'] = 'timestamp'
        elif _is_date(non_null_values):
            col_info['suggested_type'] = 'date'
        elif _is_boolean(non_null_values):
            col_info['suggested_type'] = 'boolean'
        else:
            col_info['suggested_type'] = 'string'
            
            # Check if it's a categorical column
            if len(non_null_values.unique()) < min(10, len(non_null_values) * 0.1):
                col_info['suggested_type'] = 'categorical'
        
        schema.append(col_info)
    
    return schema

def _is_date(series):
    """Check if a series contains date-like strings."""
    if len(series) == 0:
        return False
    
    # Sample up to 100 values
    sample = series.sample(min(100, len(series)))
    
    # Common date patterns
    date_patterns = [
        r'^\d{4}-\d{2}-\d{2}$',  # YYYY-MM-DD
        r'^\d{2}/\d{2}/\d{4}$',  # MM/DD/YYYY
        r'^\d{2}-\d{2}-\d{4}$',  # DD-MM-YYYY
        r'^\d{4}/\d{2}/\d{2}$',  # YYYY/MM/DD
        r'^\d{1,2}\s+[A-Za-z]{3}\s+\d{4}$'  # 1 Jan 2020
    ]
    
    # Check if most values match a date pattern
    match_count = 0
    for value in sample:
        if isinstance(value, str):
            if any(re.match(pattern, value) for pattern in date_patterns):
                match_count += 1
    
    # Return True if at least 90% of samples match a date pattern
    return match_count >= 0.9 * len(sample)

def _is_boolean(series):
    """Check if a series contains boolean-like values."""
    if len(series) == 0:
        return False
    
    # Convert to lowercase strings for checking
    str_values = [str(v).lower() for v in series]
    
    # Common boolean representations
    true_values = ['true', 't', 'yes', 'y', '1']
    false_values = ['false', 'f', 'no', 'n', '0']
    
    # Check if all values are typical boolean representations
    return all(v in true_values + false_values for v in str_values)

def detect_pii_columns(df):
    """
    Detect potential PII columns based on column names and pattern matching.
    More sophisticated detection could use NLP/ML techniques.
    """
    pii_columns = []
    
    # Common PII indicators in column names
    pii_keywords = [
        'name', 'email', 'phone', 'address', 'zip', 'postal', 'ssn', 'social',
        'birth', 'dob', 'credit', 'card', 'passport', 'license', 'gender',
        'nationality', 'account', 'password', 'username', 'ip', 'location'
    ]
    
    for column in df.columns:
        column_lower = column.lower()
        
        # Check if column name contains PII keywords
        if any(keyword in column_lower for keyword in pii_keywords):
            pii_columns.append(column)
            continue
        
        # Sample data to check for patterns
        sample = df[column].dropna().astype(str).head(100)
        
        # Check for email pattern
        if column_lower.find('email') >= 0 or any('@' in str(val) and '.' in str(val).split('@')[-1] for val in sample):
            pii_columns.append(column)
        
        # Check for phone number pattern
        elif any(re.search(r'\d{3}[- .]?\d{3}[- .]?\d{4}', str(val)) for val in sample):
            pii_columns.append(column)
        
        # Check for SSN pattern
        elif any(re.search(r'\d{3}[- ]?\d{2}[- ]?\d{4}', str(val)) for val in sample):
            pii_columns.append(column)
    
    return pii_columns

def process_file(file, file_type=None):
    """
    Process an uploaded file into a pandas DataFrame.
    """
    if file_type is None:
        # Guess file type from extension
        filename = file.filename.lower()
        if filename.endswith('.csv'):
            file_type = 'csv'
        elif filename.endswith(('.xls', '.xlsx')):
            file_type = 'excel'
        elif filename.endswith('.json'):
            file_type = 'json'
        elif filename.endswith('.parquet'):
            file_type = 'parquet'
        else:
            raise ValueError(f"Unsupported file type: {filename}")
    
    # Parse file
    if file_type == 'csv':
        # Try to auto-detect delimiter
        sample = file.read(4096)
        file.seek(0)
        
        if b'\t' in sample:
            delimiter = '\t'
        elif b';' in sample:
            delimiter = ';'
        else:
            delimiter = ','
            
        try:
            df = pd.read_csv(file, delimiter=delimiter)
        except Exception:
            # Try with different encoding
            file.seek(0)
            df = pd.read_csv(file, delimiter=delimiter, encoding='latin1')
    
    elif file_type == 'excel':
        df = pd.read_excel(file)
    
    elif file_type == 'json':
        df = pd.read_json(file)
    
    elif file_type == 'parquet':
        df = pd.read_parquet(file)
    
    else:
        raise ValueError(f"Unsupported file type: {file_type}")
    
    return df

def save_to_duckdb(df, db_path=None, table_name=None):
    """
    Save a DataFrame to DuckDB, either in-memory or to a file.
    """
    if db_path is None:
        # Use in-memory database
        conn = duckdb.connect(database=':memory:')
    else:
        conn = duckdb.connect(database=db_path, read_only=False)
    
    if table_name is None:
        table_name = f"table_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    
    # Register DataFrame as a table
    conn.register('df_view', df)
    conn.execute(f"CREATE TABLE {table_name} AS SELECT * FROM df_view")
    
    # Return metadata about the table
    result = conn.execute(f"PRAGMA table_info({table_name})").fetchall()
    columns = [{'name': r[1], 'type': r[2], 'nullable': not r[3]} for r in result]
    
    row_count = conn.execute(f"SELECT COUNT(*) FROM {table_name}").fetchone()[0]
    
    return {
        'table_name': table_name,
        'columns': columns,
        'row_count': row_count,
        'connection': conn  # Return connection for further queries
    }

def save_to_s3(df, bucket, key, format='parquet'):
    """
    Save DataFrame to S3 in specified format.
    """
    s3_client = boto3.client('s3')
    
    if format == 'csv':
        buffer = StringIO()
        df.to_csv(buffer, index=False)
        s3_client.put_object(
            Bucket=bucket,
            Key=key,
            Body=buffer.getvalue()
        )
    
    elif format == 'parquet':
        buffer = BytesIO()
        df.to_parquet(buffer, index=False)
        s3_client.put_object(
            Bucket=bucket,
            Key=key,
            Body=buffer.getvalue()
        )
    
    elif format == 'json':
        buffer = StringIO()
        df.to_json(buffer, orient='records')
        s3_client.put_object(
            Bucket=bucket,
            Key=key,
            Body=buffer.getvalue()
        )
    
    else:
        raise ValueError(f"Unsupported format: {format}")
    
    return {
        'bucket': bucket,
        'key': key,
        'format': format,
        'row_count': len(df),
        'column_count': len(df.columns)
    }

def clean_column_names(df):
    """
    Clean column names to be SQL-friendly.
    """
    # Replace spaces and special chars with underscores
    cleaned = {col: re.sub(r'[^a-zA-Z0-9]', '_', col).lower() for col in df.columns}
    
    # Handle duplicate column names after cleaning
    seen = set()
    for original, cleaned_name in cleaned.items():
        if cleaned_name in seen:
            counter = 1
            while f"{cleaned_name}_{counter}" in seen:
                counter += 1
            cleaned[original] = f"{cleaned_name}_{counter}"
        seen.add(cleaned[original])
    
    return df.rename(columns=cleaned)

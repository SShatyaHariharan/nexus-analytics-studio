
import pandas as pd
import numpy as np
from sqlalchemy import create_engine, text
import duckdb
from backend.models import Dataset, DataSource

class DataProcessor:
    def __init__(self, dataset_id=None, data_source=None):
        self.dataset_id = dataset_id
        self.data_source = data_source
        self.connection = None
        self.engine = None
    
    def connect_to_source(self, data_source=None):
        """Connect to the specified data source."""
        if data_source:
            self.data_source = data_source
        
        if not self.data_source:
            raise ValueError("No data source specified")
        
        source_type = self.data_source.type
        conn_params = self.data_source.connection_params
        
        if source_type == 'postgresql':
            connection_string = f"postgresql://{conn_params.get('user')}:{conn_params.get('password')}@{conn_params.get('host')}:{conn_params.get('port', 5432)}/{conn_params.get('database')}"
            self.engine = create_engine(connection_string)
            self.connection = self.engine.connect()
        
        elif source_type == 'mysql':
            connection_string = f"mysql+pymysql://{conn_params.get('user')}:{conn_params.get('password')}@{conn_params.get('host')}:{conn_params.get('port', 3306)}/{conn_params.get('database')}"
            self.engine = create_engine(connection_string)
            self.connection = self.engine.connect()
        
        elif source_type == 'duckdb':
            db_path = conn_params.get('path', ':memory:')
            self.connection = duckdb.connect(database=db_path)
        
        else:
            raise ValueError(f"Unsupported data source type: {source_type}")
        
        return self.connection
    
    def execute_query(self, query, params=None):
        """Execute a query against the connected data source."""
        if not self.connection:
            raise RuntimeError("Not connected to a data source")
        
        if isinstance(self.connection, duckdb.DuckDBPyConnection):
            # DuckDB connection
            if params:
                result = self.connection.execute(query, params).fetchdf()
            else:
                result = self.connection.execute(query).fetchdf()
        else:
            # SQLAlchemy connection
            if params:
                result = pd.read_sql(text(query), self.connection, params=params)
            else:
                result = pd.read_sql(text(query), self.connection)
        
        return result
    
    def close(self):
        """Close the connection."""
        if self.connection and not isinstance(self.connection, duckdb.DuckDBPyConnection):
            self.connection.close()
            self.engine.dispose()
    
    def get_dataset_data(self, dataset=None, limit=1000, filters=None):
        """
        Get data for a dataset with optional filtering.
        """
        if dataset:
            self.dataset = dataset
        elif self.dataset_id:
            # Fetch dataset from database
            self.dataset = Dataset.query.get(self.dataset_id)
        
        if not self.dataset:
            raise ValueError("No dataset specified")
        
        # Connect to the data source if not already connected
        if not self.data_source:
            self.data_source = DataSource.query.get(self.dataset.source_id)
        
        if not self.connection:
            self.connect_to_source()
        
        # Build query from dataset definition
        if self.dataset.query:
            base_query = self.dataset.query
            
            # Wrap in a subquery to apply limit and filters
            query = f"SELECT * FROM ({base_query}) as subq"
            
            # Add filters
            if filters:
                where_clauses = []
                params = {}
                
                for idx, (column, operator, value) in enumerate(filters):
                    param_name = f"param_{idx}"
                    
                    if operator == '=':
                        where_clauses.append(f"{column} = :{param_name}")
                    elif operator == '!=':
                        where_clauses.append(f"{column} != :{param_name}")
                    elif operator == '>':
                        where_clauses.append(f"{column} > :{param_name}")
                    elif operator == '<':
                        where_clauses.append(f"{column} < :{param_name}")
                    elif operator == 'in':
                        where_clauses.append(f"{column} IN :{param_name}")
                    elif operator == 'like':
                        where_clauses.append(f"{column} LIKE :{param_name}")
                    
                    params[param_name] = value
                
                if where_clauses:
                    query += " WHERE " + " AND ".join(where_clauses)
            
            # Add limit
            query += f" LIMIT {limit}"
            
            # Execute query
            if filters:
                df = self.execute_query(query, params)
            else:
                df = self.execute_query(query)
            
        elif self.dataset.table_name:
            # Direct table query
            query = f"SELECT * FROM {self.dataset.table_name}"
            
            # Add filters
            if filters:
                where_clauses = []
                params = {}
                
                for idx, (column, operator, value) in enumerate(filters):
                    param_name = f"param_{idx}"
                    
                    if operator == '=':
                        where_clauses.append(f"{column} = :{param_name}")
                    elif operator == '!=':
                        where_clauses.append(f"{column} != :{param_name}")
                    elif operator == '>':
                        where_clauses.append(f"{column} > :{param_name}")
                    elif operator == '<':
                        where_clauses.append(f"{column} < :{param_name}")
                    elif operator == 'in':
                        where_clauses.append(f"{column} IN :{param_name}")
                    elif operator == 'like':
                        where_clauses.append(f"{column} LIKE :{param_name}")
                    
                    params[param_name] = value
                
                if where_clauses:
                    query += " WHERE " + " AND ".join(where_clauses)
            
            # Add limit
            query += f" LIMIT {limit}"
            
            # Execute query
            if filters:
                df = self.execute_query(query, params)
            else:
                df = self.execute_query(query)
            
        else:
            raise ValueError("Dataset has no query or table definition")
        
        return df
    
    def get_aggregated_data(self, dataset=None, dimensions=None, metrics=None, filters=None):
        """
        Get aggregated data for charts.
        
        Parameters:
        - dimensions: List of columns to group by
        - metrics: Dictionary mapping column names to aggregation functions
        - filters: List of tuples (column, operator, value)
        """
        if dataset:
            self.dataset = dataset
        elif self.dataset_id:
            # Fetch dataset from database
            self.dataset = Dataset.query.get(self.dataset_id)
        
        if not self.dataset:
            raise ValueError("No dataset specified")
        
        # Connect to the data source if not already connected
        if not self.data_source:
            self.data_source = DataSource.query.get(self.dataset.source_id)
        
        if not self.connection:
            self.connect_to_source()
        
        # Build query with aggregations
        if self.dataset.query:
            base_query = f"({self.dataset.query}) as subq"
        elif self.dataset.table_name:
            base_query = self.dataset.table_name
        else:
            raise ValueError("Dataset has no query or table definition")
        
        # Construct SELECT clause
        select_parts = []
        
        # Add dimensions to SELECT
        if dimensions:
            for dim in dimensions:
                select_parts.append(dim)
        
        # Add metrics with aggregations to SELECT
        if metrics:
            for col, agg_func in metrics.items():
                select_parts.append(f"{agg_func}({col}) as {col}_{agg_func}")
        
        if not select_parts:
            raise ValueError("No dimensions or metrics specified")
        
        select_clause = ", ".join(select_parts)
        
        # Construct FROM clause
        from_clause = base_query
        
        # Construct WHERE clause
        where_clause = ""
        params = {}
        
        if filters:
            where_parts = []
            
            for idx, (column, operator, value) in enumerate(filters):
                param_name = f"param_{idx}"
                
                if operator == '=':
                    where_parts.append(f"{column} = :{param_name}")
                elif operator == '!=':
                    where_parts.append(f"{column} != :{param_name}")
                elif operator == '>':
                    where_parts.append(f"{column} > :{param_name}")
                elif operator == '<':
                    where_parts.append(f"{column} < :{param_name}")
                elif operator == 'in':
                    where_parts.append(f"{column} IN :{param_name}")
                elif operator == 'like':
                    where_parts.append(f"{column} LIKE :{param_name}")
                
                params[param_name] = value
            
            if where_parts:
                where_clause = "WHERE " + " AND ".join(where_parts)
        
        # Construct GROUP BY clause
        group_by_clause = ""
        if dimensions:
            group_by_clause = "GROUP BY " + ", ".join(dimensions)
        
        # Assemble the full query
        query_parts = ["SELECT", select_clause, "FROM", from_clause]
        
        if where_clause:
            query_parts.append(where_clause)
        
        if group_by_clause:
            query_parts.append(group_by_clause)
        
        query = " ".join(query_parts)
        
        # Execute query
        if filters:
            df = self.execute_query(query, params)
        else:
            df = self.execute_query(query)
        
        return df

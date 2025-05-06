import pandas as pd
import os
import traceback
import sqlparse
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy.exc import SQLAlchemyError
from backend.app import db, cache
from backend.models import User, Dataset, DataSource
from backend.utils.data_processor import DataProcessor

datasets_bp = Blueprint('datasets', __name__)

@datasets_bp.route('/', methods=['GET'])
@jwt_required()
@cache.cached(timeout=60, key_prefix='datasets')
def get_datasets():
    # Get query parameters for pagination and filtering
    page = request.args.get('page', 1, type=int)
    per_page = min(request.args.get('per_page', 20, type=int), 100)
    
    try:
        # Get all datasets without using query.all()
        # Using db.session.query instead which is more reliable
        datasets = db.session.query(Dataset).all()
        
        # Manual pagination
        total = len(datasets)
        start_idx = (page - 1) * per_page
        end_idx = start_idx + per_page
        
        # Slice the results
        paginated_datasets = datasets[start_idx:end_idx]
        
        # Calculate total pages
        total_pages = (total + per_page - 1) // per_page
        
        # Return paginated results
        return jsonify({
            'data': [dataset.to_dict() for dataset in paginated_datasets],
            'total': total,
            'pages': total_pages,
            'page': page,
            'per_page': per_page
        }), 200
    except Exception as e:
        current_app.logger.error(f"Error fetching datasets: {str(e)}")
        return jsonify({'message': f'Error fetching datasets: {str(e)}'}), 500

@datasets_bp.route('/<dataset_id>', methods=['GET'])
@jwt_required()
@cache.cached(timeout=60, key_prefix=lambda: f'dataset_{request.view_args["dataset_id"]}')
def get_dataset(dataset_id):
    dataset = Dataset.query.get(dataset_id)
    
    if not dataset:
        return jsonify({'message': 'Dataset not found'}), 404
    
    return jsonify(dataset.to_dict()), 200

@datasets_bp.route('/', methods=['POST'])
@jwt_required()
def create_dataset():
    current_user_id = get_jwt_identity()
    data = request.json
    
    # Validate required fields
    if not data.get('name') or not data.get('source_id'):
        return jsonify({'message': 'Name and source_id are required'}), 400
    
    # Check if the data source exists
    source = DataSource.query.get(data.get('source_id'))
    if not source:
        return jsonify({'message': 'Data source not found'}), 404
    
    # If SQL query is provided, validate it
    if data.get('query'):
        try:
            # Parse SQL to check syntax
            parsed = sqlparse.parse(data.get('query'))
            if not parsed:
                return jsonify({'message': 'Invalid SQL query'}), 400
                
            # Check if it's a SELECT query
            statement = parsed[0]
            if statement.get_type() != 'SELECT':
                return jsonify({'message': 'Only SELECT queries are allowed'}), 400
        except Exception as e:
            return jsonify({'message': f'Error parsing SQL query: {str(e)}'}), 400
    
    # Create new dataset
    new_dataset = Dataset(
        name=data.get('name'),
        description=data.get('description'),
        source_id=data.get('source_id'),
        schema=data.get('schema'),
        query=data.get('query'),
        table_name=data.get('table_name'),
        tags=data.get('tags'),
        pii_columns=data.get('pii_columns'),
        created_by=current_user_id
    )
    
    db.session.add(new_dataset)
    db.session.commit()
    
    # Invalidate cache
    cache.delete('datasets')
    
    return jsonify(new_dataset.to_dict()), 201

@datasets_bp.route('/<dataset_id>', methods=['PUT'])
@jwt_required()
def update_dataset(dataset_id):
    current_user_id = get_jwt_identity()
    data = request.json
    
    dataset = Dataset.query.get(dataset_id)
    if not dataset:
        return jsonify({'message': 'Dataset not found'}), 404
    
    # If SQL query is updated, validate it
    if 'query' in data:
        try:
            # Parse SQL to check syntax
            parsed = sqlparse.parse(data.get('query'))
            if not parsed:
                return jsonify({'message': 'Invalid SQL query'}), 400
                
            # Check if it's a SELECT query
            statement = parsed[0]
            if statement.get_type() != 'SELECT':
                return jsonify({'message': 'Only SELECT queries are allowed'}), 400
        except Exception as e:
            return jsonify({'message': f'Error parsing SQL query: {str(e)}'}), 400
    
    # Update fields
    if 'name' in data:
        dataset.name = data.get('name')
    if 'description' in data:
        dataset.description = data.get('description')
    if 'query' in data:
        dataset.query = data.get('query')
    if 'table_name' in data:
        dataset.table_name = data.get('table_name')
    if 'schema' in data:
        dataset.schema = data.get('schema')
    if 'tags' in data:
        dataset.tags = data.get('tags')
    if 'pii_columns' in data:
        dataset.pii_columns = data.get('pii_columns')
    
    db.session.commit()
    
    # Invalidate cache
    cache.delete('datasets')
    cache.delete(f'dataset_{dataset_id}')
    
    return jsonify(dataset.to_dict()), 200

@datasets_bp.route('/<dataset_id>', methods=['DELETE'])
@jwt_required()
def delete_dataset(dataset_id):
    current_user_id = get_jwt_identity()
    
    dataset = Dataset.query.get(dataset_id)
    if not dataset:
        return jsonify({'message': 'Dataset not found'}), 404
    
    db.session.delete(dataset)
    db.session.commit()
    
    # Invalidate cache
    cache.delete('datasets')
    cache.delete(f'dataset_{dataset_id}')
    
    return jsonify({'message': 'Dataset deleted successfully'}), 200

@datasets_bp.route('/<dataset_id>/preview', methods=['GET'])
@jwt_required()
@cache.cached(timeout=120, key_prefix=lambda: f'dataset_preview_{request.view_args["dataset_id"]}')
def preview_dataset(dataset_id):
    # Optional parameter for limiting rows
    limit = min(request.args.get('limit', 100, type=int), 1000)
    
    dataset = Dataset.query.get(dataset_id)
    if not dataset:
        return jsonify({'message': 'Dataset not found'}), 404
    
    try:
        # Get the data source
        source = DataSource.query.get(dataset.source_id)
        if not source:
            return jsonify({'message': 'Data source not found'}), 404
        
        # Process based on source type and dataset definition
        if source.type == 'file' and source.connection_params and 'file_path' in source.connection_params:
            file_path = source.connection_params['file_path']
            if not os.path.exists(file_path):
                return jsonify({'message': 'File not found'}), 404
            
            file_type = source.connection_params.get('file_type', 'csv')
            
            # Read the file
            if file_type == 'csv':
                df = pd.read_csv(file_path)
            elif file_type in ['xls', 'xlsx']:
                df = pd.read_excel(file_path)
            elif file_type == 'json':
                df = pd.read_json(file_path)
            else:
                return jsonify({'message': 'Unsupported file type'}), 400
            
            # Apply query if present
            if dataset.query:
                processor = DataProcessor()
                df = processor.process_query(df, dataset.query)
            
            # Apply limit
            df = df.head(limit)
            
            # Return data
            data = {
                'columns': df.columns.tolist(),
                'rows': df.values.tolist(),
                'total_rows': len(df)
            }
            
            return jsonify(data), 200
        else:
            return jsonify({'message': 'Preview not available for this data source type'}), 400
    
    except Exception as e:
        traceback.print_exc()
        return jsonify({'message': f'Error previewing dataset: {str(e)}'}), 500

@datasets_bp.route('/execute-query', methods=['POST'])
@jwt_required()
def execute_query():
    data = request.json
    
    if not data.get('source_id'):
        return jsonify({'message': 'Source ID is required'}), 400
    
    if not data.get('query'):
        return jsonify({'message': 'Query is required'}), 400
    
    source = DataSource.query.get(data.get('source_id'))
    if not source:
        return jsonify({'message': 'Data source not found'}), 404
    
    try:
        # Parse SQL to check syntax
        parsed = sqlparse.parse(data.get('query'))
        if not parsed:
            return jsonify({'message': 'Invalid SQL query'}), 400
            
        # Check if it's a SELECT query
        statement = parsed[0]
        if statement.get_type() != 'SELECT':
            return jsonify({'message': 'Only SELECT queries are allowed'}), 400
        
        # Execute query
        if source.type == 'file' and source.connection_params and 'file_path' in source.connection_params:
            file_path = source.connection_params['file_path']
            if not os.path.exists(file_path):
                return jsonify({'message': 'File not found'}), 404
            
            file_type = source.connection_params.get('file_type', 'csv')
            
            # Read the file
            if file_type == 'csv':
                df = pd.read_csv(file_path)
            elif file_type in ['xls', 'xlsx']:
                df = pd.read_excel(file_path)
            elif file_type == 'json':
                df = pd.read_json(file_path)
            else:
                return jsonify({'message': 'Unsupported file type'}), 400
            
            # Apply query
            processor = DataProcessor()
            result_df = processor.process_query(df, data.get('query'))
            
            # Generate schema
            schema = []
            for column in result_df.columns:
                schema.append({
                    'name': column,
                    'type': str(result_df[column].dtype)
                })
            
            # Return result with schema
            return jsonify({
                'columns': result_df.columns.tolist(),
                'rows': result_df.head(100).values.tolist(),
                'total_rows': len(result_df),
                'schema': schema
            }), 200
        else:
            return jsonify({'message': 'Query execution not available for this data source type'}), 400
    
    except Exception as e:
        traceback.print_exc()
        return jsonify({'message': f'Error executing query: {str(e)}'}), 500

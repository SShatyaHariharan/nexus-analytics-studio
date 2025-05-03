
import traceback
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.app import db
from backend.models import User, Dataset, DataSource
import pandas as pd

datasets_bp = Blueprint('datasets', __name__)

@datasets_bp.route('/', methods=['GET'])
@jwt_required()
def get_datasets():
    # Get query parameters for pagination and filtering
    page = request.args.get('page', 1, type=int)
    per_page = min(request.args.get('per_page', 20, type=int), 100)
    
    # Query datasets
    query = Dataset.query
    
    # Apply pagination
    pagination = query.paginate(page=page, per_page=per_page)
    
    # Return paginated results
    return jsonify({
        'data': [dataset.to_dict() for dataset in pagination.items],
        'total': pagination.total,
        'pages': pagination.pages,
        'page': page,
        'per_page': per_page
    }), 200

@datasets_bp.route('/<dataset_id>', methods=['GET'])
@jwt_required()
def get_dataset(dataset_id):
    dataset = Dataset.query.get(dataset_id)
    
    if not dataset:
        return jsonify({'message': 'Dataset not found'}), 404
    
    return jsonify(dataset.to_dict()), 200

@datasets_bp.route('/', methods=['POST'])
@jwt_required()
def create_dataset():
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    data = request.json
    
    # Check if user has permissions
    if not current_user.can(0x07):  # Analyst or higher
        return jsonify({'message': 'Permission denied'}), 403
    
    # Validate required fields
    if not data.get('name') or not data.get('source_id'):
        return jsonify({'message': 'Name and source_id are required'}), 400
    
    # Check if the data source exists
    source = DataSource.query.get(data.get('source_id'))
    if not source:
        return jsonify({'message': 'Data source not found'}), 404
    
    # Create new dataset
    new_dataset = Dataset(
        name=data.get('name'),
        description=data.get('description'),
        source_id=data.get('source_id'),
        schema=data.get('schema'),
        query=data.get('query'),
        table_name=data.get('table_name'),
        tags=data.get('tags'),
        created_by=current_user_id
    )
    
    db.session.add(new_dataset)
    db.session.commit()
    
    return jsonify(new_dataset.to_dict()), 201

@datasets_bp.route('/<dataset_id>', methods=['PUT'])
@jwt_required()
def update_dataset(dataset_id):
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    data = request.json
    
    # Check if user has permissions
    if not current_user.can(0x07):  # Analyst or higher
        return jsonify({'message': 'Permission denied'}), 403
    
    dataset = Dataset.query.get(dataset_id)
    if not dataset:
        return jsonify({'message': 'Dataset not found'}), 404
    
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
    
    db.session.commit()
    return jsonify(dataset.to_dict()), 200

@datasets_bp.route('/<dataset_id>', methods=['DELETE'])
@jwt_required()
def delete_dataset(dataset_id):
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    # Check if user has permissions
    if not current_user.can(0x0F):  # Developer or higher
        return jsonify({'message': 'Permission denied'}), 403
    
    dataset = Dataset.query.get(dataset_id)
    if not dataset:
        return jsonify({'message': 'Dataset not found'}), 404
    
    db.session.delete(dataset)
    db.session.commit()
    
    return jsonify({'message': 'Dataset deleted successfully'}), 200

@datasets_bp.route('/<dataset_id>/preview', methods=['GET'])
@jwt_required()
def preview_dataset(dataset_id):
    # Optional parameter for limiting rows
    limit = min(request.args.get('limit', 100, type=int), 1000)
    
    dataset = Dataset.query.get(dataset_id)
    if not dataset:
        return jsonify({'message': 'Dataset not found'}), 404
    
    try:
        # Here, we would actually query the data source
        # Simplified example for demonstration
        if dataset.query:
            # Execute SQL query with limit
            query = f"{dataset.query} LIMIT {limit}"
            # In a real implementation, we would connect to the data source
            # and execute the query
            
            # For now, return sample data
            data = {
                'columns': ['id', 'name', 'value', 'date'],
                'rows': [
                    [1, 'Item 1', 100, '2023-01-01'],
                    [2, 'Item 2', 200, '2023-01-02'],
                    [3, 'Item 3', 300, '2023-01-03']
                ]
            }
        elif dataset.table_name:
            # Query directly from table
            # In a real implementation, we would connect to the data source
            # and execute a SELECT query on the table
            
            # For now, return sample data
            data = {
                'columns': ['id', 'name', 'value', 'date'],
                'rows': [
                    [1, 'Item 1', 100, '2023-01-01'],
                    [2, 'Item 2', 200, '2023-01-02'],
                    [3, 'Item 3', 300, '2023-01-03']
                ]
            }
        else:
            return jsonify({'message': 'Dataset does not have a query or table definition'}), 400
        
        return jsonify(data), 200
    
    except Exception as e:
        traceback.print_exc()
        return jsonify({'message': f'Error previewing dataset: {str(e)}'}), 500

@datasets_bp.route('/upload', methods=['POST'])
@jwt_required()
def upload_file():
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    # Check if user has permissions
    if not current_user.can(0x07):  # Analyst or higher
        return jsonify({'message': 'Permission denied'}), 403
    
    if 'file' not in request.files:
        return jsonify({'message': 'No file provided'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'message': 'No file selected'}), 400
    
    try:
        # Check file type
        if file.filename.endswith('.csv'):
            df = pd.read_csv(file)
        elif file.filename.endswith(('.xls', '.xlsx')):
            df = pd.read_excel(file)
        elif file.filename.endswith('.json'):
            df = pd.read_json(file)
        else:
            return jsonify({'message': 'Unsupported file format'}), 400
        
        # Generate schema from DataFrame
        schema = []
        for column in df.columns:
            dtype = str(df[column].dtype)
            schema.append({
                'name': column,
                'type': dtype,
                'nullable': df[column].isna().any()
            })
        
        # Sample data
        sample_data = df.head(5).values.tolist()
        
        # Detect potential PII columns
        pii_columns = []
        # Simple detection based on column names
        pii_keywords = ['name', 'email', 'phone', 'address', 'ssn', 'social', 'birth', 'credit', 'passport']
        for column in df.columns:
            for keyword in pii_keywords:
                if keyword in column.lower():
                    pii_columns.append(column)
                    break
        
        return jsonify({
            'filename': file.filename,
            'rows': len(df),
            'columns': len(df.columns),
            'schema': schema,
            'sample': sample_data,
            'pii_columns': pii_columns
        }), 200
    
    except Exception as e:
        traceback.print_exc()
        return jsonify({'message': f'Error processing file: {str(e)}'}), 500

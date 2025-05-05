
import os
import pandas as pd
from werkzeug.utils import secure_filename
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.app import db, cache
from backend.models.user import User
from backend.models.data import DataSource
from backend.utils.data_ingestion import process_file, detect_column_types, detect_pii_columns

data_sources_bp = Blueprint('data_sources', __name__)

ALLOWED_EXTENSIONS = {'csv', 'xls', 'xlsx', 'json'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@data_sources_bp.route('/', methods=['GET'])
@jwt_required()
@cache.cached(timeout=60, key_prefix='data_sources')
def get_data_sources():
    # Get query parameters for pagination and filtering
    page = request.args.get('page', 1, type=int)
    per_page = min(request.args.get('per_page', 20, type=int), 100)
    
    # Query data sources
    query = DataSource.query
    
    # Apply pagination
    pagination = query.paginate(page=page, per_page=per_page)
    
    # Return paginated results
    return jsonify({
        'data': [source.to_dict() for source in pagination.items],
        'total': pagination.total,
        'pages': pagination.pages,
        'page': page,
        'per_page': per_page
    }), 200

@data_sources_bp.route('/<source_id>', methods=['GET'])
@jwt_required()
@cache.cached(timeout=60, key_prefix=lambda: f'data_source_{request.view_args["source_id"]}')
def get_data_source(source_id):
    source = DataSource.query.get(source_id)
    
    if not source:
        return jsonify({'message': 'Data source not found'}), 404
    
    return jsonify(source.to_dict()), 200

@data_sources_bp.route('/', methods=['POST'])
@jwt_required()
def create_data_source():
    current_user_id = get_jwt_identity()
    
    # Check if the post request has the file part
    if 'file' not in request.files:
        # Handle JSON data (for non-file data sources)
        data = request.json
        
        # Validate required fields
        if not data.get('name') or not data.get('type'):
            return jsonify({'message': 'Name and type are required'}), 400
        
        # Create new data source
        new_source = DataSource(
            name=data.get('name'),
            description=data.get('description'),
            type=data.get('type'),
            connection_params=data.get('connection_params'),
            created_by=current_user_id
        )
        
        db.session.add(new_source)
        db.session.commit()
        
        # Invalidate cache
        cache.delete('data_sources')
        
        return jsonify(new_source.to_dict()), 201
    
    # Handle file upload
    file = request.files['file']
    if file.filename == '':
        return jsonify({'message': 'No file selected'}), 400
    
    if not allowed_file(file.filename):
        return jsonify({'message': 'File type not allowed. Use CSV, XLS, XLSX, or JSON'}), 400
    
    try:
        # Ensure upload directory exists
        upload_dir = os.path.join(current_app.root_path, 'uploads')
        os.makedirs(upload_dir, exist_ok=True)
        
        # Save file
        filename = secure_filename(file.filename)
        file_path = os.path.join(upload_dir, filename)
        file.save(file_path)
        
        # Get file info from form data
        name = request.form.get('name', file.filename)
        description = request.form.get('description', '')
        
        # Process file and extract info
        df = process_file(file_path)
        column_types = detect_column_types(df)
        pii_columns = detect_pii_columns(df)
        
        # Create data source
        new_source = DataSource(
            name=name,
            description=description,
            type='file',
            connection_params={
                'file_path': file_path,
                'file_type': file.filename.rsplit('.', 1)[1].lower(),
                'rows': len(df),
                'columns': len(df.columns)
            },
            created_by=current_user_id
        )
        
        db.session.add(new_source)
        db.session.commit()
        
        # Invalidate cache
        cache.delete('data_sources')
        
        # Return data source with file info
        result = new_source.to_dict()
        result['file_info'] = {
            'rows': len(df),
            'columns': len(df.columns),
            'column_types': column_types,
            'pii_columns': pii_columns,
            'sample_data': df.head(5).to_dict(orient='records')
        }
        
        return jsonify(result), 201
        
    except Exception as e:
        return jsonify({'message': f'Error processing file: {str(e)}'}), 500

@data_sources_bp.route('/<source_id>', methods=['PUT'])
@jwt_required()
def update_data_source(source_id):
    current_user_id = get_jwt_identity()
    data = request.json
    
    source = DataSource.query.get(source_id)
    if not source:
        return jsonify({'message': 'Data source not found'}), 404
    
    # Update fields
    if 'name' in data:
        source.name = data.get('name')
    if 'description' in data:
        source.description = data.get('description')
    if 'type' in data:
        source.type = data.get('type')
    if 'connection_params' in data:
        source.connection_params = data.get('connection_params')
    
    db.session.commit()
    
    # Invalidate cache
    cache.delete('data_sources')
    cache.delete(f'data_source_{source_id}')
    
    return jsonify(source.to_dict()), 200

@data_sources_bp.route('/<source_id>', methods=['DELETE'])
@jwt_required()
def delete_data_source(source_id):
    current_user_id = get_jwt_identity()
    
    source = DataSource.query.get(source_id)
    if not source:
        return jsonify({'message': 'Data source not found'}), 404
    
    # Delete file if it's a file data source
    if source.type == 'file' and source.connection_params and 'file_path' in source.connection_params:
        try:
            file_path = source.connection_params['file_path']
            if os.path.exists(file_path):
                os.remove(file_path)
        except Exception as e:
            # Log error but continue with deletion
            print(f"Error deleting file: {str(e)}")
    
    db.session.delete(source)
    db.session.commit()
    
    # Invalidate cache
    cache.delete('data_sources')
    cache.delete(f'data_source_{source_id}')
    
    return jsonify({'message': 'Data source deleted successfully'}), 200

@data_sources_bp.route('/<source_id>/preview', methods=['GET'])
@jwt_required()
@cache.cached(timeout=300, key_prefix=lambda: f'data_source_preview_{request.view_args["source_id"]}')
def preview_data_source(source_id):
    limit = min(request.args.get('limit', 100, type=int), 1000)
    
    source = DataSource.query.get(source_id)
    if not source:
        return jsonify({'message': 'Data source not found'}), 404
    
    try:
        if source.type == 'file' and source.connection_params and 'file_path' in source.connection_params:
            file_path = source.connection_params['file_path']
            if not os.path.exists(file_path):
                return jsonify({'message': 'File not found'}), 404
                
            file_type = source.connection_params.get('file_type', 'csv')
            
            # Read appropriate number of rows
            if file_type == 'csv':
                df = pd.read_csv(file_path, nrows=limit)
            elif file_type in ['xls', 'xlsx']:
                df = pd.read_excel(file_path, nrows=limit)
            elif file_type == 'json':
                df = pd.read_json(file_path)
                df = df.head(limit)
            else:
                return jsonify({'message': 'Unsupported file type'}), 400
                
            # Convert to records
            data = {
                'columns': df.columns.tolist(),
                'rows': df.to_dict(orient='records'),
                'total_rows': source.connection_params.get('rows', len(df))
            }
            
            return jsonify(data), 200
        else:
            return jsonify({'message': 'Preview not available for this data source type'}), 400
    except Exception as e:
        return jsonify({'message': f'Error previewing data source: {str(e)}'}), 500


from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.app import db
from backend.models.user import User
from backend.models.data import DataSource

data_sources_bp = Blueprint('data_sources', __name__)

@data_sources_bp.route('/', methods=['GET'])
@jwt_required()
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
def get_data_source(source_id):
    source = DataSource.query.get(source_id)
    
    if not source:
        return jsonify({'message': 'Data source not found'}), 404
    
    return jsonify(source.to_dict()), 200

@data_sources_bp.route('/', methods=['POST'])
@jwt_required()
def create_data_source():
    current_user_id = get_jwt_identity()
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
    
    return jsonify(new_source.to_dict()), 201

@data_sources_bp.route('/<source_id>', methods=['PUT'])
@jwt_required()
def update_data_source(source_id):
    current_user_id = get_jwt_identity()
    data = request.json
    
    source = DataSource.query.get(source_id)
    if not source:
        return jsonify({'message': 'Data source not found'}), 404
    
    # Only creator can update
    if source.created_by != current_user_id:
        return jsonify({'message': 'Permission denied'}), 403
    
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
    return jsonify(source.to_dict()), 200

@data_sources_bp.route('/<source_id>', methods=['DELETE'])
@jwt_required()
def delete_data_source(source_id):
    current_user_id = get_jwt_identity()
    
    source = DataSource.query.get(source_id)
    if not source:
        return jsonify({'message': 'Data source not found'}), 404
    
    # Only creator can delete
    if source.created_by != current_user_id:
        return jsonify({'message': 'Permission denied'}), 403
    
    db.session.delete(source)
    db.session.commit()
    
    return jsonify({'message': 'Data source deleted successfully'}), 200

@data_sources_bp.route('/<source_id>/test', methods=['POST'])
@jwt_required()
def test_connection(source_id):
    source = DataSource.query.get(source_id)
    if not source:
        return jsonify({'message': 'Data source not found'}), 404
    
    # Here we would implement actual connection testing based on source type
    # For now, we'll just return a success message
    return jsonify({'message': 'Connection successful'}), 200

@data_sources_bp.route('/<source_id>/tables', methods=['GET'])
@jwt_required()
def get_tables(source_id):
    source = DataSource.query.get(source_id)
    if not source:
        return jsonify({'message': 'Data source not found'}), 404
    
    # Here we would implement actual table retrieval based on source type
    # For now, return a sample response
    tables = [
        {'name': 'users', 'schema': 'public', 'type': 'table'},
        {'name': 'orders', 'schema': 'public', 'type': 'table'},
        {'name': 'products', 'schema': 'public', 'type': 'table'},
    ]
    
    return jsonify(tables), 200

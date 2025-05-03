
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.app import db
from backend.models import User, Chart, Dataset

charts_bp = Blueprint('charts', __name__)

@charts_bp.route('/', methods=['GET'])
@jwt_required()
def get_charts():
    # Get query parameters for pagination and filtering
    page = request.args.get('page', 1, type=int)
    per_page = min(request.args.get('per_page', 20, type=int), 100)
    
    # Query charts
    query = Chart.query
    
    # Filter by dataset if specified
    dataset_id = request.args.get('dataset_id')
    if dataset_id:
        query = query.filter_by(dataset_id=dataset_id)
    
    # Apply pagination
    pagination = query.paginate(page=page, per_page=per_page)
    
    # Return paginated results
    return jsonify({
        'data': [chart.to_dict() for chart in pagination.items],
        'total': pagination.total,
        'pages': pagination.pages,
        'page': page,
        'per_page': per_page
    }), 200

@charts_bp.route('/<chart_id>', methods=['GET'])
@jwt_required()
def get_chart(chart_id):
    chart = Chart.query.get(chart_id)
    
    if not chart:
        return jsonify({'message': 'Chart not found'}), 404
    
    return jsonify(chart.to_dict()), 200

@charts_bp.route('/', methods=['POST'])
@jwt_required()
def create_chart():
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    data = request.json
    
    # Check if user has permissions
    if not current_user.can(0x07):  # Analyst or higher
        return jsonify({'message': 'Permission denied'}), 403
    
    # Validate required fields
    if not data.get('name') or not data.get('dataset_id') or not data.get('chart_type'):
        return jsonify({'message': 'Name, dataset_id, and chart_type are required'}), 400
    
    # Check if the dataset exists
    dataset = Dataset.query.get(data.get('dataset_id'))
    if not dataset:
        return jsonify({'message': 'Dataset not found'}), 404
    
    # Create new chart
    new_chart = Chart(
        name=data.get('name'),
        description=data.get('description'),
        dataset_id=data.get('dataset_id'),
        chart_type=data.get('chart_type'),
        configuration=data.get('configuration'),
        query_params=data.get('query_params'),
        created_by=current_user_id
    )
    
    db.session.add(new_chart)
    db.session.commit()
    
    return jsonify(new_chart.to_dict()), 201

@charts_bp.route('/<chart_id>', methods=['PUT'])
@jwt_required()
def update_chart(chart_id):
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    data = request.json
    
    # Check if user has permissions
    if not current_user.can(0x07):  # Analyst or higher
        return jsonify({'message': 'Permission denied'}), 403
    
    chart = Chart.query.get(chart_id)
    if not chart:
        return jsonify({'message': 'Chart not found'}), 404
    
    # Update fields
    if 'name' in data:
        chart.name = data.get('name')
    if 'description' in data:
        chart.description = data.get('description')
    if 'chart_type' in data:
        chart.chart_type = data.get('chart_type')
    if 'configuration' in data:
        chart.configuration = data.get('configuration')
    if 'query_params' in data:
        chart.query_params = data.get('query_params')
    
    db.session.commit()
    return jsonify(chart.to_dict()), 200

@charts_bp.route('/<chart_id>', methods=['DELETE'])
@jwt_required()
def delete_chart(chart_id):
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    # Check if user has permissions
    if not current_user.can(0x07):  # Analyst or higher
        return jsonify({'message': 'Permission denied'}), 403
    
    chart = Chart.query.get(chart_id)
    if not chart:
        return jsonify({'message': 'Chart not found'}), 404
    
    db.session.delete(chart)
    db.session.commit()
    
    return jsonify({'message': 'Chart deleted successfully'}), 200

@charts_bp.route('/<chart_id>/data', methods=['GET'])
@jwt_required()
def get_chart_data(chart_id):
    chart = Chart.query.get(chart_id)
    
    if not chart:
        return jsonify({'message': 'Chart not found'}), 404
    
    # Here, we would execute the query with the chart's query parameters
    # and return the data in a format suitable for the chart type
    
    # Sample data for different chart types
    if chart.chart_type == 'bar':
        data = {
            'labels': ['Category 1', 'Category 2', 'Category 3', 'Category 4', 'Category 5'],
            'datasets': [{
                'label': 'Values',
                'data': [65, 59, 80, 81, 56]
            }]
        }
    elif chart.chart_type == 'line':
        data = {
            'labels': ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            'datasets': [{
                'label': 'Series 1',
                'data': [12, 19, 3, 5, 2, 3]
            }, {
                'label': 'Series 2',
                'data': [5, 10, 15, 7, 8, 12]
            }]
        }
    elif chart.chart_type == 'pie':
        data = {
            'labels': ['Red', 'Blue', 'Yellow', 'Green', 'Purple'],
            'datasets': [{
                'data': [300, 50, 100, 40, 120]
            }]
        }
    else:
        # Default data for other chart types
        data = {
            'labels': ['Label 1', 'Label 2', 'Label 3'],
            'datasets': [{
                'label': 'Default',
                'data': [10, 20, 30]
            }]
        }
    
    return jsonify(data), 200

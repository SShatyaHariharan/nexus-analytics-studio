
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.app import db, cache
from backend.models import User, Chart, Dataset

charts_bp = Blueprint('charts', __name__)

@charts_bp.route('/', methods=['GET'])
@jwt_required()
@cache.cached(timeout=60, key_prefix='charts')
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
@cache.cached(timeout=60, key_prefix=lambda: f'chart_{request.view_args["chart_id"]}')
def get_chart(chart_id):
    chart = Chart.query.get(chart_id)
    
    if not chart:
        return jsonify({'message': 'Chart not found'}), 404
    
    return jsonify(chart.to_dict()), 200

@charts_bp.route('/', methods=['POST'])
@jwt_required()
def create_chart():
    current_user_id = get_jwt_identity()
    data = request.json
    
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
    
    # Invalidate cache
    cache.delete('charts')
    
    return jsonify(new_chart.to_dict()), 201

@charts_bp.route('/<chart_id>', methods=['PUT'])
@jwt_required()
def update_chart(chart_id):
    current_user_id = get_jwt_identity()
    data = request.json
    
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
    
    # Invalidate cache
    cache.delete('charts')
    cache.delete(f'chart_{chart_id}')
    cache.delete(f'chart_data_{chart_id}')
    
    return jsonify(chart.to_dict()), 200

@charts_bp.route('/<chart_id>', methods=['DELETE'])
@jwt_required()
def delete_chart(chart_id):
    current_user_id = get_jwt_identity()
    
    chart = Chart.query.get(chart_id)
    if not chart:
        return jsonify({'message': 'Chart not found'}), 404
    
    db.session.delete(chart)
    db.session.commit()
    
    # Invalidate cache
    cache.delete('charts')
    cache.delete(f'chart_{chart_id}')
    cache.delete(f'chart_data_{chart_id}')
    
    return jsonify({'message': 'Chart deleted successfully'}), 200

@charts_bp.route('/<chart_id>/data', methods=['GET'])
@jwt_required()
@cache.cached(timeout=300, key_prefix=lambda: f'chart_data_{request.view_args["chart_id"]}')
def get_chart_data(chart_id):
    chart = Chart.query.get(chart_id)
    
    if not chart:
        return jsonify({'message': 'Chart not found'}), 404
    
    # Get the dataset
    dataset = Dataset.query.get(chart.dataset_id)
    if not dataset:
        return jsonify({'message': 'Dataset not found'}), 404
    
    try:
        # Get the data source
        source = DataSource.query.get(dataset.source_id)
        if not source:
            return jsonify({'message': 'Data source not found'}), 404
        
        # Apply filters from request if available
        filters = request.args.get('filters', {})
        if isinstance(filters, str):
            import json
            try:
                filters = json.loads(filters)
            except:
                filters = {}
        
        # Apply any chart-specific filters from query_params
        if chart.query_params and 'filters' in chart.query_params:
            # Merge with request filters
            for key, value in chart.query_params['filters'].items():
                if key not in filters:
                    filters[key] = value
        
        # Process data based on chart type and configuration
        # Return sample data for now
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
        elif chart.chart_type == 'scatter':
            data = {
                'datasets': [{
                    'label': 'Scatter Dataset',
                    'data': [
                        { 'x': -10, 'y': 0 },
                        { 'x': 0, 'y': 10 },
                        { 'x': 10, 'y': 5 },
                        { 'x': 0.5, 'y': 5.5 }
                    ]
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
    
    except Exception as e:
        return jsonify({'message': f'Error getting chart data: {str(e)}'}), 500

# Missing import at the top
from backend.models.data import DataSource

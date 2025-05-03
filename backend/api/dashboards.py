
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.app import db
from backend.models import User, Dashboard, Chart, DashboardChart, DashboardComment

dashboards_bp = Blueprint('dashboards', __name__)

@dashboards_bp.route('/', methods=['GET'])
@jwt_required()
def get_dashboards():
    # Get query parameters for pagination and filtering
    page = request.args.get('page', 1, type=int)
    per_page = min(request.args.get('per_page', 20, type=int), 100)
    
    # Query dashboards
    query = Dashboard.query
    
    # Apply pagination
    pagination = query.paginate(page=page, per_page=per_page)
    
    # Return paginated results
    return jsonify({
        'data': [dashboard.to_dict() for dashboard in pagination.items],
        'total': pagination.total,
        'pages': pagination.pages,
        'page': page,
        'per_page': per_page
    }), 200

@dashboards_bp.route('/<dashboard_id>', methods=['GET'])
@jwt_required()
def get_dashboard(dashboard_id):
    dashboard = Dashboard.query.get(dashboard_id)
    
    if not dashboard:
        return jsonify({'message': 'Dashboard not found'}), 404
    
    return jsonify(dashboard.to_dict()), 200

@dashboards_bp.route('/', methods=['POST'])
@jwt_required()
def create_dashboard():
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    data = request.json
    
    # Check if user has permissions
    if not current_user.can(0x07):  # Analyst or higher
        return jsonify({'message': 'Permission denied'}), 403
    
    # Validate required fields
    if not data.get('name'):
        return jsonify({'message': 'Name is required'}), 400
    
    # Create new dashboard
    new_dashboard = Dashboard(
        name=data.get('name'),
        description=data.get('description'),
        layout=data.get('layout'),
        filters=data.get('filters'),
        theme=data.get('theme') or 'default',
        is_public=data.get('is_public') or False,
        created_by=current_user_id
    )
    
    db.session.add(new_dashboard)
    db.session.commit()
    
    return jsonify(new_dashboard.to_dict()), 201

@dashboards_bp.route('/<dashboard_id>', methods=['PUT'])
@jwt_required()
def update_dashboard(dashboard_id):
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    data = request.json
    
    # Check if user has permissions
    if not current_user.can(0x07):  # Analyst or higher
        return jsonify({'message': 'Permission denied'}), 403
    
    dashboard = Dashboard.query.get(dashboard_id)
    if not dashboard:
        return jsonify({'message': 'Dashboard not found'}), 404
    
    # Update fields
    if 'name' in data:
        dashboard.name = data.get('name')
    if 'description' in data:
        dashboard.description = data.get('description')
    if 'layout' in data:
        dashboard.layout = data.get('layout')
    if 'filters' in data:
        dashboard.filters = data.get('filters')
    if 'theme' in data:
        dashboard.theme = data.get('theme')
    if 'is_public' in data:
        dashboard.is_public = data.get('is_public')
    
    db.session.commit()
    return jsonify(dashboard.to_dict()), 200

@dashboards_bp.route('/<dashboard_id>', methods=['DELETE'])
@jwt_required()
def delete_dashboard(dashboard_id):
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    # Check if user has permissions
    if not current_user.can(0x07):  # Analyst or higher
        return jsonify({'message': 'Permission denied'}), 403
    
    dashboard = Dashboard.query.get(dashboard_id)
    if not dashboard:
        return jsonify({'message': 'Dashboard not found'}), 404
    
    db.session.delete(dashboard)
    db.session.commit()
    
    return jsonify({'message': 'Dashboard deleted successfully'}), 200

@dashboards_bp.route('/<dashboard_id>/charts', methods=['POST'])
@jwt_required()
def add_chart_to_dashboard(dashboard_id):
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    data = request.json
    
    # Check if user has permissions
    if not current_user.can(0x07):  # Analyst or higher
        return jsonify({'message': 'Permission denied'}), 403
    
    # Validate required fields
    if not data.get('chart_id') or 'position' not in data:
        return jsonify({'message': 'Chart ID and position are required'}), 400
    
    dashboard = Dashboard.query.get(dashboard_id)
    if not dashboard:
        return jsonify({'message': 'Dashboard not found'}), 404
    
    chart = Chart.query.get(data.get('chart_id'))
    if not chart:
        return jsonify({'message': 'Chart not found'}), 404
    
    # Create dashboard chart relation
    dashboard_chart = DashboardChart(
        dashboard_id=dashboard_id,
        chart_id=data.get('chart_id'),
        position=data.get('position')
    )
    
    db.session.add(dashboard_chart)
    db.session.commit()
    
    return jsonify(dashboard_chart.to_dict()), 201

@dashboards_bp.route('/<dashboard_id>/charts/<chart_id>', methods=['PUT'])
@jwt_required()
def update_dashboard_chart(dashboard_id, chart_id):
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    data = request.json
    
    # Check if user has permissions
    if not current_user.can(0x07):  # Analyst or higher
        return jsonify({'message': 'Permission denied'}), 403
    
    dashboard_chart = DashboardChart.query.filter_by(
        dashboard_id=dashboard_id, chart_id=chart_id
    ).first()
    
    if not dashboard_chart:
        return jsonify({'message': 'Chart not found in dashboard'}), 404
    
    # Update position
    if 'position' in data:
        dashboard_chart.position = data.get('position')
    
    db.session.commit()
    return jsonify(dashboard_chart.to_dict()), 200

@dashboards_bp.route('/<dashboard_id>/charts/<chart_id>', methods=['DELETE'])
@jwt_required()
def remove_chart_from_dashboard(dashboard_id, chart_id):
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    # Check if user has permissions
    if not current_user.can(0x07):  # Analyst or higher
        return jsonify({'message': 'Permission denied'}), 403
    
    dashboard_chart = DashboardChart.query.filter_by(
        dashboard_id=dashboard_id, chart_id=chart_id
    ).first()
    
    if not dashboard_chart:
        return jsonify({'message': 'Chart not found in dashboard'}), 404
    
    db.session.delete(dashboard_chart)
    db.session.commit()
    
    return jsonify({'message': 'Chart removed from dashboard successfully'}), 200

@dashboards_bp.route('/<dashboard_id>/comments', methods=['POST'])
@jwt_required()
def add_comment(dashboard_id):
    current_user_id = get_jwt_identity()
    data = request.json
    
    # Validate required fields
    if not data.get('comment'):
        return jsonify({'message': 'Comment text is required'}), 400
    
    dashboard = Dashboard.query.get(dashboard_id)
    if not dashboard:
        return jsonify({'message': 'Dashboard not found'}), 404
    
    # Create new comment
    new_comment = DashboardComment(
        dashboard_id=dashboard_id,
        user_id=current_user_id,
        comment=data.get('comment'),
        position=data.get('position'),
        parent_id=data.get('parent_id')
    )
    
    db.session.add(new_comment)
    db.session.commit()
    
    return jsonify(new_comment.to_dict()), 201

@dashboards_bp.route('/<dashboard_id>/comments', methods=['GET'])
@jwt_required()
def get_comments(dashboard_id):
    dashboard = Dashboard.query.get(dashboard_id)
    if not dashboard:
        return jsonify({'message': 'Dashboard not found'}), 404
    
    # Get only top-level comments (no parent)
    comments = DashboardComment.query.filter_by(
        dashboard_id=dashboard_id, parent_id=None
    ).all()
    
    return jsonify([comment.to_dict() for comment in comments]), 200

@dashboards_bp.route('/<dashboard_id>/export', methods=['GET'])
@jwt_required()
def export_dashboard(dashboard_id):
    format_type = request.args.get('format', 'json')
    
    dashboard = Dashboard.query.get(dashboard_id)
    if not dashboard:
        return jsonify({'message': 'Dashboard not found'}), 404
    
    # Here, we would implement export functionality based on format
    # For now, return a message indicating the feature is in progress
    return jsonify({
        'message': f'Dashboard export to {format_type} is not yet implemented'
    }), 501

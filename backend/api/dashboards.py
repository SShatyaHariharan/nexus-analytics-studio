
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.app import db, cache
from backend.models import User, Dashboard, Chart, DashboardChart, DashboardComment

dashboards_bp = Blueprint('dashboards', __name__)

@dashboards_bp.route('/', methods=['GET'])
@jwt_required()
@cache.cached(timeout=60, key_prefix='dashboards')
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
@cache.cached(timeout=60, key_prefix=lambda: f'dashboard_{request.view_args["dashboard_id"]}')
def get_dashboard(dashboard_id):
    dashboard = Dashboard.query.get(dashboard_id)
    
    if not dashboard:
        return jsonify({'message': 'Dashboard not found'}), 404
    
    return jsonify(dashboard.to_dict()), 200

@dashboards_bp.route('/', methods=['POST'])
@jwt_required()
def create_dashboard():
    current_user_id = get_jwt_identity()
    data = request.json
    
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
        is_public=data.get('is_public', False),
        created_by=current_user_id
    )
    
    db.session.add(new_dashboard)
    db.session.commit()
    
    # Invalidate cache
    cache.delete('dashboards')
    
    return jsonify(new_dashboard.to_dict()), 201

@dashboards_bp.route('/<dashboard_id>', methods=['PUT'])
@jwt_required()
def update_dashboard(dashboard_id):
    current_user_id = get_jwt_identity()
    data = request.json
    
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
    
    # Invalidate cache
    cache.delete('dashboards')
    cache.delete(f'dashboard_{dashboard_id}')
    
    return jsonify(dashboard.to_dict()), 200

@dashboards_bp.route('/<dashboard_id>', methods=['DELETE'])
@jwt_required()
def delete_dashboard(dashboard_id):
    current_user_id = get_jwt_identity()
    
    dashboard = Dashboard.query.get(dashboard_id)
    if not dashboard:
        return jsonify({'message': 'Dashboard not found'}), 404
    
    db.session.delete(dashboard)
    db.session.commit()
    
    # Invalidate cache
    cache.delete('dashboards')
    cache.delete(f'dashboard_{dashboard_id}')
    
    return jsonify({'message': 'Dashboard deleted successfully'}), 200

@dashboards_bp.route('/<dashboard_id>/charts', methods=['POST'])
@jwt_required()
def add_chart_to_dashboard(dashboard_id):
    current_user_id = get_jwt_identity()
    data = request.json
    
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
    
    # Invalidate cache
    cache.delete(f'dashboard_{dashboard_id}')
    
    return jsonify(dashboard_chart.to_dict()), 201

@dashboards_bp.route('/<dashboard_id>/charts/<chart_id>', methods=['PUT'])
@jwt_required()
def update_dashboard_chart(dashboard_id, chart_id):
    current_user_id = get_jwt_identity()
    data = request.json
    
    dashboard_chart = DashboardChart.query.filter_by(
        dashboard_id=dashboard_id, chart_id=chart_id
    ).first()
    
    if not dashboard_chart:
        return jsonify({'message': 'Chart not found in dashboard'}), 404
    
    # Update position
    if 'position' in data:
        dashboard_chart.position = data.get('position')
    
    db.session.commit()
    
    # Invalidate cache
    cache.delete(f'dashboard_{dashboard_id}')
    
    return jsonify(dashboard_chart.to_dict()), 200

@dashboards_bp.route('/<dashboard_id>/charts/<chart_id>', methods=['DELETE'])
@jwt_required()
def remove_chart_from_dashboard(dashboard_id, chart_id):
    current_user_id = get_jwt_identity()
    
    dashboard_chart = DashboardChart.query.filter_by(
        dashboard_id=dashboard_id, chart_id=chart_id
    ).first()
    
    if not dashboard_chart:
        return jsonify({'message': 'Chart not found in dashboard'}), 404
    
    db.session.delete(dashboard_chart)
    db.session.commit()
    
    # Invalidate cache
    cache.delete(f'dashboard_{dashboard_id}')
    
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
    
    # Invalidate comments cache
    cache.delete(f'dashboard_comments_{dashboard_id}')
    
    return jsonify(new_comment.to_dict()), 201

@dashboards_bp.route('/<dashboard_id>/comments', methods=['GET'])
@jwt_required()
@cache.cached(timeout=120, key_prefix=lambda: f'dashboard_comments_{request.view_args["dashboard_id"]}')
def get_comments(dashboard_id):
    dashboard = Dashboard.query.get(dashboard_id)
    if not dashboard:
        return jsonify({'message': 'Dashboard not found'}), 404
    
    # Get only top-level comments (no parent)
    comments = DashboardComment.query.filter_by(
        dashboard_id=dashboard_id, parent_id=None
    ).all()
    
    return jsonify([comment.to_dict() for comment in comments]), 200

@dashboards_bp.route('/<dashboard_id>/filters', methods=['GET'])
@jwt_required()
@cache.cached(timeout=300, key_prefix=lambda: f'dashboard_filters_{request.view_args["dashboard_id"]}')
def get_dashboard_filters(dashboard_id):
    dashboard = Dashboard.query.get(dashboard_id)
    if not dashboard:
        return jsonify({'message': 'Dashboard not found'}), 404
    
    # Return dashboard filters
    return jsonify(dashboard.filters or {}), 200

@dashboards_bp.route('/<dashboard_id>/apply-filters', methods=['POST'])
@jwt_required()
def apply_dashboard_filters(dashboard_id):
    data = request.json
    filters = data.get('filters', {})
    
    dashboard = Dashboard.query.get(dashboard_id)
    if not dashboard:
        return jsonify({'message': 'Dashboard not found'}), 404
    
    # Get all charts in this dashboard
    dashboard_charts = DashboardChart.query.filter_by(dashboard_id=dashboard_id).all()
    chart_ids = [dc.chart_id for dc in dashboard_charts]
    
    # For each chart, invalidate its data cache to force refreshing with new filters
    for chart_id in chart_ids:
        cache.delete(f'chart_data_{chart_id}')
    
    return jsonify({
        'message': 'Filters applied successfully',
        'filter_count': len(filters),
        'affected_charts': len(chart_ids)
    }), 200

@dashboards_bp.route('/<dashboard_id>/export', methods=['GET'])
@jwt_required()
def export_dashboard(dashboard_id):
    format_type = request.args.get('format', 'json')
    
    dashboard = Dashboard.query.get(dashboard_id)
    if not dashboard:
        return jsonify({'message': 'Dashboard not found'}), 404
    
    # Here we would implement export functionality based on format
    # For now, return dashboard data in JSON format
    dashboard_data = dashboard.to_dict()
    
    # Add charts with their positions
    dashboard_charts = DashboardChart.query.filter_by(dashboard_id=dashboard_id).all()
    charts_data = []
    
    for dc in dashboard_charts:
        chart_data = dc.chart.to_dict() if dc.chart else {}
        chart_data['position'] = dc.position
        charts_data.append(chart_data)
    
    dashboard_data['charts'] = charts_data
    
    return jsonify(dashboard_data), 200

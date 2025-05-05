
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.app import db, cache
from backend.models.user import User

users_bp = Blueprint('users', __name__)

@users_bp.route('/', methods=['GET'])
@jwt_required()
@cache.cached(timeout=60, key_prefix='users')
def get_users():
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    # Only admin can view all users
    if current_user.role != 'admin':
        return jsonify({'message': 'Permission denied'}), 403
    
    users = User.query.all()
    return jsonify([user.to_dict() for user in users]), 200

@users_bp.route('/<user_id>', methods=['GET'])
@jwt_required()
def get_user(user_id):
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    # Admins can view any user, regular users can only view themselves
    if current_user.role != 'admin' and current_user_id != user_id:
        return jsonify({'message': 'Permission denied'}), 403
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({'message': 'User not found'}), 404
    
    return jsonify(user.to_dict()), 200

@users_bp.route('/<user_id>', methods=['PUT'])
@jwt_required()
def update_user(user_id):
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    data = request.json
    
    # Check permissions - admins can update any user, users can update their own profile
    if current_user.role != 'admin' and current_user_id != user_id:
        return jsonify({'message': 'Permission denied'}), 403
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({'message': 'User not found'}), 404
    
    # Field updates that anyone can do to their profile
    if 'first_name' in data:
        user.first_name = data.get('first_name')
    if 'last_name' in data:
        user.last_name = data.get('last_name')
    if 'email' in data:
        # Check if email is already taken
        existing = User.query.filter_by(email=data.get('email')).first()
        if existing and existing.id != user_id:
            return jsonify({'message': 'Email already taken'}), 409
        user.email = data.get('email')
    
    # Admin-only updates
    if current_user.role == 'admin':
        if 'is_active' in data:
            user.is_active = data.get('is_active')
        if 'role' in data:
            # Validate role
            allowed_roles = ['admin', 'manager', 'analyst', 'user']
            if data.get('role') in allowed_roles:
                user.role = data.get('role')
            else:
                return jsonify({'message': 'Invalid role'}), 400
    
    db.session.commit()
    
    # Invalidate cache
    cache.delete('users')
    cache.delete(f'user_{user_id}')
    if hasattr(user, 'username'):
        cache.delete(f'user_{user.username}')
    
    return jsonify(user.to_dict()), 200

@users_bp.route('/<user_id>', methods=['DELETE'])
@jwt_required()
def delete_user(user_id):
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    # Only admins can delete user accounts
    if current_user.role != 'admin':
        return jsonify({'message': 'Permission denied'}), 403
    
    # Prevent self-deletion
    if current_user_id == user_id:
        return jsonify({'message': 'Cannot delete your own account'}), 400
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({'message': 'User not found'}), 404
    
    db.session.delete(user)
    db.session.commit()
    
    # Invalidate cache
    cache.delete('users')
    cache.delete(f'user_{user_id}')
    if hasattr(user, 'username'):
        cache.delete(f'user_{user.username}')
    
    return jsonify({'message': 'User deleted successfully'}), 200

@users_bp.route('/roles', methods=['GET'])
@jwt_required()
def get_roles():
    # Return available roles
    roles = [
        {
            'id': 'admin',
            'name': 'Administrator',
            'permissions': [
                'view_dashboard', 'edit_dashboard', 'delete_dashboard',
                'view_datasource', 'edit_datasource', 'delete_datasource',
                'view_dataset', 'edit_dataset', 'delete_dataset',
                'view_chart', 'edit_chart', 'delete_chart',
                'manage_users', 'view_settings', 'edit_settings'
            ]
        },
        {
            'id': 'manager',
            'name': 'Manager',
            'permissions': [
                'view_dashboard', 'edit_dashboard',
                'view_datasource', 'edit_datasource',
                'view_dataset', 'edit_dataset',
                'view_chart', 'edit_chart',
                'view_settings'
            ]
        },
        {
            'id': 'analyst',
            'name': 'Analyst',
            'permissions': [
                'view_dashboard',
                'view_datasource', 'edit_datasource',
                'view_dataset', 'edit_dataset',
                'view_chart', 'edit_chart'
            ]
        },
        {
            'id': 'user',
            'name': 'Regular User',
            'permissions': [
                'view_dashboard',
                'view_datasource',
                'view_dataset',
                'view_chart'
            ]
        }
    ]
    
    return jsonify(roles), 200

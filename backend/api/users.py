
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.app import db
from backend.models import User, Role

users_bp = Blueprint('users', __name__)

@users_bp.route('/', methods=['GET'])
@jwt_required()
def get_users():
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    # Check if user has admin permissions
    if not current_user.is_admin():
        return jsonify({'message': 'Permission denied'}), 403
    
    users = User.query.all()
    return jsonify([user.to_dict() for user in users]), 200

@users_bp.route('/<user_id>', methods=['GET'])
@jwt_required()
def get_user(user_id):
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    # Users can view their own profile or admin can view any profile
    if current_user_id != user_id and not current_user.is_admin():
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
    
    # Check permissions - users can update their own profile or admin can update any
    if current_user_id != user_id and not current_user.is_admin():
        return jsonify({'message': 'Permission denied'}), 403
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({'message': 'User not found'}), 404
    
    # Update fields
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
    
    # Only admin can change roles and status
    if current_user.is_admin():
        if 'role_id' in data:
            user.role_id = data.get('role_id')
        if 'is_active' in data:
            user.is_active = data.get('is_active')
    
    db.session.commit()
    return jsonify(user.to_dict()), 200

@users_bp.route('/<user_id>', methods=['DELETE'])
@jwt_required()
def delete_user(user_id):
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    # Only admin can delete users
    if not current_user.is_admin():
        return jsonify({'message': 'Permission denied'}), 403
    
    # Cannot delete yourself
    if current_user_id == user_id:
        return jsonify({'message': 'Cannot delete your own account'}), 400
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({'message': 'User not found'}), 404
    
    db.session.delete(user)
    db.session.commit()
    
    return jsonify({'message': 'User deleted successfully'}), 200

@users_bp.route('/roles', methods=['GET'])
@jwt_required()
def get_roles():
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    # Only admin can view roles
    if not current_user.is_admin():
        return jsonify({'message': 'Permission denied'}), 403
    
    roles = Role.query.all()
    return jsonify([{
        'id': role.id,
        'name': role.name,
        'permissions': role.permissions
    } for role in roles]), 200

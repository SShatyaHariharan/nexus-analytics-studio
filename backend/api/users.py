
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.app import db
from backend.models.user import User

users_bp = Blueprint('users', __name__)

@users_bp.route('/', methods=['GET'])
@jwt_required()
def get_users():
    users = User.query.all()
    return jsonify([user.to_dict() for user in users]), 200

@users_bp.route('/<user_id>', methods=['GET'])
@jwt_required()
def get_user(user_id):
    current_user_id = get_jwt_identity()
    
    # Users can view their own profile
    if current_user_id != user_id:
        return jsonify({'message': 'Permission denied'}), 403
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({'message': 'User not found'}), 404
    
    return jsonify(user.to_dict()), 200

@users_bp.route('/<user_id>', methods=['PUT'])
@jwt_required()
def update_user(user_id):
    current_user_id = get_jwt_identity()
    data = request.json
    
    # Check permissions - users can update their own profile
    if current_user_id != user_id:
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
    if 'is_active' in data:
        user.is_active = data.get('is_active')
    
    db.session.commit()
    return jsonify(user.to_dict()), 200

@users_bp.route('/<user_id>', methods=['DELETE'])
@jwt_required()
def delete_user(user_id):
    current_user_id = get_jwt_identity()
    
    # Cannot delete other user accounts
    if current_user_id != user_id:
        return jsonify({'message': 'Permission denied'}), 403
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({'message': 'User not found'}), 404
    
    db.session.delete(user)
    db.session.commit()
    
    return jsonify({'message': 'User deleted successfully'}), 200

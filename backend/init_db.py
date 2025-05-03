
import os
from flask_migrate import Migrate, MigrateCommand, upgrade
from backend.app import create_app, db
from backend.models import User, Role

def init_db():
    """Initialize the database with tables and seed data."""
    app = create_app()
    
    with app.app_context():
        # Create tables
        db.create_all()
        
        # Insert roles if they don't exist
        Role.insert_roles()
        
        # Create admin user if it doesn't exist
        admin_role = Role.query.filter_by(name='Admin').first()
        admin = User.query.filter_by(username='admin').first()
        
        if admin is None:
            admin = User(
                username='admin',
                email='admin@example.com',
                first_name='Admin',
                last_name='User',
                role_id=admin_role.id
            )
            admin.password = 'admin123'  # This would be changed in production
            db.session.add(admin)
            db.session.commit()
            print('Admin user created.')
        else:
            print('Admin user already exists.')
        
        print('Database initialization complete.')

if __name__ == '__main__':
    init_db()

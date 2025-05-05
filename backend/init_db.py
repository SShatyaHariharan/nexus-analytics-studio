
import os
import sys
import pandas as pd
from datetime import datetime

# Add the parent directory to sys.path to make backend imports work
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.app import create_app, db
from backend.models import User, DataSource, Dataset, Chart, Dashboard

def init_db():
    """Initialize the database with tables and seed data."""
    app = create_app()
    
    with app.app_context():
        # Create tables
        db.create_all()
        
        # Create admin user if it doesn't exist
        admin = User.query.filter_by(username='admin').first()
        
        if admin is None:
            admin = User(
                username='admin',
                email='admin@visualx.com',
                first_name='Admin',
                last_name='User',
                role='admin'
            )
            admin.password = 'admin123'
            db.session.add(admin)
            
            # Create analyst user
            analyst = User(
                username='analyst',
                email='analyst@visualx.com',
                first_name='Data',
                last_name='Analyst',
                role='analyst'
            )
            analyst.password = 'analyst123'
            db.session.add(analyst)
            
            # Create regular user
            user = User(
                username='user',
                email='user@visualx.com',
                first_name='Regular',
                last_name='User',
                role='user'
            )
            user.password = 'user123'
            db.session.add(user)
            
            db.session.commit()
            print('Users created.')
        else:
            print('Admin user already exists.')
        
        # Import sample data from the car sales CSV file if it exists
        car_sales_path = os.path.join(os.path.dirname(__file__), 'sample_data', 'car_sales.csv')
        if os.path.exists(car_sales_path):
            # Create data source for sample data
            data_source = DataSource.query.filter_by(name='Sample Car Sales').first()
            if data_source is None:
                data_source = DataSource(
                    name='Sample Car Sales',
                    description='Sample car sales data from Kaggle',
                    type='csv',
                    created_by=admin.id
                )
                db.session.add(data_source)
                db.session.commit()
                
                # Create dataset from CSV
                try:
                    df = pd.read_csv(car_sales_path)
                    columns = df.columns.tolist()
                    schema = [{
                        'name': col,
                        'type': str(df[col].dtype)
                    } for col in columns]
                    
                    dataset = Dataset(
                        name='Car Sales Data',
                        description='Dataset containing car sales information',
                        source_id=data_source.id,
                        schema=schema,
                        table_name='car_sales',
                        created_by=admin.id
                    )
                    db.session.add(dataset)
                    db.session.commit()
                    
                    print('Sample car sales data imported successfully.')
                except Exception as e:
                    print(f'Error importing sample data: {str(e)}')
            else:
                print('Sample data source already exists.')
        else:
            print('Sample car sales data file not found. Please download it from Kaggle.')
        
        print('Database initialization complete.')

if __name__ == '__main__':
    init_db()


import os
from flask import Flask
from flask_cors import CORS
from flask_migrate import Migrate
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager

# Initialize core extensions
db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()

def create_app(config_name=None):
    app = Flask(__name__)
    
    # Load configuration
    if config_name is None:
        config_name = os.getenv('FLASK_CONFIG', 'development')
    
    if config_name == 'production':
        app.config.from_object('config.ProductionConfig')
    elif config_name == 'testing':
        app.config.from_object('config.TestingConfig')
    else:
        app.config.from_object('config.DevelopmentConfig')
    
    # Enable CORS
    CORS(app, resources={r"/*": {"origins": "*"}})
    
    # Initialize extensions with app
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    
    # Register blueprints
    from backend.api.auth import auth_bp
    from backend.api.data_sources import data_sources_bp
    from backend.api.datasets import datasets_bp
    from backend.api.dashboards import dashboards_bp
    from backend.api.charts import charts_bp
    from backend.api.users import users_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(data_sources_bp, url_prefix='/api/datasources')
    app.register_blueprint(datasets_bp, url_prefix='/api/datasets')
    app.register_blueprint(dashboards_bp, url_prefix='/api/dashboards')
    app.register_blueprint(charts_bp, url_prefix='/api/charts')
    app.register_blueprint(users_bp, url_prefix='/api/users')
    
    # Add health check endpoint
    @app.route('/health', methods=['GET'])
    def health_check():
        return {"status": "healthy", "version": "1.0.0", "app": "VisualX"}
    
    return app

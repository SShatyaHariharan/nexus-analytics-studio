
import os
from flask import Flask
from flask_cors import CORS
from flask_migrate import Migrate
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_caching import Cache

# Initialize core extensions
db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()
cache = Cache()

def create_app():
    app = Flask(__name__)
    
    # Load configuration
    app.config.update(
        SQLALCHEMY_DATABASE_URI=os.getenv('DATABASE_URL', 'postgresql://postgres:postgres@localhost/visualx'),
        SQLALCHEMY_TRACK_MODIFICATIONS=False,
        JWT_SECRET_KEY=os.getenv('JWT_SECRET_KEY', 'dev-secret-key'),
        JWT_ACCESS_TOKEN_EXPIRES=60*60,  # 1 hour
        JWT_REFRESH_TOKEN_EXPIRES=30*24*60*60,  # 30 days
        CACHE_TYPE='redis',
        CACHE_REDIS_URL=os.getenv('REDIS_URL', 'redis://localhost:6379/0'),
        CACHE_DEFAULT_TIMEOUT=300,
        MAX_CONTENT_LENGTH=16*1024*1024  # 16MB max upload size
    )
    
    # Enable CORS
    CORS(app, resources={r"/*": {"origins": "*"}})
    
    # Initialize extensions with app
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    cache.init_app(app)
    
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

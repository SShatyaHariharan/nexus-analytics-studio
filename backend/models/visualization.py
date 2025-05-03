
import uuid
from datetime import datetime
from sqlalchemy.dialects.postgresql import JSONB
from backend.app import db

class Chart(db.Model):
    __tablename__ = 'charts'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(64), nullable=False)
    description = db.Column(db.Text)
    dataset_id = db.Column(db.String(36), db.ForeignKey('datasets.id'))
    chart_type = db.Column(db.String(32), nullable=False)  # bar, line, pie, etc.
    configuration = db.Column(JSONB)  # Chart-specific config (axes, series, etc.)
    query_params = db.Column(JSONB)  # Filters, aggregations, etc.
    created_by = db.Column(db.String(36), db.ForeignKey('users.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    dashboard_charts = db.relationship('DashboardChart', backref='chart', lazy='dynamic', cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'dataset_id': self.dataset_id,
            'chart_type': self.chart_type,
            'configuration': self.configuration,
            'query_params': self.query_params,
            'created_by': self.created_by,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class Dashboard(db.Model):
    __tablename__ = 'dashboards'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(64), nullable=False)
    description = db.Column(db.Text)
    layout = db.Column(JSONB)  # Stores layout configuration
    filters = db.Column(JSONB)  # Global dashboard filters
    theme = db.Column(db.String(32), default='default')
    is_public = db.Column(db.Boolean, default=False)
    created_by = db.Column(db.String(36), db.ForeignKey('users.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    charts = db.relationship('DashboardChart', backref='dashboard', lazy='dynamic', cascade='all, delete-orphan')
    comments = db.relationship('DashboardComment', backref='dashboard', lazy='dynamic', cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'layout': self.layout,
            'filters': self.filters,
            'theme': self.theme,
            'is_public': self.is_public,
            'created_by': self.created_by,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'charts': [chart.to_dict() for chart in self.charts]
        }


class DashboardChart(db.Model):
    __tablename__ = 'dashboard_charts'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    dashboard_id = db.Column(db.String(36), db.ForeignKey('dashboards.id'), nullable=False)
    chart_id = db.Column(db.String(36), db.ForeignKey('charts.id'), nullable=False)
    position = db.Column(JSONB)  # x, y, width, height
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'dashboard_id': self.dashboard_id,
            'chart_id': self.chart_id,
            'position': self.position,
            'chart': self.chart.to_dict() if self.chart else None
        }


class DashboardComment(db.Model):
    __tablename__ = 'dashboard_comments'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    dashboard_id = db.Column(db.String(36), db.ForeignKey('dashboards.id'), nullable=False)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    comment = db.Column(db.Text, nullable=False)
    position = db.Column(JSONB)  # Optional x, y position on dashboard
    parent_id = db.Column(db.String(36), db.ForeignKey('dashboard_comments.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user = db.relationship('User')
    replies = db.relationship('DashboardComment', backref=db.backref('parent', remote_side=[id]), lazy='dynamic')
    
    def to_dict(self):
        return {
            'id': self.id,
            'dashboard_id': self.dashboard_id,
            'user': self.user.to_dict(),
            'comment': self.comment,
            'position': self.position,
            'parent_id': self.parent_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'replies': [reply.to_dict() for reply in self.replies]
        }

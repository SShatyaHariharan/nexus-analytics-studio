
import uuid
from datetime import datetime
from sqlalchemy.dialects.postgresql import JSONB
from backend.app import db

class DataSource(db.Model):
    __tablename__ = 'data_sources'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(64), nullable=False)
    description = db.Column(db.Text)
    type = db.Column(db.String(32), nullable=False)  # postgresql, mysql, mongodb, s3, etc.
    connection_params = db.Column(JSONB)
    created_by = db.Column(db.String(36), db.ForeignKey('users.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    datasets = db.relationship('Dataset', backref='source', lazy='dynamic')
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'type': self.type,
            'created_by': self.created_by,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class Dataset(db.Model):
    __tablename__ = 'datasets'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(64), nullable=False)
    description = db.Column(db.Text)
    source_id = db.Column(db.String(36), db.ForeignKey('data_sources.id'))
    schema = db.Column(JSONB)  # Stores column definitions, types, etc.
    query = db.Column(db.Text)  # SQL query or other query definition
    table_name = db.Column(db.String(64))  # For direct table references
    tags = db.Column(JSONB)  # For metadata tagging
    pii_columns = db.Column(JSONB)  # Columns identified as PII
    created_by = db.Column(db.String(36), db.ForeignKey('users.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    charts = db.relationship('Chart', backref='dataset', lazy='dynamic')
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'source_id': self.source_id,
            'schema': self.schema,
            'query': self.query,
            'table_name': self.table_name,
            'tags': self.tags,
            'pii_columns': self.pii_columns,
            'created_by': self.created_by,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


# Nexus Analytics Studio Backend

This is the Flask backend for Nexus Analytics Studio, a data analytics and visualization platform.

## Features

- User authentication and role-based access control
- Data source management
- Dataset creation and management
- Chart generation and configuration
- Dashboard building with drag-and-drop layout
- Collaboration features including comments and shared dashboards

## Setup Instructions

### Prerequisites

- Python 3.8+
- PostgreSQL
- Redis (for caching and Celery tasks)

### Installation

1. Clone the repository
2. Create a virtual environment:
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```
   pip install -r requirements.txt
   ```
4. Create a `.env` file based on `.env.example`
5. Initialize the database:
   ```
   flask db init
   flask db migrate -m "Initial migration"
   flask db upgrade
   ```
6. Run the development server:
   ```
   flask run
   ```

## API Documentation

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login and receive JWT tokens
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user information

### Users

- `GET /api/users/` - Get all users (admin only)
- `GET /api/users/<user_id>` - Get user information
- `PUT /api/users/<user_id>` - Update user information
- `DELETE /api/users/<user_id>` - Delete a user (admin only)
- `GET /api/users/roles` - Get all available roles (admin only)

### Data Sources

- `GET /api/datasources/` - Get all data sources
- `GET /api/datasources/<source_id>` - Get data source details
- `POST /api/datasources/` - Create a new data source
- `PUT /api/datasources/<source_id>` - Update a data source
- `DELETE /api/datasources/<source_id>` - Delete a data source
- `POST /api/datasources/<source_id>/test` - Test data source connection
- `GET /api/datasources/<source_id>/tables` - List tables in data source

### Datasets

- `GET /api/datasets/` - Get all datasets
- `GET /api/datasets/<dataset_id>` - Get dataset details
- `POST /api/datasets/` - Create a new dataset
- `PUT /api/datasets/<dataset_id>` - Update a dataset
- `DELETE /api/datasets/<dataset_id>` - Delete a dataset
- `GET /api/datasets/<dataset_id>/preview` - Preview dataset data
- `POST /api/datasets/upload` - Upload a file for dataset creation

### Charts

- `GET /api/charts/` - Get all charts
- `GET /api/charts/<chart_id>` - Get chart details
- `POST /api/charts/` - Create a new chart
- `PUT /api/charts/<chart_id>` - Update a chart
- `DELETE /api/charts/<chart_id>` - Delete a chart
- `GET /api/charts/<chart_id>/data` - Get data for a chart

### Dashboards

- `GET /api/dashboards/` - Get all dashboards
- `GET /api/dashboards/<dashboard_id>` - Get dashboard details
- `POST /api/dashboards/` - Create a new dashboard
- `PUT /api/dashboards/<dashboard_id>` - Update a dashboard
- `DELETE /api/dashboards/<dashboard_id>` - Delete a dashboard
- `POST /api/dashboards/<dashboard_id>/charts` - Add a chart to a dashboard
- `PUT /api/dashboards/<dashboard_id>/charts/<chart_id>` - Update chart position
- `DELETE /api/dashboards/<dashboard_id>/charts/<chart_id>` - Remove chart from dashboard
- `POST /api/dashboards/<dashboard_id>/comments` - Add a comment to a dashboard
- `GET /api/dashboards/<dashboard_id>/comments` - Get dashboard comments
- `GET /api/dashboards/<dashboard_id>/export` - Export dashboard

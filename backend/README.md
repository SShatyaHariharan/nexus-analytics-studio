
# VisualX Backend API

This is the backend API for the VisualX data visualization and analytics platform.

## Setup

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
4. Set up PostgreSQL and Redis
5. Download sample car sales data from [Kaggle](https://www.kaggle.com/datasets/gagandeep16/car-sales) and save it to `backend/sample_data/car_sales.csv`
6. Initialize the database:
   ```
   python init_db.py
   ```
7. Run the application:
   ```
   python run.py
   ```

## API Documentation

### Authentication

#### Register User

```
POST /api/auth/register

Request:
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "securepass",
  "first_name": "John",
  "last_name": "Doe",
  "role": "user"  // Optional, defaults to "user"
}

Response:
{
  "message": "User registered successfully"
}
```

#### Login

```
POST /api/auth/login

Request:
{
  "username": "johndoe",  // or email
  "password": "securepass"
}

Response:
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "user": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "username": "johndoe",
    "email": "john@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "user",
    "is_active": true,
    "created_at": "2023-01-01T00:00:00",
    "last_login": "2023-01-02T00:00:00"
  }
}
```

### Data Sources

#### List Data Sources

```
GET /api/datasources?page=1&per_page=20

Response:
{
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "name": "Sample Car Sales",
      "description": "Sample car sales data from Kaggle",
      "type": "file",
      "created_by": "123e4567-e89b-12d3-a456-426614174001",
      "created_at": "2023-01-01T00:00:00",
      "updated_at": "2023-01-01T00:00:00"
    }
  ],
  "total": 1,
  "pages": 1,
  "page": 1,
  "per_page": 20
}
```

#### Get Data Source

```
GET /api/datasources/{source_id}

Response:
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "Sample Car Sales",
  "description": "Sample car sales data from Kaggle",
  "type": "file",
  "created_by": "123e4567-e89b-12d3-a456-426614174001",
  "created_at": "2023-01-01T00:00:00",
  "updated_at": "2023-01-01T00:00:00"
}
```

#### Create Data Source (JSON)

```
POST /api/datasources

Request:
{
  "name": "New Data Source",
  "description": "Description of the data source",
  "type": "database",
  "connection_params": {
    "host": "localhost",
    "port": "5432",
    "database": "mydb",
    "user": "user",
    "password": "password"
  }
}

Response:
{
  "id": "123e4567-e89b-12d3-a456-426614174002",
  "name": "New Data Source",
  "description": "Description of the data source",
  "type": "database",
  "created_by": "123e4567-e89b-12d3-a456-426614174001",
  "created_at": "2023-01-01T00:00:00",
  "updated_at": "2023-01-01T00:00:00"
}
```

#### Create Data Source (File Upload)

```
POST /api/datasources
Content-Type: multipart/form-data

Form Fields:
- name: "Sales Data"
- description: "Monthly sales data"
- file: [file upload]

Response:
{
  "id": "123e4567-e89b-12d3-a456-426614174003",
  "name": "Sales Data",
  "description": "Monthly sales data",
  "type": "file",
  "connection_params": {
    "file_path": "/path/to/uploaded/file.csv",
    "file_type": "csv",
    "rows": 1000,
    "columns": 10
  },
  "created_by": "123e4567-e89b-12d3-a456-426614174001",
  "created_at": "2023-01-01T00:00:00",
  "updated_at": "2023-01-01T00:00:00",
  "file_info": {
    "rows": 1000,
    "columns": 10,
    "column_types": [...],
    "pii_columns": [...],
    "sample_data": [...]
  }
}
```

### Datasets

#### List Datasets

```
GET /api/datasets?page=1&per_page=20

Response:
{
  "data": [...],
  "total": 10,
  "pages": 1,
  "page": 1,
  "per_page": 20
}
```

#### Create Dataset

```
POST /api/datasets

Request:
{
  "name": "Car Sales Analysis",
  "description": "Filtered car sales data",
  "source_id": "123e4567-e89b-12d3-a456-426614174000",
  "query": "SELECT Make, Model, Year, Price FROM car_sales WHERE Year > 2018",
  "tags": ["sales", "cars", "analysis"]
}

Response:
{
  "id": "123e4567-e89b-12d3-a456-426614174004",
  "name": "Car Sales Analysis",
  "description": "Filtered car sales data",
  "source_id": "123e4567-e89b-12d3-a456-426614174000",
  "query": "SELECT Make, Model, Year, Price FROM car_sales WHERE Year > 2018",
  "tags": ["sales", "cars", "analysis"],
  "created_by": "123e4567-e89b-12d3-a456-426614174001",
  "created_at": "2023-01-01T00:00:00",
  "updated_at": "2023-01-01T00:00:00"
}
```

#### Execute Query

```
POST /api/datasets/execute-query

Request:
{
  "source_id": "123e4567-e89b-12d3-a456-426614174000",
  "query": "SELECT Make, Model, AVG(Price) as AvgPrice FROM car_sales GROUP BY Make, Model"
}

Response:
{
  "columns": ["Make", "Model", "AvgPrice"],
  "rows": [...],
  "total_rows": 50,
  "schema": [
    {"name": "Make", "type": "object"},
    {"name": "Model", "type": "object"},
    {"name": "AvgPrice", "type": "float64"}
  ]
}
```

### Charts

#### Create Chart

```
POST /api/charts

Request:
{
  "name": "Average Car Prices by Make",
  "description": "Bar chart showing average prices",
  "dataset_id": "123e4567-e89b-12d3-a456-426614174004",
  "chart_type": "bar",
  "configuration": {
    "xAxis": "Make",
    "yAxis": "AvgPrice",
    "colors": ["#9b87f5", "#7E69AB"]
  },
  "query_params": {
    "filters": {
      "Year": {"min": 2018, "max": 2023}
    }
  }
}

Response:
{
  "id": "123e4567-e89b-12d3-a456-426614174005",
  "name": "Average Car Prices by Make",
  "description": "Bar chart showing average prices",
  "dataset_id": "123e4567-e89b-12d3-a456-426614174004",
  "chart_type": "bar",
  "configuration": {
    "xAxis": "Make",
    "yAxis": "AvgPrice",
    "colors": ["#9b87f5", "#7E69AB"]
  },
  "query_params": {
    "filters": {
      "Year": {"min": 2018, "max": 2023}
    }
  },
  "created_by": "123e4567-e89b-12d3-a456-426614174001",
  "created_at": "2023-01-01T00:00:00",
  "updated_at": "2023-01-01T00:00:00"
}
```

### Dashboards

#### Create Dashboard

```
POST /api/dashboards

Request:
{
  "name": "Car Sales Dashboard",
  "description": "Overview of car sales data",
  "layout": {
    "columns": 12,
    "rowHeight": 50
  },
  "filters": {
    "Year": {"type": "range", "min": 2010, "max": 2023},
    "Make": {"type": "select", "options": ["Toyota", "Honda", "Ford"]}
  },
  "theme": "light",
  "is_public": true
}

Response:
{
  "id": "123e4567-e89b-12d3-a456-426614174006",
  "name": "Car Sales Dashboard",
  "description": "Overview of car sales data",
  "layout": {
    "columns": 12,
    "rowHeight": 50
  },
  "filters": {
    "Year": {"type": "range", "min": 2010, "max": 2023},
    "Make": {"type": "select", "options": ["Toyota", "Honda", "Ford"]}
  },
  "theme": "light",
  "is_public": true,
  "created_by": "123e4567-e89b-12d3-a456-426614174001",
  "created_at": "2023-01-01T00:00:00",
  "updated_at": "2023-01-01T00:00:00"
}
```

#### Add Chart to Dashboard

```
POST /api/dashboards/{dashboard_id}/charts

Request:
{
  "chart_id": "123e4567-e89b-12d3-a456-426614174005",
  "position": {
    "x": 0,
    "y": 0,
    "w": 6,
    "h": 4
  }
}

Response:
{
  "id": "123e4567-e89b-12d3-a456-426614174007",
  "dashboard_id": "123e4567-e89b-12d3-a456-426614174006",
  "chart_id": "123e4567-e89b-12d3-a456-426614174005",
  "position": {
    "x": 0,
    "y": 0,
    "w": 6,
    "h": 4
  }
}
```

## Default Users

The system comes with three default users:

1. Admin
   - Username: admin
   - Password: admin123
   - Role: admin

2. Analyst
   - Username: analyst
   - Password: analyst123
   - Role: analyst

3. Regular User
   - Username: user
   - Password: user123
   - Role: user

## Role-Based Permissions

- Admin: Full access to all features
- Analyst: Can create and manage datasets, charts, and dashboards
- User: Can view dashboards and charts

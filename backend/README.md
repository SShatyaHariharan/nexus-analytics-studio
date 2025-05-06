
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

## API Documentation with cURL Examples

### Authentication

#### Register User

```
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "email": "john@example.com",
    "password": "securepass",
    "first_name": "John",
    "last_name": "Doe",
    "role": "user"
  }'

Response:
{
  "message": "User registered successfully"
}
```

#### Login

```
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "password": "securepass"
  }'

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
curl -X GET http://localhost:5000/api/datasources?page=1&per_page=20 \
  -H "Authorization: Bearer your_access_token"

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
curl -X GET http://localhost:5000/api/datasources/your_source_id \
  -H "Authorization: Bearer your_access_token"

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
curl -X POST http://localhost:5000/api/datasources \
  -H "Authorization: Bearer your_access_token" \
  -H "Content-Type: application/json" \
  -d '{
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
  }'

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
curl -X POST http://localhost:5000/api/datasources \
  -H "Authorization: Bearer your_access_token" \
  -F "name=Sales Data" \
  -F "description=Monthly sales data" \
  -F "file=@/path/to/your/file.csv"

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
curl -X GET http://localhost:5000/api/datasets?page=1&per_page=20 \
  -H "Authorization: Bearer your_access_token"

Response:
{
  "data": [...],
  "total": 10,
  "pages": 1,
  "page": 1,
  "per_page": 20
}
```

#### Get Dataset

```
curl -X GET http://localhost:5000/api/datasets/your_dataset_id \
  -H "Authorization: Bearer your_access_token"

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

#### Create Dataset

```
curl -X POST http://localhost:5000/api/datasets \
  -H "Authorization: Bearer your_access_token" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Car Sales Analysis",
    "description": "Filtered car sales data",
    "source_id": "123e4567-e89b-12d3-a456-426614174000",
    "query": "SELECT Make, Model, Year, Price FROM car_sales WHERE Year > 2018",
    "tags": ["sales", "cars", "analysis"]
  }'

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
curl -X POST http://localhost:5000/api/datasets/execute-query \
  -H "Authorization: Bearer your_access_token" \
  -H "Content-Type: application/json" \
  -d '{
    "source_id": "123e4567-e89b-12d3-a456-426614174000",
    "query": "SELECT Make, Model, AVG(Price) as AvgPrice FROM car_sales GROUP BY Make, Model"
  }'

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
curl -X POST http://localhost:5000/api/charts \
  -H "Authorization: Bearer your_access_token" \
  -H "Content-Type: application/json" \
  -d '{
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
  }'

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

#### List Dashboards

```
curl -X GET http://localhost:5000/api/dashboards?page=1&per_page=20 \
  -H "Authorization: Bearer your_access_token"

Response:
{
  "data": [...],
  "total": 5,
  "pages": 1,
  "page": 1,
  "per_page": 20
}
```

#### Create Dashboard

```
curl -X POST http://localhost:5000/api/dashboards \
  -H "Authorization: Bearer your_access_token" \
  -H "Content-Type: application/json" \
  -d '{
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
  }'

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
curl -X POST http://localhost:5000/api/dashboards/your_dashboard_id/charts \
  -H "Authorization: Bearer your_access_token" \
  -H "Content-Type: application/json" \
  -d '{
    "chart_id": "123e4567-e89b-12d3-a456-426614174005",
    "position": {
      "x": 0,
      "y": 0,
      "w": 6,
      "h": 4
    }
  }'

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

## API Testing with Postman

You can import the provided `VisualX_API_Collection.json` file into Postman to test all the API endpoints. The collection includes request examples for all endpoints with pre-configured headers and example request bodies.

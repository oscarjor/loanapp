# Property Valuation Service

A stateless FastAPI microservice for calculating commercial real estate property valuations.

## Features

- **Stateless Design**: No database required, pure calculation service
- **Property Types Supported**: Multifamily, Retail, Office, Industrial
- **Formula-Based Valuation**: Transparent, predictable valuation methodology
- **Comprehensive Testing**: Unit tests with pytest
- **API Documentation**: Auto-generated OpenAPI/Swagger docs
- **CORS Enabled**: Ready for frontend integration

## Tech Stack

- **FastAPI**: Modern Python web framework
- **Pydantic**: Data validation and settings
- **Uvicorn**: ASGI server
- **Pytest**: Testing framework

## Setup

### Prerequisites

- Python 3.9 or higher
- pip

### Installation

1. **Create virtual environment**:
   ```bash
   cd valuation_service
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure environment** (optional):
   ```bash
   cp .env.example .env
   # Edit .env if needed
   ```

## Running the Service

### Development Server

```bash
uvicorn app.main:app --reload --port 8000
```

Or use the built-in runner:

```bash
python -m app.main
```

The service will be available at:
- API: http://localhost:8000
- Interactive docs: http://localhost:8000/docs
- Alternative docs: http://localhost:8000/redoc

### Production Server

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

## API Usage

### Endpoint: POST /api/v1/valuate

Calculate property valuation.

**Request Body**:
```json
{
  "property_type": "MULTIFAMILY",
  "size_sqft": 50000,
  "age_years": 15
}
```

**Property Types**:
- `MULTIFAMILY` - $200/sqft base rate
- `RETAIL` - $150/sqft base rate
- `OFFICE` - $180/sqft base rate
- `INDUSTRIAL` - $100/sqft base rate

**Response**:
```json
{
  "estimated_value": 8500000.00,
  "valuation_date": "2024-12-11T10:30:00Z",
  "methodology": "Base rate ($200/sqft) with 15.0% age depreciation",
  "breakdown": {
    "base_value": 10000000.00,
    "depreciation_factor": 0.15,
    "final_value": 8500000.00
  }
}
```

### Endpoint: GET /api/v1/health

Health check endpoint.

**Response**:
```json
{
  "status": "healthy",
  "service": "valuation-service",
  "version": "1.0.0"
}
```

## Valuation Methodology

The service uses a formula-based approach:

1. **Base Value** = `size_sqft × base_rate[property_type]`
2. **Depreciation** = `min(age_years × 0.01, 0.40)` (1% per year, max 40%)
3. **Final Value** = `base_value × (1 - depreciation)`

### Base Rates by Property Type

| Property Type | Base Rate |
|--------------|-----------|
| Multifamily  | $200/sqft |
| Retail       | $150/sqft |
| Office       | $180/sqft |
| Industrial   | $100/sqft |

### Depreciation Rules

- **Annual Rate**: 1% per year
- **Maximum**: 40% (reached at 40 years)
- **New Buildings**: 0% depreciation

## Testing

### Run All Tests

```bash
pytest
```

### Run with Coverage Report

```bash
pytest --cov=app --cov-report=html
```

### Run Specific Test File

```bash
pytest tests/test_valuation_engine.py
```

### Run Specific Test

```bash
pytest tests/test_api.py::TestAPI::test_valuate_multifamily_success
```

### Test Coverage

The test suite includes:
- **Valuation Engine Tests**: Core calculation logic
- **API Endpoint Tests**: FastAPI route testing
- **Model Validation Tests**: Pydantic model validation
- **Edge Case Tests**: Boundary conditions and error handling

## Project Structure

```
valuation_service/
├── app/
│   ├── __init__.py
│   ├── main.py                    # FastAPI application
│   ├── config.py                  # Configuration settings
│   ├── api/
│   │   ├── __init__.py
│   │   └── routes.py              # API endpoints
│   ├── models/
│   │   ├── __init__.py
│   │   ├── request.py             # Request models
│   │   └── response.py            # Response models
│   └── services/
│       ├── __init__.py
│       └── valuation_engine.py    # Valuation logic
├── tests/
│   ├── __init__.py
│   ├── test_valuation_engine.py   # Engine tests
│   ├── test_api.py                # API tests
│   └── test_models.py             # Model tests
├── .env.example
├── .gitignore
├── pytest.ini
├── requirements.txt
└── README.md
```

## Error Handling

The service provides clear error messages:

- **422 Unprocessable Entity**: Invalid input data
  - Zero or negative size
  - Negative age
  - Invalid property type
  - Size exceeds 10M sqft
  - Age exceeds 200 years

- **500 Internal Server Error**: Calculation errors

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| HOST | 0.0.0.0 | Server host |
| PORT | 8000 | Server port |
| RELOAD | True | Auto-reload on code changes |
| ALLOWED_ORIGINS | http://localhost:3000 | CORS allowed origins |
| LOG_LEVEL | INFO | Logging level |

## Integration with Main App

The main application should call this service via HTTP:

```typescript
// Example TypeScript/JavaScript client
const response = await fetch('http://localhost:8000/api/v1/valuate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    property_type: 'MULTIFAMILY',
    size_sqft: 50000,
    age_years: 15
  })
});

const valuation = await response.json();
console.log(valuation.estimated_value);
```

## License

MIT

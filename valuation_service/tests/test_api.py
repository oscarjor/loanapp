import pytest
from fastapi.testclient import TestClient
from app.main import app


class TestAPI:
    """Test suite for FastAPI endpoints."""

    @pytest.fixture
    def client(self):
        """Create a test client."""
        return TestClient(app)

    def test_root_endpoint(self, client):
        """Test root endpoint."""
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "version" in data
        assert data["version"] == "1.0.0"

    def test_health_check(self, client):
        """Test health check endpoint."""
        response = client.get("/api/v1/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["service"] == "valuation-service"

    def test_valuate_multifamily_success(self, client):
        """Test successful valuation request for multifamily property."""
        payload = {
            "property_type": "MULTIFAMILY",
            "size_sqft": 50000,
            "age_years": 15
        }

        response = client.post("/api/v1/valuate", json=payload)
        assert response.status_code == 200

        data = response.json()
        assert "estimated_value" in data
        assert "valuation_date" in data
        assert "methodology" in data
        assert "breakdown" in data

        # Verify calculation
        # Base: 50,000 * $200 = $10,000,000
        # Depreciation: 15%
        # Final: $10,000,000 * 0.85 = $8,500,000
        assert data["estimated_value"] == 8_500_000.00
        assert data["breakdown"]["base_value"] == 10_000_000.00
        assert data["breakdown"]["depreciation_factor"] == 0.15

    def test_valuate_retail_success(self, client):
        """Test successful valuation request for retail property."""
        payload = {
            "property_type": "RETAIL",
            "size_sqft": 10000,
            "age_years": 10
        }

        response = client.post("/api/v1/valuate", json=payload)
        assert response.status_code == 200

        data = response.json()
        # Base: 10,000 * $150 = $1,500,000
        # Depreciation: 10%
        # Final: $1,500,000 * 0.90 = $1,350,000
        assert data["estimated_value"] == 1_350_000.00

    def test_valuate_office_success(self, client):
        """Test successful valuation request for office property."""
        payload = {
            "property_type": "OFFICE",
            "size_sqft": 25000,
            "age_years": 5
        }

        response = client.post("/api/v1/valuate", json=payload)
        assert response.status_code == 200

        data = response.json()
        # Base: 25,000 * $180 = $4,500,000
        # Depreciation: 5%
        # Final: $4,500,000 * 0.95 = $4,275,000
        assert data["estimated_value"] == 4_275_000.00

    def test_valuate_industrial_success(self, client):
        """Test successful valuation request for industrial property."""
        payload = {
            "property_type": "INDUSTRIAL",
            "size_sqft": 100000,
            "age_years": 20
        }

        response = client.post("/api/v1/valuate", json=payload)
        assert response.status_code == 200

        data = response.json()
        # Base: 100,000 * $100 = $10,000,000
        # Depreciation: 20%
        # Final: $10,000,000 * 0.80 = $8,000,000
        assert data["estimated_value"] == 8_000_000.00

    def test_valuate_new_building(self, client):
        """Test valuation of new building (age 0)."""
        payload = {
            "property_type": "MULTIFAMILY",
            "size_sqft": 20000,
            "age_years": 0
        }

        response = client.post("/api/v1/valuate", json=payload)
        assert response.status_code == 200

        data = response.json()
        # No depreciation for new building
        assert data["breakdown"]["depreciation_factor"] == 0.0
        assert data["estimated_value"] == data["breakdown"]["base_value"]

    def test_valuate_invalid_property_type(self, client):
        """Test valuation with invalid property type."""
        payload = {
            "property_type": "RESIDENTIAL",  # Invalid type
            "size_sqft": 10000,
            "age_years": 10
        }

        response = client.post("/api/v1/valuate", json=payload)
        assert response.status_code == 422  # Validation error

    def test_valuate_zero_size(self, client):
        """Test valuation with zero size."""
        payload = {
            "property_type": "OFFICE",
            "size_sqft": 0,
            "age_years": 10
        }

        response = client.post("/api/v1/valuate", json=payload)
        assert response.status_code == 422

    def test_valuate_negative_size(self, client):
        """Test valuation with negative size."""
        payload = {
            "property_type": "OFFICE",
            "size_sqft": -5000,
            "age_years": 10
        }

        response = client.post("/api/v1/valuate", json=payload)
        assert response.status_code == 422

    def test_valuate_negative_age(self, client):
        """Test valuation with negative age."""
        payload = {
            "property_type": "RETAIL",
            "size_sqft": 10000,
            "age_years": -5
        }

        response = client.post("/api/v1/valuate", json=payload)
        assert response.status_code == 422

    def test_valuate_missing_field(self, client):
        """Test valuation with missing required field."""
        payload = {
            "property_type": "OFFICE",
            "size_sqft": 10000
            # Missing age_years
        }

        response = client.post("/api/v1/valuate", json=payload)
        assert response.status_code == 422

    def test_valuate_invalid_type_string_for_size(self, client):
        """Test valuation with invalid type for size_sqft."""
        payload = {
            "property_type": "OFFICE",
            "size_sqft": "ten thousand",  # Should be int
            "age_years": 10
        }

        response = client.post("/api/v1/valuate", json=payload)
        assert response.status_code == 422

    def test_valuate_extremely_large_size(self, client):
        """Test valuation with extremely large size."""
        payload = {
            "property_type": "INDUSTRIAL",
            "size_sqft": 15_000_000,  # Exceeds max allowed
            "age_years": 10
        }

        response = client.post("/api/v1/valuate", json=payload)
        assert response.status_code == 422

    def test_valuate_extremely_old_building(self, client):
        """Test valuation with extremely old building."""
        payload = {
            "property_type": "OFFICE",
            "size_sqft": 10000,
            "age_years": 250  # Exceeds reasonable limit
        }

        response = client.post("/api/v1/valuate", json=payload)
        assert response.status_code == 422

    def test_valuate_max_depreciation(self, client):
        """Test that depreciation is capped at 40%."""
        payload = {
            "property_type": "MULTIFAMILY",
            "size_sqft": 30000,
            "age_years": 60  # Should result in max depreciation
        }

        response = client.post("/api/v1/valuate", json=payload)
        assert response.status_code == 200

        data = response.json()
        # Depreciation should be capped at 40%
        assert data["breakdown"]["depreciation_factor"] == 0.40

    def test_openapi_docs_available(self, client):
        """Test that OpenAPI documentation is available."""
        response = client.get("/openapi.json")
        assert response.status_code == 200

        openapi = response.json()
        assert openapi["info"]["title"] == "Property Valuation Service"
        assert "/api/v1/valuate" in openapi["paths"]
        assert "/api/v1/health" in openapi["paths"]

    def test_cors_headers(self, client):
        """Test that CORS headers are properly configured."""
        headers = {
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "POST"
        }

        response = client.options("/api/v1/valuate", headers=headers)
        # FastAPI's CORS middleware handles OPTIONS requests
        assert response.status_code in [200, 204]

    def test_response_structure(self, client):
        """Test that response has correct structure."""
        payload = {
            "property_type": "RETAIL",
            "size_sqft": 5000,
            "age_years": 8
        }

        response = client.post("/api/v1/valuate", json=payload)
        assert response.status_code == 200

        data = response.json()

        # Check top-level fields
        assert isinstance(data["estimated_value"], (int, float))
        assert isinstance(data["valuation_date"], str)
        assert isinstance(data["methodology"], str)
        assert isinstance(data["breakdown"], dict)

        # Check breakdown fields
        breakdown = data["breakdown"]
        assert isinstance(breakdown["base_value"], (int, float))
        assert isinstance(breakdown["depreciation_factor"], (int, float))
        assert isinstance(breakdown["final_value"], (int, float))

        # Verify depreciation_factor is between 0 and 1
        assert 0 <= breakdown["depreciation_factor"] <= 1

    def test_multiple_requests(self, client):
        """Test multiple sequential requests."""
        payload = {
            "property_type": "OFFICE",
            "size_sqft": 15000,
            "age_years": 12
        }

        # Make multiple requests
        for _ in range(3):
            response = client.post("/api/v1/valuate", json=payload)
            assert response.status_code == 200

            data = response.json()
            assert data["estimated_value"] > 0

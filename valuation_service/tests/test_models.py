"""Tests for request and response models."""
from datetime import datetime

import pytest
from pydantic import ValidationError

from app.models.request import ValuationRequest, PropertyType
from app.models.response import ValuationResponse, ValuationBreakdown


class TestValuationRequest:
    """Test suite for ValuationRequest model."""

    def test_valid_request(self):
        """Test creating a valid valuation request."""
        request = ValuationRequest(
            property_type=PropertyType.MULTIFAMILY,
            size_sqft=50000,
            age_years=15
        )

        assert request.property_type == PropertyType.MULTIFAMILY
        assert request.size_sqft == 50000
        assert request.age_years == 15

    def test_all_property_types(self):
        """Test all valid property types."""
        for prop_type in PropertyType:
            request = ValuationRequest(
                property_type=prop_type,
                size_sqft=10000,
                age_years=10
            )
            assert request.property_type == prop_type

    def test_invalid_property_type(self):
        """Test invalid property type raises error."""
        with pytest.raises(ValidationError):
            ValuationRequest(
                property_type="RESIDENTIAL",
                size_sqft=10000,
                age_years=10
            )

    def test_zero_size_sqft(self):
        """Test that zero size_sqft raises error."""
        with pytest.raises(ValidationError):
            ValuationRequest(
                property_type=PropertyType.OFFICE,
                size_sqft=0,
                age_years=10
            )

    def test_negative_size_sqft(self):
        """Test that negative size_sqft raises error."""
        with pytest.raises(ValidationError):
            ValuationRequest(
                property_type=PropertyType.OFFICE,
                size_sqft=-1000,
                age_years=10
            )

    def test_negative_age_years(self):
        """Test that negative age_years raises error."""
        with pytest.raises(ValidationError):
            ValuationRequest(
                property_type=PropertyType.RETAIL,
                size_sqft=10000,
                age_years=-5
            )

    def test_excessive_size_sqft(self):
        """Test that excessive size_sqft raises error."""
        with pytest.raises(ValidationError):
            ValuationRequest(
                property_type=PropertyType.INDUSTRIAL,
                size_sqft=15_000_000,  # Exceeds max
                age_years=10
            )

    def test_excessive_age_years(self):
        """Test that excessive age_years raises error."""
        with pytest.raises(ValidationError):
            ValuationRequest(
                property_type=PropertyType.OFFICE,
                size_sqft=10000,
                age_years=250  # Exceeds limit
            )

    def test_missing_required_field(self):
        """Test that missing required field raises error."""
        with pytest.raises(ValidationError):
            ValuationRequest(
                property_type=PropertyType.OFFICE,
                size_sqft=10000
                # Missing age_years
            )

    def test_json_serialization(self):
        """Test that request can be serialized to JSON."""
        request = ValuationRequest(
            property_type=PropertyType.RETAIL,
            size_sqft=5000,
            age_years=8
        )

        json_data = request.model_dump()
        assert json_data["property_type"] == "RETAIL"
        assert json_data["size_sqft"] == 5000
        assert json_data["age_years"] == 8

    def test_string_property_type(self):
        """Test that string property type is accepted."""
        request = ValuationRequest(
            property_type="MULTIFAMILY",
            size_sqft=20000,
            age_years=10
        )

        assert request.property_type == PropertyType.MULTIFAMILY


class TestValuationBreakdown:
    """Test suite for ValuationBreakdown model."""

    def test_valid_breakdown(self):
        """Test creating a valid breakdown."""
        breakdown = ValuationBreakdown(
            base_value=10000000.00,
            depreciation_factor=0.15,
            final_value=8500000.00
        )

        assert breakdown.base_value == 10000000.00
        assert breakdown.depreciation_factor == 0.15
        assert breakdown.final_value == 8500000.00

    def test_zero_depreciation(self):
        """Test breakdown with zero depreciation."""
        breakdown = ValuationBreakdown(
            base_value=5000000.00,
            depreciation_factor=0.0,
            final_value=5000000.00
        )

        assert breakdown.depreciation_factor == 0.0

    def test_max_depreciation(self):
        """Test breakdown with maximum depreciation."""
        breakdown = ValuationBreakdown(
            base_value=10000000.00,
            depreciation_factor=0.40,
            final_value=6000000.00
        )

        assert breakdown.depreciation_factor == 0.40

    def test_invalid_depreciation_negative(self):
        """Test that negative depreciation raises error."""
        with pytest.raises(ValidationError):
            ValuationBreakdown(
                base_value=10000000.00,
                depreciation_factor=-0.1,
                final_value=11000000.00
            )

    def test_invalid_depreciation_exceeds_one(self):
        """Test that depreciation > 1 raises error."""
        with pytest.raises(ValidationError):
            ValuationBreakdown(
                base_value=10000000.00,
                depreciation_factor=1.5,
                final_value=-5000000.00
            )


class TestValuationResponse:
    """Test suite for ValuationResponse model."""

    def test_valid_response(self):
        """Test creating a valid valuation response."""
        breakdown = ValuationBreakdown(
            base_value=2000000.00,
            depreciation_factor=0.10,
            final_value=1800000.00
        )

        response = ValuationResponse(
            estimated_value=1800000.00,
            valuation_date=datetime.utcnow(),
            methodology="Base rate with depreciation",
            breakdown=breakdown
        )

        assert response.estimated_value == 1800000.00
        assert isinstance(response.valuation_date, datetime)
        assert response.methodology == "Base rate with depreciation"
        assert response.breakdown == breakdown

    def test_default_valuation_date(self):
        """Test that valuation_date has default value."""
        breakdown = ValuationBreakdown(
            base_value=1000000.00,
            depreciation_factor=0.05,
            final_value=950000.00
        )

        response = ValuationResponse(
            estimated_value=950000.00,
            methodology="Test methodology",
            breakdown=breakdown
        )

        assert response.valuation_date is not None
        assert isinstance(response.valuation_date, datetime)

    def test_invalid_zero_estimated_value(self):
        """Test that zero estimated_value raises error."""
        breakdown = ValuationBreakdown(
            base_value=0.00,
            depreciation_factor=0.0,
            final_value=0.00
        )

        with pytest.raises(ValidationError):
            ValuationResponse(
                estimated_value=0.00,
                methodology="Test",
                breakdown=breakdown
            )

    def test_invalid_negative_estimated_value(self):
        """Test that negative estimated_value raises error."""
        breakdown = ValuationBreakdown(
            base_value=1000000.00,
            depreciation_factor=0.5,
            final_value=500000.00
        )

        with pytest.raises(ValidationError):
            ValuationResponse(
                estimated_value=-100000.00,
                methodology="Test",
                breakdown=breakdown
            )

    def test_json_serialization(self):
        """Test that response can be serialized to JSON."""
        breakdown = ValuationBreakdown(
            base_value=5000000.00,
            depreciation_factor=0.20,
            final_value=4000000.00
        )

        response = ValuationResponse(
            estimated_value=4000000.00,
            methodology="Test methodology",
            breakdown=breakdown
        )

        json_data = response.model_dump()
        assert json_data["estimated_value"] == 4000000.00
        assert "valuation_date" in json_data
        assert json_data["methodology"] == "Test methodology"
        assert "breakdown" in json_data
        assert json_data["breakdown"]["base_value"] == 5000000.00

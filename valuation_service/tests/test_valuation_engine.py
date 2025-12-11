import pytest
from decimal import Decimal
from app.services.valuation_engine import ValuationEngine
from app.models.request import PropertyType
from app.models.response import ValuationResponse


class TestValuationEngine:
    """Test suite for ValuationEngine."""

    @pytest.fixture
    def engine(self):
        """Create a ValuationEngine instance for testing."""
        return ValuationEngine()

    def test_multifamily_new_building(self, engine):
        """Test valuation of a new multifamily property."""
        result = engine.calculate_value(
            property_type=PropertyType.MULTIFAMILY,
            size_sqft=10000,
            age_years=0
        )

        # New building: no depreciation
        # Base: 10,000 sqft * $200/sqft = $2,000,000
        assert result.estimated_value == 2_000_000.00
        assert result.breakdown.base_value == 2_000_000.00
        assert result.breakdown.depreciation_factor == 0.0
        assert result.breakdown.final_value == 2_000_000.00
        assert isinstance(result, ValuationResponse)

    def test_retail_with_depreciation(self, engine):
        """Test valuation of retail property with age depreciation."""
        result = engine.calculate_value(
            property_type=PropertyType.RETAIL,
            size_sqft=5000,
            age_years=10
        )

        # Base: 5,000 sqft * $150/sqft = $750,000
        # Depreciation: 10 years * 1% = 10%
        # Final: $750,000 * (1 - 0.10) = $675,000
        assert result.estimated_value == 675_000.00
        assert result.breakdown.base_value == 750_000.00
        assert result.breakdown.depreciation_factor == 0.10
        assert result.breakdown.final_value == 675_000.00

    def test_office_moderate_age(self, engine):
        """Test valuation of office property with moderate age."""
        result = engine.calculate_value(
            property_type=PropertyType.OFFICE,
            size_sqft=50000,
            age_years=15
        )

        # Base: 50,000 sqft * $180/sqft = $9,000,000
        # Depreciation: 15 years * 1% = 15%
        # Final: $9,000,000 * (1 - 0.15) = $7,650,000
        assert result.estimated_value == 7_650_000.00
        assert result.breakdown.base_value == 9_000_000.00
        assert result.breakdown.depreciation_factor == 0.15
        assert result.breakdown.final_value == 7_650_000.00

    def test_industrial_max_depreciation(self, engine):
        """Test valuation with maximum depreciation (40%)."""
        result = engine.calculate_value(
            property_type=PropertyType.INDUSTRIAL,
            size_sqft=100000,
            age_years=50  # 50% depreciation, but capped at 40%
        )

        # Base: 100,000 sqft * $100/sqft = $10,000,000
        # Depreciation: min(50 * 1%, 40%) = 40%
        # Final: $10,000,000 * (1 - 0.40) = $6,000,000
        assert result.estimated_value == 6_000_000.00
        assert result.breakdown.base_value == 10_000_000.00
        assert result.breakdown.depreciation_factor == 0.40
        assert result.breakdown.final_value == 6_000_000.00

    def test_very_old_building_depreciation_cap(self, engine):
        """Test that depreciation is capped at 40% even for very old buildings."""
        result = engine.calculate_value(
            property_type=PropertyType.MULTIFAMILY,
            size_sqft=10000,
            age_years=100  # 100 years old
        )

        # Depreciation should be capped at 40%
        assert result.breakdown.depreciation_factor == 0.40
        # Base: 10,000 * $200 = $2,000,000
        # Final: $2,000,000 * 0.60 = $1,200,000
        assert result.estimated_value == 1_200_000.00

    def test_all_property_types(self, engine):
        """Test that all property types can be valued."""
        size_sqft = 10000
        age_years = 10

        for property_type in PropertyType:
            result = engine.calculate_value(
                property_type=property_type,
                size_sqft=size_sqft,
                age_years=age_years
            )
            assert result.estimated_value > 0
            assert result.breakdown.depreciation_factor == 0.10

    def test_invalid_size_zero(self, engine):
        """Test that zero size raises ValueError."""
        with pytest.raises(ValueError, match="Property size must be greater than 0"):
            engine.calculate_value(
                property_type=PropertyType.OFFICE,
                size_sqft=0,
                age_years=10
            )

    def test_invalid_size_negative(self, engine):
        """Test that negative size raises ValueError."""
        with pytest.raises(ValueError, match="Property size must be greater than 0"):
            engine.calculate_value(
                property_type=PropertyType.OFFICE,
                size_sqft=-1000,
                age_years=10
            )

    def test_invalid_age_negative(self, engine):
        """Test that negative age raises ValueError."""
        with pytest.raises(ValueError, match="Property age cannot be negative"):
            engine.calculate_value(
                property_type=PropertyType.OFFICE,
                size_sqft=10000,
                age_years=-5
            )

    def test_methodology_string(self, engine):
        """Test that methodology string is properly formatted."""
        result = engine.calculate_value(
            property_type=PropertyType.MULTIFAMILY,
            size_sqft=10000,
            age_years=15
        )

        assert "Base rate ($200/sqft)" in result.methodology
        assert "15.0% age depreciation" in result.methodology

    def test_valuation_date_present(self, engine):
        """Test that valuation_date is set."""
        result = engine.calculate_value(
            property_type=PropertyType.RETAIL,
            size_sqft=5000,
            age_years=10
        )

        assert result.valuation_date is not None

    def test_get_base_rate(self, engine):
        """Test getting base rates for different property types."""
        assert engine.get_base_rate(PropertyType.MULTIFAMILY) == Decimal("200")
        assert engine.get_base_rate(PropertyType.RETAIL) == Decimal("150")
        assert engine.get_base_rate(PropertyType.OFFICE) == Decimal("180")
        assert engine.get_base_rate(PropertyType.INDUSTRIAL) == Decimal("100")

    def test_calculate_depreciation(self, engine):
        """Test depreciation calculation."""
        assert engine.calculate_depreciation(0) == Decimal("0.00")
        assert engine.calculate_depreciation(10) == Decimal("0.10")
        assert engine.calculate_depreciation(25) == Decimal("0.25")
        assert engine.calculate_depreciation(40) == Decimal("0.40")
        assert engine.calculate_depreciation(50) == Decimal("0.40")  # Capped
        assert engine.calculate_depreciation(100) == Decimal("0.40")  # Capped

    def test_calculate_depreciation_negative(self, engine):
        """Test that negative age raises error in depreciation calculation."""
        with pytest.raises(ValueError, match="Property age cannot be negative"):
            engine.calculate_depreciation(-5)

    def test_small_property(self, engine):
        """Test valuation of a small property."""
        result = engine.calculate_value(
            property_type=PropertyType.RETAIL,
            size_sqft=1000,
            age_years=5
        )

        # Base: 1,000 * $150 = $150,000
        # Depreciation: 5%
        # Final: $150,000 * 0.95 = $142,500
        assert result.estimated_value == 142_500.00

    def test_large_property(self, engine):
        """Test valuation of a large property."""
        result = engine.calculate_value(
            property_type=PropertyType.INDUSTRIAL,
            size_sqft=500000,
            age_years=20
        )

        # Base: 500,000 * $100 = $50,000,000
        # Depreciation: 20%
        # Final: $50,000,000 * 0.80 = $40,000,000
        assert result.estimated_value == 40_000_000.00

    def test_rounding_precision(self, engine):
        """Test that values are rounded to 2 decimal places."""
        result = engine.calculate_value(
            property_type=PropertyType.OFFICE,
            size_sqft=3333,  # Will create non-round numbers
            age_years=7
        )

        # Check that result has at most 2 decimal places
        value_str = str(result.estimated_value)
        if '.' in value_str:
            decimal_places = len(value_str.split('.')[1])
            assert decimal_places <= 2

    def test_consistency(self, engine):
        """Test that multiple calls with same input produce same result."""
        params = {
            "property_type": PropertyType.MULTIFAMILY,
            "size_sqft": 25000,
            "age_years": 12
        }

        result1 = engine.calculate_value(**params)
        result2 = engine.calculate_value(**params)

        assert result1.estimated_value == result2.estimated_value
        assert result1.breakdown.base_value == result2.breakdown.base_value
        assert result1.breakdown.depreciation_factor == result2.breakdown.depreciation_factor

    def test_newer_property_has_higher_value_than_older(self, engine):
        """
        Test business rule: A newer property should have a higher value than
        an older property with the same description (type and size).

        This validates the requirement that age affects value negatively.
        """
        property_type = PropertyType.MULTIFAMILY
        size_sqft = 50000

        # New property (0 years old)
        new_property = engine.calculate_value(
            property_type=property_type,
            size_sqft=size_sqft,
            age_years=0
        )

        # Older property (10 years old)
        older_property = engine.calculate_value(
            property_type=property_type,
            size_sqft=size_sqft,
            age_years=10
        )

        # Very old property (50 years old)
        very_old_property = engine.calculate_value(
            property_type=property_type,
            size_sqft=size_sqft,
            age_years=50
        )

        # Assert that newer properties have higher values
        assert new_property.estimated_value > older_property.estimated_value, \
            "A new property should be valued higher than a 10-year-old property"

        assert older_property.estimated_value > very_old_property.estimated_value, \
            "A 10-year-old property should be valued higher than a 50-year-old property"

        assert new_property.estimated_value > very_old_property.estimated_value, \
            "A new property should be valued higher than a 50-year-old property"

        # Verify the specific values
        # New: $50,000 * $200 = $10,000,000 (0% depreciation)
        assert new_property.estimated_value == 10_000_000.00

        # 10 years: $10,000,000 * (1 - 0.10) = $9,000,000 (10% depreciation)
        assert older_property.estimated_value == 9_000_000.00

        # 50 years: $10,000,000 * (1 - 0.40) = $6,000,000 (40% depreciation, capped)
        assert very_old_property.estimated_value == 6_000_000.00

        # Verify depreciation increases with age
        assert new_property.breakdown.depreciation_factor < older_property.breakdown.depreciation_factor
        assert older_property.breakdown.depreciation_factor < very_old_property.breakdown.depreciation_factor

    def test_age_comparison_across_all_property_types(self, engine):
        """
        Test that age affects value consistently across all property types.
        For each property type, a newer building should always be worth more.
        """
        size_sqft = 20000
        new_age = 5
        old_age = 25

        for property_type in PropertyType:
            new_result = engine.calculate_value(
                property_type=property_type,
                size_sqft=size_sqft,
                age_years=new_age
            )

            old_result = engine.calculate_value(
                property_type=property_type,
                size_sqft=size_sqft,
                age_years=old_age
            )

            # Assert newer property is more valuable for every property type
            assert new_result.estimated_value > old_result.estimated_value, \
                f"For {property_type}, a {new_age}-year-old property should be worth more than a {old_age}-year-old property"

            # Verify depreciation difference
            expected_depreciation_diff = 0.20  # 20% difference (25 years - 5 years)
            actual_depreciation_diff = old_result.breakdown.depreciation_factor - new_result.breakdown.depreciation_factor
            assert actual_depreciation_diff == expected_depreciation_diff, \
                f"Depreciation difference should be {expected_depreciation_diff} for {property_type}"

    def test_industrial_50_year_old_vs_new_multifamily(self, engine):
        """
        Test specific scenario: A 50-year-old industrial property should be
        worth less than a new multifamily property of the same size, even though
        they have different base rates.

        This tests the combined effect of property type and age from requirements.
        """
        size_sqft = 100000

        # 50-year-old industrial
        # Base: 100,000 * $100 = $10,000,000
        # Depreciation: 40% (capped)
        # Final: $6,000,000
        old_industrial = engine.calculate_value(
            property_type=PropertyType.INDUSTRIAL,
            size_sqft=size_sqft,
            age_years=50
        )

        # New multifamily
        # Base: 100,000 * $200 = $20,000,000
        # Depreciation: 0%
        # Final: $20,000,000
        new_multifamily = engine.calculate_value(
            property_type=PropertyType.MULTIFAMILY,
            size_sqft=size_sqft,
            age_years=0
        )

        # The new multifamily should be worth significantly more
        assert new_multifamily.estimated_value > old_industrial.estimated_value
        assert old_industrial.estimated_value == 6_000_000.00
        assert new_multifamily.estimated_value == 20_000_000.00

        # This demonstrates that age can significantly impact value:
        # A 50-year-old industrial is worth 30% of a new multifamily of the same size

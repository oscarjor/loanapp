"""Valuation engine for calculating property values."""
from datetime import datetime
from decimal import Decimal, ROUND_HALF_UP

from app.models.request import PropertyType
from app.models.response import ValuationResponse, ValuationBreakdown


class ValuationEngine:
    """
    Property valuation engine using formula-based approach.

    Valuation Formula:
    1. Base value = size_sqft * base_rate[property_type]
    2. Depreciation = min(age_years * 0.01, 0.40)  # 1% per year, max 40%
    3. Final value = base_value * (1 - depreciation)
    """

    # Base rates per square foot for different property types
    BASE_RATES = {
        PropertyType.MULTIFAMILY: Decimal("200"),  # $200/sqft
        PropertyType.RETAIL: Decimal("150"),       # $150/sqft
        PropertyType.OFFICE: Decimal("180"),       # $180/sqft
        PropertyType.INDUSTRIAL: Decimal("100"),   # $100/sqft
    }

    # Depreciation constants
    MAX_DEPRECIATION = Decimal("0.40")      # Maximum 40% depreciation
    ANNUAL_DEPRECIATION = Decimal("0.01")   # 1% per year

    def calculate_value(
        self,
        property_type: PropertyType,
        size_sqft: int,
        age_years: int
    ) -> ValuationResponse:
        """
        Calculate estimated property value.

        Args:
            property_type: Type of commercial property
            size_sqft: Property size in square feet
            age_years: Property age in years

        Returns:
            ValuationResponse with estimated value and breakdown

        Raises:
            ValueError: If inputs are invalid
        """
        # Validate inputs
        if size_sqft <= 0:
            raise ValueError("Property size must be greater than 0")
        if age_years < 0:
            raise ValueError("Property age cannot be negative")

        # Get base rate for property type
        base_rate = self.BASE_RATES[property_type]

        # Calculate base value
        base_value = Decimal(size_sqft) * base_rate

        # Calculate depreciation (1% per year, max 40%)
        depreciation_factor = min(
            Decimal(age_years) * self.ANNUAL_DEPRECIATION,
            self.MAX_DEPRECIATION
        )

        # Calculate final value
        estimated_value = base_value * (Decimal("1") - depreciation_factor)

        # Round to 2 decimal places
        estimated_value = estimated_value.quantize(
            Decimal("0.01"),
            rounding=ROUND_HALF_UP
        )
        base_value = base_value.quantize(
            Decimal("0.01"),
            rounding=ROUND_HALF_UP
        )

        # Create breakdown
        breakdown = ValuationBreakdown(
            base_value=float(base_value),
            depreciation_factor=float(depreciation_factor),
            final_value=float(estimated_value)
        )

        # Generate methodology description
        depreciation_percent = float(depreciation_factor) * 100
        methodology = (
            f"Base rate (${base_rate}/sqft) with "
            f"{depreciation_percent:.1f}% age depreciation"
        )

        # Return response
        return ValuationResponse(
            estimated_value=float(estimated_value),
            valuation_date=datetime.utcnow(),
            methodology=methodology,
            breakdown=breakdown
        )

    def get_base_rate(self, property_type: PropertyType) -> Decimal:
        """
        Get the base rate per square foot for a property type.

        Args:
            property_type: Type of commercial property

        Returns:
            Base rate per square foot as Decimal
        """
        return self.BASE_RATES[property_type]

    def calculate_depreciation(self, age_years: int) -> Decimal:
        """
        Calculate depreciation factor based on property age.

        Args:
            age_years: Property age in years

        Returns:
            Depreciation factor (0-0.40) as Decimal
        """
        if age_years < 0:
            raise ValueError("Property age cannot be negative")

        return min(
            Decimal(age_years) * self.ANNUAL_DEPRECIATION,
            self.MAX_DEPRECIATION
        )

from pydantic import BaseModel, Field, field_validator
from enum import Enum


class PropertyType(str, Enum):
    """Property type enumeration."""
    MULTIFAMILY = "MULTIFAMILY"
    RETAIL = "RETAIL"
    OFFICE = "OFFICE"
    INDUSTRIAL = "INDUSTRIAL"


class ValuationRequest(BaseModel):
    """Request model for property valuation."""

    property_type: PropertyType = Field(
        ...,
        description="Type of commercial property"
    )
    size_sqft: int = Field(
        ...,
        gt=0,
        description="Property size in square feet"
    )
    age_years: int = Field(
        ...,
        ge=0,
        description="Property age in years"
    )

    @field_validator('size_sqft')
    @classmethod
    def validate_size(cls, v: int) -> int:
        if v <= 0:
            raise ValueError("Property size must be greater than 0")
        if v > 10_000_000:
            raise ValueError("Property size exceeds maximum allowed (10M sqft)")
        return v

    @field_validator('age_years')
    @classmethod
    def validate_age(cls, v: int) -> int:
        if v < 0:
            raise ValueError("Property age cannot be negative")
        if v > 200:
            raise ValueError("Property age exceeds reasonable limit (200 years)")
        return v

    class Config:
        use_enum_values = True
        json_schema_extra = {
            "example": {
                "property_type": "MULTIFAMILY",
                "size_sqft": 50000,
                "age_years": 15
            }
        }

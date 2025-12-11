from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class ValuationBreakdown(BaseModel):
    """Detailed breakdown of valuation calculation."""

    base_value: float = Field(
        ...,
        description="Base property value before adjustments"
    )
    depreciation_factor: float = Field(
        ...,
        ge=0,
        le=1,
        description="Depreciation factor applied (0-1)"
    )
    final_value: float = Field(
        ...,
        description="Final calculated value after depreciation"
    )


class ValuationResponse(BaseModel):
    """Response model for property valuation."""

    estimated_value: float = Field(
        ...,
        gt=0,
        description="Estimated property value in dollars"
    )
    valuation_date: datetime = Field(
        default_factory=datetime.utcnow,
        description="Timestamp of valuation calculation"
    )
    methodology: str = Field(
        ...,
        description="Description of valuation methodology used"
    )
    breakdown: ValuationBreakdown = Field(
        ...,
        description="Detailed calculation breakdown"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "estimated_value": 8500000.00,
                "valuation_date": "2024-12-11T10:30:00Z",
                "methodology": "Base rate ($200/sqft) with 15.0% age depreciation",
                "breakdown": {
                    "base_value": 10000000.00,
                    "depreciation_factor": 0.15,
                    "final_value": 8500000.00
                }
            }
        }


class ErrorResponse(BaseModel):
    """Error response model."""

    detail: str = Field(
        ...,
        description="Error message"
    )
    error_code: Optional[str] = Field(
        None,
        description="Optional error code for programmatic handling"
    )

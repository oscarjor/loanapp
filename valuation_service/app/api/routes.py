from fastapi import APIRouter, HTTPException, status
from app.models.request import ValuationRequest
from app.models.response import ValuationResponse, ErrorResponse
from app.services.valuation_engine import ValuationEngine
import logging

# Configure logging
logger = logging.getLogger(__name__)

# Create router
router = APIRouter(prefix="/api/v1", tags=["valuation"])

# Initialize valuation engine
valuation_engine = ValuationEngine()


@router.post(
    "/valuate",
    response_model=ValuationResponse,
    status_code=status.HTTP_200_OK,
    responses={
        422: {
            "model": ErrorResponse,
            "description": "Validation Error"
        },
        500: {
            "model": ErrorResponse,
            "description": "Internal Server Error"
        }
    },
    summary="Calculate property valuation",
    description=(
        "Calculate the estimated value of a commercial property based on "
        "property type, size, and age using a formula-based approach."
    )
)
async def valuate_property(request: ValuationRequest) -> ValuationResponse:
    """
    Calculate property valuation.

    Args:
        request: ValuationRequest containing property details

    Returns:
        ValuationResponse with estimated value and breakdown

    Raises:
        HTTPException: If valuation calculation fails
    """
    try:
        logger.info(
            f"Valuation request received: type={request.property_type}, "
            f"size={request.size_sqft}sqft, age={request.age_years}yrs"
        )

        # Calculate valuation
        result = valuation_engine.calculate_value(
            property_type=request.property_type,
            size_sqft=request.size_sqft,
            age_years=request.age_years
        )

        logger.info(
            f"Valuation calculated: ${result.estimated_value:,.2f}"
        )

        return result

    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Unexpected error during valuation: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error during valuation calculation"
        )


@router.get(
    "/health",
    status_code=status.HTTP_200_OK,
    summary="Health check",
    description="Check if the valuation service is running"
)
async def health_check():
    """
    Health check endpoint.

    Returns:
        Status message
    """
    return {
        "status": "healthy",
        "service": "valuation-service",
        "version": "1.0.0"
    }

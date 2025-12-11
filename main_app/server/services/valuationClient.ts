/**
 * Valuation Service Client
 *
 * HTTP client for communicating with the Python valuation service
 */

export interface ValuationRequest {
  property_type: 'MULTIFAMILY' | 'RETAIL' | 'OFFICE' | 'INDUSTRIAL'
  size_sqft: number
  age_years: number
}

export interface ValuationResponse {
  estimated_value: number
  valuation_date: string
  methodology: string
  breakdown: {
    base_value: number
    depreciation_factor: number
    final_value: number
  }
}

export class ValuationServiceError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public originalError?: unknown,
  ) {
    super(message)
    this.name = 'ValuationServiceError'
  }
}

export class ValuationClient {
  private readonly baseUrl: string
  private readonly timeout: number

  constructor(baseUrl?: string, timeout: number = 5000) {
    this.baseUrl = baseUrl || process.env.VALUATION_SERVICE_URL || 'http://localhost:8000'
    this.timeout = timeout
  }

  /**
   * Request property valuation from the valuation service
   */
  async requestValuation(request: ValuationRequest): Promise<ValuationResponse> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    try {
      const response = await fetch(`${this.baseUrl}/api/v1/valuate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text()
        let errorMessage = `Valuation service returned ${response.status}`

        try {
          const errorJson = JSON.parse(errorText)
          errorMessage = errorJson.detail || errorMessage
        } catch {
          // If response is not JSON, use the status message
        }

        throw new ValuationServiceError(
          errorMessage,
          response.status,
        )
      }

      const data = await response.json()
      return data as ValuationResponse

    } catch (error) {
      clearTimeout(timeoutId)

      if (error instanceof ValuationServiceError) {
        throw error
      }

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new ValuationServiceError(
            `Valuation service request timed out after ${this.timeout}ms`,
            408,
            error,
          )
        }

        throw new ValuationServiceError(
          `Failed to contact valuation service: ${error.message}`,
          503,
          error,
        )
      }

      throw new ValuationServiceError(
        'Unknown error occurred while contacting valuation service',
        500,
        error,
      )
    }
  }

  /**
   * Health check for the valuation service
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(2000),
      })

      return response.ok
    } catch {
      return false
    }
  }
}

// Export singleton instance
export const valuationClient = new ValuationClient()

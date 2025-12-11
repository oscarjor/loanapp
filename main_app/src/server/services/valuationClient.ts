export interface ValuationRequest {
  property_type: string
  size_sqft: number
  age_years: number
}

export interface ValuationResponse {
  estimated_value: number
  valuation_date: string
  methodology: string
  breakdown: {
    base_value: number
    depreciation_rate: number
    depreciation_amount: number
  }
}

export class ValuationClient {
  private baseUrl: string
  private timeout: number

  constructor(baseUrl?: string, timeout = 5000) {
    this.baseUrl = baseUrl || process.env.VALUATION_SERVICE_URL || 'http://localhost:8000'
    this.timeout = timeout
  }

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
        throw new Error(`Valuation service error: ${response.status} - ${errorText}`)
      }

      return await response.json()
    } catch (error) {
      clearTimeout(timeoutId)
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Valuation service request timeout')
      }
      throw error
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/health`, {
        method: 'GET',
      })
      return response.ok
    } catch {
      return false
    }
  }
}

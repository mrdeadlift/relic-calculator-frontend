import axios from 'axios'
import type {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  AxiosError,
  InternalAxiosRequestConfig,
} from 'axios'
import type { ApiResponse, ApiError as ApiErrorType } from '../types/api'
import { ApiError } from '../types/api'

// Configuration
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'
const API_VERSION = 'v1'
const DEFAULT_TIMEOUT = 30000
const MAX_RETRIES = 3
const RETRY_DELAY = 1000

// Request/Response interceptor types
interface RequestInterceptor {
  name: string
  onFulfilled?: (
    config: InternalAxiosRequestConfig
  ) => InternalAxiosRequestConfig | Promise<InternalAxiosRequestConfig>
  onRejected?: (error: any) => any
}

interface ResponseInterceptor {
  name: string
  onFulfilled?: (
    response: AxiosResponse
  ) => AxiosResponse | Promise<AxiosResponse>
  onRejected?: (error: AxiosError) => any
}

// HTTP Client Class
export class HttpClient {
  private client: AxiosInstance
  private requestInterceptors: Map<string, number> = new Map()
  private responseInterceptors: Map<string, number> = new Map()
  private retryConfig: Map<string, number> = new Map()

  constructor(config?: AxiosRequestConfig) {
    this.client = axios.create({
      baseURL: `${API_BASE_URL}/api/${API_VERSION}`,
      timeout: DEFAULT_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      ...config,
    })

    this.setupDefaultInterceptors()
  }

  private setupDefaultInterceptors() {
    // Request interceptors
    this.addRequestInterceptor({
      name: 'auth',
      onFulfilled: config => {
        // Add authentication token if available
        const token = localStorage.getItem('auth_token')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
    })

    this.addRequestInterceptor({
      name: 'request-id',
      onFulfilled: config => {
        // Add unique request ID for tracking
        config.headers['X-Request-ID'] = generateRequestId()
        return config
      },
    })

    this.addRequestInterceptor({
      name: 'timestamp',
      onFulfilled: config => {
        // Add timestamp for request timing
        ;(config as any).metadata = { startTime: Date.now() }
        return config
      },
    })

    // Response interceptors
    this.addResponseInterceptor({
      name: 'response-time',
      onFulfilled: response => {
        // Calculate response time
        const startTime = (response.config as any).metadata?.startTime
        if (startTime) {
          const responseTime = Date.now() - startTime
          response.headers['x-response-time'] = responseTime.toString()
        }
        return response
      },
    })

    this.addResponseInterceptor({
      name: 'error-handler',
      onRejected: (error: AxiosError) => {
        return this.handleResponseError(error)
      },
    })

    this.addResponseInterceptor({
      name: 'retry',
      onRejected: async (error: AxiosError) => {
        return this.handleRetry(error)
      },
    })
  }

  // Interceptor management
  addRequestInterceptor(interceptor: RequestInterceptor): void {
    const id = this.client.interceptors.request.use(
      interceptor.onFulfilled,
      interceptor.onRejected
    )
    this.requestInterceptors.set(interceptor.name, id)
  }

  addResponseInterceptor(interceptor: ResponseInterceptor): void {
    const id = this.client.interceptors.response.use(
      interceptor.onFulfilled,
      interceptor.onRejected
    )
    this.responseInterceptors.set(interceptor.name, id)
  }

  removeRequestInterceptor(name: string): void {
    const id = this.requestInterceptors.get(name)
    if (id !== undefined) {
      this.client.interceptors.request.eject(id)
      this.requestInterceptors.delete(name)
    }
  }

  removeResponseInterceptor(name: string): void {
    const id = this.responseInterceptors.get(name)
    if (id !== undefined) {
      this.client.interceptors.response.eject(id)
      this.responseInterceptors.delete(name)
    }
  }

  // Error handling
  private handleResponseError(error: AxiosError): Promise<never> {
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response
      const apiError = new ApiError(
        (data as any)?.message || error.message || 'Request failed',
        status,
        (data as any)?.error_code || 'HTTP_ERROR',
        data
      )

      // Log error for monitoring
      console.error('API Error:', {
        url: error.config?.url,
        method: error.config?.method,
        status,
        message: apiError.message,
        requestId: error.config?.headers?.['X-Request-ID'],
      })

      return Promise.reject(apiError)
    } else if (error.request) {
      // Network error
      const networkError = new ApiError(
        'Network error - please check your connection',
        0,
        'NETWORK_ERROR',
        { request: error.request }
      )

      console.error('Network Error:', {
        url: error.config?.url,
        method: error.config?.method,
        message: networkError.message,
      })

      return Promise.reject(networkError)
    } else {
      // Request setup error
      const setupError = new ApiError(
        error.message || 'Request setup error',
        0,
        'REQUEST_SETUP_ERROR'
      )

      console.error('Request Setup Error:', {
        message: setupError.message,
        config: error.config,
      })

      return Promise.reject(setupError)
    }
  }

  // Retry logic
  private async handleRetry(error: AxiosError): Promise<AxiosResponse> {
    const config = error.config
    if (!config) {
      return Promise.reject(error)
    }

    // Don't retry certain types of errors
    if (
      error.response?.status === 401 || // Unauthorized
      error.response?.status === 403 || // Forbidden
      error.response?.status === 404 || // Not Found
      error.response?.status === 422 || // Validation Error
      (error.response?.status &&
        error.response.status >= 400 &&
        error.response.status < 500)
    ) {
      return Promise.reject(error)
    }

    const retryKey = `${config.method}-${config.url}`
    const retryCount = this.retryConfig.get(retryKey) || 0

    if (retryCount >= MAX_RETRIES) {
      this.retryConfig.delete(retryKey)
      return Promise.reject(error)
    }

    // Increment retry count
    this.retryConfig.set(retryKey, retryCount + 1)

    // Calculate delay with exponential backoff and jitter
    const delay = RETRY_DELAY * Math.pow(2, retryCount) + Math.random() * 1000

    console.log(
      `Retrying request ${retryCount + 1}/${MAX_RETRIES} after ${delay}ms:`,
      {
        url: config.url,
        method: config.method,
      }
    )

    // Wait and retry
    await new Promise(resolve => setTimeout(resolve, delay))

    try {
      const response = await this.client.request(config)
      this.retryConfig.delete(retryKey) // Clear retry count on success
      return response
    } catch (retryError) {
      return this.handleRetry(retryError as AxiosError)
    }
  }

  // HTTP methods
  async get<T>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await this.client.get<ApiResponse<T>>(url, config)
    return response.data
  }

  async post<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await this.client.post<ApiResponse<T>>(url, data, config)
    return response.data
  }

  async put<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await this.client.put<ApiResponse<T>>(url, data, config)
    return response.data
  }

  async patch<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await this.client.patch<ApiResponse<T>>(url, data, config)
    return response.data
  }

  async delete<T>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await this.client.delete<ApiResponse<T>>(url, config)
    return response.data
  }

  // Advanced methods
  async upload<T>(
    url: string,
    file: File,
    onProgress?: (progress: number) => void,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const formData = new FormData()
    formData.append('file', file)

    const response = await this.client.post<ApiResponse<T>>(url, formData, {
      ...config,
      headers: {
        'Content-Type': 'multipart/form-data',
        ...config?.headers,
      },
      onUploadProgress: progressEvent => {
        if (onProgress && progressEvent.total) {
          const progress = (progressEvent.loaded / progressEvent.total) * 100
          onProgress(progress)
        }
      },
    })

    return response.data
  }

  async download(
    url: string,
    filename?: string,
    onProgress?: (progress: number) => void,
    config?: AxiosRequestConfig
  ): Promise<Blob> {
    const response = await this.client.get(url, {
      ...config,
      responseType: 'blob',
      onDownloadProgress: progressEvent => {
        if (onProgress && progressEvent.total) {
          const progress = (progressEvent.loaded / progressEvent.total) * 100
          onProgress(progress)
        }
      },
    })

    // Trigger download if filename provided
    if (filename) {
      const blob = new Blob([response.data])
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)
    }

    return response.data
  }

  // Batch requests
  async batch<T>(
    requests: Array<() => Promise<ApiResponse<T>>>
  ): Promise<Array<ApiResponse<T> | ApiError>> {
    const results = await Promise.allSettled(requests.map(request => request()))

    return results.map(result => {
      if (result.status === 'fulfilled') {
        return result.value
      } else {
        return result.reason instanceof ApiError
          ? result.reason
          : new ApiError(
              'Batch request failed',
              0,
              'BATCH_ERROR',
              result.reason
            )
      }
    })
  }

  // Request cancellation
  createCancelToken(): {
    token: AbortSignal
    cancel: (message?: string) => void
  } {
    const controller = new AbortController()
    return {
      token: controller.signal,
      cancel: (message?: string) => controller.abort(),
    }
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      await this.client.get('/health', { timeout: 5000 })
      return true
    } catch {
      return false
    }
  }

  // Get client statistics
  getStats(): {
    activeRequests: number
    retryAttempts: number
    interceptors: {
      request: string[]
      response: string[]
    }
  } {
    return {
      activeRequests: 0, // TODO: Track active requests
      retryAttempts: this.retryConfig.size,
      interceptors: {
        request: Array.from(this.requestInterceptors.keys()),
        response: Array.from(this.responseInterceptors.keys()),
      },
    }
  }

  // Update configuration
  updateConfig(config: Partial<AxiosRequestConfig>): void {
    Object.assign(this.client.defaults, config)
  }

  // Get current configuration
  getConfig(): AxiosRequestConfig {
    return { ...this.client.defaults }
  }
}

// Utility functions
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Export singleton instance
export const httpClient = new HttpClient()

// Export factory function for custom instances
export const createHttpClient = (config?: AxiosRequestConfig): HttpClient => {
  return new HttpClient(config)
}

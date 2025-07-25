import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useToast } from '../composables/useToast'

export interface AppError {
  id: string
  type: 'api' | 'validation' | 'network' | 'storage' | 'calculation' | 'system'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  message: string
  details?: any
  timestamp: Date
  resolved: boolean
  retryable: boolean
  retryCount: number
  maxRetries: number
  context?: {
    store?: string
    action?: string
    userId?: string
    buildId?: string
    relicIds?: string[]
  }
}

export interface NetworkStatus {
  isOnline: boolean
  lastChecked: Date
  apiAvailable: boolean
  latency: number
  failedRequests: number
  consecutiveFailures: number
}

export const useErrorStore = defineStore('errors', () => {
  // State
  const errors = ref<AppError[]>([])
  const networkStatus = ref<NetworkStatus>({
    isOnline: navigator.onLine,
    lastChecked: new Date(),
    apiAvailable: true,
    latency: 0,
    failedRequests: 0,
    consecutiveFailures: 0
  })

  const globalErrorHandling = ref(true)
  const maxErrors = ref(100)
  const autoRetry = ref(true)
  const notificationSettings = ref({
    showToasts: true,
    showCriticalOnly: false,
    autoHideDelay: 5000
  })

  // Composables
  const { error: showToastError, warning: showToastWarning, success } = useToast()

  // Computed
  const activeErrors = computed(() => 
    errors.value.filter(error => !error.resolved)
  )

  const criticalErrors = computed(() => 
    activeErrors.value.filter(error => error.severity === 'critical')
  )

  const errorsByType = computed(() => {
    return errors.value.reduce((acc, error) => {
      acc[error.type] = (acc[error.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  })

  const errorsByStore = computed(() => {
    return errors.value.reduce((acc, error) => {
      const store = error.context?.store || 'unknown'
      acc[store] = (acc[store] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  })

  const hasActiveErrors = computed(() => activeErrors.value.length > 0)
  const hasCriticalErrors = computed(() => criticalErrors.value.length > 0)

  const errorStats = computed(() => ({
    total: errors.value.length,
    active: activeErrors.value.length,
    resolved: errors.value.filter(e => e.resolved).length,
    critical: criticalErrors.value.length,
    retryable: activeErrors.value.filter(e => e.retryable).length,
    byType: errorsByType.value,
    byStore: errorsByStore.value
  }))

  // Actions
  const addError = (errorData: Partial<AppError>): string => {
    const error: AppError = {
      id: generateErrorId(),
      type: errorData.type || 'system',
      severity: errorData.severity || 'medium',
      title: errorData.title || 'Unknown Error',
      message: errorData.message || 'An unexpected error occurred',
      details: errorData.details,
      timestamp: new Date(),
      resolved: false,
      retryable: errorData.retryable || false,
      retryCount: 0,
      maxRetries: errorData.maxRetries || 3,
      context: errorData.context
    }

    errors.value.unshift(error)

    // Limit total errors
    if (errors.value.length > maxErrors.value) {
      errors.value = errors.value.slice(0, maxErrors.value)
    }

    // Handle notifications
    if (globalErrorHandling.value && notificationSettings.value.showToasts) {
      if (!notificationSettings.value.showCriticalOnly || error.severity === 'critical') {
        showErrorNotification(error)
      }
    }

    // Update network status for API errors
    if (error.type === 'api' || error.type === 'network') {
      updateNetworkStatus(false)
    }

    // Auto-retry if enabled and retryable
    if (autoRetry.value && error.retryable && error.retryCount < error.maxRetries) {
      scheduleRetry(error.id)
    }

    return error.id
  }

  const addApiError = (
    message: string,
    details?: any,
    context?: Partial<AppError['context']>
  ): string => {
    return addError({
      type: 'api',
      severity: 'high',
      title: 'API Error',
      message,
      details,
      retryable: true,
      context
    })
  }

  const addNetworkError = (
    message: string,
    details?: any,
    context?: Partial<AppError['context']>
  ): string => {
    return addError({
      type: 'network',
      severity: 'high',
      title: 'Network Error',
      message,
      details,
      retryable: true,
      context
    })
  }

  const addValidationError = (
    message: string,
    details?: any,
    context?: Partial<AppError['context']>
  ): string => {
    return addError({
      type: 'validation',
      severity: 'medium',
      title: 'Validation Error',
      message,
      details,
      retryable: false,
      context
    })
  }

  const addStorageError = (
    message: string,
    details?: any,
    context?: Partial<AppError['context']>
  ): string => {
    return addError({
      type: 'storage',
      severity: 'high',
      title: 'Storage Error',
      message,
      details,
      retryable: true,
      maxRetries: 1,
      context
    })
  }

  const addCalculationError = (
    message: string,
    details?: any,
    context?: Partial<AppError['context']>
  ): string => {
    return addError({
      type: 'calculation',
      severity: 'medium',
      title: 'Calculation Error',
      message,
      details,
      retryable: true,
      context
    })
  }

  const resolveError = (errorId: string): boolean => {
    const error = errors.value.find(e => e.id === errorId)
    if (error) {
      error.resolved = true
      return true
    }
    return false
  }

  const resolveErrorsByType = (type: AppError['type']): number => {
    let resolved = 0
    errors.value.forEach(error => {
      if (error.type === type && !error.resolved) {
        error.resolved = true
        resolved++
      }
    })
    return resolved
  }

  const retryError = async (errorId: string): Promise<boolean> => {
    const error = errors.value.find(e => e.id === errorId)
    if (!error || !error.retryable || error.retryCount >= error.maxRetries) {
      return false
    }

    error.retryCount++

    try {
      // Implement retry logic based on error context
      await executeRetry(error)
      
      error.resolved = true
      success(`Error resolved after retry ${error.retryCount}`)
      return true

    } catch (retryError) {
      console.error(`Retry ${error.retryCount} failed for error ${errorId}:`, retryError)
      
      if (error.retryCount >= error.maxRetries) {
        error.retryable = false
        showToastError(`Max retries reached for: ${error.title}`)
      }
      
      return false
    }
  }

  const clearErrors = (): void => {
    errors.value = []
    success('All errors cleared')
  }

  const clearResolvedErrors = (): void => {
    const beforeCount = errors.value.length
    errors.value = errors.value.filter(error => !error.resolved)
    const clearedCount = beforeCount - errors.value.length
    
    if (clearedCount > 0) {
      success(`Cleared ${clearedCount} resolved errors`)
    }
  }

  const dismissError = (errorId: string): void => {
    const index = errors.value.findIndex(e => e.id === errorId)
    if (index !== -1) {
      errors.value.splice(index, 1)
    }
  }

  // Network status management
  const updateNetworkStatus = (isSuccess: boolean): void => {
    const status = networkStatus.value
    status.lastChecked = new Date()
    status.isOnline = navigator.onLine

    if (isSuccess) {
      status.apiAvailable = true
      status.consecutiveFailures = 0
    } else {
      status.failedRequests++
      status.consecutiveFailures++
      
      if (status.consecutiveFailures >= 3) {
        status.apiAvailable = false
      }
    }
  }

  const checkNetworkStatus = async (): Promise<boolean> => {
    try {
      const startTime = performance.now()
      
      // Simple ping to check API availability
      const response = await fetch('/api/health', { 
        method: 'HEAD',
        cache: 'no-cache'
      })
      
      const endTime = performance.now()
      networkStatus.value.latency = endTime - startTime

      const isAvailable = response.ok
      updateNetworkStatus(isAvailable)
      
      return isAvailable

    } catch (error) {
      updateNetworkStatus(false)
      return false
    }
  }

  // Helper functions
  const generateErrorId = (): string => {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  const showErrorNotification = (error: AppError): void => {
    const message = `${error.title}: ${error.message}`
    
    switch (error.severity) {
      case 'critical':
        showToastError(message)
        break
      case 'high':
        showToastError(message)
        break
      case 'medium':
        showToastWarning(message)
        break
      default:
        // Low severity errors don't show toasts by default
        break
    }
  }

  const scheduleRetry = (errorId: string): void => {
    const error = errors.value.find(e => e.id === errorId)
    if (!error) return

    // Exponential backoff: 1s, 2s, 4s, 8s, etc.
    const delay = Math.min(1000 * Math.pow(2, error.retryCount), 30000)
    
    setTimeout(() => {
      retryError(errorId)
    }, delay)
  }

  const executeRetry = async (error: AppError): Promise<void> => {
    // Implement specific retry logic based on error context
    const { store, action } = error.context || {}

    switch (error.type) {
      case 'api':
        // Retry API call
        if (store && action) {
          // This would need to be implemented based on the specific store/action
          throw new Error('API retry not implemented for this context')
        }
        break

      case 'network':
        // Check network connectivity
        const isOnline = await checkNetworkStatus()
        if (!isOnline) {
          throw new Error('Network still unavailable')
        }
        break

      case 'storage':
        // Retry storage operation
        if (error.details?.operation && error.details?.data) {
          localStorage.setItem(error.details.key, error.details.data)
        }
        break

      default:
        throw new Error(`Retry not supported for error type: ${error.type}`)
    }
  }

  // Settings
  const updateSettings = (settings: Partial<typeof notificationSettings.value>): void => {
    notificationSettings.value = { ...notificationSettings.value, ...settings }
  }

  const toggleGlobalErrorHandling = (): void => {
    globalErrorHandling.value = !globalErrorHandling.value
  }

  const toggleAutoRetry = (): void => {
    autoRetry.value = !autoRetry.value
  }

  // Error reporting (for analytics/monitoring)
  const exportErrors = (includeResolved = false): string => {
    const errorsToExport = includeResolved ? errors.value : activeErrors.value
    
    const exportData = {
      timestamp: new Date().toISOString(),
      networkStatus: networkStatus.value,
      errors: errorsToExport.map(error => ({
        ...error,
        // Remove sensitive details
        details: error.details ? '[REDACTED]' : undefined
      })),
      stats: errorStats.value
    }

    return JSON.stringify(exportData, null, 2)
  }

  // Event listeners for network status
  const setupNetworkListeners = (): void => {
    window.addEventListener('online', () => {
      networkStatus.value.isOnline = true
      updateNetworkStatus(true)
    })

    window.addEventListener('offline', () => {
      networkStatus.value.isOnline = false
      updateNetworkStatus(false)
    })
  }

  // Initialize
  const initialize = (): void => {
    setupNetworkListeners()
    
    // Initial network check
    checkNetworkStatus()

    // Periodic network status check
    setInterval(checkNetworkStatus, 60000) // Every minute
  }

  return {
    // State
    errors: computed(() => errors.value),
    networkStatus: computed(() => networkStatus.value),
    
    // Computed
    activeErrors,
    criticalErrors,
    hasActiveErrors,
    hasCriticalErrors,
    errorStats,

    // Settings
    globalErrorHandling: computed(() => globalErrorHandling.value),
    autoRetry: computed(() => autoRetry.value),
    notificationSettings: computed(() => notificationSettings.value),

    // Actions
    initialize,
    addError,
    addApiError,
    addNetworkError,
    addValidationError,
    addStorageError,
    addCalculationError,
    resolveError,
    resolveErrorsByType,
    retryError,
    clearErrors,
    clearResolvedErrors,
    dismissError,

    // Network
    updateNetworkStatus,
    checkNetworkStatus,

    // Settings
    updateSettings,
    toggleGlobalErrorHandling,
    toggleAutoRetry,

    // Utilities
    exportErrors
  }
})
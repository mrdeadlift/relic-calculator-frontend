// Error Types for Nightreign Relic Calculator

// Enhanced error interface
export interface EnhancedError extends Error {
  code?: string
  category: ErrorCategory
  severity: ErrorSeverity
  context?: Record<string, any>
  timestamp: Date
  stack?: string
  retryable?: boolean
}

// Error categories
export type ErrorCategory = 
  | 'validation'
  | 'calculation'
  | 'network'
  | 'authentication'
  | 'permission'
  | 'data'
  | 'ui'
  | 'system'

// Error severity levels
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical'

// Error handler function type
export type ErrorHandler = (error: EnhancedError) => void
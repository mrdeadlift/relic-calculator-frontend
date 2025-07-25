// API Types for Nightreign Relic Calculator

import type { Relic, Build, AttackCalculationResult, CalculationContext } from './relic'

// Generic API response wrapper
export interface ApiResponse<T> {
  data: T
  success: boolean
  message?: string
  errors?: string[]
  meta?: {
    total?: number
    page?: number
    per_page?: number
    pages?: number
  }
}

// API Error structure
export class ApiError extends Error {
  code: string
  status: number
  details?: Record<string, any>
  field?: string

  constructor(message: string, status: number = 500, code: string = 'UNKNOWN_ERROR', details?: Record<string, any>) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.status = status
    this.details = details
  }
}

// Error codes enum
export const API_ERROR_CODES = {
  // Relic selection errors
  SELECTION_LIMIT_EXCEEDED: 'SELECTION_LIMIT_EXCEEDED',
  CONFLICTING_RELICS: 'CONFLICTING_RELICS',
  INVALID_RELIC_ID: 'INVALID_RELIC_ID',
  
  // Calculation errors
  CALCULATION_ERROR: 'CALCULATION_ERROR',
  CALCULATION_TIMEOUT: 'CALCULATION_TIMEOUT',
  INVALID_CALCULATION_CONTEXT: 'INVALID_CALCULATION_CONTEXT',
  
  // Build errors
  BUILD_NOT_FOUND: 'BUILD_NOT_FOUND',
  BUILD_VALIDATION_ERROR: 'BUILD_VALIDATION_ERROR',
  SHARE_KEY_INVALID: 'SHARE_KEY_INVALID',
  BUILD_SAVE_ERROR: 'BUILD_SAVE_ERROR',
  
  // Auth errors
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  
  // General errors
  NOT_FOUND: 'NOT_FOUND',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED'
} as const

export type ApiErrorCode = typeof API_ERROR_CODES[keyof typeof API_ERROR_CODES]

// Relic API types
export interface RelicsListParams {
  category?: string
  search?: string
  rarity?: string
  page?: number
  per_page?: number
}

export interface RelicsListResponse {
  relics: Relic[]
  categories: string[]
  total: number
}

// Calculation API types
export interface CalculationRequest {
  context: CalculationContext
  selectedRelicIds: string[]
  options?: {
    includeBreakdown?: boolean
    includeWarnings?: boolean
    validateConflicts?: boolean
  }
}

export interface CalculationResponse {
  result: AttackCalculationResult
  timestamp: string
  version: string
}

// Build API types
export interface BuildCreateRequest {
  name: string
  description?: string
  relicIds: string[]
  combatStyle: string
  isPublic?: boolean
}

export interface BuildUpdateRequest {
  name?: string
  description?: string
  relicIds?: string[]
  combatStyle?: string
  isPublic?: boolean
}

export interface BuildsListResponse {
  builds: Build[]
  total: number
}

export interface BuildShareResponse {
  shareKey: string
  shareUrl: string
  expiresAt?: Date
}

// Optimization API types
export interface OptimizationRequest {
  currentBuild: {
    relicIds: string[]
    combatStyle: string
  }
  constraints?: {
    maxDifficulty?: number
    allowedCategories?: string[]
    excludeRelicIds?: string[]
  }
  preferences?: {
    priorityDamageTypes?: string[]
    preferredCombatStyle?: string
  }
}

export interface OptimizationSuggestion {
  relicIds: string[]
  estimatedImprovement: number
  explanation: string
  difficultyRating: number
  pros: string[]
  cons: string[]
}

export interface OptimizationResponse {
  suggestions: OptimizationSuggestion[]
  currentRating: number
  metadata: {
    calculationTime: number
    totalCombinations: number
    evaluatedCombinations: number
  }
}

// Comparison API types
export interface BuildComparisonRequest {
  buildIds: string[]
  comparisonMode: 'simple' | 'detailed'
}

export interface BuildComparisonResult {
  buildId: string
  buildName: string
  attackMultipliers: Record<string, number>
  specialEffects: string[]
  totalCost: number
  difficultyRating: number
  pros: string[]
  cons: string[]
}

export interface BuildComparisonResponse {
  comparisons: BuildComparisonResult[]
  winner: {
    buildId: string
    metric: string
    value: number
  }
  summary: string
}

// Paginated response type
export interface PaginatedResponse<T> extends ApiResponse<T> {
  meta: {
    total?: number
    page?: number
    per_page?: number
    pages?: number
    pagination?: {
      current_page: number
      per_page: number
      total_count: number
      total_pages: number
      has_next_page: boolean
      has_prev_page: boolean
    }
  }
}

// Optimization result type alias
export type OptimizationResult = OptimizationResponse

// Calculation result type alias
export type CalculationResult = CalculationResponse

// Admin API types (for future admin functionality)
export interface RelicCreateRequest {
  name: string
  description: string
  category: string
  rarity: string
  quality: string
  effects: Array<{
    type: string
    value: number | string
    stackingRule: string
    name: string
    description: string
    conditions?: any[]
    damageTypes: string[]
  }>
  iconUrl?: string
  obtainmentDifficulty: number
  conflicts?: string[]
}

export interface RelicUpdateRequest extends Partial<RelicCreateRequest> {}

export interface DataValidationRequest {
  checkType: 'consistency' | 'conflicts' | 'balance' | 'all'
}

export interface DataValidationResponse {
  isValid: boolean
  issues: Array<{
    type: 'error' | 'warning'
    code: string
    message: string
    affectedItems: string[]
    suggestion?: string
  }>
  summary: {
    totalRelics: number
    totalIssues: number
    criticalIssues: number
  }
}

// HTTP client types
export interface RequestConfig {
  timeout?: number
  retries?: number
  headers?: Record<string, string>
}

export interface RequestOptions extends RequestConfig {
  params?: Record<string, any>
  data?: any
}

// WebSocket types for real-time features (future enhancement)
export interface WebSocketMessage {
  type: 'calculation_update' | 'build_shared' | 'relic_updated' | 'system_message'
  payload: any
  timestamp: string
  id: string
}

export interface WebSocketConfig {
  url: string
  reconnectAttempts: number
  reconnectDelay: number
}
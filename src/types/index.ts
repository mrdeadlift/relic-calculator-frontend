// Main type exports for Nightreign Relic Calculator

// Core domain types
export * from './relic'

// API communication types
export * from './api'

// Vue component types
export * from './components'

// Error handling types
export * from './errors'

// Build types (avoid duplicate exports)
export type { Build, BuildFilters, BuildSearchParams } from './build'

// Re-export commonly used types for convenience
export type {
  // Core entities
  Relic,
  RelicEffect,
  AttackCalculationResult,
  CalculationContext,

  // Enums
  RelicCategory,
  RelicRarity,
  CombatStyle,
  DamageType,
  EffectType,
  StackingRule,
} from './relic'

export type {
  // API types
  ApiResponse,
  CalculationRequest,
  CalculationResponse,
  PaginatedResponse,
  BuildCreateRequest,
  BuildUpdateRequest,
} from './api'

export type {
  // Component types
  RelicSelectorProps,
  AttackDisplayProps,
  BuildComparisonProps,
  BuildManagerProps,
} from './components'

export type {
  // Error types
  EnhancedError,
  ErrorCategory,
  ErrorSeverity,
  ErrorHandler,
} from './errors'

export { ApiError } from './api'

// Type guards for runtime type checking
import type { Relic, AttackCalculationResult } from './relic'
import type { Build } from './build'

export const isRelic = (obj: any): obj is Relic => {
  return (
    obj &&
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.category === 'string' &&
    typeof obj.rarity === 'string' &&
    Array.isArray(obj.effects)
  )
}

export const isBuild = (obj: any): obj is Build => {
  return (
    obj &&
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    Array.isArray(obj.relics) &&
    typeof obj.combatStyle === 'string'
  )
}

export const isApiError = (obj: any): obj is import('./api').ApiError => {
  return obj && typeof obj.code === 'string' && typeof obj.message === 'string'
}

export const isAttackCalculationResult = (
  obj: any
): obj is AttackCalculationResult => {
  return (
    obj &&
    typeof obj.totalMultiplier === 'number' &&
    typeof obj.baseMultiplier === 'number' &&
    Array.isArray(obj.stackingBonuses) &&
    Array.isArray(obj.conditionalEffects)
  )
}

// Utility types for common patterns
export type Nullable<T> = T | null
export type Optional<T> = T | undefined
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
export type RequiredBy<T, K extends keyof T> = T & Required<Pick<T, K>>

// Generic ID type
export type ID = string

// Timestamp type
export type Timestamp = Date | string

// Generic list response wrapper
export interface ListResponse<T> {
  items: T[]
  total: number
  page?: number
  perPage?: number
  hasMore?: boolean
}

// Generic create/update response
export interface MutationResponse<T> {
  data: T
  success: boolean
  message?: string
}

// Pagination parameters
export interface PaginationParams {
  page?: number
  perPage?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

// Search parameters
export interface SearchParams extends PaginationParams {
  query?: string
  filters?: Record<string, any>
}

// Loading state helper
export interface AsyncState<T, E = Error> {
  data: T | null
  loading: boolean
  error: E | null
  lastUpdated?: Timestamp
}

// Form field state
export interface FieldState<T> {
  value: T
  error?: string
  touched: boolean
  dirty: boolean
  valid: boolean
}

// Generic form state
export type FormState<T extends Record<string, any>> = {
  [K in keyof T]: FieldState<T[K]>
} & {
  valid: boolean
  dirty: boolean
  submitting: boolean
}

// Event handler types
export type EventHandler<T = void> = (data: T) => void | Promise<void>
export type AsyncEventHandler<T = void> = (data: T) => Promise<void>

// Component instance types (for template refs)
export type ComponentRef<T = any> = T | null

// Router types (for future routing implementation)
export interface RouteParams {
  [key: string]: string | string[]
}

export interface QueryParams {
  [key: string]: string | string[] | undefined
}

// Storage types
export interface StorageItem<T> {
  value: T
  timestamp: number
  expiresAt?: number
}

// Configuration types
export interface AppConfig {
  apiUrl: string
  version: string
  environment: 'development' | 'production' | 'test'
  features: {
    shareBuilds: boolean
    optimization: boolean
    analytics: boolean
    debugging: boolean
  }
  limits: {
    maxRelicSelection: number
    maxSavedBuilds: number
    calculationTimeout: number
  }
}

// Constants
export const DEFAULT_MAX_RELIC_SELECTION = 9
export const DEFAULT_CALCULATION_TIMEOUT = 5000
export const API_VERSION = 'v1'

// Type-safe object keys utility
export const typedKeys = <T extends Record<string, unknown>>(
  obj: T
): Array<keyof T> => {
  return Object.keys(obj) as Array<keyof T>
}

// Type-safe object entries utility
export const typedEntries = <T extends Record<string, unknown>>(
  obj: T
): Array<[keyof T, T[keyof T]]> => {
  return Object.entries(obj) as Array<[keyof T, T[keyof T]]>
}

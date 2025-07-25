// Type guard functions for API response validation
import type { 
  ApiResponse, 
  PaginatedResponse,
  Relic, 
  Build, 
  CalculationResult,
  OptimizationResult
} from '../types'

// Base type guards
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function isString(value: unknown): value is string {
  return typeof value === 'string'
}

export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value)
}

export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean'
}

export function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value)
}

export function isDate(value: unknown): value is Date {
  return value instanceof Date && !isNaN(value.getTime())
}

export function isStringOrNull(value: unknown): value is string | null {
  return value === null || isString(value)
}

export function isNumberOrNull(value: unknown): value is number | null {
  return value === null || isNumber(value)
}

// API Response type guards
export function isApiResponse<T>(
  value: unknown,
  dataValidator: (data: unknown) => data is T
): value is ApiResponse<T> {
  if (!isObject(value)) return false
  
  const response = value as Record<string, unknown>
  
  // Check required fields
  if (!('success' in response) || !isBoolean(response.success)) return false
  if (!('data' in response)) return false
  if (!('message' in response) || !isStringOrNull(response.message)) return false
  
  // Validate data field
  if (!dataValidator(response.data)) return false
  
  // Check optional fields
  if ('meta' in response && response.meta !== null && !isObject(response.meta)) return false
  if ('errors' in response && response.errors !== null && !isArray(response.errors)) return false
  
  return true
}

export function isPaginatedResponse<T>(
  value: unknown,
  dataValidator: (data: unknown) => data is T[]
): value is PaginatedResponse<T[]> {
  if (!isApiResponse(value, dataValidator)) return false
  
  const response = value as ApiResponse<T[]>
  
  // Check if meta contains pagination info
  if (!response.meta || !isObject(response.meta)) return false
  
  const meta = response.meta as Record<string, unknown>
  if (!('pagination' in meta) || !isObject(meta.pagination)) return false
  
  const pagination = meta.pagination as Record<string, unknown>
  
  // Validate pagination fields
  const requiredFields = ['current_page', 'per_page', 'total_count']
  for (const field of requiredFields) {
    if (!(field in pagination) || !isNumber(pagination[field])) return false
  }
  
  return true
}

// Relic type guards
export function isRelicEffect(value: unknown): value is any {
  if (!isObject(value)) return false
  
  const effect = value as Record<string, unknown>
  
  return (
    'type' in effect && isString(effect.type) &&
    'multiplier' in effect && isNumber(effect.multiplier) &&
    ('description' in effect ? isStringOrNull(effect.description) : true) &&
    ('conditions' in effect ? isObject(effect.conditions) || effect.conditions === null : true)
  )
}

export function isRelic(value: unknown): value is Relic {
  if (!isObject(value)) return false
  
  const relic = value as Record<string, unknown>
  
  // Check required fields
  if (!('id' in relic) || !isString(relic.id)) return false
  if (!('name' in relic) || !isString(relic.name)) return false
  if (!('type' in relic) || !isString(relic.type)) return false
  
  // Check optional fields
  if ('description' in relic && !isStringOrNull(relic.description)) return false
  if ('attackMultiplier' in relic && !isNumberOrNull(relic.attackMultiplier)) return false
  if ('obtainmentDifficulty' in relic && !isNumberOrNull(relic.obtainmentDifficulty)) return false
  if ('rarity' in relic && !isStringOrNull(relic.rarity)) return false
  if ('source' in relic && !isStringOrNull(relic.source)) return false
  if ('imageUrl' in relic && !isStringOrNull(relic.imageUrl)) return false
  
  // Check effects array
  if ('effects' in relic) {
    if (!isArray(relic.effects)) return false
    if (!relic.effects.every(isRelicEffect)) return false
  }
  
  return true
}

export function isRelicArray(value: unknown): value is Relic[] {
  return isArray(value) && value.every(isRelic)
}

// Build type guards
export function isBuild(value: unknown): value is Build {
  if (!isObject(value)) return false
  
  const build = value as Record<string, unknown>
  
  // Check required fields
  if (!('id' in build) || !isString(build.id)) return false
  if (!('name' in build) || !isString(build.name)) return false
  if (!('relics' in build) || !isRelicArray(build.relics)) return false
  if (!('createdAt' in build) || !isString(build.createdAt)) return false
  if (!('lastModified' in build) || !isString(build.lastModified)) return false
  if (!('isPublic' in build) || !isBoolean(build.isPublic)) return false
  
  // Check optional fields
  if ('description' in build && !isStringOrNull(build.description)) return false
  if ('combatStyle' in build && !isStringOrNull(build.combatStyle)) return false
  if ('shareKey' in build && !isStringOrNull(build.shareKey)) return false
  if ('isFavorite' in build && !isBoolean(build.isFavorite)) return false
  if ('attackMultiplier' in build && !isNumberOrNull(build.attackMultiplier)) return false
  if ('obtainmentDifficulty' in build && !isNumberOrNull(build.obtainmentDifficulty)) return false
  
  // Check tags array
  if ('tags' in build) {
    if (!isArray(build.tags)) return false
    if (!build.tags.every(isString)) return false
  }
  
  return true
}

export function isBuildArray(value: unknown): value is Build[] {
  return isArray(value) && value.every(isBuild)
}

// Calculation result type guards
export function isAttackMultipliers(value: unknown): value is any {
  if (!isObject(value)) return false
  
  const multipliers = value as Record<string, unknown>
  
  return (
    'total' in multipliers && isNumber(multipliers.total) &&
    'base' in multipliers && isNumber(multipliers.base) &&
    'synergy' in multipliers && isNumber(multipliers.synergy) &&
    'conditional' in multipliers && isNumber(multipliers.conditional)
  )
}

export function isCalculationResult(value: unknown): value is CalculationResult {
  if (!isObject(value)) return false
  
  const result = value as Record<string, unknown>
  
  // Check required fields
  if (!('attackMultipliers' in result) || !isAttackMultipliers(result.attackMultipliers)) return false
  if (!('efficiency' in result) || !isNumber(result.efficiency)) return false
  if (!('obtainmentDifficulty' in result) || !isNumber(result.obtainmentDifficulty)) return false
  
  // Check optional arrays
  if ('relicDetails' in result && !isArray(result.relicDetails)) return false
  if ('effectBreakdown' in result && !isArray(result.effectBreakdown)) return false
  if ('calculationSteps' in result && !isArray(result.calculationSteps)) return false
  
  return true
}

// Optimization result type guards
export function isOptimizationSuggestion(value: unknown): value is any {
  if (!isObject(value)) return false
  
  const suggestion = value as Record<string, unknown>
  
  return (
    'id' in suggestion && isString(suggestion.id) &&
    'type' in suggestion && isString(suggestion.type) &&
    'priority' in suggestion && isString(suggestion.priority) &&
    'title' in suggestion && isString(suggestion.title) &&
    'description' in suggestion && isString(suggestion.description) &&
    'expectedImprovement' in suggestion && isNumber(suggestion.expectedImprovement)
  )
}

export function isOptimizationResult(value: unknown): value is OptimizationResult {
  if (!isObject(value)) return false
  
  const result = value as Record<string, unknown>
  
  // Check required fields
  if (!('suggestions' in result) || !isArray(result.suggestions)) return false
  if (!result.suggestions.every(isOptimizationSuggestion)) return false
  
  return true
}

// Validation helper functions
export function validateApiResponse<T>(
  response: unknown,
  dataValidator: (data: unknown) => data is T,
  context: string = 'API response'
): ApiResponse<T> {
  if (!isApiResponse(response, dataValidator)) {
    throw new Error(`Invalid ${context}: response structure is incorrect`)
  }
  
  if (!response.success) {
    throw new Error(`${context} failed: ${response.message || 'Unknown error'}`)
  }
  
  return response
}

export function validatePaginatedResponse<T>(
  response: unknown,
  dataValidator: (data: unknown) => data is T[],
  context: string = 'Paginated API response'
): PaginatedResponse<T[]> {
  if (!isPaginatedResponse(response, dataValidator)) {
    throw new Error(`Invalid ${context}: pagination structure is incorrect`)
  }
  
  const paginatedResponse = response as PaginatedResponse<T[]>
  
  if (!paginatedResponse.success) {
    throw new Error(`${context} failed: ${paginatedResponse.message || 'Unknown error'}`)
  }
  
  return paginatedResponse
}

// Runtime type checking wrapper
export function withTypeValidation<T, Args extends unknown[]>(
  apiCall: (...args: Args) => Promise<ApiResponse<T>>,
  validator: (data: unknown) => data is T,
  context: string
) {
  return async (...args: Args): Promise<ApiResponse<T>> => {
    try {
      const response = await apiCall(...args)
      return validateApiResponse(response, validator, context)
    } catch (error) {
      if (error instanceof TypeError || (error as Error).message.includes('Invalid')) {
        console.error(`Type validation failed for ${context}:`, error)
        throw new Error(`API response validation failed: ${context}`)
      }
      throw error
    }
  }
}

// Export common validators
export const validators = {
  relic: isRelic,
  relicArray: isRelicArray,
  build: isBuild,
  buildArray: isBuildArray,
  calculationResult: isCalculationResult,
  optimizationResult: isOptimizationResult,
  
  // Generic validators
  string: isString,
  number: isNumber,
  boolean: isBoolean,
  array: isArray,
  object: isObject
}
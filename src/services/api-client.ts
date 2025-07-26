// Type-safe API client with validation
import { apiService, apiHelpers } from './api'
import {
  validators,
  withTypeValidation,
  validateApiResponse,
  validatePaginatedResponse,
} from './type-guards'
import type {
  ApiResponse,
  PaginatedResponse,
  Relic,
  Build,
  CalculationRequest,
  CalculationResult,
  OptimizationRequest,
  OptimizationResult,
  RelicSearchParams,
  BuildSearchParams,
  BuildCreateRequest,
  BuildUpdateRequest,
} from '../types'

// Type-safe API client with automatic validation
export class TypeSafeApiClient {
  // Relic operations
  relics = {
    getAll: withTypeValidation(
      apiService.relics.getAll,
      validators.relicArray,
      'relics.getAll'
    ),

    search: async (
      params: RelicSearchParams
    ): Promise<PaginatedResponse<Relic[]>> => {
      const response = await apiService.relics.search(params)
      return validatePaginatedResponse(
        response,
        validators.relicArray,
        'relics.search'
      )
    },

    getById: withTypeValidation(
      apiService.relics.getById,
      validators.relic,
      'relics.getById'
    ),

    getBatch: withTypeValidation(
      apiService.relics.getBatch,
      validators.relicArray,
      'relics.getBatch'
    ),

    getCategories: withTypeValidation(
      apiService.relics.getCategories,
      (data): data is string[] =>
        validators.array(data) && data.every(validators.string),
      'relics.getCategories'
    ),

    getTypes: withTypeValidation(
      apiService.relics.getTypes,
      (data): data is string[] =>
        validators.array(data) && data.every(validators.string),
      'relics.getTypes'
    ),

    getRarities: withTypeValidation(
      apiService.relics.getRarities,
      (data): data is string[] =>
        validators.array(data) && data.every(validators.string),
      'relics.getRarities'
    ),

    getSources: withTypeValidation(
      apiService.relics.getSources,
      (data): data is string[] =>
        validators.array(data) && data.every(validators.string),
      'relics.getSources'
    ),

    getEffectTypes: withTypeValidation(
      apiService.relics.getEffectTypes,
      (data): data is string[] =>
        validators.array(data) && data.every(validators.string),
      'relics.getEffectTypes'
    ),

    getPopular: withTypeValidation(
      apiService.relics.getPopular,
      validators.relicArray,
      'relics.getPopular'
    ),

    getRecommended: withTypeValidation(
      apiService.relics.getRecommended,
      validators.relicArray,
      'relics.getRecommended'
    ),
  }

  // Build operations
  builds = {
    getAll: withTypeValidation(
      apiService.builds.getAll,
      validators.buildArray,
      'builds.getAll'
    ),

    search: async (
      params: BuildSearchParams
    ): Promise<PaginatedResponse<Build[]>> => {
      const response = await apiService.builds.search(params)
      return validatePaginatedResponse(
        response,
        validators.buildArray,
        'builds.search'
      )
    },

    getById: withTypeValidation(
      apiService.builds.getById,
      validators.build,
      'builds.getById'
    ),

    create: withTypeValidation(
      apiService.builds.create,
      validators.build,
      'builds.create'
    ),

    update: withTypeValidation(
      apiService.builds.update,
      validators.build,
      'builds.update'
    ),

    duplicate: withTypeValidation(
      apiService.builds.duplicate,
      validators.build,
      'builds.duplicate'
    ),

    getShared: withTypeValidation(
      apiService.builds.getShared,
      validators.build,
      'builds.getShared'
    ),

    calculate: withTypeValidation(
      apiService.builds.calculate,
      validators.calculationResult,
      'builds.calculate'
    ),

    optimize: withTypeValidation(
      apiService.builds.optimize,
      validators.optimizationResult,
      'builds.optimize'
    ),

    addRelic: withTypeValidation(
      apiService.builds.addRelic,
      validators.build,
      'builds.addRelic'
    ),

    removeRelic: withTypeValidation(
      apiService.builds.removeRelic,
      validators.build,
      'builds.removeRelic'
    ),

    reorderRelics: withTypeValidation(
      apiService.builds.reorderRelics,
      validators.build,
      'builds.reorderRelics'
    ),

    toggleFavorite: withTypeValidation(
      apiService.builds.toggleFavorite,
      validators.build,
      'builds.toggleFavorite'
    ),

    updateTags: withTypeValidation(
      apiService.builds.updateTags,
      validators.build,
      'builds.updateTags'
    ),

    getPopular: withTypeValidation(
      apiService.builds.getPopular,
      validators.buildArray,
      'builds.getPopular'
    ),

    getRecent: withTypeValidation(
      apiService.builds.getRecent,
      validators.buildArray,
      'builds.getRecent'
    ),

    getByUser: withTypeValidation(
      apiService.builds.getByUser,
      validators.buildArray,
      'builds.getByUser'
    ),
  }

  // Calculation operations
  calculation = {
    calculate: withTypeValidation(
      apiService.calculation.calculate,
      validators.calculationResult,
      'calculation.calculate'
    ),

    batchCalculate: withTypeValidation(
      apiService.calculation.batchCalculate,
      (data): data is CalculationResult[] =>
        validators.array(data) && data.every(validators.calculationResult),
      'calculation.batchCalculate'
    ),
  }

  // Optimization operations
  optimization = {
    suggest: withTypeValidation(
      apiService.optimization.suggest,
      validators.optimizationResult,
      'optimization.suggest'
    ),

    getRecommendations: withTypeValidation(
      apiService.optimization.getRecommendations,
      validators.array,
      'optimization.getRecommendations'
    ),
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      return await apiService.healthCheck()
    } catch (error) {
      console.error('Health check failed:', error)
      return false
    }
  }

  // Batch operations with type safety
  async batchGetRelics(ids: string[]): Promise<Relic[]> {
    const results = await apiHelpers.batchRequests(
      ids,
      async id => {
        const response = await this.relics.getById(id)
        return response.data
      },
      {
        concurrency: 10,
        onError: (error, id) => {
          console.warn(`Failed to fetch relic ${id}:`, error)
        },
      }
    )
    return results
  }

  async batchGetBuilds(ids: string[]): Promise<Build[]> {
    const results = await apiHelpers.batchRequests(
      ids,
      async id => {
        const response = await this.builds.getById(id)
        return response.data
      },
      {
        concurrency: 5,
        onError: (error, id) => {
          console.warn(`Failed to fetch build ${id}:`, error)
        },
      }
    )
    return results
  }

  // Paginated operations with automatic fetching
  async getAllRelics(options?: {
    maxPages?: number
    onProgress?: (progress: {
      current: number
      total: number
      items: number
    }) => void
  }): Promise<Relic[]> {
    return apiHelpers.getAllPages(async (page, perPage) => {
      return this.relics.search({ page, perPage })
    }, options)
  }

  async getAllBuilds(options?: {
    maxPages?: number
    onProgress?: (progress: {
      current: number
      total: number
      items: number
    }) => void
  }): Promise<Build[]> {
    return apiHelpers.getAllPages(async (page, perPage) => {
      return this.builds.search({ page, perPage })
    }, options)
  }

  // Cached operations
  private relicCache = apiHelpers.createCache<Relic>(300000) // 5 minutes
  private buildCache = apiHelpers.createCache<Build>(300000)

  async getCachedRelic(id: string): Promise<Relic> {
    const cached = this.relicCache.get(id)
    if (cached) {
      return cached
    }

    const response = await this.relics.getById(id)
    this.relicCache.set(id, response.data)
    return response.data
  }

  async getCachedBuild(id: string): Promise<Build> {
    const cached = this.buildCache.get(id)
    if (cached) {
      return cached
    }

    const response = await this.builds.getById(id)
    this.buildCache.set(id, response.data)
    return response.data
  }

  // Debounced search operations
  searchRelics = apiHelpers.debounce(
    async (
      query: string,
      filters?: Partial<RelicSearchParams>
    ): Promise<Relic[]> => {
      const response = await this.relics.search({
        query,
        ...filters,
        page: 1,
        perPage: 50,
      })
      return response.data
    },
    300
  )

  searchBuilds = apiHelpers.debounce(
    async (
      query: string,
      filters?: Partial<BuildSearchParams>
    ): Promise<Build[]> => {
      const response = await this.builds.search({
        query,
        ...filters,
        page: 1,
        perPage: 50,
      })
      return response.data
    },
    300
  )

  // Error handling with fallback
  async getRelicWithFallback(id: string): Promise<Relic | null> {
    return apiHelpers.withFallback(
      async () => {
        const response = await this.relics.getById(id)
        return response.data
      },
      async () => {
        // Fallback: try to get from cache or return null
        return this.relicCache.get(id) || null
      },
      error => {
        // Use fallback for network errors or 5xx server errors
        return error.status === 0 || (error.status >= 500 && error.status < 600)
      }
    )
  }

  async getBuildWithFallback(id: string): Promise<Build | null> {
    return apiHelpers.withFallback(
      async () => {
        const response = await this.builds.getById(id)
        return response.data
      },
      async () => {
        return this.buildCache.get(id) || null
      },
      error => {
        return error.status === 0 || (error.status >= 500 && error.status < 600)
      }
    )
  }

  // Cache management
  clearCache(): void {
    this.relicCache.clear()
    this.buildCache.clear()
  }

  getCacheStats(): {
    relics: { size: number; keys: string[] }
    builds: { size: number; keys: string[] }
  } {
    return {
      relics: {
        size: this.relicCache.size(),
        keys: this.relicCache.keys(),
      },
      builds: {
        size: this.buildCache.size(),
        keys: this.buildCache.keys(),
      },
    }
  }
}

// Export singleton instance
export const typeSafeApiClient = new TypeSafeApiClient()

// Export factory for creating custom instances
export const createTypeSafeApiClient = (): TypeSafeApiClient => {
  return new TypeSafeApiClient()
}

// Export for backward compatibility
export { apiService, apiHelpers } from './api'

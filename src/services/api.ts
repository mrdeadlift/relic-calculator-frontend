import type { 
  ApiResponse, 
  PaginatedResponse,
  CalculationRequest,
  CalculationResult,
  OptimizationRequest,
  OptimizationResult,
  Relic,
  Build,
  BuildCreateRequest,
  BuildUpdateRequest,
  RelicSearchParams,
  BuildSearchParams
} from '../types'
import { httpClient } from './http'

// API service functions
export const apiService = {
  // Health check endpoint
  async healthCheck(): Promise<boolean> {
    return httpClient.healthCheck()
  },

  // Relic-related endpoints
  relics: {
    async getAll(params?: RelicSearchParams): Promise<ApiResponse<Relic[]>> {
      return httpClient.get<Relic[]>('/relics', params)
    },

    async search(params: RelicSearchParams): Promise<PaginatedResponse<Relic[]>> {
      const response = await httpClient.get<Relic[]>('/relics/search', params)
      return response as PaginatedResponse<Relic[]>
    },

    async getById(id: string): Promise<ApiResponse<Relic>> {
      return httpClient.get<Relic>(`/relics/${id}`)
    },

    async getBatch(ids: string[]): Promise<ApiResponse<Relic[]>> {
      return httpClient.post<Relic[]>('/relics/batch', { ids })
    },

    async getCategories(): Promise<ApiResponse<string[]>> {
      return httpClient.get<string[]>('/relics/categories')
    },

    async getTypes(): Promise<ApiResponse<string[]>> {
      return httpClient.get<string[]>('/relics/types')
    },

    async getRarities(): Promise<ApiResponse<string[]>> {
      return httpClient.get<string[]>('/relics/rarities')
    },

    async getSources(): Promise<ApiResponse<string[]>> {
      return httpClient.get<string[]>('/relics/sources')
    },

    async getEffectTypes(): Promise<ApiResponse<string[]>> {
      return httpClient.get<string[]>('/relics/effect-types')
    },

    async validate(relicIds: string[], context?: any): Promise<ApiResponse<any>> {
      return httpClient.post('/relics/validate', {
        relic_ids: relicIds,
        ...context
      })
    },

    async compare(combinations: any[]): Promise<ApiResponse<any>> {
      return httpClient.post('/relics/compare', {
        combinations
      })
    },

    async getPopular(limit?: number): Promise<ApiResponse<Relic[]>> {
      return httpClient.get<Relic[]>('/relics/popular', { limit })
    },

    async getRecommended(basedOn?: string[], combatStyle?: string): Promise<ApiResponse<Relic[]>> {
      return httpClient.post<Relic[]>('/relics/recommended', {
        based_on: basedOn,
        combat_style: combatStyle
      })
    }
  },

  // Calculation endpoints
  calculation: {
    async calculate(request: CalculationRequest): Promise<ApiResponse<CalculationResult>> {
      return httpClient.post<CalculationResult>('/calculation/calculate', request)
    },

    async batchCalculate(requests: CalculationRequest[]): Promise<ApiResponse<CalculationResult[]>> {
      return httpClient.post<CalculationResult[]>('/calculation/batch', { requests })
    },

    async validate(request: CalculationRequest): Promise<ApiResponse<any>> {
      return httpClient.post('/calculation/validate', request)
    },

    async getSteps(request: CalculationRequest): Promise<ApiResponse<any[]>> {
      return httpClient.post<any[]>('/calculation/steps', request)
    }
  },

  // Optimization endpoints
  optimization: {
    async suggest(request: OptimizationRequest): Promise<ApiResponse<OptimizationResult>> {
      return httpClient.post<OptimizationResult>('/optimization/suggest', request)
    },

    async analyze(relicIds: string[], context?: any): Promise<ApiResponse<any>> {
      return httpClient.post('/optimization/analyze', {
        relic_ids: relicIds,
        ...context
      })
    },

    async compare(buildIds: string[]): Promise<ApiResponse<any>> {
      return httpClient.post('/optimization/compare', { build_ids: buildIds })
    },

    async getMetaBuilds(combatStyle: string, constraints?: any): Promise<ApiResponse<any[]>> {
      return httpClient.post('/optimization/meta_builds', {
        combat_style: combatStyle,
        ...constraints
      })
    },

    async getCacheStats(): Promise<ApiResponse<any>> {
      return httpClient.get('/optimization/cache_stats')
    },

    async clearCache(): Promise<ApiResponse<any>> {
      return httpClient.delete('/optimization/cache')
    },

    async batchCalculate(combinations: any[]): Promise<ApiResponse<any>> {
      return httpClient.post('/optimization/batch_calculate', {
        combinations
      })
    },

    async getRecommendations(buildId: string, constraints?: any): Promise<ApiResponse<any[]>> {
      return httpClient.post<any[]>(`/optimization/${buildId}/recommendations`, constraints)
    }
  },

  // Build management endpoints
  builds: {
    async getAll(params?: BuildSearchParams): Promise<ApiResponse<Build[]>> {
      return httpClient.get<Build[]>('/builds', params)
    },

    async search(params: BuildSearchParams): Promise<PaginatedResponse<Build[]>> {
      const response = await httpClient.get<Build[]>('/builds/search', params)
      return response as PaginatedResponse<Build[]>
    },

    async getById(id: string): Promise<ApiResponse<Build>> {
      return httpClient.get<Build>(`/builds/${id}`)
    },

    async create(build: BuildCreateRequest): Promise<ApiResponse<Build>> {
      return httpClient.post<Build>('/builds', build)
    },

    async update(id: string, build: BuildUpdateRequest): Promise<ApiResponse<Build>> {
      return httpClient.patch<Build>(`/builds/${id}`, build)
    },

    async delete(id: string): Promise<ApiResponse<{ deleted_build_id: string }>> {
      return httpClient.delete(`/builds/${id}`)
    },

    async duplicate(id: string, name?: string): Promise<ApiResponse<Build>> {
      return httpClient.post<Build>(`/builds/${id}/duplicate`, { name })
    },

    async share(id: string, options?: { expiresAt?: string; isPublic?: boolean }): Promise<ApiResponse<{ shareKey: string; shareUrl: string }>> {
      return httpClient.post(`/builds/${id}/share`, options)
    },

    async getShared(shareKey: string): Promise<ApiResponse<Build>> {
      return httpClient.get<Build>(`/builds/shared/${shareKey}`)
    },

    async calculate(id: string, context?: any): Promise<ApiResponse<CalculationResult>> {
      return httpClient.post<CalculationResult>(`/builds/${id}/calculate`, context)
    },

    async optimize(id: string, constraints?: any, preferences?: any): Promise<ApiResponse<OptimizationResult>> {
      return httpClient.post<OptimizationResult>(`/builds/${id}/optimize`, {
        constraints,
        preferences
      })
    },

    async addRelic(id: string, relicId: string, position?: number): Promise<ApiResponse<Build>> {
      return httpClient.post<Build>(`/builds/${id}/relics`, {
        relic_id: relicId,
        position
      })
    },

    async removeRelic(id: string, relicId: string): Promise<ApiResponse<Build>> {
      return httpClient.delete<Build>(`/builds/${id}/relics/${relicId}`)
    },

    async reorderRelics(id: string, relicIds: string[]): Promise<ApiResponse<Build>> {
      return httpClient.patch<Build>(`/builds/${id}/reorder`, {
        relic_ids: relicIds
      })
    },

    async toggleFavorite(id: string): Promise<ApiResponse<Build>> {
      return httpClient.patch<Build>(`/builds/${id}/favorite`)
    },

    async updateTags(id: string, tags: string[]): Promise<ApiResponse<Build>> {
      return httpClient.patch<Build>(`/builds/${id}/tags`, { tags })
    },

    async getPopular(limit?: number): Promise<ApiResponse<Build[]>> {
      return httpClient.get<Build[]>('/builds/popular', { limit })
    },

    async getRecent(limit?: number): Promise<ApiResponse<Build[]>> {
      return httpClient.get<Build[]>('/builds/recent', { limit })
    },

    async getByUser(userId: string, params?: BuildSearchParams): Promise<ApiResponse<Build[]>> {
      return httpClient.get<Build[]>(`/builds/user/${userId}`, params)
    },

    async exportBuild(id: string, format?: 'json' | 'csv'): Promise<Blob> {
      return httpClient.download(`/builds/${id}/export`, undefined, undefined, {
        params: { format: format || 'json' }
      })
    },

    async importBuild(data: FormData | object): Promise<ApiResponse<Build>> {
      if (data instanceof FormData) {
        return httpClient.upload<Build>('/builds/import', data as any)
      } else {
        return httpClient.post<Build>('/builds/import', data)
      }
    },

    async getStats(): Promise<ApiResponse<any>> {
      return httpClient.get('/builds/stats')
    }
  },

  // Admin endpoints (if needed)
  admin: {
    async getRelics(params?: any): Promise<ApiResponse<Relic[]>> {
      return httpClient.get<Relic[]>('/admin/relics', params)
    },

    async createRelic(relic: Partial<Relic>): Promise<ApiResponse<Relic>> {
      return httpClient.post<Relic>('/admin/relics', relic)
    },

    async updateRelic(id: string, relic: Partial<Relic>): Promise<ApiResponse<Relic>> {
      return httpClient.patch<Relic>(`/admin/relics/${id}`, relic)
    },

    async deleteRelic(id: string): Promise<ApiResponse<{ deleted_relic_id: string }>> {
      return httpClient.delete(`/admin/relics/${id}`)
    },

    async importRelics(data: FormData): Promise<ApiResponse<{ imported: number; errors: any[] }>> {
      return httpClient.upload<{ imported: number; errors: any[] }>('/admin/relics/import', data as any)
    },

    async exportRelics(format?: 'json' | 'csv'): Promise<Blob> {
      return httpClient.download('/admin/relics/export', undefined, undefined, {
        params: { format: format || 'json' }
      })
    },

    async getSystemStats(): Promise<ApiResponse<any>> {
      return httpClient.get('/admin/stats')
    },

    async clearCache(): Promise<ApiResponse<any>> {
      return httpClient.delete('/admin/cache')
    }
  },

  // User management endpoints
  users: {
    async getCurrentUser(): Promise<ApiResponse<any>> {
      return httpClient.get('/users/me')
    },

    async updateProfile(data: any): Promise<ApiResponse<any>> {
      return httpClient.patch('/users/me', data)
    },

    async getPreferences(): Promise<ApiResponse<any>> {
      return httpClient.get('/users/me/preferences')
    },

    async updatePreferences(preferences: any): Promise<ApiResponse<any>> {
      return httpClient.patch('/users/me/preferences', preferences)
    },

    async getFavoriteBuilds(): Promise<ApiResponse<Build[]>> {
      return httpClient.get<Build[]>('/users/me/favorites')
    },

    async getHistory(): Promise<ApiResponse<any[]>> {
      return httpClient.get<any[]>('/users/me/history')
    }
  },

  // Documentation endpoints
  documentation: {
    async getApiDocs(): Promise<ApiResponse<any>> {
      return httpClient.get('/documentation')
    },

    async getOpenApiSpec(): Promise<any> {
      return httpClient.get('/documentation/openapi.json')
    },

    async getChangeLog(): Promise<ApiResponse<any[]>> {
      return httpClient.get<any[]>('/documentation/changelog')
    }
  }
}

// Advanced API helper functions
export const apiHelpers = {
  // Handle paginated requests with automatic pagination
  async getAllPages<T>(
    apiCall: (page: number, perPage?: number) => Promise<PaginatedResponse<T[]>>,
    options: {
      maxPages?: number
      perPage?: number
      onProgress?: (progress: { current: number; total: number; items: number }) => void
    } = {}
  ): Promise<T[]> {
    const { maxPages = 50, perPage = 50, onProgress } = options
    const results: T[] = []
    let page = 1
    let hasMore = true
    let totalPages = 0

    while (hasMore && page <= maxPages) {
      try {
        const response = await apiCall(page, perPage)
        results.push(...response.data)
        
        // Update pagination info
        const pagination = response.meta?.pagination
        if (pagination) {
          hasMore = pagination.has_next_page
          totalPages = pagination.total_pages || 0
        } else {
          hasMore = response.data.length === perPage
        }

        // Report progress
        if (onProgress) {
          onProgress({
            current: page,
            total: totalPages || maxPages,
            items: results.length
          })
        }

        page++
      } catch (error) {
        console.error(`Error fetching page ${page}:`, error)
        break
      }
    }

    return results
  },

  // Batch requests with concurrency control
  async batchRequests<T, R>(
    items: T[],
    requestFn: (item: T) => Promise<R>,
    options: {
      concurrency?: number
      onProgress?: (completed: number, total: number) => void
      onError?: (error: any, item: T) => void
    } = {}
  ): Promise<R[]> {
    const { concurrency = 5, onProgress, onError } = options
    const results: R[] = []
    const errors: Array<{ item: T; error: any }> = []
    let completed = 0

    // Process items in batches
    for (let i = 0; i < items.length; i += concurrency) {
      const batch = items.slice(i, i + concurrency)
      
      const batchPromises = batch.map(async (item) => {
        try {
          const result = await requestFn(item)
          completed++
          if (onProgress) onProgress(completed, items.length)
          return result
        } catch (error) {
          completed++
          if (onError) onError(error, item)
          if (onProgress) onProgress(completed, items.length)
          errors.push({ item, error })
          throw error
        }
      })

      const batchResults = await Promise.allSettled(batchPromises)
      
      batchResults.forEach((result) => {
        if (result.status === 'fulfilled') {
          results.push(result.value)
        }
      })
    }

    // Log errors if any
    if (errors.length > 0) {
      console.warn(`Batch processing completed with ${errors.length} errors:`, errors)
    }

    return results
  },

  // Debounced API calls for search/filtering
  debounce<T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): (...args: Parameters<T>) => Promise<ReturnType<T>> {
    let timeoutId: number | null = null
    let latestResolve: ((value: ReturnType<T>) => void) | null = null
    let latestReject: ((error: any) => void) | null = null

    return (...args: Parameters<T>): Promise<ReturnType<T>> => {
      return new Promise((resolve, reject) => {
        // Cancel previous timeout and reject previous promise
        if (timeoutId) {
          clearTimeout(timeoutId)
          if (latestReject) {
            latestReject(new Error('Debounced call cancelled'))
          }
        }

        latestResolve = resolve
        latestReject = reject

        timeoutId = setTimeout(async () => {
          try {
            const result = await func(...args)
            if (latestResolve) latestResolve(result)
          } catch (error) {
            if (latestReject) latestReject(error)
          } finally {
            timeoutId = null
            latestResolve = null
            latestReject = null
          }
        }, delay)
      })
    }
  },

  // Throttled API calls to prevent rate limiting
  throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => Promise<ReturnType<T>> {
    let inThrottle = false

    return (...args: Parameters<T>): Promise<ReturnType<T>> => {
      return new Promise((resolve, reject) => {
        if (!inThrottle) {
          inThrottle = true
          
          setTimeout(() => {
            inThrottle = false
          }, limit)

          func(...args)
            .then(resolve)
            .catch(reject)
        } else {
          reject(new Error('Function call throttled'))
        }
      })
    }
  },

  // Cache API responses with TTL
  createCache<T>(ttl: number = 300000) { // 5 minutes default
    const cache = new Map<string, { data: T; expires: number }>()

    return {
      get(key: string): T | null {
        const entry = cache.get(key)
        if (!entry) return null
        
        if (Date.now() > entry.expires) {
          cache.delete(key)
          return null
        }
        
        return entry.data
      },

      set(key: string, data: T): void {
        cache.set(key, {
          data,
          expires: Date.now() + ttl
        })
      },

      delete(key: string): boolean {
        return cache.delete(key)
      },

      clear(): void {
        cache.clear()
      },

      size(): number {
        return cache.size
      },

      keys(): string[] {
        return Array.from(cache.keys())
      }
    }
  },

  // Create cancellable API calls
  cancellable<T>(
    apiCall: (signal: AbortSignal) => Promise<T>
  ): { promise: Promise<T>; cancel: () => void } {
    const controller = new AbortController()
    
    const promise = apiCall(controller.signal).catch(error => {
      if (error.name === 'AbortError') {
        throw new Error('Request was cancelled')
      }
      throw error
    })

    return {
      promise,
      cancel: () => controller.abort()
    }
  },

  // URL builder helper
  buildUrl(endpoint: string, params?: Record<string, any>): string {
    const url = new URL(endpoint, httpClient.getConfig().baseURL)
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(v => url.searchParams.append(key, String(v)))
          } else {
            url.searchParams.append(key, String(value))
          }
        }
      })
    }

    return url.toString()
  },

  // Response transformation helpers
  transformResponse<T, R>(
    apiCall: () => Promise<ApiResponse<T>>,
    transformer: (data: T) => R
  ): Promise<ApiResponse<R>> {
    return apiCall().then(response => ({
      ...response,
      data: transformer(response.data)
    }))
  },

  // Error recovery with fallback
  async withFallback<T>(
    primaryCall: () => Promise<T>,
    fallbackCall: () => Promise<T>,
    shouldUseFallback?: (error: any) => boolean
  ): Promise<T> {
    try {
      return await primaryCall()
    } catch (error) {
      if (shouldUseFallback && !shouldUseFallback(error)) {
        throw error
      }
      
      console.warn('Primary API call failed, using fallback:', error)
      return fallbackCall()
    }
  }
}
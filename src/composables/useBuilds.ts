import { ref, computed, reactive, watch } from 'vue'
import type { 
  Build, 
  BuildCreateRequest, 
  BuildUpdateRequest,
  Relic,
  CalculationResult,
  OptimizationResult,
  ApiError,
  PaginatedResponse
} from '../types'
import { apiService } from '../services/api'

// Global build state
const buildsCache = ref<Map<string, Build>>(new Map())
const currentBuild = ref<Build | null>(null)

export function useBuilds() {
  // Local reactive state
  const loading = ref(false)
  const error = ref<string | null>(null)
  const builds = ref<Build[]>([])
  
  // Pagination state
  const pagination = reactive({
    currentPage: 1,
    perPage: 20,
    totalPages: 0,
    totalCount: 0,
    hasNextPage: false,
    hasPrevPage: false
  })

  // Filter state
  const filters = reactive({
    search: '',
    combatStyle: '',
    visibility: '',
    sortBy: 'updated_at'
  })

  // Computed values
  const hasBuilds = computed(() => builds.value.length > 0)
  const isFirstPage = computed(() => pagination.currentPage === 1)
  const isLastPage = computed(() => pagination.currentPage === pagination.totalPages)

  // Helper functions
  const setError = (message: string | null) => {
    error.value = message
  }

  const clearError = () => {
    error.value = null
  }

  const updatePagination = (paginationData: any) => {
    Object.assign(pagination, {
      currentPage: paginationData.current_page,
      perPage: paginationData.per_page,
      totalPages: paginationData.total_pages,
      totalCount: paginationData.total_count,
      hasNextPage: paginationData.has_next_page,
      hasPrevPage: paginationData.has_prev_page
    })
  }

  // Main API functions
  const fetchBuilds = async (params?: any) => {
    loading.value = true
    clearError()

    try {
      const requestParams = {
        page: pagination.currentPage,
        per_page: pagination.perPage,
        search: filters.search || undefined,
        combat_style: filters.combatStyle || undefined,
        visibility: filters.visibility || undefined,
        sort_by: filters.sortBy,
        ...params
      }

      const response = await apiService.builds.list(requestParams) as PaginatedResponse<Build[]>
      
      builds.value = response.data
      updatePagination(response.meta.pagination)
      
      // Update cache
      response.data.forEach(build => {
        buildsCache.value.set(build.id, build)
      })
      
    } catch (err) {
      const apiError = err as ApiError
      setError(apiError.message || 'Failed to fetch builds')
      console.error('Error fetching builds:', err)
    } finally {
      loading.value = false
    }
  }

  const fetchBuild = async (id: string): Promise<Build | null> => {
    // Check cache first
    if (buildsCache.value.has(id)) {
      return buildsCache.value.get(id)!
    }

    loading.value = true
    clearError()

    try {
      const response = await apiService.builds.get(id)
      const build = response.data
      
      // Update cache
      buildsCache.value.set(id, build)
      
      return build
    } catch (err) {
      const apiError = err as ApiError
      setError(apiError.message || `Failed to fetch build ${id}`)
      console.error('Error fetching build:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  const createBuild = async (buildData: BuildCreateRequest): Promise<Build | null> => {
    loading.value = true
    clearError()

    try {
      const response = await apiService.builds.create(buildData)
      const build = response.data
      
      // Update cache and local state
      buildsCache.value.set(build.id, build)
      builds.value.unshift(build)
      
      return build
    } catch (err) {
      const apiError = err as ApiError
      setError(apiError.message || 'Failed to create build')
      console.error('Error creating build:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  const updateBuild = async (id: string, buildData: BuildUpdateRequest): Promise<Build | null> => {
    loading.value = true
    clearError()

    try {
      const response = await apiService.builds.update(id, buildData)
      const updatedBuild = response.data
      
      // Update cache and local state
      buildsCache.value.set(id, updatedBuild)
      const index = builds.value.findIndex(b => b.id === id)
      if (index !== -1) {
        builds.value[index] = updatedBuild
      }
      
      // Update current build if it's the one being updated
      if (currentBuild.value?.id === id) {
        currentBuild.value = updatedBuild
      }
      
      return updatedBuild
    } catch (err) {
      const apiError = err as ApiError
      setError(apiError.message || 'Failed to update build')
      console.error('Error updating build:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  const deleteBuild = async (id: string): Promise<boolean> => {
    loading.value = true
    clearError()

    try {
      await apiService.builds.delete(id)
      
      // Remove from cache and local state
      buildsCache.value.delete(id)
      builds.value = builds.value.filter(b => b.id !== id)
      
      // Clear current build if it's the one being deleted
      if (currentBuild.value?.id === id) {
        currentBuild.value = null
      }
      
      return true
    } catch (err) {
      const apiError = err as ApiError
      setError(apiError.message || 'Failed to delete build')
      console.error('Error deleting build:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  const cloneBuild = async (id: string, name?: string): Promise<Build | null> => {
    loading.value = true
    clearError()

    try {
      const response = await apiService.builds.clone(id, name)
      const clonedBuild = response.data
      
      // Update cache and local state
      buildsCache.value.set(clonedBuild.id, clonedBuild)
      builds.value.unshift(clonedBuild)
      
      return clonedBuild
    } catch (err) {
      const apiError = err as ApiError
      setError(apiError.message || 'Failed to clone build')
      console.error('Error cloning build:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  // Pagination functions
  const goToPage = async (page: number) => {
    if (page < 1 || page > pagination.totalPages) return
    pagination.currentPage = page
    await fetchBuilds()
  }

  const nextPage = async () => {
    if (pagination.hasNextPage) {
      await goToPage(pagination.currentPage + 1)
    }
  }

  const prevPage = async () => {
    if (pagination.hasPrevPage) {
      await goToPage(pagination.currentPage - 1)
    }
  }

  // Filter functions
  const updateFilters = (newFilters: Partial<typeof filters>) => {
    Object.assign(filters, newFilters)
    pagination.currentPage = 1 // Reset to first page when filtering
  }

  const clearFilters = () => {
    Object.assign(filters, {
      search: '',
      combatStyle: '',
      visibility: '',
      sortBy: 'updated_at'
    })
    pagination.currentPage = 1
  }

  const applyFilters = async () => {
    pagination.currentPage = 1
    await fetchBuilds()
  }

  // Current build management
  const setCurrentBuild = (build: Build | null) => {
    currentBuild.value = build
  }

  const getCurrentBuild = () => {
    return currentBuild.value
  }

  // Cache management
  const getCachedBuild = (id: string): Build | undefined => {
    return buildsCache.value.get(id)
  }

  const clearCache = () => {
    buildsCache.value.clear()
  }

  const refreshBuilds = async () => {
    clearCache()
    await fetchBuilds()
  }

  // Initialize function for compatibility
  const initialize = async () => {
    await fetchBuilds()
  }

  return {
    // State
    loading: readonly(loading),
    error: readonly(error),
    builds: readonly(builds),
    pagination: readonly(pagination),
    filters: readonly(filters),
    currentBuild: readonly(currentBuild),

    // Computed
    hasBuilds,
    isFirstPage,
    isLastPage,

    // Functions
    fetchBuilds,
    fetchBuild,
    createBuild,
    updateBuild,
    deleteBuild,
    cloneBuild,
    goToPage,
    nextPage,
    prevPage,
    updateFilters,
    clearFilters,
    applyFilters,
    setCurrentBuild,
    getCurrentBuild,
    getCachedBuild,
    clearCache,
    refreshBuilds,
    clearError,
    initialize
  }
}

export function useBuildCalculation() {
  const loading = ref(false)
  const error = ref<string | null>(null)
  const result = ref<CalculationResult | null>(null)

  const isCalculating = computed(() => loading.value)
  const hasResult = computed(() => result.value !== null)

  const calculateBuild = async (buildId: string, context?: any) => {
    loading.value = true
    error.value = null

    try {
      const response = await apiService.builds.calculate(buildId, context)
      result.value = response.data.calculation
    } catch (err) {
      const apiError = err as ApiError
      error.value = apiError.message || 'Build calculation failed'
      console.error('Build calculation error:', err)
    } finally {
      loading.value = false
    }
  }

  const clearResult = () => {
    result.value = null
    error.value = null
  }

  return {
    loading: readonly(loading),
    error: readonly(error),
    result: readonly(result),
    isCalculating,
    hasResult,
    calculateBuild,
    clearResult
  }
}

export function useBuildOptimization() {
  const loading = ref(false)
  const error = ref<string | null>(null)
  const suggestions = ref<OptimizationResult | null>(null)

  const isOptimizing = computed(() => loading.value)
  const hasSuggestions = computed(() => suggestions.value !== null)

  const optimizeBuild = async (buildId: string, constraints?: any, preferences?: any) => {
    loading.value = true
    error.value = null

    try {
      const response = await apiService.builds.optimize(buildId, constraints, preferences)
      suggestions.value = response.data.optimization
    } catch (err) {
      const apiError = err as ApiError
      error.value = apiError.message || 'Build optimization failed'
      console.error('Build optimization error:', err)
    } finally {
      loading.value = false
    }
  }

  const clearSuggestions = () => {
    suggestions.value = null
    error.value = null
  }

  return {
    loading: readonly(loading),
    error: readonly(error),
    suggestions: readonly(suggestions),
    isOptimizing,
    hasSuggestions,
    optimizeBuild,
    clearSuggestions
  }
}

export function useBuildRelicManagement() {
  const loading = ref(false)
  const error = ref<string | null>(null)

  const addRelicToBuild = async (
    buildId: string, 
    relicId: string, 
    position?: number, 
    customConditions?: any
  ): Promise<boolean> => {
    loading.value = true
    error.value = null

    try {
      await apiService.builds.addRelic(buildId, relicId, position, customConditions)
      return true
    } catch (err) {
      const apiError = err as ApiError
      error.value = apiError.message || 'Failed to add relic to build'
      console.error('Error adding relic to build:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  const removeRelicFromBuild = async (buildId: string, relicId: string): Promise<boolean> => {
    loading.value = true
    error.value = null

    try {
      await apiService.builds.removeRelic(buildId, relicId)
      return true
    } catch (err) {
      const apiError = err as ApiError
      error.value = apiError.message || 'Failed to remove relic from build'
      console.error('Error removing relic from build:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  const reorderBuildRelics = async (buildId: string, relicIds: string[]): Promise<boolean> => {
    loading.value = true
    error.value = null

    try {
      await apiService.builds.reorderRelics(buildId, relicIds)
      return true
    } catch (err) {
      const apiError = err as ApiError
      error.value = apiError.message || 'Failed to reorder relics'
      console.error('Error reordering relics:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  return {
    loading: readonly(loading),
    error: readonly(error),
    addRelicToBuild,
    removeRelicFromBuild,
    reorderBuildRelics
  }
}

export function useSharedBuilds() {
  const loading = ref(false)
  const error = ref<string | null>(null)
  const sharedBuild = ref<any | null>(null)

  const fetchSharedBuild = async (shareKey: string) => {
    loading.value = true
    error.value = null

    try {
      const response = await apiService.builds.getShared(shareKey)
      sharedBuild.value = response.data
    } catch (err) {
      const apiError = err as ApiError
      error.value = apiError.message || 'Failed to fetch shared build'
      console.error('Error fetching shared build:', err)
    } finally {
      loading.value = false
    }
  }

  const clearSharedBuild = () => {
    sharedBuild.value = null
    error.value = null
  }

  return {
    loading: readonly(loading),
    error: readonly(error),
    sharedBuild: readonly(sharedBuild),
    fetchSharedBuild,
    clearSharedBuild
  }
}
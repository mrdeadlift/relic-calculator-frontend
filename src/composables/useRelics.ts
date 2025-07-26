import { ref, computed, reactive, watch, readonly } from 'vue'
import type { Ref } from 'vue'
import type {
  Relic,
  CalculationRequest,
  ApiError,
  PaginatedResponse,
} from '../types'
import type { AttackMultiplierResult } from '../types/calculation'
import { apiService, apiHelpers } from '../services/api'

// Global relic state
const relicsCache = ref<Map<string, Relic>>(new Map())
const categories = ref<string[]>([])
const rarities = ref<string[]>([])
const lastUpdated = ref<Date | null>(null)

export function useRelics() {
  // Local reactive state
  const loading = ref(false)
  const error = ref<string | null>(null)
  const relics = ref<Relic[]>([])

  // Pagination state
  const pagination = reactive({
    currentPage: 1,
    perPage: 20,
    totalPages: 0,
    totalCount: 0,
    hasNextPage: false,
    hasPrevPage: false,
  })

  // Filter state
  const filters = reactive({
    search: '',
    category: '',
    rarity: '',
    quality: '',
    minDifficulty: 1,
    maxDifficulty: 10,
    sortBy: 'name',
  })

  // Computed values
  const filteredRelicsCount = computed(() => relics.value.length)
  const hasRelics = computed(() => relics.value.length > 0)
  const isFirstPage = computed(() => pagination.currentPage === 1)
  const isLastPage = computed(
    () => pagination.currentPage === pagination.totalPages
  )

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
      hasPrevPage: paginationData.has_prev_page,
    })
  }

  // Main API functions
  const fetchRelics = async (params?: any) => {
    loading.value = true
    clearError()

    try {
      const requestParams = {
        page: pagination.currentPage,
        per_page: pagination.perPage,
        search: filters.search || undefined,
        category: filters.category || undefined,
        rarity: filters.rarity || undefined,
        quality: filters.quality || undefined,
        min_difficulty: filters.minDifficulty,
        max_difficulty: filters.maxDifficulty,
        sort_by: filters.sortBy,
        ...params,
      }

      const response = (await apiService.relics.search(
        requestParams
      )) as PaginatedResponse<Relic[]>

      relics.value = response.data
      updatePagination(response.meta.pagination)

      // Update cache
      response.data.forEach(relic => {
        relicsCache.value.set(relic.id, relic)
      })

      lastUpdated.value = new Date()
    } catch (err) {
      const apiError = err as ApiError
      setError(apiError.message || 'Failed to fetch relics')
      console.error('Error fetching relics:', err)
    } finally {
      loading.value = false
    }
  }

  const fetchRelic = async (id: string): Promise<Relic | null> => {
    // Check cache first
    if (relicsCache.value.has(id)) {
      return relicsCache.value.get(id)!
    }

    loading.value = true
    clearError()

    try {
      const response = await apiService.relics.getById(id)
      const relic = response.data

      // Update cache
      relicsCache.value.set(id, relic)

      return relic
    } catch (err) {
      const apiError = err as ApiError
      setError(apiError.message || `Failed to fetch relic ${id}`)
      console.error('Error fetching relic:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  const fetchCategories = async () => {
    if (categories.value.length > 0) {
      return categories.value
    }

    try {
      const response = await apiService.relics.getCategories()
      categories.value = response.data.map((cat: any) => cat.name)
      return categories.value
    } catch (err) {
      console.error('Error fetching categories:', err)
      return []
    }
  }

  const fetchRarities = async () => {
    if (rarities.value.length > 0) {
      return rarities.value
    }

    try {
      const response = await apiService.relics.getRarities()
      rarities.value = response.data.map((rarity: any) => rarity.name)
      return rarities.value
    } catch (err) {
      console.error('Error fetching rarities:', err)
      return []
    }
  }

  // Pagination functions
  const goToPage = async (page: number) => {
    if (page < 1 || page > pagination.totalPages) return
    pagination.currentPage = page
    await fetchRelics()
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
      category: '',
      rarity: '',
      quality: '',
      minDifficulty: 1,
      maxDifficulty: 10,
      sortBy: 'name',
    })
    pagination.currentPage = 1
  }

  const applyFilters = async () => {
    pagination.currentPage = 1
    await fetchRelics()
  }

  // Search with debouncing
  const debouncedSearch = apiHelpers.debounce(async (searchTerm: string) => {
    filters.search = searchTerm
    pagination.currentPage = 1
    await fetchRelics()
  }, 500)

  const searchRelics = (searchTerm: string) => {
    debouncedSearch(searchTerm)
  }

  // Cache management
  const getCachedRelic = (id: string): Relic | undefined => {
    return relicsCache.value.get(id)
  }

  const clearCache = () => {
    relicsCache.value.clear()
    lastUpdated.value = null
  }

  const refreshRelics = async () => {
    clearCache()
    await fetchRelics()
  }

  // Initialize
  const initialize = async () => {
    await Promise.all([fetchRelics(), fetchCategories(), fetchRarities()])
  }

  return {
    // State
    loading: readonly(loading),
    error: readonly(error),
    relics: readonly(relics),
    pagination: readonly(pagination),
    filters: readonly(filters),
    categories: readonly(categories),
    rarities: readonly(rarities),
    lastUpdated: readonly(lastUpdated),

    // Computed
    filteredRelicsCount,
    hasRelics,
    isFirstPage,
    isLastPage,

    // Functions
    fetchRelics,
    fetchRelic,
    fetchCategories,
    fetchRarities,
    goToPage,
    nextPage,
    prevPage,
    updateFilters,
    clearFilters,
    applyFilters,
    searchRelics,
    getCachedRelic,
    clearCache,
    refreshRelics,
    initialize,
    clearError,
  }
}

export function useRelicCalculation() {
  const loading = ref(false)
  const error = ref<string | null>(null)
  const result = ref<AttackMultiplierResult | null>(null)
  const lastCalculation = ref<CalculationRequest | null>(null)

  const isCalculating = computed(() => loading.value)
  const hasResult = computed(() => result.value !== null)
  const canRecalculate = computed(() => lastCalculation.value !== null)

  const calculate = async (request: CalculationRequest) => {
    loading.value = true
    error.value = null

    try {
      const response = await apiService.calculation.calculate(request)
      result.value = response.data
      lastCalculation.value = { ...request }
    } catch (err) {
      const apiError = err as ApiError
      error.value = apiError.message || 'Calculation failed'
      console.error('Calculation error:', err)
    } finally {
      loading.value = false
    }
  }

  const recalculate = async () => {
    if (lastCalculation.value) {
      await calculate(lastCalculation.value)
    }
  }

  const clearResult = () => {
    result.value = null
    lastCalculation.value = null
    error.value = null
  }

  const validateCombination = async (relicIds: string[], context?: any) => {
    loading.value = true
    error.value = null

    try {
      const response = await apiService.relics.validate(relicIds, context)
      return response.data
    } catch (err) {
      const apiError = err as ApiError
      error.value = apiError.message || 'Validation failed'
      console.error('Validation error:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  return {
    loading: readonly(loading),
    error: readonly(error),
    result: readonly(result),
    lastCalculation: readonly(lastCalculation),
    isCalculating,
    hasResult,
    canRecalculate,
    calculate,
    recalculate,
    clearResult,
    validateCombination,
  }
}

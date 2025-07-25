import { ref, computed, reactive } from 'vue'
import type { 
  OptimizationRequest, 
  OptimizationResult,
  CalculationResult,
  Relic,
  ApiError
} from '../types'
import { apiService } from '../services/api'

export function useOptimization() {
  const loading = ref(false)
  const error = ref<string | null>(null)
  const suggestions = ref<OptimizationResult | null>(null)
  const analysisResult = ref<any | null>(null)
  const metaBuilds = ref<any[]>([])
  const cacheStats = ref<any | null>(null)

  // State flags
  const isOptimizing = computed(() => loading.value)
  const hasSuggestions = computed(() => suggestions.value !== null && suggestions.value.suggestions.length > 0)
  const hasAnalysis = computed(() => analysisResult.value !== null)
  const hasMetaBuilds = computed(() => metaBuilds.value.length > 0)

  // Optimization constraints
  const constraints = reactive({
    maxDifficulty: 8,
    allowedCategories: [] as string[],
    excludeRelicIds: [] as string[],
    preferHighRarity: false,
    preferLowDifficulty: true,
    minImprovement: 0.1
  })

  // Helper functions
  const setError = (message: string | null) => {
    error.value = message
  }

  const clearError = () => {
    error.value = null
  }

  // Main optimization function
  const suggestOptimizations = async (request: OptimizationRequest) => {
    loading.value = true
    clearError()

    try {
      const response = await apiService.optimization.suggest(request)
      suggestions.value = response.data
    } catch (err) {
      const apiError = err as ApiError
      setError(apiError.message || 'Optimization failed')
      console.error('Optimization error:', err)
    } finally {
      loading.value = false
    }
  }

  // Alias for backward compatibility
  const suggestOptimization = suggestOptimizations

  // Quick optimization for current build
  const optimizeCurrentBuild = async (currentRelicIds: string[], combatStyle: string = 'melee') => {
    const request: OptimizationRequest = {
      relic_ids: currentRelicIds,
      combat_style: combatStyle,
      constraints: {
        maxDifficulty: constraints.maxDifficulty,
        allowedCategories: constraints.allowedCategories.length > 0 ? constraints.allowedCategories : undefined,
        excludeRelicIds: constraints.excludeRelicIds.length > 0 ? constraints.excludeRelicIds : undefined
      },
      preferences: {
        preferHighRarity: constraints.preferHighRarity,
        preferLowDifficulty: constraints.preferLowDifficulty,
        minImprovement: constraints.minImprovement
      }
    }

    await suggestOptimizations(request)
  }

  // Build analysis
  const analyzeBuild = async (relicIds: string[], context?: any) => {
    loading.value = true
    clearError()

    try {
      const response = await apiService.optimization.analyze(relicIds, context)
      analysisResult.value = response.data
    } catch (err) {
      const apiError = err as ApiError
      setError(apiError.message || 'Analysis failed')
      console.error('Analysis error:', err)
    } finally {
      loading.value = false
    }
  }

  // Meta builds for combat style
  const fetchMetaBuilds = async (combatStyle: string, constraints?: any) => {
    loading.value = true
    clearError()

    try {
      const response = await apiService.optimization.getMetaBuilds(combatStyle, constraints)
      metaBuilds.value = response.data
    } catch (err) {
      const apiError = err as ApiError
      setError(apiError.message || 'Failed to fetch meta builds')
      console.error('Meta builds error:', err)
    } finally {
      loading.value = false
    }
  }

  // Cache statistics
  const fetchCacheStats = async () => {
    try {
      const response = await apiService.optimization.getCacheStats()
      cacheStats.value = response.data
    } catch (err) {
      console.error('Cache stats error:', err)
    }
  }

  // Batch calculation for multiple combinations
  const batchCalculate = async (combinations: any[]) => {
    loading.value = true
    clearError()

    try {
      const response = await apiService.optimization.batchCalculate(combinations)
      return response.data
    } catch (err) {
      const apiError = err as ApiError
      setError(apiError.message || 'Batch calculation failed')
      console.error('Batch calculation error:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  // Constraint management
  const updateConstraints = (newConstraints: Partial<typeof constraints>) => {
    Object.assign(constraints, newConstraints)
  }

  const resetConstraints = () => {
    Object.assign(constraints, {
      maxDifficulty: 8,
      allowedCategories: [],
      excludeRelicIds: [],
      preferHighRarity: false,
      preferLowDifficulty: true,
      minImprovement: 0.1
    })
  }

  // Clear functions
  const clearSuggestions = () => {
    suggestions.value = null
    error.value = null
  }

  const clearAnalysis = () => {
    analysisResult.value = null
    error.value = null
  }

  const clearMetaBuilds = () => {
    metaBuilds.value = []
  }

  const clearAll = () => {
    clearSuggestions()
    clearAnalysis()
    clearMetaBuilds()
    cacheStats.value = null
  }

  return {
    // State
    loading: readonly(loading),
    error: readonly(error),
    suggestions: readonly(suggestions),
    analysisResult: readonly(analysisResult),
    metaBuilds: readonly(metaBuilds),
    cacheStats: readonly(cacheStats),
    constraints: readonly(constraints),

    // Computed
    isOptimizing,
    hasSuggestions,
    hasAnalysis,
    hasMetaBuilds,

    // Functions
    suggestOptimizations,
    suggestOptimization, // Alias for backward compatibility
    optimizeCurrentBuild,
    analyzeBuild,
    fetchMetaBuilds,
    fetchCacheStats,
    batchCalculate,
    updateConstraints,
    resetConstraints,
    clearSuggestions,
    clearAnalysis,
    clearMetaBuilds,
    clearAll,
    clearError
  }
}

export function useOptimizationComparison() {
  const loading = ref(false)
  const error = ref<string | null>(null)
  const comparisonResults = ref<any | null>(null)

  const comparisons = ref<Array<{
    id: string
    name: string
    relicIds: string[]
    combatStyle: string
    result?: CalculationResult
  }>>([])

  const isComparing = computed(() => loading.value)
  const hasComparisons = computed(() => comparisons.value.length > 0)
  const hasResults = computed(() => comparisonResults.value !== null)

  const addComparison = (
    id: string,
    name: string,
    relicIds: string[],
    combatStyle: string = 'melee'
  ) => {
    const existing = comparisons.value.find(c => c.id === id)
    if (!existing) {
      comparisons.value.push({
        id,
        name,
        relicIds,
        combatStyle
      })
    }
  }

  const removeComparison = (id: string) => {
    comparisons.value = comparisons.value.filter(c => c.id !== id)
  }

  const clearComparisons = () => {
    comparisons.value = []
    comparisonResults.value = null
    error.value = null
  }

  const runComparison = async () => {
    if (comparisons.value.length < 2) {
      error.value = 'At least 2 builds are required for comparison'
      return
    }

    loading.value = true
    error.value = null

    try {
      const combinations = comparisons.value.map(comp => ({
        build_id: comp.id,
        name: comp.name,
        relic_ids: comp.relicIds,
        combat_style: comp.combatStyle
      }))

      const response = await apiService.relics.compare(combinations)
      comparisonResults.value = response.data

      // Update individual results
      comparisons.value.forEach(comp => {
        const result = response.data.comparisons.find((r: any) => r.build_id === comp.id)
        if (result) {
          comp.result = result
        }
      })

    } catch (err) {
      const apiError = err as ApiError
      error.value = apiError.message || 'Comparison failed'
      console.error('Comparison error:', err)
    } finally {
      loading.value = false
    }
  }

  const getBestBuild = computed(() => {
    if (!comparisonResults.value?.winner) return null
    return comparisons.value.find(c => c.id === comparisonResults.value.winner.build_id)
  })

  const getWorstBuild = computed(() => {
    if (!comparisonResults.value?.comparisons) return null
    const worst = comparisonResults.value.comparisons.reduce((min: any, current: any) => 
      current.attack_multipliers.total < min.attack_multipliers.total ? current : min
    )
    return comparisons.value.find(c => c.id === worst.build_id)
  })

  return {
    // State
    loading: readonly(loading),
    error: readonly(error),
    comparisonResults: readonly(comparisonResults),
    comparisons: readonly(comparisons),

    // Computed
    isComparing,
    hasComparisons,
    hasResults,
    getBestBuild,
    getWorstBuild,

    // Functions
    addComparison,
    removeComparison,
    clearComparisons,
    runComparison
  }
}

export function useOptimizationHistory() {
  const history = ref<Array<{
    id: string
    timestamp: Date
    request: OptimizationRequest
    result: OptimizationResult
    type: 'optimization' | 'analysis' | 'comparison'
  }>>([])

  const maxHistorySize = 50

  const addToHistory = (
    request: OptimizationRequest,
    result: OptimizationResult,
    type: 'optimization' | 'analysis' | 'comparison' = 'optimization'
  ) => {
    const entry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      request,
      result,
      type
    }

    history.value.unshift(entry)

    // Keep only the most recent entries
    if (history.value.length > maxHistorySize) {
      history.value = history.value.slice(0, maxHistorySize)
    }
  }

  const getHistoryByType = (type?: 'optimization' | 'analysis' | 'comparison') => {
    if (!type) return history.value
    return history.value.filter(entry => entry.type === type)
  }

  const clearHistory = () => {
    history.value = []
  }

  const removeFromHistory = (id: string) => {
    history.value = history.value.filter(entry => entry.id !== id)
  }

  const exportHistory = () => {
    return JSON.stringify(history.value, null, 2)
  }

  const importHistory = (jsonData: string) => {
    try {
      const importedHistory = JSON.parse(jsonData)
      if (Array.isArray(importedHistory)) {
        history.value = importedHistory.slice(0, maxHistorySize)
        return true
      }
    } catch (error) {
      console.error('Failed to import history:', error)
    }
    return false
  }

  return {
    history: readonly(history),
    addToHistory,
    getHistoryByType,
    clearHistory,
    removeFromHistory,
    exportHistory,
    importHistory
  }
}
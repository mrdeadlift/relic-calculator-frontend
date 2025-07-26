import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type {
  CalculationResult,
  CalculationRequest,
  ConditionalEffects,
} from '../types/calculation'
import type { Relic } from '../types/relic'
import { apiService } from '../services/api'
import { useToast } from '../composables/useToast'
import { useRelicsStore } from './relics'

interface CalculationCache {
  key: string
  result: CalculationResult
  timestamp: number
}

interface CalculationHistory {
  id: string
  request: CalculationRequest
  result: CalculationResult
  timestamp: Date
}

export const useCalculationStore = defineStore('calculation', () => {
  // State
  const currentResult = ref<CalculationResult | null>(null)
  const isCalculating = ref(false)
  const error = ref<string | null>(null)
  const conditionalEffects = ref<ConditionalEffects>({
    enemyType: 'normal',
    playerHealth: 100,
    comboCount: 0,
    isFirstHit: false,
    environmentEffects: [],
  })

  // Cache and history
  const cache = ref<Map<string, CalculationCache>>(new Map())
  const history = ref<CalculationHistory[]>([])
  const maxCacheSize = 100
  const maxHistorySize = 50
  const cacheExpiration = 15 * 60 * 1000 // 15 minutes

  // Settings
  const autoCalculate = ref(true)
  const enableClientSideCalculation = ref(true)
  const showCalculationSteps = ref(false)
  const useOptimizedCalculation = ref(true)

  // Statistics
  const calculationStats = ref({
    totalCalculations: 0,
    cacheHits: 0,
    averageCalculationTime: 0,
    lastCalculationTime: 0,
  })

  // Composables
  const { error: showError, success, info } = useToast()
  const relicsStore = useRelicsStore()

  // Computed
  const hasResult = computed(() => currentResult.value !== null)
  const selectedRelics = computed(() => relicsStore.selectedRelics)

  const currentMultiplier = computed(
    () => currentResult.value?.attackMultipliers.total || 0
  )

  const calculationSummary = computed(() => {
    if (!currentResult.value) return null

    const result = currentResult.value
    return {
      totalMultiplier: result.attackMultipliers.total,
      baseMultiplier: result.attackMultipliers.base,
      synergyBonus: result.attackMultipliers.synergy,
      conditionalBonus: result.attackMultipliers.conditional,
      efficiency: result.efficiency,
      difficulty: result.obtainmentDifficulty,
      relicCount: result.relicDetails.length,
      activeEffects: result.effectBreakdown.length,
    }
  })

  const isOptimal = computed(() => {
    if (!currentResult.value) return false
    return (
      currentResult.value.efficiency > 3.0 &&
      currentResult.value.attackMultipliers.total > 2.0
    )
  })

  const cacheStats = computed(() => ({
    size: cache.value.size,
    hitRate:
      calculationStats.value.totalCalculations > 0
        ? (
            (calculationStats.value.cacheHits /
              calculationStats.value.totalCalculations) *
            100
          ).toFixed(1)
        : '0',
    totalCalculations: calculationStats.value.totalCalculations,
    averageTime: calculationStats.value.averageCalculationTime.toFixed(2),
  }))

  // Actions
  const calculateAttackMultiplier = async (
    relics?: Relic[],
    conditions?: ConditionalEffects
  ) => {
    const targetRelics = relics || selectedRelics.value
    const targetConditions = conditions || conditionalEffects.value

    if (targetRelics.length === 0) {
      currentResult.value = null
      return null
    }

    // Create calculation request
    const request: CalculationRequest = {
      relicIds: targetRelics.map(r => r.id),
      conditionalEffects: targetConditions,
    }

    // Check cache first
    const cacheKey = generateCacheKey(request)
    const cached = getCachedResult(cacheKey)
    if (cached) {
      currentResult.value = cached
      calculationStats.value.cacheHits++
      calculationStats.value.totalCalculations++
      return cached
    }

    isCalculating.value = true
    error.value = null
    const startTime = performance.now()

    try {
      let result: CalculationResult

      if (enableClientSideCalculation.value && useOptimizedCalculation.value) {
        // Try client-side calculation first
        result = calculateClientSide(targetRelics, targetConditions)
      } else {
        // Use server-side calculation
        const response = await apiService.calculation.calculate(request)
        result = response.data
      }

      // Update current result
      currentResult.value = result

      // Cache the result
      setCachedResult(cacheKey, result)

      // Add to history
      addToHistory(request, result)

      // Update statistics
      const calculationTime = performance.now() - startTime
      updateCalculationStats(calculationTime)

      return result
    } catch (err: any) {
      error.value = err.message || 'Calculation failed'
      showError('Failed to calculate attack multiplier')
      console.error('Calculation error:', err)
      return null
    } finally {
      isCalculating.value = false
    }
  }

  const calculateClientSide = (
    relics: Relic[],
    conditions: ConditionalEffects
  ): CalculationResult => {
    // Client-side calculation implementation
    let baseMultiplier = 0
    let synergyMultiplier = 0
    let conditionalMultiplier = 0

    const relicDetails = relics.map(relic => {
      const relicMultiplier = relic.attackMultiplier || 0
      baseMultiplier += relicMultiplier

      return {
        relicId: relic.id,
        name: relic.name,
        contribution: relicMultiplier,
        effects: relic.effects || [],
        synergies: [], // Will be calculated
        conditionalBonuses: [],
      }
    })

    // Calculate synergies
    synergyMultiplier = calculateSynergies(relics)

    // Calculate conditional bonuses
    conditionalMultiplier = calculateConditionalBonuses(relics, conditions)

    // Calculate total multiplier
    const totalMultiplier =
      baseMultiplier + synergyMultiplier + conditionalMultiplier

    // Calculate efficiency and difficulty
    const totalDifficulty = relics.reduce(
      (sum, r) => sum + (r.obtainmentDifficulty || 0),
      0
    )
    const averageDifficulty =
      relics.length > 0 ? totalDifficulty / relics.length : 0
    const efficiency = totalMultiplier / Math.max(averageDifficulty, 1)

    // Create effect breakdown
    const effectBreakdown = createEffectBreakdown(relics, conditions)

    return {
      attackMultipliers: {
        total: Math.round(totalMultiplier * 100) / 100,
        base: Math.round(baseMultiplier * 100) / 100,
        synergy: Math.round(synergyMultiplier * 100) / 100,
        conditional: Math.round(conditionalMultiplier * 100) / 100,
      },
      efficiency: Math.round(efficiency * 100) / 100,
      obtainmentDifficulty: Math.round(averageDifficulty * 10) / 10,
      relicDetails,
      effectBreakdown,
      calculationSteps: showCalculationSteps.value
        ? generateCalculationSteps(relics, conditions)
        : [],
      metadata: {
        calculatedAt: new Date().toISOString(),
        clientSide: true,
        cacheKey: generateCacheKey({
          relicIds: relics.map(r => r.id),
          conditionalEffects: conditions,
        }),
      },
    }
  }

  const calculateSynergies = (relics: Relic[]): number => {
    let synergyBonus = 0

    // Type synergies
    const typeGroups = relics.reduce(
      (groups, relic) => {
        const type = relic.type
        groups[type] = (groups[type] || 0) + 1
        return groups
      },
      {} as Record<string, number>
    )

    Object.values(typeGroups).forEach(count => {
      if (count >= 2) {
        synergyBonus += count * 0.15 // 15% bonus per matching relic
      }
    })

    // Effect synergies
    const effectGroups = relics.reduce(
      (groups, relic) => {
        ;(relic.effects || []).forEach(effect => {
          groups[effect.type] = (groups[effect.type] || 0) + 1
        })
        return groups
      },
      {} as Record<string, number>
    )

    Object.values(effectGroups).forEach(count => {
      if (count >= 2) {
        synergyBonus += count * 0.1 // 10% bonus per matching effect
      }
    })

    return synergyBonus
  }

  const calculateConditionalBonuses = (
    relics: Relic[],
    conditions: ConditionalEffects
  ): number => {
    let conditionalBonus = 0

    relics.forEach(relic => {
      ;(relic.effects || []).forEach(effect => {
        // Enemy type bonuses
        if (effect.conditions?.enemyType === conditions.enemyType) {
          conditionalBonus += effect.multiplier * 0.2
        }

        // Health-based bonuses
        if (effect.conditions?.healthThreshold) {
          const threshold = effect.conditions.healthThreshold
          if (
            (threshold.type === 'above' &&
              conditions.playerHealth > threshold.value) ||
            (threshold.type === 'below' &&
              conditions.playerHealth < threshold.value)
          ) {
            conditionalBonus += effect.multiplier * 0.15
          }
        }

        // Combo bonuses
        if (
          effect.conditions?.minCombo &&
          conditions.comboCount >= effect.conditions.minCombo
        ) {
          conditionalBonus +=
            effect.multiplier * Math.min(conditions.comboCount * 0.05, 0.5)
        }

        // First hit bonuses
        if (effect.conditions?.firstHit && conditions.isFirstHit) {
          conditionalBonus += effect.multiplier * 0.3
        }

        // Environment bonuses
        if (
          effect.conditions?.environment &&
          conditions.environmentEffects.includes(effect.conditions.environment)
        ) {
          conditionalBonus += effect.multiplier * 0.25
        }
      })
    })

    return conditionalBonus
  }

  const createEffectBreakdown = (
    relics: Relic[],
    conditions: ConditionalEffects
  ) => {
    const breakdown: any[] = []

    relics.forEach(relic => {
      ;(relic.effects || []).forEach(effect => {
        const isActive = checkEffectActive(effect, conditions)

        breakdown.push({
          relicId: relic.id,
          relicName: relic.name,
          effectType: effect.type,
          effectDescription: effect.description,
          multiplier: effect.multiplier,
          isActive,
          contribution: isActive ? effect.multiplier : 0,
        })
      })
    })

    return breakdown
  }

  const checkEffectActive = (
    effect: any,
    conditions: ConditionalEffects
  ): boolean => {
    if (!effect.conditions) return true

    // Check all conditions
    if (
      effect.conditions.enemyType &&
      effect.conditions.enemyType !== conditions.enemyType
    ) {
      return false
    }

    if (effect.conditions.healthThreshold) {
      const threshold = effect.conditions.healthThreshold
      if (
        threshold.type === 'above' &&
        conditions.playerHealth <= threshold.value
      ) {
        return false
      }
      if (
        threshold.type === 'below' &&
        conditions.playerHealth >= threshold.value
      ) {
        return false
      }
    }

    if (
      effect.conditions.minCombo &&
      conditions.comboCount < effect.conditions.minCombo
    ) {
      return false
    }

    if (effect.conditions.firstHit && !conditions.isFirstHit) {
      return false
    }

    if (
      effect.conditions.environment &&
      !conditions.environmentEffects.includes(effect.conditions.environment)
    ) {
      return false
    }

    return true
  }

  const generateCalculationSteps = (
    relics: Relic[],
    conditions: ConditionalEffects
  ) => {
    const steps = []

    steps.push({
      step: 1,
      description: 'Base multiplier calculation',
      formula: relics.map(r => r.attackMultiplier || 0).join(' + '),
      result: relics.reduce((sum, r) => sum + (r.attackMultiplier || 0), 0),
    })

    const synergyBonus = calculateSynergies(relics)
    if (synergyBonus > 0) {
      steps.push({
        step: 2,
        description: 'Synergy bonuses',
        formula: 'Type and effect matching bonuses',
        result: synergyBonus,
      })
    }

    const conditionalBonus = calculateConditionalBonuses(relics, conditions)
    if (conditionalBonus > 0) {
      steps.push({
        step: 3,
        description: 'Conditional bonuses',
        formula: 'Active conditional effects',
        result: conditionalBonus,
      })
    }

    return steps
  }

  // Conditional effects management
  const updateConditionalEffects = (updates: Partial<ConditionalEffects>) => {
    conditionalEffects.value = { ...conditionalEffects.value, ...updates }

    if (autoCalculate.value && selectedRelics.value.length > 0) {
      calculateAttackMultiplier()
    }
  }

  const resetConditionalEffects = () => {
    conditionalEffects.value = {
      enemyType: 'normal',
      playerHealth: 100,
      comboCount: 0,
      isFirstHit: false,
      environmentEffects: [],
    }

    if (autoCalculate.value && selectedRelics.value.length > 0) {
      calculateAttackMultiplier()
    }
  }

  // Cache management
  const generateCacheKey = (request: CalculationRequest): string => {
    const relicIds = [...request.relicIds].sort().join(',')
    const conditions = JSON.stringify(request.conditionalEffects)
    return `calc_${relicIds}_${btoa(conditions)}`
  }

  const getCachedResult = (key: string): CalculationResult | null => {
    const cached = cache.value.get(key)
    if (!cached) return null

    // Check if cache entry is expired
    if (Date.now() - cached.timestamp > cacheExpiration) {
      cache.value.delete(key)
      return null
    }

    return cached.result
  }

  const setCachedResult = (key: string, result: CalculationResult) => {
    // Remove oldest entries if cache is full
    if (cache.value.size >= maxCacheSize) {
      const oldestKey = cache.value.keys().next().value
      cache.value.delete(oldestKey)
    }

    cache.value.set(key, {
      key,
      result,
      timestamp: Date.now(),
    })
  }

  const clearCache = () => {
    cache.value.clear()
    success('Calculation cache cleared')
  }

  // History management
  const addToHistory = (
    request: CalculationRequest,
    result: CalculationResult
  ) => {
    const historyEntry: CalculationHistory = {
      id: `calc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      request,
      result,
      timestamp: new Date(),
    }

    history.value.unshift(historyEntry)

    // Keep only recent entries
    if (history.value.length > maxHistorySize) {
      history.value = history.value.slice(0, maxHistorySize)
    }
  }

  const clearHistory = () => {
    history.value = []
    info('Calculation history cleared')
  }

  const getHistoryEntry = (id: string) => {
    return history.value.find(entry => entry.id === id)
  }

  const restoreFromHistory = (id: string) => {
    const entry = getHistoryEntry(id)
    if (entry) {
      currentResult.value = entry.result
      conditionalEffects.value = entry.request.conditionalEffects

      // Load relics if possible
      relicsStore.selectRelicsByIds(entry.request.relicIds)

      success('Calculation restored from history')
    }
  }

  // Statistics
  const updateCalculationStats = (calculationTime: number) => {
    const stats = calculationStats.value
    stats.totalCalculations++
    stats.lastCalculationTime = calculationTime

    // Update average (exponential moving average)
    stats.averageCalculationTime =
      stats.averageCalculationTime * 0.9 + calculationTime * 0.1
  }

  const resetStats = () => {
    calculationStats.value = {
      totalCalculations: 0,
      cacheHits: 0,
      averageCalculationTime: 0,
      lastCalculationTime: 0,
    }
  }

  // Settings
  const toggleAutoCalculate = () => {
    autoCalculate.value = !autoCalculate.value
  }

  const toggleClientSideCalculation = () => {
    enableClientSideCalculation.value = !enableClientSideCalculation.value
  }

  const toggleCalculationSteps = () => {
    showCalculationSteps.value = !showCalculationSteps.value
  }

  // Auto-calculation when relics change
  watch(
    () => selectedRelics.value,
    newRelics => {
      if (autoCalculate.value && newRelics.length > 0) {
        calculateAttackMultiplier()
      }
    },
    { deep: true }
  )

  // Initialize
  const initialize = () => {
    // Load any persisted settings
    const savedSettings = localStorage.getItem(
      'nightreign_calculation_settings'
    )
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings)
        autoCalculate.value = settings.autoCalculate ?? true
        enableClientSideCalculation.value =
          settings.enableClientSideCalculation ?? true
        showCalculationSteps.value = settings.showCalculationSteps ?? false
      } catch (err) {
        console.error('Failed to load calculation settings:', err)
      }
    }
  }

  // Persist settings
  watch(
    () => ({
      autoCalculate: autoCalculate.value,
      enableClientSideCalculation: enableClientSideCalculation.value,
      showCalculationSteps: showCalculationSteps.value,
    }),
    settings => {
      localStorage.setItem(
        'nightreign_calculation_settings',
        JSON.stringify(settings)
      )
    },
    { deep: true }
  )

  return {
    // State
    currentResult: computed(() => currentResult.value),
    isCalculating: computed(() => isCalculating.value),
    error: computed(() => error.value),
    conditionalEffects: computed(() => conditionalEffects.value),
    history: computed(() => history.value),

    // Computed
    hasResult,
    currentMultiplier,
    calculationSummary,
    isOptimal,
    cacheStats,

    // Settings
    autoCalculate: computed(() => autoCalculate.value),
    enableClientSideCalculation: computed(
      () => enableClientSideCalculation.value
    ),
    showCalculationSteps: computed(() => showCalculationSteps.value),

    // Actions
    initialize,
    calculateAttackMultiplier,
    updateConditionalEffects,
    resetConditionalEffects,

    // Cache management
    clearCache,

    // History management
    clearHistory,
    getHistoryEntry,
    restoreFromHistory,

    // Settings
    toggleAutoCalculate,
    toggleClientSideCalculation,
    toggleCalculationSteps,

    // Statistics
    calculationStats: computed(() => calculationStats.value),
    resetStats,
  }
})

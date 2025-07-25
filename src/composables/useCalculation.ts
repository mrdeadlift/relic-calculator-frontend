import { ref, computed, reactive, watch } from 'vue'
import type { Relic, RelicEffect } from '../types/relic'
import type { AttackMultiplierResult, CalculationStep, EffectCategory } from '../types/calculation'
import { useToast } from './useToast'

// Calculation state interface
interface CalculationState {
  isCalculating: boolean
  lastCalculationTime: number
  error: string | null
  cacheEnabled: boolean
  debugMode: boolean
}

// Cache for calculation results
const calculationCache = new Map<string, AttackMultiplierResult>()
const CACHE_EXPIRY = 5 * 60 * 1000 // 5 minutes

export const useCalculation = () => {
  const state = reactive<CalculationState>({
    isCalculating: false,
    lastCalculationTime: 0,
    error: null,
    cacheEnabled: true,
    debugMode: false
  })

  const { error: showError } = useToast()

  // Generate cache key for relics combination
  const generateCacheKey = (relics: Relic[]): string => {
    const sortedIds = relics.map(r => r.id).sort()
    const effectStates = relics.flatMap(r => 
      r.effects.map(e => ({
        id: e.id,
        active: e.isConditional ? e.condition?.active : true,
        value: e.condition?.value
      }))
    )
    return JSON.stringify({ ids: sortedIds, states: effectStates })
  }

  // Check if cached result is still valid
  const isCacheValid = (timestamp: number): boolean => {
    return Date.now() - timestamp < CACHE_EXPIRY
  }

  // Calculate attack multiplier for given relics
  const calculateAttackMultiplier = async (relics: Relic[]): Promise<number> => {
    if (!relics || relics.length === 0) return 1.0

    state.isCalculating = true
    state.error = null
    const startTime = performance.now()

    try {
      // Check cache first
      const cacheKey = generateCacheKey(relics)
      if (state.cacheEnabled && calculationCache.has(cacheKey)) {
        const cached = calculationCache.get(cacheKey)!
        if (isCacheValid(cached.timestamp || 0)) {
          state.isCalculating = false
          return cached.finalMultiplier
        } else {
          calculationCache.delete(cacheKey)
        }
      }

      // Perform calculation
      const result = await performCalculation(relics)
      const endTime = performance.now()

      // Cache the result
      if (state.cacheEnabled) {
        calculationCache.set(cacheKey, {
          ...result,
          timestamp: Date.now(),
          performance: {
            executionTime: Math.round(endTime - startTime),
            effectsProcessed: relics.reduce((count, r) => count + r.effects.length, 0)
          }
        })
      }

      state.lastCalculationTime = endTime - startTime
      state.isCalculating = false

      return result.finalMultiplier

    } catch (error) {
      state.error = error instanceof Error ? error.message : 'Calculation failed'
      state.isCalculating = false
      showError(`計算エラー: ${state.error}`)
      throw error
    }
  }

  // Perform the actual calculation logic
  const performCalculation = async (relics: Relic[]): Promise<AttackMultiplierResult> => {
    // Simulate async calculation for complex operations
    await new Promise(resolve => setTimeout(resolve, 50))

    let baseMultiplier = 1.0
    let additiveBonus = 0
    let multiplicativeBonus = 1.0
    
    const effectBreakdown: any[] = []
    const appliedEffects = new Set<string>()

    // Process effects in order of priority
    const allEffects = relics.flatMap(relic => 
      relic.effects.map(effect => ({
        ...effect,
        relicName: relic.name,
        priority: getEffectPriority(effect.type)
      }))
    ).sort((a, b) => b.priority - a.priority)

    for (const effect of allEffects) {
      // Skip if condition not met
      if (effect.isConditional && !isConditionMet(effect)) {
        continue
      }

      // Check for conflicts
      if (hasConflict(effect, appliedEffects)) {
        continue
      }

      // Apply effect based on type
      const effectValue = calculateEffectValue(effect)
      
      switch (effect.type) {
        case 'attack_percentage':
          additiveBonus += effectValue
          break
        case 'attack_multiplier':
          multiplicativeBonus *= effectValue
          break
        case 'critical_multiplier':
          // Apply conditional critical multiplier
          if (effect.condition?.active) {
            multiplicativeBonus *= effectValue
          }
          break
        case 'weapon_specific':
          // Apply weapon-specific bonuses
          additiveBonus += effectValue * getWeaponModifier(effect)
          break
        case 'conditional_damage':
          // Apply conditional damage bonuses
          if (isConditionalDamageActive(effect)) {
            additiveBonus += effectValue
          }
          break
      }

      effectBreakdown.push({
        id: effect.id,
        name: effect.name,
        sourceName: effect.relicName,
        type: effect.type,
        value: effectValue,
        appliedValue: effectValue,
        formula: generateEffectFormula(effect, effectValue)
      })

      appliedEffects.add(effect.id)
    }

    // Calculate final multiplier
    const finalMultiplier = baseMultiplier * (1 + additiveBonus / 100) * multiplicativeBonus

    return {
      finalMultiplier,
      baseStats: {
        attack: 1000, // Default base attack
        weaponAttack: 500 // Default weapon attack
      },
      effectBreakdown,
      calculationFormula: generateCalculationFormula(baseMultiplier, additiveBonus, multiplicativeBonus),
      context: 'Normal Attack',
      timestamp: Date.now()
    }
  }

  // Get calculation steps for detailed breakdown
  const getCalculationSteps = (relics: Relic[]): CalculationStep[] => {
    if (!relics || relics.length === 0) return []

    const steps: CalculationStep[] = []

    // Step 1: Base calculation
    steps.push({
      id: 'base',
      title: 'Base Multiplier',
      type: 'base',
      value: 1.0,
      formula: 'Base = 1.0',
      effects: []
    })

    // Step 2: Additive effects
    const additiveEffects = relics.flatMap(r => 
      r.effects.filter(e => e.type === 'attack_percentage' && (!e.isConditional || isConditionMet(e)))
        .map(e => ({ ...e, relicName: r.name }))
    )

    if (additiveEffects.length > 0) {
      const total = additiveEffects.reduce((sum, e) => sum + calculateEffectValue(e), 0)
      steps.push({
        id: 'additive',
        title: 'Additive Bonuses',
        type: 'addition',
        value: total / 100,
        formula: `(1 + ${total}%)`,
        effects: additiveEffects
      })
    }

    // Step 3: Multiplicative effects
    const multiplicativeEffects = relics.flatMap(r => 
      r.effects.filter(e => e.type === 'attack_multiplier' && (!e.isConditional || isConditionMet(e)))
        .map(e => ({ ...e, relicName: r.name }))
    )

    if (multiplicativeEffects.length > 0) {
      const total = multiplicativeEffects.reduce((product, e) => product * calculateEffectValue(e), 1)
      steps.push({
        id: 'multiplicative',
        title: 'Multiplicative Bonuses',
        type: 'multiplication',
        value: total,
        formula: `× ${total.toFixed(2)}`,
        effects: multiplicativeEffects
      })
    }

    return steps
  }

  // Get effect breakdown by category
  const getCategoryBreakdown = (relics: Relic[]): EffectCategory[] => {
    const categories: EffectCategory[] = [
      { type: 'Attack', name: 'Attack Effects', total: 1.0, effects: [], icon: 'AttackIcon' },
      { type: 'Critical', name: 'Critical Effects', total: 1.0, effects: [], icon: 'CriticalIcon' },
      { type: 'Conditional', name: 'Conditional Effects', total: 1.0, effects: [], icon: 'ConditionalIcon' },
      { type: 'Weapon', name: 'Weapon Specific', total: 1.0, effects: [], icon: 'WeaponIcon' }
    ]

    relics.forEach(relic => {
      relic.effects.forEach(effect => {
        const category = getCategoryForEffect(effect.type)
        const categoryObj = categories.find(c => c.type === category)
        
        if (categoryObj && (!effect.isConditional || isConditionMet(effect))) {
          categoryObj.effects.push({
            ...effect,
            relicName: relic.name
          })
        }
      })
    })

    // Calculate totals for each category
    categories.forEach(category => {
      if (category.effects.length > 0) {
        category.total = category.effects.reduce((total, effect) => {
          const value = calculateEffectValue(effect)
          return effect.type === 'attack_multiplier' ? total * value : total + (value / 100)
        }, category.type === 'Attack' ? 1.0 : 0)
      }
    })

    return categories.filter(c => c.effects.length > 0)
  }

  // Helper functions
  const getEffectPriority = (type: string): number => {
    const priorities = {
      'base': 100,
      'attack_multiplier': 90,
      'attack_percentage': 80,
      'critical_multiplier': 70,
      'weapon_specific': 60,
      'conditional_damage': 50
    }
    return priorities[type as keyof typeof priorities] || 0
  }

  const isConditionMet = (effect: RelicEffect): boolean => {
    if (!effect.isConditional || !effect.condition) return true

    switch (effect.condition.type) {
      case 'boolean':
        return effect.condition.active === true
      case 'numeric':
        return (effect.condition.value || 0) >= (effect.condition.min || 0)
      case 'select':
        return effect.condition.value !== null && effect.condition.value !== undefined
      default:
        return false
    }
  }

  const hasConflict = (effect: RelicEffect, appliedEffects: Set<string>): boolean => {
    // Check for unique effects that can't stack
    if (effect.stacking === 'unique') {
      const sameTypeApplied = Array.from(appliedEffects).some(id => {
        // This would require looking up the effect type by ID
        // For now, assume no conflicts
        return false
      })
      return sameTypeApplied
    }
    return false
  }

  const calculateEffectValue = (effect: RelicEffect): number => {
    let baseValue = effect.value

    // Apply conditional modifiers
    if (effect.isConditional && effect.condition) {
      switch (effect.condition.type) {
        case 'numeric':
          const ratio = (effect.condition.value || 0) / (effect.condition.max || 1)
          baseValue *= ratio
          break
        case 'select':
          const multiplier = effect.condition.options?.find(o => o.value === effect.condition?.value)?.multiplier || 1
          baseValue *= multiplier
          break
      }
    }

    return baseValue
  }

  const getWeaponModifier = (effect: RelicEffect): number => {
    // This would check current weapon type and return appropriate modifier
    return 1.0
  }

  const isConditionalDamageActive = (effect: RelicEffect): boolean => {
    return effect.condition?.active === true
  }

  const generateEffectFormula = (effect: RelicEffect, value: number): string => {
    switch (effect.type) {
      case 'attack_percentage':
        return `+${value}%`
      case 'attack_multiplier':
        return `×${value.toFixed(2)}`
      case 'critical_multiplier':
        return `Critical ×${value.toFixed(2)}`
      default:
        return `${value}`
    }
  }

  const generateCalculationFormula = (base: number, additive: number, multiplicative: number): string => {
    return `${base} × (1 + ${additive.toFixed(1)}%) × ${multiplicative.toFixed(2)} = ${(base * (1 + additive / 100) * multiplicative).toFixed(2)}`
  }

  const getCategoryForEffect = (effectType: string): string => {
    const categoryMap = {
      'attack_percentage': 'Attack',
      'attack_multiplier': 'Attack',
      'critical_multiplier': 'Critical',
      'critical_chance': 'Critical',
      'weapon_specific': 'Weapon',
      'conditional_damage': 'Conditional'
    }
    return categoryMap[effectType as keyof typeof categoryMap] || 'Attack'
  }

  // Clear calculation cache
  const clearCache = () => {
    calculationCache.clear()
  }

  // Get detailed calculation result
  const getDetailedResult = async (relics: Relic[]): Promise<AttackMultiplierResult> => {
    state.isCalculating = true
    
    try {
      const result = await performCalculation(relics)
      state.isCalculating = false
      return result
    } catch (error) {
      state.isCalculating = false
      throw error
    }
  }

  // Compare multiple relic combinations
  const compareCalculations = async (relicCombinations: Relic[][]): Promise<any[]> => {
    const results = await Promise.all(
      relicCombinations.map(async (relics, index) => ({
        id: `combo-${index}`,
        name: `Combination ${index + 1}`,
        relics,
        multiplier: await calculateAttackMultiplier(relics),
        context: 'Normal Attack'
      }))
    )

    // Calculate differences from first result
    const baseMultiplier = results[0]?.multiplier || 1
    return results.map(result => ({
      ...result,
      difference: result.multiplier - baseMultiplier
    }))
  }

  return {
    // State
    state: computed(() => state),
    isCalculating: computed(() => state.isCalculating),
    calculationError: computed(() => state.error),
    lastCalculationTime: computed(() => state.lastCalculationTime),

    // Core calculation methods
    calculateAttackMultiplier,
    getDetailedResult,
    getCalculationSteps,
    getCategoryBreakdown,
    compareCalculations,

    // Utility methods
    clearCache,
    
    // Configuration
    setCacheEnabled: (enabled: boolean) => { state.cacheEnabled = enabled },
    setDebugMode: (debug: boolean) => { state.debugMode = debug }
  }
}
import type { 
  Relic, 
  CalculationRequest, 
  CalculationResult, 
  ConditionalEffects,
  RelicEffect
} from '../types'

// Performance monitoring
interface CalculationMetrics {
  startTime: number
  endTime: number
  duration: number
  relicCount: number
  cacheHits: number
  cacheMisses: number
}

// Calculation context for advanced scenarios
interface CalculationContext {
  playerLevel?: number
  weaponType?: string
  environmentBonuses?: string[]
  timeOfDay?: 'day' | 'night'
  seasonalEffects?: string[]
  customMultipliers?: Record<string, number>
}

// Advanced calculation options
interface CalculationOptions {
  useCache?: boolean
  enableOptimizations?: boolean
  includeDebugInfo?: boolean
  precision?: number
  maxComplexity?: number
}

// Internal calculation state
interface CalculationState {
  baseMultiplier: number
  synergyMultiplier: number
  conditionalMultiplier: number
  environmentalMultiplier: number
  activeEffects: RelicEffect[]
  effectStacks: Map<string, number>
  penalties: number[]
}

export class CalculationEngine {
  private cache = new Map<string, { result: CalculationResult; timestamp: number }>()
  private metrics: CalculationMetrics[] = []
  private readonly cacheExpiration = 300000 // 5 minutes
  private readonly maxCacheSize = 1000

  // Main calculation function
  async calculate(
    relics: Relic[], 
    conditions: ConditionalEffects,
    context: CalculationContext = {},
    options: CalculationOptions = {}
  ): Promise<CalculationResult> {
    const startTime = performance.now()
    const metrics: CalculationMetrics = {
      startTime,
      endTime: 0,
      duration: 0,
      relicCount: relics.length,
      cacheHits: 0,
      cacheMisses: 0
    }

    try {
      // Check cache first
      if (options.useCache !== false) {
        const cacheKey = this.generateCacheKey(relics, conditions, context)
        const cached = this.getCachedResult(cacheKey)
        if (cached) {
          metrics.cacheHits = 1
          return cached
        }
        metrics.cacheMisses = 1
      }

      // Validate inputs
      this.validateInputs(relics, conditions)

      // Initialize calculation state
      const state = this.initializeState(relics, conditions, context)

      // Perform calculations
      const result = await this.performCalculation(state, relics, conditions, context, options)

      // Cache the result
      if (options.useCache !== false) {
        const cacheKey = this.generateCacheKey(relics, conditions, context)
        this.setCachedResult(cacheKey, result)
      }

      return result

    } finally {
      metrics.endTime = performance.now()
      metrics.duration = metrics.endTime - metrics.startTime
      this.metrics.push(metrics)

      // Keep metrics history limited
      if (this.metrics.length > 1000) {
        this.metrics = this.metrics.slice(-500)
      }
    }
  }

  // Core calculation logic
  private async performCalculation(
    state: CalculationState,
    relics: Relic[],
    conditions: ConditionalEffects,
    context: CalculationContext,
    options: CalculationOptions
  ): Promise<CalculationResult> {
    // Phase 1: Base multiplier calculation
    this.calculateBaseMultiplier(state, relics)

    // Phase 2: Synergy calculations
    this.calculateSynergies(state, relics)

    // Phase 3: Conditional effect calculations
    this.calculateConditionalEffects(state, relics, conditions)

    // Phase 4: Environmental bonuses
    this.calculateEnvironmentalBonuses(state, context)

    // Phase 5: Complex interactions and diminishing returns
    this.applyComplexInteractions(state, relics, conditions)

    // Phase 6: Final calculations and result assembly
    const result = this.assembleResult(state, relics, conditions, context, options)

    return result
  }

  // Phase 1: Base multiplier calculation
  private calculateBaseMultiplier(state: CalculationState, relics: Relic[]): void {
    state.baseMultiplier = relics.reduce((total, relic) => {
      const multiplier = relic.attackMultiplier || 0
      
      // Apply relic-specific bonuses
      const relicBonus = this.getRelicSpecificBonus(relic)
      
      return total + multiplier + relicBonus
    }, 0)
  }

  // Phase 2: Synergy calculations
  private calculateSynergies(state: CalculationState, relics: Relic[]): void {
    // Type-based synergies
    const typeSynergies = this.calculateTypeSynergies(relics)
    
    // Effect-based synergies
    const effectSynergies = this.calculateEffectSynergies(relics)
    
    // Set-based synergies (for related relics)
    const setSynergies = this.calculateSetSynergies(relics)
    
    // Advanced synergy patterns
    const patternSynergies = this.calculatePatternSynergies(relics)

    state.synergyMultiplier = typeSynergies + effectSynergies + setSynergies + patternSynergies
  }

  // Phase 3: Conditional effect calculations
  private calculateConditionalEffects(
    state: CalculationState, 
    relics: Relic[], 
    conditions: ConditionalEffects
  ): void {
    let conditionalBonus = 0

    relics.forEach(relic => {
      (relic.effects || []).forEach(effect => {
        if (this.isEffectActive(effect, conditions)) {
          const effectValue = this.calculateEffectValue(effect, conditions, state)
          conditionalBonus += effectValue
          
          // Track active effects
          state.activeEffects.push(effect)
          
          // Handle effect stacking
          this.updateEffectStacks(state, effect)
        }
      })
    })

    state.conditionalMultiplier = conditionalBonus
  }

  // Phase 4: Environmental bonuses
  private calculateEnvironmentalBonuses(state: CalculationState, context: CalculationContext): void {
    let environmentalBonus = 0

    // Weather/time bonuses
    if (context.timeOfDay === 'night') {
      environmentalBonus += this.getNightTimeBonus(state)
    }

    // Seasonal effects
    if (context.seasonalEffects) {
      environmentalBonus += this.getSeasonalBonuses(context.seasonalEffects, state)
    }

    // Environmental hazards/bonuses
    if (context.environmentBonuses) {
      environmentalBonus += this.getEnvironmentBonuses(context.environmentBonuses, state)
    }

    state.environmentalMultiplier = environmentalBonus
  }

  // Phase 5: Complex interactions and diminishing returns
  private applyComplexInteractions(
    state: CalculationState, 
    relics: Relic[], 
    conditions: ConditionalEffects
  ): void {
    // Apply diminishing returns for high multiplier stacking
    this.applyDiminishingReturns(state)

    // Handle negative interactions between certain relics
    this.applyNegativeInteractions(state, relics)

    // Apply caps and limits
    this.applyLimits(state)

    // Handle special relic combinations
    this.handleSpecialCombinations(state, relics)
  }

  // Phase 6: Result assembly
  private assembleResult(
    state: CalculationState,
    relics: Relic[],
    conditions: ConditionalEffects,
    context: CalculationContext,
    options: CalculationOptions
  ): CalculationResult {
    const totalMultiplier = Math.max(0, 
      state.baseMultiplier + 
      state.synergyMultiplier + 
      state.conditionalMultiplier + 
      state.environmentalMultiplier -
      state.penalties.reduce((sum, penalty) => sum + penalty, 0)
    )

    const precision = options.precision || 2
    const roundedMultiplier = Math.round(totalMultiplier * Math.pow(10, precision)) / Math.pow(10, precision)

    // Calculate additional metrics
    const efficiency = this.calculateEfficiency(relics, roundedMultiplier)
    const obtainmentDifficulty = this.calculateObtainmentDifficulty(relics)

    // Generate detailed breakdown
    const relicDetails = this.generateRelicDetails(relics, state)
    const effectBreakdown = this.generateEffectBreakdown(state)
    const calculationSteps = options.includeDebugInfo ? this.generateCalculationSteps(state) : []

    return {
      attackMultipliers: {
        total: roundedMultiplier,
        base: Math.round(state.baseMultiplier * Math.pow(10, precision)) / Math.pow(10, precision),
        synergy: Math.round(state.synergyMultiplier * Math.pow(10, precision)) / Math.pow(10, precision),
        conditional: Math.round(state.conditionalMultiplier * Math.pow(10, precision)) / Math.pow(10, precision),
        environmental: Math.round(state.environmentalMultiplier * Math.pow(10, precision)) / Math.pow(10, precision)
      },
      efficiency,
      obtainmentDifficulty,
      relicDetails,
      effectBreakdown,
      calculationSteps,
      metadata: {
        calculatedAt: new Date().toISOString(),
        clientSide: true,
        cacheKey: this.generateCacheKey(relics, conditions, context),
        performance: {
          duration: performance.now() - (this.metrics[this.metrics.length - 1]?.startTime || 0),
          relicCount: relics.length,
          activeEffects: state.activeEffects.length
        }
      }
    }
  }

  // Synergy calculation methods
  private calculateTypeSynergies(relics: Relic[]): number {
    const typeGroups = relics.reduce((groups, relic) => {
      const type = relic.type
      groups[type] = (groups[type] || 0) + 1
      return groups
    }, {} as Record<string, number>)

    let synergyBonus = 0
    Object.entries(typeGroups).forEach(([type, count]) => {
      if (count >= 2) {
        // Escalating bonus: 2 = 0.15, 3 = 0.35, 4 = 0.60, etc.
        synergyBonus += 0.15 * count * (count - 1) / 2
      }
    })

    return synergyBonus
  }

  private calculateEffectSynergies(relics: Relic[]): number {
    const effectGroups = relics.reduce((groups, relic) => {
      (relic.effects || []).forEach(effect => {
        groups[effect.type] = (groups[effect.type] || 0) + 1
      })
      return groups
    }, {} as Record<string, number>)

    let synergyBonus = 0
    Object.entries(effectGroups).forEach(([effectType, count]) => {
      if (count >= 2) {
        // Different scaling for different effect types
        const scaling = this.getEffectSynergyScaling(effectType)
        synergyBonus += scaling * count * (count - 1) / 2
      }
    })

    return synergyBonus
  }

  private calculateSetSynergies(relics: Relic[]): number {
    // Predefined relic sets (could be loaded from configuration)
    const relicSets = this.getRelicSets()
    let setBonus = 0

    relicSets.forEach(set => {
      const setRelics = relics.filter(relic => set.relicIds.includes(relic.id))
      if (setRelics.length >= set.minPieces) {
        const completionRatio = Math.min(setRelics.length / set.maxPieces, 1)
        setBonus += set.bonus * completionRatio
      }
    })

    return setBonus
  }

  private calculatePatternSynergies(relics: Relic[]): number {
    // Advanced pattern recognition for relic combinations
    const patterns = this.getAdvancedPatterns()
    let patternBonus = 0

    patterns.forEach(pattern => {
      if (pattern.matches(relics)) {
        patternBonus += pattern.calculateBonus(relics)
      }
    })

    return patternBonus
  }

  // Effect calculation methods
  private isEffectActive(effect: RelicEffect, conditions: ConditionalEffects): boolean {
    if (!effect.conditions) return true

    const cond = effect.conditions

    // Enemy type check
    if (cond.enemyType && cond.enemyType !== conditions.enemyType) {
      return false
    }

    // Health threshold check
    if (cond.healthThreshold) {
      const threshold = cond.healthThreshold
      if (threshold.type === 'above' && conditions.playerHealth <= threshold.value) {
        return false
      }
      if (threshold.type === 'below' && conditions.playerHealth >= threshold.value) {
        return false
      }
    }

    // Combo count check
    if (cond.minCombo && conditions.comboCount < cond.minCombo) {
      return false
    }

    // First hit check
    if (cond.firstHit && !conditions.isFirstHit) {
      return false
    }

    // Environment check
    if (cond.environment && !conditions.environmentEffects.includes(cond.environment)) {
      return false
    }

    return true
  }

  private calculateEffectValue(
    effect: RelicEffect, 
    conditions: ConditionalEffects, 
    state: CalculationState
  ): number {
    let value = effect.multiplier

    // Apply scaling based on conditions
    if (effect.conditions) {
      value *= this.getConditionScaling(effect.conditions, conditions)
    }

    // Apply stacking modifiers
    const stackCount = state.effectStacks.get(effect.type) || 0
    if (stackCount > 0) {
      value *= this.getStackingMultiplier(effect.type, stackCount)
    }

    return value
  }

  // Utility methods
  private initializeState(
    relics: Relic[], 
    conditions: ConditionalEffects, 
    context: CalculationContext
  ): CalculationState {
    return {
      baseMultiplier: 0,
      synergyMultiplier: 0,
      conditionalMultiplier: 0,
      environmentalMultiplier: 0,
      activeEffects: [],
      effectStacks: new Map(),
      penalties: []
    }
  }

  private validateInputs(relics: Relic[], conditions: ConditionalEffects): void {
    if (!Array.isArray(relics)) {
      throw new Error('Relics must be an array')
    }

    if (relics.length > 9) {
      throw new Error('Maximum 9 relics allowed')
    }

    if (!conditions || typeof conditions !== 'object') {
      throw new Error('Conditions must be an object')
    }

    // Validate each relic
    relics.forEach((relic, index) => {
      if (!relic.id || typeof relic.id !== 'string') {
        throw new Error(`Relic at index ${index} must have a valid id`)
      }
    })
  }

  private generateCacheKey(
    relics: Relic[], 
    conditions: ConditionalEffects, 
    context: CalculationContext
  ): string {
    const relicIds = relics.map(r => r.id).sort().join(',')
    const conditionsHash = this.hashObject(conditions)
    const contextHash = this.hashObject(context)
    
    return `calc_${relicIds}_${conditionsHash}_${contextHash}`
  }

  private hashObject(obj: any): string {
    const str = JSON.stringify(obj, Object.keys(obj).sort())
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return hash.toString(36)
  }

  private getCachedResult(key: string): CalculationResult | null {
    const cached = this.cache.get(key)
    if (!cached) return null

    if (Date.now() - cached.timestamp > this.cacheExpiration) {
      this.cache.delete(key)
      return null
    }

    return cached.result
  }

  private setCachedResult(key: string, result: CalculationResult): void {
    // Clean up old entries if cache is full
    if (this.cache.size >= this.maxCacheSize) {
      const oldestKey = this.cache.keys().next().value
      this.cache.delete(oldestKey)
    }

    this.cache.set(key, {
      result,
      timestamp: Date.now()
    })
  }

  // Configuration and data methods (would be loaded from external sources)
  private getRelicSpecificBonus(relic: Relic): number {
    // Placeholder for relic-specific bonus calculations
    return 0
  }

  private getEffectSynergyScaling(effectType: string): number {
    const scalingMap: Record<string, number> = {
      'damage': 0.1,
      'critical': 0.12,
      'speed': 0.08,
      'defense': 0.06,
      'special': 0.15
    }
    return scalingMap[effectType] || 0.1
  }

  private getRelicSets(): Array<{
    id: string
    name: string
    relicIds: string[]
    minPieces: number
    maxPieces: number
    bonus: number
  }> {
    // Placeholder - would be loaded from configuration
    return []
  }

  private getAdvancedPatterns(): Array<{
    id: string
    matches: (relics: Relic[]) => boolean
    calculateBonus: (relics: Relic[]) => number
  }> {
    // Placeholder - would be loaded from configuration
    return []
  }

  private getNightTimeBonus(state: CalculationState): number {
    return 0.05 // 5% bonus at night
  }

  private getSeasonalBonuses(effects: string[], state: CalculationState): number {
    return effects.length * 0.02 // 2% per seasonal effect
  }

  private getEnvironmentBonuses(bonuses: string[], state: CalculationState): number {
    return bonuses.length * 0.03 // 3% per environment bonus
  }

  private applyDiminishingReturns(state: CalculationState): void {
    const totalBeforeDR = state.baseMultiplier + state.synergyMultiplier + state.conditionalMultiplier
    
    if (totalBeforeDR > 5.0) {
      // Apply diminishing returns for very high multipliers
      const excess = totalBeforeDR - 5.0
      const penalty = excess * 0.2 // 20% penalty on excess
      state.penalties.push(penalty)
    }
  }

  private applyNegativeInteractions(state: CalculationState, relics: Relic[]): void {
    // Placeholder for negative interaction calculations
  }

  private applyLimits(state: CalculationState): void {
    // Apply hard caps to prevent broken values
    const maxMultiplier = 10.0
    const total = state.baseMultiplier + state.synergyMultiplier + state.conditionalMultiplier + state.environmentalMultiplier
    
    if (total > maxMultiplier) {
      const penalty = total - maxMultiplier
      state.penalties.push(penalty)
    }
  }

  private handleSpecialCombinations(state: CalculationState, relics: Relic[]): void {
    // Placeholder for special combination handling
  }

  private calculateEfficiency(relics: Relic[], multiplier: number): number {
    const totalDifficulty = relics.reduce((sum, r) => sum + (r.obtainmentDifficulty || 1), 0)
    const averageDifficulty = totalDifficulty / Math.max(relics.length, 1)
    return Math.round((multiplier / Math.max(averageDifficulty, 1)) * 100) / 100
  }

  private calculateObtainmentDifficulty(relics: Relic[]): number {
    const totalDifficulty = relics.reduce((sum, r) => sum + (r.obtainmentDifficulty || 1), 0)
    return Math.round((totalDifficulty / Math.max(relics.length, 1)) * 10) / 10
  }

  private generateRelicDetails(relics: Relic[], state: CalculationState): any[] {
    return relics.map(relic => ({
      relicId: relic.id,
      name: relic.name,
      contribution: relic.attackMultiplier || 0,
      effects: relic.effects || [],
      synergies: [], // Would be populated with synergy information
      conditionalBonuses: [] // Would be populated with active conditional bonuses
    }))
  }

  private generateEffectBreakdown(state: CalculationState): any[] {
    return state.activeEffects.map(effect => ({
      effectType: effect.type,
      effectDescription: effect.description,
      multiplier: effect.multiplier,
      isActive: true,
      contribution: effect.multiplier
    }))
  }

  private generateCalculationSteps(state: CalculationState): any[] {
    return [
      {
        step: 1,
        description: 'Base multiplier calculation',
        value: state.baseMultiplier
      },
      {
        step: 2,
        description: 'Synergy bonuses',
        value: state.synergyMultiplier
      },
      {
        step: 3,
        description: 'Conditional effects',
        value: state.conditionalMultiplier
      },
      {
        step: 4,
        description: 'Environmental bonuses',
        value: state.environmentalMultiplier
      }
    ]
  }

  private getConditionScaling(conditions: any, actualConditions: ConditionalEffects): number {
    // Placeholder for condition-based scaling
    return 1.0
  }

  private updateEffectStacks(state: CalculationState, effect: RelicEffect): void {
    const current = state.effectStacks.get(effect.type) || 0
    state.effectStacks.set(effect.type, current + 1)
  }

  private getStackingMultiplier(effectType: string, stackCount: number): number {
    // Diminishing returns for stacking effects
    return 1 + (stackCount - 1) * 0.5
  }

  // Public utility methods
  clearCache(): void {
    this.cache.clear()
  }

  getCacheStats(): {
    size: number
    hitRate: number
    averageCalculationTime: number
  } {
    const totalCalculations = this.metrics.length
    const totalHits = this.metrics.reduce((sum, m) => sum + m.cacheHits, 0)
    const averageTime = totalCalculations > 0 
      ? this.metrics.reduce((sum, m) => sum + m.duration, 0) / totalCalculations
      : 0

    return {
      size: this.cache.size,
      hitRate: totalCalculations > 0 ? (totalHits / totalCalculations) * 100 : 0,
      averageCalculationTime: averageTime
    }
  }

  getPerformanceMetrics(): CalculationMetrics[] {
    return [...this.metrics]
  }
}

// Export singleton instance
export const calculationEngine = new CalculationEngine()

// Export factory function
export const createCalculationEngine = (): CalculationEngine => {
  return new CalculationEngine()
}
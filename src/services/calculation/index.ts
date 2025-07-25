// Unified calculation service exports
export { calculationEngine, createCalculationEngine } from '../calculation-engine'
export { calculationMemoizer, searchMemoizer, apiMemoizer, MemoizationManager } from '../memoization-manager'
export { calculationValidator, createCalculationValidator } from '../calculation-validator'
export { offlineCalculator, createOfflineCalculator } from '../offline-calculator'

// Export types
export type { ValidationResult, ValidationConfig } from '../calculation-validator'
export type { MemoizationStrategy, MemoizationOptions } from '../memoization-manager'
export type { OfflineCalculationOptions } from '../offline-calculator'

// Unified calculation service
import type { Relic, CalculationResult, ConditionalEffects } from '../../types'
import { calculationEngine } from '../calculation-engine'
import { calculationValidator } from '../calculation-validator'
import { offlineCalculator } from '../offline-calculator'
import { calculationMemoizer } from '../memoization-manager'

export interface UnifiedCalculationOptions {
  // Calculation preferences
  preferOffline?: boolean
  validateResults?: boolean
  forceValidation?: boolean
  
  // Performance options
  useCache?: boolean
  enableOptimizations?: boolean
  precision?: number
  
  // Fallback options
  enableOfflineFallback?: boolean
  enableBasicFallback?: boolean
  
  // Debug options
  includeDebugInfo?: boolean
  trackPerformance?: boolean
}

export interface CalculationServiceResult {
  result: CalculationResult
  metadata: {
    source: 'online' | 'offline' | 'fallback'
    validated: boolean
    cached: boolean
    duration: number
    networkStatus: 'online' | 'offline'
    validation?: any
  }
}

export class UnifiedCalculationService {
  private performanceMetrics: Array<{
    timestamp: number
    duration: number
    source: string
    relicCount: number
    success: boolean
  }> = []

  async calculate(
    relics: Relic[],
    conditions: ConditionalEffects,
    options: UnifiedCalculationOptions = {}
  ): Promise<CalculationServiceResult> {
    const startTime = performance.now()
    const networkStatus = navigator.onLine ? 'online' : 'offline'
    
    let result: CalculationResult
    let source: 'online' | 'offline' | 'fallback' = 'online'
    let validated = false
    let cached = false
    let validation: any

    try {
      // Determine calculation strategy
      if (options.preferOffline || !navigator.onLine) {
        // Try offline calculation first
        if (offlineCalculator.isOfflineCapable()) {
          result = await offlineCalculator.calculateOffline(relics, conditions)
          source = 'offline'
        } else if (options.enableOfflineFallback && navigator.onLine) {
          // Fallback to online if offline not available
          result = await this.performOnlineCalculation(relics, conditions, options)
          source = 'online'
        } else {
          throw new Error('Offline calculation not available and fallback disabled')
        }
      } else {
        // Online calculation
        result = await this.performOnlineCalculation(relics, conditions, options)
        source = 'online'
      }

      // Validation if requested
      if (options.validateResults || options.forceValidation) {
        try {
          const validationResult = await calculationValidator.calculateWithValidation(
            relics,
            conditions,
            options.forceValidation
          )
          
          result = validationResult.result
          validated = validationResult.validated
          validation = validationResult.validation
        } catch (validationError) {
          console.warn('Validation failed:', validationError)
          // Continue with unvalidated result
        }
      }

      // Check if result was cached
      cached = result.metadata?.cached || false

    } catch (error) {
      console.error('Primary calculation failed:', error)
      
      // Try fallback strategies
      if (options.enableOfflineFallback && offlineCalculator.isOfflineCapable()) {
        console.log('Attempting offline fallback')
        try {
          result = await offlineCalculator.calculateOffline(relics, conditions)
          source = 'offline'
        } catch (offlineError) {
          console.error('Offline fallback failed:', offlineError)
          if (options.enableBasicFallback) {
            result = this.performBasicFallback(relics, conditions)
            source = 'fallback'
          } else {
            throw error
          }
        }
      } else if (options.enableBasicFallback) {
        console.log('Attempting basic fallback')
        result = this.performBasicFallback(relics, conditions)
        source = 'fallback'
      } else {
        throw error
      }
    }

    const duration = performance.now() - startTime

    // Track performance metrics
    if (options.trackPerformance) {
      this.performanceMetrics.push({
        timestamp: Date.now(),
        duration,
        source,
        relicCount: relics.length,
        success: true
      })

      // Keep metrics history limited
      if (this.performanceMetrics.length > 1000) {
        this.performanceMetrics = this.performanceMetrics.slice(-500)
      }
    }

    return {
      result,
      metadata: {
        source,
        validated,
        cached,
        duration,
        networkStatus,
        validation
      }
    }
  }

  private async performOnlineCalculation(
    relics: Relic[],
    conditions: ConditionalEffects,
    options: UnifiedCalculationOptions
  ): Promise<CalculationResult> {
    // Check cache first if enabled
    if (options.useCache !== false) {
      const cacheKey = this.generateCacheKey(relics, conditions, options)
      const cached = calculationMemoizer.get(cacheKey)
      if (cached) {
        return {
          ...cached,
          metadata: { ...cached.metadata, cached: true }
        }
      }
    }

    // Perform calculation
    const result = await calculationEngine.calculate(relics, conditions, {}, {
      useCache: options.useCache,
      enableOptimizations: options.enableOptimizations,
      includeDebugInfo: options.includeDebugInfo,
      precision: options.precision
    })

    // Cache the result
    if (options.useCache !== false) {
      const cacheKey = this.generateCacheKey(relics, conditions, options)
      calculationMemoizer.set(cacheKey, result, { ttl: 600000 }) // 10 minutes
    }

    return result
  }

  private performBasicFallback(
    relics: Relic[],
    conditions: ConditionalEffects
  ): CalculationResult {
    const baseMultiplier = relics.reduce((sum, relic) => 
      sum + (relic.attackMultiplier || 0.1), 0
    )

    return {
      attackMultipliers: {
        total: Math.round(baseMultiplier * 100) / 100,
        base: Math.round(baseMultiplier * 100) / 100,
        synergy: 0,
        conditional: 0
      },
      efficiency: Math.max(0.1, baseMultiplier / 2),
      obtainmentDifficulty: Math.min(5, relics.length * 0.5),
      relicDetails: relics.map(relic => ({
        relicId: relic.id,
        name: relic.name,
        contribution: relic.attackMultiplier || 0.1,
        effects: [],
        synergies: [],
        conditionalBonuses: []
      })),
      effectBreakdown: [],
      calculationSteps: [{
        step: 1,
        description: 'Basic fallback calculation',
        value: baseMultiplier
      }],
      metadata: {
        calculatedAt: new Date().toISOString(),
        clientSide: true,
        fallback: true,
        source: 'basic_fallback'
      }
    }
  }

  private generateCacheKey(
    relics: Relic[],
    conditions: ConditionalEffects,
    options: UnifiedCalculationOptions
  ): string {
    const relicIds = relics.map(r => r.id).sort().join(',')
    const conditionsHash = this.hashObject(conditions)
    const optionsHash = this.hashObject({
      enableOptimizations: options.enableOptimizations,
      precision: options.precision,
      includeDebugInfo: options.includeDebugInfo
    })
    
    return `unified_${relicIds}_${conditionsHash}_${optionsHash}`
  }

  private hashObject(obj: any): string {
    const str = JSON.stringify(obj, Object.keys(obj || {}).sort())
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return hash.toString(36)
  }

  // Batch calculation support
  async batchCalculate(
    calculations: Array<{
      relics: Relic[]
      conditions: ConditionalEffects
      options?: UnifiedCalculationOptions
    }>,
    batchOptions: {
      concurrency?: number
      onProgress?: (completed: number, total: number) => void
    } = {}
  ): Promise<CalculationServiceResult[]> {
    const { concurrency = 3, onProgress } = batchOptions
    const results: CalculationServiceResult[] = []
    let completed = 0

    // Process in batches
    for (let i = 0; i < calculations.length; i += concurrency) {
      const batch = calculations.slice(i, i + concurrency)
      
      const batchPromises = batch.map(async (calc) => {
        const result = await this.calculate(calc.relics, calc.conditions, calc.options)
        completed++
        if (onProgress) onProgress(completed, calculations.length)
        return result
      })

      const batchResults = await Promise.allSettled(batchPromises)
      
      batchResults.forEach((result) => {
        if (result.status === 'fulfilled') {
          results.push(result.value)
        } else {
          // Add error result
          results.push({
            result: this.performBasicFallback([], {}),
            metadata: {
              source: 'fallback',
              validated: false,
              cached: false,
              duration: 0,
              networkStatus: navigator.onLine ? 'online' : 'offline',
              error: result.reason
            }
          })
        }
      })
    }

    return results
  }

  // Service status and diagnostics
  getServiceStatus(): {
    online: boolean
    offlineCapable: boolean
    cacheStats: any
    validationStats: any
    performanceStats: {
      averageDuration: number
      totalCalculations: number
      successRate: number
      sourceDistribution: Record<string, number>
    }
  } {
    const perfStats = this.calculatePerformanceStats()
    
    return {
      online: navigator.onLine,
      offlineCapable: offlineCalculator.isOfflineCapable(),
      cacheStats: calculationMemoizer.getStats(),
      validationStats: calculationValidator.getStats(),
      performanceStats: perfStats
    }
  }

  private calculatePerformanceStats() {
    const metrics = this.performanceMetrics
    const totalCalculations = metrics.length
    
    if (totalCalculations === 0) {
      return {
        averageDuration: 0,
        totalCalculations: 0,
        successRate: 100,
        sourceDistribution: {}
      }
    }

    const averageDuration = metrics.reduce((sum, m) => sum + m.duration, 0) / totalCalculations
    const successCount = metrics.filter(m => m.success).length
    const successRate = (successCount / totalCalculations) * 100

    const sourceDistribution = metrics.reduce((dist, m) => {
      dist[m.source] = (dist[m.source] || 0) + 1
      return dist
    }, {} as Record<string, number>)

    return {
      averageDuration: Math.round(averageDuration * 100) / 100,
      totalCalculations,
      successRate: Math.round(successRate * 100) / 100,
      sourceDistribution
    }
  }

  // Cleanup and maintenance
  clearAllCaches(): void {
    calculationMemoizer.clear()
    calculationEngine.clearCache()
    offlineCalculator.clearOfflineData()
  }

  async syncOfflineData(): Promise<boolean> {
    return offlineCalculator.forceSync()
  }

  resetPerformanceMetrics(): void {
    this.performanceMetrics = []
  }
}

// Export singleton instance
export const unifiedCalculationService = new UnifiedCalculationService()

// Export convenience functions
export const calculate = unifiedCalculationService.calculate.bind(unifiedCalculationService)
export const batchCalculate = unifiedCalculationService.batchCalculate.bind(unifiedCalculationService)
export const getServiceStatus = unifiedCalculationService.getServiceStatus.bind(unifiedCalculationService)
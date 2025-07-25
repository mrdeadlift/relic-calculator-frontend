import type { CalculationResult, CalculationRequest, Relic, ConditionalEffects } from '../types'
import { calculationEngine } from './calculation-engine'
import { typeSafeApiClient } from './api-client'
import { calculationMemoizer } from './memoization-manager'

// Validation result types
interface ValidationResult {
  isValid: boolean
  discrepancies: Discrepancy[]
  confidence: number
  recommendedAction: 'use_client' | 'use_server' | 'manual_review'
  metadata: {
    clientResult: CalculationResult
    serverResult: CalculationResult
    validatedAt: string
    validationDuration: number
  }
}

interface Discrepancy {
  field: string
  clientValue: number
  serverValue: number
  difference: number
  percentageDifference: number
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
}

// Validation configuration
interface ValidationConfig {
  tolerances: {
    attackMultiplier: number
    efficiency: number
    obtainmentDifficulty: number
  }
  enableAutoFallback: boolean
  fallbackStrategy: 'prefer_server' | 'prefer_client' | 'conservative'
  validationFrequency: number // How often to validate (0-1, where 1 = always)
  maxValidationTime: number // Max time to wait for server validation
}

// Validation statistics
interface ValidationStats {
  totalValidations: number
  passedValidations: number
  failedValidations: number
  averageDiscrepancy: number
  clientAccuracy: number
  serverReliability: number
  averageValidationTime: number
}

export class CalculationValidator {
  private config: ValidationConfig
  private stats: ValidationStats = {
    totalValidations: 0,
    passedValidations: 0,
    failedValidations: 0,
    averageDiscrepancy: 0,
    clientAccuracy: 0,
    serverReliability: 0,
    averageValidationTime: 0
  }

  private validationHistory: ValidationResult[] = []
  private readonly maxHistorySize = 100

  constructor(config: Partial<ValidationConfig> = {}) {
    this.config = {
      tolerances: {
        attackMultiplier: 0.01, // 1% tolerance
        efficiency: 0.05, // 5% tolerance
        obtainmentDifficulty: 0.02 // 2% tolerance
      },
      enableAutoFallback: true,
      fallbackStrategy: 'prefer_server',
      validationFrequency: 0.1, // Validate 10% of calculations
      maxValidationTime: 5000, // 5 seconds
      ...config
    }
  }

  // Main validation method
  async validateCalculation(
    relics: Relic[],
    conditions: ConditionalEffects,
    clientResult?: CalculationResult
  ): Promise<ValidationResult> {
    const startTime = performance.now()

    try {
      // Get client result if not provided
      const clientCalculation = clientResult || await calculationEngine.calculate(
        relics,
        conditions,
        {},
        { useCache: true, enableOptimizations: true }
      )

      // Get server result with timeout
      const serverCalculation = await this.getServerResult(relics, conditions)

      // Compare results
      const validation = this.compareResults(clientCalculation, serverCalculation)

      // Update statistics
      this.updateStats(validation, performance.now() - startTime)

      // Store in history
      this.addToHistory(validation)

      return validation

    } catch (error) {
      console.error('Validation failed:', error)
      
      // Return a default validation result for errors
      return {
        isValid: false,
        discrepancies: [{
          field: 'validation_error',
          clientValue: 0,
          serverValue: 0,
          difference: 0,
          percentageDifference: 0,
          severity: 'critical',
          description: `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        }],
        confidence: 0,
        recommendedAction: 'manual_review',
        metadata: {
          clientResult: clientResult || {} as CalculationResult,
          serverResult: {} as CalculationResult,
          validatedAt: new Date().toISOString(),
          validationDuration: performance.now() - startTime
        }
      }
    }
  }

  // Smart calculation with validation
  async calculateWithValidation(
    relics: Relic[],
    conditions: ConditionalEffects,
    forceValidation = false
  ): Promise<{ result: CalculationResult; validated: boolean; validation?: ValidationResult }> {
    // Check if validation is needed
    const shouldValidate = forceValidation || Math.random() < this.config.validationFrequency

    // Get client result
    const clientResult = await calculationEngine.calculate(
      relics,
      conditions,
      {},
      { useCache: true, enableOptimizations: true }
    )

    if (!shouldValidate) {
      return {
        result: clientResult,
        validated: false
      }
    }

    // Perform validation
    const validation = await this.validateCalculation(relics, conditions, clientResult)

    // Determine which result to return
    const finalResult = this.selectBestResult(validation)

    return {
      result: finalResult,
      validated: true,
      validation
    }
  }

  // Batch validation for multiple calculations
  async batchValidate(
    calculations: Array<{
      relics: Relic[]
      conditions: ConditionalEffects
      clientResult?: CalculationResult
    }>,
    options: {
      concurrency?: number
      onProgress?: (completed: number, total: number) => void
    } = {}
  ): Promise<ValidationResult[]> {
    const { concurrency = 3, onProgress } = options
    const results: ValidationResult[] = []
    
    let completed = 0

    // Process in batches to avoid overwhelming the server
    for (let i = 0; i < calculations.length; i += concurrency) {
      const batch = calculations.slice(i, i + concurrency)
      
      const batchPromises = batch.map(async (calc) => {
        const result = await this.validateCalculation(
          calc.relics,
          calc.conditions,
          calc.clientResult
        )
        completed++
        if (onProgress) onProgress(completed, calculations.length)
        return result
      })

      const batchResults = await Promise.all(batchPromises)
      results.push(...batchResults)
    }

    return results
  }

  // Get server calculation result with timeout
  private async getServerResult(
    relics: Relic[],
    conditions: ConditionalEffects
  ): Promise<CalculationResult> {
    const request: CalculationRequest = {
      relicIds: relics.map(r => r.id),
      conditionalEffects: conditions
    }

    // Create timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Server validation timeout')), this.config.maxValidationTime)
    })

    // Race between API call and timeout
    const apiPromise = typeSafeApiClient.calculation.calculate(request)
      .then(response => response.data)

    return Promise.race([apiPromise, timeoutPromise])
  }

  // Compare client and server results
  private compareResults(
    clientResult: CalculationResult,
    serverResult: CalculationResult
  ): ValidationResult {
    const discrepancies: Discrepancy[] = []

    // Compare attack multipliers
    const clientTotal = clientResult.attackMultipliers.total
    const serverTotal = serverResult.attackMultipliers.total
    const multiplierDiff = Math.abs(clientTotal - serverTotal)
    const multiplierPercentDiff = serverTotal !== 0 ? (multiplierDiff / Math.abs(serverTotal)) * 100 : 0

    if (multiplierPercentDiff > this.config.tolerances.attackMultiplier * 100) {
      discrepancies.push({
        field: 'attackMultipliers.total',
        clientValue: clientTotal,
        serverValue: serverTotal,
        difference: multiplierDiff,
        percentageDifference: multiplierPercentDiff,
        severity: this.getSeverity(multiplierPercentDiff),
        description: `Attack multiplier differs by ${multiplierPercentDiff.toFixed(2)}%`
      })
    }

    // Compare efficiency
    const efficiencyDiff = Math.abs(clientResult.efficiency - serverResult.efficiency)
    const efficiencyPercentDiff = serverResult.efficiency !== 0 ? 
      (efficiencyDiff / Math.abs(serverResult.efficiency)) * 100 : 0

    if (efficiencyPercentDiff > this.config.tolerances.efficiency * 100) {
      discrepancies.push({
        field: 'efficiency',
        clientValue: clientResult.efficiency,
        serverValue: serverResult.efficiency,
        difference: efficiencyDiff,
        percentageDifference: efficiencyPercentDiff,
        severity: this.getSeverity(efficiencyPercentDiff),
        description: `Efficiency differs by ${efficiencyPercentDiff.toFixed(2)}%`
      })
    }

    // Compare obtainment difficulty
    const difficultyDiff = Math.abs(clientResult.obtainmentDifficulty - serverResult.obtainmentDifficulty)
    const difficultyPercentDiff = serverResult.obtainmentDifficulty !== 0 ? 
      (difficultyDiff / Math.abs(serverResult.obtainmentDifficulty)) * 100 : 0

    if (difficultyPercentDiff > this.config.tolerances.obtainmentDifficulty * 100) {
      discrepancies.push({
        field: 'obtainmentDifficulty',
        clientValue: clientResult.obtainmentDifficulty,
        serverValue: serverResult.obtainmentDifficulty,
        difference: difficultyDiff,
        percentageDifference: difficultyPercentDiff,
        severity: this.getSeverity(difficultyPercentDiff),
        description: `Obtainment difficulty differs by ${difficultyPercentDiff.toFixed(2)}%`
      })
    }

    // Calculate overall confidence
    const confidence = this.calculateConfidence(discrepancies)

    // Determine recommended action
    const recommendedAction = this.determineRecommendedAction(discrepancies, confidence)

    return {
      isValid: discrepancies.length === 0,
      discrepancies,
      confidence,
      recommendedAction,
      metadata: {
        clientResult,
        serverResult,
        validatedAt: new Date().toISOString(),
        validationDuration: 0 // Will be set by caller
      }
    }
  }

  // Helper methods
  private getSeverity(percentageDifference: number): 'low' | 'medium' | 'high' | 'critical' {
    if (percentageDifference < 2) return 'low'
    if (percentageDifference < 5) return 'medium'
    if (percentageDifference < 10) return 'high'
    return 'critical'
  }

  private calculateConfidence(discrepancies: Discrepancy[]): number {
    if (discrepancies.length === 0) return 1.0

    const severityWeights = { low: 0.1, medium: 0.3, high: 0.6, critical: 1.0 }
    const totalWeight = discrepancies.reduce((sum, d) => sum + severityWeights[d.severity], 0)
    const maxPossibleWeight = discrepancies.length * 1.0

    return Math.max(0, 1 - (totalWeight / maxPossibleWeight))
  }

  private determineRecommendedAction(
    discrepancies: Discrepancy[],
    confidence: number
  ): 'use_client' | 'use_server' | 'manual_review' {
    if (confidence > 0.95) return 'use_client'
    if (confidence < 0.5) return 'manual_review'

    const hasCriticalDiscrepancies = discrepancies.some(d => d.severity === 'critical')
    if (hasCriticalDiscrepancies) return 'manual_review'

    // Apply fallback strategy
    switch (this.config.fallbackStrategy) {
      case 'prefer_server':
        return 'use_server'
      case 'prefer_client':
        return 'use_client'
      case 'conservative':
        return confidence > 0.8 ? 'use_client' : 'use_server'
      default:
        return 'use_server'
    }
  }

  private selectBestResult(validation: ValidationResult): CalculationResult {
    if (!this.config.enableAutoFallback) {
      return validation.metadata.clientResult
    }

    switch (validation.recommendedAction) {
      case 'use_client':
        return validation.metadata.clientResult
      case 'use_server':
        return validation.metadata.serverResult
      case 'manual_review':
        // For manual review cases, use the more conservative result
        const clientTotal = validation.metadata.clientResult.attackMultipliers.total
        const serverTotal = validation.metadata.serverResult.attackMultipliers.total
        return clientTotal <= serverTotal ? validation.metadata.clientResult : validation.metadata.serverResult
      default:
        return validation.metadata.clientResult
    }
  }

  private updateStats(validation: ValidationResult, duration: number): void {
    this.stats.totalValidations++
    
    if (validation.isValid) {
      this.stats.passedValidations++
    } else {
      this.stats.failedValidations++
    }

    // Update accuracy metrics
    this.stats.clientAccuracy = this.stats.passedValidations / this.stats.totalValidations
    this.stats.serverReliability = this.calculateServerReliability()

    // Update average discrepancy
    const avgDiscrepancy = validation.discrepancies.reduce((sum, d) => sum + d.percentageDifference, 0) / 
                          Math.max(validation.discrepancies.length, 1)
    this.stats.averageDiscrepancy = (this.stats.averageDiscrepancy * (this.stats.totalValidations - 1) + avgDiscrepancy) / 
                                   this.stats.totalValidations

    // Update validation time
    this.stats.averageValidationTime = (this.stats.averageValidationTime * (this.stats.totalValidations - 1) + duration) / 
                                      this.stats.totalValidations
  }

  private calculateServerReliability(): number {
    // Calculate based on recent validation history
    const recentValidations = this.validationHistory.slice(-20)
    if (recentValidations.length === 0) return 1.0

    const reliableValidations = recentValidations.filter(v => 
      v.confidence > 0.8 && !v.discrepancies.some(d => d.severity === 'critical')
    ).length

    return reliableValidations / recentValidations.length
  }

  private addToHistory(validation: ValidationResult): void {
    this.validationHistory.push(validation)
    
    // Keep history size limited
    if (this.validationHistory.length > this.maxHistorySize) {
      this.validationHistory = this.validationHistory.slice(-this.maxHistorySize / 2)
    }
  }

  // Public API methods
  getStats(): ValidationStats & {
    configuredTolerances: ValidationConfig['tolerances']
    validationFrequency: number
    recentValidations: number
  } {
    return {
      ...this.stats,
      configuredTolerances: this.config.tolerances,
      validationFrequency: this.config.validationFrequency,
      recentValidations: this.validationHistory.length
    }
  }

  getValidationHistory(limit = 20): ValidationResult[] {
    return this.validationHistory.slice(-limit)
  }

  updateConfig(newConfig: Partial<ValidationConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }

  clearHistory(): void {
    this.validationHistory = []
  }

  resetStats(): void {
    this.stats = {
      totalValidations: 0,
      passedValidations: 0,
      failedValidations: 0,
      averageDiscrepancy: 0,
      clientAccuracy: 0,
      serverReliability: 0,
      averageValidationTime: 0
    }
  }

  // Manual validation trigger
  async manualValidation(
    relics: Relic[],
    conditions: ConditionalEffects
  ): Promise<ValidationResult> {
    return this.validateCalculation(relics, conditions)
  }

  // Export validation report
  generateReport(): {
    summary: ValidationStats
    recentDiscrepancies: Discrepancy[]
    recommendations: string[]
  } {
    const recentValidations = this.validationHistory.slice(-10)
    const recentDiscrepancies = recentValidations.flatMap(v => v.discrepancies)

    const recommendations: string[] = []

    if (this.stats.clientAccuracy < 0.9) {
      recommendations.push('Consider updating client calculation logic')
    }

    if (this.stats.serverReliability < 0.95) {
      recommendations.push('Server calculation reliability is below threshold')
    }

    if (this.stats.averageDiscrepancy > 5) {
      recommendations.push('High average discrepancy detected - review calculation methods')
    }

    if (this.stats.averageValidationTime > 2000) {
      recommendations.push('Validation times are high - consider optimizing server response')
    }

    return {
      summary: this.stats,
      recentDiscrepancies: recentDiscrepancies.slice(-20),
      recommendations
    }
  }
}

// Export singleton instance
export const calculationValidator = new CalculationValidator({
  enableAutoFallback: true,
  fallbackStrategy: 'prefer_server',
  validationFrequency: 0.1 // Validate 10% of calculations
})

// Export factory function
export const createCalculationValidator = (config?: Partial<ValidationConfig>): CalculationValidator => {
  return new CalculationValidator(config)
}
/**
 * Calculation Types
 * 攻撃倍率計算に関する型定義
 */

// Base calculation context
export interface CalculationContext {
  attackType?: 'normal' | 'charged' | 'skill' | 'ultimate' | 'combo'
  weaponType?: string
  enemyType?: string
  situational?: Record<string, any>
  playerLevel?: number
  weaponLevel?: number
}

// Base statistics for calculation
export interface BaseStats {
  attack: number
  weaponAttack: number
  criticalRate?: number
  criticalDamage?: number
  elementalMastery?: number
  [key: string]: number | undefined
}

// Effect breakdown for detailed calculation display
export interface EffectBreakdown {
  id: string
  name: string
  sourceName: string
  sourceId: string
  type: 'additive' | 'multiplicative' | 'overwrite' | 'unique'
  value: number
  condition?: string
  stackCount?: number
  isActive: boolean
  calculatedValue: number
}

// Performance metrics for calculation
export interface CalculationPerformance {
  executionTime: number
  effectsProcessed: number
  optimizationLevel: 'none' | 'basic' | 'advanced'
  cacheHits: number
  cacheMisses: number
}

// Main attack multiplier calculation result
export interface AttackMultiplierResult {
  finalMultiplier: number
  baseMultiplier: number
  context?: string
  bonusType?: string
  baseStats?: BaseStats
  effectBreakdown?: EffectBreakdown[]
  calculationFormula?: string
  performance?: CalculationPerformance
  timestamp: string
  relicIds: string[]
  contextData?: CalculationContext
}

// Comparison result for multiple calculations
export interface ComparisonResult {
  id: string
  name: string
  context: string
  multiplier: number
  difference: number
  relicIds: string[]
  timestamp: string
}

// Optimization suggestion
export interface OptimizationSuggestion {
  type: 'add' | 'remove' | 'replace'
  relicId: string
  relicName: string
  currentMultiplier: number
  suggestedMultiplier: number
  improvement: number
  reason: string
  confidence: number
}

// Calculation request parameters
export interface CalculationRequest {
  relicIds: string[]
  context?: CalculationContext
  options?: CalculationOptions
}

// Calculation options
export interface CalculationOptions {
  includeBreakdown?: boolean
  includePerformance?: boolean
  optimizationLevel?: 'none' | 'basic' | 'advanced'
  timeout?: number
  useCache?: boolean
  includeAlternatives?: boolean
}

// Batch calculation request
export interface BatchCalculationRequest {
  calculations: CalculationRequest[]
  options?: CalculationOptions
}

// Batch calculation result
export interface BatchCalculationResult {
  results: AttackMultiplierResult[]
  comparisons?: ComparisonResult[]
  performance: {
    totalTime: number
    averageTime: number
    successCount: number
    errorCount: number
  }
}

// Export data formats
export type ExportFormat = 'json' | 'csv' | 'text' | 'pdf'

export interface ExportData {
  format: ExportFormat
  filename: string
  data: string | Blob
  mimeType: string
}

// Calculation error types
export interface CalculationError {
  code: string
  message: string
  details?: any
  timestamp: string
  relicIds?: string[]
  context?: CalculationContext
}

// Real-time calculation state
export interface CalculationState {
  isCalculating: boolean
  progress?: number
  currentStep?: string
  estimatedTimeRemaining?: number
  canCancel: boolean
}

// Meta build analysis
export interface MetaBuildAnalysis {
  buildId: string
  buildName: string
  multiplier: number
  popularity: number
  effectiveness: number
  relics: string[]
  tags: string[]
  analysis: {
    strengths: string[]
    weaknesses: string[]
    recommendations: string[]
  }
}

// Historical calculation data
export interface CalculationHistory {
  id: string
  timestamp: string
  relicIds: string[]
  result: AttackMultiplierResult
  context?: CalculationContext
  tags?: string[]
}

// Type guards
export const isAttackMultiplierResult = (
  obj: any
): obj is AttackMultiplierResult => {
  return (
    obj &&
    typeof obj.finalMultiplier === 'number' &&
    typeof obj.baseMultiplier === 'number' &&
    Array.isArray(obj.relicIds) &&
    typeof obj.timestamp === 'string'
  )
}

export const isComparisonResult = (obj: any): obj is ComparisonResult => {
  return (
    obj &&
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.multiplier === 'number' &&
    typeof obj.difference === 'number' &&
    Array.isArray(obj.relicIds)
  )
}

export const isCalculationError = (obj: any): obj is CalculationError => {
  return (
    obj &&
    typeof obj.code === 'string' &&
    typeof obj.message === 'string' &&
    typeof obj.timestamp === 'string'
  )
}

// Utility types
export type CalculationStatus =
  | 'idle'
  | 'calculating'
  | 'completed'
  | 'error'
  | 'cancelled'

export type MultiplierCategory = 'low' | 'medium' | 'high' | 'exceptional'

export interface MultiplierThresholds {
  low: number
  medium: number
  high: number
  exceptional: number
}

// Default values
export const DEFAULT_MULTIPLIER_THRESHOLDS: MultiplierThresholds = {
  low: 1.5,
  medium: 2.0,
  high: 3.0,
  exceptional: 5.0,
}

export const DEFAULT_CALCULATION_OPTIONS: CalculationOptions = {
  includeBreakdown: true,
  includePerformance: true,
  optimizationLevel: 'basic',
  timeout: 30000,
  useCache: true,
  includeAlternatives: false,
}

// Additional types for compatibility with new calculation engine
export interface ConditionalEffects {
  enemyType: 'normal' | 'boss' | 'elite' | 'weak'
  playerHealth: number // 0-100
  comboCount: number
  isFirstHit: boolean
  environmentEffects: string[]
}

export interface CalculationResult {
  attackMultipliers: {
    total: number
    base: number
    synergy: number
    conditional: number
    environmental?: number
  }
  efficiency: number
  obtainmentDifficulty: number
  relicDetails: RelicDetail[]
  effectBreakdown: EffectBreakdown[]
  calculationSteps: CalculationStep[]
  metadata: {
    calculatedAt: string
    clientSide: boolean
    cacheKey?: string
    cached?: boolean
    offline?: boolean
    fallback?: boolean
    source?: string
    complexity?: string
    performance?: {
      duration: number
      relicCount: number
      activeEffects?: number
    }
  }
}

export interface RelicDetail {
  relicId: string
  name: string
  contribution: number
  effects: any[]
  synergies: any[]
  conditionalBonuses: any[]
}

export interface CalculationStep {
  step: number
  description: string
  formula?: string
  value: number
  result?: number
}

export interface OptimizationRequest {
  relic_ids: string[]
  combat_style?: string
  constraints?: {
    maxDifficulty?: number
    allowedCategories?: string[]
    excludeRelicIds?: string[]
  }
  preferences?: {
    preferHighRarity?: boolean
    preferLowDifficulty?: boolean
    minImprovement?: number
  }
}

export interface OptimizationResult {
  suggestions: any[] // OptimizationSuggestion[]
  analysis?: {
    currentPower: number
    maxPotential: number
    efficiency: number
  }
}

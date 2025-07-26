// Build-related types for Nightreign Relic Calculator

import type { Relic, CombatStyle } from './relic'

// Core build interface
export interface Build {
  id: string
  name: string
  description?: string
  relics: Relic[] // Full relic objects for BuildManager compatibility
  combatStyle?: CombatStyle
  createdAt: string
  lastModified: string
  shareKey?: string
  isPublic: boolean
  isFavorite?: boolean
  tags?: string[]
  metadata?: BuildMetadata
  attackMultiplier?: number
  obtainmentDifficulty?: number
}

// Build metadata for additional information
export interface BuildMetadata {
  version: string
  calculatedDps?: number
  difficulty?: number
  playstyle?: string[]
  strengths?: string[]
  weaknesses?: string[]
}

// Build creation request
export interface BuildCreateRequest {
  name: string
  description?: string
  relicIds: string[]
  combatStyle: CombatStyle
  isPublic?: boolean
  tags?: string[]
}

// Build update request
export interface BuildUpdateRequest {
  name?: string
  description?: string
  relicIds?: string[]
  combatStyle?: CombatStyle
  isPublic?: boolean
  tags?: string[]
}

// Build comparison types
export interface BuildComparison {
  build1: Build
  build2: Build
  metrics: ComparisonMetrics
  analysis: ComparisonAnalysis
}

export interface ComparisonMetrics {
  dpsRatio: number
  difficultyDifference: number
  relicOverlap: number
  costDifference: number
}

export interface ComparisonAnalysis {
  winner: string // build ID
  reasoning: string[]
  advantages: Record<string, string[]>
  disadvantages: Record<string, string[]>
}

// Build sharing types
export interface BuildShare {
  shareKey: string
  shareUrl: string
  expiresAt?: Date
  accessCount: number
  build: Build
}

// Build validation types
export interface BuildValidation {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
  suggestions: ValidationSuggestion[]
}

export interface ValidationError {
  code: string
  message: string
  field?: string
  relicId?: string
}

export interface ValidationWarning {
  code: string
  message: string
  severity: 'low' | 'medium' | 'high'
  relicId?: string
}

export interface ValidationSuggestion {
  type: 'optimization' | 'alternative' | 'improvement'
  message: string
  suggestedRelics?: string[]
  expectedImprovement?: number
}

// Build statistics
export interface BuildStats {
  totalBuilds: number
  publicBuilds: number
  averageRelicCount: number
  popularCombatStyles: Record<CombatStyle, number>
  popularRelics: Array<{
    relicId: string
    name: string
    usage: number
  }>
  difficultyDistribution: Record<string, number>
}

// Build filter and search types
export interface BuildFilters {
  combatStyle?: CombatStyle[]
  relicIds?: string[]
  tags?: string[]
  difficulty?: {
    min?: number
    max?: number
  }
  isPublic?: boolean
  dateRange?: {
    from?: Date
    to?: Date
  }
}

export interface BuildSearchParams {
  query?: string
  filters?: BuildFilters
  sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'difficulty' | 'popularity'
  sortOrder?: 'asc' | 'desc'
  page?: number
  perPage?: number
}

// Build export/import types
export interface BuildExport {
  format: 'json' | 'csv' | 'text'
  builds: Build[]
  metadata: {
    exportedAt: Date
    version: string
    totalCount: number
  }
}

export interface BuildImport {
  format: 'json' | 'csv'
  data: string | Build[]
  options?: {
    skipDuplicates?: boolean
    validateRelics?: boolean
    setAsPrivate?: boolean
  }
}

// Build history and versioning
export interface BuildHistory {
  buildId: string
  versions: BuildVersion[]
}

export interface BuildVersion {
  versionId: string
  build: Build
  changedAt: Date
  changeType: 'created' | 'updated' | 'shared' | 'archived'
  changes?: BuildChange[]
}

export interface BuildChange {
  field: string
  oldValue: any
  newValue: any
  reason?: string
}

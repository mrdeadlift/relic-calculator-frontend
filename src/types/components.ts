// Component Props Types for Nightreign Relic Calculator

import type {
  Relic,
  AttackCalculationResult,
  CombatStyle,
  RelicCategory,
  RelicRarity,
} from './relic'

// RelicSelector component props
export interface RelicSelectorProps {
  availableRelics: Relic[]
  selectedRelics: Relic[]
  maxSelection?: number
  allowDuplicates?: boolean
  showFilters?: boolean
  showSearch?: boolean
  onSelectionChange?: (relics: Relic[]) => void
}

// AttackDisplay component props
export interface AttackDisplayProps {
  calculationResult: AttackCalculationResult | null
  selectedRelics: Relic[]
  showBreakdown?: boolean
  showWarnings?: boolean
  compact?: boolean
}

// BuildComparison component props
export interface BuildComparisonProps {
  builds: any[]
  maxBuilds?: number
  showMetrics?: boolean
  onComparisonComplete?: (result: any) => void
}

// BuildManager component props
export interface BuildManagerProps {
  currentBuild?: any | null
  onSave?: (build: any) => void
  onLoad?: (buildId: string) => void
  onExport?: (format: 'json' | 'csv' | 'url') => void
  onImport?: (data: any) => void
}

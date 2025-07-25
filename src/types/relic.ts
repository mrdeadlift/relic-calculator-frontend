// Types for Nightreign Relic Calculator

// Core enums for type safety
export type RelicCategory = 'Attack' | 'Defense' | 'Utility' | 'Critical' | 'Elemental'
export type RelicRarity = 'common' | 'rare' | 'epic' | 'legendary'
export type RelicQuality = 'Delicate' | 'Polished' | 'Grand'
export type EffectType = 'attack_multiplier' | 'attack_flat' | 'attack_percentage' | 'critical_multiplier' | 'critical_chance' | 'elemental_damage' | 'conditional_damage' | 'weapon_specific' | 'unique'
export type StackingRule = 'additive' | 'multiplicative' | 'overwrite' | 'unique'
export type DamageType = 'physical' | 'magical' | 'fire' | 'ice' | 'lightning' | 'dark' | 'holy'
export type CombatStyle = 'melee' | 'ranged' | 'magic' | 'hybrid'

// Effect condition interface
export interface EffectCondition {
  id: string
  type: 'weapon_type' | 'combat_style' | 'health_threshold' | 'chain_position' | 'enemy_type' | 'time_based' | 'equipment_count'
  value: string | number
  description: string
}

// Core relic effect interface
export interface RelicEffect {
  id: string
  type: EffectType
  value: number | string
  stackingRule: StackingRule
  conditions?: EffectCondition[]
  damageTypes: DamageType[]
  name: string
  description: string
}

// Main relic interface
export interface Relic {
  id: string
  name: string
  description: string
  category: RelicCategory
  rarity: RelicRarity
  quality: RelicQuality
  effects: RelicEffect[]
  iconUrl: string
  obtainmentDifficulty: number // 1-10
  conflicts: string[] // 相互排他的な遺物ID
  type: string // Add missing type field
  attackMultiplier?: number // Add missing attackMultiplier field
  source?: string // Add missing source field
}

// Build interface
export interface Build {
  id: string
  name: string
  description?: string
  relics: string[] // relic IDs
  combatStyle: CombatStyle
  createdAt: Date
  updatedAt: Date
  shareKey?: string
  isPublic: boolean
}

// Calculation context
export interface CalculationContext {
  selectedRelics: Relic[]
  combatStyle: CombatStyle
  conditions: Record<string, boolean> // 条件付き効果の状態
  baseStats: BaseStats
}

// Base stats interface
export interface BaseStats {
  attackPower: number
  characterLevel: number
  weaponType: string
  weaponAttackRating: number
}

// Stacking bonus for detailed calculation
export interface StackingBonus {
  effectId: string
  effectName: string
  relicName: string
  baseValue: number
  stackedValue: number
  stackingRule: StackingRule
  appliedConditions: string[]
}

// Conditional effect result
export interface ConditionalEffect {
  effectId: string
  effectName: string
  relicName: string
  condition: EffectCondition
  isActive: boolean
  value: number
  description: string
}

// Detailed attack calculation result
export interface AttackCalculationResult {
  totalMultiplier: number
  baseMultiplier: number
  baseAttack?: number
  finalAttack?: number
  flatBonuses?: number[]
  stackingBonuses: StackingBonus[]
  conditionalEffects: ConditionalEffect[]
  warningsAndErrors: string[]
  damageByType: Record<DamageType, number>
  finalAttackPower: number
  breakdown: CalculationBreakdown[]
}

// Calculation breakdown item
export interface CalculationBreakdown {
  step: number
  description: string
  operation: 'base' | 'add' | 'multiply' | 'condition'
  type?: string
  value: number
  runningTotal: number
  relicName?: string
  effectName?: string
}

// Calculator state
export interface CalculatorState {
  selectedRelics: Relic[]
  maxSelection: number
  calculationContext: CalculationContext
  calculationResult: AttackCalculationResult | null
  isCalculating: boolean
  error: string | null
}

// Sample relic data based on research
export const SAMPLE_RELICS: Relic[] = [
  {
    id: 'physical-attack-up',
    name: 'Physical Attack Up',
    description: 'Increases physical attack power based on character level',
    type: 'attack_boost',
    quality: 'Polished',
    effects: [
      {
        id: 'phys-dmg-boost',
        type: 'attack_percentage',
        value: 2,
        stackingRule: 'additive',
        name: 'Physical Damage',
        description: '+2% physical attack power per level',
        damageTypes: ['physical'],
        conditions: [
          {
            id: 'per-level',
            type: 'equipment_count',
            value: 'character_level',
            description: 'Scales with character level'
          }
        ]
      }
    ],
    category: 'Attack',
    rarity: 'common',
    iconUrl: '/icons/physical-attack-up.png',
    obtainmentDifficulty: 3,
    conflicts: []
  },
  {
    id: 'improved-straight-sword',
    name: 'Improved Straight Sword Attack Power',
    description: 'Enhances straight sword damage significantly',
    type: 'weapon_boost',
    quality: 'Grand',
    effects: [
      {
        id: 'straight-sword-boost',
        type: 'weapon_specific',
        value: 7,
        stackingRule: 'multiplicative',
        name: 'Straight Sword Boost',
        description: '+7% straight sword attack power',
        damageTypes: ['physical'],
        conditions: [
          {
            id: 'straight-sword',
            type: 'weapon_type',
            value: 'straight_sword',
            description: 'Requires straight sword equipped'
          }
        ]
      }
    ],
    category: 'Attack',
    rarity: 'rare',
    iconUrl: '/icons/improved-straight-sword.png',
    obtainmentDifficulty: 5,
    conflicts: []
  },
  {
    id: 'initial-attack-buff',
    name: 'Initial Attack Buff',
    description: 'Dramatically increases damage of the first attack in a combo',
    type: 'conditional_boost',
    quality: 'Grand',
    effects: [
      {
        id: 'first-r1-boost',
        type: 'conditional_damage',
        value: 13,
        stackingRule: 'multiplicative',
        name: 'First R1 Boost',
        description: '+13% damage to first R1 in chain',
        damageTypes: ['physical'],
        conditions: [
          {
            id: 'first-attack',
            type: 'chain_position',
            value: 1,
            description: 'First attack in combo chain'
          }
        ]
      }
    ],
    category: 'Attack',
    rarity: 'epic',
    iconUrl: '/icons/initial-attack-buff.png',
    obtainmentDifficulty: 7,
    conflicts: []
  },
  {
    id: 'three-weapon-bonus',
    name: 'Three Weapon Type Bonus',
    description: 'Provides damage bonus when using multiple weapons of the same type',
    type: 'set_bonus',
    quality: 'Polished',
    effects: [
      {
        id: 'weapon-set-bonus',
        type: 'conditional_damage',
        value: 10,
        stackingRule: 'multiplicative',
        name: 'Weapon Set Bonus',
        description: '+10% damage with 3+ weapons of same type',
        damageTypes: ['physical'],
        conditions: [
          {
            id: 'weapon-count',
            type: 'equipment_count',
            value: 3,
            description: '3 or more weapons of same type'
          }
        ]
      }
    ],
    category: 'Attack',
    rarity: 'rare',
    iconUrl: '/icons/three-weapon-bonus.png',
    obtainmentDifficulty: 6,
    conflicts: []
  },
  {
    id: 'improved-critical-hits',
    name: 'Improved Critical Hits',
    description: 'Multi-tier critical hit damage enhancement',
    type: 'critical_boost',
    quality: 'Grand',
    effects: [
      {
        id: 'crit-multiplier-1',
        type: 'critical_multiplier',
        value: 12,
        stackingRule: 'additive',
        name: 'Critical Multiplier I',
        description: '+12% critical hit damage',
        damageTypes: ['physical', 'magical'],
        conditions: [
          {
            id: 'critical-hit',
            type: 'combat_style',
            value: 'critical_strike',
            description: 'On critical hits'
          }
        ]
      },
      {
        id: 'crit-multiplier-2',
        type: 'critical_multiplier',
        value: 18,
        stackingRule: 'additive',
        name: 'Critical Multiplier II',
        description: '+18% critical hit damage',
        damageTypes: ['physical', 'magical'],
        conditions: [
          {
            id: 'critical-hit-2',
            type: 'combat_style',
            value: 'critical_strike',
            description: 'On critical hits'
          }
        ]
      },
      {
        id: 'crit-multiplier-3',
        type: 'critical_multiplier',
        value: 24,
        stackingRule: 'additive',
        name: 'Critical Multiplier III',
        description: '+24% critical hit damage',
        damageTypes: ['physical', 'magical'],
        conditions: [
          {
            id: 'critical-hit-3',
            type: 'combat_style',
            value: 'critical_strike',
            description: 'On critical hits'
          }
        ]
      }
    ],
    category: 'Critical',
    rarity: 'legendary',
    iconUrl: '/icons/improved-critical-hits.png',
    obtainmentDifficulty: 9,
    conflicts: []
  }
]

// Relic filtering and search
export interface RelicFilters {
  types?: string[]
  effects?: string[]
  attackMultiplier?: {
    min?: number
    max?: number
  }
  obtainmentDifficulty?: {
    min?: number
    max?: number
  }
  rarity?: string[]
  source?: string[]
}

export interface RelicSearchParams {
  query?: string
  filters?: RelicFilters
  sortBy?: 'name' | 'attackMultiplier' | 'obtainmentDifficulty' | 'rarity'
  sortOrder?: 'asc' | 'desc'
  page?: number
  perPage?: number
}
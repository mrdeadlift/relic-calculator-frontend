// Types for Nightreign Relic Calculator

export interface RelicEffect {
  id: string
  name: string
  description: string
  multiplier?: number
  flatBonus?: number
  percentage?: number
  condition?: string
}

export interface Relic {
  id: string
  name: string
  quality: 'Delicate' | 'Polished' | 'Grand'
  effects: RelicEffect[]
  category: 'Attack' | 'Defense' | 'Utility' | 'Critical' | 'Elemental'
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary'
}

export interface AttackCalculation {
  baseAttack: number
  totalMultiplier: number
  flatBonuses: number
  finalAttack: number
  breakdown: {
    relicName: string
    effectName: string
    value: number
    type: 'multiplier' | 'flat' | 'percentage'
  }[]
}

export interface CalculatorState {
  selectedRelics: Relic[]
  baseAttackPower: number
  characterLevel: number
  weaponType: string
  calculationResult: AttackCalculation | null
}

// Sample relic data based on research
export const SAMPLE_RELICS: Relic[] = [
  {
    id: 'physical-attack-up',
    name: 'Physical Attack Up',
    quality: 'Polished',
    effects: [
      {
        id: 'phys-dmg-boost',
        name: 'Physical Damage',
        description: '+2% physical attack power per level',
        percentage: 2,
        condition: 'per level'
      }
    ],
    category: 'Attack',
    rarity: 'Common'
  },
  {
    id: 'improved-straight-sword',
    name: 'Improved Straight Sword Attack Power',
    quality: 'Grand',
    effects: [
      {
        id: 'straight-sword-boost',
        name: 'Straight Sword Boost',
        description: '+7% straight sword attack power',
        percentage: 7,
        condition: 'straight sword equipped'
      }
    ],
    category: 'Attack',
    rarity: 'Rare'
  },
  {
    id: 'initial-attack-buff',
    name: 'Initial Attack Buff',
    quality: 'Grand',
    effects: [
      {
        id: 'first-r1-boost',
        name: 'First R1 Boost',
        description: '+13% damage to first R1 in chain',
        percentage: 13,
        condition: 'first R1 attack'
      }
    ],
    category: 'Attack',
    rarity: 'Epic'
  },
  {
    id: 'three-weapon-bonus',
    name: 'Three Weapon Type Bonus',
    quality: 'Polished',
    effects: [
      {
        id: 'weapon-set-bonus',
        name: 'Weapon Set Bonus',
        description: '+10% damage with 3+ weapons of same type',
        percentage: 10,
        condition: '3+ same weapon type'
      }
    ],
    category: 'Attack',
    rarity: 'Rare'
  },
  {
    id: 'improved-critical-hits',
    name: 'Improved Critical Hits',
    quality: 'Grand',
    effects: [
      {
        id: 'crit-multiplier-1',
        name: 'Critical Multiplier I',
        description: '+12% critical hit damage',
        multiplier: 1.12,
        condition: 'critical hits'
      },
      {
        id: 'crit-multiplier-2',
        name: 'Critical Multiplier II',
        description: '+18% critical hit damage',
        multiplier: 1.18,
        condition: 'critical hits'
      },
      {
        id: 'crit-multiplier-3',
        name: 'Critical Multiplier III',
        description: '+24% critical hit damage',
        multiplier: 1.24,
        condition: 'critical hits'
      }
    ],
    category: 'Critical',
    rarity: 'Legendary'
  }
]
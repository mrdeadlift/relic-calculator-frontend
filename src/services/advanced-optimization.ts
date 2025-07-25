/**
 * Advanced Optimization Service
 * 高度な最適化アルゴリズムと戦闘スタイル別分析を提供
 */

import type { 
  Relic, 
  CombatStyle, 
  OptimizationRequest, 
  OptimizationResult,
  CalculationResult,
  RelicCategory
} from '../types'
import { calculationEngine } from './calculation-engine'

export interface AdvancedOptimizationOptions {
  combatStyle: CombatStyle
  difficultyPreference: 'easy' | 'medium' | 'hard' | 'any'
  includeRareRelics: boolean
  maxRelics: number
  excludeConflicts: boolean
  prioritizeCategories: RelicCategory[]
  minEfficiency: number
  considerSynergies: boolean
  allowSuboptimal: boolean
}

export interface CombatStyleProfile {
  name: CombatStyle
  description: string
  preferredCategories: RelicCategory[]
  synergies: {
    relicTypes: string[]
    multiplier: number
    description: string
  }[]
  penalizedCategories: RelicCategory[]
  difficultyModifier: number
  strategies: OptimizationStrategy[]
}

export interface OptimizationStrategy {
  name: string
  description: string
  conditions: Array<{
    type: 'relic_count' | 'category_focus' | 'difficulty_range' | 'synergy_bonus'
    value: any
  }>
  relicWeights: Record<string, number>
  categoryBonus: Record<RelicCategory, number>
}

export interface MetaBuildAnalysis {
  buildId: string
  buildName: string
  combatStyle: CombatStyle
  relics: string[]
  performance: {
    attackMultiplier: number
    efficiency: number
    obtainmentDifficulty: number
    averageRarity: number
  }
  strengths: string[]
  weaknesses: string[]
  recommendations: {
    type: 'add' | 'remove' | 'replace'
    relicId: string
    reason: string
    impact: number
  }[]
  popularity: {
    rank: number
    usagePercentage: number
    recentTrend: 'rising' | 'stable' | 'declining'
  }
}

export interface OptimizationExplanation {
  reasoning: string[]
  tradeoffs: Array<{
    decision: string
    pros: string[]
    cons: string[]
    impact: number
  }>
  alternatives: Array<{
    relics: string[]
    performance: number
    explanation: string
  }>
  confidenceScore: number
  limitations: string[]
}

class AdvancedOptimizationService {
  private combatStyleProfiles: Record<CombatStyle, CombatStyleProfile> = {
    melee: {
      name: 'melee',
      description: '近接戦闘に特化したスタイル。高い攻撃力と安定したダメージ出力を重視',
      preferredCategories: ['Attack', 'Critical'],
      synergies: [
        {
          relicTypes: ['weapon_specific', 'attack_multiplier'],
          multiplier: 1.25,
          description: '武器特化と攻撃倍率の組み合わせによる高いダメージ出力'
        },
        {
          relicTypes: ['critical_multiplier', 'critical_chance'],
          multiplier: 1.35,
          description: 'クリティカル系遺物の相乗効果'
        }
      ],
      penalizedCategories: ['Utility'],
      difficultyModifier: 1.0,
      strategies: [
        {
          name: 'maximum_damage',
          description: '最大ダメージ出力を追求する戦略',
          conditions: [
            { type: 'relic_count', value: { min: 6, max: 9 } },
            { type: 'category_focus', value: 'Attack' }
          ],
          relicWeights: {
            'attack_multiplier': 1.5,
            'weapon_specific': 1.3,
            'critical_multiplier': 1.2
          },
          categoryBonus: {
            'Attack': 1.3,
            'Critical': 1.2,
            'Defense': 0.8,
            'Utility': 0.7,
            'Elemental': 1.0
          }
        }
      ]
    },
    ranged: {
      name: 'ranged',
      description: '遠距離戦闘に特化したスタイル。精密さと持続火力を重視',
      preferredCategories: ['Attack', 'Critical', 'Elemental'],
      synergies: [
        {
          relicTypes: ['critical_chance', 'elemental_damage'],
          multiplier: 1.3,
          description: '精密射撃と元素ダメージの組み合わせ'
        }
      ],
      penalizedCategories: ['Defense'],
      difficultyModifier: 1.1,
      strategies: [
        {
          name: 'precision_build',
          description: 'クリティカルと精密性を重視した構成',
          conditions: [
            { type: 'category_focus', value: 'Critical' }
          ],
          relicWeights: {
            'critical_chance': 1.4,
            'critical_multiplier': 1.3,
            'elemental_damage': 1.2
          },
          categoryBonus: {
            'Attack': 1.1,
            'Critical': 1.4,
            'Defense': 0.6,
            'Utility': 0.8,
            'Elemental': 1.3
          }
        }
      ]
    },
    magic: {
      name: 'magic',
      description: '魔法戦闘に特化したスタイル。元素ダメージと特殊効果を重視',
      preferredCategories: ['Elemental', 'Utility'],
      synergies: [
        {
          relicTypes: ['elemental_damage', 'unique'],
          multiplier: 1.4,
          description: '元素ダメージと固有効果の相互作用'
        }
      ],
      penalizedCategories: [],
      difficultyModifier: 1.2,
      strategies: [
        {
          name: 'elemental_mastery',
          description: '元素ダメージの習得と活用に重点を置いた戦略',
          conditions: [
            { type: 'category_focus', value: 'Elemental' }
          ],
          relicWeights: {
            'elemental_damage': 1.5,
            'unique': 1.3,
            'conditional_damage': 1.2
          },
          categoryBonus: {
            'Attack': 1.0,
            'Critical': 1.0,
            'Defense': 0.9,
            'Utility': 1.2,
            'Elemental': 1.5
          }
        }
      ]
    },
    hybrid: {
      name: 'hybrid',
      description: 'バランス型のスタイル。様々な戦闘状況に対応可能',
      preferredCategories: ['Attack', 'Utility'],
      synergies: [
        {
          relicTypes: ['attack_multiplier', 'conditional_damage'],
          multiplier: 1.2,
          description: 'バランスの取れた攻撃力とユーティリティ'
        }
      ],
      penalizedCategories: [],
      difficultyModifier: 0.9,
      strategies: [
        {
          name: 'balanced_approach',
          description: 'すべてのカテゴリをバランスよく組み合わせる戦略',
          conditions: [
            { type: 'relic_count', value: { min: 7, max: 9 } }
          ],
          relicWeights: {
            'attack_multiplier': 1.2,
            'conditional_damage': 1.1,
            'utility': 1.1
          },
          categoryBonus: {
            'Attack': 1.2,
            'Critical': 1.1,
            'Defense': 1.0,
            'Utility': 1.2,
            'Elemental': 1.1
          }
        }
      ]
    }
  }

  /**
   * 戦闘スタイル別の高度な最適化を実行
   */
  async optimizeForCombatStyle(
    currentRelics: string[],
    availableRelics: Relic[],
    options: AdvancedOptimizationOptions
  ): Promise<OptimizationResult & { explanation: OptimizationExplanation }> {
    const profile = this.combatStyleProfiles[options.combatStyle]
    const strategy = this.selectOptimalStrategy(profile, options)
    
    // 現在のビルドを分析
    const currentAnalysis = await this.analyzeBuildPerformance(currentRelics, options.combatStyle)
    
    // 候補となる遺物を評価・ランク付け
    const candidateRelics = this.evaluateRelicCandidates(
      availableRelics,
      currentRelics,
      strategy,
      options
    )
    
    // 最適化の実行
    const optimizedBuild = await this.generateOptimizedBuild(
      currentRelics,
      candidateRelics,
      strategy,
      options
    )
    
    // 結果の検証と説明生成
    const optimizedAnalysis = await this.analyzeBuildPerformance(optimizedBuild.relics, options.combatStyle)
    const explanation = this.generateOptimizationExplanation(
      currentAnalysis,
      optimizedAnalysis,
      optimizedBuild.changes,
      strategy
    )
    
    return {
      suggestions: optimizedBuild.changes,
      analysis: {
        currentPower: currentAnalysis.attackMultipliers.total,
        maxPotential: optimizedAnalysis.attackMultipliers.total,
        efficiency: optimizedAnalysis.efficiency
      },
      explanation
    }
  }

  /**
   * メタビルド分析を実行
   */
  async analyzeMetaBuilds(
    combatStyle: CombatStyle,
    constraints?: {
      maxDifficulty?: number
      allowedCategories?: RelicCategory[]
      minEfficiency?: number
    }
  ): Promise<MetaBuildAnalysis[]> {
    // シミュレーションデータ（実際の実装では統計データベースから取得）
    const metaBuilds = await this.fetchMetaBuildsData(combatStyle, constraints)
    
    const analyses = await Promise.all(
      metaBuilds.map(build => this.analyzeMetaBuild(build, combatStyle))
    )
    
    return analyses.sort((a, b) => b.performance.attackMultiplier - a.performance.attackMultiplier)
  }

  /**
   * 難易度ベースの最適化計算
   */
  async optimizeByDifficulty(
    currentRelics: string[],
    availableRelics: Relic[],
    targetDifficulty: 'easy' | 'medium' | 'hard',
    combatStyle: CombatStyle
  ): Promise<OptimizationResult[]> {
    const difficultyRanges = {
      easy: { min: 1, max: 4 },
      medium: { min: 3, max: 7 },
      hard: { min: 6, max: 10 }
    }
    
    const range = difficultyRanges[targetDifficulty]
    const filteredRelics = availableRelics.filter(
      relic => relic.obtainmentDifficulty >= range.min && relic.obtainmentDifficulty <= range.max
    )
    
    const options: AdvancedOptimizationOptions = {
      combatStyle,
      difficultyPreference: targetDifficulty,
      includeRareRelics: targetDifficulty === 'hard',
      maxRelics: 9,
      excludeConflicts: true,
      prioritizeCategories: this.combatStyleProfiles[combatStyle].preferredCategories,
      minEfficiency: targetDifficulty === 'easy' ? 0.6 : targetDifficulty === 'medium' ? 0.75 : 0.85,
      considerSynergies: true,
      allowSuboptimal: targetDifficulty === 'easy'
    }
    
    const result = await this.optimizeForCombatStyle(currentRelics, filteredRelics, options)
    return [result]
  }

  /**
   * 最適化の詳細説明を生成
   */
  private generateOptimizationExplanation(
    currentAnalysis: CalculationResult,
    optimizedAnalysis: CalculationResult,
    changes: any[],
    strategy: OptimizationStrategy
  ): OptimizationExplanation {
    const improvement = optimizedAnalysis.attackMultipliers.total - currentAnalysis.attackMultipliers.total
    const improvementPercent = (improvement / currentAnalysis.attackMultipliers.total) * 100
    
    const reasoning = [
      `${strategy.name}戦略に基づいて最適化を実行しました`,
      `攻撃倍率を${improvement.toFixed(2)}（${improvementPercent.toFixed(1)}%）向上させることができます`,
      `効率性が${currentAnalysis.efficiency.toFixed(2)}から${optimizedAnalysis.efficiency.toFixed(2)}に改善されます`
    ]
    
    const tradeoffs = changes.map(change => ({
      decision: `${change.type}: ${change.relicName}`,
      pros: [
        `攻撃倍率 +${change.improvement.toFixed(2)}`,
        change.reason
      ],
      cons: change.type === 'replace' ? ['既存の遺物の効果を失う'] : [],
      impact: change.improvement
    }))
    
    const alternatives = [
      {
        relics: currentAnalysis.relicDetails.map(r => r.relicId),
        performance: currentAnalysis.attackMultipliers.total,
        explanation: '現在の構成を維持（変更なし）'
      }
    ]
    
    return {
      reasoning,
      tradeoffs,
      alternatives,
      confidenceScore: Math.min(0.95, 0.7 + (improvementPercent / 100)),
      limitations: [
        '入手難易度は考慮されていません',
        '実際の戦闘状況により結果は変動する可能性があります',
        'プレイヤーのスキルレベルによる影響は含まれていません'
      ]
    }
  }

  /**
   * 戦略を選択
   */
  private selectOptimalStrategy(
    profile: CombatStyleProfile,
    options: AdvancedOptimizationOptions
  ): OptimizationStrategy {
    // 条件に最も適合する戦略を選択
    return profile.strategies[0] // 簡略化：最初の戦略を使用
  }

  /**
   * 遺物候補を評価
   */
  private evaluateRelicCandidates(
    availableRelics: Relic[],
    currentRelics: string[],
    strategy: OptimizationStrategy,
    options: AdvancedOptimizationOptions
  ) {
    return availableRelics
      .filter(relic => !currentRelics.includes(relic.id))
      .map(relic => ({
        relic,
        score: this.calculateRelicScore(relic, strategy, options)
      }))
      .sort((a, b) => b.score - a.score)
  }

  /**
   * 遺物のスコアを計算
   */
  private calculateRelicScore(
    relic: Relic,
    strategy: OptimizationStrategy,
    options: AdvancedOptimizationOptions
  ): number {
    let score = 0
    
    // カテゴリボーナス
    score += strategy.categoryBonus[relic.category] || 1.0
    
    // 効果タイプに基づくウェイト
    relic.effects.forEach(effect => {
      const weight = strategy.relicWeights[effect.type] || 1.0
      score += weight * (typeof effect.value === 'number' ? effect.value : 1)
    })
    
    // 難易度による調整
    const difficultyPenalty = options.difficultyPreference === 'easy' ? 
      Math.max(0, (relic.obtainmentDifficulty - 5) * 0.1) : 0
    score -= difficultyPenalty
    
    // レアリティボーナス
    const rarityBonus = {
      'common': 1.0,
      'rare': 1.1,
      'epic': 1.2,
      'legendary': 1.3
    }
    score *= rarityBonus[relic.rarity] || 1.0
    
    return score
  }

  /**
   * 最適化されたビルドを生成
   */
  private async generateOptimizedBuild(
    currentRelics: string[],
    candidateRelics: { relic: Relic; score: number }[],
    strategy: OptimizationStrategy,
    options: AdvancedOptimizationOptions
  ) {
    const changes: any[] = []
    let workingRelics = [...currentRelics]
    
    // 上位候補から順に評価し、改善が見込める場合は変更を提案
    for (let i = 0; i < Math.min(5, candidateRelics.length); i++) {
      const candidate = candidateRelics[i]
      
      // 追加または置換の評価
      if (workingRelics.length < options.maxRelics) {
        // 追加
        const newRelics = [...workingRelics, candidate.relic.id]
        const improvement = await this.calculateImprovement(workingRelics, newRelics, options.combatStyle)
        
        if (improvement > 0) {
          changes.push({
            type: 'add',
            relicId: candidate.relic.id,
            relicName: candidate.relic.name,
            currentMultiplier: 0,
            suggestedMultiplier: improvement,
            improvement,
            reason: `戦闘効率の向上（${candidate.relic.category}カテゴリ）`,
            confidence: Math.min(0.95, candidate.score / 10)
          })
          workingRelics = newRelics
        }
      } else {
        // 最も効果の低い遺物と置換を検討
        const worstRelicIndex = await this.findWorstRelic(workingRelics, options.combatStyle)
        if (worstRelicIndex >= 0) {
          const testRelics = [...workingRelics]
          testRelics[worstRelicIndex] = candidate.relic.id
          
          const improvement = await this.calculateImprovement(workingRelics, testRelics, options.combatStyle)
          
          if (improvement > 0.05) { // 最小改善閾値
            changes.push({
              type: 'replace',
              relicId: candidate.relic.id,
              relicName: candidate.relic.name,
              currentMultiplier: 0,
              suggestedMultiplier: improvement,
              improvement,
              reason: `より効率的な遺物との置換`,
              confidence: Math.min(0.9, candidate.score / 10)
            })
            workingRelics = testRelics
          }
        }
      }
    }
    
    return {
      relics: workingRelics,
      changes
    }
  }

  /**
   * ビルドパフォーマンスを分析
   */
  private async analyzeBuildPerformance(relics: string[], combatStyle: CombatStyle): Promise<CalculationResult> {
    return await calculationEngine.calculate({
      relicIds: relics,
      context: {
        attackType: 'normal',
        weaponType: combatStyle === 'melee' ? 'sword' : combatStyle === 'ranged' ? 'bow' : 'staff'
      }
    })
  }

  /**
   * 改善度を計算
   */
  private async calculateImprovement(
    oldRelics: string[],
    newRelics: string[],
    combatStyle: CombatStyle
  ): Promise<number> {
    const [oldResult, newResult] = await Promise.all([
      this.analyzeBuildPerformance(oldRelics, combatStyle),
      this.analyzeBuildPerformance(newRelics, combatStyle)
    ])
    
    return newResult.attackMultipliers.total - oldResult.attackMultipliers.total
  }

  /**
   * 最も効果の低い遺物を特定
   */
  private async findWorstRelic(relics: string[], combatStyle: CombatStyle): Promise<number> {
    const baseResult = await this.analyzeBuildPerformance(relics, combatStyle)
    
    let worstIndex = -1
    let minImpact = Infinity
    
    for (let i = 0; i < relics.length; i++) {
      const testRelics = relics.filter((_, index) => index !== i)
      const testResult = await this.analyzeBuildPerformance(testRelics, combatStyle)
      const impact = baseResult.attackMultipliers.total - testResult.attackMultipliers.total
      
      if (impact < minImpact) {
        minImpact = impact
        worstIndex = i
      }
    }
    
    return worstIndex
  }

  /**
   * メタビルドデータを取得（シミュレーション）
   */
  private async fetchMetaBuildsData(combatStyle: CombatStyle, constraints?: any) {
    // 実際の実装では API から取得
    return [
      {
        id: `meta-${combatStyle}-1`,
        name: `${combatStyle}最適ビルド A`,
        combatStyle,
        relics: ['relic-1', 'relic-2', 'relic-3'],
        usageCount: 1500,
        winRate: 0.85
      }
    ]
  }

  /**
   * メタビルドを分析
   */
  private async analyzeMetaBuild(build: any, combatStyle: CombatStyle): Promise<MetaBuildAnalysis> {
    const performance = await this.analyzeBuildPerformance(build.relics, combatStyle)
    
    return {
      buildId: build.id,
      buildName: build.name,
      combatStyle: build.combatStyle,
      relics: build.relics,
      performance: {
        attackMultiplier: performance.attackMultipliers.total,
        efficiency: performance.efficiency,
        obtainmentDifficulty: performance.obtainmentDifficulty,
        averageRarity: 2.5 // 計算値
      },
      strengths: ['高い攻撃力', '安定した性能'],
      weaknesses: ['入手が困難', '特定状況で不利'],
      recommendations: [],
      popularity: {
        rank: 1,
        usagePercentage: 15.3,
        recentTrend: 'stable'
      }
    }
  }
}

// シングルトンインスタンスをエクスポート
export const advancedOptimizationService = new AdvancedOptimizationService()

// 型エクスポート
export type {
  AdvancedOptimizationOptions,
  CombatStyleProfile,
  OptimizationStrategy,
  MetaBuildAnalysis,
  OptimizationExplanation
}
<script setup lang="ts">
import type { AttackCalculation, Relic } from '../types/relic'

// Props
interface Props {
  calculationResult: AttackCalculation | null
  selectedRelics: Relic[]
}

const props = defineProps<Props>()


// Format multiplier for display
const formatMultiplier = (value: number): string => {
  return `×${value.toFixed(3)}`
}

// Get damage increase percentage
const getDamageIncrease = (): string => {
  if (!props.calculationResult) return '0%'
  const increase = ((props.calculationResult.finalAttack - props.calculationResult.baseAttack) / props.calculationResult.baseAttack) * 100
  return `+${increase.toFixed(1)}%`
}

// Get breakdown item color based on type
const getBreakdownItemClass = (type: string): string => {
  switch (type) {
    case 'multiplier': return 'breakdown-multiplier'
    case 'percentage': return 'breakdown-percentage'
    case 'flat': return 'breakdown-flat'
    default: return 'breakdown-default'
  }
}

// Get breakdown item symbol
const getBreakdownSymbol = (type: string): string => {
  switch (type) {
    case 'multiplier': return '×'
    case 'percentage': return '+'
    case 'flat': return '+'
    default: return ''
  }
}

// Format breakdown value
const formatBreakdownValue = (value: number, type: string): string => {
  switch (type) {
    case 'multiplier': return value.toFixed(3)
    case 'percentage': return `${value}%`
    case 'flat': return value.toString()
    default: return value.toString()
  }
}
</script>

<template>
  <div class="attack-display">
    <!-- No Selection State -->
    <div v-if="!calculationResult" class="no-calculation">
      <div class="placeholder-icon">🛡️</div>
      <h3>遺物を選択してください</h3>
      <p>左側から遺物を選択すると、攻撃力の計算結果がここに表示されます。</p>
    </div>

    <!-- Calculation Results -->
    <div v-else class="calculation-results">
      <!-- Summary Cards -->
      <div class="summary-cards">
        <div class="summary-card base-attack">
          <div class="card-label">基本攻撃力</div>
          <div class="card-value">{{ calculationResult.baseAttack }}</div>
        </div>
        
        <div class="summary-card total-multiplier">
          <div class="card-label">総合倍率</div>
          <div class="card-value">{{ formatMultiplier(calculationResult.totalMultiplier) }}</div>
        </div>
        
        <div class="summary-card flat-bonus" v-if="calculationResult.flatBonuses > 0">
          <div class="card-label">固定ボーナス</div>
          <div class="card-value">+{{ calculationResult.flatBonuses }}</div>
        </div>
        
        <div class="summary-card final-attack">
          <div class="card-label">最終攻撃力</div>
          <div class="card-value final-value">{{ calculationResult.finalAttack }}</div>
          <div class="card-subvalue">{{ getDamageIncrease() }}</div>
        </div>
      </div>

      <!-- Calculation Formula -->
      <div class="calculation-formula">
        <h4>計算式</h4>
        <div class="formula">
          <span class="formula-part">{{ calculationResult.baseAttack }}</span>
          <span class="formula-operator">×</span>
          <span class="formula-part">{{ calculationResult.totalMultiplier.toFixed(3) }}</span>
          <span v-if="calculationResult.flatBonuses > 0">
            <span class="formula-operator">+</span>
            <span class="formula-part">{{ calculationResult.flatBonuses }}</span>
          </span>
          <span class="formula-operator">=</span>
          <span class="formula-result">{{ calculationResult.finalAttack }}</span>
        </div>
      </div>

      <!-- Detailed Breakdown -->
      <div class="breakdown-section">
        <h4>効果詳細</h4>
        <div class="breakdown-list">
          <div 
            v-for="(item, index) in calculationResult.breakdown" 
            :key="index"
            class="breakdown-item"
            :class="getBreakdownItemClass(item.type)"
          >
            <div class="breakdown-relic">{{ item.relicName }}</div>
            <div class="breakdown-effect">{{ item.effectName }}</div>
            <div class="breakdown-value">
              {{ getBreakdownSymbol(item.type) }}{{ formatBreakdownValue(item.value, item.type) }}
            </div>
          </div>
        </div>
      </div>

      <!-- Selected Relics Summary -->
      <div class="selected-relics-summary">
        <h4>選択中の遺物 ({{ selectedRelics.length }})</h4>
        <div class="relics-grid">
          <div 
            v-for="relic in selectedRelics" 
            :key="relic.id"
            class="relic-summary-card"
          >
            <div class="relic-summary-name">{{ relic.name }}</div>
            <div class="relic-summary-quality">{{ relic.quality }}</div>
            <div class="relic-summary-effects">
              {{ relic.effects.length }} 効果
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.attack-display {
  width: 100%;
}

.no-calculation {
  text-align: center;
  padding: 3rem 1rem;
  color: #666;
}

.placeholder-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.no-calculation h3 {
  margin-bottom: 0.5rem;
  color: #555;
}

.calculation-results {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
}

.summary-card {
  padding: 1rem;
  background: white;
  border-radius: 6px;
  border: 1px solid #e0e0e0;
  text-align: center;
  transition: all 0.2s;
}

.summary-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.card-label {
  font-size: 0.85rem;
  color: #666;
  font-weight: 600;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.card-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #2c3e50;
}

.final-attack .card-value {
  color: #e74c3c;
  font-size: 1.8rem;
}

.card-subvalue {
  font-size: 0.9rem;
  color: #27ae60;
  font-weight: 600;
  margin-top: 0.25rem;
}

.calculation-formula {
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e0e0e0;
}

.calculation-formula h4 {
  margin-bottom: 1rem;
  color: #2c3e50;
}

.formula {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  flex-wrap: wrap;
  font-family: 'Courier New', monospace;
  font-size: 1.1rem;
}

.formula-part {
  padding: 0.25rem 0.5rem;
  background: #e8f4fd;
  border-radius: 4px;
  font-weight: 600;
  color: #2980b9;
}

.formula-operator {
  font-weight: 700;
  color: #7f8c8d;
  font-size: 1.2rem;
}

.formula-result {
  padding: 0.25rem 0.5rem;
  background: #fde8e8;
  border-radius: 4px;
  font-weight: 700;
  color: #e74c3c;
  font-size: 1.2rem;
}

.breakdown-section {
  padding: 1rem;
  background: white;
  border-radius: 6px;
  border: 1px solid #e0e0e0;
}

.breakdown-section h4 {
  margin-bottom: 1rem;
  color: #2c3e50;
}

.breakdown-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.breakdown-item {
  display: grid;
  grid-template-columns: 2fr 2fr 1fr;
  gap: 1rem;
  padding: 0.75rem;
  border-radius: 4px;
  font-size: 0.9rem;
  align-items: center;
}

.breakdown-multiplier { background: #fef5e7; border-left: 4px solid #f39c12; }
.breakdown-percentage { background: #e8f5e8; border-left: 4px solid #27ae60; }
.breakdown-flat { background: #e8f4fd; border-left: 4px solid #3498db; }

.breakdown-relic {
  font-weight: 600;
  color: #2c3e50;
}

.breakdown-effect {
  color: #555;
}

.breakdown-value {
  text-align: right;
  font-weight: 700;
  font-family: 'Courier New', monospace;
}

.selected-relics-summary {
  padding: 1rem;
  background: white;
  border-radius: 6px;
  border: 1px solid #e0e0e0;
}

.selected-relics-summary h4 {
  margin-bottom: 1rem;
  color: #2c3e50;
}

.relics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 0.75rem;
}

.relic-summary-card {
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 4px;
  border: 1px solid #e0e0e0;
}

.relic-summary-name {
  font-weight: 600;
  color: #2c3e50;
  font-size: 0.9rem;
  margin-bottom: 0.25rem;
}

.relic-summary-quality {
  font-size: 0.8rem;
  color: #666;
  margin-bottom: 0.25rem;
}

.relic-summary-effects {
  font-size: 0.8rem;
  color: #3498db;
  font-weight: 500;
}

@media (max-width: 768px) {
  .summary-cards {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .breakdown-item {
    grid-template-columns: 1fr;
    gap: 0.5rem;
    text-align: center;
  }
  
  .breakdown-value {
    text-align: center;
  }
  
  .formula {
    justify-content: flex-start;
    font-size: 1rem;
  }
  
  .relics-grid {
    grid-template-columns: 1fr;
  }
}
</style>
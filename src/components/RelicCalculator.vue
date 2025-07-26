<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Relic, AttackCalculationResult } from '../types/relic'
import { SAMPLE_RELICS } from '../types/relic'
import RelicSelector from './RelicSelector.vue'
import AttackDisplay from './AttackDisplay.vue'

// Reactive state
const calculatorState = ref({
  selectedRelics: [] as Relic[],
  baseAttackPower: 100,
  characterLevel: 1,
  weaponType: 'straight-sword',
})

// Calculate attack power based on selected relics
const calculateAttackPower = (): AttackCalculationResult => {
  let totalMultiplier = 1.0
  let flatBonuses = 0
  const breakdown: any[] = []

  calculatorState.value.selectedRelics.forEach(relic => {
    relic.effects.forEach(effect => {
      const effectValue = typeof effect.value === 'number' ? effect.value : 0

      if (effect.type === 'attack_percentage') {
        const multiplierValue = effectValue / 100
        totalMultiplier += multiplierValue
        breakdown.push({
          step: breakdown.length + 1,
          description: `${relic.name} - ${effect.name}`,
          operation: 'add',
          value: effectValue,
          runningTotal: totalMultiplier,
          relicName: relic.name,
          effectName: effect.name,
        })
      } else if (effect.type === 'attack_multiplier') {
        totalMultiplier *= 1 + effectValue / 100
        breakdown.push({
          step: breakdown.length + 1,
          description: `${relic.name} - ${effect.name}`,
          operation: 'multiply',
          value: effectValue,
          runningTotal: totalMultiplier,
          relicName: relic.name,
          effectName: effect.name,
        })
      } else if (effect.type === 'attack_flat') {
        flatBonuses += effectValue
        breakdown.push({
          step: breakdown.length + 1,
          description: `${relic.name} - ${effect.name}`,
          operation: 'add',
          value: effectValue,
          runningTotal: flatBonuses,
          relicName: relic.name,
          effectName: effect.name,
        })
      }
    })
  })

  const finalAttackPower = Math.round(
    calculatorState.value.baseAttackPower * totalMultiplier + flatBonuses
  )

  return {
    totalMultiplier,
    baseMultiplier: 1.0,
    stackingBonuses: [],
    conditionalEffects: [],
    warningsAndErrors: [],
    damageByType: {
      physical: finalAttackPower,
      magical: 0,
      fire: 0,
      ice: 0,
      lightning: 0,
      dark: 0,
      holy: 0,
    },
    finalAttackPower,
    breakdown,
  }
}

// Computed property that automatically recalculates when state changes
const calculationResult = computed(() => {
  if (calculatorState.value.selectedRelics.length === 0) {
    return null
  }
  return calculateAttackPower()
})

// Handle relic selection changes
const onRelicSelectionChange = (selectedRelics: Relic[]) => {
  calculatorState.value.selectedRelics = selectedRelics
}
</script>

<template>
  <div class="relic-calculator">
    <div class="calculator-grid">
      <!-- Left Panel: Relic Selection -->
      <div class="relic-panel">
        <h2>遺物選択</h2>
        <RelicSelector
          :available-relics="SAMPLE_RELICS"
          :selected-relics="calculatorState.selectedRelics"
          @selection-change="onRelicSelectionChange"
        />
      </div>

      <!-- Right Panel: Results -->
      <div class="results-panel">
        <h2>計算結果</h2>

        <!-- Base Stats Input -->
        <div class="base-stats">
          <h3>基本ステータス</h3>
          <div class="stat-inputs">
            <div class="input-group">
              <label for="base-attack">基本攻撃力:</label>
              <input
                id="base-attack"
                v-model.number="calculatorState.baseAttackPower"
                type="number"
                min="1"
                max="9999"
              />
            </div>
            <div class="input-group">
              <label for="character-level">キャラクターレベル:</label>
              <input
                id="character-level"
                v-model.number="calculatorState.characterLevel"
                type="number"
                min="1"
                max="150"
              />
            </div>
            <div class="input-group">
              <label for="weapon-type">武器種別:</label>
              <select id="weapon-type" v-model="calculatorState.weaponType">
                <option value="straight-sword">直剣</option>
                <option value="greatsword">大剣</option>
                <option value="curved-sword">曲剣</option>
                <option value="katana">刀</option>
                <option value="dagger">短剣</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Attack Calculation Display -->
        <AttackDisplay
          :calculation-result="calculationResult"
          :selected-relics="calculatorState.selectedRelics"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.relic-calculator {
  width: 100%;
  max-width: 1200px;
}

.calculator-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  align-items: start;
}

.relic-panel,
.results-panel {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.relic-panel h2,
.results-panel h2 {
  color: #2c3e50;
  margin-bottom: 1rem;
  font-size: 1.5rem;
}

.base-stats {
  margin-bottom: 2rem;
  padding: 1rem;
  background: white;
  border-radius: 6px;
  border: 1px solid #e0e0e0;
}

.base-stats h3 {
  color: #34495e;
  margin-bottom: 1rem;
  font-size: 1.2rem;
}

.stat-inputs {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.input-group label {
  font-weight: 600;
  color: #555;
  font-size: 0.9rem;
}

.input-group input,
.input-group select {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.input-group input:focus,
.input-group select:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
}

@media (max-width: 768px) {
  .calculator-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .relic-panel,
  .results-panel {
    padding: 1rem;
  }
}
</style>

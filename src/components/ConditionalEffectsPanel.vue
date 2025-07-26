<template>
  <div class="conditional-effects-panel">
    <BaseCard class="panel-card" padding="lg">
      <template #header>
        <div class="panel-header">
          <h3 class="panel-title">
            <ConditionalIcon />
            Conditional Effects Settings
          </h3>
          <div class="panel-controls">
            <button
              class="control-btn"
              :title="
                allEffectsActive ? 'Disable all effects' : 'Enable all effects'
              "
              @click="toggleAllEffects"
            >
              <ToggleIcon />
              {{ allEffectsActive ? 'Disable All' : 'Enable All' }}
            </button>
            <button
              class="control-btn"
              title="Reset all effects to default"
              @click="resetAllEffects"
            >
              <ResetIcon />
              Reset All
            </button>
          </div>
        </div>
      </template>

      <!-- Empty state -->
      <div v-if="conditionalEffects.length === 0" class="empty-state">
        <div class="empty-icon">⚙️</div>
        <h4>No Conditional Effects</h4>
        <p>Select relics with conditional effects to configure them here.</p>
      </div>

      <!-- Effects list -->
      <div v-else class="effects-list">
        <div
          v-for="effect in conditionalEffects"
          :key="effect.id"
          :class="[
            'effect-item',
            `rarity-${effect.rarity}`,
            {
              active: effect.condition.active,
              disabled: !effect.condition.active,
            },
          ]"
        >
          <!-- Effect header -->
          <div class="effect-header">
            <div class="effect-info">
              <div class="effect-name">{{ effect.name }}</div>
              <div class="effect-source">
                <span class="source-name">{{ effect.relicName }}</span>
                <span :class="['rarity-badge', `rarity-${effect.rarity}`]">
                  {{ formatRarity(effect.rarity) }}
                </span>
              </div>
            </div>

            <div class="effect-toggle">
              <label class="toggle-switch">
                <input
                  type="checkbox"
                  :checked="effect.condition.active"
                  class="toggle-input"
                  @change="toggleEffect(effect.id, $event.target.checked)"
                />
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>

          <!-- Effect description -->
          <div class="effect-description">
            {{ effect.description }}
          </div>

          <!-- Condition configuration -->
          <div v-if="effect.condition.active" class="condition-config">
            <!-- Boolean condition -->
            <div
              v-if="effect.condition.type === 'boolean'"
              class="boolean-condition"
            >
              <div class="condition-label">
                {{ effect.condition.description }}
              </div>
              <div class="boolean-options">
                <label class="boolean-option">
                  <input
                    type="radio"
                    :name="`condition-${effect.id}`"
                    :value="true"
                    :checked="effect.condition.value === true"
                    class="radio-input"
                    @change="updateCondition(effect.id, true)"
                  />
                  <span class="radio-custom"></span>
                  <span class="option-text">{{
                    effect.condition.trueLabel || 'Yes'
                  }}</span>
                </label>
                <label class="boolean-option">
                  <input
                    type="radio"
                    :name="`condition-${effect.id}`"
                    :value="false"
                    :checked="effect.condition.value === false"
                    class="radio-input"
                    @change="updateCondition(effect.id, false)"
                  />
                  <span class="radio-custom"></span>
                  <span class="option-text">{{
                    effect.condition.falseLabel || 'No'
                  }}</span>
                </label>
              </div>
            </div>

            <!-- Numeric condition (slider) -->
            <div
              v-else-if="effect.condition.type === 'numeric'"
              class="numeric-condition"
            >
              <div class="condition-header">
                <span class="condition-label">{{
                  effect.condition.description
                }}</span>
                <span class="current-value">
                  {{
                    formatNumericValue(
                      effect.condition.value,
                      effect.condition.unit
                    )
                  }}
                </span>
              </div>

              <div class="slider-container">
                <input
                  type="range"
                  :min="effect.condition.min"
                  :max="effect.condition.max"
                  :step="effect.condition.step || 1"
                  :value="effect.condition.value"
                  class="condition-slider"
                  @input="
                    updateCondition(effect.id, Number($event.target.value))
                  "
                />
                <div class="slider-labels">
                  <span class="min-label">
                    {{
                      formatNumericValue(
                        effect.condition.min,
                        effect.condition.unit
                      )
                    }}
                  </span>
                  <span class="max-label">
                    {{
                      formatNumericValue(
                        effect.condition.max,
                        effect.condition.unit
                      )
                    }}
                  </span>
                </div>
              </div>

              <!-- Preset values -->
              <div v-if="effect.condition.presets" class="preset-values">
                <div class="preset-label">Quick values:</div>
                <div class="preset-buttons">
                  <button
                    v-for="preset in effect.condition.presets"
                    :key="preset.value"
                    :class="[
                      'preset-btn',
                      { active: effect.condition.value === preset.value },
                    ]"
                    :title="preset.description"
                    @click="updateCondition(effect.id, preset.value)"
                  >
                    {{ preset.label }}
                  </button>
                </div>
              </div>
            </div>

            <!-- Select condition -->
            <div
              v-else-if="effect.condition.type === 'select'"
              class="select-condition"
            >
              <div class="condition-label">
                {{ effect.condition.description }}
              </div>
              <div class="select-container">
                <select
                  :value="effect.condition.value"
                  class="condition-select"
                  @change="updateCondition(effect.id, $event.target.value)"
                >
                  <option value="" disabled>Select an option...</option>
                  <option
                    v-for="option in effect.condition.options"
                    :key="option.value"
                    :value="option.value"
                  >
                    {{ option.label }}
                  </option>
                </select>
              </div>

              <!-- Option description -->
              <div
                v-if="currentOptionDescription(effect)"
                class="option-description"
              >
                {{ currentOptionDescription(effect) }}
              </div>
            </div>

            <!-- Multi-select condition -->
            <div
              v-else-if="effect.condition.type === 'multiselect'"
              class="multiselect-condition"
            >
              <div class="condition-label">
                {{ effect.condition.description }}
              </div>
              <div class="multiselect-options">
                <label
                  v-for="option in effect.condition.options"
                  :key="option.value"
                  class="multiselect-option"
                >
                  <input
                    type="checkbox"
                    :value="option.value"
                    :checked="effect.condition.value.includes(option.value)"
                    class="checkbox-input"
                    @change="
                      toggleMultiselectOption(
                        effect.id,
                        option.value,
                        $event.target.checked
                      )
                    "
                  />
                  <span class="checkbox-custom"></span>
                  <span class="option-text">{{ option.label }}</span>
                  <span v-if="option.multiplier" class="option-multiplier">
                    (×{{ option.multiplier.toFixed(2) }})
                  </span>
                </label>
              </div>
            </div>
          </div>

          <!-- Effect preview -->
          <div class="effect-preview">
            <div class="preview-header">
              <span class="preview-label">Current Effect:</span>
              <span class="preview-impact">
                Impact: {{ getEffectImpact(effect) }}
              </span>
            </div>
            <div class="preview-value">
              <span
                :class="[
                  'value-display',
                  { inactive: !effect.condition.active },
                ]"
              >
                {{ formatEffectValue(effect) }}
              </span>
              <span v-if="effect.condition.active" class="value-suffix">
                {{ getEffectSuffix(effect) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Summary panel -->
      <div v-if="conditionalEffects.length > 0" class="summary-panel">
        <div class="summary-header">
          <h4>Conditional Effects Summary</h4>
        </div>
        <div class="summary-stats">
          <div class="stat-item">
            <span class="stat-label">Total Effects:</span>
            <span class="stat-value">{{ conditionalEffects.length }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Active:</span>
            <span class="stat-value">{{ activeEffectsCount }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Impact:</span>
            <span :class="['stat-value', getTotalImpactClass()]">
              {{ getTotalImpact() }}
            </span>
          </div>
        </div>

        <!-- Quick actions -->
        <div class="quick-actions">
          <button
            class="action-btn combat"
            title="Optimize for combat situations"
            @click="applyPreset('combat')"
          >
            <CombatIcon />
            Combat Setup
          </button>
          <button
            class="action-btn exploration"
            title="Optimize for exploration"
            @click="applyPreset('exploration')"
          >
            <ExplorationIcon />
            Exploration Setup
          </button>
          <button
            class="action-btn balanced"
            title="Balanced setup for general use"
            @click="applyPreset('balanced')"
          >
            <BalancedIcon />
            Balanced Setup
          </button>
        </div>
      </div>
    </BaseCard>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Relic, RelicEffect } from '../types/relic'
import { useToast } from '../composables/useToast'
import BaseCard from './ui/BaseCard.vue'

// Props
interface Props {
  relics?: Relic[]
  autoUpdate?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  relics: () => [],
  autoUpdate: true,
})

// Emits
defineEmits<{
  'condition-change': [relicId: string, effectId: string, value: any]
  'effects-change': [effects: any[]]
}>()

// Composables
const { success, info } = useToast()

// Computed
const conditionalEffects = computed(() => {
  const effects: any[] = []
  props.relics.forEach(relic => {
    relic.effects.forEach(effect => {
      if (effect.isConditional) {
        effects.push({
          ...effect,
          relicId: relic.id,
          relicName: relic.name,
          rarity: relic.rarity,
        })
      }
    })
  })
  return effects
})

const activeEffectsCount = computed(() => {
  return conditionalEffects.value.filter(effect => effect.condition?.active)
    .length
})

const allEffectsActive = computed(() => {
  return (
    conditionalEffects.value.length > 0 &&
    conditionalEffects.value.every(effect => effect.condition?.active)
  )
})

// Methods
const toggleEffect = (effectId: string, active: boolean) => {
  const effect = conditionalEffects.value.find(e => e.id === effectId)
  if (effect && effect.condition) {
    effect.condition.active = active
    emitConditionChange(effect.relicId, effectId, effect.condition)
  }
}

const updateCondition = (effectId: string, value: any) => {
  const effect = conditionalEffects.value.find(e => e.id === effectId)
  if (effect && effect.condition) {
    effect.condition.value = value
    emitConditionChange(effect.relicId, effectId, effect.condition)
  }
}

const toggleMultiselectOption = (
  effectId: string,
  optionValue: any,
  checked: boolean
) => {
  const effect = conditionalEffects.value.find(e => e.id === effectId)
  if (effect && effect.condition) {
    if (!Array.isArray(effect.condition.value)) {
      effect.condition.value = []
    }

    if (checked) {
      if (!effect.condition.value.includes(optionValue)) {
        effect.condition.value.push(optionValue)
      }
    } else {
      const index = effect.condition.value.indexOf(optionValue)
      if (index > -1) {
        effect.condition.value.splice(index, 1)
      }
    }

    emitConditionChange(effect.relicId, effectId, effect.condition)
  }
}

const toggleAllEffects = () => {
  const targetState = !allEffectsActive.value
  conditionalEffects.value.forEach(effect => {
    if (effect.condition) {
      effect.condition.active = targetState
      emitConditionChange(effect.relicId, effect.id, effect.condition)
    }
  })

  info(`All conditional effects ${targetState ? 'enabled' : 'disabled'}`)
}

const resetAllEffects = () => {
  conditionalEffects.value.forEach(effect => {
    if (effect.condition) {
      // Reset to default values
      effect.condition.active = false
      effect.condition.value = getDefaultValue(effect.condition)
      emitConditionChange(effect.relicId, effect.id, effect.condition)
    }
  })

  success('All conditional effects reset to default values')
}

const applyPreset = (presetType: string) => {
  const presets = getPresetValues(presetType)

  conditionalEffects.value.forEach(effect => {
    if (effect.condition && presets[effect.id]) {
      const preset = presets[effect.id]
      effect.condition.active = preset.active
      effect.condition.value = preset.value
      emitConditionChange(effect.relicId, effect.id, effect.condition)
    }
  })

  success(`Applied ${presetType} preset configuration`)
}

// Helper methods
const emitConditionChange = (
  relicId: string,
  effectId: string,
  condition: any
) => {
  if (props.autoUpdate) {
    // Emit individual change
    // emit('condition-change', relicId, effectId, condition)
    // Emit all effects change
    // emit('effects-change', conditionalEffects.value)
  }
}

const formatRarity = (rarity: string): string => {
  return rarity.charAt(0).toUpperCase() + rarity.slice(1)
}

const formatNumericValue = (value: number, unit?: string): string => {
  if (unit) {
    return `${value}${unit}`
  }
  return value.toString()
}

const formatEffectValue = (effect: any): string => {
  if (!effect.condition?.active) {
    return 'Inactive'
  }

  switch (effect.type) {
    case 'attack_percentage':
      return `+${calculateEffectValue(effect)}%`
    case 'attack_multiplier':
      return `×${calculateEffectValue(effect).toFixed(2)}`
    case 'critical_multiplier':
      return `Crit ×${calculateEffectValue(effect).toFixed(2)}`
    default:
      return calculateEffectValue(effect).toString()
  }
}

const calculateEffectValue = (effect: any): number => {
  if (!effect.condition?.active) return 0

  let value = effect.value

  switch (effect.condition.type) {
    case 'boolean':
      value = effect.condition.value ? effect.value : 0
      break
    case 'numeric':
      const ratio = effect.condition.value / effect.condition.max
      value = effect.value * ratio
      break
    case 'select':
      const option = effect.condition.options?.find(
        (o: any) => o.value === effect.condition.value
      )
      value = option ? effect.value * (option.multiplier || 1) : 0
      break
    case 'multiselect':
      const totalMultiplier = effect.condition.value.reduce(
        (total: number, selectedValue: any) => {
          const option = effect.condition.options?.find(
            (o: any) => o.value === selectedValue
          )
          return total + (option?.multiplier || 1)
        },
        0
      )
      value = effect.value * totalMultiplier
      break
  }

  return value
}

const getEffectSuffix = (effect: any): string => {
  switch (effect.type) {
    case 'attack_percentage':
      return 'Attack Bonus'
    case 'attack_multiplier':
      return 'Attack Multiplier'
    case 'critical_multiplier':
      return 'Critical Multiplier'
    default:
      return ''
  }
}

const getEffectImpact = (effect: any): string => {
  const value = calculateEffectValue(effect)

  if (!effect.condition?.active) return 'None'

  if (value >= effect.value * 0.8) return 'High'
  if (value >= effect.value * 0.5) return 'Medium'
  if (value > 0) return 'Low'
  return 'None'
}

const getTotalImpact = (): string => {
  const totalValue = conditionalEffects.value.reduce((sum, effect) => {
    return sum + calculateEffectValue(effect)
  }, 0)

  if (totalValue >= 100) return 'Very High'
  if (totalValue >= 50) return 'High'
  if (totalValue >= 20) return 'Medium'
  if (totalValue > 0) return 'Low'
  return 'None'
}

const getTotalImpactClass = (): string => {
  const impact = getTotalImpact()
  return impact.toLowerCase().replace(/\s+/g, '-')
}

const currentOptionDescription = (effect: any): string | null => {
  if (effect.condition.type !== 'select') return null

  const option = effect.condition.options?.find(
    (o: any) => o.value === effect.condition.value
  )
  return option?.description || null
}

const getDefaultValue = (condition: any): any => {
  switch (condition.type) {
    case 'boolean':
      return false
    case 'numeric':
      return condition.min || 0
    case 'select':
      return condition.options?.[0]?.value || null
    case 'multiselect':
      return []
    default:
      return null
  }
}

const getPresetValues = (presetType: string): Record<string, any> => {
  // This would return preset configurations for different scenarios
  // For now, return empty object
  return {}
}

// Icon components
const ConditionalIcon = {
  template: `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
    </svg>
  `,
}

const ToggleIcon = {
  template: `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17 7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h10c2.76 0 5-2.24 5-5s-2.24-5-5-5zM7 15c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z"/>
    </svg>
  `,
}

const ResetIcon = {
  template: `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/>
    </svg>
  `,
}

const CombatIcon = {
  template: `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6.92 5L5 6.92l3.22 3.22c-.44.87-.66 1.84-.66 2.86 0 3.31 2.69 6 6 6s6-2.69 6-6-2.69-6-6-6c-1.02 0-1.99.22-2.86.66L6.92 5zM15 11c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2z"/>
    </svg>
  `,
}

const ExplorationIcon = {
  template: `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
    </svg>
  `,
}

const BalancedIcon = {
  template: `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
    </svg>
  `,
}
</script>

<style scoped>
.conditional-effects-panel {
  width: 100%;
}

.panel-card {
  border: 1px solid #e5e7eb;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
}

.panel-controls {
  display: flex;
  gap: 0.5rem;
}

.control-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  color: #6b7280;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s;
}

.control-btn:hover {
  background: #f9fafb;
  color: #374151;
  transform: translateY(-1px);
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: #6b7280;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.empty-state h4 {
  margin: 0 0 0.5rem 0;
  color: #374151;
}

.empty-state p {
  margin: 0;
}

/* Effects List */
.effects-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.effect-item {
  padding: 1.5rem;
  border-radius: 12px;
  border: 2px solid transparent;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.3s;
}

.effect-item.active {
  border-color: #10b981;
  background: linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%);
}

.effect-item.disabled {
  opacity: 0.6;
  background: #f9fafb;
}

/* Rarity-specific styling */
.effect-item.rarity-common {
  border-left: 4px solid #9ca3af;
}
.effect-item.rarity-rare {
  border-left: 4px solid #3b82f6;
}
.effect-item.rarity-epic {
  border-left: 4px solid #8b5cf6;
}
.effect-item.rarity-legendary {
  border-left: 4px solid #f59e0b;
}

/* Effect Header */
.effect-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1rem;
}

.effect-info {
  flex: 1;
}

.effect-name {
  font-size: 1.1rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 0.5rem;
}

.effect-source {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.source-name {
  font-size: 0.9rem;
  color: #6b7280;
}

.rarity-badge {
  padding: 0.125rem 0.5rem;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
}

.rarity-badge.rarity-common {
  background: #9ca3af;
  color: white;
}
.rarity-badge.rarity-rare {
  background: #3b82f6;
  color: white;
}
.rarity-badge.rarity-epic {
  background: #8b5cf6;
  color: white;
}
.rarity-badge.rarity-legendary {
  background: #f59e0b;
  color: white;
}

/* Toggle Switch */
.toggle-switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 24px;
}

.toggle-input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: 0.3s;
  border-radius: 24px;
}

.toggle-slider:before {
  position: absolute;
  content: '';
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.3s;
  border-radius: 50%;
}

.toggle-input:checked + .toggle-slider {
  background-color: #10b981;
}

.toggle-input:checked + .toggle-slider:before {
  transform: translateX(26px);
}

/* Effect Description */
.effect-description {
  font-size: 0.9rem;
  color: #6b7280;
  line-height: 1.5;
  margin-bottom: 1rem;
  padding: 0.75rem;
  background: #f9fafb;
  border-radius: 6px;
  border-left: 3px solid #e5e7eb;
}

/* Condition Configuration */
.condition-config {
  margin-bottom: 1rem;
  padding: 1rem;
  background: #fafafa;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

/* Boolean Condition */
.boolean-condition {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.condition-label {
  font-size: 0.9rem;
  font-weight: 500;
  color: #374151;
}

.boolean-options {
  display: flex;
  gap: 1rem;
}

.boolean-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.9rem;
}

.radio-input {
  display: none;
}

.radio-custom {
  width: 18px;
  height: 18px;
  border: 2px solid #d1d5db;
  border-radius: 50%;
  position: relative;
  transition: all 0.2s;
}

.radio-input:checked + .radio-custom {
  border-color: #3b82f6;
  background: #3b82f6;
}

.radio-input:checked + .radio-custom::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 8px;
  height: 8px;
  background: white;
  border-radius: 50%;
  transform: translate(-50%, -50%);
}

/* Numeric Condition */
.numeric-condition {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.condition-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.current-value {
  font-weight: 600;
  color: #3b82f6;
  font-size: 0.9rem;
}

.slider-container {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.condition-slider {
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: #e5e7eb;
  outline: none;
  -webkit-appearance: none;
}

.condition-slider::-webkit-slider-thumb {
  appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #3b82f6;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.condition-slider::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #3b82f6;
  cursor: pointer;
  border: none;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.slider-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: #6b7280;
}

/* Preset Values */
.preset-values {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.preset-label {
  font-size: 0.8rem;
  color: #6b7280;
}

.preset-buttons {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.preset-btn {
  padding: 0.375rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 16px;
  background: white;
  color: #6b7280;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s;
}

.preset-btn:hover {
  background: #f9fafb;
  color: #374151;
}

.preset-btn.active {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

/* Select Condition */
.select-condition {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.select-container {
  position: relative;
}

.condition-select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  font-size: 0.9rem;
  cursor: pointer;
}

.option-description {
  font-size: 0.8rem;
  color: #6b7280;
  font-style: italic;
  padding: 0.5rem;
  background: #f0f9ff;
  border-radius: 4px;
}

/* Multiselect Condition */
.multiselect-condition {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.multiselect-options {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.multiselect-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.9rem;
  padding: 0.5rem;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.multiselect-option:hover {
  background: #f9fafb;
}

.checkbox-input {
  display: none;
}

.checkbox-custom {
  width: 16px;
  height: 16px;
  border: 2px solid #d1d5db;
  border-radius: 3px;
  position: relative;
  transition: all 0.2s;
}

.checkbox-input:checked + .checkbox-custom {
  background: #3b82f6;
  border-color: #3b82f6;
}

.checkbox-input:checked + .checkbox-custom::after {
  content: '✓';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-size: 10px;
  font-weight: bold;
}

.option-multiplier {
  font-size: 0.8rem;
  color: #059669;
  font-weight: 500;
}

/* Effect Preview */
.effect-preview {
  padding: 1rem;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border-radius: 8px;
  border: 1px solid #bae6fd;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.preview-label {
  font-size: 0.8rem;
  font-weight: 500;
  color: #0369a1;
}

.preview-impact {
  font-size: 0.8rem;
  color: #6b7280;
}

.preview-value {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
}

.value-display {
  font-size: 1.25rem;
  font-weight: 700;
  color: #0ea5e9;
}

.value-display.inactive {
  color: #9ca3af;
}

.value-suffix {
  font-size: 0.9rem;
  color: #0369a1;
  font-weight: 500;
}

/* Summary Panel */
.summary-panel {
  margin-top: 2rem;
  padding: 1.5rem;
  background: linear-gradient(135deg, #fefce8 0%, #fef3c7 100%);
  border-radius: 12px;
  border: 1px solid #fbbf24;
}

.summary-header h4 {
  margin: 0 0 1rem 0;
  font-size: 1.1rem;
  color: #92400e;
}

.summary-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  text-align: center;
}

.stat-label {
  font-size: 0.8rem;
  color: #92400e;
}

.stat-value {
  font-size: 1.1rem;
  font-weight: 600;
  color: #b45309;
}

.stat-value.very-high {
  color: #dc2626;
}
.stat-value.high {
  color: #ea580c;
}
.stat-value.medium {
  color: #d97706;
}
.stat-value.low {
  color: #65a30d;
}
.stat-value.none {
  color: #6b7280;
}

/* Quick Actions */
.quick-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  color: white;
}

.action-btn.combat {
  background: #dc2626;
}

.action-btn.combat:hover {
  background: #b91c1c;
  transform: translateY(-1px);
}

.action-btn.exploration {
  background: #059669;
}

.action-btn.exploration:hover {
  background: #047857;
  transform: translateY(-1px);
}

.action-btn.balanced {
  background: #3b82f6;
}

.action-btn.balanced:hover {
  background: #2563eb;
  transform: translateY(-1px);
}

/* Responsive */
@media (max-width: 768px) {
  .panel-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .panel-controls {
    align-self: stretch;
  }

  .effect-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .boolean-options {
    flex-direction: column;
    gap: 0.75rem;
  }

  .preset-buttons {
    gap: 0.25rem;
  }

  .summary-stats {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }

  .quick-actions {
    flex-direction: column;
  }

  .action-btn {
    justify-content: center;
  }
}
</style>

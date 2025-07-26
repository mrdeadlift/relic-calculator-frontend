<template>
  <div class="attack-multiplier-display">
    <!-- Main Result Card -->
    <BaseCard class="result-card" variant="elevated" padding="lg">
      <template #header>
        <div class="result-header">
          <h3 class="result-title">攻撃倍率計算結果</h3>
          <div class="result-actions">
            <BaseButton
              v-if="canRecalculate"
              variant="outline"
              size="sm"
              :loading="loading"
              @click="handleRecalculate"
            >
              再計算
            </BaseButton>
            <BaseButton
              v-if="result"
              variant="ghost"
              size="sm"
              @click="handleExport"
            >
              エクスポート
            </BaseButton>
          </div>
        </div>
      </template>

      <!-- Loading State -->
      <div v-if="loading" class="loading-display">
        <div class="spinner-large"></div>
        <p>攻撃倍率を計算中...</p>
        <div v-if="progress" class="progress-bar">
          <div class="progress-fill" :style="{ width: `${progress}%` }"></div>
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="error-display">
        <div class="error-icon">⚠️</div>
        <h4>計算エラー</h4>
        <p class="error-message">{{ error }}</p>
        <BaseButton variant="primary" size="sm" @click="handleRecalculate">
          再試行
        </BaseButton>
      </div>

      <!-- Results Display -->
      <div v-else-if="result" class="results-display">
        <!-- Main Multiplier -->
        <div class="main-result">
          <div class="multiplier-value">
            <span class="multiplier-number">{{ formattedMultiplier }}</span>
            <span class="multiplier-unit">倍</span>
          </div>
          <div class="multiplier-context">
            <span class="context-label">{{
              result.context || '通常攻撃'
            }}</span>
            <span v-if="result.bonusType" class="bonus-type">{{
              result.bonusType
            }}</span>
          </div>
        </div>

        <!-- Calculation Breakdown -->
        <div v-if="showBreakdown" class="calculation-breakdown">
          <h4 class="breakdown-title">
            <BaseButton
              variant="ghost"
              size="sm"
              class="breakdown-toggle"
              @click="toggleBreakdown"
            >
              計算内訳 {{ breakdownExpanded ? '▼' : '▶' }}
            </BaseButton>
          </h4>

          <Transition name="breakdown">
            <div v-if="breakdownExpanded" class="breakdown-content">
              <!-- Base Stats -->
              <div class="breakdown-section">
                <h5>基本ステータス</h5>
                <div class="stat-grid">
                  <div class="stat-item">
                    <span class="stat-label">基礎攻撃力:</span>
                    <span class="stat-value">{{
                      result.baseStats?.attack || 0
                    }}</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-label">武器攻撃力:</span>
                    <span class="stat-value">{{
                      result.baseStats?.weaponAttack || 0
                    }}</span>
                  </div>
                </div>
              </div>

              <!-- Effect Breakdown -->
              <div v-if="result.effectBreakdown" class="breakdown-section">
                <h5>効果詳細</h5>
                <div class="effects-list">
                  <div
                    v-for="effect in result.effectBreakdown"
                    :key="effect.id"
                    class="effect-breakdown-item"
                  >
                    <div class="effect-info">
                      <strong class="effect-name">{{ effect.name }}</strong>
                      <span class="effect-source">{{ effect.sourceName }}</span>
                    </div>
                    <div class="effect-calculation">
                      <span class="effect-type">{{
                        getEffectTypeLabel(effect.type)
                      }}</span>
                      <span class="effect-value">{{
                        formatEffectValue(effect)
                      }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Final Calculation -->
              <div class="breakdown-section final-calculation">
                <h5>最終計算式</h5>
                <div class="calculation-formula">
                  <code>{{
                    result.calculationFormula || '計算式が利用できません'
                  }}</code>
                </div>
              </div>
            </div>
          </Transition>
        </div>

        <!-- Performance Stats -->
        <div v-if="result.performance" class="performance-stats">
          <div class="stat-item">
            <span class="stat-label">計算時間:</span>
            <span class="stat-value"
              >{{ result.performance.executionTime }}ms</span
            >
          </div>
          <div class="stat-item">
            <span class="stat-label">処理した効果数:</span>
            <span class="stat-value"
              >{{ result.performance.effectsProcessed }}個</span
            >
          </div>
        </div>
      </div>

      <!-- No Results -->
      <div v-else class="no-results">
        <div class="no-results-icon">🎯</div>
        <h4>計算結果待ち</h4>
        <p>遺物を選択して攻撃倍率を計算してください。</p>
      </div>
    </BaseCard>

    <!-- Comparison Display -->
    <BaseCard
      v-if="showComparison && comparisonResults.length > 0"
      class="comparison-card"
      variant="filled"
      padding="md"
    >
      <template #header>
        <h4>比較結果</h4>
      </template>

      <div class="comparison-list">
        <div
          v-for="comparison in comparisonResults"
          :key="comparison.id"
          class="comparison-item"
        >
          <div class="comparison-info">
            <span class="comparison-name">{{ comparison.name }}</span>
            <span class="comparison-context">{{ comparison.context }}</span>
          </div>
          <div class="comparison-value">
            <span class="multiplier"
              >{{ formatMultiplier(comparison.multiplier) }}倍</span
            >
            <span
              :class="['difference', getDifferenceClass(comparison.difference)]"
            >
              {{ formatDifference(comparison.difference) }}
            </span>
          </div>
        </div>
      </div>
    </BaseCard>

    <!-- Export Modal -->
    <BaseModal
      v-model:show="showExportModal"
      title="結果エクスポート"
      size="md"
    >
      <div class="export-options">
        <h5>エクスポート形式</h5>
        <div class="export-formats">
          <BaseButton
            variant="outline"
            size="sm"
            full-width
            @click="exportAs('json')"
          >
            JSON形式
          </BaseButton>
          <BaseButton
            variant="outline"
            size="sm"
            full-width
            @click="exportAs('csv')"
          >
            CSV形式
          </BaseButton>
          <BaseButton
            variant="outline"
            size="sm"
            full-width
            @click="exportAs('text')"
          >
            テキスト形式
          </BaseButton>
        </div>
      </div>

      <template #footer>
        <BaseButton variant="ghost" @click="showExportModal = false">
          キャンセル
        </BaseButton>
      </template>
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type {
  AttackMultiplierResult,
  ComparisonResult,
} from '../types/calculation'
import BaseCard from './ui/BaseCard.vue'
import BaseButton from './ui/BaseButton.vue'
import BaseModal from './ui/BaseModal.vue'

// Props
interface Props {
  result?: AttackMultiplierResult | null
  loading?: boolean
  error?: string | null
  showBreakdown?: boolean
  showComparison?: boolean
  comparisonResults?: ComparisonResult[]
  progress?: number
  canRecalculate?: boolean
}

// Emits
interface Emits {
  (_e: 'recalculate'): void
  (_e: 'export', _format: string, _data: any): void
  (_e: 'compare', _resultId: string): void
}

const props = withDefaults(defineProps<Props>(), {
  result: null,
  loading: false,
  error: null,
  showBreakdown: true,
  showComparison: false,
  comparisonResults: () => [],
  progress: 0,
  canRecalculate: true,
})

const emit = defineEmits<Emits>()

// Local state
const breakdownExpanded = ref(false)
const showExportModal = ref(false)

// Computed properties
const formattedMultiplier = computed(() => {
  if (!props.result?.finalMultiplier) return '0.00'
  return props.result.finalMultiplier.toFixed(2)
})

// Methods
const toggleBreakdown = () => {
  breakdownExpanded.value = !breakdownExpanded.value
}

const handleRecalculate = () => {
  emit('recalculate')
}

const handleExport = () => {
  showExportModal.value = true
}

const exportAs = (format: string) => {
  if (!props.result) return

  let exportData: any

  switch (format) {
    case 'json':
      exportData = JSON.stringify(props.result, null, 2)
      break
    case 'csv':
      exportData = convertToCSV(props.result)
      break
    case 'text':
      exportData = convertToText(props.result)
      break
    default:
      return
  }

  emit('export', format, exportData)
  showExportModal.value = false
}

const convertToCSV = (result: AttackMultiplierResult): string => {
  const headers = ['項目', '値']
  const rows = [
    ['攻撃倍率', result.finalMultiplier.toString()],
    ['コンテキスト', result.context || ''],
    ['計算時間', `${result.performance?.executionTime || 0}ms`],
    ['処理した効果数', `${result.performance?.effectsProcessed || 0}`],
  ]

  return [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
}

const convertToText = (result: AttackMultiplierResult): string => {
  let text = `攻撃倍率計算結果\n`
  text += `==================\n`
  text += `最終倍率: ${result.finalMultiplier.toFixed(2)}倍\n`
  text += `コンテキスト: ${result.context || '通常攻撃'}\n`

  if (result.performance) {
    text += `\n性能統計:\n`
    text += `- 計算時間: ${result.performance.executionTime}ms\n`
    text += `- 処理した効果数: ${result.performance.effectsProcessed}個\n`
  }

  if (result.effectBreakdown) {
    text += `\n効果詳細:\n`
    result.effectBreakdown.forEach(effect => {
      text += `- ${effect.name} (${effect.sourceName}): ${formatEffectValue(effect)}\n`
    })
  }

  return text
}

const formatMultiplier = (value: number): string => {
  return value.toFixed(2)
}

const formatDifference = (difference: number): string => {
  const sign = difference >= 0 ? '+' : ''
  return `${sign}${difference.toFixed(2)}`
}

const getDifferenceClass = (difference: number): string => {
  if (difference > 0) return 'positive'
  if (difference < 0) return 'negative'
  return 'neutral'
}

const getEffectTypeLabel = (type: string): string => {
  switch (type) {
    case 'additive':
      return '加算'
    case 'multiplicative':
      return '乗算'
    case 'overwrite':
      return '上書き'
    case 'unique':
      return '固有'
    default:
      return type
  }
}

const formatEffectValue = (effect: any): string => {
  if (effect.type === 'multiplicative') {
    return `×${effect.value.toFixed(2)}`
  } else if (effect.type === 'additive') {
    return `+${effect.value.toFixed(1)}%`
  } else {
    return `${effect.value}`
  }
}

// Watch for result changes to auto-expand breakdown
watch(
  () => props.result,
  newResult => {
    if (newResult && props.showBreakdown) {
      breakdownExpanded.value = true
    }
  },
  { immediate: true }
)
</script>

<style scoped>
.attack-multiplier-display {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Result Card */
.result-card {
  min-height: 300px;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.result-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
}

.result-actions {
  display: flex;
  gap: 0.5rem;
}

/* Loading State */
.loading-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  text-align: center;
}

.spinner-large {
  width: 3rem;
  height: 3rem;
  border: 3px solid #e5e7eb;
  border-top: 3px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

.progress-bar {
  width: 100%;
  max-width: 300px;
  height: 8px;
  background-color: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
  margin-top: 1rem;
}

.progress-fill {
  height: 100%;
  background-color: #3b82f6;
  transition: width 0.3s ease-in-out;
}

/* Error State */
.error-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 3rem 1rem;
  text-align: center;
}

.error-icon {
  font-size: 3rem;
}

.error-message {
  color: #ef4444;
  margin: 0;
}

/* Results Display */
.results-display {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.main-result {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 2rem;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border-radius: 1rem;
  text-align: center;
}

.multiplier-value {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
}

.multiplier-number {
  font-size: 3rem;
  font-weight: 700;
  color: #0ea5e9;
  line-height: 1;
}

.multiplier-unit {
  font-size: 1.5rem;
  font-weight: 600;
  color: #0284c7;
}

.multiplier-context {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.context-label {
  font-size: 1rem;
  color: #374151;
  font-weight: 500;
}

.bonus-type {
  font-size: 0.875rem;
  color: #6b7280;
  background: #f3f4f6;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
}

/* Calculation Breakdown */
.calculation-breakdown {
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  overflow: hidden;
}

.breakdown-title {
  margin: 0;
  padding: 0;
}

.breakdown-toggle {
  width: 100%;
  justify-content: flex-start;
  padding: 1rem;
  font-weight: 600;
  border-radius: 0;
}

.breakdown-content {
  padding: 1rem;
  border-top: 1px solid #e5e7eb;
}

.breakdown-section {
  margin-bottom: 1.5rem;
}

.breakdown-section:last-child {
  margin-bottom: 0;
}

.breakdown-section h5 {
  margin: 0 0 0.75rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.75rem;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0.75rem;
  background: #f9fafb;
  border-radius: 0.375rem;
}

.stat-label {
  font-size: 0.875rem;
  color: #6b7280;
}

.stat-value {
  font-weight: 600;
  color: #111827;
}

.effects-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.effect-breakdown-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: #f9fafb;
  border-radius: 0.5rem;
  border-left: 3px solid #3b82f6;
}

.effect-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.effect-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: #111827;
}

.effect-source {
  font-size: 0.75rem;
  color: #6b7280;
}

.effect-calculation {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.25rem;
}

.effect-type {
  font-size: 0.75rem;
  color: #6b7280;
  background: #e5e7eb;
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
}

.effect-value {
  font-weight: 600;
  color: #059669;
}

.final-calculation {
  background: #fef3c7;
  padding: 1rem;
  border-radius: 0.5rem;
}

.calculation-formula {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  background: #1f2937;
  color: #f9fafb;
  padding: 1rem;
  border-radius: 0.375rem;
  overflow-x: auto;
}

/* Performance Stats */
.performance-stats {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
}

/* No Results */
.no-results {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 3rem 1rem;
  text-align: center;
}

.no-results-icon {
  font-size: 3rem;
}

/* Comparison Card */
.comparison-card {
  margin-top: 0;
}

.comparison-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.comparison-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: white;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
}

.comparison-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.comparison-name {
  font-weight: 500;
  color: #111827;
}

.comparison-context {
  font-size: 0.75rem;
  color: #6b7280;
}

.comparison-value {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.25rem;
}

.comparison-value .multiplier {
  font-weight: 600;
  color: #111827;
}

.difference {
  font-size: 0.75rem;
  font-weight: 500;
}

.difference.positive {
  color: #059669;
}

.difference.negative {
  color: #dc2626;
}

.difference.neutral {
  color: #6b7280;
}

/* Export Modal */
.export-options {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.export-formats {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

/* Transitions */
.breakdown-enter-active,
.breakdown-leave-active {
  transition: all 0.3s ease-in-out;
}

.breakdown-enter-from,
.breakdown-leave-to {
  opacity: 0;
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
}

.breakdown-enter-to,
.breakdown-leave-from {
  opacity: 1;
  max-height: 1000px;
}

/* Animations */
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Responsive Design */
@media (max-width: 768px) {
  .result-header {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }

  .result-actions {
    align-self: stretch;
  }

  .main-result {
    padding: 1.5rem 1rem;
  }

  .multiplier-number {
    font-size: 2.5rem;
  }

  .stat-grid {
    grid-template-columns: 1fr;
  }

  .effect-breakdown-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .effect-calculation {
    align-items: flex-start;
  }

  .comparison-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .comparison-value {
    align-items: flex-start;
  }

  .performance-stats {
    flex-direction: column;
    gap: 0.5rem;
  }
}

/* Dark Mode Support */
@media (prefers-color-scheme: dark) {
  .result-title {
    color: #f9fafb;
  }

  .main-result {
    background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
  }

  .context-label {
    color: #d1d5db;
  }

  .bonus-type {
    background: #374151;
    color: #d1d5db;
  }

  .breakdown-content {
    border-color: #374151;
  }

  .breakdown-section h5 {
    color: #d1d5db;
  }

  .stat-item,
  .effect-breakdown-item {
    background: #374151;
  }

  .effect-name {
    color: #f9fafb;
  }

  .stat-value {
    color: #f9fafb;
  }

  .final-calculation {
    background: #451a03;
  }

  .performance-stats {
    background: #374151;
    border-color: #4b5563;
  }

  .comparison-item {
    background: #1f2937;
    border-color: #374151;
  }

  .comparison-name {
    color: #f9fafb;
  }
}
</style>

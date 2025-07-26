<template>
  <div class="calculation-steps-display">
    <BaseCard class="steps-card" padding="lg">
      <template #header>
        <div class="steps-header">
          <h3 class="steps-title">
            <StepsIcon />
            Calculation Steps
          </h3>
          <div class="steps-controls">
            <button
              :class="['control-btn', { active: animationEnabled }]"
              title="Toggle step animation"
              @click="toggleAnimation"
            >
              <AnimationIcon />
              {{ animationEnabled ? 'Disable' : 'Enable' }} Animation
            </button>
            <button
              class="control-btn"
              title="Reset to first step"
              :disabled="currentStep === 0"
              @click="resetSteps"
            >
              <ResetIcon />
              Reset
            </button>
          </div>
        </div>
      </template>

      <!-- Progress indicator -->
      <div v-if="steps.length > 0" class="progress-section">
        <div class="progress-bar">
          <div
            class="progress-fill"
            :style="{ width: `${progressPercentage}%` }"
          ></div>
        </div>
        <div class="progress-text">
          Step {{ currentStep + 1 }} of {{ steps.length }}
          <span v-if="currentStepData" class="current-step-name">
            - {{ currentStepData.title }}
          </span>
        </div>
      </div>

      <!-- Steps display -->
      <div v-if="steps.length > 0" class="steps-container">
        <div
          v-for="(step, index) in steps"
          :key="step.id"
          :class="[
            'calculation-step',
            `step-${step.type}`,
            {
              active: index === currentStep,
              completed: index < currentStep,
              pending: index > currentStep,
              animated: animationEnabled,
            },
          ]"
        >
          <!-- Step number and status -->
          <div class="step-indicator">
            <div class="step-number">
              <span v-if="index < currentStep" class="check-icon">✓</span>
              <span v-else-if="index === currentStep" class="current-icon">{{
                index + 1
              }}</span>
              <span v-else class="pending-icon">{{ index + 1 }}</span>
            </div>
            <div v-if="index < steps.length - 1" class="step-connector"></div>
          </div>

          <!-- Step content -->
          <div class="step-content">
            <div class="step-header">
              <h4 class="step-title">{{ step.title }}</h4>
              <div class="step-meta">
                <span class="step-type">{{ getStepTypeLabel(step.type) }}</span>
                <span v-if="step.description" class="step-description">{{
                  step.description
                }}</span>
              </div>
            </div>

            <!-- Step formula -->
            <div v-if="step.formula" class="step-formula">
              <div class="formula-label">Formula:</div>
              <div class="formula-content">
                <code>{{ step.formula }}</code>
              </div>
            </div>

            <!-- Step value -->
            <div class="step-value">
              <span class="value-label">Result:</span>
              <span :class="['value-number', `type-${step.type}`]">
                {{ formatStepValue(step) }}
              </span>
            </div>

            <!-- Effects contributing to this step -->
            <div
              v-if="step.effects && step.effects.length > 0"
              class="step-effects"
            >
              <div class="effects-header">
                <span class="effects-label">Contributing Effects:</span>
                <button
                  class="effects-toggle"
                  @click="toggleEffectsVisible(step.id)"
                >
                  {{ effectsVisible[step.id] ? 'Hide' : 'Show' }} ({{
                    step.effects.length
                  }})
                </button>
              </div>

              <Transition name="effects">
                <div v-if="effectsVisible[step.id]" class="effects-list">
                  <div
                    v-for="effect in step.effects"
                    :key="effect.id"
                    class="effect-item"
                  >
                    <div class="effect-info">
                      <div class="effect-name">{{ effect.name }}</div>
                      <div class="effect-source">
                        from {{ effect.relicName }}
                      </div>
                    </div>
                    <div class="effect-contribution">
                      <div class="effect-value">
                        {{ formatEffectContribution(effect, step.type) }}
                      </div>
                      <div
                        v-if="effect.multiplier && effect.multiplier !== 1"
                        class="effect-multiplier"
                      >
                        × {{ effect.multiplier.toFixed(2) }}
                      </div>
                    </div>
                  </div>
                </div>
              </Transition>
            </div>

            <!-- Step calculation detail -->
            <div v-if="index <= currentStep" class="step-calculation">
              <div class="calculation-detail">
                <div class="calculation-label">Calculation:</div>
                <div class="calculation-process">
                  {{ generateCalculationProcess(step, index) }}
                </div>
              </div>

              <!-- Running total -->
              <div v-if="index === currentStep" class="running-total">
                <div class="total-label">Running Total:</div>
                <div class="total-value">{{ formatRunningTotal(index) }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Final result -->
        <div v-if="currentStep >= steps.length - 1" class="final-result">
          <div class="result-header">
            <h4>Final Attack Multiplier</h4>
          </div>
          <div class="result-value">
            <span class="final-multiplier">{{ formatFinalMultiplier() }}</span>
            <span class="multiplier-unit">×</span>
          </div>
          <div v-if="finalFormula" class="result-formula">
            <code>{{ finalFormula }}</code>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div v-else class="empty-steps">
        <div class="empty-icon">📊</div>
        <h4>No Calculation Steps</h4>
        <p>Select relics to see detailed calculation steps.</p>
      </div>

      <!-- Navigation controls -->
      <div v-if="steps.length > 0" class="navigation-controls">
        <button
          :disabled="currentStep === 0"
          class="nav-btn prev-btn"
          @click="previousStep"
        >
          <PrevIcon />
          Previous
        </button>

        <div class="step-indicators">
          <button
            v-for="(step, index) in steps"
            :key="step.id"
            :class="[
              'step-dot',
              {
                active: index === currentStep,
                completed: index < currentStep,
              },
            ]"
            :title="`Go to step ${index + 1}: ${step.title}`"
            @click="goToStep(index)"
          ></button>
        </div>

        <button
          :disabled="currentStep >= steps.length - 1"
          class="nav-btn next-btn"
          @click="nextStep"
        >
          Next
          <NextIcon />
        </button>
      </div>
    </BaseCard>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import type {
  CalculationStep,
  AttackMultiplierResult,
} from '../types/calculation'
// import { useCalculation } from '../composables/useCalculation'
import BaseCard from './ui/BaseCard.vue'

// Props
interface Props {
  steps?: CalculationStep[]
  result?: AttackMultiplierResult | null
  autoPlay?: boolean
  animationSpeed?: number
  showEffectsExpanded?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  steps: () => [],
  result: null,
  autoPlay: false,
  animationSpeed: 1000,
  showEffectsExpanded: false,
})

// Emits
defineEmits<{
  'step-change': [stepIndex: number, step: CalculationStep]
  'calculation-complete': []
}>()

// State
const currentStep = ref(0)
const animationEnabled = ref(true)
const effectsVisible = ref<Record<string, boolean>>({})
const autoPlayActive = ref(false)
const autoPlayTimer = ref<number | null>(null)

// Computed
const progressPercentage = computed(() => {
  if (props.steps.length === 0) return 0
  return ((currentStep.value + 1) / props.steps.length) * 100
})

const currentStepData = computed(() => {
  return props.steps[currentStep.value] || null
})

const finalFormula = computed(() => {
  if (!props.result?.calculationFormula) return null
  return props.result.calculationFormula
})

// Methods
const toggleAnimation = () => {
  animationEnabled.value = !animationEnabled.value
}

const resetSteps = () => {
  currentStep.value = 0
  stopAutoPlay()
}

const previousStep = () => {
  if (currentStep.value > 0) {
    currentStep.value--
    stopAutoPlay()
  }
}

const nextStep = () => {
  if (currentStep.value < props.steps.length - 1) {
    currentStep.value++
  } else if (autoPlayActive.value) {
    stopAutoPlay()
  }
}

const goToStep = (index: number) => {
  if (index >= 0 && index < props.steps.length) {
    currentStep.value = index
    stopAutoPlay()
  }
}

const toggleEffectsVisible = (stepId: string) => {
  effectsVisible.value[stepId] = !effectsVisible.value[stepId]
}

const startAutoPlay = () => {
  if (props.steps.length === 0) return

  autoPlayActive.value = true
  autoPlayTimer.value = window.setInterval(() => {
    if (currentStep.value < props.steps.length - 1) {
      nextStep()
    } else {
      stopAutoPlay()
    }
  }, props.animationSpeed)
}

const stopAutoPlay = () => {
  autoPlayActive.value = false
  if (autoPlayTimer.value) {
    clearInterval(autoPlayTimer.value)
    autoPlayTimer.value = null
  }
}

const getStepTypeLabel = (type: string): string => {
  const labels = {
    base: 'Base Value',
    addition: 'Addition',
    multiplication: 'Multiplication',
    override: 'Override',
  }
  return labels[type as keyof typeof labels] || type
}

const formatStepValue = (step: CalculationStep): string => {
  switch (step.type) {
    case 'base':
      return `${step.value.toFixed(2)}`
    case 'addition':
      return `+${step.value.toFixed(2)}`
    case 'multiplication':
      return `×${step.value.toFixed(2)}`
    case 'override':
      return `=${step.value.toFixed(2)}`
    default:
      return step.value.toFixed(2)
  }
}

const formatEffectContribution = (effect: any, stepType: string): string => {
  switch (stepType) {
    case 'addition':
      return `+${effect.value}%`
    case 'multiplication':
      return `×${effect.value.toFixed(2)}`
    default:
      return effect.value.toString()
  }
}

const generateCalculationProcess = (
  step: CalculationStep,
  stepIndex: number
): string => {
  const prevTotal = calculateRunningTotal(stepIndex - 1)
  const currentValue = step.value

  switch (step.type) {
    case 'base':
      return `Starting with base value: ${currentValue.toFixed(2)}`
    case 'addition':
      return `${prevTotal.toFixed(2)} + ${currentValue.toFixed(2)} = ${(prevTotal + currentValue).toFixed(2)}`
    case 'multiplication':
      return `${prevTotal.toFixed(2)} × ${currentValue.toFixed(2)} = ${(prevTotal * currentValue).toFixed(2)}`
    case 'override':
      return `Override with value: ${currentValue.toFixed(2)}`
    default:
      return `${prevTotal.toFixed(2)} → ${currentValue.toFixed(2)}`
  }
}

const calculateRunningTotal = (stepIndex: number): number => {
  if (stepIndex < 0) return 0

  let total = 0
  for (let i = 0; i <= stepIndex && i < props.steps.length; i++) {
    const step = props.steps[i]
    switch (step.type) {
      case 'base':
        total = step.value
        break
      case 'addition':
        total += step.value
        break
      case 'multiplication':
        total *= step.value
        break
      case 'override':
        total = step.value
        break
    }
  }
  return total
}

const formatRunningTotal = (stepIndex: number): string => {
  const total = calculateRunningTotal(stepIndex)
  return `${total.toFixed(2)}×`
}

const formatFinalMultiplier = (): string => {
  if (props.result?.finalMultiplier) {
    return props.result.finalMultiplier.toFixed(2)
  }
  const total = calculateRunningTotal(props.steps.length - 1)
  return total.toFixed(2)
}

// Watch for prop changes
watch(
  () => props.steps,
  newSteps => {
    if (newSteps.length > 0) {
      currentStep.value = 0
      // Initialize effects visibility
      newSteps.forEach(step => {
        if (step.effects && step.effects.length > 0) {
          effectsVisible.value[step.id] = props.showEffectsExpanded
        }
      })

      if (props.autoPlay) {
        nextTick(() => startAutoPlay())
      }
    }
  },
  { immediate: true }
)

// Cleanup on unmount
import { onUnmounted } from 'vue'
onUnmounted(() => {
  stopAutoPlay()
})

// Icon components
const StepsIcon = {
  template: `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M3 3h18v2H3V3zm0 6h18v2H3V9zm0 6h18v2H3v-2z"/>
    </svg>
  `,
}

const AnimationIcon = {
  template: `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
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

const PrevIcon = {
  template: `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
    </svg>
  `,
}

const NextIcon = {
  template: `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
    </svg>
  `,
}
</script>

<style scoped>
.calculation-steps-display {
  width: 100%;
}

.steps-card {
  border: 1px solid #e5e7eb;
}

.steps-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.steps-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
}

.steps-controls {
  display: flex;
  align-items: center;
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

.control-btn:hover:not(:disabled) {
  background: #f9fafb;
  color: #374151;
  transform: translateY(-1px);
}

.control-btn.active {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

.control-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
}

/* Progress Section */
.progress-section {
  margin-bottom: 2rem;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #1d4ed8);
  border-radius: 4px;
  transition: width 0.3s ease-in-out;
}

.progress-text {
  text-align: center;
  font-size: 0.9rem;
  color: #6b7280;
}

.current-step-name {
  font-weight: 500;
  color: #374151;
}

/* Steps Container */
.steps-container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  margin-bottom: 2rem;
}

.calculation-step {
  display: flex;
  gap: 1.5rem;
  position: relative;
}

.calculation-step.animated {
  transition: all 0.3s ease-in-out;
}

.calculation-step.pending {
  opacity: 0.4;
}

.calculation-step.active {
  transform: scale(1.02);
  background: rgba(59, 130, 246, 0.05);
  border-radius: 8px;
  padding: 1rem;
  margin: -1rem;
}

/* Step Indicator */
.step-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}

.step-number {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-weight: 600;
  font-size: 0.9rem;
  background: #e5e7eb;
  color: #6b7280;
  border: 2px solid #e5e7eb;
  transition: all 0.3s;
}

.calculation-step.completed .step-number {
  background: #10b981;
  color: white;
  border-color: #10b981;
}

.calculation-step.active .step-number {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.2);
}

.step-connector {
  width: 2px;
  height: 60px;
  background: #e5e7eb;
  margin-top: 8px;
}

.calculation-step.completed .step-connector {
  background: #10b981;
}

/* Step Content */
.step-content {
  flex: 1;
  min-width: 0;
}

.step-header {
  margin-bottom: 1rem;
}

.step-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 0.5rem 0;
}

.step-meta {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.step-type {
  font-size: 0.8rem;
  padding: 0.25rem 0.5rem;
  background: #f3f4f6;
  color: #6b7280;
  border-radius: 12px;
  font-weight: 500;
}

.step-description {
  font-size: 0.9rem;
  color: #6b7280;
}

/* Step Formula */
.step-formula {
  margin-bottom: 1rem;
  padding: 0.75rem;
  background: #f9fafb;
  border-radius: 6px;
  border-left: 3px solid #3b82f6;
}

.formula-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #6b7280;
  margin-bottom: 0.5rem;
}

.formula-content code {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.9rem;
  color: #1f2937;
}

/* Step Value */
.step-value {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  padding: 0.75rem;
  background: #fef3c7;
  border-radius: 6px;
}

.value-label {
  font-size: 0.9rem;
  font-weight: 500;
  color: #92400e;
}

.value-number {
  font-size: 1.1rem;
  font-weight: 700;
}

.value-number.type-base {
  color: #6b7280;
}

.value-number.type-addition {
  color: #059669;
}

.value-number.type-multiplication {
  color: #dc2626;
}

.value-number.type-override {
  color: #7c3aed;
}

/* Step Effects */
.step-effects {
  margin-bottom: 1rem;
}

.effects-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.effects-label {
  font-size: 0.9rem;
  font-weight: 500;
  color: #374151;
}

.effects-toggle {
  font-size: 0.8rem;
  color: #3b82f6;
  background: none;
  border: none;
  cursor: pointer;
  text-decoration: underline;
}

.effects-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.75rem;
  background: #f9fafb;
  border-radius: 6px;
}

.effect-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  background: white;
  border-radius: 4px;
  border: 1px solid #e5e7eb;
}

.effect-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.effect-name {
  font-size: 0.9rem;
  font-weight: 500;
  color: #111827;
}

.effect-source {
  font-size: 0.8rem;
  color: #6b7280;
}

.effect-contribution {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.25rem;
}

.effect-value {
  font-size: 0.9rem;
  font-weight: 600;
  color: #059669;
}

.effect-multiplier {
  font-size: 0.8rem;
  color: #dc2626;
}

/* Step Calculation */
.step-calculation {
  padding: 1rem;
  background: #f0f9ff;
  border-radius: 6px;
  border: 1px solid #bae6fd;
}

.calculation-detail {
  margin-bottom: 0.75rem;
}

.calculation-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #0369a1;
  margin-bottom: 0.25rem;
}

.calculation-process {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.9rem;
  color: #1e40af;
}

.running-total {
  padding-top: 0.75rem;
  border-top: 1px solid #bae6fd;
}

.total-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #0369a1;
  margin-bottom: 0.25rem;
}

.total-value {
  font-size: 1.1rem;
  font-weight: 700;
  color: #1e40af;
}

/* Final Result */
.final-result {
  text-align: center;
  padding: 2rem;
  background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
  border-radius: 12px;
  border: 2px solid #10b981;
}

.result-header h4 {
  font-size: 1.5rem;
  color: #065f46;
  margin: 0 0 1rem 0;
}

.result-value {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.final-multiplier {
  font-size: 3rem;
  font-weight: 700;
  color: #059669;
  line-height: 1;
}

.multiplier-unit {
  font-size: 1.5rem;
  font-weight: 600;
  color: #047857;
}

.result-formula {
  padding: 1rem;
  background: rgba(16, 185, 129, 0.1);
  border-radius: 6px;
  margin-top: 1rem;
}

.result-formula code {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.9rem;
  color: #065f46;
}

/* Empty State */
.empty-steps {
  text-align: center;
  padding: 3rem 1rem;
  color: #6b7280;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.empty-steps h4 {
  margin: 0 0 0.5rem 0;
  color: #374151;
}

.empty-steps p {
  margin: 0;
}

/* Navigation Controls */
.navigation-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e5e7eb;
}

.nav-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  color: #374151;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.nav-btn:hover:not(:disabled) {
  background: #f9fafb;
  color: #111827;
  transform: translateY(-1px);
}

.nav-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
}

.step-indicators {
  display: flex;
  gap: 0.5rem;
}

.step-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #d1d5db;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.step-dot:hover {
  background: #9ca3af;
  transform: scale(1.2);
}

.step-dot.completed {
  background: #10b981;
}

.step-dot.active {
  background: #3b82f6;
  transform: scale(1.3);
}

/* Transitions */
.effects-enter-active,
.effects-leave-active {
  transition: all 0.3s ease-in-out;
}

.effects-enter-from,
.effects-leave-to {
  opacity: 0;
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
}

.effects-enter-to,
.effects-leave-from {
  opacity: 1;
  max-height: 300px;
}

/* Responsive */
@media (max-width: 768px) {
  .steps-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .steps-controls {
    align-self: stretch;
  }

  .calculation-step {
    gap: 1rem;
  }

  .step-number {
    width: 32px;
    height: 32px;
    font-size: 0.8rem;
  }

  .effect-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .effect-contribution {
    align-items: flex-start;
  }

  .navigation-controls {
    flex-direction: column;
    gap: 1rem;
  }

  .step-indicators {
    order: -1;
  }

  .final-multiplier {
    font-size: 2.5rem;
  }

  .result-value {
    flex-direction: column;
    gap: 0.25rem;
  }
}
</style>

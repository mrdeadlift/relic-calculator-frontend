<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="toast-container"
      :class="[
        `toast-${type}`,
        { 'toast-entering': entering, 'toast-exiting': exiting },
      ]"
      @click="dismiss"
    >
      <div class="toast-content">
        <div class="toast-icon">
          <component :is="iconComponent" />
        </div>
        <div class="toast-message">
          <div v-if="title" class="toast-title">{{ title }}</div>
          <div class="toast-text">{{ message }}</div>
        </div>
        <button
          v-if="dismissible"
          class="toast-close"
          aria-label="Dismiss notification"
          @click.stop="dismiss"
        >
          <CloseIcon />
        </button>
      </div>
      <div
        v-if="autoDismiss"
        class="toast-progress"
        :style="{ animationDuration: `${duration}ms` }"
      />
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'

// Props
interface Props {
  type?: 'success' | 'error' | 'warning' | 'info'
  title?: string
  message: string
  duration?: number
  autoJourney?: boolean
  dismissible?: boolean
  onDismiss?: () => void
}

const props = withDefaults(defineProps<Props>(), {
  type: 'info',
  duration: 4000,
  autoJourney: true,
  dismissible: true,
})

// State
const visible = ref(false)
const entering = ref(false)
const exiting = ref(false)

// Computed
const iconComponent = computed(() => {
  switch (props.type) {
    case 'success':
      return SuccessIcon
    case 'error':
      return ErrorIcon
    case 'warning':
      return WarningIcon
    default:
      return InfoIcon
  }
})

const autoJourney = computed(() => props.autoJourney && props.duration > 0)

// Methods
const show = () => {
  visible.value = true
  entering.value = true

  // Remove entering class after animation
  setTimeout(() => {
    entering.value = false
  }, 300)

  // Auto dismiss
  if (autoJourney.value) {
    setTimeout(() => {
      dismiss()
    }, props.duration)
  }
}

const dismiss = () => {
  if (exiting.value) return

  exiting.value = true

  setTimeout(() => {
    visible.value = false
    props.onDismiss?.()
  }, 300)
}

// Lifecycle
onMounted(() => {
  show()
})

// Icon components (simplified SVG icons)
const SuccessIcon = {
  template: `
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
    </svg>
  `,
}

const ErrorIcon = {
  template: `
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
    </svg>
  `,
}

const WarningIcon = {
  template: `
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
      <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
    </svg>
  `,
}

const InfoIcon = {
  template: `
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
      <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
    </svg>
  `,
}

const CloseIcon = {
  template: `
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
    </svg>
  `,
}

// Expose methods for programmatic use
defineExpose({
  show,
  dismiss,
})
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 9999;
  max-width: 400px;
  min-width: 300px;
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-md);
  background: white;
  border: 1px solid var(--border-color);
  overflow: hidden;
  cursor: pointer;
  transform: translateX(100%);
  transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.toast-entering {
  transform: translateX(0);
}

.toast-exiting {
  transform: translateX(100%);
  opacity: 0;
}

.toast-content {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
}

.toast-icon {
  flex-shrink: 0;
  margin-top: 0.125rem;
}

.toast-message {
  flex: 1;
  min-width: 0;
}

.toast-title {
  font-weight: 600;
  font-size: 0.875rem;
  margin-bottom: 0.25rem;
  color: var(--text-primary);
}

.toast-text {
  font-size: 0.875rem;
  color: var(--text-secondary);
  line-height: 1.4;
}

.toast-close {
  flex-shrink: 0;
  background: none;
  border: none;
  padding: 0.25rem;
  margin: -0.25rem -0.25rem -0.25rem 0;
  border-radius: 4px;
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.2s;
}

.toast-close:hover {
  background: var(--gray-100);
  color: var(--text-secondary);
  transform: none;
  box-shadow: none;
}

.toast-progress {
  height: 3px;
  background: currentColor;
  opacity: 0.6;
  animation: toast-progress linear;
  transform-origin: left;
}

@keyframes toast-progress {
  from {
    transform: scaleX(1);
  }
  to {
    transform: scaleX(0);
  }
}

/* Type-specific styling */
.toast-success {
  border-left: 4px solid var(--success-color);
}

.toast-success .toast-icon {
  color: var(--success-color);
}

.toast-success .toast-progress {
  background: var(--success-color);
}

.toast-error {
  border-left: 4px solid var(--danger-color);
}

.toast-error .toast-icon {
  color: var(--danger-color);
}

.toast-error .toast-progress {
  background: var(--danger-color);
}

.toast-warning {
  border-left: 4px solid var(--warning-color);
}

.toast-warning .toast-icon {
  color: var(--warning-color);
}

.toast-warning .toast-progress {
  background: var(--warning-color);
}

.toast-info {
  border-left: 4px solid var(--info-color);
}

.toast-info .toast-icon {
  color: var(--info-color);
}

.toast-info .toast-progress {
  background: var(--info-color);
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .toast-container {
    top: 0.5rem;
    right: 0.5rem;
    left: 0.5rem;
    max-width: none;
    min-width: auto;
  }

  .toast-content {
    padding: 0.75rem;
  }

  .toast-title {
    font-size: 0.8rem;
  }

  .toast-text {
    font-size: 0.8rem;
  }
}
</style>

<template>
  <div class="base-input-wrapper">
    <label v-if="label" :for="inputId" class="input-label">
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </label>

    <div class="input-container">
      <div v-if="$slots.prefix" class="input-prefix">
        <slot name="prefix" />
      </div>

      <input
        :id="inputId"
        v-model="inputValue"
        :type="type"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :required="required"
        :class="inputClasses"
        @focus="handleFocus"
        @blur="handleBlur"
        @input="handleInput"
        @keydown="handleKeydown"
      />

      <div v-if="$slots.suffix" class="input-suffix">
        <slot name="suffix" />
      </div>

      <div v-if="loading" class="input-loading">
        <div class="spinner"></div>
      </div>
    </div>

    <div v-if="error || hint" class="input-help">
      <span v-if="error" class="input-error">{{ error }}</span>
      <span v-else-if="hint" class="input-hint">{{ hint }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

interface Props {
  modelValue?: string | number
  type?: 'text' | 'email' | 'password' | 'number' | 'search' | 'tel' | 'url'
  label?: string
  placeholder?: string
  hint?: string
  error?: string
  disabled?: boolean
  readonly?: boolean
  required?: boolean
  loading?: boolean
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'filled' | 'flushed'
  id?: string
}

interface Emits {
  (e: 'update:modelValue', value: string | number): void
  (e: 'focus', event: FocusEvent): void
  (e: 'blur', event: FocusEvent): void
  (e: 'input', event: Event): void
  (e: 'keydown', event: KeyboardEvent): void
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  size: 'md',
  variant: 'default',
})

const emit = defineEmits<Emits>()

const inputId = computed(
  () => props.id || `input-${Math.random().toString(36).substr(2, 9)}`
)
const isFocused = ref(false)

const inputValue = computed({
  get: () => props.modelValue ?? '',
  set: value => {
    const parsedValue = props.type === 'number' ? Number(value) : value
    emit('update:modelValue', parsedValue)
  },
})

const inputClasses = computed(() => {
  const classes = ['base-input']

  // Size classes
  classes.push(`input-${props.size}`)

  // Variant classes
  classes.push(`input-${props.variant}`)

  // State classes
  if (props.error) classes.push('input-error-state')
  if (props.disabled) classes.push('input-disabled')
  if (props.readonly) classes.push('input-readonly')
  if (isFocused.value) classes.push('input-focused')
  if (props.loading) classes.push('input-loading-state')

  return classes
})

const handleFocus = (event: FocusEvent) => {
  isFocused.value = true
  emit('focus', event)
}

const handleBlur = (event: FocusEvent) => {
  isFocused.value = false
  emit('blur', event)
}

const handleInput = (event: Event) => {
  emit('input', event)
}

const handleKeydown = (event: KeyboardEvent) => {
  emit('keydown', event)
}
</script>

<style scoped>
.base-input-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.input-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.input-container {
  position: relative;
  display: flex;
  align-items: center;
}

.base-input {
  width: 100%;
  border: 1px solid #d1d5db;
  background-color: #ffffff;
  color: #111827;
  transition: all 0.2s ease-in-out;
  font-size: 0.875rem;
}

.base-input:focus {
  outline: 2px solid #3b82f6;
  outline-offset: -2px;
  border-color: #3b82f6;
}

.base-input::placeholder {
  color: #9ca3af;
}

/* Sizes */
.input-sm {
  padding: 0.375rem 0.75rem;
  font-size: 0.75rem;
  border-radius: 0.25rem;
}

.input-md {
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  border-radius: 0.375rem;
}

.input-lg {
  padding: 0.75rem 1rem;
  font-size: 1rem;
  border-radius: 0.5rem;
}

/* Variants */
.input-default {
  border: 1px solid #d1d5db;
  background-color: #ffffff;
}

.input-filled {
  border: 1px solid transparent;
  background-color: #f3f4f6;
}

.input-filled:focus {
  background-color: #ffffff;
  border-color: #3b82f6;
}

.input-flushed {
  border: none;
  border-bottom: 2px solid #d1d5db;
  border-radius: 0;
  background-color: transparent;
}

.input-flushed:focus {
  border-bottom-color: #3b82f6;
  outline: none;
}

/* States */
.input-error-state {
  border-color: #ef4444;
}

.input-error-state:focus {
  outline-color: #ef4444;
  border-color: #ef4444;
}

.input-disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background-color: #f9fafb;
}

.input-readonly {
  background-color: #f9fafb;
  cursor: default;
}

.input-loading-state {
  padding-right: 2.5rem;
}

/* Prefix and suffix */
.input-prefix,
.input-suffix {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  color: #6b7280;
  pointer-events: none;
  z-index: 1;
}

.input-prefix {
  left: 0.75rem;
}

.input-suffix {
  right: 0.75rem;
}

.input-loading {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
}

.spinner {
  width: 1rem;
  height: 1rem;
  border: 2px solid #e5e7eb;
  border-top: 2px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Help text */
.input-help {
  min-height: 1.25rem;
}

.input-error {
  color: #ef4444;
  font-size: 0.75rem;
}

.input-hint {
  color: #6b7280;
  font-size: 0.75rem;
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .input-label {
    color: #d1d5db;
  }

  .base-input {
    background-color: #374151;
    border-color: #4b5563;
    color: #f9fafb;
  }

  .base-input::placeholder {
    color: #9ca3af;
  }

  .input-filled {
    background-color: #4b5563;
  }

  .input-filled:focus {
    background-color: #374151;
  }

  .input-disabled,
  .input-readonly {
    background-color: #4b5563;
  }
}
</style>

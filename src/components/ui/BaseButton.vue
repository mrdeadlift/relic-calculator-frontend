<template>
  <button
    :class="buttonClasses"
    :disabled="disabled || loading"
    @click="handleClick"
  >
    <span v-if="loading" class="btn-spinner"></span>
    <slot v-if="!loading" />
    <span v-if="loading">{{ loadingText }}</span>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'outline' | 'ghost'
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  disabled?: boolean
  loading?: boolean
  loadingText?: string
  fullWidth?: boolean
  rounded?: boolean
}

interface Emits {
  (e: 'click', event: MouseEvent): void
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  disabled: false,
  loading: false,
  loadingText: '読み込み中...',
  fullWidth: false,
  rounded: false
})

const emit = defineEmits<Emits>()

const buttonClasses = computed(() => {
  const classes = ['base-button']
  
  // Variant styles
  classes.push(`btn-${props.variant}`)
  
  // Size styles
  classes.push(`btn-${props.size}`)
  
  // State classes
  if (props.disabled) classes.push('btn-disabled')
  if (props.loading) classes.push('btn-loading')
  if (props.fullWidth) classes.push('btn-full-width')
  if (props.rounded) classes.push('btn-rounded')
  
  return classes
})

const handleClick = (event: MouseEvent) => {
  if (!props.disabled && !props.loading) {
    emit('click', event)
  }
}
</script>

<style scoped>
.base-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 500;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  text-decoration: none;
  position: relative;
  overflow: hidden;
}

.base-button:focus {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

/* Sizes */
.btn-xs {
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  border-radius: 0.25rem;
}

.btn-sm {
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
  border-radius: 0.375rem;
}

.btn-md {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  border-radius: 0.375rem;
}

.btn-lg {
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  border-radius: 0.5rem;
}

.btn-xl {
  padding: 1rem 2rem;
  font-size: 1.125rem;
  border-radius: 0.5rem;
}

/* Variants */
.btn-primary {
  background-color: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

.btn-primary:hover:not(.btn-disabled):not(.btn-loading) {
  background-color: #2563eb;
  border-color: #2563eb;
}

.btn-secondary {
  background-color: #6b7280;
  color: white;
  border-color: #6b7280;
}

.btn-secondary:hover:not(.btn-disabled):not(.btn-loading) {
  background-color: #4b5563;
  border-color: #4b5563;
}

.btn-danger {
  background-color: #ef4444;
  color: white;
  border-color: #ef4444;
}

.btn-danger:hover:not(.btn-disabled):not(.btn-loading) {
  background-color: #dc2626;
  border-color: #dc2626;
}

.btn-success {
  background-color: #10b981;
  color: white;
  border-color: #10b981;
}

.btn-success:hover:not(.btn-disabled):not(.btn-loading) {
  background-color: #059669;
  border-color: #059669;
}

.btn-outline {
  background-color: transparent;
  color: #3b82f6;
  border-color: #3b82f6;
}

.btn-outline:hover:not(.btn-disabled):not(.btn-loading) {
  background-color: #3b82f6;
  color: white;
}

.btn-ghost {
  background-color: transparent;
  color: #374151;
  border-color: transparent;
}

.btn-ghost:hover:not(.btn-disabled):not(.btn-loading) {
  background-color: #f3f4f6;
}

/* States */
.btn-disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-loading {
  cursor: wait;
}

.btn-full-width {
  width: 100%;
}

.btn-rounded {
  border-radius: 9999px;
}

/* Loading spinner */
.btn-spinner {
  width: 1rem;
  height: 1rem;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-right: 0.5rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .btn-ghost {
    color: #d1d5db;
  }
  
  .btn-ghost:hover:not(.btn-disabled):not(.btn-loading) {
    background-color: #374151;
  }
}
</style>
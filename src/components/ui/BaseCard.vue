<template>
  <div :class="cardClasses">
    <!-- Header -->
    <header v-if="$slots.header || title" class="card-header">
      <div v-if="title" class="card-title">{{ title }}</div>
      <slot name="header" />
      <div v-if="$slots.actions" class="card-actions">
        <slot name="actions" />
      </div>
    </header>

    <!-- Image -->
    <div v-if="$slots.image || image" class="card-image">
      <img v-if="image" :src="image" :alt="imageAlt" />
      <slot name="image" />
    </div>

    <!-- Content -->
    <div :class="contentClasses">
      <slot />
    </div>

    <!-- Footer -->
    <footer v-if="$slots.footer" class="card-footer">
      <slot name="footer" />
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  title?: string
  image?: string
  imageAlt?: string
  variant?: 'default' | 'outlined' | 'elevated' | 'filled'
  size?: 'sm' | 'md' | 'lg'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  hover?: boolean
  clickable?: boolean
  loading?: boolean
  disabled?: boolean
  rounded?: boolean
}

interface Emits {
  (e: 'click', event: MouseEvent): void
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  size: 'md',
  padding: 'md',
  hover: false,
  clickable: false,
  loading: false,
  disabled: false,
  rounded: true
})

const emit = defineEmits<Emits>()

const cardClasses = computed(() => {
  const classes = ['base-card']
  
  // Variant classes
  classes.push(`card-${props.variant}`)
  
  // Size classes
  classes.push(`card-${props.size}`)
  
  // State classes
  if (props.hover) classes.push('card-hover')
  if (props.clickable) classes.push('card-clickable')
  if (props.loading) classes.push('card-loading')
  if (props.disabled) classes.push('card-disabled')
  if (props.rounded) classes.push('card-rounded')
  
  return classes
})

const contentClasses = computed(() => {
  const classes = ['card-content']
  classes.push(`card-padding-${props.padding}`)
  return classes
})

const handleClick = (event: MouseEvent) => {
  if (props.clickable && !props.disabled && !props.loading) {
    emit('click', event)
  }
}
</script>

<style scoped>
.base-card {
  background-color: #ffffff;
  position: relative;
  overflow: hidden;
  transition: all 0.2s ease-in-out;
  display: flex;
  flex-direction: column;
}

.card-rounded {
  border-radius: 0.5rem;
}

/* Variants */
.card-default {
  border: 1px solid #e5e7eb;
}

.card-outlined {
  border: 2px solid #d1d5db;
}

.card-elevated {
  border: 1px solid #e5e7eb;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.card-filled {
  background-color: #f9fafb;
  border: 1px solid transparent;
}

/* Sizes */
.card-sm {
  max-width: 20rem;
}

.card-md {
  max-width: 24rem;
}

.card-lg {
  max-width: 32rem;
}

/* States */
.card-hover:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

.card-clickable {
  cursor: pointer;
}

.card-clickable:focus {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

.card-loading {
  opacity: 0.7;
  pointer-events: none;
}

.card-disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

/* Header */
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1rem 0;
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
}

.card-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  flex: 1;
}

.card-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

/* Image */
.card-image {
  width: 100%;
  overflow: hidden;
}

.card-image img {
  width: 100%;
  height: auto;
  object-fit: cover;
  display: block;
}

/* Content */
.card-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.card-padding-none {
  padding: 0;
}

.card-padding-sm {
  padding: 0.75rem;
}

.card-padding-md {
  padding: 1rem;
}

.card-padding-lg {
  padding: 1.5rem;
}

/* Footer */
.card-footer {
  padding: 1rem;
  border-top: 1px solid #e5e7eb;
  margin-top: auto;
  display: flex;
  gap: 0.75rem;
  align-items: center;
  justify-content: flex-end;
}

/* Loading overlay */
.card-loading::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.8);
  z-index: 1;
}

.card-loading::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 2rem;
  height: 2rem;
  border: 2px solid #e5e7eb;
  border-top: 2px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  z-index: 2;
}

@keyframes spin {
  to {
    transform: translate(-50%, -50%) rotate(360deg);
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .base-card {
    background-color: #1f2937;
  }
  
  .card-default,
  .card-outlined,
  .card-elevated {
    border-color: #374151;
  }
  
  .card-filled {
    background-color: #374151;
  }
  
  .card-title {
    color: #f9fafb;
  }
  
  .card-header,
  .card-footer {
    border-color: #374151;
  }
  
  .card-loading::before {
    background-color: rgba(31, 41, 55, 0.8);
  }
}

/* Responsive */
@media (max-width: 640px) {
  .card-header,
  .card-content,
  .card-footer {
    padding-left: 0.75rem;
    padding-right: 0.75rem;
  }
  
  .card-padding-md {
    padding: 0.75rem;
  }
  
  .card-padding-lg {
    padding: 1rem;
  }
}
</style>
<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show" class="modal-overlay" @click="handleOverlayClick">
        <div
          :class="modalClasses"
          role="dialog"
          :aria-labelledby="titleId"
          :aria-describedby="contentId"
          aria-modal="true"
          @click.stop
        >
          <!-- Header -->
          <header v-if="$slots.header || title" class="modal-header">
            <div :id="titleId" class="modal-title">
              <slot name="header">
                {{ title }}
              </slot>
            </div>
            <button
              v-if="closable"
              class="modal-close-btn"
              :aria-label="closeAriaLabel"
              @click="handleClose"
            >
              ✕
            </button>
          </header>

          <!-- Content -->
          <div :id="contentId" class="modal-content">
            <slot />
          </div>

          <!-- Footer -->
          <footer v-if="$slots.footer" class="modal-footer">
            <slot name="footer" />
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, watch, nextTick } from 'vue'

interface Props {
  show?: boolean
  title?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  closable?: boolean
  closeOnOverlay?: boolean
  closeOnEscape?: boolean
  persistent?: boolean
  centered?: boolean
  scrollable?: boolean
  closeAriaLabel?: string
}

interface Emits {
  (e: 'update:show', value: boolean): void
  (e: 'close'): void
  (e: 'opened'): void
  (e: 'closed'): void
}

const props = withDefaults(defineProps<Props>(), {
  show: false,
  size: 'md',
  closable: true,
  closeOnOverlay: true,
  closeOnEscape: true,
  persistent: false,
  centered: true,
  scrollable: false,
  closeAriaLabel: 'モーダルを閉じる',
})

const emit = defineEmits<Emits>()

const titleId = computed(
  () => `modal-title-${Math.random().toString(36).substr(2, 9)}`
)
const contentId = computed(
  () => `modal-content-${Math.random().toString(36).substr(2, 9)}`
)

const modalClasses = computed(() => {
  const classes = ['modal-dialog']

  // Size classes
  classes.push(`modal-${props.size}`)

  // Position classes
  if (props.centered) classes.push('modal-centered')
  if (props.scrollable) classes.push('modal-scrollable')

  return classes
})

const handleClose = () => {
  if (!props.persistent) {
    emit('update:show', false)
    emit('close')
  }
}

const handleOverlayClick = () => {
  if (props.closeOnOverlay) {
    handleClose()
  }
}

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && props.closeOnEscape) {
    handleClose()
  }
}

// Body scroll lock
const lockBodyScroll = () => {
  document.body.style.overflow = 'hidden'
}

const unlockBodyScroll = () => {
  document.body.style.overflow = ''
}

// Watch for show prop changes
watch(
  () => props.show,
  async newShow => {
    if (newShow) {
      lockBodyScroll()
      document.addEventListener('keydown', handleKeydown)
      await nextTick()
      emit('opened')
    } else {
      unlockBodyScroll()
      document.removeEventListener('keydown', handleKeydown)
      emit('closed')
    }
  }
)

// Cleanup on unmount
import { onUnmounted } from 'vue'
onUnmounted(() => {
  unlockBodyScroll()
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-dialog {
  background-color: white;
  border-radius: 0.5rem;
  box-shadow:
    0 20px 25px -5px rgba(0, 0, 0, 0.1),
    0 10px 10px -5px rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 2rem);
  position: relative;
}

.modal-centered {
  margin: auto;
}

.modal-scrollable {
  overflow-y: auto;
}

/* Sizes */
.modal-sm {
  width: 100%;
  max-width: 24rem;
}

.modal-md {
  width: 100%;
  max-width: 32rem;
}

.modal-lg {
  width: 100%;
  max-width: 48rem;
}

.modal-xl {
  width: 100%;
  max-width: 64rem;
}

.modal-full {
  width: 100%;
  height: 100%;
  max-width: none;
  max-height: none;
  border-radius: 0;
}

/* Header */
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem 1.5rem 0 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
}

.modal-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  flex: 1;
}

.modal-close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border: none;
  background: none;
  color: #6b7280;
  cursor: pointer;
  border-radius: 0.25rem;
  transition: all 0.2s ease-in-out;
  font-size: 1.25rem;
}

.modal-close-btn:hover {
  background-color: #f3f4f6;
  color: #374151;
}

.modal-close-btn:focus {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

/* Content */
.modal-content {
  flex: 1;
  padding: 0 1.5rem;
  overflow-y: auto;
}

/* Footer */
.modal-footer {
  padding: 1rem 1.5rem 1.5rem;
  border-top: 1px solid #e5e7eb;
  margin-top: 1rem;
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
}

/* Transitions */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .modal-dialog,
.modal-leave-active .modal-dialog {
  transition: transform 0.3s ease;
}

.modal-enter-from .modal-dialog,
.modal-leave-to .modal-dialog {
  transform: scale(0.9) translateY(-50px);
}

/* Responsive */
@media (max-width: 640px) {
  .modal-overlay {
    padding: 0;
    align-items: flex-end;
  }

  .modal-dialog {
    width: 100%;
    max-height: 90vh;
    border-radius: 0.5rem 0.5rem 0 0;
    margin: 0;
  }

  .modal-full {
    height: 100vh;
    border-radius: 0;
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .modal-dialog {
    background-color: #1f2937;
  }

  .modal-title {
    color: #f9fafb;
  }

  .modal-header,
  .modal-footer {
    border-color: #374151;
  }

  .modal-close-btn {
    color: #9ca3af;
  }

  .modal-close-btn:hover {
    background-color: #374151;
    color: #d1d5db;
  }
}
</style>

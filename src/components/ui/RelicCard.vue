<template>
  <div
    :class="[
      'relic-card',
      `rarity-${relic.rarity}`,
      `category-${relic.category.toLowerCase()}`,
      {
        selected: selected,
        disabled: disabled,
        dragging: isDragging,
        compact: compact,
      },
    ]"
    :draggable="draggable && !disabled"
    @dragstart="handleDragStart"
    @dragend="handleDragEnd"
    @click="handleClick"
  >
    <!-- Relic Icon -->
    <div class="relic-icon-container">
      <img
        v-if="relic.iconUrl && !imageError"
        :src="relic.iconUrl"
        :alt="relic.name"
        class="relic-icon"
        @error="handleImageError"
      />
      <div v-else class="relic-icon-placeholder">
        <component :is="getCategoryIcon(relic.category)" />
      </div>

      <!-- Selection indicator -->
      <div v-if="selected" class="selection-indicator">
        <CheckIcon />
      </div>

      <!-- Rarity border -->
      <div :class="['rarity-border', `rarity-${relic.rarity}`]" />
    </div>

    <!-- Relic Info -->
    <div class="relic-info">
      <div class="relic-header">
        <h4 class="relic-name" :title="relic.name">{{ relic.name }}</h4>
        <div class="relic-badges">
          <span :class="['rarity-badge', `rarity-${relic.rarity}`]">
            {{ formatRarity(relic.rarity) }}
          </span>
          <span
            :class="[
              'category-badge',
              `category-${relic.category.toLowerCase()}`,
            ]"
          >
            {{ relic.category }}
          </span>
        </div>
      </div>

      <!-- Description (only in non-compact mode) -->
      <p v-if="!compact && relic.description" class="relic-description">
        {{ relic.description }}
      </p>

      <!-- Effects -->
      <div class="relic-effects">
        <div
          v-for="(effect, index) in displayEffects"
          :key="effect.id"
          class="effect-item"
        >
          <div class="effect-header">
            <span class="effect-name">{{ effect.name }}</span>
            <span class="effect-value">
              {{ formatEffectValue(effect) }}
            </span>
          </div>
          <p v-if="!compact && effect.description" class="effect-description">
            {{ effect.description }}
          </p>
        </div>

        <!-- Show more effects indicator -->
        <div v-if="hasMoreEffects" class="more-effects">
          +{{ relic.effects.length - maxEffectsToShow }} more effects
        </div>
      </div>

      <!-- Metadata -->
      <div v-if="showDetails" class="relic-metadata">
        <div class="metadata-item">
          <span class="metadata-label">Difficulty:</span>
          <div class="difficulty-rating">
            <div
              v-for="n in 10"
              :key="n"
              :class="[
                'difficulty-dot',
                { active: n <= relic.obtainmentDifficulty },
              ]"
            />
            <span class="difficulty-text"
              >{{ relic.obtainmentDifficulty }}/10</span
            >
          </div>
        </div>

        <div v-if="relic.quality" class="metadata-item">
          <span class="metadata-label">Quality:</span>
          <span
            :class="['quality-badge', `quality-${relic.quality.toLowerCase()}`]"
          >
            {{ relic.quality }}
          </span>
        </div>
      </div>
    </div>

    <!-- Action Button -->
    <div v-if="showActions" class="relic-actions">
      <button
        v-if="selected"
        :class="['action-btn', 'remove-btn']"
        :disabled="disabled"
        @click.stop="handleRemove"
      >
        <RemoveIcon />
        <span v-if="!compact">Remove</span>
      </button>
      <button
        v-else
        :class="['action-btn', 'add-btn']"
        :disabled="disabled"
        @click.stop="handleAdd"
      >
        <AddIcon />
        <span v-if="!compact">{{ disabled ? 'Limit reached' : 'Add' }}</span>
      </button>
    </div>

    <!-- Hover overlay for additional info -->
    <div v-if="showHoverOverlay" class="hover-overlay">
      <div class="overlay-content">
        <div class="overlay-header">
          <h5>{{ relic.name }}</h5>
          <span :class="['overlay-rarity', `rarity-${relic.rarity}`]">
            {{ formatRarity(relic.rarity) }}
          </span>
        </div>

        <div class="overlay-effects">
          <div
            v-for="effect in relic.effects"
            :key="effect.id"
            class="overlay-effect"
          >
            <strong>{{ effect.name }}:</strong>
            {{ formatEffectValue(effect) }}
            <span v-if="effect.description" class="overlay-effect-desc">
              {{ effect.description }}
            </span>
          </div>
        </div>

        <div
          v-if="relic.conflicts && relic.conflicts.length > 0"
          class="overlay-conflicts"
        >
          <strong>Conflicts with:</strong>
          <span class="conflict-list">{{ relic.conflicts.join(', ') }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Relic } from '../../types/relic'

// Props
interface Props {
  relic: Relic
  selected?: boolean
  disabled?: boolean
  compact?: boolean
  draggable?: boolean
  showDetails?: boolean
  showActions?: boolean
  showHoverOverlay?: boolean
  maxEffectsToShow?: number
  onClick?: (relic: Relic) => void
  onAdd?: (relic: Relic) => void
  onRemove?: (relic: Relic) => void
  onDragStart?: (relic: Relic, event: DragEvent) => void
  onDragEnd?: (relic: Relic, event: DragEvent) => void
}

const props = withDefaults(defineProps<Props>(), {
  selected: false,
  disabled: false,
  compact: false,
  draggable: false,
  showDetails: true,
  showActions: true,
  showHoverOverlay: false,
  maxEffectsToShow: 3,
})

// State
const imageError = ref(false)
const isDragging = ref(false)

// Computed
const displayEffects = computed(() => {
  return props.relic.effects.slice(0, props.maxEffectsToShow)
})

const hasMoreEffects = computed(() => {
  return props.relic.effects.length > props.maxEffectsToShow
})

// Methods
const handleClick = () => {
  if (!props.disabled) {
    props.onClick?.(props.relic)
  }
}

const handleAdd = () => {
  if (!props.disabled) {
    props.onAdd?.(props.relic)
  }
}

const handleRemove = () => {
  props.onRemove?.(props.relic)
}

const handleImageError = () => {
  imageError.value = true
}

const handleDragStart = (event: DragEvent) => {
  if (!props.draggable || props.disabled) {
    event.preventDefault()
    return
  }

  isDragging.value = true

  // Set drag data
  event.dataTransfer?.setData(
    'application/json',
    JSON.stringify({
      type: 'relic',
      data: props.relic,
    })
  )

  props.onDragStart?.(props.relic, event)
}

const handleDragEnd = (event: DragEvent) => {
  isDragging.value = false
  props.onDragEnd?.(props.relic, event)
}

const formatRarity = (rarity: string): string => {
  return rarity.charAt(0).toUpperCase() + rarity.slice(1)
}

const formatEffectValue = (effect: any): string => {
  if (typeof effect.value === 'number') {
    return effect.type === 'attack_percentage' ||
      effect.type === 'critical_multiplier'
      ? `+${effect.value}%`
      : `+${effect.value}`
  }
  return String(effect.value)
}

const getCategoryIcon = (category: string) => {
  const icons = {
    Attack: AttackIcon,
    Defense: DefenseIcon,
    Utility: UtilityIcon,
    Critical: CriticalIcon,
    Elemental: ElementalIcon,
  }
  return icons[category as keyof typeof icons] || AttackIcon
}

// Icon components
const CheckIcon = {
  template: `
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
    </svg>
  `,
}

const AddIcon = {
  template: `
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
    </svg>
  `,
}

const RemoveIcon = {
  template: `
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
    </svg>
  `,
}

const AttackIcon = {
  template: `
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
      <path d="M6 2l2-2h4l2 2v6l-2 2H8L6 8V2zM8 4v4h4V4H8zm2 10a3 3 0 100 6 3 3 0 000-6z"/>
    </svg>
  `,
}

const DefenseIcon = {
  template: `
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
      <path d="M10 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-7-4z"/>
    </svg>
  `,
}

const UtilityIcon = {
  template: `
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
      <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z"/>
      <path fill-rule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clip-rule="evenodd"/>
    </svg>
  `,
}

const CriticalIcon = {
  template: `
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
    </svg>
  `,
}

const ElementalIcon = {
  template: `
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
      <path fill-rule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clip-rule="evenodd"/>
    </svg>
  `,
}
</script>

<style scoped>
.relic-card {
  position: relative;
  display: flex;
  flex-direction: column;
  background: white;
  border: 2px solid var(--border-color);
  border-radius: 12px;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  overflow: hidden;
  min-height: 200px;
}

.relic-card:hover:not(.disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.relic-card.selected {
  border-color: var(--success-color);
  background: rgba(39, 174, 96, 0.05);
}

.relic-card.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
}

.relic-card.dragging {
  opacity: 0.8;
  transform: rotate(2deg);
}

.relic-card.compact {
  min-height: 120px;
  padding: 0.75rem;
}

/* Icon Container */
.relic-icon-container {
  position: relative;
  width: 48px;
  height: 48px;
  margin: 0 auto 1rem;
  border-radius: 8px;
  overflow: hidden;
}

.relic-icon {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.relic-icon-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--gray-200);
  color: var(--gray-600);
  border-radius: 8px;
}

.selection-indicator {
  position: absolute;
  top: -2px;
  right: -2px;
  width: 20px;
  height: 20px;
  background: var(--success-color);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 12px;
}

.rarity-border {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  border-radius: 8px 8px 0 0;
}

/* Relic Info */
.relic-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.relic-header {
  text-align: center;
}

.relic-name {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 0.5rem 0;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.relic-badges {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.rarity-badge,
.category-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.relic-description {
  font-size: 0.8rem;
  color: var(--text-secondary);
  line-height: 1.4;
  margin: 0;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

/* Effects */
.relic-effects {
  flex: 1;
}

.effect-item {
  padding: 0.5rem;
  background: var(--gray-50);
  border-radius: 6px;
  margin-bottom: 0.5rem;
  border-left: 3px solid var(--primary-color);
}

.effect-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
}

.effect-name {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-primary);
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.effect-value {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--success-color);
  white-space: nowrap;
}

.effect-description {
  font-size: 0.7rem;
  color: var(--text-muted);
  margin: 0.25rem 0 0 0;
  line-height: 1.3;
}

.more-effects {
  font-size: 0.7rem;
  color: var(--text-muted);
  font-style: italic;
  text-align: center;
  padding: 0.25rem;
}

/* Metadata */
.relic-metadata {
  border-top: 1px solid var(--border-color);
  padding-top: 0.75rem;
  margin-top: auto;
}

.metadata-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.metadata-label {
  font-size: 0.7rem;
  color: var(--text-muted);
  font-weight: 500;
}

.difficulty-rating {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.difficulty-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--gray-300);
  transition: background-color 0.2s;
}

.difficulty-dot.active {
  background: var(--warning-color);
}

.difficulty-text {
  font-size: 0.7rem;
  color: var(--text-muted);
  margin-left: 0.25rem;
}

.quality-badge {
  padding: 0.125rem 0.375rem;
  border-radius: 8px;
  font-size: 0.6rem;
  font-weight: 600;
  text-transform: uppercase;
}

/* Actions */
.relic-actions {
  margin-top: 0.75rem;
}

.action-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.5rem;
  border: none;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.add-btn {
  background: var(--primary-color);
  color: white;
}

.add-btn:hover:not(:disabled) {
  background: #2980b9;
  transform: translateY(-1px);
}

.remove-btn {
  background: var(--danger-color);
  color: white;
}

.remove-btn:hover:not(:disabled) {
  background: #c0392b;
  transform: translateY(-1px);
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
}

/* Hover Overlay */
.hover-overlay {
  position: absolute;
  top: 0;
  left: 100%;
  width: 300px;
  background: white;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 1rem;
  box-shadow: var(--shadow-md);
  z-index: 1000;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s;
}

.relic-card:hover .hover-overlay {
  opacity: 1;
}

.overlay-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--border-color);
}

.overlay-header h5 {
  margin: 0;
  font-size: 1rem;
  color: var(--text-primary);
}

.overlay-rarity {
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
}

.overlay-effects {
  margin-bottom: 0.75rem;
}

.overlay-effect {
  margin-bottom: 0.5rem;
  font-size: 0.8rem;
  line-height: 1.4;
}

.overlay-effect-desc {
  display: block;
  color: var(--text-muted);
  font-size: 0.7rem;
  margin-top: 0.25rem;
}

.overlay-conflicts {
  font-size: 0.8rem;
  color: var(--danger-color);
}

.conflict-list {
  display: block;
  font-size: 0.7rem;
  margin-top: 0.25rem;
}

/* Rarity Colors */
.rarity-common {
  background: #95a5a6;
}
.rarity-rare {
  background: #3498db;
}
.rarity-epic {
  background: #9b59b6;
}
.rarity-legendary {
  background: #f39c12;
}

.rarity-common .rarity-badge,
.rarity-common .overlay-rarity {
  background: #95a5a6;
  color: white;
}
.rarity-rare .rarity-badge,
.rarity-rare .overlay-rarity {
  background: #3498db;
  color: white;
}
.rarity-epic .rarity-badge,
.rarity-epic .overlay-rarity {
  background: #9b59b6;
  color: white;
}
.rarity-legendary .rarity-badge,
.rarity-legendary .overlay-rarity {
  background: #f39c12;
  color: white;
}

/* Category Colors */
.category-attack .category-badge {
  background: #e74c3c;
  color: white;
}
.category-defense .category-badge {
  background: #27ae60;
  color: white;
}
.category-utility .category-badge {
  background: #3498db;
  color: white;
}
.category-critical .category-badge {
  background: #f39c12;
  color: white;
}
.category-elemental .category-badge {
  background: #9b59b6;
  color: white;
}

/* Quality Colors */
.quality-delicate {
  background: #bdc3c7;
  color: #2c3e50;
}
.quality-polished {
  background: #3498db;
  color: white;
}
.quality-grand {
  background: #f39c12;
  color: white;
}

/* Responsive */
@media (max-width: 640px) {
  .relic-card {
    min-height: 160px;
    padding: 0.75rem;
  }

  .relic-icon-container {
    width: 40px;
    height: 40px;
    margin-bottom: 0.75rem;
  }

  .relic-name {
    font-size: 0.9rem;
  }

  .hover-overlay {
    display: none;
  }
}
</style>

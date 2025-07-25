<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import type { Relic } from '../types/relic'
import { useRelics } from '../composables/useRelics'
import BaseInput from './ui/BaseInput.vue'
import BaseCard from './ui/BaseCard.vue'
import BaseGrid from './ui/BaseGrid.vue'
import BaseButton from './ui/BaseButton.vue'

// Props
interface Props {
  modelValue?: string[]
  maxSelections?: number
  showSelected?: boolean
  allowSearch?: boolean
  allowFilters?: boolean
}

// Emits
interface Emits {
  (e: 'update:modelValue', value: string[]): void
  (e: 'selection-change', relics: Relic[]): void
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => [],
  maxSelections: 9,
  showSelected: true,
  allowSearch: true,
  allowFilters: true
})

const emit = defineEmits<Emits>()

// Use relics composable
const {
  relics,
  loading,
  error,
  categories,
  rarities,
  filters,
  updateFilters,
  searchRelics,
  fetchRelics,
  initialize
} = useRelics()

// Local selected relics
const selectedRelicIds = ref<string[]>([...props.modelValue])

// Computed selected relics
const selectedRelics = computed(() => {
  return relics.value.filter(relic => selectedRelicIds.value.includes(relic.id))
})

// Can add more relics
const canAddMore = computed(() => {
  return selectedRelicIds.value.length < props.maxSelections
})

// Selection count text
const selectionCountText = computed(() => {
  return `${selectedRelicIds.value.length} / ${props.maxSelections}`
})

// Handle relic selection toggle
const toggleRelicSelection = (relic: Relic) => {
  const isSelected = selectedRelicIds.value.includes(relic.id)
  
  if (isSelected) {
    selectedRelicIds.value = selectedRelicIds.value.filter(id => id !== relic.id)
  } else if (canAddMore.value) {
    selectedRelicIds.value = [...selectedRelicIds.value, relic.id]
  }
  
  emit('update:modelValue', selectedRelicIds.value)
  emit('selection-change', selectedRelics.value)
}

// Remove relic from selection
const removeRelic = (relicId: string) => {
  selectedRelicIds.value = selectedRelicIds.value.filter(id => id !== relicId)
  emit('update:modelValue', selectedRelicIds.value)
  emit('selection-change', selectedRelics.value)
}

// Clear all selections
const clearAll = () => {
  selectedRelicIds.value = []
  emit('update:modelValue', selectedRelicIds.value)
  emit('selection-change', selectedRelics.value)
}

// Check if relic is selected
const isRelicSelected = (relic: Relic): boolean => {
  return selectedRelicIds.value.includes(relic.id)
}

// Get rarity color class
const getRarityClass = (rarity: string): string => {
  switch (rarity.toLowerCase()) {
    case 'common': return 'rarity-common'
    case 'uncommon': return 'rarity-uncommon'
    case 'rare': return 'rarity-rare'
    case 'epic': return 'rarity-epic'
    case 'legendary': return 'rarity-legendary'
    case 'mythic': return 'rarity-mythic'
    default: return 'rarity-common'
  }
}

// Get category color class
const getCategoryClass = (category: string): string => {
  switch (category.toLowerCase()) {
    case 'weapon': return 'category-weapon'
    case 'armor': return 'category-armor'
    case 'accessory': return 'category-accessory'
    case 'consumable': return 'category-consumable'
    case 'special': return 'category-special'
    default: return 'category-common'
  }
}

// Handle search input
const handleSearch = (searchValue: string) => {
  searchRelics(searchValue)
}

// Handle filter changes
const handleCategoryFilter = (category: string) => {
  updateFilters({ category: category === 'all' ? '' : category })
}

const handleRarityFilter = (rarity: string) => {
  updateFilters({ rarity: rarity === 'all' ? '' : rarity })
}

// Watch for prop changes
watch(() => props.modelValue, (newValue) => {
  selectedRelicIds.value = [...newValue]
}, { deep: true })

// Initialize on mount
onMounted(async () => {
  await initialize()
})
</script>

<template>
  <div class="relic-selector">
    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>遺物データを読み込み中...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <p class="error-message">{{ error }}</p>
      <BaseButton @click="initialize" variant="outline" size="sm">
        再試行
      </BaseButton>
    </div>

    <!-- Main Content -->
    <div v-else class="relic-selector-content">
      <!-- Search and Filters -->
      <BaseCard v-if="allowSearch || allowFilters" class="filters-card" padding="md">
        <template #header>
          <div class="filters-header">
            <span>遺物選択</span>
            <span class="selection-count">{{ selectionCountText }}</span>
          </div>
        </template>

        <div class="filters-content">
          <!-- Search -->
          <BaseInput
            v-if="allowSearch"
            :model-value="filters.search"
            @update:model-value="handleSearch"
            placeholder="遺物名で検索..."
            size="md"
          >
            <template #prefix>
              🔍
            </template>
          </BaseInput>

          <!-- Filters -->
          <div v-if="allowFilters" class="filter-controls">
            <div class="filter-group">
              <label>カテゴリ:</label>
              <select 
                :value="filters.category || 'all'" 
                @change="handleCategoryFilter($event.target.value)"
                class="filter-select"
              >
                <option value="all">すべて</option>
                <option v-for="category in categories" :key="category" :value="category">
                  {{ category }}
                </option>
              </select>
            </div>
            
            <div class="filter-group">
              <label>レア度:</label>
              <select 
                :value="filters.rarity || 'all'" 
                @change="handleRarityFilter($event.target.value)"
                class="filter-select"
              >
                <option value="all">すべて</option>
                <option v-for="rarity in rarities" :key="rarity" :value="rarity">
                  {{ rarity }}
                </option>
              </select>
            </div>
          </div>
        </div>
      </BaseCard>

      <!-- Selected Relics Summary -->
      <BaseCard v-if="showSelected && selectedRelics.length > 0" class="selected-card" variant="filled">
        <template #header>
          <div class="selected-header">
            <span>選択済み遺物 ({{ selectedRelics.length }})</span>
            <BaseButton 
              v-if="selectedRelics.length > 0"
              @click="clearAll" 
              variant="ghost" 
              size="sm"
            >
              すべて解除
            </BaseButton>
          </div>
        </template>

        <div class="selected-relics">
          <div 
            v-for="relic in selectedRelics" 
            :key="relic.id"
            class="selected-relic-chip"
            @click="removeRelic(relic.id)"
          >
            <span class="relic-name">{{ relic.name }}</span>
            <span class="relic-rarity" :class="getRarityClass(relic.rarity)">
              {{ relic.rarity }}
            </span>
            <span class="remove-icon">×</span>
          </div>
        </div>
      </BaseCard>

      <!-- Available Relics -->
      <div class="relics-section">
        <BaseGrid 
          :cols="1" 
          gap="md" 
          :responsive="{ sm: 1, md: 2, lg: 3 }"
          class="relics-grid"
        >
          <BaseCard 
            v-for="relic in relics" 
            :key="relic.id"
            :class="['relic-card', { 
              'selected': isRelicSelected(relic),
              'disabled': !canAddMore && !isRelicSelected(relic)
            }]"
            :hover="!isRelicSelected(relic) && canAddMore"
            :clickable="canAddMore || isRelicSelected(relic)"
            @click="toggleRelicSelection(relic)"
            padding="md"
          >
            <template #header>
              <div class="relic-header">
                <h4 class="relic-name">{{ relic.name }}</h4>
                <div class="relic-badges">
                  <span :class="['rarity-badge', getRarityClass(relic.rarity)]">
                    {{ relic.rarity }}
                  </span>
                  <span :class="['category-badge', getCategoryClass(relic.category)]">
                    {{ relic.category }}
                  </span>
                </div>
              </div>
            </template>

            <div class="relic-content">
              <p v-if="relic.description" class="relic-description">
                {{ relic.description }}
              </p>
              
              <div class="relic-effects">
                <div 
                  v-for="effect in relic.effects" 
                  :key="effect.id"
                  class="effect-item"
                >
                  <div class="effect-header">
                    <strong class="effect-name">{{ effect.name }}</strong>
                    <span class="effect-value">{{ effect.value }}%</span>
                  </div>
                  <p v-if="effect.description" class="effect-description">
                    {{ effect.description }}
                  </p>
                </div>
              </div>

              <div class="relic-meta">
                <span class="difficulty-rating">
                  難易度: {{ relic.obtainmentDifficulty }}/10
                </span>
              </div>
            </div>

            <template #footer>
              <div class="relic-actions">
                <BaseButton
                  v-if="isRelicSelected(relic)"
                  @click.stop="removeRelic(relic.id)"
                  variant="danger"
                  size="sm"
                  full-width
                >
                  選択解除
                </BaseButton>
                <BaseButton
                  v-else-if="canAddMore"
                  @click.stop="toggleRelicSelection(relic)"
                  variant="primary"
                  size="sm"
                  full-width
                >
                  選択
                </BaseButton>
                <BaseButton
                  v-else
                  variant="secondary"
                  size="sm"
                  disabled
                  full-width
                >
                  選択上限
                </BaseButton>
              </div>
            </template>
          </BaseCard>
        </BaseGrid>

        <!-- No results message -->
        <div v-if="relics.length === 0" class="no-results">
          <p>検索条件に一致する遺物が見つかりません。</p>
          <BaseButton @click="initialize" variant="outline">
            リロード
          </BaseButton>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.relic-selector {
  width: 100%;
}

/* Loading and Error States */
.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  text-align: center;
}

.spinner {
  width: 2rem;
  height: 2rem;
  border: 2px solid #e5e7eb;
  border-top: 2px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error-message {
  color: #ef4444;
  margin-bottom: 1rem;
}

/* Main Content */
.relic-selector-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Filters */
.filters-card {
  margin-bottom: 0;
}

.filters-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.selection-count {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: normal;
}

.filters-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.filter-controls {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-group label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.filter-select {
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  background-color: white;
  font-size: 0.875rem;
  transition: border-color 0.2s ease-in-out;
}

.filter-select:focus {
  outline: 2px solid #3b82f6;
  outline-offset: -2px;
  border-color: #3b82f6;
}

/* Selected Relics */
.selected-card {
  margin-bottom: 0;
}

.selected-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.selected-relics {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.selected-relic-chip {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: #3b82f6;
  color: white;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
}

.selected-relic-chip:hover {
  background: #2563eb;
  transform: translateY(-1px);
}

.relic-name {
  font-weight: 500;
}

.relic-rarity {
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.remove-icon {
  font-weight: bold;
  font-size: 1rem;
  opacity: 0.8;
}

.remove-icon:hover {
  opacity: 1;
}

/* Relics Grid */
.relics-section {
  flex: 1;
}

.relics-grid {
  margin-bottom: 2rem;
}

.relic-card {
  height: 100%;
  transition: all 0.2s ease-in-out;
}

.relic-card.selected {
  border-color: #10b981;
  box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
}

.relic-card.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.relic-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.relic-header .relic-name {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  flex: 1;
}

.relic-badges {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.rarity-badge,
.category-badge {
  padding: 0.125rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-align: center;
  text-transform: uppercase;
}

/* Rarity Colors */
.rarity-common { background: #9ca3af; color: white; }
.rarity-uncommon { background: #10b981; color: white; }
.rarity-rare { background: #3b82f6; color: white; }
.rarity-epic { background: #8b5cf6; color: white; }
.rarity-legendary { background: #f59e0b; color: white; }
.rarity-mythic { background: #ef4444; color: white; }

/* Category Colors */
.category-weapon { background: #dc2626; color: white; }
.category-armor { background: #059669; color: white; }
.category-accessory { background: #7c3aed; color: white; }
.category-consumable { background: #0891b2; color: white; }
.category-special { background: #ea580c; color: white; }
.category-common { background: #6b7280; color: white; }

/* Relic Content */
.relic-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  flex: 1;
}

.relic-description {
  color: #6b7280;
  font-size: 0.875rem;
  line-height: 1.5;
  margin: 0;
}

.relic-effects {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.effect-item {
  padding: 0.75rem;
  background: #f9fafb;
  border-radius: 0.375rem;
  border-left: 3px solid #3b82f6;
}

.effect-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.25rem;
}

.effect-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: #111827;
}

.effect-value {
  font-size: 0.875rem;
  font-weight: 700;
  color: #059669;
}

.effect-description {
  font-size: 0.75rem;
  color: #6b7280;
  line-height: 1.4;
  margin: 0;
}

.relic-meta {
  padding-top: 0.75rem;
  border-top: 1px solid #e5e7eb;
}

.difficulty-rating {
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 500;
}

/* Actions */
.relic-actions {
  margin-top: auto;
}

/* No Results */
.no-results {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 3rem 1rem;
  text-align: center;
  color: #6b7280;
}

/* Responsive Design */
@media (max-width: 640px) {
  .filter-controls {
    grid-template-columns: 1fr;
  }
  
  .selected-relics {
    gap: 0.5rem;
  }
  
  .selected-relic-chip {
    padding: 0.375rem 0.5rem;
    font-size: 0.75rem;
  }
  
  .relic-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }
  
  .relic-badges {
    flex-direction: row;
    gap: 0.5rem;
  }
}

/* Dark Mode Support */
@media (prefers-color-scheme: dark) {
  .filter-select {
    background-color: #374151;
    border-color: #4b5563;
    color: #f9fafb;
  }
  
  .effect-item {
    background: #374151;
  }
  
  .relic-header .relic-name {
    color: #f9fafb;
  }
  
  .relic-meta {
    border-color: #4b5563;
  }
}
</style>
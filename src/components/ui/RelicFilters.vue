<template>
  <div class="relic-filters">
    <!-- Search Input -->
    <div class="filter-section">
      <label class="filter-label">Search</label>
      <div class="search-input-container">
        <input
          v-model="internalFilters.search"
          type="text"
          class="search-input"
          placeholder="Search relics by name or description..."
          @input="handleSearchChange"
        />
        <div class="search-icon">
          <SearchIcon />
        </div>
        <button
          v-if="internalFilters.search"
          @click="clearSearch"
          class="clear-search-btn"
          aria-label="Clear search"
        >
          <CloseIcon />
        </button>
      </div>
    </div>

    <!-- Quick Filters -->
    <div class="filter-section">
      <label class="filter-label">Quick Filters</label>
      <div class="quick-filters">
        <button
          v-for="quickFilter in quickFilters"
          :key="quickFilter.key"
          :class="['quick-filter-btn', { active: isQuickFilterActive(quickFilter.key) }]"
          @click="toggleQuickFilter(quickFilter.key)"
        >
          <component :is="quickFilter.icon" class="filter-icon" />
          {{ quickFilter.label }}
        </button>
      </div>
    </div>

    <!-- Category Filter -->
    <div class="filter-section">
      <label class="filter-label">Categories</label>
      <div class="filter-grid">
        <label
          v-for="category in availableCategories"
          :key="category"
          class="filter-checkbox-label"
        >
          <input
            v-model="internalFilters.categories"
            :value="category"
            type="checkbox"
            class="filter-checkbox"
          />
          <span class="checkbox-custom"></span>
          <span :class="['category-text', `category-${category.toLowerCase()}`]">
            {{ category }}
          </span>
        </label>
      </div>
    </div>

    <!-- Rarity Filter -->
    <div class="filter-section">
      <label class="filter-label">Rarities</label>
      <div class="rarity-filters">
        <label
          v-for="rarity in availableRarities"
          :key="rarity"
          :class="['rarity-filter-label', `rarity-${rarity}`]"
        >
          <input
            v-model="internalFilters.rarities"
            :value="rarity"
            type="checkbox"
            class="rarity-checkbox"
          />
          <span :class="['rarity-badge', `rarity-${rarity}`]">
            {{ formatRarity(rarity) }}
          </span>
        </label>
      </div>
    </div>

    <!-- Quality Filter -->
    <div class="filter-section">
      <label class="filter-label">Quality</label>
      <div class="quality-filters">
        <label
          v-for="quality in availableQualities"
          :key="quality"
          class="quality-filter-label"
        >
          <input
            v-model="internalFilters.qualities"
            :value="quality"
            type="checkbox"
            class="quality-checkbox"
          />
          <span :class="['quality-badge', `quality-${quality.toLowerCase()}`]">
            {{ quality }}
          </span>
        </label>
      </div>
    </div>

    <!-- Difficulty Range -->
    <div class="filter-section">
      <label class="filter-label">
        Difficulty Range: {{ internalFilters.difficultyRange[0] }} - {{ internalFilters.difficultyRange[1] }}
      </label>
      <div class="difficulty-range-container">
        <input
          v-model.number="internalFilters.difficultyRange[0]"
          type="range"
          min="1"
          max="10"
          class="range-input"
          @input="handleDifficultyChange"
        />
        <input
          v-model.number="internalFilters.difficultyRange[1]"
          type="range"
          min="1"
          max="10"
          class="range-input"
          @input="handleDifficultyChange"
        />
      </div>
      <div class="range-labels">
        <span>Easy (1)</span>
        <span>Hard (10)</span>
      </div>
    </div>

    <!-- Effect Type Filter -->
    <div class="filter-section">
      <label class="filter-label">Effect Types</label>
      <div class="effect-type-filters">
        <label
          v-for="effectType in availableEffectTypes"
          :key="effectType.value"
          class="effect-type-label"
        >
          <input
            v-model="internalFilters.effectTypes"
            :value="effectType.value"
            type="checkbox"
            class="effect-type-checkbox"
          />
          <span class="effect-type-text">
            {{ effectType.label }}
          </span>
        </label>
      </div>
    </div>

    <!-- Advanced Filters (Collapsible) -->
    <div class="filter-section">
      <button
        @click="showAdvanced = !showAdvanced"
        class="advanced-toggle"
      >
        <span>Advanced Filters</span>
        <ChevronIcon :class="{ rotated: showAdvanced }" />
      </button>
      
      <div v-if="showAdvanced" class="advanced-filters">
        <!-- Has Conditions Filter -->
        <label class="filter-checkbox-label">
          <input
            v-model="internalFilters.hasConditions"
            type="checkbox"
            class="filter-checkbox"
          />
          <span class="checkbox-custom"></span>
          <span>Has Conditional Effects</span>
        </label>

        <!-- Has Conflicts Filter -->
        <label class="filter-checkbox-label">
          <input
            v-model="internalFilters.hasConflicts"
            type="checkbox"
            class="filter-checkbox"
          />
          <span class="checkbox-custom"></span>
          <span>Has Conflicts with Other Relics</span>
        </label>

        <!-- Sort By -->
        <div class="sort-section">
          <label class="filter-label">Sort By</label>
          <select
            v-model="internalFilters.sortBy"
            class="sort-select"
            @change="handleSortChange"
          >
            <option value="name">Name</option>
            <option value="rarity">Rarity</option>
            <option value="difficulty">Difficulty</option>
            <option value="category">Category</option>
            <option value="effectCount">Effect Count</option>
          </select>
          
          <button
            @click="toggleSortOrder"
            :class="['sort-order-btn', internalFilters.sortOrder]"
            :title="`Sort ${internalFilters.sortOrder === 'asc' ? 'Ascending' : 'Descending'}`"
          >
            <SortIcon />
          </button>
        </div>
      </div>
    </div>

    <!-- Filter Actions -->
    <div class="filter-actions">
      <button @click="resetFilters" class="reset-btn">
        <ResetIcon />
        Reset All
      </button>
      
      <button @click="saveFilters" class="save-btn">
        <SaveIcon />
        Save Preset
      </button>
    </div>

    <!-- Active Filters Summary -->
    <div v-if="hasActiveFilters" class="active-filters">
      <span class="active-filters-label">Active Filters:</span>
      <div class="active-filter-tags">
        <span
          v-for="tag in activeFilterTags"
          :key="tag.key"
          class="active-filter-tag"
          @click="removeFilter(tag.key, tag.value)"
        >
          {{ tag.label }}
          <CloseIcon class="remove-filter-icon" />
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import type { RelicCategory, RelicRarity, EffectType } from '../../types/relic'

// Props
interface Props {
  modelValue?: RelicFilters
  availableCategories?: RelicCategory[]
  availableRarities?: RelicRarity[]
  availableQualities?: string[]
  availableEffectTypes?: Array<{ value: EffectType; label: string }>
}

interface RelicFilters {
  search: string
  categories: RelicCategory[]
  rarities: RelicRarity[]
  qualities: string[]
  difficultyRange: [number, number]
  effectTypes: EffectType[]
  hasConditions: boolean
  hasConflicts: boolean
  sortBy: string
  sortOrder: 'asc' | 'desc'
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => ({
    search: '',
    categories: [],
    rarities: [],
    qualities: [],
    difficultyRange: [1, 10],
    effectTypes: [],
    hasConditions: false,
    hasConflicts: false,
    sortBy: 'name',
    sortOrder: 'asc'
  }),
  availableCategories: () => ['Attack', 'Defense', 'Utility', 'Critical', 'Elemental'],
  availableRarities: () => ['common', 'rare', 'epic', 'legendary'],
  availableQualities: () => ['Delicate', 'Polished', 'Grand'],
  availableEffectTypes: () => [
    { value: 'attack_multiplier', label: 'Attack Multiplier' },
    { value: 'attack_percentage', label: 'Attack Percentage' },
    { value: 'critical_multiplier', label: 'Critical Multiplier' },
    { value: 'critical_chance', label: 'Critical Chance' },
    { value: 'conditional_damage', label: 'Conditional Damage' },
    { value: 'weapon_specific', label: 'Weapon Specific' }
  ]
})

// Emits
const emit = defineEmits<{
  'update:modelValue': [filters: RelicFilters]
  'filtersChanged': [filters: RelicFilters]
}>()

// State
const internalFilters = ref<RelicFilters>({ ...props.modelValue })
const showAdvanced = ref(false)

// Quick filters configuration
const quickFilters = [
  { key: 'legendary', label: 'Legendary', icon: 'StarIcon' },
  { key: 'highDifficulty', label: 'High Difficulty', icon: 'FireIcon' },
  { key: 'attackRelics', label: 'Attack Relics', icon: 'SwordIcon' },
  { key: 'criticalRelics', label: 'Critical Relics', icon: 'TargetIcon' }
]

// Computed
const hasActiveFilters = computed(() => {
  return internalFilters.value.search.length > 0 ||
    internalFilters.value.categories.length > 0 ||
    internalFilters.value.rarities.length > 0 ||
    internalFilters.value.qualities.length > 0 ||
    internalFilters.value.effectTypes.length > 0 ||
    internalFilters.value.difficultyRange[0] > 1 ||
    internalFilters.value.difficultyRange[1] < 10 ||
    internalFilters.value.hasConditions ||
    internalFilters.value.hasConflicts
})

const activeFilterTags = computed(() => {
  const tags: Array<{ key: string; value: any; label: string }> = []
  
  if (internalFilters.value.search) {
    tags.push({
      key: 'search',
      value: internalFilters.value.search,
      label: `Search: "${internalFilters.value.search}"`
    })
  }
  
  internalFilters.value.categories.forEach(category => {
    tags.push({
      key: 'categories',
      value: category,
      label: `Category: ${category}`
    })
  })
  
  internalFilters.value.rarities.forEach(rarity => {
    tags.push({
      key: 'rarities',
      value: rarity,
      label: `Rarity: ${formatRarity(rarity)}`
    })
  })
  
  return tags
})

// Methods
const handleSearchChange = () => {
  emitFilters()
}

const handleDifficultyChange = () => {
  // Ensure min <= max
  if (internalFilters.value.difficultyRange[0] > internalFilters.value.difficultyRange[1]) {
    internalFilters.value.difficultyRange[1] = internalFilters.value.difficultyRange[0]
  }
  emitFilters()
}

const handleSortChange = () => {
  emitFilters()
}

const toggleSortOrder = () => {
  internalFilters.value.sortOrder = internalFilters.value.sortOrder === 'asc' ? 'desc' : 'asc'
  emitFilters()
}

const isQuickFilterActive = (filterKey: string): boolean => {
  switch (filterKey) {
    case 'legendary':
      return internalFilters.value.rarities.includes('legendary')
    case 'highDifficulty':
      return internalFilters.value.difficultyRange[0] >= 7
    case 'attackRelics':
      return internalFilters.value.categories.includes('Attack')
    case 'criticalRelics':
      return internalFilters.value.categories.includes('Critical')
    default:
      return false
  }
}

const toggleQuickFilter = (filterKey: string) => {
  switch (filterKey) {
    case 'legendary':
      if (internalFilters.value.rarities.includes('legendary')) {
        internalFilters.value.rarities = internalFilters.value.rarities.filter(r => r !== 'legendary')
      } else {
        internalFilters.value.rarities.push('legendary')
      }
      break
    case 'highDifficulty':
      if (internalFilters.value.difficultyRange[0] >= 7) {
        internalFilters.value.difficultyRange = [1, 10]
      } else {
        internalFilters.value.difficultyRange = [7, 10]
      }
      break
    case 'attackRelics':
      if (internalFilters.value.categories.includes('Attack')) {
        internalFilters.value.categories = internalFilters.value.categories.filter(c => c !== 'Attack')
      } else {
        internalFilters.value.categories.push('Attack')
      }
      break
    case 'criticalRelics':
      if (internalFilters.value.categories.includes('Critical')) {
        internalFilters.value.categories = internalFilters.value.categories.filter(c => c !== 'Critical')
      } else {
        internalFilters.value.categories.push('Critical')
      }
      break
  }
  emitFilters()
}

const clearSearch = () => {
  internalFilters.value.search = ''
  emitFilters()
}

const resetFilters = () => {
  internalFilters.value = {
    search: '',
    categories: [],
    rarities: [],
    qualities: [],
    difficultyRange: [1, 10],
    effectTypes: [],
    hasConditions: false,
    hasConflicts: false,
    sortBy: 'name',
    sortOrder: 'asc'
  }
  emitFilters()
}

const saveFilters = () => {
  // TODO: Implement filter preset saving
  console.log('Save filter preset:', internalFilters.value)
}

const removeFilter = (key: string, value: any) => {
  switch (key) {
    case 'search':
      internalFilters.value.search = ''
      break
    case 'categories':
      internalFilters.value.categories = internalFilters.value.categories.filter(c => c !== value)
      break
    case 'rarities':
      internalFilters.value.rarities = internalFilters.value.rarities.filter(r => r !== value)
      break
  }
  emitFilters()
}

const formatRarity = (rarity: string): string => {
  return rarity.charAt(0).toUpperCase() + rarity.slice(1)
}

const emitFilters = () => {
  emit('update:modelValue', { ...internalFilters.value })
  emit('filtersChanged', { ...internalFilters.value })
}

// Watch for external changes
watch(() => props.modelValue, (newValue) => {
  internalFilters.value = { ...newValue }
}, { deep: true })

// Watch internal changes
watch(internalFilters, () => {
  emitFilters()
}, { deep: true })

// Icon components (simplified)
const SearchIcon = { template: `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/></svg>` }
const CloseIcon = { template: `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/></svg>` }
const ChevronIcon = { template: `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path fill-rule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"/></svg>` }
const ResetIcon = { template: `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path fill-rule="evenodd" d="M8 3a5 5 0 1 1-4.546 2.914.5.5 0 0 0-.908-.417A6 6 0 1 0 8 2v1z"/><path d="M8 4.466V.534a.25.25 0 0 0-.41-.192L5.23 2.308a.25.25 0 0 0 0 .384l2.36 1.966A.25.25 0 0 0 8 4.466z"/></svg>` }
const SaveIcon = { template: `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M2 1a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H9.5a1 1 0 0 0-1 1v7.293l2.646-2.647a.5.5 0 0 1 .708.708l-3.5 3.5a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L7.5 9.293V2a2 2 0 0 1 2-2H14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h2.5a.5.5 0 0 1 0 1H2z"/></svg>` }
const SortIcon = { template: `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M3.5 2.5a.5.5 0 0 0-1 0v8.793l-1.146-1.147a.5.5 0 0 0-.708.708l2 1.999.007.007a.497.497 0 0 0 .7-.006l2-2a.5.5 0 0 0-.707-.708L3.5 11.293V2.5zm3.5 1a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zM7.5 6a.5.5 0 0 0 0 1h5a.5.5 0 0 0 0-1h-5zm0 3a.5.5 0 0 0 0 1h3a.5.5 0 0 0 0-1h-3zm0 3a.5.5 0 0 0 0 1h1a.5.5 0 0 0 0-1h-1z"/></svg>` }
</script>

<style scoped>
.relic-filters {
  background: white;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.filter-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.filter-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

/* Search Input */
.search-input-container {
  position: relative;
}

.search-input {
  width: 100%;
  padding: 0.75rem 2.5rem 0.75rem 2.5rem;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 0.875rem;
}

.search-icon {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
}

.clear-search-btn {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 0.25rem;
}

/* Quick Filters */
.quick-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.quick-filter-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 20px;
  background: white;
  color: var(--text-secondary);
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s;
}

.quick-filter-btn:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.quick-filter-btn.active {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.filter-icon {
  width: 14px;
  height: 14px;
}

/* Filter Grid */
.filter-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 0.75rem;
}

.filter-checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.filter-checkbox-label:hover {
  background: var(--gray-50);
}

.filter-checkbox {
  display: none;
}

.checkbox-custom {
  width: 16px;
  height: 16px;
  border: 2px solid var(--border-color);
  border-radius: 3px;
  position: relative;
  transition: all 0.2s;
}

.filter-checkbox:checked + .checkbox-custom {
  background: var(--primary-color);
  border-color: var(--primary-color);
}

.filter-checkbox:checked + .checkbox-custom::after {
  content: '✓';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-size: 10px;
  font-weight: bold;
}

.category-text {
  font-size: 0.8rem;
  font-weight: 500;
}

/* Rarity Filters */
.rarity-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.rarity-filter-label {
  cursor: pointer;
  position: relative;
}

.rarity-checkbox {
  display: none;
}

.rarity-badge {
  display: inline-block;
  padding: 0.5rem 0.75rem;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  border: 2px solid transparent;
  transition: all 0.2s;
  opacity: 0.6;
}

.rarity-checkbox:checked + .rarity-badge {
  opacity: 1;
  border-color: white;
  box-shadow: 0 0 0 2px var(--primary-color);
}

/* Quality Filters */
.quality-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.quality-filter-label {
  cursor: pointer;
}

.quality-checkbox {
  display: none;
}

.quality-badge {
  display: inline-block;
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
  font-size: 0.7rem;
  font-weight: 600;
  border: 2px solid var(--border-color);
  background: white;
  color: var(--text-primary);
  transition: all 0.2s;
}

.quality-checkbox:checked + .quality-badge {
  border-color: var(--primary-color);
  background: var(--primary-color);
  color: white;
}

/* Difficulty Range */
.difficulty-range-container {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.range-input {
  flex: 1;
  height: 6px;
  border-radius: 3px;
  background: var(--gray-200);
  outline: none;
  -webkit-appearance: none;
}

.range-input::-webkit-slider-thumb {
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--primary-color);
  cursor: pointer;
}

.range-input::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--primary-color);
  cursor: pointer;
  border: none;
}

.range-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 0.5rem;
  font-size: 0.75rem;
  color: var(--text-muted);
}

/* Effect Type Filters */
.effect-type-filters {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0.5rem;
}

.effect-type-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 4px;
  transition: background-color 0.2s;
  font-size: 0.8rem;
}

.effect-type-label:hover {
  background: var(--gray-50);
}

.effect-type-checkbox {
  display: none;
}

.effect-type-text {
  position: relative;
}

.effect-type-checkbox:checked + .effect-type-text {
  color: var(--primary-color);
  font-weight: 600;
}

.effect-type-checkbox:checked + .effect-type-text::before {
  content: '✓ ';
  color: var(--primary-color);
  font-weight: bold;
}

/* Advanced Filters */
.advanced-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 0.75rem;
  background: var(--gray-50);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.advanced-toggle:hover {
  background: var(--gray-100);
}

.advanced-toggle .rotated {
  transform: rotate(180deg);
}

.advanced-filters {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 0.75rem;
  padding: 1rem;
  background: var(--gray-50);
  border-radius: 6px;
}

/* Sort Section */
.sort-section {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.sort-select {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-size: 0.8rem;
}

.sort-order-btn {
  padding: 0.5rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
}

.sort-order-btn:hover {
  background: var(--gray-50);
}

.sort-order-btn.desc {
  transform: rotate(180deg);
}

/* Filter Actions */
.filter-actions {
  display: flex;
  gap: 0.75rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
}

.reset-btn,
.save-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.reset-btn {
  background: white;
  color: var(--text-secondary);
}

.reset-btn:hover {
  background: var(--gray-50);
  color: var(--danger-color);
  border-color: var(--danger-color);
}

.save-btn {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.save-btn:hover {
  background: #2980b9;
}

/* Active Filters */
.active-filters {
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
}

.active-filters-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
  display: block;
}

.active-filter-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.active-filter-tag {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.5rem;
  background: var(--primary-color);
  color: white;
  border-radius: 12px;
  font-size: 0.7rem;
  cursor: pointer;
  transition: all 0.2s;
}

.active-filter-tag:hover {
  background: #2980b9;
}

.remove-filter-icon {
  width: 12px;
  height: 12px;
}

/* Rarity Colors */
.rarity-common { background: #95a5a6; color: white; }
.rarity-rare { background: #3498db; color: white; }
.rarity-epic { background: #9b59b6; color: white; }
.rarity-legendary { background: #f39c12; color: white; }

/* Category Colors */
.category-attack { color: #e74c3c; }
.category-defense { color: #27ae60; }
.category-utility { color: #3498db; }
.category-critical { color: #f39c12; }
.category-elemental { color: #9b59b6; }

/* Quality Colors */
.quality-delicate { background: #bdc3c7; color: #2c3e50; }
.quality-polished { background: #3498db; color: white; }
.quality-grand { background: #f39c12; color: white; }

/* Responsive */
@media (max-width: 768px) {
  .relic-filters {
    padding: 1rem;
  }
  
  .filter-grid {
    grid-template-columns: 1fr;
  }
  
  .quick-filters {
    flex-direction: column;
  }
  
  .quick-filter-btn {
    justify-content: flex-start;
  }
  
  .difficulty-range-container {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .effect-type-filters {
    grid-template-columns: 1fr;
  }
  
  .filter-actions {
    flex-direction: column;
  }
}
</style>
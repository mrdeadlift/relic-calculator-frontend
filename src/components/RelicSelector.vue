<script setup lang="ts">
import { ref } from 'vue'
import type { Relic } from '../types/relic'

// Props
interface Props {
  availableRelics: Relic[]
  selectedRelics: Relic[]
}

// Emits
interface Emits {
  selectionChange: [selectedRelics: Relic[]]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Local state
const searchTerm = ref('')
const selectedCategory = ref<string>('all')
const selectedQuality = ref<string>('all')

// Filter relics based on search and filters
const filteredRelics = ref(
  props.availableRelics.filter(relic => {
    const matchesSearch = relic.name.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
                         relic.effects.some(effect => 
                           effect.name.toLowerCase().includes(searchTerm.value.toLowerCase())
                         )
    const matchesCategory = selectedCategory.value === 'all' || relic.category === selectedCategory.value
    const matchesQuality = selectedQuality.value === 'all' || relic.quality === selectedQuality.value
    
    return matchesSearch && matchesCategory && matchesQuality
  })
)

// Watch for filter changes and update filtered relics
const updateFilters = () => {
  filteredRelics.value = props.availableRelics.filter(relic => {
    const matchesSearch = relic.name.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
                         relic.effects.some(effect => 
                           effect.name.toLowerCase().includes(searchTerm.value.toLowerCase())
                         )
    const matchesCategory = selectedCategory.value === 'all' || relic.category === selectedCategory.value
    const matchesQuality = selectedQuality.value === 'all' || relic.quality === selectedQuality.value
    
    return matchesSearch && matchesCategory && matchesQuality
  })
}

// Handle relic selection toggle
const toggleRelicSelection = (relic: Relic) => {
  const isSelected = props.selectedRelics.some(selected => selected.id === relic.id)
  let newSelection: Relic[]
  
  if (isSelected) {
    newSelection = props.selectedRelics.filter(selected => selected.id !== relic.id)
  } else {
    newSelection = [...props.selectedRelics, relic]
  }
  
  emit('selectionChange', newSelection)
}

// Check if relic is selected
const isRelicSelected = (relic: Relic): boolean => {
  return props.selectedRelics.some(selected => selected.id === relic.id)
}

// Get quality badge class
const getQualityClass = (quality: string): string => {
  switch (quality) {
    case 'Delicate': return 'quality-delicate'
    case 'Polished': return 'quality-polished'
    case 'Grand': return 'quality-grand'
    default: return 'quality-common'
  }
}

// Get category badge class
const getCategoryClass = (category: string): string => {
  switch (category) {
    case 'Attack': return 'category-attack'
    case 'Defense': return 'category-defense'
    case 'Critical': return 'category-critical'
    case 'Elemental': return 'category-elemental'
    case 'Utility': return 'category-utility'
    default: return 'category-common'
  }
}
</script>

<template>
  <div class="relic-selector">
    <!-- Search and Filters -->
    <div class="filters-section">
      <div class="search-box">
        <input 
          type="text" 
          v-model="searchTerm"
          @input="updateFilters"
          placeholder="遺物を検索..."
          class="search-input"
        />
      </div>
      
      <div class="filter-controls">
        <div class="filter-group">
          <label>カテゴリ:</label>
          <select v-model="selectedCategory" @change="updateFilters">
            <option value="all">すべて</option>
            <option value="Attack">攻撃</option>
            <option value="Defense">防御</option>
            <option value="Critical">クリティカル</option>
            <option value="Elemental">属性</option>
            <option value="Utility">ユーティリティ</option>
          </select>
        </div>
        
        <div class="filter-group">
          <label>品質:</label>
          <select v-model="selectedQuality" @change="updateFilters">
            <option value="all">すべて</option>
            <option value="Delicate">デリケート</option>
            <option value="Polished">ポリッシュ</option>
            <option value="Grand">グランド</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Selected Relics Summary -->
    <div v-if="selectedRelics.length > 0" class="selected-summary">
      <h4>選択済み遺物 ({{ selectedRelics.length }})</h4>
      <div class="selected-relics">
        <div 
          v-for="relic in selectedRelics" 
          :key="relic.id"
          class="selected-relic-chip"
          @click="toggleRelicSelection(relic)"
        >
          {{ relic.name }}
          <span class="remove-icon">×</span>
        </div>
      </div>
    </div>

    <!-- Available Relics -->
    <div class="relics-list">
      <div 
        v-for="relic in filteredRelics" 
        :key="relic.id"
        class="relic-card"
        :class="{ 'selected': isRelicSelected(relic) }"
        @click="toggleRelicSelection(relic)"
      >
        <div class="relic-header">
          <h4 class="relic-name">{{ relic.name }}</h4>
          <div class="relic-badges">
            <span :class="['quality-badge', getQualityClass(relic.quality)]">
              {{ relic.quality }}
            </span>
            <span :class="['category-badge', getCategoryClass(relic.category)]">
              {{ relic.category }}
            </span>
          </div>
        </div>
        
        <div class="relic-effects">
          <div 
            v-for="effect in relic.effects" 
            :key="effect.id"
            class="effect-item"
          >
            <strong>{{ effect.name }}:</strong>
            <span class="effect-description">{{ effect.description }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- No results message -->
    <div v-if="filteredRelics.length === 0" class="no-results">
      <p>検索条件に一致する遺物が見つかりません。</p>
    </div>
  </div>
</template>

<style scoped>
.relic-selector {
  width: 100%;
}

.filters-section {
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: white;
  border-radius: 6px;
  border: 1px solid #e0e0e0;
}

.search-box {
  margin-bottom: 1rem;
}

.search-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.filter-controls {
  display: flex;
  gap: 1rem;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
}

.filter-group label {
  font-weight: 600;
  color: #555;
  font-size: 0.9rem;
}

.filter-group select {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9rem;
}

.selected-summary {
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: #e8f5e8;
  border-radius: 6px;
  border: 1px solid #c3e6c3;
}

.selected-summary h4 {
  margin-bottom: 0.5rem;
  color: #2d5a2d;
}

.selected-relics {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.selected-relic-chip {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.75rem;
  background: #4caf50;
  color: white;
  border-radius: 20px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
}

.selected-relic-chip:hover {
  background: #45a049;
}

.remove-icon {
  font-weight: bold;
  font-size: 1.2rem;
}

.relics-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.relic-card {
  padding: 1rem;
  background: white;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.relic-card:hover {
  border-color: #3498db;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.relic-card.selected {
  border-color: #4caf50;
  background: #f8fff8;
}

.relic-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.75rem;
}

.relic-name {
  margin: 0;
  color: #2c3e50;
  font-size: 1.1rem;
}

.relic-badges {
  display: flex;
  gap: 0.5rem;
}

.quality-badge, .category-badge {
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
}

.quality-delicate { background: #f39c12; color: white; }
.quality-polished { background: #3498db; color: white; }
.quality-grand { background: #9b59b6; color: white; }

.category-attack { background: #e74c3c; color: white; }
.category-defense { background: #2ecc71; color: white; }
.category-critical { background: #f1c40f; color: #333; }
.category-elemental { background: #1abc9c; color: white; }
.category-utility { background: #95a5a6; color: white; }

.relic-effects {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.effect-item {
  font-size: 0.9rem;
  line-height: 1.4;
}

.effect-description {
  color: #666;
  margin-left: 0.5rem;
}

.no-results {
  text-align: center;
  padding: 2rem;
  color: #666;
  font-style: italic;
}

@media (max-width: 768px) {
  .filter-controls {
    flex-direction: column;
  }
  
  .relic-header {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .relic-badges {
    align-self: flex-start;
  }
}
</style>
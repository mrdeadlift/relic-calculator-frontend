<template>
  <div class="build-comparison">
    <!-- Header Section -->
    <BaseCard class="comparison-header" padding="lg">
      <template #header>
        <div class="header-content">
          <h2 class="comparison-title">
            <ComparisonIcon />
            Build Comparison & Optimization
          </h2>
          <div class="header-actions">
            <button
              :disabled="comparisonBuilds.length === 0"
              class="action-btn secondary"
              title="Clear all builds"
              @click="clearAllBuilds"
            >
              <ClearIcon />
              Clear All
            </button>
            <button
              :disabled="comparisonBuilds.length < 2"
              class="action-btn primary"
              title="Optimize builds"
              @click="optimizeBuilds"
            >
              <OptimizeIcon />
              Optimize
            </button>
            <button
              :disabled="comparisonBuilds.length === 0"
              class="action-btn secondary"
              title="Export comparison"
              @click="exportComparison"
            >
              <ExportIcon />
              Export
            </button>
          </div>
        </div>
      </template>

      <!-- Quick Stats -->
      <div v-if="comparisonBuilds.length > 0" class="comparison-stats">
        <div class="stat-item">
          <span class="stat-label">Builds Compared:</span>
          <span class="stat-value"
            >{{ comparisonBuilds.length }} / {{ maxBuilds }}</span
          >
        </div>
        <div class="stat-item">
          <span class="stat-label">Best Multiplier:</span>
          <span class="stat-value best">{{
            formatMultiplier(bestMultiplier)
          }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Average Multiplier:</span>
          <span class="stat-value">{{
            formatMultiplier(averageMultiplier)
          }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Range:</span>
          <span class="stat-value">{{
            formatMultiplier(multiplierRange)
          }}</span>
        </div>
      </div>
    </BaseCard>

    <!-- Build Selection Area -->
    <BaseCard class="build-selection" padding="lg">
      <template #header>
        <h3 class="selection-title">
          <SelectIcon />
          Select Builds to Compare
        </h3>
      </template>

      <!-- Add Build Slots -->
      <div class="build-slots">
        <div
          v-for="(build, index) in buildSlots"
          :key="index"
          :class="[
            'build-slot',
            {
              occupied: build !== null,
              dragging: dragOverSlot === index,
            },
          ]"
          @drop="handleDrop($event, index)"
          @dragover.prevent="dragOverSlot = index"
          @dragleave="dragOverSlot = -1"
        >
          <!-- Occupied Slot -->
          <div v-if="build" class="occupied-slot">
            <div class="build-info">
              <div class="build-header">
                <h4 class="build-name">{{ build.name }}</h4>
                <button
                  class="remove-btn"
                  title="Remove build"
                  @click="removeBuild(index)"
                >
                  <RemoveIcon />
                </button>
              </div>
              <div class="build-meta">
                <span class="multiplier">{{
                  formatMultiplier(build.attackMultiplier || 0)
                }}</span>
                <span class="relic-count"
                  >{{ build.relics?.length || 0 }} relics</span
                >
                <span :class="['rating', 'rating-' + getBuildRating(build)]">
                  {{ getBuildRating(build) }}
                </span>
              </div>
            </div>
            <div class="build-preview">
              <div class="relics-preview">
                <div
                  v-for="relic in (build.relics || []).slice(0, 4)"
                  :key="relic.id"
                  :class="['relic-icon', `rarity-${relic.rarity}`]"
                  :title="relic.name"
                >
                  {{ relic.name.charAt(0) }}
                </div>
                <div v-if="(build.relics || []).length > 4" class="more-relics">
                  +{{ (build.relics || []).length - 4 }}
                </div>
              </div>
            </div>
          </div>

          <!-- Empty Slot -->
          <div v-else class="empty-slot">
            <div class="slot-content">
              <div class="drop-icon">
                <DropIcon />
              </div>
              <div class="slot-text">
                <h4>Build Slot {{ index + 1 }}</h4>
                <p>Drag a build here or select from saved builds</p>
              </div>
              <button class="select-btn" @click="openBuildSelector(index)">
                <SelectIcon />
                Select Build
              </button>
            </div>
          </div>
        </div>
      </div>
    </BaseCard>

    <!-- Comparison View Toggle -->
    <div v-if="comparisonBuilds.length > 1" class="view-controls">
      <div class="view-toggles">
        <button
          :class="['view-btn', { active: viewMode === 'table' }]"
          @click="viewMode = 'table'"
        >
          <TableIcon />
          Table View
        </button>
        <button
          :class="['view-btn', { active: viewMode === 'cards' }]"
          @click="viewMode = 'cards'"
        >
          <CardsIcon />
          Cards View
        </button>
        <button
          :class="['view-btn', { active: viewMode === 'chart' }]"
          @click="viewMode = 'chart'"
        >
          <ChartIcon />
          Chart View
        </button>
      </div>

      <div class="comparison-options">
        <label class="option-label">
          <input
            v-model="showDifferences"
            type="checkbox"
            class="option-checkbox"
          />
          <span class="checkbox-custom"></span>
          <span>Show Differences Only</span>
        </label>
        <label class="option-label">
          <input
            v-model="normalizeValues"
            type="checkbox"
            class="option-checkbox"
          />
          <span class="checkbox-custom"></span>
          <span>Normalize Values</span>
        </label>
      </div>
    </div>

    <!-- Comparison Display -->
    <div v-if="comparisonBuilds.length > 1" class="comparison-display">
      <!-- Table View -->
      <BaseCard v-if="viewMode === 'table'" class="table-view" padding="lg">
        <div class="comparison-table">
          <table class="builds-table">
            <thead>
              <tr>
                <th class="metric-header">Metric</th>
                <th
                  v-for="(build, index) in comparisonBuilds"
                  :key="build.id"
                  :class="[
                    'build-header',
                    { best: isBestInMetric(index, 'overall') },
                  ]"
                >
                  <div class="header-content">
                    <span class="build-name">{{ build.name }}</span>
                    <span
                      :class="[
                        'build-rating',
                        'rating-' + getBuildRating(build),
                      ]"
                    >
                      {{ getBuildRating(build) }}
                    </span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="metric in comparisonMetrics" :key="metric.key">
                <td class="metric-name">
                  <div class="metric-info">
                    <span class="metric-label">{{ metric.label }}</span>
                    <span v-if="metric.description" class="metric-desc">{{
                      metric.description
                    }}</span>
                  </div>
                </td>
                <td
                  v-for="(build, index) in comparisonBuilds"
                  :key="build.id"
                  :class="[
                    'metric-value',
                    {
                      best: isBestInMetric(index, metric.key),
                      worst: isWorstInMetric(index, metric.key),
                    },
                  ]"
                >
                  <div class="value-content">
                    <span class="primary-value">{{
                      formatMetricValue(build, metric)
                    }}</span>
                    <span
                      v-if="showDifferences && index > 0"
                      class="difference"
                    >
                      {{ formatDifference(build, comparisonBuilds[0], metric) }}
                    </span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </BaseCard>

      <!-- Cards View -->
      <div v-else-if="viewMode === 'cards'" class="cards-view">
        <div class="comparison-cards">
          <div
            v-for="(build, index) in comparisonBuilds"
            :key="build.id"
            :class="[
              'comparison-card',
              {
                'best-build': index === bestBuildIndex,
                draggable: true,
              },
            ]"
            :draggable="true"
            @dragstart="handleCardDragStart($event, index)"
            @dragover.prevent
            @drop="handleCardDrop($event, index)"
          >
            <div class="card-header">
              <div class="build-info">
                <h3 class="build-name">{{ build.name }}</h3>
                <div class="build-badges">
                  <span
                    :class="['rating-badge', 'rating-' + getBuildRating(build)]"
                  >
                    {{ getBuildRating(build) }}
                  </span>
                  <span v-if="index === bestBuildIndex" class="best-badge">
                    <CrownIcon />
                    Best
                  </span>
                </div>
              </div>
              <div class="card-actions">
                <button
                  :class="['expand-btn', { expanded: expandedCards[index] }]"
                  title="Toggle details"
                  @click="toggleExpanded(index)"
                >
                  <ExpandIcon />
                </button>
                <button
                  class="remove-btn"
                  title="Remove from comparison"
                  @click="removeBuild(index)"
                >
                  <RemoveIcon />
                </button>
              </div>
            </div>

            <div class="card-content">
              <!-- Key Metrics -->
              <div class="key-metrics">
                <div class="metric-item primary">
                  <span class="metric-label">Attack Multiplier</span>
                  <span class="metric-value">{{
                    formatMultiplier(build.attackMultiplier || 0)
                  }}</span>
                </div>
                <div class="metric-item">
                  <span class="metric-label">Relics</span>
                  <span class="metric-value">{{
                    build.relics?.length || 0
                  }}</span>
                </div>
                <div class="metric-item">
                  <span class="metric-label">Difficulty</span>
                  <span class="metric-value"
                    >{{ getBuildDifficulty(build) }}/10</span
                  >
                </div>
              </div>

              <!-- Expanded Details -->
              <div v-if="expandedCards[index]" class="expanded-details">
                <div class="details-section">
                  <h4>Relics Breakdown</h4>
                  <div class="relics-list">
                    <div
                      v-for="relic in build.relics || []"
                      :key="relic.id"
                      :class="['relic-item', `rarity-${relic.rarity}`]"
                    >
                      <span class="relic-name">{{ relic.name }}</span>
                      <span class="relic-effects"
                        >{{ relic.effects?.length || 0 }} effects</span
                      >
                    </div>
                  </div>
                </div>

                <div class="details-section">
                  <h4>Performance Metrics</h4>
                  <div class="metrics-grid">
                    <div
                      v-for="metric in detailedMetrics"
                      :key="metric.key"
                      class="metric-detail"
                    >
                      <span class="metric-name">{{ metric.label }}</span>
                      <span class="metric-result">{{
                        formatMetricValue(build, metric)
                      }}</span>
                    </div>
                  </div>
                </div>

                <!-- Comparison with other builds -->
                <div v-if="comparisonBuilds.length > 1" class="details-section">
                  <h4>Comparison</h4>
                  <div class="comparison-details">
                    <div
                      v-for="(otherBuild, otherIndex) in comparisonBuilds"
                      v-if="otherIndex !== index"
                      :key="otherBuild.id"
                      class="comparison-item"
                    >
                      <span class="other-build">vs {{ otherBuild.name }}:</span>
                      <span
                        :class="[
                          'difference',
                          getDifferenceClass(build, otherBuild),
                        ]"
                      >
                        {{ formatBuildDifference(build, otherBuild) }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Chart View -->
      <BaseCard
        v-else-if="viewMode === 'chart'"
        class="chart-view"
        padding="lg"
      >
        <div class="chart-container">
          <div class="chart-header">
            <h3>Performance Comparison Chart</h3>
            <select v-model="chartMetric" class="chart-metric-select">
              <option
                v-for="metric in chartableMetrics"
                :key="metric.key"
                :value="metric.key"
              >
                {{ metric.label }}
              </option>
            </select>
          </div>

          <div class="chart-content">
            <div class="chart-bars">
              <div
                v-for="(build, index) in comparisonBuilds"
                :key="build.id"
                class="chart-bar-container"
              >
                <div class="bar-info">
                  <span class="build-name">{{ build.name }}</span>
                  <span class="bar-value">{{
                    getChartValue(build, chartMetric)
                  }}</span>
                </div>
                <div class="bar-track">
                  <div
                    class="bar-fill"
                    :style="{
                      width: getBarWidth(build, chartMetric) + '%',
                      backgroundColor: getBarColor(index),
                    }"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </BaseCard>
    </div>

    <!-- Optimization Suggestions -->
    <BaseCard
      v-if="optimizationSuggestions.length > 0"
      class="optimization-suggestions"
      padding="lg"
    >
      <template #header>
        <h3 class="suggestions-title">
          <OptimizeIcon />
          Optimization Suggestions
        </h3>
      </template>

      <div class="suggestions-list">
        <div
          v-for="suggestion in optimizationSuggestions"
          :key="suggestion.id"
          :class="['suggestion-item', `priority-${suggestion.priority}`]"
        >
          <div class="suggestion-header">
            <div class="suggestion-info">
              <h4 class="suggestion-title">{{ suggestion.title }}</h4>
              <span
                :class="['priority-badge', `priority-${suggestion.priority}`]"
              >
                {{ suggestion.priority.toUpperCase() }}
              </span>
            </div>
            <div class="suggestion-impact">
              <span class="impact-label">Expected Improvement:</span>
              <span class="impact-value"
                >+{{ suggestion.expectedImprovement.toFixed(2) }}×</span
              >
            </div>
          </div>

          <div class="suggestion-content">
            <p class="suggestion-description">{{ suggestion.description }}</p>
            <div class="suggestion-details">
              <div class="affected-builds">
                <span class="details-label">Affected Builds:</span>
                <div class="build-tags">
                  <span
                    v-for="buildId in suggestion.affectedBuilds"
                    :key="buildId"
                    class="build-tag"
                  >
                    {{ getBuildName(buildId) }}
                  </span>
                </div>
              </div>
              <div class="reasoning">
                <span class="details-label">Reasoning:</span>
                <p class="reasoning-text">{{ suggestion.reasoning }}</p>
              </div>
            </div>
          </div>

          <div class="suggestion-actions">
            <button
              class="apply-btn"
              title="Apply this suggestion"
              @click="applySuggestion(suggestion)"
            >
              <ApplyIcon />
              Apply Suggestion
            </button>
            <button
              class="dismiss-btn"
              title="Dismiss suggestion"
              @click="dismissSuggestion(suggestion.id)"
            >
              <DismissIcon />
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </BaseCard>

    <!-- Build Selector Modal -->
    <BaseModal v-model:show="showBuildSelector" title="Select Build" size="lg">
      <div class="build-selector-content">
        <div class="selector-search">
          <input
            v-model="selectorSearchQuery"
            type="text"
            placeholder="Search builds..."
            class="search-input"
          />
        </div>

        <div class="available-builds">
          <div
            v-for="build in filteredAvailableBuilds"
            :key="build.id"
            :class="[
              'selectable-build',
              { selected: selectedBuildId === build.id },
            ]"
            @click="selectedBuildId = build.id"
          >
            <div class="build-info">
              <h4>{{ build.name }}</h4>
              <div class="build-stats">
                <span>{{ formatMultiplier(build.attackMultiplier || 0) }}</span>
                <span>{{ build.relics?.length || 0 }} relics</span>
                <span class="rating">{{ getBuildRating(build) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <button class="modal-btn secondary" @click="showBuildSelector = false">
          Cancel
        </button>
        <button
          :disabled="!selectedBuildId"
          class="modal-btn primary"
          @click="addSelectedBuild"
        >
          Add Build
        </button>
      </template>
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Build } from '../types/build'
import type { OptimizationSuggestion } from '../types/calculation'
import { useBuildManager } from '../composables/useBuildManager'
import { useOptimization } from '../composables/useOptimization'
import { useToast } from '../composables/useToast'
import BaseCard from './ui/BaseCard.vue'
import BaseModal from './ui/BaseModal.vue'

// Props
interface Props {
  savedBuilds?: Build[]
  maxBuilds?: number
}

const props = withDefaults(defineProps<Props>(), {
  savedBuilds: () => [],
  maxBuilds: 4,
})

// Emits
defineEmits<{
  'builds-compared': [builds: Build[]]
  'optimization-applied': [suggestion: OptimizationSuggestion]
  'comparison-exported': [data: any]
}>()

// Composables
const { savedBuilds: managerSavedBuilds } = useBuildManager()
const { generateOptimizationSuggestions } = useOptimization()
const { success, error, info } = useToast()

// State
const buildSlots = ref<Array<Build | null>>(Array(props.maxBuilds).fill(null))
const viewMode = ref<'table' | 'cards' | 'chart'>('cards')
const showDifferences = ref(false)
const normalizeValues = ref(false)
const dragOverSlot = ref(-1)
const expandedCards = ref<boolean[]>(Array(props.maxBuilds).fill(false))
const chartMetric = ref('attackMultiplier')

// Build selector modal
const showBuildSelector = ref(false)
const selectorSlotIndex = ref(-1)
const selectorSearchQuery = ref('')
const selectedBuildId = ref('')

// Optimization
const optimizationSuggestions = ref<OptimizationSuggestion[]>([])

// Computed
const comparisonBuilds = computed(() =>
  buildSlots.value.filter((build): build is Build => build !== null)
)

const bestMultiplier = computed(() => {
  if (comparisonBuilds.value.length === 0) return 0
  return Math.max(...comparisonBuilds.value.map(b => b.attackMultiplier || 0))
})

const averageMultiplier = computed(() => {
  if (comparisonBuilds.value.length === 0) return 0
  const sum = comparisonBuilds.value.reduce(
    (acc, b) => acc + (b.attackMultiplier || 0),
    0
  )
  return sum / comparisonBuilds.value.length
})

const multiplierRange = computed(() => {
  if (comparisonBuilds.value.length === 0) return 0
  const values = comparisonBuilds.value.map(b => b.attackMultiplier || 0)
  return Math.max(...values) - Math.min(...values)
})

const bestBuildIndex = computed(() => {
  if (comparisonBuilds.value.length === 0) return -1
  let bestIndex = 0
  let bestValue = comparisonBuilds.value[0].attackMultiplier || 0

  comparisonBuilds.value.forEach((build, index) => {
    if ((build.attackMultiplier || 0) > bestValue) {
      bestValue = build.attackMultiplier || 0
      bestIndex = index
    }
  })

  return bestIndex
})

const comparisonMetrics = computed(() => [
  {
    key: 'attackMultiplier',
    label: 'Attack Multiplier',
    description: 'Total attack damage multiplier',
  },
  {
    key: 'relicCount',
    label: 'Relic Count',
    description: 'Number of relics equipped',
  },
  {
    key: 'difficulty',
    label: 'Obtainment Difficulty',
    description: 'Average difficulty to obtain relics',
  },
  {
    key: 'effectCount',
    label: 'Active Effects',
    description: 'Total number of active effects',
  },
  {
    key: 'synergy',
    label: 'Synergy Score',
    description: 'How well relics work together',
  },
])

const detailedMetrics = computed(() => [
  { key: 'attackMultiplier', label: 'Attack Multiplier' },
  { key: 'criticalChance', label: 'Critical Chance' },
  { key: 'criticalDamage', label: 'Critical Damage' },
  { key: 'elementalDamage', label: 'Elemental Damage' },
])

const chartableMetrics = computed(() =>
  comparisonMetrics.value.filter(m => m.key !== 'relicCount')
)

const filteredAvailableBuilds = computed(() => {
  let builds = props.savedBuilds || managerSavedBuilds.value

  // Filter out already selected builds
  const selectedIds = comparisonBuilds.value.map(b => b.id)
  builds = builds.filter(b => !selectedIds.includes(b.id))

  // Search filter
  if (selectorSearchQuery.value.trim()) {
    const query = selectorSearchQuery.value.toLowerCase()
    builds = builds.filter(
      b =>
        b.name.toLowerCase().includes(query) ||
        (b.description || '').toLowerCase().includes(query)
    )
  }

  return builds
})

// Methods
const formatMultiplier = (value: number): string => {
  return `${value.toFixed(2)}×`
}

const getBuildRating = (build: Build): string => {
  const multiplier = build.attackMultiplier || 0
  if (multiplier >= 5.0) return 'S'
  if (multiplier >= 4.0) return 'A'
  if (multiplier >= 3.0) return 'B'
  if (multiplier >= 2.0) return 'C'
  return 'D'
}

const getBuildDifficulty = (build: Build): number => {
  if (!build.relics || build.relics.length === 0) return 0
  const sum = build.relics.reduce(
    (acc, relic) => acc + (relic.obtainmentDifficulty || 0),
    0
  )
  return Math.round(sum / build.relics.length)
}

const handleDrop = (event: DragEvent, slotIndex: number) => {
  event.preventDefault()
  dragOverSlot.value = -1

  try {
    const data = event.dataTransfer?.getData('application/json')
    if (data) {
      const buildData = JSON.parse(data)
      if (buildData.type === 'build') {
        buildSlots.value[slotIndex] = buildData.data
        success(`Added ${buildData.data.name} to comparison`)
      }
    }
  } catch (error) {
    console.error('Failed to parse drop data:', error)
  }
}

const removeBuild = (index: number) => {
  if (buildSlots.value[index]) {
    const buildName = buildSlots.value[index]!.name
    buildSlots.value[index] = null
    expandedCards.value[index] = false
    success(`Removed ${buildName} from comparison`)
  }
}

const openBuildSelector = (slotIndex: number) => {
  selectorSlotIndex.value = slotIndex
  selectedBuildId.value = ''
  selectorSearchQuery.value = ''
  showBuildSelector.value = true
}

const addSelectedBuild = () => {
  const build = filteredAvailableBuilds.value.find(
    b => b.id === selectedBuildId.value
  )
  if (build && selectorSlotIndex.value >= 0) {
    buildSlots.value[selectorSlotIndex.value] = build
    showBuildSelector.value = false
    success(`Added ${build.name} to comparison`)
  }
}

const clearAllBuilds = () => {
  buildSlots.value.fill(null)
  expandedCards.value.fill(false)
  optimizationSuggestions.value = []
  info('Cleared all builds from comparison')
}

const optimizeBuilds = () => {
  if (comparisonBuilds.value.length < 2) return

  try {
    const suggestions = generateOptimizationSuggestions(comparisonBuilds.value)
    optimizationSuggestions.value = suggestions
    success(`Generated ${suggestions.length} optimization suggestions`)
  } catch {
    error('Failed to generate optimization suggestions')
  }
}

const exportComparison = () => {
  const exportData = {
    timestamp: new Date().toISOString(),
    builds: comparisonBuilds.value,
    metrics: comparisonMetrics.value.map(metric => ({
      metric: metric.key,
      values: comparisonBuilds.value.map(build =>
        formatMetricValue(build, metric)
      ),
    })),
    suggestions: optimizationSuggestions.value,
  }

  const blob = new Blob([JSON.stringify(exportData, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `build-comparison-${Date.now()}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)

  success('Comparison exported successfully')
}

const toggleExpanded = (index: number) => {
  expandedCards.value[index] = !expandedCards.value[index]
}

const handleCardDragStart = (event: DragEvent, index: number) => {
  event.dataTransfer?.setData('text/plain', index.toString())
}

const handleCardDrop = (event: DragEvent, targetIndex: number) => {
  event.preventDefault()
  const sourceIndex = parseInt(
    event.dataTransfer?.getData('text/plain') || '-1'
  )

  if (sourceIndex >= 0 && sourceIndex !== targetIndex) {
    // Swap builds
    const temp = buildSlots.value[sourceIndex]
    buildSlots.value[sourceIndex] = buildSlots.value[targetIndex]
    buildSlots.value[targetIndex] = temp
  }
}

const formatMetricValue = (build: Build, metric: any): string => {
  switch (metric.key) {
    case 'attackMultiplier':
      return formatMultiplier(build.attackMultiplier || 0)
    case 'relicCount':
      return (build.relics?.length || 0).toString()
    case 'difficulty':
      return getBuildDifficulty(build).toString()
    case 'effectCount':
      return (
        build.relics?.reduce(
          (sum, relic) => sum + (relic.effects?.length || 0),
          0
        ) || 0
      ).toString()
    case 'synergy':
      return '85%' // Placeholder
    default:
      return 'N/A'
  }
}

const formatDifference = (
  _build: Build,
  _baseBuild: Build,
  _metric: any
): string => {
  // Implementation for showing differences
  return '+0.5×' // Placeholder
}

const isBestInMetric = (buildIndex: number, metricKey: string): boolean => {
  if (comparisonBuilds.value.length === 0) return false

  const build = comparisonBuilds.value[buildIndex]
  const values = comparisonBuilds.value.map(b => getMetricValue(b, metricKey))
  const maxValue = Math.max(...values)

  return getMetricValue(build, metricKey) === maxValue
}

const isWorstInMetric = (buildIndex: number, metricKey: string): boolean => {
  if (comparisonBuilds.value.length === 0) return false

  const build = comparisonBuilds.value[buildIndex]
  const values = comparisonBuilds.value.map(b => getMetricValue(b, metricKey))
  const minValue = Math.min(...values)

  return getMetricValue(build, metricKey) === minValue
}

const getMetricValue = (build: Build, metricKey: string): number => {
  switch (metricKey) {
    case 'attackMultiplier':
      return build.attackMultiplier || 0
    case 'relicCount':
      return build.relics?.length || 0
    case 'difficulty':
      return getBuildDifficulty(build)
    default:
      return 0
  }
}

const getChartValue = (build: Build, metricKey: string): string => {
  return formatMetricValue(build, { key: metricKey })
}

const getBarWidth = (build: Build, metricKey: string): number => {
  const value = getMetricValue(build, metricKey)
  const maxValue = Math.max(
    ...comparisonBuilds.value.map(b => getMetricValue(b, metricKey))
  )
  return maxValue > 0 ? (value / maxValue) * 100 : 0
}

const getBarColor = (index: number): string => {
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444']
  return colors[index % colors.length]
}

const formatBuildDifference = (build1: Build, build2: Build): string => {
  const diff = (build1.attackMultiplier || 0) - (build2.attackMultiplier || 0)
  return diff >= 0 ? `+${diff.toFixed(2)}×` : `${diff.toFixed(2)}×`
}

const getDifferenceClass = (build1: Build, build2: Build): string => {
  const diff = (build1.attackMultiplier || 0) - (build2.attackMultiplier || 0)
  if (diff > 0) return 'positive'
  if (diff < 0) return 'negative'
  return 'neutral'
}

const getBuildName = (buildId: string): string => {
  const build = comparisonBuilds.value.find(b => b.id === buildId)
  return build?.name || 'Unknown Build'
}

const applySuggestion = (suggestion: OptimizationSuggestion) => {
  // Implementation for applying optimization suggestion
  success(`Applied suggestion: ${suggestion.title}`)
}

const dismissSuggestion = (suggestionId: string) => {
  optimizationSuggestions.value = optimizationSuggestions.value.filter(
    s => s.id !== suggestionId
  )
}

// Icon components (simplified)
const ComparisonIcon = {
  template: `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/></svg>`,
}
const ClearIcon = {
  template: `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/><path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/></svg>`,
}
const OptimizeIcon = {
  template: `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 4.754a.5.5 0 0 1 .5.5v3.793l2.146-2.146a.5.5 0 0 1 .708.708l-3 3a.5.5 0 0 1-.708 0l-3-3a.5.5 0 1 1 .708-.708L7.5 8.793V5.254a.5.5 0 0 1 .5-.5z"/><path d="M14 14V4.5L9.5 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2zM9.5 3A1.5 1.5 0 0 0 11 4.5h2V14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h5.5v2z"/></svg>`,
}
const ExportIcon = {
  template: `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/><path d="M7.646 1.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 2.707V11.5a.5.5 0 0 1-1 0V2.707L5.354 4.854a.5.5 0 1 1-.708-.708l3-3z"/></svg>`,
}
const SelectIcon = {
  template: `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/></svg>`,
}
const RemoveIcon = {
  template: `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/></svg>`,
}
const DropIcon = {
  template: `<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>`,
}
const TableIcon = {
  template: `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2zm15 2h-4v3h4V4zm0 4h-4v3h4V8zm0 4h-4v3h3a1 1 0 0 0 1-1v-2zm-5 3v-3H6v3h4zm-5 0v-3H1v2a1 1 0 0 0 1 1h3zm-4-4h4V8H1v3zm0-4h4V4H1v3zm5-3v3h4V4H6zm4 4H6v3h4V8z"/></svg>`,
}
const CardsIcon = {
  template: `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M1 2.5A1.5 1.5 0 0 1 2.5 1h3A1.5 1.5 0 0 1 7 2.5v3A1.5 1.5 0 0 1 5.5 7h-3A1.5 1.5 0 0 1 1 5.5v-3zM2.5 2a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5h-3zm6.5.5A1.5 1.5 0 0 1 10.5 1h3A1.5 1.5 0 0 1 15 2.5v3A1.5 1.5 0 0 1 13.5 7h-3A1.5 1.5 0 0 1 9 5.5v-3zm1.5-.5a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5h-3zM1 10.5A1.5 1.5 0 0 1 2.5 9h3A1.5 1.5 0 0 1 7 10.5v3A1.5 1.5 0 0 1 5.5 15h-3A1.5 1.5 0 0 1 1 13.5v-3zm1.5-.5a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5h-3zm6.5.5A1.5 1.5 0 0 1 10.5 9h3a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1-1.5 1.5h-3A1.5 1.5 0 0 1 9 13.5v-3zm1.5-.5a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5h-3z"/></svg>`,
}
const ChartIcon = {
  template: `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M4 11H2v3h2v-3zm5-4H7v7h2V7zm5-5v12h-2V2h2zm-2-1a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1h-2zM6 7a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V7zM1 11a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1v-3z"/></svg>`,
}
const CrownIcon = {
  template: `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="m8 0 1.669.864 1.858.282.842 1.68 1.337 1.32L13.4 6l.306 1.854-1.337 1.32-.842 1.68-1.858.282L8 12l-1.669-.864-1.858-.282-.842-1.68-1.337-1.32L2.6 6l-.306-1.854 1.337-1.32.842-1.68L6.331.864 8 0z"/><path d="M4 11.794V16l4-1 4 1v-4.206l-2.018.306L8 13.126 6.018 12.1 4 11.794z"/></svg>`,
}
const ExpandIcon = {
  template: `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path fill-rule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"/></svg>`,
}
const ApplyIcon = {
  template: `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M10.97 4.97a.235.235 0 0 0-.02.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.061L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-1.071-1.05z"/></svg>`,
}
const DismissIcon = {
  template: `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/></svg>`,
}
</script>

<style scoped>
.build-comparison {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Header */
.comparison-header {
  border: 2px solid var(--primary-color);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.comparison-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
}

.header-actions {
  display: flex;
  gap: 0.75rem;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn.primary {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.action-btn.primary:hover:not(:disabled) {
  background: #2980b9;
  transform: translateY(-1px);
}

.action-btn.secondary {
  background: white;
  color: var(--text-secondary);
}

.action-btn.secondary:hover:not(:disabled) {
  background: var(--gray-50);
  color: var(--text-primary);
  transform: translateY(-1px);
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
}

/* Comparison Stats */
.comparison-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  margin-top: 1.5rem;
  padding: 1.5rem;
  background: linear-gradient(
    135deg,
    rgba(59, 130, 246, 0.05) 0%,
    rgba(59, 130, 246, 0.1) 100%
  );
  border-radius: 8px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  text-align: center;
  gap: 0.25rem;
}

.stat-label {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.stat-value {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.stat-value.best {
  color: var(--success-color);
}

/* Build Slots */
.build-slots {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}

.build-slot {
  min-height: 200px;
  border: 2px dashed var(--border-color);
  border-radius: 12px;
  transition: all 0.2s;
}

.build-slot.occupied {
  border-style: solid;
  border-color: var(--success-color);
  background: rgba(16, 185, 129, 0.05);
}

.build-slot.dragging {
  border-color: var(--primary-color);
  background: rgba(59, 130, 246, 0.1);
}

.occupied-slot {
  padding: 1.5rem;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.build-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.build-name {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.remove-btn {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: var(--danger-color);
  color: white;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s;
}

.remove-btn:hover {
  background: #c0392b;
  transform: scale(1.1);
}

.build-meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.multiplier {
  font-size: 1rem;
  font-weight: 700;
  color: var(--primary-color);
}

.relic-count {
  font-size: 0.9rem;
  color: var(--text-muted);
}

.rating {
  padding: 0.125rem 0.5rem;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: 600;
}

.rating.rating-S {
  background: #fecaca;
  color: #dc2626;
}
.rating.rating-A {
  background: #fed7aa;
  color: #ea580c;
}
.rating.rating-B {
  background: #fef3c7;
  color: #ca8a04;
}
.rating.rating-C {
  background: #dcfce7;
  color: #65a30d;
}
.rating.rating-D {
  background: #f3f4f6;
  color: #6b7280;
}

.build-preview {
  flex: 1;
}

.relics-preview {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.relic-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 600;
  color: white;
}

.relic-icon.rarity-common {
  background: #9ca3af;
}
.relic-icon.rarity-rare {
  background: #3b82f6;
}
.relic-icon.rarity-epic {
  background: #8b5cf6;
}
.relic-icon.rarity-legendary {
  background: #f59e0b;
}

.more-relics {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--gray-300);
  color: var(--text-primary);
  border-radius: 6px;
  font-size: 0.7rem;
  font-weight: 600;
}

.empty-slot {
  padding: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.slot-content {
  text-align: center;
  color: var(--text-muted);
}

.drop-icon {
  font-size: 2rem;
  margin-bottom: 1rem;
  color: var(--border-color);
}

.slot-text h4 {
  margin: 0 0 0.5rem 0;
  color: var(--text-secondary);
}

.slot-text p {
  margin: 0 0 1rem 0;
  font-size: 0.9rem;
}

.select-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
}

.select-btn:hover {
  background: #2980b9;
  transform: translateY(-1px);
}

/* View Controls */
.view-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: var(--gray-50);
  border-radius: 8px;
}

.view-toggles {
  display: flex;
  gap: 0.5rem;
}

.view-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: white;
  color: var(--text-secondary);
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
}

.view-btn:hover {
  background: var(--gray-50);
  color: var(--text-primary);
}

.view-btn.active {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.comparison-options {
  display: flex;
  gap: 1rem;
}

.option-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.875rem;
}

.option-checkbox {
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

.option-checkbox:checked + .checkbox-custom {
  background: var(--primary-color);
  border-color: var(--primary-color);
}

.option-checkbox:checked + .checkbox-custom::after {
  content: '✓';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-size: 10px;
  font-weight: bold;
}

/* Table View */
.comparison-table {
  overflow-x: auto;
}

.builds-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.builds-table th,
.builds-table td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid var(--border-color);
}

.metric-header {
  background: var(--gray-50);
  font-weight: 600;
  color: var(--text-primary);
  min-width: 150px;
}

.build-header {
  background: var(--gray-50);
  text-align: center;
  min-width: 120px;
}

.build-header.best {
  background: rgba(16, 185, 129, 0.1);
  color: var(--success-color);
}

.header-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.build-name {
  font-weight: 600;
}

.build-rating {
  font-size: 0.7rem;
  padding: 0.125rem 0.375rem;
  border-radius: 8px;
}

.metric-name {
  font-weight: 500;
}

.metric-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.metric-desc {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.metric-value {
  text-align: center;
}

.metric-value.best {
  background: rgba(16, 185, 129, 0.1);
  color: var(--success-color);
  font-weight: 600;
}

.metric-value.worst {
  background: rgba(239, 68, 68, 0.1);
  color: var(--danger-color);
}

.value-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.difference {
  font-size: 0.75rem;
  color: var(--text-muted);
}

/* Cards View */
.comparison-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 1.5rem;
}

.comparison-card {
  padding: 1.5rem;
  background: white;
  border: 2px solid var(--border-color);
  border-radius: 12px;
  transition: all 0.2s;
  cursor: move;
}

.comparison-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.comparison-card.best-build {
  border-color: var(--success-color);
  background: linear-gradient(
    135deg,
    rgba(16, 185, 129, 0.05) 0%,
    rgba(16, 185, 129, 0.1) 100%
  );
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.build-badges {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.rating-badge {
  padding: 0.125rem 0.5rem;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: 600;
}

.best-badge {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.125rem 0.5rem;
  background: var(--success-color);
  color: white;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: 600;
}

.card-actions {
  display: flex;
  gap: 0.5rem;
}

.expand-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: white;
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.2s;
}

.expand-btn:hover {
  background: var(--gray-50);
  color: var(--text-primary);
}

.expand-btn.expanded {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
  transform: rotate(180deg);
}

/* Key Metrics */
.key-metrics {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 1rem;
}

.metric-item {
  display: flex;
  flex-direction: column;
  text-align: center;
  padding: 0.75rem;
  background: var(--gray-50);
  border-radius: 6px;
}

.metric-item.primary {
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.2);
}

.metric-label {
  font-size: 0.8rem;
  color: var(--text-muted);
  margin-bottom: 0.25rem;
}

.metric-value {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
}

/* Expanded Details */
.expanded-details {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
}

.details-section {
  margin-bottom: 1.5rem;
}

.details-section h4 {
  margin: 0 0 0.75rem 0;
  font-size: 1rem;
  color: var(--text-primary);
}

.relics-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.relic-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  border-radius: 6px;
  border-left: 3px solid transparent;
}

.relic-item.rarity-common {
  border-left-color: #9ca3af;
  background: rgba(156, 163, 175, 0.1);
}
.relic-item.rarity-rare {
  border-left-color: #3b82f6;
  background: rgba(59, 130, 246, 0.1);
}
.relic-item.rarity-epic {
  border-left-color: #8b5cf6;
  background: rgba(139, 92, 246, 0.1);
}
.relic-item.rarity-legendary {
  border-left-color: #f59e0b;
  background: rgba(245, 158, 11, 0.1);
}

.relic-name {
  font-weight: 500;
  color: var(--text-primary);
}

.relic-effects {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem;
}

.metric-detail {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  background: var(--gray-50);
  border-radius: 4px;
}

.metric-name {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.metric-result {
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--text-primary);
}

.comparison-details {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.comparison-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.other-build {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.difference.positive {
  color: var(--success-color);
}
.difference.negative {
  color: var(--danger-color);
}
.difference.neutral {
  color: var(--text-muted);
}

/* Chart View */
.chart-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart-header h3 {
  margin: 0;
  font-size: 1.1rem;
  color: var(--text-primary);
}

.chart-metric-select {
  padding: 0.5rem;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 0.875rem;
}

.chart-bars {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.chart-bar-container {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.bar-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.bar-value {
  font-weight: 600;
  color: var(--text-primary);
}

.bar-track {
  height: 24px;
  background: var(--gray-200);
  border-radius: 12px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: 12px;
  transition: width 0.3s ease;
}

/* Optimization Suggestions */
.suggestions-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.suggestion-item {
  padding: 1.5rem;
  border-radius: 8px;
  border-left: 4px solid transparent;
}

.suggestion-item.priority-high {
  background: rgba(239, 68, 68, 0.05);
  border-left-color: var(--danger-color);
}

.suggestion-item.priority-medium {
  background: rgba(245, 158, 11, 0.05);
  border-left-color: var(--warning-color);
}

.suggestion-item.priority-low {
  background: rgba(59, 130, 246, 0.05);
  border-left-color: var(--primary-color);
}

.suggestion-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.suggestion-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.suggestion-title {
  margin: 0;
  font-size: 1.1rem;
  color: var(--text-primary);
}

.priority-badge {
  padding: 0.125rem 0.5rem;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
}

.priority-badge.priority-high {
  background: var(--danger-color);
  color: white;
}

.priority-badge.priority-medium {
  background: var(--warning-color);
  color: white;
}

.priority-badge.priority-low {
  background: var(--primary-color);
  color: white;
}

.suggestion-impact {
  text-align: right;
}

.impact-label {
  display: block;
  font-size: 0.8rem;
  color: var(--text-muted);
  margin-bottom: 0.25rem;
}

.impact-value {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--success-color);
}

.suggestion-description {
  margin: 0 0 1rem 0;
  color: var(--text-secondary);
  line-height: 1.5;
}

.suggestion-details {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.details-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-primary);
}

.build-tags {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-top: 0.25rem;
}

.build-tag {
  padding: 0.25rem 0.5rem;
  background: var(--gray-200);
  color: var(--text-primary);
  border-radius: 8px;
  font-size: 0.75rem;
}

.reasoning-text {
  margin: 0.25rem 0 0 0;
  font-size: 0.9rem;
  color: var(--text-secondary);
  line-height: 1.4;
}

.suggestion-actions {
  display: flex;
  gap: 0.75rem;
}

.apply-btn,
.dismiss-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
}

.apply-btn {
  background: var(--success-color);
  color: white;
  border-color: var(--success-color);
}

.apply-btn:hover {
  background: #059669;
  transform: translateY(-1px);
}

.dismiss-btn {
  background: white;
  color: var(--text-muted);
}

.dismiss-btn:hover {
  background: var(--gray-50);
  color: var(--text-primary);
}

/* Build Selector Modal */
.build-selector-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-height: 400px;
}

.selector-search {
  position: sticky;
  top: 0;
  background: white;
  z-index: 1;
}

.search-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 0.875rem;
}

.available-builds {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.selectable-build {
  padding: 1rem;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.selectable-build:hover {
  background: var(--gray-50);
}

.selectable-build.selected {
  border-color: var(--primary-color);
  background: rgba(59, 130, 246, 0.1);
}

.build-stats {
  display: flex;
  gap: 1rem;
  margin-top: 0.5rem;
  font-size: 0.8rem;
  color: var(--text-muted);
}

.modal-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.modal-btn.primary {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.modal-btn.secondary {
  background: white;
  color: var(--text-secondary);
}

.modal-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Responsive */
@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .header-actions {
    align-self: stretch;
  }

  .comparison-stats {
    grid-template-columns: repeat(2, 1fr);
  }

  .build-slots {
    grid-template-columns: 1fr;
  }

  .view-controls {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .comparison-cards {
    grid-template-columns: 1fr;
  }

  .key-metrics {
    grid-template-columns: 1fr;
  }

  .metrics-grid {
    grid-template-columns: 1fr;
  }

  .suggestion-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .suggestion-actions {
    flex-direction: column;
  }
}
</style>

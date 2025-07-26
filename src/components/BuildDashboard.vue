<template>
  <div class="build-dashboard">
    <!-- Dashboard Header -->
    <BaseCard class="dashboard-header" variant="filled" padding="lg">
      <template #header>
        <div class="header-content">
          <h2 class="dashboard-title">ビルドダッシュボード</h2>
          <div class="header-actions">
            <BaseButton variant="primary" size="md" @click="handleNewBuild">
              新規ビルド作成
            </BaseButton>
            <BaseButton variant="outline" size="md" @click="handleImportBuild">
              インポート
            </BaseButton>
          </div>
        </div>
      </template>

      <!-- Build Statistics -->
      <div class="build-stats">
        <div class="stat-card">
          <div class="stat-value">{{ totalBuilds }}</div>
          <div class="stat-label">総ビルド数</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ averageMultiplier }}倍</div>
          <div class="stat-label">平均攻撃倍率</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ topMultiplier }}倍</div>
          <div class="stat-label">最高攻撃倍率</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ favoriteBuilds }}</div>
          <div class="stat-label">お気に入り</div>
        </div>
      </div>
    </BaseCard>

    <!-- Build Controls -->
    <BaseCard class="build-controls" padding="md">
      <div class="controls-content">
        <!-- Search and Filters -->
        <div class="search-section">
          <BaseInput
            v-model="searchQuery"
            placeholder="ビルド名、タグ、遺物名で検索..."
            size="md"
            @input="handleSearch"
          >
            <template #prefix>🔍</template>
          </BaseInput>
        </div>

        <div class="filter-section">
          <div class="filter-group">
            <label>ソート:</label>
            <select v-model="sortBy" class="filter-select" @change="handleSort">
              <option value="name">名前</option>
              <option value="multiplier">攻撃倍率</option>
              <option value="created">作成日時</option>
              <option value="updated">更新日時</option>
              <option value="favorite">お気に入り</option>
            </select>
          </div>

          <div class="filter-group">
            <label>順序:</label>
            <select
              v-model="sortOrder"
              class="filter-select"
              @change="handleSort"
            >
              <option value="desc">降順</option>
              <option value="asc">昇順</option>
            </select>
          </div>

          <div class="filter-group">
            <label>表示:</label>
            <select v-model="viewMode" class="filter-select">
              <option value="grid">グリッド</option>
              <option value="list">リスト</option>
              <option value="compact">コンパクト</option>
            </select>
          </div>
        </div>

        <!-- Quick Filters -->
        <div class="quick-filters">
          <BaseButton
            v-for="filter in quickFilters"
            :key="filter.key"
            :variant="activeQuickFilter === filter.key ? 'primary' : 'ghost'"
            size="sm"
            @click="handleQuickFilter(filter.key)"
          >
            {{ filter.label }}
          </BaseButton>
        </div>
      </div>
    </BaseCard>

    <!-- Build List -->
    <div class="build-list-container">
      <!-- Loading State -->
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>ビルドを読み込み中...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="error-state">
        <p class="error-message">{{ error }}</p>
        <BaseButton variant="outline" @click="handleRetry"> 再試行 </BaseButton>
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredBuilds.length === 0" class="empty-state">
        <div class="empty-icon">📋</div>
        <h3>ビルドがありません</h3>
        <p v-if="searchQuery">検索条件に一致するビルドが見つかりません。</p>
        <p v-else>新しいビルドを作成してみましょう。</p>
        <BaseButton variant="primary" @click="handleNewBuild">
          新規ビルド作成
        </BaseButton>
      </div>

      <!-- Build Grid/List -->
      <div v-else :class="['build-list', `view-${viewMode}`]">
        <TransitionGroup name="build-item" tag="div" class="build-grid">
          <div
            v-for="build in paginatedBuilds"
            :key="build.id"
            class="build-item"
          >
            <BaseCard
              :class="['build-card', { favorite: build.isFavorite }]"
              :hover="true"
              :clickable="true"
              padding="md"
              @click="handleSelectBuild(build)"
            >
              <template #header>
                <div class="build-header">
                  <h4 class="build-name">{{ build.name }}</h4>
                  <div class="build-actions">
                    <BaseButton
                      variant="ghost"
                      size="sm"
                      :class="{ favorited: build.isFavorite }"
                      @click.stop="handleToggleFavorite(build)"
                    >
                      {{ build.isFavorite ? '★' : '☆' }}
                    </BaseButton>
                    <BaseButton
                      variant="ghost"
                      size="sm"
                      @click.stop="handleBuildMenu(build, $event)"
                    >
                      ⋮
                    </BaseButton>
                  </div>
                </div>
              </template>

              <div class="build-content">
                <!-- Build Multiplier -->
                <div class="build-multiplier">
                  <span class="multiplier-value"
                    >{{ formatMultiplier(build.attackMultiplier) }}倍</span
                  >
                  <span
                    :class="[
                      'multiplier-grade',
                      getMultiplierGrade(build.attackMultiplier),
                    ]"
                  >
                    {{ getMultiplierGradeLabel(build.attackMultiplier) }}
                  </span>
                </div>

                <!-- Build Description -->
                <p v-if="build.description" class="build-description">
                  {{ build.description }}
                </p>

                <!-- Relics Preview -->
                <div class="relics-preview">
                  <div class="relic-count">
                    遺物: {{ build.relicIds.length }}個
                  </div>
                  <div class="relic-icons">
                    <div
                      v-for="relicId in build.relicIds.slice(0, 6)"
                      :key="relicId"
                      class="relic-icon"
                      :title="getRelicName(relicId)"
                    >
                      {{ getRelicIcon(relicId) }}
                    </div>
                    <div v-if="build.relicIds.length > 6" class="more-relics">
                      +{{ build.relicIds.length - 6 }}
                    </div>
                  </div>
                </div>

                <!-- Build Tags -->
                <div v-if="build.tags?.length" class="build-tags">
                  <span
                    v-for="tag in build.tags.slice(0, 3)"
                    :key="tag"
                    class="build-tag"
                  >
                    {{ tag }}
                  </span>
                  <span v-if="build.tags.length > 3" class="more-tags">
                    +{{ build.tags.length - 3 }}
                  </span>
                </div>

                <!-- Build Meta -->
                <div class="build-meta">
                  <span class="meta-item">
                    作成: {{ formatDate(build.createdAt) }}
                  </span>
                  <span
                    v-if="build.updatedAt !== build.createdAt"
                    class="meta-item"
                  >
                    更新: {{ formatDate(build.updatedAt) }}
                  </span>
                </div>
              </div>
            </BaseCard>
          </div>
        </TransitionGroup>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="pagination">
        <BaseButton
          :disabled="currentPage === 1"
          variant="ghost"
          size="sm"
          @click="handlePrevPage"
        >
          ‹ 前
        </BaseButton>

        <div class="page-numbers">
          <BaseButton
            v-for="page in visiblePages"
            :key="page"
            :variant="page === currentPage ? 'primary' : 'ghost'"
            size="sm"
            @click="handleGoToPage(page)"
          >
            {{ page }}
          </BaseButton>
        </div>

        <BaseButton
          :disabled="currentPage === totalPages"
          variant="ghost"
          size="sm"
          @click="handleNextPage"
        >
          次 ›
        </BaseButton>
      </div>
    </div>

    <!-- Context Menu -->
    <Teleport to="body">
      <div
        v-if="contextMenu.show"
        :style="contextMenu.style"
        class="context-menu"
        @click.stop
      >
        <div
          class="context-menu-item"
          @click="handleEditBuild(contextMenu.build)"
        >
          編集
        </div>
        <div
          class="context-menu-item"
          @click="handleDuplicateBuild(contextMenu.build)"
        >
          複製
        </div>
        <div
          class="context-menu-item"
          @click="handleExportBuild(contextMenu.build)"
        >
          エクスポート
        </div>
        <div class="context-menu-divider"></div>
        <div
          class="context-menu-item danger"
          @click="handleDeleteBuild(contextMenu.build)"
        >
          削除
        </div>
      </div>
    </Teleport>

    <!-- Build Import Modal -->
    <BaseModal
      v-model:show="showImportModal"
      title="ビルドインポート"
      size="md"
    >
      <div class="import-content">
        <p>ビルドデータをインポートしてください:</p>
        <BaseInput
          v-model="importData"
          type="text"
          placeholder="ビルドデータを貼り付け..."
          size="md"
        />
      </div>

      <template #footer>
        <BaseButton variant="ghost" @click="showImportModal = false">
          キャンセル
        </BaseButton>
        <BaseButton
          variant="primary"
          :disabled="!importData.trim()"
          @click="handleConfirmImport"
        >
          インポート
        </BaseButton>
      </template>
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import type { Build } from '../types/build'
import { useBuilds } from '../composables/useBuilds'
import { useRelics } from '../composables/useRelics'
import BaseCard from './ui/BaseCard.vue'
import BaseButton from './ui/BaseButton.vue'
import BaseInput from './ui/BaseInput.vue'
import BaseModal from './ui/BaseModal.vue'

// Props
interface Props {
  selectedBuildId?: string | null
}

// Emits
interface Emits {
  (_e: 'build-selected', _build: Build): void
  (_e: 'build-created', _build: Build): void
  (_e: 'build-updated', _build: Build): void
  (_e: 'build-deleted', _buildId: string): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()

// Composables
const {
  builds,
  loading,
  error,
  fetchBuilds,
  createBuild,
  // updateBuild,
  deleteBuild,
  toggleFavorite,
} = useBuilds()

const { getRelicById } = useRelics()

// Local state
const searchQuery = ref('')
const sortBy = ref<'name' | 'multiplier' | 'created' | 'updated' | 'favorite'>(
  'updated'
)
const sortOrder = ref<'asc' | 'desc'>('desc')
const viewMode = ref<'grid' | 'list' | 'compact'>('grid')
const activeQuickFilter = ref<string | null>(null)
const currentPage = ref(1)
const itemsPerPage = ref(12)

const showImportModal = ref(false)
const importData = ref('')

const contextMenu = ref({
  show: false,
  build: null as Build | null,
  style: {},
})

// Quick filters configuration
const quickFilters = [
  { key: 'all', label: '全て' },
  { key: 'favorites', label: 'お気に入り' },
  { key: 'recent', label: '最近の更新' },
  { key: 'high-multiplier', label: '高倍率' },
  { key: 'incomplete', label: '未完成' },
]

// Computed properties
const filteredBuilds = computed(() => {
  let filtered = [...builds.value]

  // Search filter
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(
      build =>
        build.name.toLowerCase().includes(query) ||
        build.description?.toLowerCase().includes(query) ||
        build.tags?.some(tag => tag.toLowerCase().includes(query)) ||
        build.relicIds.some(relicId => {
          const relic = getRelicById(relicId)
          return relic?.name.toLowerCase().includes(query)
        })
    )
  }

  // Quick filter
  if (activeQuickFilter.value) {
    switch (activeQuickFilter.value) {
      case 'favorites':
        filtered = filtered.filter(build => build.isFavorite)
        break
      case 'recent': {
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        filtered = filtered.filter(build => new Date(build.updatedAt) > weekAgo)
        break
      }
      case 'high-multiplier':
        filtered = filtered.filter(build => build.attackMultiplier >= 3.0)
        break
      case 'incomplete':
        filtered = filtered.filter(build => build.relicIds.length < 9)
        break
    }
  }

  // Sort
  filtered.sort((a, b) => {
    let comparison = 0

    switch (sortBy.value) {
      case 'name':
        comparison = a.name.localeCompare(b.name)
        break
      case 'multiplier':
        comparison = a.attackMultiplier - b.attackMultiplier
        break
      case 'created':
        comparison =
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        break
      case 'updated':
        comparison =
          new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
        break
      case 'favorite':
        comparison = (b.isFavorite ? 1 : 0) - (a.isFavorite ? 1 : 0)
        break
    }

    return sortOrder.value === 'desc' ? -comparison : comparison
  })

  return filtered
})

const paginatedBuilds = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredBuilds.value.slice(start, end)
})

const totalPages = computed(() => {
  return Math.ceil(filteredBuilds.value.length / itemsPerPage.value)
})

const visiblePages = computed(() => {
  const pages = []
  const maxVisible = 5
  const start = Math.max(1, currentPage.value - Math.floor(maxVisible / 2))
  const end = Math.min(totalPages.value, start + maxVisible - 1)

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }

  return pages
})

// Statistics
const totalBuilds = computed(() => builds.value.length)

const averageMultiplier = computed(() => {
  if (builds.value.length === 0) return '0.00'
  const sum = builds.value.reduce(
    (acc, build) => acc + build.attackMultiplier,
    0
  )
  return (sum / builds.value.length).toFixed(2)
})

const topMultiplier = computed(() => {
  if (builds.value.length === 0) return '0.00'
  const max = Math.max(...builds.value.map(build => build.attackMultiplier))
  return max.toFixed(2)
})

const favoriteBuilds = computed(() => {
  return builds.value.filter(build => build.isFavorite).length
})

// Methods
const handleSearch = () => {
  currentPage.value = 1
}

const handleSort = () => {
  currentPage.value = 1
}

const handleQuickFilter = (filterKey: string) => {
  if (activeQuickFilter.value === filterKey) {
    activeQuickFilter.value = null
  } else {
    activeQuickFilter.value = filterKey
  }
  currentPage.value = 1
}

const handleSelectBuild = (build: Build) => {
  emit('build-selected', build)
}

const handleNewBuild = () => {
  // Create a new empty build
  const newBuild: Partial<Build> = {
    name: `新規ビルド ${builds.value.length + 1}`,
    description: '',
    relicIds: [],
    attackMultiplier: 1.0,
    tags: [],
    isFavorite: false,
  }

  emit('build-created', newBuild as Build)
}

const handleToggleFavorite = async (build: Build) => {
  try {
    await toggleFavorite(build.id)
  } catch (err) {
    console.error('Failed to toggle favorite:', err)
  }
}

const handleBuildMenu = (build: Build, event: MouseEvent) => {
  const rect = (event.target as HTMLElement).getBoundingClientRect()
  contextMenu.value = {
    show: true,
    build,
    style: {
      position: 'fixed',
      top: `${rect.bottom + 5}px`,
      left: `${rect.left}px`,
      zIndex: 1000,
    },
  }
}

const handleEditBuild = (build: Build) => {
  emit('build-selected', build)
  contextMenu.value.show = false
}

const handleDuplicateBuild = async (build: Build) => {
  try {
    const duplicated = {
      ...build,
      id: undefined,
      name: `${build.name} (複製)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const newBuild = await createBuild(duplicated)
    emit('build-created', newBuild)
  } catch (err) {
    console.error('Failed to duplicate build:', err)
  }

  contextMenu.value.show = false
}

const handleExportBuild = (build: Build) => {
  const exportData = JSON.stringify(build, null, 2)
  const blob = new Blob([exportData], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = `${build.name}.json`
  a.click()

  URL.revokeObjectURL(url)
  contextMenu.value.show = false
}

const handleDeleteBuild = async (build: Build) => {
  if (window.confirm(`「${build.name}」を削除してもよろしいですか？`)) {
    try {
      await deleteBuild(build.id)
      emit('build-deleted', build.id)
    } catch (err) {
      console.error('Failed to delete build:', err)
    }
  }

  contextMenu.value.show = false
}

const handleImportBuild = () => {
  showImportModal.value = true
}

const handleConfirmImport = async () => {
  try {
    const buildData = JSON.parse(importData.value)
    const newBuild = await createBuild(buildData)
    emit('build-created', newBuild)
    showImportModal.value = false
    importData.value = ''
  } catch (err) {
    console.error('Failed to import build:', err)
    alert('インポートに失敗しました。データ形式を確認してください。')
  }
}

const handleRetry = () => {
  fetchBuilds()
}

// Pagination methods
const handlePrevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
  }
}

const handleNextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
  }
}

const handleGoToPage = (page: number) => {
  currentPage.value = page
}

// Utility methods
const formatMultiplier = (value: number): string => {
  return value.toFixed(2)
}

const getMultiplierGrade = (multiplier: number): string => {
  if (multiplier >= 5.0) return 'exceptional'
  if (multiplier >= 3.0) return 'high'
  if (multiplier >= 2.0) return 'medium'
  return 'low'
}

const getMultiplierGradeLabel = (multiplier: number): string => {
  const grade = getMultiplierGrade(multiplier)
  const labels = {
    exceptional: 'S級',
    high: 'A級',
    medium: 'B級',
    low: 'C級',
  }
  return labels[grade]
}

const getRelicName = (relicId: string): string => {
  const relic = getRelicById(relicId)
  return relic?.name || 'Unknown Relic'
}

const getRelicIcon = (relicId: string): string => {
  const relic = getRelicById(relicId)
  return relic?.icon || '⚡'
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

// Close context menu on outside click
const handleOutsideClick = () => {
  contextMenu.value.show = false
}

// Lifecycle
onMounted(() => {
  fetchBuilds()
  document.addEventListener('click', handleOutsideClick)
})

onUnmounted(() => {
  document.removeEventListener('click', handleOutsideClick)
})

// Watch for search query changes
watch(searchQuery, () => {
  currentPage.value = 1
})
</script>

<style scoped>
.build-dashboard {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  max-width: 100%;
}

/* Dashboard Header */
.dashboard-header {
  margin-bottom: 0;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  margin-bottom: 1rem;
}

.dashboard-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
}

.header-actions {
  display: flex;
  gap: 0.75rem;
}

.build-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
}

.stat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  background: white;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #3b82f6;
  margin-bottom: 0.25rem;
}

.stat-label {
  font-size: 0.875rem;
  color: #6b7280;
  text-align: center;
}

/* Build Controls */
.build-controls {
  margin-bottom: 0;
}

.controls-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.search-section {
  flex: 1;
}

.filter-section {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
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
}

.quick-filters {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

/* Build List */
.build-list-container {
  flex: 1;
}

.loading-state,
.error-state,
.empty-state {
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

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.error-message {
  color: #ef4444;
  margin-bottom: 1rem;
}

/* Build Grid */
.build-list.view-grid .build-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
}

.build-list.view-list .build-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.build-list.view-compact .build-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
}

.build-item {
  transition: all 0.3s ease;
}

.build-card {
  height: 100%;
  transition: all 0.2s ease;
}

.build-card.favorite {
  border-color: #fbbf24;
  box-shadow: 0 0 0 1px rgba(251, 191, 36, 0.2);
}

.build-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  width: 100%;
}

.build-name {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  flex: 1;
  line-height: 1.4;
}

.build-actions {
  display: flex;
  gap: 0.25rem;
}

.build-actions .favorited {
  color: #fbbf24;
}

.build-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  flex: 1;
}

.build-multiplier {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border-radius: 0.5rem;
}

.multiplier-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #0ea5e9;
}

.multiplier-grade {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.25rem 0.5rem;
  border-radius: 1rem;
  text-transform: uppercase;
}

.multiplier-grade.exceptional {
  background: #ef4444;
  color: white;
}

.multiplier-grade.high {
  background: #f59e0b;
  color: white;
}

.multiplier-grade.medium {
  background: #10b981;
  color: white;
}

.multiplier-grade.low {
  background: #6b7280;
  color: white;
}

.build-description {
  font-size: 0.875rem;
  color: #6b7280;
  line-height: 1.5;
  margin: 0;
}

.relics-preview {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: #f9fafb;
  border-radius: 0.375rem;
}

.relic-count {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.relic-icons {
  display: flex;
  gap: 0.25rem;
  align-items: center;
}

.relic-icon {
  width: 1.5rem;
  height: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #e5e7eb;
  border-radius: 0.25rem;
  font-size: 0.75rem;
}

.more-relics {
  font-size: 0.75rem;
  color: #6b7280;
  background: #f3f4f6;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
}

.build-tags {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.build-tag {
  font-size: 0.75rem;
  background: #3b82f6;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
}

.more-tags {
  font-size: 0.75rem;
  color: #6b7280;
  background: #f3f4f6;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
}

.build-meta {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.75rem;
  color: #6b7280;
  padding-top: 0.75rem;
  border-top: 1px solid #e5e7eb;
}

/* Pagination */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  margin-top: 2rem;
}

.page-numbers {
  display: flex;
  gap: 0.25rem;
}

/* Context Menu */
.context-menu {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  min-width: 120px;
}

.context-menu-item {
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.context-menu-item:hover {
  background-color: #f3f4f6;
}

.context-menu-item.danger {
  color: #ef4444;
}

.context-menu-item.danger:hover {
  background-color: #fef2f2;
}

.context-menu-divider {
  height: 1px;
  background: #e5e7eb;
}

/* Import Modal */
.import-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* Transitions */
.build-item-enter-active,
.build-item-leave-active {
  transition: all 0.3s ease;
}

.build-item-enter-from,
.build-item-leave-to {
  opacity: 0;
  transform: scale(0.9);
}

.build-item-move {
  transition: transform 0.3s ease;
}

/* Animations */
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Responsive Design */
@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .header-actions {
    justify-content: center;
  }

  .build-stats {
    grid-template-columns: repeat(2, 1fr);
  }

  .filter-section {
    flex-direction: column;
  }

  .build-list.view-grid .build-grid {
    grid-template-columns: 1fr;
  }

  .build-header {
    flex-direction: column;
    gap: 0.75rem;
  }

  .build-actions {
    align-self: flex-end;
  }

  .relics-preview {
    flex-direction: column;
    gap: 0.5rem;
    align-items: flex-start;
  }
}

/* Dark Mode Support */
@media (prefers-color-scheme: dark) {
  .dashboard-title {
    color: #f9fafb;
  }

  .stat-card {
    background: #374151;
    border-color: #4b5563;
  }

  .stat-label {
    color: #9ca3af;
  }

  .filter-select {
    background: #374151;
    border-color: #4b5563;
    color: #f9fafb;
  }

  .build-name {
    color: #f9fafb;
  }

  .build-multiplier {
    background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
  }

  .relics-preview {
    background: #374151;
  }

  .relic-count {
    color: #d1d5db;
  }

  .relic-icon {
    background: #4b5563;
  }

  .build-meta {
    border-color: #4b5563;
  }

  .context-menu {
    background: #1f2937;
    border-color: #374151;
  }

  .context-menu-item:hover {
    background: #374151;
  }

  .context-menu-item.danger:hover {
    background: #431a1a;
  }

  .context-menu-divider {
    background: #374151;
  }
}
</style>

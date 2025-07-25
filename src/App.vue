<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRelics } from './composables/useRelics'
import { useBuilds } from './composables/useBuilds'
import { useOptimization } from './composables/useOptimization'
import type { Relic } from './types/relic'
import type { Build } from './types/build'
import type { AttackMultiplierResult, ComparisonResult, OptimizationSuggestion, CalculationHistory } from './types/calculation'

// Components
import RelicSelector from './components/RelicSelector.vue'
import AttackMultiplierDisplay from './components/AttackMultiplierDisplay.vue'
import BuildDashboard from './components/BuildDashboard.vue'
import BaseButton from './components/ui/BaseButton.vue'
import BaseModal from './components/ui/BaseModal.vue'
import BaseInput from './components/ui/BaseInput.vue'
import BaseCard from './components/ui/BaseCard.vue'

// Composables
const { relics, loading: relicsLoading, initialize: initializeRelics } = useRelics()
const { builds, loading: buildsLoading, initialize: initializeBuilds } = useBuilds()
const { 
  suggestOptimization, 
  loading: optimizationLoading,
  suggestions: optimizationSuggestions 
} = useOptimization()

// Navigation state
const activeTab = ref<'calculator' | 'builds' | 'history' | 'analytics'>('calculator')
const tabs = [
  { key: 'calculator', label: '計算機', icon: '🧮' },
  { key: 'builds', label: 'ビルド', icon: '🏗️' },
  { key: 'history', label: '履歴', icon: '📊' },
  { key: 'analytics', label: '分析', icon: '📈' }
]

// App state
const selectedRelicIds = ref<string[]>([])
const selectedBuildId = ref<string | null>(null)
const calculationResult = ref<AttackMultiplierResult | null>(null)
const calculationLoading = ref(false)
const calculationError = ref<string | null>(null)
const calculationProgress = ref(0)
const comparisonResults = ref<ComparisonResult[]>([])
const calculationHistory = ref<CalculationHistory[]>([])

// Settings state
const showSettings = ref(false)
const themePreference = ref<'light' | 'dark' | 'system'>('system')
const isDarkMode = ref(false)
const autoCalculate = ref(true)
const showComparison = ref(false)
const calculationTimeout = ref(30)

// UI state
const notifications = ref<Array<{ id: string; type: string; message: string; timeout?: number }>>([])
const globalLoading = ref(false)
const loadingMessage = ref('')

// Event Handlers
const handleRelicSelectionChange = async (selectedRelics: Relic[]) => {
  if (autoCalculate.value && selectedRelics.length > 0) {
    await calculateAttackMultiplier()
  } else if (selectedRelics.length === 0) {
    calculationResult.value = null
    calculationError.value = null
    optimizationSuggestions.value = []
    comparisonResults.value = []
  }

  if (selectedRelics.length > 0) {
    try {
      await suggestOptimization(selectedRelicIds.value)
    } catch (error) {
      console.error('Failed to get optimization suggestions:', error)
    }
  }
}

const handleRecalculate = async () => {
  await calculateAttackMultiplier()
}

const calculateAttackMultiplier = async () => {
  if (selectedRelicIds.value.length === 0) return

  calculationLoading.value = true
  calculationError.value = null
  calculationProgress.value = 0

  try {
    const progressInterval = setInterval(() => {
      if (calculationProgress.value < 90) {
        calculationProgress.value += Math.random() * 20
      }
    }, 200)

    // Mock calculation
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    clearInterval(progressInterval)
    calculationProgress.value = 100

    const mockResult: AttackMultiplierResult = {
      finalMultiplier: 2.35 + Math.random() * 2,
      baseMultiplier: 1.0,
      context: '通常攻撃',
      relicIds: [...selectedRelicIds.value],
      timestamp: new Date().toISOString(),
      effectBreakdown: selectedRelicIds.value.map((id, index) => ({
        id: `${id}-effect`,
        name: `効果 ${index + 1}`,
        sourceName: `遺物 ${index + 1}`,
        sourceId: id,
        type: Math.random() > 0.5 ? 'multiplicative' : 'additive' as any,
        value: 0.1 + Math.random() * 0.5,
        isActive: true,
        calculatedValue: 0.15 + Math.random() * 0.3
      })),
      performance: {
        executionTime: 1200 + Math.random() * 800,
        effectsProcessed: selectedRelicIds.value.length,
        optimizationLevel: 'basic' as any,
        cacheHits: 0,
        cacheMisses: 1
      }
    }

    calculationResult.value = mockResult
    addToCalculationHistory(mockResult)
    addNotification('success', '計算が完了しました')

  } catch (error) {
    calculationError.value = error instanceof Error ? error.message : '計算中にエラーが発生しました'
    addNotification('error', calculationError.value)
  } finally {
    calculationLoading.value = false
  }
}

const handleExportResult = (format: string, data: any) => {
  try {
    const filename = `calculation-result-${Date.now()}.${format}`
    downloadFile(data, filename, getContentType(format))
    addNotification('success', 'エクスポートが完了しました')
  } catch (error) {
    addNotification('error', 'エクスポートに失敗しました')
  }
}

const applySuggestion = async (suggestion: OptimizationSuggestion) => {
  try {
    switch (suggestion.type) {
      case 'add':
        if (!selectedRelicIds.value.includes(suggestion.relicId)) {
          selectedRelicIds.value.push(suggestion.relicId)
        }
        break
      case 'remove':
        selectedRelicIds.value = selectedRelicIds.value.filter(id => id !== suggestion.relicId)
        break
    }

    if (autoCalculate.value) {
      await calculateAttackMultiplier()
    }

    addNotification('success', '最適化提案を適用しました')
  } catch (error) {
    addNotification('error', '最適化提案の適用に失敗しました')
  }
}

// Build management
const handleBuildSelected = (build: Build) => {
  selectedBuildId.value = build.id
  selectedRelicIds.value = [...build.relicIds]
  activeTab.value = 'calculator'
  
  if (autoCalculate.value) {
    calculateAttackMultiplier()
  }
}

const handleBuildCreated = (build: Build) => {
  addNotification('success', `ビルド「${build.name}」を作成しました`)
}

const handleBuildUpdated = (build: Build) => {
  addNotification('success', `ビルド「${build.name}」を更新しました`)
}

const handleBuildDeleted = (buildId: string) => {
  if (selectedBuildId.value === buildId) {
    selectedBuildId.value = null
  }
  addNotification('success', 'ビルドを削除しました')
}

// History management
const addToCalculationHistory = (result: AttackMultiplierResult) => {
  const historyItem: CalculationHistory = {
    id: `calc-${Date.now()}`,
    timestamp: result.timestamp,
    relicIds: [...result.relicIds],
    result,
    tags: []
  }
  
  calculationHistory.value.unshift(historyItem)
  
  if (calculationHistory.value.length > 100) {
    calculationHistory.value = calculationHistory.value.slice(0, 100)
  }
}

// Theme management
const toggleTheme = () => {
  themePreference.value = isDarkMode.value ? 'light' : 'dark'
  applyTheme()
}

const applyTheme = () => {
  const html = document.documentElement
  
  switch (themePreference.value) {
    case 'dark':
      html.classList.add('dark')
      isDarkMode.value = true
      break
    case 'light':
      html.classList.remove('dark')
      isDarkMode.value = false
      break
    case 'system':
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      html.classList.toggle('dark', prefersDark)
      isDarkMode.value = prefersDark
      break
  }
  
  localStorage.setItem('theme-preference', themePreference.value)
}

// Utility functions
const getSuggestionTypeLabel = (type: string): string => {
  const labels = {
    add: '追加',
    remove: '削除',
    replace: '交換'
  }
  return labels[type] || type
}

const addNotification = (type: 'success' | 'error' | 'info' | 'warning', message: string, timeout = 5000) => {
  const notification = {
    id: `notif-${Date.now()}`,
    type,
    message,
    timeout
  }
  
  notifications.value.push(notification)
  
  if (timeout > 0) {
    setTimeout(() => {
      dismissNotification(notification.id)
    }, timeout)
  }
}

const dismissNotification = (id: string) => {
  const index = notifications.value.findIndex(n => n.id === id)
  if (index > -1) {
    notifications.value.splice(index, 1)
  }
}

const downloadFile = (data: string, filename: string, contentType: string) => {
  const blob = new Blob([data], { type: contentType })
  const url = URL.createObjectURL(blob)
  
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  
  URL.revokeObjectURL(url)
}

const getContentType = (format: string): string => {
  const types = {
    'json': 'application/json',
    'csv': 'text/csv',
    'txt': 'text/plain'
  }
  return types[format] || 'application/octet-stream'
}

// System theme change listener
const handleSystemThemeChange = (e: MediaQueryListEvent) => {
  if (themePreference.value === 'system') {
    isDarkMode.value = e.matches
    document.documentElement.classList.toggle('dark', e.matches)
  }
}

// Lifecycle
onMounted(async () => {
  const savedTheme = localStorage.getItem('theme-preference') as typeof themePreference.value
  if (savedTheme) {
    themePreference.value = savedTheme
  }
  applyTheme()
  
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  mediaQuery.addEventListener('change', handleSystemThemeChange)
  
  try {
    globalLoading.value = true
    loadingMessage.value = 'アプリケーションを初期化中...'
    
    await Promise.all([
      initializeRelics(),
      initializeBuilds()
    ])
    
    addNotification('success', 'アプリケーションの初期化が完了しました')
  } catch (error) {
    addNotification('error', 'アプリケーションの初期化に失敗しました')
  } finally {
    globalLoading.value = false
  }
  
  // Load saved relics
  const savedIds = localStorage.getItem('selected-relic-ids')
  if (savedIds) {
    try {
      selectedRelicIds.value = JSON.parse(savedIds)
    } catch (error) {
      console.error('Failed to load saved relic IDs:', error)
    }
  }
})

onBeforeUnmount(() => {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  mediaQuery.removeEventListener('change', handleSystemThemeChange)
})

// Auto-save selected relics
watch(selectedRelicIds, (newIds) => {
  localStorage.setItem('selected-relic-ids', JSON.stringify(newIds))
}, { deep: true })
</script>

<template>
  <div id="app" class="app-container">
    <!-- App Header -->
    <header class="app-header">
      <div class="header-content">
        <div class="app-title">
          <h1>エルデンリング ナイトレイン 遺物計算機</h1>
          <p class="app-subtitle">遺物を組み合わせて最適な攻撃倍率を計算</p>
        </div>
        
        <div class="header-actions">
          <BaseButton
            @click="toggleTheme"
            variant="ghost"
            size="sm"
            :title="isDarkMode ? 'ライトモードに切り替え' : 'ダークモードに切り替え'"
          >
            {{ isDarkMode ? '☀️' : '🌙' }}
          </BaseButton>
          
          <BaseButton
            @click="showSettings = true"
            variant="ghost"
            size="sm"
            title="設定"
          >
            ⚙️
          </BaseButton>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="app-main">
      <div class="main-content">
        <!-- Navigation Tabs -->
        <nav class="tab-navigation">
          <BaseButton
            v-for="tab in tabs"
            :key="tab.key"
            @click="activeTab = tab.key"
            :variant="activeTab === tab.key ? 'primary' : 'ghost'"
            size="md"
            class="tab-button"
          >
            {{ tab.icon }} {{ tab.label }}
          </BaseButton>
        </nav>

        <!-- Tab Content -->
        <div class="tab-content">
          <!-- Calculator Tab -->
          <div v-if="activeTab === 'calculator'" class="calculator-tab">
            <div class="calculator-layout">
              <!-- Left Panel: Relic Selection -->
              <div class="left-panel">
                <RelicSelector
                  v-model="selectedRelicIds"
                  :max-selections="9"
                  :show-selected="true"
                  :allow-search="true"
                  :allow-filters="true"
                  @selection-change="handleRelicSelectionChange"
                />
              </div>

              <!-- Right Panel: Results -->
              <div class="right-panel">
                <AttackMultiplierDisplay
                  :result="calculationResult"
                  :loading="calculationLoading"
                  :error="calculationError"
                  :show-breakdown="true"
                  :show-comparison="showComparison"
                  :comparison-results="comparisonResults"
                  :progress="calculationProgress"
                  :can-recalculate="selectedRelicIds.length > 0"
                  @recalculate="handleRecalculate"
                  @export="handleExportResult"
                />

                <!-- Optimization Suggestions -->
                <div v-if="optimizationSuggestions.length > 0" class="optimization-panel">
                  <BaseCard variant="filled" padding="md">
                    <template #header>
                      <h4>最適化提案</h4>
                    </template>
                    
                    <div class="suggestions-list">
                      <div
                        v-for="suggestion in optimizationSuggestions"
                        :key="suggestion.relicId"
                        class="suggestion-item"
                      >
                        <div class="suggestion-info">
                          <strong>{{ suggestion.relicName }}</strong>
                          <span class="suggestion-type">{{ getSuggestionTypeLabel(suggestion.type) }}</span>
                        </div>
                        <div class="suggestion-benefit">
                          <span class="improvement">+{{ suggestion.improvement.toFixed(2) }}倍</span>
                          <span class="confidence">{{ Math.round(suggestion.confidence * 100) }}%</span>
                        </div>
                        <BaseButton
                          @click="applySuggestion(suggestion)"
                          variant="outline"
                          size="sm"
                        >
                          適用
                        </BaseButton>
                      </div>
                    </div>
                  </BaseCard>
                </div>
              </div>
            </div>
          </div>

          <!-- Builds Tab -->
          <div v-if="activeTab === 'builds'" class="builds-tab">
            <BuildDashboard
              :selected-build-id="selectedBuildId"
              @build-selected="handleBuildSelected"
              @build-created="handleBuildCreated"
              @build-updated="handleBuildUpdated"
              @build-deleted="handleBuildDeleted"
            />
          </div>

          <!-- Other tabs would go here -->
          <div v-if="activeTab === 'history'" class="history-tab">
            <div class="coming-soon">
              <h3>📊 計算履歴</h3>
              <p>計算履歴機能は開発中です</p>
            </div>
          </div>

          <div v-if="activeTab === 'analytics'" class="analytics-tab">
            <div class="coming-soon">
              <h3>📈 分析ダッシュボード</h3>
              <p>分析機能は開発中です</p>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Settings Modal -->
    <BaseModal v-model:show="showSettings" title="設定" size="md">
      <div class="settings-content">
        <!-- Theme Settings -->
        <div class="setting-group">
          <h4>テーマ設定</h4>
          <div class="setting-item">
            <label>
              <input
                type="radio"
                v-model="themePreference"
                value="light"
                @change="applyTheme"
              />
              ライトモード
            </label>
          </div>
          <div class="setting-item">
            <label>
              <input
                type="radio"
                v-model="themePreference"
                value="dark"  
                @change="applyTheme"
              />
              ダークモード
            </label>
          </div>
          <div class="setting-item">
            <label>
              <input
                type="radio"
                v-model="themePreference"
                value="system"
                @change="applyTheme"
              />
              システム設定に従う
            </label>
          </div>
        </div>

        <!-- Calculation Settings -->
        <div class="setting-group">
          <h4>計算設定</h4>
          <div class="setting-item">
            <label>
              <input
                type="checkbox"
                v-model="autoCalculate"
              />
              自動計算を有効にする
            </label>
          </div>
          <div class="setting-item">
            <label>
              <input
                type="checkbox"
                v-model="showComparison"
              />
              比較表示を有効にする
            </label>
          </div>
        </div>
      </div>
      
      <template #footer>
        <BaseButton @click="showSettings = false" variant="primary">
          閉じる
        </BaseButton>
      </template>
    </BaseModal>

    <!-- Notifications -->
    <div v-if="notifications.length > 0" class="notifications">
      <div
        v-for="notification in notifications"
        :key="notification.id"
        :class="['notification', `notification-${notification.type}`]"
        @click="dismissNotification(notification.id)"
      >
        {{ notification.message }}
      </div>
    </div>

    <!-- Loading Overlay -->
    <div v-if="globalLoading" class="loading-overlay">
      <div class="loading-content">
        <div class="spinner-large"></div>
        <p>{{ loadingMessage }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.app-container {
  min-height: 100vh;
  background-color: #f9fafb;
  transition: background-color 0.2s ease;
}

/* Header */
.app-header {
  background: white;
  border-bottom: 1px solid #e5e7eb;
  padding: 1rem 0;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.app-title h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
}

.app-subtitle {
  margin: 0.25rem 0 0 0;
  font-size: 0.875rem;
  color: #6b7280;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

/* Main Content */
.app-main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.main-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

/* Navigation */
.tab-navigation {
  display: flex;
  gap: 0.5rem;
  padding: 0.5rem;
  background: white;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
}

.tab-button {
  flex: 1;
  justify-content: center;
}

/* Tab Content */
.tab-content {
  min-height: 600px;
}

/* Calculator Layout */
.calculator-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  align-items: start;
}

.left-panel,
.right-panel {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.optimization-panel {
  margin-top: 1.5rem;
}

.suggestions-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.suggestion-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  background: white;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
}

.suggestion-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
}

.suggestion-type {
  font-size: 0.75rem;
  color: #6b7280;
  background: #f3f4f6;
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  width: fit-content;
}

.suggestion-benefit {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.25rem;
}

.improvement {
  font-weight: 600;
  color: #059669;
}

.confidence {
  font-size: 0.75rem;
  color: #6b7280;
}

/* Coming Soon */
.coming-soon {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 4rem 2rem;
  text-align: center;
  background: white;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
}

/* Settings */
.settings-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.setting-group {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.setting-group h4 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 0.5rem;
}

.setting-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.setting-item label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #374151;
  cursor: pointer;
}

/* Notifications */
.notifications {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.notification {
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
  max-width: 300px;
}

.notification-success {
  background: #10b981;
}

.notification-error {
  background: #ef4444;
}

.notification-info {
  background: #3b82f6;
}

.notification-warning {
  background: #f59e0b;
}

.notification:hover {
  transform: translateX(-4px);
}

/* Loading Overlay */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  background: white;
  padding: 2rem;
  border-radius: 0.5rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.spinner-large {
  width: 3rem;
  height: 3rem;
  border: 3px solid #e5e7eb;
  border-top: 3px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Responsive Design */
@media (max-width: 1024px) {
  .calculator-layout {
    grid-template-columns: 1fr;
  }
  
  .tab-navigation {
    flex-wrap: wrap;
  }
  
  .tab-button {
    flex: none;
    min-width: 120px;
  }
}

@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
  
  .app-main {
    padding: 1rem;
  }
  
  .suggestion-item {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
  }
  
  .suggestion-benefit {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
  
  .notifications {
    left: 1rem;
    right: 1rem;
  }
  
  .notification {
    max-width: none;
  }
}

/* Dark Mode */
.dark .app-container {
  background-color: #111827;
}

.dark .app-header {
  background: #1f2937;
  border-color: #374151;
}

.dark .app-title h1 {
  color: #f9fafb;
}

.dark .app-subtitle {
  color: #9ca3af;
}

.dark .tab-navigation {
  background: #1f2937;
  border-color: #374151;
}

.dark .suggestion-item {
  background: #1f2937;
  border-color: #374151;
}

.dark .suggestion-type {
  background: #374151;
  color: #d1d5db;
}

.dark .coming-soon {
  background: #1f2937;
  border-color: #374151;
  color: #f9fafb;
}

.dark .setting-group h4 {
  color: #d1d5db;
  border-color: #374151;
}

.dark .setting-item label {
  color: #d1d5db;
}

.dark .loading-content {
  background: #1f2937;
  color: #f9fafb;
}
</style>

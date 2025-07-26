<template>
  <div id="app" class="app-container">
    <div v-if="loadingError" class="error-display">
      <h2>🚨 アプリケーション読み込みエラー</h2>
      <div class="error-details">
        <h3>エラー詳細:</h3>
        <pre>{{ loadingError }}</pre>
      </div>
      <div class="error-actions">
        <button class="retry-button" @click="retryLoad">再試行</button>
        <button class="debug-button" @click="showDebugInfo = !showDebugInfo">
          {{ showDebugInfo ? 'デバッグ情報を隠す' : 'デバッグ情報を表示' }}
        </button>
      </div>

      <div v-if="showDebugInfo" class="debug-info">
        <h3>デバッグ情報:</h3>
        <div class="debug-section">
          <h4>コンポーザブル状態:</h4>
          <ul>
            <li>relicsComposable: {{ relicsComposableStatus }}</li>
            <li>buildsComposable: {{ buildsComposableStatus }}</li>
            <li>optimizationComposable: {{ optimizationComposableStatus }}</li>
          </ul>
        </div>
        <div class="debug-section">
          <h4>API Status:</h4>
          <p>{{ apiStatus }}</p>
        </div>
      </div>
    </div>

    <div v-else-if="isLoading" class="loading-display">
      <div class="spinner"></div>
      <p>アプリケーションを読み込み中...</p>
      <p class="loading-step">{{ currentLoadingStep }}</p>
    </div>

    <div v-else class="app-content">
      <!-- 正常にロードされた場合のコンテンツ -->
      <header class="app-header">
        <div class="header-content">
          <div class="app-title">
            <h1>エルデンリング ナイトレイン 遺物計算機</h1>
            <p class="app-subtitle">アプリケーションが正常に読み込まれました</p>
          </div>
          <div class="status-indicator">✅ 動作中</div>
        </div>
      </header>

      <main class="app-main">
        <div class="success-message">
          <h2>🎉 アプリケーションは正常に動作しています</h2>
          <p>すべてのコンポーザブルが正常に初期化されました。</p>
          <button class="switch-button" @click="switchToFullApp">
            フル機能版に切り替え
          </button>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onErrorCaptured } from 'vue'

// 状態管理
const isLoading = ref(true)
const loadingError = ref<string | null>(null)
const showDebugInfo = ref(false)
const currentLoadingStep = ref('')

// デバッグ情報
const relicsComposableStatus = ref('未初期化')
const buildsComposableStatus = ref('未初期化')
const optimizationComposableStatus = ref('未初期化')
const apiStatus = ref('未確認')

// エラーキャッチャー
onErrorCaptured((error, instance, info) => {
  console.error('Vue Error Captured:', error, info)
  loadingError.value = `Vue Error: ${error.message}\nInfo: ${info}\nStack: ${error.stack}`
  isLoading.value = false
  return false
})

// グローバルエラーハンドラー
window.addEventListener('error', event => {
  console.error('Global Error:', event.error)
  loadingError.value = `Global Error: ${event.error?.message || event.message}\nFilename: ${event.filename}\nLine: ${event.lineno}`
  isLoading.value = false
})

window.addEventListener('unhandledrejection', event => {
  console.error('Unhandled Promise Rejection:', event.reason)
  loadingError.value = `Promise Rejection: ${event.reason?.message || event.reason}`
  isLoading.value = false
})

const retryLoad = () => {
  loadingError.value = null
  isLoading.value = true
  loadComposables()
}

const switchToFullApp = () => {
  // main.tsを元のApp.vueに切り替える処理は手動で行う
  alert('main.tsでApp.vueに切り替えてください')
}

const loadComposables = async () => {
  try {
    currentLoadingStep.value = 'コンポーザブルをインポート中...'

    // Step 1: useRelics
    currentLoadingStep.value = 'useRelicsをテスト中...'
    try {
      const { useRelics } = await import('./composables/useRelics')
      const relicsComposable = useRelics()
      relicsComposableStatus.value = '✅ 正常'
      console.log('useRelics loaded successfully')
    } catch (error) {
      relicsComposableStatus.value = `❌ エラー: ${error.message}`
      throw new Error(`useRelics failed: ${error.message}`)
    }

    // Step 2: useBuilds
    currentLoadingStep.value = 'useBuildsをテスト中...'
    try {
      const { useBuilds } = await import('./composables/useBuilds')
      const buildsComposable = useBuilds()
      buildsComposableStatus.value = '✅ 正常'
      console.log('useBuilds loaded successfully')
    } catch (error) {
      buildsComposableStatus.value = `❌ エラー: ${error.message}`
      throw new Error(`useBuilds failed: ${error.message}`)
    }

    // Step 3: useOptimization
    currentLoadingStep.value = 'useOptimizationをテスト中...'
    try {
      const { useOptimization } = await import('./composables/useOptimization')
      const optimizationComposable = useOptimization()
      optimizationComposableStatus.value = '✅ 正常'
      console.log('useOptimization loaded successfully')
    } catch (error) {
      optimizationComposableStatus.value = `❌ エラー: ${error.message}`
      throw new Error(`useOptimization failed: ${error.message}`)
    }

    // Step 4: API Status Check
    currentLoadingStep.value = 'APIサービスをテスト中...'
    try {
      const { apiService } = await import('./services/api')
      apiStatus.value = '✅ インポート成功'
      console.log('API service loaded successfully')
    } catch (error) {
      apiStatus.value = `❌ エラー: ${error.message}`
      throw new Error(`API service failed: ${error.message}`)
    }

    // 成功
    currentLoadingStep.value = '完了'
    isLoading.value = false
    console.log('All composables loaded successfully!')
  } catch (error) {
    console.error('Loading error:', error)
    loadingError.value = error.message
    isLoading.value = false
  }
}

onMounted(() => {
  console.log('Debug App mounted')
  setTimeout(() => {
    loadComposables()
  }, 500)
})
</script>

<style scoped>
.app-container {
  min-height: 100vh;
  padding: 2rem;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.error-display {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  background: #fef2f2;
  border: 2px solid #fecaca;
  border-radius: 0.75rem;
}

.error-display h2 {
  color: #dc2626;
  margin-bottom: 1rem;
}

.error-details {
  margin: 1.5rem 0;
  padding: 1rem;
  background: white;
  border-radius: 0.5rem;
  border: 1px solid #fecaca;
}

.error-details pre {
  white-space: pre-wrap;
  word-break: break-word;
  color: #7f1d1d;
  font-size: 0.875rem;
  margin: 0;
}

.error-actions {
  display: flex;
  gap: 1rem;
  margin: 1.5rem 0;
}

.retry-button,
.debug-button,
.switch-button {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
}

.retry-button {
  background: #dc2626;
  color: white;
}

.retry-button:hover {
  background: #b91c1c;
}

.debug-button {
  background: #6b7280;
  color: white;
}

.debug-button:hover {
  background: #4b5563;
}

.switch-button {
  background: #059669;
  color: white;
}

.switch-button:hover {
  background: #047857;
}

.debug-info {
  margin-top: 1.5rem;
  padding: 1rem;
  background: white;
  border-radius: 0.5rem;
  border: 1px solid #d1d5db;
}

.debug-section {
  margin-bottom: 1rem;
}

.debug-section h4 {
  color: #374151;
  margin-bottom: 0.5rem;
}

.debug-section ul {
  margin: 0;
  padding-left: 1.5rem;
}

.debug-section li {
  margin-bottom: 0.25rem;
  font-family: 'Courier New', monospace;
}

.loading-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  text-align: center;
}

.spinner {
  width: 3rem;
  height: 3rem;
  border: 3px solid #e5e7eb;
  border-top: 3px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-step {
  color: #6b7280;
  font-style: italic;
  margin-top: 0.5rem;
}

.app-content {
  max-width: 1200px;
  margin: 0 auto;
}

.app-header {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.app-title h1 {
  margin: 0;
  color: #111827;
  font-size: 1.75rem;
}

.app-subtitle {
  margin: 0.5rem 0 0 0;
  color: #6b7280;
}

.status-indicator {
  background: #dcfce7;
  color: #166534;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-weight: 600;
  border: 1px solid #bbf7d0;
}

.app-main {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  padding: 3rem;
  text-align: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.success-message h2 {
  color: #059669;
  margin-bottom: 1rem;
}

.success-message p {
  color: #6b7280;
  margin-bottom: 2rem;
}
</style>

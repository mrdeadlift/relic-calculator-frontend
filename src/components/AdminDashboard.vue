<template>
  <div class="admin-dashboard">
    <!-- ヘッダー -->
    <div class="dashboard-header">
      <h1 class="dashboard-title">管理者ダッシュボード</h1>
      <div class="dashboard-actions">
        <BaseButton
          variant="primary"
          :loading="importLoading"
          @click="showImportModal = true"
        >
          <i class="icon-upload"></i>
          インポート
        </BaseButton>
        <BaseButton
          variant="secondary"
          :loading="exportLoading"
          @click="exportRelics"
        >
          <i class="icon-download"></i>
          エクスポート
        </BaseButton>
        <BaseButton variant="success" @click="showCreateModal = true">
          <i class="icon-plus"></i>
          新規遺物作成
        </BaseButton>
      </div>
    </div>

    <!-- 統計情報 -->
    <div class="statistics-section">
      <h2>システム統計</h2>
      <div class="stats-cards">
        <div class="stat-card">
          <div class="stat-icon">
            <i class="icon-relic"></i>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ statistics?.totalRelics || 0 }}</div>
            <div class="stat-label">総遺物数</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">
            <i class="icon-build"></i>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ statistics?.totalBuilds || 0 }}</div>
            <div class="stat-label">総ビルド数</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">
            <i class="icon-calculation"></i>
          </div>
          <div class="stat-content">
            <div class="stat-number">
              {{ statistics?.totalCalculations || 0 }}
            </div>
            <div class="stat-label">計算実行回数</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">
            <i class="icon-user"></i>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ statistics?.activeUsers || 0 }}</div>
            <div class="stat-label">アクティブユーザー</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 遺物管理セクション -->
    <div class="relics-management">
      <div class="section-header">
        <h2>遺物管理</h2>
        <div class="section-actions">
          <BaseInput
            v-model="searchQuery"
            placeholder="遺物を検索..."
            class="search-input"
          />
          <select v-model="categoryFilter" class="filter-select">
            <option value="">全カテゴリ</option>
            <option
              v-for="category in categories"
              :key="category"
              :value="category"
            >
              {{ category }}
            </option>
          </select>
          <select v-model="rarityFilter" class="filter-select">
            <option value="">全レアリティ</option>
            <option v-for="rarity in rarities" :key="rarity" :value="rarity">
              {{ rarity }}
            </option>
          </select>
        </div>
      </div>

      <!-- 遺物テーブル -->
      <div class="relics-table-container">
        <table class="relics-table">
          <thead>
            <tr>
              <th>名前</th>
              <th>カテゴリ</th>
              <th>レアリティ</th>
              <th>難易度</th>
              <th>効果数</th>
              <th>最終更新</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="relic in filteredRelics"
              :key="relic.id"
              class="relic-row"
            >
              <td class="relic-name">
                <div class="relic-info">
                  <img
                    :src="relic.iconUrl"
                    :alt="relic.name"
                    class="relic-icon"
                  />
                  <div>
                    <div class="name">{{ relic.name }}</div>
                    <div class="description">{{ relic.description }}</div>
                  </div>
                </div>
              </td>
              <td>
                <span
                  class="badge"
                  :class="`badge-${relic.category.toLowerCase()}`"
                >
                  {{ relic.category }}
                </span>
              </td>
              <td>
                <span class="rarity" :class="`rarity-${relic.rarity}`">
                  {{ relic.rarity }}
                </span>
              </td>
              <td>
                <div class="difficulty-bar">
                  <div
                    class="difficulty-fill"
                    :style="{
                      width: `${(relic.obtainmentDifficulty / 10) * 100}%`,
                    }"
                  ></div>
                  <span class="difficulty-text"
                    >{{ relic.obtainmentDifficulty }}/10</span
                  >
                </div>
              </td>
              <td>{{ relic.effects?.length || 0 }}</td>
              <td>{{ formatDate(relic.updatedAt) }}</td>
              <td>
                <div class="action-buttons">
                  <BaseButton
                    variant="secondary"
                    size="small"
                    @click="editRelic(relic)"
                  >
                    編集
                  </BaseButton>
                  <BaseButton
                    variant="danger"
                    size="small"
                    :loading="deletingId === relic.id"
                    @click="confirmDelete(relic)"
                  >
                    削除
                  </BaseButton>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- 空状態 -->
        <div v-if="filteredRelics.length === 0" class="empty-state">
          <i class="icon-empty"></i>
          <p>条件に一致する遺物が見つかりません</p>
        </div>
      </div>
    </div>

    <!-- データ整合性チェック -->
    <div class="integrity-check-section">
      <h2>データ整合性チェック</h2>
      <div class="integrity-actions">
        <BaseButton
          variant="primary"
          :loading="integrityLoading"
          @click="runIntegrityCheck"
        >
          <i class="icon-check"></i>
          整合性チェック実行
        </BaseButton>
        <BaseButton
          v-if="integrityResults"
          variant="warning"
          @click="showIntegrityResults = true"
        >
          <i class="icon-warning"></i>
          結果を表示 ({{ integrityResults.issues?.length || 0 }}件の問題)
        </BaseButton>
      </div>

      <div
        v-if="integrityResults && showIntegrityResults"
        class="integrity-results"
      >
        <div
          v-for="issue in integrityResults.issues"
          :key="issue.id"
          class="integrity-issue"
        >
          <div class="issue-severity" :class="`severity-${issue.severity}`">
            {{ issue.severity }}
          </div>
          <div class="issue-content">
            <div class="issue-title">{{ issue.title }}</div>
            <div class="issue-description">{{ issue.description }}</div>
            <div class="issue-suggestion">推奨対応: {{ issue.suggestion }}</div>
          </div>
          <div class="issue-actions">
            <BaseButton
              v-if="issue.autoFixable"
              variant="success"
              size="small"
              @click="autoFixIssue(issue.id)"
            >
              自動修正
            </BaseButton>
          </div>
        </div>
      </div>
    </div>

    <!-- 遺物作成/編集モーダル -->
    <BaseModal v-model="showCreateModal" title="新規遺物作成" size="large">
      <RelicForm
        :relic="editingRelic"
        :loading="saveLoading"
        @submit="saveRelic"
        @cancel="closeModal"
      />
    </BaseModal>

    <!-- インポートモーダル -->
    <BaseModal
      v-model="showImportModal"
      title="遺物データインポート"
      size="medium"
    >
      <ImportForm
        :loading="importLoading"
        @submit="importRelics"
        @cancel="showImportModal = false"
      />
    </BaseModal>

    <!-- 削除確認モーダル -->
    <BaseModal v-model="showDeleteModal" title="遺物削除確認" size="small">
      <div class="delete-confirmation">
        <p>「{{ deletingRelic?.name }}」を削除しますか？</p>
        <p class="warning-text">この操作は元に戻せません。</p>
        <div class="modal-actions">
          <BaseButton variant="secondary" @click="showDeleteModal = false">
            キャンセル
          </BaseButton>
          <BaseButton
            variant="danger"
            :loading="deletingId === deletingRelic?.id"
            @click="deleteRelic"
          >
            削除
          </BaseButton>
        </div>
      </div>
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { Relic, RelicCategory, RelicRarity } from '../types'
import BaseButton from './ui/BaseButton.vue'
import BaseInput from './ui/BaseInput.vue'
import BaseModal from './ui/BaseModal.vue'
import RelicForm from './RelicForm.vue'
import ImportForm from './ImportForm.vue'
import { adminService } from '../services/admin'
import { useToast } from '../composables/useToast'

// Props & Emits
const emit = defineEmits<{
  'relic-updated': [relic: Relic]
  'relic-deleted': [relicId: string]
}>()

// Toast通知
const { showToast } = useToast()

// データ管理
const relics = ref<Relic[]>([])
const statistics = ref<any>(null)
const categories = ref<RelicCategory[]>([])
const rarities = ref<RelicRarity[]>([])

// フィルタリング・検索
const searchQuery = ref('')
const categoryFilter = ref('')
const rarityFilter = ref('')

// モーダル状態
const showCreateModal = ref(false)
const showImportModal = ref(false)
const showDeleteModal = ref(false)
const showIntegrityResults = ref(false)

// ローディング状態
const saveLoading = ref(false)
const importLoading = ref(false)
const exportLoading = ref(false)
const integrityLoading = ref(false)
const deletingId = ref<string | null>(null)

// 編集・削除対象
const editingRelic = ref<Relic | null>(null)
const deletingRelic = ref<Relic | null>(null)

// 整合性チェック結果
const integrityResults = ref<any>(null)

// 計算プロパティ
const filteredRelics = computed(() => {
  return relics.value.filter(relic => {
    const matchesSearch =
      !searchQuery.value ||
      relic.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      relic.description.toLowerCase().includes(searchQuery.value.toLowerCase())

    const matchesCategory =
      !categoryFilter.value || relic.category === categoryFilter.value
    const matchesRarity =
      !rarityFilter.value || relic.rarity === rarityFilter.value

    return matchesSearch && matchesCategory && matchesRarity
  })
})

// ライフサイクル
onMounted(async () => {
  await loadData()
})

// メソッド
const loadData = async () => {
  try {
    const [relicsData, statisticsData, categoriesData, raritiesData] =
      await Promise.all([
        adminService.getRelics(),
        adminService.getStatistics(),
        adminService.getCategories(),
        adminService.getRarities(),
      ])

    relics.value = relicsData
    statistics.value = statisticsData
    categories.value = categoriesData
    rarities.value = raritiesData
  } catch (error) {
    console.error('Failed to load admin data:', error)
    showToast('データの読み込みに失敗しました', 'error')
  }
}

const editRelic = (relic: Relic) => {
  editingRelic.value = { ...relic }
  showCreateModal.value = true
}

const saveRelic = async (relicData: any) => {
  saveLoading.value = true
  try {
    let savedRelic: Relic

    if (editingRelic.value?.id) {
      savedRelic = await adminService.updateRelic(
        editingRelic.value.id,
        relicData
      )
      const index = relics.value.findIndex(r => r.id === savedRelic.id)
      if (index !== -1) {
        relics.value[index] = savedRelic
      }
      showToast('遺物を更新しました', 'success')
      emit('relic-updated', savedRelic)
    } else {
      savedRelic = await adminService.createRelic(relicData)
      relics.value.unshift(savedRelic)
      showToast('遺物を作成しました', 'success')
    }

    closeModal()
  } catch (error) {
    console.error('Failed to save relic:', error)
    showToast('遺物の保存に失敗しました', 'error')
  } finally {
    saveLoading.value = false
  }
}

const confirmDelete = (relic: Relic) => {
  deletingRelic.value = relic
  showDeleteModal.value = true
}

const deleteRelic = async () => {
  if (!deletingRelic.value) return

  deletingId.value = deletingRelic.value.id
  try {
    await adminService.deleteRelic(deletingRelic.value.id)
    relics.value = relics.value.filter(r => r.id !== deletingRelic.value!.id)
    showToast('遺物を削除しました', 'success')
    emit('relic-deleted', deletingRelic.value.id)
    showDeleteModal.value = false
  } catch (error) {
    console.error('Failed to delete relic:', error)
    showToast('遺物の削除に失敗しました', 'error')
  } finally {
    deletingId.value = null
  }
}

const exportRelics = async () => {
  exportLoading.value = true
  try {
    const blob = await adminService.exportRelics()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `relics_export_${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    showToast('遺物データをエクスポートしました', 'success')
  } catch (error) {
    console.error('Failed to export relics:', error)
    showToast('エクスポートに失敗しました', 'error')
  } finally {
    exportLoading.value = false
  }
}

const importRelics = async (file: File) => {
  importLoading.value = true
  try {
    const result = await adminService.importRelics(file)
    await loadData() // データを再読み込み
    showToast(`${result.imported}件の遺物をインポートしました`, 'success')
    showImportModal.value = false
  } catch (error) {
    console.error('Failed to import relics:', error)
    showToast('インポートに失敗しました', 'error')
  } finally {
    importLoading.value = false
  }
}

const runIntegrityCheck = async () => {
  integrityLoading.value = true
  try {
    integrityResults.value = await adminService.runIntegrityCheck()
    showIntegrityResults.value = true
    showToast('整合性チェックが完了しました', 'success')
  } catch (error) {
    console.error('Failed to run integrity check:', error)
    showToast('整合性チェックに失敗しました', 'error')
  } finally {
    integrityLoading.value = false
  }
}

const autoFixIssue = async (issueId: string) => {
  try {
    await adminService.autoFixIssue(issueId)
    await runIntegrityCheck() // 再チェック
    showToast('問題を自動修正しました', 'success')
  } catch (error) {
    console.error('Failed to auto-fix issue:', error)
    showToast('自動修正に失敗しました', 'error')
  }
}

const closeModal = () => {
  showCreateModal.value = false
  editingRelic.value = null
}

const formatDate = (date: string | Date) => {
  return new Date(date).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

<style scoped>
.admin-dashboard {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #e2e8f0;
}

.dashboard-title {
  font-size: 2rem;
  font-weight: bold;
  color: #2d3748;
}

.dashboard-actions {
  display: flex;
  gap: 1rem;
}

.statistics-section {
  margin-bottom: 3rem;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-top: 1rem;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 1rem;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.5rem;
}

.stat-number {
  font-size: 2rem;
  font-weight: bold;
  color: #2d3748;
}

.stat-label {
  color: #718096;
  font-size: 0.875rem;
}

.relics-management {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.section-actions {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.search-input {
  min-width: 250px;
}

.filter-select {
  padding: 0.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 0.875rem;
  min-width: 120px;
}

.relics-table-container {
  overflow-x: auto;
}

.relics-table {
  width: 100%;
  border-collapse: collapse;
  border-spacing: 0;
}

.relics-table th {
  background: #f7fafc;
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  color: #4a5568;
  border-bottom: 2px solid #e2e8f0;
}

.relics-table td {
  padding: 1rem;
  border-bottom: 1px solid #e2e8f0;
  vertical-align: middle;
}

.relic-row:hover {
  background: #f7fafc;
}

.relic-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.relic-icon {
  width: 40px;
  height: 40px;
  border-radius: 6px;
  object-fit: cover;
}

.name {
  font-weight: 600;
  color: #2d3748;
}

.description {
  font-size: 0.875rem;
  color: #718096;
  margin-top: 0.25rem;
}

.badge {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.badge-attack {
  background: #fed7d7;
  color: #c53030;
}
.badge-defense {
  background: #c6f6d5;
  color: #2f855a;
}
.badge-utility {
  background: #bee3f8;
  color: #2c5282;
}
.badge-critical {
  background: #fbb6ce;
  color: #b83280;
}
.badge-elemental {
  background: #d6f5d6;
  color: #38a169;
}

.rarity {
  font-weight: 600;
  text-transform: capitalize;
}

.rarity-common {
  color: #718096;
}
.rarity-rare {
  color: #3182ce;
}
.rarity-epic {
  color: #805ad5;
}
.rarity-legendary {
  color: #d69e2e;
}

.difficulty-bar {
  position: relative;
  width: 80px;
  height: 20px;
  background: #e2e8f0;
  border-radius: 10px;
  overflow: hidden;
}

.difficulty-fill {
  height: 100%;
  background: linear-gradient(90deg, #48bb78, #ed8936, #e53e3e);
  transition: width 0.3s ease;
}

.difficulty-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 0.75rem;
  font-weight: 600;
  color: #2d3748;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: #718096;
}

.empty-state i {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.integrity-check-section {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.integrity-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.integrity-results {
  margin-top: 1.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
}

.integrity-issue {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem;
  border-bottom: 1px solid #e2e8f0;
}

.integrity-issue:last-child {
  border-bottom: none;
}

.issue-severity {
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  flex-shrink: 0;
}

.severity-error {
  background: #fed7d7;
  color: #c53030;
}
.severity-warning {
  background: #fefcbf;
  color: #d69e2e;
}
.severity-info {
  background: #bee3f8;
  color: #2c5282;
}

.issue-content {
  flex: 1;
}

.issue-title {
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 0.25rem;
}

.issue-description {
  color: #4a5568;
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
}

.issue-suggestion {
  color: #718096;
  font-size: 0.75rem;
  font-style: italic;
}

.delete-confirmation {
  text-align: center;
  padding: 1rem;
}

.warning-text {
  color: #e53e3e;
  font-size: 0.875rem;
  margin-top: 0.5rem;
}

.modal-actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 2rem;
}

@media (max-width: 768px) {
  .admin-dashboard {
    padding: 1rem;
  }

  .dashboard-header {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }

  .dashboard-actions {
    justify-content: center;
  }

  .section-header {
    flex-direction: column;
    align-items: stretch;
  }

  .section-actions {
    flex-direction: column;
  }

  .stats-cards {
    grid-template-columns: 1fr;
  }
}
</style>

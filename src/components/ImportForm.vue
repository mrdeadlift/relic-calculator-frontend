<template>
  <div class="import-form">
    <div class="import-instructions">
      <h4>遺物データインポート</h4>
      <p>JSONファイルまたはCSVファイルから遺物データをインポートできます。</p>
      
      <div class="format-info">
        <h5>サポートされる形式:</h5>
        <ul>
          <li><strong>JSON:</strong> 完全な遺物データ構造</li>
          <li><strong>CSV:</strong> 基本的な遺物情報（名前、説明、カテゴリなど）</li>
        </ul>
      </div>
    </div>

    <div class="file-upload-section">
      <div 
        class="file-drop-zone"
        :class="{ 'drag-over': isDragOver, 'has-file': selectedFile }"
        @drop="handleDrop"
        @dragover.prevent="isDragOver = true"
        @dragleave="isDragOver = false"
        @click="$refs.fileInput.click()"
      >
        <div v-if="!selectedFile" class="drop-placeholder">
          <i class="icon-upload"></i>
          <p class="drop-text">
            ファイルをドラッグ&ドロップまたはクリックして選択
          </p>
          <p class="drop-hint">
            .json, .csv ファイルのみサポート（最大10MB）
          </p>
        </div>
        
        <div v-else class="file-info">
          <div class="file-icon">
            <i :class="getFileIcon(selectedFile.type)"></i>
          </div>
          <div class="file-details">
            <div class="file-name">{{ selectedFile.name }}</div>
            <div class="file-size">{{ formatFileSize(selectedFile.size) }}</div>
            <div class="file-type">{{ getFileType(selectedFile.type) }}</div>
          </div>
          <BaseButton
            variant="danger"
            size="small"
            @click.stop="removeFile"
          >
            <i class="icon-trash"></i>
          </BaseButton>
        </div>
      </div>
      
      <input
        ref="fileInput"
        type="file"
        accept=".json,.csv"
        @change="handleFileSelect"
        style="display: none"
      />
    </div>

    <!-- プレビュープレビュー -->
    <div v-if="previewData" class="preview-section">
      <h5>インポートプレビュー</h5>
      <div class="preview-stats">
        <div class="stat-item">
          <span class="stat-label">検出されたアイテム:</span>
          <span class="stat-value">{{ previewData.items.length }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">有効なアイテム:</span>
          <span class="stat-value valid">{{ previewData.valid }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">エラーのあるアイテム:</span>
          <span class="stat-value error">{{ previewData.errors.length }}</span>
        </div>
      </div>

      <!-- エラー詳細 -->
      <div v-if="previewData.errors.length > 0" class="error-details">
        <h6>エラー詳細:</h6>
        <div class="error-list">
          <div v-for="error in previewData.errors.slice(0, 5)" :key="error.line" class="error-item">
            <span class="error-line">行 {{ error.line }}:</span>
            <span class="error-message">{{ error.message }}</span>
          </div>
          <div v-if="previewData.errors.length > 5" class="error-more">
            他 {{ previewData.errors.length - 5 }} 件のエラー
          </div>
        </div>
      </div>

      <!-- サンプルデータ -->
      <div class="sample-data">
        <h6>サンプルデータ (最初の3件):</h6>
        <div class="sample-table">
          <table>
            <thead>
              <tr>
                <th>名前</th>
                <th>カテゴリ</th>
                <th>レアリティ</th>
                <th>効果数</th>
                <th>状態</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in previewData.items.slice(0, 3)" :key="item.name" class="sample-row">
                <td>{{ item.name || '未設定' }}</td>
                <td>{{ item.category || '未設定' }}</td>
                <td>{{ item.rarity || '未設定' }}</td>
                <td>{{ item.effects?.length || 0 }}</td>
                <td>
                  <span :class="['status-badge', item.valid ? 'valid' : 'invalid']">
                    {{ item.valid ? '有効' : '無効' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- インポートオプション -->
    <div class="import-options">
      <h5>インポートオプション</h5>
      
      <div class="option-group">
        <label class="option-label">
          <input 
            type="checkbox" 
            v-model="importOptions.skipErrors"
            class="option-checkbox"
          />
          エラーのあるアイテムをスキップ
        </label>
        <div class="option-help">
          エラーのあるアイテムを無視して、有効なアイテムのみインポートします
        </div>
      </div>

      <div class="option-group">
        <label class="option-label">
          <input 
            type="checkbox" 
            v-model="importOptions.updateExisting"
            class="option-checkbox"
          />
          既存アイテムを更新
        </label>
        <div class="option-help">
          同じIDの遺物が存在する場合、上書き更新します
        </div>
      </div>

      <div class="option-group">
        <label class="option-label">
          <input 
            type="checkbox" 
            v-model="importOptions.validateOnly"
            class="option-checkbox"
          />
          バリデーションのみ実行
        </label>
        <div class="option-help">
          実際にインポートせず、データの検証のみ行います
        </div>
      </div>
    </div>

    <!-- 進捗表示 -->
    <div v-if="uploadProgress > 0 && uploadProgress < 100" class="upload-progress">
      <div class="progress-label">アップロード中...</div>
      <div class="progress-bar">
        <div 
          class="progress-fill" 
          :style="{ width: `${uploadProgress}%` }"
        ></div>
      </div>
      <div class="progress-text">{{ uploadProgress }}%</div>
    </div>

    <!-- アクションボタン -->
    <div class="form-actions">
      <BaseButton
        variant="secondary"
        @click="$emit('cancel')"
        :disabled="loading"
      >
        キャンセル
      </BaseButton>
      
      <BaseButton
        variant="warning"
        @click="previewImport"
        :disabled="!selectedFile || loading"
        :loading="previewing"
      >
        プレビュー
      </BaseButton>
      
      <BaseButton
        variant="primary"
        @click="executeImport"
        :disabled="!selectedFile || !previewData || loading"
        :loading="loading"
      >
        {{ importOptions.validateOnly ? 'バリデーション実行' : 'インポート実行' }}
      </BaseButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import BaseButton from './BaseButton.vue'
import { adminService } from '../services/admin'
import { useToast } from '../composables/useToast'

// Props & Emits
interface Props {
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

const emit = defineEmits<{
  'submit': [file: File]
  'cancel': []
}>()

// Composables
const { showToast } = useToast()

// リアクティブデータ
const selectedFile = ref<File | null>(null)
const isDragOver = ref(false)
const previewData = ref<any>(null)
const uploadProgress = ref(0)
const previewing = ref(false)

const importOptions = reactive({
  skipErrors: true,
  updateExisting: false,
  validateOnly: false
})

// メソッド
const handleDrop = (event: DragEvent) => {
  event.preventDefault()
  isDragOver.value = false
  
  const files = event.dataTransfer?.files
  if (files && files.length > 0) {
    selectFile(files[0])
  }
}

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    selectFile(target.files[0])
  }
}

const selectFile = (file: File) => {
  // ファイル形式チェック
  const allowedTypes = ['application/json', 'text/csv', 'application/vnd.ms-excel']
  if (!allowedTypes.includes(file.type) && !file.name.endsWith('.json') && !file.name.endsWith('.csv')) {
    showToast('サポートされていないファイル形式です', 'error')
    return
  }
  
  // ファイルサイズチェック (10MB)
  if (file.size > 10 * 1024 * 1024) {
    showToast('ファイルサイズが大きすぎます（最大10MB）', 'error')
    return
  }
  
  selectedFile.value = file
  previewData.value = null // プレビューをリセット
}

const removeFile = () => {
  selectedFile.value = null
  previewData.value = null
  uploadProgress.value = 0
}

const previewImport = async () => {
  if (!selectedFile.value) return
  
  previewing.value = true
  try {
    // ファイルを読み込んでプレビューデータを生成
    const content = await readFileContent(selectedFile.value)
    const parsedData = parseFileContent(content, selectedFile.value.type)
    
    previewData.value = {
      items: parsedData.items,
      valid: parsedData.items.filter(item => item.valid).length,
      errors: parsedData.errors
    }
    
    showToast('プレビューを生成しました', 'success')
  } catch (error) {
    console.error('Preview failed:', error)
    showToast('プレビューの生成に失敗しました', 'error')
  } finally {
    previewing.value = false
  }
}

const executeImport = async () => {
  if (!selectedFile.value) return
  
  try {
    emit('submit', selectedFile.value)
  } catch (error) {
    console.error('Import failed:', error)
    showToast('インポートに失敗しました', 'error')
  }
}

const readFileContent = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target?.result as string)
    reader.onerror = () => reject(new Error('ファイルの読み込みに失敗しました'))
    reader.readAsText(file)
  })
}

const parseFileContent = (content: string, fileType: string) => {
  const items: any[] = []
  const errors: any[] = []
  
  try {
    if (fileType === 'application/json' || content.trim().startsWith('{') || content.trim().startsWith('[')) {
      // JSON形式
      const data = JSON.parse(content)
      const relicsArray = Array.isArray(data) ? data : [data]
      
      relicsArray.forEach((item, index) => {
        const validationResult = validateRelicItem(item)
        items.push({
          ...item,
          valid: validationResult.valid
        })
        
        if (!validationResult.valid) {
          errors.push({
            line: index + 1,
            message: validationResult.errors.join(', ')
          })
        }
      })
    } else {
      // CSV形式
      const lines = content.split('\n')
      const headers = lines[0].split(',').map(h => h.trim())
      
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue
        
        const values = lines[i].split(',').map(v => v.trim())
        const item: any = {}
        
        headers.forEach((header, index) => {
          item[header] = values[index] || ''
        })
        
        const validationResult = validateRelicItem(item)
        items.push({
          ...item,
          valid: validationResult.valid
        })
        
        if (!validationResult.valid) {
          errors.push({
            line: i + 1,
            message: validationResult.errors.join(', ')
          })
        }
      }
    }
  } catch (error) {
    errors.push({
      line: 1,
      message: 'ファイル形式が正しくありません'
    })
  }
  
  return { items, errors }
}

const validateRelicItem = (item: any) => {
  const errors: string[] = []
  
  if (!item.name) errors.push('名前が必要です')
  if (!item.category) errors.push('カテゴリが必要です')
  if (!item.rarity) errors.push('レアリティが必要です')
  if (!item.description) errors.push('説明が必要です')
  
  return {
    valid: errors.length === 0,
    errors
  }
}

const getFileIcon = (fileType: string): string => {
  if (fileType === 'application/json') return 'icon-file-json'
  if (fileType === 'text/csv' || fileType === 'application/vnd.ms-excel') return 'icon-file-csv'
  return 'icon-file'
}

const getFileType = (fileType: string): string => {
  if (fileType === 'application/json') return 'JSON'
  if (fileType === 'text/csv' || fileType === 'application/vnd.ms-excel') return 'CSV'
  return 'Unknown'
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
</script>

<style scoped>
.import-form {
  padding: 1rem;
}

.import-instructions {
  margin-bottom: 2rem;
  padding: 1rem;
  background: #f7fafc;
  border-radius: 8px;
  border-left: 4px solid #4299e1;
}

.import-instructions h4 {
  color: #2d3748;
  margin-bottom: 0.5rem;
}

.import-instructions p {
  color: #4a5568;
  margin-bottom: 1rem;
}

.format-info h5 {
  color: #2d3748;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
}

.format-info ul {
  margin: 0;
  padding-left: 1.5rem;
}

.format-info li {
  color: #4a5568;
  font-size: 0.875rem;
  margin-bottom: 0.25rem;
}

.file-upload-section {
  margin-bottom: 2rem;
}

.file-drop-zone {
  border: 2px dashed #e2e8f0;
  border-radius: 12px;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #f7fafc;
}

.file-drop-zone:hover {
  border-color: #4299e1;
  background: #ebf8ff;
}

.file-drop-zone.drag-over {
  border-color: #4299e1;
  background: #ebf8ff;
  transform: scale(1.02);
}

.file-drop-zone.has-file {
  border-color: #48bb78;
  background: #f0fff4;
}

.drop-placeholder i {
  font-size: 3rem;
  color: #a0aec0;
  margin-bottom: 1rem;
}

.drop-text {
  font-size: 1.125rem;
  color: #4a5568;
  margin-bottom: 0.5rem;
}

.drop-hint {
  font-size: 0.875rem;
  color: #718096;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  text-align: left;
}

.file-icon {
  width: 48px;
  height: 48px;
  background: #4299e1;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.5rem;
}

.file-details {
  flex: 1;
}

.file-name {
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 0.25rem;
}

.file-size {
  font-size: 0.875rem;
  color: #718096;
}

.file-type {
  font-size: 0.75rem;
  color: #4299e1;
  font-weight: 500;
}

.preview-section {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.preview-section h5 {
  color: #2d3748;
  margin-bottom: 1rem;
}

.preview-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: #f7fafc;
  border-radius: 6px;
}

.stat-label {
  font-size: 0.875rem;
  color: #4a5568;
}

.stat-value {
  font-weight: 600;
  font-size: 1.125rem;
}

.stat-value.valid {
  color: #48bb78;
}

.stat-value.error {
  color: #e53e3e;
}

.error-details {
  margin-bottom: 1.5rem;
}

.error-details h6 {
  color: #e53e3e;
  margin-bottom: 0.75rem;
  font-size: 0.875rem;
}

.error-list {
  background: #fed7d7;
  border-radius: 6px;
  padding: 1rem;
}

.error-item {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
}

.error-line {
  font-weight: 600;
  color: #c53030;
  flex-shrink: 0;
}

.error-message {
  color: #742a2a;
}

.error-more {
  font-style: italic;
  color: #a0aec0;
  font-size: 0.75rem;
  margin-top: 0.5rem;
}

.sample-data h6 {
  color: #2d3748;
  margin-bottom: 0.75rem;
  font-size: 0.875rem;
}

.sample-table {
  overflow-x: auto;
}

.sample-table table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.sample-table th {
  background: #f7fafc;
  padding: 0.75rem;
  text-align: left;
  font-weight: 600;
  color: #4a5568;
  border-bottom: 1px solid #e2e8f0;
}

.sample-table td {
  padding: 0.75rem;
  border-bottom: 1px solid #e2e8f0;
}

.status-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
}

.status-badge.valid {
  background: #c6f6d5;
  color: #2f855a;
}

.status-badge.invalid {
  background: #fed7d7;
  color: #c53030;
}

.import-options {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.import-options h5 {
  color: #2d3748;
  margin-bottom: 1rem;
}

.option-group {
  margin-bottom: 1rem;
}

.option-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  color: #2d3748;
  cursor: pointer;
}

.option-checkbox {
  width: 16px;
  height: 16px;
}

.option-help {
  font-size: 0.75rem;
  color: #718096;
  margin-top: 0.25rem;
  margin-left: 1.5rem;
}

.upload-progress {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1.5rem;
}

.progress-label {
  font-weight: 500;
  color: #2d3748;
  margin-bottom: 0.5rem;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress-fill {
  height: 100%;
  background: #4299e1;
  transition: width 0.3s ease;
}

.progress-text {
  text-align: center;
  font-size: 0.875rem;
  color: #4a5568;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e2e8f0;
}

@media (max-width: 768px) {
  .preview-stats {
    grid-template-columns: 1fr;
  }
  
  .stat-item {
    flex-direction: column;
    text-align: center;
    gap: 0.5rem;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .file-info {
    flex-direction: column;
    text-align: center;
  }
}
</style>
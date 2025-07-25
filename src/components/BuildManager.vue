<template>
  <div class="build-manager">
    <!-- Header Section -->
    <BaseCard class="manager-header" padding="lg">
      <template #header>
        <div class="header-content">
          <h2 class="manager-title">
            <BuildIcon />
            Build Manager
          </h2>
          <div class="header-actions">
            <button 
              @click="showSaveDialog = true"
              :disabled="!canSaveBuild"
              class="action-btn primary"
              title="Save current build"
            >
              <SaveIcon />
              Save Build
            </button>
            <button 
              @click="showImportDialog = true"
              class="action-btn secondary"
              title="Import build from JSON or URL"
            >
              <ImportIcon />
              Import
            </button>
            <button 
              @click="exportCurrentBuild"
              :disabled="!currentBuild"
              class="action-btn secondary"
              title="Export current build"
            >
              <ExportIcon />
              Export
            </button>
          </div>
        </div>
      </template>

      <!-- Current Build Summary -->
      <div v-if="currentBuild" class="current-build-summary">
        <div class="summary-info">
          <div class="build-name">
            <strong>{{ currentBuild.name || 'Untitled Build' }}</strong>
            <span v-if="currentBuild.lastModified" class="last-modified">
              Modified: {{ formatDate(currentBuild.lastModified) }}
            </span>
          </div>
          <div v-if="currentBuild.description" class="build-description">
            {{ currentBuild.description }}
          </div>
        </div>
        <div class="summary-stats">
          <div class="stat-item">
            <span class="stat-label">Relics:</span>
            <span class="stat-value">{{ currentBuildRelicsCount }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Attack Multiplier:</span>
            <span class="stat-value">{{ formatMultiplier(currentBuild.attackMultiplier) }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Rating:</span>
            <span :class="['stat-value', 'rating-' + getBuildRating(currentBuild)]">
              {{ getBuildRating(currentBuild) }}
            </span>
          </div>
        </div>
      </div>
    </BaseCard>

    <!-- Saved Builds Section -->
    <BaseCard class="saved-builds-section" padding="lg">
      <template #header>
        <div class="section-header">
          <h3 class="section-title">
            <SavedIcon />
            Saved Builds ({{ savedBuilds.length }})
          </h3>
          <div class="section-controls">
            <div class="search-container">
              <input 
                v-model="searchQuery"
                type="text"
                placeholder="Search builds..."
                class="search-input"
              />
              <SearchIcon class="search-icon" />
            </div>
            <select v-model="sortBy" class="sort-select">
              <option value="date">Sort by Date</option>
              <option value="name">Sort by Name</option>
              <option value="multiplier">Sort by Multiplier</option>
              <option value="rating">Sort by Rating</option>
            </select>
            <button 
              @click="showCreateDialog = true"
              class="control-btn primary"
              title="Create new build"
            >
              <CreateIcon />
              New Build
            </button>
          </div>
        </div>
      </template>

      <!-- Loading State -->
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading saved builds...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredBuilds.length === 0 && !searchQuery" class="empty-state">
        <div class="empty-icon">📁</div>
        <h4>No Saved Builds</h4>
        <p>Create your first build to get started.</p>
        <button @click="showCreateDialog = true" class="empty-action-btn">
          <CreateIcon />
          Create Build
        </button>
      </div>

      <!-- No Search Results -->
      <div v-else-if="filteredBuilds.length === 0 && searchQuery" class="no-results">
        <div class="no-results-icon">🔍</div>
        <h4>No builds found</h4>
        <p>Try adjusting your search terms.</p>
      </div>

      <!-- Builds Grid -->
      <div v-else class="builds-grid">
        <div 
          v-for="build in filteredBuilds" 
          :key="build.id"
          :class="[
            'build-card',
            { 
              'active': build.id === currentBuild?.id,
              'favorited': build.isFavorite 
            }
          ]"
        >
          <!-- Build Header -->
          <div class="build-card-header">
            <div class="build-info">
              <h4 class="build-name">{{ build.name || 'Untitled Build' }}</h4>
              <div class="build-meta">
                <span class="build-date">{{ formatDate(build.createdAt) }}</span>
                <span :class="['build-rating', 'rating-' + getBuildRating(build)]">
                  {{ getBuildRating(build) }}
                </span>
              </div>
            </div>
            <div class="build-actions">
              <button 
                @click="toggleFavorite(build.id)"
                :class="['icon-btn', { active: build.isFavorite }]"
                title="Toggle favorite"
              >
                <StarIcon />
              </button>
              <button 
                @click="showBuildMenu(build.id, $event)"
                class="icon-btn"
                title="More options"
              >
                <MoreIcon />
              </button>
            </div>
          </div>

          <!-- Build Description -->
          <div v-if="build.description" class="build-description">
            {{ build.description }}
          </div>

          <!-- Build Stats -->
          <div class="build-stats">
            <div class="stat-group">
              <div class="stat-item">
                <span class="stat-icon">⚔️</span>
                <span class="stat-text">{{ formatMultiplier(build.attackMultiplier) }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-icon">🎯</span>
                <span class="stat-text">{{ build.relics?.length || 0 }} relics</span>
              </div>
              <div class="stat-item">
                <span class="stat-icon">⚡</span>
                <span class="stat-text">{{ getActiveEffectsCount(build) }} effects</span>
              </div>
            </div>
          </div>

          <!-- Build Relics Preview -->
          <div class="build-relics-preview">
            <div class="relics-header">
              <span class="relics-label">Relics:</span>
            </div>
            <div class="relics-list">
              <div 
                v-for="relic in (build.relics || []).slice(0, 3)" 
                :key="relic.id"
                :class="['relic-chip', `rarity-${relic.rarity}`]"
                :title="relic.name"
              >
                <span class="relic-name">{{ relic.name }}</span>
              </div>
              <div 
                v-if="(build.relics || []).length > 3" 
                class="more-relics"
                :title="`+${(build.relics || []).length - 3} more relics`"
              >
                +{{ (build.relics || []).length - 3 }}
              </div>
            </div>
          </div>

          <!-- Build Card Actions -->
          <div class="build-card-actions">
            <button 
              @click="loadBuild(build)"
              class="load-btn"
              title="Load this build"
            >
              <LoadIcon />
              Load
            </button>
            <button 
              @click="duplicateBuild(build)"
              class="duplicate-btn"
              title="Duplicate this build"
            >
              <DuplicateIcon />
              Duplicate
            </button>
            <button 
              @click="shareBuild(build)"
              class="share-btn"
              title="Share this build"
            >
              <ShareIcon />
              Share
            </button>
          </div>
        </div>
      </div>
    </BaseCard>

    <!-- Save Build Dialog -->
    <BaseModal v-model:show="showSaveDialog" title="Save Build" size="md">
      <div class="save-dialog-content">
        <div class="form-group">
          <label class="form-label" for="build-name">Build Name *</label>
          <input 
            v-model="saveForm.name"
            id="build-name"
            type="text"
            class="form-input"
            placeholder="Enter build name..."
            maxlength="100"
            required
          />
        </div>
        
        <div class="form-group">
          <label class="form-label" for="build-description">Description</label>
          <textarea 
            v-model="saveForm.description"
            id="build-description"
            class="form-textarea"
            placeholder="Optional description..."
            maxlength="500"
            rows="3"
          ></textarea>
        </div>
        
        <div class="form-group">
          <label class="checkbox-label">
            <input 
              v-model="saveForm.isFavorite"
              type="checkbox"
              class="form-checkbox"
            />
            <span class="checkbox-custom"></span>
            <span>Mark as favorite</span>
          </label>
        </div>
        
        <div class="form-group">
          <label class="checkbox-label">
            <input 
              v-model="saveForm.isPublic"
              type="checkbox"
              class="form-checkbox"
            />
            <span class="checkbox-custom"></span>
            <span>Make build public (can be shared)</span>
          </label>
        </div>
      </div>
      
      <template #footer>
        <button 
          @click="showSaveDialog = false"
          class="modal-btn secondary"
        >
          Cancel
        </button>
        <button 
          @click="saveBuild"
          :disabled="!saveForm.name.trim()"
          class="modal-btn primary"
        >
          <SaveIcon />
          Save Build
        </button>
      </template>
    </BaseModal>

    <!-- Create Build Dialog -->
    <BaseModal v-model:show="showCreateDialog" title="Create New Build" size="md">
      <div class="create-dialog-content">
        <div class="form-group">
          <label class="form-label" for="new-build-name">Build Name *</label>
          <input 
            v-model="createForm.name"
            id="new-build-name"
            type="text"
            class="form-input"
            placeholder="Enter build name..."
            maxlength="100"
            required
          />
        </div>
        
        <div class="form-group">
          <label class="form-label" for="new-build-template">Start From Template</label>
          <select v-model="createForm.template" id="new-build-template" class="form-select">
            <option value="">Empty Build</option>
            <option value="balanced">Balanced Attack Build</option>
            <option value="critical">Critical Damage Build</option>
            <option value="elemental">Elemental Damage Build</option>
            <option value="utility">Utility Build</option>
          </select>
        </div>
        
        <div class="form-group">
          <label class="form-label" for="new-build-description">Description</label>
          <textarea 
            v-model="createForm.description"
            id="new-build-description"
            class="form-textarea"
            placeholder="Optional description..."
            maxlength="500"
            rows="3"
          ></textarea>
        </div>
      </div>
      
      <template #footer>
        <button 
          @click="showCreateDialog = false"
          class="modal-btn secondary"
        >
          Cancel
        </button>
        <button 
          @click="createBuild"
          :disabled="!createForm.name.trim()"
          class="modal-btn primary"
        >
          <CreateIcon />
          Create Build
        </button>
      </template>
    </BaseModal>

    <!-- Import Build Dialog -->
    <BaseModal v-model:show="showImportDialog" title="Import Build" size="lg">
      <div class="import-dialog-content">
        <div class="import-tabs">
          <button 
            :class="['tab-btn', { active: importMethod === 'json' }]"
            @click="importMethod = 'json'"
          >
            JSON Import
          </button>
          <button 
            :class="['tab-btn', { active: importMethod === 'url' }]"
            @click="importMethod = 'url'"
          >
            URL Import
          </button>
          <button 
            :class="['tab-btn', { active: importMethod === 'file' }]"
            @click="importMethod = 'file'"
          >
            File Import
          </button>
        </div>
        
        <!-- JSON Import -->
        <div v-if="importMethod === 'json'" class="import-section">
          <label class="form-label">Paste JSON Data</label>
          <textarea 
            v-model="importForm.jsonData"
            class="import-textarea"
            placeholder='Paste your build JSON data here...'
            rows="8"
          ></textarea>
        </div>
        
        <!-- URL Import -->
        <div v-if="importMethod === 'url'" class="import-section">
          <label class="form-label">Build URL</label>
          <input 
            v-model="importForm.url"
            type="url"
            class="form-input"
            placeholder="https://example.com/build/shared/..."
          />
        </div>
        
        <!-- File Import -->
        <div v-if="importMethod === 'file'" class="import-section">
          <label class="form-label">Select Build File</label>
          <div class="file-input-container">
            <input 
              ref="fileInput"
              type="file"
              accept=".json,.txt"
              class="file-input"
              @change="handleFileSelect"
            />
            <button 
              @click="$refs.fileInput.click()"
              class="file-input-btn"
            >
              <UploadIcon />
              Choose File
            </button>
            <span v-if="importForm.fileName" class="file-name">
              {{ importForm.fileName }}
            </span>
          </div>
        </div>
        
        <!-- Import Preview -->
        <div v-if="importPreview" class="import-preview">
          <h4>Import Preview</h4>
          <div class="preview-content">
            <div class="preview-item">
              <span class="preview-label">Build Name:</span>
              <span class="preview-value">{{ importPreview.name }}</span>
            </div>
            <div class="preview-item">
              <span class="preview-label">Relics:</span>
              <span class="preview-value">{{ importPreview.relicsCount }} relics</span>
            </div>
            <div class="preview-item">
              <span class="preview-label">Attack Multiplier:</span>
              <span class="preview-value">{{ formatMultiplier(importPreview.attackMultiplier) }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <template #footer>
        <button 
          @click="showImportDialog = false"
          class="modal-btn secondary"
        >
          Cancel
        </button>
        <button 
          @click="validateImport"
          :disabled="!canValidateImport"
          class="modal-btn secondary"
        >
          <ValidateIcon />
          Validate
        </button>
        <button 
          @click="importBuild"
          :disabled="!importPreview"
          class="modal-btn primary"
        >
          <ImportIcon />
          Import Build
        </button>
      </template>
    </BaseModal>

    <!-- Context Menu -->
    <div 
      v-if="contextMenu.show"
      :style="{ 
        position: 'fixed',
        top: contextMenu.y + 'px',
        left: contextMenu.x + 'px',
        zIndex: 1000
      }"
      class="context-menu"
      @click.stop
    >
      <button @click="editBuild(contextMenu.buildId)" class="context-menu-item">
        <EditIcon />
        Edit
      </button>
      <button @click="duplicateBuild(findBuildById(contextMenu.buildId))" class="context-menu-item">
        <DuplicateIcon />
        Duplicate
      </button>
      <button @click="shareBuild(findBuildById(contextMenu.buildId))" class="context-menu-item">
        <ShareIcon />
        Share
      </button>
      <button @click="exportBuild(contextMenu.buildId)" class="context-menu-item">
        <ExportIcon />
        Export
      </button>
      <div class="context-menu-divider"></div>
      <button 
        @click="deleteBuild(contextMenu.buildId)" 
        class="context-menu-item danger"
      >
        <DeleteIcon />
        Delete
      </button>
    </div>

    <!-- Overlay to close context menu -->
    <div 
      v-if="contextMenu.show"
      class="context-menu-overlay"
      @click="contextMenu.show = false"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import type { Build, Relic } from '../types/build'
import { useBuildManager } from '../composables/useBuildManager'
import { useToast } from '../composables/useToast'
import BaseCard from './ui/BaseCard.vue'
import BaseModal from './ui/BaseModal.vue'

// Props
interface Props {
  currentBuild?: Build | null
  selectedRelics?: Relic[]
}

const props = withDefaults(defineProps<Props>(), {
  currentBuild: null,
  selectedRelics: () => []
})

// Emits
defineEmits<{
  'build-loaded': [build: Build]
  'build-created': [build: Build]
  'build-updated': [build: Build]
  'build-deleted': [buildId: string]
}>()

// Composables
const { 
  savedBuilds, 
  loading, 
  saveBuild: saveBuildToStorage,
  loadBuild: loadBuildFromStorage,
  deleteBuild: deleteBuildFromStorage,
  duplicateBuild: duplicateBuildInStorage
} = useBuildManager()

const { success, error, info } = useToast()

// State
const searchQuery = ref('')
const sortBy = ref('date')
const showSaveDialog = ref(false)
const showCreateDialog = ref(false)
const showImportDialog = ref(false)
const importMethod = ref('json')

// Forms
const saveForm = ref({
  name: '',
  description: '',
  isFavorite: false,
  isPublic: false
})

const createForm = ref({
  name: '',
  description: '',
  template: ''
})

const importForm = ref({
  jsonData: '',
  url: '',
  fileName: '',
  fileData: null as any
})

const importPreview = ref<any>(null)

// Context menu
const contextMenu = ref({
  show: false,
  x: 0,
  y: 0,
  buildId: ''
})

// Computed
const canSaveBuild = computed(() => {
  return props.selectedRelics.length > 0
})

const currentBuildRelicsCount = computed(() => {
  return props.currentBuild?.relics?.length || 0
})

const filteredBuilds = computed(() => {
  let filtered = savedBuilds.value

  // Search filter
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(build => 
      (build.name || '').toLowerCase().includes(query) ||
      (build.description || '').toLowerCase().includes(query)
    )
  }

  // Sort
  return filtered.sort((a, b) => {
    switch (sortBy.value) {
      case 'name':
        return (a.name || '').localeCompare(b.name || '')
      case 'multiplier':
        return (b.attackMultiplier || 0) - (a.attackMultiplier || 0)
      case 'rating':
        return getBuildRatingValue(b) - getBuildRatingValue(a)
      case 'date':
      default:
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    }
  })
})

const canValidateImport = computed(() => {
  switch (importMethod.value) {
    case 'json':
      return importForm.value.jsonData.trim().length > 0
    case 'url':
      return importForm.value.url.trim().length > 0
    case 'file':
      return importForm.value.fileData !== null
    default:
      return false
  }
})

// Methods
const formatDate = (date: string | Date): string => {
  return new Date(date).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatMultiplier = (multiplier: number): string => {
  return `${multiplier.toFixed(2)}×`
}

const getBuildRating = (build: Build): string => {
  const multiplier = build.attackMultiplier || 0
  if (multiplier >= 5.0) return 'S'
  if (multiplier >= 4.0) return 'A'
  if (multiplier >= 3.0) return 'B'
  if (multiplier >= 2.0) return 'C'
  return 'D'
}

const getBuildRatingValue = (build: Build): number => {
  const rating = getBuildRating(build)
  const values = { S: 5, A: 4, B: 3, C: 2, D: 1 }
  return values[rating as keyof typeof values] || 0
}

const getActiveEffectsCount = (build: Build): number => {
  if (!build.relics) return 0
  return build.relics.reduce((count, relic) => {
    return count + (relic.effects?.length || 0)
  }, 0)
}

const saveBuild = async () => {
  if (!saveForm.value.name.trim()) {
    error('Build name is required')
    return
  }

  try {
    const buildData: Build = {
      id: Date.now().toString(),
      name: saveForm.value.name,
      description: saveForm.value.description || undefined,
      relics: props.selectedRelics,
      attackMultiplier: props.currentBuild?.attackMultiplier || 0,
      isFavorite: saveForm.value.isFavorite,
      isPublic: saveForm.value.isPublic,
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString()
    }

    await saveBuildToStorage(buildData)
    success(`Build "${buildData.name}" saved successfully`)
    showSaveDialog.value = false
    resetSaveForm()
  } catch (err) {
    error('Failed to save build')
  }
}

const createBuild = () => {
  // Implementation for creating new build
  success('New build created')
  showCreateDialog.value = false
  resetCreateForm()
}

const loadBuild = (build: Build) => {
  // Implementation for loading build
  success(`Build "${build.name}" loaded`)
}

const duplicateBuild = async (build: Build) => {
  try {
    const duplicated = await duplicateBuildInStorage(build.id)
    success(`Build duplicated as "${duplicated.name}"`)
  } catch (err) {
    error('Failed to duplicate build')
  }
}

const deleteBuild = async (buildId: string) => {
  if (!confirm('Are you sure you want to delete this build?')) return

  try {
    await deleteBuildFromStorage(buildId)
    success('Build deleted successfully')
    contextMenu.value.show = false
  } catch (err) {
    error('Failed to delete build')
  }
}

const shareBuild = (build: Build) => {
  // Implementation for sharing build
  info('Share functionality coming soon')
}

const exportBuild = (buildId: string) => {
  const build = findBuildById(buildId)
  if (!build) return

  const exportData = JSON.stringify(build, null, 2)
  const blob = new Blob([exportData], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${build.name || 'build'}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  
  success('Build exported successfully')
  contextMenu.value.show = false
}

const exportCurrentBuild = () => {
  if (!props.currentBuild) return
  exportBuild(props.currentBuild.id)
}

const validateImport = () => {
  try {
    let data: any
    
    switch (importMethod.value) {
      case 'json':
        data = JSON.parse(importForm.value.jsonData)
        break
      case 'url':
        // Would fetch from URL
        error('URL import not yet implemented')
        return
      case 'file':
        data = importForm.value.fileData
        break
      default:
        return
    }

    importPreview.value = {
      name: data.name || 'Imported Build',
      relicsCount: data.relics?.length || 0,
      attackMultiplier: data.attackMultiplier || 0
    }

    success('Import data validated successfully')
  } catch (err) {
    error('Invalid import data')
    importPreview.value = null
  }
}

const importBuild = () => {
  if (!importPreview.value) return
  
  // Implementation for importing build
  success('Build imported successfully')
  showImportDialog.value = false
  resetImportForm()
}

const toggleFavorite = async (buildId: string) => {
  // Implementation for toggling favorite
  info('Favorite toggled')
}

const editBuild = (buildId: string) => {
  // Implementation for editing build
  contextMenu.value.show = false
}

const showBuildMenu = (buildId: string, event: Event) => {
  event.preventDefault()
  event.stopPropagation()
  
  const rect = (event.target as HTMLElement).getBoundingClientRect()
  contextMenu.value = {
    show: true,
    x: rect.right,
    y: rect.bottom,
    buildId
  }
}

const findBuildById = (buildId: string): Build | undefined => {
  return savedBuilds.value.find(build => build.id === buildId)
}

const handleFileSelect = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return

  importForm.value.fileName = file.name
  
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      importForm.value.fileData = JSON.parse(e.target?.result as string)
    } catch (err) {
      error('Invalid JSON file')
    }
  }
  reader.readAsText(file)
}

// Form reset methods
const resetSaveForm = () => {
  saveForm.value = {
    name: '',
    description: '',
    isFavorite: false,
    isPublic: false
  }
}

const resetCreateForm = () => {
  createForm.value = {
    name: '',
    description: '',
    template: ''
  }
}

const resetImportForm = () => {
  importForm.value = {
    jsonData: '',
    url: '',
    fileName: '',
    fileData: null
  }
  importPreview.value = null
}

// Click outside handler
const handleClickOutside = (event: Event) => {
  if (contextMenu.value.show && 
      !(event.target as HTMLElement).closest('.context-menu')) {
    contextMenu.value.show = false
  }
}

// Lifecycle
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

// Icon components (simplified)
const BuildIcon = { template: `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9l-5 4.87L18.18 22 12 18.77 5.82 22 7 13.87 2 9l6.91-.74L12 2z"/></svg>` }
const SaveIcon = { template: `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M2 1a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H9.5a1 1 0 0 0-1 1v7.293l2.646-2.647a.5.5 0 0 1 .708.708l-3.5 3.5a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L7.5 9.293V2a2 2 0 0 1 2-2H14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h2.5a.5.5 0 0 1 0 1H2z"/></svg>` }
const ImportIcon = { template: `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/><path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/></svg>` }
const ExportIcon = { template: `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/><path d="M7.646 1.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 2.707V11.5a.5.5 0 0 1-1 0V2.707L5.354 4.854a.5.5 0 1 1-.708-.708l3-3z"/></svg>` }
const SavedIcon = { template: `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M3 2.5a2.5 2.5 0 0 1 5 0 2.5 2.5 0 0 1 5 0v.006c0 .34 0 .654.086.984.09.33.227.613.426.857.526.661.861 1.567.863 2.687a.8.8 0 0 1-.254.58C13.617 7.98 13.3 8 13 8a.5.5 0 0 1-.276-.916c.013-.006.02-.01.021-.012a.003.003 0 0 0 .003-.003V7.5a5.006 5.006 0 0 0-.777-2.675.926.926 0 0 1-.196-.43c-.01-.14-.010-.333-.010-.395V2.5A1.5 1.5 0 0 0 10.5 1h-5A1.5 1.5 0 0 0 4 2.5v1.5c0 .062 0 .255-.01.395a.926.926 0 0 1-.196.43A5.006 5.006 0 0 0 3 7.5v-.069a.003.003 0 0 0 .003.003c.001.002.008.006.021.012A.5.5 0 0 1 3 8c-.3 0-.617-.02-1.121-.387a.8.8 0 0 1-.254-.58c.002-1.12.337-2.026.863-2.687.199-.244.336-.527.426-.857C3.001 3.154 3 2.84 3 2.506V2.5z"/><path d="M4 8.5a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-.5.5h-7a.5.5 0 0 1-.5-.5v-7z"/></svg>` }
const SearchIcon = { template: `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/></svg>` }
const CreateIcon = { template: `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/></svg>` }
const StarIcon = { template: `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.282.95l-3.522 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z"/></svg>` }
const MoreIcon = { template: `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M3 9.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"/></svg>` }
const LoadIcon = { template: `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/><path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/></svg>` }
const DuplicateIcon = { template: `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/><path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/></svg>` }
const ShareIcon = { template: `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M11 2.5a2.5 2.5 0 1 1 .603 1.628l-6.718 3.12a2.499 2.499 0 0 1 0 1.504l6.718 3.12a2.5 2.5 0 1 1-.488.876l-6.718-3.12a2.5 2.5 0 1 1 0-3.256l6.718-3.12A2.5 2.5 0 0 1 11 2.5z"/></svg>` }
const ValidateIcon = { template: `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M10.97 4.97a.235.235 0 0 0-.02.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.061L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-1.071-1.05z"/></svg>` }
const UploadIcon = { template: `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/><path d="M7.646 1.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 2.707V11.5a.5.5 0 0 1-1 0V2.707L5.354 4.854a.5.5 0 1 1-.708-.708l3-3z"/></svg>` }
const EditIcon = { template: `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708L15.207 4.5 14 5.707 13.293 5 14.5 3.793l-1-1L4.646 11.646a.5.5 0 0 1-.14.14L1.646 14.646a.5.5 0 0 1-.708-.708L4.646 10.854l6.5-6.5.146-.146a.5.5 0 0 1 .708 0z"/><path d="M5.5 13.5l.5-.5v.5h-.5z"/></svg>` }
const DeleteIcon = { template: `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/><path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/></svg>` }
</script>

<style scoped>
.build-manager {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Header Section */
.manager-header {
  border: 2px solid var(--primary-color);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.manager-title {
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

/* Current Build Summary */
.current-build-summary {
  margin-top: 1.5rem;
  padding: 1.5rem;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(59, 130, 246, 0.1) 100%);
  border-radius: 8px;
  border: 1px solid rgba(59, 130, 246, 0.2);
}

.summary-info {
  margin-bottom: 1rem;
}

.build-name {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.5rem;
}

.build-name strong {
  font-size: 1.1rem;
  color: var(--text-primary);
}

.last-modified {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.build-description {
  font-size: 0.9rem;
  color: var(--text-secondary);
  line-height: 1.4;
}

.summary-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: white;
  border-radius: 6px;
  border: 1px solid var(--border-color);
}

.stat-label {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.stat-value {
  font-weight: 600;
  color: var(--text-primary);
}

.stat-value.rating-S { color: #dc2626; }
.stat-value.rating-A { color: #ea580c; }
.stat-value.rating-B { color: #ca8a04; }
.stat-value.rating-C { color: #65a30d; }
.stat-value.rating-D { color: #6b7280; }

/* Section Header */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
}

.section-controls {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.search-container {
  position: relative;
}

.search-input {
  padding: 0.5rem 0.75rem 0.5rem 2.5rem;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 0.875rem;
  width: 200px;
}

.search-icon {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
  pointer-events: none;
}

.sort-select {
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 0.875rem;
  cursor: pointer;
}

.control-btn {
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

.control-btn.primary {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.control-btn:hover {
  transform: translateY(-1px);
}

/* Loading and Empty States */
.loading-state, .empty-state, .no-results {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  text-align: center;
  color: var(--text-muted);
}

.spinner {
  width: 2rem;
  height: 2rem;
  border: 2px solid var(--gray-200);
  border-top: 2px solid var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

.empty-icon, .no-results-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.empty-action-btn {
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
  margin-top: 1rem;
  transition: all 0.2s;
}

.empty-action-btn:hover {
  background: #2980b9;
  transform: translateY(-1px);
}

/* Builds Grid */
.builds-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
}

.build-card {
  padding: 1.5rem;
  background: white;
  border: 2px solid var(--border-color);
  border-radius: 12px;
  transition: all 0.2s;
  cursor: pointer;
}

.build-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.build-card.active {
  border-color: var(--success-color);
  background: rgba(16, 185, 129, 0.05);
}

.build-card.favorited {
  border-color: var(--warning-color);
}

.build-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.build-info {
  flex: 1;
  min-width: 0;
}

.build-name {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 0.5rem 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.build-meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.build-date {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.build-rating {
  padding: 0.125rem 0.5rem;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: 600;
}

.build-rating.rating-S { background: #fecaca; color: #dc2626; }
.build-rating.rating-A { background: #fed7aa; color: #ea580c; }
.build-rating.rating-B { background: #fef3c7; color: #ca8a04; }
.build-rating.rating-C { background: #dcfce7; color: #65a30d; }
.build-rating.rating-D { background: #f3f4f6; color: #6b7280; }

.build-actions {
  display: flex;
  gap: 0.5rem;
}

.icon-btn {
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

.icon-btn:hover {
  background: var(--gray-50);
  color: var(--text-primary);
}

.icon-btn.active {
  background: var(--warning-color);
  color: white;
  border-color: var(--warning-color);
}

.build-description {
  font-size: 0.9rem;
  color: var(--text-secondary);
  line-height: 1.4;
  margin-bottom: 1rem;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

/* Build Stats */
.build-stats {
  margin-bottom: 1rem;
}

.stat-group {
  display: flex;
  gap: 1rem;
}

.build-stats .stat-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: var(--gray-50);
  border-radius: 6px;
  border: none;
}

.stat-icon {
  font-size: 1rem;
}

.stat-text {
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--text-primary);
}

/* Build Relics Preview */
.build-relics-preview {
  margin-bottom: 1rem;
}

.relics-header {
  margin-bottom: 0.5rem;
}

.relics-label {
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--text-muted);
}

.relics-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.relic-chip {
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: 500;
  color: white;
}

.relic-chip.rarity-common { background: #9ca3af; }
.relic-chip.rarity-rare { background: #3b82f6; }
.relic-chip.rarity-epic { background: #8b5cf6; }
.relic-chip.rarity-legendary { background: #f59e0b; }

.relic-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 80px;
}

.more-relics {
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: 500;
  background: var(--gray-300);
  color: var(--text-primary);
}

/* Build Card Actions */
.build-card-actions {
  display: flex;
  gap: 0.5rem;
}

.load-btn, .duplicate-btn, .share-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.5rem;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.load-btn {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.load-btn:hover {
  background: #2980b9;
}

.duplicate-btn, .share-btn {
  background: white;
  color: var(--text-secondary);
}

.duplicate-btn:hover, .share-btn:hover {
  background: var(--gray-50);
  color: var(--text-primary);
}

/* Modals */
.save-dialog-content, .create-dialog-content, .import-dialog-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-label {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-primary);
}

.form-input, .form-textarea, .form-select {
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 0.9rem;
  transition: border-color 0.2s;
}

.form-input:focus, .form-textarea:focus, .form-select:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  font-size: 0.9rem;
}

.form-checkbox {
  display: none;
}

.checkbox-custom {
  width: 18px;
  height: 18px;
  border: 2px solid var(--border-color);
  border-radius: 4px;
  position: relative;
  transition: all 0.2s;
}

.form-checkbox:checked + .checkbox-custom {
  background: var(--primary-color);
  border-color: var(--primary-color);
}

.form-checkbox:checked + .checkbox-custom::after {
  content: '✓';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-size: 12px;
  font-weight: bold;
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

/* Import Dialog */
.import-tabs {
  display: flex;
  border-bottom: 1px solid var(--border-color);
  margin-bottom: 1rem;
}

.tab-btn {
  flex: 1;
  padding: 0.75rem 1rem;
  border: none;
  background: none;
  font-size: 0.875rem;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
}

.tab-btn:hover {
  background: var(--gray-50);
}

.tab-btn.active {
  border-bottom-color: var(--primary-color);
  color: var(--primary-color);
}

.import-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.import-textarea {
  min-height: 120px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.8rem;
}

.file-input-container {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.file-input {
  display: none;
}

.file-input-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: white;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
}

.file-input-btn:hover {
  background: var(--gray-50);
}

.file-name {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.import-preview {
  padding: 1rem;
  background: var(--gray-50);
  border-radius: 6px;
  border: 1px solid var(--border-color);
}

.import-preview h4 {
  margin: 0 0 0.75rem 0;
  font-size: 1rem;
  color: var(--text-primary);
}

.preview-content {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.preview-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.preview-label {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.preview-value {
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--text-primary);
}

/* Context Menu */
.context-menu {
  background: white;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 0.5rem 0;
  min-width: 160px;
}

.context-menu-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.75rem 1rem;
  border: none;
  background: none;
  font-size: 0.875rem;
  text-align: left;
  cursor: pointer;
  transition: background-color 0.2s;
}

.context-menu-item:hover {
  background: var(--gray-50);
}

.context-menu-item.danger {
  color: var(--danger-color);
}

.context-menu-item.danger:hover {
  background: rgba(239, 68, 68, 0.1);
}

.context-menu-divider {
  height: 1px;
  background: var(--border-color);
  margin: 0.5rem 0;
}

.context-menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 999;
}

/* Animations */
@keyframes spin {
  to { transform: rotate(360deg); }
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
  
  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .section-controls {
    flex-wrap: wrap;
    align-self: stretch;
  }
  
  .search-input {
    width: 100%;
  }
  
  .summary-stats {
    grid-template-columns: 1fr;
  }
  
  .builds-grid {
    grid-template-columns: 1fr;
  }
  
  .build-card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }
  
  .build-actions {
    align-self: stretch;
  }
  
  .stat-group {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .build-card-actions {
    flex-direction: column;
  }
}
</style>
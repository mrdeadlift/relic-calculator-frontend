import { ref, computed, reactive, watch } from 'vue'
import type { Build, Relic } from '../types/build'
import { useToast } from './useToast'

// Storage keys
const STORAGE_KEYS = {
  BUILDS: 'nightreign_saved_builds',
  CURRENT_BUILD: 'nightreign_current_build',
  BUILD_SETTINGS: 'nightreign_build_settings'
} as const

// Build manager state
interface BuildManagerState {
  isLoading: boolean
  isSaving: boolean
  error: string | null
  lastSync: number
  autoSave: boolean
  maxBuilds: number
}

// Build statistics
interface BuildStats {
  totalBuilds: number
  favoriteBuilds: number
  averageMultiplier: number
  topRating: string
  recentActivity: number
}

export const useBuildManager = () => {
  // State
  const state = reactive<BuildManagerState>({
    isLoading: false,
    isSaving: false,
    error: null,
    lastSync: Date.now(),
    autoSave: true,
    maxBuilds: 50
  })

  const savedBuilds = ref<Build[]>([])
  const currentBuild = ref<Build | null>(null)
  const buildHistory = ref<Build[]>([])

  // Composables
  const { success, error: showError, warning } = useToast()

  // Computed
  const loading = computed(() => state.isLoading)
  const saving = computed(() => state.isSaving)
  const hasBuilds = computed(() => savedBuilds.value.length > 0)
  
  const buildStats = computed((): BuildStats => {
    const builds = savedBuilds.value
    const totalBuilds = builds.length
    const favoriteBuilds = builds.filter(b => b.isFavorite).length
    const averageMultiplier = totalBuilds > 0 
      ? builds.reduce((sum, b) => sum + (b.attackMultiplier || 0), 0) / totalBuilds
      : 0
    
    const topRating = getTopRating(builds)
    const recentActivity = builds.filter(b => 
      new Date(b.lastModified || b.createdAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
    ).length

    return {
      totalBuilds,
      favoriteBuilds,
      averageMultiplier,
      topRating,
      recentActivity
    }
  })

  const favoriteBuilds = computed(() => 
    savedBuilds.value.filter(build => build.isFavorite)
  )

  const recentBuilds = computed(() => 
    savedBuilds.value
      .sort((a, b) => new Date(b.lastModified || b.createdAt).getTime() - 
                      new Date(a.lastModified || a.createdAt).getTime())
      .slice(0, 5)
  )

  // Storage functions
  const loadFromStorage = (): Build[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.BUILDS)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error('Failed to load builds from storage:', error)
      return []
    }
  }

  const saveToStorage = async (builds: Build[]): Promise<void> => {
    try {
      // Limit number of builds to prevent storage overflow
      const buildsToSave = builds.slice(0, state.maxBuilds)
      localStorage.setItem(STORAGE_KEYS.BUILDS, JSON.stringify(buildsToSave))
      state.lastSync = Date.now()
    } catch (error) {
      console.error('Failed to save builds to storage:', error)
      throw new Error('Failed to save builds')
    }
  }

  const loadCurrentBuild = (): Build | null => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CURRENT_BUILD)
      return stored ? JSON.parse(stored) : null
    } catch (error) {
      console.error('Failed to load current build:', error)
      return null
    }
  }

  const saveCurrentBuild = async (build: Build | null): Promise<void> => {
    try {
      if (build) {
        localStorage.setItem(STORAGE_KEYS.CURRENT_BUILD, JSON.stringify(build))
      } else {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_BUILD)
      }
    } catch (error) {
      console.error('Failed to save current build:', error)
      throw new Error('Failed to save current build')
    }
  }

  // Build management functions
  const initializeManager = async (): Promise<void> => {
    state.isLoading = true
    state.error = null

    try {
      // Load saved builds
      const builds = loadFromStorage()
      savedBuilds.value = builds

      // Load current build
      const current = loadCurrentBuild()
      currentBuild.value = current

      // Load build history
      buildHistory.value = builds
        .sort((a, b) => new Date(b.lastModified || b.createdAt).getTime() - 
                        new Date(a.lastModified || a.createdAt).getTime())
        .slice(0, 20)

      state.isLoading = false
    } catch (error) {
      state.error = 'Failed to initialize build manager'
      state.isLoading = false
      throw error
    }
  }

  const saveBuild = async (build: Build): Promise<Build> => {
    state.isSaving = true
    state.error = null

    try {
      // Validate build
      const validation = validateBuild(build)
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '))
      }

      // Check for existing build with same name
      const existingIndex = savedBuilds.value.findIndex(b => 
        b.name === build.name && b.id !== build.id
      )

      if (existingIndex !== -1) {
        const shouldOverwrite = confirm(
          `A build named "${build.name}" already exists. Do you want to overwrite it?`
        )
        
        if (shouldOverwrite) {
          savedBuilds.value[existingIndex] = {
            ...build,
            id: savedBuilds.value[existingIndex].id,
            createdAt: savedBuilds.value[existingIndex].createdAt,
            lastModified: new Date().toISOString()
          }
        } else {
          throw new Error('Build name already exists')
        }
      } else {
        // Add new build or update existing
        const buildIndex = savedBuilds.value.findIndex(b => b.id === build.id)
        
        if (buildIndex !== -1) {
          // Update existing
          savedBuilds.value[buildIndex] = {
            ...build,
            lastModified: new Date().toISOString()
          }
        } else {
          // Add new
          const newBuild: Build = {
            ...build,
            id: build.id || generateBuildId(),
            createdAt: new Date().toISOString(),
            lastModified: new Date().toISOString()
          }
          savedBuilds.value.unshift(newBuild)
        }
      }

      // Save to storage
      await saveToStorage(savedBuilds.value)
      
      state.isSaving = false
      return savedBuilds.value.find(b => b.id === build.id)!
    } catch (error) {
      state.error = error instanceof Error ? error.message : 'Failed to save build'
      state.isSaving = false
      throw error
    }
  }

  const loadBuild = async (buildId: string): Promise<Build | null> => {
    try {
      const build = savedBuilds.value.find(b => b.id === buildId)
      if (!build) {
        throw new Error('Build not found')
      }

      currentBuild.value = { ...build }
      await saveCurrentBuild(currentBuild.value)
      
      return currentBuild.value
    } catch (error) {
      state.error = error instanceof Error ? error.message : 'Failed to load build'
      throw error
    }
  }

  const deleteBuild = async (buildId: string): Promise<void> => {
    try {
      const buildIndex = savedBuilds.value.findIndex(b => b.id === buildId)
      if (buildIndex === -1) {
        throw new Error('Build not found')
      }

      const buildName = savedBuilds.value[buildIndex].name
      savedBuilds.value.splice(buildIndex, 1)
      
      // If deleted build was current, clear current
      if (currentBuild.value?.id === buildId) {
        currentBuild.value = null
        await saveCurrentBuild(null)
      }

      await saveToStorage(savedBuilds.value)
      success(`Build "${buildName}" deleted successfully`)
    } catch (error) {
      state.error = error instanceof Error ? error.message : 'Failed to delete build'
      throw error
    }
  }

  const duplicateBuild = async (buildId: string): Promise<Build> => {
    try {
      const originalBuild = savedBuilds.value.find(b => b.id === buildId)
      if (!originalBuild) {
        throw new Error('Build not found')
      }

      const duplicatedBuild: Build = {
        ...originalBuild,
        id: generateBuildId(),
        name: `${originalBuild.name} (Copy)`,
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        isFavorite: false
      }

      return await saveBuild(duplicatedBuild)
    } catch (error) {
      state.error = error instanceof Error ? error.message : 'Failed to duplicate build'
      throw error
    }
  }

  const exportBuild = (buildId: string): string => {
    const build = savedBuilds.value.find(b => b.id === buildId)
    if (!build) {
      throw new Error('Build not found')
    }

    const exportData = {
      version: '1.0',
      exported: new Date().toISOString(),
      build: {
        ...build,
        id: undefined // Remove ID for clean export
      }
    }

    return JSON.stringify(exportData, null, 2)
  }

  const importBuild = async (importData: string | object): Promise<Build> => {
    try {
      let data: any
      
      if (typeof importData === 'string') {
        data = JSON.parse(importData)
      } else {
        data = importData
      }

      // Handle different import formats
      let buildData: Partial<Build>
      if (data.version && data.build) {
        // Our export format
        buildData = data.build
      } else if (data.name && data.relics) {
        // Direct build data
        buildData = data
      } else {
        throw new Error('Invalid import format')
      }

      // Create new build
      const newBuild: Build = {
        id: generateBuildId(),
        name: buildData.name || 'Imported Build',
        description: buildData.description,
        relics: buildData.relics || [],
        attackMultiplier: buildData.attackMultiplier || 0,
        isFavorite: false,
        isPublic: false,
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        tags: buildData.tags || []
      }

      return await saveBuild(newBuild)
    } catch (error) {
      state.error = error instanceof Error ? error.message : 'Failed to import build'
      throw error
    }
  }

  const toggleFavorite = async (buildId: string): Promise<void> => {
    try {
      const buildIndex = savedBuilds.value.findIndex(b => b.id === buildId)
      if (buildIndex === -1) {
        throw new Error('Build not found')
      }

      savedBuilds.value[buildIndex].isFavorite = !savedBuilds.value[buildIndex].isFavorite
      savedBuilds.value[buildIndex].lastModified = new Date().toISOString()
      
      await saveToStorage(savedBuilds.value)
    } catch (error) {
      state.error = error instanceof Error ? error.message : 'Failed to toggle favorite'
      throw error
    }
  }

  const updateBuildTags = async (buildId: string, tags: string[]): Promise<void> => {
    try {
      const buildIndex = savedBuilds.value.findIndex(b => b.id === buildId)
      if (buildIndex === -1) {
        throw new Error('Build not found')
      }

      savedBuilds.value[buildIndex].tags = tags
      savedBuilds.value[buildIndex].lastModified = new Date().toISOString()
      
      await saveToStorage(savedBuilds.value)
    } catch (error) {
      state.error = error instanceof Error ? error.message : 'Failed to update tags'
      throw error
    }
  }

  const searchBuilds = (query: string): Build[] => {
    if (!query.trim()) return savedBuilds.value

    const searchTerm = query.toLowerCase()
    return savedBuilds.value.filter(build => 
      (build.name || '').toLowerCase().includes(searchTerm) ||
      (build.description || '').toLowerCase().includes(searchTerm) ||
      (build.tags || []).some(tag => tag.toLowerCase().includes(searchTerm)) ||
      (build.relics || []).some(relic => 
        relic.name.toLowerCase().includes(searchTerm)
      )
    )
  }

  const getBuildsByTag = (tag: string): Build[] => {
    return savedBuilds.value.filter(build => 
      (build.tags || []).includes(tag)
    )
  }

  const getTopBuilds = (limit: number = 10): Build[] => {
    return savedBuilds.value
      .sort((a, b) => (b.attackMultiplier || 0) - (a.attackMultiplier || 0))
      .slice(0, limit)
  }

  const clearAllBuilds = async (): Promise<void> => {
    if (!confirm('Are you sure you want to delete all builds? This action cannot be undone.')) {
      return
    }

    try {
      savedBuilds.value = []
      currentBuild.value = null
      buildHistory.value = []
      
      localStorage.removeItem(STORAGE_KEYS.BUILDS)
      localStorage.removeItem(STORAGE_KEYS.CURRENT_BUILD)
      
      success('All builds cleared successfully')
    } catch (error) {
      state.error = 'Failed to clear builds'
      throw error
    }
  }

  const exportAllBuilds = (): string => {
    const exportData = {
      version: '1.0',
      exported: new Date().toISOString(),
      builds: savedBuilds.value.map(build => ({
        ...build,
        id: undefined // Remove IDs for clean export
      })),
      stats: buildStats.value
    }

    return JSON.stringify(exportData, null, 2)
  }

  const importAllBuilds = async (importData: string): Promise<number> => {
    try {
      const data = JSON.parse(importData)
      
      if (!data.builds || !Array.isArray(data.builds)) {
        throw new Error('Invalid import format')
      }

      let importedCount = 0
      for (const buildData of data.builds) {
        try {
          await importBuild(buildData)
          importedCount++
        } catch (error) {
          console.warn('Failed to import build:', buildData.name, error)
        }
      }

      return importedCount
    } catch (error) {
      state.error = error instanceof Error ? error.message : 'Failed to import builds'
      throw error
    }
  }

  // Utility functions
  const generateBuildId = (): string => {
    return `build_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  const validateBuild = (build: Partial<Build>): { isValid: boolean; errors: string[] } => {
    const errors: string[] = []

    if (!build.name || build.name.trim().length === 0) {
      errors.push('Build name is required')
    }

    if (build.name && build.name.length > 100) {
      errors.push('Build name must be less than 100 characters')
    }

    if (build.description && build.description.length > 500) {
      errors.push('Build description must be less than 500 characters')
    }

    if (!build.relics || !Array.isArray(build.relics)) {
      errors.push('Build must have relics array')
    }

    if (build.relics && build.relics.length > 9) {
      errors.push('Build cannot have more than 9 relics')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  const getTopRating = (builds: Build[]): string => {
    if (builds.length === 0) return 'N/A'
    
    const maxMultiplier = Math.max(...builds.map(b => b.attackMultiplier || 0))
    
    if (maxMultiplier >= 5.0) return 'S'
    if (maxMultiplier >= 4.0) return 'A'
    if (maxMultiplier >= 3.0) return 'B'
    if (maxMultiplier >= 2.0) return 'C'
    return 'D'
  }

  const calculateBuildScore = (build: Build): number => {
    const multiplier = build.attackMultiplier || 0
    const relicCount = build.relics?.length || 0
    const difficultyBonus = build.relics?.reduce((sum, relic) => 
      sum + (relic.obtainmentDifficulty || 0), 0) || 0
    
    return multiplier * 10 + relicCount + (difficultyBonus / 10)
  }

  // Auto-save functionality
  const enableAutoSave = () => {
    state.autoSave = true
  }

  const disableAutoSave = () => {
    state.autoSave = false
  }

  // Watch for changes and auto-save if enabled
  watch(
    () => savedBuilds.value,
    async (newBuilds) => {
      if (state.autoSave && !state.isSaving) {
        try {
          await saveToStorage(newBuilds)
        } catch (error) {
          console.error('Auto-save failed:', error)
        }
      }
    },
    { deep: true }
  )

  return {
    // State
    state: computed(() => state),
    savedBuilds: computed(() => savedBuilds.value),
    currentBuild: computed(() => currentBuild.value),
    buildHistory: computed(() => buildHistory.value),
    loading,
    saving,
    hasBuilds,
    buildStats,
    favoriteBuilds,
    recentBuilds,

    // Build management
    initializeManager,
    saveBuild,
    loadBuild,
    deleteBuild,
    duplicateBuild,
    exportBuild,
    importBuild,
    
    // Build operations
    toggleFavorite,
    updateBuildTags,
    searchBuilds,
    getBuildsByTag,
    getTopBuilds,
    clearAllBuilds,
    exportAllBuilds,
    importAllBuilds,

    // Utilities
    validateBuild,
    calculateBuildScore,
    enableAutoSave,
    disableAutoSave,

    // Current build management
    setCurrentBuild: (build: Build | null) => {
      currentBuild.value = build
      saveCurrentBuild(build)
    },
    clearCurrentBuild: () => {
      currentBuild.value = null
      saveCurrentBuild(null)
    }
  }
}
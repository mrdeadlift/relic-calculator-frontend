import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  Build,
  BuildFilters,
  BuildSearchParams,
  BuildStats,
} from '../types/build'
import type { Relic } from '../types/relic'
import { apiService } from '../services/api'
import { useToast } from '../composables/useToast'
import { useRelicsStore } from './relics'

export const useBuildsStore = defineStore('builds', () => {
  // State
  const builds = ref<Build[]>([])
  const currentBuild = ref<Build | null>(null)
  const savedBuilds = ref<Build[]>([])
  const sharedBuilds = ref<Build[]>([])
  const buildHistory = ref<Build[]>([])
  const filters = ref<BuildFilters>({})
  const searchQuery = ref('')
  const isLoading = ref(false)
  const isSaving = ref(false)
  const error = ref<string | null>(null)
  const lastSyncTime = ref<number | null>(null)

  // Cache and pagination
  const cache = ref<Map<string, any>>(new Map())
  const currentPage = ref(1)
  const perPage = ref(20)
  const totalBuilds = ref(0)

  // Composables
  const { success, error: showError, warning } = useToast()

  // Cache settings
  const CACHE_DURATION = 10 * 60 * 1000 // 10 minutes

  // Computed
  const filteredBuilds = computed(() => {
    let filtered = builds.value

    // Apply search query
    if (searchQuery.value.trim()) {
      const query = searchQuery.value.toLowerCase()
      filtered = filtered.filter(
        build =>
          build.name.toLowerCase().includes(query) ||
          build.description?.toLowerCase().includes(query) ||
          build.tags?.some(tag => tag.toLowerCase().includes(query))
      )
    }

    // Apply filters
    const currentFilters = filters.value

    if (currentFilters.combatStyle && currentFilters.combatStyle.length > 0) {
      filtered = filtered.filter(
        build =>
          build.combatStyle &&
          currentFilters.combatStyle!.includes(build.combatStyle)
      )
    }

    if (currentFilters.relicIds && currentFilters.relicIds.length > 0) {
      filtered = filtered.filter(build =>
        build.relics.some(relic => currentFilters.relicIds!.includes(relic.id))
      )
    }

    if (currentFilters.tags && currentFilters.tags.length > 0) {
      filtered = filtered.filter(build =>
        build.tags?.some(tag => currentFilters.tags!.includes(tag))
      )
    }

    if (currentFilters.difficulty) {
      const { min, max } = currentFilters.difficulty
      filtered = filtered.filter(build => {
        const difficulty = build.obtainmentDifficulty || 0
        return (!min || difficulty >= min) && (!max || difficulty <= max)
      })
    }

    if (currentFilters.isPublic !== undefined) {
      filtered = filtered.filter(
        build => build.isPublic === currentFilters.isPublic
      )
    }

    if (currentFilters.dateRange) {
      const { from, to } = currentFilters.dateRange
      filtered = filtered.filter(build => {
        const buildDate = new Date(build.createdAt)
        return (!from || buildDate >= from) && (!to || buildDate <= to)
      })
    }

    return filtered
  })

  const favoriteBuilds = computed(() =>
    savedBuilds.value.filter(build => build.isFavorite)
  )

  const recentBuilds = computed(() =>
    [...savedBuilds.value]
      .sort(
        (a, b) =>
          new Date(b.lastModified).getTime() -
          new Date(a.lastModified).getTime()
      )
      .slice(0, 10)
  )

  const topBuilds = computed(() =>
    [...builds.value]
      .sort((a, b) => (b.attackMultiplier || 0) - (a.attackMultiplier || 0))
      .slice(0, 10)
  )

  const buildStats = computed((): BuildStats => {
    const allBuilds = savedBuilds.value
    const totalCount = allBuilds.length
    const publicCount = allBuilds.filter(b => b.isPublic).length

    const averageRelicCount =
      totalCount > 0
        ? allBuilds.reduce((sum, b) => sum + b.relics.length, 0) / totalCount
        : 0

    // Combat style distribution
    const combatStyleDist = allBuilds.reduce(
      (dist, build) => {
        if (build.combatStyle) {
          dist[build.combatStyle] = (dist[build.combatStyle] || 0) + 1
        }
        return dist
      },
      {} as Record<string, number>
    )

    // Popular relics
    const relicUsage = new Map<string, { name: string; count: number }>()
    allBuilds.forEach(build => {
      build.relics.forEach(relic => {
        const existing = relicUsage.get(relic.id)
        if (existing) {
          existing.count++
        } else {
          relicUsage.set(relic.id, { name: relic.name, count: 1 })
        }
      })
    })

    const popularRelics = Array.from(relicUsage.entries())
      .map(([relicId, data]) => ({
        relicId,
        name: data.name,
        usage: data.count,
      }))
      .sort((a, b) => b.usage - a.usage)
      .slice(0, 10)

    // Difficulty distribution
    const difficultyDist = allBuilds.reduce(
      (dist, build) => {
        const difficulty = Math.floor(build.obtainmentDifficulty || 0)
        const key = `${difficulty}-${difficulty + 1}`
        dist[key] = (dist[key] || 0) + 1
        return dist
      },
      {} as Record<string, number>
    )

    return {
      totalBuilds: totalCount,
      publicBuilds: publicCount,
      averageRelicCount: Math.round(averageRelicCount * 10) / 10,
      popularCombatStyles: combatStyleDist,
      popularRelics,
      difficultyDistribution: difficultyDist,
    }
  })

  const hasCurrentBuild = computed(() => currentBuild.value !== null)
  const canSaveCurrent = computed(
    () =>
      currentBuild.value &&
      currentBuild.value.name.trim().length > 0 &&
      currentBuild.value.relics.length > 0
  )

  // Actions
  const fetchBuilds = async (params?: BuildSearchParams) => {
    const cacheKey = `builds_${JSON.stringify(params || {})}`
    const cachedData = cache.value.get(cacheKey)
    const now = Date.now()

    // Check cache
    if (cachedData && now - cachedData.timestamp < CACHE_DURATION) {
      builds.value = cachedData.data
      totalBuilds.value = cachedData.total
      return
    }

    isLoading.value = true
    error.value = null

    try {
      const searchParams = {
        ...params,
        page: currentPage.value,
        perPage: perPage.value,
      }

      const response = await apiService.builds.search(searchParams)
      builds.value = response.data.builds
      totalBuilds.value = response.data.total

      // Update cache
      cache.value.set(cacheKey, {
        data: response.data.builds,
        total: response.data.total,
        timestamp: now,
      })
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch builds'
      showError('Failed to load builds')
      console.error('Fetch builds error:', err)
    } finally {
      isLoading.value = false
    }
  }

  const getBuild = async (buildId: string): Promise<Build | null> => {
    // Check current builds first
    const existing =
      builds.value.find(b => b.id === buildId) ||
      savedBuilds.value.find(b => b.id === buildId)
    if (existing) return existing

    // Check cache
    const cacheKey = `build_${buildId}`
    const cached = cache.value.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data
    }

    try {
      const response = await apiService.builds.getById(buildId)
      const build = response.data

      // Cache single build
      cache.value.set(cacheKey, {
        data: build,
        timestamp: Date.now(),
      })

      return build
    } catch (err: any) {
      console.error('Get build error:', err)
      return null
    }
  }

  const createBuild = async (buildData: Partial<Build>): Promise<Build> => {
    isSaving.value = true
    error.value = null

    try {
      // Generate build
      const newBuild: Build = {
        id: generateBuildId(),
        name: buildData.name || 'Untitled Build',
        description: buildData.description,
        relics: buildData.relics || [],
        combatStyle: buildData.combatStyle,
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        isPublic: buildData.isPublic || false,
        isFavorite: buildData.isFavorite || false,
        tags: buildData.tags || [],
        attackMultiplier: buildData.attackMultiplier || 0,
        obtainmentDifficulty: buildData.obtainmentDifficulty || 0,
      }

      // Save locally first
      savedBuilds.value.unshift(newBuild)

      // Persist to localStorage
      await persistBuilds()

      success(`Build "${newBuild.name}" created successfully`)
      return newBuild
    } catch (err: any) {
      error.value = err.message || 'Failed to create build'
      showError('Failed to create build')
      throw err
    } finally {
      isSaving.value = false
    }
  }

  const updateBuild = async (
    buildId: string,
    updates: Partial<Build>
  ): Promise<Build> => {
    isSaving.value = true
    error.value = null

    try {
      const buildIndex = savedBuilds.value.findIndex(b => b.id === buildId)
      if (buildIndex === -1) {
        throw new Error('Build not found')
      }

      const updatedBuild = {
        ...savedBuilds.value[buildIndex],
        ...updates,
        lastModified: new Date().toISOString(),
      }

      savedBuilds.value[buildIndex] = updatedBuild

      // Update current build if it's the same
      if (currentBuild.value?.id === buildId) {
        currentBuild.value = { ...updatedBuild }
      }

      await persistBuilds()
      success(`Build "${updatedBuild.name}" updated successfully`)

      return updatedBuild
    } catch (err: any) {
      error.value = err.message || 'Failed to update build'
      showError('Failed to update build')
      throw err
    } finally {
      isSaving.value = false
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

      // Clear current build if it was deleted
      if (currentBuild.value?.id === buildId) {
        currentBuild.value = null
      }

      await persistBuilds()
      success(`Build "${buildName}" deleted successfully`)
    } catch (err: any) {
      error.value = err.message || 'Failed to delete build'
      showError('Failed to delete build')
      throw err
    }
  }

  const duplicateBuild = async (buildId: string): Promise<Build> => {
    const originalBuild = savedBuilds.value.find(b => b.id === buildId)
    if (!originalBuild) {
      throw new Error('Build not found')
    }

    const duplicatedBuild = {
      ...originalBuild,
      id: generateBuildId(),
      name: `${originalBuild.name} (Copy)`,
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      isFavorite: false,
    }

    return await createBuild(duplicatedBuild)
  }

  const setCurrentBuild = (build: Build | null) => {
    currentBuild.value = build
    if (build) {
      // Add to history
      const historyIndex = buildHistory.value.findIndex(b => b.id === build.id)
      if (historyIndex !== -1) {
        buildHistory.value.splice(historyIndex, 1)
      }
      buildHistory.value.unshift(build)

      // Keep only recent 50 builds in history
      if (buildHistory.value.length > 50) {
        buildHistory.value = buildHistory.value.slice(0, 50)
      }
    }
  }

  const createBuildFromRelics = (relics: Relic[], name?: string) => {
    const newBuild: Build = {
      id: generateBuildId(),
      name: name || `Build ${new Date().toLocaleDateString()}`,
      relics: [...relics],
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      isPublic: false,
      isFavorite: false,
      tags: [],
    }

    setCurrentBuild(newBuild)
    return newBuild
  }

  const addRelicToCurrentBuild = (relic: Relic) => {
    if (!currentBuild.value) {
      createBuildFromRelics([relic])
      return
    }

    if (currentBuild.value.relics.length >= 9) {
      showError('Maximum 9 relics per build')
      return
    }

    if (currentBuild.value.relics.some(r => r.id === relic.id)) {
      warning('Relic already in build')
      return
    }

    currentBuild.value.relics.push(relic)
    currentBuild.value.lastModified = new Date().toISOString()
  }

  const removeRelicFromCurrentBuild = (relicId: string) => {
    if (!currentBuild.value) return

    const index = currentBuild.value.relics.findIndex(r => r.id === relicId)
    if (index !== -1) {
      currentBuild.value.relics.splice(index, 1)
      currentBuild.value.lastModified = new Date().toISOString()
    }
  }

  const toggleBuildFavorite = async (buildId: string) => {
    const build = savedBuilds.value.find(b => b.id === buildId)
    if (build) {
      build.isFavorite = !build.isFavorite
      build.lastModified = new Date().toISOString()
      await persistBuilds()
    }
  }

  const updateBuildTags = async (buildId: string, tags: string[]) => {
    const build = savedBuilds.value.find(b => b.id === buildId)
    if (build) {
      build.tags = [...tags]
      build.lastModified = new Date().toISOString()
      await persistBuilds()
    }
  }

  // Filter and search
  const setFilters = (newFilters: BuildFilters) => {
    filters.value = { ...newFilters }
  }

  const updateFilters = (partialFilters: Partial<BuildFilters>) => {
    filters.value = { ...filters.value, ...partialFilters }
  }

  const clearFilters = () => {
    filters.value = {}
    searchQuery.value = ''
  }

  const setSearchQuery = (query: string) => {
    searchQuery.value = query
  }

  // Pagination
  const setPage = (page: number) => {
    currentPage.value = page
  }

  const setPerPage = (size: number) => {
    perPage.value = size
    currentPage.value = 1 // Reset to first page
  }

  // Import/Export
  const exportBuild = (build: Build): string => {
    const exportData = {
      version: '1.0',
      exported: new Date().toISOString(),
      build: {
        ...build,
        id: undefined, // Remove ID for clean export
      },
    }
    return JSON.stringify(exportData, null, 2)
  }

  const importBuild = async (importData: string): Promise<Build> => {
    try {
      const data = JSON.parse(importData)
      let buildData: Partial<Build>

      if (data.version && data.build) {
        buildData = data.build
      } else if (data.name && data.relics) {
        buildData = data
      } else {
        throw new Error('Invalid import format')
      }

      return await createBuild({
        ...buildData,
        name: buildData.name || 'Imported Build',
        isFavorite: false,
        isPublic: false,
      })
    } catch (err: any) {
      error.value = 'Failed to import build'
      showError('Invalid build data')
      throw err
    }
  }

  const exportAllBuilds = (): string => {
    const exportData = {
      version: '1.0',
      exported: new Date().toISOString(),
      builds: savedBuilds.value.map(build => ({
        ...build,
        id: undefined,
      })),
      stats: buildStats.value,
    }
    return JSON.stringify(exportData, null, 2)
  }

  // Persistence
  const STORAGE_KEY = 'nightreign_builds'

  const persistBuilds = async () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedBuilds.value))
      lastSyncTime.value = Date.now()
    } catch (err) {
      console.error('Failed to persist builds:', err)
      throw new Error('Failed to save builds')
    }
  }

  const loadPersistedBuilds = async () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        savedBuilds.value = JSON.parse(stored)
      }
    } catch (err) {
      console.error('Failed to load persisted builds:', err)
    }
  }

  // Utility functions
  const generateBuildId = (): string => {
    return `build_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  const clearCache = () => {
    cache.value.clear()
    success('Cache cleared')
  }

  // Initialize
  const initialize = async () => {
    await loadPersistedBuilds()
  }

  return {
    // State
    builds: computed(() => builds.value),
    currentBuild: computed(() => currentBuild.value),
    savedBuilds: computed(() => savedBuilds.value),
    filteredBuilds,
    buildHistory: computed(() => buildHistory.value),
    isLoading: computed(() => isLoading.value),
    isSaving: computed(() => isSaving.value),
    error: computed(() => error.value),

    // Computed
    favoriteBuilds,
    recentBuilds,
    topBuilds,
    buildStats,
    hasCurrentBuild,
    canSaveCurrent,

    // Build management
    initialize,
    fetchBuilds,
    getBuild,
    createBuild,
    updateBuild,
    deleteBuild,
    duplicateBuild,
    setCurrentBuild,
    createBuildFromRelics,
    addRelicToCurrentBuild,
    removeRelicFromCurrentBuild,
    toggleBuildFavorite,
    updateBuildTags,

    // Filtering and search
    setFilters,
    updateFilters,
    clearFilters,
    setSearchQuery,
    searchQuery: computed(() => searchQuery.value),
    filters: computed(() => filters.value),

    // Pagination
    setPage,
    setPerPage,
    currentPage: computed(() => currentPage.value),
    perPage: computed(() => perPage.value),
    totalBuilds: computed(() => totalBuilds.value),

    // Import/Export
    exportBuild,
    importBuild,
    exportAllBuilds,

    // Utilities
    clearCache,
  }
})

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Relic, RelicFilters, RelicSearchParams } from '../types/relic'
import { apiService } from '../services/api'
import { useToast } from '../composables/useToast'

export const useRelicsStore = defineStore('relics', () => {
  // State
  const relics = ref<Relic[]>([])
  const selectedRelics = ref<Relic[]>([])
  const currentFilters = ref<RelicFilters>({})
  const searchQuery = ref('')
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const lastFetched = ref<number | null>(null)
  const cache = ref<Map<string, Relic[]>>(new Map())

  // Composables
  const { showError, showSuccess } = useToast()

  // Cache duration (5 minutes)
  const CACHE_DURATION = 5 * 60 * 1000

  // Computed
  const filteredRelics = computed(() => {
    let filtered = relics.value

    // Apply search query
    if (searchQuery.value.trim()) {
      const query = searchQuery.value.toLowerCase()
      filtered = filtered.filter(relic =>
        relic.name.toLowerCase().includes(query) ||
        relic.description?.toLowerCase().includes(query) ||
        relic.type.toLowerCase().includes(query) ||
        relic.effects?.some(effect => 
          effect.type.toLowerCase().includes(query) ||
          effect.description?.toLowerCase().includes(query)
        )
      )
    }

    // Apply filters
    const filters = currentFilters.value

    if (filters.types && filters.types.length > 0) {
      filtered = filtered.filter(relic => filters.types!.includes(relic.type))
    }

    if (filters.effects && filters.effects.length > 0) {
      filtered = filtered.filter(relic =>
        relic.effects?.some(effect => filters.effects!.includes(effect.type))
      )
    }

    if (filters.attackMultiplier) {
      const { min, max } = filters.attackMultiplier
      filtered = filtered.filter(relic => {
        const multiplier = relic.attackMultiplier || 0
        return (!min || multiplier >= min) && (!max || multiplier <= max)
      })
    }

    if (filters.obtainmentDifficulty) {
      const { min, max } = filters.obtainmentDifficulty
      filtered = filtered.filter(relic => {
        const difficulty = relic.obtainmentDifficulty || 0
        return (!min || difficulty >= min) && (!max || difficulty <= max)
      })
    }

    if (filters.rarity && filters.rarity.length > 0) {
      filtered = filtered.filter(relic => 
        relic.rarity && filters.rarity!.includes(relic.rarity)
      )
    }

    if (filters.source && filters.source.length > 0) {
      filtered = filtered.filter(relic => 
        relic.source && filters.source!.includes(relic.source)
      )
    }

    return filtered
  })

  const selectedRelicIds = computed(() => 
    selectedRelics.value.map(relic => relic.id)
  )

  const hasSelection = computed(() => selectedRelics.value.length > 0)

  const selectionStats = computed(() => {
    const selection = selectedRelics.value
    return {
      count: selection.length,
      totalMultiplier: selection.reduce((sum, r) => sum + (r.attackMultiplier || 0), 0),
      averageMultiplier: selection.length > 0 
        ? selection.reduce((sum, r) => sum + (r.attackMultiplier || 0), 0) / selection.length
        : 0,
      averageDifficulty: selection.length > 0
        ? selection.reduce((sum, r) => sum + (r.obtainmentDifficulty || 0), 0) / selection.length
        : 0,
      types: [...new Set(selection.map(r => r.type))],
      effects: [...new Set(selection.flatMap(r => (r.effects || []).map(e => e.type)))]
    }
  })

  const isRelicSelected = computed(() => (relicId: string) => 
    selectedRelicIds.value.includes(relicId)
  )

  const canSelectMore = computed(() => selectedRelics.value.length < 9)

  // Actions
  const fetchRelics = async (force = false) => {
    // Check cache first
    const cacheKey = 'all_relics'
    const cachedData = cache.value.get(cacheKey)
    const now = Date.now()

    if (!force && cachedData && lastFetched.value && (now - lastFetched.value) < CACHE_DURATION) {
      relics.value = cachedData
      return
    }

    isLoading.value = true
    error.value = null

    try {
      const response = await apiService.relics.getAll()
      relics.value = response.data
      lastFetched.value = now
      
      // Update cache
      cache.value.set(cacheKey, response.data)
      
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch relics'
      showError('Failed to load relics')
      console.error('Fetch relics error:', err)
    } finally {
      isLoading.value = false
    }
  }

  const searchRelics = async (params: RelicSearchParams) => {
    isLoading.value = true
    error.value = null

    try {
      const response = await apiService.relics.search(params)
      relics.value = response.data
      
    } catch (err: any) {
      error.value = err.message || 'Failed to search relics'
      showError('Search failed')
      console.error('Search relics error:', err)
    } finally {
      isLoading.value = false
    }
  }

  const getRelic = async (id: string): Promise<Relic | null> => {
    // Check if already loaded
    const existing = relics.value.find(r => r.id === id)
    if (existing) return existing

    // Check cache
    const cacheKey = `relic_${id}`
    const cached = cache.value.get(cacheKey)?.[0]
    if (cached) return cached

    try {
      const response = await apiService.relics.getById(id)
      const relic = response.data
      
      // Add to main collection if not exists
      if (!relics.value.find(r => r.id === relic.id)) {
        relics.value.push(relic)
      }
      
      // Cache single relic
      cache.value.set(cacheKey, [relic])
      
      return relic
    } catch (err: any) {
      console.error('Get relic error:', err)
      return null
    }
  }

  const selectRelic = (relic: Relic) => {
    if (selectedRelics.value.length >= 9) {
      showError('Maximum 9 relics can be selected')
      return false
    }

    if (!selectedRelicIds.value.includes(relic.id)) {
      selectedRelics.value.push(relic)
      return true
    }
    return false
  }

  const deselectRelic = (relicId: string) => {
    const index = selectedRelics.value.findIndex(r => r.id === relicId)
    if (index !== -1) {
      selectedRelics.value.splice(index, 1)
      return true
    }
    return false
  }

  const toggleRelic = (relic: Relic) => {
    if (isRelicSelected.value(relic.id)) {
      deselectRelic(relic.id)
    } else {
      selectRelic(relic)
    }
  }

  const clearSelection = () => {
    selectedRelics.value = []
  }

  const selectRelicsByIds = async (relicIds: string[]) => {
    selectedRelics.value = []
    
    for (const id of relicIds.slice(0, 9)) { // Limit to 9
      const relic = await getRelic(id)
      if (relic) {
        selectedRelics.value.push(relic)
      }
    }
  }

  const reorderSelectedRelics = (fromIndex: number, toIndex: number) => {
    if (fromIndex < 0 || fromIndex >= selectedRelics.value.length ||
        toIndex < 0 || toIndex >= selectedRelics.value.length) {
      return false
    }

    const item = selectedRelics.value.splice(fromIndex, 1)[0]
    selectedRelics.value.splice(toIndex, 0, item)
    return true
  }

  const setFilters = (filters: RelicFilters) => {
    currentFilters.value = { ...filters }
  }

  const updateFilters = (partialFilters: Partial<RelicFilters>) => {
    currentFilters.value = { ...currentFilters.value, ...partialFilters }
  }

  const clearFilters = () => {
    currentFilters.value = {}
    searchQuery.value = ''
  }

  const setSearchQuery = (query: string) => {
    searchQuery.value = query
  }

  // Quick filter presets
  const applyQuickFilter = (preset: string) => {
    switch (preset) {
      case 'high_damage':
        setFilters({
          attackMultiplier: { min: 0.5 }
        })
        break
      case 'easy_obtain':
        setFilters({
          obtainmentDifficulty: { max: 3 }
        })
        break
      case 'legendary':
        setFilters({
          rarity: ['legendary']
        })
        break
      case 'synergy_focused':
        setFilters({
          effects: ['synergy', 'combo', 'chain']
        })
        break
      default:
        clearFilters()
    }
  }

  // Utility functions
  const getRelicsByType = (type: string) => 
    relics.value.filter(relic => relic.type === type)

  const getRelicsByEffect = (effectType: string) => 
    relics.value.filter(relic => 
      relic.effects?.some(effect => effect.type === effectType)
    )

  const getTopRelics = (limit = 10) => 
    [...relics.value]
      .sort((a, b) => (b.attackMultiplier || 0) - (a.attackMultiplier || 0))
      .slice(0, limit)

  const getRandomRelics = (count = 5) => {
    const shuffled = [...relics.value].sort(() => Math.random() - 0.5)
    return shuffled.slice(0, count)
  }

  // Cache management
  const clearCache = () => {
    cache.value.clear()
    showSuccess('Cache cleared')
  }

  const getCacheInfo = () => {
    return {
      size: cache.value.size,
      keys: Array.from(cache.value.keys()),
      lastFetched: lastFetched.value ? new Date(lastFetched.value) : null
    }
  }

  // Initialize
  const initialize = async () => {
    await fetchRelics()
  }

  return {
    // State
    relics: computed(() => relics.value),
    selectedRelics: computed(() => selectedRelics.value),
    filteredRelics,
    currentFilters: computed(() => currentFilters.value),
    searchQuery: computed(() => searchQuery.value),
    isLoading: computed(() => isLoading.value),
    error: computed(() => error.value),

    // Computed
    selectedRelicIds,
    hasSelection,
    selectionStats,
    isRelicSelected,
    canSelectMore,

    // Actions
    initialize,
    fetchRelics,
    searchRelics,
    getRelic,
    selectRelic,
    deselectRelic,
    toggleRelic,
    clearSelection,
    selectRelicsByIds,
    reorderSelectedRelics,
    setFilters,
    updateFilters,
    clearFilters,
    setSearchQuery,
    applyQuickFilter,

    // Utilities
    getRelicsByType,
    getRelicsByEffect,
    getTopRelics,
    getRandomRelics,
    clearCache,
    getCacheInfo
  }
})
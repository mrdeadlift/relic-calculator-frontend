import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useRelicsStore } from '../relics'
import { TestDataFactory } from '../../test/helpers/test-utils'

describe('Relics Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const store = useRelicsStore()

      expect(store.relics).toEqual([])
      expect(store.selectedRelics).toEqual([])
      expect(store.loading).toBe(false)
      expect(store.error).toBeNull()
      expect(store.cache.has('all')).toBe(false)
      expect(store.quickFilters).toEqual({
        category: '',
        rarity: '',
        search: ''
      })
    })
  })

  describe('actions', () => {
    describe('fetchRelics', () => {
      it('should fetch and cache relics successfully', async () => {
        const store = useRelicsStore()
        
        await store.fetchRelics()

        expect(store.loading).toBe(false)
        expect(store.error).toBeNull()
        expect(store.relics.length).toBeGreaterThan(0)
        expect(store.cache.has('all')).toBe(true)
      })

      it('should handle fetch errors gracefully', async () => {
        const store = useRelicsStore()
        
        // Mock API error
        vi.mock('../../services/api', () => ({
          apiService: {
            relics: {
              list: vi.fn().mockRejectedValue(new Error('Network error'))
            }
          }
        }))

        await store.fetchRelics()

        expect(store.loading).toBe(false)
        expect(store.error).toBe('Failed to fetch relics')
        expect(store.relics).toEqual([])
      })

      it('should not refetch if data is cached and fresh', async () => {
        const store = useRelicsStore()
        
        // First fetch
        await store.fetchRelics()
        const firstFetchTime = store.lastFetch
        const firstRelicsCount = store.relics.length

        // Immediate second fetch
        await store.fetchRelics()

        expect(store.lastFetch).toBe(firstFetchTime)
        expect(store.relics.length).toBe(firstRelicsCount)
      })

      it('should force refetch when requested', async () => {
        const store = useRelicsStore()
        
        await store.fetchRelics()
        const firstFetchTime = store.lastFetch

        // Wait a bit to ensure different timestamp
        await new Promise(resolve => setTimeout(resolve, 10))

        await store.fetchRelics(true) // Force refresh

        expect(store.lastFetch).toBeGreaterThan(firstFetchTime)
      })
    })

    describe('fetchRelicById', () => {
      it('should fetch specific relic by ID', async () => {
        const store = useRelicsStore()
        
        const relic = await store.fetchRelicById('relic-1')

        expect(relic).toBeDefined()
        expect(relic?.id).toBe('relic-1')
        expect(store.cache.has('relic-1')).toBe(true)
      })

      it('should return cached relic if available', async () => {
        const store = useRelicsStore()
        
        // First fetch
        const relic1 = await store.fetchRelicById('relic-1')
        
        // Second fetch should return cached version
        const relic2 = await store.fetchRelicById('relic-1')

        expect(relic1).toBe(relic2)
      })

      it('should handle non-existent relic ID', async () => {
        const store = useRelicsStore()
        
        const relic = await store.fetchRelicById('non-existent-id')

        expect(relic).toBeNull()
        expect(store.error).toBe('Relic not found')
      })
    })

    describe('selectRelic', () => {
      it('should select a relic', async () => {
        const store = useRelicsStore()
        await store.fetchRelics()
        
        const relicId = store.relics[0]?.id
        if (relicId) {
          await store.selectRelic(relicId)
          
          expect(store.selectedRelics).toContain(relicId)
          expect(store.isRelicSelected(relicId)).toBe(true)
        }
      })

      it('should not select more than maximum allowed relics', async () => {
        const store = useRelicsStore()
        await store.fetchRelics()
        
        // Select maximum relics (9)
        for (let i = 0; i < 9 && i < store.relics.length; i++) {
          await store.selectRelic(store.relics[i].id)
        }

        expect(store.selectedRelics.length).toBe(Math.min(9, store.relics.length))

        // Try to select one more
        if (store.relics.length > 9) {
          const success = await store.selectRelic(store.relics[9].id)
          expect(success).toBe(false)
          expect(store.selectedRelics.length).toBe(9)
        }
      })

      it('should not select conflicting relics', async () => {
        const store = useRelicsStore()
        
        // Mock relics with conflicts
        const relic1 = TestDataFactory.createRelic({ 
          id: 'relic-1', 
          conflicts: ['relic-2'] 
        })
        const relic2 = TestDataFactory.createRelic({ 
          id: 'relic-2' 
        })
        
        store.relics = [relic1, relic2]
        
        await store.selectRelic('relic-1')
        const success = await store.selectRelic('relic-2')

        expect(success).toBe(false)
        expect(store.selectedRelics).toContain('relic-1')
        expect(store.selectedRelics).not.toContain('relic-2')
      })

      it('should handle selecting already selected relic', async () => {
        const store = useRelicsStore()
        await store.fetchRelics()
        
        const relicId = store.relics[0]?.id
        if (relicId) {
          await store.selectRelic(relicId)
          await store.selectRelic(relicId) // Select again
          
          expect(store.selectedRelics.filter(id => id === relicId).length).toBe(1)
        }
      })
    })

    describe('deselectRelic', () => {
      it('should deselect a selected relic', async () => {
        const store = useRelicsStore()
        await store.fetchRelics()
        
        const relicId = store.relics[0]?.id
        if (relicId) {
          await store.selectRelic(relicId)
          expect(store.isRelicSelected(relicId)).toBe(true)
          
          store.deselectRelic(relicId)
          expect(store.isRelicSelected(relicId)).toBe(false)
        }
      })

      it('should handle deselecting non-selected relic', () => {
        const store = useRelicsStore()
        
        // Should not throw error
        store.deselectRelic('non-selected-relic')
        expect(store.selectedRelics).toEqual([])
      })
    })

    describe('clearSelection', () => {
      it('should clear all selected relics', async () => {
        const store = useRelicsStore()
        await store.fetchRelics()
        
        // Select multiple relics
        for (let i = 0; i < 3 && i < store.relics.length; i++) {
          await store.selectRelic(store.relics[i].id)
        }

        expect(store.selectedRelics.length).toBeGreaterThan(0)
        
        store.clearSelection()
        expect(store.selectedRelics).toEqual([])
      })
    })

    describe('applyQuickFilter', () => {
      it('should apply category filter', async () => {
        const store = useRelicsStore()
        await store.fetchRelics()
        
        store.applyQuickFilter('category', 'Attack')
        
        expect(store.quickFilters.category).toBe('Attack')
        expect(store.filteredRelics.every(r => r.category === 'Attack')).toBe(true)
      })

      it('should apply rarity filter', async () => {
        const store = useRelicsStore()
        await store.fetchRelics()
        
        store.applyQuickFilter('rarity', 'legendary')
        
        expect(store.quickFilters.rarity).toBe('legendary')
        expect(store.filteredRelics.every(r => r.rarity === 'legendary')).toBe(true)
      })

      it('should apply search filter', async () => {
        const store = useRelicsStore()
        await store.fetchRelics()
        
        store.applyQuickFilter('search', 'attack')
        
        expect(store.quickFilters.search).toBe('attack')
        expect(store.filteredRelics.every(r => 
          r.name.toLowerCase().includes('attack') || 
          r.description.toLowerCase().includes('attack')
        )).toBe(true)
      })

      it('should combine multiple filters', async () => {
        const store = useRelicsStore()
        await store.fetchRelics()
        
        store.applyQuickFilter('category', 'Attack')
        store.applyQuickFilter('rarity', 'rare')
        
        expect(store.filteredRelics.every(r => 
          r.category === 'Attack' && r.rarity === 'rare'
        )).toBe(true)
      })
    })

    describe('clearFilters', () => {
      it('should clear all filters', async () => {
        const store = useRelicsStore()
        await store.fetchRelics()
        
        store.applyQuickFilter('category', 'Attack')
        store.applyQuickFilter('rarity', 'rare')
        store.applyQuickFilter('search', 'test')
        
        store.clearFilters()
        
        expect(store.quickFilters).toEqual({
          category: '',
          rarity: '',
          search: ''
        })
        expect(store.filteredRelics).toEqual(store.relics)
      })
    })
  })

  describe('getters', () => {
    describe('selectedRelicObjects', () => {
      it('should return selected relic objects', async () => {
        const store = useRelicsStore()
        await store.fetchRelics()
        
        const relicId = store.relics[0]?.id
        if (relicId) {
          await store.selectRelic(relicId)
          
          expect(store.selectedRelicObjects.length).toBe(1)
          expect(store.selectedRelicObjects[0].id).toBe(relicId)
        }
      })

      it('should return empty array when no relics selected', () => {
        const store = useRelicsStore()
        
        expect(store.selectedRelicObjects).toEqual([])
      })
    })

    describe('filteredRelics', () => {
      it('should return all relics when no filters applied', async () => {
        const store = useRelicsStore()
        await store.fetchRelics()
        
        expect(store.filteredRelics).toEqual(store.relics)
      })

      it('should return filtered relics when filters applied', async () => {
        const store = useRelicsStore()
        await store.fetchRelics()
        
        store.applyQuickFilter('category', 'Attack')
        
        const attackRelics = store.relics.filter(r => r.category === 'Attack')
        expect(store.filteredRelics).toEqual(attackRelics)
      })
    })

    describe('hasSelectedRelics', () => {
      it('should return true when relics are selected', async () => {
        const store = useRelicsStore()
        await store.fetchRelics()
        
        const relicId = store.relics[0]?.id
        if (relicId) {
          await store.selectRelic(relicId)
          expect(store.hasSelectedRelics).toBe(true)
        }
      })

      it('should return false when no relics selected', () => {
        const store = useRelicsStore()
        expect(store.hasSelectedRelics).toBe(false)
      })
    })

    describe('selectionCount', () => {
      it('should return correct selection count', async () => {
        const store = useRelicsStore()
        await store.fetchRelics()
        
        expect(store.selectionCount).toBe(0)
        
        for (let i = 0; i < 3 && i < store.relics.length; i++) {
          await store.selectRelic(store.relics[i].id)
          expect(store.selectionCount).toBe(i + 1)
        }
      })
    })

    describe('canSelectMore', () => {
      it('should return true when can select more relics', async () => {
        const store = useRelicsStore()
        await store.fetchRelics()
        
        expect(store.canSelectMore).toBe(true)
      })

      it('should return false when maximum relics selected', async () => {
        const store = useRelicsStore()
        await store.fetchRelics()
        
        // Select maximum relics
        for (let i = 0; i < 9 && i < store.relics.length; i++) {
          await store.selectRelic(store.relics[i].id)
        }
        
        expect(store.canSelectMore).toBe(false)
      })
    })
  })

  describe('cache management', () => {
    it('should cache fetched data', async () => {
      const store = useRelicsStore()
      
      await store.fetchRelics()
      expect(store.cache.has('all')).toBe(true)
      
      await store.fetchRelicById('relic-1')
      expect(store.cache.has('relic-1')).toBe(true)
    })

    it('should clear cache when requested', async () => {
      const store = useRelicsStore()
      
      await store.fetchRelics()
      await store.fetchRelicById('relic-1')
      
      expect(store.cache.size).toBeGreaterThan(0)
      
      store.clearCache()
      expect(store.cache.size).toBe(0)
    })

    it('should respect cache TTL', async () => {
      const store = useRelicsStore()
      
      await store.fetchRelics()
      
      // Simulate cache expiry
      const cacheEntry = store.cache.get('all')
      if (cacheEntry) {
        cacheEntry.timestamp = Date.now() - (store.cacheTTL + 1000)
      }
      
      await store.fetchRelics()
      
      // Should refetch due to expired cache
      expect(store.lastFetch).toBeGreaterThan(Date.now() - 1000)
    })
  })

  describe('error handling', () => {
    it('should handle network errors gracefully', async () => {
      const store = useRelicsStore()
      
      // Mock network error
      vi.mock('../../services/api', () => ({
        apiService: {
          relics: {
            list: vi.fn().mockRejectedValue(new Error('Network error'))
          }
        }
      }))

      await store.fetchRelics()

      expect(store.error).toBeTruthy()
      expect(store.loading).toBe(false)
    })

    it('should clear error when operation succeeds', async () => {
      const store = useRelicsStore()
      
      // Set initial error
      store.error = 'Previous error'
      
      await store.fetchRelics()
      
      expect(store.error).toBeNull()
    })

    it('should handle concurrent fetch requests', async () => {
      const store = useRelicsStore()
      
      // Start multiple concurrent fetches
      const promises = [
        store.fetchRelics(),
        store.fetchRelics(),
        store.fetchRelics()
      ]
      
      await Promise.all(promises)
      
      expect(store.relics.length).toBeGreaterThan(0)
      expect(store.error).toBeNull()
    })
  })
})
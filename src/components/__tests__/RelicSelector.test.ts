import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import RelicSelector from '../RelicSelector.vue'
import {
  createTestEnvironment,
  TestDataFactory,
} from '../../test/helpers/test-utils'
import { useRelicsStore } from '../../stores/relics'

describe('RelicSelector', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('rendering', () => {
    it('should render with loading state initially', () => {
      const { wrapper, assert } = createTestEnvironment(RelicSelector)

      assert.expectLoadingState(true)
      assert.expectElementExists('.relic-selector')
    })

    it('should render relics after loading', async () => {
      const { wrapper, assert, async } = createTestEnvironment(RelicSelector)

      // Wait for relics to load
      await async.waitForCondition(() => !wrapper.vm.loading, 5000)

      assert.expectLoadingState(false)
      assert.expectElementExists('.relic-grid')
      expect(wrapper.findAll('.relic-card').length).toBeGreaterThan(0)
    })

    it('should render empty state when no relics available', async () => {
      const { wrapper, assert } = createTestEnvironment(RelicSelector)

      // Mock empty relics response
      const store = useRelicsStore()
      store.relics = []
      store.loading = false

      await wrapper.vm.$nextTick()

      assert.expectElementExists('.empty-state')
      assert.expectTextContent('.empty-state', 'No relics available')
    })

    it('should render error state when fetch fails', async () => {
      const { wrapper, assert } = createTestEnvironment(RelicSelector)

      const store = useRelicsStore()
      store.error = 'Failed to load relics'
      store.loading = false

      await wrapper.vm.$nextTick()

      assert.expectErrorMessage('Failed to load relics')
    })
  })

  describe('filtering', () => {
    beforeEach(async () => {
      const store = useRelicsStore()
      // Mock relics data
      store.relics = [
        TestDataFactory.createRelic({
          id: 'relic-1',
          name: 'Attack Relic',
          category: 'Attack',
          rarity: 'common',
        }),
        TestDataFactory.createRelic({
          id: 'relic-2',
          name: 'Defense Relic',
          category: 'Defense',
          rarity: 'rare',
        }),
        TestDataFactory.createRelic({
          id: 'relic-3',
          name: 'Critical Relic',
          category: 'Critical',
          rarity: 'legendary',
        }),
      ]
      store.loading = false
    })

    it('should filter relics by category', async () => {
      const { wrapper, user, assert } = createTestEnvironment(RelicSelector)

      await user.selectOption('[data-testid="category-filter"]', 'Attack')

      const visibleRelics = wrapper.findAll('.relic-card:not(.hidden)')
      expect(visibleRelics.length).toBe(1)
      assert.expectTextContent(visibleRelics[0], 'Attack Relic')
    })

    it('should filter relics by rarity', async () => {
      const { wrapper, user, assert } = createTestEnvironment(RelicSelector)

      await user.selectOption('[data-testid="rarity-filter"]', 'legendary')

      const visibleRelics = wrapper.findAll('.relic-card:not(.hidden)')
      expect(visibleRelics.length).toBe(1)
      assert.expectTextContent(visibleRelics[0], 'Critical Relic')
    })

    it('should filter relics by search query', async () => {
      const { wrapper, user, assert } = createTestEnvironment(RelicSelector)

      await user.typeInInput('[data-testid="search-input"]', 'defense')

      const visibleRelics = wrapper.findAll('.relic-card:not(.hidden)')
      expect(visibleRelics.length).toBe(1)
      assert.expectTextContent(visibleRelics[0], 'Defense Relic')
    })

    it('should combine multiple filters', async () => {
      const { wrapper, user } = createTestEnvironment(RelicSelector)

      // Add more test data with overlapping criteria
      const store = useRelicsStore()
      store.relics.push(
        TestDataFactory.createRelic({
          id: 'relic-4',
          name: 'Rare Attack Relic',
          category: 'Attack',
          rarity: 'rare',
        })
      )

      await user.selectOption('[data-testid="category-filter"]', 'Attack')
      await user.selectOption('[data-testid="rarity-filter"]', 'rare')

      const visibleRelics = wrapper.findAll('.relic-card:not(.hidden)')
      expect(visibleRelics.length).toBe(1)
      expect(visibleRelics[0].text()).toContain('Rare Attack Relic')
    })

    it('should clear filters when clear button is clicked', async () => {
      const { wrapper, user, assert } = createTestEnvironment(RelicSelector)

      // Apply filters
      await user.selectOption('[data-testid="category-filter"]', 'Attack')
      await user.typeInInput('[data-testid="search-input"]', 'test')

      // Clear filters
      await user.clickButton('[data-testid="clear-filters"]')

      const categoryFilter = wrapper.find('[data-testid="category-filter"]')
      const searchInput = wrapper.find('[data-testid="search-input"]')

      expect((categoryFilter.element as HTMLSelectElement).value).toBe('')
      expect((searchInput.element as HTMLInputElement).value).toBe('')

      // All relics should be visible
      const visibleRelics = wrapper.findAll('.relic-card:not(.hidden)')
      expect(visibleRelics.length).toBe(3)
    })
  })

  describe('relic selection', () => {
    beforeEach(async () => {
      const store = useRelicsStore()
      store.relics = [
        TestDataFactory.createRelic({ id: 'relic-1', name: 'Test Relic 1' }),
        TestDataFactory.createRelic({ id: 'relic-2', name: 'Test Relic 2' }),
        TestDataFactory.createRelic({ id: 'relic-3', name: 'Test Relic 3' }),
      ]
      store.loading = false
    })

    it('should select relic when clicked', async () => {
      const { wrapper, user, assert } = createTestEnvironment(RelicSelector)

      const firstRelic = wrapper.find('.relic-card')
      await user.clickButton(firstRelic)

      assert.expectElementHasClass(firstRelic, 'selected')

      const store = useRelicsStore()
      expect(store.selectedRelics).toContain('relic-1')
    })

    it('should deselect relic when clicked again', async () => {
      const { wrapper, user, assert } = createTestEnvironment(RelicSelector)

      const firstRelic = wrapper.find('.relic-card')

      // Select
      await user.clickButton(firstRelic)
      assert.expectElementHasClass(firstRelic, 'selected')

      // Deselect
      await user.clickButton(firstRelic)
      expect(firstRelic.classes()).not.toContain('selected')

      const store = useRelicsStore()
      expect(store.selectedRelics).not.toContain('relic-1')
    })

    it('should show selection counter', async () => {
      const { wrapper, user, assert } = createTestEnvironment(RelicSelector)

      // Initially no selection
      assert.expectTextContent(
        '[data-testid="selection-counter"]',
        '0 / 9 selected'
      )

      // Select one relic
      await user.clickButton('.relic-card:first-child')
      assert.expectTextContent(
        '[data-testid="selection-counter"]',
        '1 / 9 selected'
      )

      // Select another relic
      await user.clickButton('.relic-card:nth-child(2)')
      assert.expectTextContent(
        '[data-testid="selection-counter"]',
        '2 / 9 selected'
      )
    })

    it('should disable selection when maximum reached', async () => {
      const { wrapper, user, assert } = createTestEnvironment(RelicSelector)

      // Mock maximum selections
      const store = useRelicsStore()
      for (let i = 0; i < 9; i++) {
        store.relics.push(TestDataFactory.createRelic({ id: `max-relic-${i}` }))
        store.selectedRelics.push(`max-relic-${i}`)
      }

      await wrapper.vm.$nextTick()

      // Try to select one more
      const unselectedRelic = wrapper.findAll('.relic-card:not(.selected)')[0]
      await user.clickButton(unselectedRelic)

      expect(unselectedRelic.classes()).not.toContain('selected')
      assert.expectTextContent(
        '[data-testid="max-selection-warning"]',
        'Maximum 9 relics can be selected'
      )
    })

    it('should handle conflicting relic selection', async () => {
      const { wrapper, user, assert } = createTestEnvironment(RelicSelector)

      const store = useRelicsStore()
      store.relics = [
        TestDataFactory.createRelic({
          id: 'relic-1',
          name: 'Conflicting Relic 1',
          conflicts: ['relic-2'],
        }),
        TestDataFactory.createRelic({
          id: 'relic-2',
          name: 'Conflicting Relic 2',
        }),
      ]

      await wrapper.vm.$nextTick()

      // Select first relic
      await user.clickButton('.relic-card:first-child')

      // Try to select conflicting relic
      await user.clickButton('.relic-card:nth-child(2)')

      const secondRelic = wrapper.find('.relic-card:nth-child(2)')
      expect(secondRelic.classes()).not.toContain('selected')
      assert.expectElementExists('[data-testid="conflict-warning"]')
    })
  })

  describe('bulk actions', () => {
    beforeEach(async () => {
      const store = useRelicsStore()
      store.relics = Array.from({ length: 15 }, (_, i) =>
        TestDataFactory.createRelic({
          id: `bulk-relic-${i}`,
          name: `Bulk Relic ${i}`,
          category: i < 8 ? 'Attack' : 'Defense',
        })
      )
      store.loading = false
    })

    it('should select all visible relics', async () => {
      const { wrapper, user, assert } = createTestEnvironment(RelicSelector)

      await user.clickButton('[data-testid="select-all"]')

      const store = useRelicsStore()
      expect(store.selectedRelics.length).toBe(9) // Limited to maximum
      assert.expectTextContent(
        '[data-testid="selection-counter"]',
        '9 / 9 selected'
      )
    })

    it('should select all filtered relics', async () => {
      const { wrapper, user, assert } = createTestEnvironment(RelicSelector)

      // Filter by category
      await user.selectOption('[data-testid="category-filter"]', 'Attack')

      // Select all filtered
      await user.clickButton('[data-testid="select-all"]')

      const store = useRelicsStore()
      expect(store.selectedRelics.length).toBe(8) // 8 Attack relics

      // All selected should be Attack category
      const selectedObjects = store.selectedRelicObjects
      expect(selectedObjects.every(r => r.category === 'Attack')).toBe(true)
    })

    it('should clear all selections', async () => {
      const { wrapper, user, assert } = createTestEnvironment(RelicSelector)

      // Select some relics first
      await user.clickButton('.relic-card:nth-child(1)')
      await user.clickButton('.relic-card:nth-child(2)')
      await user.clickButton('.relic-card:nth-child(3)')

      // Clear all
      await user.clickButton('[data-testid="clear-all"]')

      const store = useRelicsStore()
      expect(store.selectedRelics.length).toBe(0)
      assert.expectTextContent(
        '[data-testid="selection-counter"]',
        '0 / 9 selected'
      )

      // No relic cards should have selected class
      const selectedCards = wrapper.findAll('.relic-card.selected')
      expect(selectedCards.length).toBe(0)
    })
  })

  describe('relic display', () => {
    beforeEach(async () => {
      const store = useRelicsStore()
      store.relics = [
        TestDataFactory.createRelic({
          id: 'display-relic-1',
          name: 'Display Test Relic',
          description: 'A relic for testing display features',
          category: 'Attack',
          rarity: 'legendary',
          iconUrl: '/icons/test-relic.png',
          obtainmentDifficulty: 8,
          effects: [
            {
              id: 'effect-1',
              name: 'Attack Boost',
              description: '+25% attack damage',
              type: 'attack_multiplier',
              value: 1.25,
              stackingRule: 'multiplicative',
              damageTypes: ['physical'],
              conditions: [],
            },
          ],
        }),
      ]
      store.loading = false
    })

    it('should display relic information correctly', async () => {
      const { wrapper, assert } = createTestEnvironment(RelicSelector)

      const relicCard = wrapper.find('.relic-card')

      assert.expectTextContent(relicCard, 'Display Test Relic')
      assert.expectTextContent(
        relicCard,
        'A relic for testing display features'
      )
      assert.expectElementAttribute(
        relicCard.find('.relic-icon img'),
        'src',
        '/icons/test-relic.png'
      )
      assert.expectElementHasClass(
        relicCard.find('.relic-rarity'),
        'rarity-legendary'
      )
      assert.expectElementHasClass(
        relicCard.find('.relic-category'),
        'category-attack'
      )
    })

    it('should show difficulty indicator', async () => {
      const { wrapper, assert } = createTestEnvironment(RelicSelector)

      const difficultyBar = wrapper.find('.difficulty-bar')
      const difficultyFill = difficultyBar.find('.difficulty-fill')

      assert.expectElementExists(difficultyBar)
      expect(difficultyFill.attributes('style')).toContain('width: 80%') // 8/10 * 100%
    })

    it('should show effects preview', async () => {
      const { wrapper, assert } = createTestEnvironment(RelicSelector)

      const effectsPreview = wrapper.find('.effects-preview')
      assert.expectElementExists(effectsPreview)
      assert.expectTextContent(effectsPreview, 'Attack Boost')
      assert.expectTextContent(effectsPreview, '+25% attack damage')
    })

    it('should show tooltip on hover', async () => {
      const { wrapper, assert } = createTestEnvironment(RelicSelector)

      const relicCard = wrapper.find('.relic-card')
      await relicCard.trigger('mouseenter')

      await wrapper.vm.$nextTick()

      const tooltip = wrapper.find('.relic-tooltip')
      assert.expectElementExists(tooltip)
      assert.expectTextContent(tooltip, 'Display Test Relic')
      assert.expectTextContent(tooltip, 'Difficulty: 8/10')
    })
  })

  describe('performance', () => {
    it('should handle large numbers of relics efficiently', async () => {
      const store = useRelicsStore()

      // Create 1000 test relics
      const startTime = performance.now()
      store.relics = Array.from({ length: 1000 }, (_, i) =>
        TestDataFactory.createRelic({
          id: `perf-relic-${i}`,
          name: `Performance Relic ${i}`,
        })
      )
      store.loading = false

      const { wrapper } = createTestEnvironment(RelicSelector)
      await wrapper.vm.$nextTick()

      const endTime = performance.now()
      const renderTime = endTime - startTime

      // Should render within reasonable time (2 seconds)
      expect(renderTime).toBeLessThan(2000)

      // Should still show relics (with virtualization)
      expect(wrapper.findAll('.relic-card').length).toBeGreaterThan(0)
    })

    it('should debounce search input', async () => {
      const { wrapper, user } = createTestEnvironment(RelicSelector)

      const searchInput = wrapper.find('[data-testid="search-input"]')

      // Type rapidly
      await user.typeInInput(searchInput, 'a')
      await user.typeInInput(searchInput, 'at')
      await user.typeInInput(searchInput, 'att')
      await user.typeInInput(searchInput, 'atta')
      await user.typeInInput(searchInput, 'attack')

      // Wait for debounce
      await new Promise(resolve => setTimeout(resolve, 300))

      const store = useRelicsStore()
      // Should only have filtered once after debounce
      expect(store.quickFilters.search).toBe('attack')
    })
  })

  describe('accessibility', () => {
    it('should have proper ARIA labels', async () => {
      const { wrapper, assert } = createTestEnvironment(RelicSelector)

      const store = useRelicsStore()
      store.relics = [TestDataFactory.createRelic({ id: 'a11y-relic' })]
      store.loading = false

      await wrapper.vm.$nextTick()

      const relicCard = wrapper.find('.relic-card')
      expect(relicCard.attributes('role')).toBe('button')
      expect(relicCard.attributes('aria-label')).toContain('Select relic')
      expect(relicCard.attributes('tabindex')).toBe('0')
    })

    it('should support keyboard navigation', async () => {
      const { wrapper } = createTestEnvironment(RelicSelector)

      const store = useRelicsStore()
      store.relics = [
        TestDataFactory.createRelic({ id: 'kbd-relic-1' }),
        TestDataFactory.createRelic({ id: 'kbd-relic-2' }),
      ]
      store.loading = false

      await wrapper.vm.$nextTick()

      const firstRelic = wrapper.find('.relic-card:first-child')
      const secondRelic = wrapper.find('.relic-card:nth-child(2)')

      // Focus first relic
      firstRelic.element.focus()
      expect(document.activeElement).toBe(firstRelic.element)

      // Navigate with arrow keys
      await firstRelic.trigger('keydown.arrowright')
      expect(document.activeElement).toBe(secondRelic.element)

      // Select with Enter
      await secondRelic.trigger('keydown.enter')
      expect(secondRelic.classes()).toContain('selected')
    })

    it('should announce selection changes to screen readers', async () => {
      const { wrapper, user } = createTestEnvironment(RelicSelector)

      const store = useRelicsStore()
      store.relics = [
        TestDataFactory.createRelic({
          id: 'sr-relic',
          name: 'Screen Reader Relic',
        }),
      ]
      store.loading = false

      await wrapper.vm.$nextTick()

      await user.clickButton('.relic-card')

      const announcement = wrapper.find('[aria-live="polite"]')
      expect(announcement.text()).toContain('Screen Reader Relic selected')
    })
  })
})

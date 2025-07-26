import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import RelicCalculator from '../RelicCalculator.vue'
import {
  createTestEnvironment,
  TestDataFactory,
} from '../../test/helpers/test-utils'
import { useRelicsStore } from '../../stores/relics'
import { useCalculationStore } from '../../stores/calculations'

describe('RelicCalculator', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('rendering', () => {
    it('should render calculator interface', () => {
      const { wrapper, assert } = createTestEnvironment(RelicCalculator)

      assert.expectElementExists('.relic-calculator')
      assert.expectElementExists('[data-testid="calculation-form"]')
      assert.expectElementExists('[data-testid="results-panel"]')
    })

    it('should show calculation form initially', () => {
      const { wrapper, assert } = createTestEnvironment(RelicCalculator)

      assert.expectElementExists('[data-testid="context-inputs"]')
      assert.expectElementExists('[data-testid="calculate-button"]')
      assert.expectElementNotExists('[data-testid="calculation-results"]')
    })

    it('should render context input fields', () => {
      const { wrapper, assert } = createTestEnvironment(RelicCalculator)

      assert.expectElementExists('[data-testid="attack-type-select"]')
      assert.expectElementExists('[data-testid="weapon-type-select"]')
      assert.expectElementExists('[data-testid="player-level-input"]')
      assert.expectElementExists('[data-testid="combat-style-select"]')
    })
  })

  describe('calculation execution', () => {
    beforeEach(async () => {
      const relicsStore = useRelicsStore()
      relicsStore.relics = [
        TestDataFactory.createRelic({ id: 'relic-1', category: 'Attack' }),
        TestDataFactory.createRelic({ id: 'relic-2', category: 'Defense' }),
        TestDataFactory.createRelic({ id: 'relic-3', category: 'Critical' }),
      ]
      relicsStore.selectedRelics = ['relic-1', 'relic-2']
    })

    it('should execute calculation when button clicked', async () => {
      const { wrapper, user, assert } = createTestEnvironment(RelicCalculator)

      await user.clickButton('[data-testid="calculate-button"]')

      assert.expectElementExists('[data-testid="calculation-results"]')
      assert.expectLoadingState(false)
    })

    it('should show loading state during calculation', async () => {
      const { wrapper, user, assert } = createTestEnvironment(RelicCalculator)

      // Start calculation
      const calculatePromise = user.clickButton(
        '[data-testid="calculate-button"]'
      )

      // Should show loading immediately
      assert.expectLoadingState(true)
      assert.expectElementExists('[data-testid="calculating-spinner"]')

      await calculatePromise
    })

    it('should handle calculation errors gracefully', async () => {
      const calculationStore = useCalculationStore()
      vi.spyOn(calculationStore, 'calculate').mockRejectedValue(
        new Error('Calculation failed')
      )

      const { wrapper, user, assert } = createTestEnvironment(RelicCalculator)

      await user.clickButton('[data-testid="calculate-button"]')

      assert.expectErrorMessage('Calculation failed')
      assert.expectLoadingState(false)
    })

    it('should disable calculate button when no relics selected', () => {
      const relicsStore = useRelicsStore()
      relicsStore.selectedRelics = []

      const { wrapper, assert } = createTestEnvironment(RelicCalculator)

      const calculateButton = wrapper.find('[data-testid="calculate-button"]')
      expect(calculateButton.attributes('disabled')).toBeDefined()
    })

    it('should include context data in calculation request', async () => {
      const calculationStore = useCalculationStore()
      const calculateSpy = vi.spyOn(calculationStore, 'calculate')

      const { wrapper, user } = createTestEnvironment(RelicCalculator)

      // Set context values
      await user.selectOption('[data-testid="attack-type-select"]', 'critical')
      await user.selectOption('[data-testid="weapon-type-select"]', 'sword')
      await user.typeInInput('[data-testid="player-level-input"]', '50')

      await user.clickButton('[data-testid="calculate-button"]')

      expect(calculateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          context: expect.objectContaining({
            attackType: 'critical',
            weaponType: 'sword',
            playerLevel: 50,
          }),
        })
      )
    })
  })

  describe('results display', () => {
    beforeEach(async () => {
      const relicsStore = useRelicsStore()
      const calculationStore = useCalculationStore()

      relicsStore.selectedRelics = ['relic-1', 'relic-2']
      calculationStore.lastResult = TestDataFactory.createCalculationResult({
        attackMultipliers: {
          total: 2.5,
          base: 1.0,
          synergy: 0.8,
          conditional: 0.7,
        },
        efficiency: 0.85,
        obtainmentDifficulty: 6,
      })
    })

    it('should display calculation results', () => {
      const { wrapper, assert } = createTestEnvironment(RelicCalculator)

      assert.expectElementExists('[data-testid="calculation-results"]')
      assert.expectTextContent('[data-testid="total-multiplier"]', '2.5')
      assert.expectTextContent('[data-testid="efficiency-score"]', '85%')
      assert.expectTextContent('[data-testid="difficulty-score"]', '6')
    })

    it('should show attack multiplier breakdown', () => {
      const { wrapper, assert } = createTestEnvironment(RelicCalculator)

      assert.expectElementExists('[data-testid="multiplier-breakdown"]')
      assert.expectTextContent('[data-testid="base-multiplier"]', '1.0')
      assert.expectTextContent('[data-testid="synergy-multiplier"]', '0.8')
      assert.expectTextContent('[data-testid="conditional-multiplier"]', '0.7')
    })

    it('should display relic details in results', () => {
      const { wrapper, assert } = createTestEnvironment(RelicCalculator)

      assert.expectElementExists('[data-testid="relic-details"]')
      expect(wrapper.findAll('[data-testid="relic-detail-item"]').length).toBe(
        2
      )
    })

    it('should show export options for results', () => {
      const { wrapper, assert } = createTestEnvironment(RelicCalculator)

      assert.expectElementExists('[data-testid="export-options"]')
      assert.expectElementExists('[data-testid="export-json"]')
      assert.expectElementExists('[data-testid="export-csv"]')
      assert.expectElementExists('[data-testid="share-build"]')
    })
  })

  describe('context management', () => {
    it('should save context to localStorage', async () => {
      const { wrapper, user } = createTestEnvironment(RelicCalculator)

      await user.selectOption('[data-testid="attack-type-select"]', 'critical')
      await user.typeInInput('[data-testid="player-level-input"]', '75')

      // Context should be saved automatically
      const savedContext = JSON.parse(
        localStorage.getItem('calculationContext') || '{}'
      )
      expect(savedContext.attackType).toBe('critical')
      expect(savedContext.playerLevel).toBe(75)
    })

    it('should restore context from localStorage', () => {
      // Pre-populate localStorage
      localStorage.setItem(
        'calculationContext',
        JSON.stringify({
          attackType: 'normal',
          weaponType: 'bow',
          playerLevel: 60,
        })
      )

      const { wrapper, assert } = createTestEnvironment(RelicCalculator)

      const attackTypeSelect = wrapper.find(
        '[data-testid="attack-type-select"]'
      )
      const weaponTypeSelect = wrapper.find(
        '[data-testid="weapon-type-select"]'
      )
      const playerLevelInput = wrapper.find(
        '[data-testid="player-level-input"]'
      )

      expect((attackTypeSelect.element as HTMLSelectElement).value).toBe(
        'normal'
      )
      expect((weaponTypeSelect.element as HTMLSelectElement).value).toBe('bow')
      expect((playerLevelInput.element as HTMLInputElement).value).toBe('60')
    })

    it('should reset context to defaults', async () => {
      const { wrapper, user, assert } = createTestEnvironment(RelicCalculator)

      // Set some values
      await user.selectOption('[data-testid="attack-type-select"]', 'critical')
      await user.typeInInput('[data-testid="player-level-input"]', '90')

      // Reset
      await user.clickButton('[data-testid="reset-context"]')

      const attackTypeSelect = wrapper.find(
        '[data-testid="attack-type-select"]'
      )
      const playerLevelInput = wrapper.find(
        '[data-testid="player-level-input"]'
      )

      expect((attackTypeSelect.element as HTMLSelectElement).value).toBe(
        'normal'
      )
      expect((playerLevelInput.element as HTMLInputElement).value).toBe('1')
    })
  })

  describe('advanced options', () => {
    it('should toggle advanced options panel', async () => {
      const { wrapper, user, assert } = createTestEnvironment(RelicCalculator)

      assert.expectElementNotExists('[data-testid="advanced-options"]')

      await user.clickButton('[data-testid="toggle-advanced"]')

      assert.expectElementExists('[data-testid="advanced-options"]')
    })

    it('should include breakdown option in calculation', async () => {
      const calculationStore = useCalculationStore()
      const calculateSpy = vi.spyOn(calculationStore, 'calculate')

      const { wrapper, user } = createTestEnvironment(RelicCalculator)

      await user.clickButton('[data-testid="toggle-advanced"]')
      await user.clickButton('[data-testid="include-breakdown"]')
      await user.clickButton('[data-testid="calculate-button"]')

      expect(calculateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          options: expect.objectContaining({
            includeBreakdown: true,
          }),
        })
      )
    })

    it('should include performance metrics option', async () => {
      const calculationStore = useCalculationStore()
      const calculateSpy = vi.spyOn(calculationStore, 'calculate')

      const { wrapper, user } = createTestEnvironment(RelicCalculator)

      await user.clickButton('[data-testid="toggle-advanced"]')
      await user.clickButton('[data-testid="include-performance"]')
      await user.clickButton('[data-testid="calculate-button"]')

      expect(calculateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          options: expect.objectContaining({
            includePerformance: true,
          }),
        })
      )
    })
  })

  describe('keyboard shortcuts', () => {
    it('should trigger calculation with Ctrl+Enter', async () => {
      const calculationStore = useCalculationStore()
      const calculateSpy = vi.spyOn(calculationStore, 'calculate')

      const { wrapper } = createTestEnvironment(RelicCalculator)

      await wrapper.trigger('keydown', { key: 'Enter', ctrlKey: true })

      expect(calculateSpy).toHaveBeenCalled()
    })

    it('should reset form with Ctrl+R', async () => {
      const { wrapper, user } = createTestEnvironment(RelicCalculator)

      // Set some values
      await user.typeInInput('[data-testid="player-level-input"]', '50')

      await wrapper.trigger('keydown', { key: 'r', ctrlKey: true })

      const playerLevelInput = wrapper.find(
        '[data-testid="player-level-input"]'
      )
      expect((playerLevelInput.element as HTMLInputElement).value).toBe('1')
    })
  })

  describe('accessibility', () => {
    it('should have proper form labels', () => {
      const { wrapper } = createTestEnvironment(RelicCalculator)

      const attackTypeSelect = wrapper.find(
        '[data-testid="attack-type-select"]'
      )
      const weaponTypeSelect = wrapper.find(
        '[data-testid="weapon-type-select"]'
      )
      const playerLevelInput = wrapper.find(
        '[data-testid="player-level-input"]'
      )

      expect(attackTypeSelect.attributes('aria-label')).toBeTruthy()
      expect(weaponTypeSelect.attributes('aria-label')).toBeTruthy()
      expect(playerLevelInput.attributes('aria-label')).toBeTruthy()
    })

    it('should announce calculation status to screen readers', async () => {
      const { wrapper, user } = createTestEnvironment(RelicCalculator)

      await user.clickButton('[data-testid="calculate-button"]')

      const statusAnnouncement = wrapper.find('[aria-live="polite"]')
      expect(statusAnnouncement.exists()).toBe(true)
      expect(statusAnnouncement.text()).toContain('Calculation completed')
    })

    it('should support keyboard navigation', async () => {
      const { wrapper } = createTestEnvironment(RelicCalculator)

      const firstInput = wrapper.find('[data-testid="attack-type-select"]')
      const calculateButton = wrapper.find('[data-testid="calculate-button"]')

      firstInput.element.focus()
      expect(document.activeElement).toBe(firstInput.element)

      // Tab navigation should work
      await wrapper.trigger('keydown', { key: 'Tab' })

      // Should be able to reach calculate button via keyboard
      expect(calculateButton.attributes('tabindex')).not.toBe('-1')
    })
  })

  describe('performance', () => {
    it('should debounce context input changes', async () => {
      const { wrapper, user } = createTestEnvironment(RelicCalculator)

      const playerLevelInput = wrapper.find(
        '[data-testid="player-level-input"]'
      )

      // Type rapidly
      await user.typeInInput(playerLevelInput, '1')
      await user.typeInInput(playerLevelInput, '12')
      await user.typeInInput(playerLevelInput, '123')

      // Wait for debounce
      await new Promise(resolve => setTimeout(resolve, 300))

      // Should only save context once after debounce
      const savedContext = JSON.parse(
        localStorage.getItem('calculationContext') || '{}'
      )
      expect(savedContext.playerLevel).toBe(123)
    })

    it('should handle large calculation results efficiently', async () => {
      const calculationStore = useCalculationStore()
      calculationStore.lastResult = TestDataFactory.createCalculationResult({
        effectBreakdown: Array.from({ length: 100 }, (_, i) => ({
          id: `effect-${i}`,
          name: `Effect ${i}`,
          description: `Test effect ${i}`,
          value: i * 0.1,
        })),
      })

      const startTime = performance.now()
      const { wrapper } = createTestEnvironment(RelicCalculator)
      const endTime = performance.now()

      const renderTime = endTime - startTime
      expect(renderTime).toBeLessThan(1000) // Should render within 1 second

      expect(
        wrapper.findAll('[data-testid="effect-item"]').length
      ).toBeGreaterThan(0)
    })
  })
})

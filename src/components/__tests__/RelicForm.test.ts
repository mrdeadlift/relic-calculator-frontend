import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import RelicForm from '../RelicForm.vue'
import { createTestEnvironment, TestDataFactory, createMockFile } from '../../test/helpers/test-utils'

describe('RelicForm', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('rendering', () => {
    it('should render empty form for new relic', () => {
      const { wrapper, assert } = createTestEnvironment(RelicForm)

      assert.expectElementExists('[data-testid="relic-form"]')
      assert.expectElementExists('[data-testid="name-input"]')
      assert.expectElementExists('[data-testid="description-input"]')
      assert.expectElementExists('[data-testid="category-select"]')
      assert.expectElementExists('[data-testid="rarity-select"]')
      assert.expectElementExists('[data-testid="submit-button"]')
    })

    it('should populate form when editing existing relic', () => {
      const existingRelic = TestDataFactory.createRelic({
        name: 'Existing Relic',
        description: 'Test description',
        category: 'Attack',
        rarity: 'legendary'
      })

      const { wrapper, assert } = createTestEnvironment(RelicForm, {
        props: { relic: existingRelic, mode: 'edit' }
      })

      assert.expectFormFieldValue('[data-testid="name-input"]', 'Existing Relic')
      assert.expectFormFieldValue('[data-testid="description-input"]', 'Test description')
      
      const categorySelect = wrapper.find('[data-testid="category-select"]')
      expect((categorySelect.element as HTMLSelectElement).value).toBe('Attack')
    })

    it('should show form title based on mode', () => {
      const { wrapper: createWrapper, assert: createAssert } = createTestEnvironment(RelicForm, {
        props: { mode: 'create' }
      })
      createAssert.expectTextContent('[data-testid="form-title"]', 'Create New Relic')

      const { wrapper: editWrapper, assert: editAssert } = createTestEnvironment(RelicForm, {
        props: { mode: 'edit' }
      })
      editAssert.expectTextContent('[data-testid="form-title"]', 'Edit Relic')
    })
  })

  describe('form validation', () => {
    it('should validate required fields', async () => {
      const { wrapper, user, assert } = createTestEnvironment(RelicForm)

      await user.clickButton('[data-testid="submit-button"]')

      assert.expectErrorMessage('Name is required')
      assert.expectElementExists('[data-testid="name-error"]')
    })

    it('should validate name length', async () => {
      const { wrapper, user, assert } = createTestEnvironment(RelicForm)

      await user.typeInInput('[data-testid="name-input"]', 'A')
      await user.clickButton('[data-testid="submit-button"]')

      assert.expectTextContent('[data-testid="name-error"]', 'Name must be at least 3 characters')
    })

    it('should validate description length', async () => {
      const { wrapper, user, assert } = createTestEnvironment(RelicForm)

      const longDescription = 'A'.repeat(1001)
      await user.typeInInput('[data-testid="description-input"]', longDescription)
      await user.clickButton('[data-testid="submit-button"]')

      assert.expectTextContent('[data-testid="description-error"]', 'Description must be less than 1000 characters')
    })

    it('should validate obtainment difficulty range', async () => {
      const { wrapper, user, assert } = createTestEnvironment(RelicForm)

      await user.typeInInput('[data-testid="difficulty-input"]', '11')
      await user.clickButton('[data-testid="submit-button"]')

      assert.expectTextContent('[data-testid="difficulty-error"]', 'Difficulty must be between 1 and 10')
    })

    it('should validate icon URL format', async () => {
      const { wrapper, user, assert } = createTestEnvironment(RelicForm)

      await user.typeInInput('[data-testid="icon-url-input"]', 'invalid-url')
      await user.clickButton('[data-testid="submit-button"]')

      assert.expectTextContent('[data-testid="icon-error"]', 'Please enter a valid URL')
    })

    it('should show validation errors for effects', async () => {
      const { wrapper, user, assert } = createTestEnvironment(RelicForm)

      await user.clickButton('[data-testid="add-effect"]')
      await user.clickButton('[data-testid="submit-button"]')

      assert.expectElementExists('[data-testid="effect-0-name-error"]')
      assert.expectTextContent('[data-testid="effect-0-name-error"]', 'Effect name is required')
    })
  })

  describe('effects management', () => {
    it('should add new effect', async () => {
      const { wrapper, user, assert } = createTestEnvironment(RelicForm)

      assert.expectElementNotExists('[data-testid="effect-0"]')

      await user.clickButton('[data-testid="add-effect"]')

      assert.expectElementExists('[data-testid="effect-0"]')
      assert.expectElementExists('[data-testid="effect-0-name"]')
      assert.expectElementExists('[data-testid="effect-0-description"]')
      assert.expectElementExists('[data-testid="effect-0-type"]')
      assert.expectElementExists('[data-testid="effect-0-value"]')
    })

    it('should remove effect', async () => {
      const { wrapper, user, assert } = createTestEnvironment(RelicForm)

      await user.clickButton('[data-testid="add-effect"]')
      assert.expectElementExists('[data-testid="effect-0"]')

      await user.clickButton('[data-testid="remove-effect-0"]')
      assert.expectElementNotExists('[data-testid="effect-0"]')
    })

    it('should populate effect fields', async () => {
      const { wrapper, user, assert } = createTestEnvironment(RelicForm)

      await user.clickButton('[data-testid="add-effect"]')
      await user.typeInInput('[data-testid="effect-0-name"]', 'Attack Boost')
      await user.typeInInput('[data-testid="effect-0-description"]', 'Increases attack damage')
      await user.selectOption('[data-testid="effect-0-type"]', 'attack_multiplier')
      await user.typeInInput('[data-testid="effect-0-value"]', '1.25')

      assert.expectFormFieldValue('[data-testid="effect-0-name"]', 'Attack Boost')
      assert.expectFormFieldValue('[data-testid="effect-0-description"]', 'Increases attack damage')
      assert.expectFormFieldValue('[data-testid="effect-0-value"]', '1.25')
    })

    it('should handle multiple effects', async () => {
      const { wrapper, user, assert } = createTestEnvironment(RelicForm)

      await user.clickButton('[data-testid="add-effect"]')
      await user.clickButton('[data-testid="add-effect"]')
      await user.clickButton('[data-testid="add-effect"]')

      assert.expectElementExists('[data-testid="effect-0"]')
      assert.expectElementExists('[data-testid="effect-1"]')
      assert.expectElementExists('[data-testid="effect-2"]')

      const effectsCounter = wrapper.find('[data-testid="effects-count"]')
      expect(effectsCounter.text()).toContain('3 effects')
    })

    it('should validate effect values based on type', async () => {
      const { wrapper, user, assert } = createTestEnvironment(RelicForm)

      await user.clickButton('[data-testid="add-effect"]')
      await user.selectOption('[data-testid="effect-0-type"]', 'percentage')
      await user.typeInInput('[data-testid="effect-0-value"]', '150')

      await user.clickButton('[data-testid="submit-button"]')

      assert.expectTextContent('[data-testid="effect-0-value-error"]', 'Percentage values must be between 0 and 100')
    })
  })

  describe('conditions management', () => {
    it('should add conditions to effects', async () => {
      const { wrapper, user, assert } = createTestEnvironment(RelicForm)

      await user.clickButton('[data-testid="add-effect"]')
      await user.clickButton('[data-testid="add-condition-0"]')

      assert.expectElementExists('[data-testid="effect-0-condition-0"]')
      assert.expectElementExists('[data-testid="condition-0-type"]')
      assert.expectElementExists('[data-testid="condition-0-value"]')
    })

    it('should remove conditions', async () => {
      const { wrapper, user, assert } = createTestEnvironment(RelicForm)

      await user.clickButton('[data-testid="add-effect"]')
      await user.clickButton('[data-testid="add-condition-0"]')
      assert.expectElementExists('[data-testid="effect-0-condition-0"]')

      await user.clickButton('[data-testid="remove-condition-0-0"]')
      assert.expectElementNotExists('[data-testid="effect-0-condition-0"]')
    })

    it('should validate condition values', async () => {
      const { wrapper, user, assert } = createTestEnvironment(RelicForm)

      await user.clickButton('[data-testid="add-effect"]')
      await user.clickButton('[data-testid="add-condition-0"]')
      await user.selectOption('[data-testid="condition-0-type"]', 'health_below')
      await user.typeInInput('[data-testid="condition-0-value"]', '150')

      await user.clickButton('[data-testid="submit-button"]')

      assert.expectTextContent('[data-testid="condition-0-value-error"]', 'Health percentage must be between 1 and 100')
    })
  })

  describe('file upload', () => {
    it('should handle icon file upload', async () => {
      const { wrapper, user, assert } = createTestEnvironment(RelicForm)

      const mockFile = createMockFile('icon.png', 'fake-image-data', 'image/png')
      
      await user.uploadFile('[data-testid="icon-upload"]', mockFile)

      assert.expectElementExists('[data-testid="uploaded-icon-preview"]')
      assert.expectTextContent('[data-testid="file-name"]', 'icon.png')
    })

    it('should validate file type for icon upload', async () => {
      const { wrapper, user, assert } = createTestEnvironment(RelicForm)

      const invalidFile = createMockFile('document.pdf', 'fake-pdf-data', 'application/pdf')
      
      await user.uploadFile('[data-testid="icon-upload"]', invalidFile)

      assert.expectErrorMessage('Only image files are allowed')
    })

    it('should validate file size', async () => {
      const { wrapper, user, assert } = createTestEnvironment(RelicForm)

      const largeFile = createMockFile('large-icon.png', 'x'.repeat(5 * 1024 * 1024), 'image/png')
      
      await user.uploadFile('[data-testid="icon-upload"]', largeFile)

      assert.expectErrorMessage('File size must be less than 2MB')
    })

    it('should remove uploaded file', async () => {
      const { wrapper, user, assert } = createTestEnvironment(RelicForm)

      const mockFile = createMockFile('icon.png', 'fake-image-data', 'image/png')
      
      await user.uploadFile('[data-testid="icon-upload"]', mockFile)
      assert.expectElementExists('[data-testid="uploaded-icon-preview"]')

      await user.clickButton('[data-testid="remove-upload"]')
      assert.expectElementNotExists('[data-testid="uploaded-icon-preview"]')
    })
  })

  describe('form submission', () => {
    it('should submit valid form data', async () => {
      const onSubmit = vi.fn()
      const { wrapper, user } = createTestEnvironment(RelicForm, {
        props: { onSubmit }
      })

      await user.typeInInput('[data-testid="name-input"]', 'Test Relic')
      await user.typeInInput('[data-testid="description-input"]', 'Test description')
      await user.selectOption('[data-testid="category-select"]', 'Attack')
      await user.selectOption('[data-testid="rarity-select"]', 'common')
      await user.typeInInput('[data-testid="difficulty-input"]', '5')

      await user.clickButton('[data-testid="submit-button"]')

      expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Test Relic',
        description: 'Test description',
        category: 'Attack',
        rarity: 'common',
        obtainmentDifficulty: 5
      }))
    })

    it('should include effects in submission', async () => {
      const onSubmit = vi.fn()
      const { wrapper, user } = createTestEnvironment(RelicForm, {
        props: { onSubmit }
      })

      // Fill basic fields
      await user.typeInInput('[data-testid="name-input"]', 'Test Relic')
      await user.typeInInput('[data-testid="description-input"]', 'Test description')
      await user.selectOption('[data-testid="category-select"]', 'Attack')

      // Add effect
      await user.clickButton('[data-testid="add-effect"]')
      await user.typeInInput('[data-testid="effect-0-name"]', 'Attack Boost')
      await user.typeInInput('[data-testid="effect-0-description"]', 'Increases damage')
      await user.selectOption('[data-testid="effect-0-type"]', 'attack_multiplier')
      await user.typeInInput('[data-testid="effect-0-value"]', '1.5')

      await user.clickButton('[data-testid="submit-button"]')

      expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
        effects: [expect.objectContaining({
          name: 'Attack Boost',
          description: 'Increases damage',
          type: 'attack_multiplier',
          value: 1.5
        })]
      }))
    })

    it('should show loading state during submission', async () => {
      const onSubmit = vi.fn(() => new Promise(resolve => setTimeout(resolve, 100)))
      const { wrapper, user, assert } = createTestEnvironment(RelicForm, {
        props: { onSubmit }
      })

      await user.typeInInput('[data-testid="name-input"]', 'Test Relic')
      await user.selectOption('[data-testid="category-select"]', 'Attack')

      const submitPromise = user.clickButton('[data-testid="submit-button"]')

      assert.expectLoadingState(true)
      assert.expectTextContent('[data-testid="submit-button"]', 'Saving...')

      await submitPromise
    })

    it('should handle submission errors', async () => {
      const onSubmit = vi.fn().mockRejectedValue(new Error('Save failed'))
      const { wrapper, user, assert } = createTestEnvironment(RelicForm, {
        props: { onSubmit }
      })

      await user.typeInInput('[data-testid="name-input"]', 'Test Relic')
      await user.selectOption('[data-testid="category-select"]', 'Attack')

      await user.clickButton('[data-testid="submit-button"]')

      assert.expectErrorMessage('Save failed')
      assert.expectLoadingState(false)
    })
  })

  describe('form reset', () => {
    it('should reset form to initial state', async () => {
      const { wrapper, user, assert } = createTestEnvironment(RelicForm)

      await user.typeInInput('[data-testid="name-input"]', 'Test Name')
      await user.typeInInput('[data-testid="description-input"]', 'Test Description')
      await user.selectOption('[data-testid="category-select"]', 'Defense')
      await user.clickButton('[data-testid="add-effect"]')

      await user.clickButton('[data-testid="reset-button"]')

      assert.expectFormFieldValue('[data-testid="name-input"]', '')
      assert.expectFormFieldValue('[data-testid="description-input"]', '')
      
      const categorySelect = wrapper.find('[data-testid="category-select"]')
      expect((categorySelect.element as HTMLSelectElement).value).toBe('')
      
      assert.expectElementNotExists('[data-testid="effect-0"]')
    })

    it('should confirm before resetting with unsaved changes', async () => {
      const { wrapper, user, assert } = createTestEnvironment(RelicForm)

      await user.typeInInput('[data-testid="name-input"]', 'Unsaved changes')
      await user.clickButton('[data-testid="reset-button"]')

      assert.expectElementExists('[data-testid="confirm-reset-modal"]')
      assert.expectTextContent('[data-testid="reset-message"]', 'unsaved changes will be lost')
    })
  })

  describe('accessibility', () => {
    it('should have proper form labels', () => {
      const { wrapper } = createTestEnvironment(RelicForm)

      const inputs = [
        '[data-testid="name-input"]',
        '[data-testid="description-input"]',
        '[data-testid="category-select"]',
        '[data-testid="rarity-select"]',
        '[data-testid="difficulty-input"]'
      ]

      inputs.forEach(selector => {
        const input = wrapper.find(selector)
        expect(input.attributes('aria-label') || input.attributes('id')).toBeTruthy()
      })
    })

    it('should associate error messages with inputs', async () => {
      const { wrapper, user } = createTestEnvironment(RelicForm)

      await user.clickButton('[data-testid="submit-button"]')

      const nameInput = wrapper.find('[data-testid="name-input"]')
      const nameError = wrapper.find('[data-testid="name-error"]')

      expect(nameInput.attributes('aria-describedby')).toContain(nameError.attributes('id'))
      expect(nameInput.attributes('aria-invalid')).toBe('true')
    })

    it('should support keyboard navigation', async () => {
      const { wrapper } = createTestEnvironment(RelicForm)

      const nameInput = wrapper.find('[data-testid="name-input"]')
      const descriptionInput = wrapper.find('[data-testid="description-input"]')

      nameInput.element.focus()
      expect(document.activeElement).toBe(nameInput.element)

      await wrapper.trigger('keydown', { key: 'Tab' })
      expect(document.activeElement).toBe(descriptionInput.element)
    })
  })

  describe('draft saving', () => {
    it('should auto-save draft periodically', async () => {
      const { wrapper, user } = createTestEnvironment(RelicForm)

      await user.typeInInput('[data-testid="name-input"]', 'Draft Relic')
      
      // Wait for auto-save
      await new Promise(resolve => setTimeout(resolve, 1000))

      const savedDraft = JSON.parse(localStorage.getItem('relicFormDraft') || '{}')
      expect(savedDraft.name).toBe('Draft Relic')
    })

    it('should restore draft on form load', () => {
      localStorage.setItem('relicFormDraft', JSON.stringify({
        name: 'Restored Relic',
        description: 'Restored description',
        category: 'Critical'
      }))

      const { wrapper, assert } = createTestEnvironment(RelicForm)

      assert.expectFormFieldValue('[data-testid="name-input"]', 'Restored Relic')
      assert.expectFormFieldValue('[data-testid="description-input"]', 'Restored description')
    })

    it('should clear draft after successful submission', async () => {
      const onSubmit = vi.fn().mockResolvedValue({})
      const { wrapper, user } = createTestEnvironment(RelicForm, {
        props: { onSubmit }
      })

      localStorage.setItem('relicFormDraft', JSON.stringify({ name: 'Draft' }))

      await user.typeInInput('[data-testid="name-input"]', 'Final Relic')
      await user.selectOption('[data-testid="category-select"]', 'Attack')
      await user.clickButton('[data-testid="submit-button"]')

      expect(localStorage.getItem('relicFormDraft')).toBeNull()
    })
  })
})
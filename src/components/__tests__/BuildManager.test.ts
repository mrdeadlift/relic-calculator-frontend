import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import BuildManager from '../BuildManager.vue'
import {
  createTestEnvironment,
  TestDataFactory,
} from '../../test/helpers/test-utils'
import { useBuildsStore } from '../../stores/builds'
import { useRelicsStore } from '../../stores/relics'

describe('BuildManager', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('rendering', () => {
    it('should render build manager interface', () => {
      const { wrapper, assert } = createTestEnvironment(BuildManager)

      assert.expectElementExists('.build-manager')
      assert.expectElementExists('[data-testid="builds-list"]')
      assert.expectElementExists('[data-testid="create-build-button"]')
      assert.expectElementExists('[data-testid="search-builds"]')
    })

    it('should show empty state when no builds exist', () => {
      const buildsStore = useBuildsStore()
      buildsStore.builds = []

      const { wrapper, assert } = createTestEnvironment(BuildManager)

      assert.expectElementExists('[data-testid="empty-builds-state"]')
      assert.expectTextContent(
        '[data-testid="empty-message"]',
        'No builds found'
      )
      assert.expectElementExists('[data-testid="create-first-build"]')
    })

    it('should display builds list when builds exist', async () => {
      const buildsStore = useBuildsStore()
      buildsStore.builds = [
        TestDataFactory.createBuild({ name: 'Build 1', id: 'build-1' }),
        TestDataFactory.createBuild({ name: 'Build 2', id: 'build-2' }),
        TestDataFactory.createBuild({ name: 'Build 3', id: 'build-3' }),
      ]

      const { wrapper, assert } = createTestEnvironment(BuildManager)

      const buildItems = wrapper.findAll('[data-testid^="build-item-"]')
      expect(buildItems.length).toBe(3)
      assert.expectTextContent('[data-testid="build-item-build-1"]', 'Build 1')
    })
  })

  describe('build creation', () => {
    it('should open create build modal', async () => {
      const { wrapper, user, assert } = createTestEnvironment(BuildManager)

      await user.clickButton('[data-testid="create-build-button"]')

      assert.expectElementExists('[data-testid="create-build-modal"]')
      assert.expectElementExists('[data-testid="build-form"]')
    })

    it('should create new build with selected relics', async () => {
      const relicsStore = useRelicsStore()
      relicsStore.selectedRelics = ['relic-1', 'relic-2']

      const { wrapper, user, assert } = createTestEnvironment(BuildManager)

      await user.clickButton('[data-testid="create-build-button"]')
      await user.typeInInput('[data-testid="build-name-input"]', 'New Build')
      await user.typeInInput(
        '[data-testid="build-description"]',
        'Test build description'
      )
      await user.clickButton('[data-testid="save-build"]')

      const buildsStore = useBuildsStore()
      expect(buildsStore.builds).toContainEqual(
        expect.objectContaining({
          name: 'New Build',
          description: 'Test build description',
          relics: ['relic-1', 'relic-2'],
        })
      )
    })

    it('should validate build name', async () => {
      const { wrapper, user, assert } = createTestEnvironment(BuildManager)

      await user.clickButton('[data-testid="create-build-button"]')
      await user.clickButton('[data-testid="save-build"]')

      assert.expectErrorMessage('Build name is required')
    })
  })

  describe('build editing', () => {
    beforeEach(() => {
      const buildsStore = useBuildsStore()
      buildsStore.builds = [
        TestDataFactory.createBuild({
          id: 'build-1',
          name: 'Editable Build',
          description: 'Original description',
        }),
      ]
    })

    it('should open edit modal with existing data', async () => {
      const { wrapper, user, assert } = createTestEnvironment(BuildManager)

      await user.clickButton('[data-testid="edit-build-build-1"]')

      assert.expectElementExists('[data-testid="edit-build-modal"]')
      assert.expectFormFieldValue(
        '[data-testid="build-name-input"]',
        'Editable Build'
      )
      assert.expectFormFieldValue(
        '[data-testid="build-description"]',
        'Original description'
      )
    })

    it('should update build details', async () => {
      const { wrapper, user } = createTestEnvironment(BuildManager)

      await user.clickButton('[data-testid="edit-build-build-1"]')
      await user.typeInInput(
        '[data-testid="build-name-input"]',
        'Updated Build Name'
      )
      await user.typeInInput(
        '[data-testid="build-description"]',
        'Updated description'
      )
      await user.clickButton('[data-testid="save-build"]')

      const buildsStore = useBuildsStore()
      const updatedBuild = buildsStore.builds.find(b => b.id === 'build-1')
      expect(updatedBuild?.name).toBe('Updated Build Name')
      expect(updatedBuild?.description).toBe('Updated description')
    })

    it('should handle edit cancellation', async () => {
      const { wrapper, user, assert } = createTestEnvironment(BuildManager)

      await user.clickButton('[data-testid="edit-build-build-1"]')
      await user.typeInInput('[data-testid="build-name-input"]', 'Changed Name')
      await user.clickButton('[data-testid="cancel-edit"]')

      assert.expectElementNotExists('[data-testid="edit-build-modal"]')

      const buildsStore = useBuildsStore()
      const build = buildsStore.builds.find(b => b.id === 'build-1')
      expect(build?.name).toBe('Editable Build') // Unchanged
    })
  })

  describe('build deletion', () => {
    beforeEach(() => {
      const buildsStore = useBuildsStore()
      buildsStore.builds = [
        TestDataFactory.createBuild({ id: 'build-1', name: 'Build to Delete' }),
        TestDataFactory.createBuild({ id: 'build-2', name: 'Build to Keep' }),
      ]
    })

    it('should show confirmation dialog', async () => {
      const { wrapper, user, assert } = createTestEnvironment(BuildManager)

      await user.clickButton('[data-testid="delete-build-build-1"]')

      assert.expectElementExists('[data-testid="confirm-delete-modal"]')
      assert.expectTextContent(
        '[data-testid="delete-message"]',
        'Build to Delete'
      )
    })

    it('should delete build after confirmation', async () => {
      const { wrapper, user } = createTestEnvironment(BuildManager)

      await user.clickButton('[data-testid="delete-build-build-1"]')
      await user.clickButton('[data-testid="confirm-delete"]')

      const buildsStore = useBuildsStore()
      expect(buildsStore.builds.find(b => b.id === 'build-1')).toBeUndefined()
      expect(buildsStore.builds.find(b => b.id === 'build-2')).toBeDefined()
    })

    it('should cancel deletion', async () => {
      const { wrapper, user, assert } = createTestEnvironment(BuildManager)

      await user.clickButton('[data-testid="delete-build-build-1"]')
      await user.clickButton('[data-testid="cancel-delete"]')

      assert.expectElementNotExists('[data-testid="confirm-delete-modal"]')

      const buildsStore = useBuildsStore()
      expect(buildsStore.builds.find(b => b.id === 'build-1')).toBeDefined()
    })
  })

  describe('build search and filtering', () => {
    beforeEach(() => {
      const buildsStore = useBuildsStore()
      buildsStore.builds = [
        TestDataFactory.createBuild({
          name: 'Attack Build',
          combatStyle: 'melee',
        }),
        TestDataFactory.createBuild({
          name: 'Defense Build',
          combatStyle: 'ranged',
        }),
        TestDataFactory.createBuild({
          name: 'Critical Build',
          combatStyle: 'melee',
        }),
        TestDataFactory.createBuild({
          name: 'Hybrid Build',
          combatStyle: 'hybrid',
        }),
      ]
    })

    it('should filter builds by search term', async () => {
      const { wrapper, user } = createTestEnvironment(BuildManager)

      await user.typeInInput('[data-testid="search-builds"]', 'attack')

      const visibleBuilds = wrapper.findAll(
        '[data-testid^="build-item-"]:not(.hidden)'
      )
      expect(visibleBuilds.length).toBe(1)
    })

    it('should filter by combat style', async () => {
      const { wrapper, user } = createTestEnvironment(BuildManager)

      await user.selectOption('[data-testid="combat-style-filter"]', 'melee')

      const visibleBuilds = wrapper.findAll(
        '[data-testid^="build-item-"]:not(.hidden)'
      )
      expect(visibleBuilds.length).toBe(2) // Attack Build and Critical Build
    })

    it('should combine search and filter', async () => {
      const { wrapper, user } = createTestEnvironment(BuildManager)

      await user.typeInInput('[data-testid="search-builds"]', 'build')
      await user.selectOption('[data-testid="combat-style-filter"]', 'ranged')

      const visibleBuilds = wrapper.findAll(
        '[data-testid^="build-item-"]:not(.hidden)'
      )
      expect(visibleBuilds.length).toBe(1) // Only Defense Build
    })

    it('should clear filters', async () => {
      const { wrapper, user } = createTestEnvironment(BuildManager)

      await user.typeInInput('[data-testid="search-builds"]', 'attack')
      await user.selectOption('[data-testid="combat-style-filter"]', 'melee')
      await user.clickButton('[data-testid="clear-filters"]')

      const searchInput = wrapper.find('[data-testid="search-builds"]')
      const styleFilter = wrapper.find('[data-testid="combat-style-filter"]')

      expect((searchInput.element as HTMLInputElement).value).toBe('')
      expect((styleFilter.element as HTMLSelectElement).value).toBe('')

      const visibleBuilds = wrapper.findAll(
        '[data-testid^="build-item-"]:not(.hidden)'
      )
      expect(visibleBuilds.length).toBe(4) // All builds visible
    })
  })

  describe('build loading and selection', () => {
    beforeEach(() => {
      const buildsStore = useBuildsStore()
      buildsStore.builds = [
        TestDataFactory.createBuild({
          id: 'build-1',
          name: 'Test Build',
          relics: ['relic-1', 'relic-2', 'relic-3'],
        }),
      ]
    })

    it('should load build into calculator', async () => {
      const relicsStore = useRelicsStore()
      const { wrapper, user } = createTestEnvironment(BuildManager)

      await user.clickButton('[data-testid="load-build-build-1"]')

      expect(relicsStore.selectedRelics).toEqual([
        'relic-1',
        'relic-2',
        'relic-3',
      ])
    })

    it('should show confirmation when loading over existing selection', async () => {
      const relicsStore = useRelicsStore()
      relicsStore.selectedRelics = ['existing-relic']

      const { wrapper, user, assert } = createTestEnvironment(BuildManager)

      await user.clickButton('[data-testid="load-build-build-1"]')

      assert.expectElementExists('[data-testid="confirm-load-modal"]')
      assert.expectTextContent(
        '[data-testid="load-message"]',
        'current selection will be replaced'
      )
    })

    it('should duplicate build', async () => {
      const { wrapper, user } = createTestEnvironment(BuildManager)

      await user.clickButton('[data-testid="duplicate-build-build-1"]')

      const buildsStore = useBuildsStore()
      expect(buildsStore.builds.length).toBe(2)

      const duplicatedBuild = buildsStore.builds.find(
        b => b.name === 'Test Build (Copy)'
      )
      expect(duplicatedBuild).toBeDefined()
      expect(duplicatedBuild?.relics).toEqual(['relic-1', 'relic-2', 'relic-3'])
    })
  })

  describe('build sharing', () => {
    beforeEach(() => {
      const buildsStore = useBuildsStore()
      buildsStore.builds = [
        TestDataFactory.createBuild({
          id: 'build-1',
          name: 'Shareable Build',
          isPublic: false,
        }),
      ]
    })

    it('should toggle build privacy', async () => {
      const { wrapper, user } = createTestEnvironment(BuildManager)

      await user.clickButton('[data-testid="toggle-privacy-build-1"]')

      const buildsStore = useBuildsStore()
      const build = buildsStore.builds.find(b => b.id === 'build-1')
      expect(build?.isPublic).toBe(true)
    })

    it('should generate share link for public builds', async () => {
      const buildsStore = useBuildsStore()
      const build = buildsStore.builds.find(b => b.id === 'build-1')!
      build.isPublic = true

      const { wrapper, user, assert } = createTestEnvironment(BuildManager)

      await user.clickButton('[data-testid="share-build-build-1"]')

      assert.expectElementExists('[data-testid="share-modal"]')
      assert.expectElementExists('[data-testid="share-link"]')

      const shareLink = wrapper.find('[data-testid="share-link"]')
      expect(shareLink.attributes('value')).toContain('build-1')
    })

    it('should copy share link to clipboard', async () => {
      const buildsStore = useBuildsStore()
      const build = buildsStore.builds.find(b => b.id === 'build-1')!
      build.isPublic = true

      // Mock clipboard API
      Object.assign(navigator, {
        clipboard: {
          writeText: vi.fn().mockResolvedValue(undefined),
        },
      })

      const { wrapper, user, assert } = createTestEnvironment(BuildManager)

      await user.clickButton('[data-testid="share-build-build-1"]')
      await user.clickButton('[data-testid="copy-link"]')

      expect(navigator.clipboard.writeText).toHaveBeenCalled()
      assert.expectTextContent(
        '[data-testid="copy-success"]',
        'Link copied to clipboard'
      )
    })
  })

  describe('build export/import', () => {
    beforeEach(() => {
      const buildsStore = useBuildsStore()
      buildsStore.builds = [
        TestDataFactory.createBuild({ id: 'build-1', name: 'Export Build' }),
      ]
    })

    it('should export build as JSON', async () => {
      const { wrapper, user } = createTestEnvironment(BuildManager)

      const downloadSpy = vi.fn()
      window.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
      HTMLAnchorElement.prototype.click = downloadSpy

      await user.clickButton('[data-testid="export-build-build-1"]')
      await user.clickButton('[data-testid="export-json"]')

      expect(downloadSpy).toHaveBeenCalled()
    })

    it('should import builds from file', async () => {
      const { wrapper, user, assert } = createTestEnvironment(BuildManager)

      const importData = JSON.stringify([
        TestDataFactory.createBuild({ name: 'Imported Build' }),
      ])
      const mockFile = new File([importData], 'builds.json', {
        type: 'application/json',
      })

      await user.clickButton('[data-testid="import-builds"]')
      await user.uploadFile('[data-testid="import-file"]', mockFile)
      await user.clickButton('[data-testid="confirm-import"]')

      const buildsStore = useBuildsStore()
      expect(buildsStore.builds.some(b => b.name === 'Imported Build')).toBe(
        true
      )
    })

    it('should validate import file format', async () => {
      const { wrapper, user, assert } = createTestEnvironment(BuildManager)

      const invalidData = 'invalid json'
      const mockFile = new File([invalidData], 'invalid.json', {
        type: 'application/json',
      })

      await user.clickButton('[data-testid="import-builds"]')
      await user.uploadFile('[data-testid="import-file"]', mockFile)

      assert.expectErrorMessage('Invalid file format')
    })
  })

  describe('sorting and pagination', () => {
    beforeEach(() => {
      const buildsStore = useBuildsStore()
      const builds = Array.from({ length: 25 }, (_, i) =>
        TestDataFactory.createBuild({
          name: `Build ${i + 1}`,
          createdAt: new Date(2023, 0, i + 1),
        })
      )
      buildsStore.builds = builds
    })

    it('should sort builds by name', async () => {
      const { wrapper, user } = createTestEnvironment(BuildManager)

      await user.selectOption('[data-testid="sort-by"]', 'name')

      const firstBuild = wrapper.find(
        '[data-testid^="build-item-"]:first-child'
      )
      expect(firstBuild.text()).toContain('Build 1')
    })

    it('should sort builds by date', async () => {
      const { wrapper, user } = createTestEnvironment(BuildManager)

      await user.selectOption('[data-testid="sort-by"]', 'date')
      await user.selectOption('[data-testid="sort-order"]', 'desc')

      const firstBuild = wrapper.find(
        '[data-testid^="build-item-"]:first-child'
      )
      expect(firstBuild.text()).toContain('Build 25')
    })

    it('should paginate builds list', async () => {
      const { wrapper, user, assert } = createTestEnvironment(BuildManager)

      // Should show first 10 builds by default
      const visibleBuilds = wrapper.findAll('[data-testid^="build-item-"]')
      expect(visibleBuilds.length).toBe(10)

      assert.expectElementExists('[data-testid="pagination"]')
      assert.expectTextContent('[data-testid="page-info"]', '1 of 3')

      await user.clickButton('[data-testid="next-page"]')

      assert.expectTextContent('[data-testid="page-info"]', '2 of 3')
    })

    it('should change page size', async () => {
      const { wrapper, user } = createTestEnvironment(BuildManager)

      await user.selectOption('[data-testid="page-size"]', '20')

      const visibleBuilds = wrapper.findAll('[data-testid^="build-item-"]')
      expect(visibleBuilds.length).toBe(20)
    })
  })

  describe('accessibility', () => {
    it('should have proper ARIA labels', () => {
      const { wrapper } = createTestEnvironment(BuildManager)

      const searchInput = wrapper.find('[data-testid="search-builds"]')
      const createButton = wrapper.find('[data-testid="create-build-button"]')

      expect(searchInput.attributes('aria-label')).toBeTruthy()
      expect(createButton.attributes('aria-label')).toBeTruthy()
    })

    it('should support keyboard navigation', async () => {
      const buildsStore = useBuildsStore()
      buildsStore.builds = [
        TestDataFactory.createBuild({ id: 'build-1' }),
        TestDataFactory.createBuild({ id: 'build-2' }),
      ]

      const { wrapper } = createTestEnvironment(BuildManager)

      const firstBuild = wrapper.find('[data-testid="build-item-build-1"]')
      const secondBuild = wrapper.find('[data-testid="build-item-build-2"]')

      firstBuild.element.focus()
      expect(document.activeElement).toBe(firstBuild.element)

      await wrapper.trigger('keydown', { key: 'ArrowDown' })
      expect(document.activeElement).toBe(secondBuild.element)
    })

    it('should announce actions to screen readers', async () => {
      const { wrapper, user } = createTestEnvironment(BuildManager)

      await user.clickButton('[data-testid="create-build-button"]')

      const announcement = wrapper.find('[aria-live="polite"]')
      expect(announcement.text()).toContain('Create build dialog opened')
    })
  })
})

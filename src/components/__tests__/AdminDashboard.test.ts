import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import AdminDashboard from '../AdminDashboard.vue'
import {
  createTestEnvironment,
  TestDataFactory,
} from '../../test/helpers/test-utils'
import { useRelicsStore } from '../../stores/relics'

describe('AdminDashboard', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('rendering', () => {
    it('should render admin dashboard layout', () => {
      const { wrapper, assert } = createTestEnvironment(AdminDashboard)

      assert.expectElementExists('.admin-dashboard')
      assert.expectElementExists('[data-testid="admin-sidebar"]')
      assert.expectElementExists('[data-testid="admin-content"]')
    })

    it('should show statistics overview', () => {
      const { wrapper, assert } = createTestEnvironment(AdminDashboard)

      assert.expectElementExists('[data-testid="stats-overview"]')
      assert.expectElementExists('[data-testid="total-relics"]')
      assert.expectElementExists('[data-testid="total-builds"]')
      assert.expectElementExists('[data-testid="active-users"]')
    })

    it('should render navigation menu', () => {
      const { wrapper, assert } = createTestEnvironment(AdminDashboard)

      assert.expectElementExists('[data-testid="nav-relics"]')
      assert.expectElementExists('[data-testid="nav-users"]')
      assert.expectElementExists('[data-testid="nav-analytics"]')
      assert.expectElementExists('[data-testid="nav-settings"]')
    })
  })

  describe('relic management', () => {
    beforeEach(async () => {
      const store = useRelicsStore()
      store.relics = [
        TestDataFactory.createRelic({ id: 'relic-1', name: 'Test Relic 1' }),
        TestDataFactory.createRelic({ id: 'relic-2', name: 'Test Relic 2' }),
        TestDataFactory.createRelic({ id: 'relic-3', name: 'Test Relic 3' }),
      ]
    })

    it('should display relic management section', async () => {
      const { wrapper, user, assert } = createTestEnvironment(AdminDashboard)

      await user.clickButton('[data-testid="nav-relics"]')

      assert.expectElementExists('[data-testid="relic-management"]')
      assert.expectElementExists('[data-testid="relic-table"]')
      assert.expectElementExists('[data-testid="add-relic-button"]')
    })

    it('should show relic list with actions', async () => {
      const { wrapper, user, assert } = createTestEnvironment(AdminDashboard)

      await user.clickButton('[data-testid="nav-relics"]')

      const relicRows = wrapper.findAll('[data-testid="relic-row"]')
      expect(relicRows.length).toBe(3)

      assert.expectElementExists('[data-testid="edit-relic-relic-1"]')
      assert.expectElementExists('[data-testid="delete-relic-relic-1"]')
    })

    it('should open add relic modal', async () => {
      const { wrapper, user, assert } = createTestEnvironment(AdminDashboard)

      await user.clickButton('[data-testid="nav-relics"]')
      await user.clickButton('[data-testid="add-relic-button"]')

      assert.expectElementExists('[data-testid="relic-form-modal"]')
      assert.expectElementExists('[data-testid="relic-form"]')
    })

    it('should handle relic deletion', async () => {
      const { wrapper, user, assert } = createTestEnvironment(AdminDashboard)

      await user.clickButton('[data-testid="nav-relics"]')
      await user.clickButton('[data-testid="delete-relic-relic-1"]')

      assert.expectElementExists('[data-testid="confirm-delete-modal"]')
      assert.expectTextContent('[data-testid="delete-message"]', 'Test Relic 1')

      await user.clickButton('[data-testid="confirm-delete"]')

      const store = useRelicsStore()
      expect(store.relics.find(r => r.id === 'relic-1')).toBeUndefined()
    })

    it('should handle bulk operations', async () => {
      const { wrapper, user, assert } = createTestEnvironment(AdminDashboard)

      await user.clickButton('[data-testid="nav-relics"]')

      // Select multiple relics
      await user.clickButton('[data-testid="select-relic-relic-1"]')
      await user.clickButton('[data-testid="select-relic-relic-2"]')

      assert.expectElementExists('[data-testid="bulk-actions"]')
      assert.expectTextContent('[data-testid="selected-count"]', '2 selected')

      await user.clickButton('[data-testid="bulk-delete"]')

      assert.expectElementExists('[data-testid="confirm-bulk-delete"]')
    })
  })

  describe('user management', () => {
    it('should display user management section', async () => {
      const { wrapper, user, assert } = createTestEnvironment(AdminDashboard)

      await user.clickButton('[data-testid="nav-users"]')

      assert.expectElementExists('[data-testid="user-management"]')
      assert.expectElementExists('[data-testid="user-table"]')
      assert.expectElementExists('[data-testid="user-filters"]')
    })

    it('should show user statistics', async () => {
      const { wrapper, user, assert } = createTestEnvironment(AdminDashboard)

      await user.clickButton('[data-testid="nav-users"]')

      assert.expectElementExists('[data-testid="user-stats"]')
      assert.expectElementExists('[data-testid="total-users"]')
      assert.expectElementExists('[data-testid="active-users"]')
      assert.expectElementExists('[data-testid="new-users-today"]')
    })

    it('should filter users by activity', async () => {
      const { wrapper, user, assert } = createTestEnvironment(AdminDashboard)

      await user.clickButton('[data-testid="nav-users"]')
      await user.selectOption('[data-testid="activity-filter"]', 'active')

      // Should update user list based on filter
      assert.expectElementExists('[data-testid="filtered-users"]')
    })
  })

  describe('analytics section', () => {
    it('should display analytics dashboard', async () => {
      const { wrapper, user, assert } = createTestEnvironment(AdminDashboard)

      await user.clickButton('[data-testid="nav-analytics"]')

      assert.expectElementExists('[data-testid="analytics-dashboard"]')
      assert.expectElementExists('[data-testid="usage-chart"]')
      assert.expectElementExists('[data-testid="popular-relics"]')
      assert.expectElementExists('[data-testid="performance-metrics"]')
    })

    it('should show date range picker', async () => {
      const { wrapper, user, assert } = createTestEnvironment(AdminDashboard)

      await user.clickButton('[data-testid="nav-analytics"]')

      assert.expectElementExists('[data-testid="date-range-picker"]')
      assert.expectElementExists('[data-testid="start-date"]')
      assert.expectElementExists('[data-testid="end-date"]')
    })

    it('should export analytics data', async () => {
      const { wrapper, user, assert } = createTestEnvironment(AdminDashboard)

      await user.clickButton('[data-testid="nav-analytics"]')
      await user.clickButton('[data-testid="export-analytics"]')

      assert.expectElementExists('[data-testid="export-options"]')
      assert.expectElementExists('[data-testid="export-csv"]')
      assert.expectElementExists('[data-testid="export-json"]')
    })
  })

  describe('system settings', () => {
    it('should display settings panel', async () => {
      const { wrapper, user, assert } = createTestEnvironment(AdminDashboard)

      await user.clickButton('[data-testid="nav-settings"]')

      assert.expectElementExists('[data-testid="system-settings"]')
      assert.expectElementExists('[data-testid="general-settings"]')
      assert.expectElementExists('[data-testid="security-settings"]')
      assert.expectElementExists('[data-testid="performance-settings"]')
    })

    it('should update system configuration', async () => {
      const { wrapper, user, assert } = createTestEnvironment(AdminDashboard)

      await user.clickButton('[data-testid="nav-settings"]')
      await user.typeInInput('[data-testid="max-relics-input"]', '12')
      await user.clickButton('[data-testid="save-settings"]')

      assert.expectElementExists('[data-testid="settings-saved-message"]')
    })

    it('should validate settings input', async () => {
      const { wrapper, user, assert } = createTestEnvironment(AdminDashboard)

      await user.clickButton('[data-testid="nav-settings"]')
      await user.typeInInput('[data-testid="max-relics-input"]', '-1')
      await user.clickButton('[data-testid="save-settings"]')

      assert.expectErrorMessage('Invalid value')
    })
  })

  describe('search and filtering', () => {
    it('should search across all sections', async () => {
      const { wrapper, user, assert } = createTestEnvironment(AdminDashboard)

      await user.typeInInput('[data-testid="global-search"]', 'test relic')

      assert.expectElementExists('[data-testid="search-results"]')
      assert.expectElementExists('[data-testid="search-relic-results"]')
    })

    it('should filter by date range', async () => {
      const { wrapper, user, assert } = createTestEnvironment(AdminDashboard)

      await user.typeInInput('[data-testid="date-from"]', '2023-01-01')
      await user.typeInInput('[data-testid="date-to"]', '2023-12-31')
      await user.clickButton('[data-testid="apply-date-filter"]')

      // Should update all relevant sections
      assert.expectElementExists('[data-testid="filtered-content"]')
    })
  })

  describe('real-time updates', () => {
    it('should show real-time statistics', async () => {
      const { wrapper, assert } = createTestEnvironment(AdminDashboard)

      // Mock WebSocket connection
      const mockWebSocket = {
        send: vi.fn(),
        close: vi.fn(),
        addEventListener: vi.fn(),
      }

      global.WebSocket = vi.fn(() => mockWebSocket) as any

      assert.expectElementExists('[data-testid="realtime-indicator"]')
      assert.expectElementExists('[data-testid="live-stats"]')
    })

    it('should handle WebSocket disconnection', async () => {
      const { wrapper, assert } = createTestEnvironment(AdminDashboard)

      // Simulate disconnection
      window.dispatchEvent(new Event('offline'))

      assert.expectElementExists('[data-testid="offline-indicator"]')
      assert.expectTextContent('[data-testid="connection-status"]', 'Offline')
    })
  })

  describe('permissions and security', () => {
    it('should check admin permissions', () => {
      // Mock non-admin user
      const mockUser = { role: 'user', permissions: [] }
      localStorage.setItem('currentUser', JSON.stringify(mockUser))

      const { wrapper, assert } = createTestEnvironment(AdminDashboard)

      assert.expectElementExists('[data-testid="access-denied"]')
      assert.expectTextContent(
        '[data-testid="permission-message"]',
        'Admin access required'
      )
    })

    it('should log admin actions', async () => {
      const { wrapper, user } = createTestEnvironment(AdminDashboard)

      const logSpy = vi.spyOn(console, 'log')

      await user.clickButton('[data-testid="nav-relics"]')
      await user.clickButton('[data-testid="delete-relic-relic-1"]')
      await user.clickButton('[data-testid="confirm-delete"]')

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('Admin action: delete_relic')
      )
    })
  })

  describe('performance monitoring', () => {
    it('should display system performance metrics', async () => {
      const { wrapper, user, assert } = createTestEnvironment(AdminDashboard)

      await user.clickButton('[data-testid="nav-analytics"]')

      assert.expectElementExists('[data-testid="performance-metrics"]')
      assert.expectElementExists('[data-testid="response-time"]')
      assert.expectElementExists('[data-testid="memory-usage"]')
      assert.expectElementExists('[data-testid="active-connections"]')
    })

    it('should show performance alerts', async () => {
      // Mock high response time
      const mockMetrics = {
        responseTime: 5000, // 5 seconds
        memoryUsage: 95, // 95%
        activeConnections: 1000,
      }

      const { wrapper, assert } = createTestEnvironment(AdminDashboard)

      // Simulate receiving metrics
      window.dispatchEvent(
        new CustomEvent('performance-update', {
          detail: mockMetrics,
        })
      )

      await wrapper.vm.$nextTick()

      assert.expectElementExists('[data-testid="performance-alert"]')
      assert.expectTextContent(
        '[data-testid="alert-message"]',
        'High response time detected'
      )
    })
  })

  describe('accessibility', () => {
    it('should have proper ARIA labels for navigation', () => {
      const { wrapper } = createTestEnvironment(AdminDashboard)

      const navItems = wrapper.findAll('[data-testid^="nav-"]')
      navItems.forEach(item => {
        expect(item.attributes('aria-label')).toBeTruthy()
        expect(item.attributes('role')).toBe('button')
      })
    })

    it('should support keyboard navigation', async () => {
      const { wrapper } = createTestEnvironment(AdminDashboard)

      const firstNavItem = wrapper.find('[data-testid="nav-relics"]')
      firstNavItem.element.focus()

      await wrapper.trigger('keydown', { key: 'ArrowDown' })

      const secondNavItem = wrapper.find('[data-testid="nav-users"]')
      expect(document.activeElement).toBe(secondNavItem.element)
    })

    it('should announce section changes to screen readers', async () => {
      const { wrapper, user } = createTestEnvironment(AdminDashboard)

      await user.clickButton('[data-testid="nav-users"]')

      const announcement = wrapper.find('[aria-live="polite"]')
      expect(announcement.text()).toContain('User management section loaded')
    })
  })
})

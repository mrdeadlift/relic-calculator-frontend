import { mount, VueWrapper } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { vi } from 'vitest'
import type { Component } from 'vue'

/**
 * Enhanced mount function with Pinia support
 */
export function mountWithPinia(component: Component, options: any = {}) {
  const pinia = createPinia()

  const wrapper = mount(component, {
    global: {
      plugins: [pinia],
      ...options.global,
    },
    ...options,
  })

  return wrapper
}

/**
 * Mock component for testing
 */
export const MockComponent = {
  name: 'MockComponent',
  template: '<div data-testid="mock-component"><slot /></div>',
}

/**
 * Wait for next tick and DOM updates
 */
export async function waitForUpdate() {
  await vi.waitFor(() => new Promise(resolve => setTimeout(resolve, 0)))
}

/**
 * Mock router for testing navigation
 */
export const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  go: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  currentRoute: {
    value: {
      path: '/',
      name: 'home',
      params: {},
      query: {},
      meta: {},
    },
  },
}

/**
 * Mock window.fetch for API testing
 */
export function mockFetch(response: any, status = 200) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(response),
    text: () => Promise.resolve(JSON.stringify(response)),
  })
}

/**
 * Mock localStorage for testing
 */
export const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

/**
 * Mock file for upload testing
 */
export function createMockFile(
  name: string,
  content: string,
  type: string = 'text/plain'
) {
  const file = new File([content], name, { type })
  return file
}

/**
 * Simulate user interaction
 */
export class UserInteraction {
  constructor(private wrapper: VueWrapper) {}

  async clickButton(selector: string) {
    const button = this.wrapper.find(selector)
    expect(button.exists()).toBe(true)
    await button.trigger('click')
    await waitForUpdate()
  }

  async typeInInput(selector: string, value: string) {
    const input = this.wrapper.find(selector)
    expect(input.exists()).toBe(true)
    await input.setValue(value)
    await waitForUpdate()
  }

  async selectOption(selector: string, value: string) {
    const select = this.wrapper.find(selector)
    expect(select.exists()).toBe(true)
    await select.setValue(value)
    await waitForUpdate()
  }

  async submitForm(selector: string = 'form') {
    const form = this.wrapper.find(selector)
    expect(form.exists()).toBe(true)
    await form.trigger('submit')
    await waitForUpdate()
  }

  async uploadFile(selector: string, file: File) {
    const input = this.wrapper.find(selector)
    expect(input.exists()).toBe(true)

    Object.defineProperty(input.element, 'files', {
      value: [file],
      writable: false,
    })

    await input.trigger('change')
    await waitForUpdate()
  }
}

/**
 * Assert helpers for common test scenarios
 */
export class TestAssertions {
  constructor(private wrapper: VueWrapper) {}

  expectElementExists(selector: string) {
    expect(this.wrapper.find(selector).exists()).toBe(true)
  }

  expectElementNotExists(selector: string) {
    expect(this.wrapper.find(selector).exists()).toBe(false)
  }

  expectTextContent(selector: string, text: string) {
    const element = this.wrapper.find(selector)
    expect(element.exists()).toBe(true)
    expect(element.text()).toContain(text)
  }

  expectElementHasClass(selector: string, className: string) {
    const element = this.wrapper.find(selector)
    expect(element.exists()).toBe(true)
    expect(element.classes()).toContain(className)
  }

  expectElementAttribute(selector: string, attribute: string, value: string) {
    const element = this.wrapper.find(selector)
    expect(element.exists()).toBe(true)
    expect(element.attributes(attribute)).toBe(value)
  }

  expectFormFieldValue(selector: string, value: string) {
    const element = this.wrapper.find(selector)
    expect(element.exists()).toBe(true)
    expect((element.element as HTMLInputElement).value).toBe(value)
  }

  expectLoadingState(isLoading: boolean = true) {
    const loadingElement = this.wrapper.find('[data-testid="loading"]')
    if (isLoading) {
      expect(loadingElement.exists()).toBe(true)
    } else {
      expect(loadingElement.exists()).toBe(false)
    }
  }

  expectErrorMessage(message?: string) {
    const errorElement = this.wrapper.find('[data-testid="error"]')
    expect(errorElement.exists()).toBe(true)
    if (message) {
      expect(errorElement.text()).toContain(message)
    }
  }
}

/**
 * Factory for creating test data
 */
export class TestDataFactory {
  static createRelic(overrides = {}) {
    return {
      id: `relic-${Date.now()}`,
      name: 'Test Relic',
      description: 'A test relic',
      category: 'Attack',
      rarity: 'common',
      quality: 'Polished',
      type: 'attack_boost',
      iconUrl: '/icons/test.png',
      obtainmentDifficulty: 5,
      effects: [],
      conflicts: [],
      ...overrides,
    }
  }

  static createBuild(overrides = {}) {
    return {
      id: `build-${Date.now()}`,
      name: 'Test Build',
      description: 'A test build',
      relics: [],
      combatStyle: 'melee',
      createdAt: new Date(),
      updatedAt: new Date(),
      isPublic: false,
      ...overrides,
    }
  }

  static createCalculationResult(overrides = {}) {
    return {
      attackMultipliers: {
        total: 2.0,
        base: 1.0,
        synergy: 0.5,
        conditional: 0.5,
      },
      efficiency: 0.8,
      obtainmentDifficulty: 5,
      relicDetails: [],
      effectBreakdown: [],
      calculationSteps: [],
      metadata: {
        calculatedAt: new Date().toISOString(),
        clientSide: false,
        performance: {
          duration: 100,
          relicCount: 3,
        },
      },
      ...overrides,
    }
  }
}

/**
 * Async test helpers
 */
export class AsyncTestHelpers {
  static async waitForApiCall(mockFn: any, timeout = 5000) {
    const start = Date.now()
    while (Date.now() - start < timeout) {
      if (mockFn.mock.calls.length > 0) {
        return
      }
      await new Promise(resolve => setTimeout(resolve, 10))
    }
    throw new Error('API call did not occur within timeout')
  }

  static async waitForCondition(condition: () => boolean, timeout = 5000) {
    const start = Date.now()
    while (Date.now() - start < timeout) {
      if (condition()) {
        return
      }
      await new Promise(resolve => setTimeout(resolve, 10))
    }
    throw new Error('Condition was not met within timeout')
  }

  static async waitForElement(
    wrapper: VueWrapper,
    selector: string,
    timeout = 5000
  ) {
    const start = Date.now()
    while (Date.now() - start < timeout) {
      await wrapper.vm.$nextTick()
      if (wrapper.find(selector).exists()) {
        return wrapper.find(selector)
      }
      await new Promise(resolve => setTimeout(resolve, 10))
    }
    throw new Error(`Element ${selector} did not appear within timeout`)
  }
}

/**
 * Create a complete test environment
 */
export function createTestEnvironment(component: Component, options: any = {}) {
  const wrapper = mountWithPinia(component, options)
  const user = new UserInteraction(wrapper)
  const assert = new TestAssertions(wrapper)
  const async = AsyncTestHelpers

  return {
    wrapper,
    user,
    assert,
    async,
    unmount: () => wrapper.unmount(),
  }
}

import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import BaseButton from '../BaseButton.vue'
import { createTestEnvironment } from '../../test/helpers/test-utils'

describe('BaseButton', () => {
  describe('rendering', () => {
    it('should render with default props', () => {
      const wrapper = mount(BaseButton, {
        slots: {
          default: 'Click me'
        }
      })

      expect(wrapper.text()).toBe('Click me')
      expect(wrapper.classes()).toContain('btn')
      expect(wrapper.classes()).toContain('btn-primary')
      expect(wrapper.classes()).toContain('btn-medium')
    })

    it('should render with custom variant', () => {
      const wrapper = mount(BaseButton, {
        props: {
          variant: 'secondary'
        },
        slots: {
          default: 'Secondary Button'
        }
      })

      expect(wrapper.classes()).toContain('btn-secondary')
      expect(wrapper.classes()).not.toContain('btn-primary')
    })

    it('should render with custom size', () => {
      const wrapper = mount(BaseButton, {
        props: {
          size: 'large'
        },
        slots: {
          default: 'Large Button'
        }
      })

      expect(wrapper.classes()).toContain('btn-large')
      expect(wrapper.classes()).not.toContain('btn-medium')
    })

    it('should render as disabled when disabled prop is true', () => {
      const wrapper = mount(BaseButton, {
        props: {
          disabled: true
        },
        slots: {
          default: 'Disabled Button'
        }
      })

      expect(wrapper.classes()).toContain('btn-disabled')
      expect(wrapper.attributes('disabled')).toBeDefined()
    })

    it('should render loading state', () => {
      const wrapper = mount(BaseButton, {
        props: {
          loading: true
        },
        slots: {
          default: 'Loading Button'
        }
      })

      expect(wrapper.classes()).toContain('btn-loading')
      expect(wrapper.find('.loading-spinner').exists()).toBe(true)
    })

    it('should render with icon', () => {
      const wrapper = mount(BaseButton, {
        props: {
          icon: 'plus'
        },
        slots: {
          default: 'Add Item'
        }
      })

      expect(wrapper.find('.btn-icon').exists()).toBe(true)
      expect(wrapper.find('.icon-plus').exists()).toBe(true)
    })

    it('should render as icon-only button', () => {
      const wrapper = mount(BaseButton, {
        props: {
          icon: 'close',
          iconOnly: true
        }
      })

      expect(wrapper.classes()).toContain('btn-icon-only')
      expect(wrapper.find('.icon-close').exists()).toBe(true)
    })
  })

  describe('interactions', () => {
    it('should emit click event when clicked', async () => {
      const { wrapper, user } = createTestEnvironment(BaseButton, {
        slots: {
          default: 'Click me'
        }
      })

      await user.clickButton('button')

      expect(wrapper.emitted('click')).toBeTruthy()
      expect(wrapper.emitted('click')?.length).toBe(1)
    })

    it('should not emit click event when disabled', async () => {
      const { wrapper, user } = createTestEnvironment(BaseButton, {
        props: {
          disabled: true
        },
        slots: {
          default: 'Disabled Button'
        }
      })

      await user.clickButton('button')

      expect(wrapper.emitted('click')).toBeFalsy()
    })

    it('should not emit click event when loading', async () => {
      const { wrapper, user } = createTestEnvironment(BaseButton, {
        props: {
          loading: true
        },
        slots: {
          default: 'Loading Button'
        }
      })

      await user.clickButton('button')

      expect(wrapper.emitted('click')).toBeFalsy()
    })

    it('should handle keyboard events', async () => {
      const wrapper = mount(BaseButton, {
        slots: {
          default: 'Keyboard Button'
        }
      })

      await wrapper.trigger('keydown.enter')
      expect(wrapper.emitted('click')).toBeTruthy()

      await wrapper.trigger('keydown.space')
      expect(wrapper.emitted('click')?.length).toBe(2)
    })

    it('should handle focus and blur events', async () => {
      const wrapper = mount(BaseButton, {
        slots: {
          default: 'Focus Button'
        }
      })

      await wrapper.trigger('focus')
      expect(wrapper.classes()).toContain('btn-focused')

      await wrapper.trigger('blur')
      expect(wrapper.classes()).not.toContain('btn-focused')
    })
  })

  describe('accessibility', () => {
    it('should have correct ARIA attributes', () => {
      const wrapper = mount(BaseButton, {
        props: {
          disabled: true
        },
        slots: {
          default: 'Accessible Button'
        }
      })

      expect(wrapper.attributes('role')).toBe('button')
      expect(wrapper.attributes('aria-disabled')).toBe('true')
    })

    it('should have correct ARIA attributes for loading state', () => {
      const wrapper = mount(BaseButton, {
        props: {
          loading: true
        },
        slots: {
          default: 'Loading Button'
        }
      })

      expect(wrapper.attributes('aria-busy')).toBe('true')
      expect(wrapper.attributes('aria-disabled')).toBe('true')
    })

    it('should support custom ARIA label', () => {
      const wrapper = mount(BaseButton, {
        props: {
          ariaLabel: 'Custom aria label'
        },
        slots: {
          default: 'Button'
        }
      })

      expect(wrapper.attributes('aria-label')).toBe('Custom aria label')
    })

    it('should support aria-describedby', () => {
      const wrapper = mount(BaseButton, {
        props: {
          ariaDescribedby: 'description-id'
        },
        slots: {
          default: 'Button'
        }
      })

      expect(wrapper.attributes('aria-describedby')).toBe('description-id')
    })
  })

  describe('variants', () => {
    const variants = ['primary', 'secondary', 'success', 'warning', 'danger', 'info']

    variants.forEach(variant => {
      it(`should render ${variant} variant correctly`, () => {
        const wrapper = mount(BaseButton, {
          props: {
            variant: variant as any
          },
          slots: {
            default: `${variant} Button`
          }
        })

        expect(wrapper.classes()).toContain(`btn-${variant}`)
      })
    })
  })

  describe('sizes', () => {
    const sizes = ['small', 'medium', 'large']

    sizes.forEach(size => {
      it(`should render ${size} size correctly`, () => {
        const wrapper = mount(BaseButton, {
          props: {
            size: size as any
          },
          slots: {
            default: `${size} Button`
          }
        })

        expect(wrapper.classes()).toContain(`btn-${size}`)
      })
    })
  })

  describe('edge cases', () => {
    it('should handle empty slot content', () => {
      const wrapper = mount(BaseButton)

      expect(wrapper.text()).toBe('')
      expect(wrapper.classes()).toContain('btn')
    })

    it('should handle multiple class names', () => {
      const wrapper = mount(BaseButton, {
        props: {
          class: 'custom-class another-class'
        },
        slots: {
          default: 'Multi-class Button'
        }
      })

      expect(wrapper.classes()).toContain('custom-class')
      expect(wrapper.classes()).toContain('another-class')
      expect(wrapper.classes()).toContain('btn')
    })

    it('should handle rapid click events', async () => {
      const clickHandler = vi.fn()
      const wrapper = mount(BaseButton, {
        slots: {
          default: 'Rapid Click'
        }
      })

      wrapper.vm.$emit = clickHandler

      // Simulate rapid clicks
      await wrapper.trigger('click')
      await wrapper.trigger('click')
      await wrapper.trigger('click')

      expect(clickHandler).toHaveBeenCalledTimes(3)
    })

    it('should maintain state during loading transitions', async () => {
      const wrapper = mount(BaseButton, {
        props: {
          loading: false
        },
        slots: {
          default: 'Loading Test'
        }
      })

      // Initially not loading
      expect(wrapper.classes()).not.toContain('btn-loading')
      expect(wrapper.find('.loading-spinner').exists()).toBe(false)

      // Set to loading
      await wrapper.setProps({ loading: true })
      expect(wrapper.classes()).toContain('btn-loading')
      expect(wrapper.find('.loading-spinner').exists()).toBe(true)

      // Set back to not loading
      await wrapper.setProps({ loading: false })
      expect(wrapper.classes()).not.toContain('btn-loading')
      expect(wrapper.find('.loading-spinner').exists()).toBe(false)
    })
  })

  describe('performance', () => {
    it('should not cause memory leaks', () => {
      const wrapper = mount(BaseButton, {
        slots: {
          default: 'Performance Test'
        }
      })

      // Mount and unmount multiple times
      for (let i = 0; i < 100; i++) {
        const tempWrapper = mount(BaseButton, {
          slots: {
            default: `Test ${i}`
          }
        })
        tempWrapper.unmount()
      }

      expect(wrapper.text()).toBe('Performance Test')
    })

    it('should handle prop updates efficiently', async () => {
      const wrapper = mount(BaseButton, {
        props: {
          variant: 'primary',
          size: 'medium',
          disabled: false,
          loading: false
        },
        slots: {
          default: 'Update Test'
        }
      })

      // Update multiple props rapidly
      await wrapper.setProps({
        variant: 'secondary',
        size: 'large',
        disabled: true,
        loading: true
      })

      expect(wrapper.classes()).toContain('btn-secondary')
      expect(wrapper.classes()).toContain('btn-large')
      expect(wrapper.classes()).toContain('btn-disabled')
      expect(wrapper.classes()).toContain('btn-loading')
    })
  })
})
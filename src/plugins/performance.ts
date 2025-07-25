import type { App } from 'vue'
import { usePerformanceMonitor } from '../composables/usePerformanceMonitor'

interface PerformancePluginOptions {
  enableMonitoring?: boolean
  enableVirtualScrolling?: boolean
  enableImageLazyLoading?: boolean
  memoryThreshold?: number
  fpsThreshold?: number
}

export default {
  install(app: App, options: PerformancePluginOptions = {}) {
    const {
      enableMonitoring = true,
      enableVirtualScrolling = true,
      enableImageLazyLoading = true,
      memoryThreshold = 80,
      fpsThreshold = 30
    } = options

    // Global performance monitoring
    if (enableMonitoring) {
      const { metrics, getPerformanceReport, startMonitoring } = usePerformanceMonitor()
      
      app.config.globalProperties.$performance = {
        metrics,
        getReport: getPerformanceReport,
        start: startMonitoring
      }

      // Auto-start monitoring
      startMonitoring()

      // Setup performance warnings
      const checkPerformance = () => {
        if (metrics.value.memoryUsage > memoryThreshold) {
          console.warn(`Memory usage is high: ${metrics.value.memoryUsage}%`)
        }
        
        if (metrics.value.fps < fpsThreshold) {
          console.warn(`FPS is low: ${metrics.value.fps}`)
        }
      }

      setInterval(checkPerformance, 10000) // Check every 10 seconds
    }

    // Virtual scrolling directive
    if (enableVirtualScrolling) {
      app.directive('virtual-scroll', {
        mounted(el, binding) {
          const { itemHeight, visibleCount } = binding.value
          el.style.height = `${itemHeight * visibleCount}px`
          el.style.overflowY = 'auto'
          
          // Add virtual scrolling logic
          let startIndex = 0
          const endIndex = visibleCount
          
          const updateVisibleItems = () => {
            const scrollTop = el.scrollTop
            startIndex = Math.floor(scrollTop / itemHeight)
            
            // Update visible items
            const items = el.querySelectorAll('[data-virtual-item]')
            items.forEach((item: Element, index: number) => {
              const itemIndex = startIndex + index
              const top = itemIndex * itemHeight
              ;(item as HTMLElement).style.transform = `translateY(${top}px)`
              ;(item as HTMLElement).style.display = 
                itemIndex >= startIndex && itemIndex < startIndex + visibleCount ? 'block' : 'none'
            })
          }
          
          el.addEventListener('scroll', updateVisibleItems, { passive: true })
        }
      })
    }

    // Lazy image loading directive
    if (enableImageLazyLoading) {
      app.directive('lazy', {
        mounted(el, binding) {
          const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
              if (entry.isIntersecting) {
                const img = entry.target as HTMLImageElement
                img.src = binding.value
                img.classList.remove('lazy-loading')
                img.classList.add('lazy-loaded')
                observer.unobserve(img)
              }
            })
          }, {
            rootMargin: '50px'
          })

          el.classList.add('lazy-loading')
          observer.observe(el)
        }
      })
    }

    // Performance measurement directive
    app.directive('perf', {
      mounted(el, binding) {
        const measurePerformance = () => {
          const start = performance.now()
          
          return () => {
            const end = performance.now()
            const duration = end - start
            
            if (binding.value && typeof binding.value === 'function') {
              binding.value(duration)
            }
            
            if (duration > 16) { // More than one frame
              console.warn(`Slow operation detected: ${duration}ms`, el)
            }
          }
        }

        el._perfMeasure = measurePerformance()
      },
      
      updated(el) {
        if (el._perfMeasure) {
          el._perfMeasure()
        }
      }
    })

    // Memory leak detection
    if (process.env.NODE_ENV === 'development') {
      let componentCount = 0
      const componentInstances = new WeakSet()

      app.mixin({
        beforeCreate() {
          componentCount++
          componentInstances.add(this)
        },
        
        beforeUnmount() {
          componentCount--
        }
      })

      // Check for memory leaks periodically
      setInterval(() => {
        if (componentCount > 100) {
          console.warn(`High component count detected: ${componentCount}`)
        }
      }, 30000)
    }
  }
}
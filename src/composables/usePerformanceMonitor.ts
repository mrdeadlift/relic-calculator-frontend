import { ref, onMounted, onUnmounted } from 'vue'

interface PerformanceMetrics {
  fps: number
  memoryUsage: number
  loadTime: number
  renderTime: number
  apiResponseTime: number
}

export function usePerformanceMonitor() {
  const metrics = ref<PerformanceMetrics>({
    fps: 0,
    memoryUsage: 0,
    loadTime: 0,
    renderTime: 0,
    apiResponseTime: 0,
  })

  const isMonitoring = ref(false)
  let animationId: number | null = null
  let frameCount = 0
  let lastTime = performance.now()

  // FPS monitoring
  const measureFPS = () => {
    frameCount++
    const currentTime = performance.now()

    if (currentTime - lastTime >= 1000) {
      metrics.value.fps = Math.round(
        (frameCount * 1000) / (currentTime - lastTime)
      )
      frameCount = 0
      lastTime = currentTime
    }

    if (isMonitoring.value) {
      animationId = requestAnimationFrame(measureFPS)
    }
  }

  // Memory usage monitoring
  const measureMemoryUsage = () => {
    if ('memory' in performance) {
      const memory = (performance as any).memory
      metrics.value.memoryUsage = Math.round(
        (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
      )
    }
  }

  // Page load time
  const measureLoadTime = () => {
    const navigation = performance.getEntriesByType(
      'navigation'
    )[0] as PerformanceNavigationTiming
    if (navigation) {
      metrics.value.loadTime = Math.round(
        navigation.loadEventEnd - navigation.navigationStart
      )
    }
  }

  // Render time measurement
  const measureRenderTime = (callback: () => Promise<void> | void) => {
    return async () => {
      const startTime = performance.now()
      await callback()
      const endTime = performance.now()
      metrics.value.renderTime = Math.round(endTime - startTime)
    }
  }

  // API response time tracking
  const trackApiCall = async <T>(
    apiCall: () => Promise<T>,
    identifier?: string
  ): Promise<T> => {
    const startTime = performance.now()

    try {
      const result = await apiCall()
      const endTime = performance.now()
      const responseTime = Math.round(endTime - startTime)

      metrics.value.apiResponseTime = responseTime

      // Log slow API calls
      if (responseTime > 1000) {
        console.warn(
          `Slow API call detected: ${identifier || 'Unknown'} took ${responseTime}ms`
        )
      }

      return result
    } catch (error) {
      const endTime = performance.now()
      metrics.value.apiResponseTime = Math.round(endTime - startTime)
      throw error
    }
  }

  // Performance observer for long tasks
  const observeLongTasks = () => {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver(list => {
        list.getEntries().forEach(entry => {
          if (entry.duration > 50) {
            console.warn(`Long task detected: ${entry.duration}ms`)
          }
        })
      })

      try {
        observer.observe({ entryTypes: ['longtask'] })
      } catch (e) {
        // Fallback for browsers that don't support longtask
      }

      return observer
    }
    return null
  }

  // Web Vitals measurements
  const measureWebVitals = () => {
    // Largest Contentful Paint (LCP)
    if ('PerformanceObserver' in window) {
      const lcpObserver = new PerformanceObserver(list => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1]
        console.log('LCP:', lastEntry.startTime)
      })

      try {
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })
      } catch (e) {
        // Fallback
      }

      // First Input Delay (FID)
      const fidObserver = new PerformanceObserver(list => {
        list.getEntries().forEach(entry => {
          console.log('FID:', (entry as any).processingStart - entry.startTime)
        })
      })

      try {
        fidObserver.observe({ entryTypes: ['first-input'] })
      } catch (e) {
        // Fallback
      }

      // Cumulative Layout Shift (CLS)
      const clsObserver = new PerformanceObserver(list => {
        let clsValue = 0
        list.getEntries().forEach(entry => {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value
          }
        })
        console.log('CLS:', clsValue)
      })

      try {
        clsObserver.observe({ entryTypes: ['layout-shift'] })
      } catch (e) {
        // Fallback
      }
    }
  }

  // Resource timing analysis
  const analyzeResourceTiming = () => {
    const resources = performance.getEntriesByType('resource')
    const slowResources = resources.filter(resource => resource.duration > 500)

    if (slowResources.length > 0) {
      console.warn(
        'Slow resources detected:',
        slowResources.map(r => ({
          name: r.name,
          duration: r.duration,
        }))
      )
    }

    return {
      totalResources: resources.length,
      slowResources: slowResources.length,
      averageLoadTime:
        resources.reduce((sum, r) => sum + r.duration, 0) / resources.length,
    }
  }

  const startMonitoring = () => {
    isMonitoring.value = true
    measureFPS()
    measureLoadTime()
    measureWebVitals()

    const longTaskObserver = observeLongTasks()
    const memoryInterval = setInterval(measureMemoryUsage, 5000)

    onUnmounted(() => {
      clearInterval(memoryInterval)
      longTaskObserver?.disconnect()
    })
  }

  const stopMonitoring = () => {
    isMonitoring.value = false
    if (animationId) {
      cancelAnimationFrame(animationId)
    }
  }

  const getPerformanceReport = () => {
    const resourceAnalysis = analyzeResourceTiming()

    return {
      ...metrics.value,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      resourceAnalysis,
      recommendations: generateRecommendations(),
    }
  }

  const generateRecommendations = () => {
    const recommendations: string[] = []

    if (metrics.value.fps < 30) {
      recommendations.push(
        'FPS is low. Consider optimizing animations and DOM updates.'
      )
    }

    if (metrics.value.memoryUsage > 80) {
      recommendations.push('Memory usage is high. Check for memory leaks.')
    }

    if (metrics.value.loadTime > 3000) {
      recommendations.push(
        'Page load time is slow. Consider code splitting and lazy loading.'
      )
    }

    if (metrics.value.apiResponseTime > 1000) {
      recommendations.push(
        'API response time is slow. Consider request optimization or caching.'
      )
    }

    return recommendations
  }

  onMounted(() => {
    startMonitoring()
  })

  onUnmounted(() => {
    stopMonitoring()
  })

  return {
    metrics,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    measureRenderTime,
    trackApiCall,
    getPerformanceReport,
    analyzeResourceTiming,
  }
}

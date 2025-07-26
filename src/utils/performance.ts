// Performance optimization utilities

/**
 * Optimized object deep clone using structured cloning when available
 */
export function fastDeepClone<T>(obj: T): T {
  if (typeof structuredClone !== 'undefined') {
    try {
      return structuredClone(obj)
    } catch {
      // Fallback to JSON method
    }
  }

  // JSON method (faster for plain objects)
  if (obj && typeof obj === 'object') {
    try {
      return JSON.parse(JSON.stringify(obj))
    } catch {
      // Fallback to manual deep clone
      return manualDeepClone(obj)
    }
  }

  return obj
}

function manualDeepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime()) as unknown as T
  }

  if (obj instanceof Array) {
    return obj.map(item => manualDeepClone(item)) as unknown as T
  }

  if (typeof obj === 'object') {
    const cloned = {} as { [key: string]: unknown }
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        cloned[key] = manualDeepClone((obj as Record<string, unknown>)[key])
      }
    }
    return cloned as T
  }

  return obj
}

/**
 * Optimized array operations
 */
export class FastArray<T> {
  private items: T[] = []
  private indices = new Map<T, number>()

  constructor(initialItems: T[] = []) {
    this.items = [...initialItems]
    this.rebuildIndices()
  }

  add(item: T): void {
    if (!this.indices.has(item)) {
      const index = this.items.length
      this.items.push(item)
      this.indices.set(item, index)
    }
  }

  remove(item: T): boolean {
    const index = this.indices.get(item)
    if (index !== undefined) {
      this.items.splice(index, 1)
      this.rebuildIndices()
      return true
    }
    return false
  }

  has(item: T): boolean {
    return this.indices.has(item)
  }

  indexOf(item: T): number {
    return this.indices.get(item) ?? -1
  }

  toArray(): T[] {
    return [...this.items]
  }

  get length(): number {
    return this.items.length
  }

  private rebuildIndices(): void {
    this.indices.clear()
    this.items.forEach((item, index) => {
      this.indices.set(item, index)
    })
  }
}

/**
 * Memory-efficient string operations
 */
export class StringPool {
  private pool = new Map<string, string>()

  intern(str: string): string {
    const existing = this.pool.get(str)
    if (existing) {
      return existing
    }
    this.pool.set(str, str)
    return str
  }

  clear(): void {
    this.pool.clear()
  }

  size(): number {
    return this.pool.size
  }
}

/**
 * Batch DOM operations for better performance
 */
export class DOMBatcher {
  private readOperations: (() => void)[] = []
  private writeOperations: (() => void)[] = []
  private isScheduled = false

  queueRead(operation: () => void): void {
    this.readOperations.push(operation)
    this.schedule()
  }

  queueWrite(operation: () => void): void {
    this.writeOperations.push(operation)
    this.schedule()
  }

  private schedule(): void {
    if (this.isScheduled) return

    this.isScheduled = true
    requestAnimationFrame(() => {
      this.flush()
    })
  }

  private flush(): void {
    // Execute all read operations first
    while (this.readOperations.length > 0) {
      const operation = this.readOperations.shift()!
      operation()
    }

    // Then execute all write operations
    while (this.writeOperations.length > 0) {
      const operation = this.writeOperations.shift()!
      operation()
    }

    this.isScheduled = false
  }
}

/**
 * Optimized event handling
 */
export class EventPool {
  private listeners = new Map<string, Set<EventListener>>()
  private delegatedElements = new WeakSet<Element>()

  delegate(
    element: Element,
    eventType: string,
    selector: string,
    handler: (event: Event, target: Element) => void
  ): () => void {
    if (!this.delegatedElements.has(element)) {
      this.setupDelegation(element)
      this.delegatedElements.add(element)
    }

    const wrappedHandler = (event: Event) => {
      const target = event.target as Element
      const matchedElement = target.closest(selector)
      if (matchedElement && element.contains(matchedElement)) {
        handler(event, matchedElement)
      }
    }

    const key = `${eventType}:${selector}`
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set())
    }
    this.listeners.get(key)!.add(wrappedHandler)

    element.addEventListener(eventType, wrappedHandler)

    return () => {
      element.removeEventListener(eventType, wrappedHandler)
      this.listeners.get(key)?.delete(wrappedHandler)
    }
  }

  private setupDelegation(element: Element): void {
    // Prevent event listener duplication
    if ((element as unknown as { __eventPoolSetup?: boolean }).__eventPoolSetup)
      return
    ;(element as unknown as { __eventPoolSetup: boolean }).__eventPoolSetup =
      true
  }
}

/**
 * Resource preloading utilities
 */
export class ResourcePreloader {
  private static instance: ResourcePreloader
  private preloadedImages = new Set<string>()
  private preloadedScripts = new Set<string>()

  static getInstance(): ResourcePreloader {
    if (!ResourcePreloader.instance) {
      ResourcePreloader.instance = new ResourcePreloader()
    }
    return ResourcePreloader.instance
  }

  preloadImage(src: string): Promise<HTMLImageElement> {
    if (this.preloadedImages.has(src)) {
      return Promise.resolve(document.createElement('img'))
    }

    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        this.preloadedImages.add(src)
        resolve(img)
      }
      img.onerror = reject
      img.src = src
    })
  }

  preloadScript(src: string): Promise<void> {
    if (this.preloadedScripts.has(src)) {
      return Promise.resolve()
    }

    return new Promise((resolve, reject) => {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.as = 'script'
      link.href = src
      link.onload = () => {
        this.preloadedScripts.add(src)
        resolve()
      }
      link.onerror = reject
      document.head.appendChild(link)
    })
  }

  preloadImages(sources: string[]): Promise<HTMLImageElement[]> {
    return Promise.all(sources.map(src => this.preloadImage(src)))
  }
}

/**
 * Memory usage monitoring
 */
export class MemoryMonitor {
  private static instance: MemoryMonitor
  private observers: ((usage: number) => void)[] = []
  private interval: NodeJS.Timeout | null = null

  static getInstance(): MemoryMonitor {
    if (!MemoryMonitor.instance) {
      MemoryMonitor.instance = new MemoryMonitor()
    }
    return MemoryMonitor.instance
  }

  startMonitoring(intervalMs: number = 5000): void {
    if (this.interval) return

    this.interval = setInterval(() => {
      const usage = this.getCurrentMemoryUsage()
      this.observers.forEach(observer => observer(usage))
    }, intervalMs)
  }

  stopMonitoring(): void {
    if (this.interval) {
      clearInterval(this.interval)
      this.interval = null
    }
  }

  onMemoryUsageChange(callback: (usage: number) => void): () => void {
    this.observers.push(callback)
    return () => {
      const index = this.observers.indexOf(callback)
      if (index > -1) {
        this.observers.splice(index, 1)
      }
    }
  }

  getCurrentMemoryUsage(): number {
    if ('memory' in performance) {
      const memory = (
        performance as unknown as {
          memory: { usedJSHeapSize: number; jsHeapSizeLimit: number }
        }
      ).memory
      return (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
    }
    return 0
  }

  getMemoryInfo(): {
    usedJSHeapSize: number
    totalJSHeapSize: number
    jsHeapSizeLimit: number
  } | null {
    if ('memory' in performance) {
      return (
        performance as unknown as {
          memory: {
            usedJSHeapSize: number
            totalJSHeapSize: number
            jsHeapSizeLimit: number
          }
        }
      ).memory
    }
    return null
  }
}

/**
 * Bundle size analysis utilities
 */
export function analyzeComponentSize(componentName: string): void {
  if (process.env.NODE_ENV === 'development') {
    const sizeEstimate =
      document.querySelectorAll(`[data-component="${componentName}"]`).length *
      1000
    console.log(
      `Component ${componentName} estimated size: ${sizeEstimate} bytes`
    )
  }
}

/**
 * Code splitting helpers
 */
export function lazyImport<T>(
  importFn: () => Promise<T>,
  fallback?: T
): () => Promise<T> {
  let cached: T | null = null
  let loading: Promise<T> | null = null

  return () => {
    if (cached) {
      return Promise.resolve(cached)
    }

    if (loading) {
      return loading
    }

    loading = importFn()
      .then(module => {
        cached = module
        loading = null
        return module
      })
      .catch(error => {
        loading = null
        if (fallback) {
          cached = fallback
          return fallback
        }
        throw error
      })

    return loading
  }
}

// Global performance monitoring
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // Monitor global performance
  const memoryMonitor = MemoryMonitor.getInstance()
  memoryMonitor.startMonitoring()
  memoryMonitor.onMemoryUsageChange(usage => {
    if (usage > 80) {
      console.warn(`High memory usage detected: ${usage.toFixed(2)}%`)
    }
  })
}

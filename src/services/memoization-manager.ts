import type { CalculationResult } from '../types'

// Memoization strategies
type MemoizationStrategy = 'lru' | 'ttl' | 'adaptive' | 'persistent'

// Cache entry structure
interface CacheEntry<T> {
  key: string
  value: T
  accessCount: number
  createdAt: number
  lastAccessed: number
  expiresAt?: number
  size: number
  priority: number
}

// Cache statistics
interface CacheStats {
  hits: number
  misses: number
  evictions: number
  totalSize: number
  averageAccessTime: number
  hitRate: number
}

// Memoization options
interface MemoizationOptions {
  strategy: MemoizationStrategy
  maxSize: number
  ttl?: number // Time to live in ms
  maxMemoryMB?: number
  persistToDisk?: boolean
  compressionEnabled?: boolean
}

export class MemoizationManager<T = CalculationResult> {
  private cache = new Map<string, CacheEntry<T>>()
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    evictions: 0,
    totalSize: 0,
    averageAccessTime: 0,
    hitRate: 0
  }
  
  private accessTimes: number[] = []
  private readonly options: MemoizationOptions
  private readonly maxMemoryBytes: number

  constructor(options: Partial<MemoizationOptions> = {}) {
    this.options = {
      strategy: 'adaptive',
      maxSize: 1000,
      ttl: 300000, // 5 minutes
      maxMemoryMB: 50,
      persistToDisk: false,
      compressionEnabled: true,
      ...options
    }

    this.maxMemoryBytes = (this.options.maxMemoryMB || 50) * 1024 * 1024

    // Load persistent cache if enabled
    if (this.options.persistToDisk) {
      this.loadFromPersistentStorage()
    }

    // Setup periodic cleanup
    this.setupPeriodicCleanup()
  }

  // Main memoization methods
  get(key: string): T | null {
    const startTime = performance.now()
    
    const entry = this.cache.get(key)
    if (!entry) {
      this.stats.misses++
      this.updateHitRate()
      return null
    }

    // Check TTL expiration
    if (this.isExpired(entry)) {
      this.cache.delete(key)
      this.stats.evictions++
      this.stats.misses++
      this.updateHitRate()
      return null
    }

    // Update access statistics
    entry.lastAccessed = Date.now()
    entry.accessCount++
    this.stats.hits++

    // Record access time
    const accessTime = performance.now() - startTime
    this.recordAccessTime(accessTime)
    
    this.updateHitRate()
    return entry.value
  }

  set(key: string, value: T, options?: { ttl?: number; priority?: number }): void {
    const size = this.calculateSize(value)
    const entry: CacheEntry<T> = {
      key,
      value,
      accessCount: 0,
      createdAt: Date.now(),
      lastAccessed: Date.now(),
      expiresAt: options?.ttl ? Date.now() + options.ttl : 
                  this.options.ttl ? Date.now() + this.options.ttl : undefined,
      size,
      priority: options?.priority || 1
    }

    // Check if we need to evict entries
    this.ensureCapacity(size)

    // Add the entry
    this.cache.set(key, entry)
    this.stats.totalSize += size

    // Persist if enabled
    if (this.options.persistToDisk) {
      this.saveToPersistentStorage(key, entry)
    }
  }

  delete(key: string): boolean {
    const entry = this.cache.get(key)
    if (entry) {
      this.cache.delete(key)
      this.stats.totalSize -= entry.size
      
      if (this.options.persistToDisk) {
        this.removeFromPersistentStorage(key)
      }
      
      return true
    }
    return false
  }

  clear(): void {
    this.cache.clear()
    this.stats.totalSize = 0
    this.stats.evictions = 0
    
    if (this.options.persistToDisk) {
      this.clearPersistentStorage()
    }
  }

  // Advanced memoization with function wrapping
  memoize<Args extends any[], R>(
    fn: (...args: Args) => R | Promise<R>,
    keyGenerator?: (...args: Args) => string,
    options?: { ttl?: number; priority?: number }
  ): (...args: Args) => R | Promise<R> {
    const generateKey = keyGenerator || ((...args: Args) => {
      return JSON.stringify(args)
    })

    return (...args: Args) => {
      const key = generateKey(...args)
      const cached = this.get(key) as R

      if (cached !== null) {
        return cached
      }

      const result = fn(...args)

      // Handle async functions
      if (result instanceof Promise) {
        return result.then(resolvedResult => {
          this.set(key, resolvedResult as T, options)
          return resolvedResult
        })
      } else {
        this.set(key, result as T, options)
        return result
      }
    }
  }

  // Batch operations
  getMultiple(keys: string[]): Map<string, T> {
    const results = new Map<string, T>()
    
    keys.forEach(key => {
      const value = this.get(key)
      if (value !== null) {
        results.set(key, value)
      }
    })

    return results
  }

  setMultiple(entries: Array<{ key: string; value: T; options?: { ttl?: number; priority?: number } }>): void {
    entries.forEach(({ key, value, options }) => {
      this.set(key, value, options)
    })
  }

  deleteMultiple(keys: string[]): number {
    let deletedCount = 0
    keys.forEach(key => {
      if (this.delete(key)) {
        deletedCount++
      }
    })
    return deletedCount
  }

  // Cache management
  private ensureCapacity(newEntrySize: number): void {
    // Check memory limit
    if (this.stats.totalSize + newEntrySize > this.maxMemoryBytes) {
      this.evictByMemoryPressure(newEntrySize)
    }

    // Check entry count limit
    if (this.cache.size >= this.options.maxSize) {
      this.evictByStrategy()
    }
  }

  private evictByStrategy(): void {
    switch (this.options.strategy) {
      case 'lru':
        this.evictLRU()
        break
      case 'ttl':
        this.evictExpired()
        break
      case 'adaptive':
        this.evictAdaptive()
        break
      case 'persistent':
        this.evictLowPriority()
        break
    }
  }

  private evictLRU(): void {
    let oldestEntry: CacheEntry<T> | null = null
    let oldestKey = ''

    for (const [key, entry] of this.cache.entries()) {
      if (!oldestEntry || entry.lastAccessed < oldestEntry.lastAccessed) {
        oldestEntry = entry
        oldestKey = key
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey)
      this.stats.totalSize -= oldestEntry!.size
      this.stats.evictions++
    }
  }

  private evictExpired(): void {
    const now = Date.now()
    const toDelete: string[] = []

    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        toDelete.push(key)
      }
    }

    toDelete.forEach(key => {
      const entry = this.cache.get(key)
      if (entry) {
        this.cache.delete(key)
        this.stats.totalSize -= entry.size
        this.stats.evictions++
      }
    })
  }

  private evictAdaptive(): void {
    // Adaptive strategy combines multiple factors
    const entries = Array.from(this.cache.entries())
    
    // Score each entry based on multiple factors
    const scoredEntries = entries.map(([key, entry]) => {
      const age = Date.now() - entry.createdAt
      const timeSinceAccess = Date.now() - entry.lastAccessed
      const accessFrequency = entry.accessCount / Math.max(age / 1000, 1) // per second

      // Calculate eviction score (higher = more likely to evict)
      const score = (timeSinceAccess / 1000) / Math.max(accessFrequency, 0.01) / entry.priority
      
      return { key, entry, score }
    })

    // Sort by score (highest first) and evict the worst
    scoredEntries.sort((a, b) => b.score - a.score)
    
    if (scoredEntries.length > 0) {
      const { key, entry } = scoredEntries[0]
      this.cache.delete(key)
      this.stats.totalSize -= entry.size
      this.stats.evictions++
    }
  }

  private evictLowPriority(): void {
    let lowestPriorityEntry: CacheEntry<T> | null = null
    let lowestPriorityKey = ''

    for (const [key, entry] of this.cache.entries()) {
      if (!lowestPriorityEntry || entry.priority < lowestPriorityEntry.priority) {
        lowestPriorityEntry = entry
        lowestPriorityKey = key
      }
    }

    if (lowestPriorityKey) {
      this.cache.delete(lowestPriorityKey)
      this.stats.totalSize -= lowestPriorityEntry!.size
      this.stats.evictions++
    }
  }

  private evictByMemoryPressure(neededSpace: number): void {
    const entries = Array.from(this.cache.entries())
    entries.sort(([, a], [, b]) => {
      // Sort by size/utility ratio (larger, less useful entries first)
      const utilityA = a.accessCount / Math.max(Date.now() - a.lastAccessed, 1)
      const utilityB = b.accessCount / Math.max(Date.now() - b.lastAccessed, 1)
      
      return (b.size / Math.max(utilityB, 0.01)) - (a.size / Math.max(utilityA, 0.01))
    })

    let freedSpace = 0
    for (const [key, entry] of entries) {
      if (freedSpace >= neededSpace) break
      
      this.cache.delete(key)
      this.stats.totalSize -= entry.size
      this.stats.evictions++
      freedSpace += entry.size
    }
  }

  // Utility methods
  private isExpired(entry: CacheEntry<T>): boolean {
    return entry.expiresAt ? Date.now() > entry.expiresAt : false
  }

  private calculateSize(value: T): number {
    // Estimate size in bytes
    const jsonString = JSON.stringify(value)
    return new Blob([jsonString]).size
  }

  private recordAccessTime(time: number): void {
    this.accessTimes.push(time)
    
    // Keep only recent access times
    if (this.accessTimes.length > 1000) {
      this.accessTimes = this.accessTimes.slice(-500)
    }

    // Update average
    this.stats.averageAccessTime = this.accessTimes.reduce((sum, time) => sum + time, 0) / this.accessTimes.length
  }

  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses
    this.stats.hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0
  }

  // Persistent storage methods
  private loadFromPersistentStorage(): void {
    try {
      const stored = localStorage.getItem('memoization_cache')
      if (stored) {
        const data = JSON.parse(stored)
        
        Object.entries(data).forEach(([key, entryData]) => {
          const entry = entryData as CacheEntry<T>
          
          // Check if entry is still valid
          if (!this.isExpired(entry)) {
            this.cache.set(key, entry)
            this.stats.totalSize += entry.size
          }
        })
      }
    } catch (error) {
      console.warn('Failed to load persistent cache:', error)
    }
  }

  private saveToPersistentStorage(key: string, entry: CacheEntry<T>): void {
    try {
      const stored = localStorage.getItem('memoization_cache')
      const data = stored ? JSON.parse(stored) : {}
      
      data[key] = entry
      localStorage.setItem('memoization_cache', JSON.stringify(data))
    } catch (error) {
      console.warn('Failed to save to persistent cache:', error)
    }
  }

  private removeFromPersistentStorage(key: string): void {
    try {
      const stored = localStorage.getItem('memoization_cache')
      if (stored) {
        const data = JSON.parse(stored)
        delete data[key]
        localStorage.setItem('memoization_cache', JSON.stringify(data))
      }
    } catch (error) {
      console.warn('Failed to remove from persistent cache:', error)
    }
  }

  private clearPersistentStorage(): void {
    try {
      localStorage.removeItem('memoization_cache')
    } catch (error) {
      console.warn('Failed to clear persistent cache:', error)
    }
  }

  private setupPeriodicCleanup(): void {
    // Clean up expired entries every 5 minutes
    setInterval(() => {
      this.evictExpired()
    }, 300000)

    // Full cleanup every hour
    setInterval(() => {
      this.optimizeCache()
    }, 3600000)
  }

  private optimizeCache(): void {
    // Remove expired entries
    this.evictExpired()

    // Defragment if needed
    if (this.stats.evictions > this.cache.size) {
      this.defragmentCache()
    }

    // Reset eviction counter
    this.stats.evictions = 0
  }

  private defragmentCache(): void {
    // Rebuild cache to optimize memory layout
    const entries = Array.from(this.cache.entries())
    this.cache.clear()
    
    entries.forEach(([key, entry]) => {
      this.cache.set(key, entry)
    })
  }

  // Public API for cache introspection
  getStats(): CacheStats & {
    cacheSize: number
    memoryUsageMB: number
    averageEntrySize: number
  } {
    return {
      ...this.stats,
      cacheSize: this.cache.size,
      memoryUsageMB: this.stats.totalSize / (1024 * 1024),
      averageEntrySize: this.cache.size > 0 ? this.stats.totalSize / this.cache.size : 0
    }
  }

  getEntries(): Array<{ key: string; entry: CacheEntry<T> }> {
    return Array.from(this.cache.entries()).map(([key, entry]) => ({ key, entry }))
  }

  has(key: string): boolean {
    const entry = this.cache.get(key)
    return entry ? !this.isExpired(entry) : false
  }

  size(): number {
    return this.cache.size
  }

  keys(): string[] {
    return Array.from(this.cache.keys())
  }

  // Export/Import functionality
  export(): string {
    const data = {
      options: this.options,
      stats: this.stats,
      entries: Object.fromEntries(this.cache.entries())
    }
    
    return JSON.stringify(data)
  }

  import(data: string): void {
    try {
      const parsed = JSON.parse(data)
      
      // Clear current cache
      this.clear()
      
      // Import entries
      if (parsed.entries) {
        Object.entries(parsed.entries).forEach(([key, entry]) => {
          const cacheEntry = entry as CacheEntry<T>
          if (!this.isExpired(cacheEntry)) {
            this.cache.set(key, cacheEntry)
            this.stats.totalSize += cacheEntry.size
          }
        })
      }
      
      // Import stats (optional)
      if (parsed.stats) {
        this.stats = { ...this.stats, ...parsed.stats }
      }
      
    } catch (error) {
      console.error('Failed to import cache data:', error)
      throw new Error('Invalid cache data format')
    }
  }
}

// Export specialized instances for different use cases
export const calculationMemoizer = new MemoizationManager<CalculationResult>({
  strategy: 'adaptive',
  maxSize: 500,
  ttl: 600000, // 10 minutes for calculations
  maxMemoryMB: 25,
  persistToDisk: true
})

export const searchMemoizer = new MemoizationManager<any>({
  strategy: 'lru',
  maxSize: 200,
  ttl: 300000, // 5 minutes for search results
  maxMemoryMB: 10
})

export const apiMemoizer = new MemoizationManager<any>({
  strategy: 'ttl',
  maxSize: 100,
  ttl: 180000, // 3 minutes for API responses
  maxMemoryMB: 15
})
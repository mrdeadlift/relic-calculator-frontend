import { computed, ref, watch, type ComputedRef, type Ref } from 'vue'

interface MemoizedComputedOptions {
  maxAge?: number // Cache duration in milliseconds
  maxSize?: number // Maximum cache size
  keyGenerator?: (...args: any[]) => string
}

interface CacheEntry<T> {
  value: T
  timestamp: number
  accessCount: number
}

class ComputedCache<T> {
  private cache = new Map<string, CacheEntry<T>>()
  private maxAge: number
  private maxSize: number

  constructor(maxAge: number = 60000, maxSize: number = 100) {
    this.maxAge = maxAge
    this.maxSize = maxSize
  }

  get(key: string): T | undefined {
    const entry = this.cache.get(key)
    if (!entry) return undefined

    const now = Date.now()
    if (now - entry.timestamp > this.maxAge) {
      this.cache.delete(key)
      return undefined
    }

    entry.accessCount++
    return entry.value
  }

  set(key: string, value: T): void {
    if (this.cache.size >= this.maxSize) {
      this.evictLeastRecentlyUsed()
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      accessCount: 1,
    })
  }

  clear(): void {
    this.cache.clear()
  }

  private evictLeastRecentlyUsed(): void {
    let lruKey: string | undefined
    let minAccessCount = Infinity

    for (const [key, entry] of this.cache.entries()) {
      if (entry.accessCount < minAccessCount) {
        minAccessCount = entry.accessCount
        lruKey = key
      }
    }

    if (lruKey) {
      this.cache.delete(lruKey)
    }
  }
}

export function useMemoizedComputed<T>(
  computeFn: () => T,
  dependencies: Ref<any>[],
  options: MemoizedComputedOptions = {}
): ComputedRef<T> {
  const {
    maxAge = 60000,
    maxSize = 100,
    keyGenerator = (...args) => JSON.stringify(args),
  } = options

  const cache = new ComputedCache<T>(maxAge, maxSize)
  const forceUpdate = ref(0)

  const memoizedComputed = computed(() => {
    // Force reactivity update
    forceUpdate.value

    const key = keyGenerator(...dependencies.map(dep => dep.value))
    const cached = cache.get(key)

    if (cached !== undefined) {
      return cached
    }

    const result = computeFn()
    cache.set(key, result)
    return result
  })

  // Watch dependencies for changes
  watch(
    dependencies,
    () => {
      forceUpdate.value++
    },
    { deep: true }
  )

  return memoizedComputed
}

export function useStableComputed<T>(
  computeFn: () => T,
  equalityFn?: (a: T, b: T) => boolean
): ComputedRef<T> {
  const previousValue = ref<T>()
  const hasValue = ref(false)

  const defaultEqualityFn = (a: T, b: T): boolean => {
    if (a === b) return true
    if (Array.isArray(a) && Array.isArray(b)) {
      return (
        a.length === b.length && a.every((item, index) => item === b[index])
      )
    }
    if (
      typeof a === 'object' &&
      typeof b === 'object' &&
      a !== null &&
      b !== null
    ) {
      const keysA = Object.keys(a)
      const keysB = Object.keys(b)
      return (
        keysA.length === keysB.length &&
        keysA.every(key => (a as any)[key] === (b as any)[key])
      )
    }
    return false
  }

  const equality = equalityFn || defaultEqualityFn

  return computed(() => {
    const newValue = computeFn()

    if (!hasValue.value || !equality(newValue, previousValue.value as T)) {
      previousValue.value = newValue
      hasValue.value = true
    }

    return previousValue.value as T
  })
}

export function useBatchedComputed<T>(
  computeFn: () => T,
  batchDelay: number = 16
): ComputedRef<T> {
  const result = ref<T>()
  const updateScheduled = ref(false)

  const scheduleUpdate = () => {
    if (updateScheduled.value) return

    updateScheduled.value = true
    setTimeout(() => {
      result.value = computeFn()
      updateScheduled.value = false
    }, batchDelay)
  }

  return computed(() => {
    scheduleUpdate()
    return result.value as T
  })
}

export function useAsyncComputed<T>(
  asyncComputeFn: () => Promise<T>,
  defaultValue: T,
  dependencies: Ref<any>[] = []
): {
  data: ComputedRef<T>
  loading: ComputedRef<boolean>
  error: ComputedRef<Error | null>
} {
  const data = ref<T>(defaultValue)
  const loading = ref(false)
  const error = ref<Error | null>(null)
  let currentPromise: Promise<T> | null = null

  const execute = async () => {
    loading.value = true
    error.value = null

    const promise = asyncComputeFn()
    currentPromise = promise

    try {
      const result = await promise
      // Only update if this is still the current promise
      if (currentPromise === promise) {
        data.value = result
      }
    } catch (err) {
      if (currentPromise === promise) {
        error.value = err as Error
      }
    } finally {
      if (currentPromise === promise) {
        loading.value = false
      }
    }
  }

  // Execute on dependency changes
  watch(dependencies, execute, { immediate: true })

  return {
    data: computed(() => data.value),
    loading: computed(() => loading.value),
    error: computed(() => error.value),
  }
}

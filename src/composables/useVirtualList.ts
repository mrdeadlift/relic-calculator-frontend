import { ref, computed, onMounted, onUnmounted, type Ref } from 'vue'

interface VirtualListOptions {
  itemHeight: number
  containerHeight: number
  buffer?: number
  gap?: number
}

interface VirtualListItem {
  index: number
  top: number
  bottom: number
}

export function useVirtualList<T>(
  items: Ref<T[]>,
  options: VirtualListOptions
) {
  const containerRef = ref<HTMLElement>()
  const scrollTop = ref(0)
  const { itemHeight, containerHeight, buffer = 5, gap = 0 } = options

  const totalHeight = computed(() => {
    return items.value.length * (itemHeight + gap) - gap
  })

  const visibleCount = computed(() => {
    return Math.ceil(containerHeight / (itemHeight + gap))
  })

  const startIndex = computed(() => {
    const index = Math.floor(scrollTop.value / (itemHeight + gap))
    return Math.max(0, index - buffer)
  })

  const endIndex = computed(() => {
    const index = startIndex.value + visibleCount.value + buffer * 2
    return Math.min(items.value.length - 1, index)
  })

  const visibleItems = computed(() => {
    const result: VirtualListItem[] = []
    for (let i = startIndex.value; i <= endIndex.value; i++) {
      const top = i * (itemHeight + gap)
      result.push({
        index: i,
        top,
        bottom: top + itemHeight,
      })
    }
    return result
  })

  const offsetY = computed(() => {
    return startIndex.value * (itemHeight + gap)
  })

  const handleScroll = (event: Event) => {
    const target = event.target as HTMLElement
    scrollTop.value = target.scrollTop
  }

  onMounted(() => {
    if (containerRef.value) {
      containerRef.value.addEventListener('scroll', handleScroll, {
        passive: true,
      })
    }
  })

  onUnmounted(() => {
    if (containerRef.value) {
      containerRef.value.removeEventListener('scroll', handleScroll)
    }
  })

  return {
    containerRef,
    totalHeight,
    visibleItems,
    offsetY,
    scrollTo: (index: number) => {
      if (containerRef.value) {
        const targetScrollTop = index * (itemHeight + gap)
        containerRef.value.scrollTo({
          top: targetScrollTop,
          behavior: 'smooth',
        })
      }
    },
  }
}

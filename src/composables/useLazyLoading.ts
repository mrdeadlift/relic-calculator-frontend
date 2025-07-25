import { ref, onMounted, onUnmounted, type Ref } from 'vue'

interface LazyLoadOptions {
  root?: Element | null
  rootMargin?: string
  threshold?: number | number[]
}

export function useLazyLoading(
  elementRef: Ref<Element | undefined>,
  callback: () => void,
  options: LazyLoadOptions = {}
) {
  const isVisible = ref(false)
  const hasLoaded = ref(false)
  let observer: IntersectionObserver | null = null

  const { root = null, rootMargin = '50px', threshold = 0.1 } = options

  onMounted(() => {
    if (!elementRef.value) return

    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasLoaded.value) {
            isVisible.value = true
            hasLoaded.value = true
            callback()
            observer?.disconnect()
          }
        })
      },
      {
        root,
        rootMargin,
        threshold
      }
    )

    observer.observe(elementRef.value)
  })

  onUnmounted(() => {
    observer?.disconnect()
  })

  return {
    isVisible,
    hasLoaded
  }
}

export function useImageLazyLoading() {
  const imageRef = ref<HTMLImageElement>()
  const isLoaded = ref(false)
  const isError = ref(false)
  const isLoading = ref(false)

  const loadImage = (src: string) => {
    if (!imageRef.value) return

    isLoading.value = true
    isError.value = false

    const img = new Image()
    
    img.onload = () => {
      if (imageRef.value) {
        imageRef.value.src = src
        isLoaded.value = true
        isLoading.value = false
      }
    }

    img.onerror = () => {
      isError.value = true
      isLoading.value = false
    }

    img.src = src
  }

  const { isVisible } = useLazyLoading(
    imageRef,
    () => {
      const src = imageRef.value?.dataset.src
      if (src && !isLoaded.value) {
        loadImage(src)
      }
    }
  )

  return {
    imageRef,
    isLoaded,
    isError,
    isLoading,
    isVisible
  }
}
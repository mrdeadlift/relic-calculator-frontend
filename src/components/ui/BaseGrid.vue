<template>
  <div :class="gridClasses">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  cols?: number | string
  gap?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  alignItems?: 'start' | 'center' | 'end' | 'stretch'
  justifyItems?: 'start' | 'center' | 'end' | 'stretch'
  responsive?: {
    sm?: number
    md?: number
    lg?: number
    xl?: number
  }
}

const props = withDefaults(defineProps<Props>(), {
  cols: 1,
  gap: 'md',
  alignItems: 'stretch',
  justifyItems: 'stretch',
})

const gridClasses = computed(() => {
  const classes = ['base-grid']

  // Base columns
  if (typeof props.cols === 'number') {
    classes.push(`grid-cols-${props.cols}`)
  } else {
    classes.push(props.cols)
  }

  // Gap
  classes.push(`gap-${props.gap}`)

  // Alignment
  classes.push(`items-${props.alignItems}`)
  classes.push(`justify-items-${props.justifyItems}`)

  // Responsive columns
  if (props.responsive) {
    Object.entries(props.responsive).forEach(([breakpoint, cols]) => {
      classes.push(`${breakpoint}:grid-cols-${cols}`)
    })
  }

  return classes
})
</script>

<style scoped>
.base-grid {
  display: grid;
}

/* Grid columns */
.grid-cols-1 {
  grid-template-columns: repeat(1, minmax(0, 1fr));
}
.grid-cols-2 {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
.grid-cols-3 {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}
.grid-cols-4 {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}
.grid-cols-5 {
  grid-template-columns: repeat(5, minmax(0, 1fr));
}
.grid-cols-6 {
  grid-template-columns: repeat(6, minmax(0, 1fr));
}

/* Gap sizes */
.gap-xs {
  gap: 0.5rem;
}
.gap-sm {
  gap: 0.75rem;
}
.gap-md {
  gap: 1rem;
}
.gap-lg {
  gap: 1.5rem;
}
.gap-xl {
  gap: 2rem;
}

/* Alignment */
.items-start {
  align-items: start;
}
.items-center {
  align-items: center;
}
.items-end {
  align-items: end;
}
.items-stretch {
  align-items: stretch;
}

.justify-items-start {
  justify-items: start;
}
.justify-items-center {
  justify-items: center;
}
.justify-items-end {
  justify-items: end;
}
.justify-items-stretch {
  justify-items: stretch;
}

/* Responsive breakpoints */
@media (min-width: 640px) {
  .sm\:grid-cols-1 {
    grid-template-columns: repeat(1, minmax(0, 1fr));
  }
  .sm\:grid-cols-2 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .sm\:grid-cols-3 {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  .sm\:grid-cols-4 {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
  .sm\:grid-cols-5 {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }
  .sm\:grid-cols-6 {
    grid-template-columns: repeat(6, minmax(0, 1fr));
  }
}

@media (min-width: 768px) {
  .md\:grid-cols-1 {
    grid-template-columns: repeat(1, minmax(0, 1fr));
  }
  .md\:grid-cols-2 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .md\:grid-cols-3 {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  .md\:grid-cols-4 {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
  .md\:grid-cols-5 {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }
  .md\:grid-cols-6 {
    grid-template-columns: repeat(6, minmax(0, 1fr));
  }
}

@media (min-width: 1024px) {
  .lg\:grid-cols-1 {
    grid-template-columns: repeat(1, minmax(0, 1fr));
  }
  .lg\:grid-cols-2 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .lg\:grid-cols-3 {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  .lg\:grid-cols-4 {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
  .lg\:grid-cols-5 {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }
  .lg\:grid-cols-6 {
    grid-template-columns: repeat(6, minmax(0, 1fr));
  }
}

@media (min-width: 1280px) {
  .xl\:grid-cols-1 {
    grid-template-columns: repeat(1, minmax(0, 1fr));
  }
  .xl\:grid-cols-2 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .xl\:grid-cols-3 {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  .xl\:grid-cols-4 {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
  .xl\:grid-cols-5 {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }
  .xl\:grid-cols-6 {
    grid-template-columns: repeat(6, minmax(0, 1fr));
  }
}
</style>

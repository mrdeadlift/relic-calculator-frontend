// Store exports
export { useRelicsStore } from './relics'
export { useBuildsStore } from './builds'
export { useCalculationStore } from './calculation'
export { useErrorStore } from './errors'

// Error types
export type { AppError, NetworkStatus } from './errors'

// Initialization function for all stores
export const initializeStores = async () => {
  const relicsStore = useRelicsStore()
  const buildsStore = useBuildsStore()
  const calculationStore = useCalculationStore()
  const errorStore = useErrorStore()

  // Initialize stores in order
  errorStore.initialize()
  calculationStore.initialize()

  await Promise.all([relicsStore.initialize(), buildsStore.initialize()])

  console.log('All stores initialized successfully')
}

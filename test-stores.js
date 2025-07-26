// Simple test to verify stores can be imported
import { createApp } from 'vue'
import { createPinia } from 'pinia'

console.log('Testing store imports...')

try {
  const app = createApp({})
  const pinia = createPinia()
  app.use(pinia)

  // Test store imports
  console.log('✓ Vue and Pinia setup successful')

  // Try to import stores
  import('./src/stores/relics.js')
    .then(() => {
      console.log('✓ Relics store import successful')
    })
    .catch(err => {
      console.error('✗ Relics store import failed:', err.message)
    })

  import('./src/stores/builds.js')
    .then(() => {
      console.log('✓ Builds store import successful')
    })
    .catch(err => {
      console.error('✗ Builds store import failed:', err.message)
    })

  import('./src/stores/calculation.js')
    .then(() => {
      console.log('✓ Calculation store import successful')
    })
    .catch(err => {
      console.error('✗ Calculation store import failed:', err.message)
    })
} catch (error) {
  console.error('✗ Basic setup failed:', error.message)
}

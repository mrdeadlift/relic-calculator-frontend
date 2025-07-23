<script setup lang="ts">
import { ref } from 'vue'
import RelicCalculator from './components/RelicCalculator.vue'

const appTitle = ref('Nightreign Relic Calculator')
</script>

<template>
  <div id="app">
    <header class="app-header">
      <h1>{{ appTitle }}</h1>
      <p class="subtitle">エルデンリング ナイトレインの遺物攻撃倍率計算機</p>
    </header>
    
    <main class="app-main">
      <RelicCalculator />
    </main>
    
    <footer class="app-footer">
      <p>Elden Ring Nightreign Relic Calculator - Community Tool</p>
    </footer>
  </div>
</template>

<style scoped>
#app {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  text-align: center;
}

.app-header {
  margin-bottom: 2rem;
}

.app-header h1 {
  font-size: 2.5rem;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.subtitle {
  font-size: 1.1rem;
  color: #7f8c8d;
  font-style: italic;
}

.app-main {
  margin-bottom: 2rem;
}

.app-footer {
  padding-top: 1rem;
  border-top: 1px solid #e0e0e0;
  color: #7f8c8d;
  font-size: 0.9rem;
}
</style>

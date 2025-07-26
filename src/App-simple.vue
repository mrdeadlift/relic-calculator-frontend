<template>
  <div id="app">
    <h1>ナイトレイン 遺物計算機</h1>
    <p>アプリケーションが正常に動作しています。</p>
    <button @click="testAPI">API接続テスト</button>
    <div v-if="apiStatus" :class="apiStatus.success ? 'success' : 'error'">
      {{ apiStatus.message }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const apiStatus = ref<{ success: boolean; message: string } | null>(null)

const testAPI = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/v1/relics')
    if (response.ok) {
      apiStatus.value = { success: true, message: 'API接続成功！' }
    } else {
      apiStatus.value = {
        success: false,
        message: `API接続失敗: ${response.status}`,
      }
    }
  } catch (error) {
    apiStatus.value = { success: false, message: `接続エラー: ${error}` }
  }
}
</script>

<style scoped>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}

button {
  background: #42b883;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin: 20px;
}

button:hover {
  background: #369870;
}

.success {
  color: green;
  margin: 20px;
}

.error {
  color: red;
  margin: 20px;
}
</style>

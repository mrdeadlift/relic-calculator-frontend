<template>
  <form class="relic-form" @submit.prevent="handleSubmit">
    <!-- 基本情報セクション -->
    <div class="form-section">
      <h3 class="section-title">基本情報</h3>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label" for="name">遺物名 *</label>
          <BaseInput
            id="name"
            v-model="formData.name"
            :error="errors.name"
            placeholder="遺物の名前を入力"
            required
          />
        </div>

        <div class="form-group">
          <label class="form-label" for="type">タイプ *</label>
          <BaseInput
            id="type"
            v-model="formData.type"
            :error="errors.type"
            placeholder="遺物のタイプ"
            required
          />
        </div>
      </div>

      <div class="form-group">
        <label class="form-label" for="description">説明 *</label>
        <textarea
          id="description"
          v-model="formData.description"
          :class="['form-textarea', { error: errors.description }]"
          placeholder="遺物の詳細説明を入力"
          rows="3"
          required
        ></textarea>
        <div v-if="errors.description" class="error-message">
          {{ errors.description }}
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label" for="category">カテゴリ *</label>
          <select
            id="category"
            v-model="formData.category"
            :class="['form-select', { error: errors.category }]"
            required
          >
            <option value="">カテゴリを選択</option>
            <option value="Attack">攻撃</option>
            <option value="Defense">防御</option>
            <option value="Utility">ユーティリティ</option>
            <option value="Critical">クリティカル</option>
            <option value="Elemental">元素</option>
          </select>
          <div v-if="errors.category" class="error-message">
            {{ errors.category }}
          </div>
        </div>

        <div class="form-group">
          <label class="form-label" for="rarity">レアリティ *</label>
          <select
            id="rarity"
            v-model="formData.rarity"
            :class="['form-select', { error: errors.rarity }]"
            required
          >
            <option value="">レアリティを選択</option>
            <option value="common">コモン</option>
            <option value="rare">レア</option>
            <option value="epic">エピック</option>
            <option value="legendary">レジェンダリー</option>
          </select>
          <div v-if="errors.rarity" class="error-message">
            {{ errors.rarity }}
          </div>
        </div>

        <div class="form-group">
          <label class="form-label" for="quality">品質 *</label>
          <select
            id="quality"
            v-model="formData.quality"
            :class="['form-select', { error: errors.quality }]"
            required
          >
            <option value="">品質を選択</option>
            <option value="Delicate">繊細</option>
            <option value="Polished">磨かれた</option>
            <option value="Grand">壮大</option>
          </select>
          <div v-if="errors.quality" class="error-message">
            {{ errors.quality }}
          </div>
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label" for="obtainmentDifficulty"
            >入手難易度 (1-10) *</label
          >
          <input
            id="obtainmentDifficulty"
            v-model.number="formData.obtainmentDifficulty"
            type="range"
            min="1"
            max="10"
            :class="['form-range', { error: errors.obtainmentDifficulty }]"
            required
          />
          <div class="range-value">{{ formData.obtainmentDifficulty }}/10</div>
          <div v-if="errors.obtainmentDifficulty" class="error-message">
            {{ errors.obtainmentDifficulty }}
          </div>
        </div>

        <div class="form-group">
          <label class="form-label" for="attackMultiplier">攻撃倍率</label>
          <BaseInput
            id="attackMultiplier"
            v-model.number="formData.attackMultiplier"
            type="number"
            step="0.01"
            :error="errors.attackMultiplier"
            placeholder="1.0"
          />
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label" for="iconUrl">アイコンURL *</label>
          <BaseInput
            id="iconUrl"
            v-model="formData.iconUrl"
            :error="errors.iconUrl"
            placeholder="/icons/relic-name.png"
            required
          />
        </div>

        <div class="form-group">
          <label class="form-label" for="source">入手元</label>
          <BaseInput
            id="source"
            v-model="formData.source"
            :error="errors.source"
            placeholder="ダンジョン名やクエスト名"
          />
        </div>
      </div>
    </div>

    <!-- 効果セクション -->
    <div class="form-section">
      <div class="section-header">
        <h3 class="section-title">効果</h3>
        <BaseButton
          type="button"
          variant="secondary"
          size="small"
          @click="addEffect"
        >
          <i class="icon-plus"></i>
          効果を追加
        </BaseButton>
      </div>

      <div v-if="formData.effects.length === 0" class="empty-effects">
        <p>
          効果が設定されていません。「効果を追加」ボタンから効果を追加してください。
        </p>
      </div>

      <div
        v-for="(effect, index) in formData.effects"
        :key="index"
        class="effect-item"
      >
        <div class="effect-header">
          <h4>効果 {{ index + 1 }}</h4>
          <BaseButton
            type="button"
            variant="danger"
            size="small"
            @click="removeEffect(index)"
          >
            <i class="icon-trash"></i>
            削除
          </BaseButton>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">効果名 *</label>
            <BaseInput
              v-model="effect.name"
              :error="errors[`effects.${index}.name`]"
              placeholder="効果の名前"
              required
            />
          </div>

          <div class="form-group">
            <label class="form-label">効果タイプ *</label>
            <select
              v-model="effect.type"
              :class="[
                'form-select',
                { error: errors[`effects.${index}.type`] },
              ]"
              required
            >
              <option value="">タイプを選択</option>
              <option value="attack_multiplier">攻撃倍率</option>
              <option value="attack_flat">攻撃力（固定値）</option>
              <option value="attack_percentage">攻撃力（％）</option>
              <option value="critical_multiplier">クリティカル倍率</option>
              <option value="critical_chance">クリティカル率</option>
              <option value="elemental_damage">元素ダメージ</option>
              <option value="conditional_damage">条件付きダメージ</option>
              <option value="weapon_specific">武器特化</option>
              <option value="unique">固有効果</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">値 *</label>
            <BaseInput
              v-model="effect.value"
              :error="errors[`effects.${index}.value`]"
              placeholder="効果の値"
              required
            />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">重複ルール *</label>
            <select
              v-model="effect.stackingRule"
              :class="[
                'form-select',
                { error: errors[`effects.${index}.stackingRule`] },
              ]"
              required
            >
              <option value="">ルールを選択</option>
              <option value="additive">加算</option>
              <option value="multiplicative">乗算</option>
              <option value="overwrite">上書き</option>
              <option value="unique">固有</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">ダメージタイプ *</label>
            <div class="checkbox-group">
              <label
                v-for="damageType in damageTypes"
                :key="damageType"
                class="checkbox-label"
              >
                <input
                  v-model="effect.damageTypes"
                  type="checkbox"
                  :value="damageType"
                  class="checkbox-input"
                />
                {{ damageType }}
              </label>
            </div>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">説明 *</label>
          <textarea
            v-model="effect.description"
            :class="[
              'form-textarea',
              { error: errors[`effects.${index}.description`] },
            ]"
            placeholder="効果の詳細説明"
            rows="2"
            required
          ></textarea>
        </div>

        <!-- 条件設定 -->
        <div class="conditions-section">
          <div class="conditions-header">
            <h5>発動条件</h5>
            <BaseButton
              type="button"
              variant="secondary"
              size="small"
              @click="addCondition(index)"
            >
              条件を追加
            </BaseButton>
          </div>

          <div
            v-for="(condition, condIndex) in effect.conditions"
            :key="condIndex"
            class="condition-item"
          >
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">条件タイプ</label>
                <select v-model="condition.type" class="form-select">
                  <option value="weapon_type">武器タイプ</option>
                  <option value="combat_style">戦闘スタイル</option>
                  <option value="health_threshold">体力閾値</option>
                  <option value="chain_position">チェイン位置</option>
                  <option value="enemy_type">敵タイプ</option>
                  <option value="time_based">時間ベース</option>
                  <option value="equipment_count">装備数</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">値</label>
                <BaseInput v-model="condition.value" placeholder="条件の値" />
              </div>

              <div class="form-group">
                <label class="form-label">説明</label>
                <BaseInput
                  v-model="condition.description"
                  placeholder="条件の説明"
                />
              </div>

              <div class="form-group">
                <BaseButton
                  type="button"
                  variant="danger"
                  size="small"
                  @click="removeCondition(index, condIndex)"
                >
                  削除
                </BaseButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 競合設定 -->
    <div class="form-section">
      <h3 class="section-title">競合設定</h3>
      <div class="form-group">
        <label class="form-label">競合する遺物ID（カンマ区切り）</label>
        <BaseInput
          v-model="conflictsInput"
          :error="errors.conflicts"
          placeholder="relic-id-1, relic-id-2"
        />
        <div class="form-help">
          この遺物と同時に装備できない遺物のIDを入力してください
        </div>
      </div>
    </div>

    <!-- プレビュー -->
    <div class="form-section">
      <h3 class="section-title">プレビュー</h3>
      <div class="relic-preview">
        <div class="preview-header">
          <img
            :src="formData.iconUrl || '/icons/placeholder.png'"
            class="preview-icon"
          />
          <div class="preview-info">
            <h4 class="preview-name">{{ formData.name || '遺物名' }}</h4>
            <div class="preview-meta">
              <span class="preview-category">{{
                formData.category || 'カテゴリ'
              }}</span>
              <span class="preview-rarity">{{
                formData.rarity || 'レアリティ'
              }}</span>
              <span class="preview-quality">{{
                formData.quality || '品質'
              }}</span>
            </div>
          </div>
        </div>
        <p class="preview-description">
          {{ formData.description || '説明文がここに表示されます' }}
        </p>
        <div class="preview-effects">
          <div
            v-for="(effect, index) in formData.effects"
            :key="index"
            class="preview-effect"
          >
            <strong>{{ effect.name }}</strong
            >: {{ effect.description }}
          </div>
        </div>
      </div>
    </div>

    <!-- フォームアクション -->
    <div class="form-actions">
      <BaseButton
        type="button"
        variant="secondary"
        :disabled="loading"
        @click="$emit('cancel')"
      >
        キャンセル
      </BaseButton>
      <BaseButton
        type="button"
        variant="warning"
        :loading="validating"
        @click="validateOnly"
      >
        バリデーション
      </BaseButton>
      <BaseButton type="submit" variant="primary" :loading="loading">
        {{ isEditing ? '更新' : '作成' }}
      </BaseButton>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import type { Relic } from '../types'
import BaseButton from './BaseButton.vue'
import BaseInput from './BaseInput.vue'
import { adminService } from '../services/admin'
import { useToast } from '../composables/useToast'

// Props & Emits
interface Props {
  relic?: Relic | null
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  relic: null,
  loading: false,
})

const emit = defineEmits<{
  submit: [data: any]
  cancel: []
}>()

// Composables
const { showToast } = useToast()

// データ定義
const damageTypes = [
  'physical',
  'magical',
  'fire',
  'ice',
  'lightning',
  'dark',
  'holy',
]

// リアクティブデータ
const formData = ref({
  name: '',
  description: '',
  category: '',
  rarity: '',
  quality: '',
  type: '',
  attackMultiplier: null as number | null,
  source: '',
  obtainmentDifficulty: 5,
  iconUrl: '',
  effects: [] as Array<{
    name: string
    type: string
    value: string | number
    stackingRule: string
    damageTypes: string[]
    description: string
    conditions: Array<{
      type: string
      value: string | number
      description: string
    }>
  }>,
  conflicts: [] as string[],
})

const conflictsInput = ref('')
const errors = ref<Record<string, string>>({})
const validating = ref(false)

// 計算プロパティ
const isEditing = computed(() => !!props.relic?.id)

// ウォッチャー
watch(
  () => props.relic,
  newRelic => {
    if (newRelic) {
      formData.value = {
        name: newRelic.name,
        description: newRelic.description,
        category: newRelic.category,
        rarity: newRelic.rarity,
        quality: newRelic.quality,
        type: newRelic.type,
        attackMultiplier: newRelic.attackMultiplier,
        source: newRelic.source,
        obtainmentDifficulty: newRelic.obtainmentDifficulty,
        iconUrl: newRelic.iconUrl,
        effects:
          newRelic.effects?.map(effect => ({
            name: effect.name,
            type: effect.type,
            value: effect.value,
            stackingRule: effect.stackingRule,
            damageTypes: [...effect.damageTypes],
            description: effect.description,
            conditions:
              effect.conditions?.map(condition => ({
                type: condition.type,
                value: condition.value,
                description: condition.description,
              })) || [],
          })) || [],
        conflicts: [...(newRelic.conflicts || [])],
      }
      conflictsInput.value = newRelic.conflicts?.join(', ') || ''
    }
  },
  { immediate: true }
)

watch(conflictsInput, newValue => {
  formData.value.conflicts = newValue
    .split(',')
    .map(id => id.trim())
    .filter(id => id.length > 0)
})

// メソッド
const addEffect = () => {
  formData.value.effects.push({
    name: '',
    type: '',
    value: '',
    stackingRule: '',
    damageTypes: [],
    description: '',
    conditions: [],
  })
}

const removeEffect = (index: number) => {
  formData.value.effects.splice(index, 1)
}

const addCondition = (effectIndex: number) => {
  formData.value.effects[effectIndex].conditions.push({
    type: '',
    value: '',
    description: '',
  })
}

const removeCondition = (effectIndex: number, conditionIndex: number) => {
  formData.value.effects[effectIndex].conditions.splice(conditionIndex, 1)
}

const validateForm = (): boolean => {
  errors.value = {}

  // 基本バリデーション
  if (!formData.value.name) errors.value.name = '遺物名は必須です'
  if (!formData.value.description) errors.value.description = '説明は必須です'
  if (!formData.value.category) errors.value.category = 'カテゴリは必須です'
  if (!formData.value.rarity) errors.value.rarity = 'レアリティは必須です'
  if (!formData.value.quality) errors.value.quality = '品質は必須です'
  if (!formData.value.type) errors.value.type = 'タイプは必須です'
  if (!formData.value.iconUrl) errors.value.iconUrl = 'アイコンURLは必須です'

  // 効果バリデーション
  formData.value.effects.forEach((effect, index) => {
    if (!effect.name) errors.value[`effects.${index}.name`] = '効果名は必須です'
    if (!effect.type)
      errors.value[`effects.${index}.type`] = '効果タイプは必須です'
    if (!effect.value) errors.value[`effects.${index}.value`] = '値は必須です'
    if (!effect.stackingRule)
      errors.value[`effects.${index}.stackingRule`] = '重複ルールは必須です'
    if (!effect.description)
      errors.value[`effects.${index}.description`] = '説明は必須です'
    if (effect.damageTypes.length === 0)
      errors.value[`effects.${index}.damageTypes`] =
        'ダメージタイプを選択してください'
  })

  return Object.keys(errors.value).length === 0
}

const validateOnly = async () => {
  if (!validateForm()) {
    showToast('入力内容に問題があります', 'error')
    return
  }

  validating.value = true
  try {
    const result = await adminService.validateRelicData(formData.value)

    if (result.valid) {
      showToast('バリデーションに成功しました', 'success')
    } else {
      // エラー情報を表示
      result.errors.forEach(error => {
        errors.value[error.field] = error.message
      })
      showToast(`${result.errors.length}件のエラーが見つかりました`, 'error')
    }

    // 警告があれば表示
    if (result.warnings.length > 0) {
      result.warnings.forEach(warning => {
        showToast(warning.message, 'warning')
      })
    }
  } catch (error) {
    console.error('Validation failed:', error)
    showToast('バリデーションに失敗しました', 'error')
  } finally {
    validating.value = false
  }
}

const handleSubmit = () => {
  if (!validateForm()) {
    showToast('入力内容を確認してください', 'error')
    return
  }

  emit('submit', formData.value)
}

// ライフサイクル
onMounted(() => {
  if (!props.relic) {
    // 新規作成時はデフォルト効果を1つ追加
    addEffect()
  }
})
</script>

<style scoped>
.relic-form {
  max-width: 800px;
  margin: 0 auto;
  padding: 1rem;
}

.form-section {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  border: 1px solid #e2e8f0;
}

.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 1rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-label {
  font-weight: 500;
  color: #4a5568;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
}

.form-textarea {
  padding: 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-family: inherit;
  font-size: 0.875rem;
  resize: vertical;
  transition: border-color 0.2s;
}

.form-textarea:focus {
  outline: none;
  border-color: #4299e1;
}

.form-textarea.error {
  border-color: #e53e3e;
}

.form-select {
  padding: 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 0.875rem;
  background: white;
  transition: border-color 0.2s;
}

.form-select:focus {
  outline: none;
  border-color: #4299e1;
}

.form-select.error {
  border-color: #e53e3e;
}

.form-range {
  width: 100%;
  margin: 0.5rem 0;
}

.range-value {
  text-align: center;
  font-weight: 600;
  color: #4299e1;
  font-size: 0.875rem;
}

.checkbox-group {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #4a5568;
  cursor: pointer;
}

.checkbox-input {
  width: 16px;
  height: 16px;
}

.form-help {
  font-size: 0.75rem;
  color: #718096;
  margin-top: 0.25rem;
}

.error-message {
  color: #e53e3e;
  font-size: 0.75rem;
  margin-top: 0.25rem;
}

.empty-effects {
  text-align: center;
  padding: 2rem;
  color: #718096;
  background: #f7fafc;
  border-radius: 6px;
  border: 2px dashed #e2e8f0;
}

.effect-item {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1rem;
  background: #f7fafc;
}

.effect-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.effect-header h4 {
  color: #2d3748;
  margin: 0;
}

.conditions-section {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e2e8f0;
}

.conditions-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.conditions-header h5 {
  color: #4a5568;
  margin: 0;
  font-size: 0.875rem;
}

.condition-item {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 1rem;
  margin-bottom: 0.75rem;
}

.relic-preview {
  background: #f7fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1.5rem;
}

.preview-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.preview-icon {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  object-fit: cover;
  border: 2px solid #e2e8f0;
}

.preview-name {
  font-size: 1.25rem;
  font-weight: 600;
  color: #2d3748;
  margin: 0 0 0.5rem 0;
}

.preview-meta {
  display: flex;
  gap: 0.75rem;
  font-size: 0.75rem;
}

.preview-category,
.preview-rarity,
.preview-quality {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  background: #e2e8f0;
  color: #4a5568;
  font-weight: 500;
}

.preview-description {
  color: #4a5568;
  line-height: 1.5;
  margin-bottom: 1rem;
}

.preview-effects {
  space-y: 0.5rem;
}

.preview-effect {
  padding: 0.5rem;
  background: white;
  border-radius: 4px;
  font-size: 0.875rem;
  color: #4a5568;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1.5rem 0;
  border-top: 1px solid #e2e8f0;
  margin-top: 2rem;
}

@media (max-width: 768px) {
  .relic-form {
    padding: 0.5rem;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .section-header {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }

  .preview-header {
    flex-direction: column;
    text-align: center;
  }

  .form-actions {
    flex-direction: column;
  }
}
</style>

/**
 * Admin API Service
 * 管理者機能のAPI通信を処理するサービス
 */

import { httpClient } from './http'
import type { Relic, RelicCategory, RelicRarity } from '../types'

export interface AdminStatistics {
  totalRelics: number
  totalBuilds: number
  totalCalculations: number
  activeUsers: number
  recentActivity: {
    date: string
    calculations: number
    builds: number
  }[]
  popularRelics: {
    id: string
    name: string
    usageCount: number
  }[]
}

export interface IntegrityCheck {
  status: 'passed' | 'failed' | 'warning'
  issues: {
    id: string
    severity: 'error' | 'warning' | 'info'
    type: 'data_inconsistency' | 'missing_reference' | 'duplicate_data' | 'validation_error'
    title: string
    description: string
    suggestion: string
    autoFixable: boolean
    affectedItems: string[]
  }[]
  summary: {
    totalChecks: number
    passedChecks: number
    warnings: number
    errors: number
  }
}

export interface RelicCreateRequest {
  name: string
  description: string
  category: RelicCategory
  rarity: RelicRarity
  quality: string
  type: string
  attackMultiplier?: number
  source?: string
  obtainmentDifficulty: number
  iconUrl: string
  effects: Array<{
    type: string
    value: number | string
    stackingRule: string
    name: string
    description: string
    damageTypes: string[]
    conditions?: Array<{
      type: string
      value: string | number
      description: string
    }>
  }>
  conflicts?: string[]
}

export interface RelicUpdateRequest extends Partial<RelicCreateRequest> {}

export interface ImportResult {
  imported: number
  updated: number
  skipped: number
  errors: Array<{
    line: number
    message: string
    data?: any
  }>
}

class AdminService {
  private readonly baseUrl = '/api/v1/admin'

  /**
   * システム統計情報を取得
   */
  async getStatistics(): Promise<AdminStatistics> {
    const response = await httpClient.get(`${this.baseUrl}/statistics`)
    return response.data
  }

  /**
   * 管理者向け遺物一覧を取得
   */
  async getRelics(params?: {
    page?: number
    per_page?: number
    search?: string
    category?: string
    rarity?: string
    sort_by?: string
    sort_order?: 'asc' | 'desc'
  }): Promise<Relic[]> {
    const response = await httpClient.get(`${this.baseUrl}/relics`, { params })
    return response.data.data || response.data
  }

  /**
   * 遺物を作成
   */
  async createRelic(data: RelicCreateRequest): Promise<Relic> {
    const response = await httpClient.post(`${this.baseUrl}/relics`, { relic: data })
    return response.data.data
  }

  /**
   * 遺物を更新
   */
  async updateRelic(id: string, data: RelicUpdateRequest): Promise<Relic> {
    const response = await httpClient.put(`${this.baseUrl}/relics/${id}`, { relic: data })
    return response.data.data
  }

  /**
   * 遺物を削除
   */
  async deleteRelic(id: string): Promise<void> {
    await httpClient.delete(`${this.baseUrl}/relics/${id}`)
  }

  /**
   * 遺物データをバリデーション
   */
  async validateRelicData(data: RelicCreateRequest): Promise<{
    valid: boolean
    errors: Array<{
      field: string
      message: string
      code: string
    }>
    warnings: Array<{
      field: string
      message: string
      suggestion: string
    }>
  }> {
    const response = await httpClient.post(`${this.baseUrl}/relics/validate`, { relic: data })
    return response.data
  }

  /**
   * 遺物データをインポート
   */
  async importRelics(file: File): Promise<ImportResult> {
    const formData = new FormData()
    formData.append('file', file)
    
    const response = await httpClient.post(`${this.baseUrl}/relics/import`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      // アップロード進捗を追跡する場合
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          console.log(`Upload progress: ${percentCompleted}%`)
        }
      }
    })
    
    return response.data
  }

  /**
   * 遺物データをエクスポート
   */
  async exportRelics(format: 'json' | 'csv' = 'json'): Promise<Blob> {
    const response = await httpClient.get(`${this.baseUrl}/relics/export`, {
      params: { format },
      responseType: 'blob'
    })
    
    return response.data
  }

  /**
   * カテゴリ一覧を取得
   */
  async getCategories(): Promise<RelicCategory[]> {
    const response = await httpClient.get('/api/v1/relics/categories')
    return response.data
  }

  /**
   * レアリティ一覧を取得
   */
  async getRarities(): Promise<RelicRarity[]> {
    const response = await httpClient.get('/api/v1/relics/rarities')
    return response.data
  }

  /**
   * データ整合性チェックを実行
   */
  async runIntegrityCheck(): Promise<IntegrityCheck> {
    const response = await httpClient.post(`${this.baseUrl}/integrity-check`)
    return response.data
  }

  /**
   * 整合性問題を自動修正
   */
  async autoFixIssue(issueId: string): Promise<{
    success: boolean
    message: string
    fixedItems: string[]
  }> {
    const response = await httpClient.post(`${this.baseUrl}/integrity-check/fix/${issueId}`)
    return response.data
  }

  /**
   * システムキャッシュをクリア
   */
  async clearCache(cacheType?: 'all' | 'calculations' | 'relics' | 'builds'): Promise<{
    cleared: string[]
    message: string
  }> {
    const response = await httpClient.delete(`${this.baseUrl}/cache`, {
      params: { type: cacheType || 'all' }
    })
    return response.data
  }

  /**
   * バックグラウンドジョブ状況を取得
   */
  async getJobStatus(): Promise<{
    active: number
    waiting: number
    completed: number
    failed: number
    jobs: Array<{
      id: string
      type: string
      status: 'active' | 'waiting' | 'completed' | 'failed'
      progress?: number
      createdAt: string
      completedAt?: string
      error?: string
    }>
  }> {
    const response = await httpClient.get(`${this.baseUrl}/jobs`)
    return response.data
  }

  /**
   * システム設定を取得
   */
  async getSystemSettings(): Promise<Record<string, any>> {
    const response = await httpClient.get(`${this.baseUrl}/settings`)
    return response.data
  }

  /**
   * システム設定を更新
   */
  async updateSystemSettings(settings: Record<string, any>): Promise<{
    success: boolean
    updated: string[]
    message: string
  }> {
    const response = await httpClient.put(`${this.baseUrl}/settings`, { settings })
    return response.data
  }

  /**
   * データベース統計を取得
   */
  async getDatabaseStats(): Promise<{
    tables: Array<{
      name: string
      rows: number
      size: string
    }>
    totalSize: string
    lastBackup?: string
  }> {
    const response = await httpClient.get(`${this.baseUrl}/database/stats`)
    return response.data
  }

  /**
   * システムヘルスチェック
   */
  async getSystemHealth(): Promise<{
    status: 'healthy' | 'warning' | 'critical'
    checks: Array<{
      name: string
      status: 'pass' | 'fail' | 'warn'
      message: string
      details?: any
    }>
    uptime: number
    memory: {
      used: number
      total: number
      percentage: number
    }
    cpu: {
      usage: number
      load: number[]
    }
  }> {
    const response = await httpClient.get(`${this.baseUrl}/health`)
    return response.data
  }

  /**
   * 監査ログを取得
   */
  async getAuditLogs(params?: {
    page?: number
    per_page?: number
    user_id?: string
    action?: string
    resource?: string
    date_from?: string
    date_to?: string
  }): Promise<{
    logs: Array<{
      id: string
      userId?: string
      userEmail?: string
      action: string
      resource: string
      resourceId?: string
      details: any
      ip: string
      userAgent: string
      createdAt: string
    }>
    pagination: {
      current_page: number
      per_page: number
      total_pages: number
      total_count: number
    }
  }> {
    const response = await httpClient.get(`${this.baseUrl}/audit-logs`, { params })
    return response.data
  }
}

// シングルトンインスタンスをエクスポート
export const adminService = new AdminService()

// 型もエクスポート
export type {
  AdminStatistics,
  IntegrityCheck,
  RelicCreateRequest,
  RelicUpdateRequest,
  ImportResult
}
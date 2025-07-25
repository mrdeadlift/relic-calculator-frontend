import type { Relic, CalculationResult, ConditionalEffects } from '../types'
import { calculationEngine } from './calculation-engine'
import { calculationMemoizer } from './memoization-manager'

// Offline storage structure
interface OfflineData {
  relics: Relic[]
  calculations: Map<string, CalculationResult>
  metadata: {
    lastSync: string
    version: string
    relicCount: number
    calculationCount: number
  }
}

// Offline calculation options
interface OfflineCalculationOptions {
  useBasicFormulas: boolean
  enableFallbackCalculations: boolean
  cacheResults: boolean
  maxComplexity: 'basic' | 'intermediate' | 'advanced'
}

// Network status tracking
interface NetworkStatus {
  isOnline: boolean
  lastOnline: Date
  connectionQuality: 'good' | 'poor' | 'offline'
  retryCount: number
}

export class OfflineCalculator {
  private offlineData: OfflineData = {
    relics: [],
    calculations: new Map(),
    metadata: {
      lastSync: '',
      version: '1.0.0',
      relicCount: 0,
      calculationCount: 0
    }
  }

  private networkStatus: NetworkStatus = {
    isOnline: navigator.onLine,
    lastOnline: new Date(),
    connectionQuality: 'good',
    retryCount: 0
  }

  private readonly options: OfflineCalculationOptions
  private readonly storageKey = 'nightreign_offline_data'
  private syncInProgress = false

  constructor(options: Partial<OfflineCalculationOptions> = {}) {
    this.options = {
      useBasicFormulas: true,
      enableFallbackCalculations: true,
      cacheResults: true,
      maxComplexity: 'intermediate',
      ...options
    }

    this.initializeOfflineCapabilities()
  }

  // Initialize offline capabilities
  private async initializeOfflineCapabilities(): void {
    // Load offline data from storage
    await this.loadOfflineData()

    // Setup network event listeners
    this.setupNetworkListeners()

    // Setup service worker for offline caching (if available)
    this.setupServiceWorker()

    // Schedule periodic sync attempts
    this.schedulePeriodicSync()
  }

  // Main offline calculation method
  async calculateOffline(
    relics: Relic[],
    conditions: ConditionalEffects
  ): Promise<CalculationResult> {
    try {
      // Check if we have the relics data offline
      const validRelics = this.validateOfflineRelics(relics)
      if (!validRelics.isValid) {
        throw new Error(`Missing offline data for relics: ${validRelics.missingRelics.join(', ')}`)
      }

      // Generate cache key
      const cacheKey = this.generateOfflineCacheKey(relics, conditions)

      // Check offline cache first
      if (this.options.cacheResults) {
        const cached = this.offlineData.calculations.get(cacheKey)
        if (cached) {
          return this.addOfflineMetadata(cached)
        }
      }

      // Perform offline calculation
      const result = await this.performOfflineCalculation(relics, conditions)

      // Cache the result
      if (this.options.cacheResults) {
        this.offlineData.calculations.set(cacheKey, result)
        this.saveOfflineData()
      }

      return this.addOfflineMetadata(result)

    } catch (error) {
      console.error('Offline calculation failed:', error)
      
      if (this.options.enableFallbackCalculations) {
        return this.performFallbackCalculation(relics, conditions)
      }
      
      throw error
    }
  }

  // Perform offline calculation with simplified logic
  private async performOfflineCalculation(
    relics: Relic[],
    conditions: ConditionalEffects
  ): Promise<CalculationResult> {
    switch (this.options.maxComplexity) {
      case 'basic':
        return this.basicCalculation(relics, conditions)
      case 'intermediate':
        return this.intermediateCalculation(relics, conditions)
      case 'advanced':
        return this.advancedOfflineCalculation(relics, conditions)
      default:
        return this.basicCalculation(relics, conditions)
    }
  }

  // Basic calculation (sum of multipliers only)
  private basicCalculation(relics: Relic[], conditions: ConditionalEffects): CalculationResult {
    const baseMultiplier = relics.reduce((sum, relic) => sum + (relic.attackMultiplier || 0), 0)
    const efficiency = this.calculateBasicEfficiency(relics, baseMultiplier)
    const difficulty = this.calculateBasicDifficulty(relics)

    return {
      attackMultipliers: {
        total: Math.round(baseMultiplier * 100) / 100,
        base: Math.round(baseMultiplier * 100) / 100,
        synergy: 0,
        conditional: 0
      },
      efficiency,
      obtainmentDifficulty: difficulty,
      relicDetails: relics.map(relic => ({
        relicId: relic.id,
        name: relic.name,
        contribution: relic.attackMultiplier || 0,
        effects: relic.effects || [],
        synergies: [],
        conditionalBonuses: []
      })),
      effectBreakdown: [],
      calculationSteps: [{
        step: 1,
        description: 'Basic sum of attack multipliers',
        value: baseMultiplier
      }],
      metadata: {
        calculatedAt: new Date().toISOString(),
        clientSide: true,
        offline: true,
        complexity: 'basic'
      }
    }
  }

  // Intermediate calculation (includes basic synergies)
  private intermediateCalculation(relics: Relic[], conditions: ConditionalEffects): CalculationResult {
    const baseMultiplier = relics.reduce((sum, relic) => sum + (relic.attackMultiplier || 0), 0)
    const synergyBonus = this.calculateBasicSynergies(relics)
    const conditionalBonus = this.calculateBasicConditionals(relics, conditions)
    
    const totalMultiplier = baseMultiplier + synergyBonus + conditionalBonus
    const efficiency = this.calculateBasicEfficiency(relics, totalMultiplier)
    const difficulty = this.calculateBasicDifficulty(relics)

    return {
      attackMultipliers: {
        total: Math.round(totalMultiplier * 100) / 100,
        base: Math.round(baseMultiplier * 100) / 100,
        synergy: Math.round(synergyBonus * 100) / 100,
        conditional: Math.round(conditionalBonus * 100) / 100
      },
      efficiency,
      obtainmentDifficulty: difficulty,
      relicDetails: relics.map(relic => ({
        relicId: relic.id,
        name: relic.name,
        contribution: relic.attackMultiplier || 0,
        effects: relic.effects || [],
        synergies: [],
        conditionalBonuses: []
      })),
      effectBreakdown: this.generateBasicEffectBreakdown(relics, conditions),
      calculationSteps: [
        { step: 1, description: 'Base multipliers', value: baseMultiplier },
        { step: 2, description: 'Basic synergies', value: synergyBonus },
        { step: 3, description: 'Basic conditionals', value: conditionalBonus }
      ],
      metadata: {
        calculatedAt: new Date().toISOString(),
        clientSide: true,
        offline: true,
        complexity: 'intermediate'
      }
    }
  }

  // Advanced offline calculation (uses full engine but with offline constraints)
  private async advancedOfflineCalculation(
    relics: Relic[],
    conditions: ConditionalEffects
  ): Promise<CalculationResult> {
    try {
      // Use the full calculation engine but with offline-optimized settings
      return await calculationEngine.calculate(relics, conditions, {}, {
        useCache: true,
        enableOptimizations: false, // Disable complex optimizations for speed
        precision: 2,
        maxComplexity: 5 // Reduced complexity for offline
      })
    } catch (error) {
      console.warn('Advanced offline calculation failed, falling back to intermediate:', error)
      return this.intermediateCalculation(relics, conditions)
    }
  }

  // Fallback calculation for error cases
  private performFallbackCalculation(relics: Relic[], conditions: ConditionalEffects): CalculationResult {
    console.warn('Using fallback calculation due to errors')
    
    // Very basic calculation as last resort
    const baseMultiplier = relics.reduce((sum, relic) => {
      // Use stored multiplier or estimate based on relic name/type
      return sum + (relic.attackMultiplier || this.estimateRelicMultiplier(relic))
    }, 0)

    return {
      attackMultipliers: {
        total: Math.max(0, Math.round(baseMultiplier * 100) / 100),
        base: Math.max(0, Math.round(baseMultiplier * 100) / 100),
        synergy: 0,
        conditional: 0
      },
      efficiency: Math.max(0.1, baseMultiplier / 3), // Simple efficiency estimate
      obtainmentDifficulty: Math.min(5, relics.length), // Simple difficulty estimate
      relicDetails: relics.map(relic => ({
        relicId: relic.id,
        name: relic.name,
        contribution: relic.attackMultiplier || this.estimateRelicMultiplier(relic),
        effects: [],
        synergies: [],
        conditionalBonuses: []
      })),
      effectBreakdown: [],
      calculationSteps: [{
        step: 1,
        description: 'Fallback calculation (sum of estimated multipliers)',
        value: baseMultiplier
      }],
      metadata: {
        calculatedAt: new Date().toISOString(),
        clientSide: true,
        offline: true,
        fallback: true,
        complexity: 'fallback'
      }
    }
  }

  // Helper calculation methods
  private calculateBasicSynergies(relics: Relic[]): number {
    // Count same-type relics
    const typeGroups = relics.reduce((groups, relic) => {
      groups[relic.type] = (groups[relic.type] || 0) + 1
      return groups
    }, {} as Record<string, number>)

    let synergyBonus = 0
    Object.values(typeGroups).forEach(count => {
      if (count >= 2) {
        synergyBonus += count * 0.1 // 10% bonus per matching type
      }
    })

    return synergyBonus
  }

  private calculateBasicConditionals(relics: Relic[], conditions: ConditionalEffects): number {
    let conditionalBonus = 0

    relics.forEach(relic => {
      (relic.effects || []).forEach(effect => {
        // Simple conditional check
        if (this.isEffectActiveOffline(effect, conditions)) {
          conditionalBonus += (effect.multiplier || 0) * 0.5 // 50% of effect value
        }
      })
    })

    return conditionalBonus
  }

  private isEffectActiveOffline(effect: any, conditions: ConditionalEffects): boolean {
    // Simplified conditional checking for offline mode
    if (!effect.conditions) return true

    // Basic enemy type check
    if (effect.conditions.enemyType && effect.conditions.enemyType !== conditions.enemyType) {
      return false
    }

    // Basic health check
    if (effect.conditions.healthThreshold) {
      const threshold = effect.conditions.healthThreshold
      if (threshold.type === 'above' && conditions.playerHealth <= threshold.value) {
        return false
      }
      if (threshold.type === 'below' && conditions.playerHealth >= threshold.value) {
        return false
      }
    }

    return true
  }

  private calculateBasicEfficiency(relics: Relic[], multiplier: number): number {
    const avgDifficulty = relics.reduce((sum, r) => sum + (r.obtainmentDifficulty || 1), 0) / relics.length
    return Math.round((multiplier / Math.max(avgDifficulty, 1)) * 100) / 100
  }

  private calculateBasicDifficulty(relics: Relic[]): number {
    const totalDifficulty = relics.reduce((sum, r) => sum + (r.obtainmentDifficulty || 1), 0)
    return Math.round((totalDifficulty / relics.length) * 10) / 10
  }

  private generateBasicEffectBreakdown(relics: Relic[], conditions: ConditionalEffects): any[] {
    const breakdown: any[] = []

    relics.forEach(relic => {
      (relic.effects || []).forEach(effect => {
        const isActive = this.isEffectActiveOffline(effect, conditions)
        breakdown.push({
          relicId: relic.id,
          relicName: relic.name,
          effectType: effect.type,
          effectDescription: effect.description || 'No description',
          multiplier: effect.multiplier || 0,
          isActive,
          contribution: isActive ? (effect.multiplier || 0) * 0.5 : 0
        })
      })
    })

    return breakdown
  }

  private estimateRelicMultiplier(relic: Relic): number {
    // Fallback estimation based on relic properties
    if (relic.attackMultiplier) return relic.attackMultiplier

    // Estimate based on rarity
    const rarityMultipliers: Record<string, number> = {
      'common': 0.1,
      'uncommon': 0.2,
      'rare': 0.3,
      'epic': 0.5,
      'legendary': 0.8,
      'mythic': 1.2
    }

    const rarityBonus = rarityMultipliers[relic.rarity || 'common'] || 0.2
    const effectBonus = (relic.effects?.length || 0) * 0.1

    return Math.round((rarityBonus + effectBonus) * 100) / 100
  }

  // Data synchronization methods
  async syncWithServer(): Promise<{ success: boolean; syncedRelics: number; syncedCalculations: number }> {
    if (this.syncInProgress || !this.networkStatus.isOnline) {
      return { success: false, syncedRelics: 0, syncedCalculations: 0 }
    }

    this.syncInProgress = true
    let syncedRelics = 0
    let syncedCalculations = 0

    try {
      // Sync relic data
      try {
        const { typeSafeApiClient } = await import('./api-client')
        const relicsResponse = await typeSafeApiClient.relics.getAll()
        
        this.offlineData.relics = relicsResponse.data
        syncedRelics = relicsResponse.data.length
        
        this.offlineData.metadata.lastSync = new Date().toISOString()
        this.offlineData.metadata.relicCount = syncedRelics
      } catch (error) {
        console.warn('Failed to sync relics:', error)
      }

      // Clear old calculations to get fresh ones
      this.offlineData.calculations.clear()
      this.offlineData.metadata.calculationCount = 0

      // Save updated offline data
      await this.saveOfflineData()

      return { success: true, syncedRelics, syncedCalculations }

    } catch (error) {
      console.error('Sync failed:', error)
      return { success: false, syncedRelics, syncedCalculations }
    } finally {
      this.syncInProgress = false
    }
  }

  // Storage methods
  private async loadOfflineData(): Promise<void> {
    try {
      const stored = localStorage.getItem(this.storageKey)
      if (stored) {
        const data = JSON.parse(stored)
        this.offlineData = {
          ...data,
          calculations: new Map(data.calculations || [])
        }
      }
    } catch (error) {
      console.error('Failed to load offline data:', error)
    }
  }

  private async saveOfflineData(): Promise<void> {
    try {
      const dataToStore = {
        ...this.offlineData,
        calculations: Array.from(this.offlineData.calculations.entries())
      }
      
      localStorage.setItem(this.storageKey, JSON.stringify(dataToStore))
    } catch (error) {
      console.error('Failed to save offline data:', error)
    }
  }

  // Network status management
  private setupNetworkListeners(): void {
    window.addEventListener('online', () => {
      this.networkStatus.isOnline = true
      this.networkStatus.lastOnline = new Date()
      this.networkStatus.connectionQuality = 'good'
      this.networkStatus.retryCount = 0
      
      // Attempt sync when coming back online
      this.syncWithServer()
    })

    window.addEventListener('offline', () => {
      this.networkStatus.isOnline = false
      this.networkStatus.connectionQuality = 'offline'
    })
  }

  private setupServiceWorker(): void {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('Service Worker registered for offline support')
        })
        .catch(error => {
          console.log('Service Worker registration failed:', error)
        })
    }
  }

  private schedulePeriodicSync(): void {
    // Attempt sync every 5 minutes when online
    setInterval(() => {
      if (this.networkStatus.isOnline && !this.syncInProgress) {
        this.syncWithServer()
      }
    }, 300000)
  }

  // Utility methods
  private validateOfflineRelics(relics: Relic[]): { isValid: boolean; missingRelics: string[] } {
    const offlineRelicIds = new Set(this.offlineData.relics.map(r => r.id))
    const missingRelics: string[] = []

    relics.forEach(relic => {
      if (!offlineRelicIds.has(relic.id)) {
        missingRelics.push(relic.id)
      }
    })

    return {
      isValid: missingRelics.length === 0,
      missingRelics
    }
  }

  private generateOfflineCacheKey(relics: Relic[], conditions: ConditionalEffects): string {
    const relicIds = relics.map(r => r.id).sort().join(',')
    const conditionsStr = JSON.stringify(conditions)
    const complexity = this.options.maxComplexity
    
    return `offline_${complexity}_${relicIds}_${btoa(conditionsStr)}`
  }

  private addOfflineMetadata(result: CalculationResult): CalculationResult {
    return {
      ...result,
      metadata: {
        ...result.metadata,
        offline: true,
        offlineVersion: this.offlineData.metadata.version,
        lastDataSync: this.offlineData.metadata.lastSync
      }
    }
  }

  // Public API
  isOfflineCapable(): boolean {
    return this.offlineData.relics.length > 0
  }

  getOfflineStatus(): {
    isOnline: boolean
    lastSync: string
    relicCount: number
    calculationCount: number
    cacheSize: string
  } {
    const cacheSize = new Blob([JSON.stringify(Array.from(this.offlineData.calculations.entries()))]).size
    
    return {
      isOnline: this.networkStatus.isOnline,
      lastSync: this.offlineData.metadata.lastSync,
      relicCount: this.offlineData.metadata.relicCount,
      calculationCount: this.offlineData.calculations.size,
      cacheSize: `${(cacheSize / 1024).toFixed(1)} KB`
    }
  }

  clearOfflineData(): void {
    this.offlineData = {
      relics: [],
      calculations: new Map(),
      metadata: {
        lastSync: '',
        version: '1.0.0',
        relicCount: 0,
        calculationCount: 0
      }
    }
    
    localStorage.removeItem(this.storageKey)
  }

  async forceSync(): Promise<boolean> {
    const result = await this.syncWithServer()
    return result.success
  }
}

// Export singleton instance
export const offlineCalculator = new OfflineCalculator({
  useBasicFormulas: true,
  enableFallbackCalculations: true,
  cacheResults: true,
  maxComplexity: 'intermediate'
})

// Export factory function
export const createOfflineCalculator = (options?: Partial<OfflineCalculationOptions>): OfflineCalculator => {
  return new OfflineCalculator(options)
}
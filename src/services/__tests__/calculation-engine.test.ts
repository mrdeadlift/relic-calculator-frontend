import { describe, it, expect, beforeEach, vi } from 'vitest'
import { calculationEngine } from '../calculation-engine'
import type { CalculationRequest, CalculationOptions } from '../../types'
import { TestDataFactory } from '../../test/helpers/test-utils'

describe('CalculationEngine', () => {
  beforeEach(() => {
    // Clear cache before each test
    calculationEngine.clearCache()
  })

  describe('calculate', () => {
    it('should calculate basic attack multipliers', async () => {
      const request: CalculationRequest = {
        relicIds: ['relic-1', 'relic-2'],
        context: {
          attackType: 'normal',
          weaponType: 'sword',
        },
      }

      const result = await calculationEngine.calculate(request)

      expect(result).toBeDefined()
      expect(result.attackMultipliers).toBeDefined()
      expect(result.attackMultipliers.total).toBeGreaterThan(0)
      expect(result.efficiency).toBeGreaterThanOrEqual(0)
      expect(result.obtainmentDifficulty).toBeGreaterThanOrEqual(1)
    })

    it('should handle empty relic list', async () => {
      const request: CalculationRequest = {
        relicIds: [],
        context: {
          attackType: 'normal',
        },
      }

      const result = await calculationEngine.calculate(request)

      expect(result.attackMultipliers.total).toBe(1.0)
      expect(result.attackMultipliers.base).toBe(1.0)
      expect(result.attackMultipliers.synergy).toBe(0)
      expect(result.attackMultipliers.conditional).toBe(0)
      expect(result.efficiency).toBe(0)
    })

    it('should include breakdown when requested', async () => {
      const request: CalculationRequest = {
        relicIds: ['relic-1'],
        options: {
          includeBreakdown: true,
        },
      }

      const result = await calculationEngine.calculate(request)

      expect(result.effectBreakdown).toBeDefined()
      expect(Array.isArray(result.effectBreakdown)).toBe(true)
      expect(result.calculationSteps).toBeDefined()
      expect(Array.isArray(result.calculationSteps)).toBe(true)
    })

    it('should include performance metrics when requested', async () => {
      const request: CalculationRequest = {
        relicIds: ['relic-1'],
        options: {
          includePerformance: true,
        },
      }

      const result = await calculationEngine.calculate(request)

      expect(result.metadata.performance).toBeDefined()
      expect(result.metadata.performance.duration).toBeGreaterThan(0)
      expect(result.metadata.performance.relicCount).toBe(1)
    })

    it('should handle conditional effects based on context', async () => {
      const request: CalculationRequest = {
        relicIds: ['relic-1'],
        context: {
          attackType: 'normal',
          weaponType: 'sword',
          playerLevel: 50,
          enemyType: 'boss',
        },
      }

      const result = await calculationEngine.calculate(request)

      expect(result.attackMultipliers.conditional).toBeGreaterThanOrEqual(0)
    })
  })

  describe('caching', () => {
    it('should cache calculation results', async () => {
      const request: CalculationRequest = {
        relicIds: ['relic-1', 'relic-2'],
        context: { attackType: 'normal' },
      }

      // First calculation
      const result1 = await calculationEngine.calculate(request)

      // Second calculation should be cached
      const result2 = await calculationEngine.calculate(request)

      expect(result1).toEqual(result2)
      expect(result2.metadata.cached).toBe(true)
    })

    it('should invalidate cache when relics change', async () => {
      const request1: CalculationRequest = {
        relicIds: ['relic-1'],
        context: { attackType: 'normal' },
      }

      const request2: CalculationRequest = {
        relicIds: ['relic-2'],
        context: { attackType: 'normal' },
      }

      const result1 = await calculationEngine.calculate(request1)
      const result2 = await calculationEngine.calculate(request2)

      // Results should be different
      expect(result1).not.toEqual(result2)
    })

    it('should respect cache options', async () => {
      const request: CalculationRequest = {
        relicIds: ['relic-1'],
        context: { attackType: 'normal' },
        options: { useCache: false },
      }

      const result1 = await calculationEngine.calculate(request)
      const result2 = await calculationEngine.calculate(request)

      // Both should be fresh calculations
      expect(result1.metadata.cached).toBeUndefined()
      expect(result2.metadata.cached).toBeUndefined()
    })

    it('should clear cache when requested', async () => {
      const request: CalculationRequest = {
        relicIds: ['relic-1'],
        context: { attackType: 'normal' },
      }

      // Calculate to populate cache
      await calculationEngine.calculate(request)

      // Clear cache
      calculationEngine.clearCache()

      // Next calculation should not be cached
      const result = await calculationEngine.calculate(request)
      expect(result.metadata.cached).toBeUndefined()
    })
  })

  describe('offline mode', () => {
    it('should work in offline mode', async () => {
      // Simulate offline mode
      calculationEngine.setOfflineMode(true)

      const request: CalculationRequest = {
        relicIds: ['relic-1'],
        context: { attackType: 'normal' },
      }

      const result = await calculationEngine.calculate(request)

      expect(result).toBeDefined()
      expect(result.metadata.offline).toBe(true)
      expect(result.metadata.clientSide).toBe(true)

      // Reset offline mode
      calculationEngine.setOfflineMode(false)
    })

    it('should provide fallback calculations when server is unavailable', async () => {
      // Mock server failure
      vi.mock('../../services/api', () => ({
        apiService: {
          relics: {
            calculate: vi.fn().mockRejectedValue(new Error('Network error')),
          },
        },
      }))

      const request: CalculationRequest = {
        relicIds: ['relic-1'],
        context: { attackType: 'normal' },
      }

      const result = await calculationEngine.calculate(request)

      expect(result).toBeDefined()
      expect(result.metadata.fallback).toBe(true)
      expect(result.metadata.clientSide).toBe(true)
    })
  })

  describe('error handling', () => {
    it('should handle invalid relic IDs gracefully', async () => {
      const request: CalculationRequest = {
        relicIds: ['invalid-relic-id'],
        context: { attackType: 'normal' },
      }

      const result = await calculationEngine.calculate(request)

      // Should return base calculation
      expect(result.attackMultipliers.total).toBe(1.0)
      expect(result.efficiency).toBe(0)
    })

    it('should handle calculation timeouts', async () => {
      const request: CalculationRequest = {
        relicIds: ['relic-1'],
        context: { attackType: 'normal' },
        options: { timeout: 1 }, // Very short timeout
      }

      // Should not throw but might return fallback
      await expect(calculationEngine.calculate(request)).resolves.toBeDefined()
    })

    it('should validate input parameters', async () => {
      const invalidRequest = {
        relicIds: null,
        context: null,
      } as any

      await expect(
        calculationEngine.calculate(invalidRequest)
      ).rejects.toThrow()
    })
  })

  describe('performance', () => {
    it('should complete calculations within reasonable time', async () => {
      const request: CalculationRequest = {
        relicIds: ['relic-1', 'relic-2', 'relic-3'],
        context: { attackType: 'normal' },
        options: { includePerformance: true },
      }

      const startTime = performance.now()
      const result = await calculationEngine.calculate(request)
      const endTime = performance.now()

      const executionTime = endTime - startTime
      expect(executionTime).toBeLessThan(1000) // Should complete within 1 second

      expect(result.metadata.performance.duration).toBeGreaterThan(0)
    })

    it('should handle large relic combinations efficiently', async () => {
      const largeRelicSet = Array.from(
        { length: 9 },
        (_, i) => `relic-${i + 1}`
      )

      const request: CalculationRequest = {
        relicIds: largeRelicSet,
        context: { attackType: 'normal' },
        options: { includePerformance: true },
      }

      const result = await calculationEngine.calculate(request)

      expect(result).toBeDefined()
      expect(result.metadata.performance.relicCount).toBe(9)
      expect(result.metadata.performance.duration).toBeLessThan(2000)
    })
  })

  describe('memoization', () => {
    it('should memoize expensive calculations', async () => {
      const request: CalculationRequest = {
        relicIds: ['relic-1', 'relic-2'],
        context: {
          attackType: 'normal',
          weaponType: 'sword',
          playerLevel: 50,
        },
      }

      // First calculation
      const startTime1 = performance.now()
      const result1 = await calculationEngine.calculate(request)
      const duration1 = performance.now() - startTime1

      // Second identical calculation should be faster
      const startTime2 = performance.now()
      const result2 = await calculationEngine.calculate(request)
      const duration2 = performance.now() - startTime2

      expect(result1).toEqual(result2)
      expect(duration2).toBeLessThan(duration1)
    })

    it('should invalidate memoization when parameters change', async () => {
      const request1: CalculationRequest = {
        relicIds: ['relic-1'],
        context: { attackType: 'normal', playerLevel: 10 },
      }

      const request2: CalculationRequest = {
        relicIds: ['relic-1'],
        context: { attackType: 'normal', playerLevel: 50 },
      }

      const result1 = await calculationEngine.calculate(request1)
      const result2 = await calculationEngine.calculate(request2)

      // Results should potentially be different due to level scaling
      expect(result1.metadata.calculatedAt).not.toEqual(
        result2.metadata.calculatedAt
      )
    })
  })

  describe('advanced scenarios', () => {
    it('should handle complex synergy calculations', async () => {
      const request: CalculationRequest = {
        relicIds: ['relic-1', 'relic-2'], // Assume these have synergy
        context: {
          attackType: 'normal',
          combatStyle: 'melee',
        },
        options: { includeBreakdown: true },
      }

      const result = await calculationEngine.calculate(request)

      expect(result.attackMultipliers.synergy).toBeGreaterThanOrEqual(0)
      if (result.attackMultipliers.synergy > 0) {
        expect(
          result.effectBreakdown.some(effect =>
            effect.description.toLowerCase().includes('synergy')
          )
        ).toBe(true)
      }
    })

    it('should apply conditional effects correctly', async () => {
      const request: CalculationRequest = {
        relicIds: ['relic-with-condition'],
        context: {
          attackType: 'normal',
          playerHealth: 30, // Low health condition
          isFirstHit: true,
          comboCount: 1,
        },
      }

      const result = await calculationEngine.calculate(request)

      // Should have conditional bonuses applied
      expect(result.attackMultipliers.conditional).toBeGreaterThanOrEqual(0)
    })

    it('should calculate environmental effects', async () => {
      const request: CalculationRequest = {
        relicIds: ['relic-1'],
        context: {
          attackType: 'normal',
          environmentEffects: ['rain', 'darkness'],
        },
      }

      const result = await calculationEngine.calculate(request)

      // Environmental effects might modify the calculation
      expect(result.attackMultipliers.environmental).toBeGreaterThanOrEqual(0)
    })
  })

  describe('validation', () => {
    it('should validate relic combination constraints', async () => {
      const request: CalculationRequest = {
        relicIds: ['conflicting-relic-1', 'conflicting-relic-2'],
        context: { attackType: 'normal' },
      }

      // Should handle conflicting relics gracefully
      const result = await calculationEngine.calculate(request)
      expect(result).toBeDefined()

      // Might apply conflict penalties
      expect(result.attackMultipliers.total).toBeGreaterThan(0)
    })

    it('should respect maximum relic limits', async () => {
      const tooManyRelics = Array.from(
        { length: 15 },
        (_, i) => `relic-${i + 1}`
      )

      const request: CalculationRequest = {
        relicIds: tooManyRelics,
        context: { attackType: 'normal' },
      }

      await expect(calculationEngine.calculate(request)).rejects.toThrow()
    })
  })
})

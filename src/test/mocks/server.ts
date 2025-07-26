import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import type {
  Relic,
  Build,
  CalculationResult,
  OptimizationResult,
  ApiResponse,
} from '../../types'

// Mock data
const mockRelics: Relic[] = [
  {
    id: 'relic-1',
    name: 'Test Attack Relic',
    description: 'A test relic for attack bonuses',
    category: 'Attack',
    rarity: 'rare',
    quality: 'Polished',
    type: 'attack_boost',
    iconUrl: '/icons/test-attack.png',
    obtainmentDifficulty: 5,
    effects: [
      {
        id: 'effect-1',
        type: 'attack_multiplier',
        value: 1.25,
        stackingRule: 'multiplicative',
        name: 'Attack Boost',
        description: '+25% attack damage',
        damageTypes: ['physical'],
        conditions: [],
      },
    ],
    conflicts: [],
  },
  {
    id: 'relic-2',
    name: 'Test Critical Relic',
    description: 'A test relic for critical bonuses',
    category: 'Critical',
    rarity: 'epic',
    quality: 'Grand',
    type: 'critical_boost',
    iconUrl: '/icons/test-critical.png',
    obtainmentDifficulty: 7,
    effects: [
      {
        id: 'effect-2',
        type: 'critical_multiplier',
        value: 15,
        stackingRule: 'additive',
        name: 'Critical Damage',
        description: '+15% critical damage',
        damageTypes: ['physical', 'magical'],
        conditions: [],
      },
    ],
    conflicts: [],
  },
]

const mockBuilds: Build[] = [
  {
    id: 'build-1',
    name: 'Test Melee Build',
    description: 'A test build for melee combat',
    relics: ['relic-1', 'relic-2'],
    combatStyle: 'melee',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    isPublic: false,
  },
]

const mockCalculationResult: CalculationResult = {
  attackMultipliers: {
    total: 2.5,
    base: 1.0,
    synergy: 0.3,
    conditional: 0.2,
  },
  efficiency: 0.85,
  obtainmentDifficulty: 6,
  relicDetails: [
    {
      relicId: 'relic-1',
      name: 'Test Attack Relic',
      contribution: 1.25,
      effects: [],
      synergies: [],
      conditionalBonuses: [],
    },
  ],
  effectBreakdown: [],
  calculationSteps: [
    {
      step: 1,
      description: 'Base calculation',
      value: 1.0,
    },
  ],
  metadata: {
    calculatedAt: new Date().toISOString(),
    clientSide: false,
    performance: {
      duration: 50,
      relicCount: 2,
    },
  },
}

const mockOptimizationResult: OptimizationResult = {
  suggestions: [
    {
      type: 'add',
      relicId: 'relic-3',
      relicName: 'Suggested Relic',
      currentMultiplier: 2.5,
      suggestedMultiplier: 3.0,
      improvement: 0.5,
      reason: 'Increases overall damage output',
      confidence: 0.9,
    },
  ],
  analysis: {
    currentPower: 2.5,
    maxPotential: 3.5,
    efficiency: 0.85,
  },
}

// API handlers
export const handlers = [
  // Relics endpoints
  http.get('/api/v1/relics', () => {
    const response: ApiResponse<Relic[]> = {
      data: mockRelics,
      meta: {
        pagination: {
          current_page: 1,
          per_page: 20,
          total_pages: 1,
          total_count: mockRelics.length,
          has_next_page: false,
          has_prev_page: false,
        },
      },
    }
    return HttpResponse.json(response)
  }),

  http.get('/api/v1/relics/:id', ({ params }) => {
    const { id } = params
    const relic = mockRelics.find(r => r.id === id)

    if (!relic) {
      return HttpResponse.json(
        { error: { message: 'Relic not found' } },
        { status: 404 }
      )
    }

    const response: ApiResponse<Relic> = {
      data: relic,
    }
    return HttpResponse.json(response)
  }),

  http.post('/api/v1/relics/calculate', async ({ request }) => {
    const body = (await request.json()) as any

    if (!body.selected_relic_ids || !Array.isArray(body.selected_relic_ids)) {
      return HttpResponse.json(
        { error: { message: 'selected_relic_ids is required' } },
        { status: 400 }
      )
    }

    if (body.selected_relic_ids.length > 9) {
      return HttpResponse.json(
        { error: { message: 'Maximum 9 relics allowed' } },
        { status: 400 }
      )
    }

    const response: ApiResponse<{ calculation: CalculationResult }> = {
      data: { calculation: mockCalculationResult },
    }
    return HttpResponse.json(response)
  }),

  http.post('/api/v1/relics/validate', async ({ request }) => {
    const body = (await request.json()) as any

    const response: ApiResponse<{
      valid: boolean
      errors: string[]
      warnings: string[]
      suggestions: string[]
    }> = {
      data: {
        valid: true,
        errors: [],
        warnings: [],
        suggestions: ['Consider adding a defensive relic for balance'],
      },
    }
    return HttpResponse.json(response)
  }),

  http.post('/api/v1/relics/compare', async ({ request }) => {
    const body = (await request.json()) as any

    if (!body.combinations || body.combinations.length < 2) {
      return HttpResponse.json(
        {
          error: { message: 'At least 2 combinations required for comparison' },
        },
        { status: 400 }
      )
    }

    const response: ApiResponse<{
      comparisons: any[]
      winner: any
      analysis: any
    }> = {
      data: {
        comparisons: body.combinations.map((combo: any, index: number) => ({
          name: combo.name,
          attack_multipliers: {
            total: 2.0 + index * 0.5,
          },
          efficiency: 0.8 + index * 0.1,
        })),
        winner: {
          name: body.combinations[0].name,
          attack_multipliers: { total: 2.5 },
        },
        analysis: {
          performance_gap: 0.5,
          trade_offs: [],
          recommendations: [],
        },
      },
    }
    return HttpResponse.json(response)
  }),

  http.get('/api/v1/relics/categories', () => {
    const response: ApiResponse<string[]> = {
      data: ['Attack', 'Defense', 'Utility', 'Critical', 'Elemental'],
    }
    return HttpResponse.json(response)
  }),

  http.get('/api/v1/relics/rarities', () => {
    const response: ApiResponse<string[]> = {
      data: ['common', 'rare', 'epic', 'legendary'],
    }
    return HttpResponse.json(response)
  }),

  // Builds endpoints
  http.get('/api/v1/builds', () => {
    const response: ApiResponse<Build[]> = {
      data: mockBuilds,
      meta: {
        pagination: {
          current_page: 1,
          per_page: 20,
          total_pages: 1,
          total_count: mockBuilds.length,
          has_next_page: false,
          has_prev_page: false,
        },
      },
    }
    return HttpResponse.json(response)
  }),

  http.get('/api/v1/builds/:id', ({ params }) => {
    const { id } = params
    const build = mockBuilds.find(b => b.id === id)

    if (!build) {
      return HttpResponse.json(
        { error: { message: 'Build not found' } },
        { status: 404 }
      )
    }

    const response: ApiResponse<Build> = {
      data: build,
    }
    return HttpResponse.json(response)
  }),

  http.post('/api/v1/builds', async ({ request }) => {
    const body = (await request.json()) as any

    const newBuild: Build = {
      id: `build-${Date.now()}`,
      name: body.name || 'New Build',
      description: body.description || '',
      relics: body.relics || [],
      combatStyle: body.combat_style || 'melee',
      createdAt: new Date(),
      updatedAt: new Date(),
      isPublic: body.is_public || false,
    }

    const response: ApiResponse<Build> = {
      data: newBuild,
    }
    return HttpResponse.json(response, { status: 201 })
  }),

  http.put('/api/v1/builds/:id', async ({ params, request }) => {
    const { id } = params
    const body = (await request.json()) as any

    const existingBuild = mockBuilds.find(b => b.id === id)
    if (!existingBuild) {
      return HttpResponse.json(
        { error: { message: 'Build not found' } },
        { status: 404 }
      )
    }

    const updatedBuild: Build = {
      ...existingBuild,
      ...body,
      id: id as string,
      updatedAt: new Date(),
    }

    const response: ApiResponse<Build> = {
      data: updatedBuild,
    }
    return HttpResponse.json(response)
  }),

  http.delete('/api/v1/builds/:id', ({ params }) => {
    const { id } = params
    const buildIndex = mockBuilds.findIndex(b => b.id === id)

    if (buildIndex === -1) {
      return HttpResponse.json(
        { error: { message: 'Build not found' } },
        { status: 404 }
      )
    }

    return HttpResponse.json({ success: true })
  }),

  // Optimization endpoints
  http.post('/api/v1/optimization/suggest', async ({ request }) => {
    const body = (await request.json()) as any

    const response: ApiResponse<OptimizationResult> = {
      data: mockOptimizationResult,
    }
    return HttpResponse.json(response)
  }),

  http.post('/api/v1/optimization/analyze', async ({ request }) => {
    const body = (await request.json()) as any

    const response: ApiResponse<any> = {
      data: {
        analysis: {
          strengths: ['High attack power', 'Good synergy'],
          weaknesses: ['Low defense', 'High difficulty'],
          recommendations: ['Add defensive relic', 'Consider elemental damage'],
        },
      },
    }
    return HttpResponse.json(response)
  }),

  // Error simulation endpoints
  http.get('/api/v1/test/error', () => {
    return HttpResponse.json(
      { error: { message: 'Internal server error' } },
      { status: 500 }
    )
  }),

  http.get('/api/v1/test/slow', async () => {
    // Simulate slow response
    await new Promise(resolve => setTimeout(resolve, 2000))
    return HttpResponse.json({ data: 'slow response' })
  }),
]

export const server = setupServer(...handlers)

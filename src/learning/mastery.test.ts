import { describe, expect, it } from 'vitest'
import { emptyMastery } from '../curriculum/skills'
import { recordMasteryEvidence } from './mastery'

describe('mastery evidence', () => {
  it('moves from new to secure through independent spaced evidence', () => {
    let state = emptyMastery('addition')
    for (let index = 0; index < 3; index += 1) {
      state = recordMasteryEvidence(state, {
        skillId: 'addition',
        representation: 'symbolic',
        dateKey: `2026-09-0${index + 1}`,
        completedAt: `2026-09-0${index + 1}T10:00:00.000Z`,
        wrongAnswers: 0,
        hintUsed: false,
      })
    }

    expect(state.score).toBe(6)
    expect(state.band).toBe('secure')
    expect(state.independentSuccesses).toBe(3)
    expect(state.representationEvidence.symbolic).toBe(3)
    expect(state.nextReviewDate).toBe('2026-09-17')
  })

  it('brings a skill nearer to review after strong help', () => {
    const state = recordMasteryEvidence(
      { ...emptyMastery('subtraction'), score: 4, band: 'practising' },
      {
        skillId: 'subtraction',
        representation: 'number-line',
        dateKey: '2026-09-01',
        completedAt: '2026-09-01T10:00:00.000Z',
        wrongAnswers: 2,
        hintUsed: true,
      },
    )
    expect(state.score).toBe(3)
    expect(state.nextReviewDate).toBe('2026-09-04')
  })
})

import { describe, expect, it } from 'vitest'
import { updateSettings } from '../domain/data'
import { IndexedDbStateRepository } from './repository'

describe('IndexedDB repository', () => {
  it('creates defaults and persists settings', async () => {
    const repository = new IndexedDbStateRepository()
    const initial = await repository.load()
    const changed = updateSettings(initial, { pointsGoal: 70, rewardLabel: 'Velofahren' })
    await repository.save(changed)

    const secondRepository = new IndexedDbStateRepository()
    const reloaded = await secondRepository.load()
    expect(reloaded.settings.pointsGoal).toBe(70)
    expect(reloaded.settings.rewardLabel).toBe('Velofahren')
  })
})

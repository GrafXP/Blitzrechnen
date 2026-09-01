import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { createDefaultData } from '../domain/data'
import { MissionPicker } from './MissionPicker'

describe('mission picker', () => {
  it('offers three equivalent skins and stores the chosen mission', () => {
    const data = createDefaultData(new Date('2026-09-01T10:00:00.000Z'))
    const commit = vi.fn()
    const onSelected = vi.fn()
    render(
      <MissionPicker
        dateKey="2026-09-01"
        commit={commit}
        onSelected={onSelected}
        onCancel={vi.fn()}
      />,
    )

    expect(screen.getAllByRole('button', { name: /Zahlenweg|Formenwerkstatt|Markttag/ })).toHaveLength(3)
    expect(screen.getByText(/Punkte und Aufgaben bleiben fair/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Markttag/ }))

    expect(commit).toHaveBeenCalledOnce()
    const updater = commit.mock.calls[0][0]
    expect(updater(data).ledgers['2026-09-01'].missionSkin).toBe('market-day')
    expect(onSelected).toHaveBeenCalledOnce()
  })
})

import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { challengeFor } from '../domain/challenges'
import { createDefaultData, currentLedger } from '../domain/data'
import { zurichDateKey } from '../domain/date'
import { MissionScreen } from './MissionScreen'

describe('mission feedback', () => {
  it('shows a visual strategy after two attempts and accepts the correct answer', () => {
    const data = createDefaultData()
    const dateKey = zurichDateKey()
    const challenge = challengeFor(dateKey, 0)
    const commit = vi.fn()
    render(
      <MissionScreen
        data={data}
        ledger={currentLedger(data, dateKey)}
        dateKey={dateKey}
        commit={commit}
        onExit={vi.fn()}
        onDone={vi.fn()}
      />,
    )

    const input = screen.getByLabelText('Deine Antwort')
    for (let attempt = 0; attempt < 2; attempt += 1) {
      fireEvent.change(input, { target: { value: String(challenge.answer + 1) } })
      fireEvent.click(screen.getByRole('button', { name: 'Antwort prüfen' }))
    }

    expect(screen.getByText(challenge.hint)).toBeInTheDocument()
    expect(screen.getByText('Nutze die Punkte und versuche es nochmals.')).toBeInTheDocument()

    fireEvent.change(input, { target: { value: String(challenge.answer) } })
    fireEvent.click(screen.getByRole('button', { name: 'Antwort prüfen' }))
    expect(screen.getByText('Du bekommst 10 Punkte.')).toBeInTheDocument()
    expect(commit).toHaveBeenCalledOnce()
  })
})

import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { challengeForSession } from '../domain/challenges'
import { createDefaultData, currentLedger } from '../domain/data'
import { zurichDateKey } from '../domain/date'
import { MissionScreen } from './MissionScreen'

describe('mission feedback', () => {
  it('shows a visual strategy after two attempts and accepts the correct answer', () => {
    const data = createDefaultData()
    const dateKey = zurichDateKey()
    const challenge = challengeForSession(data, dateKey, 0)
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

    const answer = (value: number) => {
      if (challenge.interaction === 'choice') {
        fireEvent.click(screen.getByRole('button', { name: String(value) }))
      } else {
        fireEvent.change(screen.getByLabelText('Deine Antwort'), { target: { value: String(value) } })
      }
      fireEvent.click(screen.getByRole('button', { name: 'Antwort prüfen' }))
    }
    const wrongAnswer = challenge.interaction === 'choice'
      ? challenge.options!.find((option) => option !== challenge.answer)!
      : challenge.answer === 100 ? 99 : challenge.answer + 1

    for (let attempt = 0; attempt < 2; attempt += 1) {
      answer(wrongAnswer)
    }

    expect(screen.getByText(challenge.hint)).toBeInTheDocument()
    expect(screen.getByText('Nutze die Punkte und versuche es nochmals.')).toBeInTheDocument()

    answer(challenge.answer)
    expect(screen.getByText('Du bekommst 10 Punkte.')).toBeInTheDocument()
    expect(commit).toHaveBeenCalledOnce()
  })
})

import { useEffect, useMemo, useState } from 'react'
import type { DataCommit } from '../app/usePersistentData'
import { speak } from '../accessibility/speech'
import { awardResolvedChallenge } from '../domain/data'
import { challengeFor } from '../domain/challenges'
import type { AppData, DailyLedger } from '../domain/types'
import { ArrowLeftIcon, BackspaceIcon, CheckIcon, SpeakerIcon } from '../components/Icons'
import { DotHint } from './DotHint'

interface MissionScreenProps {
  data: AppData
  ledger: DailyLedger
  dateKey: string
  commit: DataCommit
  onExit: () => void
  onDone: () => void
}

export function MissionScreen({ data, ledger, dateKey, commit, onExit, onDone }: MissionScreenProps) {
  const initialIndex = ledger.awardedChallengeIds.length
  const [startedAtGoal] = useState(
    ledger.points >= data.settings.pointsGoal || Boolean(ledger.redeemedAt),
  )
  const [challengeIndex, setChallengeIndex] = useState(initialIndex)
  const [answer, setAnswer] = useState('')
  const [wrongAnswers, setWrongAnswers] = useState(0)
  const [resolved, setResolved] = useState(false)
  const challenge = useMemo(
    () => challengeFor(dateKey, challengeIndex),
    [dateKey, challengeIndex],
  )
  const showHint = wrongAnswers >= 2
  const displayedPoints = Math.min(data.settings.pointsGoal, ledger.points)

  useEffect(() => {
    if (data.settings.readAloud) speak(challenge.spokenPrompt)
  }, [challenge.spokenPrompt, data.settings.readAloud])

  useEffect(() => {
    if (startedAtGoal) onDone()
  }, [onDone, startedAtGoal])

  if (startedAtGoal) {
    return <main className="loading-screen"><p>Deine Belohnung wird bereitgemacht …</p></main>
  }

  const enterDigit = (digit: number) => {
    if (resolved) return
    setAnswer((current) => `${current}${digit}`.slice(0, 3))
  }

  const checkAnswer = (event: React.FormEvent) => {
    event.preventDefault()
    if (resolved || answer === '') return
    if (Number(answer) !== challenge.answer) {
      setWrongAnswers((count) => count + 1)
      setAnswer('')
      return
    }

    commit((current) =>
      awardResolvedChallenge(current, {
        challengeId: challenge.id,
        dateKey,
        wrongAnswers,
        hintUsed: showHint,
      }),
    )
    setResolved(true)
  }

  const next = () => {
    if (ledger.points >= data.settings.pointsGoal) {
      onDone()
      return
    }
    setChallengeIndex((index) => index + 1)
    setAnswer('')
    setWrongAnswers(0)
    setResolved(false)
  }

  return (
    <main className="mission-shell">
      <header className="mission-header">
        <button className="icon-button" onClick={onExit} aria-label="Mission verlassen"><ArrowLeftIcon /></button>
        <div className="mission-progress">
          <div className="mission-progress__labels">
            <span>Zahlenweg</span><strong>{displayedPoints} / {data.settings.pointsGoal}</strong>
          </div>
          <div className="progress-track" role="progressbar" aria-valuemin={0} aria-valuemax={data.settings.pointsGoal} aria-valuenow={displayedPoints}>
            <span style={{ width: `${(displayedPoints / data.settings.pointsGoal) * 100}%` }} />
          </div>
        </div>
        <button
          className="icon-button"
          onClick={() => speak(challenge.spokenPrompt)}
          aria-label="Aufgabe vorlesen"
        ><SpeakerIcon /></button>
      </header>

      <section className="challenge-card">
        <div className="challenge-number">Aufgabe {challengeIndex + 1}</div>
        <p className="challenge-instruction">Rechne in Ruhe.</p>
        <h1>{challenge.prompt}</h1>

        {showHint && !resolved && (
          <aside className="hint-card" aria-live="polite">
            <strong>Schau mal:</strong>
            <p>{challenge.hint}</p>
            <DotHint challenge={challenge} />
          </aside>
        )}

        <form onSubmit={checkAnswer} className={data.settings.leftHanded ? 'answer-form answer-form--left' : 'answer-form'}>
          <label className="answer-display">
            <span className="sr-only">Deine Antwort</span>
            <input
              aria-label="Deine Antwort"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="off"
              value={answer}
              disabled={resolved}
              placeholder="?"
              onChange={(event) => setAnswer(event.target.value.replace(/\D/g, '').slice(0, 3))}
            />
          </label>

          {!resolved && (
            <div className="number-pad" aria-label="Zahlentastatur">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
                <button type="button" key={digit} onClick={() => enterDigit(digit)}>{digit}</button>
              ))}
              <button type="button" className="number-pad__action" onClick={() => setAnswer((current) => current.slice(0, -1))} aria-label="Letzte Ziffer löschen"><BackspaceIcon /></button>
              <button type="button" onClick={() => enterDigit(0)}>0</button>
              <button type="submit" className="number-pad__check" disabled={!answer} aria-label="Antwort prüfen"><CheckIcon /></button>
            </div>
          )}
        </form>

        <div className="feedback-area" aria-live="polite">
          {wrongAnswers > 0 && !resolved && (
            <p className="feedback feedback--try">{showHint ? 'Nutze die Punkte und versuche es nochmals.' : 'Fast – probier es noch einmal.'}</p>
          )}
          {resolved && (
            <div className="feedback feedback--success">
              <span><CheckIcon /></span>
              <div><strong>Genau!</strong><p>Du bekommst 10 Punkte.</p></div>
              <button className="button button--primary" type="button" onClick={next}>Weiter</button>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}

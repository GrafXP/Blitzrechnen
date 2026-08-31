import { useState } from 'react'
import type { DataCommit } from '../app/usePersistentData'
import { redeemReward } from '../domain/data'
import { formatReward, redeemedReward } from '../domain/reward'
import type { AppData, DailyLedger } from '../domain/types'
import { CheckIcon, GiftIcon, ParentIcon } from '../components/Icons'
import { ParentGate } from '../parent/ParentGate'

interface DoneScreenProps {
  data: AppData
  ledger: DailyLedger
  dateKey: string
  commit: DataCommit
  onHome: () => void
}

export function DoneScreen({ data, ledger, dateKey, commit, onHome }: DoneScreenProps) {
  const [gateOpen, setGateOpen] = useState(false)
  const redeemed = redeemedReward(ledger)

  const redeem = () => {
    commit((current) => redeemReward(current, dateKey))
    setGateOpen(false)
  }

  return (
    <main className="done-shell">
      <section className="done-card">
        <div className="finish-badge" aria-hidden="true"><CheckIcon /></div>
        <p className="eyebrow">Tagesziel erreicht</p>
        <h1>Stark gerechnet!</h1>
        <p>Du hast {data.settings.pointsGoal} Punkte gesammelt. Für heute ist deine Mathe-Mission geschafft.</p>

        <div className={`voucher ${redeemed ? 'voucher--redeemed' : ''}`}>
          <div className="voucher__icon"><GiftIcon /></div>
          <span>{redeemed ? 'Eingelöste Belohnung' : 'Deine Belohnung'}</span>
          <strong>{redeemed ?? formatReward(data.settings)}</strong>
          {ledger.redeemedAt && (
            <small>
              Eingelöst um {new Intl.DateTimeFormat('de-CH', {
                timeZone: 'Europe/Zurich',
                hour: '2-digit',
                minute: '2-digit',
              }).format(new Date(ledger.redeemedAt))}
            </small>
          )}
        </div>

        {!redeemed ? (
          <button className="button button--primary button--large" onClick={() => setGateOpen(true)}>
            <ParentIcon /> Mit Elternteil einlösen
          </button>
        ) : (
          <div className="calm-finish"><span aria-hidden="true">✓</span> Jetzt ist Bildschirm-Pause.</div>
        )}
        <button className="button button--ghost" onClick={onHome}>Zurück zum Start</button>
      </section>

      {gateOpen && (
        <ParentGate
          data={data}
          commit={commit}
          title="Belohnung einlösen"
          actionLabel="Jetzt einlösen"
          onUnlocked={redeem}
          onCancel={() => setGateOpen(false)}
        />
      )}
    </main>
  )
}

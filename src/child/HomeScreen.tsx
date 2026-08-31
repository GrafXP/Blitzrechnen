import { friendlyZurichDate } from '../domain/date'
import { formatReward } from '../domain/reward'
import type { AppData, DailyLedger } from '../domain/types'
import { GiftIcon, InstallIcon, ParentIcon } from '../components/Icons'
import { ProgressRing } from '../components/ProgressRing'

interface HomeScreenProps {
  data: AppData
  ledger: DailyLedger
  online: boolean
  onStart: () => void
  onParent: () => void
  onInstall: () => void
}

export function HomeScreen({
  data,
  ledger,
  online,
  onStart,
  onParent,
  onInstall,
}: HomeScreenProps) {
  const reachedGoal = ledger.points >= data.settings.pointsGoal
  const redeemed = Boolean(ledger.redeemedAt)

  return (
    <main className="home-shell">
      <header className="home-header">
        <div className="brand-mark" aria-hidden="true">
          <span>+</span><span>−</span>
        </div>
        <div>
          <p className="eyebrow">{friendlyZurichDate()}</p>
          <h1>Mathe-Mission</h1>
        </div>
        <span className={`connection-pill ${online ? '' : 'connection-pill--offline'}`}>
          <span aria-hidden="true" />{online ? 'bereit' : 'offline'}
        </span>
      </header>

      <section className="hero-card">
        <div className="hero-copy">
          <p className="eyebrow">Dein Tagesziel</p>
          <h2>
            {redeemed
              ? 'Mission geschafft!'
              : reachedGoal
                ? 'Deine Belohnung wartet.'
                : ledger.points > 0
                  ? 'Weiter so, du bist unterwegs!'
                  : 'Bereit für deinen Zahlenweg?'}
          </h2>
          <p>
            {redeemed
              ? 'Heute hast du dein Ziel erreicht und eingelöst.'
              : 'Löse kurze Aufgaben und sammle dabei deine Tagespunkte.'}
          </p>
          <button className="button button--primary button--large" onClick={onStart}>
            {redeemed ? 'Urkunde ansehen' : reachedGoal ? 'Belohnung ansehen' : ledger.points ? 'Weiterrechnen' : 'Mission starten'}
          </button>
        </div>
        <ProgressRing points={ledger.points} goal={data.settings.pointsGoal} />
        <div className="mountain-scene" aria-hidden="true">
          <span className="sun" />
          <span className="mountain mountain--back" />
          <span className="mountain mountain--front" />
          <span className="trail-dot trail-dot--1" />
          <span className="trail-dot trail-dot--2" />
          <span className="trail-dot trail-dot--3" />
        </div>
      </section>

      <section className="reward-card" aria-label="Heutige Belohnung">
        <div className="reward-card__icon"><GiftIcon /></div>
        <div>
          <span>Deine Belohnung</span>
          <strong>{formatReward(data.settings)}</strong>
        </div>
        <span className="reward-card__status">{redeemed ? 'eingelöst' : reachedGoal ? 'bereit' : 'bei Ziel'}</span>
      </section>

      <section className="today-card">
        <div>
          <p className="eyebrow">Heute üben wir</p>
          <h2>Zahlen bis 20</h2>
          <p>Plus, Minus, Ergänzen und Verdoppeln. Ohne Zeitdruck.</p>
        </div>
        <div className="number-tiles" aria-hidden="true"><span>8</span><span>+</span><span>7</span></div>
      </section>

      <footer className="home-footer">
        <button className="text-button" onClick={onInstall}><InstallIcon /> App installieren</button>
        <button className="text-button" onClick={onParent}><ParentIcon /> Elternbereich</button>
      </footer>
    </main>
  )
}

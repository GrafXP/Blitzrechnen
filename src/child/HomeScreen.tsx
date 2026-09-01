import { friendlyZurichDate } from '../domain/date'
import { formatReward } from '../domain/reward'
import { activeRewardDefinition } from '../domain/data'
import type { AppData, DailyLedger } from '../domain/types'
import { GiftIcon, InstallIcon, ParentIcon } from '../components/Icons'
import { ProgressRing } from '../components/ProgressRing'
import { missionById } from '../game/missions'
import { BadgeShelf } from './BadgeShelf'
import { MissionMap } from './MissionMap'

interface HomeScreenProps {
  data: AppData
  ledger: DailyLedger
  online: boolean
  onStart: () => void
  onRewards: () => void
  onParent: () => void
  onInstall: () => void
}

export function HomeScreen({
  data,
  ledger,
  online,
  onStart,
  onRewards,
  onParent,
  onInstall,
}: HomeScreenProps) {
  const activeReward = activeRewardDefinition(data, ledger.dateKey)
  const pointsGoal = activeReward?.pointsGoal ?? data.settings.pointsGoal
  const reachedGoal = activeReward !== null && ledger.points >= pointsGoal
  const pendingCount = data.collectedRewards.filter((reward) => !reward.redeemedAt).length
  const redeemedCount = data.collectedRewards.filter((reward) => reward.redeemedAt).length
  const mission = missionById(ledger.missionSkin)
  const topic = {
    'zahlen-bis-100': {
      title: 'Zahlen bis 100',
      description: 'Hunderterfeld, Zehner und Einer, Zahlenweg und Ergänzen.',
    },
    'plus-minus': {
      title: 'Plus und Minus',
      description: 'Geschickte Sprünge mit Zehnern und Einern bis 100.',
    },
    'verdoppeln-halbieren': {
      title: 'Doppelt und halb',
      description: 'Gleiche Gruppen bilden, verdoppeln und halbieren.',
    },
    'groessen-sachrechnen': {
      title: 'Geld, Uhr und Längen',
      description: 'Mit Franken und Rappen rechnen, Uhren lesen und Strecken messen.',
    },
    'formen-symmetrie': {
      title: 'Figuren und Symmetrie',
      description: 'Ecken und Seiten untersuchen und Spiegelbilder ergänzen.',
    },
    'mal-teilen': {
      title: 'Mal und Teilen',
      description: data.settings.multiplicationEnabled
        ? 'Punktefelder lesen und Mengen fair aufteilen.'
        : 'Sachaufgaben üben. Mal und Teilen ist noch gesperrt.',
    },
  }[activeReward?.schoolTopic ?? data.settings.schoolTopic]

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
          <p className="eyebrow">{ledger.missionSkin ? `Deine Mission · ${mission.name}` : 'Dein Missionsziel'}</p>
          <h2>
            {!activeReward
              ? 'Welche Belohnung möchtest du?'
              : reachedGoal
              ? 'Deine Belohnung wartet.'
              : ledger.points > 0
                ? 'Weiter so, du bist unterwegs!'
                : redeemedCount > 0
                  ? 'Bereit für eine weitere Mission?'
                  : 'Bereit für deinen Zahlenweg?'}
          </h2>
          <p>
            {!activeReward
              ? 'Wähle eine Belohnung aus der Liste und sammle dafür Punkte in einer Mathe-Kategorie.'
              : pendingCount > 0 && !reachedGoal && ledger.points === 0
              ? `Du hast ${pendingCount} ${pendingCount === 1 ? 'Belohnung' : 'Belohnungen'} gesammelt. Du kannst direkt die nächste Mission machen.`
              : 'Löse kurze Aufgaben und sammle dabei Punkte für deine Belohnung.'}
          </p>
          <button className="button button--primary button--large" onClick={onStart}>
            {!activeReward ? 'Belohnung wählen' : reachedGoal ? 'Belohnung sammeln' : ledger.points ? 'Weiterrechnen' : 'Mission starten'}
          </button>
        </div>
        {activeReward && <ProgressRing points={ledger.points} goal={pointsGoal} />}
        <div className="mountain-scene" aria-hidden="true">
          <span className="sun" />
          <span className="mountain mountain--back" />
          <span className="mountain mountain--front" />
          <span className="trail-dot trail-dot--1" />
          <span className="trail-dot trail-dot--2" />
          <span className="trail-dot trail-dot--3" />
        </div>
      </section>

      <button className="reward-card reward-card--button" aria-label="Meine Belohnungen öffnen" onClick={onRewards}>
        <div className="reward-card__icon"><GiftIcon /></div>
        <div>
          <span>{activeReward ? 'Dein nächstes Ziel' : 'Deine Belohnungen'}</span>
          <strong>{activeReward ? formatReward(activeReward) : `${pendingCount} gesammelt · ${redeemedCount} eingelöst`}</strong>
        </div>
        <span className="reward-card__status">
          {reachedGoal ? 'bereit' : pendingCount > 0 ? `${pendingCount} offen` : activeReward ? `${pointsGoal} Punkte` : 'ansehen'}
        </span>
      </button>

      {ledger.missionSkin && (
        <MissionMap
          missionSkin={ledger.missionSkin}
          points={ledger.points}
          goal={pointsGoal}
          compact
        />
      )}

      <section className="today-card">
        <div>
          <p className="eyebrow">Heute üben wir</p>
          <h2>{topic.title}</h2>
          <p>{topic.description} Ohne Zeitdruck.</p>
        </div>
        <div className="number-tiles" aria-hidden="true"><span>8</span><span>+</span><span>7</span></div>
      </section>

      <BadgeShelf data={data} />

      <footer className="home-footer">
        <button className="text-button" onClick={onInstall}><InstallIcon /> App installieren</button>
        <button className="text-button" onClick={onRewards}><GiftIcon /> Meine Belohnungen</button>
        <button className="text-button" onClick={onParent}><ParentIcon /> Elternbereich</button>
      </footer>
    </main>
  )
}

import { useEffect, useState } from 'react'
import type { DataCommit } from '../app/usePersistentData'
import { playFinishSound } from '../accessibility/sound'
import { redeemReward } from '../domain/data'
import { formatReward } from '../domain/reward'
import type { AppData, DailyLedger } from '../domain/types'
import { CheckIcon, GiftIcon, ParentIcon } from '../components/Icons'
import { ParentGate } from '../parent/ParentGate'
import { missionById } from '../game/missions'
import { MissionMap } from './MissionMap'

interface DoneScreenProps {
  data: AppData
  ledger: DailyLedger
  dateKey: string
  commit: DataCommit
  onHome: () => void
}

export function DoneScreen({ data, ledger, dateKey, commit, onHome }: DoneScreenProps) {
  const [gateOpen, setGateOpen] = useState(false)
  const mission = missionById(ledger.missionSkin)

  useEffect(() => {
    if (data.settings.soundEffects) playFinishSound()
  }, [data.settings.soundEffects])

  const redeem = () => {
    commit((current) => redeemReward(current, dateKey))
    setGateOpen(false)
    onHome()
  }

  return (
    <main className={`done-shell done-shell--${mission.id}`}>
      <section className="done-card">
        <div className="finish-badge" aria-hidden="true"><CheckIcon /></div>
        <p className="eyebrow">Missionsziel erreicht</p>
        <h1>Stark gerechnet!</h1>
        <p>Du hast den {mission.destination} erreicht und {data.settings.pointsGoal} Punkte gesammelt. Nach dem Einlösen wartet eine neue Mission auf dich.</p>

        <MissionMap missionSkin={mission.id} points={ledger.points} goal={data.settings.pointsGoal} compact />

        <div className="voucher">
          <div className="voucher__icon"><GiftIcon /></div>
          <span>Deine Belohnung</span>
          <strong>{formatReward(data.settings)}</strong>
          <small>Runde {ledger.round + 1}</small>
        </div>

        <button className="button button--primary button--large" onClick={() => setGateOpen(true)}>
          <ParentIcon /> Mit Elternteil einlösen
        </button>
        <button className="button button--ghost" onClick={onHome}>Zurück zum Start</button>
      </section>

      {gateOpen && (
        <ParentGate
          data={data}
          commit={commit}
          title="Belohnung einlösen"
          actionLabel="Einlösen & neue Mission"
          onUnlocked={redeem}
          onCancel={() => setGateOpen(false)}
        />
      )}
    </main>
  )
}

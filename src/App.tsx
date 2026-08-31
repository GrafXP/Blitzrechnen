import { useEffect, useState } from 'react'
import { usePersistentData } from './app/usePersistentData'
import { useRoute } from './app/useRoute'
import { useInstallPrompt } from './app/useInstallPrompt'
import { currentLedger, hasReachedGoal } from './domain/data'
import { zurichDateKey } from './domain/date'
import { HomeScreen } from './child/HomeScreen'
import { MissionScreen } from './child/MissionScreen'
import { DoneScreen } from './child/DoneScreen'
import { ParentScreen } from './parent/ParentScreen'
import { InstallHelp } from './components/InstallHelp'
import { ServiceWorkerStatus } from './components/ServiceWorkerStatus'
import './styles.css'

export default function App() {
  const { data, loading, error, commit } = usePersistentData()
  const [route, navigate] = useRoute()
  const installPrompt = useInstallPrompt()
  const [installOpen, setInstallOpen] = useState(false)
  const [online, setOnline] = useState(navigator.onLine)

  useEffect(() => {
    const onOnline = () => setOnline(true)
    const onOffline = () => setOnline(false)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  if (loading) {
    return <main className="loading-screen"><div className="loading-mark">+</div><p>Mathe-Mission wird bereitgemacht …</p></main>
  }

  if (error || !data) {
    return (
      <main className="error-screen">
        <h1>Das hat nicht geklappt.</h1>
        <p>{error ?? 'Die App-Daten fehlen.'}</p>
        <button className="button button--primary" onClick={() => window.location.reload()}>Nochmals versuchen</button>
      </main>
    )
  }

  const dateKey = zurichDateKey()
  const ledger = currentLedger(data, dateKey)
  const reachedGoal = hasReachedGoal(data, dateKey)
  const appClassName = [
    'app',
    data.settings.highContrast ? 'app--high-contrast' : '',
    data.settings.reducedMotion ? 'app--reduced-motion' : '',
  ].filter(Boolean).join(' ')

  let screen: React.ReactNode
  if (route === '/parent') {
    screen = <ParentScreen data={data} commit={commit} onHome={() => navigate('/')} />
  } else if (route === '/mission') {
    screen = (
      <MissionScreen
        data={data}
        ledger={ledger}
        dateKey={dateKey}
        commit={commit}
        onExit={() => navigate('/')}
        onDone={() => navigate('/done')}
      />
    )
  } else if (route === '/done' && reachedGoal) {
    screen = <DoneScreen data={data} ledger={ledger} dateKey={dateKey} commit={commit} onHome={() => navigate('/')} />
  } else {
    screen = (
      <HomeScreen
        data={data}
        ledger={ledger}
        online={online}
        onStart={() => navigate(reachedGoal ? '/done' : '/mission')}
        onParent={() => navigate('/parent')}
        onInstall={() => setInstallOpen(true)}
      />
    )
  }

  return (
    <div className={appClassName}>
      {screen}
      <ServiceWorkerStatus />
      {installOpen && (
        <InstallHelp
          {...installPrompt}
          onClose={() => setInstallOpen(false)}
        />
      )}
    </div>
  )
}

import { useEffect, useState } from 'react'
import './App.css'

const initialStatus = {
  ok: null,
  title: 'Checking...',
  detail: 'Please wait while we test the connection.',
}

function App() {
  const [apiStatus, setApiStatus] = useState(initialStatus)
  const [dbStatus, setDbStatus] = useState(initialStatus)
  const [lastChecked, setLastChecked] = useState('-')

  const checkConnections = async () => {
    try {
      const apiResponse = await fetch('/api/health')
      const apiData = await apiResponse.json()

      setApiStatus({
        ok: Boolean(apiData.success),
        title: apiData.success ? 'Backend Connected' : 'Backend Error',
        detail: apiData.message || 'Backend status unavailable.',
      })
    } catch {
      setApiStatus({
        ok: false,
        title: 'Backend Disconnected',
        detail: 'Cannot reach /api/health on backend service.',
      })
    }

    try {
      const dbResponse = await fetch('/api/db-health')
      const dbData = await dbResponse.json()

      const queryResult = dbData?.data?.result?.ok
      const queryText = dbData?.data?.query || 'SELECT test query'

      setDbStatus({
        ok: Boolean(dbData.success),
        title: dbData.success ? 'PostgreSQL Connected' : 'Database Error',
        detail: dbData.success
          ? `${queryText} -> ${queryResult}`
          : dbData.message || 'Database status unavailable.',
      })
    } catch {
      setDbStatus({
        ok: false,
        title: 'Database Disconnected',
        detail: 'Cannot reach /api/db-health endpoint.',
      })
    }

    setLastChecked(new Date().toLocaleTimeString())
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      void checkConnections()
    }, 0)

    return () => clearTimeout(timer)
  }, [])

  return (
    <main className="app">
      <section className="panel">
        <h1>LIVO Connection Status</h1>
        <p className="subtitle">Monitoring backend and local PostgreSQL connection.</p>

        <div className="status-grid">
          <article className="status-card">
            <span className={`badge ${apiStatus.ok === true ? 'ok' : apiStatus.ok === false ? 'fail' : 'pending'}`}>
              {apiStatus.ok === true ? 'ONLINE' : apiStatus.ok === false ? 'OFFLINE' : 'CHECKING'}
            </span>
            <h2>Backend API</h2>
            <p>{apiStatus.title}</p>
            <p className="detail">{apiStatus.detail}</p>
          </article>

          <article className="status-card">
            <span className={`badge ${dbStatus.ok === true ? 'ok' : dbStatus.ok === false ? 'fail' : 'pending'}`}>
              {dbStatus.ok === true ? 'ONLINE' : dbStatus.ok === false ? 'OFFLINE' : 'CHECKING'}
            </span>
            <h2>Database</h2>
            <p>{dbStatus.title}</p>
            <p className="detail">{dbStatus.detail}</p>
          </article>
        </div>

        <div className="meta-row">
          <p>Last checked: {lastChecked}</p>
          <button type="button" onClick={checkConnections} className="refresh-btn">
            Recheck Connection
          </button>
        </div>
      </section>
    </main>
  )
}

export default App

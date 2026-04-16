import { useCallback, useState } from 'react'

export function useConnectionCheck() {
  const [bootMessage, setBootMessage] = useState('Preparing your financial journey...')

  const checkConnections = useCallback(async () => {
    setBootMessage('Checking backend service...')

    let apiStatus

    try {
      const apiResponse = await fetch('/api/health')
      const apiData = await apiResponse.json()

      apiStatus = {
        ok: Boolean(apiData.success),
        title: apiData.success ? 'Backend Connected' : 'Backend Error',
        detail: apiData.message || 'Backend status unavailable.',
      }
    } catch {
      apiStatus = {
        ok: false,
        title: 'Backend Disconnected',
        detail: 'Cannot reach /api/health on backend service.',
      }
    }

    setBootMessage('Checking database service...')

    let dbStatus

    try {
      const dbResponse = await fetch('/api/db-health')
      const dbData = await dbResponse.json()

      const queryResult = dbData?.data?.result?.ok
      const queryText = dbData?.data?.query || 'SELECT test query'

      dbStatus = {
        ok: Boolean(dbData.success),
        title: dbData.success ? 'PostgreSQL Connected' : 'Database Error',
        detail: dbData.success
          ? `${queryText} -> ${queryResult}`
          : dbData.message || 'Database status unavailable.',
      }
    } catch {
      dbStatus = {
        ok: false,
        title: 'Database Disconnected',
        detail: 'Cannot reach /api/db-health endpoint.',
      }
    }

    return {
      apiStatus,
      dbStatus,
      lastChecked: new Date().toLocaleTimeString(),
    }
  }, [])

  return {
    bootMessage,
    checkConnections,
  }
}

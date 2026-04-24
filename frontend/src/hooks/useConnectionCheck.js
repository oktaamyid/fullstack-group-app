import { useCallback, useState } from 'react'
import { getAuthUser } from '../services/auth'
import { getLocalSettings } from '../services/profileSettings'

function isEnglishMode() {
  const authUser = getAuthUser()
  const settings = getLocalSettings(authUser?.id || 'guest')
  return settings.language === 'en-US'
}

export function useConnectionCheck() {
  const [bootMessage, setBootMessage] = useState(isEnglishMode() ? 'Preparing your financial journey...' : 'Menyiapkan perjalanan finansialmu...')

  const checkConnections = useCallback(async () => {
    const english = isEnglishMode()
    setBootMessage(english ? 'Checking backend service...' : 'Memeriksa layanan backend...')

    let apiStatus

    try {
      const apiResponse = await fetch('/api/health')
      const apiData = await apiResponse.json()

      apiStatus = {
        ok: Boolean(apiData.success),
        title: apiData.success ? (english ? 'Backend Connected' : 'Backend Terhubung') : (english ? 'Backend Error' : 'Backend Bermasalah'),
        detail: apiData.message || (english ? 'Backend status unavailable.' : 'Status backend tidak tersedia.'),
      }
    } catch {
      apiStatus = {
        ok: false,
        title: english ? 'Backend Disconnected' : 'Backend Terputus',
        detail: english ? 'Cannot reach /api/health on backend service.' : 'Tidak dapat mengakses /api/health pada layanan backend.',
      }
    }

    setBootMessage(english ? 'Checking database service...' : 'Memeriksa layanan database...')

    let dbStatus

    try {
      const dbResponse = await fetch('/api/db-health')
      const dbData = await dbResponse.json()

      const queryResult = dbData?.data?.result?.ok
      const queryText = dbData?.data?.query || 'SELECT test query'

      dbStatus = {
        ok: Boolean(dbData.success),
        title: dbData.success ? (english ? 'PostgreSQL Connected' : 'PostgreSQL Terhubung') : (english ? 'Database Error' : 'Database Bermasalah'),
        detail: dbData.success
          ? `${queryText} -> ${queryResult}`
          : dbData.message || (english ? 'Database status unavailable.' : 'Status database tidak tersedia.'),
      }
    } catch {
      dbStatus = {
        ok: false,
        title: english ? 'Database Disconnected' : 'Database Terputus',
        detail: english ? 'Cannot reach /api/db-health endpoint.' : 'Tidak dapat mengakses endpoint /api/db-health.',
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

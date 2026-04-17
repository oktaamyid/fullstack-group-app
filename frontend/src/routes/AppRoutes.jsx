import { useCallback, useEffect, useState } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { HomeDashboard } from '../components/screens/HomeDashboard'
import { LoginAuthScreen } from '../components/screens/LoginAuthScreen'
import { LoadingScreen } from '../components/screens/LoadingScreen'
import { SplashScreen } from '../components/screens/SplashScreen'
import { initialStatus } from '../constants/connectionStatus'
import { useConnectionCheck } from '../hooks/useConnectionCheck'
import { clearAuthSession, getAuthUser, isAuthenticated, saveAuthSession } from '../services/auth'
import mainLogo from '../stitch/main-logo/main-logo.png'
import mascotImage from '../stitch/splash-loading/mascot-hamster.png'

function SplashRoute() {
  const navigate = useNavigate()

  useEffect(() => {
    const splashTimer = setTimeout(() => {
      navigate('/loading', { replace: true })
    }, 1800)

    return () => clearTimeout(splashTimer)
  }, [navigate])

  return <SplashScreen mascotImage={mascotImage} mainLogo={mainLogo} />
}

function LoadingRoute() {
  const navigate = useNavigate()
  const { bootMessage, checkConnections } = useConnectionCheck()

  useEffect(() => {
    let isCancelled = false
    const bootStart = Date.now()

    const boot = async () => {
      const result = await checkConnections()
      const elapsed = Date.now() - bootStart
      const holdLoadingMs = Math.max(0, 1200 - elapsed)

      setTimeout(() => {
        if (!isCancelled) {
          navigate('/login', {
            replace: true,
            state: result,
          })
        }
      }, holdLoadingMs)
    }

    void boot()

    return () => {
      isCancelled = true
    }
  }, [checkConnections, navigate])

  return <LoadingScreen bootMessage={bootMessage} mainLogo={mainLogo} />
}

function LoginRoute() {
  const navigate = useNavigate()
  const location = useLocation()

  if (isAuthenticated()) {
    return <Navigate to="/home" replace />
  }

  const handleAuthSuccess = ({ token, user }) => {
    saveAuthSession(token, user)
    navigate('/home', {
      replace: true,
      state: location.state,
    })
  }

  return <LoginAuthScreen onAuthSuccess={handleAuthSuccess} mainLogo={mainLogo} mascotImage={mascotImage} />
}

function HomeRoute() {
  const location = useLocation()
  const navigate = useNavigate()
  const { checkConnections } = useConnectionCheck()
  const authUser = getAuthUser()
  const [isOffline, setIsOffline] = useState(!window.navigator.onLine)
  const [apiStatus, setApiStatus] = useState(location.state?.apiStatus ?? initialStatus)
  const [dbStatus, setDbStatus] = useState(location.state?.dbStatus ?? initialStatus)
  const [lastChecked, setLastChecked] = useState(location.state?.lastChecked ?? '-')

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />
  }

  const applyCheckResult = useCallback((result) => {
    setApiStatus(result.apiStatus)
    setDbStatus(result.dbStatus)
    setLastChecked(result.lastChecked)
  }, [])

  const handleRecheck = useCallback(async () => {
    const result = await checkConnections()
    applyCheckResult(result)
  }, [applyCheckResult, checkConnections])

  const handleLogout = useCallback(() => {
    clearAuthSession()
    navigate('/login', { replace: true })
  }, [navigate])

  useEffect(() => {
    const onOnline = () => setIsOffline(false)
    const onOffline = () => setIsOffline(true)

    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)

    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  useEffect(() => {
    if (location.state?.apiStatus || location.state?.dbStatus) {
      return
    }

    void handleRecheck()
  }, [handleRecheck, location.state])

  return (
    <HomeDashboard
      isOffline={isOffline}
      apiStatus={apiStatus}
      dbStatus={dbStatus}
      lastChecked={lastChecked}
      onRecheck={handleRecheck}
      onLogout={handleLogout}
      userName={authUser?.name || 'Student'}
      mainLogo={mainLogo}
    />
  )
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/splash" replace />} />
      <Route path="/splash" element={<SplashRoute />} />
      <Route path="/loading" element={<LoadingRoute />} />
      <Route path="/login" element={<LoginRoute />} />
      <Route path="/home" element={<HomeRoute />} />
      <Route path="*" element={<Navigate to="/splash" replace />} />
    </Routes>
  )
}

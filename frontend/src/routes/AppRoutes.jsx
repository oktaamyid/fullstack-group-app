/* eslint-disable react-hooks/rules-of-hooks */
import { useCallback, useEffect, useState } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { HomeDashboard } from '../components/screens/HomeDashboard'
import { HistorySplitBillScreen } from '../components/screens/HistorySplitBillScreen'
import { LoginAuthScreen } from '../components/screens/LoginAuthScreen'
import { LoadingScreen } from '../components/screens/LoadingScreen'
import { ProfileSettingsScreen } from '../components/screens/ProfileSettingsScreen'
import { SplashScreen } from '../components/screens/SplashScreen'
import { TransactionScreen } from '../components/screens/TransactionScreen'
import { WishlistScreen } from '../components/screens/WishlistScreen'
import { AnalyticsTrendsScreen } from '../components/screens/AnalyticsTrendsScreen'
import { initialStatus } from '../constants/connectionStatus'
import { useConnectionCheck } from '../hooks/useConnectionCheck'
import { getAnalyticsOverview } from '../services/analytics'
import { clearAuthSession, getAuthUser, isAuthenticated, saveAuthSession } from '../services/auth'
import { getSplitBills } from '../services/splitBill'
import { getTransactions } from '../services/transaction'
import mainLogo from '../stitch/main-logo/main-logo.png'
import mascotImage from '../stitch/main-logo/main-logo.png'

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
  const [financeData, setFinanceData] = useState({
    splitSummary: { total: 0, paid: 0, unpaid: 0 },
    transactionSummary: { totalIncome: 0, totalExpense: 0, netBalance: 0 },
    recentTransactions: [],
    analytics: null,
  })

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

  const loadFinanceData = useCallback(async () => {
    try {
      const [splitData, analyticsData, transactionData] = await Promise.all([
        getSplitBills(),
        getAnalyticsOverview(),
        getTransactions(),
      ])

      setFinanceData({
        splitSummary: splitData.summary || { total: 0, paid: 0, unpaid: 0 },
        transactionSummary: transactionData.summary || { totalIncome: 0, totalExpense: 0, netBalance: 0 },
        recentTransactions: transactionData.transactions || [],
        analytics: analyticsData,
      })
    } catch {
      setFinanceData({
        splitSummary: { total: 0, paid: 0, unpaid: 0 },
        transactionSummary: { totalIncome: 0, totalExpense: 0, netBalance: 0 },
        recentTransactions: [],
        analytics: null,
      })
    }
  }, [])

  const handleLogout = useCallback(() => {
    clearAuthSession()
    navigate('/login', { replace: true })
  }, [navigate])

  const handleOpenSplitBill = useCallback(() => {
    navigate('/split-bill')
  }, [navigate])

  const handleOpenProfile = useCallback(() => {
    navigate('/profile')
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

  useEffect(() => {
    void loadFinanceData()
  }, [loadFinanceData])

  return (
    <HomeDashboard
      isOffline={isOffline}
      apiStatus={apiStatus}
      dbStatus={dbStatus}
      financeData={financeData}
      lastChecked={lastChecked}
      onRecheck={handleRecheck}
      onLogout={handleLogout}
      onOpenSplitBill={handleOpenSplitBill}
      onOpenProfile={handleOpenProfile}
      userName={authUser?.name || 'User'}
      mainLogo={mainLogo}
      mascotImage={mascotImage}
    />
  )
}

function SplitBillRoute() {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />
  }

  return <HistorySplitBillScreen mainLogo={mainLogo} />
}

function TransactionRoute() {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />
  }

  return <TransactionScreen mainLogo={mainLogo} />
}

function WishlistRoute() {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />
  }

  return <WishlistScreen mainLogo={mainLogo} />
}

function ProfileRoute() {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />
  }

  return <ProfileSettingsScreen mainLogo={mainLogo} />
}

function AnalyticsRoute() {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />
  }

  return <AnalyticsTrendsScreen mainLogo={mainLogo} />
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/splash" replace />} />
      <Route path="/splash" element={<SplashRoute />} />
      <Route path="/loading" element={<LoadingRoute />} />
      <Route path="/login" element={<LoginRoute />} />
      <Route path="/home" element={<HomeRoute />} />
      <Route path="/split-bill" element={<SplitBillRoute />} />
      <Route path="/transactions" element={<TransactionRoute />} />
      <Route path="/wishlist" element={<WishlistRoute />} />
      <Route path="/profile" element={<ProfileRoute />} />
      <Route path="/analytics" element={<AnalyticsRoute />} />
      <Route path="*" element={<Navigate to="/splash" replace />} />
    </Routes>
  )
}

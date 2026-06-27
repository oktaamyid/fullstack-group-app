/* eslint-disable react-hooks/rules-of-hooks */
import { useCallback, useEffect, useState } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { HomeDashboard } from '../components/screens/HomeDashboard'
import { LandingPage } from '../components/screens/LandingPage'
import { ProfileSettingsScreen } from '../components/screens/ProfileSettingsScreen'
import { TransactionScreen } from '../components/screens/TransactionScreen'
import { WishlistScreen } from '../components/screens/WishlistScreen'
import { WalletBudgetScreen } from '../components/screens/WalletBudgetScreen'
import { initialStatus } from '../constants/connectionStatus'
import { useConnectionCheck } from '../hooks/useConnectionCheck'
import { getAnalyticsOverview } from '../services/analytics'
import { clearAuthSession, getAuthUser, isAuthenticated } from '../services/auth'
import { getSplitBills } from '../services/splitBill'
import { getTransactions } from '../services/transaction'
import { getWallets } from '../services/wallet'
import { getBudgets } from '../services/budget'
import mainLogo from '../stitch/main-logo/main-logo.png'
import mascotImage from '../stitch/main-logo/main-logo.png'

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
    wallets: [],
    budgets: [],
  })

  if (!isAuthenticated()) {
    return <Navigate to="/" state={{ showLogin: true }} replace />
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
      const currentDate = new Date()
      const [splitData, analyticsData, transactionData, walletsData, budgetsData] = await Promise.all([
        getSplitBills(),
        getAnalyticsOverview(),
        getTransactions(),
        getWallets(),
        getBudgets(currentDate.getMonth() + 1, currentDate.getFullYear())
      ])

      setFinanceData({
        splitSummary: splitData.summary || { total: 0, paid: 0, unpaid: 0 },
        transactionSummary: transactionData.summary || {
          totalIncome: 0,
          totalExpense: 0,
          netBalance: 0,
        },
        recentTransactions: transactionData.transactions || [],
        analytics: analyticsData,
        wallets: walletsData || [],
        budgets: budgetsData || [],
      })
    } catch {
      setFinanceData({
        splitSummary: { total: 0, paid: 0, unpaid: 0 },
        transactionSummary: { totalIncome: 0, totalExpense: 0, netBalance: 0 },
        recentTransactions: [],
        analytics: null,
        wallets: [],
        budgets: [],
      })
    }
  }, [])

  const handleLogout = useCallback(() => {
    clearAuthSession()
    navigate('/', { replace: true, state: { showLogin: true } })
  }, [navigate])

  const handleOpenSplitBill = useCallback(() => {
    navigate('/transactions')
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
      onTransactionCreated={loadFinanceData}
      userName={authUser?.name || 'User'}
      mainLogo={mainLogo}
      mascotImage={mascotImage}
    />
  )
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


function WalletRoute() {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />
  }

  return <WalletBudgetScreen mainLogo={mainLogo} />
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage mainLogo={mainLogo} mascotImage={mascotImage} />} />
      <Route path="/home" element={<HomeRoute />} />
      <Route path="/transactions" element={<TransactionRoute />} />
      <Route path="/wishlist" element={<WishlistRoute />} />
      <Route path="/profile" element={<ProfileRoute />} />
      <Route path="/wallet" element={<WalletRoute />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

import { useCallback, useState } from 'react'
import { PageLayout } from '../layouts/PageLayout'
import { AppHeader } from '../headers/AppHeader'
import { StatusPill } from '../ui/StatusPill'
import { CreateTransactionModal } from '../modals/CreateTransactionModal'

function toRupiah(value) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value || 0)
}

export function HomeDashboard({ isOffline, apiStatus, dbStatus, financeData, lastChecked, onRecheck, onOpenSplitBill, onOpenProfile, mainLogo, mascotImage }) {
  const [showTransactionModal, setShowTransactionModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const splitSummary = financeData?.splitSummary || { total: 0, paid: 0, unpaid: 0 }
  const transactionSummary = financeData?.transactionSummary || { totalIncome: 0, totalExpense: 0, netBalance: 0 }
  const analytics = financeData?.analytics
  const recentTransactions = financeData?.recentTransactions || []

  const weeklySpend = analytics?.totals?.weeklyTotal || 0
  const averageDaily = analytics?.totals?.averageDaily || 0
  const dailyLimit = Math.max(1, Math.round(averageDaily * 1.2) || 100000)
  const progress = Math.min(100, (averageDaily / dailyLimit) * 100)

  const handleAddTransactionClick = useCallback(() => {
    setShowTransactionModal(true)
  }, [])

  const handleSearchChange = useCallback((e) => {
    setSearchQuery(e.target.value)
    // TODO: Implement search functionality to filter transactions/split bills
  }, [])

  const header = (
    <AppHeader
      mainLogo={mainLogo}
      onSettingsClick={onOpenProfile}
      onRefreshClick={onRecheck}
      onAddTransactionClick={handleAddTransactionClick}
      onSearchChange={handleSearchChange}
    />
  )

  return (
    <>
      <PageLayout header={header} className="space-y-6 lg:space-y-8">
      <div className="space-y-6 lg:grid lg:grid-cols-12 lg:gap-6 lg:space-y-0">
        <section className="lg:col-span-7">
          <div className="rounded-xl border border-[#1c1c13] bg-[#fffbeb] p-6 shadow-[6px_6px_0px_0px_rgba(28,28,19,1)]">
            <div className="mb-4 flex items-start justify-between">
              <span className="rounded-full border border-[#1c1c13] bg-[#4648d4] px-3 py-1 text-[10px] font-bold tracking-widest text-white uppercase">
                Active Limit
              </span>
              <img
                src={mainLogo}
                alt="LIVO Main Logo"
                className="h-10 w-auto rounded-md border border-[#1c1c13] bg-white px-2 py-1"
              />
            </div>

            <h2 className="mb-1 text-sm font-semibold tracking-tight text-[#464554] uppercase">Daily Spending Limit</h2>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-black">{toRupiah(dailyLimit)}</span>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <StatusPill ok={apiStatus.ok} label="Backend" />
              <StatusPill ok={dbStatus.ok} label="Database" />
              <span
                className={`rounded-full border border-[#1c1c13] px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${isOffline ? 'bg-[#ffdad6] text-[#93000a]' : 'bg-[#e1e0ff] text-[#2f2ebe]'}`}
              >
                {isOffline ? 'Offline Mode' : 'Live Sync'}
              </span>
            </div>

            <div className="mt-6 border-t border-[#1c1c13] pt-6">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-bold text-[#464554] uppercase">Today's Progress</span>
                <span className="text-xs font-black text-[#4648d4]">
                  {toRupiah(averageDaily)} / {toRupiah(dailyLimit)}
                </span>
              </div>

              <div className="h-4 w-full overflow-hidden rounded-full border border-[#1c1c13] bg-white">
                <div
                  className="h-full border-r border-[#1c1c13] bg-[#ffc329]"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-4 lg:col-span-5">
          <div className="flex flex-col items-center justify-center space-y-2 rounded-xl border border-[#1c1c13] bg-[#f8f4e4] p-4 shadow-[4px_4px_0px_0px_rgba(28,28,19,1)]">
            <div className="relative h-20 w-20">
              <svg className="h-full w-full -rotate-90">
                <circle cx="40" cy="40" r="32" fill="transparent" stroke="#1c1c13" strokeWidth="8" opacity="0.12" />
                <circle
                  cx="40"
                  cy="40"
                  r="32"
                  fill="transparent"
                  stroke="#4648d4"
                  strokeWidth="8"
                  strokeDasharray="201"
                  strokeDashoffset={201 - (201 * progress) / 100}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-black">{Math.round(progress)}%</span>
              </div>
            </div>
            <span className="text-center text-[10px] font-bold text-[#464554] uppercase">Efficiency Score</span>
          </div>

          <div className="flex flex-col justify-between rounded-xl border border-[#1c1c13] bg-[#ffc329] p-4 shadow-[4px_4px_0px_0px_rgba(28,28,19,1)]">
            <div className="flex items-start justify-between">
              <span className="material-symbols-outlined font-bold">trending_up</span>
              <span className="rounded border border-[#1c1c13] bg-white/40 px-2 py-0.5 text-[10px] font-black">{Math.round(progress)}%</span>
            </div>
            <div>
              <span className="block text-2xl leading-none font-black">{toRupiah(weeklySpend)}</span>
              <span className="text-[10px] font-bold opacity-80 uppercase">Weekly Spend</span>
            </div>
          </div>
        </section>

        <section className="space-y-4 lg:col-span-7">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-black tracking-tight uppercase">Recent Activity</h3>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onOpenSplitBill}
                className="min-h-11 rounded-xl border border-[#1c1c13] bg-[#fbbf24] px-3 text-[10px] font-black uppercase shadow-[2px_2px_0px_0px_rgba(28,28,19,1)]"
              >
                History & Split
              </button>
            </div>
          </div>
          <div className="space-y-3">
            {recentTransactions.length > 0 ? (
              recentTransactions.slice(0, 3).map((entry) => {
                const isIncome = entry.type === 'INCOME'

                return (
                <div
                  key={entry.id}
                  className="flex items-center justify-between rounded-lg border border-[#1c1c13] bg-white p-4 shadow-[2px_2px_0px_0px_rgba(28,28,19,1)] transition-all active:translate-x-px active:translate-y-px active:shadow-none"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded border border-[#1c1c13] bg-[#c0c1ff]">
                      <span className="material-symbols-outlined">{isIncome ? 'arrow_circle_up' : 'arrow_circle_down'}</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold">{entry.note || `${isIncome ? 'Income' : 'Expense'} Transaction`}</p>
                      <p className="text-[10px] font-bold text-[#464554] opacity-60 uppercase">
                        {entry.category || 'Other'} • {new Date(entry.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span className={`font-black ${isIncome ? 'text-[#4648d4]' : 'text-[#ba1a1a]'}`}>
                    {isIncome ? '+' : '-'}{toRupiah(entry.amount)}
                  </span>
                </div>
                )
              })
            ) : (
              <div className="rounded-lg border border-[#1c1c13] bg-white p-4 text-sm font-semibold">
                Belum ada aktivitas keuangan.
              </div>
            )}
          </div>
        </section>

        <section className="lg:col-span-5">
          <div className="rounded-2xl border-2 border-white bg-[#1c1c13] p-6 text-white shadow-[6px_6px_0px_0px_rgba(28,28,19,1)]">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="mb-1 text-xl leading-none font-black">Financial Milestone</h4>
                <p className="max-w-50 text-xs opacity-80">
                  Net balance saat ini {toRupiah(transactionSummary.netBalance)} dengan pemasukan {toRupiah(transactionSummary.totalIncome)}.
                </p>
              </div>
              <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white bg-[#ffc329]">
                <span className="material-symbols-outlined text-3xl text-[#1c1c13]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  workspace_premium
                </span>
              </div>
            </div>

            <button
              type="button"
              className="mt-4 w-full rounded-lg border border-[#1c1c13] bg-white py-3 text-xs font-black text-[#1c1c13] uppercase shadow-[4px_4px_0px_0px_rgba(255,195,41,1)] transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
            >
              View Progress
            </button>
          </div>
        </section>

        <section className="rounded-xl border border-[#1c1c13] bg-white p-4 shadow-[2px_2px_0px_0px_rgba(28,28,19,1)] lg:col-span-5 lg:self-start">
          <p className="text-xs font-bold text-[#464554] uppercase">Connection Snapshot</p>
          <p className="mt-2 text-sm font-semibold">Backend: {apiStatus.title}</p>
          <p className="text-sm font-semibold">Database: {dbStatus.title}</p>
          <p className="mt-1 text-xs text-[#464554]">Last checked: {lastChecked}</p>
        </section>
      </div>
    </PageLayout>

    {showTransactionModal && (
      <CreateTransactionModal
        onClose={() => setShowTransactionModal(false)}
        onSuccess={() => {
          setShowTransactionModal(false)
          // TODO: Refresh transaction data on success
        }}
      />
    )}
  </>
  )
}

import { BottomNavigation } from '../navigation/BottomNavigation'

function StatusPill({ ok, label }) {
  const base = 'rounded-full border border-[#1c1c13] px-2 py-0.5 text-[10px] font-black uppercase tracking-wide'

  if (ok === true) {
    return <span className={`${base} bg-[#bbf7d0] text-[#14532d]`}>{label}: Online</span>
  }

  if (ok === false) {
    return <span className={`${base} bg-[#fecaca] text-[#7f1d1d]`}>{label}: Offline</span>
  }

  return <span className={`${base} bg-[#ddd6fe] text-[#312e81]`}>{label}: Checking</span>
}

export function HomeDashboard({ isOffline, apiStatus, dbStatus, lastChecked, onRecheck, onOpenSplitBill, onOpenAnalytics, onOpenProfile, mainLogo, mascotImage }) {
  const dailyLimit = 25
  const spentToday = dbStatus.ok ? 12.4 : 0
  const progress = Math.min(100, (spentToday / dailyLimit) * 100)

  return (
    <div className="min-h-svh bg-[#fdf9e9] pb-32 text-[#1c1c13]">
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-[#1c1c13] bg-[#fffbeb] px-4 py-2 shadow-[4px_4px_0px_0px_rgba(28,28,19,1)]">
        <div className="flex items-center gap-3">
          <img
            src={mascotImage}
            alt="Hamster mascot logo"
            className="h-10 w-10 rounded-full border border-[#1c1c13] bg-[#ffc329] p-1 object-cover"
          />
          <span className="text-2xl font-black tracking-tight">LIVO</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenProfile}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#1c1c13] bg-white shadow-[2px_2px_0px_0px_rgba(28,28,19,1)] transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
            aria-label="Open profile settings"
          >
            <span className="material-symbols-outlined">settings</span>
          </button>
          <button
            type="button"
            onClick={onRecheck}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#1c1c13] bg-[#fffbeb] shadow-[2px_2px_0px_0px_rgba(28,28,19,1)] transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
            aria-label="Refresh connection status"
          >
            <span className="material-symbols-outlined">sync</span>
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-md space-y-6 px-4 pt-8">
        <section>
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
              <span className="text-4xl font-black">$</span>
              <span className="text-6xl font-black tracking-tighter">{dailyLimit.toFixed(2)}</span>
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
                  ${spentToday.toFixed(2)} / ${dailyLimit.toFixed(2)}
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

        <section className="grid grid-cols-2 gap-4">
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
              <span className="rounded border border-[#1c1c13] bg-white/40 px-2 py-0.5 text-[10px] font-black">+12%</span>
            </div>
            <div>
              <span className="block text-2xl leading-none font-black">$145.20</span>
              <span className="text-[10px] font-bold opacity-80 uppercase">Weekly Savings</span>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-black tracking-tight uppercase">Recent Transactions</h3>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onOpenAnalytics}
                className="min-h-11 rounded-xl border border-[#1c1c13] bg-[#6366f1] px-3 text-[10px] font-black uppercase text-white shadow-[2px_2px_0px_0px_rgba(28,28,19,1)]"
              >
                Analytics
              </button>
              <button
                type="button"
                onClick={onOpenSplitBill}
                className="min-h-11 rounded-xl border border-[#1c1c13] bg-[#fbbf24] px-3 text-[10px] font-black uppercase shadow-[2px_2px_0px_0px_rgba(28,28,19,1)]"
              >
                Split Bill
              </button>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border border-[#1c1c13] bg-white p-4 shadow-[2px_2px_0px_0px_rgba(28,28,19,1)] transition-all active:translate-x-px active:translate-y-px active:shadow-none">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded border border-[#1c1c13] bg-[#c0c1ff]">
                  <span className="material-symbols-outlined">coffee</span>
                </div>
                <div>
                  <p className="text-sm font-bold">Morning Espresso</p>
                  <p className="text-[10px] font-bold text-[#464554] opacity-60 uppercase">Food & Drink • 08:30 AM</p>
                </div>
              </div>
              <span className="font-black text-[#ba1a1a]">-$4.50</span>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-[#1c1c13] bg-white p-4 shadow-[2px_2px_0px_0px_rgba(28,28,19,1)] transition-all active:translate-x-px active:translate-y-px active:shadow-none">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded border border-[#1c1c13] bg-[#ffb783]">
                  <span className="material-symbols-outlined">directions_bus</span>
                </div>
                <div>
                  <p className="text-sm font-bold">Metro Ticket</p>
                  <p className="text-[10px] font-bold text-[#464554] opacity-60 uppercase">Transport • 09:15 AM</p>
                </div>
              </div>
              <span className="font-black text-[#ba1a1a]">-$2.25</span>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-[#1c1c13] bg-white p-4 shadow-[2px_2px_0px_0px_rgba(28,28,19,1)] transition-all active:translate-x-px active:translate-y-px active:shadow-none">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded border border-[#1c1c13] bg-[#ffdf9f]">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                    add
                  </span>
                </div>
                <div>
                  <p className="text-sm font-bold">Wallet Refund</p>
                  <p className="text-[10px] font-bold text-[#464554] opacity-60 uppercase">Refund • Yesterday</p>
                </div>
              </div>
              <span className="font-black text-[#4648d4]">+$10.00</span>
            </div>
          </div>
        </section>

        <section className="pb-8">
          <div className="rounded-2xl border-2 border-white bg-[#1c1c13] p-6 text-white shadow-[6px_6px_0px_0px_rgba(28,28,19,1)]">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="mb-1 text-xl leading-none font-black">Join the Honor Roll</h4>
                <p className="max-w-50 text-xs opacity-80">
                  Spend within your limit for 5 days to unlock the Academic Excellence badge.
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
              View Challenges
            </button>
          </div>
        </section>

        <section className="rounded-xl border border-[#1c1c13] bg-white p-4 shadow-[2px_2px_0px_0px_rgba(28,28,19,1)]">
          <p className="text-xs font-bold text-[#464554] uppercase">Connection Snapshot</p>
          <p className="mt-2 text-sm font-semibold">Backend: {apiStatus.title}</p>
          <p className="text-sm font-semibold">Database: {dbStatus.title}</p>
          <p className="mt-1 text-xs text-[#464554]">Last checked: {lastChecked}</p>
        </section>
      </main>

      <BottomNavigation />
    </div>
  )
}

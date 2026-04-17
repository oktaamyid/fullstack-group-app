export function HomeDashboard({ isOffline, apiStatus, dbStatus, lastChecked, onRecheck, onLogout, userName, mainLogo }) {
  return (
    <main className="flex min-h-svh items-center justify-center bg-[#fffbeb] px-3.5 py-5">
      <section className="w-full max-w-195 rounded-2xl border border-black bg-[#fff9dc] p-4.5 text-left md:p-5.5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="m-0 text-[1.9rem] leading-tight font-extrabold tracking-[-0.02em] text-[#1c1c13]">
              LIVO Connection Status
            </h1>
            <p className="mt-1 mb-1 text-[#464554]">Monitoring backend and local PostgreSQL connection.</p>
            <p className="text-sm font-semibold text-[#313244]">Logged in as: {userName}</p>
          </div>
          <img
            src={mainLogo}
            alt="LIVO Main Logo"
            className="hidden h-14 w-auto rounded-xl border border-black bg-white p-1.5 shadow-[2px_2px_0_#1c1c13] sm:block"
          />
        </div>

        <p
          className={`mb-3 inline-flex rounded-full border border-black px-3 py-2 text-sm font-semibold ${isOffline ? 'bg-[#fee2e2]' : 'bg-[#dcfce7]'}`}
        >
          {isOffline ? 'Offline mode: showing latest cached status.' : 'Online: live status checks enabled.'}
        </p>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <article className="rounded-2xl border border-black bg-white p-3.5">
            <span
              className={`inline-flex min-h-7 items-center justify-center rounded-full border border-black px-2.5 py-1 text-xs font-bold tracking-[0.03em] ${apiStatus.ok === true ? 'bg-amber-300' : apiStatus.ok === false ? 'bg-red-200' : 'bg-violet-200'}`}
            >
              {apiStatus.ok === true ? 'ONLINE' : apiStatus.ok === false ? 'OFFLINE' : 'CHECKING'}
            </span>
            <h2 className="mt-2 mb-1 text-[1.1rem] font-bold text-[#1c1c13]">Backend API</h2>
            <p className="text-[#25251f]">{apiStatus.title}</p>
            <p className="mt-2 wrap-break-word font-mono text-sm text-[#464554]">{apiStatus.detail}</p>
          </article>

          <article className="rounded-2xl border border-black bg-white p-3.5">
            <span
              className={`inline-flex min-h-7 items-center justify-center rounded-full border border-black px-2.5 py-1 text-xs font-bold tracking-[0.03em] ${dbStatus.ok === true ? 'bg-amber-300' : dbStatus.ok === false ? 'bg-red-200' : 'bg-violet-200'}`}
            >
              {dbStatus.ok === true ? 'ONLINE' : dbStatus.ok === false ? 'OFFLINE' : 'CHECKING'}
            </span>
            <h2 className="mt-2 mb-1 text-[1.1rem] font-bold text-[#1c1c13]">Database</h2>
            <p className="text-[#25251f]">{dbStatus.title}</p>
            <p className="mt-2 wrap-break-word font-mono text-sm text-[#464554]">{dbStatus.detail}</p>
          </article>
        </div>

        <div className="mt-3.5 flex flex-col items-start gap-2.5 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-[#464554]">Last checked: {lastChecked}</p>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <button
              type="button"
              onClick={onRecheck}
              className="min-h-11 rounded-2xl border border-black bg-[#6366f1] px-4 py-2.5 font-bold text-white transition-transform hover:-translate-y-px active:translate-y-0"
            >
              Recheck Connection
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="min-h-11 rounded-2xl border border-black bg-white px-4 py-2.5 font-bold text-[#1c1c13] transition-transform hover:-translate-y-px active:translate-y-0"
            >
              Logout
            </button>
          </div>
        </div>
      </section>
    </main>
  )
}

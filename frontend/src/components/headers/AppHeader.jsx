/**
 * AppHeader - Standard header for main app pages
 * Features: main logo, LIVO title, action buttons, search input
 *
 * @param {Object} props
 * @param {string} props.mainLogo - URL to main logo image
 * @param {function} props.onSettingsClick - Callback for settings button
 * @param {function} props.onRefreshClick - Callback for refresh button
 * @param {function} props.onAddTransactionClick - Callback for add transaction button (desktop)
 * @param {function} props.onSearchChange - Callback for search input change
 * @param {string} props.className - Additional classes
 */
export function AppHeader({ mainLogo, onSettingsClick, onRefreshClick, onAddTransactionClick, onSearchChange, className = '' }) {
  return (
    <header
      className={`sticky top-0 z-50 border-b border-[#1c1c13] bg-[#fffbeb] px-4 py-3 shadow-[4px_4px_0px_0px_rgba(28,28,19,1)] lg:py-4 ${className}`}
    >
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 lg:max-w-none lg:justify-between">
        <div className="flex items-center gap-3 lg:hidden">
          <img src={mainLogo} alt="LIVO mascot" className="h-10 w-auto rounded-md border border-[#1c1c13] bg-white p-1" />
          <span className="text-2xl font-black tracking-tight">LIVO</span>
        </div>

        <div className="hidden min-w-0 flex-1 items-center gap-4 lg:flex">
          <div className="min-w-0">
            <h2 className="text-2xl font-black tracking-tight text-[#1c1c13]">Dashboard</h2>
          </div>

          <label className="ml-auto flex h-11 w-full max-w-md items-center gap-2 rounded-2xl border border-[#1c1c13] bg-white px-3 shadow-[2px_2px_0px_0px_rgba(28,28,19,1)]">
            <span className="material-symbols-outlined text-[#464554]">search</span>
            <input
              type="text"
              placeholder="Search..."
              onChange={onSearchChange}
              className="w-full border-0 bg-transparent text-sm outline-none placeholder:text-[#464554]"
            />
          </label>
        </div>

        <div className="flex items-center gap-2 lg:gap-3">
          {onSettingsClick && (
            <button
              type="button"
              onClick={onSettingsClick}
              className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#1c1c13] bg-white shadow-[2px_2px_0px_0px_rgba(28,28,19,1)] transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
              aria-label="Settings"
            >
              <span className="material-symbols-outlined">settings</span>
            </button>
          )}

          {onRefreshClick && (
            <button
              type="button"
              onClick={onRefreshClick}
              className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#1c1c13] bg-[#fffbeb] shadow-[2px_2px_0px_0px_rgba(28,28,19,1)] transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
              aria-label="Refresh"
            >
              <span className="material-symbols-outlined">sync</span>
            </button>
          )}

          {onAddTransactionClick && (
            <button
              type="button"
              onClick={onAddTransactionClick}
              className="hidden h-11 items-center gap-2 rounded-2xl border border-[#1c1c13] bg-[#6366f1] px-4 text-sm font-black text-white shadow-[2px_2px_0px_0px_rgba(28,28,19,1)] transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-none lg:inline-flex"
            >
              <span className="material-symbols-outlined">add</span>
              Add Transaction
            </button>
          )}

          <img
            src={mainLogo}
            alt="LIVO avatar"
            className="hidden h-10 w-10 rounded-full border border-[#1c1c13] bg-white object-cover shadow-[2px_2px_0px_0px_rgba(28,28,19,1)] lg:block"
          />
        </div>
      </div>
    </header>
  )
}

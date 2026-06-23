import { useI18n } from '../../i18n/useI18n'
import { Button } from '../ui/Button'

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
 * @param {string} props.userName - User name used for the mobile profile initial
 * @param {string} props.className - Additional classes
 */
export function AppHeader({ mainLogo, onSettingsClick, onRefreshClick, onAddTransactionClick, onSearchChange, userName = '', className = '' }) {
  const { t } = useI18n()
  const userInitial = userName.trim().charAt(0).toUpperCase() || 'L'

  return (
    <header
      className={`sticky top-0 z-50 border-b border-[#1c1c13] bg-[#fffbeb] px-4 py-3 shadow-[4px_4px_0px_0px_rgba(28,28,19,1)] lg:py-4 ${className}`}
    >
      <div className="mx-auto flex w-full max-w-6xl items-center gap-3 lg:max-w-none">
        <div className="flex shrink-0 items-center gap-3 lg:hidden">
          <img src={mainLogo} alt="LIVO mascot" className="h-10 w-auto rounded-md border border-[#1c1c13] bg-white p-1" />
          <span className="text-2xl font-black tracking-tight">LIVO</span>
        </div>

        <div className="hidden min-w-0 flex-1 items-center gap-4 lg:flex">
          <div className="min-w-0">
            <h2 className="text-2xl font-black tracking-tight text-[#1c1c13]">{t('dashboard', 'Dashboard')}</h2>
          </div>

          <label className="ml-auto flex h-11 w-full max-w-md items-center gap-2 rounded-2xl border border-[#1c1c13] bg-white px-3 shadow-[2px_2px_0px_0px_rgba(28,28,19,1)]">
            <span className="material-symbols-outlined text-[#464554]">search</span>
            <input
              type="text"
              placeholder={t('searchPlaceholder', 'Search...')}
              onChange={onSearchChange}
              className="w-full border-0 bg-transparent text-sm outline-none placeholder:text-[#464554]"
            />
          </label>
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-2 lg:hidden">
          {onRefreshClick && (
            <Button
              variant="secondary"
              size="icon"
              className="bg-[#fffbeb]"
              onClick={onRefreshClick}
              aria-label={t('refresh', 'Refresh')}
            >
              <span className="material-symbols-outlined">sync</span>
            </Button>
          )}

          {onSettingsClick && (
            <Button
              variant="secondary"
              size="icon"
              onClick={onSettingsClick}
              aria-label={t('settings', 'Settings')}
            >
              <span className="material-symbols-outlined">settings</span>
            </Button>
          )}

          <button
            type="button"
            onClick={onSettingsClick}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-[#1c1c13] bg-[#6366f1] text-sm font-black text-white shadow-[2px_2px_0px_0px_rgba(28,28,19,1)] transition-all active:translate-x-px active:translate-y-px active:shadow-none"
            aria-label={t('profile', 'Profile')}
          >
            {userInitial}
          </button>
        </div>

        <div className="ml-auto hidden shrink-0 items-center gap-3 lg:flex">
          {onSettingsClick && (
            <Button
              variant="secondary"
              size="icon"
              onClick={onSettingsClick}
              aria-label={t('settings', 'Settings')}
            >
              <span className="material-symbols-outlined">settings</span>
            </Button>
          )}

          {onRefreshClick && (
            <Button
              variant="secondary"
              size="icon"
              className="bg-[#fffbeb]"
              onClick={onRefreshClick}
              aria-label={t('refresh', 'Refresh')}
            >
              <span className="material-symbols-outlined">sync</span>
            </Button>
          )}

          {onAddTransactionClick && (
            <Button
              size="sm"
              onClick={onAddTransactionClick}
              className="min-h-11 gap-2 rounded-2xl"
            >
              <span className="material-symbols-outlined">add</span>
              {t('addTransaction', 'Add Transaction')}
            </Button>
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

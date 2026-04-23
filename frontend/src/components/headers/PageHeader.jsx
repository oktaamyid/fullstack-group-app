import { Link } from 'react-router-dom'

/**
 * PageHeader - Header for settings/profile pages
 * Features: main logo, title, back button
 *
 * @param {Object} props
 * @param {string} props.mainLogo - URL to main logo image
 * @param {string} props.title - Page title
 * @param {string} props.backLink - Link to navigate back (default: /home)
 * @param {string} props.className - Additional classes
 */
export function PageHeader({
  mainLogo,
  title,
  backLink = '/home',
  className = '',
}) {
  return (
    <header
      className={`sticky top-0 z-50 border-b border-[#1c1c13] bg-[#fffbeb] px-4 py-3 shadow-[4px_4px_0px_0px_rgba(28,28,19,1)] lg:static lg:border-0 lg:bg-transparent lg:px-5 lg:py-0 lg:shadow-none ${className}`}
    >
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 lg:block lg:max-w-none">
        <div className="flex min-w-0 items-center gap-3 lg:hidden">
          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-[#1c1c13] bg-[#ffc329]">
            <img
              src={mainLogo}
              alt="LIVO mascot"
              className="h-full w-full object-contain"
            />
          </div>
          <div className="min-w-0 ">
            <h1 className="text-lg font-extrabold leading-tight truncate">{title}</h1>
          </div>
        </div>

        <div className="hidden lg:block">
          <div className="mt-2 flex items-end justify-between gap-4 border-b border-[#1c1c13] pb-4">
            <div>
              <h1 className="text-4xl font-black tracking-tight text-[#1c1c13]">{title}</h1>
            </div>

            <Link
              to={backLink}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#1c1c13] bg-white shadow-[2px_2px_0px_0px_rgba(28,28,19,1)] transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
              aria-label="Back"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </Link>
          </div>
        </div>

        <Link
          to={backLink}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[#1c1c13] bg-white shadow-[2px_2px_0px_0px_rgba(28,28,19,1)] transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-none lg:hidden"
          aria-label="Back"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
      </div>
    </header>
  )
}

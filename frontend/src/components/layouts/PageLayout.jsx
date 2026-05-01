import { Link, useLocation } from 'react-router-dom'
import { BottomNavigation } from '../navigation/BottomNavigation'

const desktopNavItems = [
  { to: '/home', icon: 'dashboard', label: 'Dashboard' },
  { to: '/split-bill', icon: 'receipt_long', label: 'History & Split' },
  { to: '/transactions', icon: 'payments', label: 'Transactions' },
  { to: '/wishlist', icon: 'favorite', label: 'Wishlist' },
  { to: '/profile', icon: 'person', label: 'Profile' },
]

/**
 * PageLayout - Main app layout wrapper
 * Provides consistent header, main content area, and bottom navigation
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Page content
 * @param {React.ReactNode} props.header - Header component to display
 * @param {string} props.className - Additional classes for main content
 */
export function PageLayout({ children, header, className = '' }) {
  const location = useLocation()

  return (
    <div className="flex min-h-svh flex-col overflow-x-hidden bg-[#fdf9e9] text-[#1c1c13]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-[#1c1c13] bg-[#fdf9e9] px-6 py-5 lg:flex">
        <div className="border-b border-[#1c1c13] pb-4">
          <div className="text-2xl font-black tracking-tight">LIVO</div>
        </div>

        <nav className="mt-5 flex flex-1 flex-col gap-2">
          {desktopNavItems.map((item) => {
            const active = location.pathname === item.to

            return (
              <Link
                key={item.to}
                to={item.to}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center gap-3 rounded-2xl border border-[#1c1c13] px-4 py-3 text-sm font-bold transition-transform active:translate-x-px active:translate-y-px ${
                  active
                    ? 'bg-[#4648d4] text-white shadow-[2px_2px_0px_0px_rgba(28,28,19,1)]'
                    : 'bg-transparent hover:-translate-y-px hover:bg-[#ffc329] hover:shadow-[2px_2px_0px_0px_rgba(28,28,19,1)]'
                }`}
              >
                <span className="material-symbols-outlined" style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* <button
          type="button"
          className="mt-auto w-full rounded-2xl border border-[#1c1c13] bg-[#ffc329] px-4 py-3 text-sm font-black shadow-[2px_2px_0px_0px_rgba(28,28,19,1)] transition-transform active:translate-x-px active:translate-y-px"
        >
          Upgrade Plan
        </button> */}
      </aside>

      {/* Header */}
      {header && <div className="sticky top-0 z-40 lg:ml-64 lg:w-[calc(100%-16rem)]">{header}</div>}

      {/* Main Content */}
      <main className={`flex-1 w-full px-4 pt-6 pb-32 lg:ml-64 lg:w-[calc(100%-16rem)] lg:px-8 lg:pt-8 lg:pb-8 ${className}`}>
        {children}
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  )
}

import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { CreateTransactionModal } from '../modals/CreateTransactionModal'

function NavItem({ icon, label, active = false, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center justify-center p-2 text-[#1c1c13] transition-transform duration-100 active:scale-95 ${active ? 'rounded-2xl border border-[#1c1c13] bg-[#fbbf24] px-4 py-1 shadow-[2px_2px_0px_0px_rgba(28,28,19,1)]' : ''}`}
      aria-pressed={active}
    >
      <span className="material-symbols-outlined" style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}>
        {icon}
      </span>
      <span className="text-[10px] font-bold uppercase">{label}</span>
    </button>
  )
}

export function BottomNavigation() {
  const navigate = useNavigate()
  const location = useLocation()
  const [showCreateModal, setShowCreateModal] = useState(false)

  const isActive = (path) => location.pathname === path

  return (
    <>
      <nav className="fixed bottom-0 left-0 z-50 flex w-full items-center justify-around rounded-t-3xl border-t border-l border-r border-[#1c1c13] bg-[#fffbeb] px-4 pt-3 pb-6 shadow-[0px_-4px_0px_0px_rgba(28,28,19,1)]">
        <NavItem icon="home" label="Home" active={isActive('/home')} onClick={() => navigate('/home')} />
        <NavItem icon="history" label="History" active={isActive('/split-bill')} onClick={() => navigate('/split-bill')} />
        <NavItem icon="favorite" label="Wishlist" active={isActive('/wishlist')} onClick={() => navigate('/wishlist')} />
        <NavItem icon="analytics" label="Insights" active={isActive('/analytics')} onClick={() => navigate('/analytics')} />
        <NavItem icon="person" label="Profile" active={isActive('/profile')} onClick={() => navigate('/profile')} />
      </nav>

      <button
        type="button"
        onClick={() => setShowCreateModal(true)}
        className="fixed right-6 bottom-28 flex h-14 w-14 items-center justify-center rounded-full border-2 border-[#1c1c13] bg-[#4648d4] text-white shadow-[4px_4px_0px_0px_rgba(28,28,19,1)] transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
        aria-label="Add transaction"
      >
        <span className="material-symbols-outlined text-3xl">add</span>
      </button>

      {showCreateModal && (
        <CreateTransactionModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => setShowCreateModal(false)}
        />
      )}
    </>
  )
}

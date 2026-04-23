import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { CreateSplitBillModal } from '../modals/CreateSplitBillModal'

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
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-[#1c1c13] bg-[#fffbeb] px-3 pt-3 pb-[calc(env(safe-area-inset-bottom)+1rem)] shadow-[0px_-4px_0px_0px_rgba(28,28,19,1)] lg:hidden">
        <NavItem icon="home" label="Home" active={isActive('/home')} onClick={() => navigate('/home')} />
        <NavItem icon="history" label="History" active={isActive('/split-bill')} onClick={() => navigate('/split-bill')} />
        <NavItem icon="payments" label="Transactions" active={isActive('/transactions')} onClick={() => navigate('/transactions')} />
        <NavItem icon="favorite" label="Wishlist" active={isActive('/wishlist')} onClick={() => navigate('/wishlist')} />
        <NavItem icon="person" label="Profile" active={isActive('/profile')} onClick={() => navigate('/profile')} />
      </nav>

      <button
        type="button"
        onClick={() => setShowCreateModal(true)}
        className="fixed right-4 bottom-28 z-50 flex h-14 w-14 items-center justify-center rounded-full border-2 border-[#1c1c13] bg-[#4648d4] text-white shadow-[4px_4px_0px_0px_rgba(28,28,19,1)] transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-none lg:hidden"
        aria-label="Create split bill"
      >
        <span className="material-symbols-outlined text-3xl">add</span>
      </button>

      {showCreateModal && (
        <CreateSplitBillModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => setShowCreateModal(false)}
        />
      )}
    </>
  )
}

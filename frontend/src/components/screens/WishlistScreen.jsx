import { Link } from 'react-router-dom'
import { BottomNavigation } from '../navigation/BottomNavigation'

export function WishlistScreen({ mascotImage }) {
  return (
    <div className="min-h-svh bg-[#fdf9e9] pb-24 text-[#1c1c13]">
      <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-[#1c1c13] bg-[#fdf9e9] px-4 shadow-[2px_2px_0_#1c1c13]">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 overflow-hidden rounded-full border border-[#1c1c13] bg-[#ffc329]">
            <img src={mascotImage} alt="LIVO Mascot" className="h-full w-full object-cover" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">LIVO</h1>
        </div>

        <Link
          to="/home"
          className="min-h-11 rounded-xl border border-[#1c1c13] bg-white px-3 py-2 text-xs font-black uppercase shadow-[2px_2px_0_#1c1c13]"
        >
          Back Home
        </Link>
      </header>

      <main className="mx-auto max-w-xl space-y-6 px-4 pt-12 text-center">
        <section>
          <h2 className="text-4xl leading-tight font-extrabold tracking-tight mb-3">Wishlist</h2>
          <p className="text-lg text-[#464554]">Coming soon!</p>
        </section>

        <section className="rounded-2xl border-2 border-dashed border-[#1c1c13] bg-[#fffbeb] p-8 space-y-4">
          <div className="text-6xl">🎁</div>
          <p className="text-base font-bold text-[#1c1c13]">
            Plan your savings goals and track items you want to buy.
          </p>
          <p className="text-sm text-[#464554]">
            This feature is under development. Check back soon!
          </p>
        </section>

        <section className="pt-6">
          <p className="text-sm font-semibold text-[#464554]">
            In the meantime, explore other features:
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Link
              to="/home"
              className="rounded-xl border border-[#1c1c13] bg-[#fbbf24] px-4 py-3 text-xs font-black uppercase shadow-[2px_2px_0_#1c1c13]"
            >
              💰 Dashboard
            </Link>
            <Link
              to="/analytics"
              className="rounded-xl border border-[#1c1c13] bg-[#4648d4] px-4 py-3 text-xs font-black uppercase text-white shadow-[2px_2px_0_#1c1c13]"
            >
              📊 Analytics
            </Link>
          </div>
        </section>
      </main>

      <BottomNavigation />
    </div>
  )
}

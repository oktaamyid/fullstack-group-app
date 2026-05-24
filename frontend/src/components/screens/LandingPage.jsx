import { Link, useNavigate } from 'react-router-dom'
import { useI18n } from '../../i18n/useI18n'

const featureCards = [
  {
    icon: 'payments',
    title: 'Catat transaksi cepat',
    description: 'Masukkan income, expense, dan catatan keuangan dalam tampilan yang ringkas dan mudah dipakai.',
  },
  {
    icon: 'receipt_long',
    title: 'Split bill lebih rapi',
    description: 'Bagi tagihan bareng teman tanpa ribet, dengan alur yang jelas dan mudah dicek ulang.',
  },
  {
    icon: 'favorite',
    title: 'Wishlist goals',
    description: 'Simpan target barang atau kebutuhan yang ingin kamu capai sambil pantau progresnya.',
  },
]

const teamCards = [
  {
    role: 'Project Manager',
    name: 'Okta',
    description: 'Memastikan seluruh alur pengembangan berjalan sesuai timeline dan kebutuhan pengguna dengan baik.',
    image: 'https://api.dicebear.com/9.x/notionists/svg?seed=Okta&backgroundColor=ffc329',
  },
  {
    role: 'Fullstack Dev',
    name: 'Zahra',
    description: 'Fokus merancang alur aplikasi yang ringan, membangun antarmuka, dan memastikan integrasi backend mulus.',
    image: 'https://api.dicebear.com/9.x/notionists/svg?seed=Zahra&backgroundColor=6366f1',
  },
  {
    role: 'Fullstack Dev',
    name: 'Rohman',
    description: 'Menghubungkan logika dari depan ke belakang agar mulus dan bebas dari bottleneck performa.',
    image: 'https://api.dicebear.com/9.x/notionists/svg?seed=Rohman&backgroundColor=fbbf24',
  },
  {
    role: 'Fullstack Dev',
    name: 'Intan',
    description: 'Membangun desain visual aplikasi secara utuh sambil menyusun arsitektur data di balik layar.',
    image: 'https://api.dicebear.com/9.x/notionists/svg?seed=Intan&backgroundColor=4648d4',
  },
  {
    role: 'Fullstack Dev',
    name: 'Keyla',
    description: 'Mengerjakan fitur pencatatan dan split bill dari UI hingga logika backend agar selalu sinkron.',
    image: 'https://api.dicebear.com/9.x/notionists/svg?seed=Keyla&backgroundColor=14532d',
  },
]

function SectionLabel({ children }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-[#1c1c13] bg-white px-3 py-1 text-[11px] font-black tracking-[0.18em] uppercase text-[#464554] shadow-[2px_2px_0px_0px_rgba(28,28,19,1)]">
      <span className="h-2 w-2 rounded-full bg-[#fbbf24]" />
      {children}
    </span>
  )
}

function FeatureCard({ icon, title, description }) {
  return (
    <article className="group rounded-2xl border border-[#1c1c13] bg-white p-5 shadow-[4px_4px_0px_0px_rgba(28,28,19,1)] transition-all hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0px_0px_rgba(28,28,19,1)]">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#1c1c13] bg-[#fbbf24] transition-colors group-hover:bg-[#6366f1]">
        <span className="material-symbols-outlined text-2xl font-black text-[#1c1c13] group-hover:text-white">
          {icon}
        </span>
      </div>
      <h3 className="text-lg font-black text-[#1c1c13]">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-[#464554]">{description}</p>
    </article>
  )
}

function TeamCard({ role, name, description, image }) {
  return (
    <article className="group rounded-2xl border border-[#1c1c13] bg-[#fffbeb] p-5 shadow-[4px_4px_0px_0px_rgba(28,28,19,1)] transition-all hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0px_0px_rgba(28,28,19,1)]">
      <div className="flex items-center gap-4">
        <img 
          src={image} 
          alt={name} 
          className="h-14 w-14 rounded-full border border-[#1c1c13] bg-white object-cover shadow-[2px_2px_0px_0px_rgba(28,28,19,1)] transition-transform group-hover:rotate-6"
        />
        <div>
          <p className="text-[11px] font-black tracking-[0.2em] uppercase text-[#464554]">
            {role}
          </p>
          <h3 className="mt-1 text-xl font-black text-[#1c1c13]">{name}</h3>
        </div>
      </div>
      <p className="mt-4 text-sm leading-6 text-[#464554]">{description}</p>
    </article>
  )
}

export function LandingPage({ mainLogo, mascotImage }) {
  const navigate = useNavigate()
  const { t, language } = useI18n()

  const isLoggedIn = Boolean(localStorage.getItem('livo_auth_token'))
  const primaryActionLabel = isLoggedIn ? 'Go to Dashboard' : 'Login / Register'

  const jumpToSection = (id) => {
    const section = document.getElementById(id)

    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <main className="min-h-svh bg-[#fffbeb] text-[#1c1c13]">
      <section className="sticky top-0 z-30 border-b border-[#1c1c13] bg-[#fffbeb]/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => jumpToSection('home')}
            className="flex items-center gap-3 text-left"
          >
            <img src={mainLogo} alt="LIVO" className="h-11 w-11 rounded-2xl border border-[#1c1c13] bg-white p-1 shadow-[2px_2px_0px_0px_rgba(28,28,19,1)]" />
            <div>
              <p className="text-xs font-black tracking-[0.25em] uppercase text-[#464554]">LIVO</p>
              <p className="text-sm font-semibold text-[#1c1c13]">Finance app for students</p>
            </div>
          </button>

          <div className="hidden items-center gap-2 md:flex">
            <button
              type="button"
              onClick={() => jumpToSection('home')}
              className="rounded-full border border-[#1c1c13] bg-white px-4 py-2 text-sm font-black shadow-[2px_2px_0px_0px_rgba(28,28,19,1)] transition-all hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[4px_4px_0px_0px_rgba(28,28,19,1)] active:translate-x-px active:translate-y-px"
            >
              Home
            </button>
            <button
              type="button"
              onClick={() => jumpToSection('about')}
              className="rounded-full border border-[#1c1c13] bg-white px-4 py-2 text-sm font-black shadow-[2px_2px_0px_0px_rgba(28,28,19,1)] transition-all hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[4px_4px_0px_0px_rgba(28,28,19,1)] active:translate-x-px active:translate-y-px"
            >
              About
            </button>
            <button
              type="button"
              onClick={() => jumpToSection('team')}
              className="rounded-full border border-[#1c1c13] bg-white px-4 py-2 text-sm font-black shadow-[2px_2px_0px_0px_rgba(28,28,19,1)] transition-all hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[4px_4px_0px_0px_rgba(28,28,19,1)] active:translate-x-px active:translate-y-px"
            >
              Our Team
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="rounded-full border border-[#1c1c13] bg-white px-4 py-2 text-sm font-black shadow-[2px_2px_0px_0px_rgba(28,28,19,1)] transition-all hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[4px_4px_0px_0px_rgba(28,28,19,1)] active:translate-x-px active:translate-y-px"
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => navigate(isLoggedIn ? '/home' : '/login')}
              className="rounded-full border border-[#1c1c13] bg-[#6366f1] px-4 py-2 text-sm font-black text-white shadow-[2px_2px_0px_0px_rgba(28,28,19,1)] transition-all hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[4px_4px_0px_0px_rgba(28,28,19,1)] active:translate-x-px active:translate-y-px"
            >
              {primaryActionLabel}
            </button>
          </div>
        </div>
      </section>

      <section id="home" className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-24">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div className="space-y-8 relative z-10">
            <div className="inline-block transform -rotate-2">
              <SectionLabel>Introducing LIVO</SectionLabel>
            </div>
            
            <h1 className="max-w-3xl text-5xl font-black leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
              Atur duitmu,<br />
              <span className="inline-block mt-2 rounded-2xl bg-[#fbbf24] px-4 py-2 border-4 border-[#1c1c13] shadow-[4px_4px_0_0_#1c1c13] transform rotate-1">
                bebas drama.
              </span>
            </h1>
            
            <p className="max-w-xl text-lg font-medium leading-relaxed text-[#464554] sm:text-xl border-l-4 border-[#1c1c13] pl-4">
              Dari urus patungan nongkrong sampai tracking uang saku bulanan. Kelola semuanya gampang, cepat, dan tanpa drama.
            </p>

            <div className="flex flex-col gap-4 sm:flex-row">
              <button
                type="button"
                onClick={() => navigate(isLoggedIn ? '/home' : '/login')}
                className="rounded-2xl border-4 border-[#1c1c13] bg-[#6366f1] px-8 py-4 text-lg text-white font-black shadow-[6px_6px_0px_0px_rgba(28,28,19,1)] transition-all hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[8px_8px_0px_0px_rgba(28,28,19,1)] active:translate-x-px active:translate-y-px"
              >
                {isLoggedIn ? 'Buka Dashboard 👋' : 'Mulai Sekarang 🔥'}
              </button>
              <button
                type="button"
                onClick={() => jumpToSection('about')}
                className="rounded-2xl border-4 border-[#1c1c13] bg-white px-8 py-4 text-lg font-black shadow-[6px_6px_0px_0px_rgba(28,28,19,1)] transition-all hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[8px_8px_0px_0px_rgba(28,28,19,1)] active:translate-x-px active:translate-y-px flex items-center justify-center gap-2"
              >
                Lihat Fitur <span className="material-symbols-outlined font-black">arrow_downward</span>
              </button>
            </div>
            
            <div className="flex items-center gap-4 pt-4">
              <div className="flex -space-x-4">
                {[...Array(3)].map((_, i) => (
                  <img key={i} className="w-12 h-12 rounded-full border-2 border-[#1c1c13] bg-[#fffbeb] object-cover shadow-[2px_2px_0px_0px_rgba(28,28,19,1)]" src={`https://api.dicebear.com/9.x/notionists/svg?seed=user${i}&backgroundColor=${['ffc329', '6366f1', '4648d4'][i]}`} alt="user" />
                ))}
              </div>
              <div className="text-sm font-black text-[#1c1c13]">
                Dipercaya oleh<br/>banyak mahasiswa.
              </div>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-sm lg:max-w-none mt-12 lg:mt-0">
            {/* Background Blob / Decoration */}
            <div className="absolute top-1/2 left-1/2 w-[110%] h-[110%] -translate-x-1/2 -translate-y-1/2 rounded-[3rem] bg-[#fbbf24] border-4 border-[#1c1c13] transform rotate-3" />
            
            <div className="relative z-10 flex flex-col gap-6 p-4 sm:p-6 lg:p-10">
              {/* Receipt / Split Bill card mockup */}
              <div className="rounded-3xl border-4 border-[#1c1c13] bg-white p-6 shadow-[8px_8px_0px_0px_rgba(28,28,19,1)] transform hover:-translate-y-1 transition-transform">
                 <div className="flex justify-between items-center mb-6 pt-2 border-b-2 border-dashed border-[#1c1c13] pb-4">
                   <h3 className="text-xl font-black uppercase tracking-wider">Patungan Kopi</h3>
                   <span className="px-3 py-1 rounded-full border-2 border-[#1c1c13] bg-[#FF90E8] text-[#1c1c13] text-xs font-black rotate-3 shadow-[2px_2px_0_0_#1c1c13]">UNPAID</span>
                 </div>
                 <div className="space-y-4">
                   <div className="flex justify-between items-center">
                     <span className="font-bold flex items-center gap-3">
                       <span className="w-8 h-8 rounded-full border-2 border-[#1c1c13] bg-[#6366f1] inline-block"/> Okta
                     </span>
                     <span className="font-black text-lg">Rp 25.000</span>
                   </div>
                   <div className="flex justify-between items-center">
                     <span className="font-bold flex items-center gap-3">
                       <span className="w-8 h-8 rounded-full border-2 border-[#1c1c13] bg-[#fbbf24] inline-block"/> Zahra
                     </span>
                     <span className="font-black text-lg">Rp 30.000</span>
                   </div>
                 </div>
                 <button className="w-full mt-8 py-4 rounded-xl border-4 border-[#1c1c13] bg-[#6366f1] text-white font-black shadow-[4px_4px_0_0_#1c1c13] hover:translate-y-1 hover:translate-x-1 hover:shadow-none transition-all text-lg tracking-wide uppercase">
                   Tagih Sekarang
                 </button>
              </div>

              {/* Transaction success toast mockup */}
              <div className="rounded-2xl border-4 border-[#1c1c13] bg-[#fffbeb] p-3 sm:p-4 shadow-[6px_6px_0px_0px_rgba(28,28,19,1)] transform -rotate-3 absolute -bottom-6 -left-4 sm:-left-8 w-[240px] sm:w-[260px] hover:rotate-0 transition-transform">
                <div className="flex gap-3 sm:gap-4 items-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl border-2 border-[#1c1c13] bg-[#4ade80] flex items-center justify-center">
                    <span className="material-symbols-outlined font-black text-xl sm:text-2xl">payments</span>
                  </div>
                  <div>
                    <p className="text-[9px] sm:text-[10px] font-black uppercase text-[#464554] tracking-widest">New Income</p>
                    <p className="font-black text-base sm:text-lg">+ Rp 500.000</p>
                  </div>
                </div>
              </div>

              {/* Mini goal mockup */}
              <div className="rounded-2xl border-4 border-[#1c1c13] bg-white p-4 shadow-[6px_6px_0px_0px_rgba(28,28,19,1)] transform rotate-6 absolute -top-8 -right-4 sm:-right-8 w-48 sm:w-56 hover:rotate-0 transition-transform hidden sm:block">
                <p className="text-[10px] font-black uppercase text-[#464554] tracking-widest mb-3 flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">flag</span> Target : Sepatu
                </p>
                <div className="w-full bg-[#fffbeb] border-2 border-[#1c1c13] rounded-full h-4 overflow-hidden relative">
                  <div className="absolute top-0 left-0 bg-[#6366f1] h-full rounded-r-none border-r-2 border-[#1c1c13] w-[60%]"></div>
                </div>
                <p className="text-right text-xs font-black mt-2">60% Saved</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="about" className="border-t border-[#1c1c13] bg-[#fff7d6]">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
          <div className="mb-6 flex flex-col gap-3">
            <SectionLabel>About</SectionLabel>
            <h2 className="text-3xl font-black tracking-tight sm:text-4xl">Kenapa LIVO dibuat</h2>
            <p className="max-w-3xl text-base leading-7 text-[#464554]">
              LIVO fokus ke kebutuhan harian yang sering muncul di lingkungan mahasiswa: catat pengeluaran, cek saldo, bagi tagihan bareng teman, dan simpan target keuangan tanpa alur yang ribet.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {featureCards.map((card) => (
              <FeatureCard key={card.title} {...card} />
            ))}
          </div>
        </div>
      </section>

      <section id="team" className="border-t border-[#1c1c13] bg-[#fffbeb]">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
          <div className="mb-6 flex flex-col gap-3">
            <SectionLabel>Our Team</SectionLabel>
            <h2 className="text-3xl font-black tracking-tight sm:text-4xl">Orang di balik LIVO</h2>
            <p className="max-w-3xl text-base leading-7 text-[#464554]">
              Kenalkan barisan luar biasa di balik LIVO yang dipimpin oleh Project Manager andal dan didukung oleh para Fullstack Developer berbakat. Kolaborasi solid ini membangun aplikasi keuangan yang cepat, stabil dari frontend ke backend, dan tentunya nyaman digunakan.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {teamCards.map((card) => (
              <TeamCard key={card.role} {...card} />
            ))}
          </div>

          <div className="mt-8 rounded-2xl border border-[#1c1c13] bg-[#6366f1] p-6 text-white shadow-[6px_6px_0px_0px_rgba(28,28,19,1)]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[11px] font-black tracking-[0.2em] uppercase text-white/80">Ready to try</p>
                <h3 className="mt-2 text-2xl font-black">Langsung masuk ke LIVO sekarang</h3>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-white/90">
                  Cukup login atau register untuk mulai pakai fitur transaksi, split bill, wishlist, dan profile settings.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:min-w-52">
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="rounded-2xl border border-[#1c1c13] bg-white px-5 py-4 text-sm font-black text-[#1c1c13] shadow-[3px_3px_0px_0px_rgba(28,28,19,1)] transition-all hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[5px_5px_0px_0px_rgba(28,28,19,1)] active:translate-x-px active:translate-y-px"
                >
                  Login / Register
                </button>
                <Link
                  to="/home"
                  className="rounded-2xl border border-white bg-[#6366f1] px-5 py-4 text-center text-sm font-black text-white shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] transition-all hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[5px_5px_0px_0px_rgba(255,255,255,1)] active:translate-x-px active:translate-y-px"
                >
                  Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#1c1c13] bg-[#1c1c13] text-[#fffbeb]">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2">
              <img src={mainLogo} alt="LIVO" className="h-8 w-8 rounded-lg border border-white bg-white p-0.5 opacity-90" />
              <span className="text-xl font-black uppercase tracking-widest">LIVO</span>
            </div>
            <p className="text-center text-sm text-white/70">
              © {new Date().getFullYear()} LIVO Finance Web App. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </main>
  )
}
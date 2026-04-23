import { EntryBackdrop } from './EntryBackdrop'

export function SplashScreen({ mascotImage }) {
  return (
    <EntryBackdrop>
      <section className="relative flex w-full max-w-97.5 flex-col items-center text-center">
        <div className="relative h-55 w-55 rounded-full border-2 border-[#1c1c13] bg-white p-2 shadow-[4px_4px_0_#1c1c13]">
          <img
            src={mascotImage}
            alt="LIVO graduation hamster mascot"
            className="h-full w-full rounded-full object-cover"
          />
          <div className="absolute -top-3 -right-3 rounded-full border border-[#1c1c13] bg-[#ffdf9f] px-2.5 py-1 text-[11px] font-extrabold tracking-[0.08em] text-[#6f5100] uppercase shadow-[2px_2px_0_#1c1c13]">
            Level up
          </div>
        </div>
        <p className="mt-3 rounded-xl border border-[#1c1c13] bg-[#4648d4] px-5 py-2 text-xs font-bold tracking-[0.14em] text-white uppercase shadow-[3px_3px_0_#1c1c13]">
          Your Academic Coin Master
        </p>
      </section>
    </EntryBackdrop>
  )
}

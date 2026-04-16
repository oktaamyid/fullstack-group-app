import { EntryBackdrop } from './EntryBackdrop'

export function LoadingScreen({ bootMessage, mainLogo }) {
  return (
    <EntryBackdrop>
      <section className="relative flex w-full max-w-97.5 flex-col items-center text-center">
        <img
          src={mainLogo}
          alt="LIVO Main Logo"
          className="h-20 w-auto rounded-2xl border border-[#1c1c13] bg-white p-2 shadow-[3px_3px_0_#1c1c13]"
        />
        <p className="mt-5 text-[0.96rem] text-[#464554]">{bootMessage}</p>

        <div className="mt-5 h-3.5 w-60 overflow-hidden rounded-full border border-[#1c1c13] bg-[#ece8d9]" aria-hidden>
          <div className="animate-loading-travel h-full w-[40%] border-r border-[#1c1c13] bg-linear-to-r from-[#f9bd22] to-[#ffd566]" />
        </div>

        <p className="mt-3 text-[0.72rem] font-bold tracking-[0.12em] text-[#5c4300] uppercase">
          Syncing achievements...
        </p>
      </section>
    </EntryBackdrop>
  )
}

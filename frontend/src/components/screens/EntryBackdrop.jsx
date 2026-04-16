export function EntryBackdrop({ children }) {
  return (
    <main className="relative flex min-h-svh items-center justify-center overflow-hidden bg-[#fdf9e9] px-5 py-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,#fff6d8_0%,transparent_35%),radial-gradient(circle_at_85%_15%,#ffe6b8_0%,transparent_25%)]" />
      {children}
    </main>
  )
}

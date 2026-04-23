/**
 * AuthLayout - Centered auth form layout
 * Used for login, register, and other authentication pages
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Auth form content
 * @param {string} props.maxWidth - Max width of the form (default: max-w-sm)
 */
export function AuthLayout({ children, maxWidth = 'max-w-sm' }) {
  return (
    <main className="flex min-h-svh items-center justify-center bg-[#fffbeb] px-4 py-6 lg:px-8 lg:py-10">
      <section className={`w-full ${maxWidth} text-[#1c1c13]`}>{children}</section>
    </main>
  )
}

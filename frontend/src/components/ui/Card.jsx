/**
 * Card - Reusable neo-brutalist card component
 * Enforces consistent styling across the app
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Card content
 * @param {string} props.padding - Padding size (default: p-4, options: p-3, p-4, p-6)
 * @param {string} props.shadow - Shadow size (default: shadow-[4px_4px_0px_0px_rgba(28,28,19,1)])
 * @param {string} props.className - Additional classes
 */
export function Card({
  children,
  padding = 'p-4',
  shadow = 'shadow-[4px_4px_0px_0px_rgba(28,28,19,1)]',
  className = '',
}) {
  return (
    <div
      className={`rounded-2xl border border-[#1c1c13] bg-white ${padding} ${shadow} ${className}`}
    >
      {children}
    </div>
  )
}

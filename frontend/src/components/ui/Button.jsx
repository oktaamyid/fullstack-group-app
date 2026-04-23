/**
 * Button - Reusable neo-brutalist button component
 * Supports primary, secondary, and ghost variants
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Button text or content
 * @param {string} props.variant - Button variant (default: primary, options: primary, secondary, ghost)
 * @param {string} props.size - Button size (default: md, options: sm, md, lg)
 * @param {boolean} props.disabled - Disable button
 * @param {boolean} props.fullWidth - Make button full width
 * @param {string} props.className - Additional classes
 * @param {Object} props...rest - Standard button props (onClick, type, etc.)
 */
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  fullWidth = false,
  className = '',
  ...rest
}) {
  const baseClasses =
    'rounded-2xl border border-[#1c1c13] font-bold transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:cursor-not-allowed disabled:opacity-70'

  const sizeClasses = {
    sm: 'min-h-9 px-3 text-sm',
    md: 'min-h-11 px-4 text-base',
    lg: 'min-h-12 px-5 text-lg',
  }

  const variantClasses = {
    primary: `bg-[#6366f1] text-white shadow-[2px_2px_0px_0px_rgba(28,28,19,1)]`,
    secondary: `bg-white text-[#1c1c13] shadow-[2px_2px_0px_0px_rgba(28,28,19,1)]`,
    ghost: `bg-transparent text-[#1c1c13] border-0`,
  }

  const widthClass = fullWidth ? 'w-full' : ''

  const buttonClasses = `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${widthClass} ${className}`

  return (
    <button type="button" disabled={disabled} className={buttonClasses} {...rest}>
      {children}
    </button>
  )
}

import React from 'react'
import { Link } from 'react-router-dom'

/**
 * Button - Reusable neo-brutalist button component
 * Supports primary, secondary, accent, and ghost variants
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Button text or content
 * @param {string} props.variant - Button variant (primary, secondary, accent)
 * @param {string} props.size - Button size (sm, md, lg)
 * @param {boolean} props.disabled - Disable button
 * @param {boolean} props.fullWidth - Make button full width
 * @param {string} props.className - Additional classes
 * @param {string} props.to - If provided, renders a react-router Link instead of a button
 * @param {Object} props...rest - Standard button props (onClick, type, etc.)
 */
export const Button = React.forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  fullWidth = false,
  className = '',
  to,
  ...rest
}, ref) => {
  const baseClasses = 'inline-flex items-center justify-center font-black transition-all active:translate-x-px active:translate-y-px disabled:cursor-not-allowed disabled:opacity-70 disabled:active:translate-x-0 disabled:active:translate-y-0 border-[#1c1c13]'

  const sizeClasses = {
    sm: 'rounded-full border-2 px-4 py-2 text-sm shadow-[2px_2px_0px_0px_rgba(28,28,19,1)] hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[4px_4px_0px_0px_rgba(28,28,19,1)] active:shadow-none',
    md: 'rounded-xl border-[3px] px-6 py-3 text-base shadow-[4px_4px_0px_0px_rgba(28,28,19,1)] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0px_0px_rgba(28,28,19,1)] active:shadow-[2px_2px_0_0_rgba(28,28,19,1)]',
    lg: 'rounded-2xl border-4 px-8 py-4 text-lg shadow-[6px_6px_0px_0px_rgba(28,28,19,1)] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[8px_8px_0px_0px_rgba(28,28,19,1)] active:shadow-[2px_2px_0_0_rgba(28,28,19,1)]',
    icon: 'h-10 w-10 rounded-2xl border-2 p-0 shadow-[2px_2px_0px_0px_rgba(28,28,19,1)] hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[4px_4px_0px_0px_rgba(28,28,19,1)] active:shadow-none',
  }

  const variantClasses = {
    primary: 'bg-[#6366f1] text-white',
    secondary: 'bg-white text-[#1c1c13]',
    accent: 'bg-[#fbbf24] text-[#1c1c13]',
  }

  const widthClass = fullWidth ? 'w-full' : ''

  const buttonClasses = `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${widthClass} ${className}`

  if (to) {
    return (
      <Link to={to} className={buttonClasses} ref={ref} {...rest}>
        {children}
      </Link>
    )
  }

  return (
    <button type="button" disabled={disabled} className={buttonClasses} ref={ref} {...rest}>
      {children}
    </button>
  )
})
Button.displayName = 'Button'

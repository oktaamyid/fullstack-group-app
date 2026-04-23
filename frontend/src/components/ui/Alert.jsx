/**
 * Alert - Reusable alert component
 * Displays success, error, warning, or info messages
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Alert content
 * @param {string} props.type - Alert type (default: info, options: success, error, warning, info)
 * @param {function} props.onClose - Optional callback to close alert
 * @param {string} props.className - Additional classes
 */
export function Alert({ children, type = 'info', onClose, className = '' }) {
  const alertStyles = {
    success: {
      bg: 'bg-[#bbf7d0]',
      border: 'border-[#86efac]',
      text: 'text-[#14532d]',
      icon: '✓',
    },
    error: {
      bg: 'bg-[#fee2e2]',
      border: 'border-[#fecaca]',
      text: 'text-[#7f1d1d]',
      icon: '✕',
    },
    warning: {
      bg: 'bg-[#fef3c7]',
      border: 'border-[#fde68a]',
      text: 'text-[#78350f]',
      icon: '⚠',
    },
    info: {
      bg: 'bg-[#ddd6fe]',
      border: 'border-[#c7d2fe]',
      text: 'text-[#312e81]',
      icon: 'ℹ',
    },
  }

  const style = alertStyles[type] || alertStyles.info

  return (
    <div
      className={`rounded-2xl border border-[#1c1c13] ${style.bg} px-3 py-2 ${style.text} ${className}`}
    >
      <div className="flex items-start gap-2">
        <span className="flex-shrink-0 font-bold">{style.icon}</span>
        <div className="flex-1 text-sm font-semibold">{children}</div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="flex-shrink-0 font-bold hover:opacity-70"
            aria-label="Close alert"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  )
}

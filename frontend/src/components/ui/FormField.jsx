/**
 * FormField - Reusable form input component
 * Provides consistent styling for text inputs, emails, passwords, etc.
 *
 * @param {Object} props
 * @param {string} props.label - Field label
 * @param {string} props.type - Input type (default: text)
 * @param {string} props.placeholder - Placeholder text
 * @param {string} props.error - Error message to display
 * @param {boolean} props.required - Mark field as required
 * @param {string} props.className - Additional classes
 * @param {Object} props...rest - Standard input props (value, onChange, name, etc.)
 */
export function FormField({
  label,
  type = 'text',
  placeholder = '',
  error = '',
  required = false,
  className = '',
  ...rest
}) {
  return (
    <label className="block text-xs font-bold uppercase tracking-wider">
      {label}
      {required && <span className="text-[#ef4444]">*</span>}

      <input
        type={type}
        placeholder={placeholder}
        className={`mt-1 min-h-11 w-full rounded-2xl border border-[#1c1c13] bg-white px-3 text-sm outline-none focus:-translate-y-px transition-all ${error ? 'border-[#ef4444] bg-[#fee2e2]' : ''} ${className}`}
        {...rest}
      />

      {error && <p className="mt-1 text-xs font-semibold text-[#ef4444]">{error}</p>}
    </label>
  )
}

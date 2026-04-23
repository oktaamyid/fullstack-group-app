/**
 * StatusPill - Status indicator component
 * Displays status with color-coded backgrounds
 *
 * @param {Object} props
 * @param {boolean} props.ok - Status state (true = success, false = error, undefined = pending)
 * @param {string} props.label - Status label
 * @param {string} props.className - Additional classes
 */
export function StatusPill({ ok, label, className = '' }) {
  const base = `rounded-full border border-[#1c1c13] px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${className}`

  if (ok === true) {
    return <span className={`${base} bg-[#bbf7d0] text-[#14532d]`}>{label}: Online</span>
  }

  if (ok === false) {
    return <span className={`${base} bg-[#fecaca] text-[#7f1d1d]`}>{label}: Offline</span>
  }

  return <span className={`${base} bg-[#ddd6fe] text-[#312e81]`}>{label}: Checking</span>
}

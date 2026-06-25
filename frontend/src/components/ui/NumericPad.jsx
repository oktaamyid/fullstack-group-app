import React from 'react'

const DEFAULT_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '00', '0', 'BACKSPACE']

export function NumericPad({
  title = 'Number Pad',
  clearLabel = 'Clear',
  helperText = '',
  onPress,
  className = '',
}) {
  return (
    <div className={`rounded-2xl border-2 border-[#1c1c13] bg-[#fff8dc] p-3 shadow-[2px_2px_0_#1c1c13] ${className}`}>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[10px] font-black uppercase text-[#1c1c13]">{title}</p>
        <button
          type="button"
          onClick={() => onPress?.('CLEAR')}
          className="rounded-full border border-[#1c1c13] bg-white px-2 py-1 text-[10px] font-black uppercase text-[#1c1c13]"
        >
          {clearLabel}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {DEFAULT_KEYS.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => onPress?.(key)}
            className={`min-h-[3rem] rounded-xl border-2 border-[#1c1c13] bg-white text-sm font-black text-[#1c1c13] shadow-[2px_2px_0_#1c1c13] active:translate-y-[1px] ${
              key === 'BACKSPACE' ? 'text-[#ba1a1a]' : ''
            }`}
          >
            {key === 'BACKSPACE' ? '⌫' : key}
          </button>
        ))}
      </div>

      {helperText ? <p className="mt-2 text-[10px] font-bold text-[#1c1c13]/70">{helperText}</p> : null}
    </div>
  )
}

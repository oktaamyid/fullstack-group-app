import { useCallback, useState } from 'react'
import { createTransaction } from '../../services/transaction'

const defaultForm = {
  type: 'EXPENSE',
  category: 'FOOD',
  amount: '',
  description: '',
  date: new Date().toISOString().split('T')[0],
}

const TRANSACTION_TYPES = ['EXPENSE', 'INCOME']

const CATEGORIES = {
  EXPENSE: ['FOOD', 'TRANSPORT', 'EDUCATION', 'ENTERTAINMENT', 'UTILITIES', 'OTHER'],
  INCOME: ['SALARY', 'ALLOWANCE', 'FREELANCE', 'INVESTMENT', 'GIFT', 'OTHER'],
}

const CATEGORY_LABELS = {
  FOOD: '🍕 Food',
  TRANSPORT: '🚗 Transport',
  EDUCATION: '📚 Education',
  ENTERTAINMENT: '🎬 Entertainment',
  UTILITIES: '💡 Utilities',
  SALARY: '💼 Salary',
  ALLOWANCE: '💳 Allowance',
  FREELANCE: '💻 Freelance',
  INVESTMENT: '📈 Investment',
  GIFT: '🎁 Gift',
  OTHER: '📌 Other',
}

function toCurrency(value) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value || 0)
}

/**
 * CreateTransactionModal - Quick entry modal for creating transactions
 * Features: type selection, category, amount, description, date
 *
 * @param {Object} props
 * @param {function} props.onClose - Callback when modal closes
 * @param {function} props.onSuccess - Callback when transaction created successfully
 */
export function CreateTransactionModal({ onClose, onSuccess }) {
  const [form, setForm] = useState(defaultForm)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const onChange = useCallback((e) => {
    const { name, value } = e.target
    setForm((prev) => {
      const updated = { ...prev, [name]: value }
      // Reset category if type changed
      if (name === 'type' && !CATEGORIES[value].includes(prev.category)) {
        updated.category = CATEGORIES[value][0]
      }
      return updated
    })
  }, [])

  const onSubmit = useCallback(
    async (e) => {
      e.preventDefault()
      setErrorMessage('')
      setSuccessMessage('')
      setIsSubmitting(true)

      try {
        const amount = parseInt(form.amount, 10)
        if (Number.isNaN(amount) || amount <= 0) {
          setErrorMessage('Please enter a valid amount')
          setIsSubmitting(false)
          return
        }

        const payload = {
          type: form.type,
          category: form.category,
          amount,
          description: form.description || '',
          date: form.date,
        }

        await createTransaction(payload)
        setForm(defaultForm)
        setSuccessMessage('Transaction created successfully!')

        setTimeout(() => {
          onSuccess?.()
          onClose?.()
        }, 1000)
      } catch (error) {
        setErrorMessage(error.message || 'Failed to create transaction')
      } finally {
        setIsSubmitting(false)
      }
    },
    [form, onClose, onSuccess],
  )

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black bg-opacity-40 lg:items-center">
      <div className="w-full rounded-t-3xl border-t border-l border-r border-[#1c1c13] bg-[#fffbeb] p-4 lg:m-auto lg:w-96 lg:rounded-3xl lg:border">
        <form onSubmit={onSubmit} className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between pb-2">
            <h3 className="text-xl font-black">Add Transaction</h3>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-[#1c1c13] bg-white transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="rounded-2xl border border-red-500 bg-red-50 p-3">
              <p className="text-sm font-medium text-red-800">{errorMessage}</p>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="rounded-2xl border border-green-500 bg-green-50 p-3">
              <p className="text-sm font-medium text-green-800">{successMessage}</p>
            </div>
          )}

          {/* Type Selection */}
          <div>
            <label className="mb-2 block text-sm font-black">Type</label>
            <div className="flex gap-2">
              {TRANSACTION_TYPES.map((type) => (
                <label key={type} className="flex flex-1 items-center gap-2 rounded-2xl border-2 border-[#1c1c13] p-2 cursor-pointer transition-all" style={{backgroundColor: form.type === type ? '#fbbf24' : '#ffffff'}}>
                  <input
                    type="radio"
                    name="type"
                    value={type}
                    checked={form.type === type}
                    onChange={onChange}
                    className="cursor-pointer"
                  />
                  <span className="text-sm font-bold">{type}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Category Selection */}
          <div>
            <label htmlFor="category" className="mb-2 block text-sm font-black">Category</label>
            <select
              id="category"
              name="category"
              value={form.category}
              onChange={onChange}
              className="w-full rounded-2xl border-2 border-[#1c1c13] bg-white px-3 py-2 font-medium shadow-[2px_2px_0px_0px_rgba(28,28,19,1)] outline-none"
            >
              {CATEGORIES[form.type].map((cat) => (
                <option key={cat} value={cat}>
                  {CATEGORY_LABELS[cat]}
                </option>
              ))}
            </select>
          </div>

          {/* Amount */}
          <div>
            <label htmlFor="amount" className="mb-2 block text-sm font-black">Amount (IDR)</label>
            <input
              id="amount"
              type="number"
              name="amount"
              value={form.amount}
              onChange={onChange}
              placeholder="0"
              min="0"
              className="w-full rounded-2xl border-2 border-[#1c1c13] bg-white px-3 py-2 font-medium shadow-[2px_2px_0px_0px_rgba(28,28,19,1)] outline-none"
            />
            {form.amount && <p className="mt-1 text-xs text-[#464554]">{toCurrency(form.amount)}</p>}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="mb-2 block text-sm font-black">Description (optional)</label>
            <input
              id="description"
              type="text"
              name="description"
              value={form.description}
              onChange={onChange}
              placeholder="What is this transaction about?"
              className="w-full rounded-2xl border-2 border-[#1c1c13] bg-white px-3 py-2 font-medium shadow-[2px_2px_0px_0px_rgba(28,28,19,1)] outline-none"
            />
          </div>

          {/* Date */}
          <div>
            <label htmlFor="date" className="mb-2 block text-sm font-black">Date</label>
            <input
              id="date"
              type="date"
              name="date"
              value={form.date}
              onChange={onChange}
              className="w-full rounded-2xl border-2 border-[#1c1c13] bg-white px-3 py-2 font-medium shadow-[2px_2px_0px_0px_rgba(28,28,19,1)] outline-none"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || !form.amount}
            className="mt-6 w-full rounded-2xl border-2 border-[#1c1c13] bg-[#6366f1] px-4 py-3 font-black text-white shadow-[2px_2px_0px_0px_rgba(28,28,19,1)] transition-all disabled:opacity-50 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
          >
            {isSubmitting ? 'Creating...' : 'Create Transaction'}
          </button>

          {/* Cancel Button */}
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-full rounded-2xl border-2 border-[#1c1c13] bg-white px-4 py-3 font-black text-[#1c1c13] shadow-[2px_2px_0px_0px_rgba(28,28,19,1)] transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
          >
            Cancel
          </button>
        </form>
      </div>
    </div>
  )
}

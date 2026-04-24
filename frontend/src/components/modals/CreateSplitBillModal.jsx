import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createSplitBill } from '../../services/splitBill'
import { useI18n } from '../../i18n/useI18n'

const defaultForm = {
  title: '',
  description: '',
  totalAmount: '',
  friends: '',
}

function toRupiah(value) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value)
}

function parseFriends(raw) {
  return raw
    .split('\n')
    .map((name) => name.trim())
    .filter(Boolean)
    .map((friendName) => ({ friendName }))
}

/**
 * CreateSplitBillModal - Modal for creating split bills with friends
 * Features: title, description, total amount, friend list with auto-split calculation
 *
 * @param {Object} props
 * @param {function} props.onClose - Callback when modal closes
 * @param {function} props.onSuccess - Callback when split bill created successfully
 */
export function CreateSplitBillModal({ onClose, onSuccess }) {
  const { t } = useI18n()
  const navigate = useNavigate()
  const [form, setForm] = useState(defaultForm)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const onChange = useCallback((e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }, [])

  const onSubmit = useCallback(
    async (e) => {
      e.preventDefault()
      setErrorMessage('')
      setIsSubmitting(true)

      try {
        const members = parseFriends(form.friends)
        if (members.length === 0) {
          setErrorMessage(t('pleaseAddAtLeastOneFriend', 'Please add at least one friend'))
          setIsSubmitting(false)
          return
        }

        const totalAmount = parseInt(form.totalAmount, 10)
        if (Number.isNaN(totalAmount) || totalAmount <= 0) {
          setErrorMessage(t('pleaseEnterValidAmount', 'Please enter a valid amount'))
          setIsSubmitting(false)
          return
        }

        const amountPerFriend = Math.floor(totalAmount / members.length)
        const remainder = totalAmount % members.length

        const payload = {
          title: form.title || t('splitExpense', 'Split Expense'),
          description: form.description,
          totalAmount,
          members: members.map((member, index) => ({
            friendName: member.friendName,
            amount: amountPerFriend + (index < remainder ? 1 : 0),
          })),
        }

        await createSplitBill(payload)
        setForm(defaultForm)
        onSuccess?.()
        navigate('/split-bill')
      } catch (error) {
        setErrorMessage(error.message || t('failedToCreateSplitBill', 'Failed to create split bill'))
      } finally {
        setIsSubmitting(false)
      }
    },
    [form, navigate, onSuccess]
  )

  return (
    <div className="fixed inset-0 z-40 flex items-end bg-black/50">
      <div className="w-full space-y-4 rounded-t-3xl border-t border-l border-r border-[#1c1c13] bg-[#fffbeb] p-6 shadow-[0_-4px_0_#1c1c13]">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black uppercase">{t('createSplit', 'Create Split')}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-2xl font-bold text-[#1c1c13]"
          >
            ✕
          </button>
        </div>

        {errorMessage && (
          <div className="rounded-xl border border-[#ba1a1a] bg-[#fee2e2] p-3 text-sm font-semibold text-[#ba1a1a]">
            {errorMessage}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-3 max-h-96 overflow-y-auto">
          <label className="block text-[11px] font-bold uppercase">
            {t('title', 'Title')}
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={onChange}
              placeholder="Pizza night"
              className="mt-1 w-full rounded-2xl border border-black bg-[#fffbeb] px-3 py-2 text-sm"
            />
          </label>

          <label className="block text-[11px] font-bold uppercase">
            {t('description', 'Description')}
            <input
              type="text"
              name="description"
              value={form.description}
              onChange={onChange}
              placeholder="Friday hangout at Pizza Hut"
              className="mt-1 w-full rounded-2xl border border-black bg-[#fffbeb] px-3 py-2 text-sm"
            />
          </label>

          <label className="block text-[11px] font-bold uppercase">
            {t('totalAmount', 'Total Amount')} (IDR)
            <input
              type="number"
              name="totalAmount"
              value={form.totalAmount}
              onChange={onChange}
              placeholder="180000"
              className="mt-1 w-full rounded-2xl border border-black bg-[#fffbeb] px-3 py-2 text-sm"
            />
          </label>

          <label className="block text-[11px] font-bold uppercase">
            {t('friendsOnePerLine', 'Friends (one per line)')}
            <textarea
              name="friends"
              value={form.friends}
              onChange={onChange}
              rows={3}
              placeholder={'Bagas\nSiska\nDini'}
              className="mt-1 w-full rounded-2xl border border-black bg-[#fffbeb] px-3 py-2 text-sm"
            />
          </label>

          <div className="grid grid-cols-2 gap-2 pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-2xl border border-black bg-[#6366f1] px-3 py-2 text-xs font-black uppercase text-white shadow-[2px_2px_0_#1c1c13] disabled:opacity-60"
            >
              {isSubmitting ? t('creating', 'Creating...') : t('createSplit', 'Create Split')}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-black bg-white px-3 py-2 text-xs font-black uppercase shadow-[2px_2px_0_#1c1c13]"
            >
              {t('cancel', 'Cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

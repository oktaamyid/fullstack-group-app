import { useCallback, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { createSplitBill } from '../../services/splitBill'
import { useI18n } from '../../i18n/useI18n'

const defaultForm = {
  title: '',
  description: '',
  totalAmount: '',
  members: [{ friendName: '', amount: '' }],
  items: [],
  useItems: false,
}

function toRupiah(value) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value)
}

/**
 * CreateSplitBillModal - Modal for creating split bills
 * Features: 
 * - Dynamic member form with individual amounts
 * - Item-based split (select what each person ordered)
 * - Real-time validation & total calculation
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

  // Calculate total from members or items
  const { totalCalculated, isValid } = useMemo(() => {
    let total = 0

    if (form.useItems && form.items.length > 0) {
      // Calculate from items
      total = form.items.reduce((sum, item) => {
        const price = parseInt(item.price, 10) || 0
        const qty = parseInt(item.quantity, 10) || 1
        return sum + price * qty
      }, 0)
    } else {
      // Calculate from members
      total = form.members.reduce((sum, member) => {
        const amount = parseInt(member.amount, 10) || 0
        return sum + amount
      }, 0)
    }

    const hasEmptyName = form.members.some((m) => !m.friendName.trim())
    const inputTotal = parseInt(form.totalAmount, 10) || 0

    let isFormValid = false
    if (form.useItems && form.items.length > 0) {
      // For item-based: all items have name, price, and at least one assigned
      isFormValid =
        form.items.every((i) => i.itemName && i.price && (i.assignedTo || []).length > 0) &&
        !hasEmptyName &&
        total === inputTotal &&
        inputTotal > 0
    } else {
      // For amount-based: members have name and amount
      const hasEmptyAmount = form.members.some((m) => !m.amount)
      isFormValid = !hasEmptyName && !hasEmptyAmount && inputTotal > 0 && total === inputTotal
    }

    return {
      totalCalculated: total,
      isValid: isFormValid,
    }
  }, [form.members, form.totalAmount, form.items, form.useItems])

  const onTitleChange = useCallback((e) => {
    setForm((prev) => ({ ...prev, title: e.target.value }))
  }, [])

  const onDescriptionChange = useCallback((e) => {
    setForm((prev) => ({ ...prev, description: e.target.value }))
  }, [])

  const onTotalAmountChange = useCallback((e) => {
    const value = e.target.value
    setForm((prev) => ({ ...prev, totalAmount: value }))
  }, [])

  const onMemberChange = useCallback((index, field, value) => {
    setForm((prev) => ({
      ...prev,
      members: prev.members.map((member, i) =>
        i === index ? { ...member, [field]: value } : member
      ),
    }))
  }, [])

  const addMember = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      members: [...prev.members, { friendName: '', amount: '' }],
    }))
  }, [])

  const removeMember = useCallback((index) => {
    setForm((prev) => ({
      ...prev,
      members: prev.members.filter((_, i) => i !== index),
    }))
  }, [])

  const onItemChange = useCallback((index, field, value) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    }))
  }, [])

  const toggleItemAssignment = useCallback((itemIndex, memberIndex) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((item, i) => {
        if (i === itemIndex) {
          const assignedTo = item.assignedTo || []
          const isAssigned = assignedTo.includes(memberIndex)
          return {
            ...item,
            assignedTo: isAssigned
              ? assignedTo.filter((m) => m !== memberIndex)
              : [...assignedTo, memberIndex],
          }
        }
        return item
      }),
    }))
  }, [])

  const addItem = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      items: [...prev.items, { itemName: '', price: '', quantity: '1', assignedTo: [] }],
    }))
  }, [])

  const removeItem = useCallback((index) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }))
  }, [])

  const autoSplitEqual = useCallback(() => {
    const inputTotal = parseInt(form.totalAmount, 10) || 0
    if (inputTotal <= 0) return

    const memberCount = form.members.filter((m) => m.friendName.trim()).length
    if (memberCount === 0) return

    const amountPerMember = Math.floor(inputTotal / memberCount)
    const remainder = inputTotal % memberCount

    setForm((prev) => ({
      ...prev,
      members: prev.members.map((member, index) => {
        if (!member.friendName.trim()) return member
        return {
          ...member,
          amount: String(amountPerMember + (index < remainder ? 1 : 0)),
        }
      }),
    }))
  }, [form.totalAmount, form.members])

  const onSubmit = useCallback(
    async (e) => {
      e.preventDefault()
      setErrorMessage('')
      setIsSubmitting(true)

      try {
        const totalAmount = parseInt(form.totalAmount, 10)
        if (Number.isNaN(totalAmount) || totalAmount <= 0) {
          setErrorMessage(t('pleaseEnterValidAmount', 'Please enter a valid amount'))
          setIsSubmitting(false)
          return
        }

        // Validate members
        const validMembers = form.members.filter((m) => m.friendName.trim())
        if (validMembers.length === 0) {
          setErrorMessage(t('pleaseAddAtLeastOneFriend', 'Please add at least one friend'))
          setIsSubmitting(false)
          return
        }

        if (form.useItems) {
          // Item-based validation
          const validItems = form.items.filter((i) => i.itemName && i.price)
          if (validItems.length === 0) {
            setErrorMessage(t('pleaseAddAtLeastOneItem', 'Please add at least one item'))
            setIsSubmitting(false)
            return
          }

          const itemsTotal = validItems.reduce((sum, i) => sum + parseInt(i.price, 10) * (parseInt(i.quantity, 10) || 1), 0)
          if (itemsTotal !== totalAmount) {
            setErrorMessage(`Items total (${itemsTotal}) must equal total amount (${totalAmount})`)
            setIsSubmitting(false)
            return
          }

          const payload = {
            title: form.title || t('splitExpense', 'Split Expense'),
            description: form.description,
            totalAmount,
            members: validMembers.map((m) => ({
              friendName: m.friendName.trim(),
              amount: 0,
            })),
            items: validItems.map((item) => ({
              itemName: item.itemName.trim(),
              price: parseInt(item.price, 10),
              quantity: parseInt(item.quantity, 10) || 1,
              assignedTo: item.assignedTo || [],
            })),
          }

          await createSplitBill(payload)
        } else {
          // Amount-based validation
          const memberAmountsTotal = validMembers.reduce((sum, m) => sum + parseInt(m.amount, 10), 0)
          if (memberAmountsTotal !== totalAmount) {
            setErrorMessage(
              t('memberAmountsMustEqualTotal', `Member amounts must equal total (${memberAmountsTotal} ≠ ${totalAmount})`)
            )
            setIsSubmitting(false)
            return
          }

          const payload = {
            title: form.title || t('splitExpense', 'Split Expense'),
            description: form.description,
            totalAmount,
            members: validMembers.map((member) => ({
              friendName: member.friendName.trim(),
              amount: parseInt(member.amount, 10),
            })),
          }

          await createSplitBill(payload)
        }

        setForm(defaultForm)
        onSuccess?.()
        navigate('/split-bill')
      } catch (error) {
        setErrorMessage(error.message || t('failedToCreateSplitBill', 'Failed to create split bill'))
      } finally {
        setIsSubmitting(false)
      }
    },
    [form, navigate, onSuccess, t]
  )

  return (
    <div className="fixed inset-0 z-40 flex items-end bg-black/50">
      <div className="w-full rounded-t-3xl border-t border-l border-r border-[#1c1c13] bg-[#fffbeb] p-6 shadow-[0_-4px_0_#1c1c13] max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between mb-4">
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
          <div className="mb-3 rounded-xl border border-[#ba1a1a] bg-[#fee2e2] p-3 text-sm font-semibold text-[#ba1a1a]">
            {errorMessage}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-3 flex-1 overflow-y-auto">
          {/* Title */}
          <label className="block text-[11px] font-bold uppercase">
            {t('title', 'Title')}
            <input
              type="text"
              value={form.title}
              onChange={onTitleChange}
              placeholder="Pizza night"
              className="mt-1 w-full rounded-2xl border border-black bg-[#fffbeb] px-3 py-2 text-sm"
            />
          </label>

          {/* Description */}
          <label className="block text-[11px] font-bold uppercase">
            {t('description', 'Description')}
            <input
              type="text"
              value={form.description}
              onChange={onDescriptionChange}
              placeholder="Friday hangout at Pizza Hut"
              className="mt-1 w-full rounded-2xl border border-black bg-[#fffbeb] px-3 py-2 text-sm"
            />
          </label>

          {/* Total Amount */}
          <label className="block text-[11px] font-bold uppercase">
            {t('totalAmount', 'Total Amount')} (IDR)
            <input
              type="number"
              value={form.totalAmount}
              onChange={onTotalAmountChange}
              placeholder="180000"
              className="mt-1 w-full rounded-2xl border border-black bg-[#fffbeb] px-3 py-2 text-sm"
            />
          </label>

          {/* Toggle between Amount-based and Item-based */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, useItems: false }))}
              className={`flex-1 rounded-2xl border-2 px-3 py-2 text-xs font-bold uppercase ${
                !form.useItems
                  ? 'border-[#6366f1] bg-[#6366f1] text-white'
                  : 'border-[#6366f1] bg-white text-[#6366f1]'
              }`}
            >
              {t('byAmount', 'By Amount')}
            </button>
            <button
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, useItems: true }))}
              className={`flex-1 rounded-2xl border-2 px-3 py-2 text-xs font-bold uppercase ${
                form.useItems
                  ? 'border-[#6366f1] bg-[#6366f1] text-white'
                  : 'border-[#6366f1] bg-white text-[#6366f1]'
              }`}
            >
              {t('byItems', 'By Items')}
            </button>
          </div>

          {/* Members Section */}
          <div className="space-y-2 border-t pt-3">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold uppercase">{t('members', 'Members')}</label>
              {!form.useItems && (
                <button
                  type="button"
                  onClick={autoSplitEqual}
                  disabled={!form.totalAmount || form.members.filter((m) => m.friendName.trim()).length === 0}
                  className="text-[10px] font-bold uppercase px-2 py-1 rounded-xl border border-[#6366f1] text-[#6366f1] bg-white disabled:opacity-40 disabled:border-gray-300 disabled:text-gray-300"
                >
                  {t('autoSplit', 'Auto Split')}
                </button>
              )}
            </div>

            {form.members.map((member, index) => (
              <div key={index} className="flex gap-2 items-end">
                <input
                  type="text"
                  value={member.friendName}
                  onChange={(e) => onMemberChange(index, 'friendName', e.target.value)}
                  placeholder={t('friendName', 'Name')}
                  className="flex-1 rounded-2xl border border-black bg-[#fffbeb] px-3 py-2 text-sm"
                />
                {!form.useItems && (
                  <input
                    type="number"
                    value={member.amount}
                    onChange={(e) => onMemberChange(index, 'amount', e.target.value)}
                    placeholder={t('amount', 'Amount')}
                    className="w-24 rounded-2xl border border-black bg-[#fffbeb] px-3 py-2 text-sm"
                  />
                )}
                <button
                  type="button"
                  onClick={() => removeMember(index)}
                  disabled={form.members.length === 1}
                  className="rounded-2xl border border-[#ba1a1a] bg-[#ffcdd2] px-3 py-2 text-sm font-bold text-[#ba1a1a] disabled:opacity-50"
                >
                  −
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={addMember}
              className="w-full rounded-2xl border border-dashed border-[#6366f1] bg-white px-3 py-2 text-sm font-bold text-[#6366f1] uppercase"
            >
              + {t('addMember', 'Add Member')}
            </button>
          </div>

          {/* Items Section (shown only if useItems is true) */}
          {form.useItems && (
            <div className="space-y-2 border-t pt-3">
              <label className="text-[11px] font-bold uppercase">{t('items', 'Items')}</label>

              {form.items.map((item, itemIndex) => (
                <div key={itemIndex} className="space-y-2 rounded-2xl border border-black p-3 bg-white">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={item.itemName}
                      onChange={(e) => onItemChange(itemIndex, 'itemName', e.target.value)}
                      placeholder={t('itemName', 'Item name')}
                      className="flex-1 rounded-2xl border border-black bg-[#fffbeb] px-2 py-1 text-sm"
                    />
                    <input
                      type="number"
                      value={item.price}
                      onChange={(e) => onItemChange(itemIndex, 'price', e.target.value)}
                      placeholder={t('price', 'Price')}
                      className="w-20 rounded-2xl border border-black bg-[#fffbeb] px-2 py-1 text-sm"
                    />
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => onItemChange(itemIndex, 'quantity', e.target.value)}
                      placeholder="1"
                      className="w-16 rounded-2xl border border-black bg-[#fffbeb] px-2 py-1 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => removeItem(itemIndex)}
                      className="rounded-2xl border border-[#ba1a1a] bg-[#ffcdd2] px-2 py-1 text-sm font-bold text-[#ba1a1a]"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Item Assignment Checklist */}
                  <div className="space-y-1 border-t pt-2">
                    <label className="text-[10px] font-bold uppercase">{t('orderedBy', 'Ordered by')}:</label>
                    <div className="flex flex-wrap gap-2">
                      {form.members.map((member, memberIndex) => (
                        <button
                          key={memberIndex}
                          type="button"
                          onClick={() => toggleItemAssignment(itemIndex, memberIndex)}
                          className={`rounded-full px-2 py-1 text-[10px] font-bold border ${
                            (item.assignedTo || []).includes(memberIndex)
                              ? 'bg-[#6366f1] border-[#6366f1] text-white'
                              : 'bg-white border-[#6366f1] text-[#6366f1]'
                          }`}
                        >
                          {member.friendName || `Person ${memberIndex + 1}`}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addItem}
                className="w-full rounded-2xl border border-dashed border-[#6366f1] bg-white px-3 py-2 text-sm font-bold text-[#6366f1] uppercase"
              >
                + {t('addItem', 'Add Item')}
              </button>
            </div>
          )}

          {/* Summary */}
          <div className="rounded-2xl border border-black bg-white px-3 py-2 text-sm">
            <div className="flex justify-between font-bold">
              <span>{t('total', 'Total')}:</span>
              <span>{toRupiah(totalCalculated)}</span>
            </div>
            {form.totalAmount && totalCalculated !== parseInt(form.totalAmount, 10) && (
              <div className="text-[11px] text-[#ba1a1a] font-semibold mt-1">
                {t('difference', 'Difference')}: {toRupiah(Math.abs(totalCalculated - parseInt(form.totalAmount, 10)))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-2 sticky bottom-0 bg-[#fffbeb]">
            <button
              type="submit"
              disabled={isSubmitting || !isValid}
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

import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getAnalyticsOverview } from '../../services/analytics'
import { createWishlistItem, deleteWishlistItem, getWishlists, updateWishlistItem } from '../../services/wishlist'
import { BottomNavigation } from '../navigation/BottomNavigation'

const defaultForm = {
  item: '',
  price: '',
  priorityScore: '3',
}

function toRupiah(value) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value || 0)
}

function getPriorityLabel(priorityScore) {
  return `P${priorityScore}`
}

function getPriorityTone(priorityScore) {
  if (priorityScore >= 4) return 'bg-[#fee2e2]'
  if (priorityScore <= 2) return 'bg-[#dcfce7]'
  return 'bg-[#fef3c7]'
}

function getCardVisual(index) {
  const visuals = ['bg-[#e1e0ff]', 'bg-[#ffdf9f]', 'bg-[#ffdcc5]', 'bg-[#c7f9cc]']
  return visuals[index % visuals.length]
}

function getBuyability(price, balance) {
  if (price <= 0) {
    return {
      label: 'No price',
      percent: 0,
      needed: 0,
      trackClass: 'bg-[#f3f4f6]',
      fillClass: 'bg-[#9ca3af]',
      badgeClass: 'bg-[#f3f4f6] text-[#374151]',
      cardBadge: 'bg-[#f3f4f6] text-[#374151]',
      ctaLabel: 'Set Price',
      disabled: true,
    }
  }

  const ratio = balance / price
  const percent = Math.max(0, Math.min(100, Math.round(ratio * 100)))

  if (ratio >= 1) {
    return {
      label: 'Buyable',
      percent,
      needed: 0,
      trackClass: 'bg-[#dcfce7]',
      fillClass: 'bg-[#22c55e]',
      badgeClass: 'bg-[#bbf7d0] text-[#14532d]',
      cardBadge: 'bg-[#ffc329] text-[#1c1c13]',
      ctaLabel: 'Checkout Now',
      disabled: false,
    }
  }

  if (ratio >= 0.6) {
    return {
      label: 'Almost',
      percent,
      needed: Math.max(0, price - balance),
      trackClass: 'bg-[#fef3c7]',
      fillClass: 'bg-[#f59e0b]',
      badgeClass: 'bg-[#fde68a] text-[#78350f]',
      cardBadge: 'bg-[#fef3c7] text-[#78350f]',
      ctaLabel: 'Almost There',
      disabled: true,
    }
  }

  return {
    label: 'Not yet',
    percent,
    needed: Math.max(0, price - balance),
    trackClass: 'bg-[#fee2e2]',
    fillClass: 'bg-[#ef4444]',
    badgeClass: 'bg-[#fecaca] text-[#7f1d1d]',
    cardBadge: 'bg-[#ef4444] text-white',
    ctaLabel: 'Insufficient Funds',
    disabled: true,
  }
}

export function WishlistScreen({ mascotImage }) {
  const [wishlistItems, setWishlistItems] = useState([])
  const [form, setForm] = useState(defaultForm)
  const [fieldErrors, setFieldErrors] = useState({})
  const [editingId, setEditingId] = useState(null)
  const [currentBalance, setCurrentBalance] = useState(0)
  const [goalTarget, setGoalTarget] = useState(1000000)
  const [searchQuery, setSearchQuery] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('ALL')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const loadWishlist = async () => {
    const data = await getWishlists()
    setWishlistItems(data.wishlists || [])
  }

  useEffect(() => {
    let cancelled = false

    const bootstrap = async () => {
      setIsLoading(true)
      setErrorMessage('')

      try {
        const [wishlistData, analyticsData] = await Promise.all([getWishlists(), getAnalyticsOverview()])

        if (cancelled) return

        setWishlistItems(wishlistData.wishlists || [])
        setCurrentBalance(analyticsData?.savingsGoal?.achieved || 0)
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(error.message)
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void bootstrap()

    return () => {
      cancelled = true
    }
  }, [])

  const totalWishlistCost = useMemo(
    () => wishlistItems.reduce((sum, entry) => sum + (entry.price || 0), 0),
    [wishlistItems]
  )

  const highestPriorityItem = useMemo(
    () => wishlistItems.slice().sort((a, b) => b.priorityScore - a.priorityScore)[0] || null,
    [wishlistItems]
  )

  const goalProgress = useMemo(() => {
    if (goalTarget <= 0) return 0
    return Math.max(0, Math.min(100, Math.round((currentBalance / goalTarget) * 100)))
  }, [currentBalance, goalTarget])

  const featuredProgress = useMemo(() => {
    if (!highestPriorityItem || highestPriorityItem.price <= 0) return 0
    return Math.max(0, Math.min(100, Math.round((currentBalance / highestPriorityItem.price) * 100)))
  }, [currentBalance, highestPriorityItem])

  const filteredItems = useMemo(() => {
    return wishlistItems.filter((entry) => {
      const matchQuery = entry.item.toLowerCase().includes(searchQuery.toLowerCase())
      const matchPriority = priorityFilter === 'ALL' || entry.priorityScore === Number(priorityFilter)
      return matchQuery && matchPriority
    })
  }, [wishlistItems, searchQuery, priorityFilter])

  const hamsterSuggestion = useMemo(() => {
    if (!highestPriorityItem) {
      return 'Add your first wishlist item so LIVO can suggest your next smart purchase.'
    }

    const needed = Math.max(0, highestPriorityItem.price - currentBalance)
    if (needed === 0) {
      return `You can buy ${highestPriorityItem.item} now. Great discipline and timing.`
    }

    return `Hold for now. You only need ${toRupiah(needed)} more to safely buy ${highestPriorityItem.item}.`
  }, [currentBalance, highestPriorityItem])

  const onChangeForm = (event) => {
    const { name, value } = event.target
    const nextValue = name === 'price' ? value.replace(/\D/g, '') : value

    setFieldErrors((prev) => ({ ...prev, [name]: '' }))
    setForm((prev) => ({ ...prev, [name]: nextValue }))
  }

  const resetForm = () => {
    setForm(defaultForm)
    setFieldErrors({})
    setEditingId(null)
  }

  const validateForm = () => {
    const nextErrors = {}
    const item = form.item.trim()
    const parsedPrice = Number(form.price)
    const parsedPriority = Number(form.priorityScore)

    if (item.length < 2) {
      nextErrors.item = 'Item minimal 2 karakter.'
    }

    if (!Number.isInteger(parsedPrice) || parsedPrice <= 0) {
      nextErrors.price = 'Harga harus berupa angka bulat positif.'
    }

    if (!Number.isInteger(parsedPriority) || parsedPriority < 1 || parsedPriority > 5) {
      nextErrors.priorityScore = 'Priority score harus 1-5.'
    }

    setFieldErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const onSubmit = async (event) => {
    event.preventDefault()
    if (!validateForm()) {
      setErrorMessage('Periksa kembali input form.')
      return
    }

    const price = Number(form.price)

    setIsSaving(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const payload = {
        item: form.item.trim(),
        price,
        priorityScore: Number(form.priorityScore),
      }

      if (editingId) {
        await updateWishlistItem(editingId, payload)
      } else {
        await createWishlistItem(payload)
      }

      resetForm()
      await loadWishlist()
      setSuccessMessage(editingId ? 'Wishlist item berhasil diperbarui.' : 'Wishlist item berhasil ditambahkan.')
    } catch (error) {
      setErrorMessage(error.message)
      const incomingFieldErrors = error.fieldErrors || {}
      setFieldErrors({
        item: incomingFieldErrors.item?.[0] || '',
        price: incomingFieldErrors.price?.[0] || '',
        priorityScore: incomingFieldErrors.priorityScore?.[0] || '',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const onEdit = (entry) => {
    setSuccessMessage('')
    setErrorMessage('')
    setFieldErrors({})

    setEditingId(entry.id)
    setForm({
      item: entry.item,
      price: String(entry.price),
      priorityScore: String(entry.priorityScore),
    })
  }

  const onDelete = async (id) => {
    setErrorMessage('')
    setSuccessMessage('')

    try {
      await deleteWishlistItem(id)
      if (editingId === id) {
        resetForm()
      }
      await loadWishlist()
      setSuccessMessage('Wishlist item berhasil dihapus.')
    } catch (error) {
      setErrorMessage(error.message)
    }
  }

  const onPurchase = async (entry) => {
    if (getBuyability(entry.price, currentBalance).disabled) {
      return
    }

    setErrorMessage('')
    setSuccessMessage('')

    try {
      await deleteWishlistItem(entry.id)
      if (editingId === entry.id) {
        resetForm()
      }
      await loadWishlist()
      setSuccessMessage(`Pembelian ${entry.item} ditandai selesai.`)
    } catch (error) {
      setErrorMessage(error.message)
    }
  }

  return (
    <div className="min-h-svh bg-[#fdf9e9] pb-32 text-[#1c1c13]">
      <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-[#1c1c13] bg-[#fdf9e9] px-4 shadow-[2px_2px_0_#1c1c13]">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 overflow-hidden rounded-full border border-[#1c1c13] bg-[#ffc329]">
            <img src={mascotImage} alt="LIVO Mascot" className="h-full w-full object-cover" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">LIVO</h1>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/home"
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#1c1c13] bg-white shadow-[2px_2px_0_#1c1c13]"
            aria-label="Back home"
          >
            <span className="material-symbols-outlined">home</span>
          </Link>
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#1c1c13] bg-white shadow-[2px_2px_0_#1c1c13]"
            aria-label="Profile"
          >
            <span className="material-symbols-outlined">account_circle</span>
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-lg space-y-6 px-4 pt-5">
        <section className="relative pt-2">
          <div className="rounded-xl border border-[#1c1c13] bg-white p-4 shadow-[4px_4px_0_#1c1c13]">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#1c1c13] bg-[#6366f1]">
                <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1" }}>
                  pets
                </span>
              </div>
              <div>
                <p className="mb-1 text-[11px] font-black uppercase tracking-wider text-[#4648d4]">Hamster Suggestion</p>
                <p className="text-base leading-tight font-bold">{hamsterSuggestion}</p>
              </div>
            </div>
          </div>
          <div className="absolute -bottom-2 left-10 h-4 w-4 rotate-45 border-r border-b border-[#1c1c13] bg-white" />
        </section>

        <section className="grid grid-cols-2 gap-3">
          <article className="rounded-xl border border-[#1c1c13] bg-[#6063ee] p-4 text-white shadow-[2px_2px_0_#1c1c13]">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
              savings
            </span>
            <p className="mt-2 text-[10px] font-bold uppercase">Total Saved</p>
            <p className="text-xl font-extrabold">{toRupiah(currentBalance)}</p>
          </article>
          <article className="rounded-xl border border-[#1c1c13] bg-[#ffc329] p-4 text-[#1c1c13] shadow-[2px_2px_0_#1c1c13]">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
              stars
            </span>
            <p className="mt-2 text-[10px] font-bold uppercase">Next Goal</p>
            <p className="text-xl font-extrabold">{goalProgress}%</p>
          </article>
        </section>

        <section className="overflow-hidden rounded-xl border border-[#1c1c13] bg-[#f8f4e4] shadow-[4px_4px_0_#1c1c13]">
          <div className="flex items-center justify-between border-b border-[#1c1c13] bg-white p-4">
            <h3 className="text-sm font-black uppercase tracking-tight">
              Active Goal: {highestPriorityItem ? highestPriorityItem.item : 'No item yet'}
            </h3>
            <span className="rounded-full border border-[#1c1c13] bg-[#ffc329] px-2 py-0.5 text-[10px] font-black uppercase">
              {highestPriorityItem ? `${getPriorityLabel(highestPriorityItem.priorityScore)} Priority` : 'Set Priority'}
            </span>
          </div>

          <div className="space-y-4 p-4">
            <div className="flex items-end justify-between">
              <p className="text-2xl font-extrabold">
                {toRupiah(Math.min(currentBalance, highestPriorityItem?.price || 0))}
                <span className="ml-1 text-sm font-semibold text-[#464554]">/ {toRupiah(highestPriorityItem?.price || goalTarget)}</span>
              </p>
              <span className="font-black text-[#4648d4]">{featuredProgress}%</span>
            </div>

            <div className="h-7 w-full overflow-hidden rounded-full border-2 border-[#1c1c13] bg-white p-1">
              <div className="h-full rounded-full border border-[#1c1c13] bg-[#4648d4]" style={{ width: `${featuredProgress}%` }} />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <label className="block text-[10px] font-black uppercase">
                Balance (Rp)
                <input
                  type="number"
                  min="0"
                  value={currentBalance}
                  onChange={(event) => setCurrentBalance(Number(event.target.value) || 0)}
                  className="mt-1 min-h-11 w-full rounded-lg border border-[#1c1c13] bg-white px-3 text-sm"
                />
              </label>
              <label className="block text-[10px] font-black uppercase">
                Goal (Rp)
                <input
                  type="number"
                  min="1"
                  value={goalTarget}
                  onChange={(event) => setGoalTarget(Number(event.target.value) || 0)}
                  className="mt-1 min-h-11 w-full rounded-lg border border-[#1c1c13] bg-white px-3 text-sm"
                />
              </label>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-[#1c1c13] bg-white p-4 shadow-[2px_2px_0_#1c1c13]">
          <h3 className="text-sm font-black uppercase tracking-wide">{editingId ? 'Edit Wishlist Item' : 'Add Wishlist Item'}</h3>
          <form className="mt-3 grid gap-2" onSubmit={onSubmit}>
            <input
              name="item"
              value={form.item}
              onChange={onChangeForm}
              placeholder="Item name"
              className="min-h-11 rounded-lg border border-[#1c1c13] bg-[#fffbeb] px-3 text-sm font-semibold"
            />
            {fieldErrors.item ? <p className="text-xs font-bold text-[#b91c1c]">{fieldErrors.item}</p> : null}
            <div className="grid grid-cols-2 gap-2">
              <input
                name="price"
                type="text"
                inputMode="numeric"
                value={form.price}
                onChange={onChangeForm}
                placeholder="Price (Rp)"
                className="min-h-11 rounded-lg border border-[#1c1c13] bg-[#fffbeb] px-3 text-sm font-semibold"
              />
              <select
                name="priorityScore"
                value={form.priorityScore}
                onChange={onChangeForm}
                className="min-h-11 rounded-lg border border-[#1c1c13] bg-[#fffbeb] px-3 text-sm font-semibold"
              >
                <option value="5">Priority 5 (Highest)</option>
                <option value="4">Priority 4</option>
                <option value="3">Priority 3</option>
                <option value="2">Priority 2</option>
                <option value="1">Priority 1 (Lowest)</option>
              </select>
            </div>
            {fieldErrors.price ? <p className="text-xs font-bold text-[#b91c1c]">{fieldErrors.price}</p> : null}
            {fieldErrors.priorityScore ? <p className="text-xs font-bold text-[#b91c1c]">{fieldErrors.priorityScore}</p> : null}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="submit"
                disabled={isSaving}
                className="min-h-11 rounded-lg border border-[#1c1c13] bg-[#4648d4] px-3 text-xs font-black uppercase text-white shadow-[2px_2px_0_#1c1c13]"
              >
                {isSaving ? 'Saving...' : editingId ? 'Update Item' : 'Add Item'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="min-h-11 rounded-lg border border-[#1c1c13] bg-white px-3 text-xs font-black uppercase shadow-[2px_2px_0_#1c1c13]"
              >
                Reset
              </button>
            </div>
          </form>
        </section>

        <section className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search wishlist..."
                className="min-h-11 w-full rounded-lg border border-[#1c1c13] bg-white px-3 text-sm font-semibold"
              />
            </div>
            <select
              value={priorityFilter}
              onChange={(event) => setPriorityFilter(event.target.value)}
              className="min-h-11 rounded-lg border border-[#1c1c13] bg-white px-3 text-sm font-bold"
              aria-label="Filter by priority"
            >
              <option value="ALL">All</option>
              <option value="5">P5</option>
              <option value="4">P4</option>
              <option value="3">P3</option>
              <option value="2">P2</option>
              <option value="1">P1</option>
            </select>
          </div>
        </section>

        {errorMessage ? (
          <section className="rounded-xl border border-black bg-[#fee2e2] p-3 text-sm font-semibold text-[#7f1d1d]">{errorMessage}</section>
        ) : null}
        {successMessage ? (
          <section className="rounded-xl border border-black bg-[#dcfce7] p-3 text-sm font-semibold text-[#14532d]">{successMessage}</section>
        ) : null}

        <section className="pb-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-xl font-black tracking-tight">Wishlist Items</h3>
            <p className="text-xs font-bold uppercase text-[#464554]">Total {toRupiah(totalWishlistCost)}</p>
          </div>

          {isLoading ? <p className="text-sm font-semibold">Loading wishlist...</p> : null}
          {!isLoading && filteredItems.length === 0 ? (
            <article className="rounded-xl border border-[#1c1c13] bg-white p-4 text-sm font-semibold shadow-[2px_2px_0_#1c1c13]">
              No wishlist item matches your filter.
            </article>
          ) : null}

          <div className="space-y-4">
            {filteredItems.map((entry, index) => {
              const buyability = getBuyability(entry.price, currentBalance)

              return (
                <article key={entry.id} className="overflow-hidden rounded-xl border border-[#1c1c13] bg-white shadow-[4px_4px_0_#1c1c13]">
                  <div className={`relative h-36 border-b border-[#1c1c13] ${getCardVisual(index)}`}>
                    <div className={`absolute right-3 top-3 rounded border border-[#1c1c13] px-2 py-1 text-[10px] font-black uppercase shadow-[2px_2px_0_#1c1c13] ${buyability.cardBadge}`}>
                      {buyability.label}
                    </div>
                    <div className="flex h-full items-center justify-center px-4">
                      <p className="text-center text-xl font-black tracking-tight">{entry.item}</p>
                    </div>
                  </div>

                  <div className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-lg font-black tracking-tight">{entry.item}</h4>
                        <p className="text-sm font-bold text-[#464554]">{toRupiah(entry.price)}</p>
                      </div>
                      <span className={`rounded-full border border-[#1c1c13] px-2 py-1 text-[10px] font-black uppercase ${getPriorityTone(entry.priorityScore)}`}>
                        {getPriorityLabel(entry.priorityScore)}
                      </span>
                    </div>

                    <div className="rounded-lg border border-[#1c1c13] bg-[#f8f4e4] p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase text-[#464554]">Buyability Meter</span>
                        <span className={`rounded-full border border-[#1c1c13] px-2 py-0.5 text-[10px] font-black uppercase ${buyability.badgeClass}`}>
                          {buyability.percent}%
                        </span>
                      </div>
                      <div className={`h-2.5 w-full overflow-hidden rounded-full border border-[#1c1c13] ${buyability.trackClass}`}>
                        <div className={`h-full border-r border-[#1c1c13] ${buyability.fillClass}`} style={{ width: `${buyability.percent}%` }} />
                      </div>
                      {buyability.needed > 0 ? (
                        <p className="mt-2 text-[11px] font-bold text-[#7f1d1d]">Need {toRupiah(buyability.needed)} more to buy safely.</p>
                      ) : (
                        <p className="mt-2 text-[11px] font-bold text-[#14532d]">Budget ready for checkout.</p>
                      )}
                    </div>

                    <div className="grid grid-cols-[1fr_auto_auto] gap-2">
                      <button
                        type="button"
                        disabled={buyability.disabled}
                        onClick={() => onPurchase(entry)}
                        className={`min-h-11 rounded-lg border border-[#1c1c13] px-3 text-[11px] font-black uppercase shadow-[2px_2px_0_#1c1c13] ${
                          buyability.disabled ? 'cursor-not-allowed bg-[#e6e3d3] text-[#464554]' : 'bg-[#4648d4] text-white'
                        }`}
                      >
                        {buyability.ctaLabel}
                      </button>
                      <button
                        type="button"
                        onClick={() => onEdit(entry)}
                        className="flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-[#1c1c13] bg-[#ffc329] shadow-[2px_2px_0_#1c1c13]"
                        aria-label={`Edit ${entry.item}`}
                      >
                        <span className="material-symbols-outlined">edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(entry.id)}
                        className="flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-[#1c1c13] bg-white shadow-[2px_2px_0_#1c1c13]"
                        aria-label={`Delete ${entry.item}`}
                      >
                        <span className="material-symbols-outlined">delete</span>
                      </button>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        </section>
      </main>

      <BottomNavigation />
    </div>
  )
}

import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  createSplitBill,
  deleteSplitBill,
  getSplitBills,
  updateSplitBill,
  updateSplitBillMemberStatus,
} from '../../services/splitBill'

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

function buildFormFromBill(splitBill) {
  return {
    title: splitBill.title,
    description: splitBill.description || '',
    totalAmount: String(splitBill.totalAmount),
    friends: splitBill.members.map((member) => member.friendName).join('\n'),
  }
}

export function HistorySplitBillScreen({ mascotImage }) {
  const [activeTab, setActiveTab] = useState('history')
  const [form, setForm] = useState(defaultForm)
  const [splitBills, setSplitBills] = useState([])
  const [summary, setSummary] = useState({ total: 0, paid: 0, unpaid: 0 })
  const [editingId, setEditingId] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const refreshSplitBills = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage('')

    try {
      const data = await getSplitBills()
      setSplitBills(data.splitBills || [])
      setSummary(data.summary || { total: 0, paid: 0, unpaid: 0 })
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void refreshSplitBills()
  }, [refreshSplitBills])

  const onChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const resetForm = () => {
    setForm(defaultForm)
    setEditingId(null)
  }

  const onSubmit = async (event) => {
    event.preventDefault()

    const parsedTotal = Number(form.totalAmount)
    const members = parseFriends(form.friends)

    if (!form.title || !parsedTotal || members.length === 0) {
      setErrorMessage('Lengkapi judul, total tagihan, dan daftar teman.')
      return
    }

    setIsSubmitting(true)
    setErrorMessage('')

    const payload = {
      title: form.title,
      description: form.description,
      totalAmount: parsedTotal,
      members,
    }

    try {
      if (editingId) {
        await updateSplitBill(editingId, payload)
      } else {
        await createSplitBill(payload)
      }

      resetForm()
      setActiveTab('history')
      await refreshSplitBills()
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const onEdit = (splitBill) => {
    setEditingId(splitBill.id)
    setForm(buildFormFromBill(splitBill))
    setActiveTab('split')
  }

  const onDelete = async (id) => {
    setErrorMessage('')

    try {
      await deleteSplitBill(id)
      if (editingId === id) {
        resetForm()
      }
      await refreshSplitBills()
    } catch (error) {
      setErrorMessage(error.message)
    }
  }

  const onToggleMemberStatus = async (splitBillId, memberId, currentStatus) => {
    setErrorMessage('')

    try {
      const nextStatus = currentStatus === 'PAID' ? 'UNPAID' : 'PAID'
      await updateSplitBillMemberStatus(splitBillId, memberId, nextStatus)
      await refreshSplitBills()
    } catch (error) {
      setErrorMessage(error.message)
    }
  }

  return (
    <div className="min-h-svh bg-[#fffbeb] pb-30 text-[#1c1c13]">
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-black bg-[#fffbeb] px-4 py-3 shadow-[4px_4px_0_#1c1c13]">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 overflow-hidden rounded-full border border-black bg-[#fbbf24] p-1">
            <img src={mascotImage} alt="LIVO mascot" className="h-full w-full object-cover" />
          </div>
          <div>
            <h1 className="text-xl font-black uppercase tracking-tight">History & Split Bill</h1>
            <p className="text-[11px] font-semibold text-[#464554]">LIVO Social Finance</p>
          </div>
        </div>

        <Link
          to="/home"
          className="flex min-h-11 items-center rounded-xl border border-black bg-white px-3 text-xs font-black uppercase shadow-[2px_2px_0_#1c1c13]"
        >
          Home
        </Link>
      </header>

      <main className="mx-auto max-w-md space-y-6 px-4 py-6">
        <section className="grid grid-cols-2 gap-3">
          <article className="rounded-2xl border border-black bg-white p-4">
            <p className="text-[10px] font-bold uppercase text-[#464554]">Total Split</p>
            <p className="text-lg font-black text-[#6366f1]">{toRupiah(summary.total)}</p>
          </article>
          <article className="rounded-2xl border border-black bg-white p-4">
            <p className="text-[10px] font-bold uppercase text-[#464554]">Belum Lunas</p>
            <p className="text-lg font-black text-[#ba1a1a]">{toRupiah(summary.unpaid)}</p>
          </article>
        </section>

        <section className="rounded-2xl border border-black bg-[#fff9dc] p-1">
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`min-h-11 flex-1 rounded-xl border border-black text-xs font-black uppercase ${
                activeTab === 'history'
                  ? 'bg-[#6366f1] text-white shadow-[2px_2px_0_#1c1c13]'
                  : 'bg-transparent text-[#1c1c13]'
              }`}
            >
              History
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('split')}
              className={`min-h-11 flex-1 rounded-xl border border-black text-xs font-black uppercase ${
                activeTab === 'split'
                  ? 'bg-[#fbbf24] text-[#1c1c13] shadow-[2px_2px_0_#1c1c13]'
                  : 'bg-transparent text-[#1c1c13]'
              }`}
            >
              Split Bill
            </button>
          </div>
        </section>

        {errorMessage ? (
          <p className="rounded-2xl border border-black bg-[#fee2e2] px-3 py-2 text-sm font-semibold text-[#7f1d1d]">{errorMessage}</p>
        ) : null}

        {activeTab === 'split' ? (
          <section className="rounded-2xl border border-black bg-white p-4">
            <h2 className="text-sm font-black uppercase">{editingId ? 'Edit Split Bill' : 'Buat Split Bill Baru'}</h2>
            <form className="mt-3 space-y-3" onSubmit={onSubmit}>
              <label className="block text-[11px] font-bold uppercase">
                Judul
                <input
                  name="title"
                  value={form.title}
                  onChange={onChange}
                  placeholder="Contoh: Makan bareng kelas"
                  className="mt-1 min-h-11 w-full rounded-2xl border border-black bg-[#fffbeb] px-3 text-sm"
                />
              </label>

              <label className="block text-[11px] font-bold uppercase">
                Total Tagihan (Rp)
                <input
                  name="totalAmount"
                  type="number"
                  min="1"
                  value={form.totalAmount}
                  onChange={onChange}
                  placeholder="150000"
                  className="mt-1 min-h-11 w-full rounded-2xl border border-black bg-[#fffbeb] px-3 text-sm"
                />
              </label>

              <label className="block text-[11px] font-bold uppercase">
                Deskripsi (Opsional)
                <input
                  name="description"
                  value={form.description}
                  onChange={onChange}
                  placeholder="Makan malam habis UTS"
                  className="mt-1 min-h-11 w-full rounded-2xl border border-black bg-[#fffbeb] px-3 text-sm"
                />
              </label>

              <label className="block text-[11px] font-bold uppercase">
                Daftar Teman (1 nama per baris)
                <textarea
                  name="friends"
                  value={form.friends}
                  onChange={onChange}
                  rows={4}
                  placeholder={'Bagas\nSiska\nDini'}
                  className="mt-1 w-full rounded-2xl border border-black bg-[#fffbeb] px-3 py-2 text-sm"
                />
              </label>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="min-h-11 rounded-2xl border border-black bg-[#6366f1] px-3 text-xs font-black uppercase text-white shadow-[2px_2px_0_#1c1c13]"
                >
                  {isSubmitting ? 'Menyimpan...' : editingId ? 'Update Split' : 'Simpan Split'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="min-h-11 rounded-2xl border border-black bg-white px-3 text-xs font-black uppercase"
                >
                  Reset Form
                </button>
              </div>
            </form>
          </section>
        ) : null}

        {activeTab === 'history' ? (
          <section className="space-y-3">
            <h2 className="text-lg font-black uppercase">Active Splits</h2>
            {isLoading ? <p className="text-sm font-semibold">Memuat data split bill...</p> : null}
            {!isLoading && splitBills.length === 0 ? (
              <p className="rounded-2xl border border-black bg-white px-4 py-3 text-sm font-semibold">
                Belum ada split bill. Buat dari tab Split Bill.
              </p>
            ) : null}

            {splitBills.map((splitBill) => (
              <article key={splitBill.id} className="rounded-2xl border border-black bg-white p-4 shadow-[4px_4px_0_#1c1c13]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-black">{splitBill.title}</h3>
                    <p className="text-[10px] font-bold uppercase text-[#464554]">
                      {splitBill.description || 'Tanpa deskripsi'}
                    </p>
                    <p className="mt-1 text-xs font-semibold">Total: {toRupiah(splitBill.totalAmount)}</p>
                  </div>
                  <span
                    className={`rounded-full border border-black px-2 py-1 text-[10px] font-black uppercase ${
                      splitBill.status === 'PAID'
                        ? 'bg-[#bbf7d0]'
                        : splitBill.status === 'PARTIALLY_PAID'
                          ? 'bg-[#fef08a]'
                          : 'bg-[#fee2e2]'
                    }`}
                  >
                    {splitBill.status}
                  </span>
                </div>

                <ul className="mt-3 space-y-2 border-t border-black pt-3">
                  {splitBill.members.map((member) => (
                    <li key={member.id} className="rounded-xl border border-black bg-[#fffbeb] p-2">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="text-xs font-black">{member.friendName}</p>
                          <p className="text-[11px] font-semibold">{toRupiah(member.amount)}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => onToggleMemberStatus(splitBill.id, member.id, member.status)}
                          className={`min-h-11 rounded-xl border border-black px-3 text-[10px] font-black uppercase ${
                            member.status === 'PAID' ? 'bg-[#bbf7d0]' : 'bg-[#fbbf24]'
                          }`}
                        >
                          {member.status === 'PAID' ? 'Mark Unpaid' : 'Mark Paid'}
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => onEdit(splitBill)}
                    className="min-h-11 rounded-xl border border-black bg-[#6366f1] px-3 text-[10px] font-black uppercase text-white"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(splitBill.id)}
                    className="min-h-11 rounded-xl border border-black bg-white px-3 text-[10px] font-black uppercase"
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </section>
        ) : null}
      </main>
    </div>
  )
}

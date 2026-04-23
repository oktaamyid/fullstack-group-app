import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  createTransaction,
  deleteTransaction,
  getTransactions,
  updateTransaction,
} from '../../services/transaction'
import { PageLayout } from '../layouts/PageLayout'
import { PageHeader } from '../headers/PageHeader'

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

function formatDate(dateString) {
  const date = new Date(dateString)
  return date.toLocaleDateString('id-ID', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function TransactionScreen({ mainLogo }) {
  const [activeTab, setActiveTab] = useState('list')
  const [form, setForm] = useState(defaultForm)
  const [transactions, setTransactions] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [filterType, setFilterType] = useState('ALL')

  const refreshTransactions = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage('')

    try {
      const data = await getTransactions()
      setTransactions(data.transactions || [])
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void refreshTransactions()
  }, [refreshTransactions])

  const filteredTransactions = useMemo(() => {
    if (filterType === 'ALL') return transactions
    return transactions.filter((t) => t.type === filterType)
  }, [transactions, filterType])

  const summary = useMemo(() => {
    const income = transactions
      .filter((t) => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0)
    const expense = transactions
      .filter((t) => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0)
    return {
      income,
      expense,
      net: income - expense,
    }
  }, [transactions])

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

    const amount = Number(form.amount)

    if (!form.description.trim() || !Number.isFinite(amount) || amount <= 0 || !form.date) {
      setErrorMessage('Lengkapi deskripsi, jumlah, tanggal, dan tipe transaksi.')
      return
    }

    setIsSubmitting(true)
    setErrorMessage('')

    const payload = {
      type: form.type,
      category: form.category,
      amount,
      description: form.description.trim(),
      date: form.date,
    }

    try {
      if (editingId) {
        await updateTransaction(editingId, payload)
      } else {
        await createTransaction(payload)
      }

      resetForm()
      setActiveTab('list')
      await refreshTransactions()
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const onEdit = (transaction) => {
    setEditingId(transaction.id)
    setForm({
      type: transaction.type,
      category: transaction.category,
      amount: String(transaction.amount),
      description: transaction.description,
      date: transaction.date.split('T')[0],
    })
    setActiveTab('create')
  }

  const onDelete = async (id) => {
    setErrorMessage('')

    try {
      await deleteTransaction(id)
      if (editingId === id) {
        resetForm()
      }
      await refreshTransactions()
    } catch (error) {
      setErrorMessage(error.message)
    }
  }

  const availableCategories = CATEGORIES[form.type] || []

  return (
    <PageLayout
      header={
        <PageHeader
          mainLogo={mainLogo}
          title="Transactions"
          backLink="/home"
        />
      }
      className="space-y-6 py-6 lg:space-y-0 lg:p-8"
    >
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left Column: Summary & List */}
        <div className="lg:col-span-2 space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-4">
            <article className="rounded-xl lg:rounded-2xl border border-[#1c1c13] bg-[#f8f4e4] p-4 lg:p-6 shadow-[2px_2px_0_#1c1c13]">
              <p className="text-[10px] lg:text-xs font-bold uppercase text-[#464554]">Income</p>
              <p className="text-lg lg:text-3xl font-black text-[#22c55e] mt-2">{toCurrency(summary.income)}</p>
            </article>
            <article className="rounded-xl lg:rounded-2xl border border-[#1c1c13] bg-[#f8f4e4] p-4 lg:p-6 shadow-[2px_2px_0_#1c1c13]">
              <p className="text-[10px] lg:text-xs font-bold uppercase text-[#464554]">Expense</p>
              <p className="text-lg lg:text-3xl font-black text-[#ba1a1a] mt-2">{toCurrency(summary.expense)}</p>
            </article>
            <article className="hidden lg:block rounded-2xl border border-[#1c1c13] bg-[#fff9dc] p-6 shadow-[2px_2px_0_#1c1c13]">
              <p className="text-xs font-bold uppercase text-[#464554]">Net Balance</p>
              <p className={`text-3xl font-black mt-2 ${summary.net >= 0 ? 'text-[#22c55e]' : 'text-[#ba1a1a]'}`}>
                {toCurrency(summary.net)}
              </p>
            </article>
          </div>

          {/* Filter Tabs */}
          <section className="rounded-xl lg:rounded-2xl border border-[#1c1c13] bg-[#fff9dc] p-1 lg:p-2">
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setFilterType('ALL')}
                className={`min-h-11 flex-1 rounded-xl border text-xs font-black uppercase transition-all ${
                  filterType === 'ALL'
                    ? 'border-[#1c1c13] bg-[#6366f1] text-white shadow-[2px_2px_0_#1c1c13]'
                    : 'border-transparent bg-transparent text-[#1c1c13] hover:border-[#1c1c13]'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setFilterType('INCOME')}
                className={`min-h-11 flex-1 rounded-xl border text-xs font-black uppercase transition-all ${
                  filterType === 'INCOME'
                    ? 'border-[#1c1c13] bg-[#22c55e] text-white shadow-[2px_2px_0_#1c1c13]'
                    : 'border-transparent bg-transparent text-[#1c1c13] hover:border-[#1c1c13]'
                }`}
              >
                Income
              </button>
              <button
                type="button"
                onClick={() => setFilterType('EXPENSE')}
                className={`min-h-11 flex-1 rounded-xl border text-xs font-black uppercase transition-all ${
                  filterType === 'EXPENSE'
                    ? 'border-[#1c1c13] bg-[#ba1a1a] text-white shadow-[2px_2px_0_#1c1c13]'
                    : 'border-transparent bg-transparent text-[#1c1c13] hover:border-[#1c1c13]'
                }`}
              >
                Expense
              </button>
            </div>
          </section>

          {errorMessage ? (
            <p className="rounded-xl lg:rounded-2xl border border-[#1c1c13] bg-[#fee2e2] px-4 py-3 text-sm font-semibold text-[#7f1d1d]">
              {errorMessage}
            </p>
          ) : null}

          {/* Transaction List */}
          <section className="rounded-lg lg:rounded-xl border border-[#1c1c13] bg-white p-4 lg:p-6 shadow-[2px_2px_0_#1c1c13]">
            <h2 className="text-lg lg:text-xl font-black uppercase mb-4">Transactions</h2>

            {isLoading ? (
              <p className="text-sm font-semibold">Memuat transaksi...</p>
            ) : null}

            {!isLoading && filteredTransactions.length === 0 ? (
              <p className="rounded-lg lg:rounded-xl border border-[#1c1c13] bg-[#fffbeb] px-4 py-3 text-sm font-semibold">
                Belum ada transaksi. Buat dari tab Tambah Transaksi.
              </p>
            ) : null}

            <div className="space-y-3">
              {filteredTransactions.map((transaction) => (
                <article
                  key={transaction.id}
                  className="rounded-lg lg:rounded-xl border border-[#1c1c13] bg-[#fffbeb] p-4 lg:p-5 shadow-[2px_2px_0_#1c1c13] flex items-center justify-between gap-3"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{CATEGORY_LABELS[transaction.category] || transaction.category}</span>
                      <span
                        className={`text-xs font-black px-2 py-1 rounded-full border border-[#1c1c13] ${
                          transaction.type === 'INCOME'
                            ? 'bg-[#bbf7d0] text-[#065f46]'
                            : 'bg-[#fee2e2] text-[#7f1d1d]'
                        }`}
                      >
                        {transaction.type}
                      </span>
                    </div>
                    <p className="text-sm font-semibold">{transaction.description}</p>
                    <p className="text-xs text-[#464554] font-bold uppercase">{formatDate(transaction.date)}</p>
                  </div>

                  <div className="text-right">
                    <p
                      className={`text-lg lg:text-xl font-black ${
                        transaction.type === 'INCOME' ? 'text-[#22c55e]' : 'text-[#ba1a1a]'
                      }`}
                    >
                      {transaction.type === 'INCOME' ? '+' : '-'}
                      {toCurrency(transaction.amount)}
                    </p>
                    <div className="flex gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() => onEdit(transaction)}
                        className="text-xs font-black uppercase px-2 py-1 rounded-lg border border-[#1c1c13] bg-[#e1e0ff] hover:bg-[#6366f1] hover:text-white transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(transaction.id)}
                        className="text-xs font-black uppercase px-2 py-1 rounded-lg border border-[#1c1c13] bg-[#fee2e2] hover:bg-[#ba1a1a] hover:text-white transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>

        {/* Right Column: Create Form */}
        <div className="space-y-6">
          {/* Tab Switcher */}
          <section className="rounded-xl lg:rounded-2xl border border-[#1c1c13] bg-[#fff9dc] p-1 lg:p-2">
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setActiveTab('list')}
                className={`min-h-11 flex-1 rounded-xl border text-xs font-black uppercase transition-all ${
                  activeTab === 'list'
                    ? 'border-[#1c1c13] bg-[#6366f1] text-white shadow-[2px_2px_0_#1c1c13]'
                    : 'border-transparent bg-transparent text-[#1c1c13] hover:border-[#1c1c13]'
                }`}
              >
                Daftar
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('create')}
                className={`min-h-11 flex-1 rounded-xl border text-xs font-black uppercase transition-all ${
                  activeTab === 'create'
                    ? 'border-[#1c1c13] bg-[#fbbf24] text-[#1c1c13] shadow-[2px_2px_0_#1c1c13]'
                    : 'border-transparent bg-transparent text-[#1c1c13] hover:border-[#1c1c13]'
                }`}
              >
                Tambah
              </button>
            </div>
          </section>

          {activeTab === 'create' ? (
            <section className="rounded-xl lg:rounded-2xl border border-[#1c1c13] bg-white p-4 lg:p-6 shadow-[2px_2px_0_#1c1c13]">
              <h2 className="text-sm font-black uppercase">
                {editingId ? 'Edit Transaksi' : 'Transaksi Baru'}
              </h2>

              <form className="mt-4 space-y-3" onSubmit={onSubmit}>
                <label className="block text-[11px] font-bold uppercase">
                  Tipe Transaksi
                  <select
                    name="type"
                    value={form.type}
                    onChange={(e) => {
                      setForm((prev) => ({
                        ...prev,
                        type: e.target.value,
                        category: CATEGORIES[e.target.value][0],
                      }))
                    }}
                    className="mt-1 min-h-11 w-full rounded-xl lg:rounded-2xl border border-[#1c1c13] bg-[#fffbeb] px-3 text-sm"
                  >
                    {TRANSACTION_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block text-[11px] font-bold uppercase">
                  Kategori
                  <select
                    name="category"
                    value={form.category}
                    onChange={onChange}
                    className="mt-1 min-h-11 w-full rounded-xl lg:rounded-2xl border border-[#1c1c13] bg-[#fffbeb] px-3 text-sm"
                  >
                    {availableCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {CATEGORY_LABELS[cat] || cat}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block text-[11px] font-bold uppercase">
                  Jumlah (Rp)
                  <input
                    name="amount"
                    type="number"
                    min="1"
                    value={form.amount}
                    onChange={onChange}
                    placeholder="50000"
                    className="mt-1 min-h-11 w-full rounded-xl lg:rounded-2xl border border-[#1c1c13] bg-[#fffbeb] px-3 text-sm"
                  />
                </label>

                <label className="block text-[11px] font-bold uppercase">
                  Deskripsi
                  <input
                    name="description"
                    value={form.description}
                    onChange={onChange}
                    placeholder="Gaji bulanan"
                    className="mt-1 min-h-11 w-full rounded-xl lg:rounded-2xl border border-[#1c1c13] bg-[#fffbeb] px-3 text-sm"
                  />
                </label>

                <label className="block text-[11px] font-bold uppercase">
                  Tanggal
                  <input
                    name="date"
                    type="date"
                    value={form.date}
                    onChange={onChange}
                    className="mt-1 min-h-11 w-full rounded-xl lg:rounded-2xl border border-[#1c1c13] bg-[#fffbeb] px-3 text-sm"
                  />
                </label>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="min-h-11 rounded-xl lg:rounded-2xl border border-[#1c1c13] bg-[#6366f1] px-3 text-xs font-black uppercase text-white shadow-[2px_2px_0_#1c1c13] disabled:opacity-50"
                  >
                    {isSubmitting ? 'Menyimpan...' : editingId ? 'Update' : 'Simpan'}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="min-h-11 rounded-xl lg:rounded-2xl border border-[#1c1c13] bg-white px-3 text-xs font-black uppercase shadow-[1px_1px_0_#1c1c13] hover:bg-[#f8f4e4]"
                  >
                    Reset
                  </button>
                </div>
              </form>
            </section>
          ) : null}
        </div>
      </div>
    </PageLayout>
  )
}

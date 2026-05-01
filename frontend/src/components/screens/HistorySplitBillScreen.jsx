import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  createSplitBill,
  deleteSplitBill,
  getSplitBills,
  updateSplitBill,
  updateSplitBillMemberStatus,
} from '../../services/splitBill'
import { getAnalyticsOverview } from '../../services/analytics'
import { PageLayout } from '../layouts/PageLayout'
import { PageHeader } from '../headers/PageHeader'
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
}

function allocateMembers(totalAmount, friendNames) {
  const count = friendNames.length
  const baseAmount = Math.floor(totalAmount / count)
  let remainder = totalAmount % count

  return friendNames.map((friendName) => {
    const amount = baseAmount + (remainder > 0 ? 1 : 0)
    if (remainder > 0) remainder -= 1

    return {
      friendName,
      amount,
    }
  })
}

function toCurrency(value) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value || 0)
}

function buildFormFromBill(splitBill) {
  return {
    title: splitBill.title,
    description: splitBill.description || '',
    totalAmount: String(splitBill.totalAmount),
    friends: splitBill.members.map((member) => member.friendName).join('\n'),
  }
}

export function HistorySplitBillScreen({ mainLogo }) {
  const { t, language } = useI18n()
  const tr = (en, id) => (language === 'id-ID' ? id : en)
  const [activeTab, setActiveTab] = useState('history')
  const [form, setForm] = useState(defaultForm)
  const [splitBills, setSplitBills] = useState([])
  const [summary, setSummary] = useState({ total: 0, paid: 0, unpaid: 0 })
  const [analytics, setAnalytics] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const refreshSplitBills = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage('')

    try {
      const [splitBillData, analyticsData] = await Promise.all([getSplitBills(), getAnalyticsOverview()])

      setSplitBills(splitBillData.splitBills || [])
      setSummary(splitBillData.summary || { total: 0, paid: 0, unpaid: 0 })
      setAnalytics(analyticsData)
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
    const friendNames = parseFriends(form.friends)

    if (!form.title.trim() || !Number.isFinite(parsedTotal) || parsedTotal <= 0 || friendNames.length === 0) {
      setErrorMessage(tr('Complete title, total amount, and friends list.', 'Lengkapi judul, total tagihan, dan daftar teman.'))
      return
    }

    setIsSubmitting(true)
    setErrorMessage('')

    const members = allocateMembers(parsedTotal, friendNames)

    const payload = {
      title: form.title.trim(),
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

  const weeklyTrend = analytics?.weeklyTrend || []
  const maxTrendAmount = useMemo(() => {
    return weeklyTrend.reduce((max, point) => Math.max(max, point.amount), 1)
  }, [weeklyTrend])

  return (
    <PageLayout
      header={
        <PageHeader
          mainLogo={mainLogo}
          title={t('historySplitBill', 'History & Split Bill')}
          backLink="/home"
          className=''
        />
      }
      className="space-y-6 py-6 lg:space-y-0 lg:p-8 "
    >
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left Column: History (spans 2 columns on lg) */}
        <div className="lg:col-span-2 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-4">
          <article className="rounded-xl lg:rounded-2xl border border-[#1c1c13] bg-[#f8f4e4] p-4 lg:p-6 shadow-[2px_2px_0_#1c1c13]">
            <p className="text-[10px] lg:text-xs font-bold uppercase text-[#464554]">{t('totalSplit', 'Total Split')}</p>
            <p className="text-lg lg:text-3xl font-black text-[#6366f1] mt-2">{toRupiah(summary.total)}</p>
          </article>
          <article className="rounded-xl lg:rounded-2xl border border-[#1c1c13] bg-[#f8f4e4] p-4 lg:p-6 shadow-[2px_2px_0_#1c1c13]">
            <p className="text-[10px] lg:text-xs font-bold uppercase text-[#464554]">{t('unpaid', 'Unpaid')}</p>
            <p className="text-lg lg:text-3xl font-black text-[#ba1a1a] mt-2">{toRupiah(summary.unpaid)}</p>
          </article>
          <article className="hidden lg:block rounded-2xl border border-[#1c1c13] bg-[#fff9dc] p-6 shadow-[2px_2px_0_#1c1c13]">
            <p className="text-xs font-bold uppercase text-[#464554]">{t('paid', 'Paid')}</p>
            <p className="text-3xl font-black text-[#4648d4] mt-2">{toRupiah(summary.paid)}</p>
          </article>
        </div>

        {/* Finance Insights merged into History page */}
        <section className="rounded-xl lg:rounded-2xl border border-[#1c1c13] bg-white p-4 lg:p-6 shadow-[2px_2px_0_#1c1c13] space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm lg:text-base font-black uppercase">{t('financeInsights', 'Finance Insights')}</h2>
            <span className="rounded-full border border-[#1c1c13] bg-[#ffc329] px-3 py-1 text-[10px] font-black uppercase">
              {t('avgPerDay', 'Avg/day')} {toCurrency(analytics?.totals?.averageDaily || 0)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <article className="rounded-lg border border-[#1c1c13] bg-[#f8f4e4] p-3">
              <p className="text-[10px] font-bold uppercase text-[#464554]">{t('weeklySpend', 'Weekly Spend')}</p>
              <p className="mt-1 text-sm lg:text-base font-black text-[#1c1c13]">{toCurrency(analytics?.totals?.weeklyTotal || 0)}</p>
            </article>
            <article className="rounded-lg border border-[#1c1c13] bg-[#f8f4e4] p-3">
              <p className="text-[10px] font-bold uppercase text-[#464554]">{t('topCategoryLabel', 'Top Category')}</p>
              <p className="mt-1 text-sm lg:text-base font-black text-[#1c1c13]">{analytics?.topCategory?.name || t('noData', 'No Data')}</p>
            </article>
          </div>

          <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase text-[#464554]">{t('last6Days', 'Last 6 Days')}</p>
            <div className="grid grid-cols-6 gap-2 items-end h-24">
              {weeklyTrend.length > 0 ? (
                weeklyTrend.map((point) => (
                  <div key={point.day} className="flex flex-col items-center gap-1">
                    <div className="w-full rounded-sm border border-[#1c1c13] bg-[#e1e0ff]">
                      <div
                        className="w-full bg-[#6366f1]"
                        style={{ height: `${Math.max(8, Math.round((point.amount / maxTrendAmount) * 60))}px` }}
                      />
                    </div>
                    <span className="text-[9px] font-black uppercase text-[#464554]">{point.day}</span>
                  </div>
                ))
              ) : (
                <p className="col-span-6 text-xs font-semibold">{t('noWeeklyTrendData', 'Belum ada data tren mingguan.')}</p>
              )}
            </div>
          </div>
        </section>

        {/* Tab switcher */}
        <section className="rounded-xl lg:rounded-2xl border border-[#1c1c13] bg-[#fff9dc] p-1 lg:p-2">
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`min-h-11 flex-1 rounded-xl border text-xs font-black uppercase transition-all ${
                activeTab === 'history'
                  ? 'border-[#1c1c13] bg-[#6366f1] text-white shadow-[2px_2px_0_#1c1c13]'
                  : 'border-transparent bg-transparent text-[#1c1c13] hover:border-[#1c1c13]'
              }`}
            >
              {t('history', 'History')}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('split')}
              className={`min-h-11 flex-1 rounded-xl border text-xs font-black uppercase transition-all ${
                activeTab === 'split'
                  ? 'border-[#1c1c13] bg-[#fbbf24] text-[#1c1c13] shadow-[2px_2px_0_#1c1c13]'
                  : 'border-transparent bg-transparent text-[#1c1c13] hover:border-[#1c1c13]'
              }`}
            >
              {t('splitBill', 'Split Bill')}
            </button>
          </div>
        </section>

        {errorMessage ? (
          <p className="rounded-xl lg:rounded-2xl border border-[#1c1c13] bg-[#fee2e2] px-4 py-3 text-sm font-semibold text-[#7f1d1d]">{errorMessage}</p>
        ) : null}

        {activeTab === 'split' ? (
          <section className="rounded-xl lg:rounded-2xl border border-[#1c1c13] bg-white p-4 lg:p-6 shadow-[2px_2px_0_#1c1c13]">
            <h2 className="text-sm font-black uppercase">{editingId ? t('editSplitBill', 'Edit Split Bill') : t('newSplitBill', 'Buat Split Bill Baru')}</h2>
            <form className="mt-3 space-y-3" onSubmit={onSubmit}>
              <label className="block text-[11px] font-bold uppercase">
                Judul
                <input
                  name="title"
                  value={form.title}
                  onChange={onChange}
                  placeholder={tr('Example: Dinner with classmates', 'Contoh: Makan bareng kelas')}
                  className="mt-1 min-h-11 w-full rounded-xl lg:rounded-2xl border border-[#1c1c13] bg-[#fffbeb] px-3 text-sm"
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
                  placeholder={tr('150000', '150000')}
                  className="mt-1 min-h-11 w-full rounded-xl lg:rounded-2xl border border-[#1c1c13] bg-[#fffbeb] px-3 text-sm"
                />
              </label>

              <label className="block text-[11px] font-bold uppercase">
                Deskripsi (Opsional)
                <input
                  name="description"
                  value={form.description}
                  onChange={onChange}
                  placeholder={tr('Dinner after midterms', 'Makan malam habis UTS')}
                  className="mt-1 min-h-11 w-full rounded-xl lg:rounded-2xl border border-[#1c1c13] bg-[#fffbeb] px-3 text-sm"
                />
              </label>

              <label className="block text-[11px] font-bold uppercase">
                Daftar Teman (1 nama per baris)
                <textarea
                  name="friends"
                  value={form.friends}
                  onChange={onChange}
                  rows={4}
                  placeholder={tr('Alex\nSam\nRina', 'Bagas\nSiska\nDini')}
                  className="mt-1 w-full rounded-xl lg:rounded-2xl border border-[#1c1c13] bg-[#fffbeb] px-3 py-2 text-sm"
                />
              </label>

              <p className="text-[11px] font-semibold text-[#464554]">
                {tr('Amount will be split equally across friends.', 'Amount akan dibagi rata otomatis ke semua teman.')}
              </p>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="min-h-11 rounded-xl lg:rounded-2xl border border-[#1c1c13] bg-[#6366f1] px-3 text-xs font-black uppercase text-white shadow-[2px_2px_0_#1c1c13]"
                >
                    {isSubmitting ? t('saving', 'Menyimpan...') : editingId ? t('updateSplit', 'Update Split') : t('saveSplit', 'Simpan Split')}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="min-h-11 rounded-xl lg:rounded-2xl border border-[#1c1c13] bg-white px-3 text-xs font-black uppercase shadow-[1px_1px_0_#1c1c13]"
                >
                    {t('resetForm', 'Reset Form')}
                </button>
              </div>
            </form>
          </section>
        ) : null}

        {activeTab === 'history' ? (
          <section className="space-y-3 lg:col-span-2 lg:space-y-0">
            <div className="rounded-lg lg:rounded-xl border border-[#1c1c13] bg-white p-4 lg:p-6 shadow-[2px_2px_0_#1c1c13]">
            <h2 className="text-lg lg:text-xl font-black uppercase mb-4">{t('splitBillHistory', 'Split Bill History')}</h2>
            {isLoading ? <p className="text-sm font-semibold">{tr('Loading split bill data...', 'Memuat data split bill...')}</p> : null}
            {!isLoading && splitBills.length === 0 ? (
              <p className="rounded-lg lg:rounded-xl border border-[#1c1c13] bg-[#fffbeb] px-4 py-3 text-sm font-semibold">
                {tr('No split bills yet. Create one from Split Bill tab.', 'Belum ada split bill. Buat dari tab Split Bill.')}
              </p>
            ) : null}

            {splitBills.map((splitBill) => (
              <article key={splitBill.id} className="rounded-lg lg:rounded-xl border border-[#1c1c13] bg-[#fffbeb] p-4 lg:p-5 shadow-[2px_2px_0_#1c1c13] mb-3 lg:mb-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-black">{splitBill.title}</h3>
                    <p className="text-[10px] font-bold uppercase text-[#464554]">
                      {splitBill.description || tr('No description', 'Tanpa deskripsi')}
                    </p>
                    <p className="mt-1 text-xs font-semibold">Total: {toRupiah(splitBill.totalAmount)}</p>
                  </div>
                  <span
                    className={`rounded-full border border-[#1c1c13] px-2 py-1 text-[10px] font-black uppercase ${
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

                <ul className="mt-3 space-y-2 border-t border-[#1c1c13] pt-3">
                  {splitBill.members.map((member) => (
                    <li key={member.id} className="rounded-lg border border-[#1c1c13] bg-white p-2 lg:p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="text-xs font-black">{member.friendName}</p>
                          <p className="text-[11px] font-semibold">{toRupiah(member.amount)}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => onToggleMemberStatus(splitBill.id, member.id, member.status)}
                          className={`min-h-10 lg:min-h-11 rounded-lg border border-[#1c1c13] px-3 text-[10px] font-black uppercase shadow-[1px_1px_0_#1c1c13] ${
                            member.status === 'PAID' ? 'bg-[#bbf7d0]' : 'bg-[#fbbf24]'
                          }`}
                        >
                          {member.status === 'PAID' ? t('markUnpaid', 'Mark Unpaid') : t('markPaid', 'Mark Paid')}
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => onEdit(splitBill)}
                    className="min-h-10 lg:min-h-11 rounded-lg lg:rounded-xl border border-[#1c1c13] bg-[#6366f1] px-3 text-[10px] font-black uppercase text-white shadow-[1px_1px_0_#1c1c13]"
                  >
                    {t('edit', 'Edit')}
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(splitBill.id)}
                    className="min-h-10 lg:min-h-11 rounded-lg lg:rounded-xl border border-[#1c1c13] bg-white px-3 text-[10px] font-black uppercase shadow-[1px_1px_0_#1c1c13]"
                  >
                    {t('delete', 'Delete')}
                  </button>
                </div>
              </article>
            ))}
            </div>
          </section>
        ) : null}
        </div>

        {/* Right Column: Split Bill Management */}
        <div className="space-y-6 lg:col-span-1">
          {/* Header Card */}
          <section className="rounded-lg lg:rounded-2xl border border-[#1c1c13] bg-[#6366f1] text-white p-4 lg:p-6 shadow-[2px_2px_0_#1c1c13]">
            <h2 className="text-lg lg:text-xl font-black flex items-center gap-2 uppercase">
              <span className="material-symbols-outlined">group</span>
              {t('splitBills', 'Split Bills')}
            </h2>
            <p className="text-xs lg:text-sm opacity-90 mt-2 font-medium">{t('manageSharedExpenses', 'Manage shared expenses')}</p>
          </section>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setActiveTab('split')}
              className="min-h-11 lg:min-h-12 rounded-lg lg:rounded-xl border border-[#1c1c13] bg-white text-[#1c1c13] px-3 text-xs font-black uppercase shadow-[2px_2px_0_#1c1c13] active:shadow-none active:translate-y-0.5 transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              {t('newSplit', 'New Split')}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className="min-h-11 lg:min-h-12 rounded-lg lg:rounded-xl border border-[#1c1c13] bg-white text-[#1c1c13] px-3 text-xs font-black uppercase shadow-[2px_2px_0_#1c1c13] active:shadow-none active:translate-y-0.5 transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">history</span>
              {t('history', 'History')}
            </button>
          </div>

          {/* Friend Cards Section */}
          <div className="space-y-3">
            {splitBills.length === 0 ? (
              <div className="rounded-lg lg:rounded-xl border border-[#1c1c13] bg-[#f8f4e4] p-4 lg:p-6 shadow-[2px_2px_0_#1c1c13] text-center">
                <p className="text-xs lg:text-sm font-bold text-[#464554]">{t('noActiveSplitBills', 'No active split bills yet')}</p>
                <p className="text-[11px] text-[#464554] mt-1">{t('createFirstSplit', 'Create your first split to get started')}</p>
              </div>
            ) : (
              splitBills.slice(0, 3).map((splitBill) =>
                splitBill.members.slice(0, 3).map((member, idx) => {
                  const isSettled = member.status === 'PAID'
                  const amountDisplay = toRupiah(member.amount)
                  const statusLabel = isSettled ? t('settled', 'Settled') : t('pending', 'Pending')
                  const amountColor = isSettled ? 'text-[#464554]' : 'text-[#ba1a1a]'
                  const statusColor = isSettled ? 'text-[#464554]' : 'text-[#ba1a1a]'
                  const bgColor = member.status === 'PAID' ? 'bg-[#f8f4e4] opacity-70' : 'bg-white'
                  const actionButton = isSettled ? '' : t('settle', 'Settle')

                  return (
                    <div
                      key={`${splitBill.id}-${member.id}-${idx}`}
                      className={`border border-[#1c1c13] rounded-lg lg:rounded-xl p-4 lg:p-5 shadow-[2px_2px_0_#1c1c13] hover:-translate-y-1 transition-transform ${bgColor}`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full border border-[#1c1c13] bg-[#6366f1] text-white flex items-center justify-center font-black text-sm">
                            {member.friendName.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm lg:text-base font-black text-[#1c1c13] truncate">{member.friendName}</h4>
                            <p className={`text-xs ${statusColor} font-bold uppercase`}>{statusLabel}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`font-black text-base lg:text-lg ${amountColor}`}>{amountDisplay}</div>
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="border-t border-[#1c1c13] pt-3 flex justify-between items-center">
                        <span className="text-[10px] lg:text-xs font-medium text-[#464554]">{splitBill.title}</span>
                        {actionButton && (
                          <button
                            type="button"
                            onClick={() => onToggleMemberStatus(splitBill.id, member.id, member.status)}
                            className={`text-xs font-black px-2 lg:px-3 py-1 rounded border border-[#1c1c13] shadow-[1px_1px_0_#1c1c13] transition-all ${
                              'bg-[#fbbf24] text-[#1c1c13] hover:-translate-y-0.5'
                            }`}
                          >
                            {actionButton}
                          </button>
                        )}
                        {member.status === 'PAID' && (
                          <span className="material-symbols-outlined text-sm text-[#6366f1]">check_circle</span>
                        )}
                      </div>
                    </div>
                  )
                })
              )
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  )
}

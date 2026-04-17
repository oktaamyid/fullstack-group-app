import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getAnalyticsOverview } from '../../services/analytics'
import { BottomNavigation } from '../navigation/BottomNavigation'

function toCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format((value || 0) / 100)
}

const CATEGORIES = [
  'All',
  'Food & Drinks',
  'Transport',
  'Academic',
  'Living',
  'Entertainment',
  'Shopping',
  'Other',
]

export function AnalyticsTrendsScreen({ mascotImage }) {
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [analytics, setAnalytics] = useState(null)
  const [selectedCategory, setSelectedCategory] = useState('All')

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setLoading(true)
      setErrorMessage('')

      try {
        const data = await getAnalyticsOverview()
        if (!cancelled) {
          setAnalytics(data)
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(error.message)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [])

  const chartPoints = useMemo(() => {
    const trend = analytics?.weeklyTrend || []
    if (trend.length === 0) return ''

    const max = Math.max(...trend.map((point) => point.amount), 1)

    return trend
      .map((point, index) => {
        const x = (index / Math.max(trend.length - 1, 1)) * 100
        const y = 90 - Math.round((point.amount / max) * 80)
        return `${x},${y}`
      })
      .join(' ')
  }, [analytics])

  const trend = analytics?.weeklyTrend || []

  const filteredReports = useMemo(() => {
    if (!analytics) return []
    if (selectedCategory === 'All') return analytics.recentReports
    return analytics.recentReports.filter((report) => report.category === selectedCategory)
  }, [analytics, selectedCategory])

  return (
    <div className="min-h-svh bg-[#fdf9e9] pb-24 text-[#1c1c13]">
      <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-[#1c1c13] bg-[#fdf9e9] px-4 shadow-[2px_2px_0_#1c1c13]">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 overflow-hidden rounded-full border border-[#1c1c13] bg-[#ffc329]">
            <img src={mascotImage} alt="LIVO Mascot" className="h-full w-full object-cover" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">LIVO</h1>
        </div>

        <Link
          to="/home"
          className="min-h-11 rounded-xl border border-[#1c1c13] bg-white px-3 py-2 text-xs font-black uppercase shadow-[2px_2px_0_#1c1c13]"
        >
          Back Home
        </Link>
      </header>

      <main className="mx-auto max-w-xl space-y-5 px-4 pt-5">
        <section>
          <h2 className="text-[1.75rem] leading-tight font-bold tracking-tight">Analytics & Trends</h2>
          <p className="text-sm text-[#464554]">Your spending performance for the academic semester.</p>
        </section>

        {loading ? (
          <section className="rounded-xl border border-[#1c1c13] bg-white p-4 font-semibold">Loading analytics...</section>
        ) : null}

        {errorMessage ? (
          <section className="rounded-xl border border-[#1c1c13] bg-[#fee2e2] p-4 text-sm font-semibold text-[#7f1d1d]">
            {errorMessage}
          </section>
        ) : null}

        {!loading && !errorMessage && analytics ? (
          <>
            <section className="overflow-hidden rounded-xl border border-[#1c1c13] bg-[#f8f4e4] shadow-[4px_4px_0_#1c1c13]">
              <div className="flex items-end justify-between border-b border-[#1c1c13] p-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#464554]">Total Spent</p>
                  <p className="text-3xl font-extrabold text-[#4648d4]">{toCurrency(analytics.totals.totalSpent)}</p>
                </div>
                <div className="rounded-full border border-[#1c1c13] bg-[#ffc329] px-3 py-1 text-xs font-bold shadow-[2px_2px_0_#1c1c13]">
                  Avg/day {toCurrency(analytics.totals.averageDaily)}
                </div>
              </div>

              <div className="relative h-52 border-b border-[#1c1c13] bg-white p-4">
                <svg viewBox="0 0 100 100" className="h-full w-full overflow-visible">
                  <polyline fill="none" points={chartPoints} stroke="#4648d4" strokeWidth="2.4" />
                  {trend.map((point, index) => {
                    const max = Math.max(...trend.map((item) => item.amount), 1)
                    const x = (index / Math.max(trend.length - 1, 1)) * 100
                    const y = 90 - Math.round((point.amount / max) * 80)
                    return <circle key={`${point.day}-${index}`} cx={x} cy={y} r="2.8" fill="#ffc329" stroke="#1c1c13" strokeWidth="1" />
                  })}
                </svg>
              </div>

              <div className="flex justify-between px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-[#464554]">
                {trend.map((point) => (
                  <span key={point.day}>{point.day}</span>
                ))}
              </div>
            </section>

            <section className="grid grid-cols-2 gap-3">
              <article className="col-span-2 flex items-center gap-3 rounded-xl border border-[#1c1c13] bg-[#ece8d9] p-4 shadow-[2px_2px_0_#1c1c13]">
                <div className="rounded-lg border border-[#1c1c13] bg-[#4648d4] p-3 text-white shadow-[2px_2px_0_#1c1c13]">
                  <span className="material-symbols-outlined">restaurant</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold">Top category: {analytics.topCategory.name}</h3>
                  <p className="text-xs text-[#464554]">{analytics.topCategory.percent}% of your total budget</p>
                </div>
              </article>

              <article className="space-y-3 rounded-xl border border-[#1c1c13] bg-[#e1e0ff] p-4 shadow-[2px_2px_0_#1c1c13]">
                <span className="material-symbols-outlined text-[#4648d4]">savings</span>
                <div>
                  <p className="text-xl font-extrabold">{toCurrency(analytics.savingsGoal.target)}</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#4648d4]">Savings Goal</p>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full border border-[#1c1c13] bg-white">
                  <div className="h-full border-r border-[#1c1c13] bg-[#bbf7d0]" style={{ width: `${analytics.savingsGoal.progress}%` }} />
                </div>
              </article>

              <article className="space-y-3 rounded-xl border border-[#1c1c13] bg-[#ffc329] p-4 shadow-[2px_2px_0_#1c1c13]">
                <span className="material-symbols-outlined">trending_up</span>
                <div>
                  <p className="text-xl font-extrabold">{toCurrency(analytics.totals.weeklyTotal)}</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest">Weekly Spend</p>
                </div>
                <p className="text-[10px] leading-tight font-semibold">Track your split bill trends and keep your budget under control.</p>
              </article>
            </section>

            <section className="space-y-3 pb-5">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold">Recent Reports</h3>
              </div>

              <div className="flex flex-wrap gap-2 pb-3">
                {CATEGORIES.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`rounded-full border border-[#1c1c13] px-3 py-1 text-xs font-bold uppercase transition-colors ${
                      selectedCategory === category
                        ? 'bg-[#4648d4] text-white shadow-[2px_2px_0_#1c1c13]'
                        : 'bg-white text-[#1c1c13] hover:bg-[#fffbeb]'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>

              {filteredReports.length === 0 ? (
                <article className="rounded-lg border border-[#1c1c13] bg-white p-3 text-sm font-semibold">
                  {selectedCategory === 'All' ? 'No reports yet. Add split bills to see analytics.' : `No reports in ${selectedCategory} category.`}
                </article>
              ) : (
                filteredReports.map((report) => (
                  <article
                    key={report.id}
                    className="flex items-center justify-between rounded-lg border border-[#1c1c13] bg-[#f8f4e4] p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded border border-[#1c1c13] bg-white">
                        <span className="material-symbols-outlined text-[#4648d4]">receipt_long</span>
                      </div>
                      <div>
                        <p className="text-sm font-bold">{report.title}</p>
                        <p className="text-[10px] font-bold uppercase text-[#464554]">{new Date(report.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-[#ba1a1a]">-{toCurrency(report.amount)}</p>
                      <p className="text-[10px] font-bold uppercase text-[#464554]">{report.status}</p>
                    </div>
                  </article>
                ))
              )}
            </section>
          </>
        ) : null}
      </main>

      <BottomNavigation />
    </div>
  )
}

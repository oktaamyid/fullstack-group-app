import { useEffect, useMemo, useState, useCallback } from "react";
import { getAnalyticsOverview } from "../../services/analytics";
import { getTransactions } from "../../services/transaction";
import { PageLayout } from "../layouts/PageLayout";
import { PageHeader } from "../headers/PageHeader";
import { useI18n } from "../../i18n/useI18n";
import { useProfileSettings } from "../../hooks/useProfileSettings";
import { formatCurrency } from "../../services/currency";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export function TransactionScreen({ mainLogo }) {
  const { language } = useI18n();
  const settings = useProfileSettings();
  const tr = useCallback((en, id) => (language === "id-ID" ? id : en), [language]);
  
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [, setAnalytics] = useState(null);
  const [transactions, setTransactions] = useState([]);
  
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setErrorMessage("");

      try {
        const [analyticsData, txData] = await Promise.all([
          getAnalyticsOverview(),
          getTransactions()
        ]);
        if (!cancelled) {
          setAnalytics(analyticsData);
          setTransactions(txData.transactions || []);
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(error.message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const monthTransactions = useMemo(() => {
    return transactions.filter(tx => {
      const date = new Date(tx.createdAt);
      return date.getMonth() === selectedDate.getMonth() && date.getFullYear() === selectedDate.getFullYear();
    });
  }, [transactions, selectedDate]);

  const monthSummary = useMemo(() => {
    const income = monthTransactions.filter(t => t.type === "INCOME").reduce((sum, t) => sum + t.amount, 0);
    const expense = monthTransactions.filter(t => t.type === "EXPENSE" || t.type === "SHARED_EXPENSE").reduce((sum, t) => sum + t.amount, 0);
    return {
      income,
      expense,
      net: income - expense
    };
  }, [monthTransactions]);

  const categoryTotals = useMemo(() => {
    const totals = {};
    monthTransactions.filter(t => t.type === "EXPENSE" || t.type === "SHARED_EXPENSE").forEach(tx => {
      const cat = tx.category || "Other";
      totals[cat] = (totals[cat] || 0) + tx.amount;
    });
    return totals;
  }, [monthTransactions]);

  const trend = useMemo(() => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const dailyTotals = Array.from({ length: daysInMonth }, (_, i) => ({
      day: i + 1,
      amount: 0
    }));

    monthTransactions.forEach(tx => {
      if (tx.type === "EXPENSE" || tx.type === "SHARED_EXPENSE") {
        const txDate = new Date(tx.createdAt);
        const dayIndex = txDate.getDate() - 1;
        if (dailyTotals[dayIndex]) {
          dailyTotals[dayIndex].amount += tx.amount;
        }
      }
    });
    return dailyTotals;
  }, [monthTransactions, selectedDate]);

  const chartPoints = useMemo(() => {
    if (trend.length === 0) return "";
    const max = Math.max(...trend.map((point) => point.amount), 1);
    return trend
      .map((point, index) => {
        const x = (index / Math.max(trend.length - 1, 1)) * 100;
        const y = 90 - Math.round((point.amount / max) * 80);
        return `${x},${y}`;
      })
      .join(" ");
  }, [trend]);

  return (
    <PageLayout
      header={
        <PageHeader
          mainLogo={mainLogo}
          title={tr("Insights & Reports", "Wawasan & Laporan")}
          backLink="/home"
        />
      }
      className="space-y-5 pt-5 lg:space-y-6"
    >
      <div className="flex flex-col sm:flex-row justify-between items-center max-w-4xl mx-auto gap-4">
        <h1 className="text-xl font-black text-gray-900 uppercase tracking-tight">{tr("Monthly Report", "Laporan Bulanan")}</h1>
        <div className="flex items-center gap-2 rounded-full border-2 border-[#1c1c13] bg-[#fffbeb] p-1 shadow-[2px_2px_0_#1c1c13]">
          <button 
            onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1))}
            className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-[#ffc329] text-[#1c1c13] transition-colors"
          >
            <span className="material-symbols-outlined text-sm font-black">chevron_left</span>
          </button>
          <span className="text-[10px] font-black tracking-widest text-[#1c1c13] uppercase px-2 min-w-25 text-center">
            {MONTHS[selectedDate.getMonth()]} {selectedDate.getFullYear()}
          </span>
          <button 
            onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1))}
            className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-[#ffc329] text-[#1c1c13] transition-colors"
          >
            <span className="material-symbols-outlined text-sm font-black">chevron_right</span>
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        {loading ? (
          <section className="rounded-xl border-2 border-[#1c1c13] bg-white p-4 font-semibold shadow-[4px_4px_0_#1c1c13]">
            {tr("Loading insights...", "Memuat laporan...")}
          </section>
        ) : null}

        {errorMessage ? (
          <section className="rounded-xl border-2 border-[#1c1c13] bg-[#fee2e2] p-4 text-sm font-semibold text-[#7f1d1d] shadow-[4px_4px_0_#1c1c13]">
            {errorMessage}
          </section>
        ) : null}

        {!loading && !errorMessage ? (
          <>
            {/* Cashflow Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-2xl border-2 border-[#1c1c13] bg-[#ecfdf5] p-5 shadow-[4px_4px_0_#1c1c13]">
                <p className="text-[10px] font-bold uppercase tracking-wide text-green-700">
                  {tr("Total Income", "Total Pemasukan")}
                </p>
                <p className="mt-1 text-2xl font-black text-green-800">
                  {formatCurrency(monthSummary.income, language, settings.currency)}
                </p>
              </div>
              <div className="rounded-2xl border-2 border-[#1c1c13] bg-[#fef2f2] p-5 shadow-[4px_4px_0_#1c1c13]">
                <p className="text-[10px] font-bold uppercase tracking-wide text-red-600">
                  {tr("Total Expense", "Total Pengeluaran")}
                </p>
                <p className="mt-1 text-2xl font-black text-red-700">
                  {formatCurrency(monthSummary.expense, language, settings.currency)}
                </p>
              </div>
              <div className="rounded-2xl border-2 border-[#1c1c13] bg-white p-5 shadow-[4px_4px_0_#1c1c13]">
                <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">
                  {tr("Net Balance", "Saldo Bersih")}
                </p>
                <p className={`mt-1 text-2xl font-black ${monthSummary.net >= 0 ? "text-green-700" : "text-red-600"}`}>
                  {formatCurrency(monthSummary.net, language, settings.currency)}
                </p>
              </div>
            </div>

            {/* Cashflow Graph */}
            <section className="overflow-hidden rounded-2xl border-2 border-[#1c1c13] bg-[#f8f4e4] shadow-[4px_4px_0_#1c1c13]">
              <div className="flex items-end justify-between border-b-2 border-[#1c1c13] p-5">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#464554]">
                    {tr("Expense Trend", "Tren Pengeluaran")}
                  </p>
                  <p className="text-2xl font-extrabold text-[#4648d4]">
                    {tr("Daily Activity", "Aktivitas Harian")}
                  </p>
                </div>
                <div className="rounded-full border-2 border-[#1c1c13] bg-[#ffc329] px-3 py-1 text-xs font-bold shadow-[2px_2px_0_#1c1c13]">
                  {tr("Daily Data", "Data Harian")}
                </div>
              </div>
              <div className="relative h-52 border-b-2 border-[#1c1c13] bg-white p-4">
                <svg viewBox="0 0 100 100" className="h-full w-full overflow-visible preserve-aspect-ratio-none">
                  <polyline fill="none" points={chartPoints} stroke="#4648d4" strokeWidth="2.4" strokeLinejoin="round" />
                  {trend.map((point, index) => {
                    const max = Math.max(...trend.map((item) => item.amount), 1);
                    const x = (index / Math.max(trend.length - 1, 1)) * 100;
                    const y = 90 - Math.round((point.amount / max) * 80);
                    // Only show dots if there's actually an amount to reduce clutter
                    if (point.amount === 0) return null;
                    return (
                      <circle key={`${point.day}-${index}`} cx={x} cy={y} r="1.5" fill="#ffc329" stroke="#1c1c13" strokeWidth="1" />
                    );
                  })}
                </svg>
              </div>
              <div className="flex justify-between px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-[#464554]">
                <span>1</span>
                <span>7</span>
                <span>14</span>
                <span>21</span>
                <span>28</span>
                <span>{new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0).getDate()}</span>
              </div>
            </section>

            {/* Category Breakdown */}
            <section className="space-y-4 pb-5">
              <h3 className="text-lg font-black uppercase tracking-tight">
                {tr("Expense per Category", "Pengeluaran per Kategori")}
              </h3>
              {Object.keys(categoryTotals).length > 0 ? (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {Object.entries(categoryTotals)
                    .sort((a, b) => b[1] - a[1])
                    .map(([category, amount]) => {
                      const percentage = monthSummary.expense > 0 ? Math.round((amount / monthSummary.expense) * 100) : 0;
                      return (
                        <article key={category} className="flex flex-col justify-between rounded-xl border-2 border-[#1c1c13] bg-white p-4 shadow-[4px_4px_0_#1c1c13]">
                          <div className="flex justify-between items-start mb-2">
                            <p className="text-sm font-black text-gray-900">{category}</p>
                            <span className="rounded bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-600">
                              {percentage}%
                            </span>
                          </div>
                          <p className="text-lg font-black text-[#4648d4]">
                            {formatCurrency(amount, language, settings.currency)}
                          </p>
                        </article>
                      );
                    })}
                </div>
              ) : (
                <article className="rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center text-sm font-bold text-gray-500">
                  {tr("No expenses for this month.", "Belum ada pengeluaran di bulan ini.")}
                </article>
              )}
            </section>
          </>
        ) : null}
      </div>
    </PageLayout>
  );
}

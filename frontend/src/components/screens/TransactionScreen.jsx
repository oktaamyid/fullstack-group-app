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
  const [categoryTab, setCategoryTab] = useState("EXPENSE"); // EXPENSE | INCOME

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

  const lastMonthTransactions = useMemo(() => {
    return transactions.filter(tx => {
      const date = new Date(tx.createdAt);
      const lastMonthDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1);
      return date.getMonth() === lastMonthDate.getMonth() && date.getFullYear() === lastMonthDate.getFullYear();
    });
  }, [transactions, selectedDate]);

  const lastMonthSummary = useMemo(() => {
    const income = lastMonthTransactions.filter(t => t.type === "INCOME").reduce((sum, t) => sum + t.amount, 0);
    const expense = lastMonthTransactions.filter(t => t.type === "EXPENSE" || t.type === "SHARED_EXPENSE").reduce((sum, t) => sum + t.amount, 0);
    return { income, expense, net: income - expense };
  }, [lastMonthTransactions]);

  const calculateChange = useCallback((current, previous) => {
    if (previous === 0) return current > 0 ? "+100%" : "0%";
    const diff = current - previous;
    const percentage = (diff / previous) * 100;
    return `${percentage > 0 ? '+' : ''}${percentage.toFixed(1)}%`;
  }, []);

  const categoryTotals = useMemo(() => {
    const totals = {};
    monthTransactions.forEach(tx => {
      if (categoryTab === "EXPENSE" && (tx.type === "EXPENSE" || tx.type === "SHARED_EXPENSE")) {
        const cat = tx.category || "Other";
        totals[cat] = (totals[cat] || 0) + tx.amount;
      } else if (categoryTab === "INCOME" && tx.type === "INCOME") {
        const cat = tx.category || "Other";
        totals[cat] = (totals[cat] || 0) + tx.amount;
      }
    });
    return totals;
  }, [monthTransactions, categoryTab]);

  const COLORS = useMemo(() => ["#4648d4", "#ffc329", "#10b981", "#ef4444", "#8b5cf6", "#f97316", "#06b6d4"], []);
  
  const pieChartData = useMemo(() => {
    const totalAmount = categoryTab === "EXPENSE" ? monthSummary.expense : monthSummary.income;
    if (totalAmount === 0) return null;
    
    let currentAngle = 0;
    const segments = Object.entries(categoryTotals)
      .sort((a, b) => b[1] - a[1])
      .map(([cat, amt], index) => {
        const percentage = amt / totalAmount;
        const angle = percentage * 360;
        const color = COLORS[index % COLORS.length];
        const str = `${color} ${currentAngle}deg ${currentAngle + angle}deg`;
        currentAngle += angle;
        return { cat, amt, percentage, color, str };
      });
      
    const gradient = segments.map(s => s.str).join(', ');
    return { segments, gradient, totalAmount };
  }, [categoryTotals, categoryTab, monthSummary, COLORS]);

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
                <div className="flex justify-between items-start mb-1">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-green-700">
                    {tr("Total Income", "Total Pemasukan")}
                  </p>
                  <span className={`text-[10px] font-bold ${monthSummary.income >= lastMonthSummary.income ? 'text-green-600' : 'text-red-500'}`}>
                    {calculateChange(monthSummary.income, lastMonthSummary.income)} vs {tr("Last Month", "Bulan Lalu")}
                  </span>
                </div>
                <p className="text-2xl font-black text-green-800">
                  {formatCurrency(monthSummary.income, language, settings.currency)}
                </p>
              </div>
              <div className="rounded-2xl border-2 border-[#1c1c13] bg-[#fef2f2] p-5 shadow-[4px_4px_0_#1c1c13]">
                <div className="flex justify-between items-start mb-1">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-red-600">
                    {tr("Total Expense", "Total Pengeluaran")}
                  </p>
                  <span className={`text-[10px] font-bold ${monthSummary.expense <= lastMonthSummary.expense ? 'text-green-600' : 'text-red-500'}`}>
                    {calculateChange(monthSummary.expense, lastMonthSummary.expense)} vs {tr("Last Month", "Bulan Lalu")}
                  </span>
                </div>
                <p className="text-2xl font-black text-red-700">
                  {formatCurrency(monthSummary.expense, language, settings.currency)}
                </p>
              </div>
              <div className="rounded-2xl border-2 border-[#1c1c13] bg-white p-5 shadow-[4px_4px_0_#1c1c13]">
                <div className="flex justify-between items-start mb-1">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">
                    {tr("Net Balance", "Saldo Bersih")}
                  </p>
                  <span className={`text-[10px] font-bold ${monthSummary.net >= lastMonthSummary.net ? 'text-green-600' : 'text-red-500'}`}>
                    {calculateChange(monthSummary.net, lastMonthSummary.net)} vs {tr("Last Month", "Bulan Lalu")}
                  </span>
                </div>
                <p className={`text-2xl font-black ${monthSummary.net >= 0 ? "text-green-700" : "text-red-600"}`}>
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

            {/* Category Pie Chart & Breakdown */}
            <section className="space-y-4 pb-5">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <h3 className="text-lg font-black uppercase tracking-tight">
                  {tr("Category Details", "Rincian Kategori")}
                </h3>
                <div className="flex gap-2 bg-[#fffbeb] p-1 rounded-lg border-2 border-[#1c1c13] shadow-[2px_2px_0_#1c1c13]">
                  <button 
                    onClick={() => setCategoryTab("EXPENSE")}
                    className={`px-4 py-1.5 text-xs font-black uppercase rounded ${categoryTab === "EXPENSE" ? "bg-[#ef4444] text-white shadow-sm" : "text-[#1c1c13] hover:bg-[#ffc329]"} transition-colors`}
                  >
                    {tr("Expense", "Pengeluaran")}
                  </button>
                  <button 
                    onClick={() => setCategoryTab("INCOME")}
                    className={`px-4 py-1.5 text-xs font-black uppercase rounded ${categoryTab === "INCOME" ? "bg-[#10b981] text-white shadow-sm" : "text-[#1c1c13] hover:bg-[#ffc329]"} transition-colors`}
                  >
                    {tr("Income", "Pemasukan")}
                  </button>
                </div>
              </div>

              {pieChartData ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center bg-white border-2 border-[#1c1c13] rounded-2xl p-6 shadow-[4px_4px_0_#1c1c13]">
                  {/* Pie Chart Donut */}
                  <div className="flex justify-center">
                    <div 
                      className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-full border-4 border-[#1c1c13] shadow-[4px_4px_0_#1c1c13]"
                      style={{ background: `conic-gradient(${pieChartData.gradient})` }}
                    >
                      {/* Inner white circle for donut effect */}
                      <div className="absolute inset-0 m-auto w-32 h-32 sm:w-36 sm:h-36 bg-white rounded-full border-4 border-[#1c1c13] flex flex-col items-center justify-center">
                         <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{tr("Total", "Total")}</span>
                         <span className="text-sm sm:text-base font-black text-[#1c1c13] truncate max-w-[100px] sm:max-w-[120px]" title={formatCurrency(pieChartData.totalAmount, language, settings.currency)}>
                           {formatCurrency(pieChartData.totalAmount, language, settings.currency)}
                         </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Legend & List */}
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                    {pieChartData.segments.map((seg) => (
                      <div key={seg.cat} className="flex items-center justify-between p-2 rounded-lg hover:bg-[#f8f4e4] border-2 border-transparent hover:border-[#1c1c13] transition-all">
                        <div className="flex items-center gap-3">
                          <div className="w-4 h-4 rounded-full border-2 border-[#1c1c13]" style={{ backgroundColor: seg.color }}></div>
                          <span className="font-bold text-sm text-gray-800">{seg.cat}</span>
                        </div>
                        <div className="text-right">
                          <p className="font-black text-sm text-[#1c1c13]">{formatCurrency(seg.amt, language, settings.currency)}</p>
                          <p className="text-[10px] font-bold text-gray-500">{Math.round(seg.percentage * 100)}%</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <article className="rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center text-sm font-bold text-gray-500">
                  {tr("No data for this category in the selected month.", "Belum ada data untuk kategori ini di bulan terpilih.")}
                </article>
              )}
            </section>
          </>
        ) : null}
      </div>
    </PageLayout>
  );
}

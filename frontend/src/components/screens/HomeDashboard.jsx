import { useCallback, useMemo, useState } from "react";
import { PageLayout } from "../layouts/PageLayout";
import { AppHeader } from "../headers/AppHeader";
import { CreateTransactionModal } from "../modals/CreateTransactionModal";
import { Button } from "../ui/Button";
import { Alert } from "../ui/Alert";
import { useI18n } from "../../i18n/useI18n";
import { useProfileSettings } from "../../hooks/useProfileSettings";
import { formatCurrency } from "../../services/currency";

function formatDate(value, language) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString(language || "id-ID", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
}

function normalizeText(value = "") {
  return value.toString().toLowerCase();
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export function HomeDashboard({
  financeData,
  onRecheck,
  onOpenProfile,
  onTransactionCreated,
  userName,
  mainLogo,
}) {
  const { language } = useI18n();
  const tr = useCallback((en, id) => (language === "id-ID" ? id : en), [language]);
  const settings = useProfileSettings();
  
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [csvError, setCsvError] = useState("");
  
  // New States for Filtering
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [filterType, setFilterType] = useState("ALL"); // ALL | INCOME | EXPENSE
  const [showNominal, setShowNominal] = useState(true);
  
  const allTransactions = useMemo(
    () => financeData?.recentTransactions || [],
    [financeData?.recentTransactions],
  );

  const transactionsInSelectedMonth = useMemo(() => {
    return allTransactions.filter(tx => {
      const date = new Date(tx.createdAt);
      return date.getMonth() === selectedDate.getMonth() && date.getFullYear() === selectedDate.getFullYear();
    });
  }, [allTransactions, selectedDate]);

  const monthlyExpense = useMemo(() => {
    return transactionsInSelectedMonth.reduce((acc, tx) => {
      if (tx.type === "EXPENSE" || tx.type === "SHARED_EXPENSE") return acc + Number(tx.amount);
      return acc;
    }, 0);
  }, [transactionsInSelectedMonth]);

  const isCurrentMonth = selectedDate.getMonth() === new Date().getMonth() && selectedDate.getFullYear() === new Date().getFullYear();

  const weeklyExpense = useMemo(() => {
    if (!isCurrentMonth) return 0;
    
    const now = new Date();
    const startOfWeek = new Date(now);
    const day = startOfWeek.getDay() || 7; 
    if (day !== 1) startOfWeek.setHours(-24 * (day - 1));
    startOfWeek.setHours(0, 0, 0, 0);

    return transactionsInSelectedMonth.reduce((acc, tx) => {
      const date = new Date(tx.createdAt);
      if (date >= startOfWeek && (tx.type === "EXPENSE" || tx.type === "SHARED_EXPENSE")) {
        return acc + Number(tx.amount);
      }
      return acc;
    }, 0);
  }, [transactionsInSelectedMonth, isCurrentMonth]);

  const filteredTransactions = useMemo(() => {
    let result = transactionsInSelectedMonth;

    if (filterType !== "ALL") {
      if (filterType === "INCOME") {
        result = result.filter(tx => tx.type === "INCOME");
      } else if (filterType === "EXPENSE") {
        result = result.filter(tx => tx.type === "EXPENSE" || tx.type === "SHARED_EXPENSE");
      } else {
        result = result.filter(tx => tx.category === filterType);
      }
    }

    const query = normalizeText(searchQuery).trim();
    if (query) {
      result = result.filter((entry) => {
        const haystack = [entry.note, entry.description, entry.category, entry.type, entry.amount]
          .filter(Boolean)
          .map((item) => normalizeText(item))
          .join(" ");
        return haystack.includes(query);
      });
    }

    return result;
  }, [transactionsInSelectedMonth, filterType, searchQuery]);

  const handleAddTransactionClick = useCallback(() => setShowTransactionModal(true), []);
  const handleSearchChange = useCallback((event) => setSearchQuery(event.target.value), []);
  const handleModalSuccess = useCallback(async () => {
    await onTransactionCreated?.();
  }, [onTransactionCreated]);

  const handleExportCSV = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/export/transactions/csv`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error("Failed to export data");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transactions_${new Date().toISOString().slice(0,10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setCsvError("");
    } catch (error) {
      console.error(error);
      setCsvError(tr("Failed to export CSV", "Gagal mengekspor CSV"));
    }
  }, [tr]);

  const header = (
    <AppHeader
      mainLogo={mainLogo}
      onSettingsClick={onOpenProfile}
      onRefreshClick={onRecheck}
      onAddTransactionClick={handleAddTransactionClick}
      onSearchChange={handleSearchChange}
      userName={userName}
    />
  );

  return (
    <>
      <PageLayout header={header} className="space-y-6">
        {csvError && <Alert type="error" onClose={() => setCsvError("")}>{csvError}</Alert>}
        
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Header Sapaan */}
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-black tracking-tight text-gray-900 sm:text-3xl">
              {tr("Good to see you", "Senang melihatmu")}{userName ? `, ${userName}` : ""}
            </h1>
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

          {/* Arus Kas / Expense Card */}
          <div className="rounded-2xl border-2 border-[#1c1c13] bg-white p-6 shadow-[4px_4px_0_#1c1c13] relative overflow-hidden">
            <div className="absolute top-4 right-4">
              <button 
                onClick={() => setShowNominal(!showNominal)}
                className="flex h-8 w-8 items-center justify-center rounded-xl border-2 border-[#1c1c13] bg-[#fffbeb] text-[#1c1c13] shadow-[2px_2px_0_#1c1c13] hover:-translate-y-0.5 active:translate-y-0 transition-all"
              >
                <span className="material-symbols-outlined text-sm font-black">
                  {showNominal ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
            
            {isCurrentMonth ? (
              <div className="flex flex-col gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-red-600 mb-1">
                    {tr("Weekly Expense", "Pengeluaran Mingguan")}
                  </p>
                  <p className="text-3xl sm:text-5xl font-black text-gray-900 truncate">
                    {showNominal ? formatCurrency(weeklyExpense, language, settings.currency) : "****"}
                  </p>
                </div>
                <div className="pt-4 border-t-2 border-dashed border-gray-200">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500 mb-1">
                    {tr("Monthly Total", "Total Bulanan")}
                  </p>
                  <p className="text-xl sm:text-2xl font-black text-gray-700 truncate">
                    {showNominal ? formatCurrency(monthlyExpense, language, settings.currency) : "****"}
                  </p>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-red-600 mb-1">
                  {tr("Monthly Total", "Total Bulanan")}
                </p>
                <p className="text-3xl sm:text-5xl font-black text-gray-900 truncate">
                  {showNominal ? formatCurrency(monthlyExpense, language, settings.currency) : "****"}
                </p>
              </div>
            )}
          </div>

          {/* Transaction History Section */}
          <section className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="text-lg font-black tracking-tight uppercase flex items-center gap-2">
                <span className="material-symbols-outlined">history</span>
                {tr("Transaction History", "Riwayat Transaksi")}
              </h2>
              
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="rounded-lg border-2 border-[#1c1c13] bg-white px-3 py-1.5 text-xs font-bold shadow-[2px_2px_0_#1c1c13] outline-none focus:bg-[#fffbeb]"
                >
                  <option value="ALL">{tr("All", "Semua")}</option>
                  <option value="INCOME">{tr("Income", "Pemasukan")}</option>
                  <option value="EXPENSE">{tr("Expense", "Pengeluaran")}</option>
                  <optgroup label={tr("Expense Category", "Kategori Pengeluaran")}>
                    <option value="FOOD">{tr("Food", "Makanan")}</option>
                    <option value="TRANSPORT">{tr("Transport", "Transportasi")}</option>
                    <option value="EDUCATION">{tr("Education", "Edukasi")}</option>
                    <option value="ENTERTAINMENT">{tr("Entertainment", "Hiburan")}</option>
                    <option value="UTILITIES">{tr("Utilities", "Tagihan")}</option>
                    <option value="OTHER">{tr("Other", "Lainnya")}</option>
                  </optgroup>
                </select>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportCSV}
                  className="px-3 min-h-8 text-[10px] uppercase font-black"
                >
                  {tr("Export", "Ekspor")}
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((entry) => {
                  const isIncome = entry.type === "INCOME";
                  const amountLabel = formatCurrency(entry.amount, language, settings.currency);
                  const title = entry.note || entry.description || tr("Transaction", "Transaksi");
                  const categoryLabel = entry.category || tr("Uncategorized", "Tanpa kategori");

                  return (
                    <article
                      key={entry.id}
                      className="flex items-center justify-between gap-4 rounded-xl border-2 border-[#1c1c13] bg-white p-4 shadow-[4px_4px_0_#1c1c13] transition-transform hover:-translate-y-0.5 active:translate-y-0 active:shadow-[2px_2px_0_#1c1c13]"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate text-sm font-black text-gray-900">{title}</h3>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${isIncome ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
                            {entry.type === "SHARED_EXPENSE" ? "SPLIT" : entry.type}
                          </span>
                        </div>
                        <p className="mt-1 text-xs font-semibold text-gray-500">
                          {categoryLabel} · {formatDate(entry.createdAt, language)}
                        </p>
                      </div>
                      <div className={`shrink-0 text-right text-sm font-black ${isIncome ? "text-green-700" : "text-red-600"}`}>
                        {isIncome ? "+" : "-"}{showNominal ? amountLabel : "****"}
                      </div>
                    </article>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 py-12 text-center">
                  <span className="material-symbols-outlined text-4xl text-gray-400">receipt_long</span>
                  <h3 className="mt-2 text-sm font-black text-gray-900">
                    {tr("No transactions", "Belum ada transaksi")}
                  </h3>
                  <p className="mt-1 max-w-sm text-xs font-medium text-gray-500">
                    {tr("There are no transactions matching your filters for this month.", "Tidak ada transaksi yang sesuai dengan filter Anda di bulan ini.")}
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>
      </PageLayout>

      {showTransactionModal && (
        <CreateTransactionModal
          onClose={() => setShowTransactionModal(false)}
          onSuccess={handleModalSuccess}
        />
      )}
    </>
  );
}

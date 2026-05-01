import { useCallback, useMemo, useState } from "react";
import { PageLayout } from "../layouts/PageLayout";
import { AppHeader } from "../headers/AppHeader";
import { StatusPill } from "../ui/StatusPill";
import { CreateTransactionModal } from "../modals/CreateTransactionModal";
import { useI18n } from "../../i18n/useI18n";

function toRupiah(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function formatDate(value, language) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString(language || "id-ID", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
}

function normalizeText(value = "") {
  return value.toString().toLowerCase();
}

export function HomeDashboard({
  isOffline,
  apiStatus,
  dbStatus,
  financeData,
  lastChecked,
  onRecheck,
  onOpenSplitBill,
  onOpenProfile,
  onTransactionCreated,
  userName,
  mainLogo,
  mascotImage,
}) {
  const { t, language } = useI18n();
  const tr = (en, id) => (language === "id-ID" ? id : en);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const splitSummary = financeData?.splitSummary || {
    total: 0,
    paid: 0,
    unpaid: 0,
  };
  const transactionSummary = financeData?.transactionSummary || {
    totalIncome: 0,
    totalExpense: 0,
    netBalance: 0,
  };
  const analytics = financeData?.analytics || null;
  const recentTransactions = useMemo(
    () => financeData?.recentTransactions || [],
    [financeData?.recentTransactions],
  );

  const weeklySpend = analytics?.totals?.weeklyTotal || 0;
  const averageDaily = analytics?.totals?.averageDaily || 0;
  const dailyLimit = Math.max(1, Math.round(averageDaily * 1.2) || 100000);
  const progress = Math.min(100, Math.round((averageDaily / dailyLimit) * 100));

  const filteredTransactions = useMemo(() => {
    const query = normalizeText(searchQuery).trim();

    if (!query) {
      return recentTransactions;
    }

    return recentTransactions.filter((entry) => {
      const haystack = [
        entry.note,
        entry.description,
        entry.category,
        entry.type,
        entry.amount,
      ]
        .filter(Boolean)
        .map((item) => normalizeText(item))
        .join(" ");

      return haystack.includes(query);
    });
  }, [recentTransactions, searchQuery]);

  const handleAddTransactionClick = useCallback(() => {
    setShowTransactionModal(true);
  }, []);

  const handleSearchChange = useCallback((event) => {
    setSearchQuery(event.target.value);
  }, []);

  const handleModalSuccess = useCallback(async () => {
    await onTransactionCreated?.();
  }, [onTransactionCreated]);

  const header = (
    <AppHeader
      mainLogo={mainLogo}
      onSettingsClick={onOpenProfile}
      onRefreshClick={onRecheck}
      onAddTransactionClick={handleAddTransactionClick}
      onSearchChange={handleSearchChange}
    />
  );

  return (
    <>
      <PageLayout header={header} className="space-y-6 lg:space-y-8">
        <div className="space-y-6 lg:grid lg:grid-cols-12 lg:gap-6 lg:space-y-0">
          <section className="lg:col-span-7 space-y-4">
            <div className="rounded-2xl border border-[#1c1c13] bg-[#fffbeb] p-5 shadow-[6px_6px_0px_0px_rgba(28,28,19,1)] sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2">
                  <span className="inline-flex rounded-full border border-[#1c1c13] bg-[#4648d4] px-3 py-1 text-[10px] font-black tracking-[0.2em] text-white uppercase">
                    {t("activeLimit", "Active Limit")}
                  </span>
                  <div>
                    <h1 className="text-2xl font-black tracking-tight text-[#1c1c13] sm:text-3xl">
                      {tr("Good to see you", "Senang melihatmu")}
                      {userName ? `, ${userName}` : ""}
                    </h1>
                  </div>
                </div>

                <img
                  src={mascotImage || mainLogo}
                  alt="LIVO mascot"
                  className="h-16 w-16 rounded-2xl border border-[#1c1c13] bg-white object-cover p-2"
                />
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <article className="rounded-2xl border border-[#1c1c13] bg-white p-4 shadow-[2px_2px_0px_0px_rgba(28,28,19,1)]">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-[#464554]">
                    {t("dailyLimit", "Daily Limit")}
                  </p>
                  <p className="mt-2 text-xl font-black text-[#1c1c13]">
                    {toRupiah(dailyLimit)}
                  </p>
                </article>

                <article className="rounded-2xl border border-[#1c1c13] bg-white p-4 shadow-[2px_2px_0px_0px_rgba(28,28,19,1)]">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-[#464554]">
                    {t("weeklySpend", "Weekly Spend")}
                  </p>
                  <p className="mt-2 text-xl font-black text-[#1c1c13]">
                    {toRupiah(weeklySpend)}
                  </p>
                </article>

                <article className="rounded-2xl border border-[#1c1c13] bg-white p-4 shadow-[2px_2px_0px_0px_rgba(28,28,19,1)]">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-[#464554]">
                    {t("netBalance", "Net Balance")}
                  </p>
                  <p
                    className={`mt-2 text-xl font-black ${transactionSummary.netBalance >= 0 ? "text-[#14532d]" : "text-[#7f1d1d]"}`}
                  >
                    {toRupiah(transactionSummary.netBalance)}
                  </p>
                </article>

                <article className="rounded-2xl border border-[#1c1c13] bg-white p-4 shadow-[2px_2px_0px_0px_rgba(28,28,19,1)]">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-[#464554]">
                    {t("splitTotal", "Split Total")}
                  </p>
                  <p className="mt-2 text-xl font-black text-[#1c1c13]">
                    {toRupiah(splitSummary.total)}
                  </p>
                </article>
              </div>

              <div className="mt-5 border-t border-[#1c1c13] pt-5">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="text-xs font-bold uppercase tracking-wide text-[#464554]">
                    {t("todayProgress", "Today's Progress")}
                  </span>
                  <span className="text-xs font-black text-[#4648d4]">
                    {toRupiah(averageDaily)} / {toRupiah(dailyLimit)}
                  </span>
                </div>

                <div className="h-4 w-full overflow-hidden rounded-full border border-[#1c1c13] bg-white">
                  <div
                    className="h-full border-r border-[#1c1c13] bg-[#ffc329]"
                    style={{ width: `${progress}%` }}
                  />
                </div>

              </div>
            </div>
          </section>

          <section className="grid grid-cols-2 gap-4 lg:col-span-5">
            <div className="flex flex-col items-center justify-center space-y-2 rounded-2xl border border-[#1c1c13] bg-[#f8f4e4] p-4 shadow-[4px_4px_0px_0px_rgba(28,28,19,1)]">
              <div className="relative h-20 w-20">
                <svg className="h-full w-full -rotate-90">
                  <circle
                    cx="40"
                    cy="40"
                    r="32"
                    fill="transparent"
                    stroke="#1c1c13"
                    strokeWidth="8"
                    opacity="0.12"
                  />
                  <circle
                    cx="40"
                    cy="40"
                    r="32"
                    fill="transparent"
                    stroke="#4648d4"
                    strokeWidth="8"
                    strokeDasharray="201"
                    strokeDashoffset={201 - (201 * progress) / 100}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-black">{progress}%</span>
                </div>
              </div>
              <span className="text-center text-[10px] font-bold uppercase text-[#464554]">
                {t("efficiencyScore", "Efficiency Score")}
              </span>
            </div>

            <div className="flex flex-col justify-between rounded-2xl border border-[#1c1c13] bg-[#ffc329] p-4 shadow-[4px_4px_0px_0px_rgba(28,28,19,1)]">
              <div className="flex items-start justify-between gap-2">
                <span className="material-symbols-outlined font-bold">trending_up</span>
                <span className="rounded border border-[#1c1c13] bg-white/40 px-2 py-0.5 text-[10px] font-black">
                  {progress}%
                </span>
              </div>
              <div>
                <span className="block text-2xl font-black leading-none">
                  {toRupiah(weeklySpend)}
                </span>
                <span className="text-[10px] font-bold uppercase opacity-80">
                  {t("weeklySpend", "Weekly Spend")}
                </span>
              </div>
            </div>
          </section>

          <section className="space-y-4 lg:col-span-7">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-black tracking-tight uppercase">
                {t("recentActivity", "Recent Activity")}
              </h2>
              <button
                type="button"
                onClick={onOpenSplitBill}
                className="min-h-11 rounded-2xl border border-[#1c1c13] bg-[#fbbf24] px-3 text-[10px] font-black uppercase shadow-[2px_2px_0px_0px_rgba(28,28,19,1)]"
              >
                {t("historyAndSplit", "History & Split")}
              </button>
            </div>

            <div className="space-y-3">
              {filteredTransactions.length > 0 ? (
                filteredTransactions.slice(0, 4).map((entry) => {
                  const isIncome = entry.type === "INCOME";
                  const amountLabel = toRupiah(entry.amount);
                  const title = entry.note || entry.description || tr("Transaction", "Transaksi");
                  const categoryLabel = entry.category || tr("Uncategorized", "Tanpa kategori");

                  return (
                    <article
                      key={entry.id}
                      className="flex items-center justify-between gap-4 rounded-2xl border border-[#1c1c13] bg-white p-4 shadow-[2px_2px_0px_0px_rgba(28,28,19,1)]"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate text-sm font-black text-[#1c1c13]">
                            {title}
                          </h3>
                          <span
                            className={`rounded-full border border-[#1c1c13] px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${isIncome ? "bg-[#dcfce7] text-[#14532d]" : "bg-[#fee2e2] text-[#7f1d1d]"}`}
                          >
                            {entry.type}
                          </span>
                        </div>
                        <p className="mt-1 text-xs font-semibold text-[#464554]">
                          {categoryLabel} · {formatDate(entry.createdAt, language)}
                        </p>
                      </div>
                      <div className={`shrink-0 text-right text-sm font-black ${isIncome ? "text-[#14532d]" : "text-[#7f1d1d]"}`}>
                        {isIncome ? "+" : "-"}
                        {amountLabel}
                      </div>
                    </article>
                  );
                })
              ) : (
                <div className="rounded-2xl border border-[#1c1c13] bg-white p-4 shadow-[2px_2px_0px_0px_rgba(28,28,19,1)]">
                  <p className="text-sm font-semibold text-[#464554]">
                    {searchQuery
                      ? tr("No matching transactions found.", "Tidak ada transaksi yang cocok.")
                      : tr("No recent transactions yet.", "Belum ada transaksi terbaru.")}
                  </p>
                </div>
              )}
            </div>
          </section>

          <section className="lg:col-span-5">
            <div className="rounded-2xl border border-[#1c1c13] bg-[#1c1c13] p-6 text-white shadow-[6px_6px_0px_0px_rgba(28,28,19,1)]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="mb-1 text-xl font-black leading-none">
                    {t("financialMilestone", "Financial Milestone")}
                  </h3>
                  <p className="max-w-sm text-xs opacity-80">
                    {tr("Current net balance is", "Saldo bersih saat ini")} {toRupiah(transactionSummary.netBalance)} {tr("with total income", "dengan total pemasukan")} {toRupiah(transactionSummary.totalIncome)}.
                  </p>
                </div>
                <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white bg-[#ffc329]">
                  <span
                    className="material-symbols-outlined text-3xl text-[#1c1c13]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    workspace_premium
                  </span>
                </div>
              </div>

              <button
                type="button"
                className="mt-4 w-full rounded-2xl border border-[#1c1c13] bg-white py-3 text-xs font-black uppercase text-[#1c1c13] shadow-[4px_4px_0px_0px_rgba(255,195,41,1)] transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
              >
                {t("viewProgress", "View Progress")}
              </button>
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

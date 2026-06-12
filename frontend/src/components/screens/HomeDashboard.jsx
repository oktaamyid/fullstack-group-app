import { useCallback, useMemo, useState } from "react";
import { PageLayout } from "../layouts/PageLayout";
import { AppHeader } from "../headers/AppHeader";
import { StatusPill } from "../ui/StatusPill";
import { CreateTransactionModal } from "../modals/CreateTransactionModal";
import { Button } from "../ui/Button";
import { useI18n } from "../../i18n/useI18n";

function toRupiah(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function toCompactRupiah(value) {
  const numericValue = Number(value) || 0;
  const absoluteValue = Math.abs(numericValue);
  const units = [
    { minimum: 1_000_000_000_000, divisor: 1_000_000_000_000, suffix: "Tr" },
    { minimum: 1_000_000_000, divisor: 1_000_000_000, suffix: "M" },
    { minimum: 1_000_000, divisor: 1_000_000, suffix: "Jt" },
    { minimum: 1_000, divisor: 1_000, suffix: "Rb" },
  ];
  const unit = units.find(({ minimum }) => absoluteValue >= minimum);

  if (!unit) {
    return `Rp ${new Intl.NumberFormat("id-ID").format(numericValue)}`;
  }

  const compactValue = new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 1,
  }).format(numericValue / unit.divisor);

  return `Rp ${compactValue} ${unit.suffix}`;
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
            <div className="rounded-2xl border-2 border-[#1c1c13] bg-white p-6 shadow-[4px_4px_0_#1c1c13]">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2">
                  <span className="inline-flex rounded-full border-2 border-[#1c1c13] bg-[#ffc329] px-3 py-1 text-[10px] font-black tracking-[0.1em] text-[#1c1c13] uppercase shadow-[2px_2px_0_#1c1c13]">
                    {formatDate(new Date(), language)}
                  </span>
                  <div>
                    <h1 className="text-2xl font-black tracking-tight text-gray-900 sm:text-3xl">
                      {tr("Good to see you", "Senang melihatmu")}
                      {userName ? `, ${userName}` : ""}
                    </h1>
                  </div>
                </div>

                <img
                  src={mascotImage || mainLogo}
                  alt="LIVO mascot"
                  className="h-16 w-16 rounded-2xl bg-[#fffbeb] object-cover p-2 border-2 border-[#1c1c13] shadow-[2px_2px_0_#1c1c13]"
                />
              </div>

              <div className="mt-6 grid grid-cols-4 gap-2 sm:gap-3">
                <article className="flex min-w-0 flex-col justify-between rounded-xl border-2 border-[#1c1c13] bg-white p-2.5 shadow-[4px_4px_0_#1c1c13] sm:min-h-24 sm:p-4">
                  <p className="text-[9px] font-bold uppercase leading-tight tracking-wide text-gray-500 sm:text-[10px]">
                    {t("dailyLimit", "Daily Limit")}
                  </p>
                  <p className="mt-2 whitespace-nowrap text-[clamp(0.72rem,2.7vw,1.25rem)] font-black leading-none text-gray-900">
                    {toCompactRupiah(dailyLimit)}
                  </p>
                </article>

                <article className="flex min-w-0 flex-col justify-between rounded-xl border-2 border-[#1c1c13] bg-white p-2.5 shadow-[4px_4px_0_#1c1c13] sm:min-h-24 sm:p-4">
                  <p className="text-[9px] font-bold uppercase leading-tight tracking-wide text-gray-500 sm:text-[10px]">
                    {t("weeklySpend", "Weekly Spend")}
                  </p>
                  <p className="mt-2 whitespace-nowrap text-[clamp(0.72rem,2.7vw,1.25rem)] font-black leading-none text-gray-900">
                    {toCompactRupiah(weeklySpend)}
                  </p>
                </article>

                <article className="flex min-w-0 flex-col justify-between rounded-xl border-2 border-[#1c1c13] bg-[#fffbeb] p-2.5 shadow-[4px_4px_0_#1c1c13] sm:min-h-24 sm:p-4">
                  <p className="text-[9px] font-bold uppercase leading-tight tracking-wide text-gray-500 sm:text-[10px]">
                    {t("netBalance", "Net Balance")}
                  </p>
                  <p
                    className={`mt-2 whitespace-nowrap text-[clamp(0.72rem,2.7vw,1.25rem)] font-black leading-none ${transactionSummary.netBalance >= 0 ? "text-green-700" : "text-red-600"}`}
                  >
                    {toCompactRupiah(transactionSummary.netBalance)}
                  </p>
                </article>

                <article className="flex min-w-0 flex-col justify-between rounded-xl border-2 border-[#1c1c13] bg-white p-2.5 shadow-[4px_4px_0_#1c1c13] sm:min-h-24 sm:p-4">
                  <p className="text-[9px] font-bold uppercase leading-tight tracking-wide text-gray-500 sm:text-[10px]">
                    {t("splitTotal", "Split Total")}
                  </p>
                  <p className="mt-2 whitespace-nowrap text-[clamp(0.72rem,2.7vw,1.25rem)] font-black leading-none text-gray-900">
                    {toCompactRupiah(splitSummary.total)}
                  </p>
                </article>
              </div>

              <div className="mt-6 border-t border-gray-100 pt-5">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="text-xs font-bold uppercase tracking-wide text-gray-500">
                    {t("todayProgress", "Today's Progress")}
                  </span>
                  <span className="text-xs font-black text-blue-600">
                    {toRupiah(averageDaily)} / {toRupiah(dailyLimit)}
                  </span>
                </div>

                <div className="h-4 w-full overflow-hidden rounded-full border-2 border-[#1c1c13] bg-white">
                  <div
                    className={`h-full border-r-2 border-[#1c1c13] ${progress > 90 ? 'bg-[#ef4444]' : progress > 75 ? 'bg-[#fbbf24]' : 'bg-[#4648d4]'}`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-2 gap-4 lg:col-span-5">
            <div className="flex flex-col items-center justify-center space-y-2 rounded-2xl border-2 border-[#1c1c13] bg-white p-4 shadow-[4px_4px_0_#1c1c13]">
              <div className="relative h-20 w-20">
                <svg className="h-full w-full -rotate-90">
                  <circle
                    cx="40"
                    cy="40"
                    r="32"
                    fill="transparent"
                    stroke="#1c1c13"
                    strokeWidth="8"
                  />
                  <circle
                    cx="40"
                    cy="40"
                    r="32"
                    fill="transparent"
                    stroke={progress > 90 ? '#ef4444' : progress > 75 ? '#fbbf24' : '#4648d4'}
                    strokeWidth="8"
                    strokeDasharray="201"
                    strokeDashoffset={201 - (201 * progress) / 100}
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-black text-gray-900">{progress}%</span>
                </div>
              </div>
              <span className="text-center text-[10px] font-bold uppercase text-gray-500">
                {t("efficiencyScore", "Efficiency Score")}
              </span>
            </div>

            <div className="flex flex-col justify-between rounded-2xl border-2 border-[#1c1c13] bg-[#fbbf24] p-4 shadow-[4px_4px_0_#1c1c13] text-[#1c1c13]">
              <div className="flex items-start justify-between gap-2">
                <span className="material-symbols-outlined font-bold">
                  trending_up
                </span>
                <span className="rounded border border-[#1c1c13] bg-white px-2 py-0.5 text-[10px] font-black">
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
              <Button
                variant="accent"
                size="sm"
                onClick={onOpenSplitBill}
                className="px-3 min-h-11 text-[10px] uppercase"
              >
                {t("transactions", "Transactions")}
              </Button>
            </div>

            <div className="space-y-3">
              {filteredTransactions.length > 0 ? (
                filteredTransactions.slice(0, 4).map((entry) => {
                  const isIncome = entry.type === "INCOME";
                  const amountLabel = toRupiah(entry.amount);
                  const title =
                    entry.note ||
                    entry.description ||
                    tr("Transaction", "Transaksi");
                  const categoryLabel =
                    entry.category || tr("Uncategorized", "Tanpa kategori");

                  return (
                    <article
                      key={entry.id}
                      className="flex items-center justify-between gap-4 rounded-xl border-2 border-[#1c1c13] bg-white p-4 shadow-[4px_4px_0_#1c1c13] transition-transform hover:-translate-y-0.5 active:translate-y-0 active:shadow-[2px_2px_0_#1c1c13]"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate text-sm font-black text-gray-900">
                            {title}
                          </h3>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${isIncome ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}
                          >
                            {entry.type}
                          </span>
                        </div>
                        <p className="mt-1 text-xs font-semibold text-gray-500">
                          {categoryLabel} ·{" "}
                          {formatDate(entry.createdAt, language)}
                        </p>
                      </div>
                      <div
                        className={`shrink-0 text-right text-sm font-black ${isIncome ? "text-green-700" : "text-red-600"}`}
                      >
                        {isIncome ? "+" : "-"}
                        {amountLabel}
                      </div>
                    </article>
                  );
                })
              ) : (
                <div className="rounded-xl border-2 border-[#1c1c13] bg-[#fffbeb] p-8 text-center shadow-[4px_4px_0_#1c1c13]">
                  <p className="text-sm font-bold text-[#1c1c13]">
                    {searchQuery
                      ? tr(
                          "No matching transactions found.",
                          "Tidak ada transaksi yang cocok.",
                        )
                      : tr(
                          "No recent transactions yet.",
                          "Belum ada transaksi terbaru.",
                        )}
                  </p>
                </div>
              )}
            </div>
          </section>

          <section className="lg:col-span-5">
            <div className="rounded-2xl border-2 border-[#1c1c13] bg-[#4648d4] p-6 text-white shadow-[6px_6px_0_#1c1c13]">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="mb-2 text-xl font-black leading-none text-white">
                    {t("financialMilestone", "Financial Milestone")}
                  </h3>
                  <p className="max-w-sm text-xs text-gray-300 leading-relaxed">
                    {tr("Current net balance is", "Saldo bersih saat ini")}{" "}
                    <strong className="text-white">{toRupiah(transactionSummary.netBalance)}</strong>{" "}
                    {tr("with total income", "dengan total pemasukan")}{" "}
                    <strong className="text-white">{toRupiah(transactionSummary.totalIncome)}</strong>.
                  </p>
                </div>
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border-2 border-[#1c1c13] bg-[#ffc329] shadow-[2px_2px_0_#1c1c13]">
                  <span
                    className="material-symbols-outlined text-3xl text-[#1c1c13]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    workspace_premium
                  </span>
                </div>
              </div>

              <Button
                variant="secondary"
                fullWidth
                className="mt-6 py-3 text-xs uppercase"
              >
                {t("viewProgress", "View Progress")}
              </Button>
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

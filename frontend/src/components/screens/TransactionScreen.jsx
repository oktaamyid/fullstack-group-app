import { useCallback, useEffect, useMemo, useState } from "react";
import { CreateTransactionModal } from "../modals/CreateTransactionModal";
import { deleteTransaction, getTransactions } from "../../services/transaction";
import { deleteSplitBill, getSplitBills, updateSplitBillMemberStatus } from "../../services/splitBill";
import { getAuthUser } from "../../services/auth";
import {
  getCategoryIcon,
  getLocalSettings,
} from "../../services/profileSettings";
import { PageLayout } from "../layouts/PageLayout";
import { PageHeader } from "../headers/PageHeader";
import { useI18n } from "../../i18n/useI18n";

function formatCurrencyByPreference(value, language, currency) {
  const maximumFractionDigits = currency === "IDR" ? 0 : 2;

  return new Intl.NumberFormat(language || "id-ID", {
    style: "currency",
    currency: currency || "IDR",
    maximumFractionDigits,
  }).format(value || 0);
}

function formatDateByLanguage(dateString, language) {
  const date = new Date(dateString);
  return date.toLocaleDateString(language || "id-ID", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function prettifyCategory(category = "") {
  return category
    .toLowerCase()
    .split("_")
    .map((part) => (part ? `${part[0].toUpperCase()}${part.slice(1)}` : ""))
    .join(" ");
}

export function TransactionScreen({ mainLogo }) {
  const { t, language } = useI18n();
  const tr = (en, id) => (language === "id-ID" ? id : en);
  const authUser = getAuthUser();
  const userId = authUser?.id || "guest";
  
  const [activeViewTab, setActiveViewTab] = useState("PERSONAL"); // "PERSONAL" | "SPLIT_BILL"
  const [transactions, setTransactions] = useState([]);
  const [splitBills, setSplitBills] = useState([]);
  const [splitSummary, setSplitSummary] = useState({ total: 0, paid: 0, unpaid: 0 });
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [filterType, setFilterType] = useState("ALL");
  const [transactionDialog, setTransactionDialog] = useState({
    open: false,
    mode: "PERSONAL", // "PERSONAL" | "SPLIT_BILL"
    data: null, // the transaction or split bill
  });
  const settings = getLocalSettings(userId);

  const refreshData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const [txData, splitData] = await Promise.all([
        getTransactions(),
        getSplitBills()
      ]);
      setTransactions(txData.transactions || []);
      setSplitBills(splitData.splitBills || []);
      setSplitSummary(splitData.summary || { total: 0, paid: 0, unpaid: 0 });
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshData();
  }, [refreshData]);

  const filteredTransactions = useMemo(() => {
    if (filterType === "ALL") return transactions;
    return transactions.filter((t) => t.type === filterType);
  }, [transactions, filterType]);

  const txSummary = useMemo(() => {
    const income = transactions
      .filter((t) => t.type === "INCOME")
      .reduce((sum, t) => sum + t.amount, 0);
    const expense = transactions
      .filter((t) => t.type === "EXPENSE" || t.type === "SHARED_EXPENSE")
      .reduce((sum, t) => sum + t.amount, 0);
    return {
      income,
      expense,
      net: income - expense,
    };
  }, [transactions]);

  // --- Actions ---
  const onEditTx = (transaction) => {
    setTransactionDialog({ open: true, mode: "PERSONAL", data: transaction });
  };

  const onDeleteTx = async (id) => {
    setErrorMessage("");
    try {
      await deleteTransaction(id);
      await refreshData();
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  const onEditSplit = (splitBill) => {
    setTransactionDialog({ open: true, mode: "SPLIT_BILL", data: splitBill });
  };

  const onDeleteSplit = async (id) => {
    setErrorMessage("");
    try {
      await deleteSplitBill(id);
      await refreshData();
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  const onToggleSplitMemberStatus = async (splitBillId, memberId, currentStatus) => {
    setErrorMessage("");
    try {
      const nextStatus = currentStatus === "PAID" ? "UNPAID" : "PAID";
      await updateSplitBillMemberStatus(splitBillId, memberId, nextStatus);
      await refreshData();
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  // --- Dialog Management ---
  const handleOpenCreateDialog = (mode = "PERSONAL") => {
    setTransactionDialog({ open: true, mode, data: null });
  };

  const handleDialogClose = () => {
    setTransactionDialog({ open: false, mode: "PERSONAL", data: null });
  };

  const handleDialogSuccess = async () => {
    await refreshData();
  };

  return (
    <PageLayout
      header={
        <PageHeader
          mainLogo={mainLogo}
          title={t("transactions", "Transactions")}
          backLink="/home"
        />
      }
      className="space-y-6 py-6 lg:space-y-0 lg:p-8"
    >
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left Column: Summary & List */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Main View Tab Switcher */}
          <div className="flex gap-2 rounded-xl border-2 border-[#1c1c13] bg-[#fffbeb] p-1 shadow-[2px_2px_0_#1c1c13]">
            <button
              onClick={() => setActiveViewTab("PERSONAL")}
              className={`flex-1 rounded-lg py-2.5 text-xs font-black uppercase transition-all ${
                activeViewTab === "PERSONAL"
                  ? "bg-[#6366f1] text-white border-2 border-[#1c1c13] shadow-[2px_2px_0_#1c1c13]"
                  : "bg-transparent text-[#1c1c13] border-2 border-transparent hover:border-[#1c1c13]"
              }`}
            >
              {t("personal", "Personal")}
            </button>
            <button
              onClick={() => setActiveViewTab("SPLIT_BILL")}
              className={`flex-1 rounded-lg py-2.5 text-xs font-black uppercase transition-all ${
                activeViewTab === "SPLIT_BILL"
                  ? "bg-[#6366f1] text-white border-2 border-[#1c1c13] shadow-[2px_2px_0_#1c1c13]"
                  : "bg-transparent text-[#1c1c13] border-2 border-transparent hover:border-[#1c1c13]"
              }`}
            >
              {t("splitBill", "Split Bill")}
            </button>
          </div>

          {activeViewTab === "PERSONAL" ? (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-4">
                <article className="rounded-xl border-2 border-[#1c1c13] bg-[#22c55e] p-4 lg:p-6 shadow-[4px_4px_0_#1c1c13] text-[#1c1c13]">
                  <p className="text-[10px] lg:text-xs font-black uppercase">
                    {t("income", "Income")}
                  </p>
                  <p className="text-lg lg:text-3xl font-black mt-2">
                    {formatCurrencyByPreference(
                      txSummary.income,
                      settings.language,
                      settings.currency,
                    )}
                  </p>
                </article>
                <article className="rounded-xl border-2 border-[#1c1c13] bg-[#ef4444] p-4 lg:p-6 shadow-[4px_4px_0_#1c1c13] text-white">
                  <p className="text-[10px] lg:text-xs font-black uppercase">
                    {t("expense", "Expense")}
                  </p>
                  <p className="text-lg lg:text-3xl font-black mt-2">
                    {formatCurrencyByPreference(
                      txSummary.expense,
                      settings.language,
                      settings.currency,
                    )}
                  </p>
                </article>
                <article className="hidden lg:block rounded-xl border-2 border-[#1c1c13] bg-[#fffbeb] p-6 shadow-[4px_4px_0_#1c1c13]">
                  <p className="text-xs font-black uppercase text-[#1c1c13]">
                    {t("netBalance", "Net Balance")}
                  </p>
                  <p
                    className={`text-3xl font-black mt-2 ${txSummary.net >= 0 ? "text-[#1c1c13]" : "text-[#ef4444]"}`}
                  >
                    {formatCurrencyByPreference(
                      txSummary.net,
                      settings.language,
                      settings.currency,
                    )}
                  </p>
                </article>
              </div>

              {/* Filter Tabs */}
              <section className="rounded-xl border-2 border-[#1c1c13] bg-white p-1.5 shadow-[4px_4px_0_#1c1c13]">
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setFilterType("ALL")}
                    className={`min-h-[2.5rem] flex-1 rounded-lg border-2 text-xs font-black uppercase transition-all ${
                      filterType === "ALL"
                        ? "bg-[#1c1c13] text-white border-[#1c1c13]"
                        : "bg-white text-[#1c1c13] border-transparent hover:border-[#1c1c13]"
                    }`}
                  >
                    {t("all", "All")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterType("INCOME")}
                    className={`min-h-[2.5rem] flex-1 rounded-lg border-2 text-xs font-black uppercase transition-all ${
                      filterType === "INCOME"
                        ? "bg-[#22c55e] text-[#1c1c13] border-[#1c1c13]"
                        : "bg-white text-[#1c1c13] border-transparent hover:border-[#22c55e]"
                    }`}
                  >
                    {t("income", "Income")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterType("EXPENSE")}
                    className={`min-h-[2.5rem] flex-1 rounded-lg border-2 text-xs font-black uppercase transition-all ${
                      filterType === "EXPENSE"
                        ? "bg-[#ef4444] text-white border-[#1c1c13]"
                        : "bg-white text-[#1c1c13] border-transparent hover:border-[#ef4444]"
                    }`}
                  >
                    {t("expense", "Expense")}
                  </button>
                </div>
              </section>

              {errorMessage && (
                <p className="rounded-xl border-2 border-[#1c1c13] bg-[#ef4444] px-4 py-3 text-sm font-black text-white shadow-[2px_2px_0_#1c1c13]">
                  {errorMessage}
                </p>
              )}

              {/* Transaction List */}
              <section className="rounded-xl border-2 border-[#1c1c13] bg-white p-4 lg:p-6 shadow-[4px_4px_0_#1c1c13]">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg lg:text-xl font-black tracking-tight text-[#1c1c13]">
                    {t("recentActivity", "Recent Activity")}
                  </h2>
                  <button
                    onClick={() => handleOpenCreateDialog("PERSONAL")}
                    className="rounded-lg border-2 border-[#1c1c13] bg-[#fbbf24] px-3 py-1.5 text-xs font-black uppercase text-[#1c1c13] hover:-translate-y-0.5 active:translate-y-0 shadow-[2px_2px_0_#1c1c13] transition-all"
                  >
                    + {t("add", "Add")}
                  </button>
                </div>

                {isLoading && (
                  <p className="text-sm font-medium text-gray-500">
                    {tr("Loading transactions...", "Memuat transaksi...")}
                  </p>
                )}

                {!isLoading && filteredTransactions.length === 0 && (
                  <div className="rounded-2xl border border-gray-100 bg-gray-50 p-8 text-center">
                    <p className="text-sm font-semibold text-gray-500">
                      {tr(
                        "No transactions yet. Create one by clicking Add.",
                        "Belum ada transaksi. Buat transaksi baru dengan tombol Add.",
                      )}
                    </p>
                  </div>
                )}

                <div className="space-y-3">
                  {filteredTransactions.map((transaction) => {
                    const isIncome = transaction.type === "INCOME";
                    return (
                      <article
                        key={transaction.id}
                        className="rounded-xl border-2 border-[#1c1c13] bg-white p-4 shadow-[4px_4px_0_#1c1c13] transition-transform hover:-translate-y-0.5 active:translate-y-0 active:shadow-[2px_2px_0_#1c1c13] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-xl">
                              {getCategoryIcon(settings, transaction.category)}
                            </span>
                            <span className="text-sm font-black text-[#1c1c13]">
                              {prettifyCategory(transaction.category)}
                            </span>
                            <span
                              className={`text-[10px] font-black uppercase tracking-wide px-2 py-0.5 rounded border border-[#1c1c13] ${
                                isIncome
                                  ? "bg-[#22c55e] text-[#1c1c13]"
                                  : "bg-[#ef4444] text-white"
                              }`}
                            >
                              {transaction.type}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-gray-600">
                            {transaction.note ||
                              tr("No description", "Tanpa deskripsi")}
                          </p>
                          <p className="text-[11px] font-bold uppercase text-gray-400 mt-1">
                            {formatDateByLanguage(
                              transaction.createdAt,
                              settings.language,
                            )}
                          </p>

                          {transaction.receiptImage && (
                            <div className="mt-3 flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-2.5 w-fit">
                              <img
                                src={transaction.receiptImage}
                                alt={
                                  transaction.receiptImageName ||
                                  tr("Receipt image", "Gambar bukti transaksi")
                                }
                                className="h-10 w-10 rounded-lg border border-gray-200 object-cover"
                              />
                              <div className="min-w-0 pr-2">
                                <p className="text-[10px] font-bold uppercase text-gray-500">
                                  {t("receiptImage", "Receipt Image")}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="text-left sm:text-right flex sm:flex-col justify-between items-center sm:items-end w-full sm:w-auto mt-2 sm:mt-0 pt-3 sm:pt-0 border-t border-gray-50 sm:border-0">
                          <p
                            className={`text-lg font-black ${
                              isIncome ? "text-green-600" : "text-red-600"
                            }`}
                          >
                            {isIncome ? "+" : "-"}
                            {formatCurrencyByPreference(
                              transaction.amount,
                              settings.language,
                              settings.currency,
                            )}
                          </p>
                          <div className="flex gap-2 sm:mt-3">
                            <button
                              type="button"
                              onClick={() => onEditTx(transaction)}
                              className="text-[10px] font-black uppercase px-3 py-1.5 rounded-lg border-2 border-[#1c1c13] bg-white text-[#1c1c13] shadow-[2px_2px_0_#1c1c13] hover:-translate-y-0.5 active:translate-y-0 transition-all"
                            >
                              {t("edit", "Edit")}
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteTx(transaction.id)}
                              className="text-[10px] font-black uppercase px-3 py-1.5 rounded-lg border-2 border-[#1c1c13] bg-[#ef4444] text-white shadow-[2px_2px_0_#1c1c13] hover:-translate-y-0.5 active:translate-y-0 transition-all"
                            >
                              {t("delete", "Delete")}
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            </>
          ) : (
            <>
              {/* Split Bill Summary Cards */}
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-4">
                <article className="rounded-xl border-2 border-[#1c1c13] bg-[#6366f1] p-4 lg:p-6 shadow-[4px_4px_0_#1c1c13] text-white">
                  <p className="text-[10px] lg:text-xs font-black uppercase text-white">
                    {t("totalSplit", "Total Split")}
                  </p>
                  <p className="text-lg lg:text-3xl font-black mt-2">
                    {formatCurrencyByPreference(
                      splitSummary.total,
                      settings.language,
                      settings.currency,
                    )}
                  </p>
                </article>
                <article className="rounded-xl border-2 border-[#1c1c13] bg-[#fbbf24] p-4 lg:p-6 shadow-[4px_4px_0_#1c1c13] text-[#1c1c13]">
                  <p className="text-[10px] lg:text-xs font-black uppercase text-[#1c1c13]">
                    {t("unpaid", "Unpaid")}
                  </p>
                  <p className="text-lg lg:text-3xl font-black mt-2">
                    {formatCurrencyByPreference(
                      splitSummary.unpaid,
                      settings.language,
                      settings.currency,
                    )}
                  </p>
                </article>
                <article className="hidden lg:block rounded-xl border-2 border-[#1c1c13] bg-[#22c55e] p-6 shadow-[4px_4px_0_#1c1c13] text-[#1c1c13]">
                  <p className="text-xs font-black uppercase text-[#1c1c13]">
                    {t("paid", "Paid")}
                  </p>
                  <p className="text-3xl font-black mt-2">
                    {formatCurrencyByPreference(
                      splitSummary.paid,
                      settings.language,
                      settings.currency,
                    )}
                  </p>
                </article>
              </div>

              {errorMessage && (
                <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                  {errorMessage}
                </p>
              )}

              {/* Split Bill List */}
              <section className="rounded-xl border-2 border-[#1c1c13] bg-white p-4 lg:p-6 shadow-[4px_4px_0_#1c1c13]">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg lg:text-xl font-black tracking-tight text-[#1c1c13]">
                    {t("splitBillHistory", "Split Bill History")}
                  </h2>
                  <button
                    onClick={() => handleOpenCreateDialog("SPLIT_BILL")}
                    className="rounded-lg border-2 border-[#1c1c13] bg-[#6366f1] px-3 py-1.5 text-xs font-black uppercase text-white hover:-translate-y-0.5 active:translate-y-0 shadow-[2px_2px_0_#1c1c13] transition-all"
                  >
                    + {t("newSplit", "New Split")}
                  </button>
                </div>

                {isLoading && (
                  <p className="text-sm font-medium text-gray-500">
                    {tr(
                      "Loading split bill data...",
                      "Memuat data split bill...",
                    )}
                  </p>
                )}

                {!isLoading && splitBills.length === 0 && (
                  <div className="rounded-2xl border border-gray-100 bg-gray-50 p-8 text-center">
                    <p className="text-sm font-semibold text-gray-500">
                      {tr(
                        "No split bills yet. Create one by clicking New Split.",
                        "Belum ada split bill. Buat split bill baru.",
                      )}
                    </p>
                  </div>
                )}

                <div className="space-y-4">
                  {splitBills.map((splitBill) => (
                    <article
                      key={splitBill.id}
                      className="rounded-xl border-2 border-[#1c1c13] bg-white shadow-[4px_4px_0_#1c1c13] overflow-hidden"
                    >
                      <div className="p-4 sm:p-5 bg-gray-50 flex flex-col sm:flex-row items-start justify-between gap-3 border-b border-gray-100">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-base font-black text-gray-900">
                              {splitBill.title}
                            </h3>
                            <span
                              className={`rounded px-2 py-0.5 border-2 border-[#1c1c13] text-[10px] font-black uppercase tracking-wide ${
                                splitBill.status === "PAID"
                                  ? "bg-[#22c55e] text-[#1c1c13]"
                                  : splitBill.status === "PARTIALLY_PAID"
                                    ? "bg-[#fbbf24] text-[#1c1c13]"
                                    : "bg-[#ef4444] text-white"
                              }`}
                            >
                              {splitBill.status}
                            </span>
                          </div>
                          <p className="text-xs font-medium text-gray-500 mb-2">
                            {splitBill.description ||
                              tr("No description", "Tanpa deskripsi")}
                          </p>
                          <p className="text-sm font-black text-gray-700">
                            Total: {formatCurrencyByPreference(
                              splitBill.totalAmount,
                              settings.language,
                              settings.currency
                            )}
                          </p>
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto">
                          <button
                            type="button"
                            onClick={() => onEditSplit(splitBill)}
                            className="flex-1 sm:flex-none text-[10px] font-black uppercase px-3 py-2 rounded-lg border-2 border-[#1c1c13] bg-white text-[#1c1c13] shadow-[2px_2px_0_#1c1c13] hover:-translate-y-0.5 active:translate-y-0 transition-all"
                          >
                            {t("edit", "Edit")}
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteSplit(splitBill.id)}
                            className="flex-1 sm:flex-none text-[10px] font-black uppercase px-3 py-2 rounded-lg border-2 border-[#1c1c13] bg-[#ef4444] text-white shadow-[2px_2px_0_#1c1c13] hover:-translate-y-0.5 active:translate-y-0 transition-all"
                          >
                            {t("delete", "Delete")}
                          </button>
                        </div>
                      </div>

                      <div className="p-4 sm:p-5">
                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {splitBill.members.map((member) => (
                            <li
                              key={member.id}
                              className="rounded-xl border-2 border-[#1c1c13] bg-[#fffbeb] p-3 shadow-[2px_2px_0_#1c1c13] flex items-center justify-between gap-3"
                            >
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-black text-[#1c1c13] truncate">
                                  {member.friendName}
                                </p>
                                <p className="text-xs font-black text-gray-700 mt-0.5">
                                  {formatCurrencyByPreference(
                                    member.amount,
                                    settings.language,
                                    settings.currency
                                  )}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  onToggleSplitMemberStatus(
                                    splitBill.id,
                                    member.id,
                                    member.status,
                                  )
                                }
                                className={`shrink-0 min-h-[2.5rem] rounded-lg border-2 border-[#1c1c13] px-3 text-[10px] font-black uppercase shadow-[2px_2px_0_#1c1c13] hover:-translate-y-0.5 active:translate-y-0 transition-all ${
                                  member.status === "PAID"
                                    ? "bg-[#22c55e] text-[#1c1c13]"
                                    : "bg-[#fbbf24] text-[#1c1c13]"
                                }`}
                              >
                                {member.status === "PAID"
                                  ? t("markUnpaid", "Mark Unpaid")
                                  : t("markPaid", "Mark Paid")}
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            </>
          )}
        </div>

        {/* Right Column: Floating Action Summary */}
        <div className="space-y-6 lg:sticky lg:top-8 self-start">
          <section className="rounded-xl border-2 border-[#1c1c13] bg-[#fbbf24] text-[#1c1c13] p-6 shadow-[6px_6px_0_#1c1c13]">
            <h2 className="text-xl font-black mb-2">
              {tr("Manage Cashflow", "Kelola Arus Kas")}
            </h2>
            <p className="text-sm font-bold mb-6 text-[#1c1c13]">
              {tr(
                "Create new personal transactions or split bills with friends.",
                "Buat transaksi personal atau bagi tagihan dengan teman."
              )}
            </p>
            
            <div className="space-y-3">
              <button
                onClick={() => handleOpenCreateDialog("PERSONAL")}
                className="w-full flex items-center justify-between rounded-xl border-2 border-[#1c1c13] bg-[#6366f1] text-white p-4 shadow-[4px_4px_0_#1c1c13] hover:-translate-y-0.5 active:translate-y-0 transition-all"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-white">receipt_long</span>
                  <span className="font-black text-sm tracking-wide">{tr("New Transaction", "Transaksi Baru")}</span>
                </div>
                <span className="material-symbols-outlined font-bold">add</span>
              </button>

              <button
                onClick={() => handleOpenCreateDialog("SPLIT_BILL")}
                className="w-full flex items-center justify-between rounded-xl border-2 border-[#1c1c13] bg-white text-[#1c1c13] p-4 shadow-[4px_4px_0_#1c1c13] hover:-translate-y-0.5 active:translate-y-0 transition-all"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#1c1c13]">group</span>
                  <span className="font-black text-sm tracking-wide">{tr("New Split Bill", "Split Bill Baru")}</span>
                </div>
                <span className="material-symbols-outlined font-bold">add</span>
              </button>
            </div>
          </section>
        </div>
      </div>

      {transactionDialog.open && (
        <CreateTransactionModal
          initialMode={transactionDialog.mode}
          initialValues={transactionDialog.data}
          transactionId={transactionDialog.mode === "PERSONAL" ? transactionDialog.data?.id : null}
          splitBillId={transactionDialog.mode === "SPLIT_BILL" ? transactionDialog.data?.id : null}
          onClose={handleDialogClose}
          onSuccess={handleDialogSuccess}
        />
      )}
    </PageLayout>
  );
}

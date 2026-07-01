import { useEffect, useState, useCallback, useMemo } from "react";
import { PageLayout } from "../layouts/PageLayout";
import { PageHeader } from "../headers/PageHeader";
import { useI18n } from "../../i18n/useI18n";
import { useProfileSettings } from "../../hooks/useProfileSettings";
import { getWallets } from "../../services/wallet";

import { getSplitBills, deleteSplitBill } from "../../services/splitBill";
import { getBudgetProgress } from "../../services/budget";
import { formatCurrency } from "../../services/currency";
import { ManageWalletModal } from "../modals/ManageWalletModal";
import { CreateSplitBillModal } from "../modals/CreateSplitBillModal";
import { SetBudgetModal } from "../modals/SetBudgetModal";
import { ConfirmModal } from "../modals/ConfirmModal";
import { Alert } from "../ui/Alert";
import { Button } from "../ui/Button";

const CATEGORY_LABELS = {
  FOOD: "🍕 Food",
  TRANSPORT: "🚗 Transport",
  EDUCATION: "📚 Education",
  ENTERTAINMENT: "🎬 Entertainment",
  UTILITIES: "💡 Utilities",
  OTHER: "📌 Other",
};

export function WalletBudgetScreen({ mainLogo }) {
  const { language } = useI18n();
  const tr = useCallback((en, id) => (language === "id-ID" ? id : en), [language]);
  const settings = useProfileSettings();
  
  const [activeTab, setActiveTab] = useState("WALLET"); // WALLET | BUDGET | SPLIT_BILL
  const [loading, setLoading] = useState(true);
  
  const [wallets, setWallets] = useState([]);
  const [budgets, setBudgets] = useState([]);

  const [splitBills, setSplitBills] = useState([]);
  
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showSplitBillModal, setShowSplitBillModal] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [selectedBudgetCat, setSelectedBudgetCat] = useState("FOOD");
  const [selectedBudgetAmt, setSelectedBudgetAmt] = useState("");
  
  const [errorMessage, setErrorMessage] = useState("");
  const [confirmDialog, setConfirmDialog] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const currentDate = new Date();
      const [walletsData, splitData, budgetData] = await Promise.all([
        getWallets(),
        getSplitBills(),
        getBudgetProgress(currentDate.getMonth() + 1, currentDate.getFullYear())
      ]);
      setWallets(walletsData || []);
      setSplitBills(splitData.splitBills || []);
      setBudgets(budgetData?.progress || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const totalBalance = useMemo(
    () => wallets.reduce((sum, w) => sum + Number(w.balance || 0), 0),
    [wallets]
  );



  const handleDeleteSplitBill = async (id) => {
    setConfirmDialog({
      title: tr("Delete Bill?", "Hapus Tagihan?"),
      message: tr("Are you sure you want to delete this bill?", "Yakin ingin menghapus tagihan ini?"),
      isDanger: true,
      onConfirm: async () => {
        try {
          await deleteSplitBill(id);
          await loadData();
        } catch (error) {
          console.error(error);
          setErrorMessage(tr("Failed to delete bill", "Gagal menghapus tagihan"));
        } finally {
          setConfirmDialog(null);
        }
      }
    });
  };

  return (
    <>
      <PageLayout
        header={
          <PageHeader
            mainLogo={mainLogo}
            title={tr("Wallet & Budget", "Dompet & Anggaran")}
            backLink="/home"
          />
        }
        className="space-y-5 pt-5 lg:space-y-6"
      >
        {errorMessage && <Alert type="error" onClose={() => setErrorMessage("")}>{errorMessage}</Alert>}

        <div className="flex rounded-xl border-2 border-[#1c1c13] bg-[#fffbeb] p-1 w-full max-w-md mx-auto mb-6 shadow-[2px_2px_0_#1c1c13]">
          <button
            className={`flex-1 rounded-lg py-2 text-xs font-black uppercase tracking-wide transition-colors ${activeTab === "WALLET" ? "bg-[#4648d4] text-white shadow-sm" : "text-[#1c1c13] hover:bg-[#ffc329]"}`}
            onClick={() => setActiveTab("WALLET")}
          >
            {tr("Wallet", "Dompet")}
          </button>
          <button
            className={`flex-1 rounded-lg py-2 text-xs font-black uppercase tracking-wide transition-colors ${activeTab === "BUDGET" ? "bg-[#4648d4] text-white shadow-sm" : "text-[#1c1c13] hover:bg-[#ffc329]"}`}
            onClick={() => setActiveTab("BUDGET")}
          >
            {tr("Budget", "Anggaran")}
          </button>
          <button
            className={`flex-1 rounded-lg py-2 text-xs font-black uppercase tracking-wide transition-colors ${activeTab === "SPLIT_BILL" ? "bg-[#4648d4] text-white shadow-sm" : "text-[#1c1c13] hover:bg-[#ffc329]"}`}
            onClick={() => setActiveTab("SPLIT_BILL")}
          >
            {tr("Split Bills", "Tagihan")}
          </button>
        </div>

        <div className="max-w-4xl mx-auto space-y-6">
          {loading ? (
            <div className="rounded-xl border-2 border-[#1c1c13] bg-white p-4 font-bold text-center">
              {tr("Loading data...", "Memuat data...")}
            </div>
          ) : (
            <>
              {activeTab === "WALLET" && (
                <div className="space-y-6">
                  <div className="rounded-2xl border-2 border-[#1c1c13] bg-[#6366f1] p-6 shadow-[4px_4px_0_#1c1c13] text-white flex justify-between items-center">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.15em] text-indigo-200">
                        {tr("Total Wealth", "Total Saldo")}
                      </p>
                      <h2 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">
                        {formatCurrency(totalBalance, language, settings.currency)}
                      </h2>
                    </div>
                    <button
                      onClick={() => setShowWalletModal(true)}
                      className="flex h-12 w-12 items-center justify-center rounded-xl border-2 border-[#1c1c13] bg-[#ffc329] text-[#1c1c13] shadow-[2px_2px_0_#1c1c13] transition-transform hover:-translate-y-1 active:translate-y-0"
                    >
                      <span className="material-symbols-outlined text-2xl font-black">edit</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {wallets.length > 0 ? (
                      wallets.map((wallet) => (
                        <div key={wallet.id} className="flex items-center justify-between rounded-xl border-2 border-[#1c1c13] bg-white p-4 shadow-[4px_4px_0_#1c1c13]">
                          <div className="flex items-center gap-4">
                            <div className={`flex h-12 w-12 items-center justify-center rounded-xl border-2 border-[#1c1c13] shadow-[2px_2px_0_#1c1c13] ${wallet.type === 'CASH' ? 'bg-[#22c55e]' : wallet.type === 'BANK' ? 'bg-[#3b82f6]' : 'bg-[#a855f7]'}`}>
                              <span className="material-symbols-outlined text-white font-black text-xl">
                                {wallet.type === 'CASH' ? 'payments' : wallet.type === 'BANK' ? 'account_balance' : 'account_balance_wallet'}
                              </span>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{wallet.type}</p>
                              <p className="text-lg font-black text-gray-900">{wallet.name}</p>
                            </div>
                          </div>
                          <p className="text-xl font-black text-[#1c1c13]">
                            {formatCurrency(wallet.balance, language, settings.currency)}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="col-span-full text-center text-sm font-bold text-gray-500 py-8">
                        {tr("No wallets found. Click the edit button to add one.", "Belum ada dompet. Klik tombol edit untuk menambahkan.")}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "BUDGET" && (
                <div className="space-y-6">
                  <div className="rounded-2xl border-2 border-[#1c1c13] bg-white p-6 shadow-[4px_4px_0_#1c1c13]">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-lg font-black uppercase tracking-tight text-gray-900">
                        {tr("Daily Limit Config", "Konfigurasi Batas Harian")}
                      </h2>
                      <span className="rounded-lg border-2 border-[#1c1c13] bg-[#ffc329] px-3 py-1 text-xs font-black shadow-[2px_2px_0_#1c1c13]">
                        {settings.dailyLimitMode === "AUTO" ? "AUTO" : "MANUAL"}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-gray-600 mb-2">
                      {tr("Current Daily Limit:", "Batas Harian Saat Ini:")}
                    </p>
                    <p className="text-3xl font-black text-[#4648d4]">
                      {formatCurrency(settings.manualDailyLimit || 0, language, settings.currency)}
                    </p>
                    <p className="text-xs font-medium text-gray-500 mt-2">
                      {tr("Change this in Profile > Application Settings.", "Ubah konfigurasi ini di Profil > Konfigurasi Aplikasi.")}
                    </p>
                  </div>
                  
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-black uppercase tracking-tight text-gray-900">
                      {tr("Category Budgets", "Anggaran Kategori")}
                    </h2>
                    <button
                      onClick={() => {
                        setSelectedBudgetCat("FOOD");
                        setSelectedBudgetAmt("");
                        setShowBudgetModal(true);
                      }}
                      className="flex h-10 items-center justify-center gap-2 rounded-xl border-2 border-[#1c1c13] bg-[#ffc329] px-4 text-xs font-black uppercase text-[#1c1c13] shadow-[2px_2px_0_#1c1c13] transition-transform hover:-translate-y-0.5 active:translate-y-0"
                    >
                      <span className="material-symbols-outlined text-sm font-black">add</span>
                      {tr("Set Budget", "Atur")}
                    </button>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    {budgets.length > 0 ? (
                      budgets.map((b) => (
                        <div key={b.id} className="rounded-xl border-2 border-[#1c1c13] bg-white p-4 shadow-[4px_4px_0_#1c1c13]">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="text-sm font-black text-gray-900 uppercase">
                              {CATEGORY_LABELS[b.category] || b.category}
                            </h3>
                            <button
                              onClick={() => {
                                setSelectedBudgetCat(b.category);
                                setSelectedBudgetAmt(b.amount || "");
                                setShowBudgetModal(true);
                              }}
                              className="text-[#6366f1] text-xs font-black hover:underline uppercase"
                            >
                              {tr("Edit", "Ubah")}
                            </button>
                          </div>
                          
                          <div className="flex justify-between items-end mb-2">
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                                {tr("Spent", "Terpakai")}
                              </p>
                              <p className={`text-lg font-black ${b.spent > b.amount ? "text-[#ba1a1a]" : "text-[#1c1c13]"}`}>
                                {formatCurrency(b.spent, language, settings.currency)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                                {tr("Limit", "Batas")}
                              </p>
                              <p className="text-sm font-bold text-gray-600">
                                {formatCurrency(b.amount, language, settings.currency)}
                              </p>
                            </div>
                          </div>

                          <div className="h-3 w-full overflow-hidden rounded-full border-2 border-[#1c1c13] bg-gray-100">
                            <div 
                              className={`h-full border-r-2 border-[#1c1c13] ${b.percentage >= 100 ? "bg-[#ba1a1a]" : b.percentage >= 80 ? "bg-[#ffc329]" : "bg-[#22c55e]"}`}
                              style={{ width: `${Math.min(b.percentage, 100)}%` }}
                            />
                          </div>
                          <p className="mt-1 text-right text-[10px] font-bold text-gray-500">
                            {b.percentage}%
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-full rounded-2xl border-2 border-dashed border-[#1c1c13] bg-[#fffbeb] p-8 text-center">
                        <span className="material-symbols-outlined text-4xl text-[#ffc329] mb-2">savings</span>
                        <h3 className="text-lg font-black text-gray-900">{tr("No Budgets Set", "Belum Ada Anggaran")}</h3>
                        <p className="text-sm font-bold text-gray-600 mt-1 mb-4">
                          {tr("Set a budget to track your spending limits.", "Atur anggaran untuk mengontrol batas pengeluaranmu.")}
                        </p>
                        <button
                          onClick={() => {
                            setSelectedBudgetCat("FOOD");
                            setSelectedBudgetAmt("");
                            setShowBudgetModal(true);
                          }}
                          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border-2 border-[#1c1c13] bg-[#ffc329] px-4 text-xs font-black uppercase text-[#1c1c13] shadow-[2px_2px_0_#1c1c13] transition-transform hover:-translate-y-0.5 active:translate-y-0"
                        >
                          <span className="material-symbols-outlined text-sm font-black">add</span>
                          {tr("Set Budget", "Atur Anggaran")}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "SPLIT_BILL" && (
                <div className="space-y-4">
                  <div className="rounded-2xl border-2 border-[#1c1c13] bg-white p-6 shadow-[4px_4px_0_#1c1c13] flex justify-between items-center">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
                        {tr("Split Bills List", "Daftar Tagihan Patungan")}
                      </p>
                      <p className="text-3xl font-black text-[#1c1c13]">
                        {splitBills.length} {tr("Bills", "Tagihan")}
                      </p>
                    </div>
                    <button
                      onClick={() => setShowSplitBillModal(true)}
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 border-[#1c1c13] bg-[#6366f1] text-white shadow-[2px_2px_0_#1c1c13] transition-transform hover:-translate-y-1 active:translate-y-0"
                    >
                      <span className="material-symbols-outlined text-2xl font-black">add</span>
                    </button>
                  </div>

                  {splitBills.length > 0 ? (
                    splitBills.map((bill) => (
                      <article key={bill.id} className="rounded-xl border-2 border-[#1c1c13] bg-white p-4 shadow-[4px_4px_0_#1c1c13]">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-lg font-black text-gray-900">{bill.title}</h3>
                            <p className="text-xs font-bold text-gray-500">{new Date(bill.date).toLocaleDateString(language)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-black text-[#1c1c13]">
                              {formatCurrency(bill.totalAmount, language, settings.currency)}
                            </p>
                            <div className="flex gap-2 justify-end mt-1">
                              <button onClick={() => handleDeleteSplitBill(bill.id)} className="text-xs font-bold text-red-600 hover:underline">
                                {tr("Delete", "Hapus")}
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          {bill.members.map(m => (
                            <div key={m.id} className="flex justify-between items-center border-t border-gray-100 pt-2">
                              <span className="text-sm font-bold">{m.friendName} {m.isUser && "(Saya)"}</span>
                              <span className="text-sm font-black text-[#6366f1]">{formatCurrency(m.amount, language, settings.currency)}</span>
                            </div>
                          ))}
                        </div>
                        <div className="mt-4 border-t-2 border-dashed border-gray-300 pt-4 flex gap-2">
                          <button
                            onClick={() => {
                              const shareId = (bill.id * 792384).toString(36);
                              const url = `${window.location.origin}/split/${shareId}`;
                              navigator.clipboard.writeText(url);
                              alert(tr("Link copied to clipboard!", "Link berhasil disalin!"));
                            }}
                            className="flex-1 rounded-xl border-2 border-[#1c1c13] bg-[#fdf9e9] py-2 text-xs font-black uppercase text-[#1c1c13] transition-colors hover:bg-gray-100 flex items-center justify-center gap-1"
                          >
                            <span className="material-symbols-outlined text-[14px]">share</span>
                            {tr("Share Link", "Bagikan Link")}
                          </button>
                        </div>
                      </article>
                    ))
                  ) : (
                    <div className="rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center text-sm font-bold text-gray-500">
                      {tr("No split bills found.", "Belum ada tagihan patungan.")}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </PageLayout>

      {showWalletModal && (
        <ManageWalletModal
          onClose={() => setShowWalletModal(false)}
          onSuccess={loadData}
          wallets={wallets}
        />
      )}

      {showSplitBillModal && (
        <CreateSplitBillModal
          onClose={() => {
            setShowSplitBillModal(false);
          }}
          onSuccess={loadData}
        />
      )}

      {showBudgetModal && (
        <SetBudgetModal
          onClose={() => setShowBudgetModal(false)}
          onSuccess={loadData}
          initialCategory={selectedBudgetCat}
          currentAmount={selectedBudgetAmt}
        />
      )}
      
      {confirmDialog && (
        <ConfirmModal
          title={confirmDialog.title}
          message={confirmDialog.message}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog(null)}
          isDanger={confirmDialog.isDanger}
        />
      )}
    </>
  );
}

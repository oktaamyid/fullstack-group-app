import { useCallback, useEffect, useState } from "react";
import { getWishlists, createWishlistItem, updateWishlistItem, deleteWishlistItem } from "../../services/wishlist";
import { getWallets } from "../../services/wallet";
import { PageLayout } from "../layouts/PageLayout";
import { PageHeader } from "../headers/PageHeader";
import { ConfirmModal } from "../modals/ConfirmModal";
import { Alert } from "../ui/Alert";
import { useI18n } from "../../i18n/useI18n";
import { useProfileSettings } from "../../hooks/useProfileSettings";
import { formatCurrency } from "../../services/currency";

const defaultForm = { item: "", price: "", priorityScore: "3" };

export function WishlistScreen({ mainLogo }) {
  const { t, language } = useI18n();
  const tr = useCallback((en, id) => (language === "id-ID" ? id : en), [language]);
  const settings = useProfileSettings();
  
  const [wishlist, setWishlist] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [form, setForm] = useState(defaultForm);
  const [editingId, setEditingId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  const loadData = useCallback(async () => {
    try {
      const [wlData, wData] = await Promise.all([getWishlists(), getWallets()]);
      setWishlist(wlData?.wishlists || []);
      setWallets(wData || []);
    } catch (error) {
      console.error("Failed to load wishlist", error);
    }
  }, []);

  useEffect(() => { void loadData(); }, [loadData]);

  const currentBalance = wallets.reduce((sum, w) => sum + Number(w.balance || 0), 0);
  const totalWishlistAmount = wishlist.reduce((sum, item) => sum + Number(item.price || 0), 0);

  const onSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    if (!form.item || !form.price) {
      setErrorMessage(tr("Please fill all fields", "Isi semua bidang"));
      return;
    }
    
    setIsSaving(true);
    try {
      if (editingId) {
        await updateWishlistItem(editingId, form);
      } else {
        await createWishlistItem(form);
      }
      setForm(defaultForm);
      setEditingId(null);
      await loadData();
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const onEdit = (entry) => {
    setForm({ item: entry.item, price: entry.price, priorityScore: entry.priorityScore });
    setEditingId(entry.id);
  };

  const onDelete = (entry) => {
    setConfirmDialog({
      title: tr("Delete Item?", "Hapus Item?"),
      message: tr(`Are you sure you want to delete ${entry.item}?`, `Yakin ingin menghapus ${entry.item}?`),
      isDanger: true,
      onConfirm: async () => {
        await deleteWishlistItem(entry.id);
        await loadData();
        setConfirmDialog(null);
      }
    });
  };

  const onPurchase = (entry) => {
    setConfirmDialog({
      title: tr("Mark as Purchased?", "Tandai sebagai Dibeli?"),
      message: tr(`Have you bought ${entry.item}? It will be removed from your wishlist.`, `Sudah membeli ${entry.item}? Item akan dihapus dari wishlist.`),
      isDanger: false,
      onConfirm: async () => {
        await deleteWishlistItem(entry.id);
        await loadData();
        setConfirmDialog(null);
      }
    });
  };

  return (
    <>
      <PageLayout
        header={<PageHeader mainLogo={mainLogo} title={t("myWishlist", "My Wishlist")} backLink="/home" />}
        className="space-y-6 pt-5 lg:space-y-6"
      >
        <div className="max-w-4xl mx-auto space-y-6 pb-6">
          {errorMessage && <Alert type="error" onClose={() => setErrorMessage("")}>{errorMessage}</Alert>}
          <section className="grid grid-cols-2 gap-4">
            <article className="rounded-2xl border-2 border-[#1c1c13] bg-[#6366f1] p-5 md:p-6 text-white shadow-[4px_4px_0_#1c1c13]">
              <span className="material-symbols-outlined text-white">account_balance_wallet</span>
              <p className="mt-3 text-[10px] font-black uppercase tracking-wide text-indigo-200">
                {t("realBalance", "Real Balance")}
              </p>
              <p className="text-xl md:text-2xl font-black mt-1 truncate">{formatCurrency(currentBalance, language, settings.currency)}</p>
            </article>
            <article className="rounded-2xl border-2 border-[#1c1c13] bg-[#ffc329] p-5 md:p-6 text-[#1c1c13] shadow-[4px_4px_0_#1c1c13]">
              <span className="material-symbols-outlined text-[#1c1c13]">inventory_2</span>
              <p className="mt-3 text-[10px] font-black uppercase tracking-wide text-[#1c1c13]">
                {tr("Total Wishlist Amount", "Total Nominal Wishlist")}
              </p>
              <p className="text-xl md:text-2xl font-black text-[#1c1c13] mt-1 truncate">
                {formatCurrency(totalWishlistAmount, language, settings.currency)}
              </p>
            </article>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <section className="rounded-2xl border-2 border-[#1c1c13] bg-white p-6 shadow-[4px_4px_0_#1c1c13]">
                <h3 className="text-sm font-black uppercase tracking-wide text-[#1c1c13] mb-4">
                  {editingId ? t("editWishlistItem", "Edit Wishlist Item") : t("addWishlistItem", "Add Wishlist Item")}
                </h3>
                <form className="space-y-4" onSubmit={onSubmit}>
                  <div>
                    <label className="mb-2 block text-[10px] font-black uppercase text-[#1c1c13]">{tr("Item Name", "Nama Item")}</label>
                    <input
                      required
                      value={form.item}
                      onChange={e => setForm({ ...form, item: e.target.value })}
                      className="min-h-11 w-full rounded-lg border-2 border-[#1c1c13] bg-white px-3 text-sm font-bold shadow-[2px_2px_0_#1c1c13] outline-none focus:border-[#6366f1]"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-[10px] font-black uppercase text-[#1c1c13]">{tr("Price", "Harga")} ({settings.currency})</label>
                    <input
                      required
                      type="number"
                      min="0"
                      value={form.price}
                      onChange={e => setForm({ ...form, price: e.target.value })}
                      className="min-h-11 w-full rounded-lg border-2 border-[#1c1c13] bg-white px-3 text-sm font-bold shadow-[2px_2px_0_#1c1c13] outline-none focus:border-[#6366f1]"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-[10px] font-black uppercase text-[#1c1c13]">{tr("Priority", "Prioritas")}</label>
                    <select
                      value={form.priorityScore}
                      onChange={e => setForm({ ...form, priorityScore: e.target.value })}
                      className="min-h-11 w-full rounded-lg border-2 border-[#1c1c13] bg-white px-3 text-sm font-bold shadow-[2px_2px_0_#1c1c13] outline-none focus:border-[#6366f1]"
                    >
                      <option value="5">P5 (Highest)</option>
                      <option value="4">P4</option>
                      <option value="3">P3</option>
                      <option value="2">P2</option>
                      <option value="1">P1 (Lowest)</option>
                    </select>
                  </div>
                  <div className="flex gap-2 pt-2">
                    {editingId && (
                      <button
                        type="button"
                        onClick={() => { setEditingId(null); setForm(defaultForm); }}
                        className="flex-1 rounded-lg border-2 border-[#1c1c13] bg-white px-3 py-2 text-[11px] font-black uppercase text-[#1c1c13] shadow-[2px_2px_0_#1c1c13]"
                      >
                        {tr("Cancel", "Batal")}
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="flex-2 rounded-lg border-2 border-[#1c1c13] bg-[#6366f1] px-3 py-2 text-[11px] font-black uppercase text-white shadow-[2px_2px_0_#1c1c13]"
                    >
                      {isSaving ? "Saving..." : editingId ? "Update" : "Add"}
                    </button>
                  </div>
                </form>
              </section>
            </div>

            <div className="lg:col-span-2 space-y-4">
              {wishlist.length > 0 ? (
                [...wishlist].sort((a,b) => b.priorityScore - a.priorityScore).map((entry) => (
                  <article key={entry.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border-2 border-[#1c1c13] bg-white p-4 shadow-[4px_4px_0_#1c1c13]">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-black text-gray-900">{entry.item}</h3>
                        <span className="rounded bg-[#ffc329] px-2 py-0.5 text-[10px] font-black uppercase border-2 border-[#1c1c13]">
                          P{entry.priorityScore}
                        </span>
                      </div>
                      <p className="text-sm font-black text-[#6366f1]">
                        {formatCurrency(entry.price, language, settings.currency)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onPurchase(entry)}
                        className="flex-1 sm:flex-none rounded-lg border-2 border-[#1c1c13] bg-[#22c55e] px-4 py-2 text-[11px] font-black uppercase text-[#1c1c13] shadow-[2px_2px_0_#1c1c13] hover:-translate-y-0.5 active:translate-y-0 transition-all"
                      >
                        {tr("Buy", "Beli")}
                      </button>
                      <button
                        onClick={() => onEdit(entry)}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-[#1c1c13] bg-white text-[#1c1c13] shadow-[2px_2px_0_#1c1c13] hover:-translate-y-0.5 active:translate-y-0 transition-all"
                      >
                        <span className="material-symbols-outlined text-sm">edit</span>
                      </button>
                      <button
                        onClick={() => onDelete(entry)}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-[#1c1c13] bg-[#ef4444] text-white shadow-[2px_2px_0_#1c1c13] hover:-translate-y-0.5 active:translate-y-0 transition-all"
                      >
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </button>
                    </div>
                  </article>
                ))
              ) : (
                <div className="rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center text-sm font-bold text-gray-500">
                  {tr("Your wishlist is empty.", "Wishlist Anda masih kosong.")}
                </div>
              )}
            </div>
          </div>
        </div>
      </PageLayout>
      <ConfirmModal
        isOpen={!!confirmDialog}
        onClose={() => setConfirmDialog(null)}
        onConfirm={confirmDialog?.onConfirm}
        title={confirmDialog?.title}
        message={confirmDialog?.message}
        confirmText={tr("Yes", "Ya")}
        cancelText={tr("Cancel", "Batal")}
        isDanger={confirmDialog?.isDanger}
      />
    </>
  );
}

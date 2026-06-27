import { useState } from "react";
import { createWallet, updateWallet, deleteWallet } from "../../services/wallet";
import { useI18n } from "../../i18n/useI18n";
import { Button } from "../ui/Button";
import { ConfirmModal } from "./ConfirmModal";

export function ManageWalletModal({ onClose, onSuccess, wallets }) {
  const { language } = useI18n();
  const tr = (en, id) => (language === "id-ID" ? id : en);

  const [activeTab, setActiveTab] = useState("ADD"); // "ADD" or "EDIT"
  const [selectedWalletId, setSelectedWalletId] = useState("");
  
  const [walletForm, setWalletForm] = useState({
    name: "",
    type: "CASH",
    balance: 0
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSelectWallet = (e) => {
    const id = Number(e.target.value);
    setSelectedWalletId(id);
    const wallet = wallets.find((w) => w.id === id);
    if (wallet) {
      setWalletForm({
        name: wallet.name,
        type: wallet.type,
        balance: wallet.balance
      });
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setWalletForm((prev) => ({
      ...prev,
      [name]: name === "balance" ? Number(value) : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!walletForm.name.trim()) {
      setErrorMessage(tr("Wallet name is required", "Nama dompet wajib diisi"));
      return;
    }

    setIsSubmitting(true);
    try {
      if (activeTab === "ADD") {
        await createWallet(walletForm);
      } else {
        if (!selectedWalletId) throw new Error(tr("Please select a wallet", "Silakan pilih dompet"));
        await updateWallet(selectedWalletId, walletForm);
      }
      
      if (onSuccess) await onSuccess();
      onClose();
    } catch (error) {
      setErrorMessage(error.message || tr("Failed to save wallet", "Gagal menyimpan dompet"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = () => {
    if (!selectedWalletId) return;
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    setShowDeleteConfirm(false);
    setIsSubmitting(true);
    try {
      await deleteWallet(selectedWalletId);
      if (onSuccess) await onSuccess();
      onClose();
    } catch (error) {
      setErrorMessage(error.message || tr("Failed to delete wallet", "Gagal menghapus dompet"));
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm sm:p-6">
      <div className="flex max-h-full w-full max-w-lg flex-col overflow-hidden rounded-3xl border-2 border-[#1c1c13] bg-[#fffbeb] shadow-[8px_8px_0_#1c1c13] transition-all">
        <header className="flex items-center justify-between border-b-2 border-[#1c1c13] bg-[#ffc329] px-6 py-4">
          <h2 className="text-lg font-black uppercase tracking-tight text-[#1c1c13]">
            {tr("Manage Wallets", "Kelola Dompet")}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#1c1c13] bg-white transition-transform hover:scale-110 active:scale-95"
          >
            <span className="material-symbols-outlined text-[20px] font-bold text-[#1c1c13]">close</span>
          </button>
        </header>

        <div className="overflow-y-auto p-6 flex-1">
          {errorMessage && (
            <div className="mb-6 rounded-xl border-2 border-red-600 bg-red-50 p-4 shadow-[4px_4px_0_#dc2626]">
              <p className="text-sm font-bold text-red-600">{errorMessage}</p>
            </div>
          )}

          <div className="mb-6 flex gap-2 rounded-xl border-2 border-[#1c1c13] bg-white p-1 shadow-[2px_2px_0_#1c1c13]">
            <button
              onClick={() => {
                setActiveTab("ADD");
                setWalletForm({ name: "", type: "CASH", balance: 0 });
              }}
              className={`flex-1 rounded-lg py-2.5 text-[11px] font-black uppercase transition-all ${
                activeTab === "ADD"
                  ? "bg-[#6366f1] text-white border-2 border-[#1c1c13] shadow-[2px_2px_0_#1c1c13]"
                  : "bg-transparent text-[#1c1c13] hover:bg-gray-50 border-2 border-transparent"
              }`}
            >
              {tr("Add Wallet", "Tambah Dompet")}
            </button>
            <button
              onClick={() => {
                setActiveTab("EDIT");
                if (wallets.length > 0) {
                  const w = wallets[0];
                  setSelectedWalletId(w.id);
                  setWalletForm({ name: w.name, type: w.type, balance: w.balance });
                }
              }}
              className={`flex-1 rounded-lg py-2.5 text-[11px] font-black uppercase transition-all ${
                activeTab === "EDIT"
                  ? "bg-[#fbbf24] text-[#1c1c13] border-2 border-[#1c1c13] shadow-[2px_2px_0_#1c1c13]"
                  : "bg-transparent text-[#1c1c13] hover:bg-gray-50 border-2 border-transparent"
              }`}
            >
              {tr("Edit / Delete", "Ubah / Hapus")}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {activeTab === "EDIT" && (
              <div>
                <label className="mb-2 block text-[10px] font-black uppercase text-[#1c1c13]">
                  {tr("Select Wallet", "Pilih Dompet")}
                </label>
                <select
                  value={selectedWalletId}
                  onChange={handleSelectWallet}
                  className="min-h-12 w-full rounded-lg border-2 border-[#1c1c13] bg-white px-4 font-bold text-[#1c1c13] shadow-[2px_2px_0_#1c1c13] outline-none"
                >
                  {wallets.length === 0 && <option value="">{tr("No wallets", "Belum ada dompet")}</option>}
                  {wallets.map(w => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="mb-2 block text-[10px] font-black uppercase text-[#1c1c13]">
                {tr("Wallet Name", "Nama Dompet")}
              </label>
              <input
                type="text"
                name="name"
                value={walletForm.name}
                onChange={handleFormChange}
                placeholder={tr("e.g. My Bank Account", "misal: BCA Saya")}
                className="min-h-12 w-full rounded-lg border-2 border-[#1c1c13] bg-white px-4 font-bold text-[#1c1c13] shadow-[2px_2px_0_#1c1c13] outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-[10px] font-black uppercase text-[#1c1c13]">
                {tr("Wallet Type", "Tipe Dompet")}
              </label>
              <select
                name="type"
                value={walletForm.type}
                onChange={handleFormChange}
                className="min-h-12 w-full rounded-lg border-2 border-[#1c1c13] bg-white px-4 font-bold text-[#1c1c13] shadow-[2px_2px_0_#1c1c13] outline-none"
              >
                <option value="CASH">Cash (Tunai)</option>
                <option value="BANK">Bank</option>
                <option value="EWALLET">E-Wallet</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-[10px] font-black uppercase text-[#1c1c13]">
                {tr("Current Balance", "Saldo Saat Ini")}
              </label>
              <input
                type="number"
                name="balance"
                value={walletForm.balance}
                onChange={handleFormChange}
                className="min-h-12 w-full rounded-lg border-2 border-[#1c1c13] bg-white px-4 font-bold text-[#1c1c13] shadow-[2px_2px_0_#1c1c13] outline-none"
              />
            </div>
            
            <div className="pt-4 flex gap-3">
              <Button type="submit" variant="accent" fullWidth disabled={isSubmitting || (activeTab === "EDIT" && wallets.length === 0)}>
                {isSubmitting ? tr("Saving...", "Menyimpan...") : tr("Save Wallet", "Simpan Dompet")}
              </Button>

              {activeTab === "EDIT" && (
                <Button type="button" variant="outline" className="border-red-500 text-red-500 hover:bg-red-50 hover:text-red-600" onClick={handleDelete} disabled={isSubmitting || wallets.length === 0}>
                  {tr("Delete", "Hapus")}
                </Button>
              )}
            </div>
          </form>
        </div>
      </div>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDelete}
        title={tr("Delete Wallet", "Hapus Dompet")}
        message={tr(
          "Are you sure you want to delete this wallet? All transactions inside will have no wallet reference.",
          "Apakah Anda yakin ingin menghapus dompet ini? Transaksi terkait akan kehilangan referensi dompet."
        )}
        confirmText={tr("Delete", "Hapus")}
        cancelText={tr("Cancel", "Batal")}
        isDanger={true}
      />
    </div>
  );
}

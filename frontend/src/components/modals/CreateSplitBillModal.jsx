import { useCallback, useEffect, useState } from "react";
import { createSplitBill, updateSplitBill } from "../../services/splitBill";
import { getWallets } from "../../services/wallet";
import { useI18n } from "../../i18n/useI18n";
import { useProfileSettings } from "../../hooks/useProfileSettings";
import { convertFromIdr, convertToIdr, formatCurrencyValue } from "../../services/currency";
import { ManageWalletModal } from "./ManageWalletModal";

function parseFriends(raw) {
  return raw
    .split("\n")
    .map((name) => name.trim())
    .filter(Boolean);
}

function allocateMembers(totalAmount, friendNames) {
  const count = friendNames.length;
  const baseAmount = Math.floor(totalAmount / count);
  let remainder = totalAmount % count;

  return friendNames.map((friendName) => {
    const amount = baseAmount + (remainder > 0 ? 1 : 0);
    if (remainder > 0) remainder -= 1;

    return {
      friendName,
      amount,
    };
  });
}

function toInputAmount(value, currency) {
  const converted = convertFromIdr(value, currency);
  return Number.isInteger(converted) ? String(converted) : converted.toFixed(2);
}

function getDefaultSplitBillForm(initialValues = {}, currency = "IDR") {
  return {
    title: initialValues.title || "",
    description: initialValues.description || "",
    totalAmount: initialValues.totalAmount
      ? toInputAmount(initialValues.totalAmount, currency)
      : "",
    friends: initialValues.members
      ? initialValues.members.map((member) => member.friendName).join("\n")
      : "",
    syncToPersonal: initialValues.syncToPersonal ?? true,
    walletId: initialValues.transaction?.walletId || "",
  };
}

export function CreateSplitBillModal({
  onClose,
  onSuccess,
  initialValues = null,
  splitBillId = null,
}) {
  const { t, language } = useI18n();
  const settings = useProfileSettings();
  const tr = useCallback(
    (en, id) => (language === "id-ID" ? id : en),
    [language],
  );

  const isEditingSplit = Boolean(splitBillId);

  const [splitForm, setSplitForm] = useState(() =>
    getDefaultSplitBillForm(initialValues || {}, settings.currency),
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [wallets, setWallets] = useState([]);

  useEffect(() => {
    const fetchWallets = async () => {
      try {
        const data = await getWallets();
        setWallets(data);
        if (data.length > 0 && !initialValues?.transaction?.walletId) {
          setSplitForm((prev) => ({ ...prev, walletId: data[0].id }));
        }
      } catch (error) {
        console.error("Failed to fetch wallets:", error);
      }
    };
    void fetchWallets();
  }, [initialValues]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !isSubmitting) {
        onClose?.();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isSubmitting, onClose]);

  const onSplitChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    if (name === "walletId" && value === "NEW") {
      setShowWalletModal(true);
      return;
    }
    setSplitForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : (name === "walletId" ? Number(value) : value),
    }));
  }, []);

  const onSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setErrorMessage("");
      setSuccessMessage("");
      setIsSubmitting(true);

      const parsedTotal = Number(splitForm.totalAmount);
      const friendNames = parseFriends(splitForm.friends);

      if (
        !splitForm.title.trim() ||
        !Number.isFinite(parsedTotal) ||
        parsedTotal <= 0 ||
        friendNames.length === 0
      ) {
        setErrorMessage(
          tr(
            "Complete title, total amount, and friends list.",
            "Lengkapi judul, total tagihan, dan daftar teman."
          )
        );
        setIsSubmitting(false);
        return;
      }

      const totalAmount = convertToIdr(parsedTotal, settings.currency);
      const members = allocateMembers(totalAmount, friendNames);

      const payload = {
        title: splitForm.title.trim(),
        description: splitForm.description,
        totalAmount,
        members,
        syncToPersonal: splitForm.syncToPersonal,
        walletId: splitForm.syncToPersonal ? Number(splitForm.walletId) : undefined,
      };

      try {
        let savedData;
        if (isEditingSplit && splitBillId) {
          const result = await updateSplitBill(splitBillId, payload);
          savedData = result?.splitBill || null;
        } else {
          const result = await createSplitBill(payload);
          savedData = result?.splitBill || null;
        }

        setSuccessMessage(
          isEditingSplit
            ? t("splitBillUpdatedSuccessfully", "Split Bill updated successfully!")
            : t("splitBillCreatedSuccessfully", "Split Bill created successfully!"),
        );

        if (!savedData) return;

        setTimeout(async () => {
          try {
            await onSuccess?.(savedData);
          } finally {
            onClose?.();
          }
        }, 850);
      } catch (error) {
        setErrorMessage(
          error.message || t("failedToSave", "Failed to save data")
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [isEditingSplit, splitBillId, splitForm, settings.currency, t, tr, onClose, onSuccess]
  );

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-[#1c1c13]/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="fixed inset-x-4 bottom-4 top-4 z-50 flex items-center justify-center lg:inset-0 lg:p-4">
        <div className="relative flex h-full max-h-[85vh] w-full flex-col rounded-2xl border-4 border-[#1c1c13] bg-[#fffbeb] shadow-[8px_8px_0_#1c1c13] lg:max-h-[90vh] lg:max-w-2xl">
          {/* Header */}
          <div className="flex shrink-0 items-center justify-between border-b-4 border-[#1c1c13] p-4 lg:p-6 bg-white rounded-t-[12px]">
            <h2 className="text-xl font-black uppercase tracking-tight text-[#1c1c13] lg:text-2xl">
              {isEditingSplit
                ? t("editSplitBill", "Edit Split Bill")
                : tr("Create Split Bill", "Buat Tagihan Baru")}
            </h2>
            <button
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-[#1c1c13] bg-[#ffc329] text-[#1c1c13] shadow-[2px_2px_0_#1c1c13] hover:-translate-y-0.5 active:translate-y-0 transition-all"
            >
              <span className="material-symbols-outlined font-black">close</span>
            </button>
          </div>

          {/* Messages */}
          {(errorMessage || successMessage) && (
            <div className="shrink-0 p-4 pb-0 lg:p-6 lg:pb-0">
              {errorMessage && (
                <div className="rounded-xl border-2 border-[#1c1c13] bg-[#fef2f2] p-4 shadow-[4px_4px_0_#ef4444]">
                  <p className="text-sm font-bold text-[#ef4444]">{errorMessage}</p>
                </div>
              )}
              {successMessage && (
                <div className="rounded-xl border-2 border-[#1c1c13] bg-[#f0fdf4] p-4 shadow-[4px_4px_0_#22c55e]">
                  <p className="text-sm font-bold text-[#22c55e]">{successMessage}</p>
                </div>
              )}
            </div>
          )}

          {/* Form */}
          <div className="flex-1 overflow-y-auto p-4 lg:p-6">
            <form onSubmit={onSubmit} className="space-y-6">
              <div className="rounded-xl border-2 border-[#1c1c13] bg-white p-5 shadow-[4px_4px_0_#1c1c13]">
                <div className="mb-4">
                  <label className="mb-2 block text-[11px] font-black uppercase tracking-wide text-[#1c1c13]">
                    {tr("Title", "Judul Tagihan")}
                  </label>
                  <input
                    name="title"
                    value={splitForm.title}
                    onChange={onSplitChange}
                    placeholder={tr("Example: Dinner with classmates", "Contoh: Makan bareng kelas")}
                    className="min-h-12 w-full rounded-lg border-2 border-[#1c1c13] bg-white px-4 font-bold text-[#1c1c13] shadow-[2px_2px_0_#1c1c13] outline-none focus:border-[#6366f1] transition-all"
                  />
                </div>

                <div className="mb-4">
                  <label className="mb-2 block text-[11px] font-black uppercase tracking-wide text-[#1c1c13]">
                    {tr("Total Amount", "Total Nominal")} ({settings.currency})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    name="totalAmount"
                    value={splitForm.totalAmount}
                    onChange={onSplitChange}
                    placeholder="0"
                    className="min-h-12 w-full rounded-lg border-2 border-[#1c1c13] bg-white px-4 font-bold text-[#1c1c13] shadow-[2px_2px_0_#1c1c13] outline-none focus:border-[#6366f1] transition-all"
                  />
                </div>

                <div className="mb-4">
                  <label className="mb-2 block text-[11px] font-black uppercase tracking-wide text-[#1c1c13]">
                    {tr("Friends", "Teman")} (1 per {tr("line", "baris")})
                  </label>
                  <textarea
                    name="friends"
                    value={splitForm.friends}
                    onChange={onSplitChange}
                    placeholder={tr("Andi\nBudi\nCitra", "Andi\nBudi\nCitra")}
                    rows={4}
                    className="w-full resize-y rounded-lg border-2 border-[#1c1c13] bg-white p-4 font-bold text-[#1c1c13] shadow-[2px_2px_0_#1c1c13] outline-none focus:border-[#6366f1] transition-all"
                  />
                </div>

                <div className="mb-4">
                  <label className="mb-2 block text-[11px] font-black uppercase tracking-wide text-[#1c1c13]">
                    {t("note", "Note (Optional)")}
                  </label>
                  <textarea
                    name="description"
                    value={splitForm.description}
                    onChange={onSplitChange}
                    placeholder={tr("Dinner after midterms", "Makan malam habis UTS")}
                    className="min-h-12 w-full rounded-lg border-2 border-[#1c1c13] bg-white px-4 py-3 font-bold text-[#1c1c13] shadow-[2px_2px_0_#1c1c13] outline-none focus:border-[#6366f1] transition-all"
                  />
                </div>

                <div className="flex items-center gap-3 mt-4">
                  <input
                    type="checkbox"
                    id="syncToPersonal"
                    name="syncToPersonal"
                    checked={splitForm.syncToPersonal}
                    onChange={onSplitChange}
                    className="h-5 w-5 rounded border-2 border-[#1c1c13] accent-[#6366f1] shadow-[2px_2px_0_#1c1c13]"
                  />
                  <label htmlFor="syncToPersonal" className="text-sm font-bold text-[#1c1c13]">
                    {tr(
                      "Add my share as personal expense",
                      "Tambahkan porsi saya ke pengeluaran personal"
                    )}
                  </label>
                </div>

                {splitForm.syncToPersonal && (
                  <div className="mt-4 pt-4 border-t-2 border-dashed border-gray-300">
                    <label className="mb-2 block text-[11px] font-black uppercase tracking-wide text-[#1c1c13]">
                      {tr("Deduct from Wallet", "Potong dari Dompet")}
                    </label>
                    <select
                      name="walletId"
                      value={splitForm.walletId}
                      onChange={onSplitChange}
                      className="min-h-12 w-full rounded-lg border-2 border-[#1c1c13] bg-white px-4 font-bold text-[#1c1c13] shadow-[2px_2px_0_#1c1c13] outline-none focus:border-[#6366f1] transition-all"
                    >
                      <option value="" disabled>
                        {tr("Select Wallet", "Pilih Dompet")}
                      </option>
                      {wallets.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name} ({formatCurrencyValue(w.balance, language, settings.currency)})
                        </option>
                      ))}
                      <option value="NEW">+ {tr("Add New Wallet", "Tambah Dompet Baru")}</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="min-h-12 w-full rounded-lg border-2 border-[#1c1c13] bg-white px-4 font-black text-[#1c1c13] shadow-[2px_2px_0_#1c1c13] hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:translate-y-0 disabled:shadow-none"
                >
                  {t("cancel", "Cancel")}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="min-h-12 w-full rounded-lg border-2 border-[#1c1c13] bg-[#6366f1] px-4 font-black text-white shadow-[2px_2px_0_#1c1c13] hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:translate-y-0 disabled:shadow-none"
                >
                  {isSubmitting ? t("saving", "Saving...") : t("save", "Save")}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {showWalletModal && (
        <ManageWalletModal
          onClose={() => setShowWalletModal(false)}
          onSuccess={(wallet) => {
            setShowWalletModal(false);
            const fetchWallets = async () => {
              const data = await getWallets();
              setWallets(data);
            };
            fetchWallets();
            setSplitForm((prev) => ({ ...prev, walletId: wallet.id }));
          }}
          wallets={wallets}
        />
      )}
    </>
  );
}

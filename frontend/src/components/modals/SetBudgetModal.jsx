import { useCallback, useState } from "react";
import { setBudget } from "../../services/budget";
import { useI18n } from "../../i18n/useI18n";
import { useProfileSettings } from "../../hooks/useProfileSettings";

const CATEGORIES = [
  "FOOD",
  "TRANSPORT",
  "EDUCATION",
  "ENTERTAINMENT",
  "UTILITIES",
  "OTHER",
];

const CATEGORY_LABELS = {
  FOOD: "🍕 Food",
  TRANSPORT: "🚗 Transport",
  EDUCATION: "📚 Education",
  ENTERTAINMENT: "🎬 Entertainment",
  UTILITIES: "💡 Utilities",
  OTHER: "📌 Other",
};

export function SetBudgetModal({ onClose, onSuccess, initialCategory = "FOOD", currentAmount = "" }) {
  const { t, language } = useI18n();
  const settings = useProfileSettings();
  const tr = useCallback((en, id) => (language === "id-ID" ? id : en), [language]);

  const [category, setCategory] = useState(initialCategory);
  const [amount, setAmount] = useState(currentAmount);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    const parsedAmount = Number(amount);
    if (!category || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setErrorMessage(tr("Please enter a valid amount.", "Silakan masukkan nominal yang valid."));
      return;
    }

    setIsSubmitting(true);
    try {
      const currentDate = new Date();
      await setBudget({
        category,
        amount: parsedAmount,
        month: currentDate.getMonth() + 1,
        year: currentDate.getFullYear()
      });
      await onSuccess?.();
      onClose();
    } catch (error) {
      setErrorMessage(error.message || tr("Failed to save budget", "Gagal menyimpan anggaran"));
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-[#1c1c13]/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-x-4 bottom-4 top-4 z-50 flex items-center justify-center lg:inset-0 lg:p-4">
        <div className="relative flex w-full flex-col rounded-2xl border-4 border-[#1c1c13] bg-[#fffbeb] shadow-[8px_8px_0_#1c1c13] lg:max-w-md">
          <div className="flex items-center justify-between border-b-4 border-[#1c1c13] p-4 bg-white rounded-t-xl">
            <h2 className="text-xl font-black uppercase tracking-tight text-[#1c1c13]">
              {tr("Set Budget", "Atur Anggaran")}
            </h2>
            <button
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-[#1c1c13] bg-[#ffc329] text-[#1c1c13] shadow-[2px_2px_0_#1c1c13] hover:-translate-y-0.5 active:translate-y-0 transition-all"
            >
              <span className="material-symbols-outlined font-black">close</span>
            </button>
          </div>

          <div className="p-4 sm:p-6">
            {errorMessage && (
              <div className="mb-4 rounded-lg border-2 border-[#1c1c13] bg-[#fef2f2] p-4 shadow-[4px_4px_0_#ef4444]">
                <p className="text-sm font-bold text-[#ef4444]">{errorMessage}</p>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-2 block text-[11px] font-black uppercase tracking-wide text-[#1c1c13]">
                  {tr("Category", "Kategori")}
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="min-h-12 w-full rounded-lg border-2 border-[#1c1c13] bg-white px-4 font-bold text-[#1c1c13] shadow-[2px_2px_0_#1c1c13] outline-none focus:border-[#6366f1] transition-all"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {CATEGORY_LABELS[cat] || cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-[11px] font-black uppercase tracking-wide text-[#1c1c13]">
                  {tr("Monthly Budget Limit", "Batas Anggaran Bulanan")} ({settings.currency})
                </label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  className="min-h-12 w-full rounded-lg border-2 border-[#1c1c13] bg-white px-4 font-bold text-[#1c1c13] shadow-[2px_2px_0_#1c1c13] outline-none focus:border-[#6366f1] transition-all"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="min-h-12 w-full rounded-lg border-2 border-[#1c1c13] bg-white px-4 font-black text-[#1c1c13] shadow-[2px_2px_0_#1c1c13] hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50"
                >
                  {t("cancel", "Cancel")}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="min-h-12 w-full rounded-lg border-2 border-[#1c1c13] bg-[#6366f1] px-4 font-black text-white shadow-[2px_2px_0_#1c1c13] hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? t("saving", "Saving...") : t("save", "Save")}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

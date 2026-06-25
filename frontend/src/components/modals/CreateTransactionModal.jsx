import { useCallback, useEffect, useState } from "react";
import { createTransaction, updateTransaction } from "../../services/transaction";
import { createSplitBill, updateSplitBill } from "../../services/splitBill";
import { useI18n } from "../../i18n/useI18n";
import { useProfileSettings } from "../../hooks/useProfileSettings";
import {
  convertFromIdr,
  convertToIdr,
  formatCurrencyValue,
} from "../../services/currency";

const DEFAULT_TYPE = "EXPENSE";
const DEFAULT_CATEGORY = "FOOD";
const MAX_RECEIPT_SIZE_BYTES = 1.5 * 1024 * 1024;

const TRANSACTION_TYPES = ["EXPENSE", "INCOME"];

const CATEGORIES = {
  EXPENSE: [
    "FOOD",
    "TRANSPORT",
    "EDUCATION",
    "ENTERTAINMENT",
    "UTILITIES",
    "OTHER",
  ],
  INCOME: ["SALARY", "ALLOWANCE", "FREELANCE", "INVESTMENT", "GIFT", "OTHER"],
};

const CATEGORY_LABELS = {
  FOOD: "🍕 Food",
  TRANSPORT: "🚗 Transport",
  EDUCATION: "📚 Education",
  ENTERTAINMENT: "🎬 Entertainment",
  UTILITIES: "💡 Utilities",
  SALARY: "💼 Salary",
  ALLOWANCE: "💳 Allowance",
  FREELANCE: "💻 Freelance",
  INVESTMENT: "📈 Investment",
  GIFT: "🎁 Gift",
  OTHER: "📌 Other",
};

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

function getDefaultTransactionForm(initialValues = {}, currency = "IDR") {
  const getLocalDatetime = (dateVal) => {
    const d = dateVal ? new Date(dateVal) : new Date();
    const tzOffset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
  };
  
  const sourceDate = getLocalDatetime(initialValues.date || initialValues.createdAt);

  return {
    type: initialValues.type || DEFAULT_TYPE,
    category: initialValues.category || DEFAULT_CATEGORY,
    amount: initialValues.amount ? toInputAmount(initialValues.amount, currency) : "",
    note: initialValues.note || initialValues.description || "",
    date: sourceDate,
    receiptImage: initialValues.receiptImage || "",
    receiptImageName: initialValues.receiptImageName || "",
  };
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
  };
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      resolve(typeof reader.result === "string" ? reader.result : "");
    };

    reader.onerror = () => {
      reject(new Error("Failed to read receipt image"));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * CreateTransactionModal - Dialog for creating or updating transactions & split bills
 */
export function CreateTransactionModal({
  onClose,
  onSuccess,
  initialMode = "PERSONAL", // "PERSONAL" or "SPLIT_BILL"
  initialValues = null,
  transactionId = null,
  splitBillId = null,
}) {
  const { t, language } = useI18n();
  const settings = useProfileSettings();
  const tr = useCallback(
    (en, id) => (language === "id-ID" ? id : en),
    [language],
  );
  const formatAmount = useCallback(
    (value) => formatCurrencyValue(value, language, settings.currency),
    [language, settings.currency],
  );

  const isEditingTx = Boolean(transactionId);
  const isEditingSplit = Boolean(splitBillId);
  const isEditing = isEditingTx || isEditingSplit;

  const [activeTab, setActiveTab] = useState(
    isEditingSplit ? "SPLIT_BILL" : isEditingTx ? "PERSONAL" : initialMode
  );

  const [txForm, setTxForm] = useState(() =>
    getDefaultTransactionForm(initialValues || {}, settings.currency),
  );
  const [splitForm, setSplitForm] = useState(() =>
    getDefaultSplitBillForm(initialValues || {}, settings.currency),
  );
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReadingImage, setIsReadingImage] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (activeTab === "PERSONAL") {
      setTxForm(getDefaultTransactionForm(initialValues || {}, settings.currency));
    } else {
      setSplitForm(getDefaultSplitBillForm(initialValues || {}, settings.currency));
    }
  }, [initialValues, activeTab, settings.currency]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !isSubmitting && !isReadingImage) {
        onClose?.();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isReadingImage, isSubmitting, onClose]);

  const onTxChange = useCallback((e) => {
    const { name, value } = e.target;
    setTxForm((prev) => {
      const updated = { ...prev, [name]: value };
      // Reset category if type changed
      if (name === "type" && !CATEGORIES[value].includes(prev.category)) {
        updated.category = CATEGORIES[value][0];
      }
      return updated;
    });
  }, []);

  const onSplitChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setSplitForm((prev) => ({ 
      ...prev, 
      [name]: type === "checkbox" ? checked : value 
    }));
  }, []);

  const onReceiptChange = useCallback(
    async (event) => {
      const file = event.target.files?.[0];

      if (!file) {
        setTxForm((prev) => ({
          ...prev,
          receiptImage: "",
          receiptImageName: "",
        }));
        return;
      }

      if (!file.type.startsWith("image/")) {
        setErrorMessage(
          t("receiptImageMustBeImage", "Receipt file must be an image"),
        );
        event.target.value = "";
        return;
      }

      if (file.size > MAX_RECEIPT_SIZE_BYTES) {
        setErrorMessage(
          t("receiptImageTooLarge", "Receipt image must be 1.5MB or smaller"),
        );
        event.target.value = "";
        return;
      }

      setErrorMessage("");
      setIsReadingImage(true);

      try {
        const dataUrl = await fileToDataUrl(file);
        setTxForm((prev) => ({
          ...prev,
          receiptImage: dataUrl,
          receiptImageName: file.name,
        }));
      } catch (error) {
        setErrorMessage(
          error.message ||
            t("failedToReadReceiptImage", "Failed to read receipt image"),
        );
        event.target.value = "";
      } finally {
        setIsReadingImage(false);
      }
    },
    [t],
  );

  const clearReceipt = useCallback(() => {
    setTxForm((prev) => ({
      ...prev,
      receiptImage: "",
      receiptImageName: "",
    }));
  }, []);

  const submitPersonal = useCallback(async () => {
    const amount = Number(txForm.amount);

    if (Number.isNaN(amount) || amount <= 0) {
      setErrorMessage(
        t("pleaseEnterValidAmount", "Please enter a valid amount"),
      );
      return;
    }

    const payload = {
      type: txForm.type,
      category: txForm.category,
      amount: convertToIdr(amount, settings.currency),
      note: txForm.note.trim(),
      createdAt: txForm.date ? new Date(txForm.date).toISOString() : undefined,
      receiptImage: txForm.receiptImage || "",
      receiptImageName: txForm.receiptImageName || "",
    };

    let savedData;
    if (isEditingTx && transactionId) {
      const result = await updateTransaction(transactionId, payload);
      savedData = result?.transaction || null;
    } else {
      const result = await createTransaction(payload);
      savedData = result?.transaction || null;
    }

    setSuccessMessage(
      isEditingTx
        ? t("transactionUpdatedSuccessfully", "Transaction updated successfully!")
        : t("transactionCreatedSuccessfully", "Transaction created successfully!"),
    );

    return savedData;
  }, [isEditingTx, settings.currency, t, transactionId, txForm]);

  const submitSplitBill = useCallback(async () => {
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
    };

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

    return savedData;
  }, [isEditingSplit, settings.currency, splitBillId, splitForm, t, tr]);

  const onSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setErrorMessage("");
      setSuccessMessage("");
      setIsSubmitting(true);

      try {
        let savedData = null;
        if (activeTab === "PERSONAL") {
          savedData = await submitPersonal();
        } else {
          savedData = await submitSplitBill();
        }

        if (!savedData) return; // Errored inside

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
    [activeTab, onClose, onSuccess, submitPersonal, submitSplitBill, t],
  );

  const dialogTitle = isEditing
    ? (activeTab === "PERSONAL" ? t("editTransaction", "Edit Transaction") : t("editSplitBill", "Edit Split Bill"))
    : (activeTab === "PERSONAL" ? t("addTransactionModalTitle", "Add Transaction") : t("newSplitBill", "New Split Bill"));

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 px-3 py-3 backdrop-blur-[2px] lg:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="transaction-dialog-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose?.();
        }
      }}
    >
      <div className="w-full max-w-2xl overflow-hidden rounded-xl border-2 border-[#1c1c13] bg-white shadow-[8px_8px_0_#1c1c13]">
        <div className="max-h-[90svh] overflow-y-auto p-4 sm:p-6">
          <form onSubmit={onSubmit} className="space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b-2 border-[#1c1c13] pb-4">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#1c1c13]">
                  {isEditing ? t("edit", "Edit") : t("add", "Add")}
                </p>
                <h3
                  id="transaction-dialog-title"
                  className="text-2xl font-black tracking-tight text-[#1c1c13] mt-1"
                >
                  {dialogTitle}
                </h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border-2 border-[#1c1c13] bg-white text-[#1c1c13] shadow-[2px_2px_0_#1c1c13] hover:-translate-y-0.5 active:translate-y-0 transition-all"
                aria-label={t("close", "Close")}
              >
                <span className="material-symbols-outlined text-base font-black">
                  close
                </span>
              </button>
            </div>

            {/* Error & Success Message */}
            {errorMessage && (
              <div className="rounded-lg border-2 border-[#1c1c13] bg-[#ef4444] text-white p-3 text-sm font-black shadow-[2px_2px_0_#1c1c13]">
                {errorMessage}
              </div>
            )}
            {successMessage && (
              <div className="rounded-lg border-2 border-[#1c1c13] bg-[#22c55e] text-[#1c1c13] p-3 text-sm font-black shadow-[2px_2px_0_#1c1c13]">
                {successMessage}
              </div>
            )}

            {/* Tab Switcher - Only show if not editing, or if we really want them to switch (usually locked in edit) */}
            {!isEditing && (
              <div className="flex gap-2 rounded-xl border-2 border-[#1c1c13] bg-[#fffbeb] p-1 shadow-[2px_2px_0_#1c1c13]">
                <button
                  type="button"
                  onClick={() => setActiveTab("PERSONAL")}
                  className={`flex-1 rounded-lg py-2 text-xs font-black uppercase transition-all ${
                    activeTab === "PERSONAL"
                      ? "bg-[#6366f1] text-white border-2 border-[#1c1c13] shadow-[2px_2px_0_#1c1c13]"
                      : "bg-transparent text-[#1c1c13] border-2 border-transparent hover:border-[#1c1c13]"
                  }`}
                >
                  {t("personal", "Personal")}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("SPLIT_BILL")}
                  className={`flex-1 rounded-lg py-2 text-xs font-black uppercase transition-all ${
                    activeTab === "SPLIT_BILL"
                      ? "bg-[#6366f1] text-white border-2 border-[#1c1c13] shadow-[2px_2px_0_#1c1c13]"
                      : "bg-transparent text-[#1c1c13] border-2 border-transparent hover:border-[#1c1c13]"
                  }`}
                >
                  {t("splitBill", "Split Bill")}
                </button>
              </div>
            )}

            {activeTab === "PERSONAL" ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Type Selection */}
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-[10px] font-black uppercase text-[#1c1c13]">
                    {t("type", "Type")}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {TRANSACTION_TYPES.map((type) => (
                      <label
                        key={type}
                        className={`flex min-h-[3rem] cursor-pointer items-center justify-center gap-2 rounded-lg border-2 transition-all ${
                          txForm.type === type 
                            ? "border-[#1c1c13] bg-[#6366f1] text-white shadow-[2px_2px_0_#1c1c13]" 
                            : "border-[#1c1c13] bg-white text-[#1c1c13] shadow-[2px_2px_0_#1c1c13] hover:-translate-y-0.5 active:translate-y-0"
                        }`}
                      >
                        <input
                          type="radio"
                          name="type"
                          value={type}
                          checked={txForm.type === type}
                          onChange={onTxChange}
                          className="hidden"
                        />
                        <span className="text-sm font-black">
                          {type === "INCOME"
                            ? t("income", "Income")
                            : t("expense", "Expense")}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Category Selection */}
                <div>
                  <label
                    htmlFor="category"
                    className="mb-2 block text-[10px] font-black uppercase text-[#1c1c13]"
                  >
                    {t("category", "Category")}
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={txForm.category}
                    onChange={onTxChange}
                    className="min-h-[3rem] w-full rounded-lg border-2 border-[#1c1c13] bg-white px-4 font-bold text-[#1c1c13] shadow-[2px_2px_0_#1c1c13] outline-none focus:border-[#6366f1] transition-all"
                  >
                    {CATEGORIES[txForm.type].map((cat) => (
                      <option key={cat} value={cat}>
                        {CATEGORY_LABELS[cat]}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Amount */}
                <div>
                  <label
                    htmlFor="amount"
                    className="mb-2 block text-[10px] font-black uppercase text-[#1c1c13]"
                  >
                    {t("amount", "Amount")} ({settings.currency})
                  </label>
                  <input
                    id="amount"
                    type="number"
                    step="any"
                    name="amount"
                    value={txForm.amount}
                    onChange={onTxChange}
                    placeholder="0"
                    min="0"
                    inputMode="numeric"
                    className="min-h-[3rem] w-full rounded-lg border-2 border-[#1c1c13] bg-white px-4 font-bold text-[#1c1c13] shadow-[2px_2px_0_#1c1c13] outline-none focus:border-[#6366f1] transition-all"
                  />
                  {txForm.amount ? (
                    <p className="mt-1.5 text-xs font-black text-[#1c1c13]">
                      {formatAmount(txForm.amount)}
                    </p>
                  ) : null}
                </div>

                {/* Note */}
                <div className="sm:col-span-2">
                  <label htmlFor="note" className="mb-2 block text-[10px] font-black uppercase text-[#1c1c13]">
                    {t("descriptionOptional", "Description (optional)")}
                  </label>
                  <input
                    id="note"
                    type="text"
                    name="note"
                    value={txForm.note}
                    onChange={onTxChange}
                    placeholder={t(
                      "whatTransactionAbout",
                      "What is this transaction about?",
                    )}
                    className="min-h-[3rem] w-full rounded-lg border-2 border-[#1c1c13] bg-white px-4 font-bold text-[#1c1c13] shadow-[2px_2px_0_#1c1c13] outline-none focus:border-[#6366f1] transition-all"
                  />
                </div>

                {/* Date */}
                <div className="sm:col-span-2">
                  <label htmlFor="date" className="mb-2 block text-[10px] font-black uppercase text-[#1c1c13]">
                    {t("date", "Date & Time")}
                  </label>
                  <input
                    id="date"
                    type="datetime-local"
                    name="date"
                    value={txForm.date}
                    onChange={onTxChange}
                    className="min-h-[3rem] w-full rounded-lg border-2 border-[#1c1c13] bg-white px-4 font-bold text-[#1c1c13] shadow-[2px_2px_0_#1c1c13] outline-none focus:border-[#6366f1] transition-all"
                  />
                </div>

                {/* Receipt Image */}
                <div className="sm:col-span-2">
                  <label
                    htmlFor="receiptImage"
                    className="mb-2 block text-[10px] font-black uppercase text-[#1c1c13]"
                  >
                    {t("receiptImage", "Receipt / Proof Image")}
                  </label>
                  <div className="rounded-xl border-2 border-dashed border-[#1c1c13] bg-[#fffbeb] p-4 transition-colors hover:border-solid">
                    <input
                      id="receiptImage"
                      type="file"
                      accept="image/*"
                      onChange={onReceiptChange}
                      className="block w-full text-sm text-[#1c1c13] file:mr-4 file:rounded-lg file:border-2 file:border-[#1c1c13] file:bg-white file:px-4 file:py-2 file:text-sm file:font-black file:text-[#1c1c13] file:shadow-[2px_2px_0_#1c1c13] hover:file:-translate-y-0.5 hover:file:bg-[#6366f1] hover:file:text-white file:transition-all cursor-pointer file:active:translate-y-0"
                    />
                    <p className="mt-3 text-[11px] font-bold text-[#1c1c13]">
                      {t(
                        "receiptImageHint",
                        "Upload a receipt, invoice, or payment proof. Max 1.5MB.",
                      )}
                    </p>

                    {isReadingImage ? (
                      <p className="mt-3 text-sm font-black text-[#1c1c13]">
                        {t("loading", "Loading...")}
                      </p>
                    ) : null}

                    {txForm.receiptImage ? (
                      <div className="mt-4 flex items-center gap-3 rounded-xl border-2 border-[#1c1c13] bg-white p-3 shadow-[2px_2px_0_#1c1c13]">
                        <img
                          src={txForm.receiptImage}
                          alt={
                            txForm.receiptImageName ||
                            t("receiptImagePreview", "Receipt preview")
                          }
                          className="h-16 w-16 rounded-lg border-2 border-[#1c1c13] object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-black text-[#1c1c13]">
                            {txForm.receiptImageName ||
                              t("receiptImageAttached", "Receipt image attached")}
                          </p>
                          <p className="text-xs font-bold text-[#1c1c13] mt-0.5">
                            {t(
                              "receiptImageReady",
                              "This image will be saved with the transaction.",
                            )}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={clearReceipt}
                          className="rounded border-2 border-[#1c1c13] bg-[#ef4444] px-3 py-2 text-[10px] font-black uppercase text-white shadow-[2px_2px_0_#1c1c13] hover:-translate-y-0.5 active:translate-y-0 transition-all"
                        >
                          {t("remove", "Remove")}
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <div className="mb-4 rounded-xl border-2 border-[#1c1c13] bg-[#fffbeb] p-4 shadow-[4px_4px_0_#1c1c13]">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <div className="flex h-6 items-center">
                        <input
                          type="checkbox"
                          name="syncToPersonal"
                          checked={splitForm.syncToPersonal}
                          onChange={onSplitChange}
                          className="h-5 w-5 rounded border-2 border-[#1c1c13] text-[#6366f1] focus:ring-[#6366f1] shadow-[2px_2px_0_#1c1c13]"
                        />
                      </div>
                      <div>
                        <p className="text-sm font-black text-[#1c1c13]">
                          {tr("Auto-record to Personal Expense", "Catat otomatis ke Pengeluaran Personal")}
                        </p>
                        <p className="text-xs font-bold text-[#1c1c13] mt-1">
                          {tr(
                            "Creates an Expense transaction for the total amount, and records Income when friends pay you back.",
                            "Membuat transaksi pengeluaran sebesar total tagihan, dan mencatat pemasukan tiap kali teman membayar."
                          )}
                        </p>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-2 block text-[10px] font-black uppercase text-[#1c1c13]">
                    {tr("Title", "Judul")}
                  </label>
                  <input
                    name="title"
                    value={splitForm.title}
                    onChange={onSplitChange}
                    placeholder={tr("Example: Dinner with classmates", "Contoh: Makan bareng kelas")}
                    className="min-h-[3rem] w-full rounded-lg border-2 border-[#1c1c13] bg-white px-4 font-bold text-[#1c1c13] shadow-[2px_2px_0_#1c1c13] outline-none focus:border-[#6366f1] transition-all"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-[10px] font-black uppercase text-[#1c1c13]">
                    {t("totalAmount", "Total Amount")} ({settings.currency})
                  </label>
                  <input
                    name="totalAmount"
                    type="number"
                    step="any"
                    min="1"
                    value={splitForm.totalAmount}
                    onChange={onSplitChange}
                    placeholder="0"
                    className="min-h-[3rem] w-full rounded-lg border-2 border-[#1c1c13] bg-white px-4 font-bold text-[#1c1c13] shadow-[2px_2px_0_#1c1c13] outline-none focus:border-[#6366f1] transition-all"
                  />
                  {splitForm.totalAmount ? (
                    <p className="mt-1.5 text-xs font-black text-[#1c1c13]">
                      {formatAmount(splitForm.totalAmount)}
                    </p>
                  ) : null}
                </div>

                <div>
                  <label className="mb-2 block text-[10px] font-black uppercase text-[#1c1c13]">
                    {t("descriptionOptional", "Description (optional)")}
                  </label>
                  <input
                    name="description"
                    value={splitForm.description}
                    onChange={onSplitChange}
                    placeholder={tr("Dinner after midterms", "Makan malam habis UTS")}
                    className="min-h-[3rem] w-full rounded-lg border-2 border-[#1c1c13] bg-white px-4 font-bold text-[#1c1c13] shadow-[2px_2px_0_#1c1c13] outline-none focus:border-[#6366f1] transition-all"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-2 block text-[10px] font-black uppercase text-[#1c1c13]">
                    {tr("Friends List (1 name per line)", "Daftar Teman (1 nama per baris)")}
                  </label>
                  <textarea
                    name="friends"
                    value={splitForm.friends}
                    onChange={onSplitChange}
                    rows={4}
                    placeholder={tr("Alex\nSam\nRina", "Bagas\nSiska\nDini")}
                    className="w-full rounded-lg border-2 border-[#1c1c13] bg-white px-4 py-3 font-bold text-[#1c1c13] shadow-[2px_2px_0_#1c1c13] outline-none focus:border-[#6366f1] transition-all"
                  />
                  <p className="mt-2 text-xs font-black text-[#1c1c13]">
                    {tr("Amount will be split equally across friends.", "Total tagihan akan dibagi rata otomatis ke semua teman.")}
                  </p>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-4 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting || isReadingImage}
                className="min-h-[3rem] w-full rounded-lg border-2 border-[#1c1c13] bg-white px-4 font-black text-[#1c1c13] shadow-[2px_2px_0_#1c1c13] hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:translate-y-0 disabled:shadow-none"
              >
                {t("cancel", "Cancel")}
              </button>
              <button
                type="submit"
                disabled={isSubmitting || isReadingImage}
                className="min-h-[3rem] w-full rounded-lg border-2 border-[#1c1c13] bg-[#6366f1] px-4 font-black text-white shadow-[2px_2px_0_#1c1c13] hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:translate-y-0 disabled:shadow-none"
              >
                {isSubmitting ? t("saving", "Saving...") : t("save", "Save")}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

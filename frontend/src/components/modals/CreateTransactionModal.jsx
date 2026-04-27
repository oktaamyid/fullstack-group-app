import { useCallback, useEffect, useMemo, useState } from "react";
import { createTransaction } from "../../services/transaction";
import { updateTransaction } from "../../services/transaction";
import { useI18n } from "../../i18n/useI18n";

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

function toCurrency(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function getDefaultForm(initialValues = {}) {
  const nowDate = new Date().toISOString().split("T")[0];
  const sourceDate =
    initialValues.date || initialValues.createdAt
      ? new Date(initialValues.date || initialValues.createdAt)
          .toISOString()
          .split("T")[0]
      : nowDate;

  return {
    type: initialValues.type || DEFAULT_TYPE,
    category: initialValues.category || DEFAULT_CATEGORY,
    amount: initialValues.amount ? String(initialValues.amount) : "",
    note: initialValues.note || initialValues.description || "",
    date: sourceDate,
    receiptImage: initialValues.receiptImage || "",
    receiptImageName: initialValues.receiptImageName || "",
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

function getDialogTitle(t, isEditing) {
  return isEditing
    ? t("editTransaction", "Edit Transaction")
    : t("addTransactionModalTitle", "Add Transaction");
}

/**
 * CreateTransactionModal - Dialog for creating or updating transactions
 *
 * @param {Object} props
 * @param {function} props.onClose - Callback when modal closes
 * @param {function} props.onSuccess - Callback when transaction created successfully
 * @param {Object} [props.initialValues] - Existing transaction values for edit mode
 * @param {number|string|null} [props.transactionId] - Transaction id for edit mode
 */
export function CreateTransactionModal({
  onClose,
  onSuccess,
  initialValues = null,
  transactionId = null,
}) {
  const { t } = useI18n();
  const isEditing = useMemo(() => Boolean(transactionId), [transactionId]);
  const [form, setForm] = useState(() => getDefaultForm(initialValues || {}));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReadingImage, setIsReadingImage] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    setForm(getDefaultForm(initialValues || {}));
  }, [initialValues]);

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

  const onChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const updated = { ...prev, [name]: value };
      // Reset category if type changed
      if (name === "type" && !CATEGORIES[value].includes(prev.category)) {
        updated.category = CATEGORIES[value][0];
      }
      return updated;
    });
  }, []);

  const onReceiptChange = useCallback(
    async (event) => {
      const file = event.target.files?.[0];

      if (!file) {
        setForm((prev) => ({
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
        setForm((prev) => ({
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
    setForm((prev) => ({
      ...prev,
      receiptImage: "",
      receiptImageName: "",
    }));
  }, []);

  const onSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setErrorMessage("");
      setSuccessMessage("");

      const amount = Number(form.amount);

      if (Number.isNaN(amount) || amount <= 0) {
        setErrorMessage(
          t("pleaseEnterValidAmount", "Please enter a valid amount"),
        );
        return;
      }

      setIsSubmitting(true);

      try {
        const payload = {
          type: form.type,
          category: form.category,
          amount,
          note: form.note.trim(),
          createdAt: form.date ? new Date(form.date).toISOString() : undefined,
          receiptImage: form.receiptImage || "",
          receiptImageName: form.receiptImageName || "",
        };

        let savedTransaction;

        if (isEditing && transactionId) {
          const result = await updateTransaction(transactionId, payload);
          savedTransaction = result?.transaction || null;
        } else {
          const result = await createTransaction(payload);
          savedTransaction = result?.transaction || null;
        }

        setForm(getDefaultForm());
        setSuccessMessage(
          isEditing
            ? t(
                "transactionUpdatedSuccessfully",
                "Transaction updated successfully!",
              )
            : t(
                "transactionCreatedSuccessfully",
                "Transaction created successfully!",
              ),
        );

        setTimeout(async () => {
          try {
            await onSuccess?.(savedTransaction);
          } finally {
            onClose?.();
          }
        }, 850);
      } catch (error) {
        setErrorMessage(
          error.message ||
            t("failedToCreateTransaction", "Failed to create transaction"),
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [form, isEditing, onClose, onSuccess, t, transactionId],
  );

  const dialogTitle = getDialogTitle(t, isEditing);
  const submitLabel = isEditing
    ? t("updateTransaction", "Update Transaction")
    : t("createTransaction", "Create Transaction");

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 px-3 py-3 backdrop-blur-[1px] lg:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="transaction-dialog-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose?.();
        }
      }}
    >
      <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-[#1c1c13] bg-[#fffbeb] shadow-[6px_6px_0px_0px_rgba(28,28,19,1)]">
        <div className="max-h-[90svh] overflow-y-auto p-4 sm:p-5">
          <form onSubmit={onSubmit} className="space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 pb-1">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#464554]">
                  {isEditing ? t("edit", "Edit") : t("add", "Add")}
                </p>
                <h3
                  id="transaction-dialog-title"
                  className="text-2xl font-black tracking-tight text-[#1c1c13]"
                >
                  {dialogTitle}
                </h3>
                <p className="mt-1 text-sm font-medium text-[#464554]">
                  {t(
                    "transactionDialogHint",
                    "Add details, then attach a receipt or payment proof if available.",
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#1c1c13] bg-white transition-all active:translate-x-px active:translate-y-px"
                aria-label={t("close", "Close")}
              >
                <span className="material-symbols-outlined text-base">
                  close
                </span>
              </button>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="rounded-2xl border border-[#1c1c13] bg-[#fee2e2] p-3 text-sm font-semibold text-[#7f1d1d]">
                {errorMessage}
              </div>
            )}

            {/* Success Message */}
            {successMessage && (
              <div className="rounded-2xl border border-[#1c1c13] bg-[#dcfce7] p-3 text-sm font-semibold text-[#14532d]">
                {successMessage}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Type Selection */}
              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-black">
                  {t("type", "Type")}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {TRANSACTION_TYPES.map((type) => (
                    <label
                      key={type}
                      className="flex min-h-11 cursor-pointer items-center gap-2 rounded-2xl border border-[#1c1c13] px-3 py-2 transition-all"
                      style={{
                        backgroundColor:
                          form.type === type ? "#fbbf24" : "#ffffff",
                      }}
                    >
                      <input
                        type="radio"
                        name="type"
                        value={type}
                        checked={form.type === type}
                        onChange={onChange}
                        className="cursor-pointer"
                      />
                      <span className="text-sm font-bold">
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
                  className="mb-2 block text-sm font-black"
                >
                  {t("category", "Category")}
                </label>
                <select
                  id="category"
                  name="category"
                  value={form.category}
                  onChange={onChange}
                  className="min-h-11 w-full rounded-2xl border border-[#1c1c13] bg-white px-3 font-medium outline-none"
                >
                  {CATEGORIES[form.type].map((cat) => (
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
                  className="mb-2 block text-sm font-black"
                >
                  {t("amount", "Amount")} (IDR)
                </label>
                <input
                  id="amount"
                  type="number"
                  name="amount"
                  value={form.amount}
                  onChange={onChange}
                  placeholder="0"
                  min="0"
                  inputMode="numeric"
                  className="min-h-11 w-full rounded-2xl border border-[#1c1c13] bg-white px-3 font-medium outline-none"
                />
                {form.amount ? (
                  <p className="mt-1 text-xs text-[#464554]">
                    {toCurrency(form.amount)}
                  </p>
                ) : null}
              </div>

              {/* Note */}
              <div className="sm:col-span-2">
                <label htmlFor="note" className="mb-2 block text-sm font-black">
                  {t("descriptionOptional", "Description (optional)")}
                </label>
                <input
                  id="note"
                  type="text"
                  name="note"
                  value={form.note}
                  onChange={onChange}
                  placeholder={t(
                    "whatTransactionAbout",
                    "What is this transaction about?",
                  )}
                  className="min-h-11 w-full rounded-2xl border border-[#1c1c13] bg-white px-3 font-medium outline-none"
                />
              </div>

              {/* Date */}
              <div>
                <label htmlFor="date" className="mb-2 block text-sm font-black">
                  {t("date", "Date")}
                </label>
                <input
                  id="date"
                  type="date"
                  name="date"
                  value={form.date}
                  onChange={onChange}
                  className="min-h-11 w-full rounded-2xl border border-[#1c1c13] bg-white px-3 font-medium outline-none"
                />
              </div>

              {/* Receipt Image */}
              <div className="sm:col-span-2">
                <label
                  htmlFor="receiptImage"
                  className="mb-2 block text-sm font-black"
                >
                  {t("receiptImage", "Receipt / Proof Image")}
                </label>
                <div className="rounded-2xl border border-dashed border-[#1c1c13] bg-[#fff9dc] p-3">
                  <input
                    id="receiptImage"
                    type="file"
                    accept="image/*"
                    onChange={onReceiptChange}
                    className="block w-full text-sm file:mr-3 file:min-h-11 file:rounded-2xl file:border file:border-[#1c1c13] file:bg-white file:px-4 file:py-2 file:text-sm file:font-black file:text-[#1c1c13] file:shadow-[2px_2px_0px_0px_rgba(28,28,19,1)]"
                  />
                  <p className="mt-2 text-[11px] font-medium text-[#464554]">
                    {t(
                      "receiptImageHint",
                      "Upload a receipt, invoice, or payment proof. Max 1.5MB.",
                    )}
                  </p>

                  {isReadingImage ? (
                    <p className="mt-2 text-sm font-semibold text-[#464554]">
                      {t("loading", "Loading...")}
                    </p>
                  ) : null}

                  {form.receiptImage ? (
                    <div className="mt-3 flex items-center gap-3 rounded-2xl border border-[#1c1c13] bg-white p-3">
                      <img
                        src={form.receiptImage}
                        alt={
                          form.receiptImageName ||
                          t("receiptImagePreview", "Receipt preview")
                        }
                        className="h-16 w-16 rounded-xl border border-[#1c1c13] object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-black text-[#1c1c13]">
                          {form.receiptImageName ||
                            t("receiptImageAttached", "Receipt image attached")}
                        </p>
                        <p className="text-xs font-medium text-[#464554]">
                          {t(
                            "receiptImageReady",
                            "This image will be saved with the transaction.",
                          )}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={clearReceipt}
                        className="min-h-11 rounded-2xl border border-[#1c1c13] bg-[#fee2e2] px-3 text-xs font-black uppercase text-[#7f1d1d]"
                      >
                        {t("remove", "Remove")}
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || isReadingImage || !form.amount}
              className="mt-2 min-h-11 w-full rounded-2xl border border-[#1c1c13] bg-[#6366f1] px-4 py-3 font-black text-white shadow-[2px_2px_0px_0px_rgba(28,28,19,1)] transition-all disabled:cursor-not-allowed disabled:opacity-50 active:translate-x-px active:translate-y-px active:shadow-none"
            >
              {isSubmitting ? t("saving", "Saving...") : submitLabel}
            </button>

            {/* Cancel Button */}
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting || isReadingImage}
              className="min-h-11 w-full rounded-2xl border border-[#1c1c13] bg-white px-4 py-3 font-black text-[#1c1c13] shadow-[2px_2px_0px_0px_rgba(28,28,19,1)] transition-all disabled:opacity-50 active:translate-x-px active:translate-y-px active:shadow-none"
            >
              {t("cancel", "Cancel")}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import { getAnalyticsOverview } from "../../services/analytics";
import {
  createWishlistItem,
  deleteWishlistItem,
  getWishlists,
  updateWishlistItem,
} from "../../services/wishlist";
import { PageLayout } from "../layouts/PageLayout";
import { PageHeader } from "../headers/PageHeader";
import { useI18n } from "../../i18n/useI18n";

const defaultForm = {
  item: "",
  price: "",
  priorityScore: "3",
};

// We enforce a minimum safe margin percentage that should remain after purchase
const SAFE_MARGIN_PERCENTAGE = 0.2; // 20% of current balance should remain

function toRupiah(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function getPriorityLabel(priorityScore) {
  return `P${priorityScore}`;
}

function getPriorityTone(priorityScore) {
  if (priorityScore >= 4) return "bg-red-50 text-red-700";
  if (priorityScore <= 2) return "bg-green-50 text-green-700";
  return "bg-amber-50 text-amber-700";
}

function getCardVisual(index) {
  const visuals = [
    "bg-indigo-50 text-indigo-700",
    "bg-orange-50 text-orange-700",
    "bg-emerald-50 text-emerald-700",
    "bg-sky-50 text-sky-700",
  ];
  return visuals[index % visuals.length];
}

function getBuyability(price, balance) {
  if (price <= 0) {
    return {
      label: "No price",
      percent: 0,
      needed: 0,
      trackClass: "bg-gray-100",
      fillClass: "bg-gray-400",
      badgeClass: "bg-gray-100 text-gray-700",
      cardBadge: "bg-gray-100 text-gray-700",
      ctaLabel: "Set Price",
      disabled: true,
      safeMessage: "Please set a valid price.",
    };
  }

  const safeRemaining = balance * SAFE_MARGIN_PERCENTAGE;
  const safeTargetPrice = price + safeRemaining;
  
  // Progress towards safely buying the item
  const ratio = balance / safeTargetPrice;
  const percent = Math.max(0, Math.min(100, Math.round(ratio * 100)));
  const needed = Math.max(0, safeTargetPrice - balance);

  if (balance >= price && balance - price >= safeRemaining) {
    return {
      label: "Buyable",
      percent: 100,
      needed: 0,
      trackClass: "bg-green-50",
      fillClass: "bg-green-500",
      badgeClass: "bg-green-100 text-green-700",
      cardBadge: "bg-green-100 text-green-700",
      ctaLabel: "Checkout Now",
      disabled: false,
      safeMessage: "You can buy this and still have a safe financial buffer.",
    };
  }

  if (balance >= price) {
    return {
      label: "Unsafe",
      percent: 100,
      needed: 0,
      trackClass: "bg-red-50",
      fillClass: "bg-red-500",
      badgeClass: "bg-red-100 text-red-700",
      cardBadge: "bg-red-100 text-red-700",
      ctaLabel: "Buy (Risk Warning)",
      disabled: false,
      safeMessage: "Warning: Buying this leaves you with little to no emergency funds.",
    };
  }

  if (ratio >= 0.6) {
    return {
      label: "Almost",
      percent,
      needed: Math.max(0, price - balance),
      trackClass: "bg-amber-50",
      fillClass: "bg-amber-500",
      badgeClass: "bg-amber-100 text-amber-700",
      cardBadge: "bg-amber-100 text-amber-700",
      ctaLabel: "Almost There",
      disabled: true,
      safeMessage: `Need ${toRupiah(Math.max(0, price - balance))} to afford it.`,
    };
  }

  return {
    label: "Not yet",
    percent,
    needed: Math.max(0, price - balance),
    trackClass: "bg-gray-100",
    fillClass: "bg-gray-400",
    badgeClass: "bg-gray-100 text-gray-700",
    cardBadge: "bg-gray-100 text-gray-700",
    ctaLabel: "Insufficient Funds",
    disabled: true,
    safeMessage: `Need ${toRupiah(Math.max(0, price - balance))} more.`,
  };
}

export function WishlistScreen({ mainLogo }) {
  const { t, language } = useI18n();
  const tr = (en, id) => (language === "id-ID" ? id : en);
  const [wishlistItems, setWishlistItems] = useState([]);
  const [form, setForm] = useState(defaultForm);
  const [fieldErrors, setFieldErrors] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [currentBalance, setCurrentBalance] = useState(0);
  const [goalTarget, setGoalTarget] = useState(1000000);
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const loadWishlist = async () => {
    const data = await getWishlists();
    setWishlistItems(data.wishlists || []);
  };

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const [wishlistData, analyticsData] = await Promise.all([
          getWishlists(),
          getAnalyticsOverview(),
        ]);

        if (cancelled) return;

        setWishlistItems(wishlistData.wishlists || []);
        // Fetch real netBalance instead of trusting a manual input savings goal
        const netBal = analyticsData?.overview?.netBalance || 0;
        setCurrentBalance(netBal > 0 ? netBal : 0);
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(error.message);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, []);

  const totalWishlistCost = useMemo(
    () => wishlistItems.reduce((sum, entry) => sum + (entry.price || 0), 0),
    [wishlistItems],
  );

  const highestPriorityItem = useMemo(
    () =>
      wishlistItems
        .slice()
        .sort((a, b) => b.priorityScore - a.priorityScore)[0] || null,
    [wishlistItems],
  );

  const goalProgress = useMemo(() => {
    if (goalTarget <= 0) return 0;
    return Math.max(
      0,
      Math.min(100, Math.round((currentBalance / goalTarget) * 100)),
    );
  }, [currentBalance, goalTarget]);

  const featuredProgress = useMemo(() => {
    if (!highestPriorityItem || highestPriorityItem.price <= 0) return 0;
    return Math.max(
      0,
      Math.min(
        100,
        Math.round((currentBalance / highestPriorityItem.price) * 100),
      ),
    );
  }, [currentBalance, highestPriorityItem]);

  const filteredItems = useMemo(() => {
    return wishlistItems.filter((entry) => {
      const matchQuery = entry.item
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchPriority =
        priorityFilter === "ALL" ||
        entry.priorityScore === Number(priorityFilter);
      return matchQuery && matchPriority;
    });
  }, [wishlistItems, searchQuery, priorityFilter]);

  const hamsterSuggestion = useMemo(() => {
    if (!highestPriorityItem) {
      return tr(
        "Add your first wishlist item so LIVO can suggest your next smart purchase.",
        "Tambahkan wishlist pertamamu agar LIVO bisa memberi saran pembelian berikutnya.",
      );
    }

    const safeMargin = currentBalance * SAFE_MARGIN_PERCENTAGE;
    const safeTargetPrice = highestPriorityItem.price + safeMargin;
    const neededForSafePurchase = Math.max(0, safeTargetPrice - currentBalance);

    if (currentBalance >= highestPriorityItem.price) {
      if (currentBalance - highestPriorityItem.price < safeMargin) {
        return tr(
          `You have enough to buy ${highestPriorityItem.item}, but it's risky! Wait until you save a bit more to keep your emergency fund safe.`,
          `Uangmu cukup untuk ${highestPriorityItem.item}, tapi berisiko! Tahan dulu sampai dana daruratmu lebih aman.`
        );
      }
      return tr(
        `You can safely buy ${highestPriorityItem.item} right now. Great discipline!`,
        `Kamu sudah bisa membeli ${highestPriorityItem.item} sekarang. Bagus sekali!`,
      );
    }

    return tr(
      `Hold for now. Save ${toRupiah(neededForSafePurchase)} more to safely buy ${highestPriorityItem.item}.`,
      `Tahan dulu. Tabung ${toRupiah(neededForSafePurchase)} lagi agar bisa membeli ${highestPriorityItem.item} dengan aman.`,
    );
  }, [currentBalance, highestPriorityItem, language]);

  const onChangeForm = (event) => {
    const { name, value } = event.target;
    const nextValue = name === "price" ? value.replace(/\D/g, "") : value;

    setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    setForm((prev) => ({ ...prev, [name]: nextValue }));
  };

  const resetForm = () => {
    setForm(defaultForm);
    setFieldErrors({});
    setEditingId(null);
  };

  const validateForm = () => {
    const nextErrors = {};
    const item = form.item.trim();
    const parsedPrice = Number(form.price);
    const parsedPriority = Number(form.priorityScore);

    if (item.length < 2) {
      nextErrors.item = tr(
        "Item name must be at least 2 characters.",
        "Item minimal 2 karakter.",
      );
    }

    if (!Number.isInteger(parsedPrice) || parsedPrice <= 0) {
      nextErrors.price = tr(
        "Price must be a positive integer.",
        "Harga harus berupa angka bulat positif.",
      );
    }

    if (
      !Number.isInteger(parsedPriority) ||
      parsedPriority < 1 ||
      parsedPriority > 5
    ) {
      nextErrors.priorityScore = tr(
        "Priority score must be between 1 and 5.",
        "Priority score harus 1-5.",
      );
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    if (!validateForm()) {
      setErrorMessage(
        tr("Please review your form input.", "Periksa kembali input form."),
      );
      return;
    }

    const price = Number(form.price);

    setIsSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const payload = {
        item: form.item.trim(),
        price,
        priorityScore: Number(form.priorityScore),
      };

      if (editingId) {
        await updateWishlistItem(editingId, payload);
      } else {
        await createWishlistItem(payload);
      }

      resetForm();
      await loadWishlist();
      setSuccessMessage(
        editingId
          ? tr(
              "Wishlist item updated successfully.",
              "Wishlist item berhasil diperbarui.",
            )
          : tr(
              "Wishlist item added successfully.",
              "Wishlist item berhasil ditambahkan.",
            ),
      );
    } catch (error) {
      setErrorMessage(error.message);
      const incomingFieldErrors = error.fieldErrors || {};
      setFieldErrors({
        item: incomingFieldErrors.item?.[0] || "",
        price: incomingFieldErrors.price?.[0] || "",
        priorityScore: incomingFieldErrors.priorityScore?.[0] || "",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const onEdit = (entry) => {
    setSuccessMessage("");
    setErrorMessage("");
    setFieldErrors({});

    setEditingId(entry.id);
    setForm({
      item: entry.item,
      price: String(entry.price),
      priorityScore: String(entry.priorityScore),
    });
  };

  const onDelete = async (id) => {
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await deleteWishlistItem(id);
      if (editingId === id) {
        resetForm();
      }
      await loadWishlist();
      setSuccessMessage(
        tr(
          "Wishlist item deleted successfully.",
          "Wishlist item berhasil dihapus.",
        ),
      );
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  const onPurchase = async (entry) => {
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await deleteWishlistItem(entry.id);
      if (editingId === entry.id) {
        resetForm();
      }
      await loadWishlist();
      setSuccessMessage(
        tr(
          `Purchase of ${entry.item} marked as completed.`,
          `Pembelian ${entry.item} ditandai selesai.`,
        ),
      );
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  return (
    <PageLayout
      header={
        <PageHeader
          mainLogo={mainLogo}
          title={t("myWishlist", "My Wishlist")}
          backLink="/home"
        />
      }
      className="space-y-6 py-6 lg:p-8"
    >
      {/* Top Banner - Hamster Suggestion Integrated */}
      <section className="rounded-xl border-2 border-[#1c1c13] bg-[#fffbeb] p-5 lg:p-6 shadow-[4px_4px_0_#1c1c13] flex flex-col sm:flex-row items-center sm:items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border-2 border-[#1c1c13] bg-[#fbbf24] shadow-[2px_2px_0_#1c1c13]">
          <span className="material-symbols-outlined text-3xl text-[#1c1c13]">pets</span>
        </div>
        <div className="text-center sm:text-left flex-1">
          <p className="text-[11px] font-black uppercase tracking-wider text-[#1c1c13] mb-1">
            {t("hamsterSuggestion", "Smart Suggestion")}
          </p>
          <p className="text-sm lg:text-base font-semibold text-[#1c1c13] leading-relaxed">
            {hamsterSuggestion}
          </p>
        </div>
      </section>

      {/* Summary Cards */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <article className="rounded-xl border-2 border-[#1c1c13] bg-[#6366f1] p-5 lg:p-6 text-white shadow-[4px_4px_0_#1c1c13]">
          <span className="material-symbols-outlined text-white">account_balance_wallet</span>
          <p className="mt-3 text-[10px] lg:text-xs font-black uppercase tracking-wide text-white">
            {t("realBalance", "Real Balance")}
          </p>
          <p className="text-xl lg:text-2xl font-black mt-1 truncate">{toRupiah(currentBalance)}</p>
        </article>
        <article className="rounded-xl border-2 border-[#1c1c13] bg-[#fbbf24] p-5 lg:p-6 text-[#1c1c13] shadow-[4px_4px_0_#1c1c13]">
          <span className="material-symbols-outlined text-[#1c1c13]">stars</span>
          <p className="mt-3 text-[10px] lg:text-xs font-black uppercase tracking-wide text-[#1c1c13]">
            {t("nextGoal", "Next Goal")}
          </p>
          <p className="text-xl lg:text-2xl font-black text-[#1c1c13] mt-1">{goalProgress}%</p>
        </article>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Form & Goal Settings */}
        <div className="lg:col-span-1 space-y-6">
          <section className="rounded-xl border-2 border-[#1c1c13] bg-white p-5 lg:p-6 shadow-[4px_4px_0_#1c1c13]">
            <h3 className="text-sm font-black uppercase tracking-wide text-[#1c1c13] border-b-2 border-[#1c1c13] pb-3">
              {editingId
                ? t("editWishlistItem", "Edit Wishlist Item")
                : t("addWishlistItem", "Add Wishlist Item")}
            </h3>
            <form className="mt-4 grid gap-4" onSubmit={onSubmit}>
              <div>
                <label className="mb-2 block text-[10px] font-black uppercase text-[#1c1c13]">Item Name</label>
                <input
                  name="item"
                  value={form.item}
                  onChange={onChangeForm}
                  placeholder={t("itemName", "Item name")}
                  className="min-h-[2.75rem] w-full rounded-lg border-2 border-[#1c1c13] bg-white px-3 text-sm font-bold outline-none focus:border-[#6366f1] shadow-[2px_2px_0_#1c1c13]"
                />
                {fieldErrors.item ? <p className="mt-1 text-xs font-black text-[#ef4444]">{fieldErrors.item}</p> : null}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-2 block text-[10px] font-black uppercase text-[#1c1c13]">Price (Rp)</label>
                  <input
                    name="price"
                    type="text"
                    inputMode="numeric"
                    value={form.price}
                    onChange={onChangeForm}
                    placeholder="0"
                    className="min-h-[2.75rem] w-full rounded-lg border-2 border-[#1c1c13] bg-white px-3 text-sm font-bold outline-none focus:border-[#6366f1] shadow-[2px_2px_0_#1c1c13]"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-[10px] font-black uppercase text-[#1c1c13]">Priority</label>
                  <select
                    name="priorityScore"
                    value={form.priorityScore}
                    onChange={onChangeForm}
                    className="min-h-[2.75rem] w-full rounded-lg border-2 border-[#1c1c13] bg-white px-3 text-sm font-bold outline-none focus:border-[#6366f1] shadow-[2px_2px_0_#1c1c13]"
                  >
                    <option value="5">P5 (Highest)</option>
                    <option value="4">P4</option>
                    <option value="3">P3</option>
                    <option value="2">P2</option>
                    <option value="1">P1 (Lowest)</option>
                  </select>
                </div>
              </div>
              
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="min-h-[2.75rem] flex-1 rounded-lg border-2 border-[#1c1c13] bg-white px-3 text-[11px] font-black uppercase text-[#1c1c13] shadow-[2px_2px_0_#1c1c13] hover:-translate-y-0.5 active:translate-y-0 transition-all"
                >
                  Reset
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="min-h-[2.75rem] flex-[2] rounded-lg border-2 border-[#1c1c13] bg-[#6366f1] px-3 text-[11px] font-black uppercase text-white shadow-[2px_2px_0_#1c1c13] hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:shadow-none disabled:translate-y-0"
                >
                  {isSaving ? "Saving..." : editingId ? "Update Item" : "Add Item"}
                </button>
              </div>
            </form>
          </section>

          {/* Goal Setting */}
          <section className="rounded-xl border-2 border-[#1c1c13] bg-white p-5 lg:p-6 shadow-[4px_4px_0_#1c1c13]">
             <div className="mb-4">
              <h3 className="text-sm font-black uppercase tracking-tight text-[#1c1c13]">
                {t("activeGoal", "Active Goal")}:{" "}
                {highestPriorityItem ? highestPriorityItem.item : t("noItemYet", "None")}
              </h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-end justify-between">
                <p className="text-xl font-black text-[#1c1c13]">
                  {toRupiah(Math.min(currentBalance, highestPriorityItem?.price || 0))}
                  <span className="ml-1 text-xs font-bold text-gray-500">
                    / {toRupiah(highestPriorityItem?.price || goalTarget)}
                  </span>
                </p>
                <span className="font-black text-[#6366f1]">{featuredProgress}%</span>
              </div>
              <div className="h-4 w-full overflow-hidden rounded-full border-2 border-[#1c1c13] bg-white">
                <div
                  className="h-full bg-[#6366f1] border-r-2 border-[#1c1c13] transition-all duration-500"
                  style={{ width: `${featuredProgress}%` }}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-[#1c1c13] mb-2">
                  {t("savingsGoal", "Target Savings")} (Rp)
                </label>
                <input
                  type="number"
                  min="1"
                  value={goalTarget}
                  onChange={(event) => setGoalTarget(Number(event.target.value) || 0)}
                  className="min-h-[2.75rem] w-full rounded-lg border-2 border-[#1c1c13] bg-white px-3 text-sm font-bold outline-none focus:border-[#6366f1] shadow-[2px_2px_0_#1c1c13]"
                />
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: List & Filters */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search wishlist..."
              className="min-h-[2.75rem] flex-1 rounded-lg border-2 border-[#1c1c13] bg-white px-4 text-sm font-bold shadow-[2px_2px_0_#1c1c13] outline-none focus:border-[#6366f1]"
            />
            <select
              value={priorityFilter}
              onChange={(event) => setPriorityFilter(event.target.value)}
              className="min-h-[2.75rem] rounded-lg border-2 border-[#1c1c13] bg-white px-4 text-sm font-bold shadow-[2px_2px_0_#1c1c13] outline-none focus:border-[#6366f1]"
            >
              <option value="ALL">All Prio</option>
              <option value="5">P5</option>
              <option value="4">P4</option>
              <option value="3">P3</option>
              <option value="2">P2</option>
              <option value="1">P1</option>
            </select>
          </div>

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

          <div className="flex items-center justify-between">
            <h3 className="text-lg lg:text-xl font-black tracking-tight text-[#1c1c13]">Wishlist Items</h3>
            <span className="rounded border-2 border-[#1c1c13] bg-[#fbbf24] px-3 py-1 text-[10px] font-black uppercase text-[#1c1c13]">
              Total {toRupiah(totalWishlistCost)}
            </span>
          </div>

          {isLoading ? (
            <p className="text-sm font-black text-[#1c1c13]">Loading wishlist...</p>
          ) : filteredItems.length === 0 ? (
            <div className="rounded-xl border-2 border-[#1c1c13] bg-[#fffbeb] p-8 text-center shadow-[4px_4px_0_#1c1c13]">
              <p className="text-sm font-black text-[#1c1c13]">No wishlist item matches your filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredItems.map((entry, index) => {
                const buyability = getBuyability(entry.price, currentBalance);

                return (
                  <article
                    key={entry.id}
                    className="flex flex-col overflow-hidden rounded-xl border-2 border-[#1c1c13] bg-white shadow-[4px_4px_0_#1c1c13] transition-transform hover:-translate-y-0.5 active:translate-y-0 active:shadow-[2px_2px_0_#1c1c13]"
                  >
                    <div className={`relative h-28 flex items-center justify-center p-4 border-b-2 border-[#1c1c13] bg-[#fffbeb]`}>
                      <span className={`absolute right-3 top-3 rounded border-2 border-[#1c1c13] px-2 py-1 text-[10px] font-black uppercase ${buyability.cardBadge}`}>
                        {buyability.label}
                      </span>
                      <h4 className="text-center text-lg font-black tracking-tight line-clamp-2 text-[#1c1c13]">
                        {entry.item}
                      </h4>
                    </div>

                    <div className="flex flex-col flex-1 p-4 lg:p-5">
                      <div className="flex items-start justify-between gap-2 mb-4">
                        <div>
                          <p className="text-lg font-black text-[#1c1c13]">{toRupiah(entry.price)}</p>
                        </div>
                        <span className={`rounded border-2 border-[#1c1c13] px-2 py-0.5 text-[10px] font-black uppercase bg-[#fffbeb] text-[#1c1c13]`}>
                          {getPriorityLabel(entry.priorityScore)}
                        </span>
                      </div>

                      <div className="rounded-lg border-2 border-[#1c1c13] bg-[#fffbeb] p-3 mb-4 shadow-[2px_2px_0_#1c1c13]">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase text-[#1c1c13]">Buyability</span>
                          <span className={`rounded border-2 border-[#1c1c13] px-2 py-0.5 text-[10px] font-black uppercase ${buyability.badgeClass}`}>
                            {buyability.percent}%
                          </span>
                        </div>
                        <div className={`h-3 w-full overflow-hidden rounded-full border-2 border-[#1c1c13] bg-white`}>
                          <div
                            className={`h-full border-r-2 border-[#1c1c13] transition-all duration-500 ${buyability.fillClass}`}
                            style={{ width: `${buyability.percent}%` }}
                          />
                        </div>
                        <p className={`mt-2 text-[10px] font-black ${buyability.label === 'Unsafe' ? 'text-[#ef4444]' : 'text-[#1c1c13]'}`}>
                          {buyability.safeMessage}
                        </p>
                      </div>

                      <div className="mt-auto grid grid-cols-[1fr_auto_auto] gap-2">
                        <button
                          type="button"
                          onClick={() => onPurchase(entry)}
                          className={`rounded-lg border-2 border-[#1c1c13] px-3 text-[11px] font-black uppercase shadow-[2px_2px_0_#1c1c13] hover:-translate-y-0.5 active:translate-y-0 transition-all ${
                            buyability.disabled
                              ? "bg-gray-100 text-[#1c1c13] opacity-50 shadow-none hover:translate-y-0"
                              : buyability.label === 'Unsafe'
                                ? "bg-[#ef4444] text-white"
                                : "bg-[#6366f1] text-white"
                          }`}
                        >
                          {buyability.ctaLabel}
                        </button>
                        <button
                          type="button"
                          onClick={() => onEdit(entry)}
                          className="flex min-h-[2.5rem] min-w-[2.5rem] items-center justify-center rounded-lg border-2 border-[#1c1c13] bg-white text-[#1c1c13] shadow-[2px_2px_0_#1c1c13] hover:-translate-y-0.5 active:translate-y-0 transition-all"
                        >
                          <span className="material-symbols-outlined text-sm">edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(entry.id)}
                          className="flex min-h-[2.5rem] min-w-[2.5rem] items-center justify-center rounded-lg border-2 border-[#1c1c13] bg-[#ef4444] text-white shadow-[2px_2px_0_#1c1c13] hover:-translate-y-0.5 active:translate-y-0 transition-all"
                        >
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}

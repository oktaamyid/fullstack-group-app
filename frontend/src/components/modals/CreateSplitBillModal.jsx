import { useCallback, useEffect, useState } from "react";
import { createSplitBill, updateSplitBill } from "../../services/splitBill";
import { getWallets } from "../../services/wallet";
import { useI18n } from "../../i18n/useI18n";
import { useProfileSettings } from "../../hooks/useProfileSettings";
import { convertFromIdr, convertToIdr, formatCurrencyValue } from "../../services/currency";
import { ManageWalletModal } from "./ManageWalletModal";
import { getAuthUser } from "../../services/auth";

function toInputAmount(value, currency) {
  const converted = convertFromIdr(value, currency);
  return Number.isInteger(converted) ? String(converted) : converted.toFixed(2);
}

export function CreateSplitBillModal({
  onClose,
  onSuccess,
  initialValues = null,
  splitBillId = null,
}) {
  const { t, language } = useI18n();
  const settings = useProfileSettings();
  const authUser = getAuthUser();
  const tr = useCallback((en, id) => (language === "id-ID" ? id : en), [language]);

  const isEditingSplit = Boolean(splitBillId);

  // Stepper State
  const [currentStep, setCurrentStep] = useState(1);

  // Form State
  const [title, setTitle] = useState(initialValues?.title || "");
  const [note, setNote] = useState("");
  const [paymentInfo, setPaymentInfo] = useState("");
  const [syncToPersonal, setSyncToPersonal] = useState(initialValues?.syncToPersonal ?? false);
  const [walletId, setWalletId] = useState(initialValues?.transaction?.walletId || "");
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [wallets, setWallets] = useState([]);
  
  const [publicUrl, setPublicUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Initialize descriptive fields if editing
  useEffect(() => {
    if (initialValues?.description) {
      try {
        const parsed = JSON.parse(initialValues.description);
        setNote(parsed.note || "");
        setPaymentInfo(parsed.paymentInfo || "");
      } catch {
        setNote(initialValues.description || "");
      }
    }
  }, [initialValues]);

  // Items State
  const [items, setItems] = useState(() => {
    if (initialValues?.items && initialValues.items.length > 0) {
      return initialValues.items.map((item, i) => {
        const assignedIds = (item.assignedTo || []).map(a => {
           const member = initialValues.members.find(m => m.id === a.memberId);
           if (!member) return null;
           return `friend-${initialValues.members.indexOf(member)}`;
        }).filter(Boolean);

        return {
          id: `item-${i}`,
          name: item.itemName,
          price: toInputAmount(item.price, settings.currency),
          quantity: item.quantity || 1,
          assignedTo: assignedIds,
        };
      });
    }
    return [{ id: `item-${Date.now()}`, name: "", price: "", quantity: 1, assignedTo: [] }];
  });

  // Friends State
  const [friends, setFriends] = useState(() => {
    if (initialValues?.members && initialValues.members.length > 0) {
      return initialValues.members.map((m, i) => ({
        id: `friend-${i}`,
        name: m.friendName,
        isUser: m.isUser || false,
      }));
    }
    return [{ id: 'user', name: authUser?.name ? `${authUser.name} (Saya)` : tr('Saya (Pembuat)', 'Saya (Pembuat)'), isUser: true }];
  });
  const [newFriendName, setNewFriendName] = useState("");

  useEffect(() => {
    const fetchWallets = async () => {
      try {
        const data = await getWallets();
        setWallets(data);
        if (data.length > 0 && !walletId) {
          setWalletId(data[0].id);
        }
      } catch (error) {
        console.error("Failed to fetch wallets:", error);
      }
    };
    void fetchWallets();
  }, [walletId]);

  // Handlers for Items
  const handleAddItem = () => setItems(prev => [...prev, { id: `item-${Date.now()}`, name: "", price: "", quantity: 1, assignedTo: [] }]);
  const handleRemoveItem = (id) => items.length > 1 && setItems(prev => prev.filter(item => item.id !== id));
  const updateItem = (id, field, value) => setItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));

  // Handlers for Friends
  const handleAddFriend = () => {
    if (!newFriendName.trim()) return;
    setFriends(prev => [...prev, { id: `friend-${Date.now()}`, name: newFriendName.trim(), isUser: false }]);
    setNewFriendName("");
  };
  const handleRemoveFriend = (id) => {
    setFriends(prev => prev.filter(f => f.id !== id));
    setItems(prev => prev.map(item => ({ ...item, assignedTo: item.assignedTo.filter(aid => aid !== id) })));
  };
  const toggleItemAssignment = (itemId, friendId) => {
    setItems(prev => prev.map(item => {
      if (item.id !== itemId) return item;
      const isAssigned = item.assignedTo.includes(friendId);
      return { ...item, assignedTo: isAssigned ? item.assignedTo.filter(id => id !== friendId) : [...item.assignedTo, friendId] };
    }));
  };

  const calculatedTotal = items.reduce((sum, item) => sum + ((Number(item.price) || 0) * (Number(item.quantity) || 1)), 0);

  // Stepper Navigation
  const nextStep = () => {
    setErrorMessage("");
    if (currentStep === 1) {
      if (!title.trim()) return setErrorMessage(tr("Silakan isi judul tagihan.", "Please fill the bill title."));
      for (const item of items) {
        if (!item.name.trim() || !Number(item.price)) return setErrorMessage(tr("Semua item harus memiliki nama dan harga valid.", "All items must have valid name and price."));
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (friends.length === 0) return setErrorMessage(tr("Tambahkan minimal 1 peserta.", "Add at least 1 participant."));
      for (const item of items) {
        if (item.assignedTo.length === 0) return setErrorMessage(tr(`Item "${item.name}" belum ditugaskan ke siapapun.`, `Item "${item.name}" has no assignments.`));
      }
      setCurrentStep(3);
    } else if (currentStep === 3) {
      handleSave();
    }
  };
  
  const prevStep = () => {
    setErrorMessage("");
    setCurrentStep(prev => prev - 1);
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    setErrorMessage("");

    if (syncToPersonal && (!walletId || walletId === "")) {
      setErrorMessage(t("pleaseSelectWallet", "Silakan pilih dompet terlebih dahulu."));
      setIsSubmitting(false);
      return;
    }

    const totalAmount = convertToIdr(calculatedTotal, settings.currency);
    const descriptionStr = JSON.stringify({ note: note.trim(), paymentInfo: paymentInfo.trim() });

    const payload = {
      title: title.trim(),
      description: descriptionStr,
      totalAmount,
      syncToPersonal,
      walletId: syncToPersonal ? Number(walletId) : undefined,
      members: friends.map(f => ({ clientId: f.id, friendName: f.name, isUser: f.isUser })),
      items: items.map(item => ({
        itemName: item.name.trim(),
        price: convertToIdr(Number(item.price), settings.currency),
        quantity: Number(item.quantity) || 1,
        assignedTo: item.assignedTo
      }))
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

      if (savedData) {
        const shareId = (savedData.id * 792384).toString(36);
        setPublicUrl(`${window.location.origin}/split/${shareId}`);
        setCurrentStep(4);
        onSuccess?.(savedData);
      }
    } catch (error) {
      setErrorMessage(error.message || t("failedToSave", "Failed to save data"));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render Step Content
  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="mb-4">
        <label className="mb-2 block text-[11px] font-black uppercase tracking-wide text-[#1c1c13]">
          {tr("Title", "Judul Tagihan")}
        </label>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder={tr("Example: Dinner at Sushi Tei", "Contoh: Makan di Sushi Tei")}
          className="min-h-12 w-full rounded-lg border-2 border-[#1c1c13] bg-white px-4 font-bold text-[#1c1c13] shadow-[2px_2px_0_#1c1c13] outline-none focus:border-[#6366f1] transition-all"
        />
      </div>

      <div className="flex justify-between items-end border-b-2 border-gray-200 pb-2 mb-4">
         <h3 className="text-[11px] font-black uppercase tracking-wide text-[#1c1c13]">Daftar Menu (Items)</h3>
         <div className="text-right">
           <p className="text-[10px] font-black uppercase text-gray-500">{tr("Subtotal", "Subtotal")}</p>
           <p className="text-lg font-black text-[#4648d4]">{formatCurrencyValue(convertToIdr(calculatedTotal, settings.currency), language, settings.currency)}</p>
         </div>
      </div>

      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.id} className="relative rounded-xl border-2 border-[#1c1c13] bg-[#fffbeb] p-4 shadow-[2px_2px_0_#1c1c13]">
            {items.length > 1 && (
              <button type="button" onClick={() => handleRemoveItem(item.id)} className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border-2 border-[#1c1c13] bg-[#ef4444] text-white shadow-[2px_2px_0_#1c1c13] hover:scale-110">
                <span className="material-symbols-outlined text-[14px] font-black">close</span>
              </button>
            )}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <label className="text-[10px] font-black uppercase text-[#1c1c13]">{tr("Item Name", "Nama Menu")}</label>
                <input value={item.name} onChange={e => updateItem(item.id, 'name', e.target.value)} className="mt-1 min-h-10 w-full rounded-lg border-2 border-[#1c1c13] bg-white px-3 text-sm font-bold text-[#1c1c13] outline-none focus:border-[#6366f1]" />
              </div>
              <div className="w-full sm:w-20">
                <label className="text-[10px] font-black uppercase text-[#1c1c13]">{tr("Qty", "Jml")}</label>
                <input type="number" min="1" value={item.quantity} onChange={e => updateItem(item.id, 'quantity', e.target.value)} className="mt-1 min-h-10 w-full rounded-lg border-2 border-[#1c1c13] bg-white px-3 text-sm font-bold text-[#1c1c13] outline-none focus:border-[#6366f1]" />
              </div>
              <div className="w-full sm:w-32">
                <label className="text-[10px] font-black uppercase text-[#1c1c13]">{tr("Price", "Harga")}</label>
                <input type="number" min="0" value={item.price} onChange={e => updateItem(item.id, 'price', e.target.value)} className="mt-1 min-h-10 w-full rounded-lg border-2 border-[#1c1c13] bg-white px-3 text-sm font-bold text-[#1c1c13] outline-none focus:border-[#6366f1]" />
              </div>
            </div>
          </div>
        ))}
      </div>
      <button type="button" onClick={handleAddItem} className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#1c1c13] bg-white p-3 text-sm font-black uppercase hover:bg-[#ffc329] transition-all">
        <span className="material-symbols-outlined">add_circle</span> Tambah Menu
      </button>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="rounded-xl border-2 border-[#1c1c13] bg-white p-5 shadow-[2px_2px_0_#1c1c13]">
        <h3 className="mb-3 text-[11px] font-black uppercase tracking-wide text-[#1c1c13]">{tr("Add Participants", "Tambah Peserta")}</h3>
        <div className="flex gap-2 mb-4">
          <input value={newFriendName} onChange={e => setNewFriendName(e.target.value)} onKeyDown={e => { if(e.key === 'Enter') handleAddFriend(); }} placeholder="Nama Teman" className="min-h-10 w-full rounded-lg border-2 border-[#1c1c13] bg-white px-3 text-sm font-bold outline-none focus:border-[#6366f1]" />
          <button type="button" onClick={handleAddFriend} className="h-10 w-10 shrink-0 flex items-center justify-center rounded-lg border-2 border-[#1c1c13] bg-[#6366f1] text-white shadow-[2px_2px_0_#1c1c13]">
            <span className="material-symbols-outlined font-black">add</span>
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {friends.map(friend => (
            <div key={friend.id} className={`flex items-center gap-2 rounded-full border-2 border-[#1c1c13] ${friend.isUser ? 'bg-[#ffc329]' : 'bg-[#fffbeb]'} px-3 py-1 text-xs font-black shadow-[2px_2px_0_#1c1c13]`}>
              <span>{friend.name}</span>
              {!friend.isUser && (
                <button type="button" onClick={() => handleRemoveFriend(friend.id)} className="h-4 w-4 bg-[#ef4444] text-white rounded-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-[10px] font-black">close</span>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2">
        <h3 className="text-[11px] font-black uppercase tracking-wide text-[#1c1c13]">Siapa makan apa?</h3>
        {items.map(item => (
          <div key={item.id} className="rounded-xl border-2 border-[#1c1c13] bg-white p-4 shadow-[2px_2px_0_#1c1c13]">
            <div className="flex justify-between items-center mb-3">
              <span className="font-bold text-[#1c1c13]">{item.name} <span className="text-gray-500 text-xs">x{item.quantity}</span></span>
              <span className="font-black text-[#ba1a1a]">{formatCurrencyValue(convertToIdr(item.price * item.quantity, settings.currency), language, settings.currency)}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {friends.map(friend => {
                const isSelected = item.assignedTo.includes(friend.id);
                return (
                  <button key={friend.id} type="button" onClick={() => toggleItemAssignment(item.id, friend.id)} className={`flex items-center gap-1 rounded-lg border-2 border-[#1c1c13] px-3 py-1.5 text-xs font-black ${isSelected ? 'bg-[#22c55e] text-white shadow-[2px_2px_0_#1c1c13]' : 'bg-gray-100 text-gray-500'}`}>
                    {isSelected && <span className="material-symbols-outlined text-[14px]">check</span>}
                    {friend.name}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="rounded-xl border-2 border-[#1c1c13] bg-white p-5 shadow-[2px_2px_0_#1c1c13]">
        <h3 className="mb-4 text-[11px] font-black uppercase tracking-wide text-[#1c1c13]">{tr("Additional Info", "Informasi Tambahan")}</h3>
        
        <div className="mb-4">
          <label className="text-[10px] font-black uppercase text-[#1c1c13] block mb-2">{tr("Payment Instructions", "Nomor Rekening / E-Wallet (Untuk ditampilkan di link)")}</label>
          <textarea value={paymentInfo} onChange={e => setPaymentInfo(e.target.value)} placeholder={tr("BCA 12345678 a.n John Doe", "BCA 12345678 a.n John Doe")} className="min-h-10 w-full rounded-lg border-2 border-[#1c1c13] px-3 py-2 text-sm font-bold outline-none focus:border-[#6366f1]" rows={2} />
        </div>
        
        <div className="mb-4">
          <label className="text-[10px] font-black uppercase text-[#1c1c13] block mb-2">{tr("Additional Note", "Catatan Tambahan")}</label>
          <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Catatan opsional..." className="min-h-10 w-full rounded-lg border-2 border-[#1c1c13] px-3 py-2 text-sm font-bold outline-none focus:border-[#6366f1]" rows={2} />
        </div>
      </div>

      <div className="rounded-xl border-2 border-[#1c1c13] bg-[#fffbeb] p-5 shadow-[2px_2px_0_#1c1c13]">
        <div className="flex items-center gap-3">
          <input type="checkbox" id="sync" checked={syncToPersonal} onChange={e => setSyncToPersonal(e.target.checked)} className="h-5 w-5 rounded border-2 border-[#1c1c13] accent-[#6366f1]" />
          <label htmlFor="sync" className="text-sm font-bold text-[#1c1c13]">
            {tr("I paid at the cashier (Deduct my portion from Wallet)", "Saya menalangi tagihan (Potong porsi saya dari Dompet)")}
          </label>
        </div>
        {syncToPersonal && (
          <div className="mt-4 pt-4 border-t-2 border-dashed border-gray-300">
            <select value={walletId} onChange={e => e.target.value === "NEW" ? setShowWalletModal(true) : setWalletId(e.target.value)} className="min-h-12 w-full rounded-lg border-2 border-[#1c1c13] bg-white px-4 font-bold text-[#1c1c13] outline-none focus:border-[#6366f1]">
              <option value="" disabled>Pilih Dompet</option>
              {wallets.map(w => <option key={w.id} value={w.id}>{w.name} ({formatCurrencyValue(w.balance, language, settings.currency)})</option>)}
              <option value="NEW">+ Tambah Dompet Baru</option>
            </select>
          </div>
        )}
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="flex flex-col items-center justify-center p-6 text-center space-y-6">
      <div className="h-20 w-20 rounded-full border-4 border-[#1c1c13] bg-[#22c55e] flex items-center justify-center text-white shadow-[4px_4px_0_#1c1c13]">
        <span className="material-symbols-outlined text-4xl font-black">check</span>
      </div>
      <h2 className="text-2xl font-black text-[#1c1c13]">Tagihan Berhasil Dibuat!</h2>
      <p className="text-sm font-bold text-gray-600">Bagikan link di bawah ini agar teman-teman Anda bisa melihat jumlah yang harus dibayar.</p>
      
      <div className="w-full relative group flex items-center gap-2">
        <input readOnly value={publicUrl} className="flex-1 min-h-12 rounded-lg border-2 border-[#1c1c13] bg-[#fdf9e9] p-2 px-4 font-bold text-[#4648d4] outline-none" />
        <button onClick={() => { navigator.clipboard.writeText(publicUrl); alert("Link disalin!"); }} className="h-12 px-4 rounded-lg border-2 border-[#1c1c13] bg-[#1c1c13] text-white font-bold hover:bg-gray-800 transition-all flex items-center justify-center">
          <span className="material-symbols-outlined text-sm mr-2">content_copy</span> Copy
        </button>
      </div>

      <button type="button" onClick={onClose} className="mt-4 min-h-12 w-full rounded-lg border-2 border-[#1c1c13] bg-[#ffc329] px-4 font-black text-[#1c1c13] shadow-[2px_2px_0_#1c1c13] hover:-translate-y-0.5 active:translate-y-0 transition-all">
        Selesai
      </button>
    </div>
  );

  return (
    <>
      <div className="fixed inset-0 z-40 bg-[#1c1c13]/40 backdrop-blur-sm" onClick={() => currentStep !== 4 && onClose()} />
      <div className="fixed inset-x-4 bottom-4 top-4 z-50 flex items-center justify-center lg:inset-0 lg:p-4">
        <div className="relative flex h-full max-h-[90vh] w-full flex-col rounded-2xl border-4 border-[#1c1c13] bg-[#fdf9e9] shadow-[8px_8px_0_#1c1c13] lg:max-h-[85vh] lg:max-w-2xl">
          
          {currentStep !== 4 && (
            <div className="flex shrink-0 items-center justify-between border-b-4 border-[#1c1c13] p-4 lg:p-6 bg-white rounded-t-xl">
              <div>
                <h2 className="text-xl font-black uppercase tracking-tight text-[#1c1c13]">
                  {isEditingSplit ? t("editSplitBill", "Edit Split Bill") : tr("Create Split Bill", "Buat Tagihan Baru")}
                </h2>
                <div className="flex gap-1 mt-2">
                  {[1, 2, 3].map(step => (
                    <div key={step} className={`h-2 w-8 rounded-full border-2 border-[#1c1c13] ${currentStep >= step ? 'bg-[#6366f1]' : 'bg-gray-200'}`} />
                  ))}
                </div>
              </div>
              <button onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-[#1c1c13] bg-[#ffc329] text-[#1c1c13] shadow-[2px_2px_0_#1c1c13]">
                <span className="material-symbols-outlined font-black">close</span>
              </button>
            </div>
          )}

          {errorMessage && (
            <div className="m-4 mb-0 rounded-xl border-2 border-[#1c1c13] bg-[#fef2f2] p-4 shadow-[4px_4px_0_#ef4444]">
              <p className="text-sm font-bold text-[#ef4444]">{errorMessage}</p>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-4 lg:p-6">
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
            {currentStep === 4 && renderStep4()}
          </div>

          {currentStep !== 4 && (
            <div className="shrink-0 border-t-4 border-[#1c1c13] bg-white p-4 lg:p-6 flex gap-4 rounded-b-xl">
              {currentStep > 1 ? (
                <button type="button" onClick={prevStep} disabled={isSubmitting} className="min-h-12 w-full rounded-lg border-2 border-[#1c1c13] bg-white px-4 font-black text-[#1c1c13] shadow-[2px_2px_0_#1c1c13] hover:-translate-y-0.5 transition-all">
                  Kembali
                </button>
              ) : (
                <button type="button" onClick={onClose} disabled={isSubmitting} className="min-h-12 w-full rounded-lg border-2 border-[#1c1c13] bg-white px-4 font-black text-[#1c1c13] shadow-[2px_2px_0_#1c1c13] hover:-translate-y-0.5 transition-all">
                  Batal
                </button>
              )}
              
              <button type="button" onClick={nextStep} disabled={isSubmitting} className="min-h-12 w-full rounded-lg border-2 border-[#1c1c13] bg-[#6366f1] px-4 font-black text-white shadow-[2px_2px_0_#1c1c13] hover:-translate-y-0.5 transition-all">
                {currentStep === 3 ? (isSubmitting ? 'Menyimpan...' : 'Simpan & Bagikan') : 'Lanjut'}
              </button>
            </div>
          )}
        </div>
      </div>

      {showWalletModal && (
        <ManageWalletModal
          onClose={() => setShowWalletModal(false)}
          onSuccess={(wallet) => { setShowWalletModal(false); getWallets().then(setWallets); setWalletId(wallet.id); }}
          wallets={wallets}
        />
      )}
    </>
  );
}

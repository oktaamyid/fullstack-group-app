import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { formatCurrency } from '../../services/currency';
import { useI18n } from '../../i18n/useI18n';

export function PublicSplitBillScreen() {
  const { id } = useParams();
  const { language } = useI18n();
  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Dummy settings for currency if not logged in
  const currency = 'IDR'; 

  useEffect(() => {
    const fetchBill = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/public/split-bills/${id}`);
        const data = await response.json();
        if (data.success) {
          setBill(data.data.splitBill);
        } else {
          setError('Split bill not found');
        }
      } catch {
        setError('Failed to load split bill');
      } finally {
        setLoading(false);
      }
    };
    fetchBill();
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fdf9e9]">
        <p className="text-xl font-black text-[#1c1c13]">Loading...</p>
      </div>
    );
  }

  if (error || !bill) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#fdf9e9] p-4 text-center">
        <span className="material-symbols-outlined mb-4 text-6xl text-red-500">error</span>
        <h1 className="mb-2 text-2xl font-black text-[#1c1c13]">Tagihan Tidak Ditemukan</h1>
        <p className="mb-8 font-bold text-gray-500">Mungkin tagihan ini sudah dihapus atau linknya salah.</p>
        <Link to="/" className="rounded-xl border-2 border-[#1c1c13] bg-[#ffc329] px-6 py-3 font-black text-[#1c1c13] shadow-[4px_4px_0_#1c1c13] hover:-translate-y-1 active:translate-y-0 transition-all">
          Kembali ke Beranda LIVO
        </Link>
      </div>
    );
  }
  
  let paymentInfo = '';
  let descriptionText = bill.description || '';
  try {
     const parsed = JSON.parse(bill.description);
     if (parsed && typeof parsed === 'object') {
       paymentInfo = parsed.paymentInfo || '';
       descriptionText = parsed.note || '';
     }
  } catch {
     // Ignore, it's just a normal string
  }

  return (
    <div className="min-h-screen bg-[#fdf9e9] px-4 py-8 lg:py-12 flex justify-center">
      <div className="w-full max-w-2xl space-y-6">
        
        {/* Header / Brand */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black tracking-tight text-[#1c1c13] uppercase">
            LIVO <span className="text-[#6366f1]">Split</span>
          </h1>
          <p className="text-sm font-bold text-gray-500 mt-1 uppercase tracking-widest">
            Tagihan Patungan
          </p>
        </div>

        {/* Bill Summary Card */}
        <div className="rounded-2xl border-4 border-[#1c1c13] bg-white p-6 lg:p-8 shadow-[8px_8px_0_#1c1c13]">
          <div className="flex items-start justify-between border-b-4 border-[#1c1c13] pb-6 mb-6">
            <div>
              <h2 className="text-2xl lg:text-3xl font-black text-[#1c1c13] uppercase">{bill.title}</h2>
              <p className="mt-2 text-sm font-bold text-gray-500">
                Dibuat oleh <span className="text-[#1c1c13]">{bill.user?.name}</span> pada {new Date(bill.createdAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <div className="text-right">
               <p className="text-[10px] font-black uppercase text-gray-500 tracking-wider">Total Tagihan</p>
               <p className="text-2xl lg:text-3xl font-black text-[#ba1a1a]">
                 {formatCurrency(bill.totalAmount, language, currency)}
               </p>
            </div>
          </div>

          {descriptionText && (
            <div className="mb-8 rounded-xl border-2 border-dashed border-[#1c1c13] bg-[#fffbeb] p-4 text-sm font-bold text-[#1c1c13]">
              {descriptionText}
            </div>
          )}

          <div className="space-y-6">
            <h3 className="text-sm font-black uppercase tracking-wider text-[#1c1c13] flex items-center gap-2">
              <span className="material-symbols-outlined">receipt_long</span>
              Rincian Pembagian
            </h3>
            
            <div className="grid gap-4 sm:grid-cols-2">
              {bill.members.map(member => (
                <div key={member.id} className="relative overflow-hidden rounded-xl border-2 border-[#1c1c13] bg-[#fdf9e9] p-4 shadow-[4px_4px_0_#1c1c13]">
                  {member.isUser && (
                    <div className="absolute right-0 top-0 rounded-bl-xl border-b-2 border-l-2 border-[#1c1c13] bg-[#ffc329] px-2 py-1 text-[10px] font-black uppercase text-[#1c1c13]">
                      Pembuat Tagihan
                    </div>
                  )}
                  <h4 className="text-lg font-black text-[#1c1c13] mb-1">{member.friendName}</h4>
                  <p className="text-xl font-black text-[#6366f1] mb-3">{formatCurrency(member.amount, language, currency)}</p>
                  
                  {member.itemAssignments?.length > 0 && (
                    <div className="mt-3 border-t-2 border-dashed border-gray-300 pt-3">
                      <p className="text-[10px] font-black uppercase text-gray-500 mb-2">Item yang dipesan:</p>
                      <ul className="space-y-1">
                        {member.itemAssignments.map(assignment => {
                          const item = bill.items.find(i => i.id === assignment.itemId);
                          return item ? (
                            <li key={assignment.id} className="text-xs font-bold text-gray-600 flex justify-between">
                              <span>{item.itemName}</span>
                            </li>
                          ) : null;
                        })}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          {paymentInfo && (
            <div className="mt-8 rounded-xl border-4 border-[#1c1c13] bg-[#e0e7ff] p-6 shadow-[4px_4px_0_#1c1c13]">
              <h3 className="text-sm font-black uppercase tracking-wider text-[#1c1c13] flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined">account_balance</span>
                Info Pembayaran / Transfer
              </h3>
              <p className="text-lg font-bold text-[#1c1c13] whitespace-pre-wrap">{paymentInfo}</p>
            </div>
          )}
        </div>
        
        <div className="text-center pb-8">
           <p className="text-xs font-bold text-gray-400">Dibuat menggunakan aplikasi LIVO.</p>
        </div>
      </div>
    </div>
  );
}

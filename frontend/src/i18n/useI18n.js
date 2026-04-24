import { useCallback, useEffect, useState } from 'react'
import { getAuthUser } from '../services/auth'
import { getLocalSettings } from '../services/profileSettings'

const translations = {
  'id-ID': {
    dashboard: 'Dashboard',
    searchPlaceholder: 'Cari...',
    addTransaction: 'Tambah Transaksi',
    settings: 'Pengaturan',
    refresh: 'Muat Ulang',
    back: 'Kembali',
    home: 'Beranda',
    history: 'Riwayat',
    transactions: 'Transaksi',
    wishlist: 'Wishlist',
    profile: 'Profil',
    createSplitBill: 'Buat Split Bill',
    syncingAchievements: 'Menyinkronkan progres...',
    levelUp: 'Naik level',
    yourAcademicCoinMaster: 'Teman Finansial Akademikmu',
    welcomeBack: 'Selamat Datang Kembali',
    createAccount: 'Buat Akun',
    profileSettings: 'Profil & Pengaturan',
    startYourBudgetJourney: 'Mulai perjalanan budgetingmu.',
    signInToContinue: 'Masuk untuk melanjutkan pengelolaan budget.',
    pleaseCompleteRequiredFields: 'Mohon lengkapi semua field wajib.',
    fullName: 'Nama Lengkap',
    yourName: 'Nama kamu',
    emailAddress: 'Alamat Email',
    password: 'Kata Sandi',
    signIn: 'Masuk',
    submitting: 'Memproses...',
    alreadyHaveAccount: 'Sudah punya akun?',
    needAccount: 'Belum punya akun?',
    register: 'Daftar',
    login: 'Masuk',
    analyticsTrends: 'Analytics & Tren',
    loadingAnalytics: 'Memuat analytics...',
    totalSpent: 'Total Pengeluaran',
    avgPerDay: 'Rata/hari',
    topCategory: 'Kategori teratas',
    ofTotalBudget: 'dari total budget',
    savingsGoal: 'Target Tabungan',
    weeklySpend: 'Belanja Mingguan',
    recentReports: 'Laporan Terbaru',
    all: 'Semua',
    category: 'kategori',
    noReportsYet: 'Belum ada laporan. Tambahkan split bill untuk melihat analytics.',
    noReportsInCategory: 'Tidak ada laporan pada kategori',
    noData: 'Belum ada data',
    activeLimit: 'Batas Aktif',
    dailySpendingLimit: 'Batas Belanja Harian',
    backend: 'Backend',
    database: 'Database',
    offlineMode: 'Mode Offline',
    liveSync: 'Sinkron Langsung',
    todayProgress: 'Progres Hari Ini',
    efficiencyScore: 'Skor Efisiensi',
    recentActivity: 'Aktivitas Terbaru',
    historyAndSplit: 'Riwayat & Split',
    incomeTransaction: 'Transaksi Pemasukan',
    expenseTransaction: 'Transaksi Pengeluaran',
    other: 'Lainnya',
    noFinancialActivity: 'Belum ada aktivitas keuangan.',
    financialMilestone: 'Pencapaian Finansial',
    viewProgress: 'Lihat Progres',
    connectionSnapshot: 'Snapshot Koneksi',
    lastChecked: 'Terakhir dicek',
    income: 'Pemasukan',
    expense: 'Pengeluaran',
    netBalance: 'Saldo Bersih',
    list: 'Daftar',
    add: 'Tambah',
    update: 'Perbarui',
    save: 'Simpan',
    saving: 'Menyimpan...',
    updating: 'Memperbarui...',
    updatePassword: 'Perbarui Kata Sandi',
    saveProfile: 'Simpan Profil',
    currency: 'Mata Uang',
    language: 'Bahasa',
    categoryType: 'Tipe Kategori',
    newCategoryName: 'Nama Kategori Baru',
    iconOrEmoji: 'Ikon atau Emoji',
    addCategory: 'Tambah Kategori',
    categories: 'Kategori',
    historySplitBill: 'Riwayat & Split Bill',
    totalSplit: 'Total Split',
    unpaid: 'Belum Dibayar',
    paid: 'Sudah Dibayar',
    financeInsights: 'Insight Keuangan',
    topCategoryLabel: 'Kategori Teratas',
    last6Days: '6 Hari Terakhir',
    noWeeklyTrendData: 'Belum ada data tren mingguan.',
    splitBill: 'Split Bill',
    editSplitBill: 'Ubah Split Bill',
    newSplitBill: 'Buat Split Bill Baru',
    updateSplit: 'Perbarui Split',
    saveSplit: 'Simpan Split',
    resetForm: 'Reset Form',
    splitBillHistory: 'Riwayat Split Bill',
    markPaid: 'Tandai Lunas',
    markUnpaid: 'Tandai Belum Lunas',
    edit: 'Ubah',
    delete: 'Hapus',
    splitBills: 'Split Bills',
    manageSharedExpenses: 'Kelola pengeluaran bersama',
    newSplit: 'Split Baru',
    noActiveSplitBills: 'Belum ada split bill aktif',
    createFirstSplit: 'Buat split pertama kamu untuk mulai',
    settled: 'Lunas',
    pending: 'Menunggu',
    settle: 'Lunasi',
    myWishlist: 'Wishlist Saya',
    hamsterSuggestion: 'Saran Hamster',
    totalSaved: 'Total Tersimpan',
    nextGoal: 'Target Berikutnya',
    activeGoal: 'Target Aktif',
    setPriority: 'Atur Prioritas',
    balance: 'Saldo',
    goal: 'Target',
    addWishlistItem: 'Tambah Item Wishlist',
    editWishlistItem: 'Ubah Item Wishlist',
    itemName: 'Nama item',
    noItemYet: 'Belum ada item',
    priority: 'Prioritas',
    price: 'Harga',
    addTransactionModalTitle: 'Tambah Transaksi',
    type: 'Tipe',
    category: 'Kategori',
    amount: 'Jumlah',
    descriptionOptional: 'Deskripsi (opsional)',
    date: 'Tanggal',
    createTransaction: 'Buat Transaksi',
    cancel: 'Batal',
    createSplit: 'Buat Split',
    title: 'Judul',
    description: 'Deskripsi',
    totalAmount: 'Total Tagihan',
    friendsOnePerLine: 'Teman (1 per baris)',
    creating: 'Membuat...',
    pleaseEnterValidAmount: 'Masukkan nominal yang valid',
    transactionCreatedSuccessfully: 'Transaksi berhasil dibuat!',
    failedToCreateTransaction: 'Gagal membuat transaksi',
    whatTransactionAbout: 'Transaksi ini untuk apa?',
    pleaseAddAtLeastOneFriend: 'Tambahkan minimal satu teman',
    splitExpense: 'Split Pengeluaran',
    failedToCreateSplitBill: 'Gagal membuat split bill',
  },
  'en-US': {},
}

function resolveLanguage() {
  const authUser = getAuthUser()
  const settings = getLocalSettings(authUser?.id || 'guest')
  return settings.language === 'en-US' ? 'en-US' : 'id-ID'
}

export function useI18n() {
  const [language, setLanguage] = useState(resolveLanguage)

  useEffect(() => {
    const syncLanguage = () => {
      setLanguage(resolveLanguage())
    }

    window.addEventListener('storage', syncLanguage)
    window.addEventListener('livo:settings-updated', syncLanguage)

    return () => {
      window.removeEventListener('storage', syncLanguage)
      window.removeEventListener('livo:settings-updated', syncLanguage)
    }
  }, [])

  const locale = translations[language] || {}
  const fallbackEnglish = translations['en-US'] || {}

  const t = useCallback(
    (key, fallback = '') => {
      return locale[key] || fallbackEnglish[key] || fallback || key
    },
    [fallbackEnglish, locale]
  )

  return { language, t }
}

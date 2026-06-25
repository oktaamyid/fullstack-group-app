/* eslint-disable react-hooks/exhaustive-deps */
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { clearAuthSession, getAuthToken, getAuthUser, saveAuthSession } from '../../services/auth'
import {
  addCategorySetting,
  fetchProfile,
  getCategoryIcon,
  getLocalSettings,
  isDefaultCategory,
  removeCategorySetting,
  saveLocalSettings,
  SUPPORTED_CURRENCIES,
  updatePassword,
  updateProfile,
} from '../../services/profileSettings'
import { PageLayout } from '../layouts/PageLayout'
import { PageHeader } from '../headers/PageHeader'
import { Alert } from '../ui/Alert'
import { Button } from '../ui/Button'
import { useI18n } from '../../i18n/useI18n'

const defaultProfileForm = {
  name: '',
  email: '',
}

const defaultPasswordForm = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
}

const CURRENCY_LABELS = {
  IDR: 'IDR - Indonesian Rupiah',
  USD: 'USD - US Dollar',
  SGD: 'SGD - Singapore Dollar',
  EUR: 'EUR - Euro',
}

const CURRENCY_OPTIONS = SUPPORTED_CURRENCIES.map((currency) => ({
  value: currency,
  label: CURRENCY_LABELS[currency] || currency,
}))

const LANGUAGE_OPTIONS = [
  { value: 'id-ID', label: 'Bahasa Indonesia' },
  { value: 'en-US', label: 'English (US)' },
]

function prettifyCategory(key = '') {
  return key
    .toLowerCase()
    .split('_')
    .map((part) => (part ? `${part[0].toUpperCase()}${part.slice(1)}` : ''))
    .join(' ')
}

function ToggleSetting({ label, description, checked, onChange }) {
  return (
    <label className="flex min-h-11 items-center justify-between gap-3 rounded-xl border-2 border-[#1c1c13] bg-[#fffbeb] px-4 py-3 shadow-[4px_4px_0_#1c1c13] hover:-translate-y-0.5 active:translate-y-0 transition-transform cursor-pointer">
      <div>
        <p className="text-sm font-black text-[#1c1c13]">{label}</p>
        <p className="text-[11px] font-bold text-[#1c1c13]">{description}</p>
      </div>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-5 w-5 rounded border-2 border-[#1c1c13] accent-[#6366f1] shadow-[2px_2px_0_#1c1c13] focus:ring-[#6366f1]"
      />
    </label>
  )
}

export function ProfileSettingsScreen({ mainLogo }) {
  const { t, language } = useI18n()
  const tr = useCallback((en, id) => (language === 'id-ID' ? id : en))
  const navigate = useNavigate()
  const authUser = getAuthUser()
  const [isLoading, setIsLoading] = useState(true)
  const [profileForm, setProfileForm] = useState(defaultProfileForm)
  const [passwordForm, setPasswordForm] = useState(defaultPasswordForm)
  const [settings, setSettings] = useState(getLocalSettings(authUser?.id || 'guest'))
  const [isProfileSubmitting, setIsProfileSubmitting] = useState(false)
  const [isPasswordSubmitting, setIsPasswordSubmitting] = useState(false)
  const [categoryForm, setCategoryForm] = useState({ label: '', icon: '' })
  const [categoryTab, setCategoryTab] = useState('EXPENSE')
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const loadProfile = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage('')

    try {
      const data = await fetchProfile()
      setProfileForm({
        name: data.user.name || '',
        email: data.user.email || '',
      })
      setSettings(getLocalSettings(data.user.id))
    } catch (error) {
      if (error.message.toLowerCase().includes('unauthorized')) {
        clearAuthSession()
        navigate('/login', { replace: true })
        return
      }
      setErrorMessage(error.message)
    } finally {
      setIsLoading(false)
    }
  }, [navigate])

  useEffect(() => {
    void loadProfile()
  }, [loadProfile])

  const onProfileChange = useCallback((event) => {
    const { name, value } = event.target
    setProfileForm((prev) => ({ ...prev, [name]: value }))
  }, [])

  const onPasswordChange = useCallback((event) => {
    const { name, value } = event.target
    setPasswordForm((prev) => ({ ...prev, [name]: value }))
  }, [])

  const onSaveProfile = useCallback(
    async (event) => {
      event.preventDefault()
      setErrorMessage('')
      setMessage('')
      setIsProfileSubmitting(true)

      try {
        const data = await updateProfile({
          name: profileForm.name,
          email: profileForm.email,
        })

        const currentToken = getAuthToken()
        if (currentToken) {
          saveAuthSession(currentToken, {
            id: data.user.id,
            name: data.user.name,
            email: data.user.email,
          })
        }

        setMessage(tr('Profile updated successfully.', 'Profil berhasil diperbarui.'))
      } catch (error) {
        setErrorMessage(error.message)
      } finally {
        setIsProfileSubmitting(false)
      }
    },
    [profileForm.email, profileForm.name, tr]
  )

  const onSavePassword = useCallback(async (event) => {
    event.preventDefault()
    setErrorMessage('')
    setMessage('')

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setErrorMessage(tr('New password and confirmation password must match.', 'Password baru dan konfirmasi harus sama.'))
      return
    }

    setIsPasswordSubmitting(true)

    try {
      await updatePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      })
      setPasswordForm(defaultPasswordForm)
      setMessage(tr('Password updated successfully.', 'Password berhasil diperbarui.'))
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setIsPasswordSubmitting(false)
    }
  }, [passwordForm.confirmPassword, passwordForm.currentPassword, passwordForm.newPassword, tr])

  const onToggleSetting = useCallback(
    (field) => {
      setSettings((prev) => {
        const next = {
          ...prev,
          [field]: !prev[field],
        }

        if (authUser?.id) {
          saveLocalSettings(authUser.id, next)
        }

        return next
      })
    },
    [authUser?.id]
  )

  const onConfigChange = useCallback(
    (field, value) => {
      setSettings((prev) => {
        const next = {
          ...prev,
          [field]: value,
        }

        if (authUser?.id) {
          saveLocalSettings(authUser.id, next)
        }

        return next
      })
      setMessage(tr('Configuration updated.', 'Konfigurasi berhasil diperbarui.'))
      setErrorMessage('')
    },
    [authUser.id, tr]
  )

  const onAddCategory = useCallback(
    (event) => {
      event.preventDefault()
      setErrorMessage('')

      if (!authUser?.id) {
        setErrorMessage(tr('Unable to save category. Please login again.', 'Tidak bisa menyimpan kategori. Silakan login ulang.'))
        return
      }

      if (!categoryForm.label) {
        setErrorMessage(tr('Please enter a category name.', 'Harap masukkan nama kategori.'))
        return
      }

      try {
        const next = addCategorySetting(authUser.id, categoryTab, categoryForm.label, categoryForm.icon)
        setSettings(next)
        setCategoryForm((prev) => ({ ...prev, label: '', icon: '' }))
        setMessage(tr('Category added successfully.', 'Kategori berhasil ditambahkan.'))
      } catch (error) {
        setErrorMessage(error.message)
      }
    },
    [authUser?.id, categoryForm.icon, categoryForm.label, categoryTab, tr]
  )

  const onRemoveCategory = useCallback(
    (type, categoryKey) => {
      setErrorMessage('')

      if (!authUser?.id) {
        setErrorMessage(tr('Unable to save category. Please login again.', 'Tidak bisa menyimpan kategori. Silakan login ulang.'))
        return
      }

      try {
        const next = removeCategorySetting(authUser.id, type, categoryKey)
        setSettings(next)
        setMessage(tr('Category removed successfully.', 'Kategori berhasil dihapus.'))
      } catch (error) {
        setErrorMessage(error.message)
      }
    },
    [authUser?.id, tr]
  )

  const handleLogout = useCallback(() => {
    clearAuthSession()
    navigate('/login', { replace: true })
  }, [navigate])

  return (
    <PageLayout
      header={
        <PageHeader
          mainLogo={mainLogo}
          title={t('profileSettings', 'Profile & Settings')}
          backLink="/home"
        />
      }
      className="space-y-5 py-5 lg:grid lg:grid-cols-12 lg:gap-6 lg:space-y-0"
    >
        <section className="rounded-xl border-2 border-[#1c1c13] bg-[#fffbeb] p-6 shadow-[4px_4px_0_#1c1c13] lg:col-span-12">
          <p className="text-[11px] font-black uppercase text-[#1c1c13]">Your Account</p>
          <h2 className="mt-1 text-2xl font-black text-[#1c1c13]">{authUser?.name || 'Student'}</h2>
          <p className="text-sm font-black text-[#1c1c13]">{authUser?.email || '-'}</p>
        </section>

        {message ? (
          <div className="lg:col-span-12">
            <Alert type="success" onClose={() => setMessage('')}>
              {message}
            </Alert>
          </div>
        ) : null}

        {errorMessage ? (
          <div className="lg:col-span-12">
            <Alert type="error" onClose={() => setErrorMessage('')}>
              {errorMessage}
            </Alert>
          </div>
        ) : null}

        <section className="rounded-xl border-2 border-[#1c1c13] bg-white p-6 shadow-[4px_4px_0_#1c1c13] lg:col-span-6">
          <h3 className="mb-4 text-sm font-black uppercase text-[#1c1c13]">Edit Profile</h3>
          {isLoading ? (
            <p className="text-sm font-black text-[#1c1c13]">Loading profile...</p>
          ) : (
            <form className="space-y-4" onSubmit={onSaveProfile}>
              <label className="block text-[11px] font-black uppercase text-[#1c1c13]">
                Full Name
                <input
                  type="text"
                  name="name"
                  value={profileForm.name}
                  onChange={onProfileChange}
                  className="mt-1.5 min-h-11 w-full rounded-lg border-2 border-[#1c1c13] bg-white px-4 text-sm font-bold shadow-[2px_2px_0_#1c1c13] outline-none focus:border-[#6366f1]"
                />
              </label>

              <label className="block text-[11px] font-black uppercase text-[#1c1c13]">
                Email
                <input
                  type="email"
                  name="email"
                  value={profileForm.email}
                  onChange={onProfileChange}
                  className="mt-1.5 min-h-11 w-full rounded-lg border-2 border-[#1c1c13] bg-white px-4 text-sm font-bold shadow-[2px_2px_0_#1c1c13] outline-none focus:border-[#6366f1]"
                />
              </label>

              <Button
                type="submit"
                disabled={isProfileSubmitting}
                fullWidth
              >
                  {isProfileSubmitting ? t('saving', 'Saving...') : t('saveProfile', 'Save Profile')}
              </Button>
            </form>
          )}
        </section>

        <section className="rounded-xl border-2 border-[#1c1c13] bg-white p-6 shadow-[4px_4px_0_#1c1c13] lg:col-span-6">
          <h3 className="mb-4 text-sm font-black uppercase text-[#1c1c13]">Security</h3>
          <form className="space-y-4" onSubmit={onSavePassword}>
            <label className="block text-[11px] font-black uppercase text-[#1c1c13]">
              Current Password
              <input
                type="password"
                name="currentPassword"
                value={passwordForm.currentPassword}
                onChange={onPasswordChange}
                className="mt-1.5 min-h-11 w-full rounded-lg border-2 border-[#1c1c13] bg-white px-4 text-sm font-bold shadow-[2px_2px_0_#1c1c13] outline-none focus:border-[#6366f1]"
              />
            </label>

            <label className="block text-[11px] font-black uppercase text-[#1c1c13]">
              New Password
              <input
                type="password"
                name="newPassword"
                value={passwordForm.newPassword}
                onChange={onPasswordChange}
                className="mt-1.5 min-h-11 w-full rounded-lg border-2 border-[#1c1c13] bg-white px-4 text-sm font-bold shadow-[2px_2px_0_#1c1c13] outline-none focus:border-[#6366f1]"
              />
            </label>

            <label className="block text-[11px] font-black uppercase text-[#1c1c13]">
              Confirm New Password
              <input
                type="password"
                name="confirmPassword"
                value={passwordForm.confirmPassword}
                onChange={onPasswordChange}
                className="mt-1.5 min-h-11 w-full rounded-lg border-2 border-[#1c1c13] bg-white px-4 text-sm font-bold shadow-[2px_2px_0_#1c1c13] outline-none focus:border-[#6366f1]"
              />
            </label>

            <Button
              type="submit"
              variant="accent"
              disabled={isPasswordSubmitting}
              fullWidth
            >
              {isPasswordSubmitting ? t('updating', 'Updating...') : t('updatePassword', 'Update Password')}
            </Button>
          </form>
        </section>

        <section className="rounded-xl border-2 border-[#1c1c13] bg-white p-6 shadow-[4px_4px_0_#1c1c13] lg:col-span-12">
          <h3 className="mb-4 text-sm font-black uppercase text-[#1c1c13]">{tr('Preferences', 'Preferensi')}</h3>
          <div className="space-y-3">
            <ToggleSetting
              label={tr('Budget Alerts', 'Peringatan Budget')}
              description={tr('Get red alert when spending runway is low', 'Dapatkan peringatan saat budget harian hampir habis')}
              checked={settings.budgetAlerts}
              onChange={() => onToggleSetting('budgetAlerts')}
            />
            <ToggleSetting
              label={tr('Reminder Notifications', 'Notifikasi Pengingat')}
              description={tr('Receive daily reminders for unpaid split bills', 'Terima pengingat harian untuk split bill yang belum dibayar')}
              checked={settings.reminderNotifications}
              onChange={() => onToggleSetting('reminderNotifications')}
            />
            <ToggleSetting
              label={tr('Weekly Summary', 'Ringkasan Mingguan')}
              description={tr('Send weekly spending summary suggestion', 'Kirim ringkasan pengeluaran mingguan')}
              checked={settings.weeklySummary}
              onChange={() => onToggleSetting('weeklySummary')}
            />
          </div>
        </section>

        <section className="rounded-xl border-2 border-[#1c1c13] bg-white p-6 shadow-[4px_4px_0_#1c1c13] lg:col-span-6">
          <h3 className="mb-4 text-sm font-black uppercase text-[#1c1c13]">{tr('Configuration', 'Konfigurasi')}</h3>
          <div className="space-y-4">
            <label className="block text-[11px] font-black uppercase text-[#1c1c13]">
              {t('currency', 'Currency')}
              <select
                value={settings.currency}
                onChange={(event) => onConfigChange('currency', event.target.value)}
                className="mt-1.5 min-h-11 w-full rounded-lg border-2 border-[#1c1c13] bg-white px-4 text-sm font-bold shadow-[2px_2px_0_#1c1c13] outline-none focus:border-[#6366f1] cursor-pointer"
              >
                {CURRENCY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-[11px] font-black uppercase text-[#1c1c13]">
              {t('language', 'Language')}
              <select
                value={settings.language}
                onChange={(event) => onConfigChange('language', event.target.value)}
                className="mt-1.5 min-h-11 w-full rounded-lg border-2 border-[#1c1c13] bg-white px-4 text-sm font-bold shadow-[2px_2px_0_#1c1c13] outline-none focus:border-[#6366f1] cursor-pointer"
              >
                {LANGUAGE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        <section className="rounded-xl border-2 border-[#1c1c13] bg-white p-6 shadow-[4px_4px_0_#1c1c13] lg:col-span-6 flex flex-col">
          <h3 className="mb-4 text-sm font-black uppercase text-[#1c1c13]">{tr('Manage Categories', 'Kelola Kategori')}</h3>

          {/* Tabs */}
          <div className="flex gap-2 rounded-xl border-2 border-[#1c1c13] bg-[#fffbeb] p-1 shadow-[2px_2px_0_#1c1c13] mb-5">
            <button
              type="button"
              onClick={() => setCategoryTab('EXPENSE')}
              className={`flex-1 rounded-lg py-2 text-xs font-black uppercase transition-all ${categoryTab === 'EXPENSE' ? 'bg-[#ef4444] text-white border-2 border-[#1c1c13] shadow-[2px_2px_0_#1c1c13]' : 'bg-transparent text-[#1c1c13] border-2 border-transparent hover:border-[#1c1c13]'}`}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => setCategoryTab('INCOME')}
              className={`flex-1 rounded-lg py-2 text-xs font-black uppercase transition-all ${categoryTab === 'INCOME' ? 'bg-[#22c55e] text-[#1c1c13] border-2 border-[#1c1c13] shadow-[2px_2px_0_#1c1c13]' : 'bg-transparent text-[#1c1c13] border-2 border-transparent hover:border-[#1c1c13]'}`}
            >
              Income
            </button>
          </div>

          {/* Category Badges */}
          <div className="mb-6 flex-1">
            <p className="mb-3 text-[11px] font-black uppercase text-[#1c1c13]">
              {categoryTab === 'EXPENSE' ? 'Your Expense Categories' : 'Your Income Categories'}
            </p>
            <div className="flex flex-wrap gap-2">
              {(settings.categories?.[categoryTab] || []).map((categoryKey) => {
                const isDefault = isDefaultCategory(categoryTab, categoryKey)

                return (
                  <div
                    key={`${categoryTab}-${categoryKey}`}
                    className={`inline-flex items-center gap-1.5 rounded-lg border-2 border-[#1c1c13] ${isDefault ? 'bg-gray-100 text-[#1c1c13] opacity-70' : 'bg-[#fffbeb] text-[#1c1c13] shadow-[2px_2px_0_#1c1c13] hover:-translate-y-0.5 active:translate-y-0'} px-3 py-1.5 text-sm font-bold transition-all`}
                  >
                    <span className="text-base leading-none">{getCategoryIcon(settings, categoryKey)}</span>
                    <span>{prettifyCategory(categoryKey)}</span>
                    {!isDefault && (
                      <button
                        type="button"
                        onClick={() => onRemoveCategory(categoryTab, categoryKey)}
                        className="ml-1 flex h-5 w-5 items-center justify-center rounded border-2 border-[#1c1c13] bg-[#ef4444] text-white shadow-[2px_2px_0_#1c1c13] hover:-translate-y-0.5 active:translate-y-0 transition-all"
                        aria-label={`Remove ${categoryKey}`}
                      >
                        <span className="material-symbols-outlined text-[14px] font-black">close</span>
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Add Form */}
          <div className="rounded-xl border-2 border-[#1c1c13] bg-[#fffbeb] p-4 shadow-[4px_4px_0_#1c1c13]">
            <p className="mb-3 text-[11px] font-black uppercase text-[#1c1c13]">
              + Add {categoryTab} Category
            </p>
            <form className="space-y-3" onSubmit={onAddCategory}>
              <div className="flex gap-3">
                <label className="flex-1 block text-[10px] font-black uppercase text-[#1c1c13]">
                  Name
                  <input
                    type="text"
                    value={categoryForm.label}
                    onChange={(event) => setCategoryForm((prev) => ({ ...prev, label: event.target.value }))}
                    className="mt-1.5 min-h-11 w-full rounded-lg border-2 border-[#1c1c13] bg-white px-4 text-sm font-bold shadow-[2px_2px_0_#1c1c13] outline-none focus:border-[#6366f1]"
                    placeholder={tr('e.g. Side Hustle', 'contoh: Side Hustle')}
                  />
                </label>

                <label className="w-24 shrink-0 block text-[10px] font-black uppercase text-[#1c1c13]">
                  Icon (Emoji)
                  <input
                    type="text"
                    value={categoryForm.icon}
                    onChange={(event) => setCategoryForm((prev) => ({ ...prev, icon: event.target.value }))}
                    className="mt-1.5 min-h-11 w-full rounded-lg border-2 border-[#1c1c13] bg-white px-4 text-center text-lg font-bold shadow-[2px_2px_0_#1c1c13] outline-none focus:border-[#6366f1]"
                    placeholder="🧋"
                    maxLength={4}
                  />
                </label>
              </div>

              <div className="flex flex-wrap gap-2 pt-1 pb-2">
                {['🍽️', '🧋', '🎮', '🚌', '🛒', '📦', '💸', '🪙'].map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setCategoryForm((prev) => ({ ...prev, icon: emoji }))}
                    className="flex h-8 w-8 items-center justify-center rounded-md border-2 border-[#1c1c13] bg-white text-base shadow-[2px_2px_0_#1c1c13] hover:-translate-y-0.5 active:translate-y-0 transition-all"
                    aria-label={`Use ${emoji}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              <Button type="submit" fullWidth>
                {t('addCategory', 'Add Category')}
              </Button>
            </form>
          </div>
        </section>

        <section className="lg:col-span-12 mt-4">
          <Button
            type="button"
            onClick={handleLogout}
            className="!bg-[#ef4444] text-white hover:!bg-[#dc2626]"
            fullWidth
          >
            <span className="material-symbols-outlined mr-2">logout</span>
            {t('logout', 'Log Out')}
          </Button>
        </section>
    </PageLayout>
  )
}

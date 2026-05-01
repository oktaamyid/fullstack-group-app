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
  updatePassword,
  updateProfile,
} from '../../services/profileSettings'
import { PageLayout } from '../layouts/PageLayout'
import { PageHeader } from '../headers/PageHeader'
import { Alert } from '../ui/Alert'
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

const CURRENCY_OPTIONS = [
  { value: 'IDR', label: 'IDR - Indonesian Rupiah' },
  { value: 'USD', label: 'USD - US Dollar' },
  { value: 'SGD', label: 'SGD - Singapore Dollar' },
  { value: 'EUR', label: 'EUR - Euro' },
]

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
    <label className="flex min-h-11 items-center justify-between gap-3 rounded-lg border border-[#1c1c13] bg-white px-3 py-3">
      <div>
        <p className="text-sm font-bold">{label}</p>
        <p className="text-[11px] text-[#464554]">{description}</p>
      </div>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-5 w-5 rounded border border-[#1c1c13] accent-[#4648d4]"
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
  const [categoryForm, setCategoryForm] = useState({ type: 'EXPENSE', label: '', icon: '' })
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

      try {
        const next = addCategorySetting(authUser.id, categoryForm.type, categoryForm.label, categoryForm.icon)
        setSettings(next)
        setCategoryForm((prev) => ({ ...prev, label: '', icon: '' }))
        setMessage(tr('Category added successfully.', 'Kategori berhasil ditambahkan.'))
      } catch (error) {
        setErrorMessage(error.message)
      }
    },
    [authUser.id, categoryForm.icon, categoryForm.label, categoryForm.type, tr]
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
    [authUser.id, tr]
  )

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
        <section className="rounded-xl border border-[#1c1c13] bg-white p-4 shadow-[3px_3px_0_#1c1c13] lg:col-span-12">
          <p className="text-[11px] font-black uppercase text-[#4648d4]">Your Account</p>
          <h2 className="mt-1 text-lg font-extrabold">{authUser?.name || 'Student'}</h2>
          <p className="text-sm text-[#464554]">{authUser?.email || '-'}</p>
        </section>

        {message ? (
          <Alert type="success" onClose={() => setMessage('')}>
            {message}
          </Alert>
        ) : null}

        {errorMessage ? (
          <Alert type="error" onClose={() => setErrorMessage('')}>
            {errorMessage}
          </Alert>
        ) : null}

        <section className="rounded-xl border border-[#1c1c13] bg-[#f8f4e4] p-4 shadow-[3px_3px_0_#1c1c13] lg:col-span-6">
          <h3 className="mb-3 text-sm font-black uppercase">Edit Profile</h3>
          {isLoading ? (
            <p className="text-sm font-semibold">Loading profile...</p>
          ) : (
            <form className="space-y-3" onSubmit={onSaveProfile}>
              <label className="block text-[11px] font-black uppercase">
                Full Name
                <input
                  type="text"
                  name="name"
                  value={profileForm.name}
                  onChange={onProfileChange}
                  className="mt-1 min-h-11 w-full rounded-lg border border-[#1c1c13] bg-white px-3 text-sm"
                />
              </label>

              <label className="block text-[11px] font-black uppercase">
                Email
                <input
                  type="email"
                  name="email"
                  value={profileForm.email}
                  onChange={onProfileChange}
                  className="mt-1 min-h-11 w-full rounded-lg border border-[#1c1c13] bg-white px-3 text-sm"
                />
              </label>

              <button
                type="submit"
                disabled={isProfileSubmitting}
                className="min-h-11 w-full rounded-lg border border-[#1c1c13] bg-[#4648d4] px-3 text-sm font-black text-white shadow-[2px_2px_0_#1c1c13] disabled:opacity-70"
              >
                  {isProfileSubmitting ? t('saving', 'Saving...') : t('saveProfile', 'Save Profile')}
              </button>
            </form>
          )}
        </section>

        <section className="rounded-xl border border-[#1c1c13] bg-[#fff9dc] p-4 shadow-[3px_3px_0_#1c1c13] lg:col-span-6">
          <h3 className="mb-3 text-sm font-black uppercase">Security</h3>
          <form className="space-y-3" onSubmit={onSavePassword}>
            <label className="block text-[11px] font-black uppercase">
              Current Password
              <input
                type="password"
                name="currentPassword"
                value={passwordForm.currentPassword}
                onChange={onPasswordChange}
                className="mt-1 min-h-11 w-full rounded-lg border border-[#1c1c13] bg-white px-3 text-sm"
              />
            </label>

            <label className="block text-[11px] font-black uppercase">
              New Password
              <input
                type="password"
                name="newPassword"
                value={passwordForm.newPassword}
                onChange={onPasswordChange}
                className="mt-1 min-h-11 w-full rounded-lg border border-[#1c1c13] bg-white px-3 text-sm"
              />
            </label>

            <label className="block text-[11px] font-black uppercase">
              Confirm New Password
              <input
                type="password"
                name="confirmPassword"
                value={passwordForm.confirmPassword}
                onChange={onPasswordChange}
                className="mt-1 min-h-11 w-full rounded-lg border border-[#1c1c13] bg-white px-3 text-sm"
              />
            </label>

            <button
              type="submit"
              disabled={isPasswordSubmitting}
              className="min-h-11 w-full rounded-lg border border-[#1c1c13] bg-[#fbbf24] px-3 text-sm font-black shadow-[2px_2px_0_#1c1c13] disabled:opacity-70"
            >
              {isPasswordSubmitting ? t('updating', 'Updating...') : t('updatePassword', 'Update Password')}
            </button>
          </form>
        </section>

        <section className="rounded-xl border border-[#1c1c13] bg-white p-4 shadow-[3px_3px_0_#1c1c13] lg:col-span-12">
          <h3 className="mb-3 text-sm font-black uppercase">{tr('Preferences', 'Preferensi')}</h3>
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

        <section className="rounded-xl border border-[#1c1c13] bg-[#f8f4e4] p-4 shadow-[3px_3px_0_#1c1c13] lg:col-span-6">
          <h3 className="mb-3 text-sm font-black uppercase">{tr('Configuration', 'Konfigurasi')}</h3>
          <div className="space-y-3">
            <label className="block text-[11px] font-black uppercase">
              {t('currency', 'Currency')}
              <select
                value={settings.currency}
                onChange={(event) => onConfigChange('currency', event.target.value)}
                className="mt-1 min-h-11 w-full rounded-lg border border-[#1c1c13] bg-white px-3 text-sm"
              >
                {CURRENCY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-[11px] font-black uppercase">
              {t('language', 'Language')}
              <select
                value={settings.language}
                onChange={(event) => onConfigChange('language', event.target.value)}
                className="mt-1 min-h-11 w-full rounded-lg border border-[#1c1c13] bg-white px-3 text-sm"
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

        <section className="rounded-xl border border-[#1c1c13] bg-[#fff9dc] p-4 shadow-[3px_3px_0_#1c1c13] lg:col-span-6">
          <h3 className="mb-3 text-sm font-black uppercase">{tr('Manage Categories', 'Kelola Kategori')}</h3>

          <form className="space-y-3" onSubmit={onAddCategory}>
            <label className="block text-[11px] font-black uppercase">
              {t('categoryType', 'Category Type')}
              <select
                value={categoryForm.type}
                onChange={(event) => setCategoryForm((prev) => ({ ...prev, type: event.target.value }))}
                className="mt-1 min-h-11 w-full rounded-lg border border-[#1c1c13] bg-white px-3 text-sm"
              >
                <option value="EXPENSE">Expense</option>
                <option value="INCOME">Income</option>
              </select>
            </label>

            <label className="block text-[11px] font-black uppercase">
              {t('newCategoryName', 'New Category Name')}
              <input
                type="text"
                value={categoryForm.label}
                onChange={(event) => setCategoryForm((prev) => ({ ...prev, label: event.target.value }))}
                className="mt-1 min-h-11 w-full rounded-lg border border-[#1c1c13] bg-white px-3 text-sm"
                placeholder={tr('e.g. Side Hustle', 'contoh: Side Hustle')}
              />
            </label>

            <label className="block text-[11px] font-black uppercase">
              {t('iconOrEmoji', 'Icon or Emoji')}
              <input
                type="text"
                value={categoryForm.icon}
                onChange={(event) => setCategoryForm((prev) => ({ ...prev, icon: event.target.value }))}
                className="mt-1 min-h-11 w-full rounded-lg border border-[#1c1c13] bg-white px-3 text-sm"
                placeholder={tr('e.g. 🧋', 'contoh: 🧋')}
                maxLength={4}
              />
            </label>

            <div className="flex flex-wrap gap-2">
              {['🍽️', '🧋', '🎮', '🚌', '🛒', '📦', '💸', '🪙'].map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setCategoryForm((prev) => ({ ...prev, icon: emoji }))}
                  className="min-h-11 min-w-11 rounded-lg border border-[#1c1c13] bg-white text-lg shadow-[1px_1px_0_#1c1c13]"
                  aria-label={`Use ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
            </div>

            <button
              type="submit"
              className="min-h-11 w-full rounded-lg border border-[#1c1c13] bg-[#4648d4] px-3 text-sm font-black text-white shadow-[2px_2px_0_#1c1c13]"
            >
              {t('addCategory', 'Add Category')}
            </button>
          </form>

          <div className="mt-4 space-y-4">
            {['EXPENSE', 'INCOME'].map((type) => (
              <div key={type}>
                <p className="text-[11px] font-black uppercase text-[#464554]">{type} {t('categories', 'Categories')}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(settings.categories?.[type] || []).map((categoryKey) => {
                    const isDefault = isDefaultCategory(type, categoryKey)

                    return (
                      <span
                        key={`${type}-${categoryKey}`}
                        className="inline-flex items-center gap-2 rounded-full border border-[#1c1c13] bg-white px-3 py-1 text-xs font-bold"
                      >
                        <span>{getCategoryIcon(settings, categoryKey)}</span>
                        <span>{prettifyCategory(categoryKey)}</span>
                        {!isDefault ? (
                          <button
                            type="button"
                            onClick={() => onRemoveCategory(type, categoryKey)}
                            className="rounded-full border border-[#1c1c13] bg-[#fee2e2] px-2 text-[10px] leading-5"
                            aria-label={`Remove ${categoryKey}`}
                          >
                            x
                          </button>
                        ) : null}
                      </span>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>
    </PageLayout>
  )
}

import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { clearAuthSession, getAuthToken, getAuthUser, saveAuthSession } from '../../services/auth'
import {
  fetchProfile,
  getLocalSettings,
  saveLocalSettings,
  updatePassword,
  updateProfile,
} from '../../services/profileSettings'
import { PageLayout } from '../layouts/PageLayout'
import { PageHeader } from '../headers/PageHeader'
import { Alert } from '../ui/Alert'

const defaultProfileForm = {
  name: '',
  email: '',
}

const defaultPasswordForm = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
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
  const navigate = useNavigate()
  const authUser = getAuthUser()
  const [isLoading, setIsLoading] = useState(true)
  const [profileForm, setProfileForm] = useState(defaultProfileForm)
  const [passwordForm, setPasswordForm] = useState(defaultPasswordForm)
  const [settings, setSettings] = useState(getLocalSettings(authUser?.id || 'guest'))
  const [isProfileSubmitting, setIsProfileSubmitting] = useState(false)
  const [isPasswordSubmitting, setIsPasswordSubmitting] = useState(false)
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

        setMessage('Profile updated successfully.')
      } catch (error) {
        setErrorMessage(error.message)
      } finally {
        setIsProfileSubmitting(false)
      }
    },
    [profileForm.email, profileForm.name]
  )

  const onSavePassword = useCallback(async (event) => {
    event.preventDefault()
    setErrorMessage('')
    setMessage('')

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setErrorMessage('New password and confirmation password must match.')
      return
    }

    setIsPasswordSubmitting(true)

    try {
      await updatePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      })
      setPasswordForm(defaultPasswordForm)
      setMessage('Password updated successfully.')
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setIsPasswordSubmitting(false)
    }
  }, [passwordForm.confirmPassword, passwordForm.currentPassword, passwordForm.newPassword])

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

  return (
    <PageLayout
      header={
        <PageHeader
          mainLogo={mainLogo}
          title="Profile & Settings"
          backLink="/home"
        />
      }
      className="space-y-5 py-5 lg:grid lg:grid-cols-12 lg:gap-6 lg:space-y-0"
    >
        <section className="rounded-xl border border-[#1c1c13] bg-white p-4 shadow-[3px_3px_0_#1c1c13] lg:col-span-12">
          <p className="text-[11px] font-black uppercase text-[#4648d4]">Account Snapshot</p>
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
                {isProfileSubmitting ? 'Saving...' : 'Save Profile'}
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
              {isPasswordSubmitting ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </section>

        <section className="rounded-xl border border-[#1c1c13] bg-white p-4 shadow-[3px_3px_0_#1c1c13] lg:col-span-12">
          <h3 className="mb-3 text-sm font-black uppercase">Preferences</h3>
          <div className="space-y-3">
            <ToggleSetting
              label="Budget Alerts"
              description="Get red alert when spending runway is low"
              checked={settings.budgetAlerts}
              onChange={() => onToggleSetting('budgetAlerts')}
            />
            <ToggleSetting
              label="Reminder Notifications"
              description="Receive daily reminders for unpaid split bills"
              checked={settings.reminderNotifications}
              onChange={() => onToggleSetting('reminderNotifications')}
            />
            <ToggleSetting
              label="Weekly Summary"
              description="Send weekly spending summary suggestion"
              checked={settings.weeklySummary}
              onChange={() => onToggleSetting('weeklySummary')}
            />
          </div>
        </section>
    </PageLayout>
  )
}

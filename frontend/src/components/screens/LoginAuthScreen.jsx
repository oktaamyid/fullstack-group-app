import { useMemo, useState } from 'react'

const defaultForm = {
  name: '',
  email: '',
  password: '',
}

export function LoginAuthScreen({ onAuthSuccess, mainLogo, mascotImage }) {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState(defaultForm)
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isRegister = mode === 'register'

  const submitLabel = useMemo(() => {
    return isRegister ? 'Create Scholar Account' : 'Enter Library'
  }, [isRegister])

  const onChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const switchMode = () => {
    setErrorMessage('')
    setForm(defaultForm)
    setMode((prev) => (prev === 'login' ? 'register' : 'login'))
  }

  const onSubmit = async (event) => {
    event.preventDefault()
    setErrorMessage('')

    if (!form.email || !form.password || (isRegister && !form.name)) {
      setErrorMessage('Please complete all required fields.')
      return
    }

    setIsSubmitting(true)

    try {
      const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login'
      const payload = isRegister
        ? { name: form.name, email: form.email, password: form.password }
        : { email: form.email, password: form.password }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok || !data?.success) {
        throw new Error(data?.message || 'Authentication failed.')
      }

      const token = data?.data?.token
      const user = data?.data?.user

      if (!token || !user) {
        throw new Error('Invalid auth response from server.')
      }

      onAuthSuccess({ token, user })
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-[#fffbeb] px-4 py-6">
      <section className="w-full max-w-sm rounded-2xl border border-black bg-[#fff9dc] p-4 text-[#1c1c13]">
        <div className="mb-5 flex flex-col items-center text-center">
          <div className="relative mb-4">
            <div className="h-28 w-28 overflow-hidden rounded-full border border-black bg-[#fbbf24] shadow-[4px_4px_0_#1c1c13]">
              <img src={mainLogo} alt="LIVO Mascot" className="h-full w-full object-cover" />
            </div>
          </div>

          <h1 className="m-0 text-2xl font-extrabold">{isRegister ? 'Create Account' : 'Welcome Back'}</h1>
          <p className="mt-1 text-sm text-[#464554]">
            {isRegister ? 'Start your student finance journey.' : 'Sign in to continue managing your budget.'}
          </p>
        </div>

        <form className="space-y-3" onSubmit={onSubmit}>
          {isRegister ? (
            <label className="block text-xs font-bold uppercase tracking-wider">
              Full Name
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={onChange}
                placeholder="Your name"
                className="mt-1 min-h-11 w-full rounded-2xl border border-black bg-white px-3 text-sm outline-none focus:-translate-y-px"
              />
            </label>
          ) : null}

          <label className="block text-xs font-bold uppercase tracking-wider">
            Email Address
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={onChange}
              placeholder="emailkamu@gmail.com"
              className="mt-1 min-h-11 w-full rounded-2xl border border-black bg-white px-3 text-sm outline-none focus:-translate-y-px"
            />
          </label>

          <label className="block text-xs font-bold uppercase tracking-wider">
            Password
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={onChange}
              placeholder="••••••••"
              className="mt-1 min-h-11 w-full rounded-2xl border border-black bg-white px-3 text-sm outline-none focus:-translate-y-px"
            />
          </label>

          {errorMessage ? (
            <p className="rounded-2xl border border-black bg-[#fee2e2] px-3 py-2 text-sm font-semibold text-[#7f1d1d]">
              {errorMessage}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="min-h-11 w-full rounded-2xl border border-black bg-[#6366f1] px-4 py-2 font-bold text-white shadow-[3px_3px_0_#1c1c13] transition-transform disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? 'Submitting...' : submitLabel}
          </button>
        </form>

        <div className="mt-4 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-[#464554]">
          <span>{isRegister ? 'Already have an account?' : 'Need an account?'}</span>
          <button type="button" onClick={switchMode} className="rounded-full border border-black bg-white px-3 py-1">
            {isRegister ? 'Login' : 'Register'}
          </button>
        </div>
      </section>
    </main>
  )
}

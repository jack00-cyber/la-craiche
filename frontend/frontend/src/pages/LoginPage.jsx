import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getErrorMessage } from '../utils/errors'
import { Button, Card, ErrorBanner, Field, Input, Select } from '../components/ui'

const initialForm = {
  username: '',
  password: '',
  role: 'user',
}

export default function LoginPage() {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState(initialForm)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { login, register, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true })
    }
  }, [isAuthenticated, navigate])

  function updateField(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (mode === 'login') {
        await login({ username: form.username, password: form.password })
      } else {
        await register({ username: form.username, password: form.password, role: form.role })
      }

      const destination = location.state?.from?.pathname || '/dashboard'
      navigate(destination, { replace: true })
    } catch (submitError) {
      setError(getErrorMessage(submitError))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-page__visual">
        <div className="hero-badge">La Craiche Care Manager</div>
        <h1>Simple operations for a warm childcare center.</h1>
        <p>
          Manage children, parents, carnets, and payments from one clean dashboard with real JWT authentication.
        </p>
        <div className="auth-page__highlights">
          <div>
            <strong>Secure</strong>
            <span>JWT login with token refresh and protected routes.</span>
          </div>
          <div>
            <strong>Practical</strong>
            <span>CRUD screens connected directly to the Django REST API.</span>
          </div>
          <div>
            <strong>Responsive</strong>
            <span>Works comfortably on laptop and mobile screens.</span>
          </div>
        </div>
      </div>

      <Card className="auth-card">
        <div className="auth-card__header">
          <div>
            <p className="eyebrow">Welcome back</p>
            <h2>{mode === 'login' ? 'Sign in to continue' : 'Create a staff account'}</h2>
          </div>
          <div className="segmented-control">
            <button
              type="button"
              className={mode === 'login' ? 'segmented-control__item segmented-control__item--active' : 'segmented-control__item'}
              onClick={() => setMode('login')}
            >
              Login
            </button>
            <button
              type="button"
              className={mode === 'register' ? 'segmented-control__item segmented-control__item--active' : 'segmented-control__item'}
              onClick={() => setMode('register')}
            >
              Register
            </button>
          </div>
        </div>

        <ErrorBanner message={error} />

        <form className="stack" onSubmit={handleSubmit}>
          <Field label="Username" required>
            <Input
              name="username"
              value={form.username}
              onChange={updateField}
              placeholder="Your username"
              autoComplete="username"
              required
            />
          </Field>

          <Field label="Password" required hint="At least 8 characters">
            <Input
              type="password"
              name="password"
              value={form.password}
              onChange={updateField}
              placeholder="Your password"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              required
            />
          </Field>

          {mode === 'register' ? (
            <Field label="Role" hint="Defaults to user">
              <Select name="role" value={form.role} onChange={updateField}>
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </Select>
            </Field>
          ) : null}

          <Button type="submit" className="button--full" disabled={loading}>
            {loading ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Create account'}
          </Button>
        </form>

        <p className="auth-card__footnote">
          {mode === 'login'
            ? 'New staff members can register from this same screen.'
            : 'After registration, you will be signed in automatically.'}
        </p>
      </Card>
    </div>
  )
}

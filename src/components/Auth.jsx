import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function Auth() {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()

    setLoading(true)
    setError('')
    setMessage('')

    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) {
        setError(error.message)
      } else {
        setMessage(
          'Registrace proběhla úspěšně. Pokud je v Supabase zapnuté potvrzení e-mailu, zkontroluj svou e-mailovou schránku.'
        )
        setMode('login')
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(error.message)
      }
    }

    setLoading(false)
  }

  async function handleResetPassword() {
    if (!email) {
      setError('Nejdříve zadej svůj e-mail.')
      return
    }

    setLoading(true)
    setError('')
    setMessage('')

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    })

    if (error) {
      setError(error.message)
    } else {
      setMessage('Odkaz pro obnovení hesla byl odeslán na e-mail.')
    }

    setLoading(false)
  }

  return (
    <div className="auth-page">
      <div className="card auth-card">
        <div className="logo">🛒</div>

        <h1>Nákup Spolu</h1>

        <p className="subtitle">
          Společný nákupní seznam pro vás dva.
        </p>

        <div className="tabs">
          <button
            type="button"
            className={`tab ${mode === 'login' ? 'active' : ''}`}
            onClick={() => {
              setMode('login')
              setError('')
              setMessage('')
            }}
          >
            Přihlásit
          </button>

          <button
            type="button"
            className={`tab ${mode === 'signup' ? 'active' : ''}`}
            onClick={() => {
              setMode('signup')
              setError('')
              setMessage('')
            }}
          >
            Registrace
          </button>
        </div>

        {error && <div className="error">{error}</div>}

        {message && <div className="success">{message}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">E-mail</label>

            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vas@email.cz"
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Heslo</label>

            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimálně 6 znaků"
              required
              minLength={6}
              autoComplete={
                mode === 'login' ? 'current-password' : 'new-password'
              }
            />
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
          >
            {loading
              ? 'Pracuji…'
              : mode === 'login'
                ? 'Přihlásit se'
                : 'Vytvořit účet'}
          </button>
        </form>

        {mode === 'login' && (
          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <button
              type="button"
              className="text-button"
              onClick={handleResetPassword}
              disabled={loading}
            >
              Zapomenuté heslo?
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
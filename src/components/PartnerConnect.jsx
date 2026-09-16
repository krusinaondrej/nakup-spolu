import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function PartnerConnect({ user, onListConnected, onLogout }) {
  const [joinCode, setJoinCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [createdCode, setCreatedCode] = useState('')

  async function createList() {
    setLoading(true)
    setError('')

    const { data, error } = await supabase.rpc('create_new_list', {
      list_name: 'Náš Nákup',
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    const newList = Array.isArray(data) ? data[0] : data

    if (!newList?.id) {
      setError('Seznam se vytvořil, ale nepodařilo se načíst jeho údaje.')
      setLoading(false)
      return
    }

    setCreatedCode(newList.invite_code || '')
    onListConnected(newList)

    setLoading(false)
  }

  async function joinList() {
    if (!joinCode.trim()) {
      setError('Zadej kód seznamu.')
      return
    }

    setLoading(true)
    setError('')

    const { data, error } = await supabase.rpc('join_list_by_code', {
      code_input: joinCode.trim().toUpperCase(),
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    const joinedList = Array.isArray(data) ? data[0] : data

    if (!joinedList?.id) {
      setError('Nepodařilo se připojit k seznamu.')
      setLoading(false)
      return
    }

    onListConnected(joinedList)

    setLoading(false)
  }

  return (
    <div className="auth-page">
      <div className="card auth-card">
        <div className="logo">🛒</div>

        <h1>Nákup Spolu</h1>

        <p className="subtitle">
          Vytvořte společný seznam nebo se připojte k seznamu partnera.
        </p>

        {error && <div className="error">{error}</div>}

        <div className="connect-section">
          <h2>Vytvořit nový seznam</h2>

          <p className="subtitle">
            Vytvoř seznam a pošli partnerovi pozvánkový kód.
          </p>

          <button
            type="button"
            className="btn-primary"
            onClick={createList}
            disabled={loading}
          >
            {loading ? 'Vytvářím…' : 'Vytvořit seznam'}
          </button>

          {createdCode && (
            <div className="invite-code">
              <span className="invite-code-label">
                Kód pro partnera
              </span>

              <div className="invite-code-value">
                {createdCode}
              </div>
            </div>
          )}
        </div>

        <div className="connect-divider">
          nebo
        </div>

        <div className="connect-section">
          <h2>Připojit se k seznamu</h2>

          <p className="subtitle">
            Zadej kód, který ti poslal partner.
          </p>

          <div className="form-group">
            <label htmlFor="joinCode">
              Pozvánkový kód
            </label>

            <input
              id="joinCode"
              type="text"
              value={joinCode}
              onChange={(e) =>
                setJoinCode(e.target.value.toUpperCase())
              }
              placeholder="NAPŘ. ABC123"
              maxLength={20}
              autoComplete="off"
            />
          </div>

          <button
            type="button"
            className="btn-secondary"
            onClick={joinList}
            disabled={loading}
          >
            {loading ? 'Připojuji…' : 'Připojit se'}
          </button>
        </div>

        <div
          style={{
            textAlign: 'center',
            marginTop: '24px',
          }}
        >
          <div
            style={{
              fontSize: '13px',
              color: '#6b7280',
              marginBottom: '8px',
            }}
          >
            Přihlášen jako
          </div>

          <div
            style={{
              fontSize: '14px',
              marginBottom: '12px',
              wordBreak: 'break-word',
            }}
          >
            {user.email}
          </div>

          <button
            type="button"
            className="text-button"
            onClick={onLogout}
          >
            Odhlásit se
          </button>
        </div>
      </div>
    </div>
  )
}
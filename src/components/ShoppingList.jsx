import { useEffect, useState } from 'react'
import {
  Plus,
  Trash2,
  Check,
  Users,
  LogOut,
  Copy,
  X,
} from 'lucide-react'
import { supabase } from '../lib/supabaseClient'

export default function ShoppingList({ user, list, onLogout }) {
  const [items, setItems] = useState([])
  const [newItem, setNewItem] = useState('')
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')
  const [showInvite, setShowInvite] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    loadItems()

    const channel = supabase
      .channel(`shopping_list_${list.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shopping_items',
          filter: `list_id=eq.${list.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setItems((current) => {
              const exists = current.some(
                (item) => item.id === payload.new.id
              )

              return exists ? current : [...current, payload.new]
            })
          }

          if (payload.eventType === 'UPDATE') {
            setItems((current) =>
              current.map((item) =>
                item.id === payload.new.id ? payload.new : item
              )
            )
          }

          if (payload.eventType === 'DELETE') {
            setItems((current) =>
              current.filter((item) => item.id !== payload.old.id)
            )
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [list.id])

  async function loadItems() {
    setLoading(true)
    setError('')

    const { data, error } = await supabase
      .from('shopping_items')
      .select('*')
      .eq('list_id', list.id)
      .order('created_at', { ascending: true })

    if (error) {
      console.error(error)
      setError(error.message)
    } else {
      setItems(data || [])
    }

    setLoading(false)
  }

  async function addItem(e) {
    e?.preventDefault()

    const name = newItem.trim()

    if (!name || adding) return

    setAdding(true)
    setError('')

    const { data, error } = await supabase
      .from('shopping_items')
      .insert({
        list_id: list.id,
        name,
        created_by: user.id,
      })
      .select()
      .single()

    if (error) {
      console.error(error)
      setError(error.message)
    } else if (data) {
      setItems((current) => {
        const exists = current.some(
          (item) => item.id === data.id
        )

        return exists ? current : [...current, data]
      })

      setNewItem('')
    }

    setAdding(false)
  }

  async function toggleItem(item) {
    const { error } = await supabase
      .from('shopping_items')
      .update({
        completed: !item.completed,
      })
      .eq('id', item.id)

    if (error) {
      console.error(error)
      setError(error.message)
    }
  }

  async function deleteItem(item) {
    const { error } = await supabase
      .from('shopping_items')
      .delete()
      .eq('id', item.id)

    if (error) {
      console.error(error)
      setError(error.message)
    }
  }

  async function copyInviteCode() {
    try {
      await navigator.clipboard.writeText(list.invite_code)
      setCopied(true)

      setTimeout(() => {
        setCopied(false)
      }, 2000)
    } catch {
      setError('Kód se nepodařilo zkopírovat.')
    }
  }

  const activeItems = items.filter((item) => !item.completed)
  const completedItems = items.filter((item) => item.completed)

  return (
    <div className="page">
      <div className="list-header">
        <div>
          <h1 className="list-title">Nákup Spolu</h1>

          <p className="list-subtitle">
            {activeItems.length}{' '}
            {activeItems.length === 1
              ? 'položka'
              : activeItems.length < 5
                ? 'položky'
                : 'položek'}
          </p>
        </div>

        <div className="header-actions">
          <button
            type="button"
            className="icon-button"
            onClick={() => setShowInvite(true)}
            title="Pozvat partnera"
          >
            <Users size={20} />
          </button>

          <button
            type="button"
            className="icon-button"
            onClick={onLogout}
            title="Odhlásit"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>

      {error && (
        <div className="error">
          {error}
        </div>
      )}

      <form className="add-item" onSubmit={addItem}>
        <input
          type="text"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          placeholder="Co potřebujete koupit?"
          disabled={adding}
          autoComplete="off"
        />

        <button
          type="submit"
          className="btn-primary"
          disabled={adding || !newItem.trim()}
          title="Přidat"
        >
          <Plus size={22} />
        </button>
      </form>

      {loading ? (
        <div className="card empty-state">
          <div className="loading-spinner" />
          <p>Načítám seznam…</p>
        </div>
      ) : items.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-state-icon">
            🛒
          </div>

          <h3>Seznam je zatím prázdný</h3>

          <p>
            Přidejte první položku, kterou potřebujete
            koupit.
          </p>
        </div>
      ) : (
        <div className="shopping-items">
          {activeItems.map((item) => (
            <ShoppingItem
              key={item.id}
              item={item}
              onToggle={toggleItem}
              onDelete={deleteItem}
            />
          ))}

          {completedItems.length > 0 && (
            <>
              <div
                style={{
                  fontSize: '13px',
                  color: '#9ca3af',
                  margin: '16px 4px 4px',
                  fontWeight: 600,
                }}
              >
                KOUPENO
              </div>

              {completedItems.map((item) => (
                <ShoppingItem
                  key={item.id}
                  item={item}
                  onToggle={toggleItem}
                  onDelete={deleteItem}
                />
              ))}
            </>
          )}
        </div>
      )}

      {showInvite && (
        <div
          className="modal-backdrop"
          onClick={() => setShowInvite(false)}
        >
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Pozvat partnera</h2>

              <button
                type="button"
                className="icon-button"
                onClick={() => setShowInvite(false)}
              >
                <X size={20} />
              </button>
            </div>

            <p className="subtitle">
              Pošli partnerovi tento kód. Zadá ho ve
              své aplikaci a připojí se ke stejnému
              nákupnímu seznamu.
            </p>

            <div className="invite-code">
              <span className="invite-code-label">
                Pozvánkový kód
              </span>

              <div className="invite-code-value">
                {list.invite_code}
              </div>
            </div>

            <button
              type="button"
              className="btn-primary"
              onClick={copyInviteCode}
            >
              <Copy
                size={18}
                style={{
                  verticalAlign: 'middle',
                  marginRight: '7px',
                }}
              />
              {copied ? 'Zkopírováno!' : 'Kopírovat kód'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function ShoppingItem({ item, onToggle, onDelete }) {
  return (
    <div
      className={`shopping-item ${
        item.completed ? 'completed' : ''
      }`}
    >
      <button
        type="button"
        className={`item-checkbox ${
          item.completed ? 'checked' : ''
        }`}
        onClick={() => onToggle(item)}
        aria-label={
          item.completed
            ? 'Označit jako nekoupené'
            : 'Označit jako koupené'
        }
      >
        {item.completed && <Check size={16} />}
      </button>

      <div className="item-name">
        {item.name}
      </div>

      <button
        type="button"
        className="delete-button"
        onClick={() => onDelete(item)}
        aria-label="Smazat položku"
      >
        <Trash2 size={18} />
      </button>
    </div>
  )
}
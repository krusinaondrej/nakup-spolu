import { useEffect, useState } from 'react'
import { supabase } from './lib/supabaseClient'
import Auth from './components/Auth'
import PartnerConnect from './components/PartnerConnect'
import ShoppingList from './components/ShoppingList'

export default function App() {
  const [session, setSession] = useState(null)
  const [list, setList] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    async function loadSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!mounted) return

      setSession(session)
      setLoading(false)

      if (session?.user) {
        await loadUserList(session.user.id)
      }
    }

    loadSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!mounted) return

      setSession(newSession)

      if (newSession?.user) {
        await loadUserList(newSession.user.id)
      } else {
        setList(null)
      }

      setLoading(false)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  async function loadUserList(userId) {
    const { data: membership, error: membershipError } = await supabase
      .from('list_members')
      .select('list_id')
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle()

    if (membershipError) {
      console.error('Chyba při načítání členství:', membershipError)
      return
    }

    if (!membership) {
      setList(null)
      return
    }

    const { data: shoppingList, error: listError } = await supabase
      .from('shopping_lists')
      .select('*')
      .eq('id', membership.list_id)
      .single()

    if (listError) {
      console.error('Chyba při načítání seznamu:', listError)
      setList(null)
      return
    }

    setList(shoppingList)
  }

  async function handleListConnected(newList) {
    setList(newList)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    setSession(null)
    setList(null)
  }

  if (loading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner" />
        <p>Načítám Nákup Spolu…</p>
      </div>
    )
  }

  if (!session) {
    return <Auth />
  }

  if (!list) {
    return (
      <PartnerConnect
        user={session.user}
        onListConnected={handleListConnected}
        onLogout={handleLogout}
      />
    )
  }

  return (
    <ShoppingList
      user={session.user}
      list={list}
      onLogout={handleLogout}
    />
  )
}
'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function Nav() {
  const [user, setUser] = useState(undefined)

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => setUser(data.user))
      .catch(() => setUser(null))
  }, [])

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/'
  }

  return (
    <nav style={{ background: '#1C2B4A', padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
      <Link href="/" style={{ color: '#fff', fontWeight: 700, fontSize: 20, textDecoration: 'none' }}>uNick Academy</Link>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', fontSize: 14 }}>
        {user === undefined && null}
        {user === null && (
          <>
            <Link href="/login" style={{ color: '#fff', textDecoration: 'none' }}>Zaloguj się</Link>
            <Link href="/register" style={{ background: '#C0392B', color: '#fff', borderRadius: 8, padding: '10px 20px', fontWeight: 700, textDecoration: 'none' }}>Zarejestruj się</Link>
          </>
        )}
        {user && (
          <>
            <Link href="/dashboard" style={{ color: '#fff', textDecoration: 'none' }}>Panel ucznia</Link>
            {user.isAdmin && <Link href="/admin/referrals" style={{ color: '#fff', textDecoration: 'none' }}>Panel admina</Link>}
            {user.isAdmin && <Link href="/admin/students" style={{ color: '#fff', textDecoration: 'none' }}>Uczniowie</Link>}
            <span style={{ color: '#cbd5e1' }}>{user.name}</span>
            <button onClick={logout} style={{ background: 'transparent', color: '#fff', border: '1.5px solid #fff', borderRadius: 8, padding: '8px 16px', fontWeight: 600, cursor: 'pointer' }}>Wyloguj</button>
          </>
        )}
      </div>
    </nav>
  )
}

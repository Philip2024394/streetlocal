/**
 * FavoriteButton — Heart icon to save/unsave listings.
 * Persists in localStorage + Supabase.
 */
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

const KEY = 'indoo_web_favorites'

function getFavs() { try { return JSON.parse(localStorage.getItem(KEY) || '[]') } catch { return [] } }
function setFavs(ids) { localStorage.setItem(KEY, JSON.stringify(ids)) }

export function isFavorite(listingId) { return getFavs().includes(listingId) }

export function useFavorites() {
  const [favs, setFavsState] = useState(getFavs)
  const toggle = (listingId) => {
    const current = getFavs()
    const next = current.includes(listingId) ? current.filter(id => id !== listingId) : [...current, listingId]
    setFavs(next)
    setFavsState(next)
    // Supabase sync
    if (supabase) {
      supabase.auth.getUser().then(({ data }) => {
        const userId = data?.user?.id
        if (!userId) return
        if (next.includes(listingId)) {
          supabase.from('rental_saved_items').upsert({ user_id: userId, listing_ref: listingId }, { onConflict: 'user_id,listing_ref' })
        } else {
          supabase.from('rental_saved_items').delete().eq('user_id', userId).eq('listing_ref', listingId)
        }
      })
    }
  }
  return { favs, toggle, count: favs.length }
}

export default function FavoriteButton({ listingId, size = 'md', style = {} }) {
  const [saved, setSaved] = useState(() => isFavorite(listingId))

  const handleClick = (e) => {
    e.stopPropagation()
    const current = getFavs()
    const next = current.includes(listingId) ? current.filter(id => id !== listingId) : [...current, listingId]
    setFavs(next)
    setSaved(next.includes(listingId))
  }

  const sz = size === 'sm' ? 28 : size === 'lg' ? 44 : 36

  return (
    <button onClick={handleClick} style={{
      width: sz, height: sz, borderRadius: sz / 2,
      background: saved ? 'rgba(239,68,68,0.15)' : 'rgba(0,0,0,0.5)',
      backdropFilter: 'blur(8px)',
      border: saved ? '1.5px solid rgba(239,68,68,0.3)' : '1px solid rgba(255,255,255,0.15)',
      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
      transition: 'all 0.2s', padding: 0, ...style,
    }}>
      <svg width={sz * 0.45} height={sz * 0.45} viewBox="0 0 24 24" fill={saved ? '#EF4444' : 'none'} stroke={saved ? '#EF4444' : '#fff'} strokeWidth="2">
        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
      </svg>
    </button>
  )
}

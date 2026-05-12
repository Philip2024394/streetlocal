/**
 * Driver Registration Service
 * Handles driver applications with Supabase (primary) + localStorage (fallback).
 * Table: driver_applications (user_id, driver_type, document_urls jsonb, status, created_at)
 */
import { supabase } from '@/lib/supabase'

const STORAGE_KEY = 'indoo_driver_applications'

export const VEHICLE_TYPES = [
  { id: 'bike', label: 'Motor Bike', icon: '🏍️', licenseClass: 'SIM C' },
  { id: 'car',  label: 'Car',        icon: '🚗', licenseClass: 'SIM A' },
]

function load() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [] }
  catch { return [] }
}

function save(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

/** Submit a new driver application — tries Supabase first, falls back to localStorage */
export async function submitApplication(data) {
  const entry = {
    id: 'drv_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
    ...data,
    status: 'pending', // pending | approved | rejected
    submittedAt: new Date().toISOString(),
    reviewedAt: null,
    adminNote: '',
  }

  // Try Supabase first
  if (supabase && data.user_id) {
    try {
      const { data: row, error } = await supabase
        .from('driver_applications')
        .upsert({
          user_id: data.user_id,
          driver_type: data.vehicleType ?? data.driver_type ?? 'bike',
          document_urls: {
            ktp: data.ktpUrl ?? null,
            sim: data.simUrl ?? null,
            stnk: data.stnkUrl ?? null,
            photo: data.photoUrl ?? null,
          },
          status: 'pending',
          created_at: new Date().toISOString(),
          phone: data.phone ?? null,
          full_name: data.fullName ?? data.name ?? null,
        }, { onConflict: 'user_id' })
        .select()
        .single()

      if (!error && row) {
        // Also save to localStorage as cache
        entry.id = row.id ?? entry.id
        const apps = load()
        const existing = apps.findIndex(a => a.phone === data.phone || a.user_id === data.user_id)
        if (existing >= 0) {
          apps[existing] = { ...apps[existing], ...entry, id: apps[existing].id }
        } else {
          apps.unshift(entry)
        }
        save(apps)
        localStorage.setItem('indoo_driver_registered', 'true')
        return entry
      }
    } catch (err) {
      console.warn('Supabase driver_applications upsert failed, falling back to localStorage:', err)
    }
  }

  // Fallback: localStorage only
  const apps = load()
  const existing = apps.findIndex(a => a.phone === data.phone)

  if (existing >= 0) {
    apps[existing] = { ...apps[existing], ...entry, id: apps[existing].id }
    save(apps)
    localStorage.setItem('indoo_driver_registered', 'true')
    return apps[existing]
  }

  apps.unshift(entry)
  save(apps)
  localStorage.setItem('indoo_driver_registered', 'true')
  return entry
}

/** Get application by phone */
export function getApplicationByPhone(phone) {
  return load().find(a => a.phone === phone) || null
}

/** Get all applications (admin) */
export function getAllApplications() {
  return load()
}

/** Approve application (admin) */
export function approveApplication(id) {
  const apps = load()
  const idx = apps.findIndex(a => a.id === id)
  if (idx === -1) return null
  apps[idx].status = 'approved'
  apps[idx].reviewedAt = new Date().toISOString()
  save(apps)
  return apps[idx]
}

/** Reject application (admin) */
export function rejectApplication(id, reason = '') {
  const apps = load()
  const idx = apps.findIndex(a => a.id === id)
  if (idx === -1) return null
  apps[idx].status = 'rejected'
  apps[idx].reviewedAt = new Date().toISOString()
  apps[idx].adminNote = reason
  save(apps)
  return apps[idx]
}

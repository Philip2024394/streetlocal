import { useEffect, useRef, useState, useCallback } from 'react'
import { useAuth } from './useAuth'
import {
  getChatSession, markChatUnlocked,
  getUnlockBalance, consumeUnlockCredit,
  getSellerPlan, getActiveSubscription,
  getBuyerUnlockStatus, activateBuyerUnlock,
  PLAN_LIMITS,
} from '@/services/unlockService'

const FREE_WINDOW_MS  = 20 * 60 * 1000   // 20 minutes
const WARN_THRESHOLD  =  5 * 60 * 1000   //  5 minutes left → show unlock prompt
const TICK_MS         = 1000

/**
 * useUnlocks(conversationId, role)
 *
 * role = 'buyer' | 'seller' | null
 *
 * Buyer ($1.99): account-wide unlock for 30 days — all seller conversations.
 * Seller ($1.99): per-conversation unlock for that one buyer only.
 *
 * Returns:
 *   timeLeftMs          — ms remaining in free window (null if unlocked)
 *   isUnlocked          — true if this chat session is unlocked
 *   isBuyerUnlocked     — true if buyer has an active account-wide unlock
 *   buyerUnlockExpiry   — timestamp (ms) when buyer unlock expires, or null
 *   showUnlockPrompt    — true when ≤5 min left or time expired
 *   unlockBalance       — seller credit balance (unused for buyers)
 *   sellerPlan          — 'free' | 'standard' | 'premium'
 *   planLimits          — PLAN_LIMITS[sellerPlan]
 *   unlockWithCredit()  — buyer: activate 30-day account unlock
 *                         seller: consume 1 credit for this conversation
 *   unlockWithSubscription(plan)
 *   loading
 */
export function useUnlocks(conversationId, role = null) {
  const { user } = useAuth()
  const userId   = user?.uid ?? user?.id ?? null
  const isBuyer  = role === 'buyer'

  const [sellerPlan,         setSellerPlan]         = useState('free')
  const [unlockBalance,      setUnlockBalance]      = useState(0)
  const [isUnlocked,         setIsUnlocked]         = useState(false)
  const [isBuyerUnlocked,    setIsBuyerUnlocked]    = useState(false)
  const [buyerUnlockExpiry,  setBuyerUnlockExpiry]  = useState(null)
  const [timeLeftMs,         setTimeLeftMs]         = useState(FREE_WINDOW_MS)
  const [showUnlockPrompt,   setShowUnlockPrompt]   = useState(false)
  const [loading,            setLoading]            = useState(true)

  const startedAtRef = useRef(null)
  const timerRef     = useRef(null)
  const promptedRef  = useRef(false)

  // ── Load plan + session on mount ──────────────────────────────────────────
  useEffect(() => {
    if (!userId || !conversationId) { setLoading(false); return }

    let cancelled = false

    ;(async () => {
      try {
        let session

        if (isBuyer) {
          const [buyerStatus, sess] = await Promise.all([
            getBuyerUnlockStatus(userId),
            getChatSession(conversationId, userId),
          ])
          if (cancelled) return
          session = sess

          if (buyerStatus.active || session.unlockedAt) {
            setIsBuyerUnlocked(buyerStatus.active)
            setBuyerUnlockExpiry(buyerStatus.expiresAt)
            setIsUnlocked(true)
            setTimeLeftMs(null)
            setShowUnlockPrompt(false)
            setLoading(false)
            return
          }
        } else {
          const [plan, sub, sess, balance] = await Promise.all([
            getSellerPlan(userId),
            getActiveSubscription(userId),
            getChatSession(conversationId, userId),
            getUnlockBalance(userId),
          ])
          if (cancelled) return
          session = sess

          const effectivePlan = sub?.plan ?? plan ?? 'free'
          setSellerPlan(effectivePlan)
          setUnlockBalance(balance)

          const limits = PLAN_LIMITS[effectivePlan]
          if (limits.unlimitedChat || session.unlockedAt) {
            setIsUnlocked(true)
            setTimeLeftMs(null)
            setShowUnlockPrompt(false)
            setLoading(false)
            return
          }
        }

        // Free window countdown
        startedAtRef.current = session.startedAt
        const elapsed   = Date.now() - session.startedAt
        const remaining = Math.max(0, FREE_WINDOW_MS - elapsed)
        setTimeLeftMs(remaining)
        if (remaining <= WARN_THRESHOLD) setShowUnlockPrompt(true)

      } catch (e) {
        console.warn('useUnlocks load error', e)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => { cancelled = true }
  }, [userId, conversationId, isBuyer])

  // ── Countdown tick ────────────────────────────────────────────────────────
  useEffect(() => {
    if (isUnlocked || timeLeftMs === null || loading) return

    timerRef.current = setInterval(() => {
      if (!startedAtRef.current) return
      const elapsed   = Date.now() - startedAtRef.current
      const remaining = Math.max(0, FREE_WINDOW_MS - elapsed)
      setTimeLeftMs(remaining)

      if (remaining <= WARN_THRESHOLD && !promptedRef.current) {
        promptedRef.current = true
        setShowUnlockPrompt(true)
      }
    }, TICK_MS)

    return () => clearInterval(timerRef.current)
  }, [isUnlocked, timeLeftMs, loading])

  // ── Buyer: activate account-wide 30-day unlock ───────────────────────────
  // ── Seller: consume 1 credit for this conversation ───────────────────────
  const unlockWithCredit = useCallback(async () => {
    if (!userId || !conversationId) return false

    if (isBuyer) {
      const expiry = await activateBuyerUnlock(userId)
      await markChatUnlocked(conversationId, userId, 'buyer_account')
      setIsBuyerUnlocked(true)
      setBuyerUnlockExpiry(expiry)
      setIsUnlocked(true)
      setTimeLeftMs(null)
      setShowUnlockPrompt(false)
      clearInterval(timerRef.current)
      return true
    }

    const ok = await consumeUnlockCredit(userId)
    if (!ok) return false
    await markChatUnlocked(conversationId, userId, 'credit')
    setIsUnlocked(true)
    setTimeLeftMs(null)
    setShowUnlockPrompt(false)
    setUnlockBalance(b => Math.max(0, b - 1))
    clearInterval(timerRef.current)
    return true
  }, [userId, conversationId, isBuyer])

  // ── Unlock after subscription purchase ───────────────────────────────────
  const unlockWithSubscription = useCallback(async (plan) => {
    if (!userId || !conversationId) return
    setSellerPlan(plan)
    await markChatUnlocked(conversationId, userId, 'subscription')
    setIsUnlocked(true)
    setTimeLeftMs(null)
    setShowUnlockPrompt(false)
    clearInterval(timerRef.current)
  }, [userId, conversationId])

  return {
    sellerPlan,
    planLimits:          PLAN_LIMITS[sellerPlan],
    unlockBalance,
    isUnlocked,
    isBuyerUnlocked,
    buyerUnlockExpiry,
    timeLeftMs,
    showUnlockPrompt,
    loading,
    unlockWithCredit,
    unlockWithSubscription,
    dismissPrompt: () => setShowUnlockPrompt(false),
  }
}

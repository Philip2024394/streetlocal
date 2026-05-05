import { useState, useRef, useEffect, useCallback } from 'react'
import { filterMessage, BLOCK_MESSAGES, logViolation } from '@/utils/contentFilter'
import { useAuth } from '@/hooks/useAuth'
import { usePushNotifications } from '@/hooks/usePushNotifications'
import { useMessages } from '@/hooks/useMessages'
import { sendMessage, sendImageMessage, sendContactMessage, unlockConversation, likeMessage, markConversationRead, postSellerContactReveal, saveOrderConversation } from '@/services/conversationService'
import { getSellerContactDetails } from '@/services/unlockService'
import { supabase } from '@/lib/supabase'
import { hasUnpaidCommission, recordCommission, COMMISSION_RATES, getSellerBalance } from '@/services/commissionService'
import { checkSpam, recordStrike, getWarningMessage } from '@/utils/spamFilter'
import { canReceiveOrders } from '@/services/walletService'
import { uploadImage } from '@/lib/uploadImage'
import { useChatPresence } from '@/hooks/useChatPresence'
import ContactShareSheet from './ContactShareSheet'
import VideoCheckBubble from './VideoCheckBubble'
import VideoCheckWindow from './VideoCheckWindow'
import { useVideoCheck } from '@/hooks/useVideoCheck'
import { useUnlocks } from '@/hooks/useUnlocks'
import UnlockGate from './UnlockGate'
import OrderCard from '@/components/orders/OrderCard'
import OfferCard from '@/components/orders/OfferCard'
import { isSellerOpen, getNextOpenTime, formatCountdown as fmtHoursCountdown } from '@/utils/sellerHours'
import BankDetailsCard from '@/components/orders/BankDetailsCard'
import PaymentVerificationCard from '@/components/orders/PaymentVerificationCard'
import OrderProcessingOverlay from '@/components/orders/OrderProcessingOverlay'
import ChatHeader from './ChatHeader'
import CommissionLockBanner from './CommissionLockBanner'
import styles from './ChatWindow.module.css'

const IS_DEMO = import.meta.env.VITE_DEMO_MODE === 'true'
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000
const WARN_DAYS      = 5

function formatTime(ms) {
  return new Date(ms).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function formatCountdown(ms) {
  if (ms == null || ms < 0) return '0:00'
  const totalSec = Math.ceil(ms / 1000)
  const min = Math.floor(totalSec / 60)
  const sec = totalSec % 60
  return `${min}:${sec.toString().padStart(2, '0')}`
}

const THEME_CONFIG = {
  dating: {
    windowClass: 'windowDating',
    headerClass: 'headerDating',
    icon: 'https://ik.imagekit.io/nepgaxllc/chat_pink-removebg-preview.png',
  },
  market: {
    windowClass: 'windowMarket',
    headerClass: 'headerMarket',
    icon: 'https://ik.imagekit.io/nepgaxllc/chat_market_place-removebg-preview.png',
  },
  food: {
    windowClass: 'windowFood',
    headerClass: 'headerFood',
    icon: 'https://ik.imagekit.io/nepgaxllc/chat_chef-removebg-preview.png',
  },
}

export default function ChatWindow({ conversation: conv, allConversations = [], onBack, onSwitchConv, onConvUpdate, isDating = false, chatTheme = null, role = null, sellerUserId = null, _forceCommissionLocked = false }) {
  // Support legacy isDating prop
  const theme = chatTheme ?? (isDating ? 'dating' : null)
  const themeConfig = THEME_CONFIG[theme] ?? null
  const { user } = useAuth()
  const { notify } = usePushNotifications()

  // Online/offline presence for the other person
  const otherUserId = conv.otherUserId ?? conv.userId ?? null
  const { isOnline } = useChatPresence(otherUserId)

  // Chat switcher panel
  const [switcherOpen, setSwitcherOpen] = useState(false)
  const otherConvs = allConversations.filter(c => c.id !== conv.id)

  // Real-time messages — falls back to conv.messages in demo
  const { messages, setMessages } = useMessages(conv.id, conv.messages ?? [])

  // Persist the opening order-card message to Supabase on first mount.
  // conv.userId is the seller's auth UUID; if it's a demo/integer ID the call
  // is a no-op inside saveOrderConversation.
  useEffect(() => {
    const opening = conv.messages?.[0]
    if (!opening?.orderCard || !conv.id.startsWith('order-')) return
    saveOrderConversation(conv.userId, opening.orderCard).then(result => {
      if (!result) return
      // Swap the local temp ID for the real Supabase UUID so status-change
      // updates can find the row with .eq('id', msgId)
      setMessages(prev => prev.map(m =>
        m.id === opening.id ? { ...m, id: result.msgId } : m
      ))
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const [text, setText]                     = useState('')
  const [blockedMsg, setBlockedMsg]         = useState(null)
  const [shareOpen, setShareOpen]           = useState(false)
  const [isTyping, setIsTyping]             = useState(false)
  const [liked, setLiked]                   = useState({})
  const messagesEndRef            = useRef(null)
  const notifiedRef               = useRef(false)
  const imageInputRef             = useRef(null)
  const prevMsgCountRef           = useRef(0)

  // Chat sound notification — beeps on incoming messages
  const playMessageSound = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)()
      const playBeep = (time, freq) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.frequency.value = freq
        osc.type = 'sine'
        gain.gain.setValueAtTime(0.3, time)
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.12)
        osc.start(time)
        osc.stop(time + 0.12)
      }
      const now = ctx.currentTime
      playBeep(now, 880)
      playBeep(now + 0.15, 1100)
      playBeep(now + 0.30, 880)
    } catch { /* audio not available */ }
  }, [])

  // 30-day history countdown
  const daysLeft = conv.unlockedAt
    ? Math.max(0, 30 - Math.floor((Date.now() - conv.unlockedAt) / THIRTY_DAYS_MS * 30))
    : null
  const historyWarning = daysLeft !== null && daysLeft <= WARN_DAYS

  // Mark as read when opened
  useEffect(() => {
    if (conv.unread > 0) markConversationRead(conv.id, conv.isUserA)
  }, [conv.id]) // eslint-disable-line

  // Notify on first reply
  const firstMessageTime = messages[0]?.time ?? null
  useEffect(() => {
    if (!firstMessageTime || notifiedRef.current) return
    notifiedRef.current = true
    notify(
      `${conv.displayName} replied! 💬`,
      { body: "Your chat is unlocked — no time limit, share contact whenever you're ready.", tag: `chat-start-${conv.id}` }
    )
  }, [firstMessageTime]) // eslint-disable-line

  // Play sound on incoming messages (not own messages, not on initial load)
  useEffect(() => {
    if (prevMsgCountRef.current === 0) {
      prevMsgCountRef.current = messages.length
      return
    }
    if (messages.length > prevMsgCountRef.current) {
      const newest = messages[messages.length - 1]
      if (newest && !newest.fromMe && !newest.isSystemWarning) {
        playMessageSound()
      }
    }
    prevMsgCountRef.current = messages.length
  }, [messages.length, playMessageSound])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (!blockedMsg) return
    const id = setTimeout(() => setBlockedMsg(null), 3500)
    return () => clearTimeout(id)
  }, [blockedMsg])

  // ── Typing indicator via Supabase Realtime presence ───────────────────────
  const typingChannelRef  = useRef(null)
  const typingTimeoutRef  = useRef(null)
  const myUserId = user?.uid ?? user?.id ?? null

  useEffect(() => {
    if (!supabase || !conv.id || !myUserId) return
    const ch = supabase.channel(`typing:${conv.id}`, { config: { presence: { key: myUserId } } })
    ch.on('presence', { event: 'sync' }, () => {
      const state = ch.presenceState()
      // Check if other user is typing (any presence key that isn't mine)
      const otherTyping = Object.keys(state).some(k => k !== myUserId && state[k]?.[0]?.typing)
      setIsTyping(otherTyping)
    }).subscribe()
    typingChannelRef.current = ch
    return () => { supabase.removeChannel(ch); typingChannelRef.current = null }
  }, [conv.id, myUserId]) // eslint-disable-line

  const broadcastTyping = useCallback((isCurrentlyTyping) => {
    if (!typingChannelRef.current) return
    typingChannelRef.current.track({ typing: isCurrentlyTyping })
  }, [])

  const handleTextChange = useCallback((e) => {
    setText(e.target.value)
    broadcastTyping(true)
    clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => broadcastTyping(false), 2000)
  }, [broadcastTyping])

  const contactUnlocked = conv.status === 'unlocked'

  // ── 20-min free chat + unlock system (dating only) ───────────────────────
  const isDatingTheme = theme === 'dating'
  const [unlockGateOpen, setUnlockGateOpen] = useState(false)
  const isBuyer = role === 'buyer'
  const {
    timeLeftMs:            _timeLeftMs,
    isUnlocked:            _chatUnlocked,
    showUnlockPrompt,
    unlockBalance,
    unlockWithCredit,
    unlockWithSubscription,
    dismissPrompt,
  } = useUnlocks(conv.id, role)

  // Chat is always free — no time limit on any theme.
  // Social media / contact details remain behind paywall (UnlockGate).
  const timeLeftMs   = null
  const chatUnlocked = true

  // After buyer pays, auto-post seller's contact details into the conversation
  const handleBuyerUnlockComplete = useCallback(async () => {
    await unlockWithCredit()
    const sellerId = sellerUserId ?? conv.otherUserId ?? null
    if (!sellerId) return
    try {
      const details = await getSellerContactDetails(sellerId, user?.uid ?? user?.id)
      const msg     = await postSellerContactReveal(conv.id, user?.uid ?? user?.id, details)
      setMessages(prev => [...prev, msg])
    } catch (e) {
      console.warn('contact reveal failed', e)
    }
  }, [unlockWithCredit, sellerUserId, conv.otherUserId, conv.id, user]) // eslint-disable-line

  // Auto-open gate when prompt fires — dating only
  useEffect(() => {
    if (isDatingTheme && showUnlockPrompt) setUnlockGateOpen(true)
  }, [isDatingTheme, showUnlockPrompt])

  // Block sending when time is up — dating only (market/food: commission lock handles it)
  const chatBlocked = !chatUnlocked && timeLeftMs !== null && timeLeftMs <= 0

  // Commission lock — seller cannot send until outstanding commission is paid
  const [commissionLocked, setCommissionLocked] = useState(_forceCommissionLocked)
  const [commissionBalance, setCommissionBalance] = useState(null)
  const [commissionProofUploading, setCommissionProofUploading] = useState(false)
  const [commissionProofSent, setCommissionProofSent] = useState(false)
  const commissionProofRef = useRef(null)
  const isSeller = role === 'seller'

  // Fetch commission balance for seller
  useEffect(() => {
    if (!isSeller || !commissionLocked) return
    const sellerId = user?.uid ?? user?.id
    if (!sellerId) return
    const commType = theme === 'food' ? 'restaurant' : 'marketplace'
    getSellerBalance(sellerId, commType).then(setCommissionBalance)
  }, [isSeller, commissionLocked, user, theme])

  // Handle seller uploading commission payment proof
  const handleCommissionProofUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setCommissionProofUploading(true)
    try {
      const url = await uploadImage(file, 'commission-proofs')
      const sellerId = user?.uid ?? user?.id
      // Save to Supabase for admin review
      if (supabase && sellerId) {
        await supabase.from('commission_payments').insert({
          seller_id: sellerId,
          screenshot_url: url,
          amount: commissionBalance?.totalOwed ?? 0,
          status: 'pending_review',
          created_at: new Date().toISOString(),
        }).catch(() => {})
        // Notify admin
        await supabase.from('notifications').insert({
          id: `NOTIF_COMM_${Date.now()}`,
          user_id: sellerId,
          type: 'commission_payment',
          title: 'Commission payment screenshot received',
          body: `Seller uploaded commission payment proof. Amount: Rp ${(commissionBalance?.totalOwed ?? 0).toLocaleString('id-ID')}`,
          data: { screenshot_url: url, seller_id: sellerId, action: 'admin_review_commission' },
          read: false,
          created_at: new Date().toISOString(),
        }).catch(() => {})
      }
      setCommissionProofSent(true)
      // Unlock chat immediately — admin reviews in background
      setCommissionLocked(false)
    } catch {
      // Fallback — still unlock if upload worked but DB failed
      setCommissionProofSent(true)
      setCommissionLocked(false)
    } finally {
      setCommissionProofUploading(false)
    }
  }

  useEffect(() => {
    if (_forceCommissionLocked) { setCommissionLocked(true); return }
    if (!isSeller) return
    const sellerId = user?.uid ?? user?.id
    if (!sellerId) return
    const commType = theme === 'food' ? 'restaurant' : 'marketplace'
    hasUnpaidCommission(sellerId, commType).then(setCommissionLocked)
  }, [isSeller, user, _forceCommissionLocked, theme]) // eslint-disable-line

  const {
    phase:          videoPhase,
    localStream,
    remoteStream,
    countdown,
    error:          videoError,
    isAvailable:    videoAvailable,
    sendRequest:    sendVideoRequest,
    acceptRequest:  acceptVideoRequest,
    declineRequest: declineVideoRequest,
    endCall:        endVideoCall,
  } = useVideoCheck(conv.id)

  const handleSend = useCallback(async () => {
    const trimmed = text.trim()
    if (!trimmed) return
    const { blocked, reason } = filterMessage(trimmed)
    if (blocked) {
      setBlockedMsg(BLOCK_MESSAGES[reason])
      // Log violation to admin — fire and forget
      logViolation({
        userId: user?.uid ?? user?.id,
        conversationId: conv.id,
        text: trimmed,
        reason,
        role: isSeller ? 'seller' : 'buyer',
      })
      // Insert a warning bubble into the chat so both users see it
      setMessages(prev => [...prev, {
        id: `warn-${Date.now()}`,
        isSystemWarning: true,
        text: `⚠️ Blocked: ${BLOCK_MESSAGES[reason]}\n\nAttempts to share contact information are logged and reviewed by admin. Repeated violations may result in account suspension.`,
        time: Date.now(),
      }])
      return
    }
    setText('')
    broadcastTyping(false)
    clearTimeout(typingTimeoutRef.current)
    const msg = await sendMessage(conv.id, user?.uid ?? user?.id, trimmed)
    if (!supabase || conv.id.startsWith('demo-') || conv.id.startsWith('conv-') || conv.id.startsWith('meet-')) {
      setMessages(prev => [...prev, { id: msg.id, fromMe: true, text: trimmed, time: Date.now() }])
    }
    if (IS_DEMO) {
      setTimeout(() => setIsTyping(true), 800)
      setTimeout(() => setIsTyping(false), 3300)
    }
    onConvUpdate?.({ lastMessage: trimmed, lastMessageTime: Date.now() })

    // Auto-reply when seller is offline/outside hours
    if (!isSeller && !sellerCurrentlyOpen && sellerHours) {
      const autoReply = conv.autoReplyMessage ?? `Hi! Thanks for your message. I'm currently outside business hours. ${nextOpenLabel ? `I'll be back ${nextOpenLabel}.` : 'I\'ll reply as soon as possible.'} Your message has been received and I'll respond when I'm back.`
      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: `auto-${Date.now()}`,
          fromMe: false,
          text: autoReply,
          time: Date.now(),
          isAutoReply: true,
        }])
      }, 1500)
    }
  }, [text, conv.id, user, onConvUpdate]) // eslint-disable-line

  // Contact sharing in social chat is intentionally free — payment only applies to
  // business contact number reveal via ContactUnlockSheet
  const handleUnlockContact = async () => {
    await unlockConversation(conv.id)
    onConvUpdate?.({ status: 'unlocked', unlockedAt: Date.now(), unread: 0 })
  }

  const handleImageSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    e.target.value = ''
    const msg = await sendImageMessage(conv.id, user?.uid ?? user?.id, url)
    setMessages(prev => [...prev, { id: msg.id, fromMe: true, imageURL: url, time: Date.now() }])
    onConvUpdate?.({ lastMessage: '📷 Photo', lastMessageTime: Date.now() })
  }

  const handleShareContact = async ({ contactType, value }) => {
    const msg = await sendContactMessage(conv.id, user?.uid ?? user?.id, contactType, value)
    setMessages(prev => [...prev, { id: msg.id, fromMe: true, contactType, contactValue: value, time: Date.now() }])
    onConvUpdate?.({ lastMessage: `📋 ${contactType}`, lastMessageTime: Date.now() })
  }

  const toggleLike = (msg) => {
    const newLiked = !msg.liked && !liked[msg.id]
    setLiked(prev => ({ ...prev, [msg.id]: newLiked }))
    likeMessage(msg.id, newLiked)
  }

  // Update order card status locally + persist to Supabase
  const handleOrderStatusChange = (msgId, newStatus) => {
    const order = messages.find(m => m.id === msgId)?.orderCard
    setMessages(prev => prev.map(m =>
      m.id === msgId
        ? { ...m, orderCard: { ...m.orderCard, status: newStatus, updatedAt: Date.now() } }
        : m
    ))
    try {
      supabase?.from('messages').update({
        order_card: { ...order, status: newStatus, updatedAt: Date.now() }
      }).eq('id', msgId).then(() => {})
    } catch { /* silent */ }

    // Record commission and lock seller chat when payment is confirmed
    // food chat → 10% restaurant rate, all others → 10% marketplace rate
    if (newStatus === 'complete' && isSeller && order) {
      const sellerId = user?.uid ?? user?.id
      const commType = theme === 'food' ? 'restaurant' : 'marketplace'
      const rate     = COMMISSION_RATES[commType]
      if (sellerId && order.total) {
        recordCommission(sellerId, order.orderId ?? msgId, order.total, commType)
          .then(() => setCommissionLocked(true))
        onConvUpdate?.({ lastMessage: `💰 ${Math.round(rate * 100)}% commission pending`, lastMessageTime: Date.now() })
      }
      // Track seller reputation
      if (supabase && sellerId) {
        supabase.rpc('increment_order_filled', { p_user_id: sellerId }).catch(() => {})
      }
    }
    if (newStatus === 'cancelled' && isSeller) {
      const sellerId = user?.uid ?? user?.id
      if (supabase && sellerId) {
        supabase.rpc('increment_order_canceled', { p_user_id: sellerId }).catch(() => {})
      }
    }

    // Auto-send eat-in reward voucher if restaurant has rewards enabled
    if (newStatus === 'complete') {
      try {
        const rewardSettings = JSON.parse(localStorage.getItem(`indoo_reward_settings_${user?.uid ?? user?.id}`) || 'null')
        if (rewardSettings?.enabled && order?.total >= rewardSettings.minOrder) {
          const voucherCode = `EATIN-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
          const expiresAt = new Date(Date.now() + (rewardSettings.validity ?? 7) * 86400000).toISOString()
          const REWARD_IMAGES = {
            10: 'https://ik.imagekit.io/nepgaxllc/Untitledcccc-removebg-preview.png?updatedAt=1775721239226',
            15: 'https://ik.imagekit.io/nepgaxllc/dsasdasdasdasaaaaaa-removebg-preview.png?updatedAt=1775721303992',
            20: 'https://ik.imagekit.io/nepgaxllc/Untitledbbbbbbbbbbb-removebg-preview.png?updatedAt=1775721392211',
            25: 'https://ik.imagekit.io/nepgaxllc/Untitledxcvzcvzxcvzxc-removebg-preview.png?updatedAt=1775721470030',
          }
          const rewardMsg = {
            id: `reward-${Date.now()}`,
            isRewardVoucher: true,
            discountPct: rewardSettings.discount,
            bannerImage: REWARD_IMAGES[rewardSettings.discount] ?? REWARD_IMAGES[10],
            voucherCode,
            expiresAt,
            sellerName: conv.displayName,
            time: Date.now(),
          }
          setTimeout(() => {
            setMessages(prev => [...prev, rewardMsg])
            onConvUpdate?.({ lastMessage: `🎁 ${rewardSettings.discount}% eat-in voucher sent`, lastMessageTime: Date.now() })
          }, 2000) // 2s delay so it feels natural after completion
        }
      } catch {}
    }

    // Inject cancelled banner into chat
    if (newStatus === 'cancelled') {
      const cancelBanner = {
        id: `cancel-banner-${Date.now()}`,
        isCancelBanner: true,
        cancelledBy: isSeller ? 'seller' : 'buyer',
        orderRef: order?.ref ?? msgId,
        orderTotal: order?.total ?? 0,
        time: Date.now(),
      }
      setMessages(prev => [...prev, cancelBanner])

      // Record cancellation for admin
      if (supabase) {
        supabase.from('order_cancellations').insert({
          order_ref: order?.ref ?? msgId,
          conversation_id: conv.id,
          buyer_id: isSeller ? (conv.otherUserId ?? conv.userId) : (user?.uid ?? user?.id),
          seller_id: isSeller ? (user?.uid ?? user?.id) : (conv.otherUserId ?? conv.userId),
          cancelled_by: isSeller ? 'seller' : 'buyer',
          order_total: order?.total ?? 0,
          reason: newStatus === 'cancelled' ? 'manual' : 'system',
          items: JSON.stringify(order?.items ?? []),
          created_at: new Date().toISOString(),
        }).catch(() => {})
      }
    }

    const label = newStatus === 'confirmed' ? '✓ Order confirmed' : newStatus === 'complete' ? '✓ Order completed' : '✗ Order cancelled'
    onConvUpdate?.({ lastMessage: label, lastMessageTime: Date.now() })
  }

  // ── Bank details: seller shares payment info in chat ─────────────────────
  const handleShareBankDetails = useCallback(() => {
    const orderMsg = messages.find(m => m.orderCard && m.orderCard.status === 'confirmed')
    const orderRef = orderMsg?.orderCard?.ref ?? `#ORDER_${Date.now().toString().slice(-8)}`
    const bankMsg = {
      id: `bank-${Date.now()}`,
      fromMe: true,
      isBankDetails: true,
      bankDetails: {
        bankName: 'Set in seller settings',
        accountNumber: '—',
        accountName: '—',
        reference: orderRef,
      },
      orderId: orderMsg?.id ?? null,
      time: Date.now(),
    }
    // Try to fetch seller's actual bank details + QRIS from Supabase
    if (supabase && (user?.uid ?? user?.id)) {
      const sellerId = user.uid ?? user.id
      Promise.all([
        supabase.from('seller_bank_details').select('bank_name, account_number, account_name').eq('user_id', sellerId).single(),
        supabase.from('restaurants').select('qris_image, bank_name, bank_account_number, bank_account_holder').eq('user_id', sellerId).single(),
      ]).then(([bankRes, restRes]) => {
        const bank = bankRes.data
        const rest = restRes.data
        if (bank) {
          bankMsg.bankDetails = { bankName: bank.bank_name, accountNumber: bank.account_number, accountName: bank.account_name, reference: orderRef }
        } else if (rest?.bank_name) {
          bankMsg.bankDetails = { bankName: rest.bank_name, accountNumber: rest.bank_account_number, accountName: rest.bank_account_holder, reference: orderRef }
        }
        if (rest?.qris_image) bankMsg.qrisImage = rest.qris_image
        setMessages(prev => [...prev, bankMsg])
      }).catch(() => setMessages(prev => [...prev, bankMsg]))
    } else {
      setMessages(prev => [...prev, bankMsg])
    }
    onConvUpdate?.({ lastMessage: '🏦 Bank details shared', lastMessageTime: Date.now() })
  }, [messages, user, conv.id, onConvUpdate]) // eslint-disable-line

  // ── Generate Indoo Market sales number #IM-XXXX ─────────────────────────
  const generateSalesNumber = () => {
    const num = Math.floor(1000 + Math.random() * 9000)
    return `#IM-${num}`
  }

  // ── Payment screenshot uploaded by buyer ────────────────────────────────
  const handleScreenshotUploaded = useCallback(({ imageUrl, orderId }) => {
    const salesNumber = generateSalesNumber()
    const verificationMsg = {
      id: `pv-${Date.now()}`,
      fromMe: true,
      isPaymentVerification: true,
      screenshotUrl: imageUrl,
      orderId,
      orderRef: messages.find(m => m.orderCard)?.orderCard?.ref ?? `#ORDER_${Date.now().toString().slice(-8)}`,
      salesNumber,
      paymentStatus: 'pending_verification',
      cancelCount: 0,
      time: Date.now(),
    }
    setMessages(prev => [...prev, verificationMsg])

    // Also attach salesNumber to the original order card message
    setMessages(prev => prev.map(m =>
      m.orderCard ? { ...m, orderCard: { ...m.orderCard, salesNumber } } : m
    ))

    onConvUpdate?.({ lastMessage: `🧾 Payment screenshot sent · ${salesNumber}`, lastMessageTime: Date.now() })

    // Show order processing overlay
    setOrderProcessing(true)

    // Record to Supabase
    if (supabase) {
      const sellerId = conv.otherUserId ?? conv.userId
      supabase.from('payment_verifications').insert({
        order_id: orderId ?? verificationMsg.id,
        conversation_id: conv.id,
        buyer_id: user?.uid ?? user?.id,
        seller_id: sellerId,
        screenshot_url: imageUrl,
        sales_number: salesNumber,
        status: 'pending_verification',
      }).catch(() => {})
    }
  }, [messages, conv, user, onConvUpdate]) // eslint-disable-line

  // ── Seller verifies payment (Order Active / Order Canceled) ─────────────
  const handlePaymentVerify = useCallback((msgId, decision) => {
    setMessages(prev => prev.map(m => {
      if (m.id !== msgId) return m
      const newCancelCount = decision === 'canceled' ? (m.cancelCount ?? 0) + 1 : m.cancelCount ?? 0
      return { ...m, paymentStatus: decision === 'active' ? 'active' : 're_upload', cancelCount: newCancelCount }
    }))

    const sellerId = user?.uid ?? user?.id
    const order = messages.find(m => m.orderCard)?.orderCard

    if (decision === 'active') {
      // Payment confirmed → record commission, update seller reputation
      onConvUpdate?.({ lastMessage: '✅ Payment verified — order active', lastMessageTime: Date.now() })
      if (sellerId && order?.total) {
        const commType = theme === 'food' ? 'restaurant' : 'marketplace'
        recordCommission(sellerId, order.orderId ?? msgId, order.total, commType)
          .then(() => setCommissionLocked(true))
      }
      // Increment orders_filled
      if (supabase && sellerId) {
        supabase.rpc('increment_order_filled', { p_user_id: sellerId }).catch(() => {})
      }
      // Update payment_verifications status
      if (supabase) {
        supabase.from('payment_verifications')
          .update({ status: 'active', verified_at: new Date().toISOString() })
          .eq('conversation_id', conv.id)
          .eq('status', 'pending_verification')
          .catch(() => {})
      }
    } else {
      // Canceled → buyer re-upload, counts against seller
      onConvUpdate?.({ lastMessage: '⚠️ Payment not verified — re-upload needed', lastMessageTime: Date.now() })
      // Increment orders_canceled on seller profile
      if (supabase && sellerId) {
        supabase.rpc('increment_order_canceled', { p_user_id: sellerId }).catch(() => {})
      }
      if (supabase) {
        supabase.from('payment_verifications')
          .update({ status: 'canceled', cancel_count: messages.find(m => m.id === msgId)?.cancelCount ?? 1 })
          .eq('conversation_id', conv.id)
          .eq('status', 'pending_verification')
          .catch(() => {})
      }
    }
  }, [messages, user, conv, theme, onConvUpdate]) // eslint-disable-line

  // ── Offer response handler ─────────────────────────────────────────────
  const handleOfferRespond = useCallback((msgId, decision, counterPrice) => {
    setMessages(prev => prev.map(m => {
      if (m.id !== msgId) return m
      return {
        ...m,
        offerCard: {
          ...m.offerCard,
          status: decision,
          counterPrice: counterPrice ?? m.offerCard?.counterPrice,
          updatedAt: Date.now(),
        },
      }
    }))
    const label = decision === 'accepted' ? '✓ Offer accepted' : decision === 'countered' ? '↩ Counter offer sent' : '✗ Offer declined'
    onConvUpdate?.({ lastMessage: label, lastMessageTime: Date.now() })
  }, [onConvUpdate])

  // ── Outside-hours detection with live countdown ────────────────────────
  const sellerHours = conv.openingHours ?? null
  const sellerCurrentlyOpen = isSellerOpen(sellerHours)
  const [hoursCountdown, setHoursCountdown] = useState('')
  const [orderProcessing, setOrderProcessing] = useState(false)
  const [nextOpenLabel, setNextOpenLabel] = useState('')

  useEffect(() => {
    if (sellerCurrentlyOpen || !sellerHours) { setHoursCountdown(''); setNextOpenLabel(''); return }
    function update() {
      const next = getNextOpenTime(sellerHours)
      if (!next) return
      setNextOpenLabel(`Opens ${next.dayShort} at ${next.time}`)
      setHoursCountdown(fmtHoursCountdown(next.diffMs))
    }
    update()
    const id = setInterval(update, 60000)
    return () => clearInterval(id)
  }, [sellerCurrentlyOpen, sellerHours])

  // Check if there's a confirmed order (seller can share bank details)
  const hasConfirmedOrder = messages.some(m => m.orderCard?.status === 'confirmed')
  const hasBankDetails = messages.some(m => m.isBankDetails)
  const canShareBank = isSeller && hasConfirmedOrder && !hasBankDetails

  const isLiked = (msg) => msg.liked || !!liked[msg.id]

  const myInitial   = user?.displayName?.[0]?.toUpperCase() ?? 'Me'
  const myPhoto     = user?.photoURL ?? null
  const themInitial = conv.displayName?.[0]?.toUpperCase() ?? '?'

  return (
    <div className={`${styles.window} ${themeConfig ? styles[themeConfig.windowClass] : ''}`}>

      {/* ── Header ── */}
      <ChatHeader
        conv={conv} isOnline={isOnline}
        switcherOpen={switcherOpen} setSwitcherOpen={setSwitcherOpen}
        otherConvs={otherConvs}
        videoAvailable={videoAvailable} videoPhase={videoPhase}
        sendVideoRequest={sendVideoRequest}
        setShareOpen={setShareOpen} onBack={onBack}
        isDatingTheme={isDatingTheme} contactUnlocked={contactUnlocked}
        themeConfig={themeConfig}
      />

      {/* ── Chat switcher slide-out panel ── */}
      {switcherOpen && (
        <div className={styles.switcherPanel}>
          <div className={styles.switcherPanelTitle}>Switch Chat</div>
          {otherConvs.map(c => (
            <button
              key={c.id}
              className={styles.switcherRow}
              onClick={() => { setSwitcherOpen(false); onSwitchConv?.(c.id) }}
            >
              <div className={styles.switcherAvatar}>
                {c.photoURL
                  ? <img src={c.photoURL} alt={c.displayName} className={styles.switcherAvatarImg} />
                  : <span className={styles.switcherAvatarInitial}>{c.displayName?.[0]?.toUpperCase() ?? '?'}</span>
                }
              </div>
              <div className={styles.switcherInfo}>
                <span className={styles.switcherName}>{c.displayName}</span>
                <span className={styles.switcherLast}>{c.lastMessage ?? 'No messages yet'}</span>
              </div>
              {c.unread > 0 && (
                <span className={styles.switcherUnread}>{c.unread > 9 ? '9+' : c.unread}</span>
              )}
            </button>
          ))}
        </div>
      )}



      {/* ── Outside business hours banner ── */}
      {!sellerCurrentlyOpen && sellerHours && !isSeller && (
        <div className={styles.hoursBanner}>
          <div className={styles.hoursBannerIcon}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <div className={styles.hoursBannerText}>
            <span className={styles.hoursBannerTitle}>Outside business hours</span>
            <span className={styles.hoursBannerSub}>
              {nextOpenLabel}{hoursCountdown ? ` (in ${hoursCountdown})` : ''}
            </span>
            <span className={styles.hoursBannerNote}>Your message has been sent — they'll see it when they're back</span>
          </div>
        </div>
      )}

      {/* ── Messages ── */}
      <div className={styles.messages}>

        {/* Chat rules — shown when no messages yet */}
        {messages.length === 0 && (
          <div className={styles.rulesCard}>
            <span className={styles.rulesIcon}>🛡️</span>
            <div className={styles.rulesBody}>
              <span className={styles.rulesTitle}>Chat Rules</span>
              <p className={styles.rulesText}>
                Do not share phone numbers, contact details, links or website URLs in this window.
                Use the <strong>Share</strong> button to exchange contact details safely.
                Violations result in your account being <strong>blocked</strong>.
              </p>
            </div>
          </div>
        )}

        {/* Safety notice — shown when no messages yet */}
        {messages.length === 0 && (
          <div className={styles.safetyCard}>
            <span className={styles.safetyCardIcon}>⚠️</span>
            <div className={styles.safetyCardBody}>
              <span className={styles.safetyCardTitle}>Meet Safely</span>
              <p className={styles.safetyCardText}>
                For any first meeting, <strong>always meet in a busy public place</strong> with active foot traffic. Never meet somewhere private or isolated. Your safety is your responsibility.
              </p>
            </div>
          </div>
        )}

        {/* All messages */}
        {messages.map(msg => (
          msg.isSystemWarning ? (
            <div key={msg.id} style={{
              display:'flex', justifyContent:'center', padding:'8px 16px',
            }}>
              <div style={{
                background:'rgba(239,68,68,0.12)', border:'1px solid rgba(239,68,68,0.3)',
                borderRadius:12, padding:'10px 16px', maxWidth:'85%',
                fontSize:12, lineHeight:1.5, color:'#fca5a5', textAlign:'center',
                whiteSpace:'pre-line',
              }}>
                {msg.text}
              </div>
            </div>
          ) :
          <div key={msg.id} className={`${styles.row} ${msg.fromMe ? styles.rowMine : styles.rowTheirs}`}>
            {!msg.fromMe && (
              <div className={styles.bubbleAvatar}>
                {conv.photoURL
                  ? <img src={conv.photoURL} alt={conv.displayName} className={styles.bubbleAvatarImg} />
                  : <span className={styles.bubbleAvatarInitial}>{themInitial}</span>
                }
              </div>
            )}

            <div className={styles.bubbleWrap}>
              {/* Order card — marketplace or restaurant order */}
              {msg.orderCard ? (
                <OrderCard
                  orderCard={msg.orderCard}
                  fromMe={msg.fromMe}
                  onStatusChange={(newStatus) => handleOrderStatusChange(msg.id, newStatus)}
                />
              ) : msg.offerCard ? (
                <OfferCard
                  offerCard={msg.offerCard}
                  fromMe={msg.fromMe}
                  onRespond={(decision, counterPrice) => handleOfferRespond(msg.id, decision, counterPrice)}
                />
              ) : msg.isBankDetails ? (
                <>
                  <BankDetailsCard
                    bankDetails={msg.bankDetails}
                    fromMe={msg.fromMe}
                    orderId={msg.orderId}
                    onScreenshotUploaded={handleScreenshotUploaded}
                  />
                  {msg.qrisImage && (
                    <div style={{ marginTop: 8, padding: 12, borderRadius: 14, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(141,198,63,0.2)', textAlign: 'center' }}>
                      <div style={{ fontSize: 12, fontWeight: 800, color: '#8DC63F', marginBottom: 8 }}>📱 Scan to Pay (QRIS)</div>
                      <img src={msg.qrisImage} alt="QRIS" style={{ width: 160, height: 160, objectFit: 'contain', borderRadius: 12, background: '#fff', padding: 6 }} />
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 6 }}>Works with GoPay, OVO, DANA & all banks</div>
                    </div>
                  )}
                </>
              ) : msg.isPaymentVerification ? (
                <PaymentVerificationCard
                  screenshotUrl={msg.screenshotUrl}
                  orderId={msg.orderId}
                  orderRef={msg.orderRef}
                  salesNumber={msg.salesNumber}
                  fromMe={msg.fromMe}
                  status={msg.paymentStatus}
                  cancelCount={msg.cancelCount}
                  onVerify={(decision) => handlePaymentVerify(msg.id, decision)}
                />
              ) : msg.isRewardVoucher ? (
                <div style={{
                  width: '100%', padding: '12px 0',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 2 }}>
                    🎁 Thank you! Here's a reward from {msg.sellerName}
                  </div>
                  <img
                    src={msg.bannerImage}
                    alt={`${msg.discountPct}% off`}
                    style={{ width: '85%', maxWidth: 300, borderRadius: 14, objectFit: 'contain' }}
                  />
                  <div style={{
                    padding: '10px 16px', borderRadius: 12,
                    background: 'rgba(141,198,63,0.1)', border: '1px solid rgba(141,198,63,0.25)',
                    textAlign: 'center', width: '85%', maxWidth: 300,
                  }}>
                    <div style={{ fontSize: 14, fontWeight: 900, color: '#8DC63F' }}>{msg.discountPct}% Off Eat-In</div>
                    <div style={{
                      margin: '6px 0', padding: '6px 12px', borderRadius: 8,
                      background: 'rgba(0,0,0,0.3)', border: '1px dashed rgba(141,198,63,0.4)',
                      fontFamily: 'monospace', fontSize: 16, fontWeight: 900, color: '#fff',
                      letterSpacing: '0.1em',
                    }}>{msg.voucherCode}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
                      Valid until {new Date(msg.expiresAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                </div>
              ) : msg.isCancelBanner ? (
                <div style={{
                  width: '100%', padding: '12px 0',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                }}>
                  <img
                    src="https://ik.imagekit.io/nepgaxllc/Cancelled%20warning%20sign%20with%20grunge%20texture.png?updatedAt=1775813934231"
                    alt="Cancelled"
                    style={{ width: '80%', maxWidth: 280, borderRadius: 12, objectFit: 'contain' }}
                  />
                  <div style={{
                    padding: '8px 16px', borderRadius: 10,
                    background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
                    textAlign: 'center', width: '80%', maxWidth: 280,
                  }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#EF4444' }}>Order Cancelled</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>
                      Cancelled by {msg.cancelledBy === 'seller' ? 'seller' : 'buyer'} · {msg.orderRef}
                    </div>
                  </div>
                </div>
              ) : msg.isContactReveal ? (
                <div className={styles.revealCard}>
                  <div className={styles.revealHeader}>
                    <span className={styles.revealIcon}>🔓</span>
                    <span className={styles.revealTitle}>
                      {msg.sellerDetails?.displayName
                        ? `${msg.sellerDetails.displayName}'s contact details`
                        : 'Seller contact details'}
                    </span>
                  </div>
                  <div className={styles.revealRows}>
                    {msg.sellerDetails?.phone && (
                      <div className={styles.revealRow}><span>📱</span><span>{msg.sellerDetails.phone}</span></div>
                    )}
                    {msg.sellerDetails?.instagram && (
                      <div className={styles.revealRow}><span>📸</span><span>@{msg.sellerDetails.instagram}</span></div>
                    )}
                    {msg.sellerDetails?.tiktok && (
                      <div className={styles.revealRow}><span>🎵</span><span>@{msg.sellerDetails.tiktok}</span></div>
                    )}
                    {msg.sellerDetails?.facebook && (
                      <div className={styles.revealRow}><span>📘</span><span>{msg.sellerDetails.facebook}</span></div>
                    )}
                    {msg.sellerDetails?.youtube && (
                      <div className={styles.revealRow}><span>▶️</span><span>{msg.sellerDetails.youtube}</span></div>
                    )}
                    {msg.sellerDetails?.website && (
                      <div className={styles.revealRow}><span>🌐</span><span>{msg.sellerDetails.website}</span></div>
                    )}
                  </div>
                  <p className={styles.revealNote}>Chat unlocked · 30 days</p>
                </div>
              ) : msg.contactType ? (
                <div className={styles.contactCard}>
                  <span className={styles.contactCardIcon}>
                    {{ phone:'📱', instagram:'📸', snapchat:'👻', tiktok:'🎵', facebook:'📘' }[msg.contactType] ?? '📋'}
                  </span>
                  <div className={styles.contactCardInfo}>
                    <span className={styles.contactCardLabel}>
                      {{ phone:'Phone Number', instagram:'Instagram', snapchat:'Snapchat', tiktok:'TikTok', facebook:'Facebook' }[msg.contactType] ?? 'Contact'}
                    </span>
                    <span className={styles.contactCardValue}>{msg.contactValue}</span>
                  </div>
                </div>
              ) : (
                /* Text or image bubble */
                <div className={`${styles.bubble} ${msg.fromMe ? styles.bubbleMine : styles.bubbleTheirs} ${msg.imageURL ? styles.bubbleImage : ''}`}>
                  {msg.isAutoReply && <span className={styles.autoReplyLabel}>Auto-reply</span>}
                  {msg.imageURL
                    ? <img src={msg.imageURL} alt="attachment" className={styles.attachmentImg} />
                    : <span className={styles.bubbleText}>{msg.text}</span>
                  }
                  <span className={styles.bubbleTime}>
                    {formatTime(msg.time)}
                    {msg.fromMe && (
                      <span className={`${styles.readTick} ${msg.read ? styles.readTickRead : styles.readTickDelivered}`}>
                        {msg.read ? '✓✓' : '✓✓'}
                      </span>
                    )}
                  </span>
                  {isLiked(msg) && (
                    <div className={styles.floatingHearts} aria-hidden="true">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className={styles.floatHeart} style={{ '--i': i }}>♥</span>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {!msg.isContactReveal && !msg.contactType && (
                <button
                  className={`${styles.likeBtn} ${isLiked(msg) ? styles.likeBtnActive : ''}`}
                  onClick={() => toggleLike(msg)}
                  aria-label="Like"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill={isLiked(msg) ? '#FF3B30' : 'none'} stroke={isLiked(msg) ? '#FF3B30' : '#fff'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                  </svg>
                </button>
              )}
            </div>

            {msg.fromMe && (
              <div className={styles.bubbleAvatar}>
                {myPhoto
                  ? <img src={myPhoto} alt="Me" className={styles.bubbleAvatarImg} />
                  : <span className={styles.bubbleAvatarInitial}>{myInitial}</span>
                }
              </div>
            )}
          </div>
        ))}

        {/* Waiting for reply indicator — shown after meet-request greeting */}
        {conv.waitingForReply && messages.length > 0 && !messages.some(m => !m.fromMe) && !isTyping && (
          <div className={styles.waitingRow}>
            <div className={styles.waitingDots}>
              <span className={styles.waitingDot} style={{ '--d': '0s' }} />
              <span className={styles.waitingDot} style={{ '--d': '0.2s' }} />
              <span className={styles.waitingDot} style={{ '--d': '0.4s' }} />
            </div>
            <span className={styles.waitingText}>Waiting for {conv.displayName} to reply…</span>
          </div>
        )}

        {/* 30-day history warning */}
        {historyWarning && (
          <div className={styles.historyWarning}>
            <span>⏳</span>
            <span>Chat history clears in <strong>{daysLeft} day{daysLeft !== 1 ? 's' : ''}</strong> — save any details you need.</span>
          </div>
        )}

        {/* Typing indicator */}
        {isTyping && (
          <div className={`${styles.row} ${styles.rowTheirs}`}>
            <div className={styles.bubbleAvatar}>
              {conv.photoURL
                ? <img src={conv.photoURL} alt={conv.displayName} className={styles.bubbleAvatarImg} />
                : <span className={styles.bubbleAvatarInitial}>{themInitial}</span>
              }
            </div>
            <div className={styles.typingBubble}>
              <span className={styles.typingDot} style={{ '--d': '0s' }} />
              <span className={styles.typingDot} style={{ '--d': '0.18s' }} />
              <span className={styles.typingDot} style={{ '--d': '0.36s' }} />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Blocked hint */}
      {blockedMsg && (
        <div className={styles.blockedHint}><span>🚫</span> {blockedMsg}</div>
      )}

      {/* ── Video check bubble (request / incoming) ── */}
      {(videoPhase === 'requesting' || videoPhase === 'incoming') && (
        <VideoCheckBubble
          phase={videoPhase}
          displayName={conv.displayName}
          onAccept={acceptVideoRequest}
          onDecline={declineVideoRequest}
        />
      )}

      {/* ── Video check error ── */}
      {videoError && (
        <div className={styles.blockedHint}><span>📷</span> {videoError}</div>
      )}

      {/* ── Commission lock banner with payment flow (seller only) ── */}
      {commissionLocked && isSeller && (
        <CommissionLockBanner
          commissionBalance={commissionBalance}
          commissionProofSent={commissionProofSent}
          commissionProofUploading={commissionProofUploading}
          commissionProofRef={commissionProofRef}
          handleCommissionProofUpload={handleCommissionProofUpload}
        />
      )}

      {/* ── Blocked banner ── */}
      {chatBlocked && !commissionLocked && (
        <button className={styles.blockedBanner} onClick={() => setUnlockGateOpen(true)}>
          <span>🔒</span>
          <span>Free chat time ended — tap to unlock and continue</span>
          <span className={styles.blockedBannerArrow}>›</span>
        </button>
      )}

      {/* ── Share bank details prompt (seller only, after order confirmed) ── */}
      {canShareBank && (
        <button
          onClick={handleShareBankDetails}
          style={{
            display:'flex', alignItems:'center', justifyContent:'center', gap:8,
            width:'calc(100% - 32px)', margin:'0 16px 8px',
            padding:'10px 16px', borderRadius:10,
            background:'rgba(0,229,255,0.1)', border:'1px solid rgba(0,229,255,0.3)',
            color:'#00E5FF', fontSize:13, fontWeight:700,
            cursor:'pointer', fontFamily:'inherit',
          }}
        >
          🏦 Share Bank Details for Payment
        </button>
      )}

      {/* ── Input bar — always visible ── */}
      <div className={styles.inputBar}>
        <button className={styles.flagBtn} aria-label="Report">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>
          </svg>
        </button>

        {/* Hidden file input — only wired when unlocked */}
        {chatUnlocked && (
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleImageSelect}
          />
        )}

        {/* Camera button — locked until chat is unlocked */}
        <button
          className={`${styles.cameraBtn} ${!chatUnlocked ? styles.cameraBtnLocked : ''}`}
          onClick={() => chatUnlocked ? imageInputRef.current?.click() : setUnlockGateOpen(true)}
          aria-label={chatUnlocked ? 'Attach image' : 'Unlock to send photos'}
          title={chatUnlocked ? 'Attach image' : 'Upgrade or unlock chat to send photos'}
        >
          {chatUnlocked ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <span className={styles.cameraBtnLockedLabel}>Pro</span>
            </>
          )}
        </button>

        <input
          className={styles.input}
          value={text}
          onChange={handleTextChange}
          onKeyDown={e => e.key === 'Enter' && !chatBlocked && !commissionLocked && handleSend()}
          placeholder={commissionLocked && isSeller ? 'Pay commission to reply…' : chatBlocked ? 'Unlock to continue chatting…' : 'Message…'}
          disabled={chatBlocked || (commissionLocked && isSeller)}
          autoComplete="off"
        />

        <button
          className={`${styles.sendBtn} ${text.trim() && !chatBlocked && !(commissionLocked && isSeller) ? styles.sendBtnActive : ''}`}
          onClick={handleSend}
          disabled={!text.trim() || chatBlocked || (commissionLocked && isSeller)}
          aria-label="Send"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
          </svg>
        </button>
      </div>

      <ContactShareSheet
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        contactUnlocked={contactUnlocked}
        onUnlockContact={handleUnlockContact}
        onSend={(contact) => {
          setShareOpen(false)
          handleShareContact(contact)
        }}
      />

      {/* ── Unlock gate modal — dating only ── */}
      {isDatingTheme && unlockGateOpen && (
        <UnlockGate
          unlockBalance={unlockBalance}
          isBuyer={isBuyer}
          onUnlockWithCredit={async () => {
            if (isBuyer) {
              await handleBuyerUnlockComplete()
            } else {
              await unlockWithCredit()
            }
            setUnlockGateOpen(false)
          }}
          onUnlockWithPlan={(plan) => { unlockWithSubscription(plan); setUnlockGateOpen(false) }}
          onDismiss={() => { dismissPrompt(); setUnlockGateOpen(false) }}
          expired={timeLeftMs !== null && timeLeftMs <= 0}
          theme={theme}
        />
      )}

      {/* ── Live video window — floats above input bar ── */}
      <VideoCheckWindow
        phase={videoPhase}
        localStream={localStream}
        remoteStream={remoteStream}
        countdown={countdown}
        displayName={conv.displayName}
        onEnd={endVideoCall}
      />

      {/* Order processing overlay — shows after payment screenshot upload */}
      <OrderProcessingOverlay
        open={orderProcessing}
        sellerName={conv.displayName}
        onClose={() => {
          setOrderProcessing(false)
          // Add notification message in chat
          setMessages(prev => [...prev, {
            id: `notify-${Date.now()}`,
            fromMe: false,
            text: `📦 Order received and in process. ${conv.displayName ?? 'Seller'} will update you soon regarding any details required and dispatch information.`,
            time: Date.now(),
            isAutoReply: true,
          }])
          onConvUpdate?.({ lastMessage: '📦 Order received — processing', lastMessageTime: Date.now() })
        }}
      />
    </div>
  )
}

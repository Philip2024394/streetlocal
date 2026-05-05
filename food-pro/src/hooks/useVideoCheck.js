import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'

// ── ICE servers ────────────────────────────────────────────────────────────────
// STUN: Google public servers (free, no account).
// TURN: OpenRelay by Metered.ca (free, 20 GB/month, no account required).
//   Uses HMAC-SHA1 static auth — credentials computed client-side from their
//   public secret. See: https://www.metered.ca/tools/openrelay/
//   The secret is intentionally public; credentials are time-limited to 1 hour.

async function getTurnCredential() {
  const secret  = 'openrelayprojectsecret'
  const expiry  = Math.floor(Date.now() / 1000) + 3600
  const username = `${expiry}:indoo`
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(username))
  const credential = btoa(String.fromCharCode(...new Uint8Array(sig)))
  return { username, credential }
}

async function getIceServers() {
  const { username, credential } = await getTurnCredential()
  return [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    {
      urls: [
        'turn:staticauth.openrelay.metered.ca:80',
        'turn:staticauth.openrelay.metered.ca:443',
        'turns:staticauth.openrelay.metered.ca:443',
      ],
      username,
      credential,
    },
  ]
}

// ── Phase machine ──────────────────────────────────────────────────────────────
// idle → requesting (we sent) | incoming (they sent)
//      → connecting (PC created, awaiting track)
//      → active (live, countdown running)
//      → idle (ended / declined)

export function useVideoCheck(conversationId) {
  const { user } = useAuth()
  const [phase, setPhase]             = useState('idle')
  const [localStream, setLocalStream] = useState(null)
  const [remoteStream, setRemoteStream] = useState(null)
  const [countdown, setCountdown]     = useState(10)
  const [error, setError]             = useState(null)

  const pcRef                = useRef(null)
  const channelRef           = useRef(null)
  const amRequesterRef       = useRef(false)
  const pendingCandidatesRef = useRef([])
  const countdownRef         = useRef(null)
  const localStreamRef       = useRef(null)

  // Conversations without a real DB ID can't use broadcast
  const isUnavailable = !conversationId ||
    conversationId.startsWith('demo-') ||
    conversationId.startsWith('conv-')

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const broadcast = useCallback((event, payload = {}) => {
    channelRef.current?.send({ type: 'broadcast', event, payload })
  }, [])

  const cleanup = useCallback((andBroadcast = false) => {
    if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null }
    if (andBroadcast) broadcast('video-ended')
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop())
      localStreamRef.current = null
    }
    if (pcRef.current) { pcRef.current.close(); pcRef.current = null }
    pendingCandidatesRef.current = []
    amRequesterRef.current = false
    setLocalStream(null)
    setRemoteStream(null)
    setCountdown(10)
    setError(null)
    setPhase('idle')
  }, [broadcast])

  const startCountdown = useCallback(() => {
    setCountdown(10)
    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { cleanup(true); return 10 }
        return prev - 1
      })
    }, 1000)
  }, [cleanup])

  // Camera only — microphone is never requested, not even as a constraint
  const createPC = useCallback(async () => {
    const pc = new RTCPeerConnection({ iceServers: await getIceServers() })
    pcRef.current = pc

    let stream
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 320 }, height: { ideal: 320 }, facingMode: 'user' },
        audio: false,  // explicit: microphone must never be accessed
      })
    } catch {
      pc.close(); pcRef.current = null
      throw new Error('Camera unavailable — check permissions and try again.')
    }

    localStreamRef.current = stream
    setLocalStream(stream)
    stream.getTracks().forEach(track => pc.addTrack(track, stream))

    const remote = new MediaStream()
    pc.ontrack = (e) => {
      e.streams[0]?.getTracks().forEach(t => remote.addTrack(t))
      setRemoteStream(remote)
      setPhase('active')
      startCountdown()
    }

    pc.onicecandidate = (e) => {
      if (e.candidate) broadcast('video-ice', { candidate: e.candidate.toJSON() })
    }

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed') cleanup(false)
    }

    setPhase('connecting')
    return pc
  }, [broadcast, startCountdown, cleanup])

  const flushCandidates = useCallback(async (pc) => {
    for (const c of pendingCandidatesRef.current) {
      try { await pc.addIceCandidate(new RTCIceCandidate(c)) } catch {}
    }
    pendingCandidatesRef.current = []
  }, [])

  // ── Broadcast channel ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!supabase || isUnavailable || !user) return

    const ch = supabase.channel(`video-${conversationId}`, {
      config: { broadcast: { self: false } },
    })

    ch.on('broadcast', { event: 'video-request' }, () => {
      setPhase(prev => prev === 'idle' ? 'incoming' : prev)
    })

    ch.on('broadcast', { event: 'video-accepted' }, async () => {
      if (!amRequesterRef.current) return
      try {
        const pc = await createPC()
        const offer = await pc.createOffer()
        await pc.setLocalDescription(offer)
        broadcast('video-offer', { sdp: { type: offer.type, sdp: offer.sdp } })
      } catch (err) {
        setError(err.message)
        cleanup(false)
      }
    })

    ch.on('broadcast', { event: 'video-declined' }, () => {
      if (amRequesterRef.current) cleanup(false)
    })

    ch.on('broadcast', { event: 'video-offer' }, async ({ payload }) => {
      if (amRequesterRef.current) return
      const pc = pcRef.current
      if (!pc) return
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp))
        await flushCandidates(pc)
        const answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)
        broadcast('video-answer', { sdp: { type: answer.type, sdp: answer.sdp } })
      } catch {}
    })

    ch.on('broadcast', { event: 'video-answer' }, async ({ payload }) => {
      if (!amRequesterRef.current) return
      const pc = pcRef.current
      if (!pc) return
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp))
        await flushCandidates(pc)
      } catch {}
    })

    ch.on('broadcast', { event: 'video-ice' }, async ({ payload }) => {
      const pc = pcRef.current
      if (!pc || !payload.candidate) return
      if (pc.remoteDescription) {
        try { await pc.addIceCandidate(new RTCIceCandidate(payload.candidate)) } catch {}
      } else {
        pendingCandidatesRef.current.push(payload.candidate)
      }
    })

    ch.on('broadcast', { event: 'video-ended' }, () => cleanup(false))

    ch.subscribe()
    channelRef.current = ch

    return () => {
      cleanup(false)
      supabase.removeChannel(ch)
      channelRef.current = null
    }
  }, [conversationId, isUnavailable, user]) // eslint-disable-line

  // ── Public API ───────────────────────────────────────────────────────────────
  const sendRequest = useCallback(() => {
    amRequesterRef.current = true
    setPhase('requesting')
    broadcast('video-request')
  }, [broadcast])

  const acceptRequest = useCallback(async () => {
    amRequesterRef.current = false
    try {
      // Get camera BEFORE signalling acceptance so our PC is ready when offer arrives
      await createPC()
      broadcast('video-accepted')
    } catch (err) {
      setError(err.message)
      broadcast('video-declined')
      setPhase('idle')
    }
  }, [broadcast, createPC])

  const declineRequest = useCallback(() => {
    broadcast('video-declined')
    setPhase('idle')
  }, [broadcast])

  const endCall = useCallback(() => cleanup(true), [cleanup])

  return {
    phase,
    localStream,
    remoteStream,
    countdown,
    error,
    isAvailable: !isUnavailable && !!supabase,
    sendRequest,
    acceptRequest,
    declineRequest,
    endCall,
  }
}

import { supabase } from '@/lib/supabase'

/**
 * No-op: Supabase phone auth doesn't require reCAPTCHA.
 * Kept so PhoneAuthScreen doesn't need to change its setup call.
 */
export function setupRecaptcha() {}

/**
 * Sign in with Google via Supabase OAuth.
 */
export async function signInWithGoogle() {
  if (!supabase) return
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin },
  })
  if (error) throw new Error(error.message)
}

/**
 * Sign in with email + password via Supabase Auth.
 */
export async function signInWithEmail(email, password) {
  if (!supabase) return
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw new Error(error.message)
  return data.user
}

/**
 * Create a new account with email + password via Supabase Auth.
 */
export async function signUpWithEmail(email, password) {
  if (!supabase) return
  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) throw new Error(error.message)
  return data.user
}

/**
 * Send an SMS OTP to the given phone number via Supabase Auth.
 * Returns a "confirmation" object { phone } used by verifyOTP.
 */
export async function sendPhoneOTP(phone) {
  if (!supabase) {
    // Demo mode — pretend we sent an OTP
    return { phone }
  }
  const { error } = await supabase.auth.signInWithOtp({ phone })
  if (error) throw new Error(error.message)
  return { phone }
}

/**
 * Verify the OTP code entered by the user.
 * `confirmation` is the object returned by sendPhoneOTP.
 */
export async function verifyOTP(confirmation, code) {
  if (!supabase) return null  // demo mode — AuthContext handles fake user
  const { data, error } = await supabase.auth.verifyOtp({
    phone: confirmation.phone,
    token: code,
    type: 'sms',
  })
  if (error) throw new Error(error.message)
  return data.user
}

export async function signOut() {
  if (!supabase) return
  await supabase.auth.signOut()
}

/**
 * Send a password-reset email. User clicks the link and lands back in the app
 * where updatePassword() can be called with their new password.
 * GDPR: Users must be able to regain access to manage/delete their data.
 */
export async function sendPasswordReset(email) {
  if (!supabase) return
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: `${window.location.origin}?reset_password=1`,
  })
  if (error) throw new Error(error.message)
}

/**
 * Update the currently signed-in user's password.
 * Call this after the user arrives from the reset-password email link.
 */
export async function updatePassword(newPassword) {
  if (!supabase) return
  if (!newPassword || newPassword.length < 8) {
    throw new Error('Password must be at least 8 characters')
  }
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) throw new Error(error.message)
}

'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string
            callback: (response: { credential: string }) => void
            auto_select?: boolean
            cancel_on_tap_outside?: boolean
          }) => void
          prompt: (notification?: (notification: unknown) => void) => void
          cancel: () => void
        }
      }
    }
  }
}

export default function GoogleOneTap() {
  const router = useRouter()
  const supabase = createClient()
  const initialized = useRef(false)

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        return // Don't show One Tap if already logged in
      }

      // Load Google One Tap script
      if (!window.google && !initialized.current) {
        const script = document.createElement('script')
        script.src = 'https://accounts.google.com/gsi/client'
        script.async = true
        script.defer = true
        document.body.appendChild(script)

        script.onload = () => {
          initializeGoogleOneTap()
        }
      } else if (window.google && !initialized.current) {
        initializeGoogleOneTap()
      }
    }

    checkUser()

    return () => {
      // Clean up Google One Tap
      if (window.google?.accounts?.id) {
        window.google.accounts.id.cancel()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase.auth])

  const initializeGoogleOneTap = () => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    
    if (!clientId) {
      console.warn('Google Client ID not configured')
      return
    }

    if (!window.google?.accounts?.id) {
      console.warn('Google One Tap library not loaded')
      return
    }

    if (initialized.current) {
      return
    }

    initialized.current = true

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: handleCredentialResponse,
      auto_select: true,
      cancel_on_tap_outside: false,
    })

    window.google.accounts.id.prompt((notification: unknown) => {
      console.log('Google One Tap notification:', notification)
    })
  }

  const handleCredentialResponse = async (response: { credential: string }) => {
    try {
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: response.credential,
      })

      if (error) {
        console.error('Error signing in with Google One Tap:', error)
        return
      }

      if (data.user) {
        router.push('/')
        router.refresh()
      }
    } catch (error) {
      console.error('Error processing Google One Tap credential:', error)
    }
  }

  return null // This component doesn't render anything
}

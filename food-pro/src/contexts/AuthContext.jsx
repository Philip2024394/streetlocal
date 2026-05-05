import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, mapAuthUser } from '@/lib/supabase'
import { DEMO_USER } from '@/demo/mockData'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined)        // undefined = loading
  const [userProfile, setUserProfile] = useState(null)

  useEffect(() => {
    const demoMode = import.meta.env.VITE_DEMO_MODE === 'true'
    if (!supabase || demoMode) {
      // Demo mode — don't auto-login, let user see landing page first
      // User will enter via "Browse as Guest" or sign-in flow
      setUser(null)
      return
    }

    // Hydrate from existing session (page reload)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const mapped = mapAuthUser(session.user)
        setUser(mapped)
        loadProfile(mapped)
      } else {
        setUser(null)
      }
    })

    // Real-time auth state changes (sign-in / sign-out)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const mapped = mapAuthUser(session.user)
        setUser(mapped)
        loadProfile(mapped)
      } else {
        setUser(null)
        setUserProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function loadProfile(authUser) {
    try {
      // Ensure row exists (first login creates it via DB trigger, but upsert is safe)
      await supabase.from('profiles').upsert({
        id: authUser.id,
        phone: authUser.phoneNumber,
        display_name: authUser.displayName,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id', ignoreDuplicates: true })

      const { data } = await supabase
        .from('profiles')
        .select(`
          display_name, photo_url, age, dob, bio, city, country,
          activities, looking_for, tier, extra_photos,
          speaking_native, speaking_second,
          price_min, price_max, brand_name, trade_role, market,
          relationship_goal, star_sign, height,
          photo_offset_x, photo_offset_y, photo_zoom,
          is_driver, driver_type, driver_online
        `)
        .eq('id', authUser.id)
        .single()

      if (data) {
        setUserProfile({
          displayName:      data.display_name ?? authUser.displayName,
          photoURL:         data.photo_url ?? null,
          age:              data.age ?? null,
          dob:              data.dob ?? null,
          bio:              data.bio ?? '',
          city:             data.city ?? '',
          country:          data.country ?? '',
          activities:       data.activities ?? [],
          lookingFor:       data.looking_for ?? '',
          tier:             data.tier ?? null,
          extraPhotos:      data.extra_photos ?? [],
          speakingNative:   data.speaking_native ?? '',
          speakingSecond:   data.speaking_second ?? '',
          priceMin:         data.price_min ?? '',
          priceMax:         data.price_max ?? '',
          brandName:        data.brand_name ?? '',
          tradeRole:        data.trade_role ?? '',
          market:           data.market ?? '',
          relationshipGoal: data.relationship_goal ?? '',
          starSign:         data.star_sign ?? '',
          height:           data.height ?? '',
          photoOffsetX:     data.photo_offset_x ?? 50,
          photoOffsetY:     data.photo_offset_y ?? 50,
          photoZoom:        data.photo_zoom ?? 1,
          isDriver:         data.is_driver ?? false,
          driverType:       data.driver_type ?? null,   // 'bike_ride' | 'car_taxi'
          driverOnline:     data.driver_online ?? false,
        })
      }
    } catch {
      setUserProfile({
        displayName: authUser.displayName,
        photoURL: null,
      })
    }
  }

  return (
    <AuthContext.Provider value={{ user, userProfile, loading: user === undefined }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext() {
  return useContext(AuthContext)
}

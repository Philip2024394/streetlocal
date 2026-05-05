import { supabase } from '@/lib/supabase'

const DEMO_WANTED = [
  { id: 'w1', user_id: 'u1', title: 'iPhone 14 Pro Max', description: 'Looking for a used iPhone 14 Pro Max in good condition. Prefer 256GB, any color.', image_url: 'https://ik.imagekit.io/nepgaxllc/Untitleddsadasaaa.png', category: 'phones_accessories', condition_pref: 'used', target_price: 8000000, city: 'Jakarta', status: 'active', created_at: new Date(Date.now() - 2 * 86400000).toISOString(), expires_at: new Date(Date.now() + 28 * 86400000).toISOString(), user: { display_name: 'Rina S.', avatar_url: null } },
  { id: 'w2', user_id: 'u2', title: 'Yamaha NMAX 2020+', description: 'Need a Yamaha NMAX 2020 or newer for daily commute in Yogyakarta. Budget flexible.', image_url: 'https://ik.imagekit.io/nepgaxllc/Untitleddsadasaaassssdasdcxcasdasdadfssdf.png', category: 'automotive', condition_pref: 'used', target_price: 18000000, city: 'Yogyakarta', status: 'active', created_at: new Date(Date.now() - 1 * 86400000).toISOString(), expires_at: new Date(Date.now() + 29 * 86400000).toISOString(), user: { display_name: 'Budi W.', avatar_url: null } },
  { id: 'w3', user_id: 'u3', title: 'Baby Stroller — Joie or similar', description: 'Looking for a gently used baby stroller. Brands: Joie, Babyzen, or similar quality. Must fold compact.', image_url: 'https://ik.imagekit.io/nepgaxllc/Untitleddsadasaaassssdasdcxc.png', category: 'mom_baby', condition_pref: 'either', target_price: 1500000, city: 'Bali', status: 'active', created_at: new Date(Date.now() - 3 * 86400000).toISOString(), expires_at: new Date(Date.now() + 27 * 86400000).toISOString(), user: { display_name: 'Dewi A.', avatar_url: null } },
  { id: 'w4', user_id: 'u4', title: 'Canon EOS R50 Camera Kit', description: 'Want a Canon EOS R50 body + lens kit. New or like new. For wedding photography side gig.', image_url: 'https://ik.imagekit.io/nepgaxllc/Untitleddsadasaaasss.png', category: 'cameras', condition_pref: 'either', target_price: 12000000, city: 'Surabaya', status: 'active', created_at: new Date(Date.now() - 5 * 86400000).toISOString(), expires_at: new Date(Date.now() + 25 * 86400000).toISOString(), user: { display_name: 'Agus P.', avatar_url: null } },
  { id: 'w5', user_id: 'u5', title: 'Thrifted Leather Jacket', description: 'Looking for a genuine leather jacket size M/L. Vintage or thrift style. Black or brown preferred.', image_url: 'https://ik.imagekit.io/nepgaxllc/Untitleddsadasdasd.png', category: 'mens_fashion', condition_pref: 'used', target_price: 500000, city: 'Bandung', status: 'active', created_at: new Date(Date.now() - 0.5 * 86400000).toISOString(), expires_at: new Date(Date.now() + 30 * 86400000).toISOString(), user: { display_name: 'Rizky M.', avatar_url: null } },
]

export async function fetchWantedItems() {
  if (!supabase) return DEMO_WANTED
  try {
    const { data, error } = await supabase
      .from('wanted_items')
      .select('*, user:user_id ( display_name, avatar_url )')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(50)
    if (error || !data?.length) return DEMO_WANTED
    return data
  } catch {
    return DEMO_WANTED
  }
}

export async function createWantedItem(userId, item) {
  if (!supabase) return { ...item, id: `w_${Date.now()}`, user_id: userId, status: 'active', created_at: new Date().toISOString(), expires_at: new Date(Date.now() + 30 * 86400000).toISOString() }
  try {
    const { data, error } = await supabase
      .from('wanted_items')
      .insert({
        user_id: userId,
        title: item.title,
        description: item.description ?? null,
        image_url: item.image_url ?? null,
        category: item.category ?? null,
        condition_pref: item.condition_pref ?? 'either',
        target_price: item.target_price ?? null,
        city: item.city ?? null,
      })
      .select('*, user:user_id ( display_name, avatar_url )')
      .single()
    if (error) throw error
    return data
  } catch (e) {
    console.warn('[wantedService] createWantedItem failed', e)
    return null
  }
}

export async function deleteWantedItem(itemId) {
  if (!supabase) return true
  try {
    const { error } = await supabase.from('wanted_items').delete().eq('id', itemId)
    return !error
  } catch { return false }
}

export async function markWantedFulfilled(itemId) {
  if (!supabase) return true
  try {
    const { error } = await supabase.from('wanted_items').update({ status: 'fulfilled' }).eq('id', itemId)
    return !error
  } catch { return false }
}

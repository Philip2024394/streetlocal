import { useState, useEffect } from 'react'
import {
  getMyProducts, addProduct, updateProduct, deleteProduct, uploadProductImage,
} from '@/services/productService'
import ProductImageEditor from '@/components/commerce/ProductImageEditor'
import { CATEGORY_SPECS, ALL_CATEGORIES, UNIVERSAL_SPECS, getSpecsForCategory } from '@/constants/categorySpecs'
import styles from './MicroShopEditor.module.css'

const PREMIUM_LIMIT = 6
const CURRENCIES = ['IDR', 'GBP', 'USD', 'EUR']
const CONDITIONS = ['Brand New', 'New (Open Box)', 'Used — Like New', 'Used — Good', 'Used — Fair', 'Refurbished']

function formatPrice(price, currency = 'IDR') {
  if (currency === 'IDR') {
    const n = parseFloat(price) || 0
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}jt`
    if (n >= 1_000) return `Rp ${n.toLocaleString('id-ID')}`
    return `Rp ${n}`
  }
  const symbols = { GBP: '£', USD: '$', EUR: '€' }
  return `${symbols[currency] ?? currency}${parseFloat(price).toFixed(2)}`
}

// ── Section Header ──────────────────────────────────────────────────────────
function SectionHeader({ title, color = '#00E5FF', subtitle }) {
  return (
    <div style={{ padding:'14px 0 6px', borderTop:'1px solid rgba(255,255,255,0.06)', marginTop:8 }}>
      <div style={{ fontSize:12, fontWeight:800, color, textTransform:'uppercase', letterSpacing:'0.06em' }}>{title}</div>
      {subtitle && <div style={{ fontSize:10, color:'rgba(255,255,255,0.3)', marginTop:2 }}>{subtitle}</div>}
    </div>
  )
}

// ── Variant Picker ──────────────────────────────────────────────────────────
function VariantPicker({ category, variants, onChange }) {
  const config = getSpecsForCategory(category)
  if (!config.variants?.length) return null

  const toggle = (key, opt) => {
    const current = variants[key] ?? []
    const next = current.includes(opt) ? current.filter(x => x !== opt) : [...current, opt]
    onChange({ ...variants, [key]: next })
  }

  return (
    <>
      <SectionHeader title="Variants" color="#FFB800" subtitle="Buyers will choose from these options" />
      {config.variants.map(field => {
        const selected = variants[field.key] ?? []
        return (
          <div key={field.key} style={{ marginBottom:12 }}>
            <label className={styles.fieldLabel}>{field.label}</label>
            <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginTop:4 }}>
              {field.options.map(opt => {
                const active = selected.includes(opt)
                return (
                  <button key={opt} type="button" onClick={() => toggle(field.key, opt)}
                    style={{
                      padding:'4px 10px', borderRadius:6, fontSize:11, fontWeight:600,
                      border: active ? '1px solid #FFB800' : '1px solid rgba(255,255,255,0.1)',
                      background: active ? 'rgba(255,184,0,0.15)' : 'rgba(255,255,255,0.03)',
                      color: active ? '#FFB800' : 'rgba(255,255,255,0.4)',
                      cursor:'pointer', fontFamily:'inherit',
                    }}
                  >{opt}</button>
                )
              })}
            </div>
            <input className={styles.input} style={{ marginTop:6, fontSize:11 }}
              placeholder="Custom options (comma-separated) + Enter"
              onKeyDown={e => {
                if (e.key !== 'Enter') return
                e.preventDefault()
                const customs = e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                if (customs.length) {
                  onChange({ ...variants, [field.key]: [...new Set([...selected, ...customs])] })
                  e.target.value = ''
                }
              }}
            />
            {selected.length > 0 && (
              <div style={{ fontSize:10, color:'rgba(255,255,255,0.25)', marginTop:3 }}>
                Selected: {selected.join(', ')}
              </div>
            )}
          </div>
        )
      })}
    </>
  )
}

// ── Product Form Sheet ──────────────────────────────────────────────────────
function ProductFormSheet({ product, userId, tier, onSaved, onClose }) {
  const isEdit = !!product
  const [name,             setName]             = useState(product?.name ?? '')
  const [price,            setPrice]            = useState(product?.price != null ? String(product.price) : '')
  const [salePrice,        setSalePrice]        = useState(product?.sale_price != null ? String(product.sale_price) : '')
  const [currency,         setCurrency]         = useState(product?.currency ?? 'IDR')
  const [category,         setCategory]         = useState(product?.category ?? '')
  const [desc,             setDesc]             = useState(product?.description ?? '')
  const [specs,            setSpecs]            = useState(product?.specs ?? {})
  const [variants,         setVariants]         = useState(product?.variants ?? {})
  const [stock,            setStock]            = useState(product?.stock != null ? String(product.stock) : '')
  const [condition,        setCondition]        = useState(product?.condition ?? '')
  const [weight,           setWeight]           = useState(product?.weight_grams != null ? String(product.weight_grams) : '')
  const [dimensions,       setDimensions]       = useState(product?.dimensions ?? '')
  const [tags,             setTags]             = useState(product?.tags ? product.tags.join(', ') : '')
  const [madeIn,           setMadeIn]           = useState(product?.made_in ?? '')
  const [customOrder,      setCustomOrder]      = useState(product?.custom_order ?? '')
  const [marketScope,      setMarketScope]      = useState(product?.market_scope ?? '')
  const [childCertified,   setChildCertified]   = useState(product?.child_certified ?? '')
  const [euCertification,  setEuCertification]  = useState(product?.eu_certification ?? '')
  const [yearManufactured, setYearManufactured] = useState(product?.year_manufactured ?? '')
  const [returnPolicy,     setReturnPolicy]     = useState(product?.return_policy ?? '14-day return in original packaging with receipt')
  const [dispatchTime,     setDispatchTime]     = useState(product?.dispatch_time ?? '')
  const [brandName,        setBrandName]        = useState(product?.brand_name ?? '')
  const [customBranding,   setCustomBranding]   = useState(product?.custom_branding ?? '')
  const [videoUrl,         setVideoUrl]         = useState(product?.video_url ?? '')
  const [imageUrl,         setImageUrl]         = useState(product?.image_url ?? product?.image ?? '')
  const [images,           setImages]           = useState(product?.images ?? [])
  const [saving,           setSaving]           = useState(false)
  const [uploading,        setUploading]        = useState(false)
  const [error,            setError]            = useState('')
  const [showEditor,       setShowEditor]       = useState(false)
  const [activeSection,    setActiveSection]    = useState('basic') // basic | specs | variants | shipping | policy

  function handleCategoryChange(val) {
    setCategory(val)
    setSpecs({})
    setVariants({})
  }

  async function handleEditorConfirm(blob, previewUrl, allUrls) {
    setShowEditor(false)
    if (!blob && !previewUrl) return
    if (allUrls?.length) { setImages(allUrls); setImageUrl(allUrls[0]); return }
    if (!blob) { setImageUrl(previewUrl); return }
    setUploading(true)
    setError('')
    try {
      const file = new File([blob], 'product.jpg', { type: 'image/jpeg' })
      const url = await uploadProductImage(userId, file)
      setImageUrl(url)
      setImages(prev => prev.length ? [url, ...prev.slice(1)] : [url])
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  function cleanSpecs(raw) {
    const out = {}
    Object.entries(raw).forEach(([k, v]) => { if (v && String(v).trim()) out[k] = String(v).trim() })
    return Object.keys(out).length ? out : null
  }

  function cleanVariants(raw) {
    const out = {}
    Object.entries(raw).forEach(([k, v]) => { if (Array.isArray(v) && v.length) out[k] = v })
    return Object.keys(out).length ? out : null
  }

  async function handleSave() {
    if (!name.trim()) return setError('Product name is required.')
    if (!price || isNaN(parseFloat(price)) || parseFloat(price) < 0)
      return setError('Enter a valid price.')
    if (!category) return setError('Please select a category.')
    setSaving(true)
    setError('')
    const parsedTags = tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : null
    const payload = {
      name, price, currency, category: category || null,
      imageUrl: imageUrl || null,
      images: images.length ? images : null,
      description: desc || null,
      specs: cleanSpecs(specs),
      variants: cleanVariants(variants),
      stock: stock !== '' ? stock : null,
      salePrice: salePrice !== '' ? salePrice : null,
      weight: weight !== '' ? weight : null,
      dimensions: dimensions || null,
      tags: parsedTags,
      condition: condition || null,
      madeIn: madeIn || null,
      customOrder: customOrder || null,
      marketScope: marketScope || null,
      childCertified: childCertified || null,
      euCertification: euCertification || null,
      yearManufactured: yearManufactured || null,
      returnPolicy: returnPolicy || null,
      dispatchTime: dispatchTime || null,
      brandName: brandName || null,
      customBranding: customBranding || null,
      videoUrl: videoUrl.trim() || null,
    }
    try {
      if (isEdit) {
        await updateProduct(product.id, payload)
      } else {
        await addProduct({ userId, tier, ...payload })
      }
      onSaved()
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  const catConfig = getSpecsForCategory(category)
  const SECTIONS = [
    { id: 'basic',    label: 'Basic Info',     icon: '📝' },
    { id: 'specs',    label: 'Specifications', icon: '📋' },
    { id: 'variants', label: 'Variants',       icon: '🎨' },
    { id: 'shipping', label: 'Shipping',       icon: '📦' },
    { id: 'policy',   label: 'Policy',         icon: '🛡️' },
  ]

  return (
    <div className={styles.sheetBackdrop} onClick={onClose}>
      <div className={styles.sheet} onClick={e => e.stopPropagation()}>
        <div className={styles.sheetHandle} />
        <div className={styles.sheetHeader}>
          <button className={styles.sheetCancel} onClick={onClose}>Cancel</button>
          <span className={styles.sheetTitle}>{isEdit ? 'Edit Product' : 'New Product'}</span>
          <button className={styles.sheetSave} onClick={handleSave} disabled={saving || uploading}>
            {saving ? '…' : 'Save'}
          </button>
        </div>

        {/* Section tabs */}
        <div style={{ display:'flex', gap:0, borderBottom:'1px solid rgba(255,255,255,0.06)', padding:'0 12px', overflowX:'auto' }}>
          {SECTIONS.map(s => (
            <button key={s.id} onClick={() => setActiveSection(s.id)}
              style={{
                padding:'8px 10px', fontSize:11, fontWeight:700, cursor:'pointer',
                border:'none', background:'none', fontFamily:'inherit',
                color: activeSection === s.id ? '#F59E0B' : 'rgba(255,255,255,0.35)',
                borderBottom: activeSection === s.id ? '2px solid #F59E0B' : '2px solid transparent',
                whiteSpace:'nowrap', flexShrink:0,
              }}
            >{s.icon} {s.label}</button>
          ))}
        </div>

        <div style={{ overflowY:'auto', flex:1, padding:'0 16px 80px' }}>

        {/* ── BASIC INFO ── */}
        {activeSection === 'basic' && (
          <>
            {/* Image picker */}
            <div className={styles.imagePicker} onClick={() => !uploading && setShowEditor(true)}>
              {imageUrl
                ? <img src={imageUrl} alt="Product" className={styles.imagePreview} />
                : <div className={styles.imagePlaceholderBtn}>
                    <span className={styles.imageIcon}>{uploading ? '⏳' : '📷'}</span>
                    <span className={styles.imageLabel}>{uploading ? 'Uploading…' : 'Add Photos (up to 5)'}</span>
                  </div>
              }
              {imageUrl && !uploading && (
                <div className={styles.imageOverlay}><span>📷 Edit Photos</span></div>
              )}
            </div>

            {/* Image count indicator */}
            {images.length > 0 && (
              <div style={{ textAlign:'center', fontSize:11, color:'rgba(255,255,255,0.3)', marginBottom:8 }}>
                {images.length} photo{images.length > 1 ? 's' : ''} added
              </div>
            )}

            <label className={styles.fieldLabel}>Product Name *</label>
            <input className={styles.input} placeholder="e.g. Leather Crossbody Bag"
              value={name} onChange={e => setName(e.target.value)} maxLength={120} />

            <label className={styles.fieldLabel}>Brand Name</label>
            <input className={styles.input} placeholder="e.g. Nike, Gucci, or your brand"
              value={brandName} onChange={e => setBrandName(e.target.value)} maxLength={80} />

            <label className={styles.fieldLabel}>Category *</label>
            <select className={styles.input} value={category} onChange={e => handleCategoryChange(e.target.value)}
              style={{ appearance:'auto' }}>
              <option value="">— Select Category —</option>
              {ALL_CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
            </select>

            <label className={styles.fieldLabel}>Price *</label>
            <div className={styles.priceRow}>
              <select className={styles.currencySelect} value={currency} onChange={e => setCurrency(e.target.value)}>
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <input className={`${styles.input} ${styles.priceInput}`} type="number" min="0" step="1"
                placeholder="0" value={price} onChange={e => setPrice(e.target.value)} />
            </div>

            <label className={styles.fieldLabel}>Sale Price <span className={styles.optional}>(optional — shows strikethrough on original)</span></label>
            <input className={styles.input} type="number" min="0" step="1" placeholder="Leave empty if no sale"
              value={salePrice} onChange={e => setSalePrice(e.target.value)} />

            <label className={styles.fieldLabel}>Condition</label>
            <select className={styles.input} value={condition} onChange={e => setCondition(e.target.value)} style={{ appearance:'auto' }}>
              <option value="">— Select —</option>
              {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            <label className={styles.fieldLabel}>Stock Quantity</label>
            <input className={styles.input} type="number" min="0" placeholder="e.g. 10"
              value={stock} onChange={e => setStock(e.target.value)} />

            <label className={styles.fieldLabel}>Description <span className={styles.optional}>(max 1000 chars)</span></label>
            <textarea className={styles.textarea} placeholder="Describe your product in detail..."
              value={desc} onChange={e => setDesc(e.target.value)} maxLength={1000} rows={4} />
            <div style={{ textAlign:'right', fontSize:10, color:'rgba(255,255,255,0.2)' }}>{desc.length}/1000</div>

            <label className={styles.fieldLabel}>Search Tags <span className={styles.optional}>(comma-separated — helps buyers find your product)</span></label>
            <input className={styles.input} placeholder="e.g. leather, handmade, bali, crossbody, women"
              value={tags} onChange={e => setTags(e.target.value)} />
          </>
        )}

        {/* ── SPECIFICATIONS ── */}
        {activeSection === 'specs' && (
          <>
            {/* Universal specs */}
            <SectionHeader title="Product Details" subtitle="These apply to all categories" />
            {UNIVERSAL_SPECS.map(field => (
              <div key={field.key} style={{ marginBottom:10 }}>
                <label className={styles.fieldLabel}>{field.label}</label>
                {field.type === 'select' ? (
                  <select className={styles.input} value={specs[field.key] ?? ''} style={{ appearance:'auto' }}
                    onChange={e => setSpecs(p => ({ ...p, [field.key]: e.target.value }))}>
                    <option value="">— Select —</option>
                    {field.options.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : field.type === 'number' ? (
                  <input className={styles.input} type="number" value={specs[field.key] ?? ''}
                    placeholder={field.placeholder ?? ''} onChange={e => setSpecs(p => ({ ...p, [field.key]: e.target.value }))} />
                ) : (
                  <input className={styles.input} value={specs[field.key] ?? ''}
                    placeholder={field.placeholder ?? ''} onChange={e => setSpecs(p => ({ ...p, [field.key]: e.target.value }))} />
                )}
              </div>
            ))}

            {/* Category-specific specs */}
            {category && catConfig.specs.length > 0 && (
              <>
                <SectionHeader title={`${catConfig.label} Specs`} color="#A855F7" />
                {catConfig.specs.map(field => (
                  <div key={field.key} style={{ marginBottom:10 }}>
                    <label className={styles.fieldLabel}>{field.label}</label>
                    {field.type === 'select' ? (
                      <select className={styles.input} value={specs[field.key] ?? ''} style={{ appearance:'auto' }}
                        onChange={e => setSpecs(p => ({ ...p, [field.key]: e.target.value }))}>
                        <option value="">— Select —</option>
                        {field.options.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    ) : field.type === 'number' ? (
                      <input className={styles.input} type="number" value={specs[field.key] ?? ''}
                        placeholder={field.placeholder ?? ''} onChange={e => setSpecs(p => ({ ...p, [field.key]: e.target.value }))} />
                    ) : (
                      <input className={styles.input} value={specs[field.key] ?? ''}
                        placeholder={field.placeholder ?? ''} onChange={e => setSpecs(p => ({ ...p, [field.key]: e.target.value }))} />
                    )}
                  </div>
                ))}
              </>
            )}

            {!category && (
              <div style={{ padding:20, textAlign:'center', color:'rgba(255,255,255,0.25)', fontSize:12 }}>
                Select a category in Basic Info to see category-specific specification fields.
              </div>
            )}
          </>
        )}

        {/* ── VARIANTS ── */}
        {activeSection === 'variants' && (
          <>
            {category ? (
              <VariantPicker category={category} variants={variants} onChange={setVariants} />
            ) : (
              <div style={{ padding:20, textAlign:'center', color:'rgba(255,255,255,0.25)', fontSize:12 }}>
                Select a category in Basic Info to see variant options (sizes, colors, etc.)
              </div>
            )}
            {(!category || !getSpecsForCategory(category).variants?.length) && category && (
              <div style={{ padding:16, textAlign:'center', color:'rgba(255,255,255,0.3)', fontSize:12 }}>
                This category has no predefined variants. Use specifications for product details.
              </div>
            )}
          </>
        )}

        {/* ── SHIPPING ── */}
        {activeSection === 'shipping' && (
          <>
            <SectionHeader title="Shipping Details" subtitle="Helps calculate delivery costs" />
            <label className={styles.fieldLabel}>Weight (grams)</label>
            <input className={styles.input} type="number" min="0" placeholder="e.g. 350"
              value={weight} onChange={e => setWeight(e.target.value)} />

            <label className={styles.fieldLabel}>Dimensions</label>
            <input className={styles.input} placeholder="e.g. 26 x 18 x 8 cm"
              value={dimensions} onChange={e => setDimensions(e.target.value)} />

            <label className={styles.fieldLabel}>Made In</label>
            <input className={styles.input} placeholder="e.g. Indonesia, China, Italy"
              value={madeIn} onChange={e => setMadeIn(e.target.value)} />

            <label className={styles.fieldLabel}>Year Manufactured</label>
            <input className={styles.input} placeholder="e.g. 2025"
              value={yearManufactured} onChange={e => setYearManufactured(e.target.value)} />

            <label className={styles.fieldLabel}>Market Scope</label>
            <select className={styles.input} value={marketScope} onChange={e => setMarketScope(e.target.value)} style={{ appearance:'auto' }}>
              <option value="">— Select —</option>
              <option value="Local Market Only">Local Market Only</option>
              <option value="Export Market Only">Export Market Only</option>
              <option value="Local & Export Market">Local & Export Market</option>
            </select>

            <label className={styles.fieldLabel}>Estimated Dispatch Time</label>
            <select className={styles.input} value={dispatchTime} onChange={e => setDispatchTime(e.target.value)} style={{ appearance:'auto' }}>
              <option value="">— Select —</option>
              <option value="Same day">Same day</option>
              <option value="1 business day">1 business day</option>
              <option value="1-2 business days">1-2 business days</option>
              <option value="2-3 business days">2-3 business days</option>
              <option value="3-5 business days">3-5 business days</option>
              <option value="5-7 business days">5-7 business days</option>
              <option value="1-2 weeks">1-2 weeks</option>
              <option value="2-4 weeks (made to order)">2-4 weeks (made to order)</option>
            </select>

            <label className={styles.fieldLabel}>Custom Order</label>
            <select className={styles.input} value={customOrder} onChange={e => setCustomOrder(e.target.value)} style={{ appearance:'auto' }}>
              <option value="">— Select —</option>
              <option value="No">No</option>
              <option value="Yes — Made to Order">Yes — Made to Order</option>
              <option value="Yes — Custom Design Available">Yes — Custom Design Available</option>
              <option value="Yes — Bulk Orders Welcome">Yes — Bulk Orders Welcome</option>
            </select>

            <label className={styles.fieldLabel}>Custom Branding for Buyer</label>
            <select className={styles.input} value={customBranding} onChange={e => setCustomBranding(e.target.value)} style={{ appearance:'auto' }}>
              <option value="">— Select —</option>
              <option value="Not available">Not available</option>
              <option value="Yes — Own label/branding">Yes — Own label/branding</option>
              <option value="Yes — White label available">Yes — White label available</option>
              <option value="Yes — Custom packaging">Yes — Custom packaging</option>
              <option value="Yes — Logo printing available">Yes — Logo printing available</option>
            </select>

            <label className={styles.fieldLabel}>Product Video (YouTube / TikTok / Instagram URL)</label>
            <input className={styles.input} placeholder="e.g. https://youtube.com/watch?v=... or TikTok link"
              value={videoUrl} onChange={e => setVideoUrl(e.target.value)} />
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: -4, marginBottom: 8 }}>
              Free — paste your YouTube, TikTok, or Instagram video link. Displays full-screen to buyers.
            </div>
          </>
        )}

        {/* ── POLICY ── */}
        {activeSection === 'policy' && (
          <>
            <SectionHeader title="Certifications & Policy" />

            <label className={styles.fieldLabel}>Child Safety Certified</label>
            <select className={styles.input} value={childCertified} onChange={e => setChildCertified(e.target.value)} style={{ appearance:'auto' }}>
              <option value="">— Select —</option>
              <option value="Not Applicable">Not Applicable</option>
              <option value="Yes — Certified">Yes — Certified</option>
              <option value="No">No</option>
              <option value="Pending Certification">Pending Certification</option>
            </select>

            <label className={styles.fieldLabel}>European Certifications</label>
            <select className={styles.input} value={euCertification} onChange={e => setEuCertification(e.target.value)} style={{ appearance:'auto' }}>
              <option value="">— Select —</option>
              {['None','CE Marked','EN71 (Toys)','REACH Compliant','RoHS Compliant','EU Organic','GMP','ISO Certified','OEKO-TEX','GOTS (Organic Textile)','Multiple — See Description'].map(o =>
                <option key={o} value={o}>{o}</option>
              )}
            </select>

            <label className={styles.fieldLabel}>Return Policy</label>
            <textarea className={styles.textarea} rows={3}
              value={returnPolicy} onChange={e => setReturnPolicy(e.target.value)}
              placeholder="e.g. 7-day return in original packaging with receipt" />

            <div style={{ padding:12, marginTop:8, borderRadius:8, background:'rgba(0,229,255,0.06)', border:'1px solid rgba(0,229,255,0.15)', fontSize:11, color:'rgba(255,255,255,0.4)', lineHeight:1.6 }}>
              All sellers must accept returns within 7 days if the buyer is not satisfied. Items must be in original packaging with purchase receipt. Buyer's reputation is not affected by legitimate returns.
            </div>
          </>
        )}

        {error && <p className={styles.error}>{error}</p>}
        </div>

        {showEditor && (
          <ProductImageEditor
            initialUrl={imageUrl || null}
            initialImages={images}
            onConfirm={handleEditorConfirm}
            onCancel={() => setShowEditor(false)}
          />
        )}
      </div>
    </div>
  )
}

// ── Main Component ──────────────────────────────────────────────────────────
export default function MicroShopEditor({ userId, tier, visible = true }) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)

  const limit = tier === 'business' ? Infinity : PREMIUM_LIMIT
  const atLimit = products.length >= limit

  async function load() {
    setLoading(true)
    try { setProducts(await getMyProducts(userId)) }
    catch { /* silent */ }
    finally { setLoading(false) }
  }

  useEffect(() => { if (visible) load() }, [visible]) // eslint-disable-line

  function openAdd() { setEditing(null); setShowForm(true) }
  function openEdit(product) { setEditing(product); setShowForm(true) }
  function closeForm() { setShowForm(false); setEditing(null) }
  async function onSaved() { closeForm(); await load() }

  async function handleDelete(product) {
    if (deleting) return
    if (!window.confirm(`Delete "${product.name}"? This cannot be undone.`)) return
    setDeleting(product.id)
    try { await deleteProduct(product.id, product.image_url) }
    catch { /* silent */ }
    finally { setDeleting(null); load() }
  }

  const specCount = (p) => {
    const sc = Object.keys(p.specs ?? {}).filter(k => p.specs[k]).length
    const vc = Object.keys(p.variants ?? {}).filter(k => p.variants[k]?.length).length
    return sc + vc
  }

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <span className={styles.headerIcon}>🛍️</span>
        <span className={styles.headerTitle}>My Shop</span>
        <span className={styles.headerMeta}>
          {tier === 'business' ? 'Unlimited' : `${products.length}/${PREMIUM_LIMIT}`}
        </span>
      </header>

      {!atLimit && (
        <button className={styles.addBtn} onClick={openAdd}>+ Add Product</button>
      )}
      {atLimit && tier !== 'business' && (
        <p className={styles.limitNote}>Upgrade to Business for unlimited products.</p>
      )}

      {loading ? (
        <div className={styles.skeletonList}>
          {[0, 1, 2].map(i => <div key={i} className={styles.skeletonRow} />)}
        </div>
      ) : products.length === 0 ? (
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>🛒</span>
          <p className={styles.emptyText}>No products yet. Tap "+ Add Product" to start selling.</p>
        </div>
      ) : (
        <div className={styles.list}>
          {products.map(p => (
            <div key={p.id} className={`${styles.row} ${!p.active ? styles.rowInactive : ''}`}>
              <div className={styles.rowThumb}>
                {p.image_url
                  ? <img src={p.image_url} alt={p.name} className={styles.thumb} />
                  : <div className={styles.thumbPlaceholder}>🛍️</div>
                }
              </div>
              <div className={styles.rowInfo}>
                <p className={styles.rowName}>{p.name}</p>
                <p className={styles.rowPrice}>
                  {p.sale_price ? (
                    <>
                      <span style={{ textDecoration:'line-through', color:'rgba(255,255,255,0.3)', marginRight:6 }}>
                        {formatPrice(p.price, p.currency)}
                      </span>
                      <span style={{ color:'#ef4444', fontWeight:800 }}>{formatPrice(p.sale_price, p.currency)}</span>
                    </>
                  ) : formatPrice(p.price, p.currency)}
                </p>
                <div style={{ display:'flex', gap:4, flexWrap:'wrap', marginTop:2 }}>
                  {p.category && <span className={styles.rowCategory}>{p.category}</span>}
                  {p.stock != null && (
                    <span style={{ fontSize:9, padding:'1px 5px', borderRadius:4, background: p.stock > 0 ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', color: p.stock > 0 ? '#22c55e' : '#ef4444', border:`1px solid ${p.stock > 0 ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}` }}>
                      {p.stock > 0 ? `${p.stock} in stock` : 'Out of stock'}
                    </span>
                  )}
                  {specCount(p) > 0 && (
                    <span style={{ fontSize:9, padding:'1px 5px', borderRadius:4, background:'rgba(0,229,255,0.08)', color:'#00E5FF', border:'1px solid rgba(0,229,255,0.15)' }}>
                      {specCount(p)} specs
                    </span>
                  )}
                  {(p.images?.length ?? 0) > 1 && (
                    <span style={{ fontSize:9, padding:'1px 5px', borderRadius:4, background:'rgba(245,158,11,0.08)', color:'#F59E0B', border:'1px solid rgba(245,158,11,0.15)' }}>
                      {p.images.length} photos
                    </span>
                  )}
                </div>
              </div>
              <div className={styles.rowActions}>
                <button className={styles.editBtn} onClick={() => openEdit(p)}>Edit</button>
                <button className={styles.deleteBtn} onClick={() => handleDelete(p)}
                  disabled={deleting === p.id}>
                  {deleting === p.id ? '…' : 'Del'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <ProductFormSheet
          product={editing}
          userId={userId}
          tier={tier}
          onSaved={onSaved}
          onClose={closeForm}
        />
      )}
    </div>
  )
}

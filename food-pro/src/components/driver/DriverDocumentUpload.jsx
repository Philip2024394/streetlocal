import { useState, useEffect, useRef } from 'react'
import { uploadDriverDocument, submitDriverApplication, getDriverApplication } from '@/services/driverService'
import styles from './DriverDocumentUpload.module.css'

const DOCS = [
  { key: 'sim',          label: 'SIM — Driver\'s License',     desc: 'Must show face, expiry date & license class (A = car · C = motorcycle)' },
  { key: 'stnk',         label: 'STNK — Vehicle Registration', desc: 'Must match your vehicle type with valid registration' },
  { key: 'ktp',          label: 'KTP — ID Card',               desc: 'Must match the name on your SIM' },
  { key: 'vehicle_photo',label: 'Vehicle Photo',               desc: 'Show the license plate clearly' },
  { key: 'selfie_sim',   label: 'Selfie with SIM',             desc: 'Your face and your SIM visible in the same photo' },
]

const MAX_BYTES = 5 * 1024 * 1024
const ACCEPT    = 'image/jpeg,image/png,image/jpg'

const STATUS_META = {
  pending:  { label: '⏳ Pending Approval',  cls: 'pending'  },
  approved: { label: '✅ Verified Driver',   cls: 'approved' },
  rejected: { label: '❌ Application Rejected', cls: 'rejected' },
}

export default function DriverDocumentUpload({ userId, driverType }) {
  const [application,  setApplication]  = useState(null)   // existing DB row
  const [loadingApp,   setLoadingApp]   = useState(true)
  const [previews,     setPreviews]     = useState({})      // docKey → data URL
  const [urls,         setUrls]         = useState({})      // docKey → Supabase public URL
  const [uploading,    setUploading]    = useState({})      // docKey → bool
  const [uploadErrors, setUploadErrors] = useState({})      // docKey → message
  const [submitting,   setSubmitting]   = useState(false)
  const [submitError,  setSubmitError]  = useState(null)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const inputRefs = useRef({})

  // Load existing application on mount
  useEffect(() => {
    if (!userId) return
    getDriverApplication(userId).then(app => {
      setApplication(app)
      if (app?.document_urls) setUrls(app.document_urls)
    }).finally(() => setLoadingApp(false))
  }, [userId])

  const allUploaded = DOCS.every(d => !!urls[d.key])
  const canSubmit   = allUploaded && termsAccepted && !submitting

  const handleFileChange = async (docKey, file) => {
    if (!file) return
    if (file.size > MAX_BYTES) {
      setUploadErrors(e => ({ ...e, [docKey]: 'File must be under 5 MB' }))
      return
    }
    if (!file.type.startsWith('image/')) {
      setUploadErrors(e => ({ ...e, [docKey]: 'Only JPG or PNG allowed' }))
      return
    }

    // Show preview immediately
    const reader = new FileReader()
    reader.onload = e => setPreviews(p => ({ ...p, [docKey]: e.target.result }))
    reader.readAsDataURL(file)

    // Upload to Supabase
    setUploading(u => ({ ...u, [docKey]: true }))
    setUploadErrors(e => ({ ...e, [docKey]: null }))
    try {
      const publicUrl = await uploadDriverDocument(userId, docKey, file)
      setUrls(u => ({ ...u, [docKey]: publicUrl }))
    } catch (err) {
      setUploadErrors(e => ({ ...e, [docKey]: err.message ?? 'Upload failed' }))
    } finally {
      setUploading(u => ({ ...u, [docKey]: false }))
    }
  }

  const handleSubmit = async () => {
    if (!canSubmit) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      const app = await submitDriverApplication(userId, driverType, urls)
      setApplication(app)
    } catch (err) {
      setSubmitError(err.message ?? 'Submission failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loadingApp) return <div className={styles.loading}>Loading driver status…</div>

  // ── Already submitted — show status ───────────────────────────────────────
  if (application) {
    const meta = STATUS_META[application.status] ?? STATUS_META.pending
    return (
      <div className={styles.statusWrap}>
        <span className={`${styles.statusBadge} ${styles[meta.cls]}`}>
          {meta.label}
        </span>
        {application.status === 'rejected' && (
          <>
            {application.admin_notes && (
              <p className={styles.adminNotes}>
                <strong>Reason:</strong> {application.admin_notes}
              </p>
            )}
            <button
              className={styles.resubmitBtn}
              onClick={() => setApplication(null)}
            >
              Resubmit Documents
            </button>
          </>
        )}
        {application.status === 'pending' && (
          <p className={styles.pendingNote}>
            Our team will review your documents within 24–48 hours.
          </p>
        )}
        {application.status === 'approved' && (
          <p className={styles.approvedNote}>
            You are now a verified Indoo driver. Go online from your profile to start receiving rides.
          </p>
        )}
      </div>
    )
  }

  // ── Upload form ────────────────────────────────────────────────────────────
  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <span className={styles.headerIcon}>{driverType === 'car_taxi' ? '🚗' : '🛵'}</span>
        <div>
          <p className={styles.headerTitle}>Driver Documents</p>
          <p className={styles.headerSub}>Upload all 5 documents to submit your application. Max 5 MB each — JPG or PNG only.</p>
        </div>
      </div>

      <div className={styles.docList}>
        {DOCS.map(doc => {
          const preview = previews[doc.key] || (urls[doc.key] ? urls[doc.key] : null)
          const done    = !!urls[doc.key]
          const busy    = !!uploading[doc.key]
          const err     = uploadErrors[doc.key]

          return (
            <div key={doc.key} className={`${styles.docRow} ${done ? styles.docRowDone : ''}`}>
              {/* Preview / placeholder */}
              <button
                className={styles.previewBox}
                onClick={() => inputRefs.current[doc.key]?.click()}
                aria-label={`Upload ${doc.label}`}
              >
                {preview
                  ? <img src={preview} alt={doc.label} className={styles.previewImg} />
                  : <span className={styles.previewPlus}>＋</span>
                }
                {busy && <div className={styles.previewOverlay}><span className={styles.spinner} /></div>}
                {done && !busy && <div className={styles.previewCheck}>✓</div>}
              </button>

              {/* Text */}
              <div className={styles.docText}>
                <span className={styles.docLabel}>{doc.label}</span>
                <span className={styles.docDesc}>{doc.desc}</span>
                {err && <span className={styles.docError}>{err}</span>}
              </div>

              {/* Hidden file input */}
              <input
                ref={el => inputRefs.current[doc.key] = el}
                type="file"
                accept={ACCEPT}
                className={styles.hiddenInput}
                onChange={e => handleFileChange(doc.key, e.target.files?.[0])}
              />
            </div>
          )
        })}
      </div>

      {/* ── Driver Terms & Conditions ── */}
      <div className={styles.termsWrap}>
        <div className={styles.termsHeader}>
          <span className={styles.termsHeaderIcon}>📋</span>
          <span className={styles.termsHeaderTitle}>Driver Terms &amp; Conditions</span>
          <span className={styles.termsHeaderSub}>PT Hammerex Products Indonesia — trading as Indoo</span>
        </div>

        <div className={styles.termsScroll}>
          <p className={styles.termsPreamble}>
            These Terms and Conditions (&ldquo;Agreement&rdquo;) govern your registration and use of the Indoo
            platform as a driver partner. This Agreement is entered into between you (&ldquo;Driver Partner&rdquo;)
            and <strong>PT Hammerex Products Indonesia</strong>, a company duly incorporated under the laws of the
            Republic of Indonesia, operating the Indoo ride-hailing application
            (&ldquo;Indoo&rdquo; / &ldquo;the Platform&rdquo;). By submitting this application you confirm you
            have read, understood, and agree to be legally bound by every clause below.
          </p>

          <div className={styles.termsSection}>
            <h4 className={styles.termsSectionTitle}>1. Platform Nature — Technology Service Only</h4>
            <p>
              Indoo is a technology platform that connects passengers and senders with independent driver
              partners. <strong>PT Hammerex Products Indonesia does not provide transportation or logistics
              services and is not a transport operator.</strong> Indoo acts solely as an intermediary
              technology provider. All transportation services are provided exclusively by you, the Driver
              Partner, in your own capacity.
            </p>
          </div>

          <div className={styles.termsSection}>
            <h4 className={styles.termsSectionTitle}>2. Independent Contractor Status</h4>
            <p>
              You acknowledge and agree that your relationship with PT Hammerex Products Indonesia is that
              of an <strong>independent contractor (mitra pengemudi)</strong>, not an employee, agent, joint
              venture partner, or representative of the company. Nothing in this Agreement shall be construed
              to create any employment, agency, partnership, or franchise relationship. Indoo has no
              obligation to provide minimum earnings, guaranteed hours, benefits, pension contributions,
              health insurance, severance pay, or any other employment entitlement under Indonesian Manpower
              Law (Undang-Undang Ketenagakerjaan) or any applicable regulation.
            </p>
          </div>

          <div className={styles.termsSection}>
            <h4 className={styles.termsSectionTitle}>3. Tax &amp; Government Obligations (Indonesian Law)</h4>
            <p>
              As an independent contractor operating in the Republic of Indonesia, <strong>you are solely and
              fully responsible</strong> for all tax obligations arising from your activities on the platform,
              including but not limited to:
            </p>
            <ul className={styles.termsList}>
              <li>Income tax (Pajak Penghasilan / PPh) on all earnings received through the platform, in
                accordance with the Indonesian Income Tax Law (UU No. 7 Tahun 1983 and its amendments).</li>
              <li>Registration with the Indonesian tax authority (Direktorat Jenderal Pajak) and obtaining a
                Tax Identification Number (NPWP) where required by law.</li>
              <li>Any social security contributions (BPJS Ketenagakerjaan / BPJS Kesehatan) as required for
                self-employed individuals under Indonesian law.</li>
              <li>Any other government fees, levies, or regulatory charges applicable to your ride-hailing
                activities.</li>
            </ul>
            <p>
              <strong>PT Hammerex Products Indonesia bears no liability whatsoever for your personal tax
              obligations.</strong> Indoo will not withhold, file, or remit taxes on your behalf unless
              required to do so by applicable Indonesian law.
            </p>
          </div>

          <div className={styles.termsSection}>
            <h4 className={styles.termsSectionTitle}>4. Account Exclusivity — No Account Sharing</h4>
            <p>
              Your Indoo Driver account is strictly personal and non-transferable. <strong>You must not
              allow any other individual to access, operate, or use your Indoo driver account under any
              circumstances</strong>, including but not limited to allowing another person to accept rides,
              go online, or communicate with passengers using your account. Any such sharing constitutes a
              material breach of this Agreement and will result in immediate permanent suspension without
              appeal. Any exception requires prior written authorisation from Indoo admin, which may be
              granted or refused at Indoo&apos;s sole discretion. You accept full legal liability for all
              activity conducted through your account.
            </p>
          </div>

          <div className={styles.termsSection}>
            <h4 className={styles.termsSectionTitle}>5. Vehicle Roadworthiness &amp; Safety</h4>
            <p>
              You warrant and represent that your vehicle:
            </p>
            <ul className={styles.termsList}>
              <li>Is currently roadworthy and meets all Indonesian road-safety standards (SNI) at all times
                while on the platform.</li>
              <li>Holds a valid STNK (Surat Tanda Nomor Kendaraan) and passes all applicable KIR (Uji Berkala
                Kendaraan) inspections where required.</li>
              <li>Is free from any mechanical malfunction, defect, or condition that could endanger the
                safety of passengers, cargo, or other road users.</li>
              <li>Is adequately insured as required under Indonesian law.</li>
            </ul>
            <p>
              You agree to immediately cease operations on the Indoo platform if your vehicle becomes
              unroadworthy or unsafe for any reason. <strong>PT Hammerex Products Indonesia accepts no
              liability for accidents, injuries, losses, or claims arising from the mechanical condition
              or roadworthiness of your vehicle.</strong>
            </p>
          </div>

          <div className={styles.termsSection}>
            <h4 className={styles.termsSectionTitle}>6. Compliance with Indonesian Law</h4>
            <p>
              You agree to comply with all applicable Indonesian laws and regulations at all times while
              using the Indoo platform, including traffic laws, ride-hailing regulations (Permenhub),
              passenger data privacy obligations (UU PDP), and consumer protection regulations (UU
              Perlindungan Konsumen). Any violation of applicable law is your sole responsibility.
            </p>
          </div>

          <div className={styles.termsSection}>
            <h4 className={styles.termsSectionTitle}>7. Limitation of Liability</h4>
            <p>
              To the maximum extent permitted by applicable Indonesian law, <strong>PT Hammerex Products
              Indonesia, its directors, officers, employees, and affiliates shall not be liable</strong> for
              any direct, indirect, incidental, special, consequential, or punitive damages arising out of
              or in connection with your use of the Indoo platform, including but not limited to loss of
              income, loss of data, personal injury, property damage, or third-party claims.
            </p>
          </div>

          <div className={styles.termsSection}>
            <h4 className={styles.termsSectionTitle}>8. Platform Suspension &amp; Termination</h4>
            <p>
              PT Hammerex Products Indonesia reserves the right to suspend or permanently terminate your
              Driver account at any time, with or without notice, if you breach any term of this Agreement,
              receive sustained low ratings, engage in fraudulent or abusive conduct, or for any other reason
              at Indoo&apos;s sole discretion. No compensation is owed for suspension or termination.
            </p>
          </div>

          <div className={styles.termsSection}>
            <h4 className={styles.termsSectionTitle}>9. Governing Law &amp; Dispute Resolution</h4>
            <p>
              This Agreement shall be governed by and construed in accordance with the laws of the Republic
              of Indonesia. Any dispute arising out of or in connection with this Agreement shall be subject
              to the exclusive jurisdiction of the competent courts of Indonesia. PT Hammerex Products
              Indonesia reserves the right to seek injunctive or other equitable relief in any court of
              competent jurisdiction.
            </p>
          </div>

          <div className={styles.termsSection}>
            <h4 className={styles.termsSectionTitle}>10. Amendments</h4>
            <p>
              PT Hammerex Products Indonesia may amend these Terms at any time. Continued use of the Indoo
              platform after notification of amendments constitutes your acceptance of the revised terms.
            </p>
          </div>

          <p className={styles.termsFooter}>
            <strong>PT Hammerex Products Indonesia</strong> — Registered company in the Republic of Indonesia.
            Trading as <strong>Indoo</strong>. All rights reserved.
          </p>
        </div>

        {/* Acceptance checkbox */}
        <label className={styles.termsCheck}>
          <input
            type="checkbox"
            className={styles.termsCheckInput}
            checked={termsAccepted}
            onChange={e => setTermsAccepted(e.target.checked)}
          />
          <span className={styles.termsCheckBox} aria-hidden="true">
            {termsAccepted ? '✓' : ''}
          </span>
          <span className={styles.termsCheckLabel}>
            I have read and fully agree to the Indoo Driver Terms &amp; Conditions. I understand I am an
            independent contractor, solely responsible for my tax obligations, and that PT Hammerex Products
            Indonesia does not employ me.
          </span>
        </label>
      </div>

      {submitError && <p className={styles.submitError}>{submitError}</p>}

      <button
        className={styles.submitBtn}
        onClick={handleSubmit}
        disabled={!canSubmit}
      >
        {submitting ? 'Submitting…' : allUploaded && !termsAccepted ? 'Accept Terms to Submit' : `Submit Application (${Object.keys(urls).length}/5 uploaded)`}
      </button>
    </div>
  )
}

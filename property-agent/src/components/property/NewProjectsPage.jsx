/**
 * NewProjectsPage — Full-screen page for browsing new developer projects.
 */
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { getNewProjects, fmtRp, STATUS_LABELS } from '@/services/newProjectService'
import NewProjectDetail from './NewProjectDetail'
import NewProjectListingForm from './NewProjectListingForm'
import IndooFooter from '@/components/ui/IndooFooter'

const BG = 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-apr-30-2026-07_44_48-pm.png'
const glass = { background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16 }

export default function NewProjectsPage({ open, onClose }) {
  const [projects, setProjects] = useState([])
  const [selected, setSelected] = useState(null)
  const [showListForm, setShowListForm] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (open) getNewProjects().then(setProjects)
  }, [open])

  if (!open) return null

  let filtered = projects
  if (search.trim()) {
    const q = search.toLowerCase()
    filtered = projects.filter(p => p.project_name?.toLowerCase().includes(q) || p.developer_name?.toLowerCase().includes(q) || p.city?.toLowerCase().includes(q))
  }

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 9400, background: `#0a0a0a url("${BG}") center/cover no-repeat`, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Header */}
      <div style={{ flexShrink: 0, padding: '14px 16px 12px' }}>
        <h1 style={{ fontSize: 20, fontWeight: 900, color: '#fff', margin: '0 0 4px' }}>🏗️ <span style={{ color: '#FACC15' }}>New</span> Projects</h1>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: 0, fontWeight: 600 }}>{filtered.length} projects</p>
          <button onClick={() => setShowListForm(true)} style={{
            padding: '6px 14px', borderRadius: 20, cursor: 'pointer', fontFamily: 'inherit',
            background: 'rgba(250,204,21,0.15)', border: '1.5px solid rgba(250,204,21,0.35)',
            color: '#FACC15', fontSize: 11, fontWeight: 800,
          }}>+ List Your Project</button>
        </div>

        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px', height: 42, background: 'rgba(0,0,0,0.7)', border: '1.5px solid rgba(255,255,255,0.1)', borderRadius: 12, marginTop: 10 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search projects..." style={{ flex: 1, background: 'none', border: 'none', color: '#fff', fontSize: 13, fontFamily: 'inherit', outline: 'none' }} />
        </div>
      </div>

      {/* Projects list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 100px' }}>
        {filtered.length === 0 && <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.3)' }}>No projects found</div>}

        {filtered.map(project => {
          const statusInfo = STATUS_LABELS[project.status] || STATUS_LABELS.pre_sale
          const soldPct = project.total_units > 0 ? Math.round((project.units_sold || 0) / project.total_units * 100) : 0
          return (
            <button key={project.id} onClick={() => setSelected(project)} style={{
              width: '100%', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              textAlign: 'left', padding: 0, marginBottom: 14, background: 'none',
            }}>
              <div style={{ ...glass, overflow: 'hidden' }}>
                {/* Image */}
                <div style={{ height: 160, position: 'relative', overflow: 'hidden' }}>
                  <img src={project.images?.[0] || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600'} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(transparent 40%, rgba(0,0,0,0.85))' }} />
                  <div style={{ position: 'absolute', top: 10, left: 10, padding: '4px 10px', borderRadius: 8, background: `${statusInfo.color}20`, border: `1px solid ${statusInfo.color}40`, fontSize: 11, fontWeight: 800, color: statusInfo.color }}>{statusInfo.label}</div>
                  <div style={{ position: 'absolute', top: 10, right: 10, padding: '4px 10px', borderRadius: 8, background: 'rgba(0,0,0,0.6)', fontSize: 11, fontWeight: 700, color: '#60A5FA' }}>📅 {project.completion_date}</div>
                  <div style={{ position: 'absolute', bottom: 10, left: 12, right: 12 }}>
                    <div style={{ fontSize: 18, fontWeight: 900, color: '#fff', textShadow: '0 2px 6px rgba(0,0,0,0.8)' }}>{project.project_name}</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>by {project.developer_name}</div>
                  </div>
                </div>

                {/* Info */}
                <div style={{ padding: '12px 14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>Starting from</div>
                      <div style={{ fontSize: 18, fontWeight: 900, color: '#FACC15' }}>{fmtRp(project.min_price)}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{project.units?.length || 0} unit types</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#8DC63F' }}>{project.units_sold || 0}/{project.total_units} sold</div>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${soldPct}%`, borderRadius: 2, background: soldPct > 80 ? '#EF4444' : '#8DC63F' }} />
                  </div>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      <IndooFooter label="New Projects" onBack={onClose} onHome={onClose} />

      {/* Detail overlay */}
      <NewProjectDetail open={!!selected} onClose={() => setSelected(null)} project={selected} />
      <NewProjectListingForm open={showListForm} onClose={() => { setShowListForm(false); getNewProjects().then(setProjects) }} />
    </div>,
    document.body
  )
}

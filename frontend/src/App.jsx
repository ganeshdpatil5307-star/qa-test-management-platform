import { useEffect, useMemo, useState } from 'react'
import { Link, NavLink, Navigate, Outlet, Route, Routes, useNavigate, useParams } from 'react-router-dom'
import { api } from './api'
import { useAuth } from './useAuth'
import './App.css'

const emptyBug = {
  title: '', description: '', project: '', environment: '', stepsToReproduce: '',
  expectedResult: '', actualResult: '', severity: 'MEDIUM', priority: 'MEDIUM',
  status: 'OPEN', assignee: '', reporter: '',
}

const statusLabels = { OPEN: 'Open', IN_PROGRESS: 'In progress', RESOLVED: 'Resolved', CLOSED: 'Closed' }
const severityLabels = { LOW: 'Low', MEDIUM: 'Medium', HIGH: 'High', CRITICAL: 'Critical' }
const priorityLabels = { LOW: 'Low', MEDIUM: 'Medium', HIGH: 'High', URGENT: 'Urgent' }

function App() {
  return <Routes>
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />
    <Route element={<ProtectedRoute />}><Route element={<Layout />}>
      <Route path="/" element={<Dashboard />} />
      <Route path="/bugs" element={<BugList />} />
      <Route path="/bugs/new" element={<BugForm />} />
      <Route path="/bugs/:id" element={<BugDetails />} />
      <Route path="/bugs/:id/edit" element={<BugForm />} />
    </Route></Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
}

function ProtectedRoute() {
  const { user } = useAuth()
  return user ? <Outlet /> : <Navigate to="/login" replace />
}

function Layout() {
  const { user, logout } = useAuth()
  return <div className="app-shell">
    <header className="topbar"><Link to="/" className="brand"><span className="brand-mark">Q</span><span>Quality Desk</span></Link>
      <nav><NavLink to="/" end>Dashboard</NavLink><NavLink to="/bugs">Bug list</NavLink></nav>
      <div className="account-menu"><span className="account-name">{user.username} <small>{user.role}</small></span><button className="button secondary" onClick={logout}>Log out</button><Link to="/bugs/new" className="button primary top-action"><span>+</span> Report bug</Link></div>
    </header>
    <main className="page-content"><Outlet /></main>
  </div>
}

function Login() {
  const { login, authError } = useAuth(); const navigate = useNavigate(); const [form, setForm] = useState({ username: '', password: '' }); const [busy, setBusy] = useState(false)
  const submit = async (event) => { event.preventDefault(); setBusy(true); try { await login(form); navigate('/') } catch { } finally { setBusy(false) } }
  return <AuthPage eyebrow="Welcome back" title="Sign in to Quality Desk" footer={<span>New here? <Link to="/register">Create an account</Link></span>}><form className="auth-form" onSubmit={submit}>{authError && <Notice>{authError}</Notice>}<Field label="Username" name="username" value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} required autoComplete="username" /><Field label="Password" type="password" name="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required autoComplete="current-password" /><button className="button primary full" disabled={busy}>{busy ? 'Signing in...' : 'Sign in'}</button></form></AuthPage>
}

function Register() {
  const { register, authError } = useAuth(); const navigate = useNavigate(); const [form, setForm] = useState({ username: '', password: '' }); const [busy, setBusy] = useState(false)
  const submit = async (event) => { event.preventDefault(); setBusy(true); try { await register(form); navigate('/') } catch { } finally { setBusy(false) } }
  return <AuthPage eyebrow="Get started" title="Create your tester account" footer={<span>Already registered? <Link to="/login">Sign in</Link></span>}><form className="auth-form" onSubmit={submit}>{authError && <Notice>{authError}</Notice>}<Field label="Username" name="username" value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} required minLength="3" autoComplete="username" /><Field label="Password" type="password" name="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required minLength="8" autoComplete="new-password" /><small className="form-hint">New accounts are created with the TESTER role.</small><button className="button primary full" disabled={busy}>{busy ? 'Creating account...' : 'Create account'}</button></form></AuthPage>
}

function AuthPage({ eyebrow, title, footer, children }) { return <div className="auth-shell"><div className="auth-card"><Link to="/" className="brand"><span className="brand-mark">Q</span><span>Quality Desk</span></Link><span className="eyebrow">{eyebrow}</span><h1>{title}</h1>{children}<div className="auth-footer">{footer}</div></div></div> }

function useBugs({ page = 0, size = 1000, search = '', status = '', priority = '', severity = '', assignee = '', project = '', sortBy = 'updatedAt', sortDirection = 'DESC' } = {}) {
  const [bugs, setBugs] = useState([])
  const [pageInfo, setPageInfo] = useState({ number: 0, totalPages: 1, totalElements: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => {
    api.get('/bugs', { params: { page, size, search: search || undefined, status: status || undefined, priority: priority || undefined, severity: severity || undefined, assignee: assignee || undefined, project: project || undefined, sortBy, sortDirection } })
      .then(({ data }) => { setBugs(data.content ?? data); setPageInfo({ number: data.number ?? 0, totalPages: Math.max(data.totalPages ?? 1, 1), totalElements: data.totalElements ?? data.length }) })
      .catch(() => setError('Could not load bugs. Is the Spring Boot API running?'))
      .finally(() => setLoading(false))
  }, [page, size, search, status, priority, severity, assignee, project, sortBy, sortDirection])
  return { bugs, pageInfo, loading, error }
}

function Dashboard() {
  const { bugs, loading, error } = useBugs()
  const counts = useMemo(() => ({ open: bugs.filter((bug) => bug.status === 'OPEN').length, progress: bugs.filter((bug) => bug.status === 'IN_PROGRESS').length, resolved: bugs.filter((bug) => bug.status === 'RESOLVED').length, critical: bugs.filter((bug) => bug.severity === 'CRITICAL').length }), [bugs])
  return <>
    <PageIntro eyebrow="Workspace overview" title="Good testing starts with visibility." description="Track, triage, and resolve product issues from one calm workspace." action={<Link to="/bugs/new" className="button primary">+ Report a bug</Link>} />
    {error && <Notice>{error}</Notice>}
    <section className="stat-grid"><Stat label="Open bugs" value={counts.open} tone="coral" /><Stat label="In progress" value={counts.progress} tone="amber" /><Stat label="Resolved" value={counts.resolved} tone="teal" /><Stat label="Critical" value={counts.critical} tone="ink" /></section>
    <section className="dashboard-grid"><div className="panel activity-panel"><div className="panel-heading"><div><span className="eyebrow">Recent activity</span><h2>Latest reports</h2></div><Link to="/bugs" className="text-link">View all</Link></div>{loading ? <Loading /> : bugs.length ? bugs.slice(0, 5).map((bug) => <BugRow key={bug.id} bug={bug} />) : <EmptyState />}</div><div className="panel side-panel"><span className="eyebrow">Triage pulse</span><h2>Make the next move count.</h2><p>Keep urgent issues visible and give every report a clear owner.</p><div className="pulse-line"><span>Needs attention</span><strong>{counts.open + counts.critical}</strong></div><Link to="/bugs" className="button secondary full">Review bug queue</Link></div></section>
  </>
}

function Stat({ label, value, tone }) { return <div className={`stat-card ${tone}`}><span>{label}</span><strong>{value}</strong><small>Current total</small></div> }

function BugList() {
  const [page, setPage] = useState(0)
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState({ status: '', priority: '', severity: '', assignee: '', project: '' })
  const [sort, setSort] = useState({ sortBy: 'updatedAt', sortDirection: 'DESC' })
  const { bugs, pageInfo, loading, error } = useBugs({ page, size: 8, search: query, ...filters, ...sort })
  const changeFilter = (event) => { setPage(0); setFilters((current) => ({ ...current, [event.target.name]: event.target.value })) }
  const changeSort = (event) => { setPage(0); setSort((current) => ({ ...current, [event.target.name]: event.target.value })) }
  return <><PageIntro eyebrow="Issue tracker" title="Bug list" description="A single queue for every issue your team needs to move forward." action={<Link to="/bugs/new" className="button primary">+ Report a bug</Link>} /><section className="panel table-panel"><div className="toolbar"><label className="search-field"><span>⌕</span><input value={query} onChange={(event) => { setPage(0); setQuery(event.target.value) }} placeholder="Search title or description..." /></label><select name="status" value={filters.status} onChange={changeFilter}><option value="">All statuses</option>{Object.entries(statusLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select><select name="priority" value={filters.priority} onChange={changeFilter}><option value="">All priorities</option>{Object.entries(priorityLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select><select name="severity" value={filters.severity} onChange={changeFilter}><option value="">All severities</option>{Object.entries(severityLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select><input className="filter-input" name="assignee" value={filters.assignee} onChange={changeFilter} placeholder="Assignee" /><input className="filter-input" name="project" value={filters.project} onChange={changeFilter} placeholder="Project" /><select name="sortBy" value={sort.sortBy} onChange={changeSort}><option value="updatedAt">Sort: Updated</option><option value="createdAt">Sort: Created</option><option value="title">Sort: Title</option><option value="status">Sort: Status</option><option value="priority">Sort: Priority</option><option value="severity">Sort: Severity</option><option value="assignee">Sort: Assignee</option><option value="project">Sort: Project</option></select><select name="sortDirection" value={sort.sortDirection} onChange={changeSort}><option value="DESC">Newest first</option><option value="ASC">Oldest first</option></select></div>{error && <Notice>{error}</Notice>}{loading ? <Loading /> : bugs.length ? <div className="bug-table"><div className="table-head"><span>Issue</span><span>Status</span><span>Priority</span><span>Owner</span><span>Updated</span></div>{bugs.map((bug) => <BugRow key={bug.id} bug={bug} detailed />)}</div> : <EmptyState message="No bugs match these filters." />}<div className="pagination"><span>{pageInfo.totalElements} {pageInfo.totalElements === 1 ? 'bug' : 'bugs'}</span><div><button className="page-button" disabled={pageInfo.number === 0 || loading} onClick={() => setPage((current) => current - 1)}>← Previous</button><span>Page {pageInfo.number + 1} of {pageInfo.totalPages}</span><button className="page-button" disabled={pageInfo.number >= pageInfo.totalPages - 1 || loading} onClick={() => setPage((current) => current + 1)}>Next →</button></div></div></section></>
}

function BugRow({ bug, detailed = false }) { return <Link to={`/bugs/${bug.id}`} className={`bug-row ${detailed ? 'detailed' : ''}`}><div className="bug-main"><span className={`severity-dot ${bug.severity.toLowerCase()}`}></span><div><strong>{bug.title}</strong><small>{bug.project} <span>·</span> #{bug.id}</small></div></div><StatusBadge value={bug.status} />{detailed && <><span className={`priority ${bug.priority.toLowerCase()}`}>{priorityLabels[bug.priority]}</span><span className="owner">{bug.assignee}</span><span className="date">{formatDate(bug.updatedAt)}</span></>}</Link> }

function BugDetails() {
  const { id } = useParams(); const navigate = useNavigate(); const { user } = useAuth(); const [bug, setBug] = useState(null); const [error, setError] = useState('')
  useEffect(() => { api.get(`/bugs/${id}`).then(({ data }) => setBug(data)).catch(() => setError('This bug could not be found.')) }, [id])
  const remove = async () => { if (window.confirm('Delete this bug?')) { await api.delete(`/bugs/${id}`); navigate('/bugs') } }
  if (error) return <><PageIntro eyebrow="Issue not found" title="We could not find that bug." action={<Link to="/bugs" className="button secondary">Back to bugs</Link>} /><Notice>{error}</Notice></>
  if (!bug) return <Loading />
  return <><div className="detail-top"><Link to="/bugs" className="back-link">← All bugs</Link><div className="detail-actions">{['ADMIN', 'DEVELOPER'].includes(user.role) && <Link to={`/bugs/${id}/edit`} className="button secondary">Edit bug</Link>}{user.role === 'ADMIN' && <button className="button danger" onClick={remove}>Delete</button>}</div></div><section className="detail-header"><div className="detail-title"><div className="tag-row"><StatusBadge value={bug.status} /><span className={`priority ${bug.priority.toLowerCase()}`}>{priorityLabels[bug.priority]} priority</span></div><h1>{bug.title}</h1><p>#{bug.id} · Reported by {bug.reporter} · Updated {formatDate(bug.updatedAt)}</p></div></section><div className="detail-layout"><article className="panel detail-body"><DetailSection title="Description"><p>{bug.description}</p></DetailSection><DetailSection title="Steps to reproduce"><p className="preserve">{bug.stepsToReproduce}</p></DetailSection><div className="two-column"><DetailSection title="Expected result"><p>{bug.expectedResult}</p></DetailSection><DetailSection title="Actual result"><p>{bug.actualResult}</p></DetailSection></div></article><aside className="panel metadata"><span className="eyebrow">Details</span><Meta label="Project" value={bug.project} /><Meta label="Environment" value={bug.environment} /><Meta label="Severity" value={severityLabels[bug.severity]} /><Meta label="Assignee" value={bug.assignee} /><Meta label="Created" value={formatDate(bug.createdAt)} /></aside></div></>
}

function DetailSection({ title, children }) { return <section className="detail-section"><h3>{title}</h3>{children}</section> }
function Meta({ label, value }) { return <div className="meta-item"><span>{label}</span><strong>{value}</strong></div> }
function StatusBadge({ value }) { return <span className={`status-badge ${value.toLowerCase()}`}>{statusLabels[value]}</span> }

function BugForm() {
  const { id } = useParams(); const navigate = useNavigate(); const editing = Boolean(id); const [form, setForm] = useState(emptyBug); const [saving, setSaving] = useState(false); const [error, setError] = useState('')
  useEffect(() => { if (editing) api.get(`/bugs/${id}`).then(({ data }) => setForm(data)).catch(() => setError('Could not load this bug.')) }, [editing, id])
  const change = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  const submit = async (event) => { event.preventDefault(); setSaving(true); setError(''); const payload = { ...form }; delete payload.id; delete payload.createdAt; delete payload.updatedAt; try { const response = editing ? await api.put(`/bugs/${id}`, payload) : await api.post('/bugs', payload); navigate(`/bugs/${response.data.id}`) } catch (requestError) { setError(requestError.response?.data?.error || 'Please complete all required fields.') } finally { setSaving(false) } }
  return <><PageIntro eyebrow={editing ? 'Update issue' : 'New issue'} title={editing ? 'Edit bug' : 'Create a bug'} description={editing ? 'Keep the report accurate as the investigation moves forward.' : 'Capture enough context for the team to reproduce and resolve the issue.'} /><form className="panel form-panel" onSubmit={submit}>{error && <Notice>{error}</Notice>}<div className="form-grid"><Field label="Title" name="title" value={form.title} onChange={change} required wide placeholder="Short, specific summary" /><Field label="Project" name="project" value={form.project} onChange={change} required placeholder="e.g. Customer portal" /><Field label="Environment" name="environment" value={form.environment} onChange={change} required placeholder="e.g. QA / Chrome" /><Field label="Reporter" name="reporter" value={form.reporter} onChange={change} required placeholder="Name" /><Field label="Assignee" name="assignee" value={form.assignee} onChange={change} required placeholder="Name" /><SelectField label="Severity" name="severity" value={form.severity} onChange={change} options={severityLabels} /><SelectField label="Priority" name="priority" value={form.priority} onChange={change} options={priorityLabels} /><SelectField label="Status" name="status" value={form.status} onChange={change} options={statusLabels} /><TextArea label="Description" name="description" value={form.description} onChange={change} required wide placeholder="What is happening?" /><TextArea label="Steps to reproduce" name="stepsToReproduce" value={form.stepsToReproduce} onChange={change} required wide placeholder="1. Go to...&#10;2. Select..." /><TextArea label="Expected result" name="expectedResult" value={form.expectedResult} onChange={change} required placeholder="What should happen?" /><TextArea label="Actual result" name="actualResult" value={form.actualResult} onChange={change} required placeholder="What happens instead?" /></div><div className="form-actions"><Link to={editing ? `/bugs/${id}` : '/bugs'} className="button secondary">Cancel</Link><button className="button primary" disabled={saving}>{saving ? 'Saving...' : editing ? 'Save changes' : 'Create bug'}</button></div></form></>
}

function Field({ label, wide, ...props }) { return <label className={wide ? 'field wide' : 'field'} htmlFor={props.name}><span>{label}{props.required && ' *'}</span><input id={props.name} {...props} /></label> }
function TextArea({ label, wide, ...props }) { return <label className={wide ? 'field wide' : 'field'} htmlFor={props.name}><span>{label}{props.required && ' *'}</span><textarea id={props.name} rows="4" {...props} /></label> }
function SelectField({ label, options, ...props }) { return <label className="field"><span>{label}</span><select {...props}>{Object.entries(options).map(([value, text]) => <option key={value} value={value}>{text}</option>)}</select></label> }
function PageIntro({ eyebrow, title, description, action }) { return <div className="page-intro"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{description}</p></div>{action}</div> }
function Notice({ children }) { return <div className="notice">{children}</div> }
function Loading() { return <div className="loading">Loading your bug queue...</div> }
function EmptyState({ message = 'No bugs have been reported yet.' }) { return <div className="empty-state"><strong>{message}</strong><span>New findings will appear here.</span></div> }
function formatDate(date) { return date ? new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(date)) : '—' }

export default App

import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Activity, ArrowDownRight, ArrowRight, ArrowUpRight, Bell, Check, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, CircleHelp, Clock3, Copy, ExternalLink, FileText, Filter, Home, Inbox, LayoutDashboard, LoaderCircle, Mail, Menu, MoreHorizontal, Plus, RotateCcw, Search, Send, Settings2, Sparkles, Users, X } from 'lucide-react';
import './styles.css';

const statusOptions = ['All leads', 'New', 'Contacted', 'Qualified', 'Closed'];
const services = ['Buyer consultation', 'Home valuation', 'Listing inquiry', 'Property management', 'Other'];
const initials = (name = '') => name.split(/\s+/).map((part) => part[0]).slice(0, 2).join('').toUpperCase();
const timeAgo = (date) => {
  const mins = Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 60000));
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
  return `${Math.floor(mins / 1440)}d ago`;
};

async function api(url, options) {
  const response = await fetch(url, options);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) { const error = new Error(body.error || 'Request failed.'); error.fields = body.fields; throw error; }
  return body;
}

function App() {
  const [leads, setLeads] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [view, setView] = useState('dashboard');
  const [filter, setFilter] = useState('All leads');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [resetting, setResetting] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [notice, setNotice] = useState('');

  const loadLeads = async () => {
    setLoading(true); setError('');
    try { const { leads: list } = await api('/api/leads'); setLeads(list); setActiveId((id) => list.some((lead) => lead.id === id) ? id : list[0]?.id ?? null); }
    catch { setError('We couldn’t connect to the local API. Start the app with npm run dev and try again.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { loadLeads(); }, []);
  useEffect(() => { if (!notice) return; const timer = setTimeout(() => setNotice(''), 3500); return () => clearTimeout(timer); }, [notice]);

  const filtered = useMemo(() => leads.filter((lead) => {
    const matchesStatus = filter === 'All leads' || lead.status === filter;
    const text = `${lead.name} ${lead.email} ${lead.service} ${lead.message}`.toLowerCase();
    return matchesStatus && text.includes(query.toLowerCase());
  }), [leads, filter, query]);
  const activeLead = leads.find((lead) => lead.id === activeId);
  const count = (status) => leads.filter((lead) => lead.status === status).length;
  const today = leads.filter((lead) => new Date(lead.createdAt).toDateString() === new Date().toDateString()).length;

  async function resetDemo() {
    setResetting(true);
    try { await api('/api/reset', { method: 'POST' }); await loadLeads(); setView('dashboard'); setNotice('Demo data restored to its original sample leads.'); }
    catch { setError('Reset didn’t complete. Please try again.'); }
    finally { setResetting(false); }
  }
  async function changeStatus(id, status) {
    try { const { lead } = await api(`/api/leads/${id}/status`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ status }) }); setLeads((all) => all.map((item) => item.id === id ? lead : item)); setNotice(`Lead moved to ${status}.`); }
    catch { setNotice('Couldn’t update status. Please try again.'); }
  }

  return <div className="app-shell">
    <aside className={`sidebar ${mobileNav ? 'sidebar-open' : ''}`}>
      <div className="brand"><div className="brand-mark"><Activity size={17} strokeWidth={2.7}/></div><span>LeadFlow<span className="brand-ai">AI</span></span></div>
      <button className="workspace-switch"><div className="workspace-avatar">N</div><span><b>Northstar Realty</b><small>Workspace</small></span><ChevronDown size={15}/></button>
      <div className="nav-label">WORKSPACE</div>
      <nav className="nav-list" aria-label="Main navigation">
        <button className={`nav-item ${view === 'dashboard' ? 'selected' : ''}`} onClick={() => {setView('dashboard');setMobileNav(false)}}><LayoutDashboard size={17}/>Dashboard</button>
        <button className={`nav-item ${view === 'leads' ? 'selected' : ''}`} onClick={() => {setView('leads');setMobileNav(false)}}><Inbox size={17}/>All leads<span className="nav-count">{leads.length}</span></button>
        <button className={`nav-item ${view === 'capture' ? 'selected' : ''}`} onClick={() => {setView('capture');setMobileNav(false)}}><FileText size={17}/>Capture form<span className="new-dot"/></button>
      </nav>
      <div className="nav-label nav-label-spaced">MANAGE</div>
      <nav className="nav-list" aria-label="Management navigation">
        <button className="nav-item" onClick={() => setNotice('Follow-up reminders are simulated in this demo.')}><Clock3 size={17}/>Follow-ups<span className="nav-count muted">{leads.length}</span></button>
        <button className="nav-item" onClick={() => setNotice('Workspace settings are preview-only in this demo.')}><Settings2 size={17}/>Settings</button>
      </nav>
      <div className="sidebar-spacer"/>
      <div className="plan-card"><div className="plan-icon"><Sparkles size={15}/></div><b>Your demo workspace</b><p>Explore the lead flow with sample data.</p><button onClick={() => setView('capture')}>Open capture form <ArrowRight size={14}/></button></div>
      <button className="profile-row"><div className="profile-avatar">JD</div><span><b>Jordan Davis</b><small>Workspace owner</small></span><MoreHorizontal size={17}/></button>
    </aside>
    {mobileNav && <button className="nav-scrim" aria-label="Close menu" onClick={() => setMobileNav(false)}/>}
    <main className="main-area">
      <header className="topbar"><button className="mobile-menu icon-button" aria-label="Open navigation" onClick={() => setMobileNav(true)}><Menu size={20}/></button><div className="breadcrumbs"><span>Workspace</span><ChevronRight size={14}/><b>{view === 'capture' ? 'Capture form' : view === 'leads' ? 'All leads' : 'Dashboard'}</b></div><div className="topbar-actions"><div className="automation-chip"><span className="pulse-dot"/>Automation active</div><button className="icon-button help-button" aria-label="Help" onClick={() => setNotice('LeadFlow is a local demo. All responses and follow-ups are simulated.')}><CircleHelp size={18}/></button><button className="icon-button bell-button" aria-label="Notifications" onClick={() => setNotice('You’re all caught up.')}><Bell size={18}/><i/></button><div className="top-avatar">JD</div></div></header>
      {view === 'capture' ? <CapturePage onCreated={(lead) => {setLeads((all) => [lead, ...all]);setActiveId(lead.id);setNotice('New lead captured and draft response prepared.')}}/> : <>
        <div className="page-heading"><div><div className="eyebrow">{new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date()).toUpperCase()} <span className="eyebrow-sep"/> YOUR PIPELINE AT A GLANCE</div><h1>{view === 'leads' ? 'All leads' : 'Good morning, Jordan'}<span className="wave">{view === 'dashboard' ? '✳' : ''}</span></h1><p>{view === 'leads' ? 'A complete view of every inquiry in your pipeline.' : 'Here’s what’s happening with your leads today.'}</p></div><div className="heading-buttons"><button className="button button-quiet" onClick={resetDemo} disabled={resetting}><RotateCcw size={15} className={resetting ? 'spin' : ''}/>{resetting ? 'Resetting…' : 'Reset demo'}</button><button className="button button-primary" onClick={() => setView('capture')}><Plus size={16}/> Add a lead</button></div></div>
        {error && <div className="alert error-alert"><span>{error}</span><button onClick={loadLeads}>Retry</button></div>}
        <div className="sample-banner"><span className="sample-icon"><Sparkles size={14}/></span><span><b>Demo workspace</b><span className="banner-divider">·</span> Fictional sample leads, deterministic response templates, and simulated follow-ups.</span><button onClick={() => setNotice('No email or SMS messages are sent by this demo.')}>How it works <ArrowRight size={13}/></button></div>
        <section className="metric-grid" aria-label="Lead metrics">
          <Metric label="Total leads" value={leads.length} caption="Across your pipeline" icon={<Users size={17}/>} tint="blue" trend="+12.5%" />
          <Metric label="New inquiries" value={count('New')} caption={`${today} received today`} icon={<Inbox size={17}/>} tint="violet" trend={`${today ? '+' : ''}${today}`} />
          <Metric label="Needs follow-up" value={count('New') + count('Contacted')} caption="Reminder queued" icon={<Clock3 size={17}/>} tint="amber" trend="On track" />
          <Metric label="Qualified" value={count('Qualified')} caption="Ready for next step" icon={<CheckCircle2 size={17}/>} tint="green" trend="In pipeline" />
        </section>
        <section className="content-grid">
          <div className="leads-card">
            <div className="card-head"><div><h2>{view === 'leads' ? 'Lead directory' : 'Recent leads'}</h2><p>Keep every conversation moving forward.</p></div><button className="text-button" onClick={() => setView('leads')}>View all <ArrowRight size={14}/></button></div>
            <div className="table-toolbar"><div className="status-tabs" role="tablist" aria-label="Filter leads by status">{statusOptions.map((item) => <button key={item} role="tab" aria-selected={filter === item} className={filter === item ? 'active' : ''} onClick={() => setFilter(item)}>{item}{item === 'All leads' && <span>{leads.length}</span>}</button>)}</div><div className="table-tools"><label className="search-field"><Search size={15}/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search leads" aria-label="Search leads"/><kbd>⌘ K</kbd></label><button className="filter-button" onClick={() => setNotice('Use the status tabs to filter your pipeline.')} aria-label="Filter leads"><Filter size={15}/></button></div></div>
            <div className="table-wrap"><table><thead><tr><th><span className="check-box"/></th><th>LEAD</th><th>INTEREST</th><th>STATUS</th><th>RECEIVED</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>
              {loading ? <tr><td colSpan="6"><div className="table-state"><LoaderCircle className="spin" size={19}/> Loading leads…</div></td></tr> : filtered.length === 0 ? <tr><td colSpan="6"><div className="table-state empty-state"><div className="empty-icon"><Search size={19}/></div><b>No leads match this view</b><span>Try another status or search term.</span><button className="text-button" onClick={() => {setFilter('All leads');setQuery('')}}>Clear filters</button></div></td></tr> : filtered.slice(0, view === 'leads' ? 20 : 6).map((lead) => <tr key={lead.id} className={activeId === lead.id ? 'row-active' : ''} onClick={() => setActiveId(lead.id)} tabIndex="0" onKeyDown={(e) => e.key === 'Enter' && setActiveId(lead.id)}>
                <td><span className="check-box"/></td><td><div className="lead-cell"><div className={`lead-avatar avatar-${lead.id % 5}`}>{initials(lead.name)}</div><div><b>{lead.name}{lead.isSample && <span className="sample-mini">SAMPLE</span>}</b><small>{lead.email}</small></div></div></td><td><span className="interest-label">{lead.service}</span></td><td><Status status={lead.status}/></td><td><span className="received">{timeAgo(lead.createdAt)}</span></td><td><button className="row-more" onClick={(e) => {e.stopPropagation();setActiveId(lead.id)}} aria-label={`Open ${lead.name} details`}><MoreHorizontal size={17}/></button></td>
              </tr>)}
            </tbody></table></div>
            <div className="table-footer"><span>Showing <b>{Math.min(filtered.length, view === 'leads' ? 20 : 6)}</b> of <b>{filtered.length}</b> leads</span><div><button className="pager" disabled><ChevronLeft size={15}/></button><button className="pager current">1</button><button className="pager" disabled><ChevronRight size={15}/></button></div></div>
          </div>
          <div className="side-column">
            <div className="automation-card"><div className="automation-head"><div className="automation-symbol"><Sparkles size={16}/></div><span className="live-label"><i/> ACTIVE</span></div><h3>Lead response flow</h3><p>Every new inquiry gets a thoughtful first touch, ready for your review.</p><div className="flow-steps"><div className="flow-step"><span className="flow-check"><Check size={12}/></span><div><b>Lead captured</b><small>Form submission received</small></div><span className="step-status">Automatic</span></div><div className="flow-line"/><div className="flow-step"><span className="flow-check"><Check size={12}/></span><div><b>Response drafted</b><small>Personalized template prepared</small></div><span className="step-status">Automatic</span></div><div className="flow-line"/><div className="flow-step"><span className="flow-clock"><Clock3 size={12}/></span><div><b>Follow-up reminder</b><small>Simulated · tomorrow at 9 AM</small></div><span className="step-status manual">Reminder</span></div></div><div className="template-note"><span><Sparkles size={13}/></span> Template-based automation <button aria-label="About template-based automation" onClick={() => setNotice('Drafts use deterministic text templates. There is no live AI integration.')}>ⓘ</button></div></div>
            <div className="activity-card"><div className="activity-title"><h3>Recent activity</h3><button className="icon-button small" aria-label="More activity options"><MoreHorizontal size={17}/></button></div><div className="activity-list">{leads.slice(0, 4).map((lead, i) => <div className="activity-item" key={lead.id}><div className={`activity-icon activity-${i % 3}`}>{i === 0 ? <Inbox size={14}/> : i === 1 ? <Sparkles size={14}/> : <Clock3 size={14}/>}</div><div><b>{lead.isSample ? 'Sample lead added' : 'New lead captured'}</b><small>{lead.name} · {timeAgo(lead.createdAt)}</small></div></div>)}</div><button className="activity-link" onClick={() => setView('leads')}>View activity log <ArrowRight size={14}/></button></div>
          </div>
        </section>
        <div className="footer-note"><span><span className="pulse-dot"/> Local demo environment</span><span>LeadFlow AI <i>·</i> v1.0.0 <i>·</i> No messages are sent</span></div>
      </>}
    </main>
    {activeLead && view !== 'capture' && <LeadDrawer lead={activeLead} onClose={() => setActiveId(null)} onStatus={changeStatus}/>}
    {notice && <div className="toast" role="status"><CheckCircle2 size={17}/>{notice}<button aria-label="Dismiss notification" onClick={() => setNotice('')}><X size={15}/></button></div>}
  </div>;
}

function Metric({ label, value, caption, icon, tint, trend }) { return <div className="metric-card"><div className="metric-top"><span>{label}</span><span className={`metric-icon ${tint}`}>{icon}</span></div><div className="metric-value">{value}</div><div className="metric-bottom"><span>{caption}</span><span className={`metric-trend ${tint}`}>{tint === 'green' ? <ArrowUpRight size={12}/> : tint === 'amber' ? <Clock3 size={11}/> : <ArrowUpRight size={12}/>} {trend}</span></div></div>; }
function Status({ status }) { const cls = status.toLowerCase(); return <span className={`status-pill status-${cls}`}><i/>{status}</span>; }

function LeadDrawer({ lead, onClose, onStatus }) {
  const [copied, setCopied] = useState(false);
  async function copyDraft() { try { await navigator.clipboard.writeText(lead.draft); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { setCopied(false); } }
  return <><button className="drawer-scrim" onClick={onClose} aria-label="Close lead details"/><aside className="detail-drawer" aria-label={`Details for ${lead.name}`}><div className="drawer-top"><div><span className="drawer-kicker">LEAD DETAILS</span><button className="icon-button small" onClick={onClose} aria-label="Close details"><X size={18}/></button></div><div className="detail-person"><div className={`lead-avatar large avatar-${lead.id % 5}`}>{initials(lead.name)}</div><div><h2>{lead.name}</h2><p>Inquiry received {timeAgo(lead.createdAt)}</p></div></div><div className="drawer-status"><label htmlFor="lead-status">Lead status</label><span><Status status={lead.status}/><ChevronDown size={14}/></span><select id="lead-status" value={lead.status} onChange={(e) => onStatus(lead.id, e.target.value)} aria-label="Change lead status">{['New', 'Contacted', 'Qualified', 'Closed'].map((s) => <option key={s}>{s}</option>)}</select></div></div><div className="drawer-content"><section className="detail-section"><h3>Contact information</h3><div className="contact-line"><Mail size={15}/><span>{lead.email}</span><button title="Copy email" onClick={() => navigator.clipboard?.writeText(lead.email)}><Copy size={13}/></button></div>{lead.phone && <div className="contact-line"><span className="phone-symbol">☎</span><span>{lead.phone}</span><button title="Copy phone" onClick={() => navigator.clipboard?.writeText(lead.phone)}><Copy size={13}/></button></div>}</section><section className="detail-section"><h3>Interested in</h3><div className="service-chip"><Home size={14}/>{lead.service}</div></section><section className="detail-section"><h3>Message</h3><p className="lead-message">“{lead.message}”</p></section><section className="detail-section draft-section"><div className="draft-header"><h3><Sparkles size={14}/> Response draft</h3><span className="draft-tag">TEMPLATE</span></div><div className="draft-box"><p>{lead.draft}</p></div><div className="draft-actions"><button className="button button-quiet" onClick={copyDraft}>{copied ? <Check size={14}/> : <Copy size={14}/>} {copied ? 'Copied' : 'Copy draft'}</button><button className="button button-primary" onClick={() => alert('This is a local demo. No email is sent.')}><Mail size={14}/> Review &amp; send</button></div><p className="draft-disclaimer"><span><CircleHelp size={13}/></span> Template-based draft. Review before use. Nothing is sent automatically.</p></section><section className="detail-section activity-section"><h3>Activity log</h3><div className="timeline">{lead.activity?.map((item, i) => <div className="timeline-item" key={`${item.type}-${i}`}><span className={`timeline-dot ${item.type}`}>{item.type === 'draft_created' ? <Sparkles size={11}/> : item.type === 'follow_up_scheduled' ? <Clock3 size={11}/> : item.type === 'status_changed' ? <Activity size={11}/> : <Check size={11}/>}</span><div><b>{item.detail}</b><small>{timeAgo(item.createdAt)}</small></div></div>)}</div></section></div></aside></>;
}

function CapturePage({ onCreated }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', service: '', message: '' });
  const [errors, setErrors] = useState({}); const [busy, setBusy] = useState(false); const [success, setSuccess] = useState(false); const [apiError, setApiError] = useState('');
  function update(key, value) { setForm((current) => ({ ...current, [key]: value })); setErrors((current) => ({ ...current, [key]: '' })); }
  async function submit(e) { e.preventDefault(); setApiError(''); setSuccess(false); setBusy(true); try { const { lead } = await api('/api/leads', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(form) }); onCreated(lead); setSuccess(true); setForm({ name: '', email: '', phone: '', service: '', message: '' }); } catch (err) { if (err.fields) setErrors(err.fields); else setApiError(err.message); } finally { setBusy(false); } }
  return <div className="capture-page"><div className="capture-heading"><div className="eyebrow">PUBLIC LEAD CAPTURE</div><h1>Make every inquiry count.</h1><p>A polished, simple way to start a conversation with a potential client.</p></div><div className="capture-layout"><div className="capture-preview"><div className="preview-top"><div className="preview-brand"><div className="brand-mark"><Activity size={15}/></div><b>Northstar Realty</b></div><span>LOCAL DEMO</span></div><div className="preview-copy"><div className="preview-pill"><span/> HERE TO HELP</div><h2>Let’s find the<br/><em>right next step.</em></h2><p>Tell us a little about what you’re looking for. Our team will be in touch soon.</p><div className="preview-points"><span><CheckCircle2 size={15}/> Personal, helpful guidance</span><span><CheckCircle2 size={15}/> No pressure, just a conversation</span></div></div><div className="preview-bottom"><span>© {new Date().getFullYear()} Northstar Realty</span><span>Privacy <i>·</i> Terms</span></div><div className="preview-orb orb-one"/><div className="preview-orb orb-two"/></div><div className="form-card"><div className="form-title"><div><span className="eyebrow">GET IN TOUCH</span><h2>Tell us what you need</h2><p>We’ll make sure your inquiry gets to the right person.</p></div><div className="form-steps"><i className="active"/><i/><i/></div></div>{success && <div className="success-message" role="status"><CheckCircle2 size={18}/><div><b>Your inquiry is in good hands.</b><span>A response draft is ready for our team to review.</span></div></div>}{apiError && <div className="alert error-alert" role="alert">{apiError}</div>}<form onSubmit={submit} noValidate><div className="form-row"><Field label="Full name" id="name" required error={errors.name}><input id="name" autoComplete="name" placeholder="e.g. Taylor Morgan" value={form.name} onChange={(e) => update('name', e.target.value)}/></Field><Field label="Email address" id="email" required error={errors.email}><input type="email" id="email" autoComplete="email" placeholder="you@example.com" value={form.email} onChange={(e) => update('email', e.target.value)}/></Field></div><div className="form-row"><Field label="Phone number" id="phone" optional error={errors.phone}><input type="tel" id="phone" autoComplete="tel" placeholder="(555) 000-0000" value={form.phone} onChange={(e) => update('phone', e.target.value)}/></Field><Field label="I’m interested in" id="service" required error={errors.service}><select id="service" value={form.service} onChange={(e) => update('service', e.target.value)}><option value="">Select a service</option>{services.map((s) => <option key={s}>{s}</option>)}</select></Field></div><Field label="How can we help?" id="message" required error={errors.message}><textarea id="message" rows="4" placeholder="Share a few details about what you’re looking for…" value={form.message} onChange={(e) => update('message', e.target.value)}/></Field><div className="form-submit-row"><span><span className="lock-icon">⌑</span> Use fictional contact details only.</span><button type="submit" className="button button-primary" disabled={busy}>{busy ? <><LoaderCircle size={15} className="spin"/> Submitting…</> : <>Send inquiry <ArrowRight size={15}/></>}</button></div></form><div className="automation-disclosure"><Sparkles size={14}/><span><b>Public demo workspace:</b> submissions are isolated to this browser’s workspace. A template-based response draft is prepared for review with a simulated follow-up reminder. No email or SMS is sent.</span></div></div></div><div className="capture-footer"><span><span className="pulse-dot"/> Local demo · All sample information is fictional</span><button><CircleHelp size={14}/> Need help?</button></div></div>;
}
function Field({ label, id, required, optional, error, children }) { return <div className={`field ${error ? 'field-error' : ''}`}><label htmlFor={id}>{label}{required && <span className="required">*</span>}{optional && <span className="optional">Optional</span>}</label>{children}{error && <span className="field-error-text" role="alert">{error}</span>}</div>; }

createRoot(document.getElementById('root')).render(<React.StrictMode><App/></React.StrictMode>);

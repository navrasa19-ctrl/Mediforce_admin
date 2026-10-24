import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Activity, AlertCircle, ArrowDownRight, ArrowRight, ArrowUpRight, BadgeCheck, Bell,
  BriefcaseMedical, Building2, Check, CheckCheck, CheckCircle2, ChevronDown, ChevronLeft,
  ChevronRight, ClipboardCheck, Clock3, Download, Eye, FileCheck2, FileText, Filter,
  HeartPulse, LayoutDashboard, LogOut, Menu, MoreHorizontal, Plus, RefreshCw, Search,
  Settings2, ShieldCheck, Stethoscope, Users, UserRoundCheck, X, XCircle, LoaderCircle
} from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import './styles.css';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');
const TOKEN_KEY = 'mediforce_admin_access_token';
const routes = {
  coordinatorsPending: '/api/v1/admin/users/coordinators/pending',
  coordinatorsApproved: '/api/v1/admin/users/coordinators/approved',
  approversPending: '/api/v1/admin/users/approvers/pending',
  approversApproved: '/api/v1/admin/users/approvers/approved',
  approvers: '/api/v1/admin/users/approvers',
  compliance: '/api/v1/admin/employees/compliance/pending'
};
const nav = [
  { id:'overview', label:'Overview', icon:LayoutDashboard, group:'WORKSPACE' },
  { id:'coordinators', label:'Coordinators', icon:Users, group:'WORKSPACE', countKey:'coordinators' },
  { id:'approvers', label:'Approvers', icon:ShieldCheck, group:'WORKSPACE', countKey:'approvers' },
  { id:'departments', label:'Departments & grades', icon:Building2, group:'WORKSPACE' },
  { id:'compliance', label:'Employee compliance', icon:ClipboardCheck, group:'PEOPLE' },
  { id:'onboarding', label:'Employee onboarding', icon:UserRoundCheck, group:'PEOPLE' }
];

async function api(path, { token, method='GET', body, blob=false } = {}) {
  if (!API_BASE) throw new Error('Backend URL is not configured. Copy .env.example to .env and set VITE_API_BASE_URL.');
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const response = await fetch(`${API_BASE}${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  if (blob && response.ok) return response.blob();
  let data = {};
  try { data = await response.json(); } catch {}
  if (!response.ok) {
    if (response.status === 401) throw new Error('Your session may have expired. Please sign in again.');
    if (response.status === 403) throw new Error(data.message || 'You do not have permission to perform this action.');
    const serverMessage = data.message || data.error || data.details;
    // A 404 for a documented lookup usually means the configured backend is
    // missing the deployed route (or VITE_API_BASE_URL points at the wrong service).
    if (response.status === 404 && /route not found|cannot get|not found/i.test(String(serverMessage || ''))) {
      throw new Error(`${serverMessage}. This API route is not available on the configured backend. Verify VITE_API_BASE_URL and deploy the backend revision that includes the onboarding-eligible lookup; the frontend cannot create a missing backend route.`);
    }
    throw new Error(serverMessage || `Request failed (${response.status}). Please retry.`);
  }
  if (data?.success === false) throw new Error(data.message || 'The request was not successful.');
  return data;
}
function unwrap(result) {
  const d = result?.data ?? result;
  if (Array.isArray(d)) return d;
  if (Array.isArray(d?.items)) return d.items;
  if (Array.isArray(d?.users)) return d.users;
  if (Array.isArray(d?.employees)) return d.employees;
  if (Array.isArray(d?.applications)) return d.applications;
  return [];
}
function initials(name='User') { return name.split(/\s+/).filter(Boolean).slice(0,2).map(s=>s[0]).join('').toUpperCase(); }
function fmtDate(value) { if (!value) return '—'; const d = new Date(value); return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}); }
function statusTone(value='') {
  const s = String(value).toLowerCase();
  if (s.includes('approv') || s.includes('complete') || s === 'active') return 'green';
  if (s.includes('reject') || s.includes('inactive') || s.includes('fail')) return 'red';
  if (s.includes('pending') || s.includes('review') || s.includes('progress')) return 'amber';
  return 'slate';
}
function Status({ value }) { return <span className={`status ${statusTone(value)}`}><i />{String(value || 'Unknown').replaceAll('_',' ')}</span>; }
function Avatar({ name, color='teal' }) { return <span className={`avatar ${color}`}>{initials(name)}</span>; }
function Empty({ icon:Icon=FileText, title='Nothing here yet', detail='Items will appear here when the backend returns data.' }) { return <div className="empty"><span className="empty-icon"><Icon size={22}/></span><b>{title}</b><p>{detail}</p></div>; }
function Spinner() { return <LoaderCircle className="spin" size={17}/>; }

function Login({ onLogin }) {
  const [email,setEmail]=useState(''); const [password,setPassword]=useState('');
  const [busy,setBusy]=useState(false); const [error,setError]=useState('');
  async function submit(e) {
    e.preventDefault(); setError(''); setBusy(true);
    try {
      const result = await api('/api/v1/auth/login',{method:'POST',body:{email,password,role:'ADMIN'}});
      const token = result?.data?.tokens?.accessToken || result?.tokens?.accessToken;
      if (!token) throw new Error('Login succeeded but tokens.accessToken was not found. Confirm the backend login response format.');
      localStorage.setItem(TOKEN_KEY,token);
      onLogin(token);
    } catch(err) { setError(err.message || 'Unable to sign in.'); }
    finally { setBusy(false); }
  }
  return <div className="login-page">
    <div className="login-decoration"><div className="login-orb orb-one"/><div className="login-orb orb-two"/><div className="login-brand"><span className="brand-mark"><HeartPulse size={24}/></span><span>MediForce<span className="brand-light"> Health</span></span></div><div className="login-message"><span className="eyebrow light">HEALTHCARE OPERATIONS</span><h1>Better care starts with<br/><em>better coordination.</em></h1><p>One secure workspace to review applications, verify compliance, and support employee onboarding.</p><div className="login-proof"><span><ShieldCheck size={17}/> Secure admin access</span><span><Activity size={17}/> Operational clarity</span></div></div><div className="login-bottom">MediForce Health · Admin workspace</div></div>
    <div className="login-form-wrap"><form className="login-form" onSubmit={submit}><div className="mobile-brand"><span className="brand-mark"><HeartPulse size={22}/></span><b>MediForce Health</b></div><span className="eyebrow">WELCOME BACK</span><h2>Sign in to your account</h2><p className="muted">Use your provisioned administrator credentials.</p>
      {error && <div className="alert error"><AlertCircle size={17}/>{error}</div>}
      <label>Email address<input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="admin@yourorganisation.com" autoComplete="username" required/></label>
      <label>Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Enter your password" autoComplete="current-password" required/></label>
      <button className="btn primary wide" disabled={busy}>{busy?<Spinner/>:<ShieldCheck size={17}/>} Sign in securely</button>
      {!API_BASE && <div className="setup-note"><AlertCircle size={16}/><span>Before signing in, configure <code>VITE_API_BASE_URL</code> in your <code>.env</code> file.</span></div>}
      <p className="login-foot">Admin accounts are provisioned by your backend administrator. Public signup is disabled.</p>
    </form></div>
  </div>;
}

function App() {
  const [token,setToken]=useState(()=>localStorage.getItem(TOKEN_KEY)||'');
  const [page,setPage]=useState('overview'); const [mobileNav,setMobileNav]=useState(false);
  const [user,setUser]=useState(null); const [toast,setToast]=useState(null);
  const [refreshKey,setRefreshKey]=useState(0);
  const notify=(message,type='success')=>{setToast({message,type});window.setTimeout(()=>setToast(null),3600);};
  const logout=()=>{localStorage.removeItem(TOKEN_KEY);setToken('');setUser(null);setPage('overview');};
  useEffect(()=>{ if(!token)return; api('/api/v1/auth/me',{token}).then(r=>setUser(r?.data?.user||r?.data||r?.user||null)).catch(e=>{ if(/session|permission/i.test(e.message)){logout();} }); },[token]);
  if(!token) return <Login onLogin={setToken}/>;
  return <div className="app-shell">
    <aside className={`sidebar ${mobileNav?'open':''}`}>
      <div className="brand"><span className="brand-mark"><HeartPulse size={22}/></span><span>MediForce<span className="brand-light"> Health</span><small>ADMIN CONSOLE</small></span><button className="icon-btn close-mobile" onClick={()=>setMobileNav(false)}><X size={18}/></button></div>
      <div className="workspace-pill"><span className="live-dot"/><span>Operations workspace</span><ChevronDown size={14}/></div>
      {['WORKSPACE','PEOPLE'].map(group=><div className="nav-group" key={group}><div className="nav-heading">{group}</div>{nav.filter(n=>n.group===group).map(item=><button key={item.id} className={`nav-item ${page===item.id?'active':''}`} onClick={()=>{setPage(item.id);setMobileNav(false);}}><item.icon size={18}/><span>{item.label}</span>{item.id==='coordinators'&&<span className="nav-dot"/>}</button>)}</div>)}
      <div className="sidebar-bottom"><div className="help-card"><div className="help-icon"><Stethoscope size={18}/></div><b>Need a hand?</b><p>Contact your system administrator for access or API issues.</p></div><div className="profile-row"><Avatar name={user?.fullName||user?.name||'Admin'} color="gold"/><div className="profile-copy"><b>{user?.fullName||user?.name||'Administrator'}</b><small>Administrator</small></div><button className="icon-btn" title="Sign out" onClick={logout}><LogOut size={17}/></button></div></div>
    </aside>
    {mobileNav&&<div className="mobile-scrim" onClick={()=>setMobileNav(false)}/>}
    <main className="main-area">
      <header className="topbar"><div className="topbar-left"><button className="icon-btn menu-toggle" onClick={()=>setMobileNav(true)}><Menu size={20}/></button><div className="breadcrumbs"><span>Workspace</span><ChevronRight size={14}/><b>{nav.find(n=>n.id===page)?.label||'Overview'}</b></div></div><div className="topbar-actions"><span className="secure-label"><span className="live-dot"/> Secure session</span><button className="icon-btn notification" title="Notifications"><Bell size={18}/><i/></button><div className="topbar-avatar"><Avatar name={user?.fullName||user?.name||'Admin'} color="teal"/></div></div></header>
      <div className="page-wrap">
        {page==='overview'&&<Overview token={token} refreshKey={refreshKey} setPage={setPage} notify={notify}/>}
        {page==='coordinators'&&<Coordinators token={token} refreshKey={refreshKey} notify={notify}/>}
        {page==='approvers'&&<Approvers token={token} refreshKey={refreshKey} notify={notify}/>}
        {page==='departments'&&<Departments token={token} refreshKey={refreshKey} notify={notify}/>}
        {page==='compliance'&&<Compliance token={token} refreshKey={refreshKey} notify={notify}/>}
        {page==='onboarding'&&<Onboarding token={token} notify={notify}/>}
      </div>
      <footer className="footer"><span>© {new Date().getFullYear()} MediForce Health</span><span><ShieldCheck size={14}/> Protected admin workspace</span></footer>
    </main>
    {toast&&<div className={`toast ${toast.type}`}><CheckCircle2 size={18}/>{toast.message}<button className="icon-btn" onClick={()=>setToast(null)}><X size={15}/></button></div>}
  </div>;
}

function PageHeading({eyebrow,title,description,action}) { return <div className="page-heading"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{description}</p></div>{action&&<div className="heading-action">{action}</div>}</div>; }
function Metric({label,value,sub,icon:Icon,tone='teal',trend}) { return <div className="metric-card"><div className="metric-top"><span>{label}</span><span className={`metric-icon ${tone}`}><Icon size={19}/></span></div><div className="metric-value">{value===null?<span className="metric-dash">—</span>:value}</div><div className="metric-bottom">{trend&&<span className="trend"><ArrowUpRight size={14}/>{trend}</span>}<span>{sub}</span></div></div>; }
function PanelTitle({title,subtitle,action}) { return <div className="panel-title"><div><h3>{title}</h3>{subtitle&&<p>{subtitle}</p>}</div>{action}</div>; }

function Overview({token,refreshKey,setPage,notify}) {
  const [data,setData]=useState({loading:true,error:'',coord:[],approverPending:[],approverApproved:[],employees:[]});
  const load=useCallback(async()=>{setData(p=>({...p,loading:true,error:''}));try{
    const results=await Promise.allSettled([
      api(routes.coordinatorsPending,{token}),api(routes.coordinatorsApproved,{token}),
      api(routes.approversPending,{token}),api(routes.approversApproved,{token}),api(routes.compliance,{token})
    ]);
    const failed=results.find(r=>r.status==='rejected');
    setData({loading:false,error:failed?failed.reason.message:'',coord:results[0].status==='fulfilled'?unwrap(results[0].value):[],coordApproved:results[1].status==='fulfilled'?unwrap(results[1].value):[],approverPending:results[2].status==='fulfilled'?unwrap(results[2].value):[],approverApproved:results[3].status==='fulfilled'?unwrap(results[3].value):[],employees:results[4].status==='fulfilled'?unwrap(results[4].value):[]});
  }catch(e){setData(p=>({...p,loading:false,error:e.message}));}},[token]);
  useEffect(()=>{load();},[load,refreshKey]);
  const d=data; const chartData=[{day:'Mon',n:0},{day:'Tue',n:0},{day:'Wed',n:0},{day:'Thu',n:0},{day:'Fri',n:0},{day:'Sat',n:0},{day:'Sun',n:0}];
  return <>
    <PageHeading eyebrow="YOUR WORKSPACE" title="Good to see you" description="Here’s the current pulse of your healthcare operations." action={<button className="btn secondary" onClick={load}><RefreshCw size={16}/> Refresh data</button>}/>
    {d.error&&<div className="alert warning"><AlertCircle size={17}/><div><b>Some data could not be loaded.</b><span>{d.error}</span></div><button className="btn small secondary" onClick={load}>Retry</button></div>}
    <div className="metric-grid">
      <Metric label="Coordinator applications" value={d.loading?null:d.coord.length} sub="Awaiting review" icon={Users} tone="teal"/>
      <Metric label="Approver applications" value={d.loading?null:d.approverPending.length} sub="Awaiting decision" icon={ShieldCheck} tone="gold"/>
      <Metric label="Employee compliance" value={d.loading?null:d.employees.length} sub="Pending review" icon={ClipboardCheck} tone="blue"/>
      <Metric label="Approved approvers" value={d.loading?null:d.approverApproved?.length??0} sub="In the system" icon={BadgeCheck} tone="green"/>
    </div>
    <div className="overview-grid">
      <section className="panel activity-panel"><PanelTitle title="Review activity" subtitle="Your current review queue" action={<button className="text-btn" onClick={()=>setPage('compliance')}>View queue <ArrowRight size={15}/></button>}/>
        <div className="queue-list">
          <button className="queue-item" onClick={()=>setPage('coordinators')}><span className="queue-symbol teal"><Users size={18}/></span><span className="queue-copy"><b>Coordinator applications</b><small>Review new coordinator requests</small></span><span className="queue-count">{d.loading?'—':d.coord.length}</span><ChevronRight size={16}/></button>
          <button className="queue-item" onClick={()=>setPage('approvers')}><span className="queue-symbol gold"><ShieldCheck size={18}/></span><span className="queue-copy"><b>Approver applications</b><small>Manage approvals and assignments</small></span><span className="queue-count">{d.loading?'—':d.approverPending.length}</span><ChevronRight size={16}/></button>
          <button className="queue-item" onClick={()=>setPage('compliance')}><span className="queue-symbol blue"><FileCheck2 size={18}/></span><span className="queue-copy"><b>Employee compliance</b><small>Verify required employee documents</small></span><span className="queue-count">{d.loading?'—':d.employees.length}</span><ChevronRight size={16}/></button>
        </div>
        <div className="panel-note"><span className="note-icon"><Activity size={16}/></span><span>Queue counts are derived from the backend lists. No summary endpoint or demo records are used.</span></div>
      </section>
      <section className="panel side-summary"><PanelTitle title="Operations snapshot" subtitle="A quick look at your queues"/>
        <div className="snapshot-ring"><div><span>{d.loading?'—':d.coord.length+d.approverPending.length+d.employees.length}</span><small>Items to review</small></div></div>
        <div className="snapshot-legend"><div><span className="legend-dot teal-bg"/><span>Coordinator</span><b>{d.loading?'—':d.coord.length}</b></div><div><span className="legend-dot gold-bg"/><span>Approver</span><b>{d.loading?'—':d.approverPending.length}</b></div><div><span className="legend-dot blue-bg"/><span>Compliance</span><b>{d.loading?'—':d.employees.length}</b></div></div>
      </section>
    </div>
    <section className="panel recent-panel"><PanelTitle title="Recent coordinator applications" subtitle="Latest items from the pending queue" action={<button className="text-btn" onClick={()=>setPage('coordinators')}>See all <ArrowRight size={15}/></button>}/>
      {d.loading?<div className="loading-row"><Spinner/> Loading applications…</div>:d.coord.length===0?<Empty icon={CheckCheck} title="No pending coordinator applications" detail="When new applications arrive, they’ll appear here."/>:<div className="table-wrap"><table><thead><tr><th>Applicant</th><th>Department</th><th>Grade</th><th>Review status</th></tr></thead><tbody>{d.coord.slice(0,5).map(item=><tr key={item._id}><td><div className="person-cell"><Avatar name={item.fullName}/><div><b>{item.fullName||'Unnamed applicant'}</b><small>Submitted {fmtDate(item.createdAt)}</small></div></div></td><td>{item.department?.name||'—'}</td><td>{item.grade?.name||'—'}</td><td><Status value="PENDING"/></td></tr>)}</tbody></table></div>}
    </section>
  </>;
}

function SearchBar({value,onChange,placeholder='Search by name…'}) { return <label className="searchbox"><Search size={17}/><input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}/>{value&&<button type="button" onClick={()=>onChange('')}><X size={14}/></button>}</label>; }
function Tabs({value,onChange,items}) { return <div className="tabs">{items.map(i=><button key={i.value} className={value===i.value?'selected':''} onClick={()=>onChange(i.value)}>{i.label}</button>)}</div>; }
function ConfirmModal({title,description,confirmLabel='Confirm',danger=false,onConfirm,onClose,busy}) { return <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget&&!busy)onClose();}}><div className="modal"><button className="icon-btn modal-close" onClick={onClose}><X size={18}/></button><span className={`modal-symbol ${danger?'danger':''}`}>{danger?<AlertCircle size={23}/>:<ShieldCheck size={23}/>}</span><h3>{title}</h3><p>{description}</p><div className="modal-actions"><button className="btn secondary" onClick={onClose} disabled={busy}>Cancel</button><button className={`btn ${danger?'danger-btn':'primary'}`} onClick={onConfirm} disabled={busy}>{busy?<Spinner/>:null}{confirmLabel}</button></div></div></div>; }

function departmentGradeNames(value) {
  return value.split(/\r?\n/).map(name=>name.trim()).filter(Boolean);
}
function validateDepartmentGradeNames(names, required) {
  if(required&&!names.length) return 'Enter at least one grade name.';
  if(names.some(name=>name.length<2||name.length>120)) return 'Each grade name must be between 2 and 120 characters.';
  if(new Set(names).size!==names.length) return 'Grade names must be unique within the batch.';
  return '';
}
function Departments({token,refreshKey,notify}) {
  const [items,setItems]=useState([]);
  const [pagination,setPagination]=useState({page:1,limit:20,total:0,pages:0});
  const [page,setPage]=useState(1);
  const [activeFilter,setActiveFilter]=useState('');
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const [dialog,setDialog]=useState('');
  const [selected,setSelected]=useState(null);
  const [detailLoading,setDetailLoading]=useState(false);
  const [detailError,setDetailError]=useState('');
  const listRequest=useRef(0);
  const detailRequest=useRef(0);
  const limit=20;

  const load=useCallback(async()=>{
    const requestId=++listRequest.current;
    setLoading(true);setError('');
    try{
      const query=new URLSearchParams({page:String(page),limit:String(limit)});
      if(activeFilter)query.set('isActive',activeFilter);
      const result=await api(`/api/v1/departments?${query.toString()}`,{token});
      const data=result?.data;
      if(!Array.isArray(data?.items)||!data?.pagination||![data.pagination.page,data.pagination.limit,data.pagination.total,data.pagination.pages].every(Number.isFinite))throw new Error('Departments returned an unexpected response. Expected paginated data.items and numeric data.pagination fields.');
      if(data.items.some(item=>!item?._id||!item.name||typeof item.activeGradeCount!=='number'))throw new Error('Departments returned records missing _id, name, or activeGradeCount.');
      if(requestId===listRequest.current){setItems(data.items);setPagination(data.pagination);}
    }catch(e){if(requestId===listRequest.current){setItems([]);setError(e.message||'Unable to load departments.');}}
    finally{if(requestId===listRequest.current)setLoading(false);}
  },[activeFilter,page,token]);
  useEffect(()=>{load();},[load,refreshKey]);

  const openDetail=async department=>{
    const requestId=++detailRequest.current;
    setSelected(null);setDetailError('');setDetailLoading(true);
    try{
      const result=await api(`/api/v1/departments/${encodeURIComponent(department._id)}`,{token});
      const detail=result?.data;
      if(!detail||!Array.isArray(detail.grades))throw new Error('Department detail returned an unexpected response. Expected a department with a grades array.');
      if(requestId===detailRequest.current)setSelected(detail);
    }catch(e){if(requestId===detailRequest.current){setDetailError(e.message||'Unable to load department details.');setSelected(department);}}
    finally{if(requestId===detailRequest.current)setDetailLoading(false);}
  };
  const closeDetail=()=>{detailRequest.current++;setSelected(null);setDetailError('');setDetailLoading(false);};
  const onSaved=async mode=>{
    if(mode==='create'&&page!==1){setPage(1);return;}
    await load();
    if(selected?._id)await openDetail(selected);
  };
  const pages=Math.max(1,Number(pagination.pages)||1);
  return <>
    <PageHeading eyebrow="WORKSPACE / ORGANISATION" title="Departments & grades" description="Manage department names and the shared grade mappings used across the system." action={<><button className="btn secondary" onClick={load} disabled={loading}><RefreshCw size={16}/> Refresh</button><button className="btn primary" onClick={()=>setDialog('create')}><Plus size={16}/> Create department</button></>}/>
    <section className="panel data-panel">
      <div className="data-toolbar">
        <div className="queue-heading"><b>Department directory</b><small>Department IDs and grade mappings are preserved</small></div>
        <label className="department-filter">Status<select value={activeFilter} onChange={e=>{setPage(1);setActiveFilter(e.target.value);}}><option value="">All departments</option><option value="true">Active</option><option value="false">Inactive</option></select></label>
      </div>
      {error&&<div className="alert error" role="alert"><AlertCircle size={17}/>{error}<button className="btn small secondary" onClick={load}>Retry</button></div>}
      {loading?<div className="loading-row"><Spinner/> Loading departments…</div>:items.length===0?<Empty icon={Building2} title="No departments found" detail={activeFilter?'No departments match this status filter.':'Create a department to begin managing grade mappings.'}/>:<div className="table-wrap"><table><thead><tr><th>Department</th><th>Code</th><th>Active grades</th><th>Status</th><th className="align-right">Action</th></tr></thead><tbody>{items.map(item=><tr key={item._id}><td><div className="person-cell"><span className="avatar blue"><Building2 size={16}/></span><div><b>{item.name||'Unnamed department'}</b><small>ID · {String(item._id||'').slice(-8)||'—'}</small></div></div></td><td>{item.code||'—'}</td><td>{Number.isFinite(item.activeGradeCount)?item.activeGradeCount:0}</td><td><Status value={item.isActive===false?'INACTIVE':'ACTIVE'}/></td><td className="align-right"><button className="btn small secondary" onClick={()=>openDetail(item)}><Eye size={14}/> View details</button></td></tr>)}</tbody></table></div>}
      <div className="table-foot"><span>{loading?'Loading…':`${pagination.total} ${pagination.total===1?'department':'departments'}`}</span><div className="department-pagination"><button className="btn small secondary" disabled={loading||page<=1} onClick={()=>setPage(value=>Math.max(1,value-1))}><ChevronLeft size={14}/> Previous</button><span>Page {page} of {pages}</span><button className="btn small secondary" disabled={loading||page>=pages} onClick={()=>setPage(value=>Math.min(pages,value+1))}>Next <ChevronRight size={14}/></button></div></div>
    </section>
    {(selected||detailLoading||detailError)&&<DepartmentDetailModal department={selected} loading={detailLoading} error={detailError} onClose={closeDetail} onRename={()=>setDialog('rename')} onAddGrades={()=>setDialog('add-grades')} onRetry={()=>selected&&openDetail(selected)}/>}
    {dialog&&<DepartmentFormModal mode={dialog} department={selected} token={token} onClose={()=>setDialog('')} onDone={onSaved} notify={notify}/>}
  </>;
}
function DepartmentFormModal({mode,department,token,onClose,onDone,notify}) {
  const [name,setName]=useState(mode==='rename'?department?.name||'':'');
  const [grades,setGrades]=useState('');
  const [error,setError]=useState('');
  const [busy,setBusy]=useState(false);
  const creating=mode==='create';
  const addingGrades=mode==='add-grades';
  const gradeNames=departmentGradeNames(grades);
  async function submit(e){
    e.preventDefault();setError('');
    const trimmedName=name.trim();
    if(!addingGrades&&!trimmedName){setError('Department name is required.');return;}
    if(creating||addingGrades){
      const validationError=validateDepartmentGradeNames(gradeNames,addingGrades);
      if(validationError){setError(validationError);return;}
    }
    setBusy(true);
    try{
      if(creating){
        await api('/api/v1/departments',{token,method:'POST',body:{name:trimmedName,grades:gradeNames}});
        notify('Department created.');
      }else if(addingGrades){
        await api(`/api/v1/departments/${encodeURIComponent(department._id)}/grades`,{token,method:'POST',body:{grades:gradeNames}});
        notify('Department grades added.');
      }else{
        await api(`/api/v1/departments/${encodeURIComponent(department._id)}`,{token,method:'PATCH',body:{name:trimmedName}});
        notify('Department renamed.');
      }
      onClose();await onDone(mode);
    }catch(e){setError(e.message||'Unable to save department changes.');}
    finally{setBusy(false);}
  }
  const title=creating?'Create department':addingGrades?'Add grades':'Rename department';
  return <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget&&!busy)onClose();}}><form className="modal form-modal department-modal" onSubmit={submit}><button type="button" className="icon-btn modal-close" onClick={onClose} disabled={busy}><X size={18}/></button><span className="modal-symbol"><Building2 size={23}/></span><h3>{title}</h3><p>{creating?'Create a department and optionally map initial grades.':addingGrades?`Add active grades to ${department?.name}. Already-mapped names reject the entire batch.`:'Only the department name changes; its ID, code, grade mappings, and historical references remain unchanged.'}</p>
    {error&&<div className="alert error" role="alert"><AlertCircle size={17}/>{error}</div>}
    {!addingGrades&&<label>Department name<input value={name} onChange={e=>setName(e.target.value)} maxLength="120" required/></label>}
    {(creating||addingGrades)&&<label>Grade names <span className="muted">One name per line, 2–120 characters each</span><textarea value={grades} onChange={e=>setGrades(e.target.value)} rows="5" placeholder={'Grade 1\nSenior Grade'} required={addingGrades}/></label>}
    <div className="modal-actions"><button type="button" className="btn secondary" onClick={onClose} disabled={busy}>Cancel</button><button className="btn primary" disabled={busy}>{busy?<Spinner/>:<Check size={16}/>} {creating?'Create department':addingGrades?'Add grades':'Save name'}</button></div>
  </form></div>;
}
function DepartmentDetailModal({department,loading,error,onClose,onRename,onAddGrades,onRetry}) {
  return <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)onClose();}}><section className="modal department-detail-modal"><button type="button" className="icon-btn modal-close" onClick={onClose}><X size={18}/></button>
    {loading?<div className="loading-row"><Spinner/> Loading department…</div>:error?<><span className="modal-symbol"><AlertCircle size={23}/></span><h3>Unable to load department</h3><p>{error}</p><div className="modal-actions"><button className="btn secondary" onClick={onClose}>Close</button><button className="btn primary" onClick={onRetry}><RefreshCw size={15}/> Retry</button></div></>:department&&<>
      <span className="modal-symbol"><Building2 size={23}/></span><div className="department-detail-heading"><div><h3>{department.name}</h3><p>{department.code||'Code unavailable'} · <Status value={department.isActive===false?'INACTIVE':'ACTIVE'}/></p></div><div className="row-actions"><button className="btn small secondary" onClick={onRename}><Settings2 size={14}/> Rename</button><button className="btn small primary" onClick={onAddGrades} disabled={department.isActive===false}><Plus size={14}/> Add grades</button></div></div>
      <div className="department-grades-heading"><b>Mapped grades</b><span>{department.grades.length} total</span></div>
      {department.grades.length===0?<Empty icon={Stethoscope} title="No grades mapped" detail="Add grades to make them available for this department."/>:<div className="department-grade-list">{department.grades.map(grade=><div className="department-grade-row" key={grade._id}><div><b>{grade.name}</b><small>{grade.code||'Code unavailable'}</small></div><Status value={grade.isActive===false?'INACTIVE':'ACTIVE'}/></div>)}</div>}
      <div className="modal-actions"><button className="btn secondary" onClick={onClose}>Close</button></div>
    </>}
  </section></div>;
}

function Coordinators({token,refreshKey,notify}) {
  const [tab,setTab]=useState('pending'); const [items,setItems]=useState([]); const [loading,setLoading]=useState(true); const [error,setError]=useState(''); const [query,setQuery]=useState('');
  const [confirm,setConfirm]=useState(null); const [busy,setBusy]=useState(false);
  const endpoint=tab==='pending'?routes.coordinatorsPending:routes.coordinatorsApproved;
  const load=useCallback(async()=>{setLoading(true);setError('');try{setItems(unwrap(await api(endpoint,{token})));}catch(e){setError(e.message);setItems([]);}finally{setLoading(false);}},[endpoint,token]);
  useEffect(()=>{load();},[load,refreshKey]);
  const filtered=items.filter(x=>`${x.fullName||''} ${x.department?.name||''} ${x.grade?.name||''}`.toLowerCase().includes(query.toLowerCase()));
  async function decide(action){setBusy(true);try{await api(`/api/v1/admin/users/coordinators/${encodeURIComponent(confirm.item._id)}/${action}`,{token,method:'POST',body:{}});notify(`Coordinator application ${action==='accept'?'accepted':'rejected'}.`);setConfirm(null);await load();}catch(e){notify(e.message,'error');}finally{setBusy(false);}}
  return <><PageHeading eyebrow="WORKSPACE / COORDINATORS" title="Coordinator applications" description="Review applications and manage approved coordinators." action={<button className="btn secondary" onClick={load}><RefreshCw size={16}/> Refresh</button>}/>
    <section className="panel data-panel"><div className="data-toolbar"><Tabs value={tab} onChange={setTab} items={[{value:'pending',label:'Pending applications'},{value:'approved',label:'Approved'}]}/><SearchBar value={query} onChange={setQuery}/></div>
    {error&&<div className="alert error"><AlertCircle size={17}/>{error}<button className="btn small secondary" onClick={load}>Retry</button></div>}
    {loading?<div className="loading-row"><Spinner/> Loading coordinator applications…</div>:filtered.length===0?<Empty icon={Users} title={query?'No matching applications':tab==='pending'?'All caught up':'No approved coordinators'} detail={query?'Try a different search term.':'The backend returned no records for this view.'}/>:<div className="table-wrap"><table><thead><tr><th>Coordinator</th><th>Department</th><th>Grade</th><th>Application status</th>{tab==='pending'&&<th className="align-right">Actions</th>}</tr></thead><tbody>{filtered.map(item=><tr key={item._id}><td><div className="person-cell"><Avatar name={item.fullName}/><div><b>{item.fullName||'Unnamed applicant'}</b><small>ID · {String(item._id||'').slice(-8)||'—'}</small></div></div></td><td>{item.department?.name||'—'}</td><td>{item.grade?.name||'—'}</td><td><Status value={tab==='pending'?'PENDING':'APPROVED'}/></td>{tab==='pending'&&<td><div className="row-actions"><button className="btn small outline-green" onClick={()=>setConfirm({item,action:'accept'})}><Check size={14}/> Accept</button><button className="btn small outline-red" onClick={()=>setConfirm({item,action:'reject'})}><X size={14}/> Reject</button></div></td>}</tr>)}</tbody></table></div>}
    <div className="table-foot"><span>{loading?'Loading…':`${filtered.length} ${filtered.length===1?'record':'records'}`}</span><span>Source: verified backend API</span></div></section>
    {confirm&&<ConfirmModal title={`${confirm.action==='accept'?'Accept':'Reject'} coordinator application?`} description={`${confirm.action==='accept'?'This will approve':'This will reject'} the application for ${confirm.item.fullName||'this coordinator'}. This decision is sent to the backend and cannot be assumed complete until it succeeds.`} confirmLabel={confirm.action==='accept'?'Accept application':'Reject application'} danger={confirm.action==='reject'} busy={busy} onClose={()=>setConfirm(null)} onConfirm={()=>decide(confirm.action)}/>}
  </>;
}

const responsibilities=['ASSISTANT_MANAGER','MANAGER','HOD','DD','MATRON','WARD_MANAGER','HR','FINANCE'];
function Approvers({token,refreshKey,notify}) {
  const [tab,setTab]=useState('pending');const [items,setItems]=useState([]);const [loading,setLoading]=useState(true);const [error,setError]=useState('');const [query,setQuery]=useState('');
  const [confirm,setConfirm]=useState(null);const [busy,setBusy]=useState(false);const [showCreate,setShowCreate]=useState(false);
  const endpoint=tab==='pending'?routes.approversPending:tab==='approved'?routes.approversApproved:routes.approvers;
  const load=useCallback(async()=>{setLoading(true);setError('');try{setItems(unwrap(await api(endpoint,{token})));}catch(e){setError(e.message);setItems([]);}finally{setLoading(false);}},[endpoint,token]);
  useEffect(()=>{load();},[load,refreshKey]);
  const filtered=items.filter(x=>`${x.fullName||''} ${x.email||''} ${x.approvalResponsibility||''}`.toLowerCase().includes(query.toLowerCase()));
  async function decide(action){setBusy(true);try{await api(`/api/v1/admin/users/approvers/${encodeURIComponent(confirm.item._id)}/${action}`,{token,method:'POST',body:{}});notify(`Approver application ${action==='accept'?'accepted':'rejected'}.`);setConfirm(null);await load();}catch(e){notify(e.message,'error');}finally{setBusy(false);}}
  async function updateResponsibility(item,value){try{await api(`/api/v1/admin/users/${encodeURIComponent(item._id)}/approval-responsibility`,{token,method:'PATCH',body:{approvalResponsibility:value||null}});notify('Approval responsibility updated.');await load();}catch(e){notify(e.message,'error');}}
  async function deactivate(){setBusy(true);try{await api(`/api/v1/admin/users/approvers/${encodeURIComponent(confirm.item._id)}`,{token,method:'DELETE',body:{}});notify('Approver deactivated.');setConfirm(null);await load();}catch(e){notify(e.message,'error');}finally{setBusy(false);}}
  return <><PageHeading eyebrow="WORKSPACE / APPROVERS" title="Approver management" description="Review applications, assign responsibilities, and manage approver access." action={<><button className="btn secondary" onClick={load}><RefreshCw size={16}/> Refresh</button><button className="btn primary" onClick={()=>setShowCreate(true)}><Plus size={16}/> Add approver</button></>}/>
    <section className="panel data-panel"><div className="data-toolbar"><Tabs value={tab} onChange={setTab} items={[{value:'pending',label:'Pending'},{value:'approved',label:'Approved'},{value:'managed',label:'All approvers'}]}/><SearchBar value={query} onChange={setQuery} placeholder="Search name, email…"/></div>
    {error&&<div className="alert error"><AlertCircle size={17}/>{error}<button className="btn small secondary" onClick={load}>Retry</button></div>}
    {loading?<div className="loading-row"><Spinner/> Loading approvers…</div>:filtered.length===0?<Empty icon={ShieldCheck} title="No approvers found" detail="No records were returned for this view. Check the backend connection or try another tab."/>:<div className="table-wrap"><table><thead><tr><th>Approver</th><th>Responsibility</th><th>Department scope</th><th>Status</th><th className="align-right">Actions</th></tr></thead><tbody>{filtered.map(item=><tr key={item._id}><td><div className="person-cell"><Avatar name={item.fullName}/><div><b>{item.fullName||'Unnamed approver'}</b><small>{item.email||'Email unavailable'}</small></div></div></td><td>{tab==='managed'||tab==='approved'?<select className="inline-select" value={item.approvalResponsibility||''} onChange={e=>updateResponsibility(item,e.target.value)}><option value="">Not assigned</option>{responsibilities.map(r=><option key={r} value={r}>{r.replaceAll('_',' ')}</option>)}</select>:<span className="muted">—</span>}</td><td>{Array.isArray(item.departmentIds)?`${item.departmentIds.length} department${item.departmentIds.length===1?'':'s'}`:'—'}</td><td><Status value={tab==='pending'?(item.approverApprovalStatus||'PENDING'):(item.isActive===false?'INACTIVE':item.approverApprovalStatus||'APPROVED')}/></td><td><div className="row-actions">{tab==='pending'?<><button className="btn small outline-green" onClick={()=>setConfirm({item,action:'accept'})}><Check size={14}/> Accept</button><button className="btn small outline-red" onClick={()=>setConfirm({item,action:'reject'})}><X size={14}/> Reject</button></>:<><button className="btn small secondary" onClick={()=>setConfirm({item,action:'scope'})}><Building2 size={14}/> Scope</button><button className="btn small outline-red" onClick={()=>setConfirm({item,action:'deactivate'})}><XCircle size={14}/></button></>}</div></td></tr>)}</tbody></table></div>}
    <div className="table-foot"><span>{loading?'Loading…':`${filtered.length} records`}</span><span>Department scope uses backend IDs</span></div></section>
    {confirm&&confirm.action!=='scope'&&<ConfirmModal title={confirm.action==='deactivate'?'Deactivate this approver?':`${confirm.action==='accept'?'Accept':'Reject'} approver application?`} description={confirm.action==='deactivate'?`Access for ${confirm.item.fullName||'this approver'} will be deactivated.`:`This will ${confirm.action} the application for ${confirm.item.fullName||'this approver'}.`} confirmLabel={confirm.action==='deactivate'?'Deactivate':confirm.action==='accept'?'Accept application':'Reject application'} danger={confirm.action==='reject'||confirm.action==='deactivate'} busy={busy} onClose={()=>setConfirm(null)} onConfirm={()=>confirm.action==='deactivate'?deactivate():decide(confirm.action)}/>}
    {confirm?.action==='scope'&&<ScopeModal item={confirm.item} token={token} busy={busy} setBusy={setBusy} onClose={()=>setConfirm(null)} notify={notify} onDone={load}/>}
    {showCreate&&<CreateApprover token={token} onClose={()=>setShowCreate(false)} notify={notify} onDone={load}/>}
  </>;
}
function CreateApprover({token,onClose,notify,onDone}) {
  const [fullName,setFullName]=useState('');const [email,setEmail]=useState('');const [password,setPassword]=useState('');const [busy,setBusy]=useState(false);const [error,setError]=useState('');
  async function submit(e){e.preventDefault();setBusy(true);setError('');try{await api(routes.approvers,{token,method:'POST',body:{fullName,email,password}});notify('Approver created.');onClose();onDone();}catch(e){setError(e.message); }finally{setBusy(false);}}
  return <div className="modal-backdrop"><form className="modal form-modal" onSubmit={submit}><button type="button" className="icon-btn modal-close" onClick={onClose}><X size={18}/></button><span className="modal-symbol"><Plus size={23}/></span><h3>Create approver</h3><p>Create an approver account using the documented backend fields.</p>{error&&<div className="alert error">{error}</div>}<label>Full name<input value={fullName} onChange={e=>setFullName(e.target.value)} minLength="2" maxLength="120" required/></label><label>Email address<input type="email" value={email} onChange={e=>setEmail(e.target.value)} required/></label><label>Temporary password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} required autoComplete="new-password"/></label><div className="modal-actions"><button type="button" className="btn secondary" onClick={onClose}>Cancel</button><button className="btn primary" disabled={busy}>{busy?<Spinner/>:<Plus size={16}/>} Create approver</button></div></form></div>;
}
function ScopeModal({item,token,onClose,notify,onDone,busy,setBusy}) {
  const [ids,setIds]=useState((item.departmentIds||[]).join(', '));const [error,setError]=useState('');
  async function submit(e){e.preventDefault();const departmentIds=[...new Set(ids.split(',').map(s=>s.trim()).filter(Boolean))];if(!departmentIds.length){setError('Enter at least one active department ID.');return;}setBusy(true);try{await api(`/api/v1/admin/users/${encodeURIComponent(item._id)}/department-scope`,{token,method:'PATCH',body:{departmentIds}});notify('Department scope replaced.');onClose();onDone();}catch(e){setError(e.message);}finally{setBusy(false);}}
  return <div className="modal-backdrop"><form className="modal form-modal" onSubmit={submit}><button type="button" className="icon-btn modal-close" onClick={onClose}><X size={18}/></button><span className="modal-symbol"><Building2 size={23}/></span><h3>Department scope</h3><p>Replace the department IDs assigned to <b>{item.fullName}</b>. Use active department IDs supplied by your backend team.</p>{error&&<div className="alert error">{error}</div>}<label>Department IDs (comma-separated)<textarea value={ids} onChange={e=>setIds(e.target.value)} rows="3" placeholder="Paste active department IDs"/></label><div className="modal-actions"><button type="button" className="btn secondary" onClick={onClose}>Cancel</button><button className="btn primary" disabled={busy}>{busy?<Spinner/>:<Check size={16}/>} Save scope</button></div></form></div>;
}

function Compliance({token,refreshKey,notify}) {
  const [items,setItems]=useState([]);const [loading,setLoading]=useState(true);const [error,setError]=useState('');const [query,setQuery]=useState('');const [selected,setSelected]=useState(null);const [confirm,setConfirm]=useState(null);const [busy,setBusy]=useState(false);
  const load=useCallback(async()=>{setLoading(true);setError('');try{setItems(unwrap(await api(routes.compliance,{token})));}catch(e){setError(e.message);setItems([]);}finally{setLoading(false);}},[token]);
  useEffect(()=>{load();},[load,refreshKey]);
  const filtered=items.filter(x=>`${x.fullName||x.user?.fullName||''} ${x.email||x.user?.email||''} ${x.complianceStatus||x.status||''}`.toLowerCase().includes(query.toLowerCase()));
  async function approveOverall(){setBusy(true);try{await api(`/api/v1/admin/employees/${encodeURIComponent(selected.userId||selected.user?._id||selected._id)}/compliance/approve`,{token,method:'PATCH',body:{}});notify('Employee compliance approved.');setConfirm(null);setSelected(null);await load();}catch(e){notify(e.message,'error');}finally{setBusy(false);}}
  async function reviewDoc(doc,decision,notes=''){setBusy(true);try{await api(`/api/v1/admin/employees/${encodeURIComponent(selected.userId||selected.user?._id||selected._id)}/compliance/documents/${encodeURIComponent(doc._id)}/review`,{token,method:'PATCH',body:{decision,reviewNotes:notes||undefined}});notify(`Document ${decision.toLowerCase()}.`);await load();const fresh=unwrap(await api(`/api/v1/admin/employees/${encodeURIComponent(selected.userId||selected.user?._id||selected._id)}/compliance`,{token}));setSelected(fresh);}catch(e){notify(e.message,'error');}finally{setBusy(false);}}
  async function downloadDoc(doc){try{const blob=await api(`/api/v1/employees/compliance/documents/${encodeURIComponent(doc._id)}?download=true`,{token,blob:true});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=doc.originalName||'employee-document';a.click();URL.revokeObjectURL(url);}catch(e){notify(e.message,'error');}}
  return <><PageHeading eyebrow="PEOPLE / COMPLIANCE" title="Employee compliance" description="Review submitted documents and verify onboarding requirements." action={<button className="btn secondary" onClick={load}><RefreshCw size={16}/> Refresh queue</button>}/>
    <section className="panel data-panel"><div className="data-toolbar"><div className="queue-heading"><b>Pending review queue</b><small>Employee records returned by the backend</small></div><SearchBar value={query} onChange={setQuery} placeholder="Search employee…"/></div>
    {error&&<div className="alert error"><AlertCircle size={17}/>{error}<button className="btn small secondary" onClick={load}>Retry</button></div>}
    {loading?<div className="loading-row"><Spinner/> Loading compliance queue…</div>:filtered.length===0?<Empty icon={FileCheck2} title="No employees to review" detail="The backend returned no pending compliance records."/>:<div className="table-wrap"><table><thead><tr><th>Employee</th><th>Documents</th><th>Compliance</th><th>Last updated</th><th className="align-right">Action</th></tr></thead><tbody>{filtered.map(item=>{const docs=item.documents||item.compliance?.documents||[];const name=item.fullName||item.user?.fullName||item.name||'Employee';return <tr key={item._id||item.userId}><td><div className="person-cell"><Avatar name={name}/><div><b>{name}</b><small>{item.email||item.user?.email||'Employee profile'}</small></div></div></td><td><span className="doc-count"><FileText size={15}/>{docs.length||item.documentCount||'—'} documents</span></td><td><div className="compliance-cell"><Status value={item.complianceStatus||item.status||'PENDING'}/>{item.compliancePercentage!=null&&<small>{item.compliancePercentage}% complete</small>}</div></td><td>{fmtDate(item.updatedAt||item.createdAt)}</td><td className="align-right"><button className="btn small primary" onClick={async()=>{setSelected(item);try{const id=item.userId||item.user?._id||item._id;const detail=await api(`/api/v1/admin/employees/${encodeURIComponent(id)}/compliance`,{token});setSelected(detail?.data||detail);}catch(e){notify(e.message,'error');}}}><Eye size={14}/> Review</button></td></tr>})}</tbody></table></div>}
    <div className="table-foot"><span>{loading?'Loading…':`${filtered.length} employees`}</span><span>Protected employee data</span></div></section>
    {selected&&<ComplianceDrawer item={selected} onClose={()=>setSelected(null)} reviewDoc={reviewDoc} downloadDoc={downloadDoc} onApprove={()=>setConfirm({type:'approve'})} busy={busy}/>}
    {confirm?.type==='approve'&&<ConfirmModal title="Approve overall compliance?" description="The backend requires every required document type to have an approved document and bank details to be complete. If a prerequisite is missing, the backend will return its validation message." confirmLabel="Approve compliance" busy={busy} onClose={()=>setConfirm(null)} onConfirm={approveOverall}/>}
  </>;
}
function ComplianceDrawer({item,onClose,reviewDoc,downloadDoc,onApprove,busy}) {
  const [notes,setNotes]=useState('');const docs=item.documents||item.compliance?.documents||item.data?.documents||[];
  const name=item.fullName||item.user?.fullName||item.name||'Employee';
  return <div className="drawer-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)onClose();}}><aside className="detail-drawer"><div className="drawer-head"><div><span className="eyebrow">EMPLOYEE REVIEW</span><h2>{name}</h2><p>{item.email||item.user?.email||'Compliance details'}</p></div><button className="icon-btn" onClick={onClose}><X size={19}/></button></div><div className="drawer-scroll"><div className="detail-summary"><div><small>Overall status</small><Status value={item.complianceStatus||item.status||'PENDING'}/></div><div><small>Completion</small><b>{item.compliancePercentage??'—'}{item.compliancePercentage!=null?'%':''}</b></div><div><small>Documents</small><b>{docs.length}</b></div></div><div className="drawer-section-title"><h3>Submitted documents</h3><span>{docs.length} files</span></div>
    {docs.length===0?<Empty icon={FileText} title="No document details found" detail="The response did not include a documents array. Confirm the live compliance detail response shape."/>:docs.map(doc=><div className="document-card" key={doc._id}><div className="document-icon"><FileText size={19}/></div><div className="document-main"><b>{doc.originalName||doc.type||'Document'}</b><small>{String(doc.type||'Document').replaceAll('_',' ')} · {doc.fileSize?`${Math.round(doc.fileSize/1024)} KB`:'Size unavailable'}</small><Status value={doc.status||'PENDING'}/>{doc.issueDate&&<small>Issued {fmtDate(doc.issueDate)}{doc.expiryDate?` · Expires ${fmtDate(doc.expiryDate)}`:''}</small>}</div><div className="document-actions"><button className="icon-btn" title="Download protected document" onClick={()=>downloadDoc(doc)} disabled={!doc.hasUploadedFile}><Download size={17}/></button>{String(doc.status).toUpperCase()!=='APPROVED'&&<button className="icon-btn" title="Approve document" disabled={busy} onClick={()=>reviewDoc(doc,'APPROVED',notes)}><Check size={17}/></button>}{String(doc.status).toUpperCase()!=='REJECTED'&&<button className="icon-btn danger-icon" title="Reject document" disabled={busy} onClick={()=>reviewDoc(doc,'REJECTED',notes)}><X size={17}/></button>}</div></div>)}
    <label className="notes-label">Review notes <span>Optional · up to 500 characters</span><textarea rows="3" maxLength="500" value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Add notes for document decisions…"/></label>
    <div className="drawer-callout"><AlertCircle size={17}/><span>Overall approval requires all required documents approved and bank details marked complete.</span></div></div><div className="drawer-footer"><button className="btn secondary" onClick={onClose}>Close</button><button className="btn primary" onClick={onApprove} disabled={busy}><CheckCheck size={16}/> Approve overall compliance</button></div></aside></div>;
}

function lookupData(result, label) {
  // These lookup contracts explicitly return { success, message, data: [] }.
  if (!result || !Array.isArray(result.data)) {
    throw new Error(`${label} returned an unexpected response. Expected a data array; check the backend contract.`);
  }
  if (result.success === false) throw new Error(result.message || `Unable to load ${label.toLowerCase()}.`);
  return result.data;
}

function SearchableLookup({label,placeholder,items,value,onChange,loading,error,onRetry,disabled=false,emptyMessage='No options available',searchPlaceholder='Search…',required=false}) {
  const [query,setQuery]=useState('');
  const [open,setOpen]=useState(false);
  const selected=items.find(item=>item._id===value);
  const filtered=items.filter(item=>`${item.fullName||item.name||''} ${item.email||''} ${item.code||''}`.toLowerCase().includes(query.toLowerCase()));
  useEffect(()=>{ if(selected) setQuery(''); },[value]); 
  return <label className="lookup-label">{label}
    <div className={`lookup-control ${disabled?'is-disabled':''}`}>
      <input
        value={open?query:(selected?(selected.fullName||selected.name||'')+(selected.email?` · ${selected.email}`:''):query)}
        onChange={e=>{setQuery(e.target.value);setOpen(true);if(value)onChange('');}}
        onFocus={()=>{setQuery('');setOpen(true);}}
        onBlur={()=>window.setTimeout(()=>setOpen(false),140)}
        placeholder={loading?'Loading options…':error?'Lookup unavailable':placeholder}
        disabled={disabled||loading||Boolean(error)}
        autoComplete="off"
        required={required&&!value}
        aria-label={label}
        aria-expanded={open}
        role="combobox"
      />
      <ChevronDown size={16} className="lookup-chevron"/>
      {open&&!disabled&&!loading&&!error&&<div className="lookup-menu" role="listbox">
        {filtered.length===0?<div className="lookup-message">{items.length===0?emptyMessage:'No matching results'}</div>:filtered.map(item=><button type="button" className={`lookup-option ${item._id===value?'selected':''}`} key={item._id} onMouseDown={e=>e.preventDefault()} onClick={()=>{onChange(item._id);setQuery('');setOpen(false);}}>
          <span>{item.fullName||item.name}</span>
          {item.email&&<small>{item.email}</small>}
          {item.code&&<small>{item.code}</small>}
        </button>)}
      </div>}
    </div>
    {error&&<span className="lookup-error">{error} <button type="button" className="text-btn" onClick={onRetry}>Retry</button></span>}
    {!error&&!loading&&items.length===0&&<span className="lookup-help">{emptyMessage}</span>}
  </label>;
}

function Onboarding({token,notify}) {
  const [employees,setEmployees]=useState([]);const [departments,setDepartments]=useState([]);const [grades,setGrades]=useState([]);
  const [employeeId,setEmployeeId]=useState('');const [departmentId,setDepartmentId]=useState('');const [gradeId,setGradeId]=useState('');const [type,setType]=useState('BANK');
  const [employeeLoading,setEmployeeLoading]=useState(true);const [departmentLoading,setDepartmentLoading]=useState(true);const [gradeLoading,setGradeLoading]=useState(false);
  const [employeeError,setEmployeeError]=useState('');const [departmentError,setDepartmentError]=useState('');const [gradeError,setGradeError]=useState('');
  const [busy,setBusy]=useState(false);const [error,setError]=useState('');const [success,setSuccess]=useState('');
  const submitting=useRef(false);const gradeRequest=useRef(0);

  const loadEmployees=useCallback(async()=>{
    setEmployeeLoading(true);setEmployeeError('');
    try{const data=lookupData(await api('/api/v1/admin/employees/onboarding-eligible',{token}),'Eligible employees');
      if(data.some(item=>!item?._id||!item.fullName||!item.email))throw new Error('Eligible employees returned records missing _id, fullName, or email.');
      setEmployees(data);
    }catch(e){setEmployees([]);setEmployeeError(e.message||'Unable to load eligible employees.');}
    finally{setEmployeeLoading(false);}
  },[token]);
  const loadDepartments=useCallback(async()=>{
    setDepartmentLoading(true);setDepartmentError('');
    try{const data=lookupData(await api('/api/v1/departments/registration',{token}),'Departments');
      if(data.some(item=>!item?._id||!item.name))throw new Error('Departments returned records missing _id or name.');
      setDepartments(data);
    }catch(e){setDepartments([]);setDepartmentError(e.message||'Unable to load departments.');}
    finally{setDepartmentLoading(false);}
  },[token]);
  const loadGrades=useCallback(async(id)=>{
    const requestId=++gradeRequest.current;
    if(!id){setGrades([]);setGradeError('');setGradeLoading(false);return;}
    setGradeLoading(true);setGradeError('');setGrades([]);
    try{const data=lookupData(await api(`/api/v1/grades/registration?departmentId=${encodeURIComponent(id)}`,{token}),'Grades');
      if(data.some(item=>!item?._id||!item.name))throw new Error('Grades returned records missing _id or name.');
      if(requestId===gradeRequest.current)setGrades(data);
    }catch(e){if(requestId===gradeRequest.current){setGrades([]);setGradeError(e.message||'Unable to load grades.');}}
    finally{if(requestId===gradeRequest.current)setGradeLoading(false);}
  },[token]);
  useEffect(()=>{loadEmployees();loadDepartments();},[loadEmployees,loadDepartments]);
  useEffect(()=>{setGradeId('');setGrades([]);setGradeError('');if(departmentId)loadGrades(departmentId);},[departmentId,loadGrades]);

  async function submit(e){
    e.preventDefault();if(submitting.current||busy)return;
    if(!employeeId||!departmentId||!gradeId){setError('Select an employee, department, grade, and employment type before submitting.');return;}
    submitting.current=true;setBusy(true);setError('');setSuccess('');
    try{
      const result=await api(`/api/v1/admin/employees/${encodeURIComponent(employeeId)}/onboard`,{token,method:'POST',body:{departmentId,gradeId,type}});
      setSuccess(result?.message||'Employee onboarding completed successfully.');
      notify(result?.message||'Employee onboarding completed.');
      setEmployeeId('');setDepartmentId('');setGradeId('');setType('BANK');setError('');
      await loadEmployees();
    }catch(e){setError(e.message||'Employee onboarding failed.');}
    finally{submitting.current=false;setBusy(false);}
  }
  const employeeEmpty='No employees currently meet the onboarding prerequisites.';
  const departmentEmpty='No active departments were returned.';
  const gradeEmpty=departmentId?'No active grades are configured for this department.':'Select a department to load grades.';
  const canSubmit=Boolean(employeeId&&departmentId&&gradeId&&!employeeLoading&&!departmentLoading&&!gradeLoading&&!employeeError&&!departmentError&&!gradeError&&!busy);
  return <><PageHeading eyebrow="PEOPLE / ONBOARDING" title="Employee onboarding" description="Complete onboarding for employees who have met compliance requirements." action={<button className="btn secondary" type="button" onClick={()=>{loadEmployees();loadDepartments();if(departmentId)loadGrades(departmentId);}} disabled={employeeLoading||departmentLoading||gradeLoading}><RefreshCw size={16}/> Refresh lookups</button>}/>
    <div className="onboarding-layout"><section className="panel onboarding-panel"><div className="form-intro"><span className="form-intro-icon"><UserRoundCheck size={22}/></span><div><h3>Start employee onboarding</h3><p>Select an eligible employee and their active organisational assignments.</p></div></div>
      {error&&<div className="alert error" role="alert"><AlertCircle size={17}/><div><b>Onboarding failed</b><span>{error}</span></div><button type="button" className="icon-btn" aria-label="Dismiss error" onClick={()=>setError('')}><X size={15}/></button></div>}
      {success&&<div className="alert success" role="status"><CheckCircle2 size={17}/><div><b>Onboarding complete</b><span>{success}</span></div><button type="button" className="icon-btn" aria-label="Dismiss success" onClick={()=>setSuccess('')}><X size={15}/></button></div>}
      <form onSubmit={submit} className="onboarding-form">
        <SearchableLookup label="Employee" placeholder="Search by employee name or email" items={employees} value={employeeId} onChange={id=>{setEmployeeId(id);setError('');setSuccess('');}} loading={employeeLoading} error={employeeError} onRetry={loadEmployees} emptyMessage={employeeEmpty} required/>
        <div className="form-two">
          <SearchableLookup label="Department" placeholder="Search departments…" items={departments} value={departmentId} onChange={id=>{setDepartmentId(id);setGradeId('');setError('');setSuccess('');}} loading={departmentLoading} error={departmentError} onRetry={loadDepartments} emptyMessage={departmentEmpty} required/>
          <SearchableLookup label="Grade" placeholder={departmentId?'Search grades…':'Select a department first'} items={grades} value={gradeId} onChange={id=>{setGradeId(id);setError('');setSuccess('');}} loading={gradeLoading} error={gradeError} onRetry={()=>loadGrades(departmentId)} disabled={!departmentId} emptyMessage={gradeEmpty} required/>
        </div>
        <label>Employment type<select value={type} onChange={e=>setType(e.target.value)} required><option value="BANK">Bank</option><option value="INTERNAL">Internal</option><option value="EXTERNAL">External</option></select></label>
        <div className="form-hint"><AlertCircle size={16}/><span>Only employees returned by the onboarding-eligible endpoint are selectable. The backend validates compliance, bank details, and department-grade mapping during submission.</span></div>
        <button className="btn primary" disabled={!canSubmit}>{busy?<><Spinner/> Processing onboarding…</>:<><UserRoundCheck size={16}/> Complete onboarding</>}</button>
      </form>
    </section><section className="panel checklist-panel"><PanelTitle title="Before you begin" subtitle="Backend prerequisites"/><div className="checklist">{['Employee email is verified','Overall compliance is approved','All required documents are approved','Bank details are complete','Department and grade are active and correctly mapped'].map((x,i)=><div className="checklist-item" key={x}><span>{i+1}</span><p>{x}</p></div>)}</div><div className="panel-note"><ShieldCheck size={16}/><span>The backend remains authoritative. If any prerequisite is missing, its validation message is shown and onboarding is not marked complete.</span></div></section></div>
  </>;
}

createRoot(document.getElementById('root')).render(<App/>);

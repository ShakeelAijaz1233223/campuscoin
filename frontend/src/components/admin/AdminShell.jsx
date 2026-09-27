import{NavLink}from'react-router-dom';import{ShieldCheck}from'lucide-react';import{adminNavigation}from '../layout/navigation';
export default function AdminShell({children}){return <div>
 <div className="admin-banner"><ShieldCheck size={18}/><span><b>Admin area.</b> You are managing the CampusCoin deployment. Student data stays read-only here.</span></div>
 <nav className="tabs" aria-label="Administration sections">{adminNavigation.map(n=><NavLink key={n.path} to={n.path} end className={({isActive})=>isActive?'active':''}>{n.label}</NavLink>)}</nav>
 <div className="section-gap">{children}</div></div>;}

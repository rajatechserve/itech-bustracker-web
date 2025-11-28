
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import MapPage from './pages/Map';
import Students from './pages/Students';
import Drivers from './pages/Drivers';
import Assignments from './pages/Assignments';
import Attendance from './pages/Attendance';
import Buses from './pages/Buses';
import RoutesPage from './pages/Routes';
import Parents from './pages/Parents';
import Schools from './pages/Schools';
import SchoolDashboard from './pages/SchoolDashboard';
import SchoolDetails from './pages/SchoolDetails';
import SchoolUsers from './pages/SchoolUsers';
import SchoolProfile from './pages/SchoolProfile';
import AdminSettings from './pages/AdminSettings';
import DriverDashboard from './pages/DriverDashboard';
import ParentDashboard from './pages/ParentDashboard';
import Login from './pages/Login';
import api, { getAuthUser, setAuthToken, setAuthUser, SERVER_URL } from './services/api';
import { useTheme } from './context/ThemeContext';

function Sidebar({ authUser, onLogoUpdate }){ 
  const isAdmin = authUser?.role === 'admin';
  const isSchoolAdmin = authUser?.role === 'school';
  const isSchoolUser = authUser?.role === 'schoolUser';
  const isDriver = authUser?.role === 'driver';
  const isParent = authUser?.role === 'parent';
  const userRole = authUser?.userRole; // viewer | editor | manager
  const isViewer = isSchoolUser && userRole === 'viewer';
  const logo = (isSchoolAdmin || isSchoolUser || isDriver || isParent) ? authUser?.logo : null;
  const [adminLogo, setAdminLogo] = React.useState(localStorage.getItem('adminLogo') || null);
  
  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('Logo file size must be less than 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setAdminLogo(reader.result);
      localStorage.setItem('adminLogo', reader.result);
    };
    reader.readAsDataURL(file);
  };
  
  const getSidebarStyle = () => {
    if(!isAdmin && authUser?.sidebarColorFrom && authUser?.sidebarColorTo){
      return { background: `linear-gradient(to bottom, ${authUser.sidebarColorFrom}, ${authUser.sidebarColorTo})` };
    }
    const prefix = isAdmin ? 'admin' : 'school';
    const from = localStorage.getItem(`${prefix}SidebarFrom`);
    const to = localStorage.getItem(`${prefix}SidebarTo`);
    if (from && to) {
      const colorMap = {
        'blue-500': '#3b82f6', 'indigo-600': '#4f46e5', 'purple-600': '#9333ea',
        'pink-500': '#ec4899', 'red-500': '#ef4444', 'orange-500': '#f97316',
        'amber-500': '#f59e0b', 'yellow-500': '#eab308', 'lime-500': '#84cc16',
        'green-600': '#16a34a', 'emerald-600': '#059669', 'teal-600': '#0d9488',
        'cyan-500': '#06b6d4', 'sky-500': '#0ea5e9', 'violet-600': '#7c3aed',
        'fuchsia-600': '#c026d3', 'rose-500': '#f43f5e', 'slate-700': '#334155',
        'white': '#ffffff'
      };
      return { background: `linear-gradient(to bottom, ${colorMap[from]}, ${colorMap[to]})` };
    }
    return {};
  };

  const hasCustomSidebarColors = () => {
    if(!isAdmin && authUser?.sidebarColorFrom && authUser?.sidebarColorTo) return true;
    const prefix = isAdmin ? 'admin' : 'school';
    return localStorage.getItem(`${prefix}SidebarFrom`) && localStorage.getItem(`${prefix}SidebarTo`);
  };

  const isSchoolRole = ['school','schoolUser','driver','parent'].includes(authUser?.role);
  const schoolName = authUser?.name || authUser?.schoolName;

  return (
  <aside className={`w-64 ${hasCustomSidebarColors() ? '' : 'bg-white dark:bg-slate-800'} border-r dark:border-slate-700 hidden md:block`} style={getSidebarStyle()}>
    <div className={`p-6 ${hasCustomSidebarColors() ? 'text-white' : 'text-slate-700 dark:text-slate-200'}`}>
      <div className="flex flex-col items-center justify-center space-y-3">
        {isAdmin ? (
          <div className="flex items-center justify-center cursor-pointer group relative w-full" title="Click to upload logo">
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="absolute inset-0 opacity-0 cursor-pointer"
              id="admin-logo-upload"
            />
            {adminLogo ? (
              <img 
                src={adminLogo.startsWith('/uploads') ? `${SERVER_URL}${adminLogo}` : adminLogo} 
                alt="Admin Logo" 
                className="h-20 w-auto max-w-[180px] object-contain" 
              />
            ) : (
              <span className="text-center text-2xl font-semibold">SchoolBus</span>
            )}
          </div>
        ) : logo ? (
          <img 
            src={logo.startsWith('/uploads') ? `${SERVER_URL}${logo}` : logo} 
            alt="School Logo" 
            className="h-20 w-auto max-w-[180px] object-contain" 
          />
        ) : (
          <span className="text-center text-2xl font-semibold">SchoolBus</span>
        )}
        {isSchoolRole && schoolName && (
          <div className={`text-center text-base font-semibold ${hasCustomSidebarColors() ? 'text-white' : 'text-slate-700 dark:text-slate-200'} px-2`}>
            {schoolName}
          </div>
        )}
      </div>
    </div>
    <nav className="p-4 space-y-2 text-sm">
      {isAdmin && (
        <>
          <Link className={`block py-3 px-4 rounded-lg ${hasCustomSidebarColors() ? 'text-white hover:bg-white/20 hover:backdrop-blur-sm' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'} transition-all duration-200 font-medium`} to="/">Dashboard</Link>
          <Link className={`block py-3 px-4 rounded-lg ${hasCustomSidebarColors() ? 'text-white hover:bg-white/20 hover:backdrop-blur-sm' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'} transition-all duration-200 font-medium`} to="/schools">Schools</Link>
          <Link className={`block py-3 px-4 rounded-lg ${hasCustomSidebarColors() ? 'text-white hover:bg-white/20 hover:backdrop-blur-sm' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'} transition-all duration-200 font-medium`} to="/admin-settings">Settings</Link>
        </>
      )}
      {(isSchoolAdmin || isSchoolUser || isDriver || isParent) && (
        <>
          <Link className={`block py-3 px-4 rounded-lg ${hasCustomSidebarColors() ? 'text-white hover:bg-white/20 hover:backdrop-blur-sm' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'} transition-all duration-200 font-medium`} to="/school-dashboard">Dashboard</Link>
          <Link className={`block py-3 px-4 rounded-lg ${hasCustomSidebarColors() ? 'text-white hover:bg-white/20 hover:backdrop-blur-sm' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'} transition-all duration-200 font-medium`} to="/map">Live Map</Link>
          {!isViewer && <Link className={`block py-3 px-4 rounded-lg ${hasCustomSidebarColors() ? 'text-white hover:bg-white/20 hover:backdrop-blur-sm' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'} transition-all duration-200 font-medium`} to="/attendance">Attendance</Link>}
          {!isViewer && <Link className={`block py-3 px-4 rounded-lg ${hasCustomSidebarColors() ? 'text-white hover:bg-white/20 hover:backdrop-blur-sm' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'} transition-all duration-200 font-medium`} to="/assignments">Assignments</Link>}
          <Link className={`block py-3 px-4 rounded-lg ${hasCustomSidebarColors() ? 'text-white hover:bg-white/20 hover:backdrop-blur-sm' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'} transition-all duration-200 font-medium`} to="/drivers">Drivers</Link>
          {!isViewer && <Link className={`block py-3 px-4 rounded-lg ${hasCustomSidebarColors() ? 'text-white hover:bg-white/20 hover:backdrop-blur-sm' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'} transition-all duration-200 font-medium`} to="/routes">Routes</Link>}
          {!isViewer && <Link className={`block py-3 px-4 rounded-lg ${hasCustomSidebarColors() ? 'text-white hover:bg-white/20 hover:backdrop-blur-sm' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'} transition-all duration-200 font-medium`} to="/buses">Buses</Link>}
          {!isViewer && <Link className={`block py-3 px-4 rounded-lg ${hasCustomSidebarColors() ? 'text-white hover:bg-white/20 hover:backdrop-blur-sm' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'} transition-all duration-200 font-medium`} to="/parents">Parents</Link>}
          <Link className={`block py-3 px-4 rounded-lg ${hasCustomSidebarColors() ? 'text-white hover:bg-white/20 hover:backdrop-blur-sm' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'} transition-all duration-200 font-medium`} to="/students">Students</Link>
          {isSchoolAdmin && <Link className={`block py-3 px-4 rounded-lg ${hasCustomSidebarColors() ? 'text-white hover:bg-white/20 hover:backdrop-blur-sm' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'} transition-all duration-200 font-medium`} to="/school-users">Users & Roles</Link>}
          {isSchoolAdmin && <Link className={`block py-3 px-4 rounded-lg ${hasCustomSidebarColors() ? 'text-white hover:bg-white/20 hover:backdrop-blur-sm' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'} transition-all duration-200 font-medium`} to="/school-profile">School Profile</Link>}
        </>
      )}
    </nav>
  </aside>
);} 

function Header({ onLogout, authUser }) {
  // For drivers/parents, use userName (their actual name), otherwise use username or name
  const username = (authUser?.role === 'driver' || authUser?.role === 'parent') 
    ? authUser?.userName || authUser?.name 
    : authUser?.username || authUser?.name;
  const schoolName = authUser?.schoolName || authUser?.name;
  const schoolPhoto = authUser?.photo;
  const isSchool = ['school','schoolUser'].includes(authUser?.role);
  const isDriver = authUser?.role === 'driver';
  const isParent = authUser?.role === 'parent';
  const isAdmin = authUser?.role === 'admin';
  const { theme, setTheme } = useTheme();
  
  const ThemeIcon = ({ type }) => {
    if (type === 'light') return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>;
    if (type === 'dark') return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>;
    return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
  };
  
  const getHeaderStyle = () => {
    if(!isAdmin && authUser?.headerColorFrom && authUser?.headerColorTo){
      return { background: `linear-gradient(to right, ${authUser.headerColorFrom}, ${authUser.headerColorTo})` };
    }
    const prefix = isAdmin ? 'admin' : 'school';
    const from = localStorage.getItem(`${prefix}HeaderFrom`);
    const to = localStorage.getItem(`${prefix}HeaderTo`);
    if (from && to) {
      const colorMap = {
        'blue-500': '#3b82f6', 'indigo-600': '#4f46e5', 'purple-600': '#9333ea',
        'pink-500': '#ec4899', 'red-500': '#ef4444', 'orange-500': '#f97316',
        'amber-500': '#f59e0b', 'yellow-500': '#eab308', 'lime-500': '#84cc16',
        'green-600': '#16a34a', 'emerald-600': '#059669', 'teal-600': '#0d9488',
        'cyan-500': '#06b6d4', 'sky-500': '#0ea5e9', 'violet-600': '#7c3aed',
        'fuchsia-600': '#c026d3', 'rose-500': '#f43f5e', 'slate-700': '#334155',
        'white': '#ffffff'
      };
      return { background: `linear-gradient(to right, ${colorMap[from]}, ${colorMap[to]})` };
    }
    return {};
  };

  const hasCustomHeaderColors = () => {
    if(!isAdmin && authUser?.headerColorFrom && authUser?.headerColorTo) return true;
    const prefix = isAdmin ? 'admin' : 'school';
    return localStorage.getItem(`${prefix}HeaderFrom`) && localStorage.getItem(`${prefix}HeaderTo`);
  };

  return (
    <header className={`${hasCustomHeaderColors() ? '' : 'bg-white dark:bg-slate-800'} border-b dark:border-slate-700`} style={getHeaderStyle()}>
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {isDriver || isParent ? (
          <>
            <div className="flex items-center gap-4 flex-1">
              {authUser?.logo && (
                <img src={authUser.logo.startsWith('/uploads') ? `${SERVER_URL}${authUser.logo}` : authUser.logo} alt="School Logo" className="h-12 w-auto object-contain" />
              )}
              <div className="flex flex-col">
                <div className={`text-xl font-semibold ${hasCustomHeaderColors() ? 'text-white' : 'text-slate-800 dark:text-slate-100'}`}>{authUser?.name || 'School'}</div>
                <div className={`text-xs ${hasCustomHeaderColors() ? 'text-white/80' : 'text-slate-600 dark:text-slate-400'}`}>
                  {authUser?.address && (
                    <span>{authUser.address}{authUser.city || authUser.state ? `, ${[authUser.city, authUser.state].filter(Boolean).join(', ')}` : ''}</span>
                  )}
                  {(authUser?.phone || authUser?.mobile) && (
                    <span className="block mt-1">
                      {authUser.phone && <span>📞 {authUser.phone}</span>}
                      {authUser.phone && authUser.mobile && <span className="mx-2">•</span>}
                      {authUser.mobile && <span>📱 {authUser.mobile}</span>}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className={`flex items-center gap-2 ${hasCustomHeaderColors() ? 'bg-white/20 backdrop-blur-sm border-white/30' : 'bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600'} border rounded-lg p-1`}>
                <button onClick={() => setTheme('light')} className={`p-1.5 rounded ${theme === 'light' ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300' : hasCustomHeaderColors() ? 'text-white hover:bg-white/20' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'}`} title="Light mode"><ThemeIcon type="light" /></button>
                <button onClick={() => setTheme('dark')} className={`p-1.5 rounded ${theme === 'dark' ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300' : hasCustomHeaderColors() ? 'text-white hover:bg-white/20' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'}`} title="Dark mode"><ThemeIcon type="dark" /></button>
                <button onClick={() => setTheme('auto')} className={`p-1.5 rounded ${theme === 'auto' ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300' : hasCustomHeaderColors() ? 'text-white hover:bg-white/20' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'}`} title="Auto (system)"><ThemeIcon type="auto" /></button>
              </div>
              <div className={`text-sm ${hasCustomHeaderColors() ? 'text-white' : 'text-slate-700 dark:text-slate-300'}`}>Signed in as <strong>{username}</strong></div>
              <button onClick={onLogout} className={`text-sm px-3 py-1.5 rounded-lg transition-all duration-200 font-medium ${hasCustomHeaderColors() ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400'}`}>Logout</button>
            </div>
          </>
        ) : (
          <>
            {isSchool ? (
              <div className="flex-1 flex flex-col justify-center">
                <div className={`text-2xl md:text-3xl font-bold leading-tight ${hasCustomHeaderColors() ? 'text-white drop-shadow-md' : 'text-slate-800 dark:text-slate-200'}`}>{schoolName}</div>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  {authUser?.address && (
                    <span className={`text-sm ${hasCustomHeaderColors() ? 'text-white/90' : 'text-slate-600 dark:text-slate-400'}`}>{authUser.address}{authUser.city || authUser.state ? `, ${[authUser.city, authUser.state].filter(Boolean).join(', ')}` : ''}</span>
                  )}
                  {(authUser?.phone || authUser?.mobile) && (
                    <span className={`text-sm ${hasCustomHeaderColors() ? 'text-white/80' : 'text-slate-500 dark:text-slate-500'}`}>
                      {authUser.phone && <span>📞 {authUser.phone}</span>}
                      {authUser.phone && authUser.mobile && <span className="mx-2">•</span>}
                      {authUser.mobile && <span>📱 {authUser.mobile}</span>}
                    </span>
                  )}
                </div>
              </div>
            ) : <div className="flex-1" />}
            <div className="flex items-center justify-end gap-4">
              <div className={`flex items-center gap-2 ${hasCustomHeaderColors() ? 'bg-white/20 backdrop-blur-sm border-white/30' : 'bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600'} border rounded-lg p-1`}>
                <button onClick={() => setTheme('light')} className={`p-1.5 rounded ${theme === 'light' ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300' : hasCustomHeaderColors() ? 'text-white hover:bg-white/20' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'}`} title="Light mode"><ThemeIcon type="light" /></button>
                <button onClick={() => setTheme('dark')} className={`p-1.5 rounded ${theme === 'dark' ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300' : hasCustomHeaderColors() ? 'text-white hover:bg-white/20' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'}`} title="Dark mode"><ThemeIcon type="dark" /></button>
                <button onClick={() => setTheme('auto')} className={`p-1.5 rounded ${theme === 'auto' ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300' : hasCustomHeaderColors() ? 'text-white hover:bg-white/20' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'}`} title="Auto (system)"><ThemeIcon type="auto" /></button>
              </div>
              <div className={`text-sm ${hasCustomHeaderColors() ? 'text-white' : 'text-slate-700 dark:text-slate-300'}`}>Signed in as <strong className="font-semibold">{username}</strong></div>
              <button onClick={onLogout} className={`text-sm px-3 py-1.5 rounded-lg transition-all duration-200 font-medium ${hasCustomHeaderColors() ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400'}`}>Logout</button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}

export default function App(){
  const [authUserState, setAuthUserState] = useState(getAuthUser());
  useEffect(()=>{ setAuthUserState(getAuthUser()); },[]);
  // Fetch school profile for driver/parent and merge branding
  useEffect(() => {
    const u = authUserState;
    if(!u) return;
    if(['driver','parent'].includes(u.role) && u.schoolId && !u._schoolLoaded){
      (async () => {
        try {
          const r = await api.get(`/public/schools/${u.schoolId}`);
          if(r.data){
            // Preserve original user's name and store school name separately
            const merged = { ...u, ...r.data, userName: u.name, schoolName: r.data.name, _schoolLoaded: true };
            setAuthUser(merged);
            setAuthUserState(merged);
          }
        } catch(e){ console.log('school load (public) failed', e.message); }
      })();
    }
  }, [authUserState]);
  const logout = () => { setAuthToken(null); setAuthUser(null); setAuthUserState(null); window.location.href = '/login'; };
  return (
    <BrowserRouter>
      <div className="min-h-screen flex bg-gray-50 dark:bg-slate-900">
        {authUserState && !(authUserState?.role === 'driver' || authUserState?.role === 'parent') && (
          <Sidebar authUser={authUserState} onLogoUpdate={() => setAuthUserState(getAuthUser())} />
        )}
        <div className="flex-1">
          {authUserState && <Header onLogout={logout} authUser={authUserState} />}
          <main className="p-6 max-w-7xl mx-auto">
            <Routes>
              <Route path="/login" element={<Login onLogin={() => { setAuthUserState(getAuthUser()); }} />} />
              <Route path="/dashboard" element={authUserState?.role === 'admin' ? <Dashboard/> : <Navigate to="/login" replace />} />
              <Route path="/" element={<Navigate to={authUserState ? (authUserState.role === 'admin' ? '/dashboard' : (authUserState.role === 'school' || authUserState.role === 'schoolUser' ? '/school-dashboard' : authUserState.role === 'driver' ? '/driver-dashboard' : authUserState.role === 'parent' ? '/parent-dashboard' : '/login')) : '/login'} replace />} />
              <Route path="/map" element={<MapPage/>} />
              <Route path="/buses" element={<Buses/>} />
              <Route path="/drivers" element={<Drivers/>} />
              <Route path="/students" element={<Students/>} />
              <Route path="/parents" element={<Parents/>} />
              <Route path="/assignments" element={<Assignments/>} />
              <Route path="/attendance" element={<Attendance/>} />
              <Route path="/routes" element={<RoutesPage/>} />
              <Route path="/schools" element={<Schools/>} />
              <Route path="/admin-settings" element={<AdminSettings/>} />
              <Route path="/school-dashboard" element={<SchoolDashboard/>} />
              <Route path="/school-details" element={<SchoolDetails/>} />
              <Route path="/school-users" element={<SchoolUsers/>} />
              <Route path="/school-profile" element={<SchoolProfile/>} />
              <Route path="/driver-dashboard" element={<DriverDashboard/>} />
              <Route path="/parent-dashboard" element={<ParentDashboard/>} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}

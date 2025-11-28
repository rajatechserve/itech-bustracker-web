
import React, { useState, useEffect } from 'react';
import api, { setAuthToken, setAuthUser } from '../services/api';

export default function Login({ onLogin }) {
  const [mode, setMode] = useState('admin'); // 'admin' | 'driver' | 'parent' | 'school' | 'schoolUser'
  const [schoolUserName, setSchoolUserName] = useState('');
  const [username, setUsername] = useState('admin');
  const [schoolList, setSchoolList] = useState([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState('');
  const [schoolSearch, setSchoolSearch] = useState('');
  const [password, setPassword] = useState('admin123');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [bus, setBus] = useState('');
  const [loading, setLoading] = useState(false);

  const phoneValid = /^\+?\d{7,15}$/.test(phone.trim());
  const driverValid = name.trim().length >= 2 && phoneValid && bus.trim().length >= 2;
  const parentValid = name.trim().length >= 2 && phoneValid;
  const adminValid = username.trim() && password.trim();
  const schoolValid = selectedSchoolId && password.trim();
    // Load schools when entering school mode or searching
    useEffect(() => {
      if (mode !== 'school') return;
      const load = async () => {
        try {
          const r = await api.get('/public/schools', { params: { search: schoolSearch || undefined } });
          setSchoolList(r.data || []);
          // If previously selected school's username not set, update it
          if (selectedSchoolId) {
            const match = (r.data || []).find(s => s.id === selectedSchoolId);
            if (match) setUsername(match.username);
          }
        } catch {}
      };
      load();
    }, [mode, schoolSearch, selectedSchoolId]);

    const onSelectSchool = (id) => {
      setSelectedSchoolId(id);
      const match = schoolList.find(s => s.id === id);
      if (match) setUsername(match.username);
    };
  const schoolUserValid = schoolUserName.trim() && password.trim();

  const submit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      if (mode === 'admin') {
        const r = await api.post('/auth/login', { username, password });
        setAuthToken(r.data.token); setAuthUser({ role: 'admin', username }); if(onLogin) onLogin(username);
        window.location.href = '/';
      } else if (mode === 'school') {
        if (!schoolValid) return;
        // username already derived from selected school; ensure present
        const r = await api.post('/auth/school-login', { username, password });
        
        // Check for contract warnings or expiration
        if (r.data.message) {
          alert('⚠️ ' + r.data.message);
        }
        
        setAuthToken(r.data.token); setAuthUser({ role: 'school', ...r.data.school }); if(onLogin) onLogin(r.data.school.name);
        // Optional: refresh school record through scoped /api/schools (will return only this school)
        try { const sr = await api.get('/schools'); const only = sr.data?.data?.[0]; if(only){ setAuthUser({ role:'school', ...only }); } } catch {}
        window.location.href = '/school-dashboard';
      } else if (mode === 'schoolUser') {
        if(!schoolUserValid) return;
        const r = await api.post('/auth/school-user-login', { username: schoolUserName.trim(), password });
        // Preserve main role and sub-role separately
        const u = r.data.user || {};
        setAuthToken(r.data.token);
        setAuthUser({ role: 'schoolUser', userRole: u.role, id: u.id, username: u.username, schoolId: u.schoolId, schoolName: u.schoolName, logo: u.logo, photo: u.photo });
        if(onLogin) onLogin(u.schoolName);
        window.location.href = '/school-dashboard';
      } else if (mode === 'driver') {
        if (!/^\d{10}$/.test(phone.trim())) return;
        const r = await api.post('/auth/driver-login', { phone: phone.trim() });
        setAuthToken(r.data.token); setAuthUser({ role: 'driver', id: r.data.driver.id, name: r.data.driver.name, phone: r.data.driver.phone, schoolId: r.data.driver.schoolId }); 
        window.location.href = '/driver-dashboard';
      } else if (mode === 'parent') {
        if (!/^\d{10}$/.test(phone.trim())) return;
        const r = await api.post('/auth/parent-login', { phone: phone.trim() });
        setAuthToken(r.data.token); setAuthUser({ role: 'parent', id: r.data.parent.id, name: r.data.parent.name, phone: r.data.parent.phone, schoolId: r.data.parent.schoolId }); 
        window.location.href = '/parent-dashboard';
      }
    } catch (err) {
      alert('Login failed: ' + (err?.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="flex justify-center mb-6 gap-2">
        {['admin','school','schoolUser','driver','parent'].map(m => (
          <button key={m} onClick={()=>setMode(m)} className={`px-3 py-1 rounded border text-sm ${mode===m?'bg-blue-600 text-white':'bg-white'}`}>{m.charAt(0).toUpperCase()+m.slice(1)}</button>
        ))}
      </div>
      <form onSubmit={submit} className="card space-y-3">
        {mode === 'admin' && (
          <>
            <h2 className="text-xl font-semibold mb-2">Admin Sign In</h2>
            <label className="block text-sm">Username</label>
            <input value={username} onChange={e=>setUsername(e.target.value)} className="w-full border rounded px-3 py-2"/>
            <label className="block text-sm">Password</label>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="w-full border rounded px-3 py-2"/>
            <button disabled={!adminValid||loading} className="btn-primary w-full">{loading?'...':'Sign in'}</button>
          </>
        )}
        {mode === 'school' && (
          <>
            <h2 className="text-xl font-semibold mb-2">School Login</h2>
            <label className="block text-sm">Select School</label>
            <div className="flex gap-2 mb-2">
              <input placeholder="Search..." value={schoolSearch} onChange={e=>setSchoolSearch(e.target.value)} className="flex-1 border rounded px-3 py-2" />
              <select value={selectedSchoolId} onChange={e=>onSelectSchool(e.target.value)} className="w-48 border rounded px-2 py-2">
                <option value="">-- choose --</option>
                {schoolList.map(s => (<option key={s.id} value={s.id}>{s.name}</option>))}
              </select>
            </div>
            {selectedSchoolId && (
              <div className="text-xs text-slate-500 mb-2">Logging in as: <strong>{username}</strong></div>
            )}
            <label className="block text-sm">Password</label>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="w-full border rounded px-3 py-2"/>
            <button disabled={!schoolValid||loading} className="btn-primary w-full">{loading?'...':'Login'}</button>
          </>
        )}
        {mode === 'driver' && (
          <>
            <h2 className="text-xl font-semibold mb-2">Driver Login</h2>
            <label className="block text-sm">Mobile Number</label>
            <input placeholder="Mobile (10 digits)" value={phone} onChange={e=>setPhone(e.target.value)} className="w-full border rounded px-3 py-2" maxLength="10"/>
            <div className="text-xs text-slate-500">{/^\d{10}$/.test(phone.trim())? 'Ready':'Enter valid 10-digit mobile number'}</div>
            <button disabled={!/^\d{10}$/.test(phone.trim())||loading} className="btn-primary w-full">{loading?'...':'Login'}</button>
          </>
        )}
        {mode === 'schoolUser' && (
          <>
            <h2 className="text-xl font-semibold mb-2">School User Login</h2>
            <label className="block text-sm">Username</label>
            <input placeholder="Unique username" value={schoolUserName} onChange={e=>setSchoolUserName(e.target.value)} className="w-full border rounded px-3 py-2"/>
            <label className="block text-sm">Password</label>
            <input type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} className="w-full border rounded px-3 py-2"/>
            <div className="text-xs text-slate-500">{schoolUserValid? 'Ready':'Enter username & password'}</div>
            <button disabled={!schoolUserValid||loading} className="btn-primary w-full">{loading?'...':'Login'}</button>
          </>
        )}
        {mode === 'parent' && (
          <>
            <h2 className="text-xl font-semibold mb-2">Parent Login</h2>
            <label className="block text-sm">Mobile Number</label>
            <input placeholder="Mobile (10 digits)" value={phone} onChange={e=>setPhone(e.target.value)} className="w-full border rounded px-3 py-2" maxLength="10"/>
            <div className="text-xs text-slate-500">{/^\d{10}$/.test(phone.trim())? 'Ready':'Enter valid 10-digit mobile number'}</div>
            <button disabled={!/^\d{10}$/.test(phone.trim())||loading} className="btn-primary w-full">{loading?'...':'Login'}</button>
          </>
        )}
      </form>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { getAuthUser } from '../services/api';

export default function SchoolUsers(){
  const [list,setList]=useState([]);
  const [username,setUsername]=useState('');
  const [password,setPassword]=useState('');
  const [role,setRole]=useState('editor');
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState('');
  const auth = getAuthUser();
  const isAdmin = auth?.role === 'school'; // only school admin can see

  const load=()=>{ if(!isAdmin) return; api.get('/school-users').then(r=>setList(r.data||[])).catch(()=>{}); };
  useEffect(()=>{ load(); },[]);

  const addUser=async()=>{
    setError('');
    if(!username.trim() || !password.trim() || password.length<6){ setError('Username & password (>=6) required'); return; }
    setLoading(true);
    try{
      const r = await api.post('/school-users',{ username: username.trim(), password, role });
      setList([r.data, ...list]);
      setUsername(''); setPassword(''); setRole('editor');
    }catch(e){ setError(e?.response?.data?.error || e.message); }
    finally{ setLoading(false); }
  };

  const resetPwd=async(id)=>{
    const pwd = prompt('New password (min 6 chars)');
    if(!pwd || pwd.length<6) return;
    try{ await api.post(`/school-users/${id}/reset-password`, { password: pwd }); alert('Password reset'); }catch(e){ alert('Reset failed'); }
  };

  const toggleActive=async(u)=>{
    try{ const r = await api.put(`/school-users/${u.id}`, { active: u.active?0:1 }); setList(list.map(x=>x.id===u.id? r.data : x)); }catch(e){ alert('Update failed'); }
  };

  const changeRole=async(u)=>{
    const newRole = prompt('Enter role (editor/viewer/admin)', u.role);
    if(!newRole) return;
    try{ const r = await api.put(`/school-users/${u.id}`, { role: newRole }); setList(list.map(x=>x.id===u.id? r.data : x)); }catch(e){ alert('Role change failed'); }
  };

  if(!isAdmin) return <div className="text-sm text-slate-500">Not authorized.</div>;

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">School Users & Roles</h2>
      <div className="grid gap-3 grid-cols-1 md:grid-cols-4 mb-4">
        <div className="flex flex-col">
          <label className="text-xs font-medium text-slate-600">Username</label>
          <input value={username} onChange={e=>setUsername(e.target.value)} className="border p-2" />
        </div>
        <div className="flex flex-col">
          <label className="text-xs font-medium text-slate-600">Password</label>
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="border p-2" />
          <div className="text-[10px] text-slate-500 mt-1">Min 6 characters.</div>
        </div>
        <div className="flex flex-col">
          <label className="text-xs font-medium text-slate-600">Role</label>
          <select value={role} onChange={e=>setRole(e.target.value)} className="border p-2">
            <option value="editor">editor</option>
            <option value="viewer">viewer</option>
            <option value="admin">admin</option>
          </select>
        </div>
        <div className="flex items-end">
          <button onClick={addUser} disabled={loading} className="btn-primary w-full">{loading?'...':'Add User'}</button>
        </div>
      </div>
      {error && <div className="text-sm text-red-600 mb-3">{error}</div>}
      <div className="space-y-2">
        {list.map(u=> (
          <div key={u.id} className="p-3 bg-white rounded shadow flex justify-between items-center">
            <div>
              <div className="font-medium flex items-center gap-2">{u.username} <span className="text-xs px-2 py-0.5 rounded bg-slate-100 border">{u.role}</span></div>
              <div className="text-xs text-slate-500">Created: {new Date(u.createdAt||0).toLocaleDateString()} | Status: {u.active? 'Active':'Inactive'}</div>
            </div>
            <div className="flex gap-3 text-xs">
              <button onClick={()=>changeRole(u)} className="text-blue-600">Change Role</button>
              <button onClick={()=>resetPwd(u.id)} className="text-purple-600">Reset Password</button>
              <button onClick={()=>toggleActive(u)} className={u.active? 'text-red-600':'text-green-600'}>{u.active?'Deactivate':'Activate'}</button>
            </div>
          </div>
        ))}
        {list.length===0 && <div className="text-sm text-slate-500">No users yet.</div>}
      </div>
    </div>
  );
}
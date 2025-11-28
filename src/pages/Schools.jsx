import React, { useEffect, useState } from 'react';
import api from '../services/api';

export default function Schools(){
  const [list,setList]=useState([]);
  const [form,setForm]=useState({name:'',address:'',city:'',state:'',county:'',phone:'',mobile:'',username:'',password:'',logo:null,photo:null});
  const [logoPreview,setLogoPreview]=useState('');
  const [photoPreview,setPhotoPreview]=useState('');
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState('');
  const [search,setSearch]=useState('');
  const load=()=>api.get('/schools', { params: { search, page:1, limit:5 }}).then(r=>setList(r.data?.data||[])).catch(()=>{});
  useEffect(()=>{ load(); },[search]);
  const fileToDataUrl = (file)=> new Promise((resolve,reject)=>{ if(!file) return resolve(null); const r=new FileReader(); r.onload=()=>resolve(r.result); r.onerror=reject; r.readAsDataURL(file); });
  const save=async()=>{
    setError('');
    if(!form.name.trim()||!form.username.trim()||!form.password||form.password.length<6){ setError('Name, username and password (>=6 chars) required'); return; }
    setLoading(true);
    try{
      const logoData = await fileToDataUrl(form.logo);
      const photoData = await fileToDataUrl(form.photo);
      await api.post('/schools',{ name: form.name.trim(), address: form.address.trim()||null, city: form.city.trim()||null, state: form.state.trim()||null, county: form.county.trim()||null, phone: form.phone.trim()||null, mobile: form.mobile.trim()||null, username: form.username.trim(), password: form.password, logo: logoData, photo: photoData });
      setForm({name:'',address:'',city:'',state:'',county:'',phone:'',mobile:'',username:'',password:'',logo:null,photo:null});
      setLogoPreview(''); setPhotoPreview('');
      load();
    }catch(e){ setError(e?.response?.data?.error || e.message); }
    finally{ setLoading(false); }
  };
  const resetPassword = async (id)=>{
    const pwd = prompt('Enter new password (min 6 chars)');
    if(!pwd || pwd.length<6) return alert('Password too short');
    try{ await api.post(`/schools/${id}/reset-password`, { password: pwd }); alert('Password reset'); }catch(e){ alert('Reset failed: '+(e?.response?.data?.error||e.message)); }
  };
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Schools</h2>
      <div className="mb-4 space-y-3">
        <div className="grid gap-2 grid-cols-1 md:grid-cols-3">
          <input placeholder="School Name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="border p-2" />
          <input placeholder="Address" value={form.address} onChange={e=>setForm({...form,address:e.target.value})} className="border p-2" />
          <input placeholder="City" value={form.city} onChange={e=>setForm({...form,city:e.target.value})} className="border p-2" />
          <input placeholder="State" value={form.state} onChange={e=>setForm({...form,state:e.target.value})} className="border p-2" />
          <input placeholder="County" value={form.county} onChange={e=>setForm({...form,county:e.target.value})} className="border p-2" />
          <input placeholder="Phone" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} className="border p-2" />
          <input placeholder="Mobile" value={form.mobile} onChange={e=>setForm({...form,mobile:e.target.value})} className="border p-2" />
        </div>
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
          <div className="flex flex-col">
            <label className="text-xs font-medium text-slate-600" htmlFor="school-username">Login Username</label>
            <input id="school-username" placeholder="Enter username" value={form.username} onChange={e=>setForm({...form,username:e.target.value})} className="border p-2" />
          </div>
          <div className="flex flex-col">
            <label className="text-xs font-medium text-slate-600" htmlFor="school-password">Login Password</label>
            <input id="school-password" type="password" placeholder="Enter password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} className="border p-2" />
            <div className="text-[10px] text-slate-500 mt-1">Minimum 6 characters.</div>
          </div>
        </div>
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600">School Logo (PNG/JPG, max 200KB)</label>
          <input type="file" accept="image/png,image/jpeg" onChange={e=>{ 
            const f=e.target.files?.[0];
            if(!f){ setForm({...form,logo:null}); setLogoPreview(''); return; }
            if(!['image/png','image/jpeg'].includes(f.type)){ setError('Logo must be PNG or JPG'); return; }
            if(f.size > 200*1024){ setError('Logo exceeds 200KB'); return; }
            setError('');
            setForm({...form,logo:f});
            const r=new FileReader(); r.onload=()=>setLogoPreview(r.result); r.readAsDataURL(f);
          }} className="border p-2" />
          <div className="text-[10px] text-slate-500">Recommended square 128x128, filename pattern: logo_[schoolname].png</div>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600">School Banner Image (PNG/JPG, max 800KB)</label>
          <input type="file" accept="image/png,image/jpeg" onChange={e=>{ 
            const f=e.target.files?.[0];
            if(!f){ setForm({...form,photo:null}); setPhotoPreview(''); return; }
            if(!['image/png','image/jpeg'].includes(f.type)){ setError('Image must be PNG or JPG'); return; }
            if(f.size > 800*1024){ setError('Image exceeds 800KB'); return; }
            setError('');
            setForm({...form,photo:f});
            const r=new FileReader(); r.onload=()=>setPhotoPreview(r.result); r.readAsDataURL(f);
          }} className="border p-2" />
          <div className="text-[10px] text-slate-500">Recommended wide 1200x400, filename pattern: photo_[schoolname].jpg</div>
        </div>
        </div>
        <div className="flex gap-2 items-center">
          <button onClick={save} disabled={loading} className="btn-primary">{loading?'Saving...':'Add School'}</button>
          {error && <div className="text-sm text-red-600">{error}</div>}
        </div>
        <div className="mt-3">
          <input placeholder="Search recent schools..." value={search} onChange={e=>setSearch(e.target.value)} className="border p-2 w-72" />
          <div className="text-[10px] text-slate-500 mt-1">Showing up to 5 most recent schools{search? ' matching search':''}.</div>
        </div>
      </div>
      <div className="space-y-2">
        {(logoPreview||photoPreview) && <div className="flex gap-4 mb-4">
          {logoPreview && <img src={logoPreview} alt="Logo preview" className="h-16 w-16 object-cover border rounded" />}
          {photoPreview && <img src={photoPreview} alt="Photo preview" className="h-16 w-24 object-cover border rounded" />}
        </div>}
        {list.map(s=> (<div key={s.id} className="p-3 bg-white rounded shadow">
          <div className="flex justify-between items-start">
            <div>
              <div className="font-medium">{s.name}</div>
              <div className="text-xs text-slate-500">{[s.address,s.city,s.state].filter(Boolean).join(', ')||'—'}</div>
              <div className="text-xs text-slate-500">County: {s.county||'—'} | Phone: {s.phone||'—'} | Mobile: {s.mobile||'—'}</div>
              <div className="text-xs text-slate-500">User: {s.username||'—'}</div>
              <div className="flex gap-2 mt-2">
                {s.logo && <img src={s.logo} alt="Logo" className="h-12 w-12 object-cover border rounded" />}
                {s.photo && <img src={s.photo} alt="Photo" className="h-12 w-20 object-cover border rounded" />}
              </div>
            </div>
            <div className="flex flex-col gap-1 text-xs">
              <button onClick={()=>resetPassword(s.id)} className="text-blue-600">Reset Password</button>
            </div>
          </div>
        </div>))}
        {list.length===0 && <div className="text-sm text-slate-500">No schools yet.</div>}
      </div>
    </div>
  );
}

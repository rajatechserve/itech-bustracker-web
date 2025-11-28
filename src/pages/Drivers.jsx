import React, { useEffect, useState } from 'react';
import api, { getAuthUser } from '../services/api';
export default function Drivers(){
  const [list,setList]=useState([]); const [q,setQ]=useState(''); const [form,setForm]=useState({name:'',phone:'',license:''});
  const [phoneExists,setPhoneExists]=useState(false); const [error,setError]=useState('');
  const user = getAuthUser();
  const isViewer = user?.role==='schoolUser' && user?.userRole==='viewer';
  const load=()=>api.get('/drivers', { params: { search: q || undefined } }).then(r=>setList(r.data||[])).catch(()=>{});
  useEffect(()=>{ load(); },[q]);
  
  const handlePhoneChange=async(value)=>{
    setForm({...form,phone:value});
    setPhoneExists(false);
    setError('');
    if(value.length===10 && /^\d{10}$/.test(value) && !form.id){
      try{
        const res = await api.get(`/drivers/check-phone/${value}`);
        setPhoneExists(res.data.exists);
      }catch(e){ console.log('Check failed',e); }
    }
  };
  
  const save=async()=>{ if(isViewer) return; 
  setError('');
  if(!form.name.trim()){ setError('Name is required'); return; }
  if(!/^\d{10}$/.test(form.phone.trim())){ setError('Phone must be exactly 10 digits'); return; }
  if(phoneExists && !form.id){ setError('This phone number already exists'); return; }
  try{ const config = {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
  };
  if (form.id) {
    await api.put('/drivers/' + form.id, form, config);
  } else {
    await api.post('/drivers', form, config);
  }
  setForm({ name: '', phone: '', license: '' });
  load(); }catch(e){ const errorMessage = e.response?.data?.error || 'An unexpected error occurred';
  alert(`Error: ${errorMessage}`);
  };
  };
  const edit=(d)=>setForm(d); const remove=async(id)=>{ if(isViewer) return; if(!confirm('Delete?')) return; await api.delete('/drivers/'+id); load(); };
  return (<div>
    <div className="flex items-center justify-between mb-4"><h2 className="text-xl font-semibold">Drivers {isViewer && <span className='text-xs text-slate-500'>(read-only)</span>}</h2><input placeholder="Search" value={q} onChange={e=>setQ(e.target.value)} className="border p-2"/></div>
    {isViewer && <div className="mb-4 p-3 bg-yellow-50 text-xs text-yellow-700 rounded">Viewer role: modifications disabled.</div>}
    <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-3">
      <input placeholder='Name' value={form.name} onChange={e=>{setForm({...form,name:e.target.value});setError('');}} className='border p-2 rounded' disabled={isViewer}/>
      <div>
        <input placeholder='Phone (10 digits)' value={form.phone} onChange={e=>handlePhoneChange(e.target.value)} className='border p-2 rounded w-full' maxLength='10' disabled={isViewer}/>
        {phoneExists && !form.id && <div className='text-xs text-red-600 mt-1'>This phone number already exists</div>}
      </div>
      <input placeholder='License' value={form.license} onChange={e=>{setForm({...form,license:e.target.value});setError('');}} className='border p-2 rounded' disabled={isViewer}/>
      <div className='md:col-span-3 flex gap-2'>
        <button onClick={save} disabled={isViewer} className={`btn-primary ${isViewer?'opacity-50 cursor-not-allowed':''}`}>{form.id?'Update':'Add'} Driver</button>
        {form.id && <button onClick={()=>{setForm({id:null,name:'',phone:'',license:''});setPhoneExists(false);setError('');}} className='btn-secondary'>Cancel</button>}
      </div>
      {error && <div className='md:col-span-3 text-sm text-red-600'>{error}</div>}
    </div>
    <div className='space-y-2'>{list.map(d=>(<div key={d.id} className='p-3 bg-white rounded shadow flex justify-between items-center'><div><div className='font-medium'>{d.name}</div><div className='text-sm text-slate-500'>{d.phone} • {d.license}</div></div><div className='flex gap-2'><button onClick={()=>!isViewer && edit(d)} disabled={isViewer} className={`text-blue-600 ${isViewer?'opacity-40 cursor-not-allowed':''}`}>Edit</button><button onClick={()=>remove(d.id)} disabled={isViewer} className={`text-red-600 ${isViewer?'opacity-40 cursor-not-allowed':''}`}>Delete</button></div></div>))}</div>
  </div>);
}

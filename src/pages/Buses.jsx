
import React, { useEffect, useState } from 'react';
import api, { getAuthUser } from '../services/api';
export default function Buses(){
  const [list,setList]=useState([]);
  const [form,setForm]=useState({number:'',registrationStartDate:'',registrationExpiredDate:'',fcRenewalDate:'',busType:''});
  const [q,setQ]=useState('');
  const user = getAuthUser();
  const isViewer = user?.role==='schoolUser' && user?.userRole==='viewer';
  const load=()=>api.get('/buses', { params: { search: q || undefined } }).then(r=>setList(r.data||[])).catch(()=>{});
  useEffect(()=>{ load(); },[q]);
  
  const save=async()=>{ 
    if(isViewer) return; 
    try{ 
      const payload = { 
        number: form.number, 
        registrationStartDate: form.registrationStartDate||null, 
        registrationExpiredDate: form.registrationExpiredDate||null,
        fcRenewalDate: form.fcRenewalDate||null,
        busType: form.busType||null
      }; 
      if(form.id) await api.put('/buses/'+form.id, payload); 
      else await api.post('/buses', payload); 
      setForm({number:'',registrationStartDate:'',registrationExpiredDate:'',fcRenewalDate:'',busType:''}); 
      load(); 
    }catch(e){ 
      alert('Error: '+(e?.response?.data?.error||e.message)); 
    } 
  };
  
  const edit=(b)=> setForm({
    id:b.id,
    number:b.number,
    registrationStartDate:b.registrationStartDate||'',
    registrationExpiredDate:b.registrationExpiredDate||'',
    fcRenewalDate:b.fcRenewalDate||'',
    busType:b.busType||''
  });
  
  const remove=async(id)=>{ if(isViewer) return; if(!confirm('Delete?')) return; await api.delete('/buses/'+id); load(); };
  
  const formatDate=(d)=> d ? new Date(d).toLocaleDateString('en-US', {year:'numeric',month:'short',day:'numeric'}) : '—';
  
  const isExpired=(date)=> {
    if(!date) return false;
    return new Date(date) < new Date();
  };
  
  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <h2 className="text-xl font-semibold">Buses {isViewer && <span className="text-xs text-slate-500">(read-only)</span>}</h2>
        <input placeholder="Search bus number..." value={q} onChange={e=>setQ(e.target.value)} className="border p-2 rounded"/>
      </div>
      
      {isViewer && <div className="mb-4 p-3 bg-yellow-50 text-xs text-yellow-700 rounded">Viewer role: modifications disabled.</div>}
      
      <div className="mb-4 bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
        <h3 className="text-sm font-semibold mb-3">{form.id ? 'Edit Bus' : 'Add Bus'}</h3>
        <div className="flex flex-wrap gap-2">
          <input 
            placeholder="Bus Number" 
            value={form.number} 
            onChange={e=>setForm({...form,number:e.target.value})} 
            className="border p-2 rounded min-w-[160px]" 
            disabled={isViewer}
          />
          <input 
            type="date" 
            placeholder="Registration Start Date"
            value={form.registrationStartDate} 
            onChange={e=>setForm({...form,registrationStartDate:e.target.value})} 
            className="border p-2 rounded text-sm" 
            disabled={isViewer}
            title="Registration Start Date"
          />
          <input 
            type="date" 
            placeholder="Registration Expired Date"
            value={form.registrationExpiredDate} 
            onChange={e=>setForm({...form,registrationExpiredDate:e.target.value})} 
            className="border p-2 rounded text-sm" 
            disabled={isViewer}
            title="Registration Expired Date"
          />
          <input 
            type="date" 
            placeholder="FC Renewal Date"
            value={form.fcRenewalDate} 
            onChange={e=>setForm({...form,fcRenewalDate:e.target.value})} 
            className="border p-2 rounded text-sm" 
            disabled={isViewer}
            title="FC Renewal Date"
          />
          <select 
            value={form.busType} 
            onChange={e=>setForm({...form,busType:e.target.value})} 
            className="border p-2 rounded min-w-[120px]" 
            disabled={isViewer}
          >
            <option value="">Bus Type</option>
            <option value="AC">AC</option>
            <option value="Non-AC">Non-AC</option>
          </select>
          <button 
            onClick={save} 
            className={`btn-primary ${isViewer?'opacity-50 cursor-not-allowed':''}`} 
            disabled={isViewer}
          >
            {form.id?'Update':'Add'} Bus
          </button>
          {form.id && (
            <button 
              onClick={()=>setForm({number:'',registrationStartDate:'',registrationExpiredDate:'',fcRenewalDate:'',busType:''})} 
              className="px-3 py-2 bg-slate-200 dark:bg-slate-700 rounded text-sm"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm bg-white dark:bg-slate-800 rounded-lg shadow">
          <thead>
            <tr className="border-b bg-slate-100 dark:bg-slate-700">
              <th className="text-left p-3">Bus Number</th>
              <th className="text-left p-3">Registration Start</th>
              <th className="text-left p-3">Registration Expired</th>
              <th className="text-left p-3">FC Renewal Date</th>
              <th className="text-left p-3">Bus Type</th>
              <th className="text-left p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {list.map(b=>(
              <tr key={b.id} className="border-b hover:bg-slate-50 dark:hover:bg-slate-700">
                <td className="p-3 font-medium">{b.number}</td>
                <td className="p-3">{formatDate(b.registrationStartDate)}</td>
                <td className="p-3">
                  <span className={isExpired(b.registrationExpiredDate) ? 'text-red-600 font-semibold' : ''}>
                    {formatDate(b.registrationExpiredDate)}
                    {isExpired(b.registrationExpiredDate) && <span className="ml-1">⚠️</span>}
                  </span>
                </td>
                <td className="p-3">
                  <span className={isExpired(b.fcRenewalDate) ? 'text-red-600 font-semibold' : ''}>
                    {formatDate(b.fcRenewalDate)}
                    {isExpired(b.fcRenewalDate) && <span className="ml-1">⚠️</span>}
                  </span>
                </td>
                <td className="p-3">
                  {b.busType && (
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      b.busType === 'AC' 
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' 
                        : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                    }`}>
                      {b.busType}
                    </span>
                  )}
                  {!b.busType && '—'}
                </td>
                <td className="p-3">
                  <div className="flex gap-2">
                    <button 
                      onClick={()=>!isViewer && edit(b)} 
                      className={`text-blue-600 hover:text-blue-700 ${isViewer?'opacity-40 cursor-not-allowed':''}`} 
                      disabled={isViewer}
                    >
                      Edit
                    </button>
                    <button 
                      onClick={()=>remove(b.id)} 
                      className={`text-red-600 hover:text-red-700 ${isViewer?'opacity-40 cursor-not-allowed':''}`} 
                      disabled={isViewer}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {list.length === 0 && (
          <div className="text-center text-slate-500 py-8">No buses found.</div>
        )}
      </div>
    </div>
  );
}

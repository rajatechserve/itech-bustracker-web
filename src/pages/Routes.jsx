
import React, { useEffect, useState, useMemo } from 'react';
import api, { getAuthUser } from '../services/api';
export default function RoutesPage(){
	const [list,setList]=useState([]);
	const [buses,setBuses]=useState([]);
	const [form,setForm]=useState({id:null,name:'',stops:'',busId:''});
	const [q,setQ]=useState('');
	const [busFilter,setBusFilter]=useState('');
	const user = getAuthUser();
	const isViewer = user?.role==='schoolUser' && user?.userRole==='viewer';
	const load=()=>api.get('/routes').then(r=>setList(r.data||[])).catch(()=>{});
	const loadBuses=()=>api.get('/buses').then(r=>setBuses(r.data||[])).catch(()=>{});
	useEffect(()=>{load();},[]);
	useEffect(()=>{loadBuses();},[]);
	const save=async()=>{ 
		if(isViewer) return; 
		try{ 
			const payload = { name: form.name, stops: form.stops.split(',').map(s=>s.trim()), busId: form.busId||null };
			if(form.id) {
				await api.put('/routes/'+form.id, payload);
			} else {
				await api.post('/routes', payload);
			}
			setForm({id:null,name:'',stops:'',busId:''}); 
			load(); 
		}catch(e){alert('Error: '+(e.response?.data?.error||e.message));} 
	};
	const edit=(r)=> setForm({id:r.id, name:r.name, stops:Array.isArray(r.stops)?r.stops.join(', '):r.stops, busId:r.busId||''});
	const remove=async(id)=>{ if(isViewer) return; if(!confirm('Delete?')) return; await api.delete('/routes/'+id); load(); };
	const busNumber=(id)=> buses.find(b=>b.id===id)?.number || '—';
	
	const filteredList = useMemo(() => {
		return list.filter(r => {
			const matchesSearch = !q.trim() || r.name.toLowerCase().includes(q.toLowerCase());
			const matchesBus = !busFilter || r.busId === busFilter;
			return matchesSearch && matchesBus;
		});
	}, [list, q, busFilter]);
	return (<div>
		<div className='flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4'>
			<h2 className='text-xl font-semibold'>Routes {isViewer && <span className='text-xs text-slate-500'>(read-only)</span>}</h2>
			<div className='flex flex-wrap gap-2 items-center'>
				<input placeholder='Search route name...' value={q} onChange={e=>setQ(e.target.value)} className='border p-2 rounded'/>
				<select value={busFilter} onChange={e=>setBusFilter(e.target.value)} className='border p-2 rounded min-w-[140px]'>
					<option value=''>All Buses</option>
					{buses.map(b=>(<option key={b.id} value={b.id}>{b.number}</option>))}
				</select>
			</div>
		</div>
		{isViewer && <div className='mb-4 p-3 bg-yellow-50 text-xs text-yellow-700 rounded'>Viewer role: modifications disabled.</div>}
		<div className='mb-4 flex flex-wrap gap-2'>
			<input placeholder='Route Name' value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className='border p-2 rounded' disabled={isViewer}/>
			<input placeholder='Stops (comma separated)' value={form.stops} onChange={e=>setForm({...form,stops:e.target.value})} className='border p-2 rounded min-w-[250px]' disabled={isViewer}/>
			<select value={form.busId} onChange={e=>setForm({...form,busId:e.target.value})} className='border p-2 rounded min-w-[140px]' disabled={isViewer}>
				<option value=''>Select Bus</option>
				{buses.map(b=>(<option key={b.id} value={b.id}>{b.number}</option>))}
			</select>
			<button onClick={save} className={`btn-primary ${isViewer?'opacity-50 cursor-not-allowed':''}`} disabled={isViewer}>{form.id?'Update':'Add'} Route</button>
			{form.id && (
				<button onClick={()=>setForm({id:null,name:'',stops:'',busId:''})} className='px-3 py-2 bg-slate-200 dark:bg-slate-700 rounded text-sm'>
					Cancel
				</button>
			)}
		</div>
		<div className='space-y-2'>
			{filteredList.map(r=>(<div key={r.id} className='p-3 bg-white rounded shadow flex justify-between items-center'>
				<div>
					<div className='font-medium'>{r.name}</div>
					<div className='text-sm text-slate-500'>
						Stops: {Array.isArray(r.stops)?r.stops.join(', '):r.stops}
						{r.busId && <span className='ml-3'>• Bus: {busNumber(r.busId)}</span>}
					</div>
				</div>
				<div className='flex gap-2'>
					<button onClick={()=>!isViewer && edit(r)} disabled={isViewer} className={`text-blue-600 hover:text-blue-700 ${isViewer?'opacity-40 cursor-not-allowed':''}`}>Edit</button>
					<button onClick={()=>remove(r.id)} disabled={isViewer} className={`text-red-600 hover:text-red-700 ${isViewer?'opacity-40 cursor-not-allowed':''}`}>Delete</button>
				</div>
			</div>))}
			{filteredList.length===0 && <div className='text-center text-sm text-slate-500 py-8'>No routes found.</div>}
		</div>
	</div>);
}

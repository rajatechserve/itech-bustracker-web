
import React, { useEffect, useState } from 'react';
import api, { getAuthUser } from '../services/api';
export default function Students(){
	const [list,setList]=useState([]);
	const [form,setForm]=useState({id:null,name:'',cls:'',parentId:'',busId:'',pickupLocation:''});
	const [buses,setBuses]=useState([]);
	const [parents,setParents]=useState([]);
	const [parentSearch,setParentSearch]=useState('');
	const [classes,setClasses]=useState([]);
	const [q,setQ]=useState('');
	const [classFilter,setClassFilter]=useState('');
	const [busFilter,setBusFilter]=useState('');
	const [showClassModal,setShowClassModal]=useState(false);
	const [classForm,setClassForm]=useState({id:null,name:'',active:true});
	const user = getAuthUser();
	const isViewer = user?.role==='schoolUser' && user?.userRole==='viewer';

	const load=()=>api.get('/students', { params: { search: q || undefined, class: classFilter || undefined, bus: busFilter || undefined } }).then(r=>setList(r.data||[])).catch(()=>{});
	const loadBuses=()=>api.get('/buses').then(r=>setBuses(r.data||[])).catch(()=>{});
	const loadParents=()=>api.get('/parents').then(r=>setParents(r.data||[])).catch(()=>{});
	const loadClasses=()=>api.get('/classes', { params: { includeInactive: 1 } }).then(r=>setClasses(r.data||[])).catch(()=>{});

	useEffect(()=>{ load(); },[q,classFilter,busFilter]);
	useEffect(()=>{ loadBuses(); if(user?.role!=='parent') loadParents(); loadClasses(); },[]);

	const save=async()=>{ if(isViewer) return; try{ const payload={ name: form.name, cls: form.cls, parentId: form.parentId||null, busId: form.busId||null, pickupLocation: form.pickupLocation||null }; if(!payload.parentId && user?.role==='parent') payload.parentId = user.id; if(form.id) await api.put('/students/'+form.id, payload); else await api.post('/students', payload); setForm({id:null,name:'',cls:'',parentId:'',busId:'',pickupLocation:''}); load(); }catch(e){ alert('Error: '+(e.response?.data?.error||e.message)); } };
	const edit=(s)=> setForm({id:s.id,name:s.name,cls:s.cls||'',parentId:s.parentId||'',busId:s.busId||'',pickupLocation:s.pickupLocation||''});
	const remove=async(id)=>{ if(isViewer) return; if(!confirm('Delete?')) return; await api.delete('/students/'+id); load(); };
	const busNumber=(id)=> buses.find(b=>b.id===id)?.number || id || '—';
	const parentName=(id)=> parents.find(p=>p.id===id)?.name || (id? id.slice(0,8)+'…':'—');
	const className=(cls)=> cls || '—';

	const openClassModal=()=>{ setClassForm({id:null,name:'',active:true}); setShowClassModal(true); };
	const editClass=(c)=>{ setClassForm({id:c.id,name:c.name,active: c.active===1}); setShowClassModal(true); };
	const saveClass=async()=>{
		if(isViewer) return; if(!classForm.name.trim()) { alert('Class name required'); return; }
		try{
			if(classForm.id) {
				await api.put('/classes/'+classForm.id, { name: classForm.name.trim(), active: classForm.active?1:0 });
			} else {
				await api.post('/classes', { name: classForm.name.trim(), active: classForm.active?1:0 });
			}
			setShowClassModal(false); loadClasses(); if(!form.cls) setForm(f=>({...f,cls: classForm.name.trim()}));
		}catch(e){ alert('Class error: '+(e.response?.data?.error||e.message)); }
	};
	const toggleClassActive=async(c)=>{ if(isViewer) return; try{ await api.put('/classes/'+c.id, { name: c.name, active: c.active===1?0:1 }); loadClasses(); }catch(e){ alert('Toggle error: '+(e.response?.data?.error||e.message)); } };

	return (
		<div>
			<div className='flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4'>
				<h2 className='text-xl font-semibold'>Students {isViewer && <span className="text-xs text-slate-500">(read-only)</span>}</h2>
				<div className='flex flex-wrap gap-2 items-center'>
				<input placeholder='Search' value={q} onChange={e=>setQ(e.target.value)} className='border p-2 rounded'/>
				<select value={classFilter} onChange={e=>setClassFilter(e.target.value)} className='border p-2 rounded min-w-[140px]'>
					<option value=''>All Classes</option>
					{classes.filter(c=>c.active===1).map(c=>(<option key={c.id} value={c.name}>{c.name}</option>))}
				</select>
				<select value={busFilter} onChange={e=>setBusFilter(e.target.value)} className='border p-2 rounded min-w-[140px]'>
					<option value=''>All Buses</option>
					{buses.map(b=>(<option key={b.id} value={b.id}>{b.number}</option>))}
				</select>
					{!isViewer && <button onClick={openClassModal} className='px-3 py-2 bg-blue-600 text-white rounded text-sm'>Add Class</button>}
				</div>
			</div>
			{isViewer && <div className='mb-4 p-3 bg-yellow-50 text-xs text-yellow-700 rounded'>Viewer role: modifications disabled.</div>}
			<div className='mb-4 flex flex-wrap gap-2'>
				<input placeholder='Name' value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className='border p-2 rounded' disabled={isViewer}/>
				<select value={form.cls} onChange={e=>setForm({...form,cls:e.target.value})} className='border p-2 rounded min-w-[140px]' disabled={isViewer}>
					<option value=''>Select Class</option>
					{classes.filter(c=>c.active===1).map(c=>(<option key={c.id} value={c.name}>{c.name}</option>))}
				</select>
				<select value={form.busId} onChange={e=>setForm({...form,busId:e.target.value})} className='border p-2 rounded min-w-[140px]' disabled={isViewer}>
					<option value=''>Select Bus</option>
					{buses.map(b=>(<option key={b.id} value={b.id}>{b.number}</option>))}
				</select>
				<input 
					placeholder='Pickup Location' 
					value={form.pickupLocation} 
					onChange={e=>setForm({...form,pickupLocation:e.target.value})} 
					className='border p-2 rounded min-w-[180px]' 
					disabled={isViewer}
				/>
				{user?.role!=='parent' && (
					<>
						<input
							placeholder='Search Parents...'
							value={parentSearch}
							onChange={e=>setParentSearch(e.target.value)}
							className='border p-2 rounded text-sm min-w-[160px]'
							disabled={isViewer}
						/>
						<select value={form.parentId} onChange={e=>setForm({...form,parentId:e.target.value})} className='border p-2 rounded min-w-[200px]' disabled={isViewer}>
							<option value=''>Select Parent</option>
							{parents
								.filter(p=> !parentSearch.trim() || p.name.toLowerCase().includes(parentSearch.toLowerCase()) || (p.phone||'').toLowerCase().includes(parentSearch.toLowerCase()))
								.map(p=>(
									<option key={p.id} value={p.id}>{p.name}{p.phone? ` (${p.phone})`:''}</option>
								))}
						</select>
					</>
				)}
				<button onClick={save} className={`btn-primary ${isViewer?'opacity-50 cursor-not-allowed':''}`} disabled={isViewer}>{form.id?'Update':'Add'}</button>
			</div>
			<div className='overflow-x-auto'>
				<table className='w-full text-sm bg-white dark:bg-slate-800 rounded-lg shadow'>
					<thead>
					<tr className='border-b bg-slate-100 dark:bg-slate-700'>
						<th className='text-left p-3'>Student Name</th>
						<th className='text-left p-3'>Class</th>
						<th className='text-left p-3'>Bus Number</th>
						<th className='text-left p-3'>Parent Name</th>
						<th className='text-left p-3'>Pickup Location</th>
						<th className='text-left p-3'>Actions</th>
					</tr>
				</thead>
				<tbody>
					{list.map(s=>(
						<tr key={s.id} className='border-b hover:bg-slate-50 dark:hover:bg-slate-700'>
							<td className='p-3 font-medium'>{s.name}</td>
							<td className='p-3'>{className(s.cls)}</td>
							<td className='p-3'>{busNumber(s.busId)}</td>
							<td className='p-3'>{parentName(s.parentId)}</td>
							<td className='p-3'>{s.pickupLocation || '—'}</td>
								<td className='p-3'>
									<div className='flex gap-2'>
										<button onClick={()=>!isViewer && edit(s)} className={`text-blue-600 hover:text-blue-700 ${isViewer?'opacity-40 cursor-not-allowed':''}`} disabled={isViewer}>Edit</button>
										<button onClick={()=>remove(s.id)} className={`text-red-600 hover:text-red-700 ${isViewer?'opacity-40 cursor-not-allowed':''}`} disabled={isViewer}>Delete</button>
									</div>
								</td>
							</tr>
						))}
					</tbody>
				</table>
				{list.length===0 && <div className='text-center text-sm text-slate-500 py-8'>No students found.</div>}
			</div>

			{showClassModal && (
				<div className='fixed inset-0 bg-black/40 flex items-center justify-center z-50' onClick={()=>setShowClassModal(false)}>
					<div className='bg-white dark:bg-slate-800 rounded-lg w-full max-w-md p-5 shadow-xl' onClick={e=>e.stopPropagation()}>
						<h3 className='text-lg font-semibold mb-4'>{classForm.id? 'Edit Class':'Add Class'}</h3>
						<div className='space-y-4'>
							<div>
								<label className='block text-sm font-medium mb-1'>Class Name</label>
								<input value={classForm.name} onChange={e=>setClassForm({...classForm,name:e.target.value})} className='border w-full p-2 rounded'/>
							</div>
							<div className='flex items-center gap-2'>
								<input type='checkbox' checked={classForm.active} onChange={e=>setClassForm({...classForm,active:e.target.checked})} id='class-active'/>
								<label htmlFor='class-active' className='text-sm'>Active</label>
							</div>
							<div className='text-xs text-slate-500 bg-blue-50 dark:bg-blue-900/30 p-2 rounded'>Classes are unique per school. Deactivating hides them from selection but keeps existing students linked.</div>
							<div className='flex gap-2'>
								<button onClick={saveClass} className='flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded'>Save</button>
								<button onClick={()=>setShowClassModal(false)} className='px-4 py-2 rounded bg-slate-200 hover:bg-slate-300'>Cancel</button>
							</div>
						</div>
						<div className='mt-6'>
							<h4 className='text-sm font-semibold mb-2'>Existing Classes</h4>
							<div className='max-h-48 overflow-y-auto divide-y'>
								{classes.map(c=>(
									<div key={c.id} className='py-2 flex items-center justify-between'>
										<div>
											<span className={`font-medium ${c.active===1? '':'line-through text-slate-400'}`}>{c.name}</span>
											{c.active!==1 && <span className='ml-2 text-xs text-red-500'>inactive</span>}
										</div>
										<div className='flex gap-2'>
											<button onClick={()=>editClass(c)} className='text-blue-600 text-xs'>Edit</button>
											<button onClick={()=>toggleClassActive(c)} className='text-xs text-purple-600'>{c.active===1?'Deactivate':'Activate'}</button>
										</div>
									</div>
								))}
								{classes.length===0 && <div className='py-4 text-xs text-slate-500'>No classes yet.</div>}
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

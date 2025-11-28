
import React, { useEffect, useState, useMemo } from 'react';
import api, { getAuthUser } from '../services/api';
export default function Assignments(){
	const [drivers,setDrivers]=useState([]);
	const [buses,setBuses]=useState([]);
	const [routes,setRoutes]=useState([]);
	const [list,setList]=useState([]);
	const [form,setForm]=useState({id:'',driverId:'',busId:'',startDate:'',endDate:'',trips:['morning','evening']});
	const [editMode,setEditMode]=useState(false);
	const [showAll,setShowAll]=useState(false);
	const [q,setQ]=useState('');
	const [startDateFilter,setStartDateFilter]=useState('');
	const [endDateFilter,setEndDateFilter]=useState('');
	const [busFilter,setBusFilter]=useState('');
	const [driverFilter,setDriverFilter]=useState('');
	const [routeFilter,setRouteFilter]=useState('');
	const user = getAuthUser();
	const isViewer = user?.role==='schoolUser' && user?.userRole==='viewer';
	
	const load=()=>api.get('/assignments', { 
		params: { 
			search: q || undefined,
			startDate: startDateFilter || undefined,
			endDate: endDateFilter || undefined,
			busId: busFilter || undefined,
			driverId: driverFilter || undefined,
			routeId: routeFilter || undefined
		} 
	}).then(r=>setList(r.data||[])).catch(()=>{});
	
	useEffect(()=>{ load(); },[q,startDateFilter,endDateFilter,busFilter,driverFilter,routeFilter]);
	useEffect(()=>{ 
		api.get('/drivers').then(r=>setDrivers(r.data||[])); 
		api.get('/buses').then(r=>setBuses(r.data||[])); 
		api.get('/routes').then(r=>setRoutes(r.data||[])); 
	},[]);
	
	const checkDuplicate = () => {
		if (!form.busId || !form.startDate || !form.endDate) return false;
		return list.some(a => {
			if (editMode && a.id === form.id) return false;
			if (a.busId !== form.busId) return false;
			// Check date overlap
			const formStart = new Date(form.startDate);
			const formEnd = new Date(form.endDate);
			const aStart = new Date(a.startDate);
			const aEnd = new Date(a.endDate);
			return (formStart <= aEnd && formEnd >= aStart);
		});
	};

	const save=async()=>{ 
		if(isViewer) return; 
		if(!form.driverId || !form.busId) { alert('Driver and Bus are required'); return; }
		if(!form.startDate || !form.endDate) { alert('Start date and End date are required'); return; }
		if(new Date(form.startDate) > new Date(form.endDate)) { alert('Start date must be before or equal to End date'); return; }
		
		if(checkDuplicate()) {
			alert('Duplicate assignment! This bus is already assigned for overlapping dates.');
			return;
		}
		
		// Derive routeId from the selected bus's route
		const selectedRoute = routes.find(r => r.busId === form.busId);
		const routeId = selectedRoute ? selectedRoute.id : null;
		const payload = {...form, routeId};
		
		try{ 
			if(editMode) {
				await api.put('/assignments/' + form.id, payload);
			} else {
				await api.post('/assignments', payload);
			}
			setForm({id:'',driverId:'',busId:'',startDate:'',endDate:'',trips:['morning','evening']}); 
			setEditMode(false);
			load(); 
		}catch(e){alert('Error: '+(e.response?.data?.error||e.message));} 
	};
	
	const edit = (a) => {
		if(isViewer) return;
		const trips = a.trips ? (typeof a.trips === 'string' ? JSON.parse(a.trips) : a.trips) : ['morning','evening'];
		setForm({id:a.id, driverId:a.driverId, busId:a.busId, startDate:a.startDate, endDate:a.endDate, trips});
		setEditMode(true);
		window.scrollTo({top: 0, behavior: 'smooth'});
	};
	
	const cancelEdit = () => {
		setForm({id:'',driverId:'',busId:'',startDate:'',endDate:'',trips:['morning','evening']});
		setEditMode(false);
	};
	
	const remove=async(id)=>{ if(isViewer) return; if(!confirm('Delete this assignment?')) return; await api.delete('/assignments/'+id); load(); };
	
	const getDriverName=(id)=> drivers.find(d=>d.id===id)?.name || id || '—';
	const getBusNumber=(id)=> buses.find(b=>b.id===id)?.number || id || '—';
	const getRouteName=(id)=> routes.find(r=>r.id===id)?.name || id || '—';
	const formatDate=(d)=> d ? new Date(d).toLocaleDateString('en-US', {year:'numeric',month:'short',day:'numeric'}) : '—';
	const formatDateRange=(start,end)=> {
		if(!start && !end) return '—';
		if(start && end) return `${formatDate(start)} - ${formatDate(end)}`;
		return formatDate(start || end);
	};
	
	// Filter and sort assignments
	const filteredList = useMemo(() => {
		let filtered = [...list];
		
		// Filter by present/future dates unless showAll is true
		if (!showAll) {
			const today = new Date();
			today.setHours(0, 0, 0, 0);
			filtered = filtered.filter(a => {
				const endDate = new Date(a.endDate);
				endDate.setHours(0, 0, 0, 0);
				return endDate >= today;
			});
		}
		
		// Sort by start date descending (latest first)
		filtered.sort((a, b) => {
			const dateA = new Date(a.startDate);
			const dateB = new Date(b.startDate);
			return dateB - dateA;
		});
		
		return filtered;
	}, [list, showAll]);
	
	return (
		<div>
			<div className='flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4'>
				<h2 className='text-xl font-semibold'>Assignments {isViewer && <span className='text-xs text-slate-500'>(read-only)</span>}</h2>
				<div className='flex flex-wrap gap-2 items-center'>
					<input placeholder='Search...' value={q} onChange={e=>setQ(e.target.value)} className='border p-2 rounded'/>
					<input type='date' value={startDateFilter} onChange={e=>setStartDateFilter(e.target.value)} className='border p-2 rounded text-sm' placeholder='Start Date'/>
					<input type='date' value={endDateFilter} onChange={e=>setEndDateFilter(e.target.value)} className='border p-2 rounded text-sm' placeholder='End Date'/>
					<select value={busFilter} onChange={e=>setBusFilter(e.target.value)} className='border p-2 rounded min-w-[120px]'>
						<option value=''>All Buses</option>
						{buses.map(b=>(<option key={b.id} value={b.id}>{b.number}</option>))}
					</select>
					<select value={driverFilter} onChange={e=>setDriverFilter(e.target.value)} className='border p-2 rounded min-w-[120px]'>
						<option value=''>All Drivers</option>
						{drivers.map(d=>(<option key={d.id} value={d.id}>{d.name}</option>))}
					</select>
					<select value={routeFilter} onChange={e=>setRouteFilter(e.target.value)} className='border p-2 rounded min-w-[120px]'>
						<option value=''>All Routes</option>
						{routes.map(r=>(<option key={r.id} value={r.id}>{r.name}</option>))}
					</select>
				</div>
			</div>
			{isViewer && <div className='mb-4 p-3 bg-yellow-50 text-xs text-yellow-700 rounded'>Viewer role: modifications disabled.</div>}
			<div className='mb-4 bg-slate-50 dark:bg-slate-800 p-4 rounded-lg'>
				<div className='flex items-center justify-between mb-3'>
					<h3 className='text-sm font-semibold'>{editMode ? 'Edit Assignment' : 'Create Assignment'}</h3>
					{editMode && (
						<button onClick={cancelEdit} className='text-xs text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'>
							Cancel Edit
						</button>
					)}
				</div>
				<div className='flex flex-wrap gap-2'>
					<input 
						type='date' 
						value={form.startDate} 
						onChange={e=>setForm({...form,startDate:e.target.value})} 
						className='border p-2 rounded' 
						placeholder='Start Date'
						disabled={isViewer}
						required
					/>
					<input 
						type='date' 
						value={form.endDate} 
						onChange={e=>setForm({...form,endDate:e.target.value})} 
						className='border p-2 rounded' 
						placeholder='End Date'
						disabled={isViewer}
						required
					/>
					<select value={form.driverId} onChange={e=>setForm({...form,driverId:e.target.value})} className='border p-2 rounded min-w-[150px]' disabled={isViewer}>
						<option value=''>Select Driver</option>
						{drivers.map(d=>(<option key={d.id} value={d.id}>{d.name}{d.phone ? ` (${d.phone})` : ''}</option>))}
					</select>
					<select value={form.busId} onChange={e=>setForm({...form,busId:e.target.value})} className='border p-2 rounded min-w-[200px]' disabled={isViewer}>
						<option value=''>Select Bus</option>
						{buses.map(b=>{
							const route = routes.find(r => r.busId === b.id);
							return (<option key={b.id} value={b.id}>{b.number}{route ? ` (${route.name})` : ''}</option>);
						})}
					</select>
					<div className='flex items-center gap-3 border p-2 rounded bg-white dark:bg-slate-700'>
						<span className='text-sm font-medium'>Trips:</span>
						<label className='flex items-center gap-1 cursor-pointer'>
							<input 
								type='checkbox' 
								checked={form.trips.includes('morning')} 
								onChange={e=>{
									if(e.target.checked) setForm({...form, trips:[...form.trips,'morning']});
									else setForm({...form, trips:form.trips.filter(t=>t!=='morning')});
								}}
								disabled={isViewer}
								className='rounded'
							/>
							<span className='text-sm'>Morning</span>
						</label>
						<label className='flex items-center gap-1 cursor-pointer'>
							<input 
								type='checkbox' 
								checked={form.trips.includes('evening')} 
								onChange={e=>{
									if(e.target.checked) setForm({...form, trips:[...form.trips,'evening']});
									else setForm({...form, trips:form.trips.filter(t=>t!=='evening')});
								}}
								disabled={isViewer}
								className='rounded'
							/>
							<span className='text-sm'>Evening</span>
						</label>
					</div>
					<button onClick={save} className={`btn-primary ${isViewer?'opacity-50 cursor-not-allowed':''}`} disabled={isViewer}>
						{editMode ? 'Update' : 'Assign'}
					</button>
				</div>
			</div>
			<div className='mb-4 flex items-center gap-2'>
				<label className='flex items-center gap-2 text-sm'>
					<input 
						type='checkbox' 
						checked={showAll} 
						onChange={e=>setShowAll(e.target.checked)}
						className='rounded'
					/>
					<span>Show all assignments (including past)</span>
				</label>
				<span className='text-xs text-slate-500'>
					{showAll ? `Showing all ${filteredList.length} assignments` : `Showing ${filteredList.length} current/future assignments`}
				</span>
			</div>
			<div className='space-y-2'>
				{filteredList.map(a=>(
					<div key={a.id} className='p-4 bg-white dark:bg-slate-800 rounded-lg shadow flex flex-col md:flex-row md:items-center md:justify-between gap-3'>
						<div className='flex-1'>
							<div className='flex flex-wrap gap-3 items-center'>
								<span className='text-sm font-semibold text-blue-600 dark:text-blue-400'>{formatDateRange(a.startDate,a.endDate)}</span>
								<span className='text-slate-400'>•</span>
								<span className='font-medium'>{getDriverName(a.driverId)}</span>
								<span className='text-slate-400'>→</span>
								<span className='font-medium'>{getBusNumber(a.busId)}</span>
								{a.routeId && (
									<>
										<span className='text-slate-400'>/</span>
										<span className='text-sm text-slate-600 dark:text-slate-400'>{getRouteName(a.routeId)}</span>
									</>
								)}
								{a.trips && (
									<>
										<span className='text-slate-400'>•</span>
										<span className='text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded'>
											{(() => {
												const trips = typeof a.trips === 'string' ? JSON.parse(a.trips) : a.trips;
												return trips.join(' + ').toUpperCase();
											})()}
										</span>
									</>
								)}
							</div>
						</div>
						<div className='flex gap-2'>
							<button 
								onClick={()=>edit(a)} 
								disabled={isViewer} 
								className={`text-blue-600 hover:text-blue-700 text-sm ${isViewer?'opacity-40 cursor-not-allowed':''}`}
							>
								Edit
							</button>
							<button 
								onClick={()=>remove(a.id)} 
								disabled={isViewer} 
								className={`text-red-600 hover:text-red-700 text-sm ${isViewer?'opacity-40 cursor-not-allowed':''}`}
							>
								Delete
							</button>
						</div>
					</div>
				))}
				{filteredList.length===0 && <div className='text-center text-sm text-slate-500 py-8'>{showAll ? 'No assignments found.' : 'No current or future assignments. Check "Show all" to view past assignments.'}</div>}
			</div>
		</div>
	);
}


import React, { useEffect, useState, useMemo } from 'react';
import api, { getAuthUser } from '../services/api';
export default function Attendance(){
	const [students,setStudents]=useState([]);
	const [list,setList]=useState([]);
	const [q,setQ]=useState('');
	const [dateFrom,setDateFrom]=useState('');
	const [dateTo,setDateTo]=useState('');
	const [studentFilter,setStudentFilter]=useState('');
	const [statusFilter,setStatusFilter]=useState('');
	const user = getAuthUser();
	const isViewer = user?.role==='schoolUser' && user?.userRole==='viewer';
	
	const load=()=>{
		const params = {};
		if(q) params.search = q;
		if(dateFrom) params.dateFrom = dateFrom;
		if(dateTo) params.dateTo = dateTo;
		if(studentFilter) params.studentId = studentFilter;
		if(statusFilter) params.status = statusFilter;
		api.get('/attendance', { params }).then(r=>setList(r.data||[])).catch(()=>{});
	};
	
	useEffect(()=>{ load(); },[q,dateFrom,dateTo,studentFilter,statusFilter]);
	useEffect(()=>{ api.get('/students').then(r=>setStudents(r.data||[])); },[]);
	
	const getStudentName=(id)=> students.find(s=>s.id===id)?.name || id || '—';
	
	// Calculate today's and this month's stats
	const stats = useMemo(() => {
		const today = new Date();
		const todayStr = today.toISOString().split('T')[0];
		const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
		
		const todayRecords = list.filter(r => {
			const recordDate = new Date(r.timestamp || 0).toISOString().split('T')[0];
			return recordDate === todayStr;
		});
		
		const thisMonthRecords = list.filter(r => {
			const recordDate = new Date(r.timestamp || 0);
			return recordDate >= firstDayOfMonth && recordDate <= today;
		});
		
		return {
			todayPresent: todayRecords.filter(r => r.status === 'present').length,
			todayAbsent: todayRecords.filter(r => r.status === 'absent').length,
			monthPresent: thisMonthRecords.filter(r => r.status === 'present').length,
			monthAbsent: thisMonthRecords.filter(r => r.status === 'absent').length
		};
	}, [list]);
	
	// Group attendance by date
	const groupedByDate = useMemo(() => {
		const grouped = {};
		list.forEach(r => {
			const date = new Date(r.timestamp||0).toLocaleDateString('en-US', {year:'numeric', month:'short', day:'numeric'});
			if(!grouped[date]) grouped[date] = [];
			grouped[date].push(r);
		});
		return grouped;
	}, [list]);
	
	const sortedDates = Object.keys(groupedByDate).sort((a,b) => new Date(b) - new Date(a));
	
	return (
		<div>
			<div className='flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4'>
				<h2 className='text-xl font-semibold'>Attendance Reports {isViewer && <span className='text-xs text-slate-500'>(read-only)</span>}</h2>
			</div>
			
			{/* Attendance Highlights */}
			<div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-4'>
				<div className='bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800'>
					<h3 className='text-sm font-semibold text-blue-800 dark:text-blue-300 mb-3'>📅 Today's Attendance</h3>
					<div className='flex gap-6'>
						<div>
							<div className='text-3xl font-bold text-green-600 dark:text-green-400'>{stats.todayPresent}</div>
							<div className='text-xs text-slate-600 dark:text-slate-400 mt-1'>Present</div>
						</div>
						<div>
							<div className='text-3xl font-bold text-red-600 dark:text-red-400'>{stats.todayAbsent}</div>
							<div className='text-xs text-slate-600 dark:text-slate-400 mt-1'>Absent</div>
						</div>
						<div className='ml-auto text-right'>
							<div className='text-2xl font-bold text-blue-600 dark:text-blue-400'>{stats.todayPresent + stats.todayAbsent}</div>
							<div className='text-xs text-slate-600 dark:text-slate-400 mt-1'>Total</div>
						</div>
					</div>
				</div>
				
				<div className='bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800'>
					<h3 className='text-sm font-semibold text-purple-800 dark:text-purple-300 mb-3'>📊 This Month's Attendance</h3>
					<div className='flex gap-6'>
						<div>
							<div className='text-3xl font-bold text-green-600 dark:text-green-400'>{stats.monthPresent}</div>
							<div className='text-xs text-slate-600 dark:text-slate-400 mt-1'>Present</div>
						</div>
						<div>
							<div className='text-3xl font-bold text-red-600 dark:text-red-400'>{stats.monthAbsent}</div>
							<div className='text-xs text-slate-600 dark:text-slate-400 mt-1'>Absent</div>
						</div>
						<div className='ml-auto text-right'>
							<div className='text-2xl font-bold text-purple-600 dark:text-purple-400'>{stats.monthPresent + stats.monthAbsent}</div>
							<div className='text-xs text-slate-600 dark:text-slate-400 mt-1'>Total</div>
						</div>
					</div>
				</div>
			</div>
			
			{isViewer && <div className='mb-4 p-3 bg-yellow-50 text-xs text-yellow-700 rounded'>Viewer role: modifications disabled.</div>}
			
			{/* Search and Filter Section */}
			<div className='mb-4 bg-slate-50 dark:bg-slate-800 p-4 rounded-lg'>
				<h3 className='text-sm font-semibold mb-3'>Search & Filter</h3>
				<div className='flex flex-wrap gap-2'>
					<input 
						placeholder='Search student name...' 
						value={q} 
						onChange={e=>setQ(e.target.value)} 
						className='border p-2 rounded min-w-[180px]'
					/>
					<input 
						type='date' 
						value={dateFrom} 
						onChange={e=>setDateFrom(e.target.value)} 
						className='border p-2 rounded text-sm'
						placeholder='From Date'
					/>
					<input 
						type='date' 
						value={dateTo} 
						onChange={e=>setDateTo(e.target.value)} 
						className='border p-2 rounded text-sm'
						placeholder='To Date'
					/>
					<select 
						value={studentFilter} 
						onChange={e=>setStudentFilter(e.target.value)} 
						className='border p-2 rounded min-w-[160px]'
					>
						<option value=''>All Students</option>
						{students.map(s=>(<option key={s.id} value={s.id}>{s.name}</option>))}
					</select>
					<select 
						value={statusFilter} 
						onChange={e=>setStatusFilter(e.target.value)} 
						className='border p-2 rounded min-w-[140px]'
					>
						<option value=''>All Status</option>
						<option value='present'>Present</option>
						<option value='absent'>Absent</option>
					</select>
					<button 
						onClick={()=>{ setQ(''); setDateFrom(''); setDateTo(''); setStudentFilter(''); setStatusFilter(''); }} 
						className='px-3 py-2 bg-slate-200 dark:bg-slate-700 rounded text-sm hover:bg-slate-300 dark:hover:bg-slate-600'
					>
						Clear Filters
					</button>
				</div>
			</div>
			
			{/* Attendance Records by Date */}
			<div className='space-y-4'>
				{sortedDates.length === 0 ? (
					<div className='text-center text-slate-500 py-8'>No attendance records found. Try adjusting your filters.</div>
				) : (
					sortedDates.map(date => (
						<div key={date} className='card p-4'>
							<h3 className='text-lg font-semibold mb-3 text-blue-600 dark:text-blue-400'>📅 {date}</h3>
							<div className='overflow-x-auto'>
								<table className='w-full text-sm'>
									<thead>
										<tr className='border-b bg-slate-100 dark:bg-slate-700'>
											<th className='text-left p-2'>Time</th>
											<th className='text-left p-2'>Student Name</th>
											<th className='text-left p-2'>Status</th>
										</tr>
									</thead>
									<tbody>
										{groupedByDate[date].map(r => (
											<tr key={r.id} className='border-b hover:bg-slate-50 dark:hover:bg-slate-700'>
												<td className='p-2'>{new Date(r.timestamp||0).toLocaleTimeString('en-US', {hour:'2-digit', minute:'2-digit'})}</td>
												<td className='p-2'>{getStudentName(r.studentId)}</td>
												<td className='p-2'>
													<span className={`px-2 py-1 rounded text-xs font-medium ${
														r.status === 'present' 
															? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' 
															: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
													}`}>
														{r.status.toUpperCase()}
													</span>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
							<div className='mt-2 text-xs text-slate-500'>
								Total: {groupedByDate[date].length} records • 
								Present: {groupedByDate[date].filter(r=>r.status==='present').length} • 
								Absent: {groupedByDate[date].filter(r=>r.status==='absent').length}
							</div>
						</div>
					))
				)}
			</div>
		</div>
	);
}

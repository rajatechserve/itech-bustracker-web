
import React, { useEffect, useRef, useState } from 'react';
import api, { getAuthUser } from '../services/api';
export default function Map({ embedded = false }){
  const mapRef = useRef(null);
  const markersRef = useRef(null);
  const [allBuses, setAllBuses] = useState([]);
  const [selectedBuses, setSelectedBuses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  
  const filteredBuses = allBuses.filter(b => 
    b.number.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const toggleBusSelection = (busId) => {
    setSelectedBuses(prev => 
      prev.includes(busId) 
        ? prev.filter(id => id !== busId)
        : [...prev, busId]
    );
  };
  
  const selectAllBuses = () => {
    setSelectedBuses(allBuses.map(b => b.id));
  };
  
  const clearAllSelections = () => {
    setSelectedBuses([]);
  };
  
  useEffect(()=>{
    const L = window.L;
    if(!L) return;
    mapRef.current = L.map('map').setView([11.0168,77.554],12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapRef.current);
    markersRef.current = L.markerClusterGroup();
    mapRef.current.addLayer(markersRef.current);
    return ()=>{ if(mapRef.current) mapRef.current.remove(); };
  },[]);
  
  useEffect(()=>{
    const load = async ()=>{
      try{
        const res = await api.get('/buses');
        const user = getAuthUser();
        let buses = res.data||[];
        
        // Filter buses based on user role
        if(user?.role==='driver'){
          // For drivers: show only buses assigned to them today
          try {
            const today = new Date().toISOString().split('T')[0];
            const assignmentsRes = await api.get('/assignments', {
              params: { driverId: user.id, startDate: today, endDate: today }
            });
            const todayAssignments = assignmentsRes.data?.data || [];
            const assignedBusIds = todayAssignments.map(a => a.busId);
            buses = buses.filter(b => assignedBusIds.includes(b.id));
          } catch(e) {
            console.log('Failed to load driver assignments', e);
          }
        } else if(user?.role==='parent'){
          // For parents: show only buses assigned to their children
          try {
            const studentsRes = await api.get(`/parents/${user.id}/students`);
            const students = studentsRes.data || [];
            const childrenBusIds = students.map(s => s.busId).filter(Boolean);
            buses = buses.filter(b => childrenBusIds.includes(b.id));
          } catch(e) {
            console.log('Failed to load parent students', e);
          }
        }
        
        setAllBuses(buses);
        
        // Update markers
        if(markersRef.current){
          markersRef.current.clearLayers();
          const L = window.L;
          const busIcon = L.icon({ iconUrl: 'https://cdn-icons-png.flaticon.com/512/61/61207.png', iconSize: [32,32] });
          const statusChip = (live) => {
            const running = live?.running;
            const dir = live?.direction ? (live.direction === 'evening' ? 'Evening' : 'Morning') : '';
            const time = live?.lastPingAt ? new Date(live.lastPingAt).toLocaleTimeString() : '';
            return `<span class="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${running ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}">${running ? '●' : '○'} ${dir} ${time}</span>`;
          };
          
          // Prefer live endpoint for freshest location and status
          const busPromises = buses.map(async (b)=>{
            try{
              const live = await api.get(`/public/bus/${b.id}/live`);
              return { bus: b, live: live.data };
            }catch(e){ return { bus: b, live: null }; }
          });
          const enriched = await Promise.all(busPromises);
          enriched.forEach(({ bus, live })=>{
            const loc = live?.location || bus.location;
            if(loc && (selectedBuses.length === 0 || selectedBuses.includes(bus.id))){
              const m = L.marker([loc.lat, loc.lng], { icon: busIcon })
                .bindPopup(`<div class="text-center">
                  <strong class="text-base">${bus.number}</strong><br/>
                  <span class="text-sm">${bus.driverName||'No driver assigned'}</span><br/>
                  ${statusChip(live)}<br/>
                  ${live?.tripId ? `<a href="/notifications?tripId=${live.tripId}" class="text-xs text-blue-600 underline">View Notifications</a>` : ''}
                </div>`);
              markersRef.current.addLayer(m);
            }
          });
        }
      }catch(e){ console.log('map load err', e.message); }
    };
    load();
    const t = setInterval(load, 5000);
    return ()=>{ clearInterval(t); };
  },[selectedBuses]);
  
  return (
    <div className={embedded ? '' : ''}>
      {!embedded && (
        <div className="mb-4 flex items-center gap-3 relative z-[1000]">
          <h2 className="text-xl font-semibold">Live Bus Tracking</h2>
          <div className="flex-1 relative">
            <input 
              type="text"
              placeholder="🔍 Search buses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => setShowDropdown(true)}
              className="w-full max-w-md border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 dark:bg-slate-700 dark:text-slate-100"
            />
            {showDropdown && filteredBuses.length > 0 && (
              <div className="absolute z-[1001] mt-1 w-full max-w-md bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                <div className="p-2 border-b border-slate-200 dark:border-slate-700 flex gap-2">
                  <button onClick={selectAllBuses} className="text-xs px-2 py-1 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded">Select All</button>
                  <button onClick={clearAllSelections} className="text-xs px-2 py-1 bg-red-50 hover:bg-red-100 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 rounded">Clear All</button>
                  <button onClick={() => setShowDropdown(false)} className="ml-auto text-xs px-2 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-400 rounded">Close</button>
                </div>
                {filteredBuses.map(bus => (
                  <label key={bus.id} className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer border-b border-slate-100 dark:border-slate-700 last:border-b-0">
                    <input 
                      type="checkbox"
                      checked={selectedBuses.includes(bus.id)}
                      onChange={() => toggleBusSelection(bus.id)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-slate-900 dark:text-slate-100">{bus.number}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{bus.driverName || 'No driver assigned'}</div>
                    </div>
                    {bus.location && (
                      <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-1 rounded-full">●  Active</span>
                    )}
                  </label>
                ))}
              </div>
            )}
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-400">
            {selectedBuses.length > 0 ? `${selectedBuses.length} bus${selectedBuses.length > 1 ? 'es' : ''} selected` : `Showing all ${allBuses.length} buses`}
          </div>
        </div>
      )}
      {embedded && (
        <div className="mb-2 text-sm font-medium text-slate-600 dark:text-slate-300">Live Bus Tracking (Today)</div>
      )}
      <div className={embedded ? 'card p-2' : 'card'}>
        <div id="map" style={{height: embedded ? '50vh':'70vh', borderRadius: '8px'}}></div>
      </div>
    </div>
  );
}

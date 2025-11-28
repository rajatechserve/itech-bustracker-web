import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { getAuthUser, SERVER_URL } from '../services/api';

export default function SchoolDashboard(){
  const [summary, setSummary] = useState({ buses: 0, drivers: 0, students: 0, parents: 0, routes: 0 });
  const [unassignedAlerts, setUnassignedAlerts] = useState({ buses: [], drivers: [], routes: [] });
  const [expiredBusAlerts, setExpiredBusAlerts] = useState({ registration: [], fc: [] });
  const [showAlerts, setShowAlerts] = useState(true);
  const [showExpiredAlerts, setShowExpiredAlerts] = useState(true);
  const user = getAuthUser();
  const navigate = useNavigate();

  useEffect(()=>{
    api.get('/dashboard/summary').then(r=> setSummary(r.data||{})).catch(()=>{});
    
    // Fetch unassigned resources
    const fetchUnassigned = async () => {
      try {
        const [busesRes, driversRes, routesRes, assignmentsRes] = await Promise.all([
          api.get('/buses'),
          api.get('/drivers'),
          api.get('/routes'),
          api.get('/assignments')
        ]);
        
        const buses = busesRes.data?.data || busesRes.data || [];
        const drivers = driversRes.data?.data || driversRes.data || [];
        const routes = routesRes.data?.data || routesRes.data || [];
        const assignments = assignmentsRes.data?.data || assignmentsRes.data || [];
        
        // Get today's date
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Check for expired buses
        const expiredRegistration = buses.filter(b => {
          if(!b.registrationExpiredDate) return false;
          const expiredDate = new Date(b.registrationExpiredDate);
          expiredDate.setHours(0, 0, 0, 0);
          return expiredDate < today;
        });
        
        const expiredFC = buses.filter(b => {
          if(!b.fcRenewalDate) return false;
          const fcDate = new Date(b.fcRenewalDate);
          fcDate.setHours(0, 0, 0, 0);
          return fcDate < today;
        });
        
        setExpiredBusAlerts({
          registration: expiredRegistration,
          fc: expiredFC
        });
        
        // Filter active assignments (current or future)
        const activeAssignments = assignments.filter(a => {
          const endDate = new Date(a.endDate);
          endDate.setHours(0, 0, 0, 0);
          return endDate >= today;
        });
        
        // Get assigned IDs
        const assignedBusIds = new Set(activeAssignments.map(a => a.busId));
        const assignedDriverIds = new Set(activeAssignments.map(a => a.driverId));
        const assignedRouteIds = new Set(activeAssignments.filter(a => a.routeId).map(a => a.routeId));
        
        // Find unassigned resources
        const unassignedBuses = buses.filter(b => !assignedBusIds.has(b.id));
        const unassignedDrivers = drivers.filter(d => !assignedDriverIds.has(d.id));
        const unassignedRoutes = routes.filter(r => !assignedRouteIds.has(r.id));
        
        setUnassignedAlerts({
          buses: unassignedBuses,
          drivers: unassignedDrivers,
          routes: unassignedRoutes
        });
      } catch (e) {
        console.error('Failed to fetch unassigned resources:', e);
      }
    };
    
    fetchUnassigned();
  },[]);

  const handleCardClick = (path, count) => {
    if (count > 0) {
      navigate(path);
    }
  };

  return (
    <div>
      {/* Expired Bus Alerts */}
      {showExpiredAlerts && (expiredBusAlerts.registration.length > 0 || expiredBusAlerts.fc.length > 0) && (
        <div className="mb-6 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">🚨 Bus Expiry Alerts</h3>
            <button onClick={() => setShowExpiredAlerts(false)} className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
              Dismiss
            </button>
          </div>
          
          {expiredBusAlerts.registration.length > 0 && (
            <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 dark:border-red-600 p-4 rounded">
              <div className="flex items-start gap-2">
                <span className="text-red-600 dark:text-red-400 font-semibold text-sm">🚫 {expiredBusAlerts.registration.length} Bus{expiredBusAlerts.registration.length > 1 ? 'es' : ''} - Registration Expired:</span>
                <div className="flex-1 text-xs text-slate-700 dark:text-slate-300">
                  {expiredBusAlerts.registration.slice(0, 10).map(b => `${b.number} (${new Date(b.registrationExpiredDate).toLocaleDateString()})`).join(', ')}
                  {expiredBusAlerts.registration.length > 10 && ` and ${expiredBusAlerts.registration.length - 10} more...`}
                </div>
              </div>
            </div>
          )}
          
          {expiredBusAlerts.fc.length > 0 && (
            <div className="bg-orange-50 dark:bg-orange-900/20 border-l-4 border-orange-500 dark:border-orange-600 p-4 rounded">
              <div className="flex items-start gap-2">
                <span className="text-orange-600 dark:text-orange-400 font-semibold text-sm">⚠️ {expiredBusAlerts.fc.length} Bus{expiredBusAlerts.fc.length > 1 ? 'es' : ''} - FC Renewal Overdue:</span>
                <div className="flex-1 text-xs text-slate-700 dark:text-slate-300">
                  {expiredBusAlerts.fc.slice(0, 10).map(b => `${b.number} (${new Date(b.fcRenewalDate).toLocaleDateString()})`).join(', ')}
                  {expiredBusAlerts.fc.length > 10 && ` and ${expiredBusAlerts.fc.length - 10} more...`}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Unassigned Resources Alerts */}
      {showAlerts && (unassignedAlerts.buses.length > 0 || unassignedAlerts.drivers.length > 0 || unassignedAlerts.routes.length > 0) && (
        <div className="mb-6 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">⚠️ Unassigned Resources Alert</h3>
            <button onClick={() => setShowAlerts(false)} className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
              Dismiss
            </button>
          </div>
          
          {unassignedAlerts.buses.length > 0 && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 dark:border-yellow-600 p-4 rounded">
              <div className="flex items-start gap-2">
                <span className="text-yellow-600 dark:text-yellow-400 font-semibold text-sm">🚌 {unassignedAlerts.buses.length} Unassigned Bus{unassignedAlerts.buses.length > 1 ? 'es' : ''}:</span>
                <div className="flex-1 text-xs text-slate-700 dark:text-slate-300">
                  {unassignedAlerts.buses.slice(0, 10).map(b => b.number).join(', ')}
                  {unassignedAlerts.buses.length > 10 && ` and ${unassignedAlerts.buses.length - 10} more...`}
                </div>
              </div>
            </div>
          )}
          
          {unassignedAlerts.drivers.length > 0 && (
            <div className="bg-orange-50 dark:bg-orange-900/20 border-l-4 border-orange-400 dark:border-orange-600 p-4 rounded">
              <div className="flex items-start gap-2">
                <span className="text-orange-600 dark:text-orange-400 font-semibold text-sm">👤 {unassignedAlerts.drivers.length} Unassigned Driver{unassignedAlerts.drivers.length > 1 ? 's' : ''}:</span>
                <div className="flex-1 text-xs text-slate-700 dark:text-slate-300">
                  {unassignedAlerts.drivers.slice(0, 10).map(d => d.name).join(', ')}
                  {unassignedAlerts.drivers.length > 10 && ` and ${unassignedAlerts.drivers.length - 10} more...`}
                </div>
              </div>
            </div>
          )}
          
          {unassignedAlerts.routes.length > 0 && (
            <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-400 dark:border-red-600 p-4 rounded">
              <div className="flex items-start gap-2">
                <span className="text-red-600 dark:text-red-400 font-semibold text-sm">🛣️ {unassignedAlerts.routes.length} Unassigned Route{unassignedAlerts.routes.length > 1 ? 's' : ''}:</span>
                <div className="flex-1 text-xs text-slate-700 dark:text-slate-300">
                  {unassignedAlerts.routes.slice(0, 10).map(r => r.name).join(', ')}
                  {unassignedAlerts.routes.length > 10 && ` and ${unassignedAlerts.routes.length - 10} more...`}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Banner image above statistics */}
      {user?.photo && (
        <div className="mb-8 flex justify-center w-full">
          <div className="rounded-2xl overflow-hidden shadow-lg w-full">
            <img
              src={user.photo.startsWith('/uploads') ? `${SERVER_URL}${user.photo}` : user.photo}
              alt="School Banner"
              className="w-full h-36 object-cover"
            />
          </div>
        </div>
      )}
      <h2 className="text-xl font-semibold mb-6 text-slate-800 dark:text-slate-200">School Statistics</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
        <div 
          onClick={() => handleCardClick('/buses', summary.buses)} 
          className={`flex flex-col items-center justify-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/20 rounded-2xl shadow-lg ${summary.buses > 0 ? 'cursor-pointer hover:shadow-xl hover:scale-105 transition-all duration-300' : 'opacity-50'}`}
        >
          <div className="w-24 h-24 rounded-full bg-white dark:bg-slate-700 shadow-md flex items-center justify-center mb-3">
            <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">{summary.buses || 0}</div>
          </div>
          <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">Buses</div>
        </div>
        <div 
          onClick={() => handleCardClick('/drivers', summary.drivers)} 
          className={`flex flex-col items-center justify-center p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/20 rounded-2xl shadow-lg ${summary.drivers > 0 ? 'cursor-pointer hover:shadow-xl hover:scale-105 transition-all duration-300' : 'opacity-50'}`}
        >
          <div className="w-24 h-24 rounded-full bg-white dark:bg-slate-700 shadow-md flex items-center justify-center mb-3">
            <div className="text-4xl font-bold text-green-600 dark:text-green-400">{summary.drivers || 0}</div>
          </div>
          <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">Drivers</div>
        </div>
        <div 
          onClick={() => handleCardClick('/students', summary.students)} 
          className={`flex flex-col items-center justify-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/20 rounded-2xl shadow-lg ${summary.students > 0 ? 'cursor-pointer hover:shadow-xl hover:scale-105 transition-all duration-300' : 'opacity-50'}`}
        >
          <div className="w-24 h-24 rounded-full bg-white dark:bg-slate-700 shadow-md flex items-center justify-center mb-3">
            <div className="text-4xl font-bold text-purple-600 dark:text-purple-400">{summary.students || 0}</div>
          </div>
          <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">Students</div>
        </div>
        <div 
          onClick={() => handleCardClick('/parents', summary.parents)} 
          className={`flex flex-col items-center justify-center p-6 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/20 rounded-2xl shadow-lg ${summary.parents > 0 ? 'cursor-pointer hover:shadow-xl hover:scale-105 transition-all duration-300' : 'opacity-50'}`}
        >
          <div className="w-24 h-24 rounded-full bg-white dark:bg-slate-700 shadow-md flex items-center justify-center mb-3">
            <div className="text-4xl font-bold text-amber-600 dark:text-amber-400">{summary.parents || 0}</div>
          </div>
          <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">Parents</div>
        </div>
        <div 
          onClick={() => handleCardClick('/routes', summary.routes)} 
          className={`flex flex-col items-center justify-center p-6 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/20 rounded-2xl shadow-lg ${summary.routes > 0 ? 'cursor-pointer hover:shadow-xl hover:scale-105 transition-all duration-300' : 'opacity-50'}`}
        >
          <div className="w-24 h-24 rounded-full bg-white dark:bg-slate-700 shadow-md flex items-center justify-center mb-3">
            <div className="text-4xl font-bold text-orange-600 dark:text-orange-400">{summary.routes || 0}</div>
          </div>
          <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">Routes</div>
        </div>
      </div>
      {/* Banner image below statistics removed as per request */}
    </div>
  );
}

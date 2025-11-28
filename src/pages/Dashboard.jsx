
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { getAuthUser, SERVER_URL } from '../services/api';

export default function Dashboard(){
  const [summary, setSummary] = useState({ buses: 0, drivers: 0, students: 0, parents: 0, routes: 0, schools: 0 });
  const [schools, setSchools] = useState([]);
  const [unassignedAlerts, setUnassignedAlerts] = useState({ buses: [], drivers: [], routes: [] });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(10);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showAlerts, setShowAlerts] = useState(true);
  const [showContractModal, setShowContractModal] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [contractForm, setContractForm] = useState({
    contractStartDate: '',
    contractEndDate: '',
    contractStatus: 'active',
    isActive: true
  });
  const user = getAuthUser();
  const isAdmin = user?.role === 'admin';
  const isSchool = user?.role === 'school';
  const isSchoolUser = user?.role === 'schoolUser';
  const isDriver = user?.role === 'driver';
  const isParent = user?.role === 'parent';
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect non-admin roles to school dashboard for consistent view
    if(!isAdmin){
      navigate('/school-dashboard');
      return;
    }
    api.get('/dashboard/summary').then(r => setSummary(r.data || {})).catch(() => { });
    
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
  }, [isAdmin, navigate]);

  useEffect(() => {
    if (isAdmin) {
      api.get('/schools', { params: { search, page, limit } }).then(r => {
        setSchools(r.data?.data || []);
        setTotal(r.data?.total || 0);
      }).catch(() => { });
    }
  }, [search, page, isAdmin, limit, refreshKey]);

  const viewSchoolDashboard = async (schoolId) => {
    try {
      const r = await api.get(`/schools/${schoolId}/dashboard`);
      navigate('/school-details', { state: r.data });
    } catch (e) {
      alert('Error loading school dashboard');
    }
  };

  const openContractModal = (school) => {
    setSelectedSchool(school);
    setContractForm({
      contractStartDate: school.contractStartDate || '',
      contractEndDate: school.contractEndDate || '',
      contractStatus: school.contractStatus || 'active',
      isActive: school.isActive !== 0
    });
    setShowContractModal(true);
  };

  const saveContract = async () => {
    if (!selectedSchool) return;
    try {
      await api.post(`/schools/${selectedSchool.id}/contract`, contractForm);
      alert('Contract updated successfully');
      setShowContractModal(false);
      setRefreshKey(k => k + 1);
    } catch (e) {
      alert('Error updating contract: ' + (e.response?.data?.error || e.message));
    }
  };

  const toggleSchoolStatus = async (schoolId, currentStatus) => {
    if (!confirm(`Are you sure you want to ${currentStatus ? 'deactivate' : 'activate'} this school?`)) return;
    try {
      await api.post(`/schools/${schoolId}/contract`, { isActive: !currentStatus });
      setRefreshKey(k => k + 1);
    } catch (e) {
      alert('Error updating status: ' + (e.response?.data?.error || e.message));
    }
  };

  const getContractStatusBadge = (school) => {
    const isActive = school.isActive !== 0;
    const endDate = school.contractEndDate;
    const today = new Date().toISOString().split('T')[0];
    
    if (!isActive) {
      return <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full font-medium">Deactivated</span>;
    }
    
    if (!endDate) {
      return <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">Active</span>;
    }
    
    const daysRemaining = Math.ceil((new Date(endDate) - new Date(today)) / (1000 * 60 * 60 * 24));
    
    if (daysRemaining < 0) {
      return <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full font-medium">Expired</span>;
    } else if (daysRemaining <= 30) {
      return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full font-medium">Expiring Soon ({daysRemaining}d)</span>;
    } else {
      return <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">Active ({daysRemaining}d)</span>;
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      
      {/* Unassigned Resources Alerts */}
      {showAlerts && (unassignedAlerts.buses.length > 0 || unassignedAlerts.drivers.length > 0 || unassignedAlerts.routes.length > 0) && (
        <div className="mb-6 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">⚠️ Unassigned Resources</h3>
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
      
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        {isAdmin && (
          <div className="card p-6 bg-red-50">
            <div className="text-4xl font-bold text-red-600">{summary.schools}</div>
            <div className="text-sm text-slate-600">Schools</div>
          </div>
        )}
        <div className="card p-6 bg-blue-50">
          <div className="text-4xl font-bold text-blue-600">{summary.buses}</div>
          <div className="text-sm text-slate-600">Buses</div>
        </div>
        <div className="card p-6 bg-green-50">
          <div className="text-4xl font-bold text-green-600">{summary.drivers}</div>
          <div className="text-sm text-slate-600">Drivers</div>
        </div>
        <div className="card p-6 bg-purple-50">
          <div className="text-4xl font-bold text-purple-600">{summary.parents}</div>
          <div className="text-sm text-slate-600">Parents</div>
        </div>
        <div className="card p-6 bg-orange-50">
          <div className="text-4xl font-bold text-orange-600">{summary.routes}</div>
          <div className="text-sm text-slate-600">Routes</div>
        </div>
      </div>

      {!isAdmin && (isSchool || isSchoolUser) && (
        <div className="mb-6 text-sm text-slate-600">
          Showing data for your school only.
        </div>
      )}
      {!isAdmin && (isDriver || isParent) && (
        <div className="mb-6 text-sm text-slate-600">
          Showing data scoped to your assigned school.
        </div>
      )}

      {isAdmin && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Schools</h2>
            <div className="flex gap-2 items-center">
              <input placeholder="Search schools..." value={search} onChange={e => setSearch(e.target.value)} className="border p-2 rounded w-64 dark:bg-slate-700 dark:border-slate-600" />
              <button onClick={() => setRefreshKey(k => k + 1)} className="px-3 py-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded text-sm font-medium transition-colors" title="Refresh schools list">
                🔄 Refresh
              </button>
            </div>
          </div>
          <div className="space-y-4 mb-4">
            {schools.map(s => (
              <div key={s.id} className="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                {/* Banner Image */}
                {s.photo && (
                  <div className="relative h-32 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-slate-700 dark:to-slate-800">
                    <img 
                      src={s.photo.startsWith('/uploads') ? `${SERVER_URL}${s.photo}` : s.photo} 
                      alt="School Banner" 
                      className="w-full h-full object-cover opacity-80" 
                    />
                  </div>
                )}
                
                <div className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Logo */}
                    <div className="flex-shrink-0">
                      {s.logo ? (
                        <img 
                          src={s.logo.startsWith('/uploads') ? `${SERVER_URL}${s.logo}` : s.logo} 
                          alt="School Logo" 
                          className="h-16 w-16 rounded-lg object-contain border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 p-1" 
                        />
                      ) : (
                        <div className="h-16 w-16 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                          <span className="text-2xl">🏫</span>
                        </div>
                      )}
                    </div>
                    
                    {/* School Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">{s.name}</h3>
                      
                      {/* Address */}
                      {s.address && (
                        <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                          📍 {s.address}{s.city || s.state ? `, ${[s.city, s.state].filter(Boolean).join(', ')}` : ''}
                        </div>
                      )}
                      
                      {/* County */}
                      {s.county && (
                        <div className="text-xs text-slate-500 dark:text-slate-500">
                          County: {s.county}
                        </div>
                      )}
                      
                      {/* Contact Info */}
                      <div className="flex flex-wrap gap-3 mt-2 text-sm">
                        {s.phone && (
                          <div className="text-slate-600 dark:text-slate-400">
                            📞 {s.phone}
                          </div>
                        )}
                        {s.mobile && (
                          <div className="text-slate-600 dark:text-slate-400">
                            📱 {s.mobile}
                          </div>
                        )}
                      </div>
                      
                      {/* Username */}
                      <div className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                        Username: <span className="font-mono">{s.username || '—'}</span>
                      </div>
                    </div>
                    
                    {/* Contract Status & Actions */}
                    <div className="flex-shrink-0 flex flex-col gap-2 items-end">
                      {getContractStatusBadge(s)}
                      
                      {/* Contract Info */}
                      {s.contractEndDate && (
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          Expires: {new Date(s.contractEndDate).toLocaleDateString()}
                        </div>
                      )}
                      
                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <button 
                          onClick={(e) => { e.stopPropagation(); openContractModal(s); }}
                          className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/30 dark:hover:bg-purple-900/50 text-purple-600 dark:text-purple-400 rounded text-xs font-medium transition-colors"
                          title="Manage Contract"
                        >
                          📅 Contract
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); toggleSchoolStatus(s.id, s.isActive !== 0); }}
                          className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                            s.isActive !== 0 
                              ? 'bg-red-50 hover:bg-red-100 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400' 
                              : 'bg-green-50 hover:bg-green-100 dark:bg-green-900/30 dark:hover:bg-green-900/50 text-green-600 dark:text-green-400'
                          }`}
                          title={s.isActive !== 0 ? 'Deactivate Access' : 'Activate Access'}
                        >
                          {s.isActive !== 0 ? '🚫 Deactivate' : '✅ Activate'}
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); viewSchoolDashboard(s.id); }}
                          className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded text-xs font-medium transition-colors"
                        >
                          View Details →
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {schools.length === 0 && (
              <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                No schools found.
              </div>
            )}
          </div>
          
          {/* Contract Management Modal */}
          {showContractModal && selectedSchool && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowContractModal(false)}>
              <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-slate-100">
                  Contract Management - {selectedSchool.name}
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Contract Start Date
                    </label>
                    <input 
                      type="date" 
                      value={contractForm.contractStartDate}
                      onChange={(e) => setContractForm({...contractForm, contractStartDate: e.target.value})}
                      className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 dark:bg-slate-700 dark:text-slate-100"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Contract End Date
                    </label>
                    <input 
                      type="date" 
                      value={contractForm.contractEndDate}
                      onChange={(e) => setContractForm({...contractForm, contractEndDate: e.target.value})}
                      className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 dark:bg-slate-700 dark:text-slate-100"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Contract Status
                    </label>
                    <select 
                      value={contractForm.contractStatus}
                      onChange={(e) => setContractForm({...contractForm, contractStatus: e.target.value})}
                      className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 dark:bg-slate-700 dark:text-slate-100"
                    >
                      <option value="active">Active</option>
                      <option value="expired">Expired</option>
                      <option value="pending">Pending</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center">
                    <input 
                      type="checkbox" 
                      id="isActive"
                      checked={contractForm.isActive}
                      onChange={(e) => setContractForm({...contractForm, isActive: e.target.checked})}
                      className="mr-2"
                    />
                    <label htmlFor="isActive" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Allow School Access
                    </label>
                  </div>
                  
                  <div className="text-xs text-slate-500 dark:text-slate-400 bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
                    <strong>Note:</strong> If contract expires or access is disabled, the school admin will not be able to log in.
                  </div>
                </div>
                
                <div className="flex gap-3 mt-6">
                  <button 
                    onClick={saveContract}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Save Contract
                  </button>
                  <button 
                    onClick={() => setShowContractModal(false)}
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
          {totalPages > 1 && (
            <div className="flex gap-2 justify-center">
              <button disabled={page === 1} onClick={() => setPage(page - 1)} className="px-3 py-1 border rounded disabled:opacity-50 dark:border-slate-600">Previous</button>
              <span className="px-3 py-1 dark:text-slate-300">Page {page} of {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="px-3 py-1 border rounded disabled:opacity-50 dark:border-slate-600">Next</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

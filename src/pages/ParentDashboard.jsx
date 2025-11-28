import React, { useState, useEffect, useMemo } from 'react';
import api, { getAuthUser } from '../services/api';
import Map from './Map';

export default function ParentDashboard() {
  const [parent, setParent] = useState(null);
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [routes, setRoutes] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [assignmentsSearch, setAssignmentsSearch] = useState('');
  const [drivers, setDrivers] = useState([]);
  const [activeTab, setActiveTab] = useState('children');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const user = getAuthUser();
      console.log('Logged in user:', user);
      
      // Get parent details
      const parentRes = await api.get(`/parents/${user.id}`);
      console.log('Parent response:', parentRes.data);
      setParent(parentRes.data);

      // Get students for this parent
      const studentsRes = await api.get(`/parents/${user.id}/students`);
      console.log('Students response:', studentsRes.data);
      setStudents(studentsRes.data || []);

      // Get attendance for the present month only
      const today = new Date();
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      
      const startDate = firstDayOfMonth.toISOString().split('T')[0];
      const endDate = today.toISOString().split('T')[0];
      
      const attendanceRes = await api.get('/attendance', {
        params: { startDate, endDate }
      });
      
      // Filter attendance for this parent's students
      const studentIds = studentsRes.data?.map(s => s.id) || [];
      const allAttendance = Array.isArray(attendanceRes.data) ? attendanceRes.data : (attendanceRes.data?.data || []);
      const filteredAttendance = allAttendance.filter(a => studentIds.includes(a.studentId));
      setAttendance(filteredAttendance);

      // Get all buses, routes, and drivers for reference
      const busesRes = await api.get('/buses');
      setBuses(Array.isArray(busesRes.data) ? busesRes.data : (busesRes.data?.data || []));
      const routesRes = await api.get('/routes');
      setRoutes(Array.isArray(routesRes.data) ? routesRes.data : (routesRes.data?.data || []));
      const driversRes = await api.get('/drivers');
      setDrivers(Array.isArray(driversRes.data) ? driversRes.data : (driversRes.data?.data || []));

      // Load assignments for this school (will be auto-filtered by schoolId on backend)
      const assignmentsRes = await api.get('/assignments');
      const allAssignments = Array.isArray(assignmentsRes.data) ? assignmentsRes.data : (assignmentsRes.data?.data || []);
      console.log('All assignments:', allAssignments);
      // Keep only those assignments whose busId matches a child's busId
      const childBusIds = (studentsRes.data || []).map(s => s.busId).filter(Boolean);
      console.log('Child bus IDs:', childBusIds);
      const relevant = allAssignments.filter(a => a.busId && childBusIds.includes(a.busId));
      console.log('Relevant assignments:', relevant);
      setAssignments(relevant);
    } catch (e) {
      console.error('Failed to load data:', e);
    } finally {
      setLoading(false);
    }
  };

  const getBusName = (busId) => {
    const bus = buses.find(b => b.id === busId);
    return bus?.number || 'Not Assigned';
  };

  const getRouteName = (routeId) => {
    const r = routes.find(rt => rt.id === routeId);
    return r?.name || '—';
  };

  const getDriverInfo = (driverId) => {
    const driver = drivers.find(d => d.id === driverId);
    if (!driver) return { name: '—', phone: '—' };
    return { name: driver.name || '—', phone: driver.phone || '—' };
  };

  const getStudentAttendance = (studentId) => {
    const studentAttendance = attendance.filter(a => a.studentId === studentId);
    const present = studentAttendance.filter(a => a.status === 'present').length;
    const absent = studentAttendance.filter(a => a.status === 'absent').length;
    return { present, absent, total: studentAttendance.length };
  };

  const formatDateRange = (start, end) => {
    if(!start && !end) return '—';
    if(start && end) return `${start} - ${end}`;
    return start || end || '—';
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '—';
    const d = new Date(timestamp);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const filteredAssignments = useMemo(() => {
    if(!assignmentsSearch.trim()) return assignments;
    const term = assignmentsSearch.toLowerCase();
    return assignments.filter(a => {
      const busName = getBusName(a.busId).toLowerCase();
      const routeName = getRouteName(a.routeId).toLowerCase();
      const start = (a.startDate||'').toLowerCase();
      const end = (a.endDate||'').toLowerCase();
      return busName.includes(term) || routeName.includes(term) || start.includes(term) || end.includes(term);
    });
  }, [assignments, assignmentsSearch, buses, routes]);

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        {parent && (
          <div className="card p-4 mb-4">
            <h2 className="text-xl font-semibold mb-2">Welcome, {parent.name}</h2>
            <p className="text-slate-600"><strong>Phone:</strong> {parent.phone}</p>
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="mb-4 flex gap-2 border-b overflow-x-auto">
        <button
          onClick={() => setActiveTab('children')}
          className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${
            activeTab === 'children'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-slate-600 hover:text-slate-800'
          }`}
        >
          👨‍👩‍👧‍👦 Your Children
        </button>
        <button
          onClick={() => setActiveTab('tracking')}
          className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${
            activeTab === 'tracking'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-slate-600 hover:text-slate-800'
          }`}
        >
          🚍 Live Bus Tracking (Today)
        </button>
        <button
          onClick={() => setActiveTab('assignments')}
          className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${
            activeTab === 'assignments'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-slate-600 hover:text-slate-800'
          }`}
        >
          📋 Bus Assignments
        </button>
        <button
          onClick={() => setActiveTab('attendance')}
          className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${
            activeTab === 'attendance'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-slate-600 hover:text-slate-800'
          }`}
        >
          📊 Recent Attendance History
        </button>
      </div>

      {/* Tab 1: Your Children */}
      {activeTab === 'children' && (
        <div className="card p-4 mb-6">
          <h2 className="text-xl font-semibold mb-4">Your Children</h2>
          {students.length === 0 ? (
            <p className="text-slate-500">No students found.</p>
          ) : (
            <div className="space-y-4">
              {students.map((student) => {
                const { present, absent, total } = getStudentAttendance(student.id);
                return (
                  <div key={student.id} className="border rounded p-4 bg-slate-50">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{student.name}</h3>
                        <p className="text-sm text-slate-600">Class: {student.cls || 'Not Assigned'}</p>
                        <p className="text-sm text-slate-600">Bus: {getBusName(student.busId)}</p>
                      </div>
                      <div className="border-l pl-4">
                        <p className="text-xs text-slate-500 mb-1">Attendance (This Month)</p>
                        <div className="flex gap-4">
                          <div>
                            <p className="text-2xl font-bold text-green-600">{present}</p>
                            <p className="text-xs text-slate-500">Present</p>
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-red-600">{absent}</p>
                            <p className="text-xs text-slate-500">Absent</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Live Bus Tracking (Today) */}
      {activeTab === 'tracking' && (
        <div className="card p-4 mb-6">
          <h2 className="text-xl font-semibold mb-4">Live Bus Tracking (Today)</h2>
          <Map embedded />
        </div>
      )}

      {/* Tab 3: Bus Assignments */}
      {activeTab === 'assignments' && (
        <div className="card p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <h2 className="text-xl font-semibold">Bus Assignments</h2>
            <input
              type="text"
              value={assignmentsSearch}
              onChange={e=>setAssignmentsSearch(e.target.value)}
              placeholder="Search bus, route or date..."
              className="border rounded px-3 py-2 w-full md:w-64"
            />
          </div>
          {filteredAssignments.length === 0 ? (
            <p className="text-slate-500">No assignments for your children's buses.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-slate-100">
                    <th className="text-left p-2">Start Date</th>
                    <th className="text-left p-2">End Date</th>
                    <th className="text-left p-2">Bus</th>
                    <th className="text-left p-2">Route</th>
                    <th className="text-left p-2">Driver Name</th>
                    <th className="text-left p-2">Driver Mobile</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAssignments.map(a => {
                    const driverInfo = getDriverInfo(a.driverId);
                    return (
                      <tr key={a.id} className="border-b hover:bg-slate-50">
                        <td className="p-2">{a.startDate || '—'}</td>
                        <td className="p-2">{a.endDate || '—'}</td>
                        <td className="p-2">{getBusName(a.busId)}</td>
                        <td className="p-2">{getRouteName(a.routeId)}</td>
                        <td className="p-2">{driverInfo.name}</td>
                        <td className="p-2">{driverInfo.phone}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Recent Attendance History (Present Month Only) */}
      {activeTab === 'attendance' && (
        <div className="card p-4">
          <h2 className="text-xl font-semibold mb-4">Recent Attendance History (This Month)</h2>
          {attendance.length === 0 ? (
            <p className="text-slate-500">No attendance records found for this month.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-slate-100">
                    <th className="text-left p-2">Date</th>
                    <th className="text-left p-2">Student</th>
                    <th className="text-left p-2">Bus</th>
                    <th className="text-left p-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {attendance.map((a) => {
                    const student = students.find(s => s.id === a.studentId);
                    return (
                      <tr key={a.id} className="border-b hover:bg-slate-50">
                        <td className="p-2">{formatDate(a.timestamp)}</td>
                        <td className="p-2">{student?.name || 'Unknown'}</td>
                        <td className="p-2">{getBusName(a.busId)}</td>
                        <td className="p-2">
                          <span className={`px-2 py-1 rounded text-xs ${
                            a.status === 'present' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {a.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

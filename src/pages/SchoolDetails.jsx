import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function SchoolDetails() {
  const location = useLocation();
  const navigate = useNavigate();
  const data = location.state || {};
  const school = data.school || {};
  const stats = data.stats || {};

  return (
    <div>
      <button onClick={() => navigate('/')} className="mb-4 text-blue-600 text-sm">← Back to Dashboard</button>
      
      <div className="mb-6 p-6 bg-white rounded shadow flex items-start gap-4">
        {school.logo && <img src={school.logo} alt="Logo" className="h-20 w-20 object-contain" />}
        <div>
          <h1 className="text-2xl font-bold">{school.name}</h1>
          <div className="text-sm text-slate-600">{[school.address, school.city, school.state].filter(Boolean).join(', ')}</div>
        </div>
      </div>

      {school.photo && (
        <div className="mb-6">
          <img src={school.photo} alt="School" className="w-full h-48 object-cover rounded shadow" />
        </div>
      )}

      <h2 className="text-xl font-semibold mb-4">School Statistics</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="card p-6 bg-blue-50">
          <div className="text-4xl font-bold text-blue-600">{stats.buses || 0}</div>
          <div className="text-sm text-slate-600">Buses</div>
        </div>
        <div className="card p-6 bg-green-50">
          <div className="text-4xl font-bold text-green-600">{stats.drivers || 0}</div>
          <div className="text-sm text-slate-600">Drivers</div>
        </div>
        <div className="card p-6 bg-purple-50">
          <div className="text-4xl font-bold text-purple-600">{stats.students || 0}</div>
          <div className="text-sm text-slate-600">Students</div>
        </div>
        <div className="card p-6 bg-yellow-50">
          <div className="text-4xl font-bold text-yellow-600">{stats.parents || 0}</div>
          <div className="text-sm text-slate-600">Parents</div>
        </div>
        <div className="card p-6 bg-orange-50">
          <div className="text-4xl font-bold text-orange-600">{stats.routes || 0}</div>
          <div className="text-sm text-slate-600">Routes</div>
        </div>
      </div>
    </div>
  );
}

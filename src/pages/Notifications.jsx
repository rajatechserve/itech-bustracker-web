import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useLocation } from 'react-router-dom';

export default function Notifications() {
  const [trips, setTrips] = useState([]);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const location = useLocation();

  useEffect(() => {
    loadTrips();
  }, []);

  const loadTrips = async () => {
    try {
      const res = await api.get('/trips');
      const list = res.data || [];
      setTrips(list);
      // Auto-select trip if tripId present in query
      try {
        const params = new URLSearchParams(location.search);
        const tripId = params.get('tripId');
        if (tripId) {
          const t = list.find((x) => x.id === tripId);
          if (t) {
            setSelectedTrip(t);
            loadEvents(t.id);
          }
        }
      } catch {}
    } catch (e) {
      console.warn('Failed to load trips', e);
    }
  };

  const loadEvents = async (tripId) => {
    try {
      setLoading(true);
      const res = await api.get(`/trips/${tripId}/events`);
      setEvents(res.data || []);
    } catch (e) {
      console.warn('Failed to load events', e);
    } finally { setLoading(false); }
  };

  const onSelectTrip = (t) => {
    setSelectedTrip(t);
    loadEvents(t.id);
  };

  const badge = (type) => {
    const common = 'inline-block px-2 py-1 rounded text-xs font-semibold';
    switch(type){
      case 'trip_started': return <span className={`${common} bg-green-600 text-white`}>Started</span>;
      case 'trip_stopped': return <span className={`${common} bg-red-600 text-white`}>Stopped</span>;
      case 'arrive_stop': return <span className={`${common} bg-blue-600 text-white`}>Arrived</span>;
      case 'drop_student': return <span className={`${common} bg-purple-600 text-white`}>Dropped</span>;
      case 'approach_stop': return <span className={`${common} bg-yellow-600 text-white`}>Approaching</span>;
      default: return <span className={`${common} bg-gray-400 text-white`}>{type}</span>;
    }
  };

  return (
    <div className="p-4">
      <div className="mb-3 flex items-center gap-3">
        <h1 className="text-xl font-bold">Notifications Log</h1>
        {selectedTrip && (
          <span className="inline-flex items-center gap-2 text-sm px-2 py-1 rounded-full bg-slate-100 text-slate-700">
            <span>Bus:</span>
            <code className="px-1">{selectedTrip.busId}</code>
            <span>Direction:</span>
            <code className="px-1">{selectedTrip.direction}</code>
            <span>Status:</span>
            <code className="px-1">{selectedTrip.status}</code>
          </span>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border rounded p-3">
          <h2 className="font-semibold mb-2">Trips</h2>
          <div className="space-y-2 max-h-80 overflow-auto">
            {trips.map(t => (
              <div key={t.id} className={`p-2 border rounded cursor-pointer ${selectedTrip?.id===t.id ? 'bg-blue-50 border-blue-300' : ''}`} onClick={()=>onSelectTrip(t)}>
                <div className="text-sm font-semibold">{t.busId}</div>
                <div className="text-xs text-gray-600">{t.direction} • {new Date(t.startedAt).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="md:col-span-2 border rounded p-3">
          <h2 className="font-semibold mb-2">Events</h2>
          {!selectedTrip && <div className="text-gray-500 text-sm">Select a trip to view events</div>}
          {selectedTrip && (
            <div className="space-y-2 max-h-96 overflow-auto">
              {loading && <div className="text-sm">Loading...</div>}
              {!loading && events.map((e, idx) => (
                <div key={idx} className="p-2 border rounded flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {badge(e.type)}
                    <div className="text-xs text-gray-700">{new Date(e.createdAt).toLocaleString()}</div>
                  </div>
                  <div className="text-xs text-gray-600">{e.data ? JSON.stringify(e.data) : ''}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

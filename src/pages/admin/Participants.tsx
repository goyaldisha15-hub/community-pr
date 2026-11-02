import React, { useEffect, useState } from 'react';
import api from '../../api/api';
import { Search, Trash2, Filter, Users } from 'lucide-react';

interface Registration {
  id: number;
  name: string;
  email: string;
  phone: string;
  event_id: number;
  event_title?: string;
  event?: { title: string };
  created_at: string;
  attendance_status?: string;
  checked_in?: boolean;
}

const AdminParticipants: React.FC = () => {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [eventFilter, setEventFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    Promise.all([
      api.get('/registrations').catch(() => ({ data: [] })),
      api.get('/events').catch(() => ({ data: [] })),
    ]).then(([regRes, evRes]) => {
      setRegistrations(regRes.data);
      setEvents(evRes.data);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this registration?')) return;
    try {
      await api.delete(`/registrations/${id}`);
      fetchData();
    } catch { alert('Failed to delete'); }
  };

  const filtered = registrations.filter(r => {
    const matchSearch = r.name.toLowerCase().includes(search.toLowerCase()) ||
                       r.email.toLowerCase().includes(search.toLowerCase()) ||
                       r.phone?.includes(search);
    const matchEvent = !eventFilter || String(r.event_id) === eventFilter;
    const matchStatus = !statusFilter || 
      (statusFilter === 'checked_in' && (r.checked_in || r.attendance_status === 'present')) ||
      (statusFilter === 'pending' && !r.checked_in && r.attendance_status !== 'present');
    return matchSearch && matchEvent && matchStatus;
  });

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900">Participants</h2>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search by name, email, or phone..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
        </div>
        <select value={eventFilter} onChange={e => setEventFilter(e.target.value)} className="px-3 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white">
          <option value="">All Events</option>
          {events.map((ev: any) => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white">
          <option value="">All Status</option>
          <option value="checked_in">Checked In</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-10 bg-white rounded-xl"><Users className="w-10 h-10 text-gray-300 mx-auto mb-2" /><p className="text-gray-500">No participants found</p></div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Email</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Phone</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Event</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">Status</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{r.name}</td>
                    <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{r.email}</td>
                    <td className="px-4 py-3 text-gray-600 hidden lg:table-cell">{r.phone}</td>
                    <td className="px-4 py-3 text-gray-600">{r.event?.title || r.event_title || `Event #${r.event_id}`}</td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        (r.checked_in || r.attendance_status === 'present')
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {(r.checked_in || r.attendance_status === 'present') ? 'Checked In' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => handleDelete(r.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminParticipants;

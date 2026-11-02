import React, { useEffect, useState } from 'react';
import api from '../../api/api';
import { Search, Download, ClipboardCheck } from 'lucide-react';

interface Attendance {
  id: number;
  participant_name?: string;
  name?: string;
  email: string;
  phone?: string;
  event_title?: string;
  event?: { title: string };
  check_in_time?: string;
  created_at?: string;
  scanned_by?: string;
  volunteer_name?: string;
}

const AdminAttendance: React.FC = () => {
  const [records, setRecords] = useState<Attendance[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [eventFilter, setEventFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/attendance').catch(() => ({ data: [] })),
      api.get('/events').catch(() => ({ data: [] })),
    ]).then(([attRes, evRes]) => {
      setRecords(attRes.data);
      setEvents(evRes.data);
    }).finally(() => setLoading(false));
  }, []);

  const filtered = records.filter(r => {
    const name = r.participant_name || r.name || '';
    const matchSearch = name.toLowerCase().includes(search.toLowerCase()) || r.email.toLowerCase().includes(search.toLowerCase());
    const matchEvent = !eventFilter || (r.event_title || r.event?.title || '').toLowerCase().includes(eventFilter.toLowerCase());
    return matchSearch && matchEvent;
  });

  const exportCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Event', 'Check-in Time', 'Scanned By'];
    const rows = filtered.map(r => [
      r.participant_name || r.name || '',
      r.email,
      r.phone || '',
      r.event_title || r.event?.title || '',
      r.check_in_time || r.created_at || '',
      r.scanned_by || r.volunteer_name || ''
    ]);
    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'attendance_records.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-bold text-gray-900">Attendance Records</h2>
        <button onClick={exportCSV} className="flex items-center gap-2 bg-blue text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search participants..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
        </div>
        <select value={eventFilter} onChange={e => setEventFilter(e.target.value)} className="px-3 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white">
          <option value="">All Events</option>
          {events.map((ev: any) => <option key={ev.id} value={ev.title}>{ev.title}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-10 bg-white rounded-xl"><ClipboardCheck className="w-10 h-10 text-gray-300 mx-auto mb-2" /><p className="text-gray-500">No attendance records found</p></div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Participant</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Email</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Event</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Check-in Time</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">Scanned By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((r, i) => (
                  <tr key={r.id || i} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{r.participant_name || r.name}</p>
                      <p className="text-xs text-gray-500">{r.phone}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{r.email}</td>
                    <td className="px-4 py-3 text-gray-600">{r.event_title || r.event?.title}</td>
                    <td className="px-4 py-3 text-gray-600 hidden lg:table-cell">{r.check_in_time ? new Date(r.check_in_time).toLocaleString() : r.created_at ? new Date(r.created_at).toLocaleString() : '-'}</td>
                    <td className="px-4 py-3 text-gray-600 hidden sm:table-cell">{r.scanned_by || r.volunteer_name || '-'}</td>
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

export default AdminAttendance;

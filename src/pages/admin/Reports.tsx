import React, { useEffect, useState } from 'react';
import api from '../../api/api';
import { Download, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#16A34A', '#2563EB', '#F59E0B', '#8B5CF6', '#EC4899'];

const AdminReports: React.FC = () => {
  const [summary, setSummary] = useState<any>(null);
  const [daily, setDaily] = useState<any[]>([]);
  const [eventStats, setEventStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/reports/summary').catch(() => ({ data: {} })),
      api.get('/reports/daily').catch(() => ({ data: [] })),
      api.get('/reports/events').catch(() => ({ data: [] })),
    ]).then(([sumRes, dailyRes, eventRes]) => {
      setSummary(sumRes.data);
      setDaily(dailyRes.data);
      setEventStats(eventRes.data);
    }).finally(() => setLoading(false));
  }, []);

  const exportReport = async (type: string) => {
    try {
      const res = await api.get(`/reports/export/${type}`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}_report.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // Fallback: generate CSV from existing data
      let csv = '';
      if (type === 'registrations') {
        csv = 'Metric,Value\nTotal Registrations,' + (summary?.total_registrations || 0);
      } else if (type === 'attendance') {
        csv = 'Metric,Value\nTotal Attendance,' + (summary?.total_attendance || 0);
      } else {
        csv = eventStats.map((e: any) => `${e.title},${e.registrations}`).join('\n');
        csv = 'Event,Registrations\n' + csv;
      }
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}_report.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-bold text-gray-900">Reports & Analytics</h2>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => exportReport('registrations')} className="flex items-center gap-2 bg-primary text-white px-3 py-2 rounded-lg text-xs font-medium hover:bg-primary-dark">
            <Download className="w-3 h-3" /> Registrations
          </button>
          <button onClick={() => exportReport('attendance')} className="flex items-center gap-2 bg-blue text-white px-3 py-2 rounded-lg text-xs font-medium hover:bg-blue-700">
            <Download className="w-3 h-3" /> Attendance
          </button>
          <button onClick={() => exportReport('events')} className="flex items-center gap-2 bg-purple-600 text-white px-3 py-2 rounded-lg text-xs font-medium hover:bg-purple-700">
            <Download className="w-3 h-3" /> Events
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 border border-gray-100">
          <p className="text-sm text-gray-500">Total Events</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{summary?.total_events || 0}</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100">
          <p className="text-sm text-gray-500">Total Registrations</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{summary?.total_registrations || 0}</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100">
          <p className="text-sm text-gray-500">Total Attendance</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{summary?.total_attendance || 0}</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100">
          <p className="text-sm text-gray-500">Attendance Rate</p>
          <p className="text-2xl font-bold text-primary mt-1">{summary?.attendance_percentage || 0}%</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-4">Daily Registration Trends</h3>
          {daily.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={daily}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="registrations" stroke="#16A34A" strokeWidth={2} dot={{ fill: '#16A34A', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-72 flex items-center justify-center text-gray-400">No daily data available</div>
          )}
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-4">Event-wise Registrations</h3>
          {eventStats.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={eventStats.slice(0, 8)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="title" tick={{ fontSize: 10 }} interval={0} angle={-25} textAnchor="end" height={70} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="registrations" radius={[4, 4, 0, 0]}>
                  {eventStats.slice(0, 8).map((_: any, i: number) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-72 flex items-center justify-center text-gray-400">No event data available</div>
          )}
        </div>
      </div>

      {/* Event Performance Table */}
      <div className="bg-white rounded-xl p-6 border border-gray-100">
        <h3 className="font-semibold text-gray-900 mb-4">Event Performance</h3>
        {eventStats.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-2 font-medium text-gray-600">Event</th>
                  <th className="text-left px-4 py-2 font-medium text-gray-600">Registrations</th>
                  <th className="text-left px-4 py-2 font-medium text-gray-600">Performance</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {eventStats.map((ev: any, i: number) => {
                  const maxReg = Math.max(...eventStats.map((e: any) => e.registrations || 0), 1);
                  const pct = ((ev.registrations || 0) / maxReg) * 100;
                  return (
                    <tr key={i}>
                      <td className="px-4 py-3 font-medium text-gray-900">{ev.title}</td>
                      <td className="px-4 py-3 text-gray-600">{ev.registrations || 0}</td>
                      <td className="px-4 py-3">
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div className="h-2 rounded-full" style={{ width: `${pct}%`, backgroundColor: COLORS[i % COLORS.length] }}></div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-400 text-center py-8">No event data available</p>
        )}
      </div>
    </div>
  );
};

export default AdminReports;

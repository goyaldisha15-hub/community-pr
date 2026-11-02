import React, { useEffect, useState } from 'react';
import api from '../../api/api';
import { Calendar, Users, ClipboardCheck, Clock, TrendingUp, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#16A34A', '#2563EB', '#F59E0B', '#8B5CF6'];

const AdminDashboard: React.FC = () => {
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

  if (loading) {
    return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div></div>;
  }

  const stats = [
    { label: 'Total Events', value: summary?.total_events || 0, icon: Calendar, color: 'bg-primary-light text-primary' },
    { label: 'Total Registrations', value: summary?.total_registrations || 0, icon: Users, color: 'bg-blue-light text-blue' },
    { label: 'Total Attendance', value: summary?.total_attendance || 0, icon: ClipboardCheck, color: 'bg-amber-100 text-amber-600' },
    { label: 'Attendance Rate', value: `${summary?.attendance_percentage || 0}%`, icon: TrendingUp, color: 'bg-purple-100 text-purple-600' },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
              </div>
              <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Daily Registrations</h3>
          {daily.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={daily}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="registrations" stroke="#16A34A" strokeWidth={2} dot={{ fill: '#16A34A' }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400"><p>No data available</p></div>
          )}
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Event Registrations</h3>
          {eventStats.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={eventStats.slice(0, 6)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="title" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="registrations" fill="#16A34A" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400"><p>No data available</p></div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Event Performance</h3>
          {eventStats.length > 0 ? (
            <div className="space-y-3">
              {eventStats.slice(0, 5).map((ev: any, i: number) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                    <span className="text-sm text-gray-700 truncate max-w-[200px]">{ev.title}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium text-gray-900">{ev.registrations || 0}</span>
                    <span className="text-xs text-gray-500 ml-1">regs</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center text-gray-400"><p>No events yet</p></div>
          )}
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <a href="/admin/events" className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-lg hover:bg-primary-light transition-colors">
              <Calendar className="w-6 h-6 text-primary" />
              <span className="text-xs font-medium text-gray-700">Create Event</span>
            </a>
            <a href="/admin/participants" className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-lg hover:bg-blue-light transition-colors">
              <Users className="w-6 h-6 text-blue" />
              <span className="text-xs font-medium text-gray-700">Participants</span>
            </a>
            <a href="/admin/attendance" className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-lg hover:bg-amber-50 transition-colors">
              <ClipboardCheck className="w-6 h-6 text-amber-600" />
              <span className="text-xs font-medium text-gray-700">Attendance</span>
            </a>
            <a href="/admin/reports" className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-lg hover:bg-purple-50 transition-colors">
              <TrendingUp className="w-6 h-6 text-purple-600" />
              <span className="text-xs font-medium text-gray-700">Reports</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Calendar, MapPin, QrCode, Download, CheckCircle, Clock, LogOut } from 'lucide-react';

interface Registration {
  id: number;
  token?: string;
  qr_token?: string;
  event_id: number;
  event?: {
    id: number;
    title: string;
    date: string;
    location: string;
    category: string;
  };
  event_title?: string;
  event_date?: string;
  event_location?: string;
  created_at: string;
  checked_in?: boolean;
  attendance_status?: string;
  check_in_time?: string;
}

const ParticipantDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/registrations/mine').then(res => setRegistrations(res.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const getQRUrl = (reg: Registration) => {
    const token = reg.token || reg.qr_token || reg.id;
    return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(JSON.stringify({ token, event_id: reg.event_id }))}`;
  };

  const downloadQR = (reg: Registration) => {
    const link = document.createElement('a');
    link.href = getQRUrl(reg);
    link.download = `SevaConnect-QR-${reg.event?.title || 'event'}.png`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome */}
        <div className="bg-gradient-to-r from-blue to-blue-700 rounded-xl p-6 text-white mb-8">
          <h1 className="text-2xl font-bold">Welcome, {user?.name}!</h1>
          <p className="text-blue-100 mt-1">View your event registrations and QR codes for check-in.</p>
          <button onClick={logout} className="mt-4 flex items-center gap-2 text-sm text-blue-100 hover:text-white">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>

        <h2 className="text-xl font-bold text-gray-900 mb-4">My Registrations</h2>

        {loading ? (
          <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
        ) : registrations.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-xl">
            <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 mb-4">You haven't registered for any events yet.</p>
            <a href="/events" className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-dark">Browse Events</a>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-5">
            {registrations.map(reg => {
              const isCheckedIn = reg.checked_in || reg.attendance_status === 'present';
              return (
                <div key={reg.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <span className="inline-block bg-primary-light text-primary-dark text-xs font-medium px-2 py-0.5 rounded-full mb-2">
                          {reg.event?.category || 'Event'}
                        </span>
                        <h3 className="font-semibold text-gray-900">{reg.event?.title || reg.event_title || `Event #${reg.event_id}`}</h3>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${isCheckedIn ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {isCheckedIn ? '✓ Checked In' : 'Pending'}
                      </span>
                    </div>

                    <div className="space-y-2 text-sm text-gray-500 mb-4">
                      <p className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5" />{reg.event?.date ? new Date(reg.event.date).toLocaleDateString() : reg.event_date || 'TBD'}</p>
                      <p className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5" />{reg.event?.location || reg.event_location || 'TBD'}</p>
                      <p className="flex items-center gap-2"><Clock className="w-3.5 h-3.5" />Registered: {new Date(reg.created_at).toLocaleDateString()}</p>
                    </div>

                    {isCheckedIn && reg.check_in_time && (
                      <div className="bg-green-50 rounded-lg p-3 mb-4">
                        <p className="text-xs text-green-700 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Checked in at: {new Date(reg.check_in_time).toLocaleString()}</p>
                      </div>
                    )}

                    {/* QR Code */}
                    <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
                      <div className="bg-gray-50 rounded-lg p-2">
                        <img src={getQRUrl(reg)} alt="QR Code" className="w-20 h-20" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 mb-2">Your check-in QR code</p>
                        <button onClick={() => downloadQR(reg)} className="flex items-center gap-1 text-sm text-primary font-medium hover:text-primary-dark">
                          <Download className="w-3.5 h-3.5" /> Download QR
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default ParticipantDashboard;

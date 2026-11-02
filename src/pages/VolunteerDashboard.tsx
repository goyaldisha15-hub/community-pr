import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Calendar, MapPin, Users, QrCode, LogOut, ClipboardCheck, Clock } from 'lucide-react';

interface Event {
  id: number;
  title: string;
  date: string;
  location: string;
  category: string;
  total_slots: number;
  registered_count?: number;
}

const VolunteerDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/events').then(res => setEvents(res.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome */}
        <div className="bg-gradient-to-r from-primary to-primary-dark rounded-xl p-6 text-white mb-8">
          <h1 className="text-2xl font-bold">Welcome, {user?.name}!</h1>
          <p className="text-green-100 mt-1">Select an event to start scanning QR codes for attendance.</p>
          <button onClick={handleLogout} className="mt-4 flex items-center gap-2 text-sm text-green-100 hover:text-white">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>

        <h2 className="text-xl font-bold text-gray-900 mb-4">Available Events</h2>

        {loading ? (
          <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
        ) : events.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-xl">
            <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500">No events available at the moment.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {events.map(event => (
              <div key={event.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
                <span className="inline-block bg-primary-light text-primary-dark text-xs font-medium px-2 py-1 rounded-full mb-3">{event.category}</span>
                <h3 className="font-semibold text-gray-900 mb-2">{event.title}</h3>
                <div className="space-y-2 text-sm text-gray-500 mb-4">
                  <p className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5" />{new Date(event.date).toLocaleDateString()}</p>
                  <p className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5" />{event.location}</p>
                  <p className="flex items-center gap-2"><Users className="w-3.5 h-3.5" />{event.registered_count || 0} / {event.total_slots} registered</p>
                </div>
                <Link
                  to={`/volunteer/scan/${event.id}`}
                  className="w-full flex items-center justify-center gap-2 bg-primary text-white py-2.5 rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
                >
                  <QrCode className="w-4 h-4" /> Start Scanning
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default VolunteerDashboard;

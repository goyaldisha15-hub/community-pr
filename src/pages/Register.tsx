import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import api from '../api/api';
import { User, Mail, Phone, Calendar, CheckCircle } from 'lucide-react';

interface Event {
  id: number;
  title: string;
  date: string;
  location: string;
}

const Register: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [form, setForm] = useState({ name: '', email: '', phone: '', event_id: searchParams.get('event') || '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/events').then(res => setEvents(res.data)).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/registrations', {
        name: form.name,
        email: form.email,
        phone: form.phone,
        event_id: parseInt(form.event_id)
      });
      navigate('/confirmation', { state: { registration: res.data } });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="bg-white rounded-xl shadow-sm p-8">
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-primary-light rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-7 h-7 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Event Registration</h1>
            <p className="text-gray-600 mt-2">Fill in your details to register for the event</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-6">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={e => setForm({...form, name: e.target.value})}
                  placeholder="Enter your full name"
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={e => setForm({...form, email: e.target.value})}
                  placeholder="Enter your email"
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number *</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="tel"
                  required
                  value={form.phone}
                  onChange={e => setForm({...form, phone: e.target.value})}
                  placeholder="Enter your mobile number"
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Event *</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  required
                  value={form.event_id}
                  onChange={e => setForm({...form, event_id: e.target.value})}
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none appearance-none bg-white"
                >
                  <option value="">Choose an event</option>
                  {events.map(ev => (
                    <option key={ev.id} value={ev.id}>{ev.title} - {new Date(ev.date).toLocaleDateString()}</option>
                  ))}
                </select>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white py-3 rounded-lg font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
            >
              {loading ? 'Registering...' : 'Register Now'}
            </button>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Register;

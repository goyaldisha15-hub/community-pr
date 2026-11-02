import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import api from '../api/api';
import { Calendar, MapPin, Users, ArrowLeft, Clock } from 'lucide-react';

interface Event {
  id: number;
  title: string;
  description: string;
  date: string;
  location: string;
  category: string;
  image_url?: string;
  total_slots: number;
  registered_count?: number;
}

const EventDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/events/${id}`).then(res => setEvent(res.data)).catch(() => navigate('/events')).finally(() => setLoading(false));
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50"><Navbar />
        <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div></div>
      </div>
    );
  }

  if (!event) return null;

  const available = event.total_slots - (event.registered_count || 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Link to="/events" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-primary mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Events
        </Link>

        <div className="bg-white rounded-xl overflow-hidden shadow-sm">
          <div className="h-64 bg-gradient-to-br from-primary/10 to-blue/10 flex items-center justify-center">
            <Calendar className="w-20 h-20 text-primary/30" />
          </div>
          <div className="p-8">
            <span className="inline-block bg-primary-light text-primary-dark text-xs font-medium px-3 py-1 rounded-full mb-3">{event.category}</span>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{event.title}</h1>
            <p className="text-gray-600 leading-relaxed mb-6">{event.description}</p>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-gray-50 rounded-lg p-4">
                <Calendar className="w-5 h-5 text-primary mb-2" />
                <p className="text-xs text-gray-500">Date</p>
                <p className="text-sm font-medium text-gray-900">{new Date(event.date).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <Clock className="w-5 h-5 text-blue mb-2" />
                <p className="text-xs text-gray-500">Time</p>
                <p className="text-sm font-medium text-gray-900">{new Date(event.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <MapPin className="w-5 h-5 text-primary mb-2" />
                <p className="text-xs text-gray-500">Location</p>
                <p className="text-sm font-medium text-gray-900">{event.location}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <Users className="w-5 h-5 text-blue mb-2" />
                <p className="text-xs text-gray-500">Availability</p>
                <p className="text-sm font-medium text-gray-900">{available > 0 ? `${available} of ${event.total_slots} slots` : 'Event Full'}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Link
                to={`/register?event=${event.id}`}
                className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                  available > 0
                    ? 'bg-primary text-white hover:bg-primary-dark'
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                }`}
                onClick={e => available <= 0 && e.preventDefault()}
              >
                {available > 0 ? 'Register for Event' : 'Event Full'}
              </Link>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default EventDetails;

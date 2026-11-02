import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import api from '../api/api';
import { Calendar, MapPin, Search, Filter, Users } from 'lucide-react';

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

const Events: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/events').then(res => setEvents(res.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const categories = [...new Set(events.map(e => e.category))];
  
  const filtered = events.filter(e => {
    const matchSearch = e.title.toLowerCase().includes(search.toLowerCase()) || 
                       e.description.toLowerCase().includes(search.toLowerCase()) ||
                       e.location.toLowerCase().includes(search.toLowerCase());
    const matchCategory = !category || e.category === category;
    return matchSearch && matchCategory;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Upcoming Events</h1>
          <p className="text-gray-600 mt-2">Discover and join events making a difference in our community</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search events..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="pl-10 pr-8 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none appearance-none bg-white"
            >
              <option value="">All Categories</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* Events Grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No events found. Try adjusting your search.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(event => {
              const available = event.total_slots - (event.registered_count || 0);
              return (
                <div key={event.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 group">
                  <div className="h-44 bg-gradient-to-br from-primary/10 to-blue/10 flex items-center justify-center relative">
                    <Calendar className="w-12 h-12 text-primary/40" />
                    <span className="absolute top-3 right-3 bg-white/90 backdrop-blur text-xs font-medium px-2 py-1 rounded-full text-primary-dark">{event.category}</span>
                  </div>
                  <div className="p-5">
                    <h3 className="font-semibold text-gray-900 text-lg group-hover:text-primary transition-colors">{event.title}</h3>
                    <p className="text-sm text-gray-500 mt-2 line-clamp-2">{event.description}</p>
                    <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(event.date).toLocaleDateString()}</span>
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{event.location}</span>
                    </div>
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <Users className="w-3 h-3" />
                        {available > 0 ? `${available} slots left` : 'Full'}
                      </span>
                      <Link to={`/events/${event.id}`} className="bg-primary text-white px-4 py-1.5 rounded-lg text-xs font-medium hover:bg-primary-dark transition-colors">
                        View Details
                      </Link>
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

export default Events;

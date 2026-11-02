import React, { useEffect, useState } from 'react';
import api from '../../api/api';
import { Plus, Edit, Trash2, Search, X, Calendar, MapPin } from 'lucide-react';

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

const emptyForm = { title: '', description: '', date: '', location: '', category: '', image_url: '', total_slots: '' };

const AdminEvents: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchEvents = () => {
    api.get('/events').then(res => setEvents(res.data)).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetchEvents(); }, []);

  const openCreate = () => { setForm(emptyForm); setEditId(null); setShowModal(true); };
  const openEdit = (ev: Event) => {
    setForm({ title: ev.title, description: ev.description, date: ev.date ? ev.date.slice(0, 16) : '', location: ev.location, category: ev.category, image_url: ev.image_url || '', total_slots: String(ev.total_slots) });
    setEditId(ev.id);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = { ...form, total_slots: parseInt(form.total_slots) };
      if (editId) {
        await api.put(`/events/${editId}`, data);
      } else {
        await api.post('/events', data);
      }
      setShowModal(false);
      fetchEvents();
    } catch (err) { alert('Failed to save event'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    try {
      await api.delete(`/events/${id}`);
      fetchEvents();
    } catch { alert('Failed to delete event'); }
  };

  const filtered = events.filter(e => e.title.toLowerCase().includes(search.toLowerCase()) || e.location.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-bold text-gray-900">Manage Events</h2>
        <button onClick={openCreate} className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors">
          <Plus className="w-4 h-4" /> Create Event
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input type="text" placeholder="Search events..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-10 bg-white rounded-xl"><p className="text-gray-500">No events found</p></div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Event</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Category</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Date</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">Slots</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(ev => (
                  <tr key={ev.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{ev.title}</p>
                      <p className="text-xs text-gray-500">{ev.location}</p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell"><span className="bg-primary-light text-primary-dark text-xs px-2 py-1 rounded-full">{ev.category}</span></td>
                    <td className="px-4 py-3 hidden lg:table-cell text-gray-600">{new Date(ev.date).toLocaleDateString()}</td>
                    <td className="px-4 py-3 hidden sm:table-cell text-gray-600">{ev.registered_count || 0}/{ev.total_slots}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit(ev)} className="p-1.5 rounded-lg hover:bg-blue-light text-blue"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(ev.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold">{editId ? 'Edit Event' : 'Create Event'}</h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-gray-100"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input type="text" required value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                <textarea required value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={3} className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time *</label>
                  <input type="datetime-local" required value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Slots *</label>
                  <input type="number" required min="1" value={form.total_slots} onChange={e => setForm({...form, total_slots: e.target.value})} className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
                <input type="text" required value={form.location} onChange={e => setForm({...form, location: e.target.value})} className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                  <input type="text" required value={form.category} onChange={e => setForm({...form, category: e.target.value})} placeholder="e.g., Education, Health" className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                  <input type="url" value={form.image_url} onChange={e => setForm({...form, image_url: e.target.value})} className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-lg border border-gray-200 text-gray-700 font-medium hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-lg bg-primary text-white font-medium hover:bg-primary-dark disabled:opacity-50">{saving ? 'Saving...' : editId ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminEvents;

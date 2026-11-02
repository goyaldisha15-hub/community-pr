import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import api from '../api/api';
import { Heart, Users, Calendar, MapPin, ArrowRight, Star, Target, Globe, HeartHandshake, Clock } from 'lucide-react';

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

const Landing: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    api.get('/events').then(res => setEvents(res.data.slice(0, 3))).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-green-50 via-white to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-fadeIn">
              <div className="inline-flex items-center gap-2 bg-primary-light text-primary-dark px-4 py-1.5 rounded-full text-sm font-medium mb-6">
                <Heart className="w-4 h-4" fill="currentColor" />
                Making a Difference Together
              </div>
              <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 leading-tight">
                Together, We Can <span className="text-primary">Make a Difference</span>
              </h1>
              <p className="mt-6 text-lg text-gray-600 leading-relaxed">
                SevaConnect empowers NGOs to organize impactful events, manage volunteers seamlessly, and create meaningful community change through technology-driven solutions.
              </p>
              <div className="flex flex-wrap gap-4 mt-8">
                <Link to="/events" className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-dark transition-colors shadow-lg shadow-green-200">
                  Explore Events <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/signup" className="inline-flex items-center gap-2 bg-blue text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200">
                  Join as Volunteer <HeartHandshake className="w-4 h-4" />
                </Link>
              </div>
            </div>
            <div className="relative hidden lg:block">
              <div className="w-full h-96 bg-gradient-to-br from-primary/20 to-blue/20 rounded-3xl flex items-center justify-center">
                <div className="text-center">
                  <div className="w-32 h-32 mx-auto bg-white rounded-full flex items-center justify-center shadow-xl mb-4">
                    <Globe className="w-16 h-16 text-primary" />
                  </div>
                  <p className="text-gray-600 font-medium">Building Stronger Communities</p>
                </div>
              </div>
              <div className="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-lg p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-light rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">10,000+</p>
                  <p className="text-xs text-gray-500">Lives Impacted</p>
                </div>
              </div>
              <div className="absolute -top-4 -right-4 bg-white rounded-xl shadow-lg p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-light rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-blue" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">500+</p>
                  <p className="text-xs text-gray-500">Events Organized</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Upcoming Events */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Upcoming Events</h2>
            <p className="mt-3 text-gray-600">Join our upcoming initiatives and be part of the change</p>
          </div>
          {events.length > 0 ? (
            <div className="grid md:grid-cols-3 gap-6">
              {events.map(event => (
                <Link to={`/events/${event.id}`} key={event.id} className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300">
                  <div className="h-48 bg-gradient-to-br from-primary/10 to-blue/10 flex items-center justify-center">
                    <Calendar className="w-12 h-12 text-primary/50" />
                  </div>
                  <div className="p-5">
                    <span className="inline-block bg-primary-light text-primary-dark text-xs font-medium px-2 py-1 rounded-full mb-2">{event.category}</span>
                    <h3 className="font-semibold text-gray-900 group-hover:text-primary transition-colors">{event.title}</h3>
                    <p className="text-sm text-gray-500 mt-2 line-clamp-2">{event.description}</p>
                    <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(event.date).toLocaleDateString()}</span>
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{event.location}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-xl">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No upcoming events at the moment. Check back soon!</p>
            </div>
          )}
          <div className="text-center mt-8">
            <Link to="/events" className="inline-flex items-center gap-2 text-primary font-medium hover:text-primary-dark transition-colors">
              View All Events <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Impact Stats */}
      <section className="py-20 bg-gradient-to-r from-primary to-primary-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: '500+', label: 'Events Organized', icon: Calendar },
              { value: '10,000+', label: 'Lives Impacted', icon: Heart },
              { value: '2,000+', label: 'Volunteers', icon: Users },
              { value: '50+', label: 'NGO Partners', icon: Globe },
            ].map((stat, i) => (
              <div key={i} className="text-center text-white">
                <stat.icon className="w-8 h-8 mx-auto mb-3 opacity-80" />
                <p className="text-3xl font-bold">{stat.value}</p>
                <p className="text-sm opacity-80 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">How It Works</h2>
            <p className="mt-3 text-gray-600">Simple steps to get involved and make an impact</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Browse Events', desc: 'Explore upcoming NGO events and campaigns in your area.', icon: Calendar },
              { step: '02', title: 'Register & Get QR', desc: 'Sign up for events and receive your unique QR code for check-in.', icon: Users },
              { step: '03', title: 'Participate & Impact', desc: 'Attend events, get checked in via QR scan, and make a difference.', icon: Heart },
            ].map((item, i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-primary-light rounded-lg flex items-center justify-center mb-4">
                  <item.icon className="w-6 h-6 text-primary" />
                </div>
                <p className="text-xs font-bold text-primary mb-2">STEP {item.step}</p>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-blue-light text-blue px-4 py-1.5 rounded-full text-sm font-medium mb-4">
                <Target className="w-4 h-4" /> Our Mission
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Empowering Communities Through Technology</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                SevaConnect bridges the gap between NGOs, volunteers, and communities by providing a seamless digital platform for event management, volunteer coordination, and impact tracking.
              </p>
              <p className="text-gray-600 leading-relaxed">
                Our goal is to eliminate manual processes and help organizations focus on what matters most — creating positive social change.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Calendar, label: 'Easy Event Management', color: 'bg-primary-light text-primary' },
                { icon: Users, label: 'Volunteer Coordination', color: 'bg-blue-light text-blue' },
                { icon: Clock, label: 'Real-time Tracking', color: 'bg-amber-100 text-amber-600' },
                { icon: Star, label: 'Impact Reporting', color: 'bg-purple-100 text-purple-600' },
              ].map((item, i) => (
                <div key={i} className="bg-gray-50 rounded-xl p-5 text-center">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-3 ${item.color}`}>
                    <item.icon className="w-5 h-5" />
                  </div>
                  <p className="text-sm font-medium text-gray-700">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">What People Say</h2>
            <p className="mt-3 text-gray-600">Hear from our community members</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: 'Priya Sharma', role: 'Volunteer', text: 'SevaConnect made it so easy to find and participate in meaningful events. The QR check-in system is brilliant!' },
              { name: 'Rajesh Kumar', role: 'NGO Director', text: 'Managing events used to be a nightmare. Now everything is digital and organized. Highly recommend!' },
              { name: 'Anita Desai', role: 'Participant', text: 'I love how simple it is to register and get my QR code. The whole experience is seamless and professional.' },
            ].map((t, i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex gap-1 mb-3">
                  {[...Array(5)].map((_, j) => <Star key={j} className="w-4 h-4 text-yellow-400" fill="currentColor" />)}
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-light rounded-full flex items-center justify-center">
                    <span className="text-primary font-semibold text-sm">{t.name[0]}</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                    <p className="text-xs text-gray-500">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-blue to-blue-700">
        <div className="max-w-4xl mx-auto px-4 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to Make a Difference?</h2>
          <p className="text-blue-100 mb-8 text-lg">Join thousands of volunteers and participants who are creating positive change in their communities.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/signup" className="bg-white text-blue px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors">Get Started Free</Link>
            <Link to="/events" className="border border-white text-white px-6 py-3 rounded-lg font-medium hover:bg-white/10 transition-colors">Browse Events</Link>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Get in Touch</h2>
            <p className="mt-3 text-gray-600">Have questions? We'd love to hear from you.</p>
          </div>
          <div className="max-w-2xl mx-auto">
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); alert('Thank you for reaching out! We will get back to you soon.'); }}>
              <div className="grid md:grid-cols-2 gap-4">
                <input type="text" placeholder="Your Name" required className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" />
                <input type="email" placeholder="Your Email" required className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" />
              </div>
              <input type="text" placeholder="Subject" className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" />
              <textarea placeholder="Your Message" rows={4} className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none"></textarea>
              <button type="submit" className="w-full bg-primary text-white py-3 rounded-lg font-medium hover:bg-primary-dark transition-colors">Send Message</button>
            </form>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Landing;

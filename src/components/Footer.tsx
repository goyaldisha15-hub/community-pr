import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Mail, Phone, MapPin } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center">
                <Heart className="w-5 h-5 text-white" fill="white" />
              </div>
              <span className="text-xl font-bold">SevaConnect</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed max-w-md">
              Empowering NGOs to organize impactful events, manage volunteers, and create meaningful community change through technology.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link to="/" className="hover:text-primary transition-colors">Home</Link></li>
              <li><Link to="/events" className="hover:text-primary transition-colors">Events</Link></li>
              <li><Link to="/signup" className="hover:text-primary transition-colors">Join as Volunteer</Link></li>
              <li><Link to="/login" className="hover:text-primary transition-colors">Login</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Contact</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              <li className="flex items-center gap-2"><Mail className="w-4 h-4" /> info@sevaconnect.org</li>
              <li className="flex items-center gap-2"><Phone className="w-4 h-4" /> +91 98765 43210</li>
              <li className="flex items-center gap-2"><MapPin className="w-4 h-4" /> Mumbai, India</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-500">
          <p>© {new Date().getFullYear()} SevaConnect. All rights reserved. Made with ❤️ for social good.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

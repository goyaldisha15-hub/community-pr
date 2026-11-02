import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { CheckCircle, Calendar, MapPin, Download, QrCode } from 'lucide-react';

const Confirmation: React.FC = () => {
  const location = useLocation();
  const registration = (location.state as any)?.registration;

  if (!registration) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <CheckCircle className="w-16 h-16 text-primary mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Registration Successful!</h1>
          <p className="text-gray-600 mb-6">Your registration has been confirmed.</p>
          <Link to="/events" className="bg-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-dark transition-colors">Browse More Events</Link>
        </div>
        <Footer />
      </div>
    );
  }

  const qrData = registration.token || registration.qr_token || registration.id;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(JSON.stringify({ token: qrData, event_id: registration.event_id || registration.event?.id }))}`;

  const downloadQR = () => {
    const link = document.createElement('a');
    link.href = qrUrl;
    link.download = `SevaConnect-QR-${registration.name || 'participant'}.png`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <div className="w-16 h-16 bg-primary-light rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-9 h-9 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Registration Confirmed!</h1>
          <p className="text-gray-600 mb-8">Your QR code has been generated. Please save it for event check-in.</p>

          {/* QR Code */}
          <div className="bg-gray-50 rounded-xl p-6 mb-6 inline-block">
            <img src={qrUrl} alt="Registration QR Code" className="w-48 h-48 mx-auto" />
          </div>

          {/* Details */}
          <div className="bg-gray-50 rounded-xl p-6 text-left space-y-3 mb-6">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Name</span>
              <span className="text-sm font-medium text-gray-900">{registration.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Email</span>
              <span className="text-sm font-medium text-gray-900">{registration.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Event</span>
              <span className="text-sm font-medium text-gray-900">{registration.event?.title || registration.event_title || `Event #${registration.event_id}`}</span>
            </div>
            {registration.event?.date && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Date</span>
                <span className="text-sm font-medium text-gray-900">{new Date(registration.event.date).toLocaleDateString()}</span>
              </div>
            )}
            {registration.event?.location && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Location</span>
                <span className="text-sm font-medium text-gray-900">{registration.event.location}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Token</span>
              <span className="text-sm font-mono text-gray-900 break-all">{qrData}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button onClick={downloadQR} className="flex-1 flex items-center justify-center gap-2 bg-primary text-white py-3 rounded-lg font-medium hover:bg-primary-dark transition-colors">
              <Download className="w-4 h-4" /> Download QR Code
            </button>
            <Link to="/events" className="flex-1 flex items-center justify-center gap-2 border border-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors">
              <Calendar className="w-4 h-4" /> Browse Events
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Confirmation;

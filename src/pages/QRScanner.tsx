import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import api from '../api/api';
import { ArrowLeft, Camera, CheckCircle, AlertTriangle, XCircle, QrCode, StopCircle } from 'lucide-react';

interface ScanResult {
  status: 'success' | 'already_checked_in' | 'invalid';
  participant?: {
    name: string;
    email: string;
    phone?: string;
  };
  event?: {
    title: string;
  };
  check_in_time?: string;
  message?: string;
}

const QRScanner: React.FC = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState('');
  const [eventInfo, setEventInfo] = useState<any>(null);
  const [stats, setStats] = useState({ total: 0, checked_in: 0, pending: 0 });
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const cooldownRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.get(`/events/${eventId}`).then(res => setEventInfo(res.data)).catch(() => {});
    api.get(`/registrations/event/${eventId}`).then(res => {
      const regs = res.data;
      const total = regs.length;
      const checkedIn = regs.filter((r: any) => r.checked_in || r.attendance_status === 'present').length;
      setStats({ total, checked_in: checkedIn, pending: total - checkedIn });
    }).catch(() => {});

    return () => {
      stopScanner();
    };
  }, [eventId]);

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState();
        if (state === 2) { // SCANNING state
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch (e) {
        // ignore cleanup errors
      }
      scannerRef.current = null;
    }
    setScanning(false);
  };

  const startScanner = async () => {
    setError('');
    setResult(null);
    
    if (!containerRef.current) return;

    try {
      const html5QrCode = new Html5Qrcode("qr-reader");
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
          if (cooldownRef.current) return;
          cooldownRef.current = true;
          
          try {
            let token = decodedText;
            try {
              const parsed = JSON.parse(decodedText);
              token = parsed.token || decodedText;
            } catch {}

            const res = await api.post('/attendance/scan', {
              token,
              event_id: parseInt(eventId!)
            });

            setResult({
              status: 'success',
              participant: res.data.participant || res.data,
              event: res.data.event || eventInfo,
              check_in_time: res.data.check_in_time || new Date().toISOString()
            });

            // Update stats
            setStats(prev => ({ ...prev, checked_in: prev.checked_in + 1, pending: prev.pending - 1 }));
          } catch (err: any) {
            const msg = err.response?.data?.message || '';
            if (msg.toLowerCase().includes('already') || msg.toLowerCase().includes('checked in')) {
              setResult({
                status: 'already_checked_in',
                participant: err.response?.data?.participant || err.response?.data,
                message: msg
              });
            } else {
              setResult({
                status: 'invalid',
                message: msg || 'Invalid QR Code'
              });
            }
          }

          // Cooldown for 3 seconds
          setTimeout(() => {
            cooldownRef.current = false;
            setResult(null);
          }, 3000);
        },
        (errorMessage) => {
          // QR scan error - ignore, keep scanning
        }
      );
      setScanning(true);
    } catch (err: any) {
      setError('Camera access denied or not available. Please allow camera permissions.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-6">
        <Link to="/volunteer" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-primary mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Events
        </Link>

        {/* Event Info */}
        {eventInfo && (
          <div className="bg-white rounded-xl p-5 border border-gray-200 mb-6">
            <h2 className="text-lg font-bold text-gray-900">{eventInfo.title}</h2>
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-xs text-gray-500">Total</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{stats.checked_in}</p>
                <p className="text-xs text-gray-500">Checked In</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-amber-500">{stats.pending}</p>
                <p className="text-xs text-gray-500">Pending</p>
              </div>
            </div>
          </div>
        )}

        {/* Scanner */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <QrCode className="w-5 h-5 text-primary" /> QR Code Scanner
            </h3>
            <p className="text-sm text-gray-500 mt-1">Point the camera at a participant's QR code to mark attendance</p>
          </div>

          <div className="p-5">
            {/* Camera Preview */}
            <div id="qr-reader" ref={containerRef} className="w-full rounded-lg overflow-hidden bg-gray-900 min-h-[300px] flex items-center justify-center mb-4">
              {!scanning && (
                <div className="text-center text-gray-400">
                  <Camera className="w-12 h-12 mx-auto mb-2" />
                  <p className="text-sm">Camera preview will appear here</p>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="flex gap-3">
              {!scanning ? (
                <button onClick={startScanner} className="flex-1 flex items-center justify-center gap-2 bg-primary text-white py-3 rounded-lg font-medium hover:bg-primary-dark transition-colors">
                  <Camera className="w-4 h-4" /> Start Scanner
                </button>
              ) : (
                <button onClick={stopScanner} className="flex-1 flex items-center justify-center gap-2 bg-red-500 text-white py-3 rounded-lg font-medium hover:bg-red-600 transition-colors">
                  <StopCircle className="w-4 h-4" /> Stop Scanner
                </button>
              )}
            </div>

            {error && (
              <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
            )}

            {/* Scan Result */}
            {result && (
              <div className={`mt-4 rounded-xl p-5 ${
                result.status === 'success' ? 'bg-green-50 border border-green-200' :
                result.status === 'already_checked_in' ? 'bg-yellow-50 border border-yellow-200' :
                'bg-red-50 border border-red-200'
              }`}>
                {result.status === 'success' && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                      <span className="font-semibold text-green-800">Attendance Marked Successfully!</span>
                    </div>
                    {result.participant && (
                      <div className="space-y-1 text-sm">
                        <p className="text-green-700"><strong>Name:</strong> {result.participant.name}</p>
                        <p className="text-green-700"><strong>Email:</strong> {result.participant.email}</p>
                        {result.event && <p className="text-green-700"><strong>Event:</strong> {result.event.title}</p>}
                        {result.check_in_time && <p className="text-green-700"><strong>Check-in:</strong> {new Date(result.check_in_time).toLocaleString()}</p>}
                      </div>
                    )}
                  </div>
                )}
                {result.status === 'already_checked_in' && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle className="w-6 h-6 text-yellow-600" />
                      <span className="font-semibold text-yellow-800">Already Checked In</span>
                    </div>
                    {result.participant && (
                      <div className="space-y-1 text-sm">
                        <p className="text-yellow-700"><strong>Name:</strong> {result.participant.name}</p>
                        <p className="text-yellow-700"><strong>Email:</strong> {result.participant.email}</p>
                      </div>
                    )}
                    {result.message && <p className="text-yellow-700 text-sm mt-2">{result.message}</p>}
                  </div>
                )}
                {result.status === 'invalid' && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <XCircle className="w-6 h-6 text-red-600" />
                      <span className="font-semibold text-red-800">Invalid QR Code</span>
                    </div>
                    <p className="text-red-700 text-sm">{result.message || 'This QR code is not valid for this event.'}</p>
                  </div>
                )}
              </div>
            )}

            {/* Instructions */}
            <div className="mt-6 bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Instructions:</h4>
              <ul className="text-xs text-gray-500 space-y-1">
                <li>• Click "Start Scanner" to activate the camera</li>
                <li>• Allow camera permissions when prompted</li>
                <li>• Point the camera at the participant's QR code</li>
                <li>• Attendance will be marked automatically</li>
                <li>• Wait for the cooldown before scanning the next QR</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRScanner;

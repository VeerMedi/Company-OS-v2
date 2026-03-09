import React, { useState, useEffect } from 'react';
import { Clock, MapPin, Coffee, Play, Square, CheckCircle, AlertCircle } from 'lucide-react';
import { showToast } from '../utils/toast';
import { fetchWithAuth } from '../utils/api';

const AttendancePunch = () => {
  const [attendanceStatus, setAttendanceStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [location, setLocation] = useState('Office');
  const [notes, setNotes] = useState('');
  const [onBreak, setOnBreak] = useState(false);
  const [breakType, setBreakType] = useState('lunch');
  const [punchLoading, setPunchLoading] = useState(false);

  useEffect(() => {
    fetchPunchStatus();

    // Update current time every second
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const fetchPunchStatus = async () => {
    setLoading(true);
    try {
      const response = await fetchWithAuth('attendance/status');

      if (response.ok) {
        const data = await response.json();
        setAttendanceStatus(data.data);

        // Check if on break
        if (data.data.attendance?.breaks) {
          const ongoingBreak = data.data.attendance.breaks.find(b => b.breakStart && !b.breakEnd);
          setOnBreak(!!ongoingBreak);
        }
      } else {
        console.error('Failed to fetch punch status');
      }
    } catch (error) {
      console.error('Error fetching punch status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePunchIn = async () => {
    setPunchLoading(true);
    try {
      const response = await fetchWithAuth('attendance/punch-in', {
        method: 'POST',
        body: JSON.stringify({
          location,
          notes
        })
      });

      const data = await response.json();

      if (response.ok) {
        setNotes('');
        fetchPunchStatus();
        showToast.success('Punched in successfully!');
      } else {
        showToast.error(data.message || 'Failed to punch in');
      }
    } catch (error) {
      console.error('Error punching in:', error);
      showToast.error('Error punching in');
    } finally {
      setPunchLoading(false);
    }
  };

  const handlePunchOut = async () => {
    setPunchLoading(true);
    try {
      const response = await fetchWithAuth('attendance/punch-out', {
        method: 'POST',
        body: JSON.stringify({
          location,
          notes
        })
      });

      const data = await response.json();

      if (response.ok) {
        setNotes('');
        fetchPunchStatus();
        showToast.success(`Punched out successfully! Total working time: ${data.data.workingHours}`);
      } else {
        showToast.error(data.message || 'Failed to punch out');
      }
    } catch (error) {
      console.error('Error punching out:', error);
      showToast.error('Error punching out');
    } finally {
      setPunchLoading(false);
    }
  };

  const handleBreakToggle = async () => {
    setPunchLoading(true);
    try {
      const endpoint = onBreak ? 'attendance/break/end' : 'attendance/break/start';
      const response = await fetchWithAuth(endpoint, {
        method: 'POST',
        body: JSON.stringify({
          breakType,
          notes
        })
      });

      const data = await response.json();

      if (response.ok) {
        setNotes('');
        setOnBreak(!onBreak);
        fetchPunchStatus();
        showToast.success(onBreak ? 'Break ended successfully!' : 'Break started successfully!');
      } else {
        showToast.error(data.message || 'Failed to update break status');
      }
    } catch (error) {
      console.error('Error updating break status:', error);
      showToast.error('Error updating break status');
    } finally {
      setPunchLoading(false);
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getWorkingHours = () => {
    if (!attendanceStatus?.attendance?.punchIn?.time) return '0h 0m';

    const punchInTime = new Date(attendanceStatus.attendance.punchIn.time);
    const currentOrPunchOut = attendanceStatus.attendance.punchOut?.time
      ? new Date(attendanceStatus.attendance.punchOut.time)
      : new Date();

    const diffMs = currentOrPunchOut - punchInTime;
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    return `${hours}h ${minutes}m`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] w-full max-w-5xl mx-auto px-4 scale-90 origin-top">
      {/* Premium Ambient Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-500/10 rounded-full blur-[120px] -z-10 pointer-events-none opacity-40"></div>

      {/* --- HEADER: Clock & Date --- */}
      <div className="text-center mb-8 relative">
        <h1 className="text-xl font-bold text-zinc-500 tracking-[0.3em] uppercase mb-4">Attendance Tracker</h1>
        <div className="relative inline-block">
          <p className="text-9xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-200 tracking-tighter drop-shadow-[0_0_40px_rgba(255,255,255,0.3)] font-mono leading-none scale-y-110">
            {formatTime(currentTime)}
          </p>
        </div>
        <div className="mt-6">
          <p className="text-2xl text-white font-medium tracking-widest uppercase drop-shadow-[0_0_10px_rgba(255,255,255,0.6)]">
            {formatDate(currentTime)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
        {/* --- LEFT COLUMN: Status & Summary --- */}
        <div className="space-y-6">
          {/* Status Card */}
          <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 relative overflow-hidden group hover:border-white/20 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

            <h2 className="text-zinc-400 text-xs font-bold uppercase tracking-[0.2em] mb-6">Current Status</h2>

            <div className="flex flex-col items-center justify-center">
              {loading ? (
                <div className="w-40 h-40 rounded-full border-4 border-white/10 border-t-violet-500 animate-spin flex items-center justify-center"></div>
              ) : (
                <>
                  {attendanceStatus?.status === 'punched-in' && (
                    <div className="relative">
                      <div className="w-40 h-40 rounded-full border-4 border-emerald-500/30 flex items-center justify-center relative z-10 bg-emerald-500/5 shadow-[0_0_50px_rgba(16,185,129,0.2)]">
                        <div className="absolute inset-0 rounded-full border-4 border-emerald-500 border-t-transparent animate-pulse opacity-50"></div>
                        <div className="flex flex-col items-center">
                          <CheckCircle className="h-10 w-10 text-emerald-400 mb-2 drop-shadow-[0_0_10px_rgba(52,211,153,0.5)]" />
                          <span className="text-emerald-400 font-bold text-lg tracking-wider">ACTIVE</span>
                        </div>
                      </div>
                      <div className="absolute -inset-4 bg-emerald-500/20 rounded-full blur-2xl -z-10 animate-pulse"></div>
                    </div>
                  )}
                  {attendanceStatus?.status === 'punched-out' && (
                    <div className="relative">
                      <div className="w-40 h-40 rounded-full border-4 border-blue-500/30 flex items-center justify-center relative z-10 bg-blue-500/5 shadow-[0_0_50px_rgba(59,130,246,0.2)]">
                        <div className="flex flex-col items-center">
                          <Square className="h-10 w-10 text-blue-400 mb-2 fill-current opacity-80" />
                          <span className="text-blue-400 font-bold text-lg tracking-wider">DONE</span>
                        </div>
                      </div>
                    </div>
                  )}
                  {attendanceStatus?.status === 'not-punched' && (
                    <div className="relative">
                      <div className="w-40 h-40 rounded-full border-4 border-zinc-700 dashed flex items-center justify-center relative z-10 bg-zinc-800/20">
                        <div className="flex flex-col items-center">
                          <Play className="h-10 w-10 text-zinc-500 mb-2 ml-1" />
                          <span className="text-zinc-500 font-bold text-sm tracking-widest uppercase mt-1">Ready</span>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              <div className="mt-8 text-center space-y-1">
                {attendanceStatus?.status === 'punched-in' && (
                  <>
                    <p className="text-zinc-400 text-sm">Clocked in at <span className="text-white font-mono font-bold">{new Date(attendanceStatus.attendance.punchIn.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></p>
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 mt-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
                      <span className="text-emerald-400 font-mono font-bold text-lg">{getWorkingHours()}</span>
                    </div>
                  </>
                )}
                {attendanceStatus?.status === 'punched-out' && (
                  <div>
                    <p className="text-zinc-400 text-sm">Total Duration</p>
                    <p className="text-2xl font-mono font-bold text-white mt-1 drop-shadow-md">{attendanceStatus.attendance.formattedWorkingHours || getWorkingHours()}</p>
                  </div>
                )}
                {attendanceStatus?.status === 'not-punched' && <p className="text-zinc-500 text-sm">Start your day by punching in.</p>}
              </div>
            </div>
          </div>

          {/* Mini Summary Stats */}
          {attendanceStatus?.attendance && (
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-black/20 backdrop-blur-md border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center hover:bg-white/5 transition-colors">
                <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-1">In Time</span>
                <span className="text-white font-mono font-bold">
                  {attendanceStatus.attendance.punchIn?.time
                    ? new Date(attendanceStatus.attendance.punchIn.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : '--:--'}
                </span>
              </div>
              <div className="bg-black/20 backdrop-blur-md border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center hover:bg-white/5 transition-colors">
                <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-1">Out Time</span>
                <span className="text-white font-mono font-bold">
                  {attendanceStatus.attendance.punchOut?.time
                    ? new Date(attendanceStatus.attendance.punchOut.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : '--:--'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* --- RIGHT COLUMN: Actions --- */}
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 relative flex flex-col justify-center h-full min-h-[450px]">
          <h2 className="text-zinc-400 text-xs font-bold uppercase tracking-[0.2em] mb-8 absolute top-8 left-8">Action Console</h2>

          <div className="space-y-6 w-full max-w-sm mx-auto">
            {/* Location Select */}
            <div>
              <label className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-2 block ml-1">Location</label>
              <div className="relative group">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500 group-hover:text-white transition-colors" />
                <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-zinc-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full pl-12 pr-10 py-4 bg-zinc-900/50 border border-white/10 rounded-2xl text-white font-medium focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 transition-all appearance-none cursor-pointer hover:bg-zinc-900/80"
                  disabled={attendanceStatus?.status === 'punched-out'}
                >
                  <option value="Office">Office Headquarters</option>
                  <option value="Home">Work from Home</option>
                  <option value="Client Site">Client Site</option>
                  <option value="Field Work">Field Work</option>
                </select>
              </div>
            </div>

            {/* Notes Input */}
            <div>
              <label className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-2 block ml-1">Notes</label>
              <div className="relative">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add optional notes..."
                  className="w-full px-5 py-4 bg-zinc-900/50 border border-white/10 rounded-2xl text-white focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 transition-all resize-none placeholder-zinc-600 block"
                  rows="2"
                  disabled={attendanceStatus?.status === 'punched-out'}
                  maxLength="200"
                />
                <div className="absolute bottom-2 right-3 text-[9px] text-zinc-600 font-bold bg-black/20 px-1.5 py-0.5 rounded">
                  {notes.length}/200
                </div>
              </div>
            </div>

            {/* Dynamic Main Action Button */}
            <div className="pt-4">
              {attendanceStatus?.canPunchIn && (
                <button
                  onClick={handlePunchIn}
                  disabled={punchLoading}
                  className="group relative w-full flex items-center justify-center px-6 py-5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-2xl transition-all shadow-lg hover:shadow-[0_0_30px_rgba(124,58,237,0.4)] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out skew-y-6"></div>
                  {punchLoading ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                  ) : (
                    <span className="flex items-center text-lg font-bold tracking-wide relative z-10">
                      <Play className="h-5 w-5 mr-3 fill-current" /> PUNCH IN
                    </span>
                  )}
                </button>
              )}

              {attendanceStatus?.canPunchOut && (
                <button
                  onClick={handlePunchOut}
                  disabled={punchLoading}
                  className="group relative w-full flex items-center justify-center px-6 py-5 bg-gradient-to-r from-rose-600 to-red-600 text-white rounded-2xl transition-all shadow-lg hover:shadow-[0_0_30px_rgba(225,29,72,0.4)] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out skew-y-6"></div>
                  {punchLoading ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                  ) : (
                    <span className="flex items-center text-lg font-bold tracking-wide relative z-10">
                      <Square className="h-5 w-5 mr-3 fill-current" /> PUNCH OUT
                    </span>
                  )}
                </button>
              )}
            </div>

            {/* Break Controls */}
            {attendanceStatus?.status === 'punched-in' && (
              <div className="border-t border-white/5 pt-6 mt-4">
                <div className="flex gap-2">
                  {!onBreak && (
                    <div className="flex-1">
                      <select
                        value={breakType}
                        onChange={(e) => setBreakType(e.target.value)}
                        className="w-full px-3 py-3 bg-black/20 border border-white/5 rounded-xl text-zinc-300 text-sm focus:outline-none hover:bg-black/40 transition-colors"
                      >
                        <option value="lunch">Lunch</option>
                        <option value="tea">Tea</option>
                        <option value="personal">Personal</option>
                      </select>
                    </div>
                  )}
                  <button
                    onClick={handleBreakToggle}
                    disabled={punchLoading}
                    className={`flex-1 flex items-center justify-center px-4 py-3 rounded-xl text-sm font-bold transition-all ${onBreak
                      ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30 hover:bg-amber-500/30'
                      : 'bg-zinc-800 text-zinc-400 border border-white/5 hover:text-white hover:bg-zinc-700'
                      }`}
                  >
                    <Coffee className="h-4 w-4 mr-2" />
                    {onBreak ? 'End Break' : 'Take Break'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendancePunch;
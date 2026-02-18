
import React, { useState, useEffect, useMemo, useRef } from 'react';
// Fix: Clean up react-router-dom imports to resolve "no exported member" errors.
import { 
  HashRouter, 
  Routes, 
  Route, 
  Link, 
  useNavigate,
  Navigate,
  useLocation
} from 'react-router-dom';
// Fix: Add missing UserPlus icon to the lucide-react import list.
import { 
  LayoutDashboard, 
  Users, 
  UserPlus,
  Calendar, 
  CheckCircle2, 
  LogOut, 
  Trophy,
  TrendingUp,
  Clock,
  Loader2,
  Moon,
  Sun,
  Settings as SettingsIcon,
  BellRing,
  X,
  ShieldAlert,
  QrCode,
  Zap,
  Bell,
  Megaphone,
  ChartBar,
  GraduationCap,
  Camera,
  Image as ImageIcon,
  Info
} from 'lucide-react';
import { 
  collection, 
  onSnapshot, 
  doc, 
  updateDoc, 
  increment, 
  query, 
  where,
  getDoc 
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { SEMESTER_CONFIG, DEPARTMENTS, FULL_SCHEDULE } from './constants';
import { StatCard } from './components/StatCard';
import { AttendanceChart } from './components/AttendanceChart';
import { QRScanner } from './components/QRScanner';
import { generateDepartmentReport } from './services/pdfService';
import { authService, UserProfile } from './services/authService';
import { getAdminReport } from './services/geminiService';

// --- Utility Components ---
const Avatar = ({ src, seed, className }: { src?: string, seed: string, className?: string }) => {
  const finalSrc = src || `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
  return (
    <img 
      src={finalSrc} 
      alt="Avatar" 
      className={`object-cover bg-slate-200 dark:bg-slate-800 ${className}`} 
      onError={(e) => { (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`; }}
    />
  );
};

// --- Custom Hooks ---
const useStudentData = () => {
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "users"), where("role", "==", "student"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const studentList = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as UserProfile[];
      setStudents(studentList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { students, loading };
};

const useNotifications = () => {
  const [activeToasts, setActiveToasts] = useState<{id: string, title: string, message: string, type?: 'info' | 'success' | 'error'}[]>([]);

  const addToast = (title: string, message: string, type: 'info' | 'success' | 'error' = 'info') => {
    const id = Math.random().toString(36).substring(7);
    setActiveToasts(prev => [...prev, { id, title, message, type }]);
    setTimeout(() => removeToast(id), 6000);
  };

  const removeToast = (id: string) => {
    setActiveToasts(prev => prev.filter(t => t.id !== id));
  };

  return { activeToasts, removeToast, addToast };
};

// --- Global UI Components ---

const ToastContainer = ({ toasts, remove }: { toasts: any[], remove: (id: string) => void }) => (
  <div className="fixed bottom-24 md:bottom-8 right-4 left-4 md:left-auto md:right-8 z-[200] flex flex-col gap-4 pointer-events-none">
    {toasts.map(t => (
      <div 
        key={t.id} 
        className={`backdrop-blur-2xl bg-white/90 dark:bg-slate-900/90 text-slate-900 dark:text-white p-5 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] border ${t.type === 'error' ? 'border-red-500/30' : (t.type === 'success' ? 'border-emerald-500/30' : 'border-indigo-500/30')} w-full md:w-96 animate-in slide-in-from-bottom md:slide-in-from-right duration-500 flex gap-4 pointer-events-auto transition-all`}
      >
        <div className={`${t.type === 'error' ? 'bg-red-500' : (t.type === 'success' ? 'bg-emerald-500' : 'bg-indigo-600')} p-3 rounded-2xl h-fit shadow-lg text-white`}>
          <BellRing size={20} />
        </div>
        <div className="flex-1">
          <h4 className="font-extrabold text-xs uppercase tracking-wider mb-1">{t.title}</h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{t.message}</p>
        </div>
        <button onClick={() => remove(t.id)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors h-fit p-1">
          <X size={16} />
        </button>
      </div>
    ))}
  </div>
);

const ProtectedRoute = ({ children, role }: { children?: React.ReactNode, role: 'student' | 'admin' }) => {
  const user = authService.getCurrentUser();
  if (!user) return <Navigate to="/" replace />;
  if (user.role !== role) return <Navigate to={`/${user.role}`} replace />;
  return <>{children}</>;
};

const Header = ({ title, user, darkMode, setDarkMode }: { 
  title: string, user: UserProfile | null, darkMode: boolean, setDarkMode: (val: boolean) => void 
}) => (
  <header className="h-20 md:h-24 px-6 md:px-12 flex items-center justify-between sticky top-0 z-40 bg-slate-50/80 dark:bg-[#020617]/80 backdrop-blur-xl transition-all duration-500">
    <div className="flex flex-col">
      <h2 className="text-xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">{title}</h2>
      <p className="text-[10px] md:text-xs font-bold text-indigo-500 dark:text-amber-500 uppercase tracking-widest mt-1 opacity-80">
        All Nations University Portal
      </p>
    </div>
    
    <div className="flex items-center gap-4 md:gap-8">
      <button 
        onClick={() => setDarkMode(!darkMode)}
        className="p-3 rounded-2xl bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-amber-500 transition-all border border-slate-200 dark:border-slate-800 shadow-sm"
      >
        {darkMode ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      <div className="flex items-center gap-4 pl-4 md:pl-8 border-l border-slate-200 dark:border-slate-800">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight leading-none truncate max-w-[120px]">
            {user?.firstName} {user?.surname}
          </p>
          <span className="inline-block mt-1.5 px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-[9px] font-black uppercase rounded-md border border-indigo-100 dark:border-indigo-900/50">
            {user?.role || 'Student'}
          </span>
        </div>
        <div className="relative group shrink-0">
          <Avatar 
            src={user?.profilePicture} 
            seed={user?.firstName || 'User'} 
            className="relative w-10 h-10 md:w-14 md:h-14 rounded-full border-2 border-white dark:border-slate-900 shadow-xl" 
          />
        </div>
      </div>
    </div>
  </header>
);

const Sidebar = ({ role, user }: { role: 'student' | 'admin', user: UserProfile | null }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const handleLogout = async () => { await authService.logout(); navigate('/'); };

  const menuItems = [
    { to: `/${role}`, icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    ...(role === 'student' ? [
      { to: "/student/notifications", icon: <Bell size={20} />, label: 'Announcements' },
    ] : []),
    ...(role === 'admin' ? [
      { to: "/admin/students", icon: <Users size={20} />, label: 'Directory' },
      { to: "/admin/scan", icon: <QrCode size={20} />, label: 'Quick Scan' },
    ] : []),
    { to: `/${role}/settings`, icon: <SettingsIcon size={20} />, label: 'Security & Profile' }
  ];

  return (
    <div className="w-80 bg-white dark:bg-[#020617] flex-shrink-0 flex flex-col hidden lg:flex border-r border-slate-200 dark:border-white/5 transition-all duration-500">
      <div className="p-10 flex flex-col h-full">
        <div className="flex items-center gap-4 mb-14">
          <div className="bg-indigo-600 p-3 rounded-[20px] shadow-xl shadow-indigo-600/20">
            <GraduationCap size={28} className="text-white" />
          </div>
          <div className="flex flex-col">
            <h1 className="font-extrabold text-2xl tracking-tighter leading-none dark:text-white">ANU</h1>
            <span className="text-[11px] font-extrabold text-indigo-500 uppercase tracking-widest mt-1">Chaplaincy Office</span>
          </div>
        </div>
        
        <nav className="space-y-3 flex-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <Link 
                key={item.to}
                to={item.to} 
                className={`group flex items-center gap-4 p-4 rounded-3xl transition-all duration-300 relative ${isActive ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5'}`}
              >
                <div className={`${isActive ? 'text-white' : 'group-hover:scale-110'} transition-transform`}>{item.icon}</div>
                <span className="text-xs font-extrabold uppercase tracking-wider">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        
        <div className="mt-auto pt-10 border-t border-slate-100 dark:border-white/5">
          <button onClick={handleLogout} className="w-full flex items-center gap-4 p-5 rounded-3xl bg-red-50 dark:bg-red-500/5 hover:bg-red-100 dark:hover:bg-red-500/10 text-red-500 transition-all font-extrabold text-xs uppercase tracking-widest group">
            <LogOut size={22} className="group-hover:-translate-x-1 transition-transform" />
            <span>End Session</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const StudentDashboard = ({ darkMode, setDarkMode }: { darkMode: boolean, setDarkMode: (v: boolean) => void }) => {
  const user = authService.getCurrentUser();
  const [profile, setProfile] = useState<UserProfile | null>(user);
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = onSnapshot(doc(db, "users", user.id), (doc) => {
      if (doc.exists()) {
        const updated = doc.data() as UserProfile;
        setProfile(updated);
        authService.syncLocalProfile(updated);
      }
    });
    return () => unsubscribe();
  }, [user]);

  const currentDay = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const todaySession = FULL_SCHEDULE.find(s => s.day === currentDay);

  if (!profile) return null;

  return (
    <div className="flex-1 overflow-y-auto pb-28 lg:pb-0">
      <Header title="Identity Overview" user={profile} darkMode={darkMode} setDarkMode={setDarkMode} />
      <main className="p-6 md:p-12 space-y-10 max-w-7xl mx-auto">
        <div className="relative group overflow-hidden bg-white dark:bg-slate-900/50 p-8 md:p-12 rounded-4xl border border-slate-200 dark:border-white/5 shadow-[0_30px_60px_-12px_rgba(0,0,0,0.05)] flex flex-col lg:flex-row items-center gap-10 lg:gap-14">
          <div className="relative shrink-0">
            <Avatar 
              src={profile.profilePicture} 
              seed={profile.firstName} 
              className="relative w-32 h-32 md:w-44 md:h-44 rounded-4xl border-4 border-white dark:border-slate-800 shadow-2xl" 
            />
          </div>
          <div className="flex-1 text-center lg:text-left relative z-10 space-y-6">
            <div>
              <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tighter mb-2">{profile.firstName} {profile.surname}</h2>
              <div className="flex flex-wrap justify-center lg:justify-start gap-3">
                <span className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-950 text-[10px] font-black uppercase tracking-widest rounded-xl">{profile.indexNumber}</span>
                <span className="px-4 py-2 bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl">{profile.semester}</span>
              </div>
            </div>
            {todaySession ? (
              <div className="inline-flex items-center gap-3 px-6 py-3 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl border border-emerald-100 dark:border-emerald-500/20">
                <Zap size={18} />
                <span className="text-xs font-black uppercase tracking-widest">Today: {todaySession.type} at {todaySession.time}</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-3 px-6 py-3 bg-slate-100 dark:bg-white/5 text-slate-500 rounded-2xl">
                <Info size={18} />
                <span className="text-xs font-black uppercase tracking-widest">No Mandatory Session Today</span>
              </div>
            )}
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 max-w-xl">
              Member of the <span className="font-extrabold text-indigo-600 dark:text-indigo-400">{profile.department}</span>. 
              Participation is mandatory for Mon, Tue, Thu, Fri (Devotion) and Wed (Chapel).
            </p>
            <button 
              onClick={() => setShowQR(true)}
              className="group relative flex items-center justify-center gap-3 px-10 py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-3xl text-[12px] font-extrabold uppercase tracking-[0.1em] transition-all shadow-[0_15px_30px_-5px_rgba(79,70,229,0.4)] hover:-translate-y-1 active:scale-95 mx-auto lg:mx-0"
            >
              <QrCode size={20} /> My Identity Pass
            </button>
          </div>
          <div className="w-full lg:w-72 bg-slate-50 dark:bg-slate-800 p-8 rounded-4xl shadow-inner text-center lg:text-right border border-white dark:border-slate-700 shrink-0">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500 mb-3">Spiritual Mark</p>
            <div className="flex items-end justify-center lg:justify-end">
              <span className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white leading-none">
                {((profile.attendanceCount || 0) / 65 * 5).toFixed(2)}
              </span>
              <span className="text-lg md:text-2xl font-bold text-slate-400 dark:text-slate-600 mb-1 ml-2">/ 5.0</span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          <StatCard label="Total Sessions" value={profile.attendanceCount || 0} icon={<Calendar size={24} />} color="bg-indigo-600" />
          <StatCard label="Consistency Rate" value={`${(((profile.attendanceCount || 0) / 65) * 100).toFixed(0)}%`} icon={<TrendingUp size={24} />} color="bg-emerald-500" />
          <StatCard label="Cap Mark" value="5.0" icon={<Trophy size={24} />} color="bg-amber-500" />
          <StatCard label="Goal" value="65" icon={<Clock size={24} />} color="bg-slate-800" />
        </div>
        <div className="bg-white dark:bg-slate-900/50 p-8 md:p-12 rounded-4xl border border-slate-200 dark:border-white/5 shadow-xl">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Weekly Requirement</h3>
              <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-1">ANU Standardized Schedule</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {FULL_SCHEDULE.map((s) => (
              <div key={s.day} className={`p-6 rounded-3xl border ${s.day === new Date().toLocaleDateString('en-US', { weekday: 'long' }) ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-slate-50 dark:bg-white/5 border-slate-100 dark:border-white/10'}`}>
                <p className={`text-[10px] font-black uppercase tracking-widest ${s.day === new Date().toLocaleDateString('en-US', { weekday: 'long' }) ? 'text-indigo-200' : 'text-slate-400'}`}>{s.day}</p>
                <p className="text-sm font-black mt-2">{s.type}</p>
                <p className={`text-[10px] font-bold mt-1 ${s.day === new Date().toLocaleDateString('en-US', { weekday: 'long' }) ? 'text-indigo-100' : 'text-slate-500'}`}>{s.time}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
      {showQR && (
        <div className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-6" onClick={() => setShowQR(false)}>
          <div className="bg-white dark:bg-slate-900 p-10 md:p-16 rounded-5xl shadow-2xl max-w-sm w-full text-center relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowQR(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-900 dark:hover:text-white">
              <X size={24} />
            </button>
            <div className="p-6 bg-white rounded-3xl mb-8 shadow-inner inline-block">
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${profile.qrToken}`} alt="Secure Pass" className="w-56 h-56 mx-auto" />
            </div>
            <h4 className="text-2xl font-black text-slate-900 dark:text-amber-500 mb-1 tracking-tight">SECURE PASS</h4>
            <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">ID: {profile.indexNumber}</p>
          </div>
        </div>
      )}
    </div>
  );
};

// ... NotificationSettingsView, StudentRegistryView ...

const MarkAttendanceView = ({ darkMode, setDarkMode }: { darkMode: boolean, setDarkMode: (v: boolean) => void }) => {
  const { students } = useStudentData();
  const { addToast } = useNotifications();
  const user = authService.getCurrentUser();
  const lastScannedRef = useRef<string | null>(null);
  const scanTimeoutRef = useRef<number | null>(null);
  const [lastMarked, setLastMarked] = useState<UserProfile | null>(null);
  const [isSuccessState, setIsSuccessState] = useState(false);

  const handleScanSuccess = async (scannedToken: string) => {
    if (lastScannedRef.current === scannedToken) return;
    lastScannedRef.current = scannedToken;
    if (scanTimeoutRef.current) window.clearTimeout(scanTimeoutRef.current);
    scanTimeoutRef.current = window.setTimeout(() => { lastScannedRef.current = null; }, 4000);

    const student = students.find((s) => s.qrToken === scannedToken);
    
    if (student) {
      if ((student.attendanceCount || 0) < SEMESTER_CONFIG.totalSessions) {
        try {
          const studentRef = doc(db, "users", student.id);
          await updateDoc(studentRef, {
            attendanceCount: increment(1)
          });
          setLastMarked({ ...student, attendanceCount: (student.attendanceCount || 0) + 1 });
          setIsSuccessState(true);
          setTimeout(() => setIsSuccessState(false), 2000);
          addToast("Presence Confirmed", `${student.firstName} marked present.`, "success");
        } catch (e) {
          addToast("Sync Error", "Could not reach Firestore servers.", "error");
        }
      } else {
        addToast("Maximum Reached", `${student.firstName} has full attendance.`, "info");
      }
    } else {
      addToast("Access Denied", "Token not valid for ANU records.", "error");
    }
  };

  return (
    <div className="flex-1 overflow-y-auto pb-28 lg:pb-0">
      <Header title="Identity Validation" user={user} darkMode={darkMode} setDarkMode={setDarkMode} />
      <div className="p-6 md:p-12 max-w-7xl mx-auto grid grid-cols-1 xl:grid-cols-12 gap-12 items-start">
        <div className="xl:col-span-7 space-y-10">
          <div className="flex flex-col items-center">
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tighter mb-2">Secure Scan</h2>
            <p className="text-sm text-slate-500 font-medium mb-10">Point sensor at student QR code</p>
            <div className="relative w-full max-w-md">
              {isSuccessState && (
                <div className="absolute inset-0 z-30 bg-emerald-500/20 backdrop-blur-md rounded-[3rem] flex items-center justify-center pointer-events-none">
                  <CheckCircle2 size={80} className="text-emerald-500" />
                </div>
              )}
              <QRScanner onScanSuccess={handleScanSuccess} />
            </div>
          </div>
        </div>
        <div className="xl:col-span-5 space-y-8 w-full">
          <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-500 ml-2">Recent Log</h3>
          {lastMarked ? (
            <div className="bg-white dark:bg-slate-900/50 p-8 rounded-4xl border border-emerald-500/20 flex items-center gap-6">
              <Avatar src={lastMarked.profilePicture} seed={lastMarked.firstName} className="w-20 h-20 rounded-2xl" />
              <div>
                <h4 className="text-lg font-extrabold text-slate-900 dark:text-white">{lastMarked.firstName} {lastMarked.surname}</h4>
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">{lastMarked.indexNumber}</p>
                <div className="mt-3 flex items-center gap-2 text-emerald-500">
                   <Zap size={14} className="fill-current" />
                   <span className="text-xs font-black uppercase">Count: {lastMarked.attendanceCount}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-48 bg-white/40 dark:bg-white/[0.02] rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-white/5 flex flex-col items-center justify-center text-slate-400 space-y-4">
              <ImageIcon size={32} className="opacity-20" />
              <span className="font-black uppercase text-[10px] tracking-widest opacity-50">Ready to Scan</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const NotificationSettingsView = ({ darkMode, setDarkMode }: { darkMode: boolean, setDarkMode: (v: boolean) => void }) => {
  const user = authService.getCurrentUser();
  return (
    <div className="flex-1 overflow-y-auto">
      <Header title="Announcements" user={user} darkMode={darkMode} setDarkMode={setDarkMode} />
      <div className="p-12 text-center text-slate-400">
        <Megaphone size={48} className="mx-auto mb-4 opacity-20" />
        <p className="text-xs font-black uppercase tracking-widest">No active announcements</p>
      </div>
    </div>
  );
};

export const StudentRegistryView = ({ darkMode, setDarkMode }: any) => {
  const { students, loading } = useStudentData();
  const user = authService.getCurrentUser();
  return (
    <div className="flex-1 overflow-y-auto">
      <Header title="Registry" user={user} darkMode={darkMode} setDarkMode={setDarkMode} />
      <div className="p-12">
        <div className="bg-white dark:bg-slate-900 rounded-4xl overflow-hidden border border-slate-200 dark:border-white/5">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-400">
              <tr><th className="px-8 py-6">Student</th><th className="px-8 py-6">Dept</th><th className="px-8 py-6">Count</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {students.map(s => (
                <tr key={s.id} className="dark:text-white text-sm"><td className="px-8 py-4 font-bold">{s.firstName} {s.surname}</td><td className="px-8 py-4">{s.department}</td><td className="px-8 py-4 font-black">{s.attendanceCount}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export const AdminDashboard = ({ darkMode, setDarkMode }: any) => {
  const { students } = useStudentData();
  const user = authService.getCurrentUser();
  return (
    <div className="flex-1 overflow-y-auto">
      <Header title="Mission Control" user={user} darkMode={darkMode} setDarkMode={setDarkMode} />
      <div className="p-12 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <StatCard label="Total Students" value={students.length} icon={<Users size={24} />} color="bg-indigo-600" />
          <StatCard label="Today's Active" value="Pending" icon={<Clock size={24} />} color="bg-amber-500" />
          <StatCard label="System Integrity" value="OK" icon={<CheckCircle2 size={24} />} color="bg-emerald-500" />
        </div>
      </div>
    </div>
  );
};

const LoginView = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const profile = await authService.login(email, password);
      if (profile) navigate(`/${profile.role}`);
    } catch (err: any) {
      setError(err.message || "Failed to login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 p-10 rounded-4xl shadow-xl border border-slate-200 dark:border-white/5">
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="bg-indigo-600 p-4 rounded-3xl mb-4 shadow-lg shadow-indigo-600/20"><GraduationCap size={32} className="text-white" /></div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Portal Entry</h2>
          <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-1">All Nations University</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-6">
          {error && <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-2xl text-red-500 text-xs font-bold">{error}</div>}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Email</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-sm dark:text-white" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Password</label>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-sm dark:text-white" />
          </div>
          <button type="submit" disabled={loading} className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-2">
            {loading ? <Loader2 size={16} className="animate-spin" /> : "Sign In"}
          </button>
        </form>
        <div className="mt-8 text-center"><Link to="/register" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-colors">Request Account</Link></div>
      </div>
    </div>
  );
};

const RegisterView = () => {
  const [formData, setFormData] = useState({ firstName: '', surname: '', email: '', password: '', indexNumber: '', department: DEPARTMENTS[0], semester: 'Semester One', role: 'student' as 'student' | 'admin' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const profile = await authService.register(formData);
      if (profile) navigate(`/${profile.role}`);
    } catch (err: any) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950 overflow-y-auto">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 p-10 rounded-4xl shadow-xl border border-slate-200 dark:border-white/5 my-10">
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="bg-amber-500 p-4 rounded-3xl mb-4 shadow-lg shadow-amber-500/20"><UserPlus size={32} className="text-white" /></div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Registration</h2>
          <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mt-1">ANU Chaplaincy Account</p>
        </div>
        <form onSubmit={handleRegister} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {error && <div className="md:col-span-2 p-4 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-2xl text-red-500 text-xs font-bold">{error}</div>}
          <div className="space-y-2"><label className="text-[10px] font-black uppercase tracking-widest text-slate-400">First Name</label><input required value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border dark:text-white" /></div>
          <div className="space-y-2"><label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Surname</label><input required value={formData.surname} onChange={e => setFormData({...formData, surname: e.target.value})} className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border dark:text-white" /></div>
          <div className="space-y-2"><label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Email</label><input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border dark:text-white" /></div>
          <div className="space-y-2"><label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Password</label><input type="password" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border dark:text-white" /></div>
          <div className="space-y-2"><label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Index No</label><input required value={formData.indexNumber} onChange={e => setFormData({...formData, indexNumber: e.target.value})} className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border dark:text-white" /></div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Dept</label>
            <select value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border dark:text-white appearance-none">
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="md:col-span-2 pt-4 flex flex-col gap-4">
            <div className="flex gap-4">
              <button type="button" onClick={() => setFormData({...formData, role: 'student'})} className={`flex-1 py-4 rounded-2xl border-2 transition-all font-black text-[10px] uppercase ${formData.role === 'student' ? 'border-amber-500 bg-amber-50 text-amber-600' : 'border-slate-100 dark:border-slate-800 text-slate-400'}`}>Student</button>
              <button type="button" onClick={() => setFormData({...formData, role: 'admin'})} className={`flex-1 py-4 rounded-2xl border-2 transition-all font-black text-[10px] uppercase ${formData.role === 'admin' ? 'border-amber-500 bg-amber-50 text-amber-600' : 'border-slate-100 dark:border-slate-800 text-slate-400'}`}>Admin</button>
            </div>
            <button type="submit" disabled={loading} className="w-full py-5 bg-amber-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px]">{loading ? <Loader2 size={16} className="animate-spin mx-auto" /> : "Create Identity"}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const SettingsView = ({ role, darkMode, setDarkMode }: { role: 'student' | 'admin', darkMode: boolean, setDarkMode: (v: boolean) => void }) => {
  const user = authService.getCurrentUser();
  const navigate = useNavigate();
  const handleLogout = async () => { await authService.logout(); navigate('/'); };
  return (
    <div className="flex-1 overflow-y-auto">
      <Header title="Settings" user={user} darkMode={darkMode} setDarkMode={setDarkMode} />
      <div className="p-12 max-w-2xl mx-auto space-y-8">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-4xl border border-slate-100 dark:border-white/5">
          <h3 className="text-xl font-black mb-6 dark:text-white">Profile</h3>
          <div className="flex items-center gap-6"><Avatar seed={user?.firstName || 'U'} className="w-20 h-20 rounded-2xl" /><div><p className="font-black dark:text-white">{user?.firstName} {user?.surname}</p><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{user?.indexNumber}</p></div></div>
        </div>
        <button onClick={handleLogout} className="w-full p-8 rounded-4xl bg-red-50 dark:bg-red-500/10 text-red-500 font-black uppercase tracking-widest text-[10px]">Logout</button>
      </div>
    </div>
  );
};

const BottomNav = ({ role, user }: { role: 'student' | 'admin', user: UserProfile | null }) => {
  const location = useLocation();
  const menuItems = [
    { to: `/${role}`, icon: <LayoutDashboard size={20} />, label: 'Home' },
    ...(role === 'student' ? [{ to: "/student/notifications", icon: <Bell size={20} />, label: 'Alerts' }] : [{ to: "/admin/scan", icon: <QrCode size={20} />, label: 'Scan' }]),
    { to: `/${role}/settings`, icon: <SettingsIcon size={20} />, label: 'User' }
  ];
  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-[#020617]/80 backdrop-blur-xl border-t border-slate-200 dark:border-white/10 px-6 py-4 flex items-center justify-around z-50">
      {menuItems.map((item) => {
        const isActive = location.pathname === item.to;
        return (
          <Link key={item.to} to={item.to} className={`flex flex-col items-center gap-1 ${isActive ? 'text-indigo-600 dark:text-amber-500' : 'text-slate-400'}`}>
            {item.icon}<span className="text-[8px] font-black uppercase tracking-widest">{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
};

const App = () => {
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('anu_theme') === 'dark');
  const { activeToasts, removeToast } = useNotifications();
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(authService.getCurrentUser());

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const profile = userDoc.data() as UserProfile;
          setCurrentUser(profile);
          authService.syncLocalProfile(profile);
        }
      } else {
        setCurrentUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (darkMode) { document.documentElement.classList.add('dark'); localStorage.setItem('anu_theme', 'dark'); }
    else { document.documentElement.classList.remove('dark'); localStorage.setItem('anu_theme', 'light'); }
  }, [darkMode]);

  return (
    <HashRouter>
      <div className="min-h-screen bg-slate-50 dark:bg-[#020617] transition-colors duration-500 flex flex-col lg:flex-row overflow-hidden">
        <Routes>
          <Route path="/" element={<LoginView />} />
          <Route path="/register" element={<RegisterView />} />
          <Route path="/student/*" element={<ProtectedRoute role="student"><Sidebar role="student" user={currentUser} /><div className="flex-1 flex flex-col overflow-hidden relative"><Routes><Route path="/" element={<StudentDashboard darkMode={darkMode} setDarkMode={setDarkMode} />} /><Route path="/notifications" element={<NotificationSettingsView darkMode={darkMode} setDarkMode={setDarkMode} />} /><Route path="/settings" element={<SettingsView role="student" darkMode={darkMode} setDarkMode={setDarkMode} />} /></Routes><BottomNav role="student" user={currentUser} /></div></ProtectedRoute>} />
          <Route path="/admin/*" element={<ProtectedRoute role="admin"><Sidebar role="admin" user={currentUser} /><div className="flex-1 flex flex-col overflow-hidden relative"><Routes><Route path="/" element={<AdminDashboard darkMode={darkMode} setDarkMode={setDarkMode} />} /><Route path="/students" element={<StudentRegistryView darkMode={darkMode} setDarkMode={setDarkMode} />} /><Route path="/scan" element={<MarkAttendanceView darkMode={darkMode} setDarkMode={setDarkMode} />} /><Route path="/settings" element={<SettingsView role="admin" darkMode={darkMode} setDarkMode={setDarkMode} />} /></Routes><BottomNav role="admin" user={currentUser} /></div></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <ToastContainer toasts={activeToasts} remove={removeToast} />
      </div>
    </HashRouter>
  );
};

export default App;

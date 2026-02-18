
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  HashRouter as Router, 
  Routes, 
  Route, 
  Link, 
  useNavigate,
  Navigate,
  useLocation
} from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  CheckCircle2, 
  LogOut, 
  BookOpen,
  Trophy,
  ShieldCheck,
  TrendingUp,
  Clock,
  Loader2,
  Moon,
  Sun,
  Plus,
  FileDown,
  UserPlus,
  Settings as SettingsIcon,
  BellRing,
  X,
  ShieldAlert,
  QrCode,
  Zap,
  Check,
  Ban,
  Bell,
  Megaphone,
  ChartBar,
  GraduationCap,
  Camera,
  Image as ImageIcon
} from 'lucide-react';
import { 
  collection, 
  onSnapshot, 
  doc, 
  updateDoc, 
  increment, 
  query, 
  where,
  getDoc // Added missing getDoc import
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { SEMESTER_CONFIG, DEPARTMENTS } from './constants';
import { StatCard } from './components/StatCard';
import { AttendanceChart } from './components/AttendanceChart';
import { QRScanner } from './components/QRScanner';
import { generateDepartmentReport, generateMonthlySchedulePDF } from './services/pdfService';
import { authService, UserProfile } from './services/authService';
import { getAdminReport } from './services/geminiService';

// --- Global Constants ---
const NOTIFICATION_PREFS_KEY = 'anu_notif_prefs';

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
          <div className="absolute -inset-1.5 bg-gradient-to-tr from-indigo-500 to-amber-500 rounded-full blur opacity-20 group-hover:opacity-40 transition duration-300"></div>
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
      { to: "/admin/calendar", icon: <Calendar size={20} />, label: 'Scheduling' },
      { to: "/admin/approvals", icon: <ShieldCheck size={20} />, label: 'Access Control' }
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
                {isActive && (
                    <div className="absolute right-4 w-1.5 h-1.5 bg-white rounded-full"></div>
                )}
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
    // Real-time listener for this specific student profile
    const unsubscribe = onSnapshot(doc(db, "users", user.id), (doc) => {
      if (doc.exists()) {
        const updated = doc.data() as UserProfile;
        setProfile(updated);
        authService.syncLocalProfile(updated);
      }
    });
    return () => unsubscribe();
  }, [user]);

  if (!profile) return null;

  return (
    <div className="flex-1 overflow-y-auto pb-28 lg:pb-0">
      <Header title="Identity Overview" user={profile} darkMode={darkMode} setDarkMode={setDarkMode} />
      <main className="p-6 md:p-12 space-y-10 max-w-7xl mx-auto">
        
        <div className="relative group overflow-hidden bg-white dark:bg-slate-900/50 p-8 md:p-12 rounded-4xl border border-slate-200 dark:border-white/5 shadow-[0_30px_60px_-12px_rgba(0,0,0,0.05)] dark:shadow-none flex flex-col lg:flex-row items-center gap-10 lg:gap-14">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none"></div>
          
          <div className="relative shrink-0">
            <div className="absolute -inset-4 bg-gradient-to-tr from-indigo-500 to-amber-500 rounded-5xl blur-2xl opacity-20 group-hover:opacity-40 transition duration-700"></div>
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
            
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 max-w-xl">
              Member of the <span className="font-extrabold text-indigo-600 dark:text-indigo-400">{profile.department}</span>. 
              Your participation in morning devotions contributes to your overall spiritual evaluation.
            </p>

            <button 
              onClick={() => setShowQR(true)}
              className="group relative flex items-center justify-center gap-3 px-10 py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-3xl text-[12px] font-extrabold uppercase tracking-[0.1em] transition-all shadow-[0_15px_30px_-5px_rgba(79,70,229,0.4)] hover:-translate-y-1 active:scale-95 mx-auto lg:mx-0"
            >
              <QrCode size={20} />
              Identity Verification Code
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
            <div className="mt-6 w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
               <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${((profile.attendanceCount || 0)/65)*100}%` }}></div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          <StatCard label="Total Sessions" value={profile.attendanceCount || 0} icon={<Calendar size={24} />} color="bg-indigo-600" />
          <StatCard label="Consistency Rate" value={`${(((profile.attendanceCount || 0) / 65) * 100).toFixed(0)}%`} icon={<TrendingUp size={24} />} color="bg-emerald-500" />
          <StatCard label="Cap Mark" value="5.0" icon={<Trophy size={24} />} color="bg-amber-500" />
          <StatCard label="Upcoming" value={Math.max(0, 65 - (profile.attendanceCount || 0))} icon={<Clock size={24} />} color="bg-slate-800" />
        </div>
        
        <div className="bg-white dark:bg-slate-900/50 p-8 md:p-12 rounded-4xl border border-slate-200 dark:border-white/5 shadow-[0_30px_60px_-12px_rgba(0,0,0,0.05)] transition-all">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Performance Statistics</h3>
              <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-1">Weekly attendance distribution (13 Weeks)</p>
            </div>
            <div className="hidden md:flex p-2 bg-slate-50 dark:bg-slate-800 rounded-2xl">
              <ChartBar className="text-indigo-500" size={24} />
            </div>
          </div>
          <div className="h-[400px]">
            <AttendanceChart />
          </div>
        </div>
      </main>

      {showQR && (
        <div className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-300" onClick={() => setShowQR(false)}>
          <div className="bg-white dark:bg-slate-900 p-10 md:p-16 rounded-5xl shadow-2xl max-w-sm w-full text-center animate-in zoom-in duration-500 relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowQR(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
              <X size={24} />
            </button>
            <div className="p-6 bg-white rounded-3xl mb-8 shadow-inner inline-block">
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${profile.qrToken}`} alt="Secure Pass" className="w-56 h-56 mx-auto" />
            </div>
            <h4 className="text-2xl font-black text-slate-900 dark:text-amber-500 mb-1 tracking-tight">SECURE IDENTITY TOKEN</h4>
            <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest leading-tight">Cloud-Synchronized Key</p>
          </div>
        </div>
      )}
    </div>
  );
};

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
          addToast("Cloud Verified", `${student.firstName} presence recorded.`, "success");
        } catch (e) {
          addToast("Sync Error", "Could not update cloud record.", "error");
        }
      } else {
        addToast("Quota Met", `${student.firstName} has maxed their marks.`, "info");
      }
    } else {
      addToast("Unauthorized", `This secure token is not recognized.`, "error");
    }
  };

  return (
    <div className="flex-1 overflow-y-auto pb-28 lg:pb-0">
      <Header title="Quick Scan" user={user} darkMode={darkMode} setDarkMode={setDarkMode} />
      <div className="p-6 md:p-12 max-w-7xl mx-auto grid grid-cols-1 xl:grid-cols-12 gap-12 items-start">
        <div className="xl:col-span-7 space-y-10">
          <div className="flex flex-col items-center">
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tighter mb-2">Real-time Validation</h2>
            <p className="text-sm text-slate-500 font-medium mb-10">Optical scan for cloud-synchronized attendance</p>
            <div className="relative w-full max-w-md">
              {isSuccessState && (
                <div className="absolute inset-0 z-30 bg-emerald-500/20 backdrop-blur-md rounded-[3rem] flex items-center justify-center animate-in fade-in zoom-in duration-300 pointer-events-none">
                  <CheckCircle2 size={80} className="text-emerald-500" />
                </div>
              )}
              <QRScanner onScanSuccess={handleScanSuccess} />
            </div>
          </div>
        </div>
        
        <div className="xl:col-span-5 space-y-8 w-full">
          <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-500 ml-2">Verified Stream</h3>
          {lastMarked ? (
            <div className="bg-white dark:bg-slate-900/50 p-8 rounded-4xl border border-slate-200 dark:border-emerald-500/20 flex items-center gap-6 animate-in slide-in-from-right duration-500">
              <Avatar src={lastMarked.profilePicture} seed={lastMarked.firstName} className="w-20 h-20 rounded-2xl shadow-lg" />
              <div>
                <h4 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">{lastMarked.firstName} {lastMarked.surname}</h4>
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">{lastMarked.indexNumber}</p>
                <div className="mt-3 flex items-center gap-2 text-emerald-500">
                   <Zap size={14} className="fill-current" />
                   <span className="text-xs font-black uppercase">Confirmed: {lastMarked.attendanceCount}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-48 bg-white/40 dark:bg-white/[0.02] backdrop-blur-sm rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-white/5 flex flex-col items-center justify-center text-slate-400 space-y-4">
              <ImageIcon size={32} className="opacity-20" />
              <span className="font-black uppercase text-[10px] tracking-widest opacity-50">Awaiting Handshake</span>
            </div>
          )}
          
          <div className="bg-indigo-600 p-8 rounded-4xl shadow-2xl shadow-indigo-600/20 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
            <h4 className="text-lg font-extrabold tracking-tight mb-2">Cloud Infrastructure</h4>
            <p className="text-xs font-medium text-indigo-100 leading-relaxed">
              Firebase Firestore is currently monitoring this session. All optical validations are persisted instantly across the university network.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminDashboard = ({ darkMode, setDarkMode }: any) => {
  const { students, loading } = useStudentData();
  const user = authService.getCurrentUser();
  const [reportSummary, setReportSummary] = useState<string>("");
  const [loadingReport, setLoadingReport] = useState(false);

  const stats = useMemo(() => {
    if (loading || students.length === 0) return null;
    const totalAttendance = students.reduce((acc, curr) => acc + (curr.attendanceCount || 0), 0);
    const avgPercent = (totalAttendance / (students.length * 65) * 100);
    
    const deptStats = DEPARTMENTS.map(d => {
      const s = students.filter(x => x.department === d);
      const a = s.length ? s.reduce((acc, curr) => acc + (curr.attendanceCount || 0), 0) / s.length : 0;
      return { dept: d, avg: (a / 65) * 100 };
    });
    
    const topDept = [...deptStats].sort((a,b) => b.avg - a.avg)[0]?.dept || 'N/A';

    return { totalAttendance, avgPercent, deptStats, topDept };
  }, [students, loading]);

  useEffect(() => {
    if (!stats) return;
    const fetchReport = async () => {
      setLoadingReport(true);
      const report = await getAdminReport({ studentCount: students.length, average: stats.avgPercent.toFixed(1), topDept: stats.topDept });
      setReportSummary(report || "Synchronizing with University Chaplaincy servers...");
      setLoadingReport(false);
    };
    fetchReport();
  }, [stats]);

  if (loading) return <div className="flex-1 flex items-center justify-center"><Loader2 className="animate-spin text-indigo-600" size={40} /></div>;

  return (
    <div className="flex-1 overflow-y-auto pb-28 lg:pb-0">
      <Header title="Mission Control" user={user} darkMode={darkMode} setDarkMode={setDarkMode} />
      <main className="p-6 md:p-12 space-y-10 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          <StatCard label="Enrollment" value={students.length} icon={<Users size={24} />} color="bg-indigo-600" />
          <StatCard label="Mean Participation" value={`${stats?.avgPercent.toFixed(1)}%`} icon={<CheckCircle2 size={24} />} color="bg-emerald-500" />
          <StatCard label="Cloud Log Count" value={stats?.totalAttendance || 0} icon={<Clock size={24} />} color="bg-amber-500" />
          <StatCard label="Leading Unit" value={stats?.topDept.split(' ')[0] || 'N/A'} icon={<Trophy size={24} />} color="bg-slate-800" />
        </div>
        
        <div className="bg-white dark:bg-slate-900/50 p-10 rounded-4xl border border-slate-200 dark:border-white/5 shadow-xl transition-all">
          <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mb-10 flex items-center gap-3">
             <ShieldAlert size={20} className="text-indigo-500" />
             AI Strategic Analysis
          </h3>
          {loadingReport ? (
             <div className="flex flex-col items-center gap-5 py-20">
               <Loader2 className="animate-spin text-indigo-500" size={40} />
               <p className="text-[11px] font-black uppercase text-slate-400 tracking-widest">Parsing cloud metadata...</p>
             </div>
          ) : (
             <div className="p-10 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800 relative overflow-hidden">
               <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500"></div>
               <p className="text-base font-medium text-slate-600 dark:text-slate-300 leading-relaxed italic">
                 "{reportSummary}"
               </p>
             </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats?.deptStats.map(s => (
            <div key={s.dept} className="p-8 bg-white dark:bg-slate-900/40 rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all">
              <p className="text-[10px] font-extrabold uppercase text-slate-400 dark:text-slate-500 mb-2 truncate tracking-wider">{s.dept}</p>
              <div className="flex items-end justify-between">
                <p className="text-3xl font-black text-slate-900 dark:text-white">{s.avg.toFixed(0)}%</p>
                <TrendingUp size={16} className="text-emerald-500 mb-1" />
              </div>
              <div className="mt-6 h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500" style={{ width: `${s.avg}%` }} />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

// --- Missing Views & Components Fix ---

/**
 * LoginView component handles the initial authentication portal.
 */
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
          <div className="bg-indigo-600 p-4 rounded-3xl mb-4 shadow-lg shadow-indigo-600/20">
            <GraduationCap size={32} className="text-white" />
          </div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Welcome Back</h2>
          <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-1 opacity-80">ANU Portal Access</p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-6">
          {error && <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-2xl text-red-500 text-xs font-bold">{error}</div>}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Email Address</label>
            <input 
              type="email" required value={email} onChange={e => setEmail(e.target.value)}
              className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white text-sm"
              placeholder="name@allnationsuniversity.edu.gh"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Secret Key</label>
            <input 
              type="password" required value={password} onChange={e => setPassword(e.target.value)}
              className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white text-sm"
              placeholder="••••••••"
            />
          </div>
          <button 
            type="submit" disabled={loading}
            className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] transition-all shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : "Authorize Access"}
          </button>
        </form>
        <div className="mt-8 text-center">
          <Link to="/register" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-colors">Request New Credentials</Link>
        </div>
      </div>
    </div>
  );
};

/**
 * RegisterView component allows new students or staff to register their identity.
 */
const RegisterView = () => {
  const [formData, setFormData] = useState({
    firstName: '', surname: '', email: '', password: '', indexNumber: '',
    department: DEPARTMENTS[0], semester: 'Semester One', role: 'student' as 'student' | 'admin'
  });
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
          <div className="bg-amber-500 p-4 rounded-3xl mb-4 shadow-lg shadow-amber-500/20">
            <UserPlus size={32} className="text-white" />
          </div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Identity Registration</h2>
          <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mt-1 opacity-80">Join the ANU Spiritual Community</p>
        </div>

        <form onSubmit={handleRegister} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {error && <div className="md:col-span-2 p-4 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-2xl text-red-500 text-xs font-bold">{error}</div>}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">First Name</label>
            <input required value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-amber-500 outline-none transition-all dark:text-white text-sm" placeholder="e.g. Kwame" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Surname</label>
            <input required value={formData.surname} onChange={e => setFormData({...formData, surname: e.target.value})} className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-amber-500 outline-none transition-all dark:text-white text-sm" placeholder="e.g. Osei" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Email</label>
            <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-amber-500 outline-none transition-all dark:text-white text-sm" placeholder="email@example.com" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Password</label>
            <input type="password" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-amber-500 outline-none transition-all dark:text-white text-sm" placeholder="••••••••" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Index Number</label>
            <input required value={formData.indexNumber} onChange={e => setFormData({...formData, indexNumber: e.target.value})} className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-amber-500 outline-none transition-all dark:text-white text-sm" placeholder="ANU2442..." />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Department</label>
            <select value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-amber-500 outline-none transition-all dark:text-white text-sm appearance-none">
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="md:col-span-2 space-y-4 pt-4 border-t border-slate-100 dark:border-white/5">
            <div className="flex gap-4">
               <button type="button" onClick={() => setFormData({...formData, role: 'student'})} className={`flex-1 py-4 rounded-2xl border-2 transition-all text-[10px] font-black uppercase tracking-widest ${formData.role === 'student' ? 'border-amber-500 bg-amber-50 dark:bg-amber-500/10 text-amber-600' : 'border-slate-200 dark:border-slate-800 text-slate-400'}`}>Student</button>
               <button type="button" onClick={() => setFormData({...formData, role: 'admin'})} className={`flex-1 py-4 rounded-2xl border-2 transition-all text-[10px] font-black uppercase tracking-widest ${formData.role === 'admin' ? 'border-amber-500 bg-amber-50 dark:bg-amber-500/10 text-amber-600' : 'border-slate-200 dark:border-slate-800 text-slate-400'}`}>Admin</button>
            </div>
            <button type="submit" disabled={loading} className="w-full py-5 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] transition-all shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2">
              {loading ? <Loader2 size={16} className="animate-spin" /> : "Establish Identity"}
            </button>
          </div>
        </form>
        <div className="mt-8 text-center">
          <Link to="/" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-amber-600 transition-colors">Already registered? Log in</Link>
        </div>
      </div>
    </div>
  );
};

/**
 * SettingsView component for managing user profile and theme settings.
 */
const SettingsView = ({ role, darkMode, setDarkMode }: { role: 'student' | 'admin', darkMode: boolean, setDarkMode: (v: boolean) => void }) => {
  const user = authService.getCurrentUser();
  const navigate = useNavigate();
  const handleLogout = async () => { await authService.logout(); navigate('/'); };

  return (
    <div className="flex-1 overflow-y-auto pb-28 lg:pb-0">
      <Header title="Security & Profile" user={user} darkMode={darkMode} setDarkMode={setDarkMode} />
      <main className="p-6 md:p-12 space-y-10 max-w-4xl mx-auto">
        <section className="bg-white dark:bg-slate-900/50 p-8 rounded-4xl border border-slate-200 dark:border-white/5 space-y-8 shadow-sm">
          <h3 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">Personal Identity</h3>
          <div className="flex items-center gap-6">
            <Avatar src={user?.profilePicture} seed={user?.firstName || 'User'} className="w-24 h-24 rounded-3xl" />
            <div>
              <p className="text-2xl font-black text-slate-900 dark:text-white">{user?.firstName} {user?.surname}</p>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{user?.indexNumber}</p>
            </div>
          </div>
        </section>

        <section className="bg-white dark:bg-slate-900/50 p-8 rounded-4xl border border-slate-200 dark:border-white/5 space-y-6 shadow-sm">
          <h3 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">System Preferences</h3>
          <div className="flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800">
            <div>
              <p className="text-sm font-black text-slate-900 dark:text-white">Interface Mode</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Toggle dark/light theme</p>
            </div>
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className={`w-14 h-8 rounded-full transition-all relative ${darkMode ? 'bg-indigo-600' : 'bg-slate-300'}`}
            >
              <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${darkMode ? 'right-1' : 'left-1'}`} />
            </button>
          </div>
        </section>

        <section className="pt-10 border-t border-slate-200 dark:border-white/5">
           <button onClick={handleLogout} className="w-full flex items-center justify-center gap-4 p-8 rounded-4xl bg-red-50 dark:bg-red-500/5 hover:bg-red-100 dark:hover:bg-red-500/10 text-red-500 transition-all font-black uppercase text-[10px] tracking-[0.2em]">
             <LogOut size={20} />
             Terminate Secure Session
           </button>
        </section>
      </main>
    </div>
  );
};

/**
 * BottomNav component provides navigation on mobile devices.
 */
const BottomNav = ({ role, user }: { role: 'student' | 'admin', user: UserProfile | null }) => {
  const location = useLocation();
  const menuItems = [
    { to: `/${role}`, icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    ...(role === 'student' ? [
      { to: "/student/notifications", icon: <Bell size={20} />, label: 'Notifs' },
    ] : [
      { to: "/admin/scan", icon: <QrCode size={20} />, label: 'Scan' },
      { to: "/admin/students", icon: <Users size={20} />, label: 'Dir' },
    ]),
    { to: `/${role}/settings`, icon: <SettingsIcon size={20} />, label: 'Profile' }
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-[#020617]/80 backdrop-blur-2xl border-t border-slate-200 dark:border-white/10 px-6 py-4 flex items-center justify-around z-50">
      {menuItems.map((item) => {
        const isActive = location.pathname === item.to;
        return (
          <Link 
            key={item.to}
            to={item.to} 
            className={`flex flex-col items-center gap-1.5 transition-all ${isActive ? 'text-indigo-600 dark:text-amber-500' : 'text-slate-400'}`}
          >
            <div className={`${isActive ? 'scale-110' : ''}`}>{item.icon}</div>
            <span className="text-[9px] font-black uppercase tracking-widest">{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
};

const App = () => {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('anu_theme');
    return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });
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
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('anu_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('anu_theme', 'light');
    }
  }, [darkMode]);

  return (
    <Router>
      <div className="min-h-screen bg-slate-50 dark:bg-[#020617] transition-colors duration-500 flex flex-col lg:flex-row overflow-hidden">
        <Routes>
          <Route path="/" element={<LoginView />} />
          <Route path="/register" element={<RegisterView />} />
          
          <Route path="/student/*" element={
            <ProtectedRoute role="student">
              <Sidebar role="student" user={currentUser} />
              <div className="flex-1 flex flex-col overflow-hidden relative">
                <Routes>
                  <Route path="/" element={<StudentDashboard darkMode={darkMode} setDarkMode={setDarkMode} />} />
                  <Route path="/settings" element={<SettingsView role="student" darkMode={darkMode} setDarkMode={setDarkMode} />} />
                </Routes>
                <BottomNav role="student" user={currentUser} />
              </div>
            </ProtectedRoute>
          } />

          <Route path="/admin/*" element={
            <ProtectedRoute role="admin">
              <Sidebar role="admin" user={currentUser} />
              <div className="flex-1 flex flex-col overflow-hidden relative">
                <Routes>
                  <Route path="/" element={<AdminDashboard darkMode={darkMode} setDarkMode={setDarkMode} />} />
                  <Route path="/scan" element={<MarkAttendanceView darkMode={darkMode} setDarkMode={setDarkMode} />} />
                  <Route path="/settings" element={<SettingsView role="admin" darkMode={darkMode} setDarkMode={setDarkMode} />} />
                </Routes>
                <BottomNav role="admin" user={currentUser} />
              </div>
            </ProtectedRoute>
          } />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <ToastContainer toasts={activeToasts} remove={removeToast} />
      </div>
    </Router>
  );
};

export default App;

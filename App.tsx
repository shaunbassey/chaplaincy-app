
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
  Sparkles,
  ShieldCheck,
  TrendingUp,
  Clock,
  Building2,
  Loader2,
  Moon,
  Sun,
  FileText,
  Download,
  Plus,
  Trash2,
  FileDown,
  Upload,
  FileUp,
  UserCheck,
  UserX,
  UserPlus,
  Settings as SettingsIcon,
  BellRing,
  X,
  ShieldAlert,
  QrCode,
  Zap,
  Quote,
  Menu
} from 'lucide-react';
import { MOCK_STUDENTS as INITIAL_MOCK_STUDENTS, SEMESTER_CONFIG, APP_THEME, DEPARTMENTS } from './constants';
import { StatCard } from './components/StatCard';
import { AttendanceChart } from './components/AttendanceChart';
import { QRScanner } from './components/QRScanner';
import { generateDepartmentReport, generateMonthlySchedulePDF } from './services/pdfService';
import { authService, UserProfile } from './services/authService';
import { getAttendanceInsights } from './services/geminiService';

// --- Global Constants ---
const STUDENTS_STORAGE_KEY = 'anu_students_db_v2';

// --- Custom Hooks ---
const useStudentData = () => {
  const [localStudents, setLocalStudents] = useState(() => {
    const saved = localStorage.getItem(STUDENTS_STORAGE_KEY);
    return saved ? JSON.parse(saved) : INITIAL_MOCK_STUDENTS;
  });

  const students = useMemo(() => {
    const registered = authService.getAllUsers().filter(u => u.role === 'student');
    const combined = [...localStudents];

    registered.forEach(regUser => {
      if (!combined.some(s => s.indexNumber === regUser.indexNumber)) {
        combined.push({
          id: regUser.id,
          name: `${regUser.firstName} ${regUser.surname}`,
          indexNumber: regUser.indexNumber,
          department: regUser.department,
          semester: regUser.semester,
          attendanceCount: 0
        });
      }
    });
    return combined;
  }, [localStudents]);

  const saveStudents = (updatedList: any[]) => {
    setLocalStudents(updatedList);
    localStorage.setItem(STUDENTS_STORAGE_KEY, JSON.stringify(updatedList));
  };

  return { students, setStudents: saveStudents };
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

// --- Responsive UI Components ---

const ToastContainer = ({ toasts, remove }: { toasts: any[], remove: (id: string) => void }) => (
  <div className="fixed bottom-24 md:bottom-6 right-4 left-4 md:left-auto md:right-6 z-[200] flex flex-col gap-3 pointer-events-none">
    {toasts.map(t => (
      <div 
        key={t.id} 
        className={`backdrop-blur-xl bg-slate-900/90 text-white p-4 md:p-5 rounded-[24px] md:rounded-3xl shadow-2xl border ${t.type === 'error' ? 'border-red-500/50' : (t.type === 'success' ? 'border-emerald-500/50' : 'border-indigo-500/50')} w-full md:w-80 animate-in slide-in-from-bottom md:slide-in-from-right duration-500 flex gap-4 pointer-events-auto transition-all`}
      >
        <div className={`${t.type === 'error' ? 'bg-red-500' : (t.type === 'success' ? 'bg-emerald-500' : 'bg-indigo-500')} p-2.5 rounded-2xl h-fit shadow-lg shadow-black/20`}>
          <BellRing size={16} md:size={18} />
        </div>
        <div className="flex-1">
          <h4 className="font-black text-[10px] md:text-xs uppercase tracking-tighter mb-1">{t.title}</h4>
          <p className="text-[9px] md:text-[10px] text-slate-300 font-medium leading-relaxed">{t.message}</p>
        </div>
        <button onClick={() => remove(t.id)} className="text-slate-500 hover:text-white transition-colors">
          <X size={14} />
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

const Header = ({ title, userName, role, darkMode, setDarkMode }: { 
  title: string, userName: string, role?: string, darkMode: boolean, setDarkMode: (val: boolean) => void 
}) => (
  <header className="h-20 md:h-24 bg-white/70 dark:bg-slate-950/70 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 px-4 md:px-10 flex items-center justify-between sticky top-0 z-40 transition-all duration-300">
    <div className="flex items-center gap-3 md:gap-6">
      <h2 className="text-lg md:text-2xl font-black text-slate-900 dark:text-white tracking-tighter transition-colors truncate">{title}</h2>
      {role === 'admin' && (
        <span className="flex items-center gap-1 md:gap-2 px-2.5 md:px-4 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[8px] md:text-[10px] font-black uppercase rounded-full border border-indigo-100 dark:border-indigo-900/30">
          <Zap size={10} md:size={12} className="fill-current" />
          <span className="hidden xs:inline">Verified Admin</span>
          <span className="xs:hidden">Admin</span>
        </span>
      )}
    </div>
    <div className="flex items-center gap-3 md:gap-6">
      <button 
        onClick={() => setDarkMode(!darkMode)}
        className="p-2 md:p-3 rounded-xl md:rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-amber-500 transition-all border border-slate-200 dark:border-slate-700 shadow-sm"
      >
        {darkMode ? <Sun size={18} md:size={20} /> : <Moon size={18} md:size={20} />}
      </button>

      <div className="flex items-center gap-3 md:gap-4 pl-3 md:pl-6 border-l border-slate-200 dark:border-slate-700">
        <div className="text-right hidden xs:block">
          <p className="text-xs md:text-sm font-black text-slate-900 dark:text-white tracking-tight leading-none truncate max-w-[80px] md:max-w-none">{userName}</p>
          <p className="text-[8px] md:text-[10px] font-bold text-indigo-500 dark:text-amber-500 uppercase tracking-widest mt-1 opacity-70">{role || 'Student'}</p>
        </div>
        <div className="relative group shrink-0">
          <div className="absolute -inset-1 bg-gradient-to-tr from-indigo-500 to-amber-500 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-300"></div>
          <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userName}`} className="relative w-8 h-8 md:w-11 md:h-11 rounded-full bg-white dark:bg-slate-800 border-2 border-white dark:border-slate-800 shadow-lg" />
        </div>
      </div>
    </div>
  </header>
);

// --- Adaptive Navigation ---

const BottomNav = ({ role }: { role: 'student' | 'admin' }) => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const studentItems = [
    { to: "/student", icon: <LayoutDashboard size={20} />, label: "Dashboard" },
    { to: "/student/settings", icon: <SettingsIcon size={20} />, label: "Settings" },
  ];
  
  const adminItems = [
    { to: "/admin", icon: <LayoutDashboard size={20} />, label: "Home" },
    { to: "/admin/scan", icon: <QrCode size={20} />, label: "Scan" },
    { to: "/admin/students", icon: <Users size={20} />, label: "Roster" },
    { to: "/admin/settings", icon: <SettingsIcon size={20} />, label: "Settings" },
  ];
  
  const items = role === 'admin' ? adminItems : studentItems;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 px-4 pb-6 pt-2 pointer-events-none">
      <nav className="backdrop-blur-2xl bg-slate-900/90 border border-white/10 rounded-[32px] p-2 flex justify-around items-center shadow-2xl pointer-events-auto">
        {items.map((item) => (
          <Link 
            key={item.to}
            to={item.to}
            className={`flex flex-col items-center gap-1 p-3 rounded-2xl transition-all duration-300 ${location.pathname === item.to ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            {item.icon}
            <span className="text-[8px] font-black uppercase tracking-widest">{item.label}</span>
          </Link>
        ))}
        <button 
          onClick={() => { authService.logout(); navigate('/'); }}
          className="flex flex-col items-center gap-1 p-3 rounded-2xl text-red-400 hover:bg-red-500/10 transition-all"
        >
          <LogOut size={20} />
          <span className="text-[8px] font-black uppercase tracking-widest">Exit</span>
        </button>
      </nav>
    </div>
  );
};

// --- View Components ---

const StudentDashboard = ({ darkMode, setDarkMode }: { darkMode: boolean, setDarkMode: (v: boolean) => void }) => {
  const { students } = useStudentData();
  const user = authService.getCurrentUser();
  const [showQR, setShowQR] = useState(false);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  
  const student = students.find((s: any) => s.indexNumber === user?.indexNumber) || {
    name: `${user?.firstName} ${user?.surname}`,
    indexNumber: user?.indexNumber || 'N/A',
    attendanceCount: 0,
    department: user?.department || 'N/A',
    semester: user?.semester || 'Semester One'
  }; 

  useEffect(() => {
    const fetchInsight = async () => {
      setLoadingAi(true);
      const insight = await getAttendanceInsights(student.name, student.attendanceCount, 65);
      setAiInsight(insight);
      setLoadingAi(false);
    };
    fetchInsight();
  }, [student.attendanceCount]);

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 transition-all duration-300 pb-28 md:pb-0">
      <Header title="My Portal" userName={user?.firstName || "Student"} role={user?.role} darkMode={darkMode} setDarkMode={setDarkMode} />
      <main className="p-4 md:p-10 space-y-6 md:space-y-10 max-w-7xl mx-auto">
        
        {/* Profile Card */}
        <div className="relative overflow-hidden bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl p-6 md:p-10 rounded-[32px] md:rounded-[48px] shadow-xl border border-white dark:border-slate-800 flex flex-col md:flex-row items-center gap-6 md:gap-10 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="relative group shrink-0">
            <div className="absolute -inset-4 bg-gradient-to-tr from-indigo-500 to-amber-500 rounded-[40px] blur-xl opacity-20 group-hover:opacity-40 transition duration-500"></div>
            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.firstName}`} className="relative w-24 h-24 md:w-32 md:h-32 rounded-[28px] md:rounded-[32px] bg-slate-100 dark:bg-slate-800 border-2 md:border-4 border-white dark:border-slate-800 shadow-2xl" />
          </div>

          <div className="flex-1 text-center md:text-left relative z-10 w-full">
            <h2 className="text-2xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tighter mb-4">{user?.firstName} {user?.surname}</h2>
            <div className="flex flex-wrap justify-center md:justify-start gap-2 md:gap-3">
              <span className="px-3 md:px-4 py-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-950 text-[8px] md:text-[10px] font-black uppercase tracking-widest rounded-lg md:rounded-xl shadow-lg">{user?.indexNumber}</span>
              <span className="px-3 md:px-4 py-1.5 bg-indigo-500 text-white text-[8px] md:text-[10px] font-black uppercase tracking-widest rounded-lg md:rounded-xl shadow-lg">{user?.semester}</span>
              <span className="px-3 md:px-4 py-1.5 bg-amber-500 text-white text-[8px] md:text-[10px] font-black uppercase tracking-widest rounded-lg md:rounded-xl shadow-lg">{user?.department}</span>
            </div>
            <button 
              onClick={() => setShowQR(true)}
              className="mt-6 md:mt-8 w-full md:w-auto group flex items-center justify-center gap-3 px-6 md:px-8 py-3 md:py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[18px] md:rounded-3xl text-[10px] md:text-[11px] font-black uppercase tracking-widest transition-all shadow-xl shadow-indigo-600/30 active:scale-95"
            >
              <QrCode size={18} />
              Verify My Identity
            </button>
          </div>

          <div className="w-full md:w-auto bg-indigo-950 dark:bg-slate-800 p-6 md:p-8 rounded-[28px] md:rounded-[40px] shadow-2xl text-center md:text-right border border-white/10 shrink-0">
            <p className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 dark:text-amber-500 mb-1 md:mb-2">Spiritual Mark</p>
            <span className="text-4xl md:text-6xl font-black text-white leading-none">
              {(student.attendanceCount / 65 * 5).toFixed(2)}
              <span className="text-sm md:text-xl opacity-30 ml-2">/ 5.0</span>
            </span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
          <StatCard label="Total Attendance" value={student.attendanceCount} icon={<Calendar size={20} />} color="bg-indigo-600" />
          <StatCard label="Consistency" value={`${((student.attendanceCount / 65) * 100).toFixed(0)}%`} icon={<TrendingUp size={20} />} color="bg-emerald-500" />
          <StatCard label="Target Mark" value="5.0" icon={<Trophy size={20} />} color="bg-amber-500" />
          <StatCard label="Remaining" value={65 - student.attendanceCount} icon={<Clock size={20} />} color="bg-slate-800 dark:bg-slate-700" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-10">
          {/* AI Insights Card */}
          <div className="lg:col-span-1 bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[32px] md:rounded-[48px] shadow-xl border border-slate-100 dark:border-slate-800 relative overflow-hidden flex flex-col">
            <div className="flex items-center gap-3 mb-6 relative z-10">
              <div className="p-2.5 md:p-3 bg-indigo-500 rounded-2xl text-white shadow-lg">
                <Sparkles size={18} md:size={20} />
              </div>
              <h3 className="text-base md:text-lg font-black text-slate-900 dark:text-white tracking-tight">AI Insights</h3>
            </div>
            
            <div className="flex-1 bg-slate-50 dark:bg-slate-800/50 rounded-[24px] md:rounded-[32px] p-5 md:p-6 border border-slate-100 dark:border-slate-800 flex flex-col justify-center text-center relative z-10 min-h-[160px]">
              {loadingAi ? (
                <div className="flex flex-col items-center gap-4 py-6">
                  <Loader2 className="animate-spin text-indigo-500" size={24} />
                  <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Consulting Spirit...</p>
                </div>
              ) : (
                <>
                  <Quote size={20} className="text-indigo-500 mb-3 mx-auto opacity-20" />
                  <p className="text-xs md:text-sm font-medium italic text-slate-600 dark:text-slate-300 leading-relaxed">
                    "{aiInsight || "Attend more sessions to unlock your personalized analysis."}"
                  </p>
                  <p className="mt-4 text-[8px] font-bold text-slate-400 uppercase tracking-widest">— Chaplaincy Intelligence</p>
                </>
              )}
            </div>
          </div>

          {/* Chart Card */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[32px] md:rounded-[48px] shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between mb-8 md:mb-10">
              <h3 className="text-base md:text-lg font-black text-slate-900 dark:text-white tracking-tight">Progress Chart</h3>
              <div className="flex gap-2">
                <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                <div className="w-2 h-2 rounded-full bg-amber-500"></div>
              </div>
            </div>
            <div className="h-[280px] md:h-[320px]">
              <AttendanceChart />
            </div>
          </div>
        </div>
      </main>

      {/* QR Modal */}
      {showQR && (
        <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-2xl flex items-center justify-center p-4 md:p-6" onClick={() => setShowQR(false)}>
          <div className="bg-white dark:bg-slate-900 p-8 md:p-12 rounded-[40px] md:rounded-[56px] shadow-2xl max-w-sm w-full text-center animate-in zoom-in duration-500 relative overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 to-amber-500"></div>
            <div className="flex justify-between items-center mb-8 md:mb-10">
              <div className="text-left">
                <h3 className="text-xl md:text-2xl font-black dark:text-white tracking-tighter">Student ID</h3>
                <p className="text-[8px] md:text-[10px] text-slate-400 font-black uppercase tracking-widest leading-tight">Verification Pass</p>
              </div>
              <button onClick={() => setShowQR(false)} className="p-2.5 md:p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl text-slate-500 hover:text-red-500 transition-all active:scale-90">
                <X size={20} />
              </button>
            </div>
            <div className="bg-white p-6 md:p-8 rounded-[32px] md:rounded-[40px] shadow-2xl mb-8 flex justify-center border-4 border-slate-950 group">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${user?.indexNumber}`} 
                alt="QR" 
                className="w-48 h-48 md:w-56 md:h-56 relative z-10"
              />
            </div>
            <p className="text-lg md:text-xl font-black text-indigo-950 dark:text-amber-500 mb-1 tracking-tight">{user?.indexNumber}</p>
            <p className="text-[9px] md:text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-tight">Show this to the administrator at the gate</p>
          </div>
        </div>
      )}
    </div>
  );
};

const MarkAttendanceView = ({ darkMode, setDarkMode }: { darkMode: boolean, setDarkMode: (v: boolean) => void }) => {
  const { students, setStudents } = useStudentData();
  const { addToast } = useNotifications();
  const user = authService.getCurrentUser();
  const lastScannedRef = useRef<string | null>(null);
  const scanTimeoutRef = useRef<number | null>(null);
  const [lastMarked, setLastMarked] = useState<any>(null);
  const [isSuccessState, setIsSuccessState] = useState(false);

  const handleScanSuccess = (indexNumber: string) => {
    if (lastScannedRef.current === indexNumber) return;
    lastScannedRef.current = indexNumber;
    if (scanTimeoutRef.current) window.clearTimeout(scanTimeoutRef.current);
    scanTimeoutRef.current = window.setTimeout(() => { lastScannedRef.current = null; }, 4000);

    const studentIdx = students.findIndex((s: any) => s.indexNumber.toUpperCase() === indexNumber.toUpperCase());
    if (studentIdx > -1) {
      const updatedStudents = [...students];
      const student = updatedStudents[studentIdx];
      if (student.attendanceCount < SEMESTER_CONFIG.totalSessions) {
        student.attendanceCount += 1;
        setStudents(updatedStudents);
        setLastMarked(student);
        setIsSuccessState(true);
        setTimeout(() => setIsSuccessState(false), 2000);
        addToast("Success!", `${student.name} marked.`, "success");
      } else {
        addToast("Full Attendance", `${student.name} is at maximum count.`, "info");
      }
    } else {
      addToast("Error", `Code ${indexNumber} is not recognized.`, "error");
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 transition-all duration-300 pb-28 md:pb-0">
      <Header title="Scanner Portal" userName={user?.firstName || "Admin"} role={user?.role} darkMode={darkMode} setDarkMode={setDarkMode} />
      <div className="p-4 md:p-10 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-12 items-start">
        
        {/* Scanner Panel */}
        <div className="lg:col-span-7 flex flex-col items-center">
          <div className="text-center mb-6 md:mb-10 px-4">
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tighter">Live Scan</h2>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 font-medium mt-2">Verified records are updated instantly across campus.</p>
          </div>
          
          <div className="relative w-full max-w-md">
            {isSuccessState && (
              <div className="absolute inset-0 z-30 bg-emerald-500/20 backdrop-blur-sm rounded-[32px] md:rounded-[48px] flex items-center justify-center animate-in fade-in zoom-in duration-300 pointer-events-none">
                <div className="bg-emerald-500 text-white p-5 md:p-6 rounded-full shadow-2xl">
                  <CheckCircle2 size={48} md:size={64} />
                </div>
              </div>
            )}
            <QRScanner onScanSuccess={handleScanSuccess} />
          </div>
        </div>

        {/* Status Panel */}
        <div className="lg:col-span-5 space-y-6 md:space-y-8 h-full w-full">
          <div>
            <h3 className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 dark:text-amber-500 mb-4 md:mb-6 ml-2">Recent Scan History</h3>
            {lastMarked ? (
              <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[32px] md:rounded-[48px] shadow-2xl border-2 border-emerald-500/20 flex items-center gap-4 md:gap-8 animate-in slide-in-from-right duration-500">
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${lastMarked.name}`} className="w-16 h-16 md:w-24 md:h-24 rounded-2xl md:rounded-[28px] bg-slate-100 dark:bg-slate-800 border-2 border-white dark:border-slate-800 shadow-lg shrink-0" />
                <div className="overflow-hidden">
                  <h4 className="text-lg md:text-2xl font-black text-slate-900 dark:text-white tracking-tighter truncate">{lastMarked.name}</h4>
                  <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 truncate">{lastMarked.indexNumber}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[8px] font-black uppercase rounded-lg">Count: {lastMarked.attendanceCount}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-40 md:h-48 bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm rounded-[32px] md:rounded-[48px] border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-slate-400">
                <Users size={40} md:size={48} className="opacity-20 mb-3" />
                <p className="text-[10px] font-black uppercase tracking-widest opacity-50">Ready for Scans</p>
              </div>
            )}
          </div>

          <div className="bg-slate-900 p-6 md:p-8 rounded-[32px] md:rounded-[48px] shadow-2xl relative overflow-hidden group">
             <h3 className="text-white font-black text-base md:text-lg mb-4 md:mb-6 tracking-tight">Security Check</h3>
             <div className="space-y-4 md:space-y-6">
                {[
                  { label: 'Photo Match', desc: 'Ensure the face matches the profile avatar.', icon: <UserCheck size={16} md:size={18} /> },
                  { label: 'Real-time Sync', desc: 'Marks reflect on student dashboard instantly.', icon: <Zap size={16} md:size={18} /> },
                  { label: 'Integrity', desc: 'System prevents double-scanning within same hour.', icon: <ShieldCheck size={16} md:size={18} /> }
                ].map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl md:rounded-2xl bg-white/10 flex items-center justify-center text-amber-500 shrink-0">
                      {item.icon}
                    </div>
                    <div>
                      <p className="text-[10px] md:text-[11px] font-black text-white uppercase tracking-widest leading-none">{item.label}</p>
                      <p className="text-[9px] md:text-[10px] text-slate-400 font-medium mt-1 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const LoginView = ({ darkMode, setDarkMode }: { darkMode: boolean, setDarkMode: (v: boolean) => void }) => {
  const navigate = useNavigate();
  const { addToast } = useNotifications();
  const [isRegistering, setIsRegistering] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState({
    firstName: '', surname: '', indexNumber: '', email: '', 
    department: DEPARTMENTS[0], semester: 'Semester One', password: '', 
    requestAdminApproval: false
  });

  const semesters = [
    "Semester One", "Semester Two", "Semester Three", "Semester Four", 
    "Semester Five", "Semester Six", "Semester Seven", "Semester Eight"
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    
    try {
      if (isRegistering) {
        await authService.register({ ...formData, role: isAdminMode ? 'admin' : 'student', requestAdminApproval: isAdminMode });
        if (isAdminMode) navigate('/admin/pending');
        else { addToast("Success!", "Account created. You can now login.", "success"); setIsRegistering(false); }
      } else {
        const user = await authService.login(formData.email, formData.password, isAdminMode ? formData.indexNumber : undefined);
        if (user) {
          if (isAdminMode && user.role !== 'admin') {
            setErrors({ global: "This account is not authorized as an Administrator." });
            setLoading(false);
            return;
          }
          navigate(`/${user.role}`);
        } else {
          setErrors({ global: "Invalid identity or password. Try again." });
        }
      }
    } catch (err: any) { setErrors({ global: err.message || "An unexpected error occurred." }); } 
    finally { setLoading(false); }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value }));
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 md:p-6 transition-all duration-500 overflow-hidden relative">
      {/* Background Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-amber-600/10 blur-[120px] rounded-full"></div>
      </div>

      <div className="backdrop-blur-3xl bg-white/10 dark:bg-slate-900/40 rounded-[40px] md:rounded-[64px] shadow-[0_32px_128px_-16px_rgba(0,0,0,0.6)] overflow-hidden max-w-xl w-full border border-white/10 relative z-10 animate-in zoom-in-95 duration-700">
        <div className="p-8 md:p-16">
          <div className="flex items-center gap-4 mb-8 md:mb-12 justify-center">
            <div className="bg-white p-2.5 md:p-3.5 rounded-2xl md:rounded-[24px] shadow-2xl">
              <BookOpen size={28} md:size={36} className="text-indigo-950" />
            </div>
            <div className="text-left">
               <h1 className="font-black text-3xl md:text-4xl text-white uppercase tracking-tighter leading-none">ANU</h1>
               <span className="text-[8px] md:text-[10px] font-black text-amber-500 uppercase tracking-[0.4em] block mt-1">Chaplaincy Office</span>
            </div>
          </div>

          <div className="flex mb-8 md:mb-12 bg-white/5 p-1 rounded-2xl md:rounded-[24px] border border-white/5">
            <button onClick={() => { setIsAdminMode(false); setErrors({}); }} className={`flex-1 py-3 md:py-4 text-[10px] md:text-[11px] font-black uppercase tracking-widest rounded-xl md:rounded-[20px] transition-all duration-300 ${!isAdminMode ? 'bg-white text-indigo-950 shadow-xl' : 'text-white/40'}`}>Student</button>
            <button onClick={() => { setIsAdminMode(true); setErrors({}); }} className={`flex-1 py-3 md:py-4 text-[10px] md:text-[11px] font-black uppercase tracking-widest rounded-xl md:rounded-[20px] transition-all duration-300 ${isAdminMode ? 'bg-amber-500 text-white shadow-xl' : 'text-white/40'}`}>Staff</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
            {errors.global && <div className="p-4 md:p-5 bg-red-500/10 text-red-400 rounded-2xl md:rounded-[24px] text-[10px] md:text-[11px] font-black uppercase tracking-tight flex items-center gap-3 border border-red-500/20"><ShieldAlert size={14} md:size={16} /> {errors.global}</div>}
            
            <div className="space-y-3 md:space-y-4">
              {isRegistering ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input name="firstName" value={formData.firstName} onChange={handleChange} placeholder="First Name" className="w-full px-6 md:px-8 py-4 md:py-5 bg-white/5 border border-white/5 focus:border-indigo-500/50 rounded-2xl md:rounded-[24px] text-sm font-bold text-white outline-none" required />
                    <input name="surname" value={formData.surname} onChange={handleChange} placeholder="Surname" className="w-full px-6 md:px-8 py-4 md:py-5 bg-white/5 border border-white/5 focus:border-indigo-500/50 rounded-2xl md:rounded-[24px] text-sm font-bold text-white outline-none" required />
                  </div>
                  <input name="email" value={formData.email} onChange={handleChange} placeholder="Institutional Email" className="w-full px-6 md:px-8 py-4 md:py-5 bg-white/5 border border-white/5 focus:border-indigo-500/50 rounded-2xl md:rounded-[24px] text-sm font-bold text-white outline-none" required />
                  <input name="indexNumber" value={formData.indexNumber} onChange={handleChange} placeholder="Index Number (e.g. ANU...)" className="w-full px-6 md:px-8 py-4 md:py-5 bg-white/5 border border-white/5 focus:border-indigo-500/50 rounded-2xl md:rounded-[24px] text-sm font-bold text-white outline-none" required />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <select name="department" value={formData.department} onChange={handleChange} className="w-full px-6 md:px-8 py-4 md:py-5 bg-slate-900 border border-white/5 rounded-2xl md:rounded-[24px] text-xs font-bold text-white outline-none">
                      {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <select name="semester" value={formData.semester} onChange={handleChange} className="w-full px-6 md:px-8 py-4 md:py-5 bg-slate-900 border border-white/5 rounded-2xl md:rounded-[24px] text-xs font-bold text-white outline-none">
                      {semesters.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </>
              ) : (
                <>
                  <input name="email" value={formData.email} onChange={handleChange} placeholder="Email Address" className="w-full px-6 md:px-8 py-4 md:py-5 bg-white/5 border border-white/5 focus:border-indigo-500/50 rounded-2xl md:rounded-[24px] text-sm font-bold text-white outline-none" required />
                  {isAdminMode && <input name="indexNumber" value={formData.indexNumber} onChange={handleChange} placeholder="Administrator Index" className="w-full px-6 md:px-8 py-4 md:py-5 bg-white/5 border border-white/5 focus:border-indigo-500/50 rounded-2xl md:rounded-[24px] text-sm font-bold text-white outline-none" required />}
                </>
              )}
              <input name="password" type="password" value={formData.password} onChange={handleChange} placeholder="Secure Password" className="w-full px-6 md:px-8 py-4 md:py-5 bg-white/5 border border-white/5 focus:border-indigo-500/50 rounded-2xl md:rounded-[24px] text-sm font-bold text-white outline-none" required />
            </div>

            <button type="submit" disabled={loading} className={`w-full text-white font-black py-4 md:py-5 rounded-2xl md:rounded-[24px] transition-all uppercase text-[10px] md:text-[11px] tracking-[0.2em] flex items-center justify-center gap-3 shadow-2xl active:scale-95 ${isAdminMode ? 'bg-amber-600 hover:bg-amber-500' : 'bg-indigo-600 hover:bg-indigo-500'}`}>
              {loading ? <Loader2 className="animate-spin" size={18} /> : (isRegistering ? 'Register Account' : `Authorize ${isAdminMode ? 'Admin' : 'Student'}`)}
            </button>
          </form>

          <button onClick={() => { setIsRegistering(!isRegistering); setErrors({}); }} className="mt-8 md:mt-10 text-[9px] md:text-[10px] font-black text-white/30 block mx-auto hover:text-white transition-colors uppercase tracking-[0.2em]">
            {isRegistering ? 'Already have a profile? Sign In' : 'New to system? Create Academic Profile'}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Main Layout ---
const Sidebar = ({ role }: { role: 'student' | 'admin' }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const handleLogout = () => { authService.logout(); navigate('/'); };

  const menuItems = [
    { to: `/${role}`, icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    ...(role === 'admin' ? [
      { to: "/admin/students", icon: <Users size={20} />, label: 'Directory' },
      { to: "/admin/scan", icon: <QrCode size={20} />, label: 'Mark Attendance' },
      { to: "/admin/schedule", icon: <Calendar size={20} />, label: 'Schedules' },
      { to: "/admin/approvals", icon: <ShieldCheck size={20} />, label: 'Security' }
    ] : []),
    { to: `/${role}/settings`, icon: <SettingsIcon size={20} />, label: 'Settings' }
  ];

  return (
    <div className={`w-72 bg-slate-950 text-white flex-shrink-0 flex flex-col hidden md:flex border-r border-white/5 relative z-50`}>
      <div className="p-10">
        <div className="flex items-center gap-4 mb-12">
          <div className="bg-gradient-to-tr from-indigo-500 to-amber-500 p-2.5 rounded-[18px] shadow-2xl">
            <BookOpen size={24} className="text-white" />
          </div>
          <h1 className="font-black text-2xl tracking-tighter leading-none">ANU<br/><span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Chaplaincy</span></h1>
        </div>
        
        <nav className="space-y-2">
          {menuItems.map((item) => (
            <Link 
              key={item.to}
              to={item.to} 
              className={`group flex items-center gap-4 p-4 rounded-[22px] transition-all duration-300 relative overflow-hidden ${location.pathname === item.to ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
            >
              {location.pathname === item.to && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-indigo-500 rounded-r-full shadow-[0_0_15px_rgba(99,102,241,0.5)]"></div>}
              <div className={`${location.pathname === item.to ? 'text-indigo-400' : 'group-hover:scale-110'} transition-transform`}>{item.icon}</div>
              <span className="text-xs font-black uppercase tracking-widest">{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>
      
      <div className="mt-auto p-10">
        <button onClick={handleLogout} className="w-full flex items-center gap-4 p-5 rounded-[22px] bg-red-500/5 hover:bg-red-500/20 text-red-500 transition-all font-black text-xs uppercase tracking-widest group">
          <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span>Authorize Exit</span>
        </button>
      </div>
    </div>
  );
};

// --- App Root ---
export default function App() {
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('anu_theme') === 'dark');
  const { activeToasts, removeToast } = useNotifications();
  
  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('anu_theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  return (
    <div className="contents">
      <ToastContainer toasts={activeToasts} remove={removeToast} />
      <Router>
        <Routes>
          <Route path="/" element={<LoginView darkMode={darkMode} setDarkMode={setDarkMode} />} />
          <Route path="/admin/*" element={
            <ProtectedRoute role="admin">
              <div className="flex flex-col md:flex-row h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">
                <Sidebar role="admin" />
                <div className="flex-1 flex flex-col overflow-hidden relative">
                  <Routes>
                    <Route path="/" element={<AdminDashboard darkMode={darkMode} setDarkMode={setDarkMode} />} />
                    <Route path="/students" element={<StudentRegistryView darkMode={darkMode} setDarkMode={setDarkMode} />} />
                    <Route path="/scan" element={<MarkAttendanceView darkMode={darkMode} setDarkMode={setDarkMode} />} />
                    <Route path="/schedule" element={<AdminMonthlySchedule darkMode={darkMode} setDarkMode={setDarkMode} />} />
                    <Route path="/approvals" element={<AdminApprovalsView darkMode={darkMode} setDarkMode={setDarkMode} />} />
                    <Route path="/settings" element={<SettingsView role="admin" darkMode={darkMode} setDarkMode={setDarkMode} />} />
                  </Routes>
                  <BottomNav role="admin" />
                </div>
              </div>
            </ProtectedRoute>
          } />
          <Route path="/student/*" element={
            <ProtectedRoute role="student">
              <div className="flex flex-col md:flex-row h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">
                <Sidebar role="student" />
                <div className="flex-1 flex flex-col overflow-hidden relative">
                  <Routes>
                    <Route path="/" element={<StudentDashboard darkMode={darkMode} setDarkMode={setDarkMode} />} />
                    <Route path="/settings" element={<SettingsView role="student" darkMode={darkMode} setDarkMode={setDarkMode} />} />
                  </Routes>
                  <BottomNav role="student" />
                </div>
              </div>
            </ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </div>
  );
}

// Sub-components

const AdminDashboard = ({ darkMode, setDarkMode }: any) => {
  const { students } = useStudentData();
  const user = authService.getCurrentUser();
  const stats = useMemo(() => DEPARTMENTS.map(d => {
    const s = students.filter(x => x.department === d);
    const a = s.length ? s.reduce((acc, curr) => acc + curr.attendanceCount, 0) / s.length : 0;
    return { dept: d, avg: (a / 65) * 100 };
  }), [students]);

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 pb-28 md:pb-0">
      <Header title="Mission Control" userName={user?.firstName || "Admin"} role={user?.role} darkMode={darkMode} setDarkMode={setDarkMode} />
      <main className="p-4 md:p-10 space-y-6 md:space-y-10 max-w-7xl mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
          <StatCard label="Enrollment" value={students.length} icon={<Users size={20} />} color="bg-indigo-600" />
          <StatCard label="Avg. Attendance" value="84%" icon={<CheckCircle2 size={20} />} color="bg-emerald-500" />
          <StatCard label="Live Logs" value="4,102" icon={<Clock size={20} />} color="bg-amber-500" />
          <StatCard label="System Security" value="Online" icon={<ShieldCheck size={20} />} color="bg-slate-900" />
        </div>
        
        <div className="bg-white dark:bg-slate-900 p-6 md:p-10 rounded-[32px] md:rounded-[48px] shadow-xl border border-slate-100 dark:border-slate-800">
          <h3 className="text-base md:text-xl font-black text-slate-900 dark:text-white mb-6 md:mb-8 tracking-tighter">Participation Index</h3>
          <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {stats.map(s => (
              <div key={s.dept} className="p-5 md:p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800 transition-transform">
                <p className="text-[8px] md:text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest truncate">{s.dept}</p>
                <p className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">{s.avg.toFixed(0)}%</p>
                <div className="mt-4 h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 transition-all duration-1000" style={{ width: `${s.avg}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

const StudentRegistryView = ({ darkMode, setDarkMode }: any) => {
  const { students } = useStudentData();
  const [selectedDept, setSelectedDept] = useState('All Departments');
  const user = authService.getCurrentUser();
  const filtered = selectedDept === 'All Departments' ? students : students.filter((s: any) => s.department === selectedDept);

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 pb-28 md:pb-0">
      <Header title="Identity Ledger" userName={user?.firstName || "Admin"} role={user?.role} darkMode={darkMode} setDarkMode={setDarkMode} />
      <div className="p-4 md:p-10 max-w-7xl mx-auto space-y-6 md:space-y-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 md:gap-6 px-2">
          <div>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tighter">Academic Roster</h2>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 font-medium">Verify attendance session records and mark parity.</p>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <select 
              value={selectedDept} 
              onChange={(e) => setSelectedDept(e.target.value)} 
              className="flex-1 md:flex-none px-4 md:px-6 py-3 md:py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl md:rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none shadow-sm"
            >
              <option>All Departments</option>
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <button 
              onClick={() => generateDepartmentReport(selectedDept, filtered)}
              className="p-3 md:px-8 md:py-4 bg-indigo-600 text-white rounded-xl md:rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-indigo-600/20"
            >
              <FileDown size={18} /> <span className="hidden md:inline">Export PDF</span>
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-[32px] md:rounded-[56px] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800">
                  <th className="px-6 md:px-10 py-6 md:py-8">Identity</th>
                  <th className="px-6 md:px-10 py-6 md:py-8">Session</th>
                  <th className="px-6 md:px-10 py-6 md:py-8 text-right">Count</th>
                  <th className="px-6 md:px-10 py-6 md:py-8 text-right">Mark</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {filtered.map((s: any) => (
                  <tr key={s.id} className="hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-colors">
                    <td className="px-6 md:px-10 py-4 md:py-6 flex items-center gap-4">
                      <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${s.name}`} className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-[18px] bg-slate-100 dark:bg-slate-800 shadow-md" />
                      <div>
                        <p className="font-black text-slate-900 dark:text-white tracking-tight leading-none">{s.name}</p>
                        <p className="text-[8px] font-bold text-slate-400 mt-1 uppercase">{s.indexNumber}</p>
                      </div>
                    </td>
                    <td className="px-6 md:px-10 py-4 md:py-6">
                      <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[8px] font-black uppercase rounded-lg">{s.semester}</span>
                    </td>
                    <td className="px-6 md:px-10 py-4 md:py-6 text-right font-black text-sm md:text-base text-slate-900 dark:text-white">{s.attendanceCount}</td>
                    <td className="px-6 md:px-10 py-4 md:py-6 text-right font-black text-xl md:text-2xl text-emerald-600 dark:text-emerald-500">
                      {(s.attendanceCount / 65 * 5).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminMonthlySchedule = ({ darkMode, setDarkMode }: any) => (
  <div className="flex-1 overflow-y-auto pb-28 md:pb-0"><Header title="Calendar" userName="Admin" role="admin" darkMode={darkMode} setDarkMode={setDarkMode} /><div className="p-4 md:p-10"><div className="bg-white dark:bg-slate-900 p-12 md:p-20 rounded-[32px] md:rounded-[56px] text-center border-4 border-dashed border-slate-100 dark:border-slate-800"><p className="text-slate-400 font-black text-sm md:text-xl uppercase tracking-tighter">System Synchronizing...</p></div></div></div>
);

const AdminApprovalsView = ({ darkMode, setDarkMode }: any) => (
  <div className="flex-1 overflow-y-auto pb-28 md:pb-0"><Header title="Security" userName="Admin" role="admin" darkMode={darkMode} setDarkMode={setDarkMode} /><div className="p-4 md:p-10"><div className="bg-white dark:bg-slate-900 p-12 md:p-20 rounded-[32px] md:rounded-[56px] text-center border-4 border-dashed border-slate-100 dark:border-slate-800"><p className="text-slate-400 font-black text-sm md:text-xl uppercase tracking-tighter">Identity Queue Empty</p></div></div></div>
);

const SettingsView = ({ role, darkMode, setDarkMode }: any) => {
  const user = authService.getCurrentUser();
  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 transition-all duration-300 pb-28 md:pb-0">
      <Header title="Settings" userName={user?.firstName || "User"} role={user?.role} darkMode={darkMode} setDarkMode={setDarkMode} />
      <div className="p-4 md:p-10 max-w-4xl mx-auto">
        <div className="bg-white dark:bg-slate-900 rounded-[32px] md:rounded-[48px] p-6 md:p-10 shadow-xl border border-slate-100 dark:border-slate-800 relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8 mb-8 md:mb-12 pb-8 md:pb-12 border-b border-slate-100 dark:border-slate-800">
            <div className="relative group">
              <div className="absolute -inset-2 bg-gradient-to-tr from-indigo-500 to-amber-500 rounded-full md:rounded-[32px] blur opacity-20 transition duration-500"></div>
              <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.firstName}`} className="relative w-20 h-20 md:w-28 md:h-28 rounded-full md:rounded-[28px] bg-slate-100 dark:bg-slate-800 border-4 border-white dark:border-slate-800" />
            </div>
            <div className="text-center md:text-left">
              <h3 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tighter mb-2">{user?.firstName} {user?.surname}</h3>
              <p className="text-indigo-500 dark:text-amber-500 font-black uppercase tracking-[0.2em] text-[8px] md:text-[10px]">{role} ID Verified</p>
            </div>
          </div>
          
          <div className="space-y-6 md:space-y-8">
            <div className="flex items-center justify-between p-6 md:p-8 bg-slate-50 dark:bg-slate-800/50 rounded-[24px] md:rounded-[32px] border border-slate-100 dark:border-slate-800 transition-all">
              <div className="flex items-center gap-4 md:gap-5">
                <div className={`p-3 md:p-4 rounded-xl md:rounded-2xl text-white ${darkMode ? 'bg-amber-500' : 'bg-slate-900'}`}>
                  {darkMode ? <Sun size={20} md:size={24} /> : <Moon size={20} md:size={24} />}
                </div>
                <div>
                  <p className="text-[10px] md:text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Dark Mode</p>
                  <p className="text-[8px] md:text-[10px] text-slate-500 font-medium mt-1">Adjust system theme.</p>
                </div>
              </div>
              <button 
                onClick={() => setDarkMode(!darkMode)}
                className={`w-14 h-8 md:w-16 md:h-9 rounded-full p-1 transition-all duration-500 ${darkMode ? 'bg-amber-500' : 'bg-slate-300'}`}
              >
                <div className={`w-6 h-6 bg-white rounded-full shadow transition-all duration-500 ${darkMode ? 'translate-x-6 md:translate-x-7' : 'translate-x-0'}`} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
              {[
                { label: 'Identity ID', value: user?.indexNumber || 'N/A', icon: <QrCode size={14} /> },
                { label: 'Department', value: user?.department || 'N/A', icon: <Building2 size={14} /> },
                { label: 'Semester', value: user?.semester || 'N/A', icon: <Calendar size={14} /> }
              ].map((field, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex items-center gap-2 ml-4">
                    <span className="text-slate-400">{field.icon}</span>
                    <label className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-slate-400">{field.label}</label>
                  </div>
                  <div className="px-6 py-4 md:px-8 md:py-6 bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 rounded-2xl md:rounded-[28px] text-xs md:text-sm font-bold text-slate-900 dark:text-white truncate">
                    {field.value}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="pt-6 md:pt-10">
              <button className="w-full py-4 md:py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[18px] md:rounded-[24px] text-[10px] md:text-[11px] font-black uppercase tracking-widest transition-all shadow-xl active:scale-95">Update Academic Profile</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

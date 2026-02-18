
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
  Upload,
  Image as ImageIcon
} from 'lucide-react';
import { MOCK_STUDENTS as INITIAL_MOCK_STUDENTS, SEMESTER_CONFIG, DEPARTMENTS } from './constants';
import { StatCard } from './components/StatCard';
import { AttendanceChart } from './components/AttendanceChart';
import { QRScanner } from './components/QRScanner';
import { generateDepartmentReport, generateMonthlySchedulePDF } from './services/pdfService';
import { authService, UserProfile } from './services/authService';
import { getAdminReport } from './services/geminiService';

// --- Global Constants ---
const STUDENTS_STORAGE_KEY = 'anu_students_db_v2';
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
  const [localStudents, setLocalStudents] = useState(() => {
    const saved = localStorage.getItem(STUDENTS_STORAGE_KEY);
    return saved ? JSON.parse(saved) : INITIAL_MOCK_STUDENTS;
  });

  const students = useMemo(() => {
    const registered = authService.getAllUsers().filter(u => u.role === 'student');
    const combined = [...localStudents];

    registered.forEach(regUser => {
      const existingIdx = combined.findIndex(s => s.indexNumber === regUser.indexNumber);
      const studentData = {
        id: regUser.id,
        name: `${regUser.firstName} ${regUser.surname}`,
        indexNumber: regUser.indexNumber,
        qrToken: regUser.qrToken,
        department: regUser.department,
        semester: regUser.semester,
        attendanceCount: existingIdx > -1 ? combined[existingIdx].attendanceCount : 0,
        profilePicture: regUser.profilePicture
      };
      
      if (existingIdx > -1) {
        combined[existingIdx] = studentData;
      } else {
        combined.push(studentData);
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
  const handleLogout = () => { authService.logout(); navigate('/'); };

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

// --- View Components ---

const StudentDashboard = ({ darkMode, setDarkMode }: { darkMode: boolean, setDarkMode: (v: boolean) => void }) => {
  const { students } = useStudentData();
  const user = authService.getCurrentUser();
  const [showQR, setShowQR] = useState(false);
  
  const student = useMemo(() => students.find((s: any) => s.indexNumber === user?.indexNumber) || {
    name: `${user?.firstName} ${user?.surname}`,
    indexNumber: user?.indexNumber || 'N/A',
    qrToken: user?.qrToken || 'NONE',
    attendanceCount: 0,
    department: user?.department || 'N/A',
    semester: user?.semester || 'Semester One',
    profilePicture: user?.profilePicture
  }, [students, user]);

  return (
    <div className="flex-1 overflow-y-auto pb-28 lg:pb-0">
      <Header title="Identity Overview" user={user} darkMode={darkMode} setDarkMode={setDarkMode} />
      <main className="p-6 md:p-12 space-y-10 max-w-7xl mx-auto">
        
        <div className="relative group overflow-hidden bg-white dark:bg-slate-900/50 p-8 md:p-12 rounded-4xl border border-slate-200 dark:border-white/5 shadow-[0_30px_60px_-12px_rgba(0,0,0,0.05)] dark:shadow-none flex flex-col lg:flex-row items-center gap-10 lg:gap-14">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none"></div>
          
          <div className="relative shrink-0">
            <div className="absolute -inset-4 bg-gradient-to-tr from-indigo-500 to-amber-500 rounded-5xl blur-2xl opacity-20 group-hover:opacity-40 transition duration-700"></div>
            <Avatar 
              src={student.profilePicture} 
              seed={user?.firstName || 'User'} 
              className="relative w-32 h-32 md:w-44 md:h-44 rounded-4xl border-4 border-white dark:border-slate-800 shadow-2xl" 
            />
          </div>

          <div className="flex-1 text-center lg:text-left relative z-10 space-y-6">
            <div>
              <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tighter mb-2">{user?.firstName} {user?.surname}</h2>
              <div className="flex flex-wrap justify-center lg:justify-start gap-3">
                <span className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-950 text-[10px] font-black uppercase tracking-widest rounded-xl">{user?.indexNumber}</span>
                <span className="px-4 py-2 bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl">{user?.semester}</span>
              </div>
            </div>
            
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 max-w-xl">
              Member of the <span className="font-extrabold text-indigo-600 dark:text-indigo-400">{user?.department}</span>. 
              Your participation in morning devotions contributes to your overall spiritual evaluation at ANU.
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
                {(student.attendanceCount / 65 * 5).toFixed(2)}
              </span>
              <span className="text-lg md:text-2xl font-bold text-slate-400 dark:text-slate-600 mb-1 ml-2">/ 5.0</span>
            </div>
            <div className="mt-6 w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
               <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${(student.attendanceCount/65)*100}%` }}></div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          <StatCard label="Total Sessions" value={student.attendanceCount} icon={<Calendar size={24} />} color="bg-indigo-600" />
          <StatCard label="Consistency Rate" value={`${((student.attendanceCount / 65) * 100).toFixed(0)}%`} icon={<TrendingUp size={24} />} color="bg-emerald-500" />
          <StatCard label="Cap Mark" value="5.0" icon={<Trophy size={24} />} color="bg-amber-500" />
          <StatCard label="Upcoming" value={Math.max(0, 65 - student.attendanceCount)} icon={<Clock size={24} />} color="bg-slate-800" />
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
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${student.qrToken}`} alt="Secure Pass" className="w-56 h-56 mx-auto" />
            </div>
            <h4 className="text-2xl font-black text-slate-900 dark:text-amber-500 mb-1 tracking-tight">SECURE IDENTITY TOKEN</h4>
            <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest leading-tight">Digital Authentication Key</p>
          </div>
        </div>
      )}
    </div>
  );
};

const NotificationSettingsView = ({ darkMode, setDarkMode }: { darkMode: boolean, setDarkMode: (v: boolean) => void }) => {
  const user = authService.getCurrentUser();
  const { addToast } = useNotifications();
  const [prefs, setPrefs] = useState(() => {
    const saved = localStorage.getItem(NOTIFICATION_PREFS_KEY);
    return saved ? JSON.parse(saved) : {
      devotionAlerts: true,
      chapelAlerts: true,
      programAlerts: true
    };
  });

  const togglePref = (key: keyof typeof prefs) => {
    setPrefs((prev: any) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    localStorage.setItem(NOTIFICATION_PREFS_KEY, JSON.stringify(prefs));
    addToast("Preferences Saved", "Your notification settings have been updated.", "success");
  };

  const settingsItems = [
    { 
      id: 'devotionAlerts', 
      label: 'Morning Devotions', 
      desc: 'Get notified 15 minutes before the 8:00 AM daily devotion starts.', 
      icon: <Clock size={24} className="text-indigo-500" /> 
    },
    { 
      id: 'chapelAlerts', 
      label: 'Corporate Chapel', 
      desc: 'Reminders for our weekly Wednesday spiritual convergence.', 
      icon: <Calendar size={24} className="text-amber-500" /> 
    },
    { 
      id: 'programAlerts', 
      label: 'Special Announcements', 
      desc: 'Important broadcasts about seminars, revivals, and university programs.', 
      icon: <Megaphone size={24} className="text-emerald-500" /> 
    }
  ];

  return (
    <div className="flex-1 overflow-y-auto pb-28 lg:pb-0 bg-slate-50 dark:bg-[#020617]">
      <Header title="Announcements" user={user} darkMode={darkMode} setDarkMode={setDarkMode} />
      <main className="p-6 md:p-12 max-w-4xl mx-auto space-y-10">
        <div className="bg-white dark:bg-slate-900/50 rounded-4xl p-8 md:p-14 border border-slate-200 dark:border-white/5 shadow-2xl">
          <div className="mb-12">
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">Alert Preferences</h2>
            <p className="text-sm text-slate-500 font-medium">Configure how the Chaplaincy Office communicates with you.</p>
          </div>

          <div className="space-y-6">
            {settingsItems.map((item) => (
              <div 
                key={item.id} 
                className="flex items-center justify-between p-6 bg-slate-50 dark:bg-white/5 rounded-3xl border border-slate-100 dark:border-white/5 hover:border-indigo-500/30 transition-all group"
              >
                <div className="flex items-center gap-6">
                  <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-sm group-hover:scale-110 transition-transform">
                    {item.icon}
                  </div>
                  <div>
                    <h4 className="text-[13px] font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">{item.label}</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1 leading-relaxed max-w-xs">{item.desc}</p>
                  </div>
                </div>
                
                <button 
                  onClick={() => togglePref(item.id as any)}
                  className={`w-14 h-8 rounded-full p-1 transition-all duration-500 relative ${prefs[item.id as keyof typeof prefs] ? 'bg-indigo-600 shadow-[0_0_15px_rgba(79,70,229,0.4)]' : 'bg-slate-300 dark:bg-slate-700'}`}
                >
                  <div className={`w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-500 ${prefs[item.id as keyof typeof prefs] ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>
            ))}
          </div>

          <div className="mt-12">
            <button 
              onClick={handleSave}
              className="w-full py-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-3xl text-[12px] font-extrabold uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-indigo-600/20 active:scale-95 transition-all"
            >
              <CheckCircle2 size={20} />
              Save Preferences
            </button>
          </div>
        </div>

        <div className="p-8 bg-amber-50 dark:bg-amber-900/10 rounded-4xl border border-amber-100 dark:border-amber-900/20 flex gap-5">
          <div className="p-3 bg-amber-500 rounded-2xl shrink-0 h-fit">
            <ShieldAlert size={20} className="text-white" />
          </div>
          <p className="text-xs font-medium text-amber-900 dark:text-amber-200 leading-relaxed">
            <span className="font-extrabold block mb-1">System Notice:</span> 
            Critical administrative alerts regarding academic standing, spiritual marks, or security warnings will be delivered regardless of these preferences to ensure compliance with University protocols.
          </p>
        </div>
      </main>
    </div>
  );
};

const SettingsView = ({ role, darkMode, setDarkMode }: any) => {
  const [user, setUser] = useState<UserProfile | null>(authService.getCurrentUser());
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ firstName: user?.firstName || '', surname: user?.surname || '', profilePicture: user?.profilePicture });
  const { addToast } = useNotifications();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpdate = () => {
    try {
      const updated = authService.updateProfile(formData);
      setUser(updated);
      setIsEditing(false);
      addToast("Profile Updated", "Identity changes saved successfully.", "success");
    } catch (e) {
      addToast("Update Failed", "Could not save profile changes.", "error");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, profilePicture: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto pb-28 lg:pb-0">
      <Header title="Security & Profile" user={user} darkMode={darkMode} setDarkMode={setDarkMode} />
      <main className="p-6 md:p-12 max-w-4xl mx-auto">
        <div className="bg-white dark:bg-slate-900/50 rounded-4xl p-8 md:p-14 border border-slate-200 dark:border-white/5 shadow-2xl transition-all duration-500">
          
          <div className="flex flex-col md:flex-row items-center gap-10 mb-12 pb-12 border-b border-slate-100 dark:border-white/5">
            <div className="relative group">
               <Avatar 
                src={isEditing ? formData.profilePicture : user?.profilePicture} 
                seed={user?.firstName || 'User'} 
                className="w-32 h-32 md:w-44 md:h-44 rounded-full border-4 border-white dark:border-slate-800 shadow-2xl transition-all group-hover:brightness-50" 
              />
              {isEditing && (
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Camera size={32} className="text-white" />
                </button>
              )}
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleFileChange} 
              />
            </div>
            
            <div className="text-center md:text-left">
              <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tighter mb-2">{user?.firstName} {user?.surname}</h3>
              <p className="text-indigo-500 font-extrabold uppercase tracking-widest text-[11px]">{user?.indexNumber} • Verified {role}</p>
            </div>
          </div>

          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-4">Given Name</label>
                <input 
                  disabled={!isEditing} 
                  value={isEditing ? formData.firstName : user?.firstName} 
                  onChange={e => setFormData({...formData, firstName: e.target.value})} 
                  className="w-full px-8 py-5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-3xl font-bold disabled:opacity-50 text-slate-900 dark:text-white focus:border-indigo-500 outline-none transition-all" 
                />
              </div>
              <div className="space-y-3">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-4">Surname</label>
                <input 
                  disabled={!isEditing} 
                  value={isEditing ? formData.surname : user?.surname} 
                  onChange={e => setFormData({...formData, surname: e.target.value})} 
                  className="w-full px-8 py-5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-3xl font-bold disabled:opacity-50 text-slate-900 dark:text-white focus:border-indigo-500 outline-none transition-all" 
                />
              </div>
            </div>

            <div className="pt-10 flex gap-4">
              {isEditing ? (
                <>
                  <button 
                    onClick={handleUpdate} 
                    className="flex-1 py-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-3xl text-[12px] font-extrabold uppercase tracking-widest shadow-xl active:scale-95 transition-all"
                  >
                    Commit Changes
                  </button>
                  <button 
                    onClick={() => { setIsEditing(false); setFormData({ firstName: user?.firstName || '', surname: user?.surname || '', profilePicture: user?.profilePicture }); }} 
                    className="flex-1 py-6 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 rounded-3xl text-[12px] font-extrabold uppercase tracking-widest active:scale-95 transition-all"
                  >
                    Discard
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => setIsEditing(true)} 
                  className="w-full py-6 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 rounded-3xl text-[12px] font-extrabold uppercase tracking-widest transition-all"
                >
                  Edit Digital Persona
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
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

  const handleScanSuccess = (scannedToken: string) => {
    if (lastScannedRef.current === scannedToken) return;
    lastScannedRef.current = scannedToken;
    if (scanTimeoutRef.current) window.clearTimeout(scanTimeoutRef.current);
    scanTimeoutRef.current = window.setTimeout(() => { lastScannedRef.current = null; }, 4000);

    // Search students by the unique qrToken instead of indexNumber
    const studentIdx = students.findIndex((s: any) => s.qrToken === scannedToken);
    
    if (studentIdx > -1) {
      const updatedStudents = [...students];
      const student = updatedStudents[studentIdx];
      if (student.attendanceCount < SEMESTER_CONFIG.totalSessions) {
        student.attendanceCount += 1;
        setStudents(updatedStudents);
        setLastMarked(student);
        setIsSuccessState(true);
        setTimeout(() => setIsSuccessState(false), 2000);
        addToast("Identity Verified", `${student.name} access acknowledged.`, "success");
      } else {
        addToast("Quota Reached", `${student.name} has completed all required sessions.`, "info");
      }
    } else {
      addToast("Invalid Token", `Cryptographic handshake failed. Secure token not recognized.`, "error");
    }
  };

  return (
    <div className="flex-1 overflow-y-auto pb-28 lg:pb-0">
      <Header title="Quick Scan" user={user} darkMode={darkMode} setDarkMode={setDarkMode} />
      <div className="p-6 md:p-12 max-w-7xl mx-auto grid grid-cols-1 xl:grid-cols-12 gap-12 items-start">
        <div className="xl:col-span-7 space-y-10">
          <div className="flex flex-col items-center">
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tighter mb-2">Live Authentication</h2>
            <p className="text-sm text-slate-500 font-medium mb-10">Point optical sensor at student identity pass</p>
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
          <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-500 ml-2">Verification Stream</h3>
          {lastMarked ? (
            <div className="bg-white dark:bg-slate-900/50 p-8 rounded-4xl border border-slate-200 dark:border-emerald-500/20 flex items-center gap-6 animate-in slide-in-from-right duration-500">
              <Avatar src={lastMarked.profilePicture} seed={lastMarked.name} className="w-20 h-20 rounded-2xl shadow-lg" />
              <div>
                <h4 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">{lastMarked.name}</h4>
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">{lastMarked.indexNumber}</p>
                <div className="mt-3 flex items-center gap-2 text-emerald-500">
                   <Zap size={14} className="fill-current" />
                   <span className="text-xs font-black uppercase">Sessions: {lastMarked.attendanceCount}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-48 bg-white/40 dark:bg-white/[0.02] backdrop-blur-sm rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-white/5 flex flex-col items-center justify-center text-slate-400 space-y-4">
              <ImageIcon size={32} className="opacity-20" />
              <span className="font-black uppercase text-[10px] tracking-widest opacity-50">Sensor Idle... Standby</span>
            </div>
          )}
          
          <div className="bg-indigo-600 p-8 rounded-4xl shadow-2xl shadow-indigo-600/20 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
            <h4 className="text-lg font-extrabold tracking-tight mb-2">Secure Scannnig</h4>
            <p className="text-xs font-medium text-indigo-100 leading-relaxed">
              The system now uses rotating secure tokens. Standard index numbers are no longer valid for QR authentication to prevent identity spoofing.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Navigation Components
const BottomNav = ({ role, user }: { role: 'student' | 'admin', user: UserProfile | null }) => {
    const location = useLocation();
    const navigate = useNavigate();
    
    const studentItems = [
      { to: "/student", icon: <LayoutDashboard size={24} />, label: "Home" },
      { to: "/student/notifications", icon: <Bell size={24} />, label: "Alerts" },
      { to: "/student/settings", icon: <SettingsIcon size={24} />, label: "User" },
    ];
    
    const adminItems = [
      { to: "/admin", icon: <LayoutDashboard size={24} />, label: "Home" },
      { to: "/admin/scan", icon: <QrCode size={24} />, label: "Scan" },
      { to: "/admin/students", icon: <Users size={24} />, label: "Ledger" },
      { to: "/admin/settings", icon: <SettingsIcon size={24} />, label: "Setup" },
    ];
    
    const items = role === 'admin' ? adminItems : studentItems;
  
    return (
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 p-4 pb-8 pointer-events-none">
        <nav className="glass-card border border-white/20 dark:border-white/5 rounded-5xl p-3 flex justify-around items-center shadow-2xl pointer-events-auto">
          {items.map((item) => (
            <Link 
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-3xl transition-all duration-300 ${location.pathname === item.to ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 dark:text-slate-500'}`}
            >
              {React.cloneElement(item.icon as React.ReactElement, { size: 20 })}
              <span className="text-[8px] font-black uppercase tracking-widest">{item.label}</span>
            </Link>
          ))}
          <button 
            onClick={() => { authService.logout(); navigate('/'); }}
            className="flex flex-col items-center gap-1.5 p-3 rounded-3xl text-red-500"
          >
            <LogOut size={20} />
            <span className="text-[8px] font-black uppercase tracking-widest">Exit</span>
          </button>
        </nav>
      </div>
    );
};

const RegisterView = () => {
    const [formData, setFormData] = useState({
      firstName: '',
      surname: '',
      email: '',
      indexNumber: '',
      department: DEPARTMENTS[0],
      semester: 'Semester One',
      password: '',
      role: 'student' as 'student' | 'admin',
      requestAdminApproval: false,
      profilePicture: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);
  
    const handleRegister = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      setError('');
      try {
        await authService.register(formData);
        if (formData.role === 'admin') {
          alert("Administrator request filed. Access will be granted upon verification.");
        }
        navigate('/');
      } catch (err: any) {
        setError(err.message || 'Registration failure');
      } finally {
        setLoading(false);
      }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFormData(prev => ({ ...prev, profilePicture: reader.result as string }));
        };
        reader.readAsDataURL(file);
      }
    };
  
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 transition-all duration-500 overflow-y-auto py-12">
        <div className="w-full max-w-3xl bg-white/5 backdrop-blur-3xl p-10 md:p-14 rounded-5xl border border-white/10 shadow-2xl relative overflow-hidden">
          <div className="mb-14 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div>
              <h2 className="text-4xl font-extrabold text-white tracking-tighter mb-2">Create Identity</h2>
              <p className="text-slate-400 font-extrabold uppercase text-[11px] tracking-[0.2em]">Join the digital ANU mission ledger</p>
            </div>
            
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <div className="absolute -inset-1.5 bg-indigo-500 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-300"></div>
              {formData.profilePicture ? (
                <img src={formData.profilePicture} alt="Upload Preview" className="relative w-24 h-24 rounded-3xl object-cover border-2 border-indigo-500" />
              ) : (
                <div className="relative w-24 h-24 bg-indigo-600/20 rounded-3xl border-2 border-dashed border-indigo-500/50 flex flex-col items-center justify-center text-indigo-400 gap-1 hover:bg-indigo-600/30 transition-all">
                  <Camera size={24} />
                  <span className="text-[8px] font-black uppercase tracking-widest text-center">Add Photo</span>
                </div>
              )}
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
            </div>
          </div>
          
          <form onSubmit={handleRegister} className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-4">First Name</label>
              <input required value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} className="w-full px-8 py-5 bg-white/5 border border-white/10 rounded-3xl text-white font-bold outline-none focus:border-indigo-500 transition-all" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-4">Surname</label>
              <input required value={formData.surname} onChange={e => setFormData({...formData, surname: e.target.value})} className="w-full px-8 py-5 bg-white/5 border border-white/10 rounded-3xl text-white font-bold outline-none focus:border-indigo-500 transition-all" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-4">Institutional Email</label>
              <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-8 py-5 bg-white/5 border border-white/10 rounded-3xl text-white font-bold outline-none focus:border-indigo-500 transition-all" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-4">Index Reference</label>
              <input required value={formData.indexNumber} onChange={e => setFormData({...formData, indexNumber: e.target.value})} className="w-full px-8 py-5 bg-white/5 border border-white/10 rounded-3xl text-white font-bold outline-none focus:border-indigo-500 transition-all" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-4">Academic Division</label>
              <select value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} className="w-full px-8 py-5 bg-white/5 border border-white/10 rounded-3xl text-white font-bold outline-none focus:border-indigo-500 transition-all">
                {DEPARTMENTS.map(d => <option key={d} className="bg-[#020617]">{d}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-4">Access Level</label>
              <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as any, requestAdminApproval: e.target.value === 'admin'})} className="w-full px-8 py-5 bg-white/5 border border-white/10 rounded-3xl text-white font-bold outline-none focus:border-indigo-500 transition-all">
                <option value="student" className="bg-[#020617]">Student Membership</option>
                <option value="admin" className="bg-[#020617]">Administrator Privileges</option>
              </select>
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-4">Security Key</label>
              <input type="password" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full px-8 py-6 bg-white/5 border border-white/10 rounded-3xl text-white font-bold outline-none focus:border-indigo-500 transition-all" />
            </div>
            {error && <p className="md:col-span-2 text-red-500 text-[11px] font-black uppercase text-center">{error}</p>}
            <button type="submit" disabled={loading} className="md:col-span-2 py-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-3xl text-[12px] font-extrabold uppercase tracking-[0.2em] transition-all shadow-xl active:scale-95 disabled:opacity-50">
              {loading ? <Loader2 className="animate-spin mx-auto" /> : 'Register Professional Account'}
            </button>
          </form>
          <div className="mt-12 pt-10 border-t border-white/10 text-center">
            <Link to="/" className="text-indigo-400 hover:text-indigo-300 transition-colors text-[11px] font-black uppercase tracking-[0.2em]">
              Already Registered? Access Portal
            </Link>
          </div>
        </div>
      </div>
    );
};

const AdminDashboard = ({ darkMode, setDarkMode }: any) => {
  const { students } = useStudentData();
  const user = authService.getCurrentUser();
  const [reportSummary, setReportSummary] = useState<string>("");
  const [loadingReport, setLoadingReport] = useState(false);

  const stats = useMemo(() => {
    const totalAttendance = students.reduce((acc, curr) => acc + curr.attendanceCount, 0);
    const avgPercent = students.length ? (totalAttendance / (students.length * 65) * 100) : 0;
    
    const deptStats = DEPARTMENTS.map(d => {
      const s = students.filter(x => x.department === d);
      const a = s.length ? s.reduce((acc, curr) => acc + curr.attendanceCount, 0) / s.length : 0;
      return { dept: d, avg: (a / 65) * 100 };
    });
    
    const topDept = [...deptStats].sort((a,b) => b.avg - a.avg)[0]?.dept || 'N/A';

    return { totalAttendance, avgPercent, deptStats, topDept };
  }, [students]);

  useEffect(() => {
    const fetchReport = async () => {
      setLoadingReport(true);
      const report = await getAdminReport({ studentCount: students.length, average: stats.avgPercent.toFixed(1), topDept: stats.topDept });
      setReportSummary(report || "Awaiting system data synchronization...");
      setLoadingReport(false);
    };
    if (students.length > 0) fetchReport();
  }, [students, stats]);

  return (
    <div className="flex-1 overflow-y-auto pb-28 lg:pb-0">
      <Header title="Mission Control" user={user} darkMode={darkMode} setDarkMode={setDarkMode} />
      <main className="p-6 md:p-12 space-y-10 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          <StatCard label="Enrollment" value={students.length} icon={<Users size={24} />} color="bg-indigo-600" />
          <StatCard label="Overall Participation" value={`${stats.avgPercent.toFixed(1)}%`} icon={<CheckCircle2 size={24} />} color="bg-emerald-500" />
          <StatCard label="Total Marks" value={stats.totalAttendance} icon={<Clock size={24} />} color="bg-amber-500" />
          <StatCard label="Lead Dept." value={stats.topDept.split(' ')[0]} icon={<Trophy size={24} />} color="bg-slate-800" />
        </div>
        
        <div className="bg-white dark:bg-slate-900/50 p-10 rounded-4xl border border-slate-200 dark:border-white/5 shadow-xl transition-all">
          <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mb-10 flex items-center gap-3">
             <ShieldAlert size={20} className="text-indigo-500" />
             AI Intelligence Report
          </h3>
          {loadingReport ? (
             <div className="flex flex-col items-center gap-5 py-20">
               <Loader2 className="animate-spin text-indigo-500" size={40} />
               <p className="text-[11px] font-black uppercase text-slate-400 tracking-widest">Generating system overview...</p>
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
          {stats.deptStats.map(s => (
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

const StudentRegistryView = ({ darkMode, setDarkMode }: any) => {
  const { students } = useStudentData();
  const [selectedDept, setSelectedDept] = useState('All Departments');
  const user = authService.getCurrentUser();
  const filtered = selectedDept === 'All Departments' ? students : students.filter((s: any) => s.department === selectedDept);

  return (
    <div className="flex-1 overflow-y-auto pb-28 lg:pb-0">
      <Header title="Academic Ledger" user={user} darkMode={darkMode} setDarkMode={setDarkMode} />
      <div className="p-6 md:p-12 space-y-10 max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tighter">Student Roster</h2>
            <p className="text-sm text-slate-500 font-medium">Monitoring attendance and evaluation marks across campus.</p>
          </div>
          <div className="flex items-center gap-4 w-full lg:w-auto">
            <select 
              value={selectedDept} 
              onChange={(e) => setSelectedDept(e.target.value)} 
              className="flex-1 lg:w-64 px-6 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl text-[11px] font-black uppercase tracking-widest text-slate-900 dark:text-white outline-none shadow-sm focus:ring-2 ring-indigo-500/20"
            >
              <option>All Departments</option>
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <button 
              onClick={() => generateDepartmentReport(selectedDept, filtered)}
              className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-extrabold text-[11px] uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 active:scale-95 transition-all"
            >
              <FileDown size={20} /> Export Ledger
            </button>
          </div>
        </div>
        
        <div className="bg-white dark:bg-slate-900 rounded-4xl border border-slate-200 dark:border-white/10 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/80 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-white/5">
                  <th className="px-10 py-8">Identity Reference</th>
                  <th className="px-10 py-8">Academic Status</th>
                  <th className="px-10 py-8 text-center">Sessions</th>
                  <th className="px-10 py-8 text-right">Spiritual Mark</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                {filtered.map((s: any) => (
                  <tr key={s.id} className="group hover:bg-indigo-50/50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="px-10 py-6 flex items-center gap-5">
                      <div className="relative">
                        <div className="absolute -inset-1 bg-gradient-to-tr from-indigo-500 to-amber-500 rounded-2xl blur opacity-0 group-hover:opacity-20 transition duration-500"></div>
                        <Avatar src={s.profilePicture} seed={s.name} className="relative w-12 h-12 rounded-2xl shadow-sm" />
                      </div>
                      <div>
                        <p className="font-extrabold text-slate-900 dark:text-white tracking-tight leading-none text-base">{s.name}</p>
                        <p className="text-[10px] font-extrabold text-slate-400 mt-1 uppercase tracking-wider">{s.indexNumber}</p>
                      </div>
                    </td>
                    <td className="px-10 py-6">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-extrabold text-indigo-500 uppercase">{s.department}</span>
                        <span className="text-[10px] font-bold text-slate-400">{s.semester}</span>
                      </div>
                    </td>
                    <td className="px-10 py-6 text-center font-black text-lg text-slate-900 dark:text-white">{s.attendanceCount}</td>
                    <td className="px-10 py-6 text-right font-black text-2xl text-emerald-600 dark:text-emerald-500">
                      {(s.attendanceCount / 65 * 5).toFixed(2)}
                      <span className="text-xs text-slate-400 ml-1 font-bold">/5</span>
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

const LoginView = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const user = await authService.login(email, password);
      if (user) {
        navigate(user.role === 'admin' ? '/admin' : '/student');
      } else {
        setError('Invalid credentials');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2"></div>
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-amber-600/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2"></div>
      
      <div className="w-full max-w-md bg-white/5 backdrop-blur-3xl p-10 md:p-14 rounded-5xl border border-white/10 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] relative z-10">
        <div className="text-center mb-12">
          <div className="w-24 h-24 bg-indigo-600 rounded-4xl mx-auto mb-8 flex items-center justify-center shadow-[0_20px_40px_-10px_rgba(79,70,229,0.5)]">
            <ShieldCheck size={44} className="text-white" />
          </div>
          <h1 className="text-4xl font-extrabold text-white tracking-tighter mb-2">Secure Access</h1>
          <p className="text-slate-400 font-extrabold uppercase text-[11px] tracking-[0.3em]">ANU Chaplaincy System</p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-8">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-4">Institutional Email</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-8 py-6 bg-white/5 border border-white/10 rounded-3xl text-white font-bold outline-none focus:border-indigo-500 focus:bg-white/10 transition-all text-sm" 
              placeholder="name@anu.edu.gh"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-4">System Key</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-8 py-6 bg-white/5 border border-white/10 rounded-3xl text-white font-bold outline-none focus:border-indigo-500 focus:bg-white/10 transition-all text-sm" 
              placeholder="••••••••"
            />
          </div>
          {error && (
            <div className="p-5 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-4 text-red-500 animate-in fade-in slide-in-from-top-2">
              <ShieldAlert size={20} />
              <p className="text-[11px] font-black uppercase tracking-tight">{error}</p>
            </div>
          )}
          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-3xl text-[12px] font-extrabold uppercase tracking-[0.2em] transition-all shadow-2xl hover:shadow-indigo-600/40 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
          >
            {loading ? <Loader2 className="animate-spin" size={24} /> : <span>Verify Identity</span>}
          </button>
        </form>
        
        <div className="mt-12 pt-10 border-t border-white/10 text-center">
          <Link to="/register" className="text-indigo-400 hover:text-indigo-300 transition-colors text-[11px] font-black uppercase tracking-[0.2em]">
            Establish Digital Persona
          </Link>
        </div>
      </div>
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
    const handleStorageChange = () => {
      setCurrentUser(authService.getCurrentUser());
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
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
                  <Route path="/notifications" element={<NotificationSettingsView darkMode={darkMode} setDarkMode={setDarkMode} />} />
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
                  <Route path="/students" element={<StudentRegistryView darkMode={darkMode} setDarkMode={setDarkMode} />} />
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

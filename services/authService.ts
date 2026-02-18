
import { DEPARTMENTS } from '../constants';

export interface UserProfile {
  id: string;
  firstName: string;
  surname: string;
  email: string;
  indexNumber: string;
  qrToken: string; // Unique cryptographic token for QR scanning
  department: string;
  semester: string;
  password?: string;
  role: 'student' | 'admin';
  isApproved: boolean;
  createdAt: string;
  profilePicture?: string; 
}

const STORAGE_KEY = 'anu_users_db';
const PENDING_KEY = 'anu_pending_admins';
const SESSION_KEY = 'anu_current_session';

const generateToken = () => `ANU-SEC-${Math.random().toString(36).substring(2, 7).toUpperCase()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

const PRESEEDED_USERS: UserProfile[] = [
  {
    id: 'admin-bassey',
    firstName: 'Bassey',
    surname: 'Shaun',
    email: 'basseyshaun@gmail.com',
    indexNumber: 'ANU24420005',
    qrToken: 'ANU-SEC-AUTH-ADMIN-01',
    department: 'Computer Engineering',
    semester: 'Level 400',
    password: '123456789',
    role: 'admin',
    isApproved: true,
    createdAt: '2024-01-01T00:00:00.000Z'
  },
  {
    id: 'student-kwame',
    firstName: 'Kwame',
    surname: 'Mensah',
    email: 'kwame@anu.edu.gh',
    indexNumber: 'ANU24420001',
    qrToken: 'ANU-SEC-TOKEN-7Y2P9',
    department: 'Computer Science',
    semester: 'Level 100',
    password: 'password123',
    role: 'student',
    isApproved: true,
    createdAt: '2024-01-01T00:00:00.000Z'
  },
  {
    id: 'student-akoto',
    firstName: 'Akoto',
    surname: 'User',
    email: 'shaunbasseys@gmail.com',
    indexNumber: 'ANU24420010',
    qrToken: 'ANU-SEC-TOKEN-X8R4Q',
    department: 'Computer Science',
    semester: 'Semester One',
    password: '1234567890',
    role: 'student',
    isApproved: true,
    createdAt: '2024-05-20T10:00:00.000Z'
  }
];

export const authService = {
  register: async (data: any): Promise<UserProfile> => {
    const newUser: UserProfile = {
      id: Math.random().toString(36).substr(2, 9),
      ...data,
      qrToken: generateToken(),
      isApproved: data.role === 'student',
      createdAt: new Date().toISOString(),
    };

    if (data.role === 'admin' && data.requestAdminApproval) {
      const pending = authService.getPendingAdmins();
      localStorage.setItem(PENDING_KEY, JSON.stringify([...pending, newUser]));
    } else {
      const users = authService.getStoredUsers();
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...users, newUser]));
    }

    return newUser;
  },

  getStoredUsers: (): UserProfile[] => {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  },

  getAllUsers: (): UserProfile[] => {
    const stored = authService.getStoredUsers();
    const all = [...PRESEEDED_USERS];
    stored.forEach(u => {
      if (!all.some(p => p.email === u.email)) {
        all.push(u);
      }
    });
    return all;
  },

  getPendingAdmins: (): UserProfile[] => {
    const data = localStorage.getItem(PENDING_KEY);
    return data ? JSON.parse(data) : [];
  },

  approveAdmin: async (userId: string): Promise<void> => {
    const pending = authService.getPendingAdmins();
    const userToApprove = pending.find(u => u.id === userId);
    
    if (userToApprove) {
      const updatedUser = { ...userToApprove, isApproved: true };
      const users = authService.getStoredUsers();
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...users, updatedUser]));
      localStorage.setItem(PENDING_KEY, JSON.stringify(pending.filter(u => u.id !== userId)));
    }
  },

  rejectAdmin: async (userId: string): Promise<void> => {
    const pending = authService.getPendingAdmins();
    localStorage.setItem(PENDING_KEY, JSON.stringify(pending.filter(u => u.id !== userId)));
  },

  login: async (email: string, password?: string, indexNumber?: string): Promise<UserProfile | null> => {
    const users = authService.getAllUsers();
    
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (!user) {
      const pending = authService.getPendingAdmins();
      if (pending.some(u => u.email.toLowerCase() === email.toLowerCase())) {
        throw new Error("Approval Pending");
      }
      return null;
    }

    if (indexNumber && user.indexNumber.toUpperCase() !== indexNumber.toUpperCase()) {
      return null;
    }

    if (user.password && password && user.password !== password) {
      throw new Error("Invalid password.");
    }
    
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    return user;
  },

  getCurrentUser: (): UserProfile | null => {
    const session = localStorage.getItem(SESSION_KEY);
    return session ? JSON.parse(session) : null;
  },

  updateProfile: (data: Partial<UserProfile>): UserProfile => {
    const user = authService.getCurrentUser();
    if (!user) throw new Error("No active session found.");

    const updatedUser: UserProfile = { ...user, ...data };

    localStorage.setItem(SESSION_KEY, JSON.stringify(updatedUser));

    const storedUsers = authService.getStoredUsers();
    const userIndex = storedUsers.findIndex(u => u.id === user.id);
    
    if (userIndex !== -1) {
      storedUsers[userIndex] = updatedUser;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(storedUsers));
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...storedUsers, updatedUser]));
    }

    return updatedUser;
  },

  logout: () => {
    localStorage.removeItem(SESSION_KEY);
  }
};

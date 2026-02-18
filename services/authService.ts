
import { DEPARTMENTS } from '../constants';
import { auth, db } from '../firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  Timestamp
} from 'firebase/firestore';

export interface UserProfile {
  id: string;
  firstName: string;
  surname: string;
  email: string;
  indexNumber: string;
  qrToken: string;
  department: string;
  semester: string;
  role: 'student' | 'admin';
  isApproved: boolean;
  createdAt: any;
  profilePicture?: string;
  attendanceCount?: number;
}

const SESSION_KEY = 'anu_current_session_profile';

const generateToken = () => `ANU-SEC-${Math.random().toString(36).substring(2, 7).toUpperCase()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

export const authService = {
  register: async (data: any): Promise<UserProfile> => {
    const { email, password, ...rest } = data;
    
    // 1. Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // 2. Prepare Profile
    const newUser: UserProfile = {
      id: user.uid,
      email: email,
      firstName: rest.firstName,
      surname: rest.surname,
      indexNumber: rest.indexNumber,
      qrToken: rest.role === 'student' ? generateToken() : 'N/A',
      department: rest.department,
      semester: rest.semester,
      role: rest.role,
      isApproved: rest.role === 'student', // Students auto-approved for this prototype, admins need approval
      createdAt: Timestamp.now(),
      profilePicture: rest.profilePicture || '',
      attendanceCount: rest.role === 'student' ? 0 : undefined
    };

    // 3. Save to Firestore
    await setDoc(doc(db, "users", user.uid), newUser);

    return newUser;
  },

  login: async (email: string, password?: string): Promise<UserProfile | null> => {
    if (!password) throw new Error("Password required");
    
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Fetch profile from Firestore
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (!userDoc.exists()) {
      throw new Error("Profile not found");
    }

    const profile = userDoc.data() as UserProfile;
    
    if (profile.role === 'admin' && !profile.isApproved) {
      await signOut(auth);
      throw new Error("Admin approval pending. Please contact Chaplaincy Office.");
    }

    localStorage.setItem(SESSION_KEY, JSON.stringify(profile));
    return profile;
  },

  logout: async () => {
    await signOut(auth);
    localStorage.removeItem(SESSION_KEY);
  },

  getCurrentUser: (): UserProfile | null => {
    const session = localStorage.getItem(SESSION_KEY);
    return session ? JSON.parse(session) : null;
  },

  // This is a local sync helper for UI
  syncLocalProfile: (profile: UserProfile) => {
    localStorage.setItem(SESSION_KEY, JSON.stringify(profile));
  },

  updateProfile: async (data: Partial<UserProfile>): Promise<UserProfile> => {
    const current = authService.getCurrentUser();
    if (!current) throw new Error("Not logged in");

    const userRef = doc(db, "users", current.id);
    await updateDoc(userRef, data);

    const updated = { ...current, ...data };
    authService.syncLocalProfile(updated);
    return updated;
  },

  approveAdmin: async (userId: string) => {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, { isApproved: true });
  },

  rejectAdmin: async (userId: string) => {
    // In a real app, you might delete the auth user too
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, { role: 'rejected' });
  }
};

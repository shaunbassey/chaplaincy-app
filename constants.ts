
import { SemesterStats, SessionType } from './types';

export const UNIVERSITY_NAME = "All Nations University";
export const CHAPLAINCY_MOTTO = "For Every Nation";

export const SEMESTER_CONFIG: SemesterStats = {
  totalSessions: 65, // (4 devotions + 1 chapel) * 13 weeks
  maxMarks: 5.0,
  weeks: 13,
};

export const DEVOTION_DAYS = ['Monday', 'Tuesday', 'Thursday', 'Friday'];
export const CHAPEL_DAY = 'Wednesday';

export const DEPARTMENTS = [
  'Computer Science',
  'Oil and Gas Engineering',
  'Computer Engineering',
  'Biomedical Engineering'
];

export const MOCK_STUDENTS = [
  { id: '1', name: 'Kwame Mensah', indexNumber: 'ANU24420001', qrToken: 'ANU-SEC-TOKEN-KWAME', department: 'Computer Science', semester: 'Semester One', attendanceCount: 58 },
  { id: '2', name: 'Abena Osei', indexNumber: 'ANU24420002', qrToken: 'ANU-SEC-TOKEN-ABENA', department: 'Computer Science', semester: 'Semester Three', attendanceCount: 62 },
  { id: '3', name: 'John Doe', indexNumber: 'DOGE24420003', qrToken: 'ANU-SEC-TOKEN-JOHN', department: 'Oil and Gas Engineering', semester: 'Semester Seven', attendanceCount: 45 },
  { id: '4', name: 'Sarah Wilson', indexNumber: 'DECE24420004', qrToken: 'ANU-SEC-TOKEN-SARAH', department: 'Computer Engineering', semester: 'Semester Five', attendanceCount: 65 },
  { id: '5', name: 'Kofi Annan', indexNumber: 'DBME24420005', qrToken: 'ANU-SEC-TOKEN-KOFI', department: 'Biomedical Engineering', semester: 'Semester One', attendanceCount: 30 },
  { id: '6', name: 'Efua Sutherland', indexNumber: 'DECE24420006', qrToken: 'ANU-SEC-TOKEN-EFUA', department: 'Computer Engineering', semester: 'Semester Three', attendanceCount: 55 },
  { id: '7', name: 'Yaw Boateng', indexNumber: 'DOGE24420007', qrToken: 'ANU-SEC-TOKEN-YAW', department: 'Oil and Gas Engineering', semester: 'Semester Five', attendanceCount: 12 },
  { id: '8', name: 'Ama Ata Aidoo', indexNumber: 'DBME24420008', qrToken: 'ANU-SEC-TOKEN-AMA', department: 'Biomedical Engineering', semester: 'Semester Seven', attendanceCount: 60 },
  { id: '9', name: 'Akoto', indexNumber: 'ANU24420010', qrToken: 'ANU-SEC-TOKEN-AKOTO', department: 'Computer Science', semester: 'Semester One', attendanceCount: 42 },
];

export const APP_THEME = {
  primary: 'bg-indigo-950',
  secondary: 'bg-amber-500',
  accent: 'text-indigo-600',
  gradient: 'from-slate-900 to-indigo-950'
};

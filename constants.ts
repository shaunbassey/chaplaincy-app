
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
  { id: '1', name: 'Kwame Mensah', indexNumber: 'ANU24420001', department: 'Computer Science', semester: 'Semester One', attendanceCount: 58 },
  { id: '2', name: 'Abena Osei', indexNumber: 'ANU24420002', department: 'Computer Science', semester: 'Semester Three', attendanceCount: 62 },
  { id: '3', name: 'John Doe', indexNumber: 'DOGE24420003', department: 'Oil and Gas Engineering', semester: 'Semester Seven', attendanceCount: 45 },
  { id: '4', name: 'Sarah Wilson', indexNumber: 'DECE24420004', department: 'Computer Engineering', semester: 'Semester Five', attendanceCount: 65 },
  { id: '5', name: 'Kofi Annan', indexNumber: 'DBME24420005', department: 'Biomedical Engineering', semester: 'Semester One', attendanceCount: 30 },
  { id: '6', name: 'Efua Sutherland', indexNumber: 'DECE24420006', department: 'Computer Engineering', semester: 'Semester Three', attendanceCount: 55 },
  { id: '7', name: 'Yaw Boateng', indexNumber: 'DOGE24420007', department: 'Oil and Gas Engineering', semester: 'Semester Five', attendanceCount: 12 },
  { id: '8', name: 'Ama Ata Aidoo', indexNumber: 'DBME24420008', department: 'Biomedical Engineering', semester: 'Semester Seven', attendanceCount: 60 },
];

export const APP_THEME = {
  primary: 'bg-indigo-950',
  secondary: 'bg-amber-500',
  accent: 'text-indigo-600',
  gradient: 'from-slate-900 to-indigo-950'
};

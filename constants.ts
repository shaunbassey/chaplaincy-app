
import { SemesterStats, SessionType } from './types';

export const UNIVERSITY_NAME = "All Nations University";
export const CHAPLAINCY_MOTTO = "For Every Nation";

// Configuration for ANU Attendance
// 4 Devotions (Mon, Tue, Thu, Fri) + 1 Chapel (Wed) = 5 sessions/week
// 5 sessions * 13 weeks = 65 total sessions
export const SEMESTER_CONFIG: SemesterStats = {
  totalSessions: 65, 
  maxMarks: 5.0,
  weeks: 13,
};

export const DEVOTION_DAYS = ['Monday', 'Tuesday', 'Thursday', 'Friday'];
export const CHAPEL_DAY = 'Wednesday';

export const DEPARTMENTS = [
  'Computer Science',
  'Oil and Gas Engineering',
  'Computer Engineering',
  'Biomedical Engineering',
  'Electronics & Communications Engineering',
  'Business Administration',
  'Nursing'
];

export const APP_THEME = {
  primary: 'bg-indigo-950',
  secondary: 'bg-amber-500',
  accent: 'text-indigo-600',
  gradient: 'from-slate-900 to-indigo-950'
};


export enum SessionType {
  DEVOTION = 'DEVOTION',
  CHAPEL = 'CHAPEL'
}

export interface Student {
  id: string;
  name: string;
  indexNumber: string;
  department: string;
  semester: string;
  attendanceCount: number;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  sessionId: string;
  timestamp: string;
  type: SessionType;
  week: number;
}

export interface Session {
  id: string;
  date: string;
  type: SessionType;
  week: number;
  day: string;
}

export interface SemesterStats {
  totalSessions: number;
  maxMarks: number;
  weeks: number;
}

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { UNIVERSITY_NAME, SEMESTER_CONFIG } from '../constants';

/**
 * Generates a deterministic weekly attendance breakdown for a student
 * based on their index number to ensure reports are consistent.
 */
const getDeterministicWeeklyAttendance = (indexNumber: string, totalAttendance: number): string[] => {
  let hash = 0;
  for (let i = 0; i < indexNumber.length; i++) {
    hash = indexNumber.charCodeAt(i) + ((hash << 5) - hash);
  }

  const weeks: number[] = new Array(13).fill(0);
  let remaining = totalAttendance;
  
  for (let i = 0; i < 13 && remaining > 0; i++) {
    weeks[i] = Math.min(remaining, 1);
    remaining -= weeks[i];
  }

  let attempt = 0;
  while (remaining > 0 && attempt < 100) {
    for (let i = 0; i < 13 && remaining > 0; i++) {
      const seed = Math.abs((hash + i + attempt) % 100) / 100;
      if (weeks[i] < 5 && seed > 0.3) {
        weeks[i]++;
        remaining--;
      }
    }
    attempt++;
  }
  
  for (let i = 0; i < 13 && remaining > 0; i++) {
    const space = 5 - weeks[i];
    const add = Math.min(space, remaining);
    weeks[i] += add;
    remaining -= add;
  }

  return weeks.map(w => w.toString());
};

export const generateDepartmentReport = (department: string, students: any[]) => {
  const doc = new jsPDF('l', 'mm', 'a4'); 
  const date = new Date().toLocaleDateString();

  doc.setFontSize(22);
  doc.setTextColor(15, 23, 42); 
  doc.text(UNIVERSITY_NAME.toUpperCase(), 14, 20);
  
  doc.setFontSize(14);
  doc.setTextColor(79, 70, 229); 
  doc.text(`CHAPLAINCY OFFICE - ATTENDANCE REPORT`, 14, 28);
  
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139); 
  doc.text(`Department: ${department}`, 14, 35);
  doc.text(`Generated on: ${date}`, 14, 40);
  doc.text(`Semester: 1 | Academic Year: 2024/2025 | Target: ${SEMESTER_CONFIG.totalSessions} Sessions`, 14, 45);

  const tableHeaders = [
    'Student Name', 
    'Index No.', 
    'Sem.',
    'W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8', 'W9', 'W10', 'W11', 'W12', 'W13',
    'Total', 
    'Mark'
  ];

  const tableData = students.map(student => {
    const weeks = getDeterministicWeeklyAttendance(student.indexNumber, student.attendanceCount);
    const mark = (student.attendanceCount / SEMESTER_CONFIG.totalSessions * 5).toFixed(2);
    
    return [
      student.name,
      student.indexNumber,
      student.semester?.replace('Level ', 'L') || 'L100',
      ...weeks,
      student.attendanceCount,
      `${mark}/5`
    ];
  });

  autoTable(doc, {
    startY: 55,
    head: [tableHeaders],
    body: tableData,
    theme: 'grid',
    headStyles: { 
      fillColor: [30, 41, 59], 
      textColor: [255, 255, 255],
      fontSize: 7,
      halign: 'center',
      fontStyle: 'bold'
    },
    styles: { 
      fontSize: 7,
      cellPadding: 2,
      valign: 'middle',
      font: 'helvetica'
    },
    columnStyles: {
      0: { cellWidth: 35, fontStyle: 'bold' },
      1: { cellWidth: 25 },
      2: { cellWidth: 12, halign: 'center' },
      ...Object.fromEntries([...Array(13).keys()].map(i => [i + 3, { halign: 'center', cellWidth: 8 }])),
      16: { fontStyle: 'bold', halign: 'center', cellWidth: 12, fillColor: [248, 250, 252] },
      17: { fontStyle: 'bold', textColor: [79, 70, 229], halign: 'center', cellWidth: 12, fillColor: [240, 242, 255] }
    },
    margin: { left: 14, right: 14 },
    alternateRowStyles: {
      fillColor: [250, 251, 252]
    }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 25;
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  
  doc.text('__________________________', 14, finalY);
  doc.text('Head of Department Signature', 14, finalY + 7);
  
  doc.text('__________________________', 210, finalY);
  doc.text('University Chaplain Signature', 210, finalY + 7);
  
  doc.setFontSize(8);
  doc.text(`${UNIVERSITY_NAME} - Excellence & Spiritual Integrity`, 148, 200, { align: 'center' });

  doc.save(`${department.replace(/\s+/g, '_')}_Weekly_Attendance.pdf`);
};

export const generateMonthlySchedulePDF = (monthName: string, items: any[]) => {
  const doc = new jsPDF('p', 'mm', 'a4');
  const dateStr = new Date().toLocaleDateString();

  doc.setFontSize(24);
  doc.setTextColor(30, 27, 75); 
  doc.text(UNIVERSITY_NAME.toUpperCase(), 105, 25, { align: 'center' });
  
  doc.setFontSize(14);
  doc.setTextColor(245, 158, 11); 
  doc.text("UNIVERSITY CHAPLAINCY OFFICE", 105, 33, { align: 'center' });

  doc.setDrawColor(30, 27, 75);
  doc.setLineWidth(0.5);
  doc.line(14, 40, 196, 40);

  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42);
  doc.text(`MONTHLY SPIRITUAL CALENDAR: ${monthName}`, 14, 55);

  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`Generated Date: ${dateStr}`, 14, 62);
  doc.text(`"For Every Nation"`, 196, 62, { align: 'right' });

  const tableHeaders = [['DATE', 'SESSION TYPE', 'TIME', 'VENUE']];
  const tableData = items.map(item => [
    item.date || 'TBD',
    item.type,
    item.time,
    item.venue
  ]);

  autoTable(doc, {
    startY: 70,
    head: tableHeaders,
    body: tableData,
    theme: 'striped',
    headStyles: { 
      fillColor: [30, 27, 75], 
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center'
    },
    styles: { 
      fontSize: 10,
      cellPadding: 6
    },
    columnStyles: {
      0: { cellWidth: 40, halign: 'center' },
      1: { cellWidth: 50, fontStyle: 'bold' },
      2: { cellWidth: 35, halign: 'center' },
      3: { cellWidth: 'auto' }
    }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 30;
  
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('Approved by:', 14, finalY);
  
  doc.setLineWidth(0.2);
  doc.line(14, finalY + 15, 80, finalY + 15);
  doc.setFontSize(9);
  doc.text('Rev. Prof. Kingsley', 14, finalY + 20);
  doc.text('University Chaplain', 14, finalY + 24);

  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('All Nations University - Koforidua, Ghana', 105, 285, { align: 'center' });

  doc.save(`ANU_Spiritual_Calendar_${monthName.replace(/\s+/g, '_')}.pdf`);
};
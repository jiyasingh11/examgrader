
import { GradingReport } from "../types";

export const downloadCSV = (report: GradingReport) => {
  // Define Headers
  const headers = ['ID', 'Question', 'Student Answer', 'Correct Answer', 'Is Correct', 'Feedback'];

  // Map problems to rows
  const rows = report.problems.map(p => [
    p.id,
    `"${(p.questionText || '').replace(/"/g, '""')}"`, // Escape double quotes
    `"${(p.studentResponse || '').replace(/"/g, '""')}"`,
    `"${(p.correctResponse || '').replace(/"/g, '""')}"`,
    p.isCorrect ? 'Yes' : 'No',
    `"${(p.feedback || '').replace(/"/g, '""')}"`
  ]);

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map(r => r.join(','))
  ].join('\n');

  // Create Blob and download link
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `ExamGrader_${report.subject}_${dateStr}.csv`;

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
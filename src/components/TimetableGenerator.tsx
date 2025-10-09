import React, { useState } from 'react';
import { Play, RotateCcw, AlertTriangle, CheckCircle } from 'lucide-react';
import { useData } from '../context/DataContext';
import type { TimetableSlot } from '../context/DataContext';

export default function TimetableGenerator() {
  const { classes, subjects, faculty, periods, setTimetable, timetable } = useData();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState<'idle' | 'generating' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const validateData = () => {
    const errors = [];
    if (classes.length === 0) errors.push('No classes defined.');
    if (subjects.length === 0) errors.push('No subjects defined.');
    if (faculty.length === 0) errors.push('No faculty defined.');
    if (periods.length === 0) errors.push('No periods defined.');
    if (!faculty.some(f => f.subjects?.length > 0)) {
      errors.push('No faculty members have been assigned any subjects.');
    }
    return errors;
  };

  const generateTimetable = async () => {
    setIsGenerating(true);
    setGenerationStatus('generating');
    setErrorMessage('');

    try {
      await new Promise(resolve => setTimeout(resolve, 50));
      const errors = validateData();
      if (errors.length > 0) throw new Error(errors.join('\n'));

      const theorySubjects = subjects.filter(s => !s.name.toUpperCase().startsWith('PRACTICAL'));
      const practicalSubjects = subjects.filter(s => s.name.toUpperCase().startsWith('PRACTICAL'));
      
      const grid: (TimetableSlot | null)[][] = Array.from({ length: weekDays.length }, () => Array(periods.length * classes.length).fill(null));

      const occupiedFacultySlots = new Set<string>();
      const dailyClassFaculty = new Map<string, Set<string>>();
      const dailyFacultyPeriodCount = new Map<string, number>();

      for (let dayIndex = 0; dayIndex < weekDays.length; dayIndex++) {
        const day = weekDays[dayIndex];
        classes.forEach(cls => dailyClassFaculty.set(`${cls.id}-${day}`, new Set()));
        faculty.forEach(f => dailyFacultyPeriodCount.set(`${f.id}-${day}`, 0));

        for (let periodIndex = 0; periodIndex < periods.length; periodIndex++) {
          const period = periods[periodIndex];
          if (period.isBreak) continue;

          for (let classIndex = 0; classIndex < classes.length; classIndex++) {
            const cls = classes[classIndex];
            const facultyTaughtToday = dailyClassFaculty.get(`${cls.id}-${day}`)!;

            let availableFaculty = faculty.filter(f =>
              !occupiedFacultySlots.has(`${f.id}-${day}-${period.id}`) &&
              !facultyTaughtToday.has(f.id) &&
              (dailyFacultyPeriodCount.get(`${f.id}-${day}`) || 0) < 3
            ).sort(() => 0.5 - Math.random());
            let assignedSlot: TimetableSlot | null = null;

            for (const fac of availableFaculty) {
                const subjectId = fac.subjects.find(sId => theorySubjects.some(ts => ts.id === sId));
                if (subjectId) {
                    assignedSlot = { id: `${day}-${period.id}-${cls.id}`, day, periodId: period.id, classId: cls.id, subjectId, facultyId: fac.id };
                    break;
                }
            }

            if (!assignedSlot) {
                const repeatingFaculty = faculty.filter(f =>
                  !occupiedFacultySlots.has(`${f.id}-${day}-${period.id}`) &&
                  facultyTaughtToday.has(f.id) &&
                  (dailyFacultyPeriodCount.get(`${f.id}-${day}`) || 0) < 3
                ).sort(() => 0.5 - Math.random());
                for (const fac of repeatingFaculty) {
                    const subjectsTaughtByFacultyToday = timetable.filter(s => s.day === day && s.classId === cls.id && s.facultyId === fac.id).map(s => s.subjectId);
                    const newSubjectId = fac.subjects.find(sId => !subjectsTaughtByFacultyToday.includes(sId));
                    if(newSubjectId){
                        assignedSlot = { id: `${day}-${period.id}-${cls.id}`, day, periodId: period.id, classId: cls.id, subjectId: newSubjectId, facultyId: fac.id };
                        break;
                    }
                }
            }

            if (!assignedSlot) {
                const fallbackFaculty = faculty.filter(f =>
                  !occupiedFacultySlots.has(`${f.id}-${day}-${period.id}`) &&
                  (dailyFacultyPeriodCount.get(`${f.id}-${day}`) || 0) < 3
                ).sort(() => 0.5 - Math.random());
                if (fallbackFaculty.length > 0) {
                    const fac = fallbackFaculty[0];
                    const subjectId = fac.subjects[0];
                    assignedSlot = { id: `${day}-${period.id}-${cls.id}`, day, periodId: period.id, classId: cls.id, subjectId, facultyId: fac.id };
                }
            }

            if (assignedSlot) {
              const flatIndex = dayIndex * (periods.length * classes.length) + periodIndex * classes.length + classIndex;
              grid[dayIndex][flatIndex] = assignedSlot;
              occupiedFacultySlots.add(`${assignedSlot.facultyId}-${day}-${period.id}`);
              facultyTaughtToday.add(assignedSlot.facultyId);
              const currentCount = dailyFacultyPeriodCount.get(`${assignedSlot.facultyId}-${day}`) || 0;
              dailyFacultyPeriodCount.set(`${assignedSlot.facultyId}-${day}`, currentCount + 1);
            }
          }
        }
      }

      setTimetable(grid.flat().filter(Boolean) as TimetableSlot[]);
      setGenerationStatus('success');

    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'An unknown error occurred.');
      setGenerationStatus('error');
    } finally {
      setIsGenerating(false);
    }
  };
  
  const clearTimetable = () => {
    if (window.confirm('Are you sure you want to clear the timetable?')) {
      setTimetable([]);
      setGenerationStatus('idle');
    }
  };

  const validationErrors = validateData();
  
  return (
    <div className="space-y-6">
       <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Timetable Generator</h2>
        <p className="text-gray-600 dark:text-gray-400">Generate a new timetable based on the existing data.</p>
      </div>
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Controls</h3>
        {validationErrors.length > 0 && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-red-800 dark:text-red-200">Cannot Generate Timetable</h4>
                <ul className="mt-2 text-sm text-red-700 dark:text-red-300 list-disc list-inside space-y-1">
                  {validationErrors.map((error, i) => <li key={i}>{error}</li>)}
                </ul>
              </div>
            </div>
          </div>
        )}
        <div className="flex items-center gap-4">
          <button
            onClick={generateTimetable}
            disabled={isGenerating || validationErrors.length > 0}
            className="inline-flex items-center px-6 py-3 rounded-lg font-medium transition-colors duration-200 bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isGenerating ? (<><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>Generating...</>) : (<><Play className="h-5 w-5 mr-2" />Generate Timetable</>)}
          </button>
          {timetable.length > 0 && (
            <button
              onClick={clearTimetable}
              disabled={isGenerating}
              className="inline-flex items-center px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 font-medium"
            >
              <RotateCcw className="h-5 w-5 mr-2" />
              Clear Timetable
            </button>
          )}
        </div>
        {generationStatus === 'success' && (
             <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
                <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <p className="text-sm font-medium text-green-800 dark:text-green-200">
                        Timetable generated successfully. Go to the "View Timetable" tab to see the results.
                    </p>
                </div>
            </div>
        )}
      </div>
    </div>
  );
}

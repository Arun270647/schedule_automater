import React, { useState } from 'react';
import { Play, RotateCcw, AlertTriangle } from 'lucide-react';
import { useData } from '../context/DataContext';
import { TimetableSlot } from '../types';

const TimetableGenerator: React.FC = () => {
  const { faculties, subjects, classes, periods, setTimetable } = useData();

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const validateData = () => {
    const errors: string[] = [];
    if (faculties.length === 0) errors.push('No faculties available.');
    if (subjects.length === 0) errors.push('No subjects available.');
    if (classes.length === 0) errors.push('No classes available.');
    if (periods.length === 0) errors.push('No periods defined.');
    return errors;
  };

  const generateTimetable = () => {
    setIsGenerating(true);
    setGenerationStatus('idle');
    setErrorMessage('');

    try {
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const grid: (TimetableSlot | null)[][] = Array.from({ length: days.length }, () =>
        Array(periods.length * classes.length).fill(null)
      );

      // Track faculty and class usage per day
      const occupiedFacultySlots = new Set<string>();
      const classSubjectsTaughtToday: Record<string, Record<string, Set<string>>> = {};

      for (let dayIndex = 0; dayIndex < days.length; dayIndex++) {
        const day = days[dayIndex];
        classSubjectsTaughtToday[day] = {};

        for (let cls of classes) {
          classSubjectsTaughtToday[day][cls.id] = new Set();

          for (let period of periods) {
            let assignedSlot: TimetableSlot | null = null;

            for (let fac of faculties) {
              const subjectId = fac.subjects.find(subId => {
                const sub = subjects.find(s => s.id === subId);
                if (!sub) return false;

                // Rule 1: Teacher should not repeat for same class in a day
                const alreadyTaught = classSubjectsTaughtToday[day][cls.id].has(fac.id);
                const isException = fac.subjects.length > 1 || sub.isPractical;

                return (!alreadyTaught || isException);
              });

              if (!subjectId) continue;

              // Check faculty slot availability
              if (occupiedFacultySlots.has(`${fac.id}-${day}-${period.id}`)) continue;

              // Assign slot
              assignedSlot = {
                id: `${day}-${period.id}-${cls.id}`,
                day,
                periodId: period.id,
                classId: cls.id,
                subjectId,
                facultyId: fac.id,
              };

              grid[dayIndex][period.id * classes.length + classes.indexOf(cls)] = assignedSlot;
              occupiedFacultySlots.add(`${fac.id}-${day}-${period.id}`);
              classSubjectsTaughtToday[day][cls.id].add(fac.id);
              break;
            }

            // If no faculty matched → fallback to any available subject/faculty
            if (!assignedSlot) {
              for (let fac of faculties) {
                for (let subId of fac.subjects) {
                  const sub = subjects.find(s => s.id === subId);
                  if (!sub) continue;
                  if (occupiedFacultySlots.has(`${fac.id}-${day}-${period.id}`)) continue;

                  assignedSlot = {
                    id: `${day}-${period.id}-${cls.id}`,
                    day,
                    periodId: period.id,
                    classId: cls.id,
                    subjectId: subId,
                    facultyId: fac.id,
                  };

                  grid[dayIndex][period.id * classes.length + classes.indexOf(cls)] = assignedSlot;
                  occupiedFacultySlots.add(`${fac.id}-${day}-${period.id}`);
                  classSubjectsTaughtToday[day][cls.id].add(fac.id);
                  break;
                }
                if (assignedSlot) break;
              }
            }
          }
        }
      }

      // Flatten and remove nulls
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
    if (window.confirm('Are you sure? This will clear the entire timetable.')) {
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
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Generating...
              </>
            ) : (
              <>
                <Play className="h-5 w-5 mr-2" />
                Generate Timetable
              </>
            )}
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
      </div>
    </div>
  );
};

export default TimetableGenerator;

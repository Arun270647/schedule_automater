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
    if (!faculty.some(f => f.subjects && f.subjects.length > 0)) {
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

      const newTimetable: TimetableSlot[] = [];
      const occupiedFacultySlots = new Set<string>(); // Tracks: "facultyId-day-periodId"
      const dailyClassSubjects = new Map<string, Set<string>>(); // Tracks: "classId-day" -> Set of subjectIds

      for (const day of weekDays) {
        for (const cls of classes) {
            // Initialize the subject tracker for this class for this day
            dailyClassSubjects.set(`${cls.id}-${day}`, new Set());
        }

        for (const period of periods) {
          for (const cls of classes) {
            const dailyClassKey = `${cls.id}-${day}`;
            const subjectsTaughtToday = dailyClassSubjects.get(dailyClassKey)!;

            // Find faculty who are free at this exact time
            const availableFaculty = faculty
              .filter(f => f.subjects && f.subjects.length > 0 && !occupiedFacultySlots.has(`${f.id}-${day}-${period.id}`))
              .sort(() => 0.5 - Math.random());
            
            let assignmentMade = false;
            for (const fac of availableFaculty) {
              // Find a subject this faculty teaches that has NOT been taught to this class today
              const potentialSubjects = fac.subjects.filter(subId => !subjectsTaughtToday.has(subId));

              if (potentialSubjects.length > 0) {
                const subjectIdToAssign = potentialSubjects[0];
                
                const slot: TimetableSlot = {
                  id: `${day}-${period.id}-${cls.id}`,
                  day,
                  periodId: period.id,
                  classId: cls.id,
                  subjectId: subjectIdToAssign,
                  facultyId: fac.id,
                };

                newTimetable.push(slot);
                occupiedFacultySlots.add(`${fac.id}-${day}-${period.id}`);
                subjectsTaughtToday.add(subjectIdToAssign);
                assignmentMade = true;
                break; // Assignment made for this class, move to the next class
              }
            }
          }
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      setTimetable(newTimetable);
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

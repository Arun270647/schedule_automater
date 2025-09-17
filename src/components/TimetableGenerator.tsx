import React, { useState } from 'react';
import { Settings, Play, RotateCcw, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
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
    if (classes.length === 0) errors.push('No classes defined. Please add at least one class.');
    if (subjects.length === 0) errors.push('No subjects defined. Please add at least one subject.');
    if (faculty.length === 0) errors.push('No faculty defined. Please add at least one faculty member.');
    if (periods.length === 0) errors.push('No periods defined. Please configure your periods.');
    const facultyWithSubjects = faculty.some(f => f.subjects && f.subjects.length > 0);
    if (!facultyWithSubjects) errors.push('No faculty members have been assigned any subjects.');
    return errors;
  };

  const generateTimetable = async () => {
    setIsGenerating(true);
    setGenerationStatus('generating');
    setErrorMessage('');

    try {
      await new Promise(resolve => setTimeout(resolve, 50)); // Allow UI to update
      
      const errors = validateData();
      if (errors.length > 0) {
        throw new Error(errors.join(', '));
      }

      const newTimetable: TimetableSlot[] = [];
      const occupiedSlots = new Set<string>(); // Stores "facultyId-day-periodId"

      for (const day of weekDays) {
        for (const period of periods) {
          for (const cls of classes) {
            // Find faculty who are available in this specific slot
            const availableFaculty = faculty.filter(f => 
              !occupiedSlots.has(`${f.id}-${day}-${period.id}`) && f.subjects && f.subjects.length > 0
            );

            if (availableFaculty.length > 0) {
              // Simple random selection of faculty and one of their subjects
              const selectedFaculty = availableFaculty[Math.floor(Math.random() * availableFaculty.length)];
              const selectedSubjectId = selectedFaculty.subjects[Math.floor(Math.random() * selectedFaculty.subjects.length)];

              const slot: TimetableSlot = {
                id: `${day}-${period.id}-${cls.id}`,
                day,
                periodId: period.id,
                classId: cls.id,
                subjectId: selectedSubjectId,
                facultyId: selectedFaculty.id,
              };
              
              newTimetable.push(slot);
              occupiedSlots.add(`${selectedFaculty.id}-${day}-${period.id}`);
            }
          }
        }
      }

      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate generation delay
      
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
    if (window.confirm('Are you sure you want to clear the current timetable? This action cannot be undone.')) {
      setTimetable([]);
      setGenerationStatus('idle');
      setErrorMessage('');
    }
  };
  
  const stats = {
    totalSlots: classes.length * periods.length * weekDays.length,
    filledSlots: timetable.length,
    completionRate: timetable.length > 0 ? ((timetable.length / (classes.length * periods.length * weekDays.length)) * 100).toFixed(1) : '0',
  };

  const validationErrors = validateData();


  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Timetable Generator</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Automatically generate timetables based on your configured data.
        </p>
      </div>

      {/* Generation Controls */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Generation Controls
        </h3>

        {validationErrors.length > 0 && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-red-800 dark:text-red-200">Prerequisites not met</h4>
                <ul className="mt-2 text-sm text-red-700 dark:text-red-300 list-disc list-inside space-y-1">
                  {validationErrors.map((error, index) => <li key={index}>{error}</li>)}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Status Messages */}
        {generationStatus !== 'idle' && (
          <div className={`mb-6 p-4 rounded-lg ${
            generationStatus === 'generating' ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700' :
            generationStatus === 'success' ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700' :
            'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700'
          }`}>
             {/* ... (Status message JSX remains the same) ... */}
          </div>
        )}

        <div className="flex flex-wrap gap-4">
          <button
            onClick={generateTimetable}
            disabled={isGenerating || validationErrors.length > 0}
            className="inline-flex items-center px-6 py-3 rounded-lg font-medium transition-colors duration-200 bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isGenerating ? <><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>Generating...</> : <><Play className="h-5 w-5 mr-2" />Generate Timetable</>}
          </button>
          
          {timetable.length > 0 && (
            <button
              onClick={clearTimetable}
              disabled={isGenerating}
              className="inline-flex items-center px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 font-medium transition-colors duration-200 disabled:opacity-50"
            >
              <RotateCcw className="h-5 w-5 mr-2" />
              Clear Timetable
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

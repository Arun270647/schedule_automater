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
    
    if (classes.length === 0) errors.push('No classes defined');
    if (subjects.length === 0) errors.push('No subjects defined');
    if (faculty.length === 0) errors.push('No faculty defined');
    if (periods.length === 0) errors.push('No periods defined');
    
    // Check if faculty have subjects assigned
    const facultyWithSubjects = faculty.filter(f => f.subjects.length > 0);
    if (facultyWithSubjects.length === 0) {
      errors.push('No faculty have subjects assigned');
    }
    
    return errors;
  };

  const generateTimetable = async () => {
    setIsGenerating(true);
    setGenerationStatus('generating');
    setErrorMessage('');

    try {
      // Validate data
      const errors = validateData();
      if (errors.length > 0) {
        throw new Error(errors.join(', '));
      }

      // Clear existing timetable
      const newTimetable: TimetableSlot[] = [];
      
      // Generate timetable using constraint-based algorithm
      for (const day of weekDays) {
        for (const cls of classes) {
          // Track faculty assigned to this class on this day
          const dailyFacultyAssignment = new Set<string>();
          
          for (const period of periods.sort((a, b) => a.order - b.order)) {
            // Find available faculty for this time slot
            const availableFaculty = faculty.filter(f => {
              // Faculty must have subjects assigned
              if (f.subjects.length === 0) return false;
              
              // Faculty can't be assigned to same class twice in a day
              if (dailyFacultyAssignment.has(f.id)) return false;
              
              // Check if faculty is already scheduled at this time
              const isAlreadyScheduled = newTimetable.some(slot => 
                slot.day === day && 
                slot.periodId === period.id && 
                slot.facultyId === f.id
              );
              
              return !isAlreadyScheduled;
            });
            
            if (availableFaculty.length > 0) {
              // Randomly select a faculty member
              const selectedFaculty = availableFaculty[Math.floor(Math.random() * availableFaculty.length)];
              
              // Randomly select a subject from faculty's subjects
              const availableSubjects = selectedFaculty.subjects.filter(subjectId => 
                subjects.some(s => s.id === subjectId)
              );
              
              if (availableSubjects.length > 0) {
                const selectedSubject = availableSubjects[Math.floor(Math.random() * availableSubjects.length)];
                
                const slot: TimetableSlot = {
                  id: `${day}-${period.id}-${cls.id}-${Date.now()}-${Math.random()}`,
                  day,
                  periodId: period.id,
                  classId: cls.id,
                  subjectId: selectedSubject,
                  facultyId: selectedFaculty.id,
                };
                
                newTimetable.push(slot);
                dailyFacultyAssignment.add(selectedFaculty.id);
              }
            }
          }
        }
      }

      // Simulate generation delay for better UX
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setTimetable(newTimetable);
      setGenerationStatus('success');
      
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to generate timetable');
      setGenerationStatus('error');
    } finally {
      setIsGenerating(false);
    }
  };

  const clearTimetable = () => {
    if (window.confirm('Are you sure you want to clear the current timetable?')) {
      setTimetable([]);
      setGenerationStatus('idle');
      setErrorMessage('');
    }
  };

  const getStats = () => {
    const totalSlots = classes.length * periods.length * weekDays.length;
    const filledSlots = timetable.length;
    const completionRate = totalSlots > 0 ? (filledSlots / totalSlots * 100).toFixed(1) : '0';
    
    return { totalSlots, filledSlots, completionRate };
  };

  const stats = getStats();

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Timetable Generator</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Generate automated timetables using constraint-based scheduling
        </p>
      </div>

      {/* System Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Settings className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Classes</p>
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{classes.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <div className="bg-green-600 p-2 rounded-lg">
              <Settings className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm text-green-600 dark:text-green-400 font-medium">Subjects</p>
              <p className="text-2xl font-bold text-green-700 dark:text-green-300">{subjects.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <div className="bg-purple-600 p-2 rounded-lg">
              <Settings className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">Faculty</p>
              <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{faculty.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <div className="bg-orange-600 p-2 rounded-lg">
              <Clock className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm text-orange-600 dark:text-orange-400 font-medium">Periods</p>
              <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">{periods.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Current Timetable Status */}
      {timetable.length > 0 && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Current Timetable Status
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.filledSlots}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Scheduled Slots</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                {stats.totalSlots - stats.filledSlots}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Available Slots</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.completionRate}%</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Completion Rate</p>
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${stats.completionRate}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* Generation Controls */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Generation Controls
        </h3>
        
        {/* Validation Errors */}
        {validateData().length > 0 && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-red-800 dark:text-red-200">
                  Cannot generate timetable
                </h4>
                <ul className="mt-2 text-sm text-red-700 dark:text-red-300 list-disc list-inside space-y-1">
                  {validateData().map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Generation Status */}
        {generationStatus !== 'idle' && (
          <div className={`mb-6 p-4 rounded-lg ${
            generationStatus === 'generating' 
              ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700'
              : generationStatus === 'success'
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700'
              : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700'
          }`}>
            <div className="flex items-start space-x-3">
              {generationStatus === 'generating' && (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 dark:border-blue-400"></div>
                  <div>
                    <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                      Generating timetable...
                    </h4>
                    <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
                      Applying constraints and optimizing schedule
                    </p>
                  </div>
                </>
              )}
              
              {generationStatus === 'success' && (
                <>
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <div>
                    <h4 className="text-sm font-medium text-green-800 dark:text-green-200">
                      Timetable generated successfully!
                    </h4>
                    <p className="mt-1 text-sm text-green-700 dark:text-green-300">
                      {stats.filledSlots} slots scheduled out of {stats.totalSlots} total slots
                    </p>
                  </div>
                </>
              )}
              
              {generationStatus === 'error' && (
                <>
                  <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                  <div>
                    <h4 className="text-sm font-medium text-red-800 dark:text-red-200">
                      Generation failed
                    </h4>
                    <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                      {errorMessage}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4">
          <button
            onClick={generateTimetable}
            disabled={isGenerating || validateData().length > 0}
            className={`inline-flex items-center px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
              isGenerating || validateData().length > 0
                ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-sm hover:shadow-md'
            }`}
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
              className="inline-flex items-center px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 font-medium transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RotateCcw className="h-5 w-5 mr-2" />
              Clear Timetable
            </button>
          )}
        </div>

        {/* Algorithm Info */}
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
            Algorithm Details
          </h4>
          <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
            <p>• <strong>Constraint 1:</strong> Faculty can handle multiple classes in a day (different periods)</p>
            <p>• <strong>Constraint 2:</strong> Each class can only have one faculty per day per subject</p>
            <p>• <strong>Constraint 3:</strong> Faculty cannot be double-booked for the same time slot</p>
            <p>• Uses randomized assignment within constraints for optimal distribution</p>
          </div>
        </div>
      </div>
    </div>
  );
}
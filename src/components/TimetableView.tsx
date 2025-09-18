import React, { useState, useMemo } from 'react';
import { Download, Filter, User, BookOpen } from 'lucide-react';
import { useData } from '../context/DataContext';

export default function TimetableView() {
  const { classes, subjects, faculty, periods, timetable } = useData();
  const [viewMode, setViewMode] = useState<'class' | 'faculty'>('class');
  const [selectedEntityId, setSelectedEntityId] = useState<string>('');

  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const sortedPeriods = useMemo(() => periods.sort((a, b) => a.order - b.order), [periods]);

  const getEntityName = (id: string, type: 'class' | 'faculty' | 'subject') => {
    switch (type) {
      case 'class': 
        const cls = classes.find(c => c.id === id);
        return cls ? `${cls.name} (${cls.section})` : 'N/A';
      case 'faculty': return faculty.find(f => f.id === id)?.name || 'N/A';
      case 'subject': return subjects.find(s => s.id === id)?.name || 'N/A';
      default: return 'Unknown';
    }
  };

  const timetableGrid = useMemo(() => {
    const grid: { [day: string]: { [periodId: string]: any } } = {};
    const filteredTimetable = selectedEntityId
      ? timetable.filter(slot => viewMode === 'class' ? slot.classId === selectedEntityId : slot.facultyId === selectedEntityId)
      : timetable;

    for (const day of weekDays) {
      grid[day] = {};
      for (const period of sortedPeriods) {
        const slot = filteredTimetable.find(s => s.day === day && s.periodId === period.id);
        grid[day][period.id] = slot || null;
      }
    }
    return grid;
  }, [timetable, selectedEntityId, viewMode, sortedPeriods, classes, faculty, subjects]);

  if (timetable.length === 0) {
    return <div className="text-center py-12">No timetable has been generated yet. Please go to the "Generate" tab.</div>;
  }
  
  const entityOptions = viewMode === 'class' ? classes : faculty;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Timetable View</h2>
        <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50" disabled>
          <Download className="h-4 w-4 mr-2" />
          Export PDF
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <div className="flex items-center space-x-4 mb-4">
          <Filter className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">View Mode</label>
            <div className="flex space-x-4">
              <label className="flex items-center"><input type="radio" value="class" checked={viewMode === 'class'} onChange={() => { setViewMode('class'); setSelectedEntityId(''); }} className="mr-2 text-blue-600 focus:ring-blue-500" /> By Class</label>
              <label className="flex items-center"><input type="radio" value="faculty" checked={viewMode === 'faculty'} onChange={() => { setViewMode('faculty'); setSelectedEntityId(''); }} className="mr-2 text-blue-600 focus:ring-blue-500" /> By Faculty</label>
            </div>
          </div>
          <div>
            <label htmlFor="entitySelect" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select {viewMode === 'class' ? 'Class' : 'Faculty'}</label>
            {/* --- MODIFIED DROPDOWN --- */}
            <select 
              id="entitySelect"
              value={selectedEntityId} 
              onChange={e => setSelectedEntityId(e.target.value)} 
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">-- Select an option --</option>
              {entityOptions.map(e => <option key={e.id} value={e.id}>{e.name} {e.section ? `(${e.section})` : ''}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* --- MODIFIED TIMETABLE GRID WRAPPER --- */}
      <div className="overflow-x-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
            <tr>
              <th scope="col" className="px-4 py-3 sticky left-0 bg-gray-50 dark:bg-gray-700">Day</th>
              {sortedPeriods.map(p => (
                <th key={p.id} scope="col" className="px-4 py-3 text-center whitespace-nowrap">
                  <div>{p.name}</div>
                  <div className="font-normal text-gray-500">{new Date(`1970-01-01T${p.startTime}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {weekDays.map(day => (
              <tr key={day} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                <th scope="row" className="px-4 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white sticky left-0 bg-white dark:bg-gray-800">{day}</th>
                {sortedPeriods.map(p => {
                  if (p.isBreak) {
                    return <td key={p.id} className="px-4 py-4 text-center bg-gray-50 dark:bg-gray-700/50 font-semibold align-middle">{p.name}</td>;
                  }
                  const slot = timetableGrid[day]?.[p.id];
                  return (
                    <td key={p.id} className="px-4 py-4 text-center align-middle">
                      {slot ? (
                        <div className="min-w-[150px]">
                          <div className="font-bold text-blue-600 dark:text-blue-400 flex items-center justify-center gap-2">
                             <BookOpen size={14} /> {getEntityName(slot.subjectId, 'subject')}
                          </div>
                          <div className="text-xs text-purple-600 dark:text-purple-400 flex items-center justify-center gap-1 mt-1">
                             <User size={12} /> 
                             {viewMode === 'class' ? getEntityName(slot.facultyId, 'faculty') : getEntityName(slot.classId, 'class')}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">Free</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

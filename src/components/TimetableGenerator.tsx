import React, { useState, useMemo, useEffect } from 'react';
import { Download, Filter, User, BookOpen } from 'lucide-react';
import { useData } from '../context/DataContext';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// We need to extend the jsPDF type to include the autoTable method
interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDF;
}

export default function TimetableView() {
  const { classes, subjects, faculty, periods, timetable } = useData();
  const [viewMode, setViewMode] = useState<'class' | 'faculty'>('class');
  const [selectedEntityId, setSelectedEntityId] = useState<string>('');

  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const sortedPeriods = useMemo(() => periods.sort((a, b) => a.order - b.order), [periods]);

  useEffect(() => {
    if (viewMode === 'class' && classes.length > 0) {
      setSelectedEntityId(classes[0].id);
    } else {
      setSelectedEntityId('');
    }
  }, [viewMode, classes]);

  const getEntityName = (id: string, type: 'class' | 'faculty' | 'subject', simple: boolean = false) => {
    switch (type) {
      case 'class': 
        const cls = classes.find(c => c.id === id);
        if (!cls) return 'N/A';
        return simple ? `${cls.name} (${cls.section})` : cls.name;
      case 'faculty': return faculty.find(f => f.id === id)?.name || 'N/A';
      case 'subject': 
        const sub = subjects.find(s => s.id === id);
        if (!sub) return 'N/A';
        return simple ? sub.name : `${sub.name} (${sub.code})`;
      default: return 'Unknown';
    }
  };

  const timetableGrid = useMemo(() => {
    const grid: { [day: string]: { [periodId: string]: any } } = {};
    const entityToFilter = selectedEntityId;
    if (!entityToFilter) return grid;

    const filteredTimetable = timetable.filter(slot => 
      viewMode === 'class' ? slot.classId === entityToFilter : slot.facultyId === entityToFilter
    );

    for (const day of weekDays) {
      grid[day] = {};
      for (const period of sortedPeriods) {
        const slot = filteredTimetable.find(s => s.day === day && s.periodId === period.id);
        grid[day][period.id] = slot || null;
      }
    }
    return grid;
  }, [timetable, selectedEntityId, viewMode, sortedPeriods, classes, faculty, subjects]);

  const exportToPDF = () => {
    // ... (exportToPDF function remains the same)
  };

  if (timetable.length === 0) {
    return <div className="text-center py-16 text-gray-500 dark:text-gray-400">No timetable has been generated yet. Please go to the "Generate" tab first.</div>;
  }
  
  const entityOptions = viewMode === 'class' ? classes : faculty;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Timetable View</h2>
        <button 
          onClick={exportToPDF}
          disabled={!selectedEntityId}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="h-4 w-4 mr-2" />
          Export PDF
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
        <div className="flex items-center space-x-3 mb-5">
          <Filter className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">View Mode</label>
            <div className="flex space-x-4">
              <label className="flex items-center cursor-pointer">
                <input type="radio" value="class" checked={viewMode === 'class'} onChange={() => setViewMode('class')} className="text-blue-600 focus:ring-blue-500" />
                <span className="ml-2 text-gray-700 dark:text-gray-200">By Class</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input type="radio" value="faculty" checked={viewMode === 'faculty'} onChange={() => setViewMode('faculty')} className="text-blue-600 focus:ring-blue-500" />
                <span className="ml-2 text-gray-700 dark:text-gray-200">By Faculty</span>
              </label>
            </div>
          </div>
          <div>
            <label htmlFor="entitySelect" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select {viewMode === 'class' ? 'Class' : 'Faculty'}</label>
            <select 
              id="entitySelect"
              value={selectedEntityId} 
              onChange={e => setSelectedEntityId(e.target.value)} 
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">-- Select --</option>
              {entityOptions.map(e => <option key={e.id} value={e.id}>{e.name} {e.section ? `(${e.section})` : ''}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
        <table className="min-w-full text-sm text-center">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
            <tr>
              <th scope="col" className="px-6 py-4 sticky left-0 bg-gray-50 dark:bg-gray-700 z-10 font-bold text-base">Day</th>
              {sortedPeriods.map(p => (
                <th key={p.id} scope="col" className="px-6 py-3 whitespace-nowrap">
                  <div className="font-semibold text-sm">{p.name}</div>
                  <div className="font-normal text-xs mt-1 text-gray-500">{new Date(`1970-01-01T${p.startTime}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {weekDays.map(day => (
              <tr key={day} className="bg-white dark:bg-gray-800">
                <td className="px-6 py-5 font-bold text-base text-gray-900 dark:text-white whitespace-nowrap sticky left-0 bg-white dark:bg-gray-800 z-10">{day}</td>
                {sortedPeriods.map(p => {
                  if (p.isBreak) {
                    return <td key={p.id} className="px-6 py-5 bg-gray-50 dark:bg-gray-700/50 font-semibold align-middle text-gray-500 dark:text-gray-400">{p.name}</td>;
                  }
                  const slot = timetableGrid[day]?.[p.id];
                  return (
                    <td key={p.id} className="px-6 py-5 align-middle min-w-[220px]">
                      {slot ? (
                        <div>
                          {/* --- MODIFIED SECTION --- */}
                          <p className="font-semibold text-xs text-blue-600 dark:text-blue-400 flex items-center justify-center gap-2">
                             <BookOpen size={14} className="flex-shrink-0"/> <span>{getEntityName(slot.subjectId, 'subject')}</span>
                          </p>
                          <p className="text-[10px] text-purple-500 dark:text-purple-400/80 flex items-center justify-center gap-1 mt-2">
                             <User size={12} className="flex-shrink-0"/> 
                             <span>{viewMode === 'class' ? getEntityName(slot.facultyId, 'faculty') : getEntityName(slot.classId, 'class', true)}</span>
                          </p>
                           {/* --- END OF MODIFICATION --- */}
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">-- Free --</span>
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

import React, 'useState', useMemo } from 'react';
import { Download, Filter, User, BookOpen } from 'lucide-react';
import { useData } from '../context/DataContext';

export default function TimetableView() {
  const { classes, subjects, faculty, periods, timetable } = useData();
  const [viewMode, setViewMode] = useState<'class' | 'faculty'>('class');
  const [selectedEntityId, setSelectedEntityId] = useState<string>('');

  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const sortedPeriods = useMemo(() => periods.sort((a, b) => a.order - b.order), [periods]);

  // Set default selection when the component loads or viewMode changes
  useState(() => {
    if (viewMode === 'class' && classes.length > 0) {
      setSelectedEntityId(classes[0].id);
    }
  });

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
    const entityToFilter = selectedEntityId || (viewMode === 'class' && classes.length > 0 ? classes[0].id : '');

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

  if (timetable.length === 0) {
    return <div className="text-center py-12 text-gray-500 dark:text-gray-400">No timetable has been generated yet. Please go to the "Generate" tab.</div>;
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">View Mode</label>
            <div className="flex space-x-4">
              <label className="flex items-center cursor-pointer"><input type="radio" value="class" checked={viewMode === 'class'} onChange={() => { setViewMode('class'); setSelectedEntityId(classes[0]?.id || ''); }} className="mr-2 text-blue-600 focus:ring-blue-500" /> By Class</label>
              <label className="flex items-center cursor-pointer"><input type="radio" value="faculty" checked={viewMode === 'faculty'} onChange={() => { setViewMode('faculty'); setSelectedEntityId(''); }} className="mr-2 text-blue-600 focus:ring-blue-500" /> By Faculty</label>
            </div>
          </div>
          <div>
            <label htmlFor="entitySelect" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select {viewMode === 'class' ? 'Class' : 'Faculty'}</label>
            <select 
              id="entitySelect"
              value={selectedEntityId} 
              onChange={e => setSelectedEntityId(e.target.value)} 
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">-- Select --</option>
              {entityOptions.map(e => <option key={e.id} value={e.id}>{e.name} {e.section ? `(${e.section})` : ''}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Timetable Grid */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="min-w-full text-sm text-left text-gray-500 dark:text-gray-400">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
            <tr>
              <th scope="col" className="px-6 py-4 sticky left-0 bg-gray-50 dark:bg-gray-700 z-10 font-semibold">Day</th>
              {sortedPeriods.map(p => (
                <th key={p.id} scope="col" className="px-6 py-4 text-center whitespace-nowrap">
                  <div>{p.name}</div>
                  <div className="font-normal text-xs mt-1">{new Date(`1970-01-01T${p.startTime}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {weekDays.map(day => (
              <tr key={day} className="bg-white border-t dark:bg-gray-800 dark:border-gray-700">
                <th scope="row" className="px-6 py-5 font-bold text-gray-900 whitespace-nowrap dark:text-white sticky left-0 bg-white dark:bg-gray-800 z-10">{day}</th>
                {sortedPeriods.map(p => {
                  if (p.isBreak) {
                    return <td key={p.id} className="px-6 py-5 text-center bg-gray-50 dark:bg-gray-700/50 font-semibold align-middle text-gray-500 dark:text-gray-400">{p.name}</td>;
                  }
                  const slot = timetableGrid[day]?.[p.id];
                  return (
                    <td key={p.id} className="px-6 py-5 text-center align-middle min-w-[200px]">
                      {slot ? (
                        <div>
                          <div className="font-semibold text-base text-blue-600 dark:text-blue-400 flex items-center justify-center gap-2">
                             <BookOpen size={15} className="flex-shrink-0"/> <span>{getEntityName(slot.subjectId, 'subject')}</span>
                          </div>
                          <div className="text-sm text-purple-600 dark:text-purple-400 flex items-center justify-center gap-2 mt-2">
                             <User size={14} className="flex-shrink-0"/> 
                             <span>{viewMode === 'class' ? getEntityName(slot.facultyId, 'faculty') : getEntityName(slot.classId, 'class')}</span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">--</span>
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

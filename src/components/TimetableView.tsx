import React, { useState } from 'react';
import { Download, Eye, Calendar, User, BookOpen, Clock, Filter, FileText } from 'lucide-react';
import { useData } from '../context/DataContext';

export default function TimetableView() {
  const { classes, subjects, faculty, periods, timetable } = useData();
  const [viewMode, setViewMode] = useState<'class' | 'faculty'>('class');
  const [selectedEntity, setSelectedEntity] = useState<string>('');
  const [selectedDay, setSelectedDay] = useState<string>('');

  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const getEntityName = (id: string, type: 'class' | 'faculty' | 'subject' | 'period') => {
    switch (type) {
      case 'class':
        const cls = classes.find(c => c.id === id);
        return cls ? `${cls.name} (${cls.section})` : 'Unknown Class';
      case 'faculty':
        const fac = faculty.find(f => f.id === id);
        return fac ? fac.name : 'Unknown Faculty';
      case 'subject':
        const sub = subjects.find(s => s.id === id);
        return sub ? `${sub.name} (${sub.code})` : 'Unknown Subject';
      case 'period':
        const per = periods.find(p => p.id === id);
        return per ? per.name : 'Unknown Period';
      default:
        return 'Unknown';
    }
  };

  const getPeriodTime = (periodId: string) => {
    const period = periods.find(p => p.id === periodId);
    if (!period) return '';
    
    const formatTime = (time: string) => {
      return new Date(`2000-01-01T${time}`).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
    };
    
    return `${formatTime(period.startTime)} - ${formatTime(period.endTime)}`;
  };

  const getFilteredTimetable = () => {
    let filtered = timetable;
    
    if (selectedEntity) {
      filtered = filtered.filter(slot => 
        viewMode === 'class' 
          ? slot.classId === selectedEntity
          : slot.facultyId === selectedEntity
      );
    }
    
    if (selectedDay) {
      filtered = filtered.filter(slot => slot.day === selectedDay);
    }
    
    return filtered;
  };

  const getEntityOptions = () => {
    return viewMode === 'class' ? classes : faculty;
  };

  const generateClassTimetable = (classId: string, day?: string) => {
    const classSlots = timetable.filter(slot => 
      slot.classId === classId && (!day || slot.day === day)
    );
    
    const timetableGrid: { [key: string]: { [key: string]: any } } = {};
    
    const daysToShow = day ? [day] : weekDays;
    
    daysToShow.forEach(d => {
      timetableGrid[d] = {};
      periods.sort((a, b) => a.order - b.order).forEach(period => {
        const slot = classSlots.find(s => s.day === d && s.periodId === period.id);
        timetableGrid[d][period.id] = slot || null;
      });
    });
    
    return timetableGrid;
  };

  const generateFacultyTimetable = (facultyId: string, day?: string) => {
    const facultySlots = timetable.filter(slot => 
      slot.facultyId === facultyId && (!day || slot.day === day)
    );
    
    const timetableGrid: { [key: string]: { [key: string]: any } } = {};
    
    const daysToShow = day ? [day] : weekDays;
    
    daysToShow.forEach(d => {
      timetableGrid[d] = {};
      periods.sort((a, b) => a.order - b.order).forEach(period => {
        const slot = facultySlots.find(s => s.day === d && s.periodId === period.id);
        timetableGrid[d][period.id] = slot || null;
      });
    });
    
    return timetableGrid;
  };

  const exportToPDF = () => {
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const entity = getEntityOptions().find(e => e.id === selectedEntity);
    const entityName = entity ? (viewMode === 'class' ? `${entity.name} (${entity.section})` : entity.name) : 'All';
    
    let html = `
      <html>
        <head>
          <title>Timetable - ${entityName}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .header h1 { color: #1f2937; margin: 0; }
            .header p { color: #6b7280; margin: 5px 0; }
            .timetable { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .timetable th, .timetable td { border: 1px solid #d1d5db; padding: 12px; text-align: center; }
            .timetable th { background-color: #f3f4f6; font-weight: bold; }
            .slot { background-color: #eff6ff; }
            .subject { font-weight: bold; color: #1d4ed8; }
            .faculty { color: #7c3aed; font-size: 0.9em; }
            .class { color: #059669; font-size: 0.9em; }
            .empty { color: #9ca3af; font-style: italic; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>College Timetable</h1>
            <p>${viewMode === 'class' ? 'Class' : 'Faculty'}: ${entityName}</p>
            ${selectedDay ? `<p>Day: ${selectedDay}</p>` : ''}
          </div>
    `;
    
    if (selectedEntity) {
      const timetableGrid = viewMode === 'class' 
        ? generateClassTimetable(selectedEntity, selectedDay)
        : generateFacultyTimetable(selectedEntity, selectedDay);
      
      const daysToShow = selectedDay ? [selectedDay] : weekDays;
      
      daysToShow.forEach(day => {
        html += `
          <h2>${day}</h2>
          <table class="timetable">
            <thead>
              <tr>
                <th>Period</th>
                <th>Time</th>
                <th>${viewMode === 'class' ? 'Subject' : 'Class'}</th>
                <th>${viewMode === 'class' ? 'Faculty' : 'Subject'}</th>
              </tr>
            </thead>
            <tbody>
        `;
        
        periods.sort((a, b) => a.order - b.order).forEach(period => {
          const slot = timetableGrid[day][period.id];
          html += `
            <tr>
              <td>${period.name}</td>
              <td>${getPeriodTime(period.id)}</td>
          `;
          
          if (slot) {
            if (viewMode === 'class') {
              html += `
                <td class="subject">${getEntityName(slot.subjectId, 'subject')}</td>
                <td class="faculty">${getEntityName(slot.facultyId, 'faculty')}</td>
              `;
            } else {
              html += `
                <td class="class">${getEntityName(slot.classId, 'class')}</td>
                <td class="subject">${getEntityName(slot.subjectId, 'subject')}</td>
              `;
            }
          } else {
            html += `
              <td class="empty" colspan="2">Free Period</td>
            `;
          }
          
          html += '</tr>';
        });
        
        html += '</tbody></table>';
      });
    }
    
    html += '</body></html>';
    
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  if (timetable.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Timetable View</h2>
          <p className="text-gray-600 dark:text-gray-400">
            View and export your generated timetables
          </p>
        </div>
        
        <div className="text-center py-16">
          <Calendar className="h-16 w-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No timetable generated yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Generate a timetable first to view and export schedules
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Timetable View</h2>
          <p className="text-gray-600 dark:text-gray-400">
            View and export your generated timetables
          </p>
        </div>
        
        <button
          onClick={exportToPDF}
          disabled={!selectedEntity}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
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
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              View Mode
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="class"
                  checked={viewMode === 'class'}
                  onChange={(e) => {
                    setViewMode(e.target.value as 'class');
                    setSelectedEntity('');
                  }}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">By Class</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="faculty"
                  checked={viewMode === 'faculty'}
                  onChange={(e) => {
                    setViewMode(e.target.value as 'faculty');
                    setSelectedEntity('');
                  }}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">By Faculty</span>
              </label>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {viewMode === 'class' ? 'Select Class' : 'Select Faculty'}
            </label>
            <select
              value={selectedEntity}
              onChange={(e) => setSelectedEntity(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">All {viewMode === 'class' ? 'Classes' : 'Faculty'}</option>
              {getEntityOptions().map(entity => (
                <option key={entity.id} value={entity.id}>
                  {viewMode === 'class' 
                    ? `${entity.name} (${entity.section})`
                    : entity.name
                  }
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Day
            </label>
            <select
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">All Days</option>
              {weekDays.map(day => (
                <option key={day} value={day}>{day}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Timetable Display */}
      {selectedEntity ? (
        <div className="space-y-6">
          {(selectedDay ? [selectedDay] : weekDays).map(day => {
            const timetableGrid = viewMode === 'class' 
              ? generateClassTimetable(selectedEntity, day)
              : generateFacultyTimetable(selectedEntity, day);
            
            return (
              <div key={day} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 border-b border-gray-200 dark:border-gray-600">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                    <Calendar className="h-5 w-5 mr-2" />
                    {day}
                  </h3>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Period
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Time
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          {viewMode === 'class' ? 'Subject' : 'Class'}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          {viewMode === 'class' ? 'Faculty' : 'Subject'}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {periods.sort((a, b) => a.order - b.order).map(period => {
                        const slot = timetableGrid[day][period.id];
                        
                        return (
                          <tr key={period.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <Clock className="h-4 w-4 text-gray-400 mr-2" />
                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                  {period.name}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                              {getPeriodTime(period.id)}
                            </td>
                            {slot ? (
                              <>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    {viewMode === 'class' ? (
                                      <>
                                        <BookOpen className="h-4 w-4 text-blue-500 mr-2" />
                                        <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                                          {getEntityName(slot.subjectId, 'subject')}
                                        </span>
                                      </>
                                    ) : (
                                      <>
                                        <User className="h-4 w-4 text-green-500 mr-2" />
                                        <span className="text-sm font-medium text-green-600 dark:text-green-400">
                                          {getEntityName(slot.classId, 'class')}
                                        </span>
                                      </>
                                    )}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    {viewMode === 'class' ? (
                                      <>
                                        <User className="h-4 w-4 text-purple-500 mr-2" />
                                        <span className="text-sm text-purple-600 dark:text-purple-400">
                                          {getEntityName(slot.facultyId, 'faculty')}
                                        </span>
                                      </>
                                    ) : (
                                      <>
                                        <BookOpen className="h-4 w-4 text-blue-500 mr-2" />
                                        <span className="text-sm text-blue-600 dark:text-blue-400">
                                          {getEntityName(slot.subjectId, 'subject')}
                                        </span>
                                      </>
                                    )}
                                  </div>
                                </td>
                              </>
                            ) : (
                              <td colSpan={2} className="px-6 py-4 whitespace-nowrap text-center">
                                <span className="text-sm text-gray-400 dark:text-gray-500 italic">
                                  Free Period
                                </span>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <Eye className="h-16 w-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Select a {viewMode} to view timetable
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Choose a {viewMode} from the filter above to display the schedule
          </p>
        </div>
      )}
    </div>
  );
}
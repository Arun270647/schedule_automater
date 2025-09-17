import React, { useState } from 'react';
import { Calendar, Users, BookOpen, Clock, Settings, FileText, Download, Moon, Sun } from 'lucide-react';
import Dashboard from './components/Dashboard';
import ClassManagement from './components/ClassManagement';
import SubjectManagement from './components/SubjectManagement';
import FacultyManagement from './components/FacultyManagement';
import PeriodManagement from './components/PeriodManagement';
import TimetableGenerator from './components/TimetableGenerator';
import TimetableView from './components/TimetableView';
import { DataProvider } from './context/DataContext';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [darkMode, setDarkMode] = useState(false);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    if (!darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const navigation = [
    { id: 'dashboard', name: 'Dashboard', icon: Calendar },
    { id: 'classes', name: 'Classes', icon: Users },
    { id: 'subjects', name: 'Subjects', icon: BookOpen },
    { id: 'faculty', name: 'Faculty', icon: Users },
    { id: 'periods', name: 'Periods', icon: Clock },
    { id: 'generator', name: 'Generate', icon: Settings },
    { id: 'timetable', name: 'View Timetable', icon: FileText },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'classes':
        return <ClassManagement />;
      case 'subjects':
        return <SubjectManagement />;
      case 'faculty':
        return <FacultyManagement />;
      case 'periods':
        return <PeriodManagement />;
      case 'generator':
        return <TimetableGenerator />;
      case 'timetable':
        return <TimetableView />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <DataProvider>
      <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200`}>
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-4">
                <Calendar className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  College Timetable Generator
                </h1>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={toggleDarkMode}
                  className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  title="Toggle dark mode"
                >
                  {darkMode ? (
                    <Sun className="h-5 w-5 text-yellow-500" />
                  ) : (
                    <Moon className="h-5 w-5 text-gray-600" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar Navigation */}
            <nav className="lg:w-64 flex-shrink-0">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                <ul className="space-y-2">
                  {navigation.map((item) => (
                    <li key={item.id}>
                      <button
                        onClick={() => setActiveTab(item.id)}
                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                          activeTab === item.id
                            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                        }`}
                      >
                        <item.icon className={`h-5 w-5 ${
                          activeTab === item.id 
                            ? 'text-blue-600 dark:text-blue-400' 
                            : 'text-gray-500 dark:text-gray-400'
                        }`} />
                        <span className="font-medium">{item.name}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </nav>

            {/* Main Content */}
            <main className="flex-1">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                {renderContent()}
              </div>
            </main>
          </div>
        </div>
      </div>
    </DataProvider>
  );
}

export default App;
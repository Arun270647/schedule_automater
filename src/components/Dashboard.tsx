import React from 'react';
import { Users, BookOpen, Clock, Calendar, BarChart3, TrendingUp } from 'lucide-react';
import { useData } from '../context/DataContext';

export default function Dashboard() {
  const { classes, subjects, faculty, periods, timetable } = useData();

  const stats = [
    {
      name: 'Total Classes',
      value: classes.length,
      icon: Users,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      textColor: 'text-blue-700 dark:text-blue-300',
    },
    {
      name: 'Total Subjects',
      value: subjects.length,
      icon: BookOpen,
      color: 'bg-green-500',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      textColor: 'text-green-700 dark:text-green-300',
    },
    {
      name: 'Total Faculty',
      value: faculty.length,
      icon: Users,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      textColor: 'text-purple-700 dark:text-purple-300',
    },
    {
      name: 'Total Periods',
      value: periods.length,
      icon: Clock,
      color: 'bg-orange-500',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
      textColor: 'text-orange-700 dark:text-orange-300',
    },
  ];

  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const scheduledSlots = timetable.length;
  const totalSlots = classes.length * periods.length * weekDays.length;
  const completionRate = totalSlots > 0 ? (scheduledSlots / totalSlots * 100).toFixed(1) : '0';

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Dashboard</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Overview of your college timetable management system
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className={`${stat.bgColor} rounded-xl p-6 border border-gray-200 dark:border-gray-700 transition-all duration-200 hover:scale-105`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  {stat.name}
                </p>
                <p className={`text-3xl font-bold ${stat.textColor}`}>
                  {stat.value}
                </p>
              </div>
              <div className={`${stat.color} rounded-lg p-3`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions and Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Timetable Status */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3 mb-4">
            <BarChart3 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Timetable Status
            </h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600 dark:text-gray-400">Schedule Completion</span>
                <span className="font-medium text-gray-900 dark:text-white">{completionRate}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div
                  className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${completionRate}%` }}
                ></div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {scheduledSlots}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Scheduled Slots
                </p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {totalSlots - scheduledSlots}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Available Slots
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3 mb-4">
            <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Quick Overview
            </h3>
          </div>
          
          <div className="space-y-4">
            {classes.length === 0 && subjects.length === 0 && faculty.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Get started by adding your classes, subjects, and faculty members.
                </p>
                <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                  <p>• Add classes (A, B, C, etc.)</p>
                  <p>• Add subjects with codes</p>
                  <p>• Add faculty and assign subjects</p>
                  <p>• Generate your timetable</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-gray-700 dark:text-gray-300">Classes configured</span>
                  <span className="font-semibold text-blue-600 dark:text-blue-400">
                    {classes.length}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-gray-700 dark:text-gray-300">Subjects available</span>
                  <span className="font-semibold text-green-600 dark:text-green-400">
                    {subjects.length}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-gray-700 dark:text-gray-300">Faculty members</span>
                  <span className="font-semibold text-purple-600 dark:text-purple-400">
                    {faculty.length}
                  </span>
                </div>
                {timetable.length > 0 && (
                  <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
                    <span className="text-green-700 dark:text-green-300">Timetable generated</span>
                    <span className="font-semibold text-green-600 dark:text-green-400">
                      ✓ Active
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Class {
  id: string;
  name: string;
  section: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  credits: number;
}

export interface Faculty {
  id: string;
  name: string;
  email: string;
  subjects: string[];
}

export interface Period {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  order: number;
}

export interface TimetableSlot {
  id: string;
  day: string;
  periodId: string;
  classId: string;
  subjectId: string;
  facultyId: string;
}

interface DataContextType {
  classes: Class[];
  subjects: Subject[];
  faculty: Faculty[];
  periods: Period[];
  timetable: TimetableSlot[];
  addClass: (classData: Omit<Class, 'id'>) => void;
  updateClass: (id: string, classData: Partial<Class>) => void;
  deleteClass: (id: string) => void;
  addSubject: (subjectData: Omit<Subject, 'id'>) => void;
  updateSubject: (id: string, subjectData: Partial<Subject>) => void;
  deleteSubject: (id: string) => void;
  addFaculty: (facultyData: Omit<Faculty, 'id'>) => void;
  updateFaculty: (id: string, facultyData: Partial<Faculty>) => void;
  deleteFaculty: (id: string) => void;
  addPeriod: (periodData: Omit<Period, 'id'>) => void;
  updatePeriod: (id: string, periodData: Partial<Period>) => void;
  deletePeriod: (id: string) => void;
  setTimetable: (timetable: TimetableSlot[]) => void;
  updateTimetableSlot: (id: string, slotData: Partial<TimetableSlot>) => void;
  deleteTimetableSlot: (id: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [periods, setPeriods] = useState<Period[]>([]);
  const [timetable, setTimetableState] = useState<TimetableSlot[]>([]);

  // Load data from localStorage on component mount
  useEffect(() => {
    const savedClasses = localStorage.getItem('timetable_classes');
    const savedSubjects = localStorage.getItem('timetable_subjects');
    const savedFaculty = localStorage.getItem('timetable_faculty');
    const savedPeriods = localStorage.getItem('timetable_periods');
    const savedTimetable = localStorage.getItem('timetable_schedule');

    if (savedClasses) setClasses(JSON.parse(savedClasses));
    if (savedSubjects) setSubjects(JSON.parse(savedSubjects));
    if (savedFaculty) setFaculty(JSON.parse(savedFaculty));
    if (savedPeriods) setPeriods(JSON.parse(savedPeriods));
    if (savedTimetable) setTimetableState(JSON.parse(savedTimetable));

    // Initialize default periods if none exist
    if (!savedPeriods) {
      const defaultPeriods: Period[] = [
        { id: '1', name: 'Period 1', startTime: '09:00', endTime: '10:00', order: 1 },
        { id: '2', name: 'Period 2', startTime: '10:00', endTime: '11:00', order: 2 },
        { id: '3', name: 'Period 3', startTime: '11:15', endTime: '12:15', order: 3 },
        { id: '4', name: 'Period 4', startTime: '12:15', endTime: '13:15', order: 4 },
        { id: '5', name: 'Period 5', startTime: '14:00', endTime: '15:00', order: 5 },
        { id: '6', name: 'Period 6', startTime: '15:00', endTime: '16:00', order: 6 },
      ];
      setPeriods(defaultPeriods);
      localStorage.setItem('timetable_periods', JSON.stringify(defaultPeriods));
    }
  }, []);

  // Save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem('timetable_classes', JSON.stringify(classes));
  }, [classes]);

  useEffect(() => {
    localStorage.setItem('timetable_subjects', JSON.stringify(subjects));
  }, [subjects]);

  useEffect(() => {
    localStorage.setItem('timetable_faculty', JSON.stringify(faculty));
  }, [faculty]);

  useEffect(() => {
    localStorage.setItem('timetable_periods', JSON.stringify(periods));
  }, [periods]);

  useEffect(() => {
    localStorage.setItem('timetable_schedule', JSON.stringify(timetable));
  }, [timetable]);

  // Class management
  const addClass = (classData: Omit<Class, 'id'>) => {
    const newClass: Class = { ...classData, id: Date.now().toString() };
    setClasses(prev => [...prev, newClass]);
  };

  const updateClass = (id: string, classData: Partial<Class>) => {
    setClasses(prev => prev.map(cls => cls.id === id ? { ...cls, ...classData } : cls));
  };

  const deleteClass = (id: string) => {
    setClasses(prev => prev.filter(cls => cls.id !== id));
    // Also remove from timetable
    setTimetableState(prev => prev.filter(slot => slot.classId !== id));
  };

  // Subject management
  const addSubject = (subjectData: Omit<Subject, 'id'>) => {
    const newSubject: Subject = { ...subjectData, id: Date.now().toString() };
    setSubjects(prev => [...prev, newSubject]);
  };

  const updateSubject = (id: string, subjectData: Partial<Subject>) => {
    setSubjects(prev => prev.map(subject => subject.id === id ? { ...subject, ...subjectData } : subject));
  };

  const deleteSubject = (id: string) => {
    setSubjects(prev => prev.filter(subject => subject.id !== id));
    // Also remove from faculty assignments and timetable
    setFaculty(prev => prev.map(f => ({ ...f, subjects: f.subjects.filter(s => s !== id) })));
    setTimetableState(prev => prev.filter(slot => slot.subjectId !== id));
  };

  // Faculty management
  const addFaculty = (facultyData: Omit<Faculty, 'id'>) => {
    const newFaculty: Faculty = { ...facultyData, id: Date.now().toString() };
    setFaculty(prev => [...prev, newFaculty]);
  };

  const updateFaculty = (id: string, facultyData: Partial<Faculty>) => {
    setFaculty(prev => prev.map(f => f.id === id ? { ...f, ...facultyData } : f));
  };

  const deleteFaculty = (id: string) => {
    setFaculty(prev => prev.filter(f => f.id !== id));
    // Also remove from timetable
    setTimetableState(prev => prev.filter(slot => slot.facultyId !== id));
  };

  // Period management
  const addPeriod = (periodData: Omit<Period, 'id'>) => {
    const newPeriod: Period = { ...periodData, id: Date.now().toString() };
    setPeriods(prev => [...prev, newPeriod].sort((a, b) => a.order - b.order));
  };

  const updatePeriod = (id: string, periodData: Partial<Period>) => {
    setPeriods(prev => prev.map(period => period.id === id ? { ...period, ...periodData } : period).sort((a, b) => a.order - b.order));
  };

  const deletePeriod = (id: string) => {
    setPeriods(prev => prev.filter(period => period.id !== id));
    // Also remove from timetable
    setTimetableState(prev => prev.filter(slot => slot.periodId !== id));
  };

  // Timetable management
  const setTimetable = (newTimetable: TimetableSlot[]) => {
    setTimetableState(newTimetable);
  };

  const updateTimetableSlot = (id: string, slotData: Partial<TimetableSlot>) => {
    setTimetableState(prev => prev.map(slot => slot.id === id ? { ...slot, ...slotData } : slot));
  };

  const deleteTimetableSlot = (id: string) => {
    setTimetableState(prev => prev.filter(slot => slot.id !== id));
  };

  const value: DataContextType = {
    classes,
    subjects,
    faculty,
    periods,
    timetable,
    addClass,
    updateClass,
    deleteClass,
    addSubject,
    updateSubject,
    deleteSubject,
    addFaculty,
    updateFaculty,
    deleteFaculty,
    addPeriod,
    updatePeriod,
    deletePeriod,
    setTimetable,
    updateTimetableSlot,
    deleteTimetableSlot,
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { RealtimeChannel } from '@supabase/supabase-js';

// ... (Interfaces remain the same) ...
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

  useEffect(() => {
    // --- 1. FETCH ALL INITIAL DATA ---
    const fetchData = async () => {
      const { data: classesData } = await supabase.from('classes').select('*');
      setClasses(classesData || []);

      const { data: subjectsData } = await supabase.from('subjects').select('*');
      setSubjects(subjectsData || []);

      const { data: facultyData } = await supabase.from('faculty').select('*');
      setFaculty(facultyData || []);
      
      const { data: periodsData } = await supabase.from('periods').select('*');
      setPeriods(periodsData?.map(p => ({ ...p, startTime: p.start_time, endTime: p.end_time })).sort((a, b) => a.order - b.order) || []);
    };
    fetchData();

    // --- 2. SET UP ALL REALTIME SUBSCRIPTIONS ---
    const channels: RealtimeChannel[] = [];

    const classChannel = supabase.channel('public:classes').on('postgres_changes', { event: '*', schema: 'public', table: 'classes' }, () => fetchData()).subscribe();
    const subjectChannel = supabase.channel('public:subjects').on('postgres_changes', { event: '*', schema: 'public', table: 'subjects' }, () => fetchData()).subscribe();
    const facultyChannel = supabase.channel('public:faculty').on('postgres_changes', { event: '*', schema: 'public', table: 'faculty' }, () => fetchData()).subscribe();
    const periodChannel = supabase.channel('public:periods').on('postgres_changes', { event: '*', schema: 'public', table: 'periods' }, () => fetchData()).subscribe();

    channels.push(classChannel, subjectChannel, facultyChannel, periodChannel);

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, []);

  // --- CRUD Functions (no changes needed here) ---
  const addClass = async (classData: Omit<Class, 'id'>) => {
    await supabase.from('classes').insert([classData]);
  };
  const updateClass = async (id: string, classData: Partial<Class>) => {
    await supabase.from('classes').update(classData).eq('id', id);
  };
  const deleteClass = async (id: string) => {
    await supabase.from('classes').delete().eq('id', id);
  };

  const addSubject = async (subjectData: Omit<Subject, 'id'>) => {
    await supabase.from('subjects').insert([subjectData]);
  };
  const updateSubject = async (id: string, subjectData: Partial<Subject>) => {
    await supabase.from('subjects').update(subjectData).eq('id', id);
  };
  const deleteSubject = async (id: string) => {
    await supabase.from('subjects').delete().eq('id', id);
  };
  
  const addFaculty = async (facultyData: Omit<Faculty, 'id'>) => {
    await supabase.from('faculty').insert([facultyData]);
  };
  const updateFaculty = async (id: string, facultyData: Partial<Faculty>) => {
    await supabase.from('faculty').update(facultyData).eq('id', id);
  };
  const deleteFaculty = async (id: string) => {
    await supabase.from('faculty').delete().eq('id', id);
  };
  
  const addPeriod = async (periodData: Omit<Period, 'id'>) => {
    await supabase.from('periods').insert([{ ...periodData, start_time: periodData.startTime, end_time: periodData.endTime }]);
  };
  const updatePeriod = async (id: string, periodData: Partial<Period>) => {
    await supabase.from('periods').update({ ...periodData, start_time: periodData.startTime, end_time: periodData.endTime }).eq('id', id);
  };
  const deletePeriod = async (id: string) => {
    await supabase.from('periods').delete().eq('id', id);
  };
  
  const setTimetable = (newTimetable: TimetableSlot[]) => setTimetableState(newTimetable);
  const updateTimetableSlot = (id: string, slotData: Partial<TimetableSlot>) => setTimetableState(prev => prev.map(slot => (slot.id === id ? { ...slot, ...slotData } : slot)));
  const deleteTimetableSlot = (id: string) => setTimetableState(prev => prev.filter(slot => slot.id !== id));

  const value = { classes, subjects, faculty, periods, timetable, addClass, updateClass, deleteClass, addSubject, updateSubject, deleteSubject, addFaculty, updateFaculty, deleteFaculty, addPeriod, updatePeriod, deletePeriod, setTimetable, updateTimetableSlot, deleteTimetableSlot };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { RealtimeChannel } from '@supabase/supabase-js';

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
  isBreak?: boolean; // Correctly defined here
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
    // --- Fetch all initial data ---
    const fetchData = async () => {
      const { data: classesData } = await supabase.from('classes').select('*');
      setClasses(classesData || []);

      const { data: subjectsData } = await supabase.from('subjects').select('*');
      setSubjects(subjectsData || []);

      const { data: facultyData } = await supabase.from('faculty').select('*');
      setFaculty(facultyData || []);
      
      const { data: periodsData } = await supabase.from('periods').select('*');
      // --- MODIFIED LINE ---
      setPeriods(periodsData?.map(p => ({ ...p, startTime: p.start_time, endTime: p.end_time, isBreak: p.is_break })).sort((a, b) => a.order - b.order) || []);
    };
    fetchData();

    // --- Set up all realtime subscriptions ---
    const channels: RealtimeChannel[] = [];
    const tables = ['classes', 'subjects', 'faculty', 'periods'];
    tables.forEach(table => {
        const channel = supabase.channel(`public:${table}`)
            .on('postgres_changes', { event: '*', schema: 'public', table }, () => fetchData())
            .subscribe();
        channels.push(channel);
    });

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, []);

  // --- CRUD Functions with immediate state updates ---
  const addClass = async (classData: Omit<Class, 'id'>) => {
    const { data } = await supabase.from('classes').insert([classData]).select();
    if (data) setClasses(prev => [...prev, ...data]);
  };
  const updateClass = async (id: string, classData: Partial<Class>) => {
    const { data } = await supabase.from('classes').update(classData).eq('id', id).select();
    if (data) setClasses(prev => prev.map(item => item.id === id ? data[0] : item));
  };
  const deleteClass = async (id: string) => {
    await supabase.from('classes').delete().eq('id', id);
    setClasses(prev => prev.filter(item => item.id !== id));
  };

  const addSubject = async (subjectData: Omit<Subject, 'id'>) => {
    const { data } = await supabase.from('subjects').insert([subjectData]).select();
    if (data) setSubjects(prev => [...prev, ...data]);
  };
  const updateSubject = async (id: string, subjectData: Partial<Subject>) => {
    const { data } = await supabase.from('subjects').update(subjectData).eq('id', id).select();
    if (data) setSubjects(prev => prev.map(item => item.id === id ? data[0] : item));
  };
  const deleteSubject = async (id: string) => {
    await supabase.from('subjects').delete().eq('id', id);
    setSubjects(prev => prev.filter(item => item.id !== id));
  };
  
  const addFaculty = async (facultyData: Omit<Faculty, 'id'>) => {
    const { data } = await supabase.from('faculty').insert([facultyData]).select();
    if (data) setFaculty(prev => [...prev, ...data]);
  };
  const updateFaculty = async (id: string, facultyData: Partial<Faculty>) => {
    const { data } = await supabase.from('faculty').update(facultyData).eq('id', id).select();
    if (data) setFaculty(prev => prev.map(item => item.id === id ? data[0] : item));
  };
  const deleteFaculty = async (id: string) => {
    await supabase.from('faculty').delete().eq('id', id);
    setFaculty(prev => prev.filter(item => item.id !== id));
  };
  
  const addPeriod = async (periodData: Omit<Period, 'id'>) => {
    // --- MODIFIED LINE ---
    const { data } = await supabase.from('periods').insert([{ name: periodData.name, "order": periodData.order, start_time: periodData.startTime, end_time: periodData.endTime, is_break: periodData.isBreak }]).select();
    if (data) setPeriods(prev => [...prev, ...data.map(p => ({...p, startTime: p.start_time, endTime: p.end_time, isBreak: p.is_break}))].sort((a,b) => a.order - b.order));
  };
  const updatePeriod = async (id: string, periodData: Partial<Period>) => {
    // --- MODIFIED LINE ---
    const { data } = await supabase.from('periods').update({ name: periodData.name, "order": periodData.order, start_time: periodData.startTime, end_time: periodData.endTime, is_break: periodData.isBreak }).eq('id', id).select();
    if (data) setPeriods(prev => prev.map(item => item.id === id ? {...data[0], startTime: data[0].start_time, endTime: data[0].end_time, isBreak: data[0].is_break} : item).sort((a,b) => a.order - b.order));
  };
  const deletePeriod = async (id: string) => {
    await supabase.from('periods').delete().eq('id', id);
    setPeriods(prev => prev.filter(item => item.id !== id));
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

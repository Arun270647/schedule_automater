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
    // Fetch initial data from Supabase
    const fetchData = async () => {
        const { data: classesData } = await supabase.from('classes').select('*');
        if (classesData) setClasses(classesData);
  
        const { data: subjectsData } = await supabase.from('subjects').select('*');
        if (subjectsData) setSubjects(subjectsData);
  
        const { data: facultyData } = await supabase.from('faculty').select('*');
        if (facultyData) setFaculty(facultyData);
  
        const { data: periodsData } = await supabase.from('periods').select('*');
        if (periodsData && periodsData.length > 0) {
          setPeriods(periodsData.map(p => ({ ...p, startTime: p.start_time, endTime: p.end_time })).sort((a, b) => a.order - b.order));
        } else {
          // Initialize default periods if none exist
          const defaultPeriods: Omit<Period, 'id'>[] = [
              { name: 'Period 1', startTime: '09:00', endTime: '10:00', order: 1 },
              { name: 'Period 2', startTime: '10:00', endTime: '11:00', order: 2 },
              { name: 'Period 3', startTime: '11:15', endTime: '12:15', order: 3 },
              { name: 'Period 4', startTime: '12:15', endTime: '13:15', order: 4 },
              { name: 'Period 5', startTime: '14:00', endTime: '15:00', order: 5 },
              { name: 'Period 6', startTime: '15:00', endTime: '16:00', order: 6 },
          ];
          const { data: newPeriods } = await supabase.from('periods').insert(defaultPeriods.map(p => ({...p, start_time: p.startTime, end_time: p.endTime}))).select();
          if (newPeriods) setPeriods(newPeriods.map(p => ({ ...p, startTime: p.start_time, endTime: p.end_time })).sort((a, b) => a.order - b.order));
        }
      };
    fetchData();

    // Set up Supabase Realtime subscriptions
    const channels: RealtimeChannel[] = [];

    const classChannel = supabase.channel('public:classes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'classes' }, (payload) => {
        if (payload.eventType === 'INSERT') {
            setClasses(prev => [...prev, payload.new as Class]);
        } else if (payload.eventType === 'UPDATE') {
            setClasses(prev => prev.map(cls => cls.id === payload.new.id ? payload.new as Class : cls));
        } else if (payload.eventType === 'DELETE') {
            setClasses(prev => prev.filter(cls => cls.id !== (payload.old as Class).id));
        }
      }).subscribe();
    channels.push(classChannel);

    const subjectChannel = supabase.channel('public:subjects')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'subjects' }, (payload) => {
        if (payload.eventType === 'INSERT') {
            setSubjects(prev => [...prev, payload.new as Subject]);
        } else if (payload.eventType === 'UPDATE') {
            setSubjects(prev => prev.map(sub => sub.id === payload.new.id ? payload.new as Subject : sub));
        } else if (payload.eventType === 'DELETE') {
            setSubjects(prev => prev.filter(sub => sub.id !== (payload.old as Subject).id));
        }
    }).subscribe();
    channels.push(subjectChannel);

    const facultyChannel = supabase.channel('public:faculty')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'faculty' }, (payload) => {
        if (payload.eventType === 'INSERT') {
            setFaculty(prev => [...prev, payload.new as Faculty]);
        } else if (payload.eventType === 'UPDATE') {
            setFaculty(prev => prev.map(fac => fac.id === payload.new.id ? payload.new as Faculty : fac));
        } else if (payload.eventType === 'DELETE') {
            setFaculty(prev => prev.filter(fac => fac.id !== (payload.old as Faculty).id));
        }
    }).subscribe();
    channels.push(facultyChannel);

    const periodChannel = supabase.channel('public:periods')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'periods' }, (payload) => {
        const formatPeriod = (p: any) => ({ ...p, startTime: p.start_time, endTime: p.end_time });
        if (payload.eventType === 'INSERT') {
            setPeriods(prev => [...prev, formatPeriod(payload.new)].sort((a,b) => a.order - b.order));
        } else if (payload.eventType === 'UPDATE') {
            setPeriods(prev => prev.map(p => p.id === payload.new.id ? formatPeriod(payload.new) : p).sort((a,b) => a.order - b.order));
        } else if (payload.eventType === 'DELETE') {
            setPeriods(prev => prev.filter(p => p.id !== (payload.old as Period).id));
        }
    }).subscribe();
    channels.push(periodChannel);

    // Cleanup subscriptions on component unmount
    return () => {
        channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, []);

  // Class management
  const addClass = async (classData: Omit<Class, 'id'>) => {
    await supabase.from('classes').insert([classData]);
  };

  const updateClass = async (id: string, classData: Partial<Class>) => {
    await supabase.from('classes').update(classData).eq('id', id);
  };

  const deleteClass = async (id: string) => {
    await supabase.from('classes').delete().eq('id', id);
  };

  // Subject management
  const addSubject = async (subjectData: Omit<Subject, 'id'>) => {
    await supabase.from('subjects').insert([subjectData]);
  };

  const updateSubject = async (id: string, subjectData: Partial<Subject>) => {
    await supabase.from('subjects').update(subjectData).eq('id', id);
  };

  const deleteSubject = async (id: string) => {
    await supabase.from('subjects').delete().eq('id', id);
  };

  // Faculty management
  const addFaculty = async (facultyData: Omit<Faculty, 'id'>) => {
    await supabase.from('faculty').insert([facultyData]);
  };

  const updateFaculty = async (id: string, facultyData: Partial<Faculty>) => {
    await supabase.from('faculty').update(facultyData).eq('id', id);
  };

  const deleteFaculty = async (id: string) => {
    await supabase.from('faculty').delete().eq('id', id);
  };

  // Period management
  const addPeriod = async (periodData: Omit<Period, 'id'>) => {
    await supabase.from('periods').insert([{ ...periodData, start_time: periodData.startTime, end_time: periodData.endTime }]);
  };

  const updatePeriod = async (id: string, periodData: Partial<Period>) => {
    await supabase.from('periods').update({ ...periodData, start_time: periodData.startTime, end_time: periodData.endTime }).eq('id', id);
  };

  const deletePeriod = async (id: string) => {
    await supabase.from('periods').delete().eq('id', id);
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

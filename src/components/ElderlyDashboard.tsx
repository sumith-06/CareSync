import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile, Task, linkElderlyToCaregiver, updateTaskStatus } from '../lib/db';
import { CheckCircle2, Volume2, Clock, Pill, Calendar, Activity, Link } from 'lucide-react';
import { format, isToday } from 'date-fns';

export function ElderlyDashboard({ profile }: { profile: UserProfile }) {
  const [caregiverCode, setCaregiverCode] = useState('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLinking, setIsLinking] = useState(false);

  useEffect(() => {
    if (!profile.caregiverId) return;

    const qTasks = query(
      collection(db, 'tasks'), 
      where('elderlyId', '==', profile.uid),
      where('status', '==', 'pending')
    );
    
    const unsubTasks = onSnapshot(qTasks, (snapshot) => {
      const fetchedTasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
      fetchedTasks.sort((a, b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime());
      setTasks(fetchedTasks);
    });

    return () => unsubTasks();
  }, [profile.uid, profile.caregiverId]);

  const handleLinkCaregiver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caregiverCode.trim()) return;
    
    setIsLinking(true);
    try {
      await linkElderlyToCaregiver(profile.uid, caregiverCode.trim());
      setIsLinking(false);
    } catch (error) {
      console.error("Error linking caregiver:", error);
      alert("Failed to link caregiver code. Please check the code and try again.");
      setIsLinking(false);
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      await updateTaskStatus(taskId, 'completed');
      
      // Play a success sound or vibration
      if ('vibrate' in navigator) {
        navigator.vibrate([100, 50, 100]);
      }
    } catch (error) {
      console.error("Error completing task:", error);
    }
  };

  const speakInstruction = (task: Task) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance();
      let text = `Time for ${task.title}. `;
      if (task.dosage) text += `Take ${task.dosage}. `;
      if (task.instructions) text += `${task.instructions}.`;
      
      utterance.text = text;
      utterance.rate = 0.85; // Slightly slower for elderly
      utterance.pitch = 1;
      window.speechSynthesis.speak(utterance);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'medicine': return <Pill className="w-8 h-8 text-indigo-600" />;
      case 'appointment': return <Calendar className="w-8 h-8 text-blue-600" />;
      case 'activity': return <Activity className="w-8 h-8 text-orange-600" />;
      default: return null;
    }
  };

  if (!profile.caregiverId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
        <div className="bg-white p-8 rounded-3xl shadow-lg max-w-md w-full text-center space-y-6 border border-slate-100">
          <div className="bg-indigo-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
            <Link className="w-10 h-10 text-indigo-600" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900">Link Caregiver</h2>
          <p className="text-lg text-slate-600">Please enter the code provided by your caregiver to get started.</p>
          
          <form onSubmit={handleLinkCaregiver} className="space-y-4">
            <input
              type="text"
              value={caregiverCode}
              onChange={(e) => setCaregiverCode(e.target.value)}
              placeholder="Enter Caregiver Code"
              className="w-full text-center text-2xl tracking-widest font-mono border-2 border-slate-300 rounded-2xl px-4 py-4 focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
              required
            />
            <button
              type="submit"
              disabled={isLinking}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xl font-bold py-4 px-6 rounded-2xl transition-colors disabled:opacity-70"
            >
              {isLinking ? 'Linking...' : 'Connect'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="text-center space-y-2 mb-8">
        <h2 className="text-3xl font-bold text-slate-900">Hello, {profile.name.split(' ')[0]}</h2>
        <p className="text-xl text-slate-600">Here are your tasks for today.</p>
      </div>

      {tasks.length === 0 ? (
        <div className="bg-emerald-50 border-2 border-emerald-200 rounded-3xl p-10 text-center space-y-4">
          <div className="bg-emerald-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-12 h-12 text-emerald-600" />
          </div>
          <h3 className="text-2xl font-bold text-emerald-800">All Done!</h3>
          <p className="text-lg text-emerald-700">You have no pending tasks right now. Great job!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {tasks.map(task => {
            const taskTime = new Date(task.scheduledTime);
            const isPastDue = taskTime < new Date();
            
            return (
              <div 
                key={task.id} 
                className={`bg-white rounded-3xl p-6 shadow-md border-l-8 ${isPastDue ? 'border-l-red-500 border-red-100' : 'border-l-indigo-500 border-slate-100'} border-y border-r relative overflow-hidden`}
              >
                <div className="flex flex-col sm:flex-row gap-6 items-center">
                  
                  {/* Icon & Time */}
                  <div className="flex flex-col items-center justify-center bg-slate-50 p-4 rounded-2xl min-w-[120px]">
                    {getTypeIcon(task.type)}
                    <div className="mt-3 font-bold text-xl text-slate-800">
                      {format(taskTime, 'h:mm a')}
                    </div>
                    {isPastDue && (
                      <span className="text-red-600 font-bold text-sm mt-1 uppercase tracking-wider">Overdue</span>
                    )}
                  </div>

                  {/* Task Details */}
                  <div className="flex-1 text-center sm:text-left space-y-2">
                    <h3 className="text-3xl font-bold text-slate-900">{task.title}</h3>
                    {task.dosage && (
                      <p className="text-xl text-slate-700 font-medium">Take: {task.dosage}</p>
                    )}
                    {task.instructions && (
                      <p className="text-lg text-slate-600 italic">"{task.instructions}"</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-3 w-full sm:w-auto">
                    <button
                      onClick={() => speakInstruction(task)}
                      className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-6 rounded-2xl transition-colors text-lg"
                    >
                      <Volume2 className="w-6 h-6" />
                      Read Aloud
                    </button>
                    <button
                      onClick={() => handleCompleteTask(task.id!)}
                      className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-4 px-8 rounded-2xl transition-colors text-2xl shadow-lg shadow-emerald-500/30"
                    >
                      <CheckCircle2 className="w-8 h-8" />
                      DONE
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

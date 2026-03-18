import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile, Task, createTask, deleteTask } from '../lib/db';
import { Plus, Trash2, Clock, CheckCircle2, XCircle, Activity, Calendar, Pill, Copy, Check, User as UserIcon } from 'lucide-react';
import { format } from 'date-fns';

export function CaregiverDashboard({ profile }: { profile: UserProfile }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [elderlyUsers, setElderlyUsers] = useState<UserProfile[]>([]);
  const [isCopied, setIsCopied] = useState(false);
  
  // New Task Form State
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskType, setNewTaskType] = useState<'medicine' | 'appointment' | 'activity'>('medicine');
  const [newTaskTime, setNewTaskTime] = useState('');
  const [newTaskDosage, setNewTaskDosage] = useState('');
  const [newTaskInstructions, setNewTaskInstructions] = useState('');
  const [selectedElderlyId, setSelectedElderlyId] = useState('');

  useEffect(() => {
    // Listen for elderly users linked to this caregiver
    const qUsers = query(collection(db, 'users'), where('role', '==', 'elderly'), where('caregiverId', '==', profile.uid));
    const unsubUsers = onSnapshot(qUsers, (snapshot) => {
      const users = snapshot.docs.map(doc => doc.data() as UserProfile);
      setElderlyUsers(users);
      if (users.length > 0 && !selectedElderlyId) {
        setSelectedElderlyId(users[0].uid);
      }
    });

    // Listen for tasks created by this caregiver
    const qTasks = query(collection(db, 'tasks'), where('caregiverId', '==', profile.uid));
    const unsubTasks = onSnapshot(qTasks, (snapshot) => {
      const fetchedTasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
      // Sort in memory since we don't have a composite index set up yet
      fetchedTasks.sort((a, b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime());
      setTasks(fetchedTasks);
    });

    return () => {
      unsubUsers();
      unsubTasks();
    };
  }, [profile.uid, selectedElderlyId]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(profile.uid);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedElderlyId || !newTaskTitle || !newTaskTime) return;

    const task: Omit<Task, 'id'> = {
      caregiverId: profile.uid,
      elderlyId: selectedElderlyId,
      title: newTaskTitle,
      type: newTaskType,
      scheduledTime: new Date(newTaskTime).toISOString(),
      status: 'pending',
      dosage: newTaskType === 'medicine' ? newTaskDosage : undefined,
      instructions: newTaskInstructions,
    };

    try {
      await createTask(task);
      setNewTaskTitle('');
      setNewTaskTime('');
      setNewTaskDosage('');
      setNewTaskInstructions('');
    } catch (error) {
      console.error("Error creating task:", error);
      alert("Failed to create task");
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (confirm('Are you sure you want to delete this task?')) {
      await deleteTask(taskId);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case 'missed': return <XCircle className="w-5 h-5 text-red-500" />;
      default: return <Clock className="w-5 h-5 text-amber-500" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'medicine': return <Pill className="w-5 h-5 text-indigo-500" />;
      case 'appointment': return <Calendar className="w-5 h-5 text-blue-500" />;
      case 'activity': return <Activity className="w-5 h-5 text-orange-500" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Caregiver Code Section */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Your Caregiver Code</h2>
          <p className="text-sm text-slate-500">Share this code with your elderly family member so they can link to your account.</p>
        </div>
        <div className="flex items-center space-x-2 bg-slate-100 px-4 py-2 rounded-lg">
          <code className="text-indigo-600 font-mono font-bold text-lg">{profile.uid.substring(0, 8).toUpperCase()}</code>
          <button onClick={handleCopyCode} className="p-2 text-slate-500 hover:text-indigo-600 transition-colors">
            {isCopied ? <Check className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {elderlyUsers.length === 0 ? (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
          <p className="text-amber-800 font-medium">No elderly users linked yet.</p>
          <p className="text-amber-600 text-sm mt-1">Ask them to enter your caregiver code in their app.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Add Task Form */}
          <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-fit">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Add New Task</h3>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Assign To</label>
                <select 
                  value={selectedElderlyId} 
                  onChange={(e) => setSelectedElderlyId(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                >
                  {elderlyUsers.map(user => (
                    <option key={user.uid} value={user.uid}>{user.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Task Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['medicine', 'appointment', 'activity'] as const).map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setNewTaskType(type)}
                      className={`py-2 px-1 text-xs font-medium rounded-lg capitalize border flex flex-col items-center justify-center gap-1 transition-colors ${
                        newTaskType === type 
                          ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {getTypeIcon(type)}
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder={newTaskType === 'medicine' ? 'e.g., Blood Pressure Pill' : 'e.g., Doctor Visit'}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Scheduled Time</label>
                <input
                  type="datetime-local"
                  value={newTaskTime}
                  onChange={(e) => setNewTaskTime(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>

              {newTaskType === 'medicine' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Dosage (Optional)</label>
                  <input
                    type="text"
                    value={newTaskDosage}
                    onChange={(e) => setNewTaskDosage(e.target.value)}
                    placeholder="e.g., 1 tablet, 50mg"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Instructions (Optional)</label>
                <textarea
                  value={newTaskInstructions}
                  onChange={(e) => setNewTaskInstructions(e.target.value)}
                  placeholder="e.g., Take after meals"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none h-20"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add Task
              </button>
            </form>
          </div>

          {/* Task List */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-lg font-semibold text-slate-900">Task Dashboard</h3>
            
            {tasks.length === 0 ? (
              <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-500">
                No tasks scheduled yet. Create one to get started.
              </div>
            ) : (
              <div className="space-y-3">
                {tasks.map(task => {
                  const assignedUser = elderlyUsers.find(u => u.uid === task.elderlyId);
                  const isPastDue = new Date(task.scheduledTime) < new Date() && task.status === 'pending';
                  
                  return (
                    <div key={task.id} className={`bg-white p-4 rounded-xl border shadow-sm flex items-center justify-between ${isPastDue ? 'border-red-200 bg-red-50/30' : 'border-slate-200'}`}>
                      <div className="flex items-start gap-4">
                        <div className="mt-1 p-2 bg-slate-50 rounded-lg border border-slate-100">
                          {getTypeIcon(task.type)}
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                            {task.title}
                            {isPastDue && <span className="text-[10px] uppercase tracking-wider bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">Overdue</span>}
                          </h4>
                          <div className="text-sm text-slate-500 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mt-1">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {format(new Date(task.scheduledTime), 'MMM d, h:mm a')}
                            </span>
                            {assignedUser && (
                              <span className="flex items-center gap-1">
                                <UserIcon className="w-3.5 h-3.5" />
                                {assignedUser.name}
                              </span>
                            )}
                          </div>
                          {task.dosage && <p className="text-sm text-slate-600 mt-1"><span className="font-medium">Dosage:</span> {task.dosage}</p>}
                          {task.instructions && <p className="text-sm text-slate-600 mt-1 italic">"{task.instructions}"</p>}
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-3">
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium capitalize bg-slate-50 border border-slate-200">
                          {getStatusIcon(task.status)}
                          <span className={
                            task.status === 'completed' ? 'text-emerald-700' : 
                            task.status === 'missed' ? 'text-red-700' : 'text-amber-700'
                          }>
                            {task.status}
                          </span>
                        </div>
                        <button
                          onClick={() => handleDeleteTask(task.id!)}
                          className="text-slate-400 hover:text-red-500 transition-colors p-1"
                          title="Delete Task"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

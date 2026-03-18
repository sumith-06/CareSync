import { collection, doc, setDoc, getDoc, updateDoc, deleteDoc, query, where, onSnapshot, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../firebase';

export type UserRole = 'caregiver' | 'elderly';

export interface UserProfile {
  uid: string;
  role: UserRole;
  name: string;
  email: string;
  caregiverId?: string;
}

export type TaskType = 'medicine' | 'appointment' | 'activity';
export type TaskStatus = 'pending' | 'completed' | 'missed';

export interface Task {
  id?: string;
  caregiverId: string;
  elderlyId: string;
  title: string;
  type: TaskType;
  scheduledTime: string; // ISO string
  status: TaskStatus;
  completedAt?: string; // ISO string
  dosage?: string;
  instructions?: string;
}

export const createUserProfile = async (profile: UserProfile) => {
  await setDoc(doc(db, 'users', profile.uid), profile);
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const docSnap = await getDoc(doc(db, 'users', uid));
  if (docSnap.exists()) {
    return docSnap.data() as UserProfile;
  }
  return null;
};

export const getElderlyUsersForCaregiver = async (caregiverId: string): Promise<UserProfile[]> => {
  const q = query(collection(db, 'users'), where('role', '==', 'elderly'), where('caregiverId', '==', caregiverId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => doc.data() as UserProfile);
};

export const linkElderlyToCaregiver = async (elderlyUid: string, caregiverId: string) => {
  await updateDoc(doc(db, 'users', elderlyUid), { caregiverId });
};

export const createTask = async (task: Omit<Task, 'id'>) => {
  await addDoc(collection(db, 'tasks'), task);
};

export const updateTaskStatus = async (taskId: string, status: TaskStatus) => {
  const updateData: Partial<Task> = { status };
  if (status === 'completed') {
    updateData.completedAt = new Date().toISOString();
  }
  await updateDoc(doc(db, 'tasks', taskId), updateData);
};

export const deleteTask = async (taskId: string) => {
  await deleteDoc(doc(db, 'tasks', taskId));
};

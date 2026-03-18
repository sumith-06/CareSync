import { useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, User } from 'firebase/auth';
import { auth } from './firebase';
import { getUserProfile, createUserProfile, UserProfile } from './lib/db';
import { CaregiverDashboard } from './components/CaregiverDashboard';
import { ElderlyDashboard } from './components/ElderlyDashboard';
import { HeartPulse, LogOut, User as UserIcon } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeProfile: () => void;
    
    // Test Firestore connection
    import('firebase/firestore').then(({ getDocFromServer, doc }) => {
      import('./firebase').then(({ db }) => {
        getDocFromServer(doc(db, 'test', 'connection')).catch((error) => {
          if(error instanceof Error && error.message.includes('the client is offline')) {
            console.error("Please check your Firebase configuration.");
          }
        });
      });
    });
    
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        import('firebase/firestore').then(({ doc, onSnapshot }) => {
          import('./firebase').then(({ db }) => {
            unsubscribeProfile = onSnapshot(doc(db, 'users', currentUser.uid), (docSnap) => {
              if (docSnap.exists()) {
                setProfile(docSnap.data() as UserProfile);
              } else {
                setProfile(null);
              }
              setLoading(false);
            });
          });
        });
      } else {
        setProfile(null);
        setLoading(false);
        if (unsubscribeProfile) unsubscribeProfile();
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Error signing in", error);
    }
  };

  const handleLogout = () => {
    signOut(auth);
  };

  const handleRoleSelection = async (role: 'caregiver' | 'elderly') => {
    if (!user) return;
    const newProfile: UserProfile = {
      uid: user.uid,
      role,
      name: user.displayName || 'Anonymous',
      email: user.email || '',
    };
    await createUserProfile(newProfile);
    setProfile(newProfile);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center space-y-8">
          <div className="flex justify-center">
            <div className="bg-indigo-100 p-4 rounded-full">
              <HeartPulse className="w-12 h-12 text-indigo-600" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">CareSync</h1>
            <p className="text-slate-500 mt-2">Remote Caregiver Assistant for Elderly Medication & Health Management</p>
          </div>
          <button
            onClick={handleLogin}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors"
          >
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center space-y-8">
          <h2 className="text-2xl font-bold text-slate-900">Select Your Role</h2>
          <p className="text-slate-500">How will you be using CareSync?</p>
          <div className="grid grid-cols-1 gap-4">
            <button
              onClick={() => handleRoleSelection('caregiver')}
              className="flex items-center justify-center space-x-3 bg-white border-2 border-indigo-100 hover:border-indigo-600 hover:bg-indigo-50 text-slate-700 font-semibold py-4 px-4 rounded-xl transition-all"
            >
              <UserIcon className="w-6 h-6 text-indigo-600" />
              <span>I am a Caregiver</span>
            </button>
            <button
              onClick={() => handleRoleSelection('elderly')}
              className="flex items-center justify-center space-x-3 bg-white border-2 border-emerald-100 hover:border-emerald-600 hover:bg-emerald-50 text-slate-700 font-semibold py-4 px-4 rounded-xl transition-all"
            >
              <HeartPulse className="w-6 h-6 text-emerald-600" />
              <span>I am an Elderly User</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <HeartPulse className="w-6 h-6 text-indigo-600" />
            <span className="font-bold text-xl text-slate-900">CareSync</span>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-slate-600 hidden sm:block">
              <span className="font-medium">{profile.name}</span> ({profile.role})
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>
      
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6">
        {profile.role === 'caregiver' ? (
          <CaregiverDashboard profile={profile} />
        ) : (
          <ElderlyDashboard profile={profile} />
        )}
      </main>
    </div>
  );
}

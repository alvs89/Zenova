import React from 'react';
import { auth } from '@/config/firebase';
import { GoogleAuthProvider, signInWithPopup, signInWithRedirect } from 'firebase/auth';
import { BookOpen } from 'lucide-react';

export function Login() {
  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (e) {
      console.error('Login failed', e);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col justify-center items-center p-4">
      <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-xl max-w-sm w-full text-center">
        <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-indigo-600 dark:text-indigo-400">
          <BookOpen size={32} />
        </div>
        <h1 className="text-2xl font-bold mb-2">Welcome to Zenova</h1>
        <p className="text-slate-500 mb-8">Sign in to sync your study data, AI chats, and tasks anywhere.</p>
        <button 
          onClick={handleLogin}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 rounded-xl transition-colors"
        >
          Sign in with Google
        </button>
      </div>
    </div>
  );
}

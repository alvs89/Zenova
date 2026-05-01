import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Brain, Clock, ChevronRight, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export function Home() {
  const navigate = useNavigate();
  const { user, login } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login();
      navigate('/dashboard');
    } catch (e: any) {
      console.error(e);
      alert("Login failed: " + e.message + "\n\nIf you deployed this to Netlify, make sure you add your Netlify domain to your Firebase Authentication Authorized Domains in the Firebase Console.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950 flex flex-col items-center justify-center p-6 text-center relative transition-colors">
      {/* Header with login */}
      <header className="absolute top-0 w-full p-6 flex justify-end gap-4">
      </header>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl pt-16"
      >
        <div className="mx-auto bg-gradient-to-br from-indigo-500 to-purple-600 text-white p-4 rounded-3xl shadow-xl w-20 h-20 flex items-center justify-center mb-8">
          <BookOpen size={40} />
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-slate-900 dark:text-white mb-6 transition-colors">
          Study <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">Smarter</span>,<br/>Not Harder.
        </h1>
        
        <p className="text-lg text-slate-600 dark:text-slate-400 mb-10 max-w-xl mx-auto leading-relaxed transition-colors">
          The all-in-one AI-powered productivity hub designed for students. Beat procrastination, manage deadlines, and learn better.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button 
            onClick={handleLogin}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 w-full sm:w-auto justify-center text-lg"
          >
            Start Now <ChevronRight size={20} />
          </button>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 max-w-5xl w-full"
      >
        {[
          { icon: Brain, title: 'AI Assistant', desc: 'Get confused topics explained simply and generate quizzes instantly.' },
          { icon: Clock, title: 'Smart Focus', desc: 'Built-in Pomodoro timer with motivational progress tracking.' },
          { icon: BookOpen, title: 'Task Planner', desc: 'Organize assignments and let AI suggest optimized study schedules.' },
        ].map((feature, i) => (
          <div key={i} className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm text-left transition-colors">
            <div className="bg-indigo-100 dark:bg-indigo-900/40 w-12 h-12 rounded-2xl flex items-center justify-center mb-4 text-indigo-600 dark:text-indigo-400">
              <feature.icon size={24} />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">{feature.title}</h3>
            <p className="text-slate-600 dark:text-slate-400">{feature.desc}</p>
          </div>
        ))}
      </motion.div>

    </div>
  );
}

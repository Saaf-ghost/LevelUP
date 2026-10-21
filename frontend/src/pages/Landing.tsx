import React from 'react';
import { Link } from 'react-router-dom';
import { Columns3, ListChecks, Users, Zap } from 'lucide-react';

const Landing: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      <header className="px-8 py-6 flex justify-between items-center border-b border-slate-800">
        <div className="flex items-center gap-2 text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500">
          <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
            <span className="text-indigo-400">B</span>
          </div>
          BoostUP
        </div>
        <div className="flex gap-4">
          <Link to="/login" className="px-4 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors">Log In</Link>
          <Link to="/register" className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors shadow-lg shadow-indigo-500/25">Get Started</Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 text-center max-w-5xl mx-auto py-20">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-medium mb-8">
          <Zap size={16} /> Welcome to the future of Agile
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8">
          Ship Faster with <br className="hidden md:block"/>
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500">Real-Time Agile</span>
        </h1>
        
        <p className="text-xl text-slate-400 max-w-2xl mb-12">
          BoostUP brings real-time Kanban boards, backlog planning, sprint lifecycle management, and team roles into one focused workspace built for delivery teams.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 mb-20">
          <Link to="/register" className="px-8 py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-lg font-medium transition-all hover:scale-105 shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-2">
            Start Free Trial <Zap size={20} />
          </Link>
          <Link to="/login" className="px-8 py-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-lg font-medium transition-all hover:scale-105 border border-slate-700">
            View Demo Dashboard
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-8 w-full">
          {[
            { icon: <Columns3 size={24} className="text-emerald-400" />, title: "Real-Time Kanban", desc: "Drag-and-drop columns that keep every teammate in sync." },
            { icon: <ListChecks size={24} className="text-indigo-400" />, title: "Backlog & Sprints", desc: "User stories, sprint scope, and burndown tracking in one flow." },
            { icon: <Users size={24} className="text-purple-400" />, title: "Team & Roles", desc: "Owner, manager, developer, and viewer permissions per project." }
          ].map((feature, i) => (
            <div key={i} className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50 text-left hover:border-slate-600 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center mb-4">
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold text-slate-200 mb-2">{feature.title}</h3>
              <p className="text-slate-400">{feature.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Landing;

import React, { useState } from 'react';
import { LogOut, MessageSquare, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

export default function StudentDashboard() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'timetable' | 'assessments'>('timetable');

  const handleLogout = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Band */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-start gap-4">
          <button className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors" title="Messages">
            <MessageSquare className="w-6 h-6" />
          </button>
          <button className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors" title="Settings">
            <Settings className="w-6 h-6" />
          </button>
          <button 
            onClick={handleLogout}
            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors" 
            title="Log out"
          >
            <LogOut className="w-6 h-6" />
          </button>
        </div>
      </div>

      <div className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Personal Information Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="flex flex-col md:flex-row p-6 md:p-8 gap-8">
            {/* Left side: Photo */}
            <div className="w-full sm:w-64 md:w-1/3 max-w-[240px] mx-auto md:mx-0 flex-shrink-0">
              <div className="w-full aspect-[3/4] bg-gray-200 rounded-xl overflow-hidden relative shadow-sm border border-gray-100">
                {/* Placeholder Image */}
                <img 
                  src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=533&fit=crop" 
                  alt="Student Profile" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Right side: Details */}
            <div className="w-full md:w-2/3 flex flex-col justify-center space-y-4">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 leading-tight">John Doe</h2>
                <p className="text-gray-500 text-lg font-medium">Student</p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">First Name</span>
                  <span className="text-lg text-gray-900 font-medium">John</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Last Name</span>
                  <span className="text-lg text-gray-900 font-medium">Doe</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Student ID</span>
                  <span className="text-lg text-gray-900 font-medium">#1002495</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Join Date</span>
                  <span className="text-lg text-gray-900 font-medium">September 1, 2024</span>
                </div>
                <div className="flex flex-col sm:col-span-2">
                  <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Attended Groups</span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">Advanced Math (AM-12)</span>
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">Physics Lab (PH-08)</span>
                    <span className="px-3 py-1 bg-violet-100 text-violet-700 rounded-full text-sm font-medium">Literature (LT-04)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Radio Buttons / Toggles */}
        <div className="flex justify-center w-full">
          <div className="bg-white p-1 rounded-xl shadow-sm border border-gray-200 inline-flex flex-wrap sm:flex-nowrap">
            <button
              onClick={() => setActiveTab('timetable')}
              className={`px-6 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 flex-1 sm:flex-none whitespace-nowrap ${
                activeTab === 'timetable' 
                  ? 'bg-blue-600 text-white shadow' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Timetable Board
            </button>
            <button
              onClick={() => setActiveTab('assessments')}
              className={`px-6 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 flex-1 sm:flex-none whitespace-nowrap ${
                activeTab === 'assessments' 
                  ? 'bg-blue-600 text-white shadow' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Assessments Window
            </button>
          </div>
        </div>

        {/* Dynamic Content Area */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 min-h-[400px] p-6 md:p-8 flex flex-col items-center justify-center">
          {activeTab === 'timetable' && (
            <div className="text-center w-full flex-1 flex flex-col items-center justify-center">
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Timetable Board</h3>
              <p className="text-gray-500">Your class schedule will appear here.</p>
              
              <div className="mt-8 border-2 border-dashed border-gray-200 rounded-xl w-full max-w-4xl h-64 flex items-center justify-center bg-gray-50/50">
                 <span className="text-gray-400 font-medium">Timetable Placeholder</span>
              </div>
            </div>
          )}
          {activeTab === 'assessments' && (
            <div className="text-center w-full flex-1 flex flex-col items-center justify-center">
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Assessments Window</h3>
              <p className="text-gray-500">Your recent grades and upcoming assessments.</p>
               
               <div className="mt-8 border-2 border-dashed border-gray-200 rounded-xl w-full max-w-4xl h-64 flex items-center justify-center bg-gray-50/50">
                 <span className="text-gray-400 font-medium">Assessments Placeholder</span>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

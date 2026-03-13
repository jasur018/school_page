import React, { useState } from 'react';
import AdminTimetable from '../components/AdminTimetable';
import { 
  LogOut, 
  Bell, 
  Settings, 
  CalendarDays,
  FileText, 
  Users, 
  Send,
  MessageSquare,
  Menu
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type TabType = 'timetable' | 'applications' | 'students' | 'publish_assessments' | 'message';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('timetable');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = () => {
    navigate('/');
  };

  const menuItems: { id: TabType; icon: React.ReactNode; label: string }[] = [
    { id: 'timetable', icon: <CalendarDays className="w-5 h-5" />, label: 'Timetable' },
    { id: 'applications', icon: <FileText className="w-5 h-5" />, label: 'Applications' },
    { id: 'students', icon: <Users className="w-5 h-5" />, label: 'Students' },
    { id: 'publish_assessments', icon: <Send className="w-5 h-5" />, label: 'Publish Assessments' },
    { id: 'message', icon: <MessageSquare className="w-5 h-5" />, label: 'Message' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      
      {/* Mobile Header (visible only on small screens) */}
      <div className="md:hidden bg-white shadow-sm border-b border-gray-200 sticky top-0 z-20 flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 -ml-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
          <span className="font-bold text-gray-900 text-lg">Admin Panel</span>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
           <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden border border-gray-100">
             <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop" alt="Admin" className="w-full h-full object-cover" />
           </div>
        </div>
      </div>

      {/* Sidebar Navigation */}
      <div className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-lg border-r border-gray-200 transform transition-transform duration-300 ease-in-out flex flex-col
        md:relative md:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Desktop Sidebar Header */}
        <div className="hidden md:flex h-16 items-center px-6 border-b border-gray-100 sticky top-0 bg-white z-10">
           <span className="font-bold text-gray-900 text-xl tracking-tight">Admin Panel</span>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setIsSidebarOpen(false); // Close sidebar on mobile after click
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium text-sm
                ${activeTab === item.id 
                  ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border border-transparent'
                }
              `}
            >
              <div className={activeTab === item.id ? 'text-blue-600' : 'text-gray-400'}>
                {item.icon}
              </div>
              {item.label}
            </button>
          ))}
        </div>

        {/* Sidebar Footer (Logout) */}
        <div className="p-4 border-t border-gray-100">
           <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-gray-50 text-gray-700 hover:bg-red-50 hover:text-red-600 py-3 rounded-xl font-semibold transition-colors duration-200"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm">Log out</span>
          </button>
        </div>
      </div>

      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-gray-900/50 z-20 md:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        
        {/* Top Band (Desktop) */}
        <div className="hidden md:flex bg-white shadow-sm border-b border-gray-200 h-16 items-center justify-end px-8 shrink-0 z-10">
          <div className="flex items-center gap-2 sm:gap-4">
            <button className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors relative" title="Notifications">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
            </button>
            <button className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors" title="Settings">
              <Settings className="w-5 h-5" />
            </button>
            <div className="h-8 w-px bg-gray-200 mx-2"></div>
            <button className="flex items-center gap-3 hover:bg-gray-50 p-1.5 pr-3 rounded-full transition-colors border border-transparent hover:border-gray-200">
               <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden border border-gray-200">
                 {/* Admin Profile Picture Placeholder */}
                 <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop" alt="Admin" className="w-full h-full object-cover" />
               </div>
               <span className="text-sm font-semibold text-gray-700 hidden sm:block">Admin User</span>
            </button>
          </div>
        </div>

        {/* Scrollable Content Container */}
        <div className="flex-1 overflow-y-auto bg-gray-50 p-4 sm:p-6 lg:p-8">
          <div className="max-w-6xl mx-auto space-y-6">
            
            <div className="flex flex-col gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                {menuItems.find(item => item.id === activeTab)?.label}
              </h1>
              <p className="text-gray-500 text-sm">Manage {menuItems.find(item => item.id === activeTab)?.label?.toLowerCase()} and related information.</p>
            </div>

            {/* Content Area Rendering based on Active Tab */}
            <div className={`bg-white rounded-2xl shadow-sm border border-gray-200 min-h-[500px] ${
              activeTab === 'timetable' ? 'p-4 sm:p-6' : 'flex items-center justify-center p-8'
            }`}>
              
              {activeTab === 'timetable' && <AdminTimetable />}

              {activeTab === 'applications' && (
                <div className="text-center w-full max-w-4xl">
                   <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-orange-50 text-orange-500 mb-6">
                      <FileText className="w-10 h-10" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-3">Candidate Applications</h3>
                    <p className="text-gray-500 mb-8">Review and process applications submitted by prospective candidates. Data loaded from Supabase.</p>
                    <div className="border-2 border-dashed border-gray-200 rounded-xl h-96 flex items-center justify-center bg-gray-50/50 flex-col gap-4">
                      <span className="text-gray-400 font-medium">Applications Table Placeholder (Supabase Data)</span>
                    </div>
                 </div>
              )}

              {activeTab === 'students' && (
                <div className="text-center w-full max-w-4xl">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-50 text-emerald-500 mb-6">
                      <Users className="w-10 h-10" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-3">Student Directory</h3>
                    <p className="text-gray-500 mb-8">View complete student list and edit personal data, groups, and status.</p>
                    <div className="border-2 border-dashed border-gray-200 rounded-xl h-96 flex items-center justify-center bg-gray-50/50">
                      <span className="text-gray-400 font-medium">Students Management Table Placeholder</span>
                    </div>
                 </div>
              )}

              {activeTab === 'publish_assessments' && (
                <div className="text-center w-full max-w-2xl">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-violet-50 text-violet-500 mb-6">
                      <Send className="w-10 h-10" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-3">Publish Assessments</h3>
                    <p className="text-gray-500 mb-8">Create and distribute assessments or grades to specific groups or students.</p>
                    <div className="border-2 border-dashed border-gray-200 rounded-xl h-64 flex items-center justify-center bg-gray-50/50">
                      <span className="text-gray-400 font-medium">Publishing Form Placeholder</span>
                    </div>
                 </div>
              )}

              {activeTab === 'message' && (
                <div className="text-center w-full max-w-2xl">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-pink-50 text-pink-500 mb-6">
                      <MessageSquare className="w-10 h-10" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-3">Messaging System</h3>
                    <p className="text-gray-500 mb-8">Send notifications directly to students, groups, or other administrators.</p>
                    <div className="border-2 border-dashed border-gray-200 rounded-xl h-64 flex items-center justify-center bg-gray-50/50">
                      <span className="text-gray-400 font-medium">Message Compose Placeholder</span>
                    </div>
                 </div>
              )}

            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

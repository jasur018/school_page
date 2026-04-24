import React, { useState, useEffect } from 'react';
import AdminTimetable from '../components/AdminTimetable';
import AdminApplications from '../components/AdminApplications';
import AdminStudents from '../components/AdminStudents';
import AdminGroups from '../components/AdminGroups';
import AdminAssessments from '../components/AdminAssessments';
import AdminMessages from '../components/AdminMessages';
import AdminManageAccounts from '../components/AdminManageAccounts';
import AdminAnnouncements from '../components/AdminAnnouncements';
import { 
  LogOut, 
  Bell, 
  Settings, 
  CalendarDays,
  FileText, 
  Users, 
  Send,
  MessageSquare,
  Menu,
  Plus,
  Shield,
  ChevronDown,
  ChevronUp,
  X,
  Mail,
  Megaphone
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { useLanguage } from '../context/LanguageContext';

type TabType = 'timetable' | 'applications' | 'students' | 'manage_groups' | 'publish_assessments' | 'message' | 'manage_accounts' | 'announcements';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<TabType>('timetable');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = () => {
    navigate('/');
  };

  const [displayName, setDisplayName] = useState('Admin');

  // Notifications State
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [expandedMessageId, setExpandedMessageId] = useState<string | null>(null);
  const [adminProfiles, setAdminProfiles] = useState<Record<string, string>>({});

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const user = data.user;
      if (!user) return;
      const name = user.user_metadata?.full_name ||
                   user.email?.split('@')[0] ||
                   'Admin';
      setDisplayName(name);
      fetchNotifications(user.id);
    });
  }, []);

  const fetchNotifications = async (userId: string) => {
    try {
      const [{ data: appsData }, { data: messagesData }] = await Promise.all([
        supabase.from('applications').select('id, created_at').eq('reviewed', false).order('created_at', { ascending: false }).limit(20),
        supabase.from('broadcasts').select('*').contains('recipient_ids', [userId]).order('created_at', { ascending: false }).limit(20)
      ]);

      const fetchedMessages = messagesData || [];
      const combined = [
        ...(appsData || []).map(a => ({ type: 'application', ...a })),
        ...fetchedMessages.map(m => ({ type: 'message', ...m }))
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setNotifications(combined);

      const senderIds = [...new Set(fetchedMessages.map(m => m.sender_id))];
      if (senderIds.length > 0) {
        const { data: profilesData } = await supabase.from('profiles').select('id, full_name').in('id', senderIds);
        const profileMap: Record<string, string> = {};
        (profilesData || []).forEach(p => { profileMap[p.id] = p.full_name; });
        setAdminProfiles(profileMap);
      }

      const lastSeen = localStorage.getItem(`lastSeenNotifications_${userId}`);
      if (!lastSeen) {
        setUnreadCount(combined.length);
      } else {
        const lastSeenDate = new Date(lastSeen).getTime();
        setUnreadCount(combined.filter(n => new Date(n.created_at).getTime() > lastSeenDate).length);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  const handleOpenNotifications = async () => {
    const isOpening = !showNotifications;
    setShowNotifications(isOpening);
    if (isOpening && unreadCount > 0) {
      setUnreadCount(0);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        localStorage.setItem(`lastSeenNotifications_${user.id}`, new Date().toISOString());
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const menuItems: { id: TabType; icon: React.ReactNode; label: string }[] = [
    { id: 'timetable', icon: <CalendarDays className="w-5 h-5" />, label: t('adminMenuTimetable') as string },
    { id: 'applications', icon: <FileText className="w-5 h-5" />, label: t('adminMenuApps') as string },
    { id: 'students', icon: <Users className="w-5 h-5" />, label: t('adminMenuStudents') as string },
    { id: 'manage_groups', icon: <Plus className="w-5 h-5" />, label: t('adminMenuGroups') as string },
    { id: 'publish_assessments', icon: <Send className="w-5 h-5" />, label: t('adminMenuAssessments') as string },
    { id: 'message', icon: <MessageSquare className="w-5 h-5" />, label: t('adminMenuMessage') as string },
    { id: 'manage_accounts', icon: <Shield className="w-5 h-5" />, label: t('adminMenuAccounts') as string },
    { id: 'announcements', icon: <Megaphone className="w-5 h-5" />, label: t('adminMenuAnnouncements') as string },
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
          <span className="font-bold text-gray-900 text-lg">{t('adminPanelTitle')}</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleOpenNotifications} className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors relative">
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>}
          </button>
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
            {displayName.charAt(0).toUpperCase()}
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
           <span className="font-bold text-gray-900 text-xl tracking-tight">{t('adminPanelTitle')}</span>
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
            <span className="text-sm">{t('logOut')}</span>
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
          <div className="flex items-center gap-2 sm:gap-4 relative">
            <LanguageSwitcher theme="light" />
            <div className="h-6 w-px bg-gray-200 mx-1"></div>
            <button onClick={handleOpenNotifications} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors relative" title="Notifications">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>}
            </button>
            <button className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors" title="Settings">
              <Settings className="w-5 h-5" />
            </button>
            <div className="h-8 w-px bg-gray-200 mx-2"></div>
            <button className="flex items-center gap-3 hover:bg-gray-50 p-1.5 pr-3 rounded-full transition-colors border border-transparent hover:border-gray-200">
               <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm shrink-0">
                 {displayName.charAt(0).toUpperCase()}
               </div>
               <span className="text-sm font-semibold text-gray-700 hidden sm:block max-w-[160px] truncate">{displayName}</span>
            </button>
          </div>
        </div>

        {/* Global Notifications Dropdown */}
        {showNotifications && (
          <>
            <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setShowNotifications(false)} />
            <div className="absolute top-16 md:top-20 right-4 md:right-8 w-[calc(100vw-2rem)] md:w-[400px] bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 overflow-hidden flex flex-col max-h-[85vh] animate-in slide-in-from-top-2">
              <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-blue-600" />
                  <h3 className="font-bold text-gray-900 text-sm">{t('adminNotifications')}</h3>
                </div>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full">{unreadCount} New</span>}
                  <button onClick={() => setShowNotifications(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="overflow-y-auto flex-1 bg-white">
                {notifications.length === 0 ? (
                  <div className="p-10 text-center flex flex-col items-center justify-center h-full">
                    <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                      <Bell className="w-6 h-6 text-gray-300" />
                    </div>
                    <p className="text-gray-500 text-sm font-medium">You're all caught up!</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {notifications.map((notif, index) => (
                      <div key={notif.id || index} className="transition-colors hover:bg-gray-50/50">
                        {notif.type === 'application' ? (
                          <div 
                            className="p-4 flex items-start gap-4 cursor-pointer"
                            onClick={() => {
                              setActiveTab('applications');
                              setShowNotifications(false);
                            }}
                          >
                            <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                              <FileText className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0 pt-0.5">
                              <p className="text-sm font-bold text-gray-900">New Application</p>
                              <p className="text-xs text-gray-500 mt-1">{formatDate(notif.created_at)} • Pending review</p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col">
                            <div 
                              className="p-4 flex items-start sm:items-center justify-between cursor-pointer gap-4"
                              onClick={() => setExpandedMessageId(expandedMessageId === notif.id ? null : notif.id)}
                            >
                              <div className="flex items-start gap-4 min-w-0">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                  <Mail className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0 pt-0.5">
                                  <p className="text-sm font-bold text-gray-900 truncate pr-2">{notif.subject}</p>
                                  <p className="text-xs text-gray-500 mt-0.5 truncate">From: {adminProfiles[notif.sender_id] || 'Admin'}</p>
                                  <p className="text-[10px] text-gray-400 mt-1">{formatDate(notif.created_at)}</p>
                                </div>
                              </div>
                              <div className="text-gray-400 shrink-0 self-center">
                                {expandedMessageId === notif.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </div>
                            </div>
                            {expandedMessageId === notif.id && (
                              <div className="px-4 pb-4 animate-in slide-in-from-top-1">
                                <div className="p-3 bg-gray-50 rounded-xl text-sm text-gray-700 whitespace-pre-wrap border border-gray-100 leading-relaxed shadow-sm">
                                  {notif.content}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

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
            <div className={`bg-white rounded-2xl shadow-sm border border-gray-200 min-h-[500px] p-4 sm:p-6 lg:p-8`}>
              
              {activeTab === 'timetable' && <AdminTimetable />}

              {activeTab === 'applications' && <AdminApplications />}

              {activeTab === 'students' && <AdminStudents />}

              {activeTab === 'manage_groups' && <AdminGroups />}

              {activeTab === 'publish_assessments' && <AdminAssessments />}

              {activeTab === 'message' && <AdminMessages />}

              {activeTab === 'manage_accounts' && <AdminManageAccounts />}

              {activeTab === 'announcements' && <AdminAnnouncements />}

            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

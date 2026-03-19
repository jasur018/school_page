import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Mail, 
  Clock, 
  ChevronDown, 
  ChevronUp,
  Inbox
} from 'lucide-react';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { useLanguage } from '../context/LanguageContext';

interface Broadcast {
  id: string;
  created_at: string;
  sender_id: string;
  subject: string;
  content: string;
}

export default function StudentMessages() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Broadcast[]>([]);
  const [adminProfiles, setAdminProfiles] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { t } = useLanguage();

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      // Fetch broadcasts where this user is in the recipient_ids array
      const { data: broadcastsRes, error: broadcastsError } = await supabase
        .from('broadcasts')
        .select('*')
        .contains('recipient_ids', [user.id])
        .order('created_at', { ascending: false });

      if (broadcastsError) throw broadcastsError;
      
      const fetchedMessages = broadcastsRes || [];
      setMessages(fetchedMessages);

      // Collect unique sender IDs to fetch their names
      const senderIds = [...new Set(fetchedMessages.map(m => m.sender_id))];
      
      if (senderIds.length > 0) {
        const { data: profilesRes, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', senderIds);
          
        if (profilesError) throw profilesError;
        
        const profileMap: Record<string, string> = {};
        (profilesRes || []).forEach(p => {
          profileMap[p.id] = p.full_name;
        });
        setAdminProfiles(profileMap);
      }

    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header Band */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/student')}
              className="p-2 sm:p-2.5 rounded-full bg-gray-50 text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-all border border-transparent hover:border-blue-100"
              aria-label="Go back to dashboard"
            >
              <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">{t('studentMessagesTitle')}</h1>
              <p className="text-xs sm:text-sm text-gray-500 font-medium">{t('studentMessagesDesc')}</p>
            </div>
          </div>
          <LanguageSwitcher theme="light" />
        </div>
      </div>

      <div className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            <p className="text-gray-500 font-medium text-sm">Loading your messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-200 p-8 sm:p-12 text-center shadow-sm flex flex-col items-center justify-center mt-4">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
              <Inbox className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{t('inboxEmpty')}</h3>
            <p className="text-gray-500 max-w-sm mx-auto text-sm leading-relaxed">
              When administrators or teachers send out announcements, they will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => {
              const isExpanded = expandedId === msg.id;
              const senderName = adminProfiles[msg.sender_id] || 'School Administration';
              
              return (
                <div 
                  key={msg.id}
                  className={`bg-white rounded-2xl border transition-all duration-300 ${
                    isExpanded 
                      ? 'border-blue-200 shadow-md ring-1 ring-blue-50' 
                      : 'border-gray-200 hover:border-blue-200 hover:shadow-sm'
                  }`}
                >
                  <div 
                    className="p-4 sm:p-5 flex items-start sm:items-center justify-between cursor-pointer gap-4"
                    onClick={() => setExpandedId(isExpanded ? null : msg.id)}
                  >
                    <div className="flex items-start sm:items-center gap-4 min-w-0">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${
                        isExpanded ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600'
                      }`}>
                        <Mail className="w-6 h-6" />
                      </div>
                      <div className="min-w-0 flex flex-col justify-center">
                        <h4 className="font-bold text-gray-900 sm:text-lg truncate tracking-tight">{msg.subject}</h4>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mt-1">
                          <span className="text-sm font-semibold text-gray-700 truncate">
                            {senderName}
                          </span>
                          <span className="hidden sm:inline text-gray-300">•</span>
                          <span className="text-xs text-gray-500 flex items-center gap-1.5 shrink-0">
                            <Clock className="w-3.5 h-3.5" /> {formatDate(msg.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className={`p-2 rounded-xl transition-colors shrink-0 self-center ${isExpanded ? 'bg-blue-50 text-blue-600' : 'text-gray-400'}`}>
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </div>

                  <div 
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      isExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
                    }`}
                  >
                    <div className="px-5 pb-6 pt-2 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl">
                      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-100 shadow-sm mt-4">
                        <div className="prose prose-sm sm:prose-base prose-blue max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed">
                          {msg.content}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

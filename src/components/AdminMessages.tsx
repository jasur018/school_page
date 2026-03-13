import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Send, 
  Search, 
  User as UserIcon, 
  X, 
  Plus, 
  ChevronDown, 
  ChevronUp,
  Mail,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface Profile {
  id: string;
  full_name: string;
  role: 'student' | 'admin';
}

interface Group {
  id: string;
  name: string;
  student_ids: string[];
}

interface Broadcast {
  id: string;
  created_at: string;
  sender_id: string;
  recipient_ids: string[];
  subject: string;
  content: string;
}

export default function AdminMessages() {
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [recipients, setRecipients] = useState<{id: string, name: string, role: string}[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showCompose, setShowCompose] = useState(false);

  // Compose State
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [selectedRecipientIds, setSelectedRecipientIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [broadcastsRes, profilesRes, groupsRes, studentsRes] = await Promise.all([
        supabase.from('broadcasts').select('*').order('created_at', { ascending: false }),
        supabase.from('profiles').select('id, full_name, role'),
        supabase.from('groups').select('id, name'),
        supabase.from('students').select('id, profiles_id, first_name, last_name, attending_groups, status')
      ]);

      if (broadcastsRes.error) throw broadcastsRes.error;
      if (profilesRes.error) throw profilesRes.error;
      
      setBroadcasts(broadcastsRes.data || []);
      setProfiles(profilesRes.data || []);
      
      // Use students directly for active list
      const allStudents = studentsRes.data || [];
      const studyingStudents = allStudents.filter(s => s.status === 'studying' && s.profiles_id);
      
      // Map students to their profile IDs for groups
      const mappedGroups = (groupsRes.data || []).map(g => ({
        ...g,
        student_ids: studyingStudents
          .filter(s => s.attending_groups?.includes(g.id))
          .map(s => s.profiles_id)
      }));
      setGroups(mappedGroups);

      // Build unified recipients list
      const adminRecipients = (profilesRes.data || [])
        .filter(p => p.role === 'admin')
        .map(p => ({ id: p.id, name: p.full_name, role: 'admin' }));
      
      const studentRecipients = studyingStudents.map(s => ({
        id: s.profiles_id,
        name: `${s.first_name} ${s.last_name}`,
        role: 'student'
      }));

      setRecipients([...adminRecipients, ...studentRecipients]);

    } catch (err) {
      console.error('Error fetching messaging data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !content || selectedRecipientIds.length === 0) return;

    setIsSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('broadcasts')
        .insert([{
          sender_id: user?.id,
          recipient_ids: selectedRecipientIds,
          subject,
          content
        }]);

      if (error) throw error;

      await fetchData();
      setShowCompose(false);
      resetForm();
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setIsSending(false);
    }
  };

  const resetForm = () => {
    setSubject('');
    setContent('');
    setSelectedRecipientIds([]);
    setSearchQuery('');
  };

  const toggleRecipient = (id: string) => {
    setSelectedRecipientIds(prev => 
      prev.includes(id) ? prev.filter(rid => rid !== id) : [...prev, id]
    );
  };

  const addGroupRecipients = (groupId: string) => {
    const group = groups.find(g => g.id === groupId);
    if (!group) return;
    const newIds = group.student_ids.filter(id => !selectedRecipientIds.includes(id));
    setSelectedRecipientIds(prev => [...prev, ...newIds]);
  };

  const filteredRecipients = recipients.filter(r => 
    r.name?.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a, b) => {
    if (a.role === 'admin' && b.role !== 'admin') return -1;
    if (a.role !== 'admin' && b.role === 'admin') return 1;
    return a.name.localeCompare(b.name);
  });

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <p className="text-gray-500 font-medium">Loading messages...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Band */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Mail className="w-6 h-6 text-indigo-500" />
            Messaging Console
          </h2>
          <p className="text-sm text-gray-500 mt-1">Send notifications and updates to the school community</p>
        </div>
        <button 
          onClick={() => setShowCompose(true)}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
        >
          <Plus className="w-4 h-4" />
          Compose New Message
        </button>
      </div>

      {/* Messages List */}
      <div className="space-y-4">
        {broadcasts.length === 0 ? (
          <div className="text-center py-24 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
              <Mail className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-lg font-bold text-gray-800">No outgoing messages</h3>
            <p className="text-gray-500 text-sm max-w-xs mx-auto mt-2">Start communicating with students and teachers by composing a new broadcast.</p>
          </div>
        ) : (
          broadcasts.map((msg) => {
            const isExpanded = expandedId === msg.id;
            return (
              <div 
                key={msg.id}
                className={`bg-white rounded-2xl border transition-all duration-200 group ${
                  isExpanded ? 'border-indigo-200 shadow-md ring-1 ring-indigo-50' : 'border-gray-200 hover:border-indigo-200'
                }`}
              >
                <div 
                  className="p-4 sm:p-5 flex items-center justify-between cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : msg.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                      <Send className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{msg.subject}</h4>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {formatDate(msg.created_at)}
                        </span>
                        <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                          {msg.recipient_ids.length} Recipients
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className={`p-2 rounded-lg transition-colors ${isExpanded ? 'bg-indigo-50 text-indigo-600' : 'text-gray-400'}`}>
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-5 pb-6 pt-2 border-t border-gray-50 bg-gray-50/30 rounded-b-2xl animate-in slide-in-from-top-2">
                    <div className="mt-4">
                      <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Content</h5>
                      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {msg.content}
                      </div>

                      <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-6 mb-3">Recipients ({msg.recipient_ids.length})</h5>
                      <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-1 custom-scrollbar">
                          {msg.recipient_ids.map(rid => {
                            const p = profiles.find(profile => profile.id === rid);
                            return (
                              <div key={rid} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border ${
                                p?.role === 'admin' ? 'bg-amber-50 border-amber-100 text-amber-700' : 'bg-gray-50 border-gray-100 text-gray-600'
                              }`}>
                                {p?.role === 'admin' && <CheckCircle2 className="w-3 h-3" />}
                                {p?.full_name || 'Deleted User'}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Compose Dialog */}
      {showCompose && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" onClick={() => setShowCompose(false)}></div>
          <div className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-4xl overflow-hidden animate-in zoom-in-95 duration-200">
            <form onSubmit={handleSend} className="flex flex-col h-[90vh] md:h-auto md:max-h-[85vh]">
              {/* Form Header */}
              <div className="p-6 border-b border-gray-100 flex items-center justify-between shrink-0 bg-indigo-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
                    <Mail className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">New Broadcast</h3>
                </div>
                <button type="button" onClick={() => setShowCompose(false)} className="p-2 hover:bg-white hover:shadow-sm rounded-full text-gray-400 transition-all">
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Form Body */}
              <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                {/* Left: Inputs */}
                <div className="flex-1 p-6 space-y-6 overflow-y-auto border-r border-gray-100">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Subject Line</label>
                    <input 
                      type="text" 
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="e.g., Important School Update"
                      className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all shadow-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Message Content</label>
                    <textarea 
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Write your message here..."
                      rows={8}
                      className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-3xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all shadow-sm resize-none leading-relaxed"
                      required
                    />
                  </div>
                </div>

                {/* Right: Recipient Picker */}
                <div className="w-full md:w-[350px] bg-gray-50/50 p-6 flex flex-col shrink-0">
                  <div className="flex items-center justify-between mb-2 px-1">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Target Recipients</label>
                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                      {selectedRecipientIds.length} Selected
                    </span>
                  </div>

                  {/* Search and Selection Tools */}
                  <div className="space-y-3 mb-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input 
                        type="text"
                        placeholder="Search community..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                       <p className="text-[10px] font-bold text-gray-400 px-1">Quick Add Groups</p>
                       <div className="flex flex-wrap gap-2">
                        {groups.map(g => (
                          <button
                            key={g.id}
                            type="button"
                            onClick={() => addGroupRecipients(g.id)}
                            className="text-[10px] font-bold px-2 py-1.5 bg-white border border-gray-200 rounded-lg hover:border-indigo-500 hover:text-indigo-600 transition-all shadow-sm"
                          >
                            + {g.name}
                          </button>
                        ))}
                       </div>
                    </div>
                  </div>

                  {/* Recipient List */}
                  <div className="flex-1 overflow-y-auto bg-white border border-gray-200 rounded-2xl p-2 space-y-1 custom-scrollbar min-h-[200px]">
                    {filteredRecipients.map(r => {
                      const isSelected = selectedRecipientIds.includes(r.id);
                      return (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => toggleRecipient(r.id)}
                          className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all ${
                            isSelected ? 'bg-indigo-600 text-white' : 'hover:bg-gray-50 text-gray-700'
                          }`}
                        >
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                              isSelected ? 'bg-white/20' : r.role === 'admin' ? 'bg-amber-100 text-amber-600' : 'bg-indigo-50 text-indigo-500'
                            }`}>
                              {r.role === 'admin' ? <AlertCircle className="w-4 h-4" /> : <UserIcon className="w-4 h-4" />}
                            </div>
                            <div className="text-left overflow-hidden">
                              <p className="text-[11px] font-bold truncate leading-tight">{r.name}</p>
                              <p className={`text-[9px] uppercase tracking-wider font-semibold opacity-70 ${isSelected ? 'text-white' : ''}`}>
                                {r.role}
                              </p>
                            </div>
                          </div>
                          {isSelected && <X className="w-3 h-3 text-white/50 hover:text-white" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Form Footer */}
              <div className="p-6 border-t border-gray-100 shrink-0 flex gap-4 bg-white">
                <button 
                  type="button" 
                  onClick={() => setShowCompose(false)}
                  className="flex-1 py-4 bg-gray-50 text-gray-600 rounded-2xl font-bold text-sm hover:bg-gray-100 transition-all"
                >
                  Discard
                </button>
                <button 
                  type="submit"
                  disabled={isSending || selectedRecipientIds.length === 0}
                  className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
                >
                  {isSending ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Sending...
                      </span>
                  ) : (
                    <><Send className="w-4 h-4" /> Dispatch Broadcast</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

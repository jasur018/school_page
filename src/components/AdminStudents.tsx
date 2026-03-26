import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../context/LanguageContext';
import { translations } from '../lib/i18n';
import { 
  Users, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  User, 
  History,
  AlertCircle,
  Archive,
  RefreshCw,
  MoreVertical,
  Star,
  UserPlus,
  X
} from 'lucide-react';

interface Student {
  id: string;
  profile_id: string | null;
  first_name: string;
  last_name: string;
  date_of_birth: string | null;
  grade: string | null;
  attending_groups: string[];
  join_date: string;
  guardian_full_name: string | null;
  guardian_phone: string | null;
  address: string | null;
  status: 'studying' | 'left_school';
  created_at: string;
}

interface Group {
  id: string;
  name: string;
}

export default function AdminStudents() {
  const { language } = useLanguage();
  const t = (key: keyof typeof translations.en) => translations[language][key];

  const [students, setStudents] = useState<Student[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showStatusDialog, setShowStatusDialog] = useState<{ id: string, targetStatus: 'studying' | 'left_school' } | null>(null);
  const [showNewStudentDialog, setShowNewStudentDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // New Student Form State
  const [newStudent, setNewStudent] = useState({
    first_name: '',
    last_name: '',
    date_of_birth: '',
    grade: '9',
    guardian_full_name: '',
    guardian_phone: '',
    address: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [studentsRes, groupsRes] = await Promise.all([
        supabase.from('students').select('*').order('last_name', { ascending: true }),
        supabase.from('groups').select('id, name')
      ]);

      if (studentsRes.error) throw studentsRes.error;
      if (groupsRes.error) throw groupsRes.error;

      setStudents(studentsRes.data || []);
      setGroups(groupsRes.data || []);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async () => {
    if (!showStatusDialog) return;

    try {
      const updateData: any = { status: showStatusDialog.targetStatus };
      
      // If student left school, clear their groups
      if (showStatusDialog.targetStatus === 'left_school') {
        updateData.attending_groups = [];
      }

      const { error } = await supabase
        .from('students')
        .update(updateData)
        .eq('id', showStatusDialog.id);

      if (error) throw error;

      setStudents(prev => prev.map(s => 
        s.id === showStatusDialog.id 
          ? { 
              ...s, 
              status: showStatusDialog.targetStatus,
              attending_groups: showStatusDialog.targetStatus === 'left_school' ? [] : s.attending_groups 
            } 
          : s
      ));
      setShowStatusDialog(null);
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('students')
        .insert([{
          ...newStudent,
          status: 'studying',
          attending_groups: []
        }])
        .select();

      if (error) throw error;
      if (data) {
        setStudents(prev => [...prev, data[0]]);
        setShowNewStudentDialog(false);
        setNewStudent({
          first_name: '',
          last_name: '',
          date_of_birth: '',
          grade: '9',
          guardian_full_name: '',
          guardian_phone: '',
          address: ''
        });
      }
    } catch (err) {
      console.error('Error creating student:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getGroupName = (id: string) => groups.find(g => g.id === id)?.name || 'Unknown Group';

  const filteredStudents = students
    .filter(s => (activeTab === 'active' ? s.status === 'studying' : s.status === 'left_school'))
    .filter(s => 
      `${s.first_name} ${s.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.guardian_full_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const formatDate = (date: string | null) => {
    if (!date) return t('std_notSet');
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="text-gray-500 font-medium">{t('std_loading')}</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Search and Tabs */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex bg-gray-100 p-1 rounded-xl w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('active')}
            className={`flex-1 sm:flex-none px-6 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
              activeTab === 'active' 
                ? 'bg-white text-blue-700 shadow-sm border border-gray-100' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Users className="w-4 h-4" />
            {t('std_activeStudents')}
          </button>
          <button
            onClick={() => setActiveTab('archived')}
            className={`flex-1 sm:flex-none px-6 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
              activeTab === 'archived' 
                ? 'bg-white text-blue-700 shadow-sm border border-gray-100' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Archive className="w-4 h-4" />
            {t('std_archive')}
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder={t('std_searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
          />
        </div>

        <button 
          onClick={() => setShowNewStudentDialog(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
        >
          <UserPlus className="w-4 h-4" />
          {t('std_addNewStudent')}
        </button>
      </div>

      {/* Students List */}
      <div className="space-y-4">
        {filteredStudents.length === 0 ? (
          <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white shadow-sm text-gray-400 mb-4">
              <Users className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-gray-800">{t('std_noStudentsFound')}</h3>
            <p className="text-gray-500 text-sm">{t('std_startByAdding')}</p>
          </div>
        ) : (
          filteredStudents.map((student) => (
            <div 
              key={student.id}
              className={`group bg-white rounded-2xl border transition-all duration-200 ${
                expandedId === student.id 
                  ? 'border-blue-200 shadow-md' 
                  : 'border-gray-200 hover:border-blue-200'
              }`}
            >
              {/* Row Header */}
              <div 
                className="p-4 sm:p-5 flex items-center justify-between cursor-pointer"
                onClick={() => setExpandedId(expandedId === student.id ? null : student.id)}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
                    student.status === 'studying' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'
                  }`}>
                    <User className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-gray-900 text-sm sm:text-base truncate">
                      {student.first_name} {student.last_name}
                    </h4>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5">
                      <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider bg-gray-100 px-2 py-0.5 rounded">
                        {t('std_grade')} {student.grade || t('std_na')}
                      </span>
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        {student.attending_groups.length > 0 ? (
                          student.attending_groups.slice(0, 2).map(gid => (
                            <span key={gid} className="text-[10px] text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded-md truncate max-w-[100px]">
                              {getGroupName(gid)}
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] text-gray-400 italic">{t('std_noGroups')}</span>
                        )}
                        {student.attending_groups.length > 2 && (
                          <span className="text-[10px] text-gray-400">+{student.attending_groups.length - 2} {t('std_more')}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="hidden md:flex flex-col items-end">
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                      student.status === 'studying' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {student.status === 'studying' ? t('std_statusStudying') : t('std_statusLeft')}
                    </span>
                  </div>
                  <div className="p-2 text-gray-400 group-hover:text-blue-600 group-hover:bg-blue-50 rounded-lg transition-colors">
                    {expandedId === student.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                </div>
              </div>

              {/* Expanded Content */}
              {expandedId === student.id && (
                <div className="px-5 pb-6 pt-2 border-t border-gray-50 bg-gray-50/30 rounded-b-2xl animate-in slide-in-from-top-2 duration-200">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                    
                    {/* Personal Info */}
                    <div className="space-y-4">
                      <h5 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <User className="w-3.5 h-3.5" /> {t('std_personalDetails')}
                      </h5>
                      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-3">
                        <DetailItem label={t('std_dateOfBirth')} value={formatDate(student.date_of_birth)} />
                        <DetailItem label={t('std_joinDate')} value={formatDate(student.join_date)} />
                        <DetailItem label={t('std_address')} value={student.address || t('std_noAddress')} />
                      </div>
                    </div>

                    {/* Guardian Info */}
                    <div className="space-y-4">
                      <h5 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <User className="w-3.5 h-3.5" /> {t('std_guardianContacts')}
                      </h5>
                      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-3">
                        <DetailItem label={t('std_guardianName')} value={student.guardian_full_name || t('std_na')} />
                        <div className="flex items-center justify-between">
                           <span className="text-[10px] font-medium text-gray-400">{t('std_phone')}</span>
                           <a href={`tel:${student.guardian_phone}`} className="text-xs font-semibold text-blue-600 hover:underline">{student.guardian_phone || t('std_na')}</a>
                        </div>
                        <DetailItem label={t('std_linkedAccount')} value={student.profile_id ? t('std_connected') : t('std_unlinked')} />
                      </div>
                    </div>

                    {/* Academic Performance (Placeholder) */}
                    <div className="space-y-4">
                      <h5 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <Star className="w-3.5 h-3.5" /> {t('std_latestPerformance')}
                      </h5>
                      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-3">
                        <div className="flex items-center justify-between py-1 border-b border-gray-50">
                          <span className="text-xs text-gray-600">{t('std_overallAverage')}</span>
                          <span className="text-sm font-bold text-gray-900">8.4 / 10</span>
                        </div>
                        <div className="space-y-2 pt-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-gray-500 italic">{t('std_progressTracking')}</span>
                            <span className="text-emerald-500 font-bold">+0.2</span>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full w-[84%]"></div>
                          </div>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-2">{t('std_historicalMarksNote')}</p>
                      </div>
                    </div>
                  </div>

                  {/* Action Menu */}
                  <div className="mt-6 pt-6 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <History className="w-4 h-4" />
                      {t('std_lastUpdated')} {formatDate(student.created_at)}
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      {student.status === 'studying' ? (
                        <button 
                          onClick={() => setShowStatusDialog({ id: student.id, targetStatus: 'left_school' })}
                          className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-orange-50 text-orange-700 font-bold text-sm hover:bg-orange-100 transition-colors"
                        >
                          <Archive className="w-4 h-4" />
                          {t('std_markAsLeft')}
                        </button>
                      ) : (
                        <button 
                          onClick={() => setShowStatusDialog({ id: student.id, targetStatus: 'studying' })}
                          className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-50 text-emerald-700 font-bold text-sm hover:bg-emerald-100 transition-colors"
                        >
                          <RefreshCw className="w-4 h-4" />
                          {t('std_recoverToStudying')}
                        </button>
                      )}
                      <button className="p-2.5 rounded-xl bg-gray-50 text-gray-500 hover:text-gray-800 transition-colors">
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Warning Dialog */}
      {showStatusDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setShowStatusDialog(null)}></div>
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 sm:p-8">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-orange-100 text-orange-600 mb-6 mx-auto">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 text-center mb-3">
                {showStatusDialog.targetStatus === 'left_school' ? t('std_statusDialogMarkLeftTitle') : t('std_statusDialogRecoverTitle')}
              </h3>
              <p className="text-center text-gray-500 text-sm leading-relaxed mb-8">
                {showStatusDialog.targetStatus === 'left_school' 
                  ? t('std_statusDialogMarkLeftDesc')
                  : t('std_statusDialogRecoverDesc')}
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button 
                  onClick={() => setShowStatusDialog(null)}
                  className="order-2 sm:order-1 flex-1 py-3 text-sm font-bold text-gray-500 hover:bg-gray-50 rounded-2xl transition-colors"
                >
                  {t('std_cancel')}
                </button>
                <button 
                  onClick={handleStatusChange}
                  className="order-1 sm:order-2 flex-1 py-3 text-sm font-bold bg-gray-900 text-white hover:bg-gray-800 rounded-2xl transition-all shadow-lg shadow-gray-200"
                >
                  {t('std_yesConfirm')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showNewStudentDialog && (
        <NewStudentDialog 
          onClose={() => setShowNewStudentDialog(false)} 
          onSubmit={handleCreateStudent}
          data={newStudent}
          setData={setNewStudent}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
}

function NewStudentDialog({ 
  onClose, 
  onSubmit, 
  data, 
  setData,
  isSubmitting
}: { 
  onClose: () => void, 
  onSubmit: (e: React.FormEvent) => void,
  data: any,
  setData: (val: any) => void,
  isSubmitting: boolean
}) {
  const { language } = useLanguage();
  const t = (key: keyof typeof translations.en) => translations[language][key];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <form onSubmit={onSubmit} className="p-6 sm:p-8 overflow-y-auto max-h-[90vh]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-900">{t('std_registerNewStudent')}</h3>
            <button type="button" onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-400"><X className="w-5 h-5" /></button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">{t('std_firstName')}</label>
              <input type="text" value={data.first_name} onChange={(e) => setData({...data, first_name: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" required />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">{t('std_lastName')}</label>
              <input type="text" value={data.last_name} onChange={(e) => setData({...data, last_name: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" required />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">{t('std_dateOfBirth')}</label>
              <input type="date" value={data.date_of_birth} onChange={(e) => setData({...data, date_of_birth: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">{t('std_grade')}</label>
              <select value={data.grade} onChange={(e) => setData({...data, grade: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500">
                <option value="9">Grade 9</option>
                <option value="10">Grade 10</option>
                <option value="11">Grade 11</option>
                <option value="12">Grade 12</option>
              </select>
            </div>
            <div className="sm:col-span-2 border-t border-gray-50 pt-3">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">{t('std_guardianFullName')}</label>
              <input type="text" value={data.guardian_full_name} onChange={(e) => setData({...data, guardian_full_name: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">{t('std_guardianPhone')}</label>
              <input type="tel" value={data.guardian_phone} onChange={(e) => setData({...data, guardian_phone: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">{t('std_address')}</label>
              <textarea rows={2} value={data.address} onChange={(e) => setData({...data, address: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>
          </div>

          <div className="mt-8 flex gap-3">
            <button type="button" onClick={onClose} disabled={isSubmitting} className="flex-1 py-3 text-sm font-bold text-gray-500 hover:bg-gray-50 rounded-2xl transition-colors disabled:opacity-50">{t('std_cancel')}</button>
            <button type="submit" disabled={isSubmitting} className="flex-1 py-3 text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 rounded-2xl transition-all shadow-lg shadow-blue-100 disabled:opacity-50 disabled:shadow-none">
              {isSubmitting ? t('std_registeringBtn') : t('std_registerStudentBtn')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DetailItem({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] font-medium text-gray-400 leading-none mb-1">{label}</span>
      <span className="text-xs font-semibold text-gray-800">{value}</span>
    </div>
  );
}

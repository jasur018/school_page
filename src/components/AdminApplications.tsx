import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../context/LanguageContext';
import { translations } from '../lib/i18n';
import { 
  FileText, 
  CheckCircle, 
  Clock, 
  ChevronDown, 
  ChevronUp, 
  Mail, 
  Phone, 
  User, 
  Calendar,
  Search,
  ArrowRight
} from 'lucide-react';

interface Application {
  id: string;
  created_at: string;
  student_name: string;
  parent_name: string;
  email: string;
  phone: string;
  grade_level: string;
  message: string | null;
  status: string;
  reviewed: boolean;
}

export default function AdminApplications() {
  const { language } = useLanguage();
  const t = (key: keyof typeof translations.en) => translations[language][key];

  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'new' | 'archived'>('new');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (err) {
      console.error('Error fetching applications:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const markAsReviewed = async (id: string) => {
    try {
      const { error } = await supabase
        .from('applications')
        .update({ reviewed: true, status: 'accepted' }) // Default to accepted when reviewed for now, or just update reviewed
        .eq('id', id);

      if (error) throw error;
      
      setApplications(prev => prev.map(app => 
        app.id === id ? { ...app, reviewed: true } : app
      ));
    } catch (err) {
      console.error('Error updating application:', err);
    }
  };

  const filteredApplications = applications
    .filter(app => (activeTab === 'new' ? !app.reviewed : app.reviewed))
    .filter(app => 
      app.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.parent_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="text-gray-500 font-medium text-lg">{t('app_loading')}</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex bg-gray-100 p-1 rounded-xl w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('new')}
            className={`flex-1 sm:flex-none px-6 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
              activeTab === 'new' 
                ? 'bg-white text-blue-700 shadow-sm border border-gray-100' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Clock className="w-4 h-4" />
            {t('app_new')}
            {applications.filter(a => !a.reviewed).length > 0 && (
              <span className="flex items-center justify-center bg-blue-600 text-white text-[10px] font-bold h-5 w-5 rounded-full">
                {applications.filter(a => !a.reviewed).length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('archived')}
            className={`flex-1 sm:flex-none px-6 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
              activeTab === 'archived' 
                ? 'bg-white text-blue-700 shadow-sm border border-gray-100' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <CheckCircle className="w-4 h-4" />
            {t('app_archived')}
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder={t('app_searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
          />
        </div>
      </div>

      {/* Applications List */}
      <div className="space-y-4">
        {filteredApplications.length === 0 ? (
          <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white shadow-sm text-gray-400 mb-4">
              <FileText className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-gray-800">{t('app_noApplicationsFound')}</h3>
            <p className="text-gray-500 text-sm">{t('app_whenCandidatesSubmit')}</p>
          </div>
        ) : (
          filteredApplications.map((app) => (
            <div 
              key={app.id}
              className={`group bg-white rounded-2xl border transition-all duration-200 ${
                expandedId === app.id 
                  ? 'border-blue-200 shadow-md ring-1 ring-blue-50' 
                  : 'border-gray-200 hover:border-blue-200 hover:shadow-sm'
              }`}
            >
              {/* Row Header */}
              <div 
                className="p-4 sm:p-5 flex items-center justify-between cursor-pointer"
                onClick={() => toggleExpand(app.id)}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className={`shrink-0 w-10 sm:w-12 h-10 sm:h-12 rounded-xl flex items-center justify-center ${
                    app.reviewed ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                  }`}>
                    <User className="w-5 sm:w-6 h-5 sm:h-6" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-gray-900 text-sm sm:text-base truncate">
                      {app.student_name}
                    </h4>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 text-[11px] font-bold uppercase tracking-wider">
                        {t('app_grade')} {app.grade_level}
                      </span>
                      {!app.reviewed && (
                        <span className="inline-flex items-center gap-1 text-blue-600 text-xs font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
                          {t('app_newBadge')}
                        </span>
                      )}
                      <span className="text-gray-400 text-xs flex items-center gap-1 hidden sm:flex">
                        <Clock className="w-3.5 h-3.5" />
                        {formatDate(app.created_at)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="hidden md:flex flex-col items-end gap-0.5 mr-4 overflow-hidden max-w-[150px]">
                    <span className="text-xs font-semibold text-gray-700 truncate w-full flex items-center justify-end gap-1">
                      <Mail className="w-3 h-3 text-gray-400" /> {app.email}
                    </span>
                    <span className="text-[11px] text-gray-400 truncate w-full flex items-center justify-end gap-1">
                      <Phone className="w-3 h-3 text-gray-400" /> {app.phone}
                    </span>
                  </div>
                  <div className="p-2 text-gray-400 group-hover:text-blue-600 group-hover:bg-blue-50 rounded-lg transition-colors">
                    {expandedId === app.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedId === app.id && (
                <div className="px-5 pb-6 pt-2 border-t border-gray-50 bg-gray-50/30 rounded-b-2xl animate-in slide-in-from-top-2 duration-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-2">
                    <div className="space-y-4">
                      <div>
                        <h5 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                          <User className="w-3.5 h-3.5" /> {t('app_contactInformation')}
                        </h5>
                        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400">
                              <User className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-[10px] font-medium text-gray-400 leading-none mb-1">{t('app_parentName')}</p>
                              <p className="text-sm font-semibold text-gray-800">{app.parent_name}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400">
                              <Mail className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[10px] font-medium text-gray-400 leading-none mb-1">{t('app_emailAddress')}</p>
                              <p className="text-sm font-semibold text-gray-800 truncate">{app.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400">
                              <Phone className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-[10px] font-medium text-gray-400 leading-none mb-1">{t('app_phoneNumber')}</p>
                              <p className="text-sm font-semibold text-gray-800">{app.phone}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="md:hidden">
                        <h5 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5" /> {t('app_submissionDate')}
                        </h5>
                        <p className="text-sm text-gray-700 font-medium px-4">{formatDate(app.created_at)}</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h5 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                          <FileText className="w-3.5 h-3.5" /> {t('app_additionalMessage')}
                        </h5>
                        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm min-h-[100px]">
                          <p className="text-sm text-gray-600 leading-relaxed italic">
                            {app.message || t('app_noAdditionalMessage')}
                          </p>
                        </div>
                      </div>

                      {!app.reviewed && (
                        <div className="pt-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsReviewed(app.id);
                            }}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-blue-100 group/btn"
                          >
                            {t('app_markAsReviewed')}
                            <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

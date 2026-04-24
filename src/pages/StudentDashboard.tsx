import { useState, useEffect } from 'react';
import { LogOut, MessageSquare, Settings, Users, AlertCircle, User, CalendarDays, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { supabase } from '../lib/supabase';
import LanguageSwitcher from '../components/LanguageSwitcher';

interface Student {
  id: string;
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
}

interface Group {
  id: string;
  name: string;
}

interface TimetableEntry {
  id: string;
  day_of_week: number;
  time_slot: string;
  room: string;
  group_ids: string[];
  week_start: string;
}

interface AssessmentEntry {
  id: string;
  created_at: string;
  comment: string;
  maximum_mark: number;
  student_mark: number;
  group_name: string;
  leaderboard?: {
    student_id: string;
    student_name: string;
    mark: number;
  }[];
}


export default function StudentDashboard() {
  const navigate = useNavigate();
  useLanguage();
  const [activeTab, setActiveTab] = useState<'timetable' | 'assessments'>('timetable');
  const [students, setStudents] = useState<Student[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  
  // Dashboard Data
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [assessments, setAssessments] = useState<AssessmentEntry[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [authDisplayName, setAuthDisplayName] = useState('');
  const { t } = useLanguage();

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedStudentId) {
      fetchStudentDashboardData(selectedStudentId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStudentId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [studentsRes, groupsRes, userRes] = await Promise.all([
        supabase.from('students').select('*').order('first_name', { ascending: true }),
        supabase.from('groups').select('id, name'),
        supabase.auth.getUser()
      ]);

      if (studentsRes.error) throw studentsRes.error;
      if (groupsRes.error) throw groupsRes.error;

      const fetchedStudents = studentsRes.data || [];
      setStudents(fetchedStudents);
      setGroups(groupsRes.data || []);

      // Set display name from auth
      const user = userRes.data.user;
      const name = user?.user_metadata?.full_name || user?.email?.split('@')[0] || t('parent');
      setAuthDisplayName(name);

      if (fetchedStudents.length > 0) {
        setSelectedStudentId(fetchedStudents[0].id);
      }
    } catch (err) {
      console.error('Error fetching dashboard initial data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentDashboardData = async (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    setDataLoading(true);
    try {
      // 1. Fetch Timetable for student's groups (current week only)
      let timetableData: TimetableEntry[] = [];
      if (student.attending_groups && student.attending_groups.length > 0) {
        // Compute this week's Monday as an ISO date string (YYYY-MM-DD)
        const now = new Date();
        const jsDow = now.getDay(); // 0=Sun
        const diffToMonday = jsDow === 0 ? -6 : 1 - jsDow;
        const monday = new Date(now);
        monday.setDate(now.getDate() + diffToMonday);
        monday.setHours(0, 0, 0, 0);
        const weekStartStr = monday.toISOString().split('T')[0]; // "YYYY-MM-DD"

        const { data: ttData, error: ttError } = await supabase
          .from('timetable')
          .select('*')
          .overlaps('group_ids', student.attending_groups)
          .eq('week_start', weekStartStr)
          .order('day_of_week', { ascending: true })
          .order('time_slot', { ascending: true });
        
        if (ttError) throw ttError;
        timetableData = ttData || [];
      }
      setTimetable(timetableData);

      // 2. Fetch Assessments via secure RPC
      const { data: assessmentData, error: aError } = await supabase.rpc('get_student_assessments', {
        target_student_id: studentId
      });

      if (aError) {
        // If RPC isn't created yet, we silently fail/log it so the page doesn't break
        console.warn('Assessments RPC error (might need SQL migration):', aError.message);
        setAssessments([]);
      } else {
        setAssessments(assessmentData || []);
      }

    } catch (err) {
      console.error('Error fetching student specific data:', err);
    } finally {
      setDataLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const selectedStudent = students.find(s => s.id === selectedStudentId);

  const getGroupName = (id: string) => groups.find(g => g.id === id)?.name || 'Unknown Group';

  const formatDate = (dateString: string | undefined | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="text-gray-500 font-medium">{t('loadingDashboard')}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Band */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          
          {/* Left Side: Student Selector */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 text-blue-700 rounded-xl flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            {students.length > 0 ? (
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 outline-none font-semibold cursor-pointer max-w-[200px]"
              >
                {students.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.first_name} {s.last_name}
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-gray-500 font-medium text-sm">{t('noConnectedStudents')}</span>
            )}
          </div>

          {/* Right Side: Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {authDisplayName && (
              <span className="text-sm font-bold text-gray-700 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100 shadow-sm max-w-[100px] sm:max-w-[200px] truncate" title={authDisplayName}>
                {authDisplayName}
              </span>
            )}
            <LanguageSwitcher theme="light" />
            <button 
              onClick={() => navigate('/messages')}
              className="p-2.5 rounded-full bg-white border border-gray-100 shadow-sm text-gray-600 hover:text-blue-600 transition-all hover:border-blue-100"
            >
              <MessageSquare size={18} />
            </button>
            <button className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors" title={t('settings')}>
              <Settings className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <button 
              onClick={handleLogout}
              className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors" 
              title={t('logout')}
            >
              <LogOut className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>

        </div>
      </div>

      <div className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Personal Information Section */}
        {selectedStudent ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="flex flex-col md:flex-row p-6 md:p-8 gap-8">
              {/* Left side: Photo */}
              <div className="w-full sm:w-64 md:w-1/3 max-w-[240px] mx-auto md:mx-0 flex-shrink-0">
                <div className="w-full aspect-[3/4] bg-gray-100 rounded-xl flex items-center justify-center relative shadow-sm border border-gray-200">
                  <User className="w-32 h-32 text-gray-300" strokeWidth={1.5} />
                </div>
              </div>

              {/* Right side: Details */}
              <div className="w-full md:w-2/3 flex flex-col justify-center space-y-4">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 leading-tight">
                    {selectedStudent.first_name} {selectedStudent.last_name}
                  </h2>
                  <div className="flex items-center gap-3 mt-1">
                    <p className="text-gray-500 text-lg font-medium">{t('studentRole')}</p>
                    {selectedStudent.status === 'left_school' && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-orange-100 text-orange-700">
                        {t('leftSchoolStatus')}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{t('firstName')}</span>
                    <span className="text-lg text-gray-900 font-medium">{selectedStudent.first_name}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{t('lastName')}</span>
                    <span className="text-lg text-gray-900 font-medium">{selectedStudent.last_name}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{t('grade')}</span>
                    <span className="text-lg text-gray-900 font-medium">{selectedStudent.grade ? `${t('grade')} ${selectedStudent.grade}` : 'N/A'}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{t('joinDate')}</span>
                    <span className="text-lg text-gray-900 font-medium">{formatDate(selectedStudent.join_date)}</span>
                  </div>
                  <div className="flex flex-col sm:col-span-2">
                    <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{t('attendedGroups')}</span>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedStudent.attending_groups && selectedStudent.attending_groups.length > 0 ? (
                        selectedStudent.attending_groups.map((groupId, index) => {
                          // Cycle through 3 colors for styling
                          const colors = [
                            'bg-blue-100 text-blue-700',
                            'bg-emerald-100 text-emerald-700',
                            'bg-violet-100 text-violet-700'
                          ];
                          const colorClass = colors[index % colors.length];
                          return (
                            <span key={groupId} className={`px-3 py-1 rounded-full text-sm font-medium ${colorClass}`}>
                              {getGroupName(groupId)}
                            </span>
                          );
                        })
                      ) : (
                        <span className="text-gray-400 italic text-sm">{t('notAttendingGroups')}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{t('noStudentsConnectedTitle')}</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              {t('noStudentsConnectedDescription')}
            </p>
          </div>
        )}

        {/* Radio Buttons / Toggles */}
        <div className="flex justify-center w-full">
          <div className="bg-white p-1 rounded-xl shadow-sm border border-gray-200 inline-flex flex-wrap sm:flex-nowrap">
            <button
              onClick={() => setActiveTab('timetable')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold transition-all duration-200 ${
                activeTab === 'timetable' 
                  ? 'bg-blue-600 text-white shadow-md transform scale-[1.02]' 
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <CalendarDays className="w-5 h-5" />
              {t('studentTabTimetable')}
            </button>
            <button
              onClick={() => setActiveTab('assessments')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold transition-all duration-200 ${
                activeTab === 'assessments' 
                  ? 'bg-blue-600 text-white shadow-md transform scale-[1.02]' 
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Award className="w-5 h-5" />
              {t('studentTabAssessments')}
            </button>
          </div>
        </div>

        {/* Dynamic Content Area */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 min-h-[400px] p-6 md:p-8 flex flex-col">
          {dataLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center space-y-4">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
              <p className="text-gray-500 font-medium text-sm">Loading student data...</p>
            </div>
          ) : (
            <>
              {activeTab === 'timetable' && (
                <div className="w-full flex-1 flex flex-col">
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">Weekly Timetable</h3>
                    <p className="text-gray-500">Your class schedule across all attended groups.</p>
                  </div>
                  
                  {timetable.length === 0 ? (
                    <div className="flex-1 border-2 border-dashed border-gray-200 rounded-xl w-full flex flex-col items-center justify-center bg-gray-50/50 py-12">
                      <p className="text-gray-500 font-medium">No classes scheduled.</p>
                      <p className="text-sm text-gray-400 mt-1">If this is a mistake, contact administration.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {(() => {
                        const now = new Date();
                        const jsDow = now.getDay(); // 0=Sun
                        // Convert JS Sunday(0) → DB Sunday(7), others stay the same
                        const todayDow = jsDow === 0 ? 7 : jsDow;
                        const currentTime = now.toTimeString().substring(0, 5); // "HH:MM"

                        // Compute the Monday of this current week (DB dow 1 = Monday)
                        const monday = new Date(now);
                        monday.setDate(now.getDate() - (todayDow - 1));
                        monday.setHours(0, 0, 0, 0);

                        const dayColumns = [1, 2, 3, 4, 5, 6, 7].map(dayFormat => {
                          const dayEntries = timetable.filter(e => e.day_of_week === dayFormat);
                          if (dayEntries.length === 0) return null;

                          const isToday = dayFormat === todayDow;
                          const isPast = dayFormat < todayDow;

                          // Compute actual calendar date for this day (Monday + offset)
                          const dayDate = new Date(monday);
                          dayDate.setDate(monday.getDate() + (dayFormat - 1));
                          const dateLabel = dayDate.toLocaleDateString(undefined, {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric'
                          });

                          return (
                            <div
                              key={dayFormat}
                              className={`rounded-2xl p-4 border transition-all ${
                                isToday
                                  ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-100'
                                  : isPast
                                  ? 'bg-gray-50/60 border-gray-100 opacity-60'
                                  : 'bg-gray-50 border-gray-100'
                              }`}
                            >
                              <div className="border-b border-gray-200 pb-3 mb-3 flex items-center justify-between gap-2">
                                <span className="font-bold text-gray-900 uppercase tracking-wide text-xs sm:text-sm flex items-center gap-1.5 flex-wrap">
                                  {dateLabel}
                                  {isToday && (
                                    <span className="bg-blue-600 text-white text-[9px] font-bold py-0.5 px-2 rounded-full uppercase tracking-widest">
                                      Today
                                    </span>
                                  )}
                                </span>
                                <span className={`text-xs py-0.5 px-2 rounded-full shrink-0 ${isToday ? 'bg-blue-200 text-blue-800' : 'bg-blue-100 text-blue-700'}`}>
                                  {dayEntries.length}
                                </span>
                              </div>
                              <div className="space-y-2">
                                {dayEntries.map(entry => {
                                  const entryTime = entry.time_slot.substring(0, 5);
                                  const isPassedSlot = isToday && entryTime < currentTime;
                                  const relevantGroupId = entry.group_ids.find(gid => selectedStudent?.attending_groups.includes(gid)) || entry.group_ids[0];
                                  return (
                                    <div
                                      key={entry.id}
                                      className={`bg-white p-3 rounded-xl border shadow-sm flex gap-3 transition-opacity ${isPassedSlot || isPast ? 'opacity-50' : ''}`}
                                    >
                                      <div className="flex flex-col items-center justify-center border-r border-gray-100 pr-3 w-14 shrink-0">
                                        <span className="text-xs font-bold text-gray-900 leading-none tabular-nums">
                                          {entryTime}
                                        </span>
                                      </div>
                                      <div className="flex flex-col justify-center min-w-0">
                                        <span className="font-bold text-gray-900 text-xs truncate">
                                          {getGroupName(relevantGroupId)}
                                        </span>
                                        <span className="text-[11px] text-blue-600 font-semibold mt-0.5">
                                          Room {entry.room}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        });

                        const hasVisible = dayColumns.some(Boolean);
                        if (!hasVisible) {
                          return (
                            <div className="col-span-full flex flex-col items-center justify-center py-12 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                              <p className="text-gray-500 font-medium">No classes scheduled this week.</p>
                              <p className="text-sm text-gray-400 mt-1">Check back on Monday for next week's schedule.</p>
                            </div>
                          );
                        }

                        return dayColumns;
                      })()}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'assessments' && (
                <div className="w-full flex-1 flex flex-col">
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">Assessments Window</h3>
                    <p className="text-gray-500">Your recent grades and assessment feedback.</p>
                  </div>
                   
                  {assessments.length === 0 ? (
                    <div className="flex-1 border-2 border-dashed border-gray-200 rounded-xl w-full flex flex-col items-center justify-center bg-gray-50/50 py-12">
                      <p className="text-gray-500 font-medium">No assessments found.</p>
                      <p className="text-sm text-gray-400 mt-1">Teachers have not published any grades yet.</p>
                    </div>
                  ) : (
                    <div className="max-w-4xl mx-auto w-full space-y-4">
                      {assessments.map(assessment => {
                        const percentage = Math.round((assessment.student_mark / assessment.maximum_mark) * 100);
                        
                        return (
                          <div key={assessment.id} className="bg-white border border-gray-200 rounded-2xl shadow-sm flex flex-col overflow-hidden transition-all hover:border-blue-200">
                            <div className="p-5 sm:p-6 flex flex-col sm:flex-row gap-6 sm:items-center justify-between">
                              <div className="flex items-start gap-5">
                                {/* Big Grade Circle */}
                                <div className={`w-16 h-16 rounded-full shrink-0 flex flex-col items-center justify-center border-4 ${
                                  percentage >= 80 ? 'border-emerald-100 bg-emerald-50 text-emerald-700' :
                                  percentage >= 50 ? 'border-amber-100 bg-amber-50 text-amber-700' :
                                  'border-rose-100 bg-rose-50 text-rose-700'
                                }`}>
                                  <span className="text-lg font-bold leading-none">{assessment.student_mark}</span>
                                  <span className="text-[10px] font-bold opacity-70 uppercase tracking-widest mt-0.5">/ {assessment.maximum_mark}</span>
                                </div>

                                <div className="flex flex-col justify-center">
                                  <h4 className="font-bold text-gray-900 text-lg">{assessment.group_name}</h4>
                                  <span className="text-sm text-gray-500 font-medium mt-0.5">{formatDate(assessment.created_at)}</span>
                                  {assessment.comment && (
                                    <p className="text-sm text-gray-600 mt-3 pt-3 border-t border-gray-100 italic leading-relaxed">
                                      "{assessment.comment}"
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div className="flex flex-col items-end shrink-0 sm:border-l sm:border-gray-100 sm:pl-6">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Total Percentage</span>
                                <span className={`text-2xl font-black ${
                                  percentage >= 80 ? 'text-emerald-600' :
                                  percentage >= 50 ? 'text-amber-600' :
                                  'text-rose-600'
                                }`}>
                                  {percentage}%
                                </span>
                              </div>
                            </div>

                            {/* Leaderboard Section */}
                            {assessment.leaderboard && assessment.leaderboard.length > 0 && (
                              <div className="bg-gray-50/80 border-t border-gray-100 px-5 sm:px-6 py-5">
                                <h5 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                  Class Rating 
                                  <span className="bg-white border border-gray-200 text-gray-500 py-0.5 px-2 rounded-full text-[10px]">{assessment.leaderboard.length} Students</span>
                                </h5>
                                <div className="flex flex-col gap-2">
                                  {assessment.leaderboard.map((lb, index) => {
                                    const isCurrentStudent = lb.student_id === selectedStudentId;
                                    return (
                                      <div 
                                        key={lb.student_id} 
                                        className={`flex items-center justify-between p-3 rounded-xl text-sm transition-all ${
                                          isCurrentStudent 
                                            ? 'bg-blue-50 border border-blue-200 ring-1 ring-blue-100 shadow-sm' 
                                            : 'bg-white border border-gray-100 shadow-sm hover:border-gray-200'
                                        }`}
                                      >
                                        <div className="flex items-center gap-3">
                                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shadow-sm ${
                                            index === 0 ? 'bg-gradient-to-br from-amber-200 to-amber-400 text-amber-900 border border-amber-300' :
                                            index === 1 ? 'bg-gradient-to-br from-slate-200 to-slate-300 text-slate-800 border border-slate-300' :
                                            index === 2 ? 'bg-gradient-to-br from-orange-200 to-orange-300 text-orange-900 border border-orange-300' :
                                            'bg-gray-100 text-gray-600 border border-gray-200'
                                          }`}>
                                            {index + 1}
                                          </div>
                                          <span className={`font-medium flex items-center flex-wrap gap-2 ${isCurrentStudent ? 'text-blue-900 font-bold' : 'text-gray-700'}`}>
                                            {lb.student_name}
                                            {isCurrentStudent && <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">You</span>}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <span className={`font-bold text-base ${isCurrentStudent ? 'text-blue-700' : 'text-gray-900'}`}>
                                            {lb.mark}
                                          </span>
                                          <span className="text-xs text-gray-400 font-medium">/ {assessment.maximum_mark}</span>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

      </div>
    </div>
  );
}

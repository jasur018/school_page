import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Send, 
  ChevronDown, 
  ChevronUp, 
  Calendar, 
  Users, 
  FileText,
  Plus,
  X,
  MessageSquare
} from 'lucide-react';

interface Assessment {
  id: string;
  created_at: string;
  group_ids: string[];
  comment: string;
  maximum_mark: number;
  results: Record<string, number>;
  group_name?: string;
}

interface Group {
  id: string;
  name: string;
}

interface Student {
  id: string;
  first_name: string;
  last_name: string;
}

export default function AdminAssessments() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showPublishDialog, setShowPublishDialog] = useState(false);

  // Form State
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [comment, setComment] = useState('');
  const [maxMark, setMaxMark] = useState(10);
  const [studentResults, setStudentResults] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [assessmentsRes, groupsRes, studentsRes] = await Promise.all([
        supabase.from('assessments').select('*').order('created_at', { ascending: false }),
        supabase.from('groups').select('id, name'),
        supabase.from('students').select('id, first_name, last_name, attending_groups')
      ]);

      if (assessmentsRes.error) throw assessmentsRes.error;
      if (groupsRes.error) throw groupsRes.error;
      if (studentsRes.error) throw studentsRes.error;

      setAssessments(assessmentsRes.data || []);
      setGroups(groupsRes.data || []);
      setStudents(studentsRes.data || []);
    } catch (err) {
      console.error('Error fetching assessments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroupId) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('assessments')
        .insert([{
          group_ids: [selectedGroupId],
          comment,
          maximum_mark: maxMark,
          results: studentResults
        }]);

      if (error) throw error;

      await fetchData();
      setShowPublishDialog(false);
      resetForm();
    } catch (err) {
      console.error('Error publishing assessment:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedGroupId('');
    setComment('');
    setMaxMark(10);
    setStudentResults({});
  };

  const activeGroupStudents = students.filter(s => 
    (s as any).attending_groups?.includes(selectedGroupId)
  ).sort((a,b) => `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`));

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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600"></div>
        <p className="text-gray-500 font-medium">Loading assessments...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Refined Header Band */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-violet-500" />
            Assessments History
          </h2>
          <p className="text-sm text-gray-500 mt-1">Review student performance and publish new marks</p>
        </div>
        <button 
          onClick={() => setShowPublishDialog(true)}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-violet-600 text-white rounded-xl font-bold text-sm hover:bg-violet-700 transition-all shadow-lg shadow-violet-100 shrink-0"
        >
          <Plus className="w-4 h-4" />
          Publish New Assessment
        </button>
      </div>

      <div className="space-y-4">
        {assessments.length === 0 ? (
          <div className="text-center py-24 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
              <Send className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-lg font-bold text-gray-800">No assessments published yet</h3>
            <p className="text-gray-500 text-sm max-w-sm mx-auto mt-2 leading-relaxed">
              Tracking student progress is essential. Create your first assessment to distribute grades and provide feedback to your groups.
            </p>
            <button 
              onClick={() => setShowPublishDialog(true)}
              className="mt-8 flex items-center gap-2 px-8 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold text-sm hover:border-violet-500 hover:text-violet-600 transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Get Started
            </button>
          </div>
        ) : (
          assessments.map((assessment) => {
            const groupName = groups.find(g => g.id === assessment.group_ids[0])?.name || 'Deleted Group';
            const isExpanded = expandedId === assessment.id;

            return (
              <div 
                key={assessment.id}
                className={`bg-white rounded-2xl border transition-all duration-200 ${
                  isExpanded ? 'border-violet-200 shadow-md' : 'border-gray-200 hover:border-violet-200'
                }`}
              >
                <div 
                  className="p-4 sm:p-5 flex items-center justify-between cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : assessment.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">{groupName}</h4>
                      <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5">
                        <Calendar className="w-3 h-3" /> {formatDate(assessment.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="hidden sm:inline-block text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 px-2 py-0.5 rounded">
                      Max Mark: {assessment.maximum_mark}
                    </span>
                    <div className={`p-2 rounded-lg transition-colors ${isExpanded ? 'bg-violet-50 text-violet-600' : 'text-gray-400'}`}>
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-5 pb-6 pt-2 border-t border-gray-50 bg-gray-50/30 rounded-b-2xl animate-in slide-in-from-top-2">
                    <div className="mb-6 mt-4">
                      <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <MessageSquare className="w-3.5 h-3.5" /> Comment
                      </h5>
                      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm text-sm text-gray-700 leading-relaxed">
                        {assessment.comment || <span className="text-gray-400 italic">No comment provided</span>}
                      </div>
                    </div>

                    <div>
                      <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <Users className="w-3.5 h-3.5" /> Student Results
                      </h5>
                      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50 border-b border-gray-50">
                            <tr>
                              <th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase">Student Name</th>
                              <th className="text-right py-3 px-4 text-xs font-bold text-gray-500 uppercase">Mark</th>
                              <th className="text-right py-3 px-4 text-xs font-bold text-gray-500 uppercase">Percentage</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {Object.entries(assessment.results).map(([studentId, mark]) => {
                              const student = students.find(s => s.id === studentId);
                              const percentage = Math.round((mark / assessment.maximum_mark) * 100);
                              
                              return (
                                <tr key={studentId} className="hover:bg-gray-50/50 transition-colors">
                                  <td className="py-3 px-4 font-medium text-gray-800">
                                    {student ? `${student.first_name} ${student.last_name}` : 'Unknown Student'}
                                  </td>
                                  <td className="py-3 px-4 text-right font-bold text-gray-900">
                                    {mark} <span className="text-gray-400 font-normal">/ {assessment.maximum_mark}</span>
                                  </td>
                                  <td className="py-3 px-4 text-right">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                      percentage >= 80 ? 'bg-emerald-50 text-emerald-600' :
                                      percentage >= 50 ? 'bg-amber-50 text-amber-600' :
                                      'bg-rose-50 text-rose-600'
                                    }`}>
                                      {percentage}%
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Publish Dialog */}
      {showPublishDialog && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setShowPublishDialog(false)}></div>
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95">
            <form onSubmit={handlePublish} className="flex flex-col max-h-[90vh]">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between shrink-0">
                <h3 className="text-xl font-bold text-gray-900">Publish New Assessment</h3>
                <button type="button" onClick={() => setShowPublishDialog(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-400">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Target Group</label>
                    <select 
                      value={selectedGroupId}
                      onChange={(e) => {
                        setSelectedGroupId(e.target.value);
                        setStudentResults({}); // Reset marks when group changes
                      }}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-violet-500"
                      required
                    >
                      <option value="">Select a group...</option>
                      {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Maximum Mark</label>
                    <input 
                      type="number" 
                      value={maxMark}
                      onChange={(e) => setMaxMark(Number(e.target.value))}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-violet-500"
                      min="1"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Commentary (Optional)</label>
                  <textarea 
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Describe the assessment topic, difficulty, or general observations..."
                    rows={3}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                  />
                </div>

                {selectedGroupId && (
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-gray-900 uppercase tracking-widest flex items-center gap-2">
                       Enter Marks <span className="normal-case font-medium text-gray-400">({activeGroupStudents.length} Students)</span>
                    </h4>
                    <div className="bg-gray-50 rounded-2xl border border-gray-100 p-4 space-y-3">
                      {activeGroupStudents.length === 0 ? (
                        <div className="text-center py-4 text-sm text-gray-500 italic">No students enrolled in this group.</div>
                      ) : (
                        activeGroupStudents.map(student => (
                          <div key={student.id} className="flex items-center justify-between gap-4 bg-white p-3 rounded-xl border border-gray-100 whitespace-nowrap">
                            <span className="text-sm font-semibold text-gray-700 truncate">{student.first_name} {student.last_name}</span>
                            <div className="flex items-center gap-3">
                              <input 
                                type="number"
                                min="0"
                                max={maxMark}
                                step="0.5"
                                value={studentResults[student.id] || ''}
                                onChange={(e) => setStudentResults({
                                  ...studentResults,
                                  [student.id]: Number(e.target.value)
                                })}
                                placeholder="0"
                                className="w-20 px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-lg text-sm text-right focus:ring-2 focus:ring-violet-500 outline-none"
                              />
                              <span className="text-xs font-bold text-gray-400">/ {maxMark}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-gray-100 shrink-0">
                <button 
                  type="submit"
                  disabled={isSubmitting || !selectedGroupId}
                  className="w-full py-4 bg-violet-600 text-white rounded-2xl font-bold text-base hover:bg-violet-700 transition-all shadow-xl shadow-violet-100 disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
                >
                  {isSubmitting ? 'Publishing...' : <><Send className="w-5 h-5" /> Publish Results</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

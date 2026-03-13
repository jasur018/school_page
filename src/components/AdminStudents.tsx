import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
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
  const [students, setStudents] = useState<Student[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showStatusDialog, setShowStatusDialog] = useState<{ id: string, targetStatus: 'studying' | 'left_school' } | null>(null);
  const [showNewStudentDialog, setShowNewStudentDialog] = useState(false);
  
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
    if (!date) return 'Not set';
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
        <p className="text-gray-500 font-medium">Loading student records...</p>
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
            Active Students
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
            Archive
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search students..."
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
          Add New Student
        </button>
      </div>

      {/* Students List */}
      <div className="space-y-4">
        {filteredStudents.length === 0 ? (
          <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white shadow-sm text-gray-400 mb-4">
              <Users className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-gray-800">No students found</h3>
            <p className="text-gray-500 text-sm">Start by adding new students to the system.</p>
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
                        Grade {student.grade || 'N/A'}
                      </span>
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        {student.attending_groups.length > 0 ? (
                          student.attending_groups.slice(0, 2).map(gid => (
                            <span key={gid} className="text-[10px] text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded-md truncate max-w-[100px]">
                              {getGroupName(gid)}
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] text-gray-400 italic">No groups</span>
                        )}
                        {student.attending_groups.length > 2 && (
                          <span className="text-[10px] text-gray-400">+{student.attending_groups.length - 2} more</span>
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
                      {student.status === 'studying' ? 'Studying' : 'Left School'}
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
                        <User className="w-3.5 h-3.5" /> Personal Details
                      </h5>
                      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-3">
                        <DetailItem label="Date of Birth" value={formatDate(student.date_of_birth)} />
                        <DetailItem label="Join Date" value={formatDate(student.join_date)} />
                        <DetailItem label="Address" value={student.address || 'No address provided'} />
                      </div>
                    </div>

                    {/* Guardian Info */}
                    <div className="space-y-4">
                      <h5 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <User className="w-3.5 h-3.5" /> Guardian & Contacts
                      </h5>
                      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-3">
                        <DetailItem label="Guardian Name" value={student.guardian_full_name || 'N/A'} />
                        <div className="flex items-center justify-between">
                           <span className="text-[10px] font-medium text-gray-400">Phone</span>
                           <a href={`tel:${student.guardian_phone}`} className="text-xs font-semibold text-blue-600 hover:underline">{student.guardian_phone || 'N/A'}</a>
                        </div>
                        <DetailItem label="Linked Account" value={student.profile_id ? 'Connected' : 'Unlinked'} />
                      </div>
                    </div>

                    {/* Academic Performance (Placeholder) */}
                    <div className="space-y-4">
                      <h5 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <Star className="w-3.5 h-3.5" /> Latest Performance
                      </h5>
                      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-3">
                        <div className="flex items-center justify-between py-1 border-b border-gray-50">
                          <span className="text-xs text-gray-600">Overall Average</span>
                          <span className="text-sm font-bold text-gray-900">8.4 / 10</span>
                        </div>
                        <div className="space-y-2 pt-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-gray-500 italic">Progress Tracking...</span>
                            <span className="text-emerald-500 font-bold">+0.2</span>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full w-[84%]"></div>
                          </div>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-2">Historical marks assessment data will be displayed here once connected.</p>
                      </div>
                    </div>
                  </div>

                  {/* Action Menu */}
                  <div className="mt-6 pt-6 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <History className="w-4 h-4" />
                      Last updated: {formatDate(student.created_at)}
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      {student.status === 'studying' ? (
                        <button 
                          onClick={() => setShowStatusDialog({ id: student.id, targetStatus: 'left_school' })}
                          className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-orange-50 text-orange-700 font-bold text-sm hover:bg-orange-100 transition-colors"
                        >
                          <Archive className="w-4 h-4" />
                          Mark as Left
                        </button>
                      ) : (
                        <button 
                          onClick={() => setShowStatusDialog({ id: student.id, targetStatus: 'studying' })}
                          className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-50 text-emerald-700 font-bold text-sm hover:bg-emerald-100 transition-colors"
                        >
                          <RefreshCw className="w-4 h-4" />
                          Recover to Studying
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
                {showStatusDialog.targetStatus === 'left_school' ? 'Mark as Left School?' : 'Recover Student?'}
              </h3>
              <p className="text-center text-gray-500 text-sm leading-relaxed mb-8">
                {showStatusDialog.targetStatus === 'left_school' 
                  ? "This will move the student to the archive. Their data will remain saved, but they will no longer appear in active group lists. Are you sure?"
                  : "This will restore the student to active status. They will be visible in group lists and assessments again."}
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button 
                  onClick={() => setShowStatusDialog(null)}
                  className="order-2 sm:order-1 flex-1 py-3 text-sm font-bold text-gray-500 hover:bg-gray-50 rounded-2xl transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleStatusChange}
                  className="order-1 sm:order-2 flex-1 py-3 text-sm font-bold bg-gray-900 text-white hover:bg-gray-800 rounded-2xl transition-all shadow-lg shadow-gray-200"
                >
                  Yes, Confirm
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
        />
      )}
    </div>
  );
}

function NewStudentDialog({ 
  onClose, 
  onSubmit, 
  data, 
  setData 
}: { 
  onClose: () => void, 
  onSubmit: (e: React.FormEvent) => void,
  data: any,
  setData: (val: any) => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <form onSubmit={onSubmit} className="p-6 sm:p-8 overflow-y-auto max-h-[90vh]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-900">Register New Student</h3>
            <button type="button" onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-400"><X className="w-5 h-5" /></button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">First Name</label>
              <input type="text" value={data.first_name} onChange={(e) => setData({...data, first_name: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" required />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Last Name</label>
              <input type="text" value={data.last_name} onChange={(e) => setData({...data, last_name: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" required />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Date of Birth</label>
              <input type="date" value={data.date_of_birth} onChange={(e) => setData({...data, date_of_birth: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Grade</label>
              <select value={data.grade} onChange={(e) => setData({...data, grade: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500">
                <option value="9">Grade 9</option>
                <option value="10">Grade 10</option>
                <option value="11">Grade 11</option>
                <option value="12">Grade 12</option>
              </select>
            </div>
            <div className="sm:col-span-2 border-t border-gray-50 pt-3">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Guardian Full Name</label>
              <input type="text" value={data.guardian_full_name} onChange={(e) => setData({...data, guardian_full_name: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Guardian Phone</label>
              <input type="tel" value={data.guardian_phone} onChange={(e) => setData({...data, guardian_phone: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Address</label>
              <textarea rows={2} value={data.address} onChange={(e) => setData({...data, address: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>
          </div>

          <div className="mt-8 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-3 text-sm font-bold text-gray-500 hover:bg-gray-50 rounded-2xl transition-colors">Cancel</button>
            <button type="submit" className="flex-1 py-3 text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 rounded-2xl transition-all shadow-lg shadow-blue-100">Register Student</button>
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

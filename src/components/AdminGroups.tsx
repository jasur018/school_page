import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Users, 
  ChevronDown, 
  ChevronUp, 
  Plus, 
  GraduationCap,
  Briefcase,
  Search,
  Trash2
} from 'lucide-react';

interface Group {
  id: string;
  name: string;
  responsible_teachers: string[];
  opening_date: string | null;
}

interface Teacher {
  id: string;
  full_name: string;
}

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  attending_groups: string[];
  status: string;
}

export default function AdminGroups() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showNewGroupDialog, setShowNewGroupDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    type: 'add_student' | 'remove_student' | 'add_teacher' | 'remove_teacher';
    groupId: string;
    memberId: string;
    memberName: string;
    groupName: string;
  } | null>(null);
  
  // Search states for enrollment
  const [studentSearch, setStudentSearch] = useState('');
  
  // Form States
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDate, setNewGroupDate] = useState('');
  
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: groupsData, error: groupsError } = await supabase.from('groups').select('*');
      const { data: teachersData, error: teachersError } = await supabase.from('teachers').select('id, full_name');
      const { data: studentsData, error: studentsError } = await supabase.from('students').select('id, first_name, last_name, attending_groups, status');

      if (groupsError) throw groupsError;
      if (teachersError) throw teachersError;
      if (studentsError) throw studentsError;

      setGroups(groupsData || []);
      setTeachers(teachersData || []);
      setStudents(studentsData || []);
    } catch (err) {
      console.error('Error fetching group data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    try {
      const { data, error } = await supabase
        .from('groups')
        .insert([{ 
          name: newGroupName, 
          opening_date: newGroupDate || null,
          responsible_teachers: [] 
        }])
        .select();

      if (error) throw error;
      if (data) {
        setGroups([...groups, data[0]]);
        setShowNewGroupDialog(false);
        setNewGroupName('');
        setNewGroupDate('');
      }
    } catch (err) {
      console.error('Error creating group:', err);
    }
  };

  const executeToggle = async () => {
    if (!confirmAction) return;
    const { type, groupId, memberId } = confirmAction;

    try {
      if (type === 'add_student' || type === 'remove_student') {
        const isAdding = type === 'add_student';
        const student = students.find(s => s.id === memberId);
        if (!student) return;

        const newGroups = isAdding 
          ? [...(student.attending_groups || []), groupId]
          : (student.attending_groups || []).filter(id => id !== groupId);

        const { error } = await supabase
          .from('students')
          .update({ attending_groups: newGroups })
          .eq('id', memberId);

        if (error) throw error;

        setStudents(prev => prev.map(s => 
          s.id === memberId ? { ...s, attending_groups: newGroups } : s
        ));
      } else {
        const isAdding = type === 'add_teacher';
        const group = groups.find(g => g.id === groupId);
        if (!group) return;

        const newTeachers = isAdding
          ? [...(group.responsible_teachers || []), memberId]
          : (group.responsible_teachers || []).filter(id => id !== memberId);

        const { error } = await supabase
          .from('groups')
          .update({ responsible_teachers: newTeachers })
          .eq('id', groupId);

        if (error) throw error;

        setGroups(prev => prev.map(g => 
          g.id === groupId ? { ...g, responsible_teachers: newTeachers } : g
        ));
      }
      setConfirmAction(null);
    } catch (err) {
      console.error('Error executing group modification:', err);
    }
  };

  const getStudentCount = (groupId: string) => {
    return students.filter(s => s.attending_groups?.includes(groupId)).length;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="text-gray-500 font-medium">Loading group management...</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <GraduationCap className="w-6 h-6 text-blue-600" />
          School Groups
        </h2>
        <button 
          onClick={() => setShowNewGroupDialog(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
        >
          <Plus className="w-4 h-4" />
          New Group
        </button>
      </div>

      {/* Groups List */}
      <div className="grid grid-cols-1 gap-4">
        {groups.length === 0 ? (
          <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
             <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
             <p className="text-gray-500 font-medium">No groups created yet.</p>
          </div>
        ) : (
          groups.map(group => (
            <div 
              key={group.id} 
              className={`bg-white rounded-2xl border transition-all ${
                expandedId === group.id ? 'border-blue-200 shadow-md ring-1 ring-blue-50' : 'border-gray-200 hover:border-blue-100'
              }`}
            >
              <div 
                className="p-5 flex items-center justify-between cursor-pointer"
                onClick={() => setExpandedId(expandedId === group.id ? null : group.id)}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="shrink-0 w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Users className="w-6 h-6" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-gray-900 truncate">{group.name}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" /> {getStudentCount(group.id)} Students
                      </span>
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Briefcase className="w-3.5 h-3.5" /> {group.responsible_teachers?.length || 0} Teachers
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="hidden sm:flex flex-wrap gap-1 mr-4">
                    {group.responsible_teachers?.slice(0, 2).map(tid => (
                      <span key={tid} className="px-2 py-0.5 bg-gray-100 text-[10px] font-bold text-gray-600 rounded">
                        {teachers.find(t => t.id === tid)?.full_name || 'Teacher'}
                      </span>
                    ))}
                    {group.responsible_teachers?.length > 2 && (
                      <span className="px-2 py-0.5 bg-gray-100 text-[10px] font-bold text-gray-400 rounded">
                        +{group.responsible_teachers.length - 2}
                      </span>
                    )}
                  </div>
                  <div className="p-2 text-gray-400">
                    {expandedId === group.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                </div>
              </div>

              {expandedId === group.id && (
                <div className="px-5 pb-6 pt-2 border-t border-gray-50 bg-gray-50/20 rounded-b-2xl animate-in slide-in-from-top-1">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    
                    {/* Teachers Section */}
                    <div className="space-y-4">
                      <div className="bg-white rounded-xl border border-gray-100 p-2">
                        <div className="flex items-center justify-between px-2 py-2 border-b border-gray-50 mb-2">
                          <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            <Briefcase className="w-3.5 h-3.5" /> Teachers
                          </h4>
                          <select 
                            onChange={(e) => {
                              if (!e.target.value) return;
                              const t = teachers.find(t => t.id === e.target.value);
                              setConfirmAction({
                                type: 'add_teacher',
                                groupId: group.id,
                                memberId: e.target.value,
                                memberName: t?.full_name || 'Teacher',
                                groupName: group.name
                              });
                              e.target.value = "";
                            }}
                            className="text-[11px] font-bold text-blue-600 bg-blue-50 border-none rounded-lg px-2 py-1 outline-none cursor-pointer"
                            value=""
                          >
                            <option value="">+ Assign</option>
                            {teachers
                              .filter(t => !group.responsible_teachers?.includes(t.id))
                              .sort((a, b) => a.full_name.localeCompare(b.full_name))
                              .map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)
                            }
                          </select>
                        </div>
                        <div className="space-y-1 px-1">
                          {group.responsible_teachers
                            ?.map(tid => teachers.find(t => t.id === tid))
                            .filter((t): t is Teacher => !!t)
                            .sort((a, b) => a.full_name.localeCompare(b.full_name))
                            .map(t => (
                              <div key={t.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors group/teacher">
                                <span className="text-sm font-medium text-gray-700">
                                  {t.full_name}
                                </span>
                                <button 
                                  onClick={() => setConfirmAction({
                                    type: 'remove_teacher',
                                    groupId: group.id,
                                    memberId: t.id,
                                    memberName: t.full_name,
                                    groupName: group.name
                                  })}
                                  className="p-1 opacity-0 group-hover/teacher:opacity-100 text-gray-300 hover:text-red-500 transition-all"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>

                    {/* Students Section */}
                    <div className="space-y-4">
                      <div className="bg-white rounded-xl border border-gray-100 p-2">
                        <div className="flex flex-col gap-2 px-2 py-2 border-b border-gray-50 mb-2">
                          <div className="flex items-center justify-between">
                            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                              <Users className="w-3.5 h-3.5" /> Students
                            </h4>
                            <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
                              {getStudentCount(group.id)} Total
                            </span>
                          </div>
                          
                          {/* Search & Enroll Band */}
                          <div className="flex gap-2">
                            <div className="relative flex-1">
                              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
                              <input 
                                type="text"
                                placeholder="Find student..."
                                onChange={(e) => setStudentSearch(e.target.value)}
                                className="w-full pl-7 pr-3 py-1.5 text-[11px] bg-gray-50 border-none rounded-lg outline-none focus:ring-1 focus:ring-blue-100"
                              />
                            </div>
                            <select 
                              onChange={(e) => {
                                if (!e.target.value) return;
                                const s = students.find(s => s.id === e.target.value);
                                setConfirmAction({
                                  type: 'add_student',
                                  groupId: group.id,
                                  memberId: e.target.value,
                                  memberName: `${s?.first_name} ${s?.last_name}`,
                                  groupName: group.name
                                });
                                e.target.value = "";
                              }}
                              className="text-[11px] font-bold text-blue-600 bg-blue-50 border-none rounded-lg px-2 py-1 outline-none cursor-pointer"
                              value=""
                            >
                              <option value="">+ Enroll</option>
                              {students
                                .filter(s => !s.attending_groups?.includes(group.id) && s.status !== 'left_school')
                                .filter(s => `${s.first_name} ${s.last_name}`.toLowerCase().includes(studentSearch.toLowerCase()))
                                .sort((a, b) => `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`))
                                .map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)
                              }
                            </select>
                          </div>
                        </div>

                        <div className="space-y-1 px-1 max-h-48 overflow-y-auto">
                          {students
                            .filter(s => s.attending_groups?.includes(group.id))
                            .sort((a, b) => `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`))
                            .map(s => (
                              <div key={s.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors group/student">
                                <span className="text-sm font-medium text-gray-700">
                                  {s.first_name} {s.last_name}
                                </span>
                                <button 
                                  onClick={() => setConfirmAction({
                                    type: 'remove_student',
                                    groupId: group.id,
                                    memberId: s.id,
                                    memberName: `${s.first_name} ${s.last_name}`,
                                    groupName: group.name
                                  })}
                                  className="p-1 opacity-0 group-hover/student:opacity-100 text-gray-300 hover:text-red-500 transition-all"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))
                          }
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* New Group Dialog */}
      {showNewGroupDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setShowNewGroupDialog(false)}></div>
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <form onSubmit={handleCreateGroup} className="p-6 sm:p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Create New Group</h3>
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Group Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Senior Class A" 
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Opening Date</label>
                  <div className="relative">
                    <input 
                      type="date" 
                      value={newGroupDate}
                      onChange={(e) => setNewGroupDate(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>
              <div className="mt-8 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setShowNewGroupDialog(false)}
                  className="flex-1 py-3 text-sm font-bold text-gray-500 hover:bg-gray-50 rounded-2xl transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 rounded-2xl transition-all shadow-lg shadow-blue-100"
                >
                  Create Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {confirmAction && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setConfirmAction(null)}></div>
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                confirmAction.type.includes('remove') ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
              }`}>
                {confirmAction.type.includes('student') ? <Users className="w-8 h-8" /> : <Briefcase className="w-8 h-8" />}
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                {confirmAction.type.startsWith('add') ? 'Confirm Addition' : 'Confirm Removal'}
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed mb-8">
                Are you sure you want to {confirmAction.type.startsWith('add') ? 'add' : 'remove'}{' '}
                <span className="font-bold text-gray-800">{confirmAction.memberName}</span>{' '}
                {confirmAction.type.startsWith('add') ? 'to' : 'from'}{' '}
                <span className="font-bold text-gray-800">{confirmAction.groupName}</span>?
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setConfirmAction(null)}
                  className="flex-1 py-3 text-sm font-bold text-gray-500 hover:bg-gray-50 rounded-2xl transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={executeToggle}
                  className={`flex-1 py-3 text-sm font-bold text-white rounded-2xl transition-all shadow-lg ${
                    confirmAction.type.includes('remove') 
                      ? 'bg-red-600 hover:bg-red-700 shadow-red-100' 
                      : 'bg-blue-600 hover:bg-blue-700 shadow-blue-100'
                  }`}
                >
                   {confirmAction.type.startsWith('add') ? 'Enroll' : 'Remove'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Shield, Users, Mail, Lock, Plus, Search, Check, AlertCircle } from 'lucide-react';

interface AccountFormData {
  fullName: string;
  username: string;
  password: string;
  confirmPassword: string;
  connectedPeople: string[];
}

export default function AdminManageAccounts() {
  const [activeTab, setActiveTab] = useState<'admins' | 'parents'>('parents');
  
  // Data State
  const [teachers, setTeachers] = useState<{ id: string, full_name: string, assigned: boolean }[]>([]);
  const [students, setStudents] = useState<{ id: string, first_name: string, last_name: string, profile_id: string | null }[]>([]);
  const [accounts, setAccounts] = useState<{ id: string, full_name: string, role: string, email: string, connected_people: string[] }[]>([]);
  
  // Form State
  const [formData, setFormData] = useState<AccountFormData>({
    fullName: '',
    username: '',
    password: '',
    confirmPassword: '',
    connectedPeople: []
  });
  
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    // Fetch all accounts
    const { data: accountsData } = await supabase.rpc('get_all_accounts');
    setAccounts(accountsData || []);

    if (activeTab === 'admins') {
      // Find teachers who are not connected to any admin profile yet
      // For now we just fetch all teachers and ideally filter on ones without a profile connection
      const { data } = await supabase.from('teachers').select('id, full_name');
      setTeachers((data || []).map(t => ({ ...t, assigned: false })));
    } else {
      // Find students who do not have a profile_id assigned AND are currently 'studying'
      const { data } = await supabase.from('students')
        .select('id, first_name, last_name, profile_id')
        .is('profile_id', null)
        .eq('status', 'studying');
      setStudents(data || []);
    }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      if (formData.password !== formData.confirmPassword) {
        throw new Error("Passwords do not match.");
      }

      // 1. Determine the email
      let email = formData.username.trim();
      if (!email.includes('@')) {
        // Sanitize username by removing spaces and making lowercase
        const cleanUsername = email.toLowerCase().replace(/[^a-z0-9._-]/g, '');
        email = `${cleanUsername}@school.local.com`;
      }

      // 2. We use Supabase Auth admin API or a separate client instance if needed.
      // Since this is the frontend and `persistSession` is tricky without reloading, 
      // we'll attempt standard signUp. Note: Supabase's standard signUp will log the user in
      // if email confirmations are disabled, which might log the admin out.
      // To prevent this without a backend, we can use a fresh Supabase client instance memory-only.
      
      const { createClient } = await import('@supabase/supabase-js');
      const memorySupabase = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_ANON_KEY,
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false
          }
        }
      );

      const role = activeTab === 'admins' ? 'admin' : 'student';

      const { data: authData, error: authError } = await memorySupabase.auth.signUp({
        email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            role: role,
            connected_people: JSON.stringify(formData.connectedPeople)
          }
        }
      });

      if (authError) throw authError;

      const userId = authData.user?.id;
      if (!userId) throw new Error("Could not retrieve user ID after creation.");

      // 4. If creating a Parent (student role), update students to link them
      if (activeTab === 'parents' && formData.connectedPeople.length > 0) {
        await supabase
          .from('students')
          .update({ profile_id: userId })
          .in('id', formData.connectedPeople);
      }

      setMessage({ type: 'success', text: `${role === 'admin' ? 'Admin' : 'Parent'} account created successfully!` });
      
      // Reset form
      setFormData({
        fullName: '',
        username: '',
        password: '',
        confirmPassword: '',
        connectedPeople: []
      });
      fetchData(); // Refresh available connections

    } catch (err: unknown) {
      console.error(err);
      if (err instanceof Error) {
        setMessage({ type: 'error', text: err.message || 'Error creating account.' });
      } else {
        setMessage({ type: 'error', text: 'Error creating account.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleConnection = (id: string) => {
    setFormData(prev => {
      const isSelected = prev.connectedPeople.includes(id);
      if (activeTab === 'admins') {
        // Single select for admins
        return { ...prev, connectedPeople: isSelected ? [] : [id] };
      } else {
        // Multi select for parents
        return {
          ...prev,
          connectedPeople: isSelected
            ? prev.connectedPeople.filter(pId => pId !== id)
            : [...prev.connectedPeople, id]
        };
      }
    });
  };

  const filteredStudents = students.filter(s => 
    `${s.first_name} ${s.last_name}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredTeachers = teachers.filter(t => 
    t.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full space-y-6">
      {/* Header and Tabs */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Shield className="w-6 h-6 text-indigo-600" />
          Manage Accounts
        </h2>
        
        <div className="flex bg-gray-100 p-1 rounded-xl w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('parents')}
            className={`flex-1 sm:flex-none px-6 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
              activeTab === 'parents' 
                ? 'bg-white text-indigo-700 shadow-sm border border-gray-100' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Users className="w-4 h-4" />
            Parents
          </button>
          <button
            onClick={() => setActiveTab('admins')}
            className={`flex-1 sm:flex-none px-6 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
              activeTab === 'admins' 
                ? 'bg-white text-indigo-700 shadow-sm border border-gray-100' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Shield className="w-4 h-4" />
            Admins
          </button>
        </div>
      </div>

      {message.text && (
        <div className={`p-4 rounded-xl flex items-center gap-3 ${message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
          <AlertCircle className="w-5 h-5" />
          <span className="text-sm font-semibold">{message.text}</span>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-6 border-b border-gray-100 pb-4">
          Create New {activeTab === 'admins' ? 'Admin' : 'Parent'} Account
        </h3>

        <form onSubmit={handleCreateAccount} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form Fields */}
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Full Name</label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input 
                  type="text" 
                  required
                  value={formData.fullName}
                  onChange={e => setFormData({...formData, fullName: e.target.value})}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Username or Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input 
                  type="text" 
                  required
                  value={formData.username}
                  onChange={e => setFormData({...formData, username: e.target.value})}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  placeholder="username or email@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input 
                  type="password"
                  required 
                  minLength={6}
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input 
                  type="password"
                  required 
                  minLength={6}
                  value={formData.confirmPassword}
                  onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>
            
            <button 
              type="submit" 
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-70 disabled:cursor-not-allowed mt-4"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  Create Account
                </>
              )}
            </button>
          </div>

          {/* Connected People Selection */}
          <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 h-[400px] flex flex-col">
            <h4 className="text-sm font-bold text-gray-800 mb-3">
              {activeTab === 'admins' ? 'Connect Teacher Profile (Max 1)' : 'Connect Children Profiles'}
            </h4>
            
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all py-2"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-2">
              {activeTab === 'admins' ? (
                filteredTeachers.length === 0 ? (
                  <p className="text-gray-500 text-xs text-center mt-10">No teachers found.</p>
                ) : (
                  filteredTeachers.map(teacher => (
                    <div 
                      key={teacher.id} 
                      onClick={() => toggleConnection(teacher.id)}
                      className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        formData.connectedPeople.includes(teacher.id) 
                          ? 'bg-indigo-50 border-indigo-200' 
                          : 'bg-white border-gray-200 hover:border-indigo-100'
                      }`}
                    >
                      <span className="text-sm font-medium text-gray-800">{teacher.full_name}</span>
                      {formData.connectedPeople.includes(teacher.id) && (
                        <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-white">
                          <Check className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                  ))
                )
              ) : (
                filteredStudents.length === 0 ? (
                  <p className="text-gray-500 text-xs text-center mt-10">No unlinked students found.</p>
                ) : (
                  filteredStudents.map(student => (
                    <div 
                      key={student.id} 
                      onClick={() => toggleConnection(student.id)}
                      className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        formData.connectedPeople.includes(student.id) 
                          ? 'bg-indigo-50 border-indigo-200' 
                          : 'bg-white border-gray-200 hover:border-indigo-100'
                      }`}
                    >
                      <span className="text-sm font-medium text-gray-800">{student.first_name} {student.last_name}</span>
                      {formData.connectedPeople.includes(student.id) ? (
                        <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-white">
                          <Check className="w-3 h-3" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded border-2 border-gray-200" />
                      )}
                    </div>
                  ))
                )
              )}
            </div>
          </div>
        </form>
      </div>

      {/* Account List */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-6 border-b border-gray-100 pb-4">
          All Accounts List
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left bg-gray-50/50">
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider rounded-l-lg">Full Name</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Username</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider rounded-r-lg">Connections Count</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {accounts.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-500 text-sm">
                    No accounts found or you do not have permission to view them.
                  </td>
                </tr>
              ) : (
                accounts.map(acc => (
                  <tr key={acc.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-4 text-sm font-medium text-gray-900">
                      {acc.full_name || 'N/A'}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600">
                      {acc.email ? acc.email.replace('@school.local.com', '') : 'N/A'}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize ${
                        acc.role === 'admin' 
                          ? 'bg-indigo-50 text-indigo-700' 
                          : 'bg-emerald-50 text-emerald-700'
                      }`}>
                        {acc.role}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600 font-medium">
                      {(acc.connected_people || []).length}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

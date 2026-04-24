import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../context/LanguageContext';
import {
  Plus,
  Trash2,
  Calendar,
  Megaphone,
  Clock,
  Tag,
  Image as ImageIcon,
  AlertCircle,
  Loader2,
  X,
  PlusCircle
} from 'lucide-react';

type AnnouncementType = 'admission' | 'discount' | 'generic';

interface Announcement {
  id: string;
  created_at: string;
  type: AnnouncementType;
  title: string;
  content: any;
  image_url: string | null;
  expires_at: string;
}

export default function AdminAnnouncements() {
  const { t } = useLanguage();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);

  // Form State
  const [type, setType] = useState<AnnouncementType>('admission');
  const [title, setTitle] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  // Constructor specific states
  const [groups, setGroups] = useState<{ name: string; time: string }[]>([{ name: '', time: '' }]);
  const [discounts, setDiscounts] = useState<{ course: string; amount: string }[]>([{ course: '', amount: '' }]);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setAnnouncements(data || []);
    } catch (err) {
      console.error('Error fetching announcements:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddGroup = () => setGroups([...groups, { name: '', time: '' }]);
  const handleRemoveGroup = (index: number) => setGroups(groups.filter((_, i) => i !== index));
  const updateGroup = (index: number, field: 'name' | 'time', value: string) => {
    const newGroups = [...groups];
    newGroups[index][field] = value;
    setGroups(newGroups);
  };

  const handleAddDiscount = () => setDiscounts([...discounts, { course: '', amount: '' }]);
  const handleRemoveDiscount = (index: number) => setDiscounts(discounts.filter((_, i) => i !== index));
  const updateDiscount = (index: number, field: 'course' | 'amount', value: string) => {
    const newDiscounts = [...discounts];
    newDiscounts[index][field] = value;
    setDiscounts(newDiscounts);
  };

  const handlePublish = async () => {
    if (!title || !expiresAt) {
      setError('Title and removal date are required');
      return;
    }

    if (announcements.length >= 7) {
      setError(t('ann_limitReached') as string);
      return;
    }

    try {
      setPublishing(true);
      setError(null);

      let content = {};
      if (type === 'admission') {
        content = { groups: groups.filter(g => g.name && g.time) };
      } else if (type === 'discount') {
        content = { discounts: discounts.filter(d => d.course && d.amount) };
      }

      const { error: insertError } = await supabase
        .from('announcements')
        .insert([{
          type,
          title,
          content,
          image_url: type === 'generic' ? imageUrl : null,
          expires_at: new Date(expiresAt).toISOString()
        }]);

      if (insertError) throw insertError;

      // Reset form and refresh
      setShowNewForm(false);
      setTitle('');
      setExpiresAt('');
      setImageUrl('');
      setGroups([{ name: '', time: '' }]);
      setDiscounts([{ course: '', amount: '' }]);
      fetchAnnouncements();
    } catch (err: any) {
      setError(err.message || 'Error publishing announcement');
    } finally {
      setPublishing(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('ann_deleteConfirm') as string)) return;

    try {
      const { error: deleteError } = await supabase
        .from('announcements')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      fetchAnnouncements();
    } catch (err) {
      console.error('Error deleting announcement:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{t('ann_title')}</h2>
          <p className="text-sm text-gray-500">{t('ann_subtitle')}</p>
        </div>
        {!showNewForm && (
          <button
            onClick={() => setShowNewForm(true)}
            disabled={announcements.length >= 7}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-semibold transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-5 h-5" />
            {t('ann_publishNew')}
          </button>
        )}
      </div>

      {announcements.length >= 7 && !showNewForm && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800 font-medium">{t('ann_limitReached')}</p>
        </div>
      )}

      {showNewForm ? (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-blue-600" />
              {t('ann_publishNew')}
            </h3>
            <button
              onClick={() => setShowNewForm(false)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Type Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(['admission', 'discount', 'generic'] as AnnouncementType[]).map((tType) => (
                <button
                  key={tType}
                  onClick={() => setType(tType)}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all font-medium text-sm
                    ${type === tType
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200'
                    }
                  `}
                >
                  {tType === 'admission' && <Clock className="w-4 h-4" />}
                  {tType === 'discount' && <Tag className="w-4 h-4" />}
                  {tType === 'generic' && <ImageIcon className="w-4 h-4" />}
                  {tType === 'admission' ? t('ann_typeAdmission') : 
                   tType === 'discount' ? t('ann_typeDiscount') : 
                   t('ann_typeGeneric')}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">{t('ann_formTitle')}</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t('ann_formTitlePlaceholder') as string}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">{t('ann_removalDate')}</label>
                <input
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
              </div>
            </div>

            {/* Constructor Rendering */}
            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
              {type === 'admission' && (
                <div className="space-y-4">
                  <label className="text-sm font-bold text-gray-900 uppercase tracking-wider">{t('ann_groupsOpening')}</label>
                  {groups.map((group, index) => (
                    <div key={index} className="flex flex-col sm:flex-row gap-3 animate-in fade-in duration-200">
                      <input
                        type="text"
                        placeholder={t('ann_groupName') as string}
                        value={group.name}
                        onChange={(e) => updateGroup(index, 'name', e.target.value)}
                        className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-blue-500"
                      />
                      <input
                        type="text"
                        placeholder={t('ann_groupTime') as string}
                        value={group.time}
                        onChange={(e) => updateGroup(index, 'time', e.target.value)}
                        className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-blue-500"
                      />
                      {groups.length > 1 && (
                        <button
                          onClick={() => handleRemoveGroup(index)}
                          className="p-2.5 text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={handleAddGroup}
                    className="flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700 transition-all"
                  >
                    <PlusCircle className="w-4 h-4" />
                    {t('ann_addMore')}
                  </button>
                </div>
              )}

              {type === 'discount' && (
                <div className="space-y-4">
                  <label className="text-sm font-bold text-gray-900 uppercase tracking-wider">{t('ann_discountCourses')}</label>
                  {discounts.map((discount, index) => (
                    <div key={index} className="flex flex-col sm:flex-row gap-3 animate-in fade-in duration-200">
                      <input
                        type="text"
                        placeholder={t('ann_courseName') as string}
                        value={discount.course}
                        onChange={(e) => updateDiscount(index, 'course', e.target.value)}
                        className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-blue-500"
                      />
                      <input
                        type="text"
                        placeholder={t('ann_discountAmount') as string}
                        value={discount.amount}
                        onChange={(e) => updateDiscount(index, 'amount', e.target.value)}
                        className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-blue-500"
                      />
                      {discounts.length > 1 && (
                        <button
                          onClick={() => handleRemoveDiscount(index)}
                          className="p-2.5 text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={handleAddDiscount}
                    className="flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700 transition-all"
                  >
                    <PlusCircle className="w-4 h-4" />
                    {t('ann_addMore')}
                  </button>
                </div>
              )}

              {type === 'generic' && (
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-900 uppercase tracking-wider">{t('ann_imageUrl')}</label>
                  <div className="relative">
                    <ImageIcon className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder={t('ann_imageUrlPlaceholder') as string}
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-blue-500"
                    />
                  </div>
                  {imageUrl && (
                    <div className="mt-4 aspect-video rounded-xl overflow-hidden border border-gray-200 bg-white">
                      <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" onError={() => setError('Invalid image URL')} />
                    </div>
                  )}
                </div>
              )}
            </div>

            {error && (
              <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-3 text-rose-700 text-sm font-medium animate-shake">
                <AlertCircle className="w-5 h-5 shrink-0" />
                {error}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                onClick={() => setShowNewForm(false)}
                className="px-6 py-2.5 rounded-xl font-bold text-gray-600 hover:bg-gray-50 transition-all"
              >
                {t('std_cancel')}
              </button>
              <button
                onClick={handlePublish}
                disabled={publishing}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-xl font-bold transition-all shadow-md shadow-blue-200 disabled:opacity-50"
              >
                {publishing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {t('ann_publishing')}
                  </>
                ) : (
                  <>
                    <Megaphone className="w-5 h-5" />
                    {t('ann_publishBtn')}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
              <p className="text-gray-500 font-medium">Fetching announcements...</p>
            </div>
          ) : announcements.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-gray-200 rounded-3xl p-12 text-center flex flex-col items-center gap-4">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center">
                <Megaphone className="w-10 h-10 text-gray-300" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">{t('ann_noAnnouncements')}</h3>
                <p className="text-sm text-gray-500 max-w-sm mx-auto mt-1">Publish news, admission updates, or special discounts to your school community.</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {announcements.map((ann) => (
                <div
                  key={ann.id}
                  className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 shadow-sm hover:shadow-md hover:border-blue-100 transition-all group flex flex-col sm:flex-row sm:items-center justify-between gap-6"
                >
                  <div className="flex items-start gap-5">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm
                      ${ann.type === 'admission' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' :
                        ann.type === 'discount' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                          'bg-blue-50 text-blue-600 border border-blue-100'}
                    `}>
                      {ann.type === 'admission' && <Clock className="w-6 h-6" />}
                      {ann.type === 'discount' && <Tag className="w-6 h-6" />}
                      {ann.type === 'generic' && <ImageIcon className="w-6 h-6" />}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-gray-900 text-lg">{ann.title}</h4>
                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full
                          ${ann.type === 'admission' ? 'bg-indigo-100 text-indigo-700' :
                            ann.type === 'discount' ? 'bg-emerald-100 text-emerald-700' :
                              'bg-blue-100 text-blue-700'}
                        `}>
                          {ann.type}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs font-medium text-gray-500">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          Expires: {new Date(ann.expires_at).toLocaleDateString()}
                        </span>
                        {ann.type === 'admission' && ann.content.groups && (
                          <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-600">
                            {ann.content.groups.length} Groups
                          </span>
                        )}
                        {ann.type === 'discount' && ann.content.discounts && (
                          <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-600">
                            {ann.content.discounts.length} Courses
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(ann.id)}
                    className="self-end sm:self-center p-3 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

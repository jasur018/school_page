import { useState } from 'react';
import { Send } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../context/LanguageContext';

interface FormData {
  studentName: string;
  parentName: string;
  email: string;
  phone: string;
  gradeLevel: string;
  message: string;
}

export default function ApplicationForm() {
  const { t } = useLanguage();
  const [formData, setFormData] = useState<FormData>({
    studentName: '',
    parentName: '',
    email: '',
    phone: '',
    gradeLevel: '9',
    message: '',
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!formData.studentName.trim()) return t('studentFullName');
    if (!formData.parentName.trim()) return t('parentName');
    if (!formData.email.trim()) return t('emailAddress');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) return t('emailAddress');
    if (!formData.phone.trim()) return t('phoneNumber');
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) { setError(validationError); return; }

    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const { error: submitError } = await supabase.from('applications').insert([
        {
          student_name: formData.studentName,
          parent_name: formData.parentName,
          email: formData.email,
          phone: formData.phone,
          grade_level: formData.gradeLevel,
          message: formData.message || null,
        },
      ]);
      if (submitError) throw submitError;
      setSuccess(true);
      setFormData({ studentName: '', parentName: '', email: '', phone: '', gradeLevel: '9', message: '' });
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      setError(t('applicationError'));
      console.error('Submission error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="applications" className="py-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-2xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            {t('applicationFormTitle')}
          </h2>
          <p className="text-xl text-gray-600">{t('applicationFormDesc')}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
              {t('applicationSuccess')}
            </div>
          )}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">{t('studentFullName')}</label>
                <input type="text" name="studentName" value={formData.studentName} onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  placeholder={t('studentNamePlaceholder')} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">{t('parentName')}</label>
                <input type="text" name="parentName" value={formData.parentName} onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  placeholder={t('parentNamePlaceholder')} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">{t('emailAddress')}</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  placeholder={t('emailPlaceholder')} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">{t('phoneNumber')}</label>
                <input type="tel" name="phone" value={formData.phone} onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  placeholder={t('phonePlaceholder')} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">{t('gradeLevel')}</label>
              <select name="gradeLevel" value={formData.gradeLevel} onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-white">
                <option value="9">Grade 9</option>
                <option value="10">Grade 10</option>
                <option value="11">Grade 11</option>
                <option value="12">Grade 12</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">{t('additionalMessage')}</label>
              <textarea name="message" value={formData.message} onChange={handleChange} rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition resize-none"
                placeholder={t('messagePlaceholder')} />
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-3 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2">
              <Send className="w-5 h-5" />
              {loading ? t('submitting') : t('submitApplication')}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

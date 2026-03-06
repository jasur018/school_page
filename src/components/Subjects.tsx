import {
  BookOpen,
  Calculator,
  Microscope,
  Globe,
  Palette,
  Cpu,
  Activity,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function Subjects() {
  const { t } = useLanguage();

  const subjects = [
    { icon: Calculator, name: t('subjectMath'), description: t('subjectMathDesc') },
    { icon: Microscope, name: t('subjectPhysics'), description: t('subjectPhysicsDesc') },
    { icon: Microscope, name: t('subjectChemistry'), description: t('subjectChemistryDesc') },
    { icon: BookOpen, name: t('subjectBiology'), description: t('subjectBiologyDesc') },
    { icon: Globe, name: t('subjectHistory'), description: t('subjectHistoryDesc') },
    { icon: BookOpen, name: t('subjectLanguages'), description: t('subjectLanguagesDesc') },
    { icon: Palette, name: t('subjectArts'), description: t('subjectArtsDesc') },
    { icon: Activity, name: t('subjectPE'), description: t('subjectPEDesc') },
    { icon: Cpu, name: t('subjectCS'), description: t('subjectCSDesc') },
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            {t('ourCurriculum')}
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {t('curriculumDesc')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {subjects.map((subject, index) => {
            const Icon = subject.icon;
            return (
              <div
                key={index}
                className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-xl border border-blue-100 hover:border-blue-300 transition-all duration-300 hover:shadow-lg"
              >
                <div className="flex items-start gap-4">
                  <Icon className="w-8 h-8 text-blue-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {subject.name}
                    </h3>
                    <p className="text-gray-600">{subject.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

import { Users, Award, BookOpen, Zap } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function Achievements() {
  const { t } = useLanguage();

  const achievements = [
    {
      icon: Users,
      number: '500+',
      title: t('students'),
      description: t('studentsDesc'),
    },
    {
      icon: Award,
      number: '30+',
      title: t('expertTeachers'),
      description: t('expertTeachersDesc'),
    },
    {
      icon: BookOpen,
      number: '15+',
      title: t('advancedLabs'),
      description: t('advancedLabsDesc'),
    },
    {
      icon: Zap,
      number: '95%',
      title: t('passRate'),
      description: t('passRateDesc'),
    },
  ];

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            {t('whyChoose')}
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {t('whyChooseDesc')}
          </p>
          <p className="text-sm text-gray-500 mt-4 italic">
            {t('achievementNote')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {achievements.map((achievement, index) => {
            const Icon = achievement.icon;
            return (
              <div
                key={index}
                className="bg-white p-8 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:scale-105 text-center"
              >
                <div className="flex justify-center mb-4">
                  <Icon className="w-12 h-12 text-blue-600" />
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-2">
                  {achievement.number}
                </h3>
                <p className="text-lg font-semibold text-gray-800 mb-2">
                  {achievement.title}
                </p>
                <p className="text-gray-600">{achievement.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

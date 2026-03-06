import React from 'react';
import { Users, Award, BookOpen, Zap } from 'lucide-react';

const achievements = [
  {
    icon: Users,
    number: '500+',
    title: 'Students',
    description: 'Active learners pursuing excellence',
  },
  {
    icon: Award,
    number: '30+',
    title: 'Expert Teachers',
    description: 'Highly qualified and dedicated educators',
  },
  {
    icon: BookOpen,
    number: '15+',
    title: 'Advanced Labs',
    description: 'Modern facilities for practical learning',
  },
  {
    icon: Zap,
    number: '95%',
    title: 'Pass Rate',
    description: 'Exceptional academic achievement',
  },
];

export default function Achievements() {
  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Why Choose Ar-Roshidoniy?
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            We pride ourselves on delivering world-class education with state-of-the-art facilities and exceptional educators.
          </p>
          <p className="text-sm text-gray-500 mt-4 italic">
            Achievement details can be customized later
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

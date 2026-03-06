import React from 'react';
import {
  BookOpen,
  Calculator,
  Microscope,
  Globe,
  Palette,
  Music,
  Cpu,
  Activity,
} from 'lucide-react';

const subjects = [
  {
    icon: Calculator,
    name: 'Mathematics',
    description: 'Algebra, Geometry, Calculus, and Statistics',
  },
  {
    icon: Microscope,
    name: 'Physics',
    description: 'Mechanics, Electricity, Waves, and Modern Physics',
  },
  {
    icon: Microscope,
    name: 'Chemistry',
    description: 'Organic, Inorganic, and Physical Chemistry',
  },
  {
    icon: BookOpen,
    name: 'Biology',
    description: 'Cell Biology, Genetics, Ecology, and Physiology',
  },
  {
    icon: Globe,
    name: 'History & Social Studies',
    description: 'World History, Geography, and Civic Education',
  },
  {
    icon: BookOpen,
    name: 'Languages',
    description: 'English, Arabic, and Additional Language Options',
  },
  {
    icon: Palette,
    name: 'Arts & Design',
    description: 'Visual Arts, Digital Design, and Creative Expression',
  },
  {
    icon: Activity,
    name: 'Physical Education',
    description: 'Sports, Fitness, and Wellness Programs',
  },
  {
    icon: Cpu,
    name: 'Computer Science',
    description: 'Programming, Web Development, and IT Skills',
  },
];

export default function Subjects() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Our Curriculum
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Comprehensive subjects designed to prepare students for higher education and professional success
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

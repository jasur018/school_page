import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Info,
  Video,
  User,
  Briefcase,
  GraduationCap,
  Award,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { TranslationKey } from '../lib/i18n';

interface Teacher {
  name: string;
  age: number;
  experience: string;
  education: string;
  achievements: string;
}

interface SubjectDetail {
  id: string;
  nameKey: TranslationKey;
  descKey: TranslationKey;
  videoUrl: string;
  teachers: Teacher[];
}

const subjectsData: SubjectDetail[] = [
  {
    id: 'math',
    nameKey: 'subjectMath',
    descKey: 'subjectMathDesc',
    videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    teachers: [
      {
        name: 'Dr. Alan Turing',
        age: 45,
        experience: '20 years',
        education: 'Ph.D. in Mathematics, Cambridge University',
        achievements: 'Published 15 research papers, Best Teacher Award 2022'
      },
      {
        name: 'Sarah Connor',
        age: 38,
        experience: '12 years',
        education: 'M.Sc. in Applied Mathematics, MIT',
        achievements: 'Developed innovative algebra curriculum, Math Olympiad Coach'
      }
    ]
  },
  {
    id: 'physics',
    nameKey: 'subjectPhysics',
    descKey: 'subjectPhysicsDesc',
    videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
    teachers: [
      {
        name: 'Marie Curie',
        age: 50,
        experience: '25 years',
        education: 'Ph.D. in Physics, Sorbonne University',
        achievements: 'Head of Science Department, Distinguished Researcher'
      }
    ]
  },
  {
    id: 'biology',
    nameKey: 'subjectBiology',
    descKey: 'subjectBiologyDesc',
    videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
    teachers: [
      {
        name: 'Charles Darwin',
        age: 60,
        experience: '30 years',
        education: 'B.A. Sciences, Cambridge',
        achievements: 'Author of Advanced Biology textbook, Biology Society President'
      }
    ]
  }
];

export default function Subjects() {
  const { t } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mobileView, setMobileView] = useState<'video' | 'info'>('video');
  const videoRef = useRef<HTMLVideoElement>(null);

  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 50;

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().catch(e => console.log('Autoplay prevented', e));
    }
  }, [currentIndex, mobileView]);

  const nextSubject = () => {
    setCurrentIndex((prev) => (prev === subjectsData.length - 1 ? 0 : prev + 1));
    setMobileView('video');
  };

  const prevSubject = () => {
    setCurrentIndex((prev) => (prev === 0 ? subjectsData.length - 1 : prev - 1));
    setMobileView('video');
  };

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (touchStart === null || touchEnd === null) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe) {
      nextSubject();
    }
    if (isRightSwipe) {
      prevSubject();
    }
  };

  const activeSubject = subjectsData[currentIndex];

  return (
    <section className="py-20 bg-gray-50 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            {t('ourCurriculum')}
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {t('curriculumDesc')}
          </p>
        </div>

        <div className="flex flex-col items-center">
          <div className="relative w-full flex items-center justify-center">
            {/* Desktop Left Button */}
            <button 
              onClick={prevSubject} 
              className="hidden md:flex p-4 rounded-full bg-white text-blue-600 hover:bg-blue-50 shadow-md transition-all mr-6 z-10 shrink-0 border border-gray-100"
              aria-label={t('previousSubject')}
            >
              <ChevronLeft className="w-8 h-8" />
            </button>

            {/* Main Content Area */}
            <div 
              className="w-full max-w-5xl relative overflow-hidden rounded-3xl shadow-2xl bg-white border border-gray-100"
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
            >
              <div className="flex flex-col md:flex-row h-[85vh] max-h-[800px] md:h-[600px]">
                 {/* Video Section */}
                 <div className={`relative w-full md:w-5/12 h-full bg-black flex-shrink-0 ${mobileView === 'info' ? 'hidden md:block' : 'block'}`}>
                   <video 
                     ref={videoRef}
                     src={activeSubject.videoUrl} 
                     className="w-full h-full object-cover opacity-90"
                     autoPlay
                     muted
                     playsInline
                     onEnded={() => setMobileView('info')}
                   />
                   {/* Mobile Toggle Icon */}
                   <button 
                     onClick={() => setMobileView('info')} 
                     className="md:hidden absolute top-4 right-4 p-3 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30 z-10 transition-colors"
                     aria-label={t('showInfo')}
                   >
                     <Info className="w-6 h-6" />
                   </button>
                   {/* Subject overlay on video for mobile */}
                   <div className="md:hidden absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                      <h3 className="text-2xl font-bold text-white mb-2">{t(activeSubject.nameKey)}</h3>
                      <p className="text-white/80 line-clamp-2">{t(activeSubject.descKey)}</p>
                   </div>
                 </div>

                 {/* Info Section */}
                 <div className={`w-full md:w-7/12 h-full overflow-y-auto bg-white p-6 md:p-10 custom-scrollbar ${mobileView === 'video' ? 'hidden md:block' : 'block'}`}>
                   <div className="flex justify-between items-start mb-8">
                      <div>
                        <h3 className="text-3xl md:text-4xl font-bold text-gray-900">{t(activeSubject.nameKey)}</h3>
                        <p className="text-gray-600 mt-4 text-lg leading-relaxed">{t(activeSubject.descKey)}</p>
                      </div>
                      {/* Mobile Toggle Icon (Return to video) */}
                      <button 
                        onClick={() => setMobileView('video')} 
                        className="md:hidden p-3 bg-blue-50 rounded-full text-blue-600 hover:bg-blue-100 shrink-0 ml-4 transition-colors"
                        aria-label={t('showVideo')}
                      >
                        <Video className="w-6 h-6" />
                      </button>
                   </div>

                   <div className="space-y-6 mt-8">
                     <h4 className="text-xl font-bold text-gray-800 border-b pb-3 flex items-center gap-2">
                        <GraduationCap className="text-blue-600 w-6 h-6" />
                        {t('ourTeachers')}
                     </h4>
                     <div className="grid grid-cols-1 gap-6">
                       {activeSubject.teachers.map((teacher, idx) => (
                         <div key={idx} className="bg-gray-50 p-6 rounded-2xl border border-gray-100 hover:border-blue-200 transition-colors">
                            <div className="flex items-center gap-4 mb-5">
                              <div className="p-3 bg-white text-blue-600 rounded-xl shadow-sm">
                                <User className="w-7 h-7" />
                              </div>
                              <div>
                                <h5 className="font-bold text-xl text-gray-900">{teacher.name}</h5>
                                <span className="inline-block mt-1 px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                                  {t('teacherAge')}: {teacher.age}
                                </span>
                              </div>
                            </div>
                            <div className="space-y-3 text-sm text-gray-700">
                              <div className="flex items-start gap-3">
                                 <Briefcase className="w-5 h-5 mt-0.5 text-blue-500 shrink-0" />
                                 <p><span className="font-semibold text-gray-900">{t('teacherExperience')}:</span> {teacher.experience}</p>
                              </div>
                              <div className="flex items-start gap-3">
                                 <GraduationCap className="w-5 h-5 mt-0.5 text-blue-500 shrink-0" />
                                 <p><span className="font-semibold text-gray-900">{t('teacherEducation')}:</span> {teacher.education}</p>
                              </div>
                              <div className="flex items-start gap-3">
                                 <Award className="w-5 h-5 mt-0.5 text-blue-500 shrink-0" />
                                 <p><span className="font-semibold text-gray-900">{t('teacherAchievements')}:</span> {teacher.achievements}</p>
                              </div>
                            </div>
                         </div>
                       ))}
                     </div>
                   </div>
                 </div>
              </div>
            </div>

            {/* Desktop Right Button */}
            <button 
              onClick={nextSubject} 
              className="hidden md:flex p-4 rounded-full bg-white text-blue-600 hover:bg-blue-50 shadow-md transition-all ml-6 z-10 shrink-0 border border-gray-100"
              aria-label={t('nextSubject')}
            >
              <ChevronRight className="w-8 h-8" />
            </button>
          </div>

          {/* Dots Indicator */}
          <div className="flex justify-center mt-8 gap-3">
            {subjectsData.map((_, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setCurrentIndex(idx);
                  setMobileView('video');
                }}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  idx === currentIndex 
                    ? 'bg-blue-600 w-8' 
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
                aria-label={`Go to subject ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

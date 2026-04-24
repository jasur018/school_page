import Hero from '../components/Hero';
import Achievements from '../components/Achievements';
import Subjects from '../components/Subjects';
import ApplicationForm from '../components/ApplicationForm';
import Footer from '../components/Footer';
import Header from '../components/Header';
import AnnouncementDisplay from '../components/AnnouncementDisplay';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <Hero />
      <Achievements />
      <Subjects />
      <ApplicationForm />
      <Footer />
      <AnnouncementDisplay />
    </div>
  );
}

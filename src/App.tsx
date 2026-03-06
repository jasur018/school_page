import React from 'react';
import Hero from './components/Hero';
import Achievements from './components/Achievements';
import Subjects from './components/Subjects';
import ApplicationForm from './components/ApplicationForm';
import Footer from './components/Footer';

function App() {
  return (
    <div className="min-h-screen bg-white">
      <Hero />
      <Achievements />
      <Subjects />
      <ApplicationForm />
      <Footer />
    </div>
  );
}

export default App;

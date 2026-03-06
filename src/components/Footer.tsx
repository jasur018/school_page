import React from 'react';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-100 py-16">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          <div>
            <h3 className="text-2xl font-bold text-white mb-4">Ar-Roshidoniy</h3>
            <p className="text-gray-400">
              Providing excellence in education for high school students since its establishment.
            </p>
          </div>

          <div>
            <h4 className="text-lg font-semibold text-white mb-6">Contact</h4>
            <div className="space-y-4">
              <a
                href="tel:+1555123456"
                className="flex items-center gap-3 text-gray-400 hover:text-blue-400 transition-colors"
              >
                <Phone className="w-5 h-5 flex-shrink-0" />
                <span>+1 (555) 123-4567</span>
              </a>
              <a
                href="mailto:info@arroshidoniy.edu"
                className="flex items-center gap-3 text-gray-400 hover:text-blue-400 transition-colors"
              >
                <Mail className="w-5 h-5 flex-shrink-0" />
                <span>info@arroshidoniy.edu</span>
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-semibold text-white mb-6">Location</h4>
            <div className="flex items-start gap-3 text-gray-400">
              <MapPin className="w-5 h-5 flex-shrink-0 mt-1" />
              <div>
                <p>123 Education Street</p>
                <p>City, State 12345</p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-semibold text-white mb-6">Working Hours</h4>
            <div className="flex items-start gap-3 text-gray-400">
              <Clock className="w-5 h-5 flex-shrink-0 mt-1" />
              <div>
                <p>Monday - Friday</p>
                <p>8:00 AM - 4:00 PM</p>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8">
          <div className="text-center text-gray-500">
            <p>&copy; 2024 Ar-Roshidoniy High School. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}

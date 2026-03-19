import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';

export const Footer = () => {
  const { t, isHindi } = useLanguage();

  const categories = [
    { id: 'sports', name: t('sports') },
    { id: 'crime', name: t('crime') },
    { id: 'politics', name: t('politics') },
    { id: 'entertainment', name: t('entertainment') },
    { id: 'business', name: t('business') },
    { id: 'technology', name: t('technology') },
  ];

  return (
    <footer className="footer mt-16">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-white/20">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border-2 border-red-600">
                <div className="w-5 h-5 bg-[#f4c430] rounded-full" />
              </div>
              <h3 className={`text-xl font-bold ${isHindi ? 'font-hindi-heading' : 'font-heading'}`}>
                {isHindi ? 'समाचार ग्रुप' : 'Samachar Group'}
              </h3>
            </div>
            <p className={`text-sm text-white/70 ${isHindi ? 'font-hindi' : ''}`}>
              {t('tagline')}
            </p>
          </div>

          {/* Categories */}
          <div>
            <h4 className={`font-semibold mb-4 text-[#f4c430] uppercase text-sm tracking-wider ${isHindi ? 'font-hindi' : ''}`}>
              {isHindi ? 'श्रेणियां' : 'Categories'}
            </h4>
            <ul className="space-y-2">
              {categories.map((cat) => (
                <li key={cat.id}>
                  <Link 
                    to={`/category/${cat.id}`}
                    className={`text-sm text-white/70 hover:text-[#f4c430] transition-colors ${isHindi ? 'font-hindi' : ''}`}
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className={`font-semibold mb-4 text-[#f4c430] uppercase text-sm tracking-wider ${isHindi ? 'font-hindi' : ''}`}>
              {isHindi ? 'त्वरित लिंक' : 'Quick Links'}
            </h4>
            <ul className="space-y-2">
              <li>
                <Link to="/" className={`text-sm text-white/70 hover:text-[#f4c430] transition-colors ${isHindi ? 'font-hindi' : ''}`}>
                  {t('home')}
                </Link>
              </li>
              <li>
                <Link to="/login" className={`text-sm text-white/70 hover:text-[#f4c430] transition-colors ${isHindi ? 'font-hindi' : ''}`}>
                  {t('login')}
                </Link>
              </li>
              <li>
                <Link to="/signup" className={`text-sm text-white/70 hover:text-[#f4c430] transition-colors ${isHindi ? 'font-hindi' : ''}`}>
                  {t('signup')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className={`font-semibold mb-4 text-[#f4c430] uppercase text-sm tracking-wider ${isHindi ? 'font-hindi' : ''}`}>
              {isHindi ? 'कानूनी' : 'Legal'}
            </h4>
            <ul className="space-y-2">
              <li>
                <span className={`text-sm text-white/70 ${isHindi ? 'font-hindi' : ''}`}>
                  {t('aboutUs')}
                </span>
              </li>
              <li>
                <span className={`text-sm text-white/70 ${isHindi ? 'font-hindi' : ''}`}>
                  {t('contactUs')}
                </span>
              </li>
              <li>
                <span className={`text-sm text-white/70 ${isHindi ? 'font-hindi' : ''}`}>
                  {t('privacyPolicy')}
                </span>
              </li>
              <li>
                <span className={`text-sm text-white/70 ${isHindi ? 'font-hindi' : ''}`}>
                  {t('termsOfService')}
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="py-6 text-center">
          <p className={`text-sm text-white/50 ${isHindi ? 'font-hindi' : ''}`}>
            © {new Date().getFullYear()} {isHindi ? 'समाचार ग्रुप' : 'Samachar Group'}. {t('allRightsReserved')}.
          </p>
        </div>
      </div>
    </footer>
  );
};

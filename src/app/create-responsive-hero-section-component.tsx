import React from 'react';

interface HeroSectionProps {
  title: string;
  subtitle: string;
  ctaText: string;
  onCTAClick: () => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({ 
  title, 
  subtitle, 
  ctaText, 
  onCTAClick 
}) => {
  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-blue-500 via-purple-600 to-indigo-700">
      <div className="absolute inset-0 bg-black opacity-10"></div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
        <div className="text-center">
          <h1 
            className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-6"
            id="hero-title"
          >
            {title}
          </h1>
          <p 
            className="mt-4 text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto leading-relaxed"
            id="hero-subtitle"
          >
            {subtitle}
          </p>
          <div className="mt-10">
            <button
              onClick={onCTAClick}
              className="inline-flex items-center px-8 py-4 border border-transparent text-base font-medium rounded-md text-indigo-700 bg-white hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-indigo-700 focus:ring-white transition-all duration-300 transform hover:-translate-y-1 shadow-lg hover:shadow-xl"
              aria-label={`Click to ${ctaText.toLowerCase()}`}
            >
              {ctaText}
              <svg 
                className="ml-3 -mr-1 h-5 w-5" 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 20 20" 
                fill="currentColor" 
                aria-hidden="true"
              >
                <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
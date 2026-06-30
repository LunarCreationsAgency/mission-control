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
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600"></div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white tracking-tight">
            {title}
          </h1>
          <p className="mt-6 text-xl text-gray-100 max-w-3xl mx-auto">
            {subtitle}
          </p>
          <div className="mt-10">
            <button
              onClick={onCTAClick}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-white hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-blue-500 focus:ring-white transition-colors duration-300"
              aria-label={`Click to ${ctaText.toLowerCase()}`}
            >
              {ctaText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
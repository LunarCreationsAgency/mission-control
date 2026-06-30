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
    <div className="bg-gradient-to-r from-blue-500 to-purple-600 w-full py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto text-center">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white mb-6">
          {title}
        </h1>
        <p className="text-xl sm:text-2xl text-blue-100 mb-10 max-w-3xl mx-auto">
          {subtitle}
        </p>
        <button
          onClick={onCTAClick}
          className="bg-white text-blue-600 font-bold py-3 px-8 rounded-full text-lg hover:bg-blue-50 focus:outline-none focus:ring-4 focus:ring-blue-300 transition-all duration-300 transform hover:scale-105 shadow-lg"
          aria-label={`Click to ${ctaText.toLowerCase()}`}
        >
          {ctaText}
        </button>
      </div>
    </div>
  );
};

export default HeroSection;
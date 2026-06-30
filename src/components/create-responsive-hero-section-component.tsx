import React from 'react';

interface HeroSectionProps {
  title: string;
  subtitle: string;
  buttonText: string;
  onButtonClick: () => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({
  title,
  subtitle,
  buttonText,
  onButtonClick
}) => {
  return (
    <div className="relative w-full bg-gradient-to-r from-blue-500 to-purple-600 overflow-hidden">
      <div className="absolute inset-0 bg-black opacity-10"></div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white tracking-tight mb-6">
            {title}
          </h1>
          <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto mb-10">
            {subtitle}
          </p>
          <div className="flex justify-center">
            <button
              onClick={onButtonClick}
              className="px-8 py-4 bg-white text-blue-600 font-bold rounded-lg shadow-lg hover:bg-blue-50 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-700"
              aria-label={`Click to ${buttonText.toLowerCase()}`}
            >
              {buttonText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
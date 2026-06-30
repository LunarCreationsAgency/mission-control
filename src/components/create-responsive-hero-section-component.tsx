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
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white tracking-tight">
            {title}
          </h1>
          <p className="mt-6 text-xl text-white max-w-2xl mx-auto opacity-90">
            {subtitle}
          </p>
          <div className="mt-10">
            <button
              onClick={onButtonClick}
              className="inline-flex items-center px-8 py-4 border border-transparent text-base font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white transition-all duration-300 transform hover:scale-105"
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
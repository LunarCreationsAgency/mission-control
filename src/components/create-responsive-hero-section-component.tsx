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
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight md:leading-snug">
            {title}
          </h1>
          <p className="mt-6 text-xl text-white max-w-2xl mx-auto opacity-90">
            {subtitle}
          </p>
          <div className="mt-10">
            <button
              onClick={onButtonClick}
              className="px-8 py-4 bg-white text-blue-600 font-bold rounded-lg shadow-lg hover:bg-gray-100 hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-white focus:ring-opacity-50"
              aria-label={`Click to ${buttonText.toLowerCase()}`}
            >
              <span className="text-lg">{buttonText}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
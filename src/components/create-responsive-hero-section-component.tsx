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
    <div className="relative overflow-hidden bg-gradient-to-r from-blue-500 to-purple-600">
      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl">
            <span className="block">{title}</span>
          </h1>
          <p className="mx-auto mt-6 max-w-lg text-xl text-blue-100 sm:max-w-2xl">
            {subtitle}
          </p>
          <div className="mt-10">
            <button
              onClick={onButtonClick}
              className="inline-flex items-center rounded-md border border-transparent bg-white px-6 py-3 text-base font-medium text-blue-600 shadow-sm hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2 transition-all duration-200 transform hover:scale-105"
              aria-label={`${buttonText} - Navigate to next section`}
            >
              {buttonText}
            </button>
          </div>
        </div>
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
    </div>
  );
};

export default HeroSection;
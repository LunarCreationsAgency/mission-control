import React from 'react';

interface HeroProps {
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  backgroundGradient?: string; // optional custom gradient
}

const Hero: React.FC<HeroProps> = ({
  title,
  subtitle,
  ctaText,
  ctaLink,
  backgroundGradient = 'from-blue-600 to-purple-700',
}) => {
  return (
    <section
      className={`relative flex flex-col items-center justify-center min-h-screen px-4 py-20 text-center text-white bg-gradient-to-br ${backgroundGradient}`}
      aria-label="Hero section"
    >
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
          {title}
        </h1>
        <p className="mt-6 text-lg sm:text-xl md:text-2xl text-gray-200 max-w-2xl mx-auto">
          {subtitle}
        </p>
        <div className="mt-10">
          <a
            href={ctaLink}
            className="inline-block px-8 py-4 text-lg font-semibold text-white bg-indigo-600 rounded-lg shadow-lg hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-transparent transition-colors duration-200"
            aria-label={`${ctaText} - ${subtitle}`}
          >
            {ctaText}
          </a>
        </div>
      </div>
    </section>
  );
};

export default Hero;
import React from 'react';

interface HeroProps {
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  gradientFrom?: string;
  gradientTo?: string;
}

const Hero: React.FC<HeroProps> = ({
  title,
  subtitle,
  ctaText,
  ctaLink,
  gradientFrom = 'from-blue-600',
  gradientTo = 'to-purple-600',
}) => {
  return (
    <section
      className={`bg-gradient-to-r ${gradientFrom} ${gradientTo} text-white py-20 px-4 sm:px-6 lg:px-8`}
      aria-label="Hero section"
    >
      <div className="max-w-7xl mx-auto text-center">
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
          {title}
        </h1>
        <p className="mt-4 text-lg sm:text-xl md:text-2xl text-white/80 max-w-3xl mx-auto">
          {subtitle}
        </p>
        <div className="mt-8">
          <a
            href={ctaLink}
            className="inline-block bg-white text-gray-900 font-semibold py-3 px-8 rounded-full shadow-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-transparent transition-all duration-200 transform hover:scale-105"
            aria-label={`${ctaText} button`}
          >
            {ctaText}
          </a>
        </div>
      </div>
    </section>
  );
};

export default Hero;
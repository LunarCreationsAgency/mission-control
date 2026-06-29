REPORT: This responsive hero section component displays a gradient background with centered title, subtitle, and call-to-action button that adapts to different screen sizes. The component includes hover effects on the CTA button and proper accessibility attributes for screen readers.

---
import React from 'react';

const HeroSection: React.FC = () => {
  return (
    <div className="bg-gradient-to-r from-blue-500 to-purple-600 min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl text-center">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white mb-4">
          Welcome to Our Platform
        </h1>
        <p className="text-xl sm:text-2xl text-blue-100 mb-8 max-w-2xl mx-auto">
          Discover amazing features designed to boost your productivity and creativity.
        </p>
        <button 
          className="bg-white text-blue-600 hover:bg-blue-50 font-bold py-3 px-8 rounded-lg text-lg transition duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
          aria-label="Get started with our platform"
        >
          Get Started
        </button>
      </div>
    </div>
  );
};

export default HeroSection;
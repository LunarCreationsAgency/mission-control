We need to write a React component in TypeScript with Tailwind CSS. The task: Create responsive hero section component. Description: Build a React hero section with title, subtitle, CTA button, and background gradient. Use TypeScript, Tailwind CSS, and responsive breakpoints. Include hover effects and accessibility.

Output ONLY valid TypeScript React code. No explanations, no markdown code fences.

So I need to output just the code, no backticks, no markdown. The code should be a complete React component, likely a functional component with TypeScript. It should include a hero section with title, subtitle, CTA button, background gradient. Use Tailwind classes for styling, responsive breakpoints (sm, md, lg, etc.), hover effects on button, and accessibility (like aria labels, semantic HTML, maybe role, etc.). I'll create a component named HeroSection or something. I'll export it as default. I'll include proper types for props if any, but maybe no props needed. I'll use a simple structure: a section with a gradient background, a container, a heading, a paragraph, a button. I'll add hover effects like scale, shadow, color change. Accessibility: button has aria-label, maybe role="button" if it's a link styled as button, but I'll use a <button> element. I'll ensure contrast, focus styles. I'll add a focus:ring for keyboard accessibility. I'll use semantic HTML: <section> with aria-label or role="region" maybe. I'll add a title with <h1>, subtitle with <p>. I'll make it responsive: text sizes change with breakpoints, padding, etc. I'll use Tailwind's gradient utilities: bg-gradient-to-r from-... to-... I'll include a CTA button with hover:bg-..., hover:scale-105 transition, focus:outline-none focus:ring-2 etc. I'll also add a container with max-w-7xl mx-auto px-4 sm:px-6 lg:px-8. I'll center content vertically with flex items-center justify-center min-h-screen or something. I'll output the code.

I'll write:

import React from 'react';

const HeroSection: React.FC = () => {
  return (
    <section
      className="relative flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 text-white"
      aria-label="Hero section"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight">
          Welcome to Our Platform
        </h1>
        <p className="mt-6 text-lg sm:text-xl md:text-2xl max-w-2xl mx-auto text-blue-100">
          Build amazing experiences with our cutting-edge tools and services. Start your journey today.
        </p>
        <div className="mt-10">
          <button
            type="button"
            className="inline-flex items-center px-8 py-4 border border-transparent text-base font-medium rounded-md shadow-lg text-blue-700 bg-white hover:bg-blue-50 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white transition transform duration-200 ease-in-out"
            aria-label="Get started with our platform"
          >
            Get Started
          </button>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;

I'll add a subtle background pattern maybe? Not required. I'll keep it simple. I'll ensure the gradient is responsive? It's fine. I'll add a dark overlay? No,
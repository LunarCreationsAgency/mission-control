We need to output ONLY the code. No markdown, no explanations. So I'll write a React TypeScript component for a hero section with title, subtitle, CTA button, background gradient, responsive breakpoints, hover effects, accessibility. Use Tailwind CSS.

I'll create a functional component named HeroSection. It will accept props for title, subtitle, buttonText, buttonLink, maybe background gradient classes. But the task says "Create responsive hero section component" so I'll make it generic with props. I'll use TypeScript interface for props. Include aria attributes for accessibility. Use Tailwind classes for styling, responsive design (sm, md, lg, xl), hover effects on button. Background gradient can be a prop or default. I'll make it a default export.

I'll include a button with role="link" if it's a link, or use an anchor tag. I'll use an anchor tag with href prop. For accessibility, add aria-label to the section, maybe role="banner" for hero? Actually hero section is often a banner landmark. I'll add role="banner" to the section. Use semantic HTML: section, h1, p, a. Add aria-labelledby for the heading. I'll use id for heading and aria-labelledby on section. Also add alt text for any background image? No, just gradient. So no image.

I'll make the component accept: title, subtitle, ctaText, ctaLink, backgroundGradient (optional). I'll set default gradient. Use Tailwind's gradient utilities: bg-gradient-to-r from-... to-... I'll use from-blue-500 to-purple-600. For responsive: text sizes, padding, etc. Use text-4xl md:text-5xl lg:text-6xl for title. Subtitle: text-lg md:text-xl. Button: px-6 py-3 md:px-8 md:py-4. Hover: scale-105 transition-transform, maybe shadow. Focus: outline-none ring-2 ring-offset-2 ring-blue-500 for accessibility.

I'll also add aria-label to the link if needed. The link will have role="button"? Actually it's a CTA button, so it's a link styled as a button. I'll use an anchor tag with href. For accessibility, I'll add aria-label if the text is not descriptive enough, but the text itself is fine. I'll add aria-label="Call to action" maybe? No, just use the text. I'll add aria-label to the section: "Hero section". I'll use aria-labelledby pointing to the heading id.

I'll also add a skip link? Not needed.

I'll output the code only. So I'll write:

import React from 'react';

interface HeroSectionProps {
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  backgroundGradient?: string;
}

const HeroSection: React.FC<HeroSectionProps> = ({
  title,
  subtitle,
  ctaText,
  ctaLink,
  backgroundGradient = 'from-blue-500 to-purple-600',
}) => {
  return (
    <section
      role="banner"
      aria-labelledby="hero-title"
      aria-label="Hero section"
      className={`relative flex flex-col items-center justify-center min-h-screen px-4 py-20 text-center text-white bg-gradient-to-r ${backgroundGradient}`}
    >
      <h1
        id="hero-title"
        className="text-4xl font-extrabold leading-tight tracking-tight md:text-5xl lg:text-6xl"
      >
        {title}
      </h1>
      <p className="max-w-2xl mt-4 text-lg md:text-xl lg:text-2
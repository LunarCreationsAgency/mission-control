REPORT: This React component renders a responsive hero section with a title, subtitle, and call-to-action button, featuring a gradient background and hover effects. It is built with TypeScript and Tailwind CSS, ensuring accessibility through semantic HTML, focus states, and ARIA attributes.
---
DELIVERABLE:
```tsx
import React from 'react';

interface HeroSectionProps {
  title?: string;
  subtitle?: string;
  ctaText?: string;
  ctaLink?: string;
  gradientFrom?: string;
  gradientTo?: string;
}

const HeroSection: React.FC<HeroSectionProps> = ({
  title = 'Welcome to Our Platform',
  subtitle = 'Build amazing experiences with our modern toolkit.',
  c
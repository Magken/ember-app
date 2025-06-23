import React from 'react';

interface TypographyProps {
  children: React.ReactNode;
  className?: string;
}

export const Heading1: React.FC<TypographyProps> = ({ children, className = '' }) => (
  <h1 className={`text-[var(--text-h1)] font-bold font-[var(--font-display)] text-[var(--color-white)] leading-tight ${className}`}>
    {children}
  </h1>
);

export const Heading2: React.FC<TypographyProps> = ({ children, className = '' }) => (
  <h2 className={`text-[var(--text-h2)] font-semibold font-[var(--font-display)] text-[var(--color-white)] leading-tight ${className}`}>
    {children}
  </h2>
);

export const Heading3: React.FC<TypographyProps> = ({ children, className = '' }) => (
  <h3 className={`text-[var(--text-h3)] font-medium font-[var(--font-display)] text-[var(--color-white)] leading-tight ${className}`}>
    {children}
  </h3>
);

export const TextBlock: React.FC<TypographyProps> = ({ children, className = '' }) => (
  <p className={`text-[var(--text-body)] font-normal font-[var(--font-body)] text-[var(--color-white)] leading-relaxed ${className}`}>
    {children}
  </p>
);

export const SmallText: React.FC<TypographyProps> = ({ children, className = '' }) => (
  <span className={`text-[var(--text-small)] font-normal font-[var(--font-body)] text-[var(--color-gray)] ${className}`}>
    {children}
  </span>
);

export const TinyText: React.FC<TypographyProps> = ({ children, className = '' }) => (
  <span className={`text-[var(--text-tiny)] font-normal font-[var(--font-body)] text-[var(--color-gray)] ${className}`}>
    {children}
  </span>
);
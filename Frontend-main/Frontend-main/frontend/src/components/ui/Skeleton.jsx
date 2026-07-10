import React from 'react';

// Simple shimmer placeholder block.
const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse rounded bg-slate-200/80 ${className}`} />
);

export default Skeleton;

import React from 'react';

// Lightweight inline spinner. size = px.
const Spinner = ({ size = 20, className = '' }) => (
  <span
    role="status"
    aria-label="Loading"
    className={`inline-block animate-spin rounded-full border-2 border-current border-t-transparent ${className}`}
    style={{ width: size, height: size }}
  />
);

export default Spinner;

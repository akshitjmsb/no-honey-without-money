// Test file to verify ESLint is working correctly
// This file should trigger ESLint rules and help verify the configuration

import React from 'react';

interface TestProps {
  message: string;
  count: number;
}

const TestComponent: React.FC<TestProps> = ({ message, count }) => {
  // This should trigger unused variable warning if ESLint is working
  const unusedVariable = 'This should trigger a warning';
  
  // This should trigger no-explicit-any warning
  const anyValue: any = 'This should trigger a warning';
  
  return (
    <div>
      <h1>{message}</h1>
      <p>Count: {count}</p>
      <button onClick={() => console.log('clicked')}>
        Click me
      </button>
    </div>
  );
};

export default TestComponent;

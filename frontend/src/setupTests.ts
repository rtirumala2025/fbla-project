/**
 * Setup Tests
 * Test configuration and mocks
 */
import '@testing-library/jest-dom';
import React from 'react';

// Mock ResizeObserver
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

Object.defineProperty(globalThis, 'ResizeObserver', {
  value: ResizeObserverStub,
  writable: true,
});

// Mock matchMedia
if (typeof window !== 'undefined' && !window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }),
  });
}

// Mock recharts ResponsiveContainer for tests
jest.mock('recharts', () => {
  const actual = jest.requireActual('recharts');
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) =>
      React.createElement('div', { style: { width: 800, height: 400 } }, children),
  };
});


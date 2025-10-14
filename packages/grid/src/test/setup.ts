/**
 * Test Setup
 */

import '@testing-library/jest-dom';

// Mock WebSocket
global.WebSocket = class WebSocket {
  constructor(url: string) {}
  addEventListener() {}
  removeEventListener() {}
  send() {}
  close() {}
} as any;

// Mock localStorage
global.localStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
  clear: () => {},
  length: 0,
  key: () => null,
};


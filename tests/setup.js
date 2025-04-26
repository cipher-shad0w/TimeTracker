// Mock browser globals for tests
global.document = {
  addEventListener: jest.fn(),
  createElement: jest.fn(() => ({
    appendChild: jest.fn(),
    addEventListener: jest.fn(),
    classList: {
      add: jest.fn(),
      remove: jest.fn()
    },
    setAttribute: jest.fn(),
    style: {},
  })),
  getElementById: jest.fn(() => ({
    innerHTML: '',
    appendChild: jest.fn(),
    addEventListener: jest.fn(),
    classList: {
      add: jest.fn(),
      remove: jest.fn()
    },
    querySelectorAll: jest.fn(() => []),
    value: '',
    options: [],
    remove: jest.fn(),
  })),
  querySelectorAll: jest.fn(() => []),
  documentElement: {
    setAttribute: jest.fn(),
    removeAttribute: jest.fn()
  }
};

global.localStorage = {
  getItem: jest.fn(),
  setItem: jest.fn()
};

// Increase the default timeout for tests
jest.setTimeout(10000);
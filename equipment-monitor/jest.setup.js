// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

jest.mock('framer-motion', () => ({
  motion: { div: 'div', tr: 'tr' },
  AnimatePresence: ({ children }) => children,
}))

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock ResizeObserver for components that measure DOM dimensions (e.g., PayloadViewer)
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Provide default dimensions for recharts ResponsiveContainer and other measuring libs
Object.defineProperty(HTMLElement.prototype, 'getBoundingClientRect', {
  writable: true,
  value: jest.fn().mockReturnValue({ width: 500, height: 500, top: 0, left: 0, bottom: 500, right: 500 }),
})

Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
  writable: true,
  value: 500,
})

Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
  writable: true,
  value: 500,
})

Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
  writable: true,
  value: 500,
})

Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
  writable: true,
  value: 500,
})

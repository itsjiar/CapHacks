
// Mock localStorage
const mockLocalStorage = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = value.toString(); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; }
  };
})();

// Set up global environment for testing
global.localStorage = mockLocalStorage;
// We don't define global.window here to test the conditional execution in cookies.js,
// but getOrCreateSessionId needs it if it uses localStorage directly or via window.
global.window = undefined;

const { getOrCreateSessionId } = require('../js/cookies.js');

function runTests() {
  console.log('--- Starting Tests for getOrCreateSessionId ---');

  // Test Case 1: Generates new ID when localStorage is empty
  localStorage.clear();
  const sessionId1 = getOrCreateSessionId();

  if (!sessionId1.startsWith('guest_')) {
    throw new Error('Test Case 1 Failed: Session ID should start with "guest_"');
  }
  if (sessionId1.length < 10) {
    throw new Error('Test Case 1 Failed: Session ID is too short');
  }
  console.log('Test Case 1 Passed: New ID generated correctly.');

  // Test Case 2: Correctly saves new ID to localStorage
  const storedId = localStorage.getItem('caphacks_guest_session');
  if (storedId !== sessionId1) {
    throw new Error('Test Case 2 Failed: Session ID was not saved to localStorage');
  }
  console.log('Test Case 2 Passed: New ID saved to localStorage.');

  // Test Case 3: Returns existing ID if present
  const existingId = 'guest_already_here_123';
  localStorage.setItem('caphacks_guest_session', existingId);
  const sessionId2 = getOrCreateSessionId();

  if (sessionId2 !== existingId) {
    throw new Error(`Test Case 3 Failed: Expected ${existingId}, but got ${sessionId2}`);
  }
  console.log('Test Case 3 Passed: Existing ID returned correctly.');

  // Test Case 4: Deterministic generation with Math.random mock
  localStorage.clear();
  const originalRandom = Math.random;
  Math.random = () => 0.5; // string(36) of 0.5 is "0.i"
  const expectedIdPart = (0.5).toString(36).substring(2, 15);
  const sessionId3 = getOrCreateSessionId();

  if (sessionId3 !== 'guest_' + expectedIdPart) {
    throw new Error(`Test Case 4 Failed: Expected guest_${expectedIdPart}, but got ${sessionId3}`);
  }
  Math.random = originalRandom;
  console.log('Test Case 4 Passed: Deterministic ID generation verified.');

  console.log('--- All Tests Passed! ---');
}

try {
  runTests();
} catch (error) {
  console.error('TEST FAILED:');
  console.error(error.message);
  process.exit(1);
}

const { getDisplayName } = require('../js/auth.js');

function runTests() {
  console.log('--- Starting Tests for getDisplayName ---');

  // Test Case 1: Guest user
  const guestResult = getDisplayName({ email: null }, true);
  if (guestResult !== '') {
    throw new Error(`Test Case 1 Failed: Expected '', got '${guestResult}'`);
  }
  console.log('Test Case 1 Passed: Guest user returns empty string.');

  // Test Case 2: User with full name
  const userWithFullName = {
    user_metadata: {
      full_name: 'John Doe'
    },
    email: 'john@example.com'
  };
  const resultWithFullName = getDisplayName(userWithFullName, false);
  if (resultWithFullName !== 'John Doe') {
    throw new Error(`Test Case 2 Failed: Expected 'John Doe', got '${resultWithFullName}'`);
  }
  console.log('Test Case 2 Passed: User with full name returns full name.');

  // Test Case 3: User without full name, but with email
  const userWithEmail = {
    user_metadata: {},
    email: 'jane.smith@example.com'
  };
  const resultWithEmail = getDisplayName(userWithEmail, false);
  if (resultWithEmail !== 'jane.smith') {
    throw new Error(`Test Case 3 Failed: Expected 'jane.smith', got '${resultWithEmail}'`);
  }
  console.log('Test Case 3 Passed: User with email but no full name returns email prefix.');

  // Test Case 4: User without full name and email
  const userEmpty = {};
  const resultEmpty = getDisplayName(userEmpty, false);
  if (resultEmpty !== 'User') {
    throw new Error(`Test Case 4 Failed: Expected 'User', got '${resultEmpty}'`);
  }
  console.log('Test Case 4 Passed: User without full name and email returns "User".');

  // Test Case 5: null metadata but has email
  const userNullMetadata = {
    user_metadata: null,
    email: 'bob@example.com'
  };
  const resultNullMetadata = getDisplayName(userNullMetadata, false);
  if (resultNullMetadata !== 'bob') {
    throw new Error(`Test Case 5 Failed: Expected 'bob', got '${resultNullMetadata}'`);
  }
  console.log('Test Case 5 Passed: User with null metadata but has email returns email prefix.');

  // Test Case 6: undefined metadata but has email
  const userUndefMetadata = {
    email: 'charlie@example.com'
  };
  const resultUndefMetadata = getDisplayName(userUndefMetadata, false);
  if (resultUndefMetadata !== 'charlie') {
    throw new Error(`Test Case 6 Failed: Expected 'charlie', got '${resultUndefMetadata}'`);
  }
  console.log('Test Case 6 Passed: User with undefined metadata but has email returns email prefix.');

  console.log('--- All Tests for getDisplayName Passed! ---');
}

try {
  runTests();
} catch (error) {
  console.error('TEST FAILED:');
  console.error(error.message);
  process.exit(1);
}

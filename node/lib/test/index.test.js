const mochaLib = require('@simpleview/mochalib');
const assert = require('assert');

function emailValidation({ to, from, subject, body }) {
  const errors = [];

  for (const check of [
    { name: 'to', value: to },
    { name: 'from', value: from },
    { name: 'subject', value: subject },
    { name: 'body', value: body },
  ]) {
    const { name, value } = check;

    // Required fields
    if (!value && name !== 'subject') {
      errors.push(`Missing required field: "${name}"`);
      continue; // No point in checking further, can't be the correct type if it's missing
    }

    // Type checks
    if (!!value && typeof value !== 'string') {
      errors.push(`Type error: "${name}" must be a string`);
      continue; // No point in checking further, can't be a valid email address if it's not a string
    }

    // Email address validation
    if (name === 'to' || name === 'from') {
      // source: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/email#basic_validation
      const emailAddressRegex =
        /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
      if (!emailAddressRegex.test(value)) {
        errors.push(`Invalid: "${name}" must be a valid email address`);
      }
    }
  }

  if (errors.length > 0) {
    throw new Error(errors.join(', '));
  }

  // All checks passed
  return true;
}

describe('emailValidation', () => {
  // Valid arguments for all fields
  const validArgs = {
    to: 'person1@example.com',
    from: 'person2@example.com',
    subject: 'test email',
    body: 'this is a test',
  };

  // Catch any errors and assert against result or error message
  function testRunner(test) {
    const { to, from, subject, body } = test;
    const result = (() => {
      try {
        return emailValidation({ to, from, subject, body });
      } catch (error) {
        return error?.message;
      }
    })();
    assert.strictEqual(result, test.result);
  }

  describe('to', () => {
    const tests = [
      {
        name: 'valid should return true',
        args: { ...validArgs, result: true },
      },
      {
        name: 'undefined should throw an error',
        args: {
          ...validArgs,
          to: undefined,
          result: 'Missing required field: "to"',
        },
      },
      {
        name: 'wrong type should throw an error',
        args: {
          ...validArgs,
          to: 1,
          result: 'Type error: "to" must be a string',
        },
      },
      {
        name: 'invalid email address should throw an error',
        args: {
          ...validArgs,
          to: 'invalid',
          result: 'Invalid: "to" must be a valid email address',
        },
      },
    ];

    mochaLib.testArray(tests, testRunner);
  });

  describe('from', () => {
    const tests = [
      {
        name: 'valid should return true',
        args: { ...validArgs, result: true },
      },
      {
        name: 'undefined should throw an error',
        args: {
          ...validArgs,
          from: undefined,
          result: 'Missing required field: "from"',
        },
      },
      {
        name: 'wrong type should throw an error',
        args: {
          ...validArgs,
          from: 1,
          result: 'Type error: "from" must be a string',
        },
      },
      {
        name: 'invalid email address should throw an error',
        args: {
          ...validArgs,
          from: 'invalid',
          result: 'Invalid: "from" must be a valid email address',
        },
      },
    ];

    mochaLib.testArray(tests, testRunner);
  });

  describe('subject', () => {
    const tests = [
      {
        name: 'valid should return true',
        args: { ...validArgs, result: true },
      },
      {
        name: 'undefined should return true (subject is optional)',
        args: { ...validArgs, subject: undefined, result: true },
      },
      {
        name: 'wrong type should throw an error',
        args: {
          ...validArgs,
          subject: 1,
          result: 'Type error: "subject" must be a string',
        },
      },
    ];

    mochaLib.testArray(tests, testRunner);
  });

  describe('body', () => {
    const tests = [
      {
        name: 'valid should return true',
        args: { ...validArgs, result: true },
      },
      {
        name: 'undefined should throw an error',
        args: {
          ...validArgs,
          body: undefined,
          result: 'Missing required field: "body"',
        },
      },
      {
        name: 'wrong type should throw an error',
        args: {
          ...validArgs,
          body: 1,
          result: 'Type error: "body" must be a string',
        },
      },
    ];

    mochaLib.testArray(tests, testRunner);
  });
});

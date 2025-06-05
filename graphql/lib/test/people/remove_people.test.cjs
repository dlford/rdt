const assert = require('assert');
const { testArray } = require('@simpleview/mochalib');
const { deepCheck } = require('@simpleview/assertlib');
const { ObjectId } = require('mongodb');

const { testPeople } = require('../testData.cjs');
const { TrainingPrefix } = require('@simpleview/rd-training-client');

const graphServer = new TrainingPrefix({
	graphUrl: 'http://localhost:4000',
});

describe('remove_people', function () {
	describe('invalid inputs', function () {
		const tests = [
			{
				name: 'bad id type',
				args: {
					variables: ['123'],
					error:
						'Variable "$ids" got invalid value "123" at "ids[0]"; Expected type "ObjectID". input must be a 24 character hex string, 12 byte Uint8Array, or an integer',
				},
			},
		];

		testArray(tests, async (test) => {
			try {
				await graphServer.remove_people({
					input: { ids: test.variables },
					fields: 'success',
				});
			} catch (err) {
				assert.strictEqual(err.message, test.error);
			}
		});
	});

	describe('valid inputs', function () {
		beforeEach(async () => {
			await graphServer.remove_people({
				fields: 'success',
			});
			await graphServer.insert_people({
				input: {
					people: [testPeople.one, testPeople.two, testPeople.three],
				},
				fields: 'success',
			});
		});

		describe('response message', function () {
			const tests = [
				{
					name: 'remove no people',
					args: {
						variables: [new ObjectId().toString()],
						result: {
							success: true,
							message: 'Deleted 0 people',
						},
					},
				},
				{
					name: 'remove one person',
					args: {
						variables: ['000000000000000000000001'],
						result: {
							success: true,
							message: 'Deleted 1 person',
						},
					},
				},
				{
					name: 'remove two people',
					args: {
						variables: [
							'000000000000000000000001',
							'000000000000000000000003',
						],
						result: {
							success: true,
							message: 'Deleted 2 people',
						},
					},
				},
				{
					name: 'remove all people',
					args: {
						variables: [],
						result: {
							success: true,
							message: 'Deleted 3 people',
						},
					},
				},
			];

			testArray(tests, async (test) => {
				const remove = await graphServer.remove_people({
					input: { ids: test.variables },
					fields: `
						success
						message
					`,
				});
				deepCheck(remove, test.result);
			});
		});

		describe('verify deleted with find', function () {
			const tests = [
				{
					name: 'remove no people',
					args: {
						variables: [new ObjectId().toString()],
						result: [
							{
								id: '000000000000000000000001',
							},
							{
								id: '000000000000000000000002',
							},
							{
								id: '000000000000000000000003',
							},
						],
					},
				},
				{
					name: 'remove one person',
					args: {
						variables: ['000000000000000000000001'],
						result: [
							{
								id: '000000000000000000000002',
							},
							{
								id: '000000000000000000000003',
							},
						],
					},
				},
				{
					name: 'remove two people',
					args: {
						variables: [
							'000000000000000000000001',
							'000000000000000000000003',
						],
						result: [
							{
								id: '000000000000000000000002',
							},
						],
					},
				},
				{
					name: 'remove all people',
					args: {
						variables: [],
						result: [],
					},
				},
			];

			testArray(tests, async (test) => {
				await graphServer.remove_people({
					input: { ids: test.variables },
					fields: 'success',
				});

				const find = await graphServer.find_people({
					fields: `
						docs {
							id
						}
					`,
				});
				deepCheck(find.docs, test.result);
			});
		});
	});
});

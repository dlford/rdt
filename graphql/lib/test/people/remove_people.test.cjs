const assert = require('assert');
const { testArray } = require('@simpleview/mochalib');
const { deepCheck } = require('@simpleview/assertlib');
const { ObjectId } = require('mongodb');

const { TrainingPrefix } = require('@simpleview/rd-training-client');

const graphServer = new TrainingPrefix({
	graphUrl: 'http://localhost:4000',
});

const testPeople = [
	{
		id: new ObjectId().toString(),
		first_name: 'InsertPeopleTestFirstName1',
		last_name: 'InsertPeopleTestLastName1',
	},
	{
		id: new ObjectId().toString(),
		first_name: 'InsertPeopleTestFirstName2',
		last_name: 'InsertPeopleTestLastName2',
	},
	{
		id: new ObjectId().toString(),
		first_name: 'InsertPeopleTestFirstName3',
		last_name: 'InsertPeopleTestLastName3',
	},
];

describe('remove_people', function () {
	describe('invalid inputs', function () {
		const tests = [
			{
				name: 'bad id type',
				args: {
					variables: {
						ids: ['123'],
					},
					error:
						'Variable "$ids" got invalid value "123" at "ids[0]"; Expected type "ObjectID". input must be a 24 character hex string, 12 byte Uint8Array, or an integer',
				},
			},
		];

		testArray(tests, async (test) => {
			try {
				await graphServer.remove_people({
					input: test.variables,
					fields: 'success',
				});
			} catch (err) {
				assert.notStrictEqual(test.error, undefined, err);
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
					people: testPeople,
				},
				fields: 'success',
			});
		});

		const tests = [
			{
				name: 'remove no people',
				args: {
					variables: {
						remove: {
							ids: [new ObjectId().toString()],
						},
					},
					result: {
						remove: {
							success: true,
							message: 'Deleted 0 people',
						},
						find: {
							docs: testPeople.map((person) => ({ id: person.id })),
						},
					},
				},
			},
			{
				name: 'remove one person',
				args: {
					variables: {
						remove: {
							ids: [testPeople[0].id],
						},
					},
					result: {
						remove: {
							success: true,
							message: 'Deleted 1 person',
						},
						find: {
							docs: [
								{
									id: testPeople[1].id,
								},
								{
									id: testPeople[2].id,
								},
							],
						},
					},
				},
			},
			{
				name: 'remove two people',
				args: {
					variables: {
						remove: {
							ids: [testPeople[0].id, testPeople[2].id],
						},
					},
					result: {
						remove: {
							success: true,
							message: 'Deleted 2 people',
						},
						find: {
							docs: [
								{
									id: testPeople[1].id,
								},
							],
						},
					},
				},
			},
			{
				name: 'remove all people',
				args: {
					variables: {
						remove: {
							ids: [],
						},
					},
					result: {
						remove: {
							success: true,
							message: 'Deleted 3 people',
						},
						find: {
							docs: [],
						},
					},
				},
			},
		];

		testArray(tests, async (test) => {
			const remove = await graphServer.remove_people({
				input: test.variables.remove,
				fields: `
					success
					message
				`,
			});
			deepCheck(remove, test.result.remove);

			const find = await graphServer.find_people({
				input: test.variables.find,
				fields: `
					docs {
						id
					}
				`,
			});
			deepCheck(find, test.result.find);
		});
	});
});

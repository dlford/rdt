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

describe('find_people', function () {
	before(async () => {
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

	describe('invalid inputs', function () {
		const tests = [
			{
				name: 'find by first name wrong type',
				args: {
					method: 'find_people',
					variables: {
						first_name: 7,
					},
					error:
						'Variable "$first_name" got invalid value 7; String cannot represent a non string value: 7',
				},
			},
			{
				name: 'find by last name wrong type',
				args: {
					method: 'find_people',
					variables: {
						last_name: 7,
					},
					error:
						'Variable "$last_name" got invalid value 7; String cannot represent a non string value: 7',
				},
			},
			{
				name: 'find by id wrong type',
				args: {
					method: 'find_people',
					variables: {
						id: '123',
					},
					error:
						'Variable "$id" got invalid value "123"; Expected type "ObjectID". input must be a 24 character hex string, 12 byte Uint8Array, or an integer',
				},
			},
		];

		testArray(tests, async (test) => {
			try {
				await graphServer.find_people({
					input: test.variables,
					fields: `
						docs {
							id
						}
					`,
				});
			} catch (err) {
				assert.notStrictEqual(test.error, undefined, err);
				assert.strictEqual(err.message, test.error);
			}
		});
	});

	describe('valid inputs', function () {
		const tests = [
			{
				name: 'find with no results',
				args: {
					variables: {
						id: new ObjectId().toString(),
					},
					fields: `
						docs {
							id
						}
					`,
					result: {
						docs: [],
					},
				},
			},
			{
				name: 'find one person by id',
				args: {
					variables: {
						id: testPeople[0].id,
					},
					fields: `
						docs {
							id
							first_name
							last_name
						}
					`,
					result: {
						docs: [testPeople[0]],
					},
				},
			},
			{
				name: 'find one person by first name',
				args: {
					variables: {
						first_name: testPeople[1].first_name,
					},
					fields: `
						docs {
							id
						}
					`,
					result: {
						docs: [
							{
								id: testPeople[1].id,
							},
						],
					},
				},
			},
			{
				name: 'find one person by last name',
				args: {
					variables: {
						last_name: testPeople[2].last_name,
					},
					fields: `
						docs {
							id
						}
					`,
					result: {
						docs: [
							{
								id: testPeople[2].id,
							},
						],
					},
				},
			},
			{
				name: 'find two people by first and last name',
				args: {
					variables: {
						first_name: testPeople[0].first_name,
						last_name: testPeople[1].last_name,
					},
					fields: `
						docs {
							id
						}
					`,
					result: {
						docs: [
							{
								id: testPeople[0].id,
							},
							{
								id: testPeople[1].id,
							},
						],
					},
				},
			},
		];

		testArray(tests, async (test) => {
			const result = await graphServer.find_people({
				input: test.variables,
				fields: test.fields,
			});
			deepCheck(result, test.result);
		});
	});
});

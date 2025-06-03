const assert = require('assert');
const { testArray } = require('@simpleview/mochalib');
const { deepCheck } = require('@simpleview/assertlib');
const { ObjectId } = require('mongodb');

const { TrainingPrefix } = require('@simpleview/rd-training-client');

const graphServer = new TrainingPrefix({
	graphUrl: 'http://localhost:4000',
});

describe('insert_people', function () {
	describe('invalid inputs', function () {
		const tests = [
			{
				name: 'missing last name',
				args: {
					variables: {
						people: [{ first_name: 'InsertPeopleTestFirstName' }],
					},
					error:
						'Variable "$people" got invalid value { first_name: "InsertPeopleTestFirstName" } at "people[0]"; Field "last_name" of required type "String!" was not provided.',
				},
			},
			{
				name: 'missing first name',
				args: {
					variables: {
						people: [{ last_name: 'InsertPeopleTestLastName' }],
					},
					error:
						'Variable "$people" got invalid value { last_name: "InsertPeopleTestLastName" } at "people[0]"; Field "first_name" of required type "String!" was not provided.',
				},
			},
			{
				name: 'first name type',
				args: {
					variables: {
						people: [
							{ first_name: 7, last_name: 'InsertPeopleTestLastName' },
						],
					},
					error:
						'Variable "$people" got invalid value 7 at "people[0].first_name"; String cannot represent a non string value: 7',
				},
			},
		];

		testArray(tests, async (test) => {
			try {
				await graphServer.insert_people({
					input: test.variables,
					fields: `
						success
					`,
				});
			} catch (err) {
				assert.notStrictEqual(test.error, undefined, err);
				assert.strictEqual(err.message, test.error);
			}
		});
	});

	describe('valid inputs', function () {
		const id = new ObjectId().toString();

		const tests = [
			{
				name: 'insert people',
				args: {
					variables: {
						insert: {
							people: [
								{
									id,
									first_name: 'InsertPeopleTestFirstName',
									last_name: 'InsertPeopleTestLastName',
								},
							],
						},
						find: {
							id,
						},
					},
					fields: {
						insert: `
							success
							message
						`,
						find: `
							docs {
								id
								first_name
								last_name
							}
						`,
					},
					result: {
						insert: {
							success: true,
							message:
								'Added people: InsertPeopleTestFirstName InsertPeopleTestLastName',
						},
						find: {
							docs: [
								{
									id,
									first_name: 'InsertPeopleTestFirstName',
									last_name: 'InsertPeopleTestLastName',
								},
							],
						},
					},
				},
			},
		];

		testArray(tests, async (test) => {
			const insert = await graphServer.insert_people({
				input: test.variables.insert,
				fields: test.fields.insert,
			});
			deepCheck(insert, test.result.insert);

			const find = await graphServer.find_people({
				input: test.variables.find,
				fields: test.fields.find,
			});
			deepCheck(find, test.result.find);
		});
	});
});

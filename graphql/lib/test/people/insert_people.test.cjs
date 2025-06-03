const assert = require('assert');
const { testArray } = require('@simpleview/mochalib');
const { deepCheck } = require('@simpleview/assertlib');

const { TrainingPrefix } = require('@simpleview/rd-training-client');

const graphServer = new TrainingPrefix({
	graphUrl: 'http://localhost:4000',
});

const context = {};

describe('insert_people', function () {
	after(async () => {
		const personQuery = await graphServer.find_people({
			input: {
				first_name: 'InsertPeopleTestFirstName',
				last_name: 'InsertPeopleTestLastName',
			},
			fields: `
				docs {
					id
				}
			`,
		});

		if (personQuery.docs.length) {
			await graphServer.remove_people({
				input: {
					ids: personQuery.docs.map((doc) => (doc.id)),
				},
				fields: `
					success
				`,
			});
		}
	});

	const tests = [
		{
			name: 'invalid missing last name',
			args: {
				method: 'insert_people',
				variables: {
					people: [{ first_name: 'InsertPeopleTestFirstName' }],
				},
				fields: `
						success
					`,
				error:
					'Variable "$people" got invalid value { first_name: "InsertPeopleTestFirstName" } at "people[0]"; Field "last_name" of required type "String!" was not provided.',
			},
		},
		{
			name: 'invalid missing first name',
			args: {
				method: 'insert_people',
				variables: {
					people: [{ last_name: 'InsertPeopleTestLastName' }],
				},
				fields: `
						success
					`,
				error:
					'Variable "$people" got invalid value { last_name: "InsertPeopleTestLastName" } at "people[0]"; Field "first_name" of required type "String!" was not provided.',
			},
		},
		{
			name: 'invalid first name type',
			args: {
				method: 'insert_people',
				variables: {
					people: [
						{ first_name: 7, last_name: 'InsertPeopleTestLastName' },
					],
				},
				fields: `
						success
					`,
				error:
					'Variable "$people" got invalid value 7 at "people[0].first_name"; String cannot represent a non string value: 7',
			},
		},
		{
			name: 'valid insert',
			args: {
				method: 'insert_people',
				variables: {
					people: [
						{
							first_name: 'InsertPeopleTestFirstName',
							last_name: 'InsertPeopleTestLastName',
						},
					],
				},
				fields: `
						success
					`,
				result: {
					success: true,
				},
			},
		},
		{
			name: 'verify inserted',
			args: {
				method: 'find_people',
				variables: {
					first_name: 'InsertPeopleTestFirstName',
					last_name: 'InsertPeopleTestLastName',
				},
				fields: `
						docs {
							id
							first_name
							last_name
						}
					`,
				result: {
					docs: [
						{
							id: { type: 'string' },
							first_name: 'InsertPeopleTestFirstName',
							last_name: 'InsertPeopleTestLastName',
						},
					],
				},
			},
		},
	];

	testArray(tests, async (test) => {
		try {
			let input = test?.variables;
			if (typeof test?.variables === 'function') {
				input = test?.variables?.(context);
			}
			const result = await graphServer[test.method]({
				input,
				fields: test.fields,
			});
			deepCheck(result, test.result);
		} catch (err) {
			assert.notStrictEqual(test.error, undefined, err);
			assert.strictEqual(err.message, test.error);
		}
	});
});

const assert = require('assert');
const { testArray } = require('@simpleview/mochalib');
const { deepCheck } = require('@simpleview/assertlib');

const { TrainingPrefix } = require('@simpleview/rd-training-client');

const graphServer = new TrainingPrefix({
	graphUrl: 'http://localhost:4000',
});

describe('insert_people', async () => {
	after(async () => {
		const personQuery = await graphServer.find_people({
			input: {
				first_name: 'NotARealFirstName',
				last_name: 'NotARealLastName',
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
					ids: personQuery.docs.map((doc) => ({ id: doc.id })),
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
					people: [{ first_name: 'NotARealFirstName' }],
				},
				fields: `
						success
					`,
				error:
					'Variable "$people" got invalid value { first_name: "NotARealFirstName" } at "people[0]"; Field "last_name" of required type "String!" was not provided.',
			},
		},
		{
			name: 'invalid missing first name',
			args: {
				method: 'insert_people',
				variables: {
					people: [{ last_name: 'NotARealLastName' }],
				},
				fields: `
						success
					`,
				error:
					'Variable "$people" got invalid value { last_name: "NotARealLastName" } at "people[0]"; Field "first_name" of required type "String!" was not provided.',
			},
		},
		{
			name: 'invalid first name type',
			args: {
				method: 'insert_people',
				variables: {
					people: [{ first_name: 7, last_name: 'NotARealLastName' }],
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
							first_name: 'NotARealFirstName',
							last_name: 'NotARealLastName',
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
					first_name: 'NotARealFirstName',
					last_name: 'NotARealLastName',
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
							first_name: 'NotARealFirstName',
							last_name: 'NotARealLastName',
						},
					],
				},
			},
		},
	];

	testArray(tests, async (test) => {
		try {
			const result = await graphServer[test.method]({
				input: test.variables,
				fields: test.fields,
			});
			deepCheck(result, test.result);
		} catch (err) {
			assert.notStrictEqual(test.error, undefined, err);
			assert.strictEqual(err.message, test.error);
		}
	});
});

const assert = require('assert');
const { testArray } = require('@simpleview/mochalib');
const { deepCheck } = require('@simpleview/assertlib');

const { TrainingPrefix } = require('@simpleview/rd-training-client');

const graphServer = new TrainingPrefix({
	graphUrl: 'http://localhost:4000',
});

const context = {};

describe('find_people', function () {
	before(async () => {
		await graphServer.insert_people({
			input: {
				people: [
					{
						first_name: 'FindPeopleTestFirstName',
						last_name: 'FindPeopleTestLastName',
					},
				],
			},
			fields: `
				success
			`,
		});

		context.person = await graphServer.find_people({
			input: {
				first_name: 'FindPeopleTestFirstName',
				last_name: 'FindPeopleTestLastName',
			},
			fields: `
				docs {
					id
				}
			`,
		});
	});

	after(async () => {
		if (context?.person?.docs?.length) {
			await graphServer.remove_people({
				input: {
					ids: context?.person?.docs?.map((doc) => (doc.id)),
				},
				fields: `
					success
				`,
			});
		}
	});

	const tests = [
		{
			name: 'valid find by id',
			args: {
				method: 'find_people',
				variables: (context) => ({
					id: context?.person?.docs?.[0]?.id,
				}),
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
							first_name: 'FindPeopleTestFirstName',
							last_name: 'FindPeopleTestLastName',
						},
					],
				},
			},
		},
		{
			name: 'valid find by first name',
			args: {
				method: 'find_people',
				variables: {
					first_name: 'FindPeopleTestFirstName',
				},
				fields: `
					docs {
						last_name
					}
				`,
				result: {
					docs: [
						{
							last_name: 'FindPeopleTestLastName',
						},
					],
				},
			},
		},
		{
			name: 'valid find by last name',
			args: {
				method: 'find_people',
				variables: {
					last_name: 'FindPeopleTestLastName',
				},
				fields: `
					docs {
						first_name
					}
				`,
				result: {
					docs: [
						{
							first_name: 'FindPeopleTestFirstName',
						},
					],
				},
			},
		},
		{
			name: 'valid find by first name, last name, and id',
			args: {
				method: 'find_people',
				variables: (context) => ({
					id: context?.person?.docs?.[0]?.id,
					first_name: 'FindPeopleTestFirstName',
					last_name: 'FindPeopleTestLastName',
				}),
				fields: `
					docs {
						last_name
					}
				`,
				result: {
					docs: [
						{
							last_name: 'FindPeopleTestLastName',
						},
					],
				},
			},
		},
		{
			name: 'invalid find by wrong first name',
			args: {
				method: 'find_people',
				variables: {
					first_name: 'FindPeopleTestFirstNameNOTEXIST',
				},
				fields: `
					docs {
						last_name
					}
				`,
				result: {
					docs: [],
				},
			},
		},
		{
			name: 'invalid find by last name wrong type',
			args: {
				method: 'find_people',
				variables: {
					last_name: 7,
				},
				fields: `
					docs {
						first_name
					}
				`,
				error:
					'Variable "$last_name" got invalid value 7; String cannot represent a non string value: 7',
			},
		},
		{
			name: 'invalid find by id wrong type',
			args: {
				method: 'find_people',
				variables: {
					id: '123',
				},
				fields: `
					docs {
						first_name
					}
				`,
				error:
					'Variable "$id" got invalid value "123"; Expected type "ObjectID". input must be a 24 character hex string, 12 byte Uint8Array, or an integer',
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

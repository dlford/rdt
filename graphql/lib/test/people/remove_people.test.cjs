const assert = require('assert');
const { testArray } = require('@simpleview/mochalib');
const { deepCheck } = require('@simpleview/assertlib');

const { TrainingPrefix } = require('@simpleview/rd-training-client');

const graphServer = new TrainingPrefix({
	graphUrl: 'http://localhost:4000',
});

const context = {};

describe('remove_people', function () {
	before(async () => {
		await graphServer.insert_people({
			input: {
				people: [
					{
						first_name: 'RemovePeopleTestFirstName',
						last_name: 'RemovePeopleTestLastName',
					},
				],
			},
			fields: `
				success
			`,
		});

		context.person = await graphServer.find_people({
			input: {
				first_name: 'RemovePeopleTestFirstName',
				last_name: 'RemovePeopleTestLastName',
			},
			fields: `
				docs {
					id
				}
			`,
		});
	});

	const tests = [
		{
			name: 'invalid bad id type',
			args: {
				method: 'remove_people',
				variables: {
					ids: ['123'],
				},
				fields: `
					success
				`,
				error:
					'Variable "$ids" got invalid value "123" at "ids[0]"; Expected type "ObjectID". input must be a 24 character hex string, 12 byte Uint8Array, or an integer',
			},
		},
		{
			name: 'invalid wrong id',
			args: {
				method: 'remove_people',
				variables: {
					ids: [{ id: '012345678910111213141516' }],
				},
				fields: `
					success
					message
				`,
				result: {
					success: true,
					message: 'Deleted 0 people',
				},
			},
		},
		{
			name: 'valid remove by id',
			args: {
				method: 'remove_people',
				variables: (context) => ({
					ids: context?.person?.docs?.map((doc) => ({
						id: doc.id,
					})),
				}),
				fields: `
					success
					message
				`,
				result: {
					success: true,
					message: 'Deleted 1 person',
				},
			},
		},
		{
			name: 'verify removed',
			args: {
				method: 'find_people',
				variables: (context) => ({
					id: context?.person?.docs?.[0]?.id,
				}),
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

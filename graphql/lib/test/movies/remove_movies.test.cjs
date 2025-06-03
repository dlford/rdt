const assert = require('assert');
const { testArray } = require('@simpleview/mochalib');
const { deepCheck } = require('@simpleview/assertlib');

const { TrainingPrefix } = require('@simpleview/rd-training-client');

const graphServer = new TrainingPrefix({
	graphUrl: 'http://localhost:4000',
});

const context = {};

describe('remove_movies', function () {
	before(async () => {
		await graphServer.insert_movies({
			input: {
				movies: [
					{
						title: 'RemoveMoviesTestTitle',
						release_date: '0001-01-01',
					},
				],
			},
			fields: `
				success
			`,
		});

		context.movie = await graphServer.find_movies({
			input: {
				title: 'RemoveMoviesTestTitle',
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
				method: 'remove_movies',
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
				method: 'remove_movies',
				variables: {
					ids: [{ id: '012345678910111213141516' }],
				},
				fields: `
					success
					message
				`,
				result: {
					success: true,
					message: 'Deleted 0 movies',
				},
			},
		},
		{
			name: 'valid remove by id',
			args: {
				method: 'remove_movies',
				variables: (context) => ({
					ids: context?.movie?.docs?.map((doc) => doc.id),
				}),
				fields: `
					success
					message
				`,
				result: {
					success: true,
					message: 'Deleted 1 movie',
				},
			},
		},
		{
			name: 'verify removed',
			args: {
				method: 'find_movies',
				variables: (context) => ({
					id: context?.movie?.docs?.[0]?.id,
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

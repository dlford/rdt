const assert = require('assert');
const { testArray } = require('@simpleview/mochalib');
const { deepCheck } = require('@simpleview/assertlib');

const { TrainingPrefix } = require('@simpleview/rd-training-client');

const graphServer = new TrainingPrefix({
	graphUrl: 'http://localhost:4000',
});

const context = {};

describe('find_movies', function () {
	before(async () => {
		await graphServer.insert_people({
			input: {
				people: [
					{
						first_name: 'FindMoviesTestFirstName',
						last_name: 'FindMoviesTestLastName',
					},
				],
			},
			fields: `
				success
			`,
		});

		context.person = await graphServer.find_people({
			input: {
				first_name: 'FindMoviesTestFirstName',
				last_name: 'FindMoviesTestLastName',
			},
			fields: `
				docs {
					id
				}
			`,
		});

		await graphServer.insert_movies({
			input: {
				movies: [
					{
						title: 'FindMoviesTestTitle',
						release_date: '0001-01-01',
						director_id: context.person?.docs?.[0]?.id,
						actor_ids: [context.person?.docs?.[0]?.id],
					},
				],
			},
			fields: `
				success
			`,
		});

		context.movie = await graphServer.find_movies({
			input: {
				title: 'FindMoviesTestTitle',
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
					ids: context?.person?.docs?.map((doc) => doc.id),
				},
				fields: `
					success
				`,
			});
		}

		if (context?.movie?.docs?.length) {
			await graphServer.remove_movies({
				input: {
					ids: context?.movie?.docs?.map((doc) => doc.id),
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
				method: 'find_movies',
				variables: (context) => ({
					id: context?.movie?.docs?.[0]?.id,
				}),
				fields: `
					docs {
						id
						title
						release_date
						director {
							id
							first_name
							last_name
						}
						director_id
						actors {
							id
							first_name
							last_name
						}
						actor_ids
					}
				`,
				result: {
					docs: [
						{
							id: { type: 'string' },
							title: 'FindMoviesTestTitle',
							release_date: '0001-01-01',
							director: {
								id: { type: 'string' },
								first_name: 'FindMoviesTestFirstName',
								last_name: 'FindMoviesTestLastName',
							},
							director_id: { type: 'string' },
							actors: [
								{
									id: { type: 'string' },
									first_name: 'FindMoviesTestFirstName',
									last_name: 'FindMoviesTestLastName',
								},
							],
							actor_ids: [{ type: 'string' }],
						},
					],
				},
			},
		},
		{
			name: 'valid find by title',
			args: {
				method: 'find_movies',
				variables: {
					title: 'FindMoviesTestTitle',
				},
				fields: `
					docs {
						release_date
					}
				`,
				result: {
					docs: [
						{
							release_date: '0001-01-01',
						},
					],
				},
			},
		},
		{
			name: 'valid find by release date',
			args: {
				method: 'find_movies',
				variables: {
					release_date: '0001-01-01',
				},
				fields: `
					docs {
						title
					}
				`,
				result: {
					docs: [
						{
							title: 'FindMoviesTestTitle',
						},
					],
				},
			},
		},
		{
			name: 'valid find by director id',
			args: {
				method: 'find_movies',
				variables: (context) => ({
					director_id: context?.person?.docs?.[0]?.id,
				}),
				fields: `
					docs {
						title
					}
				`,
				result: {
					docs: [
						{
							title: 'FindMoviesTestTitle',
						},
					],
				},
			},
		},
		{
			name: 'valid find by actor id',
			args: {
				method: 'find_movies',
				variables: (context) => ({
					actor_id: context?.person?.docs?.[0]?.id,
				}),
				fields: `
					docs {
						title
					}
				`,
				result: {
					docs: [
						{
							title: 'FindMoviesTestTitle',
						},
					],
				},
			},
		},
		{
			name: 'valid find by title, release date, director id, and actor id',
			args: {
				method: 'find_movies',
				variables: (context) => ({
					title: 'FindMoviesTestTitle',
					release_date: '0001-01-01',
					director_id: context?.person?.docs?.[0]?.id,
					actor_id: context?.person?.docs?.[0]?.id,
				}),
				fields: `
					docs {
						title
					}
				`,
				result: {
					docs: [
						{
							title: 'FindMoviesTestTitle',
						},
					],
				},
			},
		},
		{
			name: 'invalid find by wrong title',
			args: {
				method: 'find_movies',
				variables: {
					title: 'NonExistentTitle',
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
			name: 'invalid find by title wrong type',
			args: {
				method: 'find_movies',
				variables: {
					title: 12345,
				},
				fields: `
					docs {
						id
					}
				`,
				error:
					'Variable "$title" got invalid value 12345; String cannot represent a non string value: 12345',
			},
		},
		{
			name: 'invalid find by release date wrong format',
			args: {
				method: 'find_movies',
				variables: {
					release_date: '2023-01-01T00:00:00Z',
				},
				fields: `
					docs {
						id
					}
				`,
				error:
					'Variable "$release_date" got invalid value "2023-01-01T00:00:00Z"; Expected type "ISODateString". Not a valid ISO 8601 date string',
			},
		},
		{
			name: 'invalid find by id wrong type',
			args: {
				method: 'find_movies',
				variables: {
					id: '123',
				},
				fields: `
					docs {
						title
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

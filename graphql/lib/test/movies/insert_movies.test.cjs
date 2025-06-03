const assert = require('assert');
const { testArray } = require('@simpleview/mochalib');
const { deepCheck } = require('@simpleview/assertlib');

const { TrainingPrefix } = require('@simpleview/rd-training-client');

const graphServer = new TrainingPrefix({
	graphUrl: 'http://localhost:4000',
});

const context = {};

describe('insert_movies', function () {
	before(async () => {
		await graphServer.insert_people({
			input: {
				people: [
					{
						first_name: 'InsertMoviesTestFirstName',
						last_name: 'InsertMoviesTestLastName',
					},
				],
			},
			fields: `
				success
			`,
		});

		context.person = await graphServer.find_people({
			input: {
				first_name: 'InsertMoviesTestFirstName',
				last_name: 'InsertMoviesTestLastName',
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

		const movieQuery = await graphServer.find_movies({
			input: {
				title: 'InsertMoviesTestTitle',
			},
			fields: `
				docs {
					id
				}
			`,
		});

		if (movieQuery.docs.length) {
			await graphServer.remove_movies({
				input: {
					ids: movieQuery.docs.map((doc) => (doc.id)),
				},
				fields: `
					success
				`,
			});
		}
	});

	const tests = [
		{
			name: 'invalid missing title',
			args: {
				method: 'insert_movies',
				variables: {
					movies: [{ release_date: '2023-01-01' }],
				},
				fields: `
					success
				`,
				error:
					'Variable "$movies" got invalid value { release_date: "2023-01-01" } at "movies[0]"; Field "title" of required type "String!" was not provided.',
			},
		},
		{
			name: 'invalid missing release date',
			args: {
				method: 'insert_movies',
				variables: {
					movies: [{ title: 'InsertMoviesTestTitle' }],
				},
				fields: `
					success
				`,
				error:
					'Variable "$movies" got invalid value { title: "InsertMoviesTestTitle" } at "movies[0]"; Field "release_date" of required type "ISODateString!" was not provided.',
			},
		},
		{
			name: 'invalid bad title type',
			args: {
				method: 'insert_movies',
				variables: {
					movies: [{ title: 7, release_date: '2023-01-01' }],
				},
				fields: `
					success
				`,
				error:
					'Variable "$movies" got invalid value 7 at "movies[0].title"; String cannot represent a non string value: 7',
			},
		},
		{
			name: 'invalid bad release_date format',
			args: {
				method: 'insert_movies',
				variables: {
					movies: [
						{
							title: 'InsertMoviesTestTitle',
							release_date: '2023-01-01T00:00:00Z',
						},
					],
				},
				fields: `
					success
				`,
				error:
					'Variable "$movies" got invalid value "2023-01-01T00:00:00Z" at "movies[0].release_date"; Expected type "ISODateString". Not a valid ISO 8601 date string',
			},
		},
		{
			name: 'invalid bad release_date type',
			args: {
				method: 'insert_movies',
				variables: {
					movies: [
						{
							title: 'InsertMoviesTestTitle',
							release_date: 7,
						},
					],
				},
				fields: `
					success
				`,
				error:
					'Variable "$movies" got invalid value 7 at "movies[0].release_date"; Expected type "ISODateString". Not a valid ISO 8601 date string',
			},
		},
		{
			name: 'valid insert',
			args: {
				method: 'insert_movies',
				variables: (context) => ({
					movies: [
						{
							title: 'InsertMoviesTestTitle',
							release_date: '2023-01-01',
							director_id: context?.person?.docs?.[0]?.id,
							actor_ids: context?.person?.docs?.[0]?.id,
						},
					],
				}),
				fields: `
					success
					message
				`,
				result: {
					success: true,
					message: 'Added movies: InsertMoviesTestTitle',
				},
			},
		},
		{
			name: 'verify insert',
			args: {
				method: 'find_movies',
				variables: {
					title: 'InsertMoviesTestTitle',
				},
				fields: `
					success
					docs {
						id
						title
						release_date
						director_id
						actor_ids
						director {
							id
							first_name
							last_name
						}
						actors {
							id
							first_name
							last_name
						}
					}
				`,
				result: {
					success: true,
					docs: [
						{
							id: { type: 'string' },
							title: 'InsertMoviesTestTitle',
							release_date: '2023-01-01',
							director_id: { type: 'string' },
							actor_ids: [{ type: 'string' }],
							director: {
								id: { type: 'string' },
								first_name: 'InsertMoviesTestFirstName',
								last_name: 'InsertMoviesTestLastName',
							},
							actors: [
								{
									id: { type: 'string' },
									first_name: 'InsertMoviesTestFirstName',
									last_name: 'InsertMoviesTestLastName',
								},
							],
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

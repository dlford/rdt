const assert = require('assert');
const { testArray } = require('@simpleview/mochalib');
const { deepCheck } = require('@simpleview/assertlib');
const { ObjectId } = require('mongodb');

const { TrainingPrefix } = require('@simpleview/rd-training-client');

const graphServer = new TrainingPrefix({
	graphUrl: 'http://localhost:4000',
});

const testMovies = [
	{
		id: new ObjectId().toString(),
		title: 'RemoveMoviesTestTitle1',
		release_date: '0001-01-01',
	},
	{
		id: new ObjectId().toString(),
		title: 'RemoveMoviesTestTitle2',
		release_date: '0001-01-02',
	},
	{
		id: new ObjectId().toString(),
		title: 'RemoveMoviesTestTitle3',
		release_date: '0001-01-03',
	},
];

describe('remove_movies', function () {
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
				await graphServer.remove_movies({
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
			await graphServer.remove_movies({
				fields: 'success',
			});
			await graphServer.insert_movies({
				input: {
					movies: testMovies,
				},
				fields: `
					success
				`,
			});
		});

		const tests = [
			{
				name: 'remove no movies',
				args: {
					variables: {
						remove: {
							ids: [new ObjectId().toString()],
						},
					},
					result: {
						remove: {
							success: true,
							message: 'Deleted 0 movies',
						},
						find: {
							docs: testMovies.map((movie) => ({ id: movie.id })),
						},
					},
				},
			},
			{
				name: 'remove one movie',
				args: {
					variables: {
						remove: {
							ids: [testMovies[0].id],
						},
					},
					result: {
						remove: {
							success: true,
							message: 'Deleted 1 movie',
						},
						find: {
							docs: [
								{
									id: testMovies[1].id,
								},
								{
									id: testMovies[2].id,
								},
							],
						},
					},
				},
			},
			{
				name: 'remove two movies',
				args: {
					variables: {
						remove: {
							ids: [testMovies[0].id, testMovies[2].id],
						},
					},
					result: {
						remove: {
							success: true,
							message: 'Deleted 2 movies',
						},
						find: {
							docs: [
								{
									id: testMovies[1].id,
								},
							],
						},
					},
				},
			},
			{
				name: 'remove all movies',
				args: {
					variables: {
						remove: {
							ids: [],
						},
					},
					result: {
						remove: {
							success: true,
							message: 'Deleted 3 movies',
						},
						find: {
							docs: [],
						},
					},
				},
			},
		];

		testArray(tests, async (test) => {
			const remove = await graphServer.remove_movies({
				input: test.variables.remove,
				fields: `
					success
					message
				`,
			});
			deepCheck(remove, test.result.remove);

			const find = await graphServer.find_movies({
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

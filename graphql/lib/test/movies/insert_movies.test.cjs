const assert = require('assert');
const { testArray } = require('@simpleview/mochalib');
const { deepCheck } = require('@simpleview/assertlib');
const { ObjectId } = require('mongodb');

const { testPeople } = require('../testData.cjs');
const { TrainingPrefix } = require('@simpleview/rd-training-client');

const graphServer = new TrainingPrefix({
	graphUrl: 'http://localhost:4000',
});

describe('insert_movies', function () {
	describe('invalid inputs', function () {
		const tests = [
			{
				name: 'missing title',
				args: {
					variables: [{ release_date: '2023-01-01' }],
					error:
						'Variable "$movies" got invalid value { release_date: "2023-01-01" } at "movies[0]"; Field "title" of required type "String!" was not provided.',
				},
			},
			{
				name: 'missing release date',
				args: {
					variables: [{ title: 'InsertMoviesTestTitle' }],
					error:
						'Variable "$movies" got invalid value { title: "InsertMoviesTestTitle" } at "movies[0]"; Field "release_date" of required type "ISODateString!" was not provided.',
				},
			},
			{
				name: 'bad title type',
				args: {
					variables: [{ title: 7, release_date: '2023-01-01' }],
					error:
						'Variable "$movies" got invalid value 7 at "movies[0].title"; String cannot represent a non string value: 7',
				},
			},
			{
				name: 'bad release_date format',
				args: {
					variables: [
						{
							title: 'InsertMoviesTestTitle',
							release_date: '2023-01-01T00:00:00Z',
						},
					],
					error:
						'Variable "$movies" got invalid value "2023-01-01T00:00:00Z" at "movies[0].release_date"; Expected type "ISODateString". Not a valid ISO 8601 date string',
				},
			},
			{
				name: 'bad release_date type',
				args: {
					variables: [
						{
							title: 'InsertMoviesTestTitle',
							release_date: 7,
						},
					],
					error:
						'Variable "$movies" got invalid value 7 at "movies[0].release_date"; Expected type "ISODateString". Not a valid ISO 8601 date string',
				},
			},
		];

		testArray(tests, async (test) => {
			try {
				await graphServer.insert_movies({
					input: { movies: test.variables },
					fields: 'success',
				});
			} catch (err) {
				assert.strictEqual(err.message, test.error);
			}
		});
	});

	describe('valid inputs', function () {
		before(async () => {
			await graphServer.remove_people({
				fields: 'success',
			});
			await graphServer.insert_people({
				input: {
					people: [testPeople.one, testPeople.two, testPeople.three],
				},
				fields: 'success',
			});
		});

		const id = new ObjectId().toString();

		const tests = [
			{
				name: 'insert movies',
				args: {
					variables: {
						insert: [
							{
								id,
								title: 'InsertMoviesTestTitle',
								release_date: '2023-01-01',
								director_id: '000000000000000000000001',
								actor_ids: [
									'000000000000000000000002',
									'000000000000000000000003',
								],
							},
						],
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
							id
							director_id
							actor_ids
						`,
					},
					result: {
						insert: {
							success: true,
							message: 'Added movies: InsertMoviesTestTitle',
						},
						find: [
							{
								id,
								director_id: '000000000000000000000001',
								actor_ids: [
									'000000000000000000000002',
									'000000000000000000000003',
								],
							},
						],
					},
				},
			},
		];

		testArray(tests, async (test) => {
			const insert = await graphServer.insert_movies({
				input: { movies: test.variables.insert },
				fields: test.fields.insert,
			});
			deepCheck(insert, test.result.insert);

			const find = await graphServer.find_movies({
				input: test.variables.find,
				fields: `docs { ${test.fields.find} }`,
			});
			deepCheck(find.docs, test.result.find);
		});
	});
});

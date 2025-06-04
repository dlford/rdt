const assert = require('assert');
const { testArray } = require('@simpleview/mochalib');
const { deepCheck } = require('@simpleview/assertlib');
const { ObjectId } = require('mongodb');

const { TrainingPrefix } = require('@simpleview/rd-training-client');

const graphServer = new TrainingPrefix({
	graphUrl: 'http://localhost:4000',
});

const testPeople = [
	{
		id: new ObjectId().toString(),
		first_name: 'InsertMoviesTestFirstName1',
		last_name: 'InsertMoviesTestLastName1',
	},
	{
		id: new ObjectId().toString(),
		first_name: 'InsertMoviesTestFirstName2',
		last_name: 'InsertMoviesTestLastName2',
	},
	{
		id: new ObjectId().toString(),
		first_name: 'InsertMoviesTestFirstName3',
		last_name: 'InsertMoviesTestLastName3',
	},
];

describe('insert_movies', function () {
	describe('invalid inputs', function () {
		const tests = [
			{
				name: 'missing title',
				args: {
					variables: {
						movies: [{ release_date: '2023-01-01' }],
					},
					error:
						'Variable "$movies" got invalid value { release_date: "2023-01-01" } at "movies[0]"; Field "title" of required type "String!" was not provided.',
				},
			},
			{
				name: 'missing release date',
				args: {
					variables: {
						movies: [{ title: 'InsertMoviesTestTitle' }],
					},
					error:
						'Variable "$movies" got invalid value { title: "InsertMoviesTestTitle" } at "movies[0]"; Field "release_date" of required type "ISODateString!" was not provided.',
				},
			},
			{
				name: 'bad title type',
				args: {
					variables: {
						movies: [{ title: 7, release_date: '2023-01-01' }],
					},
					error:
						'Variable "$movies" got invalid value 7 at "movies[0].title"; String cannot represent a non string value: 7',
				},
			},
			{
				name: 'bad release_date format',
				args: {
					variables: {
						movies: [
							{
								title: 'InsertMoviesTestTitle',
								release_date: '2023-01-01T00:00:00Z',
							},
						],
					},
					error:
						'Variable "$movies" got invalid value "2023-01-01T00:00:00Z" at "movies[0].release_date"; Expected type "ISODateString". Not a valid ISO 8601 date string',
				},
			},
			{
				name: 'bad release_date type',
				args: {
					variables: {
						movies: [
							{
								title: 'InsertMoviesTestTitle',
								release_date: 7,
							},
						],
					},
					error:
						'Variable "$movies" got invalid value 7 at "movies[0].release_date"; Expected type "ISODateString". Not a valid ISO 8601 date string',
				},
			},
		];

		testArray(tests, async (test) => {
			try {
				await graphServer.insert_movies({
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
		before(async () => {
			await graphServer.insert_people({
				input: {
					people: testPeople,
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
						insert: {
							movies: [
								{
									id,
									title: 'InsertMoviesTestTitle',
									release_date: '2023-01-01',
									director_id: testPeople[0].id,
									actor_ids: [testPeople[1].id, testPeople[2].id],
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
								director_id
								actor_ids
							}
						`,
					},
					result: {
						insert: {
							success: true,
							message: 'Added movies: InsertMoviesTestTitle',
						},
						find: {
							docs: [
								{
									id,
									director_id: testPeople[0].id,
									actor_ids: [testPeople[1].id, testPeople[2].id],
								},
							],
						},
					},
				},
			},
		];

		testArray(tests, async (test) => {
			const insert = await graphServer.insert_movies({
				input: test.variables.insert,
				fields: test.fields.insert,
			});
			deepCheck(insert, test.result.insert);

			const find = await graphServer.find_movies({
				input: test.variables.find,
				fields: test.fields.find,
			});
			deepCheck(find, test.result.find);
		});
	});
});

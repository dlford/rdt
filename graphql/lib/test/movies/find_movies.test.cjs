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
		first_name: 'FindMoviesTestFirstName1',
		last_name: 'FindMoviesTestLastName1',
	},
	{
		id: new ObjectId().toString(),
		first_name: 'FindMoviesTestFirstName2',
		last_name: 'FindMoviesTestLastName2',
	},
	{
		id: new ObjectId().toString(),
		first_name: 'FindMoviesTestFirstName3',
		last_name: 'FindMoviesTestLastName3',
	},
];

const testMovies = [
	{
		id: new ObjectId().toString(),
		title: 'FindMoviesTestTitle1',
		release_date: '0001-01-01',
		director_id: testPeople[0].id,
		actor_ids: [testPeople[1].id, testPeople[2].id],
	},
	{
		id: new ObjectId().toString(),
		title: 'FindMoviesTestTitle2',
		release_date: '0001-01-02',
		director_id: testPeople[1].id,
		actor_ids: [testPeople[0].id, testPeople[2].id],
	},
	{
		id: new ObjectId().toString(),
		title: 'FindMoviesTestTitle3',
		release_date: '0001-01-03',
		director_id: testPeople[2].id,
		actor_ids: [testPeople[0].id, testPeople[1].id],
	},
];

describe('find_movies', function () {
	before(async () => {
		await graphServer.remove_people({
			fields: 'success',
		});
		await graphServer.remove_movies({
			fields: 'success',
		});
		await graphServer.insert_people({
			input: {
				people: testPeople,
			},
			fields: 'success',
		});
		await graphServer.insert_movies({
			input: {
				movies: testMovies,
			},
			fields: 'success',
		});
	});

	describe('invalid inputs', function () {
		const tests = [
			{
				name: 'find by title wrong type',
				args: {
					variables: {
						title: 12345,
					},
					error:
						'Variable "$title" got invalid value 12345; String cannot represent a non string value: 12345',
				},
			},
			{
				name: 'find by release date wrong format',
				args: {
					variables: {
						release_date: '2023-01-01T00:00:00Z',
					},
					error:
						'Variable "$release_date" got invalid value "2023-01-01T00:00:00Z"; Expected type "ISODateString". Not a valid ISO 8601 date string',
				},
			},
			{
				name: 'find by id wrong type',
				args: {
					variables: {
						id: '123',
					},
					error:
						'Variable "$id" got invalid value "123"; Expected type "ObjectID". input must be a 24 character hex string, 12 byte Uint8Array, or an integer',
				},
			},
		];

		testArray(tests, async (test) => {
			try {
				await graphServer.find_movies({
					input: test.variables,
					fields: `
						docs {
							id
						}
					`,
				});
			} catch (err) {
				assert.notStrictEqual(test.error, undefined, err);
				assert.strictEqual(err.message, test.error);
			}
		});
	});

	describe('valid inputs', function () {
		const tests = [
			{
				name: 'find with no results',
				args: {
					variables: {
						id: new ObjectId().toString(),
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
				name: 'find one movie by id',
				args: {
					variables: {
						id: testMovies[0].id,
					},
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
								...testMovies[0],
								director: testPeople[0],
								actors: [testPeople[1], testPeople[2]],
							},
						],
					},
				},
			},
			{
				name: 'find one movie by title',
				args: {
					variables: {
						title: testMovies[1].title,
					},
					fields: `
						docs {
							id
						}
					`,
					result: {
						docs: [
							{
								id: testMovies[1].id,
							},
						],
					},
				},
			},
			{
				name: 'find one movie by release date',
				args: {
					variables: {
						release_date: testMovies[2].release_date,
					},
					fields: `
						docs {
							id
						}
					`,
					result: {
						docs: [
							{
								id: testMovies[2].id,
							},
						],
					},
				},
			},
			{
				name: 'find one movie by director id',
				args: {
					variables: {
						director_id: testMovies[0].director_id,
					},
					fields: `
						docs {
							id
						}
					`,
					result: {
						docs: [
							{
								id: testMovies[0].id,
							},
						],
					},
				},
			},
			{
				name: 'find movies by actor id',
				args: {
					variables: {
						actor_id: testPeople[0].id,
					},
					fields: `
						docs {
							id
						}
					`,
					result: {
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
		];

		testArray(tests, async (test) => {
			const result = await graphServer.find_movies({
				input: test.variables,
				fields: test.fields,
			});
			deepCheck(result, test.result);
		});
	});
});

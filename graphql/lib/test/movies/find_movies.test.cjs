const assert = require('assert');
const { testArray } = require('@simpleview/mochalib');
const { deepCheck } = require('@simpleview/assertlib');
const { ObjectId } = require('mongodb');

const { testPeople, testMovies } = require('../testData.cjs');
const { TrainingPrefix } = require('@simpleview/rd-training-client');

const graphServer = new TrainingPrefix({
	graphUrl: 'http://localhost:4000',
});

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
				people: [testPeople.one, testPeople.two, testPeople.three],
			},
			fields: 'success',
		});
		await graphServer.insert_movies({
			input: {
				movies: [testMovies.one, testMovies.two, testMovies.three],
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
					fields: 'id',
					result: [],
				},
			},
			{
				name: 'find one movie by id',
				args: {
					variables: {
						id: '000000000000000000000004',
					},
					fields: `
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
					`,
					result: [
						{
							id: '000000000000000000000004',
							title: 'TestMovieTitle1',
							release_date: '0001-01-01',
							director_id: '000000000000000000000001',
							actor_ids: [
								'000000000000000000000002',
								'000000000000000000000003',
							],
							director: {
								id: '000000000000000000000001',
								first_name: 'TestPersonFirstName1',
								last_name: 'TestPersonLastName1',
							},
							actors: [
								{
									id: '000000000000000000000002',
									first_name: 'TestPersonFirstName2',
									last_name: 'TestPersonLastName2',
								},
								{
									id: '000000000000000000000003',
									first_name: 'TestPersonFirstName3',
									last_name: 'TestPersonLastName3',
								},
							],
						},
					],
				},
			},
			{
				name: 'find one movie by title',
				args: {
					variables: {
						title: 'TestMovieTitle2',
					},
					fields: 'id',
					result: [
						{
							id: '000000000000000000000005',
						},
					],
				},
			},
			{
				name: 'find one movie by release date',
				args: {
					variables: {
						release_date: '0003-03-03',
					},
					fields: 'id',
					result: [
						{
							id: '000000000000000000000006',
						},
					],
				},
			},
			{
				name: 'find one movie by director id',
				args: {
					variables: {
						director_id: '000000000000000000000001',
					},
					fields: 'id',
					result: [
						{
							id: '000000000000000000000004',
						},
					],
				},
			},
			{
				name: 'find movies by actor id',
				args: {
					variables: {
						actor_id: '000000000000000000000001',
					},
					fields: 'id',
					result: [
						{
							id: '000000000000000000000005',
						},
						{
							id: '000000000000000000000006',
						},
					],
				},
			},
		];

		testArray(tests, async (test) => {
			const result = await graphServer.find_movies({
				input: test.variables,
				fields: `docs { ${test.fields} }`,
			});
			deepCheck(result.docs, test.result);
		});
	});
});

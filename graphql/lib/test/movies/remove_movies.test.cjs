const assert = require('assert');
const { testArray } = require('@simpleview/mochalib');
const { deepCheck } = require('@simpleview/assertlib');
const { ObjectId } = require('mongodb');

const { testMovies } = require('../testData.cjs');
const { TrainingPrefix } = require('@simpleview/rd-training-client');

const graphServer = new TrainingPrefix({
	graphUrl: 'http://localhost:4000',
});

describe('remove_movies', function () {
	describe('invalid inputs', function () {
		const tests = [
			{
				name: 'bad id type',
				args: {
					variables: ['123'],
					error:
						'Variable "$ids" got invalid value "123" at "ids[0]"; Expected type "ObjectID". input must be a 24 character hex string, 12 byte Uint8Array, or an integer',
				},
			},
		];

		testArray(tests, async (test) => {
			try {
				await graphServer.remove_movies({
					input: { ids: test.variables },
					fields: 'success',
				});
			} catch (err) {
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
					movies: [testMovies.one, testMovies.two, testMovies.three],
				},
				fields: `
					success
				`,
			});
		});

		describe('response message', function () {
			const tests = [
				{
					name: 'remove no movies',
					args: {
						variables: [new ObjectId().toString()],
						result: {
							success: true,
							message: 'Deleted 0 movies',
						},
					},
				},
				{
					name: 'remove one movie',
					args: {
						variables: ['000000000000000000000004'],
						result: {
							success: true,
							message: 'Deleted 1 movie',
						},
					},
				},
				{
					name: 'remove two movies',
					args: {
						variables: [
							'000000000000000000000004',
							'000000000000000000000006',
						],
						result: {
							success: true,
							message: 'Deleted 2 movies',
						},
					},
				},
				{
					name: 'remove all movies',
					args: {
						variables: [],
						result: {
							success: true,
							message: 'Deleted 3 movies',
						},
					},
				},
			];

			testArray(tests, async (test) => {
				const remove = await graphServer.remove_movies({
					input: { ids: test.variables },
					fields: `
						success
						message
					`,
				});
				deepCheck(remove, test.result);
			});
		});

		describe('verify deleted with find', function () {
			const tests = [
				{
					name: 'remove no movies',
					args: {
						variables: [new ObjectId().toString()],
						result: [
							{
								id: '000000000000000000000004',
							},
							{
								id: '000000000000000000000005',
							},
							{
								id: '000000000000000000000006',
							},
						],
					},
				},
				{
					name: 'remove one movie',
					args: {
						variables: ['000000000000000000000004'],
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
				{
					name: 'remove two movies',
					args: {
						variables: [
							'000000000000000000000004',
							'000000000000000000000006',
						],
						result: [
							{
								id: '000000000000000000000005',
							},
						],
					},
				},
				{
					name: 'remove all movies',
					args: {
						variables: [],
						result: [],
					},
				},
			];

			testArray(tests, async (test) => {
				await graphServer.remove_movies({
					input: { ids: test.variables },
					fields: 'success',
				});

				const find = await graphServer.find_movies({
					fields: `
						docs {
							id
						}
					`,
				});
				deepCheck(find.docs, test.result);
			});
		});
	});
});

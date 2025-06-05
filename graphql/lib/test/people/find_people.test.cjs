const assert = require('assert');
const { testArray } = require('@simpleview/mochalib');
const { deepCheck } = require('@simpleview/assertlib');
const { ObjectId } = require('mongodb');

const { testPeople } = require('../testData.cjs');
const { TrainingPrefix } = require('@simpleview/rd-training-client');

const graphServer = new TrainingPrefix({
	graphUrl: 'http://localhost:4000',
});

describe('find_people', function () {
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

	describe('invalid inputs', function () {
		const tests = [
			{
				name: 'find by first name wrong type',
				args: {
					variables: {
						first_name: 7,
					},
					error:
						'Variable "$first_name" got invalid value 7; String cannot represent a non string value: 7',
				},
			},
			{
				name: 'find by last name wrong type',
				args: {
					variables: {
						last_name: 7,
					},
					error:
						'Variable "$last_name" got invalid value 7; String cannot represent a non string value: 7',
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
				await graphServer.find_people({
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
				name: 'find one person by id',
				args: {
					variables: {
						id: '000000000000000000000001',
					},
					fields: `
						id
						first_name
						last_name
					`,
					result: [
						{
							id: '000000000000000000000001',
							first_name: 'TestPersonFirstName1',
							last_name: 'TestPersonLastName1',
						},
					],
				},
			},
			{
				name: 'find one person by first name',
				args: {
					variables: {
						first_name: 'TestPersonFirstName2',
					},
					fields: 'id',
					result: [
						{
							id: '000000000000000000000002',
						},
					],
				},
			},
			{
				name: 'find one person by last name',
				args: {
					variables: {
						last_name: 'TestPersonLastName3',
					},
					fields: 'id',
					result: [
						{
							id: '000000000000000000000003',
						},
					],
				},
			},
			{
				name: 'find two people by first and last name',
				args: {
					variables: {
						first_name: 'TestPersonFirstName1',
						last_name: 'TestPersonLastName2',
					},
					fields: 'id',
					result: [
						{
							id: '000000000000000000000001',
						},
						{
							id: '000000000000000000000002',
						},
					],
				},
			},
		];

		testArray(tests, async (test) => {
			const result = await graphServer.find_people({
				input: test.variables,
				fields: `docs { ${test.fields} }`,
			});
			deepCheck(result.docs, test.result);
		});
	});
});

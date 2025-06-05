const testPeople = {
	one: {
		id: '000000000000000000000001',
		first_name: 'TestPersonFirstName1',
		last_name: 'TestPersonLastName1',
	},
	two: {
		id: '000000000000000000000002',
		first_name: 'TestPersonFirstName2',
		last_name: 'TestPersonLastName2',
	},
	three: {
		id: '000000000000000000000003',
		first_name: 'TestPersonFirstName3',
		last_name: 'TestPersonLastName3',
	},
};

const testMovies = {
	one: {
		id: '000000000000000000000004',
		title: 'TestMovieTitle1',
		release_date: '0001-01-01',
		director_id: '000000000000000000000001',
		actor_ids: ['000000000000000000000002', '000000000000000000000003'],
	},
	two: {
		id: '000000000000000000000005',
		title: 'TestMovieTitle2',
		release_date: '0002-02-02',
		director_id: '000000000000000000000002',
		actor_ids: ['000000000000000000000001', '000000000000000000000003'],
	},
	three: {
		id: '000000000000000000000006',
		title: 'TestMovieTitle3',
		release_date: '0003-03-03',
		director_id: '000000000000000000000003',
		actor_ids: ['000000000000000000000001', '000000000000000000000002'],
	},
};

module.exports = {
	testPeople,
	testMovies,
};

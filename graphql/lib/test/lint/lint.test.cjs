const { spawn } = require('child_process');

describe('lint', function () {
	it('passes linting', function () {
		this.timeout(10000);

		return new Promise((resolve, reject) => {
			const child = spawn('yarn', ['style']);

			child.stdout.on('data', (data) => {
				if (
					data.toString().includes('error') ||
					data.toString().includes('warning')
				) {
					reject(new Error(`Linting failed: ${data}`));
				}
			});

			child.stderr.on('data', (data) => {
				reject(new Error(`Linting failed: ${data}`));
			});

			child.on('close', (code) => {
				resolve(code);
			});
		});
	});
});

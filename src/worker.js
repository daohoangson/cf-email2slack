import PostalMime from 'postal-mime';

async function streamToArrayBuffer(stream, streamSize) {
	// https://github.com/edevil/email_worker_parser/blob/main/src/index.js
	let result = new Uint8Array(streamSize);
	let bytesRead = 0;
	const reader = stream.getReader();
	while (true) {
		const { done, value } = await reader.read();
		if (done) {
			break;
		}
		result.set(value, bytesRead);
		bytesRead += value.length;
	}
	return result;
}

export default {
	async email(message, env) {
		const rawEmail = await streamToArrayBuffer(message.raw, message.rawSize);
		const parser = new PostalMime();
		const parsedEmail = await parser.parse(rawEmail);

		const { from, to } = message;
		const { subject, html, text } = parsedEmail;
		const body = { from, to, subject, html, text };

		// https://hooks.slack.com/triggers/xxx/123/yyy
		await fetch(env.WEB_REQUEST_URL, {
			method: 'POST',
			body: JSON.stringify(body),
			headers: {
				'Content-Type': 'application/json',
			},
		});
	},
};

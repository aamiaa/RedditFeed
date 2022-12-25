require("dotenv").config();

const fs = require("fs");
const axios = require("axios");

const subreddit = "r/discordapp";
let lastPostId = "";

if(fs.existsSync("last.dat")) {
	lastPostId = fs.readFileSync("last.dat").toString();
}

function ProcessPost(post) {
	let embed = {
		title: `${subreddit} - ${post.title}`,
		description: post.selftext.substring(0, 512),
		url: `https://www.reddit.com${post.permalink}`,
		color: 0xFF5700,
		author: {
			name: `u/${post.author}`,
			url: `https://www.reddit.com/user/${post.author}`
		},
		image: post.thumbnail != "self" ? {
			url: post.url
		} : null,
	}

	return axios.post(`https://discordapp.com/api/webhooks/${process.env.WEBHOOK_ID}/${process.env.WEBHOOK_TOKEN}`, {
		embeds: [embed]
	});
}

async function main() {
	let response = await axios.get(`https://www.reddit.com/${subreddit}/new.json`);
	let posts = response.data.data.children;

	if(!lastPostId) {
		lastPostId = posts[0].data.name;
		return;
	}

	let toSend = [];

	for(let post of posts) {
		if(post.data.name == lastPostId) //have to use this because if someone deletes their post then the "before" get param breaks
			break;
		toSend.push(post.data);
	}

	if(toSend.length === 0)
		return;

	for(let post of toSend.reverse()) {
		console.log("Processing post", post.name, "-", post.title)
		await ProcessPost(post);
	}

	lastPostId = toSend.at(-1).name;
	fs.writeFileSync("last.dat", lastPostId);
}

main();
setInterval(main, 30 * 1000);
require("dotenv").config();

const fs = require("fs");
const axios = require("axios");

const subreddit = "r/discordapp";
let lastPost;

if(fs.existsSync("last.dat")) {
	lastPost = JSON.parse(fs.readFileSync("last.dat").toString());
}

function ProcessPost(post) {
	let embed = {
		title: `${subreddit} - ${post.title}`.substring(0, 256),
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

	if(!lastPost) {
		lastPost = {date: posts[0].data.created, id: posts[0].data.name};
		return;
	}

	let toSend = [];

	for(let post of posts) {
		if(post.data.name === lastPost.id || post.data.created <= lastPost.date){ //have to use this because if someone deletes their post then the "before" get param breaks, also <= is needed instead of < so that it doesn't spam if the last post id was deleted and there was another post created at the same second
			break;
		}
		toSend.push(post.data);
	}

	if(toSend.length === 0)
		return;

	for(let post of toSend.reverse()) {
		console.log("Processing post", post.name, "-", post.title)
		await ProcessPost(post);
	}

	lastPost = {date: toSend.at(-1).created, id: toSend.at(-1).name};
	fs.writeFileSync("last.dat", JSON.stringify(lastPost));
}

main();
setInterval(main, 30 * 1000);
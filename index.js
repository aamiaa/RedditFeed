require("dotenv").config();

const fs = require("fs");
const axios = require("axios");

const subreddit = "r/discordapp";
let lastPost;

if(fs.existsSync("last.dat")) {
	lastPost = JSON.parse(fs.readFileSync("last.dat").toString());
}

function sleep(ms) {
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
}

function GetImageUrl(post) {
	if(post.media_metadata) {
		let id;
		if(post.gallery_data) {
			id = post.gallery_data.items[0].media_id;
		} else {
			id = Object.keys(post.media_metadata)[0];
		}
		
		let data = post.media_metadata[id];

		let url;
		if(data.e === "Image") {
			url = data.s.u
		} else if(data.e === "AnimatedImage") {
			url = data.s.gif;
		} else {
			console.error("wtf is this image", data.e, post.name);
			return null;
		}
		url = url.replaceAll("&amp;", "&");
		return url;
	} else if(post?.preview?.images?.[0]?.source?.url) {
		return post.preview.images[0].source.url.replaceAll("&amp;", "&");
	} else if(post.thumbnail_width != undefined && post.thumbnail_height != undefined) {
		if(post.crosspost_parent_list) {
			return GetImageUrl(post.crosspost_parent_list[0])
		} else {
			return post.url;
		}
	} else {
		return null;
	}
}

async function ProcessPost(post) {
	let imageUrl = GetImageUrl(post);

	let embed = {
		title: `${subreddit} - ${post.title}`.substring(0, 256),
		description: post.selftext.substring(0, 512),
		url: `https://www.reddit.com${post.permalink}`,
		color: 0xFF5700,
		author: {
			name: `u/${post.author}`,
			url: `https://www.reddit.com/user/${post.author}`
		},
		image: imageUrl ? {
			url: imageUrl
		} : null
	}

	try {
		await axios.post(`https://discordapp.com/api/webhooks/${process.env.WEBHOOK_ID}/${process.env.WEBHOOK_TOKEN}`, {
			embeds: [embed]
		});
		await sleep(2000);
	} catch(ex) {
		console.error("Failed to send post", embed, "because", ex.response.data)
	}
}

async function main() {
	let response;
	try {
		response = await axios.get(`https://www.reddit.com/${subreddit}/new.json`);
	} catch(ex) {
		console.error("Got error", ex?.message || ex)
		return setTimeout(main, 60 * 1000);
	}
	let posts = response.data.data.children;

	if(!lastPost) {
		lastPost = {date: posts[0].data.created, id: posts[0].data.name};
		return setTimeout(main, 60 * 1000);
	}

	let toSend = [];

	for(let post of posts) {
		if(post.data.name === lastPost.id || post.data.created <= lastPost.date){ //have to use this because if someone deletes their post then the "before" get param breaks, also <= is needed instead of < so that it doesn't spam if the last post id was deleted and there was another post created at the same second
			break;
		}
		toSend.push(post.data);
	}

	if(toSend.length === 0)
		return setTimeout(main, 60 * 1000);

	for(let post of toSend.reverse()) {
		console.log("Processing post", post.name, "-", post.title)
		await ProcessPost(post);
	}

	lastPost = {date: toSend.at(-1).created, id: toSend.at(-1).name};
	fs.writeFileSync("last.dat", JSON.stringify(lastPost));

	setTimeout(main, 60 * 1000);
}

main();
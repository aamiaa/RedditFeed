import axios from "axios"
import { RedditPost } from "../reddit/post";
import { sleep } from "../util";

export async function sendPost(subreddit: string, post: RedditPost) {
	let content = post.content?.substring(0, 512) ?? ""
	if(post.has_gallery) {
		content += "\n\n[This post has an image gallery]"
	}
	const imageUrl = post.image_url ?? post.thumbnail_url

	const embed = {
		title: `${subreddit} - ${post.title.substring(0, 256)}`,
		description: content,
		url: post.link,
		color: 0xFF5700,
		author: {
			name: `u/${post.author_name}`,
			url: `https://www.reddit.com/user/${post.author_name}`
		},
		image: imageUrl ? {
			url: imageUrl
		} : null,
		timestamp: post.date.toISOString()
	}

	try {
		await axios.post(`https://discordapp.com/api/webhooks/${process.env.WEBHOOK_ID}/${process.env.WEBHOOK_TOKEN}`, {
			embeds: [embed]
		});
		await sleep(2000);
	} catch(ex: any) {
		console.error("Failed to send post", embed, "because", ex.response.data)
	}
}
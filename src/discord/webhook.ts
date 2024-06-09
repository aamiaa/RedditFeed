import axios from "axios"
import { RedditPost } from "../reddit/post";
import { sleep } from "../util";

export async function sendPost(subreddit: string, post: RedditPost) {
	const imageUrl = post.image_url ?? post.thumbnail_url

	const embed = {
		title: `${subreddit} - ${post.title.substring(0, 256)}`,
		description: post.content?.substring(0, 512),
		url: post.link,
		color: 0xFF5700,
		author: {
			name: `u/${post.author_name}`,
			url: `https://www.reddit.com/user/${post.author_name}`
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
	} catch(ex: any) {
		console.error("Failed to send post", embed, "because", ex.response.data)
	}
}
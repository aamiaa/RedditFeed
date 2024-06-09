import "dotenv/config"
import { getLastSavedPost, updateLastPost } from "./cache"
import { sendPost } from "./discord/webhook"
import { RedditPost, getPosts } from "./reddit/post"
import { sleep } from "./util"

const subreddit = "r/discordapp"

async function main() {
	console.log("Started!")
	
	while(true) {
		await sleep(60 * 1000)

		try {
			const posts = await getPosts(subreddit)

			const lastPost = getLastSavedPost()
			if(!lastPost) {
				updateLastPost(posts[0])
				continue
			}

			const toSend: RedditPost[] = []
			for(const post of posts) {
				if(post.id === lastPost.id || post.date <= lastPost.date) {
					break
				}

				toSend.push(post)
			}

			if(toSend.length === 0) {
				continue
			}

			for(const post of toSend.reverse()) {
				console.log("Processing post", post.id, "-", post.title)
				await sendPost(subreddit, post)
			}

			updateLastPost(posts[0])
		} catch(ex) {
			console.error("Error:", ex)
		}

	}
}
main()
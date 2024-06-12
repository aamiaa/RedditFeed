import axios from "axios"
import {XMLParser} from "fast-xml-parser"
import {parse} from "node-html-parser"

interface RedditRSSRoot {
	feed: {
		entry: RedditRSSEntry[]
	}
}

interface RedditRSSEntry {
	author: {
		name: string,
		uri: string
	},
	category: {
		"@_term": string,
		"@_label": string
	},
	content: {
		"#text": string,
		"@_type": string
	},
	id: string,
	media_thumbnail?: {
		"@_url": string
	},
	link: {
		"@_href": string
	},
	updated: string,
	published: string,
	title: string
}

export interface RedditPost {
	id: string,

	author_name: string,
	title: string,
	content?: string,

	image_url?: string, // i.redd.it or preview.redd.it extracted from content html
	thumbnail_url?: string, // preview.redd.it or thumbs.redditmedia.com, usually small resolution resolution
	has_gallery: boolean,
	link: string,
	date: Date
}

export function parseRedditPost(entry: RedditRSSEntry): RedditPost {
	const contentDOM = parse(entry.content["#text"])

	const authorName = entry.author.name.match(/^\/u\/(.+)$/)?.[1] ?? "(Unknown)"
	const contentText = contentDOM.querySelector(".md")?.text

	const links = contentDOM.querySelectorAll("a[href]").map(x => {
		const urlStr = x.getAttribute("href") as string

		// In case of cross-posts, the href attribute might just be a path
		// ex. <a href="/r/somesub">
		try {
			const url = new URL(urlStr)
			return {
				url,
				urlStr,
				host: url.hostname,
			}
		} catch(ex) {
			return null
		}
	}).filter(x => x != null)

	const imageLink = links.find(x => x.host === "i.redd.it") ?? links.find(x => x.host === "preview.redd.it")
	const hasGallery = links.find(x => x.host === "www.reddit.com" && x.url.pathname.startsWith("/gallery/"))

	return {
		id: entry.id,
		author_name: authorName,
		title: entry.title,
		content: contentText,
		image_url: imageLink?.urlStr,
		thumbnail_url: entry.media_thumbnail?.["@_url"],
		has_gallery: !!hasGallery,
		link: entry.link["@_href"],
		date: new Date(entry.published)
	}
}

export async function getPosts(subreddit: string): Promise<RedditPost[]> {
	const res = await axios.get(`https://www.reddit.com/${subreddit}/new.rss?sort=new`)
	const obj: RedditRSSRoot = new XMLParser({
		ignoreAttributes: false,
		updateTag(tagName, jPath, attrs) {
			if(tagName === "media:thumbnail") {
				return "media_thumbnail"
			}
			return true
		},
	}).parse(res.data)

	return obj.feed.entry.map(parseRedditPost)
}
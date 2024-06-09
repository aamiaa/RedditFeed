import fs from "fs"
import path from "path"

const cachePath = path.join(__dirname, "..", "cache.json")

export interface LastPost {
	id: string,
	date: Date
}

export function getLastSavedPost(): LastPost | null {
	if(!fs.existsSync(cachePath)) {
		return null
	}

	const post = JSON.parse(fs.readFileSync(cachePath).toString())
	post.date = new Date(post.date)
	return post
}

export function updateLastPost(post: LastPost) {
	fs.writeFileSync(cachePath, JSON.stringify(post))
}
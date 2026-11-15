import fs from 'fs'
import path from 'path'
import { getAllPosts } from '@/lib/notion'
import { generateRss } from '@/lib/rss'

// Static export cannot use getServerSideProps, so the RSS feed is generated
// once at build time and written to public/feed.xml (copied to out/ by postbuild).
export async function getStaticProps () {
  const posts = await getAllPosts({ includePages: false })
  const latestPosts = posts.slice(0, 10)
  const xmlFeed = await generateRss(latestPosts)
  fs.writeFileSync(path.join(process.cwd(), 'public', 'feed.xml'), xmlFeed)
  return {
    props: {}
  }
}
const feed = () => null
export default feed

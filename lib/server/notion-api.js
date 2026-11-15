import { NotionAPI } from 'notion-client'

const { NOTION_ACCESS_TOKEN } = process.env

const client = new NotionAPI({ authToken: NOTION_ACCESS_TOKEN })

// Notion's unofficial API rejects got's default User-Agent with 403.
// Inject a browser User-Agent on every request (same fix as ssm's gotOptions).
const BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

function unwrapRecordMap(recordMap) {
  if (!recordMap || typeof recordMap !== 'object') return recordMap
  for (const table of Object.keys(recordMap)) {
    const entries = recordMap[table]
    if (!entries || typeof entries !== 'object') continue
    for (const id of Object.keys(entries)) {
      const entry = entries[id]
      const v = entry?.value
      // Public (unauthenticated) fetches return each record wrapped as
      // { value: <record>, role: <role> }; notion-client expects the
      // record directly at entry.value, so unwrap one level.
      if (v && typeof v === 'object' && v.value && typeof v.value === 'object' && 'role' in v) {
        entry.value = v.value
      }
    }
  }
  return recordMap
}

const origFetch = client.fetch.bind(client)
client.fetch = async ({ endpoint, body, gotOptions = {}, headers = {} }) => {
  // Notion rate-limits shared build IPs (429) when the build fetches the
  // whole database plus every post body in one burst — same as jb.
  // Retry with backoff: 8 attempts, 2s base doubling, + up to 1s jitter.
  const maxAttempts = 8
  let lastErr
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await origFetch({
        endpoint,
        body,
        headers,
        gotOptions: {
          ...gotOptions,
          headers: { 'User-Agent': BROWSER_UA, ...gotOptions.headers }
        }
      })
      if (res && res.recordMap) {
        res.recordMap = unwrapRecordMap(res.recordMap)
      }
      return res
    } catch (err) {
      lastErr = err
      const status = err?.response?.statusCode
      const retryable = status === 429 || (status >= 500 && status < 600)
      if (!retryable || attempt === maxAttempts) throw err
      const delay = 2000 * Math.pow(2, attempt - 1) + Math.random() * 1000
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  throw lastErr
}

export default client

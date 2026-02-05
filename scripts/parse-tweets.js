#!/usr/bin/env node
// Parse Twitter MCP search response files into structured tweet data.
// Usage: node scripts/parse-tweets.js <path-to-temp-file.json>
// Output: JSON to stdout: { cursor: string|null, tweets: [...] }

const fs = require('fs');

const file = process.argv[2];
if (!file) {
  console.error('Usage: node scripts/parse-tweets.js <file>');
  process.exit(1);
}

const raw = fs.readFileSync(file, 'utf-8');

// Outer wrapper: [{ "type": "text", "text": "<JSON string>" }]
let inner;
try {
  const outer = JSON.parse(raw);
  const text = Array.isArray(outer) ? outer[0].text : outer.text || raw;
  inner = typeof text === 'string' ? JSON.parse(text) : text;
} catch {
  // Maybe the file is already the inner JSON
  inner = JSON.parse(raw);
}

// Find the TimelineAddEntries instruction
const instructions = inner.result?.timeline?.instructions || [];
const addEntries = instructions.find(i => i.type === 'TimelineAddEntries');
const entries = addEntries?.entries || [];

// Extract cursor
const cursorEntry = entries.find(e => e.entryId?.startsWith('cursor-bottom'));
const cursor = inner.cursor?.bottom || cursorEntry?.content?.value || null;

// Extract tweets
const tweets = [];
for (const entry of entries) {
  if (entry.entryId?.startsWith('cursor-')) continue;

  let result = entry.content?.itemContent?.tweet_results?.result;
  if (!result) continue;

  // Handle TweetWithVisibilityResults wrapper
  if (result.__typename === 'TweetWithVisibilityResults') {
    result = result.tweet;
  }
  if (!result?.legacy) continue;

  const legacy = result.legacy;
  const userLegacy = result.core?.user_results?.result?.legacy || {};

  const mediaArr =
    legacy.extended_entities?.media || legacy.entities?.media || [];

  tweets.push({
    tweet_id: result.rest_id || entry.entryId?.replace('tweet-', ''),
    author_username: userLegacy.screen_name || '',
    author_name: userLegacy.name || '',
    full_text: legacy.full_text || '',
    created_at: legacy.created_at || '',
    favorite_count: legacy.favorite_count ?? 0,
    retweet_count: legacy.retweet_count ?? 0,
    reply_count: legacy.reply_count ?? 0,
    quote_count: legacy.quote_count ?? 0,
    in_reply_to_screen_name: legacy.in_reply_to_screen_name || null,
    lang: legacy.lang || '',
    media_type: mediaArr[0]?.type || 'none',
    is_reply: !!legacy.in_reply_to_screen_name,
    is_retweet: (legacy.full_text || '').startsWith('RT @'),
  });
}

console.log(JSON.stringify({ cursor, tweets }, null, 2));

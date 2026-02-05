---
name: init
description: Initialize user profile by analyzing Twitter history. Usage: /init "username"
user-invocable: true
---

# Profile Initializer

Fetch a Twitter user's info and tweets, build a persona profile for future post generation.

## Input

Twitter username: `$ARGUMENTS`

If no username provided, check `~/.x-agent/config.json` for `twitter.username`.

## Instructions

### Step 1: Fetch User Info

Call MCP tool **Get_User_By_Username** with the target username.

The response JSON structure:

```
result.data.user.result:
  .rest_id                          → user ID (string)
  .core.name                        → display name
  .core.screen_name                 → username
  .core.created_at                  → account creation date
  .is_blue_verified                 → boolean
  .legacy.description               → bio text
  .legacy.followers_count           → follower count
  .legacy.friends_count             → following count
  .legacy.statuses_count            → total tweet count
  .legacy.favourites_count          → total likes given
  .legacy.media_count               → media posts count
  .location.location                → location string
  .professional.professional_type   → e.g. "Creator"
  .professional.category            → category array
```

Extract and hold: `rest_id`, display name, bio, location, followers/following, tweet count, verified status, join date, professional type.

### Step 2: Fetch Tweets

**IMPORTANT:** Do NOT use `Get_User_Tweets` — it fails because large `rest_id` values lose precision when passed as numbers. Use **Search_Twitter** as the workaround.

Call **Search_Twitter** with:
- `query`: `from:<username>` (e.g., `from:thuwyh`)
- `type`: `Latest`
- `count`: `20`

Paginate up to 3 pages (target ~60 tweets). For each subsequent page, pass the `cursor` value from the previous response (see parsing below).

#### Parsing Search Results

The MCP response may be very large and get saved to a temporary file. If that happens, use a **subagent** (Task tool with `general-purpose` type) to read and extract the data from that file.

The response is a JSON array with one element:

```
[{ "type": "text", "text": "<JSON string>" }]
```

Parse the inner JSON string. Its structure:

```json
{
  "cursor": {
    "bottom": "DAAD...",   // ← use this as `cursor` param for next page
    "top": "DAAD..."
  },
  "result": {
    "timeline": {
      "instructions": [
        {
          "type": "TimelineAddEntries",
          "entries": [ ... ]   // ← tweet entries + cursor entries
        }
      ]
    }
  },
  "status": "ok"
}
```

Each **tweet entry** in `entries` has this shape:

```
entryId: "tweet-XXXXX"
content:
  entryType: "TimelineTimelineItem"
  itemContent:
    tweet_results:
      result:
        rest_id: "..."                              → tweet ID
        legacy:
          full_text: "..."                          → tweet text (★)
          created_at: "Thu Feb 05 03:30:49 +0000 2026"  → date (★)
          favorite_count: 0                         → likes (★)
          retweet_count: 0                          → RTs (★)
          reply_count: 0                            → replies (★)
          quote_count: 0                            → quotes (★)
          in_reply_to_screen_name: "..." | absent   → reply target
          entities.media[].type: "photo"/"video"    → media type
          extended_entities.media[].type             → (prefer this over entities)
```

**Cursor entries** at the end of `entries`:

```
entryId: "cursor-bottom-0"
content:
  value: "DAAD..."    → pass as `cursor` param for next page
```

**Alternatively**, use `cursor.bottom` from the top-level response — both work.

#### Skip these entries:
- Entries with empty `tweet_results` (deleted/unavailable tweets)
- Entries where `entryId` starts with `cursor-` (pagination cursors)

#### Pagination loop:

```
page = 1
all_tweets = []
cursor = None

while page <= 3:
    response = Search_Twitter(query="from:<username>", type="Latest", count=20, cursor=cursor)
    parse response → extract tweets, append to all_tweets
    cursor = response.cursor.bottom (or cursor-bottom entry)
    if no cursor or no new tweets: break
    page += 1
```

For each tweet, extract into a structured record:
- `full_text`, `created_at`, `favorite_count`, `retweet_count`, `reply_count`, `quote_count`
- `is_reply`: true if `in_reply_to_screen_name` exists
- `is_retweet`: true if `full_text` starts with "RT @"
- `media_type`: from `extended_entities.media[0].type` or `entities.media[0].type`, else "none"

### Step 3: Save Raw Tweets

Create directory `~/.x-agent/tweets/` if it doesn't exist.

Save to `~/.x-agent/tweets/[username]-YYYY-MM-DD.md`:

```markdown
# Tweets Archive - @username
Fetched: YYYY-MM-DD HH:MM

## Tweet Stats
- Total fetched: XX
- Date range: YYYY-MM-DD to YYYY-MM-DD

---

### [YYYY-MM-DD HH:MM]
> Tweet full text here

- Likes: XX | RTs: XX | Replies: XX | Quotes: XX
- Media: none / photo / video / link

---

(repeat for each tweet)
```

### Step 4: Analyze & Build Profile

Analyze all fetched tweets to extract the persona. Focus on **original content tweets** (filter out pure retweets and short replies like "nice", "cool", single-emoji).

Study these dimensions:

**Writing Style:**
- Average tweet length (characters)
- Sentence structure (short & punchy vs. long & detailed)
- Use of line breaks / formatting
- Punctuation habits (exclamation marks, ellipsis, em dash, etc.)

**Voice & Tone:**
- Formal vs. casual
- Serious vs. humorous
- Confident vs. humble
- Provocative vs. neutral

**Content Patterns:**
- Top 5 recurring topics/themes
- Emoji usage frequency and which emojis
- Hashtag usage frequency and style
- URL/link sharing frequency
- Does the user share threads? How often?

**Hook Patterns:**
- How do their popular tweets start? (first 5-10 words)
- Common opening patterns (e.g., "Hot take:", "Unpopular opinion:", a question, a bold statement)
- What gets the most engagement?

**Engagement Insights:**
- Average likes per tweet
- Top 5 most-liked tweets (quote them)
- What topics/formats drive the most engagement
- Posting frequency (tweets per day/week)

**Language:**
- Primary language
- Use of slang, jargon, or technical terms
- Code-switching between languages (if any)

### Step 5: Save Profile

Save to `~/.x-agent/profile.md`:

```markdown
# User Profile - @username

> One-line persona summary

Initialized: YYYY-MM-DD
Source: XX tweets analyzed

## Basic Info

| Field | Value |
|-------|-------|
| Name | ... |
| Bio | ... |
| Location | ... |
| Followers | ... |
| Following | ... |
| Tweets | ... |
| Joined | ... |
| Verified | ... |

## Persona Summary

[2-3 paragraph description of who this person is, what they care about,
and how they communicate. Written as a character brief that can guide
future content generation.]

## Writing Style

- **Tone:** [e.g., Casual, slightly provocative, confident]
- **Length:** [e.g., Short and punchy, avg 120 chars]
- **Structure:** [e.g., Two-liner with a hook + punchline]
- **Emoji:** [e.g., Rare, ~1 per 5 tweets, mostly 🚀 and 🔥]
- **Hashtags:** [e.g., Almost never / 1-2 per tweet / heavy]
- **Punctuation:** [e.g., Loves em dashes, rarely uses exclamation marks]
- **Language:** [e.g., English, occasionally mixes in Chinese]

## Content Themes

1. [Theme 1] - frequency & example
2. [Theme 2] - frequency & example
3. [Theme 3] - frequency & example
4. [Theme 4] - frequency & example
5. [Theme 5] - frequency & example

## Hook Patterns

Common openers that work well:
1. "[pattern]" — used N times, avg XX likes
2. "[pattern]" — used N times, avg XX likes
3. "[pattern]" — used N times, avg XX likes

## Top Performing Tweets

1. [XX likes] "tweet text..."
2. [XX likes] "tweet text..."
3. [XX likes] "tweet text..."
4. [XX likes] "tweet text..."
5. [XX likes] "tweet text..."

## Engagement Stats

- **Avg likes/tweet:** XX
- **Avg RTs/tweet:** XX
- **Posting frequency:** ~X tweets/week
- **Peak topics:** [what drives most engagement]

## Style Rules for Content Generation

Based on the analysis, when generating content as this user:

1. [Rule 1 - e.g., "Keep tweets under 200 chars, two lines max"]
2. [Rule 2 - e.g., "Open with a bold claim or hot take"]
3. [Rule 3 - e.g., "End with a question to drive replies"]
4. [Rule 4 - e.g., "Avoid hashtags unless topic is trending"]
5. [Rule 5 - e.g., "Use 🚀 emoji sparingly for launch/growth topics"]
6. [More rules as needed]
```

### Step 6: Update Config

Update `~/.x-agent/config.json`:
- Set `twitter.username` to the initialized username
- Set `twitter.rest_id` to the user's rest_id

If the file doesn't exist, create it with these values.

### Step 7: Confirm to User

Display a summary:

```
Profile initialized for @username

Stats:
- Fetched XX tweets (YYYY-MM-DD to YYYY-MM-DD)
- Avg XX likes/tweet, ~X tweets/week

Persona:
[One-line persona summary]

Style:
[Key style traits, 2-3 bullet points]

Files saved:
- ~/.x-agent/profile.md (persona & style guide)
- ~/.x-agent/tweets/[username]-YYYY-MM-DD.md (raw tweets)
- ~/.x-agent/config.json (updated)

Run /twitter to generate posts matching this profile.
```

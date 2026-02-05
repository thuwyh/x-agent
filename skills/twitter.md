---
name: twitter
description: Generate social media posts (X + Threads). Usage: /twitter "topic" or just /twitter
user-invocable: true
---

# Social Post Generator

Generate posts for X (Twitter) and Threads in one go.

## Input

Topic or idea: `$ARGUMENTS`

## Available Data Sources

The user may have configured:
- **Twitter API** - User's tweets, trends, search
- **RSS Feeds** - Custom information sources (tech blogs, news, etc.)

## Instructions

### Step 1: Gather Topic

**If topic provided:**
- Use it as the main theme

**If no topic:**
- Check `./data/ideas/` for recent ideas
- Fetch Twitter trends
- Fetch RSS feeds for inspiration
- Let user choose or suggest

### Step 2: Research & Persist

1. **Fetch user's recent tweets** (Twitter API)
   - Get last 20-50 tweets
   - Analyze: tone, emoji, hashtags, sentence structure, hooks
   - Save to `./data/research/YYYY-MM-DD-style.md`

2. **Fetch RSS feeds** (if configured)
   - Pull recent articles from user's feeds
   - Extract relevant content for the topic
   - Save to `./data/research/YYYY-MM-DD-rss.md`

3. **Search related tweets** (Twitter API)
   - Find popular tweets on the topic
   - Note what works: hooks, formats, angles
   - Save to `./data/research/YYYY-MM-DD-[topic].md`

4. **Check trends** (Twitter API)
   - Current trending topics
   - Relevance to user's topic
   - Save to `./data/research/YYYY-MM-DD-trends.md`

### Step 3: Generate Posts

**X (Twitter) version** - Primary:
- Under 280 characters
- Match user's style exactly
- Strong hook
- Hashtags per user's typical usage

**Threads version** - Adapted:
- Up to 500 characters
- More conversational, expand on the idea
- Fewer/no hashtags
- Can add context that doesn't fit in X

### Step 4: Output

```
𝕏 Twitter (280 chars)
━━━━━━━━━━━━━━━━━━━━
[Tweet here]

Characters: XXX/280
```

```
Threads (500 chars)
━━━━━━━━━━━━━━━━━━━━
[Threads post here]

Characters: XXX/500
```

**Style notes:** [How this matches user's voice]

**Alternatives (X):**
1. [Different hook]
2. [Different angle]

### Step 5: Save

Append to `./data/posts/YYYY-MM-DD.md`:

```markdown
## [HH:MM] Topic: [topic]

### X (Twitter)
[tweet]

### Threads
[threads post]

### Alternatives
1. ...
2. ...

---
```

## Data Persistence

All fetched data saved to `./data/research/`:
- `YYYY-MM-DD-style.md` - User style analysis
- `YYYY-MM-DD-rss.md` - RSS feed content
- `YYYY-MM-DD-[topic].md` - Topic research
- `YYYY-MM-DD-trends.md` - Trending topics

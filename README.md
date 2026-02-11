# x-agent

[中文文档](./README_CN.md)

[Claude Code](https://docs.anthropic.com/en/docs/claude-code) skills for generating social media posts (X + Threads) that match your personal voice and style.

## Features

- **Profile Init**: Analyze a Twitter user's history to build a persona profile
- **Idea Management**: Record ideas with timestamps, organized by week
- **Style Learning**: Analyze your Twitter history to match your voice
- **Multi-source Research**: Twitter trends, search, and custom RSS feeds
- **Dual Output**: Generate X and Threads versions in one go
- **Batch Comments**: Find tweets worth commenting on and generate value-adding comments at scale

## Quick Start

```bash
# 1. Install Claude Code (requires Node.js)
npm install -g @anthropic-ai/claude-code

# 2. Clone and enter the project
git clone https://github.com/thuwyh/x-agent.git
cd x-agent

# 3. Add Twitter MCP server (get your API key from RapidAPI first — see below)
claude mcp add Twttr_API \
  -s project \
  -- npx mcp-remote https://mcp.rapidapi.com \
  --header "x-api-host: twitter241.p.rapidapi.com" \
  --header "x-api-key: YOUR_RAPIDAPI_KEY"

# 4. Set up your config
mkdir -p data
cp config.example.json data/config.json
# Edit data/config.json — set your Twitter username

# 5. Start Claude Code and initialize your profile
claude
> /setup-account "your_twitter_username"
```

After `/setup-account` completes, you can use `/twitter`, `/idea`, and `/comment`.

## Prerequisites

### Claude Code

This project runs as a set of [Claude Code](https://docs.anthropic.com/en/docs/claude-code) skills — prompt-based tools that Claude Code executes directly. You need Claude Code installed:

```bash
npm install -g @anthropic-ai/claude-code
```

### Twitter API (MCP Server)

Skills access Twitter data through an MCP (Model Context Protocol) server. We use [Twitter241 on RapidAPI](https://rapidapi.com/davethebeast/api/twitter241):

1. Sign up at [RapidAPI](https://rapidapi.com/) and subscribe to [Twitter241](https://rapidapi.com/davethebeast/api/twitter241) (has a free tier)
2. Copy your RapidAPI key from the dashboard
3. Add the MCP server to this project:

```bash
claude mcp add Twttr_API \
  -s project \
  -- npx mcp-remote https://mcp.rapidapi.com \
  --header "x-api-host: twitter241.p.rapidapi.com" \
  --header "x-api-key: YOUR_RAPIDAPI_KEY"
```

This creates a `.mcp.json` file in the project directory. You can also create it manually:

```json
{
  "mcpServers": {
    "Twttr_API": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "https://mcp.rapidapi.com",
        "--header",
        "x-api-host: twitter241.p.rapidapi.com",
        "--header",
        "x-api-key: YOUR_RAPIDAPI_KEY"
      ]
    }
  }
}
```

The skills reference these MCP tools:
- `Get_User_By_Username` — fetch user profile
- `Search_Twitter` — search tweets (used with `from:username` to fetch a user's tweets)
- `Get_Trends_By_Location` — trending topics
- `Get_User_Following_IDs` — get IDs of accounts a user follows
- `Get_Users_By_IDs` — bulk lookup user profiles by IDs
- `Get_List_Timeline` — fetch recent tweets from a Twitter List

### RSS Feeds (Optional)

Add RSS feeds to `./data/config.json` for additional content sources:

```json
{
  "active": "your_username",
  "accounts": {
    "your_username": { "rest_id": "123456789" }
  },
  "rss_feeds": [
    {"name": "Hacker News", "url": "https://hnrss.org/frontpage"},
    {"name": "TechCrunch", "url": "https://techcrunch.com/feed/"}
  ]
}
```

## Usage

All commands run inside Claude Code (`claude` in your terminal), from the project directory.

### Initialize Profile

```
/setup-account "username"    # Analyze a Twitter user and build persona
```

Fetches user info + tweets, builds a style profile, saves to `./data/<username>/profile.md` and archives tweets to `./data/<username>/tweets/`.

### Record an Idea

```
/idea "Your idea here"
```

Saved to `./data/ideas/YYYY-WXX.md` (by week).

### Generate Posts

```
/twitter "topic"     # With specific topic
/twitter             # Auto-discover from trends/RSS/ideas
```

Output:
```
𝕏 Twitter (280 chars)
━━━━━━━━━━━━━━━━━━━━
Your tweet here

Characters: 142/280

Threads (500 chars)
━━━━━━━━━━━━━━━━━━━━
Expanded version for Threads with more context...

Characters: 287/500
```

### Generate Comments

```
/comment              # Auto-discover from followings + profile topics
/comment "AI agents"  # Search by topic
/comment "@karpathy"  # Target a specific user's tweets
/comment "list"       # Comment on tweets from your configured Twitter Lists
/comment "list:ID"    # Comment on tweets from a specific Twitter List by ID
```

Output:
```
1/15 | @author · 2h ago · 12 likes
───
"Original tweet text..."

Comment [Experience Share]:
Your generated comment here...

URL: https://x.com/author/status/TWEET_ID
───
```

Each batch generates ~15 comments. Run multiple times to scale up. Comments are appended to `./data/<username>/comments/YYYY-MM-DD.md` with batch numbering.

**List mode** fetches tweets from [Twitter Lists](https://help.x.com/en/using-x/x-lists) — curated groups of accounts. To use `/comment "list"`, add list IDs to your account config in `./data/config.json`:

```json
{
  "active": "your_username",
  "accounts": {
    "your_username": {
      "rest_id": "123456789",
      "lists": ["1585430245762441216", "1238730743569772544"]
    }
  }
}
```

Or use `/comment "list:1585430245762441216"` to target a specific list directly without config.

## Data Structure

All runtime data lives in `./data/` (git-ignored):

```
./data/
├── config.json              # Shared config: active account, accounts map, RSS feeds
├── <username>/              # Per-account data directory
│   ├── profile.md           # User persona & style guide (generated by /setup-account)
│   ├── ideas/               # Recorded ideas (by week)
│   │   └── 2025-W05.md
│   ├── tweets/              # Archived tweets (raw data)
│   │   └── username-2025-01-30.md
│   ├── research/            # Fetched data
│   │   ├── 2025-01-30-style.md
│   │   ├── 2025-01-30-rss.md
│   │   ├── 2025-01-30-trends.md
│   │   └── 2025-01-30-ai.md
│   ├── posts/               # Generated posts
│   │   └── 2025-01-30.md
│   └── comments/            # Generated comments (by date, append per batch)
│       └── 2025-01-30.md
└── <other_user>/            # Another account's data
    └── ...
```

## Skills

| Skill | Description |
|-------|-------------|
| `/setup-account` | Initialize user profile from Twitter history |
| `/idea` | Record an idea with timestamp |
| `/twitter` | Generate X + Threads posts |
| `/comment` | Find tweets & generate value-adding comments (auto/topic/user/list modes) |
| `/switch` | Switch active account for multi-account support |

## License

MIT

# x-agent

Claude Code skills for generating social media posts (X + Threads) with your personal style.

## Features

- **Profile Init**: Analyze a Twitter user's history to build a persona profile
- **Idea Management**: Record ideas with timestamps, organized by week
- **Style Learning**: Analyze your Twitter history to match your voice
- **Multi-source Research**: Twitter trends, search, and custom RSS feeds
- **Dual Output**: Generate X and Threads versions in one go

## Prerequisites

### Twitter API (MCP Server)

This project needs a Twitter API MCP server. We use [Twitter241 on RapidAPI](https://rapidapi.com/davethebeast/api/twitter241) as an example — any MCP server that provides equivalent endpoints (`Get User By Username`, `Search Twitter`, etc.) will work.

Example MCP configuration (in `~/.claude/settings.json` or project `.mcp.json`):

```json
{
  "mcpServers": {
    "Twttr_API": {
      "url": "https://mcp.composio.dev/partner/composio/...",
      "type": "sse"
    }
  }
}
```

You can also use any other Twitter MCP provider or wrap the RapidAPI directly. The skills reference these MCP tools:
- `Get_User_By_Username` — fetch user profile
- `Search_Twitter` — search tweets (used with `from:username` to fetch a user's tweets)
- `Get_Trends_By_Location` — trending topics

### RSS Feeds (Optional)

Create `~/.x-agent/config.json`:

```json
{
  "twitter": {
    "username": "your_username"
  },
  "rss_feeds": [
    {"name": "Hacker News", "url": "https://hnrss.org/frontpage"},
    {"name": "TechCrunch", "url": "https://techcrunch.com/feed/"}
  ]
}
```

## Installation

```bash
git clone https://github.com/YOUR_USERNAME/x-agent.git
cp -r x-agent/skills/* ~/.claude/skills/
mkdir -p ~/.x-agent/{ideas,research,posts}
```

## Usage

### Initialize Profile

```
/init "username"    # Analyze a Twitter user and build persona
```

Fetches user info + tweets → builds a style profile → saves to `~/.x-agent/profile.md` and archives tweets to `~/.x-agent/tweets/`.

### Record an Idea

```
/idea "Your idea here"
```

Saved to `~/.x-agent/ideas/YYYY-WXX.md` (by week).

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

## Data Structure

```
~/.x-agent/
├── config.json         # Your settings & RSS feeds
├── profile.md          # User persona & style guide
├── ideas/              # Recorded ideas (by week)
│   └── 2025-W05.md
├── tweets/             # Archived tweets (raw data)
│   └── username-2025-01-30.md
├── research/           # Fetched data
│   ├── 2025-01-30-style.md
│   ├── 2025-01-30-rss.md
│   ├── 2025-01-30-trends.md
│   └── 2025-01-30-ai.md
└── posts/              # Generated posts
    └── 2025-01-30.md
```

## Skills

| Skill | Description |
|-------|-------------|
| `/init` | Initialize user profile from Twitter history |
| `/idea` | Record an idea with timestamp |
| `/twitter` | Generate X + Threads posts |

## License

MIT

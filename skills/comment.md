---
name: comment
description: Find tweets worth commenting on and generate value-adding comments. Usage: /comment, /comment "topic", or /comment "@username"
user-invocable: true
---

# Comment Generator

Find tweets worth engaging with and generate thoughtful, value-adding comments at scale.

## Input

Arguments: `$ARGUMENTS`

## Modes

Determine mode from arguments:

- **No arguments** → **Auto mode**: discover tweets from followed accounts + profile topics
- **Starts with `@`** (e.g., `@karpathy`) → **User mode**: find tweets from a specific user
- **Otherwise** → **Topic mode**: search tweets by topic keyword

## Instructions

### Step 0: Load Configuration

1. Read `./data/config.json` → extract the `active` username and its `rest_id` from `accounts[active]`
2. Read `./data/<active>/profile.md` → extract:
   - Top 5 content themes from the "Content Themes" section
   - Persona summary and style rules for voice matching
3. If either file is missing, tell the user to run `/setup-account "username"` first and stop.

### Step 1: Get Following Sample (Auto mode & Topic mode only)

Skip this step in User mode.

1. Call **Get_User_Following_IDs** with:
   - `username`: the authenticated user's username (from config)
   - `count`: `500`

2. From the returned IDs, randomly sample ~20 IDs.

3. Call **Get_Users_By_IDs** with the sampled IDs (comma-separated string).

   Response structure:
   ```
   result[].legacy:
     .screen_name      → username
     .name             → display name
     .description      → bio text
     .followers_count  → follower count
   ```

4. Score each user's bio against the authenticated user's content themes. Select the **8-10 most relevant** accounts (highest topic overlap).

5. Store these as `relevant_followings` (list of screen_names).

**Fallback:** If `Get_User_Following_IDs` fails, use **Get_User_Followings** with `user` = rest_id from `accounts[active]` in config, `count` = 20.

### Step 2: Search Tweets

Use **Search_Twitter** for all searches. The response parsing follows the same structure as `skills/setup-account.md` Step 2.

**IMPORTANT:** MCP responses may be very large and get saved to a temporary file. When this happens, run the parsing script to extract structured data:

```
node ./scripts/parse-tweets.js /path/to/temp-file.json
```

This outputs `{ "cursor": "...", "tweets": [...] }` with all fields pre-extracted.

#### Response structure reminder

```
Parsed inner JSON:
├── cursor.bottom          → pagination cursor
├── result.timeline.instructions[0].entries[]
│   ├── tweet entries (entryId: "tweet-XXX")
│   │   └── content.itemContent.tweet_results.result
│   │       ├── rest_id                                    → tweet ID
│   │       ├── core.user_results.result.legacy
│   │       │   ├── screen_name                            → author username (★)
│   │       │   └── name                                   → author display name
│   │       └── legacy
│   │           ├── full_text                              → tweet text (★)
│   │           ├── created_at                             → timestamp (★)
│   │           ├── favorite_count                         → likes (★)
│   │           ├── retweet_count                          → RTs
│   │           ├── reply_count                            → replies (★)
│   │           ├── quote_count                            → quotes
│   │           ├── in_reply_to_screen_name                → reply target (★ for filtering)
│   │           ├── lang                                   → language code (★ for language matching)
│   │           └── extended_entities.media[].type          → media type
│   └── cursor entries (entryId: "cursor-bottom-0")
│       └── content.value                                  → next page cursor
```

#### Auto mode searches:

1. **Following searches:** For each of the 8-10 `relevant_followings`, search:
   - `query`: `from:<screen_name>`
   - `type`: `Latest`
   - `count`: `5`

2. **Topic searches:** Pick 2-3 of the most distinctive content themes from the profile. For each:
   - `query`: the theme keyword/phrase
   - `type`: `Top`
   - `count`: `10`

Run all searches in parallel. Parse any temp files with `node ./scripts/parse-tweets.js <file>`.

#### Topic mode searches:

- `query`: the provided topic
- `type`: `Top`
- `count`: `20`
- Paginate: 2 pages (~40 tweets)

#### User mode searches:

- `query`: `from:<username>` (strip the `@` prefix)
- `type`: `Latest`
- `count`: `20`
- Paginate: 2 pages (~40 tweets)

### Step 3: Filter & Rank

For each tweet, extract a record:

```
{
  tweet_id, author_screen_name, author_name, full_text, created_at,
  favorite_count, reply_count, retweet_count, quote_count,
  is_reply, is_retweet, lang,
  hours_ago (computed from created_at vs now)
}
```

#### Hard filters — EXCLUDE tweets that:

- Are replies (`in_reply_to_screen_name` exists)
- Are retweets (`full_text` starts with "RT @")
- Are from the authenticated user themselves
- Are older than 48 hours
- Have `full_text` shorter than 30 characters

#### Soft ranking — score remaining tweets:

| Signal | Score |
|--------|-------|
| Author is in `relevant_followings` | +3 |
| 5–100 likes (sweet spot for visibility) | +2 |
| 1–10 replies (active discussion, not crowded) | +2 |
| Posted < 12 hours ago | +2 |
| Posted 12–24 hours ago | +1 |
| Topic overlaps with profile content themes | +2 |
| `full_text` length > 100 characters | +1 |

Sort by score descending. Apply diversity cap: **max 3 tweets per author**.

Select **top 15** tweets.

### Step 4: Generate Comments

For each selected tweet, generate a comment using one of 6 types. Rotate types across the batch to maintain variety:

| Type | Target per batch | Description |
|------|-----------------|-------------|
| **Experience Share** | 3-4 | Share a relevant personal experience that validates or extends the author's point |
| **Insightful Question** | 2-3 | Ask a thought-provoking question that advances the discussion |
| **Complementary Data** | 2-3 | Add a specific example, data point, or case study the author didn't mention |
| **Reframe/Extension** | 2-3 | Extend the idea to a new domain or angle the author didn't cover |
| **Practical Tip** | 1-2 | Offer a concrete, actionable suggestion related to the topic |
| **Appreciation + Why** | 1-2 | Explain specifically why this perspective is valuable (not generic praise) |

#### Comment generation rules:

1. **SHORT — 硬性限制 ≤ 200 字符（英文）/ ≤ 100 字（中文）**: 这是最重要的规则。Twitter 评论不是博客，没人读长评论。1 句话为主，最多 2 短句。写完后数字符数，超了就砍。宁可少说一点也不要啰嗦。
2. **Altruistic value**: 提供真实价值，但用最少的字。禁止空泛赞美（"Great post!", "Love this!", "So true!"）。
3. **Conversational tone**: 像朋友之间随口说的话，不是在写文章。禁止 hook pattern（"Hot take:", "Unpopular opinion:"），禁止 self-promotional links，禁止 "As someone who..."。
4. **Language matching**: Match the language of the original tweet:
   - If `lang` is "zh" or the content is primarily Chinese → write in Chinese
   - If `lang` is "en" or the content is primarily English → write in English
   - If `lang` is "ja" → write in Japanese
   - Default to English for other languages
5. **No emoji, no hashtags** in comments.
6. **Specific to the tweet**: 必须引用推文中的具体内容，不能套用到任何推文的模板。
7. **Match persona voice**: Use the style and expertise areas from `./data/<active>/profile.md` to inform the perspective, but don't be formulaic about it.
8. **消除 AI 痕迹 — 这条规则的优先级最高，必须严格遵守：**

   **禁止使用的标点和格式：**
   - 禁止 em dash（—）和中文破折号（——）。用逗号、句号或改写句子代替。这是最明显的 AI 生成标志。
   - 禁止英文短破折号（ – ，即 en dash）用于插入语。
   - 禁止分号（;）和中文分号（；）连接句子。口语里没人这么说话。
   - 禁止冒号（:）用于解释说明（如 "The reason: ..."）。直接写成两句话。
   - 禁止省略号（...／……）用于营造"深意"或停顿感。

   **禁止使用的 AI 高频词（英文）：**
   - 动词：delve, embark, leverage, utilize, navigate, unpack, foster, amplify, streamline
   - 形容词：crucial, robust, pivotal, groundbreaking, remarkable, game-changing, seamless, comprehensive, cutting-edge
   - 名词：landscape, realm, paradigm, tapestry, journey, beacon, testament, synergy, ecosystem (when not literally about ecology)
   - 过渡词：Furthermore, Moreover, Additionally, Notably, It's worth noting, In essence, At its core
   - 短语：double-edged sword, deep dive, the reality is, at the end of the day, from a broader perspective

   **禁止使用的 AI 高频词（中文）：**
   - 值得注意的是、不可否认、从本质上来说、归根结底、毋庸置疑、与此同时、众所周知
   - 赋能、驱动、颠覆、生态、抓手、底层逻辑、认知升级、降维打击

   **写作风格要求：**
   - 句子长度要有变化（burstiness）：混合短句和稍长的句子，不要每句长度都差不多
   - 用简单直接的词代替华丽的词：use → 不写 utilize，important → 不写 crucial，start → 不写 embark
   - 允许不完美：可以用口语化的省略、断句、甚至语法上不那么"正确"但更自然的表达
   - 不要每句都过渡得很圆滑，真人评论经常直接跳到重点

#### Good vs bad examples:

**Bad** (too long, 310 chars):
> The active parameter efficiency here is remarkable. For context, this means you could theoretically run 7 Coder-Next instances for the cost of one 235B inference pass -- that's a massive win for agent-heavy workflows where you need many parallel coding tasks rather than one giant reasoning chain.

**Good** (concise, 95 chars):
> 1/7 the active params for the same score — agent parallelism just got way cheaper with this.

**Bad** (too long, 280 chars):
> This stagnation phase is the exact point where most solo founders quit. When we launched nbot.ai, we hit that same wall around month 3 -- initial sign-ups plateaued and churn crept up. The unlock was obsessively tracking which specific feature kept the sticky users around.

**Good** (concise, 120 chars):
> Hit this exact wall at month 3 with nbot. The unlock was finding the one sticky feature and doubling down on just that.

### Step 5: Display Output

Display each comment in this format:

```
1/15 | @author · 2h ago · 12 likes
───
"Original tweet text here (truncated to 200 chars if longer)..."

Comment [Experience Share]:
Your generated comment text here...

URL: https://x.com/author/status/TWEET_ID
───
```

After all comments, display a summary:

```
───────────────────
Summary
───────────────────
Generated: 15 comments
Sources: 6 from followings, 9 from topic search
Languages: 12 EN, 3 ZH
Types: 4 Experience Share, 3 Question, 3 Data, 2 Reframe, 2 Tip, 1 Appreciation
Today's progress: 15/50
───────────────────
```

The "Today's progress" count should include comments from earlier batches today. Read `./data/<active>/comments/YYYY-MM-DD.md` to count existing comments if the file exists.

### Step 6: Save to File

Create directory `./data/<active>/comments/` if it doesn't exist.

**Append** to `./data/<active>/comments/YYYY-MM-DD.md`.

Determine the batch number:
- If the file doesn't exist, this is Batch 1
- If the file exists, read it, find the highest `## Batch N` number, and increment

Format:

```markdown
## Batch N — HH:MM

Mode: auto / topic: "AI agents" / user: @karpathy

### 1. @author · TWEET_ID

**Original:**
> Tweet full text here

**Comment** [Experience Share]:
Your comment text here

**URL:** https://x.com/author/status/TWEET_ID

---

### 2. @author · TWEET_ID

(repeat for each comment)

---

**Batch summary:** 15 comments | 12 EN, 3 ZH | Sources: 6 followings, 9 search

---
```

If this is the first batch of the day, add a file header before Batch 1:

```markdown
# Comments — YYYY-MM-DD

```

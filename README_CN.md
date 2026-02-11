# x-agent

[English](./README.md)

基于 [Claude Code](https://docs.anthropic.com/en/docs/claude-code) 的社交媒体内容生成工具，可以学习你的个人风格，自动生成 X (Twitter) 和 Threads 帖子。

## 功能特性

- **风格学习**：分析你的 Twitter 历史，建立个人风格档案
- **创意管理**：随时记录灵感，按周自动归档
- **多源研究**：整合 Twitter 热点、搜索结果和 RSS 订阅源
- **双平台输出**：一次生成 X 和 Threads 两个版本
- **批量评论**：自动发现值得互动的推文，批量生成高质量评论
- **多账号支持**：支持多个 Twitter 账号，随时切换

## 快速开始

```bash
# 1. 安装 Claude Code（需要 Node.js）
npm install -g @anthropic-ai/claude-code

# 2. 克隆项目
git clone https://github.com/thuwyh/x-agent.git
cd x-agent

# 3. 添加 Twitter MCP 服务器（需要先从 RapidAPI 获取 API Key，见下文）
claude mcp add Twttr_API \
  -s project \
  -- npx mcp-remote https://mcp.rapidapi.com \
  --header "x-api-host: twitter241.p.rapidapi.com" \
  --header "x-api-key: 你的_RAPIDAPI_KEY"

# 4. 配置
mkdir -p data
cp config.example.json data/config.json
# 编辑 data/config.json，填入你的 Twitter 用户名

# 5. 启动 Claude Code 并初始化个人档案
claude
> /setup-account "你的Twitter用户名"
```

完成 `/setup-account` 后，就可以使用 `/twitter`、`/idea` 和 `/comment` 了。

## 前置条件

### Claude Code

本项目以 [Claude Code](https://docs.anthropic.com/en/docs/claude-code) 技能（Skills）的形式运行——这是一种基于提示词的工具，由 Claude Code 直接执行。你需要先安装 Claude Code：

```bash
npm install -g @anthropic-ai/claude-code
```

### Twitter API（MCP 服务器）

技能通过 MCP（Model Context Protocol）服务器访问 Twitter 数据。我们使用 [RapidAPI 上的 Twitter241](https://rapidapi.com/davethebeast/api/twitter241)：

1. 在 [RapidAPI](https://rapidapi.com/) 注册账号并订阅 [Twitter241](https://rapidapi.com/davethebeast/api/twitter241)（有免费额度）
2. 从控制台复制你的 RapidAPI Key
3. 将 MCP 服务器添加到项目：

```bash
claude mcp add Twttr_API \
  -s project \
  -- npx mcp-remote https://mcp.rapidapi.com \
  --header "x-api-host: twitter241.p.rapidapi.com" \
  --header "x-api-key: 你的_RAPIDAPI_KEY"
```

这会在项目目录下创建一个 `.mcp.json` 文件。你也可以手动创建：

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
        "x-api-key: 你的_RAPIDAPI_KEY"
      ]
    }
  }
}
```

### RSS 订阅（可选）

在 `./data/config.json` 中添加 RSS 源，作为额外的内容来源：

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

## 使用方法

所有命令都在项目目录下的 Claude Code 中运行（终端输入 `claude`）。

### 初始化个人档案

```
/setup-account "username"    # 分析 Twitter 用户并建立风格档案
```

获取用户信息和推文，生成风格档案，保存到 `./data/<username>/profile.md`，同时归档推文到 `./data/<username>/tweets/`。

### 记录灵感

```
/idea "你的想法"
```

保存到 `./data/<active>/ideas/YYYY-WXX.md`（按周归档）。

### 生成帖子

```
/twitter "话题"     # 指定话题
/twitter             # 从热点/RSS/灵感中自动发现
```

输出示例：
```
𝕏 Twitter (280 chars)
━━━━━━━━━━━━━━━━━━━━
你的推文内容

Characters: 142/280

Threads (500 chars)
━━━━━━━━━━━━━━━━━━━━
适合 Threads 的扩展版本...

Characters: 287/500
```

### 生成评论

```
/comment              # 自动发现：从关注列表 + 个人主题中寻找值得评论的推文
/comment "AI agents"  # 按话题搜索
/comment "@karpathy"  # 针对特定用户的推文
/comment "list"       # 从已配置的 Twitter 列表中获取推文并评论
/comment "list:ID"    # 从指定 ID 的 Twitter 列表中获取推文并评论
```

输出示例：
```
1/15 | @author · 2h ago · 12 likes
───
"原始推文内容..."

Comment [Experience Share]:
你生成的评论...

URL: https://x.com/author/status/TWEET_ID
───
```

每批生成约 15 条评论，可多次运行批量生产。评论追加保存到 `./data/<username>/comments/YYYY-MM-DD.md`，按批次编号。

#### 列表模式

**列表模式**可以从 [Twitter 列表](https://help.x.com/en/using-x/x-lists)（你关注的精选账号分组）中获取推文进行评论。

使用 `/comment "list"` 前，需要在 `./data/config.json` 中配置列表 ID：

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

也可以直接指定列表 ID：`/comment "list:1585430245762441216"`，无需在配置文件中预设。

### 切换账号

```
/switch "username"    # 切换当前活跃账号
```

## 数据结构

所有运行数据保存在 `./data/` 目录下（已加入 .gitignore）：

```
./data/
├── config.json              # 共享配置：活跃账号、账号映射、RSS 订阅
├── <username>/              # 每个账号独立的数据目录
│   ├── profile.md           # 个人风格档案（/setup-account 生成）
│   ├── ideas/               # 灵感记录（按周）
│   │   └── 2025-W05.md
│   ├── tweets/              # 推文归档（原始数据）
│   │   └── username-2025-01-30.md
│   ├── research/            # 研究资料
│   │   ├── 2025-01-30-style.md
│   │   ├── 2025-01-30-rss.md
│   │   ├── 2025-01-30-trends.md
│   │   └── 2025-01-30-ai.md
│   ├── posts/               # 生成的帖子
│   │   └── 2025-01-30.md
│   └── comments/            # 生成的评论（按天，每批追加）
│       └── 2025-01-30.md
└── <other_user>/            # 其他账号的数据
    └── ...
```

## 技能一览

| 技能 | 说明 |
|------|------|
| `/setup-account` | 从 Twitter 历史初始化用户风格档案 |
| `/idea` | 记录带时间戳的灵感 |
| `/twitter` | 生成 X + Threads 帖子 |
| `/comment` | 发现推文并生成高质量评论（自动/话题/用户/列表四种模式） |
| `/switch` | 切换活跃账号（多账号支持） |

## 许可证

MIT

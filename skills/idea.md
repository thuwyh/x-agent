---
name: idea
description: Record an idea for future posts. Usage: /idea "your idea"
user-invocable: true
---

# Idea Recorder

Record and persist user ideas for future content creation.

## Task

Record the following idea: `$ARGUMENTS`

## Instructions

0. **Load Configuration**
   - Read `./data/config.json` → extract the `active` username
   - If config is missing or no active account, tell the user to run `/setup-account "username"` first and stop.

1. **Get Current Time**
   - Get the current date and time
   - Calculate the ISO week number (format: YYYY-WXX)

2. **Determine File Path**
   - Ideas are stored in: `./data/<active>/ideas/`
   - File name format: `YYYY-WXX.md` (e.g., `2025-W05.md`)

3. **Read or Create File**
   - If the weekly file exists, read its content
   - If not, create it with a header: `# Ideas - Week XX, YYYY`

4. **Append the Idea**
   Format:
   ```
   ## [YYYY-MM-DD HH:MM]

   [User's idea here]

   ---
   ```

5. **Save the File**
   - Write the updated content back to the file

6. **Confirm to User**
   - Show the recorded idea
   - Show the file location
   - Show how many ideas are in this week's file

## Example Output

```
Recorded idea to ./data/<active>/ideas/2025-W05.md

## [2025-01-30 14:32]

AI agents that help you write social media posts

---

This is idea #3 for this week.
```

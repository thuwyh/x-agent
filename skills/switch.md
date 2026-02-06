---
name: switch
description: Switch active account for multi-account support. Usage: /switch "username"
user-invocable: true
---

# Account Switcher

Switch the active Twitter account for all skills.

## Input

Username to switch to: `$ARGUMENTS`

## Instructions

### Step 1: Validate Input

If no username provided, read `./data/config.json` and list all available accounts from the `accounts` map. Show which one is currently active. Then stop.

### Step 2: Check Account Exists

Check if `./data/<username>/profile.md` exists.

- If **not found**: tell the user this account hasn't been initialized yet and suggest running `/setup-account "<username>"` first. Stop.
- If **found**: continue to Step 3.

### Step 3: Update Config

Read `./data/config.json`, set `active` to the provided username, and write it back. Preserve all other fields.

### Step 4: Confirm

Display:

```
Switched active account to @username

Profile: ./data/<username>/profile.md
```

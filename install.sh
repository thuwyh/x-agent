#!/bin/bash
# Install skills from ./skills/ into .claude/skills/ for Claude Code to discover.
# Uses symlinks so ./skills/ remains the source of truth.
# Safe to re-run — removes stale links and recreates them.

set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
SKILLS_SRC="$REPO_DIR/skills"
SKILLS_DST="$REPO_DIR/.claude/skills"

if [ ! -d "$SKILLS_SRC" ]; then
  echo "Error: $SKILLS_SRC not found"
  exit 1
fi

count=0
for src in "$SKILLS_SRC"/*.md; do
  [ -f "$src" ] || continue
  name="$(basename "$src" .md)"
  dst_dir="$SKILLS_DST/$name"
  dst_file="$dst_dir/SKILL.md"

  mkdir -p "$dst_dir"

  # Remove existing file/symlink before creating
  [ -e "$dst_file" ] || [ -L "$dst_file" ] && rm "$dst_file"

  ln -s "$src" "$dst_file"
  echo "  ✓ /$name → $dst_file"
  count=$((count + 1))
done

echo ""
echo "Installed $count skill(s). Restart Claude Code to pick them up."

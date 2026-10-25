"""Claude Code PreToolUse hook: run preflight before a real `git push` only.

The settings `if: Bash(git push*)` matcher also fired for unrelated commands it
could not parse (any `$VAR` or `$(...)`), and it ran the session checkout's
preflight rather than the pushed worktree's. This hook reads the tool input
itself, so every other command passes untouched, and preflight runs in the
worktree that `git -C <dir>` or the command's working directory names.
"""

from __future__ import annotations

import json
import shlex
import subprocess
import sys
from pathlib import Path

DENY_REASON = (
    "preflight failed. Run scripts/preflight.sh from the pushed worktree to see "
    "the output, then fix it before pushing."
)
# Words that end one shell command and start the next.
SEPARATORS = {"&&", "||", ";", "|", "&", "(", ")"}


def push_directory(command: str, cwd: str) -> Path | None:
    """Return the directory a `git push` in `command` runs in, else None."""
    try:
        lexer = shlex.shlex(command, posix=True, punctuation_chars=True)
        lexer.whitespace_split = True
        words = list(lexer)
    except ValueError:
        return None
    directory = Path(cwd)
    index = 0
    while index < len(words):
        word = words[index]
        if word == "cd" and index + 1 < len(words):
            directory = directory / words[index + 1]
            index += 2
            continue
        if word == "git" and (index == 0 or words[index - 1] in SEPARATORS):
            git_directory = directory
            cursor = index + 1
            while cursor < len(words) and words[cursor].startswith("-"):
                option = words[cursor]
                if option in {"-C", "-c"} and cursor + 1 < len(words):
                    if option == "-C":
                        git_directory = git_directory / words[cursor + 1]
                    cursor += 2
                    continue
                cursor += 1
            if cursor < len(words) and words[cursor] == "push":
                return git_directory
        index += 1
    return None


def main() -> int:
    try:
        payload = json.load(sys.stdin)
    except json.JSONDecodeError:
        return 0
    command = payload.get("tool_input", {}).get("command", "")
    directory = push_directory(command, payload.get("cwd") or ".")
    if directory is None:
        return 0
    try:
        root = subprocess.run(
            ["git", "-C", str(directory), "rev-parse", "--show-toplevel"],
            capture_output=True,
            text=True,
            check=True,
        ).stdout.strip()
    except (OSError, subprocess.CalledProcessError):
        return 0  # Not a repository; git itself will report the push failure.
    result = subprocess.run(
        [str(Path(root) / "scripts" / "preflight.sh")],
        cwd=root,
        stdout=sys.stderr,
        check=False,
    )
    if result.returncode != 0:
        print(
            json.dumps(
                {
                    "hookSpecificOutput": {
                        "hookEventName": "PreToolUse",
                        "permissionDecision": "deny",
                        "permissionDecisionReason": DENY_REASON,
                    }
                }
            )
        )
    return 0


if __name__ == "__main__":
    sys.exit(main())

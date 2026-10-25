"""Claude Code PreToolUse hook: run preflight before a real `git push` only.

The settings `if: Bash(git push*)` matcher also fired for unrelated commands it
could not parse (any `$VAR` or `$(...)`), and it ran the session checkout's
preflight rather than the pushed worktree's. This hook reads the tool input
itself, so every other command passes untouched, and preflight runs in the
worktree that `git -C <dir>` or the command's working directory names.
"""

from __future__ import annotations

import json
import os
import shlex
import subprocess
import sys
from pathlib import Path

DENY_REASON = (
    "preflight failed. Run scripts/preflight.sh from the pushed worktree to see "
    "the output, then fix it before pushing."
)
# shlex groups adjacent punctuation (`;\n`, `\n\n`), so a word made only of
# these characters ends one shell command and starts the next.
SEPARATOR_CHARS = "();|&\n"


def ends_command(word: str) -> bool:
    return bool(word) and all(char in SEPARATOR_CHARS for char in word)


def expand(path: str) -> str:
    # shlex keeps `$VAR` and `~` literally; Bash expands them first.
    return os.path.expanduser(os.path.expandvars(path))


def push_directory(command: str, cwd: str) -> Path | None:
    """Return the directory a `git push` in `command` runs in, else None."""
    try:
        # An unquoted newline ends a command like `;` does, so it must stay a
        # token instead of being skipped as whitespace.
        lexer = shlex.shlex(command, posix=True, punctuation_chars="();<>|&\n")
        lexer.whitespace = " \t\r"
        lexer.whitespace_split = True
        words = list(lexer)
    except ValueError:
        return None
    directory = Path(cwd)
    # A `cd` inside `( ... )` ends with the subshell.
    subshell_directories: list[Path] = []
    index = 0
    while index < len(words):
        word = words[index]
        if ends_command(word):
            for char in word:
                if char == "(":
                    subshell_directories.append(directory)
                elif char == ")" and subshell_directories:
                    directory = subshell_directories.pop()
        if word == "cd" and index + 1 < len(words):
            directory = directory / expand(words[index + 1])
            index += 2
            continue
        if word == "git" and (index == 0 or ends_command(words[index - 1])):
            git_directory = directory
            cursor = index + 1
            while cursor < len(words) and words[cursor].startswith("-"):
                option = words[cursor]
                if option in {"-C", "-c"} and cursor + 1 < len(words):
                    if option == "-C":
                        git_directory = git_directory / expand(words[cursor + 1])
                    cursor += 2
                    continue
                cursor += 1
            if cursor < len(words) and words[cursor] == "push":
                return git_directory
        index += 1
    return None


def repository_root(directory: Path) -> str | None:
    try:
        return subprocess.run(
            ["git", "-C", str(directory), "rev-parse", "--show-toplevel"],
            capture_output=True,
            text=True,
            check=True,
        ).stdout.strip()
    except (OSError, subprocess.CalledProcessError):
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
    # A directory the hook cannot resolve (an unset variable, a command
    # substitution) must not skip preflight, so fall back to the session's
    # working tree before giving up.
    root = repository_root(directory) or repository_root(
        Path(payload.get("cwd") or ".")
    )
    if root is None:
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

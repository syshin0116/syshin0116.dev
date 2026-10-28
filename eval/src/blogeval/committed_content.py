"""Build the published corpus from the committed ``HEAD:content`` tree.

The owner's checkout of ``content/`` is an Obsidian vault, so ignored
``.obsidian/`` and ``.DS_Store`` entries make the corpus builder's exact
filesystem-tree check fail in place. Exporting the committed tree into a scratch
directory outside any Git worktree reads exactly what CI reads.
"""

from __future__ import annotations

import io
import subprocess
import tarfile
from pathlib import Path

from agent.retrieval.corpus_build import CorpusBuildError, build_index

from blogeval.datasets import DatasetError

CONTENT_PATH = "content"
KNOWN_ITEM_QUERYSET_PATH = Path("eval") / "querysets" / "known-item-alias-v1.json"
KNOWN_ITEM_REFRESH_COMMAND = (
    "uv run --frozen --package syshin0116-dev-eval blogeval generate-known-item"
)


def _git(root: Path, *arguments: str) -> subprocess.CompletedProcess[bytes]:
    try:
        return subprocess.run(
            ("git", "-c", "core.quotepath=false", "-C", str(root), *arguments),
            check=False,
            capture_output=True,
            stdin=subprocess.DEVNULL,
            timeout=60,
        )
    except (OSError, subprocess.SubprocessError) as exc:
        raise DatasetError(f"cannot run git: {exc}") from exc


def discover_workspace_root(start: Path) -> Path:
    found = _git(start, "rev-parse", "--show-toplevel")
    if found.returncode != 0:
        raise DatasetError(
            "cannot find the repository root; run inside the syshin0116.dev checkout "
            "or pass --index-root and --content-tree-sha"
        )
    return Path(found.stdout.decode().strip())


def content_status(root: Path) -> tuple[list[str], list[str]]:
    """Return (tracked changes, untracked entries) under ``content/``."""

    status = _git(
        root,
        "status",
        "--porcelain=v1",
        "-z",
        "--untracked-files=all",
        "--",
        CONTENT_PATH,
    )
    if status.returncode != 0:
        raise DatasetError(
            f"cannot inspect content status: {status.stderr.decode().strip()}"
        )
    tracked: list[str] = []
    untracked: list[str] = []
    entries = iter(status.stdout.decode().split("\0"))
    for entry in entries:
        if not entry:
            continue
        code, path = entry[:2], entry[3:]
        if code == "??":
            untracked.append(path)
            continue
        tracked.append(path)
        if "R" in code or "C" in code:
            next(entries, None)
    return tracked, untracked


def head_content_tree_sha(root: Path) -> str:
    revision = _git(root, "rev-parse", f"HEAD:{CONTENT_PATH}")
    tree_sha = revision.stdout.decode().strip()
    if revision.returncode != 0 or len(tree_sha) != 40:
        raise DatasetError(f"cannot resolve HEAD:{CONTENT_PATH} in {root}")
    return tree_sha


def build_head_corpus(root: Path, scratch: Path) -> tuple[Path, str]:
    """Export ``HEAD:content`` into ``scratch`` and build its published mirror.

    Returns the index root and the content tree SHA it is pinned to. ``scratch``
    must not be inside a Git worktree, or the builder applies that worktree's
    status check to the export instead of hashing the exported bytes.
    """

    tree_sha = head_content_tree_sha(root)
    archive = _git(
        root,
        "-c",
        "core.autocrlf=false",
        "archive",
        "--format=tar",
        tree_sha,
    )
    if archive.returncode != 0:
        raise DatasetError(
            f"cannot export HEAD:{CONTENT_PATH}: {archive.stderr.decode().strip()}"
        )
    content_root = scratch / CONTENT_PATH
    content_root.mkdir(parents=True)
    with tarfile.open(fileobj=io.BytesIO(archive.stdout)) as exported:
        exported.extractall(content_root, filter="tar")

    index_root = scratch / "index"
    try:
        report = build_index(
            content_root=content_root,
            policy_path=root / "agent" / "corpus-policy.toml",
            bm25_policy_path=root / "agent" / "bm25-policy.toml",
            output_root=index_root,
        )
    except CorpusBuildError as exc:
        raise DatasetError(f"corpus build failed: {exc}") from exc
    # Git filters or attributes can rewrite exported bytes; the export only stands
    # in for HEAD:content when its hashed tree is identical.
    if report.content_git_tree_sha != tree_sha:
        raise DatasetError(
            "exported content does not reproduce HEAD:content "
            f"({report.content_git_tree_sha} != {tree_sha})"
        )
    return index_root, tree_sha

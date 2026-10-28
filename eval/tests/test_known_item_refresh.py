"""`generate-known-item` without an index root regenerates from HEAD:content."""

from __future__ import annotations

import json
import subprocess
from pathlib import Path

import pytest

from blogeval.cli import main
from blogeval.committed_content import (
    KNOWN_ITEM_QUERYSET_PATH,
    KNOWN_ITEM_REFRESH_COMMAND,
)


def _git(repo: Path, *arguments: str) -> str:
    return subprocess.run(
        (
            "git",
            "-c",
            "user.name=test",
            "-c",
            "user.email=test@example.invalid",
            "-c",
            "commit.gpgsign=false",
            "-C",
            str(repo),
            *arguments,
        ),
        check=True,
        capture_output=True,
        text=True,
    ).stdout.strip()


def _post(repo: Path, doc_id: str, *, title: str, body: str) -> Path:
    path = repo / "content" / doc_id
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        f'---\ntitle: "{title}"\ntags: []\ndescription: ""\n---\n{body}\n',
        encoding="utf-8",
    )
    return path


@pytest.fixture
def repo(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> Path:
    root = tmp_path / "repo"
    root.mkdir()
    _git(root, "init", "-q", "-b", "main")
    (root / ".gitignore").write_text(".DS_Store\ncontent/.obsidian\n")
    (root / "agent").mkdir()
    (root / "agent" / "corpus-policy.toml").write_text(
        "schema_version = 1\nno_frontmatter_allowlist = []\n"
    )
    (root / "agent" / "bm25-policy.toml").write_text(
        'schema_version = 1\npolicy_id = "refresh-test"\nseeds = []\ndeny = []\n'
    )
    _post(
        root, "AI/docker.md", title="Docker", body="See [[kubernetes|the k8s guide]]."
    )
    _post(root, "AI/kubernetes.md", title="Kubernetes", body="Cluster notes.")
    _git(root, "add", "-A")
    _git(root, "commit", "-q", "-m", "seed")
    monkeypatch.chdir(root / "agent")
    return root


def _queryset(repo: Path) -> dict[str, object]:
    return json.loads((repo / KNOWN_ITEM_QUERYSET_PATH).read_text())


def test_regenerates_from_head_and_then_checks_clean(repo: Path) -> None:
    assert main(["generate-known-item"]) == 0

    corpus = _queryset(repo)["corpus"]
    assert corpus["git_tree_sha"] == _git(repo, "rev-parse", "HEAD:content")
    assert main(["generate-known-item", "--check"]) == 0


def test_untracked_vault_files_do_not_block_or_change_the_set(
    repo: Path,
    capsys: pytest.CaptureFixture[str],
) -> None:
    assert main(["generate-known-item"]) == 0
    clean = (repo / KNOWN_ITEM_QUERYSET_PATH).read_bytes()
    (repo / "content" / ".obsidian").mkdir()
    (repo / "content" / ".obsidian" / "app.json").write_text("{}")
    (repo / "content" / ".DS_Store").write_bytes(b"\0")
    _post(repo, "AI/draft.md", title="Draft", body="Not committed.")
    capsys.readouterr()

    assert main(["generate-known-item"]) == 0

    assert "ignoring 1 untracked file(s)" in capsys.readouterr().err
    assert (repo / KNOWN_ITEM_QUERYSET_PATH).read_bytes() == clean


def test_uncommitted_content_edit_refuses_to_write_but_check_still_runs(
    repo: Path,
    capsys: pytest.CaptureFixture[str],
) -> None:
    assert main(["generate-known-item"]) == 0
    before = (repo / KNOWN_ITEM_QUERYSET_PATH).read_bytes()
    _post(repo, "AI/docker.md", title="Docker", body="Edited, not committed.")

    assert main(["generate-known-item"]) == 1
    assert "uncommitted change(s) under content/" in capsys.readouterr().err
    assert (repo / KNOWN_ITEM_QUERYSET_PATH).read_bytes() == before
    assert main(["generate-known-item", "--check"]) == 0


def test_stale_check_prints_the_one_line_fix(
    repo: Path,
    capsys: pytest.CaptureFixture[str],
) -> None:
    assert main(["generate-known-item"]) == 0
    _git(repo, "add", "-A")
    _git(repo, "commit", "-q", "-m", "queryset")
    _post(
        repo,
        "AI/docker.md",
        title="Docker",
        body="See [[kubernetes|the k8s guide]] again.",
    )
    _git(repo, "commit", "-q", "-am", "content edit")
    capsys.readouterr()

    assert main(["generate-known-item", "--check"]) == 1
    assert KNOWN_ITEM_REFRESH_COMMAND in capsys.readouterr().err

    assert main(["generate-known-item"]) == 0
    assert main(["generate-known-item", "--check"]) == 0


def test_index_root_and_tree_sha_must_be_given_together(
    repo: Path,
    capsys: pytest.CaptureFixture[str],
) -> None:
    assert main(["generate-known-item", "--index-root", str(repo / "index")]) == 1
    assert "must be given together" in capsys.readouterr().err

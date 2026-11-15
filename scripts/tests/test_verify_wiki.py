"""Wiki contract v2: both verifiers accept and reject the same pages with the same output."""

from __future__ import annotations

import filecmp
import shutil
import subprocess
import sys
import tempfile
import textwrap
import unittest
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
PYTHON_VERIFIER = REPO / "scripts" / "verify-wiki.py"
TS_VERIFIER = REPO / ".agents" / "skills" / "wiki-curator" / "scripts" / "verify.ts"
BUN = shutil.which("bun")

SOURCE = """\
---
title: Source post
---

Intro line before any heading.

## Permanent Notes

Permanent notes find the meaning of a note in relation to existing knowledge.

## Keywords

Choose keywords by asking in which situation you want to find this note again.

## [Linked Heading](https://example.com/notes)

A heading whose text is a link still anchors its own section.

## [Reference Heading][ref]

Reference-style link headings anchor their section too.

## [Nested [inner] Heading](https://example.com/a_(b))

Nested brackets and parentheses still leave the visible label.

## [[other|Wiki Heading]]

A wikilink heading is matched by its alias.

## Linked Text

Quotes may span [[other|a wikilink alias]], [[other]], and [a label](https://example.com/a_(b)) here.

[ref]: https://example.com/ref

```text
"a quote inside a source code block"
```
"""

V2_FRONTMATTER = {
    "title": '"Zettelkasten"',
    "status": "seedling",
    "confidence": "medium",
    "reviewed": "null",
    "created": "2026-11-16",
    "updated": "2026-11-16",
    "draft": "false",
}


def page(
    body: str,
    sources: tuple[str, ...] = ("content/Tools/source.md",),
    **fields: str | None,
) -> str:
    values = {**V2_FRONTMATTER, **fields}
    lines = ["---"]
    for key, value in values.items():
        if value is not None:
            lines.append(f"{key}: {value}")
    lines += ["tags:", "  - pkm", "sources:", *(f"  - {s}" for s in sources)]
    lines += ['summary: "A note-linking method."', "---", ""]
    return "\n".join(lines) + textwrap.dedent(body).lstrip("\n")


VALID_BODY = """
Zettelkasten links notes; see [[other]] for a related idea.

## Key Claims

- "Permanent notes find the meaning of a note in relation to existing knowledge."[^1]
- Keywords follow retrieval: "in which situation you want to find this note again"[^2]
- The term "card box" is fine without a citation on this line.
- A quote in code is ignored: `"x"`[^1]

## 생각의 변천

- First treated as a filing system, later as a thinking tool.[^1][^2]

## Footnotes

[^1]: content/Tools/source.md#Permanent Notes
[^2]: content/Tools/source.md#keywords
"""

LEGACY_PAGE = """\
---
title: "Legacy"
type: concept
tags:
  - pkm
sources:
  - content/Tools/source.md
summary: "Legacy shape."
created: 2026-04-26
updated: 2026-10-25
author: wiki-curator
draft: false
---

## Key Claims

- Zettelkasten means "card box" in German.[^1]

## Connections

- [[other]] - related

## Footnotes

[^1]: content/Tools/source.md
"""


class WikiFixture:
    def __init__(self, pages: dict[str, str]) -> None:
        self._tmp = tempfile.TemporaryDirectory()
        self.root = Path(self._tmp.name)
        (self.root / "content" / "Tools").mkdir(parents=True)
        (self.root / "content" / "Tools" / "source.md").write_text(
            SOURCE, encoding="utf-8"
        )
        wiki = self.root / "content" / "wiki"
        wiki.mkdir()
        (wiki / "other.md").write_text(
            page(
                "Other.\n\n## Key Claims\n\n- Other claim.[^1]\n\n## Footnotes\n\n[^1]: content/Tools/source.md\n"
            ),
            encoding="utf-8",
        )
        for name, text in pages.items():
            (wiki / f"{name}.md").write_text(text, encoding="utf-8")

    def run(self, *args: str) -> tuple[int, str]:
        python = subprocess.run(
            [sys.executable, str(PYTHON_VERIFIER), "--root", str(self.root), *args],
            capture_output=True,
            text=True,
            check=False,
        )
        if BUN:
            ts = subprocess.run(
                [BUN, str(TS_VERIFIER), "--root", str(self.root), *args],
                capture_output=True,
                text=True,
                check=False,
            )
            assert (ts.returncode, ts.stdout) == (python.returncode, python.stdout), (
                f"verifiers disagree\n--- verify.ts ({ts.returncode})\n{ts.stdout}{ts.stderr}"
                f"\n--- verify-wiki.py ({python.returncode})\n{python.stdout}{python.stderr}"
            )
        return python.returncode, python.stdout

    def close(self) -> None:
        self._tmp.cleanup()


class VerifyWikiTests(unittest.TestCase):
    def check(self, pages: dict[str, str], *args: str) -> tuple[int, str]:
        fixture = WikiFixture(pages)
        self.addCleanup(fixture.close)
        return fixture.run(*args)

    def assert_fails(
        self, body_or_page: str, check: str, detail: str = "", **fields: str | None
    ) -> None:
        text = (
            body_or_page
            if body_or_page.startswith("---")
            else page(body_or_page, **fields)
        )
        code, out = self.check({"page": text})
        self.assertEqual(code, 1, out)
        self.assertIn(f"### {check} (", out)
        self.assertIn(detail, out)

    def test_valid_v2_page_passes_without_type_or_author(self) -> None:
        code, out = self.check({"page": page(VALID_BODY)})
        self.assertEqual((code, out.strip()), (0, "OK - 2 pages, all checks pass."))

    def test_one_source_seedling_and_null_review_are_allowed(self) -> None:
        code, out = self.check({"page": page(VALID_BODY, reviewed=None)})
        self.assertEqual(code, 0, out)

    def test_legacy_page_passes_with_warnings_and_fails_under_strict(self) -> None:
        code, out = self.check({"legacy": LEGACY_PAGE})
        self.assertEqual(code, 0, out)
        self.assertIn("WARN - ", out)
        for check in ("legacy-shape", "quote-too-short", "section-related"):
            self.assertIn(f"### {check} (1)", out)

        code, out = self.check({"legacy": LEGACY_PAGE}, "--strict")
        self.assertEqual(code, 1, out)
        self.assertIn("missing required field: status", out)
        self.assertIn("missing required field: confidence", out)
        self.assertIn("retired field present: type", out)
        self.assertIn("retired field present: author", out)

    def test_v2_page_requires_confidence(self) -> None:
        self.assert_fails(
            VALID_BODY,
            "frontmatter-missing",
            "missing required field: confidence",
            confidence=None,
        )

    def test_v2_page_rejects_retired_fields(self) -> None:
        self.assert_fails(
            VALID_BODY,
            "frontmatter-retired",
            "retired field present: type",
            type="concept",
        )
        self.assert_fails(
            VALID_BODY,
            "frontmatter-retired",
            "retired field present: author",
            author="wiki-curator",
        )

    def test_status_confidence_and_reviewed_values(self) -> None:
        self.assert_fails(
            VALID_BODY,
            "frontmatter-value",
            'status must be one of seedling, budding, evergreen (got "draft")',
            status="draft",
        )
        self.assert_fails(
            VALID_BODY,
            "frontmatter-value",
            'confidence must be one of low, medium, high (got "certain")',
            confidence="certain",
        )
        self.assert_fails(
            VALID_BODY,
            "frontmatter-value",
            'reviewed must be a YYYY-MM-DD date or null (got "2026-02-30")',
            reviewed="2026-02-30",
        )
        self.assert_fails(
            VALID_BODY,
            "frontmatter-value",
            "evergreen pages need a reviewed date",
            status="evergreen",
        )
        code, out = self.check(
            {"page": page(VALID_BODY, status="evergreen", reviewed="2026-11-16")}
        )
        self.assertEqual(code, 0, out)

    def test_invalid_value_fails_even_on_a_legacy_page(self) -> None:
        legacy = LEGACY_PAGE.replace("draft: false", "draft: false\nconfidence: sure")
        self.assert_fails(
            legacy,
            "frontmatter-value",
            'confidence must be one of low, medium, high (got "sure")',
        )

    def test_quote_must_be_in_the_cited_heading_section(self) -> None:
        body = VALID_BODY.replace(
            "[^2]: content/Tools/source.md#keywords",
            "[^2]: content/Tools/source.md#Permanent Notes",
        )
        self.assert_fails(
            body,
            "quote-not-in-source",
            "not found in content/Tools/source.md#Permanent Notes",
        )

    def test_quote_without_anchor_searches_the_whole_source(self) -> None:
        body = VALID_BODY.replace("source.md#keywords", "source.md")
        code, out = self.check({"page": page(body)})
        self.assertEqual(code, 0, out)

    def test_paraphrase_in_quotes_is_rejected(self) -> None:
        body = VALID_BODY.replace(
            "in which situation you want to find",
            "in which case you would like to find",
        )
        self.assert_fails(
            body, "quote-not-in-source", "not found in content/Tools/source.md#keywords"
        )

    def test_missing_anchor_is_reported(self) -> None:
        body = VALID_BODY.replace("source.md#keywords", "source.md#Glossary")
        self.assert_fails(
            body,
            "quote-anchor-missing",
            "content/Tools/source.md has no heading #Glossary",
        )

    def test_short_and_numeric_quotes_are_rejected(self) -> None:
        self.assert_fails(
            VALID_BODY.replace(
                "- The term", '- Stored in a "card box"[^1] and the term'
            ),
            "quote-too-short",
            '"card box" is under 15 chars',
        )
        self.assert_fails(
            VALID_BODY.replace(
                "- The term", '- Published "2024-11-16 12:00:00"[^1] and the term'
            ),
            "quote-not-text",
            '"2024-11-16 12:00:00" has no letters',
        )

    def test_quotes_in_fenced_code_are_ignored(self) -> None:
        body = VALID_BODY.replace(
            "## 생각의 변천", '```text\n"short"[^9]\n```\n\n## 생각의 변천'
        )
        code, out = self.check({"page": page(body)})
        self.assertEqual(code, 0, out)

    def test_https_footnote_quotes_skip_the_content_match(self) -> None:
        body = VALID_BODY.replace(
            "[^2]: content/Tools/source.md#keywords",
            "[^2]: [Some article](https://example.com/post)",
        )
        code, out = self.check({"page": page(body)})
        self.assertEqual(code, 0, out)

    def test_quote_footnote_without_a_target_is_reported(self) -> None:
        body = VALID_BODY.replace(
            "[^2]: content/Tools/source.md#keywords",
            "[^2]: a conversation with a colleague",
        )
        self.assert_fails(
            body,
            "quote-source-unresolved",
            "[^2] names no repo-local file or HTTPS URL",
        )

    def test_quote_footnote_to_a_missing_file_is_reported(self) -> None:
        body = VALID_BODY.replace(
            "[^2]: content/Tools/source.md#keywords", "[^2]: content/Tools/gone.md"
        )
        self.assert_fails(
            body, "quote-source-missing", "[^2] content/Tools/gone.md does not exist"
        )

    def test_undefined_footnote_is_reported(self) -> None:
        self.assert_fails(
            VALID_BODY.replace("[^1][^2]", "[^1][^3]"),
            "footnote-undefined",
            "[^3] has no definition",
        )

    def test_related_pages_section_is_rejected(self) -> None:
        body = VALID_BODY.replace(
            "## Footnotes", "## Connections\n\n- [[other]] - related\n\n## Footnotes"
        )
        self.assert_fails(
            body, "section-related", "`## Connections` - link inline in the body"
        )

    def test_empty_section_is_rejected_but_subsections_count_as_content(self) -> None:
        self.assert_fails(
            VALID_BODY.replace("## Footnotes", "## Contradictions\n\n## Footnotes"),
            "section-empty",
            "`## Contradictions` has no content",
        )
        body = VALID_BODY.replace(
            "## Footnotes", "## Examples\n\n### One\n\n```text\nx\n```\n\n## Footnotes"
        )
        code, out = self.check({"page": page(body)})
        self.assertEqual(code, 0, out)

    def test_change_section_must_cite_sources(self) -> None:
        body = VALID_BODY.replace(
            "later as a thinking tool.[^1][^2]", "later as a thinking tool."
        )
        self.assert_fails(
            body, "section-change-uncited", "`## 생각의 변천` must cite the sources"
        )

    def test_footnote_syntax_inside_inline_code_is_not_a_reference(self) -> None:
        body = VALID_BODY.replace(
            "- The term",
            "- The syntax for a citation is `[^example]`.\n"
            '- An uncited quote: "too short" `[^9]`\n'
            "- The term",
        )
        code, out = self.check({"page": page(body)})
        self.assertEqual(code, 0, out)

    def test_longer_fence_is_not_closed_by_a_shorter_inner_fence(self) -> None:
        body = VALID_BODY.replace(
            "## 생각의 변천",
            '````markdown\n```text\n"short"[^not-a-reference]\n```\n````\n\n## 생각의 변천',
        )
        code, out = self.check({"page": page(body)})
        self.assertEqual(code, 0, out)

    def cite(self, anchor: str, quote: str) -> tuple[int, str]:
        body = VALID_BODY.replace("- The term", f'- "{quote}"[^3]\n- The term').replace(
            "[^2]: content/Tools/source.md#keywords",
            f"[^2]: content/Tools/source.md#keywords\n[^3]: content/Tools/source.md#{anchor}",
        )
        return self.check({"page": page(body)})

    def test_heading_anchor_matches_the_visible_text_of_a_linked_heading(self) -> None:
        cases = (
            (
                "Linked Heading",
                "A heading whose text is a link still anchors its own section",
            ),
            (
                "linked-heading",
                "A heading whose text is a link still anchors its own section",
            ),
            (
                "Reference Heading",
                "Reference-style link headings anchor their section too",
            ),
            (
                "Nested inner Heading",
                "Nested brackets and parentheses still leave the visible label",
            ),
            (
                "nested-inner-heading",
                "Nested brackets and parentheses still leave the visible label",
            ),
            ("Wiki Heading", "A wikilink heading is matched by its alias"),
        )
        for anchor, quote in cases:
            with self.subTest(anchor=anchor):
                code, out = self.cite(anchor, quote)
                self.assertEqual(code, 0, out)

    def test_quote_matches_the_visible_text_of_wikilinks_and_links(self) -> None:
        code, out = self.cite(
            "Linked Text", "Quotes may span a wikilink alias, other, and a label here"
        )
        self.assertEqual(code, 0, out)
        code, out = self.cite("Linked Text", "Quotes may span other|a wikilink alias")
        self.assertEqual(code, 1, out)
        self.assertIn("quote-not-in-source", out)

    def test_reported_lines_are_file_lines(self) -> None:
        text = page(VALID_BODY.replace("## Key Claims", "[[missing]]\n\n## Key Claims"))
        line = text.split("\n").index("[[missing]]") + 1
        self.assert_fails(
            text, "wikilink-broken", f"line {line}: [[missing]] does not resolve"
        )


class SkillMirrorTests(unittest.TestCase):
    def test_skill_trees_are_byte_identical(self) -> None:
        def compare(left: Path, right: Path) -> list[str]:
            diff = filecmp.dircmp(left, right)
            problems = [
                str(left / name)
                for name in diff.left_only + diff.right_only + diff.funny_files
            ]
            _, mismatch, errors = filecmp.cmpfiles(
                left, right, diff.common_files, shallow=False
            )
            problems += [str(left / name) for name in mismatch + errors]
            for name in diff.common_dirs:
                problems += compare(left / name, right / name)
            return problems

        self.assertEqual(
            compare(
                REPO / ".agents" / "skills" / "wiki-curator",
                REPO / ".claude" / "skills" / "wiki-curator",
            ),
            [],
        )


if __name__ == "__main__":
    unittest.main()

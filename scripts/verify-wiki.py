#!/usr/bin/env python3
"""Dependency-free CI implementation of the wiki-curator verify gate.

Mirrors .agents/skills/wiki-curator/scripts/verify.ts, the canonical contract:
same checks, same output. scripts/tests/test_verify_wiki.py compares the two.

Usage: python scripts/verify-wiki.py [--root <repo>] [--strict]
"""

from __future__ import annotations

import argparse
import re
import sys
import unicodedata
from collections import defaultdict
from datetime import date
from ipaddress import ip_address
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]

# Rollout switch: False since the content migration; every page must declare `status`.
ALLOW_LEGACY_PAGES = False

REQUIRED_FRONTMATTER = [
    "title",
    "tags",
    "sources",
    "summary",
    "created",
    "updated",
    "draft",
]
V2_REQUIRED_FRONTMATTER = ["status", "confidence"]
RETIRED_FRONTMATTER = ["type", "author"]
FORBIDDEN_FRONTMATTER = ["coverage"]
MANDATORY_SECTIONS = ["## Key Claims", "## Footnotes"]
STATUS_VALUES = ["seedling", "budding", "evergreen"]
CONFIDENCE_VALUES = ["low", "medium", "high"]
RELATED_SECTION_TITLES = [
    "connections",
    "related",
    "related pages",
    "see also",
    "관련 페이지",
    "관련 문서",
]
CHANGE_SECTION_TITLE = "생각의 변천"
QUOTE_MIN_CHARS = 15
SUMMARY_MIN = 1
SUMMARY_MAX = 500
SKIP_FILES = {"index.md", "log.md"}

WIKILINK_RE = re.compile(r"\[\[([^\]|#]+)(?:[|#][^\]]*)?\]\]")
URL_SCHEME_RE = re.compile(r"^[a-z][a-z\d+.-]*:", re.IGNORECASE)
HOST_LABEL_RE = re.compile(r"^[a-z\d](?:[a-z\d-]{0,61}[a-z\d])?$", re.IGNORECASE)
FOOTNOTE_DEF_RE = re.compile(r"^\[\^([^\]]+)\]:[ \t]*(.*)$")
FOOTNOTE_REF_RE = re.compile(r"\[\^([^\]]+)\](?!:)")
QUOTE_RE = re.compile(r'"([^"\n]*)"|“([^”\n]*)”')
INLINE_CODE_RE = re.compile(r"`[^`\n]*`")
# An inline link's destination and title, `](url "title")`: a title in quotes is not a quotation.
LINK_DESTINATION_RE = re.compile(r"\]\((?:[^()\n]|\([^()\n]*\))*\)")
HEADING_RE = re.compile(r"^(#{1,6})[ \t]+(.+?)(?:[ \t]+#+)?[ \t]*$")
BLOCKQUOTE_RE = re.compile(r"^[ \t]*(?:>[ \t]?)+")
FENCE_RE = re.compile(r"^[ \t]*(`{3,}|~{3,})(.*)$")
SPACE_RE = re.compile(r"[ \t\n\r\f\v  -   　]+")
# Link markup reduced to its visible text: embeds vanish, wikilinks show their alias (else the page,
# else the heading), Markdown links show their label. One level of nested brackets or parentheses is allowed.
EMBED_RE = re.compile(r"!\[\[[^\]\n]*\]\]")
WIKILINK_TEXT_RE = re.compile(r"\[\[([^\]|\n]*)(?:\|([^\]\n]*))?\]\]")
LINK_RE = re.compile(
    r"!?\[((?:[^\[\]\n]|\[[^\[\]\n]*\])*)\](?:\((?:[^()\n]|\([^()\n]*\))*\)|\[[^\]\n]*\])"
)
DATE_RE = re.compile(r"([0-9]{4})-([0-9]{2})-([0-9]{2})")


def walk_wiki(wiki_root: Path) -> list[Path]:
    return sorted(
        path
        for path in wiki_root.rglob("*.md")
        if path.is_file()
        and not any(part.startswith(".") for part in path.relative_to(wiki_root).parts)
    )


def split_frontmatter(raw: str) -> tuple[str, str] | None:
    if not raw.startswith("---\n"):
        return None
    end = raw.find("\n---\n", 4)
    if end == -1:
        return None
    return raw[4:end], raw[end + 5 :]


def fm_has_field(frontmatter: str, key: str) -> bool:
    return re.search(rf"^{re.escape(key)}:", frontmatter, re.MULTILINE) is not None


def fm_get_scalar(frontmatter: str, key: str) -> str | None:
    lines = frontmatter.split("\n")
    for index, line in enumerate(lines):
        match = re.match(rf"^{re.escape(key)}:\s*(.*)$", line)
        if match is None:
            continue

        inline = match.group(1).strip()
        if inline in {"|", ">", "|-", ">-"}:
            collected: list[str] = []
            cursor = index + 1
            while cursor < len(lines) and (
                lines[cursor][:1].isspace() or not lines[cursor]
            ):
                if lines[cursor]:
                    collected.append(lines[cursor].strip())
                cursor += 1
            separator = " " if inline.startswith(">") else "\n"
            return separator.join(collected).strip()

        if len(inline) >= 2 and inline[0] == inline[-1] and inline[0] in {'"', "'"}:
            inline = inline[1:-1]
        return inline
    return None


def fm_get_list(frontmatter: str, key: str) -> list[str]:
    values: list[str] = []
    inside = False
    for line in frontmatter.split("\n"):
        if re.match(rf"^{re.escape(key)}:", line):
            inside = True
            continue
        if not inside:
            continue

        match = re.match(r"^\s+-\s+(.*)$", line)
        if match:
            value = match.group(1).strip()
            if len(value) >= 2 and value[0] == value[-1] and value[0] in {'"', "'"}:
                value = value[1:-1]
            values.append(value)
        elif line and not line[0].isspace():
            break
    return values


def fm_has_non_empty_tags(frontmatter: str) -> bool:
    inside = False
    for line in frontmatter.split("\n"):
        if re.match(r"^tags:", line):
            inside = True
            continue
        if not inside:
            continue
        if re.match(r"^\s+-\s+\S", line):
            return True
        if line and not line[0].isspace():
            return False
    return False


def is_valid_date(value: str) -> bool:
    match = DATE_RE.fullmatch(value)
    if match is None:
        return False
    try:
        date(int(match.group(1)), int(match.group(2)), int(match.group(3)))
    except ValueError:
        return False
    return True


def validate_https_source(source: str) -> str | None:
    try:
        parsed = urlsplit(source)
        if parsed.scheme.lower() != "https" or not parsed.hostname:
            return "must be an absolute HTTPS URL"
        if any(character.isspace() or ord(character) < 32 for character in source):
            return "is not a valid HTTPS URL"
        parsed.port

        hostname = parsed.hostname
        if ":" in hostname:
            ip_address(hostname)
        else:
            ascii_hostname = hostname.encode("idna").decode("ascii").rstrip(".")
            if len(ascii_hostname) > 253 or any(
                HOST_LABEL_RE.fullmatch(label) is None
                for label in ascii_hostname.split(".")
            ):
                return "is not a valid HTTPS URL"
    except ValueError:
        return "is not a valid HTTPS URL"
    except UnicodeError:
        return "is not a valid HTTPS URL"
    return None


def validate_local_source(source: str) -> str | None:
    path = Path(source)
    if path.is_absolute():
        return "must be a repository-relative path"

    resolved = (ROOT / path).resolve()
    if not resolved.is_relative_to(ROOT) or resolved == ROOT:
        return "must stay inside the repository"
    if not resolved.exists():
        return "does not exist"
    if not resolved.is_file():
        return "does not point to a file"
    return None


def scan_lines(text: str) -> list[tuple[str, int, bool]]:
    """Every line with its 1-based number; prose is False inside fenced code and on fence lines."""
    out: list[tuple[str, int, bool]] = []
    # A fence (also inside a blockquote) closes only on the same character, at least as long as the opener, with nothing after it.
    fence: str | None = None
    for index, line in enumerate(text.split("\n")):
        match = FENCE_RE.match(BLOCKQUOTE_RE.sub("", line, count=1))
        if match:
            marker = match.group(1)
            if fence is None:
                fence = marker
            elif (
                marker[0] == fence[0]
                and len(marker) >= len(fence)
                and not match.group(2).strip()
            ):
                fence = None
            out.append((line, index + 1, False))
            continue
        out.append((line, index + 1, fence is None))
    return out


def mask_code(line: str) -> str:
    """The line with inline code spans blanked out, so literal syntax in code is not read as a reference."""
    return INLINE_CODE_RE.sub(lambda match: " " * len(match.group(0)), line)


def prose_lines(text: str) -> list[tuple[str, int]]:
    return [(line, number) for line, number, prose in scan_lines(text) if prose]


def _wikilink_text(match: re.Match[str]) -> str:
    if match.group(2) is not None:
        return match.group(2)
    page, *heading = match.group(1).split("#")
    return page if page.strip() else "#".join(heading)


def visible_text(text: str) -> str:
    text = EMBED_RE.sub("", text)
    text = WIKILINK_TEXT_RE.sub(_wikilink_text, text)
    return LINK_RE.sub(r"\1", text)


def normalize_for_match(text: str) -> str:
    """Text used to compare a quote with its source: markup and spacing removed."""
    text = unicodedata.normalize("NFC", text)
    text = "\n".join(BLOCKQUOTE_RE.sub("", line) for line in text.split("\n"))
    text = re.sub(r"[“”„]", '"', text)
    text = re.sub(r"[‘’]", "'", text)
    text = visible_text(text)
    text = re.sub(r"[*_`]", "", text)
    return SPACE_RE.sub(" ", text).strip()


def normalize_quote(text: str) -> str:
    text = re.sub(r"^[.…]+", "", normalize_for_match(text))
    return re.sub(r"[.,;:!?。、…]+$", "", text).strip()


def heading_key(text: str) -> str:
    text = unicodedata.normalize("NFC", visible_text(text))
    return "".join(ch for ch in text.lower() if ch.isalnum())


def footnote_target(definition: str) -> tuple[str, str | None, str | None]:
    """Return ("local", file, anchor), ("https", None, None), or ("none", None, None)."""
    target = definition.strip()
    link = re.match(
        r"^\[[^\]]*\]\(\s*(?:<([^>]*)>|((?:[^()\s]|\([^()\s]*\))+))", target
    )
    if link:
        target = (link.group(1) if link.group(1) is not None else link.group(2)).strip()
    if re.search(r"https://", target, re.IGNORECASE):
        return ("https", None, None)
    if URL_SCHEME_RE.match(target):
        return ("none", None, None)
    match = re.fullmatch(r"(.+?\.md)(?:#(.*))?", target)
    if match is None:
        return ("none", None, None)
    anchor = None if match.group(2) is None else match.group(2).split("#")[-1].strip()
    return ("local", match.group(1), anchor or None)


def heading_section(raw: str, anchor: str) -> str | None:
    """The cited heading's section: its heading line through the next heading of the same or higher level."""
    split = split_frontmatter(raw)
    text = split[1] if split else raw
    wanted = heading_key(anchor)
    lines = prose_lines(text)
    for index, (line, number) in enumerate(lines):
        heading = HEADING_RE.match(line)
        if heading is None or heading_key(heading.group(2)) != wanted:
            continue
        level = len(heading.group(1))
        every = text.split("\n")
        end_number = len(every) + 1
        for later, later_number in lines[index + 1 :]:
            following = HEADING_RE.match(later)
            if following and len(following.group(1)) <= level:
                end_number = later_number
                break
        return "\n".join(every[number - 1 : end_number - 1])
    return None


_source_cache: dict[str, str | None] = {}


def read_source(file: str) -> str | None:
    if file not in _source_cache:
        try:
            _source_cache[file] = (ROOT / file).resolve().read_text(encoding="utf-8")
        except (OSError, UnicodeDecodeError):
            _source_cache[file] = None
    return _source_cache[file]


def shorten(quote: str) -> str:
    return f"{quote[:40]}..." if len(quote) > 40 else quote


def v2_findings(body: str, offset: int) -> list[tuple[str, str]]:
    """Rules every page must meet under the v2 contract (warnings on legacy pages)."""
    found: list[tuple[str, str]] = []
    lines = [(line, number + offset) for line, number in prose_lines(body)]

    definitions: dict[str, str] = {}
    for line, _ in lines:
        match = FOOTNOTE_DEF_RE.match(line)
        if match and match.group(1) not in definitions:
            definitions[match.group(1)] = match.group(2)

    # Sections: related-pages sections, empty sections, the change section.
    every = scan_lines(body)
    headings: list[tuple[int, str, int]] = []
    for index, (line, _, prose) in enumerate(every):
        heading = HEADING_RE.match(line) if prose else None
        if heading:
            headings.append((len(heading.group(1)), heading.group(2), index))
    for position, (level, title, index) in enumerate(headings):
        end = len(every)
        for later_level, _, later_index in headings[position + 1 :]:
            if later_level <= level:
                end = later_index
                break
        following = (
            headings[position + 1][2] if position + 1 < len(headings) else len(every)
        )
        heading_text = f"{'#' * level} {title}"
        if level == 2 and title.lower() in RELATED_SECTION_TITLES:
            found.append(
                (
                    "section-related",
                    f"`{heading_text}` - link inline in the body; backlinks are rendered automatically",
                )
            )
        if following == end and all(
            not line.strip() for line, _, _ in every[index + 1 : end]
        ):
            found.append(
                (
                    "section-empty",
                    f"`{heading_text}` has no content - omit sections that would be empty",
                )
            )
        if level == 2 and title == CHANGE_SECTION_TITLE:
            cites = any(
                prose
                and not FOOTNOTE_DEF_RE.match(line)
                and re.search(r"\[\^[^\]]+\](?!:)", mask_code(line))
                for line, _, prose in every[index + 1 : end]
            )
            if not cites:
                found.append(
                    (
                        "section-change-uncited",
                        f"`{heading_text}` must cite the sources that show the change",
                    )
                )

    # Footnote references and cited quotes.
    undefined_refs: set[str] = set()
    for line, number in lines:
        if FOOTNOTE_DEF_RE.match(line):
            continue

        masked = mask_code(line)
        for ref in FOOTNOTE_REF_RE.finditer(masked):
            if ref.group(1) not in definitions and ref.group(1) not in undefined_refs:
                undefined_refs.add(ref.group(1))
                found.append(
                    (
                        "footnote-undefined",
                        f"line {number}: [^{ref.group(1)}] has no definition",
                    )
                )

        code_ranges = [
            (m.start(), m.end())
            for pattern in (INLINE_CODE_RE, LINK_DESTINATION_RE)
            for m in pattern.finditer(line)
        ]
        for quoted in QUOTE_RE.finditer(line):
            start = quoted.start()
            if any(begin <= start < finish for begin, finish in code_ranges):
                continue
            ref = FOOTNOTE_REF_RE.search(masked, quoted.end())
            if ref is None:
                continue

            span = quoted.group(1) if quoted.group(1) is not None else quoted.group(2)
            quote = normalize_quote(span)
            shown = shorten(quote)
            if not any(ch.isalpha() for ch in quote):
                found.append(
                    (
                        "quote-not-text",
                        f'line {number}: "{shown}" has no letters; numbers alone cannot be verified',
                    )
                )
                continue
            if len(quote) < QUOTE_MIN_CHARS:
                found.append(
                    (
                        "quote-too-short",
                        f'line {number}: "{shown}" is under {QUOTE_MIN_CHARS} chars; '
                        "quote a longer span or drop the quote marks",
                    )
                )
                continue
            definition = definitions.get(ref.group(1))
            if definition is None:
                continue

            kind, file, anchor = footnote_target(definition)
            if kind == "https":
                continue
            if kind == "none" or file is None:
                found.append(
                    (
                        "quote-source-unresolved",
                        f"line {number}: [^{ref.group(1)}] names no repo-local file or HTTPS URL",
                    )
                )
                continue
            problem = validate_local_source(file)
            raw = None if problem else read_source(file)
            if problem or raw is None:
                found.append(
                    (
                        "quote-source-missing",
                        f"line {number}: [^{ref.group(1)}] {file} {problem or 'cannot be read'}",
                    )
                )
                continue
            scope = raw
            if anchor is not None:
                section = heading_section(raw, anchor)
                if section is None:
                    found.append(
                        (
                            "quote-anchor-missing",
                            f"line {number}: {file} has no heading #{anchor}",
                        )
                    )
                    continue
                scope = section
            if quote not in normalize_for_match(scope):
                where = file if anchor is None else f"{file}#{anchor}"
                found.append(
                    (
                        "quote-not-in-source",
                        f'line {number}: "{shown}" not found in {where}',
                    )
                )
    return found


def print_groups(items: list[tuple[str, str, str]]) -> None:
    by_check: dict[str, list[tuple[str, str]]] = defaultdict(list)
    for check, file, detail in items:
        by_check[check].append((file, detail))
    for check in sorted(by_check):
        group = by_check[check]
        print(f"### {check} ({len(group)})")
        for file, detail in group:
            print(f"  {file}: {detail}")
        print()


def main(argv: list[str] | None = None) -> int:
    global ROOT
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=ROOT)
    parser.add_argument("--strict", action="store_true")
    args = parser.parse_args(argv)
    ROOT = args.root.resolve()
    _source_cache.clear()
    strict = args.strict or not ALLOW_LEGACY_PAGES
    wiki_root = ROOT / "content" / "wiki"

    failures: list[tuple[str, str, str]] = []
    warnings: list[tuple[str, str, str]] = []
    files = walk_wiki(wiki_root)
    slugs = {path.stem for path in files}
    page_count = 0

    for path in files:
        if path.name in SKIP_FILES:
            continue

        relative = path.relative_to(ROOT).as_posix()
        raw = path.read_text(encoding="utf-8")
        split = split_frontmatter(raw)
        if split is None:
            failures.append(("frontmatter", relative, "no frontmatter block"))
            continue

        frontmatter, body = split
        offset = len(frontmatter.split("\n")) + 2
        page_count += 1
        is_v2 = fm_has_field(frontmatter, "status")

        for key in REQUIRED_FRONTMATTER:
            if not fm_has_field(frontmatter, key):
                failures.append(
                    ("frontmatter-missing", relative, f"missing required field: {key}")
                )

        for key in FORBIDDEN_FRONTMATTER:
            if fm_has_field(frontmatter, key):
                failures.append(
                    ("frontmatter-legacy", relative, f"legacy field present: {key}")
                )

        # Growth stage, confidence, and review date hold allowed values when present.
        status = fm_get_scalar(frontmatter, "status")
        if status is not None and status not in STATUS_VALUES:
            failures.append(
                (
                    "frontmatter-value",
                    relative,
                    f'status must be one of {", ".join(STATUS_VALUES)} (got "{status}")',
                )
            )
        confidence = fm_get_scalar(frontmatter, "confidence")
        if confidence is not None and confidence not in CONFIDENCE_VALUES:
            failures.append(
                (
                    "frontmatter-value",
                    relative,
                    f'confidence must be one of {", ".join(CONFIDENCE_VALUES)} (got "{confidence}")',
                )
            )
        reviewed = fm_get_scalar(frontmatter, "reviewed")
        if reviewed in {"", "null", "~"}:
            reviewed = None
        if reviewed is not None and not is_valid_date(reviewed):
            failures.append(
                (
                    "frontmatter-value",
                    relative,
                    f'reviewed must be a YYYY-MM-DD date or null (got "{reviewed}")',
                )
            )

        if is_v2 or strict:
            for key in V2_REQUIRED_FRONTMATTER:
                if not fm_has_field(frontmatter, key):
                    failures.append(
                        (
                            "frontmatter-missing",
                            relative,
                            f"missing required field: {key}",
                        )
                    )
            for key in RETIRED_FRONTMATTER:
                if fm_has_field(frontmatter, key):
                    failures.append(
                        (
                            "frontmatter-retired",
                            relative,
                            f"retired field present: {key}",
                        )
                    )
            if status == "evergreen" and reviewed is None:
                failures.append(
                    (
                        "frontmatter-value",
                        relative,
                        "evergreen pages need a reviewed date",
                    )
                )
        else:
            warnings.append(
                (
                    "legacy-shape",
                    relative,
                    "no status; migrate to the v2 contract (status, confidence, no type/author)",
                )
            )

        if re.search(r"^##\s+Summary\b", body, re.MULTILINE):
            failures.append(
                (
                    "body-summary-section",
                    relative,
                    "body contains `## Summary` - summary belongs in frontmatter",
                )
            )

        if re.search(r"^\s*>\s*\[!summary\]", body, re.IGNORECASE | re.MULTILINE):
            failures.append(
                (
                    "body-callout-summary",
                    relative,
                    "body contains legacy `> [!summary]` callout - move to frontmatter",
                )
            )

        for section in MANDATORY_SECTIONS:
            if re.search(rf"^{re.escape(section)}\b", body, re.MULTILINE) is None:
                failures.append(
                    (
                        "missing-section",
                        relative,
                        f"missing mandatory section: {section}",
                    )
                )

        sources = fm_get_list(frontmatter, "sources")
        if not sources:
            failures.append(("sources-empty", relative, "sources frontmatter is empty"))
        for source in sources:
            if source.lower().startswith("https://"):
                detail = validate_https_source(source)
            elif URL_SCHEME_RE.match(source):
                detail = "uses an unsupported URL scheme; only HTTPS is allowed"
            else:
                detail = validate_local_source(source)
            if detail:
                failures.append(("source-invalid", relative, f"{source} {detail}"))

        summary = fm_get_scalar(frontmatter, "summary")
        if summary is not None:
            if len(summary) < SUMMARY_MIN:
                failures.append(("summary-empty", relative, "summary is empty"))
            elif len(summary) > SUMMARY_MAX:
                failures.append(
                    (
                        "summary-too-long",
                        relative,
                        f"summary is {len(summary)} chars (max {SUMMARY_MAX})",
                    )
                )

        if not fm_has_non_empty_tags(frontmatter):
            failures.append(("tags-empty", relative, "tags frontmatter is empty"))

        for line_number, line in enumerate(body.split("\n"), 1):
            for match in WIKILINK_RE.finditer(line):
                target = match.group(1).strip()
                if target not in slugs:
                    failures.append(
                        (
                            "wikilink-broken",
                            relative,
                            f"line {line_number + offset}: [[{target}]] does not resolve",
                        )
                    )

        bucket = failures if is_v2 or strict else warnings
        for check, detail in v2_findings(body, offset):
            bucket.append((check, relative, detail))

    if not failures:
        print(f"OK - {page_count} pages, all checks pass.")
    else:
        print(f"FAIL - {len(failures)} issue(s) across {page_count} pages:\n")
        print_groups(failures)
    if warnings:
        print(
            f"WARN - {len(warnings)} warning(s) on legacy pages; they fail once the content "
            "migration lands (preview: --strict):\n"
        )
        print_groups(warnings)
    return 0 if not failures else 1


if __name__ == "__main__":
    sys.exit(main())

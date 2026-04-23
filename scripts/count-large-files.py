#!/usr/bin/env python3
"""Report source files grouped by line-count thresholds.

Usage:
  python scripts/count-large-files.py
  python scripts/count-large-files.py --root apps/web/src --top 30
"""

from __future__ import annotations

import argparse
from pathlib import Path


DEFAULT_EXTENSIONS = {
    ".css",
    ".js",
    ".jsx",
    ".mjs",
    ".ts",
    ".tsx",
}

EXCLUDED_DIRS = {
    ".git",
    ".next",
    ".turbo",
    "build",
    "coverage",
    "dist",
    "node_modules",
}

EXCLUDED_SUFFIXES = {
    ".d.ts",
    ".spec.ts",
    ".spec.tsx",
    ".test.ts",
    ".test.tsx",
}

THRESHOLDS = (100, 200, 300, 400, 500)


def should_skip(path: Path) -> bool:
    if any(part in EXCLUDED_DIRS for part in path.parts):
        return True

    name = path.name
    return any(name.endswith(suffix) for suffix in EXCLUDED_SUFFIXES)


def count_lines(path: Path) -> int:
    try:
        with path.open("r", encoding="utf-8", errors="ignore") as handle:
            return sum(1 for _ in handle)
    except OSError:
        return 0


def collect_files(root: Path, extensions: set[str]) -> list[tuple[int, Path]]:
    results: list[tuple[int, Path]] = []

    for path in root.rglob("*"):
        if not path.is_file() or path.suffix.lower() not in extensions:
            continue

        if should_skip(path):
            continue

        results.append((count_lines(path), path))

    return sorted(results, reverse=True, key=lambda item: item[0])


def print_summary(files: list[tuple[int, Path]], root: Path, top: int) -> None:
    print("")
    print("Large file report")
    print("=" * 80)
    print(f"Root: {root}")
    print(f"Files scanned: {len(files)}")
    print("")

    for threshold in THRESHOLDS:
        count = sum(1 for lines, _ in files if lines >= threshold)
        print(f">= {threshold:>3} lines: {count}")

    print("")
    print(f"Top {top} files")
    print("-" * 80)

    for lines, path in files[:top]:
        rel_path = path.relative_to(root)
        print(f"{lines:>6}  {rel_path}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Count large source files.")
    parser.add_argument("--root", default=".", help="Root directory to scan.")
    parser.add_argument("--top", type=int, default=40, help="Top files to show.")
    args = parser.parse_args()

    root = Path(args.root).resolve()
    files = collect_files(root, DEFAULT_EXTENSIONS)
    print_summary(files, root, args.top)


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
repo_stats_v2.py – One–shot repository diagnostic

• Git status / last commits
• Disk-usage profile (top folders)
• Node / npm / pnpm / vitest versions
• Outdated dependencies (prod & dev)
• Optional Vitest run summary
"""

from __future__ import annotations

import shutil
import subprocess
import sys
import textwrap
from argparse import ArgumentParser
from collections import Counter
from datetime import datetime
from pathlib import Path
from typing import Any, List, Sequence

# ──────────────────────────────────────────────────────────────────────────────
# helpers
# ──────────────────────────────────────────────────────────────────────────────


def run(
    cmd: Sequence[str | Path],
    cwd: Path | None = None,
    allow_fail: bool = False,
    capture: bool = True,
) -> str | None:
    """Run a command and return stripped stdout (or None on failure)."""
    try:
        res = subprocess.run(
            cmd,
            cwd=cwd,
            shell=isinstance(cmd, str),
            check=not allow_fail,
            text=True,
            stdout=subprocess.PIPE if capture else None,
            stderr=subprocess.PIPE if capture else None,
        )
        return res.stdout.strip() if capture else ""
    except subprocess.CalledProcessError as e:
        if allow_fail:
            return None
        raise RuntimeError(
            f"Command {' '.join(cmd)} failed with code {e.returncode}\n{e.stderr}"
        ) from e
    except FileNotFoundError:
        if allow_fail:
            return None
        raise


def sizeof_fmt(num: int, suffix="B") -> str:
    for unit in ["", "K", "M", "G", "T"]:
        if abs(num) < 1024.0:
            return f"{num:3.1f} {unit}{suffix}"
        num /= 1024.0
    return f"{num:.1f} P{suffix}"


# ──────────────────────────────────────────────────────────────────────────────
# git info
# ──────────────────────────────────────────────────────────────────────────────


def git_stats(repo: Path) -> str:
    head = run(["git", "rev-parse", "--abbrev-ref", "HEAD"], repo) or "N/A"
    last = (
        run(["git", "--no-pager", "log", "-1", "--pretty=%h %ad %s", "--date=short"], repo)
        or "N/A"
    )
    dirty = "(dirty)" if run(["git", "status", "--porcelain"], repo) else ""
    return f"**Git** branch `{head}` {dirty}\nLast commit: {last}"


# ──────────────────────────────────────────────────────────────────────────────
# node environment
# ──────────────────────────────────────────────────────────────────────────────


def node_env(repo: Path) -> str:
    info: dict[str, str] = {}
    for exe in ["node", "npm", "pnpm", "vitest"]:
        if exe == "vitest":
            # prefer local vitest; Fallback to `npx --no-install vitest`
            if shutil.which(exe) is None:
                cmd = ["npx", "--no-install", "vitest", "--version"]
            else:
                cmd = [exe, "--version"]
        else:
            cmd = [exe, "--version"]
        info[exe] = run(cmd, repo, allow_fail=True) or "N/A"
    return "\n".join(f"- {k}: {v}" for k, v in info.items())


# ──────────────────────────────────────────────────────────────────────────────
# disk usage
# ──────────────────────────────────────────────────────────────────────────────


def largest_dirs(repo: Path, top=8) -> str:
    sizes: Counter[Path] = Counter()
    exclude = {".git", "node_modules", ".pnpm", ".cache", ".mypy_cache"}
    for p in repo.rglob("*"):
        if p.is_file() and not any(part in exclude for part in p.parts):
            sizes[p.parent] += p.stat().st_size
    biggest = sizes.most_common(top)
    lines = [f"- {d.relative_to(repo)}: {sizeof_fmt(sz)}" for d, sz in biggest]
    return "\n".join(lines)


# ──────────────────────────────────────────────────────────────────────────────
# outdated deps (npm or pnpm)
# ──────────────────────────────────────────────────────────────────────────────


def outdated_packages(repo: Path) -> str:
    lock_pnpm = repo / "pnpm-lock.yaml"
    lock_npm = repo / "package-lock.json"
    cmd: list[str] | None = None
    if lock_pnpm.exists():
        cmd = ["pnpm", "outdated", "--no-table", "--color=false"]
    elif lock_npm.exists():
        cmd = ["npm", "outdated", "--json"]
    if not cmd:
        return "_No lockfile – skipping outdated check_"
    out = run(cmd, repo, allow_fail=True)
    if not out:
        return "✅ All dependencies up-to-date"
    return textwrap.indent(out, "    ")


# ──────────────────────────────────────────────────────────────────────────────
# vitest summary (optional)
# ──────────────────────────────────────────────────────────────────────────────


def vitest_summary(repo: Path) -> str:
    # run with json reporter for fast parsing
    cmd = ["npx", "--no-install", "vitest", "run", "--reporter=json", "--silent"]
    out = run(cmd, repo, allow_fail=True)
    if not out:
        return "_Vitest not installed / skipped_"
    import json

    data = json.loads(out)
    passed = data.get("numPassedTests", 0)
    failed = data.get("numFailedTests", 0)
    snapshot = data.get("numTotalSnapshots", 0)
    status = "✅" if failed == 0 else "❌"
    return f"{status} Vitest results – passed: **{passed}**, failed: **{failed}**, snapshots: **{snapshot}**"


# ──────────────────────────────────────────────────────────────────────────────
# main
# ──────────────────────────────────────────────────────────────────────────────


def main(target: Path, run_tests: bool = False) -> None:
    repo = target.resolve()
    report_parts: list[str] = []
    report_parts.append(f"# Repository diagnostics – {repo.name}")
    report_parts.append(f"_Generated {datetime.now().isoformat(timespec='seconds')}_\n")

    report_parts.append(git_stats(repo))
    report_parts.append("\n### Tool versions\n" + node_env(repo))

    report_parts.append("\n### Largest directories (excluding node_modules/.git)\n" + largest_dirs(repo))

    report_parts.append("\n### Outdated dependencies\n" + outdated_packages(repo))

    if run_tests:
        report_parts.append("\n### Vitest summary\n" + vitest_summary(repo))

    output = "\n\n".join(report_parts)
    out_file = repo / "repo-diagnostic.md"
    out_file.write_text(output, encoding="utf-8")
    print(f"👉 Diagnostic written to {out_file}")


if __name__ == "__main__":
    ap = ArgumentParser()
    ap.add_argument(
        "path",
        nargs="?",
        default=".",
        help="Path to repo (defaults to current directory)",
    )
    ap.add_argument(
        "--run-tests",
        action="store_true",
        help="Run Vitest and include summary",
    )
    args = ap.parse_args()

    try:
        main(Path(args.path), run_tests=args.run_tests)
    except Exception as e:
        sys.exit(f"[repo_stats_v2] fatal: {e}")

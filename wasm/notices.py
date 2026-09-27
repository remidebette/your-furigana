#!/usr/bin/env python3
"""Writes the license notices of everything compiled into the .wasm (Rust crates,
proc-macros excluded as they only run at build time) and of the IPADIC dictionary."""
import json
import pathlib
import subprocess
import sys

output, ipadic_copying = sys.argv[1], sys.argv[2]
meta = json.loads(subprocess.check_output(
    ["cargo", "metadata", "--format-version", "1", "--filter-platform", "wasm32-unknown-unknown"]))
packages = {p["id"]: p for p in meta["packages"]}
nodes = {n["id"]: n for n in meta["resolve"]["nodes"]}

# Walk the normal (runtime) dependencies from this crate
shipped, stack = set(), [meta["resolve"]["root"]]
while stack:
    pid = stack.pop()
    if pid in shipped:
        continue
    if any("proc-macro" in target["kind"] for target in packages[pid]["targets"]):
        continue
    shipped.add(pid)
    stack += [d["pkg"] for d in nodes[pid]["deps"] if any(k["kind"] is None for k in d["dep_kinds"])]

sections = ["Third-party notices for the Your Furigana tokenizer (furigana_wasm_bg.wasm)\n"
            "and the IPADIC dictionary files (public/data/ipadic).\n"]
sections.append("=" * 78 + "\nIPADIC (mecab-ipadic 2.7.0)\n" + "=" * 78 + "\n\n"
                + pathlib.Path(ipadic_copying).read_text())
# Group the crates sharing the same license texts, to print each text once
groups = {}
for pid in sorted(shipped, key=lambda i: packages[i]["name"]):
    package = packages[pid]
    if package["source"] is None:  # this crate (MIT, see LICENSE.txt at the root of the repository)
        continue
    folder = pathlib.Path(package["manifest_path"]).parent
    files = sorted(f for f in folder.iterdir()
                   if f.is_file() and f.name.upper().startswith(("LICENSE", "LICENCE", "COPYING", "NOTICE", "UNLICENSE")))
    text = "\n\n".join(f.read_text(errors="replace").strip() for f in files) \
        or f"{package['license']} license, see {package.get('repository') or package['name']} (no license file in the published crate)"
    groups.setdefault(text, []).append(f"{package['name']} {package['version']} ({package['license']})")
for text, crates in sorted(groups.items(), key=lambda g: g[1][0]):
    sections.append("=" * 78 + "\n" + "\n".join(crates) + "\n" + "=" * 78 + "\n\n" + text + "\n")

pathlib.Path(output).write_text("\n\n".join(sections))
print(f"{len(shipped) - 1} crates, {len(groups)} distinct license texts, written to {output}")

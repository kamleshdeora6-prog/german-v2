#!/usr/bin/env python3
"""Build the two editions of Deutsch Coach from this repo.

  python3 tools/make_editions.py OUT_DIR

  OUT_DIR/german-v2      – stable edition (daily use) = this repo as it is
  OUT_DIR/german-v2-lab  – lab edition (testing): own storage, own caches, LAB name, Gemma 4, diagnostics

Both can be published on the same GitHub account (two repos → two Pages sites on the same origin);
storage keys and cache names are separate, so they never touch each other's progress."""
import json, re, shutil, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SKIP = shutil.ignore_patterns(".git", "__pycache__", "node_modules", "*.apk", "out", "dist")

def sub(p, a, b, count=1):
    s = p.read_text(encoding="utf-8")
    if a not in s:
        sys.exit(f"make_editions: '{a[:60]}' not found in {p}")
    p.write_text(s.replace(a, b, count), encoding="utf-8")

def main(out):
    out = Path(out); out.mkdir(parents=True, exist_ok=True)
    st, lab = out / "german-v2", out / "german-v2-lab"
    for d in (st, lab):
        if d.exists(): shutil.rmtree(d)
    shutil.copytree(ROOT, st, ignore=SKIP)
    shutil.copytree(ROOT, lab, ignore=SKIP)
    # --- lab ---
    (lab / "js/edition.js").write_text((ROOT / "js/edition.js").read_text().replace('window.EDITION = "stable";', 'window.EDITION = "lab";'))
    sub(lab / "sw.js", 'const PREFIX = "deutsch-coach-v";', 'const PREFIX = "deutsch-coach-lab-v";')
    ver = re.search(r'version: "([^"]+)"', (ROOT / "js/app.js").read_text()).group(1)
    sub(lab / "js/app.js", f'version: "{ver}"', f'version: "{ver}-lab"')
    m = json.loads((lab / "manifest.webmanifest").read_text())
    m["name"] = "Deutsch Coach LAB – test version"; m["short_name"] = "DC Lab"; m["theme_color"] = "#7C3F98"
    (lab / "manifest.webmanifest").write_text(json.dumps(m, ensure_ascii=False, indent=2) + "\n")
    sub(lab / "index.html", "<title>Deutsch Coach – German A1 to C2</title>", "<title>Deutsch Coach LAB – test version</title>")
    sub(lab / "index.html", "</body>", '<div class="labbadge" title="Test version – separate progress">LAB</div>\n</body>')
    css = lab / "css/app.css"
    css.write_text(css.read_text() + "\n/* lab edition badge */\n.labbadge{position:fixed;top:6px;right:6px;z-index:9999;background:#7C3F98;color:#fff;font:700 11px/1 system-ui,sans-serif;letter-spacing:.08em;padding:4px 7px;border-radius:6px;pointer-events:none;opacity:.9}\n")
    # the native apps are built from the stable edition only
    for d in ("android", "ios"):
        if (lab / d).exists(): shutil.rmtree(lab / d)
    for wf in (lab / ".github/workflows").glob("*.yml"):
        if re.search(r"android|ios|apk", wf.name, re.I): wf.unlink()
    shutil.copy(ROOT / "LAB_README.md", lab / "README.md")
    print(f"stable → {st}\nlab    → {lab}")

if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "dist")

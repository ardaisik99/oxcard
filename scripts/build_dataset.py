"""
Builds a clean, CEFR-leveled Oxford 3000 English-Turkish JSON dataset.
Sources:
  - ciwga/Oxford3000_Vocab (MIT License) for definitions, Turkish translations, examples, collocations, synonyms.
  - nalgeon/words (oxford-5k.csv) for official Oxford CEFR level mapping (A1, A2, B1, B2).
"""
import csv
import hashlib
import io
import json
import os
import re
import sys
import urllib.request
from collections import Counter

sys.stdout.reconfigure(encoding="utf-8")

CIWGA_URL = "https://raw.githubusercontent.com/ciwga/Oxford3000_Vocab/main/oxford3000_vocabulary_with_collocations_and_definitions_datasets.csv"
OX5K_URL = "https://raw.githubusercontent.com/nalgeon/words/main/data/oxford-5k.csv"

CEFR_RANK = {"a1": 1, "a2": 2, "b1": 3, "b2": 4, "c1": 5}
POS_MAP = {
    "noun": "isim",
    "verb": "fiil",
    "adjective": "sıfat",
    "adverb": "zarf",
    "preposition": "edat",
    "conjunction": "bağlaç",
    "pronoun": "zamir",
    "determiner": "belirteç",
    "exclamation": "ünlem",
    "interjection": "ünlem",
    "modal verb": "yardımcı fiil",
    "auxiliary verb": "yardımcı fiil",
    "phrasal verb": "deyim fiil",
    "number": "sayı",
    "article": "tanımlık",
}


def fetch_text(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return resp.read().decode("utf-8")


def clean_list_field(raw: str, limit: int = 3) -> list[str]:
    if not raw:
        return []
    val = raw.strip()
    if not val or val.lower() in ("none", "n/a", "-"):
        return []
    parts = [p.strip() for p in val.split(",") if p.strip() and p.strip().lower() not in ("none", "n/a")]
    # Deduplicate preserving order
    out = []
    seen = set()
    for p in parts:
        pl = p.lower()
        if pl not in seen and len(p) <= 45:
            seen.add(pl)
            out.append(p)
        if len(out) >= limit:
            break
    return out


def infer_cefr(word: str, cefr_map: dict[str, str]) -> str:
    wl = word.lower().strip()
    if wl in cefr_map:
        lvl = cefr_map[wl]
        return "B2" if lvl == "c1" else lvl.upper()

    # Handle multi-word phrases like "account for" -> base word "account"
    if " " in wl:
        first = wl.split()[0]
        if first in cefr_map:
            lvl = cefr_map[first]
            return "B2" if lvl == "c1" else lvl.upper()

    # Common suffix stripping for stem lookup
    suffixes = [
        ("ily", "y"), ("ies", "y"), ("ied", "y"),
        ("ingly", ""), ("edly", ""), ("ally", ""), ("ly", ""),
        ("ing", ""), ("ing", "e"), ("ed", ""), ("ed", "e"),
        ("ation", "e"), ("ation", ""), ("tion", "t"), ("ment", ""),
        ("ness", ""), ("ful", ""), ("less", ""), ("al", ""),
        ("er", ""), ("er", "e"), ("est", ""), ("s", ""), ("es", ""),
    ]
    for suf, rep in suffixes:
        if wl.endswith(suf) and len(wl) - len(suf) >= 3:
            stem = wl[: -len(suf)] + rep
            if stem in cefr_map:
                lvl = cefr_map[stem]
                return "B2" if lvl == "c1" else lvl.upper()

    # Fallback sensible level
    if len(wl) <= 4:
        return "A2"
    return "B1"


def normalize_pos(raw_pos: str) -> str:
    if not raw_pos:
        return "word"
    first = raw_pos.split(",")[0].strip().lower()
    if not first or first == "none":
        return "word"
    return first


def stable_hash_key(word: str) -> str:
    return hashlib.sha256(f"oxcard-v1:{word.lower()}".encode("utf-8")).hexdigest()


def main():
    print("Downloading datasets...")
    ciwga_text = fetch_text(CIWGA_URL)
    ox5k_text = fetch_text(OX5K_URL)

    cefr_map: dict[str, str] = {}
    for row in csv.DictReader(io.StringIO(ox5k_text)):
        w = (row.get("word") or "").strip().lower()
        lvl = (row.get("level") or "").strip().lower()
        if w and lvl in CEFR_RANK:
            if w not in cefr_map or CEFR_RANK[lvl] < CEFR_RANK[cefr_map[w]]:
                cefr_map[w] = lvl

    items = []
    seen = set()
    skipped = []

    for row in csv.DictReader(io.StringIO(ciwga_text)):
        w = (row.get("Word") or "").strip()
        tr = (row.get("Turkish Translation") or "").strip()
        defn = (row.get("Definition") or "").strip()
        ex = (row.get("Example Sentence") or "").strip()
        pos_raw = (row.get("Part of Speech") or "").strip()

        if not w or not tr:
            skipped.append(w)
            continue

        # Skip raw prefixes/suffixes like "anti-", "non-", "-ed" or single-letter entries like "a"
        if w.endswith("-") or w.startswith("-") or len(w) < 2:
            skipped.append(w)
            continue

        wl = w.lower()
        if wl in seen:
            continue
        seen.add(wl)

        # Clean stray whitespace/quotes
        tr = re.sub(r"\s+", " ", tr).strip()
        defn = re.sub(r"\s+", " ", defn).strip()
        ex = re.sub(r"\s+", " ", ex).strip()

        lvl = infer_cefr(w, cefr_map)
        pos = normalize_pos(pos_raw)
        syn = clean_list_field(row.get("Synonyms") or "", limit=3)
        col = clean_list_field(row.get("Collocations") or "", limit=3)

        entry = {
            "w": w,
            "tr": tr,
            "def": defn,
            "ex": ex,
            "pos": pos,
            "lvl": lvl,
        }
        if syn:
            entry["syn"] = syn
        if col:
            entry["col"] = col
        items.append(entry)

    # Sort primarily by CEFR band (A1 -> A2 -> B1 -> B2), and inside each band
    # use a deterministic hash shuffle so users get varied, natural daily batches
    # instead of 20 alphabetical 'A' words on Day 1!
    lvl_order = {"A1": 1, "A2": 2, "B1": 3, "B2": 4}
    items.sort(key=lambda x: (lvl_order[x["lvl"]], stable_hash_key(x["w"])))

    for idx, item in enumerate(items, start=1):
        item["id"] = idx

    out_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "src", "data")
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, "oxford3000.json")

    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(items, f, ensure_ascii=False, separators=(",", ":"))

    counts = Counter(x["lvl"] for x in items)
    size_kb = os.path.getsize(out_path) / 1024
    print(f"Wrote {len(items)} words to {out_path} ({size_kb:.1f} KB)")
    print("CEFR distribution:", dict(sorted(counts.items())))
    print(f"Skipped ({len(skipped)}):", skipped[:20])
    print("\nSample first 12 words (Day 1 preview):")
    for x in items[:12]:
        print(f"  [{x['lvl']}] {x['w']} ({x['pos']}) -> {x['tr']} | ex: {x['ex']}")


if __name__ == "__main__":
    main()

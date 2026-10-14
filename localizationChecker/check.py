#!/usr/bin/env python3
"""Compare localization keys.

Core tables: assets/src/data/string/string_en.js vs string_zh.js (zh is the reference).
Extension modules: each strings_en.js must match strings_zh.js in the same folder.
"""
import os
import re
import sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
STRING_DIR = os.path.join(ROOT, "assets", "src", "data", "string")
EXT_DIR = os.path.join(ROOT, "assets", "src", "ext")


def js_object_keys(path):
    text = open(path, encoding="utf-8").read()
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if not match:
        raise SystemExit("no object in " + path)
    body = match.group()
    return set(re.findall(r'"([^"]+)"\s*:', body))


def ext_keys(path, lang):
    text = open(path, encoding="utf-8").read()
    return set(re.findall(r'ExtStrings\.%s\["([^"]+)"\]' % re.escape(lang), text))


def report(label, reference, target):
    missing = sorted(reference - target)
    extra = sorted(target - reference)
    if not missing and not extra:
        print("%s: ok (%d keys)" % (label, len(reference)))
        return 0
    for key in missing:
        print("%s: missing %s" % (label, key))
    for key in extra:
        print("%s: extra %s" % (label, key))
    return 1


def main():
    failed = 0
    zh = js_object_keys(os.path.join(STRING_DIR, "string_zh.js"))
    en = js_object_keys(os.path.join(STRING_DIR, "string_en.js"))
    failed |= report("core en", zh, en)
    hant_path = os.path.join(STRING_DIR, "string_zh-Hant.js")
    if os.path.exists(hant_path):
        failed |= report("core zh-Hant", zh, js_object_keys(hant_path))

    for dirpath, _, names in os.walk(EXT_DIR):
        if "strings_en.js" not in names:
            continue
        en_keys = ext_keys(os.path.join(dirpath, "strings_en.js"), "en")
        zh_path = os.path.join(dirpath, "strings_zh.js")
        if not os.path.exists(zh_path):
            print("%s: missing strings_zh.js" % dirpath)
            failed = 1
            continue
        rel = os.path.relpath(dirpath, ROOT)
        failed |= report(rel, en_keys, ext_keys(zh_path, "zh"))

    return failed


if __name__ == "__main__":
    sys.exit(main())

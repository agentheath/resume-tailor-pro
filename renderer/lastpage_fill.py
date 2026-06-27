#!/usr/bin/env python3
"""lastpage_fill.py <resume.pdf>

Prints how far down text reaches on the LAST page of a PDF, as a percent of page
height (ground truth, via poppler's `pdftotext -bbox`). Used by check.sh to flag
the "orphan zone" — a 2-page render whose last page holds only a line or two.

Output: an integer percent, or "?" if it can't be determined.
"""
import sys
import re
import subprocess

def main():
    if len(sys.argv) < 2:
        print("?"); return
    pdf = sys.argv[1]
    try:
        xml = subprocess.run(
            ["pdftotext", "-bbox", pdf, "-"],
            capture_output=True, text=True, check=True,
        ).stdout
    except Exception:
        print("?"); return
    pages = re.findall(r'<page[^>]*height="([\d.]+)"[^>]*>(.*?)</page>', xml, re.S)
    if not pages:
        print("?"); return
    height, body = pages[-1]
    ys = [float(m) for m in re.findall(r'yMax="([\d.]+)"', body)]
    if not ys:
        print("0"); return
    print(f"{max(ys) / float(height) * 100:.0f}")

if __name__ == "__main__":
    main()

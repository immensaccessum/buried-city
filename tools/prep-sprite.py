#!/usr/bin/env python3
"""Fit a generated image into a game sprite slot.

Knocks out a near-white background, scales down to fit, and centers on a
transparent canvas of the original frame size (item icon 84x84, item dig
446x264, monster dig 526x230).
"""
import sys
from PIL import Image


def prep(src, dst, width, height, white=245):
    image = Image.open(src).convert("RGBA")
    pixels = []
    for r, g, b, a in image.getdata():
        if r >= white and g >= white and b >= white:
            pixels.append((r, g, b, 0))
        else:
            pixels.append((r, g, b, a))
    image.putdata(pixels)
    image.thumbnail((width, height), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    canvas.paste(image, ((width - image.width) // 2, (height - image.height) // 2), image)
    canvas.save(dst)
    print("wrote %s %sx%s" % (dst, width, height))


if __name__ == "__main__":
    if len(sys.argv) != 5:
        sys.exit("usage: prep-sprite.py SRC DST WIDTH HEIGHT")
    prep(sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4]))

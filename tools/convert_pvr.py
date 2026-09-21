"""Convert Buried City's .pvr.ccz sprite atlases to PNG for the browser engine.

The textures are CCZ containers (zlib) around PVR v2 (RGBA4444) or PVR v3 (RGBA8888)
data with straight (non-premultiplied) alpha. Each atlas' .plist is repointed to the PNG.
Usage: python tools/convert_pvr.py [assets/res]   (needs Pillow + numpy)
"""
import glob, os, re, struct, sys, zlib
import numpy as np
from PIL import Image

PVR2_RGBA4444, PVR2_RGBA8888 = 0x10, 0x12
PVR3_RGBA8888 = int.from_bytes(b"rgba", "little") | (0x08080808 << 32)


def decode(path):
    raw = open(path, "rb").read()
    assert raw[:4] == b"CCZ!", "not a CCZ file (encrypted CCZp is not supported)"
    comp, _ver, _ck, size = struct.unpack(">HHII", raw[4:16])
    assert comp == 0, "only zlib CCZ supported"
    pvr = zlib.decompress(raw[16:])
    assert len(pvr) == size
    if pvr[:4] == b"PVR\x03":
        _v, flags, fmt, _cs, _ct, h, w, depth, surf, faces, mips, meta = struct.unpack("<IIQIIIIIIIII", pvr[:52])
        assert fmt == PVR3_RGBA8888, hex(fmt)
        px = np.frombuffer(pvr[52 + meta:52 + meta + w * h * 4], np.uint8).reshape(h, w, 4)
        return Image.fromarray(px, "RGBA")
    hdr = struct.unpack("<13I", pvr[:52])
    assert pvr[44:48] == b"PVR!", "unknown PVR header"
    h, w, flags = hdr[1], hdr[2], hdr[4]
    fmt = flags & 0xFF
    body = pvr[hdr[0]:]
    if fmt == PVR2_RGBA4444:
        v = np.frombuffer(body[:w * h * 2], "<u2").reshape(h, w)
        px = np.stack([(v >> 12) & 15, (v >> 8) & 15, (v >> 4) & 15, v & 15], -1).astype(np.uint8) * 17
    elif fmt == PVR2_RGBA8888:
        px = np.frombuffer(body[:w * h * 4], np.uint8).reshape(h, w, 4)
    else:
        raise ValueError("unsupported PVR v2 pixel format 0x%x" % fmt)
    img = Image.fromarray(px, "RGBA")
    if flags & 0x10000:  # vertical flip flag
        img = img.transpose(Image.FLIP_TOP_BOTTOM)
    return img


def main(res_dir):
    for src in sorted(glob.glob(os.path.join(res_dir, "*.pvr.ccz"))):
        base = src[:-len(".pvr.ccz")]
        png = base + ".png"
        decode(src).save(png, optimize=True)
        plist = base + ".plist"
        name = os.path.basename(src)
        if os.path.exists(plist):
            text = open(plist, encoding="utf-8").read()
            open(plist, "w", encoding="utf-8", newline="").write(text.replace(name, os.path.basename(png)))
        os.remove(src)
        print("%s -> %s (%d KB)" % (name, os.path.basename(png), os.path.getsize(png) // 1024))
    left = [p for p in glob.glob(os.path.join(res_dir, "**", "*"), recursive=True) if re.search(r"\.(pvr|ccz|pkm|webp)$", p)]
    if left:
        print("WARNING: unconverted textures:", left)


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), "..", "assets", "res"))

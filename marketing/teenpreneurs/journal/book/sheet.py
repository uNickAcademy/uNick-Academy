import sys, pymupdf as fitz
from PIL import Image
pdf, out, first, last = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4])
cols = int(sys.argv[5]) if len(sys.argv) > 5 else 4
dpi = int(sys.argv[6]) if len(sys.argv) > 6 else 55
d = fitz.open(pdf)
ims = []
for i in range(first - 1, min(last, len(d))):
    pix = d[i].get_pixmap(dpi=dpi)
    ims.append(Image.frombytes("RGB", (pix.width, pix.height), pix.samples))
w, h = ims[0].size
rows = (len(ims) + cols - 1) // cols
sheet = Image.new("RGB", (cols * (w + 8) + 8, rows * (h + 8) + 8), (120, 120, 120))
for k, im in enumerate(ims):
    sheet.paste(im, (8 + (k % cols) * (w + 8), 8 + (k // cols) * (h + 8)))
sheet.save(out)
print(sheet.size)

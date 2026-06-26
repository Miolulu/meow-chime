from PIL import Image
import os

cats_dir = r"C:\Users\hortor\Projects\meow-chime\public\assets\cats"

for fname in os.listdir(cats_dir):
    if not fname.endswith('.png'):
        continue
    path = os.path.join(cats_dir, fname)
    img = Image.open(path).convert("RGBA")
    pixels = img.load()
    w, h = img.size
    
    for y in range(h):
        for x in range(w):
            r, g, b, a = pixels[x, y]
            if r < 10 and g < 10 and b < 10:
                pixels[x, y] = (0, 0, 0, 0)
    
    # Trim transparent edges
    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)
    
    img.save(path, "PNG")
    print(f"Processed: {fname} -> {img.size[0]}x{img.size[1]}")

print("Done!")

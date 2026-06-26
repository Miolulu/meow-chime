from PIL import Image
import os

icons_dir = r"C:\Users\hortor\Projects\meow-chime\public\assets\icons"

# Background is dark blue around (16, 23, 41)
# Remove pixels that are dark and bluish

for fname in os.listdir(icons_dir):
    if not fname.endswith('.png'):
        continue
    path = os.path.join(icons_dir, fname)
    img = Image.open(path).convert("RGBA")
    pixels = img.load()
    w, h = img.size
    
    for y in range(h):
        for x in range(w):
            r, g, b, a = pixels[x, y]
            # Remove dark pixels (low brightness, any hue)
            if r < 40 and g < 45 and b < 55:
                pixels[x, y] = (0, 0, 0, 0)
    
    # Trim transparent edges
    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)
    
    img.save(path, "PNG")
    print(f"Processed: {fname} -> {img.size[0]}x{img.size[1]}")

print("Done!")

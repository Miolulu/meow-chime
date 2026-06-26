from PIL import Image
import os

src = r"C:\Users\hortor\.cursor\projects\c-Users-hortor-Projects-meow-chime\assets\c__Users_hortor_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_image-a2f5a138-2609-4b38-987c-8fb976fd5ea4.png"
out_dir = r"C:\Users\hortor\Projects\meow-chime\public\assets\cats"
os.makedirs(out_dir, exist_ok=True)

img = Image.open(src).convert("RGBA")
w, h = img.size
print(f"Source image: {w}x{h}")

col_w = w // 4
row_h = h // 2

# Each cell has ~40px of text label at top, skip it
label_offset = 45

cats = [
    ("do", 0, 0),
    ("re", 0, 1),
    ("mi", 0, 2),
    ("fa", 0, 3),
    ("so", 1, 0),
    ("la", 1, 2),
    ("ti", 1, 3),
]

for name, row, col in cats:
    x1 = col * col_w
    y1 = row * row_h + label_offset
    x2 = x1 + col_w
    y2 = (row + 1) * row_h
    
    crop = img.crop((x1, y1, x2, y2))
    
    # Remove pure black background (strict threshold < 10)
    pixels = crop.load()
    cw, ch = crop.size
    for py in range(ch):
        for px in range(cw):
            r, g, b, a = pixels[px, py]
            if r < 10 and g < 10 and b < 10:
                pixels[px, py] = (0, 0, 0, 0)
    
    # Trim transparent edges
    bbox = crop.getbbox()
    if bbox:
        crop = crop.crop(bbox)
    
    # Normalize all to 280px height
    target_h = 280
    aspect = crop.size[0] / crop.size[1]
    target_w = int(target_h * aspect)
    crop = crop.resize((target_w, target_h), Image.LANCZOS)
    
    out_path = os.path.join(out_dir, f"cat_{name}.png")
    crop.save(out_path, "PNG")
    print(f"Saved: cat_{name}.png ({crop.size[0]}x{crop.size[1]})")

print("Done!")

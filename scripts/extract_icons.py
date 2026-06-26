from PIL import Image
import os

src = r"C:\Users\hortor\.cursor\projects\c-Users-hortor-Projects-meow-chime\assets\c__Users_hortor_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_image-2c79189d-01a1-45c3-b2d1-3a4bfdc68713.png"
out_dir = r"C:\Users\hortor\Projects\meow-chime\public\assets\icons"
os.makedirs(out_dir, exist_ok=True)

img = Image.open(src).convert("RGBA")
w, h = img.size
print(f"Source: {w}x{h}")

# 8 icons in a row: play, random, record, share, settings, back, close, mute
# Each icon occupies roughly w/8 width
icon_w = w // 8
# Skip bottom text label area (roughly bottom 20%)
content_h = int(h * 0.75)

icons = [
    ("play", 0),
    ("random", 1),
    ("record", 2),
    ("share", 3),
    ("settings", 4),
    ("back", 5),
    ("close", 6),
    ("mute", 7),
]

for name, col in icons:
    x1 = col * icon_w
    y1 = 0
    x2 = x1 + icon_w
    y2 = content_h
    
    crop = img.crop((x1, y1, x2, y2))
    
    # Remove black background
    pixels = crop.load()
    cw, ch = crop.size
    for py in range(ch):
        for px in range(cw):
            r, g, b, a = pixels[px, py]
            if r < 12 and g < 12 and b < 12:
                pixels[px, py] = (0, 0, 0, 0)
    
    # Trim
    bbox = crop.getbbox()
    if bbox:
        crop = crop.crop(bbox)
    
    # Normalize to 64x64
    crop = crop.resize((64, 64), Image.LANCZOS)
    
    out_path = os.path.join(out_dir, f"icon_{name}.png")
    crop.save(out_path, "PNG")
    print(f"Saved: icon_{name}.png")

print("Done!")

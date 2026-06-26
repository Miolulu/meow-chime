from PIL import Image
import os

src = r"C:\Users\hortor\.cursor\projects\c-Users-hortor-Projects-meow-chime\assets\c__Users_hortor_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_image-a2f5a138-2609-4b38-987c-8fb976fd5ea4.png"
out_dir = r"C:\Users\hortor\Projects\meow-chime\public\assets\cats"

img = Image.open(src).convert("RGBA")
w, h = img.size
col_w = w // 4
row_h = h // 2
label_offset = 45

# LA = row 1, col 1 (the one with goggles and potion bottle)
x1 = 1 * col_w
y1 = 1 * row_h + label_offset
x2 = x1 + col_w
y2 = 2 * row_h

crop = img.crop((x1, y1, x2, y2))

pixels = crop.load()
cw, ch = crop.size
for py in range(ch):
    for px in range(cw):
        r, g, b, a = pixels[px, py]
        if r < 10 and g < 10 and b < 10:
            pixels[px, py] = (0, 0, 0, 0)

bbox = crop.getbbox()
if bbox:
    crop = crop.crop(bbox)

target_h = 280
aspect = crop.size[0] / crop.size[1]
target_w = int(target_h * aspect)
crop = crop.resize((target_w, target_h), Image.LANCZOS)

out_path = os.path.join(out_dir, "cat_la.png")
crop.save(out_path, "PNG")
print(f"Saved: cat_la.png ({crop.size[0]}x{crop.size[1]})")

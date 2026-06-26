"""
喵喵音阶森林 - 猫咪主角重新裁切 (修正坐标)
"""

import os
from PIL import Image
from rembg import remove

ASSETS_DIR = r"C:\Users\hortor\.cursor\projects\c-Users-hortor-Projects-meow-chime\assets"
OUTPUT_DIR = r"C:\Users\hortor\Projects\meow-chime\public\assets\cats_main"

IMG2 = os.path.join(ASSETS_DIR, "c__Users_hortor_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_image-4374edb9-c1ce-4055-ab54-27890387eebb.png")

# Image 2 is 1024x682
# Layout: left sidebar ~160px, then 4 cat panels in top row, 3+1 in bottom row
# Each top cat panel: ~205px wide, full height ~330px
# Main cat illustration is inside each panel, roughly in the upper-center area
# Using generous crops to capture full cat + accessories

CATS_MAIN_FIXED = {
    # Top row cats - panels span y:10 to y:330, but main illustration is ~y:30-220
    "cat_do_idle": (170, 30, 370, 240),       # DO 指挥家猫 - wider crop
    "cat_re_idle": (377, 30, 570, 240),       # RE 学者猫
    "cat_mi_idle": (577, 30, 775, 240),       # MI 黑魔法师猫
    "cat_fa_idle": (782, 30, 975, 240),       # FA 甜点师猫
    # Bottom row cats - panels span y:345 to y:675
    "cat_so_idle": (55, 370, 290, 580),       # SO 海盗猫
    "cat_la_idle": (300, 370, 535, 580),      # LA 发明家猫
    "cat_ti_idle": (545, 370, 775, 580),      # TI 占星师猫
}


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    img = Image.open(IMG2)
    print(f"Image size: {img.size}")
    print(f"Reprocessing {len(CATS_MAIN_FIXED)} main cat characters...\n")

    for name, bbox in CATS_MAIN_FIXED.items():
        left, top, right, bottom = bbox
        left = max(0, left)
        top = max(0, top)
        right = min(img.width, right)
        bottom = min(img.height, bottom)

        cropped = img.crop((left, top, right, bottom))
        print(f"  Cropping {name}: {cropped.size} from ({left},{top},{right},{bottom})")

        # Save raw crop for debugging
        debug_dir = os.path.join(OUTPUT_DIR, "_debug")
        os.makedirs(debug_dir, exist_ok=True)
        cropped.save(os.path.join(debug_dir, f"{name}_raw.png"))

        # Remove background
        result = remove(cropped)

        # Auto-trim
        result_bbox = result.getbbox()
        if result_bbox:
            result = result.crop(result_bbox)

        output_path = os.path.join(OUTPUT_DIR, f"{name}.png")
        result.save(output_path, "PNG")
        print(f"  -> Saved: {name}.png ({result.size[0]}x{result.size[1]})")

    print("\nDone!")


if __name__ == "__main__":
    main()

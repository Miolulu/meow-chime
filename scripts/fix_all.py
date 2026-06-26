"""
喵喵音阶森林 - 修正所有裁切坐标重新提取
基于对图片的实际观察重新估算位置
"""

import os
from PIL import Image
from rembg import remove

ASSETS_DIR = r"C:\Users\hortor\.cursor\projects\c-Users-hortor-Projects-meow-chime\assets"
OUTPUT_DIR = r"C:\Users\hortor\Projects\meow-chime\public\assets"

IMG1 = os.path.join(ASSETS_DIR, "c__Users_hortor_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_image-c0e93231-40b4-488d-b3ca-fbd31f4ecb57.png")
IMG2 = os.path.join(ASSETS_DIR, "c__Users_hortor_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_image-4374edb9-c1ce-4055-ab54-27890387eebb.png")
IMG3 = os.path.join(ASSETS_DIR, "c__Users_hortor_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_image-713d0b9a-49be-44b8-bd45-06f74e3b3f77.png")

# Image 1 (1024x682): Design System
# Layout: Left sidebar 0-180px | Center 185-545px | Right 550-1024px
# Section 04 KEY ILLUSTRATIONS is in center-bottom (x:185-545, y:330-625)
# Illustration thumbnails are in rounded containers, ~100-110px wide
CROPS_IMG1 = {
    "illustrations": {
        # Row 1: MAGIC BELL, MOON, FIREFLY (y: 350-438)
        "magic_bell": (210, 350, 325, 438),
        "moon": (330, 350, 440, 438),
        "firefly": (445, 350, 540, 438),
        # Row 2: TREE_01, TREE_02, MUSHROOM GLOW (y: 445-535)
        "tree_01": (210, 445, 325, 535),
        "tree_02": (330, 445, 440, 535),
        "mushroom_glow": (445, 445, 545, 535),
        # Row 3: BUSH, ROCK, FLOWER, LANTERN (y: 540-615)
        "bush": (210, 540, 290, 615),
        "rock": (295, 540, 370, 615),
        "flower": (375, 540, 450, 615),
        "lantern": (455, 540, 540, 615),
    },
    # Icon style - bottom of left sidebar (x:15-180, y:555-620)
    "icons": {
        "icon_play": (18, 565, 48, 595),
        "icon_random": (52, 565, 82, 595),
        "icon_record": (86, 565, 116, 595),
        "icon_share": (120, 565, 150, 595),
        "icon_settings": (18, 600, 48, 630),
        "icon_back": (52, 600, 82, 630),
        "icon_close": (86, 600, 116, 630),
        "icon_mute": (120, 600, 150, 630),
    },
    # Background parallax layers from Section 03 (right side, x:700-1020)
    "backgrounds": {
        "bg_starry_sky": (700, 45, 1020, 110),
        "bg_far_view": (700, 115, 1020, 175),
        "bg_far_mountain": (700, 180, 1020, 240),
        "bg_mid_forest": (700, 245, 1020, 305),
        "bg_front_particles": (700, 310, 1020, 370),
        "bg_front_grass": (700, 375, 1020, 435),
    },
}

# Image 3 (1024x682): UI Components & Icons
# Wider layout with multiple sections
CROPS_IMG3 = {
    "navigation": {
        "nav_bar": (178, 22, 855, 62),
    },
    "buttons": {
        # Section 02 BUTTONS (left side, y:80-145)
        "btn_primary": (28, 95, 115, 128),
        "btn_secondary": (118, 95, 208, 128),
        "btn_ghost": (212, 95, 295, 128),
        "btn_disabled": (298, 95, 385, 128),
    },
    "cards": {
        # Section 07 CARDS (center-top, x:178-830, y:68-195)
        "card_music": (178, 80, 305, 190),
        "card_cat": (310, 80, 430, 190),
        "card_album": (435, 80, 560, 190),
        "card_locked": (565, 80, 690, 190),
        "card_small": (695, 80, 825, 135),
    },
    "panels": {
        # Section 08 PANELS & CONTAINERS (center, y:205-350)
        "panel_main": (178, 215, 350, 345),
        "panel_paper": (355, 215, 520, 345),
        "panel_glass": (525, 215, 688, 345),
        "tooltip": (693, 215, 850, 310),
    },
    "modals": {
        # Section 09 POPUPS & MODALS (center, y:360-490)
        "modal_confirm": (178, 370, 330, 485),
        "modal_reward": (335, 370, 490, 485),
        "modal_info": (495, 370, 655, 485),
        "modal_login": (660, 370, 830, 485),
    },
    "decorative": {
        # Section 15 DECORATIVE ELEMENTS (right side)
        "deco_stars": (858, 188, 1010, 225),
        "deco_lantern": (858, 228, 1010, 285),
        "deco_bunting": (858, 288, 1010, 330),
    },
    "cursor": {
        "cursor_wand": (868, 138, 935, 185),
    },
    "status_badges": {
        "badge_new": (858, 68, 893, 94),
        "badge_hot": (896, 68, 931, 94),
        "badge_vip": (934, 68, 969, 94),
    },
    "particles": {
        # Section 16 PARTICLE & EFFECT ICONS (bottom-right)
        "particle_notes": (858, 500, 950, 570),
        "particle_stars": (955, 500, 1020, 570),
    },
}


def crop_and_process(img_path, crops_dict, img_label):
    """Crop and remove background for all regions in the dict."""
    img = Image.open(img_path)
    results = []
    total = sum(len(v) for v in crops_dict.values())
    count = 0

    for category, regions in crops_dict.items():
        cat_dir = os.path.join(OUTPUT_DIR, category)
        os.makedirs(cat_dir, exist_ok=True)

        for name, bbox in regions.items():
            count += 1
            left, top, right, bottom = bbox
            left = max(0, left)
            top = max(0, top)
            right = min(img.width, right)
            bottom = min(img.height, bottom)

            cropped = img.crop((left, top, right, bottom))

            print(f"  [{count}/{total}] {category}/{name} ({cropped.size[0]}x{cropped.size[1]})")

            # For backgrounds, keep as-is (no bg removal)
            if category == "backgrounds":
                output_path = os.path.join(cat_dir, f"{name}.png")
                cropped.save(output_path, "PNG")
                results.append((output_path, cropped.size))
                continue

            # Remove background
            result = remove(cropped)

            # Auto-trim transparent pixels
            result_bbox = result.getbbox()
            if result_bbox:
                result = result.crop(result_bbox)
            else:
                # If nothing left after bg removal, save the crop as-is
                result = cropped

            output_path = os.path.join(cat_dir, f"{name}.png")
            result.save(output_path, "PNG")
            results.append((output_path, result.size))

    return results


def main():
    print("=" * 60)
    print("喵喵音阶森林 - 修正裁切坐标重新提取")
    print("=" * 60)

    print(f"\n[1/2] 处理设计系统图 (插图 + 图标 + 背景层)...")
    r1 = crop_and_process(IMG1, CROPS_IMG1, "IMG1")

    print(f"\n[2/2] 处理UI组件图...")
    r3 = crop_and_process(IMG3, CROPS_IMG3, "IMG3")

    all_results = r1 + r3
    print(f"\n{'=' * 60}")
    print(f"完成! 本轮导出 {len(all_results)} 个素材")
    print(f"{'=' * 60}")
    for path, size in all_results:
        rel = os.path.relpath(path, OUTPUT_DIR)
        print(f"  {rel} ({size[0]}x{size[1]})")


if __name__ == "__main__":
    main()

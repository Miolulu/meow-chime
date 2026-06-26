"""
喵喵音阶森林 - 素材裁切+去背景脚本
从3张设计规范图中裁切各个元素并去除深色背景
"""

import os
from PIL import Image
from rembg import remove

ASSETS_DIR = r"C:\Users\hortor\.cursor\projects\c-Users-hortor-Projects-meow-chime\assets"
OUTPUT_DIR = r"C:\Users\hortor\Projects\meow-chime\public\assets"

IMG1 = os.path.join(ASSETS_DIR, "c__Users_hortor_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_image-c0e93231-40b4-488d-b3ca-fbd31f4ecb57.png")
IMG2 = os.path.join(ASSETS_DIR, "c__Users_hortor_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_image-4374edb9-c1ce-4055-ab54-27890387eebb.png")
IMG3 = os.path.join(ASSETS_DIR, "c__Users_hortor_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_image-713d0b9a-49be-44b8-bd45-06f74e3b3f77.png")

# Crop regions: (left, top, right, bottom) on 1024x682 images

# Image 1: Design System - Key Illustrations (Section 04, center-bottom area)
CROPS_IMG1 = {
    "illustrations": {
        "magic_bell": (195, 310, 295, 420),
        "moon": (305, 310, 405, 420),
        "firefly": (415, 310, 500, 420),
        "tree_01": (195, 430, 295, 560),
        "tree_02": (305, 430, 405, 560),
        "mushroom_glow": (415, 430, 520, 560),
        "bush": (195, 565, 275, 640),
        "rock": (280, 565, 355, 640),
        "flower": (360, 565, 430, 640),
        "lantern": (435, 565, 520, 640),
    },
    "icons": {
        "icon_play": (30, 580, 75, 625),
        "icon_random": (80, 580, 125, 625),
        "icon_record": (130, 580, 175, 625),
        "icon_share": (180, 580, 225, 625),
        "icon_settings": (230, 580, 275, 625),
        "icon_back": (280, 580, 325, 625),
        "icon_close": (330, 580, 375, 625),
        "icon_mute": (380, 580, 425, 625),
    },
}

# Image 2: Cat Characters - Main poses (large illustrations)
# Layout: Top row has 4 cats, bottom row has 3 cats + color reference
CROPS_IMG2 = {
    "cats_main": {
        "cat_do_idle": (170, 20, 350, 225),       # DO 指挥家猫 (white)
        "cat_re_idle": (365, 20, 545, 225),       # RE 学者猫 (brown)
        "cat_mi_idle": (560, 20, 740, 225),       # MI 黑魔法师猫 (black)
        "cat_fa_idle": (755, 20, 935, 225),       # FA 甜点师猫 (orange)
        "cat_so_idle": (70, 360, 290, 570),       # SO 海盗猫
        "cat_la_idle": (310, 360, 530, 570),      # LA 发明家猫
        "cat_ti_idle": (550, 360, 770, 570),      # TI 占星师猫
    },
    "cats_small": {
        # Small action sprites from the rows below each cat
        # Top row cat small sprites (approx y: 230-340)
        "cat_do_hover": (175, 235, 215, 280),
        "cat_do_click": (220, 235, 260, 280),
        "cat_do_jump": (265, 235, 305, 280),
        "cat_re_hover": (370, 235, 410, 280),
        "cat_re_click": (415, 235, 455, 280),
        "cat_re_jump": (460, 235, 500, 280),
        "cat_mi_hover": (565, 235, 605, 280),
        "cat_mi_click": (610, 235, 650, 280),
        "cat_mi_jump": (655, 235, 695, 280),
        "cat_fa_hover": (760, 235, 800, 280),
        "cat_fa_click": (805, 235, 845, 280),
        "cat_fa_jump": (850, 235, 890, 280),
    },
}

# Image 3: UI Components
CROPS_IMG3 = {
    "navigation": {
        "nav_bar": (175, 18, 860, 60),
    },
    "buttons": {
        "btn_primary": (25, 100, 115, 135),
        "btn_secondary": (120, 100, 210, 135),
        "btn_ghost": (215, 100, 300, 135),
        "btn_disabled": (305, 100, 395, 135),
    },
    "cards": {
        "card_music": (175, 75, 310, 195),
        "card_cat": (315, 75, 440, 195),
        "card_album": (445, 75, 575, 195),
        "card_locked": (580, 75, 700, 195),
        "card_small": (705, 75, 820, 130),
    },
    "panels": {
        "panel_main": (175, 210, 355, 355),
        "panel_paper": (360, 210, 525, 355),
        "panel_glass": (530, 210, 690, 355),
        "tooltip": (695, 210, 845, 310),
    },
    "modals": {
        "modal_confirm": (175, 370, 330, 490),
        "modal_reward": (335, 370, 490, 490),
        "modal_info": (495, 370, 660, 490),
        "modal_login": (665, 370, 830, 490),
    },
    "decorative": {
        "star_string": (855, 185, 1010, 225),
        "lantern_deco": (855, 230, 1010, 310),
    },
    "cursor": {
        "cursor_wand": (870, 135, 930, 185),
    },
    "status_badges": {
        "badge_new": (860, 70, 895, 95),
        "badge_hot": (900, 70, 935, 95),
        "badge_vip": (940, 70, 975, 95),
    },
}


def ensure_dirs():
    """Create output directory structure."""
    subdirs = [
        "illustrations", "icons", "cats_main", "cats_small",
        "navigation", "buttons", "cards", "panels", "modals",
        "decorative", "cursor", "status_badges",
    ]
    for sub in subdirs:
        os.makedirs(os.path.join(OUTPUT_DIR, sub), exist_ok=True)


def crop_and_remove_bg(img_path, crops_dict, progress_prefix=""):
    """Crop regions from image and remove background."""
    img = Image.open(img_path)
    results = []

    for category, regions in crops_dict.items():
        cat_dir = os.path.join(OUTPUT_DIR, category)
        os.makedirs(cat_dir, exist_ok=True)

        for name, bbox in regions.items():
            left, top, right, bottom = bbox
            # Clamp to image bounds
            left = max(0, left)
            top = max(0, top)
            right = min(img.width, right)
            bottom = min(img.height, bottom)

            cropped = img.crop((left, top, right, bottom))

            # Remove background using rembg
            print(f"  {progress_prefix}Processing {category}/{name}...")
            result = remove(cropped)

            # Auto-trim transparent pixels
            result_bbox = result.getbbox()
            if result_bbox:
                result = result.crop(result_bbox)

            output_path = os.path.join(cat_dir, f"{name}.png")
            result.save(output_path, "PNG")
            results.append((output_path, result.size))

    return results


def main():
    print("=" * 60)
    print("喵喵音阶森林 - 素材裁切+去背景")
    print("=" * 60)

    ensure_dirs()

    print(f"\n[1/3] 处理设计系统图 (插图 + 图标)...")
    r1 = crop_and_remove_bg(IMG1, CROPS_IMG1, "[IMG1] ")

    print(f"\n[2/3] 处理猫咪角色图...")
    r2 = crop_and_remove_bg(IMG2, CROPS_IMG2, "[IMG2] ")

    print(f"\n[3/3] 处理UI组件图...")
    r3 = crop_and_remove_bg(IMG3, CROPS_IMG3, "[IMG3] ")

    all_results = r1 + r2 + r3
    print(f"\n{'=' * 60}")
    print(f"完成! 共导出 {len(all_results)} 个素材")
    print(f"输出目录: {OUTPUT_DIR}")
    print(f"{'=' * 60}")

    for path, size in all_results:
        rel = os.path.relpath(path, OUTPUT_DIR)
        print(f"  {rel} ({size[0]}x{size[1]})")


if __name__ == "__main__":
    main()

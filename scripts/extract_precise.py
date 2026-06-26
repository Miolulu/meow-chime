"""
喵喵音阶森林 - 精确坐标最终裁切
基于网格校准的精确坐标
"""

import os
from PIL import Image
from rembg import remove

ASSETS_DIR = r"C:\Users\hortor\.cursor\projects\c-Users-hortor-Projects-meow-chime\assets"
OUTPUT_DIR = r"C:\Users\hortor\Projects\meow-chime\public\assets"

IMG1 = os.path.join(ASSETS_DIR, "c__Users_hortor_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_image-c0e93231-40b4-488d-b3ca-fbd31f4ecb57.png")
IMG2 = os.path.join(ASSETS_DIR, "c__Users_hortor_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_image-4374edb9-c1ce-4055-ab54-27890387eebb.png")
IMG3 = os.path.join(ASSETS_DIR, "c__Users_hortor_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_image-713d0b9a-49be-44b8-bd45-06f74e3b3f77.png")


def save_crop(img, bbox, output_path):
    left, top, right, bottom = bbox
    left, top = max(0, left), max(0, top)
    right, bottom = min(img.width, right), min(img.height, bottom)
    cropped = img.crop((left, top, right, bottom))
    cropped.save(output_path, "PNG")
    return cropped.size


def save_crop_rembg(img, bbox, output_path):
    left, top, right, bottom = bbox
    left, top = max(0, left), max(0, top)
    right, bottom = min(img.width, right), min(img.height, bottom)
    cropped = img.crop((left, top, right, bottom))
    result = remove(cropped)
    result_bbox = result.getbbox()
    if result_bbox:
        result = result.crop(result_bbox)
    else:
        result = cropped
    result.save(output_path, "PNG")
    return result.size


def process_img1():
    """Image 1: Design System - corrected coordinates based on grid calibration."""
    print("\n[Image 1] Design System - 精确坐标")
    img = Image.open(IMG1)

    # KEY ILLUSTRATIONS - confirmed via grid test
    # Each card ~105px wide, ~95px tall. Starts at x:265, y:335
    ill_dir = os.path.join(OUTPUT_DIR, "illustrations")
    os.makedirs(ill_dir, exist_ok=True)

    illustrations = {
        # Row 1 (y: 330-425)
        "magic_bell": (265, 330, 370, 425),
        "moon": (378, 330, 485, 425),
        "firefly": (493, 330, 600, 425),
        # Row 2 (y: 435-530) - trees and mushroom
        "tree_01": (265, 435, 370, 530),
        "tree_02": (378, 435, 485, 530),
        "mushroom_glow": (493, 435, 600, 530),
        # Row 3 (y: 485-575) - smaller items
        "bush": (275, 490, 350, 575),
        "rock": (355, 490, 430, 575),
        "flower": (435, 490, 520, 575),
        "lantern": (525, 490, 615, 575),
    }

    for name, bbox in illustrations.items():
        path = os.path.join(ill_dir, f"{name}.png")
        size = save_crop(img, bbox, path)
        print(f"  illustrations/{name}.png ({size[0]}x{size[1]})")

    # Background layers - Section 03 right side
    # Confirmed: layers are at right side of the image
    # Test by cropping the full right column
    bg_dir = os.path.join(OUTPUT_DIR, "backgrounds")
    os.makedirs(bg_dir, exist_ok=True)

    # Background layers are visible in the right area, let's crop the section 03 area
    bg_layers = {
        "bg_sky_stars": (860, 55, 1010, 105),
        "bg_far_view": (860, 110, 1010, 160),
        "bg_far_mountains": (860, 165, 1010, 215),
        "bg_mid_forest": (860, 220, 1010, 270),
        "bg_front_particles": (860, 275, 1010, 325),
        "bg_front_grass": (860, 330, 1010, 380),
    }

    for name, bbox in bg_layers.items():
        path = os.path.join(bg_dir, f"{name}.png")
        size = save_crop(img, bbox, path)
        print(f"  backgrounds/{name}.png ({size[0]}x{size[1]})")

    # Icon style (Section 7) - at bottom of sidebar
    icon_dir = os.path.join(OUTPUT_DIR, "icons")
    os.makedirs(icon_dir, exist_ok=True)

    # Icons visible at bottom of sidebar area (x:15-175, y:530-570)
    icons = {
        "icon_play": (18, 530, 50, 562),
        "icon_random": (52, 530, 84, 562),
        "icon_record": (86, 530, 118, 562),
        "icon_share": (120, 530, 152, 562),
        "icon_settings": (18, 565, 50, 597),
        "icon_back": (52, 565, 84, 597),
        "icon_close": (86, 565, 118, 597),
        "icon_mute": (120, 565, 152, 597),
    }

    for name, bbox in icons.items():
        path = os.path.join(icon_dir, f"{name}.png")
        size = save_crop_rembg(img, bbox, path)
        print(f"  icons/{name}.png ({size[0]}x{size[1]})")


def process_img2():
    """Image 2: Cat Characters."""
    print("\n[Image 2] Cat Characters")
    img = Image.open(IMG2)

    cats_dir = os.path.join(OUTPUT_DIR, "cats_main")
    os.makedirs(cats_dir, exist_ok=True)

    cats = {
        "cat_do_idle": (170, 30, 370, 240),
        "cat_re_idle": (377, 30, 570, 240),
        "cat_mi_idle": (577, 30, 775, 240),
        "cat_fa_idle": (782, 30, 975, 240),
        "cat_so_idle": (55, 370, 290, 580),
        "cat_la_idle": (300, 370, 535, 580),
        "cat_ti_idle": (545, 370, 775, 580),
    }

    for name, bbox in cats.items():
        path = os.path.join(cats_dir, f"{name}.png")
        size = save_crop_rembg(img, bbox, path)
        print(f"  cats_main/{name}.png ({size[0]}x{size[1]})")

    # Sprite rows for each cat
    sprites_dir = os.path.join(OUTPUT_DIR, "cats_sprites")
    os.makedirs(sprites_dir, exist_ok=True)

    sprites = {
        "cat_do_sprites": (175, 245, 365, 340),
        "cat_re_sprites": (377, 245, 565, 340),
        "cat_mi_sprites": (577, 245, 770, 340),
        "cat_fa_sprites": (782, 245, 970, 340),
        "cat_so_sprites": (55, 585, 285, 670),
        "cat_la_sprites": (300, 585, 530, 670),
        "cat_ti_sprites": (545, 585, 770, 670),
    }

    for name, bbox in sprites.items():
        path = os.path.join(sprites_dir, f"{name}.png")
        size = save_crop(img, bbox, path)
        print(f"  cats_sprites/{name}.png ({size[0]}x{size[1]})")


def process_img3():
    """Image 3: UI Components - calibrated with 50px grid."""
    print("\n[Image 3] UI Components")
    img = Image.open(IMG3)

    # 06. NAVIGATION BAR (x:225-795, y:15-55)
    nav_dir = os.path.join(OUTPUT_DIR, "navigation")
    os.makedirs(nav_dir, exist_ok=True)
    size = save_crop(img, (225, 15, 795, 58), os.path.join(nav_dir, "nav_bar.png"))
    print(f"  navigation/nav_bar.png ({size[0]}x{size[1]})")

    # 02. BUTTONS (left side, x:10-200, y:195-230)
    btn_dir = os.path.join(OUTPUT_DIR, "buttons")
    os.makedirs(btn_dir, exist_ok=True)
    buttons = {
        "btn_primary": (13, 200, 73, 230),
        "btn_secondary": (78, 200, 138, 230),
        "btn_ghost": (143, 200, 203, 230),
        "btn_disabled": (208, 200, 268, 230),
    }
    for name, bbox in buttons.items():
        path = os.path.join(btn_dir, f"{name}.png")
        size = save_crop(img, bbox, path)
        print(f"  buttons/{name}.png ({size[0]}x{size[1]})")

    # 07. CARDS (center, x:235-790, y:95-195)
    card_dir = os.path.join(OUTPUT_DIR, "cards")
    os.makedirs(card_dir, exist_ok=True)
    cards = {
        "card_music": (237, 100, 340, 200),
        "card_cat": (345, 100, 450, 200),
        "card_album": (455, 100, 560, 200),
        "card_locked": (565, 100, 660, 200),
        "card_small": (665, 100, 790, 155),
    }
    for name, bbox in cards.items():
        path = os.path.join(card_dir, f"{name}.png")
        size = save_crop(img, bbox, path)
        print(f"  cards/{name}.png ({size[0]}x{size[1]})")

    # 08. PANELS & CONTAINERS (center, y:265-390)
    panel_dir = os.path.join(OUTPUT_DIR, "panels")
    os.makedirs(panel_dir, exist_ok=True)
    panels = {
        "panel_main": (237, 278, 400, 395),
        "panel_paper": (405, 278, 538, 395),
        "panel_glass": (543, 278, 670, 395),
        "tooltip": (675, 278, 790, 360),
    }
    for name, bbox in panels.items():
        path = os.path.join(panel_dir, f"{name}.png")
        size = save_crop(img, bbox, path)
        print(f"  panels/{name}.png ({size[0]}x{size[1]})")

    # 09. POPUPS & MODALS (center, y:405-535)
    modal_dir = os.path.join(OUTPUT_DIR, "modals")
    os.makedirs(modal_dir, exist_ok=True)
    modals = {
        "modal_confirm": (237, 418, 375, 535),
        "modal_reward": (380, 418, 505, 535),
        "modal_info": (510, 418, 650, 535),
        "modal_login": (655, 418, 790, 535),
    }
    for name, bbox in modals.items():
        path = os.path.join(modal_dir, f"{name}.png")
        size = save_crop(img, bbox, path)
        print(f"  modals/{name}.png ({size[0]}x{size[1]})")

    # 13. STATUS & BADGES (right, x:855-1015, y:100-125)
    badge_dir = os.path.join(OUTPUT_DIR, "badges")
    os.makedirs(badge_dir, exist_ok=True)
    badges = {
        "badge_new": (857, 100, 895, 125),
        "badge_hot": (900, 100, 938, 125),
        "badge_vip": (943, 100, 981, 125),
        "badge_limited": (986, 100, 1020, 125),
    }
    for name, bbox in badges.items():
        path = os.path.join(badge_dir, f"{name}.png")
        size = save_crop(img, bbox, path)
        print(f"  badges/{name}.png ({size[0]}x{size[1]})")

    # 14. CURSOR (right side, x:855-935, y:200-250)
    cursor_dir = os.path.join(OUTPUT_DIR, "cursor")
    os.makedirs(cursor_dir, exist_ok=True)
    size = save_crop_rembg(img, (855, 205, 935, 250), os.path.join(cursor_dir, "cursor_wand.png"))
    print(f"  cursor/cursor_wand.png ({size[0]}x{size[1]})")

    # 15. DECORATIVE ELEMENTS (right side, x:855-1015, y:255-400)
    deco_dir = os.path.join(OUTPUT_DIR, "decorative")
    os.makedirs(deco_dir, exist_ok=True)
    decorative = {
        "deco_row1": (855, 255, 1015, 305),
        "deco_row2": (855, 310, 1015, 360),
        "deco_row3": (855, 365, 1015, 410),
    }
    for name, bbox in decorative.items():
        path = os.path.join(deco_dir, f"{name}.png")
        size = save_crop(img, bbox, path)
        print(f"  decorative/{name}.png ({size[0]}x{size[1]})")

    # 16. PARTICLE & EFFECT ICONS (bottom right, x:855-1015, y:545-680)
    particle_dir = os.path.join(OUTPUT_DIR, "particles")
    os.makedirs(particle_dir, exist_ok=True)
    particles = {
        "particles_all": (855, 555, 1015, 675),
    }
    for name, bbox in particles.items():
        path = os.path.join(particle_dir, f"{name}.png")
        size = save_crop(img, bbox, path)
        print(f"  particles/{name}.png ({size[0]}x{size[1]})")

    # 10. SCROLL & TRACK (bottom left-center, x:237-380, y:555-640)
    scroll_dir = os.path.join(OUTPUT_DIR, "scroll")
    os.makedirs(scroll_dir, exist_ok=True)
    size = save_crop(img, (237, 560, 380, 645), os.path.join(scroll_dir, "scroll_track.png"))
    print(f"  scroll/scroll_track.png ({size[0]}x{size[1]})")


def main():
    print("=" * 60)
    print("喵喵音阶森林 - 精确坐标最终裁切")
    print("=" * 60)

    process_img1()
    process_img2()
    process_img3()

    total = 0
    for root, _, files in os.walk(OUTPUT_DIR):
        for f in files:
            if f.endswith('.png') and '_debug' not in root and '_test' not in f:
                total += 1

    print(f"\n{'=' * 60}")
    print(f"全部完成! 共 {total} 个素材文件")
    print(f"输出目录: {OUTPUT_DIR}")
    print(f"{'=' * 60}")


if __name__ == "__main__":
    main()

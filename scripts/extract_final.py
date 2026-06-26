"""
喵喵音阶森林 - 最终版裁切脚本
策略:
- 猫咪角色 -> rembg 去背景
- 场景插图/UI -> 保留原样(带容器圆角背景)
- 背景层 -> 直接裁切
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
    """Crop and save without background removal."""
    left, top, right, bottom = bbox
    left = max(0, left)
    top = max(0, top)
    right = min(img.width, right)
    bottom = min(img.height, bottom)
    cropped = img.crop((left, top, right, bottom))
    cropped.save(output_path, "PNG")
    return cropped.size


def save_crop_rembg(img, bbox, output_path):
    """Crop, remove background, trim, and save."""
    left, top, right, bottom = bbox
    left = max(0, left)
    top = max(0, top)
    right = min(img.width, right)
    bottom = min(img.height, bottom)
    cropped = img.crop((left, top, right, bottom))
    result = remove(cropped)
    result_bbox = result.getbbox()
    if result_bbox:
        result = result.crop(result_bbox)
    else:
        result = cropped
    result.save(output_path, "PNG")
    return result.size


def process_image1():
    """Design System - illustrations kept with containers, icons with rembg."""
    print("\n[Image 1] Design System")
    img = Image.open(IMG1)

    # KEY ILLUSTRATIONS (Section 04) - keep with dark rounded containers
    # They look good as self-contained cards
    ill_dir = os.path.join(OUTPUT_DIR, "illustrations")
    os.makedirs(ill_dir, exist_ok=True)

    illustrations = {
        # Row 1: y 348-435
        "magic_bell": (210, 348, 323, 435),
        "moon": (328, 348, 438, 435),
        "firefly": (443, 348, 538, 435),
        # Row 2: y 442-530
        "tree_01": (210, 442, 323, 530),
        "tree_02": (328, 442, 438, 530),
        "mushroom_glow": (443, 442, 542, 530),
        # Row 3: y 537-612
        "bush": (210, 537, 287, 612),
        "rock": (292, 537, 367, 612),
        "flower": (372, 537, 447, 612),
        "lantern": (452, 537, 540, 612),
    }

    for name, bbox in illustrations.items():
        path = os.path.join(ill_dir, f"{name}.png")
        size = save_crop(img, bbox, path)
        print(f"  illustrations/{name}.png ({size[0]}x{size[1]})")

    # ICON STYLE (Section 7, bottom-left sidebar)
    # Small colored icons in a row around y:563-590
    icon_dir = os.path.join(OUTPUT_DIR, "icons")
    os.makedirs(icon_dir, exist_ok=True)

    # Icons are at bottom of left sidebar, in a single row
    # Looking at image: they appear at about y:558-588, x:15-175
    # 8 icons across ~160px = 20px each
    icon_names = ["play", "random", "record", "share", "settings", "back", "close", "mute"]
    icon_start_x = 15
    icon_y_top = 558
    icon_y_bottom = 590
    icon_width = 20

    for i, name in enumerate(icon_names):
        x = icon_start_x + i * icon_width
        bbox = (x, icon_y_top, x + icon_width, icon_y_bottom)
        path = os.path.join(icon_dir, f"icon_{name}.png")
        size = save_crop_rembg(img, bbox, path)
        print(f"  icons/icon_{name}.png ({size[0]}x{size[1]})")

    # BACKGROUND LAYERS (Section 03, right side)
    # The parallax layer previews are on the right, stacked vertically
    # Section 03 title is at about y:15, x:550
    # Layer strips below it with labels
    bg_dir = os.path.join(OUTPUT_DIR, "backgrounds")
    os.makedirs(bg_dir, exist_ok=True)

    # Right side section 03: approximately x:690-860 for the preview images
    # (labels are to the right of previews)
    # The strips start below the title, about 6 strips total
    bg_layers = {
        "bg_sky_stars": (690, 40, 860, 95),       # 星空层
        "bg_far_scene": (690, 100, 860, 155),     # 远景
        "bg_far_mountains": (690, 160, 860, 215), # 远景山林
        "bg_mid_forest": (690, 220, 860, 275),    # 中景森林
        "bg_front_particles": (690, 280, 860, 335), # 前景粒子
        "bg_front_grass": (690, 340, 860, 395),   # 前景草地
    }

    for name, bbox in bg_layers.items():
        path = os.path.join(bg_dir, f"{name}.png")
        size = save_crop(img, bbox, path)
        print(f"  backgrounds/{name}.png ({size[0]}x{size[1]})")


def process_image2():
    """Cat Characters - use rembg for main characters."""
    print("\n[Image 2] Cat Characters")
    img = Image.open(IMG2)

    cats_dir = os.path.join(OUTPUT_DIR, "cats_main")
    os.makedirs(cats_dir, exist_ok=True)

    # Main cat illustrations - generous crops, rembg will isolate
    cats = {
        "cat_do_idle": (170, 30, 370, 240),    # DO 指挥家猫
        "cat_re_idle": (377, 30, 570, 240),    # RE 学者猫
        "cat_mi_idle": (577, 30, 775, 240),    # MI 黑魔法师猫
        "cat_fa_idle": (782, 30, 975, 240),    # FA 甜点师猫
        "cat_so_idle": (55, 370, 290, 580),    # SO 海盗猫
        "cat_la_idle": (300, 370, 535, 580),   # LA 发明家猫
        "cat_ti_idle": (545, 370, 775, 580),   # TI 占星师猫
    }

    for name, bbox in cats.items():
        path = os.path.join(cats_dir, f"{name}.png")
        size = save_crop_rembg(img, bbox, path)
        print(f"  cats_main/{name}.png ({size[0]}x{size[1]})")

    # Small cat sprites (action poses)
    sprites_dir = os.path.join(OUTPUT_DIR, "cats_sprites")
    os.makedirs(sprites_dir, exist_ok=True)

    # Each cat has a row of small sprites below the main illustration
    # Top row cats: small sprites at approximately y:250-340
    # Each sprite is about 40-45px wide
    sprite_rows = {
        # DO sprites (x: 175-345, y: 250-340)
        "cat_do": (175, 250, 345, 340),
        # RE sprites (x: 380-550, y: 250-340)
        "cat_re": (380, 250, 550, 340),
        # MI sprites (x: 580-750, y: 250-340)
        "cat_mi": (580, 250, 750, 340),
        # FA sprites (x: 785-955, y: 250-340)
        "cat_fa": (785, 250, 955, 340),
        # SO sprites (x: 60-280, y: 585-665)
        "cat_so": (60, 585, 280, 665),
        # LA sprites (x: 305-525, y: 585-665)
        "cat_la": (305, 585, 525, 665),
        # TI sprites (x: 550-770, y: 585-665)
        "cat_ti": (550, 585, 770, 665),
    }

    for name, bbox in sprite_rows.items():
        path = os.path.join(sprites_dir, f"{name}_sprites.png")
        size = save_crop(img, bbox, path)
        print(f"  cats_sprites/{name}_sprites.png ({size[0]}x{size[1]})")


def process_image3():
    """UI Components - keep with their backgrounds (designed elements)."""
    print("\n[Image 3] UI Components")
    img = Image.open(IMG3)

    # NAVIGATION BAR (top area)
    nav_dir = os.path.join(OUTPUT_DIR, "navigation")
    os.makedirs(nav_dir, exist_ok=True)
    size = save_crop(img, (178, 18, 858, 60), os.path.join(nav_dir, "nav_bar.png"))
    print(f"  navigation/nav_bar.png ({size[0]}x{size[1]})")

    # BUTTONS (Section 02, left side)
    btn_dir = os.path.join(OUTPUT_DIR, "buttons")
    os.makedirs(btn_dir, exist_ok=True)

    buttons = {
        "btn_primary": (28, 92, 117, 125),
        "btn_secondary": (120, 92, 210, 125),
        "btn_ghost": (213, 92, 298, 125),
        "btn_disabled": (301, 92, 390, 125),
    }
    for name, bbox in buttons.items():
        path = os.path.join(btn_dir, f"{name}.png")
        size = save_crop(img, bbox, path)
        print(f"  buttons/{name}.png ({size[0]}x{size[1]})")

    # ICON BUTTONS (below main buttons)
    icons_btn = {
        "btn_icon_play": (28, 133, 57, 162),
        "btn_icon_record": (60, 133, 89, 162),
        "btn_icon_share": (92, 133, 121, 162),
        "btn_icon_settings": (124, 133, 153, 162),
    }
    for name, bbox in icons_btn.items():
        path = os.path.join(btn_dir, f"{name}.png")
        size = save_crop(img, bbox, path)
        print(f"  buttons/{name}.png ({size[0]}x{size[1]})")

    # CARDS (Section 07, center-top)
    card_dir = os.path.join(OUTPUT_DIR, "cards")
    os.makedirs(card_dir, exist_ok=True)

    cards = {
        "card_music": (178, 80, 303, 190),
        "card_cat": (308, 80, 430, 190),
        "card_album": (435, 80, 558, 190),
        "card_locked": (563, 80, 688, 190),
        "card_small": (693, 80, 825, 130),
    }
    for name, bbox in cards.items():
        path = os.path.join(card_dir, f"{name}.png")
        size = save_crop(img, bbox, path)
        print(f"  cards/{name}.png ({size[0]}x{size[1]})")

    # PANELS (Section 08)
    panel_dir = os.path.join(OUTPUT_DIR, "panels")
    os.makedirs(panel_dir, exist_ok=True)

    panels = {
        "panel_main": (178, 210, 350, 348),
        "panel_paper": (355, 210, 523, 348),
        "panel_glass": (528, 210, 690, 348),
        "tooltip": (695, 210, 850, 308),
    }
    for name, bbox in panels.items():
        path = os.path.join(panel_dir, f"{name}.png")
        size = save_crop(img, bbox, path)
        print(f"  panels/{name}.png ({size[0]}x{size[1]})")

    # MODALS (Section 09)
    modal_dir = os.path.join(OUTPUT_DIR, "modals")
    os.makedirs(modal_dir, exist_ok=True)

    modals = {
        "modal_confirm": (178, 370, 330, 488),
        "modal_reward": (335, 370, 490, 488),
        "modal_info": (495, 370, 660, 488),
        "modal_login": (665, 370, 830, 488),
    }
    for name, bbox in modals.items():
        path = os.path.join(modal_dir, f"{name}.png")
        size = save_crop(img, bbox, path)
        print(f"  modals/{name}.png ({size[0]}x{size[1]})")

    # STATUS & BADGES (Section 13, top-right)
    badge_dir = os.path.join(OUTPUT_DIR, "badges")
    os.makedirs(badge_dir, exist_ok=True)

    badges = {
        "badge_new": (858, 68, 895, 92),
        "badge_hot": (898, 68, 935, 92),
        "badge_vip": (938, 68, 975, 92),
        "badge_limited": (978, 68, 1015, 92),
    }
    for name, bbox in badges.items():
        path = os.path.join(badge_dir, f"{name}.png")
        size = save_crop(img, bbox, path)
        print(f"  badges/{name}.png ({size[0]}x{size[1]})")

    # DECORATIVE ELEMENTS (Section 15, right side)
    deco_dir = os.path.join(OUTPUT_DIR, "decorative")
    os.makedirs(deco_dir, exist_ok=True)

    decorative = {
        "star_string_lights": (855, 185, 1015, 228),
        "lantern_string": (855, 232, 1015, 285),
        "bunting_flags": (855, 290, 1015, 328),
    }
    for name, bbox in decorative.items():
        path = os.path.join(deco_dir, f"{name}.png")
        size = save_crop(img, bbox, path)
        print(f"  decorative/{name}.png ({size[0]}x{size[1]})")

    # CURSOR (Section 14)
    cursor_dir = os.path.join(OUTPUT_DIR, "cursor")
    os.makedirs(cursor_dir, exist_ok=True)
    size = save_crop_rembg(img, (870, 138, 935, 185), os.path.join(cursor_dir, "cursor_wand.png"))
    print(f"  cursor/cursor_wand.png ({size[0]}x{size[1]})")

    # PARTICLES & EFFECTS (Section 16, bottom-right)
    particle_dir = os.path.join(OUTPUT_DIR, "particles")
    os.makedirs(particle_dir, exist_ok=True)

    particles = {
        "particle_notes": (855, 500, 960, 580),
        "particle_stars": (965, 500, 1020, 580),
        "particle_sparkles": (855, 585, 960, 665),
    }
    for name, bbox in particles.items():
        path = os.path.join(particle_dir, f"{name}.png")
        size = save_crop_rembg(img, bbox, path)
        print(f"  particles/{name}.png ({size[0]}x{size[1]})")

    # SCROLL & TRACK (Section 10)
    scroll_dir = os.path.join(OUTPUT_DIR, "scroll")
    os.makedirs(scroll_dir, exist_ok=True)
    size = save_crop(img, (178, 495, 350, 575), os.path.join(scroll_dir, "scroll_track.png"))
    print(f"  scroll/scroll_track.png ({size[0]}x{size[1]})")


def main():
    print("=" * 60)
    print("喵喵音阶森林 - 最终版素材裁切")
    print("=" * 60)

    process_image1()
    process_image2()
    process_image3()

    # Count all output files
    total = 0
    for root, dirs, files in os.walk(OUTPUT_DIR):
        for f in files:
            if f.endswith('.png') and '_debug' not in root:
                total += 1

    print(f"\n{'=' * 60}")
    print(f"全部完成! 共 {total} 个素材文件")
    print(f"输出目录: {OUTPUT_DIR}")
    print(f"{'=' * 60}")


if __name__ == "__main__":
    main()

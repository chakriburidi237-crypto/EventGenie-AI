import sys
from PIL import Image, ImageDraw, ImageFont

# 1080 x 1920 Instagram Reel Overlay
width, height = 1080, 1920
img = Image.new("RGBA", (width, height), (0, 0, 0, 0))
draw = ImageDraw.Draw(img)

# Fonts
font_path_bold = "C:/Windows/Fonts/segoeuib.ttf"
font_path_regular = "C:/Windows/Fonts/segoeui.ttf"
font_path_semi = "C:/Windows/Fonts/seguisb.ttf"

try:
    font_badge = ImageFont.truetype(font_path_bold, 28)
    font_title = ImageFont.truetype(font_path_bold, 74)
    font_sub = ImageFont.truetype(font_path_semi, 32)
    font_tag = ImageFont.truetype(font_path_regular, 28)
    font_h2 = ImageFont.truetype(font_path_bold, 34)
    font_feat = ImageFont.truetype(font_path_semi, 30)
    font_link = ImageFont.truetype(font_path_bold, 32)
    font_sublink = ImageFont.truetype(font_path_regular, 26)
except Exception:
    font_badge = ImageFont.load_default()
    font_title = font_badge
    font_sub = font_badge
    font_tag = font_badge
    font_h2 = font_badge
    font_feat = font_badge
    font_link = font_badge
    font_sublink = font_badge

# Top Dark Vignette Card
draw.rounded_rectangle([40, 100, 1040, 560], radius=32, fill=(15, 23, 42, 230), outline=(56, 189, 248, 180), width=3)

# Badge
badge_text = "HACK2SKILL VIRTUAL PROMPTWARS"
draw.rounded_rectangle([200, 130, 880, 185], radius=16, fill=(30, 41, 59, 255), outline=(56, 189, 248, 255), width=2)
draw.text((540, 157), badge_text, font=font_badge, fill=(56, 189, 248, 255), anchor="mm")

# Challenge 5
ch_text = "Challenge 5: Celebration & Event Planner"
draw.text((540, 225), ch_text, font=font_sub, fill=(148, 163, 184, 255), anchor="mm")

# Title: EventGenie AI
draw.text((540, 310), "EventGenie AI", font=font_title, fill=(255, 255, 255, 255), anchor="mm")

# Slogan
draw.text((540, 395), "Plan Smarter. Celebrate Better.", font=font_sub, fill=(165, 180, 252, 255), anchor="mm")

# Gemini badge
draw.rounded_rectangle([250, 445, 830, 505], radius=20, fill=(67, 56, 202, 200), outline=(129, 140, 248, 255), width=2)
draw.text((540, 475), "Powered by Google Gemini 2.5 Flash", font=font_tag, fill=(255, 255, 255, 255), anchor="mm")

# Center Video Frame Border (Frame is at x=40, y=600, w=1000, h=562.5)
# Adding a glowing border around where the video will sit
draw.rounded_rectangle([36, 596, 1044, 1166], radius=24, outline=(99, 102, 241, 220), width=4)

# Bottom Dark Vignette Card (Features & Links)
draw.rounded_rectangle([40, 1200, 1040, 1840], radius=32, fill=(15, 23, 42, 230), outline=(99, 102, 241, 180), width=3)

# Header
draw.text((540, 1250), "CORE CAPABILITIES", font=font_h2, fill=(56, 189, 248, 255), anchor="mm")

features = [
    ("AI Blueprint Hub", "Tailored themes, menus & schedules"),
    ("Smart Budget Planner", "Interactive SVG donut & AI optimizer"),
    ("RSVP & Dietary Manager", "Real-time guest tracking & CSV export"),
    ("Milestone Timeline", "Task prioritization & countdown tracking"),
    ("100% Offline Resilience", "Zero downtime deterministic fallback")
]

y_pos = 1305
for title, desc in features:
    # Bullet icon
    draw.ellipse([80, y_pos + 4, 100, y_pos + 24], fill=(99, 102, 241, 255))
    draw.text((120, y_pos), title, font=font_feat, fill=(255, 255, 255, 255))
    draw.text((120, y_pos + 36), desc, font=font_tag, fill=(148, 163, 184, 255))
    y_pos += 72

# Divider
draw.line([80, y_pos + 10, 1000, y_pos + 10], fill=(51, 65, 85, 255), width=2)

# Call to Action
draw.text((540, y_pos + 45), "Live Demo: event-genie-ai-five.vercel.app", font=font_link, fill=(52, 211, 153, 255), anchor="mm")
draw.text((540, y_pos + 85), "GitHub: chakriburidi237-crypto/EventGenie-AI", font=font_sublink, fill=(203, 213, 225, 255), anchor="mm")

output_path = "c:/Users/SURYA CHAKRADHAR/OneDrive/Desktop/projects/projects/EventGenie AI/eventgenie-ai/reel_overlay.png"
img.save(output_path, "PNG")
print("Saved overlay to", output_path)

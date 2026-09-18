from reportlab.graphics.shapes import Drawing, Rect, Circle, Line, Polygon, String, Ellipse
from reportlab.lib import colors as C

W, H = 460, 200
SKIN = [C.HexColor(x) for x in ("#E8B892", "#C68863", "#8D5A3B", "#F1C9A5")]
CLOTH = [C.HexColor(x) for x in ("#3B6EA5", "#C0392B", "#27AE60", "#8E44AD", "#E67E22", "#16A085", "#2C3E50")]

def person(d, x, y, s=1.0, skin=0, cloth=0, hair="#3a2a1a", arms="down", label=None, coat=False):
    sk = SKIN[skin % 4]; cl = C.white if coat else CLOTH[cloth % 7]
    # legs
    d.add(Line(x-5*s, y+30*s, x-8*s, y, strokeColor=C.HexColor("#333"), strokeWidth=3*s))
    d.add(Line(x+5*s, y+30*s, x+8*s, y, strokeColor=C.HexColor("#333"), strokeWidth=3*s))
    # body
    d.add(Polygon([x-11*s, y+30*s, x+11*s, y+30*s, x+9*s, y+62*s, x-9*s, y+62*s],
                  fillColor=cl, strokeColor=C.HexColor("#555") if coat else cl, strokeWidth=0.8))
    # arms
    if arms == "up":
        d.add(Line(x-9*s, y+58*s, x-20*s, y+76*s, strokeColor=sk, strokeWidth=3*s))
        d.add(Line(x+9*s, y+58*s, x+20*s, y+76*s, strokeColor=sk, strokeWidth=3*s))
    elif arms == "front":
        d.add(Line(x-9*s, y+56*s, x-22*s, y+46*s, strokeColor=sk, strokeWidth=3*s))
        d.add(Line(x+9*s, y+56*s, x+22*s, y+46*s, strokeColor=sk, strokeWidth=3*s))
    else:
        d.add(Line(x-10*s, y+58*s, x-15*s, y+34*s, strokeColor=sk, strokeWidth=3*s))
        d.add(Line(x+10*s, y+58*s, x+15*s, y+34*s, strokeColor=sk, strokeWidth=3*s))
    # head
    d.add(Circle(x, y+72*s, 9*s, fillColor=sk, strokeColor=None))
    d.add(Polygon([x-9.5*s, y+73*s, x-8*s, y+81*s, x, y+83*s, x+8*s, y+81*s, x+9.5*s, y+73*s, x, y+78*s],
                  fillColor=C.HexColor(hair), strokeColor=None))
    d.add(Circle(x-3*s, y+71*s, 1*s, fillColor=C.black, strokeColor=None))
    d.add(Circle(x+3*s, y+71*s, 1*s, fillColor=C.black, strokeColor=None))
    d.add(Line(x-2.5*s, y+67*s, x+2.5*s, y+67*s, strokeColor=C.HexColor("#6b2b2b"), strokeWidth=0.8))
    if label:
        d.add(String(x, y-10, label, fontName="DV", fontSize=7, textAnchor="middle", fillColor=C.HexColor("#333")))

def base(sky="#EAF2FB", ground="#D9CBB4", gy=30):
    d = Drawing(W, H)
    d.add(Rect(0, 0, W, H, fillColor=C.HexColor(sky), strokeColor=C.HexColor("#999"), strokeWidth=1))
    d.add(Rect(0, 0, W, gy, fillColor=C.HexColor(ground), strokeColor=None))
    return d

def label(d, x, y, t, size=8, col="#222"):
    d.add(String(x, y, t, fontName="DVB", fontSize=size, textAnchor="middle", fillColor=C.HexColor(col)))

def tree(d, x, y, s=1):
    d.add(Rect(x-4*s, y, 8*s, 35*s, fillColor=C.HexColor("#7b5230"), strokeColor=None))
    d.add(Circle(x, y+50*s, 22*s, fillColor=C.HexColor("#3f9b4f"), strokeColor=None))

def box(d, x, y, w, h, t=None):
    d.add(Rect(x, y, w, h, fillColor=C.HexColor("#C89B63"), strokeColor=C.HexColor("#8a6436")))
    d.add(Line(x, y+h*0.6, x+w, y+h*0.6, strokeColor=C.HexColor("#8a6436")))
    if t: label(d, x+w/2, y+h/3, t, 6)

def window(d, x, y, w=50, h=45):
    d.add(Rect(x, y, w, h, fillColor=C.HexColor("#BFE0F5"), strokeColor=C.HexColor("#6d6d6d"), strokeWidth=2))
    d.add(Line(x+w/2, y, x+w/2, y+h, strokeColor=C.HexColor("#6d6d6d"), strokeWidth=2))

def family():
    d = base("#FBF3E6", "#B98B5E")
    window(d, 30, 110); window(d, 380, 110)
    d.add(Rect(120, 60, 220, 10, fillColor=C.HexColor("#8B5A2B"), strokeColor=None))
    d.add(Rect(130, 30, 8, 30, fillColor=C.HexColor("#8B5A2B"))); d.add(Rect(322, 30, 8, 30, fillColor=C.HexColor("#8B5A2B")))
    for i, x in enumerate([150, 200, 260, 310]):
        person(d, x, 45, 0.9 if i < 2 else 0.7 if i == 3 else 0.9, skin=i, cloth=i, hair="#222" if i%2 else "#5a3a1a", arms="front")
    d.add(Ellipse(230, 74, 18, 5, fillColor=C.white, strokeColor=C.grey))
    d.add(Circle(180, 74, 4, fillColor=C.HexColor("#e74c3c")))
    label(d, 230, 180, "Familie beim Abendessen")
    return d

def kitchen():
    d = base("#FFF8EE", "#C7B299")
    d.add(Rect(30, 30, 70, 130, fillColor=C.HexColor("#DDE3E8"), strokeColor=C.grey)); label(d, 65, 100, "Kühlschrank", 6)
    d.add(Rect(140, 30, 120, 60, fillColor=C.HexColor("#ECECEC"), strokeColor=C.grey))
    d.add(Rect(170, 90, 40, 25, fillColor=C.HexColor("#555"), strokeColor=None)); label(d, 190, 120, "Topf", 6)
    for i in range(3): d.add(Circle(290+i*20, 135, 7, fillColor=[C.red, C.orange, C.green][i]))
    person(d, 330, 30, 1.2, skin=1, cloth=4, arms="front")
    person(d, 110, 30, 0.9, skin=0, cloth=2)
    label(d, 230, 180, "In der Küche: Wir kochen")
    return d

def shop():
    d = base("#F4F9F1", "#BDBDBD")
    for r in range(3):
        d.add(Rect(20, 50+r*40, 170, 5, fillColor=C.HexColor("#777")))
        for i in range(8):
            d.add(Rect(26+i*20, 55+r*40, 12, 18, fillColor=CLOTH[(i+r)%7], strokeColor=None))
    d.add(Rect(300, 30, 130, 45, fillColor=C.HexColor("#6c7a89"))); label(d, 365, 50, "Kasse", 8, "#FFFFFF")
    person(d, 380, 75, 0.8, skin=3, cloth=1)
    person(d, 240, 30, 1.1, skin=2, cloth=0)
    d.add(Rect(255, 40, 30, 22, fillColor=None, strokeColor=C.HexColor("#444"), strokeWidth=1.5))
    d.add(Circle(260, 35, 4, fillColor=C.black)); d.add(Circle(282, 35, 4, fillColor=C.black))
    label(d, 110, 180, "Im Supermarkt"); label(d, 365, 165, "Angebot: 1,99 €", 9, "#c0392b")
    return d

def doctor():
    d = base("#EEF6F8", "#CFD8DC")
    d.add(Rect(380, 120, 50, 50, fillColor=C.white, strokeColor=C.grey))
    d.add(Rect(400, 128, 10, 34, fillColor=C.red, strokeColor=None)); d.add(Rect(388, 140, 34, 10, fillColor=C.red, strokeColor=None))
    d.add(Rect(160, 60, 140, 10, fillColor=C.HexColor("#8d6e63"))); d.add(Rect(170, 30, 8, 30, fillColor=C.HexColor("#8d6e63"))); d.add(Rect(282, 30, 8, 30, fillColor=C.HexColor("#8d6e63")))
    person(d, 320, 30, 1.2, skin=0, cloth=6, coat=True, arms="front", label="Ärztin")
    person(d, 120, 30, 1.1, skin=1, cloth=3, label="Patient")
    d.add(Circle(120, 116, 3, fillColor=C.HexColor("#3498db")))
    d.add(Rect(200, 72, 40, 25, fillColor=C.HexColor("#34495e"))); 
    label(d, 200, 180, "In der Arztpraxis")
    return d

def station():
    d = base("#EAF2FB", "#9E9E9E", 25)
    d.add(Rect(40, 35, 300, 75, fillColor=C.HexColor("#c0392b"), strokeColor=None))
    for i in range(6): d.add(Rect(55+i*47, 70, 30, 25, fillColor=C.HexColor("#BFE0F5")))
    label(d, 190, 45, "ICE  Berlin → München", 9, "#FFFFFF")
    d.add(Rect(380, 110, 4, 60, fillColor=C.grey)); d.add(Circle(382, 170, 14, fillColor=C.white, strokeColor=C.black))
    d.add(Line(382, 170, 382, 180, strokeColor=C.black)); d.add(Line(382, 170, 390, 170, strokeColor=C.black))
    d.add(Rect(350, 140, 70, 14, fillColor=C.HexColor("#1e3d7b"))); label(d, 385, 144, "Gleis 7", 8, "#FFFFFF")
    person(d, 370, 25, 1.0, skin=2, cloth=0)
    d.add(Rect(386, 25, 16, 24, fillColor=C.HexColor("#2c3e50")))
    person(d, 420, 25, 0.9, skin=0, cloth=1)
    label(d, 120, 180, "Am Bahnhof")
    return d

def office():
    d = base("#F5F5F5", "#9C8B7A")
    window(d, 380, 110, 60, 55)
    d.add(Rect(100, 70, 240, 10, fillColor=C.HexColor("#5d4037")))
    d.add(Rect(110, 30, 8, 40, fillColor=C.HexColor("#5d4037"))); d.add(Rect(322, 30, 8, 40, fillColor=C.HexColor("#5d4037")))
    d.add(Rect(190, 82, 60, 40, fillColor=C.HexColor("#263238"))); d.add(Rect(194, 86, 52, 32, fillColor=C.HexColor("#4FC3F7")))
    d.add(Rect(215, 80, 10, 4, fillColor=C.grey))
    person(d, 150, 30, 1.0, skin=1, cloth=6, arms="front", label="Ravi")
    person(d, 290, 30, 1.0, skin=3, cloth=5, label="Kollegin")
    d.add(Rect(40, 30, 20, 25, fillColor=C.HexColor("#8d6e63"))); d.add(Circle(50, 70, 18, fillColor=C.HexColor("#43a047")))
    label(d, 220, 180, "Im Büro")
    return d

def park():
    d = base("#DDF0FF", "#8BC34A", 35)
    d.add(Circle(410, 165, 18, fillColor=C.HexColor("#FDD835"), strokeColor=None))
    tree(d, 50, 35); tree(d, 120, 35, 0.8); tree(d, 380, 35, 1.1)
    d.add(Rect(170, 50, 80, 6, fillColor=C.HexColor("#795548"))); d.add(Rect(175, 35, 5, 15, fillColor=C.HexColor("#795548"))); d.add(Rect(240, 35, 5, 15, fillColor=C.HexColor("#795548")))
    person(d, 210, 56, 0.8, skin=3, cloth=3)
    person(d, 300, 35, 1.0, skin=1, cloth=1, arms="up", label="joggt")
    d.add(Ellipse(340, 42, 12, 6, fillColor=C.HexColor("#6d4c41"))); d.add(Circle(352, 48, 5, fillColor=C.HexColor("#6d4c41")))
    label(d, 230, 180, "Im Park am Wochenende")
    return d

def party():
    d = base("#FFF0F5", "#D7B19D")
    for i, (x, col) in enumerate([(40, "#e74c3c"), (70, "#3498db"), (400, "#f1c40f"), (430, "#9b59b6")]):
        d.add(Line(x, 110, x, 150, strokeColor=C.grey)); d.add(Ellipse(x, 160, 12, 15, fillColor=C.HexColor(col), strokeColor=None))
    d.add(Rect(170, 60, 120, 8, fillColor=C.HexColor("#8B5A2B")))
    d.add(Rect(205, 68, 50, 20, fillColor=C.HexColor("#f8bbd0"))); 
    for i in range(3): d.add(Rect(215+i*12, 88, 3, 10, fillColor=C.HexColor("#ffeb3b")))
    person(d, 120, 30, 1.0, skin=0, cloth=4, arms="up")
    person(d, 330, 30, 1.0, skin=2, cloth=0, arms="up")
    person(d, 370, 30, 0.9, skin=1, cloth=3)
    box(d, 90, 30, 22, 18)
    label(d, 230, 180, "Alles Gute zum Geburtstag!", 11, "#c2185b")
    return d

def classroom():
    d = base("#F4F1EA", "#A1887F")
    d.add(Rect(120, 100, 220, 75, fillColor=C.HexColor("#2E5E3E"), strokeColor=C.HexColor("#6d4c41"), strokeWidth=4))
    label(d, 230, 150, "Deutschkurs B1", 12, "#FFFFFF"); label(d, 230, 125, "der · den · dem · des", 10, "#FFFFFF")
    person(d, 360, 30, 1.1, skin=3, cloth=6, arms="up", label="Lehrerin")
    for i, x in enumerate([60, 150, 240]):
        d.add(Rect(x-25, 45, 50, 6, fillColor=C.HexColor("#6d4c41")))
        person(d, x, 30, 0.75, skin=i, cloth=i+1)
    label(d, 60, 180, "Im Kurs")
    return d

def moving():
    d = base("#EFF3F6", "#B0A08A")
    d.add(Polygon([300, 30, 440, 30, 440, 120, 370, 170, 300, 120], fillColor=C.HexColor("#f5deb3"), strokeColor=C.HexColor("#8a6436")))
    d.add(Rect(355, 30, 30, 50, fillColor=C.HexColor("#6d4c41"))); window(d, 310, 85, 30, 25); window(d, 400, 85, 30, 25)
    box(d, 30, 30, 40, 30, "Küche"); box(d, 40, 60, 30, 25, "Bücher"); box(d, 80, 30, 35, 28)
    d.add(Rect(130, 30, 70, 22, fillColor=C.HexColor("#7986cb"))); d.add(Rect(130, 52, 70, 15, fillColor=C.HexColor("#5c6bc0")))
    person(d, 230, 30, 1.0, skin=1, cloth=0, arms="front")
    person(d, 270, 30, 1.0, skin=0, cloth=2, arms="front")
    box(d, 238, 70, 26, 18)
    label(d, 120, 180, "Umzug in die neue Wohnung")
    return d

def city():
    d = base("#DDEEFF", "#777777", 30)
    for i, (x, h, col) in enumerate([(10, 120, "#b0bec5"), (70, 90, "#ffcc80"), (130, 140, "#90a4ae"), (340, 110, "#ef9a9a"), (400, 130, "#a5d6a7")]):
        d.add(Rect(x, 30, 55, h, fillColor=C.HexColor(col), strokeColor=None))
        for r in range(int(h/30)):
            d.add(Rect(x+8, 40+r*28, 12, 12, fillColor=C.HexColor("#fffde7"))); d.add(Rect(x+33, 40+r*28, 12, 12, fillColor=C.HexColor("#fffde7")))
    d.add(Rect(200, 38, 120, 45, fillColor=C.HexColor("#FDD835"))); label(d, 260, 65, "Bus 100", 9)
    d.add(Circle(220, 38, 8, fillColor=C.black)); d.add(Circle(300, 38, 8, fillColor=C.black))
    person(d, 330, 12, 0.8, skin=2, cloth=1)
    d.add(Rect(186, 150, 110, 18, fillColor=C.HexColor("#1565c0"))); label(d, 241, 155, "Berlin Hbf 2 km", 8, "#FFFFFF")
    label(d, 240, 185, "In der Stadt")
    return d

def apartment():
    d = base("#FAF7F0", "#C9A57A")
    d.add(Line(230, 30, 230, 200, strokeColor=C.HexColor("#999"), strokeWidth=3))
    d.add(Rect(30, 30, 120, 30, fillColor=C.HexColor("#90caf9"))); d.add(Rect(30, 60, 30, 25, fillColor=C.white, strokeColor=C.grey))
    d.add(Rect(170, 30, 30, 50, fillColor=C.HexColor("#8d6e63"))); d.add(Rect(180, 80, 10, 25, fillColor=C.HexColor("#ffe082")))
    label(d, 110, 170, "Schlafzimmer"); label(d, 340, 170, "Wohnzimmer")
    d.add(Rect(260, 30, 110, 30, fillColor=C.HexColor("#a1887f"))); d.add(Rect(260, 60, 110, 20, fillColor=C.HexColor("#8d6e63")))
    d.add(Rect(390, 30, 50, 110, fillColor=C.HexColor("#6d4c41")))
    for r in range(3):
        for i in range(4): d.add(Rect(395+i*11, 45+r*30, 7, 20, fillColor=CLOTH[(i+r)%7]))
    window(d, 80, 100, 50, 40); d.add(Rect(290, 110, 60, 40, fillColor=C.HexColor("#ffe0b2"), strokeColor=C.HexColor("#6d4c41"), strokeWidth=3))
    return d

SCENES = dict(family=family, kitchen=kitchen, shop=shop, doctor=doctor, station=station, office=office,
              park=park, party=party, classroom=classroom, moving=moving, city=city, apartment=apartment)

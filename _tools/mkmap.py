"""Project Natural Earth 110m land (world-atlas topojson) to a fixed SVG path.
Natural Earth I projection, centred on 0 deg, 640 wide, cropped to lat 80..-57.
Usage: python3 -I _tools/mkmap.py land-110m.json complications/worldmap.js
Data: https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/land-110m.json"""
import json, math, sys

W = 640
TOP, BOT = 80, -57
K = W / (2 * 0.8707 * math.pi)


def ne(lon, lat):
    l, p = math.radians(lon), math.radians(lat)
    p2 = p * p
    p4 = p2 * p2
    x = l * (0.8707 - 0.131979 * p2 + p4 * (-0.013791 + p4 * (0.003971 * p2 - 0.001529 * p4)))
    y = p * (1.007226 + p2 * (0.015085 + p4 * (-0.044475 + 0.028874 * p2 - 0.005916 * p4)))
    return x, y


Y0 = ne(0, TOP)[1]
H = round(K * (Y0 - ne(0, BOT)[1]), 1)


def px(lon, lat):
    x, y = ne(lon, lat)
    return W / 2 + K * x, K * (Y0 - y)


topo = json.load(open(sys.argv[1]))
sc, tr = topo["transform"]["scale"], topo["transform"]["translate"]
arcs = []
for a in topo["arcs"]:
    x = y = 0
    pts = []
    for dx, dy in a:
        x += dx
        y += dy
        pts.append((x * sc[0] + tr[0], y * sc[1] + tr[1]))
    arcs.append(pts)


def ring(idx):
    out = []
    for i in idx:
        pts = arcs[i] if i >= 0 else arcs[~i][::-1]
        out.extend(pts if not out else pts[1:])
    return out


def polys(geom):
    if geom["type"] == "GeometryCollection":
        for g in geom["geometries"]:
            yield from polys(g)
    elif geom["type"] == "Polygon":
        yield geom["arcs"]
    elif geom["type"] == "MultiPolygon":
        yield from geom["arcs"]


def emit(pts):
    s, last = "", None
    for lon, lat in pts:
        x, y = px(lon, lat)
        x, y = round(x, 1), round(y, 1)
        if last is None:
            s += "M%g %g" % (x, y)
        elif abs(x - last[0]) + abs(y - last[1]) >= 0.6:
            s += "l%g %g" % (round(x - last[0], 1), round(y - last[1], 1))
        else:
            continue
        last = (x, y)
    return s + "z" if s.count("l") >= 2 else ""


d = ""
for poly in polys(topo["objects"]["land"]):
    for r in poly:
        pts = ring(r)
        if max(p[1] for p in pts) < -60:  # Antarctica: cropped anyway
            continue
        # a ring that crosses the antimeridian is unwrapped and clamped to the map edge
        un, off = [pts[0]], 0
        for (a, _), (b, lat) in zip(pts, pts[1:]):
            if b - a > 180:
                off -= 360
            elif a - b > 180:
                off += 360
            un.append((b + off, lat))
        d += emit([(max(-180, min(180, lo)), la) for lo, la in un])

with open(sys.argv[2], "w") as f:
    f.write("// Generated: Natural Earth 110m land (public domain), Natural Earth I projection,\n")
    f.write("// %d x %g px, lat %d..%d. Regenerate with mkmap.py; do not edit by hand.\n" % (W, H, TOP, BOT))
    f.write("window.WorldMap={w:%d,h:%g,top:%d,bot:%d,land:\"%s\"};\n" % (W, H, TOP, BOT, d))
print(len(d), H)

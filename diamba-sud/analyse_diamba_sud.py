"""
Analyse des intercepts de forage — Diamba Sud (Southern Arc & Kassasoko)
Source : communiqué Fortuna Mining du 13/10/2026.

Calcule :
  - gram-mètres (GT = teneur x largeur réelle) par intercept
  - teneur "résiduelle" de l'enveloppe hors pics inclus
  - part du métal portée par les pics (effet pépite)
  - sensibilité au top-cut (écrêtage) des pics
  - longueur de passe en forage (DH = TW / 0,8) et profondeur verticale estimée
  - statistiques par gisement (moyennes pondérées TW)

Usage :  python analyse_diamba_sud.py [--cap 20] [--dip 60] [--xlsx]
"""
import argparse
import math
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).parent
CSV = ROOT / "data" / "intercepts_diamba_sud_oct2026.csv"
TW_DH = 0.8  # 1 m d'échantillon en forage = 0,8 m de largeur réelle (déduit du communiqué)


def charger():
    df = pd.read_csv(CSV)
    df["gm"] = df["au_gt"] * df["tw_m"]
    df["dh_m"] = df["tw_m"] / TW_DH
    df["a_m"] = df["de_m"] + df["dh_m"]
    return df


def enveloppes(df, cap, dip):
    env = df[df["niveau"] == "enveloppe"].copy()
    inc = df[df["niveau"] == "inclus"]
    rows = []
    for _, e in env.iterrows():
        sub = inc[inc["parent_id"] == e["interval_id"]]
        gm_inc = (sub["au_gt"] * sub["tw_m"]).sum()
        tw_inc = sub["tw_m"].sum()
        tw_res = e["tw_m"] - tw_inc
        g_res = (e["gm"] - gm_inc) / tw_res if tw_res > 0 else float("nan")
        gm_cap = (sub["au_gt"].clip(upper=cap) * sub["tw_m"]).sum()
        g_cap = (e["gm"] - gm_inc + gm_cap) / e["tw_m"]
        z_mid = (e["de_m"] + e["dh_m"] / 2) * math.sin(math.radians(dip))
        rows.append({
            **e.to_dict(),
            "n_pics": len(sub),
            "gm_pics": round(gm_inc, 1),
            "part_metal_pics_%": round(100 * gm_inc / e["gm"], 1),
            "part_largeur_pics_%": round(100 * tw_inc / e["tw_m"], 1),
            "teneur_residuelle_gt": round(g_res, 2),
            f"teneur_ecretee_{cap:g}gt": round(g_cap, 2),
            "perte_ecretage_%": round(100 * (1 - g_cap / e["au_gt"]), 1),
            "z_vert_milieu_m": round(z_mid, 0),
        })
    out = pd.DataFrame(rows).sort_values("gm", ascending=False)
    return out


def synthese(env, cap):
    col = f"teneur_ecretee_{cap:g}gt"
    g = env.groupby("gisement")
    s = pd.DataFrame({
        "n_intercepts": g.size(),
        "tw_total_m": g["tw_m"].sum().round(1),
        "gm_total": g["gm"].sum().round(0),
        "teneur_pond_gt": (g["gm"].sum() / g["tw_m"].sum()).round(2),
        f"teneur_pond_ecretee_gt": (g.apply(lambda x: (x[col] * x["tw_m"]).sum() / x["tw_m"].sum(),
                                            include_groups=False)).round(2),
        "part_metal_pics_%": (g["gm_pics"].sum() / g["gm"].sum() * 100).round(1),
        "z_moyen_m": g["z_vert_milieu_m"].mean().round(0),
    })
    return s


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--cap", type=float, default=20.0, help="top-cut g/t (défaut 20)")
    ap.add_argument("--dip", type=float, default=60.0, help="inclinaison des forages en ° (défaut 60)")
    ap.add_argument("--xlsx", action="store_true", help="exporter un classeur Excel")
    a = ap.parse_args()

    df = charger()
    env = enveloppes(df, a.cap, a.dip)
    syn = synthese(env, a.cap)

    pd.set_option("display.width", 220)
    pd.set_option("display.max_columns", 30)
    cols = ["gisement", "forage", "interval_id", "de_m", "tw_m", "au_gt", "gm", "n_pics",
            "part_metal_pics_%", "teneur_residuelle_gt", f"teneur_ecretee_{a.cap:g}gt",
            "perte_ecretage_%", "z_vert_milieu_m"]
    print(f"\n=== Enveloppes classées par gram-mètres (top-cut {a.cap:g} g/t, forages -{a.dip:g}°) ===")
    print(env[cols].to_string(index=False))
    print("\n=== Synthèse par gisement ===")
    print(syn.to_string())

    # Sensibilité top-cut globale
    print("\n=== Sensibilité top-cut (teneur pondérée toutes enveloppes) ===")
    for cap in (10, 15, 20, 25, 30, 40, 1e9):
        e = enveloppes(df, cap, a.dip)
        c = f"teneur_ecretee_{cap:g}gt"
        g = (e[c] * e["tw_m"]).sum() / e["tw_m"].sum()
        lab = "sans" if cap > 1e6 else f"{cap:g} g/t"
        print(f"  cap {lab:>8} : {g:5.2f} g/t")

    # Réserve FS : contrôle de cohérence
    t, g = 20.5e6, 1.75
    print(f"\nContrôle FS : {t/1e6:.1f} Mt x {g} g/t = {t*g/31.1035/1e6:.3f} Moz (annoncé 1,15 Moz)")
    m = 36592 + 8787
    print(f"Mètres forés SA+KSK : {m:,} m ; Bambadji : 8 M$ / 51 000 m = {8e6/51000:.0f} $/m")

    if a.xlsx:
        out = ROOT / "diamba_sud_intercepts_analyse.xlsx"
        with pd.ExcelWriter(out) as xw:
            df.to_excel(xw, "intervalles_bruts", index=False)
            env.to_excel(xw, "enveloppes_analyse", index=False)
            syn.to_excel(xw, "synthese_gisement")
        print(f"\nExport : {out}")


if __name__ == "__main__":
    main()

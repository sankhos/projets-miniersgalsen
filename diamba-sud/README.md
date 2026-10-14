# Diamba Sud (Sénégal) — analyse des forages d'octobre 2026

Analyse des résultats publiés par Fortuna Mining le 13/10/2026 (Southern Arc, Kassasoko, Bambadji/Kabewest).

| Fichier | Contenu |
|---|---|
| `Diamba_Sud_Analyse_Forages_Oct2026.html` | Rapport interactif offline (fichier unique) : 12 sections, graphiques GT, profils de forage, top-cut, modèle Monte-Carlo de cible d'exploration (SA, Kassasoko, Kabewest pondéré Pg) + tornado, screening fosse (coupure, SR limite, valeur nette par m de direction), sensibilité prix de l'or 2 000–4 500 $/oz, interprétation, QA du communiqué, recommandations |
| `Diamba_Sud_Fosse_3D_Pushbacks.html` | Fosse 3D interactive offline : modèle de blocs 15 m estimé (IDW anisotrope) depuis les intercepts, fosse optimale Lerchs-Grossmann (max-flow), 12 coques emboîtées, pushbacks animés banc par banc, stérile par profil d'altération (latérite / saprolite / transition / roche fraîche) distinct des classes de teneur, coupe 3D, coupe 2D avec forages, pit-by-pit |
| `data/intercepts_diamba_sud_oct2026.csv` | Base intercepts structurée (enveloppes + pics inclus, TW, de, Au) |
| `analyse_diamba_sud.py` | Recalcul reproductible (pandas) : gram-mètres, teneur résiduelle, part de métal des pics, sensibilité top-cut, export Excel `--xlsx` |

```bash
python analyse_diamba_sud.py --cap 20 --dip 60 --xlsx
```

Hypothèses clés : DH = TW / 0,8 (déduit du communiqué), forages inclinés à -60°, paramètres économiques modifiables dans le HTML.
Le modèle de la section 8 est une cible d'exploration conceptuelle, **ni ressource ni réserve** (NI 43-101 / JORC).

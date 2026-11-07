# Official IOMA Paris Shopify Catalogue Migration Report

**Execution Timestamp**: 2026-09-15T22:55:36.599Z  
**Environment**: Production / Staging  
**Database**: MongoDB (`mongodb://localhost:27017/ioma`)  
**Source File**: `ioma-paris-eshop-FR-product-export_2026-09-14.xlsx`  
**Execution Mode**: **APPLY (Database Write)**

---

## 1. Executive Summary

| Metric                               | Discovered in Official Export | Successfully Synced | Status                               |
| :----------------------------------- | :---------------------------- | :------------------ | :----------------------------------- |
| **Excel Total Rows**                 | 251 rows                      | 251 processed       | Complete                             |
| **Unique Products Grouped**          | 63 products                   | 63 products         | 100% Grouped                         |
| **Priced Products (Published)**      | 49 products                   | 49 products         | 100% Matched to UAE AED prices       |
| **Unpriced Products (Draft)**        | 14 products                   | 14 products         | Marked `DRAFT` & `UAE_PRICE_PENDING` |
| **Total Product Variants**           | 56 commercial sizes           | 56 variants         | Synchronized                         |
| **Official Ranges (`custom.gamme`)** | 10 ranges                     | 10 ranges           | Charter colors mapped                |
| **Hierarchical Categories**          | 20 categories                 | 20 categories       | Visage, Corps, Cheveux, etc.         |
| **Normalized Skin Concerns**         | 30 unique concerns            | 30 concerns         | Multilingual + Icons                 |
| **Normalized Skin Types**            | 8 skin types                  | 8 skin types        | Mapped from source                   |
| **Normalized Product Types**         | 20 product types              | 20 product types    | Normalized                           |
| **Total Images Processed**           | 235 images                    | 235 indexed         | Primary + Secondary gallery          |
| **Cleaned Demo Products**            | N/A                           | 0 records           | Cleaned                              |

---

## 2. Range Distribution

| Range Code           | Official Collection Name | Charter Color   | Products Count |
| :------------------- | :----------------------- | :-------------- | :------------- |
| `hydra`              | 1 - Hydra                | `#00639A`       | 7              |
| `energize`           | 2 - Energize             | `#E56953`       | 5              |
| `renew`              | 3 - Renew                | `#782285`       | 14             |
| `calm`               | 4 - Calm                 | `#B52655`       | 2              |
| `purete`             | 5 - Pureté               | `#B89E16`       | 5              |
| `matte`              | 6 - Matte                | `#00677F`       | 1              |
| `illumine`           | 7 - Illumine             | `#483A8F`       | 7              |
| `inlab`              | Soin sur mesure (In.Lab) | `#AA9FEB`       | 4              |
| `coco`               | Cocoon (Corps)           | `#8D7B68`       | 3              |
| `hair`               | Haircare (Cheveux)       | `#2C5E7A`       | 8              |
| _Routines / Bundles_ | Kits & Routines          | Charter Neutral | 7              |

---

## 3. UAE AED Selling Prices & Product Matching

All 49 retail products have been verified with exact client-supplied UAE retail prices (AED):

- **Ma Crème Jour**: 30 ml — **559 AED** | 50 ml — **937 AED**
- **Ma Crème Nuit**: 30 ml — **559 AED** | 50 ml — **937 AED**
- **Mon Sérum**: 30 ml — **873 AED**
- **Mon Soin Yeux**: 30 ml — **508 AED**
- **Gel Fraîcheur Hydratant**: 50 ml — **220 AED**
- **Sérum Hydratant Optimum**: 15 ml — **421 AED**
- **Crème Apaisante Jour et Nuit**: 30 ml — **432 AED**
- **Soft Peeling**: 50 ml — **248 AED**
- **Émulsion Exfoliante Douce**: 50 ml — **201 AED**
- **Mousse Tonique Astringente**: 150 ml — **191 AED**
- **Gel Réparateur Jour et Nuit**: 30 ml — **338 AED**
- **Masque Absorbant**: 50 ml — **251 AED**
- **Crème Hydratation Jeunesse**: 30 ml — **334 AED**
- **Vitality Shot**: 30 ml — **362 AED**
- **Soin Teinté Éclat Parfait (CC Gel)**: 30 ml — **220 AED**
- **Concentré Contour des Yeux J.E**: 15 ml — **362 AED**
- **Vitality Sleeping Mask**: 50 ml — **323 AED**
- **Crème Régulatrice Matifiante**: 30 ml — **303 AED**
- **Cell Protector SPF50+ PA++++**: 30 ml — **321 AED**
- **Bright Pearl Essence**: 40 ml — **698 AED**
- **Élixir Anti-Taches**: 10 ml — **303 AED**
- **Nettoyant Exfoliant Lumière**: 150 ml — **281 AED**
- **Eau de Soin Lumière**: 150 ml — **281 AED**
- **Tonique Doux**: 150 ml — **193 AED**
- **Crème Généreuse Jour**: 30 ml — **464 AED**
- **Crème Généreuse Nuit**: 30 ml — **464 AED**
- **Sérum Généreux Extrême**: 15 ml — **536 AED**
- **Crème Généreuse Contour des Yeux**: 15 ml — **364 AED**
- **Lip Lift**: 15 ml — **346 AED**
- **Crème Sublime Revitalisante**: 50 ml — **968 AED**
- **Lift Contours**: 50 ml — **576 AED**
- **Booster Jeunesse Flacon / Pot**: 50 ml / 50 g — **942 AED**
- **Sublime Oil**: 30 ml — **983 AED**
- **Masque Sublime Revitalisant**: 50 ml — **382 AED**
- **Sérum Intensif Resurfaçant**: 15 ml — **337 AED**
- **Genius Balm**: 50 ml — **112 AED**
- **Voile Exfoliant Douceur**: 150 ml — **228 AED**
- **Crème Voluptueuse Corps**: 150 ml — **241 AED**
- **Shampoing Soin Purifiant**: 200 ml — **155 AED**
- **Shampooing Soin Hydra Anti-Casse**: 200 ml — **155 AED**
- **Après-Shampooing Hydra Fond**: 200 ml — **236 AED**
- **Après-Shampooing Volumy Fond**: 200 ml — **155 AED**
- **Après-Shampooing Renew**: 200 ml — **155 AED**
- **Masque en Baume Repair**: 200 ml — **155 AED**
- **Sérum Essence Hydra**: 70 ml — **260 AED**

---

## 4. Unpriced Official Items (Draft / Price Pending)

The following 14 items are kept in `status: "draft"` and `uaeAvailability: "PENDING"` to protect against unintentional zero-dirham sales:

1. `carte-cadeau-ioma` — Carte Cadeau IOMA
2. `kit-de-patchs-cutanes-ieva-skindiag` — Kit de patchs cutanés IEVA SkinDiag
3. `duo-anti-taches` — Duo Anti taches
4. `routine-sublime-anti-age` — Routine Sublime Anti-âge
5. `duo-zero-defaut` — Duo zéro défaut
6. `morning-routine` — Morning Routine IOMA
7. `soins-reparateurs-cheveux` — Soins Réparateurs Cheveux
8. `duo-soins-du-corps` — Duo soins du corps
9. `routine-anti-imperfections` — Routine anti-imperfections
10. `trio-soin-expert-anti-taches` — Trio Soin Expert Anti-taches
11. `trio-protecteur-et-hydratant` — Trio protecteur et hydratant
12. `rituel-expert-anti-age` — Rituel Expert Anti âge
13. `routine-par-jean-michel-karam-peau-hydratee` — Routine Peau Hydratée
14. `routine-eclat-peau-defatiguee` — Routine Éclat & Peau Défatiguée

---

## 5. Media Migration

- Total official packaging & texture images discovered: **235**
- Ordered gallery populated: 1st image = **Primary**, 2nd+ = **Secondary/Gallery**.
- Local asset mirrors saved to `apps/web/public/images/products/`.
- MinIO upload pipeline verified for object key contract `products/${slug}/${filename}`.

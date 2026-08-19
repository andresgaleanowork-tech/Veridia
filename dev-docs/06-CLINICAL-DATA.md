# Clinical Data Structures & Reference Tables

## ANAM_SYSTEMS (14 anatomical systems)
Each system has: id, name, icon, color, pathologies[]

1. **Endocrino-Metabólico** ⚡ — DM1, DM2, Prediabetes, Resistencia insulínica, Hipotiroidismo, Hipertiroidismo, SOP, Cushing, Hiperuricemia/Gota
2. **Cardiovascular** ❤️ — HTA, Dislipemia, Insuficiencia cardíaca, Aterosclerosis, Cardiopatía isquémica, Síndrome metabólico
3. **Renal** 🫘 — ERC estadio 1-3, ERC estadio 4-5, Litiasis renal, Síndrome nefrótico, Nefropatía diabética, Hemodiálisis
4. **Digestivo** 🍽️ — Crohn, Colitis ulcerosa, SII, Celiaquía, SIBO, ERGE, Gastritis, Pancreatitis, Diverticulosis
5. **Hepatobiliar** 🟡 — Esteatosis hepática (MAFLD), Hepatitis, Cirrosis compensada, Cirrosis descompensada, Colelitiasis, Encefalopatía hepática
6. **Nervioso** 🧠 — Migraña, Epilepsia, Alzheimer, Parkinson, Esclerosis múltiple
7. **Respiratorio** 🫁 — EPOC, Asma, Fibrosis quística, Apnea del sueño, Fibrosis pulmonar
8. **Inmunológico** 🛡️ — Alergias alimentarias, Inmunodeficiencia, Enf. autoinmune, Lupus, Artritis reumatoide
9. **Músculo-Esquelético** 🦴 — Osteoporosis, Sarcopenia, Fibromialgia, Fractura por fragilidad
10. **Ginecológico** 🌸 — SOP, Endometriosis, Menopausia, Embarazo, Lactancia, Infertilidad
11. **Salud Mental** 🧩 — Anorexia nerviosa, Bulimia nerviosa, Trastorno por atracón, Ansiedad, Depresión, Ortorexia
12. **Hematológico** 🩸 — Anemia ferropénica, Anemia megaloblástica, Hemocromatosis, Déficit B12/folato
13. **Oncológico** 🎗️ — Cáncer activo en tratamiento, Post-quimioterapia, Post-cirugía oncológica, Caquexia tumoral
14. **Deportivo** 🏋️ — Ganancia muscular, Alto rendimiento, Recuperación lesión, RED-S, Maratón/ultra

## DEV_PATOLOGIAS (13 in Desarrollada)
Each has: name, fe (stress factor), protGkg, grasasPct, micros{}, note, espenMacros, ajusteKcal, meds{}

| Key | Name | Prot g/kg | Grasa % | ESPEN Macros |
|---|---|---|---|---|
| dm2 | Diabetes Mellitus tipo 2 | 1.2 | 30 | HC 45-60% (bajo IG) · Prot 1.0-1.2 |
| hta | Hipertensión arterial | 1.0 | 30 | Na <2g/día · K >3.5g/día |
| irc | Insuficiencia renal crónica | 0.8 | 35 | Prediálisis 0.6-0.8 · Diálisis 1.0-1.2 |
| dislipemia | Dislipemia | 1.2 | 30 | Sat <7% · MUFA 15-20% · Fibra >10g |
| sobrepeso | Sobrepeso / Obesidad | 1.2 | 30 | Déficit 500-750 kcal · Prot 1.2-1.5 ajustado |
| embarazo | Embarazo | 1.5 | 30 | 1ºT +0 · 2ºT +340 · 3ºT +452 kcal |
| deportista | Alto rendimiento | 1.8 | 25 | Prot 1.6-2.2 · HC 5-8g/kg |
| celiaco | Enfermedad celíaca | 1.2 | 30 | Sin gluten · Suplementar si déficit |
| epoc | EPOC | 1.4 | 40 | 30-35 kcal/kg · Grasas 35-40% · HC 40-45% |
| cirrosis | Cirrosis hepática | 1.3 | 30 | 35 kcal/kg · NO restringir prot · Snack nocturno |
| pancreatitis | Pancreatitis | 1.5 | 20 | Grasas <20% · TCM · Alcohol cero |
| oncologico | Cáncer | 1.5 | 35 | 25-30 kcal/kg · Prot 1.2-2.0 · EPA+DHA ≥2g |
| sinpat | Sin patología | 1.2 | 30 | Equilibrada |

## Clinical Indices (Auto-calculated from lab data)
| Index | Formula | Normal | Risk |
|---|---|---|---|
| HOMA-IR | Glucosa × Insulina / 405 | <1.96 | >3.8 RI severa |
| TG/c-HDL | Triglicéridos / HDL | <2 | >3.5 alto riesgo |
| FLI | Based on TG, IMC, GGT, cintura | <30 descarta | ≥60 sugiere esteatosis |
| FIB-4 | Edad × AST / (Plaquetas × √ALT) | <1.3 | >2.67 fibrosis |
| PCR | Direct measurement | <1 mg/L | >3 inflamación |

## ESPEN Recommendations (9 pathologies with auto-recs)
Each has 5 categories: generales, incorporar, evitar, cocción, pautas higiénico-dietéticas.
Pathologies: DM1, DM2, HTA, Dislipemia, EPOC, MAFLD, Cirrosis, Celiaquía, Embarazo.

## Pathology-specific Questions (13 pathologies)
DM1 (7q), DM2 (7q), HTA (5q), Dislipemia (4q), EPOC (5q), MAFLD (4q), Cirrosis (4q), ERC 4-5 (5q), Celiaquía (4q), SII (4q), Anemia ferropénica (4q), Embarazo (6q), Cáncer activo (6q).

## Nutritional Support Pathology Guides (5)
Pancreatitis, Cancer, Quemado, Cirugía mayor, ERC/Diálisis.
Each includes: screening, energía, proteína, vía preferente, fórmula NE, indicación NP, micronutrientes, monitorización, complicaciones, referencia ESPEN.

## BEDCA Food Groups (13)
969 foods with: id, n(name), g(group), gi(group_id), k(kcal), p(protein), gr(fat), h(carbs), fi(fiber), ca(calcium), fe(iron), na(sodium), K(potassium), vc(vitC), vd(vitD)

## Supplements Database (12)
VitD3, Hierro, Omega-3, Magnesio, Zinc, B12, Ácido fólico, Probióticos, Calcio, VitC, Colágeno, Creatina.
Each with: nombre, dosis, mg, indicación, precaución.

## Food Equivalencies (54 entries, 6 groups)
Frutas, Cereales/HC, Proteínas, Grasas, Lácteos, Verduras.

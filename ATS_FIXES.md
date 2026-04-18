# CORRECTIONS ATS CRITIQUES

## Problèmes identifiés

### 1. Texte invisible (CRITIQUE)
- `_draw_ats_hidden_keywords()` utilise `setTextRenderMode(3)` = INVISIBLE
- Certains ATS (Workday, Taleo) ne lisent PAS le texte invisible
- Solution : Utiliser `setTextRenderMode(0)` + couleur background + taille 0.1pt

### 2. Labels ATS invisibles
- Email, Phone, LinkedIn labels sont en mode invisible
- Solution : Les rendre visibles mais minuscules (0.1pt, couleur background)

### 3. Ordre de lecture PDF
- Les éléments ne sont pas dans l'ordre logique de lecture
- Solution : Dessiner dans l'ordre : Header → Contact → Summary → Experience → Education → Skills

### 4. Manque de métadonnées
- Pas de /Title, /Author, /Subject dans les métadonnées PDF
- Solution : Ajouter c.setAuthor(), c.setSubject()

### 5. Fonts non-standard
- Poppins, Lora peuvent ne pas être lisibles par tous les ATS
- Solution : Toujours avoir un fallback vers Helvetica/Times

## FIXES À APPLIQUER

### Fix 1: Remplacer texte invisible par texte micro-visible
```python
# AVANT (MAUVAIS)
to.setTextRenderMode(3)  # Invisible

# APRÈS (BON)
to.setTextRenderMode(0)  # Normal
to.setFont("Helvetica", 0.1)  # Micro-taille
c.setFillColor(bg_color)  # Couleur du fond
```

### Fix 2: Ajouter métadonnées ATS
```python
c.setAuthor(cv_data.get("name", ""))
c.setSubject("Resume - " + cv_data.get("title", ""))
c.setKeywords(", ".join(skills_list[:10]))
```

### Fix 3: Ordre de lecture strict
Toujours dessiner dans cet ordre :
1. Name
2. Title  
3. Contact (email, phone, location, linkedin)
4. Summary
5. Experience (chronologique inverse)
6. Education
7. Skills
8. Languages
9. Certifications

### Fix 4: Labels ATS visibles
```python
# Email: john@example.com
# Phone: +33 6 12 34 56 78
# LinkedIn: linkedin.com/in/john
```

### Fix 5: Éviter les éléments graphiques complexes
- Pas de grilles de fond (Tech Grid)
- Pas de formes diagonales (Creative Vision)
- Préférer des rectangles simples

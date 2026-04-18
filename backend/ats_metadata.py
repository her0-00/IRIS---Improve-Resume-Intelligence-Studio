"""
ATS Metadata Helper - Add proper metadata to all PDF themes
"""

def add_ats_metadata(canvas, cv_data):
    """Add ATS-compliant metadata to PDF canvas"""
    canvas.setAuthor(cv_data.get("name", ""))
    canvas.setSubject("Resume - " + cv_data.get("title", ""))
    
    # Extract top skills for keywords
    skills_list = []
    for cat in cv_data.get("skills", {}).get("categories", []):
        skills_list.extend(cat.get("items", [])[:5])
    if skills_list:
        canvas.setKeywords(", ".join(skills_list[:10]))

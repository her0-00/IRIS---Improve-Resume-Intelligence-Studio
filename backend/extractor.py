import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
import json
import io
import traceback

def main():
    try:
        import pdfplumber

        # Ensure stdin is in binary mode and read all data
        if hasattr(sys.stdin, 'buffer'):
            pdf_bytes = sys.stdin.buffer.read()
        else:
            # Fallback for environments without buffer attribute
            pdf_bytes = sys.stdin.read().encode('latin-1')
            
        if not pdf_bytes:
            print(json.dumps({
                "success": False, 
                "error": "Aucune donnée n'a été reçue. Veuillez réessayer d'uploader le fichier."
            }), flush=True)
            sys.exit(0)

        text = ""
        links = set()
        
        with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
            for page in pdf.pages:
                # Extract visible text with lowered x_tolerance to prevent glued words
                page_text = page.extract_text(x_tolerance=1, y_tolerance=3)
                if page_text:
                    text += page_text + "\n"
                
                # Extract hidden hyperlinks (URIs)
                try:
                    for link in page.hyperlinks:
                        uri = link.get('uri')
                        if uri and (uri.startswith('http') or uri.startswith('mailto')):
                            links.add(uri)
                except Exception as e:
                    # Capture warning but don't fail the whole process
                    pass

        # Check if any text was extracted
        if not text.strip():
            print(json.dumps({
                "success": False, 
                "error": "Le document semble être vide ou illisible. Impossibilité de lancer l'analyse."
            }), flush=True)
            sys.exit(0)

        # Append hidden links to text for AI visibility
        if links:
            text += "\n\n--- DETECTED HYPERLINKS (UNMASKED) ---\n"
            text += "\n".join(sorted(list(links)))
            text += "\n-------------------------------------\n"

        # Strip null bytes
        text = text.replace('\x00', '')
        
        # Replace only problematic Unicode characters
        replacements = {
            '\u0153': 'oe',
            '\u0152': 'OE',
            '\u00e6': 'ae',
            '\u00c6': 'AE',
            '\u20ac': 'EUR',
            '\u2014': '-',
            '\u2013': '-',
            '\u2018': "'",
            '\u2019': "'",
            '\u201c': '"',
            '\u201d': '"',
            '\u2026': '...',
        }
        for old, new in replacements.items():
            text = text.replace(old, new)

        print(json.dumps({"success": True, "text": text}), flush=True)

    except Exception as e:
        error_msg = str(e)
        # Check for common PDF errors to give a clearer message
        if "not a valid PDF" in error_msg.lower() or "cannot find descriptor" in error_msg.lower():
            friendly_msg = f"Le fichier n'est pas un PDF valide ou est protégé. Impossibilité de lancer l'analyse. (Erreur: {error_msg})"
        else:
            friendly_msg = f"Erreur lors de l'extraction : {error_msg}. Impossibilité de lancer l'analyse."
            
        print(json.dumps({
            "success": False, 
            "error": friendly_msg, 
            "traceback": traceback.format_exc()
        }), flush=True)
        sys.exit(0) # Exit 0 so the JSON is caught by route.ts correctly without being treated as a process crash if it's a "handled" error

if __name__ == "__main__":
    main()

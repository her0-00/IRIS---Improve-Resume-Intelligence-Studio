#!/usr/bin/env python3
"""
Test script pour Adzuna API
Usage: python test_adzuna.py
"""

import requests
import json
from datetime import datetime

# Adzuna API credentials (gratuit: https://developer.adzuna.com/)
APP_ID = 'YOUR_APP_ID'  # Remplacer par ton app_id
APP_KEY = 'YOUR_APP_KEY'  # Remplacer par ton app_key

# Paramètres de recherche
params = {
    'country': 'fr',  # fr, us, uk, de, etc.
    'keywords': 'développeur react',
    'location': 'Paris',
    'results_per_page': 10,
    'page': 1
}

url = f"https://api.adzuna.com/v1/api/jobs/{params['country']}/search/{params['page']}"

query_params = {
    'app_id': APP_ID,
    'app_key': APP_KEY,
    'what': params['keywords'],
    'where': params['location'],
    'results_per_page': params['results_per_page'],
    'content-type': 'application/json'
}

print('🔍 Recherche Adzuna...')
print(f"URL: {url}")
print(f"Params: {params['keywords']} @ {params['location']}\n")

try:
    response = requests.get(url, params=query_params, timeout=10)
    response.raise_for_status()
    
    data = response.json()
    
    print('✅ Réponse reçue\n')
    print('📊 STATISTIQUES:')
    print('─' * 50)
    print(f"Total offres trouvées: {data.get('count', 0)}")
    print(f"Offres retournées: {len(data.get('results', []))}")
    print()
    
    if data.get('results'):
        print('📋 EXEMPLE D\'OFFRES:\n')
        
        for idx, job in enumerate(data['results'][:3], 1):
            print('\n' + '━' * 50)
            print(f"OFFRE #{idx}")
            print('━' * 50)
            print(f"📌 Titre: {job.get('title', 'N/A')}")
            print(f"🏢 Entreprise: {job.get('company', {}).get('display_name', 'N/A')}")
            print(f"📍 Localisation: {job.get('location', {}).get('display_name', 'N/A')}")
            
            salary_min = job.get('salary_min')
            salary_max = job.get('salary_max')
            if salary_min and salary_max:
                print(f"💰 Salaire: {salary_min:,.0f}€ - {salary_max:,.0f}€")
            else:
                print(f"💰 Salaire: Non spécifié")
            
            created = job.get('created')
            if created:
                date = datetime.fromisoformat(created.replace('Z', '+00:00'))
                print(f"📅 Date: {date.strftime('%d/%m/%Y')}")
            
            print(f"🔗 URL: {job.get('redirect_url', 'N/A')}")
            
            description = job.get('description', '')
            # Remove HTML tags
            import re
            clean_desc = re.sub('<[^<]+?>', '', description)
            print(f"📝 Description (extrait):")
            print(f"   {clean_desc[:200]}..." if clean_desc else "   N/A")
            
            print(f"🏷️  Catégorie: {job.get('category', {}).get('label', 'N/A')}")
            print(f"⏰ Type contrat: {job.get('contract_type', 'N/A')}")
        
        print('\n\n' + '━' * 50)
        print('📦 STRUCTURE COMPLÈTE D\'UNE OFFRE:')
        print('━' * 50 + '\n')
        print(json.dumps(data['results'][0], indent=2, ensure_ascii=False))
        
        print('\n\n' + '━' * 50)
        print('🔑 CHAMPS DISPONIBLES:')
        print('━' * 50)
        for field, value in data['results'][0].items():
            if isinstance(value, dict):
                subfields = ', '.join(value.keys())
                print(f"  • {field}: Object ({subfields})")
            else:
                print(f"  • {field}: {type(value).__name__}")
        
        # Statistiques supplémentaires
        print('\n\n' + '━' * 50)
        print('📈 ANALYSE DES DONNÉES:')
        print('━' * 50)
        
        # Salaires
        salaries = [j for j in data['results'] if j.get('salary_min') and j.get('salary_max')]
        if salaries:
            avg_min = sum(j['salary_min'] for j in salaries) / len(salaries)
            avg_max = sum(j['salary_max'] for j in salaries) / len(salaries)
            print(f"💰 Salaire moyen: {avg_min:,.0f}€ - {avg_max:,.0f}€")
            print(f"   ({len(salaries)}/{len(data['results'])} offres avec salaire)")
        
        # Entreprises
        companies = set(j.get('company', {}).get('display_name') for j in data['results'] if j.get('company'))
        print(f"🏢 Entreprises uniques: {len(companies)}")
        
        # Localisations
        locations = set(j.get('location', {}).get('display_name') for j in data['results'] if j.get('location'))
        print(f"📍 Localisations: {', '.join(list(locations)[:5])}")
        
        # Catégories
        categories = set(j.get('category', {}).get('label') for j in data['results'] if j.get('category'))
        print(f"🏷️  Catégories: {', '.join(list(categories)[:5])}")
        
    else:
        print('❌ Aucune offre trouvée')
        print('Réponse complète:', json.dumps(data, indent=2, ensure_ascii=False))
    
except requests.exceptions.RequestException as e:
    print(f'❌ Erreur requête: {e}')
except json.JSONDecodeError as e:
    print(f'❌ Erreur parsing JSON: {e}')
    print(f'Réponse brute: {response.text}')

print('\n\n💡 TIPS:')
print('─' * 50)
print('1. Créer un compte gratuit: https://developer.adzuna.com/')
print('2. Obtenir APP_ID et APP_KEY')
print('3. Remplacer les valeurs dans ce script')
print('4. Lancer: python test_adzuna.py')
print()
print('📚 Pays disponibles:')
print('  fr (France), us (USA), uk (UK), de (Allemagne),')
print('  ca (Canada), au (Australie), at (Autriche), etc.')
print()
print('🔧 Paramètres avancés disponibles:')
print('  • salary_min / salary_max: Filtrer par salaire')
print('  • full_time / part_time: Type de contrat')
print('  • permanent / contract: Durée')
print('  • sort_by: relevance, date, salary')
print()

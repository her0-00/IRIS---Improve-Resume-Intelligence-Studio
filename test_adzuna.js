// Test script pour Adzuna API
// Usage: node test_adzuna.js

const https = require('https');

// Adzuna API credentials (gratuit: https://developer.adzuna.com/)
const APP_ID = ''; // Remplacer par ton app_id
const APP_KEY = ''; // Remplacer par ton app_key

// Paramètres de recherche
const params = {
  country: 'fr', // fr, us, uk, de, etc.
  keywords: 'développeur react', // Mots-clés
  location: 'Paris', // Ville
  results_per_page: 10, // Max 50
  page: 1
};

const url = `https://api.adzuna.com/v1/api/jobs/${params.country}/search/${params.page}?` +
  `app_id=${APP_ID}&` +
  `app_key=${APP_KEY}&` +
  `what=${encodeURIComponent(params.keywords)}&` +
  `where=${encodeURIComponent(params.location)}&` +
  `results_per_page=${params.results_per_page}&` +
  `content-type=application/json`;

console.log('🔍 Recherche Adzuna...');
console.log('URL:', url.replace(APP_KEY, '***'));
console.log('');

https.get(url, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      
      console.log('✅ Réponse reçue\n');
      console.log('📊 STATISTIQUES:');
      console.log('─────────────────────────────────────');
      console.log(`Total offres trouvées: ${json.count || 0}`);
      console.log(`Offres retournées: ${json.results?.length || 0}`);
      console.log('');
      
      if (json.results && json.results.length > 0) {
        console.log('📋 EXEMPLE D\'OFFRES:\n');
        
        json.results.slice(0, 3).forEach((job, idx) => {
          console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
          console.log(`OFFRE #${idx + 1}`);
          console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
          console.log(`📌 Titre: ${job.title}`);
          console.log(`🏢 Entreprise: ${job.company?.display_name || 'N/A'}`);
          console.log(`📍 Localisation: ${job.location?.display_name || 'N/A'}`);
          console.log(`💰 Salaire: ${job.salary_min && job.salary_max ? 
            `${job.salary_min}€ - ${job.salary_max}€` : 'Non spécifié'}`);
          console.log(`📅 Date: ${job.created ? new Date(job.created).toLocaleDateString('fr-FR') : 'N/A'}`);
          console.log(`🔗 URL: ${job.redirect_url || 'N/A'}`);
          console.log(`📝 Description (extrait):`);
          console.log(job.description?.substring(0, 200).replace(/<[^>]*>/g, '') + '...' || 'N/A');
          console.log(`🏷️  Catégorie: ${job.category?.label || 'N/A'}`);
          console.log(`⏰ Type contrat: ${job.contract_type || 'N/A'}`);
        });
        
        console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📦 STRUCTURE COMPLÈTE D\'UNE OFFRE:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        console.log(JSON.stringify(json.results[0], null, 2));
        
        console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🔑 CHAMPS DISPONIBLES:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        const fields = Object.keys(json.results[0]);
        fields.forEach(field => {
          const value = json.results[0][field];
          const type = typeof value === 'object' && value !== null ? 
            `Object (${Object.keys(value).join(', ')})` : 
            typeof value;
          console.log(`  • ${field}: ${type}`);
        });
        
      } else {
        console.log('❌ Aucune offre trouvée');
        console.log('Réponse complète:', JSON.stringify(json, null, 2));
      }
      
    } catch (e) {
      console.error('❌ Erreur parsing JSON:', e.message);
      console.error('Réponse brute:', data);
    }
  });
  
}).on('error', (e) => {
  console.error('❌ Erreur requête:', e.message);
});

console.log('\n💡 TIPS:');
console.log('─────────────────────────────────────');
console.log('1. Créer un compte gratuit: https://developer.adzuna.com/');
console.log('2. Obtenir APP_ID et APP_KEY');
console.log('3. Remplacer les valeurs dans ce script');
console.log('4. Lancer: node test_adzuna.js');
console.log('');
console.log('📚 Pays disponibles:');
console.log('  fr (France), us (USA), uk (UK), de (Allemagne),');
console.log('  ca (Canada), au (Australie), at (Autriche), etc.');
console.log('');

/**
 * Verification Test Script for Institution Master Database & Acronym Search
 * Usage: node scripts/testInstitutions.js
 */

const testCases = [
  // User Expected Cases for Guru Ghasidas Vishwavidyalaya
  { query: 'GGU Bilaspur', expectedName: 'Guru Ghasidas', category: 'Acronym + City' },
  { query: 'GGU', expectedName: 'Guru Ghasidas', category: 'Direct Acronym' },
  { query: 'GGV', expectedName: 'Guru Ghasidas', category: 'Direct Acronym' },
  { query: 'Guru Ghasidas', expectedName: 'Guru Ghasidas', category: 'Short Name' },
  { query: 'Guru Ghasidas University', expectedName: 'Guru Ghasidas', category: 'Common Alias' },
  { query: 'Guru Ghasidas Vishwavidyalaya', expectedName: 'Guru Ghasidas', category: 'Exact Full Name' },
  { query: 'GGU Chhattisgarh', expectedName: 'Guru Ghasidas', category: 'Acronym + State' },
  { query: 'GGU Bilaspur Chhattisgarh', expectedName: 'Guru Ghasidas', category: 'Acronym + City + State' },
  { query: 'G G U', expectedName: 'Guru Ghasidas', category: 'Spaced Acronym' },
  { query: 'GGU-Bilaspur', expectedName: 'Guru Ghasidas', category: 'Hyphenated Acronym' },
  { query: 'GGU. Bilaspur', expectedName: 'Guru Ghasidas', category: 'Punctuation Acronym' },

  // Other Major Indian Premier Institutions & Abbreviation Searches
  { query: 'IIT Delhi', expectedName: 'Indian Institute of Technology Delhi', category: 'Abbreviation + City' },
  { query: 'IITD', expectedName: 'Indian Institute of Technology Delhi', category: 'Compound Acronym' },
  { query: 'IIT Bombay', expectedName: 'Indian Institute of Technology Bombay', category: 'Abbreviation + City' },
  { query: 'IITB', expectedName: 'Indian Institute of Technology Bombay', category: 'Compound Acronym' },
  { query: 'JNU Delhi', expectedName: 'Jawaharlal Nehru University', category: 'Acronym + City' },
  { query: 'JNU', expectedName: 'Jawaharlal Nehru University', category: 'Acronym' },
  { query: 'DU Delhi', expectedName: 'University of Delhi', category: 'Acronym + City' },
  { query: 'DU', expectedName: 'University of Delhi', category: 'Acronym' },
  { query: 'BHU', expectedName: 'Banaras Hindu University', category: 'Acronym' },
  { query: 'AIIMS Delhi', expectedName: 'All India Institute of Medical Sciences', category: 'Acronym + City' },

  // Obscure Indian Colleges
  { query: 'Yingli College', expectedName: 'Yingli College', category: 'Obscure Indian College' },
  { query: 'Zunheboto Government College', expectedName: 'Zunheboto Government College', category: 'Obscure Indian College' },
  { query: 'Government Hnahthial College', expectedName: 'Government Hnahthial College', category: 'Obscure Indian College' },
  { query: 'Sohra Government College', expectedName: 'Sohra Government College', category: 'Obscure Indian College' },

  // World Institutions
  { query: 'Hólar University College', expectedName: 'Hólar University College', category: 'World Institution' },
  { query: 'University of Liechtenstein', expectedName: 'University of Liechtenstein', category: 'World Institution' }
];

async function runTests() {
  console.log('========================================================================');
  console.log('     INSTITUTION MASTER DATABASE - ACRONYM & AUTOCOMPLETE TEST SUITE');
  console.log('========================================================================\n');

  let passed = 0;
  let total = testCases.length;

  for (const test of testCases) {
    try {
      const url = `http://localhost:5000/api/institutions/search?q=${encodeURIComponent(test.query)}`;
      const res = await fetch(url);
      const json = await res.json();

      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        const top = json.data[0];
        const isMatch = top.name.toLowerCase().includes(test.expectedName.toLowerCase());
        const location = [top.city, top.state, top.country].filter(Boolean).join(', ');

        if (isMatch) {
          console.log(`[PASS] [${test.category}] "${test.query}"`);
          console.log(`       -> Top Match: ${top.name}`);
          console.log(`       -> Location: ${location}`);
          console.log(`       -> Type: ${top.type} | Sector: ${top.sector} | Source: ${top.source}\n`);
          passed++;
        } else {
          console.log(`[FAIL] [${test.category}] "${test.query}"`);
          console.log(`       -> Expected: "${test.expectedName}"`);
          console.log(`       -> Got: "${top.name}" (${location})\n`);
        }
      } else {
        console.log(`[FAIL] [${test.category}] "${test.query}" -> No results found\n`);
      }
    } catch (err) {
      console.log(`[ERROR] [${test.category}] "${test.query}" -> ${err.message}\n`);
    }
  }

  console.log('========================================================================');
  console.log(`  SUMMARY: ${passed} / ${total} Tests Passed (${Math.round((passed / total) * 100)}%)`);
  console.log('========================================================================\n');
}

runTests();

/**
 * Global Universities & Institutions Dataset & Importer
 */

const { normalizeText, inferInstitutionType, generateAcronymsAndAliases } = require('../../services/institutionService');

const rawGlobalInstitutions = [
  {
    name: "Hólar University College",
    country: "Iceland",
    countryCode: "IS",
    state: "Northwest",
    city: "Hólar",
    type: "university",
    sector: "higher_education",
    source: "WIKIDATA",
    sourceId: "WIKI-Q1523183",
    website: "https://holar.is"
  },
  {
    name: "University of Akureyri",
    country: "Iceland",
    countryCode: "IS",
    state: "Northeast",
    city: "Akureyri",
    type: "university",
    sector: "higher_education",
    source: "IDSCU",
    sourceId: "IDSCU-PS-1021",
    website: "https://unak.is"
  },
  {
    name: "University of Liechtenstein",
    country: "Liechtenstein",
    countryCode: "LI",
    state: "Vaduz",
    city: "Vaduz",
    type: "university",
    sector: "higher_education",
    source: "IDSCU",
    sourceId: "IDSCU-PS-1022",
    website: "https://uni.li"
  },
  {
    name: "University of Andorra",
    country: "Andorra",
    countryCode: "AD",
    state: "Sant Julià de Lòria",
    city: "Sant Julià de Lòria",
    type: "university",
    sector: "higher_education",
    source: "IDSCU",
    sourceId: "IDSCU-PS-1023",
    website: "https://uda.ad"
  },
  {
    name: "University of Luxembourg",
    country: "Luxembourg",
    countryCode: "LU",
    state: "Esch-sur-Alzette",
    city: "Esch-sur-Alzette",
    type: "university",
    sector: "higher_education",
    source: "IDSCU",
    sourceId: "IDSCU-PS-1024",
    website: "https://uni.lu"
  },
  {
    name: "Harvard University",
    country: "United States",
    countryCode: "US",
    state: "Massachusetts",
    city: "Cambridge",
    type: "university",
    sector: "higher_education",
    source: "HIPO",
    sourceId: "HIPO-US-harvard",
    website: "https://harvard.edu"
  },
  {
    name: "University of Oxford",
    country: "United Kingdom",
    countryCode: "GB",
    state: "Oxfordshire",
    city: "Oxford",
    type: "university",
    sector: "higher_education",
    source: "HIPO",
    sourceId: "HIPO-GB-oxford",
    website: "https://ox.ac.uk"
  },
  {
    name: "University of Cambridge",
    country: "United Kingdom",
    countryCode: "GB",
    state: "Cambridgeshire",
    city: "Cambridge",
    type: "university",
    sector: "higher_education",
    source: "HIPO",
    sourceId: "HIPO-GB-cambridge",
    website: "https://cam.ac.uk"
  },
  {
    name: "Stanford University",
    country: "United States",
    countryCode: "US",
    state: "California",
    city: "Stanford",
    type: "university",
    sector: "higher_education",
    source: "HIPO",
    sourceId: "HIPO-US-stanford",
    website: "https://stanford.edu"
  },
  {
    name: "University of Toronto",
    country: "Canada",
    countryCode: "CA",
    state: "Ontario",
    city: "Toronto",
    type: "university",
    sector: "higher_education",
    source: "HIPO",
    sourceId: "HIPO-CA-toronto",
    website: "https://utoronto.ca"
  },
  {
    name: "University of Melbourne",
    country: "Australia",
    countryCode: "AU",
    state: "Victoria",
    city: "Melbourne",
    type: "university",
    sector: "higher_education",
    source: "HIPO",
    sourceId: "HIPO-AU-melbourne",
    website: "https://unimelb.edu.au"
  },
  {
    name: "National University of Singapore (NUS)",
    country: "Singapore",
    countryCode: "SG",
    state: "Singapore",
    city: "Singapore",
    type: "university",
    sector: "higher_education",
    source: "HIPO",
    sourceId: "HIPO-SG-nus",
    website: "https://nus.edu.sg"
  }
];

const importGlobalInstitutions = async (InstitutionModel) => {
  let importedCount = 0;
  let updatedCount = 0;
  let duplicateCount = 0;
  let failedCount = 0;

  for (const item of rawGlobalInstitutions) {
    try {
      const normalizedName = normalizeText(item.name);
      const meta = generateAcronymsAndAliases(item.name, item.city, item.state);

      const existing = await InstitutionModel.findOne({
        normalizedName: normalizedName,
        country: item.country
      });

      const payload = {
        id: item.sourceId || `GLOBAL-${normalizedName.replace(/\s+/g, '-').slice(0, 30)}`,
        name: item.name,
        normalizedName: normalizedName,
        aliases: meta.aliases,
        normalizedAliases: meta.normalizedAliases,
        acronyms: meta.acronyms,
        normalizedAcronyms: meta.normalizedAcronyms,
        type: item.type || inferInstitutionType(item.name),
        sector: item.sector || 'higher_education',
        country: item.country || '',
        countryCode: item.countryCode || '',
        state: item.state || '',
        city: item.city || '',
        source: item.source || 'GLOBAL_SOURCE',
        sourceId: item.sourceId || '',
        website: item.website || '',
        status: 'verified',
        lastUpdated: new Date()
      };

      if (!existing) {
        await InstitutionModel.create(payload);
        importedCount++;
      } else {
        await InstitutionModel.updateOne({ _id: existing._id }, { $set: payload });
        updatedCount++;
        duplicateCount++;
      }
    } catch (err) {
      failedCount++;
      console.error(`Failed to import ${item.name}:`, err.message);
    }
  }

  return {
    source: 'Global Directory (IDSCU / Hipo / Wikidata)',
    imported: importedCount,
    updated: updatedCount,
    duplicates: duplicateCount,
    failed: failedCount,
    totalProcessed: rawGlobalInstitutions.length
  };
};

module.exports = {
  rawGlobalInstitutions,
  importGlobalInstitutions
};

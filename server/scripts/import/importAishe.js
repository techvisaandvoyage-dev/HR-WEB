/**
 * AISHE / UGC Official Indian Institutions Dataset & Importer
 */

const { normalizeText, inferInstitutionType, generateAcronymsAndAliases } = require('../../services/institutionService');

const rawIndianInstitutions = [
  // Central Universities & Institutes of National Importance
  {
    name: "Guru Ghasidas Vishwavidyalaya",
    state: "Chhattisgarh",
    district: "Bilaspur",
    city: "Bilaspur",
    address: "Koni, Bilaspur, Chhattisgarh 495009",
    type: "university",
    sector: "higher_education",
    source: "UGC",
    sourceId: "UGC-U-0071",
    website: "https://new.ggu.ac.in",
    aliases: ["Guru Ghasidas University", "GGU", "GGV", "Bilaspur Central University"],
    acronyms: ["GGU", "GGV"]
  },
  {
    name: "Indian Institute of Technology Delhi (IIT Delhi)",
    state: "Delhi",
    district: "South Delhi",
    city: "New Delhi",
    address: "Hauz Khas, New Delhi 110016",
    type: "university",
    sector: "higher_education",
    source: "UGC",
    sourceId: "UGC-U-0101",
    website: "https://home.iitd.ac.in",
    aliases: ["IIT Delhi", "IITD"],
    acronyms: ["IITD", "IIT"]
  },
  {
    name: "University of Delhi (DU)",
    state: "Delhi",
    district: "North Delhi",
    city: "New Delhi",
    address: "Benito Juarez Marg / North Campus, New Delhi 110007",
    type: "university",
    sector: "higher_education",
    source: "UGC",
    sourceId: "UGC-U-0102",
    website: "https://du.ac.in",
    aliases: ["Delhi University", "DU Delhi"],
    acronyms: ["DU"]
  },
  {
    name: "Jawaharlal Nehru University (JNU)",
    state: "Delhi",
    district: "South West Delhi",
    city: "New Delhi",
    address: "New Mehrauli Road, New Delhi 110067",
    type: "university",
    sector: "higher_education",
    source: "UGC",
    sourceId: "UGC-U-0103",
    website: "https://jnu.ac.in",
    aliases: ["JNU Delhi"],
    acronyms: ["JNU"]
  },
  {
    name: "All India Institute of Medical Sciences (AIIMS Delhi)",
    state: "Delhi",
    district: "South Delhi",
    city: "New Delhi",
    address: "Ansari Nagar, New Delhi 110029",
    type: "institute",
    sector: "higher_education",
    source: "UGC",
    sourceId: "UGC-U-0104",
    website: "https://aiims.edu",
    aliases: ["AIIMS Delhi", "AIIMS New Delhi"],
    acronyms: ["AIIMS"]
  },
  {
    name: "Indian Institute of Technology Bombay (IIT Bombay)",
    state: "Maharashtra",
    district: "Mumbai Suburban",
    city: "Mumbai",
    address: "Powai, Mumbai, Maharashtra 400076",
    type: "university",
    sector: "higher_education",
    source: "UGC",
    sourceId: "UGC-U-0105",
    website: "https://iitb.ac.in",
    aliases: ["IIT Bombay", "IITB"],
    acronyms: ["IITB", "IIT"]
  },
  {
    name: "Indian Institute of Technology Madras (IIT Madras)",
    state: "Tamil Nadu",
    district: "Chennai",
    city: "Chennai",
    address: "Sardar Patel Road, Chennai, Tamil Nadu 600036",
    type: "university",
    sector: "higher_education",
    source: "UGC",
    sourceId: "UGC-U-0106",
    website: "https://iitm.ac.in",
    aliases: ["IIT Madras", "IITM"],
    acronyms: ["IITM", "IIT"]
  },
  {
    name: "Indian Institute of Management Ahmedabad (IIM Ahmedabad)",
    state: "Gujarat",
    district: "Ahmedabad",
    city: "Ahmedabad",
    address: "Vastrapur, Ahmedabad, Gujarat 380015",
    type: "institute",
    sector: "higher_education",
    source: "UGC",
    sourceId: "UGC-U-0107",
    website: "https://iima.ac.in",
    aliases: ["IIM Ahmedabad", "IIMA"],
    acronyms: ["IIMA", "IIM"]
  },
  {
    name: "Indian Institute of Management Bangalore (IIM Bangalore)",
    state: "Karnataka",
    district: "Bangalore Urban",
    city: "Bangalore",
    address: "Bannerghatta Road, Bangalore, Karnataka 560076",
    type: "institute",
    sector: "higher_education",
    source: "UGC",
    sourceId: "UGC-U-0108",
    website: "https://iimb.ac.in",
    aliases: ["IIM Bangalore", "IIMB"],
    acronyms: ["IIMB", "IIM"]
  },
  {
    name: "Indian Institute of Management Calcutta (IIM Calcutta)",
    state: "West Bengal",
    district: "Kolkata",
    city: "Kolkata",
    address: "Joka, Kolkata, West Bengal 700104",
    type: "institute",
    sector: "higher_education",
    source: "UGC",
    sourceId: "UGC-U-0109",
    website: "https://iimcal.ac.in",
    aliases: ["IIM Calcutta", "IIMC"],
    acronyms: ["IIMC", "IIM"]
  },
  {
    name: "Banaras Hindu University (BHU)",
    state: "Uttar Pradesh",
    district: "Varanasi",
    city: "Varanasi",
    address: "Varanasi, Uttar Pradesh 221005",
    type: "university",
    sector: "higher_education",
    source: "UGC",
    sourceId: "UGC-U-0110",
    website: "https://bhu.ac.in",
    aliases: ["BHU Varanasi"],
    acronyms: ["BHU"]
  },
  {
    name: "Rungta College of Engineering and Technology (RCET)",
    state: "Chhattisgarh",
    district: "Durg",
    city: "Bhilai",
    address: "Kohka-Kurud Road, Bhilai, Chhattisgarh 490024",
    affiliatedUniversity: "CSVTU",
    type: "college",
    sector: "higher_education",
    source: "AISHE",
    sourceId: "AISHE-C-19001",
    website: "https://rungta.ac.in",
    aliases: ["RCET Bhilai"],
    acronyms: ["RCET"]
  },

  // Nagaland Colleges (Affiliated to Nagaland University / State Govt)
  {
    name: "Yingli College",
    state: "Nagaland",
    district: "Longleng",
    city: "Longleng",
    address: "Longleng, Nagaland 798625",
    affiliatedUniversity: "Nagaland University",
    type: "college",
    sector: "higher_education",
    source: "AISHE",
    sourceId: "AISHE-C-16812",
    website: "https://yinglicollege.org"
  },
  {
    name: "Zunheboto Government College",
    state: "Nagaland",
    district: "Zunheboto",
    city: "Zunheboto",
    address: "Zunheboto, Nagaland 798620",
    affiliatedUniversity: "Nagaland University",
    type: "college",
    sector: "higher_education",
    source: "AISHE",
    sourceId: "AISHE-C-16814",
    website: "https://zgczunheboto.in"
  },
  {
    name: "Pfutsero Government College",
    state: "Nagaland",
    district: "Phek",
    city: "Pfutsero",
    address: "Pfutsero, Phek, Nagaland 797107",
    affiliatedUniversity: "Nagaland University",
    type: "college",
    sector: "higher_education",
    source: "AISHE",
    sourceId: "AISHE-C-16816",
    website: "https://pfutserocollege.edu.in"
  },
  {
    name: "Kohima Science College (Autonomous)",
    state: "Nagaland",
    district: "Kohima",
    city: "Jotsoma",
    address: "Jotsoma, Kohima, Nagaland",
    affiliatedUniversity: "Nagaland University",
    type: "college",
    sector: "higher_education",
    source: "AISHE",
    sourceId: "AISHE-C-16801"
  },
  {
    name: "Fazl Ali College",
    state: "Nagaland",
    district: "Mokokchung",
    city: "Mokokchung",
    address: "Mokokchung, Nagaland",
    affiliatedUniversity: "Nagaland University",
    type: "college",
    sector: "higher_education",
    source: "AISHE",
    sourceId: "AISHE-C-16802"
  },
  {
    name: "Dimapur Government College",
    state: "Nagaland",
    district: "Dimapur",
    city: "Dimapur",
    address: "Dimapur, Nagaland",
    affiliatedUniversity: "Nagaland University",
    type: "college",
    sector: "higher_education",
    source: "AISHE",
    sourceId: "AISHE-C-16803"
  },

  // Mizoram Colleges (Affiliated to Mizoram University / State Govt)
  {
    name: "Government Hnahthial College",
    state: "Mizoram",
    district: "Hnahthial",
    city: "Hnahthial",
    address: "Hnahthial, Mizoram 796571",
    affiliatedUniversity: "Mizoram University",
    type: "college",
    sector: "higher_education",
    source: "AISHE",
    sourceId: "AISHE-C-17012",
    website: "https://govthnahthialcollege.ac.in"
  },
  {
    name: "Government Khawzawl College",
    state: "Mizoram",
    district: "Khawzawl",
    city: "Khawzawl",
    address: "Khawzawl, Mizoram 796310",
    affiliatedUniversity: "Mizoram University",
    type: "college",
    sector: "higher_education",
    source: "AISHE",
    sourceId: "AISHE-C-17015",
    website: "https://govtkhawzawlcollege.in"
  },
  {
    name: "Government Mamit College",
    state: "Mizoram",
    district: "Mamit",
    city: "Mamit",
    address: "Mamit, Mizoram 796441",
    affiliatedUniversity: "Mizoram University",
    type: "college",
    sector: "higher_education",
    source: "AISHE",
    sourceId: "AISHE-C-17018",
    website: "https://govtmamitcollege.in"
  },
  {
    name: "Pachhunga University College",
    state: "Mizoram",
    district: "Aizawl",
    city: "Aizawl",
    address: "Aizawl, Mizoram",
    affiliatedUniversity: "Mizoram University",
    type: "college",
    sector: "higher_education",
    source: "AISHE",
    sourceId: "AISHE-C-17001"
  },
  {
    name: "Government Aizawl College",
    state: "Mizoram",
    district: "Aizawl",
    city: "Aizawl",
    address: "Aizawl, Mizoram",
    affiliatedUniversity: "Mizoram University",
    type: "college",
    sector: "higher_education",
    source: "AISHE",
    sourceId: "AISHE-C-17002"
  },
  {
    name: "Government Lunglei College",
    state: "Mizoram",
    district: "Lunglei",
    city: "Lunglei",
    address: "Lunglei, Mizoram",
    affiliatedUniversity: "Mizoram University",
    type: "college",
    sector: "higher_education",
    source: "AISHE",
    sourceId: "AISHE-C-17003"
  },

  // Meghalaya Colleges (Affiliated to NEHU / State Govt)
  {
    name: "Sohra Government College",
    state: "Meghalaya",
    district: "East Khasi Hills",
    city: "Sohra (Cherrapunjee)",
    address: "Cherrapunjee, East Khasi Hills, Meghalaya 793108",
    affiliatedUniversity: "North-Eastern Hill University (NEHU)",
    type: "college",
    sector: "higher_education",
    source: "AISHE",
    sourceId: "AISHE-C-16315",
    website: "https://sohragovtcollege.ac.in"
  },
  {
    name: "Thomas Jones Synod College",
    state: "Meghalaya",
    district: "West Jaintia Hills",
    city: "Jowai",
    address: "Iawmusiang, Jowai, West Jaintia Hills, Meghalaya 793150",
    affiliatedUniversity: "North-Eastern Hill University (NEHU)",
    type: "college",
    sector: "higher_education",
    source: "AISHE",
    sourceId: "AISHE-C-16320",
    website: "https://tjsc.ac.in"
  },
  {
    name: "St. Anthony's College, Shillong",
    state: "Meghalaya",
    district: "East Khasi Hills",
    city: "Shillong",
    address: "Bomfyle Road, Shillong, Meghalaya",
    affiliatedUniversity: "North-Eastern Hill University (NEHU)",
    type: "college",
    sector: "higher_education",
    source: "AISHE",
    sourceId: "AISHE-C-16301"
  },
  {
    name: "St. Edmund's College, Shillong",
    state: "Meghalaya",
    district: "East Khasi Hills",
    city: "Shillong",
    address: "Laitumkhrah, Shillong, Meghalaya",
    affiliatedUniversity: "North-Eastern Hill University (NEHU)",
    type: "college",
    sector: "higher_education",
    source: "AISHE",
    sourceId: "AISHE-C-16302"
  },
  {
    name: "Lady Keane College",
    state: "Meghalaya",
    district: "East Khasi Hills",
    city: "Shillong",
    address: "Cantonment, Shillong, Meghalaya",
    affiliatedUniversity: "North-Eastern Hill University (NEHU)",
    type: "college",
    sector: "higher_education",
    source: "AISHE",
    sourceId: "AISHE-C-16303"
  }
];

const importAisheInstitutions = async (InstitutionModel) => {
  let importedCount = 0;
  let updatedCount = 0;
  let duplicateCount = 0;
  let failedCount = 0;

  for (const item of rawIndianInstitutions) {
    try {
      const normalizedName = normalizeText(item.name);
      const meta = generateAcronymsAndAliases(item.name, item.city, item.state, item.aliases, item.acronyms);

      const existing = await InstitutionModel.findOne({
        normalizedName: normalizedName,
        country: 'India',
        state: item.state
      });

      const payload = {
        id: item.sourceId || `AISHE-${normalizedName.replace(/\s+/g, '-').slice(0, 30)}`,
        name: item.name,
        normalizedName: normalizedName,
        aliases: meta.aliases,
        normalizedAliases: meta.normalizedAliases,
        acronyms: meta.acronyms,
        normalizedAcronyms: meta.normalizedAcronyms,
        type: item.type || inferInstitutionType(item.name),
        sector: item.sector || 'higher_education',
        country: 'India',
        countryCode: 'IN',
        state: item.state || '',
        district: item.district || '',
        city: item.city || item.district || '',
        address: item.address || '',
        affiliatedUniversity: item.affiliatedUniversity || '',
        institutionCode: item.sourceId || '',
        source: item.source || 'AISHE',
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
    source: 'AISHE & UGC (India)',
    imported: importedCount,
    updated: updatedCount,
    duplicates: duplicateCount,
    failed: failedCount,
    totalProcessed: rawIndianInstitutions.length
  };
};

module.exports = {
  rawIndianInstitutions,
  importAisheInstitutions
};

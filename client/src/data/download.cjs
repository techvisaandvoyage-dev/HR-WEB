const fs = require('fs');
const http = require('http');

console.log("Downloading global universities with locations...");

http.get('http://universities.hipolabs.com/search', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const universities = JSON.parse(data);
      
      const collegesMap = new Map();
      
      universities.forEach(u => {
        const loc = [];
        if (u['state-province']) loc.push(u['state-province']);
        if (u.country) loc.push(u.country);
        
        const collegeObj = {
          name: u.name,
          location: loc.join(', ')
        };
        
        // Use name + location as a unique key to prevent exact duplicates, 
        // but allow same university in different locations
        const key = u.name + " | " + collegeObj.location;
        if (!collegesMap.has(key)) {
          collegesMap.set(key, collegeObj);
        }
      });
      
      // We also need to add back the manual Rungta ones since the user wanted them
      const manualColleges = [
        { name: "Rungta College of Dental Sciences and Research", location: "Bhilai, India" },
        { name: "Rungta College of Engineering and Technology", location: "Bhilai, India" },
        { name: "Rungta College of Engineering and Technology", location: "Raipur, India" },
        { name: "Rungta College of Pharmaceutical Sciences and Research", location: "Durg, India" },
        { name: "Rungta College of Pharmaceutical Sciences and Research", location: "Raipur, India" },
        { name: "Rungta College of Science and Technology (RCST)", location: "Durg, India" }
      ];
      
      manualColleges.forEach(c => {
        const key = c.name + " | " + c.location;
        collegesMap.set(key, c);
      });
      
      const allColleges = Array.from(collegesMap.values());
      
      fs.writeFileSync('./colleges.json', JSON.stringify(allColleges, null, 2));
      console.log('Successfully saved ' + allColleges.length + ' universities with locations.');
    } catch(e) {
      console.error("Error parsing data:", e);
    }
  });
}).on('error', (e) => {
  console.error("Error downloading data:", e);
});

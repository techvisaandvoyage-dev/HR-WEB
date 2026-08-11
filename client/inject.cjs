const fs = require('fs');

const profilePath = 'd:/Meraki Movies/HR website/HR Project/src/components/employee/EmployeeProfile.jsx';
const modalPath = 'd:/Meraki Movies/HR website/HR Project/src/components/employee/JobApplicationModal.jsx';

const profile = fs.readFileSync(profilePath, 'utf8');
let modal = fs.readFileSync(modalPath, 'utf8');

const eduStartStr = '<section id="education"';
const expStartStr = '<section id="experience"';

const eduStart = profile.indexOf(eduStartStr);
const eduEnd = profile.indexOf('</section>', eduStart) + 10;
let eduJsx = profile.substring(eduStart, eduEnd);
eduJsx = eduJsx.replace(/<section id="education"[^>]*>/, '<div className="space-y-6 animate-fade-in max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar pb-2">').replace(/<\/section>/, '</div>');

const expStart = profile.indexOf(expStartStr);
const expEnd = profile.indexOf('</section>', expStart) + 10;
let expJsx = profile.substring(expStart, expEnd);
expJsx = expJsx.replace(/<section id="experience"[^>]*>/, '<div className="space-y-6 animate-fade-in max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar pb-2">').replace(/<\/section>/, '</div>');

// Replace Step2Education
const step2Regex = /const Step2Education = \(\) => \{[\s\S]*?\n  \};\n\n  const Step3Experience/;
modal = modal.replace(step2Regex, 'const Step2Education = () => { return (' + eduJsx + '); };\n\n  const Step3Experience');

// Replace Step3Experience
const step3Regex = /const Step3Experience = \(\) => \{[\s\S]*?\n  \};\n\n  const Step4Professional/;
modal = modal.replace(step3Regex, 'const Step3Experience = () => { return (' + expJsx + '); };\n\n  const Step4Professional');

fs.writeFileSync(modalPath, modal);
console.log('Successfully injected!');

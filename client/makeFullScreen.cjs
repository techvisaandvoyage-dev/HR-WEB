const fs = require('fs');
const modalPath = 'd:/Meraki Movies/HR website/HR Project/src/components/employee/JobApplicationModal.jsx';
let modal = fs.readFileSync(modalPath, 'utf8');

const regex = /<div className="fixed inset-0 z-\[60\] flex items-center justify-center p-4 sm:p-6 lg:p-8">[\s\S]*?<div className="w-full md:w-\[60%\] flex flex-col h-full bg-white relative z-10 overflow-hidden">/;

const newWrapper = `<div className="fixed inset-0 z-[60] flex flex-col md:flex-row bg-white overflow-hidden">
      <div className="relative w-full h-full flex flex-col md:flex-row overflow-hidden">
        
        {/* Left Form Section */}
        <div className="w-full md:w-[60%] flex flex-col h-full bg-white relative z-10 overflow-hidden border-r border-gray-200">
          <div className="flex flex-col h-full max-w-3xl mx-auto w-full">`;

modal = modal.replace(regex, newWrapper);

modal = modal.replace(`          </div>\n        </div>\n\n        {/* Right Job Preview Section */}`, `          </div>\n          </div>\n        </div>\n\n        {/* Right Job Preview Section */}`);

fs.writeFileSync(modalPath, modal);
console.log('Made full screen!');

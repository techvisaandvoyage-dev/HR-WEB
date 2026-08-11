const fs = require('fs');
const modalPath = 'd:/Meraki Movies/HR website/HR Project/src/components/employee/JobApplicationModal.jsx';
let modal = fs.readFileSync(modalPath, 'utf8');

const fastStepsJsx = `
  // --- Fast Apply Components (Old Users) ---

  const FastStep1Experience = () => (
    <div className="space-y-6 animate-fade-in max-w-md mx-auto py-8">
      <h3 className="text-2xl font-bold text-gray-900 mb-2">Enter a job that shows relevant experience</h3>
      <p className="text-gray-500 mb-6">We share one job title with the employer to introduce you as a candidate.</p>
      
      <div className="space-y-4 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <div>
          <label className="block text-sm font-bold text-gray-900 mb-1.5">Job title</label>
          <input type="text" className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-700 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all" value={fastFormData.relevantJobTitle || ''} onChange={e => setFastFormData({...fastFormData, relevantJobTitle: e.target.value})} />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-900 mb-1.5">Company</label>
          <input type="text" className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-700 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all" value={fastFormData.relevantCompany || ''} onChange={e => setFastFormData({...fastFormData, relevantCompany: e.target.value})} />
        </div>
      </div>
    </div>
  );

  const FastStep2Resume = () => {
    const handleFileChange = (e) => {
      if (e.target.files && e.target.files[0]) {
        setFastFormData({...fastFormData, resume: e.target.files[0].name});
      }
    };
    
    return (
      <div className="space-y-6 animate-fade-in max-w-md mx-auto py-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-6">Add a resume</h3>
        
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl bg-gray-50 mb-4">
            <svg className="w-8 h-8 text-gray-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg>
            <div className="overflow-hidden">
              <p className="font-bold text-gray-900 truncate">{fastFormData.resume || formData.documents?.resume || 'No resume selected'}</p>
              <p className="text-xs text-gray-500">Uploaded today</p>
            </div>
          </div>
          
          <div className="relative border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:bg-gray-50 transition-colors cursor-pointer group">
             <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" onChange={handleFileChange} accept=".pdf,.doc,.docx" />
             <p className="text-sm font-semibold text-green-600 group-hover:text-green-700">Upload a different resume</p>
          </div>
        </div>
      </div>
    );
  };

  const FastStep3Review = () => (
    <div className="space-y-6 animate-fade-in max-w-xl mx-auto py-8 pb-4">
      <h3 className="text-2xl font-bold text-gray-900 mb-2">Review your application</h3>
      <p className="text-gray-500 mb-6">You will not be able to edit your application after you submit.</p>
      
      <div className="flex justify-between items-center mb-2">
        <h4 className="text-lg font-bold text-gray-900">Contact information</h4>
        <button type="button" className="text-green-600 font-bold hover:underline">Edit</button>
      </div>
      
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4 mb-8">
        <div>
          <p className="text-sm text-gray-500 mb-1">Full name</p>
          <p className="font-bold text-gray-900">{(formData.firstName || formData.lastName) ? \`\${formData.firstName} \${formData.lastName}\`.trim() : 'Yash Raj Singh'}</p>
        </div>
        <hr className="border-gray-100" />
        <div>
          <p className="text-sm text-gray-500 mb-1">Email</p>
          <p className="font-bold text-gray-900">{formData.email || 'sonic16t@gmail.com'}</p>
          <p className="text-xs text-gray-500 mt-1">To reduce fraud, we may hide your contact information from the employer.</p>
        </div>
        <hr className="border-gray-100" />
        <div>
          <p className="text-sm text-gray-500 mb-1">Phone number</p>
          <p className="font-bold text-gray-900">{formData.phone || '+91 93998 86418'}</p>
        </div>
        <hr className="border-gray-100" />
        <div>
          <p className="text-sm text-gray-500 mb-1">City, state/territory</p>
          <p className="font-bold text-gray-900">{formData.professionalDetails?.currentLocation || 'Champa, Chhattisgarh'}</p>
        </div>
      </div>
      
      <div className="flex justify-between items-center mb-2 mt-8">
        <h4 className="text-lg font-bold text-gray-900">Resume</h4>
        <div className="flex gap-4">
          <button type="button" className="text-green-600 font-bold hover:underline">Download</button>
          <button type="button" className="text-green-600 font-bold hover:underline">Edit</button>
        </div>
      </div>
      
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <svg className="w-6 h-6 text-gray-700 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg>
          <p className="font-bold text-green-600 truncate">{fastFormData.resume || formData.documents?.resume || 'Resume.pdf'}</p>
        </div>
      </div>
    </div>
  );
`;

// Insert the Fast components just before Step1BasicDetails
modal = modal.replace('  // --- Step Components ---', fastStepsJsx + '\n  // --- Step Components ---');

// Replace the Form Body and Footer
const formBodyRegex = /\{\/\* Form Body \*\/\}[\s\S]*?(?=<\/div>\n    <\/div>\n  \);\n\};)/;
const newFormBody = `{/* Form Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 flex flex-col">
          <form id="applicationForm" onSubmit={handleSubmit} className="flex-1">
            {isOldUser ? (
              <>
                {fastStep === 1 && <FastStep1Experience />}
                {fastStep === 2 && <FastStep2Resume />}
                {fastStep === 3 && <FastStep3Review />}
              </>
            ) : (
              <>
                {currentStep === 1 && <Step1BasicDetails />}
                {currentStep === 2 && <Step2Education />}
                {currentStep === 3 && <Step3Experience />}
                {currentStep === 4 && <Step4Professional />}
                {currentStep === 5 && <Step5Documents />}
                {currentStep === 6 && <Step6Review />}
              </>
            )}
          </form>
        </div>

        {/* Footer Actions */}
        <div className={\`p-6 border-t border-gray-100 flex items-center \${isOldUser ? 'bg-white rounded-b-3xl max-w-md mx-auto w-full justify-between' : 'bg-gray-50 rounded-b-3xl justify-between'}\`}>
          {(isOldUser ? fastStep > 1 : currentStep > 1) ? (
            <button 
              type="button" 
              onClick={handleBack} 
              className="px-6 py-2.5 rounded-full font-bold transition-all text-gray-700 bg-white border border-gray-300 hover:bg-gray-100"
            >
              Back
            </button>
          ) : (
            <div></div>
          )}
          
          {(isOldUser ? fastStep < 3 : currentStep < totalSteps) ? (
            <button 
              type="button" 
              onClick={handleNext}
              className={\`px-8 py-2.5 bg-green-600 text-white font-bold rounded-full shadow-lg shadow-green-600/30 hover:bg-green-700 hover:shadow-green-700/40 transition-all duration-300 transform hover:-translate-y-0.5 \${isOldUser ? 'w-full max-w-[200px]' : ''}\`}
            >
              {isOldUser ? 'Continue' : 'Save & Continue'}
            </button>
          ) : (
            <button 
              type="submit" 
              form="applicationForm"
              className={\`px-8 py-2.5 bg-green-600 text-white font-bold rounded-full shadow-lg shadow-green-600/30 hover:bg-green-700 hover:shadow-green-700/40 transition-all duration-300 transform hover:-translate-y-0.5 \${isOldUser ? 'w-full max-w-[240px]' : ''}\`}
            >
              Submit Application
            </button>
          )}
        </div>`;

modal = modal.replace(formBodyRegex, newFormBody);

// Also need to fix the progress bar logic for Old User
const progressRegex = /\{Math\.round\(\(currentStep \/ totalSteps\) \* 100\)\}% Completed[\s\S]*?<div style=\{\{ width: \`\$\{\(currentStep \/ totalSteps\) \* 100\}%\` \}\}/;
const newProgress = `{isOldUser ? Math.round((fastStep / 3) * 100) : Math.round((currentStep / totalSteps) * 100)}% Completed
                  </span>
                </div>
              </div>
              <div className="overflow-hidden h-2 text-xs flex rounded-full bg-gray-100">
                <div style={{ width: \`\${isOldUser ? (fastStep / 3) * 100 : (currentStep / totalSteps) * 100}%\` }}`;

modal = modal.replace(progressRegex, newProgress);

fs.writeFileSync(modalPath, modal);
console.log('Fast Apply Flow injected successfully!');

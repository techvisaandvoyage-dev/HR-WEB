const fs = require('fs');
const modalPath = 'd:/Meraki Movies/HR website/HR Project/src/components/employee/JobApplicationModal.jsx';
let modal = fs.readFileSync(modalPath, 'utf8');

const regex = /<div className="fixed inset-0 z-\[60\] flex items-center justify-center p-4">[\s\S]*?<\/div>\n    <\/div>\n  \);\n\};/g;

const newContent = `<div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-white/95" onClick={onClose}></div>
      
      {/* Modal Container */}
      <div className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl flex flex-col md:flex-row max-h-[90vh] overflow-hidden border border-gray-100">
        
        {/* Left Form Section */}
        <div className="w-full md:w-[60%] flex flex-col h-full bg-white relative z-10 overflow-hidden">
          {/* Header & Progress (Hide on submit) */}
          {!isSubmitted && (
            <div className="p-6 border-b border-gray-100 flex-shrink-0">
              <div className="flex justify-end items-center mb-6">
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors bg-gray-50 hover:bg-gray-100 p-2 rounded-full">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Progress Bar */}
              <div className="relative pt-1">
                <div className="flex mb-2 items-center justify-between">
                  <div>
                    <span className="text-xs font-bold inline-block py-1 px-3 uppercase rounded-full text-green-700 bg-green-50">
                      {isOldUser ? Math.round((fastStep / 3) * 100) : Math.round((currentStep / totalSteps) * 100)}% Completed
                    </span>
                  </div>
                </div>
                <div className="overflow-hidden h-2 text-xs flex rounded-full bg-gray-100">
                  <div style={{ width: \`\${isOldUser ? (fastStep / 3) * 100 : (currentStep / totalSteps) * 100}%\` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500 transition-all duration-500"></div>
                </div>
              </div>
            </div>
          )}

          {/* Form Body */}
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
          <div className={\`p-6 border-t border-gray-100 flex items-center bg-white flex-shrink-0 \${isOldUser ? 'justify-between' : 'justify-between'}\`}>
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
                className="px-8 py-2.5 bg-green-600 text-white font-bold rounded-full shadow-lg shadow-green-600/30 hover:bg-green-700 hover:shadow-green-700/40 transition-all duration-300 transform hover:-translate-y-0.5"
              >
                {isOldUser ? 'Continue' : 'Save & Continue'}
              </button>
            ) : (
              <button 
                type="submit" 
                form="applicationForm"
                className="px-8 py-2.5 bg-green-600 text-white font-bold rounded-full shadow-lg shadow-green-600/30 hover:bg-green-700 hover:shadow-green-700/40 transition-all duration-300 transform hover:-translate-y-0.5"
              >
                Submit Application
              </button>
            )}
          </div>
        </div>

        {/* Right Job Preview Section */}
        <div className="hidden md:flex md:w-[40%] bg-gray-50 flex-col h-full border-l border-gray-200 overflow-y-auto custom-scrollbar p-8">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-8">Job Preview</h3>
          
          <div className="flex gap-4 items-start mb-8">
            <div className="w-14 h-14 bg-white rounded-2xl shadow-sm border border-gray-200 font-black text-gray-700 flex items-center justify-center text-2xl flex-shrink-0">
              {job.companyInitial || job.company?.charAt(0) || 'C'}
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-900 mb-1.5 leading-tight">{job.title}</h2>
              <p className="text-base font-semibold text-green-700">{job.company}</p>
            </div>
          </div>

          <div className="space-y-5 mb-10 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 text-sm text-gray-700">
              <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
              </div>
              <span className="font-medium">{job.location} {job.details?.workLocation ? \`• \${job.details.workLocation}\` : ''}</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-700">
              <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              </div>
              <span className="font-bold text-gray-900">{job.salary}</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-700">
              <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
              </div>
              <span className="font-medium">{job.details?.employmentType || 'Full-time'}</span>
            </div>
          </div>

          <div className="pt-2">
            <h4 className="text-lg font-black text-gray-900 mb-3">About the role</h4>
            <p className="text-sm text-gray-600 leading-relaxed font-medium">
              {job.details?.description ? (job.details.description.length > 300 ? job.details.description.substring(0, 300) + '...' : job.details.description) : 'No description available for this role.'}
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};`;

modal = modal.replace(regex, newContent);
fs.writeFileSync(modalPath, modal);
console.log('Split layout injected!');

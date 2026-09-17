import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  MapPin, 
  Mail, 
  Phone, 
  Briefcase, 
  GraduationCap, 
  FileText, 
  Video, 
  X, 
  Calendar, 
  ExternalLink, 
  CheckCircle2, 
  Clock, 
  RefreshCw,
  Building,
  Eye,
  Award
} from 'lucide-react';

const formatMonthYear = (dateStr) => {
  if (!dateStr) return '';
  if (typeof dateStr === 'string' && dateStr.includes('-')) {
    const parts = dateStr.split('-');
    if (parts.length >= 2) {
      const monthsList = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const m = parseInt(parts[1], 10);
      if (m >= 1 && m <= 12) {
        return `${monthsList[m - 1]} ${parts[0]}`;
      }
    }
  }
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
};

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function EmployeesTab() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [search, setSearch] = useState('');
  const [experienceFilter, setExperienceFilter] = useState('All');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailEmployee, setDetailEmployee] = useState(null);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      setError(null);
      let queryParams = new URLSearchParams();
      if (search) queryParams.append('search', search);
      if (experienceFilter !== 'All') queryParams.append('experience', experienceFilter);

      const res = await fetch(`${API_URL}/api/admin/employees?${queryParams.toString()}`);
      const data = await res.json();
      if (data.success) {
        setEmployees(data.data || []);
      } else {
        setError(data.message || 'Failed to fetch employees');
      }
    } catch (err) {
      console.error('Error fetching employees:', err);
      setError('Unable to connect to server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [experienceFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchEmployees();
  };

  const handleViewEmployee = async (emp) => {
    setSelectedEmployee(emp);
    try {
      setDetailLoading(true);
      const res = await fetch(`${API_URL}/api/admin/employees/${emp._id || emp.id}`);
      const data = await res.json();
      if (data.success) {
        setDetailEmployee(data.data);
      } else {
        setDetailEmployee(emp);
      }
    } catch (err) {
      console.error('Error fetching employee detail:', err);
      setDetailEmployee(emp);
    } finally {
      setDetailLoading(false);
    }
  };

  const experienceOptions = [
    'All',
    '0 - 1 Yrs',
    '2 - 3 Yrs',
    '4 - 6 Yrs',
    '7 - 10 Yrs',
    '11 - 15 Yrs',
    '16 - 20 Yrs',
    '21 - 25 Yrs',
    '25+ yrs'
  ];

  const currentEmp = detailEmployee || selectedEmployee;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
            <Users className="w-8 h-8 text-emerald-600" />
            Registered Employees
          </h1>
          <p className="text-gray-500 mt-1">
            Browse and inspect all registered job seekers, their profile qualifications, resumes, and job application history.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-3.5 py-1.5 bg-emerald-50 text-emerald-700 font-bold rounded-xl text-sm border border-emerald-100">
            {employees.length} Candidates
          </span>
          <button
            onClick={fetchEmployees}
            disabled={loading}
            className="p-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 text-emerald-600 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="flex-1 w-full flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by candidate name, email, phone, designation, or city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-emerald-600 text-white font-semibold text-sm rounded-xl hover:bg-emerald-700 transition-colors shadow-sm shrink-0"
          >
            Search
          </button>
        </form>

        <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-600">
            <Filter className="w-4 h-4 text-gray-400" />
            <span>Experience:</span>
          </div>
          <select
            value={experienceFilter}
            onChange={(e) => setExperienceFilter(e.target.value)}
            className="px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:border-emerald-500 transition-all"
          >
            {experienceOptions.map((opt) => (
              <option key={opt} value={opt}>{opt === 'All' ? 'All Experience Levels' : opt}</option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Employees Data Table */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-gray-400 text-sm flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
            <span>Loading registered employees...</span>
          </div>
        ) : employees.length === 0 ? (
          <div className="py-20 text-center text-gray-400 text-sm">
            No employees found matching your criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/75 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  <th className="py-3.5 px-6">Candidate</th>
                  <th className="py-3.5 px-6">Contact Details</th>
                  <th className="py-3.5 px-6">Designation & Experience</th>
                  <th className="py-3.5 px-6">Location</th>
                  <th className="py-3.5 px-6 text-center">Applications</th>
                  <th className="py-3.5 px-6">Registered Date</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {employees.map((emp) => (
                  <tr key={emp._id || emp.id} className="hover:bg-emerald-50/40 transition-colors group">
                    {/* Candidate */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-800 font-bold text-sm flex items-center justify-center shrink-0">
                          {emp.avatar ? (
                            <img src={emp.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                          ) : (
                            (emp.name ? emp.name.charAt(0).toUpperCase() : 'U')
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 leading-tight">{emp.name || 'Unnamed'}</p>
                          <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            emp.isFresher 
                              ? 'bg-blue-50 text-blue-700 border border-blue-100' 
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          }`}>
                            {emp.isFresher ? 'Fresher' : 'Experienced'}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="py-4 px-6 text-xs text-gray-600 space-y-1">
                      <div className="flex items-center gap-1.5 font-medium text-gray-800">
                        <Mail className="w-3.5 h-3.5 text-gray-400" />
                        <span>{emp.email}</span>
                      </div>
                      {emp.mobile && (
                        <div className="flex items-center gap-1.5 text-gray-500">
                          <Phone className="w-3.5 h-3.5 text-gray-400" />
                          <span>{emp.mobile}</span>
                        </div>
                      )}
                    </td>

                    {/* Designation & Experience */}
                    <td className="py-4 px-6">
                      <p className="font-semibold text-gray-900 text-xs">{emp.designation || 'Not specified'}</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">{emp.totalExperience || '0 Yrs'}</p>
                    </td>

                    {/* Location */}
                    <td className="py-4 px-6 text-xs">
                      <div className="flex items-center gap-1 font-medium text-gray-800">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{emp.location || 'Not set'}</span>
                      </div>
                      {emp.preferredLocation && (
                        <p className="text-[11px] text-gray-400 mt-0.5 truncate max-w-[150px]" title={emp.preferredLocation}>
                          Pref: {emp.preferredLocation}
                        </p>
                      )}
                    </td>

                    {/* Applications */}
                    <td className="py-4 px-6 text-center">
                      <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 font-bold text-xs border border-purple-100">
                        {emp.applicationsCount || 0} applied
                      </span>
                    </td>

                    {/* Registered Date */}
                    <td className="py-4 px-6 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        <span>{new Date(emp.createdAt).toLocaleDateString()}</span>
                      </div>
                      {emp.lastLogin && (
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          Active: {new Date(emp.lastLogin).toLocaleDateString()}
                        </p>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => handleViewEmployee(emp)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white font-semibold text-xs rounded-lg transition-colors border border-emerald-200"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View Profile
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Slide-over Profile Details Drawer / Modal */}
      {selectedEmployee && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex justify-end animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-white h-full shadow-2xl overflow-y-auto flex flex-col animate-in slide-in-from-right duration-300">
            {/* Drawer Header */}
            <div className="p-6 border-b border-gray-200 bg-white sticky top-0 z-20 flex items-start justify-between shadow-xs">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white font-black text-xl flex items-center justify-center shadow-md shadow-emerald-600/20 shrink-0">
                  {currentEmp.avatar ? (
                    <img src={currentEmp.avatar} alt="" className="w-full h-full rounded-2xl object-cover" />
                  ) : (
                    (currentEmp.name ? currentEmp.name.charAt(0).toUpperCase() : 'U')
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-black text-gray-900">{currentEmp.name || 'Candidate Profile'}</h2>
                  <p className="text-xs text-gray-500 mt-0.5">{currentEmp.designation || 'Job Seeker'} • {currentEmp.totalExperience || '0 Yrs experience'}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                      {currentEmp.isFresher ? 'Fresher' : 'Experienced'}
                    </span>
                    {currentEmp.location && (
                      <span className="text-[11px] text-gray-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-emerald-600" /> {currentEmp.location}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => { setSelectedEmployee(null); setDetailEmployee(null); }}
                className="p-2 text-gray-400 hover:text-gray-700 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="p-6 space-y-6 flex-1">
              {detailLoading && (
                <div className="py-4 text-center text-xs text-emerald-600 font-medium">
                  Loading latest application history...
                </div>
              )}

              {/* Contact Information Card */}
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-3">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Contact & Account Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-gray-500 block">Email Address</span>
                    <span className="font-semibold text-gray-900 select-all">{currentEmp.email}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Mobile Number</span>
                    <span className="font-semibold text-gray-900">{currentEmp.mobile || 'Not provided'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Current Location</span>
                    <span className="font-semibold text-gray-900">{currentEmp.location || 'Not provided'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Preferred Job Location</span>
                    <span className="font-semibold text-gray-900">{currentEmp.preferredLocation || 'Anywhere in India'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Registered On</span>
                    <span className="font-semibold text-gray-900">{new Date(currentEmp.createdAt).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Last Active / Login</span>
                    <span className="font-semibold text-gray-900">
                      {currentEmp.lastLogin ? new Date(currentEmp.lastLogin).toLocaleString() : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Brief / About */}
              {currentEmp.brief && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">About / Summary</h3>
                  <p className="text-xs text-gray-700 bg-emerald-50/40 p-3.5 rounded-xl border border-emerald-100/60 leading-relaxed">
                    {currentEmp.brief}
                  </p>
                </div>
              )}

              {/* Attached Documents & Media */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Documents & Media</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Resume */}
                  <div className="p-3.5 bg-white border border-gray-200 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <FileText className="w-5 h-5 text-emerald-600" />
                      <div>
                        <p className="text-xs font-bold text-gray-900">Resume / CV</p>
                        <p className="text-[11px] text-gray-500">{currentEmp.resume ? 'Uploaded' : 'Not uploaded'}</p>
                      </div>
                    </div>
                    {currentEmp.resume && (
                      <a
                        href={currentEmp.resume}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1"
                      >
                        View <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>

                  {/* Intro Video */}
                  <div className="p-3.5 bg-white border border-gray-200 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Video className="w-5 h-5 text-purple-600" />
                      <div>
                        <p className="text-xs font-bold text-gray-900">Intro Video</p>
                        <p className="text-[11px] text-gray-500">{currentEmp.introVideo ? 'Available' : 'None'}</p>
                      </div>
                    </div>
                    {currentEmp.introVideo && (
                      <a
                        href={currentEmp.introVideo}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1"
                      >
                        Watch <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Qualifications / Education */}
              {(() => {
                const qualificationsList = Array.isArray(currentEmp.qualifications) && currentEmp.qualifications.length > 0
                  ? currentEmp.qualifications
                  : Array.isArray(currentEmp.education) && currentEmp.education.length > 0
                    ? currentEmp.education
                    : Array.isArray(currentEmp.educationDetails) && currentEmp.educationDetails.length > 0
                      ? currentEmp.educationDetails
                      : Array.isArray(currentEmp.professionalDetails?.qualifications)
                        ? currentEmp.professionalDetails.qualifications
                        : [];

                return (
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                      <GraduationCap className="w-4 h-4 text-emerald-600" />
                      Education & Qualifications ({qualificationsList.length})
                    </h3>
                    {qualificationsList.length === 0 ? (
                      <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 text-center text-xs text-gray-400">
                        No education details provided by candidate yet.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {qualificationsList.map((q, idx) => {
                          const isSchool = q.educationType === '10th' || q.educationType === '12th';
                          const title = isSchool
                            ? (q.educationType === '12th' ? 'Class XII (Senior Secondary)' : 'Class X (Secondary)')
                            : (q.course || q.degree || q.name || q.educationType || 'Higher Education');
                          const institute = isSchool
                            ? (q.board ? `${q.board} Board` : 'Board not specified')
                            : (q.university || q.institution || q.college || 'Institution not specified');

                          return (
                            <div key={idx} className="p-4 bg-white rounded-xl border border-gray-200 shadow-xs space-y-2 text-xs">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <p className="font-bold text-gray-900 text-sm">{title}</p>
                                    {q.isPrimary && (
                                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full border border-emerald-200">
                                        Primary
                                      </span>
                                    )}
                                    {q.educationType && !isSchool && (
                                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-medium rounded-full">
                                        {q.educationType}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-gray-700 font-medium mt-1 flex items-center gap-1.5">
                                    <Building className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                    {institute}
                                  </p>
                                </div>

                                {(q.percentage || q.gradingSystem) && (
                                  <div className="text-right shrink-0">
                                    <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-lg font-bold text-xs border border-emerald-100 block">
                                      {q.percentage ? `${q.percentage}%` : q.gradingSystem}
                                    </span>
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center gap-4 text-[11px] text-gray-500 pt-2 border-t border-gray-100 flex-wrap">
                                {(q.startYear || q.endYear || q.year || q.passingYear) && (
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3 text-gray-400" />
                                    {q.startYear && q.endYear ? `${q.startYear} - ${q.endYear}` : `Passing Year: ${q.endYear || q.year || q.passingYear}`}
                                  </span>
                                )}
                                {q.courseType && (
                                  <span className="flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
                                    {q.courseType}
                                  </span>
                                )}
                                {q.schoolMedium && (
                                  <span className="flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
                                    Medium: {q.schoolMedium}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Work Experience */}
              {(() => {
                const experienceList = Array.isArray(currentEmp.experience) && currentEmp.experience.length > 0
                  ? currentEmp.experience
                  : Array.isArray(currentEmp.workExperience) && currentEmp.workExperience.length > 0
                    ? currentEmp.workExperience
                    : Array.isArray(currentEmp.professionalDetails?.experience)
                      ? currentEmp.professionalDetails.experience
                      : [];

                return (
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Briefcase className="w-4 h-4 text-blue-600" />
                      Past Work Experience ({experienceList.length})
                    </h3>
                    {experienceList.length === 0 ? (
                      <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 text-center text-xs text-gray-400">
                        No work experience details provided by candidate yet.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {experienceList.map((exp, cIdx) => {
                          const companyName = exp.companyName || exp.company || 'Company';
                          const hasRoles = Array.isArray(exp.roles) && exp.roles.length > 0;
                          const rolesList = hasRoles ? exp.roles : [exp];

                          return (
                            <div key={cIdx} className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs space-y-3">
                              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xs">
                                    <Building className="w-4 h-4" />
                                  </div>
                                  <div>
                                    <h4 className="font-bold text-gray-900 text-sm">{companyName}</h4>
                                    {exp.noticePeriod && (
                                      <p className="text-[11px] text-gray-500">Notice Period: <span className="font-semibold text-gray-700">{exp.noticePeriod}</span></p>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="relative border-l-2 border-emerald-500 ml-4 space-y-4 py-1">
                                {rolesList.map((role, rIdx) => {
                                  const jobTitle = role.jobTitle || role.designation || role.role || 'Job Role';
                                  const empType = role.employmentType || role.type || 'Full-time';
                                  const isCurrent = role.currentCompany || role.currentJob || (!role.leavingDate && !role.endDate);
                                  const joinStr = role.joiningDate ? formatMonthYear(role.joiningDate) : (role.startDate ? formatMonthYear(role.startDate) : '');
                                  const leaveStr = isCurrent ? 'Present' : (role.leavingDate ? formatMonthYear(role.leavingDate) : (role.endDate ? formatMonthYear(role.endDate) : 'Present'));
                                  const dateDisplay = joinStr ? `${joinStr} - ${leaveStr}` : (role.duration || `${leaveStr}`);

                                  return (
                                    <div key={rIdx} className="relative pl-5 space-y-1">
                                      <div className={`absolute w-3 h-3 rounded-full -left-[7px] top-1 ring-4 ring-white ${isCurrent ? 'bg-emerald-500' : 'bg-gray-400'}`}></div>
                                      
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <h5 className="font-bold text-gray-900 text-xs">{jobTitle}</h5>
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-600">
                                          {empType}
                                        </span>
                                        {isCurrent && (
                                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                            Current Role
                                          </span>
                                        )}
                                      </div>

                                      <p className="text-[11px] text-gray-500 flex items-center gap-1 font-medium">
                                        <Clock className="w-3 h-3 text-gray-400" />
                                        {dateDisplay}
                                      </p>

                                      {(role.roleDescription || role.description) && (
                                        <p className="text-xs text-gray-600 leading-relaxed bg-gray-50/80 p-2.5 rounded-lg border border-gray-100 mt-2">
                                          {role.roleDescription || role.description}
                                        </p>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Job Applications History */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-purple-600" />
                    Submitted Job Applications ({currentEmp.applications?.length || 0})
                  </h3>
                </div>

                {(!currentEmp.applications || currentEmp.applications.length === 0) ? (
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 text-center text-xs text-gray-400">
                    This candidate has not applied to any job yet.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {currentEmp.applications.map((app) => (
                      <div key={app._id} className="p-3.5 bg-white border border-gray-200 rounded-xl text-xs space-y-1.5 hover:border-emerald-300 transition-colors">
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-gray-900 text-sm">{app.jobId?.title || 'Job Position'}</p>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            app.status === 'Shortlisted' ? 'bg-green-100 text-green-700' :
                            app.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                            app.status === 'Viewed' ? 'bg-amber-100 text-amber-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {app.status || 'New'}
                          </span>
                        </div>
                        <p className="text-gray-600">{app.jobId?.company || app.employerId?.companyName || 'Employer'} • {app.jobId?.location || 'Location'}</p>
                        <div className="flex items-center justify-between text-[11px] text-gray-400 pt-1 border-t border-gray-50">
                          <span>Applied on {new Date(app.createdAt).toLocaleDateString()}</span>
                          {app.jobId?.salary && <span className="font-semibold text-gray-700">{app.jobId.salary}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end">
              <button
                onClick={() => { setSelectedEmployee(null); setDetailEmployee(null); }}
                className="px-5 py-2 bg-gray-200 text-gray-800 font-semibold text-xs rounded-xl hover:bg-gray-300 transition-colors"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React from 'react';
import { IconCheck, IconLock, IconEye } from './ProfileIcons';

const ProfileSidebar = ({
  activeTab,
  onTabClick,
  formData,
  docs
}) => {
  // Check section completion status
  const isBasicComplete = Boolean(formData?.firstName && formData?.lastName && formData?.phone && formData?.location);
  const isEduComplete = Boolean(formData?.qualifications && formData.qualifications.length > 0);
  const isExpComplete = Boolean(formData?.isFresher || (formData?.experience && formData.experience.length > 0));
  const isSkillsComplete = Boolean(formData?.professionalDetails?.skills && (formData?.designation || formData?.professionalDetails?.role));
  const isDocsComplete = Boolean(formData?.documents?.resume || docs?.resume);

  const navItems = [
    { id: 'basic', label: 'Basic Details', isOk: isBasicComplete },
    { id: 'edu', label: 'Education', isOk: isEduComplete },
    { id: 'work', label: 'Work Experience', isOk: isExpComplete },
    { id: 'skills', label: 'Key Skills & Preferences', isOk: isSkillsComplete },
    { id: 'documents', label: 'Documents & Media', isOk: isDocsComplete }
  ];

  return (
    <nav className="card nav sj-card sj-nav" id="nav" aria-label="Profile sections">
      <h6>PROFILE</h6>
      {navItems.map((item) => (
        <button
          key={item.id}
          type="button"
          data-go={item.id}
          onClick={() => onTabClick(item.id)}
          className={`sj-nav-btn ${activeTab === item.id ? 'on sj-on' : ''}`}
        >
          <span className={`st sj-st ${item.isOk ? 'ok sj-ok' : 'no sj-no'}`} data-st={item.id}>
            <IconCheck className="w-3.5 h-3.5" />
          </span>
          <span>{item.label}</span>
        </button>
      ))}

      <hr />

      <h6>ACCOUNT SETTINGS</h6>
      <button
        type="button"
        onClick={() => onTabClick('security')}
        className={`sj-nav-btn ${activeTab === 'security' ? 'on sj-on' : ''}`}
      >
        <IconLock className="w-4 h-4 text-gray-500" />
        <span>Security &amp; Password</span>
      </button>

      <button
        type="button"
        onClick={() => onTabClick('privacy')}
        className={`sj-nav-btn ${activeTab === 'privacy' ? 'on sj-on' : ''}`}
      >
        <IconEye className="w-4 h-4 text-gray-500" />
        <span>Privacy Settings</span>
      </button>
    </nav>
  );
};

export default ProfileSidebar;

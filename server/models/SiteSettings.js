const mongoose = require('mongoose');

const siteSettingsSchema = new mongoose.Schema({
  hidePostedByCardGlobally: {
    type: Boolean,
    default: false, // Default is false (Turned ON / Visible)
  },
  // Candidates Live Google Sheet
  candidatesSheetId: {
    type: String,
    default: ''
  },
  candidatesSheetUrl: {
    type: String,
    default: ''
  },
  candidatesSheetLastSynced: {
    type: Date,
    default: null
  },
  // Employers Live Google Sheet
  employersSheetId: {
    type: String,
    default: ''
  },
  employersSheetUrl: {
    type: String,
    default: ''
  },
  employersSheetLastSynced: {
    type: Date,
    default: null
  },
  // Daily Job Posting Limit Controls (Applies to both Employers and Consultants)
  dailyJobLimitEnabled: {
    type: Boolean,
    default: false
  },
  maxJobsPerDay: {
    type: Number,
    default: 5
  },
  limitErrorMessage: {
    type: String,
    default: 'Daily job post limit reached ({limit} jobs/day). You can post new jobs tomorrow.'
  },
  // Automated 15-Day Database Backup
  backupEmail: {
    type: String,
    default: 'sonic16t@gmail.com'
  },
  lastBackupSentAt: {
    type: Date,
    default: null
  },
  backupFrequencyDays: {
    type: Number,
    default: 15
  },
  // Authorized Admin Emails Whitelist (Only these emails can log into the Admin portal via OTP)
  authorizedAdminEmails: {
    type: [String],
    default: [
      'yashrajsingh28359@gmail.com',
      'gauravajm@gmail.com',
      'merakimovies@gmail.com',
    ],
  },
  // SEO & Search Engine Optimization
  seo: {
    // A. General SEO
    siteName: {
      type: String,
      default: 'SahiJob'
    },
    metaTitle: {
      type: String,
      default: 'sahijob.com - Find Your Dream Job in India | Top Recruitment Portal'
    },
    titleTemplate: {
      type: String,
      default: '%title% | SahiJob'
    },
    metaDescription: {
      type: String,
      default: 'Search and apply for top jobs in IT, Sales, Marketing, and Engineering across India on sahijob.com. Connect with verified employers and get hired.'
    },
    metaKeywords: {
      type: String,
      default: 'jobs in india, freshers jobs, it jobs, marketing careers, sahijob, recruitment portal'
    },
    canonicalUrl: {
      type: String,
      default: 'https://sahijob.com'
    },
    ogImage: {
      type: String,
      default: ''
    },
    favicon: {
      type: String,
      default: '/favicon.svg'
    },
    defaultLocale: {
      type: String,
      default: 'en_IN'
    },

    // Google Sitelinks (Candidate Login/Register, Search Jobs, Employer Login, Consultant Login)
    sitelinks: {
      candidateLogin: {
        title: { type: String, default: 'Login or Register' },
        description: { type: String, default: 'Login Now & Get access to Jobs not posted publicly anywhere ...' },
        url: { type: String, default: '/?auth=candidate' }
      },
      searchJobs: {
        title: { type: String, default: 'Search Jobs' },
        description: { type: String, default: 'Search thousands of Jobs across top companies in India ...' },
        url: { type: String, default: '/?search=all' }
      },
      employerLogin: {
        title: { type: String, default: 'Employer Hiring Portal' },
        description: { type: String, default: 'Post jobs, search candidate resumes and hire top talent fast.' },
        url: { type: String, default: '/?auth=employer' }
      },
      consultantLogin: {
        title: { type: String, default: 'Consultant Login' },
        description: { type: String, default: 'Recruitment partner and consultant login to manage multiple clients.' },
        url: { type: String, default: '/?auth=consultant' }
      }
    },

    // B. Social / OpenGraph & Twitter
    ogTitle: {
      type: String,
      default: 'sahijob.com - Find Your Dream Job in India'
    },
    ogDescription: {
      type: String,
      default: 'Connect with top verified employers and fast-track your career with SahiJob.'
    },
    ogType: {
      type: String,
      default: 'website'
    },
    twitterCard: {
      type: String,
      default: 'summary_large_image'
    },
    twitterHandle: {
      type: String,
      default: '@sahijob'
    },

    // C. Indexing & Robots
    allowIndexing: {
      type: Boolean,
      default: true
    },
    robotsTxtContent: {
      type: String,
      default: `User-agent: *
Disallow: /admin
Disallow: /admin/*
Disallow: /api
Disallow: /api/*
Disallow: /employer/dashboard
Disallow: /employee/profile
Disallow: /my-jobs
Allow: /

Sitemap: https://sahijob.com/sitemap.xml`
    },
    generateSitemap: {
      type: Boolean,
      default: true
    },
    noindexSearch: {
      type: Boolean,
      default: false
    },
    noindexFilterPages: {
      type: Boolean,
      default: false
    },
    noindexAuthPages: {
      type: Boolean,
      default: true
    },
    noindexExpiredJobs: {
      type: Boolean,
      default: true
    },

    // D. Structured Data (Schema)
    orgName: {
      type: String,
      default: 'SahiJob'
    },
    orgLogo: {
      type: String,
      default: 'https://sahijob.com/logo.png'
    },
    orgUrl: {
      type: String,
      default: 'https://sahijob.com'
    },
    socialLinks: {
      facebook: { type: String, default: '' },
      instagram: { type: String, default: '' },
      linkedin: { type: String, default: '' },
      twitter: { type: String, default: '' },
      youtube: { type: String, default: '' },
      telegram: { type: String, default: '' },
      whatsapp: { type: String, default: '' }
    },
    enableWebsiteSearchAction: {
      type: Boolean,
      default: true
    },
    enableJobPostingSchema: {
      type: Boolean,
      default: true
    },

    // E. Analytics & Verification
    gaMeasurementId: {
      type: String,
      default: ''
    },
    gtmId: {
      type: String,
      default: ''
    },
    googleSiteVerification: {
      type: String,
      default: ''
    },
    bingSiteVerification: {
      type: String,
      default: ''
    },
    enableAnalytics: {
      type: Boolean,
      default: true
    },
    excludeAdmin: {
      type: Boolean,
      default: true
    },
    anonymizeIp: {
      type: Boolean,
      default: true
    },
    customHeaderScripts: {
      type: String,
      default: ''
    },
    customFooterScripts: {
      type: String,
      default: ''
    },

    // F. Page-wise SEO Templates
    templates: {
      home: {
        title: { type: String, default: 'Find Your Dream Job in India | SahiJob' },
        description: { type: String, default: 'Discover verified jobs across Top Companies in India with SahiJob.' }
      },
      jobListing: {
        title: { type: String, default: 'Latest Jobs in India | Apply Online | SahiJob' },
        description: { type: String, default: 'Browse and apply for verified job vacancies across all industries on SahiJob.' }
      },
      jobDetail: {
        title: { type: String, default: '{job_title} Job in {location} - {company} | SahiJob' },
        description: { type: String, default: 'Apply for {job_title} opening at {company} in {location}. Experience, salary & role requirements on SahiJob.' }
      },
      category: {
        title: { type: String, default: '{category} Jobs in India | SahiJob' },
        description: { type: String, default: 'Explore latest job openings and vacancies in {category} on SahiJob.' }
      },
      location: {
        title: { type: String, default: 'Jobs in {location} | Vacancies & Openings | SahiJob' },
        description: { type: String, default: 'Search verified job opportunities in {location}. Apply now on SahiJob.' }
      },
      company: {
        title: { type: String, default: 'Careers at {company} | Job Openings | SahiJob' },
        description: { type: String, default: 'View all active jobs and openings at {company} on SahiJob.' }
      },
      staticPage: {
        title: { type: String, default: '{page_title} | SahiJob' },
        description: { type: String, default: '{page_summary}' }
      }
    }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('SiteSettings', siteSettingsSchema);

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const connectDB = require('../config/db');
const Page = require('../models/Page');
const FooterConfig = require('../models/FooterConfig');

const defaultPages = [
  {
    title: 'About Us',
    slug: '/page/about-us',
    summary: 'Learn about our mission to connect talent with great careers.',
    footer: 'Company',
    status: 'Published',
    content: '<h2>About sahijob.com</h2><p>sahijob.com is dedicated to revolutionizing how talent connects with top organizations. Our platform empowers job seekers and simplifies recruitment for employers worldwide.</p>',
    metaTitle: 'About Us | sahijob.com',
    metaDescription: 'Learn about our mission to connect talent with great careers.'
  },
  {
    title: 'Careers',
    slug: '/page/careers',
    summary: 'Join our dynamic and innovative team.',
    footer: 'Company',
    status: 'Published',
    content: '<h2>Work With Us</h2><p>We are always on the lookout for passionate innovators to join our team. Explore open roles and help shape the future of work.</p>',
    metaTitle: 'Careers | sahijob.com',
    metaDescription: 'Join our dynamic and innovative team.'
  },
  {
    title: 'Job Search',
    slug: '/page/job-search',
    summary: 'Explore thousands of verified job listings.',
    footer: 'Services',
    status: 'Published',
    content: '<h2>Find Your Next Role</h2><p>Browse curated job openings across IT, Healthcare, Finance, Marketing, and more.</p>',
    metaTitle: 'Job Search | sahijob.com',
    metaDescription: 'Explore thousands of verified job listings.'
  },
  {
    title: 'Employer Solutions',
    slug: '/page/employer-solutions',
    summary: 'Post jobs and hire top talent seamlessly.',
    footer: 'Services',
    status: 'Published',
    content: '<h2>Hire Top Talent Fast</h2><p>Our employer dashboard gives you candidate tracking, advanced filters, and automated screening to streamline hiring.</p>',
    metaTitle: 'Employer Solutions | sahijob.com',
    metaDescription: 'Post jobs and hire top talent seamlessly.'
  },
  {
    title: 'Help Center',
    slug: '/page/help-center',
    summary: 'Frequently asked questions and guides.',
    footer: 'Support',
    status: 'Published',
    content: '<h2>How Can We Help?</h2><p>Find answers to common questions regarding account creation, application tracking, and employer verification.</p>',
    metaTitle: 'Help Center | sahijob.com',
    metaDescription: 'Frequently asked questions and guides.'
  },
  {
    title: 'Contact Us',
    slug: '/page/contact-us',
    summary: 'Get in touch with our support team.',
    footer: 'Support',
    status: 'Published',
    content: '<h2>Contact Our Team</h2><p>Have questions or feedback? Reach out to us at <strong>support@sahijob.com</strong> or call <strong>+1 (555) 234-5678</strong>.</p>',
    metaTitle: 'Contact Us | sahijob.com',
    metaDescription: 'Get in touch with our support team.'
  },
  {
    title: 'Privacy Policy',
    slug: '/page/privacy-policy',
    summary: 'Information about how we handle and protect your data.',
    footer: 'Legal',
    status: 'Published',
    content: '<h2>Privacy Policy</h2><p>We respect your privacy and are committed to protecting your personal data in accordance with modern security standards.</p>',
    metaTitle: 'Privacy Policy | sahijob.com',
    metaDescription: 'Information about how we handle and protect your data.'
  },
  {
    title: 'Terms of Service',
    slug: '/page/terms-of-service',
    summary: 'Terms and conditions for using our website.',
    footer: 'Legal',
    status: 'Published',
    content: '<h2>Terms of Service</h2><p>By using sahijob.com, you agree to comply with our community guidelines, accurate profile representation, and verified posting policies.</p>',
    metaTitle: 'Terms of Service | sahijob.com',
    metaDescription: 'Terms and conditions for using our website.'
  }
];

async function restoreFooterPages() {
  try {
    await connectDB();
    console.log('Connected to DB');

    const existingPages = await Page.find({});
    console.log('Existing pages in DB:', existingPages.map(p => ({ title: p.title, footer: p.footer, status: p.status })));

    for (const dp of defaultPages) {
      const found = await Page.findOne({
        $or: [
          { slug: dp.slug },
          { title: new RegExp(`^${dp.title}$`, 'i') }
        ]
      });

      if (found) {
        found.footer = dp.footer;
        found.status = 'Published';
        if (!found.content) found.content = dp.content;
        if (!found.metaTitle) found.metaTitle = dp.metaTitle;
        await found.save();
        console.log(`Updated page: ${dp.title} -> Footer Column: ${dp.footer}`);
      } else {
        await Page.create(dp);
        console.log(`Created page: ${dp.title} -> Footer Column: ${dp.footer}`);
      }
    }

    const allPublished = await Page.find({ status: 'Published' });
    console.log('Final Published pages count:', allPublished.length);

    process.exit(0);
  } catch (err) {
    console.error('Error restoring footer pages:', err);
    process.exit(1);
  }
}

restoreFooterPages();

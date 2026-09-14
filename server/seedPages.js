const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const connectDB = require('./config/db');
const Page = require('./models/Page');
const FooterConfig = require('./models/FooterConfig');

const seedPages = async () => {
  try {
    await connectDB();

    const existingCount = await Page.countDocuments();
    if (existingCount === 0) {
      const defaultPages = [
        {
          title: 'About Us',
          slug: '/page/about-us',
          summary: 'Learn about our mission to connect talent with great careers.',
          footer: 'Company',
          status: 'Published',
          content: '<h2>About sahijobs.com</h2><p>sahijobs.com is dedicated to revolutionizing how talent connects with top organizations. Our platform empowers job seekers and simplifies recruitment for employers worldwide.</p>',
          metaTitle: 'About Us | sahijobs.com',
          metaDescription: 'Learn about our mission to connect talent with great careers.'
        },
        {
          title: 'Careers',
          slug: '/page/careers',
          summary: 'Join our dynamic and innovative team.',
          footer: 'Company',
          status: 'Published',
          content: '<h2>Work With Us</h2><p>We are always on the lookout for passionate innovators to join our team. Explore open roles and help shape the future of work.</p>',
          metaTitle: 'Careers | sahijobs.com',
          metaDescription: 'Join our dynamic and innovative team.'
        },
        {
          title: 'Job Search',
          slug: '/page/job-search',
          summary: 'Explore thousands of verified job listings.',
          footer: 'Services',
          status: 'Published',
          content: '<h2>Find Your Next Role</h2><p>Browse curated job openings across IT, Healthcare, Finance, Marketing, and more.</p>',
          metaTitle: 'Job Search | sahijobs.com',
          metaDescription: 'Explore thousands of verified job listings.'
        },
        {
          title: 'Employer Solutions',
          slug: '/page/employer-solutions',
          summary: 'Post jobs and hire top talent seamlessly.',
          footer: 'Services',
          status: 'Published',
          content: '<h2>Hire Top Talent Fast</h2><p>Our employer dashboard gives you candidate tracking, advanced filters, and automated screening to streamline hiring.</p>',
          metaTitle: 'Employer Solutions | sahijobs.com',
          metaDescription: 'Post jobs and hire top talent seamlessly.'
        },
        {
          title: 'Help Center',
          slug: '/page/help-center',
          summary: 'Frequently asked questions and guides.',
          footer: 'Support',
          status: 'Published',
          content: '<h2>How Can We Help?</h2><p>Find answers to common questions regarding account creation, application tracking, and employer verification.</p>',
          metaTitle: 'Help Center | sahijobs.com',
          metaDescription: 'Frequently asked questions and guides.'
        },
        {
          title: 'Contact Us',
          slug: '/page/contact-us',
          summary: 'Get in touch with our support team.',
          footer: 'Support',
          status: 'Published',
          content: '<h2>Contact Our Team</h2><p>Have questions or feedback? Reach out to us at <strong>support@sahijobs.com</strong> or call <strong>+1 (555) 234-5678</strong>.</p>',
          metaTitle: 'Contact Us | sahijobs.com',
          metaDescription: 'Get in touch with our support team.'
        },
        {
          title: 'Privacy Policy',
          slug: '/page/privacy-policy',
          summary: 'Information about how we handle and protect your data.',
          footer: 'Legal',
          status: 'Published',
          content: '<h2>Privacy Policy</h2><p>We respect your privacy and are committed to protecting your personal data in accordance with modern security standards.</p>',
          metaTitle: 'Privacy Policy | sahijobs.com',
          metaDescription: 'Information about how we handle and protect your data.'
        },
        {
          title: 'Terms of Service',
          slug: '/page/terms-of-service',
          summary: 'Terms and conditions for using our website.',
          footer: 'Legal',
          status: 'Published',
          content: '<h2>Terms of Service</h2><p>By using sahijobs.com, you agree to comply with our community guidelines, accurate profile representation, and verified posting policies.</p>',
          metaTitle: 'Terms of Service | sahijobs.com',
          metaDescription: 'Terms and conditions for using our website.'
        }
      ];

      await Page.insertMany(defaultPages);
      console.log('Successfully seeded default pages!');
    } else {
      console.log('Pages collection already contains records.');
    }

    const configCount = await FooterConfig.countDocuments();
    if (configCount === 0) {
      await FooterConfig.create({});
      console.log('Successfully created default footer config!');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error seeding pages & config:', error);
    process.exit(1);
  }
};

seedPages();

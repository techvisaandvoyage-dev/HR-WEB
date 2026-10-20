const dns = require('dns').promises;
const mongoose = require('mongoose');

let BouncedEmail;
try {
  BouncedEmail = require('../models/BouncedEmail');
} catch (_) {}

// List of common disposable / temporary email domains (Check 2)
const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com', 'tempmail.com', '10minutemail.com', 'guerrillamail.com',
  'sharklasers.com', 'yopmail.com', 'trashmail.com', 'getairmail.com',
  'dispostable.com', 'temp-mail.org', 'fakemailgenerator.com', 'throwawaymail.com',
  'generator.email', 'tempmailo.com', 'burnermail.io', 'inboxkitten.com',
  'mytemp.email', 'dropmail.me', 'mohmal.com', 'crazymailing.com',
  'maildrop.cc', 'yopmail.fr', 'yopmail.net', 'cool.fr.nf', 'jetable.fr.nf',
  'courriel.fr.nf', 'moncourrier.fr.nf', 'monemail.fr.nf', 'monmail.fr.nf',
  'guerrillamailblock.com', 'guerrillamail.net', 'guerrillamail.org',
  'guerrillamail.biz', 'guerrillamail.de', 'spam4.me', 'grr.la', 'pokemail.net',
  'disposablemail.com', 'mailsac.com', 'nada.ltd', 'temp-mail.io', '10mail.org'
]);

// Fast-path known valid mail provider domains to prevent unnecessary DNS roundtrips
const KNOWN_VALID_DOMAINS = new Set([
  'gmail.com', 'googlemail.com', 'yahoo.com', 'yahoo.co.in', 'yahoo.co.uk',
  'outlook.com', 'hotmail.com', 'live.com', 'msn.com', 'icloud.com',
  'me.com', 'mac.com', 'zoho.com', 'zoho.in', 'proton.me', 'protonmail.com',
  'aol.com', 'rediffmail.com', 'gmx.com', 'yandex.com'
]);

/**
 * Validate standard RFC-compliant email format
 */
const validateEmailFormat = (email) => {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Please enter a valid email address.', cleanEmail: '' };
  }
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail) {
    return { valid: false, error: 'Please enter a valid email address.', cleanEmail: '' };
  }
  const rfcRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  if (!rfcRegex.test(cleanEmail)) {
    return { valid: false, error: 'Please enter a valid email address.', cleanEmail };
  }
  return { valid: true, cleanEmail };
};

/**
 * Check if the domain is a known disposable email provider
 */
const isDisposableEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  const parts = email.split('@');
  if (parts.length !== 2) return false;
  return DISPOSABLE_DOMAINS.has(parts[1].toLowerCase());
};

/**
 * Verify domain has valid DNS MX records with reachable mail servers
 */
const verifyDomainMx = async (domain) => {
  if (!domain || typeof domain !== 'string') return false;
  const cleanDomain = domain.toLowerCase().trim();
  
  if (KNOWN_VALID_DOMAINS.has(cleanDomain)) {
    return true;
  }
  
  try {
    const records = await dns.resolveMx(cleanDomain);
    if (!Array.isArray(records) || records.length === 0) return false;

    // Filter out RFC 7505 Null MX records (exchange: '' or '.') and priority 0 null hosts
    const validRecords = records.filter(r => 
      r && 
      r.exchange && 
      typeof r.exchange === 'string' && 
      r.exchange.trim() !== '' && 
      r.exchange.trim() !== '.' &&
      !(r.priority === 0 && (r.exchange.trim() === '' || r.exchange.trim() === '.'))
    );
    if (validRecords.length === 0) return false;

    // Verify at least one MX exchange host resolves to an active IP address
    for (let i = 0; i < Math.min(validRecords.length, 3); i++) {
      try {
        const host = validRecords[i].exchange;
        const addrs = await dns.resolve(host);
        if (Array.isArray(addrs) && addrs.length > 0) {
          return true;
        }
      } catch (_) {
        // try next MX record
      }
    }
    return false;
  } catch (err) {
    // ENOTFOUND, ENODATA, SERVFAIL, ETIMEOUT, etc.
    return false;
  }
};

/**
 * Verify email deliverability: format, non-disposable domain, and DNS MX records
 */
const verifyEmailDeliverability = async (email) => {
  // Check 1: Format validation (trim + lowercase, valid RFC @ + domain regex)
  const { valid, error: formatError, cleanEmail } = validateEmailFormat(email);
  if (!valid) {
    return { valid: false, message: formatError || 'Please enter a valid email address.' };
  }

  // Check 2: Disposable email check (mailinator, tempmail, guerrillamail, etc.)
  if (isDisposableEmail(cleanEmail)) {
    return { valid: false, message: 'Please enter a valid email address.' };
  }

  // Check 3: Bounce history suppression check (pehle is email par delivery fail hui thi?)
  if (BouncedEmail && mongoose.connection && mongoose.connection.readyState === 1) {
    try {
      const isBounced = await BouncedEmail.findOne({ email: cleanEmail });
      if (isBounced) {
        return { valid: false, message: 'This email address cannot receive mail. Please use another email.' };
      }
    } catch (_) {
      // Non-blocking if DB query fails
    }
  }

  // Check 4: Domain MX record check (mail servers exist, no RFC 7505 Null MX, valid IP)
  const domain = cleanEmail.split('@')[1];
  const hasMx = await verifyDomainMx(domain);
  if (!hasMx) {
    return { valid: false, message: 'Please enter a valid email address.' };
  }

  return { valid: true, cleanEmail };
};

module.exports = {
  validateEmailFormat,
  isDisposableEmail,
  verifyDomainMx,
  verifyEmailDeliverability
};

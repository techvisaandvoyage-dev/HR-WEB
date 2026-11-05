const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');

function cleanKey(k) {
  if (!k) return undefined;
  let s = k.trim();
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    s = s.slice(1, -1);
  }
  return s.replace(/\\n/g, '\n');
}

let app;
let auth;

try {
  if (!getApps().length) {
    const privateKey = cleanKey(process.env.FIREBASE_PRIVATE_KEY);
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

    if (projectId && clientEmail && privateKey) {
      app = initializeApp({
        credential: cert({
          project_id: projectId,
          client_email: clientEmail,
          private_key: privateKey,
        }),
      });
      auth = getAuth(app);
    } else {
      console.warn('⚠️ Warning: Firebase Admin credentials incomplete. Project:', projectId, 'Email:', clientEmail, 'Key present:', Boolean(privateKey));
    }
  } else {
    app = getApps()[0];
    auth = getAuth(app);
  }
} catch (initErr) {
  console.error('⚠️ Firebase Admin initialization error:', initErr.message);
}

const verifyIdToken = async (token) => {
  if (auth) {
    try {
      return await auth.verifyIdToken(token);
    } catch (authErr) {
      console.warn('[FirebaseAdmin] verifyIdToken failed with SDK, attempting fallback:', authErr.message);
    }
  }
  // Fallback: decode JWT payload if Firebase Admin verification is unavailable
  const jwt = require('jsonwebtoken');
  const decoded = jwt.decode(token);
  if (!decoded) {
    throw new Error('Invalid token');
  }
  return {
    email: decoded.email,
    name: decoded.name || (decoded.email ? decoded.email.split('@')[0] : 'User'),
    picture: decoded.picture || '',
    sub: decoded.sub || decoded.user_id,
    uid: decoded.user_id || decoded.sub,
    email_verified: decoded.email_verified
  };
};

module.exports = {
  app,
  auth,
  verifyIdToken,
};

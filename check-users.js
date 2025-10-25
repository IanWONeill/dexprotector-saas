const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function checkUsers() {
  console.log('\n=== Checking Firebase Auth Users ===');
  const authUsers = await admin.auth().listUsers();
  authUsers.users.forEach(user => {
    console.log(`\nAuth User: ${user.email}`);
    console.log(`  UID: ${user.uid}`);
    console.log(`  Email Verified: ${user.emailVerified}`);
    console.log(`  Provider: ${user.providerData.map(p => p.providerId).join(', ') || 'email/password'}`);
  });

  console.log('\n\n=== Checking Firestore User Documents ===');
  const usersSnapshot = await db.collection('users').get();
  
  if (usersSnapshot.empty) {
    console.log('⚠️  No user documents found in Firestore!');
  } else {
    usersSnapshot.forEach(doc => {
      console.log(`\nFirestore User: ${doc.id}`);
      console.log(`  Data:`, JSON.stringify(doc.data(), null, 2));
    });
  }
}

checkUsers().then(() => {
  console.log('\n✅ Check complete');
  process.exit(0);
}).catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});

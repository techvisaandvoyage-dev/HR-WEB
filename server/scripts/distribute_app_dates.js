const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: './server/.env' });

async function distributeApplications() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const db = mongoose.connection.db;
    const appsCollection = db.collection('applications');

    const allApps = await appsCollection.find({}).toArray();
    console.log(`Found ${allApps.length} applications to distribute.`);

    // Distribution across 7 days (Sep 24 - Sep 30)
    // Target distribution:
    // Sep 24: 25
    // Sep 25: 28
    // Sep 26: 30
    // Sep 27: 24
    // Sep 28: 32
    // Sep 29: 30
    // Sep 30: 32 (Total = 201)
    const dayOffsets = [6, 5, 4, 3, 2, 1, 0]; // 6 days ago (Sep 24) to 0 days ago (Sep 30)
    const distributionCounts = [25, 28, 30, 24, 32, 30, 32];

    let appIndex = 0;
    const now = new Date();

    for (let dayIdx = 0; dayIdx < dayOffsets.length; dayIdx++) {
      const offset = dayOffsets[dayIdx];
      const countForThisDay = distributionCounts[dayIdx];

      for (let k = 0; k < countForThisDay && appIndex < allApps.length; k++) {
        const app = allApps[appIndex];
        const targetDate = new Date();
        targetDate.setDate(now.getDate() - offset);
        targetDate.setHours(9 + (k % 10), (k * 7) % 60, (k * 13) % 60, 0);

        await appsCollection.updateOne(
          { _id: app._id },
          {
            $set: {
              createdAt: targetDate,
              updatedAt: targetDate,
              appliedAt: targetDate
            }
          }
        );
        appIndex++;
      }
    }

    console.log(`Successfully distributed ${appIndex} applications across the last 7 days.`);

    // Verification
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
      const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
      const cnt = await appsCollection.countDocuments({ createdAt: { $gte: dayStart, $lte: dayEnd } });
      console.log(`Day ${d.toLocaleDateString()}: ${cnt} applications`);
    }

  } catch (err) {
    console.error('Error distributing applications:', err);
  } finally {
    process.exit(0);
  }
}

distributeApplications();

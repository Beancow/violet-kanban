const admin = require('firebase-admin');
const { FieldValue } = require('firebase-admin/firestore');

// IMPORTANT: Replace with the path to your Firebase service account key JSON file
// For security, consider loading this from an environment variable.
// Example: process.env.GOOGLE_APPLICATION_CREDENTIALS = '/path/to/your/serviceAccountKey.json';
// If you set GOOGLE_APPLICATION_CREDENTIALS, admin.initializeApp() will automatically pick it up.

// Initialize Firebase Admin SDK
// If GOOGLE_APPLICATION_CREDENTIALS env var is set, you can just call admin.initializeApp();
// Otherwise, you need to provide the service account key directly:
// const serviceAccount = require('./path/to/your/serviceAccountKey.json');
// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount)
// });

admin.initializeApp();

const db = admin.firestore();

const allowedCardFields = [
    'id',
    'title',
    'description',
    'completed',
    'createdAt',
    'updatedAt',
    'boardId',
    'listId',
    'userId',
    'ownerId',
    'isDeleted',
];

async function migrateCardData() {
    console.log('Starting card data migration...');

    try {
        const orgsCollectionRef = db.collection('organizations');
        const orgsSnapshot = await orgsCollectionRef.get();

        if (orgsSnapshot.empty) {
            console.log('No organizations found. Migration complete.');
            return;
        }

        for (const orgDoc of orgsSnapshot.docs) {
            const orgId = orgDoc.id;
            console.log(`Processing organization: ${orgId}`);

            const boardsCollectionRef = db.collection('organizations').doc(orgId).collection('boards');
            const boardsSnapshot = await boardsCollectionRef.get();

            if (boardsSnapshot.empty) {
                console.log(`No boards found for organization ${orgId}.`);
                continue;
            }

            for (const boardDoc of boardsSnapshot.docs) {
                const boardId = boardDoc.id;
                console.log(`  Processing board: ${boardId} in organization ${orgId}`);

                const cardsCollectionRef = db.collection('organizations').doc(orgId).collection('boards').doc(boardId).collection('cards');
                const cardsSnapshot = await cardsCollectionRef.get();

                if (cardsSnapshot.empty) {
                    console.log(`    No cards found for board ${boardId}.`);
                    continue;
                }

                let batch = db.batch();
                let batchCount = 0;

                for (const cardDoc of cardsSnapshot.docs) {
                    const cardRef = cardDoc.ref;
                    const cardData = cardDoc.data();
                    const updateData = { listId: null }; // Always set listId to null

                    let changesMade = false;

                    for (const key in cardData) {
                        if (!allowedCardFields.includes(key) && cardData.hasOwnProperty(key)) {
                            updateData[key] = FieldValue.delete();
                            changesMade = true;
                        }
                    }

                    // Only update if there are actual changes or if listId needs to be set to null
                    if (changesMade || cardData.listId !== null) {
                        batch.update(cardRef, updateData);
                        batchCount++;
                    }

                    if (batchCount === 499) { // Firestore batch limit is 500
                        console.log('    Committing batch...');
                        await batch.commit();
                        batch = db.batch();
                        batchCount = 0;
                    }
                }

                if (batchCount > 0) {
                    console.log('    Committing final batch for board.');
                    await batch.commit();
                }
                console.log(`  Finished processing board: ${boardId}`);
            }
            console.log(`Finished processing organization: ${orgId}`);
        }

        console.log('Card data migration completed successfully.');
    } catch (error) {
        console.error('Error during card data migration:', error);
        process.exit(1); // Exit with an error code
    }
}

migrateCardData();

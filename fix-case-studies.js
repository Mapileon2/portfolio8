/**
 * fix-case-studies.js
 * 
 * This is a utility script to fix existing case studies in the database
 * by ensuring they have the correct field names for the index page.
 * 
 * Usage: node fix-case-studies.js
 */

/* eslint-disable no-unused-vars */
const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json'); // Adjust path if needed

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: "https://projectportfolio-29467-default-rtdb.firebaseio.com" // Replace with your DB URL
    });
}

const db = admin.database();
const caseStudiesRef = db.ref('caseStudies');

async function fixCaseStudies() {
    console.log('Fetching case studies...');
    try {
        const snapshot = await caseStudiesRef.once('value');
        if (!snapshot.exists()) {
            console.log('No case studies found.');
            return;
        }

        const caseStudies = snapshot.val();
        const updates = {};
        let updatedCount = 0;

        console.log(`Found ${Object.keys(caseStudies).length} case studies. Checking for missing fields...`);

        for (const caseId in caseStudies) {
            const cs = caseStudies[caseId];
            let needsUpdate = false;

            // --- Fields to harmonize ---
            const fieldsToCheck = [
                { name: 'projectTitle', derive: () => cs.sections?.hero?.headline || cs.title },
                { name: 'projectDescription', derive: () => cs.sections?.hero?.text || cs.sections?.overview?.summary },
                { name: 'projectImageUrl', derive: () => cs.sections?.gallery?.images?.[0] || cs.imageUrl },
                { name: 'projectUrl', derive: () => cs.url }, // Assuming original might have 'url'
                { name: 'id', derive: () => caseId }, // Ensure ID field exists
                { name: 'createdAt', derive: () => cs.createdAt || null }, // Ensure createdAt exists
                { name: 'updatedAt', derive: () => cs.updatedAt || null }  // Ensure updatedAt exists
            ];

            fieldsToCheck.forEach(field => {
                if (cs[field.name] === undefined || cs[field.name] === null || cs[field.name] === '') {
                    const derivedValue = field.derive();
                    if (derivedValue !== undefined && derivedValue !== null && derivedValue !== '') {
                        updates[`/${caseId}/${field.name}`] = derivedValue;
                        console.log(`  [${caseId}] Adding missing field '${field.name}': ${derivedValue}`);
                        needsUpdate = true;
                    } else if (field.name === 'projectTitle') {
                        // Special handling for title as it's critical
                        updates[`/${caseId}/${field.name}`] = 'Untitled Case Study';
                        console.log(`  [${caseId}] Adding missing field '${field.name}': 'Untitled Case Study' (Default)`);
                        needsUpdate = true;
                    }
                     else if (field.name === 'id') {
                        updates[`/${caseId}/${field.name}`] = caseId;
                        console.log(`  [${caseId}] Adding missing field 'id': ${caseId}`);
                        needsUpdate = true;
                    }
                    // Optionally add default empty strings for others if needed, e.g.:
                    // else {
                    //     updates[`/${caseId}/${field.name}`] = '';
                    //     needsUpdate = true;
                    // }
                }
            });

            // Ensure 'sections' object exists if it doesn't
            if (!cs.sections) {
                updates[`/${caseId}/sections`] = {}; // Add empty sections object
                needsUpdate = true;
                console.log(`  [${caseId}] Adding missing 'sections' object.`);
            }

            // Standardize timestamp fields
            if (!updates[`/${caseId}/createdAt`] && !cs.createdAt) {
                updates[`/${caseId}/createdAt`] = admin.database.ServerValue.TIMESTAMP;
                needsUpdate = true;
                console.log(`  [${caseId}] Setting 'createdAt' timestamp.`);
            }
            if (!updates[`/${caseId}/updatedAt`] && !cs.updatedAt) {
                updates[`/${caseId}/updatedAt`] = admin.database.ServerValue.TIMESTAMP;
                needsUpdate = true;
                console.log(`  [${caseId}] Setting 'updatedAt' timestamp.`);
            }

            if (needsUpdate) {
                updatedCount++;
            }
        }

        if (Object.keys(updates).length > 0) {
            console.log(`\nApplying updates to ${updatedCount} case studies...`);
            await db.ref().update(updates);
            console.log('Successfully updated case studies.');
        } else {
            console.log('\nNo updates needed. All checked case studies have the required fields.');
        }

    } catch (error) {
        console.error('Error fixing case studies:', error);
    } finally {
        // Optionally close the DB connection if running as a standalone script
        // db.app.delete();
        console.log('Script finished.');
    }
}

// Run the function
fixCaseStudies(); 
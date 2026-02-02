import fs from 'fs';
import path from 'path';

// Load env
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf8');
  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, ''); // strip quotes
      if (!key.startsWith('#')) {
        process.env[key] = value;
      }
    }
  });
}

import { prisma } from './lib/prisma';

async function main() {
  try {
    console.log('Starting verification...');
    
    // Test count
    const count = await prisma.aiUsage.count();
    console.log('Current total usage records:', count);

    const testId = 'verify-' + Math.floor(Math.random() * 10000);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    console.log(`Creating record for ${testId}...`);
    await prisma.aiUsage.create({
      data: {
        userId: testId,
        date: today,
        count: 1
      }
    });

    const record = await prisma.aiUsage.findUnique({
      where: {
        userId_date: {
          userId: testId,
          date: today
        }
      }
    });

    if (record && record.count === 1) {
       console.log('SUCCESS: Record created and retrieved.');
    } else {
       console.error('FAILURE: Record mismatch.');
       process.exit(1);
    }
  } catch (err) {
    console.error('Error during verification:', err);
    process.exit(1);
  } finally {
      await prisma.$disconnect();
  }
}

main();

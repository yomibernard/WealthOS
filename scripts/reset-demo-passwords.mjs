/**
 * Reset demo account passwords to WealthOSdemo1! without wiping the DB.
 * Usage: node scripts/reset-demo-passwords.mjs
 */
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const DEMO_PASSWORD = "WealthOSdemo1!";
const DEMO_EMAILS = [
  "yomi@demo.wealthos.ng",
  "amaka@demo.wealthos.ng",
  "chioma@demo.wealthos.ng",
  "adviser@demo.wealthos.ng",
  "admin@demo.wealthos.ng",
  "checker@demo.wealthos.ng",
];

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  let updated = 0;
  for (const email of DEMO_EMAILS) {
    const res = await prisma.user.updateMany({
      where: { email },
      data: { passwordHash },
    });
    updated += res.count;
  }
  console.log(`Reset ${updated} demo account password(s) to the documented demo password.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

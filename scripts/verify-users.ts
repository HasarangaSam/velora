import "dotenv/config";
import { prisma } from "../src/lib/db/prisma";

async function main() {
  const updated = await prisma.user.updateMany({
    where: { emailVerified: null },
    data: { emailVerified: new Date() },
  });
  console.log("Updated unverified users count:", updated.count);

  const users = await prisma.user.findMany({
    select: { email: true, emailVerified: true, role: true },
  });
  console.log("Current users in database:", JSON.stringify(users, null, 2));
}

main()
  .catch(console.error)
  .finally(() => process.exit(0));

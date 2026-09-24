import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import AddressesManager from "@/components/account/AddressesManager";
import { ArrowLeft } from "lucide-react";

export default async function CustomerAddressesPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/account/addresses");
  }

  const addresses = await prisma.address.findMany({
    where: { userId: session.user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });

  return (
    <main className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <Link
            href="/account"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition mb-2"
          >
            <ArrowLeft size={14} /> Back to account
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Address Book
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Save delivery locations for quick, smooth checkout.
          </p>
        </div>

        <AddressesManager initialAddresses={addresses} />
      </div>
    </main>
  );
}

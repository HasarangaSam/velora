import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import ProfileManager from "@/components/account/ProfileManager";

export default async function AccountProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/account/profile");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, password: true },
  });
  if (!user) notFound();

  return (
    <main className="min-h-screen bg-[#faf9f6] px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-4xl">
        <Link href="/account" className="inline-flex items-center gap-2 text-sm text-stone-500 transition hover:text-stone-950">
          <ArrowLeft className="h-4 w-4" /> Back to account
        </Link>
        <div className="mb-7 mt-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Your account</p>
          <h1 className="mt-2 text-3xl font-medium tracking-tight text-stone-950">Profile & security</h1>
          <p className="mt-2 text-sm text-stone-600">Manage your personal details and sign-in settings.</p>
        </div>
        <ProfileManager profile={{ name: user.name, email: user.email, hasPassword: Boolean(user.password) }} />
      </div>
    </main>
  );
}

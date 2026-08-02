import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import LoginCard from "@/components/auth/LoginCard";
import GoldBranch from "@/components/GoldBranch";
import { authOptions } from "@/lib/auth/options";

const getSafeCallbackUrl = (callbackUrl?: string) =>
  callbackUrl?.startsWith("/admin") && !callbackUrl.startsWith("//") ? callbackUrl : "/admin";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const [session, params] = await Promise.all([getServerSession(authOptions), searchParams]);
  const callbackUrl = getSafeCallbackUrl(params.callbackUrl);

  if (session?.user?.sessionExpiresAt) {
    redirect(callbackUrl);
  }

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#07140f] p-6 text-white">
      <GoldBranch className="-right-20 -top-16 opacity-10" />
      <GoldBranch rotate className="-bottom-24 -left-20 opacity-10" />
      <div className="relative"><LoginCard callbackUrl={callbackUrl} error={params.error} /></div>
    </main>
  );
}

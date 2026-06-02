import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import PortalLoginForm from "./PortalLoginForm";

export default async function PortalLoginPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  const church = await prisma.church.findUnique({
    where: { slug }
  });

  if (!church) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-14 h-14 bg-zinc-900 rounded-2xl flex items-center justify-center shadow-lg transform -rotate-6">
            <span className="text-white font-extrabold text-2xl tracking-tighter block transform rotate-6">
              {church.name.substring(0, 2).toUpperCase()}
            </span>
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-zinc-900 tracking-tight">
          Portal {church.name}
        </h2>
        <p className="mt-2 text-center text-sm text-zinc-600 font-medium">
          Masuk ke dashboard manajemen gereja
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md animate-fade-in-up">
        <div className="bg-white py-8 px-4 shadow-xl shadow-zinc-200/50 sm:rounded-3xl sm:px-10 border border-zinc-100">
          <PortalLoginForm slug={slug} />
        </div>
        
        <p className="mt-8 text-center text-xs text-zinc-500 font-medium">
          Diberdayakan oleh Yesh CMS
        </p>
      </div>
    </div>
  );
}

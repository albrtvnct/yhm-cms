import { verifyHadirToken } from "@/app/actions/hadir";
import HadirClientForm from "./HadirClientForm";

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function HadirCheckinPage({ params }: PageProps) {
  const { token } = await params;
  
  const res = await verifyHadirToken(token);

  if (!res.success || !res.data) {
    return (
      <div className="bg-gradient-to-br from-zinc-50 to-zinc-100 min-h-screen flex items-center justify-center p-4 font-sans">
        <div className="w-full max-w-md bg-white rounded-3xl border border-zinc-200/60 p-8 shadow-xl text-center">
          <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-5 border border-rose-100">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-zinc-900 font-extrabold text-xl">Verifikasi Gagal</h3>
          <p className="text-zinc-500 text-sm mt-2 leading-relaxed">
            {res.error || "Token absensi tidak valid atau telah kedaluwarsa."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-zinc-50 to-zinc-100 min-h-screen flex items-center justify-center p-4 font-sans">
      <HadirClientForm sessionData={res.data} />
    </div>
  );
}

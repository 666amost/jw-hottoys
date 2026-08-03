import { ShieldCheck } from "@phosphor-icons/react/dist/ssr";
import { EmailLoginForm } from "@/components/auth/email-login-form";
import { GoogleLoginButton } from "@/components/auth/google-login-button";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const safeNext = next?.startsWith("/") && !next.startsWith("//") ? next : "/account";

  return (
    <section className="container-shell py-16 sm:py-24">
      <div className="surface mx-auto max-w-md p-7 sm:p-10">
        <p className="eyebrow">Masuk akun</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight">Masuk untuk checkout</h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          Katalog dan keranjang dapat digunakan tanpa akun. Login baru diperlukan untuk
          menyimpan alamat dan melanjutkan pembayaran.
        </p>
        <div className="mt-8">
          <EmailLoginForm next={safeNext} />
        </div>
        <div className="my-6 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
          <span className="h-px flex-1 bg-slate-200" />
          atau
          <span className="h-px flex-1 bg-slate-200" />
        </div>
        <div>
          <GoogleLoginButton next={safeNext} />
        </div>
        <p className="mt-6 flex items-start gap-2 text-xs leading-5 text-slate-500">
          <ShieldCheck size={17} className="mt-0.5 shrink-0 text-emerald-600" />
          Kami hanya menggunakan nama, email, dan foto profil dari Google. Pembayaran tetap
          dikonfirmasi oleh webhook QRIS.
        </p>
      </div>
    </section>
  );
}

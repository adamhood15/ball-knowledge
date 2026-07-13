import { signIn } from "@/auth";
import { SignInPanel } from "@/components/auth/SignInPanel";

export default function SignInPage() {
  async function signInWithGoogle() {
    "use server";
    await signIn("google", { redirectTo: "/dashboard" });
  }

  async function signInWithEmail(formData: FormData) {
    "use server";
    await signIn("nodemailer", { ...Object.fromEntries(formData), redirectTo: "/dashboard" });
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-16">
      <h2 className="mb-8 font-display text-2xl text-body-text">Sign in</h2>
      <SignInPanel onGoogleSignIn={signInWithGoogle} onEmailSignIn={signInWithEmail} />
    </div>
  );
}

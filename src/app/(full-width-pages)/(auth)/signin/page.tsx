import SignInForm from "@/components/auth/SignInForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In | AI Model Service",
  description: "Sign in to your AI Model Service account",
};

export default function SignIn() {
  return <SignInForm />;
}


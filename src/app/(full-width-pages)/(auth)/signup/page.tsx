import SignUpForm from "@/components/auth/SignUpForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up | AI Model Service",
  description: "Create your AI Model Service account",
};

export default function SignUp() {
  return <SignUpForm />;
}


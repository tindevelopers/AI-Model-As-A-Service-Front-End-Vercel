import { Outfit } from "next/font/google";
import "./globals.css";
import "swiper/swiper-bundle.css";
 
import { SidebarProvider } from "@/context/SidebarContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider } from "@/context/AuthContext";
import { ErrorDebugPanel } from "@/components/debug/ErrorDebugPanel";
import { EnvironmentValidator } from "@/components/debug/EnvironmentValidator";
import { SessionDebugPanel } from "@/components/debug/SessionDebugPanel";

const outfit = Outfit({
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${outfit.className} dark:bg-gray-900`}>
        <AuthProvider>
          <ThemeProvider>
            <SidebarProvider>
                     {children}
                     <EnvironmentValidator />
                     <ErrorDebugPanel />
                     <SessionDebugPanel />
            </SidebarProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

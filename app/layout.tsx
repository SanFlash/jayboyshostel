import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jay Boys Hostel | Vinoba Nagar, Indore",
  description: "Digital hostel admissions, rooms, payments, complaints and resident management."
};

export default function RootLayout({ children }: Readonly<{children: React.ReactNode}>) {
  return <html lang="en"><body>{children}</body></html>;
}
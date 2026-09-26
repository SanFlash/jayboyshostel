import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {title:{default:"Jay Boys Hostel — Vinoba Nagar, Indore",template:"%s | Jay Boys Hostel"},description:"A modern digital hostel platform for admissions, rooms, residents, billing and support.",metadataBase:new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000")};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}

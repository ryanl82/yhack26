import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Roamly",
  description: "A personal travel planner for flights, stays, activities, and mapped itineraries."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

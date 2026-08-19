import type { Metadata } from "next";
import { ApplicationsClient } from "@/components/join/ApplicationsClient";

export const metadata: Metadata = { title: "Venue applications" };

export default function ApplicationsPage() {
  return <ApplicationsClient />;
}

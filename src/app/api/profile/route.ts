import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = 'force-dynamic';

// GET company profile
export async function GET() {
  try {
    // Get the first (and should be only) company profile
    const profile = await db.companyProfile.findFirst();

    if (!profile) {
      // Return default empty profile
      return NextResponse.json({
        companyName: "",
        companyLogo: null,
        companyWebsite: null,
        industry: null,
        description: null,
        brandVoice: null,
        primaryColor: null,
        secondaryColor: null,
        contactEmail: null,
        contactPhone: null,
        address: null,
        defaultSignature: null,
        defaultFromName: null,
        defaultFromEmail: null,
      });
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error("Error fetching company profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch company profile" },
      { status: 500 }
    );
  }
}

// POST/PUT - Create or update company profile
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // Check if profile exists
    const existing = await db.companyProfile.findFirst();

    let profile;
    if (existing) {
      // Update existing profile
      profile = await db.companyProfile.update({
        where: { id: existing.id },
        data: {
          companyName: data.companyName,
          companyLogo: data.companyLogo,
          companyWebsite: data.companyWebsite,
          industry: data.industry,
          description: data.description,
          brandVoice: data.brandVoice,
          primaryColor: data.primaryColor,
          secondaryColor: data.secondaryColor,
          contactEmail: data.contactEmail,
          contactPhone: data.contactPhone,
          address: data.address,
          defaultSignature: data.defaultSignature,
          defaultFromName: data.defaultFromName,
          defaultFromEmail: data.defaultFromEmail,
        },
      });
    } else {
      // Create new profile
      profile = await db.companyProfile.create({
        data: {
          companyName: data.companyName || "My Company",
          companyLogo: data.companyLogo,
          companyWebsite: data.companyWebsite,
          industry: data.industry,
          description: data.description,
          brandVoice: data.brandVoice,
          primaryColor: data.primaryColor,
          secondaryColor: data.secondaryColor,
          contactEmail: data.contactEmail,
          contactPhone: data.contactPhone,
          address: data.address,
          defaultSignature: data.defaultSignature,
          defaultFromName: data.defaultFromName,
          defaultFromEmail: data.defaultFromEmail,
        },
      });
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error("Error saving company profile:", error);
    return NextResponse.json(
      { error: "Failed to save company profile" },
      { status: 500 }
    );
  }
}

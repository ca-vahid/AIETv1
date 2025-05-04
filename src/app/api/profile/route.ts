export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { getDoc, doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/firebase";
import { getAuth } from "firebase-admin/auth";
import { adminApp } from "@/lib/firebase/admin";

// Define the UserProfile interface
export interface UserProfile {
  uid: string;
  name: string;
  givenName?: string;
  surname?: string;
  email: string;
  jobTitle?: string;
  department?: string;
  officeLocation?: string;
  mobilePhone?: string;
  businessPhone?: string;
  preferredLanguage?: string;
  employeeId?: string;
  jobClass?: string;
  city?: string;
  country?: string;
  state?: string;
  postalCode?: string;
  streetAddress?: string;
  photoUrl?: string;
  aboutMe?: string;
  interests?: string;
  responsibilities?: string;
  skills?: string;
  updatedAt: string;
}

/**
 * GET /api/profile - Gets user profile from Firestore or creates one based on Firebase Auth data
 */
export async function GET(req: NextRequest) {
  try {
    console.log('[API] /api/profile GET called. Headers:', Object.fromEntries(req.headers.entries()));
    // Get the Firebase ID token from the authorization header
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Missing authorization header" },
        { status: 401 }
      );
    }

    const idToken = authHeader.split("Bearer ")[1];
    
    // Verify the ID token
    const auth = getAuth(adminApp);
    const decodedToken = await auth.verifyIdToken(idToken);
    console.log('[Profile API] Decoded Firebase token:', decodedToken);
    const uid = decodedToken.uid;
    
    // Check if profile exists in Firestore
    const userDocRef = doc(db, "users", uid);
    const userDoc = await getDoc(userDocRef);
    
    let userProfile: UserProfile;
    
    if (userDoc.exists()) {
      // Return existing profile
      userProfile = userDoc.data() as UserProfile;
    } else {
      // Create a new profile from Firebase Auth data
      userProfile = {
        uid,
        name: decodedToken.name || "",
        email: decodedToken.email || "",
        updatedAt: new Date().toISOString()
      };
      
      // Save to Firestore
      await setDoc(userDocRef, userProfile);
    }
    
    return NextResponse.json(userProfile);
  } catch (error) {
    console.error('[API] Profile API error:', error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/profile - Updates user profile in Firestore
 */
export async function PUT(req: NextRequest) {
  try {
    console.log('[API] /api/profile PUT called. Headers:', Object.fromEntries(req.headers.entries()));
    // Get the Firebase ID token from the authorization header
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Missing authorization header" },
        { status: 401 }
      );
    }

    const idToken = authHeader.split("Bearer ")[1];
    
    // Verify the ID token
    const auth = getAuth(adminApp);
    const decodedToken = await auth.verifyIdToken(idToken);
    console.log('[Profile API] Decoded Firebase token:', decodedToken);
    const uid = decodedToken.uid;

    // Get request body with profile updates
    const updates = await req.json();
    
    // Get reference to user document
    const userDocRef = doc(db, "users", uid);
    
    // Get existing profile
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }
    
    // Update only allowed fields
    const allowedFields = [
      "jobTitle", "department", "officeLocation", 
      "mobilePhone", "businessPhone", "preferredLanguage",
      "city", "country", "state", "postalCode", "streetAddress",
      "photoUrl", "aboutMe", "interests", "responsibilities", "skills"
    ];
    
    const filteredUpdates = Object.entries(updates)
      .filter(([key]) => allowedFields.includes(key))
      .reduce((obj, [key, value]) => ({
        ...obj,
        [key]: value
      }), {});
    
    // Add updatedAt timestamp
    const finalUpdates = {
      ...filteredUpdates,
      updatedAt: new Date().toISOString()
    };
    
    // Update Firestore
    await setDoc(userDocRef, finalUpdates, { merge: true });
    
    // Return updated profile
    const updatedDoc = await getDoc(userDocRef);
    
    return NextResponse.json(updatedDoc.data());
  } catch (error) {
    console.error('[API] Profile update error:', error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
} 
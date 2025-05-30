export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { collection, query, orderBy, getDocs, limit } from "firebase/firestore";
import { db } from "@/lib/firebase/firebase";
import { getAuth } from 'firebase-admin/auth';
import { adminApp } from '@/lib/firebase/admin';

/**
 * GET /api/admin/submissions - Fetches all submissions for admin review
 */
export async function GET(req: NextRequest) {
  try {
    // Check admin password
    const adminPassword = req.headers.get("x-admin-password");
    if (adminPassword !== 'i-am-admin') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Fetch all requests from all users
    const requestsRef = collection(db, 'requests');
    const requestsQuery = query(
      requestsRef,
      orderBy("updatedAt", "desc"),
      limit(100) // Limit to 100 most recent submissions
    );
    
    const requestResults = await getDocs(requestsQuery);
    
    // Process submitted requests with user info
    const submissions = await Promise.all(
      requestResults.docs.map(async (doc) => {
        const data = doc.data();
        
        // Skip incomplete requests
        if (!data.request || !data.request.processDescription) {
          return null;
        }
        
        // Try to get user info
        let userEmail = '';
        let userName = '';
        
        try {
          if (data.userId) {
            const auth = getAuth(adminApp);
            const userRecord = await auth.getUser(data.userId);
            userEmail = userRecord.email || '';
            userName = userRecord.displayName || '';
          }
        } catch (err) {
          console.error('Error fetching user info:', err);
        }
        
        return {
          id: doc.id,
          userId: data.userId,
          userEmail,
          userName,
          title: data.title || data.request.processDescription || "No title",
          status: data.status || 'new',
          shared: data.shared ?? false,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          request: {
            processDescription: data.request.processDescription,
            painPoints: data.request.painPoints,
            tools: data.request.tools,
            roles: data.request.roles,
            impactScore: data.request.impactScore,
          },
          assignedTo: data.assignedTo,
          complexity: data.complexity || data.classification?.complexity,
        };
      })
    );
    
    // Filter out null values
    const validSubmissions = submissions.filter(sub => sub !== null);
    
    return NextResponse.json({ 
      submissions: validSubmissions,
      total: validSubmissions.length
    });
  } catch (error) {
    console.error('Error fetching admin submissions:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
} 
import { NextRequest, NextResponse } from "next/server";
import { collection, query, where, orderBy, limit, startAfter, getDocs, getDoc, doc, DocumentSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/firebase";
import { getAuth } from 'firebase-admin/auth';
import { adminApp } from '@/lib/firebase/admin';
import { FinalRequest } from "@/lib/types/conversation";

// Interface for gallery items
interface GalleryItem {
  id: string;
  title: string;
  category: string;
  status: string;
  complexity: string;
  description: string;
  painPoints: string[];
  frequency: string;
  durationMinutes: number;
  peopleInvolved: number;
  hoursSavedPerWeek: number;
  tools: string[];
  roles: string[];
  impactNarrative: string;
  createdAt: number;
  updatedAt: number;
  upVotes: number;
  commentsCount: number;
  // User profile data
  user: {
    name: string;
    email: string;
    jobTitle?: string;
    department?: string;
    officeLocation?: string;
    photoUrl?: string;
  };
}

// Cache for user profiles to avoid repeated API calls
const userProfileCache = new Map<string, any>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch user profile from Firestore users collection (contains complete Entra ID data)
 */
async function fetchUserProfile(userId: string) {
  // Check cache first
  const cached = userProfileCache.get(userId);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.profile;
  }

  try {
    // First try to get complete profile from Firestore users collection
    const userDoc = await getDoc(doc(db, 'users', userId));
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      const profile = {
        name: userData.name || 'Unknown User',
        email: userData.email || '',
        jobTitle: userData.jobTitle || '',
        department: userData.department || '',
        officeLocation: userData.officeLocation || userData.city || '',
        photoUrl: userData.photoUrl || '',
      };

      // Cache the result
      userProfileCache.set(userId, {
        profile,
        timestamp: Date.now()
      });

      return profile;
    }
    
    // Fallback to Firebase Admin Auth if no Firestore profile
    const auth = getAuth(adminApp);
    const userRecord = await auth.getUser(userId);
    
    const profile = {
      name: userRecord.displayName || userRecord.email?.split('@')[0] || 'Unknown User',
      email: userRecord.email || '',
      jobTitle: '',
      department: '',
      officeLocation: '',
      photoUrl: userRecord.photoURL || '',
    };

    // Cache the result
    userProfileCache.set(userId, {
      profile,
      timestamp: Date.now()
    });

    return profile;
  } catch (error) {
    console.error(`Error fetching user profile for ${userId}:`, error);
    return {
      name: 'Unknown User',
      email: '',
      jobTitle: '',
      department: '',
      officeLocation: '',
      photoUrl: '',
    };
  }
}

/**
 * GET /api/gallery - Fetches public ideas for the gallery
 * Query params:
 * - page: for pagination (default: 0)
 * - limit: items per page (default: 20, max: 50)
 * - sortBy: 'recent' | 'popular' (default: 'recent')
 * - status: filter by status
 * - category: filter by category
 * - search: keyword search
 */
export async function GET(req: NextRequest) {
  try {
    // Get the Firebase ID token from the authorization header
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing authorization header" }, { status: 401 });
    }

    const idToken = authHeader.split("Bearer ")[1];
    
    // Verify the ID token
    const auth = getAuth(adminApp);
    const decodedToken = await auth.verifyIdToken(idToken);

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const pageStr = searchParams.get('page') || '0';
    const limitStr = searchParams.get('limit') || '20';
    const sortBy = searchParams.get('sortBy') || 'recent';
    const statusFilter = searchParams.get('status');
    const categoryFilter = searchParams.get('category');
    const searchQuery = searchParams.get('search');
    const lastDocId = searchParams.get('lastDocId'); // For cursor-based pagination

    const page = Math.max(0, parseInt(pageStr));
    const pageLimit = Math.min(1000, Math.max(1, parseInt(limitStr))); // Increased limit to 1000 to load all submissions

    console.log(`[Gallery API] Fetching ${pageLimit} items for user ${decodedToken.uid}`);



    // Build Firestore query
    let firestoreQuery = query(
      collection(db, 'requests'),
      where('shared', '==', true), // Only public ideas
    );

    // Add status filter if provided
    if (statusFilter && statusFilter !== 'all') {
      firestoreQuery = query(firestoreQuery, where('status', '==', statusFilter));
    }

    // Add category filter if provided
    if (categoryFilter && categoryFilter !== 'all') {
      firestoreQuery = query(firestoreQuery, where('request.category', '==', categoryFilter));
    }

    // Add sorting
    if (sortBy === 'popular') {
      firestoreQuery = query(firestoreQuery, orderBy('upVotes', 'desc'), orderBy('createdAt', 'desc'));
    } else {
      firestoreQuery = query(firestoreQuery, orderBy('createdAt', 'desc'));
    }

    // Add pagination
    firestoreQuery = query(firestoreQuery, limit(pageLimit));

    // Execute query
    const snapshot = await getDocs(firestoreQuery);
    const allRequests = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as (FinalRequest & { id: string })[];

    // Filter out low-quality submissions that shouldn't appear in gallery
    const requests = allRequests.filter(req => {
      // Must have a meaningful title (not just "Automation Request")
      const hasGoodTitle = req.title && 
        req.title.trim() !== '' && 
        req.title !== 'Automation Request' && 
        req.title !== 'Untitled Idea';
      
      // Must have some description content
      const hasDescription = (req.request?.processSummary && req.request.processSummary.trim() !== '') ||
                           (req.request?.processDescription && req.request.processDescription.trim() !== '');
      
      // Must have basic request data
      const hasBasicData = req.request && req.userId;
      
      return hasGoodTitle && hasDescription && hasBasicData;
    });

    console.log(`[Gallery API] Returning ${requests.length} quality submissions`);
    


    // Filter by search query if provided (client-side for now)
    let filteredRequests = requests;
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      filteredRequests = requests.filter(req => 
        req.title?.toLowerCase().includes(searchLower) ||
        req.request?.processDescription?.toLowerCase().includes(searchLower) ||
        req.request?.painPoints?.some(point => point.toLowerCase().includes(searchLower)) ||
        req.request?.category?.toLowerCase().includes(searchLower)
      );
    }

    // Fetch user profiles in parallel for better performance
    const userIds = Array.from(new Set(filteredRequests.map(req => req.userId)));
    const userProfilePromises = userIds.map(userId => 
      fetchUserProfile(userId).then(profile => ({ userId, profile }))
    );
    
    const userProfiles = await Promise.all(userProfilePromises);
    const userProfileMap = new Map(userProfiles.map(({ userId, profile }) => [userId, profile]));

    // Transform to gallery items
    const galleryItems: GalleryItem[] = filteredRequests.map(req => ({
      id: req.id,
      title: req.title || 'Untitled Idea',
      category: req.request?.category || 'Other',
      status: req.status,
      complexity: req.complexity || 'medium',
      description: req.request?.processSummary || req.request?.processDescription || '',
      painPoints: req.request?.painPoints || [],
      frequency: req.request?.frequency || '',
      durationMinutes: req.request?.durationMinutes || 0,
      peopleInvolved: req.request?.peopleInvolved || 0,
      hoursSavedPerWeek: req.request?.hoursSavedPerWeek || 0,
      tools: req.request?.tools || [],
      roles: req.request?.roles || [],
      impactNarrative: req.request?.impactNarrative || '',
      createdAt: req.createdAt,
      updatedAt: req.updatedAt,
      upVotes: req.upVotes || 0,
      commentsCount: req.commentsCount || 0,
      user: userProfileMap.get(req.userId) || {
        name: 'Unknown User',
        email: '',
        jobTitle: '',
        department: '',
        officeLocation: '',
        photoUrl: '',
      }
    }));

    // Get available filter options for the frontend
    const availableCategories = Array.from(new Set(requests.map(req => req.request?.category).filter(Boolean)));
    const availableStatuses = Array.from(new Set(requests.map(req => req.status)));

    const response = {
      items: galleryItems,
      pagination: {
        page,
        limit: pageLimit,
        hasMore: galleryItems.length === pageLimit, // If we got full page, there might be more
        lastDocId: snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1].id : null,
        total: galleryItems.length // Actual returned count after filtering
      },
      filters: {
        categories: availableCategories.sort(),
        statuses: availableStatuses.sort()
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching gallery items:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
} 
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/firebase";

/**
 * PUT /api/admin/submissions/[id] - Updates a submission
 */
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check admin password
    const adminPassword = req.headers.get("x-admin-password");
    if (adminPassword !== 'i-am-admin') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const body = await req.json();
    const submissionId = params.id;
    
    // Validate submission exists
    const submissionRef = doc(db, 'requests', submissionId);
    const submissionDoc = await getDoc(submissionRef);
    
    if (!submissionDoc.exists()) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }
    
    // Prepare update data
    const updateData: any = {
      updatedAt: Date.now(),
    };
    
    // Only update fields that are provided
    if (body.status !== undefined) {
      updateData.status = body.status;
    }
    
    if (body.shared !== undefined) {
      updateData.shared = body.shared;
    }
    
    if (body.assignedTo !== undefined) {
      updateData.assignedTo = body.assignedTo;
    }
    
    if (body.complexity !== undefined) {
      updateData.complexity = body.complexity;
    }
    
    // Update the submission
    await updateDoc(submissionRef, updateData);
    
    return NextResponse.json({ 
      success: true,
      message: "Submission updated successfully",
      updatedFields: Object.keys(updateData).filter(key => key !== 'updatedAt')
    });
  } catch (error) {
    console.error('Error updating submission:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
} 
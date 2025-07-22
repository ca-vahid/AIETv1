import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export async function DELETE(req: NextRequest) {
  try {
    // Check admin password
    const adminPassword = req.headers.get('X-Admin-Password');
    if (adminPassword !== 'i-am-admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { submissionIds } = body;

    if (!submissionIds || !Array.isArray(submissionIds) || submissionIds.length === 0) {
      return NextResponse.json({ error: 'No submission IDs provided' }, { status: 400 });
    }

    console.log(`[Admin API] Deleting ${submissionIds.length} submissions:`, submissionIds);

    if (submissionIds.length === 1) {
      // Single delete
      const submissionId = submissionIds[0];
      const submissionRef = adminDb.collection('requests').doc(submissionId);
      
      // Check if submission exists before deleting
      const submissionSnap = await submissionRef.get();
      if (!submissionSnap.exists) {
        return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
      }

      await submissionRef.delete();
      console.log(`[Admin API] Successfully deleted submission: ${submissionId}`);
    } else {
      // Bulk delete using batch
      const batch = adminDb.batch();
      let deletedCount = 0;

      for (const submissionId of submissionIds) {
        const submissionRef = adminDb.collection('requests').doc(submissionId);
        
        // Check if submission exists
        const submissionSnap = await submissionRef.get();
        if (submissionSnap.exists) {
          batch.delete(submissionRef);
          deletedCount++;
        } else {
          console.warn(`[Admin API] Submission not found for deletion: ${submissionId}`);
        }
      }

      if (deletedCount > 0) {
        await batch.commit();
        console.log(`[Admin API] Successfully bulk deleted ${deletedCount} submissions`);
      }
    }

    return NextResponse.json({ 
      success: true, 
      deletedCount: submissionIds.length,
      message: `Successfully deleted ${submissionIds.length} submission(s)`
    });

  } catch (error) {
    console.error('[Admin API] Error deleting submissions:', error);
    return NextResponse.json(
      { error: 'Failed to delete submission(s)' },
      { status: 500 }
    );
  }
} 
export function getRequestStatusLabel(status: string): string {
  const statusLabels: Record<string, string> = {
    'new': 'Submitted - Awaiting Review',
    'in_review': 'Under Review',
    'pilot': 'Pilot Implementation',
    'completed': 'Completed',
    'rejected': 'Not Feasible'
  };
  
  return statusLabels[status] || 'Unknown Status';
}

export function getConversationStateLabel(state: string): string {
  const stateLabels: Record<string, string> = {
    'init': 'Getting Started',
    // ... other states from your history API ...
    'description': 'Description',
    'details': 'Collecting Details',
    'attachments': 'Attachments',
    'summary': 'Summary Review',
    'submit': 'Ready to Submit'
  };
  return stateLabels[state] || 'In Progress';
}

// Add other shared utility functions here if needed, e.g., for complexity badge colors etc. 
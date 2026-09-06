export const ROLES = ['citizen', 'admin', 'department', 'worker']
export const STATUSES = ['Reported', 'Under Review', 'Assigned', 'In Progress', 'Resolved', 'Closed', 'Rejected', 'Duplicate', 'Reopened']
export const SEVERITIES = ['Low', 'Medium', 'High', 'Critical']
export const CATEGORIES = ['Pothole', 'Garbage / Waste', 'Broken Streetlight', 'Water Leakage', 'Road Damage', 'Drainage Issue', 'Fallen Tree', 'Traffic Signal Damage', 'Illegal Dumping', 'Public Infrastructure Damage', 'Other']

export const departmentFor = (category) => ({
  Pothole: 'Roads & Transport', 'Road Damage': 'Roads & Transport',
  'Garbage / Waste': 'Sanitation', 'Illegal Dumping': 'Sanitation',
  'Broken Streetlight': 'Electrical', 'Water Leakage': 'Water Supply',
  'Drainage Issue': 'Water Supply', 'Fallen Tree': 'Parks & Public Spaces',
  'Traffic Signal Damage': 'Traffic Management', 'Public Infrastructure Damage': 'Public Works',
}[category] || 'Public Works')

export const severityWeight = { Low: 20, Medium: 45, High: 70, Critical: 90 }

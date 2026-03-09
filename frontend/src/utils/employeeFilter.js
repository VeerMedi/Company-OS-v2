// Centralized employee filtering utility
// These employees should be filtered out from all dashboards

export const FILTERED_EMPLOYEES = [
  'Aastha Rathi',
  'Mahati Agrawal',
  'Vinay Patel',
  'Aayushi Trivedi'
];

/**
 * Filter out specific employees from a list
 * @param {Array} employees - Array of employee objects
 * @param {string} nameField - Field name containing employee name (default: 'name')
 * @returns {Array} Filtered employee list
 */
export const filterEmployees = (employees, nameField = 'name') => {
  if (!Array.isArray(employees)) return [];
  
  return employees.filter(employee => {
    const employeeName = employee[nameField] || 
                        `${employee.firstName || ''} ${employee.lastName || ''}`.trim();
    return !FILTERED_EMPLOYEES.includes(employeeName);
  });
};

/**
 * Check if an employee should be filtered
 * @param {Object} employee - Employee object
 * @param {string} nameField - Field name containing employee name
 * @returns {boolean} True if employee should be filtered out
 */
export const shouldFilterEmployee = (employee, nameField = 'name') => {
  const employeeName = employee[nameField] || 
                      `${employee.firstName || ''} ${employee.lastName || ''}`.trim();
  return FILTERED_EMPLOYEES.includes(employeeName);
};

// Constants for The Hustle System

// Payroll Constants
module.exports.PAYROLL = {
  STANDARD_BASIC_SALARY: 10000, // ₹10,000 standard basic salary for developers
  WORKING_DAYS_PER_MONTH: 22,
  OVERTIME_RATE: 200, // ₹200 per hour
  
  // Allowances (default percentages and amounts)
  ALLOWANCES: {
    HRA_PERCENTAGE: 0.30, // 30% of basic salary
    TRANSPORT_AMOUNT: 2000, // Fixed ₹2,000
    MEDICAL_AMOUNT: 1500, // Fixed ₹1,500
    MINIMUM_ATTENDANCE_FOR_FULL_ALLOWANCE: 0.9 // 90% attendance required
  },
  
  // Deductions (default percentages)
  DEDUCTIONS: {
    PF_PERCENTAGE: 0.12, // 12% provident fund
    INSURANCE_AMOUNT: 500 // Fixed ₹500
  }
};

// Developer Roles
module.exports.DEVELOPER_ROLES = [
  'individual',
  'service-delivery',
  'service-onboarding'
];

// Manager/HR Roles
module.exports.MANAGEMENT_ROLES = [
  'hr',
  'manager',
  'ceo',
  'co-founder'
];

// Incentive Tiers (for reference - actual data in IncentiveMatrix collection)
module.exports.INCENTIVE_TIERS = {
  BRONZE: { min: 0, max: 50, icon: '🥉' },
  SILVER: { min: 51, max: 65, icon: '🥈' },
  GOLD: { min: 66, max: 80, icon: '🥇' },
  PLATINUM: { min: 81, max: 90, icon: '💎' },
  DIAMOND: { min: 91, max: 100, icon: '🌟' }
};

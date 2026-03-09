"""
Leave Data Fetcher for RAG System
Fetches leave requests and balances from MongoDB
"""

from pymongo import MongoClient
import certifi
from datetime import datetime, timedelta
from typing import Dict, List, Any
from bson import ObjectId
from config import AnalyticsLLMConfig

class LeaveFetcher:
    """Fetches leave management data from MongoDB"""
    
    def __init__(self):
        self.config = AnalyticsLLMConfig()
        self.client = None
        self.db = None
    
    def connect(self):
        """Establish MongoDB connection"""
        try:
            self.client = MongoClient(self.config.MONGODB_URI, tlsCAFile=certifi.where())
            self.db = self.client[self.config.DB_NAME]
            self.client.server_info()
            print("✓ Leave Fetcher connected to MongoDB")
        except Exception as e:
            print(f"Failed to connect to MongoDB: {e}")
            raise
    
    def disconnect(self):
        """Close MongoDB connection"""
        if self.client:
            self.client.close()
    
    def fetch_leave_requests(self, category: str = None, status_filter: str = None) -> List[Dict[str, Any]]:
        """
        Fetch leave requests with employee details
        
        Args:
            category: Filter by category (service-delivery or service-onboarding)
            status_filter: Filter by status (approved, pending, rejected, etc.)
        """
        try:
            # Build query filter
            query = {}
            
            if status_filter:
                query["status"] = status_filter
            
            # Filter by category if specified
            if category:
                if category == 'service-delivery':
                    service_delivery_emails = [
                        'developertest@example.com', 
                        'manageronetwo@example.com', 
                        'hrsourabh@example.com'
                    ]
                    category_users = list(self.db.users.find(
                        {"email": {"$in": service_delivery_emails}, "isActive": True},
                        {"_id": 1}
                    ))
                else:  # service-onboarding
                    excluded_emails = [
                        'developertest@example.com', 
                        'manageronetwo@example.com', 
                        'hrsourabh@example.com', 
                        'ceo@example.com'
                    ]
                    category_users = list(self.db.users.find(
                        {
                            "isActive": True,
                            "email": {"$nin": excluded_emails}
                        },
                        {"_id": 1}
                    ))
                
                user_ids = [user["_id"] for user in category_users]
                query["employee"] = {"$in": user_ids}
            
            # Fetch leaves
            leaves = list(self.db.leaves.find(query).sort("appliedDate", -1).limit(100))
            
            print(f"Found {len(leaves)} leave requests" + (f" for category {category}" if category else ""))
            
            results = []
            for leave in leaves:
                employee_id = leave.get("employee")
                
                # Get employee details
                employee = self.db.users.find_one({"_id": employee_id})
                if not employee:
                    continue
                
                # Get approver names
                manager_approver = None
                hr_approver = None
                cofounder_approver = None
                
                if leave.get("managerApproval", {}).get("approvedBy"):
                    manager_user = self.db.users.find_one({"_id": leave["managerApproval"]["approvedBy"]})
                    if manager_user:
                        manager_approver = f"{manager_user.get('firstName', '')} {manager_user.get('lastName', '')}".strip()
                
                if leave.get("hrApproval", {}).get("approvedBy"):
                    hr_user = self.db.users.find_one({"_id": leave["hrApproval"]["approvedBy"]})
                    if hr_user:
                        hr_approver = f"{hr_user.get('firstName', '')} {hr_user.get('lastName', '')}".strip()
                
                if leave.get("coFounderApproval", {}).get("approvedBy"):
                    cf_user = self.db.users.find_one({"_id": leave["coFounderApproval"]["approvedBy"]})
                    if cf_user:
                        cofounder_approver = f"{cf_user.get('firstName', '')} {cf_user.get('lastName', '')}".strip()
                
                # Determine who approved
                approved_by = manager_approver or hr_approver or cofounder_approver or "Pending"
                
                results.append({
                    "id": str(leave["_id"]),
                    "employee_name": f"{employee.get('firstName', '')} {employee.get('lastName', '')}".strip(),
                    "employee_id": employee.get("employeeId"),
                    "email": employee.get("email"),
                    "role": employee.get("role"),
                    "leave_type": leave.get("leaveType"),
                    "start_date": str(leave.get("startDate")) if leave.get("startDate") else None,
                    "end_date": str(leave.get("endDate")) if leave.get("endDate") else None,
                    "total_days": leave.get("totalDays", 0),
                    "is_half_day": leave.get("isHalfDay", False),
                    "status": leave.get("status"),
                    "reason": leave.get("reason", ""),
                    "manager_approval": leave.get("managerApproval", {}).get("status"),
                    "hr_approval": leave.get("hrApproval", {}).get("status"),
                    "cofounder_approval": leave.get("coFounderApproval", {}).get("status"),
                    "approved_by": approved_by,
                    "applied_date": str(leave.get("appliedDate")) if leave.get("appliedDate") else None,
                    "handover_details": leave.get("handoverDetails", "")
                })
            
            return results
        except Exception as e:
            print(f"Error fetching leave requests: {e}")
            import traceback
            traceback.print_exc()
            return []
    
    def fetch_leave_balances(self, category: str = None) -> List[Dict[str, Any]]:
        """Fetch leave balances for employees"""
        try:
            query = {}
            
            # Filter by category if specified
            if category:
                if category == 'service-delivery':
                    service_delivery_emails = [
                        'developertest@example.com', 
                        'manageronetwo@example.com', 
                        'hrsourabh@example.com'
                    ]
                    category_users = list(self.db.users.find(
                        {"email": {"$in": service_delivery_emails}, "isActive": True},
                        {"_id": 1}
                    ))
                else:  # service-onboarding
                    excluded_emails = [
                        'developertest@example.com', 
                        'manageronetwo@example.com', 
                        'hrsourabh@example.com', 
                        'ceo@example.com'
                    ]
                    category_users = list(self.db.users.find(
                        {
                            "isActive": True,
                            "email": {"$nin": excluded_emails}
                        },
                        {"_id": 1}
                    ))
                
                user_ids = [user["_id"] for user in category_users]
                query["employee"] = {"$in": user_ids}
            
            # Fetch balances
            balances = list(self.db.leavebalances.find(query))
            
            print(f"Found {len(balances)} leave balances")
            
            results = []
            for balance in balances:
                employee_id = balance.get("employee")
                
                # Get employee details
                employee = self.db.users.find_one({"_id": employee_id})
                if not employee:
                    continue
                
                results.append({
                    "id": str(balance["_id"]),
                    "employee_name": f"{employee.get('firstName', '')} {employee.get('lastName', '')}".strip(),
                    "employee_id": employee.get("employeeId"),
                    "email": employee.get("email"),
                    "year": balance.get("year"),
                    "sick_leave": balance.get("balances", {}).get("sick", {}),
                    "casual_leave": balance.get("balances", {}).get("casual", {}),
                    "vacation_leave": balance.get("balances", {}).get("vacation", {}),
                    "total_remaining": (
                        balance.get("balances", {}).get("sick", {}).get("remaining", 0) +
                        balance.get("balances", {}).get("casual", {}).get("remaining", 0) +
                        balance.get("balances", {}).get("vacation", {}).get("remaining", 0)
                    )
                })
            
            return results
        except Exception as e:
            print(f"Error fetching leave balances: {e}")
            import traceback
            traceback.print_exc()
            return []

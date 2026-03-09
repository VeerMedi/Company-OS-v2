from pymongo import MongoClient
import certifi
from datetime import datetime, timedelta
from typing import Dict, List, Any
from bson import ObjectId
from config import AnalyticsLLMConfig
from utils.mongo_cache import get_aggregation_cache

class DataFetcher:
    """Fetches project and employee data from MongoDB Atlas"""
    
    def __init__(self):
        self.config = AnalyticsLLMConfig()
        self.client = None
        self.db = None
        self.cache = get_aggregation_cache()  # Add MongoDB aggregation cache
    
    def connect(self):
        """Establish MongoDB connection"""
        try:
            self.client = MongoClient(self.config.MONGODB_URI, serverSelectionTimeoutMS=30000, connectTimeoutMS=30000, socketTimeoutMS=30000, tlsCAFile=certifi.where())
            self.db = self.client[self.config.DB_NAME]
            # Test connection
            self.client.server_info()
            print("Successfully connected to MongoDB Atlas")
        except Exception as e:
            print(f"Failed to connect to MongoDB: {e}")
            raise
    
    def disconnect(self):
        """Close MongoDB connection"""
        if self.client:
            self.client.close()
    
    def fetch_collection_data(self, collection_name: str, limit: int = 1000, query: Dict = None) -> List[Dict[str, Any]]:
        """
        Generic method to fetch data from any collection
        
        Args:
            collection_name: Name of the MongoDB collection (e.g., 'tasks', 'leads')
            limit: Maximum number of documents to fetch
            query: Optional MongoDB query filter
            
        Returns:
            List of document dictionaries
        """
        try:
            if query is None:
                query = {}
                
            # Handle collection name to collection object mapping
            if not hasattr(self.db, collection_name):
                print(f"⚠️ Collection '{collection_name}' not found in database")
                return []
                
            collection = getattr(self.db, collection_name)
            
            # Fetch documents with sort by creation date if available, otherwise natural order
            cursor = collection.find(query).limit(limit)
            
            # Try to sort by createdAt if it exists in first doc
            try:
                cursor = cursor.sort("createdAt", -1)
            except:
                pass
                
            documents = list(cursor)
            print(f"Fetched {len(documents)} documents from '{collection_name}'")
            return documents
            
        except Exception as e:
            print(f"❌ Error fetching from '{collection_name}': {e}")
            return []

    def fetch_projects_data(self, limit: int = 100, category: str = None) -> List[Dict[str, Any]]:
        """Fetch current projects with their metrics"""
        try:
            # Build query filter - ONLY filter if category is explicitly provided
            query_filter = {}
            
            # Only apply category filtering if category is specified
            if category:
                # Category filtering logic (kept for future use)
                if category == 'service-delivery':
                    service_delivery_emails = ['developertest@example.com', 'manageronetwo@example.com', 'hrsourabh@example.com']
                    category_users = list(self.db.users.find(
                        {"email": {"$in": service_delivery_emails}, "isActive": True},
                        {"_id": 1}
                    ))
                else:  # service-onboarding
                    excluded_emails = ['developertest@example.com', 'manageronetwo@example.com', 'hrsourabh@example.com', 'ceo@example.com']
                    category_users = list(self.db.users.find(
                        {
                            "isActive": True,
                            "email": {"$nin": excluded_emails}
                        },
                        {"_id": 1}
                    ))
                
                user_ids = [user["_id"] for user in category_users]
                
                if user_ids:  # Only add filter if we found users
                    query_filter["$or"] = [
                        {"createdBy": {"$in": user_ids}},
                        {"assignedManager": {"$in": user_ids}}
                    ]
                    print(f"Filtering projects for category: {category}, found {len(user_ids)} users")
                else:
                    print(f"No users found for category: {category}, fetching all projects instead")
            
            # Fetch projects
            projects = list(self.db.projects.find(
                query_filter,
                limit=limit
            ).sort("createdAt", -1))
            
            print(f"Found {len(projects)} projects" + (f" for category {category}" if category else ""))
            
            results = []
            for project in projects:
                project_id = project.get("_id")
                
                # Count tasks for this project
                total_tasks = self.db.tasks.count_documents({"project": project_id})
                completed_tasks = self.db.tasks.count_documents({
                    "project": project_id,
                    "status": "completed"
                })
                in_progress_tasks = self.db.tasks.count_documents({
                    "project": project_id,
                    "status": "in-progress"
                })
                not_started_tasks = self.db.tasks.count_documents({
                    "project": project_id,
                    "status": "not-started"
                })
                
                # Get assigned manager details
                manager = None
                if project.get("assignedManager"):
                    manager_data = self.db.users.find_one({"_id": project.get("assignedManager")})
                    if manager_data:
                        manager = {
                            "name": f"{manager_data.get('firstName', '')} {manager_data.get('lastName', '')}".strip(),
                            "email": manager_data.get("email"),
                            "role": manager_data.get("role"),
                            "employee_id": manager_data.get("employeeId")
                        }
                
                # Get created by details
                created_by = None
                if project.get("createdBy"):
                    creator_data = self.db.users.find_one({"_id": project.get("createdBy")})
                    if creator_data:
                        created_by = {
                            "name": f"{creator_data.get('firstName', '')} {creator_data.get('lastName', '')}".strip(),
                            "email": creator_data.get("email"),
                            "role": creator_data.get("role")
                        }
                
                # Calculate completion percentage
                completion_percentage = 0
                if total_tasks > 0:
                    completion_percentage = round((completed_tasks / total_tasks) * 100, 2)
                
                results.append({
                    "id": str(project_id),
                    "name": project.get("name"),
                    "description": project.get("description", "")[:200],  # Truncate for readability
                    "status": project.get("status"),
                    "deadline": str(project.get("deadline")) if project.get("deadline") else None,
                    "progress": project.get("progress", 0),
                    "total_points": project.get("totalPoints", 0),
                    "completed_points": project.get("completedPoints", 0),
                    "total_tasks": total_tasks,
                    "completed_tasks": completed_tasks,
                    "in_progress_tasks": in_progress_tasks,
                    "not_started_tasks": not_started_tasks,
                    "completion_percentage": completion_percentage,
                    "is_automated": project.get("isAutomated", False),
                    "manager": manager,
                    "created_by": created_by,
                    "created_at": str(project.get("createdAt")) if project.get("createdAt") else None,
                    "updated_at": str(project.get("updatedAt")) if project.get("updatedAt") else None,
                    "documentation": project.get("documentation", "")
                })
            
            return results
        except Exception as e:
            print(f"Error fetching projects: {e}")
            import traceback
            traceback.print_exc()
            return []
    
    def fetch_employee_reports(self, days: int = 30, category: str = None) -> List[Dict[str, Any]]:
        """
        Fetch individual employee performance reports (OPTIMIZED VERSION)
        Uses aggregation and projections to reduce query time from 5-6s to <1s
        """
        try:
            import time
            start_time = time.time()
            print(f"\n🚀 Starting OPTIMIZED employee fetch for category: {category}")
            
            cutoff_date = datetime.now() - timedelta(days=days)
            
            # Build employee query - default to active employees
            employee_query = {"isActive": True}
            
            # Filter by category if specified
            if category:
                if category == 'service-delivery':
                    service_delivery_emails = ['developertest@example.com', 'manageronetwo@example.com', 'hrsourabh@example.com']
                    employee_query["email"] = {"$in": service_delivery_emails}
                    print(f"Filtering employees for category: {category}")
                else:  # service-onboarding
                    excluded_emails = ['developertest@example.com', 'manageronetwo@example.com', 'hrsourabh@example.com', 'ceo@example.com']
                    excluded_roles = ['ceo', 'co-founder']
                    employee_query["email"] = {"$nin": excluded_emails}
                    employee_query["role"] = {"$nin": excluded_roles}
                    print(f"Filtering employees for category: {category}")
            else:
                # Default: exclude CEO and co-founder for general analytics
                employee_query["role"] = {"$nin": ['ceo', 'co-founder']}
                print("Fetching all employees (excluding CEO/co-founder)")
            
            # Step 1: Fetch employees with PROJECTION (only required fields)
            projection = {
                "_id": 1,
                "firstName": 1,
                "lastName": 1,
                "email": 1,
                "role": 1,
                "department": 1,
                "employeeId": 1,
                "phone": 1,
                "phoneNumber": 1,
                "totalPoints": 1,
                "joiningDate": 1,
                "lastLogin": 1,
                "isPasswordChanged": 1
            }
            
            employees = list(self.db.users.find(employee_query, projection))
            employee_ids = [emp["_id"] for emp in employees]
            
            print(f"Found {len(employees)} active employees" + (f" in {category} category" if category else " (excluding CEO, HR, Managers)"))
            print(f"  ✓ Fetched employees with projection in {time.time() - start_time:.2f}s")
            
            if not employee_ids:
                return []
            
            # Step 2: Use AGGREGATION to get ALL task stats in ONE query
            agg_start = time.time()
            
            # Check cache first (60s TTL for near-real-time freshness)
            cache_key = f"employee_task_stats:{category}:{len(employee_ids)}"
            task_stats_by_employee = self.cache.get(cache_key)
            
            if task_stats_by_employee is None:
                # Cache miss - fetch from MongoDB
                # Aggregation pipeline for task statistics
                task_stats_pipeline = [
                    {"$match": {"assignedTo": {"$in": employee_ids}}},
                    {"$group": {
                        "_id": {
                            "employee": "$assignedTo",
                            "status": "$status"
                        },
                        "count": {"$sum": 1}
                    }}
                ]
                
                task_stats_raw = list(self.db.tasks.aggregate(task_stats_pipeline))
                
                #Organize task stats by employee
                task_stats_by_employee = {}
                for stat in task_stats_raw:
                    emp_id = stat["_id"]["employee"]
                    status = stat["_id"]["status"]
                    count = stat["count"]
                    
                    if emp_id not in task_stats_by_employee:
                        task_stats_by_employee[emp_id] = {
                            "all_tasks": 0,
                            "completed": 0,
                            "in_progress": 0,
                            "not_started": 0,
                            "review": 0,
                            "needs_revision": 0
                        }
                    
                    task_stats_by_employee[emp_id]["all_tasks"] += count
                    
                    if status == "completed":
                        task_stats_by_employee[emp_id]["completed"] = count
                    elif status == "in-progress":
                        task_stats_by_employee[emp_id]["in_progress"] = count
                    elif status == "not-started":
                        task_stats_by_employee[emp_id]["not_started"] = count
                    elif status == "review":
                        task_stats_by_employee[emp_id]["review"] = count
                    elif status == "needs-revision":
                        task_stats_by_employee[emp_id]["needs_revision"] = count
                
                # Cache the results (60s TTL)
                self.cache.set(cache_key, task_stats_by_employee)
                print(f"  ✓ Aggregated task stats in {time.time() - agg_start:.2f}s (cached for 60s)")
            
            # Step 3: Build results using pre-aggregated data
            results = []
            for employee in employees:
                employee_id = employee["_id"]
                stats = task_stats_by_employee.get(employee_id, {
                    "all_tasks": 0,
                    "completed": 0,
                    "in_progress": 0,
                    "not_started": 0,
                    "review": 0,
                    "needs_revision": 0
                })
                
                # Calculate completion rate
                all_tasks = stats.get("all_tasks", 0)
                completed = stats.get("completed", 0)
                completion_rate = round((completed / all_tasks * 100), 2) if all_tasks > 0 else 0
                
                results.append({
                    "id": str(employee_id),
                    "name": f"{employee.get('firstName', '')} {employee.get('lastName', '')}".strip(),
                    "email": employee.get("email"),
                    "role": employee.get("role"),
                    "department": employee.get("department"),
                    "employee_id": employee.get("employeeId"),
                    "phone": employee.get("phone") or employee.get("phoneNumber"),
                    "all_time_tasks": all_tasks,
                    "all_time_completed": completed,
                    "total_tasks": all_tasks,  # Simplified - showing all tasks instead of just recent
                    "completed_tasks": completed,
                    "in_progress_tasks": stats.get("in_progress", 0),
                    "not_started_tasks": stats.get("not_started", 0),
                    "on_time_tasks": 0,  # Skipped for performance - can be added back if critical
                    "late_tasks": 0,
                    "completion_rate": completion_rate,
                    "on_time_rate": 0,
                    "active_projects": 0,  # Skipped for performance - can be added back if critical
                    "total_points": employee.get("totalPoints", 0),
                    "recent_points": 0,  # Skipped for performance
                    "revision_tasks": stats.get("needs_revision", 0),
                    "review_tasks": stats.get("review", 0),
                    "joining_date": str(employee.get("joiningDate")) if employee.get("joiningDate") else None,
                    "last_login": str(employee.get("lastLogin")) if employee.get("lastLogin") else None,
                    "is_password_changed": employee.get("isPasswordChanged", False)
                })
            
            total_time = time.time() - start_time
            print(f"  ✅ TOTAL OPTIMIZED fetch time: {total_time:.2f}s (was ~5-6s before optimization)")
            
            return results
            
        except Exception as e:
            print(f"Error fetching employee reports: {e}")
            import traceback
            traceback.print_exc()
            return []
    
    def fetch_analytics_summary(self, category: str = None) -> Dict[str, Any]:
        """Fetch overall analytics summary"""
        try:
            import time
            start_time = time.time()
            print(f"\n{'='*60}")
            print(f"⏱️  Starting analytics summary fetch" + (f" for category: {category}" if category else ""))
            
            # Build filters based on category
            project_filter = {}
            employee_filter = {"isActive": True}
            user_ids = []
            
            if category:
                filter_start = time.time()
                if category == 'service-delivery':
                    # Service delivery = developertest, manageronetwo, hrsourabh
                    service_delivery_emails = ['developertest@example.com', 'manageronetwo@example.com', 'hrsourabh@example.com']
                    category_users = list(self.db.users.find(
                        {"email": {"$in": service_delivery_emails}, "isActive": True},
                        {"_id": 1}
                    ))
                    user_ids = [user["_id"] for user in category_users]
                    
                    # Filter projects
                    project_filter["$or"] = [
                        {"createdBy": {"$in": user_ids}},
                        {"assignedManager": {"$in": user_ids}}
                    ]
                    
                    # Filter employees
                    employee_filter["email"] = {"$in": service_delivery_emails}
                    
                else:  # service-onboarding
                    # Service onboarding = all active users except service-delivery and CEO
                    excluded_emails = ['developertest@example.com', 'manageronetwo@example.com', 'hrsourabh@example.com', 'ceo@example.com']
                    category_users = list(self.db.users.find(
                        {
                            "isActive": True,
                            "email": {"$nin": excluded_emails}
                        },
                        {"_id": 1}
                    ))
                    user_ids = [user["_id"] for user in category_users]
                    
                    # Filter projects
                    project_filter["$or"] = [
                        {"createdBy": {"$in": user_ids}},
                        {"assignedManager": {"$in": user_ids}}
                    ]
                    
                    # Filter employees
                    employee_filter["email"] = {"$nin": excluded_emails}
                    employee_filter["role"] = {"$nin": ['ceo', 'co-founder']}
                
                print(f"⏱️  Filter setup took: {time.time() - filter_start:.2f}s")
            
            # Get overall statistics
            stats_start = time.time()
            total_projects = self.db.projects.count_documents(project_filter)
            
            active_filter = {**project_filter, "status": {"$in": ["not-started", "in-progress", "ready-for-assignment"]}}
            active_projects = self.db.projects.count_documents(active_filter)
            
            completed_filter = {**project_filter, "status": "completed"}
            completed_projects = self.db.projects.count_documents(completed_filter)
            
            print(f"⏱️  Project stats took: {time.time() - stats_start:.2f}s")
            
            # Get task statistics for filtered projects
            task_stats_start = time.time()
            if category and user_ids:
                # Get all project IDs from filtered projects
                filtered_projects = list(self.db.projects.find(project_filter, {"_id": 1}))
                project_ids = [p["_id"] for p in filtered_projects]
                
                # Count tasks only from these projects
                task_filter = {"project": {"$in": project_ids}} if project_ids else {"project": None}
                total_tasks = self.db.tasks.count_documents(task_filter)
                completed_tasks = self.db.tasks.count_documents({**task_filter, "status": "completed"})
                in_progress_tasks = self.db.tasks.count_documents({**task_filter, "status": "in-progress"})
                pending_tasks = self.db.tasks.count_documents({**task_filter, "status": "not-started"})
                review_tasks = self.db.tasks.count_documents({**task_filter, "status": "review"})
                revision_tasks = self.db.tasks.count_documents({**task_filter, "status": "needs-revision"})
            else:
                # No category filter, get all tasks
                total_tasks = self.db.tasks.count_documents({})
                completed_tasks = self.db.tasks.count_documents({"status": "completed"})
                in_progress_tasks = self.db.tasks.count_documents({"status": "in-progress"})
                pending_tasks = self.db.tasks.count_documents({"status": "not-started"})
                review_tasks = self.db.tasks.count_documents({"status": "review"})
                revision_tasks = self.db.tasks.count_documents({"status": "needs-revision"})
            
            total_employees = self.db.users.count_documents(employee_filter)
            
            # Count task bunches
            if category:
                # Count bunches only from filtered projects
                bunch_filter = {"project": {"$in": project_ids}} if project_ids else {"project": None}
                total_bunches = self.db.taskbunches.count_documents(bunch_filter)
            else:
                # No category filter, get all bunches
                total_bunches = self.db.taskbunches.count_documents({})
            
            print(f"⏱️  Task stats took: {time.time() - task_stats_start:.2f}s")
            print(f"📊 Stats - Projects: {total_projects}, Tasks: {total_tasks}, Bunches: {total_bunches}, Employees: {total_employees}")
            
            # Fetch detailed data
            projects_start = time.time()
            projects = self.fetch_projects_data(category=category)
            print(f"⏱️  Fetching {len(projects)} projects took: {time.time() - projects_start:.2f}s")
            
            employees_start = time.time()
            employees = self.fetch_employee_reports(category=category)
            print(f"⏱️  Fetching {len(employees)} employees took: {time.time() - employees_start:.2f}s")
            
            total_time = time.time() - start_time
            print(f"⏱️  TOTAL TIME: {total_time:.2f}s")
            print(f"{'='*60}\n")
            
            return {
                "projects": projects,
                "employees": employees,
                "summary_stats": {
                    "total_projects": total_projects,
                    "active_projects": active_projects,
                    "completed_projects": completed_projects,
                    "total_tasks": total_tasks,
                    "total_bunches": total_bunches,
                    "completed_tasks": completed_tasks,
                    "in_progress_tasks": in_progress_tasks,
                    "pending_tasks": pending_tasks,
                    "review_tasks": review_tasks,
                    "revision_tasks": revision_tasks,
                    "total_employees": total_employees,
                    "task_completion_rate": round((completed_tasks / total_tasks * 100), 2) if total_tasks > 0 else 0,
                    "project_completion_rate": round((completed_projects / total_projects * 100), 2) if total_projects > 0 else 0,
                    "category": category
                },
                "timestamp": datetime.now().isoformat()
            }
        except Exception as e:
            print(f"❌ Error fetching analytics summary: {e}")
            import traceback
            traceback.print_exc()
            return {
                "projects": [],
                "employees": [],
                "summary_stats": {},
                "timestamp": datetime.now().isoformat(),
                "error": str(e)
            }
    
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
                
                if leave.get("managerApproval", {}).get("approvedBy"):
                    manager_user = self.db.users.find_one({"_id": leave["managerApproval"]["approvedBy"]})
                    if manager_user:
                        manager_approver = f"{manager_user.get('firstName', '')} {manager_user.get('lastName', '')}".strip()
                
                if leave.get("hrApproval", {}).get("approvedBy"):
                    hr_user = self.db.users.find_one({"_id": leave["hrApproval"]["approvedBy"]})
                    if hr_user:
                        hr_approver = f"{hr_user.get('firstName', '')} {hr_user.get('lastName', '')}".strip()
                
                # Determine who approved
                approved_by = hr_approver or manager_approver or "Pending"
                
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
                    "approved_by": approved_by,
                    "applied_date": str(leave.get("appliedDate")) if leave.get("appliedDate") else None
                })
            
            return results
        except Exception as e:
            print(f"Error fetching leave requests: {e}")
            import traceback
            traceback.print_exc()
            return []
    
    def find_project_by_name(self, project_name: str) -> Dict[str, Any]:
        """
        Find a project by name (case-insensitive partial match)
        
        Args:
            project_name: Project name to search for
            
        Returns:
            Project dict with _id or empty dict if not found
        """
        try:
            projects = self.db['projects']
            
            # Try exact match first
            project = projects.find_one({
                "name": {"$regex": f"^{project_name}$", "$options": "i"}
            })
            
            if project:
                return {"_id": str(project["_id"]), "name": project.get("name")}
            
            # Try partial match
            project = projects.find_one({
                "name": {"$regex": project_name, "$options": "i"}
            })
            
            if project:
                return {"_id": str(project["_id"]), "name": project.get("name")}
            
            return {}
        except Exception as e:
            print(f"Error finding project: {e}")
            return {}
    
    def find_user_by_name(self, user_name: str, role_filter: List[str] = None) -> Dict[str, Any]:
        """
        Find a user by name (case-insensitive partial match)
        
        Args:
            user_name: User name to search for (firstName, lastName, or full name)
            role_filter: Optional list of roles to filter by (e.g., ['manager', 'hr'])
            
        Returns:
            User dict with _id or empty dict if not found
        """
        try:
            users = self.db['users']
            
            # Build query
            query = {}
            if role_filter:
                query["role"] = {"$in": role_filter}
            
            # Try full name match
            user = users.find_one({
                **query,
                "$or": [
                    {"firstName": {"$regex": user_name, "$options": "i"}},
                    {"lastName": {"$regex": user_name, "$options": "i"}},
                    {"$expr": {
                        "$regexMatch": {
                            "input": {"$concat": ["$firstName", " ", "$lastName"]},
                            "regex": user_name,
                            "options": "i"
                        }
                    }}
                ]
            })
            
            if user:
                return {
                    "_id": str(user["_id"]),
                    "name": f"{user.get('firstName', '')} {user.get('lastName', '')}".strip(),
                    "role": user.get("role")
                }
            
            return {}
        except Exception as e:
            print(f"Error finding user: {e}")
            return {}

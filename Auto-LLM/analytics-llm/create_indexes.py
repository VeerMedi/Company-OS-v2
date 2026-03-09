"""
Database Index Creation Script for Performance Optimization
Adds indexes to speed up employee, project, task, and leave queries
"""

from pymongo import MongoClient, ASCENDING, DESCENDING
import certifi
import os
from dotenv import load_dotenv
import time

load_dotenv()

# MongoDB connection
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb+srv://sourabhsompandey_db_user:sourabh01@hustledatabase.fsycdzj.mongodb.net/?retryWrites=true&w=majority&appName=hustledatabase")
DB_NAME = os.getenv("DB_NAME", "test")

def create_indexes():
    """Create indexes for optimal query performance"""
    print("=" * 70)
    print("🔧 Creating Database Indexes for Performance Optimization")
    print("=" * 70)
    
    try:
        # Connect to MongoDB
        start_time = time.time()
        client = MongoClient(
            MONGODB_URI,
            serverSelectionTimeoutMS=10000,
            tlsCAFile=certifi.where()
        )
        db = client[DB_NAME]
        
        # Test connection
        db.command('ping')
        print(f"✓ Connected to MongoDB in {time.time() - start_time:.2f}s\n")
        
        # ========================
        # USERS/EMPLOYEES COLLECTION
        # ========================
        print("📊 Creating indexes on 'users' collection...")
        users_collection = db['users']
        
        # Helper function to create index safely
        def create_index_safe(collection, keys, **kwargs):
            try:
                collection.create_index(keys, background=True, **kwargs)
                return True
            except Exception as e:
                if "already exists" in str(e) or "IndexOptionsConflict" in str(e):
                    return False  # Index already exists
                raise  # Re-raise if it's a different error
        
        # Single field indexes
        if create_index_safe(users_collection, [("email", ASCENDING)], unique=True, name="idx_email"):
            print("  ✓ Email index (unique)")
        else:
            print("  ○ Email index (already exists)")
        
        if create_index_safe(users_collection, [("role", ASCENDING)], name="idx_role"):
            print("  ✓ Role index")
        else:
            print("  ○ Role index (already exists)")
        
        if create_index_safe(users_collection, [("isActive", ASCENDING)], name="idx_isActive"):
            print("  ✓ IsActive index")
        else:
            print("  ○ IsActive index (already exists)")
        
        if create_index_safe(users_collection, [("employeeId", ASCENDING)], name="idx_employeeId"):
            print("  ✓ EmployeeId index")
        else:
            print("  ○ EmployeeId index (already exists)")
        
        if create_index_safe(users_collection, [("department", ASCENDING)], name="idx_department"):
            print("  ✓ Department index")
        else:
            print("  ○ Department index (already exists)")
        
        # Compound indexes for common queries
        if create_index_safe(users_collection, [("isActive", ASCENDING), ("role", ASCENDING)], name="idx_active_role"):
            print("  ✓ Compound index: isActive + role")
        else:
            print("  ○ Compound index: isActive + role (already exists)")
        
        if create_index_safe(users_collection, [("isActive", ASCENDING), ("email", ASCENDING)], name="idx_active_email"):
            print("  ✓ Compound index: isActive + email")
        else:
            print("  ○ Compound index: isActive + email (already exists)")
        
        # ========================
        # PROJECTS COLLECTION
        # ========================
        print("\n📊 Creating indexes on 'projects' collection...")
        projects_collection = db['projects']
        
        create_index_safe(projects_collection, [("status", ASCENDING)], name="idx_status")
        create_index_safe(projects_collection, [("createdBy", ASCENDING)], name="idx_createdBy")
        create_index_safe(projects_collection, [("assignedManager", ASCENDING)], name="idx_assignedManager")
        create_index_safe(projects_collection, [("createdAt", DESCENDING)], name="idx_createdAt_desc")
        create_index_safe(projects_collection, [("deadline", ASCENDING)], name="idx_deadline")
        create_index_safe(projects_collection, [("status", ASCENDING), ("createdAt", DESCENDING)], name="idx_status_createdAt")
        print("  ✓ Projects indexes created")
        
        # ========================
        # TASKS COLLECTION
        # ========================
        print("\n📊 Creating indexes on 'tasks' collection...")
        tasks_collection = db['tasks']
        
        create_index_safe(tasks_collection, [("assignedTo", ASCENDING)], name="idx_assignedTo")
        create_index_safe(tasks_collection, [("project", ASCENDING)], name="idx_project")
        create_index_safe(tasks_collection, [("status", ASCENDING)], name="idx_status")
        create_index_safe(tasks_collection, [("createdAt", DESCENDING)], name="idx_createdAt_desc")
        create_index_safe(tasks_collection, [("completedAt", ASCENDING)], name="idx_completedAt")
        create_index_safe(tasks_collection, [("deadline", ASCENDING)], name="idx_deadline")
        create_index_safe(tasks_collection, [("assignedTo", ASCENDING), ("status", ASCENDING)], name="idx_assignedTo_status")
        create_index_safe(tasks_collection, [("project", ASCENDING), ("status", ASCENDING)], name="idx_project_status") 
        create_index_safe(tasks_collection, [("assignedTo", ASCENDING), ("createdAt", DESCENDING)], name="idx_assignedTo_createdAt")
        print("  ✓ Tasks indexes created")
        
        # ========================
        # LEAVES COLLECTION
        # ========================
        print("\n📊 Creating indexes on 'leaves' collection...")
        leaves_collection = db['leaves']
        
        create_index_safe(leaves_collection, [("employee", ASCENDING)], name="idx_employee")
        create_index_safe(leaves_collection, [("status", ASCENDING)], name="idx_status")
        create_index_safe(leaves_collection, [("appliedDate", DESCENDING)], name="idx_appliedDate_desc")
        create_index_safe(leaves_collection, [("startDate", ASCENDING)], name="idx_startDate")
        create_index_safe(leaves_collection, [("leaveType", ASCENDING)], name="idx_leaveType")
        create_index_safe(leaves_collection, [("employee", ASCENDING), ("status", ASCENDING)], name="idx_employee_status")
        print("  ✓ Leaves indexes created")
        
        # ========================
        # ATTENDANCES COLLECTION
        # ========================
        print("\n📊 Creating indexes on 'attendances' collection...")
        attendances_collection = db['attendances']
        
        create_index_safe(attendances_collection, [("userId", ASCENDING)], name="idx_userId")
        create_index_safe(attendances_collection, [("date", DESCENDING)], name="idx_date_desc")
        create_index_safe(attendances_collection, [("status", ASCENDING)], name="idx_status")
        create_index_safe(attendances_collection, [("userId", ASCENDING), ("date", DESCENDING)], name="idx_userId_date")
        print("  ✓ Attendances indexes created")
        
        # ========================
        # Display all indexes
        # ========================
        print("\n" + "=" * 70)
        print("📋 INDEX SUMMARY")
        print("=" * 70)
        
        collections = ['users', 'projects', 'tasks', 'leaves', 'attendances']
        for coll_name in collections:
            coll = db[coll_name]
            indexes = list(coll.list_indexes())
            print(f"\n{coll_name.upper()} ({len(indexes)} indexes):")
            for idx in indexes:
                print(f"  - {idx['name']}")
        
        print("\n" + "=" * 70)
        print("✅ All indexes created successfully!")
        print("=" * 70)
        
        client.close()
        return True
        
    except Exception as e:
        print(f"\n❌ Error creating indexes: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    create_indexes()

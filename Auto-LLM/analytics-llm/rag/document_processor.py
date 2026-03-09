"""
Document Processor for RAG System
Converts MongoDB data into structured documents for embedding
"""

from typing import Dict, List, Any
from datetime import datetime
from bson import ObjectId
from config import AnalyticsLLMConfig

class DocumentProcessor:
    """Processes MongoDB data into rich text documents for RAG"""
    
    def __init__(self):
        self.config = AnalyticsLLMConfig()
    
    def process_generic_document(self, doc_data: Dict[str, Any], doc_type: str) -> Dict[str, Any]:
        """
        Generic processor for any document type using heuristics
        
        Args:
            doc_data: Raw document dictionary
            doc_type: Type name (e.g., 'task', 'lead')
            
        Returns:
            Dict with 'text' and 'metadata'
        """
        text_parts = []
        
        # 1. Identify Title/Name (expanded search)
        title_keys = ['title', 'name', 'subject', 'role', 'companyInfo', 'companyName', 'employeeName', 'productName']
        title = "Unknown Item"
        for key in title_keys:
            if key in doc_data and doc_data[key]:
                val = doc_data[key]
                if isinstance(val, dict):
                    # Try to extract name from nested dict
                    if 'name' in val:
                        title = val['name']
                    elif 'title' in val:
                        title = val['title']
                    else:
                        title = str(val)
                else:
                    title = str(val)
                break
                
        text_parts.append(f"{doc_type.upper()}: {title}")
        text_parts.append("=" * 60)
        
        # 2. Process all fields with enhanced formatting (excluding system fields)
        ignored_keys = ['_id', '__v', 'password', 'embedding', 'vector', 'image', 'token', 'hash']
        
        # Prioritize important fields
        priority_keys = ['status', 'type', 'category', 'priority', 'description', 'notes']
        other_keys = [k for k in doc_data.keys() if k not in priority_keys and k not in ignored_keys]
        
        # Process priority keys first
        for key in priority_keys + other_keys:
            if key not in doc_data or key in ignored_keys:
                continue
                
            value = doc_data[key]
            
            # Skip empty values
            if value is None or value == "" or value == []:
                continue
                
            # Format key nicely
            formatted_key = key.replace('_', ' ').replace('Id', ' ID').title()
            
            # Format value intelligently
            if isinstance(value, ObjectId):
                continue  # Skip raw ObjectIds
            elif isinstance(value, datetime):
                formatted_value = value.strftime("%Y-%m-%d %H:%M")
            elif isinstance(value, bool):
                formatted_value = "Yes" if value else "No"
            elif isinstance(value, list):
                if not value: 
                    continue
                # Handle list of simple items vs list of dicts
                if len(value) > 0 and isinstance(value[0], (str, int, float, bool)):
                    formatted_value = ", ".join(map(str, value[:10]))  # Limit to 10 items
                elif len(value) > 0 and isinstance(value[0], dict):
                    # Extract names from list of objects
                    names = []
                    for item in value[:5]:  # Limit to 5 items
                        if 'name' in item:
                            names.append(item['name'])
                        elif 'title' in item:
                            names.append(item['title'])
                    if names:
                        formatted_value = ", ".join(names)
                    else:
                        formatted_value = f"{len(value)} items"
                else:
                    formatted_value = f"{len(value)} items"
            elif isinstance(value, dict):
                # Enhanced dict handling
                if 'name' in value:
                    formatted_value = str(value['name'])
                elif 'title' in value:
                    formatted_value = str(value['title'])
                elif 'email' in value:
                    formatted_value = f"{value.get('name', 'Unknown')} ({value['email']})"
                elif 'id' in value or '_id' in value:
                    # Reference to another object
                    formatted_value = f"Reference: {value.get('name', value.get('id', 'unknown'))}"
                else:
                    # Try to provide meaningful details
                    formatted_value = str({k: v for k, v in value.items() if k not in ignored_keys})[:100]
            elif isinstance(value, (int, float)):
                # Format numbers nicely
                if key.lower() in ['amount', 'price', 'cost', 'salary', 'revenue']:
                    formatted_value = f"${value:,.2f}"
                else:
                    formatted_value = str(value)
            else:
                formatted_value = str(value)
                
            # Add to text with nice formatting
            if key in ['description', 'notes', 'content', 'reason']:
                # Multi-line for long text fields
                text_parts.append(f"\n{formatted_key}:")
                text_parts.append(f"  {formatted_value[:500]}")  # Truncate long descriptions
            else:
                text_parts.append(f"{formatted_key}: {formatted_value}")
            
        document_text = "\n".join(text_parts)
        
        # 3. Create Enhanced Metadata
        metadata = {
            "id": str(doc_data.get('_id', '')),
            "type": doc_type,
            "title": title,
            "name": title,  # Add name for consistency
            "status": str(doc_data.get('status', doc_data.get('approvalStatus', 'unknown'))),
            "category": doc_data.get('category', ''),
        }
        
        # Add created/updated timestamps if available
        if 'createdAt' in doc_data:
            metadata["created_at"] = doc_data['createdAt'].isoformat() if isinstance(doc_data.get('createdAt'), datetime) else str(doc_data['createdAt'])
        if 'updatedAt' in doc_data:
            metadata["updated_at"] = doc_data['updatedAt'].isoformat() if isinstance(doc_data.get('updatedAt'), datetime) else str(doc_data['updatedAt'])
        
        return {
            "text": document_text,
            "metadata": metadata,
            "id": f"{doc_type}_{doc_data.get('_id')}"
        }

    def process_project(self, project_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Convert project data into a searchable document
        
        Args:
            project_data: Project dict from MongoDB/DataFetcher
            
        Returns:
            Dict with 'text' (document content) and 'metadata'
        """
        # Build rich text representation
        text_parts = []
        
        # Header
        text_parts.append(f"PROJECT: {project_data.get('name', 'Unnamed Project')}")
        text_parts.append("=" * 60)
        
        # Description
        if project_data.get('description'):
            text_parts.append(f"\nDescription: {project_data['description']}")
        
        # Status and Progress
        status = project_data.get('status', 'unknown')
        progress = project_data.get('progress', 0)
        completion_pct = project_data.get('completion_percentage', 0)
        
        text_parts.append(f"\nCurrent Status: {status.upper()}")
        text_parts.append(f"Overall Progress: {progress}%")
        text_parts.append(f"Task Completion Rate: {completion_pct}%")
        
        # Task Breakdown
        total_tasks = project_data.get('total_tasks', 0)
        completed = project_data.get('completed_tasks', 0)
        in_progress = project_data.get('in_progress_tasks', 0)
        not_started = project_data.get('not_started_tasks', 0)
        
        text_parts.append(f"\nTask Breakdown:")
        text_parts.append(f"  • Total Tasks: {total_tasks}")
        text_parts.append(f"  • Completed: {completed}")
        text_parts.append(f"  • In Progress: {in_progress}")
        text_parts.append(f"  • Not Started: {not_started}")
        
        # Points
        total_points = project_data.get('total_points', 0)
        completed_points = project_data.get('completed_points', 0)
        text_parts.append(f"\nPoints: {completed_points}/{total_points}")
        
        # Team
        manager = project_data.get('manager')
        if manager and isinstance(manager, dict):
            text_parts.append(f"\nAssigned Manager: {manager.get('name', 'Unknown')} ({manager.get('role', 'N/A')})")
        
        creator = project_data.get('created_by')
        if creator and isinstance(creator, dict):
            text_parts.append(f"Created By: {creator.get('name', 'Unknown')} ({creator.get('role', 'N/A')})")
        
        # Timeline
        if project_data.get('created_at'):
            text_parts.append(f"\nCreated: {project_data['created_at']}")
        if project_data.get('deadline'):
            text_parts.append(f"Deadline: {project_data['deadline']}")
        
        # Automation
        if project_data.get('is_automated'):
            text_parts.append("\n⚙️ This is an AUTOMATED project (created via n8n workflow)")
        
        # Documentation
        if project_data.get('documentation'):
            text_parts.append(f"\nDocumentation: {project_data['documentation'][:200]}...")
        
        document_text = "\n".join(text_parts)
        
        # Metadata for filtering
        metadata = {
            "id": project_data.get('id'),
            "name": project_data.get('name'),
            "status": status,
            "completion_percentage": completion_pct,
            "total_tasks": total_tasks,
            "manager_name": manager.get('name', 'Unassigned') if manager and isinstance(manager, dict) else 'Unassigned',
            "is_automated": project_data.get('is_automated', False),
            "created_at": project_data.get('created_at', ''),
            "deadline": project_data.get('deadline', ''),
            "type": "project"
        }
        
        return {
            "text": document_text,
            "metadata": metadata,
            "id": f"project_{project_data.get('id')}"
        }
    
    def process_employee(self, employee_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Convert employee data into a searchable document
        
        Args:
            employee_data: Employee dict from MongoDB/DataFetcher
            
        Returns:
            Dict with 'text' (document content) and 'metadata'
        """
        text_parts = []
        
        # Header
        name = employee_data.get('name', 'Unknown')
        employee_id = employee_data.get('employee_id', 'N/A')
        text_parts.append(f"EMPLOYEE: {name} (ID: {employee_id})")
        text_parts.append("=" * 60)
        
        # Role and Department
        role = employee_data.get('role', 'Unspecified')
        department = employee_data.get('department', 'Unspecified')
        text_parts.append(f"\nRole: {role}")
        text_parts.append(f"Department: {department}")
        text_parts.append(f"Email: {employee_data.get('email', 'N/A')}")
        
        # Performance Metrics
        completion_rate = employee_data.get('completion_rate', 0)
        on_time_rate = employee_data.get('on_time_rate', 0)
        
        text_parts.append(f"\nPerformance Metrics:")
        text_parts.append(f"  • Task Completion Rate: {completion_rate}%")
        text_parts.append(f"  • On-Time Delivery Rate: {on_time_rate}%")
        
        # Task Statistics
        all_time_tasks = employee_data.get('all_time_tasks', 0)
        all_time_completed = employee_data.get('all_time_completed', 0)
        total_tasks = employee_data.get('total_tasks', 0)
        completed_tasks = employee_data.get('completed_tasks', 0)
        in_progress = employee_data.get('in_progress_tasks', 0)
        not_started = employee_data.get('not_started_tasks', 0)
        
        text_parts.append(f"\nAll-Time Statistics:")
        text_parts.append(f"  • Total Tasks: {all_time_tasks}")
        text_parts.append(f"  • Completed: {all_time_completed}")
        
        text_parts.append(f"\nRecent Activity (Last 30 Days):")
        text_parts.append(f"  • Total Tasks: {total_tasks}")
        text_parts.append(f"  • Completed: {completed_tasks}")
        text_parts.append(f"  • In Progress: {in_progress}")
        text_parts.append(f"  • Not Started: {not_started}")
        
        # Delivery Performance
        on_time = employee_data.get('on_time_tasks', 0)
        late = employee_data.get('late_tasks', 0)
        text_parts.append(f"\nDelivery Record:")
        text_parts.append(f"  • On-Time Deliveries: {on_time}")
        text_parts.append(f"  • Late Deliveries: {late}")
        
        # Quality Indicators
        revision_tasks = employee_data.get('revision_tasks', 0)
        review_tasks = employee_data.get('review_tasks', 0)
        text_parts.append(f"\nQuality Indicators:")
        text_parts.append(f"  • Tasks in Revision: {revision_tasks}")
        text_parts.append(f"  • Tasks in Review: {review_tasks}")
        
        # Workload
        active_projects = employee_data.get('active_projects', 0)
        total_points = employee_data.get('total_points', 0)
        recent_points = employee_data.get('recent_points', 0)
        
        text_parts.append(f"\nWorkload:")
        text_parts.append(f"  • Active Projects: {active_projects}")
        text_parts.append(f"  • Total Points Earned: {total_points}")
        text_parts.append(f"  • Recent Points (30 days): {recent_points}")
        
        # Employment Info
        if employee_data.get('joining_date'):
            text_parts.append(f"\nJoining Date: {employee_data['joining_date']}")
        if employee_data.get('last_login'):
            text_parts.append(f"Last Login: {employee_data['last_login']}")
        
        document_text = "\n".join(text_parts)
        
        # Metadata
        metadata = {
            "id": employee_data.get('id'),
            "name": name,
            "employee_id": employee_id,
            "role": role,
            "department": department,
            "email": employee_data.get('email'),
            "completion_rate": completion_rate,
            "on_time_rate": on_time_rate,
            "total_points": total_points,
            "active_projects": active_projects,
            "type": "employee"
        }
        
        return {
            "text": document_text,
            "metadata": metadata,
            "id": f"employee_{employee_data.get('id')}"
        }
    
    def process_revenue_target(self, revenue_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Convert revenue target data into a searchable document
        
        Args:
            revenue_data: Revenue target dict
            
        Returns:
            Dict with 'text' (document content) and 'metadata'
        """
        text_parts = []
        
        # Header
        text_parts.append(f"REVENUE TARGET")
        text_parts.append("=" * 60)
        
        # Target Details
        target_amount = revenue_data.get('target_amount', 0)
        currency = revenue_data.get('currency', 'USD')
        period = revenue_data.get('period_description', 'Unspecified')
        
        text_parts.append(f"\nTarget: {currency} {target_amount:,.2f}")
        text_parts.append(f"Period: {period}")
        
        # Assignment
        if revenue_data.get('hos_name'):
            text_parts.append(f"\nAssigned To: {revenue_data['hos_name']} (Head of Sales)")
        
        if revenue_data.get('cofounder_name'):
            text_parts.append(f"Set By: {revenue_data['cofounder_name']} (Co-Founder)")
        
        # Status
        status = revenue_data.get('status', 'unknown')
        text_parts.append(f"\nStatus: {status.upper()}")
        
        # Strategy (if available)
        if revenue_data.get('strategy'):
            strategy = revenue_data['strategy']
            text_parts.append(f"\nProposed Strategy:")
            text_parts.append(f"{strategy[:500]}...")  # Truncate long strategies
        
        # Progress/Performance
        if revenue_data.get('achieved_amount'):
            achieved = revenue_data['achieved_amount']
            percentage = (achieved / target_amount * 100) if target_amount > 0 else 0
            text_parts.append(f"\nProgress: {currency} {achieved:,.2f} ({percentage:.1f}%)")
        
        # Timeline
        if revenue_data.get('created_at'):
            text_parts.append(f"\nCreated: {revenue_data['created_at']}")
        if revenue_data.get('deadline'):
            text_parts.append(f"Deadline: {revenue_data['deadline']}")
        
        document_text = "\n".join(text_parts)
        
        # Metadata
        metadata = {
            "id": revenue_data.get('id'),
            "target_amount": target_amount,
            "currency": currency,
            "status": status,
            "hos_name": revenue_data.get('hos_name', 'Unassigned'),
            "period": period,
            "type": "revenue_target"
        }
        
        return {
            "text": document_text,
            "metadata": metadata,
            "id": f"revenue_{revenue_data.get('id')}"
        }
    
    
    def process_leave(self, leave_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Convert leave request data into a searchable document
        
        Args:
            leave_data: Leave request dict from MongoDB/DataFetcher
            
        Returns:
            Dict with 'text' (document content) and 'metadata'
        """
        text_parts = []
        
        # Header
        employee_name = leave_data.get('employee_name', 'Unknown')
        leave_type = leave_data.get('leave_type', 'unspecified')
        text_parts.append(f"LEAVE REQUEST: {employee_name} - {leave_type.upper()} LEAVE")
        text_parts.append("=" * 60)
        
        # Employee Info
        text_parts.append(f"\nEmployee: {employee_name}")
        text_parts.append(f"Employee ID: {leave_data.get('employee_id', 'N/A')}")
        text_parts.append(f"Email: {leave_data.get('email', 'N/A')}")
        text_parts.append(f"Role: {leave_data.get('role', 'N/A')}")
        
        # Leave Details
        text_parts.append(f"\nLeave Type: {leave_type.title()}")
        text_parts.append(f"Start Date: {leave_data.get('start_date', 'N/A')}")
        text_parts.append(f"End Date: {leave_data.get('end_date', 'N/A')}")
        text_parts.append(f"Total Days: {leave_data.get('total_days', 0)}")
        
        if leave_data.get('is_half_day'):
            text_parts.append("⏰ Half-Day Leave")
        
        # Status
        status = leave_data.get('status', 'pending')
        text_parts.append(f"\nStatus: {status.upper()}")
        
        # Approval Details
        text_parts.append(f"\nApproval Status:")
        text_parts.append(f"  • Manager: {leave_data.get('manager_approval', 'pending')}")
        text_parts.append(f"  • HR: {leave_data.get('hr_approval', 'pending')}")
        
        approved_by = leave_data.get('approved_by', 'Pending')
        if approved_by != 'Pending':
            text_parts.append(f"\nApproved By: {approved_by}")
        
        # Reason
        if leave_data.get('reason'):
            text_parts.append(f"\nReason: {leave_data['reason']}")
        
        # Applied Date
        if leave_data.get('applied_date'):
            text_parts.append(f"\nApplied On: {leave_data['applied_date']}")
        
        document_text = "\n".join(text_parts)
        
        # Metadata
        metadata = {
            "id": leave_data.get('id'),
            "employee_name": employee_name,
            "employee_id": leave_data.get('employee_id'),
            "leave_type": leave_type,
            "status": status,
            "start_date": leave_data.get('start_date', ''),
            "end_date": leave_data.get('end_date', ''),
            "total_days": leave_data.get('total_days', 0),
            "type": "leave"
        }
        
        return {
            "text": document_text,
            "metadata": metadata,
            "id": f"leave_{leave_data.get('id')}"
        }
    
    def chunk_text(self, text: str) -> List[str]:
        """
        Split long text into chunks for embedding
        
        Args:
            text: Text to chunk
            
        Returns:
            List of text chunks
        """
        chunk_size = self.config.CHUNK_SIZE
        overlap = self.config.CHUNK_OVERLAP
        
        # Simple chunking by character count
        chunks = []
        start = 0
        
        while start < len(text):
            end = start + chunk_size
            chunk = text[start:end]
            chunks.append(chunk)
            start = end - overlap
        
        return chunks if chunks else [text]
    
    def batch_process_projects(self, projects: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Process multiple projects"""
        return [self.process_project(p) for p in projects]
    
    def batch_process_employees(self, employees: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Process multiple employees"""
        return [self.process_employee(e) for e in employees]

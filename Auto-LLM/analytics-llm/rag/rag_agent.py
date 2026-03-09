"""
RAG Agent for Unified Cofounder Insights
Combines retrieval and generation for natural language Q&A
"""

from openai import OpenAI
from typing import Dict, List, Any, Optional
from datetime import datetime
from rag.direct_mongo_retriever import DirectMongoRetriever
from config import AnalyticsLLMConfig

class RAGAgent:
    """Main RAG orchestrator for cofounder insights"""
    
    def __init__(self):
        self.config = AnalyticsLLMConfig()
        self.retriever = DirectMongoRetriever()
        
        # Configure OpenRouter client (uses OpenAI-compatible API)
        self.client = OpenAI(
            base_url=self.config.OPENROUTER_BASE_URL,
            api_key=self.config.OPENROUTER_API_KEY
        )
        
        # Initialize fast-path optimizer for common queries
        try:
            from utils.fast_path_optimizer import FastPathOptimizer
            self.fast_path = FastPathOptimizer(self.retriever.data_fetcher)
            print("✓ RAG Agent initialized with OpenRouter + Fast-Path Optimizer")
        except ImportError as e:
            print(f"⚠️  Fast-path optimizer not available: {e}")
            self.fast_path = None
            print("✓ RAG Agent initialized with OpenRouter")
    
    def query(
        self,
        question: str,
        category: Optional[str] = None,
        conversation_history: Optional[List[Dict[str, str]]] = None,
        conversation_state: Optional[Dict[str, Any]] = None,
        is_voice: bool = False
    ) -> Dict[str, Any]:
        """
        Answer a cofounder question using RAG
        
        Args:
            question: Natural language question
            category: Optional category filter (e.g., 'service-delivery')
            conversation_history: Previous conversation turns for context
            conversation_state: Current conversation state for multi-turn interactions
            is_voice: If True, generate conversational voice-friendly responses
            
        Returns:
            Dictionary with answer, sources, and metadata
        """
        print("\n" + "=" * 80)
        print(f"RAG Query: {question}")
        if category:
            print(f"Category: {category}")
        if conversation_state:
            print(f"Conversation State: {conversation_state.get('step', 'N/A')}")
        print("=" * 80)
        
        try:
            # Check if we're in the middle of a conversation
            if conversation_state and conversation_state.get('step'):
                # Continue the conversation flow
                return self._continue_conversation(question, conversation_state, category, is_voice)
            
            # Step 0: Fast-path DISABLED for accuracy
            # Fast-path was causing wrong answers due to fuzzy matching
            # All queries now go through RAG for 100% accurate responses
            # Trade-off: +50-100ms latency for guaranteed accuracy
            if False:  # Permanently disabled
                fast_response = self.fast_path.get_instant_response(question)
                if fast_response:
                    fast_response["question"] = question
                    fast_response["category"] = category
                    fast_response["timestamp"] = datetime.now().isoformat()
                    fast_response["is_action"] = False
                    print("\n⚡ Fast-path response returned instantly\n")
                    return fast_response
            
            # Step 1: Check if this is a farewell (goodbye/bye)
            farewell_detected = self._detect_farewell(question)
            if farewell_detected:
                # Return farewell response with end_call flag
                return self._handle_farewell(question, is_voice)
            
            # Step 2: Check if this is an action request
            action_intent = self._detect_action_intent(question, category)
            
            if action_intent and action_intent.get("is_action"):
                # This is an action request - start conversational flow
                return self._handle_action_request(question, action_intent, category, is_voice)
            
            # Step 1: Retrieve relevant context (for regular queries)
            retrieval_results = self.retriever.retrieve(question, category=category)
            
            if retrieval_results["total_documents"] == 0:
                return self._no_context_response(question)
            
            # Step 2: Generate answer using retrieved context WITH token usage tracking
            llm_result = self._generate_answer(
                question=question,
                context=retrieval_results["context"],
                conversation_history=conversation_history,
                is_voice=is_voice,
                return_usage=True  # Get token usage
            )
            
            # Extract answer and usage
            if isinstance(llm_result, dict):
                answer = llm_result.get('answer', '')
                token_usage = llm_result.get('usage', {})
            else:
                answer = llm_result
                token_usage = {}
            
            # Step 3: Extract citations from results
            citations = self._extract_citations(retrieval_results["results"])
            
            # Step 4: Assemble response with token usage
            response = {
                "question": question,
                "answer": answer,
                "citations": citations,
                "domains_searched": retrieval_results["domains"],
                "num_sources": retrieval_results["total_documents"],
                "timestamp": datetime.now().isoformat(),
                "category": category,
                "success": True,
                "is_action": False,
                "token_usage": token_usage  # Add token usage to response
            }
            
            print("\n✓ Answer generated successfully\n")
            return response
            
        except Exception as e:
            print(f"\n❌ Error generating answer: {e}\n")
            import traceback
            traceback.print_exc()
            
            return {
                "question": question,
                "answer": f"I encountered an error while processing your question: {str(e)}",
                "citations": [],
                "success": False,
                "error": str(e),
                "timestamp": datetime.now().isoformat(),
                "is_action": False
            }

    def query_stream(self, question, category=None, history=None, is_voice=True):
        """Stream the answer from the LLM with action detection support"""
        try:
            # CRITICAL FIX: Add action detection just like in query()
            # Check if this is an action request
            action_intent = self._detect_action_intent(question, category)
            
            if action_intent and action_intent.get("is_action"):
                # This is an action request - use non-streaming conversational flow
                print("🎯 Action detected in stream - delegating to query() for conversational flow")
                result = self.query(
                    question=question,
                    category=category,
                    conversation_history=history or [],
                    conversation_state=None,
                    is_voice=is_voice
                )
                # Yield the answer as a single chunk
                yield result.get('answer', '')
                return
            
            # Regular query - continue with streaming
            retrieval = self.retriever.retrieve(question, category=category)
            if retrieval["total_documents"] == 0:
                yield "I'm sorry, I couldn't find any info on that."
                return
            
            messages = self._build_messages(question, retrieval["context"], history, is_voice)
            stream = self.client.chat.completions.create(
                model=self.config.MODEL_NAME,
                messages=messages,
                temperature=self.config.RAG_TEMPERATURE,
                stream=True
            )
            for chunk in stream:
                if chunk.choices and chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
        except Exception as e:
            yield f"Error: {str(e)}"

    def _build_messages(self, question, context, history, is_voice):
        """Helper to build RAG messages with natural voice mode"""
        messages = []
        try:
            from utils.language_detection import detect_language, get_language_instruction
            instruction = get_language_instruction(detect_language(question))
        except:
            instruction = "Respond in English."
            
        messages.append({"role": "system", "content": f"{instruction}\n\n{self.config.RAG_SYSTEM_PROMPT}"})
        
        if history:
            for turn in history[-3:]:
                messages.append({"role": "user", "content": turn.get('question', '')})
                messages.append({"role": "assistant", "content": turn.get('answer', '')})
        
        # Enhanced voice mode instruction
        if is_voice:
            voice_instruction = """
VOICE MODE - CRITICAL RULES:
- Keep to 2-3 SHORT sentences max (50-80 words total)
- Be conversational and natural - speak like a helpful colleague
- Start with small acknowledgements when appropriate: "Sure", "Got it", "Alright", "Let me check"
- Use natural transitions: "By the way...", "Also...", "And..."  
- NO bullet points - speak in flowing sentences
- End with brief follow-up if appropriate: "Need anything else?" or "Want more details?"
- Be warm and human, not robotic"""
            msg = f"{context}\n\nQ: {question}\n\n{voice_instruction}"
        else:
            msg = f"{context}\n\nQ: {question}"
            
        messages.append({"role": "user", "content": msg})
        return messages


    def _generate_answer(
        self,
        question: str,
        context: str,
        conversation_history: Optional[List[Dict[str, str]]] = None,
        is_voice: bool = False,
        return_usage: bool = False
    ) -> Any:
        """
        Generate answer using OpenRouter with retrieved context
        """
        # Build messages for chat completion
        messages = self._build_messages(question, context, conversation_history, is_voice)
        
        # OPTIMIZATION: Reduce max_tokens for voice to speed up LLM
        # Voice responses should be concise anyway
        voice_max_tokens = 150 if is_voice else self.config.MAX_TOKENS
        
        # Generate response using OpenRouter
        response = self.client.chat.completions.create(
            model=self.config.MODEL_NAME,
            messages=messages,
            temperature=self.config.RAG_TEMPERATURE,
            max_tokens=voice_max_tokens  # OPTIMIZED: 150 for voice, 300 for text
        )
        
        return response.choices[0].message.content.strip()
    
    def _no_context_response(self, question: str) -> Dict[str, Any]:
        """Generate response when no relevant context found"""
        return {
            "question": question,
            "answer": ("I couldn't find relevant information in the database to answer your question. "
                      "This might be because:\n"
                      "• The data hasn't been synced to the system yet\n"
                      "• Your question is about data that isn't tracked\n"
                      "• The question might need to be rephrased\n\n"
                      "Try asking about specific projects, team members, or metrics that you know exist."),
            "citations": [],
            "domains_searched": [],
            "num_sources": 0,
            "timestamp": datetime.now().isoformat(),
            "success": False,
            "reason": "no_context_found"
        }
    
    def _extract_citations(self, results: Dict[str, Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Extract citation information from retrieval results
        
        Args:
            results: Results dictionary from retriever
            
        Returns:
            List of citation dicts with source info
        """
        citations = []
        
        for domain, domain_results in results.items():
            for metadata, distance in zip(
                domain_results.get("metadatas", []),
                domain_results.get("distances", [])
            ):
                relevance = 1 - distance
                
                citation = {
                    "domain": domain,
                    "type": metadata.get("type"),
                    "id": metadata.get("id"),
                    "name": metadata.get("name", "Unknown"),
                    "relevance_score": round(relevance, 2)
                }
                
                # Add domain-specific details
                if domain == "projects":
                    citation["status"] = metadata.get("status")
                    citation["completion"] = metadata.get("completion_percentage")
                elif domain == "employees":
                    citation["role"] = metadata.get("role")
                    citation["employee_id"] = metadata.get("employee_id")
                elif domain == "revenue":
                    citation["target_amount"] = metadata.get("target_amount")
                    citation["status"] = metadata.get("status")
                
                citations.append(citation)
        
        # Sort by relevance
        citations.sort(key=lambda x: x["relevance_score"], reverse=True)
        
        return citations
    
    def multi_query(self, questions: List[str]) -> List[Dict[str, Any]]:
        """
        Answer multiple questions in batch
        
        Args:
            questions: List of questions
            
        Returns:
            List of responses
        """
        return [self.query(q) for q in questions]
    
    def get_summary_insights(self, category: Optional[str] = None) -> Dict[str, Any]:
        """
        Generate high-level summary insights for cofounder dashboard
        
        Args:
            category: Optional category filter
            
        Returns:
            Summary insights across all domains
        """
        questions = [
            "What are the biggest risks across all projects right now?",
            "Which team members need attention or support?",
            "What revenue targets are at risk of not being met?",
            "What are the top priorities for this week?"
        ]
        
        # Execute queries
        responses = self.multi_query(questions)
        
        return {
            "category": category,
            "insights": responses,
            "timestamp": datetime.now().isoformat()
        }
    
    def _detect_action_intent(self, question: str, category: Optional[str] = None) -> Dict[str, Any]:
        """
        Detect if the question is requesting an action (like creating a task)
        
        Args:
            question: User question
            category: Optional category filter
            
        Returns:
            Dictionary with is_action flag and detected action type
        """
        # Action keywords that indicate task creation
        action_keywords = [
            'create a task', 'add a task', 'assign a task', 'make a task',
            'create task', 'add task', 'assign task', 'make task',
            'need a task', 'set up a task', 'give a task',
            'task for', 'create work', 'assign work'
        ]
        
        question_lower = question.lower()
        
        # DEBUG: Log what we're checking
        print(f"🔍 Action Intent Detection:")
        print(f"   Question (lower): '{question_lower}'")
        
        # Check for action keywords
        matched_keyword = None
        for keyword in action_keywords:
            if keyword in question_lower:
                matched_keyword = keyword
                break
        
        is_action = matched_keyword is not None
        
        if is_action:
            print(f"   ✓ MATCHED keyword: '{matched_keyword}'")
            print(f"   → Treating as ACTION REQUEST")
            return {
                "is_action": True,
                "action_type": "create_task",
                "original_question": question
            }
        else:
            print(f"   ✗ No action keywords matched")
            print(f"   → Treating as regular query")
        
        return {"is_action": False}
    
    def _detect_farewell(self, question: str) -> bool:
        """
        Detect if the user is saying goodbye
        
        Args:
            question: User question
            
        Returns:
            True if farewell detected, False otherwise
        """
        # Farewell keywords in English and Hindi/Hinglish
        farewell_keywords = [
            # English
            'goodbye', 'good bye', 'bye', 'see you', 'bye bye', 'byebye',
            'talk to you later', 'ttyl', 'gotta go', 'have to go', 'need to go',
            'take care', 'later', 'catch you later', 'peace out',
            # Hindi/Hinglish
            'alvida', 'alwida', 'bye bye', 'phir milenge', 'phir milte hai',
            'milte hai', 'chalta hun', 'chalta hoon', 'jata hun', 'jata hoon',
            'nikal raha', 'chalunga', 'jaa raha', 'jaa raha hun'
        ]
        
        question_lower = question.lower().strip()
        
        # Check for exact farewell keywords
        for keyword in farewell_keywords:
            if keyword  == question_lower or f" {keyword}" in f" {question_lower}" or f"{keyword} " in f"{question_lower} ":
                print(f"👋 Farewell detected: '{keyword}' in '{question}'")
                return True
        
        return False
    
    def _handle_farewell(self, question: str, is_voice: bool = False) -> Dict[str, Any]:
        """
        Handle farewell message and signal to end the call
        
        Args:
            question: User question
            is_voice: If True, use voice-friendly response
            
        Returns:
            Farewell response with end_call flag
        """
        import random
        
        # Generate a friendly farewell response
        farewells = [
            "Goodbye! Have a great day!",
            "Take care! Feel free to reach out anytime.",
            "Bye! It was nice talking to you.",
            "See you later! Have a wonderful day ahead.",
            "Goodbye! Come back whenever you need help.",
            # Hinglish variants
            "Alvida! Acha din ho!",
            "Okay, phir milte hain! Take care!",
            "Bye! Kabhi bhi puchh sakte ho.",
            "Accha, milte hain! Have a great day!"
        ]
        
        answer = random.choice(farewells)
        
        return {
            "answer": answer,
            "sources": [],
            "question": question,
            "category": None,
            "timestamp": datetime.now().isoformat(),
            "is_action": False,
            "end_call": True,  # Signal to frontend to end the call
            "tokens_used": 0
        }
    
    def _detect_language(self, query: str) -> str:
        """
        Detect if query contains Hindi/Hinglish
        
        Args:
            query: User question
            
        Returns:
            'hinglish' if Hindi words detected, 'english' otherwise
        """
        # Comprehensive Hindi keyword list
        hindi_words = {
            # Question words
            'kya', 'kaise', 'kab', 'kahan', 'kyun', 'kitne', 'kitna', 'kitni', 'kaun', 'kaunsa', 'kaunse',
            # Common verbs
            'hai', 'hain', 'ho', 'tha', 'the', 'thi', 'hoga', 'honge', 'hogi', 'kar', 'karo', 'karna', 'karte',
            'batao', 'bataiye', 'batana', 'dikhao', 'dikhaiye', 'dikhana', 'dekho', 'dekhiye', 'dekh', 
            'chahiye', 'chaahiye', 'chahte', 'lagta', 'lagte', 'samjho', 'samajh', 'samjhaiye',
            # Pronouns
            'mera', 'meri', 'mere', 'hamara', 'hamari', 'hamare', 'humare', 'tumhara', 'tumhari', 'tumhare',
            'uska', 'uski', 'uske', 'iska', 'iski', 'iske', 'unka', 'unki', 'unke', 'inka', 'inki', 'inke',
            'mujhe', 'mujhko', 'humein', 'hume', 'tumhe', 'tumko', 'unhe', 'unko', 'inhe', 'inko',
            # Common words
            'aur', 'ya', 'lekin', 'par', 'toh', 'to', 'ki', 'ke', 'ka', 'ko', 'se', 'mein', 'me', 'pe',
            'bhi', 'nahi', 'nahin', 'haan', 'han', 'ji', 'sir', 'yaar', 'bas', 'abhi', 'ab', 'jab',
            # Polite forms
            'kripya', 'kripaya', 'dhanyavaad', 'shukriya', 'namaste', 'namaskar',
            # Time/quantity
            'sabhi', 'sab', 'saare', 'kuch', 'koi', 'zyada', 'jyada', 'kam', 'thoda', 'bahut',
            # Actions
            'do', 'dijiye', 'dena', 'kijiye', 'karna', 'lao', 'laao', 'laiye', 'bhejo', 'bhejiye',
            # Common Hinglish
            'achha', 'accha', 'theek', 'thik', 'bilkul', 'zaroor', 'shayad', 'matlab', 'wala', 'wale', 'wali',
            # Demonstratives
            'yeh', 'ye', 'woh', 'wo', 'iss', 'is', 'us', 'in', 'un',
            # Conjunctions
            'kyunki', 'kyonki', 'agar', 'taki', 'jab', 'jabki',
            # Others
            'karna', 'karte', 'karta', 'karti', 'karke', 'karenge', 'karegi', 'karega'
        }
        
        query_lower = query.lower().strip()
        words = query_lower.split()
        
        # Count Hindi words
        hindi_word_count = sum(1 for word in words if word in hindi_words)
        
        # Detection logic:
        # - If ANY Hindi words detected → Hinglish response
        total_words = len(words)
        if total_words == 0:
            return 'english'
        
        hindi_ratio = hindi_word_count / total_words if total_words > 0 else 0
        
        # Get detected Hindi words for logging
        detected_words = [w for w in words if w in hindi_words]
        
        # Debug logging
        print(f"🔍 Language Detection:")
        print(f"   Query: '{query}'")
        print(f"   Hindi words found: {hindi_word_count}/{total_words} ({hindi_ratio*100:.0f}%)")
        if detected_words:
            print(f"   Detected: {detected_words}")
        
        # If ANY Hindi word detected, use Hinglish
        if hindi_word_count > 0:
            print(f"   → HINGLISH mode (Hindi words detected)")
            return 'hinglish'
        else:
            print(f"   → ENGLISH mode (no Hindi words)")
            return 'english'

    
    def _handle_action_request(
        self,
        question: str,
        action_intent: Dict[str, Any],
        category: Optional[str] = None,
        is_voice: bool = False
    ) -> Dict[str, Any]:
        """
        Handle action requests through conversational flow (no modal)
        Asks for missing information step by step
        
        Args:
            question: User question
            action_intent: Detected action intent
            category: Optional category filter
            is_voice: If True, use conversational voice-friendly language
            
        Returns:
            Conversation response with next question or completion
        """
        print("\n🎯 Detected action request - initiating conversational flow...")
        
        # Retrieve context to help with parameter extraction
        retrieval_results = self.retriever.retrieve(question, category=category)
        
        # Extract available parameters from the question
        # Pass is_voice to control auto-fill behavior
        extracted_params = self._extract_action_parameters(
            question,
            action_intent["action_type"],
            retrieval_results["context"],
            category,
            is_voice=is_voice  # Pass voice mode flag
        )
        
        # Check what information is still missing
        missing_info = self._check_missing_parameters(extracted_params)
        
        if missing_info:
            # Ask for the next missing piece of information
            next_question, suggestions = self._generate_next_question(
                missing_info[0],
                extracted_params,
                retrieval_results["context"],
                is_voice
            )
            
            return {
                "question": question,
                "is_action": True,
                "action_type": action_intent["action_type"],
                "conversation_state": {
                    "step": missing_info[0],
                    "collected_params": extracted_params,
                    "missing_params": missing_info,
                    "needs_data": missing_info[0] in ["project", "assignee"]
                },
                "answer": next_question,
                "suggestions": suggestions,
                "action_complete": False,
                "success": True,
                "timestamp": datetime.now().isoformat()
            }
        else:
            # All information collected - return ready for execution
            enhanced_params = self._enhance_cofounder_task(extracted_params)
            confirmation = self._generate_final_confirmation(enhanced_params, is_voice)
            
            return {
                "question": question,
                "is_action": True,
                "action_type": action_intent["action_type"],
                "action_params": enhanced_params,
                "conversation_state": {
                    "step": "confirm",
                    "collected_params": enhanced_params,
                    "ready_to_execute": True
                },
                "answer": confirmation,
                "action_complete": False,
                "success": True,
                "timestamp": datetime.now().isoformat()
            }
    
    def _extract_action_parameters(
        self,
        question: str,
        action_type: str,
        context: str,
        category: Optional[str] = None,
        is_voice: bool = False
    ) -> Dict[str, Any]:
        """
        Extract structured action parameters from natural language
        Uses smart pattern matching before LLM for speed
        
        Args:
            question: User question
            action_type: Type of action (e.g., create_task)
            context: Retrieved context
            category: Optional category filter
            is_voice: If True, disable auto-fill to enable full conversational flow
            
        Returns:
            Extracted parameters
        """
        params = {
            "title": None,
            "description": None,
            "assignee_name": None,
            "assignee_role": None,
            "project_name": None,
            "deadline": None,
            "priority_hint": None,
            "points_hint": None,
            "skip_project": False,
            "_is_voice": is_voice  # Track voice mode for later
        }
        
        # VOICE MODE: Skip ALL smart extraction to enable full conversational flow
        # Voice users should be asked for each piece of information step by step
        if is_voice:
            print("🎤 Voice mode: Skipping smart extraction - will ask for all info conversationally")
            return params
        
        # TEXT MODE: Continue with smart extraction for faster UX
        question_lower = question.lower()
        
        # Quick pattern matching for common phrases - FUZZY matching for voice transcriptions
        # Check if assigning to HR role (not a specific person)
        hr_patterns = [' for hr', ' to hr', ' hr ', 'for hr', 'to hr']
        if any(pattern in question_lower for pattern in hr_patterns) or question_lower.endswith(' hr'):
            # User wants to assign to HR - find an actual HR user
            managers = self._fetch_real_managers()
            hr_users = [m for m in managers if m.get('role', '').lower() == 'hr']
            if hr_users:
                params['assignee_name'] = hr_users[0]['name']
                params['assignee_id'] = hr_users[0]['_id']
                params['assignee_role'] = 'hr'
                params['skip_project'] = True  # HR tasks don't need projects
                print(f"✓ Smart match: Assigned to HR user '{hr_users[0]['name']}'")
        
        # Check if assigning to a manager role - fuzzy patterns for voice errors
        manager_patterns = [
            ' for manager', ' to manager', 'for manager', 'to manager',
            ' for manag', ' to manag',  # Partial word (manag-er)
            ' for mana', ' to mana',    # Even more partial
            'create task for', 'task for'  # Common voice command patterns
        ]
        
        # Check if any manager pattern exists
        has_manager_mention = any(pattern in question_lower for pattern in manager_patterns)
        
        if has_manager_mention and not params.get('assignee_name'):
            # Try to find a manager
            managers = self._fetch_real_managers()
            manager_users = [m for m in managers if m.get('role', '').lower() == 'manager']
            if len(manager_users) == 1:
                params['assignee_name'] = manager_users[0]['name']
                params['assignee_id'] = manager_users[0]['_id']
                params['assignee_role'] = 'manager'
                print(f"✓ Smart match: Assigned to manager '{manager_users[0]['name']}'")
            elif len(manager_users) > 1:
                # Multiple managers - will ask user to choose
                params['assignee_role'] = 'manager'
                print(f"✓ Detected 'manager' - will ask user to choose from {len(manager_users)} managers")
        
        # Check for specific manager/HR names mentioned (if not already assigned)
        if not params.get('assignee_name'):
            managers = self._fetch_real_managers()
            for mgr in managers:
                name_lower = mgr['name'].lower()
                # Check if name appears in question
                if name_lower in question_lower:
                    params['assignee_name'] = mgr['name']
                    params['assignee_id'] = mgr['_id']
                    params['assignee_role'] = mgr.get('role', 'manager')
                    if mgr.get('role', '').lower() == 'hr':
                        params['skip_project'] = True
                    print(f"✓ Smart match: Found assignee '{mgr['name']}' ({mgr.get('role')})")
                    break
        
        
        # Check for deadline patterns
        deadline_patterns = [
            ('today', 'today'), ('tomorrow', 'tomorrow'), ('asap', 'ASAP'),
            ('by friday', 'by Friday'), ('by monday', 'by Monday'),
            ('by tuesday', 'by Tuesday'), ('by wednesday', 'by Wednesday'),
            ('by thursday', 'by Thursday'), ('by saturday', 'by Saturday'),
            ('by sunday', 'by Sunday'), ('next week', 'next week'),
            ('this week', 'this week'), ('end of day', 'end of day'),
            ('eod', 'end of day'), ('urgent', 'ASAP')
        ]
        for pattern, value in deadline_patterns:
            if pattern in question_lower:
                params['deadline'] = value
                print(f"✓ Smart match: Deadline = '{value}'")
                break
        
        # Check for priority patterns
        if 'urgent' in question_lower:
            params['priority_hint'] = 'urgent'
        elif 'high priority' in question_lower:
            params['priority_hint'] = 'high'
        elif 'low priority' in question_lower:
            params['priority_hint'] = 'low'
        
        # Check for miscellaneous/no project patterns
        misc_patterns = [
            'no project', 'without project', 'general task', 'misc task',
            'unassigned', 'not linked to', 'standalone'
        ]
        if any(pattern in question_lower for pattern in misc_patterns):
            params['skip_project'] = True
        
        # Extract title and description using NLP
        params = self._extract_title_and_description(question, params)
        
        # Apply smart defaults (only for text mode)
        params = self._apply_smart_defaults(params)
        
        return params
    
    def _extract_title_and_description(self, question: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Extract task title and description from natural language using NLP patterns
        
        Examples:
        - "Create task for HR to review payroll" -> title: "Review payroll"
        - "Assign task to manager: fix the login bug by tomorrow" -> title: "Fix the login bug"
        - "Tell Sarah to update the website" -> title: "Update the website"
        """
        import re
        
        # Skip if already extracted
        if params.get('title'):
            return params
        
        question_lower = question.lower()
        
        # Pattern 1: "to [action]" or "for [person] to [action]"
        # Example: "for HR to review payroll", "tell Sarah to update website"
        action_patterns = [
            r'to\s+([\w\s]+?)(?:\s+by\s+|\s+before\s+|\s*$)',  # "to review payroll by Friday"
            r'(?:for|assign|tell|remind)\s+\w+\s+to\s+([\w\s]+?)(?:\s+by\s+|\s+before\s+|\s*$)',  # "for HR to review"
        ]
        
        for pattern in action_patterns:
            match = re.search(pattern, question_lower)
            if match:
                title_candidate = match.group(1).strip()
                # Clean up common trailing words
                title_candidate = re.sub(r'\s+(today|tomorrow|asap|urgent|now)$', '', title_candidate)
                if len(title_candidate) > 5 and len(title_candidate) < 100:
                    params['title'] = title_candidate.title()
                    params['description'] = f"Task details: {title_candidate}"
                    print(f"✓ Extracted title: '{params['title']}'")
                    return params
        
        # Pattern 2: "task: [title]" or "task - [title]"
        task_delimiter_patterns = [
            r'task[:\-]\s+([\w\s]+?)(?:\s+by\s+|\s+before\s+|\s*$)',
            r'create\s+(?:a\s+)?task\s+(?:called\s+|titled\s+)?["\']?([^"\']+?)["\']?(?:\s+for\s+|\s+to\s+|\s*$)'
        ]
        
        for pattern in task_delimiter_patterns:
            match = re.search(pattern, question_lower)
            if match:
                title_candidate = match.group(1).strip()
                if len(title_candidate) > 5 and len(title_candidate) < 100:
                    params['title'] = title_candidate.title()
                    params['description'] = f"Task details: {title_candidate}"
                    print(f"✓ Extracted title: '{params['title']}'")
                    return params
        
        # Pattern 3: After action verbs like "fix", "update", "review", "check", etc.
        action_verbs = ['fix', 'update', 'review', 'check', 'complete', 'finish', 'prepare', 'create', 'setup', 'configure']
        for verb in action_verbs:
            pattern = rf'{verb}\s+((?:the\s+)?[\w\s]+?)(?:\s+by\s+|\s+before\s+|\s+for\s+|\s*$)'
            match = re.search(pattern, question_lower)
            if match:
                title_candidate = f"{verb} {match.group(1)}".strip()
                if len(title_candidate) > 5 and len(title_candidate) < 100:
                    params['title'] = title_candidate.title()
                    params['description'] = f"Task details: {title_candidate}"
                    print(f"✓ Extracted title: '{params['title']}'")
                    return params
        
        return params
    
    def _apply_smart_defaults(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Apply smart defaults for missing non-critical parameters
        
        This allows for faster task creation by auto-filling:
        - Description (use title if not provided)
        - Deadline (based on urgency keywords)
        - Project (use Miscellaneous for HR or if not specified)
        """
        # Default description: use title if not provided
        if not params.get('description') and params.get('title'):
            params['description'] = f"{params['title']} - created via voice"
            params['_auto_description'] = True
            print(f"✓ Auto-generated description from title")
        
        # Default deadline based on urgency
        if not params.get('deadline'):
            priority_hint = (params.get('priority_hint') or '').lower()
            title_lower = (params.get('title') or '').lower()
            if priority_hint == 'urgent' or any(word in title_lower for word in ['urgent', 'asap', 'critical']):
                params['deadline'] = 'tomorrow'
                print("✓ Auto-set deadline: tomorrow (detected urgency)")
            else:
                params['deadline'] = 'next week'
                print("✓ Auto-set deadline: next week (default)")
        
        # Default project for HR tasks or if not specified
        assignee_role = (params.get('assignee_role') or '').lower()
        if assignee_role == 'hr' and not params.get('project_name'):
            params['skip_project'] = True
            params['project_name'] = 'Miscellaneous'
            print("✓ Auto-set project: Miscellaneous (HR task)")
        elif not params.get('project_name') and not params.get('project_id'):
            # If no project specified, default to Miscellaneous for faster flow
            params['skip_project'] = True
            params['project_name'] = 'Miscellaneous'
            print("✓ Auto-set project: Miscellaneous (not specified)")
        
        return params
    
    def _enhance_cofounder_task(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Enhance task parameters based on cofounder requirements:
        - Higher priority (urgent or high)
        - Higher points based on deadline urgency
        - Mark as cofounder-initiated
        - Convert deadline to ISO 8601 format
        
        Args:
            params: Extracted parameters
            
        Returns:
            Enhanced parameters
        """
        enhanced = params.copy()
        
        # Calculate deadline urgency (days until deadline)
        deadline_urgency = self._calculate_deadline_urgency(params.get("deadline"))
        
        # Convert deadline text to ISO 8601 format
        enhanced["deadline_iso"] = self._convert_deadline_to_iso(params.get("deadline"), deadline_urgency["days"])
        
        # Auto-assign priority based on deadline and user hint
        if params.get("priority_hint") == "urgent":
            enhanced["priority"] = "urgent"
            enhanced["points"] = params.get("points_hint") or max(5, deadline_urgency["suggested_points"])
        elif deadline_urgency["days"] is not None and deadline_urgency["days"] <= 2:
            enhanced["priority"] = "urgent"
            enhanced["points"] = params.get("points_hint") or max(5, deadline_urgency["suggested_points"])
        elif deadline_urgency["days"] is not None and deadline_urgency["days"] <= 5:
            enhanced["priority"] = "high"
            enhanced["points"] = params.get("points_hint") or max(3, deadline_urgency["suggested_points"])
        else:
            enhanced["priority"] = params.get("priority_hint") or "high"  # Default to high for cofounder
            enhanced["points"] = params.get("points_hint") or 3
        
        # Mark as cofounder-initiated
        enhanced["source"] = "cofounder_rag"
        enhanced["requires_override"] = deadline_urgency["days"] is not None and deadline_urgency["days"] <= 2
        
        # Add explanation for user
        enhanced["_explanation"] = {
            "deadline_urgency": deadline_urgency,
            "auto_priority_reason": self._explain_priority(enhanced["priority"], deadline_urgency),
            "auto_points_reason": f"Assigned {enhanced['points']} points based on urgency and complexity"
        }
        
        return enhanced
    
    def _calculate_deadline_urgency(self, deadline_text: Optional[str]) -> Dict[str, Any]:
        """Calculate deadline urgency in days"""
        if not deadline_text:
            return {"days": None, "suggested_points": 3, "urgency_level": "unknown"}
        
        # Simple heuristic parsing (can be enhanced with dateparser library)
        deadline_lower = deadline_text.lower()
        
        if any(word in deadline_lower for word in ["today", "asap", "immediately", "now"]):
            return {"days": 0, "suggested_points": 8, "urgency_level": "immediate"}
        elif any(word in deadline_lower for word in ["tomorrow", "1 day"]):
            return {"days": 1, "suggested_points": 6, "urgency_level": "very_urgent"}
        elif any(word in deadline_lower for word in ["2 days", "day after"]):
            return {"days": 2, "suggested_points": 5, "urgency_level": "urgent"}
        elif any(word in deadline_lower for word in ["this week", "3 days", "4 days", "5 days"]):
            return {"days": 5, "suggested_points": 4, "urgency_level": "high"}
        elif any(word in deadline_lower for word in ["next week", "week"]):
            return {"days": 7, "suggested_points": 3, "urgency_level": "medium"}
        else:
            return {"days": 7, "suggested_points": 3, "urgency_level": "medium"}
    
    def _explain_priority(self, priority: str, urgency: Dict[str, Any]) -> str:
        """Generate explanation for auto-assigned priority"""
        if urgency["days"] is None:
            return f"Set to {priority.upper()} as cofounder-initiated tasks have elevated priority"
        elif urgency["days"] <= 2:
            return f"Set to URGENT due to {urgency['days']}-day deadline - will override conflicting tasks"
        elif urgency["days"] <= 5:
            return f"Set to HIGH due to {urgency['days']}-day deadline"
        else:
            return f"Set to {priority.upper()} for cofounder-initiated task"
    
    def _convert_deadline_to_iso(self, deadline_text: Optional[str], urgency_days: Optional[int]) -> str:
        """
        Convert deadline text to ISO 8601 format
        
        Args:
            deadline_text: Natural language deadline
            urgency_days: Number of days from urgency calculation
            
        Returns:
            ISO 8601 formatted date string
        """
        from datetime import datetime, timedelta
        
        if not deadline_text:
            # Default to 7 days from now
            deadline = datetime.now() + timedelta(days=7)
        elif urgency_days is not None:
            # Use calculated urgency days
            deadline = datetime.now() + timedelta(days=urgency_days)
        else:
            # Try to parse specific day names
            deadline_lower = deadline_text.lower()
            today = datetime.now()
            
            # Check for day names (monday, tuesday, etc.)
            day_names = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
            for i, day_name in enumerate(day_names):
                if day_name in deadline_lower:
                    # Calculate days until that day
                    current_weekday = today.weekday()  # 0 = Monday, 6 = Sunday
                    target_weekday = i
                    
                    days_ahead = target_weekday - current_weekday
                    if days_ahead <= 0:  # Target day already passed this week
                        days_ahead += 7
                    
                    deadline = today + timedelta(days=days_ahead)
                    break
            else:
                # Default to 7 days if can't parse
                deadline = today + timedelta(days=7)
        
        # Set time to end of day (23:59:59)
        deadline = deadline.replace(hour=23, minute=59, second=59, microsecond=0)
        
        return deadline.isoformat()
    
    def _generate_confirmation_message(self, params: Dict[str, Any]) -> str:
        """Generate user-friendly confirmation message"""
        msg = f"I'll create a task with the following details:\n\n"
        msg += f"**Title:** {params.get('title', 'Untitled')}\n"
        msg += f"**Description:** {params.get('description', 'No description')}\n"
        msg += f"**Assignee:** {params.get('assignee_name', 'Not specified - needs selection')}\n"
        
        if params.get('project_name'):
            msg += f"**Project:** {params['project_name']}\n"
        else:
            msg += f"**Project:** Not specified - needs selection\n"
        
        msg += f"**Priority:** {params.get('priority', 'high').upper()}"
        
        if params.get('requires_override'):
            msg += " ⚠️ (will override conflicting tasks)"
        
        msg += f"\n**Points:** {params.get('points', 3)}\n"
        
        if params.get('deadline'):
            msg += f"**Deadline:** {params['deadline']}\n"
        
        if params.get('_explanation'):
            msg += f"\n*{params['_explanation']['auto_priority_reason']}*"
        
        return msg
    
    def _check_missing_parameters(self, params: Dict[str, Any]) -> List[str]:
        """Check which required parameters are missing
        
        For proper conversational flow, we ask for title, description, and assignee explicitly.
        Project and deadline have smart defaults but can be asked if needed.
        """
        missing = []
        
        # REQUIRED #1: Title - always ask first
        if not params.get('title'):
            missing.append('title')
        
        # REQUIRED #2: Description - ask second
        if not params.get('description'):
            missing.append('description')
        
        # REQUIRED #3: Assignee - ask third (only if they didn't specify)
        # Allow role hints like "manager" or "HR" but still ask for confirmation
        if not params.get('assignee_name') and not params.get('assignee_id'):
            missing.append('assignee')
        
        # Project and deadline are optional with smart defaults
        # Only ask if user hasn't given any hints
        
        return missing
    
    def _generate_next_question(
        self,
        missing_param: str,
        collected_params: Dict[str, Any],
        context: str,
        is_voice: bool = False
    ) -> tuple:
        """Generate the next question to ask the user with REAL data from database
        
        Args:
            missing_param: Which parameter we need next
            collected_params: Already collected parameters
            context: Additional context
            is_voice: If True, use conversational voice-friendly language
        """
        suggestions = []
        
        if missing_param == 'title':
            if is_voice:
                question = "What should the task be called? Just tell me the task name."
            else:
                question = "📝 What should I name this task? (Keep it brief, max 100 characters)"
            
        elif missing_param == 'description':
            title = collected_params.get('title', 'this task')
            if is_voice:
                question = f"Got it! Now tell me more about what needs to be done for '{title}'."
            else:
                question = f"📄 Great! Can you provide more details about **{title}**? What exactly needs to be done?"
            
        elif missing_param == 'project':
            # ACTUALLY fetch projects from database
            try:
                projects = self._fetch_real_projects()
                if projects:
                    if is_voice:
                        question = "Which project should this task belong to? "
                        project_names = [proj['name'] for proj in projects[:5]]
                        question += "Just tell me the project name from: " + ", ".join(project_names)
                        if len(projects) > 5:
                            question += f", or {len(projects) - 5} others."
                        question += " Say 'general task' if it's not for a specific project."
                    else:
                        question = "📁 Which project should this task be assigned to?\n\n**Available Projects:**\n"
                        question += "  0. 🏷️ **No Project (Miscellaneous Task)**\n"  # Add misc option
                        for i, proj in enumerate(projects[:10], 1):  # Limit to 10
                            question += f"  {i}. {proj['name']}"
                            if proj.get('status'):
                                question += f" ({proj['status']})"
                            question += "\n"
                        question += "\n*Type the project name, number, or say 'no project' for miscellaneous*"
                    suggestions = [{"label": "No Project", "value": "0"}] + [{"label": proj['name'], "value": proj['name']} for proj in projects[:4]]
                else:
                    if is_voice:
                        question = "Which project should this task belong to? Tell me the project name, or say 'general task'."
                    else:
                        question = "📁 Which project should this task be assigned to?\n(Type the project name, or say 'no project' for miscellaneous)"
            except Exception as e:
                print(f"Error fetching projects: {e}")
                if is_voice:
                    question = "Which project should this task belong to? Just tell me the project name."
                else:
                    question = "📁 Which project should this task be assigned to?\n(Type the project name, or say 'no project' for miscellaneous)"
            
        elif missing_param == 'assignee':
            # ACTUALLY fetch managers from database
            try:
                managers = self._fetch_real_managers()
                if managers:
                    if is_voice:
                        question = "Who should I assign this to? "
                        manager_names = [f"{mgr['name']}" for mgr in managers[:5]]
                        question += "You can tell me: " + ", ".join(manager_names)
                        if len(managers) > 5:
                            question += f", or any of the other {len(managers) - 5} team members."
                    else:
                        question = "👤 Who should I assign this to?\n\n**Available Managers/HR:**\n"
                        for i, mgr in enumerate(managers[:10], 1):  # Limit to 10
                            question += f"  {i}. {mgr['name']} ({mgr['role']})\n"
                        question += "\n*Type the manager name or number*"
                    suggestions = [{"label": mgr['name'], "value": mgr['name']} for mgr in managers[:5]]
                else:
                    if is_voice:
                        question = "Who should I assign this task to? Just tell me their name."
                    else:
                        question = "👤 Who should I assign this to? (Type the manager/HR name)"
            except Exception as e:
                print(f"Error fetching managers: {e}")
                if is_voice:
                    question = "Who should I assign this task to? Just tell me their name."
                else:
                    question = "👤 Who should I assign this to? (Type the manager/HR name)"
            
        elif missing_param == 'deadline':
            if is_voice:
                question = "When does this need to be done? You can tell me like 'by Friday', 'tomorrow', or 'next week'."
            else:
                question = "📅 When does this need to be completed? (You can say 'by Friday', 'tomorrow', or specify a date)"
            suggestions = [
                {"label": "Today", "value": "today"},
                {"label": "Tomorrow", "value": "tomorrow"},
                {"label": "This week", "value": "this week"},
                {"label": "Next week", "value": "next week"}
            ]
        
        else:
            question = f"I need more information about: {missing_param}"
        
        return question, suggestions
    
    def _fetch_real_projects(self) -> List[Dict[str, Any]]:
        """Fetch actual projects from MongoDB"""
        try:
            from data_fetcher import DataFetcher
            fetcher = DataFetcher()
            fetcher.connect()
            
            projects_collection = fetcher.db['projects']
            projects = list(projects_collection.find(
                {"status": {"$ne": "deleted"}},
                {"name": 1, "status": 1, "_id": 1}
            ).sort("createdAt", -1).limit(20))
            
            fetcher.disconnect()
            
            return [{"name": p["name"], "status": p.get("status", "active"), "_id": str(p["_id"])} for p in projects]
        except Exception as e:
            print(f"Error fetching projects: {e}")
            return []
    
    def _fetch_real_managers(self) -> List[Dict[str, Any]]:
        """Fetch actual managers/HR from MongoDB"""
        try:
            from data_fetcher import DataFetcher
            fetcher = DataFetcher()
            fetcher.connect()
            
            users_collection = fetcher.db['users']
            managers = list(users_collection.find(
                {"role": {"$in": ["manager", "hr"]}, "isActive": True},
                {"firstName": 1, "lastName": 1, "role": 1, "_id": 1}
            ).limit(20))
            
            fetcher.disconnect()
            
            return [{
                "name": f"{m.get('firstName', '')} {m.get('lastName', '')}".strip(),
                "role": m.get("role", "manager"),
                "_id": str(m["_id"])
            } for m in managers]
        except Exception as e:
            print(f"Error fetching managers: {e}")
            return []
    
    def _generate_final_confirmation(self, params: Dict[str, Any], is_voice: bool = False) -> str:
        """Generate final confirmation before task creation
        
        Args:
            params: Collected task parameters
            is_voice: If True, use conversational voice-friendly format
        """
        if is_voice:
            # VOICE OPTIMIZED: Clear confirmation with instruction to speak
            assignee = params.get('assignee_name', 'assignee')
            title = params.get('title', 'task')
            deadline = params.get('deadline', 'next week')
            msg = f"Perfect! Creating '{title}' for {assignee}, due {deadline}. "
            msg += "Say 'confirm' to create it, or 'cancel' to stop."
        else:
            # Text mode (formatted markdown)
            msg = "✅ Perfect! I have all the information needed. Here's what I'll create:\n\n"
            msg += f"**📝 Task:** {params.get('title')}\n"
            msg += f"**📄 Description:** {params.get('description')}\n"
            
            if params.get('skip_project') or params.get('assignee_role', '').lower() == 'hr':
                msg += "**📁 Project:** General Task (No Project)\n"
            else:
                msg += f"**📁 Project:** {params.get('project_name', 'Selected project')}\n"
            
            msg += f"**👤 Assignee:** {params.get('assignee_name', 'Selected manager/HR')}"
            if params.get('assignee_role'):
                msg += f" ({params.get('assignee_role').upper()})"
            msg += "\n"
            
            msg += f"**📅 Deadline:** {params.get('deadline')}\n"
            msg += f"**⚡ Priority:** {params.get('priority', 'HIGH').upper()}"
            
            if params.get('requires_override'):
                msg += " (⚠️ Will override conflicting tasks)"
            
            msg += f"\n**🎯 Points:** {params.get('points', 3)}"
            
            if params.get('_explanation'):
                msg += f"\n\n💡 *{params['_explanation']['auto_priority_reason']}*"
            
            msg += "\n\n**Type 'confirm' to create this task, or 'cancel' to abort.**"
        
        return msg
    
    def _continue_conversation(
        self,
        user_response: str,
        conversation_state: Dict[str, Any],
        category: Optional[str] = None,
        is_voice: bool = False
    ) -> Dict[str, Any]:
        """
        Continue a multi-turn conversation for task creation
        
        Args:
            user_response: User's answer to the previous question
            conversation_state: Current state of the conversation
            category: Optional category filter
            is_voice: If True, use conversational voice-friendly language
            
        Returns:
            Next step in conversation or completion
        """
        current_step = conversation_state.get('step')
        collected_params = conversation_state.get('collected_params', {})
        
        # Handle confirmation step
        if current_step == 'confirm':
            response_lower = user_response.lower().strip()
            # Expanded confirmation keywords for voice
            confirm_keywords = [
                'confirm', 'yes', 'y', 'ok', 'okay', 'create', 'go ahead',
                'sure', 'do it', 'please', 'correct', 'that is correct',
                "that's correct", 'yep', 'yeah', 'absolutely', 'definitely',
                'create it', 'make it', 'go for t', 'proceed', 'approved'
            ]
            # Check if any confirmation keyword is in the response
            is_confirmed = any(kw in response_lower for kw in confirm_keywords)
            if is_confirmed:
                # User confirmed - ready to execute
                return {
                    "is_action": True,
                    "action_complete": True,
                    "execute_now": True,
                    "action_type": "create_task",
                    "action_params": collected_params,
                    "answer": "🚀 Creating your task now...",
                    "success": True,
                    "timestamp": datetime.now().isoformat()
                }
            elif user_response.lower().strip() in ['cancel', 'no', 'n', 'abort', 'stop']:
                return {
                    "is_action": False,
                    "answer": "❌ Task creation cancelled. Let me know if you need anything else!",
                    "success": True,
                    "timestamp": datetime.now().isoformat()
                }
        
        # Update the collected parameter based on current step
        if current_step == 'title':
            collected_params['title'] = user_response.strip()[:100]
        elif current_step == 'description':
            collected_params['description'] = user_response.strip()
        elif current_step == 'project':
            response_lower = user_response.strip().lower()
            
            # Check for no project / miscellaneous option
            misc_patterns = ['no project', 'none', 'miscellaneous', 'misc', 'general', 'standalone', '0', 'bina project', 'no']
            if response_lower in misc_patterns or any(p in response_lower for p in ['no project', 'miscellaneous', 'general task']):
                collected_params['skip_project'] = True
                collected_params['project_name'] = 'Miscellaneous'
                print("✓ User selected: Miscellaneous task (no project)")
            else:
                # Check if user is asking for list/options
                is_meta_command = any(keyword in response_lower for keyword in [
                    'list', 'show', 'options', 'what are', 'give me', 'tell me', 
                    'display', 'available', 'which one', 'what projects', 'select'
                ])
                
                if is_meta_command and len(response_lower.split()) <= 10:
                    # Re-display the project list
                    next_question, suggestions = self._generate_next_question('project', collected_params, "", is_voice)
                    return {
                        "question": user_response,
                        "is_action": True,
                        "action_type": "create_task",
                        "conversation_state": conversation_state,
                        "answer": next_question,
                        "suggestions": suggestions,
                        "action_complete": False,
                        "success": True,
                        "timestamp": datetime.now().isoformat()
                    }
                
                # Check if user typed a number (selection from list)
                if user_response.strip().isdigit():
                    num = int(user_response.strip())
                    if num == 0:
                        # User selected miscellaneous
                        collected_params['skip_project'] = True
                        collected_params['project_name'] = 'Miscellaneous'
                        print("✓ User selected: Miscellaneous task (no project)")
                    else:
                        projects = self._fetch_real_projects()
                        if 1 <= num <= len(projects):
                            collected_params['project_name'] = projects[num - 1]['name']
                            collected_params['project_id'] = projects[num - 1]['_id']
                        else:
                            # Invalid number, re-ask
                            next_question, suggestions = self._generate_next_question('project', collected_params, "", is_voice)
                            return {
                                "question": user_response,
                                "is_action": True,
                                "action_type": "create_task",
                                "conversation_state": conversation_state,
                                "answer": f"❌ Invalid number. Please select a valid project (0 for No Project).\n\n{next_question}",
                                "suggestions": suggestions,
                                "action_complete": False,
                                "success": True,
                                "timestamp": datetime.now().isoformat()
                            }
                else:
                    # User typed a name - try to match it
                    projects = self._fetch_real_projects()
                    matched = None
                    for proj in projects:
                        if user_response.strip().lower() in proj['name'].lower() or proj['name'].lower() in user_response.strip().lower():
                            matched = proj
                            break
                    
                    if matched:
                        collected_params['project_name'] = matched['name']
                        collected_params['project_id'] = matched['_id']
                    else:
                        # No match found, re-ask
                        next_question, suggestions = self._generate_next_question('project', collected_params, "", is_voice)
                        return {
                            "question": user_response,
                            "is_action": True,
                            "action_type": "create_task",
                            "conversation_state": conversation_state,
                            "answer": f"❌ I couldn't find a project named '{user_response}'. Select from the list or say 'no project':\n\n{next_question}",
                            "suggestions": suggestions,
                            "action_complete": False,
                            "success": True,
                            "timestamp": datetime.now().isoformat()
                        }
                    
        elif current_step == 'assignee':
            response_lower = user_response.strip().lower()
            
            # Check if user is asking for list/options
            is_meta_command = any(keyword in response_lower for keyword in [
                'list', 'show', 'options', 'what are', 'give me', 'tell me',
                'display', 'available', 'which one', 'who are', 'select'
            ])
            
            if is_meta_command and len(response_lower.split()) <= 10:
                next_question, suggestions = self._generate_next_question('assignee', collected_params, "", is_voice)
                return {
                    "question": user_response,
                    "is_action": True,
                    "action_type": "create_task",
                    "conversation_state": conversation_state,
                    "answer": next_question,
                    "suggestions": suggestions,
                    "action_complete": False,
                    "success": True,
                    "timestamp": datetime.now().isoformat()
                }
            
            # Check if user typed a number
            if user_response.strip().isdigit():
                num = int(user_response.strip())
                managers = self._fetch_real_managers()
                if 1 <= num <= len(managers):
                    collected_params['assignee_name'] = managers[num - 1]['name']
                    collected_params['assignee_id'] = managers[num - 1]['_id']
                    collected_params['assignee_role'] = managers[num - 1].get('role', 'manager')
                    # If HR, skip project requirement
                    if managers[num - 1].get('role', '').lower() == 'hr':
                        collected_params['skip_project'] = True
                else:
                    next_question, suggestions = self._generate_next_question('assignee', collected_params, "", is_voice)
                    return {
                        "question": user_response,
                        "is_action": True,
                        "action_type": "create_task",
                        "conversation_state": conversation_state,
                        "answer": f"❌ Invalid number. Please select a valid manager.\n\n{next_question}",
                        "suggestions": suggestions,
                        "action_complete": False,
                        "success": True,
                        "timestamp": datetime.now().isoformat()
                    }
            else:
                # User typed a name - try to match it
                managers = self._fetch_real_managers()
                matched = None
                for mgr in managers:
                    if user_response.strip().lower() in mgr['name'].lower() or mgr['name'].lower() in user_response.strip().lower():
                        matched = mgr
                        break
                
                if matched:
                    collected_params['assignee_name'] = matched['name']
                    collected_params['assignee_id'] = matched['_id']
                    collected_params['assignee_role'] = matched.get('role', 'manager')
                    # If HR, skip project requirement
                    if matched.get('role', '').lower() == 'hr':
                        collected_params['skip_project'] = True
                else:
                    next_question, suggestions = self._generate_next_question('assignee', collected_params, "", is_voice)
                    return {
                        "question": user_response,
                        "is_action": True,
                        "action_type": "create_task",
                        "conversation_state": conversation_state,
                        "answer": f"❌ I couldn't find a manager/HR named '{user_response}'. Please select from the list:\n\n{next_question}",
                        "suggestions": suggestions,
                        "action_complete": False,
                        "success": True,
                        "timestamp": datetime.now().isoformat()
                    }
                    
        elif current_step == 'deadline':
            collected_params['deadline'] = user_response.strip()
        
        # Check what's still missing
        missing_info = self._check_missing_parameters(collected_params)
        
        if missing_info:
            # Ask for the next missing piece
            next_question, suggestions = self._generate_next_question(
                missing_info[0],
                collected_params,
                "",
                is_voice
            )
            
            return {
                "question": user_response,
                "is_action": True,
                "action_type": "create_task",
                "conversation_state": {
                    "step": missing_info[0],
                    "collected_params": collected_params,
                    "missing_params": missing_info,
                    "needs_data": missing_info[0] in ["project", "assignee"]
                },
                "answer": next_question,
                "suggestions": suggestions,
                "action_complete": False,
                "success": True,
                "timestamp": datetime.now().isoformat()
            }
        else:
            # All information collected - enhance and confirm
            enhanced_params = self._enhance_cofounder_task(collected_params)
            confirmation = self._generate_final_confirmation(enhanced_params, is_voice)
            
            return {
                "question": user_response,
                "is_action": True,
                "action_type": "create_task",
                "action_params": enhanced_params,
                "conversation_state": {
                    "step": "confirm",
                    "collected_params": enhanced_params,
                    "ready_to_execute": True
                },
                "answer": confirmation,
                "action_complete": False,
                "success": True,
                "timestamp": datetime.now().isoformat()
            }

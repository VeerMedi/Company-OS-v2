"""
Task Intelligence Enhancements
Advanced features for better task estimation
"""

from typing import Dict, List, Tuple
from datetime import datetime, timedelta
import re


class TaskEnhancements:
    """Advanced features for task intelligence"""
    
    # Phase prediction keywords
    PHASE_KEYWORDS = {
        'DevOps & Deployment': [
            'deploy', 'deployment', 'ci/cd', 'pipeline', 'docker', 'kubernetes',
            'aws', 'azure', 'cloud', 'infrastructure', 'server', 'hosting',
            'jenkins', 'github actions', 'terraform', 'ansible'
        ],
        'Frontend Development': [
            'ui', 'ux', 'react', 'vue', 'angular', 'css', 'html', 'javascript',
            'component', 'page', 'layout', 'responsive', 'navbar', 'button',
            'form', 'modal', 'frontend', 'client-side', 'browser'
        ],
        'Backend Development': [
            'api', 'endpoint', 'database', 'sql', 'backend', 'server-side',
            'authentication', 'authorization', 'middleware', 'service',
            'microservice', 'rest', 'graphql', 'nodejs', 'python', 'java'
        ],
        'AI Functionalities': [
            'ai', 'ml', 'machine learning', 'model', 'training', 'neural',
            'algorithm', 'prediction', 'classification', 'nlp', 'computer vision',
            'chatbot', 'recommendation', 'deep learning'
        ],
        'Testing & QA': [
            'test', 'testing', 'qa', 'quality', 'bug', 'fix', 'unit test',
            'integration test', 'e2e', 'selenium', 'jest', 'pytest', 'debug'
        ],
        'Integration': [
            'integrate', 'integration', 'third-party', 'api integration',
            'webhook', 'oauth', 'payment', 'stripe', 'paypal', 'external'
        ],
        'Documentation': [
            'document', 'documentation', 'readme', 'guide', 'tutorial',
            'wiki', 'manual', 'help','write docs', 'api docs'
        ],
        'Design': [
            'design', 'figma', 'sketch', 'mockup', 'wireframe', 'prototype',
            'ux design', 'ui design', 'branding', 'logo', 'graphics'
        ],
        'HR & Operations': [
            'hire', 'recruit', 'interview', 'onboard', 'training', 'meeting',
            'hr', 'employee', 'team building', 'performance review', 'hiring'
        ],
        'Marketing & Sales': [
            'marketing', 'campaign', 'sales', 'leads', 'seo', 'content',
            'social media', 'email', 'ads', 'promotion', 'branding'
        ]
    }
    
    @staticmethod
    def predict_phase(title: str, description: str) -> Dict:
        """
        Predict task phase from keywords
        
        Returns:
            {
                'predicted_phase': str,
                'confidence': float,
                'alternatives': List[Dict]
            }
        """
        text = f"{title} {description}".lower()
        
        # Score each phase
        phase_scores = {}
        for phase, keywords in TaskEnhancements.PHASE_KEYWORDS.items():
            score = 0
            matched_keywords = []
            for keyword in keywords:
                if keyword in text:
                    score += text.count(keyword)
                    matched_keywords.append(keyword)
            phase_scores[phase] = {
                'score': score,
                'matched_keywords': matched_keywords
            }
        
        # Sort by score
        sorted_phases = sorted(
            phase_scores.items(),
            key=lambda x: x[1]['score'],
            reverse=True
        )
        
        if not sorted_phases or sorted_phases[0][1]['score'] == 0:
            return {
                'predicted_phase': 'Backend Development',  # Default
                'confidence': 0.3,
                'alternatives': [],
                'reason': 'No specific keywords found, using default'
            }
        
        top_phase = sorted_phases[0]
        total_score = sum(p[1]['score'] for p in sorted_phases)
        confidence = top_phase[1]['score'] / total_score if total_score > 0 else 0.5
        
        alternatives = [
            {
                'phase': phase,
                'confidence': round(data['score'] / total_score, 2) if total_score > 0 else 0
            }
            for phase, data in sorted_phases[1:4]  # Top 3 alternatives
            if data['score'] > 0
        ]
        
        return {
            'predicted_phase': top_phase[0],
            'confidence': round(confidence, 2),
            'matched_keywords': top_phase[1]['matched_keywords'][:5],  # Top 5
            'alternatives': alternatives,
            'reason': f"Matched {len(top_phase[1]['matched_keywords'])} keywords for {top_phase[0]}"
        }
    
    @staticmethod
    def calculate_confidence_breakdown(
        word_count: int,
        keyword_matches: int,
        has_dependencies: bool,
        ambiguity_score: float,
        buzzword_density: float
    ) -> Dict:
        """
        Explain why confidence score is what it is
        
        Returns detailed breakdown of confidence factors
        """
        factors = []
        total_confidence = 0.0
        
        # Factor 1: Description length
        if word_count >= 30:
            impact = 0.25
            factors.append({
                'factor': 'Comprehensive description',
                'detail': f'{word_count} words provided',
                'impact': '+25%',
                'positive': True
            })
            total_confidence += impact
        elif word_count >= 15:
            impact = 0.15
            factors.append({
                'factor': 'Adequate description',
                'detail': f'{word_count} words',
                'impact': '+15%',
                'positive': True
            })
            total_confidence += impact
        else:
            impact = -0.10
            factors.append({
                'factor': 'Brief description',
                'detail': f'Only {word_count} words',
                'impact': '-10%',
                'positive': False
            })
            total_confidence += impact
        
        # Factor 2: Keyword matches
        if keyword_matches >= 5:
            impact = 0.30
            factors.append({
                'factor': 'Strong keyword match',
                'detail': f'{keyword_matches} technical terms found',
                'impact': '+30%',
                'positive': True
            })
            total_confidence += impact
        elif keyword_matches >= 2:
            impact = 0.20
            factors.append({
                'factor': 'Good keyword match',
                'detail': f'{keyword_matches} terms found',
                'impact': '+20%',
                'positive': True
            })
            total_confidence += impact
        
        # Factor 3: Dependencies specified
        if has_dependencies:
            impact = 0.15
            factors.append({
                'factor': 'Dependencies listed',
                'detail': 'Task relationships clear',
                'impact': '+15%',
                'positive': True
            })
            total_confidence += impact
        else:
            impact = -0.05
            factors.append({
                'factor': 'No dependencies listed',
                'detail': 'May have hidden blockers',
                'impact': '-5%',
                'positive': False
            })
            total_confidence += impact
        
        # Factor 4: Ambiguity
        if ambiguity_score > 3:
            impact = -0.15
            factors.append({
                'factor': 'High ambiguity detected',
                'detail': 'Contains vague language',
                'impact': '-15%',
                'positive': False
            })
            total_confidence += impact
        elif ambiguity_score < 1:
            impact = 0.10
            factors.append({
                'factor': 'Clear requirements',
                'detail': 'Well-defined scope',
                'impact': '+10%',
                'positive': True
            })
            total_confidence += impact
        
        # Factor 5: Buzzwords
        if buzzword_density > 0.1:
            impact = -0.10
            factors.append({
                'factor': 'Buzzword overuse',
                'detail': f'{int(buzzword_density * 100)}% buzzwords',
                'impact': '-10%',
                'positive': False
            })
            total_confidence += impact
        
        # Normalize to 0-1 range
        final_confidence = max(0.3, min(0.95, 0.5 + total_confidence))
        
        return {
            'confidence': round(final_confidence, 2),
            'factors': factors,
            'summary': f"{len([f for f in factors if f['positive']])} positive, {len([f for f in factors if not f['positive']])} negative factors"
        }
    
    @staticmethod
    def check_deadline_feasibility(
        estimated_points: int,
        deadline: str,  # ISO format
        position: str = 'mid'
    ) -> Dict:
        """
        Check if deadline is realistic given task complexity
        
        Args:
            estimated_points: AI-suggested points
            deadline: ISO datetime string
            position: Task position (early/mid/late)
            
        Returns:
            Feasibility analysis with recommendations
        """
        # Estimate hours: 1 point ≈ 2-3 hours on average
        hours_per_point = 2.5
        
        # Adjust for position
        if position == 'early':
            hours_per_point *= 1.2  # More unknowns
        elif position == 'late':
            hours_per_point *= 0.9  # Have momentum
        
        estimated_hours = estimated_points * hours_per_point
        
        # Calculate available time
        try:
            deadline_dt = datetime.fromisoformat(deadline.replace('Z', '+00:00'))
            now = datetime.utcnow()
            time_diff = deadline_dt - now
            
            # Assume 6 productive hours per workday
            available_days = time_diff.days
            available_hours = available_days * 6
            
            # Weekend adjustment
            if available_days > 2:
                weekends = available_days // 7
                available_hours -= (weekends * 2 * 6)  # Remove weekend hours
            
            # Calculate buffer
            recommended_hours = estimated_hours * 1.3  # 30% buffer
            
            feasible = available_hours >= recommended_hours
            utilization = (estimated_hours / available_hours * 100) if available_hours > 0 else 999
            
            if not feasible:
                # Calculate needed extension
                shortage_hours = recommended_hours - available_hours
                extra_days = int(shortage_hours / 6) + 1
                
                recommendation = f"Extend deadline by {extra_days} days or reduce scope by {int((shortage_hours / estimated_hours) * 100)}%"
                risk_level = 'high'
            elif utilization > 80:
                recommendation = "Deadline is tight but achievable with focused effort"
                risk_level = 'medium'
            else:
                recommendation = "Deadline allows comfortable completion with buffer time"
                risk_level = 'low'
            
            return {
                'feasible': feasible,
                'risk_level': risk_level,
                'estimated_hours': round(estimated_hours, 1),
                'available_hours': round(available_hours, 1),
                'utilization_percent': round(utilization, 1),
                'buffer_hours': round(available_hours - estimated_hours, 1),
                'recommendation': recommendation,
                'deadline_date': deadline_dt.strftime('%Y-%m-%d'),
                'days_available': available_days
            }
            
        except Exception as e:
            return {
                'feasible': True,
                'error': f"Could not parse deadline: {str(e)}",
                'recommendation': "Please verify deadline format (ISO 8601)"
            }
    
    @staticmethod
    def suggest_task_breakdown(
        title: str,
        description: str,
        estimated_points: int,
        phase: str
    ) -> Dict:
        """
        Suggest breaking task into subtasks if it's too large
        
        Args:
            title: Task title
            description: Task description
            estimated_points: AI-suggested points
            phase: Task phase
            
        Returns:
            Breakdown suggestions with subtasks
        """
        # Only suggest breakdown for large tasks
        if estimated_points < 20:
            return {
                'should_break': False,
                'reason': 'Task complexity is manageable',
                'estimated_points': estimated_points
            }
        
        text = f"{title} {description}".lower()
        suggestions = []
        
        # Pattern 1: Look for "and" connectors suggesting multiple tasks
        and_parts = [p.strip() for p in description.split(' and ') if len(p.strip()) > 10]
        if len(and_parts) > 2:
            for i, part in enumerate(and_parts[:4], 1):
                suggestions.append({
                    'title': f"{title.split()[0]} - Part {i}",
                    'description': part.capitalize(),
                    'estimated_points': max(5, estimated_points // len(and_parts))
                })
        
        # Pattern 2: Look for numbered/bulleted lists
        import re
        list_items = re.findall(r'[-•*]\s*(.+?)(?=[-•*]|$)', description, re.DOTALL)
        if not suggestions and len(list_items) >= 3:
            for i, item in enumerate(list_items[:5], 1):
                clean_item = item.strip()[:100]
                suggestions.append({
                    'title': f"{title} - {clean_item[:30]}",
                    'description': clean_item,
                    'estimated_points': max(5, estimated_points // len(list_items))
                })
        
        # Pattern 3: Domain-specific breakdowns
        if not suggestions:
            if 'authentication' in text or 'auth' in text:
                suggestions = [
                    {
                        'title': 'Implement token generation',
                        'description': 'JWT/session token creation and validation',
                        'estimated_points': int(estimated_points * 0.3)
                    },
                    {
                        'title': 'Build login/register endpoints',
                        'description': 'API endpoints for user authentication',
                        'estimated_points': int(estimated_points * 0.25)
                    },
                    {
                        'title': 'Add password security',
                        'description': 'Hashing, salting, and validation',
                        'estimated_points': int(estimated_points * 0.2)
                    },
                    {
                        'title': 'Setup session management',
                        'description': 'Session storage and expiration',
                        'estimated_points': int(estimated_points * 0.25)
                    }
                ]
            elif 'ci/cd' in text or 'pipeline' in text:
                suggestions = [
                    {
                        'title': 'Configure CI pipeline',
                        'description': 'Setup automated testing and builds',
                        'estimated_points': int(estimated_points * 0.4)
                    },
                    {
                        'title': 'Setup deployment automation',
                        'description': 'Configure auto-deploy to staging/prod',
                        'estimated_points': int(estimated_points * 0.35)
                    },
                    {
                        'title': 'Add monitoring and alerts',
                        'description': 'Setup deployment monitoring',
                        'estimated_points': int(estimated_points * 0.25)
                    }
                ]
            elif 'dashboard' in text or 'ui' in text:
                suggestions = [
                    {
                        'title': 'Design components and layout',
                        'description': 'Create reusable UI components',
                        'estimated_points': int(estimated_points * 0.3)
                    },
                    {
                        'title': 'Implement data fetching',
                        'description': 'API integration and state management',
                        'estimated_points': int(estimated_points * 0.35)
                    },
                    {
                        'title': 'Add interactivity and polish',
                        'description': 'Animations, responsiveness, error handling',
                        'estimated_points': int(estimated_points * 0.35)
                    }
                ]
        
        # If we found suggestions
        if suggestions:
            return {
                'should_break': True,
                'reason': f'Task complexity ({estimated_points} pts) suggests breaking into {len(suggestions)} subtasks',
                'estimated_points': estimated_points,
                'suggestions': suggestions,
                'total_subtask_points': sum(s['estimated_points'] for s in suggestions)
            }
        
        # Generic breakdown for large tasks
        num_parts = 3 if estimated_points < 35 else 4
        points_per_part = estimated_points // num_parts
        
        return {
            'should_break': True,
            'reason': f'Large task ({estimated_points} pts) - consider splitting',
            'estimated_points': estimated_points,
            'suggestions': [
                {
                    'title': f"{title} - Phase {i}",
                    'description': f"Part {i} of {num_parts}",
                    'estimated_points': points_per_part
                }
                for i in range(1, num_parts + 1)
            ],
            'total_subtask_points': points_per_part * num_parts,
            'note': 'Generic breakdown - please customize subtask descriptions'
        }

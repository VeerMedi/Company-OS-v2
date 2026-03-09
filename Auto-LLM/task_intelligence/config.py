"""
Configuration for Task Intelligence Engine
Phase-specific weights and scoring parameters
"""

# === VERSIONING ===
# Increment when scoring logic or weights change
#Change this when formula changes, not when API changes
SCORING_VERSION = "v1.1.0"

# === ANTI-BUZZWORD INFLATION GUARD ===
# Detects buzzword stuffing to prevent score inflation
BUZZWORDS = [
    'scalable', 'robust', 'enterprise-grade', 'enterprise',
    'next-gen', 'next generation', 'AI-driven', 'revolutionary',
    'cutting-edge', 'world-class', 'innovative', 'innovation',
    'disruptive', 'game-changing', 'paradigm shift', 'synergy',
    'leverage', 'utilize', 'optimize', 'maximize', 'streamline',
    'best-in-class', 'industry-leading', 'mission-critical'
]

# Buzzword threshold: % of total words
# If exceeded, apply inflation penalty
BUZZWORD_THRESHOLD = 0.05  # 5%
MAX_BUZZWORD_PENALTY = 0.20  # Max 20% score reduction

# === POSITION MULTIPLIERS ===
# Applied after base score calculation
# Rationale: Early tasks face more unknowns, late tasks have momentum
POSITION_MULTIPLIERS = {
    'early': 1.1,   # Higher risk, more uncertainty
    'mid': 1.0,     # Baseline
    'late': 0.9     # Established patterns, reduced unknowns
}

# Phase-specific dimension weights
PHASE_WEIGHTS = {
    'AI Functionalities': {
        'technical_depth': 0.25,
        'effort': 0.15,
        'ambiguity': 0.15,
        'dependencies': 0.10,
        'blast_radius': 0.15,
        'skill_level': 0.15,
        'cross_domain': 0.05
    },
    'Backend Development': {
        'technical_depth': 0.20,
        'effort': 0.15,
        'ambiguity': 0.10,
        'dependencies': 0.25,
        'blast_radius': 0.15,
        'skill_level': 0.10,
        'cross_domain': 0.05
    },
    'Frontend Development': {
        'technical_depth': 0.15,
        'effort': 0.20,
        'ambiguity': 0.10,
        'dependencies': 0.15,
        'blast_radius': 0.10,
        'skill_level': 0.15,
        'cross_domain': 0.15
    },
    'DevOps & Deployment': {
        'technical_depth': 0.20,
        'effort': 0.15,
        'ambiguity': 0.10,
        'dependencies': 0.20,
        'blast_radius': 0.25,
        'skill_level': 0.05,
        'cross_domain': 0.05
    },
    'Integration': {
        'technical_depth': 0.15,
        'effort': 0.15,
        'ambiguity': 0.15,
        'dependencies': 0.30,
        'blast_radius': 0.15,
        'skill_level': 0.05,
        'cross_domain': 0.05
    },
    'Full Stack Development': {
        'technical_depth': 0.18,
        'effort': 0.18,
        'ambiguity': 0.12,
        'dependencies': 0.18,
        'blast_radius': 0.12,
        'skill_level': 0.12,
        'cross_domain': 0.10
    },
    'Testing & QA': {
        'technical_depth': 0.15,
        'effort': 0.20,
        'ambiguity': 0.10,
        'dependencies': 0.20,
        'blast_radius': 0.20,
        'skill_level': 0.10,
        'cross_domain': 0.05
    },
    'Database & Architecture': {
        'technical_depth': 0.25,
        'effort': 0.15,
        'ambiguity': 0.10,
        'dependencies': 0.20,
        'blast_radius': 0.20,
        'skill_level': 0.10,
        'cross_domain': 0.00
    },
    'Design & UI/UX': {
        'technical_depth': 0.10,
        'effort': 0.25,
        'ambiguity': 0.15,
        'dependencies': 0.10,
        'blast_radius': 0.10,
        'skill_level': 0.20,
        'cross_domain': 0.10
    }
}

# Default weights if phase not found
DEFAULT_WEIGHTS = {
    'technical_depth': 0.18,
    'effort': 0.18,
    'ambiguity': 0.12,
    'dependencies': 0.18,
    'blast_radius': 0.14,
    'skill_level': 0.12,
    'cross_domain': 0.08
}

# Score to points conversion
SCORE_TO_POINTS = [
    (0, 20, 5),      # 0-20 → 5 points (Simple)
    (21, 35, 10),    # 21-35 → 10 points (Easy)
    (36, 50, 15),    # 36-50 → 15 points (Medium)
    (51, 65, 20),    # 51-65 → 20 points (Complex)
    (66, 80, 30),    # 66-80 → 30 points (Hard)
    (81, 100, 50)    # 81-100 → 50 points (Expert)
]

# Technical depth keywords (higher = more complex)
TECHNICAL_KEYWORDS = {
    'high': [
        # DevOps & Infrastructure (CRITICAL - was missing!)
        'ci/cd', 'pipeline', 'deployment', 'automation', 'jenkins', 'github actions',
        'terraform', 'ansible', 'chef', 'puppet', 'kubernetes', 'k8s', 'docker', 
        'container', 'orchestration', 'helm', 'cloud', 'aws', 'azure', 'gcp',
        'infrastructure', 'provisioning', 'monitoring', 'observability', 'prometheus',
        'grafana', 'elk', 'logging', 'load balancing', 'auto-scaling', 'vpc', 'networking',
        
        # AI/ML & Advanced Algorithms
        'algorithm', 'architecture', 'ML', 'machine learning', 'AI', 'artificial intelligence',
        'neural', 'deep learning', 'model training', 'distributed', 'optimization',
        'data pipeline', 'ETL', 'real-time', 'streaming', 'kafka', 'spark',
        
        # System Design & Performance
        'microservices', 'system design', 'scalability', 'concurrency', 'threading',
        'performance', 'caching', 'redis', 'memcached', 'database optimization',
        'indexing', 'sharding', 'replication',
        
        # Security & Cryptography
        'security', 'cryptography', 'encryption', 'authentication', 'authorization',
        'oauth', 'jwt', 'ssl/tls', 'penetration', 'vulnerability', 'blockchain'
    ],
    'medium': [
        # APIs &Integration
        'API', 'rest', 'graphql', 'webhook', 'websocket', 'grpc',
        'database', 'sql', 'nosql', 'mongodb', 'postgresql', 'mysql',
        'authentication', 'authorization', 'session', 'token',
        'validation', 'testing', 'unit test', 'integration test',
        'middleware', 'queue', 'message broker', 'rabbitmq',
        'configuration', 'environment', 'logging', 'error handling'
    ],
    'low': [
        # UI/Frontend Simple
        'UI', 'styling', 'layout', 'button', 'form', 'page', 'color', 'text', 
        'image', 'icon', 'font', 'margin', 'padding', 'css', 'html', 'responsive'
    ]
}

# Effort keywords
EFFORT_KEYWORDS = {
    'high': [
        # Major technical work
        'build from scratch', 'implement entire', 'migrate all', 'refactor complete',
        'redesign', 'overhaul', 'comprehensive', 'end-to-end', 'full system',
        
        # Non-technical major work
        'complete overhaul', 'full campaign', 'entire process', 'full recruitment',
        'comprehensive training', 'full audit', 'complete rebranding'
    ],
    'medium': [
        # Technical moderate
        'implement', 'develop', 'create', 'build', 'integrate', 'setup', 'configure',
        
        # Non-technical moderate  
        'design', 'write', 'create campaign', 'conduct', 'organize', 'plan',
        'coordinate', 'prepare', 'recruit', 'onboard', 'train', 'analyze'
    ],
    'low': [
        # Technical simple
        'update', 'modify', 'change', 'fix', 'adjust', 'tweak', 'style', 'format',
        
        # Non-technical simple
        'review', 'edit', 'proofread', 'respond', 'reply', 'schedule', 'send',
        'call', 'email', 'post', 'share', 'like', 'comment'
    ]
}

# Ambiguity keywords
AMBIGUITY_KEYWORDS = {
    'high': ['research', 'explore', 'investigate', 'evaluate', 'analyze', 'study', 
             'TBD', 'unclear', 'might', 'possibly', 'consider', '?', 'brainstorm',
             'ideate', 'discover', 'prototype', 'experiment'],
    'medium': ['optimize', 'improve', 'enhance', 'better', 'efficient', 'streamline',
                'refine', 'polish', 'revise'],
    'low': ['specific', 'exactly', 'precisely', 'defined', 'clear', 'documented',
            'specified', 'listed', 'outlined', 'detailed']
}

# Dependency keywords
DEPENDENCY_KEYWORDS = ['depends on', 'requires', 'needs', 'after', 'blocked by', 
                       'integration with', 'connected to', 'relies on', 'waiting for',
                       'prerequisite', 'requires approval']

# Blast radius keywords
BLAST_RADIUS_KEYWORDS = {
    'critical': [
        # Technical critical
        'production', 'critical', 'core', 'all users', 'breaking', 'system-wide',
        'global', 'entire platform', 'mission critical',
        
        # Business critical
        'company-wide', 'all employees', 'public-facing', 'revenue impact',
        'legal requirement', 'compliance', 'brand reputation'
    ],
    'major': [
        # Technical major
        'main', 'primary', 'important', 'key', 'essential', 'significant',
        
        # Business major
        'department-wide', 'customer-facing', 'client delivery', 'team-wide'
    ],
    'minor': [
        # Technical minor
        'optional', 'secondary', 'minor', 'small', 'limited', 'isolated',
        
        # Business minor
        'internal only', 'single person', 'personal', 'individual'
    ]
}

# Skill level keywords
SKILL_KEYWORDS = {
    'expert': [
        # Technical expert
        'senior', 'expert', 'advanced', 'complex', 'specialist', 'architect', 
        'lead', 'principal',
        
        # Non-technical expert
        'executive', 'director', 'VP', 'C-level', 'strategic', 'senior manager'
    ],
    'intermediate': [
        # Technical intermediate
        'intermediate', 'solid', 'experienced', 'familiar',
        
        # Non-technical intermediate
        'manager', 'supervisor', 'coordinator', 'analyst', 'specialist'
    ],
    'junior': [
        # Technical junior
        'simple', 'basic', 'straightforward', 'easy', 'beginner',
        
        # Non-technical junior
        'entry-level', 'assistant', 'associate', 'intern', 'trainee'
    ]
}

# Cross-domain indicators
CROSS_DOMAIN_KEYWORDS = [
    # Technical cross-domain
    'full-stack', 'frontend and backend', 'end-to-end', 
    'multiple systems', 'across', 'integration', 'fullstack',
    
    # Business cross-domain
    'cross-functional', 'multi-department', 'interdisciplinary',
    'sales and marketing', 'hr and operations', 'finance and legal',
    'technical and business',  'internal and external'
]

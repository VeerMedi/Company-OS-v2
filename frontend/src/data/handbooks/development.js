export const developmentHandbook = {
  title: "Development Department Handbook",
  subtitle: "For: Full-Stack Developers, ML Engineers",
  managedBy: "CTO (Swarub)",
  escalation: "Founder",
  version: "1.0",
  
  sections: [
    {
      id: 1,
      title: "Department Overview",
      content: `The Development Department is responsible for execution-focused delivery and scalability of all client and internal products. The department operates strictly as a service-oriented, order-taking execution unit, where requirements are driven by approved documentation and timelines are governed by the CTO.

The department does not redefine product scope but ensures reliable, structured, and documented execution of approved requirements.`,
      principles: [
        "Clean, maintainable code",
        "Proper documentation",
        "Controlled deployments",
        "Adherence to SRS-defined scope"
      ]
    },
    {
      id: 2,
      title: "Hierarchy & Reporting Structure",
      content: `**Roles:**
• CTO (Head of Development) – Swarub
• Full-Stack Developers (2)
• ML Engineer (1)

**Reporting Flow:**
• Developers → CTO
• If CTO unavailable → Founder

**Authority:**
• Developers may make implementation and architectural decisions as long as they do not violate the SRS.
• Final authority on timelines rests with the CTO.
• Developers cannot reject requirements, even if they impact scalability or clean-code ideals.`
    },
    {
      id: 3,
      title: "Work Intake & Handover SOP",
      content: `**Entry Point:**
Work enters the Development Department only after Sales onboarding.

**Mandatory Inputs:**
• Approved Proposal
• SRS (Software Requirement Specification)

**Handover Process:**
1. Sales conducts a formal briefing with the Development team.
2. Clarifications, if required, are routed via the Sales POC.
3. Developers do not directly extract requirements from clients.`
    },
    {
      id: 4,
      title: "Development Methodology",
      content: `**Model:**
• Agile (execution-focused)

**Standard Phases:**
1. Requirement Analysis
2. Architecture Design
3. Development
4. Testing
5. Deployment

**Definition of "Done":**
• Skeleton/basic implementation aligned with SRS
• Delivered to client for testing`
    },
    {
      id: 5,
      title: "Task Execution & Tracking",
      content: `**Tools:**
• No mandatory tools enforced
• Commonly used: VS Code, Google Antigravity

**Daily Updates:**
• Mandatory daily task updates
• Purpose: performance visibility and progress tracking

**Proof of Work:**
• Not mandatory per task
• CTO evaluates:
  - Code structure
  - Feature implementation quality`
    },
    {
      id: 6,
      title: "Code Management & Branching Rules",
      content: `**Git Rules:**
• Direct pushes to main/production: STRICTLY FORBIDDEN
• All work must branch from development

**Pull Requests:**
• Mandatory for major features
• Encouraged for collaborative development
• PR reviews are not mandatory for every change`
    },
    {
      id: 7,
      title: "Documentation Standards",
      content: `**Mandatory Documentation:**
• Architecture Diagram
• Basic README (project overview + structure)

**Storage:**
• Documentation may be stored locally on developer machines

**Compliance:**
• Delivery without documentation is considered incomplete`
    },
    {
      id: 8,
      title: "Testing Protocol",
      content: `**Testing Rules:**
• Mandatory for core/critical features
• Optional for AI features

**Method:**
• Manual testing via data flow validation

**Responsibility:**
• Initial testing: Same developer
• Final testing: Client`
    },
    {
      id: 9,
      title: "Deployment & Incident Handling",
      content: `**Deployment Authority:**
• ML Engineer / VIR

**Failure Handling:**
• Production issues fixed by ML Engineer

**Responsibility:**
• Deployment stability ownership lies with deployment executor`
    },
    {
      id: 10,
      title: "Client Communication Policy",
      content: `• Developers must not communicate directly with clients
• Exceptions allowed only if explicitly approved
• All requirements flow via Sales POC`
    },
    {
      id: 11,
      title: "Performance Evaluation",
      content: `**Primary Metric:**
• Timely delivery (over code quality)

**Supporting Factors:**
• Daily updates consistency
• Feature completeness`
    },
    {
      id: 12,
      title: "Escalation & Blockers",
      content: `• Developers must escalate blockers through another developer
• CTO escalation only for extreme urgency`
    },
    {
      id: 13,
      title: "Professional Conduct & Security",
      content: `• No direct sharing of repositories externally
• No uncontrolled handling of client data
• Credential leaks or unauthorized access are zero-tolerance violations`
    },
    {
      id: 14,
      title: "Alignment With Sales Department",
      content: `• Development strictly follows approved Sales outputs
• Scope deviations are not permitted without Sales + CTO confirmation`
    },
    {
      id: 15,
      title: "Core Principles",
      principles: [
        "Execution over ideation",
        "Documentation over assumption",
        "Discipline over speed",
        "Accountability over convenience"
      ]
    }
  ]
};

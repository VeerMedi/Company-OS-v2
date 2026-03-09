import google.generativeai as genai
import os
import textwrap
# === SETUP GOOGLE GEMINI ===
# Replace YOUR_API_KEY with your actual Gemini API key
genai.configure(api_key="AIzaSyDVcK0L8BnDa-ISmEtPKvkWsoPYSKpvui0")

def generate_task_breakdown(project_name: str, project_description: str):
    prompt = f"""
You are a project management assistant specializing in parallel project execution.
Break down the project into PARALLEL BUNCHES (phases) that can be executed simultaneously by different teams.

Project Name: {project_name}
Project Description / SRS:
{project_description}

IMPORTANT RULES:
1. Group tasks into PARALLEL bunches like: Frontend Development, Backend Development, AI Functionalities, Testing & QA, DevOps & Deployment
2. Each bunch should be self-contained and executable in parallel
3. If integration is needed, create a separate "Integration" bunch that comes after development bunches
4. Use ONLY these phase names: Frontend Development, Backend Development, Full Stack Development, Integration, AI Functionalities, Testing & QA, DevOps & Deployment, Production & Deployment, Design & UI/UX, Database & Architecture, Security & Performance, Documentation
5. Make micro-tasks within each bunch so senior developers can delegate to interns

Output format:

PHASE: Frontend Development
1. TASK: Create login page UI
   DESCRIPTION: Design and implement responsive login form with validation
   COMPLEXITY: Medium
   ASSIGNEE: Frontend Developer

2. TASK: Build dashboard layout
   DESCRIPTION: Create main dashboard structure with sidebar and header
   COMPLEXITY: High
   ASSIGNEE: Frontend Developer

PHASE: Backend Development
1. TASK: Setup authentication API
   DESCRIPTION: Create JWT-based auth endpoints for login/register
   COMPLEXITY: High
   ASSIGNEE: Backend Developer

(Continue with all bunches in parallel format)

Be specific, actionable, and create 3-8 micro-tasks per bunch for delegation.
"""

    model = genai.GenerativeModel("gemini-2.5-flash")
    response = model.generate_content(prompt)
    return response.text.strip()


if __name__ == "__main__":
    print("=== Project Task Breakdown Generator (Gemini) ===\n")
    project_name = input("Enter project name: ")
    print("\nEnter project description/SRS (press Enter twice to finish):")

    # Multi-line input for project description
    lines = []
    while True:
        line = input()
        if line.strip() == "":
            break
        lines.append(line)
    project_description = "\n".join(lines)

    print("\n--- Generating Tasks ---\n")
    try:
        result = generate_task_breakdown(project_name, project_description)
        print(result)
        
        file_name = f"{project_name.replace(' ', '_')}_tasks.txt"
        with open(file_name, "w", encoding="utf-8") as f:
            f.write(result)
        print(f"\n✅ Task breakdown saved to '{file_name}'")
    except Exception as e:
        print(f"\n❌ Error: {e}")

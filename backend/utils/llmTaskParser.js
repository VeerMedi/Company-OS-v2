/**
 * LLM Task Parser Utility
 * Parses structured task output from Gemini LLM into task objects
 * Enhanced to support Task Bunch creation with parallel execution
 */

/**
 * Map phase names to standardized bunch phases
 * @param {string} phaseName - Raw phase name from LLM
 * @returns {string} Standardized phase name
 */
function mapToStandardPhase(phaseName) {
  const lowerPhase = phaseName.toLowerCase();
  
  if (lowerPhase.includes('frontend') || lowerPhase.includes('ui') || lowerPhase.includes('client')) {
    return 'Frontend Development';
  } else if (lowerPhase.includes('backend') || lowerPhase.includes('server') || lowerPhase.includes('api')) {
    return 'Backend Development';
  } else if (lowerPhase.includes('full stack') || lowerPhase.includes('fullstack')) {
    return 'Full Stack Development';
  } else if (lowerPhase.includes('integration') || lowerPhase.includes('connect')) {
    return 'Integration';
  } else if (lowerPhase.includes('ai') || lowerPhase.includes('ml') || lowerPhase.includes('machine learning')) {
    return 'AI Functionalities';
  } else if (lowerPhase.includes('test') || lowerPhase.includes('qa') || lowerPhase.includes('quality')) {
    return 'Testing & QA';
  } else if (lowerPhase.includes('devops') || lowerPhase.includes('deployment') || lowerPhase.includes('deploy')) {
    return 'DevOps & Deployment';
  } else if (lowerPhase.includes('production')) {
    return 'Production & Deployment';
  } else if (lowerPhase.includes('design') || lowerPhase.includes('ux')) {
    return 'Design & UI/UX';
  } else if (lowerPhase.includes('database') || lowerPhase.includes('architecture')) {
    return 'Database & Architecture';
  } else if (lowerPhase.includes('security') || lowerPhase.includes('performance')) {
    return 'Security & Performance';
  } else if (lowerPhase.includes('document')) {
    return 'Documentation';
  }
  
  return 'Other';
}

/**
 * Extract required skills from task description and suggested role
 * @param {Object} task - Task object
 * @returns {Array} Array of required skills
 */
function extractRequiredSkills(task) {
  const skills = new Set();
  const text = `${task.name} ${task.description} ${task.suggestedRole}`.toLowerCase();
  
  // Skill patterns
  const skillPatterns = {
    'Frontend Developer': ['react', 'vue', 'angular', 'frontend', 'ui', 'css', 'html', 'javascript', 'typescript'],
    'Backend Developer': ['backend', 'api', 'server', 'node', 'express', 'django', 'flask', 'database'],
    'Full Stack Developer': ['full stack', 'fullstack', 'mern', 'mean', 'full-stack'],
    'AI Developer': ['ai', 'ml', 'machine learning', 'neural', 'langchain', 'openai', 'gemini', 'rag'],
    'DevOps Engineer': ['devops', 'docker', 'kubernetes', 'ci/cd', 'deployment', 'aws', 'azure', 'cloud'],
    'QA/Testing': ['test', 'qa', 'quality', 'selenium', 'jest', 'unit test', 'integration test'],
    'UI/UX Designer': ['design', 'ux', 'ui/ux', 'figma', 'sketch', 'wireframe'],
    'Database Engineer': ['database', 'sql', 'nosql', 'mongodb', 'postgresql', 'mysql']
  };
  
  for (const [skillLabel, patterns] of Object.entries(skillPatterns)) {
    for (const pattern of patterns) {
      if (text.includes(pattern)) {
        skills.add(skillLabel);
        break; // Add skill label once and move to next
      }
    }
  }
  
  return Array.from(skills);
}

/**
 * Calculate time allocation based on complexity
 * @param {string} complexity - Low, Medium, High
 * @returns {number} Number of days
 */
function getComplexityDays(complexity) {
  switch (complexity) {
    case 'Low': return 3;
    case 'Medium': return 7;
    case 'High': return 14;
    default: return 7;
  }
}

/**
 * Parse LLM output text into structured task array
 * @param {string} llmOutput - Raw text output from LLM
 * @returns {Array} Array of parsed task objects
 */
function parseLLMTasks(llmOutput) {
  const tasks = [];
  let currentPhase = '';
  
  // Split by lines and process
  const lines = llmOutput.split('\n');
  let currentTask = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines
    if (!line) continue;
    
    // Detect PHASE
    if (line.startsWith('PHASE:')) {
      currentPhase = line.replace('PHASE:', '').trim();
      continue;
    }
    
    // Detect TASK (numbered like "1. TASK:" or just "TASK:")
    if (line.match(/^\d+\.\s*TASK:/) || line.startsWith('TASK:')) {
      // Save previous task if exists
      if (currentTask) {
        tasks.push(currentTask);
      }
      
      // Start new task
      const taskName = line
        .replace(/^\d+\.\s*TASK:/, '')
        .replace('TASK:', '')
        .trim();
      
      currentTask = {
        name: taskName,
        description: '',
        complexity: 'Medium',
        suggestedRole: '',
        phase: currentPhase,
        aiGenerated: true,
        status: 'pending'
      };
      continue;
    }
    
    // Parse task properties
    if (currentTask) {
      if (line.startsWith('DESCRIPTION:')) {
        currentTask.description = line.replace('DESCRIPTION:', '').trim();
      } else if (line.startsWith('COMPLEXITY:')) {
        const complexity = line.replace('COMPLEXITY:', '').trim();
        currentTask.complexity = complexity; // Low, Medium, High
      } else if (line.startsWith('ASSIGNEE:')) {
        currentTask.suggestedRole = line.replace('ASSIGNEE:', '').trim();
      }
    }
  }
  
  // Push last task
  if (currentTask) {
    tasks.push(currentTask);
  }
  
  return tasks;
}

/**
 * Validate parsed tasks
 * @param {Array} tasks - Array of task objects
 * @returns {boolean} True if valid
 */
function validateTasks(tasks) {
  if (!Array.isArray(tasks) || tasks.length === 0) {
    return false;
  }
  
  for (const task of tasks) {
    if (!task.name || !task.description) {
      return false;
    }
  }
  
  return true;
}

/**
 * Group tasks by phase into bunches with timeline calculation
 * @param {Array} tasks - Array of parsed task objects
 * @param {Date} projectDeadline - Project deadline
 * @param {Number} bufferPercentage - Buffer time percentage (default 15%)
 * @returns {Array} Array of bunch objects
 */
function groupTasksIntoBunches(tasks, projectDeadline, bufferPercentage = 15) {
  // Group tasks by phase
  const phaseMap = {};
  
  tasks.forEach((task, index) => {
    const standardPhase = mapToStandardPhase(task.phase || 'Other');
    
    if (!phaseMap[standardPhase]) {
      phaseMap[standardPhase] = {
        phase: standardPhase,
        tasks: [],
        totalComplexityDays: 0,
        requiredSkills: new Set()
      };
    }
    
    phaseMap[standardPhase].tasks.push({
      ...task,
      order: index + 1
    });
    
    // Accumulate complexity days
    phaseMap[standardPhase].totalComplexityDays += getComplexityDays(task.complexity);
    
    // Extract and add required skills
    const taskSkills = extractRequiredSkills(task);
    taskSkills.forEach(skill => phaseMap[standardPhase].requiredSkills.add(skill));
  });
  
  // Convert to array and calculate timelines
  const bunches = Object.values(phaseMap).map((bunch, index) => ({
    ...bunch,
    requiredSkills: Array.from(bunch.requiredSkills),
    order: index + 1
  }));
  
  // Calculate chronological deadlines with buffer
  const now = new Date();
  const projectDuration = Math.max(
    (new Date(projectDeadline) - now) / (1000 * 60 * 60 * 24),
    30 // Minimum 30 days
  );
  
  // Total complexity days across all bunches
  const totalComplexityDays = bunches.reduce((sum, b) => sum + b.totalComplexityDays, 0);
  
  // Calculate proportional time for each bunch
  let currentDate = new Date(now);
  
  bunches.forEach((bunch, index) => {
    // Proportional allocation
    const proportion = bunch.totalComplexityDays / totalComplexityDays;
    const allocatedDays = Math.ceil(projectDuration * proportion);
    
    // Add buffer time
    const bufferDays = Math.ceil(allocatedDays * (bufferPercentage / 100));
    const totalDays = allocatedDays + bufferDays;
    
    bunch.estimatedDuration = allocatedDays;
    bunch.bufferTime = bufferDays;
    bunch.startDate = new Date(currentDate);
    
    // Calculate deadline
    const deadlineDate = new Date(currentDate);
    deadlineDate.setDate(deadlineDate.getDate() + totalDays);
    bunch.deadline = deadlineDate;
    
    // Next bunch starts after this one (parallel execution, but staggered)
    // For truly parallel execution, we could start all at the same time
    // For now, we'll stagger by a small amount for proper timeline visualization
    currentDate = new Date(bunch.startDate);
    currentDate.setDate(currentDate.getDate() + Math.ceil(totalDays * 0.1)); // 10% overlap
  });
  
  return bunches;
}

/**
 * Identify inter-bunch dependencies
 * Integration bunches depend on Frontend/Backend bunches
 * @param {Array} bunches - Array of bunch objects
 * @returns {Array} Bunches with dependencies added
 */
function identifyBunchDependencies(bunches) {
  bunches.forEach((bunch) => {
    bunch.dependsOnBunches = [];
    
    // Integration depends on Frontend and Backend
    if (bunch.phase === 'Integration') {
      const frontendBunch = bunches.find(b => b.phase === 'Frontend Development');
      const backendBunch = bunches.find(b => b.phase === 'Backend Development');
      
      if (frontendBunch) bunch.dependsOnBunches.push(frontendBunch);
      if (backendBunch) bunch.dependsOnBunches.push(backendBunch);
    }
    
    // Testing depends on Development bunches
    if (bunch.phase === 'Testing & QA') {
      const devBunches = bunches.filter(b => 
        b.phase.includes('Development') || b.phase === 'Integration'
      );
      devBunches.forEach(devBunch => {
        if (!bunch.dependsOnBunches.includes(devBunch)) {
          bunch.dependsOnBunches.push(devBunch);
        }
      });
    }
    
    // Deployment depends on Testing
    if (bunch.phase === 'DevOps & Deployment' || bunch.phase === 'Production & Deployment') {
      const testingBunch = bunches.find(b => b.phase === 'Testing & QA');
      if (testingBunch) bunch.dependsOnBunches.push(testingBunch);
    }
  });
  
  return bunches;
}

module.exports = {
  parseLLMTasks,
  validateTasks,
  groupTasksIntoBunches,
  identifyBunchDependencies,
  mapToStandardPhase,
  extractRequiredSkills,
  getComplexityDays
};

const { validationResult } = require('express-validator');
const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');
const { invalidateHRCache } = require('./hrController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');

// @desc    Create a new project
// @route   POST /api/projects
// @access  Private (Co-founder)
const createProject = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, description, deadline, documentation, assignedManagerId } = req.body;

    // If manager is creating the project, auto-assign to themselves
    let managerId = assignedManagerId;
    if (req.user.role === 'manager' && !assignedManagerId) {
      managerId = req.user.id;
    }

    // Check if the assigned manager exists and is a manager
    const manager = await User.findById(managerId);
    if (!manager) {
      return res.status(404).json({
        success: false,
        message: 'Manager not found'
      });
    }

    if (manager.role !== 'manager') {
      return res.status(400).json({
        success: false,
        message: 'The assigned user must be a manager'
      });
    }

    // Prepare attachments array if SRS document is uploaded
    const attachments = [];
    if (req.file) {
      attachments.push({
        name: req.file.originalname,
        fileUrl: req.file.path,
        fileType: req.file.mimetype,
        uploadedBy: req.user.id
      });
    }

    // Create the project
    const project = await Project.create({
      name,
      description,
      deadline,
      documentation,
      createdBy: req.user.id, // User who created the project (co-founder/CEO/manager)
      assignedManager: managerId,
      status: 'not-started',
      attachments
    });

    // Invalidate HR dashboard cache since new project created
    invalidateHRCache();

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: await Project.findById(project._id)
        .populate('createdBy', 'firstName lastName email')
        .populate('assignedManager', 'firstName lastName email')
    });

  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create project',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// @desc    Get all projects
// @route   GET /api/projects
// @access  Private (Based on role)
const getAllProjects = async (req, res) => {
  try {
    let projects;
    const { search } = req.query;

    // Build query object
    let query = {};
    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') }
      ];
    }

    // Filter projects based on user role
    switch (req.user.role) {
      case 'ceo':
      case 'co-founder':
        // CEOs and co-founders can see all projects
        projects = await Project.find(query)
          .populate('createdBy', 'firstName lastName email')
          .populate('assignedManager', 'firstName lastName email')
          .sort({ createdAt: -1 });
        break;

      case 'manager':
        // Managers can see projects assigned to them
        projects = await Project.find({ ...query, assignedManager: req.user.id })
          .populate('createdBy', 'firstName lastName email')
          .populate('assignedManager', 'firstName lastName email')
          .sort({ createdAt: -1 });
        break;

      case 'hr':
        // HR can see all projects (for reporting)
        projects = await Project.find(query)
          .populate('createdBy', 'firstName lastName email')
          .populate('assignedManager', 'firstName lastName email')
          .sort({ createdAt: -1 });
        break;

      case 'individual':
      case 'service-delivery':
      case 'service-onboarding':
        // Individuals can see projects they have tasks in
        const tasks = await Task.find({ assignedTo: req.user.id });
        const projectIds = [...new Set(tasks.map(task => task.project))];

        projects = await Project.find({ ...query, _id: { $in: projectIds } })
          .populate('createdBy', 'firstName lastName email')
          .populate('assignedManager', 'firstName lastName email')
          .sort({ createdAt: -1 });
        break;

      default:
        return res.status(403).json({
          success: false,
          message: 'Unauthorized access'
        });
    }

    // Calculate team members for each project (users with assigned tasks)
    const projectsWithTeam = await Promise.all(projects.map(async (project) => {
      // Get all unique user IDs assigned to tasks in this project
      const assignedUserIds = await Task.find({
        project: project._id,
        assignedTo: { $exists: true, $ne: null }
      }).distinct('assignedTo');

      // Filter only valid, existing, and active users
      const validUsers = await User.find({
        _id: { $in: assignedUserIds },
        isActive: true
      }).select('_id');

      const validUserIds = validUsers.map(u => u._id);

      const projectObj = project.toObject();
      projectObj.team = validUserIds;
      return projectObj;
    }));

    res.status(200).json({
      success: true,
      count: projectsWithTeam.length,
      data: projectsWithTeam
    });

  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch projects',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// @desc    Get a single project
// @route   GET /api/projects/:id
// @access  Private (Based on role)
const getProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('createdBy', 'firstName lastName email')
      .populate('assignedManager', 'firstName lastName email')
      .populate({
        path: 'tasks',
        populate: {
          path: 'assignedTo',
          select: 'firstName lastName email'
        }
      });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check if user has access to this project
    if (req.user.role === 'manager' && project.assignedManager.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this project'
      });
    }

    if (req.user.role === 'individual') {
      // Check if individual has tasks in this project
      const hasTask = await Task.exists({
        project: req.params.id,
        assignedTo: req.user.id
      });

      if (!hasTask) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to view this project'
        });
      }
    }

    res.status(200).json({
      success: true,
      data: project
    });

  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch project',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// @desc    Update a project
// @route   PUT /api/projects/:id
// @access  Private (Co-founder or assigned Manager)
const updateProject = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    let project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check if user has permission to update this project
    if (
      req.user.role !== 'co-founder' &&
      req.user.role !== 'ceo' &&
      project.assignedManager.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this project'
      });
    }

    // If trying to reassign manager, check if new manager exists and is a manager
    if (req.body.assignedManagerId && req.body.assignedManagerId !== project.assignedManager.toString()) {
      const newManager = await User.findById(req.body.assignedManagerId);

      if (!newManager) {
        return res.status(404).json({
          success: false,
          message: 'New manager not found'
        });
      }

      if (newManager.role !== 'manager') {
        return res.status(400).json({
          success: false,
          message: 'The assigned user must be a manager'
        });
      }
    }

    // Update project fields
    const fieldsToUpdate = {};

    if (req.body.name) fieldsToUpdate.name = req.body.name;
    if (req.body.description) fieldsToUpdate.description = req.body.description;
    if (req.body.deadline) fieldsToUpdate.deadline = req.body.deadline;
    if (req.body.documentation) fieldsToUpdate.documentation = req.body.documentation;
    if (req.body.status) fieldsToUpdate.status = req.body.status;
    if (req.body.assignedManagerId) fieldsToUpdate.assignedManager = req.body.assignedManagerId;

    // Update the project
    project = await Project.findByIdAndUpdate(
      req.params.id,
      fieldsToUpdate,
      { new: true, runValidators: true }
    ).populate('createdBy', 'firstName lastName email')
      .populate('assignedManager', 'firstName lastName email');

    res.status(200).json({
      success: true,
      message: 'Project updated successfully',
      data: project
    });

  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update project',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// @desc    Delete a project
// @route   DELETE /api/projects/:id
// @access  Private (Co-founder only)
const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Only co-founders, CEOs, and managers can delete projects
    if (req.user.role !== 'co-founder' && req.user.role !== 'ceo' && req.user.role !== 'manager') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this project'
      });
    }

    // Delete all associated tasks first
    await Task.deleteMany({ project: req.params.id });

    // Then soft delete the project
    project.isDeleted = true;
    await project.save();

    res.status(200).json({
      success: true,
      message: 'Project deleted successfully'
    });

  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete project',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// @desc    Get available managers for project assignment
// @route   GET /api/projects/managers
// @access  Private (Co-founder)
const getAvailableManagers = async (req, res) => {
  try {
    if (req.user.role !== 'co-founder' && req.user.role !== 'ceo') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access'
      });
    }

    const managers = await User.find({ role: 'manager', isActive: true })
      .select('firstName lastName email employeeId');

    res.status(200).json({
      success: true,
      count: managers.length,
      data: managers
    });

  } catch (error) {
    console.error('Get managers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch managers',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// @desc    Automate project creation using n8n webhook
// @route   POST /api/projects/automate
// @access  Private (Co-founder)
const automateProject = async (req, res) => {
  try {
    const { projectName, description, deadline, assignedManagerId } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'PDF file is required'
      });
    }

    // Validate required fields
    if (!projectName || !description || !deadline || !assignedManagerId) {
      return res.status(400).json({
        success: false,
        message: 'Project name, description, deadline, and assigned manager are required'
      });
    }

    // Validate the assigned manager exists and is a manager
    const manager = await User.findById(assignedManagerId);
    if (!manager) {
      return res.status(404).json({
        success: false,
        message: 'Assigned manager not found'
      });
    }

    if (manager.role !== 'manager') {
      return res.status(400).json({
        success: false,
        message: 'The assigned user must be a manager'
      });
    }

    // Create the project first
    const project = await Project.create({
      name: projectName,
      description,
      deadline,
      documentation: `Automated project from PDF: ${req.file.originalname}`,
      createdBy: req.user.id,
      assignedManager: assignedManagerId,
      status: 'not-started',
      isAutomated: true // Flag to indicate this was automated
    });

    // Prepare form data for n8n webhook
    const formData = new FormData();

    // Create input object as per your specified format
    const inputData = {
      description: description,
      deadline: deadline
    };

    // Add the input object as JSON string
    formData.append('input', JSON.stringify(inputData));
    formData.append('projectName', projectName);
    formData.append('projectId', project._id.toString());

    // Add the PDF file as 'srs' instead of file path
    const fileStream = fs.createReadStream(req.file.path);
    formData.append('srs', fileStream, {
      filename: req.file.originalname,
      contentType: 'application/pdf'
    });

    try {
      console.log('🚀 Sending project data to n8n webhook...');
      console.log('📋 Project:', projectName);
      console.log('📄 PDF:', req.file.originalname);
      console.log('🔗 Webhook:', 'https://n8n.srv812138.hstgr.cloud/webhook/fetch');
      console.log('💾 FormData fields:', {
        input: JSON.parse(JSON.stringify(inputData)),
        projectName,
        projectId: project._id.toString(),
        fileSize: req.file.size,
        fileName: req.file.originalname
      });

      // Send to n8n webhook with extended timeout for PDF processing
      const n8nResponse = await axios.post('https://n8n.srv812138.hstgr.cloud/webhook/fetch', formData, {
        headers: {
          ...formData.getHeaders(),
        },
        timeout: 180000 // 3 minutes timeout for PDF processing and task generation
      });

      console.log('✅ N8N Response received:', {
        status: n8nResponse.status,
        statusText: n8nResponse.statusText,
        dataType: typeof n8nResponse.data,
        hasData: !!n8nResponse.data,
        dataKeys: n8nResponse.data ? Object.keys(n8nResponse.data) : [],
        responseSize: JSON.stringify(n8nResponse.data).length,
        fullResponse: JSON.stringify(n8nResponse.data, null, 2)
      });

      // Check if response has output.tasks format
      const hasOutputTasks = n8nResponse.data && n8nResponse.data.output && n8nResponse.data.output.tasks;
      const hasDirectTasks = n8nResponse.data && n8nResponse.data.tasks;

      console.log('🔍 Response analysis:', {
        hasOutputTasks: !!hasOutputTasks,
        hasDirectTasks: !!hasDirectTasks,
        outputTasksCount: hasOutputTasks ? n8nResponse.data.output.tasks.length : 0,
        directTasksCount: hasDirectTasks ? n8nResponse.data.tasks.length : 0
      });

      // Handle the response from n8n
      if (n8nResponse.data && n8nResponse.data.output && n8nResponse.data.output.tasks) {
        console.log(`🎯 BRANCH 1: Found ${n8nResponse.data.output.tasks.length} tasks in output format`);
        console.log('📝 Tasks data:', JSON.stringify(n8nResponse.data.output.tasks, null, 2));

        // Handle the expected format: { output: { tasks: [...] } }
        const tasksToCreate = n8nResponse.data.output.tasks.map(taskData => ({
          title: taskData.task || taskData.name || taskData.title,
          description: taskData.description || taskData.task || `Generated task: ${taskData.task || taskData.name}`,
          project: project._id,
          createdBy: req.user.id,
          assignedBy: assignedManagerId,
          deadline: taskData.deadline || deadline,
          status: 'pending-assignment',
          priority: taskData.priority || 'medium',
          isAutomated: true
        }));

        const createdTasks = await Task.insertMany(tasksToCreate);
        console.log(`✅ Created ${createdTasks.length} tasks in database`);

        // Update project with task references
        await Project.findByIdAndUpdate(project._id, {
          tasks: createdTasks.map(task => task._id),
          status: 'ready-for-assignment'
        });

        // Clean up uploaded file
        fs.unlinkSync(req.file.path);

        res.status(201).json({
          success: true,
          message: `Project automated successfully and assigned to ${manager.firstName} ${manager.lastName}`,
          data: {
            project,
            assignedManager: {
              id: manager._id,
              name: `${manager.firstName} ${manager.lastName}`,
              employeeId: manager.employeeId
            },
            tasksCreated: createdTasks.length,
            tasks: createdTasks
          }
        });

      } else if (n8nResponse.data && n8nResponse.data.tasks) {
        console.log(`🎯 BRANCH 2: Found ${n8nResponse.data.tasks.length} tasks in direct format`);
        console.log('📝 Tasks data:', JSON.stringify(n8nResponse.data.tasks, null, 2));

        // Handle alternative format: { tasks: [...] }
        const tasksToCreate = n8nResponse.data.tasks.map(taskData => ({
          title: taskData.name || taskData.title || taskData.task,
          description: taskData.description || `Generated task: ${taskData.name || taskData.title}`,
          project: project._id,
          createdBy: req.user.id,
          assignedBy: assignedManagerId,
          deadline: taskData.deadline || deadline,
          status: 'pending-assignment',
          priority: taskData.priority || 'medium',
          isAutomated: true
        }));

        const createdTasks = await Task.insertMany(tasksToCreate);
        console.log(`✅ Created ${createdTasks.length} tasks in database`);

        // Update project with task references
        await Project.findByIdAndUpdate(project._id, {
          tasks: createdTasks.map(task => task._id),
          status: 'ready-for-assignment'
        });

        // Clean up uploaded file
        fs.unlinkSync(req.file.path);

        res.status(201).json({
          success: true,
          message: `Project automated successfully and assigned to ${manager.firstName} ${manager.lastName}`,
          data: {
            project,
            assignedManager: {
              id: manager._id,
              name: `${manager.firstName} ${manager.lastName}`,
              employeeId: manager.employeeId
            },
            tasksCreated: createdTasks.length,
            tasks: createdTasks
          }
        });

      } else {
        console.log('⚠️ BRANCH 3: N8N returned empty or unexpected response format');
        console.log('❌ Expected format not found. Checking response structure:');
        console.log('Response data:', JSON.stringify(n8nResponse.data, null, 2));
        console.log('Response type:', typeof n8nResponse.data);
        console.log('Is response truthy:', !!n8nResponse.data);
        if (n8nResponse.data) {
          console.log('Response keys:', Object.keys(n8nResponse.data));
        }

        // Check if response is an array with error and raw_output (n8n LLM parsing issue)
        if (Array.isArray(n8nResponse.data) && n8nResponse.data.length > 0 && n8nResponse.data[0].raw_output) {
          console.log('🔧 BRANCH 3A: Attempting to parse raw_output from n8n LLM response');

          try {
            const rawOutput = n8nResponse.data[0].raw_output;
            console.log('📄 Raw output:', rawOutput);

            // Extract JSON from markdown code blocks
            const jsonMatch = rawOutput.match(/```json\s*([\s\S]*?)\s*```/);
            if (jsonMatch && jsonMatch[1]) {
              const extractedJson = jsonMatch[1].trim();
              console.log('🎯 Extracted JSON:', extractedJson);

              const parsedData = JSON.parse(extractedJson);
              console.log('✅ Successfully parsed JSON from raw_output');

              if (parsedData && parsedData.output && parsedData.output.tasks) {
                console.log(`🎉 Found ${parsedData.output.tasks.length} tasks in parsed raw_output`);

                const tasksToCreate = parsedData.output.tasks.map(taskData => ({
                  title: taskData.task || taskData.name || taskData.title,
                  description: taskData.description || taskData.task || `Generated task: ${taskData.task || taskData.name}`,
                  project: project._id,
                  createdBy: req.user.id,
                  assignedBy: assignedManagerId,
                  deadline: taskData.deadline || deadline,
                  status: 'pending-assignment',
                  priority: taskData.priority || 'medium',
                  isAutomated: true
                }));

                const createdTasks = await Task.insertMany(tasksToCreate);
                console.log(`✅ Created ${createdTasks.length} tasks from parsed raw_output`);

                // Update project with task references
                await Project.findByIdAndUpdate(project._id, {
                  tasks: createdTasks.map(task => task._id),
                  status: 'ready-for-assignment'
                });

                // Clean up uploaded file
                fs.unlinkSync(req.file.path);

                return res.status(201).json({
                  success: true,
                  message: `Project automated successfully and assigned to ${manager.firstName} ${manager.lastName}`,
                  data: {
                    project,
                    assignedManager: {
                      id: manager._id,
                      name: `${manager.firstName} ${manager.lastName}`,
                      employeeId: manager.employeeId
                    },
                    tasksCreated: createdTasks.length,
                    tasks: createdTasks,
                    note: 'Tasks extracted from n8n raw_output due to JSON parsing issue in n8n workflow'
                  }
                });
              }
            }
          } catch (parseError) {
            console.log('❌ Failed to parse raw_output:', parseError.message);
          }
        }

        // If n8n doesn't return tasks, still keep the project but mark for manual assignment
        await Project.findByIdAndUpdate(project._id, {
          status: 'automation-pending',
          documentation: `${project.documentation}\n\nN8N response received but no tasks generated. Manual task creation required.`
        });

        // Clean up uploaded file
        fs.unlinkSync(req.file.path);

        res.status(201).json({
          success: true,
          message: `Project created and assigned to ${manager.firstName} ${manager.lastName}. Manual task creation required.`,
          data: {
            project,
            assignedManager: {
              id: manager._id,
              name: `${manager.firstName} ${manager.lastName}`,
              employeeId: manager.employeeId
            },
            note: 'N8N workflow needs to be configured to return task data. Please create tasks manually or fix the N8N workflow.'
          }
        });
      }

    } catch (n8nError) {
      console.error('❌ N8N webhook error:', {
        message: n8nError.message,
        status: n8nError.response?.status,
        statusText: n8nError.response?.statusText,
        data: n8nError.response?.data
      });

      let errorMessage = 'N8N automation failed';
      let statusDetail = '';

      if (n8nError.response) {
        statusDetail = `HTTP ${n8nError.response.status}: ${n8nError.response.statusText}`;
        if (n8nError.response.status === 413) {
          errorMessage = 'PDF file too large for processing';
        } else if (n8nError.response.status === 400) {
          errorMessage = 'Invalid request format sent to N8N';
        } else if (n8nError.response.status === 500) {
          errorMessage = 'N8N workflow processing error';
        }
      } else if (n8nError.code === 'ECONNABORTED') {
        errorMessage = 'N8N processing timeout - PDF might be too complex';
        statusDetail = 'Timeout after 3 minutes';
      } else if (n8nError.code === 'ECONNREFUSED') {
        errorMessage = 'Cannot connect to N8N webhook';
        statusDetail = 'Connection refused';
      }

      // Update project status to indicate automation failed
      await Project.findByIdAndUpdate(project._id, {
        status: 'automation-failed',
        documentation: `${project.documentation}\n\nAutomation failed: ${errorMessage}\nDetails: ${statusDetail}\nTime: ${new Date().toISOString()}`
      });

      // Clean up uploaded file
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      res.status(201).json({
        success: true,
        message: `Project created, but automation failed: ${errorMessage}`,
        data: {
          project,
          assignedManager: {
            id: manager._id,
            name: `${manager.firstName} ${manager.lastName}`,
            employeeId: manager.employeeId
          },
          warning: 'Automated task generation failed. Please create tasks manually.',
          error: {
            type: 'automation_failed',
            message: errorMessage,
            details: statusDetail
          }
        }
      });
    }

  } catch (error) {
    console.error('Automation error:', error);

    // Clean up uploaded file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      success: false,
      message: 'Failed to automate project creation',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// @desc    Automate project with LLM task generation (Bunch-based)
// @route   POST /api/projects/automate-llm
// @access  Private (Co-founder, CEO, Manager)
const automateProjectWithLLM = async (req, res) => {
  try {
    const { projectId } = req.body;

    // Validate project exists
    const project = await Project.findById(projectId)
      .populate('assignedManager', 'firstName lastName email');

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // If manager is calling this, verify they're the assigned manager
    if (req.user.role === 'manager' && project.assignedManager._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only automate projects assigned to you'
      });
    }

    // Call Flask LLM API
    console.log('🤖 Calling LLM API for project:', project.name);

    const llmResponse = await axios.post('http://localhost:5002/generate-tasks', {
      project_name: project.name,
      project_description: project.description + '\n\n' + (project.documentation || '')
    }, {
      timeout: 60000 // 60 second timeout for LLM
    });

    if (!llmResponse.data || !llmResponse.data.tasks) {
      throw new Error('Invalid response from LLM API');
    }

    // Parse LLM output
    const {
      parseLLMTasks,
      validateTasks,
      groupTasksIntoBunches,
      identifyBunchDependencies,
      extractRequiredSkills
    } = require('../utils/llmTaskParser');

    const TaskBunch = require('../models/TaskBunch');

    const parsedTasks = parseLLMTasks(llmResponse.data.tasks);

    if (!validateTasks(parsedTasks)) {
      throw new Error('Failed to parse LLM output into valid tasks');
    }

    console.log(`✅ Parsed ${parsedTasks.length} tasks from LLM`);

    // Group tasks into bunches with timeline calculation
    let bunches = groupTasksIntoBunches(parsedTasks, project.deadline, 15); // 15% buffer
    bunches = identifyBunchDependencies(bunches);

    console.log(`📦 Created ${bunches.length} task bunches`);

    // Create tasks and bunches in database
    const createdBunches = [];

    for (const bunchData of bunches) {
      // Create tasks for this bunch
      const bunchTasks = [];

      for (const taskData of bunchData.tasks) {
        const task = await Task.create({
          title: taskData.name,
          description: taskData.description,
          project: project._id,
          deadline: bunchData.deadline, // Use bunch deadline
          status: 'pending-assignment',
          points: taskData.complexity === 'High' ? 5 : taskData.complexity === 'Low' ? 2 : 3,
          priority: taskData.complexity === 'High' ? 'high' : taskData.complexity === 'Low' ? 'low' : 'medium',
          aiGenerated: true,
          phase: taskData.phase,
          complexity: taskData.complexity,
          suggestedRole: taskData.suggestedRole,
          requiredSkills: extractRequiredSkills(taskData),
          createdBy: req.user.id,
          taskType: 'project'
        });
        bunchTasks.push(task._id);
      }

      // Create the bunch
      const bunch = await TaskBunch.create({
        name: bunchData.phase,
        description: `AI-generated bunch for ${bunchData.phase} phase`,
        project: project._id,
        phase: bunchData.phase,
        tasks: bunchTasks,
        assignedBy: req.user.id,
        status: 'pending-assignment',
        requiredSkills: bunchData.requiredSkills,
        estimatedDuration: bunchData.estimatedDuration,
        bufferTime: bunchData.bufferTime,
        startDate: bunchData.startDate,
        deadline: bunchData.deadline,
        order: bunchData.order,
        isParallel: true, // All bunches can execute in parallel
        aiGenerated: true
      });

      // Update tasks with bunch reference
      await Task.updateMany(
        { _id: { $in: bunchTasks } },
        { $set: { taskBunch: bunch._id } }
      );

      createdBunches.push(bunch);
    }

    // Handle bunch dependencies (store as IDs)
    for (let i = 0; i < bunches.length; i++) {
      const bunchData = bunches[i];
      const bunch = createdBunches[i];

      if (bunchData.dependsOnBunches && bunchData.dependsOnBunches.length > 0) {
        const dependencyIds = bunchData.dependsOnBunches.map(depBunch => {
          const depIndex = bunches.findIndex(b => b.phase === depBunch.phase);
          return depIndex >= 0 ? createdBunches[depIndex]._id : null;
        }).filter(id => id !== null);

        bunch.dependsOnBunches = dependencyIds;
        await bunch.save();
      }
    }

    // Update project status
    await Project.findByIdAndUpdate(projectId, {
      status: 'ready-for-assignment',
      documentation: `${project.documentation}\n\n[AI Generated Task Bunches]\nGenerated ${createdBunches.length} bunches with ${parsedTasks.length} tasks on ${new Date().toISOString()}`
    });

    res.status(200).json({
      success: true,
      message: `Successfully generated ${createdBunches.length} bunches with ${parsedTasks.length} tasks using AI`,
      data: {
        project: await Project.findById(projectId)
          .populate('assignedManager', 'firstName lastName email'),
        bunchesCreated: createdBunches.length,
        tasksCreated: parsedTasks.length,
        bunches: await TaskBunch.find({ project: projectId })
          .populate('tasks')
          .sort({ order: 1 })
      }
    });

  } catch (error) {
    console.error('❌ LLM Automation error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to automate project with LLM',
      error: process.env.NODE_ENV === 'development' ? error.message : 'LLM service unavailable'
    });
  }
};

module.exports = {
  createProject,
  getAllProjects,
  getProject,
  updateProject,
  deleteProject,
  getAvailableManagers,
  automateProject,
  automateProjectWithLLM
};
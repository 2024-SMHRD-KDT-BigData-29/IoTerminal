// File: backend/src/controllers/workflowController.js
let { workflows } = require('../data/dummyData'); // Load dummy workflows (use let for modification)

exports.createWorkflow = (req, res) => {
    const { name, elements } = req.body;
    // For mockup, assume req.user is populated by a mock auth middleware if token is present
    // Or for simpler mock, just assign a default userId
    const userId = req.user ? req.user.userId : 'mockUser1'; 

    if (!name || !elements) {
        return res.status(400).json({ message: 'Workflow name and elements are required.' });
    }
    const newWorkflow = {
        id: `wf${Date.now()}`, // Simple unique ID for mock
        userId,
        name,
        elements,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    workflows.push(newWorkflow);
    console.log('Mock Create Workflow: New workflow added', newWorkflow.name);
    console.log('Current workflows:', workflows.length);
    res.status(201).json({ message: 'Mock workflow saved successfully.', workflow: newWorkflow });
};

exports.getUserWorkflows = (req, res) => {
    const userId = req.user ? req.user.userId : 'mockUser1'; // Default or from mock auth
    const userWorkflows = workflows.filter(wf => wf.userId === userId);
    console.log(`Mock Get Workflows for user ${userId}: Found ${userWorkflows.length} workflows`);
    res.json(userWorkflows);
};

// Mock getWorkflowById
exports.getWorkflowById = (req, res) => {
    const userId = req.user ? req.user.userId : 'mockUser1';
    const { workflowId } = req.params;
    const workflow = workflows.find(wf => wf.id === workflowId && wf.userId === userId);
    if (!workflow) {
        return res.status(404).json({ message: 'Mock workflow not found or access denied.' });
    }
    res.json(workflow);
};

// Mock updateWorkflow
exports.updateWorkflow = (req, res) => {
    const userId = req.user ? req.user.userId : 'mockUser1';
    const { workflowId } = req.params;
    const { name, elements } = req.body;

    let workflowIndex = workflows.findIndex(wf => wf.id === workflowId && wf.userId === userId);

    if (workflowIndex === -1) {
        return res.status(404).json({ message: 'Mock workflow not found or access denied for update.' });
    }

    const updatedWorkflow = { ...workflows[workflowIndex] };
    if (name) updatedWorkflow.name = name;
    if (elements) updatedWorkflow.elements = elements;
    updatedWorkflow.updatedAt = new Date().toISOString();

    workflows[workflowIndex] = updatedWorkflow;
    console.log('Mock Update Workflow:', updatedWorkflow.name);
    res.json({ message: 'Mock workflow updated successfully.', workflow: updatedWorkflow });
};

// Mock deleteWorkflow
exports.deleteWorkflow = (req, res) => {
    const userId = req.user ? req.user.userId : 'mockUser1';
    const { workflowId } = req.params;

    const initialLength = workflows.length;
    workflows = workflows.filter(wf => !(wf.id === workflowId && wf.userId === userId));

    if (workflows.length === initialLength) {
        return res.status(404).json({ message: 'Mock workflow not found or access denied for deletion.' });
    }
    console.log('Mock Delete Workflow: ID', workflowId);
    res.status(200).json({ message: 'Mock workflow deleted successfully.' });
};
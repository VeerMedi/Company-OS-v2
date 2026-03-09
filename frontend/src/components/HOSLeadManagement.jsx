import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Building2,
  TrendingUp, 
  DollarSign, 
  Plus, 
  Eye,
  Edit2,
  UserPlus,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  ArrowRight,
  Upload,
  Download,
  FileUp,
  FileDown,
  X
} from 'lucide-react';
import api from '../utils/api';
import { showToast } from '../utils/toast';
import { formatDate } from '../utils/helpers';

// CSV Helper Functions for Leads
const parseCSV = (csvText) => {
  const lines = csvText.split('\n').filter(line => line.trim());
  if (lines.length < 2) return [];
  
  const headers = lines[0].split(',').map(h => h.trim());
  const data = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    data.push(row);
  }
  
  return data;
};

const generateLeadCSVTemplate = () => {
  const headers = [
    'companyName',
    'leadName',
    'designation',
    'department',
    'email',
    'phone',
    'linkedIn',
    'authorityLevel',
    'decisionPower',
    'potentialValue',
    'serviceInterest',
    'requirements'
  ];
  return headers.join(',') + '\n';
};

const downloadCSV = (csvContent, filename) => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const HOSLeadManagement = () => {
  const [leads, setLeads] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [salesTeam, setSalesTeam] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [selectedStage, setSelectedStage] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Import/Export states
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importedLeads, setImportedLeads] = useState([]);
  const [isImporting, setIsImporting] = useState(false);
  const [selectedLeadsForAssignment, setSelectedLeadsForAssignment] = useState([]);
  const [bulkAssignTo, setBulkAssignTo] = useState('');

  const stages = [
    { id: 'lead', label: 'Lead', color: 'bg-gray-100 text-gray-800' },
    { id: 'qualified', label: 'Qualified', color: 'bg-blue-100 text-blue-800' },
    { id: 'proposal', label: 'Proposal', color: 'bg-purple-100 text-purple-800' },
    { id: 'negotiation', label: 'Negotiation', color: 'bg-yellow-100 text-yellow-800' },
    { id: 'closedWon', label: 'Closed Won', color: 'bg-green-100 text-green-800' },
    { id: 'closedLost', label: 'Closed Lost', color: 'bg-red-100 text-red-800' }
  ];

  const [newLead, setNewLead] = useState({
    company: '',
    name: '',
    designation: '',
    department: '',
    email: '',
    phone: '',
    linkedIn: '',
    authorityLevel: 'influencer',
    decisionPower: 'medium',
    potentialValue: '',
    serviceInterest: '',
    requirements: '',
    expectedCloseDate: '',
    assignedTo: ''
  });

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      const [leadsRes, companiesRes, teamRes] = await Promise.all([
        api.get('/leads/all').catch(() => ({ data: { data: [] } })),
        api.get('/companies?approvalStatus=approved').catch(() => ({ data: { data: [] } })),
        api.get('/users?role=individual,service-onboarding,service-delivery').catch(() => ({ data: { data: [] } }))
      ]);

      // Backend returns array directly in data.data
      const leadsData = leadsRes.data.data || [];
      setLeads(Array.isArray(leadsData) ? leadsData : []);
      setCompanies(companiesRes.data.data || []);
      setSalesTeam(teamRes.data.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      showToast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateLead = async (e) => {
    e.preventDefault();
    
    if (!newLead.company) {
      showToast.error('Please select a company');
      return;
    }
    
    if (!newLead.assignedTo) {
      showToast.error('Please assign to a sales representative');
      return;
    }

    try {
      const leadData = {
        ...newLead,
        potentialValue: Number(newLead.potentialValue) || 0
      };

      const response = await api.post('/leads', leadData);
      showToast.success('Lead created and assigned successfully! 🎯');
      setShowCreateModal(false);
      resetForm();
      fetchAllData();
    } catch (error) {
      console.error('Error creating lead:', error);
      showToast.error(error.response?.data?.message || 'Failed to create lead');
    }
  };

  const handleAssignLead = async (leadId, assignedTo) => {
    try {
      await api.put(`/leads/${leadId}/assign`, { assignedTo });
      showToast.success('Lead reassigned successfully');
      fetchAllData();
    } catch (error) {
      console.error('Error assigning lead:', error);
      showToast.error('Failed to assign lead');
    }
  };

  const resetForm = () => {
    setNewLead({
      company: '',
      name: '',
      designation: '',
      department: '',
      email: '',
      phone: '',
      linkedIn: '',
      authorityLevel: 'influencer',
      decisionPower: 'medium',
      potentialValue: '',
      serviceInterest: '',
      requirements: '',
      expectedCloseDate: '',
      assignedTo: ''
    });
  };

  // Import/Export Functions
  const handleLeadFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.name.endsWith('.csv')) {
      showToast.error('Please upload a CSV file');
      return;
    }
    
    setImportFile(file);
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const csvText = event.target.result;
        const parsedData = parseCSV(csvText);
        
        // Transform CSV data to lead format
        const leadsData = parsedData.map((row, index) => {
          // Find company by name
          const company = companies.find(c => 
            c.companyName.toLowerCase() === row.companyName?.toLowerCase()
          );
          
          return {
            id: `import-${index}`,
            company: company?._id || '',
            companyName: row.companyName || '',
            name: row.leadName || '',
            designation: row.designation || '',
            department: row.department || '',
            email: row.email || '',
            phone: row.phone || '',
            linkedIn: row.linkedIn || '',
            authorityLevel: row.authorityLevel || 'influencer',
            decisionPower: row.decisionPower || 'medium',
            potentialValue: Number(row.potentialValue) || 0,
            serviceInterest: row.serviceInterest || '',
            requirements: row.requirements || '',
            assignedTo: '',
            isValid: !!(row.companyName && row.leadName && company),
            validationError: !company ? 'Company not found' : (!row.leadName ? 'Lead name required' : '')
          };
        });
        
        setImportedLeads(leadsData);
        
        const validLeads = leadsData.filter(l => l.isValid);
        if (validLeads.length === 0) {
          showToast.error('No valid leads found in CSV');
        } else {
          showToast.success(`${validLeads.length} valid leads loaded from CSV`);
          if (leadsData.length > validLeads.length) {
            showToast.warning(`${leadsData.length - validLeads.length} leads have errors`);
          }
        }
      } catch (error) {
        console.error('Error parsing CSV:', error);
        showToast.error('Failed to parse CSV file');
      }
    };
    
    reader.readAsText(file);
  };

  const handleBulkImportLeads = async () => {
    const validLeads = importedLeads.filter(l => l.isValid && l.assignedTo);
    
    if (validLeads.length === 0) {
      showToast.error('No valid leads with assignments to import');
      return;
    }
    
    setIsImporting(true);
    
    try {
      const response = await api.post('/leads/bulk-import', {
        leads: validLeads.map(l => ({
          company: l.company,
          name: l.name,
          designation: l.designation,
          department: l.department,
          email: l.email,
          phone: l.phone,
          linkedIn: l.linkedIn,
          authorityLevel: l.authorityLevel,
          decisionPower: l.decisionPower,
          potentialValue: l.potentialValue,
          serviceInterest: l.serviceInterest,
          requirements: l.requirements,
          assignedTo: l.assignedTo
        }))
      });
      
      if (response.data.success) {
        showToast.success(`Successfully imported ${response.data.data.created} leads`);
        setShowImportModal(false);
        setImportedLeads([]);
        setImportFile(null);
        fetchAllData();
      }
    } catch (error) {
      console.error('Error importing leads:', error);
      showToast.error(error.response?.data?.message || 'Failed to import leads');
    } finally {
      setIsImporting(false);
    }
  };

  const handleExportLeads = () => {
    if (leads.length === 0) {
      showToast.error('No leads to export');
      return;
    }
    
    // Generate CSV content
    const headers = [
      'Lead Name',
      'Company',
      'Designation',
      'Email',
      'Phone',
      'Stage',
      'Authority Level',
      'Decision Power',
      'Potential Value',
      'Assigned To',
      'Created Date'
    ];
    
    const rows = leads.map(lead => [
      lead.name || '',
      lead.company?.companyName || '',
      lead.designation || '',
      lead.email || '',
      lead.phone || '',
      lead.stage || '',
      lead.authorityLevel || '',
      lead.decisionPower || '',
      lead.potentialValue || 0,
      `${lead.assignedTo?.firstName || ''} ${lead.assignedTo?.lastName || ''}`.trim(),
      lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : ''
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const timestamp = new Date().toISOString().split('T')[0];
    downloadCSV(csvContent, `leads-export-${timestamp}.csv`);
    showToast.success('Leads exported successfully');
  };

  const handleDownloadLeadTemplate = () => {
    const template = generateLeadCSVTemplate();
    const exampleRow = 'Acme Corp,John Doe,CEO,Executive,john@acme.com,+91-9876543210,https://linkedin.com/in/johndoe,decision-maker,high,1000000,CRM Software,Need cloud-based CRM solution\n';
    downloadCSV(template + exampleRow, 'lead-import-template.csv');
    showToast.success('Template downloaded');
  };

  const handleBulkAssignLeads = async () => {
    if (selectedLeadsForAssignment.length === 0) {
      showToast.error('Please select leads to assign');
      return;
    }
    
    if (!bulkAssignTo) {
      showToast.error('Please select a sales representative');
      return;
    }
    
    try {
      const response = await api.post('/leads/bulk-assign', {
        leadIds: selectedLeadsForAssignment,
        assignedTo: bulkAssignTo
      });
      
      if (response.data.success) {
        showToast.success(`Successfully assigned ${selectedLeadsForAssignment.length} leads`);
        setSelectedLeadsForAssignment([]);
        setBulkAssignTo('');
        fetchAllData();
      }
    } catch (error) {
      console.error('Error bulk assigning leads:', error);
      showToast.error(error.response?.data?.message || 'Failed to assign leads');
    }
  };

  const getFilteredLeads = () => {
    let filtered = leads;
    
    if (selectedStage !== 'all') {
      filtered = filtered.filter(lead => lead.stage === selectedStage);
    }
    
    if (searchQuery) {
      filtered = filtered.filter(lead => 
        lead.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.company?.companyName?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return filtered;
  };

  const calculateStats = () => {
    const totalLeads = leads.length;
    const totalValue = leads
      .filter(l => l.stage !== 'closedLost')
      .reduce((sum, lead) => sum + (lead.potentialValue || 0), 0);
    const wonDeals = leads.filter(l => l.stage === 'closedWon').length;
    const conversionRate = totalLeads > 0 ? ((wonDeals / totalLeads) * 100).toFixed(1) : 0;
    
    return { totalLeads, totalValue, wonDeals, conversionRate };
  };

  const stats = calculateStats();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Lead Management</h2>
          <p className="text-gray-600 mt-1">Add leads and assign to your sales team</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Upload className="w-4 h-4" />
            Import Leads
          </button>
          <button
            onClick={handleExportLeads}
            disabled={leads.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Lead
          </button>
        </div>
      </div>

      {/* Bulk Assignment Section */}
      {selectedLeadsForAssignment.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-blue-600" />
              <span className="font-medium text-blue-900">
                {selectedLeadsForAssignment.length} leads selected
              </span>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={bulkAssignTo}
                onChange={(e) => setBulkAssignTo(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Sales Rep</option>
                {salesTeam
                  .filter(member => member.role === 'service-onboarding' || member.role === 'individual')
                  .map((member) => (
                    <option key={member._id} value={member._id}>
                      {member.firstName} {member.lastName} ({member.role})
                    </option>
                  ))}
              </select>
              <button
                onClick={handleBulkAssignLeads}
                disabled={!bulkAssignTo}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Assign Selected
              </button>
              <button
                onClick={() => setSelectedLeadsForAssignment([])}
                className="text-gray-600 hover:text-gray-800"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Leads</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalLeads}</p>
            </div>
            <Users className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pipeline Value</p>
              <p className="text-2xl font-bold text-green-600">₹{stats.totalValue.toLocaleString()}</p>
            </div>
            <DollarSign className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Conversion Rate</p>
              <p className="text-2xl font-bold text-purple-600">{stats.conversionRate}%</p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Closed Won</p>
              <p className="text-2xl font-bold text-green-600">{stats.wonDeals}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, or company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto">
            <button
              onClick={() => setSelectedStage('all')}
              className={`px-4 py-2 rounded-lg whitespace-nowrap ${
                selectedStage === 'all'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All ({leads.length})
            </button>
            {stages.map((stage) => (
              <button
                key={stage.id}
                onClick={() => setSelectedStage(stage.id)}
                className={`px-4 py-2 rounded-lg whitespace-nowrap ${
                  selectedStage === stage.id
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {stage.label} ({leads.filter(l => l.stage === stage.id).length})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Leads List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {selectedStage === 'all' ? 'All Leads' : stages.find(s => s.id === selectedStage)?.label}
          </h3>
        </div>
        <div className="divide-y divide-gray-200">
          {getFilteredLeads().length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No leads found. Add your first lead to get started.</p>
            </div>
          ) : (
            getFilteredLeads().map((lead) => {
              const stageInfo = stages.find(s => s.id === lead.stage);
              
              return (
                <div key={lead._id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-3">
                    {/* Checkbox for bulk selection */}
                    <input
                      type="checkbox"
                      checked={selectedLeadsForAssignment.includes(lead._id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedLeadsForAssignment([...selectedLeadsForAssignment, lead._id]);
                        } else {
                          setSelectedLeadsForAssignment(selectedLeadsForAssignment.filter(id => id !== lead._id));
                        }
                      }}
                      className="mt-1 h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
                    />
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-lg font-semibold text-gray-900">
                          {lead.name}
                        </h4>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${stageInfo?.color}`}>
                          {stageInfo?.label}
                        </span>
                        {lead.authorityLevel && (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-indigo-100 text-indigo-800 capitalize">
                            {lead.authorityLevel.replace('-', ' ')}
                          </span>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mt-3">
                        <div>
                          <p className="text-gray-600">Company</p>
                          <p className="font-medium text-gray-900 flex items-center gap-1">
                            <Building2 className="w-4 h-4" />
                            {lead.company?.companyName || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Designation</p>
                          <p className="font-medium text-gray-900">{lead.designation || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Potential Value</p>
                          <p className="font-medium text-green-600">₹{(lead.potentialValue || 0).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Assigned To</p>
                          <p className="font-medium text-gray-900 flex items-center gap-1">
                            <UserPlus className="w-4 h-4" />
                            {lead.assignedTo?.firstName || 'Unassigned'}
                          </p>
                        </div>
                      </div>

                      {lead.email && (
                        <div className="mt-3 text-sm text-gray-600">
                          <span className="font-medium">Email:</span> {lead.email}
                          {lead.phone && <span className="ml-4"><span className="font-medium">Phone:</span> {lead.phone}</span>}
                        </div>
                      )}

                      {lead.serviceInterest && (
                        <div className="mt-2 text-sm">
                          <span className="text-gray-600">Service Interest:</span>{' '}
                          <span className="text-gray-900">{lead.serviceInterest}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => {
                          setSelectedLead(lead);
                          setShowDetailsModal(true);
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      <div className="relative group">
                        <button className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                          <UserPlus className="w-5 h-5" />
                        </button>
                        <div className="hidden group-hover:block absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                          <div className="py-1">
                            {salesTeam.map(rep => (
                              <button
                                key={rep._id}
                                onClick={() => handleAssignLead(lead._id, rep._id)}
                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              >
                                {rep.firstName} {rep.lastName}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Create Lead Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 sticky top-0 bg-white">
              <h3 className="text-lg font-semibold text-gray-900">Add New Lead</h3>
              <p className="text-sm text-gray-600 mt-1">Add a lead and assign to a sales representative</p>
            </div>
            
            <form onSubmit={handleCreateLead} className="p-6 space-y-6">
              {/* Company Selection */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-md font-semibold text-blue-900 mb-3 flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Company Information
                </h4>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Company *
                  </label>
                  <select
                    value={newLead.company}
                    onChange={(e) => setNewLead({ ...newLead, company: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    required
                  >
                    <option value="">Choose a company...</option>
                    {companies.map((company) => (
                      <option key={company._id} value={company._id}>
                        {company.companyName} - {company.industry} ({company.location?.city || 'N/A'})
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Only approved companies are shown</p>
                </div>
              </div>

              {/* Lead Information */}
              <div>
                <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Lead/Authority Information
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                    <input
                      type="text"
                      value={newLead.name}
                      onChange={(e) => setNewLead({ ...newLead, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Designation *</label>
                    <input
                      type="text"
                      value={newLead.designation}
                      onChange={(e) => setNewLead({ ...newLead, designation: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                    <input
                      type="text"
                      value={newLead.department}
                      onChange={(e) => setNewLead({ ...newLead, department: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={newLead.email}
                      onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={newLead.phone}
                      onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn URL</label>
                    <input
                      type="url"
                      value={newLead.linkedIn}
                      onChange={(e) => setNewLead({ ...newLead, linkedIn: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
              </div>

              {/* Authority & Deal Info */}
              <div>
                <h4 className="text-md font-semibold text-gray-900 mb-3">Authority & Deal Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Authority Level</label>
                    <select
                      value={newLead.authorityLevel}
                      onChange={(e) => setNewLead({ ...newLead, authorityLevel: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="decision-maker">Decision Maker</option>
                      <option value="influencer">Influencer</option>
                      <option value="gatekeeper">Gatekeeper</option>
                      <option value="end-user">End User</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Decision Power</label>
                    <select
                      value={newLead.decisionPower}
                      onChange={(e) => setNewLead({ ...newLead, decisionPower: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Potential Value (₹)</label>
                    <input
                      type="number"
                      value={newLead.potentialValue}
                      onChange={(e) => setNewLead({ ...newLead, potentialValue: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Expected Close Date</label>
                    <input
                      type="date"
                      value={newLead.expectedCloseDate}
                      onChange={(e) => setNewLead({ ...newLead, expectedCloseDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
              </div>

              {/* Service & Assignment */}
              <div>
                <h4 className="text-md font-semibold text-gray-900 mb-3">Service Interest & Assignment</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Service Interest</label>
                    <input
                      type="text"
                      value={newLead.serviceInterest}
                      onChange={(e) => setNewLead({ ...newLead, serviceInterest: e.target.value })}
                      placeholder="e.g., Web Development, Mobile App, Consulting"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Requirements/Notes</label>
                    <textarea
                      rows="3"
                      value={newLead.requirements}
                      onChange={(e) => setNewLead({ ...newLead, requirements: e.target.value })}
                      placeholder="Any specific requirements or notes about this lead..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    ></textarea>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                      <UserPlus className="w-5 h-5 text-green-600" />
                      Assign to Sales Representative *
                    </label>
                    <select
                      value={newLead.assignedTo}
                      onChange={(e) => setNewLead({ ...newLead, assignedTo: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      required
                    >
                      <option value="">Select a sales representative...</option>
                      {salesTeam.map((rep) => (
                        <option key={rep._id} value={rep._id}>
                          {rep.firstName} {rep.lastName} - {rep.role.replace('-', ' ')}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-600 mt-2">
                      This lead will be assigned to the selected sales representative
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Create Lead & Assign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lead Details Modal */}
      {showDetailsModal && selectedLead && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 sticky top-0 bg-white">
              <h3 className="text-lg font-semibold text-gray-900">Lead Details</h3>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Name</p>
                  <p className="font-medium text-gray-900">{selectedLead.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Company</p>
                  <p className="font-medium text-gray-900">{selectedLead.company?.companyName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Designation</p>
                  <p className="font-medium text-gray-900">{selectedLead.designation}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Stage</p>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${stages.find(s => s.id === selectedLead.stage)?.color}`}>
                    {stages.find(s => s.id === selectedLead.stage)?.label}
                  </span>
                </div>
                {selectedLead.email && (
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium text-gray-900">{selectedLead.email}</p>
                  </div>
                )}
                {selectedLead.phone && (
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="font-medium text-gray-900">{selectedLead.phone}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-600">Assigned To</p>
                  <p className="font-medium text-gray-900">
                    {selectedLead.assignedTo?.firstName} {selectedLead.assignedTo?.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Potential Value</p>
                  <p className="font-medium text-green-600">₹{(selectedLead.potentialValue || 0).toLocaleString()}</p>
                </div>
              </div>

              {selectedLead.requirements && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Requirements</p>
                  <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedLead.requirements}</p>
                </div>
              )}
              
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedLead(null);
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Import Leads</h2>
                  <p className="text-sm text-gray-500 mt-1">Upload CSV file and assign to sales representatives</p>
                </div>
                <button
                  onClick={() => {
                    setShowImportModal(false);
                    setImportedLeads([]);
                    setImportFile(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* File Upload Section */}
              <div className="mb-6">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <FileUp className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <label className="cursor-pointer">
                    <span className="btn-primary inline-flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      Choose CSV File
                    </span>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleLeadFileUpload}
                      className="hidden"
                    />
                  </label>
                  <p className="text-sm text-gray-500 mt-2">
                    {importFile ? importFile.name : 'Upload a CSV file with lead data'}
                  </p>
                  <button
                    onClick={handleDownloadLeadTemplate}
                    className="text-sm text-blue-600 hover:text-blue-700 mt-3 inline-flex items-center gap-1"
                  >
                    <FileDown className="h-4 w-4" />
                    Download CSV Template
                  </button>
                </div>
                
                <div className="mt-3 text-xs text-gray-600 space-y-1">
                  <p><strong>Note:</strong> Company names must match existing approved companies exactly.</p>
                  <p>Valid authority levels: decision-maker, influencer, gatekeeper, end-user</p>
                  <p>Valid decision power: high, medium, low</p>
                </div>
              </div>

              {/* Preview and Assignment Section */}
              {importedLeads.length > 0 && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        Preview & Assign ({importedLeads.filter(l => l.isValid).length} valid leads)
                      </h3>
                      {importedLeads.some(l => !l.isValid) && (
                        <p className="text-sm text-red-600 mt-1">
                          {importedLeads.filter(l => !l.isValid).length} leads have errors
                        </p>
                      )}
                    </div>
                    <button
                      onClick={handleBulkImportLeads}
                      disabled={isImporting || importedLeads.filter(l => l.isValid && l.assignedTo).length === 0}
                      className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isImporting ? 'Importing...' : `Import ${importedLeads.filter(l => l.isValid && l.assignedTo).length} Leads`}
                    </button>
                  </div>

                  <div className="max-h-96 overflow-y-auto space-y-3">
                    {importedLeads.map((lead, index) => (
                      <div 
                        key={lead.id} 
                        className={`rounded-lg p-4 border ${
                          lead.isValid ? 'bg-white border-gray-200' : 'bg-red-50 border-red-200'
                        }`}
                      >
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="font-medium text-gray-900">{lead.name}</div>
                              {!lead.isValid && (
                                <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
                                  {lead.validationError}
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-600 space-y-1">
                              <div>{lead.designation} at {lead.companyName}</div>
                              <div className="flex gap-4 text-xs">
                                {lead.email && <span>📧 {lead.email}</span>}
                                {lead.phone && <span>📱 {lead.phone}</span>}
                              </div>
                              <div className="flex gap-2 text-xs">
                                <span className="px-2 py-0.5 bg-gray-100 rounded">
                                  {lead.authorityLevel}
                                </span>
                                <span className="px-2 py-0.5 bg-gray-100 rounded">
                                  {lead.decisionPower} power
                                </span>
                                <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded">
                                  ₹{lead.potentialValue?.toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </div>
                          {lead.isValid && (
                            <div className="w-64">
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Assign to Sales Rep *
                              </label>
                              <select
                                value={lead.assignedTo}
                                onChange={(e) => {
                                  const updated = [...importedLeads];
                                  updated[index].assignedTo = e.target.value;
                                  setImportedLeads(updated);
                                }}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="">Select Rep</option>
                                {salesTeam
                                  .filter(member => member.role === 'service-onboarding' || member.role === 'individual')
                                  .map((member) => (
                                    <option key={member._id} value={member._id}>
                                      {member.firstName} {member.lastName} ({member.role})
                                    </option>
                                  ))}
                              </select>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HOSLeadManagement;

import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, LayoutGroup } from 'framer-motion';
import DashboardLayout from '../components/DashboardLayout';

import { useAuth } from '../context/AuthContext';
import {
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  FileText,
  Download,
  Upload,
  DollarSign,
  Clock,
  TrendingUp,
  Award,
  Building,
  Edit,
  Save,
  X,
  Eye,
  CheckCircle,
  AlertCircle,
  CreditCard,
  Landmark,
  Target,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Users,
  Timer,
  Coffee,
  CheckCircle2,
  XCircle,
  Minus,
  Zap,
  Code,
  MessageSquare,
  UserCheck,
  UserX
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { formatDate } from '../utils/helpers';


const Profile = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [payrollHistory, setPayrollHistory] = useState([]);
  const [payrollLoading, setPayrollLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('personal');
  const [currentUser, setCurrentUser] = useState(user);

  // Attendance related state
  const [attendanceData, setAttendanceData] = useState(null);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Widget size state - moved to top level to fix hooks error
  const [widgetSizes, setWidgetSizes] = useState(() => {
    const saved = localStorage.getItem('profileAttendanceWidgetSizes');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return {
          present: 'small',
          late: 'small',
          absent: 'small',
          attendance: 'small',
          working: 'small',
          overtime: 'small',
          punctuality: 'small'
        };
      }
    }
    return {
      present: 'small',
      late: 'small',
      absent: 'small',
      attendance: 'small',
      working: 'small',
      overtime: 'small',
      punctuality: 'small'
    };
  });

  useEffect(() => {
    localStorage.setItem('profileAttendanceWidgetSizes', JSON.stringify(widgetSizes));
  }, [widgetSizes]);

  const handleWidgetSizeChange = (id, newSize) => {
    setWidgetSizes(prev => ({ ...prev, [id]: newSize }));
  };

  // Performance related state
  const [performanceData, setPerformanceData] = useState(null);
  const [performanceLoading, setPerformanceLoading] = useState(false);
  const navigate = useNavigate();

  const sidebarActions = [
    { id: 'personal', label: 'Personal', icon: User, onClick: () => setActiveTab('personal'), active: activeTab === 'personal' },
    { id: 'skills', label: 'Skills', icon: Code, onClick: () => setActiveTab('skills'), active: activeTab === 'skills' },
    { id: 'payroll', label: 'Payroll', icon: DollarSign, onClick: () => setActiveTab('payroll'), active: activeTab === 'payroll' },
    { id: 'bank', label: 'Bank', icon: Building, onClick: () => setActiveTab('bank'), active: activeTab === 'bank' },
    { id: 'documents', label: 'Documents', icon: FileText, onClick: () => setActiveTab('documents'), active: activeTab === 'documents' },

    { id: 'performance', label: 'Performance', icon: TrendingUp, onClick: () => setActiveTab('performance'), active: activeTab === 'performance' }
  ];

  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
    dateOfBirth: user?.dateOfBirth || '',
    joiningDate: user?.joiningDate || '',
    emergencyContact: user?.emergencyContact || '',
    profilePhoto: user?.profilePhoto || '',
    bankDetails: user?.bankDetails || {
      bankName: '',
      accountNumber: '',
      ifscCode: '',
      accountHolderName: ''
    },
    aadhaarDetails: user?.aadhaarDetails || {
      number: '',
      photo: '',
      verified: false
    },
    panDetails: user?.panDetails || {
      number: '',
      photo: '',
      verified: false
    },
    documents: user?.documents || [],
    education: user?.education || {
      instituteName: '',
      highestQualification: ''
    },
    department: user?.department || '',
    designation: user?.designation || '',
    reportingTo: user?.reportingTo || null
  });

  // File upload handlers
  const handleFileUpload = async (file, documentType = null) => {
    try {
      setUploadingFile(true);
      const formData = new FormData();

      if (documentType === 'profile') {
        // Profile photo upload
        formData.append('profilePhoto', file);

        const response = await api.post('/users/upload-profile-photo', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        if (response.data.success) {
          setProfileData(prev => ({
            ...prev,
            profilePhoto: response.data.data.photoUrl
          }));

          toast.success('Profile photo uploaded successfully');
          return response.data.data.photoUrl;
        }
      } else if (documentType) {
        // Identity document upload
        formData.append('identityDocument', file);
        formData.append('documentType', documentType);

        const response = await api.post('/users/upload-identity', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        if (response.data.success) {
          // Update the appropriate field in profileData
          const field = documentType === 'aadhaar' ? 'aadhaarDetails' : 'panDetails';
          setProfileData(prev => ({
            ...prev,
            [field]: {
              ...prev[field],
              photo: response.data.data.photoUrl
            }
          }));

          toast.success(`${documentType.toUpperCase()} photo uploaded successfully`);
          return response.data.data.photoUrl;
        }
      } else {
        // General document upload
        formData.append('document', file);
        formData.append('name', file.name);
        formData.append('type', 'general');

        const response = await api.post('/users/upload-document', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        if (response.data.success) {
          // Add to documents array
          setProfileData(prev => ({
            ...prev,
            documents: [...prev.documents, response.data.data]
          }));

          toast.success('Document uploaded successfully');
          return response.data.data.url;
        }
      }
    } catch (error) {
      console.error('File upload error:', error);
      toast.error(error.response?.data?.message || 'Failed to upload file');
      return null;
    } finally {
      setUploadingFile(false);
    }
  };

  // Tabs config moved to sidebarActions

  useEffect(() => {
    fetchPayrollHistory();
    const params = new URLSearchParams(location.search);
    const userId = params.get('userId');
    fetchUserProfile(userId);
  }, [location.search]);

  useEffect(() => {
    if (activeTab === 'performance') {
      fetchPerformanceData();
    }
  }, [activeTab]);

  // Handle URL parameter for tab selection
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam && ['personal', 'payroll', 'performance', 'documents', 'bank'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [location]);

  useEffect(() => {
    if (activeTab === 'attendance') {
      fetchAttendanceData();
    }
  }, [activeTab, selectedMonth, selectedYear]);

  const fetchUserProfile = async (userId) => {
    try {
      const endpoint = userId ? `/users/${userId}` : '/users/profile';
      const response = await api.get(endpoint);

      if (response.data.success) {
        console.log('Fetch user profile response:', response.data);
        // Handle different response structures between /profile (data) and /:id (data.user)
        const userData = userId ? response.data.data.user : response.data.data;

        console.log('User data to set:', userData);
        setCurrentUser(userData);
        setProfileData({
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          email: userData.email || '',
          phone: userData.phone || userData.phoneNumber || '', // Handle both fields
          address: userData.address || '',
          dateOfBirth: userData.dateOfBirth || '',
          joiningDate: userData.joiningDate || '',
          emergencyContact: userData.emergencyContact || '',
          profilePhoto: userData.profilePhoto || '',
          bankDetails: userData.bankDetails || {
            bankName: '',
            accountNumber: '',
            ifscCode: '',
            accountHolderName: ''
          },
          aadhaarDetails: userData.aadhaarDetails || {
            number: '',
            photo: '',
            verified: false
          },
          panDetails: userData.panDetails || {
            number: '',
            photo: '',
            verified: false
          },
          documents: userData.documents || [],
          education: userData.education || {
            instituteName: '',
            highestQualification: ''
          },
          department: userData.department || '',
          designation: userData.designation || '',
          reportingTo: userData.reportingTo || null
        });
        console.log('ProfileData state updated');
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      toast.error('Failed to load user profile');
    }
  };

  const fetchPayrollHistory = async () => {
    try {
      setPayrollLoading(true);
      const response = await api.get('/payroll/my-payroll');
      if (response.data.success) {
        setPayrollHistory(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching payroll history:', error);
      toast.error('Failed to fetch payroll history');
    } finally {
      setPayrollLoading(false);
    }
  };

  const fetchAttendanceData = async () => {
    try {
      setAttendanceLoading(true);
      const response = await api.get(`/attendance/monthly?year=${selectedYear}&month=${selectedMonth}`);
      if (response.data.success) {
        setAttendanceData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching attendance data:', error);
      toast.error('Failed to fetch attendance data');
    } finally {
      setAttendanceLoading(false);
    }
  };

  const fetchPerformanceData = async () => {
    try {
      setPerformanceLoading(true);
      const response = await api.get('/performance/my-insights');
      if (response.data.success) {
        setPerformanceData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching performance data:', error);
      toast.error('Failed to fetch performance insights');
    } finally {
      setPerformanceLoading(false);
    }
  };


  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setProfileData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setProfileData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      // Validate PAN format before saving
      const panNumber = (profileData.panDetails?.number || '').trim();
      if (panNumber && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(panNumber)) {
        toast.error('PAN number must be in format: ABCDE1234F (5 letters + 4 numbers + 1 letter)');
        return;
      }

      // Validate Aadhaar format before saving
      const aadhaarNumber = (profileData.aadhaarDetails?.number || '').trim();
      if (aadhaarNumber && !/^\d{12}$/.test(aadhaarNumber)) {
        toast.error('Aadhaar number must be exactly 12 digits');
        return;
      }

      // Prepare data for saving, excluding photo URLs from identity documents
      // as they should only be updated through file upload
      const dataToSave = {
        ...profileData,
        aadhaarDetails: {
          number: aadhaarNumber,
          verified: profileData.aadhaarDetails.verified
          // photo field will be updated only through file upload
        },
        panDetails: {
          number: panNumber,
          verified: profileData.panDetails.verified
          // photo field will be updated only through file upload
        }
      };

      const params = new URLSearchParams(location.search);
      const userId = params.get('userId');

      let response;
      if (userId && userId !== user._id) {
        // Update another user (Admin/HR action)
        const adminUpdateData = {
          firstName: dataToSave.firstName,
          lastName: dataToSave.lastName,
          phoneNumber: dataToSave.phone,
          dateOfBirth: dataToSave.dateOfBirth,
          address: dataToSave.address,
          emergencyContact: dataToSave.emergencyContact,
          education: dataToSave.education,
          bankDetails: dataToSave.bankDetails
        };
        response = await api.put(`/users/${userId}`, adminUpdateData);
      } else {
        // Update own profile
        response = await api.put('/users/profile', dataToSave);
      }


      if (response.data.success) {
        console.log('Save response:', response.data);
        // For admin update, the structure is data.user, for profile it is data
        const responseUser = (userId && userId !== user._id) ? response.data.data.user : response.data.data;

        console.log('Response user:', responseUser);
        setCurrentUser(responseUser);
        setIsEditing(false);
        toast.success('Profile updated successfully');
        // Refresh the profile data
        console.log('Fetching profile for userId:', userId);
        await fetchUserProfile(userId);
      }
    } catch (error) {
      console.error('Error updating profile:', error);

      // Handle validation errors from backend
      if (error.response?.data?.errors) {
        error.response.data.errors.forEach(err => {
          toast.error(err);
        });
      } else {
        toast.error(error.response?.data?.message || 'Failed to update profile');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setProfileData({
      firstName: currentUser?.firstName || '',
      lastName: currentUser?.lastName || '',
      email: currentUser?.email || '',
      phone: currentUser?.phone || '',
      address: currentUser?.address || '',
      dateOfBirth: currentUser?.dateOfBirth || '',
      joiningDate: currentUser?.joiningDate || '',
      emergencyContact: currentUser?.emergencyContact || '',
      profilePhoto: currentUser?.profilePhoto || '',
      bankDetails: currentUser?.bankDetails || {
        bankName: '',
        accountNumber: '',
        ifscCode: '',
        accountHolderName: ''
      },
      aadhaarDetails: currentUser?.aadhaarDetails || {
        number: '',
        photo: '',
        verified: false
      },
      panDetails: currentUser?.panDetails || {
        number: '',
        photo: '',
        verified: false
      },
      documents: currentUser?.documents || []
    });
    setIsEditing(false);
  };

  const handleDocumentUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setLoading(true);
      const uploadedUrl = await handleFileUpload(file);

      if (uploadedUrl) {
        // The handleFileUpload already updates the profileData and shows toast
        console.log('Document uploaded successfully:', uploadedUrl);
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error('Failed to upload document');
    } finally {
      setLoading(false);
      // Clear the file input
      event.target.value = '';
    }
  };

  const handleDeleteDocument = async (documentId) => {
    try {
      const response = await api.delete(`/users/document/${documentId}`);

      if (response.data.success) {
        setProfileData(prev => ({
          ...prev,
          documents: prev.documents.filter(doc => doc._id !== documentId)
        }));
        toast.success('Document deleted successfully');
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Failed to delete document');
    }
  };

  const renderPersonalInfo = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[
          { icon: Award, label: 'Role', value: currentUser?.role, color: 'blue' },
          { icon: User, label: 'Employee ID', value: currentUser?.employeeId, color: 'purple' },
          { icon: Calendar, label: 'Joined', value: profileData.joiningDate ? new Date(profileData.joiningDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'N/A', color: 'emerald' }
        ].map((item, i) => (
          <div key={i} className={`bg-gradient-to-br from-${item.color}-500/10 to-${item.color}-600/5 border border-${item.color}-500/20 rounded-2xl p-5 relative overflow-hidden group`}>
            <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity`}>
              <item.icon size={64} className={`text-${item.color}-500`} />
            </div>
            <div className="relative z-10">
              <div className={`h-10 w-10 rounded-lg bg-${item.color}-500/20 flex items-center justify-center mb-4`}>
                <item.icon size={20} className={`text-${item.color}-400`} />
              </div>
              <p className={`text-${item.color}-200/60 text-xs font-medium uppercase tracking-wider mb-1`}>{item.label}</p>
              <p className="text-xl font-bold text-white capitalize">{item.value}</p>

              {/* Show specializations under role for developers/interns */}
              {item.label === 'Role' && (currentUser?.role === 'developer' || currentUser?.role === 'intern' || currentUser?.role === 'team-lead') && currentUser?.specializations && currentUser.specializations.length > 0 && (
                <div className="mt-3 pt-3 border-t border-white/10">
                  <p className="text-zinc-400 text-[10px] uppercase tracking-wider mb-2">Specializations</p>
                  <div className="flex flex-wrap gap-1.5">
                    {currentUser.specializations.map((spec, idx) => (
                      <span key={idx} className="inline-flex items-center px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded-md text-[10px] font-semibold border border-blue-500/30">
                        • {spec}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/5 rounded-2xl p-6 md:p-8">
        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
          <User className="text-blue-500" size={20} /> Personal Details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          {[
            { label: 'First Name', field: 'firstName', icon: User },
            { label: 'Last Name', field: 'lastName', icon: User },
            { label: 'Email Address', field: 'email', icon: Mail, type: 'email', readOnly: true },
            { label: 'Phone Number', field: 'phone', icon: Phone, type: 'tel' },
            { label: 'Date of Birth', field: 'dateOfBirth', icon: Calendar, type: 'date', valueOverride: profileData.dateOfBirth ? new Date(profileData.dateOfBirth).toLocaleDateString('en-GB') : 'Not provided' },
            { label: 'Joining Date', field: 'joiningDate', icon: CalendarDays, type: 'text', readOnly: true, valueOverride: profileData.joiningDate ? formatDate(profileData.joiningDate) : 'Not provided' }
          ].map((field, i) => (
            <div key={i} className="group">
              <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                <field.icon size={12} /> {field.label}
              </label>
              {isEditing && !field.readOnly ? (
                <div className="relative">
                  <input
                    type={field.type || 'text'}
                    value={field.type === 'date' && profileData[field.field] ? profileData[field.field].split('T')[0] : profileData[field.field]}
                    onChange={(e) => handleInputChange(field.field, e.target.value)}
                    className="w-full bg-zinc-950/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all font-medium"
                    placeholder={`Enter ${field.label.toLowerCase()}`}
                  />
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-500 border border-white/5"></div>
                </div>
              ) : (
                <div className="bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-zinc-300 font-medium">
                  {field.valueOverride || profileData[field.field] || 'Not provided'}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6">
          <div className="group">
            <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-2">
              <MapPin size={12} /> Address
            </label>
            {isEditing ? (
              <textarea
                value={profileData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                rows={3}
                className="w-full bg-zinc-950/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all font-medium resize-none"
                placeholder="Enter complete address"
              />
            ) : (
              <div className="bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-zinc-300 font-medium">
                {profileData.address || 'Not provided'}
              </div>
            )}
          </div>
          <div className="group">
            <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Phone size={12} /> Emergency Contact
            </label>
            {isEditing ? (
              <input
                type="text"
                value={profileData.emergencyContact}
                onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
                className="w-full bg-zinc-950/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all font-medium"
                placeholder="Enter emergency contact"
              />
            ) : (
              <div className="bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-zinc-300 font-medium">
                {profileData.emergencyContact || 'Not provided'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Employment Information */}
      <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/5 rounded-2xl p-6 md:p-8">
        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
          <Building className="text-purple-500" size={20} /> Employment Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          {[
            { label: 'Department', value: profileData.department },
            { label: 'Designation', value: profileData.designation },
            {
              label: 'Reporting To',
              value: profileData.reportingTo ? `${profileData.reportingTo.firstName} ${profileData.reportingTo.lastName}` : 'N/A'
            },
            { label: 'Status', value: currentUser?.status || 'Active', isStatus: true }
          ].map((item, i) => (
            <div key={i} className="group">
              <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">
                {item.label}
              </label>
              {item.isStatus ? (
                <div className="bg-white/5 border border-white/5 rounded-xl px-4 py-3">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${(item.value === 'active' || item.value === 'Active')
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-zinc-700/50 text-zinc-400 border border-zinc-600/30'
                    }`}>
                    {item.value === 'active' || item.value === 'Active' ? 'Active' : item.value}
                  </span>
                </div>
              ) : (
                <div className="bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-zinc-300 font-medium">
                  {item.value || 'N/A'}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Education Information */}
      <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/5 rounded-2xl p-6 md:p-8">
        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
          <Award className="text-orange-500" size={20} /> Education
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          <div className="group">
            <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">
              Institute Name
            </label>
            {isEditing ? (
              <input
                type="text"
                value={profileData.education?.instituteName || ''}
                onChange={(e) => handleInputChange('education.instituteName', e.target.value)}
                className="w-full bg-zinc-950/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all font-medium"
                placeholder="Enter institute name"
              />
            ) : (
              <div className="bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-zinc-300 font-medium">
                {profileData.education?.instituteName || 'Not provided'}
              </div>
            )}
          </div>
          <div className="group">
            <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">
              Highest Qualification
            </label>
            {isEditing ? (
              <input
                type="text"
                value={profileData.education?.highestQualification || ''}
                onChange={(e) => handleInputChange('education.highestQualification', e.target.value)}
                className="w-full bg-zinc-950/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all font-medium"
                placeholder="Enter qualification"
              />
            ) : (
              <div className="bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-zinc-300 font-medium">
                {profileData.education?.highestQualification || 'Not provided'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderPayrollHistory = () => {
    // Mock Data for Co-Founder/Demo
    const mockHistory = [
      {
        _id: 'mock_dec_2025',
        salaryMonth: '2025-12-01T00:00:00.000Z',
        paymentStatus: 'paid',
        netSalary: 4250000,
        basicSalary: 2500000,
        allowances: { hra: 1200000, transport: 50000 },
        grossSalary: 4500000,
        deductions: { tax: 200000, providentFund: 50000, insurance: 0 },
        workingDays: { present: 22, total: 24, leave: 2 }
      },
      {
        _id: 'mock_nov_2025',
        salaryMonth: '2025-11-01T00:00:00.000Z',
        paymentStatus: 'paid',
        netSalary: 4200000,
        basicSalary: 2500000,
        allowances: { hra: 1200000, transport: 50000 },
        grossSalary: 4500000,
        deductions: { tax: 250000, providentFund: 50000, insurance: 0 },
        workingDays: { present: 24, total: 24, leave: 0 }
      },
      {
        _id: 'mock_oct_2025',
        salaryMonth: '2025-10-01T00:00:00.000Z',
        paymentStatus: 'processing',
        netSalary: 4250000,
        basicSalary: 2500000,
        allowances: { hra: 1200000, transport: 50000 },
        grossSalary: 4500000,
        deductions: { tax: 200000, providentFund: 50000, insurance: 0 },
        workingDays: { present: 20, total: 22, leave: 2 }
      }
    ];

    const displayHistory = payrollHistory.length > 0 ? payrollHistory : mockHistory;

    return (
      <div className="space-y-6">
        {payrollLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mb-4"></div>
            <span className="text-zinc-500 text-sm animate-pulse">Retreiving payroll records...</span>
          </div>
        ) : (
          <div className="space-y-4">
            {displayHistory.map((payroll) => (
              <div key={payroll._id} className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-all group relative overflow-hidden">
                {/* Accent line */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${payroll.paymentStatus === 'paid' ? 'bg-emerald-500' : payroll.paymentStatus === 'processing' ? 'bg-amber-500' : 'bg-rose-500'}`} />

                <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 pl-4">
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      {new Date(payroll.salaryMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </h3>
                    <div className="flex items-center space-x-2 mt-2">
                      <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md border ${payroll.paymentStatus === 'paid'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : payroll.paymentStatus === 'processing'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        }`}>
                        {payroll.paymentStatus}
                      </span>
                    </div>
                  </div>
                  <div className="text-right mt-4 md:mt-0">
                    <p className="text-3xl font-bold text-white tracking-tight">
                      ₹{payroll.netSalary?.toLocaleString()}
                    </p>
                    <p className="text-xs text-zinc-500 uppercase tracking-widest font-medium mt-1">Net Salary</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pl-4 border-t border-white/5 pt-6">
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Earnings</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Basic</span>
                        <span className="text-white font-medium">₹{payroll.basicSalary?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-400">HRA</span>
                        <span className="text-white font-medium">₹{payroll.allowances?.hra?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Transport</span>
                        <span className="text-white font-medium">₹{payroll.allowances?.transport?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between border-t border-white/5 pt-2 mt-2">
                        <span className="text-zinc-300 font-semibold">Gross</span>
                        <span className="text-emerald-400 font-bold">₹{payroll.grossSalary?.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Deductions</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Tax</span>
                        <span className="text-rose-400 font-medium">-₹{payroll.deductions?.tax?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Provident Fund</span>
                        <span className="text-rose-400 font-medium">-₹{payroll.deductions?.providentFund?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Insurance</span>
                        <span className="text-rose-400 font-medium">-₹{payroll.deductions?.insurance?.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Attendance Summary</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="bg-white/5 rounded-lg p-2 text-center">
                        <div className="text-zinc-400 text-xs">Present</div>
                        <div className="text-white font-bold">{payroll.workingDays?.present}</div>
                      </div>
                      <div className="bg-white/5 rounded-lg p-2 text-center">
                        <div className="text-zinc-400 text-xs">Total Days</div>
                        <div className="text-white font-bold">{payroll.workingDays?.total}</div>
                      </div>
                      <div className="bg-rose-500/10 rounded-lg p-2 text-center col-span-2">
                        <div className="text-rose-400 text-xs font-medium">Leaves: {payroll.workingDays?.leave}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderBankDetails = () => (
    <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/5 rounded-2xl p-6 md:p-8">
      <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
        <Landmark className="text-emerald-500" size={20} /> Bank Information
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[
          { label: 'Bank Name', field: 'bankName' },
          { label: 'Account Holder Name', field: 'accountHolderName' },
          { label: 'Account Number', field: 'accountNumber', type: 'password' },
          { label: 'IFSC Code', field: 'ifscCode' }
        ].map((item, i) => (
          <div key={i} className="group">
            <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">
              {item.label}
            </label>
            {isEditing ? (
              <input
                type="text"
                value={profileData.bankDetails[item.field]}
                onChange={(e) => handleInputChange(`bankDetails.${item.field}`, e.target.value)}
                className="w-full bg-zinc-950/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all font-medium"
                placeholder={`Enter ${item.label.toLowerCase()}`}
              />
            ) : (
              <div className="bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-zinc-300 font-medium font-mono">
                {item.type === 'password' && !isEditing && profileData.bankDetails[item.field]
                  ? `•••• •••• •••• ${profileData.bankDetails[item.field].slice(-4)}`
                  : profileData.bankDetails[item.field] || 'Not provided'
                }
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderSkills = () => (
    <div className="space-y-6">
      {/* Specializations Section */}
      {(currentUser?.specializations && currentUser.specializations.length > 0) && (
        <div className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 backdrop-blur-xl border border-blue-500/20 rounded-2xl p-6 md:p-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="h-12 w-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <Code className="text-blue-400 h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Specializations</h3>
              <p className="text-sm text-zinc-400">Core areas of expertise</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentUser.specializations.map((spec, index) => (
              <div key={index} className="bg-zinc-900/50 border border-blue-500/20 rounded-xl p-4 hover:border-blue-500/40 hover:bg-zinc-900/70 transition-all group">
                <div className="flex items-center space-x-3">
                  <div className="h-2 w-2 rounded-full bg-blue-500 group-hover:scale-125 transition-transform"></div>
                  <span className="text-white font-semibold text-lg">{spec}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Full Skillset Section */}
      {(currentUser?.skills && currentUser.skills.length > 0) && (
        <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/5 rounded-2xl p-6 md:p-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="h-12 w-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <Zap className="text-emerald-400 h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Technical Skills</h3>
              <p className="text-sm text-zinc-400">Complete skillset and technologies</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {currentUser.skills.map((skill, index) => (
              <div key={index} className="bg-zinc-800/30 border border-white/5 rounded-lg p-3 hover:border-emerald-500/30 hover:bg-zinc-800/50 transition-all group">
                <div className="flex items-start space-x-3">
                  <div className="mt-1">
                    <svg className="h-4 w-4 text-emerald-400 group-hover:text-emerald-300 transition-colors" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-zinc-200 font-medium group-hover:text-white transition-colors">{skill}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {(!currentUser?.specializations || currentUser.specializations.length === 0) && (!currentUser?.skills || currentUser.skills.length === 0) && (
        <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/5 rounded-2xl p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center mx-auto mb-4">
            <Code className="h-8 w-8 text-zinc-600" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">No Skills Added</h3>
          <p className="text-zinc-400 max-w-md mx-auto">
            Your skills and specializations will be displayed here once added by your administrator.
          </p>
        </div>
      )}
    </div>
  );

  const renderPerformance = () => {
    if (performanceLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mb-4"></div>
          <span className="text-zinc-500 text-sm animate-pulse">Loading performance insights...</span>
        </div>
      );
    }

    if (!performanceData) {
      return (
        <div className="text-center py-20 bg-zinc-900/50 rounded-2xl border border-white/5">
          <Award className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
          <p className="text-zinc-400 font-medium">No performance data available</p>
        </div>
      );
    }

    const { overview, achievements, insights, breakdown } = performanceData;

    const getRarityColor = (rarity) => {
      switch (rarity) {
        case 'legendary': return 'from-purple-500 to-pink-500';
        case 'epic': return 'from-indigo-500 to-purple-600';
        case 'rare': return 'from-blue-500 to-cyan-500';
        default: return 'from-zinc-600 to-zinc-700';
      }
    };

    const getScoreColor = (score) => {
      if (score >= 90) return 'text-green-500';
      if (score >= 70) return 'text-blue-500';
      if (score >= 50) return 'text-yellow-500';
      return 'text-red-500';
    };

    return (
      <div className="space-y-6">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Productivity Score', value: `${overview.productivityScore}%`, icon: Target, color: 'blue', subIcon: TrendingUp },
            { label: 'Completion Rate', value: `${overview.completionRate}%`, icon: CheckCircle2, color: 'emerald', subIcon: TrendingUp },
            { label: 'Total Points', value: overview.totalPoints, icon: Award, color: 'purple', subIcon: Zap },
            { label: 'Current Streak', value: `${overview.currentStreak} days`, icon: Clock, color: 'orange', subIcon: CalendarDays }
          ].map((stat, i) => (
            <div key={i} className={`bg-gradient-to-br from-${stat.color}-500 to-${stat.color}-600 rounded-2xl p-6 relative overflow-hidden group shadow-lg shadow-${stat.color}-500/20`}>
              <div className="relative z-10 text-white">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                    <stat.icon size={24} className="text-white" />
                  </div>
                  <stat.subIcon size={20} className="text-white/60" />
                </div>
                <p className="text-white/80 text-xs font-medium uppercase tracking-wider mb-1">{stat.label}</p>
                <p className="text-3xl font-bold">{stat.value}</p>
              </div>
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-110 transition-transform duration-500"></div>
            </div>
          ))}
        </div>

        {/* Daily/Weekly/Monthly Stats */}
        {(performanceData.daily || performanceData.weekly || performanceData.monthly) && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Daily Stats */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-blue-500" />
                Today's Performance
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Tasks Completed</span>
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-bold">
                    {performanceData.daily?.tasksCompleted || 0}/{performanceData.daily?.tasksAssigned || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Points Earned</span>
                  <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-bold">
                    {performanceData.daily?.pointsEarned || 0}
                  </span>
                </div>
                {performanceData.daily?.extraTasks > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 flex items-center">
                      <Zap className="h-4 w-4 mr-1 text-yellow-500" />
                      Extra Tasks
                    </span>
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-bold">
                      +{performanceData.daily.extraTasks}
                    </span>
                  </div>
                )}
                {performanceData.daily?.coverageTasks > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 flex items-center">
                      <Users className="h-4 w-4 mr-1 text-blue-500" />
                      Coverage Tasks
                    </span>
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-bold">
                      {performanceData.daily.coverageTasks}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">On-Time Completions</span>
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-bold">
                    {performanceData.daily?.onTimeCompletions || 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Weekly Stats */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <CalendarDays className="h-5 w-5 mr-2 text-green-500" />
                This Week's Performance
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Tasks Completed</span>
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-bold">
                    {performanceData.weekly?.tasksCompleted || 0}/{performanceData.weekly?.tasksAssigned || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Points Earned</span>
                  <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-bold">
                    {performanceData.weekly?.pointsEarned || 0}
                  </span>
                </div>
                {performanceData.weekly?.extraTasks > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 flex items-center">
                      <Zap className="h-4 w-4 mr-1 text-yellow-500" />
                      Extra Tasks
                    </span>
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-bold">
                      +{performanceData.weekly.extraTasks}
                    </span>
                  </div>
                )}
                {performanceData.weekly?.coverageTasks > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 flex items-center">
                      <Users className="h-4 w-4 mr-1 text-blue-500" />
                      Coverage Tasks
                    </span>
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-bold">
                      {performanceData.weekly.coverageTasks}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">On-Time Completions</span>
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-bold">
                    {performanceData.weekly?.onTimeCompletions || 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Monthly Stats */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <BarChart3 className="h-5 w-5 mr-2 text-purple-500" />
                This Month's Performance
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Tasks Completed</span>
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-bold">
                    {performanceData.monthly?.tasksCompleted || 0}/{performanceData.monthly?.tasksAssigned || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Points Earned</span>
                  <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-bold">
                    {performanceData.monthly?.pointsEarned || 0}
                  </span>
                </div>
                {performanceData.monthly?.extraTasks > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 flex items-center">
                      <Zap className="h-4 w-4 mr-1 text-yellow-500" />
                      Extra Tasks
                    </span>
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-bold">
                      +{performanceData.monthly.extraTasks}
                    </span>
                  </div>
                )}
                {performanceData.monthly?.coverageTasks > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 flex items-center">
                      <Users className="h-4 w-4 mr-1 text-blue-500" />
                      Coverage Tasks
                    </span>
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-bold">
                      {performanceData.monthly.coverageTasks}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">On-Time Completions</span>
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-bold">
                    {performanceData.monthly?.onTimeCompletions || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Insights */}
        {insights && insights.length > 0 && (
          <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/5 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <Zap className="text-amber-500" size={20} /> AI Insights & Recommendations
            </h3>
            <div className="grid gap-4">
              {insights.map((insight, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-xl border-l-4 ${insight.type === 'positive' ? 'bg-emerald-500/5 border-emerald-500' :
                    insight.type === 'suggestion' ? 'bg-blue-500/5 border-blue-500' :
                      'bg-zinc-500/5 border-zinc-500'
                    }`}
                >
                  <div className="flex items-start gap-4">
                    <span className="text-2xl mt-1">{insight.icon}</span>
                    <div>
                      <p className={`text-sm font-medium mb-1 ${insight.type === 'positive' ? 'text-emerald-400' :
                        insight.type === 'suggestion' ? 'text-blue-400' : 'text-zinc-400'
                        }`}>{insight.type === 'positive' ? 'Strength' : 'Recommendation'}</p>
                      <p className="text-sm text-zinc-300 leading-relaxed">{insight.message}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Achievements */}
        <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/5 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <Award className="text-purple-500" size={20} />
            Achievements <span className="text-zinc-500 text-sm font-normal ml-2">({achievements.filter(a => a.earned).length}/{achievements.length})</span>
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {achievements.map((achievement) => (
              <div
                key={achievement.id}
                className={`text-center p-4 rounded-xl transition-all relative group ${achievement.earned
                  ? 'bg-gradient-to-br ' + getRarityColor(achievement.rarity) + ' shadow-lg border border-white/10'
                  : 'bg-zinc-900/50 border border-white/5 opacity-50 grayscale'
                  }`}
              >
                <div className="text-4xl mb-3 transform group-hover:scale-110 transition-transform duration-300">{achievement.icon}</div>
                <p className={`text-xs font-bold ${achievement.earned ? 'text-white' : 'text-zinc-500'}`}>
                  {achievement.name}
                </p>
                <p className={`text-[10px] mt-2 leading-tight ${achievement.earned ? 'text-white/80' : 'text-zinc-600'}`}>
                  {achievement.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Performance Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* By Priority */}
          <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/5 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-6">Tasks by Priority</h3>
            <div className="space-y-4">
              {[
                { label: 'High Priority', value: breakdown.byPriority.high, color: 'rose' },
                { label: 'Medium Priority', value: breakdown.byPriority.medium, color: 'amber' },
                { label: 'Low Priority', value: breakdown.byPriority.low, color: 'emerald' }
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                  <span className="text-sm font-medium text-zinc-300 ml-2">{item.label}</span>
                  <span className={`px-3 py-1 bg-${item.color}-500/10 text-${item.color}-400 rounded-lg text-sm font-bold border border-${item.color}-500/20`}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* By Status */}
          <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/5 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-6">Tasks by Status</h3>
            <div className="space-y-4">
              {[
                { label: 'Completed', value: breakdown.byStatus.completed, color: 'emerald' },
                { label: 'In Progress', value: breakdown.byStatus.inProgress, color: 'blue' },
                { label: 'Pending', value: breakdown.byStatus.pending, color: 'zinc' }
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                  <span className="text-sm font-medium text-zinc-300 ml-2">{item.label}</span>
                  <span className={`px-3 py-1 bg-${item.color}-500/10 text-${item.color}-400 rounded-lg text-sm font-bold border border-${item.color}-500/20`}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Skills Breakdown */}
        {breakdown.bySkill && Object.keys(breakdown.bySkill).length > 0 && (
          <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/5 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <Code className="text-blue-500" size={20} /> Skills Utilization
            </h3>
            <div className="flex flex-wrap gap-3">
              {Object.entries(breakdown.bySkill)
                .sort(([, a], [, b]) => b - a)
                .map(([skill, count]) => (
                  <span
                    key={skill}
                    className="px-4 py-2 bg-blue-500/10 text-blue-400 rounded-xl text-sm font-semibold border border-blue-500/20 flex items-center gap-2"
                  >
                    {skill} <span className="bg-blue-500/20 px-1.5 rounded text-xs">{count}</span>
                  </span>
                ))}
            </div>
          </div>
        )}
        {/* Additional Stats */}
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Additional Metrics</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Longest Streak</p>
              <p className="text-2xl font-bold text-orange-600">{overview.longestStreak} days</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">On-Time Delivery</p>
              <p className="text-2xl font-bold text-green-600">{overview.onTimeDeliveryRate}%</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Avg Points/Task</p>
              <p className="text-2xl font-bold text-purple-600">{overview.averagePointsPerTask || 0}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Performance Level</p>
              <p className={`text-2xl font-bold ${getScoreColor(overview.productivityScore)}`}>
                {overview.productivityScore >= 90 ? 'Excellent' :
                  overview.productivityScore >= 70 ? 'Good' :
                    overview.productivityScore >= 50 ? 'Average' : 'Needs Improvement'}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Rank</p>
              <p className="text-2xl font-bold text-blue-600">
                {overview.productivityScore >= 90 ? '🌟 S' :
                  overview.productivityScore >= 80 ? '🥇 A' :
                    overview.productivityScore >= 70 ? '🥈 B' :
                      overview.productivityScore >= 60 ? '🥉 C' : '📈 D'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderDocuments = () => (
    <div className="space-y-6">
      {/* Identity Documents Section */}
      <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/5 rounded-2xl p-6">
        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
          <CreditCard className="text-blue-500" size={20} /> Identity Verification
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card Component for Aadhaar/PAN */}
          {['aadhaar', 'pan'].map((type) => {
            const isAadhaar = type === 'aadhaar';
            const details = isAadhaar ? profileData.aadhaarDetails : profileData.panDetails;
            const label = isAadhaar ? 'Aadhaar Card' : 'PAN Card';
            const fieldName = isAadhaar ? 'aadhaarDetails.number' : 'panDetails.number';
            const color = isAadhaar ? 'blue' : 'emerald';

            return (
              <div key={type} className="bg-black/20 rounded-xl p-5 border border-white/5 hover:border-white/10 transition-all">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold text-white flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full bg-${color}-500`} />
                    {label}
                  </h4>
                  {details.verified && (
                    <span className="px-2 py-1 bg-green-500/10 text-green-400 text-[10px] font-bold uppercase tracking-wider rounded border border-green-500/20 flex items-center gap-1">
                      <CheckCircle size={10} /> Verified
                    </span>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Number</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={details.number}
                        onChange={(e) => handleInputChange(fieldName, isAadhaar ? e.target.value.replace(/\D/g, '') : e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                        className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500/50"
                        maxLength={isAadhaar ? 12 : 10}
                      />
                    ) : (
                      <div className="bg-white/5 px-3 py-2 rounded-lg text-zinc-300 text-sm font-mono tracking-wide">
                        {details.number || 'Not provided'}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Document Image</label>
                    {/* Preview / Upload Logic */}
                    {details.photo ? (
                      <div className="relative group">
                        <img src={details.photo} alt={label} className="w-full h-32 object-cover rounded-lg border border-white/10 opacity-75 group-hover:opacity-100 transition-opacity" />
                        <div className="absolute inset-x-0 bottom-0 p-2 bg-black/60 backdrop-blur-sm flex justify-center gap-2 rounded-b-lg">
                          <button onClick={() => window.open(details.photo, '_blank')} className="p-1.5 text-white hover:text-blue-400"><Eye size={16} /></button>
                          {isEditing && (
                            <button onClick={() => setProfileData(prev => ({ ...prev, [isAadhaar ? 'aadhaarDetails' : 'panDetails']: { ...details, photo: '' } }))} className="p-1.5 text-white hover:text-red-400"><X size={16} /></button>
                          )}
                        </div>
                      </div>
                    ) : (
                      isEditing && (
                        <label className={`flex flex-col items-center justify-center w-full h-32 border border-dashed border-zinc-700 rounded-lg cursor-pointer hover:bg-white/5 transition-colors ${uploadingFile ? 'opacity-50 pointer-events-none' : ''}`}>
                          {uploadingFile ? <div className="animate-spin h-5 w-5 border-2 border-blue-500 rounded-full border-t-transparent" /> : <Upload className="text-zinc-500 mb-2" size={20} />}
                          <span className="text-xs text-zinc-400">{uploadingFile ? 'Uploading...' : 'Upload Image'}</span>
                          <input type="file" className="hidden" accept="image/*,.pdf" disabled={uploadingFile} onChange={(e) => e.target.files[0] && handleFileUpload(e.target.files[0], type)} />
                        </label>
                      )
                    )}
                    {!details.photo && !isEditing && (
                      <div className="h-32 flex items-center justify-center border border-dashed border-zinc-800 rounded-lg text-zinc-600 text-xs">No document uploaded</div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Other Documents */}
      <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/5 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <FileText className="text-purple-500" size={20} /> Other Documents
          </h3>
          <label className={`bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-xl cursor-pointer flex items-center gap-2 text-sm border border-white/10 transition-all ${uploadingFile ? 'opacity-50 pointer-events-none' : ''}`}>
            {uploadingFile ? <div className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent" /> : <Upload size={16} />}
            <span>Upload New</span>
            <input type="file" className="hidden" disabled={uploadingFile} onChange={handleDocumentUpload} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" />
          </label>
        </div>

        {profileData.documents.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-zinc-800 rounded-xl">
            <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-3">
              <FileText className="text-zinc-700" size={32} />
            </div>
            <p className="text-zinc-500 text-sm">No additional documents uploaded</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {profileData.documents.map((doc, index) => (
              <div key={index} className="bg-black/20 border border-white/5 rounded-xl p-4 hover:border-white/10 transition-all group">
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <FileText className="text-blue-400" size={20} />
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => window.open(doc.url, '_blank')} className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded"><Eye size={14} /></button>
                    <button onClick={() => window.open(doc.downloadUrl || doc.url, '_blank')} className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded"><Download size={14} /></button>
                    {isEditing && <button onClick={() => handleDeleteDocument(doc._id)} className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-white/10 rounded"><X size={14} /></button>}
                  </div>
                </div>
                <p className="text-white font-medium text-sm truncate mb-1" title={doc.name}>{doc.name}</p>
                <p className="text-zinc-500 text-xs">{doc.uploadDate ? formatDate(doc.uploadDate) : 'Unknown date'}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // Helper functions for attendance
  const getStatusColor = (status) => {
    switch (status) {
      case 'present': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'late': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'partial': return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      case 'absent': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'leave': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'holiday': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'early-departure': return 'bg-pink-500/10 text-pink-400 border-pink-500/20';
      default: return 'bg-zinc-800 text-zinc-400 border-zinc-700';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'present': return <CheckCircle2 size={14} />;
      case 'late': return <Clock size={14} />;
      case 'partial': return <Minus size={14} />;
      case 'absent': return <XCircle size={14} />;
      case 'leave': return <CalendarDays size={14} />;
      case 'holiday': return <Award size={14} />;
      case 'early-departure': return <Timer size={14} />;
      default: return <Minus size={14} />;
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return '--';
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatWorkingHours = (minutes) => {
    if (!minutes) return '0h 0m';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };



  const handleBack = () => {
    if (location.state?.from) {
      navigate(location.state.from);
    } else {
      navigate(-1);
    }
  };

  return (
    <DashboardLayout
      sidebarActions={sidebarActions}
      showBackButton={true}
      onBack={handleBack}
    >
      <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-900/50 backdrop-blur-xl p-6 rounded-2xl border border-white/5 shadow-xl">
          <div className="flex items-center gap-6">
            {/* Profile Photo with Upload */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full opacity-75 blur group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative h-20 w-20 rounded-full bg-zinc-950 flex items-center justify-center border border-white/10 overflow-hidden">
                {profileData.profilePhoto ? (
                  <img
                    src={profileData.profilePhoto.startsWith('http')
                      ? profileData.profilePhoto
                      : `http://localhost:5001${profileData.profilePhoto.startsWith('/') ? '' : '/'}${profileData.profilePhoto}`}
                    alt="Profile"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.error('Failed to load profile photo:', profileData.profilePhoto);
                      // Hide the image and show the User icon fallback
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  <User className="h-10 w-10 text-white" />
                )}
                {/* Fallback User icon - shown when no photo or on error */}
                {!profileData.profilePhoto && (
                  <User className="h-10 w-10 text-white" />
                )}
              </div>

              {/* Upload button overlay - only visible in edit mode */}
              {isEditing && (
                <label className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <Upload className="h-6 w-6 text-white" />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files[0];
                      if (file) {
                        await handleFileUpload(file, 'profile');
                      }
                    }}
                  />
                </label>
              )}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">{currentUser?.firstName} {currentUser?.lastName}</h1>
              <div className="flex items-center gap-3 mt-1.5">
                <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-xs font-medium text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Award size={12} />
                  {currentUser?.role || 'Employee'}
                </span>
                <span className="text-zinc-500 text-sm">•</span>
                <span className="text-zinc-400 text-sm font-mono">{currentUser?.employeeId}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isEditing ? (
              <>
                <button
                  onClick={handleCancel}
                  disabled={loading}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl font-medium transition-all border border-white/5"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2"
                >
                  <Save size={18} />
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-medium transition-all border border-white/5 flex items-center gap-2 hover:border-white/10"
              >
                <Edit size={18} className="text-zinc-400" />
                Edit Profile
              </button>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="min-h-[500px]">
          {activeTab === 'personal' && renderPersonalInfo()}
          {activeTab === 'skills' && renderSkills()}
          {activeTab === 'payroll' && renderPayrollHistory()}
          {activeTab === 'performance' && renderPerformance()}
          {activeTab === 'bank' && renderBankDetails()}
          {activeTab === 'documents' && renderDocuments()}

        </div>
      </div>
    </DashboardLayout>
  );
};

export default Profile;
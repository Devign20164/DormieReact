import React, { useState, useEffect, useContext } from 'react';
import {
  Box,
  Typography,
  Card,
  Stack,
  Grid,
  IconButton,
  CircularProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Divider,
  MenuItem,
  Select,
  FormControl,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  Avatar,
  Collapse,
  Tab,
  Tabs,
  Paper,
  Pagination,
  Tooltip,
  ButtonGroup,
  Menu,
  Drawer,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useTheme
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  PlayArrow as PlayArrowIcon,
  Done as DoneIcon,
  LocationOn as LocationIcon,
  AccessTime as AccessTimeIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  ListAlt as ListAltIcon,
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  AccountCircle as AccountCircleIcon,
  Warning as WarningIcon,
  Block as BlockIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  FolderOpen as FolderOpenIcon,
  Download as DownloadIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Refresh as RefreshIcon,
  Restore as RestoreIcon,
  Star as StarIcon,
  AttachFile as AttachFileIcon,
  InsertDriveFile as InsertDriveFileIcon,
  History as HistoryIcon,
} from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import AdminSidebar from '../components/AdminSidebar';
import NotificationBell from '../components/NotificationBell';
import axios from 'axios';
import { 
  format, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  startOfMonth, 
  endOfMonth, 
  isSameDay, 
  isToday, 
  addMonths, 
  subMonths, 
  getMonth, 
  getYear,
  addDays 
} from 'date-fns';
import { toast } from 'react-toastify';
import { ThemeContext } from '../App';

// Status configurations
const statusConfig = {
  Submitted: { color: '#3B82F6', icon: <AssignmentIcon />, bgGradient: 'linear-gradient(145deg, #1E40AF 0%, #3B82F6 100%)' },
  Approved: { color: '#10B981', icon: <CheckCircleIcon />, bgGradient: 'linear-gradient(145deg, #047857 0%, #10B981 100%)' },
  Rejected: { color: '#EF4444', icon: <CancelIcon />, bgGradient: 'linear-gradient(145deg, #B91C1C 0%, #EF4444 100%)' },
  Assigned: { color: '#8B5CF6', icon: <PersonIcon />, bgGradient: 'linear-gradient(145deg, #6D28D9 0%, #8B5CF6 100%)' },
  'In Progress': { color: '#EC4899', icon: <PlayArrowIcon />, bgGradient: 'linear-gradient(145deg, #BE185D 0%, #EC4899 100%)' },
  Completed: { color: '#14B8A6', icon: <DoneIcon />, bgGradient: 'linear-gradient(145deg, #0F766E 0%, #14B8A6 100%)' },
};

const STAFF_MEMBERS = [
  { id: 1, name: 'John Smith', role: 'Senior Maintenance', status: 'available', workload: 'low' },
  { id: 2, name: 'Sarah Johnson', role: 'Plumbing Specialist', status: 'busy', workload: 'high' },
  { id: 3, name: 'Mike Brown', role: 'Electrician', status: 'away', workload: 'medium' },
  { id: 4, name: 'Lisa Davis', role: 'HVAC Technician', status: 'available', workload: 'low' },
  { id: 5, name: 'James Wilson', role: 'General Maintenance', status: 'available', workload: 'medium' },
];

const MOCK_ASSIGNMENTS = [
  { 
    id: 1, 
    staffId: 1, 
    formId: 'F123', 
    date: '2024-03-20', 
    time: '09:00-11:00',
    type: 'Plumbing',
    priority: 'high',
    status: 'in-progress',
    location: 'Block A, Room 101',
  },
  { 
    id: 2, 
    staffId: 2, 
    formId: 'F124', 
    date: '2024-03-20', 
    time: '14:00-16:00',
    type: 'Electrical',
    priority: 'medium',
    status: 'pending',
    location: 'Block B, Room 203',
  },
  // Add more mock assignments as needed
];

const AdminForm = () => {
  const { mode } = useContext(ThemeContext);
  const theme = useTheme();
  
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedForm, setSelectedForm] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [expandedStatus, setExpandedStatus] = useState({});
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [page, setPage] = useState(1);
  const formsPerPage = 6;
  const [filterType, setFilterType] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);
  const [staffMembers, setStaffMembers] = useState([]);
  const [filteredStaff, setFilteredStaff] = useState([]);
  const [statsSummary, setStatsSummary] = useState({
    total: 0,
    pending: 0,
    assigned: 0,
    inProgress: 0,
    completed: 0,
    rejected: 0
  });

  useEffect(() => {
    const fetchForms = async () => {
      try {
        setLoading(true);
        // Include credentials (cookies) with the request
        const response = await axios.get('/api/admin/forms', {
          withCredentials: true, // This ensures the JWT cookie is sent
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        // The API returns an object with forms, stats, and count
        const fetchedForms = response.data.forms;
        
        setForms(fetchedForms);
        
        // Use the stats directly from the API response
        setStatsSummary({
          total: response.data.stats.total || 0,
          pending: response.data.stats.pending || 0,
          assigned: response.data.stats.assigned || 0,
          inProgress: response.data.stats.inProgress || 0, 
          completed: response.data.stats.completed || 0,
          rejected: response.data.stats.rejected || 0
        });
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching forms:', err);
        
        // More detailed error handling
        if (err.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          if (err.response.status === 403) {
            setError('Authentication error: You do not have permission to access this resource. Please log in as admin.');
          } else {
            setError(`Failed to fetch forms: ${err.response.status} ${err.response.data.message || err.response.statusText}`);
          }
        } else if (err.request) {
          // The request was made but no response was received
          setError('Network error: Server did not respond. Please check your connection.');
        } else {
          // Something happened in setting up the request that triggered an Error
          setError('Error: ' + err.message);
        }
        
        setLoading(false);
        
        // For development, provide mock data for UI testing
        if (process.env.NODE_ENV === 'development') {
          const mockForms = [
            { 
              _id: '1', 
              title: 'Sample Maintenance Request',
              description: 'This is a sample maintenance request for testing purposes',
              formType: 'Maintenance',
              status: 'Pending',
              student: { name: 'John Doe', room: { roomNumber: '101', building: { name: 'West Hall' } } },
              createdAt: new Date().toISOString(),
              preferredStartTime: new Date().toISOString()
            },
            { 
              _id: '2', 
              title: 'Sample Cleaning Request',
              description: 'This is a sample cleaning request for testing purposes',
              formType: 'Cleaning',
              status: 'Assigned',
              student: { name: 'Jane Smith', room: { roomNumber: '202', building: { name: 'East Hall' } } },
              createdAt: new Date().toISOString(),
              preferredStartTime: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
              staff: { name: 'Staff Member', typeOfStaff: 'Cleaner' }
            }
          ];
          
          setForms(mockForms);
          
          // Mock statistics
          setStatsSummary({
            total: 2,
            pending: 1,
            assigned: 1,
            inProgress: 0,
            completed: 0,
            rejected: 0
          });
          
          toast.warning('Using mock data for development. API call failed: ' + err.message);
        } else {
          // In production, clear the forms
          setForms([]);
        }
      }
    };
    
    fetchForms();
  }, []);

  // Fetch staff members
  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const response = await axios.get('/api/admin/staff', {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        setStaffMembers(response.data);
      } catch (err) {
        console.error('Error fetching staff:', err);
        toast.error('Failed to fetch staff members');
      }
    };

    fetchStaff();
  }, []);

  // Reset page when status filter changes
  useEffect(() => {
    setPage(1);
  }, [selectedStatus, filterType, searchTerm]);

  const filteredForms = forms
    .filter(form => 
      (selectedStatus === 'All' || form.status === selectedStatus) &&
      (filterType === 'All' || form.formType === filterType) &&
      (searchTerm === '' || 
        form.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        form.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (form.student?.name && form.student.name.toLowerCase().includes(searchTerm.toLowerCase())))
    )
    .sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.createdAt) - new Date(a.createdAt);
      } else if (sortBy === 'oldest') {
        return new Date(a.createdAt) - new Date(b.createdAt);
      } else if (sortBy === 'priority') {
        // Assuming higher priority forms have a priority field or calculating based on type/status
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
      }
      return 0;
    });

  const handleStatusChange = async (formId, newStatus) => {
    try {
      setStatusLoading(true);
      console.log('Updating form status:', { formId, newStatus });
      
      // For rejected forms, prompt for a reason
      let notes = null;
      if (newStatus === 'Rejected') {
        notes = prompt('Please enter a reason for rejection:');
        if (notes === null) {
          // User cancelled the prompt
          setStatusLoading(false);
          return;
        }
      }

      const requestBody = { 
        status: newStatus,
        notes: notes
      };

      const requestConfig = { 
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
        }
      };

      console.log('Making API request:', {
        url: `/api/admin/forms/${formId}/status`,
        method: 'PUT',
        body: requestBody,
        config: requestConfig
      });
      
      // Make the API call to update the status with credentials
      const response = await axios.put(
        `/api/admin/forms/${formId}/status`, 
        requestBody,
        requestConfig
      );

      console.log('API response:', response);

      if (!response.data) {
        throw new Error('No response data received');
      }

      // Update local state with the returned form data
      setForms(prevForms => {
        return prevForms.map(form => 
          form._id === formId ? response.data : form
        );
      });
      
      // Update the selected form if it's the one being updated
      if (selectedForm && selectedForm._id === formId) {
        setSelectedForm(response.data);
      }
      
      // Update statistics after status change
      setStatsSummary(prev => {
        const newStats = { ...prev };
        
        // Decrement the count for the previous status
        const oldStatus = forms.find(form => form._id === formId)?.status;
        if (oldStatus) {
          const oldStatusKey = oldStatus === 'In Progress' ? 'inProgress' : oldStatus.toLowerCase();
          newStats[oldStatusKey] = Math.max(0, (newStats[oldStatusKey] || 0) - 1);
        }
        
        // Increment the count for the new status
        const newStatusKey = newStatus === 'In Progress' ? 'inProgress' : newStatus.toLowerCase();
        newStats[newStatusKey] = (newStats[newStatusKey] || 0) + 1;
        
        return newStats;
      });
      
      // Show success message
      toast.success(`Form status updated to ${newStatus.toLowerCase()} successfully`);
      
      // Only close dialog for certain status changes
      if (newStatus === 'Approved' || newStatus === 'Rejected' || newStatus === 'Completed') {
      if (openDialog) {
        handleCloseDialog();
      }
      }
    } catch (err) {
      console.error('Error in handleStatusChange:', err);
      let errorMessage = 'Failed to update form status';
      
      if (err.response) {
        if (err.response.status === 403) {
          errorMessage = 'Authentication error: You do not have permission to change form status.';
        } else {
          errorMessage = err.response.data?.message || err.response.statusText || errorMessage;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setStatusLoading(false);
    }
  };
  
  const assignStaffToForm = async (formId, staffId) => {
    try {
      setStatusLoading(true);
      console.log('Assigning staff to form:', { formId, staffId });
      
      // Make the API call to assign staff to the form
      const response = await axios.put(
        `/api/admin/forms/${formId}/assign`,
        { staffId },
        { 
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
      
      if (!response.data) {
        throw new Error('No response data received');
      }
      
      // Update local state with the returned form data
      setForms(prevForms => {
        return prevForms.map(form => 
          form._id === formId ? response.data : form
        );
      });
      
      // Update the selected form if it's the one being updated
      if (selectedForm && selectedForm._id === formId) {
        setSelectedForm(response.data);
      }
      
      // Update statistics after staff assignment
      setStatsSummary(prev => {
        const newStats = { ...prev };
        newStats.assigned = (newStats.assigned || 0) + 1;
        return newStats;
      });
      
      // Close assignment dialog
      setAssignmentDialogOpen(false);
      
      // Show success message
      toast.success('Staff assigned successfully');
    } catch (err) {
      console.error('Error in assignStaffToForm:', err);
      let errorMessage = 'Failed to assign staff to form';
      
      if (err.response) {
        if (err.response.status === 403) {
          errorMessage = 'Authentication error: You do not have permission to assign staff.';
        } else if (err.response.status === 400) {
          errorMessage = err.response.data?.message || 'Invalid staff assignment request';
        } else {
          errorMessage = err.response.data?.message || err.response.statusText || errorMessage;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setStatusLoading(false);
    }
  };

  const handleOpenDialog = (form) => {
    setSelectedForm(form);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedForm(null);
  };

  const handleExpandStatus = (status) => {
    setExpandedStatus(prev => ({
      ...prev,
      [status]: !prev[status]
    }));
  };

  const groupFormsByStatus = () => {
    return forms.reduce((acc, form) => {
      if (!acc[form.status]) {
        acc[form.status] = [];
      }
      acc[form.status].push(form);
      return acc;
    }, {});
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'available': return '#10B981';
      case 'busy': return '#EF4444';
      case 'away': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const getWorkloadColor = (workload) => {
    switch(workload) {
      case 'low': return '#10B981';
      case 'medium': return '#F59E0B';
      case 'high': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const renderStatisticCard = ({ title, value, color, icon, percentage }) => (
    <Card sx={{ 
      bgcolor: 'rgba(0,0,0,0.2)', 
      borderRadius: 2, 
      p: 2.5,
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      border: '1px solid rgba(255,255,255,0.05)',
      height: '100%',
      transition: 'transform 0.2s ease-in-out',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: '0 10px 20px rgba(0,0,0,0.2)',
      }
    }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography 
          variant="h6" 
          sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}
        >
          {title}
        </Typography>
        <Avatar sx={{ bgcolor: `${color}20`, color: color }}>
          {icon}
        </Avatar>
      </Stack>
      <Typography variant="h3" sx={{ color: '#fff', mb: 1 }}>
        {value}
      </Typography>
      {percentage && (
        <Typography variant="body2" sx={{ color: percentage >= 0 ? '#10B981' : '#EF4444' }}>
          {percentage >= 0 ? '+' : ''}{percentage}% since last month
        </Typography>
      )}
    </Card>
  );

  const renderStatusCards = () => (
    <Box sx={{ 
      maxWidth: '1200px', 
      mx: 'auto', 
      width: '100%', 
      mb: 4,
    }}>
      <Grid container spacing={1}>
        {Object.entries(statusConfig).map(([status, config]) => {
          const count = forms.filter(form => form.status === status).length;
          return (
            <Grid item xs={12/7} key={status}>
              <Card
                onClick={() => setSelectedStatus(status)}
                sx={{
                  background: 'linear-gradient(145deg, #141414 0%, #0A0A0A 100%)',
                  borderRadius: '12px',
                  p: 1.5,
                  border: `1px solid ${selectedStatus === status ? config.color : 'rgba(255,255,255,0.03)'}`,
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  minWidth: 0,
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: `0 8px 25px ${config.color}20`,
                  },
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <Avatar
                    sx={{
                      bgcolor: `${config.color}20`,
                      color: config.color,
                      width: 36,
                      height: 36,
                      flexShrink: 0,
                    }}
                  >
                    {React.cloneElement(config.icon, { sx: { fontSize: 20 } })}
                  </Avatar>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="h6" sx={{ 
                      fontWeight: 600, 
                      color: config.color,
                      fontSize: '1.1rem',
                      lineHeight: 1.2,
                      mb: 0.25
                    }}>
                      {count}
                    </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: '#6B7280', 
                        fontSize: '0.75rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {status}
                    </Typography>
                  </Box>
                </Stack>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );

  const renderDashboard = () => (
    <Box sx={{ mb: 5 }}>
      <Typography variant="h5" sx={{ color: '#fff', mb: 3 }}>
        Forms Dashboard
      </Typography>
      
      {/* Statistics Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          {renderStatisticCard({
            title: 'Total Forms',
            value: statsSummary.total,
            color: '#3B82F6',
            icon: <AssignmentIcon />,
            percentage: 12
          })}
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          {renderStatisticCard({
            title: 'Pending',
            value: statsSummary.pending,
            color: '#F59E0B',
            icon: <ScheduleIcon />,
            percentage: 5
          })}
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          {renderStatisticCard({
            title: 'Assigned',
            value: statsSummary.assigned,
            color: '#8B5CF6',
            icon: <PersonIcon />,
            percentage: 8
          })}
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          {renderStatisticCard({
            title: 'In Progress',
            value: statsSummary.inProgress,
            color: '#EC4899',
            icon: <PlayArrowIcon />,
            percentage: -3
          })}
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          {renderStatisticCard({
            title: 'Completed',
            value: statsSummary.completed,
            color: '#10B981',
            icon: <DoneIcon />,
            percentage: 15
          })}
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          {renderStatisticCard({
            title: 'Rejected',
            value: statsSummary.rejected,
            color: '#EF4444',
            icon: <CancelIcon />,
            percentage: -2
          })}
        </Grid>
      </Grid>

      {/* Filters and Search */}
      <Box sx={{ 
        display: 'flex',
        flexWrap: 'wrap',
        gap: 2, 
        mb: 3,
        p: 2,
        bgcolor: 'rgba(0,0,0,0.2)',
        borderRadius: 2,
        alignItems: 'center'
      }}>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <Select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            displayEmpty
                sx={{
              bgcolor: 'rgba(0,0,0,0.2)',
              borderRadius: 1,
              color: '#fff',
              '.MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(255,255,255,0.1)',
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(255,255,255,0.2)',
              },
              '.MuiSvgIcon-root': {
                color: '#fff',
              }
            }}
          >
            <MenuItem value="All">All Statuses</MenuItem>
            <MenuItem value="Pending">Pending</MenuItem>
            <MenuItem value="Assigned">Assigned</MenuItem>
            <MenuItem value="In Progress">In Progress</MenuItem>
            <MenuItem value="Completed">Completed</MenuItem>
            <MenuItem value="Rejected">Rejected</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <Select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            displayEmpty
            sx={{ 
              bgcolor: 'rgba(0,0,0,0.2)',
              borderRadius: 1,
              color: '#fff',
              '.MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(255,255,255,0.1)',
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(255,255,255,0.2)',
              },
              '.MuiSvgIcon-root': {
                color: '#fff',
              }
            }}
          >
            <MenuItem value="All">All Types</MenuItem>
            <MenuItem value="Maintenance">Maintenance</MenuItem>
            <MenuItem value="Cleaning">Cleaning</MenuItem>
            <MenuItem value="Repair">Repair</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <Select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            displayEmpty
                    sx={{
              bgcolor: 'rgba(0,0,0,0.2)',
              borderRadius: 1,
              color: '#fff',
              '.MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(255,255,255,0.1)',
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(255,255,255,0.2)',
              },
              '.MuiSvgIcon-root': {
                color: '#fff',
              }
            }}
          >
            <MenuItem value="newest">Newest First</MenuItem>
            <MenuItem value="oldest">Oldest First</MenuItem>
            <MenuItem value="priority">Priority</MenuItem>
          </Select>
        </FormControl>
        
        <Box sx={{ 
          flex: 1,
          position: 'relative',
          maxWidth: 400
        }}>
          <input
            type="text"
            placeholder="Search forms by title, description or student..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              paddingLeft: '36px',
              backgroundColor: 'rgba(0,0,0,0.2)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '4px',
              color: '#fff',
              fontSize: '14px',
              outline: 'none',
            }}
          />
          <Box sx={{ 
            position: 'absolute',
            left: '10px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'rgba(255,255,255,0.5)',
            display: 'flex'
          }}>
            <SearchIcon fontSize="small" />
          </Box>
                </Box>
                </Box>

      {/* Recent Forms List */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" sx={{ color: '#fff', mb: 2 }}>
          Forms List
                </Typography>
        {renderFormList()}
      </Box>
    </Box>
  );

  const renderFormList = () => {
    const startIndex = (page - 1) * formsPerPage;
    const endIndex = startIndex + formsPerPage;
    const paginatedForms = filteredForms.slice(startIndex, endIndex);

    return (
      <Box>
        {filteredForms.length === 0 ? (
          <Box 
            sx={{ 
              p: 4, 
              textAlign: 'center', 
              bgcolor: 'rgba(0,0,0,0.2)', 
              borderRadius: 2, 
              border: '1px dashed rgba(255,255,255,0.1)'
            }}
          >
            <WarningIcon sx={{ fontSize: 48, color: 'rgba(255,255,255,0.2)', mb: 2 }} />
            <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.7)' }}>
              No forms match your criteria
                  </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', mt: 1, mb: 3 }}>
              Try adjusting your filters or search terms
            </Typography>
            <Button 
              variant="outlined" 
              color="primary" 
              startIcon={<RefreshIcon />}
              onClick={() => {
                setSelectedStatus('All');
                setFilterType('All');
                setSearchTerm('');
              }}
            >
              Reset Filters
            </Button>
                </Box>
        ) : (
          <TableContainer 
            component={Paper} 
            sx={{ 
              bgcolor: 'rgba(0,0,0,0.2)', 
              borderRadius: 2,
              boxShadow: 'none',
              border: '1px solid rgba(255,255,255,0.05)',
              overflow: 'hidden'
            }}
          >
            <Table>
              <TableHead>
                <TableRow sx={{ 
                  bgcolor: 'rgba(0,0,0,0.3)',
                  '& th': { borderColor: 'rgba(255,255,255,0.05)' }
                }}>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 'bold' }}>Form Details</TableCell>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 'bold' }}>Student</TableCell>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 'bold' }}>Type/Time</TableCell>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 'bold' }}>Status</TableCell>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 'bold' }}>Assignment</TableCell>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 'bold' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedForms.map((form) => {
                  const statusColor = getStatusColor(form.status);
                  
                  return (
                    <TableRow 
                      key={form._id} 
                  sx={{
                        '&:hover': { bgcolor: 'rgba(255,255,255,0.03)' },
                        transition: 'background-color 0.2s',
                        cursor: 'pointer',
                        '& td': { borderColor: 'rgba(255,255,255,0.05)' }
                      }}
                      onClick={() => handleOpenDialog(form)}
                    >
                      {/* Form Details */}
                      <TableCell sx={{ color: '#fff' }}>
                        <Box sx={{ maxWidth: 250 }}>
                          <Typography variant="subtitle2" sx={{ 
                            color: '#fff', 
                            fontWeight: 'medium',
                    display: '-webkit-box',
                            WebkitLineClamp: 1,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {form.title}
                          </Typography>
                          <Typography variant="body2" sx={{ 
                            color: 'rgba(255,255,255,0.5)', 
                    fontSize: '0.8rem',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            mt: 0.5
                          }}>
                  {form.description}
                </Typography>
                          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                            <AccessTimeIcon sx={{ fontSize: 14 }} />
                            {new Date(form.createdAt).toLocaleDateString()} • ID: {form._id.substring(0, 6)}...
                    </Typography>
                  </Box>
                      </TableCell>
                      
                      {/* Student */}
                      <TableCell sx={{ color: '#fff' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar 
                            sx={{ 
                              width: 32, 
                              height: 32,
                              bgcolor: form.student?.name ? stringToColor(form.student.name) : 'grey.700'
                            }}
                          >
                            {form.student?.name ? form.student.name.charAt(0) : '?'}
                  </Avatar>
                  <Box>
                            <Typography variant="body2" sx={{ color: '#fff' }}>
                              {typeof form.student?.name === 'string' ? form.student.name : 'Unknown Student'}
                    </Typography>
                            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <LocationIcon sx={{ fontSize: 12 }} />
                              {typeof form.student?.room?.buildingName === 'string' ? form.student.room.building.name : 'Building'} {typeof form.student?.room?.roomNumber === 'string' || typeof form.student?.room?.roomNumber === 'number' ? form.student.room.roomNumber : 'Room'}
                    </Typography>
                  </Box>
                </Box>
                      </TableCell>
                      
                      {/* Type/Time */}
                      <TableCell sx={{ color: '#fff' }}>
                        <Chip 
                          label={form.formType} 
                  sx={{ 
                            bgcolor: getFormTypeColor(form.formType),
                            color: '#000',
                            fontWeight: 'medium',
                            mb: 1
                          }} 
                        size="small"
                        />
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <AccessTimeIcon sx={{ fontSize: 14, color: 'rgba(255,255,255,0.6)' }} />
                          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                            {form.preferredStartTime 
                              ? new Date(form.preferredStartTime).toLocaleString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })
                              : 'No time specified'}
                          </Typography>
                        </Box>
                      </TableCell>
                      
                      {/* Status */}
                      <TableCell>
                        <Chip 
                          label={form.status} 
                          icon={statusConfig[form.status]?.icon} 
                        sx={{
                            bgcolor: `${statusColor}20`,
                            color: statusColor,
                            border: `1px solid ${statusColor}40`,
                            '& .MuiChip-icon': {
                              color: statusColor
                            }
                          }} 
                        />
                      </TableCell>
                      
                      {/* Assignment */}
                      <TableCell sx={{ color: '#fff' }}>
                        {form.staff ? (
                          <Box>
                            <Typography variant="body2" sx={{ color: '#fff', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <PersonIcon sx={{ fontSize: 16 }} />
                              {form.staff.name}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                              {form.staff.role || 'Staff'}
                            </Typography>
                          </Box>
                        ) : (
                          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', fontStyle: 'italic' }}>
                            No staff assigned
                          </Typography>
                        )}
                      </TableCell>
                      
                      {/* Actions */}
                      <TableCell>
                        <ButtonGroup 
                          variant="outlined" 
                      size="small"
                          onClick={(e) => e.stopPropagation()}
                        sx={{
                            '& .MuiButton-outlined': {
                              borderColor: 'rgba(255,255,255,0.1)',
                              color: 'rgba(255,255,255,0.7)',
                              '&:hover': {
                                borderColor: 'rgba(255,255,255,0.3)',
                                bgcolor: 'rgba(255,255,255,0.05)'
                              }
                            }
                          }}
                        >
                          {form.status === 'Pending' && (
                            <>
                      <Button
                        variant="contained"
                  onClick={() => handleStatusChange(form._id, 'Approved')}
                        disabled={statusLoading}
                        startIcon={<CheckCircleIcon />}
                        sx={{
                          bgcolor: statusConfig['Approved']?.color || '#10B981',
                          mr: 1,
                          '&:hover': {
                            bgcolor: statusConfig['Approved']?.color ? `${statusConfig['Approved'].color}dd` : '#059669',
                          }
                        }}
                      >
                        {statusLoading ? <CircularProgress size={24} color="inherit" /> : 'Approve'}
                      </Button>
                    <Button
                      variant="contained"
                  onClick={() => handleStatusChange(form._id, 'Rejected')}
                        disabled={statusLoading}
                        startIcon={<CancelIcon />}
                      sx={{
                          bgcolor: statusConfig['Rejected']?.color || '#EF4444',
                          '&:hover': {
                            bgcolor: statusConfig['Rejected']?.color ? `${statusConfig['Rejected'].color}dd` : '#DC2626',
                          }
                        }}
                      >
                        {statusLoading ? <CircularProgress size={24} color="inherit" /> : 'Reject'}
                    </Button>
                    </>
                  )}
                </ButtonGroup>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {filteredForms.length > 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Pagination
              count={Math.ceil(filteredForms.length / formsPerPage)}
              page={page}
              onChange={(event, value) => setPage(value)}
              color="primary"
              size="large"
              sx={{
                '& .MuiPaginationItem-root': {
                  color: '#6B7280',
                  borderColor: 'rgba(255,255,255,0.1)',
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.05)',
                  },
                  '&.Mui-selected': {
                    bgcolor: '#10B981',
                    color: '#fff',
                    '&:hover': {
                      bgcolor: '#059669',
                    },
                  },
                },
              }}
            />
          </Box>
        )}
      </Box>
    );
  };

  // Helper function to generate avatar colors
  const stringToColor = (string) => {
    let hash = 0;
    for (let i = 0; i < string.length; i++) {
      hash = string.charCodeAt(i) + ((hash << 5) - hash);
    }
    let color = '#';
    for (let i = 0; i < 3; i++) {
      const value = (hash >> (i * 8)) & 0xff;
      color += `00${value.toString(16)}`.slice(-2);
    }
    return color;
  };

  // Helper function to get form type color
  const getFormTypeColor = (type) => {
    const typeColors = {
      'Maintenance': '#F59E0B',
      'Cleaning': '#3B82F6',
      'Repair': '#EC4899',
    };
    return typeColors[type] || '#64748B';
  };

  const handleOpenAssignmentDialog = (form) => {
    // Filter staff based on form type
    if (form) {
      const staffTypeMapping = {
        'Repair': 'Maintenance',
        'Maintenance': 'Maintenance',
        'Cleaning': 'Cleaner'
      };
      
      const requiredStaffType = staffTypeMapping[form.formType];
      
      // Filter staff members by the required type
      const filtered = staffMembers.filter(staff => 
        staff.typeOfStaff === requiredStaffType && staff.status !== 'On Leave'
      );
      
      setFilteredStaff(filtered);
      setSelectedForm(form);
      setAssignmentDialogOpen(true);
    }
  };

  const handleAttachmentClick = (file) => {
    try {
      // Create the full URL to the file
      const fileUrl = file.fileUrl || `/uploads/${file.filename || file.fileName}`;
      const fullUrl = `${process.env.REACT_APP_API_URL || ''}${fileUrl}`;
      
      // Fetch the file with credentials included
      fetch(fullUrl, {
        credentials: 'include', // This sends cookies (including the httpOnly jwt cookie)
      })
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to download file: ${response.status} ${response.statusText}`);
        }
        return response.blob();
      })
      .then(blob => {
        // Create a temporary URL for the blob
        const url = window.URL.createObjectURL(blob);
        
        // Create a link element and trigger download
        const link = document.createElement('a');
        link.href = url;
        
        // Extract filename
        const fileName = file.originalname || file.fileName || file.filename || 'download';
        link.download = fileName;
        
        // Append to body, click, and clean up
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Release the URL object
        window.URL.revokeObjectURL(url);
        
        toast.success('File download started');
      })
      .catch(error => {
        console.error('Error downloading file:', error);
        toast.error('Failed to download file. Please try again.');
      });
    } catch (error) {
      console.error('Error in handleAttachmentClick:', error);
      toast.error('An error occurred while attempting to download the file');
    }
  };

    return (
        <Box sx={{ 
          display: 'flex', 
      minHeight: '100vh',
      background: 'linear-gradient(145deg, #0A0A0A 0%, #141414 100%)',
      color: '#fff',
                  position: 'relative',
      '&::before': {
        content: '""',
                      position: 'absolute',
        top: 0,
                      left: 0,
                      right: 0,
        bottom: 0,
        background: 'radial-gradient(circle at top right, rgba(255,255,255,0.03) 0%, transparent 70%)',
        pointerEvents: 'none',
      },
    }}>
      <AdminSidebar />

      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          p: 4,
          position: 'relative',
          zIndex: 1,
        }}
      >
          <Box sx={{ 
            display: 'flex', 
          justifyContent: 'space-between', 
            alignItems: 'center', 
          mb: 4,
          pb: 3,
          borderBottom: '1px solid rgba(255,255,255,0.03)',
        }}>
          <Box>
            <Typography variant="h4" sx={{ 
              fontWeight: 600,
                color: '#fff',
              textShadow: '0 2px 4px rgba(0,0,0,0.2)',
            }}>
              Form Management
            </Typography>
            <Typography variant="body2" sx={{ color: '#6B7280', mt: 1 }}>
              Monitor and manage all maintenance requests
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <NotificationBell userType="admin" color="#3B82F6" />
          </Stack>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress sx={{ color: '#3B82F6' }} />
          </Box>
        ) : error ? (
          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <WarningIcon sx={{ color: '#EF4444', fontSize: 48, mb: 2 }} />
            <Typography color="error" variant="h6">{error}</Typography>
            <Button 
              variant="contained" 
              sx={{ mt: 2 }}
              onClick={() => window.location.reload()}
            >
              Try Again
            </Button>
          </Box>
        ) : (
          <>
            {renderDashboard()}
          </>
        )}

        <Dialog
          open={openDialog}
          onClose={handleCloseDialog}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              background: 'linear-gradient(145deg, #141414 0%, #0A0A0A 100%)',
                color: '#fff',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.03)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
            }
          }}
        >
          {selectedForm && (
            <>
              <DialogTitle sx={{ 
                p: 3,
                position: 'relative',
                height: 'auto',
                borderBottom: '1px solid rgba(255,255,255,0.03)',
                background: 'linear-gradient(90deg, rgba(59, 130, 246, 0.1) 0%, transparent 100%)',
              }}>
                <Box sx={{ 
                display: 'flex',
                justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <Typography variant="h6" sx={{ 
                    color: '#fff', 
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}>
                    <AssignmentIcon sx={{ color: '#3B82F6' }} />
                    Form Details
            </Typography>
                  
                  <Chip 
                    label={selectedForm.status} 
                    icon={statusConfig[selectedForm.status]?.icon} 
              sx={{ 
                      bgcolor: `${statusConfig[selectedForm.status]?.color}`,
                color: '#fff',
                      borderRadius: '16px',
                      fontWeight: '500',
                      '& .MuiChip-icon': {
                        color: '#fff'
                      }
                    }}
                  />
          </Box>

                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" sx={{ 
                    color: 'rgba(255,255,255,0.6)', 
                    fontWeight: 500,
                    mb: 0.5,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5
                  }}>
                    Form Title:
                  </Typography>
                  <Typography variant="h5" sx={{ 
                    color: '#fff', 
                    fontWeight: 'bold',
                    mb: 1
                  }}>
                    {selectedForm?.title?.substring(0, 40) || 'No Title'}
                    {selectedForm?.title?.length > 40 ? '...' : ''}
                  </Typography>
                  
                  <Typography variant="body2" sx={{ 
                    color: 'rgba(255,255,255,0.6)', 
                    fontWeight: 500,
                    mb: 0.5,
                    mt: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5
                  }}>
                    Form ID:
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#fff', fontWeight: 'medium' }}>
                    {selectedForm?._id || 'Unknown ID'}
                  </Typography>
        </Box>
              </DialogTitle>
              
              <DialogContent sx={{ 
                p: 3,
          overflowY: 'auto',
          '&::-webkit-scrollbar': {
                  width: '8px',
          },
          '&::-webkit-scrollbar-track': {
                  background: 'rgba(0, 0, 0, 0.2)',
                  borderRadius: '4px',
                  margin: '8px 0',
          },
          '&::-webkit-scrollbar-thumb': {
                  background: 'rgba(59, 130, 246, 0.6)',
                  borderRadius: '4px',
            '&:hover': {
                    background: 'rgba(59, 130, 246, 0.8)',
                  },
          },
          scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(59, 130, 246, 0.6) rgba(0, 0, 0, 0.2)',
              }}>
                <Box sx={{ pb: 3, mb: 3, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <Typography variant="subtitle2" sx={{ 
                    color: '#3B82F6', 
                    mb: 1, 
                    fontWeight: 600, 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.5px',
                    borderBottom: '1px solid rgba(59, 130, 246, 0.2)',
                    pb: 1,
                  }}>
                    Description
                    </Typography>
                  <Typography variant="body1" sx={{ 
                    color: 'rgba(255,255,255,0.85)',
                    p: 2,
                    bgcolor: 'rgba(15, 23, 42, 0.3)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.03)'
                  }}>
                    {selectedForm.description || 'No description provided.'}
            </Typography>
          </Box>

                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' } }}>
                  {/* Left side - Student & Time Info */}
                  <Box sx={{ 
                    flex: 1, 
                    pr: { xs: 0, md: 3 }, 
                    mr: { xs: 0, md: 3 },
                    pb: { xs: 3, md: 0 },
                    mb: { xs: 3, md: 0 },
                    borderRight: { xs: 'none', md: '1px solid rgba(255,255,255,0.1)' },
                    borderBottom: { xs: '1px solid rgba(255,255,255,0.1)', md: 'none' }
                  }}>
                    {/* Student Info Card */}
                    <Box sx={{ mb: 4 }}>
                      <Typography variant="subtitle2" sx={{ 
                        color: '#3B82F6', 
                        mb: 2, 
                        fontWeight: 600, 
                        textTransform: 'uppercase', 
                        letterSpacing: '0.5px',
                        borderBottom: '1px solid rgba(59, 130, 246, 0.2)',
                        pb: 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                      }}>
                        <PersonIcon sx={{ fontSize: '1.1rem', opacity: 0.8 }} /> 
                        Student Information
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Avatar 
                sx={{ 
                            width: 40, 
                            height: 40, 
                            bgcolor: selectedForm.student?.name ? stringToColor(selectedForm.student.name) : '#424242',
                            mr: 2 
                          }}
                        >
                          {typeof selectedForm.student?.name === 'string' ? selectedForm.student.name.charAt(0) : '?'}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle1" sx={{ color: '#fff', fontWeight: 500 }}>
                            {typeof selectedForm.student?.name === 'string' ? selectedForm.student.name : 
                            typeof selectedForm.studentInfo?.name === 'string' ? selectedForm.studentInfo.name : 
                            'Unknown Student'}
                </Typography>
                          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <LocationIcon sx={{ fontSize: 12 }} />
                            {typeof selectedForm.student?.room?.buildingName === 'string' ? 
                              `${selectedForm.student.room.building.name}, Room ${selectedForm.student.room.roomNumber}` : 
                              typeof selectedForm.location?.buildingName === 'string' ? 
                              `${selectedForm.location.buildingName}, Room ${selectedForm.location.roomNumber}` : 
                              'Location not specified'}
                </Typography>
              </Box>
                      </Box>

                      <Grid container spacing={2} mt={1}>
                        {selectedForm.student?.email && (
                          <Grid item xs={12}>
                            <Typography variant="body2" sx={{ color: '#9CA3AF' }}>Email</Typography>
                            <Typography variant="body1" sx={{ color: '#fff' }}>{selectedForm.student.email}</Typography>
                          </Grid>
                        )}
                        {selectedForm.student?.contactInfo && (
                          <Grid item xs={12}>
                            <Typography variant="body2" sx={{ color: '#9CA3AF' }}>Contact</Typography>
                            <Typography variant="body1" sx={{ color: '#fff' }}>{selectedForm.student.contactInfo}</Typography>
                          </Grid>
                        )}
                      </Grid>
          </Box>

                    {/* Attachments Section */}
                    <Box>
                      <Typography variant="subtitle1" sx={{ 
                        color: '#3B82F6', 
                        mb: 2,
                        borderBottom: '1px solid rgba(59, 130, 246, 0.2)',
                        pb: 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                      }}>
                        <AttachFileIcon sx={{ fontSize: '1.1rem', opacity: 0.8 }} />
                        Attachments
                      </Typography>
                      
                      {selectedForm?.attachments && selectedForm.attachments.length > 0 ? (
                        <Box sx={{ mb: 2 }}>
                          <Paper sx={{ 
                            bgcolor: 'rgba(15, 23, 42, 0.3)',
                            borderRadius: '12px',
                            border: '1px solid rgba(255, 255, 255, 0.03)',
                            overflow: 'hidden'
                          }}>
                            {selectedForm.attachments.map((file, index) => (
                              <Box 
                                key={index}
                sx={{ 
                                  ...(index !== 0 && {
                                    borderTop: '1px solid rgba(255,255,255,0.05)'
                                  })
                                }}
                              >
                                <Box sx={{ 
                                  p: 2, 
                                  display: 'flex', 
                                  alignItems: 'center',
                                  gap: 2
                                }}>
                                  <Avatar sx={{ 
                                    bgcolor: 'rgba(59, 130, 246, 0.1)', 
                                    color: '#3B82F6',
                                    width: 40,
                                    height: 40
                                  }}>
                                    <InsertDriveFileIcon />
                                  </Avatar>
                                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                                    <Typography 
                                      variant="body2" 
                                        sx={{
                                        color: '#fff', 
                                        fontWeight: 'medium',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap'
                                      }}
                                    >
                                      {file.originalname || file.fileName || file.filename || 'Attachment'}
                            </Typography>
                                          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                                            {new Date(file.uploadDate || Date.now()).toLocaleDateString()}
                            </Typography>
                                  </Box>
                                  <Button
                                    onClick={() => handleAttachmentClick(file)}
                                    variant="contained"
                                    size="small"
                                    startIcon={<DownloadIcon />}
                          sx={{ 
                                      bgcolor: 'rgba(59, 130, 246, 0.1)',
                                      color: '#fff',
                                      '&:hover': {
                                        bgcolor: 'rgba(59, 130, 246, 0.2)',
                                      },
                                      borderRadius: '8px',
                                    }}
                                  >
                                    Download
                                  </Button>
                      </Box>
              </Box>
                            ))}
                          </Paper>
        </Box>
                      ) : (
                        <Box sx={{ 
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2,
                          p: 2,
                          borderRadius: '12px',
                          bgcolor: 'rgba(15, 23, 42, 0.3)',
                          border: '1px solid rgba(255, 255, 255, 0.03)'
                        }}>
                          <BlockIcon sx={{ color: 'rgba(255,255,255,0.3)' }} />
                          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                            No attachments provided
                          </Typography>
      </Box>
                      )}
                    </Box>
                  </Box>

                  {/* Right side - Schedule & Review */}
    <Box sx={{ 
                    flex: 1, 
                    pl: { xs: 0, md: 3 }, 
                    ml: { xs: 0, md: 3 },
                    pb: { xs: 3, md: 0 },
                    mb: { xs: 3, md: 0 },
                    borderLeft: { xs: 'none', md: '1px solid rgba(255,255,255,0.1)' },
                    borderBottom: { xs: '1px solid rgba(255,255,255,0.1)', md: 'none' }
                  }}>
                    {/* Schedule Info */}
                    <Box>
                      <Typography variant="subtitle2" sx={{ 
                        color: '#3B82F6', 
                        mb: 2, 
                        fontWeight: 600, 
                        textTransform: 'uppercase', 
                        letterSpacing: '0.5px',
                        borderBottom: '1px solid rgba(59, 130, 246, 0.2)',
                        pb: 1,
      display: 'flex', 
                        alignItems: 'center',
                        gap: 1,
                      }}>
                        <AccessTimeIcon sx={{ fontSize: '1.1rem', opacity: 0.8 }} />
                        Schedule
                      </Typography>
                      
                      <List disablePadding>
                        <ListItem sx={{ px: 0, py: 1, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <ListItemAvatar sx={{ minWidth: 40 }}>
                            <AccessTimeIcon sx={{ color: 'rgba(255,255,255,0.5)' }} />
                          </ListItemAvatar>
                          <ListItemText 
                            primary="Start Time" 
                            secondary={selectedForm.preferredStartTime ? format(new Date(selectedForm.preferredStartTime), 'MMM d, yyyy - h:mm a') : 
                                       selectedForm.preferredTiming?.startTime ? format(new Date(selectedForm.preferredTiming.startTime), 'MMM d, yyyy - h:mm a') : 
                                       'Not specified'}
                            primaryTypographyProps={{ variant: 'body2', color: 'rgba(255,255,255,0.6)', sx: { mb: 0.5 } }}
                            secondaryTypographyProps={{ variant: 'body1', color: '#fff' }}
                          />
                        </ListItem>
                        
                        <ListItem sx={{ px: 0, py: 1, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <ListItemAvatar sx={{ minWidth: 40 }}>
                            <AccessTimeIcon sx={{ color: 'rgba(255,255,255,0.5)' }} />
                          </ListItemAvatar>
                          <ListItemText 
                            primary="End Time" 
                            secondary={selectedForm.endTime ? format(new Date(selectedForm.endTime), 'MMM d, yyyy - h:mm a') : 
                                       selectedForm.preferredTiming?.endTime ? format(new Date(selectedForm.preferredTiming.endTime), 'MMM d, yyyy - h:mm a') : 
                                       'Not specified'}
                            primaryTypographyProps={{ variant: 'body2', color: 'rgba(255,255,255,0.6)', sx: { mb: 0.5 } }}
                            secondaryTypographyProps={{ variant: 'body1', color: '#fff' }}
                          />
                        </ListItem>
                        
                        <ListItem sx={{ px: 0, py: 1 }}>
                          <ListItemAvatar sx={{ minWidth: 40 }}>
                            <ScheduleIcon sx={{ color: 'rgba(255,255,255,0.5)' }} />
                          </ListItemAvatar>
                          <ListItemText 
                            primary="Duration" 
                            secondary={(() => {
                              // Calculate duration from start and end time
                              const startTime = selectedForm.preferredStartTime 
                                ? new Date(selectedForm.preferredStartTime) 
                                : selectedForm.preferredTiming?.startTime 
                                  ? new Date(selectedForm.preferredTiming.startTime) 
                                  : null;
                              
                              const endTime = selectedForm.endTime 
                                ? new Date(selectedForm.endTime) 
                                : selectedForm.preferredTiming?.endTime 
                                  ? new Date(selectedForm.preferredTiming.endTime) 
                                  : null;
                              
                              if (startTime && endTime) {
                                const durationMs = endTime - startTime;
                                const durationMinutes = Math.round(durationMs / (1000 * 60));
                                
                                if (durationMinutes < 60) {
                                  return `${durationMinutes} minutes`;
                                } else {
                                  const hours = Math.floor(durationMinutes / 60);
                                  const minutes = durationMinutes % 60;
                                  return `${hours} hour${hours > 1 ? 's' : ''}${minutes > 0 ? ` ${minutes} minute${minutes > 1 ? 's' : ''}` : ''}`;
                                }
                              } else if (selectedForm.duration) {
                                return `${selectedForm.duration} minutes`;
                              } else {
                                return 'Not specified';
                              }
                            })()}
                            primaryTypographyProps={{ variant: 'body2', color: 'rgba(255,255,255,0.6)', sx: { mb: 0.5 } }}
                            secondaryTypographyProps={{ variant: 'body1', color: '#fff' }}
                          />
                        </ListItem>
                      </List>
                    </Box>
                    
                    {/* Status History Section */}
                    {selectedForm.statusHistory && selectedForm.statusHistory.length > 0 && (
                      <Box>
                        <Typography variant="subtitle1" sx={{ 
                          color: '#3B82F6', 
                          mb: 2,
                          borderBottom: '1px solid rgba(59, 130, 246, 0.2)',
                          pb: 1,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                        }}>
                          <HistoryIcon sx={{ fontSize: '1.1rem', opacity: 0.8 }} />
                          Status History
                        </Typography>
                        <Paper sx={{ 
                          p: 2.5,
                          background: 'rgba(15, 23, 42, 0.3)',
                          borderRadius: '12px',
                          border: '1px solid rgba(255, 255, 255, 0.03)',
                          maxHeight: '200px',
                          overflow: 'auto',
                          '&::-webkit-scrollbar': {
                            width: '4px',
                          },
                          '&::-webkit-scrollbar-track': {
                            background: 'rgba(0, 0, 0, 0.1)',
                          },
                          '&::-webkit-scrollbar-thumb': {
                            background: 'rgba(59, 130, 246, 0.5)',
                            borderRadius: '4px',
                          },
                        }}>
                          {selectedForm.statusHistory.map((history, index) => (
                            <Box 
                              key={index} 
        sx={{ 
                                mb: 2,
                                pb: 2,
                                borderBottom: index !== selectedForm.statusHistory.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
          display: 'flex',
                                gap: 2,
        }}
      >
        <Box sx={{ 
                                minWidth: '24px',
          display: 'flex', 
                                flexDirection: 'column',
                                alignItems: 'center',
                              }}>
                                <Box sx={{ 
                                  width: '10px',
                                  height: '10px',
                                  borderRadius: '50%',
                                  bgcolor: statusConfig[history.status]?.color || '#9CA3AF',
                                }} />
                                {index !== selectedForm.statusHistory.length - 1 && (
                                  <Box sx={{ 
                                    width: '2px',
                                    height: '100%',
                                    bgcolor: 'rgba(255,255,255,0.1)',
                                    mt: 0.5,
                                  }} />
                                )}
                              </Box>
          <Box>
                                <Typography variant="body2" sx={{ fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>
                                  {history.status}
            </Typography>
                                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', display: 'block', mb: 0.5 }}>
                                  {history.changedAt ? format(new Date(history.changedAt), 'MMM d, yyyy - h:mm a') : 'Date unknown'}
            </Typography>
                                {history.notes && (
                                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                                    {history.notes}
                                  </Typography>
                                )}
          </Box>
                            </Box>
                          ))}
                        </Paper>
                      </Box>
                    )}
                    
                    {/* Student Review Section (if completed) */}
                    {selectedForm.status === 'Completed' && selectedForm.studentReview && (
                      <Box sx={{ 
                        mt: 3, 
                        p: 2.5,
                        bgcolor: 'rgba(15, 23, 42, 0.3)',
                        borderRadius: '12px',
                        border: '1px solid rgba(59, 130, 246, 0.2)'
                      }}>
                        <Typography variant="subtitle1" sx={{ 
                          color: '#3B82F6', 
                          mb: 2,
                          borderBottom: '1px solid rgba(59, 130, 246, 0.2)',
                          pb: 1,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                        }}>
                          <StarIcon sx={{ fontSize: '1.1rem', opacity: 0.8, color: '#F59E0B' }} />
                          Student Review
                        </Typography>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Typography variant="body2" sx={{ color: '#9CA3AF', mr: 1 }}>
                            Rating:
                          </Typography>
                          <Box sx={{ display: 'flex' }}>
                            {[1, 2, 3, 4, 5].map((star) => (
                              <StarIcon 
                                key={star} 
              sx={{
                                  color: star <= selectedForm.studentReview.rating ? '#F59E0B' : 'rgba(255,255,255,0.2)',
                                  fontSize: '1rem'
                                }} 
                              />
                            ))}
                          </Box>
        </Box>

                        {selectedForm.studentReview.comment && (
                          <>
                            <Typography variant="body2" sx={{ color: '#9CA3AF', mb: 0.5 }}>
                              Comment:
                            </Typography>
                            <Typography variant="body1" sx={{ color: '#fff', fontStyle: 'italic' }}>
                              "{selectedForm.studentReview.comment}"
                            </Typography>
                          </>
                        )}
                        
                        <Typography variant="caption" sx={{ color: '#9CA3AF', display: 'block', mt: 1 }}>
                          Reviewed on {format(new Date(selectedForm.studentReview.reviewDate), 'MMM d, yyyy')}
                        </Typography>
          </Box>
                    )}
                  </Box>
                </Box>
              </DialogContent>
              
              <DialogActions sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,0.03)', justifyContent: 'space-between' }}>
                <Button 
                  onClick={handleCloseDialog}
                  sx={{ 
                    color: '#9CA3AF',
                    '&:hover': {
                      background: 'rgba(255,255,255,0.05)',
                    },
                  }}
                >
                  Close
                </Button>
                
                <Box>
                  {selectedForm.status === 'Pending' && (
                    <>
                      <Button
                        variant="contained"
                        onClick={() => handleStatusChange(selectedForm._id, 'Approved')}
                        disabled={statusLoading}
                        startIcon={<CheckCircleIcon />}
                        sx={{
                          bgcolor: 'rgba(16, 185, 129, 0.1)',
                          color: '#10B981',
                          borderColor: 'rgba(16, 185, 129, 0.5)',
                          mr: 1,
                          '&:hover': {
                            bgcolor: 'rgba(16, 185, 129, 0.2)',
                          }
                        }}
                      >
                        {statusLoading ? <CircularProgress size={24} color="inherit" /> : 'Approve'}
                      </Button>
                      <Button
                        variant="contained"
                        onClick={() => handleStatusChange(selectedForm._id, 'Rejected')}
                        disabled={statusLoading}
                        startIcon={<CancelIcon />}
                        sx={{
                          bgcolor: 'rgba(239, 68, 68, 0.1)',
                          color: '#EF4444',
                          borderColor: 'rgba(239, 68, 68, 0.5)',
                          '&:hover': {
                            bgcolor: 'rgba(239, 68, 68, 0.2)',
                          }
                        }}
                      >
                        {statusLoading ? <CircularProgress size={24} color="inherit" /> : 'Reject'}
                      </Button>
                    </>
                  )}
                  
                  {selectedForm.status === 'Approved' && !selectedForm.staff && (
                    <Button
                      variant="contained"
                      onClick={() => handleOpenAssignmentDialog(selectedForm)}
                      disabled={statusLoading}
                      startIcon={<PersonIcon />}
                      sx={{
                        bgcolor: 'rgba(139, 92, 246, 0.1)',
                        color: '#8B5CF6',
                        borderColor: 'rgba(139, 92, 246, 0.5)',
                        '&:hover': {
                          bgcolor: 'rgba(139, 92, 246, 0.2)',
                        }
                      }}
                    >
                      {statusLoading ? <CircularProgress size={24} color="inherit" /> : 'Assign Staff'}
                    </Button>
                  )}
                </Box>
              </DialogActions>
            </>
          )}
        </Dialog>

        {/* Staff Assignment Dialog */}
        <Dialog
          open={assignmentDialogOpen}
          onClose={() => setAssignmentDialogOpen(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              background: 'linear-gradient(145deg, #141414 0%, #0A0A0A 100%)',
              color: '#fff',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.03)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
            }
          }}
        >
              <DialogTitle sx={{ 
            p: 3,
            position: 'relative',
            height: 'auto',
                borderBottom: '1px solid rgba(255,255,255,0.03)',
            background: 'linear-gradient(90deg, rgba(139, 92, 246, 0.1) 0%, transparent 100%)',
          }}>
            <Box sx={{ 
                display: 'flex',
                justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <Typography variant="h6" sx={{ 
                color: '#fff', 
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}>
                <PersonIcon sx={{ color: '#8B5CF6' }} />
                Assign Staff
              </Typography>
              
              <Chip 
                label={selectedForm?.formType || 'Form'} 
                size="small"
                    sx={{
                  bgcolor: getFormTypeColor(selectedForm?.formType),
                  color: '#000',
                }} 
              />
                        </Box>
            
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" sx={{ 
                color: 'rgba(255,255,255,0.6)', 
                fontWeight: 500,
                mb: 0.5,
                display: 'flex',
                alignItems: 'center',
                gap: 0.5
              }}>
                Form Title:
                    </Typography>
              <Typography variant="h5" sx={{ 
                color: '#fff', 
                fontWeight: 'bold',
                mb: 1
              }}>
                {selectedForm?.title?.substring(0, 40) || 'No Title'}
                {selectedForm?.title?.length > 40 ? '...' : ''}
                    </Typography>
              
              <Typography variant="body2" sx={{ 
                color: 'rgba(255,255,255,0.6)', 
                fontWeight: 500,
                mb: 0.5,
                mt: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 0.5
              }}>
                Form ID:
                      </Typography>
              <Typography variant="body2" sx={{ color: '#fff', fontWeight: 'medium' }}>
                {selectedForm?._id || 'Unknown ID'}
                      </Typography>
                    </Box>
          </DialogTitle>

          <DialogContent sx={{ 
            p: 3,
            overflowY: 'auto',
            '&::-webkit-scrollbar': {
              width: '8px',
            },
            '&::-webkit-scrollbar-track': {
              background: 'rgba(0, 0, 0, 0.2)',
              borderRadius: '4px',
              margin: '8px 0',
            },
            '&::-webkit-scrollbar-thumb': {
              background: 'rgba(139, 92, 246, 0.6)',
              borderRadius: '4px',
              '&:hover': {
                background: 'rgba(139, 92, 246, 0.8)',
              },
            },
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(139, 92, 246, 0.6) rgba(0, 0, 0, 0.2)',
          }}>
            {filteredStaff.length === 0 ? (
              <Box sx={{ 
                py: 5, 
                textAlign: 'center',
                bgcolor: 'rgba(15, 23, 42, 0.3)',
                borderRadius: '12px',
                border: '1px dashed rgba(255,255,255,0.1)',
                px: 3
              }}>
                <WarningIcon sx={{ fontSize: 48, color: '#EF4444', mb: 2, opacity: 0.8 }} />
                <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.8)', mb: 1 }}>
                  No Staff Available
                      </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                  There are no available staff members matching the required skills for this type of request.
                      </Typography>
                    </Box>
            ) : (
              <>
                <Typography variant="subtitle2" sx={{ 
                  color: '#8B5CF6', 
                  mb: 2, 
                  fontWeight: 600, 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.5px',
                  borderBottom: '1px solid rgba(139, 92, 246, 0.2)',
                  pb: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}>
                  <PersonIcon sx={{ fontSize: '1.1rem', opacity: 0.8 }} />
                  Available Staff Members
                        </Typography>
                
                <Box sx={{ maxHeight: '50vh', overflow: 'auto', 
                  '&::-webkit-scrollbar': {
                    width: '6px',
                  },
                  '&::-webkit-scrollbar-track': {
                    background: 'rgba(0, 0, 0, 0.1)',
                    borderRadius: '4px',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    background: 'rgba(139, 92, 246, 0.5)',
                    borderRadius: '4px',
                  },
                }}>
                  <List disablePadding>
                    {filteredStaff.map((staff) => (
                      <Paper
                        key={staff._id}
                                sx={{
                          mb: 2,
                          bgcolor: 'rgba(15, 23, 42, 0.3)',
                          border: '1px solid rgba(255,255,255,0.05)',
                          borderRadius: '12px',
                          overflow: 'hidden',
                          transition: 'all 0.2s ease',
                                  '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: '0 6px 16px rgba(0,0,0,0.3)',
                            borderColor: 'rgba(139, 92, 246, 0.3)',
                          },
                          cursor: 'pointer'
                        }}
                        onClick={() => assignStaffToForm(selectedForm._id, staff._id)}
                      >
                        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar 
                            sx={{ 
                              bgcolor: staff.status === 'Available' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                              color: staff.status === 'Available' ? '#10B981' : '#F59E0B',
                              width: 50,
                              height: 50
                            }}
                          >
                            <PersonIcon sx={{ fontSize: 28 }} />
                          </Avatar>
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5, color: '#fff' }}>
                              {staff.name}
                              </Typography>
                            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                              {staff.typeOfStaff || 'Staff Member'} • {staff.status || 'Available'}
                            </Typography>
                          </Box>
                          <Box sx={{ textAlign: 'right' }}>
                            <Chip 
                              label={`${staff.assignedTasks?.length || 0} tasks`}
                              size="small"
                              sx={{ 
                                bgcolor: (() => {
                                  const count = staff.assignedTasks?.length || 0;
                                  if (count < 3) return 'rgba(16, 185, 129, 0.2)';
                                  if (count < 6) return 'rgba(245, 158, 11, 0.2)';
                                  return 'rgba(239, 68, 68, 0.2)';
                                })(),
                                color: (() => {
                                  const count = staff.assignedTasks?.length || 0;
                                  if (count < 3) return '#10B981';
                                  if (count < 6) return '#F59E0B';
                                  return '#EF4444';
                                })(),
                                borderRadius: '12px',
                                mb: 1
                              }}
                            />
                            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', display: 'block' }}>
                              Click to assign
                            </Typography>
                        </Box>
                      </Box>
                      </Paper>
                    ))}
                  </List>
                </Box>
              </>
            )}
              </DialogContent>

          <DialogActions sx={{ 
            p: 3, 
            borderTop: '1px solid rgba(255,255,255,0.05)', 
            justifyContent: 'flex-end',
            bgcolor: 'rgba(0,0,0,0.1)'
          }}>
                <Button 
              onClick={() => setAssignmentDialogOpen(false)}
              variant="outlined"
              startIcon={<CancelIcon />}
                  sx={{ 
                borderColor: 'rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.7)',
                '&:hover': {
                  borderColor: 'rgba(255,255,255,0.3)',
                  bgcolor: 'rgba(255,255,255,0.05)'
                }
              }}
            >
              Cancel
                </Button>
              </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
};

export default AdminForm; 
import React, { useState, useEffect } from 'react';
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
  TextField,
  InputLabel,
  FormHelperText,
  InputAdornment,
  Rating,
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
  CalendarMonth as CalendarMonthIcon,
  ListAlt as ListAltIcon,
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Warning as WarningIcon,
  Block as BlockIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  FolderOpen as FolderOpenIcon,
  Download as DownloadIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  ViewDay as ViewDayIcon,
  ViewWeek as ViewWeekIcon,
  CalendarViewMonth as ViewMonthIcon,
  ArrowDropDown as ArrowDropDownIcon,
  CloudUpload as CloudUploadIcon,
  InsertDriveFile as InsertDriveFileIcon,
  Image as ImageIcon,
  PictureAsPdf as PictureAsPdfIcon,
  Send as SendIcon,
  ArrowBack as ArrowBackIcon,
  Info as InfoIcon,
  AttachFile as AttachFileIcon,
  Build as BuildIcon,
  CleaningServices as CleaningServicesIcon,
  Handyman as HandymanIcon,
  Title as TitleIcon,
  Star as StarIcon,
} from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import StudentSidebar from '../components/StudentSidebar';
import NotificationBell from '../components/NotificationBell';
import axios from 'axios';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, startOfMonth, endOfMonth, isSameDay, isToday, addMonths, subMonths, getMonth, getYear, addDays } from 'date-fns';
import { toast } from 'react-toastify';
import { useSocket } from '../context/SocketContext';

// Status configurations
const statusConfig = {
  Pending: { color: '#3B82F6', icon: <AssignmentIcon />, bgGradient: 'linear-gradient(145deg, #1E40AF 0%, #3B82F6 100%)' },
  Approved: { color: '#10B981', icon: <CheckCircleIcon />, bgGradient: 'linear-gradient(145deg, #047857 0%, #10B981 100%)' },
  Rejected: { color: '#EF4444', icon: <CancelIcon />, bgGradient: 'linear-gradient(145deg, #B91C1C 0%, #EF4444 100%)' },
  Assigned: { color: '#8B5CF6', icon: <PersonIcon />, bgGradient: 'linear-gradient(145deg, #6D28D9 0%, #8B5CF6 100%)' },
  'In Progress': { color: '#EC4899', icon: <PlayArrowIcon />, bgGradient: 'linear-gradient(145deg, #BE185D 0%, #EC4899 100%)' },
  'In Review': { color: '#F59E0B', icon: <ScheduleIcon />, bgGradient: 'linear-gradient(145deg, #B45309 0%, #F59E0B 100%)' },
  Completed: { color: '#14B8A6', icon: <DoneIcon />, bgGradient: 'linear-gradient(145deg, #0F766E 0%, #14B8A6 100%)' },
};

// Add this after the statusConfig object
const mockForms = [
  {
    _id: '1',
    title: 'Room Cleaning Request',
    description: 'Requesting deep cleaning of room 101, including carpet cleaning and window washing.',
    formType: 'Cleaning',
    status: 'Pending',
    preferredStartTime: new Date('2024-03-25T09:00:00'),
    createdAt: new Date('2024-03-20T10:00:00'),
    attachments: [],
  },
  {
    _id: '2',
    title: 'AC Repair Needed',
    description: 'Air conditioning unit in room 203 is not cooling properly. Temperature remains at 28°C despite setting it to 22°C.',
    formType: 'Repair',
    status: 'Assigned',
    preferredStartTime: new Date('2024-03-22T14:00:00'),
    createdAt: new Date('2024-03-21T15:30:00'),
    staff: {
      name: 'John Smith',
      role: 'HVAC Technician'
    },
    attachments: [],
  },
  {
    _id: '3',
    title: 'Bathroom Maintenance',
    description: 'Leaking faucet in shared bathroom on 2nd floor. Water pressure is also low.',
    formType: 'Maintenance',
    status: 'In Progress',
    preferredStartTime: new Date('2024-03-23T10:00:00'),
    createdAt: new Date('2024-03-22T09:15:00'),
    staff: {
      name: 'Mike Brown',
      role: 'Plumbing Specialist'
    },
    attachments: [],
  },
  {
    _id: '4',
    title: 'Window Repair',
    description: 'Broken window pane in room 305. Need urgent repair due to safety concerns.',
    formType: 'Repair',
    status: 'Completed',
    preferredStartTime: new Date('2024-03-19T11:00:00'),
    createdAt: new Date('2024-03-18T16:45:00'),
    staff: {
      name: 'Sarah Johnson',
      role: 'General Maintenance'
    },
    attachments: [],
  },
  {
    _id: '5',
    title: 'Room Deep Cleaning',
    description: 'Requesting deep cleaning of room 402 after recent renovation work.',
    formType: 'Cleaning',
    status: 'In Review',
    preferredStartTime: new Date('2024-03-24T13:00:00'),
    createdAt: new Date('2024-03-23T14:20:00'),
    staff: {
      name: 'Lisa Davis',
      role: 'Cleaning Staff'
    },
    attachments: [],
  },
  {
    _id: '6',
    title: 'Electrical Issue',
    description: 'Power outlet in room 107 is not working. Suspected wiring issue.',
    formType: 'Repair',
    status: 'Rejected',
    preferredStartTime: new Date('2024-03-21T15:00:00'),
    createdAt: new Date('2024-03-20T16:30:00'),
    rejectionReason: 'Please contact emergency maintenance for electrical issues.',
    attachments: [],
  }
];

// Add this after the mockForms array
const calendarMockForms = [
  {
    _id: 'c1',
    title: 'Room Cleaning',
    description: 'Weekly room cleaning service',
    formType: 'Cleaning',
    status: 'Approved',
    preferredStartTime: new Date(new Date().setHours(9, 0, 0, 0)), // Today at 9 AM
    duration: 1, // 1 hour
    createdAt: new Date('2024-03-18T08:30:00'),
    staff: {
      name: 'Lisa Davis',
      role: 'Cleaning Staff'
    },
    attachments: [],
  },
  {
    _id: 'c2',
    title: 'AC Repair',
    description: 'Fix air conditioning unit',
    formType: 'Repair',
    status: 'In Progress',
    preferredStartTime: new Date(new Date().setHours(13, 30, 0, 0)), // Today at 1:30 PM
    duration: 2, // 2 hours
    createdAt: new Date('2024-03-20T10:15:00'),
    staff: {
      name: 'John Smith',
      role: 'HVAC Technician'
    },
    attachments: [],
  },
  {
    _id: 'c3',
    title: 'Leaky Faucet',
    description: 'Fix bathroom sink faucet',
    formType: 'Maintenance',
    status: 'Assigned',
    // Tomorrow at 11 AM
    preferredStartTime: new Date(new Date().setDate(new Date().getDate() + 1)).setHours(11, 0, 0, 0),
    duration: 1, // 1 hour
    createdAt: new Date('2024-03-21T09:00:00'),
    staff: {
      name: 'Mike Brown',
      role: 'Plumbing Specialist'
    },
    attachments: [],
  },
  {
    _id: 'c4',
    title: 'Window Replacement',
    description: 'Replace broken window in bedroom',
    formType: 'Repair',
    status: 'Pending',
    // Day after tomorrow at 2 PM
    preferredStartTime: new Date(new Date().setDate(new Date().getDate() + 2)).setHours(14, 0, 0, 0),
    duration: 2, // 2 hours
    createdAt: new Date('2024-03-22T16:45:00'),
    attachments: [],
  },
  {
    _id: 'c5',
    title: 'Internet Setup',
    description: 'Setup Wi-Fi router and connection',
    formType: 'Maintenance',
    status: 'Completed',
    // Yesterday at 4 PM
    preferredStartTime: new Date(new Date().setDate(new Date().getDate() - 1)).setHours(16, 0, 0, 0),
    duration: 1.5, // 1.5 hours
    createdAt: new Date('2024-03-19T12:30:00'),
    staff: {
      name: 'Sarah Johnson',
      role: 'IT Specialist'
    },
    attachments: [],
  },
];

// Add mock student data
const mockStudentProfile = {
  id: 'S12345',
  name: 'Alex Johnson',
  email: 'alex.johnson@university.edu',
  buildingName: 'West Campus Residence Hall',
  roomNumber: '304B',
  phone: '(555) 123-4567',
  department: 'Computer Science',
};

const StudentForm = () => {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedForm, setSelectedForm] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [newFormDialog, setNewFormDialog] = useState(false);
  const [view, setView] = useState('list');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [page, setPage] = useState(1);
  const formsPerPage = 6;
  const [calendarView, setCalendarView] = useState('week');
  const [calendarForms, setCalendarForms] = useState([]);
  const [clickedTimeSlot, setClickedTimeSlot] = useState(null);
  const [studentProfile, setStudentProfile] = useState(mockStudentProfile);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState(null);
  const { socket, isConnected } = useSocket();
  const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  const [formDetailsDialog, setFormDetailsDialog] = useState(false);
  const [reviewDialog, setReviewDialog] = useState(false);
  const [reviewData, setReviewData] = useState({
    rating: 5,
    comment: ''
  });

  // New form state
  const [newForm, setNewForm] = useState({
    title: '',
    description: '',
    formType: '',
    preferredStartTime: null,
    preferredEndTime: null,
    attachments: [],
    studentName: mockStudentProfile.name,
    buildingName: mockStudentProfile.buildingName,
    roomNumber: mockStudentProfile.roomNumber,
  });

  // Fetch student profile data
  useEffect(() => {
    const fetchStudentProfile = async () => {
      try {
        setProfileLoading(true);
        const response = await axios.get('/api/students/profile');
        
        // Format the profile data
        const profileData = {
          id: response.data._id,
          name: response.data.name,
          email: response.data.email,
          buildingName: response.data.room?.building || 'Unassigned',
          roomNumber: response.data.room?.roomNumber || 'Unassigned',
          studentDormNumber: response.data.studentDormNumber,
          role: response.data.role,
        };
        
        setStudentProfile(profileData);
        
        // Update new form state with student info
        setNewForm(prevForm => ({
          ...prevForm,
          studentName: profileData.name,
          buildingName: profileData.buildingName,
          roomNumber: profileData.roomNumber,
        }));
        
        setProfileLoading(false);
      } catch (err) {
        console.error('Error fetching student profile:', err);
        setProfileError('Failed to load student profile');
        setProfileLoading(false);
        
        // Fallback to mock data if API fails
        toast.error('Using sample data. Could not fetch your profile.');
      }
    };
    
    fetchStudentProfile();
  }, []);

  // Fetch forms submitted by the student
  useEffect(() => {
    const fetchStudentForms = async () => {
      try {
        setLoading(true);
        
        // Get forms for the past 30 days and next 30 days
        const today = new Date();
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(today.getDate() - 30);
        
        const thirtyDaysFromNow = new Date(today);
        thirtyDaysFromNow.setDate(today.getDate() + 30);
        
        const response = await axios.get('/api/students/forms', {
          params: {
            startDate: thirtyDaysAgo.toISOString(),
            endDate: thirtyDaysFromNow.toISOString(),
            limit: 100, // Get up to 100 forms
            sort: '-createdAt' // Sort by newest first
          }
        });
        
        // Add logging to see the state of forms coming from the server
        console.log('Forms fetched from server:', response.data.length);
        
        // Check for any forms that have reviews
        const formsWithReviews = response.data.filter(form => 
          form.studentReview && form.studentReview.rating && form.studentReview.rating > 0
        );
        console.log('Forms with reviews:', formsWithReviews.map(f => ({
          id: f._id,
          title: f.title,
          status: f.status,
          reviewRating: f.studentReview?.rating || 'none'
        })));
        
        // Add debug information about form IDs
        console.log('All form IDs:', response.data.map(f => f._id));
        
        setForms(response.data);
        setCalendarForms(response.data);
        
        // If this is first load, set a default form
        if (!selectedForm && response.data.length > 0) {
          setSelectedForm(response.data[0]);
        }
      } catch (err) {
        console.error('Error fetching forms:', err);
        toast.error('Failed to fetch maintenance forms');
      } finally {
        setLoading(false);
      }
    };
    
    // Only fetch if user is authenticated
    if (userData?._id) {
      fetchStudentForms();
    } else {
      // Use mock data if not authenticated (for development purposes)
      setForms(mockForms);
      setCalendarForms(calendarMockForms);
    }
  }, [userData?._id]);

  const handleOpenNewFormDialog = (dateTime = null) => {
    if (dateTime) {
      // Calculate end time (1 hour after start time)
      const endTime = new Date(dateTime);
      endTime.setHours(endTime.getHours() + 1);
      
      setNewForm({
        ...newForm,
        preferredStartTime: dateTime,
        preferredEndTime: endTime,
        studentName: studentProfile.name,
        buildingName: studentProfile.buildingName,
        roomNumber: studentProfile.roomNumber,
      });
    } else {
      setNewForm({
        ...newForm,
        studentName: studentProfile.name,
        buildingName: studentProfile.buildingName,
        roomNumber: studentProfile.roomNumber,
      });
    }
    setNewFormDialog(true);
  };

  const handleCloseNewFormDialog = () => {
    setNewFormDialog(false);
    setNewForm({
      title: '',
      description: '',
      formType: '',
      preferredStartTime: null,
      preferredEndTime: null,
      attachments: [],
      studentName: '',
      buildingName: '',
      roomNumber: '',
    });
    setClickedTimeSlot(null);
  };

  const handleSubmitForm = async () => {
    try {
      setLoading(true);

      // Calculate duration from start and end times
      let duration = 1;
      if (newForm.preferredStartTime && newForm.preferredEndTime) {
        const diffMs = newForm.preferredEndTime - newForm.preferredStartTime;
        duration = diffMs / (1000 * 60 * 60); // Duration in hours
      }
      
      // Create form data to send to the API
      const formData = {
        title: newForm.title,
        description: newForm.description,
        formType: newForm.formType,
        preferredStartTime: newForm.preferredStartTime,
        endTime: newForm.preferredEndTime,
        attachments: [] // In a real implementation, you'd upload files first and include their URLs here
      };

      // Submit form to backend API
      const response = await axios.post('/api/students/forms', formData);
      
      // Get the form with ID from server response
      const newFormData = response.data;
      
      // Add to both forms and calendarForms
      setForms(prevForms => [
        {
          ...newFormData,
          duration: duration, // Add duration calculated from start/end times
        }, 
        ...prevForms
      ]);
      
      setCalendarForms(prevForms => [
        {
          ...newFormData,
          duration: duration, // Add duration calculated from start/end times
        }, 
        ...prevForms
      ]);
      
      handleCloseNewFormDialog();
      toast.success('Form submitted successfully');
      
      // Refresh forms from the server to ensure we have the most up-to-date data
      refreshForms();
    } catch (err) {
      console.error('Form submission error:', err);
      toast.error(err.response?.data?.message || 'Failed to submit form');
    } finally {
      setLoading(false);
    }
  };

  // Function to refresh forms after submission or status update
  const refreshForms = async () => {
    try {
      console.log('Refreshing all forms from server');
      
      const today = new Date();
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(today.getDate() - 30);
      
      const thirtyDaysFromNow = new Date(today);
      thirtyDaysFromNow.setDate(today.getDate() + 30);
      
      const response = await axios.get('/api/students/forms', {
        params: {
          startDate: thirtyDaysAgo.toISOString(),
          endDate: thirtyDaysFromNow.toISOString(),
          limit: 100,
          sort: '-createdAt'
        }
      });
      
      // Check for any forms that have reviews
      const formsWithReviews = response.data.filter(form => 
        form.studentReview && form.studentReview.rating && form.studentReview.rating > 0
      );
      
      console.log(`Refreshed ${response.data.length} forms, ${formsWithReviews.length} with reviews`);
      
      // Track current selected form ID to maintain selection after refresh
      const currentSelectedFormId = selectedForm?._id;
      
      // Update forms state
      setForms(response.data);
      setCalendarForms(response.data);
      
      // Update the selected form if needed
      if (currentSelectedFormId) {
        const updatedForm = response.data.find(form => form._id === currentSelectedFormId);
        if (updatedForm) {
          console.log('Updating selected form with fresh data');
          setSelectedForm(updatedForm);
        }
      }
    } catch (err) {
      console.error('Error refreshing forms:', err);
    }
  };

  const getFormsForDate = (date) => {
    // Include both regular forms and calendar mock forms
    const allForms = [...forms, ...calendarForms];
    
    // First, filter by the selected date
    const formsByDate = allForms.filter(form => 
      isSameDay(new Date(form.preferredStartTime), date)
    );
    
    // Then prevent duplicate forms by using a Map with time positions as secondary keys
    const uniqueForms = new Map();
    
    formsByDate.forEach(form => {
      const formDate = new Date(form.preferredStartTime);
      const hours = formDate.getHours();
      const minutes = formDate.getMinutes();
      
      // Create a unique key using time positioning
      const positionKey = `${hours}-${minutes}`;
      
      // Only add if we don't already have this exact form at this position
      const existingKey = `${form._id}-${positionKey}`;
      if (!uniqueForms.has(existingKey)) {
        uniqueForms.set(existingKey, form);
      }
    });
    
    return Array.from(uniqueForms.values());
  };

  const handlePrevWeek = () => {
    setSelectedDate(prevDate => addDays(prevDate, -7));
  };

  const handleNextWeek = () => {
    setSelectedDate(prevDate => addDays(prevDate, 7));
  };

  const handleTimeSlotClick = (date, hour) => {
    // Create a new Date object for the clicked time
    const clickedDateTime = new Date(date);
    clickedDateTime.setHours(hour);
    clickedDateTime.setMinutes(0);
    clickedDateTime.setSeconds(0);
    
    // Save the clicked time slot and open the form dialog
    setClickedTimeSlot(clickedDateTime);
    handleOpenNewFormDialog(clickedDateTime);
  };

  // Add a new function to safely refresh a form's data when needed
  const refreshSelectedFormData = async (formId) => {
    if (!formId) return;
    
    try {
      // Fetch the specific form data directly from server to ensure it's fresh
      const response = await axios.get(`/api/students/forms/${formId}`);
      
      if (response.data) {
        console.log('Refreshed form data:', response.data);
        
        // Update the form in both arrays
        setForms(prevForms => 
          prevForms.map(form => 
            form._id === formId ? response.data : form
          )
        );
        
        setCalendarForms(prevForms => 
          prevForms.map(form => 
            form._id === formId ? response.data : form
          )
        );
        
        // Update selected form if it's the current one
        if (selectedForm && selectedForm._id === formId) {
          setSelectedForm(response.data);
        }
        
        return response.data;
      }
    } catch (err) {
      console.error('Error refreshing form data:', err);
    }
    
    return null;
  };

  // Modify handleFormClick to refresh the data when a form is clicked
  const handleFormClick = (form) => {
    // Add debugging information to trace form selection
    console.log('Form clicked:', {
      id: form._id, 
      title: form.title,
      status: form.status,
      hasReview: form.studentReview ? !!form.studentReview.rating : false,
      reviewDetails: form.studentReview || 'none'
    });
    
    // Refresh the form data first to ensure it's up to date
    refreshSelectedFormData(form._id).then(refreshedForm => {
      // If we got fresh data, use it; otherwise use the passed form
      setSelectedForm(refreshedForm || form);
      setFormDetailsDialog(true);
    });
  };

  const handleCloseFormDetails = () => {
    setFormDetailsDialog(false);
    setSelectedForm(null);
  };

  const handleOpenReviewDialog = async () => {
    if (!selectedForm) return;
    
    // Log current form state for debugging
    console.log('Review dialog request for form:', {
      id: selectedForm._id,
      title: selectedForm.title,
      status: selectedForm.status,
      hasReview: selectedForm.studentReview ? !!selectedForm.studentReview.rating : false
    });
    
    try {
      // First refresh all forms to ensure our data is current
      await refreshForms();
      
      // Then get the latest version of this specific form
      const freshForm = await refreshSelectedFormData(selectedForm._id);
      if (!freshForm) {
        toast.error('Could not retrieve the latest form data. Please try again.');
        return;
      }
      
      // Check if the form is completed
      if (freshForm.status !== 'Completed') {
        toast.info('Only completed forms can be reviewed');
        return;
      }
      
      // Improved check for existing review
      const hasExistingReview = freshForm.studentReview && 
          typeof freshForm.studentReview === 'object' && 
          'rating' in freshForm.studentReview && 
          freshForm.studentReview.rating > 0;
      
      if (hasExistingReview) {
        console.log('Review already exists:', freshForm.studentReview);
        toast.info('You have already reviewed this form');
        
        // Update the selected form with fresh data
        setSelectedForm(freshForm);
        return;
      }
      
      // If we get here, the form is completed and doesn't have a review yet
      setReviewDialog(true);
    } catch (error) {
      console.error('Error checking form review status:', error);
      toast.error('Error checking form status. Please try again.');
    }
  };

  const handleCloseReviewDialog = () => {
    setReviewDialog(false);
    setReviewData({
      rating: 5,
      comment: ''
    });
  };

  const handleReviewChange = (field, value) => {
    setReviewData({
      ...reviewData,
      [field]: value
    });
  };

  const submitReview = async () => {
    try {
      setLoading(true);
      
      if (!selectedForm || !selectedForm._id) {
        toast.error('Cannot identify the form to review');
        setLoading(false);
        return;
      }
      
      // Refresh all form data first to ensure everything is up to date
      await refreshForms();
      
      // Then fetch the specific form data 
      console.log('Refreshing form data before review submission for form:', selectedForm._id);
      const freshForm = await refreshSelectedFormData(selectedForm._id);
      
      if (!freshForm) {
        toast.error('Could not retrieve the latest form data. Please try again.');
        setLoading(false);
        return;
      }
      
      // Check if the form status is Completed
      if (freshForm.status !== 'Completed') {
        toast.error('Only completed forms can be reviewed');
        handleCloseReviewDialog();
        setLoading(false);
        return;
      }
      
      // More thorough check if the form already has a review
      if (freshForm.studentReview && 
          (typeof freshForm.studentReview === 'object' && freshForm.studentReview.rating > 0)) {
        
        console.log('Form already has a review:', freshForm.studentReview);
        toast.info('You have already reviewed this form');
        
        // Update the local state with the fresh data that includes the review
        setSelectedForm(freshForm);
        handleCloseReviewDialog();
        setLoading(false);
        return;
      }
      
      console.log('Submitting review for form:', freshForm._id);
      console.log('Review data:', reviewData);
      
      try {
        const response = await axios.post(`/api/students/forms/${freshForm._id}/review`, {
          rating: reviewData.rating,
          comment: reviewData.comment
        }, {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        console.log('Review submission successful:', response.data);
        
        // Update the form in local state
        updateFormWithReview(freshForm._id);
        toast.success('Thank you for your review!');
        handleCloseReviewDialog();
        
        // Refresh all forms after a successful submission
        setTimeout(() => {
          refreshForms();
        }, 1000);
      } catch (error) {
        console.error('Error submitting review:', error);
        
        // Check if the server provided a specific error message
        if (error.response?.data?.message) {
          toast.error(`Error: ${error.response.data.message}`);
          
          // If the message indicates the review already exists, refresh the form data
          if (error.response.data.message.includes('already reviewed')) {
            refreshSelectedFormData(freshForm._id).then(updatedForm => {
              if (updatedForm) {
                setSelectedForm(updatedForm);
              }
            });
          }
        } else if (error.response?.status === 400) {
          toast.error('Invalid review data. Please check your rating and try again.');
        } else if (error.response?.status === 403) {
          toast.error('You are not authorized to review this form.');
        } else if (error.response?.status === 500) {
          // For 500 errors, the review may actually have been saved despite the error
          console.log('Server error but review might have been saved. Optimistically updating UI.');
          
          // Update the UI as if the review was saved successfully
          updateFormWithReview(freshForm._id);
          toast.info('Your review was submitted but we had trouble confirming it. The page will refresh to check the status.');
          handleCloseReviewDialog();
          
          // Refresh form data after a delay to check if the review was actually saved
          setTimeout(() => {
            refreshSelectedFormData(freshForm._id);
            refreshForms();
          }, 1500);
        } else {
          // For any other errors, also assume the review might have gone through
          updateFormWithReview(freshForm._id);
          toast.info('Your review may have been saved. The page will refresh to check the status.');
          handleCloseReviewDialog();
          
          // Refresh form data after a delay
          setTimeout(() => {
            refreshSelectedFormData(freshForm._id);
            refreshForms();
          }, 1500);
        }
      }
    } catch (err) {
      console.error('Unexpected error in review submission process:', err);
      toast.error('An unexpected error occurred. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to update form data with a new review
  const updateFormWithReview = (formId) => {
    // Update forms array
    setForms(prevForms => 
      prevForms.map(form => 
        form._id === formId
          ? { 
              ...form, 
              studentReview: { 
                rating: reviewData.rating, 
                comment: reviewData.comment, 
                reviewDate: new Date() 
              } 
            } 
          : form
      )
    );
    
    // Update calendar forms array
    setCalendarForms(prevForms => 
      prevForms.map(form => 
        form._id === formId
          ? { 
              ...form, 
              studentReview: { 
                rating: reviewData.rating, 
                comment: reviewData.comment, 
                reviewDate: new Date() 
              } 
            } 
          : form
      )
    );
    
    // Update selected form if it matches the ID
    if (selectedForm && selectedForm._id === formId) {
      setSelectedForm(prevForm => ({
        ...prevForm,
        studentReview: {
          rating: reviewData.rating,
          comment: reviewData.comment,
          reviewDate: new Date()
        }
      }));
    }
  };

  const renderFormDetailsDialog = () => {
    if (!selectedForm) return null;
    
    const statusInfo = statusConfig[selectedForm.status] || {};
    
    return (
      <Dialog
        open={formDetailsDialog}
        onClose={handleCloseFormDetails}
        maxWidth="md"
        PaperProps={{
          sx: {
            background: 'linear-gradient(145deg, #141414 0%, #0A0A0A 100%)',
            border: '1px solid rgba(255, 255, 255, 0.03)',
            borderRadius: '20px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)',
            overflow: 'hidden',
          }
        }}
      >
        {/* Top colored strip based on form status */}
        <Box sx={{ 
          background: statusInfo.bgGradient || 'linear-gradient(90deg, #1E40AF, #3B82F6)',
          height: '8px',
          width: '100%',
        }} />
        
        <DialogTitle sx={{ 
          p: 3, 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ 
              bgcolor: 'rgba(255,255,255,0.1)', 
              color: statusInfo.color || '#3B82F6',
            }}>
              {statusInfo.icon || <AssignmentIcon />}
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600 }}>
                {selectedForm.title}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5, gap: 1 }}>
                <Chip
                  label={selectedForm.status}
                  size="small"
                  sx={{
                    background: statusInfo.bgGradient,
                    color: '#fff',
                    fontWeight: 500,
                    fontSize: '0.75rem',
                  }}
                />
                <Typography variant="caption" sx={{ color: '#9CA3AF' }}>
                  {selectedForm.formType}
                </Typography>
              </Box>
            </Box>
          </Box>
          <IconButton onClick={handleCloseFormDetails} sx={{ color: '#6B7280' }}>
            <CancelIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ p: 0 }}>
          <Box sx={{ p: 3 }}>
            <Grid container spacing={3}>
              {/* Left column - Form details */}
              <Grid item xs={12} md={7}>
                <Paper sx={{ 
                  p: 3, 
                  bgcolor: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: '12px',
                  height: '100%',
                }}>
                  <Typography variant="subtitle1" sx={{ color: '#fff', mb: 2, fontWeight: 600 }}>
                    Request Details
                  </Typography>
                  
                  <Typography variant="body2" sx={{ color: '#9CA3AF', mb: 1, fontWeight: 500 }}>
                    Description
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#fff', mb: 3, whiteSpace: 'pre-wrap' }}>
                    {selectedForm.description}
                  </Typography>
                  
                  <Typography variant="body2" sx={{ color: '#9CA3AF', mb: 1, fontWeight: 500 }}>
                    Schedule Information
                  </Typography>
                  <Stack spacing={2} sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <AccessTimeIcon sx={{ color: '#6B7280', fontSize: 20 }} />
                      <Box>
                        <Typography variant="body2" sx={{ color: '#9CA3AF' }}>
                          Start Time
                        </Typography>
                        <Typography variant="body1" sx={{ color: '#fff' }}>
                          {format(new Date(selectedForm.preferredStartTime), 'MMM d, yyyy h:mm a')}
                        </Typography>
                      </Box>
                    </Box>
                    
                    {selectedForm.endTime && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <AccessTimeIcon sx={{ color: '#6B7280', fontSize: 20 }} />
                        <Box>
                          <Typography variant="body2" sx={{ color: '#9CA3AF' }}>
                            End Time
                          </Typography>
                          <Typography variant="body1" sx={{ color: '#fff' }}>
                            {format(new Date(selectedForm.endTime || selectedForm.preferredStartTime), 'MMM d, yyyy h:mm a')}
                          </Typography>
                        </Box>
                      </Box>
                    )}
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <CalendarMonthIcon sx={{ color: '#6B7280', fontSize: 20 }} />
                      <Box>
                        <Typography variant="body2" sx={{ color: '#9CA3AF' }}>
                          Duration
                        </Typography>
                        <Typography variant="body1" sx={{ color: '#fff' }}>
                          {selectedForm.duration ? `${selectedForm.duration} hours` : '1 hour'}
                        </Typography>
                      </Box>
                    </Box>
                  </Stack>
                  
                  {selectedForm.attachments && selectedForm.attachments.length > 0 && (
                    <>
                      <Typography variant="body2" sx={{ color: '#9CA3AF', mb: 1, fontWeight: 500 }}>
                        Attachments
                      </Typography>
                      <List dense sx={{ bgcolor: 'rgba(0,0,0,0.2)', borderRadius: '8px', mb: 3 }}>
                        {selectedForm.attachments.map((file, index) => (
                          <ListItem key={index}>
                            <ListItemAvatar>
                              <Avatar sx={{ bgcolor: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6' }}>
                                <FolderOpenIcon />
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText 
                              primary={<Typography noWrap variant="body2" sx={{ color: '#fff' }}>{file.fileName}</Typography>}
                              secondary={<Typography variant="caption" sx={{ color: '#6B7280' }}>{file.fileType}</Typography>}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </>
                  )}
                  
                  {selectedForm.rejectionReason && (
                    <Box sx={{ 
                      p: 2, 
                      bgcolor: 'rgba(239, 68, 68, 0.1)', 
                      borderRadius: '8px',
                      borderLeft: '4px solid #EF4444',
                      mb: 3
                    }}>
                      <Typography variant="subtitle2" sx={{ color: '#EF4444', mb: 1, fontWeight: 600 }}>
                        Rejection Reason
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#fff' }}>
                        {selectedForm.rejectionReason}
                      </Typography>
                    </Box>
                  )}
                </Paper>
              </Grid>
              
              {/* Right column - Status and timeline */}
              <Grid item xs={12} md={5}>
                <Paper sx={{ 
                  p: 3, 
                  bgcolor: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: '12px',
                  mb: 3
                }}>
                  <Typography variant="subtitle1" sx={{ color: '#fff', mb: 2, fontWeight: 600 }}>
                    Status Information
                  </Typography>
                  
                  <Stack spacing={2}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar 
                        sx={{ 
                          width: 36, 
                          height: 36, 
                          bgcolor: 'rgba(255,255,255,0.1)', 
                          color: statusInfo.color || '#3B82F6' 
                        }}
                      >
                        {statusInfo.icon || <AssignmentIcon />}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" sx={{ color: '#9CA3AF' }}>
                          Current Status
                        </Typography>
                        <Typography variant="body1" sx={{ color: statusInfo.color || '#3B82F6', fontWeight: 600 }}>
                          {selectedForm.status}
                        </Typography>
                      </Box>
                    </Box>
                    
                    {selectedForm.staff && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar 
                          sx={{ 
                            width: 36, 
                            height: 36, 
                            bgcolor: 'rgba(255,255,255,0.1)', 
                            color: '#8B5CF6' 
                          }}
                        >
                          {selectedForm.staff?.name ? selectedForm.staff.name.charAt(0) : 'S'}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ color: '#9CA3AF' }}>
                            Assigned To
                          </Typography>
                          <Typography variant="body1" sx={{ color: '#fff' }}>
                            {selectedForm.staff.name}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#6B7280' }}>
                            {selectedForm.staff.role}
                          </Typography>
                        </Box>
                      </Box>
                    )}
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <AccessTimeIcon sx={{ color: '#6B7280', fontSize: 24 }} />
                      <Box>
                        <Typography variant="body2" sx={{ color: '#9CA3AF' }}>
                          Submitted On
                        </Typography>
                        <Typography variant="body1" sx={{ color: '#fff' }}>
                          {format(new Date(selectedForm.createdAt), 'MMM d, yyyy h:mm a')}
                        </Typography>
                      </Box>
                    </Box>
                  </Stack>
                </Paper>
                
                {/* Timeline/Activity section */}
                <Paper sx={{ 
                  p: 3, 
                  bgcolor: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: '12px',
                  mb: selectedForm.studentReview && selectedForm.studentReview.rating > 0 ? 3 : 0
                }}>
                  <Typography variant="subtitle1" sx={{ color: '#fff', mb: 2, fontWeight: 600 }}>
                    Status Timeline
                  </Typography>
                  
                  <Box sx={{ position: 'relative', ml: 1.5, pb: 2 }}>
                    {/* Vertical timeline line */}
                    <Box sx={{
                      position: 'absolute',
                      left: 9,
                      top: 0,
                      bottom: 0,
                      width: 2,
                      bgcolor: 'rgba(255,255,255,0.1)',
                      zIndex: 0
                    }} />
                    
                    {/* Timeline items */}
                    <Stack spacing={3}>
                      <Box sx={{ position: 'relative', pl: 3, pb: 2 }}>
                        <Box sx={{
                          position: 'absolute',
                          left: 0,
                          top: 0,
                          width: 20,
                          height: 20,
                          borderRadius: '50%',
                          bgcolor: statusConfig['Pending'].color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          zIndex: 1
                        }}>
                          <AssignmentIcon sx={{ fontSize: 12, color: '#fff' }} />
                        </Box>
                        <Typography variant="body2" sx={{ color: '#fff', fontWeight: 500 }}>
                          Form Submitted
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#6B7280', display: 'block' }}>
                          {format(new Date(selectedForm.createdAt), 'MMM d, yyyy h:mm a')}
                        </Typography>
                      </Box>
                      
                      {selectedForm.status !== 'Pending' && (
                        <Box sx={{ position: 'relative', pl: 3, pb: 2 }}>
                          <Box sx={{
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            width: 20,
                            height: 20,
                            borderRadius: '50%',
                            bgcolor: selectedForm.status === 'Rejected' ? statusConfig['Rejected'].color : statusConfig['Approved'].color,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 1
                          }}>
                            {selectedForm.status === 'Rejected' ? 
                              <CancelIcon sx={{ fontSize: 12, color: '#fff' }} /> : 
                              <CheckCircleIcon sx={{ fontSize: 12, color: '#fff' }} />
                            }
                          </Box>
                          <Typography variant="body2" sx={{ color: '#fff', fontWeight: 500 }}>
                            {selectedForm.status === 'Rejected' ? 'Form Rejected' : 'Form Approved'}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#6B7280', display: 'block' }}>
                            {/* Use a mock date for this example */}
                            {format(new Date(new Date(selectedForm.createdAt).getTime() + 24 * 60 * 60 * 1000), 'MMM d, yyyy h:mm a')}
                          </Typography>
                          
                          {selectedForm.rejectionReason && (
                            <Typography variant="caption" sx={{ color: '#EF4444', display: 'block', mt: 1 }}>
                              {selectedForm.rejectionReason}
                            </Typography>
                          )}
                        </Box>
                      )}
                      
                      {selectedForm.status === 'Assigned' && (
                        <Box sx={{ position: 'relative', pl: 3, pb: 2 }}>
                          <Box sx={{
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            width: 20,
                            height: 20,
                            borderRadius: '50%',
                            bgcolor: statusConfig['Assigned'].color,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 1
                          }}>
                            <PersonIcon sx={{ fontSize: 12, color: '#fff' }} />
                          </Box>
                          <Typography variant="body2" sx={{ color: '#fff', fontWeight: 500 }}>
                            Assigned to Staff
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#6B7280', display: 'block' }}>
                            {/* Use a mock date for this example */}
                            {format(new Date(new Date(selectedForm.createdAt).getTime() + 48 * 60 * 60 * 1000), 'MMM d, yyyy h:mm a')}
                          </Typography>
                          {selectedForm.staff && (
                            <Typography variant="caption" sx={{ color: '#9CA3AF', display: 'block', mt: 1 }}>
                              Assigned to: {selectedForm.staff.name} ({selectedForm.staff.role})
                            </Typography>
                          )}
                        </Box>
                      )}
                      
                      {['In Progress', 'In Review', 'Completed'].includes(selectedForm.status) && (
                        <>
                          <Box sx={{ position: 'relative', pl: 3, pb: 2 }}>
                            <Box sx={{
                              position: 'absolute',
                              left: 0,
                              top: 0,
                              width: 20,
                              height: 20,
                              borderRadius: '50%',
                              bgcolor: statusConfig['Assigned'].color,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              zIndex: 1
                            }}>
                              <PersonIcon sx={{ fontSize: 12, color: '#fff' }} />
                            </Box>
                            <Typography variant="body2" sx={{ color: '#fff', fontWeight: 500 }}>
                              Assigned to Staff
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#6B7280', display: 'block' }}>
                              {/* Use a mock date for this example */}
                              {format(new Date(new Date(selectedForm.createdAt).getTime() + 48 * 60 * 60 * 1000), 'MMM d, yyyy h:mm a')}
                            </Typography>
                          </Box>
                          
                          <Box sx={{ position: 'relative', pl: 3, pb: 2 }}>
                            <Box sx={{
                              position: 'absolute',
                              left: 0,
                              top: 0,
                              width: 20,
                              height: 20,
                              borderRadius: '50%',
                              bgcolor: statusConfig['In Progress'].color,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              zIndex: 1
                            }}>
                              <PlayArrowIcon sx={{ fontSize: 12, color: '#fff' }} />
                            </Box>
                            <Typography variant="body2" sx={{ color: '#fff', fontWeight: 500 }}>
                              Work In Progress
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#6B7280', display: 'block' }}>
                              {/* Use a mock date for this example */}
                              {format(new Date(new Date(selectedForm.createdAt).getTime() + 72 * 60 * 60 * 1000), 'MMM d, yyyy h:mm a')}
                            </Typography>
                          </Box>
                        </>
                      )}
                      
                      {['In Review', 'Completed'].includes(selectedForm.status) && (
                        <Box sx={{ position: 'relative', pl: 3, pb: 2 }}>
                          <Box sx={{
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            width: 20,
                            height: 20,
                            borderRadius: '50%',
                            bgcolor: statusConfig['In Review'].color,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 1
                          }}>
                            <ScheduleIcon sx={{ fontSize: 12, color: '#fff' }} />
                          </Box>
                          <Typography variant="body2" sx={{ color: '#fff', fontWeight: 500 }}>
                            Ready for Review
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#6B7280', display: 'block' }}>
                            {/* Use a mock date for this example */}
                            {format(new Date(new Date(selectedForm.createdAt).getTime() + 96 * 60 * 60 * 1000), 'MMM d, yyyy h:mm a')}
                          </Typography>
                        </Box>
                      )}
                      
                      {selectedForm.status === 'Completed' && (
                        <Box sx={{ position: 'relative', pl: 3 }}>
                          <Box sx={{
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            width: 20,
                            height: 20,
                            borderRadius: '50%',
                            bgcolor: statusConfig['Completed'].color,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 1
                          }}>
                            <DoneIcon sx={{ fontSize: 12, color: '#fff' }} />
                          </Box>
                          <Typography variant="body2" sx={{ color: '#fff', fontWeight: 500 }}>
                            Work Completed
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#6B7280', display: 'block' }}>
                            {/* Use a mock date for this example */}
                            {format(new Date(new Date(selectedForm.createdAt).getTime() + 120 * 60 * 60 * 1000), 'MMM d, yyyy h:mm a')}
                          </Typography>
                        </Box>
                      )}
                    </Stack>
                  </Box>
                </Paper>
                
                {/* Review display section - only show if a review exists */}
                {selectedForm.studentReview && selectedForm.studentReview.rating > 0 && (
                  <Paper sx={{ 
                    p: 3, 
                    bgcolor: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: '12px'
                  }}>
                    <Typography variant="subtitle1" sx={{ color: '#fff', mb: 2, fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                      <StarIcon sx={{ color: '#F59E0B', mr: 1, fontSize: 20 }} />
                      Your Review
                    </Typography>
                    
                    <Box sx={{ mb: 2 }}>
                      <Rating 
                        value={selectedForm.studentReview.rating} 
                        readOnly 
                        sx={{ color: '#F59E0B', mb: 1 }}
                      />
                      <Typography variant="caption" sx={{ color: '#9CA3AF', display: 'block' }}>
                        Submitted on {format(new Date(selectedForm.studentReview.reviewDate), 'MMM d, yyyy')}
                      </Typography>
                    </Box>
                    
                    {selectedForm.studentReview.comment && (
                      <Box sx={{ bgcolor: 'rgba(0,0,0,0.2)', p: 2, borderRadius: '8px' }}>
                        <Typography variant="body2" sx={{ color: '#fff', fontStyle: 'italic' }}>
                          "{selectedForm.studentReview.comment}"
                        </Typography>
                      </Box>
                    )}
                  </Paper>
                )}
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ p: 3, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <Button 
            onClick={handleCloseFormDetails}
            variant="outlined"
            sx={{
              color: '#6B7280',
              borderColor: 'rgba(107, 114, 128, 0.3)',
              '&:hover': {
                borderColor: 'rgba(107, 114, 128, 0.5)',
                backgroundColor: 'rgba(107, 114, 128, 0.05)',
              },
            }}
          >
            Close
          </Button>
          
          {selectedForm.status === 'Completed' && (
            selectedForm.studentReview && selectedForm.studentReview.rating > 0 ? (
              // Show the review data directly in the form details
              <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
                <Typography variant="body2" sx={{ color: '#9CA3AF', mr: 1 }}>
                  Your Review:
                </Typography>
                <Rating 
                  value={selectedForm.studentReview.rating} 
                  readOnly 
                  size="small"
                  sx={{ color: '#F59E0B' }}
                />
              </Box>
            ) : (
              // If no review exists, show the "Leave Review" button
              <Button
                variant="contained"
                startIcon={<StarIcon />}
                onClick={handleOpenReviewDialog}
                sx={{
                  background: 'linear-gradient(145deg, #10B981 0%, #059669 100%)',
                  '&:hover': {
                    background: 'linear-gradient(145deg, #059669 0%, #047857 100%)',
                  },
                }}
              >
                Leave Review
              </Button>
            )
          )}
        </DialogActions>
      </Dialog>
    );
  };

  const renderCalendarView = () => {
    const days = Array.from({ length: 7 }, (_, i) => 
      addDays(startOfWeek(selectedDate), i)
    );
    const hours = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23]; // 12 AM to 11 PM

    return (
      <Box>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h5" sx={{ color: '#fff' }}>
            Calendar View
          </Typography>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1,
          }}>
            <IconButton 
              onClick={handlePrevWeek}
              sx={{ color: '#6B7280' }}
            >
              <ChevronLeftIcon />
            </IconButton>
            <Typography 
              variant="subtitle1" 
              sx={{ 
                color: '#fff',
                px: 2,
                minWidth: 180,
                textAlign: 'center'
              }}
            >
              {format(startOfWeek(selectedDate), 'MMM d')} - {format(addDays(startOfWeek(selectedDate), 6), 'MMM d, yyyy')}
            </Typography>
            <IconButton 
              onClick={handleNextWeek}
              sx={{ color: '#6B7280' }}
            >
              <ChevronRightIcon />
            </IconButton>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenNewFormDialog()}
            sx={{
              background: 'linear-gradient(145deg, #1E40AF 0%, #3B82F6 100%)',
              '&:hover': {
                background: 'linear-gradient(145deg, #1E3A8A 0%, #2563EB 100%)',
              },
            }}
          >
            New Form
          </Button>
        </Stack>

        {/* Day Headers above calendar */}
        <Box sx={{ 
          display: 'grid',
          gridTemplateColumns: '60px repeat(7, 1fr)',
          gap: 1,
          mb: 1,
          bgcolor: 'rgba(0, 0, 0, 0.2)',
          borderRadius: '8px 8px 0 0',
          p: 1,
        }}>
          {/* Time Column Header */}
          <Box sx={{ 
            textAlign: 'center',
            p: 1,
          }}>
            <Typography variant="body2" sx={{ color: '#9CA3AF', fontWeight: 600 }}>
              Time
            </Typography>
          </Box>

          {/* Date Headers */}
          {days.map((date, i) => (
            <Box 
              key={i}
              sx={{ 
                textAlign: 'center',
                p: 1,
              }}
            >
              <Typography variant="body2" sx={{ color: '#9CA3AF', fontWeight: 600 }}>
                {format(date, 'EEE')}
              </Typography>
              <Typography variant="h6" sx={{ 
                color: isToday(date) ? '#3B82F6' : '#fff',
                fontWeight: isToday(date) ? 600 : 400,
              }}>
                {format(date, 'd')}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Calendar Grid */}
        <Box sx={{ 
          display: 'grid',
          gridTemplateColumns: '60px repeat(7, 1fr)',
          gap: 1,
          bgcolor: 'rgba(255,255,255,0.03)',
          borderRadius: '0 0 8px 8px',
          p: 2,
          height: '500px',
          overflowY: 'auto',
          scrollBehavior: 'smooth',
          '&::-webkit-scrollbar': {
            width: '12px',
            backgroundColor: 'rgba(0,0,0,0.2)',
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: 'rgba(0,0,0,0.1)',
            borderRadius: '6px',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'rgba(64, 64, 64, 0.4)',
            borderRadius: '6px',
            border: '2px solid rgba(0,0,0,0.2)',
            '&:hover': {
              backgroundColor: 'rgba(64, 64, 64, 0.6)',
            }
          },
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(64, 64, 64, 0.4) rgba(0,0,0,0.2)'
        }}>
          {/* Time Labels Column */}
          <Box sx={{ position: 'relative', height: '1200px' }}> {/* 24 hours * 50px */}
            {hours.map((hour) => (
              <Typography
                key={hour}
                variant="caption"
                sx={{
                  position: 'absolute',
                  top: `${hour * 50}px`,
                  right: '8px',
                  color: '#6B7280',
                  transform: 'translateY(-50%)',
                  fontSize: '0.75rem'
                }}
              >
                {hour === 0 ? '' : `${hour % 12 === 0 ? '12' : hour % 12}${hour < 12 ? 'AM' : 'PM'}`}
              </Typography>
            ))}
          </Box>

          {/* Day Columns */}
          {days.map((date, dayIndex) => {
            const dayForms = getFormsForDate(date);

            return (
              <Box 
                key={dayIndex}
                sx={{ 
                  position: 'relative',
                  height: '1200px', // 24 hours * 50px
                  borderRight: dayIndex < 6 ? '1px solid rgba(255,255,255,0.1)' : 'none',
                }}
              >
                {/* Hour Lines and Clickable Time Slots */}
                {hours.map((hour) => (
                  <Box
                    key={hour}
                    sx={{
                      position: 'absolute',
                      top: `${hour * 50}px`,
                      left: 0,
                      right: 0,
                      height: '50px',
                      borderTop: '1px solid rgba(255,255,255,0.05)',
                      cursor: 'pointer',
                      '&:hover': {
                        background: 'rgba(59, 130, 246, 0.05)',
                      },
                      '&:active': {
                        background: 'rgba(59, 130, 246, 0.1)',
                      },
                    }}
                    onClick={() => handleTimeSlotClick(date, hour)}
                  />
                ))}

                {/* Current time indicator */}
                {isToday(date) && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: `${new Date().getHours() * 50 + (new Date().getMinutes() / 60) * 50}px`,
                      left: 0,
                      right: 0,
                      height: '2px',
                      bgcolor: '#3B82F6',
                      zIndex: 3,
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        left: '-5px',
                        top: '-4px',
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        bgcolor: '#3B82F6',
                      }
                    }}
                  />
                )}

                {/* Forms */}
                {dayForms.map((form) => {
                  const formDate = new Date(form.preferredStartTime);
                  const hours = formDate.getHours();
                  const minutes = formDate.getMinutes();
                  
                  const topPosition = hours * 50 + (minutes / 60) * 50;
                  
                  // Calculate height based on duration (default to 1 hour if not specified)
                  const duration = form.duration || 1;
                  const cardHeight = duration * 50 - 4; // Subtract padding
                  
                  // Create a unique position-based key
                  const formPositionKey = `${hours}-${minutes}-${Math.floor(duration)}`;

                  return (
                    <Card
                      key={`calendar-form-${form._id}-${dayIndex}-${formPositionKey}`}
                      sx={{
                        position: 'absolute',
                        top: `${topPosition}px`,
                        left: '4px',
                        right: '4px',
                        height: `${cardHeight}px`,
                        p: 1.5,
                        bgcolor: `${statusConfig[form.status]?.color}15`,
                        border: `1px solid ${statusConfig[form.status]?.color}30`,
                        cursor: 'pointer',
                        zIndex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        '&:hover': {
                          bgcolor: `${statusConfig[form.status]?.color}25`,
                          boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
                          zIndex: 2,
                        }
                      }}
                      onClick={() => handleFormClick(form)}
                    >
                      <Stack direction="row" spacing={0.5} alignItems="center" mb={0.5}>
                        {statusConfig[form.status]?.icon && (
                          <Box sx={{ 
                            color: statusConfig[form.status]?.color, 
                            display: 'flex', 
                            alignItems: 'center',
                            fontSize: '16px'
                          }}>
                            {statusConfig[form.status]?.icon}
                          </Box>
                        )}
                        <Typography variant="caption" sx={{ 
                          color: statusConfig[form.status]?.color,
                          display: 'block',
                        }}>
                          {format(formDate, 'h:mm a')} - {format(new Date(formDate.getTime() + duration * 60 * 60 * 1000), 'h:mm a')}
                        </Typography>
                      </Stack>
                      <Typography variant="body2" sx={{ 
                        color: '#fff', 
                        mb: 0.5,
                        fontWeight: 500,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {form.title}
                      </Typography>
                      <Typography variant="caption" sx={{ 
                        color: '#6B7280', 
                        display: 'block',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {form.formType}
                      </Typography>
                      {form.staff && duration >= 1.5 && (
                        <Box sx={{ mt: 'auto', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Avatar 
                            sx={{ 
                              width: 16, 
                              height: 16, 
                              fontSize: '0.6rem',
                              bgcolor: 'rgba(255,255,255,0.1)'
                            }}
                          >
                            {form.staff?.name ? form.staff.name.charAt(0) : 'S'}
                          </Avatar>
                          <Typography variant="caption" noWrap sx={{ 
                            color: '#9CA3AF',
                            fontSize: '0.65rem'
                          }}>
                            {form.staff?.name || 'Staff Member'}
                          </Typography>
                        </Box>
                      )}
                    </Card>
                  );
                })}
              </Box>
            );
          })}
        </Box>
      </Box>
    );
  };

  const renderRecentForms = () => {
    // Sort forms by creation date (newest first)
    const sortedForms = [...forms].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    
    // Take only the most recent forms
    const recentForms = sortedForms.slice(0, 5);
    
    return (
      <Box sx={{ mt: 4 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h5" sx={{ color: '#fff' }}>
            Recent Submissions
          </Typography>
          <Button
            variant="text"
            endIcon={<KeyboardArrowDownIcon />}
            sx={{ color: '#3B82F6' }}
            onClick={() => setView('list')}
          >
            View All
          </Button>
        </Stack>
        
        <Box
          sx={{
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 4px 24px rgba(0, 0, 0, 0.15)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
          }}
        >
          {/* Table Header */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: '1fr 150px 150px 180px',
              gap: 2,
              p: 2,
              borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
              background: 'rgba(0, 0, 0, 0.2)',
            }}
          >
            <Typography variant="subtitle2" sx={{ color: '#9CA3AF', fontWeight: 600 }}>
              Request Details
            </Typography>
            <Typography variant="subtitle2" sx={{ color: '#9CA3AF', fontWeight: 600 }}>
              Status
            </Typography>
            <Typography variant="subtitle2" sx={{ color: '#9CA3AF', fontWeight: 600 }}>
              Type
            </Typography>
            <Typography variant="subtitle2" sx={{ color: '#9CA3AF', fontWeight: 600 }}>
              Schedule
            </Typography>
          </Box>

          {/* Loading state */}
          {loading && (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <CircularProgress size={30} sx={{ color: '#3B82F6', mb: 2 }} />
              <Typography variant="body1" sx={{ color: '#6B7280' }}>
                Loading your forms...
              </Typography>
            </Box>
          )}

          {/* Error state */}
          {error && (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <WarningIcon sx={{ color: '#EF4444', fontSize: 40, mb: 2 }} />
              <Typography variant="body1" sx={{ color: '#EF4444', mb: 2 }}>
                {error}
              </Typography>
              <Button
                variant="outlined"
                onClick={refreshForms}
                sx={{ 
                  borderColor: 'rgba(59, 130, 246, 0.5)',
                  color: '#3B82F6',
                }}
              >
                Try Again
              </Button>
            </Box>
          )}

          {/* Table Body */}
          {!loading && !error && recentForms.map((form, index) => (
            <Box
              key={`recent-form-${form._id}-${index}`}
              sx={{
                display: 'grid',
                gridTemplateColumns: '1fr 150px 150px 180px',
                gap: 2,
                p: 2,
                borderBottom: index < recentForms.length - 1 ? '1px solid rgba(255, 255, 255, 0.05)' : 'none',
                transition: 'all 0.2s ease',
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.05)',
                },
                cursor: 'pointer',
              }}
              onClick={() => handleFormClick(form)}
            >
              {/* Request Details */}
              <Box>
                <Typography variant="body1" sx={{ color: '#fff', fontWeight: 500, mb: 0.5 }}>
                  {form.title}
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: '#6B7280', 
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {form.description}
                </Typography>
              </Box>

              {/* Status */}
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Chip
                  label={form.status}
                  size="small"
                  icon={statusConfig[form.status]?.icon}
                  sx={{
                    background: statusConfig[form.status]?.bgGradient,
                    color: '#fff',
                    fontWeight: 500,
                    '& .MuiChip-icon': {
                      color: '#fff',
                    },
                  }}
                />
              </Box>

              {/* Type */}
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ color: '#9CA3AF' }}>
                  {form.formType}
                </Typography>
              </Box>

              {/* Schedule */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AccessTimeIcon sx={{ color: '#6B7280', fontSize: 18 }} />
                <Typography variant="body2" sx={{ color: '#9CA3AF' }}>
                  {format(new Date(form.preferredStartTime), 'MMM dd, hh:mm a')}
                </Typography>
              </Box>

              {/* Staff Assignment - Shown conditionally */}
              {form.staff && (
                <Box 
                  sx={{ 
                    gridColumn: '1 / -1',
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1,
                    mt: 1,
                    pt: 1,
                    borderTop: '1px dashed rgba(255, 255, 255, 0.05)',
                  }}
                >
                  <Avatar 
                    sx={{ 
                      width: 24, 
                      height: 24, 
                      fontSize: '0.75rem',
                      bgcolor: 'rgba(59, 130, 246, 0.2)',
                      color: '#3B82F6',
                    }}
                  >
                    {form.staff?.name ? form.staff.name.charAt(0) : 'S'}
                  </Avatar>
                  <Typography variant="body2" sx={{ color: '#9CA3AF' }}>
                    Assigned to: <span style={{ color: '#fff' }}>{form.staff?.name || 'Staff Member'}</span> ({form.staff?.role || 'Maintenance Staff'})
                  </Typography>
                </Box>
              )}
            </Box>
          ))}

          {/* Empty State */}
          {!loading && !error && recentForms.length === 0 && (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body1" sx={{ color: '#6B7280' }}>
                No forms submitted yet
              </Typography>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => handleOpenNewFormDialog()}
                sx={{ 
                  mt: 2,
                  borderColor: 'rgba(59, 130, 246, 0.5)',
                  color: '#3B82F6',
                  '&:hover': {
                    borderColor: '#3B82F6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                  },
                }}
              >
                Submit New Form
              </Button>
            </Box>
          )}
        </Box>
      </Box>
    );
  };

  const renderViewToggle = () => (
    <ButtonGroup sx={{ mb: 3 }}>
      <Button
        startIcon={<ListAltIcon />}
        onClick={() => setView('list')}
        variant={view === 'list' ? 'contained' : 'outlined'}
        sx={{
          background: view === 'list' 
            ? 'linear-gradient(145deg, #1E40AF 0%, #3B82F6 100%)' 
            : 'transparent',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          color: view === 'list' ? '#fff' : '#6B7280',
          '&:hover': {
            borderColor: 'rgba(255, 255, 255, 0.2)',
          },
        }}
      >
        List View
      </Button>
      <Button
        startIcon={<CalendarMonthIcon />}
        onClick={() => setView('calendar')}
        variant={view === 'calendar' ? 'contained' : 'outlined'}
        sx={{
          background: view === 'calendar' 
            ? 'linear-gradient(145deg, #1E40AF 0%, #3B82F6 100%)' 
            : 'transparent',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          color: view === 'calendar' ? '#fff' : '#6B7280',
          '&:hover': {
            borderColor: 'rgba(255, 255, 255, 0.2)',
          },
        }}
      >
        Calendar View
      </Button>
    </ButtonGroup>
  );

  const renderNewFormDialog = () => (
    <Dialog 
      open={newFormDialog} 
      onClose={handleCloseNewFormDialog}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          background: 'linear-gradient(145deg, #141414 0%, #0A0A0A 100%)',
          border: '1px solid rgba(255, 255, 255, 0.03)',
          borderRadius: '20px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)',
          overflow: 'hidden',
        }
      }}
    >
      {/* Decorative top header */}
      <Box sx={{ 
        background: 'linear-gradient(90deg, #1E40AF, #3B82F6)',
        height: '8px',
        width: '100%',
      }} />

      {/* Dialog Title with enhanced styling */}
      <DialogTitle sx={{ 
        color: '#fff', 
        borderBottom: '1px solid rgba(255,255,255,0.05)', 
        p: 3,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ 
            bgcolor: 'rgba(255,255,255,0.1)', 
            color: '#3B82F6',
          }}>
            <AssignmentIcon />
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600 }}>
              Submit Maintenance Request
            </Typography>
            <Typography variant="body2" sx={{ color: '#9CA3AF', mt: 0.5 }}>
              Fill out the form below to submit your request
            </Typography>
          </Box>
        </Box>
        <IconButton 
          onClick={handleCloseNewFormDialog}
          sx={{ 
            color: '#6B7280',
            '&:hover': {
              color: '#fff',
              backgroundColor: 'rgba(255,255,255,0.05)'
            }
          }}
        >
          <CancelIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ p: 3 }}>
          {/* Progress indicator */}
          <Box sx={{ mb: 4, px: 2 }}>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              position: 'relative',
              '&::after': {
                content: '""',
                position: 'absolute',
                top: '50%',
                left: '10%',
                right: '10%',
                height: '2px',
                backgroundColor: 'rgba(59, 130, 246, 0.3)',
                transform: 'translateY(-50%)',
                zIndex: 0
              }
            }}>
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                position: 'relative',
                zIndex: 1
              }}>
                <Avatar sx={{ 
                  bgcolor: '#3B82F6',
                  color: '#fff',
                  width: 36,
                  height: 36,
                  mb: 1,
                  fontWeight: 'bold'
                }}>
                  1
                </Avatar>
                <Typography variant="caption" sx={{ color: '#fff' }}>Details</Typography>
              </Box>
              
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                position: 'relative',
                zIndex: 1
              }}>
                <Avatar sx={{ 
                  bgcolor: 'rgba(59, 130, 246, 0.2)',
                  color: '#9CA3AF',
                  width: 36,
                  height: 36,
                  mb: 1,
                  fontWeight: 'bold'
                }}>
                  2
                </Avatar>
                <Typography variant="caption" sx={{ color: '#9CA3AF' }}>Review</Typography>
              </Box>

              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                position: 'relative',
                zIndex: 1
              }}>
                <Avatar sx={{ 
                  bgcolor: 'rgba(59, 130, 246, 0.2)',
                  color: '#9CA3AF',
                  width: 36,
                  height: 36,
                  mb: 1,
                  fontWeight: 'bold'
                }}>
                  3
                </Avatar>
                <Typography variant="caption" sx={{ color: '#9CA3AF' }}>Submit</Typography>
              </Box>
            </Box>
          </Box>
          
          <Stack spacing={4}>
            {/* Student Profile Information */}
            <Paper sx={{ 
              p: 3, 
              bgcolor: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(8px)',
            }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                mb: 2,
                gap: 1.5
              }}>
                <PersonIcon sx={{ color: '#3B82F6' }} />
                <Typography variant="subtitle1" sx={{ color: '#fff', fontWeight: 600 }}>
                  Student Information
                </Typography>
              </Box>
              
              {profileLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                  <CircularProgress size={24} sx={{ color: '#3B82F6' }} />
                </Box>
              ) : profileError ? (
                <Typography color="error" variant="body2">{profileError}</Typography>
              ) : (
                <Grid container spacing={3}>
                  <Grid item xs={12} md={4}>
                    <Stack spacing={1}>
                      <Typography variant="caption" sx={{ color: '#6B7280' }}>
                        Name
                      </Typography>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 1.5,
                        p: 1.5,
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '8px',
                        bgcolor: 'rgba(0,0,0,0.2)'
                      }}>
                        <Avatar 
                          sx={{ 
                            width: 32, 
                            height: 32, 
                            bgcolor: 'rgba(59, 130, 246, 0.2)',
                            color: '#3B82F6',
                            fontSize: '0.8rem',
                            fontWeight: 'bold'
                          }}
                        >
                          {studentProfile.name.charAt(0)}
                        </Avatar>
                        <Typography variant="body2" sx={{ color: '#fff', fontWeight: 500 }}>
                          {studentProfile.name}
                        </Typography>
                      </Box>
                    </Stack>
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    <Stack spacing={1}>
                      <Typography variant="caption" sx={{ color: '#6B7280' }}>
                        Building
                      </Typography>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 1.5,
                        p: 1.5,
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '8px',
                        bgcolor: 'rgba(0,0,0,0.2)'
                      }}>
                        <LocationIcon sx={{ color: '#10B981', fontSize: 20 }} />
                        <Typography variant="body2" sx={{ color: '#fff', fontWeight: 500 }}>
                          {studentProfile.buildingName}
                        </Typography>
                      </Box>
                    </Stack>
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    <Stack spacing={1}>
                      <Typography variant="caption" sx={{ color: '#6B7280' }}>
                        Room Number
                      </Typography>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 1.5,
                        p: 1.5,
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '8px',
                        bgcolor: 'rgba(0,0,0,0.2)'
                      }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M19 9H5V5H19V9Z" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M5 9V19H19V9" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M12 12V16" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <Typography variant="body2" sx={{ color: '#fff', fontWeight: 500 }}>
                          {studentProfile.roomNumber}
                        </Typography>
                      </Box>
                    </Stack>
                  </Grid>
                </Grid>
              )}
            </Paper>

            {/* Form Details Section */}
            <Paper sx={{ 
              p: 3, 
              bgcolor: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(8px)',
            }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                mb: 3,
                gap: 1.5
              }}>
                <AssignmentIcon sx={{ color: '#3B82F6' }} />
                <Typography variant="subtitle1" sx={{ color: '#fff', fontWeight: 600 }}>
                  Request Details
                </Typography>
              </Box>

              <Grid container spacing={3}>
                <Grid item xs={12} md={12}>
                  <Typography variant="caption" sx={{ color: '#6B7280', display: 'block', mb: 1, ml: 1 }}>
                    Request Title*
                  </Typography>
                  <TextField
                    placeholder="e.g., Bathroom Sink Leak"
                    value={newForm.title}
                    onChange={(e) => setNewForm({ ...newForm, title: e.target.value })}
                    fullWidth
                    variant="outlined"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <TitleIcon sx={{ color: '#6B7280', fontSize: 20 }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{ 
                      '& .MuiOutlinedInput-root': {
                        color: '#fff',
                        bgcolor: 'rgba(0,0,0,0.2)',
                        '& fieldset': {
                          borderColor: 'rgba(255,255,255,0.1)',
                          borderRadius: '10px',
                        },
                        '&:hover fieldset': {
                          borderColor: 'rgba(255,255,255,0.2)',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#3B82F6',
                        },
                      },
                    }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="caption" sx={{ color: '#6B7280', display: 'block', mb: 1, ml: 1 }}>
                    Description*
                  </Typography>
                  <TextField
                    placeholder="Please provide details about your maintenance request..."
                    value={newForm.description}
                    onChange={(e) => setNewForm({ ...newForm, description: e.target.value })}
                    multiline
                    rows={4}
                    fullWidth
                    variant="outlined"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        color: '#fff',
                        bgcolor: 'rgba(0,0,0,0.2)',
                        '& fieldset': {
                          borderColor: 'rgba(255,255,255,0.1)',
                          borderRadius: '10px',
                        },
                        '&:hover fieldset': {
                          borderColor: 'rgba(255,255,255,0.2)',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#3B82F6',
                        },
                      },
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={12}>
                  <Typography variant="caption" sx={{ color: '#6B7280', display: 'block', mb: 1, ml: 1 }}>
                    Request Type*
                  </Typography>
                  <FormControl fullWidth variant="outlined">
                    <Select
                      value={newForm.formType}
                      onChange={(e) => setNewForm({ ...newForm, formType: e.target.value })}
                      displayEmpty
                      IconComponent={props => (
                        <ArrowDropDownIcon {...props} sx={{ color: '#6B7280' }} />
                      )}
                      renderValue={(selected) => {
                        if (!selected) {
                          return <Typography sx={{ color: '#6B7280' }}>Select request type</Typography>;
                        }
                        return selected;
                      }}
                      sx={{ 
                        color: '#fff',
                        bgcolor: 'rgba(0,0,0,0.2)',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(255,255,255,0.1)',
                          borderRadius: '10px',
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(255,255,255,0.2)',
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#3B82F6',
                        },
                      }}
                      MenuProps={{
                        PaperProps: {
                          sx: {
                            bgcolor: '#1F2937',
                            color: '#fff',
                            '& .MuiMenuItem-root': {
                              '&:hover': {
                                bgcolor: 'rgba(59, 130, 246, 0.1)',
                              },
                              '&.Mui-selected': {
                                bgcolor: 'rgba(59, 130, 246, 0.2)',
                                '&:hover': {
                                  bgcolor: 'rgba(59, 130, 246, 0.3)',
                                },
                              },
                            },
                          },
                        },
                      }}
                    >
                      <MenuItem value="Cleaning">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CleaningServicesIcon sx={{ color: '#10B981', fontSize: 20 }} />
                          <Typography>Cleaning</Typography>
                        </Box>
                      </MenuItem>
                      <MenuItem value="Maintenance">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <BuildIcon sx={{ color: '#F59E0B', fontSize: 20 }} />
                          <Typography>Maintenance</Typography>
                        </Box>
                      </MenuItem>
                      <MenuItem value="Repair">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <HandymanIcon sx={{ color: '#EF4444', fontSize: 20 }} />
                          <Typography>Repair</Typography>
                        </Box>
                      </MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Paper>

            {/* Time Range Selection */}
            <Paper sx={{ 
              p: 3, 
              bgcolor: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(8px)',
            }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                mb: 3,
                gap: 1.5
              }}>
                <CalendarMonthIcon sx={{ color: '#3B82F6' }} />
                <Typography variant="subtitle1" sx={{ color: '#fff', fontWeight: 600 }}>
                  Schedule Information
                </Typography>
              </Box>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="caption" sx={{ color: '#6B7280', display: 'block', mb: 1, ml: 1 }}>
                    Start Time*
                  </Typography>
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DateTimePicker
                      label=""
                      value={newForm.preferredStartTime}
                      onChange={(date) => {
                        // When start time changes, update end time to be 1 hour later if it's not set
                        const endTime = newForm.preferredEndTime || new Date(date);
                        if (!newForm.preferredEndTime) {
                          endTime.setHours(endTime.getHours() + 1);
                        }
                        setNewForm({ 
                          ...newForm, 
                          preferredStartTime: date,
                          preferredEndTime: endTime
                        });
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          fullWidth
                          placeholder="Select date and time"
                          InputProps={{
                            ...params.InputProps,
                            startAdornment: (
                              <InputAdornment position="start">
                                <AccessTimeIcon sx={{ color: '#ffffff', fontSize: 20 }} />
                              </InputAdornment>
                            ),
                            sx: {
                              color: 'white',
                              '& .MuiInputAdornment-root': {
                                color: '#6B7280',
                              },
                              '& .MuiTypography-root': {
                                color: '#FFFFFF',
                              },
                              '& input': {
                                color: '#FFFFFF',
                              },
                              '& svg': {
                                color: '#6B7280',
                              },
                            }
                          }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              color: '#FFFFFF',
                              bgcolor: 'rgba(0,0,0,0.2)',
                              '& fieldset': {
                                borderColor: 'rgba(255,255,255,0.1)',
                                borderRadius: '10px',
                              },
                              '&:hover fieldset': {
                                borderColor: 'rgba(255,255,255,0.2)',
                              },
                              '&.Mui-focused fieldset': {
                                borderColor: '#3B82F6',
                              },
                              '& input': {
                                color: '#FFFFFF',
                              },
                              '& .MuiInputAdornment-root .MuiTypography-root': {
                                color: '#FFFFFF',
                              },
                              '& svg': {
                                color: '#6B7280',
                              },
                            },
                            '& .MuiInputLabel-root': {
                              color: '#6B7280',
                            },
                            '& input.MuiInputBase-input': {
                              color: '#FFFFFF',
                            },
                            '& input::placeholder': {
                              color: 'rgba(255, 255, 255, 0.5)',
                              opacity: 1,
                            },
                            '& .MuiFormLabel-root': {
                              color: '#FFFFFF',
                            },
                          }}
                          inputProps={{
                            ...params.inputProps,
                            style: { color: '#FFFFFF' }
                          }}
                        />
                      )}
                      components={{
                        OpenPickerIcon: (props) => <AccessTimeIcon {...props} sx={{ color: '#6B7280' }} />
                      }}
                      PopperProps={{
                        sx: {
                          '& .MuiPaper-root': {
                            bgcolor: '#1F2937',
                            color: '#fff',
                            border: '1px solid rgba(255,255,255,0.1)',
                            '& .MuiTypography-root': {
                              color: '#fff',
                            },
                            '& .MuiPickersDay-root': {
                              color: '#fff',
                              '&.Mui-selected': {
                                bgcolor: '#3B82F6',
                              },
                              '&:hover': {
                                bgcolor: 'rgba(59, 130, 246, 0.2)',
                              },
                            },
                            '& .MuiClockPicker-root': {
                              '& .MuiClockNumber-root': {
                                color: '#fff',
                              },
                              '& .MuiClock-pin': {
                                bgcolor: '#3B82F6',
                              },
                              '& .MuiClockPointer-root': {
                                bgcolor: '#3B82F6',
                                '& .MuiClockPointer-thumb': {
                                  bgcolor: '#3B82F6',
                                  border: '16px solid #3B82F6',
                                },
                              },
                            },
                            '& .MuiButtonBase-root': {
                              color: '#fff',
                              '&.Mui-selected': {
                                color: '#fff',
                              },
                            },
                            '& .MuiIconButton-root': {
                              color: '#9CA3AF',
                            },
                          },
                        },
                      }}
                    />
                  </LocalizationProvider>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="caption" sx={{ color: '#6B7280', display: 'block', mb: 1, ml: 1 }}>
                    End Time*
                  </Typography>
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DateTimePicker
                      label=""
                      value={newForm.preferredEndTime}
                      onChange={(date) => setNewForm({ ...newForm, preferredEndTime: date })}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          fullWidth
                          placeholder="Select date and time"
                          InputProps={{
                            ...params.InputProps,
                            startAdornment: (
                              <InputAdornment position="start">
                                <AccessTimeIcon sx={{ color: '#6B7280', fontSize: 20 }} />
                              </InputAdornment>
                            ),
                            sx: {
                              color: '#FFFFFF',
                              '& .MuiInputAdornment-root': {
                                color: '#6B7280',
                              },
                              '& .MuiTypography-root': {
                                color: '#FFFFFF',
                              },
                              '& input': {
                                color: '#FFFFFF',
                              },
                              '& svg': {
                                color: '#6B7280',
                              },
                            }
                          }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              color: '#FFFFFF',
                              bgcolor: 'rgba(0,0,0,0.2)',
                              '& fieldset': {
                                borderColor: 'rgba(255,255,255,0.1)',
                                borderRadius: '10px',
                              },
                              '&:hover fieldset': {
                                borderColor: 'rgba(255,255,255,0.2)',
                              },
                              '&.Mui-focused fieldset': {
                                borderColor: '#3B82F6',
                              },
                              '& input': {
                                color: '#FFFFFF',
                              },
                              '& .MuiInputAdornment-root .MuiTypography-root': {
                                color: '#FFFFFF',
                              },
                              '& svg': {
                                color: '#6B7280',
                              },
                            },
                            '& .MuiInputLabel-root': {
                              color: '#6B7280',
                            },
                            '& input.MuiInputBase-input': {
                              color: '#FFFFFF',
                            },
                            '& input::placeholder': {
                              color: 'rgba(255, 255, 255, 0.5)',
                              opacity: 1,
                            },
                            '& .MuiFormLabel-root': {
                              color: '#FFFFFF',
                            },
                          }}
                          inputProps={{
                            ...params.inputProps,
                            style: { color: '#FFFFFF' }
                          }}
                        />
                      )}
                      components={{
                        OpenPickerIcon: (props) => <AccessTimeIcon {...props} sx={{ color: '#6B7280' }} />
                      }}
                      PopperProps={{
                        sx: {
                          '& .MuiPaper-root': {
                            bgcolor: '#1F2937',
                            color: '#fff',
                            border: '1px solid rgba(255,255,255,0.1)',
                            '& .MuiTypography-root': {
                              color: '#fff',
                            },
                            '& .MuiPickersDay-root': {
                              color: '#fff',
                              '&.Mui-selected': {
                                bgcolor: '#3B82F6',
                              },
                              '&:hover': {
                                bgcolor: 'rgba(59, 130, 246, 0.2)',
                              },
                            },
                            '& .MuiClockPicker-root': {
                              '& .MuiClockNumber-root': {
                                color: '#fff',
                              },
                              '& .MuiClock-pin': {
                                bgcolor: '#3B82F6',
                              },
                              '& .MuiClockPointer-root': {
                                bgcolor: '#3B82F6',
                                '& .MuiClockPointer-thumb': {
                                  bgcolor: '#3B82F6',
                                  border: '16px solid #3B82F6',
                                },
                              },
                            },
                            '& .MuiButtonBase-root': {
                              color: '#fff',
                              '&.Mui-selected': {
                                color: '#fff',
                              },
                            },
                            '& .MuiIconButton-root': {
                              color: '#9CA3AF',
                            },
                          },
                        },
                      }}
                    />
                  </LocalizationProvider>
                </Grid>
                
                {/* Duration display */}
                {newForm.preferredStartTime && newForm.preferredEndTime && (
                  <Grid item xs={12}>
                    <Box sx={{ 
                      p: 2, 
                      bgcolor: 'rgba(59, 130, 246, 0.1)', 
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5
                    }}>
                      <InfoIcon sx={{ color: '#3B82F6' }} />
                      <Typography variant="body2" sx={{ color: '#9CA3AF' }}>
                        Duration: {((newForm.preferredEndTime - newForm.preferredStartTime) / (1000 * 60 * 60)).toFixed(1)} hours
                      </Typography>
                    </Box>
                  </Grid>
                )}
              </Grid>
            </Paper>

            {/* File Attachments Section */}
            <Paper sx={{ 
              p: 3, 
              bgcolor: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(8px)',
            }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                mb: 3,
                gap: 1.5
              }}>
                <AttachFileIcon sx={{ color: '#3B82F6' }} />
                <Typography variant="subtitle1" sx={{ color: '#fff', fontWeight: 600 }}>
                  Attachments
                </Typography>
              </Box>
              
              {/* File drop zone */}
              <Box sx={{ 
                border: '2px dashed rgba(59, 130, 246, 0.3)', 
                borderRadius: '12px',
                p: 4,
                textAlign: 'center',
                bgcolor: 'rgba(59, 130, 246, 0.05)',
                transition: 'all 0.2s ease',
                '&:hover': {
                  borderColor: 'rgba(59, 130, 246, 0.5)',
                  bgcolor: 'rgba(59, 130, 246, 0.08)',
                }
              }}>
                <input
                  type="file"
                  id="file-upload"
                  multiple
                  hidden
                  onChange={(e) => {
                    const files = Array.from(e.target.files);
                    setNewForm({ ...newForm, attachments: files });
                  }}
                />
                <label htmlFor="file-upload">
                  <Box sx={{ cursor: 'pointer' }}>
                    <CloudUploadIcon sx={{ color: '#3B82F6', fontSize: 48, mb: 2 }} />
                    <Typography variant="body1" sx={{ color: '#fff', fontWeight: 500, mb: 1 }}>
                      Upload Files
                    </Typography>
                    <Typography variant="caption" sx={{ display: 'block', color: '#6B7280' }}>
                      Drag and drop files here or click to browse
                    </Typography>
                    <Typography variant="caption" sx={{ display: 'block', color: '#6B7280', mt: 0.5 }}>
                      Supported formats: JPG, PNG, PDF (Max 10MB)
                    </Typography>
                  </Box>
                </label>
              </Box>
              
              {/* File list */}
              {newForm.attachments.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="body2" sx={{ color: '#9CA3AF', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FolderOpenIcon sx={{ fontSize: 20 }} />
                    {newForm.attachments.length} file(s) selected
                  </Typography>
                  <List 
                    dense 
                    sx={{ 
                      bgcolor: 'rgba(0,0,0,0.2)', 
                      borderRadius: '8px',
                      border: '1px solid rgba(255,255,255,0.05)',
                    }}
                  >
                    {newForm.attachments.map((file, index) => (
                      <ListItem 
                        key={index}
                        secondaryAction={
                          <IconButton 
                            edge="end" 
                            sx={{ color: '#6B7280' }}
                            onClick={() => {
                              const updatedAttachments = [...newForm.attachments];
                              updatedAttachments.splice(index, 1);
                              setNewForm({ ...newForm, attachments: updatedAttachments });
                            }}
                          >
                            <CancelIcon fontSize="small" />
                          </IconButton>
                        }
                      >
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6' }}>
                            <FolderOpenIcon />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText 
                          primary={<Typography noWrap variant="body2" sx={{ color: '#fff' }}>{file.name}</Typography>}
                          secondary={
                            <Typography variant="caption" sx={{ color: '#6B7280' }}>
                              {file.size < 1024 * 1024 
                                ? `${(file.size / 1024).toFixed(1)} KB` 
                                : `${(file.size / (1024 * 1024)).toFixed(1)} MB`}
                            </Typography>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
            </Paper>
          </Stack>
        </Box>
      </DialogContent>

      <DialogActions sx={{ 
        p: 3, 
        borderTop: '1px solid rgba(255,255,255,0.05)',
        justifyContent: 'space-between'
      }}>
        <Button
          onClick={handleCloseNewFormDialog}
          variant="outlined"
          sx={{
            color: '#6B7280',
            borderColor: 'rgba(107, 114, 128, 0.3)',
            '&:hover': {
              borderColor: 'rgba(107, 114, 128, 0.5)',
              backgroundColor: 'rgba(107, 114, 128, 0.05)',
            },
          }}
        >
          Cancel
        </Button>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="contained"
            endIcon={<SendIcon />}
            onClick={handleSubmitForm}
            disabled={!newForm.title || !newForm.formType || !newForm.preferredStartTime || !newForm.preferredEndTime}
            sx={{
              background: 'linear-gradient(145deg, #1E40AF 0%, #3B82F6 100%)',
              color: '#fff',
              px: 3,
              py: 1,
              borderRadius: '8px',
              '&:hover': {
                background: 'linear-gradient(145deg, #1E3A8A 0%, #2563EB 100%)',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
              },
              '&.Mui-disabled': {
                background: 'rgba(59, 130, 246, 0.2)',
                color: 'rgba(255, 255, 255, 0.3)',
              }
            }}
          >
            Submit Request
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );

  // Listen for socket events (form status updates)
  useEffect(() => {
    if (!socket || !isConnected || !userData?._id) return;

    // Join the socket room
    socket.emit('join', userData._id.toString());

    // Listen for new notifications about your forms
    socket.on('newNotification', (notification) => {
      console.log('New notification received in StudentForm:', notification);
      
      // If this is a form status notification, refresh forms
      if (
        notification.type === 'FORM_SUBMITTED' || 
        notification.type === 'FORM_STATUS_CHANGED' ||
        notification.type === 'FORM_ASSIGNED' ||
        notification.type === 'FORM_REJECTED' ||
        notification.type === 'FORM_IN_PROGRESS' ||
        notification.type === 'FORM_COMPLETED' ||
        notification.type === 'FORM_REVIEW_NEEDED'
      ) {
        toast.info(notification.content);
        refreshForms(); // Refresh forms to get updated status
      }
    });

    return () => {
      socket.off('newNotification');
    };
  }, [socket, isConnected, userData]);

  // Add the renderReviewDialog function before the return statement
  const renderReviewDialog = () => {
    return (
      <Dialog
        open={reviewDialog}
        onClose={handleCloseReviewDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            background: 'linear-gradient(145deg, #141414 0%, #0A0A0A 100%)',
            borderRadius: '16px',
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.4)',
          }
        }}
      >
        <DialogTitle sx={{ 
          p: 3,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          borderBottom: '1px solid rgba(255,255,255,0.05)'
        }}>
          <Avatar sx={{ bgcolor: 'rgba(59, 130, 246, 0.1)', color: '#10B981' }}>
            <StarIcon />
          </Avatar>
          <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600 }}>
            Leave a Review
          </Typography>
        </DialogTitle>
        
        <DialogContent sx={{ p: 3 }}>
          <Box sx={{ mb: 3, mt: 1 }}>
            <Typography variant="body1" sx={{ color: '#9CA3AF', mb: 2 }}>
              Please rate your experience with the service provided
            </Typography>
            
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              mb: 3
            }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <IconButton
                  key={star}
                  onClick={() => handleReviewChange('rating', star)}
                  sx={{
                    color: star <= reviewData.rating ? '#F59E0B' : 'rgba(255,255,255,0.2)',
                    '&:hover': {
                      color: '#F59E0B',
                    },
                    transform: star <= reviewData.rating ? 'scale(1.2)' : 'scale(1)',
                    transition: 'transform 0.2s ease-in-out',
                  }}
                >
                  <StarIcon />
                </IconButton>
              ))}
            </Box>
            
            <Typography variant="body2" sx={{ color: '#fff', mb: 1, fontWeight: 500 }}>
              Additional Comments
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              placeholder="Share your thoughts about the service..."
              value={reviewData.comment}
              onChange={(e) => handleReviewChange('comment', e.target.value)}
              variant="outlined"
              sx={{
                background: 'rgba(0,0,0,0.2)',
                borderRadius: '8px',
                '& .MuiOutlinedInput-root': {
                  color: '#fff',
                  '& fieldset': {
                    borderColor: 'rgba(255,255,255,0.1)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(255,255,255,0.2)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#3B82F6',
                  },
                },
              }}
            />
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ p: 3, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <Button 
            onClick={handleCloseReviewDialog}
            sx={{ 
              color: '#9CA3AF',
              '&:hover': {
                background: 'rgba(255,255,255,0.05)',
              },
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={submitReview}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
            sx={{
              background: 'linear-gradient(145deg, #10B981 0%, #059669 100%)',
              '&:hover': {
                background: 'linear-gradient(145deg, #059669 0%, #047857 100%)',
              },
            }}
          >
            Submit Review
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#0E0E0E' }}>
      <StudentSidebar />
      <Box sx={{ flexGrow: 1, p: 3, width: 'calc(100% - 240px)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h4" sx={{ color: '#fff', fontWeight: 700 }}>
            Maintenance Forms
          </Typography>
          <NotificationBell />
        </Box>
        
        {/* Main content */}
        <Card sx={{ 
          bgcolor: '#1A1A1A', 
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
          borderRadius: '16px',
          mb: 3,
          overflow: 'hidden'
        }}>
          {/* View toggle buttons */}
          {renderViewToggle()}
          
          {/* Main content based on view mode */}
          {view === 'calendar' ? renderCalendarView() : renderRecentForms()}
        </Card>
        
        {/* Render the dialogs */}
        {renderNewFormDialog()}
        {selectedForm && renderFormDetailsDialog()}
        {renderReviewDialog()}
      </Box>
    </Box>
  );
};

export default StudentForm;

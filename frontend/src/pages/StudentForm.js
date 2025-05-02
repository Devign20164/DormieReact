import React, { useState, useEffect, useRef } from 'react';
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
  Alert,
  AlertTitle,
  ListItemButton,
  ListItemIcon,
  FormGroup,
  FormControlLabel,
  Checkbox,
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
  Restore as RestoreIcon,
  Close as CloseIcon,
  Description as DescriptionIcon,
  CalendarToday as CalendarTodayIcon,
  Edit as EditIcon,
  Check as CheckCircleSmallIcon,
  Email as EmailIcon,
  Home as HomeIcon,
  Apartment as ApartmentIcon,
  MeetingRoom as MeetingRoomIcon,
  Category as CategoryIcon,
  Lightbulb as LightbulbIcon,
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
  const [view, setView] = useState('calendar');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [openNewFormDialog, setOpenNewFormDialog] = useState(false);
  const [openFormDetailsDialog, setOpenFormDetailsDialog] = useState(false);
  const [openReviewDialog, setOpenReviewDialog] = useState(false);
  const [openRescheduleDialog, setOpenRescheduleDialog] = useState(false);
  const [openConfirmationDialog, setOpenConfirmationDialog] = useState(false);
  const [newForm, setNewForm] = useState({
    title: '',
    description: '',
    formType: 'Select Form Type',
    preferredStartTime: null,
    preferredEndTime: null,
  });
  const [selectedForm, setSelectedForm] = useState(null);
  const [forms, setForms] = useState([]);
  const [calendarForms, setCalendarForms] = useState([]);
  const [studentProfile, setStudentProfile] = useState(mockStudentProfile);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [fileUploadLoading, setFileUploadLoading] = useState(false);
  const [reviewData, setReviewData] = useState({
    rating: 5,
    comment: ''
  });
  const [rescheduleData, setRescheduleData] = useState({
    preferredStartTime: null,
    preferredEndTime: null,
    reason: '',
  });
  const [activeSection, setActiveSection] = useState('schedule');
  const { socket, isConnected } = useSocket();
  const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  const [page, setPage] = useState(1);
  const formsPerPage = 6;
  const [calendarView, setCalendarView] = useState('week');
  const [clickedTimeSlot, setClickedTimeSlot] = useState(null);
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false); // Added loading state
  const [error, setError] = useState(null); // Added error state
  const [formDetailsDialog, setFormDetailsDialog] = useState(false); // Added for dialog control
  const [reviewDialog, setReviewDialog] = useState(false); // Added for review dialog control

  // Add new state variables near the beginning of the component
  const [rescheduleDialog, setRescheduleDialog] = useState(false);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [confirmDialogAction, setConfirmDialogAction] = useState(null);

  // Add global styles for placeholder text
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      /* Limit styles to only the student form by using a unique ID */
      #student-form-container .MuiInputBase-input::placeholder,
      #student-form-container .MuiOutlinedInput-input::placeholder,
      #student-form-container .MuiInputBase-input::-webkit-input-placeholder,
      #student-form-container .MuiOutlinedInput-input::-webkit-input-placeholder,
      #student-form-container .MuiInputBase-input::-moz-placeholder,
      #student-form-container .MuiOutlinedInput-input::-moz-placeholder,
      #student-form-container .MuiInputBase-input:-ms-input-placeholder,
      #student-form-container .MuiOutlinedInput-input:-ms-input-placeholder,
      #student-form-container input::placeholder,
      #student-form-container input::-webkit-input-placeholder,
      #student-form-container input::-moz-placeholder,
      #student-form-container input:-ms-input-placeholder {
        color: #aaaaaa !important;
        -webkit-text-fill-color: #aaaaaa !important;
        opacity: 1 !important;
      }
      
      /* Force override for Material UI inputs in student form */
      #student-form-container .MuiOutlinedInput-root input::placeholder {
        color: #aaaaaa !important;
        -webkit-text-fill-color: #aaaaaa !important;
      }
      
      /* DateTimePicker specific overrides - only in student form */
      #student-form-container .MuiPickersPopper-root .MuiInputBase-input {
        color: white !important;
        -webkit-text-fill-color: white !important;
      }
      
      /* Direct styling for date value display - only in student form */
      #student-form-container .MuiInputBase-input {
        color: white !important;
        -webkit-text-fill-color: white !important;
      }
      
      /* Extra selector for @mui/x-date-pickers - only in student form */
      #student-form-container .MuiInputBase-root .MuiInputBase-input {
        color: white !important;
        -webkit-text-fill-color: white !important;
      }
      
      /* Target the actual date value display - only in student form */
      #student-form-container .MuiPickersDay-root,
      #student-form-container .MuiDateTimePickerToolbar-title,
      #student-form-container .MuiClockPicker-root {
        color: white !important;
        -webkit-text-fill-color: white !important;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Add direct placeholder fix with different contrast for schedule section
  useEffect(() => {
    // Direct DOM manipulation for placeholders
    setTimeout(() => {
      // Target specifically the date time picker inputs within this component
      const dateTimeInputs = document.querySelectorAll('#student-form-container .MuiOutlinedInput-input[placeholder="MM/DD/YYYY hh:mm (a|p)m"]');
      dateTimeInputs.forEach(input => {
        // Apply direct styles to fix placeholder visibility
        if (input && input.style) {
          input.style.color = 'white';
          input.style.backgroundColor = 'rgba(0, 0, 0, 0.4)';
          
          // Get the parent outline element and force the border to be visible
          const outlineParent = input.closest('.MuiOutlinedInput-root');
          if (outlineParent) {
            const outlineElement = outlineParent.querySelector('.MuiOutlinedInput-notchedOutline');
            if (outlineElement) {
              outlineElement.style.borderColor = 'rgba(255, 255, 255, 0.4)';
              outlineElement.style.borderWidth = '1px';
            }
            
            // Find and style the calendar icon (SVG inside InputAdornment)
            const calendarIcon = outlineParent.querySelector('.MuiInputAdornment-root .MuiSvgIcon-root');
            if (calendarIcon) {
              calendarIcon.style.color = 'white';
              calendarIcon.style.fill = 'white';
            }
          }
          
          // Style the label (find the parent TextField and then the label)
          const textFieldParent = input.closest('.MuiTextField-root');
          if (textFieldParent) {
            const label = textFieldParent.querySelector('.MuiInputLabel-root');
            if (label) {
              label.style.color = 'rgba(255, 255, 255, 0.7)';
            }
          }
        }
      });
      
      // Create a style specifically for date picker placeholders
      const datePickerStyle = document.createElement('style');
      datePickerStyle.innerHTML = `
        /* Target date picker placeholders - only in student form */
        #student-form-container .MuiOutlinedInput-input[placeholder="MM/DD/YYYY hh:mm (a|p)m"]::placeholder,
        #student-form-container .MuiOutlinedInput-input[placeholder="MM/DD/YYYY hh:mm (a|p)m"]::-webkit-input-placeholder,
        #student-form-container .MuiOutlinedInput-input[placeholder="MM/DD/YYYY hh:mm (a|p)m"]::-moz-placeholder {
          color: rgba(170, 170, 170, 0.9) !important;
          -webkit-text-fill-color: rgba(170, 170, 170, 0.9) !important;
          opacity: 1 !important;
        }
        
        /* Make borders more visible - only in student form */
        #student-form-container .MuiOutlinedInput-root .MuiOutlinedInput-notchedOutline {
          border-color: rgba(255, 255, 255, 0.4) !important;
          border-width: 1px !important;
        }
        
        /* DateTimePicker focused style - only in student form */
        #student-form-container .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline {
          border-color: #fff !important;
          border-width: 2px !important;
        }
        
        /* Calendar icon color */
        #student-form-container .MuiInputAdornment-root .MuiSvgIcon-root {
          color: white !important;
          fill: white !important;
        }
        
        /* Label color */
        #student-form-container .MuiInputLabel-root {
          color: rgba(255, 255, 255, 0.7) !important;
        }
        
        /* Focused label color */
        #student-form-container .MuiInputLabel-root.Mui-focused {
          color: white !important;
        }
        
        /* Input text color when value exists */
        #student-form-container .MuiOutlinedInput-input {
          color: white !important;
        }
      `;
      document.head.appendChild(datePickerStyle);
      
      return () => {
        document.head.removeChild(datePickerStyle);
      };
    }, 200); // Slightly longer timeout to ensure elements are in the DOM
  }, [newForm.preferredStartTime, newForm.preferredEndTime, activeSection]);

  // Add direct style for DateTimePicker value display
  useEffect(() => {
    // Handle DateTimePicker value display color
    setTimeout(() => {
      // Target the specific input elements that display the date value
      const dateTimeInputs = document.querySelectorAll('.MuiOutlinedInput-input[placeholder="Select date and time"]');
      dateTimeInputs.forEach(input => {
        // Force color directly on the element
        input.style.color = 'white';
        input.style.caretColor = 'white';
        input.style.webkitTextFillColor = 'white';
      });
      
      // Also target any displayed date value (the actual date string)
      const displayedDates = document.querySelectorAll('.MuiInputBase-input');
      displayedDates.forEach(input => {
        if (input.value && (input.value.includes('/') || input.value.includes('-'))) {
          input.style.color = 'white';
          input.style.webkitTextFillColor = 'white';
        }
      });
      
      // Create a style that specifically targets the value text
      const valueStyle = document.createElement('style');
      valueStyle.innerHTML = `
        .MuiOutlinedInput-input {
          color: white !important;
          -webkit-text-fill-color: white !important;
        }
        
        /* Target the specific input when it has a value */
        .MuiInputBase-input[value]:not([value=""]) {
          color: white !important;
          -webkit-text-fill-color: white !important;
        }
        
        /* Target any displayed date values */
        input[value*="/"]:not([value=""]),
        input[value*="-"]:not([value=""]) {
          color: white !important; 
          -webkit-text-fill-color: white !important;
        }
      `;
      document.head.appendChild(valueStyle);
      
      return () => {
        document.head.removeChild(valueStyle);
      };
    }, 100);
  }, [newForm.preferredStartTime, newForm.preferredEndTime]);

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
          buildingName: typeof response.data.room?.building === 'object' 
            ? response.data.room?.building?.name 
            : response.data.room?.building || 'Unassigned',
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
    setOpenNewFormDialog(true);
  };

  const handleCloseNewFormDialog = () => {
    setOpenNewFormDialog(false);
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
    // Clear uploaded files
    setUploadedFiles([]);
  };

  // Add function to handle file selection
  const handleFileSelect = async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    setFileUploadLoading(true);
    
    try {
      // In a real implementation, you would upload these files to your server or cloud storage
      // and get back URLs. For this example, we'll create mock file objects.
      const newFiles = Array.from(files).map(file => {
        // Create a temporary URL for preview
        const fileUrl = URL.createObjectURL(file);
        
        return {
          fileName: file.name,
          fileType: file.type,
          fileUrl: fileUrl,
          // In a real implementation, you would include the actual URL from your server
          file: file // Keep the original file for upload
        };
      });
      
      setUploadedFiles(prev => [...prev, ...newFiles]);
      
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      
      toast.success(`${files.length} file(s) added`);
    } catch (error) {
      console.error('Error handling files:', error);
      toast.error('Failed to process files');
    } finally {
      setFileUploadLoading(false);
    }
  };

  // Add function to remove a file
  const handleRemoveFile = (index) => {
    setUploadedFiles(prev => {
      const newFiles = [...prev];
      // If there's a temporary URL, revoke it to prevent memory leaks
      if (newFiles[index].fileUrl && newFiles[index].fileUrl.startsWith('blob:')) {
        URL.revokeObjectURL(newFiles[index].fileUrl);
      }
      newFiles.splice(index, 1);
      return newFiles;
    });
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
      
      // Create FormData for file upload
      const formData = new FormData();
      
      // Add form fields to FormData
      formData.append('title', newForm.title);
      formData.append('description', newForm.description);
      formData.append('formType', newForm.formType);
      formData.append('preferredStartTime', newForm.preferredStartTime.toISOString());
      formData.append('endTime', newForm.preferredEndTime.toISOString());
      
      // Add files to FormData
      if (uploadedFiles.length > 0) {
        uploadedFiles.forEach((fileObj, index) => {
          if (fileObj.file) {
            formData.append('files', fileObj.file);
          }
        });
      }

      // Submit form with files to backend API
      const response = await axios.post('/api/students/forms', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
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

  // Add a function to get the appropriate icon based on file type
  const getFileIcon = (fileType) => {
    if (!fileType) return <InsertDriveFileIcon />;
    
    if (fileType.startsWith('image/')) {
      return <ImageIcon />;
    } else if (fileType === 'application/pdf') {
      return <PictureAsPdfIcon />;
    } else if (fileType.includes('word') || fileType.includes('document')) {
      return <DescriptionIcon />;
    } else {
      return <InsertDriveFileIcon />;
    }
  };

  // Add function to handle attachment click
  const handleAttachmentClick = (fileUrl) => {
    try {
      // Create the full URL to the file
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
        
        // Extract filename from fileUrl
        const fileName = fileUrl.split('/').pop();
        link.download = fileName || 'download';
        
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
                    fontSize: '0.75rem'
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
                        <Typography variant="body2" sx={{ color: '#ffff' }}>
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
                      <Box sx={{ 
                        bgcolor: 'rgba(0,0,0,0.2)', 
                        borderRadius: '12px', 
                        mb: 3, 
                        p: 1,
                        border: '1px solid rgba(255,255,255,0.05)'
                      }}>
                        {selectedForm.attachments.map((file, index) => (
                          <Button
                            key={index}
                            variant="text"
                            startIcon={getFileIcon(file.fileType)}
                            onClick={() => handleAttachmentClick(file.fileUrl)}
                            sx={{
                              width: '100%',
                              justifyContent: 'flex-start',
                              p: 1.5,
                              borderRadius: '8px',
                              color: '#fff',
                              textAlign: 'left',
                              transition: 'all 0.2s',
                              '&:hover': {
                                bgcolor: 'rgba(255,255,255,0.05)',
                                transform: 'translateY(-1px)'
                              },
                              mb: index < selectedForm.attachments.length - 1 ? 1 : 0,
                              border: '1px solid rgba(255,255,255,0.05)',
                              background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.2) 0%, rgba(15, 23, 42, 0.2) 100%)',
                            }}
                          >
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', ml: 1, overflow: 'hidden', width: '100%' }}>
                              <Typography
                                variant="body2"
                                sx={{
                                  color: '#fff',
                                  fontWeight: 500,
                                  mb: 0.5,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  width: '100%'
                                }}
                              >
                                {file.fileName}
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
                                <Typography variant="caption" sx={{ color: '#9CA3AF' }}>
                                  {file.fileType || 'Unknown type'}
                                </Typography>
                                <Chip 
                                  icon={<DownloadIcon sx={{ fontSize: '0.875rem !important' }} />}
                                  label="Download"
                                  size="small"
                                  sx={{ 
                                    height: 24, 
                                    bgcolor: 'rgba(59, 130, 246, 0.1)', 
                                    color: '#3B82F6',
                                    '& .MuiChip-label': {
                                      px: 1,
                                      fontSize: '0.6875rem'
                                    },
                                    '& .MuiChip-icon': {
                                      color: '#3B82F6',
                                      ml: 0.5
                                    }
                                  }}
                                />
                              </Box>
                            </Box>
                          </Button>
                        ))}
                      </Box>
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
        
        <DialogActions sx={{ 
          px: 3, 
          py: 2,
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          bgcolor: 'rgba(0, 0, 0, 0.3)',
          justifyContent: 'flex-end'
        }}>
          <Button 
              onClick={handleCloseFormDetails}
              sx={{ 
                color: '#aaa',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.05)',
                  color: '#fff'
                }
              }}
            >
              Close
            </Button>
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
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: 'rgba(0, 0, 0, 0.1)',
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
                        <Typography variant="caption" sx={{ color: statusConfig[form.status]?.color, display: 'block' }}>
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
      <Box sx={{ p: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h5" sx={{ 
            color: '#fff',
            fontWeight: 600,
            textShadow: '0 2px 4px rgba(0,0,0,0.2)'
          }}>
            Recent Submissions
          </Typography>
          <Button
            variant="text"
            endIcon={<KeyboardArrowDownIcon />}
            sx={{ 
              color: '#3B82F6',
              '&:hover': {
                background: 'rgba(59, 130, 246, 0.1)'
              },
              transition: 'all 0.2s ease',
            }}
            onClick={() => setView('list')}
          >
            View All
          </Button>
        </Stack>
        
        <Box
          sx={{
            background: 'linear-gradient(145deg, rgba(26, 26, 26, 0.6) 0%, rgba(20, 20, 20, 0.6) 100%)',
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
              background: 'linear-gradient(90deg, rgba(26, 26, 26, 0.8) 0%, rgba(20, 20, 20, 0.8) 100%)',
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
                  background: 'rgba(255, 255, 255, 0.03)',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
                },
                cursor: 'pointer',
              }}
              onClick={() => handleFormClick(form)}
            >
              {/* Request Details */}
              <Box>
                <Typography variant="body1" sx={{ color: '#fff', fontWeight: 600, mb: 0.5 }}>
                  {form.title}
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: '#9CA3AF', 
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
                    fontWeight: 600,
                    '& .MuiChip-icon': {
                      color: '#fff',
                    },
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                  }}
                />
              </Box>

              {/* Type */}
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ color: '#9CA3AF', fontWeight: 500 }}>
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
                      background: 'linear-gradient(145deg, #1E40AF 0%, #3B82F6 100%)',
                      color: '#fff',
                      boxShadow: '0 2px 8px rgba(59, 130, 246, 0.2)',
                    }}
                  >
                    {form.staff?.name ? form.staff.name.charAt(0) : 'S'}
                  </Avatar>
                  <Typography variant="body2" sx={{ color: '#9CA3AF' }}>
                    Assigned to: <span style={{ color: '#fff', fontWeight: 500 }}>{form.staff?.name || 'Staff Member'}</span> ({form.staff?.role || 'Maintenance Staff'})
                  </Typography>
                </Box>
              )}
            </Box>
          ))}

          {/* Empty State */}
          {!loading && !error && recentForms.length === 0 && (
            <Box sx={{ 
              p: 4, 
              textAlign: 'center',
              background: 'linear-gradient(145deg, rgba(20, 20, 20, 0.4) 0%, rgba(10, 10, 10, 0.4) 100%)',
            }}>
              <Typography variant="body1" sx={{ color: '#6B7280', mb: 2 }}>
                No forms submitted yet
              </Typography>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => handleOpenNewFormDialog()}
                sx={{ 
                  borderColor: 'rgba(59, 130, 246, 0.5)',
                  color: '#3B82F6',
                  '&:hover': {
                    borderColor: '#3B82F6',
                    background: 'rgba(59, 130, 246, 0.1)',
                  },
                }}
              >
                Create New Request
              </Button>
            </Box>
          )}
        </Box>
      </Box>
    );
  };

  const renderViewToggle = () => (
    <ButtonGroup 
      sx={{ 
        m: 3, 
        borderRadius: '12px',
        background: 'rgba(0, 0, 0, 0.2)',
        p: 0.5,
        border: '1px solid rgba(255, 255, 255, 0.03)'
      }}
    >
      <Button
        startIcon={<ListAltIcon />}
        onClick={() => setView('list')}
        variant={view === 'list' ? 'contained' : 'text'}
        sx={{
          background: view === 'list' 
            ? 'linear-gradient(145deg, #1E40AF 0%, #3B82F6 100%)' 
            : 'transparent',
          color: view === 'list' ? '#fff' : '#6B7280',
          borderRadius: '10px',
          '&:hover': {
            background: view === 'list'
              ? 'linear-gradient(145deg, #1E40AF 0%, #3B82F6 100%)'
              : 'rgba(255, 255, 255, 0.05)',
          },
          transition: 'all 0.2s ease',
          px: 3,
          py: 1,
          boxShadow: view === 'list' ? '0 4px 12px rgba(59, 130, 246, 0.3)' : 'none',
        }}
      >
        List View
      </Button>
      <Button
        startIcon={<CalendarMonthIcon />}
        onClick={() => setView('calendar')}
        variant={view === 'calendar' ? 'contained' : 'text'}
        sx={{
          background: view === 'calendar' 
            ? 'linear-gradient(145deg, #1E40AF 0%, #3B82F6 100%)' 
            : 'transparent',
          color: view === 'calendar' ? '#fff' : '#6B7280',
          borderRadius: '10px',
          '&:hover': {
            background: view === 'calendar'
              ? 'linear-gradient(145deg, #1E40AF 0%, #3B82F6 100%)'
              : 'rgba(255, 255, 255, 0.05)',
          },
          transition: 'all 0.2s ease',
          px: 3,
          py: 1,
          boxShadow: view === 'calendar' ? '0 4px 12px rgba(59, 130, 246, 0.3)' : 'none',
        }}
      >
        Calendar View
      </Button>
    </ButtonGroup>
  );

  const renderNewFormDialog = () => (
    <Dialog 
      open={openNewFormDialog}
      onClose={handleCloseNewFormDialog}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          background: 'linear-gradient(145deg, #0A0A0A 0%, #141414 100%)',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.5)',
          border: '1px solid rgba(99, 102, 241, 0.1)',
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
        }
      }}
    >
      {/* Dialog title section */}
      <DialogTitle sx={{ 
        p: 3, 
        borderBottom: '1px solid rgba(99, 102, 241, 0.15)',
        background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.1) 0%, transparent 100%)',
      }}>
        <Typography variant="h6" sx={{ 
          color: '#fff', 
          fontWeight: 600,
          fontSize: '1.1rem'
        }}>
          {clickedTimeSlot ? `New Form - ${format(clickedTimeSlot, 'MMM d, yyyy h:mm a')}` : 'New Form Request'}
            </Typography>
        <IconButton 
          aria-label="close"
          onClick={handleCloseNewFormDialog}
          sx={{ 
            position: 'absolute',
            right: 16,
            top: 16,
            color: '#8B5CF6',
            '&:hover': {
              color: '#fff',
              bgcolor: 'rgba(139, 92, 246, 0.15)'
            }
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      {/* Dialog content section */}
      <DialogContent sx={{ 
        p: 0,
        '&:first-of-type': {
          pt: 0
        }
      }}>
        <Box sx={{ display: 'flex', height: '100%' }}>
          {/* Left sidebar */}
              <Box sx={{ 
            width: 300,
            bgcolor: 'rgba(0, 0, 0, 0.3)',
            borderRight: '1px solid rgba(255, 255, 255, 0.05)',
            py: 3,
            px: 2,
            display: { xs: 'none', md: 'block' }
          }}>
            <Typography variant="h6" sx={{ 
                  color: '#fff',
              fontWeight: 500,
              fontSize: '1rem',
              mb: 3,
              pl: 2
            }}>
              Form Sections
                </Typography>
            
            <List sx={{ mt: 2 }}>
              {[
                { id: 'student', name: 'Student Information', icon: <PersonIcon /> },
                { id: 'schedule', name: 'Schedule Information', icon: <CalendarMonthIcon /> },
                { id: 'details', name: 'Additional Details', icon: <DescriptionIcon /> },
                { id: 'attachments', name: 'Attachments', icon: <AttachFileIcon /> }
              ].map((item) => (
                <ListItem 
                  key={item.id} 
                  disablePadding 
                          sx={{ 
                    mb: 1,
                        borderRadius: '8px',
                    bgcolor: activeSection === item.id ? 'rgba(34, 197, 94, 0.1)' : 'transparent',
                    border: activeSection === item.id ? '1px solid rgba(34, 197, 94, 0.2)' : 'none',
                  }}
                >
                  <ListItemButton 
                    sx={{ 
                      borderRadius: '8px',
                      py: 1.5,
                              '&:hover': {
                        bgcolor: 'rgba(255, 255, 255, 0.05)'
                      }
                    }}
                    onClick={() => setActiveSection(item.id)}
                  >
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      {React.cloneElement(item.icon, { 
                        color: activeSection === item.id ? 'inherit' : 'disabled',
                        sx: { color: activeSection === item.id ? '#22C55E' : '#aaa' } 
                      })}
                    </ListItemIcon>
                    <ListItemText 
                      primary={item.name} 
                          sx={{
                        '& .MuiListItemText-primary': { 
                          color: activeSection === item.id ? '#22C55E' : '#fff',
                          fontWeight: activeSection === item.id ? 600 : 400,
                        } 
                      }} 
                    />
                    {activeSection === item.id && (
                      <CheckCircleSmallIcon sx={{ color: '#22C55E', fontSize: 20 }} />
                    )}
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
                    </Box>
          
          {/* Main content area */}
          <Box sx={{ 
            flex: 1, 
            p: 3,
            overflowY: 'auto',
            maxHeight: '70vh'
          }}>
            {/* Student Information Section */}
            {activeSection === 'student' && (
              <Box sx={{ p: 2 }}>
                <Box sx={{ 
                  mb: 4, 
                  p: 2, 
                  borderLeft: '4px solid #3b82f6',
                  borderRadius: '4px',
                  backgroundColor: 'rgba(59, 130, 246, 0.08)'
                }}>
                  <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600, mb: 1 }}>
                    Student Information
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#aaa' }}>
                    This information is pulled from your student profile
                  </Typography>
                </Box>
                
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Student Name"
                      value={newForm.studentName || ''}
                      InputProps={{
                        readOnly: true,
                        startAdornment: (
                          <InputAdornment position="start">
                            <PersonIcon sx={{ color: 'rgba(255, 255, 255, 0.5)' }} />
                          </InputAdornment>
                        ),
                        sx: {
                          color: '#fff',
                          backgroundColor: 'rgba(0, 0, 0, 0.2)',
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'rgba(255, 255, 255, 0.2)',
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'rgba(255, 255, 255, 0.3)',
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#22C55E',
                          },
                          '& input::placeholder': {
                            color: '#aaaaaa',
                            opacity: 1,
                          },
                          '& .MuiInputLabel-root': {
                            color: '#aaa',
                          },
                        }
                      }}
                      InputLabelProps={{
                        sx: { color: '#aaa' },
                        shrink: true
                      }}
                      sx={{ mb: 3 }}
                      placeholder="Student Name"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Building Name"
                      value={newForm.buildingName || ''}
                      InputProps={{
                        readOnly: true,
                        startAdornment: (
                          <InputAdornment position="start">
                            <ApartmentIcon sx={{ color: 'rgba(255, 255, 255, 0.5)' }} />
                          </InputAdornment>
                        ),
                        sx: {
                          color: '#fff',
                          backgroundColor: 'rgba(0, 0, 0, 0.2)',
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'rgba(255, 255, 255, 0.2)',
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'rgba(255, 255, 255, 0.3)',
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#22C55E',
                          },
                          '& input::placeholder': {
                            color: '#aaaaaa',
                            opacity: 1,
                          },
                          '& .MuiInputLabel-root': {
                            color: '#aaa',
                          },
                        }
                      }}
                      InputLabelProps={{
                        sx: { color: '#aaa' },
                        shrink: true
                      }}
                      sx={{ mb: 3 }}
                      placeholder="Building Name"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Room Number"
                      value={newForm.roomNumber || ''}
                      InputProps={{
                        readOnly: true,
                        startAdornment: (
                          <InputAdornment position="start">
                            <MeetingRoomIcon sx={{ color: 'rgba(255, 255, 255, 0.5)' }} />
                          </InputAdornment>
                        ),
                        sx: {
                          color: '#fff',
                          backgroundColor: 'rgba(0, 0, 0, 0.2)',
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'rgba(255, 255, 255, 0.2)',
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'rgba(255, 255, 255, 0.3)',
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#22C55E',
                          },
                          '& input::placeholder': {
                            color: '#aaaaaa',
                            opacity: 1,
                          },
                          '& .MuiInputLabel-root': {
                            color: '#aaa',
                          },
                        }
                      }}
                      InputLabelProps={{
                        sx: { color: '#aaa' },
                        shrink: true
                      }}
                      sx={{ mb: 3 }}
                      placeholder="Room Number"
                    />
                  </Grid>
                </Grid>
                
                <Box sx={{ 
                  mt: 2, 
                  p: 2, 
                  borderRadius: '8px',
                  backgroundColor: 'rgba(0, 0, 0, 0.2)',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <InfoIcon sx={{ color: 'rgba(255, 255, 255, 0.6)', mr: 2 }} />
                  <Typography variant="body2" sx={{ color: '#aaa' }}>
                    If any of your personal information is incorrect, please update your profile in the account settings.
                  </Typography>
                </Box>
              </Box>
            )}

            {/* Schedule Information Section */}
            {activeSection === 'schedule' && (
              <Box sx={{ p: 2 }}>
                <Box sx={{ 
                  mb: 4, 
                  p: 2, 
                  borderLeft: '4px solid #f59e0b',
                  borderRadius: '4px',
                  backgroundColor: 'rgba(245, 158, 11, 0.08)'
                }}>
                  <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600, mb: 1 }}>
                    Schedule Information
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#aaa' }}>
                    Select your preferred date and time for this maintenance request
                  </Typography>
                </Box>

                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" sx={{ 
                      color: '#fff', 
                      mb: 1,
                      fontWeight: 500 
                    }}>
                      Preferred Start Time
                    </Typography>
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                      <DateTimePicker
                        value={newForm.preferredStartTime}
                        onChange={(newValue) => setNewForm({ ...newForm, preferredStartTime: newValue })}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            fullWidth
                            sx={{ mb: 3 }}
                            InputProps={{
                              ...params.InputProps,
                              sx: {
                                color: '#fff',
                                backgroundColor: 'rgba(0, 0, 0, 0.2)',
                                '.MuiInputBase-input': {
                                  color: '#fff !important',
                                },
                                '& .MuiOutlinedInput-notchedOutline': {
                                  borderColor: 'rgba(255, 255, 255, 0.2)',
                                },
                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                  borderColor: 'rgba(255, 255, 255, 0.3)',
                                },
                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                  borderColor: '#22C55E',
                                },
                                '& input::placeholder': {
                                  color: '#aaaaaa',
                                  opacity: 1,
                                },
                                '& .MuiSvgIcon-root': {
                                  color: '#ffffff',
                                },
                              }
                            }}
                            InputLabelProps={{
                              sx: { color: '#aaa' },
                              shrink: true
                            }}
                            placeholder="Select Start Time"
                          />
                        )}
                      />
                    </LocalizationProvider>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" sx={{ 
                      color: '#fff', 
                      mb: 1,
                      fontWeight: 500 
                    }}>
                      Preferred End Time
                    </Typography>
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                      <DateTimePicker
                        value={newForm.preferredEndTime}
                        onChange={(newValue) => setNewForm({ ...newForm, preferredEndTime: newValue })}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            fullWidth
                            sx={{ mb: 3 }}
                            InputProps={{
                              ...params.InputProps,
                              sx: {
                                color: '#fff',
                                backgroundColor: 'rgba(0, 0, 0, 0.2)',
                                '.MuiInputBase-input': {
                                  color: '#fff !important',
                                },
                                '& .MuiOutlinedInput-notchedOutline': {
                                  borderColor: 'rgba(255, 255, 255, 0.2)',
                                },
                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                  borderColor: 'rgba(255, 255, 255, 0.3)',
                                },
                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                  borderColor: '#22C55E',
                                },
                                '& input::placeholder': {
                                  color: '#aaaaaa',
                                  opacity: 1,
                                },
                                '& .MuiSvgIcon-root': {
                                  color: '#ffffff',
                                },
                              }
                            }}
                            InputLabelProps={{
                              sx: { color: '#aaa' },
                              shrink: true
                            }}
                            placeholder="Select End Time"
                          />
                        )}
                      />
                    </LocalizationProvider>
                  </Grid>
                </Grid>
              </Box>
            )}

            {/* Form Details Section */}
            {activeSection === 'details' && (
              <Box sx={{ p: 2 }}>
                <Box sx={{ 
                  mb: 4, 
                  p: 2, 
                  borderLeft: '4px solid #10b981',
                  borderRadius: '4px',
                  backgroundColor: 'rgba(16, 185, 129, 0.08)'
                }}>
                  <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600, mb: 1 }}>
                    Form Details
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#aaa' }}>
                    Provide detailed information about your maintenance request
                  </Typography>
                </Box>
                
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Title"
                      value={newForm.title}
                      onChange={(e) => setNewForm({ ...newForm, title: e.target.value })}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <TitleIcon sx={{ color: 'rgba(255, 255, 255, 0.5)' }} />
                          </InputAdornment>
                        ),
                        sx: {
                          color: '#fff',
                          backgroundColor: 'rgba(0, 0, 0, 0.2)',
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'rgba(255, 255, 255, 0.2)',
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'rgba(255, 255, 255, 0.3)',
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#10b981',
                          },
                          '& input::placeholder': {
                            color: '#aaaaaa',
                            opacity: 1,
                          },
                          '& .MuiInputLabel-root': {
                            color: '#aaa',
                          },
                        }
                      }}
                      InputLabelProps={{
                        sx: { color: '#aaa' },
                        shrink: true
                      }}
                      sx={{ mb: 3 }}
                      placeholder="Enter form title"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth sx={{ mb: 3 }}>
                      <InputLabel sx={{ color: '#aaa' }}>Form Type</InputLabel>
                      <Select
                        value={newForm.formType}
                        onChange={(e) => setNewForm({ ...newForm, formType: e.target.value })}
                        label="Form Type"
                        sx={{
                          color: '#fff',
                          backgroundColor: 'rgba(0, 0, 0, 0.2)',
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'rgba(255, 255, 255, 0.2)',
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'rgba(255, 255, 255, 0.3)',
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#10b981',
                          },
                          '.MuiSvgIcon-root': {
                            color: '#ffffff',
                          }
                        }}
                        MenuProps={{
                          PaperProps: {
                            sx: {
                              bgcolor: '#111',
                              '& .MuiMenuItem-root': {
                                color: '#fff'
                              }
                            }
                          }
                        }}
                        startAdornment={
                          <InputAdornment position="start">
                            <CategoryIcon sx={{ color: 'rgba(255, 255, 255, 0.5)' }} />
                          </InputAdornment>
                        }
                      >
                        <MenuItem value="Select Form Type" sx={{ display: 'flex', alignItems: 'center' }}>
                          Select Form Type
                        </MenuItem>
                        <MenuItem value="Cleaning" sx={{ display: 'flex', alignItems: 'center' }}>
                          <CleaningServicesIcon fontSize="small" sx={{ color: '#10b981', mr: 1 }} />
                          Cleaning
                        </MenuItem>
                        <MenuItem value="Repair" sx={{ display: 'flex', alignItems: 'center' }}>
                          <BuildIcon fontSize="small" sx={{ color: '#f59e0b', mr: 1 }} />
                          Repair
                        </MenuItem>
                        <MenuItem value="Maintenance" sx={{ display: 'flex', alignItems: 'center' }}>
                          <HandymanIcon fontSize="small" sx={{ color: '#3b82f6', mr: 1 }} />
                          Maintenance
                        </MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <Box sx={{ position: 'relative' }}>
                      <TextField
                        fullWidth
                        label="Description"
                        value={newForm.description}
                        onChange={(e) => setNewForm({ ...newForm, description: e.target.value })}
                        multiline
                        rows={5}
                        InputProps={{
                          sx: {
                            color: '#fff',
                            backgroundColor: 'rgba(0, 0, 0, 0.2)',
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: 'rgba(255, 255, 255, 0.2)',
                            },
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: 'rgba(255, 255, 255, 0.3)',
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#10b981',
                            },
                            '& input::placeholder': {
                              color: '#aaaaaa',
                              opacity: 1,
                            },
                            '& .MuiInputLabel-root': {
                              color: '#aaa',
                            },
                          }
                        }}
                        InputLabelProps={{
                          sx: { color: '#aaa' },
                          shrink: true
                        }}
                        sx={{ mb: 3 }}
                        placeholder="Describe your request in detail"
                      />
                      <Box sx={{
                        position: 'absolute',
                        bottom: 32,
                        right: 16,
                        bgcolor: 'rgba(16, 185, 129, 0.1)',
                        p: 0.5,
                        px: 1,
                        borderRadius: 1,
                        border: '1px solid rgba(16, 185, 129, 0.2)'
                      }}>
                        <Typography variant="caption" sx={{ color: '#10b981', fontWeight: 500 }}>
                          {newForm.description?.length || 0} / 500
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
                
                <Box sx={{ 
                  mt: 3,
                  p: 2,
                  borderRadius: '8px',
                  backgroundColor: 'rgba(0, 0, 0, 0.2)',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  display: 'flex',
                  alignItems: 'flex-start'
                }}>
                  <LightbulbIcon sx={{ color: '#10b981', mt: 0.5, mr: 2 }} />
                  <Box>
                    <Typography variant="subtitle2" sx={{ color: '#fff', fontWeight: 600, mb: 0.5 }}>
                      Tips for faster processing:
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#aaa', mb: 1 }}>
                      • Include specific details about the issue location
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#aaa', mb: 1 }}>
                      • Describe when the problem started occurring
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#aaa' }}>
                      • Mention any previous attempts to fix the issue
                    </Typography>
                  </Box>
                </Box>
              </Box>
            )}

            {/* Attachments Section */}
            {activeSection === 'attachments' && (
              <Box>
                <Typography variant="h6" sx={{ color: '#fff', mb: 3 }}>
                  Attachments
                </Typography>
                <Box
                  sx={{
                    border: '2px dashed rgba(255, 255, 255, 0.2)',
                    borderRadius: 2,
                    p: 3,
                    mb: 3,
                    backgroundColor: 'rgba(0, 0, 0, 0.2)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.3)',
                      borderColor: 'rgba(255, 255, 255, 0.3)',
                    }
                  }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    type="file"
                    hidden
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    multiple
                  />
                  <CloudUploadIcon sx={{ fontSize: 48, color: '#aaa', mb: 2 }} />
                  <Typography variant="body1" sx={{ color: '#fff', mb: 1 }}>
                    Drag files here or click to browse
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#aaa' }}>
                    Supported formats: JPG, PNG, PDF, DOC, DOCX
                  </Typography>
                </Box>
                
                {uploadedFiles.length > 0 && (
                  <Box>
                    <Typography variant="subtitle1" sx={{ color: '#fff', mb: 2 }}>
                      Uploaded Files ({uploadedFiles.length})
                    </Typography>
                    <List sx={{ bgcolor: 'rgba(0, 0, 0, 0.2)', borderRadius: 1 }}>
                      {uploadedFiles.map((file, index) => (
                        <ListItem
                          key={index}
                          sx={{
                            borderBottom: index !== uploadedFiles.length - 1 ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
                          }}
                        >
                          <ListItemIcon>
                            {getFileIcon(file.fileType)}
                          </ListItemIcon>
                          <ListItemText
                            primary={file.fileName}
                            primaryTypographyProps={{ sx: { color: '#fff' } }}
                            secondary={`${file.fileType.split('/')[1]?.toUpperCase() || 'File'}`}
                            secondaryTypographyProps={{ sx: { color: '#aaa' } }}
                          />
                          <IconButton
                            edge="end"
                            onClick={() => handleRemoveFile(index)}
                            sx={{ color: '#ff4d4f' }}
                          >
                            <CloseIcon />
                          </IconButton>
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}
              </Box>
            )}
                            </Box>
        </Box>
      </DialogContent>

      {/* Dialog actions section */}
      <DialogActions sx={{ 
        px: 3, 
        py: 2,
        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
        bgcolor: 'rgba(0, 0, 0, 0.3)',
        justifyContent: 'space-between'
      }}>
        <Box>
        <Button 
            onClick={handleCloseNewFormDialog}
            sx={{ 
              color: '#aaa',
              '&:hover': {
                color: '#fff',
                bgcolor: 'rgba(255, 255, 255, 0.05)'
              }
            }}
          >
              Cancel
            </Button>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          {/* Navigation buttons between form sections */}
          {activeSection !== 'student' && (
            <Button
              onClick={() => {
                const sections = ['student', 'schedule', 'details', 'attachments'];
                const currentIndex = sections.indexOf(activeSection);
                if (currentIndex > 0) {
                  setActiveSection(sections[currentIndex - 1]);
                }
              }}
              startIcon={<ArrowBackIcon />}
              sx={{
                color: '#fff',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.1)'
                }
              }}
            >
              Previous
            </Button>
          )}
          
          {activeSection !== 'attachments' && (
            <Button
              onClick={() => {
                const sections = ['student', 'schedule', 'details', 'attachments'];
                const currentIndex = sections.indexOf(activeSection);
                if (currentIndex < sections.length - 1) {
                  setActiveSection(sections[currentIndex + 1]);
                }
              }}
              endIcon={<ChevronRightIcon />}
              sx={{
                color: '#fff',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.1)'
                }
              }}
            >
              Next
            </Button>
          )}
          
          <Button
            onClick={handleSubmitForm}
            disabled={loading || !newForm.title || !newForm.formType || !newForm.description || !newForm.preferredStartTime}
            startIcon={loading ? <CircularProgress size={20} /> : <SendIcon />}
            variant="contained"
            sx={{
              bgcolor: '#22C55E',
              '&:hover': {
                bgcolor: '#16A34A'
              },
              '&.Mui-disabled': {
                bgcolor: 'rgba(34, 197, 94, 0.3)',
                color: 'rgba(255, 255, 255, 0.5)'
              }
            }}
          >
            Submit Form
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
                  '& input::placeholder': {
                    color: '#aaaaaa',
                    opacity: 1,
                  },
                  '& .MuiInputLabel-root': {
                    color: '#aaa',
                  },
                }
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
                color: '#fff',
                bgcolor: 'rgba(255,255,255,0.05)',
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

  // Add a new function to handle opening the reschedule dialog
  const handleOpenRescheduleDialog = () => {
    // Initialize reschedule data with current form data if available
    if (selectedForm) {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      // Format date for input: YYYY-MM-DD
      const formattedDate = tomorrow.toISOString().split('T')[0];
      
      setRescheduleData({
        startDate: formattedDate,
        startTime: '09:00',
        endDate: formattedDate,
        endTime: '10:00',
        description: selectedForm.description || ''
      });
    }
    
    setRescheduleDialog(true);
  };

  // Add a function to handle closing the reschedule dialog
  const handleCloseRescheduleDialog = () => {
    setRescheduleDialog(false);
  };

  // Add a function to handle reschedule input changes
  const handleRescheduleChange = (field, value) => {
    setRescheduleData({
      ...rescheduleData,
      [field]: value
    });
  };

  // Add a function to submit the reschedule request
  const submitReschedule = async () => {
    try {
      setLoading(true);

      if (!selectedForm || !selectedForm._id) {
        toast.error('Cannot identify the form to reschedule');
        setLoading(false);
        return;
      }
      
      // Validate the dates and times
      if (!rescheduleData.startDate || !rescheduleData.startTime || 
          !rescheduleData.endDate || !rescheduleData.endTime) {
        toast.error('Please fill in all date and time fields');
        setLoading(false);
        return;
      }
      
      // Create datetime objects
      const newStartTime = new Date(`${rescheduleData.startDate}T${rescheduleData.startTime}`);
      const newEndTime = new Date(`${rescheduleData.endDate}T${rescheduleData.endTime}`);
      
      // Validate that start time is before end time
      if (newStartTime >= newEndTime) {
        toast.error('Start time must be before end time');
        setLoading(false);
        return;
      }
      
      // Validate that the times are in the future
      if (newStartTime <= new Date()) {
        toast.error('Start time must be in the future');
        setLoading(false);
        return;
      }
      
      // Show confirmation dialog
      setConfirmDialogAction(() => async () => {
        try {
          // Use the dedicated reschedule endpoint
          const response = await axios.put(`/api/students/forms/${selectedForm._id}/reschedule`, {
            preferredStartTime: newStartTime.toISOString(),
            endTime: newEndTime.toISOString(),
            description: rescheduleData.description || selectedForm.description
          }, {
            withCredentials: true
          });
          
          if (response.data) {
            toast.success('Form rescheduled successfully! Original form has been removed.');
            handleCloseRescheduleDialog();
            handleCloseFormDetails();
            
            // Refresh forms to show the new one and remove the old one
            await refreshForms();
          }
        } catch (err) {
          console.error('Error rescheduling form:', err);
          
          if (err.response) {
            if (err.response.data && err.response.data.message) {
              toast.error(`Error: ${err.response.data.message}`);
            } else {
              toast.error('Failed to reschedule form. Please try again.');
            }
          } else {
            toast.error('Network error. Please check your connection and try again.');
          }
        } finally {
          setLoading(false);
          setOpenConfirmDialog(false);
        }
      });
      
      setOpenConfirmDialog(true);
    } catch (err) {
      console.error('Error preparing to reschedule form:', err);
      toast.error('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  const renderRescheduleDialog = () => {
    return (
      <Dialog 
        open={rescheduleDialog} 
        onClose={handleCloseRescheduleDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: '#1E293B',
            color: '#fff',
            borderRadius: '12px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }
        }}
      >
        <DialogTitle sx={{ 
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)', 
          py: 2.5,
          px: 3
        }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5 }}>
              Reschedule Request
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
              Select a new date and time for your request
            </Typography>
          </Box>
          <IconButton
            edge="end"
            color="inherit"
            onClick={handleCloseRescheduleDialog}
            aria-label="close"
            sx={{ color: 'rgba(255, 255, 255, 0.6)' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ pt: 3, pb: 1, px: 3.5 }}>
          {selectedForm && selectedForm.rejectionReason && (
            <Alert 
              severity="info" 
              icon={<InfoIcon />}
              sx={{ 
                mb: 3, 
                borderRadius: '8px',
                bgcolor: 'rgba(255, 255, 255, 0.05)',
                color: 'rgba(255, 255, 255, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.08)'
              }}
            >
              <AlertTitle sx={{ color: '#fff', fontWeight: 600 }}>Rejection Reason</AlertTitle>
              {selectedForm.rejectionReason}
            </Alert>
          )}
          
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" sx={{ mb: 1, color: 'rgba(255, 255, 255, 0.8)' }}>
                Start Date
              </Typography>
              <TextField 
                type="date"
                fullWidth
                value={rescheduleData.startDate}
                onChange={(e) => handleRescheduleChange('startDate', e.target.value)}
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  sx: { 
                    bgcolor: 'rgba(255, 0, 0, 0.2)',
                    borderRadius: '8px',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255, 255, 255, 0.1)'
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255, 255, 255, 0.2)'
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#7C3AED'
                    },
                    color: '#fff',
                    '& input::placeholder': {
                      color: '#aaaaaa',
                      opacity: 1,
                    },
                    '& .MuiInputLabel-root': {
                      color: '#aaa',
                    },
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" sx={{ mb: 1, color: 'rgba(255, 255, 255, 0.8)' }}>
                Start Time
              </Typography>
              <TextField 
                type="time"
                fullWidth
                value={rescheduleData.startTime}
                onChange={(e) => handleRescheduleChange('startTime', e.target.value)}
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  sx: { 
                    bgcolor: 'rgba(0, 0, 0, 0.2)',
                    borderRadius: '8px',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255, 255, 255, 0.1)'
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255, 255, 255, 0.2)'
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#7C3AED'
                    },
                    color: '#fff',
                    '& input::placeholder': {
                      color: '#aaaaaa',
                      opacity: 1,
                    },
                    '& .MuiInputLabel-root': {
                      color: '#aaa',
                    },
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" sx={{ mb: 1, color: 'rgba(255, 255, 255, 0.8)' }}>
                End Date
              </Typography>
              <TextField 
                type="date"
                fullWidth
                value={rescheduleData.endDate}
                onChange={(e) => handleRescheduleChange('endDate', e.target.value)}
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  sx: { 
                    bgcolor: 'rgba(0, 0, 0, 0.2)',
                    borderRadius: '8px',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255, 255, 255, 0.1)'
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255, 255, 255, 0.2)'
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#7C3AED'
                    },
                    color: '#fff',
                    '& input::placeholder': {
                      color: '#aaaaaa',
                      opacity: 1,
                    },
                    '& .MuiInputLabel-root': {
                      color: '#aaa',
                    },
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" sx={{ mb: 1, color: 'rgba(255, 255, 255, 0.8)' }}>
                End Time
              </Typography>
              <TextField 
                type="time"
                fullWidth
                value={rescheduleData.endTime}
                onChange={(e) => handleRescheduleChange('endTime', e.target.value)}
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  sx: { 
                    bgcolor: 'rgba(0, 0, 0, 0.2)',
                    borderRadius: '8px',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255, 255, 255, 0.1)'
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255, 255, 255, 0.2)'
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#7C3AED'
                    },
                    color: '#fff',
                    '& input::placeholder': {
                      color: '#aaaaaa',
                      opacity: 1,
                    },
                    '& .MuiInputLabel-root': {
                      color: '#aaa',
                    },
                  }
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ mb: 1, color: 'rgba(255, 255, 255, 0.8)' }}>
                Updated Description (Optional)
              </Typography>
              <TextField 
                multiline
                rows={4}
                fullWidth
                placeholder="Provide any additional details or updates to your request"
                value={rescheduleData.description || ''}
                onChange={(e) => handleRescheduleChange('description', e.target.value)}
                InputProps={{
                  sx: { 
                    bgcolor: 'rgba(0, 0, 0, 0.2)',
                    borderRadius: '8px',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255, 255, 255, 0.1)'
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255, 255, 255, 0.2)'
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#7C3AED'
                    },
                    color: '#fff',
                    '& input::placeholder': {
                      color: '#aaaaaa',
                      opacity: 1,
                    },
                    '& .MuiInputLabel-root': {
                      color: '#aaa',
                    },
                  }
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        
        <DialogActions sx={{ px: 3.5, py: 2.5, borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
          <Button 
            onClick={handleCloseRescheduleDialog}
            sx={{ 
              color: 'rgba(255, 255, 255, 0.7)',
              '&:hover': {
                color: '#fff',
                bgcolor: 'rgba(255, 255, 255, 0.05)'
              }
            }}
          >
            Cancel
          </Button>
          <Button 
            variant="contained"
            onClick={submitReschedule}
            disabled={loading}
            sx={{
              bgcolor: '#7C3AED',
              '&:hover': {
                bgcolor: '#6D28D9'
              },
              '&.Mui-disabled': {
                bgcolor: 'rgba(124, 58, 237, 0.5)',
                color: 'rgba(255, 255, 255, 0.5)'
              }
            }}
          >
            {loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Reschedule'}
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  // Add confirmation dialog render function
  const renderConfirmationDialog = () => {
    return (
      <Dialog
        open={openConfirmDialog}
        onClose={() => {
          setOpenConfirmDialog(false);
          setLoading(false);
        }}
        PaperProps={{
          sx: {
            bgcolor: '#1E293B',
            color: '#fff',
            borderRadius: '12px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }
        }}
      >
        <DialogTitle sx={{ 
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)', 
          py: 2.5,
          px: 3
        }}>
          Confirm Rescheduling
        </DialogTitle>
        <DialogContent sx={{ py: 3, px: 3 }}>
          <Typography variant="body1">
            This will create a new form with your updated schedule and REMOVE the original form. Continue?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
          <Button 
            onClick={() => {
              setOpenConfirmDialog(false);
              setLoading(false);
            }}
            sx={{ 
              color: 'rgba(255, 255, 255, 0.7)',
              '&:hover': {
                color: '#fff',
                bgcolor: 'rgba(255, 255, 255, 0.05)'
              }
            }}
          >
            Cancel
          </Button>
          <Button 
            variant="contained"
            onClick={() => {
              if (confirmDialogAction) {
                confirmDialogAction();
              }
            }}
            sx={{
              bgcolor: '#7C3AED',
              '&:hover': {
                bgcolor: '#6D28D9'
              }
            }}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    );
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
    }}
    id="student-form-container"
    >
      <StudentSidebar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 4,
          position: 'relative',
          zIndex: 1,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          overflow: 'hidden',
          color: '#fff'
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          mb: 4,
          pb: 3,
          borderBottom: '1px solid rgba(255,255,255,0.03)',
        }}>
          <Typography variant="h4" sx={{ 
            fontWeight: 600, 
            color: '#fff',
            textShadow: '0 2px 4px rgba(0,0,0,0.2)',
          }}>
            Maintenance Forms
          </Typography>
          <NotificationBell userType="student" color="#3B82F6" />
        </Box>
        
        {/* Main content */}
        <Card sx={{ 
          background: 'linear-gradient(145deg, #141414 0%, #0A0A0A 100%)',
          borderRadius: '20px',
          p: 0,
          border: '1px solid rgba(255, 255, 255, 0.03)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
          overflow: 'hidden',
          mb: 3
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
        {renderRescheduleDialog()}
        
        {/* Add the confirmation dialog */}
        {renderConfirmationDialog()}
      </Box>
    </Box>
  );
};

export default StudentForm;

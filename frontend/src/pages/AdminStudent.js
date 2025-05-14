import React, { useState, useEffect, useCallback, useContext } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  Alert,
  Stack,
  Grid,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  CircularProgress,
  useTheme
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Notifications as NotificationsIcon,
  MoreVert as MoreVertIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import AdminSidebar from '../components/AdminSidebar';
import NotificationBell from '../components/NotificationBell';
import DialogContentText from '@mui/material/DialogContentText';
import { ThemeContext } from '../App';

// Add these color constants at the top of the file
const EGGSHELL_WHITE = "#F0EAD6";
const EMERALD_GREEN = "#50C878";
const DARK_EMERALD = "#2E8B57";

const AdminStudent = () => {
  const { mode } = useContext(ThemeContext);
  const theme = useTheme();

  // State for student management
  const [students, setStudents] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    contactInfo: '',
    studentDormNumber: '',
    courseYear: '',
    address: '',
    gender: '',
    fatherName: '',
    fatherContact: '',
    motherName: '',
    motherContact: '',
    parentsAddress: '',
    building: '',
    room: '',
  });

  // State for buildings and rooms
  const [buildings, setBuildings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loadingBuildings, setLoadingBuildings] = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(false);

  // Update validation errors state to include phone number
  const [validationErrors, setValidationErrors] = useState({
    email: '',
    studentDormNumber: '',
    contactInfo: '',
    fatherContact: '',
    motherContact: '',
    building: '',
    room: ''
  });

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Add new state variables for room and building info near other state declarations
  const [studentRoom, setStudentRoom] = useState(null);
  const [studentBuilding, setStudentBuilding] = useState(null);
  const [loadingRoomDetails, setLoadingRoomDetails] = useState(false);

  // Add state for offense history
  const [offenseHistory, setOffenseHistory] = useState([]);
  const [loadingOffenseHistory, setLoadingOffenseHistory] = useState(false);

  // Add state for offense form
  const [offenseDialogOpen, setOffenseDialogOpen] = useState(false);
  const [offenseFormData, setOffenseFormData] = useState({
    offenseReason: '',
    typeOfOffense: '1st Offense'
  });

  // Fetch buildings from API
  const fetchBuildings = useCallback(async () => {
    try {
      setLoadingBuildings(true);
      const response = await fetch('/api/admin/buildings');
      if (!response.ok) {
        throw new Error('Failed to fetch buildings');
      }
      const data = await response.json();
      setBuildings(data);
    } catch (error) {
      console.error('Error fetching buildings:', error);
      showSnackbar('Error fetching buildings', 'error');
    } finally {
      setLoadingBuildings(false);
    }
  }, []);

  // Fetch rooms for a selected building
  const fetchRooms = useCallback(async (buildingId) => {
    if (!buildingId) {
      setRooms([]);
      return;
    }

    try {
      setLoadingRooms(true);
      const response = await fetch(`/api/admin/buildings/${buildingId}/rooms`);
      if (!response.ok) {
        throw new Error('Failed to fetch rooms');
      }
      const data = await response.json();
      // Filter to only include available rooms
      const availableRooms = data.filter(room => room.status === 'Available');
      setRooms(availableRooms);
    } catch (error) {
      console.error('Error fetching rooms:', error);
      showSnackbar('Error fetching rooms', 'error');
    } finally {
      setLoadingRooms(false);
    }
  }, []);

  // Effect to fetch buildings when dialog opens
  useEffect(() => {
    if (openDialog && !editingStudent) {
      fetchBuildings();
    }
  }, [openDialog, editingStudent, fetchBuildings]);

  // Effect to fetch rooms when building is selected
  useEffect(() => {
    if (formData.building) {
      fetchRooms(formData.building);
    } else {
      setRooms([]);
    }
  }, [formData.building, fetchRooms]);

  // CRUD Operations
  const fetchStudents = useCallback(async () => {
    try {
      const response = await fetch('/api/students/');
      if (!response.ok) {
        const text = await response.text();
        console.error('Error response:', text);
        throw new Error('Failed to fetch students');
      }
      const data = await response.json();
      setStudents(data);
    } catch (error) {
      console.error('Fetch error:', error);
      showSnackbar('Error fetching students', 'error');
    }
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const handleCreateStudent = async () => {
    console.log('handleCreateStudent called');
    console.log('Form data:', formData);

    // Reset validation errors
    setValidationErrors({});

    // Required fields validation
    const requiredFields = ['name', 'email', 'contactInfo', 'studentDormNumber', 'courseYear', 'gender', 'building', 'room'];
    const missingFields = requiredFields.filter(field => !formData[field]);
    if (missingFields.length > 0) {
      console.log('Missing fields:', missingFields);
      showSnackbar(`Please fill in all required fields: ${missingFields.join(', ')}`, 'error');
      return;
    }

    // Validate student ID (studentDormNumber)
    if (!/^[a-zA-Z0-9\-]+$/.test(formData.studentDormNumber)) {
      setValidationErrors(prev => ({
        ...prev,
        studentDormNumber: 'Student ID can only contain letters, numbers, and hyphens'
      }));
      return;
    }

    // Validate phone numbers
    if (!/^[0-9]{11}$/.test(formData.contactInfo)) {
      setValidationErrors(prev => ({
        ...prev,
        contactInfo: 'Phone number must be 11 digits'
      }));
      return;
    }

    if (formData.fatherContact && !/^[0-9]{11}$/.test(formData.fatherContact)) {
      setValidationErrors(prev => ({
        ...prev,
        fatherContact: 'Phone number must be 11 digits'
      }));
      return;
    }

    if (formData.motherContact && !/^[0-9]{11}$/.test(formData.motherContact)) {
      setValidationErrors(prev => ({
        ...prev,
        motherContact: 'Phone number must be 11 digits'
      }));
      return;
    }

    try {
      // Get the selected room to determine the dorm number
      const selectedRoom = rooms.find(room => room._id === formData.room);
      if (!selectedRoom) {
        setValidationErrors(prev => ({
          ...prev,
          room: 'Please select a valid room'
        }));
        return;
      }

      // Create student with all validations handled on the server
      const studentData = {
        ...formData,
        // Keep the student's original ID (do not override with room number)
        password: 'Password123' // Set default password
      };

      console.log('Sending student data:', studentData);

      const createResponse = await fetch('/api/students', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(studentData),
      });

      if (!createResponse.ok) {
        const errorData = await createResponse.json();
        console.error('Create student error response:', errorData);
        
        // Handle validation errors from server
        if (errorData.message) {
          if (errorData.message.includes('email')) {
            setValidationErrors(prev => ({ ...prev, email: errorData.message }));
          } else if (errorData.message.includes('Student ID')) {
            setValidationErrors(prev => ({ ...prev, studentDormNumber: errorData.message }));
          } else if (errorData.message.includes('phone')) {
            setValidationErrors(prev => ({ ...prev, contactInfo: errorData.message }));
          } else if (errorData.message.includes('room')) {
            setValidationErrors(prev => ({ ...prev, room: errorData.message }));
          } else {
            showSnackbar(errorData.message, 'error');
          }
          return;
        }
        
        throw new Error(errorData.message || 'Failed to create student');
      }
      
      const result = await createResponse.json();
      console.log('Create student response:', result);

      showSnackbar('Student created successfully', 'success');
      setOpenDialog(false);
      fetchStudents();
      resetForm();
    } catch (error) {
      console.error('Create student error:', error);
      showSnackbar(`Error: ${error.message}`, 'error');
    }
  };

  const handleUpdateStudent = async () => {
    try {
      const response = await fetch(`/api/students/${editingStudent._id}`, {
        method: 'PUT',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Update student error response:', errorData);
        
        // Handle validation errors from server
        if (errorData.message) {
          if (errorData.message.includes('email')) {
            setValidationErrors(prev => ({ ...prev, email: errorData.message }));
          } else if (errorData.message.includes('Student ID')) {
            setValidationErrors(prev => ({ ...prev, studentDormNumber: errorData.message }));
          } else if (errorData.message.includes('phone')) {
            setValidationErrors(prev => ({ ...prev, contactInfo: errorData.message }));
          } else if (errorData.message.includes('room')) {
            setValidationErrors(prev => ({ ...prev, room: errorData.message }));
          } else {
            showSnackbar(errorData.message, 'error');
          }
          return;
        }
        
        throw new Error(errorData.message || 'Failed to update student');
      }

      const result = await response.json();
      console.log('Update student response:', result);
      
      showSnackbar('Student updated successfully', 'success');
      setOpenDialog(false);
      fetchStudents();
      resetForm();
    } catch (error) {
      console.error('Update student error:', error);
      showSnackbar(`Error: ${error.message}`, 'error');
    }
  };

  const handleDeleteClick = (student) => {
    setStudentToDelete(student);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      const response = await fetch(`/api/students/${studentToDelete._id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Remove the deleted student from the list
        setStudents(students.filter(s => s._id !== studentToDelete._id));
        setSnackbar({ open: true, message: 'Student deleted successfully', severity: 'success' });
      } else {
        const data = await response.json();
        setSnackbar({ open: true, message: data.message || 'Error deleting student', severity: 'error' });
      }
    } catch (error) {
      console.error('Delete error:', error);
      setSnackbar({ open: true, message: 'Error deleting student', severity: 'error' });
    } finally {
      setDeleteDialogOpen(false);
      setStudentToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setStudentToDelete(null);
  };

  // UI Handlers
  const handleOpenDialog = (student = null) => {
    if (student) {
      setEditingStudent(student);
      setFormData({ ...student });
    } else {
      setEditingStudent(null);
      resetForm();
    }
    setOpenDialog(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      contactInfo: '',
      studentDormNumber: '',
      courseYear: '',
      address: '',
      gender: '',
      fatherName: '',
      fatherContact: '',
      motherName: '',
      motherContact: '',
      parentsAddress: '',
      building: '',
      room: '',
    });
    setEditingStudent(null);
    setRooms([]);
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  // Add a function to fetch room and building details
  const fetchRoomAndBuildingDetails = useCallback(async (roomId) => {
    if (!roomId) {
      setStudentRoom(null);
      setStudentBuilding(null);
      return;
    }

    // Extract the ID if roomId is an object
    const actualRoomId = typeof roomId === 'object' && roomId !== null ? roomId._id : roomId;
    
    if (!actualRoomId) {
      setStudentRoom(null);
      setStudentBuilding(null);
      return;
    }

    try {
      setLoadingRoomDetails(true);
      // Fetch room details
      const roomResponse = await fetch(`/api/admin/rooms/${actualRoomId}`);
      if (!roomResponse.ok) {
        throw new Error('Failed to fetch room details');
      }
      const roomData = await roomResponse.json();
      setStudentRoom(roomData);

      // Fetch building details using the building ID from the room
      if (roomData.building) {
        const buildingResponse = await fetch(`/api/admin/buildings/${roomData.building}`);
        if (!buildingResponse.ok) {
          throw new Error('Failed to fetch building details');
        }
        const buildingData = await buildingResponse.json();
        setStudentBuilding(buildingData);
      }
    } catch (error) {
      console.error('Error fetching room and building details:', error);
      showSnackbar('Error fetching accommodation details', 'error');
    } finally {
      setLoadingRoomDetails(false);
    }
  }, []);

  // Add useEffect to fetch room and building details when selectedStudent changes
  useEffect(() => {
    if (selectedStudent && selectedStudent.room) {
      fetchRoomAndBuildingDetails(selectedStudent.room);
    } else {
      setStudentRoom(null);
      setStudentBuilding(null);
    }
  }, [selectedStudent, fetchRoomAndBuildingDetails]);

  // Add a function to fetch offense history
  const fetchOffenseHistory = useCallback(async (studentId) => {
    if (!studentId) {
      setOffenseHistory([]);
      return;
    }

    try {
      setLoadingOffenseHistory(true);
      const response = await fetch(`/api/admin/students/${studentId}/offenses`);
      if (!response.ok) {
        throw new Error('Failed to fetch offense history');
      }
      const data = await response.json();
      setOffenseHistory(data);
    } catch (error) {
      console.error('Error fetching offense history:', error);
      showSnackbar('Error fetching offense history', 'error');
    } finally {
      setLoadingOffenseHistory(false);
    }
  }, []);

  // Update handleViewStudent to also fetch offense history
  const handleViewStudent = (student) => {
    setSelectedStudent(student);
    setViewDialogOpen(true);
    if (student.room) {
      fetchRoomAndBuildingDetails(student.room);
    } else {
      setStudentRoom(null);
      setStudentBuilding(null);
    }
    // Fetch offense history
    fetchOffenseHistory(student._id);
  };

  // Handle opening the offense dialog
  const handleOpenOffenseDialog = () => {
    setOffenseFormData({
      offenseReason: '',
      typeOfOffense: '1st Offense'
    });
    setOffenseDialogOpen(true);
  };

  // Handle offense form input changes
  const handleOffenseInputChange = (e) => {
    const { name, value } = e.target;
    setOffenseFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle submitting a new offense
  const handleOffenseSubmit = async () => {
    if (!offenseFormData.offenseReason) {
      showSnackbar('Please enter an offense reason', 'error');
      return;
    }

    try {
      const response = await fetch(`/api/admin/students/${selectedStudent._id}/offenses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(offenseFormData)
      });

      if (!response.ok) {
        throw new Error('Failed to record offense');
      }

      // Refresh offense history
      fetchOffenseHistory(selectedStudent._id);
      setOffenseDialogOpen(false);
      showSnackbar('Offense recorded successfully', 'success');
    } catch (error) {
      console.error('Error recording offense:', error);
      showSnackbar('Failed to record offense', 'error');
    }
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      minHeight: '100vh',
      background: mode === 'dark' 
        ? 'linear-gradient(145deg, #0A0A0A 0%, #141414 100%)'
        : '#FAF5EE',
      color: mode === 'dark' ? '#fff' : '#000',
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

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 4,
          position: 'relative',
          zIndex: 1,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: 'none',
        }}
      >
        {/* Header */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 4,
          pb: 3,
          borderBottom: mode === 'dark' 
            ? '1px solid rgba(255,255,255,0.03)'
            : '1px solid #1D503A',
        }}>
          <Box>
            <Typography variant="h4" sx={{ 
              fontWeight: 600, 
              color: mode === 'dark' ? '#fff' : '#000',
              textShadow: '0 2px 4px rgba(0,0,0,0.2)',
            }}>
              Student Management
            </Typography>
            <Typography variant="body2" sx={{ 
              color: mode === 'dark' ? '#6B7280' : '#1D503A',
              mt: 1 
            }}>
              Manage student information and dormitory assignments.
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            <NotificationBell userType="admin" color="#10B981" />
              <IconButton sx={{ 
                color: '#6B7280',
                transition: 'all 0.3s ease',
                '&:hover': {
                  color: '#10B981',
                  background: 'rgba(16, 185, 129, 0.1)',
                }
              }}>
                <MoreVertIcon />
              </IconButton>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
              sx={{
                background: 'linear-gradient(90deg, #10B981 0%, #059669 100%)',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-1px)',
                  boxShadow: '0 6px 15px rgba(16, 185, 129, 0.3)',
                  background: 'linear-gradient(90deg, #059669 0%, #047857 100%)',
                },
              }}
            >
              Add Student
            </Button>
          </Stack>
        </Box>

        {/* Student Table */}
        <TableContainer 
          component={Paper} 
          sx={{ 
            background: mode === 'dark'
              ? 'linear-gradient(145deg, #141414 0%, #0A0A0A 100%)'
              : '#FAF5EE',
            borderRadius: '20px',
            border: mode === 'dark'
              ? '1px solid rgba(255, 255, 255, 0.03)'
              : '1px solid #1D503A',
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
            overflow: 'hidden',
          }}
        >
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ 
                  color: mode === 'dark' ? '#fff' : '#000',
                  borderBottom: mode === 'dark'
                    ? '1px solid rgba(255,255,255,0.05)'
                    : '1px solid #1D503A',
                  background: mode === 'dark'
                    ? 'linear-gradient(90deg, rgba(16, 185, 129, 0.1) 0%, transparent 100%)'
                    : 'linear-gradient(90deg, rgba(29, 80, 58, 0.1) 0%, transparent 100%)',
                }}>Name</TableCell>
                <TableCell sx={{ 
                  color: mode === 'dark' ? '#fff' : '#000',
                  borderBottom: mode === 'dark'
                    ? '1px solid rgba(255,255,255,0.05)'
                    : '1px solid #1D503A',
                  background: mode === 'dark'
                    ? 'linear-gradient(90deg, rgba(16, 185, 129, 0.1) 0%, transparent 100%)'
                    : 'linear-gradient(90deg, rgba(29, 80, 58, 0.1) 0%, transparent 100%)',
                }}>Email</TableCell>
                <TableCell sx={{ 
                  color: mode === 'dark' ? '#fff' : '#000',
                  borderBottom: mode === 'dark'
                    ? '1px solid rgba(255,255,255,0.05)'
                    : '1px solid #1D503A',
                  background: mode === 'dark'
                    ? 'linear-gradient(90deg, rgba(16, 185, 129, 0.1) 0%, transparent 100%)'
                    : 'linear-gradient(90deg, rgba(29, 80, 58, 0.1) 0%, transparent 100%)',
                }}>Course Year</TableCell>
                <TableCell sx={{ 
                  color: mode === 'dark' ? '#fff' : '#000',
                  borderBottom: mode === 'dark'
                    ? '1px solid rgba(255,255,255,0.05)'
                    : '1px solid #1D503A',
                  background: mode === 'dark'
                    ? 'linear-gradient(90deg, rgba(16, 185, 129, 0.1) 0%, transparent 100%)'
                    : 'linear-gradient(90deg, rgba(29, 80, 58, 0.1) 0%, transparent 100%)',
                }}>Dorm Number</TableCell>
                <TableCell sx={{ 
                  color: mode === 'dark' ? '#fff' : '#000',
                  borderBottom: mode === 'dark'
                    ? '1px solid rgba(255,255,255,0.05)'
                    : '1px solid #1D503A',
                  background: mode === 'dark'
                    ? 'linear-gradient(90deg, rgba(16, 185, 129, 0.1) 0%, transparent 100%)'
                    : 'linear-gradient(90deg, rgba(29, 80, 58, 0.1) 0%, transparent 100%)',
                }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {students.map((student) => (
                <TableRow 
                  key={student._id}
                  sx={{
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      background: mode === 'dark' ? 'rgba(16, 185, 129, 0.05)' : 'rgba(16, 185, 129, 0.02)',
                    },
                  }}
                >
                  <TableCell sx={{ 
                    color: '#D1D5DB',
                    borderBottom: '1px solid rgba(255,255,255,0.03)'
                  }}>{student.name}</TableCell>
                  <TableCell sx={{ 
                    color: '#D1D5DB',
                    borderBottom: '1px solid rgba(255,255,255,0.03)'
                  }}>{student.email}</TableCell>
                  <TableCell sx={{ 
                    color: '#D1D5DB',
                    borderBottom: '1px solid rgba(255,255,255,0.03)'
                  }}>{student.courseYear}</TableCell>
                  <TableCell sx={{ 
                    color: '#D1D5DB',
                    borderBottom: '1px solid rgba(255,255,255,0.03)'
                  }}>{student.studentDormNumber}</TableCell>
                  <TableCell sx={{ 
                    borderBottom: '1px solid rgba(255,255,255,0.03)'
                  }}>
                    <IconButton 
                      onClick={() => handleViewStudent(student)}
                      sx={{ 
                        color: '#3B82F6',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          background: 'rgba(59, 130, 246, 0.1)',
                          transform: 'translateY(-1px)',
                        },
                      }}
                    >
                      <VisibilityIcon />
                    </IconButton>
                    <IconButton 
                      onClick={() => handleOpenDialog(student)} 
                      sx={{ 
                        color: '#10B981',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          background: 'rgba(16, 185, 129, 0.1)',
                          transform: 'translateY(-1px)',
                        },
                      }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton 
                      onClick={() => handleDeleteClick(student)}
                      sx={{ 
                        color: '#EF4444',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          background: 'rgba(239, 68, 68, 0.1)',
                          transform: 'translateY(-1px)',
                        },
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Snackbar for notifications - Moved above Dialog */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          sx={{
            position: 'fixed',
            mt: 7,
            mr: 2,
            zIndex: 9999999, // Higher than Dialog's z-index
          }}
        >
          <Alert
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            severity={snackbar.severity}
            variant="filled"
            elevation={6}
            sx={{ 
              width: '100%',
              minWidth: '300px',
              background: snackbar.severity === 'success' 
                ? 'linear-gradient(90deg, #10B981 0%, #059669 100%)'
                : 'linear-gradient(90deg, #EF4444 0%, #DC2626 100%)',
              color: '#fff',
              '& .MuiAlert-icon': {
                color: '#fff',
              },
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              position: 'relative',
              zIndex: 9999999,
              '& .MuiAlert-action': {
                position: 'relative',
                zIndex: 10000000,
                padding: '0 8px',
                alignSelf: 'center',
              },
              '& .MuiIconButton-root': {
                color: '#fff',
                padding: '4px',
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.1)',
                }
              }
            }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>

        {/* Add/Edit Dialog */}
        <Dialog 
          open={openDialog} 
          onClose={() => setOpenDialog(false)}
          PaperProps={{
            sx: {
              background: 'linear-gradient(145deg, #141414 0%, #0A0A0A 100%)',
              color: '#fff',
              minWidth: '500px',
              maxHeight: '90vh',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.03)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
            },
          }}
        >
          <DialogTitle sx={{ 
            borderBottom: '1px solid rgba(255,255,255,0.03)',
            background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.1) 0%, transparent 100%)',
            color: '#fff',
          }}>
            {editingStudent ? 'Edit Student' : 'Add Student'}
          </DialogTitle>
          <DialogContent 
            sx={{ 
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
                background: 'rgba(16, 185, 129, 0.6)',
                borderRadius: '4px',
                '&:hover': {
                  background: 'rgba(16, 185, 129, 0.8)',
                },
              },
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(16, 185, 129, 0.6) rgba(0, 0, 0, 0.2)',
            }}
          >
            {editingStudent ? (
              // Edit Form
              <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: 'repeat(2, 1fr)', mt: 2 }}>
                <>
                  <TextField
                    name="name"
                    label="Name"
                    value={formData.name}
                    fullWidth
                    InputProps={{
                      readOnly: true,
                    }}
                    sx={{ 
                      '& .MuiOutlinedInput-root': {
                        color: '#9CA3AF',
                        '& fieldset': {
                          borderColor: 'rgba(255,255,255,0.1)',
                        },
                        '&.Mui-disabled': {
                          backgroundColor: 'rgba(255,255,255,0.03)',
                        },
                      },
                      '& .MuiInputLabel-root': {
                        color: '#9CA3AF',
                      },
                    }}
                  />
                  <TextField
                    name="studentDormNumber"
                    label="Dorm Number"
                    value={formData.studentDormNumber}
                    fullWidth
                    InputProps={{
                      readOnly: true,
                    }}
                    sx={{ 
                      '& .MuiOutlinedInput-root': {
                        color: '#9CA3AF',
                        '& fieldset': {
                          borderColor: 'rgba(255,255,255,0.1)',
                        },
                        '&.Mui-disabled': {
                          backgroundColor: 'rgba(255,255,255,0.03)',
                        },
                      },
                      '& .MuiInputLabel-root': {
                        color: '#9CA3AF',
                      },
                    }}
                  />
                  <TextField
                    required
                    name="contactInfo"
                    label="Phone Number"
                    value={formData.contactInfo}
                    onChange={handleInputChange}
                    error={!!validationErrors.contactInfo}
                    helperText={validationErrors.contactInfo}
                    fullWidth
                    sx={{ 
                      '& .MuiOutlinedInput-root': {
                        color: '#fff',
                        '& fieldset': {
                          borderColor: 'rgba(255,255,255,0.1)',
                        },
                        '&:hover fieldset': {
                          borderColor: 'rgba(16, 185, 129, 0.5)',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#10B981',
                        },
                      },
                      '& .MuiInputLabel-root': {
                        color: '#9CA3AF',
                        '&.Mui-focused': {
                          color: '#10B981',
                        },
                      },
                    }}
                  />
                  <TextField
                    required
                    name="email"
                    label="Email"
                    value={formData.email}
                    onChange={handleInputChange}
                    error={!!validationErrors.email}
                    helperText={validationErrors.email}
                    fullWidth
                    sx={{ 
                      '& .MuiOutlinedInput-root': {
                        color: '#fff',
                        '& fieldset': {
                          borderColor: 'rgba(255,255,255,0.1)',
                        },
                        '&:hover fieldset': {
                          borderColor: 'rgba(16, 185, 129, 0.5)',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#10B981',
                        },
                      },
                      '& .MuiInputLabel-root': {
                        color: '#9CA3AF',
                        '&.Mui-focused': {
                          color: '#10B981',
                        },
                      },
                    }}
                  />
                </>
              </Box>
            ) : (
              // Create Form - Improved layout with sections
              <Box sx={{ mt: 2 }}>
                {/* Personal Information Section */}
                <Box mb={3}>
                  <Typography variant="subtitle1" sx={{ 
                    color: mode === 'dark' ? '#10B981' : EMERALD_GREEN, 
                    mb: 2,
                    borderBottom: mode === 'dark'
                      ? '1px solid rgba(16, 185, 129, 0.2)'
                      : `1px solid ${EMERALD_GREEN}`,
                    pb: 1,
                  }}>
                    Personal Information
                  </Typography>
                  <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' } }}>
                    <TextField
                      required
                      name="name"
                      label="Name"
                      value={formData.name}
                      onChange={handleInputChange}
                      fullWidth
                      sx={{ 
                        '& .MuiOutlinedInput-root': {
                          color: mode === 'dark' ? '#fff' : '#000',
                          '& fieldset': {
                            borderColor: mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(29, 80, 58, 0.3)',
                          },
                          '&:hover fieldset': {
                            borderColor: mode === 'dark' ? 'rgba(16, 185, 129, 0.5)' : 'rgba(29, 80, 58, 0.5)',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: mode === 'dark' ? '#10B981' : '#1D503A',
                          },
                        },
                        '& .MuiInputLabel-root': {
                          color: mode === 'dark' ? '#9CA3AF' : '#1D503A',
                          '&.Mui-focused': {
                            color: mode === 'dark' ? '#10B981' : '#1D503A',
                          },
                        },
                      }}
                    />
                    
                    <TextField
                      required
                      name="email"
                      label="Email"
                      value={formData.email}
                      onChange={handleInputChange}
                      error={!!validationErrors.email}
                      helperText={validationErrors.email}
                      fullWidth
                      sx={{ 
                        '& .MuiOutlinedInput-root': {
                          color: mode === 'dark' ? '#fff' : '#000',
                          '& fieldset': {
                            borderColor: mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(29, 80, 58, 0.3)',
                          },
                          '&:hover fieldset': {
                            borderColor: mode === 'dark' ? 'rgba(16, 185, 129, 0.5)' : 'rgba(29, 80, 58, 0.5)',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: mode === 'dark' ? '#10B981' : '#1D503A',
                          },
                        },
                        '& .MuiInputLabel-root': {
                          color: mode === 'dark' ? '#9CA3AF' : '#1D503A',
                          '&.Mui-focused': {
                            color: mode === 'dark' ? '#10B981' : '#1D503A',
                          },
                        },
                        '& .MuiFormHelperText-root': {
                          color: '#EF4444',
                        },
                      }}
                    />
                    <TextField
                      required
                      name="contactInfo"
                      label="Contact Info"
                      value={formData.contactInfo}
                      onChange={handleInputChange}
                      error={!!validationErrors.contactInfo}
                      helperText={validationErrors.contactInfo}
                      fullWidth
                      sx={{ 
                        '& .MuiOutlinedInput-root': {
                          color: mode === 'dark' ? '#fff' : '#000',
                          '& fieldset': {
                            borderColor: mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(29, 80, 58, 0.3)',
                          },
                          '&:hover fieldset': {
                            borderColor: mode === 'dark' ? 'rgba(16, 185, 129, 0.5)' : 'rgba(29, 80, 58, 0.5)',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: mode === 'dark' ? '#10B981' : '#1D503A',
                          },
                        },
                        '& .MuiInputLabel-root': {
                          color: mode === 'dark' ? '#9CA3AF' : '#1D503A',
                          '&.Mui-focused': {
                            color: mode === 'dark' ? '#10B981' : '#1D503A',
                          },
                        },
                        '& .MuiFormHelperText-root': {
                          color: '#EF4444',
                        },
                      }}
                    />
                    <FormControl fullWidth>
                      <InputLabel sx={{ 
                        color: mode === 'dark' ? '#9CA3AF' : DARK_EMERALD,
                        '&.Mui-focused': {
                          color: mode === 'dark' ? '#10B981' : EMERALD_GREEN,
                        },
                      }}>
                        Gender
                      </InputLabel>
                      <Select
                        required
                        name="gender"
                        value={formData.gender}
                        onChange={handleInputChange}
                        sx={{
                          color: mode === 'dark' ? '#fff' : '#000',
                          backgroundColor: mode === 'dark' ? 'transparent' : 'rgba(255, 255, 255, 0.7)',
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: mode === 'dark' ? 'rgba(255,255,255,0.1)' : `rgba(80, 200, 120, 0.3)`,
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: mode === 'dark' ? 'rgba(16, 185, 129, 0.5)' : DARK_EMERALD,
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: mode === 'dark' ? '#10B981' : EMERALD_GREEN,
                          },
                          '& .MuiSvgIcon-root': {
                            color: mode === 'dark' ? '#9CA3AF' : DARK_EMERALD,
                          },
                        }}
                      >
                        <MenuItem value="Male">Male</MenuItem>
                        <MenuItem value="Female">Female</MenuItem>
                      </Select>
                    </FormControl>
                    <TextField
                      name="address"
                      label="Address"
                      value={formData.address}
                      onChange={handleInputChange}
                      fullWidth
                      sx={{ 
                        '& .MuiOutlinedInput-root': {
                          color: '#fff',
                          '& fieldset': {
                            borderColor: 'rgba(255,255,255,0.1)',
                          },
                          '&:hover fieldset': {
                            borderColor: 'rgba(16, 185, 129, 0.5)',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#10B981',
                          },
                        },
                        '& .MuiInputLabel-root': {
                          color: '#9CA3AF',
                          '&.Mui-focused': {
                            color: '#10B981',
                          },
                        },
                      }}
                      multiline
                      rows={2}
                      gridColumn={{ sm: 'span 2' }}
                    />
                  </Box>
                </Box>

                {/* Academic Information Section */}
                <Box mb={3}>
                  <Typography variant="subtitle1" sx={{ 
                    color: mode === 'dark' ? '#10B981' : EMERALD_GREEN, 
                    mb: 2,
                    borderBottom: mode === 'dark'
                      ? '1px solid rgba(16, 185, 129, 0.2)'
                      : `1px solid ${EMERALD_GREEN}`,
                    pb: 1,
                  }}>
                    Academic Information
                  </Typography>
                  <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' } }}>
                    <TextField
                      required
                      name="courseYear"
                      label="Course Year"
                      value={formData.courseYear}
                      onChange={handleInputChange}
                      fullWidth
                      sx={{ 
                        '& .MuiOutlinedInput-root': {
                          color: '#fff',
                          '& fieldset': {
                            borderColor: 'rgba(255,255,255,0.1)',
                          },
                          '&:hover fieldset': {
                            borderColor: 'rgba(16, 185, 129, 0.5)',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#10B981',
                          },
                        },
                        '& .MuiInputLabel-root': {
                          color: '#9CA3AF',
                          '&.Mui-focused': {
                            color: '#10B981',
                          },
                        },
                      }}
                    />
                    <TextField
                      required
                      name="studentDormNumber"
                      label="Student ID"
                      value={formData.studentDormNumber}
                      onChange={handleInputChange}
                      error={!!validationErrors.studentDormNumber}
                      helperText={validationErrors.studentDormNumber}
                      fullWidth
                      sx={{ 
                        '& .MuiOutlinedInput-root': {
                          color: '#fff',
                          '& fieldset': {
                            borderColor: 'rgba(255,255,255,0.1)',
                          },
                          '&:hover fieldset': {
                            borderColor: 'rgba(16, 185, 129, 0.5)',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#10B981',
                          },
                        },
                        '& .MuiInputLabel-root': {
                          color: '#9CA3AF',
                          '&.Mui-focused': {
                            color: '#10B981',
                          },
                        },
                      }}
                    />
                  </Box>
                </Box>

                {/* Dormitory Assignment Section */}
                <Box mb={3}>
                  <Typography variant="subtitle1" sx={{ 
                    color: mode === 'dark' ? '#10B981' : EMERALD_GREEN, 
                    mb: 2,
                    borderBottom: mode === 'dark'
                      ? '1px solid rgba(16, 185, 129, 0.2)'
                      : `1px solid ${EMERALD_GREEN}`,
                    pb: 1,
                  }}>
                    Dormitory Assignment
                  </Typography>
                  <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' } }}>
                    <FormControl fullWidth>
                      <InputLabel sx={{ 
                        color: mode === 'dark' ? '#9CA3AF' : DARK_EMERALD,
                        '&.Mui-focused': {
                          color: mode === 'dark' ? '#10B981' : EMERALD_GREEN,
                        },
                      }}>
                        Building
                      </InputLabel>
                      <Select
                        required
                        name="building"
                        value={formData.building}
                        onChange={handleInputChange}
                        error={!!validationErrors.building}
                        disabled={loadingBuildings}
                        sx={{
                          color: mode === 'dark' ? '#fff' : '#000',
                          backgroundColor: mode === 'dark' ? 'transparent' : 'rgba(255, 255, 255, 0.7)',
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: mode === 'dark' ? 'rgba(255,255,255,0.1)' : `rgba(80, 200, 120, 0.3)`,
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: mode === 'dark' ? 'rgba(16, 185, 129, 0.5)' : DARK_EMERALD,
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: mode === 'dark' ? '#10B981' : EMERALD_GREEN,
                          },
                          '& .MuiSvgIcon-root': {
                            color: mode === 'dark' ? '#9CA3AF' : DARK_EMERALD,
                          },
                        }}
                      >
                        {loadingBuildings ? (
                          <MenuItem disabled>
                            <CircularProgress size={20} />
                          </MenuItem>
                        ) : (
                          buildings.map(building => (
                            <MenuItem 
                              key={building._id} 
                              value={building._id}
                              disabled={building.type !== formData.gender}
                            >
                              {building.name} ({building.type})
                            </MenuItem>
                          ))
                        )}
                        {!loadingBuildings && buildings.length === 0 && (
                          <MenuItem disabled>No buildings available</MenuItem>
                        )}
                      </Select>
                      {validationErrors.building && (
                        <Typography color="error" variant="caption" sx={{ mt: 0.5, ml: 1.5 }}>
                          {validationErrors.building}
                        </Typography>
                      )}
                    </FormControl>
                    <FormControl fullWidth>
                      <InputLabel sx={{ 
                        color: mode === 'dark' ? '#9CA3AF' : DARK_EMERALD,
                        '&.Mui-focused': {
                          color: mode === 'dark' ? '#10B981' : EMERALD_GREEN,
                        },
                      }}>
                        Room
                      </InputLabel>
                      <Select
                        required
                        name="room"
                        value={formData.room}
                        onChange={handleInputChange}
                        error={!!validationErrors.room}
                        disabled={loadingRooms || !formData.building}
                        sx={{
                          color: mode === 'dark' ? '#fff' : '#000',
                          backgroundColor: mode === 'dark' ? 'transparent' : 'rgba(255, 255, 255, 0.7)',
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: mode === 'dark' ? 'rgba(255,255,255,0.1)' : `rgba(80, 200, 120, 0.3)`,
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: mode === 'dark' ? 'rgba(16, 185, 129, 0.5)' : DARK_EMERALD,
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: mode === 'dark' ? '#10B981' : EMERALD_GREEN,
                          },
                          '& .MuiSvgIcon-root': {
                            color: mode === 'dark' ? '#9CA3AF' : DARK_EMERALD,
                          },
                        }}
                      >
                        {loadingRooms ? (
                          <MenuItem disabled>
                            <CircularProgress size={20} />
                          </MenuItem>
                        ) : (
                          rooms.map(room => (
                            <MenuItem key={room._id} value={room._id}>
                              {room.roomNumber} ({room.type === 'Single' ? 'Single Room' : 'Double Room'}) - ${room.price}
                            </MenuItem>
                          ))
                        )}
                        {!loadingRooms && rooms.length === 0 && formData.building && (
                          <MenuItem disabled>No available rooms in this building</MenuItem>
                        )}
                        {!formData.building && (
                          <MenuItem disabled>Select a building first</MenuItem>
                        )}
                      </Select>
                      {validationErrors.room && (
                        <Typography color="error" variant="caption" sx={{ mt: 0.5, ml: 1.5 }}>
                          {validationErrors.room}
                        </Typography>
                      )}
                    </FormControl>
                  </Box>
                </Box>

                {/* Parent Information Section */}
                <Box>
                  <Typography variant="subtitle1" sx={{ 
                    color: mode === 'dark' ? '#10B981' : EMERALD_GREEN, 
                    mb: 2,
                    borderBottom: mode === 'dark'
                      ? '1px solid rgba(16, 185, 129, 0.2)'
                      : `1px solid ${EMERALD_GREEN}`,
                    pb: 1,
                  }}>
                    Parent Information
                  </Typography>
                  <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' } }}>
                    <TextField
                      name="fatherName"
                      label="Father's Name"
                      value={formData.fatherName}
                      onChange={handleInputChange}
                      fullWidth
                      sx={{ 
                        '& .MuiOutlinedInput-root': {
                          color: '#fff',
                          '& fieldset': {
                            borderColor: 'rgba(255,255,255,0.1)',
                          },
                          '&:hover fieldset': {
                            borderColor: 'rgba(16, 185, 129, 0.5)',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#10B981',
                          },
                        },
                        '& .MuiInputLabel-root': {
                          color: '#9CA3AF',
                          '&.Mui-focused': {
                            color: '#10B981',
                          },
                        },
                      }}
                    />
                    <TextField
                      name="fatherContact"
                      label="Father's Contact"
                      value={formData.fatherContact}
                      onChange={handleInputChange}
                      fullWidth
                      sx={{ 
                        '& .MuiOutlinedInput-root': {
                          color: '#fff',
                          '& fieldset': {
                            borderColor: 'rgba(255,255,255,0.1)',
                          },
                          '&:hover fieldset': {
                            borderColor: 'rgba(16, 185, 129, 0.5)',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#10B981',
                          },
                        },
                        '& .MuiInputLabel-root': {
                          color: '#9CA3AF',
                          '&.Mui-focused': {
                            color: '#10B981',
                          },
                        },
                      }}
                    />
                    <TextField
                      name="motherName"
                      label="Mother's Name"
                      value={formData.motherName}
                      onChange={handleInputChange}
                      fullWidth
                      sx={{ 
                        '& .MuiOutlinedInput-root': {
                          color: '#fff',
                          '& fieldset': {
                            borderColor: 'rgba(255,255,255,0.1)',
                          },
                          '&:hover fieldset': {
                            borderColor: 'rgba(16, 185, 129, 0.5)',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#10B981',
                          },
                        },
                        '& .MuiInputLabel-root': {
                          color: '#9CA3AF',
                          '&.Mui-focused': {
                            color: '#10B981',
                          },
                        },
                      }}
                    />
                    <TextField
                      name="motherContact"
                      label="Mother's Contact"
                      value={formData.motherContact}
                      onChange={handleInputChange}
                      fullWidth
                      sx={{ 
                        '& .MuiOutlinedInput-root': {
                          color: '#fff',
                          '& fieldset': {
                            borderColor: 'rgba(255,255,255,0.1)',
                          },
                          '&:hover fieldset': {
                            borderColor: 'rgba(16, 185, 129, 0.5)',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#10B981',
                          },
                        },
                        '& .MuiInputLabel-root': {
                          color: '#9CA3AF',
                          '&.Mui-focused': {
                            color: '#10B981',
                          },
                        },
                      }}
                    />
                    <TextField
                      name="parentsAddress"
                      label="Parents' Address"
                      value={formData.parentsAddress}
                      onChange={handleInputChange}
                      fullWidth
                      sx={{ 
                        '& .MuiOutlinedInput-root': {
                          color: '#fff',
                          '& fieldset': {
                            borderColor: 'rgba(255,255,255,0.1)',
                          },
                          '&:hover fieldset': {
                            borderColor: 'rgba(16, 185, 129, 0.5)',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#10B981',
                          },
                        },
                        '& .MuiInputLabel-root': {
                          color: '#9CA3AF',
                          '&.Mui-focused': {
                            color: '#10B981',
                          },
                        },
                      }}
                      multiline
                      rows={2}
                      gridColumn={{ sm: 'span 2' }}
                    />
                  </Box>
                </Box>
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2, borderTop: mode === 'dark' ? '1px solid rgba(255,255,255,0.03)' : '1px solid #1D503A' }}>
            <Button 
              onClick={() => setOpenDialog(false)} 
              sx={{ 
                color: mode === 'dark' ? '#9CA3AF' : '#1D503A',
                '&:hover': {
                  background: mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(29, 80, 58, 0.1)',
                },
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={editingStudent ? handleUpdateStudent : handleCreateStudent}
              variant="contained"
              sx={{
                background: mode === 'dark'
                  ? 'linear-gradient(90deg, #10B981 0%, #059669 100%)'
                  : 'linear-gradient(90deg, #1D503A 0%, #0F3724 100%)',
                boxShadow: mode === 'dark'
                  ? '0 4px 12px rgba(16, 185, 129, 0.2)'
                  : '0 4px 12px rgba(29, 80, 58, 0.2)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-1px)',
                  boxShadow: mode === 'dark'
                    ? '0 6px 15px rgba(16, 185, 129, 0.3)'
                    : '0 6px 15px rgba(29, 80, 58, 0.3)',
                  background: mode === 'dark'
                    ? 'linear-gradient(90deg, #059669 0%, #047857 100%)'
                    : 'linear-gradient(90deg, #0F3724 0%, #0A2A1C 100%)',
                },
              }}
            >
              {editingStudent ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteDialogOpen}
          onClose={handleDeleteCancel}
          aria-labelledby="delete-dialog-title"
          aria-describedby="delete-dialog-description"
          PaperProps={{
            sx: {
              background: mode === 'dark'
                ? 'linear-gradient(145deg, #141414 0%, #0A0A0A 100%)'
                : '#FAF5EE', // Eggshell white
              color: mode === 'dark' ? '#fff' : '#1D503A', // Dark emerald green text
              borderRadius: '20px',
              border: mode === 'dark'
                ? '1px solid rgba(255, 255, 255, 0.03)'
                : '1px solid #1D503A', // Dark emerald green border
              boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
              minWidth: '400px',
            },
          }}
        >
          <DialogTitle 
            id="delete-dialog-title"
            sx={{ 
              borderBottom: mode === 'dark'
                ? '1px solid rgba(255,255,255,0.03)'
                : '1px solid #1D503A', // Dark emerald green border
              background: mode === 'dark'
                ? 'linear-gradient(90deg, rgba(239, 68, 68, 0.1) 0%, transparent 100%)'
                : 'linear-gradient(90deg, rgba(29, 80, 58, 0.1) 0%, transparent 100%)', // Emerald green gradient
              py: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              color: mode === 'dark' ? '#fff' : '#1D503A', // Dark emerald green text
            }}
          >
            <DeleteIcon sx={{ color: mode === 'dark' ? '#EF4444' : '#1D503A' }} />
            <Box component="span" sx={{ color: mode === 'dark' ? '#fff' : '#1D503A' }}>
              Confirm Delete
            </Box>
          </DialogTitle>
          <DialogContent sx={{ mt: 2 }}>
            <Box sx={{ color: mode === 'dark' ? '#D1D5DB' : '#1D503A', fontSize: '1rem' }}>
              Are you sure you want to delete <Box component="span" sx={{ color: mode === 'dark' ? '#EF4444' : '#1D503A', fontWeight: 500 }}>{studentToDelete?.name}</Box>?
            </Box>
            <Box 
              sx={{ 
                color: mode === 'dark' ? '#9CA3AF' : '#1D503A',
                mt: 1,
                fontSize: '0.875rem'
              }}
            >
              This action cannot be undone.
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2, borderTop: mode === 'dark' ? '1px solid rgba(255,255,255,0.03)' : '1px solid rgba(29, 80, 58, 0.2)' }}>
            <Button 
              onClick={handleDeleteCancel}
              sx={{ 
                color: mode === 'dark' ? '#9CA3AF' : '#1D503A',
                px: 3,
                '&:hover': {
                  background: mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(29, 80, 58, 0.1)',
                },
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleDeleteConfirm}
              variant="contained"
              sx={{
                background: mode === 'dark'
                  ? 'linear-gradient(90deg, #EF4444 0%, #DC2626 100%)'
                  : 'linear-gradient(90deg, #1D503A 0%, #0F3724 100%)',
                color: '#fff',
                px: 3,
                boxShadow: mode === 'dark'
                  ? '0 4px 12px rgba(239, 68, 68, 0.2)'
                  : '0 4px 12px rgba(29, 80, 58, 0.2)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-1px)',
                  boxShadow: mode === 'dark'
                    ? '0 6px 15px rgba(239, 68, 68, 0.3)'
                    : '0 6px 15px rgba(29, 80, 58, 0.3)',
                  background: mode === 'dark'
                    ? 'linear-gradient(90deg, #DC2626 0%, #B91C1C 100%)'
                    : 'linear-gradient(90deg, #0F3724 0%, #0A2A1C 100%)',
                },
              }}
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>

        {/* View Student Dialog */}
        <Dialog
          open={viewDialogOpen}
          onClose={() => setViewDialogOpen(false)}
          PaperProps={{
            sx: {
              background: mode === 'dark'
                ? 'linear-gradient(145deg, #141414 0%, #0A0A0A 100%)'
                : '#FAF5EE', // Eggshell white
              color: mode === 'dark' ? '#fff' : '#1D503A', // Dark emerald green text
              borderRadius: '20px',
              border: mode === 'dark'
                ? '1px solid rgba(255, 255, 255, 0.03)'
                : '1px solid #1D503A', // Dark emerald green border
              boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
              minWidth: '600px',
              maxWidth: '800px',
            },
          }}
        >
          <DialogTitle sx={{ 
            borderBottom: mode === 'dark'
              ? '1px solid rgba(255,255,255,0.03)'
              : '1px solid #1D503A', // Dark emerald green border
            background: mode === 'dark'
              ? 'linear-gradient(90deg, rgba(59, 130, 246, 0.1) 0%, transparent 100%)'
              : 'linear-gradient(90deg, rgba(29, 80, 58, 0.1) 0%, transparent 100%)', // Emerald green gradient
            py: 2,
          }}>
            <Typography variant="h6" sx={{ 
              display: 'flex', 
              alignItems: 'center',
              gap: 1,
              color: mode === 'dark' ? '#fff' : '#1D503A', // Dark emerald green text
            }}>
              <VisibilityIcon sx={{ color: mode === 'dark' ? '#3B82F6' : '#1D503A' }} />
              Student Information
            </Typography>
          </DialogTitle>
          <DialogContent sx={{ mt: 2 }}>
            {selectedStudent && (
              <Box sx={{ display: 'grid', gap: 3 }}>
                {/* Personal Information Section */}
                <Box>
                  <Typography variant="subtitle1" sx={{ 
                    color: mode === 'dark' ? '#3B82F6' : '#1D503A', // Dark emerald green
                    mb: 2,
                    borderBottom: mode === 'dark'
                      ? '1px solid rgba(59, 130, 246, 0.2)'
                      : '1px solid rgba(29, 80, 58, 0.2)', // Emerald green border
                    pb: 1,
                  }}>
                    Personal Information
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" sx={{ color: mode === 'dark' ? '#9CA3AF' : '#1D503A' }}>Name</Typography>
                      <Typography variant="body1" sx={{ color: mode === 'dark' ? '#fff' : '#000' }}>{selectedStudent.name}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" sx={{ color: mode === 'dark' ? '#9CA3AF' : '#1D503A' }}>Email</Typography>
                      <Typography variant="body1" sx={{ color: mode === 'dark' ? '#fff' : '#000' }}>{selectedStudent.email}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" sx={{ color: mode === 'dark' ? '#9CA3AF' : '#1D503A' }}>Contact Info</Typography>
                      <Typography variant="body1" sx={{ color: mode === 'dark' ? '#fff' : '#000' }}>{selectedStudent.contactInfo}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" sx={{ color: mode === 'dark' ? '#9CA3AF' : '#1D503A' }}>Gender</Typography>
                      <Typography variant="body1" sx={{ color: mode === 'dark' ? '#fff' : '#000' }}>{selectedStudent.gender || 'Not specified'}</Typography>
                    </Grid>
                  </Grid>
                </Box>

                {/* Academic Information Section */}
                <Box>
                  <Typography variant="subtitle1" sx={{ 
                    color: mode === 'dark' ? '#3B82F6' : '#1D503A', // Dark emerald green
                    mb: 2,
                    borderBottom: mode === 'dark'
                      ? '1px solid rgba(59, 130, 246, 0.2)'
                      : '1px solid rgba(29, 80, 58, 0.2)', // Emerald green border
                    pb: 1,
                  }}>
                    Academic Information
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" sx={{ color: mode === 'dark' ? '#9CA3AF' : '#1D503A' }}>Course Year</Typography>
                      <Typography variant="body1" sx={{ color: mode === 'dark' ? '#fff' : '#000' }}>{selectedStudent.courseYear}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" sx={{ color: mode === 'dark' ? '#9CA3AF' : '#1D503A' }}>Dorm Number</Typography>
                      <Typography variant="body1" sx={{ color: mode === 'dark' ? '#fff' : '#000' }}>{selectedStudent.studentDormNumber}</Typography>
                    </Grid>
                  </Grid>
                </Box>

                {/* Dormitory Information Section */}
                <Box>
                  <Typography variant="subtitle1" sx={{ 
                    color: mode === 'dark' ? '#3B82F6' : '#1D503A', // Dark emerald green
                    mb: 2,
                    borderBottom: mode === 'dark'
                      ? '1px solid rgba(59, 130, 246, 0.2)'
                      : '1px solid rgba(29, 80, 58, 0.2)', // Emerald green border
                    pb: 1,
                  }}>
                    Dormitory Information
                  </Typography>
                  <Grid container spacing={2}>
                    {/* Building Information */}
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body2" sx={{ 
                          color: mode === 'dark' ? '#9CA3AF' : '#1D503A',
                          fontWeight: 500 
                        }}>Building</Typography>
                        {loadingRoomDetails ? (
                          <CircularProgress size={16} sx={{ color: mode === 'dark' ? '#3B82F6' : '#1D503A', ml: 1 }} />
                        ) : (
                          <Typography variant="body1" sx={{ 
                            color: mode === 'dark' ? '#fff' : '#000',
                            fontWeight: 400
                          }}>
                            {studentBuilding ? studentBuilding.name : 'Not assigned'}
                          </Typography>
                        )}
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" sx={{ 
                          color: mode === 'dark' ? '#9CA3AF' : '#1D503A',
                          fontWeight: 500 
                        }}>Room Number</Typography>
                        {loadingRoomDetails ? (
                          <CircularProgress size={16} sx={{ color: mode === 'dark' ? '#3B82F6' : '#1D503A', ml: 1 }} />
                        ) : (
                          <Typography variant="body1" sx={{ 
                            color: mode === 'dark' ? '#fff' : '#000',
                            fontWeight: 400
                          }}>
                            {studentRoom ? studentRoom.roomNumber : 'Not assigned'}
                          </Typography>
                        )}
                      </Grid>
                      {studentRoom && (
                        <>
                          <Grid item xs={6}>
                            <Typography variant="body2" sx={{ 
                              color: mode === 'dark' ? '#9CA3AF' : '#1D503A',
                              fontWeight: 500 
                            }}>Room Type</Typography>
                            <Typography variant="body1" sx={{ 
                              color: mode === 'dark' ? '#fff' : '#000',
                              fontWeight: 400
                            }}>
                              {studentRoom.type}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2" sx={{ 
                              color: mode === 'dark' ? '#9CA3AF' : '#1D503A',
                              fontWeight: 500 
                            }}>Room Price</Typography>
                            <Typography variant="body1" sx={{ 
                              color: mode === 'dark' ? '#fff' : '#000',
                              fontWeight: 400
                            }}>
                              ${studentRoom.price}
                            </Typography>
                          </Grid>
                        </>
                      )}
                    </Grid>
                  </Grid>
                </Box>

                {/* Offense History Section */}
                <Box>
                  <Typography variant="subtitle1" sx={{ 
                    color: mode === 'dark' ? '#3B82F6' : '#1D503A', // Dark emerald green
                    mb: 2,
                    borderBottom: mode === 'dark'
                      ? '1px solid rgba(59, 130, 246, 0.2)'
                      : '1px solid rgba(29, 80, 58, 0.2)', // Emerald green border
                    pb: 1,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span>Offense History</span>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {loadingOffenseHistory && (
                        <CircularProgress size={16} sx={{ color: '#3B82F6', mr: 1 }} />
                      )}
                      <Button
                        variant="contained"
                        size="small"
                        onClick={handleOpenOffenseDialog}
                        sx={{
                          background: mode === 'dark'
                            ? 'linear-gradient(90deg, #EF4444 0%, #DC2626 100%)'
                            : 'linear-gradient(90deg, #1D503A 0%, #0F3724 100%)',
                          color: '#fff',
                          fontSize: '0.7rem',
                          py: 0.5,
                          px: 1,
                          minWidth: 'auto',
                          boxShadow: mode === 'dark'
                            ? '0 2px 8px rgba(239, 68, 68, 0.2)'
                            : '0 2px 8px rgba(29, 80, 58, 0.2)',
                          '&:hover': {
                            background: mode === 'dark'
                              ? 'linear-gradient(90deg, #DC2626 0%, #B91C1C 100%)'
                              : 'linear-gradient(90deg, #0F3724 0%, #0A2A1C 100%)',
                          },
                        }}
                      >
                        Record Offense
                      </Button>
                    </Box>
                  </Typography>
                  
                  {!loadingOffenseHistory && offenseHistory.length === 0 ? (
                    <Typography variant="body1" sx={{ color: '#9CA3AF', fontStyle: 'italic', textAlign: 'center', py: 2 }}>
                      No offense records found for this student.
                    </Typography>
                  ) : (
                    <TableContainer 
                      component={Paper} 
                      sx={{ 
                        background: mode === 'dark'
                          ? 'linear-gradient(145deg, #161616 0%, #101010 100%)'
                          : '#FAF5EE',
                        borderRadius: '12px',
                        border: mode === 'dark'
                          ? '1px solid rgba(255, 255, 255, 0.03)'
                          : '1px solid #1D503A',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        mb: 2,
                        maxHeight: '200px',
                        overflow: 'auto',
                        '&::-webkit-scrollbar': {
                          width: '8px',
                          height: '8px',
                        },
                        '&::-webkit-scrollbar-track': {
                          background: mode === 'dark' 
                            ? 'rgba(0, 0, 0, 0.2)'
                            : 'rgba(29, 80, 58, 0.1)',
                          borderRadius: '4px',
                        },
                        '&::-webkit-scrollbar-thumb': {
                          background: mode === 'dark'
                            ? 'rgba(59, 130, 246, 0.6)'
                            : 'rgba(29, 80, 58, 0.5)',
                          borderRadius: '4px',
                          '&:hover': {
                            background: mode === 'dark'
                              ? 'rgba(59, 130, 246, 0.8)'
                              : 'rgba(29, 80, 58, 0.7)',
                          },
                        },
                        scrollbarWidth: 'thin',
                        scrollbarColor: mode === 'dark'
                          ? 'rgba(59, 130, 246, 0.6) rgba(0, 0, 0, 0.2)'
                          : 'rgba(29, 80, 58, 0.5) rgba(29, 80, 58, 0.1)',
                      }}
                    >
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ 
                              color: mode === 'dark' ? '#fff' : '#1D503A',
                              borderBottom: mode === 'dark'
                                ? '1px solid rgba(255,255,255,0.05)'
                                : '1px solid rgba(29, 80, 58, 0.2)',
                              background: mode === 'dark'
                                ? 'linear-gradient(90deg, rgba(59, 130, 246, 0.1) 0%, transparent 100%)'
                                : 'linear-gradient(90deg, rgba(29, 80, 58, 0.1) 0%, transparent 100%)',
                              py: 1.5,
                              fontSize: '0.75rem',
                              fontWeight: 'bold'
                            }}>Date</TableCell>
                            <TableCell sx={{ 
                              color: mode === 'dark' ? '#fff' : '#1D503A',
                              borderBottom: mode === 'dark'
                                ? '1px solid rgba(255,255,255,0.05)'
                                : '1px solid rgba(29, 80, 58, 0.2)',
                              background: mode === 'dark'
                                ? 'linear-gradient(90deg, rgba(59, 130, 246, 0.1) 0%, transparent 100%)'
                                : 'linear-gradient(90deg, rgba(29, 80, 58, 0.1) 0%, transparent 100%)',
                              py: 1.5,
                              fontSize: '0.75rem',
                              fontWeight: 'bold'
                            }}>Type</TableCell>
                            <TableCell sx={{ 
                              color: mode === 'dark' ? '#fff' : '#1D503A',
                              borderBottom: mode === 'dark'
                                ? '1px solid rgba(255,255,255,0.05)'
                                : '1px solid rgba(29, 80, 58, 0.2)',
                              background: mode === 'dark'
                                ? 'linear-gradient(90deg, rgba(59, 130, 246, 0.1) 0%, transparent 100%)'
                                : 'linear-gradient(90deg, rgba(29, 80, 58, 0.1) 0%, transparent 100%)',
                              py: 1.5,
                              fontSize: '0.75rem',
                              fontWeight: 'bold'
                            }}>Reason</TableCell>
                            <TableCell sx={{ 
                              color: mode === 'dark' ? '#fff' : '#1D503A',
                              borderBottom: mode === 'dark'
                                ? '1px solid rgba(255,255,255,0.05)'
                                : '1px solid rgba(29, 80, 58, 0.2)',
                              background: mode === 'dark'
                                ? 'linear-gradient(90deg, rgba(59, 130, 246, 0.1) 0%, transparent 100%)'
                                : 'linear-gradient(90deg, rgba(29, 80, 58, 0.1) 0%, transparent 100%)',
                              py: 1.5,
                              fontSize: '0.75rem',
                              fontWeight: 'bold'
                            }}>Recorded By</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {offenseHistory.map((offense) => (
                            <TableRow key={offense._id}>
                              <TableCell sx={{ 
                                color: mode === 'dark' ? '#D1D5DB' : '#1D503A',
                                borderBottom: mode === 'dark'
                                  ? '1px solid rgba(255,255,255,0.03)'
                                  : '1px solid rgba(29, 80, 58, 0.1)',
                                fontSize: '0.75rem'
                              }}>
                                {new Date(offense.dateOfOffense).toLocaleDateString()}
                              </TableCell>
                              <TableCell sx={{ 
                                borderBottom: mode === 'dark'
                                  ? '1px solid rgba(255,255,255,0.03)'
                                  : '1px solid rgba(29, 80, 58, 0.1)',
                                fontSize: '0.75rem'
                              }}>
                                <Box sx={{ 
                                  display: 'inline-block',
                                  px: 1, 
                                  py: 0.5, 
                                  borderRadius: '4px',
                                  fontSize: '0.7rem',
                                  fontWeight: 'medium',
                                  color: 'white',
                                  background: mode === 'dark'
                                    ? offense.typeOfOffense.includes('Major')
                                      ? 'linear-gradient(90deg, #EF4444 0%, #DC2626 100%)'
                                      : offense.typeOfOffense.includes('3rd') || offense.typeOfOffense.includes('4th')
                                        ? 'linear-gradient(90deg, #F59E0B 0%, #D97706 100%)'
                                        : 'linear-gradient(90deg, #3B82F6 0%, #2563EB 100%)'
                                    : 'linear-gradient(90deg, #1D503A 0%, #0F3724 100%)'
                                }}>
                                  {offense.typeOfOffense}
                                </Box>
                              </TableCell>
                              <TableCell sx={{ 
                                color: mode === 'dark' ? '#D1D5DB' : '#1D503A',
                                borderBottom: mode === 'dark'
                                  ? '1px solid rgba(255,255,255,0.03)'
                                  : '1px solid rgba(29, 80, 58, 0.1)',
                                fontSize: '0.75rem'
                              }}>
                                {offense.offenseReason}
                              </TableCell>
                              <TableCell sx={{ 
                                color: mode === 'dark' ? '#D1D5DB' : '#1D503A',
                                borderBottom: mode === 'dark'
                                  ? '1px solid rgba(255,255,255,0.03)'
                                  : '1px solid rgba(29, 80, 58, 0.1)',
                                fontSize: '0.75rem'
                              }}>
                                {offense.recordedByName?.name || 'Admin'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </Box>

                {/* Section Headers */}
                <Typography variant="subtitle1" sx={{ 
                  color: mode === 'dark' ? '#3B82F6' : '#1D503A',
                  mb: 2,
                  borderBottom: mode === 'dark'
                    ? '1px solid rgba(59, 130, 246, 0.2)'
                    : '1px solid rgba(29, 80, 58, 0.2)',
                  pb: 1,
                  fontWeight: 600,
                }}>
                  Offense History
                </Typography>

                {/* Parent Information Section */}
                <Box>
                  <Typography variant="subtitle1" sx={{ 
                    color: mode === 'dark' ? '#3B82F6' : '#1D503A',
                    mb: 2,
                    borderBottom: mode === 'dark'
                      ? '1px solid rgba(59, 130, 246, 0.2)'
                      : '1px solid rgba(29, 80, 58, 0.2)',
                    pb: 1,
                    fontWeight: 600,
                  }}>
                    Parent Information
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" sx={{ color: mode === 'dark' ? '#9CA3AF' : '#1D503A' }}>Father's Name</Typography>
                      <Typography variant="body1" sx={{ color: mode === 'dark' ? '#fff' : '#000' }}>{selectedStudent.fatherName || 'Not specified'}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" sx={{ color: mode === 'dark' ? '#9CA3AF' : '#1D503A' }}>Father's Contact</Typography>
                      <Typography variant="body1" sx={{ color: mode === 'dark' ? '#fff' : '#000' }}>{selectedStudent.fatherContact || 'Not specified'}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" sx={{ color: mode === 'dark' ? '#9CA3AF' : '#1D503A' }}>Mother's Name</Typography>
                      <Typography variant="body1" sx={{ color: mode === 'dark' ? '#fff' : '#000' }}>{selectedStudent.motherName || 'Not specified'}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" sx={{ color: mode === 'dark' ? '#9CA3AF' : '#1D503A' }}>Mother's Contact</Typography>
                      <Typography variant="body1" sx={{ color: mode === 'dark' ? '#fff' : '#000' }}>{selectedStudent.motherContact || 'Not specified'}</Typography>
                    </Grid>
                  </Grid>
                </Box>

                {/* Address Information */}
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <Typography variant="body2" sx={{ 
                          color: mode === 'dark' ? '#9CA3AF' : '#1D503A',
                          fontWeight: 500 
                        }}>Student's Address</Typography>
                        <Typography variant="body1" sx={{ 
                          color: mode === 'dark' ? '#fff' : '#000',
                          fontWeight: 400
                        }}>{selectedStudent.address || 'Not specified'}</Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="body2" sx={{ 
                          color: mode === 'dark' ? '#9CA3AF' : '#1D503A',
                          fontWeight: 500 
                        }}>Parents' Address</Typography>
                        <Typography variant="body1" sx={{ 
                          color: mode === 'dark' ? '#fff' : '#000',
                          fontWeight: 400
                        }}>{selectedStudent.parentsAddress || 'Not specified'}</Typography>
                      </Grid>
                    </Grid>
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2, borderTop: mode === 'dark' ? '1px solid rgba(255,255,255,0.03)' : '1px solid rgba(29, 80, 58, 0.2)' }}>
            <Button 
              onClick={() => setViewDialogOpen(false)}
              variant="contained"
              sx={{
                background: mode === 'dark'
                  ? 'linear-gradient(90deg, #3B82F6 0%, #2563EB 100%)'
                  : 'linear-gradient(90deg, #1D503A 0%, #0F3724 100%)',
                color: '#fff',
                px: 3,
                boxShadow: mode === 'dark'
                  ? '0 4px 12px rgba(59, 130, 246, 0.2)'
                  : '0 4px 12px rgba(29, 80, 58, 0.2)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-1px)',
                  boxShadow: mode === 'dark'
                    ? '0 6px 15px rgba(59, 130, 246, 0.3)'
                    : '0 6px 15px rgba(29, 80, 58, 0.3)',
                  background: mode === 'dark'
                    ? 'linear-gradient(90deg, #2563EB 0%, #1D4ED8 100%)'
                    : 'linear-gradient(90deg, #0F3724 0%, #0A2A1C 100%)',
                },
              }}
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>

        {/* Offense Dialog */}
        <Dialog
          open={offenseDialogOpen}
          onClose={() => setOffenseDialogOpen(false)}
          PaperProps={{
            sx: {
              background: mode === 'dark'
                ? 'linear-gradient(145deg, #141414 0%, #0A0A0A 100%)'
                : '#FAF5EE', // Eggshell white
              color: mode === 'dark' ? '#fff' : '#1D503A', // Dark emerald green text
              borderRadius: '20px',
              border: mode === 'dark'
                ? '1px solid rgba(255, 255, 255, 0.03)'
                : '1px solid #1D503A', // Dark emerald green border
              boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
              minWidth: '400px',
            },
          }}
        >
          <DialogTitle sx={{ 
            borderBottom: mode === 'dark'
              ? '1px solid rgba(255,255,255,0.03)'
              : '1px solid #1D503A', // Dark emerald green border
            background: mode === 'dark'
              ? 'linear-gradient(90deg, rgba(239, 68, 68, 0.1) 0%, transparent 100%)'
              : 'linear-gradient(90deg, rgba(29, 80, 58, 0.1) 0%, transparent 100%)', // Emerald green gradient
            color: mode === 'dark' ? '#fff' : '#1D503A', // Dark emerald green text
          }}>
            Record Offense for {selectedStudent?.name}
          </DialogTitle>
          <DialogContent sx={{ mt: 2 }}>
            <Box sx={{ display: 'grid', gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel sx={{ 
                  color: mode === 'dark' ? '#9CA3AF' : '#1D503A',
                  '&.Mui-focused': {
                    color: mode === 'dark' ? '#EF4444' : '#1D503A',
                  },
                }}>
                  Type of Offense
                </InputLabel>
                <Select
                  name="typeOfOffense"
                  value={offenseFormData.typeOfOffense}
                  onChange={handleOffenseInputChange}
                  sx={{
                    color: mode === 'dark' ? '#fff' : '#000',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(29, 80, 58, 0.5)',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: mode === 'dark' ? 'rgba(239, 68, 68, 0.5)' : 'rgba(29, 80, 58, 0.8)',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: mode === 'dark' ? '#EF4444' : '#1D503A',
                    },
                    '& .MuiSvgIcon-root': {
                      color: mode === 'dark' ? '#9CA3AF' : '#1D503A',
                    },
                  }}
                >
                  <MenuItem value="1st Offense">1st Offense</MenuItem>
                  <MenuItem value="2nd Offense">2nd Offense</MenuItem>
                  <MenuItem value="3rd Offense">3rd Offense</MenuItem>
                  <MenuItem value="4th Offense">4th Offense</MenuItem>
                  <MenuItem value="Minor Offense">Minor Offense</MenuItem>
                  <MenuItem value="Major Offense">Major Offense</MenuItem>
                </Select>
              </FormControl>
              
              <TextField
                fullWidth
                required
                multiline
                rows={3}
                name="offenseReason"
                label="Offense Reason"
                value={offenseFormData.offenseReason}
                onChange={handleOffenseInputChange}
                sx={{ 
                  '& .MuiOutlinedInput-root': {
                    color: mode === 'dark' ? '#fff' : '#000',
                    '& fieldset': {
                      borderColor: mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(29, 80, 58, 0.5)',
                    },
                    '&:hover fieldset': {
                      borderColor: mode === 'dark' ? 'rgba(239, 68, 68, 0.5)' : 'rgba(29, 80, 58, 0.8)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: mode === 'dark' ? '#EF4444' : '#1D503A',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: mode === 'dark' ? '#9CA3AF' : '#1D503A',
                    '&.Mui-focused': {
                      color: mode === 'dark' ? '#EF4444' : '#1D503A',
                    },
                  },
                }}
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2, borderTop: mode === 'dark' ? '1px solid rgba(255,255,255,0.03)' : '1px solid rgba(29, 80, 58, 0.2)' }}>
            <Button 
              onClick={() => setOffenseDialogOpen(false)}
              sx={{ 
                color: mode === 'dark' ? '#9CA3AF' : '#1D503A',
                '&:hover': {
                  background: mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(29, 80, 58, 0.1)',
                },
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleOffenseSubmit}
              sx={{
                background: mode === 'dark' 
                  ? 'linear-gradient(90deg, #EF4444 0%, #DC2626 100%)'
                  : 'linear-gradient(90deg, #1D503A 0%, #0F3724 100%)',
                color: '#fff',
                boxShadow: mode === 'dark'
                  ? '0 4px 12px rgba(239, 68, 68, 0.2)'
                  : '0 4px 12px rgba(29, 80, 58, 0.2)',
                '&:hover': {
                  background: mode === 'dark'
                    ? 'linear-gradient(90deg, #DC2626 0%, #B91C1C 100%)'
                    : 'linear-gradient(90deg, #0F3724 0%, #0A2A1C 100%)',
                },
              }}
            >
              Record Offense
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
};

export default AdminStudent; 
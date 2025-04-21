import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  Stack,
  Paper,
  Avatar,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Notifications as NotificationsIcon,
  CloudUpload as CloudUploadIcon,
  InsertDriveFile as InsertDriveFileIcon,
  Clear as ClearIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Description as DescriptionIcon,
  ReceiptLong as ReceiptLongIcon,
  HourglassTop as HourglassTopIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Payments as PaymentsIcon,
} from '@mui/icons-material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import AdminSidebar from '../components/AdminSidebar';
import NotificationBell from '../components/NotificationBell';

const AdminBill = () => {
  const [students, setStudents] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [bills, setBills] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [openStatusDialog, setOpenStatusDialog] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [formData, setFormData] = useState({
    student: '',
    room: '',
    roomNumber: '',
    rentalFee: '',
    waterFee: '',
    electricityFee: '',
    billingPeriodStart: new Date(),
    dueDate: null,
    notes: '',
    otherFees: [],
    billFile: null,
  });

  // Fetch students, rooms, and bills data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get all students
        const studentsRes = await fetch('/api/admin/students', {
          credentials: 'include'
        });
        const studentsData = await studentsRes.json();
        console.log('Students data:', studentsData);

        // Get all buildings first
        const buildingsRes = await fetch('/api/admin/buildings', {
          credentials: 'include'
        });
        const buildingsData = await buildingsRes.json();

        // Get rooms for each building
        const roomsPromises = buildingsData.map(building => 
          fetch(`/api/admin/buildings/${building._id}/rooms`, {
            credentials: 'include'
          }).then(res => res.json())
        );

        const roomsDataArrays = await Promise.all(roomsPromises);
        // Flatten the array of room arrays
        const roomsData = roomsDataArrays.flat();
        console.log('Rooms data:', roomsData);

        // Get all bills
        const billsRes = await fetch('/api/admin/bills', {
          credentials: 'include'
        });
        const billsData = await billsRes.json();
        console.log('Bills data:', billsData);

        setStudents(studentsData);
        setRooms(roomsData);
        setBills(billsData);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, []);

  // Refresh bills list after creating a new bill
  const refreshBills = async () => {
    try {
      const response = await fetch('/api/admin/bills', {
        credentials: 'include'
      });
      const data = await response.json();
      setBills(data);
    } catch (error) {
      console.error('Error refreshing bills:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'student') {
      // Find the selected student
      const selectedStudent = students.find(student => student._id === value);
      console.log('Selected student:', selectedStudent);
      
      // Check if student has a room (handle different possible structures)
      const studentRoom = selectedStudent?.room;
      console.log('Student room data:', studentRoom);
      
      if (selectedStudent && studentRoom) {
        // Handle different possible room data structures
        let roomId;
        let roomNumber = '';
        let roomPrice = '';
        
        if (typeof studentRoom === 'object') {
          // If room is an object with _id property
          roomId = studentRoom._id;
          roomNumber = studentRoom.roomNumber || '';
          console.log('Room object:', studentRoom);
          console.log('Room type:', studentRoom.type);
          console.log('Original price:', studentRoom.price);
          
          // Check if it's a double room and adjust price accordingly
          if (studentRoom.type === 'Double') {
            roomPrice = (parseFloat(studentRoom.price) / 2).toString();
            console.log('Double room - Adjusted price:', roomPrice);
          } else {
            roomPrice = studentRoom.price || '';
            console.log('Single room - Full price:', roomPrice);
          }
        } else if (typeof studentRoom === 'string') {
          // If room is just an ID string
          roomId = studentRoom;
          
          // Try to find the room in our rooms list to get the price
          const roomObj = rooms.find(r => r._id === roomId);
          if (roomObj) {
            roomNumber = roomObj.roomNumber || '';
            console.log('Found room object:', roomObj);
            console.log('Room type:', roomObj.type);
            console.log('Original price:', roomObj.price);
            
            // Check if it's a double room and adjust price accordingly
            if (roomObj.type === 'Double') {
              roomPrice = (parseFloat(roomObj.price) / 2).toString();
              console.log('Double room - Adjusted price:', roomPrice);
            } else {
              roomPrice = roomObj.price || '';
              console.log('Single room - Full price:', roomPrice);
            }
          }
        }
        
        console.log('Final room ID:', roomId);
        console.log('Final room number:', roomNumber);
        console.log('Final room price:', roomPrice);
        
        setFormData(prev => ({
          ...prev,
          student: value,
          room: roomId,
          roomNumber: roomNumber,
          rentalFee: roomPrice
        }));
      } else {
        console.log('Student does not have a room');
        setFormData(prev => ({
          ...prev,
          student: value,
          room: undefined,
          roomNumber: ''
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleDateChange = (name, date) => {
    setFormData(prev => ({
      ...prev,
      [name]: date
    }));
  };

  const handleAddOtherFee = () => {
    setFormData(prev => ({
      ...prev,
      otherFees: [...prev.otherFees, { description: '', amount: '' }]
    }));
  };

  const handleOtherFeeChange = (index, field, value) => {
    setFormData(prev => {
      const newOtherFees = [...prev.otherFees];
      newOtherFees[index] = { ...newOtherFees[index], [field]: value };
      return { ...prev, otherFees: newOtherFees };
    });
  };

  const handleRemoveOtherFee = (index) => {
    setFormData(prev => ({
      ...prev,
      otherFees: prev.otherFees.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Create FormData to handle file upload
      const formDataToSend = new FormData();
      
      // Add all the regular form fields
      for (const key in formData) {
        // Skip the billFile and handle it separately
        if (key !== 'billFile') {
          // Handle otherFees specially since it's an array
          if (key === 'otherFees') {
            formDataToSend.append('otherFees', JSON.stringify(formData.otherFees));
          } else {
            formDataToSend.append(key, formData[key]);
          }
        }
      }
      
      // Add the file if it exists
      if (formData.billFile) {
        formDataToSend.append('billFile', formData.billFile);
      }
      
      const response = await fetch('/api/admin/bills', {
        method: 'POST',
        body: formDataToSend,
        // Don't set Content-Type header, it will be set automatically with multipart/form-data
      });
      
      if (response.ok) {
        setSnackbar({ open: true, message: 'Bill created successfully', severity: 'success' });
        setOpenDialog(false);
        resetForm();
        refreshBills();
      } else {
        const data = await response.json();
        setSnackbar({ open: true, message: data.message || 'Error creating bill', severity: 'error' });
      }
    } catch (error) {
      console.error('Error creating bill:', error);
      setSnackbar({ open: true, message: 'Error creating bill', severity: 'error' });
    }
  };

  const resetForm = () => {
    setFormData({
      student: '',
      room: '',
      roomNumber: '',
      rentalFee: '',
      waterFee: '',
      electricityFee: '',
      billingPeriodStart: new Date(),
      dueDate: null,
      notes: '',
      otherFees: [],
      billFile: null,
    });
  };

  // Open status update dialog
  const handleOpenStatusDialog = (bill) => {
    setSelectedBill(bill);
    setNewStatus(bill.status || 'pending');
    setOpenStatusDialog(true);
  };

  // Update bill status
  const handleUpdateStatus = async () => {
    try {
      // Calculate total amount for the selected bill
      const totalAmount = parseFloat(selectedBill.rentalFee || 0) + 
        parseFloat(selectedBill.waterFee || 0) + 
        parseFloat(selectedBill.electricityFee || 0) +
        (selectedBill.otherFees || []).reduce((sum, fee) => sum + parseFloat(fee.amount || 0), 0);
      
      const response = await fetch(`/api/admin/bills/${selectedBill._id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          status: newStatus,
          paidAmount: newStatus === 'paid' ? totalAmount : 0,
          paidDate: newStatus === 'paid' ? new Date() : null,
        }),
      });
      
      if (response.ok) {
        setSnackbar({
          open: true,
          message: 'Bill status updated successfully',
          severity: 'success'
        });
        setOpenStatusDialog(false);
        refreshBills();
      } else {
        const data = await response.json();
        setSnackbar({
          open: true,
          message: data.message || 'Error updating bill status',
          severity: 'error'
        });
      }
    } catch (error) {
      console.error('Error updating bill status:', error);
      setSnackbar({
        open: true,
        message: 'Error updating bill status',
        severity: 'error'
      });
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
        {/* Dashboard Header */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 4,
          pb: 3,
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}>
          <Box>
            <Typography variant="h4" sx={{ 
              fontWeight: 700, 
              color: '#fff',
              textShadow: '0 2px 4px rgba(0,0,0,0.2)',
              letterSpacing: '-0.5px',
            }}>
              Bill Management
            </Typography>
            <Typography variant="body2" sx={{ color: '#9CA3AF', mt: 1 }}>
              Create and track student billing records
            </Typography>
          </Box>
          <Stack direction="row" spacing={2} alignItems="center">
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenDialog(true)}
              sx={{
                background: 'linear-gradient(90deg, #10B981 0%, #059669 100%)',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)',
                transition: 'all 0.2s ease',
                borderRadius: '10px',
                px: 3,
                py: 1,
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 20px rgba(16, 185, 129, 0.3)',
                  background: 'linear-gradient(90deg, #059669 0%, #047857 100%)',
                },
              }}
            >
              New Bill
            </Button>
            <NotificationBell userType="admin" color="#10B981" />
          </Stack>
        </Box>

        {/* Dashboard Stats */}
        <Box sx={{ mb: 4 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={3}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  height: '100%',
                  borderRadius: '16px',
                  background: 'linear-gradient(145deg, rgba(31, 41, 55, 0.8), rgba(17, 24, 39, 0.8))',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(20px)',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: '0 12px 32px rgba(0, 0, 0, 0.3)',
                  },
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    background: 'linear-gradient(90deg, #10B981 0%, #059669 100%)',
                    borderRadius: '4px 4px 0 0',
                  },
                }}
              >
                <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Typography variant="body2" sx={{ color: '#9CA3AF', textTransform: 'uppercase', fontWeight: 600, fontSize: '0.75rem', letterSpacing: '0.5px' }}>
                    Total Bills
                  </Typography>
                  <Box sx={{ 
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    borderRadius: '12px',
                    p: 1.2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.15)'
                  }}>
                    <ReceiptLongIcon sx={{ color: '#10B981', fontSize: 22 }} />
                  </Box>
                </Box>
                <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                  {bills.length}
                </Typography>
                <Typography variant="body2" sx={{ color: '#9CA3AF', mt: 'auto' }}>
                  {`${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`}
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  height: '100%',
                  borderRadius: '16px',
                  background: 'linear-gradient(145deg, rgba(31, 41, 55, 0.8), rgba(17, 24, 39, 0.8))',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(20px)',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: '0 12px 32px rgba(0, 0, 0, 0.3)',
                  },
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    background: 'linear-gradient(90deg, #F59E0B 0%, #D97706 100%)',
                    borderRadius: '4px 4px 0 0',
                  },
                }}
              >
                <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Typography variant="body2" sx={{ color: '#9CA3AF', textTransform: 'uppercase', fontWeight: 600, fontSize: '0.75rem', letterSpacing: '0.5px' }}>
                    Pending Bills
                  </Typography>
                  <Box sx={{ 
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    borderRadius: '12px',
                    p: 1.2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(245, 158, 11, 0.15)'
                  }}>
                    <HourglassTopIcon sx={{ color: '#F59E0B', fontSize: 22 }} />
                  </Box>
                </Box>
                <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                  {bills.filter(bill => bill.status === 'pending').length}
                </Typography>
                <Typography variant="body2" sx={{ color: '#9CA3AF', mt: 'auto' }}>
                  Awaiting payment
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  height: '100%',
                  borderRadius: '16px',
                  background: 'linear-gradient(145deg, rgba(31, 41, 55, 0.8), rgba(17, 24, 39, 0.8))',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(20px)',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: '0 12px 32px rgba(0, 0, 0, 0.3)',
                  },
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    background: 'linear-gradient(90deg, #EF4444 0%, #DC2626 100%)',
                    borderRadius: '4px 4px 0 0',
                  },
                }}
              >
                <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Typography variant="body2" sx={{ color: '#9CA3AF', textTransform: 'uppercase', fontWeight: 600, fontSize: '0.75rem', letterSpacing: '0.5px' }}>
                    Overdue Bills
                  </Typography>
                  <Box sx={{ 
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    borderRadius: '12px',
                    p: 1.2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.15)'
                  }}>
                    <WarningIcon sx={{ color: '#EF4444', fontSize: 22 }} />
                  </Box>
                </Box>
                <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                  {bills.filter(bill => bill.status === 'overdue').length}
                </Typography>
                <Typography variant="body2" sx={{ color: '#9CA3AF', mt: 'auto' }}>
                  Past due date
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  height: '100%',
                  borderRadius: '16px',
                  background: 'linear-gradient(145deg, rgba(31, 41, 55, 0.8), rgba(17, 24, 39, 0.8))',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(20px)',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: '0 12px 32px rgba(0, 0, 0, 0.3)',
                  },
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    background: 'linear-gradient(90deg, #0EA5E9 0%, #0284C7 100%)',
                    borderRadius: '4px 4px 0 0',
                  },
                }}
              >
                <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Typography variant="body2" sx={{ color: '#9CA3AF', textTransform: 'uppercase', fontWeight: 600, fontSize: '0.75rem', letterSpacing: '0.5px' }}>
                    Paid Bills
                  </Typography>
                  <Box sx={{ 
                    backgroundColor: 'rgba(14, 165, 233, 0.1)',
                    borderRadius: '12px',
                    p: 1.2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(14, 165, 233, 0.15)'
                  }}>
                    <CheckCircleIcon sx={{ color: '#0EA5E9', fontSize: 22 }} />
                  </Box>
                </Box>
                <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                  {bills.filter(bill => bill.status === 'paid').length}
                </Typography>
                <Typography variant="body2" sx={{ color: '#9CA3AF', mt: 'auto' }}>
                  Payment complete
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Box>

        {/* Bills Table */}
        <Paper 
          elevation={0}
          sx={{
            backgroundColor: 'rgba(17, 24, 39, 0.8)',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(20px)',
            overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          }}
        >
          <Box sx={{ 
            p: 3, 
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
          }}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#fff', letterSpacing: '-0.5px' }}>
                Billing Records
              </Typography>
              <Typography variant="body2" sx={{ color: '#9CA3AF', mt: 0.5 }}>
                Manage and track payment status
              </Typography>
            </Box>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '10px',
              p: 0.5,
              border: '1px solid rgba(255, 255, 255, 0.05)',
            }}>
              <TextField
                placeholder="Search bills..."
                size="small"
                sx={{
                  minWidth: '220px',
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                    color: '#fff',
                    backgroundColor: 'transparent',
                    '& fieldset': {
                      border: 'none',
                    },
                  },
                  '& .MuiOutlinedInput-input': {
                    padding: '8px 12px',
                  },
                  '& .MuiInputBase-input::placeholder': {
                    color: 'rgba(255, 255, 255, 0.5)',
                    opacity: 1,
                  },
                }}
              />
              <IconButton sx={{ color: '#10B981' }}>
                <AddIcon />
              </IconButton>
            </Box>
          </Box>
          
          {bills.length > 0 ? (
            <TableContainer sx={{ maxHeight: 650 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell 
                  sx={{
                        backgroundColor: 'rgba(22, 28, 36, 0.95)', 
                        color: '#9CA3AF',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                        letterSpacing: '0.5px',
                        textTransform: 'uppercase',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                        py: 2.5,
                        pl: 3
                      }}
                    >
                      Student
                    </TableCell>
                    <TableCell 
                  sx={{
                        backgroundColor: 'rgba(22, 28, 36, 0.95)', 
                        color: '#9CA3AF',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                        letterSpacing: '0.5px',
                        textTransform: 'uppercase',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                        py: 2.5
                      }}
                    >
                      Room
                    </TableCell>
                    <TableCell 
                  sx={{
                        backgroundColor: 'rgba(22, 28, 36, 0.95)', 
                        color: '#9CA3AF',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                        letterSpacing: '0.5px',
                        textTransform: 'uppercase',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                        py: 2.5
                      }}
                    >
                      Amount
                    </TableCell>
                    <TableCell 
                  sx={{
                        backgroundColor: 'rgba(22, 28, 36, 0.95)', 
                        color: '#9CA3AF',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                        letterSpacing: '0.5px',
                        textTransform: 'uppercase',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                        py: 2.5
                      }}
                    >
                      Due Date
                    </TableCell>
                    <TableCell 
                  sx={{
                        backgroundColor: 'rgba(22, 28, 36, 0.95)', 
                        color: '#9CA3AF',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                        letterSpacing: '0.5px',
                        textTransform: 'uppercase',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                        py: 2.5
                      }}
                    >
                      Status
                    </TableCell>
                    <TableCell 
                      align="right"
                      sx={{ 
                        backgroundColor: 'rgba(22, 28, 36, 0.95)', 
                        color: '#9CA3AF',
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        letterSpacing: '0.5px',
                        textTransform: 'uppercase',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                        py: 2.5,
                        pr: 3
                      }}
                    >
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                {bills.map((bill) => {
                  // Calculate total amount
                  const totalAmount = parseFloat(bill.rentalFee || 0) + 
                    parseFloat(bill.waterFee || 0) + 
                    parseFloat(bill.electricityFee || 0) +
                    (bill.otherFees || []).reduce((sum, fee) => sum + parseFloat(fee.amount || 0), 0);
                  
                  // Get student name
                  const studentName = bill.student && typeof bill.student === 'object' 
                    ? bill.student.name 
                    : students.find(s => s._id === bill.student)?.name || 'Unknown';
                  
                  // Format date
                  const formattedDueDate = bill.dueDate 
                    ? new Date(bill.dueDate).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                      })
                    : 'Not set';

                  // Get room number
                  const roomNumber = bill.roomNumber || 'N/A';
                  
                  // Determine if bill is past due
                  const isPastDue = bill.status !== 'paid' && 
                    bill.dueDate && new Date(bill.dueDate) < new Date() && 
                    bill.status !== 'overdue';
                  
                  // Get student initials
                  const studentInitials = studentName
                    .split(' ')
                    .map(part => part.charAt(0))
                    .join('')
                    .substring(0, 2)
                    .toUpperCase();
                  
                  return (
                      <TableRow 
                        key={bill._id}
                        sx={{
                          transition: 'all 0.2s ease',
                          '&:hover': { backgroundColor: 'rgba(16, 185, 129, 0.05)' },
                          position: 'relative',
                          '&::before': isPastDue ? {
                              content: '""',
                              position: 'absolute',
                              left: 0,
                              top: 0,
                            bottom: 0,
                            width: '4px',
                            backgroundColor: '#EF4444',
                            borderRadius: '4px 0 0 4px'
                          } : {}
                        }}
                      >
                        <TableCell 
                          sx={{ 
                            color: '#fff',
                            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                            py: 2.5,
                            pl: 3
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar 
                              sx={{ 
                                width: 38, 
                                height: 38, 
                                bgcolor: bill.status === 'paid' 
                                  ? 'rgba(16, 185, 129, 0.2)' 
                                  : bill.status === 'overdue' 
                                    ? 'rgba(239, 68, 68, 0.2)'
                                    : 'rgba(59, 130, 246, 0.2)',
                                color: bill.status === 'paid' 
                                  ? '#10B981' 
                                  : bill.status === 'overdue' 
                                    ? '#EF4444'
                                    : '#3B82F6',
                                fontSize: '0.9rem',
                                fontWeight: 600,
                                mr: 2,
                                textTransform: 'uppercase'
                              }}
                            >
                              {studentInitials}
                            </Avatar>
                            <Box>
                              <Typography sx={{ fontWeight: 600, fontSize: '0.95rem' }}>{studentName}</Typography>
                              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                                {bill._id.substring(0, 8)}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell 
                          sx={{ 
                            color: '#fff',
                            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                            py: 2.5
                          }}
                        >
                              <Box sx={{ 
                            bgcolor: 'rgba(255, 255, 255, 0.05)', 
                            py: 0.75, 
                            px: 1.5, 
                            borderRadius: '6px',
                            display: 'inline-block'
                          }}>
                            <Typography sx={{ color: 'rgba(255, 255, 255, 0.9)', fontWeight: 500, fontSize: '0.85rem' }}>
                              {roomNumber}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell 
                          sx={{ 
                            color: '#fff',
                            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                            fontWeight: 600,
                            py: 2.5
                          }}
                        >
                          <Typography sx={{ fontWeight: 700, color: '#10B981', fontSize: '0.95rem' }}>
                            ₱{totalAmount.toFixed(2)}
                          </Typography>
                        </TableCell>
                        <TableCell 
                          sx={{ 
                            color: '#fff',
                            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                            py: 2.5
                          }}
                        >
                          <Typography sx={{ 
                            color: isPastDue ? '#EF4444' : 'rgba(255, 255, 255, 0.8)',
                            fontWeight: isPastDue ? 600 : 500,
                            fontSize: '0.85rem'
                          }}>
                            {formattedDueDate}
                          </Typography>
                        </TableCell>
                        <TableCell 
                          sx={{ 
                            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                            py: 2.5
                          }}
                        >
                          <Box 
                            sx={{ 
                                display: 'inline-flex',
                                alignItems: 'center',
                                px: 1.5,
                              py: 0.75,
                                borderRadius: '20px',
                              fontSize: '0.75rem',
                                fontWeight: 600,
                              textTransform: 'capitalize',
                              ...(bill.status === 'pending' && {
                                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                                color: '#F59E0B',
                                border: '1px solid rgba(245, 158, 11, 0.2)',
                              }),
                              ...(bill.status === 'paid' && {
                                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                                color: '#10B981',
                                border: '1px solid rgba(16, 185, 129, 0.2)',
                              }),
                              ...(bill.status === 'overdue' && {
                                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                color: '#EF4444',
                                border: '1px solid rgba(239, 68, 68, 0.2)',
                              }),
                              ...(bill.status === 'partially_paid' && {
                                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                color: '#3B82F6',
                                border: '1px solid rgba(59, 130, 246, 0.2)',
                              }),
                            }}
                          >
                            {bill.status === 'pending' && <HourglassTopIcon fontSize="small" sx={{ mr: 0.5, fontSize: '0.875rem' }} />}
                            {bill.status === 'paid' && <CheckCircleIcon fontSize="small" sx={{ mr: 0.5, fontSize: '0.875rem' }} />}
                            {bill.status === 'overdue' && <WarningIcon fontSize="small" sx={{ mr: 0.5, fontSize: '0.875rem' }} />}
                            {bill.status === 'partially_paid' && <PaymentsIcon fontSize="small" sx={{ mr: 0.5, fontSize: '0.875rem' }} />}
                                  {bill.status || 'pending'}
                                </Box>
                        </TableCell>
                        <TableCell 
                          align="right"
                            sx={{ 
                            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                            py: 2.5,
                            pr: 3
                          }}
                        >
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <Tooltip title="View Details">
                              <IconButton
                                size="small"
                                sx={{ 
                                  color: 'rgba(255, 255, 255, 0.7)',
                                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                              '&:hover': { 
                                    backgroundColor: 'rgba(59, 130, 246, 0.2)',
                                    color: '#3B82F6'
                                  },
                                  width: 34,
                                  height: 34,
                                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                                }}
                                onClick={() => {
                                  console.log('View bill details:', bill._id);
                                }}
                              >
                                <VisibilityIcon fontSize="small" sx={{ fontSize: '1rem' }} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Update Status">
                              <IconButton
                                size="small"
                                sx={{ 
                                  color: 'rgba(255, 255, 255, 0.7)',
                                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                  '&:hover': { 
                                    backgroundColor: 'rgba(16, 185, 129, 0.2)',
                                    color: '#10B981'
                                  },
                                  width: 34,
                                  height: 34,
                                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                                }}
                                onClick={() => handleOpenStatusDialog(bill)}
                              >
                                <EditIcon fontSize="small" sx={{ fontSize: '1rem' }} />
                              </IconButton>
                            </Tooltip>
                            {bill.billFile && (
                              <Tooltip title="View Document">
                                <IconButton
                                  size="small"
                                  sx={{ 
                                    color: 'rgba(255, 255, 255, 0.7)',
                                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                    '&:hover': { 
                                      backgroundColor: 'rgba(245, 158, 11, 0.2)',
                                      color: '#F59E0B'
                                    },
                                    width: 34,
                                    height: 34,
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                                  }}
                                  onClick={() => {
                                    window.open(`/${bill.billFile}`, '_blank');
                                  }}
                                >
                                  <DescriptionIcon fontSize="small" sx={{ fontSize: '1rem' }} />
                                </IconButton>
                              </Tooltip>
                            )}
                            <Tooltip title="Delete Bill">
                              <IconButton
                                size="small"
                                sx={{ 
                                  color: 'rgba(255, 255, 255, 0.7)',
                                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                  '&:hover': { 
                                    backgroundColor: 'rgba(239, 68, 68, 0.2)',
                                    color: '#EF4444'
                                  },
                                  width: 34,
                                  height: 34,
                                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                                }}
                                onClick={async () => {
                                  if (window.confirm('Are you sure you want to delete this bill?')) {
                                    try {
                                      const response = await fetch(`/api/admin/bills/${bill._id}`, {
                                        method: 'DELETE',
                                        credentials: 'include',
                                      });
                                      
                                      if (response.ok) {
                                        setSnackbar({ 
                                          open: true, 
                                          message: 'Bill deleted successfully', 
                                          severity: 'success' 
                                        });
                                        refreshBills();
                                      } else {
                                        const data = await response.json();
                                        setSnackbar({ 
                                          open: true, 
                                          message: data.message || 'Error deleting bill', 
                                          severity: 'error' 
                                        });
                                      }
                                    } catch (error) {
                                      console.error('Error deleting bill:', error);
                                      setSnackbar({ 
                                        open: true, 
                                        message: 'Error deleting bill', 
                                        severity: 'error' 
                                      });
                                    }
                                  }
                                }}
                              >
                                <DeleteIcon fontSize="small" sx={{ fontSize: '1rem' }} />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              py: 10,
              px: 3
            }}>
              <Box 
                sx={{ 
                  mb: 3,
                  p: 3,
                  borderRadius: '50%',
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  boxShadow: '0 8px 20px rgba(16, 185, 129, 0.15)'
                }}
              >
                <ReceiptLongIcon sx={{ fontSize: 56, color: '#10B981' }} />
              </Box>
              <Typography variant="h5" sx={{ color: '#fff', fontWeight: 700, mb: 1 }}>
                No Billing Records Yet
                            </Typography>
              <Typography variant="body1" sx={{ color: '#9CA3AF', textAlign: 'center', maxWidth: 450, mb: 4 }}>
                Create your first bill to start managing student payments and track financial records.
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setOpenDialog(true)}
                sx={{
                  background: 'linear-gradient(90deg, #10B981 0%, #059669 100%)',
                  boxShadow: '0 8px 20px rgba(16, 185, 129, 0.3)',
                  transition: 'all 0.2s ease',
                  borderRadius: '12px',
                  px: 5,
                  py: 1.5,
                  fontWeight: 700,
                  fontSize: '1rem',
                  '&:hover': {
                    transform: 'translateY(-3px)',
                    boxShadow: '0 12px 25px rgba(16, 185, 129, 0.4)',
                    background: 'linear-gradient(90deg, #059669 0%, #047857 100%)',
                  },
                }}
              >
                Create Your First Bill
              </Button>
            </Box>
          )}
        </Paper>

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
              zIndex: 1300,
            },
          }}
        >
          <DialogTitle sx={{ 
            borderBottom: '1px solid rgba(255,255,255,0.03)',
            background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.1) 0%, transparent 100%)',
            color: '#fff',
            fontWeight: 600,
            fontSize: '1.5rem',
          }}>
            Create Bill
          </DialogTitle>
          <DialogContent sx={{ 
            mt: 2,
            p: 3,
            '& .MuiTextField-root, & .MuiFormControl-root': {
              mb: 2,
            },
          }}>
            <form onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                {/* Student Information Section */}
                <Grid item xs={12}>
                  <Typography variant="subtitle1" sx={{ 
                    color: '#10B981', 
                    mb: 2,
                    borderBottom: '1px solid rgba(16, 185, 129, 0.2)',
                    pb: 1,
                  }}>
                    Student Information
                            </Typography>
                          <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth>
                        <InputLabel sx={{ 
                          color: '#9CA3AF',
                          '&.Mui-focused': {
                            color: '#10B981',
                          },
                        }}>
                          Select Student
                        </InputLabel>
                        <Select
                          name="student"
                          value={formData.student}
                          onChange={handleInputChange}
                          required
                          displayEmpty
                          renderValue={(selected) => {
                            if (selected === '') {
                              return 'Select Student';
                            }
                            return students.find(student => student._id === selected)?.name || 'Select Student';
                          }}
                          sx={{
                            backgroundColor: 'rgba(0, 0, 0, 0.2)',
                            '& .MuiOutlinedInput-root': {
                              color: '#fff',
                            },
                            '& fieldset': {
                              borderColor: 'rgba(255,255,255,0.1)',
                            },
                            '&:hover fieldset': {
                              borderColor: 'rgba(16, 185, 129, 0.5)',
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: '#10B981',
                            },
                            '.MuiSvgIcon-root': {
                              color: '#fff',
                            },
                            '& .MuiSelect-select': {
                              backgroundColor: 'rgba(0, 0, 0, 0.2)',
                              color: '#fff',
                            }
                          }}
                          MenuProps={{
                            PaperProps: {
                              sx: {
                                bgcolor: '#1a1a1a',
                                '& .MuiMenuItem-root': {
                                  color: '#fff',
                                  '&:hover': {
                                    bgcolor: 'rgba(16, 185, 129, 0.1)',
                                  },
                                  '&.Mui-selected': {
                                    bgcolor: 'rgba(16, 185, 129, 0.2)',
                                    '&:hover': {
                                      bgcolor: 'rgba(16, 185, 129, 0.3)',
                                    },
                                  },
                                },
                              },
                            },
                          }}
                        >
                          <MenuItem value="" disabled>
                            Select Student
                          </MenuItem>
                          {students.map((student) => (
                            <MenuItem key={student._id} value={student._id}>
                              {student.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Room"
                        name="roomNumber"
                        value={formData.roomNumber}
                        disabled={true}
                        required
                        sx={{
                          backgroundColor: 'rgba(0, 0, 0, 0.2)',
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
                            '& .MuiInputBase-input': {
                              color: '#fff !important',
                              '-webkit-text-fill-color': '#fff !important',
                              backgroundColor: 'rgba(0, 0, 0, 0.2)',
                            },
                            '&.Mui-disabled': {
                              '& .MuiInputBase-input': {
                                color: 'rgba(255, 255, 255, 0.7) !important',
                                '-webkit-text-fill-color': 'rgba(255, 255, 255, 0.7) !important',
                              },
                              '& fieldset': {
                                borderColor: 'rgba(255, 255, 255, 0.1)',
                              },
                            },
                          },
                          '& .MuiInputLabel-root': {
                            color: '#9CA3AF',
                            '&.Mui-focused': {
                              color: '#10B981',
                            },
                            '&.Mui-disabled': {
                              color: 'rgba(255, 255, 255, 0.7)',
                            },
                          },
                        }}
                      />
                    </Grid>
                  </Grid>
                </Grid>

                {/* Billing Information Section */}
                <Grid item xs={12}>
                  <Typography variant="subtitle1" sx={{ 
                    color: '#10B981', 
                    mb: 2,
                    borderBottom: '1px solid rgba(16, 185, 129, 0.2)',
                    pb: 1,
                  }}>
                    Billing Information
                                </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="Rental Fee"
                        name="rentalFee"
                        type="number"
                        value={formData.rentalFee}
                        onChange={handleInputChange}
                        required
                        disabled={true}
                        sx={{
                          backgroundColor: 'rgba(0, 0, 0, 0.2)',
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
                            '& .MuiInputBase-input': {
                              color: '#fff !important',
                              '-webkit-text-fill-color': '#fff !important',
                              backgroundColor: 'rgba(0, 0, 0, 0.2)',
                            },
                            '&.Mui-disabled': {
                              '& .MuiInputBase-input': {
                                color: 'rgba(255, 255, 255, 0.7) !important',
                                '-webkit-text-fill-color': 'rgba(255, 255, 255, 0.7) !important',
                              },
                              '& fieldset': {
                                borderColor: 'rgba(255, 255, 255, 0.1)',
                              },
                            },
                          },
                          '& .MuiInputLabel-root': {
                            color: '#9CA3AF',
                            '&.Mui-focused': {
                              color: '#10B981',
                            },
                            '&.Mui-disabled': {
                              color: 'rgba(255, 255, 255, 0.7)',
                            },
                          },
                        }}
                      />
                            </Grid>
                            
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="Water Fee"
                        name="waterFee"
                        type="number"
                        value={formData.waterFee}
                        onChange={handleInputChange}
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
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="Electricity Fee"
                        name="electricityFee"
                        type="number"
                        value={formData.electricityFee}
                        onChange={handleInputChange}
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
                    </Grid>
                  </Grid>
                </Grid>

                {/* Date Information Section */}
                <Grid item xs={12}>
                  <Typography variant="subtitle1" sx={{ 
                    color: '#10B981', 
                    mb: 2,
                    borderBottom: '1px solid rgba(16, 185, 129, 0.2)',
                    pb: 1,
                  }}>
                    Date Information
                              </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <DatePicker
                          label="Billing Period Start"
                          value={formData.billingPeriodStart}
                          onChange={(date) => handleDateChange('billingPeriodStart', date)}
                          sx={{
                            '& .MuiInputBase-root': {
                              color: '#fff !important',
                              backgroundColor: '#121212',
                            },
                            '& .MuiSvgIcon-root': {
                              color: '#fff !important',
                            },
                            '& .MuiInputLabel-root': {
                              color: '#fff !important',
                              opacity: 0.9,
                            },
                          }}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              fullWidth
                              required
                              InputProps={{
                                ...params.InputProps,
                                style: { color: '#fff' },
                                sx: {
                                  '& .MuiSvgIcon-root': {
                                    color: '#fff !important',
                                  },
                                  '&::placeholder': {
                                    color: '#fff !important',
                                    opacity: 1,
                                  },
                                  '& .MuiInputAdornment-root': {
                                    color: '#fff !important',
                                  },
                                }
                              }}
                              inputProps={{
                                ...params.inputProps,
                                style: { color: '#fff', fontWeight: 600 },
                                placeholder: 'Select date',
                              }}
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  color: '#fff !important',
                                  backgroundColor: '#121212',
                                borderRadius: '8px',
                                  height: '48px',
                                  '& input': {
                                    color: '#fff !important',
                                    '-webkit-text-fill-color': '#fff !important',
                                    fontWeight: 600,
                                    opacity: 1,
                                    '&::placeholder': {
                                      color: '#fff !important',
                                      opacity: 1,
                                    },
                                  },
                                  '& fieldset': {
                                    borderColor: 'transparent',
                                  },
                                  '&:hover fieldset': {
                                    borderColor: 'transparent',
                                  },
                                  '&.Mui-focused fieldset': {
                                    borderColor: 'transparent',
                                  },
                                },
                                '& .MuiInputLabel-root': {
                                  color: '#fff !important',
                                  opacity: 0.9,
                                  '&.Mui-focused': {
                                    color: '#10B981 !important',
                                  },
                                },
                                '& .MuiSvgIcon-root': {
                                  color: '#fff !important',
                                },
                                '& .MuiIconButton-root': {
                                  color: '#fff !important',
                                },
                              }}
                            />
                          )}
                        />
                      </LocalizationProvider>
                            </Grid>
                            
                    <Grid item xs={12} md={6}>
                      <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <DatePicker
                          label="Due Date"
                          value={formData.dueDate}
                          onChange={(date) => handleDateChange('dueDate', date)}
                          sx={{
                            '& .MuiInputBase-root': {
                              color: '#fff !important',
                              backgroundColor: '#121212',
                            },
                            '& .MuiSvgIcon-root': {
                              color: '#fff !important',
                            },
                            '& .MuiInputLabel-root': {
                              color: '#fff !important',
                              opacity: 0.9,
                            },
                          }}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              fullWidth
                              required
                              InputProps={{
                                ...params.InputProps,
                                style: { color: '#fff' },
                                sx: {
                                  '& .MuiSvgIcon-root': {
                                    color: '#fff !important',
                                  },
                                  '&::placeholder': {
                                    color: '#fff !important',
                                    opacity: 1,
                                  },
                                  '& .MuiInputAdornment-root': {
                                    color: '#fff !important',
                                  },
                                }
                              }}
                              inputProps={{
                                ...params.inputProps,
                                style: { color: '#fff', fontWeight: 600 },
                                placeholder: 'Select date',
                              }}
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  color: '#fff !important',
                                  backgroundColor: '#121212',
                                  borderRadius: '8px',
                                  height: '48px',
                                  '& input': {
                                    color: '#fff !important',
                                    '-webkit-text-fill-color': '#fff !important',
                                    fontWeight: 600,
                                    opacity: 1,
                                    '&::placeholder': {
                                      color: '#fff !important',
                                      opacity: 1,
                                    },
                                  },
                                  '& fieldset': {
                                    borderColor: 'transparent',
                                  },
                                  '&:hover fieldset': {
                                    borderColor: 'transparent',
                                  },
                                  '&.Mui-focused fieldset': {
                                    borderColor: 'transparent',
                                  },
                                },
                                '& .MuiInputLabel-root': {
                                  color: '#fff !important',
                                  opacity: 0.9,
                                  '&.Mui-focused': {
                                    color: '#10B981 !important',
                                  },
                                },
                                '& .MuiSvgIcon-root': {
                                  color: '#fff !important',
                                },
                                '& .MuiIconButton-root': {
                                  color: '#fff !important',
                                },
                              }}
                            />
                          )}
                        />
                      </LocalizationProvider>
                    </Grid>
                  </Grid>
                </Grid>

                {/* Bill File Upload Section */}
                            <Grid item xs={12}>
                  <Typography variant="subtitle1" sx={{ 
                    color: '#10B981', 
                    mb: 2,
                    borderBottom: '1px solid rgba(16, 185, 129, 0.2)',
                    pb: 1,
                  }}>
                    Bill Document
                              </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Button
                        component="label"
                        variant="outlined"
                        startIcon={<CloudUploadIcon />}
                        sx={{
                          color: '#fff',
                          borderColor: 'rgba(255,255,255,0.2)',
                          padding: '10px 15px',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            borderColor: '#10B981',
                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                          },
                          width: '100%',
                                display: 'flex',
                          justifyContent: 'flex-start',
                          textTransform: 'none',
                        }}
                      >
                        {formData.billFile ? 'Change Bill Document' : 'Upload Bill Document'}
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                          hidden
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              setFormData(prev => ({ ...prev, billFile: file }));
                            }
                          }}
                        />
                      </Button>
                      {formData.billFile && (
                                <Box sx={{
                          mt: 1, 
                                  display: 'flex',
                                  alignItems: 'center',
                          justifyContent: 'space-between',
                          bgcolor: 'rgba(16, 185, 129, 0.1)',
                          p: 1,
                          borderRadius: 1
                        }}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <InsertDriveFileIcon sx={{ color: '#10B981', mr: 1 }} />
                            <Typography variant="body2" sx={{ color: '#fff' }}>
                              {formData.billFile.name}
                                  </Typography>
                                </Box>
                          <IconButton 
                            size="small" 
                            onClick={() => setFormData(prev => ({ ...prev, billFile: null }))}
                            sx={{ color: '#f87171' }}
                          >
                            <ClearIcon fontSize="small" />
                          </IconButton>
                              </Box>
                      )}
                      <Typography variant="caption" sx={{ display: 'block', mt: 1, color: '#9CA3AF' }}>
                        Upload PDF or image of the bill document (max 5MB)
                      </Typography>
                            </Grid>
                          </Grid>
                </Grid>

                {/* Other Fees Section */}
                <Grid item xs={12}>
                  <Typography variant="subtitle1" sx={{ 
                    color: '#10B981', 
                    mb: 2,
                    borderBottom: '1px solid rgba(16, 185, 129, 0.2)',
                    pb: 1,
                  }}>
                    Other Fees
                          </Typography>
                  <Button
                    startIcon={<AddIcon />}
                    onClick={handleAddOtherFee}
                            sx={{
                      mb: 2,
                      color: '#10B981',
                              '&:hover': {
                        background: 'rgba(16, 185, 129, 0.1)',
                      }
                    }}
                  >
                    Add Other Fee
                  </Button>
                  
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ 
                            color: '#9CA3AF', 
                            borderBottom: '1px solid rgba(255,255,255,0.1)',
                            fontWeight: 500,
                          }}>
                            Description
                          </TableCell>
                          <TableCell sx={{ 
                            color: '#9CA3AF', 
                            borderBottom: '1px solid rgba(255,255,255,0.1)',
                            fontWeight: 500,
                          }}>
                            Amount
                          </TableCell>
                          <TableCell sx={{ 
                            color: '#9CA3AF', 
                            borderBottom: '1px solid rgba(255,255,255,0.1)',
                            fontWeight: 500,
                            width: '100px',
                          }}>
                            Action
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {formData.otherFees.map((fee, index) => (
                          <TableRow key={index}>
                            <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                              <TextField
                                fullWidth
                                value={fee.description}
                                onChange={(e) => handleOtherFeeChange(index, 'description', e.target.value)}
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
                                }}
                              />
                            </TableCell>
                            <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                              <TextField
                                fullWidth
                                type="number"
                                value={fee.amount}
                                onChange={(e) => handleOtherFeeChange(index, 'amount', e.target.value)}
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
                                }}
                              />
                            </TableCell>
                            <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                              <IconButton
                                onClick={() => handleRemoveOtherFee(index)}
                                sx={{ 
                                  color: '#EF4444',
                                  '&:hover': { 
                                    background: 'rgba(239, 68, 68, 0.1)',
                                  }
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
                </Grid>

                {/* Notes Section */}
                <Grid item xs={12}>
                  <Typography variant="subtitle1" sx={{ 
                    color: '#10B981', 
                    mb: 2,
                    borderBottom: '1px solid rgba(16, 185, 129, 0.2)',
                    pb: 1,
                  }}>
                    Additional Notes
                  </Typography>
                  <TextField
                    fullWidth
                    label="Notes"
                    name="notes"
                    multiline
                    rows={4}
                    value={formData.notes}
                    onChange={handleInputChange}
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
                </Grid>
              </Grid>
            </form>
          </DialogContent>
          <DialogActions sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,0.03)' }}>
            <Button 
              onClick={() => setOpenDialog(false)} 
              sx={{ 
                color: 'rgba(255,255,255,0.9)',
                fontWeight: 500,
                '&:hover': {
                  background: 'rgba(255,255,255,0.05)',
                },
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              variant="contained"
                                sx={{ 
                background: 'linear-gradient(90deg, #10B981 0%, #059669 100%)',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)',
                transition: 'all 0.3s ease',
                fontWeight: 600,
                                  '&:hover': { 
                  transform: 'translateY(-1px)',
                  boxShadow: '0 6px 15px rgba(16, 185, 129, 0.3)',
                  background: 'linear-gradient(90deg, #059669 0%, #047857 100%)',
                },
              }}
            >
              Create
            </Button>
          </DialogActions>
        </Dialog>

        {/* Status Update Dialog */}
        <Dialog
          open={openStatusDialog}
          onClose={() => setOpenStatusDialog(false)}
          PaperProps={{
            sx: {
              background: 'linear-gradient(145deg, #141414 0%, #0A0A0A 100%)',
              color: '#fff',
              minWidth: '500px',
              maxHeight: '90vh',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.03)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
              zIndex: 1300,
            },
          }}
        >
          <DialogTitle sx={{ 
            borderBottom: '1px solid rgba(255,255,255,0.03)',
            background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.1) 0%, transparent 100%)',
            color: '#fff',
            fontWeight: 600,
            fontSize: '1.5rem',
          }}>
            Update Bill Status
          </DialogTitle>
          <DialogContent sx={{ 
            mt: 2,
            p: 3,
            '& .MuiTextField-root, & .MuiFormControl-root': {
              mb: 2,
            },
          }}>
            <form onSubmit={(e) => {
              e.preventDefault();
              handleUpdateStatus();
            }}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel sx={{ 
                      color: '#9CA3AF',
                      '&.Mui-focused': {
                        color: '#10B981',
                      },
                    }}>
                      Select Status
                    </InputLabel>
                    <Select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      required
                                  sx={{ 
                        backgroundColor: 'rgba(0, 0, 0, 0.2)',
                        '& .MuiOutlinedInput-root': {
                          color: '#fff',
                        },
                        '& fieldset': {
                          borderColor: 'rgba(255,255,255,0.1)',
                        },
                        '&:hover fieldset': {
                          borderColor: 'rgba(16, 185, 129, 0.5)',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#10B981',
                        },
                        '.MuiSvgIcon-root': {
                          color: '#fff',
                        },
                        '& .MuiSelect-select': {
                          backgroundColor: 'rgba(0, 0, 0, 0.2)',
                          color: '#fff',
                        }
                      }}
                      MenuProps={{
                        PaperProps: {
                          sx: {
                            bgcolor: '#1a1a1a',
                            '& .MuiMenuItem-root': {
                              color: '#fff',
                                    '&:hover': { 
                                bgcolor: 'rgba(16, 185, 129, 0.1)',
                              },
                              '&.Mui-selected': {
                                bgcolor: 'rgba(16, 185, 129, 0.2)',
                                '&:hover': {
                                  bgcolor: 'rgba(16, 185, 129, 0.3)',
                                },
                              },
                            },
                          },
                        },
                      }}
                    >
                      <MenuItem value="pending">Pending</MenuItem>
                      <MenuItem value="paid">Paid</MenuItem>
                      <MenuItem value="overdue">Overdue</MenuItem>
                      <MenuItem value="partially_paid">Partially Paid</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </form>
          </DialogContent>
          <DialogActions sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,0.03)' }}>
            <Button 
              onClick={() => setOpenStatusDialog(false)} 
              sx={{ 
                color: 'rgba(255,255,255,0.9)',
                fontWeight: 500,
                '&:hover': {
                  background: 'rgba(255,255,255,0.05)',
                },
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateStatus}
              variant="contained"
              sx={{
                background: 'linear-gradient(90deg, #10B981 0%, #059669 100%)',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)',
                transition: 'all 0.3s ease',
                fontWeight: 600,
                '&:hover': {
                  transform: 'translateY(-1px)',
                  boxShadow: '0 6px 15px rgba(16, 185, 129, 0.3)',
                  background: 'linear-gradient(90deg, #059669 0%, #047857 100%)',
                },
              }}
            >
              Update
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          sx={{
            position: 'fixed',
            mt: 7,
            mr: 2,
            zIndex: 9999999,
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
      </Box>
    </Box>
  );
};

export default AdminBill;

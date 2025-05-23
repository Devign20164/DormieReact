import React, { useState, useEffect, useContext } from 'react';
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
  Card,
  Divider,
  Chip,
  useTheme
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
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AttachMoney as AttachMoneyIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  PriorityHigh as PriorityHighIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import AdminSidebar from '../components/AdminSidebar';
import NotificationBell from '../components/NotificationBell';
import { Dialog as MuiDialog, DialogTitle as MuiDialogTitle, DialogContent as MuiDialogContent, DialogActions as MuiDialogActions } from '@mui/material';
import { ThemeContext } from '../App';

const AdminBill = () => {
  const { mode } = useContext(ThemeContext);
  const theme = useTheme();
  
  const [students, setStudents] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [bills, setBills] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [openStatusDialog, setOpenStatusDialog] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [openBillDetailsDialog, setOpenBillDetailsDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // Add new state for status filtering
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
  const [openReturnDialog, setOpenReturnDialog] = useState(false);

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

  // Calculate total amount for all bills
  const calculateTotalBillAmount = () => {
    return bills.reduce((total, bill) => {
      const billAmount = parseFloat(bill.rentalFee || 0) + 
        parseFloat(bill.waterFee || 0) + 
        parseFloat(bill.electricityFee || 0) +
        (bill.otherFees || []).reduce((sum, fee) => sum + parseFloat(fee.amount || 0), 0);
      return total + billAmount;
    }, 0);
  };

  // Format currency in PHP
  const formatCurrency = (amount) => {
    return `₱${parseFloat(amount).toLocaleString('en-PH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  // Calculate overdue amount
  const calculateOverdueAmount = () => {
    return bills
      .filter(bill => 
        // Count bills that are past due (due date is in the past and not paid)
        bill.status !== 'paid' && bill.dueDate && new Date(bill.dueDate) < new Date()
      )
      .reduce((total, bill) => {
        const billAmount = parseFloat(bill.rentalFee || 0) + 
          parseFloat(bill.waterFee || 0) + 
          parseFloat(bill.electricityFee || 0) +
          (bill.otherFees || []).reduce((sum, fee) => sum + parseFloat(fee.amount || 0), 0);
        return total + billAmount;
      }, 0);
  };

  // Calculate this month's revenue
  const calculateMonthlyRevenue = () => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    return bills
      .filter(bill => {
        if (bill.status !== 'paid') return false;
        const paidDate = bill.paidDate ? new Date(bill.paidDate) : null;
        return paidDate && 
               paidDate.getMonth() === currentMonth && 
               paidDate.getFullYear() === currentYear;
      })
      .reduce((total, bill) => {
        const billAmount = parseFloat(bill.rentalFee || 0) + 
          parseFloat(bill.waterFee || 0) + 
          parseFloat(bill.electricityFee || 0) +
          (bill.otherFees || []).reduce((sum, fee) => sum + parseFloat(fee.amount || 0), 0);
        return total + billAmount;
      }, 0);
  };

  // Handle viewing bill details
  const handleBillDetails = (bill) => {
    setSelectedBill(bill);
    setOpenBillDetailsDialog(true);
  };

  // Close bill details dialog
  const handleCloseBillDetailsDialog = () => {
    setOpenBillDetailsDialog(false);
  };

  // Handle input change
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

  // Filter bills based on search query and status filter
  const filteredBills = bills.filter(bill => {
    const studentName = bill.student && typeof bill.student === 'object' 
      ? bill.student.name 
      : students.find(s => s._id === bill.student)?.name || '';
    
    const searchString = searchQuery.toLowerCase();
    const matchesSearch = studentName.toLowerCase().includes(searchString) ||
      (bill.roomNumber && bill.roomNumber.toLowerCase().includes(searchString)) ||
      (bill.status && bill.status.toLowerCase().includes(searchString)) ||
      (bill._id && bill._id.toLowerCase().includes(searchString));
    
    // Apply status filter
    if (statusFilter === 'all') {
      return matchesSearch;
    } else if (statusFilter === 'pending') {
      // Show only bills with pending status AND not past due
      return matchesSearch && bill.status === 'pending' && 
        (!bill.dueDate || new Date(bill.dueDate) >= new Date());
    } else if (statusFilter === 'paid') {
      return matchesSearch && bill.status === 'paid';
    } else if (statusFilter === 'overdue') {
      return matchesSearch && bill.status !== 'paid' && bill.dueDate && new Date(bill.dueDate) < new Date();
    }
    
    return matchesSearch;
  });

  // Handle view receipt file
  const handleViewReceipt = (receiptFile) => {
    console.log('handleViewReceipt called with:', receiptFile);
    
    if (!receiptFile) {
      console.error('No receipt file available');
      setSnackbar({
        open: true,
        message: 'No receipt file available for this bill',
        severity: 'error'
      });
      return;
    }
    
    try {
      // Log the original path for debugging
      console.log('Original receipt file path:', receiptFile);
      
      // Normalize path - replace Windows backslashes with forward slashes
      let normalizedPath = receiptFile.replace(/\\/g, '/');
      console.log('Normalized path (backslashes to forward slashes):', normalizedPath);
      
      // Extract just the filename - handle various path formats
      let fileName = normalizedPath;
      
      // If the path contains 'uploads/', we need to extract just the filename
      if (normalizedPath.includes('uploads/')) {
        // The problem might be that we're not removing the entire path correctly
        // Check the exact string format with full details
        console.log('Path contains uploads/. Full string:', JSON.stringify(normalizedPath));
        fileName = normalizedPath.split('uploads/').pop();
        console.log('Extracted after uploads/:', fileName);
      } else if (normalizedPath.includes('/')) {
        fileName = normalizedPath.split('/').pop();
        console.log('Extracted after last /:', fileName);
      } else {
        console.log('Using as-is:', fileName);
      }
      
      // The URL should NOT contain 'uploads/' as that's handled by the server path
      const url = `/api/admin/files/download/${fileName}`;
      console.log('Downloading file from URL:', url);
      
      // Fetch the file and trigger download
      fetch(url, {
        method: 'GET',
        credentials: 'include', // Include cookies for authentication
      })
      .then(response => {
        console.log('Response status:', response.status);
        if (!response.ok) {
          throw new Error(`Failed to download file: ${response.status} ${response.statusText}`);
        }
        return response.blob();
      })
      .then(blob => {
        console.log('Blob received:', blob.type, blob.size);
        // Create URL from blob
        const url = window.URL.createObjectURL(blob);
        
        // Create download link
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName; // Set suggested filename for download
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up URL object
        window.URL.revokeObjectURL(url);
        
        setSnackbar({
          open: true,
          message: 'File download started',
          severity: 'success'
        });
      })
      .catch(error => {
        console.error('Download error:', error);
        setSnackbar({
          open: true,
          message: error.message || 'Error downloading file',
          severity: 'error'
        });
      });
    } catch (error) {
      console.error('Error in handleViewReceipt:', error);
      setSnackbar({
        open: true,
        message: 'An error occurred while attempting to download the file',
        severity: 'error'
      });
    }
  };
  
  // Handle return bill to student (rejects the payment)
  const handleReturnBill = async (billId) => {
    try {
      // API call to return bill
      const response = await fetch(`/api/admin/bills/${billId}/return`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      if (response.ok) {
        setSnackbar({
          open: true,
          message: 'Bill returned to student successfully',
          severity: 'success'
        });
        setOpenReturnDialog(false);
        setOpenBillDetailsDialog(false);
        refreshBills();
      } else {
        const data = await response.json();
        throw new Error(data.message || 'Error returning bill');
      }
    } catch (error) {
      console.error('Error returning bill:', error);
      setSnackbar({
        open: true,
        message: error.message || 'Error returning bill',
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
          maxWidth: '1800px',
          width: '100%',
          mx: 'auto',
        }}
      >
        {/* Dashboard Header */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 4
        }}>
          <Box>
            <Typography variant="h4" sx={{ 
              fontWeight: 700, 
              color: '#fff',
              textShadow: '0 2px 4px rgba(0,0,0,0.2)',
              letterSpacing: '-0.5px',
            }}>
              Billing Management
            </Typography>
            <Typography variant="body2" sx={{ color: '#9CA3AF', mt: 1 }}>
              Create, track, and manage student billing records
            </Typography>
          </Box>
          <Stack direction="row" spacing={2} alignItems="center">
            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={refreshBills}
              sx={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                color: '#fff',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                },
                borderRadius: '10px',
                px: 2,
              }}
            >
              Refresh
            </Button>
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

        {/* Remove cards section and status pills, directly show the search/filter bar */}
        <Card sx={{ 
          mb: 4,
          background: 'linear-gradient(145deg, #141414 0%, #0A0A0A 100%)',
          borderRadius: '20px',
          p: 3,
          border: '1px solid rgba(255, 255, 255, 0.03)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
        }}>
          <Stack 
            direction={{ xs: 'column', md: 'row' }} 
            spacing={2} 
            alignItems={{ xs: 'stretch', md: 'center' }}
            justifyContent="space-between"
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '10px',
                px: 2,
                py: 0.5,
                border: '1px solid rgba(255, 255, 255, 0.08)',
                width: { xs: '100%', md: '320px' },
                maxWidth: '100%',
              }}>
                <SearchIcon sx={{ color: '#9CA3AF', mr: 1 }} />
                <TextField
                  placeholder="Search bills..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  fullWidth
                  variant="standard"
                  InputProps={{
                    disableUnderline: true,
                    sx: {
                      color: '#fff',
                      '&::placeholder': {
                        color: '#9CA3AF',
                        opacity: 1,
                      },
                    }
                  }}
                  sx={{
                    '& .MuiInputBase-input::placeholder': {
                      color: '#9CA3AF',
                      opacity: 1,
                    },
                  }}
                />
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ReceiptLongIcon sx={{ color: '#10B981', fontSize: 22 }} />
                <Typography variant="body1" sx={{ color: '#fff', fontWeight: 600 }}>
                  {bills.length} Bills
                </Typography>
                <Chip 
                  size="small"
                  label={`${bills.filter(bill => bill.status === 'paid').length} Paid`}
                  sx={{ 
                    bgcolor: 'rgba(16, 185, 129, 0.1)', 
                    color: '#fff',
                    fontWeight: 500,
                    ml: 1
                  }}
                />
                <Chip 
                  size="small"
                  label={`${bills.filter(bill => bill.status !== 'paid' && bill.dueDate && new Date(bill.dueDate) < new Date()).length} Past Due`}
                  sx={{ 
                    bgcolor: 'rgba(239, 68, 68, 0.1)', 
                    color: '#EF4444',
                    fontWeight: 500,
                    ml: 1
                  }}
                />
              </Box>
            </Box>

            <Stack direction="row" spacing={2}>
              <Button
                variant="contained"
                startIcon={<HourglassTopIcon />}
                onClick={() => setStatusFilter('pending')}
                sx={{
                  bgcolor: statusFilter === 'pending' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)',
                  color: '#3B82F6',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  '&:hover': {
                    bgcolor: 'rgba(59, 130, 246, 0.2)',
                  },
                  borderRadius: '10px',
                }}
              >
                Pending
              </Button>
              <Button
                variant="contained"
                startIcon={<CheckCircleIcon />}
                onClick={() => setStatusFilter('paid')}
                sx={{
                  bgcolor: statusFilter === 'paid' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.1)',
                  color: '#10B981',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  '&:hover': {
                    bgcolor: 'rgba(16, 185, 129, 0.2)',
                  },
                  borderRadius: '10px',
                }}
              >
                Paid
              </Button>
              <Button
                variant="contained"
                startIcon={<PriorityHighIcon />}
                onClick={() => setStatusFilter('overdue')}
                sx={{
                  bgcolor: statusFilter === 'overdue' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)',
                  color: '#EF4444',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  '&:hover': {
                    bgcolor: 'rgba(239, 68, 68, 0.2)',
                  },
                  borderRadius: '10px',
                }}
              >
                Overdue
              </Button>
              {statusFilter !== 'all' && (
                <Button
                  variant="outlined"
                  onClick={() => setStatusFilter('all')}
                  sx={{
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                    color: '#fff',
                    '&:hover': {
                      bgcolor: 'rgba(255, 255, 255, 0.05)',
                      borderColor: 'rgba(255, 255, 255, 0.3)',
                    },
                    borderRadius: '10px',
                  }}
                >
                  Show All
                </Button>
              )}
            </Stack>
          </Stack>
        </Card>

        {/* Bills Table */}
        <Card sx={{ 
          background: 'linear-gradient(145deg, #141414 0%, #0A0A0A 100%)',
          borderRadius: '20px',
          border: '1px solid rgba(255, 255, 255, 0.03)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
          overflow: 'hidden',
        }}>
          <Box sx={{ 
            p: { xs: 2, md: 3 }, 
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', md: 'center' },
            borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
          }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#fff', letterSpacing: '-0.5px' }}>
                Billing Records
              </Typography>
              <Typography variant="body2" sx={{ color: '#9CA3AF', mt: 0.5 }}>
                {filteredBills.length} bills {searchQuery ? 'found' : 'total'} • {formatCurrency(calculateTotalBillAmount())} total amount
              </Typography>
            </Box>
            
            <Box sx={{ mt: { xs: 2, md: 0 }, display: 'flex', gap: 2 }}>
              <Chip 
                icon={<CheckCircleIcon sx={{ color: '#10B981 !important', fontSize: '1rem' }} />}
                label={`Paid: ${bills.filter(bill => bill.status === 'paid').length}`}
                size="small"
                sx={{ bgcolor: 'rgba(16, 185, 129, 0.1)', color: '#fff' }}
              />
              <Chip 
                icon={<WarningIcon sx={{ color: '#EF4444 !important', fontSize: '1rem' }} />}
                label={`Past Due: ${bills.filter(bill => bill.status !== 'paid' && bill.dueDate && new Date(bill.dueDate) < new Date()).length}`}
                size="small"
                sx={{ bgcolor: 'rgba(239, 68, 68, 0.1)', color: '#fff' }}
              />
            </Box>
          </Box>
          
          {filteredBills.length > 0 ? (
            <TableContainer sx={{ 
              maxHeight: 650,
              '&::-webkit-scrollbar': {
                width: '8px',
                height: '8px',
              },
              '&::-webkit-scrollbar-track': {
                background: 'rgba(0, 0, 0, 0.2)',
                borderRadius: '4px',
              },
              '&::-webkit-scrollbar-thumb': {
                background: 'rgba(59, 130, 246, 0.6)',
                borderRadius: '4px',
                '&:hover': {
                  background: 'rgba(59, 130, 246, 0.8)',
                },
              },
            }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow sx={{ 
                    '& th': { 
                      borderBottom: 'none',
                      position: 'relative',
                      '&:after': {
                        content: '""',
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        bottom: 0,
                        height: '2px',
                        background: 'linear-gradient(90deg, rgba(59, 130, 246, 0.3) 0%, rgba(59, 130, 246, 0.1) 100%)',
                      }
                    } 
                  }}>
                    <TableCell 
                      sx={{
                        backgroundColor: 'rgba(15, 23, 42, 0.98)', 
                        color: '#94A3B8',
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        letterSpacing: '0.5px',
                        textTransform: 'uppercase',
                        py: 2,
                        pl: 2
                      }}
                    >
                      Student
                    </TableCell>
                    <TableCell 
                      sx={{
                        backgroundColor: 'rgba(15, 23, 42, 0.98)', 
                        color: '#94A3B8',
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        letterSpacing: '0.5px',
                        textTransform: 'uppercase',
                        py: 2
                      }}
                    >
                      Room
                    </TableCell>
                    <TableCell 
                      sx={{
                        backgroundColor: 'rgba(15, 23, 42, 0.98)', 
                        color: '#94A3B8',
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        letterSpacing: '0.5px',
                        textTransform: 'uppercase',
                        py: 2
                      }}
                    >
                      Amount
                    </TableCell>
                    <TableCell 
                      sx={{
                        backgroundColor: 'rgba(15, 23, 42, 0.98)', 
                        color: '#94A3B8',
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        letterSpacing: '0.5px',
                        textTransform: 'uppercase',
                        py: 2
                      }}
                    >
                      Due Date
                    </TableCell>
                    <TableCell 
                      sx={{
                        backgroundColor: 'rgba(15, 23, 42, 0.98)', 
                        color: '#94A3B8',
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        letterSpacing: '0.5px',
                        textTransform: 'uppercase',
                        py: 2
                      }}
                    >
                      Status
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                {filteredBills.map((bill, index) => {
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
                    bill.dueDate && new Date(bill.dueDate) < new Date();
                  
                  // Get student initials
                  const studentInitials = studentName
                    .split(' ')
                    .map(part => part.charAt(0))
                    .join('')
                    .substring(0, 2)
                    .toUpperCase();

                  // Get row background color (alternating rows)
                  const isEvenRow = index % 2 === 0;
                  
                  return (
                    <TableRow 
                      key={bill._id}
                      sx={{
                        transition: 'all 0.2s ease',
                        backgroundColor: isEvenRow ? 'rgba(15, 23, 42, 0.4)' : 'transparent',
                        '&:hover': { 
                          backgroundColor: 'rgba(59, 130, 246, 0.08)',
                          transform: 'translateY(-1px)',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                        },
                        position: 'relative',
                        cursor: 'pointer',
                        borderLeft: isPastDue ? '4px solid #EF4444' : '4px solid transparent'
                      }}
                      onClick={() => handleBillDetails(bill)}
                    >
                      <TableCell 
                        sx={{ 
                          color: '#fff',
                          borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
                          py: 2,
                          pl: 2
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar 
                            sx={{ 
                              bgcolor: bill.status === 'paid' 
                                ? 'rgba(16, 185, 129, 0.2)' 
                                : bill.status === 'overdue' || isPastDue
                                  ? 'rgba(239, 68, 68, 0.2)' 
                                  : bill.status === 'partial' 
                                    ? 'rgba(245, 158, 11, 0.2)'
                                    : 'rgba(59, 130, 246, 0.2)',
                              color: bill.status === 'paid' 
                                ? '#10B981' 
                                : bill.status === 'overdue' || isPastDue
                                  ? '#EF4444' 
                                  : bill.status === 'partial' 
                                    ? '#F59E0B'
                                    : '#3B82F6',
                              width: 38,
                              height: 38,
                              fontWeight: 600,
                              fontSize: '0.9rem'
                            }}
                          >
                            {studentInitials}
                          </Avatar>
                          <Box>
                            <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5, color: '#fff' }}>
                              {studentName}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                              ID: {bill._id.substring(0, 8)}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell
                        sx={{ 
                          color: '#fff',
                          borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
                          py: 2
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              fontWeight: 500,
                              px: 1.5,
                              py: 0.5,
                              borderRadius: '4px',
                              backgroundColor: 'rgba(59, 130, 246, 0.15)',
                              color: '#3B82F6',
                              display: 'inline-block',
                              border: '1px solid rgba(59, 130, 246, 0.2)',
                            }}
                          >
                            {roomNumber}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell
                        sx={{ 
                          color: '#fff',
                          borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
                          py: 2
                        }}
                      >
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#fff', fontSize: '0.9rem' }}>
                          {formatCurrency(totalAmount)}
                        </Typography>
                        <Stack direction="row" spacing={0.5} sx={{ mt: 0.5 }}>
                          <Typography variant="caption" sx={{ color: '#10B981', fontSize: '0.7rem' }}>
                            Rent: {formatCurrency(parseFloat(bill.rentalFee || 0))}
                          </Typography>
                          {(parseFloat(bill.waterFee || 0) + parseFloat(bill.electricityFee || 0)) > 0 && (
                            <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '0.7rem' }}>
                              +
                            </Typography>
                          )}
                          {parseFloat(bill.waterFee || 0) > 0 && (
                            <Typography variant="caption" sx={{ color: '#3B82F6', fontSize: '0.7rem' }}>
                              Utilities: {formatCurrency(parseFloat(bill.waterFee || 0) + parseFloat(bill.electricityFee || 0))}
                            </Typography>
                          )}
                        </Stack>
                      </TableCell>
                      <TableCell
                        sx={{ 
                          color: '#fff',
                          borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
                          py: 2
                        }}
                      >
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: isPastDue ? '#EF4444' : '#fff',
                            fontWeight: isPastDue ? 600 : 500,
                            fontSize: '0.85rem'
                          }}
                        >
                          {formattedDueDate}
                        </Typography>
                        {isPastDue && (
                          <Box 
                            sx={{ 
                              mt: 0.5,
                              display: 'inline-flex',
                              alignItems: 'center',
                              backgroundColor: 'rgba(239, 68, 68, 0.15)',
                              borderRadius: '4px',
                              px: 0.75,
                              py: 0.25,
                              border: '1px solid rgba(239, 68, 68, 0.3)',
                            }}
                          >
                            <WarningIcon sx={{ color: '#EF4444', fontSize: 12, mr: 0.5 }} />
                            <Typography variant="caption" sx={{ color: '#EF4444', fontWeight: 600, lineHeight: 1, fontSize: '0.7rem' }}>
                              Past Due
                            </Typography>
                          </Box>
                        )}
                      </TableCell>
                      <TableCell
                        sx={{ 
                          borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
                          py: 2
                        }}
                      >
                        <Box
                          sx={{
                            px: 1.5,
                            py: 0.75,
                            borderRadius: '4px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            bgcolor: 
                              bill.status === 'paid' 
                                ? 'rgba(16, 185, 129, 0.1)'
                                : bill.status === 'pending' 
                                  ? isPastDue 
                                    ? 'rgba(239, 68, 68, 0.1)'
                                    : 'rgba(59, 130, 246, 0.1)'
                                  : bill.status === 'partial' 
                                    ? 'rgba(245, 158, 11, 0.1)'
                                    : 'rgba(239, 68, 68, 0.1)',
                            border: bill.status === 'paid' 
                              ? '1px solid rgba(16, 185, 129, 0.3)'
                              : bill.status === 'pending' 
                                ? isPastDue 
                                  ? '1px solid rgba(239, 68, 68, 0.3)'
                                  : '1px solid rgba(59, 130, 246, 0.3)'
                                : bill.status === 'partial' 
                                  ? '1px solid rgba(245, 158, 11, 0.3)'
                                  : '1px solid rgba(239, 68, 68, 0.3)',
                          }}
                        >
                          {bill.status === 'paid' && <CheckCircleIcon sx={{ color: '#10B981', fontSize: 16, mr: 0.75 }} />}
                          {bill.status === 'pending' && !isPastDue && <HourglassTopIcon sx={{ color: '#3B82F6', fontSize: 16, mr: 0.75 }} />}
                          {bill.status === 'pending' && isPastDue && <WarningIcon sx={{ color: '#EF4444', fontSize: 16, mr: 0.75 }} />}
                          {bill.status === 'partial' && <PaymentsIcon sx={{ color: '#F59E0B', fontSize: 16, mr: 0.75 }} />}
                          {bill.status === 'overdue' && <WarningIcon sx={{ color: '#EF4444', fontSize: 16, mr: 0.75 }} />}
                          <Typography
                            variant="caption"
                            sx={{
                              color: 
                                bill.status === 'paid' 
                                  ? '#10B981'
                                  : bill.status === 'pending' 
                                    ? isPastDue 
                                      ? '#EF4444'
                                      : '#3B82F6'
                                    : bill.status === 'partial' 
                                      ? '#F59E0B'
                                      : '#EF4444',
                              fontWeight: 600,
                              textTransform: 'capitalize',
                              fontSize: '0.75rem'
                            }}
                          >
                            {bill.status === 'pending' && isPastDue ? 'Past Due' : bill.status}
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box sx={{ 
              textAlign: 'center', 
              py: 8,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '400px',
              backgroundColor: 'rgba(0, 0, 0, 0.1)',
              borderRadius: '8px',
              border: '1px dashed rgba(255, 255, 255, 0.1)',
              mx: 3,
              my: 3,
            }}>
              <ReceiptLongIcon sx={{ fontSize: 60, color: 'rgba(255, 255, 255, 0.2)', mb: 2 }} />
              <Typography variant="h6" sx={{ color: '#fff', mb: 1 }}>
                {searchQuery ? 'No Bills Found Matching Your Search' : 'No Bills Found'}
              </Typography>
              <Typography variant="body2" sx={{ color: '#9CA3AF', mb: 3, maxWidth: '400px' }}>
                {searchQuery ? 'Try adjusting your search criteria' : 'Create your first bill by clicking the "New Bill" button above.'}
              </Typography>
              {!searchQuery && (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setOpenDialog(true)}
                  sx={{
                    background: 'linear-gradient(90deg, #10B981 0%, #059669 100%)',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)',
                    borderRadius: '8px',
                    px: 3,
                    py: 1,
                  }}
                >
                  Create First Bill
                </Button>
              )}
              {searchQuery && (
                <Button
                  variant="outlined"
                  onClick={() => setSearchQuery('')}
                  sx={{
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                    color: '#fff',
                    borderRadius: '8px',
                    px: 3,
                    py: 1,
                    '&:hover': {
                      borderColor: 'rgba(255, 255, 255, 0.3)',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    }
                  }}
                >
                  Clear Search
                </Button>
              )}
            </Box>
          )}
        </Card>

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

        {/* Bill Details Dialog */}
        <Dialog 
          open={openBillDetailsDialog} 
          onClose={handleCloseBillDetailsDialog}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              background: 'linear-gradient(145deg, #141414 0%, #0A0A0A 100%)',
              color: '#fff',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.03)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
              overflow: 'hidden',
            }
          }}
        >
          {selectedBill && (
            <>
              <DialogTitle sx={{ 
                borderBottom: '1px solid rgba(255,255,255,0.03)',
                background: 'linear-gradient(90deg, rgba(59, 130, 246, 0.1) 0%, transparent 100%)',
                py: 2,
              }}>
                <Typography variant="h6" sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  gap: 1,
                  color: '#fff',
                }}>
                  <DescriptionIcon sx={{ color: '#3B82F6' }} />
                  Bill Details - #{selectedBill._id.substring(0, 8)}
                </Typography>
              </DialogTitle>
              
              <DialogContent sx={{ mt: 2 }}>
                <Box sx={{ display: 'grid', gap: 3 }}>
                  {/* Status and Amount Section */}
                  <Box>
                    <Typography variant="subtitle1" sx={{ 
                      color: '#3B82F6', 
                      mb: 2,
                      borderBottom: '1px solid rgba(59, 130, 246, 0.2)',
                      pb: 1,
                    }}>
                      Payment Status
                    </Typography>
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Box
                            sx={{
                              width: 48,
                              height: 48,
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              bgcolor: 
                                selectedBill.status === 'paid' 
                                  ? 'rgba(16, 185, 129, 0.15)'
                                  : selectedBill.status === 'pending' 
                                    ? 'rgba(14, 165, 233, 0.15)'
                                    : selectedBill.status === 'partial' 
                                      ? 'rgba(245, 158, 11, 0.15)'
                                      : 'rgba(239, 68, 68, 0.15)',
                              mr: 2
                            }}
                          >
                            {selectedBill.status === 'paid' && <CheckCircleIcon sx={{ color: '#10B981', fontSize: 24 }} />}
                            {selectedBill.status === 'pending' && <HourglassTopIcon sx={{ color: '#0EA5E9', fontSize: 24 }} />}
                            {selectedBill.status === 'partial' && <PaymentsIcon sx={{ color: '#F59E0B', fontSize: 24 }} />}
                            {selectedBill.status === 'overdue' && <WarningIcon sx={{ color: '#EF4444', fontSize: 24 }} />}
                          </Box>
                          <Box>
                            <Typography variant="body2" sx={{ color: '#9CA3AF' }}>Status</Typography>
                            <Typography
                              variant="body1"
                              sx={{
                                color: 
                                  selectedBill.status === 'paid' 
                                    ? '#10B981'
                                    : selectedBill.status === 'pending' 
                                      ? '#0EA5E9'
                                      : selectedBill.status === 'partial' 
                                        ? '#F59E0B'
                                        : '#EF4444',
                                fontWeight: 600,
                                textTransform: 'capitalize',
                              }}
                            >
                              {selectedBill.status}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography variant="body2" sx={{ color: '#9CA3AF' }}>Total Amount</Typography>
                        <Typography variant="h5" sx={{ fontWeight: 700 }}>
                          {formatCurrency(parseFloat(selectedBill.rentalFee || 0) + 
                            parseFloat(selectedBill.waterFee || 0) + 
                            parseFloat(selectedBill.electricityFee || 0) +
                            (selectedBill.otherFees || []).reduce((sum, fee) => sum + parseFloat(fee.amount || 0), 0))}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>
                  
                  {/* Student Details Section */}
                  <Box>
                    <Typography variant="subtitle1" sx={{ 
                      color: '#3B82F6', 
                      mb: 2,
                      borderBottom: '1px solid rgba(59, 130, 246, 0.2)',
                      pb: 1,
                    }}>
                      Student Information
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Avatar 
                            sx={{ 
                              bgcolor: 'rgba(59, 130, 246, 0.15)',
                              color: '#3B82F6',
                              fontWeight: 600,
                              mr: 2,
                              width: 40,
                              height: 40
                            }}
                          >
                            {(selectedBill.student && typeof selectedBill.student === 'object' 
                              ? selectedBill.student.name 
                              : students.find(s => s._id === selectedBill.student)?.name || 'Unknown')
                              .split(' ')
                              .map(part => part.charAt(0))
                              .join('')
                              .substring(0, 2)
                              .toUpperCase()}
                          </Avatar>
                          <Box>
                            <Typography variant="body1" sx={{ fontWeight: 600 }}>
                              {selectedBill.student && typeof selectedBill.student === 'object' 
                                ? selectedBill.student.name 
                                : students.find(s => s._id === selectedBill.student)?.name || 'Unknown'}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" sx={{ color: '#9CA3AF' }}>Student ID</Typography>
                        <Typography variant="body1" sx={{ color: '#fff' }}>
                          {selectedBill.student && typeof selectedBill.student === 'object' 
                            ? selectedBill.student.studentDormNumber 
                            : students.find(s => s._id === selectedBill.student)?.studentDormNumber || 'Unknown'}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" sx={{ color: '#9CA3AF' }}>Email</Typography>
                        <Typography variant="body1" sx={{ color: '#fff' }}>
                          {selectedBill.student && typeof selectedBill.student === 'object' 
                            ? selectedBill.student.email 
                            : students.find(s => s._id === selectedBill.student)?.email || 'Unknown'}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>
                  
                  {/* Room Information Section */}
                  <Box>
                    <Typography variant="subtitle1" sx={{ 
                      color: '#3B82F6', 
                      mb: 2,
                      borderBottom: '1px solid rgba(59, 130, 246, 0.2)',
                      pb: 1,
                    }}>
                      Room Information
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body2" sx={{ color: '#9CA3AF' }}>Building</Typography>
                        <Typography variant="body1" sx={{ color: '#fff' }}>
                          {selectedBill.buildingName || 'Not specified'}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" sx={{ color: '#9CA3AF' }}>Room Number</Typography>
                        <Typography variant="body1" sx={{ color: '#fff' }}>
                          {selectedBill.roomNumber || 'Not specified'}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>
                  
                  {/* Billing Period Section */}
                  <Box>
                    <Typography variant="subtitle1" sx={{ 
                      color: '#3B82F6', 
                      mb: 2,
                      borderBottom: '1px solid rgba(59, 130, 246, 0.2)',
                      pb: 1,
                    }}>
                      Billing Period
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body2" sx={{ color: '#9CA3AF' }}>Start Date</Typography>
                        <Typography variant="body1" sx={{ color: '#fff' }}>
                          {selectedBill.billingPeriodStart
                            ? new Date(selectedBill.billingPeriodStart).toLocaleDateString('en-US', { 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                              })
                            : 'Not set'}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" sx={{ color: '#9CA3AF' }}>Due Date</Typography>
                        <Typography 
                          variant="body1" 
                          sx={{ 
                            fontWeight: 500,
                            color: selectedBill.status !== 'paid' && 
                              selectedBill.dueDate && 
                              new Date(selectedBill.dueDate) < new Date() ? '#EF4444' : '#fff',
                          }}
                        >
                          {selectedBill.dueDate
                            ? new Date(selectedBill.dueDate).toLocaleDateString('en-US', { 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                              })
                            : 'Not set'}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>
                  
                  {/* Bill Breakdown Section */}
                  <Box>
                    <Typography variant="subtitle1" sx={{ 
                      color: '#3B82F6', 
                      mb: 2,
                      borderBottom: '1px solid rgba(59, 130, 246, 0.2)',
                      pb: 1,
                    }}>
                      Bill Breakdown
                    </Typography>
                    <TableContainer sx={{ 
                      mb: 2,
                      background: 'linear-gradient(145deg, #161616 0%, #101010 100%)',
                      borderRadius: '12px',
                      border: '1px solid rgba(255, 255, 255, 0.03)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      overflow: 'auto',
                    }}>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ 
                              color: '#fff',
                              borderBottom: '1px solid rgba(255,255,255,0.05)',
                              background: 'linear-gradient(90deg, rgba(59, 130, 246, 0.1) 0%, transparent 100%)',
                              py: 1.5,
                              fontSize: '0.75rem',
                              fontWeight: 'bold'
                            }}>
                              Description
                            </TableCell>
                            <TableCell align="right" sx={{ 
                              color: '#fff',
                              borderBottom: '1px solid rgba(255,255,255,0.05)',
                              background: 'linear-gradient(90deg, rgba(59, 130, 246, 0.1) 0%, transparent 100%)',
                              py:.5,
                              fontSize: '0.75rem',
                              fontWeight: 'bold'
                            }}>
                              Amount
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          <TableRow>
                            <TableCell sx={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', padding: '12px 16px' }}>
                              <Typography variant="body2" sx={{ color: '#fff' }}>Rental Fee</Typography>
                              <Typography variant="caption" sx={{ color: '#fff' }}>
                                Room {selectedBill.roomNumber || 'N/A'}
                              </Typography>
                            </TableCell>
                            <TableCell align="right" sx={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', padding: '12px 16px', color: '#fff' }}>
                              {formatCurrency(parseFloat(selectedBill.rentalFee || 0))}
                            </TableCell>
                          </TableRow>
                          
                          {parseFloat(selectedBill.waterFee || 0) > 0 && (
                            <TableRow>
                              <TableCell sx={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', padding: '12px 16px' }}>
                                <Typography variant="body2" sx={{ color: '#fff' }}>Water Fee</Typography>
                              </TableCell>
                              <TableCell align="right" sx={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', padding: '12px 16px', color: '#fff' }}>
                                {formatCurrency(parseFloat(selectedBill.waterFee || 0))}
                              </TableCell>
                            </TableRow>
                          )}
                          
                          {parseFloat(selectedBill.electricityFee || 0) > 0 && (
                            <TableRow>
                              <TableCell sx={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', padding: '12px 16px' }}>
                                <Typography variant="body2" sx={{ color: '#fff' }}>Electricity Fee</Typography>
                              </TableCell>
                              <TableCell align="right" sx={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', padding: '12px 16px', color: '#fff' }}>
                                {formatCurrency(parseFloat(selectedBill.electricityFee || 0))}
                              </TableCell>
                            </TableRow>
                          )}
                          
                          {(selectedBill.otherFees || []).map((fee, index) => (
                            <TableRow key={index}>
                              <TableCell sx={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', padding: '12px 16px' }}>
                                <Typography variant="body2" sx={{ color: '#fff' }}>{fee.description || 'Additional Fee'}</Typography>
                              </TableCell>
                              <TableCell align="right" sx={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', padding: '12px 16px', color: '#fff' }}>
                                {formatCurrency(parseFloat(fee.amount || 0))}
                              </TableCell>
                            </TableRow>
                          ))}
                          
                          <TableRow>
                            <TableCell sx={{ 
                              borderBottom: 'none', 
                              padding: '12px 16px',
                              fontWeight: 600
                            }}>
                              <Typography variant="subtitle2" sx={{ color: '#fff' }}>Total</Typography>
                            </TableCell>
                            <TableCell align="right" sx={{ 
                              borderBottom: 'none', 
                              padding: '12px 16px',
                              fontWeight: 700,
                              color: '#fff'
                            }}>
                              <Typography variant="subtitle1" sx={{ color: '#fff' }}>
                                {formatCurrency(parseFloat(selectedBill.rentalFee || 0) + 
                                  parseFloat(selectedBill.waterFee || 0) + 
                                  parseFloat(selectedBill.electricityFee || 0) +
                                  (selectedBill.otherFees || []).reduce((sum, fee) => sum + parseFloat(fee.amount || 0), 0))}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>
                    
                    {selectedBill.notes && (
                      <Box sx={{ 
                        p: 2,
                        borderRadius: '8px',
                        bgcolor: 'rgba(0, 0, 0, 0.2)',
                        border: '1px solid rgba(255, 255, 255, 0.05)'
                      }}>
                        <Typography variant="subtitle2" sx={{ color: '#9CA3AF', mb: 1 }}>
                          Notes
                        </Typography>
                        <Typography variant="body2">
                          {selectedBill.notes}
                        </Typography>
                      </Box>
                    )}
                    
                    {/* Receipt File Section */}
                    {selectedBill.receiptFile && (
                      <Box sx={{ mt: 3 }}>
                        <Typography variant="subtitle1" sx={{ 
                          color: '#3B82F6', 
                          mb: 2,
                          borderBottom: '1px solid rgba(59, 130, 246, 0.2)',
                          pb: 1,
                        }}>
                          Payment Receipt
                        </Typography>
                        <Paper sx={{ 
                          p: 2, 
                          borderRadius: '8px',
                          bgcolor: 'rgba(59, 130, 246, 0.05)',
                          border: '1px solid rgba(59, 130, 246, 0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <ReceiptLongIcon sx={{ color: '#3B82F6', mr: 2, fontSize: 28 }} />
                            <Box>
                              <Typography variant="body2" sx={{ color: '#fff' }}>
                                Payment Receipt Uploaded
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#9CA3AF' }}>
                                {selectedBill.receiptFile.split('/').pop()}
                              </Typography>
                            </Box>
                          </Box>
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<VisibilityIcon />}
                            onClick={() => handleViewReceipt(selectedBill.receiptFile)}
                            sx={{
                              borderColor: 'rgba(59, 130, 246, 0.5)',
                              color: '#3B82F6',
                              '&:hover': {
                                borderColor: '#3B82F6',
                                bgcolor: 'rgba(59, 130, 246, 0.1)'
                              }
                            }}
                          >
                            View Receipt
                          </Button>
                        </Paper>
                      </Box>
                    )}
                  </Box>
                </Box>
              </DialogContent>
              
              <DialogActions sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,0.03)', bgcolor: 'rgba(0, 0, 0, 0.2)' }}>
                <Typography variant="body2" sx={{ color: '#9CA3AF', flexGrow: 1 }}>
                  Last updated: {selectedBill.updatedAt ? new Date(selectedBill.updatedAt).toLocaleString() : 'Unknown'}
                </Typography>
                
                  {/* Return Bill button opens custom confirmation dialog */}
                  <Tooltip title="Return bill to student and reject payment">
                    <Button
                      variant="outlined"
                      color="warning"
                      onClick={() => setOpenReturnDialog(true)}
                      sx={{
                        borderColor: 'rgba(245, 158, 11, 0.5)',
                        color: '#F59E0B',
                        mr: 1,
                        '&:hover': {
                          borderColor: '#F59E0B',
                          bgcolor: 'rgba(245, 158, 11, 0.1)'
                        }
                      }}
                    >
                      Return Bill
                    </Button>
                  </Tooltip>
                
                <Button
                  variant="contained"
                  onClick={handleCloseBillDetailsDialog}
                  sx={{
                    background: 'linear-gradient(90deg, #3B82F6 0%, #2563EB 100%)',
                    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2)',
                    color: '#fff',
                    '&:hover': {
                      background: 'linear-gradient(90deg, #2563EB 0%, #1D4ED8 100%)',
                      transform: 'translateY(-1px)',
                      boxShadow: '0 6px 15px rgba(59, 130, 246, 0.3)',
                    }
                  }}
                >
                  Close
                </Button>
              </DialogActions>
            </>
          )}
        </Dialog>

        {/* Confirmation dialog for returning bill */}
        <MuiDialog
          open={openReturnDialog}
          onClose={() => setOpenReturnDialog(false)}
          PaperProps={{
            sx: {
              background: 'linear-gradient(145deg, #141414 0%, #101010 100%)',
              borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.05)',
              color: '#fff',
              maxWidth: '400px'
            }
          }}
        >
          <MuiDialogTitle
            sx={{
              background: 'rgba(245,158,11,0.1)',
              color: '#F59E0B',
              fontWeight: 600,
              py: 2,
              fontSize: '1.25rem'
            }}
          >
            Return Bill?
          </MuiDialogTitle>
          <MuiDialogContent sx={{ px: 3, py: 2, color: '#fff' }}>
            <Typography>
              Are you sure you want to return this bill to the student? This will reject their payment.
            </Typography>
          </MuiDialogContent>
          <MuiDialogActions
            sx={{
              px: 3,
              py: 2,
              borderTop: '1px solid rgba(255,255,255,0.03)',
              background: 'rgba(0,0,0,0.2)'
            }}
          >
            <Button
              onClick={() => setOpenReturnDialog(false)}
              sx={{ color: '#9CA3AF' }}
            >Cancel</Button>
            <Button
              variant="contained"
              color="warning"
              onClick={() => handleReturnBill(selectedBill._id)}
              sx={{
                background: 'linear-gradient(90deg, #F59E0B 0%, #D97706 100%)',
                color: '#000',
                '&:hover': {
                  background: 'linear-gradient(90deg, #D97706 0%, #B45309 100%)'
                }
              }}
            >
              Return Bill
            </Button>
          </MuiDialogActions>
        </MuiDialog>
      </Box>
    </Box>
  );
};

export default AdminBill;

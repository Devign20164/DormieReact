import React, { useState, useEffect, useContext, useCallback } from 'react';
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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Snackbar,
  Alert,
  Stack,
  useTheme,
  Grid,
  Divider
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
} from '@mui/icons-material';
import AdminSidebar from '../components/AdminSidebar';
import NotificationBell from '../components/NotificationBell';
import { ThemeContext } from '../App';

// Color constants
const EGGSHELL_WHITE = "#F0EAD6";
const EMERALD_GREEN = "#50C878";
const DARK_EMERALD = "#2E8B57";

const AdminApplicants = () => {
  const { mode } = useContext(ThemeContext);
  const theme = useTheme();

  const [applicants, setApplicants] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const [buildings, setBuildings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [openApproveDialog, setOpenApproveDialog] = useState(false);
  const [openDeclineDialog, setOpenDeclineDialog] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState('');
  const [selectedRoom, setSelectedRoom] = useState('');
  const [declineReason, setDeclineReason] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [approveStep, setApproveStep] = useState(0);

  // Fetch applicants
  const fetchApplicants = useCallback(async () => {
    try {
      console.log('Fetching applicants...');
      const response = await fetch('/api/admin/applicants?status=Pending,Declined');
      if (!response.ok) {
        throw new Error('Failed to fetch applicants');
      }
      const data = await response.json();
      console.log('Fetched applicants:', data);
      setApplicants(data);
    } catch (error) {
      console.error('Error fetching applicants:', error);
      showSnackbar('Error fetching applicants', 'error');
    }
  }, []);

  // Add useEffect to fetch applicants on component mount
  useEffect(() => {
    console.log('Component mounted, fetching applicants...');
    fetchApplicants();
  }, [fetchApplicants]);

  // Fetch buildings when approve dialog opens
  useEffect(() => {
    if (openApproveDialog && selectedApplicant) {
      const gender = selectedApplicant.gender;
      if (gender) {
        fetchBuildings(gender);
      }
    }
  }, [openApproveDialog, selectedApplicant]);

  // Fetch rooms when building is selected
  useEffect(() => {
    if (selectedBuilding && selectedApplicant) {
      const roomTypePreference = selectedApplicant.preferences?.occupancyPreference;
      if (roomTypePreference) {
        fetchRooms(selectedBuilding, roomTypePreference);
      }
    }
  }, [selectedBuilding]);

  const fetchBuildings = async (gender) => {
    try {
      // Convert gender preference to match building type format
      const buildingType = gender === 'Male Building' ? 'Male' : 'Female';
      console.log('Fetching buildings for type:', buildingType);
      console.log('Selected applicant:', selectedApplicant);
                  
      const response = await fetch(`/api/admin/buildings?type=${buildingType}`);
      const data = await response.json();
      console.log('Fetched buildings:', data);
      setBuildings(data);

      // Log the current state after setting
      setTimeout(() => {
        console.log('Current buildings state:', buildings);
        console.log('Current filtered buildings:', filteredBuildings);
      }, 100);
    } catch (error) {
      console.error('Error fetching buildings:', error);
      showSnackbar('Error fetching buildings', 'error');
    }
  };

  // Update the building selection to use gender
  const filteredBuildings = buildings.filter(building => {
    console.log('Filtering building:', building.name, 'Type:', building.type, 'Against preference:', selectedApplicant?.preferences?.buildingPreference);
    
    // Convert building preference to match building type format
    const preferredBuildingType = selectedApplicant?.preferences?.buildingPreference?.split(' ')[0]; // 'Male Building' -> 'Male'
    console.log('Converted building preference:', preferredBuildingType);
    
    const matches = building.type === preferredBuildingType;
    console.log('Building matches:', matches);
    return matches;
  });

  // Add useEffect to log when buildings or selectedApplicant changes
  useEffect(() => {
    console.log('Buildings or selectedApplicant changed:');
    console.log('Buildings:', buildings);
    console.log('Selected Applicant:', selectedApplicant);
    console.log('Filtered Buildings:', filteredBuildings);
  }, [buildings, selectedApplicant]);

  const fetchRooms = async (buildingId, roomType) => {
    try {
      // Map occupancy preference to room type
      const type = roomType === 'Single Occupancy' ? 'Single' : 
                  roomType === 'Double Occupancy' ? 'Double' : roomType;

      console.log('Fetching rooms with:', {
        buildingId,
        roomType: type,
        originalPreference: roomType
      });

      const response = await fetch(`/api/admin/rooms?buildingId=${buildingId}&type=${type}&status=Available`);
      const data = await response.json();
      console.log('Fetched rooms:', data);
      
      if (data.length === 0) {
        console.log('No available rooms found for the selected criteria');
      }
      
      setRooms(data);
    } catch (error) {
      console.error('Error fetching rooms:', error);
      showSnackbar('Error fetching rooms', 'error');
    }
  };

  // Filter applicants based on search term and status
  const filteredApplicants = applicants.filter(applicant => {
    console.log('Filtering applicant:', applicant);
    const matchesSearch = applicant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         applicant.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         applicant.studentDormNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Show if matches approvalStatus filter, or if studentStatus is Inactive
    const matchesStatus =
      statusFilter === 'all'
        ? (['Pending', 'Declined'].includes(applicant.approvalStatus) || applicant.studentStatus === 'Inactive')
        : statusFilter === 'Inactive'
          ? applicant.studentStatus === 'Inactive'
          : applicant.approvalStatus === statusFilter;

    console.log('Matches search:', matchesSearch, 'Matches status:', matchesStatus);
    return matchesSearch && matchesStatus;
  });

  console.log('Filtered applicants:', filteredApplicants);

  const handleApproveClick = (applicant) => {
    setSelectedApplicant(applicant);
    setApproveStep(0);
    setOpenApproveDialog(true);
  };

  const handleDeclineClick = (applicant) => {
    setSelectedApplicant(applicant);
    setOpenDeclineDialog(true);
  };

  const handleApproveNext = () => {
    setApproveStep(1);
  };

  const handleApproveBack = () => {
    setApproveStep(0);
  };

  const handleApproveSubmit = async () => {
    try {
      const response = await fetch(`/api/admin/applicants/${selectedApplicant._id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          buildingId: selectedBuilding,
          roomId: selectedRoom,
          password: 'Password123', // Set default password that will be hashed by the model middleware
        }),
      });

      if (response.ok) {
        setOpenApproveDialog(false);
        fetchApplicants();
        showSnackbar('Applicant approved successfully. Default password is: Password123', 'success');
        // Reset states
        setSelectedApplicant(null);
        setSelectedBuilding('');
        setSelectedRoom('');
      }
    } catch (error) {
      console.error('Error approving applicant:', error);
      showSnackbar('Error approving applicant', 'error');
    }
  };

  const handleDeclineSubmit = async () => {
    try {
      const response = await fetch(`/api/admin/applicants/${selectedApplicant._id}/decline`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: declineReason,
        }),
      });

      if (response.ok) {
        setOpenDeclineDialog(false);
        fetchApplicants();
        showSnackbar('Applicant declined successfully', 'success');
        // Reset states
        setSelectedApplicant(null);
        setDeclineReason('');
      }
    } catch (error) {
      console.error('Error declining applicant:', error);
      showSnackbar('Error declining applicant', 'error');
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({
      open: true,
      message,
      severity,
    });
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
              Applicants Management
            </Typography>
            <Typography variant="body2" sx={{ 
              color: mode === 'dark' ? '#6B7280' : '#1D503A',
              mt: 1 
            }}>
              Manage dormitory applications and approvals
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
          </Stack>
        </Box>

        {/* Search and Filter Section */}
        <Box sx={{ 
          mb: 3,
          display: 'flex',
          gap: 2,
          flexWrap: 'wrap'
        }}>
          <TextField
            placeholder="Search by name, email, or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{
              flex: 1,
              minWidth: '250px',
              '& .MuiOutlinedInput-root': {
                backgroundColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.7)',
                '& fieldset': {
                  borderColor: mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(29, 80, 58, 0.5)',
                },
                '&:hover fieldset': {
                  borderColor: mode === 'dark' ? 'rgba(16, 185, 129, 0.5)' : 'rgba(29, 80, 58, 0.8)',
                },
                '&.Mui-focused fieldset': {
                  borderColor: mode === 'dark' ? '#10B981' : '#1D503A',
                }
              },
              '& .MuiInputBase-input': {
                color: mode === 'dark' ? '#fff' : '#000',
              }
            }}
          />
          <FormControl sx={{ minWidth: '150px' }}>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              displayEmpty
              sx={{
                backgroundColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.7)',
                color: mode === 'dark' ? '#fff' : '#000',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(29, 80, 58, 0.5)',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: mode === 'dark' ? 'rgba(16, 185, 129, 0.5)' : 'rgba(29, 80, 58, 0.8)',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: mode === 'dark' ? '#10B981' : '#1D503A',
                }
              }}
            >
              <MenuItem value="all">All Status</MenuItem>
              <MenuItem value="Pending">Pending</MenuItem>
              <MenuItem value="Declined">Declined</MenuItem>
              <MenuItem value="Inactive">Inactive</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Applicants Table */}
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
                }}>Gender Preference</TableCell>
                <TableCell sx={{ 
                  color: mode === 'dark' ? '#fff' : '#000',
                  borderBottom: mode === 'dark'
                    ? '1px solid rgba(255,255,255,0.05)'
                    : '1px solid #1D503A',
                  background: mode === 'dark'
                    ? 'linear-gradient(90deg, rgba(16, 185, 129, 0.1) 0%, transparent 100%)'
                    : 'linear-gradient(90deg, rgba(29, 80, 58, 0.1) 0%, transparent 100%)',
                }}>Room Preference</TableCell>
                <TableCell sx={{ 
                  color: mode === 'dark' ? '#fff' : '#000',
                  borderBottom: mode === 'dark'
                    ? '1px solid rgba(255,255,255,0.05)'
                    : '1px solid #1D503A',
                  background: mode === 'dark'
                    ? 'linear-gradient(90deg, rgba(16, 185, 129, 0.1) 0%, transparent 100%)'
                    : 'linear-gradient(90deg, rgba(29, 80, 58, 0.1) 0%, transparent 100%)',
                }}>Approval Status</TableCell>
                <TableCell sx={{ 
                  color: mode === 'dark' ? '#fff' : '#000',
                  borderBottom: mode === 'dark'
                    ? '1px solid rgba(255,255,255,0.05)'
                    : '1px solid #1D503A',
                  background: mode === 'dark'
                    ? 'linear-gradient(90deg, rgba(16, 185, 129, 0.1) 0%, transparent 100%)'
                    : 'linear-gradient(90deg, rgba(29, 80, 58, 0.1) 0%, transparent 100%)',
                }}>Student Status</TableCell>
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
              {filteredApplicants.length > 0 ? (
                filteredApplicants.map((applicant) => (
                  <TableRow 
                    key={applicant._id}
                    sx={{
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        background: mode === 'dark' ? 'rgba(16, 185, 129, 0.05)' : 'rgba(16, 185, 129, 0.02)',
                      },
                      '& td': {
                        borderBottom: mode === 'dark'
                          ? '1px solid rgba(255,255,255,0.03)'
                          : '1px solid rgba(29, 80, 58, 0.1)',
                      }
                    }}
                  >
                    <TableCell sx={{ color: '#D1D5DB' }}>{applicant.name}</TableCell>
                    <TableCell sx={{ color: '#D1D5DB' }}>{applicant.email}</TableCell>
                    <TableCell sx={{ color: '#D1D5DB' }}>{applicant.preferences?.gender || 'Not specified'}</TableCell>
                    <TableCell sx={{ color: '#D1D5DB' }}>{applicant.preferences?.occupancyPreference || 'Not specified'}</TableCell>
                    <TableCell sx={{ color: '#D1D5DB' }}>{applicant.approvalStatus}</TableCell>
                    <TableCell sx={{ color: '#D1D5DB' }}>{applicant.studentStatus}</TableCell>
                    <TableCell>
                      {applicant.approvalStatus === 'Pending' && (
                        <>
                          <Button
                            variant="contained"
                            sx={{
                              mr: 1,
                              background: 'linear-gradient(90deg, #10B981 0%, #059669 100%)',
                              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)',
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                transform: 'translateY(-1px)',
                                boxShadow: '0 6px 15px rgba(16, 185, 129, 0.3)',
                                background: 'linear-gradient(90deg, #059669 0%, #047857 100%)',
                              },
                            }}
                            onClick={() => handleApproveClick(applicant)}
                          >
                            Approve
                          </Button>
                          <Button
                            variant="contained"
                            onClick={() => handleDeclineClick(applicant)}
                            sx={{
                              background: 'linear-gradient(90deg, #EF4444 0%, #DC2626 100%)',
                              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)',
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                transform: 'translateY(-1px)',
                                boxShadow: '0 6px 15px rgba(239, 68, 68, 0.3)',
                                background: 'linear-gradient(90deg, #DC2626 0%, #B91C1C 100%)',
                              },
                            }}
                          >
                            Decline
                          </Button>
                        </>
                      )}
                      {applicant.approvalStatus === 'Inactive' && (
                        <Typography sx={{ color: '#F59E0B' }}>
                          Inactive
                        </Typography>
                      )}
                      {applicant.approvalStatus === 'Declined' && (
                        <Typography sx={{ color: '#EF4444' }}>
                          Declined
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} sx={{ textAlign: 'center', py: 8 }}>
                    <Box sx={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center',
                      gap: 2 
                    }}>
                      <Typography variant="h6" sx={{ 
                        color: mode === 'dark' ? '#9CA3AF' : '#1D503A',
                        fontWeight: 500 
                      }}>
                        No applicants found
                      </Typography>
                      <Typography variant="body2" sx={{ 
                        color: mode === 'dark' ? '#6B7280' : '#2D3748',
                        maxWidth: '400px',
                        textAlign: 'center' 
                      }}>
                        {searchTerm 
                          ? "No applicants match your search criteria. Try adjusting your search terms."
                          : "There are no pending or rejected applications at the moment."}
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Approve Dialog */}
        <Dialog 
          open={openApproveDialog} 
          onClose={() => {
            setOpenApproveDialog(false);
            setApproveStep(0);
          }}
          PaperProps={{
            sx: {
              background: mode === 'dark'
                ? 'linear-gradient(145deg, #141414 0%, #0A0A0A 100%)'
                : '#FAF5EE',
              color: mode === 'dark' ? '#fff' : '#1D503A',
              borderRadius: '20px',
              border: mode === 'dark'
                ? '1px solid rgba(255, 255, 255, 0.03)'
                : '1px solid #1D503A',
              boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
              minWidth: '800px',
              maxHeight: '90vh',
            }
          }}
        >
          <DialogTitle sx={{ 
            borderBottom: mode === 'dark'
              ? '1px solid rgba(255,255,255,0.03)'
              : '1px solid #1D503A',
            background: mode === 'dark'
              ? 'linear-gradient(90deg, rgba(16, 185, 129, 0.1) 0%, transparent 100%)'
              : 'linear-gradient(90deg, rgba(29, 80, 58, 0.1) 0%, transparent 100%)',
            color: mode === 'dark' ? '#fff' : '#1D503A',
            py: 2,
          }}>
            {approveStep === 0 ? 'Review Application' : 'Assign Room'}
          </DialogTitle>
          <DialogContent sx={{ 
            p: 3,
            overflowY: 'auto',
            '&::-webkit-scrollbar': {
              width: '8px',
            },
            '&::-webkit-scrollbar-track': {
              background: mode === 'dark' 
                ? 'rgba(0, 0, 0, 0.2)'
                : 'rgba(29, 80, 58, 0.1)',
              borderRadius: '4px',
              margin: '8px 0',
            },
            '&::-webkit-scrollbar-thumb': {
              background: mode === 'dark'
                ? 'rgba(16, 185, 129, 0.6)'
                : 'rgba(29, 80, 58, 0.5)',
              borderRadius: '4px',
              '&:hover': {
                background: mode === 'dark'
                  ? 'rgba(16, 185, 129, 0.8)'
                  : 'rgba(29, 80, 58, 0.7)',
              },
            },
            scrollbarWidth: 'thin',
            scrollbarColor: mode === 'dark'
              ? 'rgba(16, 185, 129, 0.6) rgba(0, 0, 0, 0.2)'
              : 'rgba(29, 80, 58, 0.5) rgba(29, 80, 58, 0.1)',
          }}>
            {approveStep === 0 ? (
              <Grid container spacing={3}>
                {/* Basic Information Section */}
                <Grid item xs={12}>
                  <Typography variant="h6" sx={{ 
                    color: mode === 'dark' ? '#fff' : '#1D503A',
                    fontWeight: 600,
                    mb: 2 
                  }}>
                    Basic Information
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography><strong>Name:</strong> {selectedApplicant?.name}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography><strong>Email:</strong> {selectedApplicant?.email}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography><strong>Contact Info:</strong> {selectedApplicant?.contactInfo}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography><strong>Gender:</strong> {selectedApplicant?.gender}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography><strong>Age:</strong> {selectedApplicant?.age}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography><strong>Address:</strong> {selectedApplicant?.address}</Typography>
                    </Grid>
                  </Grid>
                </Grid>

                {/* Personal Background Section */}
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" sx={{ 
                    color: mode === 'dark' ? '#fff' : '#1D503A',
                    fontWeight: 600,
                    mb: 2 
                  }}>
                    Personal Background
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography><strong>Citizenship Status:</strong> {selectedApplicant?.citizenshipStatus}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography><strong>Religion:</strong> {selectedApplicant?.religion}</Typography>
                    </Grid>
                  </Grid>
                </Grid>

                {/* Family Information Section */}
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" sx={{ 
                    color: mode === 'dark' ? '#fff' : '#1D503A',
                    fontWeight: 600,
                    mb: 2 
                  }}>
                    Family Information
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>Father's Information</Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography><strong>Name:</strong> {selectedApplicant?.fatherName}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography><strong>Contact:</strong> {selectedApplicant?.fatherContact}</Typography>
                        </Grid>
                      </Grid>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, mt: 2 }}>Mother's Information</Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography><strong>Name:</strong> {selectedApplicant?.motherName}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography><strong>Contact:</strong> {selectedApplicant?.motherContact}</Typography>
                        </Grid>
                      </Grid>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography sx={{ mt: 1 }}><strong>Parents' Address:</strong> {selectedApplicant?.parentsAddress}</Typography>
                    </Grid>
                  </Grid>
                </Grid>

                {/* Emergency Contact Section */}
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" sx={{ 
                    color: mode === 'dark' ? '#fff' : '#1D503A',
                    fontWeight: 600,
                    mb: 2 
                  }}>
                    Emergency Contact
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography><strong>Name:</strong> {selectedApplicant?.emergencyContact?.name}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography><strong>Contact:</strong> {selectedApplicant?.emergencyContact?.number}</Typography>
                    </Grid>
                  </Grid>
                </Grid>

                {/* School Information Section */}
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" sx={{ 
                    color: mode === 'dark' ? '#fff' : '#1D503A',
                    fontWeight: 600,
                    mb: 2 
                  }}>
                    School Information
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography><strong>Student Dorm Number:</strong> {selectedApplicant?.studentDormNumber}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography><strong>Course Year:</strong> {selectedApplicant?.courseYear}</Typography>
                    </Grid>
                  </Grid>
                </Grid>

                {/* Medical Information Section */}
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" sx={{ 
                    color: mode === 'dark' ? '#fff' : '#1D503A',
                    fontWeight: 600,
                    mb: 2 
                  }}>
                    Medical Information
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography><strong>Height:</strong> {selectedApplicant?.height} cm</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography><strong>Weight:</strong> {selectedApplicant?.weight} kg</Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography sx={{ mt: 1 }}><strong>Medical History:</strong></Typography>
                      <Typography sx={{ mt: 0.5 }}>{selectedApplicant?.medicalHistory || 'None provided'}</Typography>
                    </Grid>
                  </Grid>
                </Grid>

                {/* Dormitory Preferences Section */}
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" sx={{ 
                    color: mode === 'dark' ? '#fff' : '#1D503A',
                    fontWeight: 600,
                    mb: 2 
                  }}>
                    Dormitory Preferences
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography><strong>Building Preference:</strong> {selectedApplicant?.preferences?.buildingPreference}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography><strong>Room Type Preference:</strong> {selectedApplicant?.preferences?.occupancyPreference}</Typography>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            ) : (
              <Grid container spacing={3} justifyContent="center" alignItems="center" sx={{ minHeight: '200px' }}>
                <Grid item xs={8}>
                  <FormControl fullWidth sx={{ mb: 3 }}>
                    <InputLabel sx={{ 
                      color: mode === 'dark' ? '#9CA3AF' : '#1D503A',
                      '&.Mui-focused': {
                        color: mode === 'dark' ? '#10B981' : '#1D503A',
                      }
                    }}>
                      Building
                    </InputLabel>
                    <Select
                      value={selectedBuilding}
                      onChange={(e) => setSelectedBuilding(e.target.value)}
                      sx={{
                        color: mode === 'dark' ? '#fff' : '#000',
                        backgroundColor: mode === 'dark' ? 'transparent' : 'rgba(255, 255, 255, 0.7)',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(29, 80, 58, 0.5)',
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: mode === 'dark' ? 'rgba(16, 185, 129, 0.5)' : 'rgba(29, 80, 58, 0.8)',
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: mode === 'dark' ? '#10B981' : '#1D503A',
                        },
                        '& .MuiSvgIcon-root': {
                          color: mode === 'dark' ? '#9CA3AF' : '#1D503A',
                        },
                      }}
                    >
                      {buildings.length === 0 ? (
                        <MenuItem disabled>No buildings available</MenuItem>
                      ) : (
                        filteredBuildings.map((building) => (
                          <MenuItem key={building._id} value={building._id}>
                            {building.name} - {building.type}
                          </MenuItem>
                        ))
                      )}
                    </Select>
                  </FormControl>

                  <FormControl fullWidth>
                    <InputLabel sx={{ 
                      color: mode === 'dark' ? '#9CA3AF' : '#1D503A',
                      '&.Mui-focused': {
                        color: mode === 'dark' ? '#10B981' : '#1D503A',
                      }
                    }}>
                      Room
                    </InputLabel>
                    <Select
                      value={selectedRoom}
                      onChange={(e) => setSelectedRoom(e.target.value)}
                      disabled={!selectedBuilding}
                      sx={{
                        color: mode === 'dark' ? '#fff' : '#000',
                        backgroundColor: mode === 'dark' ? 'transparent' : 'rgba(255, 255, 255, 0.7)',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(29, 80, 58, 0.5)',
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: mode === 'dark' ? 'rgba(16, 185, 129, 0.5)' : 'rgba(29, 80, 58, 0.8)',
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: mode === 'dark' ? '#10B981' : '#1D503A',
                        },
                        '& .MuiSvgIcon-root': {
                          color: mode === 'dark' ? '#9CA3AF' : '#1D503A',
                        },
                      }}
                    >
                      {!selectedBuilding ? (
                        <MenuItem disabled>Select a building first</MenuItem>
                      ) : rooms.length === 0 ? (
                        <MenuItem disabled>No available rooms</MenuItem>
                      ) : (
                        rooms.map((room) => (
                          <MenuItem key={room._id} value={room._id}>
                            {room.roomNumber} - {room.type}
                          </MenuItem>
                        ))
                      )}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2.5, borderTop: mode === 'dark' ? '1px solid rgba(255,255,255,0.03)' : '1px solid rgba(29, 80, 58, 0.2)' }}>
            <Button 
              onClick={() => {
                setOpenApproveDialog(false);
                setApproveStep(0);
              }}
              sx={{ 
                color: mode === 'dark' ? '#9CA3AF' : '#1D503A',
                '&:hover': {
                  background: mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(29, 80, 58, 0.1)',
                },
              }}
            >
              Cancel
            </Button>
            {approveStep === 1 && (
              <Button
                onClick={handleApproveBack}
                sx={{ 
                  color: mode === 'dark' ? '#9CA3AF' : '#1D503A',
                  '&:hover': {
                    background: mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(29, 80, 58, 0.1)',
                  },
                }}
              >
                Back
              </Button>
            )}
            {approveStep === 0 ? (
              <Button
                onClick={handleApproveNext}
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
                Proceed to Room Assignment
              </Button>
            ) : (
              <Button
                onClick={handleApproveSubmit}
                variant="contained"
                disabled={!selectedRoom}
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
                  '&.Mui-disabled': {
                    backgroundColor: mode === 'dark'
                      ? 'rgba(16, 185, 129, 0.3)'
                      : 'rgba(29, 80, 58, 0.3)',
                    color: 'rgba(255, 255, 255, 0.3)'
                  }
                }}
              >
                Approve
              </Button>
            )}
          </DialogActions>
        </Dialog>

        {/* Decline Dialog */}
        <Dialog 
          open={openDeclineDialog} 
          onClose={() => setOpenDeclineDialog(false)}
          PaperProps={{
            sx: {
              background: mode === 'dark'
                ? 'linear-gradient(145deg, #141414 0%, #0A0A0A 100%)'
                : '#FAF5EE',
              color: mode === 'dark' ? '#fff' : '#1D503A',
              borderRadius: '20px',
              border: mode === 'dark'
                ? '1px solid rgba(255, 255, 255, 0.03)'
                : '1px solid #1D503A',
              boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
              minWidth: '500px',
            }
          }}
        >
          <DialogTitle sx={{ 
            borderBottom: mode === 'dark'
              ? '1px solid rgba(255,255,255,0.03)'
              : '1px solid #1D503A',
            background: mode === 'dark'
              ? 'linear-gradient(90deg, rgba(239, 68, 68, 0.1) 0%, transparent 100%)'
              : 'linear-gradient(90deg, rgba(29, 80, 58, 0.1) 0%, transparent 100%)',
            color: mode === 'dark' ? '#fff' : '#1D503A',
            py: 2,
          }}>
            Decline Application
          </DialogTitle>
          <DialogContent sx={{ p: 3 }}>
            <TextField
              autoFocus
              margin="dense"
              label="Reason for Declining"
              type="text"
              fullWidth
              multiline
              rows={4}
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: mode === 'dark' ? '#fff' : '#000',
                  backgroundColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.7)',
                  '& fieldset': {
                    borderColor: mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(29, 80, 58, 0.5)',
                  },
                  '&:hover fieldset': {
                    borderColor: mode === 'dark' ? 'rgba(239, 68, 68, 0.5)' : 'rgba(29, 80, 58, 0.8)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: mode === 'dark' ? '#EF4444' : '#1D503A',
                  }
                },
                '& .MuiInputLabel-root': {
                  color: mode === 'dark' ? '#9CA3AF' : '#1D503A',
                  '&.Mui-focused': {
                    color: mode === 'dark' ? '#EF4444' : '#1D503A',
                  }
                },
                '& .MuiOutlinedInput-input': {
                  '&::placeholder': {
                    color: 'rgba(255, 255, 255, 0.5)'
                  }
                }
              }}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2.5, borderTop: mode === 'dark' ? '1px solid rgba(255,255,255,0.03)' : '1px solid rgba(29, 80, 58, 0.2)' }}>
            <Button 
              onClick={() => setOpenDeclineDialog(false)}
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
              onClick={handleDeclineSubmit}
              variant="contained"
              disabled={!declineReason}
              sx={{
                background: mode === 'dark'
                  ? 'linear-gradient(90deg, #EF4444 0%, #DC2626 100%)'
                  : 'linear-gradient(90deg, #1D503A 0%, #0F3724 100%)',
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
                '&.Mui-disabled': {
                  backgroundColor: mode === 'dark'
                    ? 'rgba(239, 68, 68, 0.3)'
                    : 'rgba(29, 80, 58, 0.3)',
                  color: 'rgba(255, 255, 255, 0.3)'
                }
              }}
            >
              Decline
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

export default AdminApplicants; 
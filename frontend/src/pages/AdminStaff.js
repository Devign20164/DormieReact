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
  Chip,
  TablePagination,
  useTheme
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Notifications as NotificationsIcon,
  MoreVert as MoreVertIcon,
  Visibility as VisibilityIcon,
  CleaningServices as CleaningIcon,
  Build as MaintenanceIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';
import AdminSidebar from '../components/AdminSidebar';
import NotificationBell from '../components/NotificationBell';
import DialogContentText from '@mui/material/DialogContentText';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ThemeContext } from '../App';


const AdminStaff = () => {
  const { mode } = useContext(ThemeContext);
  const theme = useTheme();
  
  // State for staff management
  const [staff, setStaff] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    contactNumber: '',
    typeOfStaff: 'Cleaner',
  });

  // State for delete dialog and view dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  
  // State for loading
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // CRUD Operations
  const fetchStaff = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/admin/staff');
      setStaff(response.data);
    } catch (error) {
      console.error('Error fetching staff:', error);
      showSnackbar('Error fetching staff', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  // Open dialog for creating or editing staff
  const handleOpenDialog = (staffMember = null) => {
    if (staffMember) {
      setEditingStaff(staffMember);
      setFormData({
        name: staffMember.name,
        email: staffMember.email,
        contactNumber: staffMember.contactNumber,
        typeOfStaff: staffMember.typeOfStaff,
      });
    } else {
      resetForm();
    }
    setOpenDialog(true);
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Reset form helper
  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      contactNumber: '',
      typeOfStaff: 'Cleaner',
    });
    setEditingStaff(null);
  };

  // Handle delete click
  const handleDeleteClick = (staffMember) => {
    setStaffToDelete(staffMember);
    setDeleteDialogOpen(true);
  };

  // Cancel delete
  const handleDeleteCancel = () => {
    setStaffToDelete(null);
    setDeleteDialogOpen(false);
  };

  // View staff details
  const handleViewStaff = (staffMember) => {
    setSelectedStaff(staffMember);
    setViewDialogOpen(true);
  };

  // Close view dialog
  const handleCloseViewDialog = () => {
    setSelectedStaff(null);
    setViewDialogOpen(false);
  };

  // Show snackbar helper
  const showSnackbar = (message, severity) => {
    setSnackbar({
      open: true,
      message,
      severity,
    });
  };

  // Get icon based on staff type
  const getStaffTypeIcon = (type) => {
    switch (type) {
      case 'Cleaner':
        return <CleaningIcon sx={{ color: '#10B981' }} />;
      case 'Maintenance':
        return <MaintenanceIcon sx={{ color: '#F59E0B' }} />;
      case 'Security':
        return <SecurityIcon sx={{ color: '#3B82F6' }} />;
      default:
        return <CleaningIcon />;
    }
  };

  // Get color for status chip
  const getStatusColor = (status) => {
    switch (status) {
      case 'Available':
        return { color: '#10B981', bg: 'rgba(16, 185, 129, 0.1)' };
      case 'Occupied':
        return { color: '#EF4444', bg: 'rgba(239, 68, 68, 0.1)' };
      default:
        return { color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.1)' };
    }
  };

  // Handle create staff member
  const handleCreateStaff = async () => {
    if (!formData.name || !formData.typeOfStaff) {
      showSnackbar('Please fill all required fields', 'error');
      return;
    }

    try {
      const response = await axios.post('/api/admin/staff', formData);
      setStaff([...staff, response.data]);
      setOpenDialog(false);
      resetForm();
      showSnackbar('Staff member created successfully', 'success');
    } catch (error) {
      console.error('Error creating staff member:', error);
      showSnackbar(error.response?.data?.message || 'Error creating staff member', 'error');
    }
  };

  // Handle update staff member
  const handleUpdateStaff = async () => {
    if (!formData.name || !formData.typeOfStaff) {
      showSnackbar('Please fill all required fields', 'error');
      return;
    }

    try {
      const response = await axios.put(`/api/admin/staff/${editingStaff._id}`, formData);
      setStaff(staff.map(s => s._id === editingStaff._id ? response.data : s));
      setOpenDialog(false);
      resetForm();
      showSnackbar('Staff member updated successfully', 'success');
    } catch (error) {
      console.error('Error updating staff member:', error);
      showSnackbar(error.response?.data?.message || 'Error updating staff member', 'error');
    }
  };

  // Handle delete staff confirmation
  const handleDeleteConfirm = async () => {
    try {
      await axios.delete(`/api/admin/staff/${staffToDelete._id}`);
      setStaff(staff.filter(s => s._id !== staffToDelete._id));
      setDeleteDialogOpen(false);
      setStaffToDelete(null);
      showSnackbar('Staff member deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting staff member:', error);
      showSnackbar(error.response?.data?.message || 'Error deleting staff member', 'error');
      setDeleteDialogOpen(false);
      setStaffToDelete(null);
    }
  };

  // Handle pagination
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Rendering component
  return (
    <Box sx={{ 
      display: 'flex', 
      minHeight: '100vh',
      background: mode === 'dark'
        ? 'linear-gradient(145deg, #0A0A0A 0%, #141414 100%)'
        : 'linear-gradient(145deg, #f0f9f4 0%, #e6f7ee 100%)',
      color: mode === 'dark' ? '#fff' : '#333',
      position: 'relative',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: mode === 'dark'
          ? 'radial-gradient(circle at top right, rgba(255,255,255,0.03) 0%, transparent 70%)'
          : 'radial-gradient(circle at top right, rgba(16, 185, 129, 0.05) 0%, transparent 80%)',
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
            : '1px solid rgba(16, 185, 129, 0.1)',
        }}>
          <Box>
            <Typography variant="h4" sx={{ 
              fontWeight: 600, 
              color: mode === 'dark' ? '#fff' : '#333',
              textShadow: mode === 'dark'
                ? '0 2px 4px rgba(0,0,0,0.2)'
                : '0 1px 2px rgba(0,0,0,0.05)',
            }}>
              Staff Management
            </Typography>
            <Typography variant="body2" sx={{ 
              color: mode === 'dark' ? '#6B7280' : '#6c757d', 
              mt: 1 
            }}>
              Manage staff members and their assignments.
            </Typography>
          </Box>
          <Stack direction="row" spacing={2} alignItems="center">
            <NotificationBell userType="admin" color="#10B981" />
            <IconButton sx={{ 
              color: mode === 'dark' ? '#6B7280' : '#6c757d',
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
              Add Staff
            </Button>
          </Stack>
        </Box>

        {/* Staff Table */}
        <TableContainer 
          component={Paper} 
          sx={{ 
            background: mode === 'dark'
              ? 'linear-gradient(145deg, #141414 0%, #0A0A0A 100%)'
              : 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)',
            borderRadius: '20px',
            border: mode === 'dark'
              ? '1px solid rgba(255, 255, 255, 0.03)'
              : '1px solid rgba(16, 185, 129, 0.15)',
            boxShadow: mode === 'dark'
              ? '0 4px 20px rgba(0,0,0,0.2)'
              : '0 4px 20px rgba(16, 185, 129, 0.08)',
            overflow: 'hidden',
          }}
        >
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ 
                  color: mode === 'dark' ? '#fff' : '#333',
                  borderBottom: mode === 'dark'
                    ? '1px solid rgba(255,255,255,0.05)'
                    : '1px solid rgba(0,0,0,0.05)',
                  background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.1) 0%, transparent 100%)',
                }}>Name</TableCell>
                <TableCell sx={{ 
                  color: mode === 'dark' ? '#fff' : '#333',
                  borderBottom: mode === 'dark'
                    ? '1px solid rgba(255,255,255,0.05)'
                    : '1px solid rgba(0,0,0,0.05)',
                  background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.1) 0%, transparent 100%)',
                }}>Type</TableCell>
                <TableCell sx={{ 
                  color: mode === 'dark' ? '#fff' : '#333',
                  borderBottom: mode === 'dark'
                    ? '1px solid rgba(255,255,255,0.05)'
                    : '1px solid rgba(0,0,0,0.05)',
                  background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.1) 0%, transparent 100%)',
                }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                    <CircularProgress sx={{ color: '#10B981' }} />
                  </TableCell>
                </TableRow>
              ) : staff.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 3, color: mode === 'dark' ? '#6B7280' : '#6c757d' }}>
                    No staff members found
                  </TableCell>
                </TableRow>
              ) : (
                staff.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((staffMember) => (
                  <TableRow 
                    key={staffMember._id}
                    sx={{
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        background: mode === 'dark'
                          ? 'rgba(16, 185, 129, 0.05)'
                          : 'rgba(16, 185, 129, 0.1)',
                      },
                    }}
                  >
                    <TableCell sx={{ 
                      color: mode === 'dark' ? '#D1D5DB' : '#333',
                      borderBottom: mode === 'dark'
                        ? '1px solid rgba(255,255,255,0.03)'
                        : '1px solid rgba(0,0,0,0.05)',
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getStaffTypeIcon(staffMember.typeOfStaff)}
                        {staffMember.name}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ 
                      color: mode === 'dark' ? '#D1D5DB' : '#333',
                      borderBottom: mode === 'dark'
                        ? '1px solid rgba(255,255,255,0.03)'
                        : '1px solid rgba(0,0,0,0.05)',
                    }}>{staffMember.typeOfStaff}</TableCell>
                    <TableCell sx={{ 
                      borderBottom: mode === 'dark'
                        ? '1px solid rgba(255,255,255,0.03)'
                        : '1px solid rgba(0,0,0,0.05)',
                    }}>
                      <IconButton 
                        onClick={() => handleViewStaff(staffMember)}
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
                        onClick={() => handleOpenDialog(staffMember)} 
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
                        onClick={() => handleDeleteClick(staffMember)}
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
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Alert
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            severity={snackbar.severity}
            variant="filled"
            elevation={6}
            sx={{ 
              width: '100%',
              background: snackbar.severity === 'success' 
                ? 'linear-gradient(90deg, #10B981 0%, #059669 100%)'
                : 'linear-gradient(90deg, #EF4444 0%, #DC2626 100%)',
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
              background: mode === 'dark'
                ? 'linear-gradient(145deg, #141414 0%, #0A0A0A 100%)'
                : 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)',
              color: mode === 'dark' ? '#fff' : '#333',
              minWidth: '500px',
              borderRadius: '20px',
              border: mode === 'dark'
                ? '1px solid rgba(255, 255, 255, 0.03)'
                : '1px solid rgba(16, 185, 129, 0.15)',
              boxShadow: mode === 'dark'
                ? '0 4px 20px rgba(0,0,0,0.2)'
                : '0 4px 20px rgba(16, 185, 129, 0.08)',
            },
          }}
        >
          <DialogTitle sx={{ 
            color: mode === 'dark' ? 'white' : '#333',
            borderBottom: mode === 'dark'
              ? '1px solid rgba(255,255,255,0.03)'
              : '1px solid rgba(0,0,0,0.05)',
            background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.1) 0%, transparent 100%)',
            py: 2,
          }}>
            {editingStaff ? 'Edit Staff Member' : 'Add Staff Member'}
          </DialogTitle>
          <DialogContent sx={{ pt: 5, pb: 3, px: 3 }}>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  name="name"
                  label="Name"
                  value={formData.name}
                  onChange={handleInputChange}
                  fullWidth
                  required
                  sx={{ 
                    '& .MuiOutlinedInput-root': {
                      color: mode === 'dark' ? '#fff' : '#333',
                      '& fieldset': {
                        borderColor: mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                      },
                      '&:hover fieldset': {
                        borderColor: 'rgba(16, 185, 129, 0.5)',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#10B981',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
                    },
                    '& .Mui-focused.MuiInputLabel-root': {
                      color: '#10B981',
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="email"
                  label="Email"
                  value={formData.email}
                  onChange={handleInputChange}
                  fullWidth
                  required
                  sx={{ 
                    '& .MuiOutlinedInput-root': {
                      color: mode === 'dark' ? '#fff' : '#333',
                      '& fieldset': {
                        borderColor: mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                      },
                      '&:hover fieldset': {
                        borderColor: 'rgba(16, 185, 129, 0.5)',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#10B981',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
                    },
                    '& .Mui-focused.MuiInputLabel-root': {
                      color: '#10B981',
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="contactNumber"
                  label="Contact Number"
                  value={formData.contactNumber}
                  onChange={handleInputChange}
                  fullWidth
                  required
                  sx={{ 
                    '& .MuiOutlinedInput-root': {
                      color: mode === 'dark' ? '#fff' : '#333',
                      '& fieldset': {
                        borderColor: mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                      },
                      '&:hover fieldset': {
                        borderColor: 'rgba(16, 185, 129, 0.5)',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#10B981',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
                    },
                    '& .Mui-focused.MuiInputLabel-root': {
                      color: '#10B981',
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel id="type-of-staff-label" sx={{ color: mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)' }}>Type of Staff</InputLabel>
                  <Select
                    labelId="type-of-staff-label"
                    id="typeOfStaff"
                    name="typeOfStaff"
                    value={formData.typeOfStaff}
                    onChange={handleInputChange}
                    label="Type of Staff"
                    required
                    sx={{ 
                      color: mode === 'dark' ? '#fff' : '#333',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(16, 185, 129, 0.5)',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#10B981',
                      },
                      '& .MuiSelect-icon': {
                        color: mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.54)',
                      },
                    }}
                  >
                    <MenuItem value="Cleaner">Cleaner</MenuItem>
                    <MenuItem value="Maintenance">Maintenance</MenuItem>
                    <MenuItem value="Security">Security</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2, borderTop: mode === 'dark' ? '1px solid rgba(255,255,255,0.03)' : '1px solid rgba(0,0,0,0.05)' }}>
            <Button 
              onClick={() => setOpenDialog(false)}
              sx={{ 
                color: mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
                '&:hover': { color: mode === 'dark' ? '#fff' : '#000' },
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={editingStaff ? handleUpdateStaff : handleCreateStaff}
              variant="contained"
              sx={{
                background: 'linear-gradient(90deg, #10B981 0%, #059669 100%)',
                '&:hover': {
                  background: 'linear-gradient(90deg, #059669 0%, #047857 100%)',
                },
              }}
            >
              {editingStaff ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* View Staff Dialog */}
        <Dialog 
          open={viewDialogOpen} 
          onClose={handleCloseViewDialog}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              background: mode === 'dark'
                ? 'linear-gradient(145deg, #141414 0%, #0A0A0A 100%)'
                : 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)',
              color: mode === 'dark' ? '#fff' : '#333',
              borderRadius: '20px',
              border: mode === 'dark'
                ? '1px solid rgba(255, 255, 255, 0.03)'
                : '1px solid rgba(16, 185, 129, 0.15)',
              boxShadow: mode === 'dark'
                ? '0 4px 20px rgba(0,0,0,0.2)'
                : '0 4px 20px rgba(16, 185, 129, 0.08)',
              minWidth: '600px',
              maxWidth: '800px',
            },
          }}
        >
          {selectedStaff && (
            <>
              <DialogTitle sx={{ 
                borderBottom: mode === 'dark' ? '1px solid rgba(255,255,255,0.03)' : '1px solid rgba(0,0,0,0.05)',
                background: 'linear-gradient(90deg, rgba(59, 130, 246, 0.1) 0%, transparent 100%)',
                py: 2,
              }}>
                <Typography variant="h6" sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  gap: 1,
                  color: mode === 'dark' ? '#fff' : '#333',
                }}>
                  <VisibilityIcon sx={{ color: '#3B82F6' }} />
                  Staff Information
                </Typography>
              </DialogTitle>
              <DialogContent sx={{ mt: 2 }}>
                <Box sx={{ display: 'grid', gap: 3 }}>
                  {/* Basic Information Section */}
                  <Box>
                    <Typography variant="subtitle1" sx={{ 
                      color: '#3B82F6', 
                      mb: 2,
                      borderBottom: '1px solid rgba(59, 130, 246, 0.2)',
                      pb: 1,
                    }}>
                      Basic Information
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body2" sx={{ color: mode === 'dark' ? '#9CA3AF' : '#6c757d' }}>Name</Typography>
                        <Typography variant="body1" sx={{ color: mode === 'dark' ? '#fff' : '#333' }}>{selectedStaff.name}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" sx={{ color: mode === 'dark' ? '#9CA3AF' : '#6c757d' }}>Staff Type</Typography>
                        <Typography variant="body1" sx={{ color: mode === 'dark' ? '#fff' : '#333', display: 'flex', alignItems: 'center', gap: 1 }}>
                          {getStaffTypeIcon(selectedStaff.typeOfStaff)}
                          {selectedStaff.typeOfStaff}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" sx={{ color: mode === 'dark' ? '#9CA3AF' : '#6c757d' }}>Status</Typography>
                        <Typography variant="body1" sx={{ color: mode === 'dark' ? '#fff' : '#333', display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box
                            sx={{
                              width: 10,
                              height: 10,
                              borderRadius: '50%',
                              backgroundColor: getStatusColor(selectedStaff.status).color,
                            }}
                          />
                          {selectedStaff.status}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" sx={{ color: mode === 'dark' ? '#9CA3AF' : '#6c757d' }}>Created On</Typography>
                        <Typography variant="body1" sx={{ color: mode === 'dark' ? '#fff' : '#333' }}>
                          {new Date(selectedStaff.createdAt).toLocaleDateString()}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>
                  
                  {/* Assigned Forms Section */}
                  <Box>
                    <Typography variant="subtitle1" sx={{ 
                      color: '#3B82F6', 
                      mb: 2,
                      borderBottom: '1px solid rgba(59, 130, 246, 0.2)',
                      pb: 1,
                    }}>
                      Assigned Forms
                    </Typography>
                    
                    {selectedStaff.assignedForms && selectedStaff.assignedForms.length > 0 ? (
                      <TableContainer 
                        component={Paper} 
                        sx={{ 
                          background: mode === 'dark' 
                            ? 'linear-gradient(145deg, #161616 0%, #101010 100%)'
                            : 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)',
                          borderRadius: '12px',
                          border: mode === 'dark' 
                            ? '1px solid rgba(255, 255, 255, 0.03)'
                            : '1px solid rgba(59, 130, 246, 0.15)',
                          boxShadow: mode === 'dark'
                            ? '0 4px 12px rgba(0,0,0,0.1)'
                            : '0 4px 12px rgba(59, 130, 246, 0.1)',
                          mb: 2,
                          maxHeight: '250px',
                          overflow: 'auto',
                          '&::-webkit-scrollbar': {
                            width: '8px',
                            height: '8px',
                          },
                          '&::-webkit-scrollbar-track': {
                            background: mode === 'dark' ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.05)',
                            borderRadius: '4px',
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
                        }}
                      >
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell sx={{ 
                                color: mode === 'dark' ? '#fff' : '#333',
                                borderBottom: mode === 'dark' ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)',
                                background: 'linear-gradient(90deg, rgba(59, 130, 246, 0.1) 0%, transparent 100%)',
                                py: 1.5,
                                fontSize: '0.75rem',
                                fontWeight: 'bold'
                              }}>Request Type</TableCell>
                              <TableCell sx={{ 
                                color: mode === 'dark' ? '#fff' : '#333',
                                borderBottom: mode === 'dark' ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)',
                                background: 'linear-gradient(90deg, rgba(59, 130, 246, 0.1) 0%, transparent 100%)',
                                py: 1.5,
                                fontSize: '0.75rem',
                                fontWeight: 'bold'
                              }}>Status</TableCell>
                              <TableCell sx={{ 
                                color: mode === 'dark' ? '#fff' : '#333',
                                borderBottom: mode === 'dark' ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)',
                                background: 'linear-gradient(90deg, rgba(59, 130, 246, 0.1) 0%, transparent 100%)',
                                py: 1.5,
                                fontSize: '0.75rem',
                                fontWeight: 'bold'
                              }}>Scheduled Date</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {selectedStaff.assignedForms.map((form, index) => (
                              <TableRow key={index}>
                                <TableCell sx={{ 
                                  color: mode === 'dark' ? '#D1D5DB' : '#333',
                                  borderBottom: mode === 'dark' ? '1px solid rgba(255,255,255,0.03)' : '1px solid rgba(0,0,0,0.05)',
                                  fontSize: '0.75rem'
                                }}>
                                  {form.requestType || "Unknown Request"}
                                </TableCell>
                                <TableCell sx={{ 
                                  borderBottom: mode === 'dark' ? '1px solid rgba(255,255,255,0.03)' : '1px solid rgba(0,0,0,0.05)',
                                  fontSize: '0.75rem'
                                }}>
                                  <Chip
                                    label={form.status || "Pending"}
                                    size="small"
                                    sx={{
                                      backgroundColor: form.status === 'Approved' 
                                        ? 'rgba(16, 185, 129, 0.1)' 
                                        : form.status === 'Declined'
                                          ? 'rgba(239, 68, 68, 0.1)'
                                          : 'rgba(59, 130, 246, 0.1)',
                                      color: form.status === 'Approved'
                                        ? '#10B981'
                                        : form.status === 'Declined'
                                          ? '#EF4444'
                                          : '#3B82F6',
                                      height: '22px',
                                      '& .MuiChip-label': {
                                        fontSize: '0.7rem',
                                        px: 1,
                                      }
                                    }}
                                  />
                                </TableCell>
                                <TableCell sx={{ 
                                  color: mode === 'dark' ? '#D1D5DB' : '#333',
                                  borderBottom: mode === 'dark' ? '1px solid rgba(255,255,255,0.03)' : '1px solid rgba(0,0,0,0.05)',
                                  fontSize: '0.75rem'
                                }}>
                                  {form.scheduledDate ? new Date(form.scheduledDate).toLocaleDateString() : "Not scheduled"}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    ) : (
                      <Typography variant="body1" sx={{ color: mode === 'dark' ? '#9CA3AF' : '#6c757d', fontStyle: 'italic', textAlign: 'center', py: 2 }}>
                        No forms assigned to this staff member.
                      </Typography>
                    )}
                  </Box>
                </Box>
              </DialogContent>
              <DialogActions sx={{ p: 2, borderTop: mode === 'dark' ? '1px solid rgba(255,255,255,0.03)' : '1px solid rgba(0,0,0,0.05)' }}>
                <Button 
                  onClick={handleCloseViewDialog}
                  variant="contained"
                  sx={{
                    background: 'linear-gradient(90deg, #3B82F6 0%, #2563EB 100%)',
                    color: '#fff',
                    px: 3,
                    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-1px)',
                      boxShadow: '0 6px 15px rgba(59, 130, 246, 0.3)',
                      background: 'linear-gradient(90deg, #2563EB 0%, #1D4ED8 100%)',
                    },
                  }}
                >
                  Close
                </Button>
              </DialogActions>
            </>
          )}
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteDialogOpen}
          onClose={handleDeleteCancel}
          PaperProps={{
            sx: {
              background: mode === 'dark'
                ? 'linear-gradient(145deg, #141414 0%, #0A0A0A 100%)'
                : 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)',
              color: mode === 'dark' ? '#fff' : '#333',
              borderRadius: '20px',
              border: mode === 'dark'
                ? '1px solid rgba(255, 255, 255, 0.03)'
                : '1px solid rgba(16, 185, 129, 0.15)',
              boxShadow: mode === 'dark'
                ? '0 4px 20px rgba(0,0,0,0.2)'
                : '0 4px 20px rgba(16, 185, 129, 0.08)',
            },
          }}
        >
          <DialogTitle sx={{ 
            borderBottom: mode === 'dark' ? '1px solid rgba(255,255,255,0.03)' : '1px solid rgba(0,0,0,0.05)',
            background: 'linear-gradient(90deg, rgba(239, 68, 68, 0.1) 0%, transparent 100%)',
            color: '#EF4444',
          }}>
            Confirm Deletion
          </DialogTitle>
          <DialogContent sx={{ pt: 3, mt: 1 }}>
            <DialogContentText sx={{ color: mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)' }}>
              Are you sure you want to delete the staff member "{staffToDelete?.name}"? This action cannot be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions sx={{ p: 2, borderTop: mode === 'dark' ? '1px solid rgba(255,255,255,0.03)' : '1px solid rgba(0,0,0,0.05)' }}>
            <Button 
              onClick={handleDeleteCancel}
              sx={{ 
                color: mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
                '&:hover': { color: mode === 'dark' ? '#fff' : '#000' },
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleDeleteConfirm}
              variant="contained"
              color="error"
              sx={{
                background: 'linear-gradient(90deg, #EF4444 0%, #DC2626 100%)',
                '&:hover': {
                  background: 'linear-gradient(90deg, #DC2626 0%, #B91C1C 100%)',
                },
              }}
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>

        <TablePagination
          component="div"
          count={staff.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25]}
          sx={{
            color: mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
            '.MuiTablePagination-selectIcon': {
              color: mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.54)'
            },
            '.MuiTablePagination-displayedRows': {
              color: mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)'
            },
            '.MuiTablePagination-select': {
              color: mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)'
            }
          }}
        />
      </Box>
    </Box>
  );
};

export default AdminStaff;

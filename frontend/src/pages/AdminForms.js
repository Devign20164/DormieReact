import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  Stack,
  Grid,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Chip,
  TablePagination,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Divider,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Tooltip,
  Avatar,
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  PlayArrow as PlayArrowIcon,
  Done as DoneIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  AccessTime as AccessTimeIcon,
  LocationOn as LocationIcon,
  Description as DescriptionIcon,
  FilterList as FilterListIcon,
} from '@mui/icons-material';
import AdminSidebar from '../components/AdminSidebar';
import NotificationBell from '../components/NotificationBell';
import axios from 'axios';
import { format } from 'date-fns';
import { toast } from 'react-toastify';

// Status configurations
const statusConfig = {
  Submitted: { color: '#3B82F6', icon: <AssignmentIcon />, bgGradient: 'linear-gradient(145deg, #1E40AF 0%, #3B82F6 100%)' },
  Approved: { color: '#10B981', icon: <CheckCircleIcon />, bgGradient: 'linear-gradient(145deg, #047857 0%, #10B981 100%)' },
  Rejected: { color: '#EF4444', icon: <CancelIcon />, bgGradient: 'linear-gradient(145deg, #B91C1C 0%, #EF4444 100%)' },
  Rescheduled: { color: '#F59E0B', icon: <ScheduleIcon />, bgGradient: 'linear-gradient(145deg, #B45309 0%, #F59E0B 100%)' },
  Assigned: { color: '#8B5CF6', icon: <PersonIcon />, bgGradient: 'linear-gradient(145deg, #6D28D9 0%, #8B5CF6 100%)' },
  'In Progress': { color: '#EC4899', icon: <PlayArrowIcon />, bgGradient: 'linear-gradient(145deg, #BE185D 0%, #EC4899 100%)' },
  Completed: { color: '#14B8A6', icon: <DoneIcon />, bgGradient: 'linear-gradient(145deg, #0F766E 0%, #14B8A6 100%)' },
};

const AdminForms = () => {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedForm, setSelectedForm] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('All');
  const userData = JSON.parse(localStorage.getItem('userData') || '{}');

  // Stats for the overview cards
  const getStatusStats = () => {
    return forms.reduce((acc, form) => {
      acc[form.status] = (acc[form.status] || 0) + 1;
      return acc;
    }, {});
  };

  // Fetch forms from backend
  useEffect(() => {
    const fetchForms = async () => {
      try {
        const response = await axios.get('/api/admin/forms');
        setForms(response.data.forms);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch forms');
        setLoading(false);
      }
    };

    fetchForms();
  }, []);

  // Handle form status change
  const handleStatusChange = async (formId, newStatus) => {
    try {
      setStatusLoading(true);
      const response = await axios.put(`/api/admin/forms/${formId}/status`, {
        status: newStatus
      });
      
      // Update forms list with new status
      setForms(forms.map(form => 
        form._id === formId ? { ...form, status: newStatus } : form
      ));
      
      toast.success(`Form status updated to ${newStatus}`);
      setStatusLoading(false);
    } catch (err) {
      toast.error('Failed to update form status');
      setStatusLoading(false);
    }
  };

  // Handle dialog open/close
  const handleOpenDialog = (form) => {
    setSelectedForm(form);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedForm(null);
  };

  // Handle pagination
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const filteredForms = selectedStatus === 'All' 
    ? forms 
    : forms.filter(form => form.status === selectedStatus);

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
        {/* Header */}
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
              Monitor and manage all maintenance request forms.
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
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

        {/* Status Filter */}
        <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
          <FilterListIcon sx={{ color: '#6B7280' }} />
          <Stack direction="row" spacing={1}>
            <Chip
              label="All"
              onClick={() => setSelectedStatus('All')}
              sx={{
                backgroundColor: selectedStatus === 'All' ? '#10B981' : 'rgba(255,255,255,0.05)',
                color: '#fff',
                '&:hover': { backgroundColor: selectedStatus === 'All' ? '#059669' : 'rgba(255,255,255,0.1)' }
              }}
            />
            {Object.keys(statusConfig).map((status) => (
              <Chip
                key={status}
                label={status}
                icon={React.cloneElement(statusConfig[status].icon, { sx: { fontSize: 16 } })}
                onClick={() => setSelectedStatus(status)}
                sx={{
                  backgroundColor: selectedStatus === status ? statusConfig[status].color : 'rgba(255,255,255,0.05)',
                  color: '#fff',
                  '&:hover': { backgroundColor: selectedStatus === status ? statusConfig[status].color : 'rgba(255,255,255,0.1)' }
                }}
              />
            ))}
          </Stack>
        </Box>

        {/* Forms Table */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress sx={{ color: '#10B981' }} />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mt: 4 }}>{error}</Alert>
        ) : (
          <TableContainer 
            component={Paper} 
            sx={{ 
              background: 'linear-gradient(145deg, #141414 0%, #0A0A0A 100%)',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.03)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
              overflow: 'hidden',
            }}
          >
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ 
                    color: '#fff',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.1) 0%, transparent 100%)',
                  }}>Form ID</TableCell>
                  <TableCell sx={{ 
                    color: '#fff',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.1) 0%, transparent 100%)',
                  }}>Student</TableCell>
                  <TableCell sx={{ 
                    color: '#fff',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.1) 0%, transparent 100%)',
                  }}>Type</TableCell>
                  <TableCell sx={{ 
                    color: '#fff',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.1) 0%, transparent 100%)',
                  }}>Location</TableCell>
                  <TableCell sx={{ 
                    color: '#fff',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.1) 0%, transparent 100%)',
                  }}>Submitted</TableCell>
                  <TableCell sx={{ 
                    color: '#fff',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.1) 0%, transparent 100%)',
                  }}>Status</TableCell>
                  <TableCell sx={{ 
                    color: '#fff',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.1) 0%, transparent 100%)',
                  }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(rowsPerPage > 0
                  ? filteredForms.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  : filteredForms
                ).map((form) => (
                  <TableRow 
                    key={form._id} 
                    hover
                    sx={{
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.03) !important',
                      }
                    }}
                  >
                    <TableCell sx={{ color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      {form._id.substring(0, 8)}
                    </TableCell>
                    <TableCell sx={{ color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      {form.studentInfo?.name || 'N/A'}
                    </TableCell>
                    <TableCell sx={{ color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      {form.formType}
                    </TableCell>
                    <TableCell sx={{ color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      {form.location?.buildingName}, Room {form.location?.roomNumber}
                    </TableCell>
                    <TableCell sx={{ color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      {format(new Date(form.createdAt), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell sx={{ color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <Chip
                        label={form.status}
                        color={statusConfig[form.status]?.color || 'default'}
                        icon={statusConfig[form.status]?.icon}
                        size="small"
                        sx={{ 
                          '& .MuiChip-icon': { 
                            fontSize: '1rem',
                            mr: -0.5
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <Stack direction="row" spacing={1}>
                        <Tooltip title="View Details">
                          <IconButton 
                            size="small" 
                            onClick={() => handleOpenDialog(form)}
                            sx={{ 
                              color: '#10B981',
                              '&:hover': { backgroundColor: 'rgba(16, 185, 129, 0.1)' }
                            }}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit Status">
                          <IconButton 
                            size="small"
                            sx={{ 
                              color: '#6B7280',
                              '&:hover': { backgroundColor: 'rgba(107, 114, 128, 0.1)' }
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <TablePagination
              component="div"
              count={filteredForms.length}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              sx={{
                color: '#fff',
                borderTop: '1px solid rgba(255,255,255,0.05)',
                '.MuiTablePagination-select': {
                  color: '#fff',
                },
                '.MuiTablePagination-selectIcon': {
                  color: '#fff',
                },
                '.MuiTablePagination-displayedRows': {
                  color: '#fff',
                },
                '.MuiIconButton-root': {
                  color: '#fff',
                },
              }}
            />
          </TableContainer>
        )}

        {/* Form Details Dialog */}
        <Dialog
          open={openDialog}
          onClose={handleCloseDialog}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              background: 'linear-gradient(145deg, #141414 0%, #0A0A0A 100%)',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.03)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
              color: '#fff',
            }
          }}
        >
          {selectedForm && (
            <>
              <DialogTitle sx={{ 
                borderBottom: '1px solid rgba(255,255,255,0.03)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <Typography variant="h6">Form Details</Typography>
                <Chip
                  label={selectedForm.status}
                  color={statusConfig[selectedForm.status]?.color || 'default'}
                  icon={statusConfig[selectedForm.status]?.icon}
                  size="small"
                />
              </DialogTitle>
              <DialogContent sx={{ mt: 2 }}>
                <Grid container spacing={3}>
                  {/* Student Information */}
                  <Grid item xs={12}>
                    <Typography variant="subtitle1" sx={{ color: '#6B7280', mb: 2 }}>
                      Student Information
                    </Typography>
                    <Box sx={{ 
                      bgcolor: 'rgba(255,255,255,0.03)', 
                      p: 2, 
                      borderRadius: 2,
                      display: 'flex',
                      alignItems: 'center',
                    }}>
                      <Avatar sx={{ bgcolor: '#10B981', mr: 2 }}>
                        {selectedForm.studentInfo?.name?.charAt(0) || 'S'}
                      </Avatar>
                      <Box>
                        <Typography variant="body1">
                          {selectedForm.studentInfo?.name}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#6B7280' }}>
                          Student ID: {selectedForm.studentInfo?.studentId || 'N/A'}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>

                  {/* Form Details */}
                  <Grid item xs={12} md={6}>
                    <Stack spacing={2}>
                      <Box>
                        <Typography variant="body2" sx={{ color: '#6B7280' }}>
                          Form Type
                        </Typography>
                        <Typography variant="body1">
                          {selectedForm.formType}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" sx={{ color: '#6B7280' }}>
                          Description
                        </Typography>
                        <Typography variant="body1">
                          {selectedForm.description}
                        </Typography>
                      </Box>
                    </Stack>
                  </Grid>

                  {/* Location and Timing */}
                  <Grid item xs={12} md={6}>
                    <Stack spacing={2}>
                      <Box>
                        <Typography variant="body2" sx={{ color: '#6B7280' }}>
                          Location
                        </Typography>
                        <Typography variant="body1">
                          {selectedForm.location?.buildingName}, Room {selectedForm.location?.roomNumber}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" sx={{ color: '#6B7280' }}>
                          Preferred Timing
                        </Typography>
                        <Typography variant="body1">
                          {selectedForm.preferredTiming?.startTime} - {selectedForm.preferredTiming?.endTime}
                        </Typography>
                      </Box>
                    </Stack>
                  </Grid>

                  {/* Status Management */}
                  <Grid item xs={12}>
                    <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.03)' }} />
                    <Typography variant="subtitle1" sx={{ color: '#6B7280', mb: 2 }}>
                      Status Management
                    </Typography>
                    <FormControl fullWidth variant="outlined">
                      <InputLabel sx={{ color: '#6B7280' }}>Update Status</InputLabel>
                      <Select
                        value={selectedForm.status}
                        onChange={(e) => handleStatusChange(selectedForm._id, e.target.value)}
                        disabled={statusLoading}
                        label="Update Status"
                        sx={{
                          color: '#fff',
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'rgba(255,255,255,0.03)',
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'rgba(255,255,255,0.1)',
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#10B981',
                          },
                        }}
                      >
                        {Object.keys(statusConfig).map((status) => (
                          <MenuItem key={status} value={status}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              {statusConfig[status].icon}
                              <Typography sx={{ ml: 1 }}>{status}</Typography>
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </DialogContent>
              <DialogActions sx={{ borderTop: '1px solid rgba(255,255,255,0.03)', p: 2 }}>
                <Button 
                  onClick={handleCloseDialog}
                  sx={{ 
                    color: '#6B7280',
                    '&:hover': { backgroundColor: 'rgba(107, 114, 128, 0.1)' }
                  }}
                >
                  Close
                </Button>
                <Button 
                  variant="contained"
                  onClick={() => handleStatusChange(selectedForm._id, 'Approved')}
                  disabled={statusLoading || selectedForm.status === 'Approved'}
                  sx={{ 
                    bgcolor: '#10B981',
                    '&:hover': { bgcolor: '#059669' }
                  }}
                >
                  Approve
                </Button>
                <Button 
                  variant="contained"
                  onClick={() => handleStatusChange(selectedForm._id, 'Rejected')}
                  disabled={statusLoading || selectedForm.status === 'Rejected'}
                  sx={{ 
                    bgcolor: '#EF4444',
                    '&:hover': { bgcolor: '#DC2626' }
                  }}
                >
                  Reject
                </Button>
              </DialogActions>
            </>
          )}
        </Dialog>
      </Box>
    </Box>
  );
};

export default AdminForms; 
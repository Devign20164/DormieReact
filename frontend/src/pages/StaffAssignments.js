import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  Grid,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Avatar,
  IconButton,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination
} from '@mui/material';
import {
  CheckCircleOutline as CheckIcon,
  HighlightOff as CancelIcon,
  Schedule as ScheduleIcon,
  AccessTime as TimeIcon,
  LocationOn as LocationIcon,
  Person as PersonIcon,
  Description as DescriptionIcon,
  GetApp as DownloadIcon,
  Add as AddIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import StaffSidebar from '../components/StaffSidebar';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useSocket } from '../context/SocketContext';

const StaffAssignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState({});
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [updateOpen, setUpdateOpen] = useState(false);
  const [statusUpdate, setStatusUpdate] = useState('');
  const [comments, setComments] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const { socket } = useSocket();

  useEffect(() => {
    // Get user data from localStorage
    const storedUserData = JSON.parse(localStorage.getItem('userData') || '{}');
    setUserData(storedUserData);
    
    // Fetch assignments
    fetchAssignments();
    
    // Socket event listeners
    if (socket) {
      socket.on('assignmentUpdated', handleAssignmentUpdate);
      socket.on('newAssignment', handleNewAssignment);
      socket.on('formAssigned', handleFormAssigned);
      
      return () => {
        socket.off('assignmentUpdated');
        socket.off('newAssignment');
        socket.off('formAssigned');
      };
    }
  }, [socket]);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/staff/assignments');
      setAssignments(response.data);
    } catch (error) {
      console.error('Error fetching assignments:', error);
      toast.error('Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };
  
  const handleAssignmentUpdate = (updatedAssignment) => {
    setAssignments(prev => 
      prev.map(a => a._id === updatedAssignment._id ? updatedAssignment : a)
    );
    toast.info(`Assignment #${updatedAssignment.requestId} has been updated`);
  };
  
  const handleNewAssignment = (newAssignment) => {
    setAssignments(prev => [newAssignment, ...prev]);
    toast.info(`New assignment #${newAssignment.requestId} has been assigned to you`);
  };

  // Handle form assignment from admin
  const handleFormAssigned = (data) => {
    // Only handle if this assignment is for the current staff member
    if (data.staffId === userData._id) {
      const { updatedForm } = data;
      
      // Create a new assignment object from the form data
      const newAssignment = {
        _id: updatedForm._id,
        requestId: updatedForm._id.substring(0, 8),
        requestType: updatedForm.requestType,
        description: updatedForm.description,
        status: 'Assigned',
        scheduledDate: updatedForm.scheduledDate,
        roomNumber: updatedForm.roomNumber,
        buildingName: updatedForm.buildingName,
        studentName: updatedForm.userName,
        studentId: updatedForm.studentDormNumber
      };
      
      // Add to assignments list (avoid duplicates)
      setAssignments(prev => {
        const exists = prev.some(assignment => assignment._id === newAssignment._id);
        if (!exists) {
          return [newAssignment, ...prev];
        }
        return prev;
      });
      
      // Show notification
      toast.info(`New ${updatedForm.requestType} assignment in room ${updatedForm.roomNumber} has been assigned to you`);
    }
  };

  const handleOpenDetails = (assignment) => {
    setSelectedAssignment(assignment);
    setDetailsOpen(true);
  };
  
  const handleCloseDetails = () => {
    setDetailsOpen(false);
  };
  
  const handleOpenUpdate = (assignment) => {
    setSelectedAssignment(assignment);
    setStatusUpdate(assignment.status);
    setComments('');
    setUpdateOpen(true);
  };
  
  const handleCloseUpdate = () => {
    setUpdateOpen(false);
  };

  const handleSubmitUpdate = async () => {
    try {
      if (!statusUpdate) {
        toast.warning('Please select a status');
        return;
      }
      
      const response = await axios.put(`/api/staff/assignments/${selectedAssignment._id}`, {
        status: statusUpdate,
        comments: comments
      });
      
      setAssignments(prev => 
        prev.map(a => a._id === selectedAssignment._id ? response.data : a)
      );
      
      toast.success('Assignment updated successfully');
      handleCloseUpdate();
      handleCloseDetails();
    } catch (error) {
      console.error('Error updating assignment:', error);
      toast.error('Failed to update assignment');
    }
  };
  
  const getStatusChip = (status) => {
    switch (status) {
      case 'Pending':
        return <Chip size="small" label="Pending" sx={{ bgcolor: '#FFA000', color: '#FFF' }} />;
      case 'In Progress':
        return <Chip size="small" label="In Progress" sx={{ bgcolor: '#2196F3', color: '#FFF' }} />;
      case 'Completed':
        return <Chip size="small" label="Completed" sx={{ bgcolor: '#4CAF50', color: '#FFF' }} />;
      case 'Canceled':
        return <Chip size="small" label="Canceled" sx={{ bgcolor: '#F44336', color: '#FFF' }} />;
      default:
        return <Chip size="small" label={status} />;
    }
  };
  
  // Table pagination handlers
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      minHeight: '100vh',
      background: 'linear-gradient(145deg, #0A0A0A 0%, #141414 100%)',
      color: '#fff',
    }}>
      <StaffSidebar />
      
      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 4,
          width: { sm: `calc(100% - 280px)` }
        }}
      >
        <Typography variant="h4" sx={{ mb: 4, color: '#fff', fontWeight: 600 }}>
          Assignments
        </Typography>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress sx={{ color: '#3B82F6' }} />
          </Box>
        ) : (
          <>
            {assignments.length === 0 ? (
              <Paper sx={{ 
                p: 4, 
                textAlign: 'center',
                background: 'rgba(20, 20, 20, 0.7)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                borderRadius: '12px'
              }}>
                <Typography variant="h6" sx={{ color: '#9CA3AF' }}>
                  No assignments found
                </Typography>
                <Typography variant="body2" sx={{ color: '#6B7280', mt: 1 }}>
                  You don't have any assignments at the moment
                </Typography>
              </Paper>
            ) : (
              <Paper sx={{ 
                width: '100%', 
                background: 'rgba(20, 20, 20, 0.7)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                borderRadius: '12px',
                overflow: 'hidden'
              }}>
                <TableContainer>
                  <Table sx={{ minWidth: 650 }}>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ color: '#9CA3AF', fontWeight: 600 }}>ID</TableCell>
                        <TableCell sx={{ color: '#9CA3AF', fontWeight: 600 }}>Type</TableCell>
                        <TableCell sx={{ color: '#9CA3AF', fontWeight: 600 }}>Location</TableCell>
                        <TableCell sx={{ color: '#9CA3AF', fontWeight: 600 }}>Scheduled</TableCell>
                        <TableCell sx={{ color: '#9CA3AF', fontWeight: 600 }}>Status</TableCell>
                        <TableCell sx={{ color: '#9CA3AF', fontWeight: 600 }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {assignments
                        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                        .map((assignment) => (
                          <TableRow 
                            key={assignment._id}
                            hover
                            sx={{ 
                              '&:hover': { 
                                background: 'rgba(59, 130, 246, 0.05)' 
                              },
                              cursor: 'pointer',
                              '& .MuiTableCell-root': {
                                color: '#E5E7EB',
                                borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                              }
                            }}
                            onClick={() => handleOpenDetails(assignment)}
                          >
                            <TableCell>{assignment.requestId || '---'}</TableCell>
                            <TableCell>{assignment.requestType}</TableCell>
                            <TableCell>
                              {`${assignment.roomNumber || 'Room ?'}, ${assignment.buildingName || 'Building ?'}`}
                            </TableCell>
                            <TableCell>
                              {assignment.scheduledDate ? new Date(assignment.scheduledDate).toLocaleDateString() : 'Not set'}
                            </TableCell>
                            <TableCell>{getStatusChip(assignment.status)}</TableCell>
                            <TableCell>
                              <Button 
                                variant="outlined" 
                                size="small"
                                startIcon={<EditIcon />}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenUpdate(assignment);
                                }}
                                sx={{
                                  borderColor: '#3B82F6',
                                  color: '#3B82F6',
                                  '&:hover': {
                                    borderColor: '#2563EB',
                                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                  }
                                }}
                              >
                                Update
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                <TablePagination
                  rowsPerPageOptions={[5, 10, 25]}
                  component="div"
                  count={assignments.length}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onPageChange={handleChangePage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  sx={{ 
                    color: '#E5E7EB',
                    '& .MuiSvgIcon-root': {
                      color: '#9CA3AF',
                    }
                  }}
                />
              </Paper>
            )}
          </>
        )}
        
        {/* Assignment Details Dialog */}
        <Dialog 
          open={detailsOpen} 
          onClose={handleCloseDetails}
          maxWidth="md"
          PaperProps={{
            sx: {
              background: 'linear-gradient(145deg, rgba(20, 20, 20, 0.95) 0%, rgba(10, 10, 10, 0.95) 100%)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              borderRadius: '16px',
              boxShadow: '0 4px 30px rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(10px)',
              color: '#fff',
              minWidth: { xs: '90%', sm: '600px' },
            }
          }}
        >
          {selectedAssignment && (
            <>
              <DialogTitle sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                borderBottom: '1px solid rgba(59, 130, 246, 0.2)',
                pb: 2
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <DescriptionIcon sx={{ color: '#3B82F6' }} />
                  <Typography variant="h6">
                    Assignment #{selectedAssignment.requestId || 'Unknown'}
                  </Typography>
                </Box>
                {getStatusChip(selectedAssignment.status)}
              </DialogTitle>
              <DialogContent sx={{ mt: 2 }}>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1" sx={{ color: '#3B82F6', mb: 1 }}>
                      Request Details
                    </Typography>
                    <Box sx={{ 
                      background: 'rgba(10, 10, 10, 0.5)',
                      borderRadius: '8px',
                      p: 2,
                      mb: 2,
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1 }}>
                        <DescriptionIcon sx={{ color: '#9CA3AF', fontSize: '1.2rem', mt: 0.3 }} />
                        <Box>
                          <Typography variant="body2" sx={{ color: '#9CA3AF' }}>
                            Type
                          </Typography>
                          <Typography variant="body1">
                            {selectedAssignment.requestType}
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1 }}>
                        <ScheduleIcon sx={{ color: '#9CA3AF', fontSize: '1.2rem', mt: 0.3 }} />
                        <Box>
                          <Typography variant="body2" sx={{ color: '#9CA3AF' }}>
                            Scheduled Date
                          </Typography>
                          <Typography variant="body1">
                            {selectedAssignment.scheduledDate 
                              ? new Date(selectedAssignment.scheduledDate).toLocaleString() 
                              : 'Not scheduled'}
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                        <TimeIcon sx={{ color: '#9CA3AF', fontSize: '1.2rem', mt: 0.3 }} />
                        <Box>
                          <Typography variant="body2" sx={{ color: '#9CA3AF' }}>
                            Submission Date
                          </Typography>
                          <Typography variant="body1">
                            {selectedAssignment.submissionDate 
                              ? new Date(selectedAssignment.submissionDate).toLocaleString() 
                              : 'Unknown'}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1" sx={{ color: '#3B82F6', mb: 1 }}>
                      Location Details
                    </Typography>
                    <Box sx={{ 
                      background: 'rgba(10, 10, 10, 0.5)',
                      borderRadius: '8px',
                      p: 2,
                      mb: 2,
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1 }}>
                        <LocationIcon sx={{ color: '#9CA3AF', fontSize: '1.2rem', mt: 0.3 }} />
                        <Box>
                          <Typography variant="body2" sx={{ color: '#9CA3AF' }}>
                            Building
                          </Typography>
                          <Typography variant="body1">
                            {selectedAssignment.buildingName || 'Unknown'}
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1 }}>
                        <LocationIcon sx={{ color: '#9CA3AF', fontSize: '1.2rem', mt: 0.3 }} />
                        <Box>
                          <Typography variant="body2" sx={{ color: '#9CA3AF' }}>
                            Room
                          </Typography>
                          <Typography variant="body1">
                            {selectedAssignment.roomNumber || 'Unknown'}
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                        <PersonIcon sx={{ color: '#9CA3AF', fontSize: '1.2rem', mt: 0.3 }} />
                        <Box>
                          <Typography variant="body2" sx={{ color: '#9CA3AF' }}>
                            Requestor
                          </Typography>
                          <Typography variant="body1">
                            {selectedAssignment.userName || 'Unknown'}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Typography variant="subtitle1" sx={{ color: '#3B82F6', mb: 1 }}>
                      Description
                    </Typography>
                    <Box sx={{ 
                      background: 'rgba(10, 10, 10, 0.5)',
                      borderRadius: '8px',
                      p: 2,
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                    }}>
                      <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                        {selectedAssignment.description || 'No description provided'}
                      </Typography>
                    </Box>
                  </Grid>
                  
                  {selectedAssignment.filePath && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle1" sx={{ color: '#3B82F6', mb: 1 }}>
                        Attachments
                      </Typography>
                      <Button
                        variant="outlined"
                        startIcon={<DownloadIcon />}
                        onClick={() => window.open(selectedAssignment.filePath, '_blank')}
                        sx={{
                          borderColor: '#3B82F6',
                          color: '#3B82F6',
                          '&:hover': {
                            borderColor: '#2563EB',
                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                          }
                        }}
                      >
                        View Attachment
                      </Button>
                    </Grid>
                  )}
                </Grid>
              </DialogContent>
              <DialogActions sx={{ p: 3, borderTop: '1px solid rgba(59, 130, 246, 0.2)' }}>
                <Button 
                  onClick={handleCloseDetails}
                  sx={{ 
                    color: '#9CA3AF',
                    '&:hover': { 
                      backgroundColor: 'rgba(156, 163, 175, 0.1)' 
                    } 
                  }}
                >
                  Close
                </Button>
                <Button 
                  variant="contained"
                  onClick={() => handleOpenUpdate(selectedAssignment)}
                  sx={{ 
                    bgcolor: '#3B82F6',
                    '&:hover': { 
                      bgcolor: '#2563EB' 
                    } 
                  }}
                >
                  Update Status
                </Button>
              </DialogActions>
            </>
          )}
        </Dialog>
        
        {/* Update Status Dialog */}
        <Dialog 
          open={updateOpen} 
          onClose={handleCloseUpdate}
          PaperProps={{
            sx: {
              background: 'linear-gradient(145deg, rgba(20, 20, 20, 0.95) 0%, rgba(10, 10, 10, 0.95) 100%)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              borderRadius: '16px',
              boxShadow: '0 4px 30px rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(10px)',
              color: '#fff',
              width: '100%',
              maxWidth: { xs: '90%', sm: '500px' },
            }
          }}
        >
          {selectedAssignment && (
            <>
              <DialogTitle sx={{ 
                borderBottom: '1px solid rgba(59, 130, 246, 0.2)',
                pb: 2
              }}>
                Update Assignment Status
              </DialogTitle>
              <DialogContent sx={{ mt: 2 }}>
                <FormControl fullWidth sx={{ mb: 3 }}>
                  <InputLabel id="status-select-label" sx={{ color: '#9CA3AF' }}>Status</InputLabel>
                  <Select
                    labelId="status-select-label"
                    value={statusUpdate}
                    onChange={(e) => setStatusUpdate(e.target.value)}
                    label="Status"
                    sx={{ 
                      color: '#E5E7EB',
                      '.MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(156, 163, 175, 0.3)',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(59, 130, 246, 0.5)',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#3B82F6',
                      },
                      '.MuiSvgIcon-root': {
                        color: '#9CA3AF',
                      }
                    }}
                  >
                    <MenuItem value="Pending">Pending</MenuItem>
                    <MenuItem value="In Progress">In Progress</MenuItem>
                    <MenuItem value="Completed">Completed</MenuItem>
                    <MenuItem value="Canceled">Canceled</MenuItem>
                  </Select>
                </FormControl>
                <TextField
                  fullWidth
                  label="Comments (optional)"
                  multiline
                  rows={4}
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  variant="outlined"
                  sx={{ 
                    '& .MuiOutlinedInput-root': {
                      color: '#E5E7EB',
                      '& fieldset': {
                        borderColor: 'rgba(156, 163, 175, 0.3)',
                      },
                      '&:hover fieldset': {
                        borderColor: 'rgba(59, 130, 246, 0.5)',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#3B82F6',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: '#9CA3AF',
                      '&.Mui-focused': {
                        color: '#3B82F6',
                      },
                    },
                  }}
                />
              </DialogContent>
              <DialogActions sx={{ p: 3, borderTop: '1px solid rgba(59, 130, 246, 0.2)' }}>
                <Button 
                  onClick={handleCloseUpdate}
                  sx={{ 
                    color: '#9CA3AF',
                    '&:hover': { 
                      backgroundColor: 'rgba(156, 163, 175, 0.1)' 
                    } 
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  variant="contained"
                  onClick={handleSubmitUpdate}
                  sx={{ 
                    bgcolor: '#3B82F6',
                    '&:hover': { 
                      bgcolor: '#2563EB' 
                    } 
                  }}
                >
                  Update
                </Button>
              </DialogActions>
            </>
          )}
        </Dialog>
      </Box>
    </Box>
  );
};

export default StaffAssignments; 
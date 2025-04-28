import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  MeetingRoom as EnterIcon,
  ExitToApp as ExitIcon,
  Person as PersonIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import StaffSidebar from '../components/StaffSidebar';
import axios from 'axios';
import { toast } from 'react-toastify';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DateTimePicker } from '@mui/x-date-pickers';

const StaffTenantLog = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [formData, setFormData] = useState({
    studentName: '',
    studentId: '',
    buildingName: '',
    roomNumber: '',
    type: 'entry',
    timestamp: new Date(),
    notes: ''
  });
  const [editMode, setEditMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [rowDialogOpen, setRowDialogOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [curfewTime, setCurfewTime] = useState('');
  const [lastLog, setLastLog] = useState(null);

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    // Filter students based on search term
    if (searchTerm.trim() === '') {
      setFilteredStudents(students);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = students.filter(student =>
        student.name.toLowerCase().includes(term) ||
        student.email.toLowerCase().includes(term) ||
        (student.studentDormNumber && student.studentDormNumber.toLowerCase().includes(term)) ||
        (student.courseYear && student.courseYear.toLowerCase().includes(term))
      );
      setFilteredStudents(filtered);
    }
  }, [searchTerm, students]);

  useEffect(() => {
    fetchCurfew();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/students');
      setStudents(response.data);
      setFilteredStudents(response.data);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const fetchCurfew = async () => {
    try {
      const res = await axios.get('/api/admin/curfews');
      const todayIso = new Date().toISOString().split('T')[0];
      const todayCurfew = res.data.find(c => c.date === todayIso) || {};
      setCurfewTime(todayCurfew.curfewTime || '');
    } catch (error) {
      console.error('Error fetching curfew:', error);
    }
  };

  const fetchLastLog = async (studentId) => {
    try {
      const todayIso = new Date().toISOString().split('T')[0];
      const res = await axios.get(`/api/admin/logs?date=${todayIso}`);
      const studentLog = res.data.find(l => l.user._id === studentId);
      setLastLog(studentLog);
    } catch (error) {
      console.error('Error fetching last log:', error);
    }
  };

  const handleCreateStudent = async () => {
    try {
      if (!formData.studentName || !formData.studentId || !formData.buildingName || !formData.roomNumber) {
        toast.warning('Please fill all required fields');
        return;
      }

      let response;
      if (editMode) {
        response = await axios.put(`/api/staff/tenant-logs/${selectedStudent._id}`, formData);
        setStudents(students.map(student => student._id === selectedStudent._id ? response.data : student));
        toast.success('Student updated successfully');
      } else {
        response = await axios.post('/api/staff/tenant-logs', formData);
        setStudents([response.data, ...students]);
        toast.success('Student created successfully');
      }
      
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving student:', error);
      toast.error(editMode ? 'Failed to update student' : 'Failed to create student');
    }
  };

  const handleDeleteStudent = async () => {
    try {
      await axios.delete(`/api/staff/tenant-logs/${selectedStudent._id}`);
      setStudents(students.filter(student => student._id !== selectedStudent._id));
      toast.success('Student deleted successfully');
      setConfirmDeleteOpen(false);
    } catch (error) {
      console.error('Error deleting student:', error);
      toast.error('Failed to delete student');
    }
  };

  const handleOpenDialog = (student = null) => {
    if (student) {
      setFormData({
        studentName: student.name,
        studentId: student.studentDormNumber,
        buildingName: student.buildingName,
        roomNumber: student.roomNumber,
        type: student.type,
        timestamp: new Date(student.timestamp),
        notes: student.notes || ''
      });
      setSelectedStudent(student);
      setEditMode(true);
    } else {
      setFormData({
        studentName: '',
        studentId: '',
        buildingName: '',
        roomNumber: '',
        type: 'entry',
        timestamp: new Date(),
        notes: ''
      });
      setEditMode(false);
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedStudent(null);
  };

  const handleOpenDeleteConfirm = (student) => {
    setSelectedStudent(student);
    setConfirmDeleteOpen(true);
  };

  const handleCloseDeleteConfirm = () => {
    setConfirmDeleteOpen(false);
    setSelectedStudent(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString();
  };

  const handleRowClick = (student) => {
    setSelectedRow(student);
    setRowDialogOpen(true);
  };

  const handleRowDialogClose = () => {
    setRowDialogOpen(false);
    setSelectedRow(null);
    setPasswordConfirm('');
  };

  const handleVerifyPassword = async () => {
    try {
      const response = await axios.post(
        `/api/students/${selectedRow._id}/verify-password`,
        { password: passwordConfirm }
      );
      if (response.data.verified) {
        // Close password dialog, open success dialog, and load log
        setRowDialogOpen(false);
        setSuccessDialogOpen(true);
        fetchLastLog(selectedRow._id);
      }
    } catch (error) {
      console.error('Password verification error:', error);
      toast.error(error.response?.data?.message || 'Password verification failed');
    }
  };

  const handleSuccessDialogClose = () => {
    setSuccessDialogOpen(false);
    setSelectedRow(null);
    setPasswordConfirm('');
  };

  const handleCheckIn = async () => {
    try {
      await axios.post('/api/students/logs/checkin');
      toast.success('Checked in successfully');
      handleSuccessDialogClose();
    } catch (err) {
      console.error('Check-in error:', err);
      toast.error(err.response?.data?.message || 'Error during check-in');
    }
  };

  const handleCheckOut = async () => {
    try {
      await axios.post('/api/students/logs/checkout');
      toast.success('Checked out successfully');
      handleSuccessDialogClose();
    } catch (err) {
      console.error('Check-out error:', err);
      toast.error(err.response?.data?.message || 'Error during check-out');
    }
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
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 4
        }}>
          <Typography variant="h4" sx={{ color: '#fff', fontWeight: 600 }}>
            Student Log
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            sx={{ 
              bgcolor: '#3B82F6',
              '&:hover': { 
                bgcolor: '#2563EB' 
              } 
            }}
          >
            New Entry
          </Button>
        </Box>
        
        {/* Search bar */}
        <Paper sx={{ 
          p: 2, 
          mb: 3,
          background: 'rgba(20, 20, 20, 0.7)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          borderRadius: '12px',
        }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Search by name, ID, building, or room..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                variant="outlined"
                InputProps={{
                  startAdornment: <SearchIcon sx={{ color: '#9CA3AF', mr: 1 }} />,
                }}
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
                }}
              />
            </Grid>
          </Grid>
        </Paper>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress sx={{ color: '#3B82F6' }} />
          </Box>
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
                    <TableCell sx={{ color: '#9CA3AF', fontWeight: 600 }}>Student Name</TableCell>
                    <TableCell sx={{ color: '#9CA3AF', fontWeight: 600 }}>Dorm Number</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredStudents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={2} align="center" sx={{ color: '#9CA3AF' }}>
                        No students found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredStudents
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((student) => (
                        <TableRow
                          hover
                          onClick={() => handleRowClick(student)}
                          key={student._id}
                          sx={{ 
                            '&:hover': { background: 'rgba(59, 130, 246, 0.05)' },
                            '& .MuiTableCell-root': { color: '#E5E7EB', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }
                          }}
                        >
                          <TableCell>{student.name}</TableCell>
                          <TableCell>{student.studentDormNumber}</TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={filteredStudents.length}
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
        
        {/* Row Selection Dialog */}
        <Dialog open={rowDialogOpen} onClose={handleRowDialogClose}>
          <DialogTitle>Verify Student</DialogTitle>
          <DialogContent>
            <Typography>Name: {selectedRow?.name}</Typography>
            <Typography>Dorm Number: {selectedRow?.studentDormNumber}</Typography>
            <TextField
              margin="dense"
              label="Password"
              type="password"
              fullWidth
              placeholder="Enter password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleRowDialogClose}>Cancel</Button>
            <Button variant="contained" onClick={handleVerifyPassword}>Verify</Button>
          </DialogActions>
        </Dialog>
        
        {/* Verification Success Dialog */}
        <Dialog open={successDialogOpen} onClose={handleSuccessDialogClose}>
          <DialogTitle>Verification Successful</DialogTitle>
          <DialogContent dividers>
            <Typography gutterBottom>
              Student: {selectedRow?.name}
            </Typography>
            <Typography gutterBottom>
              Dorm Number: {selectedRow?.studentDormNumber}
            </Typography>
            <Typography gutterBottom>
              Date & Time: {new Date().toLocaleString()}
            </Typography>
            <Typography gutterBottom>
              Curfew Time: {curfewTime || 'N/A'}
            </Typography>
            {lastLog && (
              <>
                <Typography gutterBottom>
                  Status: {lastLog.status}
                </Typography>
                <Typography>
                  Last Action: {lastLog.entries && lastLog.entries.length > 0 && lastLog.entries[lastLog.entries.length - 1].checkOutTime ? 'Check-Out' : 'Check-In'}
                </Typography>
              </>
            )}
          </DialogContent>
          <DialogActions>
            <Button variant="contained" color="primary" onClick={handleCheckIn}>
              Check In
            </Button>
            <Button variant="contained" color="secondary" onClick={handleCheckOut}>
              Check Out
            </Button>
          </DialogActions>
        </Dialog>
        
        {/* Create/Edit Student Dialog */}
        <Dialog 
          open={dialogOpen} 
          onClose={handleCloseDialog}
          PaperProps={{
            sx: {
              background: 'linear-gradient(145deg, rgba(20, 20, 20, 0.95) 0%, rgba(10, 10, 10, 0.95) 100%)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              borderRadius: '16px',
              boxShadow: '0 4px 30px rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(10px)',
              color: '#fff',
              minWidth: { xs: '90%', sm: '500px' },
            }
          }}
        >
          <DialogTitle sx={{ 
            borderBottom: '1px solid rgba(59, 130, 246, 0.2)',
            pb: 2
          }}>
            {editMode ? 'Edit Student Log' : 'Create New Student Log'}
          </DialogTitle>
          <DialogContent sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Student Name"
                  name="studentName"
                  value={formData.studentName}
                  onChange={handleInputChange}
                  required
                  sx={{ 
                    mb: 2,
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
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Student ID"
                  name="studentId"
                  value={formData.studentId}
                  onChange={handleInputChange}
                  required
                  sx={{ 
                    mb: 2,
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
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Building Name"
                  name="buildingName"
                  value={formData.buildingName}
                  onChange={handleInputChange}
                  required
                  sx={{ 
                    mb: 2,
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
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Room Number"
                  name="roomNumber"
                  value={formData.roomNumber}
                  onChange={handleInputChange}
                  required
                  sx={{ 
                    mb: 2,
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
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel id="type-select-label" sx={{ color: '#9CA3AF' }}>Type</InputLabel>
                  <Select
                    labelId="type-select-label"
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    label="Type"
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
                    <MenuItem value="entry">Entry</MenuItem>
                    <MenuItem value="exit">Exit</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DateTimePicker
                    label="Timestamp"
                    value={formData.timestamp}
                    onChange={(newValue) => setFormData({...formData, timestamp: newValue})}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        fullWidth
                        sx={{ 
                          mb: 2,
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
                    )}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  multiline
                  rows={4}
                  sx={{ 
                    mb: 2,
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
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 3, borderTop: '1px solid rgba(59, 130, 246, 0.2)' }}>
            <Button 
              onClick={handleCloseDialog}
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
              onClick={handleCreateStudent}
              sx={{ 
                bgcolor: '#3B82F6',
                '&:hover': { 
                  bgcolor: '#2563EB' 
                } 
              }}
            >
              {editMode ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </Dialog>
        
        {/* Delete Confirmation Dialog */}
        <Dialog
          open={confirmDeleteOpen}
          onClose={handleCloseDeleteConfirm}
          PaperProps={{
            sx: {
              background: 'linear-gradient(145deg, rgba(20, 20, 20, 0.95) 0%, rgba(10, 10, 10, 0.95) 100%)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '16px',
              boxShadow: '0 4px 30px rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(10px)',
              color: '#fff',
            }
          }}
        >
          <DialogTitle sx={{ borderBottom: '1px solid rgba(239, 68, 68, 0.2)' }}>
            Confirm Delete
          </DialogTitle>
          <DialogContent sx={{ mt: 2 }}>
            <Typography>
              Are you sure you want to delete this student log entry? This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ p: 3, borderTop: '1px solid rgba(239, 68, 68, 0.2)' }}>
            <Button 
              onClick={handleCloseDeleteConfirm}
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
              color="error"
              onClick={handleDeleteStudent}
              sx={{ 
                bgcolor: '#EF4444',
                '&:hover': { 
                  bgcolor: '#DC2626' 
                } 
              }}
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
};

export default StaffTenantLog;
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
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
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
  const [filteredLogs, setFilteredLogs] = useState([]);

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    // Filter logs based on search term
    if (searchTerm.trim() === '') {
      setFilteredLogs(logs);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = logs.filter(log => 
        log.studentName.toLowerCase().includes(term) ||
        log.studentId.toLowerCase().includes(term) ||
        log.buildingName.toLowerCase().includes(term) ||
        log.roomNumber.toLowerCase().includes(term) ||
        (log.notes && log.notes.toLowerCase().includes(term))
      );
      setFilteredLogs(filtered);
    }
  }, [searchTerm, logs]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/staff/tenant-logs');
      setLogs(response.data);
      setFilteredLogs(response.data);
    } catch (error) {
      console.error('Error fetching tenant logs:', error);
      toast.error('Failed to load tenant logs');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLog = async () => {
    try {
      if (!formData.studentName || !formData.studentId || !formData.buildingName || !formData.roomNumber) {
        toast.warning('Please fill all required fields');
        return;
      }

      let response;
      if (editMode) {
        response = await axios.put(`/api/staff/tenant-logs/${selectedLog._id}`, formData);
        setLogs(logs.map(log => log._id === selectedLog._id ? response.data : log));
        toast.success('Log updated successfully');
      } else {
        response = await axios.post('/api/staff/tenant-logs', formData);
        setLogs([response.data, ...logs]);
        toast.success('Log created successfully');
      }
      
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving tenant log:', error);
      toast.error(editMode ? 'Failed to update log' : 'Failed to create log');
    }
  };

  const handleDeleteLog = async () => {
    try {
      await axios.delete(`/api/staff/tenant-logs/${selectedLog._id}`);
      setLogs(logs.filter(log => log._id !== selectedLog._id));
      toast.success('Log deleted successfully');
      setConfirmDeleteOpen(false);
    } catch (error) {
      console.error('Error deleting tenant log:', error);
      toast.error('Failed to delete log');
    }
  };

  const handleOpenDialog = (log = null) => {
    if (log) {
      setFormData({
        studentName: log.studentName,
        studentId: log.studentId,
        buildingName: log.buildingName,
        roomNumber: log.roomNumber,
        type: log.type,
        timestamp: new Date(log.timestamp),
        notes: log.notes || ''
      });
      setSelectedLog(log);
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
    setSelectedLog(null);
  };

  const handleOpenDeleteConfirm = (log) => {
    setSelectedLog(log);
    setConfirmDeleteOpen(true);
  };

  const handleCloseDeleteConfirm = () => {
    setConfirmDeleteOpen(false);
    setSelectedLog(null);
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
            Tenant Log
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
                    <TableCell sx={{ color: '#9CA3AF', fontWeight: 600 }}>Student</TableCell>
                    <TableCell sx={{ color: '#9CA3AF', fontWeight: 600 }}>ID</TableCell>
                    <TableCell sx={{ color: '#9CA3AF', fontWeight: 600 }}>Building / Room</TableCell>
                    <TableCell sx={{ color: '#9CA3AF', fontWeight: 600 }}>Type</TableCell>
                    <TableCell sx={{ color: '#9CA3AF', fontWeight: 600 }}>Timestamp</TableCell>
                    <TableCell sx={{ color: '#9CA3AF', fontWeight: 600 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ color: '#9CA3AF' }}>
                        No tenant logs found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLogs
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((log) => (
                        <TableRow 
                          key={log._id}
                          sx={{ 
                            '&:hover': { 
                              background: 'rgba(59, 130, 246, 0.05)' 
                            },
                            '& .MuiTableCell-root': {
                              color: '#E5E7EB',
                              borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                            }
                          }}
                        >
                          <TableCell>{log.studentName}</TableCell>
                          <TableCell>{log.studentId}</TableCell>
                          <TableCell>{`${log.buildingName} / ${log.roomNumber}`}</TableCell>
                          <TableCell>
                            <Chip 
                              icon={log.type === 'entry' ? <EnterIcon /> : <ExitIcon />}
                              label={log.type === 'entry' ? 'Entry' : 'Exit'}
                              size="small"
                              sx={{ 
                                bgcolor: log.type === 'entry' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                                color: log.type === 'entry' ? '#3B82F6' : '#EF4444',
                                borderRadius: '4px',
                              }}
                            />
                          </TableCell>
                          <TableCell>{formatDate(log.timestamp)}</TableCell>
                          <TableCell>
                            <IconButton 
                              onClick={() => handleOpenDialog(log)}
                              sx={{ color: '#3B82F6' }}
                            >
                              <EditIcon />
                            </IconButton>
                            <IconButton 
                              onClick={() => handleOpenDeleteConfirm(log)}
                              sx={{ color: '#EF4444' }}
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
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={filteredLogs.length}
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
        
        {/* Create/Edit Log Dialog */}
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
            {editMode ? 'Edit Tenant Log' : 'Create New Tenant Log'}
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
              onClick={handleCreateLog}
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
              Are you sure you want to delete this tenant log entry? This action cannot be undone.
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
              onClick={handleDeleteLog}
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

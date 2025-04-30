import React, { useState, useEffect, useContext } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Table, 
  TableBody, 
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  TextField,
  Stack,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Snackbar,
  Card,
  Tabs,
  Tab,
  useTheme
} from '@mui/material';
import {
  NavigateBefore as PreviousIcon,
  NavigateNext as NextIcon,
  Today as CalendarIcon,
  Edit as EditIcon,
  AccessTime as AccessTimeIcon,
  Refresh as RefreshIcon,
  ReportProblem as OffenseIcon
} from '@mui/icons-material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker, TimePicker } from '@mui/x-date-pickers';
import AdminSidebar from '../components/AdminSidebar';
import NotificationBell from '../components/NotificationBell';
import { useSocket } from '../context/SocketContext';
import { format, addDays, subDays } from 'date-fns';
import { ThemeContext } from '../App';

const AdminHistory = () => {
  const { mode } = useContext(ThemeContext);
  const theme = useTheme();
  
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [logs, setLogs] = useState([]);
  const [offenses, setOffenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [offensesLoading, setOffensesLoading] = useState(false);
  const [error, setError] = useState(null);
  const [offensesError, setOffensesError] = useState(null);
  const [curfew, setCurfew] = useState(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newCurfewTime, setNewCurfewTime] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isStudentDialogOpen, setIsStudentDialogOpen] = useState(false);
  const { socket } = useSocket();
  const [lastProcessedLogs, setLastProcessedLogs] = useState([]);
  const [excusingStatus, setExcusingStatus] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  // Helper function to compare logs and find new check-ins/check-outs
  const findNewEntries = (newLogs, oldLogs) => {
    const oldEntries = new Set();
    oldLogs.forEach(log => {
      log.entries.forEach(entry => {
        const entryKey = `${log._id}-${entry.checkInTime}-${entry.checkOutTime}`;
        oldEntries.add(entryKey);
      });
    });

    const newEntries = [];
    newLogs.forEach(log => {
      log.entries.forEach(entry => {
        const entryKey = `${log._id}-${entry.checkInTime}-${entry.checkOutTime}`;
        if (!oldEntries.has(entryKey)) {
          newEntries.push({
            studentName: log.user?.name,
            roomNumber: log.room?.roomNumber,
            checkInTime: entry.checkInTime,
            checkOutTime: entry.checkOutTime,
            checkInStatus: entry.checkInStatus,
            checkOutStatus: entry.checkOutStatus
          });
    }
      });
    });

    return newEntries;
  };

  // Fetch logs for the selected date
  const fetchLogs = async (date) => {
    setLoading(true);
    setError(null);
    try {
      const formattedDate = format(date, 'yyyy-MM-dd');
      const response = await fetch(`/api/admin/logs/${formattedDate}`);
      if (!response.ok) {
        throw new Error('Failed to fetch logs');
      }
      const data = await response.json();
      
      // Find new entries by comparing with last processed logs
      const newEntries = findNewEntries(data, lastProcessedLogs);
      
      // Emit notifications for new entries
      newEntries.forEach(entry => {
        if (socket) {
          // Prepare notification data
          const notificationData = {
            type: 'CHECKIN_UPDATE',
            recipient: {
              model: 'Admin',
            },
            title: entry.checkOutTime ? 'Student Check-out' : 'Student Check-in',
            message: `${entry.studentName} has ${entry.checkOutTime ? 'checked out from' : 'checked in to'} room ${entry.roomNumber}`,
            status: entry.checkOutTime ? entry.checkOutStatus : entry.checkInStatus,
            timestamp: entry.checkOutTime || entry.checkInTime,
            metadata: {
              studentName: entry.studentName,
              roomNumber: entry.roomNumber,
              checkInTime: entry.checkInTime,
              checkOutTime: entry.checkOutTime,
              status: entry.checkOutTime ? entry.checkOutStatus : entry.checkInStatus
            }
          };

          // Emit the notification
          socket.emit('createNotification', notificationData);
        }
      });

      setLogs(data);
      setLastProcessedLogs(data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching logs:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch curfew for the selected date
  const fetchCurfew = async (date) => {
    try {
      const formattedDate = format(date, 'yyyy-MM-dd');
      const response = await fetch(`/api/admin/curfews/latest`);
      if (!response.ok) {
        throw new Error('Failed to fetch curfew time');
      }
      const data = await response.json();
      setCurfew(data);
    } catch (err) {
      console.error('Error fetching curfew:', err);
      // Don't set error state as curfew is supplementary information
    }
  };

  // Fetch all offenses
  const fetchOffenses = async () => {
    setOffensesLoading(true);
    setOffensesError(null);
    try {
      const response = await fetch('/api/admin/offenses');
      if (!response.ok) {
        throw new Error('Failed to fetch offense history');
      }
      const data = await response.json();
      setOffenses(data);
    } catch (err) {
      setOffensesError(err.message);
      console.error('Error fetching offenses:', err);
    } finally {
      setOffensesLoading(false);
    }
  };

  // Effect to fetch logs when date changes
  useEffect(() => {
    fetchLogs(selectedDate);
    fetchCurfew(selectedDate);
  }, [selectedDate]);

  // Effect to fetch offenses when tab changes to offenses
  useEffect(() => {
    if (activeTab === 1) {
      fetchOffenses();
    }
  }, [activeTab]);

  // Handle date navigation
  const handlePreviousDay = () => {
    setSelectedDate(prev => subDays(prev, 1));
  };

  const handleNextDay = () => {
    setSelectedDate(prev => addDays(prev, 1));
  };

  // Get status chip color
  const getStatusChip = (status) => {
    const statusConfig = {
      OnTime: { color: 'success', label: 'On Time' },
      Late: { color: 'warning', label: 'Late' },
      Missing: { color: 'error', label: 'Missing' },
      Pending: { color: 'warning', label: 'Pending' },
      Excused: { color: 'info', label: 'Excused' }
    };

    if (!status) return <Chip size="small" color="warning" label="Pending" />;
    const config = statusConfig[status] || statusConfig.Pending;
    return <Chip size="small" color={config.color} label={config.label} />;
  };

  // Format time
  const formatTime = (date) => {
    if (!date) return 'No Checkout';
    return format(new Date(date), 'hh:mm a');
  };

  const handleEditClick = () => {
    if (curfew) {
      setNewCurfewTime(new Date(`2000-01-01T${curfew.curfewTime}`));
    }
    setIsEditDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsEditDialogOpen(false);
    setNewCurfewTime(null);
  };

  const handleUpdateCurfew = async () => {
    try {
      if (!newCurfewTime || !curfew?._id) return;

      const formattedTime = format(newCurfewTime, 'HH:mm:ss');
      const response = await fetch(`/api/admin/curfews/${curfew._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          curfewTime: formattedTime
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update curfew time');
      }

      // Refresh curfew data
      await fetchCurfew(selectedDate);
      
      // Show success message
      setSnackbar({
        open: true,
        message: 'Curfew time updated successfully',
        severity: 'success'
      });
    } catch (err) {
      console.error('Error updating curfew:', err);
      setSnackbar({
        open: true,
        message: 'Failed to update curfew time',
        severity: 'error'
      });
    } finally {
      handleCloseDialog();
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Add new function to handle row click for late entries
  const handleRowClick = (log, entry) => {
    if (entry.checkInStatus === 'Late' || entry.checkOutStatus === 'Late') {
      setSelectedStudent({
        id: log.user?._id,
        name: log.user?.name,
        buildingName: log.room?.building?.name,
        roomNumber: log.room?.roomNumber,
        fatherContact: log.user?.fatherContact,
        motherContact: log.user?.motherContact,
        logId: log._id,
        entryId: entry._id,
        checkInStatus: entry.checkInStatus,
        checkOutStatus: entry.checkOutStatus
      });
      setIsStudentDialogOpen(true);
    }
  };

  // Add new function to handle excusing late status
  const handleExcuse = async (type) => {
    if (!selectedStudent) return;
    
    setExcusingStatus(true);
    try {
      const response = await fetch(`/api/admin/logs/${selectedStudent.logId}/entries/${selectedStudent.entryId}/excuse`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: type // 'checkIn' or 'checkOut'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to excuse late status');
      }

      // Refresh logs to show updated status
      await fetchLogs(selectedDate);
      
      setSnackbar({
        open: true,
        message: `Successfully excused late ${type === 'checkIn' ? 'check-in' : 'check-out'}`,
        severity: 'success'
      });
      
      // Close the dialog
      handleCloseStudentDialog();
    } catch (err) {
      console.error('Error excusing late status:', err);
      setSnackbar({
        open: true,
        message: 'Failed to excuse late status',
        severity: 'error'
      });
    } finally {
      setExcusingStatus(false);
    }
  };

  // Add new function to close student dialog
  const handleCloseStudentDialog = () => {
    setIsStudentDialogOpen(false);
    setSelectedStudent(null);
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Get severity chip
  const getSeverityChip = (type) => {
    if (type.includes('1st') || type.includes('Minor')) {
      return <Chip size="small" color="info" label={type} />;
    } else if (type.includes('2nd') || type.includes('3rd')) {
      return <Chip size="small" color="warning" label={type} />;
    } else {
      return <Chip size="small" color="error" label={type} />;
    }
  };

  return (
    <Box sx={{
      display: 'flex',
      minHeight: '100vh',
      background: 'linear-gradient(145deg, #111827 0%, #1F2937 100%)',
      color: 'white'
    }}>
      <AdminSidebar />
      <Box component="main" sx={{ flexGrow: 1, p: 4, transition: 'margin-left .3s ease' }}>
        {/* Header */}
        <Card sx={{ 
          p: 3, 
          mb: 4, 
          borderRadius: '16px',
          background: 'rgba(17, 24, 39, 0.8)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems="center" spacing={2}>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>
              {activeTab === 0 ? 'Log History' : 'Offense History'}
        </Typography>
            
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              sx={{
                '& .MuiTabs-indicator': {
                  backgroundColor: '#3B82F6',
                },
                '& .MuiTab-root': {
                  color: 'rgba(255, 255, 255, 0.6)',
                  '&.Mui-selected': {
                    color: '#3B82F6',
                  },
                  minWidth: '100px',
                },
              }}
            >
              <Tab icon={<AccessTimeIcon />} label="Logs" iconPosition="start" />
              <Tab icon={<OffenseIcon />} label="Offenses" iconPosition="start" />
            </Tabs>

            {activeTab === 0 && (
              <Stack direction="row" spacing={2} alignItems="center">
                <IconButton onClick={handlePreviousDay} sx={{ color: '#fff', '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)' } }}>
                  <PreviousIcon />
                </IconButton>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Date"
                    value={selectedDate}
                    onChange={(newDate) => setSelectedDate(newDate)}
                    renderInput={(params) => (
          <TextField
                        {...params}
                        size="small"
                        sx={{
                          width: '140px',
                          '& .MuiOutlinedInput-root': {
                            bgcolor: 'rgba(255, 255, 255, 0.05)',
                            color: '#fff',
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: 'rgba(255, 255, 255, 0.2)',
                            },
                          },
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'rgba(255, 255, 255, 0.1)',
                          },
                          '& .MuiInputLabel-root': {
                            color: 'rgba(255, 255, 255, 0.7)',
                          },
                        }}
          />
                    )}
                  />
                </LocalizationProvider>
                <IconButton onClick={handleNextDay} sx={{ color: '#fff', '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)' } }}>
                  <NextIcon />
                </IconButton>
              </Stack>
            )}
            
            {activeTab === 1 && (
              <Button
                startIcon={<RefreshIcon />}
                onClick={fetchOffenses}
                sx={{
                  bgcolor: 'rgba(255, 255, 255, 0.1)',
                  color: '#fff',
                  px: 2,
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.15)',
                  },
                }}
              >
                Refresh Offenses
          </Button>
            )}
          </Stack>

          {activeTab === 0 && (
            <Stack direction="row" justifyContent="space-between" alignItems="center" mt={3}>
              <Stack direction="row" spacing={1} alignItems="center">
                <AccessTimeIcon sx={{ color: '#3B82F6' }} />
                <Typography sx={{ fontWeight: 600 }}>
                  Curfew Time: 
                  <Typography component="span" sx={{ ml: 1, color: '#3B82F6', fontWeight: 700 }}>
                    {curfew?.curfewTime ? format(new Date(`2000-01-01T${curfew.curfewTime}`), 'hh:mm a') : 'Not Set'}
                  </Typography>
                </Typography>
                <IconButton 
                  onClick={handleEditClick}
                  size="small"
                  sx={{ 
                    color: '#fff', 
                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                    '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.2)' }
                  }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </Stack>
              <Typography variant="subtitle2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                {format(selectedDate, 'MMMM dd, yyyy')}
              </Typography>
            </Stack>
          )}
        </Card>

        {/* Main Content */}
        {activeTab === 0 ? (
          // Logs Tab
          <Card sx={{ 
            borderRadius: '16px',
            background: 'rgba(17, 24, 39, 0.8)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            overflow: 'hidden'
          }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
                <CircularProgress sx={{ color: '#3B82F6' }} />
        </Box>
            ) : error ? (
              <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ color: 'rgba(255, 255, 255, 0.7)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>Student</TableCell>
                      <TableCell sx={{ color: 'rgba(255, 255, 255, 0.7)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>Room</TableCell>
                      <TableCell sx={{ color: 'rgba(255, 255, 255, 0.7)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>Check-in Time</TableCell>
                      <TableCell sx={{ color: 'rgba(255, 255, 255, 0.7)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>Check-in Status</TableCell>
                      <TableCell sx={{ color: 'rgba(255, 255, 255, 0.7)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>Check-out Time</TableCell>
                      <TableCell sx={{ color: 'rgba(255, 255, 255, 0.7)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>Check-out Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {logs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ color: 'rgba(255, 255, 255, 0.6)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                          No logs found for this date
                        </TableCell>
                      </TableRow>
                    ) : (
                      logs.flatMap(log => 
                        log.entries.map((entry, entryIndex) => (
                          <TableRow 
                            key={`${log._id}-${entryIndex}`}
                            onClick={() => handleRowClick(log, entry)}
                            sx={{ 
                              cursor: 'pointer', 
                              '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.05)' },
                              borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                            }}
                          >
                            <TableCell sx={{ color: '#fff', borderBottom: 'none' }}>{log.user?.name || 'Unknown'}</TableCell>
                            <TableCell sx={{ color: '#fff', borderBottom: 'none' }}>{log.room?.roomNumber || 'N/A'}</TableCell>
                            <TableCell sx={{ color: '#fff', borderBottom: 'none' }}>{formatTime(entry.checkInTime)}</TableCell>
                            <TableCell sx={{ borderBottom: 'none' }}>{getStatusChip(entry.checkInStatus)}</TableCell>
                            <TableCell sx={{ color: '#fff', borderBottom: 'none' }}>{formatTime(entry.checkOutTime)}</TableCell>
                            <TableCell sx={{ borderBottom: 'none' }}>{getStatusChip(entry.checkOutStatus)}</TableCell>
                          </TableRow>
                        ))
                      )
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Card>
        ) : (
          // Offenses Tab
          <Card sx={{ 
            borderRadius: '16px',
            background: 'rgba(17, 24, 39, 0.8)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            overflow: 'hidden'
          }}>
            {offensesLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
                <CircularProgress sx={{ color: '#3B82F6' }} />
              </Box>
            ) : offensesError ? (
              <Alert severity="error" sx={{ m: 2 }}>{offensesError}</Alert>
            ) : (
              <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                      <TableCell sx={{ color: 'rgba(255, 255, 255, 0.7)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>Date</TableCell>
                      <TableCell sx={{ color: 'rgba(255, 255, 255, 0.7)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>Student</TableCell>
                      <TableCell sx={{ color: 'rgba(255, 255, 255, 0.7)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>Room</TableCell>
                      <TableCell sx={{ color: 'rgba(255, 255, 255, 0.7)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>Offense Type</TableCell>
                      <TableCell sx={{ color: 'rgba(255, 255, 255, 0.7)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>Reason</TableCell>
                      <TableCell sx={{ color: 'rgba(255, 255, 255, 0.7)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>Recorded By</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                    {offenses.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ color: 'rgba(255, 255, 255, 0.6)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                          No offense records found
                        </TableCell>
                      </TableRow>
                    ) : (
                      offenses.map(offense => (
                        <TableRow
                          key={offense._id}
                          sx={{ 
                            '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.05)' },
                            borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                          }}
                        >
                          <TableCell sx={{ color: '#fff', borderBottom: 'none' }}>
                            {format(new Date(offense.dateOfOffense), 'MMM dd, yyyy')}
                          </TableCell>
                          <TableCell sx={{ color: '#fff', borderBottom: 'none' }}>
                            {offense.student?.name || 'Unknown'}
                          </TableCell>
                          <TableCell sx={{ color: '#fff', borderBottom: 'none' }}>
                            {offense.student?.roomNumber || 'N/A'}
                          </TableCell>
                          <TableCell sx={{ borderBottom: 'none' }}>
                            {getSeverityChip(offense.typeOfOffense)}
                          </TableCell>
                          <TableCell sx={{ color: '#fff', borderBottom: 'none' }}>
                            {offense.offenseReason}
                          </TableCell>
                          <TableCell sx={{ color: '#fff', borderBottom: 'none' }}>
                            {offense.recordedBy?.name || 'Admin'}
                    </TableCell>
                  </TableRow>
                      ))
                    )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
          </Card>
        )}

        {/* Edit Curfew Dialog */}
        <Dialog 
          open={isEditDialogOpen} 
          onClose={handleCloseDialog}
          PaperProps={{
            sx: {
              background: 'linear-gradient(145deg, #141414 0%, #0A0A0A 100%)',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.03)',
            }
          }}
        >
          <DialogTitle sx={{ 
            color: 'white',
            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
            p: 3
          }}>
            Update Curfew Time
          </DialogTitle>
          <DialogContent sx={{ p: 3 }}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <TimePicker
                label="New Curfew Time"
                value={newCurfewTime}
                onChange={setNewCurfewTime}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    fullWidth
                    sx={{
                      '& .MuiInputBase-root': {
                        color: 'white',
                        bgcolor: 'rgba(255, 255, 255, 0.05)',
                      },
                      '& .MuiInputLabel-root': {
                        color: '#9CA3AF',
                      },
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255, 255, 255, 0.2)',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#10B981',
                      },
                    }}
                  />
                )}
              />
            </LocalizationProvider>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button 
              onClick={handleCloseDialog}
              sx={{ 
                color: '#9CA3AF',
                '&:hover': {
                  color: 'white',
                  bgcolor: 'rgba(255, 255, 255, 0.05)',
                },
                borderRadius: '8px',
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateCurfew}
              variant="contained" 
              sx={{
                bgcolor: '#10B981',
                '&:hover': {
                  bgcolor: '#059669',
                },
                borderRadius: '8px',
              }}
            >
              Update
            </Button>
          </DialogActions>
        </Dialog>

        {/* Student Details Dialog */}
        <Dialog
          open={isStudentDialogOpen}
          onClose={handleCloseStudentDialog}
          PaperProps={{
            sx: {
              background: 'linear-gradient(145deg, #141414 0%, #0A0A0A 100%)',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.03)',
              minWidth: '400px'
            }
          }}
        >
          <DialogTitle sx={{ 
            color: 'white',
            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
            p: 3
          }}>
            Student Details
          </DialogTitle>
          <DialogContent sx={{ p: 3 }}>
            {selectedStudent && (
              <Stack spacing={2}>
                <Box>
                  <Typography variant="subtitle2" sx={{ color: '#9CA3AF' }}>
                    Student Name
                  </Typography>
                  <Typography variant="body1" sx={{ color: 'white', fontWeight: 500 }}>
                    {selectedStudent.name}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" sx={{ color: '#9CA3AF' }}>
                    Building
                  </Typography>
                  <Typography variant="body1" sx={{ color: 'white', fontWeight: 500 }}>
                    {selectedStudent.buildingName || 'N/A'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" sx={{ color: '#9CA3AF' }}>
                    Room Number
                  </Typography>
                  <Typography variant="body1" sx={{ color: 'white', fontWeight: 500 }}>
                    {selectedStudent.roomNumber || 'N/A'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" sx={{ color: '#9CA3AF' }}>
                    Father's Contact
                  </Typography>
                  <Typography variant="body1" sx={{ color: 'white', fontWeight: 500 }}>
                    {selectedStudent.fatherContact || 'N/A'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" sx={{ color: '#9CA3AF' }}>
                    Mother's Contact
                  </Typography>
                  <Typography variant="body1" sx={{ color: 'white', fontWeight: 500 }}>
                    {selectedStudent.motherContact || 'N/A'}
                  </Typography>
                </Box>
                {/* Late Status Actions */}
                {selectedStudent.checkInStatus === 'Late' && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" sx={{ color: '#EF4444', mb: 1 }}>
                      Late Check-in
                    </Typography>
                    <Button
                      variant="outlined"
                      onClick={() => handleExcuse('checkIn')}
                      disabled={excusingStatus}
                      sx={{
                        borderColor: '#EF4444',
                        color: '#EF4444',
                        '&:hover': {
                          borderColor: '#DC2626',
                          bgcolor: 'rgba(239, 68, 68, 0.1)',
                        },
                      }}
                    >
                      {excusingStatus ? 'Excusing...' : 'Excuse Late Check-in'}
                    </Button>
                  </Box>
                )}
                {selectedStudent.checkOutStatus === 'Late' && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" sx={{ color: '#EF4444', mb: 1 }}>
                      Late Check-out
                    </Typography>
                    <Button
                      variant="outlined"
                      onClick={() => handleExcuse('checkOut')}
                      disabled={excusingStatus}
                      sx={{
                        borderColor: '#EF4444',
                        color: '#EF4444',
                        '&:hover': {
                          borderColor: '#DC2626',
                          bgcolor: 'rgba(239, 68, 68, 0.1)',
                        },
                      }}
                    >
                      {excusingStatus ? 'Excusing...' : 'Excuse Late Check-out'}
                    </Button>
                  </Box>
                )}
              </Stack>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 3, borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <Button 
              onClick={handleCloseStudentDialog}
              variant="contained"
              sx={{
                bgcolor: '#10B981',
                color: 'white',
                '&:hover': {
                  bgcolor: '#059669',
                },
              }}
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert 
            onClose={handleCloseSnackbar} 
            severity={snackbar.severity}
            sx={{ 
              width: '100%',
              bgcolor: snackbar.severity === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              color: snackbar.severity === 'success' ? '#10B981' : '#EF4444',
              border: `1px solid ${snackbar.severity === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
              '& .MuiAlert-icon': {
                color: snackbar.severity === 'success' ? '#10B981' : '#EF4444'
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

export default AdminHistory;
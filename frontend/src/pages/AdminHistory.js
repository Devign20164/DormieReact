import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  CircularProgress, 
  Paper, 
  TableContainer, 
  Table, 
  TableHead, 
  TableBody, 
  TableRow, 
  TableCell,
  TextField,
  Button
} from '@mui/material';
import { toast } from 'react-toastify';
import AdminSidebar from '../components/AdminSidebar';
import axios from 'axios';

const AdminHistory = () => {
  const [curfew, setCurfew] = useState(null);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCurfew = async () => {
    try {
      const res = await axios.get('/api/admin/curfews/latest');
      setCurfew(res.data);
    } catch (err) {
      console.error('Error fetching latest curfew:', err);
    }
  };

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/admin/logs');
      console.log('Raw logs data from API:', res.data);
      setLogs(res.data);
    } catch (err) {
      console.error('Error fetching logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurfew();
    fetchLogs();
  }, []);

  const handleCreateCurfew = async () => {
    if (!newDate || !newTime) {
      toast.error('Please select both date and time');
      return;
    }
    try {
      const res = await axios.post('/api/admin/curfews', { date: newDate, curfewTime: newTime });
      setCurfew(res.data);
      toast.success('Curfew created');
    } catch (err) {
      console.error('Error creating curfew:', err);
      toast.error(err.response?.data?.message || 'Error creating curfew');
    }
  };

  const handleDeleteLatest = async () => {
    try {
      await axios.delete('/api/admin/curfews/latest');
      setCurfew(null);
      toast.success('Latest curfew deleted');
    } catch (err) {
      console.error('Error deleting latest curfew:', err);
      toast.error(err.response?.data?.message || 'Error deleting curfew');
    }
  };

  // Process logs to extract user data and entries - Fixed to properly handle populated user data
  const flatEntries = logs.flatMap((log) => {
    // For debugging only
    console.log('Processing log:', log);
    
    // Skip logs without entries
    if (!log.entries || !Array.isArray(log.entries) || log.entries.length === 0) {
      console.log('Log has no entries, skipping:', log._id);
      return [];
    }
    
    // Extract user data from the parent log - FIXED HERE
    let logUserName = 'Unknown';
    let logDormNumber = 'N/A';
    
    // Handle different possible formats of user data at the log level
    if (log.user) {
      if (typeof log.user === 'object') {
        // If user is populated as an object
        logUserName = log.user.name || 'Unknown';
        logDormNumber = log.user.studentDormNumber || 'N/A';
      } else if (typeof log.user === 'string') {
        // If user is just an ID (not populated)
        logUserName = `User ID: ${log.user}`;
      }
    }
    
    console.log(`User data for log ${log._id}:`, { logUserName, logDormNumber });
    
    // Map each entry in this log, checking for entry-level user data first
    return log.entries.map((entry) => {
      console.log('Processing entry:', entry);
      
      // Try to get user data from the entry first, then fall back to log-level user data
      let userName = logUserName;
      let dormNumber = logDormNumber;
      
      // If the entry has its own user data, use that instead
      if (entry.user) {
        if (typeof entry.user === 'object') {
          userName = entry.user.name || userName;
          dormNumber = entry.user.studentDormNumber || dormNumber;
        }
      }
      
      return {
        id: `${log._id}-${entry._id}`,
        userName,
        dormNumber,
        checkIn: entry.checkInTime,
        checkOut: entry.checkOutTime,
        status: log.status,
        violated: entry.isCurfewViolated ? 'Yes' : 'No',
      };
    });
  });

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AdminSidebar />
      <Box component="main" sx={{ flexGrow: 1, p: 4 }}>
        <Typography variant="h4" gutterBottom>
          Log History
        </Typography>
        {curfew && (
          <Typography variant="subtitle1" sx={{ mb: 2 }}>
            Latest Curfew: {new Date(curfew.date).toLocaleDateString()} at {curfew.curfewTime}
          </Typography>
        )}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <TextField
            label="Date"
            type="date"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Time"
            type="time"
            value={newTime}
            onChange={(e) => setNewTime(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <Button variant="contained" onClick={handleCreateCurfew}>
            Add Curfew
          </Button>
          <Button variant="outlined" color="error" onClick={handleDeleteLatest}>
            Delete Latest
          </Button>
        </Box>
        {loading ? (
          <CircularProgress />
        ) : flatEntries.length === 0 ? (
          <Typography>No log entries found</Typography>
        ) : (
          <TableContainer component={Paper} sx={{ mt: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Dorm Number</TableCell>
                  <TableCell>Check-In Time</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Check-Out Time</TableCell>
                  <TableCell>Curfew Violated</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {flatEntries.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.userName}</TableCell>
                    <TableCell>{row.dormNumber}</TableCell>
                    <TableCell>{new Date(row.checkIn).toLocaleString()}</TableCell>
                    <TableCell>{row.status}</TableCell>
                    <TableCell>
                      {row.checkOut ? new Date(row.checkOut).toLocaleString() : '-'}
                    </TableCell>
                    <TableCell>{row.violated}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    </Box>
  );
};

export default AdminHistory;
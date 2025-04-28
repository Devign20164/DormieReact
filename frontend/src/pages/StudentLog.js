import React, { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress, Button, Paper, TableContainer, Table, TableHead, TableBody, TableRow, TableCell } from '@mui/material';
import StudentSidebar from '../components/StudentSidebar';
import axios from 'axios';

const StudentLog = () => {
  const [curfew, setCurfew] = useState(null);
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  const userId = userData._id;

  useEffect(() => {
    const fetchCurfew = async () => {
      try {
        const res = await axios.get('/api/admin/curfews');
        if (res.data && res.data.length) {
          setCurfew(res.data[0]);
        }
      } catch (err) {
        console.error('Error fetching curfew:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCurfew();
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLogsLoading(true);
      // Fetch logs specifically for the current student
      const res = await axios.get(`/api/students/logs`);
      setLogs(res.data);
    } catch (err) {
      console.error('Error fetching logs:', err);
    } finally {
      setLogsLoading(false);
    }
  };

  const handleCheckIn = async () => {
    try {
      setLogsLoading(true);
      await axios.post('/api/students/logs/checkin');
      await fetchLogs();
    } catch (err) {
      console.error('Error on check-in:', err);
    } finally {
      setLogsLoading(false);
    }
  };

  const handleCheckOut = async () => {
    try {
      setLogsLoading(true);
      await axios.post('/api/students/logs/checkout');
      await fetchLogs();
    } catch (err) {
      console.error('Error on check-out:', err);
    } finally {
      setLogsLoading(false);
    }
  };

  const todayIso = new Date().toISOString().split('T')[0];
  const todaysLogs = logs.filter(log => {
    // Check if log.checkInTime is a string or Date object
    const checkInTimeStr = typeof log.checkInTime === 'string' 
      ? log.checkInTime 
      : new Date(log.checkInTime).toISOString();
    return checkInTimeStr.startsWith(todayIso);
  });
  const activeLog = todaysLogs.find(log => !log.checkOutTime);
  const completedCount = todaysLogs.filter(log => log.checkOutTime).length;
  const canCheckIn = !activeLog && completedCount < 2;
  const canCheckOut = Boolean(activeLog);

  // Build timeline: compute status for each event individually against curfew
  const events = [];
  // Determine curfew cutoff as local Date
  let curfewCutoff = null;
  if (curfew && curfew.date && curfew.curfewTime) {
    const [year, month, day] = curfew.date.split('-').map(Number);
    const [hour, minute] = curfew.curfewTime.split(':').map(Number);
    curfewCutoff = new Date(year, month - 1, day, hour, minute);
  }
  todaysLogs.forEach(log => {
    // Check-In event
    const inDate = new Date(log.checkInTime);
    // Use the status directly from the log
    events.push({ 
      time: log.checkInTime, 
      action: 'Check-In', 
      status: log.status
    });
    
    // Check-Out event, if exists
    if (log.checkOutTime) {
      const outDate = new Date(log.checkOutTime);
      events.push({ 
        time: log.checkOutTime, 
        action: 'Check-Out', 
        status: log.status
      });
    }
  });
  events.sort((a, b) => new Date(a.time) - new Date(b.time));

  const formatCurfewDisplay = (timeStr) => {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':');
    const date = new Date();
    date.setHours(parseInt(h, 10), parseInt(m, 10));
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <StudentSidebar />
      <Box component="main" sx={{ flexGrow: 1, p: 4 }}>
        <Typography variant="h4" gutterBottom>Student Log</Typography>
        {loading ? (
          <CircularProgress />
        ) : (
          <>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Typography variant="h6">Curfew:</Typography>
              <Typography variant="h6">
                {curfew?.curfewTime ? formatCurfewDisplay(curfew.curfewTime) : 'N/A'}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <Button variant="contained" onClick={handleCheckIn} disabled={!canCheckIn}>
                Check In
              </Button>
              <Button variant="contained" onClick={handleCheckOut} disabled={!canCheckOut}>
                Check Out
              </Button>
            </Box>
            {logsLoading ? (
              <CircularProgress />
            ) : events.length === 0 ? (
              <Typography>No logs for today</Typography>
            ) : (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Time</TableCell>
                      <TableCell>Action</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {events.map((e, i) => (
                      <TableRow key={i}>
                        <TableCell>{new Date(e.time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</TableCell>
                        <TableCell>{e.action}</TableCell>
                        <TableCell>
                        {e.status === 'Pending' ? (
                          <span style={{ color: 'orange', fontWeight: 'bold' }}>Pending</span>
                        ) : e.status === 'OnTime' ? (
                          <span style={{ color: 'green', fontWeight: 'bold' }}>OnTime</span>
                        ) : (
                          <span>{e.status}</span>
                        )}
                      </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </>
        )}
      </Box>
    </Box>
  );
};

export default StudentLog;
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  IconButton,
  CircularProgress,
  Paper,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button
} from '@mui/material';
import { ArrowBackIos, ArrowForwardIos, Today as TodayIcon, Edit as EditIcon } from '@mui/icons-material';
import axios from 'axios';
import AdminSidebar from '../components/AdminSidebar';

const AdminHistory = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  // Hard-coded sample data for demonstration
  const todayIso = new Date().toISOString().split('T')[0];
  const dummyLogs = [
    {
      _id: '1',
      user: { name: 'Alice Johnson', email: 'alice@example.com' },
      checkInTime: `${todayIso}T18:00:00Z`,
      checkOutTime: `${todayIso}T22:15:00Z`,
      isCurfewViolated: true
    },
    {
      _id: '2',
      user: { name: 'Bob Smith', email: 'bob@example.com' },
      checkInTime: `${todayIso}T20:00:00Z`,
      checkOutTime: null,
      isCurfewViolated: false
    }
  ];
  const dummyCurfews = [{ date: todayIso, curfewTime: '22:00' }];
  const [logs, setLogs] = useState(dummyLogs);
  const [curfews, setCurfews] = useState(dummyCurfews);
  const [loading, setLoading] = useState(true);
  const [curfewEditorOpen, setCurfewEditorOpen] = useState(false);
  const [editingCurfewTime, setEditingCurfewTime] = useState('');

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [logsRes, curfRes] = await Promise.all([
          axios.get('/api/admin/logs'),
          axios.get('/api/admin/curfews')
        ]);
        // Use real data if available, otherwise keep dummy
        setLogs(logsRes.data && logsRes.data.length ? logsRes.data : dummyLogs);
        setCurfews(curfRes.data && curfRes.data.length ? curfRes.data : dummyCurfews);
      } catch (err) {
        console.error('Error loading history:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const changeDay = (offset) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + offset);
    setSelectedDate(d);
  };

  const isoDate = selectedDate.toISOString().split('T')[0];
  const isOnToday = isoDate === todayIso;
  const todaysLogs = logs.filter(l => new Date(l.checkInTime).toISOString().startsWith(isoDate));
  const todaysCurfew = curfews.find(c => c.date === isoDate) || {};
  // Apply single curfew record to all days on/after its date, else none
  const currentCurfew = curfews[0] || {};
  const curfewBaseDate = currentCurfew.date ? new Date(currentCurfew.date) : null;
  const showCurfewTime = curfewBaseDate && selectedDate >= curfewBaseDate ? currentCurfew.curfewTime : null;

  // Build event rows for check-in and check-out
  const events = [];
  todaysLogs.forEach(log => {
    events.push({
      time: log.checkInTime,
      student: log.user.name || log.user.email,
      action: 'Check-In',
      violated: log.isCurfewViolated
    });
    if (log.checkOutTime) {
      events.push({
        time: log.checkOutTime,
        student: log.user.name || log.user.email,
        action: 'Check-Out',
        violated: log.isCurfewViolated
      });
    }
  });
  events.sort((a, b) => new Date(a.time) - new Date(b.time));

  const openCurfewEditor = () => setCurfewEditorOpen(true);
  const closeCurfewEditor = () => setCurfewEditorOpen(false);
  const handleSaveCurfew = async () => {
    if (!currentCurfew._id) return;
    try {
      const res = await axios.put(`/api/admin/curfews/${currentCurfew._id}`, { curfewTime: editingCurfewTime });
      setCurfews([res.data]);
      closeCurfewEditor();
    } catch (error) {
      console.error('Error updating curfew:', error);
    }
  };

  // Sync editing field when curfew changes
  useEffect(() => {
    setEditingCurfewTime(showCurfewTime || '');
  }, [showCurfewTime]);

  // Helper to format ISO time string into 12-hour time
  const formatTimeDisplay = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  };

  // Helper to format 'HH:mm' curfew time into 12-hour format
  const formatCurfewDisplay = (timeStr) => {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':');
    const date = new Date();
    date.setHours(parseInt(h, 10), parseInt(m, 10));
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', background: 'linear-gradient(145deg, #0A0A0A 0%, #141414 100%)' }}>
      <AdminSidebar />
      <Box component="main" sx={{ flexGrow: 1, p: 4, color: '#fff' }}>

        {/* Date Navigation */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mb: 3 }}>
          <IconButton onClick={() => changeDay(-1)} sx={{ color: '#fff' }}>
            <ArrowBackIos />
          </IconButton>
          <Typography variant="h5">{selectedDate.toDateString()}</Typography>
          <IconButton onClick={() => setSelectedDate(new Date())} sx={{ color: isOnToday ? '#fff' : '#10B981' }}>
            <TodayIcon />
          </IconButton>
          <IconButton onClick={() => changeDay(1)} sx={{ color: '#fff' }}>
            <ArrowForwardIos />
          </IconButton>
        </Box>

        {/* Curfew Time */}
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h6" sx={{ color: '#10B981' }}>Curfew:</Typography>
          <Typography variant="h6">{showCurfewTime ? formatCurfewDisplay(showCurfewTime) : 'N/A'}</Typography>
          <IconButton size="small" onClick={openCurfewEditor} sx={{ color: '#10B981' }}>
            <EditIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* Events Table */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress sx={{ color: '#10B981' }} />
          </Box>
        ) : events.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center', bgcolor: 'rgba(0,0,0,0.2)', borderRadius: 2, border: '1px dashed rgba(255,255,255,0.1)' }}>
            <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.7)' }}>
              No Logs for {isoDate}
            </Typography>
          </Box>
        ) : (
          <TableContainer component={Paper} sx={{ bgcolor: 'rgba(0,0,0,0.2)', borderRadius: 2, boxShadow: 'none', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
            <Table sx={{ minWidth: 650 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: 'rgba(0,0,0,0.3)', '& th': { borderColor: 'rgba(255,255,255,0.05)' } }}>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 'bold' }}>Time</TableCell>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 'bold' }}>Student</TableCell>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 'bold' }}>Action</TableCell>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 'bold' }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {events.map((e, i) => (
                  <TableRow
                    key={i}
                    sx={{
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.03)' },
                      transition: 'background-color 0.2s',
                      cursor: 'pointer',
                      '& td': { color: '#E5E7EB', borderBottom: '1px solid rgba(255,255,255,0.05)' }
                    }}
                  >
                    <TableCell>{formatTimeDisplay(e.time)}</TableCell>
                    <TableCell>{e.student}</TableCell>
                    <TableCell>{e.action}</TableCell>
                    <TableCell>
                      <Chip
                        label={e.violated ? 'Violated' : 'On-Time'}
                        size="small"
                        sx={{
                          bgcolor: e.violated ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)',
                          color: e.violated ? '#EF4444' : '#10B981',
                          fontWeight: 600,
                          borderRadius: '4px'
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Curfew Edit Dialog */}
        <Dialog
          open={curfewEditorOpen}
          onClose={closeCurfewEditor}
          PaperProps={{
            sx: {
              background: 'linear-gradient(145deg, #141414 0%, #0A0A0A 100%)',
              color: '#fff',
              minWidth: '400px',
              borderRadius: '20px',
              border: '1px solid rgba(255,255,255,0.03)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
              zIndex: 1300,
            }
          }}
        >
          <DialogTitle sx={{
            borderBottom: '1px solid rgba(255,255,255,0.03)',
            background: 'linear-gradient(90deg, rgba(16,185,129,0.1) 0%, transparent 100%)',
          }}>
            Edit Curfew
          </DialogTitle>
          <DialogContent sx={{
            overflowY: 'auto',
            '&::-webkit-scrollbar': { width: '8px' },
            '&::-webkit-scrollbar-track': { background: 'rgba(0,0,0,0.2)', borderRadius: '4px', margin: '8px 0' },
            '&::-webkit-scrollbar-thumb': { background: 'rgba(16,185,129,0.6)', borderRadius: '4px', '&:hover': { background: 'rgba(16,185,129,0.8)' } },
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(16,185,129,0.6) rgba(0,0,0,0.2)',
          }}>
            <TextField
              margin="dense"
              label="Curfew Time"
              type="time"
              fullWidth
              value={editingCurfewTime}
              onChange={e => setEditingCurfewTime(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: '#fff',
                  '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
                  '&:hover fieldset': { borderColor: 'rgba(16,185,129,0.5)' },
                  '&.Mui-focused fieldset': { borderColor: '#10B981' },
                },
                '& .MuiInputLabel-root': { color: '#9CA3AF', '&.Mui-focused': { color: '#10B981' } },
                '& input[type="time"]::-webkit-calendar-picker-indicator': {
                  filter: 'invert(1) brightness(2)',
                }
              }}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,0.03)' }}>
            <Button onClick={closeCurfewEditor} sx={{ color: '#9CA3AF' }}>Cancel</Button>
            <Button onClick={handleSaveCurfew} variant="contained" disabled={!editingCurfewTime} sx={{ textTransform: 'none' }}>Save</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
};

export default AdminHistory;

import React, { useState, useEffect } from "react";
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  IconButton,
  Snackbar,
  Alert,
  CircularProgress,
  Chip,
  Avatar,
  Card,
  InputAdornment,
} from "@mui/material";
import { Search as SearchIcon, AccessTime as ClockIcon } from "@mui/icons-material";
import StaffSidebar from '../components/StaffSidebar';
import axios from "axios";

const StaffTenantLog = () => {
  // State for the list of students (initialized with empty array)
  const [students, setStudents] = useState([]);

  // State for search functionality
  const [searchTerm, setSearchTerm] = useState("");

  // State for dialogs
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [verifiedStudent, setVerifiedStudent] = useState(null);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);

  // State for notifications
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });
  
  // Fetch students data from API
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);
        // Replace with your actual API endpoint
        const response = await axios.get('/api/students');
        
        // Format the response data for our component
        const formattedStudents = response.data.map(student => ({
          id: student._id || student.id,
          name: student.name,
          studentDormNumber: student.studentDormNumber,
          status: student.status || "out",
          lastCheckIn: student.lastCheckIn || null,
          lastCheckOut: student.lastCheckOut || null,
          password: "password123", // In a real app, handle auth properly
        }));
        
        setStudents(formattedStudents);
      } catch (error) {
        console.error("Error fetching students:", error);
        setSnackbar({
          open: true,
          message: "Failed to load students data",
          severity: "error",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

  // Filter students based on search term
  const filteredStudents = students.filter(
    (student) =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.studentDormNumber
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
  );

  // Handle row click
  const handleRowClick = (student) => {
    setSelectedStudent(student);
    setPasswordDialogOpen(true);
  };

  // Handle password submission
  const handlePasswordSubmit = async () => {
    setLoading(true);
    
    try {
      // Call the API to verify the student's password
      const response = await axios.post(`/api/students/${selectedStudent.id}/verify-password`, {
        password: password
      });
      
      // If verification successful
      if (response.data.verified) {
        setVerifiedStudent(response.data.student);
        setPasswordDialogOpen(false);
        setActionDialogOpen(true);
      } else {
        setSnackbar({
          open: true,
          message: "Incorrect password",
          severity: "error",
        });
      }
    } catch (error) {
      console.error("Password verification error:", error);
      setSnackbar({
        open: true,
        message: "Error verifying password",
        severity: "error",
      });
    } finally {
      setPassword("");
      setLoading(false);
    }
  };

  // Handle check in
  const handleCheckIn = async () => {
    if (!selectedStudent) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/students/${selectedStudent.id}/check-in`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to check in');
      }

      setStudents(students.map(student =>
        student.id === selectedStudent.id
          ? { ...student, status: 'in', lastCheckIn: new Date().toISOString() }
          : student
      ));

      setSnackbar({
        open: true,
        message: 'Successfully checked in',
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.message || 'Failed to check in',
        severity: 'error'
      });
    } finally {
      setLoading(false);
      setActionDialogOpen(false);
    }
  };

  // Handle check out
  const handleCheckOut = async () => {
    if (!selectedStudent) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/students/${selectedStudent.id}/check-out`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to check out');
      }

      setStudents(students.map(student =>
        student.id === selectedStudent.id
          ? { ...student, status: 'out', lastCheckOut: new Date().toISOString() }
          : student
      ));

      setSnackbar({
        open: true,
        message: 'Successfully checked out',
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.message || 'Failed to check out',
        severity: 'error'
      });
    } finally {
      setLoading(false);
      setActionDialogOpen(false);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";

    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
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
          overflowX: 'auto',
        }}
      >
        <Typography variant="h4" gutterBottom>
          Student Log System
        </Typography>

        {/* Search Bar */}
        <Box sx={{ mb: 4 }}>
          <TextField
            placeholder="Search by name or ID..."
            variant="outlined"
            fullWidth
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'rgba(255, 255, 255, 0.5)' }} />
                </InputAdornment>
              ),
              sx: {
                color: '#fff',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '8px',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(255, 255, 255, 0.2)',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#3B82F6',
                },
              }
            }}
          />
        </Box>

        {/* Student Table */}
        <Card sx={{ 
          background: 'linear-gradient(145deg, #141414 0%, #0A0A0A 100%)',
          borderRadius: '16px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
          border: '1px solid rgba(255, 255, 255, 0.03)',
          overflow: 'hidden',
        }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ 
                  backgroundColor: 'rgba(15, 23, 42, 0.5)',
                  '& th': { 
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontWeight: 600,
                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                  }
                }}>
                  <TableCell>Student</TableCell>
                  <TableCell>ID</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={2} align="center" sx={{ py: 4 }}>
                      <CircularProgress />
                      <Typography sx={{ mt: 2, color: 'rgba(255, 255, 255, 0.7)' }}>
                        Loading students...
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : filteredStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} align="center" sx={{ color: 'rgba(255, 255, 255, 0.7)', py: 4 }}>
                      No students found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStudents.map((student) => (
                    <TableRow 
                      key={student.id}
                      onClick={() => handleRowClick(student)}
                      sx={{ 
                        cursor: "pointer",
                        '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.03)' },
                        '& td': { 
                          color: '#fff',
                          borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
                        }
                      }}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar sx={{ width: 36, height: 36, bgcolor: 'rgba(59, 130, 246, 0.2)' }}>
                            {student.name.charAt(0)}
                          </Avatar>
                          <Typography variant="body1">
                            {student.name}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{student.studentDormNumber}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>

        {/* Password Dialog */}
        <Dialog open={passwordDialogOpen} onClose={() => setPasswordDialogOpen(false)}>
          <DialogTitle>Verify Student Identity</DialogTitle>
          <DialogContent>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Please enter the password to verify student identity
            </Typography>
            <TextField
              autoFocus
              margin="dense"
              label="Password"
              type="password"
              fullWidth
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPasswordDialogOpen(false)}>Cancel</Button>
            <Button onClick={handlePasswordSubmit} variant="contained" disabled={loading}>
              {loading ? <CircularProgress size={24} /> : "Verify"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Action Dialog */}
        <Dialog
          open={actionDialogOpen}
          onClose={() => setActionDialogOpen(false)}
          PaperProps={{
            sx: {
              background: 'linear-gradient(145deg, #141414 0%, #0A0A0A 100%)',
              color: '#fff',
              borderRadius: '16px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              border: '1px solid rgba(255, 255, 255, 0.03)',
            }
          }}
        >
          <DialogTitle>Student Check In/Out</DialogTitle>
          <DialogContent>
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6" gutterBottom>
                {selectedStudent?.name}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.7 }}>
                ID: {selectedStudent?.studentDormNumber}
              </Typography>
            </Box>
            <Typography gutterBottom>
              {selectedStudent?.status === "in"
                ? "You are currently checked in. Would you like to check out?"
                : "You are currently checked out. Would you like to check in?"}
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setActionDialogOpen(false)} color="primary">
              Cancel
            </Button>
            {selectedStudent?.status === "in" ? (
              <Button
                onClick={handleCheckOut}
                color="primary"
                variant="contained"
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : "Check Out"}
              </Button>
            ) : (
              <Button
                onClick={handleCheckIn}
                color="primary"
                variant="contained"
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : "Check In"}
              </Button>
            )}
          </DialogActions>
        </Dialog>

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            severity={snackbar.severity}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </Box>
  );
};

export default StaffTenantLog; 
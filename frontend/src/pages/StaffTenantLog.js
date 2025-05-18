import React, { useState, useEffect, useContext } from "react";
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
  useTheme
} from "@mui/material";
import { Search as SearchIcon, AccessTime as ClockIcon } from "@mui/icons-material";
import StaffSidebar from '../components/StaffSidebar';
import axios from "axios";
import { ThemeContext } from '../App';

// Color constants
const EGGSHELL_WHITE = "#F0EAD6";
const EMERALD_GREEN = "#50C878";
const DARK_EMERALD = "#2E8B57";

const StaffTenantLog = () => {
  const { mode } = useContext(ThemeContext);
  const theme = useTheme();

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
        const verifiedData = response.data.student;
        setVerifiedStudent(verifiedData);
        
        // Update selectedStudent with the latest data from the server
        setSelectedStudent({
          ...selectedStudent,
          id: verifiedData.id || selectedStudent.id,
          status: verifiedData.status || selectedStudent.status,
          lastCheckIn: verifiedData.lastCheckIn || selectedStudent.lastCheckIn,
          lastCheckOut: verifiedData.lastCheckOut || selectedStudent.lastCheckOut
        });
        
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
      // First fetch the latest student data
      const studentResponse = await fetch(`/api/students/${selectedStudent.id}`);
      const latestStudentData = await studentResponse.json();
      
      // Check if the student's last action was check-out
      if (latestStudentData.lastAction !== 'check-out') {
        throw new Error('You must check out before checking in again');
      }

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

      const updatedData = await response.json();

      setStudents(students.map(student =>
        student.id === selectedStudent.id
          ? { 
              ...student, 
              status: updatedData.status || 'in',
              lastAction: 'check-in',
              lastCheckIn: updatedData.lastCheckIn || new Date().toISOString()
            }
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
      // First fetch the latest student data
      const studentResponse = await fetch(`/api/students/${selectedStudent.id}`);
      const latestStudentData = await studentResponse.json();
      
      // Check if the student's last action was check-in
      if (latestStudentData.lastAction !== 'check-in') {
        throw new Error('You must check in before checking out');
      }

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

      const updatedData = await response.json();

      setStudents(students.map(student =>
        student.id === selectedStudent.id
          ? { 
              ...student, 
              status: updatedData.status || 'out',
              lastAction: 'check-out',
              lastCheckOut: updatedData.lastCheckOut || new Date().toISOString()
            }
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
      background: mode === 'dark' 
        ? 'linear-gradient(145deg, #0A0A0A 0%, #141414 100%)'
        : '#FAF5EE',
      color: mode === 'dark' ? '#fff' : '#000',
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
      <StaffSidebar />
      
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
            : '1px solid #1D503A',
        }}>
          <Box>
            <Typography variant="h4" sx={{ 
              fontWeight: 600, 
              color: mode === 'dark' ? '#fff' : '#000',
              textShadow: '0 2px 4px rgba(0,0,0,0.2)',
            }}>
              Student Log System
            </Typography>
            <Typography variant="body2" sx={{ 
              color: mode === 'dark' ? '#6B7280' : '#1D503A',
              mt: 1 
            }}>
              Manage student check-ins and check-outs in the dormitory
            </Typography>
          </Box>
        </Box>

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
                  <SearchIcon sx={{ color: mode === 'dark' ? 'rgba(255, 255, 255, 0.5)' : '#1D503A' }} />
                </InputAdornment>
              ),
              sx: {
                color: mode === 'dark' ? '#fff' : '#000',
                backgroundColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(29, 80, 58, 0.05)',
                borderRadius: '8px',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(29, 80, 58, 0.2)',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(29, 80, 58, 0.3)',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: mode === 'dark' ? '#10B981' : '#1D503A',
                },
              }
            }}
          />
        </Box>

        {/* Student Table */}
        <Card sx={{ 
          background: mode === 'dark'
            ? 'linear-gradient(145deg, #141414 0%, #0A0A0A 100%)'
            : '#FAF5EE',
          borderRadius: '20px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
          border: mode === 'dark'
            ? '1px solid rgba(255, 255, 255, 0.03)'
            : '1px solid #1D503A',
          overflow: 'hidden',
        }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ 
                  '& th': { 
                    color: mode === 'dark' ? '#fff' : '#000',
                    fontWeight: 600,
                    borderBottom: mode === 'dark'
                      ? '1px solid rgba(255,255,255,0.05)'
                      : '1px solid #1D503A',
                    background: mode === 'dark'
                      ? 'linear-gradient(90deg, rgba(16, 185, 129, 0.1) 0%, transparent 100%)'
                      : 'linear-gradient(90deg, rgba(29, 80, 58, 0.1) 0%, transparent 100%)',
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
                      <CircularProgress sx={{ color: mode === 'dark' ? '#10B981' : '#1D503A' }} />
                      <Typography sx={{ mt: 2, color: mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : '#1D503A' }}>
                        Loading students...
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : filteredStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} align="center" sx={{ 
                      color: mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : '#1D503A', 
                      py: 4 
                    }}>
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
                        transition: 'all 0.3s ease',
                        '&:hover': { 
                          backgroundColor: mode === 'dark' 
                            ? 'rgba(16, 185, 129, 0.05)' 
                            : 'rgba(29, 80, 58, 0.05)' 
                        },
                        '& td': { 
                          color: mode === 'dark' ? '#D1D5DB' : '#333',
                          borderBottom: mode === 'dark'
                            ? '1px solid rgba(255,255,255,0.03)'
                            : '1px solid rgba(0, 0, 0, 0.1)',
                        }
                      }}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar sx={{ 
                            width: 36, 
                            height: 36, 
                            bgcolor: mode === 'dark' 
                              ? 'rgba(16, 185, 129, 0.2)' 
                              : 'rgba(29, 80, 58, 0.2)',
                            color: mode === 'dark' ? '#10B981' : '#1D503A'
                          }}>
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
        <Dialog 
          open={passwordDialogOpen} 
          onClose={() => setPasswordDialogOpen(false)}
          PaperProps={{
            sx: {
              background: mode === 'dark'
                ? 'linear-gradient(145deg, #141414 0%, #0A0A0A 100%)'
                : '#FAF5EE',
              color: mode === 'dark' ? '#fff' : '#000',
              borderRadius: '20px',
              border: mode === 'dark'
                ? '1px solid rgba(255, 255, 255, 0.03)'
                : '1px solid #1D503A',
              boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
            },
          }}
        >
          <DialogTitle sx={{ 
            borderBottom: mode === 'dark'
              ? '1px solid rgba(255,255,255,0.03)'
              : '1px solid #1D503A',
            background: mode === 'dark'
              ? 'linear-gradient(90deg, rgba(16, 185, 129, 0.1) 0%, transparent 100%)'
              : 'linear-gradient(90deg, rgba(29, 80, 58, 0.1) 0%, transparent 100%)',
            color: mode === 'dark' ? '#fff' : '#1D503A',
          }}>
            Verify Student Identity
          </DialogTitle>
          <DialogContent sx={{ mt: 2 }}>
            <Typography variant="body1" sx={{ 
              mb: 2,
              color: mode === 'dark' ? '#D1D5DB' : '#333',
            }}>
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
              sx={{ 
                '& .MuiOutlinedInput-root': {
                  color: mode === 'dark' ? '#fff' : '#000',
                  '& fieldset': {
                    borderColor: mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(29, 80, 58, 0.3)',
                  },
                  '&:hover fieldset': {
                    borderColor: mode === 'dark' ? 'rgba(16, 185, 129, 0.5)' : 'rgba(29, 80, 58, 0.5)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: mode === 'dark' ? '#10B981' : '#1D503A',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: mode === 'dark' ? '#9CA3AF' : '#1D503A',
                  '&.Mui-focused': {
                    color: mode === 'dark' ? '#10B981' : '#1D503A',
                  },
                },
              }}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2, borderTop: mode === 'dark' ? '1px solid rgba(255,255,255,0.03)' : '1px solid rgba(29, 80, 58, 0.2)' }}>
            <Button 
              onClick={() => setPasswordDialogOpen(false)} 
              sx={{ 
                color: mode === 'dark' ? '#9CA3AF' : '#1D503A',
                '&:hover': {
                  background: mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(29, 80, 58, 0.1)',
                },
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handlePasswordSubmit} 
              variant="contained" 
              disabled={loading}
              sx={{
                background: mode === 'dark'
                  ? 'linear-gradient(90deg, #10B981 0%, #059669 100%)'
                  : 'linear-gradient(90deg, #1D503A 0%, #0F3724 100%)',
                color: '#fff',
                boxShadow: mode === 'dark'
                  ? '0 4px 12px rgba(16, 185, 129, 0.2)'
                  : '0 4px 12px rgba(29, 80, 58, 0.2)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-1px)',
                  boxShadow: mode === 'dark'
                    ? '0 6px 15px rgba(16, 185, 129, 0.3)'
                    : '0 6px 15px rgba(29, 80, 58, 0.3)',
                  background: mode === 'dark'
                    ? 'linear-gradient(90deg, #059669 0%, #047857 100%)'
                    : 'linear-gradient(90deg, #0F3724 0%, #0A2A1C 100%)',
                },
              }}
            >
              {loading ? <CircularProgress size={24} sx={{ color: '#fff' }} /> : "Verify"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Action Dialog */}
        <Dialog
          open={actionDialogOpen}
          onClose={() => setActionDialogOpen(false)}
          PaperProps={{
            sx: {
              background: mode === 'dark'
                ? 'linear-gradient(145deg, #141414 0%, #0A0A0A 100%)'
                : '#FAF5EE',
              color: mode === 'dark' ? '#fff' : '#000',
              borderRadius: '20px',
              border: mode === 'dark'
                ? '1px solid rgba(255, 255, 255, 0.03)'
                : '1px solid #1D503A',
              boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
            }
          }}
        >
          <DialogTitle sx={{ 
            borderBottom: mode === 'dark'
              ? '1px solid rgba(255,255,255,0.03)'
              : '1px solid #1D503A',
            background: mode === 'dark'
              ? 'linear-gradient(90deg, rgba(16, 185, 129, 0.1) 0%, transparent 100%)'
              : 'linear-gradient(90deg, rgba(29, 80, 58, 0.1) 0%, transparent 100%)',
            color: mode === 'dark' ? '#fff' : '#1D503A',
          }}>
            Student Check In/Out
          </DialogTitle>
          <DialogContent sx={{ mt: 2 }}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6" gutterBottom sx={{ color: mode === 'dark' ? '#fff' : '#000' }}>
                {selectedStudent?.name}
              </Typography>
              <Typography variant="body2" sx={{ 
                opacity: 0.7,
                color: mode === 'dark' ? '#9CA3AF' : '#1D503A',
                fontWeight: 500,
              }}>
                ID: {selectedStudent?.studentDormNumber}
              </Typography>
            </Box>
            <Typography gutterBottom sx={{ color: mode === 'dark' ? '#D1D5DB' : '#333' }}>
              {selectedStudent?.status === "in"
                ? "You are currently checked in. Would you like to check out?"
                : "You are currently checked out. Would you like to check in?"}
            </Typography>
          </DialogContent>
          <DialogActions sx={{ p: 2, borderTop: mode === 'dark' ? '1px solid rgba(255,255,255,0.03)' : '1px solid rgba(29, 80, 58, 0.2)' }}>
            <Button 
              onClick={() => setActionDialogOpen(false)} 
              sx={{ 
                color: mode === 'dark' ? '#9CA3AF' : '#1D503A',
                '&:hover': {
                  background: mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(29, 80, 58, 0.1)',
                },
              }}
            >
              Cancel
            </Button>
            {selectedStudent?.status === "in" ? (
              <Button
                onClick={handleCheckOut}
                variant="contained"
                disabled={loading}
                sx={{
                  background: mode === 'dark'
                    ? 'linear-gradient(90deg, #EF4444 0%, #DC2626 100%)'
                    : 'linear-gradient(90deg, #1D503A 0%, #0F3724 100%)',
                  color: '#fff',
                  boxShadow: mode === 'dark'
                    ? '0 4px 12px rgba(239, 68, 68, 0.2)'
                    : '0 4px 12px rgba(29, 80, 58, 0.2)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-1px)',
                    boxShadow: mode === 'dark'
                      ? '0 6px 15px rgba(239, 68, 68, 0.3)'
                      : '0 6px 15px rgba(29, 80, 58, 0.3)',
                    background: mode === 'dark'
                      ? 'linear-gradient(90deg, #DC2626 0%, #B91C1C 100%)'
                      : 'linear-gradient(90deg, #0F3724 0%, #0A2A1C 100%)',
                  },
                }}
              >
                {loading ? <CircularProgress size={24} sx={{ color: '#fff' }} /> : "Check Out"}
              </Button>
            ) : (
              <Button
                onClick={handleCheckIn}
                variant="contained"
                disabled={loading}
                sx={{
                  background: mode === 'dark'
                    ? 'linear-gradient(90deg, #10B981 0%, #059669 100%)'
                    : 'linear-gradient(90deg, #1D503A 0%, #0F3724 100%)',
                  color: '#fff',
                  boxShadow: mode === 'dark'
                    ? '0 4px 12px rgba(16, 185, 129, 0.2)'
                    : '0 4px 12px rgba(29, 80, 58, 0.2)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-1px)',
                    boxShadow: mode === 'dark'
                      ? '0 6px 15px rgba(16, 185, 129, 0.3)'
                      : '0 6px 15px rgba(29, 80, 58, 0.3)',
                    background: mode === 'dark'
                      ? 'linear-gradient(90deg, #059669 0%, #047857 100%)'
                      : 'linear-gradient(90deg, #0F3724 0%, #0A2A1C 100%)',
                  },
                }}
              >
                {loading ? <CircularProgress size={24} sx={{ color: '#fff' }} /> : "Check In"}
              </Button>
            )}
          </DialogActions>
        </Dialog>

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          sx={{
            position: 'fixed',
            mt: 7,
            mr: 2,
            zIndex: 9999,
          }}
        >
          <Alert
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            severity={snackbar.severity}
            variant="filled"
            elevation={6}
            sx={{ 
              width: '100%',
              minWidth: '300px',
              background: snackbar.severity === 'success' 
                ? 'linear-gradient(90deg, #10B981 0%, #059669 100%)'
                : 'linear-gradient(90deg, #EF4444 0%, #DC2626 100%)',
              color: '#fff',
              '& .MuiAlert-icon': {
                color: '#fff',
              },
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              position: 'relative',
              zIndex: 9999,
              '& .MuiAlert-action': {
                position: 'relative',
                zIndex: 10000,
                padding: '0 8px',
                alignSelf: 'center',
              },
              '& .MuiIconButton-root': {
                color: '#fff',
                padding: '4px',
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.1)',
                }
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

export default StaffTenantLog; 
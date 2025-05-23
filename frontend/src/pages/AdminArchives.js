import React, { useState, useEffect, useCallback, useContext } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  Alert,
  Stack,
  Grid,
  useTheme
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Restore as RestoreIcon,
  MoreVert as MoreVertIcon,
} from '@mui/icons-material';
import AdminSidebar from '../components/AdminSidebar';
import NotificationBell from '../components/NotificationBell';
import { ThemeContext } from '../App';

// Color constants
const EGGSHELL_WHITE = "#F0EAD6";
const EMERALD_GREEN = "#50C878";
const DARK_EMERALD = "#2E8B57";

const AdminArchives = () => {
  const { mode } = useContext(ThemeContext);
  const theme = useTheme();

  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [students, setStudents] = useState([]);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [studentToRestore, setStudentToRestore] = useState(null);

  // Room and building info state
  const [studentRoom, setStudentRoom] = useState(null);
  const [studentBuilding, setStudentBuilding] = useState(null);
  const [loadingRoomDetails, setLoadingRoomDetails] = useState(false);

  // Fetch inactive students
  const fetchStudents = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/students', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch students');
      }

      const data = await response.json();
      // Filter for Inactive students only
      const filteredStudents = data.filter(student => student.studentStatus === 'Inactive');
      setStudents(filteredStudents);
    } catch (error) {
      console.error('Fetch error:', error);
      showSnackbar(error.message || 'Error fetching students', 'error');
    }
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // Fetch room and building details
  const fetchRoomAndBuildingDetails = useCallback(async (roomId) => {
    if (!roomId) {
      setStudentRoom(null);
      setStudentBuilding(null);
      return;
    }

    const actualRoomId = typeof roomId === 'object' && roomId !== null ? roomId._id : roomId;
    
    if (!actualRoomId) {
      setStudentRoom(null);
      setStudentBuilding(null);
      return;
    }

    try {
      setLoadingRoomDetails(true);
      const roomResponse = await fetch(`/api/admin/rooms/${actualRoomId}`);
      if (!roomResponse.ok) {
        throw new Error('Failed to fetch room details');
      }
      const roomData = await roomResponse.json();
      setStudentRoom(roomData);

      if (roomData.building) {
        const buildingResponse = await fetch(`/api/admin/buildings/${roomData.building}`);
        if (!buildingResponse.ok) {
          throw new Error('Failed to fetch building details');
        }
        const buildingData = await buildingResponse.json();
        setStudentBuilding(buildingData);
      }
    } catch (error) {
      console.error('Error fetching room and building details:', error);
      showSnackbar('Error fetching accommodation details', 'error');
    } finally {
      setLoadingRoomDetails(false);
    }
  }, []);

  // Handle restore student
  const handleRestoreClick = (student) => {
    setStudentToRestore(student);
    setRestoreDialogOpen(true);
  };

  const handleRestoreConfirm = async () => {
    try {
      const response = await fetch(`/api/admin/students/${studentToRestore._id}/studentStatus`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          studentStatus: 'Active'
        }),
      });

      if (response.ok) {
        setStudents(students.filter(s => s._id !== studentToRestore._id));
        showSnackbar('Student restored successfully', 'success');
      } else {
        const data = await response.json();
        showSnackbar(data.message || 'Error restoring student', 'error');
      }
    } catch (error) {
      console.error('Status update error:', error);
      showSnackbar('Error restoring student', 'error');
    } finally {
      setRestoreDialogOpen(false);
      setStudentToRestore(null);
    }
  };

  // Handle view student
  const handleViewStudent = (student) => {
    setSelectedStudent(student);
    setViewDialogOpen(true);
    if (student.room) {
      fetchRoomAndBuildingDetails(student.room);
    } else {
      setStudentRoom(null);
      setStudentBuilding(null);
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  // Filter students based on search term
  const filteredStudents = students.filter(student => 
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.studentDormNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.courseYear?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      <AdminSidebar />

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 4,
          position: 'relative',
          zIndex: 1,
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
              Student Archives
            </Typography>
            <Typography variant="body2" sx={{ 
              color: mode === 'dark' ? '#6B7280' : '#1D503A',
              mt: 1 
            }}>
              View and manage inactive student records.
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
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

        {/* Search Bar */}
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            placeholder="Search by name, email, ID, or course year..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <Box component="span" sx={{ 
                  color: mode === 'dark' ? '#6B7280' : '#1D503A',
                  mr: 1 
                }}>
                  🔍
                </Box>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.7)',
                borderRadius: '12px',
                '& fieldset': {
                  borderColor: mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(29, 80, 58, 0.5)',
                },
                '&:hover fieldset': {
                  borderColor: mode === 'dark' ? 'rgba(16, 185, 129, 0.5)' : 'rgba(29, 80, 58, 0.8)',
                },
                '&.Mui-focused fieldset': {
                  borderColor: mode === 'dark' ? '#10B981' : '#1D503A',
                }
              },
              '& .MuiInputBase-input': {
                color: mode === 'dark' ? '#fff' : '#000',
                '&::placeholder': {
                  color: mode === 'dark' ? '#6B7280' : '#1D503A',
                  opacity: 0.7,
                }
              }
            }}
          />
        </Box>

        {/* Student Table */}
        <TableContainer 
          component={Paper} 
          sx={{ 
            background: mode === 'dark'
              ? 'linear-gradient(145deg, #141414 0%, #0A0A0A 100%)'
              : '#FAF5EE',
            borderRadius: '20px',
            border: mode === 'dark'
              ? '1px solid rgba(255, 255, 255, 0.03)'
              : '1px solid #1D503A',
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
            overflow: 'hidden',
          }}
        >
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ 
                  color: mode === 'dark' ? '#fff' : '#000',
                  borderBottom: mode === 'dark'
                    ? '1px solid rgba(255,255,255,0.05)'
                    : '1px solid #1D503A',
                  background: mode === 'dark'
                    ? 'linear-gradient(90deg, rgba(16, 185, 129, 0.1) 0%, transparent 100%)'
                    : 'linear-gradient(90deg, rgba(29, 80, 58, 0.1) 0%, transparent 100%)',
                }}>Name</TableCell>
                <TableCell sx={{ 
                  color: mode === 'dark' ? '#fff' : '#000',
                  borderBottom: mode === 'dark'
                    ? '1px solid rgba(255,255,255,0.05)'
                    : '1px solid #1D503A',
                  background: mode === 'dark'
                    ? 'linear-gradient(90deg, rgba(16, 185, 129, 0.1) 0%, transparent 100%)'
                    : 'linear-gradient(90deg, rgba(29, 80, 58, 0.1) 0%, transparent 100%)',
                }}>Email</TableCell>
                <TableCell sx={{ 
                  color: mode === 'dark' ? '#fff' : '#000',
                  borderBottom: mode === 'dark'
                    ? '1px solid rgba(255,255,255,0.05)'
                    : '1px solid #1D503A',
                  background: mode === 'dark'
                    ? 'linear-gradient(90deg, rgba(16, 185, 129, 0.1) 0%, transparent 100%)'
                    : 'linear-gradient(90deg, rgba(29, 80, 58, 0.1) 0%, transparent 100%)',
                }}>Course Year</TableCell>
                <TableCell sx={{ 
                  color: mode === 'dark' ? '#fff' : '#000',
                  borderBottom: mode === 'dark'
                    ? '1px solid rgba(255,255,255,0.05)'
                    : '1px solid #1D503A',
                  background: mode === 'dark'
                    ? 'linear-gradient(90deg, rgba(16, 185, 129, 0.1) 0%, transparent 100%)'
                    : 'linear-gradient(90deg, rgba(29, 80, 58, 0.1) 0%, transparent 100%)',
                }}>Dorm Number</TableCell>
                <TableCell sx={{ 
                  color: mode === 'dark' ? '#fff' : '#000',
                  borderBottom: mode === 'dark'
                    ? '1px solid rgba(255,255,255,0.05)'
                    : '1px solid #1D503A',
                  background: mode === 'dark'
                    ? 'linear-gradient(90deg, rgba(16, 185, 129, 0.1) 0%, transparent 100%)'
                    : 'linear-gradient(90deg, rgba(29, 80, 58, 0.1) 0%, transparent 100%)',
                }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => (
                  <TableRow 
                    key={student._id}
                    sx={{
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        background: mode === 'dark' ? 'rgba(16, 185, 129, 0.05)' : 'rgba(16, 185, 129, 0.02)',
                      },
                    }}
                  >
                    <TableCell sx={{ color: '#D1D5DB' }}>{student.name}</TableCell>
                    <TableCell sx={{ color: '#D1D5DB' }}>{student.email}</TableCell>
                    <TableCell sx={{ color: '#D1D5DB' }}>{student.courseYear}</TableCell>
                    <TableCell sx={{ color: '#D1D5DB' }}>{student.studentDormNumber}</TableCell>
                    <TableCell>
                      <IconButton 
                        onClick={() => handleViewStudent(student)}
                        sx={{ 
                          color: '#3B82F6',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            background: 'rgba(59, 130, 246, 0.1)',
                            transform: 'translateY(-1px)',
                          },
                        }}
                      >
                        <VisibilityIcon />
                      </IconButton>
                      <IconButton 
                        onClick={() => handleRestoreClick(student)}
                        sx={{ 
                          color: '#10B981',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            background: 'rgba(16, 185, 129, 0.1)',
                            transform: 'translateY(-1px)',
                          },
                        }}
                      >
                        <RestoreIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} sx={{ textAlign: 'center', py: 8 }}>
                    <Box sx={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center',
                      gap: 2 
                    }}>
                      <Typography variant="h6" sx={{ 
                        color: mode === 'dark' ? '#9CA3AF' : '#1D503A',
                        fontWeight: 500 
                      }}>
                        No inactive students found
                      </Typography>
                      <Typography variant="body2" sx={{ 
                        color: mode === 'dark' ? '#6B7280' : '#2D3748',
                        maxWidth: '400px',
                        textAlign: 'center' 
                      }}>
                        {searchTerm 
                          ? "No students match your search criteria. Try adjusting your search terms."
                          : "There are no inactive students in the system."}
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Alert
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            severity={snackbar.severity}
            variant="filled"
            sx={{ 
              width: '100%',
              minWidth: '300px',
              background: snackbar.severity === 'success' 
                ? 'linear-gradient(90deg, #10B981 0%, #059669 100%)'
                : 'linear-gradient(90deg, #EF4444 0%, #DC2626 100%)',
            }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>

        {/* Restore Confirmation Dialog */}
        <Dialog
          open={restoreDialogOpen}
          onClose={() => setRestoreDialogOpen(false)}
          PaperProps={{
            sx: {
              background: mode === 'dark'
                ? 'linear-gradient(145deg, #141414 0%, #0A0A0A 100%)'
                : '#FAF5EE',
              borderRadius: '20px',
              border: mode === 'dark'
                ? '1px solid rgba(255, 255, 255, 0.03)'
                : '1px solid #1D503A',
            },
          }}
        >
          <DialogTitle sx={{ 
            borderBottom: mode === 'dark'
              ? '1px solid rgba(255,255,255,0.03)'
              : '1px solid #1D503A',
            color: mode === 'dark' ? '#fff' : '#1D503A',
          }}>
            Restore Student
          </DialogTitle>
          <DialogContent sx={{ mt: 2 }}>
            <Typography sx={{ color: mode === 'dark' ? '#D1D5DB' : '#1D503A' }}>
              Are you sure you want to restore {studentToRestore?.name}? This will change their status back to Active.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ p: 2, borderTop: mode === 'dark' ? '1px solid rgba(255,255,255,0.03)' : '1px solid #1D503A' }}>
            <Button 
              onClick={() => setRestoreDialogOpen(false)}
              sx={{ color: mode === 'dark' ? '#9CA3AF' : '#1D503A' }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRestoreConfirm}
              variant="contained"
              sx={{
                background: mode === 'dark'
                  ? 'linear-gradient(90deg, #10B981 0%, #059669 100%)'
                  : 'linear-gradient(90deg, #1D503A 0%, #0F3724 100%)',
              }}
            >
              Restore
            </Button>
          </DialogActions>
        </Dialog>

        {/* View Student Dialog */}
        <Dialog
          open={viewDialogOpen}
          onClose={() => setViewDialogOpen(false)}
          maxWidth="md"
          PaperProps={{
            sx: {
              background: mode === 'dark'
                ? 'linear-gradient(145deg, #141414 0%, #0A0A0A 100%)'
                : '#FAF5EE',
              borderRadius: '20px',
              border: mode === 'dark'
                ? '1px solid rgba(255,255,255,0.03)'
                : '1px solid #1D503A',
            },
          }}
        >
          <DialogTitle sx={{ 
            borderBottom: mode === 'dark'
              ? '1px solid rgba(255,255,255,0.03)'
              : '1px solid #1D503A',
            color: mode === 'dark' ? '#fff' : '#1D503A',
          }}>
            Student Details
          </DialogTitle>
          <DialogContent sx={{ mt: 2 }}>
            {selectedStudent && (
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" sx={{ 
                    color: mode === 'dark' ? '#10B981' : '#1D503A',
                    mb: 2,
                    borderBottom: mode === 'dark'
                      ? '1px solid rgba(16, 185, 129, 0.2)'
                      : '1px solid #1D503A',
                  }}>
                    Personal Information
                  </Typography>
                  <Box sx={{ display: 'grid', gap: 2 }}>
                    <Typography><strong>Name:</strong> {selectedStudent.name}</Typography>
                    <Typography><strong>Email:</strong> {selectedStudent.email}</Typography>
                    <Typography><strong>Contact:</strong> {selectedStudent.contactInfo}</Typography>
                    <Typography><strong>Course Year:</strong> {selectedStudent.courseYear}</Typography>
                    <Typography><strong>Student ID:</strong> {selectedStudent.studentDormNumber}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" sx={{ 
                    color: mode === 'dark' ? '#10B981' : '#1D503A',
                    mb: 2,
                    borderBottom: mode === 'dark'
                      ? '1px solid rgba(16, 185, 129, 0.2)'
                      : '1px solid #1D503A',
                  }}>
                    Room Information
                  </Typography>
                  {loadingRoomDetails ? (
                    <Typography>Loading room details...</Typography>
                  ) : studentRoom && studentBuilding ? (
                    <Box sx={{ display: 'grid', gap: 2 }}>
                      <Typography><strong>Building:</strong> {studentBuilding.name}</Typography>
                      <Typography><strong>Room Number:</strong> {studentRoom.roomNumber}</Typography>
                      <Typography><strong>Room Type:</strong> {studentRoom.type}</Typography>
                      <Typography><strong>Price:</strong> ₱{studentRoom.price}</Typography>
                    </Box>
                  ) : (
                    <Typography>No room assigned</Typography>
                  )}
                </Grid>
              </Grid>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2, borderTop: mode === 'dark' ? '1px solid rgba(255,255,255,0.03)' : '1px solid #1D503A' }}>
            <Button
              onClick={() => setViewDialogOpen(false)}
              variant="contained"
              sx={{
                background: mode === 'dark'
                  ? 'linear-gradient(90deg, #3B82F6 0%, #2563EB 100%)'
                  : 'linear-gradient(90deg, #1D503A 0%, #0F3724 100%)',
              }}
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
};

export default AdminArchives; 
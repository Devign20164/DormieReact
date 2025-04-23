import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  Stack,
  Grid,
  IconButton,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Divider,
  CircularProgress,
  Alert,
  Chip,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Apartment as ApartmentIcon,
  Engineering as EngineeringIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Visibility as ViewIcon,
  MeetingRoom as RoomIcon,
  Add as Add,
  Delete as Delete,
  Male as MaleIcon,
  Female as FemaleIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import AdminSidebar from '../components/AdminSidebar';
import NotificationBell from '../components/NotificationBell';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useSocket } from '../context/SocketContext';

// Initial stats data structure
const initialStatsData = [
  { 
    title: 'Total Buildings', 
    count: '0', 
    icon: <ApartmentIcon sx={{ fontSize: 40, color: '#10B981' }} />
  },
  { 
    title: 'Total Rooms', 
    count: '0', 
    icon: <RoomIcon sx={{ fontSize: 40, color: '#F59E0B' }} />
  },
  { 
    title: 'Male Buildings', 
    count: '0', 
    icon: <MaleIcon sx={{ fontSize: 40, color: '#3B82F6' }} />
  },
  { 
    title: 'Female Buildings', 
    count: '0', 
    icon: <FemaleIcon sx={{ fontSize: 40, color: '#EC4899' }} />
  },
];

const AdminBuilding = () => {
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openRoomsDialog, setOpenRoomsDialog] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'Male',
  });
  const [roomFormData, setRoomFormData] = useState({
    roomNumber: '',
    type: 'Single',
    price: '',
  });
  const [rooms, setRooms] = useState([]);
  const [roomLoading, setRoomLoading] = useState(false);
  const [openAddRoomDialog, setOpenAddRoomDialog] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [buildingToDelete, setBuildingToDelete] = useState(null);
  const [roomDeleteDialogOpen, setRoomDeleteDialogOpen] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState(null);
  const { socket, isConnected } = useSocket();
  const [statsData, setStatsData] = useState(initialStatsData);

  // Fetch all buildings
  const fetchBuildings = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/admin/buildings');
      setBuildings(response.data);
      setError(null);
    } catch (err) {
      setError('Error fetching buildings');
      toast.error('Failed to fetch buildings');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load buildings on component mount
  useEffect(() => {
    fetchBuildings();
  }, []);

  // Fetch rooms for a building
  const fetchRooms = async (buildingId) => {
    try {
      setRoomLoading(true);
      const response = await axios.get(`/api/admin/buildings/${buildingId}/rooms`);
      setRooms(response.data);
    } catch (error) {
      toast.error('Failed to fetch rooms');
      console.error('Error:', error);
    } finally {
      setRoomLoading(false);
    }
  };

  // Handle form submission for create/update
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (selectedBuilding) {
        // Update existing building
        const response = await axios.put(`/api/admin/buildings/${selectedBuilding._id}`, formData);
        setBuildings(buildings.map(b => b._id === selectedBuilding._id ? response.data : b));
        toast.success('Building updated successfully');
      } else {
        // Create new building
        const response = await axios.post('/api/admin/buildings', formData);
        setBuildings([...buildings, response.data]);
        toast.success('Building created successfully');
      }
      handleCloseDialog();
    } catch (err) {
      const message = err.response?.data?.message || 'An error occurred';
      toast.error(message);
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle building deletion
  const handleDeleteClick = (building) => {
    setBuildingToDelete(building);
    setDeleteDialogOpen(true);
  };

  // Handle delete confirmation for building
  const handleDeleteConfirm = async () => {
    try {
      setLoading(true);
      
      // Check if the building has any occupied rooms
      const buildingRooms = await axios.get(`/api/admin/buildings/${buildingToDelete._id}/rooms`);
      const hasOccupiedRooms = buildingRooms.data.some(room => room.status === 'Occupied');
      
      if (hasOccupiedRooms) {
        toast.error('Cannot delete building with occupied rooms. Please remove all occupants first.');
        setDeleteDialogOpen(false);
        setBuildingToDelete(null);
        setLoading(false);
        return;
      }
      
      await axios.delete(`/api/admin/buildings/${buildingToDelete._id}`);
      setBuildings(buildings.filter(b => b._id !== buildingToDelete._id));
      toast.success('Building deleted successfully');
    } catch (error) {
      const message = error.response?.data?.message || 'Error deleting building';
      toast.error(message);
      console.error('Error:', error);
    } finally {
      setLoading(false);
      setDeleteDialogOpen(false);
      setBuildingToDelete(null);
    }
  };

  // Handle delete cancellation
  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setBuildingToDelete(null);
  };

  const handleOpenDialog = (building = null) => {
    if (building) {
      setSelectedBuilding(building);
      setFormData({
        name: building.name,
        type: building.type,
      });
    } else {
      setSelectedBuilding(null);
      setFormData({
        name: '',
        type: 'Male',
      });
    }
    setOpenDialog(true);
  };

  // Handle opening rooms view
  const handleOpenRoomsDialog = async (building) => {
    setSelectedBuilding(building);
    setOpenRoomsDialog(true);
    await fetchRooms(building._id);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedBuilding(null);
    setFormData({
      name: '',
      type: 'Male',
    });
  };

  // Handle room creation
  const handleAddRoom = async (e) => {
    e.preventDefault();
    if (!selectedBuilding) return;

    try {
      setRoomLoading(true);
      
      // Format room number with first letter of building name
      const buildingFirstLetter = selectedBuilding.name.charAt(0).toUpperCase();
      const formattedRoomNumber = `${buildingFirstLetter}-${roomFormData.roomNumber}`;
      
      const response = await axios.post(
        `/api/admin/buildings/${selectedBuilding._id}/rooms`,
        {
          ...roomFormData,
          roomNumber: formattedRoomNumber
        }
      );
      
      setRooms([...rooms, response.data]);
      setOpenAddRoomDialog(false);
      setRoomFormData({ roomNumber: '', type: 'Single', price: '' });
      toast.success('Room created successfully');
    } catch (error) {
      const message = error.response?.data?.message || 'Error creating room';
      toast.error(message);
    } finally {
      setRoomLoading(false);
    }
  };

  // Handle click on delete room button
  const handleDeleteRoomClick = (room) => {
    // Prevent deleting occupied rooms
    if (room.status === 'Occupied') {
      toast.error('Cannot delete an occupied room. Please remove occupants first.');
      return;
    }
    
    setRoomToDelete(room);
    setRoomDeleteDialogOpen(true);
  };

  // Handle room deletion confirmation
  const handleDeleteRoomConfirm = async () => {
    try {
      setRoomLoading(true);
      await axios.delete(`/api/admin/rooms/${roomToDelete._id}`);
      setRooms(rooms.filter(room => room._id !== roomToDelete._id));
      toast.success('Room deleted successfully');
    } catch (error) {
      const message = error.response?.data?.message || 'Error deleting room';
      toast.error(message);
    } finally {
      setRoomLoading(false);
      setRoomDeleteDialogOpen(false);
      setRoomToDelete(null);
    }
  };

  // Handle room deletion cancellation
  const handleDeleteRoomCancel = () => {
    setRoomDeleteDialogOpen(false);
    setRoomToDelete(null);
  };

  // Socket.IO event handlers
  useEffect(() => {
    if (!socket || !isConnected) return;
    
    // Listen for room updates
    socket.on('roomUpdate', (data) => {
      console.log('Room update received:', data);
      
      const { action, room, roomId, buildingId } = data;
      
      // Handle room creation
      if (action === 'create') {
        // Update rooms array if viewing the same building
        if (selectedBuilding && selectedBuilding._id === buildingId) {
          setRooms(prev => [...prev, room]);
        }
        
        // Update buildings data to reflect new room count
        setBuildings(prev => prev.map(building => {
          if (building._id === buildingId) {
            return {
              ...building,
              rooms: building.rooms ? [...building.rooms, room._id] : [room._id]
            };
          }
          return building;
        }));
      }
      
      // Handle room update
      else if (action === 'update') {
        // Update rooms array if viewing the same building
        if (selectedBuilding && selectedBuilding._id === buildingId) {
          setRooms(prev => prev.map(r => r._id === room._id ? room : r));
        }
      }
      
      // Handle room deletion
      else if (action === 'delete') {
        // Update rooms array if viewing the same building
        if (selectedBuilding && selectedBuilding._id === buildingId) {
          setRooms(prev => prev.filter(r => r._id !== roomId));
        }
        
        // Update buildings data to reflect decreased room count
        setBuildings(prev => prev.map(building => {
          if (building._id === buildingId) {
            return {
              ...building,
              rooms: building.rooms ? building.rooms.filter(id => id !== roomId) : []
            };
          }
          return building;
        }));
      }
    });
    
    // Clean up socket listeners on unmount
    return () => {
      socket.off('roomUpdate');
    };
  }, [socket, isConnected, selectedBuilding]);

  // Update stats data whenever buildings or rooms change
  useEffect(() => {
    // Calculate total number of rooms across all buildings
    const totalRooms = buildings.reduce((total, building) => {
      return total + (building.rooms ? building.rooms.length : 0);
    }, 0);
    
    // Update stats data
    setStatsData([
      { 
        title: 'Total Buildings', 
        count: buildings.length.toString(), 
        icon: <ApartmentIcon sx={{ fontSize: 40, color: '#10B981' }} />
      },
      { 
        title: 'Total Rooms', 
        count: totalRooms.toString(), 
        icon: <RoomIcon sx={{ fontSize: 40, color: '#F59E0B' }} />
      },
      { 
        title: 'Male Buildings', 
        count: buildings.filter(b => b.type === 'Male').length.toString(), 
        icon: <MaleIcon sx={{ fontSize: 40, color: '#3B82F6' }} />
      },
      { 
        title: 'Female Buildings', 
        count: buildings.filter(b => b.type === 'Female').length.toString(), 
        icon: <FemaleIcon sx={{ fontSize: 40, color: '#EC4899' }} />
      },
    ]);
  }, [buildings]);

  return (
    <Box sx={{ 
      display: 'flex', 
      minHeight: '100vh',
      background: 'linear-gradient(145deg, #0A0A0A 0%, #141414 100%)',
      color: '#fff',
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
          borderBottom: '1px solid rgba(255,255,255,0.03)',
        }}>
          <Box>
            <Typography variant="h4" sx={{ 
              fontWeight: 600, 
              color: '#fff',
              textShadow: '0 2px 4px rgba(0,0,0,0.2)',
            }}>
              Building Management
            </Typography>
            <Typography variant="body2" sx={{ color: '#6B7280', mt: 1 }}>
              Manage dormitory buildings and rooms.
            </Typography>
          </Box>
          <Stack direction="row" spacing={2} alignItems="center">
            <NotificationBell userType="admin" color="#10B981" />
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            sx={{
              background: 'linear-gradient(90deg, #10B981 0%, #059669 100%)',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-1px)',
                boxShadow: '0 6px 15px rgba(16, 185, 129, 0.3)',
                background: 'linear-gradient(90deg, #059669 0%, #047857 100%)',
              },
            }}
          >
            Add Building
          </Button>
          </Stack>
        </Box>

        {/* Stats Grid */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {statsData.map((stat, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card sx={{ 
                background: 'linear-gradient(145deg, #141414 0%, #0A0A0A 100%)',
                borderRadius: '20px',
                p: 3,
                border: '1px solid rgba(255, 255, 255, 0.03)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 25px rgba(0,0,0,0.3)',
                },
              }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="body2" sx={{ color: '#6B7280' }}>
                    {stat.title}
                  </Typography>
                  {stat.icon}
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="h4" sx={{ 
                    fontWeight: 600, 
                    color: '#fff',
                    textShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  }}>
                    {stat.count}
                  </Typography>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Buildings Table */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress sx={{ color: '#10B981' }} />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : (
          <TableContainer 
            component={Paper} 
            sx={{ 
              background: 'linear-gradient(145deg, #141414 0%, #0A0A0A 100%)',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.03)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
              overflow: 'hidden',
            }}
          >
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ 
                    color: '#fff',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.1) 0%, transparent 100%)',
                  }}>Building Name</TableCell>
                  <TableCell sx={{ 
                    color: '#fff',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.1) 0%, transparent 100%)',
                  }}>Type</TableCell>
                  <TableCell sx={{ 
                    color: '#fff',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.1) 0%, transparent 100%)',
                  }}>Total Rooms</TableCell>
                  <TableCell sx={{ 
                    color: '#fff',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.1) 0%, transparent 100%)',
                  }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {buildings.map((building) => (
                  <TableRow 
                    key={building._id}
                    sx={{
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        background: 'rgba(16, 185, 129, 0.05)',
                      },
                    }}
                  >
                    <TableCell sx={{ 
                      color: '#D1D5DB',
                      borderBottom: '1px solid rgba(255,255,255,0.03)',
                    }}>{building.name}</TableCell>
                    <TableCell sx={{ 
                      color: '#D1D5DB',
                      borderBottom: '1px solid rgba(255,255,255,0.03)',
                    }}>{building.type}</TableCell>
                    <TableCell sx={{ 
                      color: '#D1D5DB',
                      borderBottom: '1px solid rgba(255,255,255,0.03)',
                    }}>{building.rooms?.length || 0}</TableCell>
                    <TableCell sx={{ 
                      borderBottom: '1px solid rgba(255,255,255,0.03)',
                    }}>
                      <IconButton 
                        onClick={() => handleOpenRoomsDialog(building)}
                        sx={{ 
                          color: '#3B82F6',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            background: 'rgba(59, 130, 246, 0.1)',
                            transform: 'translateY(-1px)',
                          },
                        }}
                      >
                        <ViewIcon />
                      </IconButton>
                      <IconButton 
                        onClick={() => handleOpenDialog(building)}
                        sx={{ 
                          color: '#10B981',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            background: 'rgba(16, 185, 129, 0.1)',
                            transform: 'translateY(-1px)',
                          },
                        }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton 
                        onClick={() => handleDeleteClick(building)}
                        sx={{ 
                          color: '#EF4444',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            background: 'rgba(239, 68, 68, 0.1)',
                            transform: 'translateY(-1px)',
                          },
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Add/Edit Building Dialog */}
        <Dialog 
          open={openDialog} 
          onClose={() => setOpenDialog(false)}
          PaperProps={{
            sx: {
              background: 'linear-gradient(145deg, #141414 0%, #0A0A0A 100%)',
              color: '#fff',
              minWidth: '500px',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.03)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
            },
          }}
        >
          <DialogTitle sx={{ 
            borderBottom: '1px solid rgba(255,255,255,0.03)',
            background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.1) 0%, transparent 100%)',
          }}>
            {selectedBuilding ? 'Edit Building' : 'Add Building'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: 'repeat(2, 1fr)', mt: 2 }}>
              <TextField
                required
                autoFocus
                name="name"
                label="Building Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                fullWidth
                sx={{ 
                  '& .MuiOutlinedInput-root': {
                    color: '#fff',
                    '& fieldset': {
                      borderColor: 'rgba(255,255,255,0.1)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(16, 185, 129, 0.5)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#10B981',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: '#9CA3AF',
                    '&.Mui-focused': {
                      color: '#10B981',
                    },
                  },
                }}
              />
              <FormControl fullWidth>
                <InputLabel sx={{ 
                  color: '#9CA3AF',
                  '&.Mui-focused': {
                    color: '#10B981',
                  },
                }}>
                  Type
                </InputLabel>
                <Select
                  required
                  name="type"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  sx={{
                    color: '#fff',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255,255,255,0.1)',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(16, 185, 129, 0.5)',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#10B981',
                    },
                    '& .MuiSvgIcon-root': {
                      color: '#9CA3AF',
                    },
                  }}
                >
                  <MenuItem value="Male">Male</MenuItem>
                  <MenuItem value="Female">Female</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,0.03)' }}>
            <Button 
              onClick={() => setOpenDialog(false)}
              sx={{ 
                color: '#9CA3AF',
                '&:hover': {
                  background: 'rgba(255,255,255,0.05)',
                },
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              variant="contained"
              disabled={loading}
              sx={{
                background: 'linear-gradient(90deg, #10B981 0%, #059669 100%)',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-1px)',
                  boxShadow: '0 6px 15px rgba(16, 185, 129, 0.3)',
                  background: 'linear-gradient(90deg, #059669 0%, #047857 100%)',
                },
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : (selectedBuilding ? 'Update' : 'Create')}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Rooms View Dialog */}
        <Dialog
          open={openRoomsDialog}
          onClose={() => setOpenRoomsDialog(false)}
          maxWidth="lg"
          fullWidth
          PaperProps={{
            sx: {
              background: 'linear-gradient(145deg, #141414 0%, #0A0A0A 100%)',
              color: '#fff',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.03)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
              width: '90%',
              maxHeight: '90vh',
            },
          }}
        >
          <DialogTitle sx={{ 
            borderBottom: '1px solid rgba(255,255,255,0.03)',
            background: 'linear-gradient(90deg, rgba(59, 130, 246, 0.1) 0%, transparent 100%)',
            py: 2,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <Typography variant="h6" sx={{ 
              display: 'flex', 
              alignItems: 'center',
              gap: 1,
              color: '#fff',
            }}>
              <RoomIcon sx={{ color: '#3B82F6' }} />
              {selectedBuilding?.name} - Rooms
            </Typography>
            <Button
              variant="contained"
              onClick={() => setOpenAddRoomDialog(true)}
              startIcon={<AddIcon />}
              sx={{
                background: 'linear-gradient(90deg, #3B82F6 0%, #2563EB 100%)',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-1px)',
                  boxShadow: '0 6px 15px rgba(59, 130, 246, 0.3)',
                  background: 'linear-gradient(90deg, #2563EB 0%, #1D4ED8 100%)',
                },
              }}
            >
              Add Room
            </Button>
          </DialogTitle>
          <DialogContent sx={{ mt: 2, minHeight: '300px', overflow: 'hidden' }}>
            {roomLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', py: 6 }}>
                <CircularProgress sx={{ color: '#3B82F6' }} />
              </Box>
            ) : rooms.length === 0 ? (
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                py: 6,
                color: '#6B7280'
              }}>
                <RoomIcon sx={{ fontSize: 60, mb: 2, color: '#374151' }} />
                <Typography variant="h6">No Rooms Available</Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>Start by adding a room to this building</Typography>
              </Box>
            ) : (
              <TableContainer sx={{ 
                background: 'linear-gradient(145deg, #1a1a1a 0%, #141414 100%)',
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.03)',
                overflow: 'auto',
                '&::-webkit-scrollbar': {
                  width: '8px',
                  height: '8px',
                },
                '&::-webkit-scrollbar-track': {
                  background: 'rgba(0,0,0,0.1)',
                  borderRadius: '8px',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  '&:hover': {
                    background: 'rgba(255,255,255,0.2)',
                  },
                },
              }}>
                <Table size="small" sx={{ minWidth: '100%', tableLayout: 'fixed' }}>
                  <TableHead>
                    <TableRow>
                      <TableCell 
                        sx={{ 
                          width: '20%',
                          color: '#fff',
                          borderBottom: '1px solid rgba(255,255,255,0.05)',
                          background: 'linear-gradient(90deg, rgba(59, 130, 246, 0.1) 0%, transparent 100%)', 
                        }}
                      >
                        Room Number
                      </TableCell>
                      <TableCell 
                        sx={{ 
                          width: '20%',
                          color: '#fff',
                          borderBottom: '1px solid rgba(255,255,255,0.05)',
                          background: 'linear-gradient(90deg, rgba(59, 130, 246, 0.1) 0%, transparent 100%)', 
                        }}
                      >
                        Type
                      </TableCell>
                      <TableCell 
                        sx={{ 
                          width: '20%',
                          color: '#fff',
                          borderBottom: '1px solid rgba(255,255,255,0.05)',
                          background: 'linear-gradient(90deg, rgba(59, 130, 246, 0.1) 0%, transparent 100%)', 
                        }}
                      >
                        Price
                      </TableCell>
                      <TableCell 
                        sx={{ 
                          width: '20%',
                          color: '#fff',
                          borderBottom: '1px solid rgba(255,255,255,0.05)',
                          background: 'linear-gradient(90deg, rgba(59, 130, 246, 0.1) 0%, transparent 100%)', 
                        }}
                      >
                        Status
                      </TableCell>
                      <TableCell 
                        sx={{ 
                          width: '20%',
                          color: '#fff',
                          borderBottom: '1px solid rgba(255,255,255,0.05)',
                          background: 'linear-gradient(90deg, rgba(59, 130, 246, 0.1) 0%, transparent 100%)', 
                        }}
                      >
                        Actions
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rooms.map((room) => (
                      <TableRow 
                        key={room._id}
                        sx={{
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            background: 'rgba(59, 130, 246, 0.05)',
                          },
                        }}
                      >
                        <TableCell sx={{ 
                          color: '#D1D5DB',
                          borderBottom: '1px solid rgba(255,255,255,0.03)',
                        }}>{room.roomNumber}</TableCell>
                        <TableCell sx={{ 
                          color: '#D1D5DB',
                          borderBottom: '1px solid rgba(255,255,255,0.03)',
                        }}>{room.type}</TableCell>
                        <TableCell sx={{ 
                          color: '#D1D5DB',
                          borderBottom: '1px solid rgba(255,255,255,0.03)',
                        }}>${room.price}</TableCell>
                        <TableCell sx={{ 
                          borderBottom: '1px solid rgba(255,255,255,0.03)',
                        }}>
                          <Box sx={{ 
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                          }}>
                            <Box sx={{ 
                              display: 'inline-flex',
                              px: 1.5,
                              py: 0.5,
                              borderRadius: '12px',
                              bgcolor: room.status === 'Available' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                              color: room.status === 'Available' ? '#10B981' : '#EF4444',
                            }}>
                              {room.status}
                            </Box>
                            <Typography variant="caption" sx={{ color: '#9CA3AF' }}>
                              ({room.occupants?.length || 0}/{room.type === 'Single' ? 1 : 2})
                            </Typography>
                            {room.occupants?.length > 0 && (
                              <Tooltip 
                                title={
                                  <Box>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>Occupants</Typography>
                                    {room.occupants.map(student => (
                                      <Typography key={student._id} variant="body2">
                                        • {student.name}
                                      </Typography>
                                    ))}
                                  </Box>
                                }
                                arrow
                              >
                                <InfoIcon sx={{ fontSize: 16, color: '#3B82F6', cursor: 'pointer' }} />
                              </Tooltip>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell sx={{ 
                          borderBottom: '1px solid rgba(255,255,255,0.03)',
                        }}>
                          {room.status === 'Occupied' ? (
                            <Tooltip title="Cannot delete occupied room">
                              <span>
                                <IconButton
                                  disabled
                                  sx={{ 
                                    color: 'rgba(239, 68, 68, 0.3)',
                                  }}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </span>
                            </Tooltip>
                          ) : (
                            <IconButton
                              onClick={() => handleDeleteRoomClick(room)}
                              sx={{ 
                                color: '#EF4444',
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                  background: 'rgba(239, 68, 68, 0.1)',
                                  transform: 'translateY(-1px)',
                                },
                              }}
                            >
                              <DeleteIcon />
                            </IconButton>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,0.03)' }}>
            <Button 
              onClick={() => setOpenRoomsDialog(false)}
              variant="contained"
              sx={{
                background: 'linear-gradient(90deg, #3B82F6 0%, #2563EB 100%)',
                color: '#fff',
                px: 3,
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-1px)',
                  boxShadow: '0 6px 15px rgba(59, 130, 246, 0.3)',
                  background: 'linear-gradient(90deg, #2563EB 0%, #1D4ED8 100%)',
                },
              }}
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>

        {/* Add Room Dialog */}
        <Dialog
          open={openAddRoomDialog}
          onClose={() => setOpenAddRoomDialog(false)}
          PaperProps={{
            sx: {
              background: 'linear-gradient(145deg, #141414 0%, #0A0A0A 100%)',
              color: '#fff',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.03)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
              minWidth: '500px',
            },
          }}
        >
          <form onSubmit={handleAddRoom}>
            <DialogTitle sx={{ 
              borderBottom: '1px solid rgba(255,255,255,0.03)',
              background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.1) 0%, transparent 100%)',
            }}>
              Add New Room
            </DialogTitle>
            <DialogContent>
              <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: 'repeat(2, 1fr)', mt: 2 }}>
                <TextField
                  required
                  autoFocus
                  name="roomNumber"
                  label="Room Number"
                  value={roomFormData.roomNumber}
                  onChange={(e) => setRoomFormData({ ...roomFormData, roomNumber: e.target.value })}
                  fullWidth
                  sx={{ 
                    '& .MuiOutlinedInput-root': {
                      color: '#fff',
                      '& fieldset': {
                        borderColor: 'rgba(255,255,255,0.1)',
                      },
                      '&:hover fieldset': {
                        borderColor: 'rgba(16, 185, 129, 0.5)',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#10B981',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: '#9CA3AF',
                      '&.Mui-focused': {
                        color: '#10B981',
                      },
                    },
                  }}
                />
                <FormControl fullWidth>
                  <InputLabel sx={{ 
                    color: '#9CA3AF',
                    '&.Mui-focused': {
                      color: '#10B981',
                    },
                  }}>
                    Type
                  </InputLabel>
                  <Select
                    required
                    name="type"
                    value={roomFormData.type}
                    onChange={(e) => setRoomFormData({ ...roomFormData, type: e.target.value })}
                    sx={{
                      color: '#fff',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255,255,255,0.1)',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(16, 185, 129, 0.5)',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#10B981',
                      },
                      '& .MuiSvgIcon-root': {
                        color: '#9CA3AF',
                      },
                    }}
                  >
                    <MenuItem value="Single">Single</MenuItem>
                    <MenuItem value="Double">Double</MenuItem>
                  </Select>
                </FormControl>
                <TextField
                  required
                  name="price"
                  label="Price"
                  type="number"
                  value={roomFormData.price}
                  onChange={(e) => setRoomFormData({ ...roomFormData, price: Number(e.target.value) })}
                  inputProps={{ min: "0" }}
                  fullWidth
                  sx={{ 
                    '& .MuiOutlinedInput-root': {
                      color: '#fff',
                      '& fieldset': {
                        borderColor: 'rgba(255,255,255,0.1)',
                      },
                      '&:hover fieldset': {
                        borderColor: 'rgba(16, 185, 129, 0.5)',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#10B981',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: '#9CA3AF',
                      '&.Mui-focused': {
                        color: '#10B981',
                      },
                    },
                  }}
                />
              </Box>
            </DialogContent>
            <DialogActions sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,0.03)' }}>
              <Button 
                onClick={() => setOpenAddRoomDialog(false)}
                sx={{ 
                  color: '#9CA3AF',
                  '&:hover': {
                    background: 'rgba(255,255,255,0.05)',
                  },
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={roomLoading}
                sx={{
                  background: 'linear-gradient(90deg, #10B981 0%, #059669 100%)',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-1px)',
                    boxShadow: '0 6px 15px rgba(16, 185, 129, 0.3)',
                    background: 'linear-gradient(90deg, #059669 0%, #047857 100%)',
                  },
                }}
              >
                {roomLoading ? <CircularProgress size={24} color="inherit" /> : 'Add Room'}
              </Button>
            </DialogActions>
          </form>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteDialogOpen}
          onClose={handleDeleteCancel}
          aria-labelledby="delete-dialog-title"
          aria-describedby="delete-dialog-description"
          PaperProps={{
            sx: {
              background: 'linear-gradient(145deg, #141414 0%, #0A0A0A 100%)',
              color: '#fff',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.03)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
              minWidth: '400px',
            },
          }}
        >
          <DialogTitle 
            id="delete-dialog-title"
            sx={{ 
              borderBottom: '1px solid rgba(255,255,255,0.03)',
              background: 'linear-gradient(90deg, rgba(239, 68, 68, 0.1) 0%, transparent 100%)',
              py: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <DeleteIcon sx={{ color: '#EF4444' }} />
            <Box component="span" sx={{ color: '#fff' }}>
              Confirm Delete
            </Box>
          </DialogTitle>
          <DialogContent sx={{ mt: 2 }}>
            <Box sx={{ color: '#D1D5DB', fontSize: '1rem' }}>
              Are you sure you want to delete <Box component="span" sx={{ color: '#EF4444', fontWeight: 500 }}>{buildingToDelete?.name}</Box>?
            </Box>
            <Box 
              sx={{ 
                color: '#9CA3AF',
                mt: 1,
                fontSize: '0.875rem'
              }}
            >
              This action cannot be undone.
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,0.03)' }}>
            <Button 
              onClick={handleDeleteCancel}
              sx={{ 
                color: '#9CA3AF',
                px: 3,
                '&:hover': {
                  background: 'rgba(255,255,255,0.05)',
                },
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleDeleteConfirm}
              variant="contained"
              sx={{
                background: 'linear-gradient(90deg, #EF4444 0%, #DC2626 100%)',
                color: '#fff',
                px: 3,
                boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-1px)',
                  boxShadow: '0 6px 15px rgba(239, 68, 68, 0.3)',
                  background: 'linear-gradient(90deg, #DC2626 0%, #B91C1C 100%)',
                },
              }}
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>

        {/* Room Delete Confirmation Dialog */}
        <Dialog
          open={roomDeleteDialogOpen}
          onClose={handleDeleteRoomCancel}
          aria-labelledby="room-delete-dialog-title"
          aria-describedby="room-delete-dialog-description"
          PaperProps={{
            sx: {
              background: 'linear-gradient(145deg, #141414 0%, #0A0A0A 100%)',
              color: '#fff',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.03)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
              minWidth: '400px',
            },
          }}
        >
          <DialogTitle 
            id="room-delete-dialog-title"
            sx={{ 
              borderBottom: '1px solid rgba(255,255,255,0.03)',
              background: 'linear-gradient(90deg, rgba(239, 68, 68, 0.1) 0%, transparent 100%)',
              py: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <DeleteIcon sx={{ color: '#EF4444' }} />
            <Box component="span" sx={{ color: '#fff' }}>
              Confirm Delete
            </Box>
          </DialogTitle>
          <DialogContent sx={{ mt: 2 }}>
            <Box sx={{ color: '#D1D5DB', fontSize: '1rem' }}>
              Are you sure you want to delete <Box component="span" sx={{ color: '#EF4444', fontWeight: 500 }}>{roomToDelete?.roomNumber}</Box>?
            </Box>
            <Box 
              sx={{ 
                color: '#9CA3AF',
                mt: 1,
                fontSize: '0.875rem'
              }}
            >
              This action cannot be undone.
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,0.03)' }}>
            <Button 
              onClick={handleDeleteRoomCancel}
              sx={{ 
                color: '#9CA3AF',
                px: 3,
                '&:hover': {
                  background: 'rgba(255,255,255,0.05)',
                },
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleDeleteRoomConfirm}
              variant="contained"
              sx={{
                background: 'linear-gradient(90deg, #EF4444 0%, #DC2626 100%)',
                color: '#fff',
                px: 3,
                boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-1px)',
                  boxShadow: '0 6px 15px rgba(239, 68, 68, 0.3)',
                  background: 'linear-gradient(90deg, #DC2626 0%, #B91C1C 100%)',
                },
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

export default AdminBuilding; 
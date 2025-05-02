import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  Stack,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Avatar,
  Chip,
  Divider,
  Button,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Slide,
  Backdrop,
  Paper,
  Tab,
  Tabs,
  TextField,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Circle as CircleIcon,
  Person as PersonIcon,
  Apartment as ApartmentIcon,
  Warning as WarningIcon,
  ReceiptLong as ReceiptLongIcon,
  DoorFront as DoorFrontIcon,
  Payment as PaymentIcon,
  ErrorOutline as ErrorOutlineIcon,
  Close as CloseIcon,
  Info as InfoIcon,
  DateRange as DateRangeIcon,
  CreditCard as CreditCardIcon,
  School as SchoolIcon,
  EventNote as EventNoteIcon,
  Wc as WcIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Build as BuildIcon,
  Help as HelpIcon,
  Settings as SettingsIcon,
  Chat as ChatIcon,
  ArrowForward as ArrowForwardIcon,
  MeetingRoom as MeetingRoomIcon,
  NoteAdd as NoteAddIcon,
  EmojiEvents as EmojiEventsIcon,
  SportsScore as SportsScoreIcon,
  HelpOutline as HelpOutlineIcon,
} from '@mui/icons-material';
import StudentSidebar from '../components/StudentSidebar';
import NotificationBell from '../components/NotificationBell';
import axios from 'axios';

// Transition for dialogs
const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const StudentDashboard = () => {
  const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [studentData, setStudentData] = useState(null);
  const [buildingData, setBuildingData] = useState(null);
  const [recentOffenses, setRecentOffenses] = useState([]);
  const [recentBills, setRecentBills] = useState([]);
  const [latestBill, setLatestBill] = useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Dialog states
  const [profileDialog, setProfileDialog] = useState(false);
  const [billDialog, setBillDialog] = useState(false);
  const [offenseDialog, setOffenseDialog] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [selectedOffense, setSelectedOffense] = useState(null);
  const [quickActionsDialog, setQuickActionsDialog] = useState(false);
  
  // Tab state for profile dialog
  const [profileTab, setProfileTab] = useState(0);
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setProfileTab(newValue);
  };
  
  // Dialog open/close handlers
  const handleOpenProfileDialog = () => {
    setProfileDialog(true);
  };
  
  const handleCloseProfileDialog = () => {
    setProfileDialog(false);
  };
  
  const handleOpenBillDialog = (bill) => {
    setSelectedBill(bill);
    setBillDialog(true);
  };
  
  const handleCloseBillDialog = () => {
    setBillDialog(false);
    setSelectedBill(null);
  };
  
  const handleOpenOffenseDialog = (offense) => {
    setSelectedOffense(offense);
    setOffenseDialog(true);
  };
  
  const handleCloseOffenseDialog = () => {
    setOffenseDialog(false);
    setSelectedOffense(null);
  };
  
  const handleOpenQuickActions = () => {
    setQuickActionsDialog(true);
  };
  
  const handleCloseQuickActions = () => {
    setQuickActionsDialog(false);
  };

  // Fetch student data on component mount
  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        setLoading(true);
        
        // Fetch student profile with populated room and building data
        const profileRes = await axios.get('/api/students/profile', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        console.log('Student profile data:', profileRes.data);
        setStudentData(profileRes.data);
        
        // If room is available, fetch building data
        if (profileRes.data.room && profileRes.data.room._id) {
          try {
            console.log('Room ID:', profileRes.data.room._id);
            const roomRes = await axios.get(`/api/rooms/${profileRes.data.room._id}`, {
              headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`
              }
            });
            console.log('Room data:', roomRes.data);
            console.log('Building reference:', roomRes.data.building);
            
            if (roomRes.data.building) {
              const buildingRes = await axios.get(`/api/buildings/${roomRes.data.building}`, {
                headers: {
                  Authorization: `Bearer ${localStorage.getItem('token')}`
                }
              });
              console.log('Building data:', buildingRes.data);
              setBuildingData(buildingRes.data);
            } else {
              console.log('No building reference found in room data');
            }
          } catch (roomErr) {
            console.warn('Error fetching room/building data:', roomErr);
          }
        }
        
        // Fetch data in parallel to improve loading time
        const fetchPromises = [];
        
        // Fetch student's bills
        fetchPromises.push(
          axios.get(`/api/students/${profileRes.data._id}/bills`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          })
          .then(billsRes => {
            // Sort bills by date and get the latest 5
            const sortedBills = billsRes.data.sort((a, b) => 
              new Date(b.createdAt) - new Date(a.createdAt)
            );
            
            setRecentBills(sortedBills.slice(0, 5)); // Get the 5 most recent bills
            setLatestBill(sortedBills[0]); // Set the latest bill
          })
          .catch(err => {
            console.warn('Error fetching bills:', err);
            // Don't set error state, just log the warning
          })
        );
        
        // Fetch student's offenses
        fetchPromises.push(
          axios.get(`/api/students/offenses`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          })
          .then(offensesRes => {
            console.log('Offenses API response:', offensesRes.data);
            
            // Sort offenses by date and get the latest 5
            const sortedOffenses = offensesRes.data.sort((a, b) => 
              new Date(b.dateOfOffense) - new Date(a.dateOfOffense)
            );
            
            // Check if we got any offenses
            if (sortedOffenses.length === 0) {
              console.log('No offenses returned from API, using sample data for development');
              // Uncomment the next line to use sample data for development/testing
              // setRecentOffenses(generateSampleOffenses().slice(0, 5));
            } else {
              setRecentOffenses(sortedOffenses.slice(0, 5)); // Get the 5 most recent offenses
            }
          })
          .catch(err => {
            console.warn('Error fetching offenses:', err);
            // For development, uncomment the next line to use sample data when API fails
            setRecentOffenses(generateSampleOffenses().slice(0, 5));
          })
        );
        
        // Wait for all requests to complete
        await Promise.allSettled(fetchPromises);
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching student data:', err);
        setError('Failed to load student data. Please try again later.');
        setLoading(false);
      }
    };

    fetchStudentData();
  }, []);

  // Function to get color based on payment status
  const getStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'paid':
        return '#10B981'; // green
      case 'partially paid':
      case 'partial_paid':
      case 'incomplete payment':
        return '#F59E0B'; // amber
      case 'overdue':
        return '#EF4444'; // red
      case 'pending':
      default:
        return '#6B7280'; // gray
    }
  };

  // Function to format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Function to generate sample offense data for testing UI
  const generateSampleOffenses = () => {
    return [
      {
        _id: '1',
        offenseReason: 'Late night noise complaint',
        dateOfOffense: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        typeOfOffense: '1st Offense',
        status: 'Pending'
      },
      {
        _id: '2',
        offenseReason: 'Missing curfew',
        dateOfOffense: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        typeOfOffense: 'Minor Offense',
        status: 'Resolved'
      },
      {
        _id: '3',
        offenseReason: 'Unauthorized guest in room',
        dateOfOffense: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        typeOfOffense: '1st Offense',
        status: 'Pending'
      }
    ];
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      height: '100vh',
      background: 'linear-gradient(145deg, #0A0A0A 0%, #141414 100%)',
      color: '#fff',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <StudentSidebar />

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          height: '100%',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          zIndex: 1,
          p: { xs: 2, md: 3 },
        }}
      >
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress sx={{ color: '#2DD4BF' }} />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>
        ) : (
          <Stack spacing={2.5} sx={{ width: '100%' }}>
            {/* Profile Card */}
            <Card sx={{ 
              background: 'linear-gradient(145deg, #141414 0%, #0A0A0A 100%)',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.03)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
              overflow: 'hidden',
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                background: 'linear-gradient(90deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0) 100%)',
                zIndex: 0,
              }
            }}>
              <Box sx={{ p: { xs: 2, md: 2.5 }, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: 'center', gap: 3, position: 'relative', zIndex: 1 }}>
                <Avatar 
                  sx={{ 
                    width: 60, 
                    height: 60, 
                    bgcolor: '#2DD4BF',
                    fontSize: 32,
                    fontWeight: 'bold',
                    boxShadow: '0 0 15px rgba(45, 212, 191, 0.5)',
                  }}
                >
                  {userData.name ? userData.name.charAt(0) : 'S'}
                </Avatar>
                
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#fff' }}>
                    {userData.name || 'form'}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#94A3B8' }}>
                    {studentData?.email || 'devignify.connect@gmail.com'}
                  </Typography>
                </Box>

                <Stack 
                  direction={{ xs: 'column', md: 'row' }} 
                  spacing={3} 
                  sx={{ 
                    ml: { xs: 0, sm: 2 }, 
                    alignItems: { xs: 'flex-start', md: 'center' },
                    width: { xs: '100%', sm: 'auto' }
                  }}
                >
                  <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                    <Box>
                      <Typography variant="caption" sx={{ color: '#94A3B8', display: 'flex', alignItems: 'center' }}>
                        <PersonIcon sx={{ fontSize: 14, mr: 0.5, color: '#8B5CF6' }} /> Dorm Number
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#fff', fontWeight: 'medium' }}>
                        {studentData?.studentDormNumber || '20240076'}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: '#94A3B8', display: 'flex', alignItems: 'center' }}>
                        <ApartmentIcon sx={{ fontSize: 14, mr: 0.5, color: '#8B5CF6' }} /> Building
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#fff', fontWeight: 'medium' }}>
                        {buildingData?.name || 
                         (typeof studentData?.room?.building === 'string' ? studentData?.room?.building : studentData?.room?.building?.name) || 
                         'form'}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: '#94A3B8', display: 'flex', alignItems: 'center' }}>
                        <DoorFrontIcon sx={{ fontSize: 14, mr: 0.5, color: '#8B5CF6' }} /> Room Number
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#fff', fontWeight: 'medium' }}>
                        {studentData?.room?.roomNumber || 'F-902'}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: '#94A3B8', display: 'flex', alignItems: 'center' }}>
                        <WcIcon sx={{ fontSize: 14, mr: 0.5, color: '#8B5CF6' }} /> Room Type
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#fff', fontWeight: 'medium' }}>
                        {studentData?.room?.type || 'Single'}
                      </Typography>
                    </Box>
                  </Box>
                </Stack>
              </Box>
            </Card>
            
            {/* Main Cards */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2.5 }}>
              {/* Latest Bill Card */}
              <Card sx={{ 
                background: 'linear-gradient(145deg, #141414 0%, #0A0A0A 100%)',
                borderRadius: '20px',
                border: '1px solid rgba(255, 255, 255, 0.03)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                flex: '1 1 28%',
                minWidth: { xs: '100%', sm: '320px', md: '30%' },
                display: 'flex', 
                flexDirection: 'column',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '5px',
                  height: '100%',
                  background: 'linear-gradient(to bottom, #2DD4BF, #2DD4BF33)',
                  zIndex: 1,
                }
              }}>
                <Box sx={{ p: 2, borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CreditCardIcon sx={{ color: '#2DD4BF' }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                      Latest Bill
                    </Typography>
                  </Box>
                  {latestBill && (
                    <Chip 
                      label="paid" 
                      size="small"
                      sx={{ 
                        bgcolor: 'rgba(45, 212, 191, 0.2)',
                        color: '#2DD4BF',
                        fontWeight: 'medium',
                        fontSize: '0.625rem',
                        height: 20,
                        boxShadow: '0 0 10px rgba(45, 212, 191, 0.3)',
                      }}
                    />
                  )}
                </Box>
                
                <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
                  <Box>
                    <Box sx={{ mb: 1.5 }}>
                      <Typography variant="caption" sx={{ color: '#94A3B8', display: 'flex', alignItems: 'center' }}>
                        <DateRangeIcon sx={{ fontSize: 14, mr: 0.5, color: '#8B5CF6' }} /> Bill Period
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#fff' }}>
                        Apr 23, 2025 - May 22, 2025
                      </Typography>
                    </Box>

                    <Box sx={{ mb: 1.5 }}>
                      <Typography variant="caption" sx={{ color: '#94A3B8', display: 'flex', alignItems: 'center' }}>
                        <DateRangeIcon sx={{ fontSize: 14, mr: 0.5, color: '#8B5CF6' }} /> Due Date
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#fff' }}>
                        Apr 30, 2025
                      </Typography>
                    </Box>

                    <Box sx={{ mb: 1.5 }}>
                      <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                        Total Amount
                      </Typography>
                      <Typography variant="h5" sx={{ 
                        color: '#2DD4BF', 
                        fontWeight: 'bold',
                        textShadow: '0 0 10px rgba(45, 212, 191, 0.7)'
                      }}>
                        ₱2,242,723
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                      <Box>
                        <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                          Paid Amount
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#10B981', fontWeight: 'medium' }}>
                          ₱100,000,000,000,000
                        </Typography>
                      </Box>

                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                          Balance Due
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#EF4444', fontWeight: 'medium' }}>
                          ₱-99,999,999,997,757,280
                        </Typography>
                      </Box>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
                    <SportsScoreIcon sx={{ color: '#10B981', fontSize: 18 }} />
                    <Typography variant="body2" sx={{ color: '#10B981', fontSize: '0.8rem' }}>
                      Payment completed on time
                    </Typography>
                  </Box>
                </Box>
              </Card>

              {/* Recent Offenses Card */}
              <Card sx={{ 
                background: 'linear-gradient(145deg, #141414 0%, #0A0A0A 100%)',
                borderRadius: '20px',
                border: '1px solid rgba(255, 255, 255, 0.03)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                flex: '1 1 28%',
                minWidth: { xs: '100%', sm: '320px', md: '30%' },
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '5px',
                  height: '100%',
                  background: 'linear-gradient(to bottom, #10B981, #10B98133)',
                  zIndex: 1,
                }
              }}>
                <Box sx={{ p: 2, borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <WarningIcon sx={{ color: recentOffenses.length > 0 ? '#EF4444' : '#10B981' }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                      Recent Offenses
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    {recentOffenses.length > 0 && (
                      <Box
                        sx={{ 
                          color: '#EF4444',
                          fontWeight: 'medium',
                          fontSize: '0.75rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5,
                          cursor: 'pointer',
                        }}
                        onClick={() => {
                          // Simple function to show all offenses in a future implementation
                          // For now, we'll just open the dialog with the first offense if available
                          if (recentOffenses.length > 0) {
                            handleOpenOffenseDialog(recentOffenses[0]);
                          }
                        }}
                      >
                        <Typography component="span" sx={{ fontSize: '0.75rem', color: '#EF4444' }}>
                          View All
                        </Typography>
                        <ArrowForwardIcon fontSize="small" />
                      </Box>
                    )}
                    <Chip 
                      label={recentOffenses.length}
                      size="small"
                      sx={{ 
                        bgcolor: recentOffenses.length > 0 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                        color: recentOffenses.length > 0 ? '#EF4444' : '#10B981',
                        fontWeight: 'medium',
                        fontSize: '0.625rem',
                        height: 20,
                        boxShadow: recentOffenses.length > 0 ? '0 0 10px rgba(239, 68, 68, 0.3)' : '0 0 10px rgba(16, 185, 129, 0.3)',
                      }}
                    />
                  </Box>
                </Box>

                <Box sx={{ flexGrow: 1, overflow: 'hidden', height: 237, position: 'relative', zIndex: 1 }}>
                  {recentOffenses.length === 0 ? (
                    // Show no offenses view when there are no offenses
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                      <Box sx={{ 
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 60,
                        height: 60,
                        borderRadius: '50%',
                        bgcolor: 'rgba(16, 185, 129, 0.1)',
                        mb: 2,
                        boxShadow: '0 0 20px rgba(16, 185, 129, 0.3)',
                      }}>
                        <EmojiEventsIcon sx={{ color: '#10B981', fontSize: 30 }} />
                      </Box>
                      <Typography variant="body1" sx={{ color: '#fff', fontWeight: 'medium', mb: 1 }}>
                        No offenses recorded
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#94A3B8', textAlign: 'center' }}>
                        Good job! Keep up the good work
                      </Typography>
                    </Box>
                  ) : (
                    // Show list of offenses when there are offenses
                    <List disablePadding>
                      {recentOffenses.map((offense, index) => (
                        <ListItem 
                          key={offense._id || index}
                          button
                          onClick={() => handleOpenOffenseDialog(offense)}
                          divider={index < recentOffenses.length - 1}
                          sx={{ 
                            py: 1.5,
                            borderBottom: index < recentOffenses.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.03)' }
                          }}
                        >
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                <Typography sx={{ color: '#fff', fontWeight: 'medium', fontSize: '0.875rem' }}>
                                  {offense.typeOfOffense || 'Offense'}
                                </Typography>
                              </Box>
                            }
                            secondary={
                              <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                                {formatDate(offense.dateOfOffense)}
                              </Typography>
                            }
                            sx={{ pr: 1 }}
                          />
                          <Chip
                            label={offense.status || 'Pending'}
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: '0.625rem',
                              bgcolor: 'rgba(239, 68, 68, 0.2)',
                              color: '#EF4444',
                              '& .MuiChip-label': { px: 1, py: 0 },
                              boxShadow: '0 0 7px rgba(239, 68, 68, 0.2)',
                            }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  )}
                </Box>
              </Card>

              {/* Recent Bills Card */}
              <Card sx={{ 
                background: 'linear-gradient(145deg, #141414 0%, #0A0A0A 100%)',
                borderRadius: '20px',
                border: '1px solid rgba(255, 255, 255, 0.03)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                flex: '1 1 28%',
                minWidth: { xs: '100%', sm: '320px', md: '30%' },
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '5px',
                  height: '100%',
                  background: 'linear-gradient(to bottom, #2DD4BF, #2DD4BF33)',
                  zIndex: 1,
                }
              }}>
                <Box sx={{ p: 2, borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ReceiptLongIcon sx={{ color: '#2DD4BF' }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                      Recent Bills
                    </Typography>
                  </Box>
                  <Box
                    component="a"
                    href="/student/bill"
                    sx={{ 
                      color: '#2DD4BF',
                      fontWeight: 'medium',
                      fontSize: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                      textDecoration: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <Typography component="span" sx={{ fontSize: '0.75rem', color: '#2DD4BF' }}>
                      View All
                    </Typography>
                    <ArrowForwardIcon fontSize="small" />
                  </Box>
                </Box>
                
                <Box sx={{ flexGrow: 1, overflow: 'hidden', maxHeight: 237, position: 'relative', zIndex: 1 }}>
                  <List disablePadding>
                    {recentBills.length > 0 ? (
                      recentBills.map((bill, index) => (
                        <ListItem 
                          key={bill._id || index}
                          button
                          onClick={() => handleOpenBillDialog(bill)}
                          divider={index < recentBills.length - 1}
                          sx={{ 
                            py: 1.5,
                            borderBottom: index < recentBills.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.03)' }
                          }}
                        >
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                <Typography sx={{ color: '#fff', fontWeight: 'medium', fontSize: '0.875rem' }}>
                                  Bill #{bill._id.substring(bill._id.length - 6)}
                                </Typography>
                                <Typography sx={{ 
                                  color: '#2DD4BF', 
                                  fontWeight: 'bold', 
                                  fontSize: '0.875rem',
                                  textShadow: '0 0 5px rgba(45, 212, 191, 0.5)'
                                }}>
                                  ₱{bill.amount ? bill.amount.toLocaleString() : '2,242,723'}
                                </Typography>
                              </Box>
                            }
                            secondary={
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                                  Due: {formatDate(bill.dueDate)}
                                </Typography>
                                <Chip 
                                  label={bill.status || 'pending'}
                                  size="small"
                                  sx={{ 
                                    height: 20,
                                    fontSize: '0.625rem',
                                    bgcolor: `${getStatusColor(bill.status)}20`,
                                    color: getStatusColor(bill.status),
                                    '& .MuiChip-label': { px: 1, py: 0 },
                                    boxShadow: `0 0 7px ${getStatusColor(bill.status)}20`,
                                  }}
                                />
                              </Box>
                            }
                          />
                        </ListItem>
                      ))
                    ) : (
                      // Fallback if no bills are available
                      <ListItem sx={{ py: 2 }}>
                        <ListItemText
                          primary={
                            <Typography sx={{ color: '#fff', textAlign: 'center' }}>
                              No recent bills
                            </Typography>
                          }
                        />
                      </ListItem>
                    )}
                  </List>
                </Box>
              </Card>
            </Box>

            {/* Quick Actions */}
            <Box sx={{ mt: 1 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                Quick Actions
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2.5 }}>
                {[
                  {
                    title: 'Submit Service Request',
                    icon: <NoteAddIcon sx={{ fontSize: 24, color: '#8B5CF6' }} />,
                    color: '#8B5CF6',
                    bgcolor: 'rgba(139, 92, 246, 0.3)',
                    description: 'Report issues with your room',
                    path: '/student/form'
                  },
                  {
                    title: 'Pay Bills',
                    icon: <PaymentIcon sx={{ fontSize: 24, color: '#2DD4BF' }} />,
                    color: '#2DD4BF',
                    bgcolor: 'rgba(45, 212, 191, 0.3)',
                    description: 'View and pay outstanding bills',
                    path: '/student/bills'
                  },
                  {
                    title: 'Contact Admin',
                    icon: <ChatIcon sx={{ fontSize: 24, color: '#10B981' }} />,
                    color: '#10B981',
                    bgcolor: 'rgba(16, 185, 129, 0.3)',
                    description: 'Get help from dorm management',
                    path: '/student/messages'
                  },
                  {
                    title: 'FAQs',
                    icon: <HelpOutlineIcon sx={{ fontSize: 24, color: '#F97316' }} />,
                    color: '#F97316',
                    bgcolor: 'rgba(249, 115, 22, 0.3)',
                    description: 'Find answers to common questions',
                    path: '/student/faqs'
                  }
                ].map((action, index) => (
                  <Card 
                    key={index}
                    component="a" 
                    href={action.path}
                    sx={{ 
                      background: 'linear-gradient(145deg, #141414 0%, #0A0A0A 100%)',
                      borderRadius: '20px',
                      border: '1px solid rgba(255, 255, 255, 0.03)',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                      p: 2,
                      flex: '1 1 20%',
                      minWidth: { xs: '45%', sm: '200px', md: '21%' },
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      textAlign: 'center',
                      textDecoration: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      position: 'relative',
                      overflow: 'hidden',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 8px 25px rgba(0,0,0,0.3)',
                        '&::after': {
                          opacity: 1,
                        }
                      },
                      '&::after': {
                        content: '""',
                        position: 'absolute',
                        inset: 0,
                        borderRadius: '20px',
                        padding: '1px',
                        background: `linear-gradient(135deg, ${action.color}50, transparent)`,
                        WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                        WebkitMaskComposite: 'xor',
                        maskComposite: 'exclude',
                        opacity: 0.5,
                        transition: 'opacity 0.3s ease',
                      }
                    }}
                  >
                    <Box 
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: action.bgcolor,
                        mb: 1.5,
                        boxShadow: `0 0 15px ${action.color}40`,
                        zIndex: 1,
                      }}
                    >
                      {action.icon}
                    </Box>
                    <Typography variant="body1" sx={{ color: '#fff', fontWeight: 'bold', mb: 0.5, zIndex: 1 }}>
                      {action.title}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '0.75rem', zIndex: 1 }}>
                      {action.description}
                    </Typography>
                  </Card>
                ))}
              </Box>
            </Box>
          </Stack>
        )}
      </Box>

      {/* Profile Dialog */}
      <Dialog
        open={profileDialog}
        onClose={handleCloseProfileDialog}
        TransitionComponent={Transition}
        fullWidth
        maxWidth="md"
        PaperProps={{
          sx: {
            background: 'linear-gradient(145deg, #141414 0%, #0A0A0A 100%)',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          }
        }}
      >
        <DialogTitle
          sx={{
            bgcolor: 'transparent',
            p: 3,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
          }}
        >
          <Typography variant="h5" sx={{ fontWeight: 600, color: '#fff' }}>
            Student Profile
          </Typography>
          <IconButton onClick={handleCloseProfileDialog} sx={{ color: '#6B7280' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <Tabs
          value={profileTab}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{
            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
            '& .MuiTab-root': {
              color: '#6B7280',
              py: 2,
              '&.Mui-selected': {
                color: '#3B82F6',
                fontWeight: 600,
              }
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#3B82F6',
            }
          }}
        >
          <Tab label="Personal Information" />
          <Tab label="Parent/Guardian" />
        </Tabs>
        <DialogContent sx={{ p: 3 }}>
          {profileTab === 0 ? (
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={4}>
                <Box sx={{ textAlign: 'center', mb: { xs: 3, md: 0 } }}>
                  <Avatar
                    sx={{
                      width: 120,
                      height: 120,
                      mx: 'auto',
                      mb: 2,
                      boxShadow: '0 4px 14px rgba(59, 130, 246, 0.4)',
                      bgcolor: '#3B82F6',
                    }}
                  >
                    <PersonIcon sx={{ fontSize: 60 }} />
                  </Avatar>
                  <Typography variant="body1" sx={{ color: '#fff', fontWeight: 600 }}>
                    {studentData?.name || 'Student Name'}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#6B7280' }}>
                    {studentData?.studentDormNumber || 'N/A'}
                  </Typography>
                  <Chip
                    label={studentData?.status || 'Active'}
                    size="small"
                    sx={{
                      bgcolor: '#10B98120',
                      color: '#10B981',
                      fontWeight: 600,
                      mt: 1,
                    }}
                  />
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={8}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" sx={{ color: '#6B7280', mb: 0.5 }}>
                      Full Name
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#fff', fontWeight: 500 }}>
                      {studentData?.name || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" sx={{ color: '#6B7280', mb: 0.5 }}>
                      Email
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#fff', fontWeight: 500 }}>
                      {studentData?.email || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" sx={{ color: '#6B7280', mb: 0.5 }}>
                      Contact Number
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#fff', fontWeight: 500 }}>
                      {studentData?.phone || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" sx={{ color: '#6B7280', mb: 0.5 }}>
                      Course / Year
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#fff', fontWeight: 500 }}>
                      {studentData?.course || 'N/A'} / {studentData?.yearLevel || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" sx={{ color: '#6B7280', mb: 0.5 }}>
                      Building
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#fff', fontWeight: 500 }}>
                      {buildingData?.name || 
                       (typeof studentData?.room?.building === 'string' ? studentData?.room?.building : studentData?.room?.building?.name) || 
                       'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" sx={{ color: '#6B7280', mb: 0.5 }}>
                      Room Number
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#fff', fontWeight: 500 }}>
                      {studentData?.room?.roomNumber || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" sx={{ color: '#6B7280', mb: 0.5 }}>
                      Address
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#fff', fontWeight: 500 }}>
                      {studentData?.address || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" sx={{ color: '#6B7280', mb: 0.5 }}>
                      Gender
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#fff', fontWeight: 500 }}>
                      {studentData?.gender || 'N/A'}
                    </Typography>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          ) : (
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" sx={{ color: '#6B7280', mb: 0.5 }}>
                  Parent/Guardian Name
                </Typography>
                <Typography variant="body1" sx={{ color: '#fff', fontWeight: 500 }}>
                  {studentData?.guardianName || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" sx={{ color: '#6B7280', mb: 0.5 }}>
                  Relationship
                </Typography>
                <Typography variant="body1" sx={{ color: '#fff', fontWeight: 500 }}>
                  {studentData?.guardianRelationship || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" sx={{ color: '#6B7280', mb: 0.5 }}>
                  Contact Number
                </Typography>
                <Typography variant="body1" sx={{ color: '#fff', fontWeight: 500 }}>
                  {studentData?.guardianPhone || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" sx={{ color: '#6B7280', mb: 0.5 }}>
                  Email
                </Typography>
                <Typography variant="body1" sx={{ color: '#fff', fontWeight: 500 }}>
                  {studentData?.guardianEmail || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" sx={{ color: '#6B7280', mb: 0.5 }}>
                  Address
                </Typography>
                <Typography variant="body1" sx={{ color: '#fff', fontWeight: 500 }}>
                  {studentData?.guardianAddress || 'N/A'}
                </Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
          <Button
            onClick={handleCloseProfileDialog}
            sx={{
              color: '#6B7280',
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.05)',
                color: '#fff',
              }
            }}
          >
            Close
          </Button>
          <Button
            variant="contained"
            sx={{
              bgcolor: '#3B82F6',
              '&:hover': {
                bgcolor: '#2563EB',
              }
            }}
            href="/student/settings"
          >
            Edit Profile
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bill Dialog */}
      <Dialog
        open={billDialog}
        onClose={handleCloseBillDialog}
        TransitionComponent={Transition}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            background: 'linear-gradient(145deg, #141414 0%, #0A0A0A 100%)',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          }
        }}
      >
        {selectedBill && (
          <>
            <DialogTitle
              sx={{
                bgcolor: 'transparent',
                p: 3,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <ReceiptLongIcon sx={{ mr: 1, color: '#3B82F6' }} />
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#fff' }}>
                  Bill Details
                </Typography>
              </Box>
              <IconButton onClick={handleCloseBillDialog} sx={{ color: '#6B7280' }}>
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent sx={{ p: 3 }}>
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="body1" sx={{ color: '#fff', fontWeight: 600 }}>
                    Bill #{selectedBill._id.substring(selectedBill._id.length - 6)}
                  </Typography>
                  <Chip
                    label={selectedBill.status || 'No Status'}
                    sx={{
                      bgcolor: `${getStatusColor(selectedBill.status)}20`,
                      color: getStatusColor(selectedBill.status),
                      fontWeight: 600,
                    }}
                  />
                </Box>
                <Typography variant="body2" sx={{ color: '#6B7280' }}>
                  Billing Period: {formatDate(selectedBill.billingPeriodStart)} - {formatDate(selectedBill.billingPeriodEnd)}
                </Typography>
                <Typography variant="body2" sx={{ color: '#6B7280' }}>
                  Due Date: {formatDate(selectedBill.dueDate)}
                </Typography>
              </Box>

              <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.03)' }} />

              <Grid container spacing={1} sx={{ mb: 3 }}>
                <Grid item xs={6}>
                  <Paper sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                    <Typography variant="body2" sx={{ color: '#6B7280', mb: 1 }}>
                      Total Amount
                    </Typography>
                    <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600 }}>
                      ₱{selectedBill.totalAmount ? selectedBill.totalAmount.toLocaleString() : 0}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6}>
                  <Paper sx={{ p: 2, bgcolor: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px' }}>
                    <Typography variant="body2" sx={{ color: 'rgba(16, 185, 129, 0.8)', mb: 1 }}>
                      Amount Paid
                    </Typography>
                    <Typography variant="h6" sx={{ color: '#10B981', fontWeight: 600 }}>
                      ₱{selectedBill.amountPaid ? selectedBill.amountPaid.toLocaleString() : 0}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12}>
                  <Paper sx={{ p: 2, bgcolor: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', mt: 1 }}>
                    <Typography variant="body2" sx={{ color: 'rgba(239, 68, 68, 0.8)', mb: 1 }}>
                      Balance Due
                    </Typography>
                    <Typography variant="h6" sx={{ color: '#EF4444', fontWeight: 600 }}>
                      ₱{selectedBill.balanceDue ? selectedBill.balanceDue.toLocaleString() : selectedBill.totalAmount?.toLocaleString() || 0}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>

              {selectedBill.items && selectedBill.items.length > 0 && (
                <Box>
                  <Typography variant="body1" sx={{ color: '#fff', fontWeight: 600, mb: 2 }}>
                    Bill Items
                  </Typography>
                  <Box sx={{ maxHeight: '200px', overflow: 'hidden' }}>
                    {selectedBill.items.map((item, index) => (
                      <Box
                        key={index}
                        sx={{
                          p: 2,
                          bgcolor: 'rgba(255,255,255,0.03)',
                          borderRadius: '8px',
                          mb: 1,
                          display: 'flex',
                          justifyContent: 'space-between',
                        }}
                      >
                        <Box>
                          <Typography variant="body2" sx={{ color: '#fff', fontWeight: 500 }}>
                            {item.description || `Item ${index + 1}`}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#6B7280' }}>
                            {item.details || 'No details provided'}
                          </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ color: '#fff', fontWeight: 600 }}>
                          ₱{item.amount ? item.amount.toLocaleString() : 0}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}
            </DialogContent>
            <DialogActions sx={{ p: 3, borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <Button
                onClick={handleCloseBillDialog}
                sx={{
                  color: '#6B7280',
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.05)',
                    color: '#fff',
                  }
                }}
              >
                Close
              </Button>
              <Button
                variant="contained"
                sx={{
                  bgcolor: '#3B82F6',
                  '&:hover': {
                    bgcolor: '#2563EB',
                  }
                }}
                href="/student/bill"
              >
                View All Bills
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Offense Dialog */}
      <Dialog
        open={offenseDialog}
        onClose={handleCloseOffenseDialog}
        TransitionComponent={Transition}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            background: 'linear-gradient(145deg, #141414 0%, #0A0A0A 100%)',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          }
        }}
      >
        {selectedOffense && (
          <>
            <DialogTitle
              sx={{
                bgcolor: 'transparent',
                p: 3,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <WarningIcon sx={{ mr: 1, color: '#EF4444' }} />
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#fff' }}>
                  Offense Details
                </Typography>
              </Box>
              <IconButton onClick={handleCloseOffenseDialog} sx={{ color: '#6B7280' }}>
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent sx={{ p: 3 }}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600, mb: 1 }}>
                  {selectedOffense.typeOfOffense}
                </Typography>
                <Typography variant="body2" sx={{ color: '#6B7280' }}>
                  Date of Offense: {formatDate(selectedOffense.dateOfOffense)}
                </Typography>
                <Typography variant="body2" sx={{ color: '#6B7280' }}>
                  Reported by: {selectedOffense.reportedBy || 'Staff Member'}
                </Typography>
              </Box>

              <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.03)' }} />

              <Box sx={{ mb: 3 }}>
                <Typography variant="body1" sx={{ color: '#fff', fontWeight: 600, mb: 1 }}>
                  Offense Reason
                </Typography>
                <Paper sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                  <Typography variant="body2" sx={{ color: '#fff' }}>
                    {selectedOffense.offenseReason || 'No reason provided'}
                  </Typography>
                </Paper>
              </Box>
            </DialogContent>
            <DialogActions sx={{ p: 3, borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <Button
                onClick={handleCloseOffenseDialog}
                sx={{
                  color: '#6B7280',
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.05)',
                    color: '#fff',
                  }
                }}
              >
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Quick Actions Dialog */}
      <Dialog
        open={quickActionsDialog}
        onClose={handleCloseQuickActions}
        TransitionComponent={Transition}
        fullWidth
        maxWidth="xs"
        PaperProps={{
          sx: {
            background: 'linear-gradient(145deg, #141414 0%, #0A0A0A 100%)',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          }
        }}
      >
        <DialogTitle
          sx={{
            bgcolor: 'transparent',
            p: 3,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#fff' }}>
            Quick Actions
          </Typography>
          <IconButton onClick={handleCloseQuickActions} sx={{ color: '#6B7280' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <List disablePadding>
            <ListItem
              button
              component="a"
              href="/student/bill"
              divider
              sx={{
                py: 2,
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.05)',
                }
              }}
            >
              <ListItemText
                primary={
                  <Typography variant="body1" sx={{ color: '#fff', fontWeight: 500 }}>
                    View All Bills
                  </Typography>
                }
                secondary={
                  <Typography variant="body2" sx={{ color: '#6B7280' }}>
                    Check and pay your dormitory bills
                  </Typography>
                }
              />
              <ReceiptLongIcon sx={{ color: '#3B82F6' }} />
            </ListItem>
            <ListItem
              button
              component="a"
              href="/student/form"
              divider
              sx={{
                py: 2,
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.05)',
                }
              }}
            >
              <ListItemText
                primary={
                  <Typography variant="body1" sx={{ color: '#fff', fontWeight: 500 }}>
                    Maintenance Requests
                  </Typography>
                }
                secondary={
                  <Typography variant="body2" sx={{ color: '#6B7280' }}>
                    Submit new maintenance requests
                  </Typography>
                }
              />
              <EventNoteIcon sx={{ color: '#10B981' }} />
            </ListItem>
            <ListItem
              button
              component="a"
              href="/student/faqs"
              divider
              sx={{
                py: 2,
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.05)',
                }
              }}
            >
              <ListItemText
                primary={
                  <Typography variant="body1" sx={{ color: '#fff', fontWeight: 500 }}>
                    Student FAQs
                  </Typography>
                }
                secondary={
                  <Typography variant="body2" sx={{ color: '#6B7280' }}>
                    Find answers to common questions
                  </Typography>
                }
              />
              <InfoIcon sx={{ color: '#8B5CF6' }} />
            </ListItem>
            <ListItem
              button
              component="a"
              href="/student/settings"
              sx={{
                py: 2,
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.05)',
                }
              }}
            >
              <ListItemText
                primary={
                  <Typography variant="body1" sx={{ color: '#fff', fontWeight: 500 }}>
                    Profile Settings
                  </Typography>
                }
                secondary={
                  <Typography variant="body2" sx={{ color: '#6B7280' }}>
                    Update your profile information
                  </Typography>
                }
              />
              <PersonIcon sx={{ color: '#F59E0B' }} />
            </ListItem>
          </List>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default StudentDashboard; 
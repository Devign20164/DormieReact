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
} from '@mui/icons-material';
import StudentSidebar from '../components/StudentSidebar';
import NotificationBell from '../components/NotificationBell';
import axios from 'axios';

const StudentDashboard = () => {
  const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [studentData, setStudentData] = useState(null);
  const [buildingData, setBuildingData] = useState(null);
  const [recentOffenses, setRecentOffenses] = useState([]);
  const [recentBills, setRecentBills] = useState([]);
  const [latestBill, setLatestBill] = useState(null);

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
            // Sort offenses by date and get the latest 5
            const sortedOffenses = offensesRes.data.sort((a, b) => 
              new Date(b.dateOfOffense) - new Date(a.dateOfOffense)
            );
            
            setRecentOffenses(sortedOffenses.slice(0, 5)); // Get the 5 most recent offenses
          })
          .catch(err => {
            console.warn('Error fetching offenses:', err);
            // Don't set error state, just log the warning
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
      <StudentSidebar />

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
          borderBottom: '1px solid rgba(255,255,255,0.03)',
        }}>
          <Box>
            <Typography variant="h4" sx={{ 
              fontWeight: 600, 
              color: '#fff',
              textShadow: '0 2px 4px rgba(0,0,0,0.2)',
            }}>
              Welcome back, {userData.name || 'Student'}
            </Typography>
            <Typography variant="body2" sx={{ color: '#6B7280', mt: 1 }}>
              Here's what's happening with your dorm account today.
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <NotificationBell userType="student" color="#3B82F6" />
            <IconButton sx={{ 
              color: '#6B7280',
              transition: 'all 0.3s ease',
              '&:hover': {
                color: '#3B82F6',
                background: 'rgba(59, 130, 246, 0.1)',
              }
            }}>
              <MoreVertIcon />
            </IconButton>
          </Stack>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
            <CircularProgress sx={{ color: '#3B82F6' }} />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
        ) : (
          <>
            {/* Student Information Section */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} md={6}>
                <Card sx={{ 
                  background: 'linear-gradient(145deg, #141414 0%, #0A0A0A 100%)',
                  borderRadius: '20px',
                  p: 3,
                  border: '1px solid rgba(255, 255, 255, 0.03)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                  height: '100%',
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Avatar 
                      sx={{ 
                        width: 72, 
                        height: 72, 
                        bgcolor: '#3B82F6',
                        boxShadow: '0 4px 14px rgba(59, 130, 246, 0.4)',
                      }}
                    >
                      <PersonIcon sx={{ fontSize: 40 }} />
                    </Avatar>
                    <Box sx={{ ml: 2 }}>
                      <Typography variant="h5" sx={{ fontWeight: 600, color: '#fff' }}>
                        {studentData?.name || 'Student Name'}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#6B7280' }}>
                        {studentData?.email || 'student@example.com'}
                      </Typography>
                    </Box>
                  </Box>

                  <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.03)' }} />
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <DoorFrontIcon sx={{ color: '#3B82F6', mr: 1 }} />
                        <Typography variant="body2" sx={{ color: '#6B7280' }}>
                          Dorm Number
                        </Typography>
                      </Box>
                      <Typography variant="body1" sx={{ color: '#fff', fontWeight: 500 }}>
                        {studentData?.studentDormNumber || 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <ApartmentIcon sx={{ color: '#3B82F6', mr: 1 }} />
                        <Typography variant="body2" sx={{ color: '#6B7280' }}>
                          Building
                        </Typography>
                      </Box>
                      <Typography variant="body1" sx={{ color: '#fff', fontWeight: 500 }}>
                        {buildingData?.name || 
                         (typeof studentData?.room?.building === 'string' ? studentData?.room?.building : studentData?.room?.building?.name) || 
                         'N/A'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <DoorFrontIcon sx={{ color: '#3B82F6', mr: 1 }} />
                        <Typography variant="body2" sx={{ color: '#6B7280' }}>
                          Room Number
                        </Typography>
                      </Box>
                      <Typography variant="body1" sx={{ color: '#fff', fontWeight: 500 }}>
                        {studentData?.room?.roomNumber || 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <PersonIcon sx={{ color: '#3B82F6', mr: 1 }} />
                        <Typography variant="body2" sx={{ color: '#6B7280' }}>
                          Room Type
                        </Typography>
                      </Box>
                      <Typography variant="body1" sx={{ color: '#fff', fontWeight: 500 }}>
                        {studentData?.room?.type || 'N/A'}
                      </Typography>
                    </Grid>
                  </Grid>
                </Card>
              </Grid>

              {/* Latest Bill Card */}
              <Grid item xs={12} md={6}>
                <Card sx={{ 
                  background: 'linear-gradient(145deg, #141414 0%, #0A0A0A 100%)',
                  borderRadius: '20px',
                  p: 3,
                  border: '1px solid rgba(255, 255, 255, 0.03)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                  height: '100%',
                }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#fff' }}>
                      Latest Bill
                    </Typography>
                    <Chip 
                      label={latestBill?.status || 'No Status'} 
                      sx={{ 
                        bgcolor: `${getStatusColor(latestBill?.status)}20`,
                        color: getStatusColor(latestBill?.status),
                        fontWeight: 600,
                      }}
                    />
                  </Box>

                  {latestBill ? (
                    <>
                      <Grid container spacing={2} sx={{ mb: 3 }}>
                        <Grid item xs={6}>
                          <Typography variant="body2" sx={{ color: '#6B7280' }}>
                            Bill Period
                          </Typography>
                          <Typography variant="body1" sx={{ color: '#fff', fontWeight: 500 }}>
                            {formatDate(latestBill.billingPeriodStart)} - {formatDate(latestBill.billingPeriodEnd)}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" sx={{ color: '#6B7280' }}>
                            Due Date
                          </Typography>
                          <Typography variant="body1" sx={{ color: '#fff', fontWeight: 500 }}>
                            {formatDate(latestBill.dueDate)}
                          </Typography>
                        </Grid>
                      </Grid>

                      <Box sx={{ mb: 3 }}>
                        <Typography variant="body2" sx={{ color: '#6B7280', mb: 1 }}>
                          Total Amount
                        </Typography>
                        <Typography variant="h4" sx={{ color: '#fff', fontWeight: 600 }}>
                          ₱{latestBill.totalAmount ? latestBill.totalAmount.toLocaleString() : 0}
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" sx={{ color: '#6B7280' }}>
                          Paid Amount
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#10B981' }}>
                          ₱{latestBill.amountPaid ? latestBill.amountPaid.toLocaleString() : 0}
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                        <Typography variant="body2" sx={{ color: '#6B7280' }}>
                          Balance Due
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#EF4444' }}>
                          ₱{latestBill.balanceDue ? latestBill.balanceDue.toLocaleString() : latestBill.totalAmount?.toLocaleString() || 0}
                        </Typography>
                      </Box>

                      <Button 
                        variant="contained" 
                        fullWidth
                        startIcon={<PaymentIcon />}
                        sx={{ 
                          bgcolor: '#3B82F6',
                          '&:hover': {
                            bgcolor: '#2563EB',
                          }
                        }}
                        href="/student/bills"
                      >
                        View All Bills
                      </Button>
                    </>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
                      <ReceiptLongIcon sx={{ fontSize: 48, color: '#6B7280', mb: 2 }} />
                      <Typography variant="body1" sx={{ color: '#6B7280', textAlign: 'center' }}>
                        No bills found
                      </Typography>
                    </Box>
                  )}
                </Card>
              </Grid>
            </Grid>

            {/* Recent Offenses Section */}
            <Typography variant="h5" sx={{ 
              fontWeight: 600, 
              color: '#fff',
              mb: 3,
              textShadow: '0 2px 4px rgba(0,0,0,0.2)',
            }}>
              Recent Offenses
            </Typography>
            <Card sx={{ 
              background: 'linear-gradient(145deg, #141414 0%, #0A0A0A 100%)',
              borderRadius: '20px',
              p: 3,
              border: '1px solid rgba(255, 255, 255, 0.03)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
              mb: 4,
            }}>
              {recentOffenses.length > 0 ? (
                <List>
                  {recentOffenses.map((offense, index) => (
                    <ListItem 
                      key={offense._id}
                      sx={{ 
                        px: 2, 
                        py: 1.5,
                        borderBottom: index < recentOffenses.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none',
                        borderRadius: '8px',
                        '&:hover': {
                          bgcolor: 'rgba(255,255,255,0.02)',
                        },
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                        <Avatar sx={{ bgcolor: '#EF4444' }}>
                          <WarningIcon />
                        </Avatar>
                      </Box>
                      <ListItemText
                        primary={
                          <Typography variant="body1" sx={{ color: '#fff', fontWeight: 500 }}>
                            {offense.typeOfOffense}
                          </Typography>
                        }
                        secondary={
                          <Typography variant="body2" sx={{ color: '#6B7280' }}>
                            {offense.offenseReason}
                          </Typography>
                        }
                      />
                      <Typography variant="body2" sx={{ color: '#6B7280' }}>
                        {formatDate(offense.dateOfOffense)}
                      </Typography>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
                  <ErrorOutlineIcon sx={{ fontSize: 48, color: '#6B7280', mb: 2 }} />
                  <Typography variant="body1" sx={{ color: '#6B7280', textAlign: 'center' }}>
                    No offenses recorded
                  </Typography>
                </Box>
              )}
            </Card>

            {/* Recent Bills Section */}
            <Typography variant="h5" sx={{ 
              fontWeight: 600, 
              color: '#fff',
              mb: 3,
              textShadow: '0 2px 4px rgba(0,0,0,0.2)',
            }}>
              Recent Bills
            </Typography>
            <Card sx={{ 
              background: 'linear-gradient(145deg, #141414 0%, #0A0A0A 100%)',
              borderRadius: '20px',
              p: 3,
              border: '1px solid rgba(255, 255, 255, 0.03)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
            }}>
              {recentBills.length > 0 ? (
                <List>
                  {recentBills.map((bill, index) => (
                    <ListItem 
                      key={bill._id}
                      sx={{ 
                        px: 2, 
                        py: 1.5,
                        borderBottom: index < recentBills.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none',
                        borderRadius: '8px',
                        '&:hover': {
                          bgcolor: 'rgba(255,255,255,0.02)',
                        },
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                        <Avatar sx={{ bgcolor: '#3B82F6' }}>
                          <ReceiptLongIcon />
                        </Avatar>
                      </Box>
                      <ListItemText
                        primary={
                          <Typography variant="body1" sx={{ color: '#fff', fontWeight: 500 }}>
                            Bill #{bill._id.substring(bill._id.length - 6)}
                          </Typography>
                        }
                        secondary={
                          <Typography variant="body2" sx={{ color: '#6B7280' }}>
                            Due: {formatDate(bill.dueDate)}
                          </Typography>
                        }
                      />
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                        <Typography variant="body1" sx={{ color: '#fff', fontWeight: 500 }}>
                          ₱{bill.totalAmount ? bill.totalAmount.toLocaleString() : 0}
                        </Typography>
                        <Chip 
                          label={bill.status || 'No Status'} 
                          size="small"
                          sx={{ 
                            bgcolor: `${getStatusColor(bill.status)}20`,
                            color: getStatusColor(bill.status),
                            fontWeight: 600,
                            mt: 1,
                          }}
                        />
                      </Box>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
                  <ReceiptLongIcon sx={{ fontSize: 48, color: '#6B7280', mb: 2 }} />
                  <Typography variant="body1" sx={{ color: '#6B7280', textAlign: 'center' }}>
                    No bills found
                  </Typography>
                </Box>
              )}
            </Card>
          </>
        )}
      </Box>
    </Box>
  );
};

export default StudentDashboard; 
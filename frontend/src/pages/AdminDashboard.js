import React, { useState, useEffect, useContext } from 'react';
import {
  Box,
  Typography,
  Card,
  Stack,
  Grid,
  IconButton,
  Menu,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  Divider,
  CircularProgress,
  Tooltip,
  useTheme,
  alpha,
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Circle as CircleIcon,
  Home as HomeIcon,
  Warning as WarningIcon,
  AccessTime as AccessTimeIcon,
  People as PeopleIcon,
} from '@mui/icons-material';
import AdminSidebar from '../components/AdminSidebar';
import NotificationBell from '../components/NotificationBell';
import axios from 'axios';
import { useSocket } from '../context/SocketContext';
import { format, subDays } from 'date-fns';
import { ThemeContext } from '../App';

const AdminDashboard = () => {
  const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  const theme = useTheme();
  const { mode } = useContext(ThemeContext);
  const socket = useSocket();

  // State for analytics data
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analytics, setAnalytics] = useState({
    offenses: {
      today: 0,
      yesterday: 0,
      percentChange: 0,
      isIncrease: false
    },
    logModel: {
      onTime: 0,
      late: 0,
      percentOnTime: 0,
      percentLate: 0,
      percentChange: 0,
      isIncrease: true
    },
    occupancy: {
      totalRooms: 0,
      occupiedRooms: 0,
      availableRooms: 0,
      occupancyRate: 0,
      percentChange: 0,
      isIncrease: true
    },
    students: {
      totalStudents: 0,
      activeStudents: 0,
      percentChange: 0,
      isIncrease: false
    },
    recentActivity: {
      checkIns: [],
      maintenanceRequests: []
    }
  });

  // Fetch analytics data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Get today and yesterday dates
        const today = new Date();
        const yesterday = subDays(today, 1);
        const todayStr = format(today, 'yyyy-MM-dd');
        const yesterdayStr = format(yesterday, 'yyyy-MM-dd');
        
        // Fetch offense data
        const offensesResponse = await axios.get('/api/admin/analytics/offenses', {
          params: { 
            startDate: yesterdayStr,
            endDate: todayStr
          }
        });
        
        // Fetch log model data
        const logsResponse = await axios.get('/api/admin/analytics/logs');
        
        // Fetch occupancy data
        const occupancyResponse = await axios.get('/api/admin/analytics/occupancy');
        
        // Fetch student data
        const studentsResponse = await axios.get('/api/admin/analytics/students');
        
        // Fetch recent activity
        const activityResponse = await axios.get('/api/admin/analytics/recent-activity');
        
        // Process offense data
        const offenseData = offensesResponse.data;
        const offenseAnalytics = {
          today: offenseData.today,
          yesterday: offenseData.yesterday,
          percentChange: calculatePercentChange(offenseData.today, offenseData.yesterday),
          isIncrease: offenseData.today > offenseData.yesterday
        };
        
        // Process log model data
        const logData = logsResponse.data;
        const totalChecks = logData.onTime + logData.late;
        const logAnalytics = {
          onTime: logData.onTime,
          late: logData.late,
          percentOnTime: totalChecks > 0 ? Math.round((logData.onTime / totalChecks) * 100) : 0,
          percentLate: totalChecks > 0 ? Math.round((logData.late / totalChecks) * 100) : 0,
          percentChange: calculatePercentChange(logData.onTime, logData.yesterday?.onTime || 0),
          isIncrease: logData.onTime > (logData.yesterday?.onTime || 0)
        };
        
        // Process occupancy data
        const occupancyData = occupancyResponse.data;
        const occupancyAnalytics = {
          totalRooms: occupancyData.totalRooms,
          occupiedRooms: occupancyData.occupiedRooms,
          availableRooms: occupancyData.totalRooms - occupancyData.occupiedRooms,
          occupancyRate: Math.round((occupancyData.occupiedRooms / occupancyData.totalRooms) * 100),
          percentChange: calculatePercentChange(occupancyData.currentRate, occupancyData.previousRate),
          isIncrease: occupancyData.currentRate > occupancyData.previousRate
        };
        
        // Process student data
        const studentData = studentsResponse.data;
        const studentAnalytics = {
          totalStudents: studentData.totalStudents,
          activeStudents: studentData.activeStudents,
          percentChange: studentData.percentChange,
          isIncrease: studentData.percentChange > 0
        };
        
        // Set all analytics data
        setAnalytics({
          offenses: offenseAnalytics,
          logModel: logAnalytics,
          occupancy: occupancyAnalytics,
          students: studentAnalytics,
          recentActivity: {
            checkIns: activityResponse.data.checkIns || [],
            maintenanceRequests: activityResponse.data.maintenanceRequests || []
          }
        });
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching analytics data:', err);
        setError('Failed to load analytics data');
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);  // Remove socket dependency to avoid multiple fetches
  
  // Set up real-time socket updates in a separate effect
  useEffect(() => {
    // Get the socket context
    const socketContext = socket;

    // Check if socket context and socket instance exist
    if (socketContext && socketContext.socket && socketContext.isConnected) {
      console.log('Setting up analytics_update socket listener');
      
      const socketInstance = socketContext.socket;
      
      // Join the room for this user if needed
      if (userData && userData._id) {
        socketContext.joinRoom(userData._id);
      }
      
      // Add the event listener to the socket instance
      socketInstance.on('analytics_update', (data) => {
        console.log('Received analytics update:', data);
        setAnalytics(prevAnalytics => ({
          ...prevAnalytics,
          ...data
        }));
      });
      
      // Clean up the event listener
      return () => {
        console.log('Cleaning up analytics_update socket listener');
        socketInstance.off('analytics_update');
      };
    } else {
      console.log('Socket not available or not connected:', socketContext);
    }
    
    return () => {}; // Empty cleanup if no socket
  }, [socket, userData]);

  // Helper function to calculate percentage change
  const calculatePercentChange = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  // Helper function to format percentage change
  const formatPercentChange = (value) => {
    return value > 0 ? `+${value}%` : `${value}%`;
  };

  // Create analytics cards data
  const statsData = [
    { 
      title: 'Offense History', 
      count: analytics.offenses.today, 
      trend: formatPercentChange(analytics.offenses.percentChange), 
      isIncrease: analytics.offenses.isIncrease,
      icon: <WarningIcon />,
      color: '#EF4444',
      subtext: `${analytics.offenses.yesterday} yesterday`
    },
    { 
      title: 'Check-in Status', 
      count: `${analytics.logModel.percentOnTime}%`, 
      trend: formatPercentChange(analytics.logModel.percentChange), 
      isIncrease: analytics.logModel.isIncrease,
      icon: <AccessTimeIcon />,
      color: '#10B981',
      subtext: `${analytics.logModel.onTime} on time, ${analytics.logModel.late} late`
    },
    { 
      title: 'Occupancy Rate', 
      count: `${analytics.occupancy.occupancyRate}%`, 
      trend: formatPercentChange(analytics.occupancy.percentChange), 
      isIncrease: analytics.occupancy.isIncrease,
      icon: <HomeIcon />,
      color: '#3B82F6',
      subtext: `${analytics.occupancy.occupiedRooms}/${analytics.occupancy.totalRooms} rooms`
    },
    { 
      title: 'Total Students', 
      count: analytics.students.totalStudents, 
      trend: formatPercentChange(analytics.students.percentChange), 
      isIncrease: analytics.students.isIncrease,
      icon: <PeopleIcon />,
      color: '#8B5CF6',
      subtext: `${analytics.students.activeStudents} active residents`
    },
  ];

  return (
    <Box sx={{ 
      display: 'flex', 
      minHeight: '100vh',
      background: mode === 'dark' 
        ? 'linear-gradient(145deg, #0A0A0A 0%, #141414 100%)' 
        : 'linear-gradient(145deg, #f0f9f4 0%, #e6f7ee 100%)',
      color: mode === 'dark' ? '#fff' : '#333',
      position: 'relative',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: mode === 'dark'
          ? 'radial-gradient(circle at top right, rgba(255,255,255,0.03) 0%, transparent 70%)'
          : 'radial-gradient(circle at top right, rgba(16, 185, 129, 0.05) 0%, transparent 80%)',
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
            : '1px solid rgba(16, 185, 129, 0.1)',
        }}>
          <Box>
            <Typography variant="h4" sx={{ 
              fontWeight: 600, 
              color: mode === 'dark' ? '#fff' : '#333',
              textShadow: mode === 'dark' 
                ? '0 2px 4px rgba(0,0,0,0.2)' 
                : '0 1px 2px rgba(0,0,0,0.1)',
            }}>
              Welcome back, {userData.name || 'Admin'}
            </Typography>
            <Typography variant="body2" sx={{ 
              color: mode === 'dark' ? '#6B7280' : '#6c757d', 
              mt: 1 
            }}>
              Here's what's happening with your dormitory today.
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <NotificationBell userType="admin" color="#10B981" />
            <IconButton sx={{ 
              color: mode === 'dark' ? '#6B7280' : '#6c757d',
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

        {/* Stats Grid */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress size={40} sx={{ color: '#10B981' }} />
          </Box>
        ) : error ? (
          <Box sx={{ textAlign: 'center', my: 4, color: '#EF4444' }}>
            <Typography>{error}</Typography>
          </Box>
        ) : (
        <Grid container spacing={3}>
          {statsData.map((stat, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card sx={{ 
                  background: mode === 'dark'
                    ? 'linear-gradient(145deg, #141414 0%, #0A0A0A 100%)'
                    : 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)',
                borderRadius: '20px',
                p: 3,
                  border: mode === 'dark'
                    ? '1px solid rgba(255, 255, 255, 0.03)'
                    : '1px solid rgba(16, 185, 129, 0.15)',
                  boxShadow: mode === 'dark'
                    ? '0 4px 20px rgba(0,0,0,0.2)'
                    : '0 4px 20px rgba(16, 185, 129, 0.08)',
                transition: 'all 0.3s ease',
                  position: 'relative',
                  overflow: 'hidden',
                '&:hover': {
                  transform: 'translateY(-2px)',
                    boxShadow: mode === 'dark'
                      ? '0 8px 25px rgba(0,0,0,0.3)'
                      : '0 8px 25px rgba(16, 185, 129, 0.12)',
                },
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '5px',
                    height: '100%',
                    background: stat.color,
                    borderTopLeftRadius: '20px',
                    borderBottomLeftRadius: '20px',
                  }
                }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Typography variant="body2" sx={{ 
                      color: mode === 'dark' ? '#6B7280' : '#6c757d', 
                      mb: 1 
                    }}>
                  {stat.title}
                </Typography>
                    <Box sx={{ 
                      color: stat.color,
                      backgroundColor: mode === 'dark' 
                        ? 'rgba(0, 0, 0, 0.3)' 
                        : alpha(stat.color, 0.1),
                      p: 0.5,
                      borderRadius: '50%',
                    }}>
                      {stat.icon}
                    </Box>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="h4" sx={{ 
                      fontWeight: 700, 
                      color: mode === 'dark' ? '#fff' : '#333',
                      textShadow: mode === 'dark'
                        ? '0 2px 4px rgba(0,0,0,0.2)'
                        : '0 1px 2px rgba(0,0,0,0.05)',
                  }}>
                    {stat.count}
                  </Typography>
                    <Tooltip title={`${stat.isIncrease ? 'Increased' : 'Decreased'} by ${stat.trend.replace('+', '').replace('-', '')}`}>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    color: stat.isIncrease ? '#10B981' : '#EF4444',
                        bgcolor: stat.isIncrease 
                          ? alpha('#10B981', mode === 'dark' ? 0.1 : 0.1) 
                          : alpha('#EF4444', mode === 'dark' ? 0.1 : 0.1),
                    p: 0.5,
                    px: 1,
                    borderRadius: 1,
                  }}>
                    {stat.isIncrease ? <TrendingUpIcon fontSize="small" /> : <TrendingDownIcon fontSize="small" />}
                    <Typography variant="caption" sx={{ ml: 0.5 }}>
                      {stat.trend}
                    </Typography>
                  </Box>
                    </Tooltip>
                </Box>
                  
                  <Typography variant="caption" sx={{ 
                    color: mode === 'dark' ? '#9CA3AF' : '#6c757d'
                  }}>
                    {stat.subtext}
                  </Typography>
              </Card>
            </Grid>
          ))}
        </Grid>
        )}

        {/* Recent Activity */}
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" sx={{ 
            fontWeight: 600, 
            color: mode === 'dark' ? '#fff' : '#333',
            mb: 3,
            textShadow: mode === 'dark'
              ? '0 2px 4px rgba(0,0,0,0.2)'
              : '0 1px 2px rgba(0,0,0,0.05)',
          }}>
            Recent Activity
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={7}>
              <Card sx={{ 
                background: mode === 'dark'
                  ? 'linear-gradient(145deg, #141414 0%, #0A0A0A 100%)'
                  : 'linear-gradient(165deg, #ffffff 0%, #f0f9f4 100%)',
                borderRadius: '20px',
                p: 3,
                border: mode === 'dark'
                  ? '1px solid rgba(255, 255, 255, 0.03)'
                  : '1px solid rgba(16, 185, 129, 0.15)',
                boxShadow: mode === 'dark'
                  ? '0 4px 20px rgba(0,0,0,0.2)'
                  : '0 4px 20px rgba(16, 185, 129, 0.08)',
                height: '100%',
              }}>
                <Typography variant="h6" sx={{ 
                  color: mode === 'dark' ? '#fff' : '#333', 
                  mb: 2 
                }}>
                  Latest Student Check-ins
                </Typography>
                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                    <CircularProgress size={30} sx={{ color: '#10B981' }} />
                  </Box>
                ) : analytics.recentActivity.checkIns.length === 0 ? (
                  <Typography variant="body2" sx={{ 
                    color: mode === 'dark' ? '#6B7280' : '#6c757d', 
                    textAlign: 'center', 
                    py: 3 
                  }}>
                    No recent check-ins found
                  </Typography>
                ) : (
                <List>
                    {analytics.recentActivity.checkIns.map((item, index) => (
                    <ListItem 
                        key={item._id || index}
                      sx={{ 
                        px: 0, 
                          borderBottom: index < analytics.recentActivity.checkIns.length - 1 
                            ? mode === 'dark'
                              ? '1px solid rgba(255,255,255,0.03)'
                              : '1px solid rgba(16, 185, 129, 0.1)'
                            : 'none',
                        py: 1,
                      }}
                    >
                      <ListItemText
                          primary={item.studentName || `Student ${index + 1}`}
                          secondary={`Checked in at ${format(new Date(item.checkInTime), 'hh:mm a')}`}
                        primaryTypographyProps={{
                            color: mode === 'dark' ? '#fff' : '#333',
                        }}
                        secondaryTypographyProps={{
                            color: mode === 'dark' ? '#6B7280' : '#6c757d',
                        }}
                      />
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                          color: item.status === 'OnTime' ? '#10B981' : item.status === 'Late' ? '#EF4444' : '#F59E0B',
                      }}>
                        <CircleIcon sx={{ fontSize: 10, mr: 0.5 }} />
                        <Typography variant="caption">
                            {item.status === 'OnTime' ? 'On Time' : item.status === 'Late' ? 'Late' : 'Pending'}
                        </Typography>
                      </Box>
                    </ListItem>
                  ))}
                </List>
                )}
              </Card>
            </Grid>
            <Grid item xs={12} md={5}>
              <Card sx={{ 
                background: mode === 'dark'
                  ? 'linear-gradient(145deg, #141414 0%, #0A0A0A 100%)'
                  : 'linear-gradient(165deg, #ffffff 0%, #f0f9f4 100%)',
                borderRadius: '20px',
                p: 3,
                border: mode === 'dark'
                  ? '1px solid rgba(255, 255, 255, 0.03)'
                  : '1px solid rgba(16, 185, 129, 0.15)',
                boxShadow: mode === 'dark'
                  ? '0 4px 20px rgba(0,0,0,0.2)'
                  : '0 4px 20px rgba(16, 185, 129, 0.08)',
                height: '100%',
              }}>
                <Typography variant="h6" sx={{ 
                  color: mode === 'dark' ? '#fff' : '#333', 
                  mb: 2 
                }}>
                  Recent Offenses
                </Typography>
                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                    <CircularProgress size={30} sx={{ color: '#EF4444' }} />
                  </Box>
                ) : analytics.recentActivity.maintenanceRequests.length === 0 ? (
                  <Typography variant="body2" sx={{ 
                    color: mode === 'dark' ? '#6B7280' : '#6c757d', 
                    textAlign: 'center', 
                    py: 3 
                  }}>
                    No recent offenses found
                  </Typography>
                ) : (
                <List>
                    {analytics.recentActivity.maintenanceRequests.map((item, index) => (
                    <ListItem
                        key={item._id || index}
                      sx={{ 
                        px: 0, 
                          borderBottom: index < analytics.recentActivity.maintenanceRequests.length - 1 
                            ? mode === 'dark'
                              ? '1px solid rgba(255,255,255,0.03)'
                              : '1px solid rgba(16, 185, 129, 0.1)'
                            : 'none',
                        py: 1,
                      }}
                    >
                      <ListItemText
                          primary={item.title || `Offense #${index + 1}`}
                          secondary={item.student || 'Student'}
                        primaryTypographyProps={{
                            color: mode === 'dark' ? '#fff' : '#333',
                        }}
                        secondaryTypographyProps={{
                            color: item.type === 'Major Offense' ? '#EF4444' : 
                                  item.type === '3rd Offense' ? '#F59E0B' : '#10B981',
                          fontWeight: 600,
                        }}
                      />
                    </ListItem>
                  ))}
                </List>
                )}
              </Card>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </Box>
  );
};

export default AdminDashboard; 
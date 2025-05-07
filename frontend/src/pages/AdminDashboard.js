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
  Apartment as ApartmentIcon,
  MeetingRoom as RoomIcon,
  Assignment as AssignmentIcon,
  People as PeopleIcon,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import AdminSidebar from '../components/AdminSidebar';
import NotificationBell from '../components/NotificationBell';
import axios from 'axios';
import { useSocket } from '../context/SocketContext';
import { format, subDays } from 'date-fns';
import { ThemeContext } from '../App';
// Import Chart.js components
import { Bar, Line } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  LineElement,
  PointElement,
  Title, 
  Tooltip as ChartTooltip, 
  Legend,
  Filler
} from 'chart.js';

// Register required Chart.js components
ChartJS.register(
  CategoryScale, 
  LinearScale, 
  BarElement, 
  LineElement,
  PointElement,
  Title, 
  ChartTooltip, 
  Legend,
  Filler
);

const AdminDashboard = () => {
  const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  const theme = useTheme();
  const { mode } = useContext(ThemeContext);
  const socket = useSocket();

  // State for analytics data
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analytics, setAnalytics] = useState({
    students: {
      totalStudents: 0,
      activeStudents: 0,
      percentChange: 0,
      isIncrease: false
    },
    buildings: {
      totalBuildings: 0,
      percentChange: 0,
      isIncrease: true
    },
    rooms: {
      totalRooms: 0,
      occupiedRooms: 0,
      availableRooms: 0,
      occupancyRate: 0,
      percentChange: 0,
      isIncrease: true
    },
    forms: {
      total: 0,
      pending: 0,
      completed: 0,
      percentChange: 0,
      isIncrease: true
    },
    offenses: {
      total: 0,
      lastMonth: 0,
      percentChange: 0,
      isIncrease: false
    },
    checkIns: {
      total: 0,
      checkOut: 0,
      percentCheckedIn: 0
    },
    recentActivity: {
      checkIns: [],
      maintenanceRequests: []
    }
  });

  // Add a new state for offense history data
  const [offenseHistory, setOffenseHistory] = useState({ labels: [], data: [] });
  const [offenseHistoryLoading, setOffenseHistoryLoading] = useState(false);

  // Add a state for check-in logs
  const [checkInLogs, setCheckInLogs] = useState([]);
  const [checkInLogsLoading, setCheckInLogsLoading] = useState(false);

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
        
        // Fetch student data
        const studentsResponse = await axios.get('/api/admin/analytics/students');
        
        // Fetch buildings data
        const buildingsResponse = await axios.get('/api/admin/analytics/buildings');
        
        // Fetch room data
        const roomsResponse = await axios.get('/api/admin/analytics/occupancy');
        
        // Fetch forms data
        const formsResponse = await axios.get('/api/admin/analytics/forms');
        
        // Fetch offense data
        const offensesResponse = await axios.get('/api/admin/analytics/offenses', {
          params: { 
            startDate: yesterdayStr,
            endDate: todayStr
          }
        });
        
        // Fetch check-ins data
        const checkInsResponse = await axios.get('/api/admin/analytics/checkins');
        
        // Fetch recent activity
        const activityResponse = await axios.get('/api/admin/analytics/recent-activity');
        
        // Process students data
        const studentData = studentsResponse.data;
        const studentAnalytics = {
          totalStudents: studentData.totalStudents,
          activeStudents: studentData.activeStudents,
          percentChange: studentData.percentChange,
          isIncrease: studentData.percentChange > 0
        };
        
        // Process buildings data
        const buildingData = buildingsResponse.data;
        const buildingAnalytics = {
          totalBuildings: buildingData.totalBuildings,
          percentChange: buildingData.percentChange || 0,
          isIncrease: (buildingData.percentChange || 0) > 0
        };
        
        // Process rooms data
        const roomData = roomsResponse.data;
        const roomAnalytics = {
          totalRooms: roomData.totalRooms,
          occupiedRooms: roomData.occupiedRooms,
          availableRooms: roomData.totalRooms - roomData.occupiedRooms,
          occupancyRate: Math.round((roomData.occupiedRooms / roomData.totalRooms) * 100),
          percentChange: calculatePercentChange(roomData.currentRate, roomData.previousRate),
          isIncrease: roomData.currentRate > roomData.previousRate
        };
        
        // Process forms data
        const formData = formsResponse.data;
        const formAnalytics = {
          total: formData.total,
          pending: formData.pending,
          completed: formData.completed,
          percentChange: formData.percentChange || 0,
          isIncrease: (formData.percentChange || 0) > 0
        };
        
        // Process offense data
        const offenseData = offensesResponse.data;
        const offenseAnalytics = {
          total: offenseData.total || 0,
          lastMonth: offenseData.lastMonth || 0,
          percentChange: calculatePercentChange(offenseData.total || 0, offenseData.lastMonth || 0),
          isIncrease: (offenseData.total || 0) > (offenseData.lastMonth || 0)
        };
        
        // Process check-ins data
        const checkInData = checkInsResponse.data;
        const totalChecks = (checkInData.checkIn || 0) + (checkInData.checkOut || 0);
        const checkInAnalytics = {
          total: checkInData.checkIn || 0,
          checkOut: checkInData.checkOut || 0,
          percentCheckedIn: totalChecks > 0 ? Math.round(((checkInData.checkIn || 0) / totalChecks) * 100) : 0
        };
        
        // Set all analytics data
        setAnalytics({
          students: studentAnalytics,
          buildings: buildingAnalytics,
          rooms: roomAnalytics,
          forms: formAnalytics,
          offenses: offenseAnalytics,
          checkIns: checkInAnalytics,
          recentActivity: {
            checkIns: activityResponse.data.checkIns || [],
            maintenanceRequests: activityResponse.data.maintenanceRequests || []
          }
        });
        
        setLoading(false);
        
        // Fetch offense history and check-in logs after the main analytics data is loaded
        fetchOffenseHistory();
        fetchTodayCheckInLogs();
        
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
      title: 'Total Students', 
      count: analytics.students.totalStudents, 
      trend: formatPercentChange(analytics.students.percentChange), 
      isIncrease: analytics.students.isIncrease,
      icon: <PeopleIcon />,
      color: '#8B5CF6',
      subtext: `${analytics.students.activeStudents} active residents`
    },
    { 
      title: 'Total Buildings', 
      count: analytics.buildings.totalBuildings, 
      trend: formatPercentChange(analytics.buildings.percentChange), 
      isIncrease: analytics.buildings.isIncrease,
      icon: <ApartmentIcon />,
      color: '#3B82F6',
      subtext: `${analytics.buildings.totalBuildings} dormitory buildings`
    },
    { 
      title: 'Total Rooms', 
      count: analytics.rooms.totalRooms, 
      trend: formatPercentChange(analytics.rooms.percentChange), 
      isIncrease: analytics.rooms.isIncrease,
      icon: <RoomIcon />,
      color: '#10B981',
      subtext: `${analytics.rooms.occupiedRooms} occupied, ${analytics.rooms.availableRooms} available`
    },
    { 
      title: 'Total Forms', 
      count: analytics.forms.total, 
      trend: formatPercentChange(analytics.forms.percentChange), 
      isIncrease: analytics.forms.isIncrease,
      icon: <AssignmentIcon />,
      color: '#F59E0B',
      subtext: `${analytics.forms.completed} completed, ${analytics.forms.pending} pending`
    },
  ];

  // Add a function to fetch check-in logs for the current day
  const fetchTodayCheckInLogs = async () => {
    try {
      setCheckInLogsLoading(true);
      // Get today's date in YYYY-MM-DD format
      const today = new Date();
      const dateStr = today.toISOString().split('T')[0];
      
      // Fetch logs for today
      const response = await axios.get(`/api/admin/logs/${dateStr}`);
      
      // Process and flatten the entries
      const entries = [];
      
      if (response.data && response.data.length > 0) {
        // Iterate through all logs
        response.data.forEach(log => {
          // Check if it has entries
          if (log.entries && log.entries.length > 0) {
            // Map each entry to a flattened format with user information
            const logEntries = log.entries.map(entry => ({
              _id: entry._id,
              studentId: log.user?._id,
              studentName: log.user?.name || 'Unknown',
              room: `${log.room?.building?.name || 'Building'} - ${log.room?.roomNumber || 'Room'}`,
              checkInTime: entry.checkInTime,
              checkOutTime: entry.checkOutTime,
              checkInStatus: entry.checkInStatus,
              checkOutStatus: entry.checkOutStatus,
              status: entry.checkInStatus, // For compatibility with existing UI
              timestamp: entry.checkInTime,
              roomNumber: log.user?.studentDormNumber || 'N/A'
            }));
            entries.push(...logEntries);
          }
        });
      }
      
      // Sort by most recent check-in time
      entries.sort((a, b) => new Date(b.checkInTime) - new Date(a.checkInTime));
      
      setCheckInLogs(entries);
      setCheckInLogsLoading(false);
    } catch (error) {
      console.error('Error fetching check-in logs:', error);
      setCheckInLogsLoading(false);
    }
  };

  // Add a function to fetch actual offense history data
  const fetchOffenseHistory = async () => {
    try {
      setOffenseHistoryLoading(true);
      
      // Get the current date
      const today = new Date();
      
      // Get all offenses
      const response = await axios.get('/api/admin/offenses');
      
      if (!response.data || !Array.isArray(response.data)) {
        console.error('Invalid response format from offense API:', response.data);
        setOffenseHistoryLoading(false);
        return;
      }
      
      // Process offense data by month for the last 6 months
      const months = [];
      const monthlyCounts = [];
      
      // Create 6 month labels and initialize counts to 0
      for (let i = 5; i >= 0; i--) {
        const monthDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const monthName = monthDate.toLocaleString('default', { month: 'short' });
        months.push(monthName);
        monthlyCounts.push(0);
      }
      
      // Count offenses for each month
      response.data.forEach(offense => {
        const offenseDate = new Date(offense.dateOfOffense);
        
        // Only include offenses from the last 6 months
        const monthDiff = (today.getFullYear() - offenseDate.getFullYear()) * 12 + 
                           (today.getMonth() - offenseDate.getMonth());
        
        if (monthDiff >= 0 && monthDiff < 6) {
          // Index in our arrays (5 - monthDiff gives us the correct position)
          const index = 5 - monthDiff;
          monthlyCounts[index]++;
        }
      });
      
      // Create offense history data object
      setOffenseHistory({
        labels: months,
        data: monthlyCounts
      });
      
      setOffenseHistoryLoading(false);
    } catch (error) {
      console.error('Error fetching offense history:', error);
      setOffenseHistoryLoading(false);
    }
  };

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

        {/* Charts Section */}
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" sx={{ 
            fontWeight: 600, 
            color: mode === 'dark' ? '#fff' : '#333',
            mb: 3,
            textShadow: mode === 'dark'
              ? '0 2px 4px rgba(0,0,0,0.2)'
              : '0 1px 2px rgba(0,0,0,0.05)',
          }}>
            Analytics Overview
          </Typography>
          <Grid container spacing={3}>
            {/* Offense History Line Graph */}
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
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ 
                    color: mode === 'dark' ? '#fff' : '#333', 
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}>
                    <BarChartIcon sx={{ color: '#EF4444' }} />
                    Offense History
                  </Typography>
                  <Tooltip title="Refresh offense history">
                    <IconButton 
                      size="small" 
                      onClick={fetchOffenseHistory}
                      disabled={offenseHistoryLoading}
                      sx={{ 
                        color: '#EF4444',
                        '&:hover': {
                          backgroundColor: mode === 'dark' 
                            ? 'rgba(239, 68, 68, 0.1)' 
                            : 'rgba(239, 68, 68, 0.05)',
                        }
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                        <path fillRule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/>
                        <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/>
                      </svg>
                    </IconButton>
                  </Tooltip>
                </Box>
                {(loading || offenseHistoryLoading) ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                    <CircularProgress size={30} sx={{ color: '#10B981' }} />
                  </Box>
                ) : (
                  <Box sx={{ height: 300, width: '100%' }}>
                    <Line
                      data={{
                        labels: offenseHistory.labels,
                        datasets: [
                          {
                            label: 'Total Offenses',
                            data: offenseHistory.data,
                            borderColor: mode === 'dark' ? '#EF4444' : '#DC2626',
                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            borderWidth: 2,
                            pointBackgroundColor: mode === 'dark' ? '#EF4444' : '#DC2626',
                            pointBorderColor: mode === 'dark' ? '#111' : '#fff',
                            pointRadius: 4,
                            pointHoverRadius: 6,
                            fill: true,
                            tension: 0.3,
                          }
                        ],
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        interaction: {
                          mode: 'index',
                          intersect: false,
                        },
                        plugins: {
                          legend: {
                            display: false,
                          },
                          tooltip: {
                            backgroundColor: mode === 'dark' ? 'rgba(17, 24, 39, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                            titleColor: mode === 'dark' ? '#fff' : '#111',
                            bodyColor: mode === 'dark' ? '#9CA3AF' : '#6c757d',
                            borderColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                            borderWidth: 1,
                            padding: 10,
                            displayColors: false,
                            callbacks: {
                              title: (tooltipItems) => {
                                return `${tooltipItems[0].label} Offenses`;
                              },
                              label: (context) => {
                                return `Total: ${context.parsed.y}`;
                              }
                            }
                          }
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                            grid: {
                              color: mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                            },
                            ticks: {
                              color: mode === 'dark' ? '#9CA3AF' : '#6c757d',
                              precision: 0,
                              stepSize: 1,
                            }
                          },
                          x: {
                            grid: {
                              display: false,
                            },
                            ticks: {
                              color: mode === 'dark' ? '#9CA3AF' : '#6c757d',
                            }
                          }
                        }
                      }}
                    />
                  </Box>
                )}
              </Card>
            </Grid>
            
            {/* Check-in/Check-out Pie Chart */}
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
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ 
                    color: mode === 'dark' ? '#fff' : '#333', 
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}>
                    <PieChartIcon sx={{ color: '#3B82F6' }} />
                    Today's Check-in Activity
                  </Typography>
                  <Tooltip title="Refresh check-in data">
                    <IconButton 
                      size="small" 
                      onClick={fetchTodayCheckInLogs}
                      disabled={checkInLogsLoading}
                      sx={{ 
                        color: '#3B82F6',
                        '&:hover': {
                          backgroundColor: mode === 'dark' 
                            ? 'rgba(59, 130, 246, 0.1)' 
                            : 'rgba(59, 130, 246, 0.05)',
                        }
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                        <path fillRule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/>
                        <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/>
                      </svg>
                    </IconButton>
                  </Tooltip>
                </Box>
                {(loading || checkInLogsLoading) ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                    <CircularProgress size={30} sx={{ color: '#3B82F6' }} />
                  </Box>
                ) : (
                  <Box sx={{ height: 300, overflow: 'auto' }}>
                    {checkInLogs.length > 0 ? (
                      <List sx={{ width: '100%', p: 0 }}>
                        {checkInLogs.slice(0, 5).map((activity, index) => (
                          <React.Fragment key={activity._id || index}>
                            <ListItem
                              sx={{
                                px: 2,
                                py: 1.5,
                                borderRadius: 2,
                                mb: 1,
                                backgroundColor: mode === 'dark' 
                                  ? alpha(activity.checkInStatus === 'OnTime' ? '#10B981' : '#EF4444', 0.1)
                                  : alpha(activity.checkInStatus === 'OnTime' ? '#10B981' : '#EF4444', 0.05),
                                border: '1px solid',
                                borderColor: mode === 'dark'
                                  ? alpha(activity.checkInStatus === 'OnTime' ? '#10B981' : '#EF4444', 0.2)
                                  : alpha(activity.checkInStatus === 'OnTime' ? '#10B981' : '#EF4444', 0.1),
                              }}
                            >
                              <Box sx={{ 
                                display: 'flex', 
                                flexDirection: 'column',
                                width: '100%' 
                              }}>
                                <Box sx={{ 
                                  display: 'flex', 
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  mb: 0.5
                                }}>
                                  <Box>
                                    <Typography
                                      variant="subtitle2"
                                      sx={{
                                        fontWeight: 600,
                                        color: mode === 'dark' ? '#fff' : '#333',
                                      }}
                                    >
                                      {activity.studentName}
                                    </Typography>
                                    <Typography
                                      variant="caption"
                                      sx={{
                                        color: mode === 'dark' ? '#9CA3AF' : '#6c757d',
                                      }}
                                    >
                                      {activity.roomNumber || activity.room}
                                    </Typography>
                                  </Box>
                                  <Box sx={{ 
                                    display: 'flex', 
                                    alignItems: 'center',
                                    backgroundColor: mode === 'dark' 
                                      ? alpha(activity.checkInStatus === 'OnTime' ? '#10B981' : '#EF4444', 0.2)
                                      : alpha(activity.checkInStatus === 'OnTime' ? '#10B981' : '#EF4444', 0.1),
                                    color: activity.checkInStatus === 'OnTime' ? '#10B981' : '#EF4444',
                                    borderRadius: 1,
                                    px: 1,
                                    py: 0.2,
                                  }}>
                                    <CircleIcon sx={{ fontSize: 8, mr: 0.5 }} />
                                    <Typography variant="caption">
                                      {activity.checkInStatus}
                                    </Typography>
                                  </Box>
                                </Box>
                                <Box sx={{ 
                                  display: 'flex', 
                                  justifyContent: 'space-between',
                                  alignItems: 'center'
                                }}>
                                  <Typography
                                    variant="body2"
                                    sx={{
                                      color: mode === 'dark' ? '#9CA3AF' : '#6c757d',
                                    }}
                                  >
                                    {new Date(activity.checkInTime).toLocaleTimeString([], {
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </Typography>
                                  <Typography
                                    variant="body2"
                                    sx={{
                                      color: activity.checkOutTime ? '#3B82F6' : (mode === 'dark' ? '#9CA3AF' : '#6c757d'),
                                      fontStyle: 'italic'
                                    }}
                                  >
                                    {activity.checkOutTime 
                                      ? `Checked out: ${new Date(activity.checkOutTime).toLocaleTimeString([], {
                                          hour: '2-digit', 
                                          minute: '2-digit'
                                        })}` 
                                      : 'Not checked out yet'}
                                  </Typography>
                                </Box>
                              </Box>
                            </ListItem>
                            {index < checkInLogs.slice(0, 5).length - 1 && (
                              <Divider variant="middle" sx={{ 
                                my: 1,
                                borderColor: mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
                              }} />
                            )}
                          </React.Fragment>
                        ))}
                      </List>
                    ) : (
                      <Box sx={{ 
                        height: '100%', 
                        display: 'flex', 
                        flexDirection: 'column',
                        alignItems: 'center', 
                        justifyContent: 'center' 
                      }}>
                        <Typography sx={{ 
                          color: mode === 'dark' ? '#6B7280' : '#6c757d',
                          textAlign: 'center'
                        }}>
                          No check-in activity recorded today
                        </Typography>
                      </Box>
                    )}
                    
                    {/* Today's Summary */}
                    <Box sx={{ 
                      mt: 2,
                      pt: 2,
                      borderTop: '1px solid',
                      borderColor: mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
                    }}>
                      <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        px: 2
                      }}>
                        <Typography sx={{ 
                          color: mode === 'dark' ? '#9CA3AF' : '#6c757d',
                          fontSize: '0.875rem',
                          fontWeight: 500
                        }}>
                          Today's Check-ins:
                        </Typography>
                        <Typography sx={{ 
                          color: '#3B82F6',
                          fontWeight: 600,
                          fontSize: '0.875rem'
                        }}>
                          {analytics.checkIns.total || checkInLogs.length}
                        </Typography>
                      </Box>
                      <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        px: 2,
                        mt: 1
                      }}>
                        <Typography sx={{ 
                          color: mode === 'dark' ? '#9CA3AF' : '#6c757d',
                          fontSize: '0.875rem',
                          fontWeight: 500
                        }}>
                          Today's Check-outs:
                        </Typography>
                        <Typography sx={{ 
                          color: '#F59E0B',
                          fontWeight: 600,
                          fontSize: '0.875rem'
                        }}>
                          {analytics.checkIns.checkOut || checkInLogs.filter(log => log.checkOutTime).length}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                )}
              </Card>
            </Grid>
          </Grid>
        </Box>

        {/* Total Offenses Bar Chart */}
        <Box sx={{ mt: 4 }}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
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
              }}>
                <Typography variant="h6" sx={{ 
                  color: mode === 'dark' ? '#fff' : '#333', 
                  mb: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}>
                  <WarningIcon sx={{ color: '#F59E0B' }} />
                  Total Offenses
                </Typography>
                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                    <CircularProgress size={30} sx={{ color: '#F59E0B' }} />
                  </Box>
                ) : (
                  <Box sx={{ 
                    height: 250, 
                    display: 'flex', 
                    flexDirection: 'column',
                    alignItems: 'center', 
                    justifyContent: 'center',
                    padding: 2
                  }}>
                    <Bar
                      data={{
                        labels: ['Last Month', 'Current Month'],
                        datasets: [
                          {
                            label: 'Total Offenses',
                            data: [analytics.offenses.lastMonth, analytics.offenses.total],
                            backgroundColor: [
                              mode === 'dark' ? 'rgba(245, 158, 11, 0.6)' : 'rgba(217, 119, 6, 0.8)',
                              mode === 'dark' ? 'rgba(239, 68, 68, 0.6)' : 'rgba(220, 38, 38, 0.8)',
                            ],
                            borderColor: [
                              mode === 'dark' ? 'rgba(245, 158, 11, 1)' : 'rgba(217, 119, 6, 1)',
                              mode === 'dark' ? 'rgba(239, 68, 68, 1)' : 'rgba(220, 38, 38, 1)',
                            ],
                            borderWidth: 1,
                            borderRadius: 6,
                          },
                        ],
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            display: false,
                          },
                          tooltip: {
                            callbacks: {
                              label: (context) => {
                                return `Total Offenses: ${context.parsed.y}`;
                              }
                            }
                          }
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                            ticks: {
                              color: mode === 'dark' ? '#9CA3AF' : '#6c757d',
                              precision: 0,
                            },
                            grid: {
                              color: mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                            },
                          },
                          x: {
                            ticks: {
                              color: mode === 'dark' ? '#9CA3AF' : '#6c757d',
                            },
                            grid: {
                              display: false,
                            },
                          },
                        },
                      }}
                    />
                    <Box sx={{ 
                      display: 'flex', 
                      width: '100%', 
                      justifyContent: 'center',
                      mt: 2
                    }}>
                      {analytics.offenses.percentChange !== 0 && (
                        <Tooltip title={analytics.offenses.isIncrease ? 'Increased from last month' : 'Decreased from last month'}>
                          <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            color: analytics.offenses.isIncrease ? '#EF4444' : '#10B981',
                            bgcolor: analytics.offenses.isIncrease 
                              ? alpha('#EF4444', mode === 'dark' ? 0.1 : 0.1) 
                              : alpha('#10B981', mode === 'dark' ? 0.1 : 0.1),
                            p: 0.5,
                            px: 1,
                            borderRadius: 1,
                          }}>
                            {analytics.offenses.isIncrease ? <TrendingUpIcon fontSize="small" /> : <TrendingDownIcon fontSize="small" />}
                            <Typography variant="caption" sx={{ ml: 0.5 }}>
                              {analytics.offenses.isIncrease ? '+' : ''}{analytics.offenses.percentChange}%
                            </Typography>
                          </Box>
                        </Tooltip>
                      )}
                    </Box>
                  </Box>
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
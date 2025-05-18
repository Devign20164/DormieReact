import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Avatar,
  Button,
  IconButton,
  Divider,
  CircularProgress,
  Stack,
  Chip,
  Tooltip,
  useTheme
} from '@mui/material';
import {
  ArrowUpward,
  ArrowDownward,
  People,
  Apartment,
  MeetingRoom,
  Assignment,
  Notifications,
  MoreVert,
  Warning,
  AccessTime,
  Dashboard as DashboardIcon,
  BarChart,
  Refresh,
  CheckCircle
} from '@mui/icons-material';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  LineElement,
  PointElement,
  ArcElement,
  Title, 
  Tooltip as ChartTooltip, 
  Legend,
  Filler
} from 'chart.js';
import AdminSidebar from '../components/AdminSidebar';
import NotificationBell from '../components/NotificationBell';
import axios from 'axios';
import { useSocket } from '../context/SocketContext';
import { format, subDays } from 'date-fns';

// Register required Chart.js components
ChartJS.register(
  CategoryScale, 
  LinearScale, 
  BarElement, 
  LineElement,
  PointElement,
  ArcElement,
  Title, 
  ChartTooltip, 
  Legend,
  Filler
);

// Color constants matching AdminSidebar.js
const GREEN_MAIN = "#10B981";
const GREEN_DARK = "#059669";
const GREEN_DARKER = "#047857";
const FOREST_GREEN = "#1D503A";
const BG_DARK = "#141414";
const BG_DARKER = "#0A0A0A";

const AdminDashboard = () => {
  const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  const theme = useTheme();
  const socket = useSocket();
  const isDarkMode = true; // Always use dark mode for this design
  
  // Add refs for charts
  const offenseChartRef = useRef(null);
  const roomChartRef = useRef(null);

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
  
  // Clean up charts on re-render to avoid Canvas reuse error
  useEffect(() => {
    return () => {
      if (offenseChartRef.current && offenseChartRef.current.destroy) {
        offenseChartRef.current.destroy();
      }
      if (roomChartRef.current && roomChartRef.current.destroy) {
        roomChartRef.current.destroy();
      }
    };
  }, []);

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
  }, []); 
  
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

  // Define the stat cards data
  const statCards = [
    {
      title: 'Total Students',
      value: analytics.students.totalStudents,
      change: analytics.students.percentChange,
      isPositive: analytics.students.isIncrease,
      icon: <People />,
      color: GREEN_MAIN,
      subtext: `${analytics.students.activeStudents} active residents`
    },
    {
      title: 'Buildings',
      value: analytics.buildings.totalBuildings,
      change: analytics.buildings.percentChange,
      isPositive: analytics.buildings.isIncrease,
      icon: <Apartment />,
      color: GREEN_MAIN,
      subtext: `${analytics.buildings.totalBuildings} dormitory buildings`
    },
    {
      title: 'Rooms',
      value: analytics.rooms.totalRooms,
      change: analytics.rooms.percentChange,
      isPositive: analytics.rooms.isIncrease,
      icon: <MeetingRoom />,
      color: GREEN_MAIN,
      subtext: `${analytics.rooms.occupancyRate}% occupancy rate`
    },
    {
      title: 'Service Requests',
      value: analytics.forms.total,
      change: analytics.forms.percentChange,
      isPositive: analytics.forms.isIncrease,
      icon: <Assignment />,
      color: GREEN_MAIN,
      subtext: `${analytics.forms.pending} pending requests`
    }
  ];

  return (
    <Box sx={{ 
      display: 'flex', 
      height: '100vh',
      background: 'linear-gradient(145deg, #0A0A0A 0%, #141414 100%)',
      color: '#fff',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <AdminSidebar />
      
      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          height: '100%',
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center', // Center horizontally
          position: 'relative',
          zIndex: 1,
          p: { xs: 2, md: 3 },
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
          width: '100%',
          maxWidth: '1400px',
          mx: 'auto',
        }}>
          <Box>
            <Typography variant="h4" sx={{ 
              fontWeight: 600, 
              color: '#fff',
              textShadow: '0 2px 4px rgba(0,0,0,0.2)',
            }}>
              Admin Dashboard
            </Typography>
            <Typography variant="body2" sx={{ color: '#6B7280', mt: 1 }}>
              Welcome back, {userData.name || 'Admin'} | {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </Typography>
          </Box>
          
          <Stack direction="row" spacing={1}>
            <NotificationBell userType="admin" color={GREEN_MAIN} />
          </Stack>
        </Box>
        
        {/* Loading/Error State */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress sx={{ color: GREEN_MAIN }} />
          </Box>
        ) : error ? (
          <Box sx={{ 
            p: 3, 
            bgcolor: 'rgba(239, 68, 68, 0.1)', 
            borderRadius: 2,
            color: '#EF4444',
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            width: '100%',
            maxWidth: '1400px',
            mx: 'auto',
          }}>
            <Warning color="error" />
            <Typography>{error}</Typography>
          </Box>
        ) : (
          <Box sx={{ width: '100%', maxWidth: '1400px', mx: 'auto' }}>
            {/* Stat Cards Row - width 100% */}
            <Grid container spacing={2.5} sx={{ mb: 2, width: '100%', mx: 'auto' }}>
              {statCards.map((stat, index) => (
                <Grid item xs={12} sm={6} md={3} sx={{ flex: 1, minWidth: 0 }} key={index}>
                  <Card sx={{
                    background: 'linear-gradient(135deg, #18181b 60%, #10B981 100%)',
                    borderRadius: '18px',
                    boxShadow: '0 2px 12px 0 rgba(16,185,129,0.10)',
                    p: 0,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    border: '1px solid #2e2e2e',
                  }}>
                    <CardContent sx={{ p: 2.5, display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Box sx={{
                          bgcolor: 'rgba(255,255,255,0.07)',
                          borderRadius: '12px',
                          width: 40,
                          height: 40,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mr: 1,
                        }}>
                          {stat.icon}
                        </Box>
                      </Box>
                      <Typography variant="h4" sx={{ fontWeight: 800, color: '#fff', mb: 0.5, fontSize: 32 }}>
                        {stat.value.toLocaleString()}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>
                        {stat.title === 'Total Students' ? 'Total amount of students' : stat.subtext}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
            {/* Main Content Grid - Offense Trend full width, Room Occupancy on right */}
            <Grid container spacing={2.5} sx={{ width: '100%', mx: 'auto' }}>
              {/* Offense Trend (Line Chart) - take most of the width */}
              <Grid item xs={12} md={9} sx={{ flex: 3, minWidth: 0 }}>
                <Card sx={{
                  background: 'linear-gradient(135deg, #141414 60%, #1D503A 100%)',
                  borderRadius: '20px',
                  border: '1px solid #2e2e2e',
                  boxShadow: '0 4px 20px rgba(16,185,129,0.10)',
                  height: '100%',
                }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#fff', mb: 2 }}>
                      Offense Trend
                    </Typography>
                    <Box sx={{ height: 300 }}>
                      <Line
                        ref={chart => { offenseChartRef.current = chart; }}
                        data={{
                          labels: offenseHistory.labels,
                          datasets: [
                            {
                              label: 'Offenses',
                              data: offenseHistory.data,
                              fill: true,
                              backgroundColor: 'rgba(16, 185, 129, 0.10)',
                              borderColor: GREEN_MAIN,
                              tension: 0.4,
                              pointRadius: 4,
                              pointBackgroundColor: GREEN_MAIN,
                              pointBorderColor: BG_DARKER,
                              pointBorderWidth: 2,
                              pointHoverRadius: 6,
                              pointHoverBackgroundColor: GREEN_MAIN,
                              pointHoverBorderColor: BG_DARKER,
                            },
                          ],
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: { display: false },
                            tooltip: {
                              backgroundColor: BG_DARK,
                              titleColor: '#fff',
                              bodyColor: '#94A3B8',
                              borderColor: 'rgba(255, 255, 255, 0.1)',
                              borderWidth: 1,
                              padding: 12,
                              boxPadding: 6,
                              usePointStyle: true,
                              callbacks: {
                                title: (tooltipItems) => tooltipItems[0].label,
                                label: (context) => `Offenses: ${context.parsed.y}`,
                              },
                            },
                          },
                          scales: {
                            x: {
                              grid: { display: false },
                              ticks: { color: '#6B7280' },
                            },
                            y: {
                              beginAtZero: true,
                              grid: { color: 'rgba(255, 255, 255, 0.05)' },
                              ticks: { color: '#6B7280' },
                            },
                          },
                        }}
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              {/* Room Occupancy (Doughnut Chart + Legend) */}
              <Grid item xs={12} md={3} sx={{ flex: 1, minWidth: 0 }}>
                <Card
                  sx={{
                    background: 'linear-gradient(135deg, #18181b 60%, #1D503A 100%)',
                    borderRadius: '20px',
                    border: '1px solid #2e2e2e',
                    boxShadow: '0 6px 32px 0 rgba(16,185,129,0.10)',
                    p: 0,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <CardContent sx={{ width: '100%', p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <MeetingRoom sx={{ color: GREEN_MAIN, fontSize: 28 }} />
                      <Typography variant="h6" sx={{ fontWeight: 700, color: '#fff' }}>
                        Room Occupancy
                      </Typography>
                    </Box>
                    <Box sx={{ position: 'relative', width: 180, height: 180, mb: 2 }}>
                      <Doughnut
                        data={{
                          labels: ['Occupied', 'Available'],
                          datasets: [
                            {
                              data: [analytics.rooms.occupiedRooms, analytics.rooms.availableRooms],
                              backgroundColor: [GREEN_MAIN, '#374151'],
                              borderWidth: 0,
                              hoverOffset: 5,
                            },
                          ],
                        }}
                        options={{
                          cutout: '75%',
                          plugins: { legend: { display: false } },
                        }}
                      />
                      <Box
                        sx={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          textAlign: 'center',
                        }}
                      >
                        <Typography variant="h4" sx={{ fontWeight: 800, color: '#fff', textShadow: '0 2px 8px #0008' }}>
                          {analytics.rooms.occupancyRate}%
                        </Typography>
                      </Box>
                    </Box>
                    {/* Legend centered under the chart */}
                    <Box sx={{ width: '100%', mt: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1.5 }}>
                        <Box sx={{ width: 14, height: 14, borderRadius: '50%', bgcolor: GREEN_MAIN }} />
                        <Typography variant="body2" sx={{ color: '#fff', ml: 1 }}>
                          Occupied
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#fff', fontWeight: 700, ml: 2 }}>
                          {analytics.rooms.occupiedRooms}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{ width: 14, height: 14, borderRadius: '50%', bgcolor: '#374151' }} />
                        <Typography variant="body2" sx={{ color: '#fff', ml: 1 }}>
                          Available
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#fff', fontWeight: 700, ml: 2 }}>
                          {analytics.rooms.availableRooms}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default AdminDashboard; 
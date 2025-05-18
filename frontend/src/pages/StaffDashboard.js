import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Stack,
  CircularProgress,
  useTheme
} from '@mui/material';
import {
  Warning as WarningIcon,
  AssignmentTurnedIn as AssignmentsIcon,
  Assignment as AssignmentIcon
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
import StaffSidebar from '../components/StaffSidebar';
import NotificationBell from '../components/NotificationBell';
import { format, subDays, startOfWeek, endOfWeek } from 'date-fns';
import axios from 'axios';

// Register Chart.js components
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

// Color constants
const BLUE_MAIN = "#3B82F6";
const BLUE_DARK = "#2563EB";
const BLUE_DARKER = "#1D4ED8";

// Color constants for task status using blue shades
const STATUS_COLORS = {
  Completed: '#3B82F6', // Primary blue for completed tasks
  'In Progress': '#2563EB', // Darker blue for in-progress tasks
  Assigned: '#1E40AF', // Deepest blue for assigned tasks
};

const StaffDashboard = () => {
  const [userData, setUserData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [performanceData, setPerformanceData] = useState({ 
    labels: [], 
    data: [],
    total: 0,
    trend: 0 
  });
  const [taskDistribution, setTaskDistribution] = useState({
    labels: ['Completed', 'In Progress', 'Assigned'],
    data: [0, 0, 0]
  });
  const theme = useTheme();

  // Add refs for charts
  const performanceChartRef = useRef(null);
  const taskChartRef = useRef(null);

  // Function to fetch weekly performance data
  const fetchWeeklyPerformance = async (staffId) => {
    try {
      // Get start and end of current week
      const now = new Date();
      const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Start from Monday
      const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

      const response = await axios.get('/api/staff/performance', {
        params: {
          staffId,
          startDate: format(weekStart, 'yyyy-MM-dd'),
          endDate: format(weekEnd, 'yyyy-MM-dd')
        }
      });

      const weeklyData = response.data;
      
      // Calculate the trend (percentage change from last week)
      const trend = weeklyData.trend || 0;
      
      // Update performance data with actual values
      setPerformanceData({
        labels: weeklyData.labels || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        data: weeklyData.data || [0, 0, 0, 0, 0, 0, 0],
        total: weeklyData.total || 0,
        trend
      });

    } catch (err) {
      console.error('Error fetching weekly performance:', err);
    }
  };

  // Function to fetch forms and update task distribution
  const fetchFormsData = async () => {
    try {
      const response = await axios.get('/api/staff/forms');
      const forms = response.data.forms;
      const stats = response.data.stats;

      // Update task distribution
      setTaskDistribution({
        labels: ['Completed', 'In Progress', 'Assigned'],
        data: [
          stats.completed || 0,
          stats.inProgress || 0,
          stats.assigned || 0
        ]
      });

    } catch (err) {
      console.error('Error fetching forms data:', err);
      setError('Failed to load task distribution data');
    }
  };

  // Clean up charts on unmount
  useEffect(() => {
    return () => {
      if (performanceChartRef.current && performanceChartRef.current.destroy) {
        performanceChartRef.current.destroy();
      }
      if (taskChartRef.current && taskChartRef.current.destroy) {
        taskChartRef.current.destroy();
      }
    };
  }, []);

  useEffect(() => {
    const storedUserData = JSON.parse(localStorage.getItem('userData') || '{}');
    setUserData(storedUserData);
    
    // Fetch actual performance data
    if (storedUserData._id) {
      fetchWeeklyPerformance(storedUserData._id);
    }

    fetchFormsData();
    setLoading(false);
  }, []);

  return (
    <Box sx={{ 
      display: 'flex', 
      height: '100vh',
      background: 'linear-gradient(145deg, #0A0A0A 0%, #141414 100%)',
      color: '#fff',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <StaffSidebar />

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          height: '100%',
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
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
              Staff Dashboard
            </Typography>
            <Typography variant="body2" sx={{ color: '#6B7280', mt: 1 }}>
              Welcome back, {userData.name || 'Staff'} | {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </Typography>
          </Box>
          
          <Stack direction="row" spacing={1}>
            <NotificationBell userType="staff" color={BLUE_MAIN} />
          </Stack>
        </Box>

        {/* Loading/Error State */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress sx={{ color: BLUE_MAIN }} />
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
          }}>
            <WarningIcon color="error" />
            <Typography>{error}</Typography>
          </Box>
        ) : (
          <Box sx={{ width: '100%', maxWidth: '1400px', mx: 'auto' }}>
            {/* Charts Grid */}
            <Grid container spacing={2.5} sx={{ width: '100%', mx: 'auto' }}>
              {/* Performance Chart */}
              <Grid item xs={12} md={9} sx={{ flex: 3, minWidth: 0 }}>
                <Card sx={{ 
                  background: 'linear-gradient(135deg, #141414 60%, #1D4ED8 100%)',
                  borderRadius: '16px',
                  border: '1px solid #2e2e2e',
                  boxShadow: '0 4px 20px rgba(59,130,246,0.10)',
                  height: '100%',
                }}>
                  <CardContent sx={{ p: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#fff', mb: 2 }}>
                      Weekly Performance
                    </Typography>
                    <Box sx={{ height: 300, position: 'relative' }}>
                      <Line
                        data={{
                          labels: performanceData.labels,
                          datasets: [
                            {
                              label: 'Tasks Completed',
                              data: performanceData.data,
                              borderColor: BLUE_MAIN,
                              backgroundColor: 'rgba(59,130,246,0.1)',
                              fill: true,
                              tension: 0.4,
                            }
                          ]
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              display: false
                            },
                            tooltip: {
                              backgroundColor: '#1F2937',
                              titleColor: '#F3F4F6',
                              bodyColor: '#D1D5DB',
                              borderColor: 'rgba(255,255,255,0.1)',
                              borderWidth: 1,
                              padding: 12,
                              displayColors: false,
                              callbacks: {
                                title: (items) => items[0].label,
                                label: (item) => `Completed: ${item.raw} tasks`
                              }
                            }
                          },
                          scales: {
                            y: {
                              grid: {
                                color: 'rgba(255,255,255,0.1)',
                              },
                              ticks: {
                                color: '#6B7280',
                                callback: (value) => Math.round(value)
                              },
                              beginAtZero: true
                            },
                            x: {
                              grid: {
                                display: false
                              },
                              ticks: {
                                color: '#6B7280',
                              }
                            }
                          }
                        }}
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Task Distribution */}
              <Grid item xs={12} md={3} sx={{ flex: 1, minWidth: 0 }}>
                <Card sx={{ 
                  background: 'linear-gradient(135deg, #18181b 60%, #1D4ED8 100%)',
                  borderRadius: '16px',
                  border: '1px solid #2e2e2e',
                  boxShadow: '0 4px 20px rgba(59,130,246,0.10)',
                  height: '100%',
                }}>
                  <CardContent sx={{ p: 2 }}>
                    <Typography variant="h6" sx={{ 
                      fontWeight: 700, 
                      color: '#fff', 
                      mb: 2,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}>
                      <AssignmentIcon sx={{ fontSize: 20, color: '#3B82F6' }} />
                      Task Distribution
                    </Typography>
                    <Box sx={{ 
                      height: 300, 
                      position: 'relative', 
                      display: 'flex', 
                      justifyContent: 'center', 
                      alignItems: 'center',
                      p: 2
                    }}>
                      <Doughnut
                        data={{
                          labels: taskDistribution.labels,
                          datasets: [{
                            data: taskDistribution.data,
                            backgroundColor: [
                              STATUS_COLORS.Completed,
                              STATUS_COLORS['In Progress'],
                              STATUS_COLORS.Assigned
                            ],
                            borderWidth: 0,
                            hoverOffset: 4,
                            hoverBackgroundColor: [
                              '#60A5FA', // Lighter blue for hover on completed
                              '#3B82F6', // Primary blue for hover on in-progress
                              '#2563EB', // Darker blue for hover on assigned
                            ]
                          }]
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              position: 'bottom',
                              labels: {
                                color: '#FFFFFF',
                                padding: 20,
                                font: {
                                  size: 12,
                                  weight: '500',
                                  family: 'Inter, sans-serif',
                                },
                                usePointStyle: true,
                                pointStyle: 'circle',
                                boxWidth: 8,
                                boxHeight: 8,
                                generateLabels: (chart) => {
                                  const datasets = chart.data.datasets;
                                  return chart.data.labels.map((label, i) => ({
                                    text: label,
                                    fillStyle: datasets[0].backgroundColor[i],
                                    strokeStyle: datasets[0].backgroundColor[i],
                                    hidden: false,
                                    index: i,
                                    fontColor: '#FFFFFF',
                                    color: '#FFFFFF',
                                    textColor: '#FFFFFF'
                                  }));
                                }
                              }
                            },
                            tooltip: {
                              backgroundColor: '#1F2937',
                              titleColor: '#FFFFFF',
                              bodyColor: '#FFFFFF',
                              borderColor: 'rgba(59,130,246,0.1)',
                              borderWidth: 1,
                              padding: 12,
                              displayColors: true,
                              boxWidth: 10,
                              boxHeight: 10,
                              usePointStyle: true,
                              titleFont: {
                                size: 14,
                                weight: '600',
                                family: 'Inter, sans-serif',
                              },
                              bodyFont: {
                                size: 12,
                                weight: '500',
                                family: 'Inter, sans-serif',
                              },
                              callbacks: {
                                label: (context) => {
                                  const value = context.raw || 0;
                                  const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                                  return ` ${context.label}: ${value} (${percentage}%)`;
                                }
                              }
                            }
                          },
                          cutout: '75%',
                          animation: {
                            animateScale: true,
                            animateRotate: true
                          }
                        }}
                      />
                      {/* Center text showing total tasks */}
                      <Box sx={{
                        position: 'absolute',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center',
                        background: 'rgba(24, 24, 27, 0.8)',
                        borderRadius: '50%',
                        width: '120px',
                        height: '120px',
                        backdropFilter: 'blur(4px)',
                        top: '25%',
                        transform: 'translateY(-10%)'
                      }}>
                        <Typography variant="h4" sx={{ 
                          color: '#3B82F6',
                          fontWeight: 700,
                          textShadow: '0 2px 4px rgba(0,0,0,0.2)'
                        }}>
                          {taskDistribution.data.reduce((a, b) => a + b, 0)}
                        </Typography>
                        <Typography variant="body2" sx={{ 
                          color: '#9CA3AF',
                          fontWeight: 500
                        }}>
                          Total Tasks
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

export default StaffDashboard; 
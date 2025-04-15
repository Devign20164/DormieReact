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
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Circle as CircleIcon,
  AssignmentTurnedIn as AssignmentsIcon,
} from '@mui/icons-material';
import StaffSidebar from '../components/StaffSidebar';
import NotificationBell from '../components/NotificationBell';

const StaffDashboard = () => {
  const [userData, setUserData] = useState({});
  const [statsData, setStatsData] = useState([]);

  // Get user data from localStorage on mount
  useEffect(() => {
    const storedUserData = JSON.parse(localStorage.getItem('userData') || '{}');
    setUserData(storedUserData);
    
    // Set stats based on staff type
    if (storedUserData.typeOfStaff === 'Cleaner') {
      setStatsData([
        { title: 'Completed Tasks', count: '45', trend: '+8%', isIncrease: true },
        { title: 'Pending Tasks', count: '12', trend: '-5%', isIncrease: false },
        { title: 'Response Time', count: '28m', trend: '-10%', isIncrease: true },
        { title: 'Satisfaction Rate', count: '96%', trend: '+2%', isIncrease: true },
      ]);
    } else if (storedUserData.typeOfStaff === 'Maintenance') {
      setStatsData([
        { title: 'Repairs Done', count: '32', trend: '+12%', isIncrease: true },
        { title: 'Pending Repairs', count: '15', trend: '-3%', isIncrease: false },
        { title: 'Avg. Completion Time', count: '3.5h', trend: '-15%', isIncrease: true },
        { title: 'Parts Used', count: '87', trend: '+5%', isIncrease: false },
      ]);
    } else if (storedUserData.typeOfStaff === 'Security') {
      setStatsData([
        { title: 'Active Logs', count: '56', trend: '+7%', isIncrease: true },
        { title: 'Incidents', count: '3', trend: '-25%', isIncrease: true },
        { title: 'Patrol Rounds', count: '24', trend: '+8%', isIncrease: true },
        { title: 'Visitor Passes', count: '142', trend: '+12%', isIncrease: true },
      ]);
    } else {
      // Default stats
      setStatsData([
        { title: 'Completed Tasks', count: '38', trend: '+10%', isIncrease: true },
        { title: 'Pending Tasks', count: '14', trend: '-2%', isIncrease: false },
        { title: 'Response Time', count: '30m', trend: '-8%', isIncrease: true },
        { title: 'Satisfaction Rate', count: '92%', trend: '+3%', isIncrease: true },
      ]);
    }
  }, []);

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
          borderBottom: '1px solid rgba(255,255,255,0.03)',
        }}>
          <Box>
            <Typography variant="h4" sx={{ 
              fontWeight: 600, 
              color: '#fff',
              textShadow: '0 2px 4px rgba(0,0,0,0.2)',
            }}>
              Welcome back, {userData.name || 'Staff'}
            </Typography>
            <Typography variant="body2" sx={{ color: '#6B7280', mt: 1 }}>
              Here's what's happening with your assignments today.
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <NotificationBell userType="staff" color="#3B82F6" />
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

        {/* Stats Grid */}
        <Grid container spacing={3}>
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
                <Typography variant="body2" sx={{ color: '#6B7280', mb: 1 }}>
                  {stat.title}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="h4" sx={{ 
                    fontWeight: 600, 
                    color: '#fff',
                    textShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  }}>
                    {stat.count}
                  </Typography>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    color: stat.isIncrease ? '#3B82F6' : '#EF4444',
                    bgcolor: stat.isIncrease ? 'rgba(59, 130, 246, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    p: 0.5,
                    px: 1,
                    borderRadius: 1,
                  }}>
                    {stat.isIncrease ? <TrendingUpIcon fontSize="small" /> : <TrendingDownIcon fontSize="small" />}
                    <Typography variant="caption" sx={{ ml: 0.5 }}>
                      {stat.trend}
                    </Typography>
                  </Box>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Recent Activity */}
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" sx={{ 
            fontWeight: 600, 
            color: '#fff',
            mb: 3,
            textShadow: '0 2px 4px rgba(0,0,0,0.2)',
          }}>
            Recent Activity
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={7}>
              <Card sx={{ 
                background: 'linear-gradient(145deg, #141414 0%, #0A0A0A 100%)',
                borderRadius: '20px',
                p: 3,
                border: '1px solid rgba(255, 255, 255, 0.03)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                height: '100%',
              }}>
                <Typography variant="h6" sx={{ color: '#fff', mb: 2 }}>
                  Recent Assignments
                </Typography>
                <List>
                  {[1, 2, 3, 4, 5].map((item) => (
                    <ListItem 
                      key={item}
                      sx={{ 
                        px: 0, 
                        borderBottom: item < 5 ? '1px solid rgba(255,255,255,0.03)' : 'none',
                        py: 1,
                      }}
                    >
                      <ListItemText
                        primary={`Assignment #${item}0${item}`}
                        secondary={`${item % 2 === 0 ? 'Room cleaning' : 'Maintenance request'} - ${new Date().toLocaleDateString()}`}
                        primaryTypographyProps={{
                          color: '#fff',
                        }}
                        secondaryTypographyProps={{
                          color: '#6B7280',
                        }}
                      />
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        color: item === 1 ? '#3B82F6' : '#6B7280',
                      }}>
                        <CircleIcon sx={{ fontSize: 10, mr: 0.5 }} />
                        <Typography variant="caption">
                          {item === 1 ? 'New' : 'Viewed'}
                        </Typography>
                      </Box>
                    </ListItem>
                  ))}
                </List>
              </Card>
            </Grid>
            <Grid item xs={12} md={5}>
              <Card sx={{ 
                background: 'linear-gradient(145deg, #141414 0%, #0A0A0A 100%)',
                borderRadius: '20px',
                p: 3,
                border: '1px solid rgba(255, 255, 255, 0.03)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                height: '100%',
              }}>
                <Typography variant="h6" sx={{ color: '#fff', mb: 2 }}>
                  Task Statistics
                </Typography>
                <List>
                  {["Today", "This Week", "This Month"].map((period, index) => (
                    <ListItem
                      key={period}
                      sx={{ 
                        px: 0, 
                        borderBottom: index < 2 ? '1px solid rgba(255,255,255,0.03)' : 'none',
                        py: 1,
                      }}
                    >
                      <ListItemText
                        primary={`${period}`}
                        secondary={`${index === 0 ? '3' : index === 1 ? '18' : '47'} assignments`}
                        primaryTypographyProps={{
                          color: '#fff',
                        }}
                        secondaryTypographyProps={{
                          color: '#6B7280',
                        }}
                      />
                      <Box>
                        <Typography variant="h6" sx={{ color: '#3B82F6' }}>
                          {index === 0 ? '100%' : index === 1 ? '94%' : '89%'}
                        </Typography>
                      </Box>
                    </ListItem>
                  ))}
                </List>
              </Card>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </Box>
  );
};

export default StaffDashboard; 
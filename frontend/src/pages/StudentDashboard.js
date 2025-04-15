import React from 'react';
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
  Person as PersonIcon,
  MenuBook as MenuBookIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import StudentSidebar from '../components/StudentSidebar';
import NotificationBell from '../components/NotificationBell';

const statsData = [
  { title: 'Courses Enrolled', count: '5', trend: '+1', isIncrease: true },
  { title: 'Assignments Due', count: '3', trend: '-2', isIncrease: false },
  { title: 'Messages', count: '12', trend: '+4', isIncrease: true },
  { title: 'Attendance Rate', count: '95%', trend: '+2%', isIncrease: true },
];

const StudentDashboard = () => {
  const userData = JSON.parse(localStorage.getItem('userData') || '{}');

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
              Here's what's happening with your student account today.
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
                  Recent Messages
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
                        primary={`Admin ${item}`}
                        secondary={`Message about dorm maintenance - ${new Date().toLocaleDateString()}`}
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
                        color: '#3B82F6',
                      }}>
                        <CircleIcon sx={{ fontSize: 10, mr: 0.5 }} />
                        <Typography variant="caption">
                          New
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
                  Your Request Forms
                </Typography>
                <List>
                  {[1, 2, 3].map((item) => (
                    <ListItem
                      key={item}
                      sx={{ 
                        px: 0, 
                        borderBottom: item < 3 ? '1px solid rgba(255,255,255,0.03)' : 'none',
                        py: 1,
                      }}
                    >
                      <ListItemText
                        primary={`Request #${item}0${item}`}
                        secondary={`${item === 1 ? 'Pending' : item === 2 ? 'In Progress' : 'Completed'}`}
                        primaryTypographyProps={{
                          color: '#fff',
                        }}
                        secondaryTypographyProps={{
                          color: item === 1 ? '#F59E0B' : item === 2 ? '#3B82F6' : '#10B981',
                          fontWeight: 600,
                        }}
                      />
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

export default StudentDashboard; 
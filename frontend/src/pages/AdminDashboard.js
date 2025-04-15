import React, { useState, useEffect } from 'react';
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
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Circle as CircleIcon,
} from '@mui/icons-material';
import AdminSidebar from '../components/AdminSidebar';
import NotificationBell from '../components/NotificationBell';
import axios from 'axios';
import { useSocket } from '../context/SocketContext';

const statsData = [
  { title: 'Total Students', count: '2,845', trend: '+12%', isIncrease: true },
  { title: 'Total Staff', count: '147', trend: '+5%', isIncrease: true },
  { title: 'Active Courses', count: '32', trend: '-2%', isIncrease: false },
  { title: 'Success Rate', count: '94%', trend: '+8%', isIncrease: true },
];

const AdminDashboard = () => {
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
          borderBottom: '1px solid rgba(255,255,255,0.03)',
        }}>
          <Box>
            <Typography variant="h4" sx={{ 
              fontWeight: 600, 
              color: '#fff',
              textShadow: '0 2px 4px rgba(0,0,0,0.2)',
            }}>
              Welcome back, {userData.name || 'Admin'}
            </Typography>
            <Typography variant="body2" sx={{ color: '#6B7280', mt: 1 }}>
              Here's what's happening with your dormitory today.
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
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
                    color: stat.isIncrease ? '#10B981' : '#EF4444',
                    bgcolor: stat.isIncrease ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
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
                  Latest Student Check-ins
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
                        primary={`Student ${item}`}
                        secondary={`Checked in at ${new Date().toLocaleTimeString()}`}
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
                        color: '#10B981',
                      }}>
                        <CircleIcon sx={{ fontSize: 10, mr: 0.5 }} />
                        <Typography variant="caption">
                          Active
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
                  Maintenance Requests
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
                        primary={`Maintenance Request #${item}0${item}`}
                        secondary={`${item === 1 ? 'Pending' : item === 2 ? 'In Progress' : 'Completed'}`}
                        primaryTypographyProps={{
                          color: '#fff',
                        }}
                        secondaryTypographyProps={{
                          color: item === 1 ? '#EF4444' : item === 2 ? '#F59E0B' : '#10B981',
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

export default AdminDashboard; 
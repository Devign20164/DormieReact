import React, { useState, useRef, useEffect } from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  Button,
  Avatar,
  Tooltip,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  AssignmentTurnedIn as AssignmentsIcon,
  Person as TenantIcon,
  Settings as SettingsIcon,
  ExitToApp as LogoutIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

const StaffSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [staffType, setStaffType] = useState('');
  const dragStartX = useRef(0);
  const drawerWidth = isCollapsed ? 80 : 280;

  // Get staff type from localStorage
  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    setStaffType(userData.typeOfStaff || '');
  }, []);

  // Filter menu items based on staff type
  const getMenuItems = () => {
    const baseItems = [];
    
    // Dashboard is only for Cleaner and Maintenance roles
    if (staffType === 'Cleaner' || staffType === 'Maintenance') {
      baseItems.push({ text: 'Dashboard', icon: <DashboardIcon />, path: '/staff-dashboard' });
      
      // Assignments for Cleaner and Maintenance
      baseItems.push({ 
        text: 'Assignments', 
        icon: <AssignmentsIcon />, 
        path: '/staff/assignments' 
      });
    } else if (staffType === 'Security') {
      // Security can only see Tenant Log
      baseItems.push({ 
        text: 'Tenant Log', 
        icon: <TenantIcon />, 
        path: '/staff/tenant-log' 
      });
    }

    // Settings for all staff types
    baseItems.push({ 
      text: 'Settings', 
      icon: <SettingsIcon />, 
      path: '/staff/settings' 
    });

    return baseItems;
  };

  const handleMouseDown = (e) => {
    if (Math.abs(e.currentTarget.getBoundingClientRect().right - e.clientX) < 10) {
      setIsDragging(true);
      dragStartX.current = e.clientX;
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      const diff = dragStartX.current - e.clientX;
      if (Math.abs(diff) > 50) {
        setIsCollapsed(diff > 0);
        setIsDragging(false);
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleDoubleClick = (e) => {
    if (Math.abs(e.currentTarget.getBoundingClientRect().right - e.clientX) < 10) {
      setIsCollapsed(!isCollapsed);
    }
  };

  const handleLogout = async () => {
    try {
      // Call logout endpoint
      const response = await fetch('/api/staff/logout', {
        method: 'POST',
        credentials: 'include'
      });
      
      if (response.ok) {
        // Clear all user data from localStorage
        localStorage.removeItem('userData');
        localStorage.removeItem('userRole');
        
        // Add a small delay to ensure all cleanup is done
        setTimeout(() => {
          // Force redirect to login page
          window.location.href = '/login';
        }, 100);
      } else {
        console.error('Logout failed with status:', response.status);
        // Fallback redirect on failure
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Logout failed:', error);
      // Fallback redirect on error
      window.location.href = '/login';
    }
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        position: 'relative',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: 'none',
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          background: 'linear-gradient(180deg, #141414 0%, #0A0A0A 100%)',
          color: '#fff',
          borderRight: '1px solid rgba(255, 255, 255, 0.03)',
          boxShadow: '4px 0 15px rgba(0,0,0,0.3)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: 'none',
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          cursor: isDragging ? 'col-resize' : 'auto',
          '&::after': {
            content: '""',
            position: 'absolute',
            top: 0,
            right: 0,
            width: '10px',
            height: '100%',
            cursor: 'col-resize',
            background: 'transparent',
            transition: 'background 0.2s',
            '&:hover': {
              background: 'rgba(59, 130, 246, 0.1)',
            },
          },
        },
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onDoubleClick={handleDoubleClick}
    >
      <Box sx={{ 
        p: isCollapsed ? 2 : 3, 
        display: 'flex', 
        alignItems: 'center', 
        gap: 2,
        background: 'linear-gradient(180deg, rgba(59, 130, 246, 0.05) 0%, transparent 100%)',
        mb: 2,
        position: 'relative',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}>
        <Box sx={{ position: 'relative' }}>
          <Avatar sx={{ 
            bgcolor: 'transparent',
            width: 40, 
            height: 40,
            background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2)',
          }}>D</Avatar>
          <Box
            sx={{
              position: 'absolute',
              right: -2,
              top: -2,
              width: 12,
              height: 12,
              borderRadius: '50%',
              backgroundColor: '#3B82F6',
              border: '2px solid #0A0A0A',
            }}
          />
        </Box>
        <Box sx={{ 
          opacity: isCollapsed ? 0 : 1,
          transform: isCollapsed ? 'translateX(-20px)' : 'translateX(0)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          visibility: isCollapsed ? 'hidden' : 'visible',
        }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#fff' }}>
            Dormie
          </Typography>
          <Typography variant="caption" sx={{ color: '#6B7280' }}>
            Staff Dashboard
          </Typography>
        </Box>
      </Box>

      <List sx={{ 
        px: isCollapsed ? 1 : 2, 
        mt: 2,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}>
        {getMenuItems().map((item) => (
          <Tooltip 
            key={item.text}
            title={isCollapsed ? item.text : ''}
            placement="right"
          >
            <ListItem
              component="button"
              onClick={() => navigate(item.path)}
              selected={location.pathname === item.path}
              sx={{
                border: 'none',
                outline: 'none',
                width: '100%',
                borderRadius: '12px',
                mb: 1,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                background: location.pathname === item.path 
                  ? 'linear-gradient(90deg, rgba(59, 130, 246, 0.1) 0%, transparent 100%)'
                  : 'transparent',
                px: isCollapsed ? 2 : 3,
                minHeight: 48,
                overflow: 'hidden',
                cursor: 'pointer',
                '&:hover': {
                  background: 'linear-gradient(90deg, rgba(59, 130, 246, 0.1) 0%, transparent 100%)',
                  backdropFilter: 'blur(4px)',
                },
                '&:hover .MuiListItemIcon-root': {
                  color: '#3B82F6',
                  transform: isCollapsed ? 'scale(1.2)' : 'scale(1)',
                },
              }}
            >
              <ListItemIcon sx={{ 
                color: location.pathname === item.path ? '#3B82F6' : '#6B7280',
                minWidth: isCollapsed ? 32 : 40,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: isCollapsed ? 'scale(1.1)' : 'scale(1)',
              }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text} 
                sx={{ 
                  opacity: isCollapsed ? 0 : 1,
                  transform: isCollapsed ? 'translateX(-20px)' : 'translateX(0)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  visibility: isCollapsed ? 'hidden' : 'visible',
                  '& .MuiListItemText-primary': { 
                    fontSize: '0.875rem',
                    color: '#fff',
                  }
                }} 
              />
            </ListItem>
          </Tooltip>
        ))}
      </List>

      <Box sx={{ 
        mt: 'auto', 
        p: isCollapsed ? 1 : 2,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}>
        <Tooltip title={isCollapsed ? "Logout" : ""} placement="right">
          <Button
            onClick={handleLogout}
            fullWidth
            startIcon={<LogoutIcon />}
            sx={{
              color: '#fff',
              background: 'linear-gradient(90deg, rgba(59, 130, 246, 0.1) 0%, transparent 100%)',
              borderRadius: '12px',
              p: 1,
              minWidth: 0,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '& .MuiButton-startIcon': {
                mr: isCollapsed ? 0 : 1,
                transform: isCollapsed ? 'scale(1.2)' : 'scale(1)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              },
              '&:hover': {
                background: 'linear-gradient(90deg, rgba(59, 130, 246, 0.2) 0%, rgba(59, 130, 246, 0.05) 100%)',
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
              },
            }}
          >
            <Box sx={{ 
              opacity: isCollapsed ? 0 : 1,
              transform: isCollapsed ? 'translateX(-20px)' : 'translateX(0)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              visibility: isCollapsed ? 'hidden' : 'visible',
            }}>
              Logout
            </Box>
          </Button>
        </Tooltip>
      </Box>
    </Drawer>
  );
};

export default StaffSidebar;


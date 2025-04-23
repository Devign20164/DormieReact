import React, { useState, useRef } from 'react';
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
  ListItemButton,
  Divider,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  School as SchoolIcon,
  Assessment as AssignmentIcon,
  EventNote as EventIcon,
  Settings as SettingsIcon,
  ExitToApp as LogoutIcon,
  Message as MessageIcon,
  Apartment as BuildingIcon,
  Person as StaffIcon,
  Description as FormsIcon,
  Receipt as BillsIcon,
  History as HistoryIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/admin-dashboard' },
  { text: 'Students', icon: <PeopleIcon />, path: '/admin/students' },
  { text: 'Buildings', icon: <BuildingIcon />, path: '/admin/buildings' },
  { text: 'Staff', icon: <StaffIcon />, path: '/admin/staff' },
  { text: 'Forms', icon: <FormsIcon />, path: '/admin/forms' },
  { text: 'Bills', icon: <BillsIcon />, path: '/admin/bills' },
  { text: 'History', icon: <HistoryIcon />, path: '/admin/history' },
  { text: 'Messages', icon: <MessageIcon />, path: '/admin/messages' },
  { text: 'Reports', icon: <AssignmentIcon />, path: '/reports' },
];

const AdminSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef(0);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const collapsed = isCollapsed || isMobile;
  const drawerWidth = collapsed ? 80 : 280;

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
      const response = await fetch('/api/admin/logout', {
        method: 'POST',
        credentials: 'include'
      });
      
      if (response.ok) {
        navigate('/admin/login');
      }
    } catch (error) {
      console.error('Logout failed:', error);
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
              background: 'rgba(16, 185, 129, 0.1)',
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
        p: collapsed ? 2 : 3, 
        display: 'flex', 
        alignItems: 'center', 
        gap: 2,
        background: 'linear-gradient(180deg, rgba(16, 185, 129, 0.05) 0%, transparent 100%)',
        mb: 2,
        position: 'relative',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}>
        <Box sx={{ position: 'relative' }}>
          <Avatar sx={{ 
            bgcolor: 'transparent',
            width: 40, 
            height: 40,
            background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)',
          }}>D</Avatar>
          <Box
            sx={{
              position: 'absolute',
              right: -2,
              top: -2,
              width: 12,
              height: 12,
              borderRadius: '50%',
              backgroundColor: '#10B981',
              border: '2px solid #0A0A0A',
            }}
          />
        </Box>
        <Box sx={{ 
          opacity: collapsed ? 0 : 1,
          transform: collapsed ? 'translateX(-20px)' : 'translateX(0)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          visibility: collapsed ? 'hidden' : 'visible',
        }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#fff' }}>
            Dormie
          </Typography>
          <Typography variant="caption" sx={{ color: '#6B7280' }}>
            Admin Dashboard
          </Typography>
        </Box>
      </Box>

      <List sx={{ 
        px: collapsed ? 1 : 2, 
        mt: 2,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}>
        {menuItems.map((item) => (
          <Tooltip 
            key={item.text}
            title={collapsed ? item.text : ''}
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
                  ? 'linear-gradient(90deg, rgba(16, 185, 129, 0.1) 0%, transparent 100%)'
                  : 'transparent',
                px: collapsed ? 2 : 3,
                minHeight: 48,
                overflow: 'hidden',
                cursor: 'pointer',
                '&:hover': {
                  background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.1) 0%, transparent 100%)',
                  backdropFilter: 'blur(4px)',
                },
                '&:hover .MuiListItemIcon-root': {
                  color: '#10B981',
                  transform: collapsed ? 'scale(1.2)' : 'scale(1)',
                },
              }}
            >
              <ListItemIcon sx={{ 
                color: location.pathname === item.path ? '#10B981' : '#6B7280',
                minWidth: collapsed ? 32 : 40,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: collapsed ? 'scale(1.1)' : 'scale(1)',
              }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text} 
                sx={{ 
                  opacity: collapsed ? 0 : 1,
                  transform: collapsed ? 'translateX(-20px)' : 'translateX(0)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  visibility: collapsed ? 'hidden' : 'visible',
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
        p: collapsed ? 1 : 2,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}>
        <Tooltip title={collapsed ? "Logout" : ""} placement="right">
          <Button
            onClick={handleLogout}
            fullWidth
            startIcon={<LogoutIcon />}
            sx={{
              color: '#fff',
              background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.1) 0%, transparent 100%)',
              borderRadius: '12px',
              p: 1,
              minWidth: 0,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '& .MuiButton-startIcon': {
                mr: collapsed ? 0 : 1,
                transform: collapsed ? 'scale(1.2)' : 'scale(1)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              },
              '&:hover': {
                background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.2) 0%, rgba(16, 185, 129, 0.05) 100%)',
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
              },
            }}
          >
            <Box sx={{ 
              opacity: collapsed ? 0 : 1,
              transform: collapsed ? 'translateX(-20px)' : 'translateX(0)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              visibility: collapsed ? 'hidden' : 'visible',
            }}>
              Logout
            </Box>
          </Button>
        </Tooltip>
      </Box>
    </Drawer>
  );
};

export default AdminSidebar; 
import React, { useState, useRef, useContext } from 'react';
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
  Announcement as NewsIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { ThemeContext } from '../App';

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/admin-dashboard' },
  { text: 'Students', icon: <PeopleIcon />, path: '/admin/students' },
  { text: 'Buildings', icon: <BuildingIcon />, path: '/admin/buildings' },
  { text: 'Staff', icon: <StaffIcon />, path: '/admin/staff' },
  { text: 'Forms', icon: <FormsIcon />, path: '/admin/forms' },
  { text: 'Bills', icon: <BillsIcon />, path: '/admin/bills' },
  { text: 'History', icon: <HistoryIcon />, path: '/admin/history' },
  { text: 'News', icon: <NewsIcon />, path: '/admin/news' },
  { text: 'Messages', icon: <MessageIcon />, path: '/admin/messages' },
  { text: 'Reports', icon: <AssignmentIcon />, path: '/admin/reports' },
  { text: 'Settings', icon: <SettingsIcon />, path: '/admin/settings' },
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
  const { mode } = useContext(ThemeContext);

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
          background: mode === 'dark' 
            ? 'linear-gradient(180deg, #141414 0%, #0A0A0A 100%)' 
            : 'linear-gradient(180deg, #ffffff 0%, #f0f0f0 100%)',
          color: mode === 'dark' ? '#fff' : '#333',
          borderRight: `1px solid ${mode === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.06)'}`,
          boxShadow: mode === 'dark' ? '4px 0 15px rgba(0,0,0,0.3)' : '4px 0 15px rgba(0,0,0,0.1)',
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
        background: mode === 'dark'
          ? 'linear-gradient(180deg, rgba(16, 185, 129, 0.05) 0%, transparent 100%)'
          : 'linear-gradient(180deg, rgba(16, 185, 129, 0.1) 0%, transparent 100%)',
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
              border: mode === 'dark' ? '2px solid #0A0A0A' : '2px solid #ffffff',
            }}
          />
        </Box>
        <Box sx={{ 
          opacity: collapsed ? 0 : 1,
          transform: collapsed ? 'translateX(-20px)' : 'translateX(0)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          visibility: collapsed ? 'hidden' : 'visible',
        }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: mode === 'dark' ? '#fff' : '#333' }}>
            Dormie
          </Typography>
          <Typography variant="caption" sx={{ color: mode === 'dark' ? '#6B7280' : '#757575' }}>
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
                color: location.pathname === item.path ? '#10B981' : mode === 'dark' ? '#6B7280' : '#757575',
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
                    color: mode === 'dark' ? '#fff' : '#333',
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
        display: 'flex',
        flexDirection: 'column',
        gap: 1
      }}>
        <Divider sx={{ borderColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)', mb: 2 }} />
        
        <Button
          onClick={handleLogout}
          startIcon={<LogoutIcon />}
          sx={{
            justifyContent: collapsed ? 'center' : 'flex-start',
            color: mode === 'dark' ? '#6B7280' : '#757575',
            textTransform: 'none',
            p: 1.5,
            borderRadius: '12px',
            '&:hover': {
              background: mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
            },
          }}
        >
          {!collapsed && 'Logout'}
        </Button>
      </Box>
    </Drawer>
  );
};

export default AdminSidebar; 
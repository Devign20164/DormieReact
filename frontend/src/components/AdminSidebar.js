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
  IconButton,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  School as SchoolIcon,
  Assessment as AssignmentIcon,
  Settings as SettingsIcon,
  ExitToApp as LogoutIcon,
  Message as MessageIcon,
  Apartment as BuildingIcon,
  Person as StaffIcon,
  Description as FormsIcon,
  Receipt as BillsIcon,
  History as HistoryIcon,
  Announcement as NewsIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { ThemeContext } from '../App';

// Color constants matching AdminStudent.js
const GREEN_MAIN = "#10B981";
const GREEN_DARK = "#059669";
const GREEN_DARKER = "#047857";
const FOREST_GREEN = "#1D503A";
const BG_DARK = "#141414";
const BG_DARKER = "#0A0A0A";
const BG_LIGHT = "#FAF5EE";

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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const collapsed = isCollapsed || isMobile;
  const drawerWidth = collapsed ? 80 : 260;
  const { mode } = useContext(ThemeContext);

  // Background colors based on mode
  const bgColor = mode === 'dark' 
    ? 'linear-gradient(145deg, #0A0A0A 0%, #141414 100%)'
    : BG_LIGHT;
  const textColor = mode === 'dark' ? '#fff' : '#000';
  const textSecondary = mode === 'dark' ? '#6B7280' : FOREST_GREEN;

  const handleToggleCollapse = () => {
      setIsCollapsed(!isCollapsed);
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
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          background: bgColor,
          color: textColor,
          borderRight: mode === 'dark' 
            ? '1px solid rgba(255, 255, 255, 0.03)'
            : `1px solid ${FOREST_GREEN}`,
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
          transition: 'all 0.3s ease',
          overflow: 'hidden',
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
            zIndex: 0,
          },
        },
      }}
    >
      {/* Header with Logo */}
      <Box sx={{ 
        p: 2.5,
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        borderBottom: mode === 'dark' 
          ? '1px solid rgba(255,255,255,0.03)'
          : `1px solid ${FOREST_GREEN}`,
        position: 'relative',
        zIndex: 1,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar 
            sx={{ 
            bgcolor: 'transparent',
              width: 38, 
              height: 38,
              background: `linear-gradient(135deg, ${GREEN_MAIN} 0%, ${GREEN_DARK} 100%)`,
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)',
              color: '#fff',
              fontWeight: 'bold',
            }}
          >
            D
          </Avatar>
          {!collapsed && (
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 600, 
                fontSize: '1.2rem',
                color: mode === 'dark' ? '#fff' : '#000',
                textShadow: mode === 'dark' ? '0 2px 4px rgba(0,0,0,0.2)' : 'none',
            }}
            >
              Dormie
            </Typography>
          )}
        </Box>

        <IconButton 
          onClick={handleToggleCollapse} 
          sx={{ 
            color: GREEN_MAIN,
            backgroundColor: mode === 'dark' 
              ? 'rgba(16, 185, 129, 0.1)'
              : 'rgba(16, 185, 129, 0.1)',
            borderRadius: '8px',
            p: '6px',
            transition: 'all 0.3s ease',
            '&:hover': {
              backgroundColor: mode === 'dark' 
                ? 'rgba(16, 185, 129, 0.2)'
                : 'rgba(16, 185, 129, 0.2)',
              transform: 'translateY(-1px)',
            }
          }}
        >
          {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
        </IconButton>
      </Box>

      {/* Admin Info - Only shown when not collapsed */}
      {!collapsed && (
        <Box 
          sx={{ 
            p: 2, 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            background: mode === 'dark'
              ? 'linear-gradient(90deg, rgba(16, 185, 129, 0.1) 0%, transparent 100%)'
              : 'linear-gradient(90deg, rgba(29, 80, 58, 0.1) 0%, transparent 100%)',
            mb: 2,
            position: 'relative',
            zIndex: 1,
          }}
        >
          <Typography 
            variant="body1" 
            sx={{ 
              fontWeight: 600, 
              color: textColor,
            }}
          >
            Admin User
          </Typography>
          <Typography 
            variant="caption" 
            sx={{ 
              color: textSecondary,
              opacity: 0.8 
            }}
          >
            System Administrator
          </Typography>
        </Box>
      )}

      {/* Navigation Menu */}
      <Box 
        sx={{ 
          py: 1, 
          overflowY: 'auto',
          overflowX: 'hidden',
          height: '100%',
          position: 'relative',
          zIndex: 1,
          '&::-webkit-scrollbar': {
            width: '4px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            background: GREEN_MAIN,
            borderRadius: '10px',
          },
        }}
      >
        <List 
          sx={{ 
        px: collapsed ? 1 : 2, 
          }}
        >
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <ListItem
                key={item.text}
                disablePadding
                sx={{ 
                  mb: 0.7, 
                  display: 'block',
                }}
              >
          <Tooltip 
            title={collapsed ? item.text : ''}
            placement="right"
                  arrow
          >
                  <ListItemButton
              onClick={() => navigate(item.path)}
              sx={{
                      minHeight: 44,
                      px: collapsed ? 2.5 : 3,
                      py: 1,
                      borderRadius: '10px',
                      backgroundColor: isActive 
                        ? mode === 'dark'
                          ? 'rgba(16, 185, 129, 0.1)'
                          : 'rgba(29, 80, 58, 0.1)'
                  : 'transparent',
                '&:hover': {
                  background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.1) 0%, transparent 100%)',
                  backdropFilter: 'blur(4px)',
                },
                '&:hover .MuiListItemIcon-root': {
                        color: GREEN_MAIN,
                        transform: collapsed ? 'scale(1.1)' : 'scale(1)',
                },
                      transition: 'all 0.3s ease',
              }}
            >
                    <ListItemIcon
                      sx={{
                        minWidth: 0,
                        mr: collapsed ? 0 : 2,
                        justifyContent: 'center',
                        color: isActive ? GREEN_MAIN : textSecondary,
                        transition: 'all 0.3s ease',
                      }}
                    >
                {item.icon}
              </ListItemIcon>
                    
                    {!collapsed && (
              <ListItemText 
                primary={item.text} 
                        primaryTypographyProps={{
                          fontSize: '0.9rem',
                          fontWeight: isActive ? 600 : 500,
                          color: isActive ? GREEN_MAIN : textColor,
                          whiteSpace: 'nowrap',
                          textOverflow: 'ellipsis',
                          overflow: 'hidden',
                        }}
                      />
                    )}
                  </ListItemButton>
                </Tooltip>
            </ListItem>
            );
          })}
      </List>
        </Box>
        
      {/* Logout Button */}
      <Box 
        sx={{ 
          mt: 'auto', 
          p: 2, 
          borderTop: mode === 'dark' 
            ? '1px solid rgba(255,255,255,0.05)'
            : `1px solid rgba(29, 80, 58, 0.2)`,
          position: 'relative',
          zIndex: 1,
        }}
      >
          <Button
          variant="contained"
          fullWidth
          startIcon={!collapsed && <LogoutIcon />}
            onClick={handleLogout}
            sx={{
            justifyContent: collapsed ? 'center' : 'flex-start',
            background: 'linear-gradient(90deg, #10B981 0%, #059669 100%)',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)',
            color: '#fff',
            textTransform: 'none',
            borderRadius: '8px',
            p: collapsed ? 1 : '8px 16px',
            transition: 'all 0.3s ease',
              '&:hover': {
              transform: 'translateY(-1px)',
              boxShadow: '0 6px 15px rgba(16, 185, 129, 0.3)',
              background: 'linear-gradient(90deg, #059669 0%, #047857 100%)',
              },
            }}
          >
          {collapsed ? <LogoutIcon /> : 'Logout'}
          </Button>
      </Box>
    </Drawer>
  );
};

export default AdminSidebar; 
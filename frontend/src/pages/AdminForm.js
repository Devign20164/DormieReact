import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  Stack,
  Grid,
  IconButton,
  CircularProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Divider,
  MenuItem,
  Select,
  FormControl,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  Avatar,
  Collapse,
  Tab,
  Tabs,
  Paper,
  Pagination,
  Tooltip,
  ButtonGroup,
  Menu,
  Drawer,
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  PlayArrow as PlayArrowIcon,
  Done as DoneIcon,
  LocationOn as LocationIcon,
  AccessTime as AccessTimeIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  CalendarMonth as CalendarMonthIcon,
  ListAlt as ListAltIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  ViewDay as ViewDayIcon,
  ViewWeek as ViewWeekIcon,
  CalendarViewMonth as ViewMonthIcon,
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  AccountCircle as AccountCircleIcon,
  Warning as WarningIcon,
  Block as BlockIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
} from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import AdminSidebar from '../components/AdminSidebar';
import NotificationBell from '../components/NotificationBell';
import axios from 'axios';
import { 
  format, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  startOfMonth, 
  endOfMonth, 
  isSameDay, 
  isToday, 
  addMonths, 
  subMonths, 
  getMonth, 
  getYear,
  addDays 
} from 'date-fns';
import { toast } from 'react-toastify';

// Status configurations
const statusConfig = {
  Submitted: { color: '#3B82F6', icon: <AssignmentIcon />, bgGradient: 'linear-gradient(145deg, #1E40AF 0%, #3B82F6 100%)' },
  Approved: { color: '#10B981', icon: <CheckCircleIcon />, bgGradient: 'linear-gradient(145deg, #047857 0%, #10B981 100%)' },
  Rejected: { color: '#EF4444', icon: <CancelIcon />, bgGradient: 'linear-gradient(145deg, #B91C1C 0%, #EF4444 100%)' },
  Rescheduled: { color: '#F59E0B', icon: <ScheduleIcon />, bgGradient: 'linear-gradient(145deg, #B45309 0%, #F59E0B 100%)' },
  Assigned: { color: '#8B5CF6', icon: <PersonIcon />, bgGradient: 'linear-gradient(145deg, #6D28D9 0%, #8B5CF6 100%)' },
  'In Progress': { color: '#EC4899', icon: <PlayArrowIcon />, bgGradient: 'linear-gradient(145deg, #BE185D 0%, #EC4899 100%)' },
  Completed: { color: '#14B8A6', icon: <DoneIcon />, bgGradient: 'linear-gradient(145deg, #0F766E 0%, #14B8A6 100%)' },
};

const STAFF_MEMBERS = [
  { id: 1, name: 'John Smith', role: 'Senior Maintenance', status: 'available', workload: 'low' },
  { id: 2, name: 'Sarah Johnson', role: 'Plumbing Specialist', status: 'busy', workload: 'high' },
  { id: 3, name: 'Mike Brown', role: 'Electrician', status: 'away', workload: 'medium' },
  { id: 4, name: 'Lisa Davis', role: 'HVAC Technician', status: 'available', workload: 'low' },
  { id: 5, name: 'James Wilson', role: 'General Maintenance', status: 'available', workload: 'medium' },
];

const MOCK_ASSIGNMENTS = [
  { 
    id: 1, 
    staffId: 1, 
    formId: 'F123', 
    date: '2024-03-20', 
    time: '09:00-11:00',
    type: 'Plumbing',
    priority: 'high',
    status: 'in-progress',
    location: 'Block A, Room 101',
  },
  { 
    id: 2, 
    staffId: 2, 
    formId: 'F124', 
    date: '2024-03-20', 
    time: '14:00-16:00',
    type: 'Electrical',
    priority: 'medium',
    status: 'pending',
    location: 'Block B, Room 203',
  },
  // Add more mock assignments as needed
];

const AdminForm = () => {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedForm, setSelectedForm] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [expandedStatus, setExpandedStatus] = useState({});
  const [view, setView] = useState('list');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [page, setPage] = useState(1);
  const formsPerPage = 6;
  const [calendarView, setCalendarView] = useState('week');
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);

  useEffect(() => {
    const fetchForms = async () => {
      try {
        const response = await axios.get('/api/admin/forms');
        setForms(response.data.forms);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch forms');
        setLoading(false);
      }
    };
    fetchForms();
  }, []);

  // Reset page when status filter changes
  useEffect(() => {
    setPage(1);
  }, [selectedStatus]);

  const filteredForms = forms.filter(form => 
    selectedStatus === 'All' || form.status === selectedStatus
  );

  const handleStatusChange = async (formId, newStatus) => {
    try {
      setStatusLoading(true);
      await axios.put(`/api/admin/forms/${formId}/status`, { status: newStatus });
      setForms(forms.map(form => form._id === formId ? { ...form, status: newStatus } : form));
      toast.success(`Form status updated to ${newStatus}`);
      setStatusLoading(false);
    } catch (err) {
      toast.error('Failed to update form status');
      setStatusLoading(false);
    }
  };

  const handleOpenDialog = (form) => {
    setSelectedForm(form);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedForm(null);
  };

  const handleExpandStatus = (status) => {
    setExpandedStatus(prev => ({
      ...prev,
      [status]: !prev[status]
    }));
  };

  const groupFormsByStatus = () => {
    return forms.reduce((acc, form) => {
      if (!acc[form.status]) {
        acc[form.status] = [];
      }
      acc[form.status].push(form);
      return acc;
    }, {});
  };

  const getAssignedFormsForDate = (date) => {
    return forms.filter(form => 
      form.status === 'Assigned' && 
      format(new Date(form.createdAt), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    );
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'available': return '#10B981';
      case 'busy': return '#EF4444';
      case 'away': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const getWorkloadColor = (workload) => {
    switch(workload) {
      case 'low': return '#10B981';
      case 'medium': return '#F59E0B';
      case 'high': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const renderStatusCards = () => (
    <Box sx={{ 
      maxWidth: '1200px', 
      mx: 'auto', 
      width: '100%', 
      mb: 4,
    }}>
      <Grid container spacing={1}>
        {Object.entries(statusConfig).map(([status, config]) => {
          const count = forms.filter(form => form.status === status).length;
          return (
            <Grid item xs={12/7} key={status}>
              <Card
                onClick={() => setSelectedStatus(status)}
                sx={{
                  background: 'linear-gradient(145deg, #141414 0%, #0A0A0A 100%)',
                  borderRadius: '12px',
                  p: 1.5,
                  border: `1px solid ${selectedStatus === status ? config.color : 'rgba(255,255,255,0.03)'}`,
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  minWidth: 0,
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: `0 8px 25px ${config.color}20`,
                  },
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <Avatar
                    sx={{
                      bgcolor: `${config.color}20`,
                      color: config.color,
                      width: 36,
                      height: 36,
                      flexShrink: 0,
                    }}
                  >
                    {React.cloneElement(config.icon, { sx: { fontSize: 20 } })}
                  </Avatar>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="h6" sx={{ 
                      fontWeight: 600, 
                      color: config.color,
                      fontSize: '1.1rem',
                      lineHeight: 1.2,
                      mb: 0.25
                    }}>
                      {count}
                    </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: '#6B7280', 
                        fontSize: '0.75rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {status}
                    </Typography>
                  </Box>
                </Stack>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );

  const renderFormList = () => {
    const startIndex = (page - 1) * formsPerPage;
    const endIndex = startIndex + formsPerPage;
    const paginatedForms = filteredForms.slice(startIndex, endIndex);
    const totalPages = Math.ceil(filteredForms.length / formsPerPage);

    return (
      <Box sx={{ 
        maxWidth: '1200px', 
        mx: 'auto', 
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        <Grid container spacing={2}>
          {paginatedForms.map((form) => (
            <Grid item xs={12} sm={6} md={4} key={form._id}>
              <Card
                onClick={() => handleOpenDialog(form)}
                sx={{
                  background: 'linear-gradient(145deg, #141414 0%, #0A0A0A 100%)',
                  borderRadius: '12px',
                  p: 2,
                  height: '100%',
                  cursor: 'pointer',
                  border: '1px solid rgba(255,255,255,0.03)',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 25px rgba(0,0,0,0.2)',
                    '&::after': {
                      opacity: 0.1,
                    }
                  },
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: statusConfig[form.status].bgGradient,
                    opacity: 0.05,
                    transition: 'opacity 0.3s ease',
                  }
                }}
              >
                {/* Header with Status and Date */}
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'flex-start',
                  mb: 1.5
                }}>
                  <Chip
                    label={form.status}
                    icon={statusConfig[form.status].icon}
                    size="small"
                    sx={{
                      bgcolor: `${statusConfig[form.status].color}20`,
                      color: statusConfig[form.status].color,
                      '& .MuiChip-icon': { 
                        color: 'inherit',
                        fontSize: '16px'
                      },
                      height: '24px',
                      '& .MuiChip-label': {
                        px: 1,
                        fontSize: '0.75rem'
                      }
                    }}
                  />
                  <Typography variant="caption" sx={{ color: '#6B7280', fontSize: '0.75rem' }}>
                    {format(new Date(form.createdAt), 'MMM d, yyyy')}
                  </Typography>
                </Box>

                {/* Form Type */}
                <Typography variant="subtitle1" sx={{ mb: 1, color: '#fff', fontSize: '0.9rem' }}>
                  {form.formType}
                </Typography>

                {/* Location */}
                <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <LocationIcon sx={{ color: '#6B7280', fontSize: 16 }} />
                  <Typography variant="body2" sx={{ color: '#9CA3AF', fontSize: '0.8rem' }}>
                    {form.location?.buildingName}, Room {form.location?.roomNumber}
                  </Typography>
                </Box>

                {/* Description */}
                <Typography
                  variant="body2"
                  sx={{
                    color: '#6B7280',
                    mb: 1.5,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    fontSize: '0.8rem',
                    lineHeight: 1.4
                  }}
                >
                  {form.description}
                </Typography>

                {/* Timing if available */}
                {form.preferredTiming && (
                  <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <AccessTimeIcon sx={{ color: '#6B7280', fontSize: 16 }} />
                    <Typography variant="body2" sx={{ color: '#9CA3AF', fontSize: '0.8rem' }}>
                      {form.preferredTiming.startTime} - {form.preferredTiming.endTime}
                    </Typography>
                  </Box>
                )}

                <Divider sx={{ borderColor: 'rgba(255,255,255,0.03)', my: 1.5 }} />

                {/* Student Info */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Avatar sx={{ 
                    bgcolor: '#374151',
                    border: '2px solid rgba(255,255,255,0.1)',
                    width: 28,
                    height: 28,
                    fontSize: '0.8rem'
                  }}>
                    {form.studentInfo?.name?.charAt(0) || 'S'}
                  </Avatar>
                  <Box>
                    <Typography variant="body2" sx={{ color: '#fff', fontSize: '0.8rem' }}>
                      {form.studentInfo?.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#6B7280', fontSize: '0.75rem' }}>
                      ID: {form.studentInfo?.studentId}
                    </Typography>
                  </Box>
                </Box>

                {/* Quick Action Buttons */}
                <Stack 
                  direction="row" 
                  spacing={1} 
                  sx={{ 
                    mt: 1.5,
                    pt: 1.5,
                    borderTop: '1px solid rgba(255,255,255,0.03)',
                  }}
                >
                  {form.status === 'Submitted' && (
                    <>
                      <Button
                        size="small"
                        variant="contained"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStatusChange(form._id, 'Approved');
                        }}
                        sx={{
                          bgcolor: '#10B981',
                          '&:hover': { bgcolor: '#059669' },
                          fontSize: '0.75rem',
                          py: 0.5
                        }}
                      >
                        Approve
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStatusChange(form._id, 'Rejected');
                        }}
                        sx={{
                          bgcolor: '#EF4444',
                          '&:hover': { bgcolor: '#DC2626' },
                          fontSize: '0.75rem',
                          py: 0.5
                        }}
                      >
                        Reject
                      </Button>
                    </>
                  )}
                  {form.status === 'Approved' && !form.assignedTo && (
                    <Button
                      size="small"
                      variant="contained"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStatusChange(form._id, 'Assigned');
                      }}
                      sx={{
                        bgcolor: '#8B5CF6',
                        '&:hover': { bgcolor: '#7C3AED' },
                        fontSize: '0.75rem',
                        py: 0.5
                      }}
                    >
                      Assign
                    </Button>
                  )}
                </Stack>
              </Card>
            </Grid>
          ))}
        </Grid>
        
        {paginatedForms.length === 0 ? (
          <Box sx={{ 
            textAlign: 'center', 
            mt: 4, 
            p: 3, 
            borderRadius: 2,
            bgcolor: 'rgba(255,255,255,0.03)',
            width: '100%',
            maxWidth: '600px'
          }}>
            <Typography variant="h6" sx={{ color: '#6B7280', mb: 1 }}>
              No forms found
            </Typography>
            <Typography variant="body2" sx={{ color: '#4B5563' }}>
              {selectedStatus === 'All' 
                ? 'There are no forms in the system yet'
                : `No forms with status "${selectedStatus}" found`
              }
            </Typography>
          </Box>
        ) : (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              width: '100%',
              mt: 4,
              mb: 2,
            }}
          >
            <Pagination
              count={totalPages}
              page={page}
              onChange={(event, value) => setPage(value)}
              color="primary"
              size="large"
              sx={{
                '& .MuiPaginationItem-root': {
                  color: '#6B7280',
                  borderColor: 'rgba(255,255,255,0.1)',
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.05)',
                  },
                  '&.Mui-selected': {
                    bgcolor: '#10B981',
                    color: '#fff',
                    '&:hover': {
                      bgcolor: '#059669',
                    },
                  },
                },
              }}
            />
          </Box>
        )}
      </Box>
    );
  };

  const renderCalendarView = () => {
    const handlePrevWeek = () => {
      setSelectedDate(prevDate => addDays(prevDate, -7));
    };

    const handleNextWeek = () => {
      setSelectedDate(prevDate => addDays(prevDate, 7));
    };

    const hours = [0, ...Array.from({ length: 23 }, (_, i) => i + 1)]; // blank + 1 AM to 11 PM

    return (
      <Box sx={{ width: '100%' }}>
        {/* Calendar Header */}
        <Box sx={{ 
          mb: 3, 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          bgcolor: 'transparent',
          borderRadius: 2,
          p: 2
        }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1,
            bgcolor: 'transparent',
            borderRadius: 1,
            p: 0.5
          }}>
            <IconButton 
              onClick={handlePrevWeek}
              sx={{ 
                color: '#fff',
                '&:hover': { 
                  bgcolor: 'rgba(255, 255, 255, 0.1)',
                }
              }}
            >
              <ChevronLeftIcon />
            </IconButton>
            <Typography 
              variant="subtitle1" 
              sx={{ 
                color: '#fff',
                px: 2,
                minWidth: 200,
                textAlign: 'center'
              }}
            >
              {format(startOfWeek(selectedDate), 'MMM d')} - {format(addDays(startOfWeek(selectedDate), 6), 'MMM d, yyyy')}
            </Typography>
            <IconButton 
              onClick={handleNextWeek}
              sx={{ 
                color: '#fff',
                '&:hover': { 
                  bgcolor: 'rgba(255, 255, 255, 0.1)',
                }
              }}
            >
              <ChevronRightIcon />
            </IconButton>
          </Box>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setAssignmentDialogOpen(true)}
            sx={{
              bgcolor: '#404040',
              '&:hover': { bgcolor: '#525252' }
            }}
          >
            Assign Form
          </Button>
        </Box>

        {/* Calendar Grid */}
        <Box sx={{ 
          display: 'grid',
          gridTemplateColumns: '60px repeat(7, 1fr)',
          gap: 1,
          bgcolor: 'rgba(255,255,255,0.03)',
          borderRadius: 2,
          p: 2,
          maxHeight: 'calc(100vh - 240px)',
          overflowY: 'auto',
          scrollBehavior: 'smooth',
          '&::-webkit-scrollbar': {
            width: '12px',
            backgroundColor: 'rgba(0,0,0,0.2)',
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: 'rgba(0,0,0,0.1)',
            borderRadius: '6px',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'rgba(64, 64, 64, 0.4)',
            borderRadius: '6px',
            border: '2px solid rgba(0,0,0,0.2)',
            '&:hover': {
              backgroundColor: 'rgba(64, 64, 64, 0.6)',
            }
          },
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(64, 64, 64, 0.4) rgba(0,0,0,0.2)'
        }}>
          {/* Time Column Header */}
          <Box sx={{ 
            p: 1,
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            position: 'sticky',
            top: 0,
            bgcolor: '#262626',
            zIndex: 2,
            textAlign: 'center'
          }}>
            <Typography variant="body2" sx={{ color: '#fff' }}>
              GMT +08
            </Typography>
          </Box>

          {/* Date Headers */}
          {Array.from({ length: 7 }, (_, i) => {
            const date = addDays(startOfWeek(selectedDate), i);
            return (
              <Box 
                key={i}
                sx={{ 
                  p: 1,
                  textAlign: 'center',
                  borderBottom: '1px solid rgba(255,255,255,0.1)',
                  position: 'sticky',
                  top: 0,
                  bgcolor: '#262626',
                  zIndex: 1
                }}
              >
                <Typography variant="body2" sx={{ color: '#fff' }}>
                  {format(date, 'EEE')}
                </Typography>
                <Typography variant="h6" sx={{ 
                  color: isToday(date) ? '#fff' : '#fff',
                  fontWeight: isToday(date) ? 600 : 400,
                }}>
                  {format(date, 'd')}
                </Typography>
              </Box>
            );
          })}

          {/* Time Labels Column */}
          <Box sx={{ position: 'relative', height: '1440px' }}> {/* 24 hours * 60px */}
            {hours.map((hour) => (
              <Typography
                key={hour}
                variant="caption"
                sx={{
                  position: 'absolute',
                  top: `${hour * 60}px`,
                  right: '8px',
                  color: '#6B7280',
                  transform: 'translateY(-50%)',
                  fontSize: '0.75rem'
                }}
              >
                {hour === 0 ? '' : `${hour % 12 === 0 ? '12' : hour % 12}${hour < 12 ? 'AM' : 'PM'}`}
              </Typography>
            ))}
          </Box>

          {/* Day Columns */}
          {Array.from({ length: 7 }, (_, dayIndex) => {
            const date = format(addDays(startOfWeek(selectedDate), dayIndex), 'yyyy-MM-dd');
            const assignments = MOCK_ASSIGNMENTS.filter(a => a.date === date);

            return (
              <Box 
                key={dayIndex}
                sx={{ 
                  position: 'relative',
                  height: '1380px',
                  borderRight: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                {/* Hour Lines */}
                {hours.map((hour) => (
                  <Box
                    key={hour}
                    sx={{
                      position: 'absolute',
                      top: `${(hour - 1) * 60}px`,
                      left: 0,
                      right: 0,
                      height: '1px',
                      bgcolor: 'rgba(255,255,255,0.05)',
                    }}
                  />
                ))}

                {/* Assignments */}
                {assignments.map((assignment) => {
                  const [startTime] = assignment.time.split('-');
                  const [hours, minutes] = startTime.split(':').map(Number);
                  const topPosition = (hours - 1) * 60 + (minutes || 0);

                  return (
                    <Card
                      key={assignment.id}
                      sx={{
                        position: 'absolute',
                        top: `${topPosition}px`,
                        left: '4px',
                        right: '4px',
                        p: 1.5,
                        bgcolor: `${statusConfig[assignment.status]?.color}15`,
                        border: `1px solid ${statusConfig[assignment.status]?.color}30`,
                        cursor: 'pointer',
                        zIndex: 1,
                        '&:hover': {
                          bgcolor: `${statusConfig[assignment.status]?.color}25`,
                        }
                      }}
                    >
                      <Typography variant="caption" sx={{ 
                        color: statusConfig[assignment.status]?.color,
                        display: 'block',
                        mb: 0.5
                      }}>
                        {assignment.time}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#fff', mb: 0.5 }}>
                        {assignment.type}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#6B7280', display: 'block' }}>
                        {assignment.location}
                      </Typography>
                      <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar 
                          sx={{ 
                            width: 24, 
                            height: 24, 
                            fontSize: '0.75rem',
                            bgcolor: 'rgba(255,255,255,0.1)'
                          }}
                        >
                          {STAFF_MEMBERS.find(s => s.id === assignment.staffId)?.name.charAt(0)}
                        </Avatar>
                        <Typography variant="caption" sx={{ color: '#9CA3AF' }}>
                          {STAFF_MEMBERS.find(s => s.id === assignment.staffId)?.name}
                        </Typography>
                      </Box>
                    </Card>
                  );
                })}
              </Box>
            );
          })}
        </Box>
      </Box>
    );
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      minHeight: '100vh',
      background: 'linear-gradient(145deg, #0A0A0A 0%, #141414 100%)',
      color: '#fff',
    }}>
      <AdminSidebar />
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          p: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
      >
        {/* Header */}
        <Box sx={{ 
          width: '100%',
          maxWidth: '1200px',
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start', 
          mb: 4 
        }}>
          <Box>
            <Typography variant="h4" sx={{ 
              fontWeight: 600,
              background: 'linear-gradient(90deg, #10B981, #3B82F6)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 2px 4px rgba(0,0,0,0.2)',
              mb: 1
            }}>
              Maintenance Requests
            </Typography>
            <Typography variant="body1" sx={{ color: '#6B7280' }}>
              Track and manage maintenance requests across all dormitories
            </Typography>
          </Box>
          <Stack direction="row" spacing={2} alignItems="center">
            <Tabs
              value={view}
              onChange={(e, newValue) => setView(newValue)}
              sx={{
                '& .MuiTab-root': {
                  color: '#6B7280',
                  minHeight: 'unset',
                  py: 1,
                  '&.Mui-selected': {
                    color: '#fff',
                  },
                },
                '& .MuiTabs-indicator': {
                  backgroundColor: '#10B981',
                },
              }}
            >
              <Tab 
                icon={<ListAltIcon />} 
                label="List View" 
                value="list"
              />
              <Tab 
                icon={<CalendarMonthIcon />} 
                label="Calendar" 
                value="calendar"
              />
            </Tabs>
            <NotificationBell userType="admin" color="#10B981" />
          </Stack>
        </Box>

        {/* Content */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress sx={{ color: '#10B981' }} />
          </Box>
        ) : view === 'list' ? (
          <>
            {renderStatusCards()}
            {renderFormList()}
          </>
        ) : (
          renderCalendarView()
        )}

        {/* Form Details Dialog */}
        <Dialog
          open={openDialog}
          onClose={handleCloseDialog}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              background: 'linear-gradient(145deg, #141414 0%, #0A0A0A 100%)',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.03)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
              color: '#fff',
            }
          }}
        >
          {selectedForm && (
            <>
              <DialogTitle sx={{ 
                borderBottom: '1px solid rgba(255,255,255,0.03)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                p: 3,
              }}>
                <Typography variant="h6">Request Details</Typography>
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <Select
                    value={selectedForm.status}
                    onChange={(e) => handleStatusChange(selectedForm._id, e.target.value)}
                    sx={{
                      color: '#fff',
                      '.MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255,255,255,0.1)',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(16, 185, 129, 0.5)',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#10B981',
                      },
                    }}
                  >
                    {Object.keys(statusConfig).map((status) => (
                      <MenuItem key={status} value={status}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {React.cloneElement(statusConfig[status].icon, { sx: { fontSize: 20 } })}
                          {status}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </DialogTitle>
              <DialogContent sx={{ p: 3 }}>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Typography variant="h5" sx={{ mb: 2, color: '#fff' }}>
                      {selectedForm.formType}
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#9CA3AF', mb: 3 }}>
                      {selectedForm.description}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle2" sx={{ color: '#6B7280', mb: 1 }}>
                        Student Information
                      </Typography>
                      <Typography variant="body1" sx={{ color: '#fff' }}>
                        {selectedForm.studentInfo?.name}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#9CA3AF' }}>
                        Student ID: {selectedForm.studentInfo?.studentId}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle2" sx={{ color: '#6B7280', mb: 1 }}>
                        Location Details
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#9CA3AF' }}>
                        Building: {selectedForm.location?.buildingName}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#9CA3AF' }}>
                        Room: {selectedForm.location?.roomNumber}
                      </Typography>
                    </Box>
                  </Grid>
                  {selectedForm.preferredTiming && (
                    <Grid item xs={12}>
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle2" sx={{ color: '#6B7280', mb: 1 }}>
                          Preferred Timing
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <AccessTimeIcon sx={{ color: '#6B7280' }} />
                          <Typography variant="body2" sx={{ color: '#9CA3AF' }}>
                            {selectedForm.preferredTiming.startTime} - {selectedForm.preferredTiming.endTime}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                  )}
                </Grid>
              </DialogContent>
              <DialogActions sx={{ p: 3, borderTop: '1px solid rgba(255,255,255,0.03)' }}>
                <Button 
                  onClick={handleCloseDialog}
                  sx={{ 
                    color: '#9CA3AF',
                    '&:hover': { color: '#fff' }
                  }}
                >
                  Close
                </Button>
                <Button
                  variant="contained"
                  onClick={() => handleStatusChange(selectedForm._id, 'Approved')}
                  disabled={statusLoading || selectedForm.status === 'Approved'}
                  sx={{
                    bgcolor: '#10B981',
                    '&:hover': { bgcolor: '#059669' }
                  }}
                >
                  Approve
                </Button>
                <Button
                  variant="contained"
                  onClick={() => handleStatusChange(selectedForm._id, 'Rejected')}
                  disabled={statusLoading || selectedForm.status === 'Rejected'}
                  sx={{
                    bgcolor: '#EF4444',
                    '&:hover': { bgcolor: '#DC2626' }
                  }}
                >
                  Reject
                </Button>
              </DialogActions>
            </>
          )}
        </Dialog>
      </Box>
    </Box>
  );
};

export default AdminForm; 
import React, { useState, useEffect, useRef, useContext } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  IconButton,
  Card,
  Divider,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  Tooltip,
  Stack,
  Switch,
  FormControlLabel,
  CircularProgress,
  useTheme
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Image as ImageIcon,
  Refresh as RefreshIcon,
  PushPin as PushPinIcon,
  NotificationsActive as NotificationsActiveIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  CloudUpload as CloudUploadIcon,
  Save as SaveIcon,
  Close as CloseIcon,
  AccessTime as AccessTimeIcon
} from '@mui/icons-material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import AdminSidebar from '../components/AdminSidebar';
import NotificationBell from '../components/NotificationBell';
import { format } from 'date-fns';
import axios from 'axios';
import { ThemeContext } from '../App';

// Create a fallback component in case react-quill has issues
const RichTextEditor = ({ value, onChange, placeholder }) => {
  const { mode } = useContext(ThemeContext);
  const [editorLoaded, setEditorLoaded] = useState(false);
  const [editorError, setEditorError] = useState(false);
  const editorRef = useRef(null);

  useEffect(() => {
    // This simpler implementation avoids the findDOMNode issue
    const loadEditor = async () => {
      try {
        setEditorLoaded(true);
      } catch (error) {
        console.error('Error setting up editor:', error);
        setEditorError(true);
      }
    };
    
    loadEditor();
  }, []);

  // Always use the textarea implementation since the contentEditable approach has issues
  return (
    <TextField
      multiline
      fullWidth
      rows={8}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      InputProps={{
        sx: {
          backgroundColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
          color: mode === 'dark' ? '#fff' : '#333',
          borderRadius: '10px',
          border: mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
          direction: 'ltr', // Explicitly set text direction to left-to-right
        }
      }}
      sx={{
        '& .MuiOutlinedInput-notchedOutline': {
          borderColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        },
        '&:hover .MuiOutlinedInput-notchedOutline': {
          borderColor: 'rgba(16, 185, 129, 0.5)',
        },
        '& .Mui-focused .MuiOutlinedInput-notchedOutline': {
          borderColor: '#10B981',
        },
        '& .MuiInputBase-root': {
          color: mode === 'dark' ? '#fff' : '#333',
        }
      }}
    />
  );
};

const AdminNews = () => {
  const { mode } = useContext(ThemeContext);
  const theme = useTheme();
  
  // State for news items
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State for news form
  const [openNewsDialog, setOpenNewsDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedNews, setSelectedNews] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // State for news form data
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'Announcement',
    publishDate: new Date(),
    expiryDate: null,
    tags: [],
    pinned: false,
    image: null,
    imageCaption: ''
  });
  
  // State for tags input
  const [tagInput, setTagInput] = useState('');
  
  // State for snackbar
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  
  // State for search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Fetch all news items
  useEffect(() => {
    fetchNews();
  }, []);

  // Add effect to fetch news when filters change
  useEffect(() => {
    // Only fetch if we've already loaded the initial data
    if (!loading) {
      fetchNews();
    }
  }, [searchQuery, categoryFilter, statusFilter]);

  const fetchNews = async () => {
    try {
      setLoading(true);
      
      // Build query parameters based on filters
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (categoryFilter !== 'all') params.append('category', categoryFilter);
      if (statusFilter === 'active') params.append('isActive', 'true');
      if (statusFilter === 'inactive') params.append('isActive', 'false');
      
      // Make the API call to fetch news
      const response = await axios.get(`/api/admin/news?${params.toString()}`);
      setNews(response.data.news);
      setError(null);
    } catch (err) {
      console.error('Error fetching news:', err);
      setError('Failed to load news items. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Handle input changes for form
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // Handle rich text editor changes
  const handleEditorChange = (content) => {
    setFormData({
      ...formData,
      content
    });
  };

  // Handle date changes
  const handleDateChange = (name, date) => {
    setFormData({
      ...formData,
      [name]: date
    });
  };

  // Handle adding a tag
  const handleAddTag = () => {
    if (tagInput.trim() !== '' && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()]
      });
      setTagInput('');
    }
  };

  // Handle removing a tag
  const handleRemoveTag = (tagToRemove) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    });
  };

  // Handle image upload
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        // For development/demo purposes, use FileReader as fallback if API fails
        // This will allow local image display without actual server upload
        const reader = new FileReader();
        reader.onloadend = () => {
          // Update form with the local image data URL
          setFormData(prevData => ({
            ...prevData,
            image: reader.result // Base64 encoded image
          }));
        };
        reader.readAsDataURL(file);
        
        try {
          // Still attempt the actual API upload
          const formData = new FormData();
          formData.append('image', file);
          
          const response = await axios.post('/api/admin/news/upload-image', formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          });
          
          // If successful, update to use the server URL
          setFormData(prevData => ({
            ...prevData,
            image: response.data.fileUrl
          }));
          
          setSnackbar({
            open: true,
            message: 'Image uploaded successfully!',
            severity: 'success'
          });
        } catch (apiErr) {
          console.log('Server upload failed, using local image as fallback');
          // We'll keep using the local image from FileReader
          // But inform the user there was an issue with server upload
          console.error('Server image upload error:', apiErr);
          setSnackbar({
            open: true,
            message: 'Using local image preview. Server upload unavailable.',
            severity: 'warning'
          });
        }
      } catch (err) {
        console.error('Error handling image:', err);
        setSnackbar({
          open: true,
          message: 'Failed to process image. Please try a different file.',
          severity: 'error'
        });
      }
    }
  };

  // Handle opening the form for creating new news
  const handleOpenCreateDialog = () => {
    setIsEditing(false);
    setSelectedNews(null);
    setFormData({
      title: '',
      content: '',
      category: 'Announcement',
      publishDate: new Date(),
      expiryDate: null,
      tags: [],
      pinned: false,
      image: null,
      imageCaption: ''
    });
    setOpenNewsDialog(true);
  };

  // Handle opening the form for editing news
  const handleOpenEditDialog = async (newsItem) => {
    try {
      setIsEditing(true);
      
      // Fetch the full news item data
      const response = await axios.get(`/api/admin/news/${newsItem._id}`);
      const fullNewsItem = response.data;
      
      setSelectedNews(fullNewsItem);
      setFormData({
        title: fullNewsItem.title,
        content: fullNewsItem.content,
        category: fullNewsItem.category,
        publishDate: new Date(fullNewsItem.publishDate),
        expiryDate: fullNewsItem.expiryDate ? new Date(fullNewsItem.expiryDate) : null,
        tags: fullNewsItem.tags || [],
        pinned: fullNewsItem.pinned || false,
        image: fullNewsItem.image,
        imageCaption: fullNewsItem.imageCaption || ''
      });
      
      setOpenNewsDialog(true);
    } catch (err) {
      console.error('Error fetching news details:', err);
      setSnackbar({
        open: true,
        message: `Failed to load news details. ${err.response?.data?.message || err.message}`,
        severity: 'error'
      });
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        // Update existing news item
        const response = await axios.put(
          `/api/admin/news/${selectedNews._id}`, 
          formData
        );
        
        // Update the news list with the edited item
        setNews(news.map(item => 
          item._id === selectedNews._id ? response.data : item
        ));
        
        setSnackbar({
          open: true,
          message: 'News updated successfully!',
          severity: 'success'
        });
      } else {
        // Create new news item
        const response = await axios.post('/api/admin/news', formData);
        
        // Add the new item to the news list
        setNews([response.data, ...news]);
        
        setSnackbar({
          open: true,
          message: 'News created successfully!',
          severity: 'success'
        });
      }
      
      // Close the dialog
      setOpenNewsDialog(false);
    } catch (err) {
      console.error('Error submitting news:', err);
      setSnackbar({
        open: true,
        message: `Failed to ${isEditing ? 'update' : 'create'} news. ${err.response?.data?.message || err.message}`,
        severity: 'error'
      });
    }
  };

  // Handle delete confirmation
  const handleOpenDeleteDialog = (newsItem) => {
    setSelectedNews(newsItem);
    setOpenDeleteDialog(true);
  };

  // Handle delete
  const handleDelete = async () => {
    try {
      // Delete the news item
      await axios.delete(`/api/admin/news/${selectedNews._id}`);
      
      // Remove the item from the news list
      const updatedNews = news.filter(item => item._id !== selectedNews._id);
      setNews(updatedNews);
      
      // Show success message
      setSnackbar({
        open: true,
        message: 'News deleted successfully!',
        severity: 'success'
      });
      
      // Close the dialog
      setOpenDeleteDialog(false);
    } catch (err) {
      console.error('Error deleting news:', err);
      setSnackbar({
        open: true,
        message: `Failed to delete news. ${err.response?.data?.message || err.message}`,
        severity: 'error'
      });
    }
  };

  // Toggle pin status of a news item
  const handleTogglePin = async (newsItem) => {
    try {
      // Call the API to toggle pin status
      const response = await axios.put(`/api/admin/news/${newsItem._id}/toggle-pin`);
      
      // Update the news in the list
      setNews(news.map(item => 
        item._id === newsItem._id ? response.data.news : item
      ));
      
      // Show success message
      setSnackbar({
        open: true,
        message: `News ${response.data.news.pinned ? 'pinned' : 'unpinned'} successfully!`,
        severity: 'success'
      });
    } catch (err) {
      console.error('Error toggling pin status:', err);
      setSnackbar({
        open: true,
        message: `Failed to update pin status. ${err.response?.data?.message || err.message}`,
        severity: 'error'
      });
    }
  };

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
          p: { xs: 2, md: 4 },
          position: 'relative',
          zIndex: 1,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: 'none',
          maxWidth: '1600px',
          width: '100%',
          mx: 'auto',
        }}
      >
        {/* Dashboard Header */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', md: 'row' },
          justifyContent: 'space-between', 
          alignItems: { xs: 'flex-start', md: 'center' }, 
          mb: 4,
          pb: 3,
          borderBottom: '1px solid rgba(255,255,255,0.03)',
          maxWidth: '1400px',
          mx: 'auto'
        }}>
          <Box sx={{ mb: { xs: 2, md: 0 } }}>
            <Typography variant="h4" sx={{ 
              fontWeight: 600, 
              color: '#fff',
              textShadow: '0 2px 4px rgba(0,0,0,0.2)',
              letterSpacing: '-0.5px',
              fontSize: { xs: '1.75rem', md: '2.125rem' }
            }}>
              News Management
            </Typography>
            <Typography variant="body2" sx={{ color: '#6B7280', mt: 1 }}>
              Create, update and manage announcements and news items
            </Typography>
          </Box>
          <Stack 
            direction={{ xs: 'row', sm: 'row' }} 
            spacing={2} 
            alignItems="center"
            width={{ xs: '100%', md: 'auto' }}
            justifyContent={{ xs: 'flex-start', md: 'flex-end' }}
          >
            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={fetchNews}
              sx={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                color: '#fff',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                },
                borderRadius: '10px',
                px: 2,
                flex: { xs: 1, sm: 'none' },
                maxWidth: { xs: '120px', sm: 'none' }
              }}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenCreateDialog}
              sx={{
                background: 'linear-gradient(90deg, #10B981 0%, #059669 100%)',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)',
                transition: 'all 0.2s ease',
                borderRadius: '10px',
                px: 3,
                py: 1,
                flex: { xs: 2, sm: 'none' },
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 20px rgba(16, 185, 129, 0.3)',
                  background: 'linear-gradient(90deg, #059669 0%, #047857 100%)',
                },
              }}
            >
              Create News
            </Button>
            <NotificationBell userType="admin" color="#10B981" />
          </Stack>
        </Box>

        {/* Search and Filter Bar */}
        <Card sx={{ 
          mb: 4,
          background: 'linear-gradient(145deg, #141414 0%, #0A0A0A 100%)',
          borderRadius: '20px',
          p: { xs: 2, md: 3 },
          border: '1px solid rgba(255, 255, 255, 0.03)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
          backdropFilter: 'blur(10px)',
          maxWidth: '1400px',
          mx: 'auto',
        }}>
          <Stack 
            direction={{ xs: 'column', md: 'row' }} 
            spacing={2} 
            alignItems={{ xs: 'stretch', md: 'center' }}
            justifyContent="space-between"
          >
            <Box sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: { xs: 'stretch', sm: 'center' }, 
              gap: 2,
              width: { xs: '100%', md: 'auto' }
            }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '10px',
                px: 2,
                py: 0.5,
                border: '1px solid rgba(255, 255, 255, 0.08)',
                width: '100%',
                maxWidth: { xs: '100%', sm: '320px' },
              }}>
                <SearchIcon sx={{ color: '#6B7280', mr: 1 }} />
                <TextField
                  placeholder="Search news..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  fullWidth
                  variant="standard"
                  InputProps={{
                    disableUnderline: true,
                    sx: {
                      color: '#fff',
                      '&::placeholder': {
                        color: '#6B7280',
                        opacity: 1,
                      },
                    }
                  }}
                  sx={{
                    '& .MuiInputBase-input::placeholder': {
                      color: '#6B7280',
                      opacity: 1,
                    },
                  }}
                />
              </Box>
              
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
                ml: { xs: 0, sm: 2 }
              }}>
                <NotificationsActiveIcon sx={{ color: '#10B981', fontSize: 22 }} />
                <Typography variant="body1" sx={{ color: '#fff', fontWeight: 600 }}>
                  {news.length} Items
                </Typography>
                <Chip 
                  size="small"
                  label={`${news.filter(item => item.pinned).length} Pinned`}
                  sx={{ 
                    bgcolor: 'rgba(16, 185, 129, 0.1)', 
                    color: '#fff',
                    fontWeight: 500,
                    ml: 1
                  }}
                />
              </Box>
            </Box>

            <Stack 
              direction={{ xs: 'column', sm: 'row' }} 
              spacing={2}
              width={{ xs: '100%', md: 'auto' }}
              justifyContent={{ xs: 'flex-start', md: 'flex-end' }}
            >
              <FormControl 
                size="small" 
                sx={{ 
                  minWidth: 120,
                  width: { xs: '100%', sm: 'auto' },
                  '& .MuiInputBase-root': {
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '10px',
                    color: '#fff',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                  },
                  '& .MuiSelect-icon': {
                    color: '#6B7280',
                  },
                }}
              >
                <InputLabel id="category-filter-label" sx={{ color: '#6B7280' }}>Category</InputLabel>
                <Select
                  labelId="category-filter-label"
                  id="category-filter"
                  value={categoryFilter}
                  label="Category"
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <MenuItem value="all">All Categories</MenuItem>
                  <MenuItem value="Announcement">Announcements</MenuItem>
                  <MenuItem value="Event">Events</MenuItem>
                  <MenuItem value="Notice">Notices</MenuItem>
                  <MenuItem value="Update">Updates</MenuItem>
                </Select>
              </FormControl>
              
              <FormControl 
                size="small" 
                sx={{ 
                  minWidth: 120,
                  width: { xs: '100%', sm: 'auto' },
                  '& .MuiInputBase-root': {
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '10px',
                    color: '#fff',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                  },
                  '& .MuiSelect-icon': {
                    color: '#6B7280',
                  },
                }}
              >
                <InputLabel id="status-filter-label" sx={{ color: '#6B7280' }}>Status</InputLabel>
                <Select
                  labelId="status-filter-label"
                  id="status-filter"
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </Stack>
        </Card>

        {/* News Items Grid */}
        {loading ? (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '300px',
            maxWidth: '1400px',
            mx: 'auto'
          }}>
            <CircularProgress sx={{ color: '#10B981' }} />
          </Box>
        ) : error ? (
          <Card sx={{ 
            p: 4, 
            textAlign: 'center', 
            background: 'linear-gradient(145deg, #141414 0%, #0A0A0A 100%)',
            border: '1px solid rgba(255, 255, 255, 0.03)',
            borderRadius: '20px',
            backdropFilter: 'blur(10px)',
            maxWidth: '1400px',
            mx: 'auto',
            px: { xs: 2, sm: 3 }
          }}>
            <Typography variant="h6" color="#EF4444">
              {error}
            </Typography>
            <Button 
              variant="outlined" 
              onClick={fetchNews}
              sx={{ 
                mt: 2, 
                color: '#EF4444', 
                borderColor: '#EF4444',
                '&:hover': {
                  borderColor: '#DC2626',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)'
                }
              }}
            >
              Try Again
            </Button>
          </Card>
        ) : news.length === 0 ? (
          <Card sx={{ 
            p: 4, 
            textAlign: 'center', 
            background: 'linear-gradient(145deg, #141414 0%, #0A0A0A 100%)',
            border: '1px solid rgba(255, 255, 255, 0.03)',
            borderRadius: '20px',
            backdropFilter: 'blur(10px)',
            maxWidth: '1400px',
            mx: 'auto',
            px: { xs: 2, sm: 3 }
          }}>
            <Typography variant="h6" color="#9CA3AF">
              No news items found
            </Typography>
            <Typography variant="body2" color="#6B7280" sx={{ mt: 1 }}>
              {searchQuery || categoryFilter !== 'all' || statusFilter !== 'all' 
                ? 'Try changing your search criteria or filters' 
                : 'Create your first news item to get started'}
            </Typography>
            {!searchQuery && categoryFilter === 'all' && statusFilter === 'all' && (
              <Button 
                variant="contained" 
                startIcon={<AddIcon />}
                onClick={handleOpenCreateDialog}
                sx={{
                  mt: 2,
                  background: 'linear-gradient(90deg, #10B981 0%, #059669 100%)',
                  '&:hover': {
                    background: 'linear-gradient(90deg, #059669 0%, #047857 100%)',
                  }
                }}
              >
                Create News
              </Button>
            )}
          </Card>
        ) : (
          <Grid 
            container 
            spacing={3} 
            justifyContent="center" 
            sx={{ 
              mt: 1,
              maxWidth: '1400px',
              mx: 'auto',
              px: { xs: 1, sm: 2 }
            }}
          >
            {news.map((newsItem) => {
              // Check if news is active
              const now = new Date();
              const publishDate = new Date(newsItem.publishDate);
              const expiryDate = newsItem.expiryDate ? new Date(newsItem.expiryDate) : null;
              const isActive = publishDate <= now && (!expiryDate || expiryDate > now);
              
              return (
                <Grid 
                  item 
                  xs={12} 
                  sm={6} 
                  md={4} 
                  key={newsItem._id} 
                  sx={{ 
                    width: '100%',
                    display: 'flex'
                  }}
                >
                  <Card sx={{
                    height: '100%',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    background: 'linear-gradient(145deg, #141414 0%, #0A0A0A 100%)',
                    borderRadius: '20px',
                    border: '1px solid rgba(255, 255, 255, 0.03)',
                    boxShadow: newsItem.pinned 
                      ? '0 0 0 2px rgba(16, 185, 129, 0.3), 0 4px 20px rgba(0,0,0,0.2)'
                      : '0 4px 20px rgba(0,0,0,0.2)',
                    transition: 'all 0.3s ease',
                    backdropFilter: 'blur(10px)',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: newsItem.pinned 
                        ? '0 0 0 2px rgba(16, 185, 129, 0.5), 0 12px 28px rgba(0,0,0,0.3)'
                        : '0 12px 28px rgba(0,0,0,0.3)',
                    },
                  }}>
                    {/* Card Header */}
                    <Box sx={{ 
                      p: { xs: 2, md: 3 }, 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'flex-start',
                      minHeight: '120px', 
                      width: '100%'
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                        <IconButton 
                          onClick={() => handleOpenDeleteDialog(newsItem)}
                          sx={{ 
                            color: '#EF4444',
                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            '&:hover': {
                              backgroundColor: 'rgba(239, 68, 68, 0.2)',
                            },
                            mr: 1.5,
                            width: 30,
                            height: 30,
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                        <Box>
                          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" gap={1} sx={{ mb: 1.5 }}>
                            <Chip 
                              label={newsItem.category} 
                              size="small"
                              sx={{ 
                                backgroundColor: newsItem.category === 'Announcement' ? 'rgba(16, 185, 129, 0.1)' :
                                              newsItem.category === 'Event' ? 'rgba(249, 115, 22, 0.1)' :
                                              newsItem.category === 'Notice' ? 'rgba(59, 130, 246, 0.1)' :
                                              'rgba(139, 92, 246, 0.1)',
                                color: newsItem.category === 'Announcement' ? '#10B981' :
                                      newsItem.category === 'Event' ? '#F97316' :
                                      newsItem.category === 'Notice' ? '#3B82F6' :
                                      '#8B5CF6',
                                fontWeight: 500,
                              }}
                            />
                            {newsItem.pinned && (
                              <Tooltip title="Pinned">
                                <IconButton onClick={() => handleTogglePin(newsItem)}>
                                  <PushPinIcon sx={{ fontSize: 18, color: '#10B981' }} />
                                </IconButton>
                              </Tooltip>
                            )}
                            {!isActive && (
                              <Chip 
                                label="Inactive" 
                                size="small"
                                sx={{ 
                                  backgroundColor: 'rgba(156, 163, 175, 0.1)',
                                  color: '#9CA3AF',
                                  fontWeight: 500,
                                }}
                              />
                            )}
                          </Stack>
                          <Typography variant="h6" sx={{ 
                            fontWeight: 600, 
                            color: '#fff',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            mb: 1.5,
                            lineHeight: 1.3,
                            height: '2.6em',
                            fontSize: '1rem'
                          }}>
                            {newsItem.title}
                          </Typography>
                          <Stack direction="row" spacing={2} alignItems="center">
                            <Stack direction="row" spacing={0.5} alignItems="center">
                              <AccessTimeIcon sx={{ fontSize: 14, color: '#6B7280' }} />
                              <Typography variant="caption" sx={{ color: '#6B7280' }}>
                                {format(new Date(newsItem.publishDate), 'MMM d, yyyy')}
                              </Typography>
                            </Stack>
                          </Stack>
                        </Box>
                      </Box>
                    </Box>
                    
                    {/* Card Media */}
                    {newsItem.image && (
                      <Box sx={{ 
                        px: { xs: 2, md: 3 }, 
                        pb: 2
                      }}>
                        <Box 
                          sx={{ 
                            width: '100%', 
                            height: 400, 
                            borderRadius: '10px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                            backgroundColor: 'rgba(0,0,0,0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden'
                          }} 
                        >
                          <Box 
                            component="img"
                            src={newsItem.image}
                            alt={newsItem.title}
                            sx={{
                              maxWidth: '100%',
                              maxHeight: '400px',
                              objectFit: 'contain'
                            }}
                          />
                        </Box>
                        {newsItem.imageCaption && (
                          <Typography variant="caption" sx={{ 
                            color: '#9CA3AF', 
                            display: 'block', 
                            mt: 1, 
                            fontStyle: 'italic',
                            textOverflow: 'ellipsis',
                            overflow: 'hidden',
                            whiteSpace: 'nowrap'
                          }}>
                            {newsItem.imageCaption}
                          </Typography>
                        )}
                      </Box>
                    )}
                    
                    {/* Card Content */}
                    <Box sx={{ 
                      px: { xs: 2, md: 3 }, 
                      pb: 2, 
                      flexGrow: 1,
                      minHeight: 100, // Ensure minimum height for content
                      display: 'flex',
                      flexDirection: 'column'
                    }}>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: '#D1D5DB',
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          lineHeight: 1.6,
                          height: '4.8em', // Fixed height for 3 lines with 1.6 line-height
                          // Remove HTML tags for preview
                          '& div': { display: 'inline' },
                          '& p': { display: 'inline', m: 0 },
                          '& ul, & ol': { m: 0, pl: 2 },
                          width: '100%'
                        }}
                        dangerouslySetInnerHTML={{ __html: newsItem.content }}
                      />
                    </Box>
                    
                    {/* Tags */}
                    <Box sx={{ 
                      px: { xs: 2, md: 3 }, 
                      py: 2, 
                      minHeight: '60px', // Ensure consistent height for tags section
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'flex-start',
                      gap: 1,
                      borderTop: '1px solid rgba(255, 255, 255, 0.03)'
                    }}>
                      {newsItem.tags && newsItem.tags.length > 0 ? (
                        newsItem.tags.map((tag, index) => (
                          <Chip
                            key={index}
                            label={tag}
                            size="small"
                            sx={{
                              bgcolor: 'rgba(16, 185, 129, 0.1)',
                              color: '#10B981',
                              borderRadius: '4px',
                              fontSize: '0.7rem',
                              height: '24px',
                              maxWidth: '100px', // Limit tag width
                              '& .MuiChip-label': {
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }
                            }}
                          />
                        ))
                      ) : (
                        <Typography variant="caption" sx={{ color: '#6B7280' }}>
                          No tags
                        </Typography>
                      )}
                    </Box>
                    
                    {/* Card Actions */}
                    <Box sx={{ 
                      p: { xs: 1.5, md: 2 }, 
                      borderTop: '1px solid rgba(255, 255, 255, 0.03)', 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mt: 'auto',
                      minHeight: '50px' // Ensures consistent footer height
                    }}>
                      <Typography variant="caption" sx={{ 
                        color: '#6B7280',
                        width: '50%', // Ensure consistent width for the date section
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {newsItem.expiryDate ? 
                          (new Date(newsItem.expiryDate) instanceof Date && !isNaN(new Date(newsItem.expiryDate)) ?
                            `Expires: ${format(new Date(newsItem.expiryDate), 'MMM d, yyyy')}` :
                            'Invalid expiry date') : 
                          'No expiry date'}
                      </Typography>
                      <Button
                        variant="text"
                        startIcon={<EditIcon />}
                        onClick={() => handleOpenEditDialog(newsItem)}
                        sx={{
                          color: '#10B981',
                          '&:hover': {
                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                          }
                        }}
                      >
                        Edit
                      </Button>
                    </Box>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}
      </Box>

      {/* Create/Edit News Dialog */}
      <Dialog 
        open={openNewsDialog} 
        onClose={() => setOpenNewsDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: '#141414',
            borderRadius: '20px',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            backgroundImage: 'linear-gradient(145deg, #141414 0%, #0A0A0A 100%)',
            backdropFilter: 'blur(10px)',
            color: '#fff',
          }
        }}
      >
        <DialogTitle sx={{ 
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
          px: 3,
          py: 2,
          color: '#fff',
          fontWeight: 600,
          fontSize: '1.5rem',
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          {isEditing ? 'Edit News Item' : 'Create News Item'}
          <IconButton 
            onClick={() => setOpenNewsDialog(false)}
            sx={{ color: '#9CA3AF' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            <Grid container spacing={3}>
              {/* Title */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ color: '#D1D5DB', mb: 1, fontWeight: 500 }}>
                  Title
                </Typography>
                <TextField
                  required
                  fullWidth
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Enter news title"
                  variant="outlined"
                  InputProps={{
                    sx: {
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      color: '#fff',
                      borderRadius: '10px',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                    }
                  }}
                  sx={{
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255, 255, 255, 0.1)',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(16, 185, 129, 0.5)',
                    },
                    '& .Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#10B981',
                    },
                  }}
                />
              </Grid>
              
              {/* First Row: Category & Pin toggle */}
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" sx={{ color: '#D1D5DB', mb: 1, fontWeight: 500 }}>
                  Category
                </Typography>
                <FormControl 
                  fullWidth
                  sx={{ 
                    '& .MuiInputBase-root': {
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: '10px',
                      color: '#fff',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                    },
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255, 255, 255, 0.1)',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(59, 130, 246, 0.5)',
                    },
                    '& .Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#3B82F6',
                    },
                    '& .MuiSelect-icon': {
                      color: '#9CA3AF',
                    },
                  }}
                >
                  <InputLabel id="category-label" sx={{ color: '#9CA3AF' }}>Category</InputLabel>
                  <Select
                    labelId="category-label"
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    label="Category"
                  >
                    <MenuItem value="Announcement">Announcement</MenuItem>
                    <MenuItem value="Event">Event</MenuItem>
                    <MenuItem value="Notice">Notice</MenuItem>
                    <MenuItem value="Update">Update</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Box sx={{ mt: 3.5 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.pinned}
                        onChange={handleInputChange}
                        name="pinned"
                        sx={{
                          '& .MuiSwitch-switchBase.Mui-checked': {
                            color: '#3B82F6',
                            '&:hover': {
                              backgroundColor: 'rgba(59, 130, 246, 0.1)',
                            },
                          },
                          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                            backgroundColor: '#3B82F6',
                          },
                        }}
                      />
                    }
                    label="Pin to top"
                    sx={{ 
                      color: '#D1D5DB',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  />
                </Box>
              </Grid>
              
              {/* Second Row: Publish Date & Expiry Date */}
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" sx={{ color: '#D1D5DB', mb: 1, fontWeight: 500 }}>
                  Publish Date
                </Typography>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    value={formData.publishDate}
                    onChange={(newDate) => handleDateChange('publishDate', newDate)}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        variant: 'outlined',
                        InputProps: {
                          sx: {
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            color: '#fff',
                            borderRadius: '10px',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                          }
                        },
                        sx: {
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'rgba(255, 255, 255, 0.1)',
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'rgba(59, 130, 246, 0.5)',
                          },
                          '& .Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#3B82F6',
                          },
                        }
                      },
                    }}
                  />
                </LocalizationProvider>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" sx={{ color: '#D1D5DB', mb: 1, fontWeight: 500 }}>
                  Expiry Date (Optional)
                </Typography>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    value={formData.expiryDate}
                    onChange={(newDate) => handleDateChange('expiryDate', newDate)}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        variant: 'outlined',
                        InputProps: {
                          sx: {
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            color: '#fff',
                            borderRadius: '10px',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                          }
                        },
                        sx: {
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'rgba(255, 255, 255, 0.1)',
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'rgba(59, 130, 246, 0.5)',
                          },
                          '& .Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#3B82F6',
                          },
                        }
                      },
                    }}
                  />
                </LocalizationProvider>
              </Grid>
              
              {/* Content */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ color: '#D1D5DB', mb: 1, fontWeight: 500 }}>
                  Content
                </Typography>
                <RichTextEditor
                  value={formData.content}
                  onChange={handleEditorChange}
                  placeholder="Enter news content..."
                />
              </Grid>
              
              {/* Tags */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ color: '#D1D5DB', mb: 1, fontWeight: 500 }}>
                  Tags
                </Typography>
                <Box sx={{ 
                  display: 'flex', 
                  gap: 1, 
                  mb: 2,
                  flexDirection: { xs: 'column', sm: 'row' },
                  '& > .MuiTextField-root': { 
                    flex: { xs: '1', sm: '1 1 auto' },
                    mb: { xs: 1, sm: 0 }
                  }
                }}>
                  <TextField
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="Add a tag..."
                    variant="outlined"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    InputProps={{
                      sx: {
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        color: '#fff',
                        borderRadius: '10px',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                      }
                    }}
                    sx={{
                      flex: 1,
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(59, 130, 246, 0.5)',
                      },
                      '& .Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#3B82F6',
                      },
                    }}
                  />
                  <Button
                    variant="contained"
                    onClick={handleAddTag}
                    sx={{
                      backgroundColor: '#3B82F6',
                      color: '#fff',
                      '&:hover': {
                        backgroundColor: '#2563EB',
                      },
                      borderRadius: '10px',
                      minWidth: '80px',
                      maxHeight: '56px',
                    }}
                  >
                    Add
                  </Button>
                </Box>
                <Box sx={{ 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  gap: 1,
                  mb: 1,
                  minHeight: '32px',
                  border: formData.tags.length > 0 ? 'none' : '1px dashed rgba(255, 255, 255, 0.1)',
                  borderRadius: '10px',
                  p: formData.tags.length > 0 ? 0 : 2,
                }}>
                  {formData.tags.length > 0 ? (
                    formData.tags.map((tag, index) => (
                      <Chip
                        key={index}
                        label={tag}
                        onDelete={() => handleRemoveTag(tag)}
                        sx={{
                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                          color: '#D1D5DB',
                          '& .MuiChip-deleteIcon': {
                            color: '#9CA3AF',
                            '&:hover': {
                              color: '#EF4444',
                            }
                          },
                        }}
                      />
                    ))
                  ) : (
                    <Typography variant="body2" sx={{ color: '#6B7280', fontStyle: 'italic' }}>
                      No tags added yet
                    </Typography>
                  )}
                </Box>
              </Grid>
              
              {/* Image Upload */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ color: '#D1D5DB', mb: 1, fontWeight: 500 }}>
                  Featured Image (Optional)
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <input
                    accept="image/*"
                    style={{ display: 'none' }}
                    id="image-upload"
                    type="file"
                    onChange={handleImageUpload}
                  />
                  <label htmlFor="image-upload">
                    <Button
                      variant="contained"
                      component="span"
                      startIcon={<CloudUploadIcon />}
                      sx={{
                        backgroundColor: '#3B82F6',
                        color: '#fff',
                        '&:hover': {
                          backgroundColor: '#2563EB',
                        },
                        borderRadius: '10px',
                      }}
                    >
                      Upload Image
                    </Button>
                  </label>
                </Box>
                {formData.image ? (
                  <Box sx={{ mb: 2 }}>
                    <Box 
                      sx={{ 
                        width: '100%', 
                        height: 400, 
                        backgroundColor: 'rgba(0,0,0,0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '10px',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        mb: 1,
                        overflow: 'hidden'
                      }} 
                    >
                      <Box 
                        component="img"
                        src={formData.image}
                        alt="Image preview"
                        sx={{
                          maxWidth: '100%',
                          maxHeight: '400px',
                          objectFit: 'contain'
                        }}
                      />
                    </Box>
                    <TextField
                      fullWidth
                      name="imageCaption"
                      value={formData.imageCaption}
                      onChange={handleInputChange}
                      placeholder="Image caption (optional)"
                      variant="outlined"
                      size="small"
                      InputProps={{
                        sx: {
                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                          color: '#fff',
                          borderRadius: '10px',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                        }
                      }}
                      sx={{
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(255, 255, 255, 0.1)',
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(59, 130, 246, 0.5)',
                        },
                        '& .Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#3B82F6',
                        },
                      }}
                    />
                  </Box>
                ) : (
                  <Box 
                    sx={{ 
                      border: '1px dashed rgba(255, 255, 255, 0.1)', 
                      borderRadius: '10px',
                      p: 3,
                      textAlign: 'center',
                      backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    }}
                  >
                    <ImageIcon sx={{ fontSize: 40, color: '#6B7280', mb: 1 }} />
                    <Typography variant="body2" sx={{ color: '#6B7280' }}>
                      No image uploaded
                    </Typography>
                  </Box>
                )}
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ 
          px: 3, 
          py: 2, 
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          display: 'flex',
          justifyContent: 'space-between'
        }}>
          <Button 
            onClick={() => setOpenNewsDialog(false)}
            variant="outlined"
            startIcon={<CloseIcon />}
            sx={{
              color: '#9CA3AF',
              borderColor: 'rgba(255, 255, 255, 0.1)',
              '&:hover': {
                borderColor: 'rgba(255, 255, 255, 0.2)',
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
              },
              borderRadius: '10px',
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            variant="contained"
            startIcon={<SaveIcon />}
            sx={{
              background: 'linear-gradient(90deg, #10B981 0%, #059669 100%)',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)',
              transition: 'all 0.2s ease',
              borderRadius: '10px',
              px: 3,
              py: 1,
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 20px rgba(16, 185, 129, 0.3)',
                background: 'linear-gradient(90deg, #059669 0%, #047857 100%)',
              },
            }}
          >
            {isEditing ? 'Update News' : 'Publish News'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
        PaperProps={{
          sx: {
            backgroundColor: '#141414',
            borderRadius: '20px',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            backgroundImage: 'linear-gradient(145deg, #141414 0%, #0A0A0A 100%)',
            backdropFilter: 'blur(10px)',
            color: '#fff',
          }
        }}
      >
        <DialogTitle sx={{ color: '#fff', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
          Confirm Delete
        </DialogTitle>
        <DialogContent sx={{ py: 3 }}>
          <Typography variant="body1" color="#D1D5DB">
            Are you sure you want to delete "{selectedNews?.title}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
          <Button 
            onClick={() => setOpenDeleteDialog(false)}
            variant="outlined"
            sx={{
              color: '#9CA3AF',
              borderColor: 'rgba(255, 255, 255, 0.1)',
              '&:hover': {
                borderColor: 'rgba(255, 255, 255, 0.2)',
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
              },
              borderRadius: '10px',
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDelete}
            variant="contained"
            color="error"
            startIcon={<DeleteIcon />}
            sx={{
              backgroundColor: 'rgba(239, 68, 68, 0.9)',
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)',
              transition: 'all 0.2s ease',
              borderRadius: '10px',
              '&:hover': {
                backgroundColor: 'rgba(220, 38, 38, 1)',
                boxShadow: '0 8px 20px rgba(239, 68, 68, 0.3)',
              },
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ 
            width: '100%',
            bgcolor: snackbar.severity === 'success' ? 'rgba(16, 185, 129, 0.95)' : 'rgba(239, 68, 68, 0.95)',
            color: '#fff',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            borderRadius: '10px',
            '& .MuiAlert-icon': {
              color: '#fff'
            }
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AdminNews;

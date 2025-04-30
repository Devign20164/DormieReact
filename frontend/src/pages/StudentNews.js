import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import axios from 'axios';
import {
  Box, Typography, Card, Grid, Stack, Chip, IconButton, Button,
  TextField, InputAdornment, FormControl, InputLabel, MenuItem, Select,
  Tooltip, Avatar, CircularProgress, Snackbar, Alert, Dialog, DialogTitle,
  DialogContent, DialogActions, Divider
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Refresh as RefreshIcon,
  AccessTime as AccessTimeIcon,
  Close as CloseIcon,
  NotificationsActive as NotificationsActiveIcon,
  Info as InfoIcon,
  NewReleases as NewReleasesIcon
} from '@mui/icons-material';
import StudentSidebar from '../components/StudentSidebar';
import NotificationBell from '../components/NotificationBell';

const StudentNews = () => {
  // State for news items
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State for search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  
  // Add pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    totalCount: 0,
    hasMore: false
  });
  
  // State for selected news item and modal
  const [selectedNews, setSelectedNews] = useState(null);
  const [openNewsModal, setOpenNewsModal] = useState(false);
  const [loadingNewsDetails, setLoadingNewsDetails] = useState(false);
  
  // State for snackbar
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  // User data (would come from context/redux in a real app)
  const [userData] = useState({
    _id: 'currentUser',
    name: 'Current User',
    avatar: 'https://mui.com/static/images/avatar/3.jpg'
  });

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch news items when filters change
  useEffect(() => {
    fetchNews();
  }, [debouncedSearchQuery, categoryFilter, pagination.page]);

  const fetchNews = async () => {
    try {
      setLoading(true);
      
      // Build query parameters
      const params = {
        page: pagination.page,
        limit: pagination.limit
      };
      
      // Add category filter if not 'all'
      if (categoryFilter !== 'all') {
        params.category = categoryFilter;
      }
      
      // Add search query if provided
      if (debouncedSearchQuery) {
        params.search = debouncedSearchQuery;
      }
      
      // Make API call with parameters
      const response = await axios.get('/api/students/news', { params });
      
      // Handle response data
      if (response.data && response.data.news) {
        setNews(response.data.news);
        setPagination({
          ...pagination,
          totalCount: response.data.pagination.totalCount || 0,
          hasMore: response.data.pagination.hasMore || false,
          totalPages: response.data.pagination.totalPages || 1
        });
      } else {
        setNews(response.data || []);
      }
      
      setError(null);
    } catch (err) {
      console.error('Error fetching news:', err);
      setError('Failed to load news items. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  // Function to load more news items
  const loadMore = () => {
    if (pagination.hasMore) {
      setPagination({
        ...pagination,
        page: pagination.page + 1
      });
    }
  };
  
  // Function to refresh news items
  const refreshNews = () => {
    setPagination({
      ...pagination,
      page: 1
    });
    fetchNews();
  };
  
  // Function to open the news modal with details
  const openNewsDetails = async (newsId) => {
    try {
      setLoadingNewsDetails(true);
      setOpenNewsModal(true);
      
      // Fetch the full news details
      const response = await axios.get(`/api/students/news/${newsId}`);
      setSelectedNews(response.data);
    } catch (err) {
      console.error('Error fetching news details:', err);
      setSnackbar({
        open: true,
        message: 'Failed to load news details. Please try again.',
        severity: 'error'
      });
    } finally {
      setLoadingNewsDetails(false);
    }
  };
  
  // Function to close the news modal
  const closeNewsDetails = () => {
    setOpenNewsModal(false);
    setSelectedNews(null);
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
      <StudentSidebar />

      {/* Main content container */}
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
        {/* Page header */}
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
              News & Announcements
            </Typography>
            <Typography variant="body2" sx={{ color: '#6B7280', mt: 1 }}>
              Stay updated with the latest dormitory news and announcements
            </Typography>
          </Box>
          <Stack 
            direction="row" 
            spacing={2} 
            alignItems="center"
          >
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={refreshNews}
              sx={{
                color: '#3B82F6',
                borderColor: 'rgba(59, 130, 246, 0.5)',
                '&:hover': {
                  borderColor: '#3B82F6',
                  backgroundColor: 'rgba(59, 130, 246, 0.08)'
                }
              }}
            >
              Refresh
            </Button>
            <NotificationBell userType="student" color="#3B82F6" />
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
            </Box>

            <FormControl 
              size="small" 
              sx={{ 
                minWidth: 120,
                width: { xs: '100%', md: 'auto' },
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
          </Stack>
        </Card>

        {/* News Items Display */}
        {loading ? (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '300px',
            maxWidth: '1400px',
            mx: 'auto'
          }}>
            <CircularProgress sx={{ color: '#3B82F6' }} />
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
              {searchQuery || categoryFilter !== 'all' ? 
                'Try changing your search criteria or filters' : 
                'There are no news or announcements at this time'}
            </Typography>
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
            {news.map((newsItem) => (
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
                <Card 
                  onClick={() => openNewsDetails(newsItem._id)}
                  sx={{
                    height: '100%',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    background: '#0A0A0A',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                    transition: 'all 0.3s ease',
                    overflow: 'hidden',
                    position: 'relative',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: '0 12px 28px rgba(0,0,0,0.4)',
                      cursor: 'pointer'
                    },
                  }}>
                  
                  {/* Category Chip */}
                  <Box sx={{ p: 3, pb: 1 }}>
                        <Chip 
                          label={newsItem.category} 
                          size="small"
                          sx={{ 
                        backgroundColor: newsItem.category === 'Announcement' ? 'rgba(16, 185, 129, 0.15)' :
                                      newsItem.category === 'Event' ? 'rgba(249, 115, 22, 0.15)' :
                                      newsItem.category === 'Notice' ? 'rgba(59, 130, 246, 0.15)' :
                                      'rgba(139, 92, 246, 0.15)',
                            color: newsItem.category === 'Announcement' ? '#10B981' :
                                          newsItem.category === 'Event' ? '#F97316' :
                                          newsItem.category === 'Notice' ? '#3B82F6' :
                                          '#8B5CF6',
                        fontWeight: 600,
                        borderRadius: '4px',
                        height: '24px'
                              }}
                            />
                  </Box>
                  
                  {/* Title */}
                  <Box sx={{ px: 3, pb: 1 }}>
                      <Typography variant="h6" sx={{ 
                      fontWeight: 700, 
                        color: '#fff',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      lineHeight: 1.2,
                      letterSpacing: '-0.01em',
                      fontSize: '1.25rem',
                      mb: 0.5
                      }}>
                        {newsItem.title}
                      </Typography>
                  </Box>
                  
                  {/* Date */}
                  <Box sx={{ px: 3, pb: 2, display: 'flex', alignItems: 'center' }}>
                    <AccessTimeIcon sx={{ fontSize: 14, color: '#6B7280', mr: 0.5 }} />
                        <Typography variant="caption" sx={{ color: '#6B7280' }}>
                          {format(new Date(newsItem.publishDate), 'MMM d, yyyy')}
                        </Typography>
                    
                    {newsItem.pinned && (
                      <Chip
                        label="Pinned"
                        size="small"
                        sx={{
                          ml: 'auto',
                          height: 20,
                          backgroundColor: 'rgba(59, 130, 246, 0.15)',
                          color: '#3B82F6',
                          fontWeight: 500,
                          fontSize: '0.625rem',
                        }}
                      />
                    )}
                  </Box>
                  
                  {/* Image (if present) */}
                  {newsItem.image && (
                    <Box sx={{ 
                      width: '100%',
                      mb: 2,
                      overflow: 'hidden'
                    }}>
                      <Box 
                        sx={{ 
                          width: '100%', 
                          height: 220, 
                          backgroundImage: `url(${newsItem.image})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          transition: 'transform 0.3s ease',
                          '&:hover': {
                            transform: 'scale(1.05)'
                          }
                        }} 
                      />
                    </Box>
                  )}
                  
                  {/* Content Preview */}
                  <Box sx={{ 
                    px: 3, 
                    pb: 3, 
                    flexGrow: 1,
                  }}>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: '#9CA3AF',
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        lineHeight: 1.6,
                        '& div': { display: 'inline' },
                        '& p': { display: 'inline', m: 0 },
                        '& ul, & ol': { m: 0, pl: 2 },
                      }}
                      dangerouslySetInnerHTML={{ __html: newsItem.content }}
                    />
                  </Box>
                  
                  {/* Tags */}
                  {newsItem.tags && newsItem.tags.length > 0 && (
                  <Box sx={{ 
                      px: 3, 
                    py: 2, 
                      borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 1,
                  }}>
                      {newsItem.tags.slice(0, 3).map((tag, index) => (
                        <Chip
                          key={index}
                          label={tag}
                          size="small"
                          sx={{
                            bgcolor: 'rgba(16, 185, 129, 0.1)',
                            color: '#10B981',
                            borderRadius: '4px',
                            fontSize: '0.7rem',
                            height: '22px',
                          }}
                        />
                      ))}
                      {newsItem.tags.length > 3 && (
                      <Typography variant="caption" sx={{ color: '#6B7280' }}>
                          +{newsItem.tags.length - 3} more
                      </Typography>
                    )}
                  </Box>
                    )}
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {!loading && !error && news.length > 0 && pagination.hasMore && (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center',
            mt: 4,
            mb: 2
          }}>
            <Button
              variant="outlined"
              onClick={loadMore}
              sx={{
                color: '#3B82F6',
                borderColor: 'rgba(59, 130, 246, 0.5)',
                px: 4,
                py: 1,
                '&:hover': {
                  borderColor: '#3B82F6',
                  backgroundColor: 'rgba(59, 130, 246, 0.08)'
                }
              }}
            >
              Load More
            </Button>
          </Box>
        )}

        {!loading && !error && news.length > 0 && (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center',
            mt: 2,
            mb: 4
          }}>
            <Typography variant="body2" sx={{ color: '#6B7280' }}>
              Showing {news.length} of {pagination.totalCount} news items
            </Typography>
          </Box>
        )}
      </Box>

      {/* News Detail Modal */}
      <Dialog
        open={openNewsModal}
        onClose={closeNewsDetails}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            background: '#0A0A0A',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
            color: '#fff',
            minHeight: '200px',
            overflowY: 'visible'
          }
        }}
      >
        {loadingNewsDetails ? (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            p: 8 
          }}>
            <CircularProgress sx={{ color: '#3B82F6' }} />
          </Box>
        ) : selectedNews ? (
          <>
            <DialogTitle sx={{ 
              borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
              p: 3,
              position: 'relative'
            }}>
              <Box sx={{ mb: 2 }}>
                <Chip 
                  label={selectedNews.category} 
                  size="small"
                  sx={{ 
                    backgroundColor: selectedNews.category === 'Announcement' ? 'rgba(16, 185, 129, 0.15)' :
                                  selectedNews.category === 'Event' ? 'rgba(249, 115, 22, 0.15)' :
                                  selectedNews.category === 'Notice' ? 'rgba(59, 130, 246, 0.15)' :
                                  'rgba(139, 92, 246, 0.15)',
                    color: selectedNews.category === 'Announcement' ? '#10B981' :
                          selectedNews.category === 'Event' ? '#F97316' :
                          selectedNews.category === 'Notice' ? '#3B82F6' :
                          '#8B5CF6',
                    fontWeight: 600,
                    borderRadius: '4px',
                    height: '24px'
                  }}
                />
                {selectedNews.pinned && (
                  <Chip
                    label="Pinned"
                    size="small"
                    sx={{
                      ml: 1,
                      height: 20,
                      backgroundColor: 'rgba(59, 130, 246, 0.15)',
                      color: '#3B82F6',
                      fontWeight: 500,
                      fontSize: '0.625rem',
                    }}
                  />
                )}
              </Box>
              
              <Typography variant="h4" sx={{ 
                fontWeight: 700, 
                color: '#fff',
                lineHeight: 1.2,
                letterSpacing: '-0.01em',
                mb: 2
              }}>
                {selectedNews.title}
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <AccessTimeIcon sx={{ fontSize: 16, color: '#6B7280' }} />
                  <Typography variant="body2" sx={{ color: '#6B7280' }}>
                    {format(new Date(selectedNews.publishDate), 'MMM d, yyyy')}
                  </Typography>
                </Box>
                {selectedNews.author && (
                  <Typography variant="body2" sx={{ color: '#6B7280' }}>
                    By: {selectedNews.author.name || 'Admin'}
                  </Typography>
                )}
              </Box>
              
              <IconButton
                aria-label="close"
                onClick={closeNewsDetails}
                sx={{
                  position: 'absolute',
                  right: 16,
                  top: 16,
                  color: '#6B7280',
                  '&:hover': {
                    color: '#fff',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)'
                  }
                }}
              >
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            
            <DialogContent sx={{ p: 0 }}>
              {selectedNews.image && (
                <Box sx={{ width: '100%', overflow: 'hidden' }}>
                  <Box 
                    sx={{ 
                      width: '100%', 
                      height: { xs: 200, sm: 300, md: 400 }, 
                      backgroundImage: `url(${selectedNews.image})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }} 
                  />
                  {selectedNews.imageCaption && (
                    <Typography variant="caption" sx={{ 
                      color: '#9CA3AF', 
                      display: 'block', 
                      p: 2,
                      fontStyle: 'italic',
                      textAlign: 'center'
                    }}>
                      {selectedNews.imageCaption}
                    </Typography>
                  )}
                </Box>
              )}
              
              <Box sx={{ p: 3 }}>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    color: '#D1D5DB',
                    lineHeight: 1.8,
                    '& div': { display: 'block', mb: 2 },
                    '& p': { mb: 2 },
                    '& ul, & ol': { m: 0, pl: 3, mb: 2 }
                  }}
                  dangerouslySetInnerHTML={{ __html: selectedNews.content }}
                />
              </Box>
              
              {selectedNews.tags && selectedNews.tags.length > 0 && (
                <Box sx={{ 
                  p: 3, 
                  pt: 1,
                  borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 1
                }}>
                  {selectedNews.tags.map((tag, index) => (
                    <Chip
                      key={index}
                      label={tag}
                      size="small"
                      sx={{
                        bgcolor: 'rgba(16, 185, 129, 0.1)',
                        color: '#10B981',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        height: '24px'
                      }}
                    />
                  ))}
                </Box>
              )}
            </DialogContent>
            
            <DialogActions sx={{ 
              justifyContent: 'space-between', 
              borderTop: '1px solid rgba(255, 255, 255, 0.05)',
              p: 2
            }}>
              {selectedNews.expiryDate && (
                <Typography variant="caption" sx={{ color: '#6B7280' }}>
                  Expires: {format(new Date(selectedNews.expiryDate), 'MMM d, yyyy')}
                </Typography>
              )}
              <Button 
                onClick={closeNewsDetails}
                sx={{ 
                  color: '#10B981',
                  borderRadius: '6px',
                  fontWeight: 500,
                  '&:hover': {
                    backgroundColor: 'rgba(16, 185, 129, 0.08)'
                  }
                }}
              >
                Close
              </Button>
            </DialogActions>
          </>
        ) : (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body1" sx={{ color: '#6B7280' }}>
              News details not available
            </Typography>
            <Button 
              onClick={closeNewsDetails}
              sx={{ 
                mt: 2,
                color: '#10B981',
                '&:hover': {
                  backgroundColor: 'rgba(16, 185, 129, 0.08)'
                }
              }}
            >
              Close
            </Button>
          </Box>
        )}
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

export default StudentNews;

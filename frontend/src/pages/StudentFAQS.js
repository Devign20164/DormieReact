import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  InputAdornment,
  Container,
  Paper,
  Divider,
  Chip,
  Button,
  Grid,
  Card,
  CardContent,
  Avatar,
  IconButton,
  Fade,
  useTheme,
  alpha,
  Stack,
  Tooltip,
  Badge,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Search as SearchIcon,
  QuestionAnswer as FAQIcon,
  Home as DormIcon,
  Announcement as PolicyIcon,
  Devices as TechIcon,
  LocalLaundryService as FacilityIcon,
  RestaurantMenu as FoodIcon,
  Security as SecurityIcon,
  FilterList as FilterIcon,
  HelpOutline as HelpIcon,
  ArrowUpward as ScrollTopIcon,
  InfoOutlined as InfoIcon,
  StarOutlined as StarIcon,
  StarOutline as StarOutlineIcon,
} from '@mui/icons-material';
import StudentSidebar from '../components/StudentSidebar';

// Color constants matching StudentSidebar.js with some enhanced variations
const GREEN_MAIN = "#10B981";
const GREEN_DARK = "#059669";
const GREEN_DARKER = "#047857";
const GREEN_LIGHT = "rgba(16, 185, 129, 0.1)";
const GREEN_LIGHT_HOVER = "rgba(16, 185, 129, 0.2)";
const BG_DARK = "#141414";
const BG_DARKER = "#0A0A0A";
const BG_GRADIENT = "linear-gradient(145deg, rgba(20, 20, 20, 0.8) 0%, rgba(10, 10, 10, 0.8) 100%)";

const StudentFAQS = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedPanel, setExpandedPanel] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [favoriteQuestions, setFavoriteQuestions] = useState([]);
  const [filteredFaqs, setFilteredFaqs] = useState([]);
  const [hoveredFaq, setHoveredFaq] = useState(null);

  // FAQ categories with enhanced descriptions and icons
  const categories = [
    { id: 'all', label: 'All FAQs', icon: <FAQIcon />, description: 'Browse all frequently asked questions' },
    { id: 'dorm', label: 'Dorm Life', icon: <DormIcon />, description: 'Questions about living in the dormitories' },
    { id: 'policies', label: 'Policies', icon: <PolicyIcon />, description: 'Important rules and regulations' },
    { id: 'facilities', label: 'Facilities', icon: <FacilityIcon />, description: 'Information about dorm facilities' },
    { id: 'tech', label: 'Tech Support', icon: <TechIcon />, description: 'Help with internet and technology' },
    { id: 'food', label: 'Dining', icon: <FoodIcon />, description: 'Meal plans and dining information' },
    { id: 'security', label: 'Security', icon: <SecurityIcon />, description: 'Safety and security measures' },
  ];

  // FAQ data
  const faqs = [
    {
      id: 1,
      question: 'What items are prohibited in the dormitories?',
      answer: 'Prohibited items include candles, incense, hot plates, toasters, space heaters, halogen lamps, weapons, and pets (except fish in tanks under 10 gallons). Cooking appliances are restricted to designated kitchen areas only.',
      category: 'policies',
    },
    {
      id: 2,
      question: 'How do I report maintenance issues in my room?',
      answer: 'Maintenance issues should be reported through the Student Dashboard by submitting a Service Request form. For emergencies like water leaks or electrical problems, contact the residence hall front desk immediately.',
      category: 'facilities',
    },
    {
      id: 3,
      question: 'What is the visitor policy?',
      answer: 'Visitors must sign in at the security desk and be accompanied by their host at all times. Overnight guests require pre-approval through the housing portal at least 24 hours in advance. Each resident is limited to 3 overnight guest stays per month.',
      category: 'policies',
    },
    {
      id: 4,
      question: 'How do I connect to the campus Wi-Fi?',
      answer: 'Connect to the "DormieNet" network and enter your student ID and password. For secure connections, use "DormieNet-Secure" with your credentials. If you experience connectivity issues, restart your device first, then contact IT support through the student portal.',
      category: 'tech',
    },
    {
      id: 5,
      question: 'What laundry facilities are available?',
      answer: 'Each dormitory has a laundry room equipped with washing machines and dryers. Payment is made through the Dormie app or your student card. Machines can be monitored remotely through the app to check availability and receive notifications when your laundry is done.',
      category: 'facilities',
    },
    {
      id: 6,
      question: 'How do meal plans work?',
      answer: 'Your meal plan is loaded onto your student ID card. Simply present your card at dining facilities to redeem meals. You can track your meal plan balance through the Student Dashboard or Dormie app. Unused meals expire at the end of each week or semester, depending on your plan type.',
      category: 'food',
    },
    {
      id: 7,
      question: 'What are quiet hours?',
      answer: 'Quiet hours are Sunday through Thursday from 10:00 PM to 8:00 AM, and Friday and Saturday from 12:00 AM to 9:00 AM. During finals week, 24-hour quiet hours are enforced. During quiet hours, noise should not be audible outside your room with the door closed.',
      category: 'dorm',
    },
    {
      id: 8,
      question: 'How do I request a room change?',
      answer: 'Room change requests can be submitted through the Student Dashboard under Housing Options. Requests are reviewed by Housing staff and approved based on availability and circumstances. Room changes are not guaranteed and typically cannot be processed during the first two weeks of a semester.',
      category: 'dorm',
    },
    {
      id: 9,
      question: 'How secure are the dormitories?',
      answer: 'All dormitories have 24/7 security personnel, key card access at all entrances, and security cameras in common areas. Your student ID provides access only to your assigned building. Never prop doors open or let unauthorized individuals into the building. Report any security concerns immediately.',
      category: 'security',
    },
    {
      id: 10,
      question: 'How do I connect my smart devices to the network?',
      answer: 'For devices like smart TVs, gaming consoles, and smart speakers, use the "DormieConnect" network. Register your device\'s MAC address through the Student Dashboard under "Device Registration." Each student can register up to 5 devices. For additional support, contact the IT help desk.',
      category: 'tech',
    },
    {
      id: 11,
      question: 'What should I do if I lose my room key or student ID?',
      answer: 'For lost room keys, report to the residence hall front desk immediately. A temporary key will be issued, and you may be charged for a replacement. For lost student IDs, report to the Student Services office or deactivate it through the Dormie app. Replacement IDs cost $25.',
      category: 'security',
    },
    {
      id: 12,
      question: 'Are there study spaces in the dormitories?',
      answer: 'Yes, each dormitory features study lounges on every floor and common study areas in the main lobby. Many dorms also have dedicated computer labs and group study rooms that can be reserved through the Dormie app. These spaces are available 24/7, but quiet hours policies apply.',
      category: 'facilities',
    },
  ];

  // Handle search and filtering with useEffect
  useEffect(() => {
    const filtered = faqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === 'all' || faq.category === activeCategory;
    return matchesSearch && matchesCategory;
  });
    setFilteredFaqs(filtered);
  }, [searchTerm, activeCategory]);

  // Scroll event listener for scroll-to-top button
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    
    // Load favorites from localStorage
    const savedFavorites = localStorage.getItem('faqFavorites');
    if (savedFavorites) {
      setFavoriteQuestions(JSON.parse(savedFavorites));
    }
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handlePanelChange = (panel) => (event, isExpanded) => {
    setExpandedPanel(isExpanded ? panel : false);
  };

  const handleCategoryChange = (category) => {
    setActiveCategory(category);
    setExpandedPanel(false);
  };

  const handleScrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const toggleFavorite = (id) => {
    const newFavorites = favoriteQuestions.includes(id)
      ? favoriteQuestions.filter(faqId => faqId !== id)
      : [...favoriteQuestions, id];
    
    setFavoriteQuestions(newFavorites);
    localStorage.setItem('faqFavorites', JSON.stringify(newFavorites));
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      minHeight: '100vh',
      background: 'linear-gradient(145deg, #0A0A0A 0%, #141414 100%)',
      color: '#fff',
    }}>
      <StudentSidebar />
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3 },
          overflowX: 'auto',
          position: 'relative',
        }}
      >
        {/* Hero Section */}
        <Box 
          sx={{ 
            position: 'relative',
            mb: 4,
            borderRadius: '8px',
            overflow: 'hidden',
            height: 'auto',
            py: 4,
            px: 3,
            background: 'linear-gradient(135deg, #10B981 0%, #047857 100%)',
          display: 'flex', 
          alignItems: 'center',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              opacity: 0.1,
              zIndex: 0,
            }
          }}
        >
          <Box sx={{ position: 'relative', zIndex: 1, width: '100%' }}>
          <Box>
              <Typography 
                variant="h4" 
                fontWeight="bold"
                sx={{ color: '#fff' }}
              >
                Dormitory FAQ
            </Typography>
              <Typography 
                variant="body1" 
                sx={{ color: 'rgba(255,255,255,0.9)' }}
              >
                Find answers to all your questions about dormitory life and policies
            </Typography>
            </Box>
          </Box>
        </Box>

        {/* Main Search Bar */}
        <Box sx={{ mb: 4 }}>
          <Paper 
            elevation={0}
            sx={{ 
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              px: 2,
              py: 1,
            }}
          >
            <SearchIcon sx={{ color: 'rgba(255, 255, 255, 0.5)', mr: 1 }} />
          <TextField
              placeholder="Search for answers..."
              variant="standard"
            fullWidth
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
                disableUnderline: true,
              sx: {
                color: '#fff',
                  '&::placeholder': {
                    color: 'rgba(255, 255, 255, 0.5)',
                  }
              }
            }}
          />
          </Paper>
        </Box>

        {/* FAQ Content with Sidebar Layout */}
        <Box sx={{ display: 'flex', gap: 3 }}>
          {/* Category Sidebar */}
          <Box
            sx={{ 
              width: '240px',
              minWidth: '240px',
              borderRadius: '8px',
              background: 'rgba(15, 15, 15, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              p: 2,
              height: 'fit-content',
              position: 'sticky',
              top: 24,
              display: { xs: 'block', sm: 'block', md: 'block' },
            }}
          >
            <Typography 
              variant="subtitle1" 
              fontWeight="bold" 
              sx={{ 
                mb: 2, 
            display: 'flex', 
                alignItems: 'center', 
                gap: 1,
                color: 'rgba(255,255,255,0.9)',
                pb: 1.5,
                borderBottom: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <FilterIcon sx={{ color: GREEN_MAIN, fontSize: '1rem' }} />
              Browse Categories
            </Typography>

            <Stack spacing={0.5}>
              <Button
                key="all"
                startIcon={<FAQIcon sx={{ color: activeCategory === 'all' ? 'white' : GREEN_MAIN }} />}
                variant={activeCategory === 'all' ? "contained" : "text"}
                onClick={() => handleCategoryChange('all')}
                sx={{
                  justifyContent: 'flex-start',
                  textAlign: 'left',
                  py: 1,
                  px: 1.5,
                  borderRadius: '6px',
                  backgroundColor: activeCategory === 'all' 
                    ? GREEN_MAIN 
                    : 'transparent',
                  color: activeCategory === 'all' 
                    ? 'white' 
                    : 'rgba(255,255,255,0.9)',
                  '&:hover': {
                    backgroundColor: activeCategory === 'all' 
                      ? GREEN_DARK 
                      : 'rgba(255,255,255,0.05)',
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                All FAQs
                <Chip
                  size="small"
                  label={faqs.length}
                  sx={{
                    ml: 1,
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    height: '20px',
                    minWidth: '20px',
                    fontSize: '0.7rem',
                  }}
                />
              </Button>
              {categories.filter(c => c.id !== 'all').map((category) => (
                <Button
                  key={category.id}
                  startIcon={<Box 
                    component="span" 
                    sx={{ 
                      color: activeCategory === category.id ? 'white' : GREEN_MAIN,
                      '& .MuiSvgIcon-root': { 
                        fontSize: '1.2rem',
                      }
                    }}
                  >
                    {category.icon}
                  </Box>}
                  variant={activeCategory === category.id ? "text" : "text"}
                  onClick={() => handleCategoryChange(category.id)}
                  sx={{
                    justifyContent: 'flex-start',
                    textAlign: 'left',
                    py: 1,
                    px: 1.5,
                    borderRadius: '6px',
                    backgroundColor: activeCategory === category.id 
                      ? GREEN_MAIN 
                      : 'transparent',
                    color: activeCategory === category.id 
                      ? 'white' 
                      : 'rgba(255,255,255,0.8)',
                    '&:hover': {
                      backgroundColor: activeCategory === category.id 
                        ? GREEN_DARK 
                        : 'rgba(255,255,255,0.05)',
                    },
                    transition: 'all 0.2s ease',
                  }}
                >
                  {category.label}
                  {activeCategory === category.id && (
                    <Chip
                      size="small"
                      label={filteredFaqs.filter(faq => faq.category === category.id).length}
                      sx={{
                        ml: 1,
                        backgroundColor: 'rgba(255,255,255,0.2)',
                        color: 'white',
                        height: '20px',
                        minWidth: '20px',
                        fontSize: '0.7rem',
                }}
              />
                  )}
                </Button>
            ))}
            </Stack>
          </Box>

          {/* FAQ Content */}
          <Box sx={{ flexGrow: 1 }}>
          {filteredFaqs.length === 0 ? (
            <Paper sx={{ 
              p: 4, 
                borderRadius: '8px',
              textAlign: 'center',
                background: 'rgba(15, 15, 15, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
            }}>
              <Typography variant="h6" gutterBottom>
                No FAQs Found
              </Typography>
              <Typography variant="body2" color="rgba(255,255,255,0.7)" sx={{ mb: 3 }}>
                Try adjusting your search or category filter
              </Typography>
              <Button 
                variant="outlined" 
                onClick={() => {
                  setSearchTerm('');
                  setActiveCategory('all');
                }}
                sx={{
                  borderColor: GREEN_MAIN,
                  color: GREEN_MAIN,
                  '&:hover': {
                    borderColor: GREEN_DARK,
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  }
                }}
              >
                Reset Filters
              </Button>
            </Paper>
          ) : (
              filteredFaqs.map((faq) => (
                <Box 
                key={faq.id}
                sx={{
                  mb: 2,
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: '8px',
                  overflow: 'hidden',
                  }}
                >
                  <Button
                    onClick={() => handlePanelChange(`panel${faq.id}`)(null, expandedPanel !== `panel${faq.id}`)}
                    fullWidth
                  sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      textAlign: 'left',
                      background: 'rgba(15, 15, 15, 0.6)',
                      color: '#fff',
                      p: 2,
                      borderRadius: expandedPanel === `panel${faq.id}` ? '8px 8px 0 0' : '8px',
                      '&:hover': {
                        background: 'rgba(30, 30, 30, 0.6)',
                    }
                  }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexGrow: 1 }}>
                      <Typography variant="body1" fontWeight="medium">
                    {faq.question}
                  </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 2 }}>
                  <Chip 
                    label={categories.find(cat => cat.id === faq.category)?.label} 
                    size="small"
                    sx={{
                      backgroundColor: 'rgba(16, 185, 129, 0.1)',
                      color: GREEN_MAIN,
                      fontSize: '0.7rem',
                      height: '24px',
                        }}
                      />
                      <ExpandMoreIcon 
                        sx={{ 
                          color: GREEN_MAIN,
                          transform: expandedPanel === `panel${faq.id}` ? 'rotate(180deg)' : 'rotate(0)',
                          transition: 'transform 0.3s',
                    }}
                  />
                    </Box>
                  </Button>
                  {expandedPanel === `panel${faq.id}` && (
                    <Box 
                      sx={{ 
                        p: 2.5, 
                        background: 'rgba(10, 10, 10, 0.6)',
                        borderTop: '1px solid rgba(255, 255, 255, 0.06)'
                      }}
                    >
                  <Typography variant="body2" color="rgba(255,255,255,0.8)" sx={{ lineHeight: 1.7 }}>
                    {faq.answer}
                  </Typography>
                    </Box>
                  )}
                </Box>
            ))
          )}

            {/* Scroll to top button */}
            <Fade in={showScrollTop}>
              <IconButton
                onClick={handleScrollToTop}
                  sx={{
                  position: 'fixed',
                  bottom: 20,
                  right: 20,
                  backgroundColor: GREEN_MAIN,
                  color: 'white',
                    '&:hover': {
                    backgroundColor: GREEN_DARK,
                  },
                  zIndex: 10,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                  }}
                >
                <ScrollTopIcon />
              </IconButton>
            </Fade>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default StudentFAQS;

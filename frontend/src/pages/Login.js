import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  Grid,
  Divider,
  useMediaQuery,
  InputAdornment,
  IconButton,
} from "@mui/material";
import { useFormik } from "formik";
import * as yup from "yup";
import axios from "axios";
import SchoolIcon from "@mui/icons-material/School";
import PersonIcon from "@mui/icons-material/Person";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import SecurityIcon from "@mui/icons-material/Security";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import EmailIcon from "@mui/icons-material/Email";
import LockIcon from "@mui/icons-material/Lock";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { styled, useTheme } from '@mui/material/styles';

// API Base URL - change this to match your backend
const API_BASE_URL = "/api"; // Using relative path instead of hardcoded localhost

// Color constants
const EGGSHELL_WHITE = "#F0EAD6";
const EMERALD_GREEN = "#50C878";
const DARK_EMERALD = "#2E8B57";
const LIGHT_EMERALD = "#8FE3B6";
const NAVY_BLUE = "#0A2647";
const LIGHT_NAVY = "#184E77";

// Styled components
const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: '8px',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    transition: 'all 0.3s ease',
    '&:hover': {
      backgroundColor: '#ffffff',
    },
    '&.Mui-focused': {
      backgroundColor: '#ffffff',
    },
    '& fieldset': {
      borderColor: 'rgba(10, 38, 71, 0.1)',
    },
    '&.Mui-focused fieldset': {
      borderColor: NAVY_BLUE,
    },
    '& .MuiInputAdornment-root': {
      color: '#64748b',
    },
  },
  '& .MuiInputLabel-root': {
    fontSize: '0.95rem',
    marginLeft: '8px',
    fontWeight: 500,
    color: '#64748b',
    '&.Mui-focused': {
      color: NAVY_BLUE,
    },
  },
  '& .MuiInputBase-input': {
    color: '#2E4052',
    padding: '14px 14px',
  },
}));

const StyledButton = styled(Button)(({ theme }) => ({
  borderRadius: '8px',
  padding: '12px 0',
  textTransform: 'none',
  fontWeight: 600,
  fontSize: '1rem',
  boxShadow: 'none',
  transition: 'all 0.3s ease',
  background: NAVY_BLUE,
  '&:hover': {
    background: NAVY_BLUE,
    opacity: 0.9,
    boxShadow: '0 4px 8px rgba(10, 38, 71, 0.2)',
  },
}));

// Validation schema
const validationSchema = yup.object({
  identifier: yup.string().required("This field is required"),
  password: yup
    .string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),
});

const Login = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState("student");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleRoleChange = (_, newValue) => {
    setRole(newValue);
    setError("");
    formik.resetForm();
  };

  const handlePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const formik = useFormik({
    initialValues: {
      identifier: "",
      password: "",
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      setLoading(true);
      setError("");

      let endpoint = "";
      let redirectPath = "";

      // Set endpoint based on role
      if (role === "student") {
        endpoint = `${API_BASE_URL}/students/login`;
        redirectPath = "/student-dashboard";
      } else if (role === "staff") {
        endpoint = `${API_BASE_URL}/staff/login`;
        redirectPath = "/staff-dashboard";
      } else if (role === "admin") {
        endpoint = `${API_BASE_URL}/admin/login`;
        redirectPath = "/admin-dashboard";
      }

      try {
        // Use fetch with credentials instead of axios
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            identifier: values.identifier,
            password: values.password,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Login failed");
        }

        const data = await response.json();

        // Store user data in localStorage
        localStorage.setItem("userRole", role);
        localStorage.setItem("userData", JSON.stringify(data));

        // Set session flag to indicate successful login
        sessionStorage.setItem("justLoggedIn", "true");

        // Redirect based on role
        navigate(redirectPath);
      } catch (err) {
        console.error("Login error:", err);
        setError(
          err.message || "Login failed. Please try again."
        );
      } finally {
        setLoading(false);
      }
    },
  });

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        overflow: "hidden",
      }}
    >
      {/* Left side - Image and branding */}
      <Box
        sx={{
          flex: { xs: 0, md: "0 0 50%" },
          display: { xs: "none", md: "flex" },
          position: "relative",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          background: `linear-gradient(135deg, ${NAVY_BLUE} 0%, ${LIGHT_NAVY} 100%)`,
          color: "white",
          overflow: "hidden",
        }}
      >
        {/* Animated background elements */}
        <Box sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: 0.1,
          background: "url('https://www.transparenttextures.com/patterns/cubes.png')",
          zIndex: 0,
        }} />
        
        {/* Emerald green accents */}
        <Box
          sx={{
            position: "absolute",
            top: "10%",
            left: "5%",
            width: "180px",
            height: "180px",
            borderRadius: "50%",
            background: `radial-gradient(circle, ${EMERALD_GREEN} 0%, transparent 70%)`,
            opacity: 0.15,
            zIndex: 0,
          }}
        />
        
        <Box
          sx={{
            position: "absolute",
            bottom: "15%",
            right: "10%",
            width: "250px",
            height: "250px",
            borderRadius: "50%",
            background: `radial-gradient(circle, ${EMERALD_GREEN} 0%, transparent 70%)`,
            opacity: 0.15,
            zIndex: 0,
          }}
        />
        
        {/* Fixed position decorative elements */}
        {[...Array(4)].map((_, i) => (
          <Box
            key={i}
            sx={{
              position: "absolute",
              width: ["120px", "180px", "150px", "200px"][i],
              height: ["120px", "180px", "150px", "200px"][i],
              borderRadius: "50%",
              border: `1px solid rgba(255, 255, 255, ${0.05 + i * 0.02})`,
              top: [`${20 + i * 15}%`, `${60 - i * 12}%`, `${30 + i * 20}%`, `${70 - i * 10}%`][i],
              left: [`${70 - i * 20}%`, `${25 + i * 15}%`, `${60 - i * 15}%`, `${30 + i * 10}%`][i],
              zIndex: 0,
              opacity: 0.6,
            }}
          />
        ))}
        
        {/* Logo and content */}
        <Box
          sx={{
            position: "relative", 
            zIndex: 1, 
            textAlign: "center", 
            maxWidth: "80%",
            p: 4,
          }}
        >
          <Box 
            sx={{
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center", 
              mb: 3,
            }}
          >
            <Box
              sx={{
                backgroundColor: EMERALD_GREEN,
                width: "60px",
                height: "60px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "8px",
                mr: 2,
                transform: "rotate(10deg)",
              }}
            >
              <SchoolIcon sx={{ fontSize: 40, color: "white" }} />
            </Box>
            <Typography 
              variant="h2" 
              fontWeight="bold"
            >
              Dormie
            </Typography>
          </Box>
          
          <Typography 
            variant="h5" 
            sx={{ 
              mb: 4,
              fontWeight: 300,
              textShadow: "0 2px 10px rgba(0,0,0,0.1)"
            }}
          >
            School Dormitory Management System
          </Typography>
          
          <Box 
            sx={{
              mb: 5,
            }}
          >
            <Box sx={{ mb: 2, display: "flex", alignItems: "center", gap: 2 }}>
              <CheckCircleIcon sx={{ color: EMERALD_GREEN }} />
              <Typography variant="body1" sx={{ fontSize: "1.1rem", textAlign: "left" }}>
                Efficient room allocation system
              </Typography>
            </Box>
            <Box sx={{ mb: 2, display: "flex", alignItems: "center", gap: 2 }}>
              <CheckCircleIcon sx={{ color: EMERALD_GREEN }} />
              <Typography variant="body1" sx={{ fontSize: "1.1rem", textAlign: "left" }}>
                Real-time maintenance request tracking
              </Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <CheckCircleIcon sx={{ color: EMERALD_GREEN }} />
              <Typography variant="body1" sx={{ fontSize: "1.1rem", textAlign: "left" }}>
                Secure access for students, staff & admin
              </Typography>
            </Box>
          </Box>
          
          <Box 
            sx={{ 
              display: "flex", 
              justifyContent: "space-around", 
              mt: 6,
              p: 3,
              backdropFilter: "blur(5px)",
              backgroundColor: "rgba(255, 255, 255, 0.1)",
              borderRadius: "16px",
              border: "1px solid rgba(255, 255, 255, 0.2)",
            }}
          >
            <Box sx={{ textAlign: "center" }}>
              <Typography variant="h3" fontWeight="bold">500+</Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>Students</Typography>
            </Box>
            <Divider orientation="vertical" flexItem sx={{ bgcolor: 'rgba(255,255,255,0.2)' }} />
            <Box sx={{ textAlign: "center" }}>
              <Typography variant="h3" fontWeight="bold">50+</Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>Staff</Typography>
            </Box>
            <Divider orientation="vertical" flexItem sx={{ bgcolor: 'rgba(255,255,255,0.2)' }} />
            <Box sx={{ textAlign: "center" }}>
              <Typography variant="h3" fontWeight="bold">100+</Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>Rooms</Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Right side - Login form */}
      <Box
        sx={{
          flex: { xs: "1 1 100%", md: "0 0 50%" },
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          backgroundColor: EGGSHELL_WHITE,
        }}
      >
        <Box
          sx={{
            maxWidth: "450px", 
            width: "100%", 
            mx: "auto",
            px: { xs: 3, sm: 4 },
          }}
        >
          <Box sx={{ mb: 5, textAlign: "left" }}>
            <Typography 
              variant="h4" 
              component="h1" 
              fontWeight="bold" 
              color={NAVY_BLUE}
              sx={{ mb: 1.5 }}
            >
              Welcome Back
            </Typography>
            <Typography variant="body1" color="#64748b">
              Please sign in to your account to continue
            </Typography>
          </Box>

          {error && (
            <Alert
              severity="error"
              sx={{
                mb: 3,
                borderRadius: "8px",
              }}
            >
              {error}
            </Alert>
          )}

          <Box
            sx={{
              mb: 4,
            }}
          >
            <Tabs
              value={role}
              onChange={handleRoleChange}
              variant="fullWidth"
              sx={{
                mb: 4,
                "& .MuiTabs-indicator": {
                  backgroundColor: EMERALD_GREEN,
                  height: "3px",
                  borderRadius: "3px",
                },
                "& .MuiTab-root": {
                  color: "#64748b",
                  fontWeight: 600,
                  fontSize: "0.95rem",
                  minHeight: "48px",
                  transition: "all 0.3s ease",
                  "&.Mui-selected": {
                    color: NAVY_BLUE,
                  },
                  "&:hover": {
                    color: EMERALD_GREEN,
                  }
                },
              }}
            >
              <Tab 
                label="Student" 
                value="student" 
                icon={<SchoolIcon sx={{ color: role === "student" ? EMERALD_GREEN : "#64748b" }} />} 
                iconPosition="start" 
              />
              <Tab 
                label="Staff" 
                value="staff" 
                icon={<PersonIcon sx={{ color: role === "staff" ? EMERALD_GREEN : "#64748b" }} />} 
                iconPosition="start"
              />
              <Tab 
                label="Admin" 
                value="admin" 
                icon={<AdminPanelSettingsIcon sx={{ color: role === "admin" ? EMERALD_GREEN : "#64748b" }} />} 
                iconPosition="start"
              />
            </Tabs>

            <form onSubmit={formik.handleSubmit}>
              <StyledTextField
                fullWidth
                id="identifier"
                name="identifier"
                placeholder={role === "student" ? "Email Address" : "Username"}
                variant="outlined"
                value={formik.values.identifier}
                onChange={formik.handleChange}
                error={formik.touched.identifier && Boolean(formik.errors.identifier)}
                helperText={formik.touched.identifier && formik.errors.identifier}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon />
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 3 }}
              />
              <StyledTextField
                fullWidth
                id="password"
                name="password"
                placeholder="Password"
                type={showPassword ? "text" : "password"}
                variant="outlined"
                value={formik.values.password}
                onChange={formik.handleChange}
                error={formik.touched.password && Boolean(formik.errors.password)}
                helperText={formik.touched.password && formik.errors.password}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={handlePasswordVisibility}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOffIcon sx={{ color: NAVY_BLUE }} /> : <VisibilityIcon sx={{ color: NAVY_BLUE }} />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 3 }}
              />
              
              <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                <SecurityIcon sx={{ color: "#64748b", mr: 1, fontSize: 16 }} />
                <Typography variant="caption" color="#64748b">
                  Secure encrypted login
                </Typography>
              </Box>
              
              <StyledButton
                type="submit"
                fullWidth
                disabled={loading}
                sx={{ 
                  py: 1.5,
                  fontSize: "1rem",
                }}
              >
                {loading ? (
                  <CircularProgress size={24} sx={{ color: "#fff" }} />
                ) : (
                  "Sign In"
                )}
              </StyledButton>
            </form>
          </Box>
          
          <Box 
            sx={{ 
              mt: 6, 
              textAlign: "center", 
            }}
          >
            <Typography variant="body2" color="#64748b" sx={{ fontSize: "0.875rem" }}>
              © {new Date().getFullYear()} Dormie School Management System • All rights reserved
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Login;

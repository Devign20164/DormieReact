import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Tab,
  Tabs,
  Alert,
  CircularProgress,
} from "@mui/material";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useSocket } from "../context/SocketContext";

const Login = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState("student");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { socket } = useSocket();

  const validationSchema = Yup.object({
    identifier: Yup.string()
      .required("Required")
      .when("role", {
        is: "student",
        then: () => Yup.string().email("Invalid email address"),
        otherwise: () => Yup.string(),
      }),
    password: Yup.string()
      .required("Required")
      .min(6, "Password must be at least 6 characters"),
  });

  const formik = useFormik({
    initialValues: {
      identifier: "",
      password: "",
      role: role,
    },
    validationSchema,
    onSubmit: async (values) => {
      setLoading(true);
      setError("");
      try {
        let endpoint = "";
        switch (role) {
          case "student":
            endpoint = "/api/students/login";
            break;
          case "staff":
            endpoint = "/api/staff/login";
            break;
          case "admin":
            endpoint = "/api/admin/login";
            break;
          default:
            endpoint = "/api/students/login";
        }

        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
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

        // Initialize socket connection if available
        if (socket && data.socketInitRequired && data.socketUserId) {
          console.log(
            "Initializing socket connection for user:",
            data.socketUserId
          );
          socket.emit("join", data.socketUserId);
        }

        // Redirect based on role
        switch (role) {
          case "student":
            navigate("/student-dashboard");
            break;
          case "staff":
            navigate("/staff-dashboard");
            break;
          case "admin":
            navigate("/admin-dashboard");
            break;
          default:
            navigate("/student-dashboard");
        }
      } catch (err) {
        setError(err.message || "An error occurred during login");
      } finally {
        setLoading(false);
      }
    },
  });

  // Handle role change
  const handleRoleChange = (_, newValue) => {
    setRole(newValue);
    formik.setFieldValue("role", newValue);
    formik.setFieldValue("identifier", "");
    formik.setFieldValue("password", "");
    setError("");
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(145deg, #141414 0%, #0A0A0A 100%)",
        position: "relative",
        overflow: "hidden",
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `
            radial-gradient(circle at 0% 0%, rgba(16, 185, 129, 0.03) 0%, transparent 30%),
            radial-gradient(circle at 100% 0%, rgba(5, 150, 105, 0.03) 0%, transparent 30%),
            radial-gradient(circle at 100% 100%, rgba(4, 120, 87, 0.03) 0%, transparent 30%),
            radial-gradient(circle at 0% 100%, rgba(16, 185, 129, 0.03) 0%, transparent 30%)
          `,
          animation: "gradientMove 15s ease infinite alternate",
        },
        "&::after": {
          content: '""',
          position: "absolute",
          inset: 0,
          background: "transparent",
          backdropFilter: "blur(80px)",
          zIndex: 0,
        },
        "@keyframes gradientMove": {
          "0%": {
            transform: "scale(1) rotate(0deg)",
          },
          "50%": {
            transform: "scale(1.5) rotate(180deg)",
          },
          "100%": {
            transform: "scale(1) rotate(360deg)",
          },
        },
        "@keyframes particleFloat": {
          "0%, 100%": {
            transform: "translateY(0) translateX(0)",
            opacity: 0,
          },
          "50%": {
            transform: "translateY(-150px) translateX(50px)",
            opacity: 1,
          },
        },
      }}
    >
      {/* Animated Particles */}
      {[...Array(20)].map((_, index) => (
        <Box
          key={index}
          sx={{
            position: "absolute",
            width: "4px",
            height: "4px",
            background: "rgba(16, 185, 129, 0.15)",
            borderRadius: "50%",
            top: Math.random() * 100 + "%",
            left: Math.random() * 100 + "%",
            animation: `particleFloat ${
              Math.random() * 10 + 10
            }s ease-in-out infinite`,
            animationDelay: `${Math.random() * 5}s`,
            "&::before": {
              content: '""',
              position: "absolute",
              inset: "-2px",
              background: "rgba(16, 185, 129, 0.05)",
              borderRadius: "50%",
              filter: "blur(2px)",
            },
          }}
        />
      ))}
      <Container
        component="main"
        maxWidth="xs"
        sx={{ position: "relative", zIndex: 1 }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <Paper
            elevation={3}
            sx={{
              p: 4,
              width: "100%",
              background:
                "linear-gradient(145deg, rgba(20, 20, 20, 0.95) 0%, rgba(10, 10, 10, 0.95) 100%)",
              color: "#fff",
              borderRadius: "20px",
              border: "1px solid rgba(16, 185, 129, 0.1)",
              boxShadow: `
                0 0 20px rgba(16, 185, 129, 0.2),
                0 0 40px rgba(16, 185, 129, 0.1),
                inset 0 0 20px rgba(16, 185, 129, 0.05)
              `,
              position: "relative",
              backdropFilter: "blur(10px)",
              "&::after": {
                content: '""',
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(145deg, rgba(255, 255, 255, 0.03) 0%, transparent 100%)",
                borderRadius: "20px",
                pointerEvents: "none",
              },
            }}
          >
            <Typography
              component="h1"
              variant="h4"
              align="center"
              gutterBottom
              sx={{
                color: "#fff",
                fontWeight: 600,
                textShadow: "0 0 10px rgba(16, 185, 129, 0.5)",
                mb: 3,
                background: "linear-gradient(90deg, #fff, #10B981)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Dormie Login
            </Typography>

            <Tabs
              value={role}
              onChange={handleRoleChange}
              centered
              sx={{
                mb: 4,
                "& .MuiTabs-indicator": {
                  backgroundColor: "#10B981",
                  height: "3px",
                  borderRadius: "3px",
                  boxShadow: "0 0 10px rgba(16, 185, 129, 0.5)",
                },
                "& .MuiTab-root": {
                  color: "#6B7280",
                  transition: "all 0.3s ease",
                  "&.Mui-selected": {
                    color: "#10B981",
                    textShadow: "0 0 10px rgba(16, 185, 129, 0.5)",
                  },
                  "&:hover": {
                    color: "#10B981",
                    textShadow: "0 0 10px rgba(16, 185, 129, 0.3)",
                  },
                },
              }}
            >
              <Tab label="Student" value="student" />
              <Tab label="Staff" value="staff" />
              <Tab label="Admin" value="admin" />
            </Tabs>

            {error && (
              <Alert
                severity="error"
                sx={{
                  mb: 3,
                  background:
                    "linear-gradient(90deg, rgba(239, 68, 68, 0.1) 0%, transparent 100%)",
                  color: "#fff",
                  border: "1px solid rgba(239, 68, 68, 0.2)",
                  backdropFilter: "blur(10px)",
                  "& .MuiAlert-icon": {
                    color: "#EF4444",
                  },
                }}
              >
                {error}
              </Alert>
            )}

            <form onSubmit={formik.handleSubmit}>
              <TextField
                fullWidth
                id="identifier"
                name="identifier"
                label={role === "student" ? "Email Address" : "Name"}
                value={formik.values.identifier}
                onChange={formik.handleChange}
                error={
                  formik.touched.identifier && Boolean(formik.errors.identifier)
                }
                helperText={
                  formik.touched.identifier && formik.errors.identifier
                }
                sx={{
                  mb: 2,
                  "& .MuiOutlinedInput-root": {
                    color: "#fff",
                    "& fieldset": {
                      borderColor: "rgba(255,255,255,0.1)",
                      transition: "all 0.3s ease",
                    },
                    "&:hover fieldset": {
                      borderColor: "rgba(16, 185, 129, 0.5)",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "#10B981",
                      boxShadow: "0 0 10px rgba(16, 185, 129, 0.2)",
                    },
                  },
                  "& .MuiInputLabel-root": {
                    color: "#9CA3AF",
                    "&.Mui-focused": {
                      color: "#10B981",
                    },
                  },
                  "& .MuiFormHelperText-root": {
                    color: "#EF4444",
                  },
                }}
              />
              <TextField
                fullWidth
                id="password"
                name="password"
                label="Password"
                type="password"
                value={formik.values.password}
                onChange={formik.handleChange}
                error={
                  formik.touched.password && Boolean(formik.errors.password)
                }
                helperText={formik.touched.password && formik.errors.password}
                sx={{
                  mb: 3,
                  "& .MuiOutlinedInput-root": {
                    color: "#fff",
                    "& fieldset": {
                      borderColor: "rgba(255,255,255,0.1)",
                      transition: "all 0.3s ease",
                    },
                    "&:hover fieldset": {
                      borderColor: "rgba(16, 185, 129, 0.5)",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "#10B981",
                      boxShadow: "0 0 10px rgba(16, 185, 129, 0.2)",
                    },
                  },
                  "& .MuiInputLabel-root": {
                    color: "#9CA3AF",
                    "&.Mui-focused": {
                      color: "#10B981",
                    },
                  },
                  "& .MuiFormHelperText-root": {
                    color: "#EF4444",
                  },
                }}
              />
              <Button
                type="submit"
                fullWidth
                disabled={loading}
                sx={{
                  mt: 2,
                  mb: 2,
                  py: 1.5,
                  background:
                    "linear-gradient(90deg, #10B981 0%, #059669 100%)",
                  color: "#fff",
                  borderRadius: "10px",
                  textTransform: "none",
                  fontSize: "1.1rem",
                  fontWeight: 500,
                  boxShadow: "0 4px 12px rgba(16, 185, 129, 0.2)",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    transform: "translateY(-2px)",
                    boxShadow: "0 6px 15px rgba(16, 185, 129, 0.3)",
                    background:
                      "linear-gradient(90deg, #059669 0%, #047857 100%)",
                  },
                  "&:disabled": {
                    background:
                      "linear-gradient(90deg, #6B7280 0%, #4B5563 100%)",
                    boxShadow: "none",
                    transform: "none",
                  },
                }}
              >
                {loading ? (
                  <CircularProgress size={24} sx={{ color: "#fff" }} />
                ) : (
                  "Login"
                )}
              </Button>
            </form>
          </Paper>
        </Box>
      </Container>
    </Box>
  );
};

export default Login;

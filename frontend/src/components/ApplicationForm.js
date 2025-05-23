import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stepper,
  Step,
  StepLabel,
  Grid,
  MenuItem,
  Typography,
  Box,
  Divider,
  FormControlLabel,
  Checkbox,
  Link,
} from '@mui/material';
import { styled, alpha } from '@mui/material/styles';

const Input = styled('input')({
  display: 'none',
});

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    overflow: 'hidden',
    position: 'relative',
  },
}));

const StyledDialogTitle = styled(DialogTitle)(({ theme }) => ({
  color: '#000000',
  fontWeight: 'bold',
  fontSize: '1.5rem',
  textAlign: 'center',
  position: 'relative',
  zIndex: 1,
  padding: '24px',
  '&:after': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'url("https://www.transparenttextures.com/patterns/cubes.png")',
    opacity: 0.1,
    zIndex: -1,
  }
}));

const StyledDialogContent = styled(DialogContent)(({ theme }) => ({
  position: 'relative',
  padding: '24px',
  '&:before': {
    content: '""',
    position: 'absolute',
    top: '10%',
    left: '5%',
    width: '180px',
    height: '180px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, #2E8B57 0%, transparent 70%)',
    opacity: 0.15,
    zIndex: 0,
  },
  '&:after': {
    content: '""',
    position: 'absolute',
    bottom: '15%',
    right: '10%',
    width: '250px',
    height: '250px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, #2E8B57 0%, transparent 70%)',
    opacity: 0.15,
    zIndex: 0,
  }
}));

const StyledStepper = styled(Stepper)(({ theme }) => ({
  position: 'relative',
  zIndex: 1,
  '& .MuiStepLabel-label': {
    color: '#000000',
    fontWeight: 500,
  },
  '& .MuiStepIcon-root': {
    color: '#2E8B57',
    '&.Mui-active': {
      color: '#2E8B57',
    },
    '&.Mui-completed': {
      color: '#2E8B57',
    },
  }
}));

const StyledButton = styled(Button)(({ theme }) => ({
  borderRadius: '8px',
  padding: '12px 24px',
  textTransform: 'none',
  fontWeight: 600,
  fontSize: '1rem',
  boxShadow: 'none',
  transition: 'all 0.3s ease',
  '&.MuiButton-contained': {
    backgroundColor: '#2E8B57',
    color: '#ffffff',
    '&:hover': {
      backgroundColor: alpha('#2E8B57', 0.9),
      boxShadow: '0 4px 8px rgba(46, 139, 87, 0.2)',
    },
  },
  '&.MuiButton-text': {
    color: '#000000',
    '&:hover': {
      backgroundColor: alpha('#000000', 0.04),
    },
  }
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiInputBase-input': {
    color: '#000000',
  },
  '& .MuiInputLabel-root': {
    color: '#000000',
  },
  '& .MuiSelect-select': {
    color: '#000000',
    width: '100%',
  },
  '& .MuiMenuItem-root': {
    color: '#000000',
    width: '100%',
  },
  '& .MuiOutlinedInput-root': {
    '& fieldset': {
      borderColor: 'rgba(0, 0, 0, 0.23)',
      borderWidth: '1px',
    },
    '&:hover fieldset': {
      borderColor: '#2E8B57',
      borderWidth: '1px',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#2E8B57',
      borderWidth: '2px',
    },
  },
  marginBottom: '8px',
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
  color: '#000000',
  fontWeight: 600,
  fontSize: '1.1rem',
  marginBottom: '16px',
  marginTop: '24px',
  '&:first-of-type': {
    marginTop: '0',
  }
}));

const steps = [
  'Personal Information',
  'School Information',
  'Medical Information',
  'Dormitory Preferences',
  'Upload Picture'
];

const ApplicationForm = ({ open, onClose }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [errors, setErrors] = useState({});
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsDialogOpen, setTermsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    // Personal Information
    name: '',
    email: '',
    contactInfo: '',
    gender: '',
    age: '',
    address: '',
    citizenshipStatus: '',
    religion: '',
    fatherName: '',
    motherName: '',
    fatherContact: '',
    motherContact: '',
    parentsAddress: '',
    emergencyContactName: '',
    emergencyContactNumber: '',
    
    // School Information
    studentDormNumber: '',
    courseYear: '',
    
    // Medical Information
    height: '',
    weight: '',
    medicalHistory: '',
    
    // Profile Picture
    profilePicture: null,
    
    // Adding preferences
    buildingPreference: 'Male Building',
    occupancyPreference: 'Single Occupancy',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleFileChange = (e) => {
    setFormData(prev => ({
      ...prev,
      profilePicture: e.target.files[0]
    }));
  };

  const validateStep = (step) => {
    const newErrors = {};
    
    switch (step) {
      case 0: // Personal Information
        if (!formData.name) newErrors.name = 'Name is required';
        if (!formData.email) newErrors.email = 'Email is required';
        if (!formData.contactInfo) newErrors.contactInfo = 'Contact Info is required';
        if (!formData.gender) newErrors.gender = 'Gender is required';
        if (!formData.age) newErrors.age = 'Age is required';
        if (!formData.address) newErrors.address = 'Address is required';
        if (!formData.citizenshipStatus) newErrors.citizenshipStatus = 'Citizenship Status is required';
        if (!formData.religion) newErrors.religion = 'Religion is required';
        if (!formData.fatherName) newErrors.fatherName = "Father's Name is required";
        if (!formData.motherName) newErrors.motherName = "Mother's Name is required";
        if (!formData.fatherContact) newErrors.fatherContact = "Father's Contact is required";
        if (!formData.motherContact) newErrors.motherContact = "Mother's Contact is required";
        if (!formData.parentsAddress) newErrors.parentsAddress = "Parents' Address is required";
        if (!formData.emergencyContactName) newErrors.emergencyContactName = 'Emergency Contact Name is required';
        if (!formData.emergencyContactNumber) newErrors.emergencyContactNumber = 'Emergency Contact Number is required';
        break;
      case 1: // School Information
        if (!formData.studentDormNumber) newErrors.studentDormNumber = 'Student Dorm Number is required';
        if (!formData.courseYear) newErrors.courseYear = 'Course Year is required';
        break;
      case 2: // Medical Information
        if (!formData.height) newErrors.height = 'Height is required';
        if (!formData.weight) newErrors.weight = 'Weight is required';
        break;
      case 3: // Dormitory Preferences
        if (!formData.buildingPreference) newErrors.buildingPreference = 'Building Preference is required';
        if (!formData.occupancyPreference) newErrors.occupancyPreference = 'Room Type Preference is required';
        break;
      case 4: // Upload Picture
        if (!formData.profilePicture) newErrors.profilePicture = 'Profile Picture is required';
        if (!termsAccepted) newErrors.terms = 'You must accept the terms and conditions to proceed';
        break;
      default:
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleCancel = () => {
    setFormData({
      name: '',
      email: '',
      contactInfo: '',
      gender: '',
      age: '',
      address: '',
      citizenshipStatus: '',
      religion: '',
      fatherName: '',
      motherName: '',
      fatherContact: '',
      motherContact: '',
      parentsAddress: '',
      emergencyContactName: '',
      emergencyContactNumber: '',
      studentDormNumber: '',
      courseYear: '',
      height: '',
      weight: '',
      medicalHistory: '',
      profilePicture: null,
      buildingPreference: 'Male Building',
      occupancyPreference: 'Single Occupancy',
    });
    setActiveStep(0);
    setErrors({});
    onClose();
  };

  const handleSubmit = async () => {
    try {
      // Create FormData to handle file upload
      const formDataToSend = new FormData();

      // Add all form fields to FormData
      Object.keys(formData).forEach(key => {
        if (key === 'profilePicture' && formData[key]) {
          formDataToSend.append('profilePicture', formData[key]);
        } else if (key === 'buildingPreference' || key === 'occupancyPreference') {
          // Skip these as they'll be added as part of preferences object
        } else {
          formDataToSend.append(key, formData[key]);
        }
      });

      // Add preferences as a structured object
      const preferences = {
        buildingPreference: formData.buildingPreference,
        occupancyPreference: formData.occupancyPreference
      };
      formDataToSend.append('preferences', JSON.stringify(preferences));

      // Send application data to backend
      const response = await fetch('/api/students/apply', {
        method: 'POST',
        body: formDataToSend // Send FormData instead of JSON
      });

      if (!response.ok) {
        throw new Error('Failed to submit application');
      }

      // Close the form
      onClose();

      // Show success message
      alert('Application submitted successfully! Please check your email for confirmation.');
    } catch (error) {
      console.error('Error submitting application:', error);
      alert('Failed to submit application. Please try again.');
    }
  };

  // Add handlers for terms and conditions
  const handleTermsAcceptance = (event) => {
    setTermsAccepted(event.target.checked);
    if (event.target.checked && errors.terms) {
      setErrors(prev => ({
        ...prev,
        terms: ''
      }));
    }
  };

  const handleOpenTerms = (event) => {
    event.preventDefault();
    setTermsDialogOpen(true);
  };

  const handleCloseTerms = () => {
    setTermsDialogOpen(false);
  };

  // Add Terms and Conditions Dialog
  const TermsDialog = () => (
    <Dialog
      open={termsDialogOpen}
      onClose={handleCloseTerms}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: '#FFFFFF',
          maxHeight: '80vh',
        }
      }}
    >
      <DialogTitle sx={{ color: '#000000', fontWeight: 'bold' }}>
        Terms and Conditions
      </DialogTitle>
      <DialogContent dividers>
        <Typography variant="body1" sx={{ color: '#000000', mb: 2 }}>
          1. General Terms
        </Typography>
        <Typography variant="body2" sx={{ color: '#000000', mb: 2, pl: 2 }}>
          1.1. The system is designed for the exclusive use of registered students, staff, and administrators of the dormitory.<br />
          1.2. All users must maintain accurate and up-to-date personal information in their profiles.<br />
          1.3. Users are responsible for maintaining the confidentiality of their login credentials.
        </Typography>

        <Typography variant="body1" sx={{ color: '#000000', mb: 2 }}>
          2. Student Responsibilities
        </Typography>
        <Typography variant="body2" sx={{ color: '#000000', mb: 2, pl: 2 }}>
          2.1. Students must:<br />
          - Provide accurate personal and emergency contact information<br />
          - Maintain their room in good condition<br />
          - Follow curfew regulations<br />
          - Report any maintenance issues promptly<br />
          - Pay dormitory fees on time<br />
          - Follow the dormitory's rules and regulations
        </Typography>

        <Typography variant="body1" sx={{ color: '#000000', mb: 2 }}>
          3. Payment Terms
        </Typography>
        <Typography variant="body2" sx={{ color: '#000000', mb: 2, pl: 2 }}>
          3.1. Dormitory fees include:<br />
          - Rental fees<br />
          - Water and electricity charges<br />
          - Other applicable fees<br /><br />
          3.2. Payment requirements:<br />
          - Fees must be paid by the due date<br />
          - Late payments may incur penalties<br />
          - Payment receipts must be kept for records
        </Typography>

        <Typography variant="body1" sx={{ color: '#000000', mb: 2 }}>
          4. Privacy and Data Protection
        </Typography>
        <Typography variant="body2" sx={{ color: '#000000', mb: 2, pl: 2 }}>
          4.1. The system collects and processes:<br />
          - Personal information<br />
          - Contact details<br />
          - Room assignment data<br />
          - Payment information<br />
          - Maintenance records
        </Typography>

        <Typography variant="body1" sx={{ color: '#000000', mb: 2 }}>
          5. Violations and Penalties
        </Typography>
        <Typography variant="body2" sx={{ color: '#000000', pl: 2 }}>
          5.1. Violations may result in:<br />
          - Warning notices<br />
          - Fines<br />
          - Temporary suspension of privileges<br />
          - Dormitory eviction in severe cases
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCloseTerms} sx={{ color: '#2E8B57' }}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );

  const renderPersonalInfo = () => (
    <Grid container spacing={3}>
      {/* Basic Information Section */}
      <Grid item xs={12}>
        <SectionTitle>Basic Information</SectionTitle>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <StyledTextField
              fullWidth
              label="Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              error={!!errors.name}
              helperText={errors.name}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <StyledTextField
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              error={!!errors.email}
              helperText={errors.email}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <StyledTextField
              fullWidth
              label="Contact Info"
              name="contactInfo"
              value={formData.contactInfo}
              onChange={handleChange}
              required
              error={!!errors.contactInfo}
              helperText={errors.contactInfo}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <StyledTextField
              fullWidth
              select
              label="Gender"
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              required
              error={!!errors.gender}
              helperText={errors.gender}
            >
              <MenuItem value="male">Male</MenuItem>
              <MenuItem value="female">Female</MenuItem>
            </StyledTextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <StyledTextField
              fullWidth
              label="Age"
              name="age"
              type="number"
              value={formData.age}
              onChange={handleChange}
              required
              error={!!errors.age}
              helperText={errors.age}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <StyledTextField
              fullWidth
              label="Address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              required
              error={!!errors.address}
              helperText={errors.address}
            />
          </Grid>
        </Grid>
      </Grid>

      {/* Personal Background Section */}
      <Grid item xs={12}>
        <Divider sx={{ my: 3 }} />
        <SectionTitle>Personal Background</SectionTitle>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <StyledTextField
              fullWidth
              label="Citizenship Status"
              name="citizenshipStatus"
              value={formData.citizenshipStatus}
              onChange={handleChange}
              required
              error={!!errors.citizenshipStatus}
              helperText={errors.citizenshipStatus}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <StyledTextField
              fullWidth
              label="Religion"
              name="religion"
              value={formData.religion}
              onChange={handleChange}
              required
              error={!!errors.religion}
              helperText={errors.religion}
            />
          </Grid>
        </Grid>
      </Grid>

      {/* Family Information Section */}
      <Grid item xs={12}>
        <Divider sx={{ my: 3 }} />
        <SectionTitle>Family Information</SectionTitle>
        <Grid container spacing={3}>
          {/* Father's Information */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" sx={{ color: '#000000', mb: 2, fontWeight: 500 }}>
              Father's Information
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <StyledTextField
                  fullWidth
                  label="Father's Name"
                  name="fatherName"
                  value={formData.fatherName}
                  onChange={handleChange}
                  required
                  error={!!errors.fatherName}
                  helperText={errors.fatherName}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <StyledTextField
                  fullWidth
                  label="Father's Contact"
                  name="fatherContact"
                  value={formData.fatherContact}
                  onChange={handleChange}
                  required
                  error={!!errors.fatherContact}
                  helperText={errors.fatherContact}
                />
              </Grid>
            </Grid>
          </Grid>

          {/* Mother's Information */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" sx={{ color: '#000000', mb: 2, mt: 2, fontWeight: 500 }}>
              Mother's Information
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <StyledTextField
                  fullWidth
                  label="Mother's Name"
                  name="motherName"
                  value={formData.motherName}
                  onChange={handleChange}
                  required
                  error={!!errors.motherName}
                  helperText={errors.motherName}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <StyledTextField
                  fullWidth
                  label="Mother's Contact"
                  name="motherContact"
                  value={formData.motherContact}
                  onChange={handleChange}
                  required
                  error={!!errors.motherContact}
                  helperText={errors.motherContact}
                />
              </Grid>
            </Grid>
          </Grid>

          {/* Parents' Address */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" sx={{ color: '#000000', mb: 2, mt: 2, fontWeight: 500 }}>
              Parents' Address
            </Typography>
            <StyledTextField
              fullWidth
              label="Parents' Address"
              name="parentsAddress"
              value={formData.parentsAddress}
              onChange={handleChange}
              required
              error={!!errors.parentsAddress}
              helperText={errors.parentsAddress}
            />
          </Grid>
        </Grid>
      </Grid>

      {/* Emergency Contact Section */}
      <Grid item xs={12}>
        <Divider sx={{ my: 3 }} />
        <SectionTitle>Emergency Contact</SectionTitle>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <StyledTextField
              fullWidth
              label="Emergency Contact Name"
              name="emergencyContactName"
              value={formData.emergencyContactName}
              onChange={handleChange}
              required
              error={!!errors.emergencyContactName}
              helperText={errors.emergencyContactName}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <StyledTextField
              fullWidth
              label="Emergency Contact Number"
              name="emergencyContactNumber"
              value={formData.emergencyContactNumber}
              onChange={handleChange}
              required
              error={!!errors.emergencyContactNumber}
              helperText={errors.emergencyContactNumber}
            />
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );

  const renderSchoolInfo = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Box>
          <SectionTitle>School Details</SectionTitle>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <StyledTextField
                fullWidth
                label="Student Dorm Number"
                name="studentDormNumber"
                value={formData.studentDormNumber}
                onChange={handleChange}
                required
                error={!!errors.studentDormNumber}
                helperText={errors.studentDormNumber}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <StyledTextField
                fullWidth
                label="Course Year"
                name="courseYear"
                value={formData.courseYear}
                onChange={handleChange}
                required
                error={!!errors.courseYear}
                helperText={errors.courseYear}
              />
            </Grid>
          </Grid>
        </Box>
      </Grid>
    </Grid>
  );

  const renderDormitoryPreferences = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Box>
          <SectionTitle>Dormitory Preferences</SectionTitle>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <StyledTextField
                fullWidth
                select
                label="Building Preference"
                name="buildingPreference"
                value={formData.buildingPreference}
                onChange={handleChange}
                required
                error={!!errors.buildingPreference}
                helperText={errors.buildingPreference}
                SelectProps={{
                  MenuProps: {
                    PaperProps: {
                      sx: {
                        maxWidth: '400px',
                      },
                    },
                  },
                }}
              >
                <MenuItem value="Male Building">Male Building</MenuItem>
                <MenuItem value="Female Building">Female Building</MenuItem>
              </StyledTextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <StyledTextField
                fullWidth
                select
                label="Room Type Preference"
                name="occupancyPreference"
                value={formData.occupancyPreference}
                onChange={handleChange}
                required
                error={!!errors.occupancyPreference}
                helperText={errors.occupancyPreference}
                SelectProps={{
                  MenuProps: {
                    PaperProps: {
                      sx: {
                        maxWidth: '400px',
                      },
                    },
                  },
                }}
              >
                <MenuItem value="Single Occupancy">Single Occupancy</MenuItem>
                <MenuItem value="Double Occupancy">Double Occupancy</MenuItem>
              </StyledTextField>
              {formData.occupancyPreference && (
                <Box sx={{ 
                  mt: 1, 
                  p: 1.5, 
                  bgcolor: 'rgba(46, 139, 87, 0.08)', 
                  borderRadius: 1,
                  border: '1px solid rgba(46, 139, 87, 0.2)'
                }}>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      color: '#2E8B57',
                      fontWeight: 500,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}
                  >
                    Price: {formData.occupancyPreference === 'Single Occupancy' ? '8,000' : '12,000'} PHP
                  </Typography>
                </Box>
              )}
            </Grid>
          </Grid>
        </Box>
      </Grid>
    </Grid>
  );

  const renderMedicalInfo = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <SectionTitle>Physical Information</SectionTitle>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <StyledTextField
              fullWidth
              label="Height (cm)"
              name="height"
              type="number"
              value={formData.height}
              onChange={handleChange}
              required
              error={!!errors.height}
              helperText={errors.height}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <StyledTextField
              fullWidth
              label="Weight (kg)"
              name="weight"
              type="number"
              value={formData.weight}
              onChange={handleChange}
              required
              error={!!errors.weight}
              helperText={errors.weight}
            />
          </Grid>
        </Grid>
      </Grid>

      <Grid item xs={12}>
        <Divider sx={{ my: 3 }} />
        <SectionTitle>Medical History</SectionTitle>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <StyledTextField
              fullWidth
              label="Medical History"
              name="medicalHistory"
              multiline
              rows={4}
              value={formData.medicalHistory}
              onChange={handleChange}
              placeholder="Please provide any relevant medical history or conditions"
            />
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );

  const renderPictureUpload = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <SectionTitle>Profile Picture</SectionTitle>
        <Grid container spacing={3} justifyContent="center">
          <Grid item xs={12} textAlign="center">
            <label htmlFor="profile-picture">
              <Input
                accept="image/*"
                id="profile-picture"
                type="file"
                onChange={handleFileChange}
              />
              <Button 
                variant="contained" 
                component="span"
                sx={{
                  bgcolor: errors.profilePicture ? '#ff1744' : '#2E8B57',
                  '&:hover': {
                    bgcolor: errors.profilePicture ? '#d50000' : '#1b5e20',
                  }
                }}
              >
                Upload Profile Picture
              </Button>
            </label>
            {errors.profilePicture && (
              <Typography color="error" sx={{ mt: 1 }}>
                {errors.profilePicture}
              </Typography>
            )}
          </Grid>
          {formData.profilePicture && (
            <Grid item xs={12} textAlign="center">
              <Typography sx={{ color: '#000000' }}>
                Selected file: {formData.profilePicture.name}
              </Typography>
            </Grid>
          )}
        </Grid>
      </Grid>

      <Grid item xs={12}>
        <Divider sx={{ my: 3 }} />
        <Box sx={{ mt: 2 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={termsAccepted}
                onChange={handleTermsAcceptance}
                sx={{
                  color: '#2E8B57',
                  '&.Mui-checked': {
                    color: '#2E8B57',
                  },
                }}
              />
            }
            label={
              <Typography sx={{ color: '#000000' }}>
                I agree to the{' '}
                <Link
                  href="#"
                  onClick={handleOpenTerms}
                  sx={{
                    color: '#2E8B57',
                    textDecoration: 'underline',
                    cursor: 'pointer',
                    '&:hover': {
                      color: '#1b5e20',
                    },
                  }}
                >
                  Terms and Conditions
                </Link>
              </Typography>
            }
          />
          {errors.terms && (
            <Typography color="error" sx={{ mt: 1, fontSize: '0.75rem' }}>
              {errors.terms}
            </Typography>
          )}
        </Box>
      </Grid>
    </Grid>
  );

  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return renderPersonalInfo();
      case 1:
        return renderSchoolInfo();
      case 2:
        return renderMedicalInfo();
      case 3:
        return renderDormitoryPreferences();
      case 4:
        return renderPictureUpload();
      default:
        return 'Unknown step';
    }
  };

  return (
    <>
      <StyledDialog 
        open={open} 
        onClose={handleCancel}
        maxWidth="md" 
        fullWidth
      >
        <StyledDialogTitle>
          Dormitory Application Form
        </StyledDialogTitle>
        <StyledDialogContent>
          <Box sx={{ width: '100%', mt: 2, position: 'relative', zIndex: 1 }}>
            <StyledStepper activeStep={activeStep} alternativeLabel>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>
                    <Typography sx={{ color: '#000000', fontWeight: 500 }}>
                      {label}
                    </Typography>
                  </StepLabel>
                </Step>
              ))}
            </StyledStepper>
            <Box sx={{ mt: 4, position: 'relative', zIndex: 1 }}>
              {getStepContent(activeStep)}
            </Box>
          </Box>
        </StyledDialogContent>
        <DialogActions sx={{ padding: '16px 24px', position: 'relative', zIndex: 1 }}>
          <StyledButton onClick={handleCancel} variant="text">
            Cancel
          </StyledButton>
          <StyledButton
            disabled={activeStep === 0}
            onClick={handleBack}
            variant="text"
            sx={{
              color: activeStep === 0 ? 'rgba(0, 0, 0, 0.38)' : '#000000'
            }}
          >
            Back
          </StyledButton>
          {activeStep === steps.length - 1 ? (
            <StyledButton
              variant="contained"
              onClick={handleSubmit}
            >
              Submit
            </StyledButton>
          ) : (
            <StyledButton
              variant="contained"
              onClick={handleNext}
            >
              Next
            </StyledButton>
          )}
        </DialogActions>
      </StyledDialog>
      <TermsDialog />
    </>
  );
};

export default ApplicationForm; 
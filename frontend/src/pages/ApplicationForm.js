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
  Checkbox,
  FormControlLabel,
  Link,
} from '@mui/material';

const ApplicationForm = ({ open, onClose }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [errors, setErrors] = useState({});
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsDialogOpen, setTermsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    // ... existing formData ...
  });

  // Add new handlers for terms and conditions
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

  // Modify validateStep to include terms validation
  const validateStep = (step) => {
    const newErrors = {};
    
    if (step === steps.length - 1) {
      if (!termsAccepted) {
        newErrors.terms = 'You must accept the terms and conditions to proceed';
      }
      if (!formData.profilePicture) {
        newErrors.profilePicture = 'Profile Picture is required';
      }
    } else {
      // ... existing validation logic ...
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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

  // Modify the renderPictureUpload to include terms checkbox
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

  return (
    <>
      <StyledDialog 
        open={open} 
        onClose={handleCancel}
        maxWidth="md" 
        fullWidth
      >
        {/* ... existing dialog content ... */}
      </StyledDialog>
      <TermsDialog />
    </>
  );
};

export default ApplicationForm; 
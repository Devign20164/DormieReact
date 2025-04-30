import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import StudentSidebar from '../components/StudentSidebar';

const StudentLog = () => {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <StudentSidebar />
      <Box component="main" sx={{ flexGrow: 1, p: 4 }}>
        <Typography variant="h4" gutterBottom>Student Log</Typography>
        <Paper sx={{ p: 3, mt: 2 }}>
          <Typography variant="h6">
            Log functionality has been disabled
          </Typography>
          <Typography variant="body1" sx={{ mt: 2 }}>
            The check-in and check-out log functionality has been removed from the application.
          </Typography>
        </Paper>
      </Box>
    </Box>
  );
};

export default StudentLog;
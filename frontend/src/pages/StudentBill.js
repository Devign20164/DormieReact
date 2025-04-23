import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Card,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  Alert,
  Stack,
  Divider,
  Chip,
  IconButton,
  Tooltip,
  Paper,
} from '@mui/material';
import {
  Receipt as ReceiptIcon,
  Payment as PaymentIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  HourglassTop as HourglassTopIcon,
  AttachMoney as AttachMoneyIcon,
  Description as DescriptionIcon,
  Close as CloseIcon,
  PictureAsPdf as PdfIcon,
  Download as DownloadIcon,
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import StudentSidebar from '../components/StudentSidebar';
import NotificationBell from '../components/NotificationBell';

const StudentBill = () => {
  const [bills, setBills] = useState([]);
  const [selectedBill, setSelectedBill] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  // Receipt state
  const [receiptFile, setReceiptFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  // Fetch student's bills
  useEffect(() => {
    const fetchBills = async () => {
      try {
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        const response = await fetch(`/api/students/${userData._id}/bills`);
        if (response.ok) {
          const data = await response.json();
          console.log('Bills data from server:', data);
          
          // Check all billFile paths to debug
          data.forEach(bill => {
            if (bill.billFile) {
              console.log(`Bill ID: ${bill._id}, billFile: ${bill.billFile}`);
            }
          });
          
          setBills(data);
        } else {
          throw new Error('Failed to fetch bills');
        }
      } catch (error) {
        console.error('Error fetching bills:', error);
        setSnackbar({
          open: true,
          message: 'Error fetching bills',
          severity: 'error'
        });
      }
    };

    fetchBills();
  }, []);

  // Calculate total amount for a bill
  const calculateTotalAmount = (bill) => {
    let total = parseFloat(bill.rentalFee || 0) + 
      parseFloat(bill.waterFee || 0) + 
      parseFloat(bill.electricityFee || 0);
    
    if (bill.otherFees && bill.otherFees.length > 0) {
      bill.otherFees.forEach(fee => {
        total += parseFloat(fee.amount || 0);
      });
    }
    
    return total;
  };

  // Check if bill has a valid file path
  const hasBillFile = (bill) => {
    return bill && bill.billFile && bill.billFile.trim() !== '';
  };

  // Handle bill click
  const handleBillClick = (bill) => {
    setSelectedBill(bill);
    setPaymentAmount('');
    setOpenDialog(true);
  };

  // Handle bill file download
  const handleViewBillFile = (e, billFile) => {
    if (e) e.stopPropagation(); // Prevent triggering the card click
    
    if (!billFile) {
      console.error('No bill file available');
      setSnackbar({
        open: true,
        message: 'No bill file available for this bill',
        severity: 'error'
      });
      return;
    }
    
    try {
      // Log the original path for debugging
      console.log('Original bill file path:', billFile);
      
      // Extract just the filename - the server should be sending only filenames now
      const fileName = billFile;
      
      // Create a direct link to the file in uploads directory
      // Use API URL format to ensure proxy works correctly
      const url = `/api/students/files/download/${fileName}`;
      console.log('Downloading file from URL:', url);
      
      // Instead of directly downloading, fetch the file first to handle the proxy
      fetch(url, {
        method: 'GET',
        credentials: 'include', // Include cookies for authentication
      })
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to download file: ${response.status} ${response.statusText}`);
        }
        return response.blob();
      })
      .then(blob => {
        // Create URL from blob
        const url = window.URL.createObjectURL(blob);
        
        // Create download link
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up URL object
        window.URL.revokeObjectURL(url);
        
        setSnackbar({
          open: true,
          message: 'File download started',
          severity: 'success'
        });
      })
      .catch(error => {
        console.error('Download error:', error);
        setSnackbar({
          open: true,
          message: error.message || 'Error downloading file',
          severity: 'error'
        });
      });
    } catch (error) {
      console.error('Error in handleViewBillFile:', error);
      setSnackbar({
        open: true,
        message: 'An error occurred while attempting to download the file',
        severity: 'error'
      });
    }
  };

  // Handle receipt file upload
  const handleReceiptFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setSnackbar({
          open: true,
          message: 'File size exceeds 5MB limit',
          severity: 'error'
        });
        return;
      }
      
      // Check file type (PDF, JPG, PNG)
      const validTypes = ['application/pdf', 'image/jpeg', 'image/png'];
      if (!validTypes.includes(file.type)) {
        setSnackbar({
          open: true,
          message: 'Invalid file type. Please upload PDF, JPG, or PNG',
          severity: 'error'
        });
        return;
      }
      
      setReceiptFile(file);
      console.log('Receipt file selected:', file.name);
    }
  };

  // Remove selected receipt file
  const handleRemoveReceiptFile = () => {
    setReceiptFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Get file icon based on type
  const getFileIcon = (fileType) => {
    if (fileType?.includes('pdf')) {
      return <PdfIcon sx={{ color: '#EF4444' }} />;
    } else if (fileType?.includes('image')) {
      return <PdfIcon sx={{ color: '#3B82F6' }} />;
    }
    return <DescriptionIcon sx={{ color: '#F59E0B' }} />;
  };

  // Handle payment submission with receipt
  const handlePaymentSubmit = async () => {
    try {
      const amount = parseFloat(paymentAmount);
      if (isNaN(amount) || amount <= 0) {
        setSnackbar({
          open: true,
          message: 'Please enter a valid payment amount',
          severity: 'error'
        });
        return;
      }

      // Create form data for file upload
      const formData = new FormData();
      formData.append('amount', amount);
      formData.append('paymentMethod', 'credit_card');
      
      // Append receipt file if available
      if (receiptFile) {
        formData.append('receiptFile', receiptFile);
      }

      const response = await fetch(`/api/students/bills/${selectedBill._id}/pay`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
        // Don't set Content-Type, let browser set it with boundary for FormData
      });

      if (response.ok) {
        setSnackbar({
          open: true,
          message: 'Payment submitted successfully',
          severity: 'success'
        });
        setOpenDialog(false);
        setReceiptFile(null);
        
        // Refresh bills
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        const billsResponse = await fetch(`/api/students/${userData._id}/bills`);
        if (billsResponse.ok) {
          const data = await billsResponse.json();
          setBills(data);
        }
      } else {
        throw new Error('Payment failed');
      }
    } catch (error) {
      console.error('Error submitting payment:', error);
      setSnackbar({
        open: true,
        message: 'Error submitting payment',
        severity: 'error'
      });
    }
  };

  // Get status chip color and icon
  const getStatusChipProps = (bill) => {
    const isPastDue = bill.dueDate && new Date(bill.dueDate) < new Date();
    
    if (bill.status === 'paid') {
      return {
        color: 'success',
        icon: <CheckCircleIcon />,
        label: 'Paid'
      };
    } else if (isPastDue) {
      return {
        color: 'error',
        icon: <WarningIcon />,
        label: 'Overdue'
      };
    } else {
      return {
        color: 'warning',
        icon: <HourglassTopIcon />,
        label: 'Pending'
      };
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
      <StudentSidebar />
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 4,
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Header */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 4,
          pb: 3,
          borderBottom: '1px solid rgba(255,255,255,0.03)',
        }}>
          <Box>
            <Typography variant="h4" sx={{ 
              fontWeight: 600, 
              color: '#fff',
              textShadow: '0 2px 4px rgba(0,0,0,0.2)',
            }}>
              My Bills
            </Typography>
            <Typography variant="body2" sx={{ color: '#6B7280', mt: 1 }}>
              View and pay your dormitory bills
            </Typography>
          </Box>
          <NotificationBell userType="student" color="#3B82F6" />
        </Box>

        {/* Bills Grid */}
        <Grid container spacing={3}>
          {bills.length === 0 ? (
            <Grid item xs={12}>
              <Box sx={{ 
                textAlign: 'center', 
                py: 5, 
                px: 3, 
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: '16px' 
              }}>
                <Typography variant="h6" sx={{ color: '#6B7280' }}>
                  No bills found
                </Typography>
              </Box>
            </Grid>
          ) : (
            bills.map((bill) => {
              const totalAmount = calculateTotalAmount(bill);
              const statusProps = getStatusChipProps(bill);
              
              return (
                <Grid item xs={12} md={6} lg={4} key={bill._id}>
                  <Card
                    sx={{
                      background: 'linear-gradient(145deg, #141414 0%, #0A0A0A 100%)',
                      borderRadius: '16px',
                      p: 3,
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      border: '1px solid rgba(255, 255, 255, 0.03)',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box>
                        <Typography variant="h6" sx={{ color: '#fff', mb: 1 }}>
                          Bill #{bill._id.substring(0, 8)}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#6B7280' }}>
                          Due: {new Date(bill.dueDate).toLocaleDateString()}
                        </Typography>
                      </Box>
                      <Chip
                        icon={statusProps.icon}
                        label={statusProps.label}
                        color={statusProps.color}
                        sx={{
                          background: statusProps.color === 'success' 
                            ? 'rgba(16, 185, 129, 0.1)'
                            : statusProps.color === 'error'
                              ? 'rgba(239, 68, 68, 0.1)'
                              : 'rgba(245, 158, 11, 0.1)',
                          border: statusProps.color === 'success'
                            ? '1px solid rgba(16, 185, 129, 0.3)'
                            : statusProps.color === 'error'
                              ? '1px solid rgba(239, 68, 68, 0.3)'
                              : '1px solid rgba(245, 158, 11, 0.3)',
                        }}
                      />
                    </Box>
                    
                    <Divider sx={{ my: 2, borderColor: 'rgba(255, 255, 255, 0.03)' }} />
                    
                    <Box sx={{ mb: 2 }}>
                      <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                        <Typography variant="body2" sx={{ color: '#6B7280' }}>Rental Fee</Typography>
                        <Typography variant="body2" sx={{ color: '#fff' }}>${bill.rentalFee || 0}</Typography>
                      </Stack>
                      <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                        <Typography variant="body2" sx={{ color: '#6B7280' }}>Water Fee</Typography>
                        <Typography variant="body2" sx={{ color: '#fff' }}>${bill.waterFee || 0}</Typography>
                      </Stack>
                      <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                        <Typography variant="body2" sx={{ color: '#6B7280' }}>Electricity Fee</Typography>
                        <Typography variant="body2" sx={{ color: '#fff' }}>${bill.electricityFee || 0}</Typography>
                      </Stack>
                      {bill.otherFees && bill.otherFees.map((fee, index) => (
                        <Stack key={index} direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                          <Typography variant="body2" sx={{ color: '#6B7280' }}>{fee.description}</Typography>
                          <Typography variant="body2" sx={{ color: '#fff' }}>${fee.amount}</Typography>
                        </Stack>
                      ))}
                    </Box>
                    
                    <Divider sx={{ my: 2, borderColor: 'rgba(255, 255, 255, 0.03)' }} />
                    
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="h6" sx={{ color: '#fff' }}>
                        Total Amount
                      </Typography>
                      <Typography variant="h6" sx={{ color: '#10B981' }}>
                        ${totalAmount.toFixed(2)}
                      </Typography>
                    </Stack>

                    <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {/* Bill File Section - Always visible as a prominent button */}
                      <Button
                        fullWidth
                        variant={hasBillFile(bill) ? "contained" : "outlined"}
                        startIcon={<PdfIcon />}
                        endIcon={<DownloadIcon />}
                        onClick={(e) => handleViewBillFile(e, bill.billFile)}
                        disabled={!hasBillFile(bill)}
                        sx={{
                          background: hasBillFile(bill) ? 'linear-gradient(90deg, #3B82F6 0%, #1E40AF 100%)' : 'transparent',
                          color: hasBillFile(bill) ? '#ffffff' : '#6B7280',
                          border: hasBillFile(bill) ? 'none' : '1px solid rgba(107, 114, 128, 0.3)',
                          '&:hover': {
                            background: hasBillFile(bill) ? 'linear-gradient(90deg, #2563EB 0%, #1E3A8A 100%)' : 'rgba(107, 114, 128, 0.1)',
                          },
                          '&.Mui-disabled': {
                            color: 'rgba(107, 114, 128, 0.5)',
                            border: '1px dashed rgba(107, 114, 128, 0.2)',
                          }
                        }}
                      >
                        {hasBillFile(bill) ? 'View/Download Bill' : 'No Bill Available'}
                      </Button>

                      {/* Payment Button */}
                      {bill.status !== 'paid' && (
                        <Button
                          fullWidth
                          variant="contained"
                          startIcon={<PaymentIcon />}
                          onClick={() => handleBillClick(bill)}
                          sx={{
                            background: 'linear-gradient(90deg, #10B981 0%, #047857 100%)',
                            '&:hover': {
                              background: 'linear-gradient(90deg, #047857 0%, #065F46 100%)',
                            },
                          }}
                        >
                          Make Payment
                        </Button>
                      )}
                    </Box>
                  </Card>
                </Grid>
              );
            })
          )}
        </Grid>

        {/* Payment Dialog */}
        <Dialog
          open={openDialog}
          onClose={() => setOpenDialog(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              background: 'linear-gradient(145deg, #141414 0%, #0A0A0A 100%)',
              color: '#fff',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.03)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
            }
          }}
        >
          {selectedBill && (
            <>
              <DialogTitle sx={{ 
                borderBottom: '1px solid rgba(255,255,255,0.03)',
                background: 'linear-gradient(90deg, rgba(59, 130, 246, 0.1) 0%, transparent 100%)',
                py: 2,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <Typography variant="h6" sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  gap: 1,
                  color: '#fff',
                }}>
                  <PaymentIcon sx={{ color: '#3B82F6' }} />
                  Make Payment
                </Typography>
                <IconButton
                  onClick={() => setOpenDialog(false)}
                  sx={{ color: '#6B7280' }}
                >
                  <CloseIcon />
                </IconButton>
              </DialogTitle>
              
              <DialogContent sx={{ py: 3 }}>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" sx={{ color: '#fff', mb: 2, fontWeight: 600 }}>
                    Bill Details
                  </Typography>
                  
                  {/* Enhanced bill breakdown section */}
                  <Paper sx={{ 
                    bgcolor: 'rgba(255, 255, 255, 0.03)',
                    p: 2, 
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    mb: 3
                  }}>
                    <Stack spacing={1.5}>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="body2" sx={{ color: '#6B7280' }}>Bill ID</Typography>
                        <Typography variant="body2" sx={{ color: '#fff' }}>#{selectedBill._id.substring(0, 8)}</Typography>
                      </Stack>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="body2" sx={{ color: '#6B7280' }}>Due Date</Typography>
                        <Typography variant="body2" sx={{ color: '#fff' }}>
                          {new Date(selectedBill.dueDate).toLocaleDateString()}
                        </Typography>
                      </Stack>
                      
                      <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.05)', my: 1 }} />
                      
                      {/* Bill components breakdown */}
                      <Typography variant="subtitle2" sx={{ color: '#3B82F6', fontSize: '0.85rem', mt: 1 }}>
                        Charges Breakdown
                      </Typography>
                      
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="body2" sx={{ color: '#6B7280' }}>Rental Fee</Typography>
                        <Typography variant="body2" sx={{ color: '#fff' }}>${selectedBill.rentalFee || 0}</Typography>
                      </Stack>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="body2" sx={{ color: '#6B7280' }}>Electricity Fee</Typography>
                        <Typography variant="body2" sx={{ color: '#fff' }}>${selectedBill.electricityFee || 0}</Typography>
                      </Stack>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="body2" sx={{ color: '#6B7280' }}>Water Fee</Typography>
                        <Typography variant="body2" sx={{ color: '#fff' }}>${selectedBill.waterFee || 0}</Typography>
                      </Stack>
                      
                      {/* Other fees if exist */}
                      {selectedBill.otherFees && selectedBill.otherFees.length > 0 && (
                        <>
                          <Typography variant="subtitle2" sx={{ color: '#3B82F6', fontSize: '0.85rem', mt: 1 }}>
                            Other Charges
                          </Typography>
                          {selectedBill.otherFees.map((fee, index) => (
                            <Stack key={index} direction="row" justifyContent="space-between">
                              <Typography variant="body2" sx={{ color: '#6B7280' }}>{fee.description || 'Additional Fee'}</Typography>
                              <Typography variant="body2" sx={{ color: '#fff' }}>${fee.amount || 0}</Typography>
                            </Stack>
                          ))}
                        </>
                      )}
                      
                      {/* Notes if exist */}
                      {selectedBill.notes && (
                        <Box sx={{ mt: 1, bgcolor: 'rgba(255, 255, 255, 0.03)', p: 1.5, borderRadius: '8px' }}>
                          <Typography variant="subtitle2" sx={{ color: '#3B82F6', fontSize: '0.85rem' }}>
                            Notes
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#9CA3AF', fontSize: '0.8rem', mt: 0.5 }}>
                            {selectedBill.notes}
                          </Typography>
                        </Box>
                      )}
                      
                      <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)', my: 1 }} />
                      
                      {/* Total section */}
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="subtitle2" sx={{ color: '#fff', fontWeight: 600 }}>
                          Total Amount
                        </Typography>
                        <Typography variant="subtitle1" sx={{ color: '#10B981', fontWeight: 600 }}>
                          ${calculateTotalAmount(selectedBill).toFixed(2)}
                        </Typography>
                      </Stack>
                    </Stack>
                  </Paper>

                  {/* Receipt Upload Section */}
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" sx={{ color: '#fff', mb: 1 }}>
                      Receipt Upload
                    </Typography>
                    <Paper sx={{ 
                      bgcolor: 'rgba(255, 255, 255, 0.03)',
                      p: 2, 
                      borderRadius: '12px',
                      border: '1px solid rgba(255, 255, 255, 0.05)'
                    }}>
                      <Typography variant="body2" sx={{ color: '#9CA3AF', mb: 2 }}>
                        Upload your payment receipt (PDF, JPG, PNG)
                      </Typography>
                      
                      {!receiptFile ? (
                        <Box
                          sx={{
                            border: '2px dashed rgba(107, 114, 128, 0.3)',
                            borderRadius: '10px',
                            p: 3,
                            textAlign: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            '&:hover': {
                              borderColor: 'rgba(59, 130, 246, 0.5)',
                              bgcolor: 'rgba(59, 130, 246, 0.03)'
                            }
                          }}
                          onClick={() => fileInputRef.current.click()}
                        >
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={handleReceiptFileSelect}
                            style={{ display: 'none' }}
                            ref={fileInputRef}
                          />
                          <CloudUploadIcon sx={{ fontSize: 36, color: '#6B7280', mb: 1 }} />
                          <Typography variant="body2" sx={{ color: '#fff' }}>
                            Click to upload a file
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#6B7280', display: 'block', mt: 0.5 }}>
                            Maximum file size: 5MB
                          </Typography>
                        </Box>
                      ) : (
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            bgcolor: 'rgba(0, 0, 0, 0.2)',
                            borderRadius: '8px',
                            p: 2
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            {getFileIcon(receiptFile.type)}
                            <Box>
                              <Typography variant="body2" sx={{ color: '#fff', fontWeight: 500 }}>
                                {receiptFile.name}
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#6B7280' }}>
                                {(receiptFile.size / 1024).toFixed(1)} KB
                              </Typography>
                            </Box>
                          </Box>
                          <IconButton 
                            onClick={handleRemoveReceiptFile}
                            size="small"
                            sx={{ color: '#EF4444' }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      )}
                    </Paper>
                  </Box>
                </Box>

                {/* Bill File in Dialog - More prominent with better styling */}
                <Box sx={{ mb: 3 }}>
                  <Button
                    fullWidth
                    variant={hasBillFile(selectedBill) ? "contained" : "outlined"}
                    startIcon={<PdfIcon />}
                    endIcon={<DownloadIcon />}
                    onClick={() => handleViewBillFile(null, selectedBill.billFile)}
                    disabled={!hasBillFile(selectedBill)}
                    sx={{
                      py: 1.5,
                      background: hasBillFile(selectedBill) ? 'linear-gradient(90deg, #3B82F6 0%, #1E40AF 100%)' : 'transparent',
                      color: hasBillFile(selectedBill) ? '#ffffff' : '#6B7280',
                      border: hasBillFile(selectedBill) ? 'none' : '1px solid rgba(107, 114, 128, 0.3)',
                      '&:hover': {
                        background: hasBillFile(selectedBill) ? 'linear-gradient(90deg, #2563EB 0%, #1E3A8A 100%)' : 'rgba(107, 114, 128, 0.1)',
                      },
                      '&.Mui-disabled': {
                        color: 'rgba(107, 114, 128, 0.5)',
                        border: '1px dashed rgba(107, 114, 128, 0.2)',
                      }
                    }}
                  >
                    {hasBillFile(selectedBill) ? 'Download Bill' : 'No Bill Available'}
                  </Button>
                </Box>
                
                {/* Payment Amount */}
                <Typography variant="subtitle2" sx={{ color: '#fff', mb: 1 }}>
                  Payment Details
                </Typography>
                <TextField
                  fullWidth
                  label="Payment Amount"
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  InputProps={{
                    startAdornment: <AttachMoneyIcon sx={{ color: '#6B7280', mr: 1 }} />,
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      color: '#fff',
                      '& fieldset': {
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                      },
                      '&:hover fieldset': {
                        borderColor: 'rgba(255, 255, 255, 0.2)',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#3B82F6',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: '#6B7280',
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: '#3B82F6',
                    },
                  }}
                />
              </DialogContent>
              
              <DialogActions sx={{ 
                px: 3, 
                py: 2,
                borderTop: '1px solid rgba(255, 255, 255, 0.03)',
              }}>
                <Button
                  onClick={() => setOpenDialog(false)}
                  sx={{
                    color: '#6B7280',
                    '&:hover': {
                      color: '#fff',
                      bgcolor: 'rgba(255, 255, 255, 0.05)',
                    },
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handlePaymentSubmit}
                  variant="contained"
                  startIcon={<PaymentIcon />}
                  sx={{
                    background: 'linear-gradient(90deg, #10B981 0%, #047857 100%)',
                    color: '#fff',
                    '&:hover': {
                      background: 'linear-gradient(90deg, #047857 0%, #065F46 100%)',
                    },
                  }}
                >
                  Submit Payment
                </Button>
              </DialogActions>
            </>
          )}
        </Dialog>

        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Alert
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            severity={snackbar.severity}
            variant="filled"
            sx={{ 
              width: '100%',
              background: snackbar.severity === 'success' 
                ? 'linear-gradient(90deg, #10B981 0%, #059669 100%)'
                : 'linear-gradient(90deg, #EF4444 0%, #DC2626 100%)',
            }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </Box>
  );
};

export default StudentBill;

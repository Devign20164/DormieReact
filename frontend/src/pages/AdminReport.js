import React, { useState, useEffect, useContext } from 'react';
import {
  Box,
  Typography,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Stack,
  Button,
  TextField,
  Autocomplete,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Tabs,
  Tab,
  Grid,
  useTheme
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Print as PrintIcon,
  Search as SearchIcon,
  Download as DownloadIcon,
  Person as PersonIcon,
  Business as BuildingIcon,
  MeetingRoom as RoomIcon,
  Description as FormIcon,
  Receipt as BillIcon,
  SupervisorAccount as StaffIcon,
  ReportProblem as OffenseIcon,
} from '@mui/icons-material';
import AdminSidebar from '../components/AdminSidebar';
import { format, isValid, parseISO } from 'date-fns';
import { ThemeContext } from '../App';

// Add print styles
const printStyles = `
  @media print {
    body * {
      visibility: hidden;
    }
    #print-container, #print-container * {
      visibility: visible;
    }
    #print-container {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      color: black !important;
    }
    .report-logo {
      display: block;
      width: 200px;
      height: auto;
      margin: 0 auto 10px auto;
    }
    .print-header {
      text-align: center;
      margin-bottom: 20px;
      font-size: 24px;
      font-weight: bold;
      color: black !important;
    }
    .university-name {
      text-align: center;
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 5px;
      color: black !important;
    }
    .report-title {
      text-align: center;
      font-size: 16px;
      margin-bottom: 20px;
      color: black !important;
    }
    .MuiAccordion-root {
      break-inside: avoid;
      margin-bottom: 20px !important;
      border: 1px solid black !important;
      background-color: white !important;
    }
    .MuiAccordionSummary-expandIconWrapper {
      display: none !important;
    }
    .MuiAccordionSummary-content {
      margin: 12px 0 !important;
    }
    .MuiAccordionSummary-root {
      background-color: #f5f5f5 !important;
      border-bottom: 1px solid black !important;
    }
    .MuiTableCell-root {
      padding: 8px 16px !important;
      color: black !important;
      border-color: black !important;
    }
    .MuiTableHead-root .MuiTableCell-root {
      background-color: #f5f5f5 !important;
      font-weight: bold !important;
    }
    .MuiPaper-root {
      box-shadow: none !important;
    }
    .MuiTypography-root {
      color: black !important;
    }
    .MuiChip-root {
      border: 1px solid black !important;
    }
    .MuiChip-colorSuccess {
      background-color: #e8f5e9 !important;
    }
    .MuiChip-colorWarning {
      background-color: #fff8e1 !important;
    }
    .MuiChip-colorError {
      background-color: #ffebee !important;
    }
    .MuiChip-colorInfo {
      background-color: #e3f2fd !important;
    }
    .MuiTable-root {
      border-collapse: collapse !important;
      border: 1px solid black !important;
    }
    .MuiTableRow-root {
      page-break-inside: avoid !important;
    }
    .MuiAccordionDetails-root {
      padding: 16px !important;
    }
  }
`;

const AdminReport = () => {
  const { mode } = useContext(ThemeContext);
  const theme = useTheme();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentDetails, setStudentDetails] = useState(null);
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  
  // New state variables for all reports
  const [tabValue, setTabValue] = useState(0);
  const [allStudents, setAllStudents] = useState([]);
  const [allBuildings, setAllBuildings] = useState([]);
  const [allRooms, setAllRooms] = useState([]);
  const [allForms, setAllForms] = useState([]);
  const [allBills, setAllBills] = useState([]);
  const [allStaff, setAllStaff] = useState([]);
  const [allOffenses, setAllOffenses] = useState([]);
  const [loadingCategory, setLoadingCategory] = useState({
    students: false,
    buildings: false,
    rooms: false,
    forms: false,
    bills: false,
    staff: false,
    offenses: false
  });

  // Fetch all students
  const fetchStudents = async () => {
    try {
      const response = await fetch('/api/admin/students');
      if (!response.ok) throw new Error('Failed to fetch students');
      const data = await response.json();
      setStudents(data);
    } catch (err) {
      setError('Failed to load students');
      setSnackbar({
        open: true,
        message: 'Failed to load students. Please try again later.',
        severity: 'error'
      });
      console.error(err);
    }
  };

  // Fetch all students with complete info
  const fetchAllStudents = async () => {
    setLoadingCategory(prev => ({ ...prev, students: true }));
    try {
      const response = await fetch('/api/admin/students');
      if (!response.ok) throw new Error('Failed to fetch all students');
      const studentsData = await response.json();
      
      // For each student, fetch their room and building details if available
      const studentsWithDetails = await Promise.all(
        studentsData.map(async (student) => {
          let roomData = null;
          let buildingData = null;
          
          if (student.room) {
            try {
              const roomResponse = await fetch(`/api/admin/rooms/${student.room}`);
              if (roomResponse.ok) {
                roomData = await roomResponse.json();
                
                if (roomData && roomData.building) {
                  const buildingResponse = await fetch(`/api/admin/buildings/${roomData.building}`);
                  if (buildingResponse.ok) {
                    buildingData = await buildingResponse.json();
                  }
                }
              }
            } catch (err) {
              console.error('Error fetching room/building for student:', err);
            }
          }
          
          return {
            ...student,
            roomData,
            buildingData
          };
        })
      );
      
      setAllStudents(studentsWithDetails);
    } catch (err) {
      console.error('Error fetching all students:', err);
      setSnackbar({
        open: true,
        message: 'Failed to load all students. Please try again later.',
        severity: 'error'
      });
    } finally {
      setLoadingCategory(prev => ({ ...prev, students: false }));
    }
  };

  // Fetch all buildings
  const fetchAllBuildings = async () => {
    setLoadingCategory(prev => ({ ...prev, buildings: true }));
    try {
      const response = await fetch('/api/admin/buildings');
      if (!response.ok) throw new Error('Failed to fetch buildings');
      const data = await response.json();
      setAllBuildings(data);
    } catch (err) {
      console.error('Error fetching buildings:', err);
      setSnackbar({
        open: true,
        message: 'Failed to load buildings. Please try again later.',
        severity: 'error'
      });
    } finally {
      setLoadingCategory(prev => ({ ...prev, buildings: false }));
    }
  };

  // Fetch all rooms
  const fetchAllRooms = async () => {
    setLoadingCategory(prev => ({ ...prev, rooms: true }));
    try {
      // Fetch all buildings first if not already loaded
      if (allBuildings.length === 0) {
        await fetchAllBuildings();
      }
      
      // Fetch rooms from all buildings
      const roomsPromises = allBuildings.map(async (building) => {
        try {
          const response = await fetch(`/api/admin/buildings/${building._id}/rooms`);
          if (!response.ok) throw new Error(`Failed to fetch rooms for building ${building.name}`);
          const roomsData = await response.json();
          
          // Add building info to each room
          return roomsData.map(room => ({
            ...room,
            buildingName: building.name,
            buildingType: building.type
          }));
        } catch (err) {
          console.error(`Error fetching rooms for building ${building.name}:`, err);
          return [];
        }
      });
      
      const roomsArrays = await Promise.all(roomsPromises);
      const allRoomsData = roomsArrays.flat();
      setAllRooms(allRoomsData);
    } catch (err) {
      console.error('Error fetching rooms:', err);
      setSnackbar({
        open: true,
        message: 'Failed to load rooms. Please try again later.',
        severity: 'error'
      });
    } finally {
      setLoadingCategory(prev => ({ ...prev, rooms: false }));
    }
  };

  // Fetch all forms
  const fetchAllForms = async () => {
    setLoadingCategory(prev => ({ ...prev, forms: true }));
    try {
      const response = await fetch('/api/admin/forms');
      if (!response.ok) throw new Error('Failed to fetch forms');
      const data = await response.json();
      
      // Check if forms is nested within a property
      const formsData = data.forms || data;
      
      setAllForms(Array.isArray(formsData) ? formsData : []);
    } catch (err) {
      console.error('Error fetching forms:', err);
      setSnackbar({
        open: true,
        message: 'Failed to load forms. Please try again later.',
        severity: 'error'
      });
    } finally {
      setLoadingCategory(prev => ({ ...prev, forms: false }));
    }
  };

  // Fetch all bills
  const fetchAllBills = async () => {
    setLoadingCategory(prev => ({ ...prev, bills: true }));
    try {
      const response = await fetch('/api/admin/bills');
      if (!response.ok) throw new Error('Failed to fetch bills');
      const data = await response.json();
      setAllBills(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching bills:', err);
      setSnackbar({
        open: true,
        message: 'Failed to load bills. Please try again later.',
        severity: 'error'
      });
    } finally {
      setLoadingCategory(prev => ({ ...prev, bills: false }));
    }
  };

  // Fetch all staff
  const fetchAllStaff = async () => {
    setLoadingCategory(prev => ({ ...prev, staff: true }));
    try {
      const response = await fetch('/api/admin/staff');
      if (!response.ok) throw new Error('Failed to fetch staff');
      const data = await response.json();
      setAllStaff(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching staff:', err);
      setSnackbar({
        open: true,
        message: 'Failed to load staff. Please try again later.',
        severity: 'error'
      });
    } finally {
      setLoadingCategory(prev => ({ ...prev, staff: false }));
    }
  };

  // Fetch all offenses
  const fetchAllOffenses = async () => {
    setLoadingCategory(prev => ({ ...prev, offenses: true }));
    try {
      // First fetch all students if not already loaded
      if (allStudents.length === 0) {
        await fetchAllStudents();
      }
      
      // Fetch offenses from all students
      const offensesPromises = allStudents.map(async (student) => {
        try {
          const response = await fetch(`/api/admin/students/${student._id}/offenses`);
          if (!response.ok) throw new Error(`Failed to fetch offenses for student ${student.name}`);
          const offensesData = await response.json();
          
          // Add student info to each offense
          return offensesData.map(offense => ({
            ...offense,
            studentName: student.name,
            studentId: student._id
          }));
        } catch (err) {
          console.error(`Error fetching offenses for student ${student.name}:`, err);
          return [];
        }
      });
      
      const offensesArrays = await Promise.all(offensesPromises);
      const allOffensesData = offensesArrays.flat();
      
      // For each offense, try to get the admin name who recorded it
      const offensesWithAdminNames = await Promise.all(
        allOffensesData.map(async (offense) => {
          if (offense.recordedBy) {
            try {
              const adminResponse = await fetch(`/api/admin/admins/${offense.recordedBy}`);
              if (adminResponse.ok) {
                const adminData = await adminResponse.json();
                return {
                  ...offense,
                  recordedByName: adminData.name || 'Admin'
                };
              }
            } catch (err) {
              console.error('Error fetching admin details:', err);
            }
          }
          return {
            ...offense,
            recordedByName: 'Admin'
          };
        })
      );
      
      setAllOffenses(offensesWithAdminNames);
    } catch (err) {
      console.error('Error fetching offenses:', err);
      setSnackbar({
        open: true,
        message: 'Failed to load offenses. Please try again later.',
        severity: 'error'
      });
    } finally {
      setLoadingCategory(prev => ({ ...prev, offenses: false }));
    }
  };

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    
    // Load data for the selected tab if not already loaded
    switch(newValue) {
      case 0: // Student details
        if (students.length === 0) fetchStudents();
        break;
      case 1: // All students
        if (allStudents.length === 0) fetchAllStudents();
        break;
      case 2: // All buildings
        if (allBuildings.length === 0) fetchAllBuildings();
        break;
      case 3: // All rooms
        if (allRooms.length === 0) fetchAllRooms();
        break;
      case 4: // All forms
        if (allForms.length === 0) fetchAllForms();
        break;
      case 5: // All bills
        if (allBills.length === 0) fetchAllBills();
        break;
      case 6: // All staff
        if (allStaff.length === 0) fetchAllStaff();
        break;
      case 7: // All offenses
        if (allOffenses.length === 0) fetchAllOffenses();
        break;
    }
  };

  // Fetch comprehensive student details
  const fetchStudentDetails = async (studentId) => {
    setLoading(true);
    setError(null);
    try {
      // Based on available endpoints, modify API calls
      const studentResponse = await fetch(`/api/admin/students`);
      if (!studentResponse.ok) throw new Error('Failed to fetch students');
      
      const students = await studentResponse.json();
      const student = students.find(s => s._id === studentId);
      
      if (!student) {
        throw new Error('Student not found');
      }
      
      // Get room info - assuming student has a room field
      let room = null;
      let building = null;
      
      if (student.room) {
        const roomResponse = await fetch(`/api/admin/rooms/${student.room}`);
        if (roomResponse.ok) {
          room = await roomResponse.json();
          
          if (room && room.building) {
            const buildingResponse = await fetch(`/api/admin/buildings/${room.building}`);
            if (buildingResponse.ok) {
              building = await buildingResponse.json();
            }
          }
        }
      }
      
      // Get forms for this student
      // The admin/forms endpoint accepts studentId as a query parameter
      const formsResponse = await fetch(`/api/admin/forms?studentId=${studentId}`);
      let forms = [];
      
      try {
        if (formsResponse.ok) {
          const formsData = await formsResponse.json();
          // The API returns an object with a forms array, not directly the forms array
          forms = Array.isArray(formsData.forms) ? formsData.forms : 
                 (formsData && typeof formsData === 'object' && Array.isArray(formsData.forms)) ? 
                 formsData.forms : [];
        }
      } catch (err) {
        console.error("Error processing forms data:", err);
        forms = [];
      }
      
      // Get bills for this student
      // For bills, we need to filter by student ID
      const billsResponse = await fetch(`/api/admin/bills`);
      let bills = [];
      
      try {
        if (billsResponse.ok) {
          const allBills = await billsResponse.json();
          // Filter bills manually since they might not support query params
          bills = Array.isArray(allBills) ? 
            allBills.filter(bill => bill.student && bill.student._id === studentId) : [];
        }
      } catch (err) {
        console.error("Error processing bills data:", err);
        bills = [];
      }
      
      // Get logs for this student - get all logs and filter
      const today = new Date();
      const formattedDate = format(today, 'yyyy-MM-dd');
      const logsResponse = await fetch(`/api/admin/logs/${formattedDate}`);
      let logs = [];
      
      try {
        if (logsResponse.ok) {
          const allLogs = await logsResponse.json();
          logs = Array.isArray(allLogs) ? 
            allLogs.filter(log => log.user && log.user._id === studentId) : [];
        }
      } catch (err) {
        console.error("Error processing logs data:", err);
        logs = [];
      }
      
      // For offenses - fetch student offenses from the specific endpoint
      let offenses = [];
      try {
        const offensesResponse = await fetch(`/api/admin/students/${studentId}/offenses`);
        if (offensesResponse.ok) {
          const offensesData = await offensesResponse.json();
          offenses = Array.isArray(offensesData) ? offensesData : [];
        }
      } catch (err) {
        console.error("Error fetching student offenses:", err);
        offenses = [];
      }
      
      setStudentDetails({
        student,
        building,
        room,
        bills: Array.isArray(bills) ? bills : [],
        forms: Array.isArray(forms) ? forms : [],
        logs: Array.isArray(logs) ? logs : [],
        offenses: Array.isArray(offenses) ? offenses : []
      });
    } catch (err) {
      setError('Failed to load student details: ' + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    if (selectedStudent) {
      fetchStudentDetails(selectedStudent._id);
    }
  }, [selectedStudent]);

  const handlePrint = () => {
    // Create a new hidden container for print content
    const printContainer = document.createElement('div');
    printContainer.id = 'print-container';
    document.body.appendChild(printContainer);

    // Add print styles dynamically
    const styleElement = document.createElement('style');
    styleElement.textContent = printStyles;
    document.head.appendChild(styleElement);

    // Add university logo
    const logoImg = document.createElement('img');
    logoImg.src = 'https://www.edarabia.com/wp-content/uploads/2020/07/de-la-salle-university-dasmarinas-philippines.jpg';
    logoImg.className = 'report-logo';
    logoImg.alt = 'De La Salle University Dasmarinas';
    printContainer.appendChild(logoImg);

    // Add university name
    const universityName = document.createElement('div');
    universityName.className = 'university-name';
    universityName.textContent = 'De La Salle University Dasmarinas';
    printContainer.appendChild(universityName);

    // Add report title
    const reportTitle = document.createElement('div');
    reportTitle.className = 'report-title';
    reportTitle.textContent = 'Student Detail Report';
    printContainer.appendChild(reportTitle);

    // Create a header for the printed report
    const header = document.createElement('div');
    header.className = 'print-header';
    header.textContent = `${studentDetails.student.name}`;
    printContainer.appendChild(header);

    // Clone the report content
    const reportContent = document.getElementById('student-report-content');
    if (reportContent) {
      // Expand all accordions for printing
      const accordions = reportContent.querySelectorAll('.MuiAccordion-root');
      accordions.forEach(accordion => {
        if (!accordion.classList.contains('Mui-expanded')) {
          const summary = accordion.querySelector('.MuiAccordionSummary-root');
          if (summary) summary.click();
        }
      });

      // Clone the content after expanding accordions
      setTimeout(() => {
        const clonedContent = reportContent.cloneNode(true);
        printContainer.appendChild(clonedContent);
        
        // Print and clean up
        window.print();
        document.body.removeChild(printContainer);
        document.head.removeChild(styleElement);
      }, 300);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      // Since there's no backend PDF endpoint, we'll display a message
      setSnackbar({
        open: true,
        message: 'PDF generation is not yet implemented',
        severity: 'warning'
      });
      
      // In the future, you could implement PDF generation here using a library like jsPDF
      // For example:
      // import jsPDF from 'jspdf';
      // import 'jspdf-autotable';
      // 
      // const doc = new jsPDF();
      // doc.text(`Student Report: ${selectedStudent.name}`, 20, 20);
      // ... add more content to PDF ...
      // doc.save(`${selectedStudent.name}-report.pdf`);
    } catch (err) {
      setError('Failed to download PDF');
      console.error(err);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  // Safe formatting for dates
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = typeof dateString === 'string' ? parseISO(dateString) : new Date(dateString);
      return isValid(date) ? format(date, 'MMM dd, yyyy') : 'Invalid Date';
    } catch (error) {
      console.error('Error formatting date:', error, dateString);
      return 'Invalid Date';
    }
  };

  // Safe formatting for times
  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = typeof dateString === 'string' ? parseISO(dateString) : new Date(dateString);
      return isValid(date) ? format(date, 'hh:mm a') : 'Invalid Time';
    } catch (error) {
      console.error('Error formatting time:', error, dateString);
      return 'Invalid Time';
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Add export CSV function
  const exportToCSV = (data, filename) => {
    if (!data || data.length === 0) {
      setSnackbar({
        open: true,
        message: 'No data to export',
        severity: 'warning'
      });
      return;
    }

    // Get headers from the first item
    const headers = Object.keys(data[0]).filter(key => 
      // Filter out complex objects and irrelevant fields
      typeof data[0][key] !== 'object' && 
      key !== '_id' && 
      key !== '__v' && 
      !key.includes('Password')
    );

    // Create CSV content
    let csvContent = headers.join(',') + '\n';
    
    // Add data rows
    data.forEach(item => {
      const row = headers.map(header => {
        // Handle special cases for date formatting
        if (
          header.toLowerCase().includes('date') || 
          header.toLowerCase().includes('created') || 
          header.toLowerCase().includes('updated')
        ) {
          return item[header] ? `"${formatDate(item[header])}"` : '""';
        }
        
        // Regular string escaping for CSV
        const value = item[header] === null || item[header] === undefined ? '' : item[header];
        return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
      }).join(',');
      
      csvContent += row + '\n';
    });
    
    // Create a download link and trigger it
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Show success message
    setSnackbar({
      open: true,
      message: `${filename} exported successfully`,
      severity: 'success'
    });
  };

  // Add handleExportCSV function for each tab
  const handleExportCSV = () => {
    switch(tabValue) {
      case 1: // All Students
        const studentsData = allStudents.map(student => ({
          Name: student.name,
          Email: student.email,
          ContactInfo: student.contactInfo || '',
          StudentDormNumber: student.studentDormNumber || '',
          Building: student.buildingData?.name || '',
          RoomNumber: student.roomData?.roomNumber || ''
        }));
        exportToCSV(studentsData, 'Students');
        break;
      
      case 2: // Buildings
        const buildingsData = allBuildings.map(building => ({
          Name: building.name,
          Type: building.type || '',
          NumberOfRooms: building.rooms?.length || 0,
          Status: building.status || 'Active'
        }));
        exportToCSV(buildingsData, 'Buildings');
        break;
      
      case 3: // Rooms
        const roomsData = allRooms.map(room => ({
          RoomNumber: room.roomNumber,
          Building: room.buildingName || '',
          Type: room.type || '',
          Price: room.price || 0,
          Occupancy: `${room.occupants?.length || 0} / ${room.type?.toLowerCase() === 'single' ? 1 : 2}`,
          Status: room.status || 'Available'
        }));
        exportToCSV(roomsData, 'Rooms');
        break;
      
      case 4: // Forms
        const formsData = allForms.map(form => ({
          FormID: form._id?.substring(0, 8) || '',
          Student: form.student?.name || form.studentName || '',
          Type: form.formType || form.type || '',
          DateSubmitted: form.createdAt || form.submissionDate || '',
          Status: form.status || 'Pending'
        }));
        exportToCSV(formsData, 'Forms');
        break;
      
      case 5: // Bills
        const billsData = allBills.map(bill => ({
          BillID: bill._id?.substring(0, 8) || '',
          Student: bill.student?.name || '',
          Description: bill.notes || `Bill for ${formatDate(bill.billingPeriodStart)}` || '',
          Amount: bill.totalAmount || 
            (bill.rentalFee + 
            (bill.waterFee || 0) + 
            (bill.electricityFee || 0) +
            ((bill.otherFees && Array.isArray(bill.otherFees)) 
              ? bill.otherFees.reduce((sum, fee) => sum + (fee.amount || 0), 0) 
              : 0)) || 0,
          DueDate: bill.dueDate || '',
          Status: bill.status || bill.paymentStatus || 'Pending'
        }));
        exportToCSV(billsData, 'Bills');
        break;
      
      case 6: // Staff
        const staffData = allStaff.map(staff => ({
          Name: staff.name,
          Email: staff.email,
          Role: staff.role || 'Staff'
        }));
        exportToCSV(staffData, 'Staff');
        break;
      
      case 7: // Offenses
        const offensesData = allOffenses.map(offense => ({
          Date: offense.dateOfOffense || offense.createdAt || '',
          Student: offense.studentName || '',
          Reason: offense.offenseReason || '',
          Type: offense.typeOfOffense || 'Unknown',
          RecordedBy: offense.recordedByName || 'Admin'
        }));
        exportToCSV(offensesData, 'Offenses');
        break;
      
      default:
        if (selectedStudent && studentDetails) {
          // Export the selected student's details
          const studentData = [{
            Name: studentDetails.student.name,
            Email: studentDetails.student.email || '',
            StudentDormNumber: studentDetails.student.studentDormNumber || '',
            Address: studentDetails.student.address || '',
            ParentsAddress: studentDetails.student.parentsAddress || '',
            FatherContact: studentDetails.student.fatherContact || '',
            MotherContact: studentDetails.student.motherContact || '',
            Building: studentDetails.building?.name || '',
            RoomNumber: studentDetails.room?.roomNumber || ''
          }];
          exportToCSV(studentData, `Student_${studentDetails.student.name.replace(/\s+/g, '_')}`);
        } else {
          setSnackbar({
            open: true,
            message: 'Please select a student first',
            severity: 'warning'
          });
        }
    }
  };

  return (
    <Box sx={{
      display: 'flex',
      minHeight: '100vh',
      background: 'linear-gradient(145deg, #0A0A0A 0%, #141414 100%)',
      color: '#fff'
    }}>
      <AdminSidebar />
      <Box component="main" sx={{ flexGrow: 1, p: 4 }}>
        {/* Header */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#fff' }}>
              Reports Dashboard
            </Typography>
            <Typography variant="body2" sx={{ color: '#9CA3AF', mt: 1 }}>
              Generate and view comprehensive reports
            </Typography>
          </Box>
          {tabValue === 0 && selectedStudent && (
            <Stack direction="row" spacing={2}>
              <Button
                variant="contained"
                startIcon={<PrintIcon />}
                onClick={handlePrint}
                sx={{
                  bgcolor: '#10B981',
                  '&:hover': { bgcolor: '#059669' }
                }}
              >
                Print Report
              </Button>
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={handleDownloadPDF}
                sx={{
                  bgcolor: 'rgba(255, 255, 255, 0.1)',
                  '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.2)' }
                }}
              >
                Download PDF
              </Button>
            </Stack>
          )}
        </Stack>

        {/* Tabs */}
        <Box sx={{ 
          borderBottom: 1, 
          borderColor: 'rgba(255, 255, 255, 0.1)',
          mb: 3,
          overflowX: 'auto',
          '::-webkit-scrollbar': {
            height: '6px',
          },
          '::-webkit-scrollbar-thumb': {
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '3px',
          }
        }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            textColor="inherit"
            sx={{
              '& .MuiTabs-indicator': {
                backgroundColor: '#10B981',
              },
              '& .MuiTab-root': {
                color: '#9CA3AF',
                '&.Mui-selected': {
                  color: '#10B981',
                },
              },
            }}
          >
            <Tab 
              icon={<PersonIcon sx={{ mr: 1 }} />}
              label="Student Details" 
              iconPosition="start"
            />
            <Tab 
              icon={<PersonIcon sx={{ mr: 1 }} />}
              label="All Students" 
              iconPosition="start"
            />
            <Tab 
              icon={<BuildingIcon sx={{ mr: 1 }} />}
              label="Buildings" 
              iconPosition="start"
            />
            <Tab 
              icon={<RoomIcon sx={{ mr: 1 }} />}
              label="Rooms" 
              iconPosition="start"
            />
            <Tab 
              icon={<FormIcon sx={{ mr: 1 }} />}
              label="Forms" 
              iconPosition="start"
            />
            <Tab 
              icon={<BillIcon sx={{ mr: 1 }} />}
              label="Bills" 
              iconPosition="start"
            />
            <Tab 
              icon={<StaffIcon sx={{ mr: 1 }} />}
              label="Staff" 
              iconPosition="start"
            />
            <Tab 
              icon={<OffenseIcon sx={{ mr: 1 }} />}
              label="Offense History" 
              iconPosition="start"
            />
          </Tabs>
        </Box>

        {/* Tab Content */}
        {tabValue === 0 && (
          // Student Details Tab
          <>
            {/* Student Selection */}
            <Card sx={{
              mb: 4,
              background: 'linear-gradient(145deg, #141414 0%, #0A0A0A 100%)',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.03)',
              p: 3
            }}>
              <Autocomplete
                options={students}
                getOptionLabel={(option) => option.name || 'Unnamed Student'}
                value={selectedStudent}
                onChange={(_, newValue) => setSelectedStudent(newValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Search Student"
                    variant="outlined"
                    fullWidth
                    sx={{
                      '& .MuiInputBase-root': {
                        color: 'white',
                        bgcolor: 'rgba(255, 255, 255, 0.05)',
                      },
                      '& .MuiInputLabel-root': {
                        color: '#9CA3AF'
                      },
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255, 255, 255, 0.1)'
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255, 255, 255, 0.2)'
                      }
                    }}
                  />
                )}
              />
            </Card>

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress sx={{ color: '#10B981' }} />
              </Box>
            ) : error ? (
              <Alert severity="error" sx={{ mb: 4 }}>
                {error}
              </Alert>
            ) : studentDetails ? (
              <Stack spacing={3} id="student-report-content">
                {/* Personal Information */}
                <Accordion defaultExpanded sx={{
                  background: 'linear-gradient(145deg, #141414 0%, #0A0A0A 100%)',
                  borderRadius: '20px !important',
                  border: '1px solid rgba(255, 255, 255, 0.03)',
                  '&:before': { display: 'none' }
                }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#fff' }} />}>
                    <Typography variant="h6" sx={{ color: '#fff' }}>Personal Information</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Stack spacing={2}>
                      <Box>
                        <Typography variant="subtitle2" sx={{ color: '#9CA3AF' }}>Name</Typography>
                        <Typography sx={{ color: '#fff' }}>{studentDetails.student.name}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="subtitle2" sx={{ color: '#9CA3AF' }}>Email</Typography>
                        <Typography sx={{ color: '#fff' }}>{studentDetails.student.email || 'N/A'}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="subtitle2" sx={{ color: '#9CA3AF' }}>Student Dorm Number</Typography>
                        <Typography sx={{ color: '#fff' }}>{studentDetails.student.studentDormNumber || 'N/A'}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="subtitle2" sx={{ color: '#9CA3AF' }}>Address</Typography>
                        <Typography sx={{ color: '#fff' }}>{studentDetails.student.address || 'N/A'}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="subtitle2" sx={{ color: '#9CA3AF' }}>Parents Address</Typography>
                        <Typography sx={{ color: '#fff' }}>{studentDetails.student.parentsAddress || 'N/A'}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="subtitle2" sx={{ color: '#9CA3AF' }}>Contact Information</Typography>
                        <Typography sx={{ color: '#fff' }}>
                          Father: {studentDetails.student.fatherContact || 'N/A'}<br />
                          Mother: {studentDetails.student.motherContact || 'N/A'}
                        </Typography>
                      </Box>
                    </Stack>
                  </AccordionDetails>
                </Accordion>

                {/* Room & Building Information */}
                <Accordion sx={{
                  background: 'linear-gradient(145deg, #141414 0%, #0A0A0A 100%)',
                  borderRadius: '20px !important',
                  border: '1px solid rgba(255, 255, 255, 0.03)',
                  '&:before': { display: 'none' }
                }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#fff' }} />}>
                    <Typography variant="h6" sx={{ color: '#fff' }}>Room & Building</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    {!studentDetails.room && !studentDetails.building ? (
                      <Typography sx={{ color: '#9CA3AF', fontStyle: 'italic' }}>
                        No room or building information available
                      </Typography>
                    ) : (
                      <Stack spacing={2}>
                        <Box>
                          <Typography variant="subtitle2" sx={{ color: '#9CA3AF' }}>Building</Typography>
                          <Typography sx={{ color: '#fff' }}>{studentDetails.building?.name || 'N/A'}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="subtitle2" sx={{ color: '#9CA3AF' }}>Room Number</Typography>
                          <Typography sx={{ color: '#fff' }}>{studentDetails.room?.roomNumber || 'N/A'}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="subtitle2" sx={{ color: '#9CA3AF' }}>Room Type</Typography>
                          <Typography sx={{ color: '#fff' }}>{studentDetails.room?.type || 'N/A'}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="subtitle2" sx={{ color: '#9CA3AF' }}>Price</Typography>
                          <Typography sx={{ color: '#fff' }}>{studentDetails.room?.price ? formatCurrency(studentDetails.room.price) : 'N/A'}</Typography>
                        </Box>
                      </Stack>
                    )}
                  </AccordionDetails>
                </Accordion>

                {/* Offense & Violations */}
                <Accordion sx={{
                  background: 'linear-gradient(145deg, #141414 0%, #0A0A0A 100%)',
                  borderRadius: '20px !important',
                  border: '1px solid rgba(255, 255, 255, 0.03)',
                  '&:before': { display: 'none' }
                }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#fff' }} />}>
                    <Typography variant="h6" sx={{ color: '#fff' }}>Offense & Violations</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    {!Array.isArray(studentDetails.offenses) || studentDetails.offenses.length === 0 ? (
                      <Typography sx={{ color: '#9CA3AF', fontStyle: 'italic' }}>
                        No offenses or violations recorded
                      </Typography>
                    ) : (
                      <TableContainer>
                        <Table>
                          <TableHead>
                            <TableRow>
                              <TableCell sx={{ color: '#9CA3AF' }}>Date</TableCell>
                              <TableCell sx={{ color: '#9CA3AF' }}>Reason</TableCell>
                              <TableCell sx={{ color: '#9CA3AF' }}>Type</TableCell>
                              <TableCell sx={{ color: '#9CA3AF' }}>Recorded By</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {studentDetails.offenses.map((offense, index) => (
                              <TableRow key={offense._id || `offense-${index}`}>
                                <TableCell sx={{ color: '#fff' }}>
                                  {formatDate(offense.dateOfOffense || offense.createdAt)}
                                </TableCell>
                                <TableCell sx={{ color: '#fff' }}>{offense.offenseReason || 'N/A'}</TableCell>
                                <TableCell>
                                  <Chip
                                    label={offense.typeOfOffense || 'Unknown'}
                                    color={
                                      offense.typeOfOffense?.includes('1st') || offense.typeOfOffense?.includes('Minor') ? 'info' :
                                      offense.typeOfOffense?.includes('2nd') || offense.typeOfOffense?.includes('3rd') ? 'warning' :
                                      'error'
                                    }
                                    size="small"
                                  />
                                </TableCell>
                                <TableCell sx={{ color: '#fff' }}>{offense.recordedByName || 'Admin'}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    )}
                  </AccordionDetails>
                </Accordion>

                {/* Forms */}
                <Accordion sx={{
                  background: 'linear-gradient(145deg, #141414 0%, #0A0A0A 100%)',
                  borderRadius: '20px !important',
                  border: '1px solid rgba(255, 255, 255, 0.03)',
                  '&:before': { display: 'none' }
                }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#fff' }} />}>
                    <Typography variant="h6" sx={{ color: '#fff' }}>Forms & Documentation</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    {!Array.isArray(studentDetails.forms) || studentDetails.forms.length === 0 ? (
                      <Typography sx={{ color: '#9CA3AF', fontStyle: 'italic' }}>
                        No form submissions available
                      </Typography>
                    ) : (
                      <TableContainer>
                        <Table>
                          <TableHead>
                            <TableRow>
                              <TableCell sx={{ color: '#9CA3AF' }}>Date</TableCell>
                              <TableCell sx={{ color: '#9CA3AF' }}>Type</TableCell>
                              <TableCell sx={{ color: '#9CA3AF' }}>Status</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {studentDetails.forms.map((form, index) => (
                              <TableRow key={form._id || `form-${index}`}>
                                <TableCell sx={{ color: '#fff' }}>
                                  {formatDate(form.createdAt || form.submissionDate)}
                                </TableCell>
                                <TableCell sx={{ color: '#fff' }}>{form.formType || form.type || 'N/A'}</TableCell>
                                <TableCell>
                                  <Chip
                                    label={form.status || 'Unknown'}
                                    color={
                                      form.status === 'Approved' || form.status === 'Completed' ? 'success' :
                                      form.status === 'Pending' || form.status === 'Assigned' || form.status === 'In Progress' ? 'warning' : 'error'
                                    }
                                    size="small"
                                  />
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    )}
                  </AccordionDetails>
                </Accordion>

                {/* Bills & Payments */}
                <Accordion sx={{
                  background: 'linear-gradient(145deg, #141414 0%, #0A0A0A 100%)',
                  borderRadius: '20px !important',
                  border: '1px solid rgba(255, 255, 255, 0.03)',
                  '&:before': { display: 'none' }
                }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#fff' }} />}>
                    <Typography variant="h6" sx={{ color: '#fff' }}>Bills & Payments</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    {!Array.isArray(studentDetails.bills) || studentDetails.bills.length === 0 ? (
                      <Typography sx={{ color: '#9CA3AF', fontStyle: 'italic' }}>
                        No billing information available
                      </Typography>
                    ) : (
                      <TableContainer>
                        <Table>
                          <TableHead>
                            <TableRow>
                              <TableCell sx={{ color: '#9CA3AF' }}>Date</TableCell>
                              <TableCell sx={{ color: '#9CA3AF' }}>Description</TableCell>
                              <TableCell sx={{ color: '#9CA3AF' }}>Amount</TableCell>
                              <TableCell sx={{ color: '#9CA3AF' }}>Status</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {studentDetails.bills.map((bill, index) => (
                              <TableRow key={bill._id || `bill-${index}`}>
                                <TableCell sx={{ color: '#fff' }}>
                                  {formatDate(bill.createdAt || bill.date)}
                                </TableCell>
                                <TableCell sx={{ color: '#fff' }}>
                                  {bill.notes || `Bill for ${formatDate(bill.billingPeriodStart)} - ${formatDate(bill.billingPeriodEnd)}` || 'N/A'}
                                </TableCell>
                                <TableCell sx={{ color: '#fff' }}>
                                  {formatCurrency(bill.totalAmount || 
                                    (bill.rentalFee + 
                                    (bill.waterFee || 0) + 
                                    (bill.electricityFee || 0) +
                                    ((bill.otherFees && Array.isArray(bill.otherFees)) 
                                      ? bill.otherFees.reduce((sum, fee) => sum + (fee.amount || 0), 0) 
                                      : 0)) || 0)}
                                </TableCell>
                                <TableCell>
                                  <Chip
                                    label={bill.status || bill.paymentStatus || 'Unknown'}
                                    color={
                                      (bill.status === 'paid' || bill.paymentStatus === 'Paid') ? 'success' :
                                      (bill.status === 'overdue' || bill.paymentStatus === 'Overdue') ? 'error' : 'warning'
                                    }
                                    size="small"
                                  />
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    )}
                  </AccordionDetails>
                </Accordion>

                {/* Check-in/Check-out Logs */}
                <Accordion sx={{
                  background: 'linear-gradient(145deg, #141414 0%, #0A0A0A 100%)',
                  borderRadius: '20px !important',
                  border: '1px solid rgba(255, 255, 255, 0.03)',
                  '&:before': { display: 'none' }
                }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#fff' }} />}>
                    <Typography variant="h6" sx={{ color: '#fff' }}>Check in & Check Out</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    {!Array.isArray(studentDetails.logs) || studentDetails.logs.length === 0 ? (
                      <Typography sx={{ color: '#9CA3AF', fontStyle: 'italic' }}>
                        No check-in/check-out history available
                      </Typography>
                    ) : (
                      <TableContainer>
                        <Table>
                          <TableHead>
                            <TableRow>
                              <TableCell sx={{ color: '#9CA3AF' }}>Date</TableCell>
                              <TableCell sx={{ color: '#9CA3AF' }}>Check In</TableCell>
                              <TableCell sx={{ color: '#9CA3AF' }}>Check Out</TableCell>
                              <TableCell sx={{ color: '#9CA3AF' }}>Status</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {studentDetails.logs.map((log, logIndex) => {
                              if (!log || !log.entries || !Array.isArray(log.entries)) {
                                return (
                                  <TableRow key={log?._id || `log-${logIndex}`}>
                                    <TableCell colSpan={4} sx={{ color: '#9CA3AF', textAlign: 'center' }}>
                                      Invalid log entry format
                                    </TableCell>
                                  </TableRow>
                                );
                              }
                              
                              return log.entries.map((entry, entryIndex) => (
                                <TableRow key={`${log._id || logIndex}-${entryIndex}`}>
                                  <TableCell sx={{ color: '#fff' }}>
                                    {formatDate(entry.checkInTime || entry.checkOutTime)}
                                  </TableCell>
                                  <TableCell sx={{ color: '#fff' }}>
                                    {entry.checkInTime ? formatTime(entry.checkInTime) : 'N/A'}
                                  </TableCell>
                                  <TableCell sx={{ color: '#fff' }}>
                                    {entry.checkOutTime ? formatTime(entry.checkOutTime) : 'No Checkout'}
                                  </TableCell>
                                  <TableCell>
                                    <Stack direction="row" spacing={1}>
                                      {entry.checkInStatus && (
                                        <Chip
                                          label={`In: ${entry.checkInStatus}`}
                                          color={
                                            entry.checkInStatus === 'OnTime' ? 'success' :
                                            entry.checkInStatus === 'Late' ? 'warning' :
                                            entry.checkInStatus === 'Excused' ? 'info' : 'error'
                                          }
                                          size="small"
                                        />
                                      )}
                                      {entry.checkOutStatus && (
                                        <Chip
                                          label={`Out: ${entry.checkOutStatus}`}
                                          color={
                                            entry.checkOutStatus === 'OnTime' ? 'success' :
                                            entry.checkOutStatus === 'Late' ? 'warning' :
                                            entry.checkOutStatus === 'Excused' ? 'info' : 'error'
                                          }
                                          size="small"
                                        />
                                      )}
                                    </Stack>
                                  </TableCell>
                                </TableRow>
                              ));
                            })}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    )}
                  </AccordionDetails>
                </Accordion>
              </Stack>
            ) : null}
          </>
        )}

        {tabValue === 1 && (
          // All Students Tab
          <Card sx={{
            background: 'linear-gradient(145deg, #141414 0%, #0A0A0A 100%)',
            borderRadius: '20px',
            border: '1px solid rgba(255, 255, 255, 0.03)',
            mb: 4,
            overflow: 'hidden'
          }}>
            <Box sx={{ 
              p: 3, 
              borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <Typography variant="h6" sx={{ color: '#fff' }}>All Students</Typography>
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={handleExportCSV}
                sx={{
                  bgcolor: 'rgba(255, 255, 255, 0.1)',
                  '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.2)' }
                }}
              >
                Export CSV
              </Button>
            </Box>
            {loadingCategory.students ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress sx={{ color: '#10B981' }} />
              </Box>
            ) : (
              <TableContainer sx={{ maxHeight: '70vh' }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ bgcolor: '#0A0A0A', color: '#9CA3AF' }}>Student Name</TableCell>
                      <TableCell sx={{ bgcolor: '#0A0A0A', color: '#9CA3AF' }}>Email</TableCell>
                      <TableCell sx={{ bgcolor: '#0A0A0A', color: '#9CA3AF' }}>Contact</TableCell>
                      <TableCell sx={{ bgcolor: '#0A0A0A', color: '#9CA3AF' }}>Building</TableCell>
                      <TableCell sx={{ bgcolor: '#0A0A0A', color: '#9CA3AF' }}>Room Number</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {allStudents.map((student) => (
                      <TableRow key={student._id}>
                        <TableCell sx={{ color: '#fff' }}>{student.name}</TableCell>
                        <TableCell sx={{ color: '#fff' }}>{student.email}</TableCell>
                        <TableCell sx={{ color: '#fff' }}>{student.contactInfo || 'N/A'}</TableCell>
                        <TableCell sx={{ color: '#fff' }}>{student.buildingData?.name || 'N/A'}</TableCell>
                        <TableCell sx={{ color: '#fff' }}>{student.roomData?.roomNumber || 'N/A'}</TableCell>
                      </TableRow>
                    ))}
                    {allStudents.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ color: '#9CA3AF' }}>
                          No students found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Card>
        )}

        {tabValue === 2 && (
          // All Buildings Tab
          <Card sx={{
            background: 'linear-gradient(145deg, #141414 0%, #0A0A0A 100%)',
            borderRadius: '20px',
            border: '1px solid rgba(255, 255, 255, 0.03)',
            mb: 4,
            overflow: 'hidden'
          }}>
            <Box sx={{ 
              p: 3, 
              borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <Typography variant="h6" sx={{ color: '#fff' }}>All Buildings</Typography>
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={handleExportCSV}
                sx={{
                  bgcolor: 'rgba(255, 255, 255, 0.1)',
                  '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.2)' }
                }}
              >
                Export CSV
              </Button>
            </Box>
            {loadingCategory.buildings ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress sx={{ color: '#10B981' }} />
              </Box>
            ) : (
              <TableContainer sx={{ maxHeight: '70vh' }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ bgcolor: '#0A0A0A', color: '#9CA3AF' }}>Building Name</TableCell>
                      <TableCell sx={{ bgcolor: '#0A0A0A', color: '#9CA3AF' }}>Type</TableCell>
                      <TableCell sx={{ bgcolor: '#0A0A0A', color: '#9CA3AF' }}>Number of Rooms</TableCell>
                      <TableCell sx={{ bgcolor: '#0A0A0A', color: '#9CA3AF' }}>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {allBuildings.map((building) => (
                      <TableRow key={building._id}>
                        <TableCell sx={{ color: '#fff' }}>{building.name}</TableCell>
                        <TableCell sx={{ color: '#fff' }}>{building.type || 'N/A'}</TableCell>
                        <TableCell sx={{ color: '#fff' }}>{building.rooms?.length || '0'}</TableCell>
                        <TableCell sx={{ color: '#fff' }}>
                          <Chip 
                            label={building.status || 'Active'} 
                            color={building.status === 'Inactive' ? 'error' : 'success'}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                    {allBuildings.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} align="center" sx={{ color: '#9CA3AF' }}>
                          No buildings found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Card>
        )}

        {tabValue === 3 && (
          // All Rooms Tab
          <Card sx={{
            background: 'linear-gradient(145deg, #141414 0%, #0A0A0A 100%)',
            borderRadius: '20px',
            border: '1px solid rgba(255, 255, 255, 0.03)',
            mb: 4,
            overflow: 'hidden'
          }}>
            <Box sx={{ 
              p: 3, 
              borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <Typography variant="h6" sx={{ color: '#fff' }}>All Rooms</Typography>
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={handleExportCSV}
                sx={{
                  bgcolor: 'rgba(255, 255, 255, 0.1)',
                  '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.2)' }
                }}
              >
                Export CSV
              </Button>
            </Box>
            {loadingCategory.rooms ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress sx={{ color: '#10B981' }} />
              </Box>
            ) : (
              <TableContainer sx={{ maxHeight: '70vh' }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ bgcolor: '#0A0A0A', color: '#9CA3AF' }}>Room Number</TableCell>
                      <TableCell sx={{ bgcolor: '#0A0A0A', color: '#9CA3AF' }}>Building</TableCell>
                      <TableCell sx={{ bgcolor: '#0A0A0A', color: '#9CA3AF' }}>Type</TableCell>
                      <TableCell sx={{ bgcolor: '#0A0A0A', color: '#9CA3AF' }}>Price</TableCell>
                      <TableCell sx={{ bgcolor: '#0A0A0A', color: '#9CA3AF' }}>Occupancy</TableCell>
                      <TableCell sx={{ bgcolor: '#0A0A0A', color: '#9CA3AF' }}>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {allRooms.map((room) => (
                      <TableRow key={room._id}>
                        <TableCell sx={{ color: '#fff' }}>{room.roomNumber}</TableCell>
                        <TableCell sx={{ color: '#fff' }}>{room.buildingName || 'N/A'}</TableCell>
                        <TableCell sx={{ color: '#fff' }}>{room.type || 'N/A'}</TableCell>
                        <TableCell sx={{ color: '#fff' }}>{formatCurrency(room.price) || 'N/A'}</TableCell>
                        <TableCell sx={{ color: '#fff' }}>
                          {room.type?.toLowerCase() === 'single' 
                            ? `${room.occupants?.length || 0} / 1`
                            : `${room.occupants?.length || 0} / 2`}
                        </TableCell>
                        <TableCell sx={{ color: '#fff' }}>
                          <Chip 
                            label={room.status || 'Available'} 
                            color={
                              room.status === 'Available' ? 'success' :
                              room.status === 'Occupied' ? 'warning' :
                              room.status === 'Maintenance' ? 'error' : 'default'
                            }
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                    {allRooms.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ color: '#9CA3AF' }}>
                          No rooms found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Card>
        )}

        {tabValue === 4 && (
          // All Forms Tab
          <Card sx={{
            background: 'linear-gradient(145deg, #141414 0%, #0A0A0A 100%)',
            borderRadius: '20px',
            border: '1px solid rgba(255, 255, 255, 0.03)',
            mb: 4,
            overflow: 'hidden'
          }}>
            <Box sx={{ 
              p: 3, 
              borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <Typography variant="h6" sx={{ color: '#fff' }}>All Forms</Typography>
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={handleExportCSV}
                sx={{
                  bgcolor: 'rgba(255, 255, 255, 0.1)',
                  '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.2)' }
                }}
              >
                Export CSV
              </Button>
            </Box>
            {loadingCategory.forms ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress sx={{ color: '#10B981' }} />
              </Box>
            ) : (
              <TableContainer sx={{ maxHeight: '70vh' }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ bgcolor: '#0A0A0A', color: '#9CA3AF' }}>Form ID</TableCell>
                      <TableCell sx={{ bgcolor: '#0A0A0A', color: '#9CA3AF' }}>Student</TableCell>
                      <TableCell sx={{ bgcolor: '#0A0A0A', color: '#9CA3AF' }}>Type</TableCell>
                      <TableCell sx={{ bgcolor: '#0A0A0A', color: '#9CA3AF' }}>Date Submitted</TableCell>
                      <TableCell sx={{ bgcolor: '#0A0A0A', color: '#9CA3AF' }}>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {allForms.map((form) => (
                      <TableRow key={form._id}>
                        <TableCell sx={{ color: '#fff' }}>{form._id.substring(0, 8)}...</TableCell>
                        <TableCell sx={{ color: '#fff' }}>
                          {form.student?.name || form.studentName || 'N/A'}
                        </TableCell>
                        <TableCell sx={{ color: '#fff' }}>{form.formType || form.type || 'N/A'}</TableCell>
                        <TableCell sx={{ color: '#fff' }}>
                          {formatDate(form.createdAt || form.submissionDate)}
                        </TableCell>
                        <TableCell sx={{ color: '#fff' }}>
                          <Chip 
                            label={form.status || 'Pending'} 
                            color={
                              form.status === 'Approved' || form.status === 'Completed' ? 'success' :
                              form.status === 'Pending' || form.status === 'In Progress' ? 'warning' :
                              form.status === 'Rejected' ? 'error' : 'default'
                            }
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                    {allForms.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ color: '#9CA3AF' }}>
                          No forms found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Card>
        )}

        {tabValue === 5 && (
          // All Bills Tab
          <Card sx={{
            background: 'linear-gradient(145deg, #141414 0%, #0A0A0A 100%)',
            borderRadius: '20px',
            border: '1px solid rgba(255, 255, 255, 0.03)',
            mb: 4,
            overflow: 'hidden'
          }}>
            <Box sx={{ 
              p: 3, 
              borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <Typography variant="h6" sx={{ color: '#fff' }}>All Bills</Typography>
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={handleExportCSV}
                sx={{
                  bgcolor: 'rgba(255, 255, 255, 0.1)',
                  '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.2)' }
                }}
              >
                Export CSV
              </Button>
            </Box>
            {loadingCategory.bills ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress sx={{ color: '#10B981' }} />
              </Box>
            ) : (
              <TableContainer sx={{ maxHeight: '70vh' }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ bgcolor: '#0A0A0A', color: '#9CA3AF' }}>Bill ID</TableCell>
                      <TableCell sx={{ bgcolor: '#0A0A0A', color: '#9CA3AF' }}>Student</TableCell>
                      <TableCell sx={{ bgcolor: '#0A0A0A', color: '#9CA3AF' }}>Description</TableCell>
                      <TableCell sx={{ bgcolor: '#0A0A0A', color: '#9CA3AF' }}>Amount</TableCell>
                      <TableCell sx={{ bgcolor: '#0A0A0A', color: '#9CA3AF' }}>Due Date</TableCell>
                      <TableCell sx={{ bgcolor: '#0A0A0A', color: '#9CA3AF' }}>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {allBills.map((bill) => (
                      <TableRow key={bill._id}>
                        <TableCell sx={{ color: '#fff' }}>{bill._id.substring(0, 8)}...</TableCell>
                        <TableCell sx={{ color: '#fff' }}>
                          {bill.student?.name || 'N/A'}
                        </TableCell>
                        <TableCell sx={{ color: '#fff' }}>
                          {bill.description || bill.notes || `Bill for ${formatDate(bill.billingPeriodStart)}` || 'N/A'}
                        </TableCell>
                        <TableCell sx={{ color: '#fff' }}>
                          {formatCurrency(bill.totalAmount || 
                            (bill.rentalFee + 
                            (bill.waterFee || 0) + 
                            (bill.electricityFee || 0) +
                            ((bill.otherFees && Array.isArray(bill.otherFees)) 
                              ? bill.otherFees.reduce((sum, fee) => sum + (fee.amount || 0), 0) 
                              : 0)) || 0)}
                        </TableCell>
                        <TableCell sx={{ color: '#fff' }}>
                          {formatDate(bill.dueDate)}
                        </TableCell>
                        <TableCell sx={{ color: '#fff' }}>
                          <Chip 
                            label={bill.status || bill.paymentStatus || 'Pending'} 
                            color={
                              (bill.status === 'paid' || bill.paymentStatus === 'Paid') ? 'success' :
                              (bill.status === 'overdue' || bill.paymentStatus === 'Overdue') ? 'error' : 'warning'
                            }
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                    {allBills.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ color: '#9CA3AF' }}>
                          No bills found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Card>
        )}

        {tabValue === 6 && (
          // All Staff Tab
          <Card sx={{
            background: 'linear-gradient(145deg, #141414 0%, #0A0A0A 100%)',
            borderRadius: '20px',
            border: '1px solid rgba(255, 255, 255, 0.03)',
            mb: 4,
            overflow: 'hidden'
          }}>
            <Box sx={{ 
              p: 3, 
              borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <Typography variant="h6" sx={{ color: '#fff' }}>All Staff</Typography>
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={handleExportCSV}
                sx={{
                  bgcolor: 'rgba(255, 255, 255, 0.1)',
                  '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.2)' }
                }}
              >
                Export CSV
              </Button>
            </Box>
            {loadingCategory.staff ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress sx={{ color: '#10B981' }} />
              </Box>
            ) : (
              <TableContainer sx={{ maxHeight: '70vh' }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ bgcolor: '#0A0A0A', color: '#9CA3AF' }}>Name</TableCell>
                      <TableCell sx={{ bgcolor: '#0A0A0A', color: '#9CA3AF' }}>Email</TableCell>
                      <TableCell sx={{ bgcolor: '#0A0A0A', color: '#9CA3AF' }}>Role</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {allStaff.map((staff) => (
                      <TableRow key={staff._id}>
                        <TableCell sx={{ color: '#fff' }}>{staff.name}</TableCell>
                        <TableCell sx={{ color: '#fff' }}>{staff.email}</TableCell>
                        <TableCell sx={{ color: '#fff' }}>{staff.role || 'Staff'}</TableCell>
                      </TableRow>
                    ))}
                    {allStaff.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={3} align="center" sx={{ color: '#9CA3AF' }}>
                          No staff found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Card>
        )}

        {tabValue === 7 && (
          // All Offenses Tab
          <Card sx={{
            background: 'linear-gradient(145deg, #141414 0%, #0A0A0A 100%)',
            borderRadius: '20px',
            border: '1px solid rgba(255, 255, 255, 0.03)',
            mb: 4,
            overflow: 'hidden'
          }}>
            <Box sx={{ 
              p: 3, 
              borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <Typography variant="h6" sx={{ color: '#fff' }}>Offense History</Typography>
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={handleExportCSV}
                sx={{
                  bgcolor: 'rgba(255, 255, 255, 0.1)',
                  '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.2)' }
                }}
              >
                Export CSV
              </Button>
            </Box>
            {loadingCategory.offenses ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress sx={{ color: '#10B981' }} />
              </Box>
            ) : (
              <TableContainer sx={{ maxHeight: '70vh' }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ bgcolor: '#0A0A0A', color: '#9CA3AF' }}>Date of Offense</TableCell>
                      <TableCell sx={{ bgcolor: '#0A0A0A', color: '#9CA3AF' }}>Student</TableCell>
                      <TableCell sx={{ bgcolor: '#0A0A0A', color: '#9CA3AF' }}>Reason</TableCell>
                      <TableCell sx={{ bgcolor: '#0A0A0A', color: '#9CA3AF' }}>Type</TableCell>
                      <TableCell sx={{ bgcolor: '#0A0A0A', color: '#9CA3AF' }}>Recorded By</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {allOffenses.map((offense) => (
                      <TableRow key={offense._id}>
                        <TableCell sx={{ color: '#fff' }}>
                          {formatDate(offense.dateOfOffense || offense.createdAt)}
                        </TableCell>
                        <TableCell sx={{ color: '#fff' }}>{offense.studentName}</TableCell>
                        <TableCell sx={{ color: '#fff' }}>{offense.offenseReason || 'N/A'}</TableCell>
                        <TableCell>
                          <Chip
                            label={offense.typeOfOffense || 'Unknown'}
                            color={
                              offense.typeOfOffense?.includes('1st') || offense.typeOfOffense?.includes('Minor') ? 'info' :
                              offense.typeOfOffense?.includes('2nd') || offense.typeOfOffense?.includes('3rd') ? 'warning' :
                              'error'
                            }
                            size="small"
                          />
                        </TableCell>
                        <TableCell sx={{ color: '#fff' }}>{offense.recordedByName || 'Admin'}</TableCell>
                      </TableRow>
                    ))}
                    {allOffenses.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ color: '#9CA3AF' }}>
                          No offenses found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Card>
        )}

        {/* Print Dialog */}
        <Dialog
          open={isPrintDialogOpen}
          onClose={() => setIsPrintDialogOpen(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              background: 'linear-gradient(145deg, #141414 0%, #0A0A0A 100%)',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.03)',
            }
          }}
        >
          <DialogTitle sx={{ color: '#fff' }}>Print Report</DialogTitle>
          <DialogContent>
            <Typography sx={{ color: '#9CA3AF' }}>
              Select the sections you want to include in the printed report.
            </Typography>
            {/* Add print options here */}
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setIsPrintDialogOpen(false)}
              sx={{ color: '#9CA3AF' }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={() => {
                window.print();
                setIsPrintDialogOpen(false);
              }}
              sx={{
                bgcolor: '#10B981',
                '&:hover': { bgcolor: '#059669' }
              }}
            >
              Print
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert 
            onClose={handleCloseSnackbar} 
            severity={snackbar.severity}
            sx={{ 
              width: '100%',
              bgcolor: snackbar.severity === 'success' ? 'rgba(16, 185, 129, 0.1)' : 
                      snackbar.severity === 'warning' ? 'rgba(245, 158, 11, 0.1)' :
                      snackbar.severity === 'error' ? 'rgba(239, 68, 68, 0.1)' : 
                      'rgba(59, 130, 246, 0.1)',
              color: snackbar.severity === 'success' ? '#10B981' : 
                     snackbar.severity === 'warning' ? '#F59E0B' :
                     snackbar.severity === 'error' ? '#EF4444' : 
                     '#3B82F6',
              border: `1px solid ${
                snackbar.severity === 'success' ? 'rgba(16, 185, 129, 0.2)' : 
                snackbar.severity === 'warning' ? 'rgba(245, 158, 11, 0.2)' :
                snackbar.severity === 'error' ? 'rgba(239, 68, 68, 0.2)' : 
                'rgba(59, 130, 246, 0.2)'
              }`,
              '& .MuiAlert-icon': {
                color: snackbar.severity === 'success' ? '#10B981' : 
                       snackbar.severity === 'warning' ? '#F59E0B' :
                       snackbar.severity === 'error' ? '#EF4444' : 
                       '#3B82F6'
              }
            }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </Box>
  );
};

export default AdminReport;

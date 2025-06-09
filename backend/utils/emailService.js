const nodemailer = require('nodemailer');

// Create a transporter using Gmail SMTP
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  },
  tls: {
    rejectUnauthorized: false // Allow self-signed certificates
  }
});

// Function to send application confirmation email
const sendApplicationConfirmationEmail = async (recipientEmail, studentName, htmlContent) => {
  try {
    // Default HTML template if none is provided
    const defaultHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #1D503A; margin-bottom: 10px;">Application Status Update</h1>
          <p style="color: #666; font-size: 16px;">Dear ${studentName},</p>
        </div>
        
        <div style="background-color: #f9f9f9; border-radius: 10px; padding: 20px; margin-bottom: 20px;">
          <p>Thank you for submitting your dormitory application. We have received your application and it is currently under review.</p>
        </div>
        
        <div style="background-color: #1D503A; color: white; padding: 15px; border-radius: 10px; margin-bottom: 20px;">
          <h3 style="margin: 0 0 10px 0;">What's Next?</h3>
          <p style="margin: 0;">We will review your application and notify you of any updates through this email address.</p>
        </div>
        
        <div style="color: #666; font-size: 14px; text-align: center;">
          <p>If you have any questions, please don't hesitate to contact us.</p>
          <p style="margin-top: 20px;">Best regards,<br>The Dormie Team</p>
        </div>
      </div>
    `;

    const mailOptions = {
      from: {
        name: 'Dormie Admin',
        address: process.env.EMAIL_USER
      },
      to: recipientEmail,
      subject: 'Dormie Application Status Update',
      html: htmlContent || defaultHtml
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

module.exports = {
  sendApplicationConfirmationEmail
}; 
const nodemailer = require('nodemailer');
require("dotenv").config()

const transporter = nodemailer.createTransport({
    service: 'gmail',
    secure : true,
    auth: {
        user: process.env.NODEMAILER_EMAIL,
        pass: process.env.NODEMAILER_PASSWORD
    }
})

const sendEmail = async (to ,subject, html) => {
    try {
        const mailOptions = {
            from: {
                name: 'F&G Team',
                address: process.env.NODEMAILER_EMAIL // Set the email address here
            },
            to,
            subject,
            html
        }

        transporter.verify(function (error, success) {
            if (error) {
              console.log("Error Inside helper",error);
            } else {
              console.log("Server is ready to take our messages" ,success);
            }
          });

          const isEmailSent = await transporter.sendMail(mailOptions);

          return isEmailSent;

    } catch (error) {
        console.error(`Error sending email: ${error.message}`);
        throw error;
    }
}

module.exports = sendEmail;
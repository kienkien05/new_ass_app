const nodemailer = require('nodemailer');
const prisma = require('../config/db');

// Create transporter for MailHog (development)
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'mailhog',
    port: parseInt(process.env.SMTP_PORT) || 1025,
    secure: false, // MailHog doesn't use TLS
    // No auth needed for MailHog
});

/**
 * Generate a random 6-digit OTP code
 */
const generateOTPCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Create and send OTP for a specific purpose
 * @param {string} email - Recipient email
 * @param {string} type - 'register' or 'login'
 * @returns {Promise<{success: boolean, message: string}>}
 */
const sendOTP = async (email, type) => {
    try {
        // Invalidate any existing unused OTPs for this email/type
        await prisma.otpCode.updateMany({
            where: {
                email,
                type,
                isUsed: false
            },
            data: { isUsed: true }
        });

        // Generate new OTP
        const code = generateOTPCode();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

        // Save to database
        await prisma.otpCode.create({
            data: {
                email,
                code,
                type,
                expiresAt
            }
        });

        // Determine email content based on type
        const subject = type === 'register'
            ? 'EViENT - Mã xác thực đăng ký tài khoản'
            : 'EViENT - Mã xác thực đăng nhập';

        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <style>
                    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
                    .container { max-width: 500px; margin: 0 auto; background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
                    .logo { text-align: center; margin-bottom: 30px; }
                    .logo h1 { color: #7c3aed; margin: 0; font-size: 32px; }
                    .otp-box { background: linear-gradient(135deg, #7c3aed, #a855f7); padding: 30px; border-radius: 12px; text-align: center; margin: 20px 0; }
                    .otp-code { font-size: 40px; font-weight: bold; color: white; letter-spacing: 8px; margin: 0; }
                    .message { color: #666; line-height: 1.6; margin: 20px 0; }
                    .warning { color: #ef4444; font-size: 14px; margin-top: 20px; }
                    .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="logo">
                        <h1>🎫 EViENT</h1>
                    </div>
                    <p class="message">
                        ${type === 'register'
                ? 'Cảm ơn bạn đã đăng ký tài khoản EViENT! Vui lòng sử dụng mã OTP dưới đây để hoàn tất đăng ký:'
                : 'Bạn đang đăng nhập vào tài khoản EViENT. Vui lòng nhập mã OTP dưới đây:'}
                    </p>
                    <div class="otp-box">
                        <p class="otp-code">${code}</p>
                    </div>
                    <p class="message">Mã này sẽ hết hạn sau <strong>5 phút</strong>.</p>
                    <p class="warning">⚠️ Không chia sẻ mã này với bất kỳ ai. Nhân viên EViENT không bao giờ hỏi mã OTP của bạn.</p>
                    <div class="footer">
                        <p>Email này được gửi tự động từ hệ thống EViENT.</p>
                        <p>© 2026 EViENT - Nền tảng quản lý sự kiện</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        // Send email
        await transporter.sendMail({
            from: '"EViENT" <noreply@evient.com>',
            to: email,
            subject: subject,
            html: htmlContent
        });

        console.log(`OTP sent to ${email}: ${code} (type: ${type})`);

        return { success: true, message: 'OTP đã được gửi đến email của bạn' };
    } catch (error) {
        console.error('Send OTP error:', error);
        return { success: false, message: 'Không thể gửi OTP. Vui lòng thử lại.' };
    }
};

/**
 * Verify OTP code
 * @param {string} email - Email to verify
 * @param {string} code - OTP code entered by user
 * @param {string} type - 'register' or 'login'
 * @returns {Promise<{valid: boolean, message: string}>}
 */
const verifyOTP = async (email, code, type) => {
    try {
        const otpRecord = await prisma.otpCode.findFirst({
            where: {
                email,
                code,
                type,
                isUsed: false,
                expiresAt: { gt: new Date() }
            },
            orderBy: { createdAt: 'desc' }
        });

        if (!otpRecord) {
            return { valid: false, message: 'Mã OTP không hợp lệ hoặc đã hết hạn' };
        }

        // Mark OTP as used
        await prisma.otpCode.update({
            where: { id: otpRecord.id },
            data: { isUsed: true }
        });

        return { valid: true, message: 'Xác thực thành công' };
    } catch (error) {
        console.error('Verify OTP error:', error);
        return { valid: false, message: 'Lỗi xác thực OTP' };
    }
};

/**
 * Resend OTP - Generates and sends a new OTP
 */
const resendOTP = async (email, type) => {
    return await sendOTP(email, type);
};

/**
 * Send password reset email
 * @param {string} email - Recipient email
 * @param {string} token - Reset token
 * @returns {Promise<{success: boolean, message: string}>}
 */
const sendPasswordResetEmail = async (email, token) => {
    try {
        const resetLink = `http://localhost:3000/reset-password/${token}`;

        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <style>
                    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
                    .container { max-width: 500px; margin: 0 auto; background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
                    .logo { text-align: center; margin-bottom: 30px; }
                    .logo h1 { color: #7c3aed; margin: 0; font-size: 32px; }
                    .btn-box { text-align: center; margin: 30px 0; }
                    .btn { background: linear-gradient(135deg, #7c3aed, #a855f7); color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block; }
                    .message { color: #666; line-height: 1.6; margin: 20px 0; }
                    .warning { color: #ef4444; font-size: 14px; margin-top: 20px; }
                    .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="logo">
                        <h1>🎫 EViENT</h1>
                    </div>
                    <h2 style="text-align: center; color: #333;">Yêu cầu đặt lại mật khẩu</h2>
                    <p class="message">
                        Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản <strong>${email}</strong>. 
                        Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này.
                    </p>
                    <div class="btn-box">
                        <a href="${resetLink}" class="btn">Đặt lại mật khẩu</a>
                    </div>
                    <p class="message" style="font-size: 13px; word-break: break-all;">
                        Hoặc copy link này vào trình duyệt: <br/>
                        <a href="${resetLink}" style="color: #7c3aed;">${resetLink}</a>
                    </p>
                    <p class="message">Link này sẽ hết hạn sau <strong>1 giờ</strong>.</p>
                    <div class="footer">
                        <p>Email này được gửi tự động từ hệ thống EViENT.</p>
                        <p>© 2026 EViENT - Nền tảng quản lý sự kiện</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        await transporter.sendMail({
            from: '"EViENT" <noreply@evient.com>',
            to: email,
            subject: 'EViENT - Đặt lại mật khẩu',
            html: htmlContent
        });

        console.log(`Reset password email sent to ${email}`);
        return { success: true, message: 'Email đặt lại mật khẩu đã được gửi' };
    } catch (error) {
        console.error('Send reset email error:', error);
        return { success: false, message: 'Không thể gửi email. Vui lòng thử lại.' };
    }
};

/**
 * Send ticket confirmation email
 * @param {Object} ticketData - Ticket information
 * @param {string} userEmail - User email
 * @returns {Promise<{success: boolean, message: string}>}
 */
const sendTicketEmail = async (ticketData, userEmail) => {
    try {
        const { ticketCode, qrCode, eventTitle, eventDate, eventLocation, seatInfo, ticketTypeName, price } = ticketData;

        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <style>
                    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
                    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
                    .logo { text-align: center; margin-bottom: 30px; }
                    .logo h1 { color: #7c3aed; margin: 0; font-size: 32px; }
                    .ticket-box { background: linear-gradient(135deg, #7c3aed, #a855f7); padding: 30px; border-radius: 12px; color: white; margin: 20px 0; }
                    .ticket-code { font-size: 24px; font-weight: bold; text-align: center; letter-spacing: 2px; margin: 10px 0; }
                    .qr-code { text-align: center; margin: 20px 0; background: white; padding: 20px; border-radius: 8px; }
                    .qr-code img { max-width: 200px; }
                    .event-info { background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; }
                    .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
                    .info-row:last-child { border-bottom: none; }
                    .label { font-weight: 600; color: #666; }
                    .value { color: #333; }
                    .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="logo">
                        <h1>🎫 EViENT</h1>
                    </div>
                    <h2 style="text-align: center; color: #333;">Vé sự kiện của bạn</h2>
                    <div class="ticket-box">
                        <p style="text-align: center; margin: 0; font-size: 16px;">Mã vé</p>
                        <p class="ticket-code">${ticketCode}</p>
                    </div>
                    ${qrCode ? `
                    <div class="qr-code">
                        <p style="margin: 0 0 10px 0; color: #666;"><strong>Mã QR check-in</strong></p>
                        <img src="${qrCode}" alt="QR Code" />
                    </div>
                    ` : ''}
                    <div class="event-info">
                        <div class="info-row">
                            <span class="label">Sự kiện:</span>
                            <span class="value">${eventTitle}</span>
                        </div>
                        ${eventDate ? `
                        <div class="info-row">
                            <span class="label">Ngày giờ:</span>
                            <span class="value">${new Date(eventDate).toLocaleString('vi-VN')}</span>
                        </div>
                        ` : ''}
                        ${eventLocation ? `
                        <div class="info-row">
                            <span class="label">Địa điểm:</span>
                            <span class="value">${eventLocation}</span>
                        </div>
                        ` : ''}
                        <div class="info-row">
                            <span class="label">Loại vé:</span>
                            <span class="value">${ticketTypeName}</span>
                        </div>
                        ${seatInfo ? `
                        <div class="info-row">
                            <span class="label">Ghế ngồi:</span>
                            <span class="value">Phòng ${seatInfo.room} - Hàng ${seatInfo.row}, Ghế ${seatInfo.number}</span>
                        </div>
                        ` : ''}
                        <div class="info-row">
                            <span class="label">Giá:</span>
                            <span class="value" style="font-weight: bold; color: #7c3aed;">${price.toLocaleString('vi-VN')} VNĐ</span>
                        </div>
                    </div>
                    <p style="color: #666; line-height: 1.6; margin: 20px 0;">
                        Vui lòng mang theo vé này (in ra hoặc hiển thị trên điện thoại) để check-in tại sự kiện.
                    </p>
                    <div class="footer">
                        <p>Email này được gửi tự động từ hệ thống EViENT.</p>
                        <p>© 2026 EViENT - Nền tảng quản lý sự kiện</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        await transporter.sendMail({
            from: '"EViENT" <noreply@evient.com>',
            to: userEmail,
            subject: `EViENT - Vé sự kiện: ${eventTitle}`,
            html: htmlContent
        });

        console.log(`Ticket email sent to ${userEmail} for ticket ${ticketCode}`);
        return { success: true, message: 'Email vé đã được gửi' };
    } catch (error) {
        console.error('Send ticket email error:', error);
        return { success: false, message: 'Không thể gửi email vé' };
    }
};

module.exports = {
    generateOTPCode,
    sendOTP,
    verifyOTP,
    resendOTP,
    sendPasswordResetEmail,
    sendTicketEmail
};

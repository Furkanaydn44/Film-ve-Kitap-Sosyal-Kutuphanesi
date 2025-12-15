const nodemailer = require('nodemailer');

// Test hesabı oluştur (Otomatik)
const createTransporter = async () => {
  // Ethereal'dan geçici hesap al
  const testAccount = await nodemailer.createTestAccount();

  // Transporter'ı bu hesapla oluştur
  const transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: testAccount.user, // oluşturulan test kullanıcısı
      pass: testAccount.pass, // oluşturulan test şifresi
    },
  });

  return { transporter, testAccount };
};

const sendEmail = async (options) => {
  const { transporter, testAccount } = await createTransporter();

  const mailOptions = {
    from: '"CineBook Dev" <test@cinebook.com>',
    to: options.to,
    subject: options.subject,
    html: options.html
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    
    console.log("📨 E-posta (Sanal) gönderildi: %s", info.messageId);
    // Konsola E-postanın önizleme linkini basar (Buna tıklayıp maili görebilirsin)
    console.log("🔗 Önizleme URL: %s", nodemailer.getTestMessageUrl(info));
    
    return true;
  } catch (error) {
    console.error("❌ E-posta hatası:", error);
    return false;
  }
};

module.exports = sendEmail;
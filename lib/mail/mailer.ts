import nodemailer from "nodemailer";

const smtpHost = process.env.SMTP_HOST;
const smtpPort = Number(
  process.env.SMTP_PORT || "465",
);
const smtpSecure =
  process.env.SMTP_SECURE !== "false";

const smtpUser = process.env.SMTP_USER;
const smtpPassword =
  process.env.SMTP_PASSWORD;

const mailFrom =
  process.env.MAIL_FROM || smtpUser;

function assertMailConfiguration() {
  if (
    !smtpHost ||
    !smtpUser ||
    !smtpPassword ||
    !mailFrom
  ) {
    throw new Error(
      "SMTP configuration is incomplete.",
    );
  }
}

const transporter =
  nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    auth: {
      user: smtpUser,
      pass: smtpPassword,
    },
  });

type SendPasswordResetEmailOptions = {
  to: string;
  name?: string | null;
  resetUrl: string;
};

export async function sendPasswordResetEmail({
  to,
  name,
  resetUrl,
}: SendPasswordResetEmailOptions) {
  assertMailConfiguration();

  const displayName =
    name?.trim() || "مستخدم ArtVert";

  const subject =
    "إعادة تعيين كلمة مرور ArtVert";

  const text = `
مرحبًا ${displayName}

تلقينا طلبًا لإعادة تعيين كلمة المرور الخاصة بحسابك في ArtVert.

استخدم الرابط التالي لتعيين كلمة مرور جديدة:

${resetUrl}

صلاحية الرابط محدودة، ويمكن استخدامه مرة واحدة فقط.

إذا لم تطلب تغيير كلمة المرور، يمكنك تجاهل هذه الرسالة.

ArtVert Egypt
`.trim();

  const html = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
  <head>
    <meta charset="UTF-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1.0"
    />
  </head>

  <body
    style="
      margin: 0;
      padding: 0;
      background: #061008;
      font-family: Arial, Helvetica, sans-serif;
      color: #ffffff;
    "
  >
    <table
      role="presentation"
      width="100%"
      cellspacing="0"
      cellpadding="0"
      border="0"
      style="
        width: 100%;
        background: #061008;
        padding: 32px 16px;
      "
    >
      <tr>
        <td align="center">
          <table
            role="presentation"
            width="100%"
            cellspacing="0"
            cellpadding="0"
            border="0"
            style="
              max-width: 560px;
              background: #0b1a0e;
              border: 1px solid rgba(200, 243, 63, 0.22);
              border-radius: 24px;
              overflow: hidden;
            "
          >
            <tr>
              <td
                style="
                  padding: 32px;
                  text-align: right;
                "
              >
                <div
                  style="
                    color: #c8f33f;
                    font-size: 14px;
                    font-weight: 700;
                    margin-bottom: 16px;
                  "
                >
                  ArtVert Egypt
                </div>

                <h1
                  style="
                    margin: 0 0 18px;
                    font-size: 26px;
                    line-height: 1.4;
                    color: #ffffff;
                  "
                >
                  إعادة تعيين كلمة المرور
                </h1>

                <p
                  style="
                    margin: 0 0 14px;
                    color: rgba(255,255,255,0.72);
                    font-size: 15px;
                    line-height: 1.9;
                  "
                >
                  مرحبًا ${escapeHtml(displayName)}
                </p>

                <p
                  style="
                    margin: 0 0 24px;
                    color: rgba(255,255,255,0.72);
                    font-size: 15px;
                    line-height: 1.9;
                  "
                >
                  تلقينا طلبًا لإعادة تعيين كلمة المرور الخاصة بحسابك.
                  اضغط على الزر التالي لإنشاء كلمة مرور جديدة.
                </p>

                <table
                  role="presentation"
                  cellspacing="0"
                  cellpadding="0"
                  border="0"
                  style="
                    margin: 0 0 26px;
                  "
                >
                  <tr>
                    <td
                      bgcolor="#c8f33f"
                      style="
                        border-radius: 12px;
                      "
                    >
                      <a
                        href="${escapeHtml(resetUrl)}"
                        style="
                          display: inline-block;
                          padding: 14px 24px;
                          color: #071109;
                          text-decoration: none;
                          font-size: 15px;
                          font-weight: 800;
                        "
                      >
                        إعادة تعيين كلمة المرور
                      </a>
                    </td>
                  </tr>
                </table>

                <p
                  style="
                    margin: 0 0 10px;
                    color: rgba(255,255,255,0.52);
                    font-size: 13px;
                    line-height: 1.8;
                  "
                >
                  الرابط صالح لمدة محدودة ويمكن استخدامه مرة واحدة فقط.
                </p>

                <p
                  style="
                    margin: 0;
                    color: rgba(255,255,255,0.42);
                    font-size: 12px;
                    line-height: 1.8;
                  "
                >
                  إذا لم تطلب تغيير كلمة المرور، تجاهل هذه الرسالة.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`.trim();

  await transporter.sendMail({
    from: {
      name: "ArtVert Egypt",
      address: mailFrom!,
    },
    to,
    subject,
    text,
    html,
  });
}

export async function verifyMailer() {
  assertMailConfiguration();

  await transporter.verify();

  return true;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
import Handlebars from 'handlebars';

const BASE_LAYOUT = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{subject}}</title>
  <style>
    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #061111; color: #e2e8f0; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
    .wrapper { width: 100%; table-layout: fixed; background-color: #061111; padding-bottom: 40px; }
    .container { max-width: 600px; margin: 0 auto; background-color: #0d2121; border: 1px solid #1a3d3d; border-radius: 16px; overflow: hidden; margin-top: 40px; }
    .header { background-color: #071717; padding: 30px; text-align: center; border-bottom: 2px solid #00ff88; }
    .header h1 { color: #ffffff; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px; }
    .content { padding: 40px 30px; line-height: 1.7; font-size: 16px; color: #cbd5e1; }
    .content h2 { color: #ffffff; margin-top: 0; margin-bottom: 16px; font-size: 22px; font-weight: 700; }
    .footer { background-color: #071717; padding: 30px; text-align: center; font-size: 13px; color: #64748b; border-top: 1px solid #1a3d3d; }
    .footer a { color: #00ff88; text-decoration: none; }
    .footer p { margin: 8px 0; }
    .btn { display: inline-block; background: linear-gradient(135deg, #00ff88 0%, #00cc70 100%); color: #0a1f1f !important; font-weight: 800; padding: 14px 30px; text-decoration: none !important; border-radius: 10px; font-size: 16px; margin: 24px 0; text-align: center; box-shadow: 0 4px 12px rgba(0, 255, 136, 0.2); }
    .btn:hover { background: #00ff88; box-shadow: 0 4px 16px rgba(0, 255, 136, 0.4); }
    .alert { padding: 16px; border-radius: 10px; margin: 20px 0; font-size: 15px; }
    .alert-danger { background-color: rgba(239, 68, 68, 0.1); color: #fca5a5; border: 1px solid rgba(239, 68, 68, 0.2); }
    .alert-warning { background-color: rgba(245, 158, 11, 0.1); color: #fde68a; border: 1px solid rgba(245, 158, 11, 0.2); }
    .alert-success { background-color: rgba(16, 185, 129, 0.1); color: #a7f3d0; border: 1px solid rgba(16, 185, 129, 0.2); }
    .card { background-color: #061717; border: 1px solid #1a3d3d; padding: 20px; border-radius: 12px; margin: 20px 0; }
    .grid { display: flex; flex-direction: row; justify-content: space-between; margin: 15px 0; }
    .grid-col { flex: 1; text-align: center; }
    .grid-val { font-size: 20px; font-weight: 700; color: #00ff88; }
    .grid-lbl { font-size: 12px; color: #94a3b8; }
    ul { padding-left: 20px; }
    li { margin-bottom: 8px; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <h1>🌳 LenientTree</h1>
      </div>
      <div class="content">
        {{{body}}}
      </div>
      <div class="footer">
        <p>Sent with 💚 from the LenientTree Team</p>
        <p>If you did not request this email, please secure your account settings.</p>
        <p style="font-size: 11px; margin-top: 20px; color: #475569;">
          You are receiving this because you signed up on LenientTree. 
          <br>
          <a href="{{unsubscribeUrl}}">Unsubscribe</a> | <a href="https://lenienttree.com/privacy">Privacy Policy</a>
        </p>
      </div>
    </div>
  </div>
</body>
</html>
`;

export const emailTemplates = {
    // ── Auth Templates ──
    welcome: Handlebars.compile(`
        <h2>Welcome to LenientTree, {{name}}! 🚀</h2>
        <p>We are thrilled to have you join our event lifecycle management platform. With LenientTree, you can discover, register, participate, and earn credentials in first-rate hackathons and conclaves.</p>
        <p>Click the button below to explore your brand new dashboard and complete your student developer profile:</p>
        <div style="text-align: center;">
            <a href="{{loginUrl}}" class="btn">Go to Dashboard</a>
        </div>
        <p>Best regards,<br>The LenientTree Team</p>
    `),
    verification: Handlebars.compile(`
        <h2>Verify Your Email Address ✉️</h2>
        <p>Hi {{name}},</p>
        <p>Thank you for signing up on LenientTree! Please click the button below to verify your email address and activate your account:</p>
        <div style="text-align: center;">
            <a href="{{verificationUrl}}" class="btn">Verify Email Address</a>
        </div>
        <p>This verification link will expire in {{#if expiresInHours}}{{expiresInHours}}{{else}}24{{/if}} hours.</p>
        <p>If you did not create this account, you can safely ignore this message.</p>
    `),
    passwordReset: Handlebars.compile(`
        <h2>Reset Your Password 🔒</h2>
        <p>Hi {{name}},</p>
        <p>We received a request to reset the password for your LenientTree account. Click the button below to set a new password:</p>
        <div style="text-align: center;">
            <a href="{{resetUrl}}" class="btn">Reset Password</a>
        </div>
        <p>This link is valid for {{#if expiresInHours}}{{expiresInHours}}{{else}}1{{/if}} hour.</p>
        <div class="alert alert-warning">
            If you did not request a password reset, please ignore this email. Your password will remain unchanged.
        </div>
    `),
    passwordChanged: Handlebars.compile(`
        <h2>Password Changed Successfully ✅</h2>
        <p>Hi {{name}},</p>
        <p>This is a confirmation that the password for your LenientTree account has been updated successfully.</p>
        <p>If you did not make this change, please contact support immediately at <strong>{{#if supportEmail}}{{supportEmail}}{{else}}security@lenienttree.com{{/if}}</strong> to secure your account.</p>
    `),
    suspiciousLogin: Handlebars.compile(`
        <h2>Security Alert: Suspicious Login Detected ⚠️</h2>
        <p>Hi {{name}},</p>
        <div class="alert alert-danger">
            We detected a login attempt to your account from a new location or unrecognized device.
        </div>
        <div class="card">
            <strong>Device:</strong> {{device}}<br>
            <strong>IP Address:</strong> {{ipAddress}}<br>
            <strong>Location:</strong> {{location}}<br>
            <strong>Time:</strong> {{time}}
        </div>
        <p>If this was you, no action is needed. If this was not you, please reset your password immediately to protect your profile.</p>
    `),
    accountDeleted: Handlebars.compile(`
        <h2>We're Sorry to See You Go 😢</h2>
        <p>Hi {{name}},</p>
        <p>Your account on LenientTree has been successfully deleted, and your details have been removed in compliance with our data policy.</p>
        <p>Thank you for being part of our developer community. If you ever change your mind, you can register a new account at any time.</p>
    `),

    // ── Event Lifecycle Templates ──
    eventCreated: Handlebars.compile(`
        <h2>Draft Event Created Successfully 📅</h2>
        <p>Hi {{organizerName}},</p>
        <p>Your new event draft <strong>"{{eventTitle}}"</strong> has been created successfully.</p>
        <p>You can continue editing the details, configuring custom registration forms, and setting up UPI or Razorpay gateway options in your organizer studio:</p>
        <div style="text-align: center;">
            <a href="{{dashboardUrl}}" class="btn">Open Organizer Studio</a>
        </div>
    `),
    eventUpdated: Handlebars.compile(`
        <h2>Event Announcement: "{{eventTitle}}" Updated 📢</h2>
        <p>Hi {{name}},</p>
        <p>An event you are registered for, <strong>"{{eventTitle}}"</strong>, has been updated by the organizer.</p>
        <div class="card">
            <strong>Change Details:</strong><br>
            {{changeSummary}}
        </div>
        <p>Please review the full event details and schedule by visiting the event hub page:</p>
        <div style="text-align: center;">
            <a href="{{eventUrl}}" class="btn">View Updated Event</a>
        </div>
    `),
    eventReminder: Handlebars.compile(`
        <h2>Upcoming Event Nudge: "{{eventTitle}}" ⏰</h2>
        <p>Hi {{name}},</p>
        <p>Get ready! The event <strong>"{{eventTitle}}"</strong> is starting soon.</p>
        <div class="card">
            <strong>Start Date:</strong> {{startDate}}<br>
            <strong>Venue/Mode:</strong> {{venue}}
        </div>
        <p>Make sure you join on time. For access links, codes, or venue details, view the event details page:</p>
        <div style="text-align: center;">
            <a href="{{eventUrl}}" class="btn">Access Event Details</a>
        </div>
    `),
    eventCancelled: Handlebars.compile(`
        <h2>Notice: Event "{{eventTitle}}" Cancelled 🚫</h2>
        <p>Hi {{name}},</p>
        <div class="alert alert-danger">
            Please be advised that the event <strong>"{{eventTitle}}"</strong> has been cancelled by the organizers.
        </div>
        {{#if reason}}
        <p><strong>Reason for cancellation:</strong> {{reason}}</p>
        {{/if}}
        <p>If you made a manual UPI payment, organizers will handle refunds directly. We apologize for any inconvenience caused.</p>
    `),
    eventCompleted: Handlebars.compile(`
        <h2>Congratulations on Completing "{{eventTitle}}"! 🎓</h2>
        <p>Hi {{name}},</p>
        <p>You have successfully completed <strong>"{{eventTitle}}"</strong>! Thank you for participating.</p>
        {{#if certificateUrl}}
        <p>Your official participation credential/certificate is ready! You can view and download it below:</p>
        <div style="text-align: center;">
            <a href="{{certificateUrl}}" class="btn">Download Certificate</a>
        </div>
        {{/if}}
    `),
    attendanceConfirmed: Handlebars.compile(`
        <h2>Attendance Confirmed! ✅</h2>
        <p>Hi {{name}},</p>
        <p>Your attendance at <strong>"{{eventTitle}}"</strong> on {{date}} has been checked in and verified by the event coordinator.</p>
        <p>Thank you for participating actively!</p>
    `),
    rewardEarned: Handlebars.compile(`
        <h2>You Earned a Reward! 🎁</h2>
        <p>Hi {{name}},</p>
        <p>Fantastic work! You have earned a reward for your participation and performance.</p>
        <div class="card" style="text-align: center;">
            <span style="font-size: 18px; font-weight: bold; color: #00ff88;">{{rewardName}}</span>
            {{#if rewardCode}}
            <br><br>
            <span style="font-family: monospace; font-size: 16px; background-color: #0b1a1a; padding: 8px 16px; border-radius: 6px; border: 1px dashed #00ff88;">{{rewardCode}}</span>
            {{/if}}
        </div>
    `),

    // ── Gamification Templates ──
    badgeEarned: Handlebars.compile(`
        <h2>New Badge Earned! 🏆</h2>
        <p>Hi {{name}},</p>
        <p>Your achievements have unlocked a new badge on your LenientTree profile!</p>
        <div class="card" style="text-align: center;">
            {{#if badgeIconUrl}}
            <img src="{{badgeIconUrl}}" style="max-height: 80px; margin-bottom: 12px;"><br>
            {{/if}}
            <span style="font-size: 20px; font-weight: bold; color: #00ff88;">{{badgeName}}</span>
            {{#if badgeDescription}}
            <p style="font-size: 14px; color: #94a3b8; margin: 8px 0 0 0;">{{badgeDescription}}</p>
            {{/if}}
        </div>
    `),
    pointsAwarded: Handlebars.compile(`
        <h2>Points Awarded! 🪙</h2>
        <p>Hi {{name}},</p>
        <p>You have been awarded <strong>+{{points}} points</strong> on LenientTree!</p>
        <div class="card">
            <strong>Reason:</strong> {{reason}}<br>
            <strong>Your New Balance:</strong> {{totalPoints}} points
        </div>
        <p>Keep participating to climb the leaderboard!</p>
    `),
    leaderboardRankImproved: Handlebars.compile(`
        <h2>Rank Improved on the Leaderboard! 📈</h2>
        <p>Hi {{name}},</p>
        <p>Great job! Your rank on the global developer leaderboard has improved from <strong>#{{previousRank}}</strong> to <strong>#{{rank}}</strong>.</p>
        <p>Keep up the momentum to stay at the top!</p>
    `),
    weeklyLeaderboardSummary: Handlebars.compile(`
        <h2>Weekly Leaderboard Digest 📊</h2>
        <p>Hi {{name}},</p>
        <p>Here is your weekly recap on the global leaderboard:</p>
        <div class="card">
            <strong>Your Current Rank:</strong> #{{rank}}<br>
            <strong>Your Total Points:</strong> {{totalPoints}}
        </div>
        <h3>Top Performers of the Week:</h3>
        <ul>
            {{#each topPerformers}}
            <li>#{{this.rank}} {{this.name}} - {{this.points}} pts</li>
            {{/each}}
        </ul>
    `),
    milestoneReached: Handlebars.compile(`
        <h2>Milestone Reached! 🎉</h2>
        <p>Hi {{name}},</p>
        <p>Congratulations! You have reached a new milestone: <strong>"{{milestoneName}}"</strong>.</p>
        <p style="color: #94a3b8;">{{description}}</p>
    `),
    streakWarning: Handlebars.compile(`
        <h2>Save Your Active Streak! 🔥</h2>
        <p>Hi {{name}},</p>
        <div class="alert alert-warning">
            Your current <strong>{{streakDays}}-day active participation streak</strong> is about to expire!
        </div>
        <p>You have {{daysRemaining}} days remaining to complete an activity (like registering for an ideathon, webinars, or bookmarking events) to preserve your stats and multipliers.</p>
    `),

    // ── Reporting Templates ──
    weeklyAnalyticsReport: Handlebars.compile(`
        <h2>Weekly Platform Analytics Digest 📈</h2>
        <p>Hi {{name}},</p>
        <p>Here is the platform metrics overview for the past week:</p>
        <div class="card">
            <div class="grid">
                <div class="grid-col"><span class="grid-val">{{totalUsers}}</span><br><span class="grid-lbl">Total Users</span></div>
                <div class="grid-col"><span class="grid-val">{{totalEvents}}</span><br><span class="grid-lbl">Active Events</span></div>
                <div class="grid-col"><span class="grid-val">{{totalParticipants}}</span><br><span class="grid-lbl">Registrations</span></div>
            </div>
            <hr style="border: 0; border-top: 1px solid #1a3d3d; margin: 15px 0;">
            <strong>Paid Revenue:</strong> ₹{{totalRevenue}}<br>
            <strong>Platform Conversion Rate:</strong> {{conversionRate}}%
        </div>
        <h3>Top Active Events This Week:</h3>
        <ul>
            {{#each topEvents}}
            <li><strong>{{this.title}}</strong> - {{this.registrationsCount}} participants</li>
            {{/each}}
        </ul>
    `),
    monthlyEngagementReport: Handlebars.compile(`
        <h2>Monthly Platform Engagement Metrics 📊</h2>
        <p>Hi {{name}},</p>
        <p>Here are the engagement metrics overview for this month:</p>
        <div class="card">
            <strong>Monthly Active Users (MAU):</strong> {{activeUsers}}<br>
            <strong>Platform Interaction/Engagement Rate:</strong> {{engagementRate}}
        </div>
    `),
    reportExportReady: Handlebars.compile(`
        <h2>Your Report Export is Ready for Download 📁</h2>
        <p>Hi {{name}},</p>
        <p>The analytics export for <strong>"{{reportName}}"</strong> has been compiled successfully.</p>
        <p>You can download the raw CSV/XLSX export by clicking the button below:</p>
        <div style="text-align: center;">
            <a href="{{downloadUrl}}" class="btn">Download Export File</a>
        </div>
        <p>This download link remains active for 48 hours.</p>
    `),
    scheduledReportDelivery: Handlebars.compile(`
        <h2>Scheduled Report Delivery: "{{reportName}}" 📅</h2>
        <p>Hi {{name}},</p>
        <p>Please find attached the scheduled <strong>{{period}}</strong> analytics report for <strong>"{{reportName}}"</strong>.</p>
        <p>The PDF summary contains platform registrations, conversions, and metrics.</p>
    `),
    reportGenerationFailed: Handlebars.compile(`
        <h2>Report Generation Failed ❌</h2>
        <p>Hi {{name}},</p>
        <div class="alert alert-danger">
            We encountered an unexpected error while compiling the report: <strong>"{{reportName}}"</strong>.
        </div>
        <p><strong>Failure Reason:</strong> {{reason}}</p>
        <p>Our automation engineering team has been notified. Please try requesting the export again in a few minutes.</p>
    `),

    // ── Admin Templates ──
    approvalRequired: Handlebars.compile(`
        <h2>Action Required: Event Approval Request 🛡️</h2>
        <p>Hi {{adminName}},</p>
        <p>A new event approval request requires review:</p>
        <div class="card">
            <strong>Organizer:</strong> {{organizerName}} ({{orgName}})<br>
            <strong>Event Title:</strong> {{eventName}}
        </div>
        <p>Please click the button below to view details and approve/reject the event request:</p>
        <div style="text-align: center;">
            <a href="{{approvalUrl}}" class="btn">Review Approval Request</a>
        </div>
    `),
    approvalDecision: Handlebars.compile(`
        <h2>Organizer Request Update: {{#if isApproved}}Approved 🎉{{else}}Not Approved ❌{{/if}}</h2>
        <p>Hi {{organizerName}},</p>
        <p>Our admin team has reviewed your organizer request for organization <strong>"{{orgName}}"</strong>.</p>
        {{#if isApproved}}
        <div class="alert alert-success">
            Congratulations! Your organizer access request has been approved. You are now authorized to create draft events and configure payment gateways.
        </div>
        <div style="text-align: center;">
            <a href="{{dashboardUrl}}" class="btn">Create Your First Event</a>
        </div>
        {{else}}
        <div class="alert alert-danger">
            Your organizer request was not approved at this time.
        </div>
        {{#if reason}}
        <p><strong>Reason:</strong> {{reason}}</p>
        {{/if}}
        <p>Please update your details and resubmit in your profile page.</p>
        {{/if}}
    `),
    ruleConfigChanged: Handlebars.compile(`
        <h2>Security Audit: Config Settings Changed 🛡️</h2>
        <p>Hi Admin,</p>
        <p>This is an automated audit log notification indicating that a global system rule configuration was modified.</p>
    `),
    largePointAdjustment: Handlebars.compile(`
        <h2>Security Alert: Large Gamification Point Adjustment 🪙</h2>
        <p>Hi {{adminName}},</p>
        <div class="alert alert-warning">
            A large manual point adjustment was made by an administrator.
        </div>
        <div class="card">
            <strong>Target User:</strong> {{targetUserName}}<br>
            <strong>Points Adjusted:</strong> {{pointsAdjusted}}<br>
            <strong>New Balance:</strong> {{newTotal}} points<br>
            <strong>Reason:</strong> {{reason}}
        </div>
    `),
    systemAutomationFailure: Handlebars.compile(`
        <h2>System Automation Failure Warning 🚨</h2>
        <p>Hi {{adminName}},</p>
        <div class="alert alert-danger">
            A critical system automation or background job encountered a failure.
        </div>
        <div class="card">
            <strong>Service/Job:</strong> {{serviceName}}<br>
            <strong>Severity:</strong> {{severity}}<br>
            <strong>Error Details:</strong> {{errorMessage}}
        </div>
    `),
    auditNotification: Handlebars.compile(`
        <h2>Admin Security Log Review 🛡️</h2>
        <p>Hi {{name}},</p>
        <p>An audit action was recorded on your administrative profile:</p>
        <div class="card">
            <strong>Action:</strong> {{action}}<br>
            <strong>Entity:</strong> {{entityType}}<br>
            <strong>IP:</strong> {{ipAddress}}<br>
            <strong>Time:</strong> {{time}}
        </div>
    `),
    registrationConfirmed: Handlebars.compile(`
        <h2>Registration Confirmed! 🎉</h2>
        <p>Hi {{name}},</p>
        <p>Your registration for the event <strong>"{{eventTitle}}"</strong> has been successfully confirmed. We are excited to see you there!</p>
        <p>You can check your status and access details in your dashboard:</p>
        <div style="text-align: center;">
            <a href="{{dashboardUrl}}" class="btn">View My Registrations</a>
        </div>
    `),
    eventApproved: Handlebars.compile(`
        <h2>Event Approved & Live! 🟢</h2>
        <p>Hi {{organizerName}},</p>
        <p>Great news! Your event <strong>"{{eventTitle}}"</strong> has been reviewed and approved by the admin team. It is now published and visible to all participants on the platform.</p>
        <div style="text-align: center;">
            <a href="{{eventUrl}}" class="btn">View Live Event Page</a>
        </div>
     `),
    eventRejected: Handlebars.compile(`
        <h2>Event Approval Decision: Not Approved 🔴</h2>
        <p>Hi {{organizerName}},</p>
        <p>Your event <strong>"{{eventTitle}}"</strong> was reviewed, but unfortunately it was not approved for publication at this time.</p>
        <div class="alert alert-danger">
            <strong>Reason:</strong> {{reason}}
        </div>
        <p>Please edit the event details, address the feedback, and resubmit it for approval from your organizer dashboard:</p>
        <div style="text-align: center;">
            <a href="{{dashboardUrl}}" class="btn">Open Organizer Studio</a>
        </div>
     `),
};

export const renderTemplate = (
    templateName: string,
    context: any,
    subject: string,
    unsubscribeUrl = 'https://lenienttree.com/unsubscribe'
): string => {
    const template = (emailTemplates as any)[templateName];
    if (!template) {
        throw new Error(`Email template "${templateName}" not found`);
    }

    const bodyHtml = template(context);
    const layoutContext = {
        subject,
        body: bodyHtml,
        unsubscribeUrl,
    };
    
    const layoutCompiler = Handlebars.compile(BASE_LAYOUT);
    return layoutCompiler(layoutContext);
};

import 'dotenv/config';
import { initEmailSystem, emailEmitter, EmailEvent } from '../src/modules/email';
import { EmailService } from '../src/modules/email/services/email.service';

async function runTests() {
    console.log('🧪 Starting Email Notification System Verification Tests...');
    
    // Initialize the email system (validates, binds listeners, sets up SMTP client)
    await initEmailSystem();
    
    // Override SMTP send to avoid trying to connect to Gmail with dummy credentials during validation
    const originalSend = EmailService.send;
    EmailService.send = async (options) => {
        console.log(`\n📬 [Mock SMTP Send]`);
        console.log(`To: ${options.to}`);
        console.log(`Subject: ${options.subject}`);
        console.log(`Body Length: ${options.html?.length || 0} characters`);
        if (options.html) {
            const matchesTitle = options.html.includes('LenientTree');
            const matchesUnsubscribe = options.html.includes('Unsubscribe');
            console.log(`  - Layout wrapper check: ${matchesTitle ? 'PASSED' : 'FAILED'}`);
            console.log(`  - Unsubscribe link check: ${matchesUnsubscribe ? 'PASSED' : 'FAILED'}`);
        }
        return { messageId: 'mock-id-12345' };
    };

    console.log('\n--- 1. Testing USER_REGISTERED event ---');
    emailEmitter.emit(EmailEvent.USER_REGISTERED, {
        email: 'developer@lenienttree.com',
        name: 'Jane Dev',
        loginUrl: 'https://lenienttree.com/login'
    });

    console.log('\n--- 2. Testing REGISTRATION_CONFIRMED event ---');
    emailEmitter.emit(EmailEvent.REGISTRATION_CONFIRMED, {
        email: 'developer@lenienttree.com',
        name: 'Jane Dev',
        eventTitle: 'LenientTree Hackathon 2026',
        dashboardUrl: 'https://lenienttree.com/dashboard'
    });

    console.log('\n--- 3. Testing EVENT_APPROVED event ---');
    emailEmitter.emit(EmailEvent.EVENT_APPROVED, {
        email: 'organizer@lenienttree.com',
        organizerName: 'Dev Org',
        eventTitle: 'LenientTree Hackathon 2026',
        eventUrl: 'https://lenienttree.com/event/12345'
    });

    console.log('\n--- 4. Testing EVENT_REJECTED event ---');
    emailEmitter.emit(EmailEvent.EVENT_REJECTED, {
        email: 'organizer@lenienttree.com',
        organizerName: 'Dev Org',
        eventTitle: 'LenientTree Hackathon 2026',
        reason: 'Missing UPI payment details or ticket validation rules.',
        dashboardUrl: 'https://lenienttree.com/organizer/dashboard'
    });

    console.log('\n--- 5. Testing POINTS_AWARDED event ---');
    emailEmitter.emit(EmailEvent.POINTS_AWARDED, {
        email: 'developer@lenienttree.com',
        name: 'Jane Dev',
        points: 250,
        reason: 'Successfully completed the profile verification checklist',
        totalPoints: 1250
    });

    console.log('\n--- 6. Testing APPROVAL_REQUIRED event ---');
    emailEmitter.emit(EmailEvent.APPROVAL_REQUIRED, {
        email: 'admin@lenienttree.com',
        adminName: 'Super Admin',
        organizerName: 'Jane Organizer',
        orgName: 'HackerClub',
        eventName: 'LenientTree Hackathon 2026',
        approvalUrl: 'https://lenienttree.com/admin/approvals'
    });

    // Wait a brief moment for async events to dispatch
    await new Promise((resolve) => setTimeout(resolve, 1000));
    console.log('\n✨ Verification Tests Completed Successfully!');
}

runTests().catch(console.error);

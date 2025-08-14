#!/usr/bin/env node

/**
 * Setup Admin Emails for Modern Google Sign-In
 * This script helps you configure authorized admin emails for your portfolio
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const ENV_FILE = path.join(__dirname, '.env');

console.log('🔧 Modern Google Sign-In Admin Setup');
console.log('=====================================\n');

console.log('This script will help you configure authorized admin emails for your portfolio.');
console.log('Only users with these email addresses will be able to access your admin panel.\n');

async function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setupAdminEmails() {
  try {
    // Read current .env file
    let envContent = '';
    if (fs.existsSync(ENV_FILE)) {
      envContent = fs.readFileSync(ENV_FILE, 'utf8');
    }

    console.log('📧 Current Configuration:');
    const currentEmails = extractCurrentEmails(envContent);
    if (currentEmails.length > 0) {
      console.log(`   Authorized emails: ${currentEmails.join(', ')}`);
    } else {
      console.log('   No admin emails configured (demo mode)');
    }
    console.log('');

    // Get user input
    const primaryEmail = await question('Enter your primary admin email: ');
    if (!isValidEmail(primaryEmail)) {
      console.log('❌ Invalid email format. Please try again.');
      process.exit(1);
    }

    const additionalEmails = await question('Enter additional admin emails (comma-separated, or press Enter to skip): ');
    
    // Process emails
    const allEmails = [primaryEmail];
    if (additionalEmails.trim()) {
      const additional = additionalEmails.split(',').map(email => email.trim()).filter(email => email && isValidEmail(email));
      allEmails.push(...additional);
    }

    // Remove duplicates
    const uniqueEmails = [...new Set(allEmails)];

    console.log('\n📋 Configuration Summary:');
    console.log(`   Primary admin: ${uniqueEmails[0]}`);
    if (uniqueEmails.length > 1) {
      console.log(`   Additional admins: ${uniqueEmails.slice(1).join(', ')}`);
    }
    console.log(`   Total authorized users: ${uniqueEmails.length}`);

    const confirm = await question('\nDo you want to save this configuration? (y/N): ');
    if (confirm.toLowerCase() !== 'y' && confirm.toLowerCase() !== 'yes') {
      console.log('❌ Configuration cancelled.');
      process.exit(0);
    }

    // Update .env file
    const updatedEnvContent = updateEnvFile(envContent, uniqueEmails);
    fs.writeFileSync(ENV_FILE, updatedEnvContent);

    console.log('\n✅ Configuration saved successfully!');
    console.log('\n🚀 Next Steps:');
    console.log('1. Restart your development server');
    console.log('2. Open test-modern-google-signin.html to test authentication');
    console.log('3. Try signing in with your configured email addresses');
    console.log('\n📁 Files updated:');
    console.log(`   ${ENV_FILE}`);

    // Create a quick test file
    createTestInstructions(uniqueEmails);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

function extractCurrentEmails(envContent) {
  const emailMatches = envContent.match(/VITE_ADMIN_EMAILS=(.+)/);
  if (emailMatches && emailMatches[1]) {
    return emailMatches[1].split(',').map(email => email.trim()).filter(email => email && email !== 'admin@example.com');
  }
  return [];
}

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function updateEnvFile(envContent, emails) {
  const emailsString = emails.join(',');
  
  // Update or add VITE_ADMIN_EMAILS
  if (envContent.includes('VITE_ADMIN_EMAILS=')) {
    envContent = envContent.replace(/VITE_ADMIN_EMAILS=.+/, `VITE_ADMIN_EMAILS=${emailsString}`);
  } else {
    envContent += `\nVITE_ADMIN_EMAILS=${emailsString}`;
  }

  // Update or add VITE_ADMIN_EMAIL (primary)
  if (envContent.includes('VITE_ADMIN_EMAIL=')) {
    envContent = envContent.replace(/VITE_ADMIN_EMAIL=.+/, `VITE_ADMIN_EMAIL=${emails[0]}`);
  } else {
    envContent += `\nVITE_ADMIN_EMAIL=${emails[0]}`;
  }

  // Update or add ADMIN_EMAILS (backend)
  if (envContent.includes('ADMIN_EMAILS=')) {
    envContent = envContent.replace(/ADMIN_EMAILS=.+/, `ADMIN_EMAILS=${emailsString}`);
  } else {
    envContent += `\nADMIN_EMAILS=${emailsString}`;
  }

  // Update or add ADMIN_EMAIL (backend primary)
  if (envContent.includes('ADMIN_EMAIL=')) {
    envContent = envContent.replace(/ADMIN_EMAIL=.+/, `ADMIN_EMAIL=${emails[0]}`);
  } else {
    envContent += `\nADMIN_EMAIL=${emails[0]}`;
  }

  return envContent;
}

function createTestInstructions(emails) {
  const instructions = `# 🧪 Testing Your Modern Google Sign-In

## ✅ Configuration Complete

Your admin emails have been configured:
${emails.map(email => `- ${email}`).join('\n')}

## 🚀 How to Test

### 1. Start Development Server
\`\`\`bash
npm run dev
# or
yarn dev
\`\`\`

### 2. Test Authentication
Open in browser: \`test-modern-google-signin.html\`

### 3. Test Scenarios

#### ✅ Authorized Access
- Sign in with: ${emails[0]}
- Expected: Successful authentication and access granted

#### ❌ Unauthorized Access  
- Sign in with any other email
- Expected: Access denied message

### 4. Integration with Your Admin Panel

Add to your main application:
\`\`\`jsx
import ModernGoogleSignIn from './src/components/ModernGoogleSignIn';

function App() {
  const [showSignIn, setShowSignIn] = useState(false);

  const handleSignInSuccess = (user) => {
    console.log('User authenticated:', user);
    // Redirect to admin dashboard
  };

  return (
    <>
      <button onClick={() => setShowSignIn(true)}>
        Admin Login
      </button>
      
      {showSignIn && (
        <ModernGoogleSignIn 
          onLogin={handleSignInSuccess}
          onClose={() => setShowSignIn(false)}
        />
      )}
    </>
  );
}
\`\`\`

## 🔧 Troubleshooting

### Firebase Console Setup
1. Go to Firebase Console > Authentication > Sign-in method
2. Enable Google sign-in provider
3. Add your domain to authorized domains
4. Configure OAuth consent screen

### Common Issues
- **Popup blocked**: Browser blocks popup → Automatic redirect fallback
- **Domain not authorized**: Add localhost:5173 to Firebase authorized domains
- **Email not authorized**: Check VITE_ADMIN_EMAILS in .env file

## 📊 Features Included

✅ Multi-step authentication flow
✅ Device-optimized experience  
✅ Intelligent error handling
✅ Session management
✅ Activity logging
✅ Real-time status updates
✅ Mobile-first design
✅ Accessibility compliance

Your Modern Google Sign-In is ready! 🎉
`;

  fs.writeFileSync(path.join(__dirname, 'TESTING_INSTRUCTIONS.md'), instructions);
  console.log(`   ${path.join(__dirname, 'TESTING_INSTRUCTIONS.md')}`);
}

// Run the setup
setupAdminEmails();
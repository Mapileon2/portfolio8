const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');

async function updateUserPassword() {
  try {
    const email = 'admin@example.com';
    const newPassword = 'password123';
    
    // Load users.json
    const usersPath = path.join(__dirname, 'users.json');
    if (!fs.existsSync(usersPath)) {
      console.error('users.json not found');
      return;
    }
    
    const usersData = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
    
    // Find the user
    const userIndex = usersData.users.findIndex(u => u.email === email);
    if (userIndex === -1) {
      console.error(`User ${email} not found in users.json`);
      return;
    }
    
    // Hash the new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    
    console.log('Current password hash:', usersData.users[userIndex].password);
    console.log('New password hash:', hashedPassword);
    
    // Update the password
    usersData.users[userIndex].password = hashedPassword;
    
    // Save the updated users.json
    fs.writeFileSync(usersPath, JSON.stringify(usersData, null, 2));
    
    console.log(`Password updated successfully for ${email}`);
    console.log(`New login: ${email} / ${newPassword}`);
  } catch (error) {
    console.error('Error updating password:', error);
  }
}

updateUserPassword(); 
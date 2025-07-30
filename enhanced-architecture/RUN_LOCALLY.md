# 🚀 Run Enhanced Portfolio Locally

## Quick Start (3 Steps)

### **Option 1: Automatic Setup (Recommended)**

#### **Windows:**
```cmd
# Double-click or run in Command Prompt
start-dev.bat
```

#### **Mac/Linux:**
```bash
# Make executable and run
chmod +x start-dev.sh
./start-dev.sh
```

### **Option 2: Manual Setup**

#### **Step 1: Install Dependencies**
```bash
npm install
```

#### **Step 2: Setup Environment**
```bash
npm run setup
```

#### **Step 3: Start Development**
```bash
npm run dev
```

## 🌐 Access Your Application

Once running, open these URLs:

- **🎨 Admin Panel**: http://localhost:5173/admin
- **🔧 API Server**: http://localhost:3000
- **📊 Health Check**: http://localhost:3000/api/health

## 🔑 Development Login

**No credentials required!** Use these for testing:

- **Email**: `admin@example.com`
- **Password**: `any password`

## ✨ What You'll See

### **Admin Dashboard**
- 📊 Real-time analytics with charts
- 📝 Case studies management
- 🖼️ Media library with upload
- 🔍 SEO optimization tools
- ⚙️ Settings management

### **Features Available**
- ✅ **Secure Authentication** (mock in dev mode)
- ✅ **Content Management** (case studies, media)
- ✅ **Analytics Dashboard** (with interactive charts)
- ✅ **SEO Tools** (meta tags, social media)
- ✅ **Media Management** (image upload/management)
- ✅ **Responsive Design** (works on mobile)

## 🛠️ Development Mode Features

### **Mock Services**
- **Firebase**: Simulated authentication and database
- **Cloudinary**: Mock image upload and management
- **Analytics**: Sample data and charts
- **Search**: Local search functionality

### **Hot Reload**
- Frontend changes update instantly
- Backend restarts automatically
- No need to refresh browser

### **Sample Data**
- Pre-loaded with demo content
- Case studies examples
- Sample analytics data
- Mock user accounts

## 🔧 Troubleshooting

### **Port Issues**
If ports are in use:
```bash
# Kill processes on ports
npx kill-port 3000 5173
```

### **Dependencies Issues**
```bash
# Clear and reinstall
rm -rf node_modules package-lock.json
npm install
```

### **Server Not Starting**
1. Check Node.js version (requires 16+)
2. Ensure ports 3000 and 5173 are free
3. Check for error messages in terminal

## 📱 Mobile Testing

The admin panel is fully responsive. Test on mobile by:

1. Find your local IP address
2. Access `http://YOUR_IP:5173/admin` on mobile
3. Use same login credentials

## 🎯 Next Steps

### **Add Real Credentials (Optional)**
1. Create Firebase project
2. Get Cloudinary account
3. Update `.env` and `.env.local` files
4. Follow `SECURITY_SETUP_GUIDE.md`

### **Customize Content**
1. Edit sample data in `data/` folder
2. Modify components in `src/components/`
3. Add new API routes in `api/` folder

### **Deploy to Production**
1. Build: `npm run build`
2. Deploy to your hosting platform
3. Set environment variables
4. Enable HTTPS

## 🆘 Need Help?

### **Common Issues**
- **White screen**: Check browser console for errors
- **API errors**: Ensure backend server is running
- **Login issues**: Use `admin@example.com` with any password

### **Development Tips**
- Use browser DevTools for debugging
- Check terminal for server logs
- Modify code and see instant updates
- Test on different screen sizes

---

## 🎉 You're All Set!

Your enhanced portfolio admin panel is now running locally with:

- ✅ **Professional admin interface**
- ✅ **Real-time analytics dashboard**
- ✅ **Content management system**
- ✅ **SEO optimization tools**
- ✅ **Media management**
- ✅ **Mobile-responsive design**

**Happy coding!** 🚀
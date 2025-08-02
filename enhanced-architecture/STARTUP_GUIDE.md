# 🚀 Portfolio Startup Guide

## 📍 **IMPORTANT: Run from the correct directory**

Make sure you're in the `enhanced-architecture` directory before running any commands:

```bash
# Navigate to the enhanced-architecture directory
cd enhanced-architecture

# Then run the startup command
npm run dev:simple
```

## 🎯 **Available Startup Options**

### **Option 1: Simple Development Mode (Recommended)**
```bash
cd enhanced-architecture
npm run dev:simple
```
- **Port**: http://localhost:3001
- **Admin Panel**: http://localhost:3001/src/simple-admin.html
- **Frontend**: http://localhost:3001/frontend/case-study.html
- **Features**: All admin features with mock data

### **Option 2: Full Development Mode**
```bash
cd enhanced-architecture
npm run dev
```
- **Port**: http://localhost:3000 (backend) + http://localhost:5173 (frontend)
- **Features**: Full development environment with hot reload

### **Option 3: Production Mode**
```bash
cd enhanced-architecture
npm start
```
- **Port**: http://localhost:3000
- **Features**: Production-ready server

## 🔧 **Troubleshooting**

### **Error: Missing script "dev:simple"**
**Solution**: Make sure you're in the `enhanced-architecture` directory:
```bash
# Check current directory
pwd

# Should show: .../enhanced-architecture
# If not, navigate to it:
cd enhanced-architecture

# Then run:
npm run dev:simple
```

### **Error: Cannot find module**
**Solution**: Install dependencies:
```bash
cd enhanced-architecture
npm install
npm run dev:simple
```

### **Port already in use**
**Solution**: Kill existing processes:
```bash
# Kill process on port 3001
npx kill-port 3001

# Then start again
npm run dev:simple
```

## 📱 **Access Your Portfolio**

Once started successfully, you can access:

### **🎛️ Admin Panel**
- **URL**: http://localhost:3001/src/simple-admin.html
- **Login**: admin@example.com (any password)
- **Features**: 
  - ✅ Case study management
  - ✅ Image upload
  - ✅ Analytics dashboard
  - ✅ Live preview
  - ✅ Settings management

### **🎨 Main Frontend**
- **URL**: http://localhost:3001/frontend/case-study.html
- **Features**:
  - ✅ Beautiful Ghibli-inspired design
  - ✅ Admin integration (now connected!)
  - ✅ Real-time updates
  - ✅ Analytics tracking
  - ✅ Contact form

### **⚡ Enhanced Frontend**
- **URL**: http://localhost:3001/frontend/enhanced-case-study.html
- **Features**:
  - ✅ All main frontend features
  - ✅ Additional enhancements
  - ✅ Advanced integrations

## 🎉 **Quick Start Commands**

```bash
# 1. Navigate to project directory
cd enhanced-architecture

# 2. Install dependencies (if not done)
npm install

# 3. Start the portfolio
npm run dev:simple

# 4. Open browser to:
# http://localhost:3001/src/simple-admin.html
```

## 📊 **What You'll See**

### **✅ When Successfully Started**
```
🚀 Starting Enhanced Portfolio (Simple Mode)...
🚀 Starting Simple Development Server...
✅ Simple server running on http://localhost:3001
🎯 API available at http://localhost:3001/api/health
📊 Mock data loaded successfully

🎯 Open your browser and go to:
   http://localhost:3001/simple-admin.html

🔑 Login with:
   Email: admin@example.com
   Password: any password

Press Ctrl+C to stop
```

### **❌ Common Error Messages**

**"Missing script: dev:simple"**
- **Cause**: Wrong directory
- **Fix**: `cd enhanced-architecture`

**"EADDRINUSE: address already in use"**
- **Cause**: Port 3001 is busy
- **Fix**: `npx kill-port 3001`

**"Cannot find module"**
- **Cause**: Dependencies not installed
- **Fix**: `npm install`

## 🔍 **Verification Steps**

1. **Check Directory**: `pwd` should show `enhanced-architecture`
2. **Check Files**: `ls` should show `package.json`, `simple-server.js`, etc.
3. **Check Scripts**: `npm run` should list available scripts including `dev:simple`
4. **Test Health**: Visit http://localhost:3001/api/health after starting

## 🎯 **Success Indicators**

- ✅ Server starts without errors
- ✅ Admin panel loads at http://localhost:3001/src/simple-admin.html
- ✅ Frontend loads at http://localhost:3001/frontend/case-study.html
- ✅ API health check returns `{"status":"ok"}`
- ✅ Admin login works with any credentials
- ✅ Case studies can be created/edited
- ✅ Real-time updates work between admin and frontend

## 🚀 **You're Ready!**

Your portfolio is now fully functional with:
- ✅ Professional admin panel
- ✅ Beautiful frontend with admin integration
- ✅ Real-time synchronization
- ✅ Analytics tracking
- ✅ Performance monitoring
- ✅ Mobile-responsive design

**Enjoy your world-class portfolio system! 🌟**
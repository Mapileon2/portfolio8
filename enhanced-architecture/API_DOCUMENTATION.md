# 📡 API Documentation - Enhanced Portfolio Architecture

## 🎯 **Overview**

The Enhanced Portfolio API provides comprehensive endpoints for managing portfolio content, analytics, search functionality, and media assets. All endpoints are secured with authentication and include proper error handling.

## 🔐 **Authentication**

### **Authentication Methods**
- **Development Mode**: No authentication required (mock authentication)
- **Production Mode**: Firebase JWT tokens required

### **Authentication Headers**
```http
Authorization: Bearer <firebase-jwt-token>
Content-Type: application/json
```

### **Getting Authentication Token**
```javascript
// Client-side Firebase authentication
const user = await signInWithEmailAndPassword(auth, email, password);
const token = await user.getIdToken();
```

## 🏥 **Health & Status**

### **Health Check**
```http
GET /api/health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "services": {
    "database": "connected",
    "storage": "connected",
    "email": "connected"
  },
  "version": "1.0.0"
}
```

## 🔥 **Firebase Endpoints**

### **Admin Verification**
```http
POST /api/firebase/verify-admin
```

**Request Body:**
```json
{
  "email": "admin@example.com",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "uid": "admin-uid",
    "email": "admin@example.com",
    "role": "admin"
  },
  "token": "firebase-jwt-token"
}
```

### **Create Admin (Development Only)**
```http
GET /api/firebase/create-admin
```

**Response:**
```json
{
  "success": true,
  "message": "Admin user created successfully",
  "credentials": {
    "email": "admin@example.com",
    "password": "generated-password"
  }
}
```

## 📚 **Case Studies Management**

### **Get All Case Studies**
```http
GET /api/firebase/case-studies
```

**Query Parameters:**
- `limit` (optional): Number of results to return (default: 50)
- `offset` (optional): Number of results to skip (default: 0)
- `category` (optional): Filter by category
- `status` (optional): Filter by status (draft, published, archived)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "case-study-1",
      "projectTitle": "E-commerce Platform",
      "description": "Modern e-commerce solution with React and Node.js",
      "technologies": ["React", "Node.js", "MongoDB"],
      "category": "Web Development",
      "status": "published",
      "featured": true,
      "images": [
        {
          "url": "https://res.cloudinary.com/demo/image/upload/sample.jpg",
          "alt": "Project screenshot",
          "caption": "Main dashboard view"
        }
      ],
      "liveUrl": "https://example.com",
      "githubUrl": "https://github.com/user/project",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "total": 25,
    "page": 1,
    "limit": 10,
    "totalPages": 3
  }
}
```

### **Create Case Study**
```http
POST /api/firebase/case-studies
```

**Request Body:**
```json
{
  "projectTitle": "New Project",
  "description": "Project description",
  "technologies": ["React", "Node.js"],
  "category": "Web Development",
  "status": "draft",
  "featured": false,
  "images": [
    {
      "url": "https://example.com/image.jpg",
      "alt": "Project image",
      "caption": "Screenshot"
    }
  ],
  "liveUrl": "https://example.com",
  "githubUrl": "https://github.com/user/project",
  "seo": {
    "title": "SEO Title",
    "description": "SEO Description",
    "keywords": ["react", "portfolio"]
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "generated-id",
    "projectTitle": "New Project",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

### **Update Case Study**
```http
PUT /api/firebase/case-studies/:id
```

**Request Body:** Same as create, but all fields are optional

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "case-study-id",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

### **Delete Case Study**
```http
DELETE /api/firebase/case-studies/:id
```

**Response:**
```json
{
  "success": true,
  "message": "Case study deleted successfully"
}
```

## 🖼️ **Carousel Images Management**

### **Get Carousel Images**
```http
GET /api/firebase/carousel-images
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "image-1",
      "url": "https://res.cloudinary.com/demo/image/upload/carousel1.jpg",
      "alt": "Portfolio showcase",
      "caption": "Featured project showcase",
      "order": 1,
      "active": true,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### **Add Carousel Image**
```http
POST /api/firebase/carousel-images
```

**Request Body:**
```json
{
  "url": "https://example.com/image.jpg",
  "alt": "Image description",
  "caption": "Image caption",
  "order": 1,
  "active": true
}
```

### **Delete Carousel Image**
```http
DELETE /api/firebase/carousel-images/:id
```

## 📄 **Sections Management**

### **Get All Sections**
```http
GET /api/firebase/sections
```

**Response:**
```json
{
  "success": true,
  "data": {
    "hero": {
      "title": "Welcome to My Portfolio",
      "subtitle": "Full Stack Developer",
      "description": "Creating amazing web experiences",
      "backgroundImage": "https://example.com/hero-bg.jpg",
      "ctaText": "View My Work",
      "ctaLink": "#projects"
    },
    "about": {
      "title": "About Me",
      "content": "I'm a passionate developer...",
      "skills": ["JavaScript", "React", "Node.js"],
      "image": "https://example.com/profile.jpg"
    },
    "contact": {
      "title": "Get In Touch",
      "email": "contact@example.com",
      "phone": "+1234567890",
      "social": {
        "github": "https://github.com/username",
        "linkedin": "https://linkedin.com/in/username",
        "twitter": "https://twitter.com/username"
      }
    }
  }
}
```

### **Update Sections**
```http
PUT /api/firebase/sections
```

**Request Body:** Partial or complete sections object

## 📊 **Analytics Endpoints**

### **Get Analytics Summary**
```http
GET /api/analytics/summary
```

**Query Parameters:**
- `days` (optional): Number of days to include (default: 30)
- `granularity` (optional): Data granularity (hour, day, week, month)

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalViews": 15420,
      "uniqueVisitors": 8750,
      "avgSessionDuration": 245,
      "bounceRate": 0.35,
      "topPages": [
        {
          "path": "/",
          "views": 5420,
          "uniqueViews": 3200
        }
      ]
    },
    "trends": {
      "viewsChange": 12.5,
      "visitorsChange": 8.3,
      "durationChange": -2.1
    },
    "timeRange": {
      "start": "2024-01-01T00:00:00Z",
      "end": "2024-01-30T23:59:59Z"
    }
  }
}
```

### **Get Real-time Analytics**
```http
GET /api/analytics/realtime
```

**Response:**
```json
{
  "success": true,
  "data": {
    "activeVisitors": 23,
    "currentPageViews": {
      "/": 12,
      "/projects": 8,
      "/about": 3
    },
    "recentEvents": [
      {
        "type": "pageview",
        "path": "/projects",
        "timestamp": "2024-01-15T10:30:00Z",
        "userAgent": "Mozilla/5.0...",
        "country": "US"
      }
    ],
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

### **Track Page View**
```http
POST /api/analytics/pageview
```

**Request Body:**
```json
{
  "path": "/projects",
  "title": "Projects - Portfolio",
  "referrer": "https://google.com",
  "userAgent": "Mozilla/5.0...",
  "sessionId": "session-uuid",
  "userId": "user-uuid"
}
```

### **Track Custom Event**
```http
POST /api/analytics/track
```

**Request Body:**
```json
{
  "event": "project_view",
  "properties": {
    "projectId": "project-123",
    "category": "engagement",
    "value": 1
  },
  "sessionId": "session-uuid",
  "userId": "user-uuid"
}
```

## 🔍 **Search Endpoints**

### **Search Content**
```http
GET /api/search
```

**Query Parameters:**
- `q` (required): Search query
- `limit` (optional): Number of results (default: 10)
- `offset` (optional): Results offset (default: 0)
- `type` (optional): Content type filter (projects, posts, all)
- `category` (optional): Category filter

**Response:**
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "id": "project-1",
        "type": "project",
        "title": "E-commerce Platform",
        "description": "Modern e-commerce solution...",
        "url": "/projects/ecommerce-platform",
        "score": 0.95,
        "highlights": {
          "title": ["<mark>E-commerce</mark> Platform"],
          "description": ["Modern <mark>e-commerce</mark> solution..."]
        }
      }
    ],
    "pagination": {
      "total": 15,
      "page": 1,
      "limit": 10,
      "totalPages": 2
    },
    "facets": {
      "types": {
        "projects": 12,
        "posts": 3
      },
      "categories": {
        "Web Development": 8,
        "Mobile Apps": 4,
        "Design": 3
      }
    }
  }
}
```

### **Get Search Suggestions**
```http
GET /api/search/suggestions
```

**Query Parameters:**
- `q` (required): Partial search query
- `limit` (optional): Number of suggestions (default: 5)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "text": "react portfolio",
      "count": 45
    },
    {
      "text": "react native app",
      "count": 23
    }
  ]
}
```

### **Index Content**
```http
POST /api/search/index
```

**Request Body:**
```json
{
  "id": "content-id",
  "type": "project",
  "title": "Project Title",
  "description": "Project description",
  "content": "Full content text",
  "tags": ["react", "javascript"],
  "category": "Web Development",
  "url": "/projects/project-slug"
}
```

### **Remove from Index**
```http
DELETE /api/search/index/:id
```

## 🖼️ **Image Management**

### **Upload Image**
```http
POST /api/images/upload
```

**Request:** Multipart form data with image file

**Response:**
```json
{
  "success": true,
  "data": {
    "publicId": "portfolio/image-123",
    "url": "https://res.cloudinary.com/demo/image/upload/v1234567890/portfolio/image-123.jpg",
    "secureUrl": "https://res.cloudinary.com/demo/image/upload/v1234567890/portfolio/image-123.jpg",
    "width": 1920,
    "height": 1080,
    "format": "jpg",
    "bytes": 245760
  }
}
```

### **Get Upload Signature**
```http
GET /api/images/upload-signature
```

**Query Parameters:**
- `folder` (optional): Upload folder
- `transformation` (optional): Image transformation preset

**Response:**
```json
{
  "success": true,
  "data": {
    "signature": "generated-signature",
    "timestamp": 1234567890,
    "apiKey": "your-api-key",
    "cloudName": "your-cloud-name"
  }
}
```

### **Delete Image**
```http
DELETE /api/images/:publicId
```

**Response:**
```json
{
  "success": true,
  "message": "Image deleted successfully"
}
```

### **Get Image Details**
```http
GET /api/images/details/:publicId
```

**Response:**
```json
{
  "success": true,
  "data": {
    "publicId": "portfolio/image-123",
    "url": "https://res.cloudinary.com/demo/image/upload/portfolio/image-123.jpg",
    "width": 1920,
    "height": 1080,
    "format": "jpg",
    "bytes": 245760,
    "createdAt": "2024-01-15T10:30:00Z",
    "tags": ["portfolio", "project"],
    "context": {
      "alt": "Project screenshot",
      "caption": "Main dashboard view"
    }
  }
}
```

## 📧 **Contact Endpoints**

### **Submit Contact Form**
```http
POST /api/contact/submit
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "subject": "Project Inquiry",
  "message": "I'd like to discuss a project...",
  "phone": "+1234567890",
  "company": "Example Corp"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Message sent successfully",
  "id": "contact-123"
}
```

### **Get Contact Submissions**
```http
GET /api/contact/submissions
```

**Query Parameters:**
- `limit` (optional): Number of results
- `offset` (optional): Results offset
- `status` (optional): Filter by status (new, read, replied)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "contact-123",
      "name": "John Doe",
      "email": "john@example.com",
      "subject": "Project Inquiry",
      "message": "I'd like to discuss a project...",
      "status": "new",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

## ❌ **Error Responses**

### **Standard Error Format**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "field": "email",
      "issue": "Invalid email format"
    }
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### **Common Error Codes**
- `VALIDATION_ERROR`: Invalid input data
- `AUTHENTICATION_REQUIRED`: Missing or invalid authentication
- `AUTHORIZATION_FAILED`: Insufficient permissions
- `RESOURCE_NOT_FOUND`: Requested resource doesn't exist
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `INTERNAL_SERVER_ERROR`: Server-side error
- `SERVICE_UNAVAILABLE`: External service unavailable

### **HTTP Status Codes**
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `429`: Too Many Requests
- `500`: Internal Server Error
- `503`: Service Unavailable

## 🔧 **Rate Limiting**

### **Rate Limits**
- **General API**: 100 requests per minute per IP
- **Upload endpoints**: 10 requests per minute per IP
- **Analytics tracking**: 1000 requests per minute per IP
- **Search**: 50 requests per minute per IP

### **Rate Limit Headers**
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1234567890
```

## 📝 **Request/Response Examples**

### **cURL Examples**

```bash
# Get health status
curl -X GET http://localhost:3001/api/health

# Create case study
curl -X POST http://localhost:3001/api/firebase/case-studies \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-jwt-token" \
  -d '{
    "projectTitle": "New Project",
    "description": "Project description",
    "technologies": ["React", "Node.js"]
  }'

# Upload image
curl -X POST http://localhost:3001/api/images/upload \
  -H "Authorization: Bearer your-jwt-token" \
  -F "image=@/path/to/image.jpg"

# Search content
curl -X GET "http://localhost:3001/api/search?q=react&limit=5"

# Track page view
curl -X POST http://localhost:3001/api/analytics/pageview \
  -H "Content-Type: application/json" \
  -d '{
    "path": "/projects",
    "title": "Projects Page"
  }'
```

### **JavaScript Examples**

```javascript
// Fetch case studies
const response = await fetch('/api/firebase/case-studies');
const data = await response.json();

// Create case study with authentication
const response = await fetch('/api/firebase/case-studies', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    projectTitle: 'New Project',
    description: 'Project description'
  })
});

// Upload image
const formData = new FormData();
formData.append('image', file);

const response = await fetch('/api/images/upload', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});
```

## 🔍 **Testing the API**

### **Using Postman**
1. Import the API collection (if available)
2. Set up environment variables for base URL and auth token
3. Test each endpoint with sample data

### **Using Thunder Client (VS Code)**
1. Install Thunder Client extension
2. Create requests for each endpoint
3. Set up authentication headers

### **Using curl**
See the cURL examples above for testing individual endpoints.

---

This API documentation provides comprehensive coverage of all available endpoints in the Enhanced Portfolio Architecture. Each endpoint includes detailed request/response examples, error handling, and authentication requirements.
// Enhanced TypeScript Types for Production Portfolio

// Core Entity Types
export interface User {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  permissions: Permission[];
  profile: UserProfile;
  preferences: UserPreferences;
  metadata: UserMetadata;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile {
  avatar?: string;
  bio?: string;
  location?: string;
  website?: string;
  socialLinks: SocialLinks;
  skills: string[];
  languages: Language[];
}

export interface UserMetadata {
  lastLoginAt?: Date;
  loginCount: number;
  ipAddress?: string;
  userAgent?: string;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
}

// Project & Portfolio Types
export interface Project {
  id: string;
  slug: string;
  title: string;
  description: string;
  summary: string;
  content: RichTextContent;
  status: ContentStatus;
  visibility: Visibility;
  featured: boolean;
  
  // Media & Assets
  heroImage: MediaAsset;
  gallery: MediaAsset[];
  attachments: Attachment[];
  
  // Categorization
  category: ProjectCategory;
  tags: string[];
  technologies: Technology[];
  
  // External Links
  liveUrl?: string;
  githubUrl?: string;
  figmaUrl?: string;
  
  // Metrics & Analytics
  metrics: ProjectMetrics;
  analytics: ProjectAnalytics;
  
  // SEO & Marketing
  seo: SEOMetadata;
  socialSharing: SocialSharingData;
  
  // Collaboration
  collaborators: Collaborator[];
  feedback: FeedbackItem[];
  
  // Timestamps & Audit
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  createdBy: string;
  updatedBy: string;
}

export interface CaseStudy extends Project {
  sections: CaseStudySection[];
  readTime: number;
  difficulty: DifficultyLevel;
  outcome: ProjectOutcome;
  testimonial?: Testimonial;
  nextSteps?: string[];
}

export interface CaseStudySection {
  id: string;
  type: SectionType;
  title: string;
  content: RichTextContent;
  media?: MediaAsset[];
  order: number;
  metadata?: Record<string, any>;
}

// Content Management Types
export interface RichTextContent {
  blocks: ContentBlock[];
  version: string;
  time: number;
  wordCount: number;
}

export interface ContentBlock {
  id: string;
  type: BlockType;
  data: Record<string, any>;
  tunes?: Record<string, any>;
}

export interface MediaAsset {
  id: string;
  type: MediaType;
  url: string;
  thumbnailUrl?: string;
  alt: string;
  caption?: string;
  metadata: MediaMetadata;
  optimizations: ImageOptimization[];
  createdAt: Date;
}

export interface MediaMetadata {
  filename: string;
  size: number;
  mimeType: string;
  dimensions?: {
    width: number;
    height: number;
  };
  duration?: number; // for videos
  exif?: Record<string, any>;
}

// Analytics & Metrics Types
export interface ProjectMetrics {
  views: number;
  uniqueViews: number;
  likes: number;
  shares: number;
  comments: number;
  downloads: number;
  conversionRate: number;
  averageTimeSpent: number;
  bounceRate: number;
}

export interface ProjectAnalytics {
  dailyViews: TimeSeriesData[];
  referralSources: ReferralSource[];
  userDemographics: Demographics;
  deviceStats: DeviceStats;
  geographicData: GeographicData[];
  searchKeywords: KeywordData[];
}

export interface TimeSeriesData {
  date: Date;
  value: number;
  metadata?: Record<string, any>;
}

// SEO & Marketing Types
export interface SEOMetadata {
  title: string;
  description: string;
  keywords: string[];
  canonicalUrl?: string;
  ogImage?: string;
  ogTitle?: string;
  ogDescription?: string;
  twitterCard?: TwitterCardType;
  structuredData?: StructuredData[];
  robots?: RobotsMeta;
}

export interface StructuredData {
  type: string;
  data: Record<string, any>;
}

// Skill & Technology Types
export interface Skill {
  id: string;
  name: string;
  category: SkillCategory;
  level: SkillLevel;
  yearsOfExperience: number;
  certifications: Certification[];
  projects: string[]; // Project IDs
  endorsements: Endorsement[];
  icon?: string;
  color?: string;
  order: number;
}

export interface Technology {
  id: string;
  name: string;
  category: TechCategory;
  version?: string;
  icon?: string;
  color?: string;
  website?: string;
  documentation?: string;
  popularity: number;
}

// Testimonial & Feedback Types
export interface Testimonial {
  id: string;
  content: string;
  author: TestimonialAuthor;
  rating: number;
  project?: string; // Project ID
  featured: boolean;
  verified: boolean;
  createdAt: Date;
  approvedAt?: Date;
}

export interface TestimonialAuthor {
  name: string;
  title: string;
  company: string;
  avatar?: string;
  linkedinUrl?: string;
  website?: string;
}

export interface FeedbackItem {
  id: string;
  type: FeedbackType;
  content: string;
  author: string;
  status: FeedbackStatus;
  priority: Priority;
  category: string;
  attachments: Attachment[];
  createdAt: Date;
  resolvedAt?: Date;
}

// Contact & Lead Management Types
export interface ContactForm {
  id: string;
  name: string;
  email: string;
  company?: string;
  phone?: string;
  projectType: ProjectType;
  budget: BudgetRange;
  timeline: Timeline;
  message: string;
  source: TrafficSource;
  status: LeadStatus;
  priority: Priority;
  assignedTo?: string;
  followUpDate?: Date;
  createdAt: Date;
}

export interface Lead extends ContactForm {
  score: number;
  interactions: Interaction[];
  notes: Note[];
  documents: Document[];
  meetings: Meeting[];
  proposals: Proposal[];
}

// Timeline & Experience Types
export interface TimelineItem {
  id: string;
  type: TimelineType;
  title: string;
  subtitle?: string;
  description: string;
  company?: string;
  location?: string;
  startDate: Date;
  endDate?: Date;
  current: boolean;
  achievements: string[];
  skills: string[];
  media: MediaAsset[];
  order: number;
}

// Settings & Configuration Types
export interface SiteSettings {
  general: GeneralSettings;
  seo: SEOSettings;
  analytics: AnalyticsSettings;
  social: SocialSettings;
  email: EmailSettings;
  security: SecuritySettings;
  performance: PerformanceSettings;
  integrations: IntegrationSettings;
}

export interface GeneralSettings {
  siteName: string;
  tagline: string;
  description: string;
  logo: MediaAsset;
  favicon: MediaAsset;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  timezone: string;
  language: string;
  currency: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ResponseMetadata;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  stack?: string;
}

export interface ResponseMetadata {
  page?: number;
  limit?: number;
  total?: number;
  hasMore?: boolean;
  timestamp: Date;
  requestId: string;
}

// Pagination & Filtering Types
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface FilterParams {
  search?: string;
  category?: string;
  tags?: string[];
  status?: ContentStatus;
  dateRange?: DateRange;
  featured?: boolean;
}

export interface DateRange {
  start: Date;
  end: Date;
}

// Enum Types
export enum UserRole {
  ADMIN = 'admin',
  EDITOR = 'editor',
  VIEWER = 'viewer',
  CLIENT = 'client'
}

export enum Permission {
  READ_PROJECTS = 'read:projects',
  WRITE_PROJECTS = 'write:projects',
  DELETE_PROJECTS = 'delete:projects',
  MANAGE_USERS = 'manage:users',
  MANAGE_SETTINGS = 'manage:settings',
  VIEW_ANALYTICS = 'view:analytics'
}

export enum ContentStatus {
  DRAFT = 'draft',
  REVIEW = 'review',
  PUBLISHED = 'published',
  ARCHIVED = 'archived'
}

export enum Visibility {
  PUBLIC = 'public',
  PRIVATE = 'private',
  UNLISTED = 'unlisted',
  PASSWORD_PROTECTED = 'password_protected'
}

export enum MediaType {
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  DOCUMENT = 'document',
  ARCHIVE = 'archive'
}

export enum BlockType {
  PARAGRAPH = 'paragraph',
  HEADER = 'header',
  LIST = 'list',
  QUOTE = 'quote',
  CODE = 'code',
  IMAGE = 'image',
  VIDEO = 'video',
  EMBED = 'embed',
  TABLE = 'table',
  DELIMITER = 'delimiter'
}

export enum SectionType {
  HERO = 'hero',
  OVERVIEW = 'overview',
  PROBLEM = 'problem',
  SOLUTION = 'solution',
  PROCESS = 'process',
  RESULTS = 'results',
  LEARNINGS = 'learnings',
  GALLERY = 'gallery',
  TESTIMONIAL = 'testimonial'
}

export enum ProjectCategory {
  WEB_DEVELOPMENT = 'web_development',
  MOBILE_APP = 'mobile_app',
  UI_UX_DESIGN = 'ui_ux_design',
  BRANDING = 'branding',
  CONSULTING = 'consulting',
  RESEARCH = 'research',
  OTHER = 'other'
}

export enum SkillCategory {
  TECHNICAL = 'technical',
  DESIGN = 'design',
  MANAGEMENT = 'management',
  COMMUNICATION = 'communication',
  ANALYTICAL = 'analytical',
  CREATIVE = 'creative'
}

export enum SkillLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  EXPERT = 'expert'
}

export enum FeedbackType {
  BUG = 'bug',
  FEATURE_REQUEST = 'feature_request',
  IMPROVEMENT = 'improvement',
  QUESTION = 'question',
  COMPLIMENT = 'compliment',
  COMPLAINT = 'complaint'
}

export enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export enum LeadStatus {
  NEW = 'new',
  CONTACTED = 'contacted',
  QUALIFIED = 'qualified',
  PROPOSAL_SENT = 'proposal_sent',
  NEGOTIATING = 'negotiating',
  WON = 'won',
  LOST = 'lost'
}

// Utility Types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type CreateInput<T> = Omit<T, 'id' | 'createdAt' | 'updatedAt'>;

export type UpdateInput<T> = Partial<Omit<T, 'id' | 'createdAt'>>;

// Additional supporting interfaces
export interface SocialLinks {
  linkedin?: string;
  twitter?: string;
  github?: string;
  dribbble?: string;
  behance?: string;
  instagram?: string;
  youtube?: string;
  website?: string;
}

export interface Language {
  code: string;
  name: string;
  level: 'native' | 'fluent' | 'conversational' | 'basic';
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  issueDate: Date;
  expiryDate?: Date;
  credentialId?: string;
  credentialUrl?: string;
}

export interface Endorsement {
  id: string;
  endorser: string;
  relationship: string;
  message?: string;
  createdAt: Date;
}

export interface Attachment {
  id: string;
  filename: string;
  url: string;
  size: number;
  mimeType: string;
  createdAt: Date;
}

export interface Interaction {
  id: string;
  type: 'email' | 'call' | 'meeting' | 'proposal' | 'contract';
  description: string;
  outcome?: string;
  nextAction?: string;
  createdAt: Date;
  createdBy: string;
}

export interface Note {
  id: string;
  content: string;
  private: boolean;
  createdAt: Date;
  createdBy: string;
}

export interface Meeting {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  attendees: string[];
  agenda?: string[];
  notes?: string;
  recording?: string;
  status: 'scheduled' | 'completed' | 'cancelled';
}

export interface Proposal {
  id: string;
  title: string;
  description: string;
  scope: string[];
  timeline: string;
  budget: number;
  terms: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  validUntil: Date;
  createdAt: Date;
  sentAt?: Date;
  respondedAt?: Date;
}
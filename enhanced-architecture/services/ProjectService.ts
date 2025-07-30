import { z } from 'zod';
import { 
  Project, 
  CreateInput, 
  UpdateInput, 
  FilterParams, 
  PaginationParams,
  ProjectMetrics,
  ApiResponse,
  ContentStatus,
  Visibility
} from '../types';
import { CacheService } from './CacheService';
import { DatabaseService } from './DatabaseService';
import { MediaService } from './MediaService';
import { AnalyticsService } from './AnalyticsService';
import { SEOService } from './SEOService';
import { ValidationError, NotFoundError } from '../utils/errors';

// Validation Schemas
const CreateProjectSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(2000),
  summary: z.string().max(500).optional(),
  category: z.enum(['web_development', 'mobile_app', 'ui_ux_design', 'branding', 'consulting', 'research', 'other']),
  tags: z.array(z.string()).max(10, 'Maximum 10 tags allowed'),
  technologies: z.array(z.string().uuid()).max(20, 'Maximum 20 technologies'),
  liveUrl: z.string().url().optional().or(z.literal('')),
  githubUrl: z.string().url().optional().or(z.literal('')),
  figmaUrl: z.string().url().optional().or(z.literal('')),
  featured: z.boolean().default(false),
  status: z.enum(['draft', 'review', 'published', 'archived']).default('draft'),
  visibility: z.enum(['public', 'private', 'unlisted', 'password_protected']).default('public'),
  heroImage: z.object({
    url: z.string().url(),
    alt: z.string().min(1, 'Alt text is required'),
    caption: z.string().optional()
  }).optional(),
  gallery: z.array(z.object({
    url: z.string().url(),
    alt: z.string(),
    caption: z.string().optional()
  })).max(20, 'Maximum 20 gallery images').default([]),
  content: z.object({
    blocks: z.array(z.any()),
    version: z.string(),
    time: z.number()
  }).optional(),
  seo: z.object({
    title: z.string().max(60).optional(),
    description: z.string().max(160).optional(),
    keywords: z.array(z.string()).max(10).optional()
  }).optional()
});

const UpdateProjectSchema = CreateProjectSchema.partial();

const FilterSchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(['draft', 'review', 'published', 'archived']).optional(),
  featured: z.boolean().optional(),
  visibility: z.enum(['public', 'private', 'unlisted', 'password_protected']).optional(),
  dateRange: z.object({
    start: z.date(),
    end: z.date()
  }).optional()
});

export class ProjectService {
  constructor(
    private db: DatabaseService,
    private cache: CacheService,
    private media: MediaService,
    private analytics: AnalyticsService,
    private seo: SEOService
  ) {}

  /**
   * Get all projects with filtering and pagination
   */
  async getProjects(
    filters: FilterParams = {},
    pagination: PaginationParams = { page: 1, limit: 10 }
  ): Promise<ApiResponse<{ projects: Project[]; total: number }>> {
    try {
      // Validate filters
      const validatedFilters = FilterSchema.parse(filters);
      
      // Generate cache key
      const cacheKey = `projects:${JSON.stringify({ filters: validatedFilters, pagination })}`;
      
      // Try cache first
      const cached = await this.cache.get<{ projects: Project[]; total: number }>(cacheKey);
      if (cached) {
        return { success: true, data: cached };
      }

      // Build query
      const query = this.buildProjectQuery(validatedFilters);
      
      // Execute query with pagination
      const [projects, total] = await Promise.all([
        this.db.project.findMany({
          where: query,
          include: {
            technologies: true,
            media: true,
            metrics: true,
            seo: true,
            collaborators: true
          },
          orderBy: this.buildOrderBy(pagination.sortBy, pagination.sortOrder),
          skip: (pagination.page - 1) * pagination.limit,
          take: pagination.limit
        }),
        this.db.project.count({ where: query })
      ]);

      // Transform and enrich data
      const enrichedProjects = await Promise.all(
        projects.map(project => this.enrichProjectData(project))
      );

      const result = { projects: enrichedProjects, total };
      
      // Cache result
      await this.cache.set(cacheKey, result, 300); // 5 minutes

      return { success: true, data: result };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Get a single project by ID or slug
   */
  async getProject(identifier: string): Promise<ApiResponse<Project>> {
    try {
      const cacheKey = `project:${identifier}`;
      
      // Try cache first
      const cached = await this.cache.get<Project>(cacheKey);
      if (cached) {
        // Track view asynchronously
        this.trackProjectView(cached.id, identifier);
        return { success: true, data: cached };
      }

      // Determine if identifier is UUID or slug
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
      
      const project = await this.db.project.findUnique({
        where: isUuid ? { id: identifier } : { slug: identifier },
        include: {
          technologies: true,
          media: true,
          metrics: true,
          seo: true,
          collaborators: true,
          feedback: {
            where: { status: 'approved' },
            orderBy: { createdAt: 'desc' },
            take: 10
          }
        }
      });

      if (!project) {
        throw new NotFoundError('Project not found');
      }

      // Enrich project data
      const enrichedProject = await this.enrichProjectData(project);
      
      // Cache result
      await this.cache.set(cacheKey, enrichedProject, 600); // 10 minutes
      
      // Track view asynchronously
      this.trackProjectView(project.id, identifier);

      return { success: true, data: enrichedProject };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Create a new project
   */
  async createProject(
    data: CreateInput<Project>, 
    userId: string
  ): Promise<ApiResponse<Project>> {
    try {
      // Validate input
      const validatedData = CreateProjectSchema.parse(data);
      
      // Generate slug
      const slug = await this.generateUniqueSlug(validatedData.title);
      
      // Process media assets
      const processedMedia = await this.processProjectMedia(validatedData);
      
      // Generate SEO metadata
      const seoData = await this.seo.generateProjectSEO(validatedData);
      
      // Create project
      const project = await this.db.project.create({
        data: {
          ...validatedData,
          slug,
          ...processedMedia,
          seo: seoData,
          createdBy: userId,
          updatedBy: userId,
          metrics: {
            create: this.getInitialMetrics()
          }
        },
        include: {
          technologies: true,
          media: true,
          metrics: true,
          seo: true
        }
      });

      // Invalidate related caches
      await this.invalidateProjectCaches();
      
      // Track creation event
      await this.analytics.trackEvent('project_created', {
        projectId: project.id,
        category: project.category,
        userId
      });

      return { success: true, data: project };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Update an existing project
   */
  async updateProject(
    id: string, 
    data: UpdateInput<Project>, 
    userId: string
  ): Promise<ApiResponse<Project>> {
    try {
      // Validate input
      const validatedData = UpdateProjectSchema.parse(data);
      
      // Check if project exists
      const existingProject = await this.db.project.findUnique({
        where: { id },
        include: { media: true }
      });

      if (!existingProject) {
        throw new NotFoundError('Project not found');
      }

      // Process media updates
      const mediaUpdates = await this.processMediaUpdates(
        existingProject.media,
        validatedData
      );

      // Update slug if title changed
      let slug = existingProject.slug;
      if (validatedData.title && validatedData.title !== existingProject.title) {
        slug = await this.generateUniqueSlug(validatedData.title, id);
      }

      // Update SEO if content changed
      const seoUpdates = await this.seo.updateProjectSEO(
        existingProject.seo,
        validatedData
      );

      // Update project
      const updatedProject = await this.db.project.update({
        where: { id },
        data: {
          ...validatedData,
          slug,
          ...mediaUpdates,
          seo: seoUpdates,
          updatedBy: userId,
          updatedAt: new Date()
        },
        include: {
          technologies: true,
          media: true,
          metrics: true,
          seo: true
        }
      });

      // Invalidate caches
      await this.invalidateProjectCaches(id);
      
      // Track update event
      await this.analytics.trackEvent('project_updated', {
        projectId: id,
        changes: Object.keys(validatedData),
        userId
      });

      return { success: true, data: updatedProject };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Delete a project
   */
  async deleteProject(id: string, userId: string): Promise<ApiResponse<void>> {
    try {
      const project = await this.db.project.findUnique({
        where: { id },
        include: { media: true }
      });

      if (!project) {
        throw new NotFoundError('Project not found');
      }

      // Delete associated media files
      await this.media.deleteProjectMedia(project.media);

      // Soft delete project (archive instead of hard delete)
      await this.db.project.update({
        where: { id },
        data: {
          status: ContentStatus.ARCHIVED,
          updatedBy: userId,
          updatedAt: new Date()
        }
      });

      // Invalidate caches
      await this.invalidateProjectCaches(id);
      
      // Track deletion event
      await this.analytics.trackEvent('project_deleted', {
        projectId: id,
        userId
      });

      return { success: true };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Get project analytics
   */
  async getProjectAnalytics(
    id: string,
    timeRange: { start: Date; end: Date }
  ): Promise<ApiResponse<ProjectMetrics>> {
    try {
      const analytics = await this.analytics.getProjectAnalytics(id, timeRange);
      return { success: true, data: analytics };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Duplicate a project
   */
  async duplicateProject(
    id: string, 
    userId: string,
    overrides: Partial<CreateInput<Project>> = {}
  ): Promise<ApiResponse<Project>> {
    try {
      const originalProject = await this.db.project.findUnique({
        where: { id },
        include: {
          technologies: true,
          media: true,
          seo: true
        }
      });

      if (!originalProject) {
        throw new NotFoundError('Project not found');
      }

      // Prepare duplicate data
      const duplicateData = {
        ...originalProject,
        ...overrides,
        title: overrides.title || `${originalProject.title} (Copy)`,
        slug: '', // Will be generated
        status: ContentStatus.DRAFT,
        featured: false,
        id: undefined,
        createdAt: undefined,
        updatedAt: undefined,
        createdBy: undefined,
        updatedBy: undefined
      };

      // Create duplicate
      return await this.createProject(duplicateData, userId);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Bulk operations
   */
  async bulkUpdateProjects(
    ids: string[],
    updates: Partial<UpdateInput<Project>>,
    userId: string
  ): Promise<ApiResponse<{ updated: number }>> {
    try {
      const validatedUpdates = UpdateProjectSchema.parse(updates);
      
      const result = await this.db.project.updateMany({
        where: { id: { in: ids } },
        data: {
          ...validatedUpdates,
          updatedBy: userId,
          updatedAt: new Date()
        }
      });

      // Invalidate caches
      await this.invalidateProjectCaches();
      
      // Track bulk update
      await this.analytics.trackEvent('projects_bulk_updated', {
        count: result.count,
        updates: Object.keys(validatedUpdates),
        userId
      });

      return { success: true, data: { updated: result.count } };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Private helper methods

  private buildProjectQuery(filters: FilterParams) {
    const query: any = {};

    if (filters.search) {
      query.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { tags: { hasSome: [filters.search] } }
      ];
    }

    if (filters.category) {
      query.category = filters.category;
    }

    if (filters.tags && filters.tags.length > 0) {
      query.tags = { hasSome: filters.tags };
    }

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.featured !== undefined) {
      query.featured = filters.featured;
    }

    if (filters.dateRange) {
      query.createdAt = {
        gte: filters.dateRange.start,
        lte: filters.dateRange.end
      };
    }

    return query;
  }

  private buildOrderBy(sortBy?: string, sortOrder: 'asc' | 'desc' = 'desc') {
    const validSortFields = ['createdAt', 'updatedAt', 'title', 'views'];
    const field = validSortFields.includes(sortBy || '') ? sortBy : 'createdAt';
    
    if (field === 'views') {
      return { metrics: { views: sortOrder } };
    }
    
    return { [field]: sortOrder };
  }

  private async enrichProjectData(project: any): Promise<Project> {
    // Add computed fields
    const enriched = {
      ...project,
      readTime: this.calculateReadTime(project.content),
      shareUrl: `${process.env.SITE_URL}/projects/${project.slug}`,
      editUrl: `${process.env.SITE_URL}/admin/projects/${project.id}`,
    };

    // Add related data if needed
    if (project.technologies) {
      enriched.technologies = await this.enrichTechnologies(project.technologies);
    }

    return enriched;
  }

  private calculateReadTime(content: any): number {
    if (!content || !content.blocks) return 0;
    
    const wordsPerMinute = 200;
    let wordCount = 0;
    
    content.blocks.forEach((block: any) => {
      if (block.type === 'paragraph' || block.type === 'header') {
        wordCount += (block.data.text || '').split(' ').length;
      }
    });
    
    return Math.ceil(wordCount / wordsPerMinute);
  }

  private async generateUniqueSlug(title: string, excludeId?: string): Promise<string> {
    const baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const existing = await this.db.project.findFirst({
        where: {
          slug,
          ...(excludeId && { id: { not: excludeId } })
        }
      });

      if (!existing) break;
      
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    return slug;
  }

  private async processProjectMedia(data: any) {
    const mediaUpdates: any = {};

    if (data.heroImage) {
      mediaUpdates.heroImage = await this.media.processImage(data.heroImage);
    }

    if (data.gallery && data.gallery.length > 0) {
      mediaUpdates.gallery = await Promise.all(
        data.gallery.map((img: any) => this.media.processImage(img))
      );
    }

    return mediaUpdates;
  }

  private async processMediaUpdates(existingMedia: any[], updates: any) {
    // Implementation for handling media updates
    // This would include comparing existing vs new media
    // and handling uploads/deletions accordingly
    return {};
  }

  private getInitialMetrics(): Partial<ProjectMetrics> {
    return {
      views: 0,
      uniqueViews: 0,
      likes: 0,
      shares: 0,
      comments: 0,
      downloads: 0,
      conversionRate: 0,
      averageTimeSpent: 0,
      bounceRate: 0
    };
  }

  private async trackProjectView(projectId: string, identifier: string) {
    // Asynchronous view tracking
    try {
      await this.analytics.trackEvent('project_viewed', {
        projectId,
        identifier,
        timestamp: new Date()
      });

      // Update view count
      await this.db.project.update({
        where: { id: projectId },
        data: {
          metrics: {
            update: {
              views: { increment: 1 }
            }
          }
        }
      });
    } catch (error) {
      console.error('Failed to track project view:', error);
    }
  }

  private async invalidateProjectCaches(projectId?: string) {
    const patterns = ['projects:*'];
    
    if (projectId) {
      patterns.push(`project:${projectId}`);
    }

    await Promise.all(
      patterns.map(pattern => this.cache.invalidate(pattern))
    );
  }

  private async enrichTechnologies(technologies: any[]) {
    // Add additional technology metadata
    return technologies.map(tech => ({
      ...tech,
      iconUrl: `https://cdn.jsdelivr.net/gh/devicons/devicon/icons/${tech.name.toLowerCase()}/${tech.name.toLowerCase()}-original.svg`,
      documentationUrl: this.getTechDocumentationUrl(tech.name)
    }));
  }

  private getTechDocumentationUrl(techName: string): string {
    const docUrls: Record<string, string> = {
      'react': 'https://reactjs.org/docs',
      'vue': 'https://vuejs.org/guide',
      'angular': 'https://angular.io/docs',
      'node': 'https://nodejs.org/docs',
      'typescript': 'https://www.typescriptlang.org/docs',
      // Add more as needed
    };

    return docUrls[techName.toLowerCase()] || `https://www.google.com/search?q=${techName}+documentation`;
  }

  private handleError(error: any): ApiResponse<never> {
    if (error instanceof ValidationError) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.message,
          details: error.details
        }
      };
    }

    if (error instanceof NotFoundError) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: error.message
        }
      };
    }

    // Log unexpected errors
    console.error('ProjectService error:', error);

    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred'
      }
    };
  }
}
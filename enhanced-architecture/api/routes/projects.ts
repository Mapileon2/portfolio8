import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { ProjectService } from '../services/ProjectService';
import { AuthService } from '../services/AuthService';
import { RateLimitService } from '../services/RateLimitService';
import { ValidationService } from '../services/ValidationService';
import { 
  Project, 
  FilterParams, 
  PaginationParams, 
  Permission,
  ApiResponse 
} from '../types';

// Request/Response Schemas
const GetProjectsQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  sortBy: z.enum(['createdAt', 'updatedAt', 'title', 'views']).optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().optional(),
  category: z.string().optional(),
  tags: z.string().transform(str => str.split(',')).optional(),
  status: z.enum(['draft', 'review', 'published', 'archived']).optional(),
  featured: z.coerce.boolean().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional()
});

const GetProjectParamsSchema = z.object({
  identifier: z.string().min(1)
});

const CreateProjectSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(10).max(2000),
  summary: z.string().max(500).optional(),
  category: z.enum(['web_development', 'mobile_app', 'ui_ux_design', 'branding', 'consulting', 'research', 'other']),
  tags: z.array(z.string()).max(10),
  technologies: z.array(z.string().uuid()).max(20),
  liveUrl: z.string().url().optional().or(z.literal('')),
  githubUrl: z.string().url().optional().or(z.literal('')),
  figmaUrl: z.string().url().optional().or(z.literal('')),
  featured: z.boolean().default(false),
  status: z.enum(['draft', 'review', 'published', 'archived']).default('draft'),
  visibility: z.enum(['public', 'private', 'unlisted', 'password_protected']).default('public'),
  heroImage: z.object({
    url: z.string().url(),
    alt: z.string().min(1),
    caption: z.string().optional()
  }).optional(),
  gallery: z.array(z.object({
    url: z.string().url(),
    alt: z.string(),
    caption: z.string().optional()
  })).max(20).default([]),
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

const BulkUpdateSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(50),
  updates: UpdateProjectSchema
});

const DuplicateProjectSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  status: z.enum(['draft', 'review', 'published', 'archived']).optional()
});

// Type definitions for requests
interface GetProjectsRequest extends FastifyRequest {
  query: z.infer<typeof GetProjectsQuerySchema>;
}

interface GetProjectRequest extends FastifyRequest {
  params: z.infer<typeof GetProjectParamsSchema>;
}

interface CreateProjectRequest extends FastifyRequest {
  body: z.infer<typeof CreateProjectSchema>;
}

interface UpdateProjectRequest extends FastifyRequest {
  params: { id: string };
  body: z.infer<typeof UpdateProjectSchema>;
}

interface DeleteProjectRequest extends FastifyRequest {
  params: { id: string };
}

interface BulkUpdateRequest extends FastifyRequest {
  body: z.infer<typeof BulkUpdateSchema>;
}

interface DuplicateProjectRequest extends FastifyRequest {
  params: { id: string };
  body: z.infer<typeof DuplicateProjectSchema>;
}

export async function projectRoutes(fastify: FastifyInstance) {
  const projectService = fastify.diContainer.resolve<ProjectService>('projectService');
  const authService = fastify.diContainer.resolve<AuthService>('authService');
  const rateLimitService = fastify.diContainer.resolve<RateLimitService>('rateLimitService');
  const validationService = fastify.diContainer.resolve<ValidationService>('validationService');

  // Rate limiting configurations
  const publicRateLimit = { max: 100, timeWindow: '1 minute' };
  const authRateLimit = { max: 200, timeWindow: '1 minute' };
  const adminRateLimit = { max: 500, timeWindow: '1 minute' };

  /**
   * GET /api/projects
   * Get all projects with filtering and pagination
   */
  fastify.get<{ Querystring: z.infer<typeof GetProjectsQuerySchema> }>(
    '/projects',
    {
      schema: {
        querystring: GetProjectsQuerySchema,
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  projects: { type: 'array' },
                  total: { type: 'number' }
                }
              },
              meta: {
                type: 'object',
                properties: {
                  page: { type: 'number' },
                  limit: { type: 'number' },
                  hasMore: { type: 'boolean' }
                }
              }
            }
          }
        }
      },
      preHandler: [
        rateLimitService.createLimiter(publicRateLimit),
        authService.optionalAuth
      ]
    },
    async (request: GetProjectsRequest, reply: FastifyReply) => {
      try {
        const { page, limit, sortBy, sortOrder, startDate, endDate, ...filters } = request.query;
        
        const paginationParams: PaginationParams = {
          page,
          limit,
          sortBy,
          sortOrder
        };

        const filterParams: FilterParams = {
          ...filters,
          ...(startDate && endDate && {
            dateRange: { start: startDate, end: endDate }
          })
        };

        // Apply visibility filters based on user permissions
        if (!request.user || !request.user.permissions.includes(Permission.READ_PROJECTS)) {
          filterParams.status = 'published';
          filterParams.visibility = 'public';
        }

        const result = await projectService.getProjects(filterParams, paginationParams);

        if (!result.success) {
          return reply.code(400).send(result);
        }

        const response: ApiResponse<any> = {
          success: true,
          data: result.data,
          meta: {
            page,
            limit,
            total: result.data!.total,
            hasMore: page * limit < result.data!.total,
            timestamp: new Date(),
            requestId: request.id
          }
        };

        return reply.send(response);
      } catch (error) {
        fastify.log.error('Error in GET /projects:', error);
        return reply.code(500).send({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to fetch projects'
          }
        });
      }
    }
  );

  /**
   * GET /api/projects/:identifier
   * Get a single project by ID or slug
   */
  fastify.get<{ Params: z.infer<typeof GetProjectParamsSchema> }>(
    '/projects/:identifier',
    {
      schema: {
        params: GetProjectParamsSchema,
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: { type: 'object' }
            }
          },
          404: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              error: { type: 'object' }
            }
          }
        }
      },
      preHandler: [
        rateLimitService.createLimiter(publicRateLimit),
        authService.optionalAuth
      ]
    },
    async (request: GetProjectRequest, reply: FastifyReply) => {
      try {
        const { identifier } = request.params;
        
        const result = await projectService.getProject(identifier);

        if (!result.success) {
          const statusCode = result.error?.code === 'NOT_FOUND' ? 404 : 400;
          return reply.code(statusCode).send(result);
        }

        // Check visibility permissions
        const project = result.data!;
        if (project.visibility !== 'public' && project.status !== 'published') {
          if (!request.user || !request.user.permissions.includes(Permission.READ_PROJECTS)) {
            return reply.code(404).send({
              success: false,
              error: {
                code: 'NOT_FOUND',
                message: 'Project not found'
              }
            });
          }
        }

        return reply.send(result);
      } catch (error) {
        fastify.log.error(`Error in GET /projects/${request.params.identifier}:`, error);
        return reply.code(500).send({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to fetch project'
          }
        });
      }
    }
  );

  /**
   * POST /api/projects
   * Create a new project
   */
  fastify.post<{ Body: z.infer<typeof CreateProjectSchema> }>(
    '/projects',
    {
      schema: {
        body: CreateProjectSchema,
        response: {
          201: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: { type: 'object' }
            }
          }
        }
      },
      preHandler: [
        rateLimitService.createLimiter(authRateLimit),
        authService.requireAuth,
        authService.requirePermission(Permission.WRITE_PROJECTS)
      ]
    },
    async (request: CreateProjectRequest, reply: FastifyReply) => {
      try {
        const result = await projectService.createProject(request.body, request.user!.id);

        if (!result.success) {
          return reply.code(400).send(result);
        }

        return reply.code(201).send(result);
      } catch (error) {
        fastify.log.error('Error in POST /projects:', error);
        return reply.code(500).send({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to create project'
          }
        });
      }
    }
  );

  /**
   * PUT /api/projects/:id
   * Update an existing project
   */
  fastify.put<{ Params: { id: string }; Body: z.infer<typeof UpdateProjectSchema> }>(
    '/projects/:id',
    {
      schema: {
        params: { type: 'object', properties: { id: { type: 'string', format: 'uuid' } } },
        body: UpdateProjectSchema,
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: { type: 'object' }
            }
          }
        }
      },
      preHandler: [
        rateLimitService.createLimiter(authRateLimit),
        authService.requireAuth,
        authService.requirePermission(Permission.WRITE_PROJECTS)
      ]
    },
    async (request: UpdateProjectRequest, reply: FastifyReply) => {
      try {
        const { id } = request.params;
        
        const result = await projectService.updateProject(id, request.body, request.user!.id);

        if (!result.success) {
          const statusCode = result.error?.code === 'NOT_FOUND' ? 404 : 400;
          return reply.code(statusCode).send(result);
        }

        return reply.send(result);
      } catch (error) {
        fastify.log.error(`Error in PUT /projects/${request.params.id}:`, error);
        return reply.code(500).send({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to update project'
          }
        });
      }
    }
  );

  /**
   * DELETE /api/projects/:id
   * Delete a project
   */
  fastify.delete<{ Params: { id: string } }>(
    '/projects/:id',
    {
      schema: {
        params: { type: 'object', properties: { id: { type: 'string', format: 'uuid' } } },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' }
            }
          }
        }
      },
      preHandler: [
        rateLimitService.createLimiter(authRateLimit),
        authService.requireAuth,
        authService.requirePermission(Permission.DELETE_PROJECTS)
      ]
    },
    async (request: DeleteProjectRequest, reply: FastifyReply) => {
      try {
        const { id } = request.params;
        
        const result = await projectService.deleteProject(id, request.user!.id);

        if (!result.success) {
          const statusCode = result.error?.code === 'NOT_FOUND' ? 404 : 400;
          return reply.code(statusCode).send(result);
        }

        return reply.send({
          success: true,
          message: 'Project deleted successfully'
        });
      } catch (error) {
        fastify.log.error(`Error in DELETE /projects/${request.params.id}:`, error);
        return reply.code(500).send({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to delete project'
          }
        });
      }
    }
  );

  /**
   * POST /api/projects/:id/duplicate
   * Duplicate a project
   */
  fastify.post<{ Params: { id: string }; Body: z.infer<typeof DuplicateProjectSchema> }>(
    '/projects/:id/duplicate',
    {
      schema: {
        params: { type: 'object', properties: { id: { type: 'string', format: 'uuid' } } },
        body: DuplicateProjectSchema,
        response: {
          201: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: { type: 'object' }
            }
          }
        }
      },
      preHandler: [
        rateLimitService.createLimiter(authRateLimit),
        authService.requireAuth,
        authService.requirePermission(Permission.WRITE_PROJECTS)
      ]
    },
    async (request: DuplicateProjectRequest, reply: FastifyReply) => {
      try {
        const { id } = request.params;
        
        const result = await projectService.duplicateProject(id, request.user!.id, request.body);

        if (!result.success) {
          const statusCode = result.error?.code === 'NOT_FOUND' ? 404 : 400;
          return reply.code(statusCode).send(result);
        }

        return reply.code(201).send(result);
      } catch (error) {
        fastify.log.error(`Error in POST /projects/${request.params.id}/duplicate:`, error);
        return reply.code(500).send({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to duplicate project'
          }
        });
      }
    }
  );

  /**
   * PATCH /api/projects/bulk
   * Bulk update projects
   */
  fastify.patch<{ Body: z.infer<typeof BulkUpdateSchema> }>(
    '/projects/bulk',
    {
      schema: {
        body: BulkUpdateSchema,
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  updated: { type: 'number' }
                }
              }
            }
          }
        }
      },
      preHandler: [
        rateLimitService.createLimiter(adminRateLimit),
        authService.requireAuth,
        authService.requirePermission(Permission.WRITE_PROJECTS)
      ]
    },
    async (request: BulkUpdateRequest, reply: FastifyReply) => {
      try {
        const { ids, updates } = request.body;
        
        const result = await projectService.bulkUpdateProjects(ids, updates, request.user!.id);

        if (!result.success) {
          return reply.code(400).send(result);
        }

        return reply.send(result);
      } catch (error) {
        fastify.log.error('Error in PATCH /projects/bulk:', error);
        return reply.code(500).send({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to bulk update projects'
          }
        });
      }
    }
  );

  /**
   * GET /api/projects/:id/analytics
   * Get project analytics
   */
  fastify.get<{ 
    Params: { id: string };
    Querystring: { startDate?: string; endDate?: string };
  }>(
    '/projects/:id/analytics',
    {
      schema: {
        params: { type: 'object', properties: { id: { type: 'string', format: 'uuid' } } },
        querystring: {
          type: 'object',
          properties: {
            startDate: { type: 'string', format: 'date' },
            endDate: { type: 'string', format: 'date' }
          }
        }
      },
      preHandler: [
        rateLimitService.createLimiter(authRateLimit),
        authService.requireAuth,
        authService.requirePermission(Permission.VIEW_ANALYTICS)
      ]
    },
    async (request, reply: FastifyReply) => {
      try {
        const { id } = request.params;
        const { startDate, endDate } = request.query;
        
        const timeRange = {
          start: startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
          end: endDate ? new Date(endDate) : new Date()
        };
        
        const result = await projectService.getProjectAnalytics(id, timeRange);

        if (!result.success) {
          const statusCode = result.error?.code === 'NOT_FOUND' ? 404 : 400;
          return reply.code(statusCode).send(result);
        }

        return reply.send(result);
      } catch (error) {
        fastify.log.error(`Error in GET /projects/${request.params.id}/analytics:`, error);
        return reply.code(500).send({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to fetch project analytics'
          }
        });
      }
    }
  );

  /**
   * GET /api/projects/featured
   * Get featured projects
   */
  fastify.get(
    '/projects/featured',
    {
      schema: {
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: { type: 'array' }
            }
          }
        }
      },
      preHandler: [
        rateLimitService.createLimiter(publicRateLimit)
      ]
    },
    async (request, reply: FastifyReply) => {
      try {
        const result = await projectService.getProjects(
          { featured: true, status: 'published', visibility: 'public' },
          { page: 1, limit: 6, sortBy: 'updatedAt', sortOrder: 'desc' }
        );

        if (!result.success) {
          return reply.code(400).send(result);
        }

        return reply.send({
          success: true,
          data: result.data!.projects
        });
      } catch (error) {
        fastify.log.error('Error in GET /projects/featured:', error);
        return reply.code(500).send({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to fetch featured projects'
          }
        });
      }
    }
  );
}
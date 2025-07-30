import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, 
  Share2, 
  ExternalLink, 
  Github, 
  Eye, 
  Calendar,
  Tag,
  Clock,
  TrendingUp,
  Bookmark,
  MoreHorizontal
} from 'lucide-react';
import { Project, ProjectMetrics } from '../types';
import { useAnalytics } from '../hooks/useAnalytics';
import { useAuth } from '../hooks/useAuth';
import { useFavorites } from '../hooks/useFavorites';
import { formatDate, formatNumber } from '../utils/formatters';
import { OptimizedImage } from './OptimizedImage';
import { TechnologyBadge } from './TechnologyBadge';
import { ShareModal } from './ShareModal';
import { ProjectActionsMenu } from './ProjectActionsMenu';

interface ProjectCardProps {
  project: Project;
  variant?: 'default' | 'compact' | 'featured' | 'grid';
  showMetrics?: boolean;
  showActions?: boolean;
  onView?: (project: Project) => void;
  onEdit?: (project: Project) => void;
  onDelete?: (project: Project) => void;
  className?: string;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  variant = 'default',
  showMetrics = true,
  showActions = false,
  onView,
  onEdit,
  onDelete,
  className = ''
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const { trackEvent } = useAnalytics();
  const { user, hasPermission } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();

  const handleCardClick = useCallback(() => {
    trackEvent('project_card_clicked', {
      projectId: project.id,
      projectTitle: project.title,
      variant
    });
    
    if (onView) {
      onView(project);
    }
  }, [project, variant, trackEvent, onView]);

  const handleLike = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      await toggleFavorite(project.id);
      trackEvent('project_liked', {
        projectId: project.id,
        action: isFavorite(project.id) ? 'unlike' : 'like'
      });
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  }, [project.id, toggleFavorite, isFavorite, trackEvent]);

  const handleShare = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setShowShareModal(true);
    trackEvent('project_share_opened', { projectId: project.id });
  }, [project.id, trackEvent]);

  const handleExternalLink = useCallback((e: React.MouseEvent, url: string, type: string) => {
    e.stopPropagation();
    trackEvent('project_external_link_clicked', {
      projectId: project.id,
      linkType: type,
      url
    });
    window.open(url, '_blank', 'noopener,noreferrer');
  }, [project.id, trackEvent]);

  const cardVariants = {
    default: 'bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300',
    compact: 'bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-all duration-200',
    featured: 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300',
    grid: 'bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 h-full'
  };

  const imageVariants = {
    default: 'h-48',
    compact: 'h-32',
    featured: 'h-64',
    grid: 'h-40'
  };

  return (
    <>
      <motion.div
        className={`${cardVariants[variant]} ${className} cursor-pointer overflow-hidden group`}
        whileHover={{ y: -4 }}
        whileTap={{ scale: 0.98 }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleCardClick}
        layout
      >
        {/* Hero Image */}
        <div className={`relative ${imageVariants[variant]} overflow-hidden`}>
          <OptimizedImage
            src={project.heroImage?.url || '/images/project-placeholder.jpg'}
            alt={project.heroImage?.alt || project.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            onLoad={() => setImageLoaded(true)}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          
          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Status Badge */}
          {project.status !== 'published' && (
            <div className="absolute top-3 left-3">
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                project.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                project.status === 'review' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
              </span>
            </div>
          )}

          {/* Featured Badge */}
          {project.featured && (
            <div className="absolute top-3 right-3">
              <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                <TrendingUp size={12} />
                Featured
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <AnimatePresence>
            {isHovered && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute bottom-3 right-3 flex gap-2"
              >
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleLike}
                  className={`p-2 rounded-full backdrop-blur-sm transition-colors ${
                    isFavorite(project.id)
                      ? 'bg-red-500 text-white'
                      : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  <Heart size={16} fill={isFavorite(project.id) ? 'currentColor' : 'none'} />
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleShare}
                  className="p-2 rounded-full bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm transition-colors"
                >
                  <Share2 size={16} />
                </motion.button>

                {showActions && hasPermission('write:projects') && (
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowActionsMenu(true);
                    }}
                    className="p-2 rounded-full bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm transition-colors"
                  >
                    <MoreHorizontal size={16} />
                  </motion.button>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* External Links */}
          {(project.liveUrl || project.githubUrl) && (
            <div className="absolute bottom-3 left-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              {project.liveUrl && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => handleExternalLink(e, project.liveUrl!, 'live')}
                  className="p-2 rounded-full bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm transition-colors"
                  title="View Live Project"
                >
                  <ExternalLink size={16} />
                </motion.button>
              )}
              
              {project.githubUrl && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => handleExternalLink(e, project.githubUrl!, 'github')}
                  className="p-2 rounded-full bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm transition-colors"
                  title="View Source Code"
                >
                  <Github size={16} />
                </motion.button>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {project.title}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
                <Calendar size={12} />
                {formatDate(project.updatedAt)}
              </p>
            </div>
            
            {project.readTime && (
              <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 ml-3">
                <Clock size={12} />
                {project.readTime}min read
              </div>
            )}
          </div>

          {/* Description */}
          <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-3">
            {project.description}
          </p>

          {/* Technologies */}
          {project.technologies && project.technologies.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-4">
              {project.technologies.slice(0, 4).map((tech) => (
                <TechnologyBadge key={tech.id} technology={tech} size="sm" />
              ))}
              {project.technologies.length > 4 && (
                <span className="text-xs text-gray-500 dark:text-gray-400 px-2 py-1">
                  +{project.technologies.length - 4} more
                </span>
              )}
            </div>
          )}

          {/* Tags */}
          {project.tags && project.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-4">
              {project.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full"
                >
                  <Tag size={10} />
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Metrics */}
          {showMetrics && project.metrics && (
            <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-1">
                  <Eye size={14} />
                  {formatNumber(project.metrics.views)}
                </div>
                <div className="flex items-center gap-1">
                  <Heart size={14} />
                  {formatNumber(project.metrics.likes)}
                </div>
                <div className="flex items-center gap-1">
                  <Share2 size={14} />
                  {formatNumber(project.metrics.shares)}
                </div>
              </div>
              
              <div className="text-xs text-gray-400 dark:text-gray-500">
                {project.category.replace('_', ' ').toUpperCase()}
              </div>
            </div>
          )}
        </div>

        {/* Loading State */}
        {!imageLoaded && (
          <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse" />
        )}
      </motion.div>

      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        project={project}
      />

      {/* Actions Menu */}
      {showActionsMenu && (
        <ProjectActionsMenu
          project={project}
          onClose={() => setShowActionsMenu(false)}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      )}
    </>
  );
};

// Skeleton loader for loading states
export const ProjectCardSkeleton: React.FC<{ variant?: ProjectCardProps['variant'] }> = ({ 
  variant = 'default' 
}) => {
  const cardVariants = {
    default: 'bg-white dark:bg-gray-800 rounded-xl shadow-lg',
    compact: 'bg-white dark:bg-gray-800 rounded-lg shadow-md',
    featured: 'bg-white dark:bg-gray-800 rounded-2xl shadow-xl',
    grid: 'bg-white dark:bg-gray-800 rounded-lg shadow-md h-full'
  };

  const imageVariants = {
    default: 'h-48',
    compact: 'h-32',
    featured: 'h-64',
    grid: 'h-40'
  };

  return (
    <div className={`${cardVariants[variant]} overflow-hidden animate-pulse`}>
      {/* Image Skeleton */}
      <div className={`${imageVariants[variant]} bg-gray-300 dark:bg-gray-600`} />
      
      {/* Content Skeleton */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-2" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
          </div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16 ml-3" />
        </div>
        
        <div className="space-y-2 mb-4">
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-4/6" />
        </div>
        
        <div className="flex gap-2 mb-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-16" />
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-20" />
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-14" />
        </div>
        
        <div className="flex justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex gap-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12" />
          </div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20" />
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;
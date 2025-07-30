import { EventEmitter } from 'events';
import { CacheService } from './CacheService';
import { DatabaseService } from './DatabaseService';

export interface SearchQuery {
  query: string;
  filters?: {
    category?: string;
    tags?: string[];
    dateRange?: { start: Date; end: Date };
    author?: string;
    status?: string;
  };
  sort?: {
    field: string;
    direction: 'asc' | 'desc';
  };
  pagination?: {
    page: number;
    limit: number;
  };
}

export interface SearchResult {
  id: string;
  type: 'project' | 'blog' | 'skill' | 'experience';
  title: string;
  description: string;
  url: string;
  score: number;
  highlights?: string[];
  metadata?: Record<string, any>;
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  page: number;
  limit: number;
  facets?: Record<string, Array<{ value: string; count: number }>>;
  suggestions?: string[];
  searchTime: number;
}

export interface SearchIndex {
  id: string;
  type: string;
  title: string;
  content: string;
  tags: string[];
  category: string;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export class SearchService extends EventEmitter {
  private cache: CacheService;
  private db: DatabaseService;
  private searchIndex: Map<string, SearchIndex> = new Map();
  private stopWords = new Set([
    'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
    'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the',
    'to', 'was', 'will', 'with', 'the', 'this', 'but', 'they', 'have',
    'had', 'what', 'said', 'each', 'which', 'she', 'do', 'how', 'their'
  ]);

  constructor(cache: CacheService, db: DatabaseService) {
    super();
    this.cache = cache;
    this.db = db;
    this.initializeIndex();
  }

  /**
   * Search across all indexed content
   */
  async search(searchQuery: SearchQuery): Promise<SearchResponse> {
    const startTime = Date.now();
    
    try {
      // Check cache first
      const cacheKey = this.generateCacheKey(searchQuery);
      const cached = await this.cache.get<SearchResponse>(cacheKey);
      if (cached) {
        return cached;
      }

      // Perform search
      const results = await this.performSearch(searchQuery);
      
      // Apply filters
      const filteredResults = this.applyFilters(results, searchQuery.filters);
      
      // Sort results
      const sortedResults = this.sortResults(filteredResults, searchQuery.sort);
      
      // Apply pagination
      const paginatedResults = this.paginateResults(sortedResults, searchQuery.pagination);
      
      // Generate facets
      const facets = this.generateFacets(filteredResults);
      
      // Generate suggestions
      const suggestions = await this.generateSuggestions(searchQuery.query);
      
      const response: SearchResponse = {
        results: paginatedResults,
        total: filteredResults.length,
        page: searchQuery.pagination?.page || 1,
        limit: searchQuery.pagination?.limit || 10,
        facets,
        suggestions,
        searchTime: Date.now() - startTime
      };

      // Cache results for 5 minutes
      await this.cache.set(cacheKey, response, 300);
      
      // Track search analytics
      await this.trackSearch(searchQuery, response);
      
      return response;
    } catch (error) {
      console.error('Search error:', error);
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Get search suggestions
   */
  async getSuggestions(query: string, limit: number = 5): Promise<string[]> {
    try {
      const cacheKey = `search_suggestions:${query.toLowerCase()}`;
      const cached = await this.cache.get<string[]>(cacheKey);
      if (cached) return cached;

      const suggestions = await this.generateSuggestions(query, limit);
      
      // Cache for 1 hour
      await this.cache.set(cacheKey, suggestions, 3600);
      
      return suggestions;
    } catch (error) {
      console.error('Error getting suggestions:', error);
      return [];
    }
  }

  /**
   * Index a document
   */
  async indexDocument(document: {
    id: string;
    type: string;
    title: string;
    content: string;
    tags?: string[];
    category?: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    try {
      const searchIndex: SearchIndex = {
        id: document.id,
        type: document.type,
        title: document.title,
        content: this.cleanContent(document.content),
        tags: document.tags || [],
        category: document.category || 'general',
        metadata: document.metadata || {},
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Add to in-memory index
      this.searchIndex.set(document.id, searchIndex);

      // Store in database
      await this.db.searchIndex.upsert({
        where: { id: document.id },
        update: {
          type: searchIndex.type,
          title: searchIndex.title,
          content: searchIndex.content,
          tags: searchIndex.tags,
          category: searchIndex.category,
          metadata: searchIndex.metadata,
          updatedAt: searchIndex.updatedAt
        },
        create: searchIndex
      });

      // Clear related caches
      await this.clearSearchCaches();

      this.emit('document_indexed', document);
    } catch (error) {
      console.error('Error indexing document:', error);
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Remove document from index
   */
  async removeFromIndex(documentId: string): Promise<void> {
    try {
      // Remove from in-memory index
      this.searchIndex.delete(documentId);

      // Remove from database
      await this.db.searchIndex.delete({
        where: { id: documentId }
      });

      // Clear related caches
      await this.clearSearchCaches();

      this.emit('document_removed', documentId);
    } catch (error) {
      console.error('Error removing document from index:', error);
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Reindex all documents
   */
  async reindexAll(): Promise<void> {
    try {
      console.log('Starting full reindex...');
      
      // Clear existing index
      this.searchIndex.clear();
      await this.db.searchIndex.deleteMany({});

      // Reindex projects
      const projects = await this.db.project.findMany();
      for (const project of projects) {
        await this.indexDocument({
          id: project.id,
          type: 'project',
          title: project.title,
          content: `${project.description} ${project.technologies.join(' ')}`,
          tags: project.technologies,
          category: project.category || 'project',
          metadata: {
            githubUrl: project.githubUrl,
            liveUrl: project.liveUrl,
            featured: project.featured
          }
        });
      }

      // Reindex blog posts (if you have them)
      // const blogPosts = await this.db.blogPost.findMany();
      // for (const post of blogPosts) {
      //   await this.indexDocument({
      //     id: post.id,
      //     type: 'blog',
      //     title: post.title,
      //     content: post.content,
      //     tags: post.tags,
      //     category: post.category,
      //     metadata: {
      //       author: post.author,
      //       publishedAt: post.publishedAt
      //     }
      //   });
      // }

      console.log(`Reindexed ${this.searchIndex.size} documents`);
      this.emit('reindex_complete', this.searchIndex.size);
    } catch (error) {
      console.error('Error during reindex:', error);
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Get search analytics
   */
  async getSearchAnalytics(timeRange: { start: Date; end: Date }): Promise<{
    totalSearches: number;
    topQueries: Array<{ query: string; count: number }>;
    noResultsQueries: Array<{ query: string; count: number }>;
    averageResultsPerQuery: number;
    searchesByType: Record<string, number>;
  }> {
    try {
      const analytics = await this.db.searchAnalytics.findMany({
        where: {
          timestamp: {
            gte: timeRange.start,
            lte: timeRange.end
          }
        }
      });

      const totalSearches = analytics.length;
      
      // Top queries
      const queryCount: Record<string, number> = {};
      const noResultsQueries: Record<string, number> = {};
      const typeCount: Record<string, number> = {};
      let totalResults = 0;

      analytics.forEach(search => {
        queryCount[search.query] = (queryCount[search.query] || 0) + 1;
        
        if (search.resultCount === 0) {
          noResultsQueries[search.query] = (noResultsQueries[search.query] || 0) + 1;
        }
        
        if (search.filters?.type) {
          typeCount[search.filters.type] = (typeCount[search.filters.type] || 0) + 1;
        }
        
        totalResults += search.resultCount;
      });

      const topQueries = Object.entries(queryCount)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([query, count]) => ({ query, count }));

      const topNoResultsQueries = Object.entries(noResultsQueries)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([query, count]) => ({ query, count }));

      return {
        totalSearches,
        topQueries,
        noResultsQueries: topNoResultsQueries,
        averageResultsPerQuery: totalSearches > 0 ? totalResults / totalSearches : 0,
        searchesByType: typeCount
      };
    } catch (error) {
      console.error('Error getting search analytics:', error);
      throw error;
    }
  }

  // Private methods

  private async initializeIndex(): Promise<void> {
    try {
      // Load existing index from database
      const indexedDocs = await this.db.searchIndex.findMany();
      
      for (const doc of indexedDocs) {
        this.searchIndex.set(doc.id, doc as SearchIndex);
      }

      console.log(`Loaded ${this.searchIndex.size} documents into search index`);
    } catch (error) {
      console.error('Error initializing search index:', error);
    }
  }

  private async performSearch(searchQuery: SearchQuery): Promise<SearchResult[]> {
    const query = searchQuery.query.toLowerCase().trim();
    const terms = this.tokenize(query);
    const results: SearchResult[] = [];

    for (const [id, doc] of this.searchIndex) {
      const score = this.calculateScore(doc, terms, query);
      
      if (score > 0) {
        const highlights = this.generateHighlights(doc, terms);
        
        results.push({
          id: doc.id,
          type: doc.type as any,
          title: doc.title,
          description: this.generateDescription(doc.content),
          url: this.generateUrl(doc),
          score,
          highlights,
          metadata: doc.metadata
        });
      }
    }

    return results;
  }

  private calculateScore(doc: SearchIndex, terms: string[], originalQuery: string): number {
    let score = 0;
    const titleLower = doc.title.toLowerCase();
    const contentLower = doc.content.toLowerCase();
    const tagsLower = doc.tags.map(tag => tag.toLowerCase());

    // Exact phrase match in title (highest score)
    if (titleLower.includes(originalQuery)) {
      score += 100;
    }

    // Exact phrase match in content
    if (contentLower.includes(originalQuery)) {
      score += 50;
    }

    // Individual term matches
    terms.forEach(term => {
      // Title matches (high score)
      if (titleLower.includes(term)) {
        score += 20;
      }

      // Tag matches (medium-high score)
      if (tagsLower.some(tag => tag.includes(term))) {
        score += 15;
      }

      // Content matches (medium score)
      const contentMatches = (contentLower.match(new RegExp(term, 'g')) || []).length;
      score += contentMatches * 5;

      // Boost for exact word matches
      if (titleLower.split(' ').includes(term)) {
        score += 10;
      }
    });

    // Boost for newer content
    const daysSinceCreated = (Date.now() - doc.createdAt.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceCreated < 30) {
      score *= 1.2;
    } else if (daysSinceCreated < 90) {
      score *= 1.1;
    }

    return score;
  }

  private applyFilters(results: SearchResult[], filters?: SearchQuery['filters']): SearchResult[] {
    if (!filters) return results;

    return results.filter(result => {
      const doc = this.searchIndex.get(result.id);
      if (!doc) return false;

      // Category filter
      if (filters.category && doc.category !== filters.category) {
        return false;
      }

      // Tags filter
      if (filters.tags && filters.tags.length > 0) {
        const hasMatchingTag = filters.tags.some(tag => 
          doc.tags.some(docTag => docTag.toLowerCase().includes(tag.toLowerCase()))
        );
        if (!hasMatchingTag) return false;
      }

      // Date range filter
      if (filters.dateRange) {
        if (doc.createdAt < filters.dateRange.start || doc.createdAt > filters.dateRange.end) {
          return false;
        }
      }

      // Type filter
      if (filters.status && doc.metadata.status !== filters.status) {
        return false;
      }

      return true;
    });
  }

  private sortResults(results: SearchResult[], sort?: SearchQuery['sort']): SearchResult[] {
    if (!sort) {
      // Default sort by score (descending)
      return results.sort((a, b) => b.score - a.score);
    }

    return results.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sort.field) {
        case 'score':
          aValue = a.score;
          bValue = b.score;
          break;
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'date':
          const aDoc = this.searchIndex.get(a.id);
          const bDoc = this.searchIndex.get(b.id);
          aValue = aDoc?.createdAt.getTime() || 0;
          bValue = bDoc?.createdAt.getTime() || 0;
          break;
        default:
          aValue = a.score;
          bValue = b.score;
      }

      if (sort.direction === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }

  private paginateResults(results: SearchResult[], pagination?: SearchQuery['pagination']): SearchResult[] {
    if (!pagination) return results.slice(0, 10);

    const start = (pagination.page - 1) * pagination.limit;
    const end = start + pagination.limit;
    
    return results.slice(start, end);
  }

  private generateFacets(results: SearchResult[]): Record<string, Array<{ value: string; count: number }>> {
    const facets: Record<string, Record<string, number>> = {
      type: {},
      category: {},
      tags: {}
    };

    results.forEach(result => {
      const doc = this.searchIndex.get(result.id);
      if (!doc) return;

      // Type facet
      facets.type[doc.type] = (facets.type[doc.type] || 0) + 1;

      // Category facet
      facets.category[doc.category] = (facets.category[doc.category] || 0) + 1;

      // Tags facet
      doc.tags.forEach(tag => {
        facets.tags[tag] = (facets.tags[tag] || 0) + 1;
      });
    });

    // Convert to array format and sort by count
    const result: Record<string, Array<{ value: string; count: number }>> = {};
    
    Object.entries(facets).forEach(([facetName, facetData]) => {
      result[facetName] = Object.entries(facetData)
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10); // Top 10 per facet
    });

    return result;
  }

  private async generateSuggestions(query: string, limit: number = 5): Promise<string[]> {
    const suggestions: string[] = [];
    const queryLower = query.toLowerCase();

    // Find similar queries from search history
    try {
      const recentSearches = await this.db.searchAnalytics.findMany({
        where: {
          query: {
            contains: queryLower
          }
        },
        orderBy: {
          timestamp: 'desc'
        },
        take: limit * 2
      });

      const uniqueQueries = new Set<string>();
      recentSearches.forEach(search => {
        if (search.query !== query && search.resultCount > 0) {
          uniqueQueries.add(search.query);
        }
      });

      suggestions.push(...Array.from(uniqueQueries).slice(0, limit));
    } catch (error) {
      console.error('Error generating suggestions:', error);
    }

    // If not enough suggestions, add some based on indexed content
    if (suggestions.length < limit) {
      const contentSuggestions = this.generateContentBasedSuggestions(queryLower, limit - suggestions.length);
      suggestions.push(...contentSuggestions);
    }

    return suggestions;
  }

  private generateContentBasedSuggestions(query: string, limit: number): string[] {
    const suggestions: Set<string> = new Set();

    for (const [, doc] of this.searchIndex) {
      // Check titles
      if (doc.title.toLowerCase().includes(query)) {
        suggestions.add(doc.title);
      }

      // Check tags
      doc.tags.forEach(tag => {
        if (tag.toLowerCase().includes(query)) {
          suggestions.add(tag);
        }
      });

      if (suggestions.size >= limit) break;
    }

    return Array.from(suggestions).slice(0, limit);
  }

  private generateHighlights(doc: SearchIndex, terms: string[]): string[] {
    const highlights: string[] = [];
    const content = doc.content.toLowerCase();

    terms.forEach(term => {
      const index = content.indexOf(term);
      if (index !== -1) {
        const start = Math.max(0, index - 50);
        const end = Math.min(content.length, index + term.length + 50);
        let highlight = doc.content.substring(start, end);
        
        // Add ellipsis if truncated
        if (start > 0) highlight = '...' + highlight;
        if (end < content.length) highlight = highlight + '...';
        
        highlights.push(highlight);
      }
    });

    return highlights.slice(0, 3); // Max 3 highlights
  }

  private generateDescription(content: string): string {
    const maxLength = 200;
    if (content.length <= maxLength) return content;
    
    const truncated = content.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    
    return lastSpace > 0 ? truncated.substring(0, lastSpace) + '...' : truncated + '...';
  }

  private generateUrl(doc: SearchIndex): string {
    switch (doc.type) {
      case 'project':
        return `/projects/${doc.id}`;
      case 'blog':
        return `/blog/${doc.id}`;
      default:
        return `/${doc.type}/${doc.id}`;
    }
  }

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(term => term.length > 2 && !this.stopWords.has(term));
  }

  private cleanContent(content: string): string {
    // Remove HTML tags and normalize whitespace
    return content
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private generateCacheKey(searchQuery: SearchQuery): string {
    const key = JSON.stringify({
      query: searchQuery.query,
      filters: searchQuery.filters,
      sort: searchQuery.sort,
      pagination: searchQuery.pagination
    });
    
    return `search:${Buffer.from(key).toString('base64')}`;
  }

  private async clearSearchCaches(): Promise<void> {
    try {
      // Clear all search-related caches
      const keys = await this.cache.keys('search:*');
      if (keys.length > 0) {
        await this.cache.del(...keys);
      }
    } catch (error) {
      console.error('Error clearing search caches:', error);
    }
  }

  private async trackSearch(searchQuery: SearchQuery, response: SearchResponse): Promise<void> {
    try {
      await this.db.searchAnalytics.create({
        data: {
          query: searchQuery.query,
          filters: searchQuery.filters,
          resultCount: response.total,
          searchTime: response.searchTime,
          timestamp: new Date()
        }
      });
    } catch (error) {
      console.error('Error tracking search:', error);
    }
  }

  /**
   * Stop the search service
   */
  async stop(): Promise<void> {
    this.searchIndex.clear();
    this.removeAllListeners();
  }
}

export default SearchService;
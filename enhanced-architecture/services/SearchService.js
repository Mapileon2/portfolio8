const Fuse = require('fuse.js');
const NodeCache = require('node-cache');
const fs = require('fs').promises;
const path = require('path');

class SearchService {
  constructor() {
    this.cache = new NodeCache({ stdTTL: 1800 }); // 30 minutes cache
    this.dataFile = path.join(__dirname, '../data/search-index.json');
    this.documents = [];
    this.fuse = null;
    this.searchHistory = [];
    
    this.fuseOptions = {
      keys: [
        { name: 'title', weight: 0.4 },
        { name: 'description', weight: 0.3 },
        { name: 'technologies', weight: 0.2 },
        { name: 'category', weight: 0.1 }
      ],
      threshold: 0.4,
      includeScore: true,
      includeMatches: true,
      minMatchCharLength: 2
    };

    this.loadIndex();
  }

  async loadIndex() {
    try {
      const data = await fs.readFile(this.dataFile, 'utf8');
      const parsed = JSON.parse(data);
      this.documents = parsed.documents || [];
      this.searchHistory = parsed.searchHistory || [];
      this.initializeFuse();
    } catch (error) {
      console.log('No existing search index found, starting fresh');
      await this.ensureDataDirectory();
      await this.initializeWithDefaultData();
    }
  }

  async ensureDataDirectory() {
    const dataDir = path.dirname(this.dataFile);
    try {
      await fs.mkdir(dataDir, { recursive: true });
    } catch (error) {
      console.error('Error creating data directory:', error);
    }
  }

  async initializeWithDefaultData() {
    // Initialize with some default portfolio data
    const defaultProjects = [
      {
        id: 'project-1',
        type: 'project',
        title: 'E-commerce Platform',
        description: 'A full-stack e-commerce solution built with React and Node.js',
        technologies: ['React', 'Node.js', 'MongoDB', 'Express'],
        category: 'Web Development',
        url: '/projects/ecommerce-platform'
      },
      {
        id: 'project-2',
        type: 'project',
        title: 'Task Management App',
        description: 'A collaborative task management application with real-time updates',
        technologies: ['Vue.js', 'Firebase', 'Vuetify'],
        category: 'Web Development',
        url: '/projects/task-management'
      },
      {
        id: 'skill-1',
        type: 'skill',
        title: 'JavaScript',
        description: 'Proficient in modern JavaScript ES6+, async/await, and functional programming',
        technologies: ['JavaScript', 'ES6+', 'TypeScript'],
        category: 'Programming Languages',
        url: '/skills#javascript'
      },
      {
        id: 'skill-2',
        type: 'skill',
        title: 'React Development',
        description: 'Expert in React ecosystem including hooks, context, and state management',
        technologies: ['React', 'Redux', 'React Router', 'Hooks'],
        category: 'Frontend Frameworks',
        url: '/skills#react'
      }
    ];

    this.documents = defaultProjects;
    this.initializeFuse();
    await this.saveIndex();
  }

  initializeFuse() {
    this.fuse = new Fuse(this.documents, this.fuseOptions);
  }

  async saveIndex() {
    try {
      await this.ensureDataDirectory();
      const data = {
        documents: this.documents,
        searchHistory: this.searchHistory.slice(-100), // Keep last 100 searches
        lastUpdated: new Date().toISOString()
      };
      await fs.writeFile(this.dataFile, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Error saving search index:', error);
    }
  }

  search(query, options = {}) {
    if (!query || query.trim().length < 2) {
      return {
        results: [],
        total: 0,
        query: query,
        suggestions: this.getSuggestions('')
      };
    }

    const cacheKey = `search_${query}_${JSON.stringify(options)}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    // Track search
    this.trackSearch(query);

    let results = [];
    
    if (this.fuse) {
      const fuseResults = this.fuse.search(query);
      results = fuseResults.map(result => ({
        id: result.item.id,
        type: result.item.type,
        title: result.item.title,
        description: result.item.description,
        url: result.item.url,
        score: Math.round((1 - result.score) * 100),
        highlights: this.generateHighlights(result.matches, query),
        technologies: result.item.technologies,
        category: result.item.category
      }));
    }

    // Apply filters
    if (options.type) {
      results = results.filter(r => r.type === options.type);
    }
    
    if (options.category) {
      results = results.filter(r => r.category === options.category);
    }

    if (options.technologies && options.technologies.length > 0) {
      results = results.filter(r => 
        r.technologies.some(tech => 
          options.technologies.some(filterTech => 
            tech.toLowerCase().includes(filterTech.toLowerCase())
          )
        )
      );
    }

    // Apply pagination
    const limit = options.limit || 10;
    const offset = options.offset || 0;
    const paginatedResults = results.slice(offset, offset + limit);

    const searchResult = {
      results: paginatedResults,
      total: results.length,
      query: query,
      suggestions: this.getSuggestions(query),
      facets: this.generateFacets(results)
    };

    this.cache.set(cacheKey, searchResult);
    return searchResult;
  }

  generateHighlights(matches, query) {
    if (!matches || matches.length === 0) return [];
    
    const highlights = [];
    matches.forEach(match => {
      if (match.value && match.indices) {
        match.indices.forEach(([start, end]) => {
          const highlight = match.value.substring(
            Math.max(0, start - 20),
            Math.min(match.value.length, end + 20)
          );
          highlights.push(highlight);
        });
      }
    });
    
    return highlights.slice(0, 3); // Max 3 highlights
  }

  generateFacets(results) {
    const facets = {
      types: {},
      categories: {},
      technologies: {}
    };

    results.forEach(result => {
      // Type facets
      facets.types[result.type] = (facets.types[result.type] || 0) + 1;
      
      // Category facets
      facets.categories[result.category] = (facets.categories[result.category] || 0) + 1;
      
      // Technology facets
      result.technologies.forEach(tech => {
        facets.technologies[tech] = (facets.technologies[tech] || 0) + 1;
      });
    });

    // Convert to array format
    return {
      types: Object.entries(facets.types).map(([value, count]) => ({ value, count })),
      categories: Object.entries(facets.categories).map(([value, count]) => ({ value, count })),
      technologies: Object.entries(facets.technologies)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([value, count]) => ({ value, count }))
    };
  }

  getSuggestions(query, limit = 5) {
    if (!query) {
      // Return recent searches if no query
      return this.searchHistory
        .slice(-limit)
        .reverse()
        .map(search => search.query);
    }

    const suggestions = new Set();
    
    // Add suggestions from document titles
    this.documents.forEach(doc => {
      if (doc.title.toLowerCase().includes(query.toLowerCase())) {
        suggestions.add(doc.title);
      }
      
      // Add technology suggestions
      doc.technologies.forEach(tech => {
        if (tech.toLowerCase().includes(query.toLowerCase())) {
          suggestions.add(tech);
        }
      });
    });

    // Add suggestions from search history
    this.searchHistory.forEach(search => {
      if (search.query.toLowerCase().includes(query.toLowerCase()) && 
          search.query !== query) {
        suggestions.add(search.query);
      }
    });

    return Array.from(suggestions).slice(0, limit);
  }

  trackSearch(query) {
    this.searchHistory.push({
      query: query.trim(),
      timestamp: new Date().toISOString()
    });

    // Keep only last 100 searches
    if (this.searchHistory.length > 100) {
      this.searchHistory = this.searchHistory.slice(-100);
    }

    // Save periodically
    if (this.searchHistory.length % 10 === 0) {
      this.saveIndex();
    }
  }

  addDocument(document) {
    const existingIndex = this.documents.findIndex(doc => doc.id === document.id);
    
    if (existingIndex >= 0) {
      this.documents[existingIndex] = document;
    } else {
      this.documents.push(document);
    }

    this.initializeFuse();
    this.cache.flushAll(); // Clear cache
    this.saveIndex();
    
    console.log(`🔍 Search: Document ${document.id} indexed`);
  }

  removeDocument(documentId) {
    this.documents = this.documents.filter(doc => doc.id !== documentId);
    this.initializeFuse();
    this.cache.flushAll();
    this.saveIndex();
    
    console.log(`🔍 Search: Document ${documentId} removed from index`);
  }

  updateDocument(documentId, updates) {
    const index = this.documents.findIndex(doc => doc.id === documentId);
    if (index >= 0) {
      this.documents[index] = { ...this.documents[index], ...updates };
      this.initializeFuse();
      this.cache.flushAll();
      this.saveIndex();
      
      console.log(`🔍 Search: Document ${documentId} updated`);
    }
  }

  getSearchAnalytics(days = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const recentSearches = this.searchHistory.filter(search => 
      new Date(search.timestamp) > cutoffDate
    );

    const queryCount = {};
    recentSearches.forEach(search => {
      queryCount[search.query] = (queryCount[search.query] || 0) + 1;
    });

    return {
      totalSearches: recentSearches.length,
      uniqueQueries: Object.keys(queryCount).length,
      topQueries: Object.entries(queryCount)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([query, count]) => ({ query, count })),
      searchTrends: this.getSearchTrends(recentSearches)
    };
  }

  getSearchTrends(searches) {
    const dailySearches = {};
    
    searches.forEach(search => {
      const date = new Date(search.timestamp).toISOString().split('T')[0];
      dailySearches[date] = (dailySearches[date] || 0) + 1;
    });

    return Object.entries(dailySearches)
      .sort(([a], [b]) => new Date(a) - new Date(b))
      .map(([date, count]) => ({ date, count }));
  }

  reindexAll(documents) {
    this.documents = documents;
    this.initializeFuse();
    this.cache.flushAll();
    this.saveIndex();
    
    console.log(`🔍 Search: Reindexed ${documents.length} documents`);
  }
}

module.exports = SearchService;
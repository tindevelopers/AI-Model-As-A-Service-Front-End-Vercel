# Blog Writer API Integration Guide

## Overview

This document describes the integration of the AI Blog Writer API into the AI-as-a-Service platform. The integration provides a specialized service for generating high-quality blog posts with SEO optimization, outline generation, and tone adaptation.

## Architecture

The Blog Writer API is integrated into the existing AI Router system, allowing it to be used alongside other AI services through a unified interface.

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Admin Panel   │───▶│  AI Router       │───▶│  Blog Writer    │
│                 │    │  (Orchestrator)  │    │  API Service    │
│ • Service Mgmt  │    │ • Intent Analysis│    │ • Blog Gen      │
│ • Health Monitor│    │ • Route Planning │    │ • SEO Opt       │
│ • Test Interface│    │ • Load Balancing │    │ • Outline Gen   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Components

### 1. Blog Writer API Client (`src/lib/services/blog-writer-api.ts`)

The main client for interacting with the Blog Writer API service.

**Features:**
- Automatic retry logic with exponential backoff
- Request timeout handling
- Comprehensive error logging
- Health check functionality
- Configuration management

**Usage:**
```typescript
import { blogWriterApi } from '@/lib/services/blog-writer-api'

// Generate a blog post
const response = await blogWriterApi.generateBlogPost({
  topic: "Artificial Intelligence in Healthcare",
  keywords: ["AI", "healthcare", "machine learning"],
  tone: "professional",
  length: "medium",
  target_audience: "healthcare professionals",
  include_outline: true
})

// Check service health
const health = await blogWriterApi.healthCheck()

// Get available options
const options = await blogWriterApi.getAvailableOptions()
```

### 2. AI Router Integration (`src/lib/ai-router.ts`)

The Blog Writer service is registered in the AI Router system, allowing it to be automatically selected for blog-writing requests.

**Service Definition:**
- **ID**: `blog-writer-api`
- **Type**: `blog-writing`
- **Capabilities**: SEO optimization, outline generation, keyword integration, tone adaptation
- **Quality Score**: 0.86/1.0
- **Supported Languages**: English, Spanish, French, German, Italian, Portuguese, Russian, Chinese, Japanese, Korean

### 3. API Routes

#### Blog Generation (`/api/blog-writer/generate`)
- **POST**: Generate a new blog post
- **GET**: Get available options (tones, lengths, languages, styles)

#### Health Check (`/api/blog-writer/health`)
- **GET**: Check service health status

#### Admin Configuration (`/api/admin/services/blog-writer/config`)
- **GET**: Get current configuration
- **PUT**: Update configuration

### 4. Admin Interface (`src/components/admin/blog-writer-service-manager.tsx`)

A comprehensive admin interface for managing the Blog Writer service.

**Features:**
- Real-time health monitoring
- Service configuration management
- Test blog generation interface
- Performance metrics display
- Error logging and debugging

### 5. Health Monitoring (`src/lib/services/health-monitor.ts`)

Automated health monitoring system that tracks:
- Service availability
- Response times
- Error rates
- Request success/failure metrics

## Configuration

### Environment Variables

Add the following variables to your environment configuration:

```bash
# Blog Writer API Configuration
NEXT_PUBLIC_BLOG_WRITER_API_URL=https://api-ai-blog-writer-613248238610.us-central1.run.app
BLOG_WRITER_API_KEY=your-blog-writer-api-key-here
```

### Service Configuration

The service can be configured through the admin interface or by updating the service definition in `ai-router.ts`:

```typescript
const blogWriterService: ServiceDefinition = {
  id: 'blog-writer-api',
  name: 'AI Blog Writer API',
  type: 'blog-writing',
  capabilities: {
    supportedFormats: ['text', 'markdown', 'html'],
    maxTokens: 4000,
    supportedLanguages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ko'],
    specialFeatures: ['seo-optimization', 'outline-generation', 'keyword-integration', 'tone-adaptation'],
    quality: {
      relevance: 0.9,
      coherence: 0.85,
      creativity: 0.8,
      accuracy: 0.9,
      overall: 0.86
    }
  },
  // ... additional configuration
}
```

## Usage Examples

### 1. Direct API Usage

```typescript
import { blogWriterApi } from '@/lib/services/blog-writer-api'

// Basic blog generation
const blogPost = await blogWriterApi.generateBlogPost({
  topic: "The Future of Web Development",
  tone: "professional",
  length: "medium"
})

console.log(blogPost.title)
console.log(blogPost.content)
console.log(blogPost.outline)
```

### 2. Through AI Router

```typescript
import { aiRouter } from '@/lib/ai-router'

// The AI Router will automatically select the Blog Writer service
// for blog-writing requests
const response = await aiRouter.routeRequest({
  prompt: "Write a blog post about sustainable energy solutions",
  serviceType: "blog-writing",
  preferences: {
    costPreference: "balanced",
    qualityPreference: "high"
  }
})
```

### 3. Frontend Integration

```typescript
// In a React component
const generateBlog = async () => {
  try {
    const response = await fetch('/api/blog-writer/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        topic: "AI in Education",
        tone: "friendly",
        length: "long",
        target_audience: "educators",
        include_outline: true
      })
    })

    const data = await response.json()
    if (data.success) {
      setBlogPost(data.data)
    }
  } catch (error) {
    console.error('Failed to generate blog:', error)
  }
}
```

## API Reference

### BlogWriterRequest

```typescript
interface BlogWriterRequest {
  topic: string                                    // Required: Blog topic
  keywords?: string[]                             // Optional: SEO keywords
  tone?: 'professional' | 'casual' | 'friendly' | 'authoritative' | 'conversational'
  length?: 'short' | 'medium' | 'long'           // Blog length
  target_audience?: string                       // Target audience
  include_outline?: boolean                      // Include outline
  language?: string                              // Language code (default: 'en')
  style?: string                                 // Writing style
  additional_instructions?: string               // Additional instructions
}
```

### BlogWriterResponse

```typescript
interface BlogWriterResponse {
  title: string                                  // Generated title
  content: string                               // Blog content
  outline?: string[]                            // Blog outline
  keywords_used: string[]                       // Keywords used
  word_count: number                            // Word count
  estimated_reading_time: number                // Reading time in minutes
  seo_score?: number                            // SEO score (0-100)
  metadata: {
    generated_at: string                        // Generation timestamp
    model_used: string                          // AI model used
    processing_time: number                     // Processing time in ms
  }
}
```

## Error Handling

The integration includes comprehensive error handling:

1. **Network Errors**: Automatic retry with exponential backoff
2. **Timeout Errors**: Configurable timeout with graceful failure
3. **API Errors**: Detailed error messages and logging
4. **Validation Errors**: Input validation with helpful error messages

### Error Response Format

```typescript
interface BlogWriterError {
  error: string                                 // Error type
  message: string                              // Human-readable message
  code?: string                                // Error code
  details?: unknown                            // Additional error details
}
```

## Monitoring and Analytics

### Health Monitoring

The system automatically monitors:
- Service availability
- Response times
- Error rates
- Request success/failure ratios

### Metrics Available

- **Request Count**: Total number of requests
- **Success Rate**: Percentage of successful requests
- **Average Response Time**: Mean response time
- **Error Rate**: Percentage of failed requests
- **Availability**: Service uptime percentage

### Admin Dashboard

Access the admin dashboard at `/admin/services/blog-writer` to:
- View real-time health status
- Monitor performance metrics
- Test blog generation
- Update service configuration
- View error logs

## Security Considerations

1. **API Key Management**: API keys are stored securely and not exposed to the client
2. **Authentication**: All admin endpoints require user authentication
3. **Rate Limiting**: Built-in rate limiting to prevent abuse
4. **Input Validation**: All inputs are validated before processing
5. **Error Logging**: Comprehensive logging without exposing sensitive data

## Troubleshooting

### Common Issues

1. **Service Unavailable**
   - Check API URL configuration
   - Verify API key is correct
   - Check network connectivity

2. **Timeout Errors**
   - Increase timeout configuration
   - Check service performance
   - Verify request size

3. **Authentication Errors**
   - Verify API key is valid
   - Check key permissions
   - Ensure key is not expired

### Debug Mode

Enable debug logging by setting:
```bash
NODE_ENV=development
```

This will provide detailed logs for debugging issues.

## Future Enhancements

Planned improvements include:
- Caching for improved performance
- Batch processing for multiple blog posts
- Custom model fine-tuning
- Advanced SEO analysis
- Multi-language support expansion
- Integration with content management systems

## Support

For technical support or questions about the Blog Writer API integration:
1. Check the admin dashboard for service status
2. Review error logs in the admin interface
3. Test the service using the built-in test interface
4. Contact the development team with specific error details

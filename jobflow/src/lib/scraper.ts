import * as cheerio from 'cheerio';

export interface ScrapedJob {
  company: string;
  title: string;
  location: string;
  description: string;
  descriptionHtml: string;
  atsType: string;
  atsJobId?: string;
  postingDate?: Date;
}

export class JobScraper {
  /**
   * Detect ATS type from URL
   */
  detectAtsType(url: string): string {
    if (url.includes('greenhouse.io')) return 'greenhouse';
    if (url.includes('workday.com') || url.includes('myworkdayjobs.com')) return 'workday';
    if (url.includes('lever.co')) return 'lever';
    if (url.includes('ashbyhq.com')) return 'ashby';
    if (url.includes('jobs.ashbyhq.com')) return 'ashby';
    if (url.includes('linkedin.com/jobs')) return 'linkedin';
    if (url.includes('indeed.com')) return 'indeed';
    return 'other';
  }

  /**
   * Extract job ID from URL based on ATS type
   */
  extractJobId(url: string, atsType: string): string | undefined {
    try {
      const urlObj = new URL(url);

      switch (atsType) {
        case 'greenhouse':
          const ghMatch = url.match(/\/jobs\/(\d+)/);
          return ghMatch?.[1];
        case 'lever':
          const leverMatch = url.match(/\/jobs\/([^/?]+)/);
          return leverMatch?.[1];
        case 'ashby':
          const ashbyMatch = url.match(/\/jobs\/([^/?]+)/);
          return ashbyMatch?.[1];
        case 'workday':
          return urlObj.searchParams.get('jobReqId') || undefined;
        default:
          return undefined;
      }
    } catch {
      return undefined;
    }
  }

  /**
   * Scrape job details from URL
   * Note: In production, you'd use a headless browser or proxy service
   * for sites that block simple fetch requests
   */
  async scrapeJob(url: string): Promise<ScrapedJob> {
    const atsType = this.detectAtsType(url);
    const atsJobId = this.extractJobId(url, atsType);

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status}`);
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      // Try to extract structured data first
      const jsonLd = $('script[type="application/ld+json"]').first().html();
      if (jsonLd) {
        try {
          const data = JSON.parse(jsonLd);
          if (data['@type'] === 'JobPosting') {
            return {
              company: data.hiringOrganization?.name || $('meta[property="og:site_name"]').attr('content') || 'Unknown',
              title: data.title || $('title').text().split('|')[0].trim(),
              location: data.jobLocation?.address?.addressLocality || 'Remote/Unspecified',
              description: this.cleanDescription(data.description || ''),
              descriptionHtml: data.description || '',
              atsType,
              atsJobId,
              postingDate: data.datePosted ? new Date(data.datePosted) : undefined,
            };
          }
        } catch {
          // Fall through to heuristic extraction
        }
      }

      // Heuristic extraction based on ATS type
      return this.extractHeuristic($, url, atsType, atsJobId);
    } catch (error) {
      console.error('Scraping error:', error);
      // Return minimal data so user can manually fill in
      return {
        company: 'Unknown',
        title: 'Unknown Position',
        location: 'Unknown',
        description: `Failed to auto-scrape. Please paste the job description manually. URL: ${url}`,
        descriptionHtml: '',
        atsType,
        atsJobId,
      };
    }
  }

  private extractHeuristic($: cheerio.CheerioAPI, url: string, atsType: string, atsJobId?: string): ScrapedJob {
    let company = 'Unknown';
    let title = 'Unknown Position';
    let location = 'Unknown';
    let description = '';

    switch (atsType) {
      case 'greenhouse':
        company = $('.company-name').text().trim() || 
                  $('meta[property="og:site_name"]').attr('content') || 
                  url.split('/')[2].replace('.greenhouse.io', '');
        title = $('.app-title').text().trim() || $('h1').first().text().trim();
        location = $('.location').text().trim() || $('.posting-category').text().trim();
        description = $('#content').html() || $('.description').html() || $('body').html() || '';
        break;

      case 'lever':
        company = $('.main-header-logo img').attr('alt') || 
                  url.split('/')[2].replace('.lever.co', '');
        title = $('.posting-headline h2').text().trim() || $('h2').first().text().trim();
        location = $('.sort-by-time .sort-by-time-posting .location').text().trim();
        description = $('.section.page-centered').html() || $('body').html() || '';
        break;

      default:
        // Generic extraction
        title = $('h1').first().text().trim() || $('title').text().split(/[-|]/)[0].trim();
        company = $('meta[property="og:site_name"]').attr('content') || 
                  $('.company').first().text().trim() ||
                  url.split('/')[2];
        location = $('[class*="location"]').first().text().trim() || 
                   $('[class*="place"]').first().text().trim();
        description = $('[class*="description"]').html() || 
                      $('[class*="content"]').html() || 
                      $('article').html() || 
                      $('body').html() || '';
    }

    return {
      company,
      title,
      location,
      description: this.cleanDescription(description),
      descriptionHtml: description,
      atsType,
      atsJobId,
    };
  }

  private cleanDescription(html: string): string {
    const $ = cheerio.load(html);
    return $.text().replace(/\s+/g, ' ').trim();
  }
}

export const jobScraper = new JobScraper();

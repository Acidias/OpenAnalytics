import { FastifyInstance } from 'fastify';
import Anthropic from '@anthropic-ai/sdk';
import { query } from '../db/connection';
import { authMiddleware, verifySiteAccess } from '../middleware/auth';

const ANTHROPIC_MODEL = 'claude-sonnet-4-20250514';

const suggestTool: Anthropic.Tool = {
  name: 'suggest_analytics_config',
  description: 'Suggest funnels, goals, and auto-track rules based on the site analytics data and description.',
  input_schema: {
    type: 'object' as const,
    properties: {
      funnels: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Unique ID, e.g. funnel_1' },
            description: { type: 'string', description: 'Why this funnel is useful' },
            data: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                description: { type: 'string' },
                steps: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      position: { type: 'number' },
                      name: { type: 'string' },
                      match_type: { type: 'string', enum: ['pageview', 'event'] },
                      match_path: { type: 'string' },
                      match_event: { type: 'string' },
                      timeout_ms: { type: 'number' },
                    },
                    required: ['position', 'name', 'match_type'],
                  },
                  minItems: 2,
                },
              },
              required: ['name', 'steps'],
            },
          },
          required: ['id', 'description', 'data'],
        },
      },
      goals: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Unique ID, e.g. goal_1' },
            description: { type: 'string', description: 'Why this goal is useful' },
            data: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                match_type: { type: 'string', enum: ['pageview', 'event'] },
                match_path: { type: 'string' },
                match_event: { type: 'string' },
              },
              required: ['name', 'match_type'],
            },
          },
          required: ['id', 'description', 'data'],
        },
      },
      rules: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Unique ID, e.g. rule_1' },
            description: { type: 'string', description: 'Why this rule is useful' },
            data: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                event: { type: 'string' },
                selector: { type: 'string' },
                trigger: { type: 'string', enum: ['click', 'submit', 'change', 'focus'] },
                capture_text: { type: 'boolean' },
                capture_value: { type: 'boolean' },
              },
              required: ['name', 'event', 'selector'],
            },
          },
          required: ['id', 'description', 'data'],
        },
      },
    },
    required: ['funnels', 'goals', 'rules'],
  },
};

async function gatherContext(siteId: string) {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
  const now = new Date().toISOString();

  const [pages, flows, customEvents, referrers, funnels, goals, rules] = await Promise.all([
    // Top 20 pages
    query(
      `SELECT path, COUNT(*) AS views, COUNT(DISTINCT session_id) AS visitors
       FROM events
       WHERE site_id = $1 AND event = 'pageview' AND time BETWEEN $2 AND $3
       GROUP BY path ORDER BY views DESC LIMIT 20`,
      [siteId, thirtyDaysAgo, now]
    ),
    // Common page flows (entry -> next page)
    query(
      `WITH ordered AS (
         SELECT session_id, path, ROW_NUMBER() OVER (PARTITION BY session_id ORDER BY time) AS rn
         FROM events
         WHERE site_id = $1 AND event = 'pageview' AND time BETWEEN $2 AND $3
       )
       SELECT a.path AS from_page, b.path AS to_page, COUNT(*) AS transitions
       FROM ordered a
       JOIN ordered b ON a.session_id = b.session_id AND b.rn = a.rn + 1
       GROUP BY a.path, b.path
       ORDER BY transitions DESC LIMIT 15`,
      [siteId, thirtyDaysAgo, now]
    ),
    // Custom events (excluding internal event types)
    query(
      `SELECT event, COUNT(*) AS occurrences
       FROM events
       WHERE site_id = $1 AND event NOT IN ('pageview', 'pageleave', 'heartbeat', 'engage')
         AND time BETWEEN $2 AND $3
       GROUP BY event ORDER BY occurrences DESC LIMIT 20`,
      [siteId, thirtyDaysAgo, now]
    ),
    // Top referrers
    query(
      `SELECT referrer, COUNT(DISTINCT session_id) AS sessions
       FROM events
       WHERE site_id = $1 AND referrer IS NOT NULL AND referrer != '' AND time BETWEEN $2 AND $3
       GROUP BY referrer ORDER BY sessions DESC LIMIT 10`,
      [siteId, thirtyDaysAgo, now]
    ),
    // Existing funnels
    query(
      `SELECT f.name, json_agg(fs.name ORDER BY fs.position) AS step_names
       FROM funnels f
       LEFT JOIN funnel_steps fs ON fs.funnel_id = f.id
       WHERE f.site_id = $1
       GROUP BY f.id, f.name`,
      [siteId]
    ),
    // Existing goals
    query(
      'SELECT name, match_type, match_path, match_event FROM goals WHERE site_id = $1',
      [siteId]
    ),
    // Existing auto-track rules
    query(
      'SELECT name, event, selector, trigger FROM auto_track_rules WHERE site_id = $1',
      [siteId]
    ),
  ]);

  return {
    pages: pages.rows,
    flows: flows.rows,
    customEvents: customEvents.rows,
    referrers: referrers.rows,
    existingFunnels: funnels.rows,
    existingGoals: goals.rows,
    existingRules: rules.rows,
    totalPages: pages.rows.length,
    totalEvents: customEvents.rows.reduce(
      (sum: number, r: Record<string, unknown>) => sum + parseInt(r.occurrences as string, 10),
      0
    ),
  };
}

async function crawlHomepage(domain: string): Promise<string | null> {
  const url = `https://${domain}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'OpenAnalytics-Bot/1.0' },
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const html = await res.text();

    // Extract useful structure with simple regex
    const parts: string[] = [];

    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch) parts.push(`Title: ${titleMatch[1].trim()}`);

    const metaDesc = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i);
    if (metaDesc) parts.push(`Description: ${metaDesc[1].trim()}`);

    // Internal links
    const linkRegex = /<a[^>]+href=["']\/([^"'#]*?)["'][^>]*>/gi;
    const links = new Set<string>();
    let linkMatch;
    while ((linkMatch = linkRegex.exec(html)) !== null && links.size < 20) {
      const path = '/' + linkMatch[1].split('?')[0];
      if (path.length > 1) links.add(path);
    }
    if (links.size > 0) parts.push(`Internal links: ${[...links].join(', ')}`);

    // Headings
    const headingRegex = /<h[1-3][^>]*>([^<]+)<\/h[1-3]>/gi;
    const headings: string[] = [];
    let headingMatch;
    while ((headingMatch = headingRegex.exec(html)) !== null && headings.length < 10) {
      headings.push(headingMatch[1].trim());
    }
    if (headings.length > 0) parts.push(`Headings: ${headings.join(', ')}`);

    // Forms
    const formRegex = /<form[^>]*(?:action=["']([^"']+)["'])?[^>]*>/gi;
    const forms: string[] = [];
    let formMatch;
    while ((formMatch = formRegex.exec(html)) !== null && forms.length < 5) {
      forms.push(formMatch[1] || '(inline form)');
    }
    if (forms.length > 0) parts.push(`Forms: ${forms.join(', ')}`);

    // Buttons
    const buttonRegex = /<button[^>]*>([^<]+)<\/button>/gi;
    const buttons: string[] = [];
    let buttonMatch;
    while ((buttonMatch = buttonRegex.exec(html)) !== null && buttons.length < 10) {
      buttons.push(buttonMatch[1].trim());
    }
    if (buttons.length > 0) parts.push(`Buttons: ${buttons.join(', ')}`);

    // Navigation
    const navRegex = /<nav[^>]*>([\s\S]*?)<\/nav>/gi;
    const navMatch = navRegex.exec(html);
    if (navMatch) {
      const navLinks: string[] = [];
      const navLinkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>([^<]+)<\/a>/gi;
      let nl;
      while ((nl = navLinkRegex.exec(navMatch[1])) !== null && navLinks.length < 10) {
        navLinks.push(`${nl[2].trim()} (${nl[1]})`);
      }
      if (navLinks.length > 0) parts.push(`Navigation: ${navLinks.join(', ')}`);
    }

    return parts.join('\n');
  } catch {
    clearTimeout(timeout);
    return null;
  }
}

function buildSystemPrompt(context: Awaited<ReturnType<typeof gatherContext>>, crawlData: string | null, description?: string): string {
  let prompt = `You are an analytics setup assistant for a web analytics platform called OpenAnalytics.
Based on the site's actual data and context, suggest useful funnels, goals, and auto-track rules.

Guidelines:
- Only suggest things that make sense given the actual pages and events observed
- Do not duplicate any existing configuration
- Funnels need at least 2 steps, each step uses match_type "pageview" (with match_path) or "event" (with match_event)
- Goals track a single conversion event - either a pageview of a specific path or a custom event
- Auto-track rules use CSS selectors to automatically capture DOM interactions as events
- Use timeout_ms of 1800000 (30 minutes) for funnel steps unless a shorter window makes sense
- Keep names concise and descriptive
- Provide a brief, helpful description for each suggestion explaining why it is useful
- If there is not enough data to make good suggestions, return empty arrays rather than guessing

Site data from the last 30 days:

Top pages:
${context.pages.map((p: Record<string, unknown>) => `  ${p.path} - ${p.views} views, ${p.visitors} visitors`).join('\n') || '  (no pageview data)'}

Page flows (from -> to, transitions):
${context.flows.map((f: Record<string, unknown>) => `  ${f.from_page} -> ${f.to_page} (${f.transitions})`).join('\n') || '  (no flow data)'}

Custom events tracked:
${context.customEvents.map((e: Record<string, unknown>) => `  ${e.event} - ${e.occurrences} occurrences`).join('\n') || '  (no custom events)'}

Top referrers:
${context.referrers.map((r: Record<string, unknown>) => `  ${r.referrer} - ${r.sessions} sessions`).join('\n') || '  (no referrer data)'}

Existing funnels (do not duplicate):
${context.existingFunnels.map((f: Record<string, unknown>) => `  ${f.name}: ${f.step_names}`).join('\n') || '  (none)'}

Existing goals (do not duplicate):
${context.existingGoals.map((g: Record<string, unknown>) => `  ${g.name} (${g.match_type}: ${g.match_path || g.match_event})`).join('\n') || '  (none)'}

Existing auto-track rules (do not duplicate):
${context.existingRules.map((r: Record<string, unknown>) => `  ${r.name} - ${r.selector} on ${r.trigger}`).join('\n') || '  (none)'}`;

  if (crawlData) {
    prompt += `\n\nHomepage structure:\n${crawlData}`;
  }

  if (description) {
    prompt += `\n\nUser description of the site:\n${description}`;
  }

  return prompt;
}

export default async function aiSuggestRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authMiddleware);
  fastify.addHook('preHandler', verifySiteAccess);

  fastify.post<{ Params: { id: string } }>('/api/sites/:id/ai/suggest', async (request, reply) => {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return reply.status(503).send({
        error: 'AI features require an Anthropic API key. Set ANTHROPIC_API_KEY in your environment.',
      });
    }

    const body = request.body as { description?: string; crawl?: boolean } | null;
    const description = body?.description?.trim();
    const shouldCrawl = body?.crawl !== false;

    // Gather analytics context
    const context = await gatherContext(request.params.id);

    // Optionally crawl the site homepage
    let crawlData: string | null = null;
    if (shouldCrawl) {
      const siteResult = await query('SELECT domain FROM sites WHERE id = $1', [request.params.id]);
      if (siteResult.rows.length > 0) {
        crawlData = await crawlHomepage(siteResult.rows[0].domain);
      }
    }

    // Check if we have enough context
    const hasData = context.pages.length > 0 || context.customEvents.length > 0;
    if (!hasData && !description && !crawlData) {
      return reply.status(400).send({
        error: 'Not enough context to generate suggestions. Either add a site description, enable homepage crawling, or collect some analytics data first.',
      });
    }

    const systemPrompt = buildSystemPrompt(context, crawlData, description);

    const client = new Anthropic({ apiKey });

    try {
      const response = await client.messages.create({
        model: ANTHROPIC_MODEL,
        max_tokens: 4096,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: 'Analyse the site data and suggest useful funnels, goals, and auto-track rules. Use the suggest_analytics_config tool to return your suggestions.',
          },
        ],
        tools: [suggestTool],
        tool_choice: { type: 'tool', name: 'suggest_analytics_config' },
      });

      // Extract the tool use result
      const toolBlock = response.content.find((b) => b.type === 'tool_use');
      if (!toolBlock || toolBlock.type !== 'tool_use') {
        return reply.status(500).send({ error: 'AI did not return structured suggestions.' });
      }

      const suggestions = toolBlock.input as {
        funnels: unknown[];
        goals: unknown[];
        rules: unknown[];
      };

      return {
        funnels: suggestions.funnels || [],
        goals: suggestions.goals || [],
        rules: suggestions.rules || [],
        context: {
          total_pages: context.pages.length,
          total_events: context.totalEvents,
          crawled: crawlData !== null,
        },
      };
    } catch (err: unknown) {
      if (err instanceof Anthropic.RateLimitError) {
        return reply.status(429).send({ error: 'AI rate limit reached. Please try again in a moment.' });
      }
      fastify.log.error(err, 'AI suggest failed');
      return reply.status(500).send({ error: 'Failed to generate suggestions.' });
    }
  });
}

import { FastifyInstance } from 'fastify';
import Anthropic from '@anthropic-ai/sdk';
import { query } from '../db/connection';
import { authMiddleware, verifySiteAccess } from '../middleware/auth';
import { normalizeAndValidateCrawlTarget, resolveAndValidateCrawlHostname } from './crawl-target';

const ANTHROPIC_MODEL = 'claude-sonnet-4-20250514';

const replacesSchema = {
  type: 'object',
  description: 'When action is "replace", identifies the existing item being replaced',
  properties: {
    id: { type: 'string', description: 'UUID of the existing item to replace' },
    name: { type: 'string', description: 'Name of the existing item (for display)' },
  },
  required: ['id', 'name'],
} as const;

const suggestTool: Anthropic.Tool = {
  name: 'suggest_analytics_config',
  description: 'Suggest funnels, goals, and auto-track rules based on the site analytics data and description. Can suggest new items or replacements for existing ones.',
  input_schema: {
    type: 'object' as const,
    properties: {
      funnels: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Unique ID, e.g. funnel_1' },
            description: { type: 'string', description: 'Why this funnel is useful, or what is improved when replacing' },
            action: { type: 'string', enum: ['create', 'replace'], description: 'Whether to create new or replace existing' },
            replaces: replacesSchema,
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
            description: { type: 'string', description: 'Why this goal is useful, or what is improved when replacing' },
            action: { type: 'string', enum: ['create', 'replace'], description: 'Whether to create new or replace existing' },
            replaces: replacesSchema,
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
            description: { type: 'string', description: 'Why this rule is useful, or what is improved when replacing' },
            action: { type: 'string', enum: ['create', 'replace'], description: 'Whether to create new or replace existing' },
            replaces: replacesSchema,
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
    // Existing funnels with full step details
    query(
      `SELECT f.id, f.name, f.description,
              json_agg(json_build_object(
                'position', fs.position,
                'name', fs.name,
                'match_type', fs.match_type,
                'match_path', fs.match_path,
                'match_event', fs.match_event
              ) ORDER BY fs.position) AS steps
       FROM funnels f
       LEFT JOIN funnel_steps fs ON fs.funnel_id = f.id
       WHERE f.site_id = $1
       GROUP BY f.id, f.name, f.description`,
      [siteId]
    ),
    // Existing goals
    query(
      'SELECT id, name, match_type, match_path, match_event FROM goals WHERE site_id = $1',
      [siteId]
    ),
    // Existing auto-track rules
    query(
      'SELECT id, name, event, selector, trigger, capture_text, capture_value FROM auto_track_rules WHERE site_id = $1',
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

// ---------------------------------------------------------------------------
// DOM crawl helpers
// ---------------------------------------------------------------------------

function extractAttributes(attrString: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const regex = /([\w-]+)=["']([^"']*?)["']/g;
  let m;
  while ((m = regex.exec(attrString)) !== null) {
    attrs[m[1]] = m[2];
  }
  return attrs;
}

function buildSelector(tag: string, attrs: Record<string, string>): string {
  if (attrs.id) return `#${attrs.id}`;
  let sel = tag;
  if (attrs.class) {
    // Filter out auto-generated classes (CSS modules, styled-components, etc.)
    const classes = attrs.class.trim().split(/\s+/).filter(c =>
      c.length > 0
      && !/^(css-|_|svelte-|jsx-|sc-|tw-)/i.test(c)
      && !/^[a-f0-9]{6,}$/i.test(c)
    );
    if (classes.length > 0) {
      sel += '.' + classes.slice(0, 3).join('.');
    }
  }
  // Add data attributes for specificity
  for (const [key, val] of Object.entries(attrs)) {
    if (key.startsWith('data-') && !key.startsWith('data-reactid') && !key.startsWith('data-v-') && val) {
      sel += `[${key}="${val}"]`;
      break;
    }
  }
  if (attrs.type && ['submit', 'button'].includes(attrs.type)) {
    sel += `[type="${attrs.type}"]`;
  }
  if (attrs.role === 'button') {
    sel += '[role="button"]';
  }
  return sel;
}

function stripHtmlTags(html: string): string {
  return html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

async function crawlPage(pageUrl: string, path: string): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);

  try {
    const parsedUrl = new URL(pageUrl);
    await resolveAndValidateCrawlHostname(parsedUrl.hostname);

    const res = await fetch(pageUrl, {
      signal: controller.signal,
      headers: { 'User-Agent': 'OpenAnalytics-Bot/1.0' },
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    const html = await res.text();

    const parts: string[] = [];
    parts.push(`=== Page: ${path} ===`);

    // Title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch) parts.push(`Title: ${titleMatch[1].trim()}`);

    // Meta description
    const metaDesc = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i);
    if (metaDesc) parts.push(`Description: ${metaDesc[1].trim()}`);

    // Buttons
    const buttons: string[] = [];
    const buttonRegex = /<button([^>]*)>([\s\S]*?)<\/button>/gi;
    let match;
    while ((match = buttonRegex.exec(html)) !== null && buttons.length < 15) {
      const attrs = extractAttributes(match[1]);
      const text = stripHtmlTags(match[2]).slice(0, 80);
      if (!text || text.length < 2) continue;
      const selector = buildSelector('button', attrs);
      buttons.push(`  - [button] "${text}" | selector: ${selector}`);
    }

    // Input submit / button
    const inputBtnRegex = /<input([^>]*type=["'](submit|button)["'][^>]*)\/?\s*>/gi;
    while ((match = inputBtnRegex.exec(html)) !== null && buttons.length < 20) {
      const attrs = extractAttributes(match[1]);
      const text = attrs.value || 'Submit';
      const selector = buildSelector('input', attrs);
      buttons.push(`  - [input] "${text}" | selector: ${selector}`);
    }

    if (buttons.length > 0) {
      parts.push('\nButtons:');
      parts.push(...buttons);
    }

    // Forms with their inputs
    const forms: string[] = [];
    const formRegex = /<form([^>]*)>([\s\S]*?)<\/form>/gi;
    while ((match = formRegex.exec(html)) !== null && forms.length < 5) {
      const attrs = extractAttributes(match[1]);
      const formHtml = match[2];
      const selector = buildSelector('form', attrs);

      const inputs: string[] = [];
      const inputRegex = /<input([^>]*)>/gi;
      let inputMatch;
      while ((inputMatch = inputRegex.exec(formHtml)) !== null && inputs.length < 8) {
        const inputAttrs = extractAttributes(inputMatch[1]);
        const iType = inputAttrs.type || 'text';
        if (['hidden', 'submit', 'button'].includes(iType)) continue;
        const name = inputAttrs.name || inputAttrs.placeholder || iType;
        inputs.push(`${name} (${iType})`);
      }

      const textareaRegex = /<textarea([^>]*)>/gi;
      while ((inputMatch = textareaRegex.exec(formHtml)) !== null && inputs.length < 10) {
        const taAttrs = extractAttributes(inputMatch[1]);
        inputs.push(`${taAttrs.name || taAttrs.placeholder || 'text'} (textarea)`);
      }

      const selectRegex = /<select([^>]*)>/gi;
      while ((inputMatch = selectRegex.exec(formHtml)) !== null && inputs.length < 10) {
        const selAttrs = extractAttributes(inputMatch[1]);
        inputs.push(`${selAttrs.name || 'select'} (select)`);
      }

      if (inputs.length === 0) continue;
      forms.push(`  - selector: ${selector} | action: ${attrs.action || '(inline)'} | inputs: ${inputs.join(', ')}`);
    }

    if (forms.length > 0) {
      parts.push('\nForms:');
      parts.push(...forms);
    }

    // CTA links (links styled as buttons or with action-oriented classes)
    const ctaLinks: string[] = [];
    const ctaLinkRegex = /<a([^>]*)>([\s\S]*?)<\/a>/gi;
    const seenHrefs = new Set<string>();
    while ((match = ctaLinkRegex.exec(html)) !== null && ctaLinks.length < 10) {
      const attrs = extractAttributes(match[1]);
      const text = stripHtmlTags(match[2]).slice(0, 80);
      const href = attrs.href;
      if (!text || text.length < 2 || !href || href === '#' || href.startsWith('javascript:')) continue;
      if (seenHrefs.has(href)) continue;
      seenHrefs.add(href);

      const isCTA = attrs.class && /btn|button|cta|action|primary|hero/i.test(attrs.class);
      const isRoleButton = attrs.role === 'button';
      if (!isCTA && !isRoleButton) continue;

      const selector = buildSelector('a', attrs);
      ctaLinks.push(`  - [link] "${text}" | selector: ${selector} | href: ${href}`);
    }

    if (ctaLinks.length > 0) {
      parts.push('\nCTA Links:');
      parts.push(...ctaLinks);
    }

    // Internal navigation links (for context)
    const navLinks: string[] = [];
    const allLinkRegex = /<a[^>]+href=["']\/([^"'#]*?)["'][^>]*>([^<]*)<\/a>/gi;
    const seenPaths = new Set<string>();
    while ((match = allLinkRegex.exec(html)) !== null && navLinks.length < 15) {
      const linkPath = '/' + match[1].split('?')[0];
      const linkText = match[2].trim();
      if (linkPath.length <= 1 || seenPaths.has(linkPath)) continue;
      seenPaths.add(linkPath);
      if (linkText) {
        navLinks.push(`  - ${linkText} -> ${linkPath}`);
      }
    }

    if (navLinks.length > 0) {
      parts.push('\nInternal links:');
      parts.push(...navLinks);
    }

    return parts.join('\n');
  } catch {
    clearTimeout(timer);
    return null;
  }
}

async function crawlSitePages(domain: string, topPaths: string[]): Promise<string | null> {
  const target = normalizeAndValidateCrawlTarget(domain);

  // Always include homepage, then top visited pages
  const pathsToCheck = ['/', ...topPaths.filter(p => p !== '/')].slice(0, 5);

  const results = await Promise.allSettled(
    pathsToCheck.map(path => {
      const fullUrl = new URL(path, target).toString();
      return crawlPage(fullUrl, path);
    })
  );

  const pages = results
    .map(r => r.status === 'fulfilled' ? r.value : null)
    .filter((r): r is string => r !== null);

  if (pages.length === 0) return null;
  return pages.join('\n\n');
}

function buildSystemPrompt(context: Awaited<ReturnType<typeof gatherContext>>, crawlData: string | null, description?: string): string {
  let prompt = `You are an analytics setup assistant for a web analytics platform called OpenAnalytics.
Based on the site's actual data and context, suggest useful funnels, goals, and auto-track rules.

CRITICAL DATA RULES:
- For FUNNELS: each step MUST use either a page path from "Top pages" (match_type: "pageview") or an event name from "Custom events tracked" (match_type: "event"). NEVER invent, assume, or fabricate event names or page paths that do not appear in the data. If no custom events exist, build funnels using pageview steps only.
- For GOALS: the match_path MUST come from "Top pages" or the match_event MUST come from "Custom events tracked". NEVER suggest goals for events that are not being tracked.
- For AUTO-TRACK RULES: use the actual CSS selectors from the "Website page analysis" section below. These are real interactive elements on the website. For each rule, include a description explaining what the element does and why tracking it is valuable. Prefer id-based or data-attribute selectors over class-based ones.
- If there is not enough data to make good suggestions, return empty arrays rather than guessing.

General guidelines:
- Funnels need at least 2 steps, each step uses match_type "pageview" (with match_path) or "event" (with match_event)
- Goals track a single conversion event - either a pageview of a specific path or a custom event
- Use timeout_ms of 1800000 (30 minutes) for funnel steps unless a shorter window makes sense
- Keep names concise and descriptive
- Provide a brief, helpful description for each suggestion explaining why it is useful and what the user will learn from it
- You may suggest REPLACEMENTS for existing items when a better version is possible (e.g. a more granular funnel). Set action to "replace" and provide the replaces field with the existing item's id and name. When replacing, explain in the description what is being improved.
- Do not suggest items identical to existing ones. Only suggest replacements when meaningfully different.

Site data from the last 30 days:

Top pages:
${context.pages.map((p: Record<string, unknown>) => `  ${p.path} - ${p.views} views, ${p.visitors} visitors`).join('\n') || '  (no pageview data)'}

Page flows (from -> to, transitions):
${context.flows.map((f: Record<string, unknown>) => `  ${f.from_page} -> ${f.to_page} (${f.transitions})`).join('\n') || '  (no flow data)'}

Custom events tracked:
${context.customEvents.map((e: Record<string, unknown>) => `  ${e.event} - ${e.occurrences} occurrences`).join('\n') || '  (no custom events)'}

Top referrers:
${context.referrers.map((r: Record<string, unknown>) => `  ${r.referrer} - ${r.sessions} sessions`).join('\n') || '  (no referrer data)'}

Existing funnels (can be replaced with action "replace" and replaces.id set to the funnel id):
${context.existingFunnels.map((f: Record<string, unknown>) => {
    const steps = (f.steps as Array<Record<string, unknown>>).map(
      (s) => `    Step ${s.position}: ${s.name} (${s.match_type}: ${s.match_path || s.match_event || 'n/a'})`
    ).join('\n');
    return `  [id: ${f.id}] ${f.name}${f.description ? ` - ${f.description}` : ''}\n${steps}`;
  }).join('\n') || '  (none)'}

Existing goals (can be replaced with action "replace" and replaces.id set to the goal id):
${context.existingGoals.map((g: Record<string, unknown>) => `  [id: ${g.id}] ${g.name} (${g.match_type}: ${g.match_path || g.match_event})`).join('\n') || '  (none)'}

Existing auto-track rules (can be replaced with action "replace" and replaces.id set to the rule id):
${context.existingRules.map((r: Record<string, unknown>) => `  [id: ${r.id}] ${r.name} - event: ${r.event}, selector: ${r.selector}, trigger: ${r.trigger}, capture_text: ${r.capture_text}, capture_value: ${r.capture_value}`).join('\n') || '  (none)'}`;

  if (crawlData) {
    prompt += `\n\nWebsite page analysis (interactive elements with CSS selectors - use these for auto-track rules):\n${crawlData}`;
  }

  if (description) {
    prompt += `\n\nUser description of the site:\n${description}`;
  }

  return prompt;
}

const AI_QUERY_LIMIT = 10;

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

    // Check AI usage limit
    const userId = request.user!.id;
    const usageResult = await query('SELECT ai_queries_used FROM users WHERE id = $1', [userId]);
    const used = usageResult.rows[0]?.ai_queries_used ?? 0;
    if (used >= AI_QUERY_LIMIT) {
      return reply.status(429).send({
        error: 'ai_limit_reached',
        message: `You have reached the limit of ${AI_QUERY_LIMIT} AI queries. Contact us if you need more.`,
        used,
        limit: AI_QUERY_LIMIT,
      });
    }

    const body = request.body as { description?: string; crawl?: boolean } | null;
    const description = body?.description?.trim();
    const shouldCrawl = body?.crawl !== false;

    // Gather analytics context
    const context = await gatherContext(request.params.id);

    // Optionally crawl the site's top pages
    let crawlData: string | null = null;
    if (shouldCrawl) {
      const siteResult = await query('SELECT domain FROM sites WHERE id = $1', [request.params.id]);
      if (siteResult.rows.length > 0) {
        const topPaths = context.pages.map((p: Record<string, unknown>) => p.path as string);
        crawlData = await crawlSitePages(siteResult.rows[0].domain, topPaths);
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

      // Increment usage counter only on success
      await query('UPDATE users SET ai_queries_used = ai_queries_used + 1 WHERE id = $1', [userId]);

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
      if (err instanceof Anthropic.BadRequestError) {
        fastify.log.error(err, 'AI suggest failed - bad request from Anthropic');
        const msg = (err.error as { error?: { message?: string } })?.error?.message;
        return reply.status(502).send({
          error: msg && msg.includes('credit balance')
            ? 'Anthropic API credit balance is too low. Please top up your credits.'
            : 'AI request failed. Please check your Anthropic API key and account.',
        });
      }
      if (err instanceof Anthropic.AuthenticationError) {
        return reply.status(502).send({ error: 'Anthropic API key is invalid. Please check your ANTHROPIC_API_KEY.' });
      }
      fastify.log.error(err, 'AI suggest failed');
      return reply.status(500).send({ error: 'Failed to generate suggestions.' });
    }
  });
}

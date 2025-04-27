import asyncio
import tempfile
import os
import shutil
import gzip
import re
import json
import logging
import time
from typing import List, Dict, Any
from git import Repo
from dotenv import load_dotenv
from pydantic import ValidationError
from google import genai
from google.genai import types
from schemas import BaseIssue, EnrichedIssue
from PIL import Image
import esprima
from radon.complexity import cc_visit


# Configure logging
# set to DEBUG to capture file-level logs
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Load environment and configure Gemini
load_dotenv()
client = genai.Client(api_key=os.getenv('GEMINI_API_KEY'))

# File extensions and domains
IMAGE_EXTS = ('.png', '.jpg', '.jpeg', '.gif', '.webp', '.avif', '.svg')
CODE_EXTS = ('.js', '.jsx', '.ts', '.tsx', '.css', '.html')
MODERN_IMAGE_EXTS = ('.webp', '.avif')
THIRD_PARTY_DOMAINS = [
    'googleapis.com', 'gstatic.com', 'facebook.net',
    'analytics.com', 'hotjar.com'
]

# Impact weights for sorting (static guidelines)
IMPACT_WEIGHTS = {
    'Use efficient image formats': 3,
    'Optimize image dimensions': 3,
    'Lazy-load offscreen images': 2,
    'Remove unused CSS': 2,
    'Remove unused JavaScript': 2,
    'Enable text compression': 2,
    'Use HTTP caching': 2,
    'Preload critical assets': 2,
    'Defer non-critical CSS': 2,
    'Defer non-critical JavaScript': 2,
    'Use responsive images': 2,
    'Use modern image formats': 3,
}

# All guidelines
GUIDELINES = [
    'Use efficient image formats', 'Optimize image dimensions',
    'Lazy-load offscreen images',
    'Remove unused CSS', 'Remove unused JavaScript',
    'Enable text compression', 'Use HTTP caching', 'Preload critical assets',
    'Defer non-critical CSS', 'Defer non-critical JavaScript',
    'Use responsive images', 'Use modern image formats',
    'Reduce server response times', 'Enable GZIP compression',
    'Use a CDN for static assets', 'Limit third-party scripts',
    'Preconnect to required origins', 'Reduce DOM size',
    'Avoid synchronous layouts', 'Use efficient CSS selectors',
    'Avoid long tasks', 'Use web workers for expensive tasks'
]

# Split guidelines
STATIC_GUIDELINES = list(IMPACT_WEIGHTS.keys())
LLM_GUIDELINES = [g for g in GUIDELINES if g not in STATIC_GUIDELINES]


def clone_repo(repo_url: str) -> str:
    """Clone the repository to a temp directory and return its path."""
    logger.info('Cloning repository: %s', repo_url)
    tmpdir = tempfile.mkdtemp()
    Repo.clone_from(repo_url, tmpdir)
    return tmpdir


# JSON cleanup helper


def cleanup_json_text(text: str) -> str:
    try:
        start, end = text.find('['), text.rfind(']')
        text = text[start:end+1]
    except Exception:
        pass
    text = re.sub(r"\bNone\b", 'null', text)
    text = re.sub(r"\bTrue\b", 'true', text)
    text = re.sub(r"\bFalse\b", 'false', text)
    text = re.sub(r',\s*}', '}', text)
    text = re.sub(r',\s*]', ']', text)
    return text

# Single Gemini call


def call_gemini(prompt: str, retries: int = 2) -> Any:
    for i in range(retries):
        resp = client.models.generate_content(
            model='gemini-2.5-flash-preview-04-17',
            contents=prompt,
            config=types.GenerateContentConfig(temperature=0.1)
        )
        text = resp.text
        logger.debug('Gemini response: %s', text)
        try:
            return json.loads(cleanup_json_text(text))
        except json.JSONDecodeError as e:
            logger.warning('Invalid JSON on attempt %d: %s', i+1, e)
            if i < retries - 1:
                prompt += '\nReminder: Return valid JSON only.'
                continue
            return None
    return None
# Compute metrics


def compute_metrics(root_dir: str) -> Dict[str, Any]:
    logger.info('Computing metrics in %s', root_dir)
    metrics = {
        'total_bytes': 0, 'image_bytes': 0,
        'js_bytes': 0, 'code_bytes': 0,
        'third_party_requests': 0, 'uncompressed_assets': []
    }
    for dirpath, _, files in os.walk(root_dir):
        for f in files:
            path = os.path.join(dirpath, f)
            logger.debug('Analyzing file for metrics: %s', path)
            ext = os.path.splitext(f)[1].lower()
            try:
                raw = open(path, 'rb').read()
                size = len(gzip.compress(raw))
            except Exception:
                size = os.path.getsize(path)
            metrics['total_bytes'] += size
            if ext in IMAGE_EXTS:
                metrics['image_bytes'] += size
            if ext in ('.js', '.css'):
                metrics['js_bytes'] += size
            if ext in CODE_EXTS:
                metrics['code_bytes'] += size
            if ext in ('.js', '.css') and size > 1024:
                metrics['uncompressed_assets'].append(
                    os.path.relpath(path, root_dir))
            if any(domain in path for domain in THIRD_PARTY_DOMAINS):
                metrics['third_party_requests'] += 1
    logger.info('Metrics computed: %s', metrics)
    return metrics

# Static guidelines checks


def check_guidelines_static(root_dir: str) -> List[Dict[str, Any]]:
    logger.info('Running static checks in %s', root_dir)
    issues = []
    html_files = []
    css_files = []
    js_files = []
    image_files = []
    all_js_code = ""  # For code splitting detection

    # File collection and basic processing
    for dirpath, dirs, files in os.walk(root_dir):
        dirs[:] = [d for d in dirs if d not in ('.git', 'node_modules')]
        for f in files:
            path = os.path.join(dirpath, f)
            rel_path = os.path.relpath(path, root_dir)
            ext = os.path.splitext(f)[1].lower()

            try:
                with open(path, 'r', encoding='utf-8', errors='ignore') as file:
                    content = file.read()

                    if ext in IMAGE_EXTS:
                        image_files.append((path, rel_path))
                    elif ext == '.html':
                        html_files.append((rel_path, content))
                    elif ext == '.css':
                        css_files.append((rel_path, content))
                    elif ext in ('.js', '.jsx', '.ts', '.tsx'):
                        js_files.append((rel_path, content))
                        all_js_code += content + "\n"
                    elif ext == '.py':
                        # Python complexity analysis
                        try:
                            for block in cc_visit(content):
                                if block.complexity > 10:
                                    issues.append({
                                        'type': 'HighComplexity',
                                        'file': rel_path,
                                        'severity': 'High',
                                        'weight': 3
                                    })
                                    break
                        except Exception as e:
                            logger.warning(
                                f"Complexity analysis failed for {rel_path}: {str(e)}")

            except Exception as e:
                logger.warning(f"Failed to process {rel_path}: {str(e)}")

    # Image optimization checks
    try:
        from PIL import Image
        for path, rel_path in image_files:
            ext = os.path.splitext(path)[1].lower()

            if ext not in MODERN_IMAGE_EXTS:
                issues.append({
                    'type': 'LegacyImageFormat',
                    'file': rel_path,
                    'severity': 'High',
                    'weight': 3
                })

            try:
                with Image.open(path) as img:
                    w, h = img.size
                    if w * h > 1_000_000:
                        issues.append({
                            'type': 'OversizedImage',
                            'file': rel_path,
                            'severity': 'Medium',
                            'weight': 2
                        })
            except Exception as e:
                logger.warning(
                    f"Image analysis failed for {rel_path}: {str(e)}")
    except ImportError:
        logger.warning("Pillow not installed, skipping image checks")

    # JavaScript/TypeScript deep analysis
    for rel_path, content in js_files:
        # AST-based nested loop detection
        try:
            ast = esprima.parseScript(content, tolerant=True)

            class LoopVisitor(esprima.NodeVisitor):
                def __init__(self):
                    self.loop_depth = 0
                    self.has_nested = False

                def enter_ForStatement(self, node):
                    self.loop_depth += 1
                    if self.loop_depth > 1:
                        self.has_nested = True

                def enter_WhileStatement(self, node):
                    self.loop_depth += 1
                    if self.loop_depth > 1:
                        self.has_nested = True

                def leave_ForStatement(self, node):
                    self.loop_depth -= 1

                def leave_WhileStatement(self, node):
                    self.loop_depth -= 1

            visitor = LoopVisitor()
            visitor.visit(ast)

            if visitor.has_nested:
                issues.append({
                    'type': 'NestedLoop',
                    'file': rel_path,
                    'severity': 'High',
                    'weight': 3
                })

        except Exception as e:
            logger.warning(f"AST analysis failed for {rel_path}: {str(e)}")

        # Code splitting detection
        if not re.search(r"\bimport\(\s*['\"]", content):
            issues.append({
                'type': 'NoCodeSplitting',
                'file': rel_path,
                'severity': 'Medium',
                'weight': 2
            })

    # HTML/JSX optimization checks
    all_html = ' '.join(content for _, content in html_files)
    for rel_path, content in html_files:
        # Lazy-load and responsive images
        if '<img' in content:
            if 'loading="lazy"' not in content:
                issues.append({
                    'type': 'MissingLazyLoading',
                    'file': rel_path,
                    'severity': 'Medium',
                    'weight': 2
                })
            if 'srcset=' not in content:
                issues.append({
                    'type': 'NonResponsiveImage',
                    'file': rel_path,
                    'severity': 'Medium',
                    'weight': 2
                })

        # HTTP caching
        if not re.search(r'<meta[^>]+http-equiv=["\']Cache-Control["\']', content):
            issues.append({
                'type': 'MissingCachePolicy',
                'file': rel_path,
                'severity': 'High',
                'weight': 3
            })

    # CSS optimization
    for rel_path, content in css_files:
        # Unused CSS detection
        selectors = re.findall(r'\.([\w-]+)', content)
        unused = [s for s in selectors if s not in all_html]
        if len(unused) > len(selectors) * 0.2:  # 20% unused threshold
            issues.append({
                'type': 'UnusedCSS',
                'file': rel_path,
                'severity': 'Medium',
                'weight': 2
            })

    # JavaScript optimization
    for rel_path, content in js_files:
        # Unused JS detection
        if 'export ' in content and not re.search(r'import.*from.*[\'"]\./', content):
            issues.append({
                'type': 'UnusedJavaScript',
                'file': rel_path,
                'severity': 'Medium',
                'weight': 2
            })

        # Text compression check
        if len(content) > 1024:
            compressed = gzip.compress(content.encode())
            ratio = len(compressed) / len(content)
            if ratio > 0.7:
                issues.append({
                    'type': 'UncompressedJS',
                    'file': rel_path,
                    'severity': 'Low',
                    'weight': 1
                })

    # Global checks
    if not re.search(r'<link[^>]+rel=["\']preload["\']', all_html):
        issues.append({
            'type': 'MissingPreload',
            'file': 'global',
            'severity': 'Medium',
            'weight': 2
        })

    logger.info('Static checks found %d issues', len(issues))
    return issues

# Batched LLM checks


def check_guidelines_llm_batched(root_dir: str) -> List[Dict[str, Any]]:
    logger.info('Running batched LLM checks in %s', root_dir)
    file_samples = []

    # Collect first 5 code files with context
    for dirpath, _, files in os.walk(root_dir):
        for f in files[:5]:  # Limit to avoid token overflow
            path = os.path.join(dirpath, f)
            ext = os.path.splitext(f)[1].lower()
            if ext not in CODE_EXTS:
                continue
            try:
                with open(path, 'r', encoding='utf-8', errors='ignore') as cf:
                    content = cf.read(2000)  # First 2000 characters
                    file_samples.append({
                        'path': os.path.relpath(path, root_dir),
                        'content': content
                    })
            except Exception:
                continue

    # Structured prompt with file context
    prompt = (
        "You are a web performance auditor, highly specialized in sustainable web developmet. Analyze these code files for energy efficiency issues:\n\n" +
        "\n\n".join([f"// File: {f['path']}\n{f['content']}" for f in file_samples]) +
        "\n\nCheck against these guidelines:\n- " +
        "\n- ".join(LLM_GUIDELINES) +
        "Respond ONLY with a JSON array: [ { 'type': string, 'compliant': boolean, 'explanation': string } ]"
    )
    resp = call_gemini(prompt)
    results = []
    if isinstance(resp, list):
        for r in resp:
            if not r.get('compliant', True):
                logger.info('LLM reported non-compliance: %s', r['type'])
                results.append({'type': r['type'], 'file': None})
    logger.info('LLM checks found %d issues', len(results))
    return results

def keep_alive():
    """Yield a keep-alive message every 10 seconds."""
    last_message_time = time.time()
    while True:
        current_time = time.time()
        if current_time - last_message_time >= 10:
            last_message_time = current_time
            yield "🔋 Analysis in progress..."
        else:
            yield None

def enrich_all_issues(issues: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    logger.info('Enriching %d issues via LLM', len(issues))
    if not issues:
        return []
    
    # Initialize keep-alive
    keep_alive_gen = keep_alive()
    start_time = time.time()
    
    try:
        validated = [BaseIssue(type=i['type'], file=i.get(
            'file')).model_dump() for i in issues]
    except ValidationError:
        logger.error('Issue validation failed; returning raw issues')
        return issues

    prompt = (
        "You are a web performance auditor, highly specialized in sustainable web developmet. For each issue, provide sustainability context:\n"
        "1. For code issues (NestedLoop, HighComplexity): Explain CPU impact\n"
        "2. For images: Explain data transfer costs\n"
        "3. For accessibility: Explain indirect energy impacts\n\n"
        "Issues:\n" + json.dumps(validated, indent=2) +
        "\n\nReturn ONLY JSON array with:  type, file, severity, impact, solution (technical specifics)"
    )

    resp = call_gemini(prompt)
    gemini_map = {(g['type'], g.get('file')): g for g in (
        resp if isinstance(resp, list) else [])}
    enriched = []
    
    for idx, base in enumerate(validated):
        # Send keep-alive message every 10 seconds
        if msg := next(keep_alive_gen):
            logger.info(msg)
            # If using async context, you'd yield here
            # For sync context, we'll just log and track time
            
        key = (base['type'], base.get('file'))
        meta = gemini_map.get(key, {})
        issue = {
            'type': base['type'], 
            'file': base.get('file'),
            'severity': meta.get('severity', 'Medium'),
            'impact': meta.get('impact', 'Contributes to energy consumption'),
            'solution': meta.get('solution', 'Refer to guidelines'),
            'weight': IMPACT_WEIGHTS.get(base['type'], 1)
        }
        logger.info('Enriched issue: %s => severity=%s',
                    issue['type'], issue['severity'])
        try:
            enriched.append(EnrichedIssue(**issue).model_dump())
        except ValidationError:
            enriched.append(issue)
            
        # Manual timeout after 45 seconds
        if time.time() - start_time > 45:
            logger.warning("Enrichment timed out after 45 seconds")
            break
            
    logger.info('Enrichment completed: %d issues', len(enriched))
    return enriched


async def parse(repo_path: str):
    base_dir = repo_path

    try:
        # Yield metrics progress
        yield {"type": "progress", "message": "📊 Calculating repository metrics..."}
        metrics = await asyncio.to_thread(compute_metrics, base_dir)
        yield {"type": "metrics", "data": metrics}

        # Yield static analysis progress
        yield {"type": "progress", "message": "🔍 Running static analysis..."}
        static_issues = await asyncio.to_thread(check_guidelines_static, base_dir)
        for issue in static_issues:
            yield {"type": "issue", "data": issue}

        # Yield LLM analysis progress
        yield {"type": "progress", "message": "🧠 Analyzing with AI..."}
        llm_issues = await asyncio.to_thread(check_guidelines_llm_batched, base_dir)
        for issue in llm_issues:
            yield {"type": "issue", "data": issue}

        all_issues = static_issues + llm_issues
        yield {"type": "progress", "message": "✨ Enriching findings..."}
        
        last_keep_alive = time.time()
        enriched_issues = []
        
        # Process in chunks
        chunk_size = 5
        for i in range(0, len(all_issues), chunk_size):
            chunk = all_issues[i:i+chunk_size]
            enriched_chunk = await asyncio.to_thread(
                enrich_all_issues, chunk
            )
            enriched_issues.extend(enriched_chunk)
            
            # Yield intermediate progress
            if time.time() - last_keep_alive >= 10:
                yield {"type": "progress", "message": "🔋 Analysis in progress..."}
                last_keep_alive = time.time()


        # Sort and yield final results
        sorted_issues = sorted(
            enriched_issues,
            key=lambda x: (-x.get('weight', 0), x.get('severity', 'Medium'))
        )
        yield {"type": "result", "metrics": metrics, "issues": sorted_issues}
    except Exception as e:
        logger.error(f"Error during analysis: {str(e)}")
        yield {"type": "error", "message": f"Analysis failed: {str(e)}"}
        raise

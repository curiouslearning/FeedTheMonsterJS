const ASSESSMENT_ASSET_DIRECTORY = 'assessment-survey';

function normalizeAppBasePath(pathname: string): string {
  const normalizedPathname = (pathname || '/').trim() || '/';

  if (normalizedPathname === '/') {
    return '/';
  }

  if (normalizedPathname.endsWith('/')) {
    return normalizedPathname;
  }

  if (/\.[a-z0-9]+$/i.test(normalizedPathname)) {
    return normalizedPathname.replace(/[^/]*$/, '');
  }

  return `${normalizedPathname}/`;
}

function joinPath(basePath: string, relativePath: string): string {
  const normalizedBasePath = basePath === '/' ? '' : basePath.replace(/\/+$/, '');
  const normalizedRelativePath = relativePath.replace(/^\/+/, '');
  return `${normalizedBasePath}/${normalizedRelativePath}`;
}

export function getAssessmentBasePath(pathname: string = window.location.pathname): string {
  return joinPath(normalizeAppBasePath(pathname), ASSESSMENT_ASSET_DIRECTORY);
}

export function buildAssessmentAssetPath(
  relativePath: string,
  pathname: string = window.location.pathname
): string {
  return joinPath(getAssessmentBasePath(pathname), relativePath);
}